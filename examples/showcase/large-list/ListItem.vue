<template>
  <div
    class="list-item"
    :class="{
      'selected': selected,
      'focused': focused,
      'scrolling': isScrolling
    }"
    :data-id="item.id"
    @click="$emit('click')"
  >
    <!-- 选择指示器 -->
    <div class="selection-indicator">
      <div class="checkbox" :class="{ 'checked': selected }">
        <svg v-if="selected" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 标题和优先级 -->
      <div class="header">
        <h3 class="title">{{ item.title }}</h3>
        <div class="priority" :class="`priority-${item.priority}`">
          {{ getPriorityText(item.priority) }}
        </div>
      </div>

      <!-- 描述 -->
      <p class="description">{{ item.description }}</p>

      <!-- 元信息 -->
      <div class="meta">
        <span class="category">{{ item.category }}</span>
        <span class="timestamp">{{ formatTimestamp(item.timestamp) }}</span>
      </div>
    </div>

    <!-- 焦点指示器 -->
    <div v-if="focused" class="focus-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
interface Props {
  item: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: number;
    timestamp: number;
  };
  selected?: boolean;
  focused?: boolean;
  isScrolling?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  focused: false,
  isScrolling: false,
});

// Emits
defineEmits<{
  click: [];
}>();

// 计算属性
const getPriorityText = (priority: number): string => {
  const texts = ['', '低', '中低', '中', '中高', '高'];
  return texts[priority] || '未知';
};

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
};
</script>

<style scoped>
.list-item {
  width: 100%;
  min-height: 80px;
  padding: 16px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.list-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  transform: translateY(-1px);
}

.list-item.selected {
  border-color: #007bff;
  background: #f8f9ff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.list-item.focused {
  border-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.list-item.scrolling {
  transition: none;
}

/* 选择指示器 */
.selection-indicator {
  flex-shrink: 0;
  margin-top: 2px;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: white;
}

.checkbox.checked {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.checkbox svg {
  width: 12px;
  height: 12px;
  stroke-width: 2;
}

/* 内容区域 */
.content {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.priority-1 {
  background: #e9ecef;
  color: #6c757d;
}

.priority-2 {
  background: #d1ecf1;
  color: #0c5460;
}

.priority-3 {
  background: #fff3cd;
  color: #856404;
}

.priority-4 {
  background: #f8d7da;
  color: #721c24;
}

.priority-5 {
  background: #d4edda;
  color: #155724;
}

.description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #adb5bd;
}

.category {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.timestamp {
  font-style: italic;
}

/* 焦点指示器 */
.focus-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #28a745;
  border-radius: 8px;
  pointer-events: none;
  animation: focus-pulse 2s infinite;
}

@keyframes focus-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-item {
    padding: 12px;
    min-height: 70px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .title {
    font-size: 15px;
  }
  
  .description {
    font-size: 13px;
  }
  
  .meta {
    flex-direction: column;
    gap: 8px;
  }
}

/* 性能优化 */
.list-item {
  contain: layout style paint;
}

.content {
  contain: layout style;
}
</style> 