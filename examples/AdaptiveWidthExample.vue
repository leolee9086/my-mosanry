<template>
  <div class="adaptive-width-example-container">
    <div class="controls">
      <label>
        行高 (Row Height): {{ rowHeight }}px
        <input type="range" v-model.number="rowHeight" min="50" max="400" step="10" />
      </label>
      <label>
        间距 (Gap): {{ gap }}px
        <input type="range" v-model.number="gap" min="0" max="50" step="1" />
      </label>
    </div>
    <VirtualMasonryDataProvider
      v-if="show"
      :total-count="totalItems"
      :data-fetcher="fetchData"
      :id-key="'id'"
      :gap="gap"
      :row-height="rowHeight"
      :mode="'justified'"
    >
      <template #default="{ item }">
        <ImageCard :item="item" />
      </template>
      <template #placeholder>
        <div class="placeholder-card">
          <div class="placeholder-content">
            Loading...
          </div>
        </div>
      </template>
    </VirtualMasonryDataProvider>
  </div>
</template>

<script setup lang="ts">
import VirtualMasonryDataProvider from '../src/components/VirtualMasonryDataProvider.vue';
import ImageCard from './cards/ImageCard.vue';
import type { DataFetcher } from '../src/composables/useVirtualDataSource';
import { computed, ref } from 'vue';

const show = ref(true);
const gap = ref(10);
const rowHeight = ref(200);

const totalItems = 1_000;

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Proin sed.';

const dataCache = new Map<number, any>();

const fetchData: DataFetcher = async (indices: number[]) => {
  const indicesToFetch = indices.filter(index => !dataCache.has(index));
  if (indicesToFetch.length === 0) {
    return indices.map(index => dataCache.get(index));
  }

  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));

  indicesToFetch.forEach(i => {
    const aspectRatio = 0.7 + Math.random() * 0.6;
    const item = {
      id: i,
      index: i,
      title: `Item #${i + 1}`,
      aspectRatio,
      imageUrl: `https://picsum.photos/seed/${i}/400/${Math.round(400 / aspectRatio)}`
    };
    dataCache.set(i, item);
  });
  
  return indices.map(index => dataCache.get(index));
};
</script>

<style scoped>
.adaptive-width-example-container {
  padding: 1rem;
  font-family: sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.controls {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 2rem;
  align-items: center;
}
.placeholder-card {
  background-color: #f0f0f0;
  border-radius: 8px;
  width: 100%;
  height: 150px; /* A fixed height for placeholder is fine */
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