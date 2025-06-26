<template>
    <div class="text-block-card" ref="cardRef" :style="{ backgroundColor: item.color }">
        <h3>{{ item.title }}</h3>
        <p>{{ item.content }}</p>
        <div class="card-footer">
            ID: {{ item.id }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps } from 'vue';

interface Item {
  id: any;
  title: string;
  content: string;
  color: string;
}

const props = defineProps<{
    item: Item;
    onSizeChange: (update: { id: any; height: number }) => void;
}>();

const cardRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
    if (cardRef.value) {
        resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const newHeight = entry.contentRect.height;
                if (newHeight > 0) {
                     props.onSizeChange({ id: props.item.id, height: newHeight });
                }
            }
        });
        resizeObserver.observe(cardRef.value);
    }
});

onUnmounted(() => {
    if (resizeObserver && cardRef.value) {
        resizeObserver.unobserve(cardRef.value);
    }
});
</script>

<style scoped>
.text-block-card {
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
}
.text-block-card h3 {
    margin: 0 0 10px 0;
    font-size: 1.1em;
    word-break: break-word;
}
.text-block-card p {
    flex-grow: 1;
    margin: 0;
    font-size: 0.9em;
    line-height: 1.5;
    word-break: break-word;
}
.card-footer {
    margin-top: 10px;
    font-size: 0.8em;
    color: #666;
    border-top: 1px solid rgba(0,0,0,0.05);
    padding-top: 5px;
}
</style> 