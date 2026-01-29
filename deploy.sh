#!/bin/bash
# 求职信息网站部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

set -e

PROJECT_DIR="/www/wwwroot/job-info-website"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=========================================="
echo "开始部署求职信息网站..."
echo "=========================================="

# 检查目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "错误: 项目目录不存在: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p logs
mkdir -p backend/uploads

# 安装后端依赖
echo "安装后端依赖..."
cd "$BACKEND_DIR"
npm install --production

# 安装前端依赖并构建
echo "构建前端..."
cd "$FRONTEND_DIR"
npm install
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "错误: 前端构建失败，dist 目录不存在"
    exit 1
fi

# 重启 PM2 服务
echo "重启后端服务..."
cd "$PROJECT_DIR"
if pm2 list | grep -q "job-info-backend"; then
    pm2 restart job-info-backend
else
    pm2 start ecosystem.config.js
    pm2 save
fi

# 重载 Nginx
echo "重载 Nginx 配置..."
nginx -t && nginx -s reload || echo "警告: Nginx 重载失败，请手动检查配置"

echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "查看服务状态: pm2 list"
echo "查看日志: pm2 logs job-info-backend"
echo "访问网站: http://你的域名"
