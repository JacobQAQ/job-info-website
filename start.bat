@echo off
echo 正在启动求职信息网站...
echo.

echo [1/2] 启动后端服务...
start "后端服务" cmd /k "cd backend && npm install && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] 启动前端应用...
start "前端应用" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo 启动完成！
echo 后端服务: http://localhost:3001
echo 前端应用: http://localhost:3000
echo.
echo 按任意键关闭此窗口...
pause >nul
