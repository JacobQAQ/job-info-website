#!/bin/bash
# 针对 starterhunt.asia 子文件夹部署脚本
# 使用方法: chmod +x deploy-starterhunt.sh && ./deploy-starterhunt.sh

set -e

# 配置：修改为你的实际路径
DOMAIN_DIR="/www/wwwroot/starterhunt.asia"
PROJECT_DIR="$DOMAIN_DIR/job-info"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
SUBPATH="/job-info"  # 子路径，如果根路径访问则改为 ""

echo "=========================================="
echo "部署求职信息网站到 starterhunt.asia"
echo "=========================================="

# 检查目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "错误: 项目目录不存在: $PROJECT_DIR"
    echo "请先上传项目文件到该目录"
    exit 1
fi

cd "$PROJECT_DIR"

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p logs
mkdir -p backend/uploads

# 配置前端 base 路径（如果需要子路径访问）
if [ -n "$SUBPATH" ]; then
    echo "配置前端子路径: $SUBPATH"
    if [ -f "$FRONTEND_DIR/vite.config.js" ]; then
        # 检查是否已配置 base
        if ! grep -q "base:" "$FRONTEND_DIR/vite.config.js"; then
            echo "警告: vite.config.js 中未找到 base 配置"
            echo "请手动添加: base: '$SUBPATH/'"
            echo "或使用: cp frontend/vite.config.subfolder.js frontend/vite.config.js"
        fi
    fi
fi

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

# 更新 PM2 配置中的路径
echo "更新 PM2 配置..."
cd "$PROJECT_DIR"
if [ -f "ecosystem.config.js" ]; then
    # 更新 cwd 路径（如果存在）
    sed -i "s|cwd:.*|cwd: '$PROJECT_DIR',|g" ecosystem.config.js || true
fi

# 重启 PM2 服务
echo "重启后端服务..."
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
echo "项目路径: $PROJECT_DIR"
if [ -n "$SUBPATH" ]; then
    echo "访问地址: http://starterhunt.asia$SUBPATH/"
else
    echo "访问地址: http://starterhunt.asia/"
fi
echo ""
echo "查看服务状态: pm2 list"
echo "查看日志: pm2 logs job-info-backend"
echo ""
echo "⚠️  请确保："
echo "1. Nginx 配置已正确设置（参考 nginx.conf.subfolder.example 或 nginx.conf.root.example）"
echo "2. Excel 文件已上传到: $PROJECT_DIR/backend/uploads/jobs.xlsx"
