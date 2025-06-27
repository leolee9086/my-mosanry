# 这个区段由开发者编写,未经允许禁止AI修改

# 修改记录

## 2025-06-27

### `VirtualMasonryGrid.vue`

- **修复**: 修复了模板中对占位符数据的判断逻辑。
- **原因**: `v-if` 指令错误地检查了布局项 `item` 的 `isPlaceholder` 属性，而该属性实际存在于嵌套的 `item.data` 对象中。此错误导致占位符被当作真实数据传入默认插槽，从而在UI上显示为原始对象字符串。
- **变更**: 将 `<template v-if="item.isPlaceholder">` 修改为 `<template v-if="item.data && item.data.isPlaceholder">`，确保对占位符进行正确判断。 