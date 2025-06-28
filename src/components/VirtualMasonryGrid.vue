<template>
    <div class="virtual-masonry-grid-wrapper">
        <div class="virtual-masonry-grid-container" ref="scrollContainer">
            <div class="virtual-masonry-grid-content" :style="contentStyle">
                <div v-for="item in visibleItems" :key="item.id" class="virtual-masonry-grid-item"
                    :style="getItemStyle(item)" :ref="setItemRef(item.id)">
                    <!-- @织: 新增逻辑，根据数据类型渲染不同插槽 -->
                    <template v-if="item.isPlaceholder">
                        <slot name="placeholder" :item="item.data" :index="item.index" />
                    </template>
                    <template v-else>
                        <slot name="default" :item="item.data" :index="item.index" :isScrolling="isScrolling" />
                    </template>
                    
                </div>
            </div>
        </div>
        <!-- @织: 移到滚动容器外部，作为其兄弟节点 -->
        <div class="scrollbar-track" ref="trackRef">
            <div class="scrollbar-thumb" ref="thumbRef"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, toRef, withDefaults, nextTick, defineExpose } from 'vue';
import { useLayoutEngine, LayoutItem } from '../composables/useLayoutEngine';
import { useVirtualization } from '../composables/useVirtualization';
import { useScrollObserver } from '../composables/useScrollObserver';
import { useVirtualScrollbar } from '../composables/useVirtualScrollbar';

// 为 props 定义类型
interface Props {
    items: any[];
    columnWidth?: number;
    rowHeight?: number;
    gap?: number;
    idKey?: string;
    itemHeight?: (item: any, columnWidth: number) => number;
    overscanBy?: number;
    estimatedTotalCount?: number;
    scrollToIndex?: number;
    scrollToOptions?: ScrollIntoViewOptions;
    mode?: 'masonry' | 'grid' | 'justified';
}

const props = withDefaults(defineProps<Props>(), {
    columnWidth: 200,
    rowHeight: 200,
    gap: 15,
    idKey: 'id',
    overscanBy: 2,
    itemHeight: undefined,
    estimatedTotalCount: undefined,
    mode: 'masonry',
});

const emit = defineEmits<{
    (e: 'load-more'): void;
    (e: 'scroll-settled', visibleItemIndices: number[]): void;
}>();
const scrollContainer = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const containerHeight = ref(0);
const totalHeight = ref(0); // @织: 提前定义

// --- 2. 滚动观察者 (提前) ---
const { scrollTop, isScrolling, ignoreScrollEventsFor } = useScrollObserver({
    scrollContainer,
    totalHeight: totalHeight, 
    onLoadMore: () => emit('load-more'),
});

// --- 1. 布局引擎 (已重构为双缓存) ---
const {
    allItems,
    logicalScrollHeight,
    contentHeight,
    updateItemHeight,
    rebuildLayout,
    layoutUpdateStamp,
    estimatedTotalCount: estimatedTotalCountRef,
    mode,
} = useLayoutEngine({
    containerWidth,
    columnWidth: toRef(props, 'columnWidth'),
    rowHeight: toRef(props, 'rowHeight'),
    gap: toRef(props, 'gap'),
    items: toRef(props, 'items'),
    isScrolling,
    idKey: props.idKey,
    itemHeight: props.itemHeight,
    estimatedTotalCount: toRef(props, 'estimatedTotalCount'),
    mode: props.mode,
    totalHeight: totalHeight, 
});

// @织: --- 虚拟滚动条 ---
const { thumbRef, trackRef } = useVirtualScrollbar({
    scrollContainer,
    totalHeight: totalHeight,
});

// --- 2. 滚动观察者 ---
// @织: 新增 defineExpose，将内部方法暴露给父组件
defineExpose({
    ignoreScrollEventsFor,
});

// --- 3. 虚拟化计算器 (适配 allItems) ---
const { visibleItems, forceUpdate: forceVirtualizationUpdate } = useVirtualization({
    allItems,
    scrollTop,
    containerHeight,
    overscanBy: props.overscanBy,
});

const contentStyle = computed(() => ({
    height: `${contentHeight.value}px`,
}));

// @织: 记录上一次滚动停止的位置
const lastSettledScrollTop = ref(-1);

// @织: 监听滚动停止事件
watch(isScrolling, (scrolling) => {
    // 当滚动停止时
    if (!scrolling) {
        // 并且滚动位置确实发生了变化
        if (scrollTop.value !== lastSettledScrollTop.value) {
            const visibleIndices = visibleItems.value.map(item => item.index);
            if (visibleIndices.length > 0) {
                emit('scroll-settled', visibleIndices);
            }
            // 更新最后的位置
            lastSettledScrollTop.value = scrollTop.value;
        }
    }
});

