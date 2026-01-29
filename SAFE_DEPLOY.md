# 安全部署指南（不修改主配置文件）

## ⚠️ 重要说明

你的主配置文件包含这一行：
```nginx
include /www/server/panel/vhost/nginx/extension/starterhunt.asia/*.conf;
```

这意味着我们可以**在不修改主配置文件**的情况下，通过扩展配置来添加项目配置。

---

## 🛡️ 安全部署方法

### 方法一：使用宝塔面板扩展配置（推荐）

**优点：**
- ✅ 不修改主配置文件
- ✅ 宝塔面板更新不会覆盖
- ✅ 可以随时启用/禁用
- ✅ 配置清晰，易于管理

**步骤：**

1. **登录宝塔面板**
   - 访问：`http://你的服务器IP:8888`

2. **进入站点设置**
   - 网站 → 找到 `starterhunt.asia` → 点击 **设置**

3. **添加扩展配置**
   - 点击 **扩展配置** 标签页
   - 点击 **添加扩展配置**
   - 配置名称：`job-info`（任意名称）
   - 配置内容：复制下面的配置（根据你的需求选择）

4. **选择配置方案**

   **方案 A：子路径访问（`http://starterhunt.asia/job-info/`）**
   
   复制 `nginx-extension-subfolder.conf` 的内容

   **方案 B：根路径访问（`http://starterhunt.asia/`）**
   
   复制 `nginx-extension-root.conf` 的内容

5. **保存并重载**
   - 点击 **保存**
   - 点击 **重载配置** 或执行 `nginx -s reload`

---

### 方法二：手动创建扩展配置文件

**步骤：**

1. **创建扩展配置目录（如果不存在）**
   ```bash
   mkdir -p /www/server/panel/vhost/nginx/extension/starterhunt.asia
   ```

2. **创建配置文件**
   ```bash
   # 子路径方案
   nano /www/server/panel/vhost/nginx/extension/starterhunt.asia/job-info.conf
   
   # 或根路径方案（注意：会覆盖根路径）
   nano /www/server/panel/vhost/nginx/extension/starterhunt.asia/job-info.conf
   ```

3. **复制配置内容**
   - 复制 `nginx-extension-subfolder.conf` 或 `nginx-extension-root.conf` 的内容
   - 粘贴到文件中并保存

4. **测试配置**
   ```bash
   nginx -t
   ```

5. **重载 Nginx**
   ```bash
   nginx -s reload
   # 或在宝塔面板点击"重载配置"
   ```

---

## 📋 配置方案对比

### 方案 A：子路径部署（推荐，更安全）

**访问路径：** `http://starterhunt.asia/job-info/`

**优点：**
- ✅ 不影响域名根路径的其他内容
- ✅ 可以与其他项目共存
- ✅ 更安全，不会覆盖现有配置

**配置内容：** 使用 `nginx-extension-subfolder.conf`

**前端配置：** 需要在 `frontend/vite.config.js` 中设置：
```javascript
base: '/job-info/'
```

---

### 方案 B：根路径部署

**访问路径：** `http://starterhunt.asia/`

**优点：**
- ✅ 直接访问域名即可
- ✅ URL 更简洁

**缺点：**
- ⚠️ 会覆盖根路径的现有内容
- ⚠️ 如果域名下有其他项目，需要先备份

**配置内容：** 使用 `nginx-extension-root.conf`

**前端配置：** `frontend/vite.config.js` 不需要设置 `base`（或设置为 `'/'`）

---

## 🔍 验证配置

### 1. 检查配置文件语法
```bash
nginx -t
```

### 2. 检查扩展配置是否加载
```bash
# 查看 Nginx 主配置
cat /www/server/panel/vhost/nginx/starterhunt.asia.conf | grep extension

# 查看扩展配置文件
ls -la /www/server/panel/vhost/nginx/extension/starterhunt.asia/
```

### 3. 测试访问
- 子路径：访问 `http://starterhunt.asia/job-info/`
- 根路径：访问 `http://starterhunt.asia/`

