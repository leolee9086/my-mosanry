<template>
  <div class="simple-selection-test">
    <h2>选择功能测试</h2>
    
    <div class="controls">
      <button @click="selectAll">全选</button>
      <button @click="clearSelection">清空</button>
      <button @click="selectFirst">选择第一个</button>
      <button @click="selectLast">选择最后一个</button>
      <div class="info">
        已选择: {{ selectedCount }} 项 | 焦点: {{ focusedId || '无' }}
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧选择项目列表 -->
      <div class="selected-panel">
        <h3>已选择项目 ({{ selectedCount }})</h3>
        <div class="selected-list">
          <div 
            v-for="itemId in selectedItems" 
            :key="itemId"
            class="selected-item"
            :class="{ 'focused': focusedId === itemId }"
            @click="handleSelectedItemClick(itemId)"
          >
            <span class="selected-item-id">{{ itemId }}</span>
            <span class="selected-item-title">{{ getItemTitle(itemId) }}</span>
            <button 
              class="remove-btn"
              @click.stop="removeSelectedItem(itemId)"
              title="移除选择"
            >
              ×
            </button>
          </div>
          <div v-if="selectedCount === 0" class="empty-state">
            暂无选择项目
          </div>
        </div>
      </div>

      <!-- 右侧测试区域 -->
      <div class="test-area">
        <SelectionWrapper 
          ref="selectionWrapperRef"
          :mode="'multiple'" 
          :allow-empty="true"
          @selection-change="handleSelectionChange"
          @focus-change="handleFocusChange"
        >
          <template #default="{ selectionApi }">
            <div class="test-container">
              <div 
                v-for="item in testItems" 
                :key="item.id"
                class="test-item"
                :class="{ 
                  'selected': selectionApi.isSelected(item.id),
                  'focused': selectionApi.isFocused(item.id)
                }"
                :data-selectable="true"
                :data-id="item.id"
                @click="handleItemClick(item.id, $event)"
              >
                <span class="item-id">{{ item.id }}</span>
                <span class="item-title">{{ item.title }}</span>
                <span v-if="selectionApi.isSelected(item.id)" class="checkmark">✓</span>
              </div>
            </div>
          </template>
        </SelectionWrapper>
      </div>
    </div>

    <div class="instructions">
      <h3>操作说明：</h3>
      <ul>
        <li>点击卡片：选择/取消选择</li>
        <li>方向键：导航焦点</li>
        <li>空格/回车：切换当前焦点项的选择状态</li>
        <li>Ctrl+A：全选</li>
        <li>Escape：清空选择</li>
        <li>Shift+方向键：范围选择</li>
        <li>左侧面板：查看已选择项目，点击可移除</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SelectionWrapper from '../src/components/SelectionWrapper.vue';
import type { SelectionEvent } from '../src/composables/useSelectionSystem';

const selectionWrapperRef = ref<InstanceType<typeof SelectionWrapper> | null>(null);
const selectedIds = ref<Set<string>>(new Set());
const focusedId = ref<string | null>(null);

const selectedCount = computed(() => selectedIds.value.size);

// 已选择项目的数组形式
const selectedItems = computed(() => Array.from(selectedIds.value));

// 根据ID获取项目标题
const getItemTitle = (itemId: string) => {
  const item = testItems.value.find(item => item.id === itemId);
  return item ? item.title : '未知项目';
};

// 测试数据
const testItems = ref([
  { id: 'item-1', title: '项目 1' },
  { id: 'item-2', title: '项目 2' },
  { id: 'item-3', title: '项目 3' },
  { id: 'item-4', title: '项目 4' },
  { id: 'item-5', title: '项目 5' },
  { id: 'item-6', title: '项目 6' },
  { id: 'item-7', title: '项目 7' },
  { id: 'item-8', title: '项目 8' },
]);

