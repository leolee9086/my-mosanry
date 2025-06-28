/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, reactive, computed, Ref, shallowRef, onMounted, onUnmounted, watch } from 'vue';
import RBush from 'rbush';
import { createRafScheduler } from '../utils/createRafScheduler';
import { createSegmentTree, type SegmentTree } from '../utils/createSegmentTree';

// @织: 浏览器能够安全处理的最大CSS高度 (一个比较保守的值)
const MAX_BROWSER_HEIGHT = 15_000_000;

// --- 类型定义 ---

// @织: 移除 style, 让 layout item 成为纯数据对象
export interface LayoutItem {
    id: any;
    data: any;
    isPlaceholder?: boolean;
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
}

export interface LayoutColumn {
    height: number;
    items: LayoutItem[];
}

export interface UseLayoutEngineOptions {
    containerWidth: Ref<number>;
    columnWidth: Ref<number>;
    rowHeight: Ref<number>;
    gap: Ref<number>;
    items: Ref<any[]>;
    isScrolling: Ref<boolean>;
    idKey: string;
    itemHeight?: (itemData: any, columnWidth: number) => number;
    estimatedTotalCount?: Ref<number | undefined>;
    mode?: 'masonry' | 'grid' | 'justified';
}

// @织: BushItem 不再需要是响应式的，它只是 R-Tree 的数据载体
class BushItem implements LayoutItem {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    id: any;
    data: any;
    isPlaceholder?: boolean;
    index: number;
    columnIndex: number;
    indexInColumn: number;
    width: number;
    height: number;
    x: number;
    y: number;

