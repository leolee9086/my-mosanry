# 这个区段由开发者编写,未经允许禁止AI修改
本目录下的文件是项目的核心组合式函数，修改需极其谨慎。

# 修改记录

## 2025-06-28

### 布局引擎重构

- **重构**: 拆分大型 `useLayoutEngine.ts` 文件，改善代码可维护性和性能。
- **原因**: 原 `useLayoutEngine.ts` 文件达到650多行，包含三种布局模式的混合实现，职责不清晰，难以维护。
- **变更**:
  - 创建 `layout-engines` 子目录，采用模块化架构
  - 抽取公共类型定义到 `types.ts`
  - 抽取公共工具函数到 `layoutUtils.ts`
  - 按布局模式拆分为三个独立实现:
    - `useMasonryLayout.ts` - 瀑布流布局
    - `useGridLayout.ts` - 网格布局
    - `useJustifiedLayout.ts` - 对齐布局
  - 将主 `useLayoutEngine.ts` 简化为工厂函数，根据 `mode` 选择合适的布局引擎
- **好处**:
  - 更高的代码可维护性
  - 更清晰的责任分离
  - 更好的模块复用
  - 减小了每个文件的体积和复杂度

## 2025-06-27

### `useLayoutEngine.ts`

- **修复**: 修复了 `rebuildLayout` 函数在 `adaptiveWidth` (自适应宽度) 模式下的逻辑缺陷。
- **原因**: 当触发布局重建时（如容器宽度变化），`rebuildLayout` 函数没有为 `adaptiveWidth` 模式正确地重置布局状态。具体来说，它没有将 `totalHeight` 重置为 0，导致新计算出的项目被追加到了一个错误的、非常大的 `y` 坐标上，从而使它们在渲染后立即消失在视口之外。
- **变更**: 为 `rebuildLayout` 函数增加了 `adaptiveWidth` 模式的处理分支，在重新追加项目前，强制将 `totalHeight.value` 设置为 `0`，确保布局从头开始计算。同时统一了两种模式下的清空逻辑，增强了函数的健壮性。 