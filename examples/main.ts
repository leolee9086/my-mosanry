import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import ExampleApp from './ExampleApp.vue';
import StressTestExample from './StressTestExample.vue';
import App from './App.vue';

const routes = [
    { path: '/', component: App, children: [
        { path: '', redirect: '/simple' },
        { path: 'simple', component: ExampleApp, name: 'Simple' },
        { path: 'stress-test', component: StressTestExample, name: 'Stress Test (1M items)' },
    ]},
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app'); 