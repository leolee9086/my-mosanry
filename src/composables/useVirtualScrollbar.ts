import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue';

const MIN_THUMB_HEIGHT = 20; // 滚动条滑块的最小高度 (px)

interface UseVirtualScrollbarOptions {
  scrollContainer: Ref<HTMLElement | null>;
  totalHeight: Ref<number>;
}

export function useVirtualScrollbar({ scrollContainer, totalHeight }: UseVirtualScrollbarOptions) {
  const thumbRef = ref<HTMLElement | null>(null);
  const trackRef = ref<HTMLElement | null>(null);
  let animationFrameId: number | null = null;

  const updateThumb = () => {
    if (!scrollContainer.value || !thumbRef.value) return;

    const {
      scrollTop,
      scrollHeight,
      clientHeight,
    } = scrollContainer.value;

    if (scrollHeight <= clientHeight) {
      thumbRef.value.style.display = 'none';
      return;
    }

    thumbRef.value.style.display = 'block';

    const rawThumbHeight = (clientHeight / totalHeight.value) * clientHeight;
    const thumbHeight = Math.max(rawThumbHeight, MIN_THUMB_HEIGHT);
    const thumbTop = (scrollTop / scrollHeight) * clientHeight;

    thumbRef.value.style.height = `${thumbHeight}px`;
    thumbRef.value.style.transform = `translateY(${thumbTop}px)`;
  };
  
  const handleScroll = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(updateThumb);
  };
  
  onMounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true });
      updateThumb(); // Initial update
    }
    if (trackRef.value) {
        trackRef.value.addEventListener('mousedown', handleTrackMouseDown);
    }
  });

  onUnmounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', handleScroll);
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    document.removeEventListener('mousemove', handleThumbMouseMove);
    document.removeEventListener('mouseup', handleThumbMouseUp);
    if (trackRef.value) {
      trackRef.value.removeEventListener('mousedown', handleTrackMouseDown);
    }
  });

  watch([totalHeight, () => scrollContainer.value?.clientHeight], () => {
    updateThumb();
  });

  // --- 拖拽与点击逻辑 ---
  const isDragging = ref(false);
  let startY = 0;
  let startScrollTop = 0;

  const handleTrackMouseDown = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;

    if (e.target === thumbRef.value || e.target.parentElement === trackRef.value) {
        e.preventDefault();
        e.stopPropagation();

        isDragging.value = true;
        startY = e.clientY;
        startScrollTop = scrollContainer.value?.scrollTop ?? 0;

        document.addEventListener('mousemove', handleThumbMouseMove);
        document.addEventListener('mouseup', handleThumbMouseUp);
    } else if (e.target === trackRef.value) {
        const { clientY, currentTarget } = e;
        if (!scrollContainer.value || !currentTarget) return;

        const trackRect = (currentTarget as HTMLElement).getBoundingClientRect();
        const clickRatio = (clientY - trackRect.top) / trackRect.height;
        
        scrollContainer.value.scrollTop = clickRatio * totalHeight.value;
    }
  };

  const handleThumbMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !scrollContainer.value) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaY = e.clientY - startY;
    const clientHeight = scrollContainer.value.clientHeight;
    
    const scrollDelta = (deltaY / clientHeight) * totalHeight.value;

    scrollContainer.value.scrollTop = startScrollTop + scrollDelta;
  };

  const handleThumbMouseUp = (e: MouseEvent) => {
    if (!isDragging.value) return;

    e.preventDefault();
    e.stopPropagation();

    isDragging.value = false;
    document.removeEventListener('mousemove', handleThumbMouseMove);
    document.removeEventListener('mouseup', handleThumbMouseUp);
  };

  return {
    thumbRef,
    trackRef,
  };
} 