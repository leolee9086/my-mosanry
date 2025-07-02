<template>
  <div 
    class="selection-provider" 
    ref="providerRef"
    tabindex="0"
    @keydown="handleKeyDown"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <slot :selection-api="selectionApi" />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, defineExpose } from 'vue';
import { useSelectionSystem } from '../composables/useSelectionSystem';
import { useSelectionObserver } from '../composables/useSelectionObserver';

// 类型定义
type EntityId = string | number;
type SelectionMode = 'single' | 'multiple' | 'range';

interface SelectionContextProps {
  mode?: SelectionMode;
  allowEmpty?: boolean;
  elementFilter?: (element: Element) => boolean;
  idExtractor?: (element: Element) => EntityId;
  onSelectionChange?: (event: any) => void;
  onFocusChange?: (entityId: EntityId | null) => void;
}

// Props
const props = withDefaults(defineProps<SelectionContextProps>(), {
  mode: 'multiple',
  allowEmpty: true,
  elementFilter: (element: Element) => element.hasAttribute('data-selectable'),
  idExtractor: (element: Element) => element.getAttribute('data-id') || element.id,
});

// Emits
const emit = defineEmits<{
  (e: 'selection-change', event: any): void;
  (e: 'focus-change', entityId: EntityId | null): void;
}>();

// 响应式状态
const providerRef = ref<HTMLElement | null>(null);

// 使用选择系统
const { selectionApi, selectionState } = useSelectionSystem({
  mode: props.mode,
  allowEmpty: props.allowEmpty,
  onSelectionChange: (event) => {
    emit('selection-change', event);
    props.onSelectionChange?.(event);
  },
  onFocusChange: (entityId) => {
    emit('focus-change', entityId);
    props.onFocusChange?.(entityId);
  },
});

// 使用选择观察者
const { startObserving, stopObserving } = useSelectionObserver({
  container: providerRef,
  elementFilter: props.elementFilter,
  idExtractor: props.idExtractor,
  onElementsChange: (elements) => {
    // 更新可导航元素列表
    const entityIds = elements.map(el => props.idExtractor(el));
    selectionApi.updateNavigableEntities(entityIds);
  },
});

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 防止在输入框中触发导航
  if (event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement) {
    return;
  }
  
  selectionApi.handleKeyboardEvent(event);
};

// 焦点处理
const handleFocus = () => {
  // 如果没有焦点项，聚焦到第一个
  if (selectionState.focusedId === null && selectionState.navigableEntities.length > 0) {
    selectionApi.navigateToFirst();
  }
};

const handleBlur = () => {
  // 可选：在失去焦点时清空焦点状态
  selectionApi.blur();
};

// 提供选择上下文给子组件
provide('selection-context', {
  api: selectionApi,
  state: selectionState,
});

// 暴露selectionApi给父组件
defineExpose({
  selectionApi,
  selectionState,
});

// 生命周期
onMounted(() => {
  // 确保容器可以获得焦点
  if (providerRef.value) {
    providerRef.value.focus();
  }
  
  // 开始观察DOM变化
  startObserving();
});

onUnmounted(() => {
  // 停止观察
  stopObserving();
  
  // 清理状态
  selectionApi.clear();
});
</script>

<style scoped>
.selection-provider {
  outline: none; /* 移除默认焦点样式 */
  position: relative;
  width: 100%;
  height: 100%;
}

/* 可选：添加自定义焦点样式 */
.selection-provider:focus {
  /* 可以添加一些视觉提示，比如边框高亮 */
}
</style>
