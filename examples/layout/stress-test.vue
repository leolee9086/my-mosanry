<template>
    <div class="stress-test-example">
        <div class="stats-bar">
            <span>总目标: {{ TOTAL_ITEMS.toLocaleString() }}</span>
            <span class="divider">|</span>
            <span>已加载: {{ items.length.toLocaleString() }}</span>
            <span class="divider">|</span>
            <span :class="['status', isLoading ? 'loading' : 'idle']">
                状态: {{ isLoading ? '正在加载...' : '空闲' }}
            </span>
            <div class="controls">
                <label for="estimated-count">预估总数:</label>
                <input id="estimated-count" type="number" v-model.number="estimatedCount" />
            </div>
            <div class="controls">
                <label for="scroll-to-index">滚动到:</label>
                <input id="scroll-to-index" type="number" v-model.number="targetIndexInput" @keydown.enter="scrollToTarget" />
                <button @click="scrollToTarget">Go</button>
            </div>
        </div>
        <VirtualMasonryGrid class="grid-container" :items="items" :column-width="220" :gap="15" id-key="id"
            :estimated-total-count="estimatedCount" 
            :scroll-to-index="finalTargetIndex"
            @load-more="loadMoreItems"
            @scroll-settled="handleScrollSettled">
            <template #default="{ item, isScrolling }">
                <component :is="item.cardType" :item="item" :is-scrolling="isScrolling" />
            </template>
        </VirtualMasonryGrid>
    </div>
</template>

<script setup lang="ts">
import { ref, markRaw, shallowRef } from 'vue';
import VirtualMasonryGrid from '../../src/components/VirtualMasonryGrid.vue';
import ImageCard from '../cards/ImageCard.vue';
import TextBlockCard from '../cards/TextBlockCard.vue';

const TOTAL_ITEMS = 1_000_000;
const BATCH_SIZE = 100;
let itemIdCounter = 0;

const items = shallowRef<Array<{
  id: string;
  cardType: any;
  title: string;
  color: string;
  imageUrl?: string;
  aspectRatio?: number;
  content?: string;
}>>([]);
const isLoading = ref(false);
const estimatedCount = ref(TOTAL_ITEMS);

// @织: 新增，用于 scrollToIndex
const targetIndexInput = ref<number>(0);
const finalTargetIndex = ref<number | undefined>(undefined);

const cardComponents = markRaw([ImageCard, TextBlockCard]);

const scrollToTarget = () => {
    finalTargetIndex.value = targetIndexInput.value;
};

const handleScrollSettled = (visibleIndices: number[]) => {
    console.log('滚动停止，可见项索引:', visibleIndices);
};

const generateItems = (count: number) => {
    if (items.value.length >= TOTAL_ITEMS) return [];

    const newItems: Array<{
      id: string;
      cardType: any;
      title: string;
      color: string;
      imageUrl?: string;
      aspectRatio?: number;
      content?: string;
    }> = [];
    const limit = Math.min(count, TOTAL_ITEMS - items.value.length);

    for (let i = 0; i < limit; i++) {
        const id = `item-${itemIdCounter++}`;
        const cardIndex = Math.floor(Math.random() * cardComponents.length);
        const cardType = cardComponents[cardIndex];

        let itemData: {
          id: string;
          cardType: any;
          title: string;
          color: string;
          imageUrl?: string;
          aspectRatio?: number;
          content?: string;
        } = {
            id: id,
            cardType: markRaw(cardType),
            title: `卡片 #${itemIdCounter}`,
            color: `hsl(${Math.random() * 360}, 70%, 95%)`,
        };

        if (cardType === ImageCard) {
            const width = 250 + Math.floor(Math.random() * 200);
            const height = 250 + Math.floor(Math.random() * 200);
            itemData.imageUrl = `https://picsum.photos/seed/${id}/${width}/${height}`;
            itemData.aspectRatio = width / height;
        } else {
            itemData.content = '这是一段随机生成的文本内容，用来测试和填充卡片。'.repeat(Math.ceil(Math.random() * 10) + 2);
        }

        newItems.push(itemData);
    }
    return newItems;
};

const loadMoreItems = () => {
    if (isLoading.value || items.value.length >= TOTAL_ITEMS) {
        return;
    }
    isLoading.value = true;

    setTimeout(() => {
        const newItems = generateItems(BATCH_SIZE);
        items.value = [...items.value, ...newItems];
        isLoading.value = false;
    }, 100);
};

// 初始加载
loadMoreItems();

</script>

<style scoped>
.stress-test-example {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #f9f9f9;
}

.stats-bar {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background-color: #333;
    color: white;
    font-size: 14px;
    flex-shrink: 0;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    z-index: 10;
}

/* v- 加上下面这些样式 v- */
.stats-bar .controls {
    margin-left: 24px;
    display: flex;
    align-items: center;
}

.stats-bar .controls label {
    margin-right: 8px;
    font-size: 13px;
    color: #ccc;
}

.stats-bar .controls input {
    width: 100px;
    background-color: #555;
    border: 1px solid #777;
    color: white;
    border-radius: 4px;
    padding: 4px 8px;
    font-family: inherit;
}

.stats-bar .controls button {
    margin-left: 8px;
    background-color: #007bff;
    color: white;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
}

.stats-bar .controls button:hover {
    background-color: #0056b3;
}

.stats-bar .divider {
    margin: 0 12px;
    color: #666;
}

.stats-bar .status {
    margin-left: auto;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
}

.stats-bar .status.idle {
    color: #4caf50;
    background-color: rgba(76, 175, 80, 0.1);
}

.stats-bar .status.loading {
    color: #ff9800;
    background-color: rgba(255, 152, 0, 0.1);
}

.grid-container {
    flex: 1;
    position: relative;
}
</style>