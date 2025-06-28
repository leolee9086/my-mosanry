# My-Masonry

一个高性能、通用的 Vue 3 虚拟瀑布流/网格布局组件，专为处理大量数据而设计。

## 🚀 特性

### 核心功能
- **🎯 虚拟化渲染** - 只渲染视口内的元素，轻松处理数万级数据
- **📐 多种布局模式** - 支持瀑布流、网格、等宽等高三种布局
- **⚡ 高性能滚动** - 智能滚动优化，流畅处理快速滚动
- **🔄 无限加载** - 内置无限滚动加载机制
- **📱 响应式设计** - 自动适配容器宽度变化
- **🎨 高度自定义** - 灵活的插槽系统和样式定制

### 技术亮点
- **R-Tree 空间索引** - 高效的视口查询算法
- **双缓存布局引擎** - 平滑的布局更新体验
- **智能滚动观察** - 精确的滚动状态管理
- **虚拟滚动条** - 自定义滚动条实现
- **TypeScript 支持** - 完整的类型定义

## 📦 安装

```bash
npm install @leolee9086/my-masonry
```

## 🎯 快速开始

### 基础用法

```vue
<template>
  <VirtualMasonryGrid
    :items="items"
    :column-width="200"
    :gap="15"
    @load-more="loadMore"
  >
    <template #default="{ item, isScrolling }">
      <div class="card" :class="{ 'is-scrolling': isScrolling }">
        <h3>{{ item.title }}</h3>
        <p>{{ item.content }}</p>
      </div>
    </template>
  </VirtualMasonryGrid>
</template>

<script setup>
import { ref } from 'vue'
import { VirtualMasonryGrid } from '@leolee9086/my-masonry'

const items = ref([
  { id: 1, title: '卡片 1', content: '内容...' },
  { id: 2, title: '卡片 2', content: '内容...' },
  // ... 更多数据
])

const loadMore = () => {
  // 加载更多数据的逻辑
  console.log('加载更多数据')
}
</script>
```

### 不同布局模式

```vue
<!-- 瀑布流布局（默认） -->
<VirtualMasonryGrid :items="items" mode="masonry" />

<!-- 网格布局 -->
<VirtualMasonryGrid :items="items" mode="grid" :row-height="200" />

<!-- 等宽等高布局 -->
<VirtualMasonryGrid :items="items" mode="justified" />
```

## 📚 API 文档

### VirtualMasonryGrid Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | `any[]` | `[]` | 数据源数组 |
| `columnWidth` | `number` | `200` | 基础列宽（像素） |
| `rowHeight` | `number` | `200` | 行高（网格模式使用） |
| `gap` | `number` | `15` | 元素间距（像素） |
| `idKey` | `string` | `'id'` | 数据项的唯一标识字段 |
| `itemHeight` | `function` | `undefined` | 自定义高度计算函数 |
| `overscanBy` | `number` | `2` | 视口外预渲染的行数 |
| `estimatedTotalCount` | `number` | `undefined` | 预估总数据量 |
| `scrollToIndex` | `number` | `undefined` | 滚动到指定索引 |
| `scrollToOptions` | `ScrollIntoViewOptions` | `{}` | 滚动选项 |
| `mode` | `'masonry' \| 'grid' \| 'justified'` | `'masonry'` | 布局模式 |

### 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `load-more` | - | 触发无限加载 |
| `scroll-settled` | `visibleItemIndices: number[]` | 滚动停止时触发 |

### 插槽

| 插槽名 | 作用域参数 | 说明 |
|--------|------------|------|
| `default` | `{ item, index, isScrolling }` | 默认内容插槽 |
| `placeholder` | `{ item, index }` | 占位符插槽 |

### 暴露的方法

| 方法名 | 参数 | 说明 |
|--------|------|------|
| `ignoreScrollEventsFor` | `duration: number` | 忽略滚动事件指定时间 |
| `setTransitionEnabled` | `enabled: boolean` | 设置是否启用过渡动画 |

## 🎨 布局模式详解

### 1. 瀑布流布局 (Masonry)
最经典的瀑布流效果，元素高度自适应，形成参差不齐的视觉效果。

```vue
<VirtualMasonryGrid
  :items="items"
  mode="masonry"
  :column-width="200"
  :gap="15"
/>
```

### 2. 网格布局 (Grid)
固定行高的网格布局，适合展示统一规格的内容。

```vue
<VirtualMasonryGrid
  :items="items"
  mode="grid"
  :column-width="200"
  :row-height="200"
  :gap="15"
/>
```

### 3. 等宽等高布局 (Justified)
所有元素保持相同的高度，适合图片画廊等场景。

