# 子文件夹部署指南（starterhunt.asia）

## 📋 部署方案说明

如果你的项目需要放在 `starterhunt.asia` 的子文件夹下（如 `/job-info/`），有两种方案：

### 方案 A：子路径访问（推荐用于多项目共存）
- **项目路径**：`/www/wwwroot/starterhunt.asia/job-info/`
- **访问路径**：`http://starterhunt.asia/job-info/`
- **适用场景**：域名下还有其他项目，需要路径区分

### 方案 B：根路径访问（推荐用于单一项目）
- **项目路径**：`/www/wwwroot/starterhunt.asia/job-info/`
- **访问路径**：`http://starterhunt.asia/`
- **适用场景**：这是域名下的主要项目

---

## 🚀 方案 A：子路径部署（/job-info/）

### 步骤 1：上传项目到子文件夹

```bash
cd /www/wwwroot/starterhunt.asia
mkdir -p job-info
cd job-info

# 使用 Git 克隆
git clone 你的仓库地址 .

# 或上传 ZIP 文件并解压到 job-info 目录
```

### 步骤 2：配置前端构建路径

**修改 `frontend/vite.config.js`：**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react],
  base: '/job-info/', // 添加这一行，修改为你的子路径
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
```

**或者直接使用提供的配置：**
```bash
cd /www/wwwroot/starterhunt.asia/job-info/frontend
cp vite.config.subfolder.js vite.config.js
# 然后编辑 vite.config.js，修改 base: '/job-info/' 为你的实际路径
```

### 步骤 3：安装依赖并构建

```bash
cd /www/wwwroot/starterhunt.asia/job-info

# 安装后端依赖
cd backend
npm install --production
cd ..

# 安装前端依赖并构建
cd frontend
npm install
npm run build  # 构建时会使用 base: '/job-info/'
cd ..
```

### 步骤 4：更新 PM2 配置

**修改 `ecosystem.config.js`：**

```javascript
module.exports = {
  apps: [{
    name: 'job-info-backend',
    script: './backend/server.js',
    cwd: '/www/wwwroot/starterhunt.asia/job-info', // 更新路径
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
```

### 步骤 5：启动后端服务

```bash
cd /www/wwwroot/starterhunt.asia/job-info
mkdir -p logs backend/uploads
pm2 start ecosystem.config.js
pm2 save
```

### 步骤 6：配置 Nginx
⚠️ **重要：使用扩展配置功能，不修改主配置文件！**

**方法一：使用宝塔面板扩展配置（推荐）**

1. 在宝塔面板 → **网站** → **starterhunt.asia** → **设置** → **扩展配置**
2. 点击 **添加扩展配置**
3. 配置名称：`job-info`
4. 配置内容：复制 `nginx-extension-subfolder.conf` 文件的内容
5. 点击 **保存**，然后 **重载配置**

**方法二：手动创建扩展配置文件**

```bash
# 创建扩展配置目录（如果不存在）
mkdir -p /www/server/panel/vhost/nginx/extension/starterhunt.asia

# 创建配置文件
nano /www/server/panel/vhost/nginx/extension/starterhunt.asia/job-info.conf
```

然后复制 `nginx-extension-subfolder.conf` 的内容到文件中。

**测试并重载：**
```bash
nginx -t && nginx -s reload
```

---

### 步骤 7：上传 Excel 数据

```bash
# 上传 jobs.xlsx 到
/www/wwwroot/starterhunt.asia/job-info/backend/uploads/jobs.xlsx
```

### 验证部署

访问：`http://starterhunt.asia/job-info/`

---

## 📝 重要提示

### 1. 前端 base 路径配置

- **子路径部署**：必须在 `vite.config.js` 中设置 `base: '/job-info/'`
- **根路径部署**：不设置 base 或设置为 `base: '/'`

### 2. Nginx 配置区别

- **子路径**：使用 `location /job-info/` 和 `alias`
- **根路径**：使用 `location /` 和 `root`

### 3. API 路径

- **子路径**：前端请求 `/job-info/api/jobs`，Nginx 重写为 `/api/jobs` 转发到后端
- **根路径**：前端请求 `/api/jobs`，直接转发到后端

### 4. 更新代码后重新构建

```bash
cd /www/wwwroot/starterhunt.asia/job-info/frontend
npm run build
pm2 restart job-info-backend
nginx -s reload
```

---

## 🔧 快速部署脚本（子文件夹版本）

创建 `deploy-subfolder.sh`：

```bash
#!/bin/bash
PROJECT_DIR="/www/wwwroot/starterhunt.asia/job-info"

cd "$PROJECT_DIR"

# 安装后端依赖
cd backend && npm install --production && cd ..

# 构建前端（确保 vite.config.js 已配置 base）
cd frontend && npm install && npm run build && cd ..

# 重启 PM2
pm2 restart job-info-backend || pm2 start ecosystem.config.js

# 重载 Nginx
nginx -s reload

echo "部署完成！访问: http://starterhunt.asia/job-info/"
```

---

## ❓ 常见问题

**Q: 页面显示空白，控制台报 404？**
- 检查 `vite.config.js` 的 `base` 配置是否正确
- 检查 Nginx 的 `root` 或 `alias` 路径是否正确

**Q: API 请求失败？**
- 检查 Nginx 的 `location /job-info/api` 或 `location /api` 配置
- 检查后端是否运行：`pm2 list`

**Q: 静态资源（JS/CSS）加载失败？**
- 检查构建后的 `dist/index.html` 中的资源路径
- 确保 `base` 配置与 Nginx 路径一致
