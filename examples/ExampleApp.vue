<template>
    <div class="example-app">
        <div class="controls">
            <button @click="addItems">添加 50 个项目</button>
            <button @click="clearItems">清空</button>
        </div>
        <VirtualMasonryGrid
            class="grid-container"
            :items="items"
            :column-width="220"
            :gap="15"
            id-key="id"
            @load-more="addItems"
        >
            <template #default="{ item, isScrolling }">
                <TextBlockCard 
                    :item="item" 
                    :is-scrolling="isScrolling"
                />
            </template>
        </VirtualMasonryGrid>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VirtualMasonryGrid from '../src/components/VirtualMasonryGrid.vue';
import TextBlockCard from './cards/TextBlockCard.vue';

let itemIdCounter = 0;
const items = ref([]);

const generateItems = (count) => {
    const newItems = [];
    for (let i = 0; i < count; i++) {
        newItems.push({
            id: `item-${itemIdCounter++}`,
            title: `卡片 ${itemIdCounter}`,
            // 随机颜色和内容长度，以模拟真实世界的不同卡片
            color: `hsl(${Math.random() * 360}, 80%, 90%)`,
            content: '这是一些描述内容。'.repeat(Math.ceil(Math.random() * 10) + 1),
        });
    }
    return newItems;
};

const addItems = () => {
    items.value = [...items.value, ...generateItems(50)];
};

const clearItems = () => {
    items.value = [];
    itemIdCounter = 0;
};

// 初始加载
addItems();
</script>

<style>
/* 基础样式 */
body { font-family: sans-serif; }
.example-app {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.controls {
    padding: 10px;
    border-bottom: 1px solid #ccc;
}
.controls button {
    margin-right: 10px;
    padding: 5px 10px;
}
.grid-container {
    flex: 1;
    position: relative;
}
</style> 