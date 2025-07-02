import { ref, onMounted, onUnmounted } from 'vue';
import { throttle } from '../utils/throttle';
import { findVisibleRange } from '../utils/binarySearch';

/**
 * 管理虚拟滚动逻辑的 Vue Composable.
 * 
 * @param {object} options
 * @param {ref<HTMLElement>} options.scrollContainer - 滚动容器元素的 ref.
 * @param {ref<Array>} options.columns - 由 useMasonryLayout 生成的列数据 ref.
 * @param {Function} options.loadMore - 当滚动到底部时用于加载更多数据的回调函数.
 * @param {ref<Number>} options.totalHeight - 布局总高度.
 * @returns 
 */
export function useVirtualization({ scrollContainer, columns, loadMore, totalHeight }) {

    const visibleItems = ref([]);

    // 定义一个缓冲区，让渲染区域大于可见区域，以提供更平滑的滚动体验
    const buffer = ref(window.innerHeight); 

    const calculateVisibleItems = () => {
        if (!scrollContainer.value || !columns.value || columns.value.length === 0) {
            visibleItems.value = [];
            return;
        }

        const container = scrollContainer.value;
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;

        const viewMinY = scrollTop - buffer.value;
        const viewMaxY = scrollTop + clientHeight + buffer.value;

        const newVisibleItems = [];
        // 遍历每一列，并使用二分查找确定可见项
        for (const column of columns.value) {
            const { start, end } = findVisibleRange(column.items, viewMinY, viewMaxY);
            
            if (start !== -1 && end !== -1) {
                for (let i = start; i <= end; i++) {
                    const item = column.items[i];
                    // 做最后的精确判断，确保项目确实与扩展后的视口相交
                    if (item.y + item.height > viewMinY && item.y < viewMaxY) {
                        newVisibleItems.push(item);
                    }
                }
            }
        }

        visibleItems.value = newVisibleItems;

        // --- 检查是否需要加载更多 ---
        // 当滚动到接近底部时触发
        const scrollBottom = scrollTop + clientHeight;
        if (totalHeight.value > 0 && scrollBottom >= totalHeight.value - clientHeight) {
            loadMore();
        }
    };

    // 使用节流来避免过于频繁地执行滚动计算
    const handleScroll = throttle(calculateVisibleItems, 50); // 优化节流时间

    onMounted(() => {
        if (scrollContainer.value) {
            scrollContainer.value.addEventListener('scroll', handleScroll);
            // 初始计算
            calculateVisibleItems();
        }
    });

    onUnmounted(() => {
        if (scrollContainer.value) {
            scrollContainer.value.removeEventListener('scroll', handleScroll);
        }
    });

    return {
        visibleItems,
        forceUpdate: calculateVisibleItems, // 暴露一个手动触发更新的方法
    };
} 