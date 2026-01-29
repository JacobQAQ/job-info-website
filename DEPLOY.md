# 腾讯云宝塔系统部署指南

## 部署架构

- **前端**：React + Vite，构建为静态文件，由 Nginx 托管
- **后端**：Node.js + Express，运行在 3001 端口，使用 PM2 管理
- **反向代理**：Nginx 将 `/api` 请求转发到后端

---

## 一、服务器环境准备

### 1.1 登录宝塔面板

访问 `http://你的服务器IP:8888`，使用宝塔账号登录。

### 1.2 安装必要软件

在宝塔面板 → **软件商店** 安装：

- ✅ **Nginx**（通常已安装）
- ✅ **PM2 管理器**（或通过终端安装）
- ✅ **Node.js 版本管理器**（推荐 Node.js 18+）

**安装 PM2（如果未安装）：**
```bash
npm install -g pm2
```

### 1.3 检查 Node.js 版本

在宝塔 **终端** 执行：
```bash
node -v    # 应显示 v18.x 或更高
npm -v     # 应显示 9.x 或更高
```

如果未安装或版本过低，在宝塔面板 → **软件商店** → **Node.js 版本管理器** 安装 Node.js 18 或 20。

---

## 二、上传项目文件

### 2.1 创建项目目录

在宝塔 **文件管理** 中创建目录：
```
/www/wwwroot/job-info-website/
```

### 2.2 上传文件

**方式一：使用宝塔文件管理器**
1. 在本地将整个项目文件夹压缩为 `job-info-website.zip`
2. 在宝塔文件管理器中上传到 `/www/wwwroot/`
3. 解压文件

**方式二：使用 Git（推荐）**
```bash
cd /www/wwwroot
git clone 你的仓库地址 job-info-website
cd job-info-website
```

**方式三：使用 FTP/SFTP**
使用 FileZilla 等工具上传整个项目文件夹。

---

## 三、安装依赖

### 3.1 安装后端依赖

```bash
cd /www/wwwroot/job-info-website/backend
npm install --production
```

**注意**：如果不需要爬虫功能，可以移除 `playwright` 依赖：
```bash
npm uninstall playwright
```

### 3.2 安装前端依赖并构建

```bash
cd /www/wwwroot/job-info-website/frontend
npm install
npm run build
```

构建完成后，会在 `frontend/dist/` 目录生成静态文件。

---

## 四、配置后端（PM2）

### 4.1 创建 PM2 配置文件

在项目根目录创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'job-info-backend',
    script: './backend/server.js',
    cwd: '/www/wwwroot/job-info-website',
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
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
```

### 4.2 创建日志目录

```bash
mkdir -p /www/wwwroot/job-info-website/logs
mkdir -p /www/wwwroot/job-info-website/backend/uploads
```

### 4.3 启动后端服务

```bash
cd /www/wwwroot/job-info-website
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启（按提示执行命令）
```

**验证后端是否运行：**
```bash
pm2 list
pm2 logs job-info-backend
```

访问 `http://你的服务器IP:3001/api/jobs` 应返回 JSON 数据（可能为空数组）。

---

## 五、配置 Nginx

### 5.1 创建站点

在宝塔面板 → **网站** → **添加站点**：
- **域名**：填写你的域名（如 `job.example.com`）或服务器 IP
- **根目录**：`/www/wwwroot/job-info-website/frontend/dist`
- **PHP版本**：纯静态（不需要 PHP）

### 5.2 配置 Nginx 反向代理

在宝塔面板 → **网站** → 点击你的站点 → **设置** → **配置文件**，修改为：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;
    index index.html;
    root /www/wwwroot/job-info-website/frontend/dist;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

点击 **保存**，然后 **重载配置**。

---

## 六、上传 Excel 数据文件

### 6.1 方式一：通过宝塔文件管理器

1. 在宝塔文件管理器中进入 `/www/wwwroot/job-info-website/backend/uploads/`
2. 上传你的 `jobs.xlsx` 文件

### 6.2 方式二：使用后端 API 上传

访问 `http://你的域名/api/upload`，使用 Postman 或 curl：

```bash
curl -X POST http://你的域名/api/upload \
  -F "file=@/path/to/jobs.xlsx"
```

### 6.3 方式三：使用爬虫脚本生成

```bash
cd /www/wwwroot/job-info-website
python3 create_sample_excel.py
```

