import { computed, ref, Ref, watch, ComputedRef, getCurrentScope, onScopeDispose } from 'vue';
import { createRafScheduler } from '../../utils/createRafScheduler';
import type { LayoutColumn, LayoutItem, UseLayoutEngineOptions } from './types';
import { MAX_BROWSER_HEIGHT } from './types';

/**
 * 初始化列数据结构
 */
export function initializeColumns(columnCount: number): LayoutColumn[] {
    return Array.from({ length: columnCount }, () => ({ height: 0, items: [] }));
}

/**
 * 查找最短的列
 */
export function getShortestColumn(columns: LayoutColumn[]): { index: number; height: number } {
    let shortest = { index: -1, height: Infinity };
    columns.forEach((col, index) => {
        if (col.height < shortest.height) {
            shortest = { index, height: col.height };
        }
    });
    return shortest;
}

/**
 * 计算并更新总高度
 */
export function calculateTotalHeight(
    columns: LayoutColumn[], 
    allItems: LayoutItem[], 
    mode: 'masonry' | 'grid' | 'justified',
    estimatedTotalCount?: number
): number {
    if (columns.length === 0 && mode === 'masonry') {
        return 0;
    }

    let calculatedHeight = 0;

    if (mode === 'grid' || mode === 'justified') {
        const lastItem = allItems[allItems.length - 1];
        if (lastItem) {
            calculatedHeight = lastItem.y + lastItem.height;
        }
    } else { // masonry
        calculatedHeight = Math.max(...columns.map(c => c.height));
    }
    
    // totalHeight 只表达已计算的布局。未知记录的估计和浏览器 CSS 高度上限
    // 分别由 createScrollHeightComputed / createContentHeightComputed 处理。
    return calculatedHeight;
}

/**
 * 创建计算列数的计算属性
 */
export function createColumnCountComputed({ containerWidth, columnWidth }: Pick<UseLayoutEngineOptions, 'containerWidth' | 'columnWidth'>): ComputedRef<number> {
    return computed(() => {
        if (!containerWidth.value || !columnWidth.value) return 1;
        return Math.max(1, Math.floor(containerWidth.value / columnWidth.value));
    });
}

/**
 * 创建滚动高度计算的计算属性
 */
export function createScrollHeightComputed(
    totalHeight: Ref<number>, 
    estimatedTotalCount: UseLayoutEngineOptions['estimatedTotalCount'], 
    allItems: Readonly<Ref<LayoutItem[]>> | LayoutItem[]
): ComputedRef<number> {
    return computed(() => {
        const estimatedCount = estimatedTotalCount?.value;
        const currentItemCount = Array.isArray(allItems) ? allItems.length : allItems.value.length;

        if (estimatedCount && estimatedCount > currentItemCount) {
            // 这里totalHeight一定有值，因为它是一个Ref<number>
            const currentTotalHeight = totalHeight.value;
            // 如果还没有任何项，使用固定值作为估算的初始高度
            const avgHeight = currentItemCount > 0 
                ? currentTotalHeight / currentItemCount 
                : 100; // 默认值
            
            return avgHeight * estimatedCount;
        }
        return totalHeight.value;
    });
}

/**
 * 创建内容高度的计算属性（考虑浏览器限制）
 */
export function createContentHeightComputed(logicalScrollHeight: ComputedRef<number>): ComputedRef<number> {
    return computed(() => {
        return Math.min(logicalScrollHeight.value, MAX_BROWSER_HEIGHT);
    });
}

/**
 * 创建对items监听的逻辑
 */
export function setupItemsWatch(
    items: UseLayoutEngineOptions['items'], 
    appendItems: (itemsToAppend: unknown[]) => void,
    rebuildLayout: () => void,
    _idKey: string
) {
    // 这里的输入是对象快照。引用替换也表示数据更新，即使稳定 ID 没变。
    // 增长时必须先确认旧前缀未变，不能把「修改旧项并追加」误判成纯追加。
    watch(items, (newItems, oldItems) => {
        const prefixUnchanged = newItems.length >= oldItems.length
            && oldItems.every((item: unknown, index: number) => Object.is(item, newItems[index]));
        if (prefixUnchanged && newItems.length > oldItems.length) {
            appendItems(newItems.slice(oldItems.length));
        } else if (!prefixUnchanged) {
            rebuildLayout();
        }
    });
}

/**
 * 创建智能更新调度器
 */
export function createUpdateScheduler(isScrolling: UseLayoutEngineOptions['isScrolling'], processPendingUpdates: () => void) {
    const scheduleProcessing = createRafScheduler(processPendingUpdates);
    
    // 不叠加一个无法撤销的延时。滚动结束后的下一帧处理积累的尺寸变化。
    const stop = watch(isScrolling, scrolling => {
        if (!scrolling) scheduleProcessing();
    });
    if (getCurrentScope()) onScopeDispose(() => { stop(); scheduleProcessing.cancel(); });
    return scheduleProcessing;
} 