// 选择事件处理
const handleSelectionChange = (event: SelectionEvent) => {
  console.log('选择变化:', event);
  
  if (event.type === 'select') {
    selectedIds.value.add(event.entityId as string);
  } else if (event.type === 'deselect') {
    selectedIds.value.delete(event.entityId as string);
  } else if (event.type === 'clear') {
    selectedIds.value.clear();
  }
};

const handleFocusChange = (entityId: string | number | null) => {
  focusedId.value = entityId as string;
  console.log('焦点变化:', entityId);
};

// 项目点击处理
const handleItemClick = (itemId: string, event: MouseEvent) => {
  if (selectionWrapperRef.value) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.toggle) {
      selectionApi.toggle(itemId, 'click');
    }
  }
};

// 工具栏操作
const selectAll = () => {
  if (selectionWrapperRef.value) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.selectAll) {
      selectionApi.selectAll();
    }
  }
};

const clearSelection = () => {
  if (selectionWrapperRef.value) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.clear) {
      selectionApi.clear('programmatic');
    }
  }
};

const selectFirst = () => {
  if (selectionWrapperRef.value && testItems.value.length > 0) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.select) {
      selectionApi.select(testItems.value[0].id, 'programmatic');
    }
  }
};

const selectLast = () => {
  if (selectionWrapperRef.value && testItems.value.length > 0) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.select) {
      selectionApi.select(testItems.value[testItems.value.length - 1].id, 'programmatic');
    }
  }
};

// 左侧面板交互方法
const handleSelectedItemClick = (itemId: string) => {
  // 点击已选择项目时，将焦点设置到该项目
  if (selectionWrapperRef.value) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.focus) {
      selectionApi.focus(itemId);
    }
  }
};

const removeSelectedItem = (itemId: string) => {
  // 移除单个选择项目
  if (selectionWrapperRef.value) {
    const selectionApi = selectionWrapperRef.value.selectionApi;
    if (selectionApi && selectionApi.deselect) {
      selectionApi.deselect(itemId, 'programmatic');
    }
  }
};
</script>

<style scoped>
.simple-selection-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.controls button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.controls button:hover {
  background: #e5e5e5;
}

.info {
  margin-left: auto;
  font-weight: bold;
  color: #666;
}

.main-content {
  display: flex;
  gap: 20px;
}

.selected-panel {
  flex: 1;
  min-width: 250px;
  max-width: 300px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  height: fit-content;
}

.selected-panel h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.selected-item {
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-item:hover {
  border-color: #007acc;
  background: #f0f8ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.1);
}

.selected-item.focused {
  border-color: #ff6b35;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.3);
}

.selected-item-id {
  font-size: 11px;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.remove-btn:hover {
  background: #c82333;
  opacity: 1;
  transform: scale(1.1);
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  background: white;
  border: 1px dashed #dee2e6;
  border-radius: 6px;
}

.test-area {
  flex: 2;
  min-width: 0;
}

.test-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.test-item {
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.test-item:hover {
  border-color: #007acc;
  background: #f0f8ff;
}

.test-item.selected {
  border-color: #007acc;
  background: #e6f7ff;
}

.test-item.focused {
  border-color: #ff6b35;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.3);
}

.test-item.selected.focused {
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3);
}

.item-id {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
}

.checkmark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #007acc;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.instructions {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #007acc;
}

.instructions h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.instructions ul {
  margin: 0;
  padding-left: 20px;
}

.instructions li {
  margin: 5px 0;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    gap: 15px;
  }
  
  .selected-panel {
    min-width: auto;
    max-width: none;
  }
  
  .selected-list {
    max-height: 200px;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .info {
    margin-left: 0;
    margin-top: 10px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .simple-selection-test {
    padding: 15px;
  }
  
  .test-container {
    grid-template-columns: 1fr;
  }
  
  .selected-item {
    padding: 10px;
  }
  
  .selected-item-title {
    font-size: 13px;
  }
}
</style> 