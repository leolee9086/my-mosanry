<template>
  <div class="large-list-example">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="stats">
        <span>总项目: {{ totalItems.toLocaleString() }}</span>
        <span>已渲染: {{ renderedCount }}</span>
        <span>已选择: {{ selectedCount }}</span>
        <span>焦点: {{ focusedItem?.title || '无' }}</span>
      </div>
      <div class="actions">
        <button @click="selectAll">全选</button>
        <button @click="clearSelection">清空</button>
        <button @click="selectRandom">随机选择</button>
        <button @click="scrollToRandom">随机跳转</button>
      </div>
    </div>

    <!-- 大列表容器 -->
    <div class="list-container">
      <SelectionWrapper
        ref="selectionWrapperRef"
        :mode="'multiple'"
        :allow-empty="true"
        :enable-keyboard-selection="true"
        :enable-mouse-selection="true"
        :enable-spatial-selection="false"
        @selection-change="handleSelectionChange"
        @focus-change="handleFocusChange"
      >
        <template #default="{ selectionApi }">
          <VirtualMasonryGrid
            class="large-list"
            :items="listItems"
            mode="list"
            :item-height="(item) => 80"
            :gap="8"
            :estimated-total-count="totalItems"
            id-key="id"
            @load-more="loadMoreItems"
            @scroll-settled="handleScrollSettled"
          >
            <template #default="{ item, isScrolling }">
              <ListItem
                :item="item"
                :selected="selectionApi.isSelected(item.id)"
                :focused="selectionApi.isFocused(item.id)"
                :is-scrolling="isScrolling"
                @click="handleItemClick(item.id)"
              />
            </template>
          </VirtualMasonryGrid>
        </template>
      </SelectionWrapper>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <span class="label">滚动位置:</span>
        <span class="value">{{ scrollPosition.toFixed(0) }}px</span>
      </div>
      <div class="status-item">
        <span class="label">可见项目:</span>
        <span class="value">{{ visibleItems.join(', ') }}</span>
      </div>
      <div class="status-item">
        <span class="label">内存使用:</span>
        <span class="value">{{ memoryUsage }}MB</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import SelectionWrapper from '../../../src/components/SelectionWrapper.vue';
import VirtualMasonryGrid from '../../../src/components/VirtualMasonryGrid.vue';
import ListItem from './ListItem.vue';
import type { SelectionEvent } from '../../../src/composables/useSelectionSystem';

// 类型定义
interface ListItemData {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  timestamp: number;
}

// 响应式状态
const selectionWrapperRef = ref<InstanceType<typeof SelectionWrapper> | null>(null);
const listItems = ref<ListItemData[]>([]);
const selectedIds = ref<Set<string>>(new Set());
const focusedItem = ref<ListItemData | null>(null);
const scrollPosition = ref(0);
const visibleItems = ref<number[]>([]);
const memoryUsage = ref(0);

// 配置
const totalItems = 5000;
const batchSize = 100;
let itemIdCounter = 0;

// 计算属性
const selectedCount = computed(() => selectedIds.value.size);
const renderedCount = computed(() => listItems.value.length);

// 生成列表项数据
const generateItems = (count: number): ListItemData[] => {
  const categories = ['工作', '生活', '学习', '娱乐', '其他'];
  const priorities = [1, 2, 3, 4, 5];
  
  const newItems: ListItemData[] = [];
  for (let i = 0; i < count; i++) {
    const id = `item-${itemIdCounter++}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    newItems.push({
      id,
      title: `项目 ${itemIdCounter}`,
      description: `这是第 ${itemIdCounter} 个项目的详细描述，属于 ${category} 类别，优先级为 ${priority}。`,
      category,
      priority,
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // 30天内
    });
  }
  return newItems;
};

// 加载更多项目
const loadMoreItems = () => {
  if (listItems.value.length >= totalItems) return;
  
  const newItems = generateItems(batchSize);
  listItems.value = [...listItems.value, ...newItems];
  
  // 更新内存使用统计
  updateMemoryUsage();
};

// 更新内存使用统计
const updateMemoryUsage = () => {
  // 模拟内存使用计算
  const baseMemory = 50; // 基础内存
  const itemMemory = listItems.value.length * 0.1; // 每个项目约0.1MB
  memoryUsage.value = Math.round((baseMemory + itemMemory) * 10) / 10;
};

// 事件处理
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
  if (entityId) {
    focusedItem.value = listItems.value.find(item => item.id === entityId) || null;
  } else {
    focusedItem.value = null;
  }
  console.log('焦点变化:', entityId);
};

const handleItemClick = (itemId: string) => {
  if (selectionWrapperRef.value?.selectionApi) {
    selectionWrapperRef.value.selectionApi.toggle(itemId, 'click');
  }
};

const handleScrollSettled = (visibleIndices: number[]) => {
  visibleItems.value = visibleIndices.slice(0, 5); // 只显示前5个
  scrollPosition.value = window.scrollY;
};

// 控制方法
const selectAll = () => {
  if (selectionWrapperRef.value?.selectionApi) {
    selectionWrapperRef.value.selectionApi.selectAll();
  }
};

const clearSelection = () => {
  if (selectionWrapperRef.value?.selectionApi) {
    selectionWrapperRef.value.selectionApi.clear();
  }
};

const selectRandom = () => {
  if (listItems.value.length === 0) return;
  
  const randomCount = Math.min(10, listItems.value.length);
  const randomIndices = new Set<number>();
  
  while (randomIndices.size < randomCount) {
    randomIndices.add(Math.floor(Math.random() * listItems.value.length));
  }
  
  const randomIds = Array.from(randomIndices).map(i => listItems.value[i].id);
  
  if (selectionWrapperRef.value?.selectionApi) {
    selectionWrapperRef.value.selectionApi.selectEntities(randomIds);
  }
};

const scrollToRandom = () => {
  if (listItems.value.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * listItems.value.length);
  const randomItem = listItems.value[randomIndex];
  
  // 滚动到随机项目
  const element = document.querySelector(`[data-id="${randomItem.id}"]`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  // 设置焦点
  if (selectionWrapperRef.value?.selectionApi) {
    selectionWrapperRef.value.selectionApi.focus(randomItem.id);
  }
};

// 生命周期
onMounted(() => {
  // 初始加载
  loadMoreItems();
  
  // 监听滚动事件
  const handleScroll = () => {
    scrollPosition.value = window.scrollY;
  };
  
  window.addEventListener('scroll', handleScroll);
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
});
</script>

<style scoped>
.large-list-example {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.control-panel {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6c757d;
}

.stats span {
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  color: #495057;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.actions button:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.list-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.large-list {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

.status-bar {
  padding: 12px 16px;
  background: #343a40;
  color: white;
  display: flex;
  gap: 20px;
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  flex-shrink: 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item .label {
  color: #adb5bd;
  font-weight: 500;
}

.status-item .value {
  color: #f8f9fa;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .stats {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .actions {
    justify-content: center;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 