@echo off
chcp 65001 >nul
echo 🚀 正在启动石化公文排版工具 (Windows 环境)...
echo ==============================================

cd /d "%~dp0"

IF NOT EXIST "node_modules\" (
    echo 📦 未检测到 node_modules 目录，正在为您自动安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败，请检查网络或 Node.js 环境。
        pause
        exit /b %errorlevel%
    )
    echo ✅ 依赖安装完成！
)

echo 🌐 正在启动本地服务器...
call npm run dev

pause
