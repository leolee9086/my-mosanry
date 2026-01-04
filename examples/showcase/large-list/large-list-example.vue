<template>
  <div class="large-list-example">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="stats">
        <span>总项目: {{ totalItems.toLocaleString() }}</span>
        <span>已渲染: {{ loadedItemsCount }}</span>
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
          <VirtualMasonryDataProvider
            class="large-list"
            :total-count="totalItems"
            :data-fetcher="fetchData"
            mode="list"
            :item-height="(item) => 80"
            :gap="8"
            :overscan-by="3"
            @scroll="handleScroll"
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
            <template #placeholder="{ index }">
              <div class="placeholder-item" :data-index="index">
                <div class="placeholder-content">加载中...</div>
              </div>
            </template>
          </VirtualMasonryDataProvider>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import SelectionWrapper from '../../../src/components/SelectionWrapper.vue';
import VirtualMasonryDataProvider from '../../../src/components/VirtualMasonryDataProvider.vue';
import ListItem from './ListItem.vue';
import type { SelectionEvent } from '../../../src/composables/useSelectionSystem';
import type { DataItem } from '../../../src/composables/useVirtualDataSource';

// 类型定义
interface ListItemData extends DataItem {
  id: string; // 必须包含 DataItem 要求的 id 字段
  title: string;
  description: string;
  category: string;
  priority: number;
  timestamp: number;
  index: number; // 添加索引字段以便于映射
}

// 响应式状态
const selectionWrapperRef = ref<InstanceType<typeof SelectionWrapper> | null>(null);
const itemsCache = new Map<number, ListItemData>();
const selectedIds = ref<Set<string>>(new Set());
const focusedItem = ref<ListItemData | null>(null);
const scrollPosition = ref(0);
const visibleItems = ref<number[]>([]);
const memoryUsage = ref(0);

// 配置
const totalItems = 5000;
let itemIdCounter = 0;

// 计算属性
const selectedCount = computed(() => selectedIds.value.size);
const loadedItemsCount = computed(() => itemsCache.size);

// 生成单个列表项数据
const generateItem = (index: number): ListItemData => {
  const categories = ['工作', '生活', '学习', '娱乐', '其他'];
  const priorities = [1, 2, 3, 4, 5];
  
  const category = categories[Math.floor(Math.random() * categories.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const id = `item-${index}`;
  
  return {
    id,
    title: `项目 ${index + 1}`,
    description: `这是第 ${index + 1} 个项目的详细描述，属于 ${category} 类别，优先级为 ${priority}。`,
    category,
    priority,
    timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // 30天内
    index,
  };
};

/**
 * DataProvider 数据获取函数
 */
const fetchData = async (indices: number[]): Promise<ListItemData[]> => {
  console.log('🔄 fetchData triggered for indices:', indices);
  
  // 筛选出未缓存的索引
  const uncachedIndices = indices.filter(index => !itemsCache.has(index) && index < totalItems);
  
  if (uncachedIndices.length === 0) {
    console.log('✅ All requested items are already in cache');
    return indices.map(index => itemsCache.get(index)).filter((item): item is ListItemData => item !== undefined);
  }
  
  console.log(`📦 Generating ${uncachedIndices.length} new items`);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
  
  // 生成并缓存新项目
  uncachedIndices.forEach(index => {
    const newItem = generateItem(index);
    itemsCache.set(index, newItem);
    
    // 更新最大 ID 计数
    itemIdCounter = Math.max(itemIdCounter, index + 1);
  });
  
  // 更新内存使用统计
  updateMemoryUsage();
  
  console.log(`📊 Total cached items: ${itemsCache.size}`);
  
  // 返回所有请求的项目
  return indices.map(index => itemsCache.get(index)).filter((item): item is ListItemData => item !== undefined);
};

// 更新内存使用统计
const updateMemoryUsage = () => {
  // 模拟内存使用计算
  const baseMemory = 50; // 基础内存
  const itemMemory = itemsCache.size * 0.1; // 每个项目约0.1MB
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
    const itemId = entityId as string;
    // 从缓存中查找项目
    for (const [_, item] of itemsCache.entries()) {
      if (item.id === itemId) {
        focusedItem.value = item;
        break;
      }
    }
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

const handleScroll = (scrollTop: number, direction: string) => {
  // 更新滚动位置
  scrollPosition.value = scrollTop;
};

const handleScrollSettled = (visibleIndices: number[]) => {
  visibleItems.value = visibleIndices.slice(0, 5); // 只显示前5个
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
  // 收集所有已加载的项目 ID
  const loadedIds: string[] = [];
  itemsCache.forEach(item => loadedIds.push(item.id));
  
  if (loadedIds.length === 0) return;
  
  const randomCount = Math.min(10, loadedIds.length);
  const randomIndices = new Set<number>();
  
  while (randomIndices.size < randomCount) {
    randomIndices.add(Math.floor(Math.random() * loadedIds.length));
  }
  
  const randomIds = Array.from(randomIndices).map(i => loadedIds[i]);
  
  if (selectionWrapperRef.value?.selectionApi) {
    selectionWrapperRef.value.selectionApi.selectEntities(randomIds);
  }
};

const scrollToRandom = () => {
  const loadedIndices = Array.from(itemsCache.keys());
  
  if (loadedIndices.length === 0) return;
  
  const randomIndex = loadedIndices[Math.floor(Math.random() * loadedIndices.length)];
  
  // 设置焦点
  const item = itemsCache.get(randomIndex);
  if (item && selectionWrapperRef.value?.selectionApi) {
    selectionWrapperRef.value.selectionApi.focus(item.id);
  }
};

// 生命周期
onMounted(() => {
  console.log('🚀 Component mounted');
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
  overflow-x: hidden; /* 防止水平溢出 */
}

.placeholder-item {
  height: 80px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  border: 1px dashed #dee2e6;
}

.placeholder-content {
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
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