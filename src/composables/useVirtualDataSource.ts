import { getCurrentScope, isRef, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue';

/** 布局数据只约定稳定键，不把文件路径、业务属性或索引当作实体身份。 */
export interface DataItem {
    id: string | number;
    index?: number;
}

export interface Placeholder {
    id: string;
    isPlaceholder: true;
    index: number;
}

/** 返回项必须带请求的 index；signal 随数据源替换或卸载取消。 */
export type DataFetcher<T extends DataItem = DataItem> = (
    indices: number[], signal: AbortSignal
) => Promise<T[]>;

export interface UseVirtualDataSourceOptions<T extends DataItem = DataItem> {
    totalCount: Readonly<Ref<number>>;
    dataFetcher: DataFetcher<T> | Readonly<Ref<DataFetcher<T>>>;
    /** 同样的数量也可能代表另一条查询；显式的源键负责区分两者。 */
    sourceKey?: Readonly<Ref<string | number | undefined>>;
    initialPageSize?: number;
    requestBatchSize?: number;
    createPlaceholder?: (index: number) => Placeholder;
}

interface PendingItem<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
}

function integer(value: number, name: string, minimum = 0): number {
    if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(`${name} 必须是 >= ${minimum} 的整数`);
    return value;
}

function validId(id: unknown): id is string | number {
    return typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));
}

/**
 * 已知数量、按索引读取的数据策略。流式追加是独立策略，不应靠不断修改
 * totalCount 来重置本策略。增长仅扩展占位，缩减仅裁掉尾部；新查询显式 reset。
 *
 * 同一索引只有一个 pending Promise。忙时合并后续需求，当前批完成后继续，
 * 不再返回空数组丢掉需求。取消/失败会拒绝调用者，并允许后续显式重试。
 */
