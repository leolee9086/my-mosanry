<template>
  <div class="image-card" :style="{ backgroundColor: item.color }">
    <img 
      :src="item.imageUrl" 
      :alt="item.title" 
      class="card-image"
      :style="{ aspectRatio: item.aspectRatio || 'auto' }"
    />
    <div class="card-content">
      <h4>{{ item.title }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
// 'defineProps' is a compiler macro and no longer needs to be imported.
// import { defineProps } from 'vue';

interface Item {
  id: any;
  title: string;
  color: string;
  imageUrl: string;
  aspectRatio: number;
}

const props = defineProps<{
  item: Item;
}>();
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