### 4. 检查 API
```bash
# 子路径
curl http://starterhunt.asia/job-info/api/jobs

# 根路径
curl http://starterhunt.asia/api/jobs
```

---

## 🚨 故障排查

### 问题 1：配置不生效

**检查：**
```bash
# 1. 确认扩展配置目录存在
ls -la /www/server/panel/vhost/nginx/extension/starterhunt.asia/

# 2. 确认主配置包含扩展配置
grep -r "extension/starterhunt.asia" /www/server/panel/vhost/nginx/starterhunt.asia.conf

# 3. 检查配置文件语法
nginx -t
```

**解决：**
- 确认文件扩展名为 `.conf`
- 确认文件权限：`chmod 644 /www/server/panel/vhost/nginx/extension/starterhunt.asia/job-info.conf`
- 重载 Nginx：`nginx -s reload`

---

### 问题 2：404 错误

**检查：**
- 前端是否已构建：`ls -la /www/wwwroot/starterhunt.asia/job-info/frontend/dist/`
- `vite.config.js` 的 `base` 配置是否正确
- Nginx 的 `alias` 或 `root` 路径是否正确

**解决：**
```bash
# 重新构建前端
cd /www/wwwroot/starterhunt.asia/job-info/frontend
npm run build
```

---

### 问题 3：API 502 错误

**检查：**
- 后端是否运行：`pm2 list`
- 端口是否正确：`netstat -tlnp | grep 3001`

**解决：**
```bash
# 重启后端
pm2 restart job-info-backend

# 检查日志
pm2 logs job-info-backend
```

---

## 🔄 回滚配置

如果配置出错，可以快速回滚：

### 方法一：删除扩展配置（宝塔面板）
1. 网站 → starterhunt.asia → 设置 → 扩展配置
2. 删除 `job-info` 配置
3. 重载配置

### 方法二：重命名配置文件
```bash
# 禁用配置（重命名文件）
mv /www/server/panel/vhost/nginx/extension/starterhunt.asia/job-info.conf \
   /www/server/panel/vhost/nginx/extension/starterhunt.asia/job-info.conf.bak

# 重载 Nginx
nginx -s reload
```

---

## ✅ 安全检查清单

部署前确认：

- [ ] 已备份现有网站数据
- [ ] 已测试 Nginx 配置语法：`nginx -t`
- [ ] 已确认前端构建成功
- [ ] 已确认后端服务运行正常
- [ ] 已测试访问路径
- [ ] 已测试 API 接口
- [ ] 已确认不影响现有网站功能

---

## 📝 完整部署流程

1. **上传项目文件**
   ```bash
   cd /www/wwwroot/starterhunt.asia
   mkdir -p job-info
   # 上传或 git clone 项目
   ```

2. **安装依赖并构建**
   ```bash
   cd /www/wwwroot/starterhunt.asia/job-info
   cd backend && npm install --production && cd ..
   cd frontend && npm install && npm run build && cd ..
   ```

3. **配置前端 base 路径**（仅子路径方案需要）
   ```bash
   # 编辑 frontend/vite.config.js，添加 base: '/job-info/'
   ```

4. **启动后端服务**
   ```bash
   cd /www/wwwroot/starterhunt.asia/job-info
   mkdir -p logs backend/uploads
   pm2 start ecosystem.config.js
   pm2 save
   ```

5. **添加 Nginx 扩展配置**
   - 在宝塔面板添加扩展配置
   - 或手动创建配置文件

6. **测试并重载**
   ```bash
   nginx -t
   nginx -s reload
   ```

7. **上传 Excel 数据**
   ```bash
   # 上传到
   /www/wwwroot/starterhunt.asia/job-info/backend/uploads/jobs.xlsx
   ```

---

## 🎯 推荐方案

**推荐使用方案 A（子路径部署）**，因为：
- ✅ 更安全，不会影响现有配置
- ✅ 可以随时禁用，不影响主站
- ✅ 便于管理和维护

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Nginx 错误日志：`tail -f /www/wwwlogs/starterhunt.asia.error.log`
2. 检查 PM2 日志：`pm2 logs job-info-backend`
3. 检查浏览器控制台错误信息
