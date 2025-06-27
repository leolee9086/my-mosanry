<template>
  <div class="text-card">
    <h3>{{ item.title }}</h3>
    <p>{{ item.content }}</p>
  </div>
</template>

<script setup lang="ts">
// 'defineProps' is a compiler macro and no longer needs to be imported.
// import { defineProps } from 'vue';

interface Item {
  id: any;
  title: string;
  content: string;
  color: string;
}

const props = defineProps<{
    item: Item;
}>();
</script>

<style scoped>
.text-card {
  width: 100%;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
  background-color: #f0f8ff;
  border: 1px solid #d4e7f7;
  border-radius: 8px;
  color: #333;
  overflow-wrap: break-word;
  display: flex;
  flex-direction: column;
}
h3 {
  margin: 0 0 8px 0;
  font-size: 1.1em;
  font-weight: 600;
}
p {
  margin: 0;
  font-size: 0.95em;
  line-height: 1.5;
  flex-grow: 1;
}
</style> 