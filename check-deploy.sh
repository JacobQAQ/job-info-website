#!/bin/bash
# 部署检查脚本
# 使用方法: chmod +x check-deploy.sh && ./check-deploy.sh

PROJECT_DIR="/www/wwwroot/job-info-website"

echo "=========================================="
echo "部署状态检查"
echo "=========================================="

# 检查目录
echo "1. 检查项目目录..."
if [ -d "$PROJECT_DIR" ]; then
    echo "   ✅ 项目目录存在: $PROJECT_DIR"
else
    echo "   ❌ 项目目录不存在: $PROJECT_DIR"
fi

# 检查 Node.js
echo ""
echo "2. 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js 版本: $NODE_VERSION"
else
    echo "   ❌ Node.js 未安装"
fi

# 检查 PM2
echo ""
echo "3. 检查 PM2..."
if command -v pm2 &> /dev/null; then
    echo "   ✅ PM2 已安装"
    echo ""
    echo "   PM2 进程列表:"
    pm2 list
else
    echo "   ❌ PM2 未安装，请运行: npm install -g pm2"
fi

# 检查后端服务
echo ""
echo "4. 检查后端服务..."
if pm2 list | grep -q "job-info-backend"; then
    STATUS=$(pm2 jlist | grep -A 5 "job-info-backend" | grep "pm2_env.status" | cut -d'"' -f4)
    echo "   ✅ 后端服务运行中，状态: $STATUS"
else
    echo "   ❌ 后端服务未运行"
fi

# 检查端口
echo ""
echo "5. 检查端口占用..."
if netstat -tlnp 2>/dev/null | grep -q ":3001"; then
    echo "   ✅ 端口 3001 已被占用（后端服务）"
else
    echo "   ⚠️  端口 3001 未被占用（后端可能未启动）"
fi

# 检查前端构建
echo ""
echo "6. 检查前端构建..."
if [ -d "$PROJECT_DIR/frontend/dist" ]; then
    DIST_SIZE=$(du -sh "$PROJECT_DIR/frontend/dist" | cut -f1)
    echo "   ✅ 前端构建文件存在，大小: $DIST_SIZE"
    if [ -f "$PROJECT_DIR/frontend/dist/index.html" ]; then
        echo "   ✅ index.html 存在"
    else
        echo "   ❌ index.html 不存在"
    fi
else
    echo "   ❌ 前端构建文件不存在，请运行: cd frontend && npm run build"
fi

# 检查 Excel 文件
echo ""
echo "7. 检查 Excel 数据文件..."
if [ -f "$PROJECT_DIR/backend/uploads/jobs.xlsx" ]; then
    FILE_SIZE=$(du -h "$PROJECT_DIR/backend/uploads/jobs.xlsx" | cut -f1)
    echo "   ✅ Excel 文件存在，大小: $FILE_SIZE"
else
    echo "   ⚠️  Excel 文件不存在，请上传到 backend/uploads/jobs.xlsx"
fi

# 检查 Nginx
echo ""
echo "8. 检查 Nginx..."
if command -v nginx &> /dev/null; then
    if nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Nginx 配置正确"
    else
        echo "   ❌ Nginx 配置有误:"
        nginx -t
    fi
else
    echo "   ❌ Nginx 未安装"
fi

# API 测试
echo ""
echo "9. 测试 API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/jobs 2>/dev/null || echo "000")
if [ "$API_RESPONSE" = "200" ]; then
    echo "   ✅ API 响应正常 (HTTP $API_RESPONSE)"
elif [ "$API_RESPONSE" = "000" ]; then
    echo "   ⚠️  无法连接到 API（后端可能未启动）"
else
    echo "   ⚠️  API 响应异常 (HTTP $API_RESPONSE)"
fi

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="