```vue
<VirtualMasonryGrid
  :items="items"
  mode="justified"
  :column-width="200"
  :gap="15"
/>
```

## 🔧 高级用法

### 自定义高度计算

```vue
<VirtualMasonryGrid
  :items="items"
  :item-height="(item, columnWidth) => {
    // 根据内容动态计算高度
    const aspectRatio = item.width / item.height
    return columnWidth / aspectRatio
  }"
/>
```

### 滚动到指定项

```vue
<template>
  <div>
    <button @click="scrollToItem(100)">滚动到第100项</button>
    <VirtualMasonryGrid
      :items="items"
      :scroll-to-index="targetIndex"
      :scroll-to-options="{ behavior: 'smooth' }"
    />
  </div>
</template>

<script setup>
const targetIndex = ref(-1)

const scrollToItem = (index) => {
  targetIndex.value = index
}
</script>
```

### 无限加载集成

```vue
<template>
  <VirtualMasonryGrid
    :items="items"
    @load-more="loadMore"
  >
    <template #default="{ item, isScrolling }">
      <Card :item="item" :is-scrolling="isScrolling" />
    </template>
  </VirtualMasonryGrid>
</template>

<script setup>
const items = ref([])
const loading = ref(false)

const loadMore = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const newItems = await fetchMoreData()
    items.value.push(...newItems)
  } finally {
    loading.value = false
  }
}
</script>
```

### 滚动状态优化

```vue
<template>
  <VirtualMasonryGrid :items="items">
    <template #default="{ item, isScrolling }">
      <div class="card" :class="{ 'is-scrolling': isScrolling }">
        <!-- 滚动时显示占位图，停止时显示真实图片 -->
        <img 
          v-if="!isScrolling" 
          :src="item.imageUrl" 
          :alt="item.title"
        />
        <div v-else class="placeholder">
          <!-- 占位内容 -->
        </div>
      </div>
    </template>
  </VirtualMasonryGrid>
</template>
```

## 📁 项目结构

```
src/
├── components/
│   ├── VirtualMasonryGrid.vue      # 主组件
│   └── VirtualMasonryDataProvider.vue  # 数据提供者组件
├── composables/
│   ├── useLayoutEngine.ts          # 布局引擎
│   ├── useVirtualization.ts        # 虚拟化逻辑
│   ├── useScrollObserver.ts        # 滚动观察
│   ├── useVirtualScrollbar.ts      # 虚拟滚动条
│   ├── useVirtualDataSource.ts     # 虚拟数据源
│   └── layout-engines/             # 布局引擎实现
│       ├── masonry/                # 瀑布流布局
│       ├── grid/                   # 网格布局
│       └── justified/              # 等宽等高布局
└── utils/                          # 工具函数
    ├── binarySearch.ts
    ├── createRafScheduler.ts
    ├── createSegmentTree.ts
    └── throttle.ts
```

## 🎯 性能优化建议

### 1. 合理设置 overscanBy
```vue
<!-- 对于复杂卡片，增加预渲染数量 -->
<VirtualMasonryGrid :overscan-by="5" />

<!-- 对于简单卡片，可以减少预渲染 -->
<VirtualMasonryGrid :overscan-by="1" />
```

### 2. 使用 isScrolling 状态
```vue
<template #default="{ item, isScrolling }">
  <div class="card">
    <!-- 滚动时使用轻量级渲染 -->
    <div v-if="isScrolling" class="skeleton" />
    <!-- 停止时渲染完整内容 -->
    <div v-else class="full-content">
      <img :src="item.image" />
      <p>{{ item.description }}</p>
    </div>
  </div>
</template>
```

### 3. 提供预估高度
```vue
<VirtualMasonryGrid
  :items="items"
  :item-height-estimate="300"
  :estimated-total-count="10000"
/>
```

## 🔍 示例项目

查看 `examples/` 目录下的完整示例：

- **基础示例** (`ExampleApp.vue`) - 简单的瀑布流展示
- **自适应宽度** (`AdaptiveWidthExample.vue`) - 响应式布局
- **数据提供者** (`DataProviderExample.vue`) - 虚拟数据源
- **压力测试** (`StressTestExample.vue`) - 大量数据性能测试

运行示例：
```bash
npm run dev
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
```bash
git clone <repository-url>
cd my-masonry
npm install
npm run dev
```

## 📄 许可证

MIT License

## 🙏 致谢

本项目灵感来源于 [masonic](https://github.com/jaredLunde/masonic) 项目，感谢其优秀的架构设计。

---

**Made with ❤️ by leolee9086** 