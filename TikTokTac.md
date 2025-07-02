## 📏 TikTokTac 管理规则

### 🔄 滚动规则
- **文档长度限制**: 最大200行，建议150行内
- **已完成循环**: 最多保留3个，其余移至 `archive/completed-cycles.md`
- **问题池**: 每类最多保留10个，解决的问题移至归档
- **技术债务**: 已清理项目移至归档，保持当前视图简洁

### 📋 滚动触发条件
**必须滚动** (任一条件满足):
- 文档行数 > 200行
- 已完成循环 > 3个
- 问题池单类 > 10个

**滚动操作**:
1. 已完成循环 → `archive/completed-cycles-[YYYY-MM].md`
2. 解决的问题 → `archive/solved-issues-[YYYY-MM].md`  
3. 清理的技术债务 → `archive/tech-debt-cleared-[YYYY-MM].md`
4. 在本文档末尾记录归档时间和位置

### ⏰ 维护周期
- **每日**: 更新当前Tik状态
- **每周**: 检查行数，必要时执行滚动
- **每月**: 整理归档，清理无效链接

---

## 🔄 当前循环状态

### 🔥 **Tik** ([状态]: 执行中🔧) 
**任务**: 架构升级与高级功能实现
**问题**: 当前组件在API丰富度和数据加载策略上与业界顶级方案存在差距。
**预计时间**: 12小时 | **开始时间**: [具体日期]
**执行状态**: [🔧执行中]

**🎯 核心目标**:
- [ ] **实现 `scrollToIndex` API**: 提升组件的程序化控制能力。
- [ ] **重构为"主动数据请求"架构**: 彻底解耦UI与数据，实现极致性能。

**📋 详细执行计划**:

- **阶段1**: 实现 `scrollToIndex` API (预计 2 小时) [⚪待开始]
  - [ ] **任务1.1**: 在 `VirtualMasonryGrid.vue` 中添加 `scrollToIndex` 和 `scrollToOptions` 两个 props。
  - [ ] **任务1.2**: 在 `VirtualMasonryGrid.vue` 中 `watch` 这两个 props 的变化。
  - [ ] **任务1.3**: 当 props 变化时，从 `useMasonryLayout` 的 `allItems` 中找到对应项的 `y` 坐标。
  - [ ] **任务1.4**: 调用 `scrollContainer.scrollTo()` 方法，并根据 `scrollToOptions` 实现对齐（如 `start`, `center`, `end`）。
  > 📄 **详细说明**: → `docs/feature-scrollToIndex.md` (待创建)

- **阶段2**: 重构为"主动数据请求"架构 (预计 10 小时) [⚪待开始]
  - [ ] **任务2.1**: **修改 `useMasonryLayout`**: 使其能处理包含"占位符"的 `items` 数组。占位符可能是一个只有 `id` 和 `index` 的简单对象。
  - [ ] **任务2.2**: **修改 `useVirtualization`**:
    -   识别出进入视口的"占位符"。
    -   计算出需要请求数据的索引范围。
    -   通过一个新的事件（如 `@request-data-for-range`）将范围发送出去。
  - [ ] **任务2.3**: **修改 `VirtualMasonryGrid.vue`**:
    -   移除旧的 `@load-more` 事件。
    -   添加新的 `@request-data-for-range` 事件。
    -   添加一个新的 `isDataLoadingComplete: boolean` prop，用于告知组件停止发送请求。
  - [ ] **任务2.4**: **重构 `StressTestExample.vue`**:
    -   在 `items` 数组中预先生成一百万个占位符。
    -   监听 `@request-data-for-range` 事件。
    -   在事件回调中模拟一次网络请求，然后用真实数据填充 `items` 数组中对应位置的占位符。
  > 📄 **详细说明**: → `docs/architecture-proactive-data-request.md` (待创建)

**🔗 相关文档**:
- **选择事件功能**: → `docs/selection-events-ttt.md`
- **技术方案**: → `docs/architecture-proactive-data-request.md` (待创建)
- **API设计**: → `docs/feature-scrollToIndex.md` (待创建)

### ⏳ **Tok** (待定执行)
*此阶段将在 Tik 计划获得批准后开始。*

### 📋 **Tak** (修正)  
*此阶段将在 Tok 执行完成后进行。*

---

## ✅ 已完成循环 (最多保留3个)

### **循环 #3**: 迁移项目到 TypeScript (已归档)
**任务**: 将 `src` 目录下的 JavaScript 文件迁移到 TypeScript。
**完成状态**: ⚠️ 已部分完成并归档，为更高优先级的任务让路。
**成果**: 
- ✅ 完成了部分工具函数的迁移。
> 📄 **备注**: 此任务可在未来重新激活。

### **循环 #2**: 修复瀑布流重叠 Bug 并重构核心算法 ✅
**任务**: 解决了瀑布流中因卡片高度动态变化导致的元素重叠问题，并对布局更新的核心算法进行了彻底重构。
**完成状态**: ✅ 成功诊断并修复了多个层级的 Bug，最终通过重写核心布局算法，彻底根除了问题。
**成果**:
- ✅ **架构升级**: 从"子组件上报"升级为"父组件驱动测量"，提高了系统的健壮性。
- ✅ **Bug 修复**: 修复了 `ResizeObserver` 竞态条件和 `layoutUpdateStamp` 信号丢失问题。
- ✅ **核心算法重构**: 在 `useMasonryLayout.ts` 中，用正确的"多米诺骨牌"式链式更新算法替换了原有的、有缺陷的高度差传播算法，确保了复杂场景下布局计算的绝对正确。
> 📄 **完整总结**: → `AInote.md` (2024-06-26 日志)

### **循环 #1**: 创建通用虚拟滚动组件 ✅
**任务**: 重构 `index.vue` 和 `assetsThumbnailCard.vue`，创建一个高度通用的虚拟列表/瀑布流组件 `VirtualMasonryGrid.vue`。
**完成状态**: ✅ 成果是一个高性能、高通用性的虚拟列表组件，逻辑清晰，并包含使用示例。
**成果**:
- ✅ `VirtualMasonryGrid.vue` 组件。
- ✅ `useMasonryLayout.js` 和 `useVirtualization.js` 逻辑分离。
- ✅ `ExampleApp.vue` 和 `ExampleCard.vue` 使用示例。
- ✅ **后续优化**: 实现了基于 `layout.js` 的二分查找和延迟批量更新，大幅提升性能。
> 📄 **完整总结**: → `AInote.md`

---

## 📋 问题池 (每类最多10个)

### 🔴 高优先级 (当前: 0/10)
*暂无高优先级问题*

### 🟡 中优先级 (当前: 0/10)
*暂无中优先级问题*

### 🟢 低优先级 (当前: 0/10)
*暂无低优先级问题*

### ✅ 已解决 (最近3个)
*暂无已解决问题*

### 🔧 正在解决
*暂无正在解决的问题*

---

## 🔗 功能模块文档

- **选择事件功能**: → `docs/selection-events-ttt.md` - 选择、点击、键盘导航等交互功能
- **架构设计**: → `docs/architecture-proactive-data-request.md` (待创建)
- **API文档**: → `docs/feature-scrollToIndex.md` (待创建)

---

## 📝 更新日志

- **2024-12-19**: 添加选择事件功能文档链接
- **2024-12-19**: 创建功能模块文档分类 