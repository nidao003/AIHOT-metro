#!/usr/bin/env bash
set -euo pipefail

# MetroHOT 133 测试服务器一键部署脚本
# 目标机器：192.168.3.133 (端口 6088)

REMOTE_HOST="${REMOTE_HOST:-192.168.3.133}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_USER="${REMOTE_USER:-oohclaw}"
REMOTE_PASS="${REMOTE_PASS:-oohforceb3505}"
REMOTE_DIR="/home/oohclaw/metrohot-deploy"
TAR_FILE="/tmp/metrohot-deploy-$(date +%s).tar.gz"

echo "==> [1/5] 打包本地源码产物..."
cd "$(dirname "$0")/.."
tar -czf "$TAR_FILE" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.data' \
  --exclude='package' \
  --exclude='.spec-workflow' \
  --exclude='apps/web/build' \
  --exclude='apps/web/.react-router' \
  .

echo "==> [2/5] 上传代码至 133 服务器 ($REMOTE_HOST)..."
sshpass -p "$REMOTE_PASS" scp -P "$REMOTE_PORT" -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  "$TAR_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/metrohot-deploy.tar.gz"
rm -f "$TAR_FILE"

echo "==> [3/5] 远端解压与重构镜像..."
sshpass -p "$REMOTE_PASS" ssh -p "$REMOTE_PORT" -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  "${REMOTE_USER}@${REMOTE_HOST}" "
    set -e
    cd ${REMOTE_DIR}
    tar xzf metrohot-deploy.tar.gz
    rm -f metrohot-deploy.tar.gz
    # 优先使用 npm 国内镜像加速
    docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
    docker compose up -d
"

echo "==> [4/5] 容器状态检查..."
sshpass -p "$REMOTE_PASS" ssh -p "$REMOTE_PORT" -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker compose ps"

echo "==> [5/5] 执行本地冒烟检查..."
sleep 3
node scripts/smoke.ts --base "http://${REMOTE_HOST}:6088"

echo ""
echo "🎉 部署完成！访问地址："
echo "   前台：http://${REMOTE_HOST}:6088"
echo "   后台：http://${REMOTE_HOST}:6088/admin"
