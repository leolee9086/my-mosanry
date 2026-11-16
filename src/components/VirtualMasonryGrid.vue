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
import { ref, computed, onMounted, onBeforeUnmount, watch, toRef, nextTick, type ComponentPublicInstance } from 'vue';
import { useLayoutEngine } from '../composables/useLayoutEngine';
import { useVirtualization } from '../composables/useVirtualization';
import { useScrollObserver } from '../composables/useScrollObserver';
import { useVirtualScrollbar } from '../composables/useVirtualScrollbar';
import type { LayoutItem, LayoutViewport } from '../composables/layout-engines/types';

type ItemKey = string | number;
interface Props {
    items: unknown[];
    columnWidth?: number;
    rowHeight?: number;
    gap?: number;
    idKey?: string;
    itemHeight?: (item: unknown, columnWidth?: number) => number;
    overscanBy?: number;
    estimatedTotalCount?: number;
    scrollToIndex?: number;
    scrollToOptions?: ScrollIntoViewOptions;
    mode?: 'masonry' | 'grid' | 'justified' | 'list';
    managedByProvider?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
    columnWidth: 200, rowHeight: 200, gap: 15, idKey: 'id', overscanBy: 2,
    mode: 'masonry', managedByProvider: false,
});
const emit = defineEmits<{
    (e: 'load-more'): void;
    (e: 'layout-viewport', viewport: LayoutViewport): void;
    (e: 'visible-range', indices: number[]): void;
    (e: 'scroll-settled', indices: number[]): void;
    (e: 'scroll', top: number, direction: 'up' | 'down' | 'none'): void;
}>();
const scrollContainer = ref<HTMLElement | null>(null);
const containerWidth = ref(0), containerHeight = ref(0);
const transitionEnabled = ref(false);
let disposed = false;
// 锚点表示正在看的实体及其在视口中的偏移。总数据增长不会改变它。
let anchor: { id: ItemKey; offset: number } | undefined;
function keyOf(value: unknown): ItemKey {
    if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) return value;
    throw new TypeError('布局项需要 string 或有限 number 类型的稳定键');
}
const { scrollTop, isScrolling, ignoreScrollEventsFor } = useScrollObserver({
    scrollContainer,
    onScroll: (top, direction) => { rememberAnchor(); emit('scroll', top, direction); },
    onScrollSettled: () => emit('scroll-settled', visibleItems.value.map(item => item.index)),
});
const { allItems, contentHeight, updateItemHeight, rebuildLayout, layoutUpdateStamp,
    getCoveredHeight, findVisibleItems } = useLayoutEngine({
    containerWidth, columnWidth: toRef(props, 'columnWidth'), rowHeight: toRef(props, 'rowHeight'),
    gap: toRef(props, 'gap'), items: toRef(props, 'items'), isScrolling,
    idKey: props.idKey, itemHeight: props.itemHeight,
    estimatedTotalCount: toRef(props, 'estimatedTotalCount'), mode: props.mode,
});
const { visibleItems } = useVirtualization({
    allItems, scrollTop, containerHeight, overscanBy: props.overscanBy, layoutUpdateStamp,
    // masonry 和 list 的索引保持更新；其余模式继续原来的数组查询直到各自索引完成修复。
    findVisibleItems: props.mode === 'masonry' || props.mode === 'list' ? findVisibleItems : undefined,
});
const { thumbRef, trackRef } = useVirtualScrollbar({ scrollContainer, totalHeight: contentHeight });
const contentStyle = computed(() => ({ height: contentHeight.value + 'px' }));
function rememberAnchor(): void {
    if (scrollTop.value <= 0) { anchor = undefined; return; }
    const first = visibleItems.value.find(item => item.y + item.height > scrollTop.value);
    if (first) anchor = { id: keyOf(first.id), offset: first.y - scrollTop.value };
}
watch([allItems, layoutUpdateStamp], async () => {
    const saved = anchor;
    if (!saved || isScrolling.value) return;
    const item = allItems.value.find(item => item.id === saved.id);
    if (!item) { anchor = undefined; return; }
    const top = Math.max(0, item.y - saved.offset);
    await nextTick();
    if (!disposed && scrollContainer.value && anchor === saved && !isScrolling.value) {
        scrollContainer.value.scrollTop = top;
        scrollTop.value = scrollContainer.value.scrollTop;
    }
}, { flush: 'post' });
watch([scrollTop, containerHeight, containerWidth, allItems, layoutUpdateStamp], () => {
    emit('layout-viewport', { scrollTop: scrollTop.value, height: containerHeight.value,
        width: containerWidth.value, coveredHeight: getCoveredHeight(), laidOutCount: allItems.value.length });
}, { immediate: true, flush: 'post' });
let requestedLength = -1;
watch([visibleItems, () => props.items.length], ([items]) => {
    const top = scrollTop.value, bottom = top + containerHeight.value;
    emit('visible-range', items.filter(item => item.y + item.height > top && item.y < bottom).map(item => item.index));
    // 直传数组模式保留 load-more；DataProvider 自己按数据策略处理需求。
    const count = props.items.length;
    if (count < requestedLength) requestedLength = -1;
    if (!props.managedByProvider && containerHeight.value > 0 && items.length
        && items.some(item => item.index === count - 1) && requestedLength !== count) {
        requestedLength = count;
        emit('load-more');
    }
}, { flush: 'post' });
watch(() => props.scrollToIndex, index => {
    if (index === undefined || index < 0 || !scrollContainer.value) return;
    const item = allItems.value[index];
    if (item) scrollContainer.value.scrollTo({ top: item.y, behavior: props.scrollToOptions?.behavior ?? 'auto' });
});
const getItemStyle = (item: LayoutItem) => ({
    position: 'absolute' as const, top: item.y + 'px', left: item.x + 'px', width: item.width + 'px',
    transition: isScrolling.value || !transitionEnabled.value ? 'none' : 'top 0.3s, left 0.3s',
});

