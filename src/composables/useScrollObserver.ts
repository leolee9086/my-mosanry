import { ref, onMounted, onUnmounted, Ref, watch } from 'vue';
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
    const isScrollIgnored = ref(false);

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let ignoreTimeout: ReturnType<typeof setTimeout> | null = null;

    const checkForLoadMore = () => {
        const container = scrollContainer.value;
        if (!container) return;
        
        const clientHeight = container.clientHeight;
        const scrollBottom = scrollTop.value + clientHeight;
        
        const loadMoreThreshold = clientHeight * 2.5;
        if (totalHeight.value > 0 && scrollBottom >= totalHeight.value - loadMoreThreshold) {
            onLoadMore();
        }
    };

    const handleScroll = throttle(() => {
        if (!scrollContainer.value || isScrollIgnored.value) return;

        scrollTop.value = scrollContainer.value.scrollTop;

        isScrolling.value = true;
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            isScrolling.value = false;
        }, 150);

        checkForLoadMore();
    }, 50);

    /**
     * @织: 新增方法：在指定时间内忽略滚动事件
     * @param duration - 忽略的毫秒数
     */
    const ignoreScrollEventsFor = (duration: number) => {
        isScrollIgnored.value = true;
        if (ignoreTimeout) {
            clearTimeout(ignoreTimeout);
        }
        ignoreTimeout = setTimeout(() => {
            isScrollIgnored.value = false;
        }, duration);
    };

    watch(totalHeight, () => {
        requestAnimationFrame(checkForLoadMore);
    });

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
        if (ignoreTimeout) {
            clearTimeout(ignoreTimeout);
        }
    });

    return {
        scrollTop,
        isScrolling,
        ignoreScrollEventsFor,
    };
} 