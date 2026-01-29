@echo off
chcp 65001 >nul
echo 正在从 求职方舟 校招页抓取表格...
cd /d "%~dp0backend"

if not exist "node_modules\playwright" (
  echo 安装依赖...
  call npm install
  echo 安装 Chromium...
  call npx playwright install chromium
)

call npm run scrape
pause