// 观察 wrapper 的自然高度，包含所有插槽内容；一个 observer 随 Grid 卸载统一释放。
const elements = new Map<ItemKey, HTMLElement>();
const elementIds = new WeakMap<Element, ItemKey>();
const callbacks = new Map<ItemKey, (element: Element | ComponentPublicInstance | null) => void>();
let itemObserver: ResizeObserver | undefined, containerObserver: ResizeObserver | undefined;
function measure(element: HTMLElement, id: ItemKey): void {
    const height = element.getBoundingClientRect().height;
    if (height > 0 && Number.isFinite(height)) updateItemHeight(id, height);
}
function setItemRef(rawId: unknown) {
    const id = keyOf(rawId);
    let callback = callbacks.get(id);
    if (!callback) {
        callback = element => {
            const previous = elements.get(id);
            if (previous && previous !== element) itemObserver?.unobserve(previous);
            if (!(element instanceof HTMLElement)) {
                elements.delete(id); callbacks.delete(id); return;
            }
            elements.set(id, element); elementIds.set(element, id);
            itemObserver?.observe(element);
        };
        callbacks.set(id, callback);
    }
    return callback;
}
watch([containerWidth, () => props.columnWidth, () => props.gap, () => props.rowHeight], () => {
    if (containerWidth.value > 0) rebuildLayout();
});
onMounted(() => {
    itemObserver = new ResizeObserver(entries => {
        if (disposed) return;
        for (const entry of entries) {
            const id = elementIds.get(entry.target);
            if (id !== undefined && entry.target instanceof HTMLElement) measure(entry.target, id);
        }
    });
    for (const [id, element] of elements) { itemObserver.observe(element); measure(element, id); }
    containerObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry || disposed) return;
        containerWidth.value = entry.contentRect.width;
        containerHeight.value = entry.contentRect.height;
    });
    if (scrollContainer.value) containerObserver.observe(scrollContainer.value);
});
onBeforeUnmount(() => {
    disposed = true;
    itemObserver?.disconnect(); containerObserver?.disconnect();
    elements.clear(); callbacks.clear();
});
defineExpose({ ignoreScrollEventsFor, setTransitionEnabled: (enabled: boolean) => { transitionEnabled.value = enabled; },
    layoutCount: computed(() => allItems.value.length), visibleCount: computed(() => visibleItems.value.length) });
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