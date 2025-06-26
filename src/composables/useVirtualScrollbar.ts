import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue';

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

    const thumbHeight = (clientHeight / scrollHeight) * clientHeight;
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
    if (thumbRef.value) {
        thumbRef.value.addEventListener('mousedown', handleThumbMouseDown);
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
    if (thumbRef.value) {
        thumbRef.value.removeEventListener('mousedown', handleThumbMouseDown);
    }
  });

  watch([totalHeight, () => scrollContainer.value?.clientHeight], () => {
    updateThumb();
  });

  // --- 拖拽逻辑 ---
  const isDragging = ref(false);
  let startY = 0;
  let startScrollTop = 0;

  const handleThumbMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isDragging.value = true;
    startY = e.clientY;
    startScrollTop = scrollContainer.value?.scrollTop ?? 0;

    document.addEventListener('mousemove', handleThumbMouseMove);
    document.addEventListener('mouseup', handleThumbMouseUp);
  };

  const handleThumbMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !scrollContainer.value) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaY = e.clientY - startY;
    const scrollHeight = scrollContainer.value.scrollHeight;
    const clientHeight = scrollContainer.value.clientHeight;
    
    // 换算鼠标移动距离到滚动条移动距离
    const scrollDelta = (deltaY / clientHeight) * scrollHeight;

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