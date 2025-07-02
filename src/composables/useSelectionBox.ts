import { ref, computed, type Ref } from 'vue';
import type { EntityId } from './useSelectionSystem';
import { createDefaultSpatialSelector } from './select-engines';

// 类型定义
export interface SelectionBoxState {
  visible: boolean;
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  left: number;
  top: number;
  width: number;
  height: number;
  selectedElements: Element[];
}

export interface UseSelectionBoxOptions {
  enableSpatialSelection?: boolean;
  elementFilter?: (element: Element) => boolean;
  idExtractor?: (element: Element) => EntityId;
  onSelectionBoxChange?: (state: SelectionBoxState) => void;
  onSelectionBoxStart?: (event: MouseEvent) => void;
  onSelectionBoxUpdate?: (event: MouseEvent) => void;
  onSelectionBoxEnd?: (event: MouseEvent) => void;
}

export function useSelectionBox(options: UseSelectionBoxOptions = {}) {
  const {
    enableSpatialSelection = false,
    elementFilter = (element: Element) => element.hasAttribute('data-selectable'),
    idExtractor = (element: Element) => element.getAttribute('data-id') || element.id,
    onSelectionBoxChange,
    onSelectionBoxStart,
    onSelectionBoxUpdate,
    onSelectionBoxEnd,
  } = options;

  // 响应式状态
  const isMouseDown = ref(false);
  const isDragging = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  // 选择框状态
  const selectionBoxState = ref<SelectionBoxState>({
    visible: false,
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    selectedElements: [],
  });

  // 空间选择器（按需创建）
  const spatialSelector = enableSpatialSelection ? createDefaultSpatialSelector() : null;

  // 计算选择框样式
  const selectionBoxStyle = computed(() => ({
    left: `${selectionBoxState.value.left}px`,
    top: `${selectionBoxState.value.top}px`,
    width: `${selectionBoxState.value.width}px`,
    height: `${selectionBoxState.value.height}px`,
  }));

  // 设置容器引用
  const setContainerRef = (el: HTMLElement | null) => {
    containerRef.value = el;
  };

  // 更新空间选择器
  const updateSpatialSelector = (elements: Element[]) => {
    if (!spatialSelector || !elements || elements.length === 0) return;

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      
      // 使用屏幕坐标，不减去容器偏移
      const screenRect = {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
      
      spatialSelector.addElement(element, screenRect);
    });
  };

  // 鼠标事件处理
  const handleMouseDown = (event: MouseEvent) => {
    // 防止在输入框中触发选择
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    isMouseDown.value = true;
    isDragging.value = false;
    
    // 直接使用屏幕坐标，不减去容器偏移
    const x = event.clientX;
    const y = event.clientY;
    
    // 开始选择框
    selectionBoxState.value = {
      ...selectionBoxState.value,
      visible: true,
      isSelecting: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      left: x,
      top: y,
      width: 0,
      height: 0,
      selectedElements: [],
    };
    
    onSelectionBoxStart?.(event);
    onSelectionBoxChange?.(selectionBoxState.value);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isMouseDown.value || !selectionBoxState.value.isSelecting) return;
    
    // 直接使用屏幕坐标
    const x = event.clientX;
    const y = event.clientY;
    
    // 更新选择框
    selectionBoxState.value.currentX = x;
    selectionBoxState.value.currentY = y;
    
    // 计算选择框位置和大小
    const left = Math.min(selectionBoxState.value.startX, x);
    const top = Math.min(selectionBoxState.value.startY, y);
    const width = Math.abs(x - selectionBoxState.value.startX);
    const height = Math.abs(y - selectionBoxState.value.startY);
    
    selectionBoxState.value.left = left;
    selectionBoxState.value.top = top;
    selectionBoxState.value.width = width;
    selectionBoxState.value.height = height;
    
    // 检测相交的元素
    if (spatialSelector) {
      const queryRect = { left, top, right: left + width, bottom: top + height, width, height };
      const selectableElements = Array.from(containerRef.value?.querySelectorAll('[data-selectable]') || []);
      
      if (selectableElements.length > 0) {
        const intersectingElements = spatialSelector.queryIntersecting(selectableElements, queryRect);
        selectionBoxState.value.selectedElements = intersectingElements || [];
      } else {
        selectionBoxState.value.selectedElements = [];
      }
    } else {
      // 如果没有空间选择器，清空选中元素
      selectionBoxState.value.selectedElements = [];
    }
    
    isDragging.value = true;
    
    onSelectionBoxUpdate?.(event);
    onSelectionBoxChange?.(selectionBoxState.value);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (!isMouseDown.value) return;
    
    isMouseDown.value = false;
    
    if (isDragging.value && selectionBoxState.value.isSelecting) {
      // 完成选择
      selectionBoxState.value.isSelecting = false;
      selectionBoxState.value.visible = false;
      
      onSelectionBoxEnd?.(event);
      onSelectionBoxChange?.(selectionBoxState.value);
    }
  };

  // 控制方法
  const startSelectionBox = () => {
    selectionBoxState.value.visible = true;
    selectionBoxState.value.isSelecting = true;
  };

  const stopSelectionBox = () => {
    selectionBoxState.value.visible = false;
    selectionBoxState.value.isSelecting = false;
  };

  const clearSelectionBox = () => {
    selectionBoxState.value = {
      visible: false,
      isSelecting: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      selectedElements: [],
    };
  };

  // 获取选中的实体ID
  const getSelectedEntityIds = (): EntityId[] => {
    if (!selectionBoxState.value.selectedElements || selectionBoxState.value.selectedElements.length === 0) {
      return [];
    }
    return selectionBoxState.value.selectedElements.map(el => idExtractor(el));
  };

  return {
    // 状态
    selectionBoxState: selectionBoxState as Ref<SelectionBoxState>,
    selectionBoxStyle,
    isMouseDown,
    isDragging,
    
    // 引用
    containerRef,
    setContainerRef,
    
    // 事件处理
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // 控制方法
    startSelectionBox,
    stopSelectionBox,
    clearSelectionBox,
    
    // 工具方法
    getSelectedEntityIds,
    updateSpatialSelector,
  };
} 