# 选择系统ECS架构设计

## 🎯 设计目标

基于Entity-Component-System (ECS) 架构模式，设计一个通用的、可复用的选择交互系统，使其能够：

1. **解耦选择逻辑与UI组件**：选择逻辑独立于具体的容器组件
2. **支持多种容器类型**：不仅限于VirtualMasonryGrid，还可用于其他列表组件
3. **提供统一的选择API**：标准化的选择事件和状态管理
4. **支持复杂的交互模式**：单选、多选、键盘导航、拖拽选择等

## 🏗️ ECS架构概览

### Entity（实体）
- **SelectableEntity**: 可选择的数据项
- **SelectionGroupEntity**: 选择组，用于管理相关选择项
- **SelectionContextEntity**: 选择上下文，管理全局选择状态

### Component（组件）
- **SelectableComponent**: 标记实体为可选择的
- **SelectedComponent**: 标记实体为已选择的
- **SelectionStateComponent**: 存储选择状态信息
- **SelectionGroupComponent**: 标记实体所属的选择组
- **KeyboardNavigableComponent**: 标记实体支持键盘导航
- **ClickableComponent**: 标记实体支持点击交互

### System（系统）
- **SelectionSystem**: 核心选择逻辑处理
- **KeyboardNavigationSystem**: 键盘导航处理
- **ClickHandlerSystem**: 点击事件处理
- **DragSelectionSystem**: 拖拽选择处理
- **SelectionEventSystem**: 选择事件分发

## 📋 核心类型定义

```typescript
// 实体ID类型
type EntityId = string | number;

// 选择模式
type SelectionMode = 'single' | 'multiple' | 'range';

// 选择状态
interface SelectionState {
  selectedIds: Set<EntityId>;
  focusedId: EntityId | null;
  selectionMode: SelectionMode;
  isSelecting: boolean;
  lastSelectedId: EntityId | null;
}

// 选择事件
interface SelectionEvent {
  type: 'select' | 'deselect' | 'focus' | 'blur' | 'clear';
  entityId: EntityId;
  data?: any;
  source: 'click' | 'keyboard' | 'programmatic' | 'drag';
}

// 选择组件Props
interface SelectableComponentProps {
  entityId: EntityId;
  data: any;
  selectable?: boolean;
  disabled?: boolean;
  groupId?: string;
}

// 选择上下文Props
interface SelectionContextProps {
  mode?: SelectionMode;
  allowEmpty?: boolean;
  onSelectionChange?: (event: SelectionEvent) => void;
  onFocusChange?: (entityId: EntityId | null) => void;
}
```

## 🔧 系统实现架构

### 1. SelectionSystem（选择系统）

```typescript
class SelectionSystem {
  private state: SelectionState;
  private eventBus: EventBus;
  
  // 核心方法
  select(entityId: EntityId, source: string): void;
  deselect(entityId: EntityId, source: string): void;
  toggle(entityId: EntityId, source: string): void;
  clear(source: string): void;
  selectRange(fromId: EntityId, toId: EntityId): void;
  
  // 状态查询
  isSelected(entityId: EntityId): boolean;
  getSelectedIds(): EntityId[];
  getFocusedId(): EntityId | null;
}
```

### 2. KeyboardNavigationSystem（键盘导航系统）

```typescript
class KeyboardNavigationSystem {
  private selectionSystem: SelectionSystem;
  private navigableEntities: Map<EntityId, NavigableEntity>;
  
  // 键盘事件处理
  handleKeyDown(event: KeyboardEvent): void;
  navigateNext(): void;
  navigatePrevious(): void;
  navigateToFirst(): void;
  navigateToLast(): void;
  
  // 批量选择
  selectRangeWithShift(direction: 'next' | 'previous'): void;
  selectAll(): void;
}
```

### 3. ClickHandlerSystem（点击处理系统）

```typescript
class ClickHandlerSystem {
  private selectionSystem: SelectionSystem;
  
  // 点击事件处理
  handleClick(entityId: EntityId, event: MouseEvent): void;
  handleDoubleClick(entityId: EntityId, event: MouseEvent): void;
  handleContextMenu(entityId: EntityId, event: MouseEvent): void;
  
  // 修饰键处理
  handleClickWithModifier(entityId: EntityId, event: MouseEvent): void;
}
```

