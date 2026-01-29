# 求职信息网站

一个基于React和Node.js的求职信息管理系统，支持从Excel文件读取数据并展示在可滚动的表格中。

## 功能特性

- 📊 Excel文件上传和管理
- 🔍 按城市筛选职位
- 🏷️ 按Offer类型筛选（最新网申、热门秋招、国企汇总、大厂汇总、实习汇总）
- 📱 响应式设计，支持移动端
- 🔄 实时数据更新

## 项目结构

```
job-info-website/
├── backend/          # 后端服务（Node.js + Express）
│   ├── server.js     # 服务器主文件
│   ├── scripts/
│   │   └── scrape_campus.js  # 求职方舟校招表爬虫
│   ├── package.json  # 后端依赖
│   └── uploads/      # Excel文件存储目录（自动创建）
├── scrape_campus.py  # 求职方舟爬虫（Python + Playwright 备选）
├── run_scrape.bat    # 一键运行 Node 爬虫（Windows）
├── frontend/         # 前端应用（React + Vite）
│   ├── src/
│   │   ├── App.jsx   # 主组件
│   │   ├── App.css   # 样式文件
│   │   ├── main.jsx  # 入口文件
│   │   └── index.css # 全局样式
│   ├── index.html    # HTML模板
│   ├── package.json  # 前端依赖
│   └── vite.config.js # Vite配置
└── README.md         # 项目说明
```

## Excel文件格式要求

Excel文件应包含以下列（第一行为表头）：

- 更新日期
- 公司
- 行业
- 标签
- 批次
- 职位
- 地点
- 投递截止
- 薪资
- 福利待遇
- 操作（可以是链接或文本）

## 安装和运行

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 安装前端依赖

```bash
cd frontend
npm install
```

### 3. 启动后端服务

```bash
cd backend
npm start
# 或使用开发模式（自动重启）
npm run dev
```

后端服务将在 http://localhost:3001 运行

### 4. 启动前端应用

```bash
cd frontend
npm run dev
```

前端应用将在 http://localhost:3000 运行

## 使用说明

### 快速开始

1. **从求职方舟抓取校招表格（推荐）**
   - **方式一**：双击 `run_scrape.bat`（Windows）。首次运行会自动安装依赖与 Chromium。
   - **方式二**：在 `backend` 目录执行：
     ```bash
     npm install
     npx playwright install chromium
     npm run scrape
     ```
   - 抓取结果保存为 `backend/uploads/jobs.xlsx`，与上传功能共用，可直接在网站中查看。

2. **生成示例Excel文件（可选）**
   ```bash
   # 安装Python依赖
   pip install openpyxl
   
   # 运行脚本生成示例文件
   python create_sample_excel.py
   ```

3. **启动后端服务**
   ```bash
   cd backend
   npm install
   npm start
   ```
   后端服务将在 http://localhost:3001 运行

4. **启动前端应用**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   前端应用将在 http://localhost:3000 运行

5. **使用网站**
   - 打开浏览器访问 http://localhost:3000
   - 点击"上传Excel文件"按钮，选择包含求职信息的Excel文件
   - 上传成功后，表格会自动显示数据
   - 使用顶部的筛选器按城市或Offer类型筛选数据
   - 表格支持滚动查看所有数据

## 技术栈

### 后端
- Node.js
- Express
- Multer (文件上传)
- XLSX (Excel文件处理)
- Playwright (爬虫，抓取求职方舟校招表)

### 前端
- React 18
- Vite
- Axios (HTTP请求)
- CSS3

## 服务器部署

### 腾讯云宝塔系统部署

**部署方案选择：**

1. **独立目录部署**（新域名或独立站点）
   - 详细指南：[DEPLOY.md](./DEPLOY.md)
   - 项目路径：`/www/wwwroot/job-info-website/`
   - 访问路径：`http://你的域名/`

2. **子文件夹部署**（已有域名，如 starterhunt.asia）
   - 详细指南：[DEPLOY_SUBFOLDER.md](./DEPLOY_SUBFOLDER.md)
   - 项目路径：`/www/wwwroot/starterhunt.asia/job-info/`
   - 访问路径：`http://starterhunt.asia/job-info/` 或 `http://starterhunt.asia/`

**快速部署步骤（独立目录）：**

1. **上传项目到服务器**
   ```bash
   # 使用 Git 克隆或上传文件到 /www/wwwroot/job-info-website/
   ```

2. **安装依赖并构建**
   ```bash
   cd /www/wwwroot/job-info-website/backend
   npm install --production
   
   cd ../frontend
   npm install && npm run build
   ```

3. **启动后端服务（PM2）**
   ```bash
   cd /www/wwwroot/job-info-website
   pm2 start ecosystem.config.js
   pm2 save
   ```

4. **配置 Nginx**
   - 在宝塔面板创建站点，根目录指向 `frontend/dist`
   - 配置反向代理：`/api` → `http://localhost:3001`
   - 参考 `nginx.conf.example` 文件

5. **上传 Excel 数据**
   - 将 `jobs.xlsx` 上传到 `backend/uploads/` 目录

**一键部署脚本：**
```bash
chmod +x deploy.sh
./deploy.sh
```

**检查部署状态：**
```bash
chmod +x check-deploy.sh
./check-deploy.sh
```

## 注意事项

- 确保Excel文件的第一行是表头
- 上传的Excel文件会替换之前的文件
- 支持.xlsx和.xls格式
- 城市筛选支持多城市（用逗号分隔）
- 行业下拉选项自动从Excel的「行业」列提取，无需API调用
- 「只看实习」筛选仅显示标签中包含「实习」的岗位
