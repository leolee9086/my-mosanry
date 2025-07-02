<template>
  <div class="selection-box-example">
    <h3>选择框示例</h3>

    <!-- 控制面板 -->
    <div class="controls">
      <button @click="startSelection">开始选择</button>
      <button @click="stopSelection">停止选择</button>
      <button @click="clearSelection">清空选择</button>
      <label>
        <input type="checkbox" v-model="enableSpatialSelection" />
        启用空间选择器
      </label>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <span class="label">鼠标坐标:</span>
        <span class="value">({{ mousePosition.x }}, {{ mousePosition.y }})</span>
      </div>
      <div class="status-item">
        <span class="label">选择框:</span>
        <span class="value">({{ selectionBoxState?.left || 0 }}, {{ selectionBoxState?.top || 0 }}) {{
          selectionBoxState?.width || 0 }}×{{ selectionBoxState?.height || 0 }}</span>
      </div>
      <div class="status-item">
        <span class="label">已选择:</span>
        <span class="value">{{ selectedIds?.length || 0 }} 个</span>
      </div>
      <div class="status-item">
        <span class="label">焦点:</span>
        <span class="value">{{ focusedId || '无' }}</span>
      </div>
      <div class="status-item">
        <span class="label">模式:</span>
        <span class="value">{{ selectionMode }}</span>
      </div>
      <div class="status-item">
        <span class="label">空间选择器:</span>
        <span class="value">{{ enableSpatialSelection ? '启用' : '禁用' }}</span>
      </div>
      <div class="status-item">
        <span class="label">API状态:</span>
        <span class="value">{{ currentSelectionApi ? '可用' : '未初始化' }}</span>
      </div>
      <div class="status-item">
        <span class="label">目标数量:</span>
        <span class="value">{{ items.length }} 个</span>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-layout">
      <!-- 左侧目标状态面板 -->
      <div class="target-status-panel">
        <h4>目标状态</h4>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>可选</th>
              <th>已选</th>
              <th>焦点</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.id }}</td>
              <td>是</td>
              <td>{{ isItemSelected(item.id) ? '✔' : '' }}</td>
              <td>{{ isItemFocused(item.id) ? '✔' : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <SelectionBoxProvider ref="selectionBoxRef" :mode="selectionMode"
        :enable-spatial-selection="enableSpatialSelection" :enable-drag-selection="true"
        :enable-keyboard-selection="true" @selection-change="handleSelectionChange" @focus-change="handleFocusChange"
        @selection-box-change="handleSelectionBoxChange" @selection-box-start="handleSelectionBoxStart"
        @selection-box-update="handleSelectionBoxUpdate" @selection-box-end="handleSelectionBoxEnd"
        style="position: relative;display: flex;">
        <template #default="{ selectionApi, selectionBox, selectionBoxStyle }">
          <!-- 右侧网格内容 -->
          <div class="main-content">
            <div class="content-area">
              <div class="grid-container">
                <div v-for="item in items" :key="item.id" :data-selectable="true" :data-id="item.id" class="grid-item"
                  :class="{
                    'selected': selectionApi?.isSelected?.(item.id),
                    'focused': selectionApi?.isFocused?.(item.id)
                  }" @click="handleItemClick(item.id, $event)">
                  <div class="item-content">
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.description }}</p>
                    <div class="item-meta">
                      ID: {{ item.id }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <!-- 选择框插槽 -->
        <template #selection-box="{ selectionBox, selectionBoxStyle }">
          <SelectionBox :visible="selectionBox?.visible" :is-selecting="selectionBox?.isSelecting"
            :selection-box-state="selectionBox" :z-index="1000">
            <!-- 自定义选择框内容 -->
          </SelectionBox>
        </template>
      </SelectionBoxProvider>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import SelectionBoxProvider from '../src/components/selectionBoxProvider.vue';
import SelectionBox from '../src/components/SelectionBox.vue';

// 响应式状态
const selectionBoxRef = ref<InstanceType<typeof SelectionBoxProvider> | null>(null);
const selectionMode = ref<'single' | 'multiple' | 'range'>('multiple');
const enableSpatialSelection = ref(false);
const selectedIds = ref<(string | number)[]>([]);
const focusedId = ref<string | number | null>(null);
const mousePosition = reactive({ x: 0, y: 0 });
const selectionBoxState = reactive({
  visible: false,
  isSelecting: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  selectedElements: [] as Element[],
});

// 示例数据
const items = ref(Array.from({ length: 20 }, (_, i) => ({
  id: `item-${i + 1}`,
  title: `项目 ${i + 1}`,
  description: `这是第 ${i + 1} 个项目的描述信息`,
})));

// 计算属性 - 获取当前选择状态
const currentSelectionApi = computed(() => {
  return selectionBoxRef.value?.selectionApi || null;
});

// 鼠标位置跟踪
const handleMouseMove = (event: MouseEvent) => {
  mousePosition.x = event.clientX;
  mousePosition.y = event.clientY;
};

// 事件处理
const handleSelectionChange = (event: any) => {
  // 根据事件类型更新选择状态
  if (event.type === 'select') {
    if (event.entityId) {
      // 单个选择
      if (!selectedIds.value.includes(event.entityId)) {
        selectedIds.value.push(event.entityId);
      }
    } else {
      // 批量选择，需要从selectionApi获取当前选择状态
      if (selectionBoxRef.value && selectionBoxRef.value.selectionApi) {
        selectedIds.value = selectionBoxRef.value.selectionApi.getSelectedIds();
      }
    }
  } else if (event.type === 'deselect') {
    // 取消选择
    selectedIds.value = selectedIds.value.filter(id => id !== event.entityId);
  } else if (event.type === 'clear') {
    // 清空选择
    selectedIds.value = [];
  }

  console.log('选择变化:', event);
};

const handleFocusChange = (entityId: string | number | null) => {
  focusedId.value = entityId;
  console.log('焦点变化:', entityId);
};

const handleSelectionBoxChange = (selectionBox: any) => {
  if (selectionBox) {
    Object.assign(selectionBoxState, selectionBox);
  }
  console.log('选择框变化:', selectionBox);
};

const handleSelectionBoxStart = (event: MouseEvent) => {
  console.log('开始选择框:', event);
};

const handleSelectionBoxUpdate = (event: MouseEvent) => {
  console.log('更新选择框:', event);
};

const handleSelectionBoxEnd = (event: MouseEvent) => {
  console.log('结束选择框:', event);
};

const handleItemClick = (id: string | number, event: MouseEvent) => {
  if (selectionBoxRef.value?.selectionApi) {
    selectionBoxRef.value.selectionApi.toggle(id);
  }
};

// 控制方法
const startSelection = () => {
  if (selectionBoxRef.value && selectionBoxRef.value.startSelectionBox) {
    selectionBoxRef.value.startSelectionBox();
  }
};

const stopSelection = () => {
  if (selectionBoxRef.value && selectionBoxRef.value.stopSelectionBox) {
    selectionBoxRef.value.stopSelectionBox();
  }
};

const clearSelection = () => {
  if (selectionBoxRef.value && selectionBoxRef.value.selectionApi) {
    selectionBoxRef.value.selectionApi.clear();
  }
};

const selectAllInBox = (selectionBox: any) => {
  if (selectionBox && selectionBox.selectedElements) {
    const ids = selectionBox.selectedElements.map(el =>
      el.getAttribute('data-id') || el.id
    );
    selectionBoxRef.value?.selectionApi.selectEntities(ids);
  }
};

const invertSelection = () => {
  if (selectionBoxRef.value && selectionBoxRef.value.selectionApi) {
    selectionBoxRef.value.selectionApi.invertSelection();
  }
};

// 生命周期
onMounted(() => {
  // 初始化焦点
  if (selectionBoxRef.value && selectionBoxRef.value.selectionApi) {
    selectionBoxRef.value.selectionApi.navigateToFirst();
  }

  // 添加全局鼠标移动监听
  document.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  // 移除鼠标移动监听
  document.removeEventListener('mousemove', handleMouseMove);
});

// 辅助函数 - 检查项目是否被选中
const isItemSelected = (id: string | number) => {
  const api = currentSelectionApi.value;
  return api ? api.isSelected(id) : false;
};

// 辅助函数 - 检查项目是否被聚焦
const isItemFocused = (id: string | number) => {
  const api = currentSelectionApi.value;
  return api ? api.isFocused(id) : false;
};
</script>

<style scoped>
.selection-box-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.controls button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.controls button:hover {
  background: #f0f0f0;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.status-bar {
  display: flex;
  gap: 20px;
  padding: 10px;
  background: #e9ecef;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-item .label {
  font-weight: 600;
  color: #495057;
}

.status-item .value {
  color: #6c757d;
  font-family: monospace;
}

.main-layout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.target-status-panel {
  min-width: 220px;
  max-width: 260px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-right: 20px;
  padding: 12px 8px 12px 12px;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid #e9ecef;
}

.target-status-panel h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

.target-status-panel table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.target-status-panel th,
.target-status-panel td {
  border: 1px solid #dee2e6;
  padding: 4px 6px;
  text-align: center;
}

.target-status-panel th {
  background: #e9ecef;
  font-weight: 600;
  color: #495057;
  font-size: 11px;
}

.target-status-panel td {
  background: white;
  color: #6c757d;
}

.target-status-panel td:first-child {
  font-weight: 500;
  color: #495057;
  text-align: left;
}

.target-status-panel tr:hover td {
  background: #f8f9fa;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.content-area {
  position: relative;
  min-height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  padding: 20px;
}

.grid-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

.grid-item.selected {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.grid-item.focused {
  border-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.item-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.item-content p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.item-meta {
  font-size: 11px;
  color: #999;
}

.custom-selection-box {
  position: absolute;
  top: -40px;
  left: 0;
  right: 0;
  background: rgba(0, 123, 255, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-info {
  font-weight: 500;
}

.selection-actions {
  display: flex;
  gap: 8px;
}

.selection-actions button {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  background: transparent;
  color: white;
  font-size: 11px;
  cursor: pointer;
}

.selection-actions button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>