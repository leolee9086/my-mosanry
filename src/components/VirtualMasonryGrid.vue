<template>
    <div class="virtual-masonry-grid-container" ref="scrollContainer">
        <div class="virtual-masonry-grid-content" :style="contentStyle">
            <div 
                v-for="item in visibleItems" 
                :key="item.id" 
                class="virtual-masonry-grid-item" 
                :style="getStyle(item)"
                :ref="setItemRef(item.id)"
            >
                <!-- 作用域插槽，对用户完全透明 -->
                <slot 
                    name="default" 
                    :item="item.data" 
                    :index="item.index" 
                    :isScrolling="isScrolling"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, toRef, withDefaults, nextTick } from 'vue';
import { useMasonryLayout, LayoutItem } from '../composables/useMasonryLayout';
import { useVirtualization } from '../composables/useVirtualization';
import { useScrollObserver } from '../composables/useScrollObserver';

// 为 props 定义类型
interface Props {
    items: any[];
    columnWidth?: number;
    gap?: number;
    idKey?: string;
    overscanBy?: number; // 新增 overscanBy prop
}

const props = withDefaults(defineProps<Props>(), {
    columnWidth: 200,
    gap: 15,
    idKey: 'id',
    overscanBy: 2,
});

const emit = defineEmits<{
    (e: 'load-more'): void;
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const containerHeight = ref(0);

// --- 1. 布局引擎 ---
const {
    totalHeight,
    updateItemHeight,
    rebuildLayout,
    findVisibleItems,
    layoutUpdateStamp, // 获取布局更新信号
} = useMasonryLayout({
    containerWidth,
    columnWidth: toRef(props, 'columnWidth'),
    gap: toRef(props, 'gap'),
    items: toRef(props, 'items'),
    idKey: props.idKey,
});

// --- 2. 滚动观察者 ---
const { scrollTop, isScrolling } = useScrollObserver({
    scrollContainer,
    totalHeight,
    onLoadMore: () => emit('load-more'),
});

// --- 3. 虚拟化计算器 ---
const { visibleItems, forceUpdate: forceVirtualizationUpdate } = useVirtualization({
    scrollTop,
    containerHeight,
    findVisibleItems,
    overscanBy: props.overscanBy,
});

const contentStyle = computed(() => ({
    height: `${totalHeight.value}px`,
}));

// @织: 将样式计算移至组件内部，确保响应性
const getStyle = (item: LayoutItem) => ({
    position: 'absolute' as const,
    top: `${item.y}px`,
    left: `${item.x}px`,
    width: `${item.width}px`,
    height: `${item.height}px`,
    transition: 'top 0.3s ease, left 0.3s ease, height 0.3s ease',
});

// --- DOM Refs and Measurement ---
// @织: 最终方案：结合 MutationObserver 和 ResizeObserver
const itemWrapperElements = new Map<any, HTMLElement>();
const mutationObservers = new Map<any, MutationObserver>();
const contentToIdMap = new WeakMap<Element, any>();

// 1. ResizeObserver 负责最终的尺寸测量
const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
        const id = contentToIdMap.get(entry.target);
        if (id !== undefined) {
            const newHeight = entry.contentRect.height;
            // @织: 允许高度更新为0，与初始测量逻辑保持一致
            updateItemHeight(id, newHeight);
        }
    }
});

// 2. setItemRef - @织: 最终修正版，使用 nextTick 解决时机问题
const setItemRef = (id: any) => (el: any) => {
    if (el) {
        // 使用 nextTick 确保在 DOM 更新完成后执行
        nextTick(() => {
            const contentEl = (el as HTMLElement).children[0] as HTMLElement;
            if (contentEl && contentEl.nodeType === 1) {
                // 1. 立即获取初始高度，无论是否为0
                const initialHeight = contentEl.getBoundingClientRect().height;
                console.log(`[VirtualMasonryGrid] Item ${id} content processed via nextTick. Initial height: ${initialHeight.toFixed(2)}px.`);
                updateItemHeight(id, initialHeight);
                
                // 2. 建立反向查找关系
                contentToIdMap.set(contentEl, id);
                
                // 3. 让 ResizeObserver 接管后续变化
                ro.observe(contentEl);
            } else {
                 console.warn(`[VirtualMasonryGrid] Item ${id} has no valid child element on nextTick.`);
            }
        });
    } else {
        // @织: 元素卸载的逻辑可以保持不变，但要确保 ro 能正确停止观察
        // 当前依赖 onUnmounted 中的 ro.disconnect()，暂时是安全的。
    }
};

// --- 监听与响应 ---
watch(layoutUpdateStamp, () => {
    forceVirtualizationUpdate();
});

watch(() => props.items, () => {
    rebuildLayout();
}, { deep: true });

watch([containerWidth, () => props.columnWidth, () => props.gap], () => {
    rebuildLayout();
});

// --- 生命周期与 DOM 观察 ---
let resizeObserver: ResizeObserver;
onMounted(() => {
    if (scrollContainer.value) {
        resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                containerWidth.value = entry.contentRect.width;
                containerHeight.value = entry.contentRect.height;
            }
        });
        resizeObserver.observe(scrollContainer.value);
        containerWidth.value = scrollContainer.value.clientWidth;
        containerHeight.value = scrollContainer.value.clientHeight;
    }
    rebuildLayout();
    forceVirtualizationUpdate();
});

onUnmounted(() => {
    if (resizeObserver && scrollContainer.value) {
        resizeObserver.unobserve(scrollContainer.value);
    }
    ro.disconnect();
    // @织: 移除旧的 mutationObservers 清理逻辑
});

</script>

<style scoped>
.virtual-masonry-grid-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    -webkit-overflow-scrolling: touch;
}

.virtual-masonry-grid-content {
    position: relative;
    width: 100%;
}

.virtual-masonry-grid-item {
    position: absolute;
    /* transition 从 JS 移到这里，但由 getStyle 覆盖 */
    overflow: hidden; /* @织: 新增, 防止内容在容器更新前溢出 */
}
</style> 