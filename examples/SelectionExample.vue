<template>
  <div class="selection-example">
    <div class="toolbar">
      <button @click="selectAll">全选</button>
      <button @click="clearSelection">清空</button>
      <button @click="deleteSelected">删除选中 ({{ selectedCount }})</button>
      <div class="selection-info">
        已选择: {{ selectedCount }} 项
      </div>
    </div>

    <SelectionWrapper 
      ref="selectionWrapperRef"
      :mode="'multiple'" 
      :allow-empty="true"
      @selection-change="handleSelectionChange"
      @focus-change="handleFocusChange"
    >
      <template #default="{ selectionApi }">
        <VirtualMasonryGrid
          class="grid-container"
          :items="items"
          :column-width="220"
          :gap="15"
          id-key="id"
        >
          <template #default="{ item }">
            <div 
              class="selectable-card"
              :class="{ 
                'selected': selectionApi.isSelected(item.id),
                'focused': selectionApi.isFocused(item.id)
              }"
              :data-selectable="true"
              :data-id="item.id"
              @click="handleCardClick(item.id, $event)"
            >
              <div class="selection-indicator">
                <span v-if="selectionApi.isSelected(item.id)">✓</span>
              </div>
              <div class="card-content">
                <h3>{{ item.title }}</h3>
                <p>{{ item.content }}</p>
                <div class="card-color" :style="{ backgroundColor: item.color }"></div>
              </div>
            </div>
          </template>
        </VirtualMasonryGrid>
      </template>
    </SelectionWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SelectionWrapper from '../src/components/SelectionWrapper.vue';
import VirtualMasonryGrid from '../src/components/VirtualMasonryGrid.vue';
import type { SelectionEvent } from '../src/composables/useSelectionSystem';

let itemIdCounter = 0;
const items = ref<Array<{
  id: string;
  title: string;
  color: string;
  content: string;
}>>([]);
const selectedIds = ref<Set<string | number>>(new Set());
const selectionWrapperRef = ref<InstanceType<typeof SelectionWrapper> | null>(null);

const selectedCount = computed(() => selectedIds.value.size);

const generateItems = (count: number) => {
  const newItems: Array<{
    id: string;
    title: string;
    color: string;
    content: string;
  }> = [];
  for (let i = 0; i < count; i++) {
    newItems.push({
      id: `item-${itemIdCounter++}`,
      title: `卡片 ${itemIdCounter}`,
      color: `hsl(${Math.random() * 360}, 80%, 90%)`,
      content: '这是一些描述内容。'.repeat(Math.ceil(Math.random() * 10) + 1),
    });
  }
  return newItems;
};

const addItems = () => {
  items.value = [...items.value, ...generateItems(50)];
};

const clearItems = () => {
  items.value = [];
  itemIdCounter = 0;
};

// 选择事件处理
const handleSelectionChange = (event: SelectionEvent) => {
  console.log('选择变化:', event);
  
  if (event.type === 'select') {
    selectedIds.value.add(event.entityId);
  } else if (event.type === 'deselect') {
    selectedIds.value.delete(event.entityId);
  } else if (event.type === 'clear') {
    selectedIds.value.clear();
  }
};

const handleFocusChange = (entityId: string | number | null) => {
  console.log('焦点变化:', entityId);
};

// 卡片点击处理
const handleCardClick = (itemId: string | number, event: MouseEvent) => {
  // 通过selectionWrapper的API切换选择状态
  if (selectionWrapperRef.value) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.toggle) {
      selectionApi.toggle(itemId, 'click');
    }
  }
  console.log('卡片点击:', itemId, event);
};

// 工具栏操作
const selectAll = () => {
  // 通过selectionWrapper的API触发全选
  if (selectionWrapperRef.value) {
    // 获取selectionApi并调用selectAll方法
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.selectAll) {
      selectionApi.selectAll();
    }
  }
  console.log('全选');
};

const clearSelection = () => {
  // 通过selectionWrapper的API清空选择
  if (selectionWrapperRef.value) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.clear) {
      selectionApi.clear('programmatic');
    }
  }
  selectedIds.value.clear();
  console.log('清空选择');
};

const deleteSelected = () => {
  if (selectedIds.value.size === 0) return;
  
  // 删除选中的项目
  items.value = items.value.filter(item => !selectedIds.value.has(item.id));
  selectedIds.value.clear();
  console.log('删除选中项目');
};

// 初始加载
addItems();
</script>

<style scoped>
.selection-example {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 10px;
  border-bottom: 1px solid #ccc;
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f5f5f5;
  cursor: pointer;
}

.toolbar button:hover {
  background: #e5e5e5;
}

.selection-info {
  margin-left: auto;
  font-weight: bold;
  color: #666;
}

.grid-container {
  flex: 1;
  position: relative;
}

.selectable-card {
  width: 100%;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
  background-color: #f0f8ff;
  border: 2px solid transparent;
  border-radius: 8px;
  color: #333;
  overflow-wrap: break-word;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.selectable-card:hover {
  border-color: #d4e7f7;
  background-color: #e6f3ff;
}

.selectable-card.selected {
  border-color: #007acc;
  background-color: #e6f7ff;
}

.selectable-card.focused {
  border-color: #ff6b35;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.3);
}

.selectable-card.selected.focused {
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3);
}

.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  font-size: 12px;
  font-weight: bold;
  color: #007acc;
}

.selectable-card.selected .selection-indicator {
  border-color: #007acc;
  background: #007acc;
  color: white;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.1em;
  font-weight: 600;
}

.card-content p {
  margin: 0 0 8px 0;
  font-size: 0.95em;
  line-height: 1.5;
  flex-grow: 1;
}

.card-color {
  height: 20px;
  border-radius: 4px;
  margin-top: auto;
}
</style> 