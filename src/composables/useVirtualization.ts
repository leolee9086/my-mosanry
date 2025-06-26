/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, watch, Ref, computed } from 'vue';
import type { LayoutItem } from './useMasonryLayout';

/**
 * 虚拟化计算器的选项
 */
export interface UseVirtualizationOptions {
    scrollTop: Ref<number>;
    containerHeight: Ref<number>;
    findVisibleItems: (viewport: { top: number; height: number }) => LayoutItem[];
    overscanBy?: number;
}

/**
 * 纯计算的虚拟化 Composable.
 * 它不执行任何 DOM 操作或事件监听，只根据输入的滚动位置和容器高度，
 * 计算出应该被渲染的可见项。
 */
export function useVirtualization({
    scrollTop,
    containerHeight,
    findVisibleItems,
    overscanBy = 2, // 默认预渲染2个屏幕
}: UseVirtualizationOptions) {

    // 缓冲区大小等于 N 个屏幕高度
    const buffer = computed(() => containerHeight.value * (overscanBy - 1));

    const visibleItems = ref<LayoutItem[]>([]);

    const calculateVisibleItems = () => {
        const viewMinY = scrollTop.value - buffer.value;
        const viewMaxY = scrollTop.value + containerHeight.value + buffer.value;

        const newVisibleItems = findVisibleItems({
            top: Math.max(0, viewMinY),
            height: viewMaxY - viewMinY
        });
        
        visibleItems.value = newVisibleItems;
    };

    // 当滚动位置或容器高度变化时，重新计算可见项
    watch([scrollTop, containerHeight], calculateVisibleItems, { immediate: true });

    return {
        visibleItems,
        forceUpdate: calculateVisibleItems,
    };
} 