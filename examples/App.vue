<template>
  <div class="app-shell">
    <AppNavbar />
    <main class="app-content">
      <router-view />
    </main>
    <footer class="app-footer">
      图片来自 <a href="https://picsum.photos/" target="_blank">Picsum Photos</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import AppNavbar from './components/AppNavbar.vue'
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.app-content {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}

.app-footer {
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
}

.app-footer a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.app-footer a:hover {
  color: #0056b3;
  text-decoration: underline;
}
</style> 