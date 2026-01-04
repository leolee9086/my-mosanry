<template>
    <div class="stress-test-example">
        <div class="stats-bar">
            <span>总目标: {{ TOTAL_ITEMS.toLocaleString() }}</span>
            <span class="divider">|</span>
            <span>已加载: {{ itemsCount.toLocaleString() }}</span>
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
        <VirtualMasonryDataProvider
            class="grid-container"
            :total-count="TOTAL_ITEMS"
            :data-fetcher="fetchData"
            :column-width="220"
            :gap="15"
            :estimated-total-count="estimatedCount" 
            :scroll-to-index="finalTargetIndex"
            @scroll="handleScroll"
        >
            <template #default="{ item, isScrolling }">
                <component :is="item.cardType" :item="item" :is-scrolling="isScrolling" />
            </template>
            <template #placeholder="{ index }">
                <div class="placeholder-card" :style="{ backgroundColor: `hsl(${index % 360}, 70%, 95%)` }">
                    <div class="placeholder-content">加载中 #{{ index + 1 }}...</div>
                </div>
            </template>
        </VirtualMasonryDataProvider>
    </div>
</template>

<script setup lang="ts">
import { ref, markRaw, shallowRef, computed } from 'vue';
import VirtualMasonryDataProvider from '../../src/components/VirtualMasonryDataProvider.vue';
import ImageCard from '../cards/ImageCard.vue';
import TextBlockCard from '../cards/TextBlockCard.vue';

const TOTAL_ITEMS = 1_000_000;
const BATCH_SIZE = 50; // 单次批量加载量
const itemIdCounter = ref(0);

// 数据缓存 - 使用Map而不是数组以节省内存
const itemsCache = new Map();
const itemsCount = computed(() => itemsCache.size);

const isLoading = ref(false);
const estimatedCount = ref(TOTAL_ITEMS);

// 滚动到索引相关
const targetIndexInput = ref<number>(0);
const finalTargetIndex = ref<number | undefined>(undefined);

const cardComponents = markRaw([ImageCard, TextBlockCard]);

const scrollToTarget = () => {
    finalTargetIndex.value = targetIndexInput.value;
};

const handleScroll = (scrollTop: number, direction: string) => {
    // 可以在这里处理实时滚动事件
    // console.log(`滚动位置: ${scrollTop}, 方向: ${direction}`);
};

/**
 * 生成单个数据项
 */
const generateItem = (index: number) => {
    const id = `item-${index}`;
    const cardIndex = Math.floor(Math.random() * cardComponents.length);
    const cardType = cardComponents[cardIndex];

    let itemData: {
      id: string;
      index: number;
      cardType: any;
      title: string;
      color: string;
      imageUrl?: string;
      aspectRatio?: number;
      content?: string;
    } = {
        id: id,
        index: index,
        cardType: markRaw(cardType),
        title: `卡片 #${index + 1}`,
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

    return itemData;
};

/**
 * DataProvider数据获取函数
 */
const fetchData = async (indices: number[]) => {
    if (isLoading.value) {
        // 如果已经在加载中，返回缓存中已有的数据
        return indices.map(index => itemsCache.get(index)).filter(Boolean);
    }
    
    isLoading.value = true;
    console.log('🔍 开始加载数据，索引:', indices);

    try {
        // 过滤出需要生成的索引（尚未缓存的）
        const indicesToGenerate = indices.filter(index => !itemsCache.has(index) && index < TOTAL_ITEMS);
        
        if (indicesToGenerate.length === 0) {
            // 所有请求的项都已缓存
            return indices.map(index => itemsCache.get(index)).filter(Boolean);
        }
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        // 生成新数据并缓存
        indicesToGenerate.forEach(index => {
            const newItem = generateItem(index);
            itemsCache.set(index, newItem);
            
            // 更新计数器以保持ID唯一
            itemIdCounter.value = Math.max(itemIdCounter.value, index + 1);
        });
        
        // 返回所有请求的索引对应的数据
        return indices.map(index => itemsCache.get(index)).filter(Boolean);
    } finally {
        isLoading.value = false;
    }
};

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

.placeholder-card {
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 180px;
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