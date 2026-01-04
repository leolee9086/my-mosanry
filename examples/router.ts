import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    // 选择功能示例
    { 
        path: '/selection/basic', 
        component: () => import('./selection/basic-selection.vue'), 
        name: '基础选择' 
    },
    { 
        path: '/selection/drag', 
        component: () => import('./selection/drag-selection.vue'), 
        name: '拖拽选择' 
    },
    { 
        path: '/selection/test', 
        component: () => import('./selection/selection-test.vue'), 
        name: '选择测试' 
    },
    
    // 布局功能示例
    { 
        path: '/layout/adaptive', 
        component: () => import('./layout/adaptive-width.vue'), 
        name: '自适应宽度' 
    },
    { 
        path: '/layout/data-provider', 
        component: () => import('./layout/data-provider.vue'), 
        name: '数据提供者' 
    },
    { 
        path: '/layout/stress-test', 
        component: () => import('./layout/stress-test.vue'), 
        name: '压力测试' 
    },
    
    // 展示功能示例
    { 
        path: '/showcase/large-list', 
        component: () => import('./showcase/large-list/large-list-example.vue'), 
        name: '大列表示例' 
    },
    
    // 调试功能示例
    { 
        path: '/debug/list-dynamic-load', 
        component: () => import('./debug-list-dynamic-load.vue'), 
        name: '列表动态加载调试' 
    },
    { 
        path: '/debug/masonry-dynamic-load', 
        component: () => import('./debug-masonry-dynamic-load.vue'), 
        name: '瀑布流动态加载调试' 
    },
    
    // 默认重定向
    { path: '/', redirect: '/selection/basic' },
    { path: '/selection', redirect: '/selection/basic' },
    { path: '/layout', redirect: '/layout/adaptive' },
    { path: '/showcase', redirect: '/showcase/large-list' },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
}); 