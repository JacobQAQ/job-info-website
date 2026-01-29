// Vite 配置 - 子文件夹部署版本
// 如果部署在子路径（如 /job-info/），使用此配置
// 使用方法：复制此文件为 vite.config.js，或修改 vite.config.js 添加 base 配置

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react],
  base: '/job-info/', // 修改为你的子路径，如 '/job-info/' 或 '/careers/'
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
