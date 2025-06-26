<template>
    <div class="virtual-masonry-grid-container" ref="scrollContainer">
        <div class="virtual-masonry-grid-content" :style="contentStyle">
            <div v-for="item in visibleItems" :key="item.id" class="virtual-masonry-grid-item" :style="item.style">
                <!-- 作用域插槽，新增 isScrolling 状态 -->
                <slot name="default" :item="item.data" :style="item.style" :index="item.index" :isScrolling="isScrolling" :onSizeChange="handleSizeChange">
                    <!-- 默认内容，以防使用者没有提供插槽 -->
                    <div style="border: 1px dashed #ccc; padding: 10px;">
                        <p>Item {{ item.index }}</p>
                        <p>Scrolling: {{ isScrolling }}</p>
                        <p>{{ JSON.stringify(item.data) }}</p>
                    </div>
                </slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, toRef, withDefaults } from 'vue';
import { useMasonryLayout } from '../composables/useMasonryLayout';
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
    addItem,
    updateItemHeight,
    rebuildLayout,
    findVisibleItems,
} = useMasonryLayout({
    containerWidth,
    columnWidth: toRef(props, 'columnWidth'),
    gap: toRef(props, 'gap'),
    items: toRef(props, 'items'),
    idKey: props.idKey
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

interface SizeUpdate {
    id: any;
    height: number;
}

function handleSizeChange(sizeUpdate: SizeUpdate) {
    if (sizeUpdate && sizeUpdate.id !== undefined && sizeUpdate.height > 0) {
        updateItemHeight(sizeUpdate.id, sizeUpdate.height);
        forceVirtualizationUpdate();
    }
}

// --- 监听与响应 ---
watch(() => props.items, () => {
    rebuildLayout();
    forceVirtualizationUpdate();
}, { deep: true });

watch([containerWidth, () => props.columnWidth, () => props.gap], () => {
    rebuildLayout();
    forceVirtualizationUpdate();
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
    /* 优化过渡效果，使其更平滑 */
    transition: top 0.3s ease, left 0.3s ease, height 0.3s ease;
}
</style> 