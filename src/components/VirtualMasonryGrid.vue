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

// --- 1. 布局引擎 (已重构为双缓存) ---
const {
    allItems, // @织: 直接使用 allItems shallowRef
    totalHeight,
    updateItemHeight,
    rebuildLayout,
    layoutUpdateStamp, // @织: 暂时保留，用于触发虚拟化更新
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

// --- 3. 虚拟化计算器 (适配 allItems) ---
const { visibleItems, forceUpdate: forceVirtualizationUpdate } = useVirtualization({
    allItems, // @织: 直接传入 allItems
    scrollTop,
    containerHeight,
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

// 2. setItemRef - @织: 增加清理逻辑，防止"幽灵更新"
const setItemRef = (id: any) => (el: any) => {
    if (el) {
        // 元素已挂载，存储其引用
        itemWrapperElements.set(id, el as HTMLElement);
        
        // 使用 nextTick 确保在 DOM 更新完成后执行
        nextTick(() => {
            // nextTick 内 el 可能已经改变，重新从 map 获取最新的
            const wrapperEl = itemWrapperElements.get(id);
            if (!wrapperEl) return;

            const contentEl = wrapperEl.children[0] as HTMLElement;
            if (contentEl && contentEl.nodeType === 1) {
                // 1. 立即获取初始高度，无论是否为0
                const initialHeight = contentEl.getBoundingClientRect().height;
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
        // 元素已卸载，执行清理
        const wrapperEl = itemWrapperElements.get(id);
        if (wrapperEl) {
            const contentEl = wrapperEl.children[0] as HTMLElement;
            if (contentEl) {
                ro.unobserve(contentEl);
            }
            // 清理 map
            itemWrapperElements.delete(id);
        }
    }
};

// --- 监听与响应 ---
// @织: 当布局引擎完成一批更新后，它的 allItems.value 会被替换，
// 我们监听这个变化，来强制触发虚拟化引擎的重新计算。
watch(allItems, () => {
    forceVirtualizationUpdate();
});

// @织: 当布局引擎完成动态高度的`update`后，它不会替换 allItems 数组，
// 而是更新 layoutUpdateStamp。我们监听这个信号，同样强制触发虚拟化更新。
watch(layoutUpdateStamp, () => {
    forceVirtualizationUpdate();
});

// @织: props.items 的变化会由 useMasonryLayout 内部的 watch 自动处理，
// 它会自动调用 rebuildLayout，所以顶层不再需要 watch props.items。

watch([containerWidth, () => props.columnWidth, () => props.gap], () => {
    // @织: 这个 watch 仍然需要，因为它会触发 useMasonryLayout 内部的 rebuildLayout
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
    // @织: 初始加载时，rebuildLayout 会被自动调用一次
    // 首次的 virtualiation update 会在 allItems 的 watch 中被触发
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