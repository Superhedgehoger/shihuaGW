#!/bin/bash

echo "========================================="
echo "        石化公文自动排版 Web 工具"
echo "========================================="
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js 环境！"
    echo "请先前往 https://nodejs.org/ 下载并安装 Node.js"
    read -p "按回车键退出..."
    exit 1
fi

# 检查依赖并安装
if [ ! -d "node_modules" ]; then
    echo "[提示] 首次运行，正在自动安装依赖，请稍候..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败，请检查网络连接后重试。"
        read -p "按回车键退出..."
        exit 1
    fi
    echo "[提示] 依赖安装完成！"
    echo ""
fi

# 启动服务并自动打开浏览器
echo "[提示] 正在启动本地服务..."
npm run dev -- --open
