# 快速部署指南（宝塔 Linux）

## 📋 前置条件

- ✅ 腾讯云服务器已安装宝塔面板
- ✅ 已登录宝塔面板（http://你的IP:8888）
- ✅ 已安装 Node.js 18+ 和 Nginx

---

## 🚀 5 步快速部署

### 步骤 1：上传项目文件

**方式 A：使用 Git（推荐）**
```bash
cd /www/wwwroot
git clone 你的仓库地址 job-info-website
cd job-info-website
```

**方式 B：使用宝塔文件管理器**
1. 在本地压缩项目为 `job-info-website.zip`
2. 上传到 `/www/wwwroot/` 并解压

---

### 步骤 2：安装依赖并构建

```bash
cd /www/wwwroot/job-info-website

# 安装后端依赖
cd backend
npm install --production
cd ..

# 构建前端
cd frontend
npm install
npm run build
cd ..
```

---

### 步骤 3：启动后端（PM2）

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 创建日志目录
mkdir -p logs backend/uploads

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 按提示执行命令以设置开机自启
```

**验证：**
```bash
pm2 list  # 应看到 job-info-backend 运行中
```

---

### 步骤 4：配置 Nginx

1. **创建站点**
   - 宝塔面板 → **网站** → **添加站点**
   - 域名/IP：填写你的域名或 IP
   - 根目录：`/www/wwwroot/job-info-website/frontend/dist`
   - PHP版本：纯静态

2. **配置反向代理**
   - 点击站点 → **设置** → **配置文件**
   - 复制 `nginx.conf.example` 的内容并修改域名/IP
   - 保存并重载配置

**关键配置：**
```nginx
location /api {
    proxy_pass http://localhost:3001;
    # ... 其他配置见 nginx.conf.example
}
```

---

### 步骤 5：上传 Excel 数据

**方式 A：宝塔文件管理器**
- 上传 `jobs.xlsx` 到 `/www/wwwroot/job-info-website/backend/uploads/`

**方式 B：使用爬虫生成**
```bash
cd /www/wwwroot/job-info-website
python3 create_sample_excel.py
```

---

## ✅ 验证部署

访问：`http://你的域名或IP`

**检查清单：**
- [ ] 前端页面正常显示
- [ ] 筛选功能正常
- [ ] API 返回数据：`http://你的域名/api/jobs`
- [ ] Excel 文件存在：`backend/uploads/jobs.xlsx`

**使用检查脚本：**
```bash
chmod +x check-deploy.sh
./check-deploy.sh
```

---

## 🔧 常用命令

```bash
# 重启后端
pm2 restart job-info-backend

# 查看日志
pm2 logs job-info-backend

# 重载 Nginx
nginx -s reload

# 一键部署（更新代码后）
./deploy.sh
```

---

## ❓ 常见问题

**Q: 页面显示空白？**
- 检查前端是否构建成功：`ls frontend/dist/`
- 检查 Nginx 根目录是否正确

**Q: API 返回 502？**
- 检查后端是否运行：`pm2 list`
- 检查端口：`netstat -tlnp | grep 3001`

**Q: Excel 文件读取失败？**
- 检查文件权限：`chmod 644 backend/uploads/jobs.xlsx`
- 检查文件是否存在

---

详细部署文档请查看 [DEPLOY.md](./DEPLOY.md)
