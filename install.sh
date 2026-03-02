#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始安装 (适配 MacOS Apple Silicon)...${NC}"

# 1. 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未检测到 Node.js。${NC}"
    echo -e "${YELLOW}👉 请先安装 Node.js。推荐使用 Homebrew 安装:${NC}"
    echo "   brew install node"
    echo -e "${YELLOW}或者访问官网下载 ARM64 (Apple Silicon) 版本: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 检测到 Node.js: $(node -v)${NC}"

# 2. 检查架构 (可选，确认是 ARM64)
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo -e "${GREEN}✅ 检测到 Apple Silicon (M1/M2/M3/M4) 架构: $ARCH${NC}"
else
    echo -e "${YELLOW}⚠️  当前架构为 $ARCH (可能是 Rosetta 转译或 Intel Mac)，脚本仍可运行。${NC}"
fi

# 3. 安装依赖
echo -e "${YELLOW}📦 正在安装项目依赖...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 安装成功!${NC}"
    echo -e "👉 运行 ${YELLOW}./start.sh${NC} 启动应用"
else
    echo -e "${RED}❌ 安装失败，请检查网络或错误日志。${NC}"
    exit 1
fi
