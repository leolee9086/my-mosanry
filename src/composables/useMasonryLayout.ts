/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, reactive, computed, Ref } from 'vue';
import RBush from 'rbush';

// --- 类型定义 ---

// 扩展 LayoutItem 以包含 R-tree 所需的边界框属性
export interface LayoutItem {
    id: any;
    data: any;
    index: number;
    columnIndex: number;
    indexInColumn: number;
    width: number;
    height: number;
    x: number;
    y: number;
    // R-tree 需要的属性
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    readonly style: {
        position: 'absolute';
        top: string;
        left: string;
        width: string;
        height: string;
    };
}

export interface LayoutColumn {
    height: number;
    items: LayoutItem[];
}

export interface UseMasonryLayoutOptions {
    containerWidth: Ref<number>;
    columnWidth: Ref<number>;
    gap: Ref<number>;
    items: Ref<any[]>;
    idKey: string;
}

// 定义 R-tree 项目的类型，继承自 LayoutItem
// RBush 需要 minX, minY, maxX, maxY
class BushItem implements LayoutItem {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    id: any;
    data: any;
    index: number;
    columnIndex: number;
    indexInColumn: number;
    width: number;
    height: number;
    x: number;
    y: number;

    constructor(item: Omit<LayoutItem, 'style'>) {
        this.id = item.id;
        this.data = item.data;
        this.index = item.index;
        this.columnIndex = item.columnIndex;
        this.indexInColumn = item.indexInColumn;
        this.width = item.width;
        this.height = item.height;
        this.x = item.x;
        this.y = item.y;
        this.minX = item.x;
        this.minY = item.y;
        this.maxX = item.x + item.width;
        this.maxY = item.y + item.height;
    }

    get style() {
        return {
            position: 'absolute' as const,
            top: `${this.y}px`,
            left: `${this.x}px`,
            width: `${this.width}px`,
            height: `${this.height}px`,
        };
    }
}


/**
 * 一个管理瀑布流布局计算的 Vue Composable.
 * 使用 R-tree 优化空间查询.
 */
export function useMasonryLayout({ containerWidth, columnWidth, gap, items, idKey }: UseMasonryLayoutOptions) {

    // 使用 RBush<LayoutItem> 会导致类型错误，因为 RBush 的 search 方法返回的是 T[]
    // 而 LayoutItem 包含 style getter，这在内部操作中可能导致问题。
    // 我们使用一个简化的 BushItem 来存储在 r-tree 中。
    const tree = new RBush<BushItem>();
    const allItems = ref<LayoutItem[]>([]);
    const idToItemMap = new Map<any, LayoutItem>();

    const updateRequests = new Map<any, number>();
    let updateTimer: ReturnType<typeof setTimeout> | null = null;
    let needsRebuildTree = false;

    const columnCount = computed(() => {
        if (!containerWidth.value || !columnWidth.value) return 1;
        return Math.max(1, Math.floor(containerWidth.value / columnWidth.value));
    });

    const columns = ref<LayoutColumn[]>([]);
    const initializeColumns = () => {
        columns.value = Array.from({ length: columnCount.value }, () => ({ height: 0, items: [] }));
    };

    const getShortestColumn = (): { index: number; height: number } => {
        let shortest = { index: -1, height: Infinity };
        columns.value.forEach((col, index) => {
            if (col.height < shortest.height) {
                shortest = { index, height: col.height };
            }
        });
        return shortest;
    };

    const addItem = (itemData: any) => {
        const id = itemData[idKey];
        if (idToItemMap.has(id)) {
            return;
        }

        const shortestColumn = getShortestColumn();
        const columnIndex = shortestColumn.index;
        
        const itemPartial: Omit<LayoutItem, 'style'> = {
            id,
            data: itemData,
            index: allItems.value.length,
            columnIndex,
            indexInColumn: columns.value[columnIndex]?.items.length ?? 0,
            width: columnWidth.value,
            height: columnWidth.value, // 初始高度，待内容加载后更新
            x: columnIndex * (columnWidth.value + gap.value),
            y: shortestColumn.height,
            minX: 0, minY: 0, maxX: 0, maxY: 0 // 将在 BushItem 中计算
        };

        const newItem = reactive(new BushItem(itemPartial));
        
        columns.value[columnIndex].items.push(newItem);
        columns.value[columnIndex].height += newItem.height + gap.value;
        
        idToItemMap.set(id, newItem);
        allItems.value.push(newItem);
        tree.insert(newItem);
    };

    const updateItemHeight = (itemId: any, newHeight: number) => {
        updateRequests.set(itemId, newHeight);
        if (!updateTimer) {
            updateTimer = setTimeout(() => {
                processPendingUpdates();
                updateTimer = null;
            }, 30); // 增加延迟以捕获更多更新
        }
    };

    const processPendingUpdates = () => {
        const updatesByColumn = new Map<number, { item: LayoutItem, newHeight: number }[]>();

        updateRequests.forEach((newHeight, itemId) => {
            const item = idToItemMap.get(itemId);
            if (!item) return;

            const columnIndex = item.columnIndex;
            if (!updatesByColumn.has(columnIndex)) {
                updatesByColumn.set(columnIndex, []);
            }
            updatesByColumn.get(columnIndex)!.push({ item, newHeight });
        });

        updatesByColumn.forEach((updates, columnIndex) => {
            const column = columns.value[columnIndex];
            // 必须按 item 在列中的顺序排序
            updates.sort((a, b) => a.item.indexInColumn - b.item.indexInColumn);
            
            updates.forEach(({ item, newHeight }) => {
                const oldHeight = item.height;
                const heightDifference = newHeight - oldHeight;
                if (heightDifference === 0) return;

                // 从 R-tree 中移除旧边界
                tree.remove(item as BushItem);

                item.height = newHeight;
                // 更新 R-tree 所需的边界
                item.maxY = item.y + newHeight;
                
                // 重新插入
                tree.insert(item as BushItem);
                
                // 更新列中后续项目的位置
                for (let i = item.indexInColumn + 1; i < column.items.length; i++) {
                    const subsequentItem = column.items[i];
                    tree.remove(subsequentItem as BushItem);
                    subsequentItem.y += heightDifference;
                    subsequentItem.minY = subsequentItem.y;
                    subsequentItem.maxY = subsequentItem.y + subsequentItem.height;
                    tree.insert(subsequentItem as BushItem);
                }
                
                // 更新列的总高度
                column.height += heightDifference;
            });
        });
        
        updateRequests.clear();
    };
    
    const totalHeight = computed(() => {
        if (columns.value.length === 0) return 0;
        return Math.max(...columns.value.map(c => c.height));
    });

    const rebuildLayout = () => {
        initializeColumns();
        tree.clear();
        const allItemsData = [...items.value];
        allItems.value = [];
        idToItemMap.clear();
        allItemsData.forEach(item => addItem(item));
    };

    const findVisibleItems = (viewport: { top: number, height: number }): LayoutItem[] => {
        const results = tree.search({
            minX: 0,
            minY: viewport.top,
            maxX: containerWidth.value,
            maxY: viewport.top + viewport.height,
        });
        return results as LayoutItem[];
    }

    initializeColumns();

    return {
        // 不再直接暴露 layoutItems，而是通过 findVisibleItems 获取
        totalHeight,
        columnCount,
        columns, // columns 仍然可能对虚拟化引擎有用
        addItem,
        updateItemHeight,
        rebuildLayout,
        findVisibleItems, // 新增方法
    };
} 