export function useVirtualDataSource<T extends DataItem = DataItem>({
    totalCount, dataFetcher, sourceKey, initialPageSize = 50, requestBatchSize = 64,
    createPlaceholder = index => ({ id: `placeholder-${index}`, isPlaceholder: true, index }),
}: UseVirtualDataSourceOptions<T>) {
    integer(initialPageSize, 'initialPageSize');
    integer(requestBatchSize, 'requestBatchSize', 1);
    const items = shallowRef<Array<T | Placeholder>>([]);
    const isFetching = ref(false);
    const error = shallowRef<unknown | null>(null);
    const loaded = new Map<number, T>();
    const ids = new Map<string | number, number>();
    const pending = new Map<number, PendingItem<T>>();
    const queued = new Set<number>();
    let active: AbortController | undefined;
    let generation = 0;
    let disposed = false;
    let draining: Promise<void> | undefined;
    const getFetcher = (): DataFetcher<T> => isRef(dataFetcher) ? dataFetcher.value : dataFetcher;

    function cancel(reason: string): void {
        generation++;
        active?.abort();
        active = undefined;
        const failure = new DOMException(reason, 'AbortError');
        for (const task of pending.values()) task.reject(failure);
        pending.clear();
        queued.clear();
        // 旧批可能还在第三方 dataFetcher 内部；用 generation 隔离其结果，不能等它退完才允许新源工作。
        draining = undefined;
        isFetching.value = false;
    }

    function resize(count: number): void {
        integer(count, 'totalCount');
        if (count === items.value.length) return;
        const resized = items.value.slice(0, count);
        if (count < items.value.length) {
            cancel('数据源范围已缩减');
            for (const [index, item] of loaded) {
                if (index >= count) { loaded.delete(index); ids.delete(item.id); }
            }
        } else {
            for (let index = items.value.length; index < count; index++) {
                const placeholder = createPlaceholder(index);
                if (placeholder.isPlaceholder !== true || placeholder.index !== index || typeof placeholder.id !== 'string') {
                    throw new TypeError('createPlaceholder 必须返回对应索引的占位项');
                }
                resized.push(placeholder);
            }
        }
        items.value = resized;
    }

    function reset(): void {
        cancel('数据源已替换');
        loaded.clear();
        ids.clear();
        error.value = null;
        items.value = [];
        resize(totalCount.value);
    }

    async function drain(epoch: number): Promise<void> {
        while (!disposed && epoch === generation && queued.size) {
            const indices = Array.from(queued).slice(0, requestBatchSize);
            for (const index of indices) queued.delete(index);
            const controller = new AbortController();
            active = controller;
            const tasks = indices.map(index => pending.get(index));
            try {
                const fetched = await getFetcher()(indices, controller.signal);
                if (disposed || epoch !== generation) return;
                const requested = new Set(indices);
                const byIndex = new Map<number, T>();
                const batchIds = new Map<string | number, number>();
                // 整批检查完成再发布，不能写到一半才发现重复 ID 或缺项。
                for (const item of fetched) {
                    if (!item || !validId(item.id) || !Number.isSafeInteger(item.index) || !requested.has(item.index)) {
                        throw new TypeError('dataFetcher 返回了无效身份或非请求索引');
                    }
                    if (byIndex.has(item.index)) throw new Error(`dataFetcher 重复返回索引 ${item.index}`);
                    const existingIndex = ids.get(item.id) ?? batchIds.get(item.id);
                    if (existingIndex !== undefined && existingIndex !== item.index) {
                        throw new Error(`dataFetcher 在不同索引返回重复 ID: ${item.id}`);
                    }
                    byIndex.set(item.index, item);
                    batchIds.set(item.id, item.index);
                }
                if (byIndex.size !== indices.length) throw new Error('dataFetcher 没有返回全部请求项');
                // 索引模式保持数组快照兼容现有 Grid；追加流使用独立的增量通知，不走全量快照。
                const updated = items.value.slice();
                for (const [index, item] of byIndex) {
                    loaded.set(index, item);
                    ids.set(item.id, index);
                    updated[index] = item;
                    pending.get(index)?.resolve(item);
                    pending.delete(index);
                }
                error.value = null;
                items.value = updated;
            } catch (failure) {
                if (epoch !== generation || disposed) return;
                error.value = failure;
                for (let i = 0; i < indices.length; i++) {
                    tasks[i]?.reject(failure);
                    pending.delete(indices[i]);
                }
            } finally {
                if (active === controller) active = undefined;
            }
        }
    }

    function start(): void {
        if (draining || disposed || !queued.size) return;
        const epoch = generation;
        isFetching.value = true;
        const task = Promise.resolve().then(() => drain(epoch));
        draining = task;
        void task.finally(() => {
            if (draining !== task) return;
            draining = undefined;
            isFetching.value = false;
            if (queued.size) start();
        });
    }

    async function requestDataForRange(indices: number[]): Promise<T[]> {
        if (disposed) throw new DOMException('数据源已卸载', 'AbortError');
        const unique = [...new Set(indices)];
        for (const index of unique) {
            integer(index, 'index');
            if (index >= items.value.length) throw new RangeError(`请求索引 ${index} 超出数据源范围`);
        }
        const requests = unique.map(index => {
            const item = loaded.get(index);
            if (item) return Promise.resolve(item);
            let task = pending.get(index);
            if (!task) {
                let resolve: (value: T) => void;
                let reject: (reason: unknown) => void;
                const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
                task = { promise, resolve, reject };
                pending.set(index, task);
                queued.add(index);
            }
            return task.promise;
        });
        start();
        return Promise.all(requests);
    }

    let previousFetcher = getFetcher();
    let previousKey = sourceKey?.value;
    const stop = watch([totalCount, getFetcher, () => sourceKey?.value], () => {
        const fetcher = getFetcher();
        const key = sourceKey?.value;
        if (fetcher !== previousFetcher || key !== previousKey) reset();
        else resize(totalCount.value);
        previousFetcher = fetcher;
        previousKey = key;
        const count = Math.min(initialPageSize, items.value.length);
        if (count) {
            // error ref 是初始化失败的公开状态；不把失败伪装成成功的空数据。
            void requestDataForRange(Array.from({ length: count }, (_, index) => index)).catch(() => {});
        }
    }, { immediate: true });

    function dispose(): void {
        if (disposed) return;
        disposed = true;
        stop();
        cancel('数据源已卸载');
    }
    if (getCurrentScope()) onScopeDispose(dispose);
    return { items, isFetching, error, requestDataForRange, reset, dispose };
}
