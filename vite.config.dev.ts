import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 开发服务器配置 - 用于运行 examples
export default defineConfig({
    root: 'examples',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    build: {
        outDir: path.resolve(__dirname, 'dist-examples')
    }
})
