<template>
  <div class="debug-list-example">
    <div class="header">
      <h2>列表模式动态加载调试</h2>
      <div class="debug-info">
        <div>当前项目数: {{ items.length }}</div>
        <div>总项目数: {{ totalItems }}</div>
        <div>totalHeight: {{ totalHeightDebug }}</div>
        <div>logicalScrollHeight: {{ logicalScrollHeightDebug }}</div>
        <div>contentHeight: {{ contentHeightDebug }}</div>
        <div>estimatedTotalCount: {{ estimatedTotalCount }}</div>
        <div>loadMoreTriggered: {{ loadMoreTriggered }}</div>
      </div>
      <button @click="addItems">手动添加项目</button>
      <button @click="resetItems">重置</button>
    </div>
    
    <div class="grid-container">
      <VirtualMasonryGrid
        ref="gridRef"
        :items="items"
        mode="list"
        :item-height="(item) => 80"
        :gap="8"
        :overscan-by="3"
        :estimated-total-count="estimatedTotalCount"
        id-key="id"
        @load-more="handleLoadMore"
        @scroll-settled="handleScrollSettled"
      >
        <template #default="{ item, isScrolling }">
          <div 
            class="list-item"
            :class="{ 'scrolling': isScrolling }"
            :style="{ height: '80px' }"
          >
            <div class="item-content">
              <div class="item-id">ID: {{ item.id }}</div>
              <div class="item-title">{{ item.title }}</div>
              <div class="item-desc">{{ item.description }}</div>
            </div>
          </div>
        </template>
      </VirtualMasonryGrid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import VirtualMasonryGrid from '../src/components/VirtualMasonryGrid.vue';

// 类型定义
interface ListItemData {
  id: string;
  title: string;
  description: string;
}

// 响应式状态
const gridRef = ref<InstanceType<typeof VirtualMasonryGrid> | null>(null);
const items = ref<ListItemData[]>([]);
const loadMoreTriggered = ref(0);

// 配置
const totalItems = 1000;
const batchSize = 50;
const estimatedTotalCount = ref(totalItems);
let itemIdCounter = 0;

// 调试信息
const totalHeightDebug = ref(0);
const logicalScrollHeightDebug = ref(0);
const contentHeightDebug = ref(0);

// 生成列表项数据
const generateItems = (count: number): ListItemData[] => {
  const newItems: ListItemData[] = [];
  for (let i = 0; i < count; i++) {
    const id = `item-${itemIdCounter++}`;
    newItems.push({
      id,
      title: `项目 ${itemIdCounter}`,
      description: `这是第 ${itemIdCounter} 个项目的详细描述，用于测试动态加载功能。`,
    });
  }
  return newItems;
};

// 加载更多项目
const handleLoadMore = () => {
  console.log('🔄 handleLoadMore triggered', {
    current: items.value.length,
    total: totalItems,
    shouldLoad: items.value.length < totalItems
  });
  
  loadMoreTriggered.value++;
  
  if (items.value.length >= totalItems) {
    console.log('✅ No more items to load');
    return;
  }
  
  const newItems = generateItems(batchSize);
  console.log('📦 Generated new items:', newItems.length);
  
  items.value = [...items.value, ...newItems];
  console.log('📊 Total items after load:', items.value.length);
  
  // 更新调试信息
  updateDebugInfo();
};

// 手动添加项目
const addItems = () => {
  const newItems = generateItems(10);
  items.value = [...items.value, ...newItems];
  updateDebugInfo();
};

// 重置项目
const resetItems = () => {
  items.value = [];
  itemIdCounter = 0;
  loadMoreTriggered.value = 0;
  updateDebugInfo();
};

// 更新调试信息
const updateDebugInfo = async () => {
  await nextTick();
  // 这里我们无法直接访问内部状态，但可以通过其他方式获取
  console.log('🔍 Debug info updated');
};

// 滚动事件处理
const handleScrollSettled = (visibleIndices: number[]) => {
  console.log('📜 Scroll settled, visible indices:', visibleIndices);
};

// 生命周期
onMounted(() => {
  console.log('🚀 Debug component mounted');
  
  // 初始加载
  handleLoadMore();
  
  // 定期更新调试信息
  setInterval(() => {
    updateDebugInfo();
  }, 1000);
});
</script>

<style scoped>
.debug-list-example {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.header h2 {
  margin: 0 0 16px 0;
  color: #333;
}

.debug-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
}

.debug-info > div {
  padding: 4px 8px;
  background: #f1f3f4;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.header button {
  margin-right: 8px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.header button:hover {
  background: #0056b3;
}

.grid-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.list-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  margin: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.list-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.list-item.scrolling {
  transition: none;
}

.item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-id {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

.item-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 4px 0;
}

.item-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style> 