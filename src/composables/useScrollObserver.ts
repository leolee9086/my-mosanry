import { ref, onScopeDispose, watch, type Ref } from 'vue';
import { createRafScheduler } from '../utils/createRafScheduler';

export interface UseScrollObserverOptions {
    scrollContainer: Ref<HTMLElement | null>;
    onScroll?: (top: number, direction: 'up' | 'down' | 'none') => void;
    onScrollSettled?: (top: number) => void;
    /** 兼容旧配置；滚动位置以浏览器帧同步。 */
    throttleTime?: number;
    scrollSettleTime?: number;
}

/** 事件、帧和定时器同属组件作用域；卸载后不再产生旧滚动事件。 */
export function useScrollObserver({ scrollContainer, onScroll, onScrollSettled,
    scrollSettleTime = 150 }: UseScrollObserverOptions) {
    const scrollTop = ref(0), isScrolling = ref(false);
    const scrollDirection = ref<'up' | 'down' | 'none'>('none');
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let ignoreTimer: ReturnType<typeof setTimeout> | undefined;
    let ignored = false;
    let bound: HTMLElement | null = null;
    const handleScroll = createRafScheduler(() => {
        const element = scrollContainer.value;
        if (!element || ignored) return;
        const top = element.scrollTop;
        scrollDirection.value = top > scrollTop.value ? 'down' : top < scrollTop.value ? 'up' : 'none';
        scrollTop.value = top;
        isScrolling.value = true;
        onScroll?.(top, scrollDirection.value);
        if (settleTimer !== undefined) clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
            settleTimer = undefined;
            isScrolling.value = false;
            scrollDirection.value = 'none';
            onScrollSettled?.(scrollTop.value);
        }, scrollSettleTime);
    });
    // DOM listener 的 Event 不传给无参数调度器。
    const listener = () => { handleScroll(); };
    const bind = (element: HTMLElement | null) => {
        if (bound === element) return;
        bound?.removeEventListener('scroll', listener);
        bound = element;
        bound?.addEventListener('scroll', listener, { passive: true });
    };
    const stop = watch(scrollContainer, bind, { immediate: true });
    function ignoreScrollEventsFor(duration: number): void {
        if (!Number.isFinite(duration) || duration < 0) throw new RangeError('忽略滚动的时长必须非负');
        ignored = true;
        if (ignoreTimer !== undefined) clearTimeout(ignoreTimer);
        ignoreTimer = setTimeout(() => { ignored = false; ignoreTimer = undefined; handleScroll(); }, duration);
    }
    onScopeDispose(() => {
        stop(); bind(null); handleScroll.cancel();
        if (settleTimer !== undefined) clearTimeout(settleTimer);
        if (ignoreTimer !== undefined) clearTimeout(ignoreTimer);
    });
    return { scrollTop, isScrolling, scrollDirection, ignoreScrollEventsFor };
}
