<template>
  <div class="test-container">
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
import VirtualMasonryDataProvider from '../../src/components/VirtualMasonryDataProvider.vue';
import ImageCard from '../cards/ImageCard.vue';
import type { DataFetcher } from '../../src/composables/useVirtualDataSource';
import { computed, ref } from 'vue';
import PQueue from 'p-queue';

// 减小数据量，在性能优化后可以逐步增加
const totalItems = 100_000;

const COLORS = ['#f5a3a3', '#a3f5e9', '#a3a9f5', '#f5e4a3', '#f5a3d5'];

// 增加并发数，减少队列堵塞
const queue = new PQueue({ concurrency: 20 });

// 简化请求取消机制
let currentRequestId = 0;

// A cache to store fetched data
const dataCache = new Map<number, any>();

const fetchData: DataFetcher = async (indices: number[]) => {
  // 使用请求ID而不是AbortController
  const requestId = ++currentRequestId;
  
  console.log(`%cFetching data for indices: [${indices.join(', ')}]`, 'color: dodgerblue');
  
  const indicesToFetch = indices.filter(index => !dataCache.has(index));

  if (indicesToFetch.length === 0) {
    console.log('%c--> All requested items are already in cache.', 'color: orange');
    return indices.map(index => dataCache.get(index));
  }
  
  try {
    // 使用Promise.all和map直接处理所有请求，不再等待每个独立的Promise
    await Promise.all(indicesToFetch.map(i => 
      queue.add(() => {
        // 如果当前请求ID不再是最新的，则放弃这个任务
        if (requestId !== currentRequestId) return Promise.resolve();
        
        return new Promise<void>(resolve => {
          setTimeout(() => {
            // 生成数据但不再等待图片加载
            const aspectRatio = 0.7 + Math.random() * 0.6;
            const item = {
              id: i,
              index: i,
              title: `Image #${i + 1}`,
              color: COLORS[i % COLORS.length],
              aspectRatio: aspectRatio,
              imageUrl: `https://picsum.photos/seed/${i}/400/${Math.round(400 * aspectRatio)}`
            };
            dataCache.set(i, item);
            resolve();
          }, 20 + Math.random() * 50); // 减少延迟时间
        });
      })
    ));
    
    // 如果请求已过期，返回空数组
    if (requestId !== currentRequestId) {
      return [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }

  // 从缓存重构结果数组
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