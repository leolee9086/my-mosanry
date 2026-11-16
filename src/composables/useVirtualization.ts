import { shallowRef, watch, type Ref } from 'vue';
import type { LayoutItem, LayoutEngineResult } from './layout-engines/types';

export interface UseVirtualizationOptions {
    allItems: Ref<LayoutItem[]>;
    scrollTop: Ref<number>;
    containerHeight: Ref<number>;
    overscanBy?: number;
    /** 使用引擎自己的空间查询；直接使用此 composable 的旧调用方仍可只传数组。 */
    findVisibleItems?: LayoutEngineResult['findVisibleItems'];
    layoutUpdateStamp?: Ref<number>;
}

/** 仅计算可见集合；空间索引由布局引擎维护。 */
export function useVirtualization({ allItems, scrollTop, containerHeight, overscanBy = 2,
    findVisibleItems, layoutUpdateStamp }: UseVirtualizationOptions) {
    const visibleItems = shallowRef<LayoutItem[]>([]);
    const computeVisibleItems = () => {
        const top = Math.max(0, scrollTop.value - overscanBy * containerHeight.value);
        const bottom = scrollTop.value + (1 + overscanBy) * containerHeight.value;
        visibleItems.value = findVisibleItems
            ? findVisibleItems({ top, height: bottom - top })
            : allItems.value.filter(item => item.y + item.height > top && item.y < bottom);
    };
    watch([allItems, scrollTop, containerHeight, () => layoutUpdateStamp?.value], computeVisibleItems, {
        immediate: true,
    });
    return { visibleItems, forceUpdate: computeVisibleItems };
}
