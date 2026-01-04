<template>
  <div class="debug-masonry-example">
    <div class="header">
      <h2>瀑布流模式动态加载调试</h2>
      <div class="debug-info">
        <div>当前项目数: {{ items.length }}</div>
        <div>总项目数: {{ totalItems }}</div>
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
        :column-width="220"
        :gap="15"
        :overscan-by="3"
        :estimated-total-count="estimatedTotalCount"
        id-key="id"
        @load-more="handleLoadMore"
        @scroll-settled="handleScrollSettled"
      >
        <template #default="{ item, isScrolling }">
          <div 
            class="masonry-item"
            :class="{ 'scrolling': isScrolling }"
            :style="{ 
              height: `${item.height}px`,
              backgroundColor: item.color 
            }"
          >
            <div class="item-content">
              <div class="item-id">ID: {{ item.id }}</div>
              <div class="item-title">{{ item.title }}</div>
              <div class="item-height">高度: {{ item.height }}px</div>
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
interface MasonryItemData {
  id: string;
  title: string;
  height: number;
  color: string;
}

// 响应式状态
const gridRef = ref<InstanceType<typeof VirtualMasonryGrid> | null>(null);
const items = ref<MasonryItemData[]>([]);
const loadMoreTriggered = ref(0);

// 配置
const totalItems = 1000;
const batchSize = 50;
const estimatedTotalCount = ref(totalItems);
let itemIdCounter = 0;

// 生成瀑布流项数据
const generateItems = (count: number): MasonryItemData[] => {
  const newItems: MasonryItemData[] = [];
  for (let i = 0; i < count; i++) {
    const id = `item-${itemIdCounter++}`;
    const height = 150 + Math.floor(Math.random() * 200); // 150-350px 随机高度
    newItems.push({
      id,
      title: `项目 ${itemIdCounter}`,
      height,
      color: `hsl(${Math.random() * 360}, 70%, 85%)`,
    });
  }
  return newItems;
};

// 加载更多项目
const handleLoadMore = () => {
  console.log('🔄 handleLoadMore triggered (masonry)', {
    current: items.value.length,
    total: totalItems,
    shouldLoad: items.value.length < totalItems
  });
  
  loadMoreTriggered.value++;
  
  if (items.value.length >= totalItems) {
    console.log('✅ No more items to load (masonry)');
    return;
  }
  
  const newItems = generateItems(batchSize);
  console.log('📦 Generated new items (masonry):', newItems.length);
  
  items.value = [...items.value, ...newItems];
  console.log('📊 Total items after load (masonry):', items.value.length);
};

// 手动添加项目
const addItems = () => {
  const newItems = generateItems(10);
  items.value = [...items.value, ...newItems];
};

// 重置项目
const resetItems = () => {
  items.value = [];
  itemIdCounter = 0;
  loadMoreTriggered.value = 0;
};

// 滚动事件处理
const handleScrollSettled = (visibleIndices: number[]) => {
  console.log('📜 Scroll settled (masonry), visible indices:', visibleIndices);
};

// 生命周期
onMounted(() => {
  console.log('🚀 Debug masonry component mounted');
  
  // 初始加载
  handleLoadMore();
});
</script>

<style scoped>
.debug-masonry-example {
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
  border-left: 3px solid #28a745;
}

.header button {
  margin-right: 8px;
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.header button:hover {
  background: #218838;
}

.grid-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.masonry-item {
  border-radius: 8px;
  padding: 12px;
  margin: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.masonry-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.masonry-item.scrolling {
  transition: none;
}

.item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #333;
}

.item-id {
  font-size: 12px;
  color: rgba(0,0,0,0.6);
  font-weight: bold;
}

.item-title {
  font-size: 16px;
  font-weight: bold;
  margin: 8px 0;
  text-align: center;
}

.item-height {
  font-size: 12px;
  color: rgba(0,0,0,0.6);
  text-align: center;
}
</style> 