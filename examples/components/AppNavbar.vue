<template>
  <nav class="app-nav">
    <div class="nav-container">
      <div class="nav-brand">
        <span class="brand-icon">🧱</span>
        <span class="brand-text">Masonry Demo</span>
      </div>
      <div class="nav-links">
        <!-- 选择功能组 -->
        <div class="nav-group">
          <span class="group-label">选择</span>
          <div class="group-links">
            <router-link to="/selection/basic" class="nav-link" title="基础选择">
              <span class="link-icon">✅</span>
              <span class="link-text">基础</span>
            </router-link>
            <router-link to="/selection/drag" class="nav-link" title="拖拽选择">
              <span class="link-icon">📦</span>
              <span class="link-text">拖拽</span>
            </router-link>
            <router-link to="/selection/test" class="nav-link" title="选择测试">
              <span class="link-icon">🎯</span>
              <span class="link-text">测试</span>
            </router-link>
          </div>
        </div>

        <!-- 布局功能组 -->
        <div class="nav-group">
          <span class="group-label">布局</span>
          <div class="group-links">
            <router-link to="/layout/adaptive" class="nav-link" title="自适应宽度">
              <span class="link-icon">📐</span>
              <span class="link-text">自适应</span>
            </router-link>
            <router-link to="/layout/data-provider" class="nav-link" title="数据提供者">
              <span class="link-icon">🔄</span>
              <span class="link-text">数据</span>
            </router-link>
            <router-link to="/layout/stress-test" class="nav-link" title="压力测试">
              <span class="link-icon">⚡</span>
              <span class="link-text">压力</span>
            </router-link>
          </div>
        </div>

        <!-- 展示功能组 -->
        <div class="nav-group">
          <span class="group-label">展示</span>
          <div class="group-links">
            <router-link to="/showcase/large-list" class="nav-link" title="大列表示例">
              <span class="link-icon">📋</span>
              <span class="link-text">大列表</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
// 导航栏组件，包含品牌标识和分组导航链接
</script>

<style scoped>
.app-nav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.app-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  position: relative;
  z-index: 1;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brand-icon {
  font-size: 1.3rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.brand-text {
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 16px;
  align-items: center;
}

.nav-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.group-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.group-links {
  display: flex;
  gap: 6px;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.8rem;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 2px;
  background: #fff;
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.link-icon {
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.link-text {
  font-weight: 600;
  letter-spacing: 0.2px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .nav-links {
    gap: 12px;
  }
  
  .group-links {
    gap: 4px;
  }
  
  .nav-link {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
  
  .link-icon {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 16px;
    height: 60px;
  }
  
  .nav-brand {
    font-size: 1rem;
  }
  
  .brand-icon {
    font-size: 1.2rem;
  }
  
  .nav-links {
    gap: 8px;
  }
  
  .group-label {
    font-size: 0.65rem;
  }
  
  .nav-link {
    padding: 5px 8px;
    font-size: 0.7rem;
  }
  
  .link-text {
    display: none;
  }
  
  .link-icon {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 12px;
  }
  
  .nav-brand .brand-text {
    display: none;
  }
  
  .nav-links {
    gap: 6px;
  }
  
  .group-links {
    gap: 2px;
  }
  
  .nav-link {
    padding: 4px 6px;
  }
  
  .link-icon {
    font-size: 0.9rem;
  }
}
</style> 