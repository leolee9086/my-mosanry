<template>
    <div class="text-block-card" :style="{ backgroundColor: item.color }">
        <h3>{{ item.title }}</h3>
        <p>{{ item.content }}</p>
        <div class="card-footer">
            ID: {{ item.id }}
        </div>
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