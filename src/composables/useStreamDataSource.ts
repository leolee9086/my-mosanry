import { getCurrentScope, onScopeDispose, shallowRef, watch, type Ref } from 'vue';
import type { DataItem } from './useVirtualDataSource';
import type { LayoutViewport } from './layout-engines/types';
import type { StreamDataSource, StreamSnapshot } from './streamDataSource';

/** 把接收缓存按视口需求送给现有布局引擎；不计算任何卡片坐标。 */
export function useStreamDataSource<T extends DataItem>(
    source: Readonly<Ref<StreamDataSource<T> | undefined>>,
    options: { batchSize?: number; aheadViewports?: number } = {},
) {
    const batchSize = options.batchSize ?? 32;
    const aheadViewports = options.aheadViewports ?? 3;
    if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new RangeError('batchSize 必须是正整数');
    if (!Number.isFinite(aheadViewports) || aheadViewports < 1) throw new RangeError('aheadViewports 必须 >= 1');
    const items = shallowRef<T[]>([]);
    const snapshot = shallowRef<StreamSnapshot>({ generation: 0, count: 0, status: 'complete', error: null });
    const viewport = shallowRef<LayoutViewport>();
    let frame: number | undefined;
    let generation = -1;
    let stopSource: (() => void) | undefined;
    let disposed = false;

    function cancelFrame(): void {
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = undefined;
    }
    function schedule(): void {
        if (disposed || frame !== undefined || !source.value || !viewport.value) return;
        frame = requestAnimationFrame(consume);
    }
    function consume(): void {
        frame = undefined;
        const current = source.value;
        const view = viewport.value;
        if (!current || !view || view.width <= 0 || view.height <= 0) return;
        // 等这一批真正布局完成再判断覆盖范围，避免连续盲目投喂。
        if (view.laidOutCount !== items.value.length) return;
        if (view.coveredHeight >= view.scrollTop + view.height * aheadViewports) return;
        const end = Math.min(current.snapshot.count, items.value.length + batchSize);
        if (end <= items.value.length) return;
        const batch: T[] = [];
        for (let index = items.value.length; index < end; index++) {
            const item = current.at(index);
            if (item === undefined) throw new Error(`流式数据源缺少已声明的索引 ${index}`);
            batch.push(item);
        }
        // 此处只发布已消费的前缀；未浏览的记录留在普通缓存中，不建立占位和布局。
        items.value = items.value.concat(batch);
    }
    function updateViewport(value: LayoutViewport): void {
        viewport.value = value;
        schedule();
    }
    function receive(value: StreamSnapshot): void {
        if (generation !== value.generation) {
            cancelFrame();
            generation = value.generation;
            viewport.value = undefined;
            items.value = [];
        }
        snapshot.value = value;
        schedule();
    }
    const stop = watch(source, current => {
        stopSource?.();
        cancelFrame();
        generation = -1;
        items.value = [];
        viewport.value = undefined;
        if (current) {
            stopSource = current.subscribe(receive);
            receive(current.snapshot);
        } else {
            stopSource = undefined;
            snapshot.value = { generation: 0, count: 0, status: 'complete', error: null };
        }
    }, { immediate: true, flush: 'sync' });
    function dispose(): void {
        if (disposed) return;
        disposed = true;
        cancelFrame();
        stopSource?.();
        stop();
    }
    if (getCurrentScope()) onScopeDispose(dispose);
    return { items, snapshot, updateViewport, dispose };
}
