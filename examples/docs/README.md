# Masonry 组件示例

## 📋 概述

本目录包含了 Masonry 组件的各种使用示例，展示了虚拟瀑布流布局、选择系统、数据加载等核心功能。

## 🚀 快速开始

### 选择功能示例
- **基础选择** (`selection/basic-selection.vue`): 点击、键盘导航选择
- **拖拽选择** (`selection/drag-selection.vue`): 鼠标拖拽框选
- **选择测试** (`selection/selection-test.vue`): 完整选择功能测试

### 布局功能示例
- **自适应宽度** (`layout/adaptive-width.vue`): 响应式布局
- **数据提供者** (`layout/data-provider.vue`): 虚拟滚动数据加载
- **压力测试** (`layout/stress-test.vue`): 大量数据性能测试

## 📖 示例详细说明

### 选择功能

#### 基础选择 (basic-selection.vue)
**功能特性**:
- 点击选择/取消选择
- 键盘导航（方向键、空格、回车）
- 全选/清空选择
- 选择状态可视化

**使用场景**:
- 文件管理器
- 图片库选择
- 列表项批量操作

#### 拖拽选择 (drag-selection.vue)
**功能特性**:
- 鼠标拖拽框选
- 空间选择器（高性能元素检测）
- 拖拽方向检测（左→右框选，右→左相交）
- 实时选择预览

**使用场景**:
- 桌面应用界面
- 图形编辑器
- 数据表格选择

#### 选择测试 (selection-test.vue)
**功能特性**:
- 完整的选择功能测试
- 已选择项目面板
- 焦点管理
- 项目移除功能

**使用场景**:
- 功能验证
- 开发调试
- 用户培训

### 布局功能

#### 自适应宽度 (adaptive-width.vue)
**功能特性**:
- 响应式列数调整
- 容器宽度自适应
- 平滑布局过渡

**使用场景**:
- 响应式网站
- 移动端适配
- 多设备兼容

#### 数据提供者 (data-provider.vue)
**功能特性**:
- 虚拟滚动数据加载
- 无限滚动
- 数据缓存管理
- 加载状态处理

**使用场景**:
- 社交媒体信息流
- 电商商品列表
- 大数据展示

#### 压力测试 (stress-test.vue)
**功能特性**:
- 大量数据渲染测试
- 性能监控
- 内存使用分析
- 滚动性能测试

**使用场景**:
- 性能基准测试
- 极限场景验证
- 优化效果评估

## 🛠️ 开发指南

### 组件使用

#### 基础用法
```vue
<template>
  <VirtualMasonryGrid
    :items="items"
    :column-width="200"
    :gap="10"
  >
    <template #default="{ item }">
      <div class="item">{{ item.title }}</div>
    </template>
  </VirtualMasonryGrid>
</template>
```

#### 选择功能集成
```vue
<template>
  <SelectionWrapper
    :mode="'multiple'"
    :enable-mouse-selection="true"
    :enable-keyboard-selection="true"
    @selection-change="handleSelectionChange"
  >
    <template #default="{ selectionApi }">
      <VirtualMasonryGrid :items="items">
        <template #default="{ item }">
          <div 
            :class="{ selected: selectionApi.isSelected(item.id) }"
            :data-selectable="true"
            :data-id="item.id"
          >
            {{ item.title }}
          </div>
        </template>
      </VirtualMasonryGrid>
    </template>
  </SelectionWrapper>
</template>
```

### API 参考

#### VirtualMasonryGrid Props
- `items`: 数据项数组
- `column-width`: 列宽度
- `gap`: 间距
- `id-key`: 唯一标识字段
- `layout-engine`: 布局引擎类型

#### SelectionWrapper Props
- `mode`: 选择模式 ('single' | 'multiple' | 'range')
- `enable-mouse-selection`: 启用鼠标选择
- `enable-keyboard-selection`: 启用键盘选择
- `enable-spatial-selection`: 启用空间选择

### 最佳实践

#### 性能优化
1. **合理设置列宽**: 避免频繁的布局重计算
2. **使用虚拟滚动**: 大数据量时启用虚拟化
3. **优化图片加载**: 使用懒加载和预加载
4. **避免频繁更新**: 批量更新数据项

#### 用户体验
1. **提供加载状态**: 数据加载时显示加载指示器
2. **平滑动画**: 使用CSS过渡提升视觉体验
3. **响应式设计**: 适配不同屏幕尺寸
4. **键盘支持**: 提供完整的键盘导航

#### 代码组织
1. **组件分离**: 将复杂逻辑拆分为独立组件
2. **类型安全**: 使用TypeScript定义接口
3. **错误处理**: 添加适当的错误边界
4. **测试覆盖**: 为关键功能编写测试

## 📝 变更记录

详细的变更记录请查看 `changelog.md` 文件。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。 