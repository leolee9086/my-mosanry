/* eslint-disable @typescript-eslint/no-explicit-any */
// 布局引擎工厂函数
import { useLayoutEngine } from '../useLayoutEngine';

// 类型定义
import { 
    BushItem, 
    LayoutItem, 
    LayoutColumn, 
    UseLayoutEngineOptions, 
    LayoutEngineResult 
} from './types';

// 通用工具函数
import {
    getShortestColumn,
    initializeColumns,
    calculateTotalHeight,
    createColumnCountComputed, 
    createScrollHeightComputed,
    createContentHeightComputed,
    createUpdateScheduler,
    setupItemsWatch
} from './layoutUtils';

// 瀑布流布局
import * as MasonryLayout from './masonry';

// 网格布局
import * as GridLayout from './grid';

// 对齐布局
import * as JustifiedLayout from './justified';

// 列表布局
import * as ListLayout from './list';

// 布局模式类型
type LayoutMode = 'masonry' | 'grid' | 'justified' | 'list';

// 类型必须用 export type 单独导出：isolatedModules 下把类型混进值导出，
// vue-tsc 生成声明文件时会报 TS1205，发布出去就没有 .d.ts。
export type {
    BushItem,
    LayoutItem,
    LayoutColumn,
    LayoutMode,
    UseLayoutEngineOptions,
    LayoutEngineResult,
};

export {
    // 布局引擎工厂
    useLayoutEngine,

    // 通用工具函数
    getShortestColumn,
    initializeColumns,
    calculateTotalHeight,
    createColumnCountComputed,
    createScrollHeightComputed,
    createContentHeightComputed,
    createUpdateScheduler,
    setupItemsWatch,
    
    // 布局引擎
    MasonryLayout,
    GridLayout,
    JustifiedLayout,
    ListLayout
}; 