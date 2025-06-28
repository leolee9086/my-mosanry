/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ref } from 'vue';
import RBush from 'rbush';
import { BushItem, LayoutItem, LayoutColumn } from './types';
import { getShortestColumn } from './layoutUtils';

/**
 * 瀑布流布局项目追加函数
 * 将新项目追加到现有布局中，并更新相关状态
 * 
 * @param params 所有需要的参数
 * @returns 包含新创建的布局项和Bush项的对象
 */
export function appendMasonryItems(params: {
    itemsToAppend: any[];
    columnWidth: Ref<number>;
    gap: Ref<number>;
    idKey: string;
    itemHeight?: (itemData: any, columnWidth: number) => number;
    columns: LayoutColumn[];
    allItems: LayoutItem[];
    idToItemMap: Map<any, LayoutItem>;
}): { 
    newLayoutItems: LayoutItem[]; 
    newBushItems: BushItem[];
    modifiedColumns: LayoutColumn[];
} {
    const { 
        itemsToAppend,
        columnWidth, 
        gap,
        idKey, 
        itemHeight,
        columns,
        allItems,
        idToItemMap
    } = params;

    if (itemsToAppend.length === 0) {
        return { newLayoutItems: [], newBushItems: [], modifiedColumns: columns };
    }

    const newLayoutItems: LayoutItem[] = [];
    const newBushItems: BushItem[] = [];
    
    // 创建新列的副本，以便函数保持纯粹
    const modifiedColumns = [...columns];

    itemsToAppend.forEach(itemData => {
        const id = itemData[idKey];
        // 防止重复添加
        if (idToItemMap.has(id)) return;

        const shortestColumn = getShortestColumn(modifiedColumns);
        const columnIndex = shortestColumn.index;
        
        const newItem: LayoutItem = {
            id,
            data: itemData,
            isPlaceholder: !!itemData.isPlaceholder,
            index: allItems.length + newLayoutItems.length,
            columnIndex,
            indexInColumn: modifiedColumns[columnIndex].items.length,
            width: columnWidth.value,
            height: itemHeight ? itemHeight(itemData, columnWidth.value) : columnWidth.value,
            x: columnIndex * (columnWidth.value + gap.value),
            y: shortestColumn.height,
            minX: 0, minY: 0, maxX: 0, maxY: 0 // 将在 BushItem 中计算
        };
        
        modifiedColumns[columnIndex].items.push(newItem);
        modifiedColumns[columnIndex].height += newItem.height + gap.value;
        
        newBushItems.push(new BushItem(newItem));
        newLayoutItems.push(newItem);
    });

    return { newLayoutItems, newBushItems, modifiedColumns };
}

/**
 * 瀑布流布局项目高度更新处理函数
 * 处理项目高度变更并重新计算受影响的布局
 * 
 * @param params 所需的参数
 * @returns 更新后的列数据和是否有实际更新的标志
 */
export function processMasonryHeightUpdates(params: {
    pendingUpdates: Map<any, number>;
    idToItemMap: Map<any, LayoutItem>;
    columns: LayoutColumn[];
    gap: Ref<number>;
}): {
    updatedColumns: LayoutColumn[];
    changedColumns: Map<number, number>;
    hasChanges: boolean;
} {
    const { pendingUpdates, idToItemMap, columns, gap } = params;
    
    if (pendingUpdates.size === 0) {
        return { 
            updatedColumns: columns, 
            changedColumns: new Map(), 
            hasChanges: false 
        };
    }

    // 创建副本以保持纯函数
    const updatedColumns = [...columns];
    const changedColumns = new Map<number, number>();

    // 首先检测哪些列受到影响
    pendingUpdates.forEach((height, id) => {
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

    if (changedColumns.size === 0) {
        return { 
            updatedColumns, 
            changedColumns,
            hasChanges: false 
        };
    }

    // 然后更新受影响的列
    changedColumns.forEach((minChangedIndexInColumn, columnIndex) => {
        const column = updatedColumns[columnIndex];
        if (!column) return;

        // 从第一个变化的项开始
        const startItem = column.items[minChangedIndexInColumn];
        let currentY = startItem.y;

        // 重新计算该列中所有后续项的位置
        for (let i = minChangedIndexInColumn; i < column.items.length; i++) {
            const item = column.items[i];
            item.y = currentY;
            currentY += item.height + (gap?.value ?? 0);
        }
        column.height = currentY - (gap?.value ?? 0);
    });

    return { 
        updatedColumns, 
        changedColumns,
        hasChanges: true 
    };
}

/**
 * 瀑布流布局可见项目查找函数
 * 使用R-Tree快速查找视口内可见的布局项
 * 
 * @param params 所需的参数
 * @returns 视口内可见的布局项
 */
export function findMasonryVisibleItems(params: {
    tree: RBush<BushItem>;
    viewport: { top: number, height: number };
    containerWidth: Ref<number>;
    allItems: LayoutItem[];
}): LayoutItem[] {
    const { tree, viewport, containerWidth, allItems } = params;
    
    const results = tree.search({
        minX: 0,
        minY: viewport.top,
        maxX: containerWidth.value,
        maxY: viewport.top + viewport.height,
    });
    
    // 从R-Tree拿到ID，再从allItems中获取最新的对象
    const visibleIds = new Set(results.map(r => r.id));
    return allItems.filter(item => visibleIds.has(item.id));
} 