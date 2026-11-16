import type { DataItem } from './useVirtualDataSource';

export interface StreamSnapshot {
    readonly generation: number;
    readonly count: number;
    readonly status: 'receiving' | 'complete' | 'error';
    readonly error: unknown | null;
}

/** 只读消费契约：布局库按索引读缓存，不能反过来控制具体业务请求。 */
export interface StreamDataSource<T extends DataItem = DataItem> {
    readonly snapshot: StreamSnapshot;
    at(index: number): T | undefined;
    subscribe(listener: (snapshot: StreamSnapshot) => void): () => void;
}

export interface StreamWriter<T> {
    /** 同一查询内追加；重复 ID 是数据错误，不能静默丢弃。 */
    append(items: readonly T[]): void;
    complete(): void;
    fail(error: unknown): void;
}

/**
 * 普通数组保存接收记录，不创建整批深响应对象或预生成全部占位符。
 * begin 返回绑定查询代际的写入口，旧流即使没有及时停止也不能写入新查询。
 * HTTP 解码/取消属于应用的数据源插件，这里只持有通用数据缓存。
 */
export function createStreamDataSource<T extends DataItem = DataItem>(): StreamDataSource<T> & {
    begin(): StreamWriter<T>;
} {
    let records: T[] = [];
    let ids = new Set<string | number>();
    let snapshot: StreamSnapshot = Object.freeze({ generation: 0, count: 0, status: 'complete', error: null });
    const listeners = new Set<(snapshot: StreamSnapshot) => void>();
    function publish(status: StreamSnapshot['status'], error: unknown | null = null): void {
        snapshot = Object.freeze({ generation: snapshot.generation, count: records.length, status, error });
        for (const listener of listeners) listener(snapshot);
    }
    return {
        get snapshot() { return snapshot; },
        at(index) { return records[index]; },
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        begin() {
            records = [];
            ids = new Set();
            snapshot = Object.freeze({ generation: snapshot.generation + 1, count: 0, status: 'receiving', error: null });
            const generation = snapshot.generation;
            publish('receiving');
            function check(): void {
                if (generation !== snapshot.generation) throw new DOMException('数据流已被新查询替换', 'AbortError');
                if (snapshot.status !== 'receiving') throw new Error('数据流已经结束，不能继续写入');
            }
            return {
                append(items) {
                    check();
                    const batchIds = new Set<string | number>();
                    for (const item of items) {
                        if (!item || !(typeof item.id === 'string' || (typeof item.id === 'number' && Number.isFinite(item.id)))) {
                            throw new TypeError('流式记录缺少有效的稳定 ID');
                        }
                        if (ids.has(item.id) || batchIds.has(item.id)) throw new Error(`流式记录重复 ID: ${item.id}`);
                        batchIds.add(item.id);
                    }
                    // 先验证完整批次；异常时不能留下部分追加。
                    for (const item of items) { ids.add(item.id); records.push(item); }
                    if (items.length) publish('receiving');
                },
                complete() { check(); publish('complete'); },
                fail(error) { check(); publish('error', error); },
            };
        },
    };
}