// @织: 滚动到指定项
watch(() => props.scrollToIndex, (newIndex) => {
    if (newIndex === undefined || newIndex < 0 || !scrollContainer.value) return;

    // @织: 未来这里需要从 layout aitems 中找到精确的 y
    // @织: 目前我们先用一个估算值来测试
    const targetItem = allItems.value.find(item => item.index === newIndex);
    
    if (targetItem) {
        const targetY = targetItem.y;
        scrollContainer.value.scrollTo({
            top: targetY,
            behavior: props.scrollToOptions?.behavior || 'smooth',
        });
    } else {
        // @织: 如果目标项还未被渲染（在很远的地方），
        // @织: 我们可以先滚动到一个估算的位置。
        // @织: 这个逻辑将在"主动数据请求"架构中变得更重要。
        console.warn(`[VirtualMasonryGrid] scrollToIndex: 无法立即找到索引 ${newIndex} 的项。`);
    }
});

// @织: 将样式计算移至组件内部，确保响应性
const getItemStyle = (item: LayoutItem) => ({
    position: 'absolute' as const,
    top: `${item.y}px`,
    left: `${item.x}px`,
    width: `${item.width}px`,
    transition: 'top 0.3s, left 0.3s',
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

// @织: props.items 的变化会由 useLayoutEngine 内部的 watch 自动处理，
// 它会自动调用 rebuildLayout，所以顶层不再需要 watch props.items。

watch([containerWidth, () => props.columnWidth, () => props.gap], () => {
    // @织: 这个 watch 仍然需要，因为它会触发 useLayoutEngine 内部的 rebuildLayout
    rebuildLayout();
});

// --- 生命周期与 DOM 观察 ---
onMounted(() => {
    if (!scrollContainer.value) return;
    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
            const { width, height } = entries[0].contentRect;
            containerWidth.value = width;
            containerHeight.value = height;
            
            // 在容器尺寸变化后更新滚动条
            nextTick(() => {
                // 确保布局引擎和滚动条都能感知新的尺寸
                rebuildLayout();
                // 等布局更新后再更新滚动条
                setTimeout(() => {
                    // 触发滚动事件以更新滚动条
                    scrollContainer.value?.dispatchEvent(new Event('scroll'));
                }, 50);
            });
        }
    });
    
    resizeObserver.observe(scrollContainer.value);
    
    // 确保初始布局和滚动条正确
    nextTick(() => {
        rebuildLayout();
        // 初始化时强制一次滚动事件
        setTimeout(() => {
            scrollContainer.value?.dispatchEvent(new Event('scroll'));
        }, 50);
    });

    onUnmounted(() => {
        resizeObserver.disconnect();
    });
});

</script>

<style scoped>
/* @织: 新增 wrapper, 用于相对定位 */
.virtual-masonry-grid-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    /* 确保所有内容都在 wrapper 内部 */
    isolation: isolate; /* 创建新的层叠上下文，帮助处理z-index问题 */
}

.virtual-masonry-grid-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    /* @织: position: relative 已移动到 wrapper */
    -webkit-overflow-scrolling: touch;

    /* @织: 隐藏所有浏览器的原生滚动条 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* Internet Explorer 10+ */
}

.virtual-masonry-grid-container::-webkit-scrollbar {
    display: none;
    /* WebKit */
}

.virtual-masonry-grid-content {
    position: relative;
    width: 100%;
    overflow: hidden;
    /* @织: 新增, 防止内容在容器更新前溢出 */
}

.virtual-masonry-grid-item {
    position: absolute;
    /* transition 从 JS 移到这里，但由 getStyle 覆盖 */
    overflow: hidden;
    /* @织: 新增, 防止内容在容器更新前溢出 */
}

/* @织: 虚拟滚动条样式 */
.scrollbar-track {
    position: absolute;
    /* @织: 必须是 absolute 让其脱离文档流，成为覆盖层 */
    right: 2px;
    top: 0;
    width: 8px;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    opacity: 0.2; /* 默认轻微显示，确保用户知道有滚动功能 */
    transition: opacity 0.3s ease;
    z-index: 10;
    /* 确保滚动条在所有内容之上 */
    pointer-events: auto; /* 确保即使在容器禁用指针事件时仍可点击滚动条 */
}

.scrollbar-track:hover {
    opacity: 1;
}

.virtual-masonry-grid-container:hover ~ .scrollbar-track {
    opacity: 1;
}

.scrollbar-thumb {
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    /* height 由 js 控制 */
    background-color: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    position: relative;
    /* @织: 为伪元素提供定位上下文 */
}

/* @织: 使用伪元素扩展点击区域 */
.scrollbar-thumb::after {
    content: '';
    position: absolute;
    top: -10px;
    bottom: -10px;
    left: -5px;
    right: -5px; /* 扩展点击区域，增加用户友好性 */
}

.scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.6);
}
</style>