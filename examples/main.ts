import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import ExampleApp from './ExampleApp.vue';
import StressTestExample from './StressTestExample.vue';
import DataProviderExample from './DataProviderExample.vue';
import App from './App.vue';

const routes = [
    { path: '/simple', component: ExampleApp, name: 'Simple' },
    { path: '/stress-test', component: StressTestExample, name: 'Stress Test (1M items)' },
    { path: '/provider-test', component: DataProviderExample, name: 'DataProvider Test' },
    { path: '/', redirect: '/provider-test' },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app'); 