#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 准备启动应用...${NC}"

# 1. 检查依赖是否存在
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  未检测到依赖包，正在自动运行安装脚本...${NC}"
    
    # 检查 install.sh 是否存在及可执行
    if [ -f "./install.sh" ]; then
        chmod +x ./install.sh
        ./install.sh
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 自动安装失败，无法启动。${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  未找到 install.sh，尝试直接运行 npm install...${NC}"
        npm install
    fi
fi

# 2. 启动开发服务器
echo -e "${GREEN}⚡️ 正在启动开发服务器...${NC}"
echo -e "${YELLOW}按 Ctrl + C 可停止服务${NC}"

# 使用 npm run dev 启动
npm run dev
