@echo off
chcp 65001 >nul
title 石化公文排版工具

echo ==============================================
echo        石化公文自动排版 Web 工具
echo ==============================================
echo.

cd /d "%~dp0"

:: 检查 Node.js 环境
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Node.js 环境！
    echo 请先前往 https://nodejs.org/ 下载并安装 Node.js 后重试。
    pause
    exit /b
)

:: 检查依赖并安装
if not exist node_modules (
    echo [提示] 首次运行，正在自动安装依赖，请稍候...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [错误] 依赖安装失败，请检查网络或 Node.js 环境。
        pause
        exit /b
    )
    echo [提示] 依赖安装完成！
    echo.
)

:: 启动服务并自动在浏览器中打开
echo [提示] 正在启动本地服务器...
call npm run dev -- --open
