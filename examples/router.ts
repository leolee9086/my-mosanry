import { createRouter, createWebHistory } from 'vue-router';
import ExampleApp from './ExampleApp.vue';
import StressTestExample from './StressTestExample.vue';
import DataProviderExample from './DataProviderExample.vue';
import AdaptiveWidthExample from './AdaptiveWidthExample.vue';
import SelectionExample from './SelectionExample.vue';
import SimpleSelectionTest from './SimpleSelectionTest.vue';
import SelectionBoxExample from './SelectionBoxExample.vue';

const routes = [
    { path: '/simple', component: ExampleApp, name: 'Simple' },
    { path: '/stress-test', component: StressTestExample, name: 'Stress Test (1M items)' },
    { path: '/provider-test', component: DataProviderExample, name: 'DataProvider Test' },
    { path: '/adaptive-width', component: AdaptiveWidthExample, name: 'Adaptive Width Test' },
    { path: '/selection', component: SelectionExample, name: 'Selection Test' },
    { path: '/simple-selection', component: SimpleSelectionTest, name: 'Simple Selection Test' },
    { path: '/selection-box', component: SelectionBoxExample, name: 'Selection Box Example' },
    { path: '/', redirect: '/simple' },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
}); 