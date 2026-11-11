import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyMasonry',
      // 样式产物固定叫 style.css：package.json 的 exports 就指向 ./dist/style.css，
      // 用默认的 my-masonry.css 会让 `import '@leolee9086/my-masonry/style.css'` 直接找不到文件。
      cssFileName: 'style',
      // 包采用 ESM；require 入口必须用 .cjs，避免 Node 将 UMD 文件解释成 ESM。
      fileName: (format) => `my-masonry.${format}.${format === 'umd' ? 'cjs' : 'js'}`
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue'
        }
      }
    },
    // 输出目录
    outDir: 'dist',
    // 生成 sourcemap
    sourcemap: true
  }
})