（需要先安装 Python 和 openpyxl）

---

## 七、配置防火墙

### 7.1 宝塔安全设置

在宝塔面板 → **安全** 中：
- ✅ 开放 **80** 端口（HTTP）
- ✅ 开放 **443** 端口（HTTPS，如果使用 SSL）
- ❌ **关闭 3001 端口**（后端只允许本地访问）

### 7.2 腾讯云安全组

在腾讯云控制台 → **云服务器** → **安全组**：
- 开放 **80**、**443** 端口
- 不开放 **3001** 端口（后端仅内网访问）

---

## 八、SSL 证书（可选，推荐）

### 8.1 申请免费 SSL

在宝塔面板 → **网站** → 你的站点 → **SSL** → **Let's Encrypt**：
- 选择域名
- 点击 **申请**
- 开启 **强制 HTTPS**

### 8.2 更新 Nginx 配置

申请 SSL 后，宝塔会自动更新配置。确保 `/api` 代理配置正确。

---

## 九、验证部署

### 9.1 检查服务状态

```bash
# 检查 PM2
pm2 list
pm2 logs job-info-backend --lines 50

# 检查 Nginx
nginx -t
systemctl status nginx
```

### 9.2 访问测试

1. **前端**：访问 `http://你的域名`，应看到页面
2. **后端 API**：访问 `http://你的域名/api/jobs`，应返回 JSON
3. **上传 Excel**：使用 Postman 测试 `/api/upload`

---

## 十、常用维护命令

### 10.1 PM2 管理

```bash
pm2 list                    # 查看所有进程
pm2 restart job-info-backend  # 重启后端
pm2 stop job-info-backend     # 停止后端
pm2 logs job-info-backend     # 查看日志
pm2 monit                    # 监控面板
```

### 10.2 更新代码

```bash
cd /www/wwwroot/job-info-website

# 如果使用 Git
git pull origin main

# 重新安装依赖（如有新增）
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# 重启服务
pm2 restart job-info-backend
```

### 10.3 查看日志

```bash
# PM2 日志
pm2 logs job-info-backend

# Nginx 日志
tail -f /www/wwwlogs/你的域名.log

# 后端错误日志
cat /www/wwwroot/job-info-website/logs/pm2-error.log
```

---

## 十一、故障排查

### 问题1：前端页面空白

**检查：**
- Nginx 根目录是否正确指向 `frontend/dist`
- 构建是否成功：`ls -la frontend/dist/`
- 浏览器控制台是否有错误

**解决：**
```bash
cd frontend
npm run build
```

### 问题2：API 请求 502

**检查：**
- 后端是否运行：`pm2 list`
- 端口是否正确：`netstat -tlnp | grep 3001`
- Nginx 代理配置是否正确

**解决：**
```bash
pm2 restart job-info-backend
nginx -t && nginx -s reload
```

### 问题3：Excel 文件无法读取

**检查：**
- 文件是否存在：`ls -la backend/uploads/jobs.xlsx`
- 文件权限：`chmod 644 backend/uploads/jobs.xlsx`
- 目录权限：`chmod 755 backend/uploads`

### 问题4：PM2 进程自动停止

**检查日志：**
```bash
pm2 logs job-info-backend --err
```

**常见原因：**
- 端口被占用
- 依赖缺失
- 代码错误

---

## 十二、性能优化建议

### 12.1 启用 Gzip 压缩

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 12.2 静态资源 CDN（可选）

将 `frontend/dist/assets/` 中的 JS/CSS 文件上传到 CDN，修改构建后的 HTML 引用。

### 12.3 数据库优化（未来）

如果数据量大，考虑将 Excel 数据迁移到 MySQL/MongoDB。

---

## 快速部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash
cd /www/wwwroot/job-info-website

echo "安装后端依赖..."
cd backend && npm install --production && cd ..

echo "构建前端..."
cd frontend && npm install && npm run build && cd ..

echo "重启服务..."
pm2 restart job-info-backend

echo "重载 Nginx..."
nginx -s reload

echo "部署完成！"
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 完成！

部署完成后，访问你的域名即可使用求职信息网站。

如有问题，检查：
1. PM2 日志：`pm2 logs`
2. Nginx 日志：`/www/wwwlogs/`
3. 后端日志：`/www/wwwroot/job-info-website/logs/`
