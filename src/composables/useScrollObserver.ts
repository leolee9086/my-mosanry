import { ref, onMounted, onUnmounted, Ref } from 'vue';
import { throttle } from '../utils/throttle';

export interface UseScrollObserverOptions {
    scrollContainer: Ref<HTMLElement | null>;
    onLoadMore: () => void;
    totalHeight: Ref<number>;
}

/**
 * 观察滚动容器的状态，提供滚动位置、滚动状态，并处理无限加载回调。
 * @param options - 配置选项
 */
export function useScrollObserver({ scrollContainer, onLoadMore, totalHeight }: UseScrollObserverOptions) {
    const scrollTop = ref(0);
    const isScrolling = ref(false);

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = throttle(() => {
        if (!scrollContainer.value) return;

        scrollTop.value = scrollContainer.value.scrollTop;

        // --- 更新滚动状态 ---
        isScrolling.value = true;
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            isScrolling.value = false;
        }, 150); // 滚动停止后150ms，判定为滚动结束

        // --- 检查是否需要加载更多 ---
        const container = scrollContainer.value;
        const clientHeight = container.clientHeight;
        const scrollBottom = scrollTop.value + clientHeight;
        
        // 提前一个屏幕高度触发加载
        if (totalHeight.value > 0 && scrollBottom >= totalHeight.value - clientHeight) {
            onLoadMore();
        }
    }, 50); // 对高频滚动事件进行节流

    onMounted(() => {
        if (scrollContainer.value) {
            scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true });
        }
    });

    onUnmounted(() => {
        if (scrollContainer.value) {
            scrollContainer.value.removeEventListener('scroll', handleScroll);
        }
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
    });

    return {
        scrollTop,
        isScrolling,
    };
} 