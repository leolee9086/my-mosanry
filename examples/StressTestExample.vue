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
        </div>
        <VirtualMasonryGrid
            class="grid-container"
            :items="items"
            :column-width="220"
            :gap="15"
            id-key="id"
            @load-more="loadMoreItems"
        >
            <template #default="{ item, onSizeChange, isScrolling }">
                <component 
                  :is="item.cardType" 
                  :item="item" 
                  :on-size-change="onSizeChange"
                  :is-scrolling="isScrolling"
                />
            </template>
        </VirtualMasonryGrid>
    </div>
</template>

<script setup lang="ts">
import { ref, markRaw, shallowRef } from 'vue';
import VirtualMasonryGrid from '../src/components/VirtualMasonryGrid.vue';
import ImageCard from './cards/ImageCard.vue';
import TextBlockCard from './cards/TextBlockCard.vue';

const TOTAL_ITEMS = 1_000_000;
const BATCH_SIZE = 100;
let itemIdCounter = 0;

const items = shallowRef<any[]>([]);
const isLoading = ref(false);

const cardComponents = markRaw([ImageCard, TextBlockCard]);

const generateItems = (count: number) => {
    if (items.value.length >= TOTAL_ITEMS) return [];
    
    const newItems = [];
    const limit = Math.min(count, TOTAL_ITEMS - items.value.length);

    for (let i = 0; i < limit; i++) {
        const id = `item-${itemIdCounter++}`;
        const cardIndex = Math.floor(Math.random() * cardComponents.length);
        const cardType = cardComponents[cardIndex];
        
        let itemData: any = {
            id: id,
            cardType: cardType,
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