#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🗑️  开始卸载/清理项目文件...${NC}"

# 1. 清理 node_modules
if [ -d "node_modules" ]; then
    echo -e "   正在删除依赖包 (node_modules)..."
    rm -rf node_modules
    echo -e "${GREEN}   ✅ 依赖包已删除${NC}"
else
    echo -e "   依赖包不存在，跳过。"
fi

# 2. 清理构建产物 dist
if [ -d "dist" ]; then
    echo -e "   正在删除构建产物 (dist)..."
    rm -rf dist
    echo -e "${GREEN}   ✅ 构建产物已删除${NC}"
else
    echo -e "   构建产物不存在，跳过。"
fi

# 3. 清理包管理器缓存 (可选，这里只清理本地生成的文件)
# 如果有 .next 或其他临时文件夹也可以在这里删除

echo -e "${GREEN}✅ 清理完成。${NC}"
echo -e "${YELLOW}ℹ️  注意：此脚本仅删除了项目依赖和构建文件。${NC}"
echo -e "${YELLOW}   若要彻底从电脑中移除此项目，请手动删除整个项目文件夹。${NC}"
