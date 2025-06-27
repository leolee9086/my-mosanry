<template>
  <div class="app-shell">
    <nav class="app-nav">
      <router-link to="/simple">Simple Example</router-link>
      <router-link to="/stress-test">Stress Test (1M)</router-link>
      <router-link to="/provider-test">DataProvider Test</router-link>
      <router-link to="/adaptive-width">Adaptive Width</router-link>
    </nav>
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// This component doesn't need any script logic.
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.app-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.app-nav a {
  margin: 0 15px;
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.app-nav a:hover {
  background-color: #f0f2f5;
}

.app-nav .router-link-active {
  color: #ffffff;
  background-color: #007bff;
}

.app-content {
  flex-grow: 1;
  overflow: hidden; /* Important for the child grid to control its own scrolling */
  position: relative;
}
</style> 