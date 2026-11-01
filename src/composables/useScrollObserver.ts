import { ref, onUnmounted, watch, Ref } from 'vue';
import { throttle } from '../utils/throttle';

export interface UseScrollObserverOptions {
    scrollContainer: Ref<HTMLElement | null>;
    onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down' | 'none') => void;
    onScrollSettled?: (scrollTop: number) => void;
    throttleTime?: number;
    scrollSettleTime?: number;
}

/**
 * 创建滚动处理函数
 */
function createHandleScroll(
    scrollContainer: Ref<HTMLElement | null>,
    scrollTop: Ref<number>,
    isScrolling: Ref<boolean>,
    isScrollIgnored: Ref<boolean>,
    scrollDirection: Ref<'up' | 'down' | 'none'>,
    onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down' | 'none') => void,
    onScrollSettled?: (scrollTop: number) => void,
    throttleTime: number = 50,
    scrollSettleTime: number = 150
) {
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastScrollTop = 0;
    
    const handleScroll = throttle(() => {
        if (!scrollContainer.value || isScrollIgnored.value) return;

        const currentScrollTop = scrollContainer.value.scrollTop;
        
        if (currentScrollTop > lastScrollTop) {
            scrollDirection.value = 'down';
        } else if (currentScrollTop < lastScrollTop) {
            scrollDirection.value = 'up';
        }
        
        scrollTop.value = currentScrollTop;
        lastScrollTop = currentScrollTop;
        
        if (onScroll) {
            onScroll(currentScrollTop, scrollDirection.value);
        }

        isScrolling.value = true;
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            isScrolling.value = false;
            scrollDirection.value = 'none';
            
            if (onScrollSettled) {
                onScrollSettled(scrollTop.value);
            }
        }, scrollSettleTime);
    }, throttleTime);
    
    return { handleScroll, scrollTimeout };
}

/**
 * 创建忽略滚动事件的函数
 */
function createIgnoreScrollEventsFor(isScrollIgnored: Ref<boolean>) {
    let ignoreTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const ignoreScrollEventsFor = (duration: number) => {
        isScrollIgnored.value = true;
        if (ignoreTimeout) {
            clearTimeout(ignoreTimeout);
        }
        ignoreTimeout = setTimeout(() => {
            isScrollIgnored.value = false;
        }, duration);
    };
    
    return { ignoreScrollEventsFor, ignoreTimeout };
}

/**
 * 观察滚动容器的状态，提供滚动位置、滚动方向和滚动状态
 * @param options - 配置选项
 * @returns 滚动状态相关的响应式对象
 */
export function useScrollObserver({ 
    scrollContainer, 
    onScroll, 
    onScrollSettled,
    throttleTime = 50,
    scrollSettleTime = 150
}: UseScrollObserverOptions) {
    const scrollTop = ref(0);
    const isScrolling = ref(false);
    const isScrollIgnored = ref(false);
    const scrollDirection = ref<'up' | 'down' | 'none'>('none');

    const { handleScroll, scrollTimeout } = createHandleScroll(
        scrollContainer,
        scrollTop,
        isScrolling,
        isScrollIgnored,
        scrollDirection,
        onScroll,
        onScrollSettled,
        throttleTime,
        scrollSettleTime
    );

    const { ignoreScrollEventsFor, ignoreTimeout } = createIgnoreScrollEventsFor(isScrollIgnored);

    // 绑定时机：**等滚动容器元素真的出现**再绑。
    //
    // 原来只在 onMounted 里绑一次，但那时 scrollContainer.value 可能还是 null
    // （模板 ref 的赋值时机与 onMounted 的先后关系并不是「总是已赋值」）——
    // 一旦为 null，addEventListener 被跳过，之后**再也不会重试**，
    // 表现是：元素上滚得好好的，但组合式函数里的 scrollTop 永远是 0。
    // 用 watch（immediate，元素一出现就跑）既避开时序问题，
    // 也顺带支持了容器被替换的情况。
    let bound: HTMLElement | null = null;
    const bind = (el: HTMLElement | null) => {
        if (bound === el) return;
        if (bound !== null) bound.removeEventListener('scroll', handleScroll);
        bound = el;
        if (el !== null) el.addEventListener('scroll', handleScroll, { passive: true });
    };
    watch(scrollContainer, (el) => { bind(el ?? null); }, { immediate: true });

    onUnmounted(() => {
        bind(null);
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
        scrollDirection,
        ignoreScrollEventsFor,
    };
} 