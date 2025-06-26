<template>
  <div class="image-card" ref="cardRef" :style="{ backgroundColor: item.color }">
    <img 
      :src="item.imageUrl" 
      :alt="item.title" 
      @load="onImageLoad" 
      class="card-image"
      :style="{ aspectRatio: item.aspectRatio || 'auto' }"
    />
    <div class="card-content">
      <h4>{{ item.title }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, Ref } from 'vue';

interface Item {
  id: any;
  title: string;
  color: string;
  imageUrl: string;
  aspectRatio: number;
}

const props = defineProps<{
  item: Item;
  onSizeChange: (update: { id: any; height: number }) => void;
}>();

const cardRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let lastReportedHeight = 0;

const reportSize = () => {
  if (cardRef.value) {
    const newHeight = cardRef.value.getBoundingClientRect().height;
    if (newHeight > 0 && Math.abs(newHeight - lastReportedHeight) > 1) {
      lastReportedHeight = newHeight;
      props.onSizeChange({ id: props.item.id, height: newHeight });
    }
  }
};

const onImageLoad = () => {
  reportSize();
};

onMounted(() => {
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(reportSize);
    resizeObserver.observe(cardRef.value);
  }
  // For cached images that might not fire a load event
  const img = cardRef.value?.querySelector('img');
  if (img?.complete) {
    reportSize();
  }
});

onUnmounted(() => {
  if (resizeObserver && cardRef.value) {
    resizeObserver.unobserve(cardRef.value);
  }
});
</script>

<style scoped>
.image-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-image {
  display: block;
  width: 100%;
  height: auto;
  background-color: #eee;
}
.card-content {
  padding: 12px;
}
.card-content h4 {
  margin: 0;
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 