<template>
  <div class="test-container">
    <h1>DataProvider Test</h1>
    <p>This example demonstrates the <code>VirtualMasonryDataProvider</code>, which handles virtualized data fetching.</p>
    <p>Total items: {{ totalItems.toLocaleString() }}</p>
    <div class="grid-container">
      <VirtualMasonryDataProvider
        :total-count="totalItems"
        :data-fetcher="fetchData"
        :min-column-width="200"
        :max-column-width="350"
        :gap="15"
        :item-height="getItemHeight"
      >
        <template #default="{ item }">
          <ImageCard :item="item" />
        </template>
        <template #placeholder="{ index }">
          <div class="placeholder-card">
            <div class="placeholder-content">
              Loading #{{ index + 1 }}...
            </div>
          </div>
        </template>
      </VirtualMasonryDataProvider>
    </div>
  </div>
</template>

<script setup lang="ts">
import VirtualMasonryDataProvider from '../src/components/VirtualMasonryDataProvider.vue';
import ImageCard from './cards/ImageCard.vue';
import type { DataFetcher } from '../src/composables/useVirtualDataSource';
import { computed, ref } from 'vue';
import PQueue from 'p-queue';

const totalItems = 1_000_000;

const COLORS = ['#f5a3a3', '#a3f5e9', '#a3a9f5', '#f5e4a3', '#f5a3d5'];

// @织: 创建一个全局的、并发数为1的任务队列
const queue = new PQueue({ concurrency: 10 });

// @织: AbortController 用于取消不再需要的旧请求
let abortController = new AbortController();

// A cache to store fetched data
const dataCache = new Map<number, any>();

const fetchData: DataFetcher = async (indices: number[]) => {
  // @织: 1. 发出取消命令，终止上一次的所有排队中任务
  abortController.abort();
  // @织: 2. 为本次新请求创建一个全新的控制器和信号
  abortController = new AbortController();
  const { signal } = abortController;

  console.log(`%cFetching data for indices: [${indices.join(', ')}]`, 'color: dodgerblue');
  
  const indicesToFetch = indices.filter(index => !dataCache.has(index));

  if (indicesToFetch.length === 0) {
    console.log('%c--> All requested items are already in cache.', 'color: orange');
    return indices.map(index => dataCache.get(index));
  }
  
  const fetchPromises = indicesToFetch.map(i => {
    // @织: 3. 将信号传递给队列任务，让 p-queue 能够响应取消命令
    return queue.add(() => {
      return new Promise<void>((resolveTask, rejectTask) => {
        // 提前检查，如果任务在开始前就已被取消，则直接拒绝
        if (signal.aborted) {
          return rejectTask(new DOMException('Aborted', 'AbortError'));
        }
        
        setTimeout(() => {
          const item = {
            id: i,
            index: i,
            title: `Image #${i + 1}`,
            color: COLORS[i % COLORS.length],
            aspectRatio: 0.7 + Math.random() * 0.6,
            imageUrl: `https://picsum.photos/seed/${i}/400/${Math.round(400 * (0.7 + Math.random() * 0.6))}`
          };
          dataCache.set(i, item);

          const img = new Image();
          img.onload = () => resolveTask();
          img.onerror = () => {
            console.error(`Image #${i} failed to load from ${item.imageUrl}`);
            resolveTask();
          };
          img.src = item.imageUrl;
        }, 50 + Math.random() * 200);
      });
    }, { signal });
  });

  try {
    // @织: 4. 等待任务完成，如果被取消，Promise.all会抛出异常
    await Promise.all(fetchPromises);
  } catch (error) {
    // @织: 捕获预期的取消错误，并静默处理
    if ((error as DOMException)?.name === 'AbortError') {
      console.log('%cPrevious fetch was cancelled.', 'color: red');
      return []; // 返回空数组，因为本次请求已被中断
    }
    // 对于其他未知错误，继续向上抛出
    throw error;
  }

  // Reconstruct the full results array from cache in the correct order
  const finalResults = indices.map(index => dataCache.get(index));

  console.log(`%c--> Fetched ${indicesToFetch.length} new items. Total returned: ${finalResults.length}`, 'color: green');
  return finalResults;
};

/**
 * @织: 瀑布流的最后一个核心优化：预知高度。
 * 在渲染前告诉组件每个项目的精确高度，从而彻底消除布局抖动。
 * @param item - 数据项，可能是占位符或真实数据
 * @param columnWidth - 当前列的宽度
 * @returns {number} - 项目的精确高度
 */
const getItemHeight = (item: any, columnWidth: number): number => {
  // 如果是占位符，我们返回一个固定的、预估的高度
  if (item.isPlaceholder) {
    return 250;
  }
  // 如果是真实数据，我们根据其宽高比，计算出在当前列宽下的精确高度
  return columnWidth / item.aspectRatio;
};
</script>

<style scoped>
.test-container {
  padding: 1rem;
  font-family: sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.grid-container {
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  position: relative; /* Important for scrollbar positioning */
}
h1, p {
  padding: 0 1rem;
}

.placeholder-card {
  background-color: #f0f0f0;
  border-radius: 8px;
  width: 100%;
  /* @织: 给占位符一个估算的高度，防止布局跳动 */
  height: 250px; 
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 1.2em;
}

.placeholder-content {
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style> 