## 🎨 组件设计

### SelectionProvider（选择提供者）

```vue
<template>
  <div class="selection-provider">
    <slot :selection-api="selectionApi" />
  </div>
</template>

<script setup lang="ts">
import { provide, reactive } from 'vue';
import { useSelectionSystem } from '../composables/useSelectionSystem';

const props = defineProps<SelectionContextProps>();
const selectionSystem = useSelectionSystem(props);

// 提供选择上下文
provide('selection-context', {
  system: selectionSystem,
  state: selectionSystem.state,
  api: selectionSystem.api
});
</script>
```

### SelectableItem（可选择项）

```vue
<template>
  <div 
    class="selectable-item"
    :class="{ 
      'selected': isSelected,
      'focused': isFocused,
      'disabled': disabled 
    }"
    @click="handleClick"
    @keydown="handleKeyDown"
    tabindex="0"
  >
    <slot :is-selected="isSelected" :is-focused="isFocused" />
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue';
import { useSelectableItem } from '../composables/useSelectableItem';

const props = defineProps<SelectableComponentProps>();
const { isSelected, isFocused, handleClick, handleKeyDown } = useSelectableItem(props);
</script>
```

## 🔄 事件总线设计

```typescript
class SelectionEventBus {
  private listeners: Map<string, Set<Function>>;
  
  // 事件订阅
  subscribe(eventType: string, callback: Function): () => void;
  
  // 事件发布
  publish(event: SelectionEvent): void;
  
  // 事件类型
  static EVENTS = {
    SELECTION_CHANGE: 'selection-change',
    FOCUS_CHANGE: 'focus-change',
    SELECTION_START: 'selection-start',
    SELECTION_END: 'selection-end'
  };
}
```

## 🎯 使用示例

### 基础用法

```vue
<template>
  <SelectionProvider :mode="'multiple'" @selection-change="handleSelectionChange">
    <VirtualMasonryGrid :items="items">
      <template #default="{ item }">
        <SelectableItem :entity-id="item.id" :data="item">
          <template #default="{ isSelected, isFocused }">
            <div class="card">
              <div class="selection-indicator" v-if="isSelected">✓</div>
              <div class="content">{{ item.title }}</div>
            </div>
          </template>
        </SelectableItem>
      </template>
    </VirtualMasonryGrid>
  </SelectionProvider>
</template>
```

### 高级用法

```vue
<template>
  <SelectionProvider 
    :mode="'range'" 
    :allow-empty="false"
    @selection-change="handleSelectionChange"
    @focus-change="handleFocusChange"
  >
    <div class="toolbar">
      <button @click="selectAll">全选</button>
      <button @click="clearSelection">清空</button>
      <button @click="deleteSelected">删除选中</button>
    </div>
    
    <VirtualMasonryGrid :items="items">
      <template #default="{ item }">
        <SelectableItem 
          :entity-id="item.id" 
          :data="item"
          :disabled="item.locked"
        >
          <template #default="{ isSelected, isFocused }">
            <CardComponent 
              :item="item"
              :selected="isSelected"
              :focused="isFocused"
            />
          </template>
        </SelectableItem>
      </template>
    </VirtualMasonryGrid>
  </SelectionProvider>
</template>
```

## 🚀 性能优化

1. **虚拟化兼容性**：选择状态独立于DOM渲染，支持虚拟化
2. **事件委托**：使用事件委托减少事件监听器数量
3. **状态缓存**：缓存选择状态，避免重复计算
4. **批量更新**：支持批量选择操作，减少重渲染

## 🔗 扩展性

1. **自定义选择指示器**：支持自定义选择框样式
2. **选择策略插件**：支持自定义选择逻辑
3. **事件钩子**：提供丰富的事件钩子供扩展
4. **状态持久化**：支持选择状态的本地存储

这个ECS架构设计为选择系统提供了良好的解耦性、可扩展性和可维护性，使其能够轻松集成到各种容器组件中。 