    constructor(item: LayoutItem) {
        this.id = item.id;
        this.data = item.data;
        this.isPlaceholder = item.isPlaceholder;
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
}


/**
 * 一个管理瀑布流布局计算的 Vue Composable.
 * 使用 R-tree 优化空间查询和双重缓存机制优化更新性能.
 */
export function useLayoutEngine({
    containerWidth,
    columnWidth,
    rowHeight,
    gap,
    items,
    isScrolling,
    idKey,
    itemHeight,
    estimatedTotalCount,
    mode = 'masonry', // @织: 默认是 masonry
}: UseLayoutEngineOptions) {
    const tree = new RBush<BushItem>();
    
    // --- Justified 模式专属状态 ---
    let idealWidths: number[] = [];
    let segmentTree: SegmentTree | null = null;
    const itemAspectRatios = new Map<any, number>();
    const DEFAULT_ASPECT_RATIO = 1; // 默认宽高比

    // @织: 双重缓存 - 渲染层 (shallowRef)
    // 只在批处理更新完成后整体替换，以触发一次性的、高效的视图更新
    const allItems = shallowRef<LayoutItem[]>([]); 
    
    // @织: 双重缓存 - 计算层 (普通对象)
    // @织: 关键性能优化：将 columns 从 ref 改造为普通数组，避免在计算循环中产生响应式开销
    const idToItemMap = new Map<any, LayoutItem>();
    let columns: LayoutColumn[] = [];

    const pendingUpdates = new Map<number, number>();
    const layoutUpdateStamp = ref(Date.now());

    // @织: 将 totalHeight 从 computed 改为 ref，手动更新
    const totalHeight = ref(0);

    const columnCount = computed(() => {
        if (!containerWidth.value || !columnWidth.value) return 1;
        return Math.max(1, Math.floor(containerWidth.value / columnWidth.value));
    });

    const initializeColumns = () => {
        columns = Array.from({ length: columnCount.value }, () => ({ height: 0, items: [] }));
    };

    const getShortestColumn = (): { index: number; height: number } => {
        let shortest = { index: -1, height: Infinity };
        columns.forEach((col, index) => {
            if (col.height < shortest.height) {
                shortest = { index, height: col.height };
            }
        });
        return shortest;
    };

    const updateTotalHeight = () => {
        if (columns.length === 0 && mode === 'masonry') {
            totalHeight.value = 0;
            return;
        }

        if (mode === 'grid' || mode === 'justified') {
            const lastItem = allItems.value[allItems.value.length - 1];
            if (lastItem) {
                totalHeight.value = lastItem.y + lastItem.height;
            } else {
                totalHeight.value = 0;
            }
        } else { // masonry
            totalHeight.value = Math.max(...columns.map(c => c.height));
        }
    };

    const appendItemsToMasonry = (itemsToAppend: any[]) => {
        if (itemsToAppend.length === 0) return;

        const newLayoutItems: LayoutItem[] = [];
        const newBushItems: BushItem[] = [];

        itemsToAppend.forEach(itemData => {
            const id = itemData[idKey];
            // 防止重复添加
            if (idToItemMap.has(id)) return;

            const shortestColumn = getShortestColumn();
            const columnIndex = shortestColumn.index;
            
            const newItem: LayoutItem = {
                id,
                data: itemData,
                isPlaceholder: !!itemData.isPlaceholder,
                index: allItems.value.length + newLayoutItems.length,
                columnIndex,
                indexInColumn: columns[columnIndex].items.length,
                width: columnWidth.value,
                height: itemHeight ? itemHeight(itemData, columnWidth.value) : columnWidth.value,
                x: columnIndex * (columnWidth.value + gap.value),
                y: shortestColumn.height,
                minX: 0, minY: 0, maxX: 0, maxY: 0 // 将在 BushItem 中计算
            };
            
            columns[columnIndex].items.push(newItem);
            columns[columnIndex].height += newItem.height + gap.value;
            idToItemMap.set(id, newItem);
            
            newBushItems.push(new BushItem(newItem));
            newLayoutItems.push(newItem);
        });

        // @织: 批量更新
        if (newLayoutItems.length > 0) {
            tree.load(newBushItems);
            allItems.value = [...allItems.value, ...newLayoutItems];
            updateTotalHeight(); // 手动更新总高度
            layoutUpdateStamp.value = Date.now();
        }
    };

    const appendItemsToGrid = (itemsToAppend: any[]) => {
        if (itemsToAppend.length === 0) return;

        const newLayoutItems: LayoutItem[] = [];
        const newBushItems: BushItem[] = [];

        itemsToAppend.forEach(itemData => {
            const id = itemData[idKey];
            // 防止重复添加
            if (idToItemMap.has(id)) return;

            const shortestColumn = getShortestColumn();
            const columnIndex = shortestColumn.index;
            
            const newItem: LayoutItem = {
                id,
                data: itemData,
                isPlaceholder: !!itemData.isPlaceholder,
                index: allItems.value.length + newLayoutItems.length,
                columnIndex,
                indexInColumn: columns[columnIndex].items.length,
                width: columnWidth.value,
                height: itemHeight ? itemHeight(itemData, columnWidth.value) : columnWidth.value,
                x: columnIndex * (columnWidth.value + gap.value),
                y: shortestColumn.height,
                minX: 0, minY: 0, maxX: 0, maxY: 0 // 将在 BushItem 中计算
            };
            
            columns[columnIndex].items.push(newItem);
            columns[columnIndex].height += newItem.height + gap.value;
            idToItemMap.set(id, newItem);
            
            newBushItems.push(new BushItem(newItem));
            newLayoutItems.push(newItem);
        });

        // @织: 批量更新
        if (newLayoutItems.length > 0) {
            tree.load(newBushItems);
            allItems.value = [...allItems.value, ...newLayoutItems];
            updateTotalHeight(); // 手动更新总高度
            layoutUpdateStamp.value = Date.now();
        }
    };

    const partitionAndLayoutJustified = (startIndex = 0) => {
        if (!segmentTree) return;

        const containerW = containerWidth.value;
        const newLayoutItems: LayoutItem[] = startIndex > 0 ? allItems.value.slice(0, startIndex) : [];
        
        let currentItemIndex = startIndex;
        let currentY = 0;

        if (startIndex > 0) {
            const prevItem = newLayoutItems[startIndex - 1];
            if (prevItem) {
                currentY = prevItem.y + prevItem.height + gap.value;
            }
        }
        
        const totalItems = items.value.length;

        while(currentItemIndex < totalItems) {
            // 1. 估算当前行能放下多少项目
            const avgIdealWidth = segmentTree.query(currentItemIndex, totalItems - 1) / (totalItems - currentItemIndex);
            const itemsPerRow = avgIdealWidth > 0 ? Math.max(1, Math.floor(containerW / (avgIdealWidth + gap.value))) : 1;

            // 2. 使用分段树精确查找断点
            const idealTotalWidthWithoutGap = containerW - (itemsPerRow - 1) * gap.value;
            const rowInfo = segmentTree.findBreakpoint(currentItemIndex, idealTotalWidthWithoutGap);
            let endIndex = rowInfo.endIndex;

            if (endIndex < currentItemIndex) {
                endIndex = currentItemIndex;
            }
            
            const rowItemsData = items.value.slice(currentItemIndex, endIndex + 1);
            
            // 3. 处理最后一行
            const isLastRow = endIndex === totalItems - 1;
            if (isLastRow) {
                let currentX = 0;
                rowItemsData.forEach((itemData, indexInRow) => {
                    const itemIndex = currentItemIndex + indexInRow;
                    const idealW = idealWidths[itemIndex];
                    newLayoutItems[itemIndex] = {
                        id: itemData[idKey], data: itemData, index: itemIndex,
                        isPlaceholder: !!itemData.isPlaceholder,
                        width: idealW, height: rowHeight.value, x: currentX, y: currentY,
                        minX: currentX, minY: currentY, maxX: currentX + idealW, maxY: currentY + rowHeight.value,
                        columnIndex: indexInRow, indexInColumn: 0,
                    };
                    currentX += idealW + gap.value;
                });
                currentY += rowHeight.value + gap.value;
            } else {
                 // 4. 计算缩放比例并布局
                const rowIdealWidth = rowInfo.sum;
                const rowGapTotal = (rowItemsData.length - 1) * gap.value;
                const scale = (containerW - rowGapTotal) / rowIdealWidth;
                const finalRowHeight = rowHeight.value * scale;

                let currentX = 0;
                rowItemsData.forEach((itemData, indexInRow) => {
                    const itemIndex = currentItemIndex + indexInRow;
                    const idealW = idealWidths[itemIndex];
                    const finalWidth = idealW * scale;
                    newLayoutItems[itemIndex] = {
                        id: itemData[idKey], data: itemData, index: itemIndex,
                        isPlaceholder: !!itemData.isPlaceholder,
                        width: finalWidth, height: finalRowHeight, x: currentX, y: currentY,
                        minX: currentX, minY: currentY, maxX: currentX + finalWidth, maxY: currentY + finalRowHeight,
                        columnIndex: indexInRow, indexInColumn: 0,
                    };
                    currentX += finalWidth + gap.value;
                });
                currentY += finalRowHeight + gap.value;
            }
           
            currentItemIndex = endIndex + 1;
        }

        allItems.value = newLayoutItems;
        idToItemMap.clear();
        newLayoutItems.forEach(item => {
            if (item) idToItemMap.set(item.id, item)
        });
        
        updateTotalHeight();
        layoutUpdateStamp.value = Date.now();
    };

    const appendItemsToJustified = (itemsToAppend: any[]) => {
        if (itemsToAppend.length === 0) return;

        const newIdealWidths = itemsToAppend.map(itemData => {
            const aspectRatio = itemAspectRatios.get(itemData[idKey]) || DEFAULT_ASPECT_RATIO;
            return rowHeight.value * aspectRatio;
        });

        idealWidths.push(...newIdealWidths);
        segmentTree = createSegmentTree(idealWidths);
        partitionAndLayoutJustified(0);
    }

    const appendItems = (itemsToAppend: any[]) => {
        if (mode === 'grid') {
            appendItemsToGrid(itemsToAppend);
        } else if (mode === 'justified') {
            appendItemsToJustified(itemsToAppend);
        } else {
            appendItemsToMasonry(itemsToAppend);
        }
    };

    const processPendingUpdatesForMasonry = () => {
        if (pendingUpdates.size === 0) {
            return;
        }

        const updatesToProcess = new Map(pendingUpdates);
        pendingUpdates.clear();

        const changedColumns = new Map<number, number>(); // <columnIndex, minChangedIndexInColumn>

        updatesToProcess.forEach((height, id) => {
            const item = idToItemMap.get(id);
            if (!item) return;

            const oldHeight = item.height;
            if (oldHeight === height) return;

            item.height = height;

            const columnIndex = item.columnIndex;
            if (columnIndex !== undefined) {
                const itemIndexInColumn = item.indexInColumn;
                const currentMin = changedColumns.get(columnIndex);
                if (currentMin === undefined || itemIndexInColumn < currentMin) {
                    changedColumns.set(columnIndex, itemIndexInColumn);
                }
            }
        });

        if (changedColumns.size > 0) {
            changedColumns.forEach((minChangedIndexInColumn, columnIndex) => {
                const column = columns[columnIndex];
                if (!column) return;

                // Start from the first changed item in the column
                const startItem = column.items[minChangedIndexInColumn];
                let currentY = startItem.y;

                // Recalculate positions for all items from the first changed one
                for (let i = minChangedIndexInColumn; i < column.items.length; i++) {
                    const item = column.items[i];
                    item.y = currentY;
                    currentY += item.height + (gap?.value ?? 0);
                }
                column.height = currentY - (gap?.value ?? 0);
            });

            // @织: 所有列计算完毕后，手动更新总高度
            updateTotalHeight();
            layoutUpdateStamp.value = Date.now();
        }
    };
    
    const processPendingUpdatesGrid = () => {
        // @织: 当单个项目高度变化时，需要重新计算整行的最大高度，并更新该行所有项目的高度和后续所有行的Y坐标
        if (pendingUpdates.size === 0) return;
        
        const updatesToProcess = new Map(pendingUpdates);
        pendingUpdates.clear();

        const changedRows = new Set<number>(); // 记录发生变化的行的 indexInColumn

        updatesToProcess.forEach((newHeight, id) => {
            const item = idToItemMap.get(id);
            if (!item || item.height === newHeight) return;

            item.height = newHeight;
            changedRows.add(item.indexInColumn);
        });

        if (changedRows.size === 0) return;

        // 对所有受影响的行进行重新计算
        const sortedChangedRows = Array.from(changedRows).sort((a, b) => a - b);
        
        sortedChangedRows.forEach(rowIndex => {
            const rowStartIndex = rowIndex * columnCount.value;
            const rowEndIndex = rowStartIndex + columnCount.value;
            const rowItems = allItems.value.slice(rowStartIndex, rowEndIndex);

            if (rowItems.length === 0) return;

            const maxRowHeight = Math.max(...rowItems.map(item => item.height));

            // 更新行内所有项目的高度
            rowItems.forEach(item => item.height = maxRowHeight);
        });

        // 从第一个发生变化的行开始，更新后续所有项目的Y坐标
        const firstChangedRowIndex = sortedChangedRows[0];
        let currentY = 0;
        if (firstChangedRowIndex > 0) {
            const prevRowIndex = (firstChangedRowIndex * columnCount.value) - 1;
            const prevItem = allItems.value[prevRowIndex];
            currentY = prevItem.y + prevItem.height + gap.value;
        }

        for (let i = firstChangedRowIndex * columnCount.value; i < allItems.value.length; i++) {
            const item = allItems.value[i];
            const isFirstInRow = item.columnIndex === 0;

            if (isFirstInRow && i > firstChangedRowIndex * columnCount.value) {
                const prevItem = allItems.value[i - 1];
                currentY = prevItem.y + prevItem.height + gap.value;
            }
            item.y = currentY;
        }

        updateTotalHeight();
        layoutUpdateStamp.value = Date.now();
    };

    const processPendingUpdatesJustified = () => {
        if (pendingUpdates.size === 0) return;
        
        const updatesToProcess = new Map(pendingUpdates);
        pendingUpdates.clear();

        let minChangedIndex = Infinity;

        updatesToProcess.forEach((newHeight, id) => {
            const item = idToItemMap.get(id);
            if (!item || item.height === newHeight) return;

            const oldAspectRatio = itemAspectRatios.get(id) || DEFAULT_ASPECT_RATIO;
            const newAspectRatio = item.width / newHeight;
            itemAspectRatios.set(id, newAspectRatio);

            if (segmentTree && Math.abs(oldAspectRatio - newAspectRatio) > 1e-6) {
                const newIdealWidth = rowHeight.value * newAspectRatio;
                segmentTree.update(item.index, newIdealWidth);
                idealWidths[item.index] = newIdealWidth;
                if (item.index < minChangedIndex) {
                    minChangedIndex = item.index;
                }
            }
        });

        if (minChangedIndex !== Infinity) {
            partitionAndLayoutJustified(minChangedIndex);
        }
    }

    const processPendingUpdates = () => {
        if (mode === 'grid') {
            processPendingUpdatesGrid();
        } else if (mode === 'justified') {
            processPendingUpdatesJustified();
        } else {
            processPendingUpdatesForMasonry();
        }
    };

    const scheduleProcessing = createRafScheduler(processPendingUpdates);

    const updateItemHeight = (id: any, height: number) => {
        const item = idToItemMap.get(id);
        if (item && item.height === height) {
            return;
        }
        pendingUpdates.set(id, height);

        // @织: 智能决策 - 如果不在滚动，就立即调度更新
        if (!isScrolling.value) {
            scheduleProcessing();
        }
    };

    // @织: 智能调度中心 - 监听滚动状态
    watch(isScrolling, (scrolling) => {
        // 当滚动停止时
        if (!scrolling) {
            // 稍作等待，让惯性滚动结束
            setTimeout(() => {
                // 如果有在滚动期间积压的任务，则处理它们
                if (pendingUpdates.size > 0) {
                    scheduleProcessing();
                }
            }, 100); // 100ms 的冷却时间
        }
    });

    const logicalScrollHeight = computed(() => {
        const estimatedCount = estimatedTotalCount?.value;
        const currentItemCount = allItems.value.length;

        if (estimatedCount && estimatedCount > currentItemCount) {
            const currentTotalHeight = totalHeight.value;
            // 如果还没有任何项，使用列宽作为估算的初始高度
            const avgHeight = currentItemCount > 0 
                ? currentTotalHeight / currentItemCount 
                : columnWidth.value;
            
            return avgHeight * estimatedCount;
        }
        return totalHeight.value;
    });

    const contentHeight = computed(() => {
        return Math.min(logicalScrollHeight.value, MAX_BROWSER_HEIGHT);
    });

    const rebuildLayout = () => {
        tree.clear();
        idToItemMap.clear();
        const existingItems = [...items.value];
        allItems.value = [];
        
        if (mode === 'masonry' || mode === 'grid') {
            initializeColumns();
            if (mode === 'masonry') appendItemsToMasonry(existingItems);
            else appendItemsToGrid(existingItems);
        } else if (mode === 'justified') {
            totalHeight.value = 0;
            idealWidths = [];
            segmentTree = null;
            itemAspectRatios.clear();
            appendItemsToJustified(existingItems);
        } else {
             updateTotalHeight();
        }
    };

    // @织: 关键! 监听外部 items 数组的变化
    watch(items, (newItems, oldItems) => {
        if (newItems.length > oldItems.length) {
            // 这是加载了更多数据
            const itemsToAppend = newItems.slice(oldItems.length);
            appendItems(itemsToAppend);
        } else if (newItems.length < oldItems.length || newItems.some((item, i) => item[idKey] !== oldItems[i]?.[idKey])) {
            // 这是一个全新的数据集，或者发生了排序/删除等复杂变化
            rebuildLayout();
        }
    });

    const findVisibleItems = (viewport: { top: number, height: number }): LayoutItem[] => {
        const results = tree.search({
            minX: 0,
            minY: viewport.top,
            maxX: containerWidth.value,
            maxY: viewport.top + viewport.height,
        });
        // @织: 从 R-Tree 拿到 ID，再从 allItems 中获取最新的响应式对象
        const visibleIds = new Set(results.map(r => r.id));
        return allItems.value.filter(item => visibleIds.has(item.id));
    }

    initializeColumns();

    onMounted(() => {
        // ... existing code ...
    });

    onUnmounted(() => {
        scheduleProcessing.cancel();
    });

    return {
        // @织: 不再直接暴露 layoutItems，而是通过 allItems 这个 shallowRef
        allItems,
        totalHeight,
        logicalScrollHeight, // <-- 修改这里
        contentHeight,       // <-- 新增这里
        columnCount,         // @织: 之前的修改好像把这个弄丢了，它应该在
        updateItemHeight,
        rebuildLayout,
        findVisibleItems,
        layoutUpdateStamp,
    };
} 