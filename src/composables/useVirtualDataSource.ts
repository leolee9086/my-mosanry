/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, shallowRef, watch, type Ref } from 'vue'

/**
 * @织: 定义数据项的基本结构，必须包含一个唯一的 id
 */
export interface DataItem {
    id: string | number;
    [key: string]: any;
}

/**
 * @织: 定义占位符的结构
 * isPlaceholder 标记可以让UI组件区分真实数据和占位符
 */
export interface Placeholder {
    id: string;
    isPlaceholder: true;
    index: number;
}

/**
 * @织: 数据获取器函数的类型定义
 * 接收一个不连续的索引数组，返回一个Promise，该Promise解析为数据项数组
 */
export type DataFetcher = (indices: number[]) => Promise<DataItem[]>;

/**
 * @织: useVirtualDataSource 的选项接口
 */
export interface UseVirtualDataSourceOptions {
    totalCount: Ref<number>;
    dataFetcher: DataFetcher;
    initialPageSize?: number; // 初始加载的数据量
    createPlaceholder?: (index: number) => any; // 自定义占位符创建函数
}

const defaultCreatePlaceholder = (index: number): Placeholder => ({
    id: `placeholder-${index}`,
    isPlaceholder: true,
    index,
});
/**
 * @织: 一个可扩展的、用于处理大规模虚拟数据源的组合式函数。
 * 它负责管理占位符、按需请求数据，并提供一个对UI透明的响应式数据列表。
 */
export function useVirtualDataSource({
    totalCount,
    dataFetcher,
    initialPageSize = 50, // 默认初始加载50条
    createPlaceholder = defaultCreatePlaceholder,
}: UseVirtualDataSourceOptions) {

    // --- 内部状态 ---

    // 存储所有项（占位符或真实数据）的列表
    const items = shallowRef<any[]>([]);

    // 标记当前是否正在进行数据请求，防止并发请求
    const isFetching = ref(false);
    // 记录已经请求过的索引，避免重复请求
    const requestedIndices = new Set<number>();


    // --- 核心方法 ---

    /**
     * @织: 根据给定的索引数组，请求并填充数据
     * @param indices 一个不连续的、需要加载数据的索引数组
     */
    const requestDataForRange = async (indices: number[]) => {
        if (isFetching.value) return;

        const indicesToRequest = indices.filter(index => !requestedIndices.has(index));
        
        if (indicesToRequest.length === 0) {
            return []; // @织: 返回空数组，表示没有获取新数据
        }

        try {
            isFetching.value = true;
            // @织: 立即将索引标记为"已请求"，防止并发调用时重复请求相同的索引
            indicesToRequest.forEach(index => requestedIndices.add(index));

            const fetchedData = await dataFetcher(indicesToRequest);
            
            // @织: 优化：创建一个 index -> data 的映射，提高查找效率
            const dataMap = new Map(fetchedData.map(d => [d.index, d]));

            const newItems = [...items.value];
            let replaced = false;

            indicesToRequest.forEach(index => {
                const dataForItem = dataMap.get(index);
                if (dataForItem) {
                    const itemToReplace = newItems[index];
                    if (itemToReplace && itemToReplace.isPlaceholder) {
                        newItems[index] = dataForItem;
                        replaced = true;
                    }
                }
            });

            if (replaced) {
                items.value = newItems;
            }
            return fetchedData; // @织: 返回获取到的新数据
        } catch (error) {
            console.error('[useVirtualDataSource] Error fetching data:', error);
            // @织: 如果请求失败，需要将索引从 requestedIndices 中移除，以便后续可以重试
            indicesToRequest.forEach(index => requestedIndices.delete(index));
            return []; // @织: 失败时返回空数组
        } finally {
            isFetching.value = false;
        }
    };

    // --- 初始化与响应式处理 ---
    // @织: 使用 watch 替换 watchEffect，明确指定依赖为 totalCount，避免不必要的重复执行。
    watch(totalCount, (count) => {
        // 当 totalCount 变化时，重置所有状态并重新生成列表
        const initialItems: any[] = [];
        for (let i = 0; i < count; i++) {
            initialItems.push(createPlaceholder(i));
        }
        items.value = initialItems;

        requestedIndices.clear();
        isFetching.value = false;

        // 初始加载第一页数据
        if (initialPageSize > 0 && count > 0) {
            const initialIndices = Array.from({ length: Math.min(initialPageSize, count) }, (_, i) => i);
            requestDataForRange(initialIndices);
        }
    }, { immediate: true });

    // --- 暴露的 API ---
    return {
        items,
        isFetching,
        requestDataForRange,
    };
} 