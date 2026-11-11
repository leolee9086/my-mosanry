# npm 首次发布准备

时间：2026-11-11（本机）。位置：D:/dev/my-mosanry；关联项目 D:/dev/SAC-FileBrowser。

意图：补上 @leolee9086/my-masonry 的 npm 正式发布，再让 SAC 使用正式版本，不再因 file:../my-mosanry 的仓库外路径改造发布流程。

结果：npm registry 查询包返回 404；npm whoami 返回 E401，已请哥哥在本机登录，没有读取凭据。尚未执行 npm publish。

已修正发布配置：prepack 同时构建 JS 和类型，避免 Vite 清空 dist 后丢类型；UMD require 入口使用 .cjs，匹配 type:module；发布仅包含 dist、README 和 LICENSE，不包含旧源码副本与内部笔记；publishConfig.access 为 public。README 补上 CSS import。

已执行：pnpm run build、pnpm run build:types、ESM import 和 CJS require 的 VirtualMasonryGrid 入口检查、pnpm pack --pack-destination out/release、git diff --check，均成功。最终 tarball 为 out/release/leolee9086-my-masonry-0.1.0.tgz。

待办：登录恢复后发布该 tarball，查询 registry 确认，再修改 SAC 依赖与锁文件并构建。SAC scripts/prepare-package.ts 仍保留本轮独立安装改写，之前口头说要撤回但尚未执行，不能误报已撤回。SAC 的新 win-unpacked 构建成功，但未生成新 NSIS 安装器，不是最终交付。
