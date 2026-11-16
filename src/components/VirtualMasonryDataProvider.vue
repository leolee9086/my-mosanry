<template>
  <VirtualMasonryGrid
    :key="gridKey"
    ref="gridRef"
    v-bind="$attrs"
    :mode="props.mode"
    :items="items"
    :estimated-total-count="estimatedCount"
    :managed-by-provider="true"
    @layout-viewport="stream.updateViewport"
    @scroll-settled="handleScrollSettled"
  >
    <template #default="slotProps"><slot name="default" v-bind="slotProps" /></template>
    <template #placeholder="slotProps"><slot name="placeholder" v-bind="slotProps" /></template>
  </VirtualMasonryGrid>
</template>

<script setup lang="ts">
import { computed, toRef, type VNodeProps, ref, watch } from 'vue';
import { useVirtualDataSource, type DataFetcher } from '../composables/useVirtualDataSource';
import { useStreamDataSource } from '../composables/useStreamDataSource';
import type { StreamDataSource } from '../composables/streamDataSource';
import VirtualMasonryGrid from './VirtualMasonryGrid.vue';

defineOptions({ inheritAttrs: false });
type GridProps = VNodeProps & InstanceType<typeof VirtualMasonryGrid>['$props'];
interface Props extends /* @vue-ignore */ Omit<GridProps, 'items' | 'estimatedTotalCount' | 'onScrollSettled'> {
  totalCount?: number;
  dataFetcher?: DataFetcher;
  sourceKey?: string | number;
  /** 布局模式更换时重建 Grid，保证旧引擎及观察器随作用域卸载。 */
  mode?: 'masonry' | 'grid' | 'justified' | 'list';
  /** source 与 totalCount/dataFetcher 两种策略互斥。流缓存由调用者的插件持有。 */
  source?: StreamDataSource;
}
const props = defineProps<Props>();
const gridRef = ref<InstanceType<typeof VirtualMasonryGrid> | null>(null);
watch(() => [props.source, props.dataFetcher, props.totalCount], () => {
  if (props.source) {
    if (props.dataFetcher !== undefined || props.totalCount !== undefined) throw new Error('source 不能与索引数据源配置混用');
  } else if (!props.dataFetcher || props.totalCount === undefined) {
    throw new Error('DataProvider 需要 source，或 totalCount 与 dataFetcher');
  }
}, { immediate: true });
const indexed = useVirtualDataSource({
  totalCount: computed(() => props.source ? 0 : props.totalCount ?? 0),
  dataFetcher: computed(() => props.dataFetcher ?? unavailableFetcher),
  sourceKey: toRef(props, 'sourceKey'),
});
const stream = useStreamDataSource(toRef(props, 'source'));
const items = computed(() => props.source ? stream.items.value : indexed.items.value);
const estimatedCount = computed(() => props.source ? stream.snapshot.value.count : props.totalCount);
const error = computed(() => props.source ? stream.snapshot.value.error : indexed.error.value);
const isFetching = computed(() => props.source ? stream.snapshot.value.status === 'receiving' : indexed.isFetching.value);
// 查询切换从顶部开始，旧 Grid 的观察器与排队布局跟随卸载；追加不改变 key。
const instance = ref(0);
watch(() => [props.source, props.sourceKey], () => { instance.value++; }, { flush: 'sync' });
const gridKey = computed(() => `${instance.value}:${props.mode ?? 'masonry'}:${props.source ? stream.snapshot.value.generation : 'indexed'}`);

async function unavailableFetcher(): Promise<never> {
  throw new Error('当前数据策略没有索引读取器');
}
async function handleScrollSettled(indices: number[]): Promise<void> {
  if (props.source || !indices.length) return;
  try {
    await indexed.requestDataForRange(indices);
  } catch (failure) {
    if (!(failure instanceof DOMException && failure.name === 'AbortError')) console.error('[VirtualMasonryDataProvider]', failure);
  }
}
defineExpose({ error, isFetching, reset: indexed.reset });
</script>
