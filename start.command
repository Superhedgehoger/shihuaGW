#!/bin/bash

# 获取脚本所在目录
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🚀 正在启动石化公文排版工具 (Mac/Linux 环境)..."
echo "=============================================="

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 未检测到 node_modules 目录，正在为您自动安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查网络或 Node.js 环境。"
        exit 1
    fi
    echo "✅ 依赖安装完成！"
fi

echo "🌐 正在启动本地服务器..."
npm run dev
