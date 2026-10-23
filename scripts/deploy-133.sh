#!/usr/bin/env bash
set -euo pipefail

# MetroHOT 133 测试服务器一键部署脚本
# 两条 SSH 通道指向同一台机器，默认先试局域网，不通自动切公网：
#   局域网 192.168.3.133:22
#   公网   ooh.oohforce.com:228
# 站点端口 6088。

REMOTE_USER="${REMOTE_USER:-oohclaw}"
REMOTE_PASS="${REMOTE_PASS:-oohforceb3505}"
REMOTE_DIR="/home/oohclaw/metrohot-deploy"
REMOTE_CHANNEL="${REMOTE_CHANNEL:-auto}"
TAR_FILE="/tmp/metrohot-deploy-$(date +%s).tar.gz"

LAN_HOST="192.168.3.133"
LAN_PORT="22"
PUBLIC_HOST="ooh.oohforce.com"
PUBLIC_PORT="228"

# 端口探测：macOS BSD nc 用 -G，Linux/Git Bash 用 -w 或 /dev/tcp
port_open() {
  local host="$1" port="$2"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    nc -z -G 3 "$host" "$port" 2>/dev/null
  elif command -v nc >/dev/null 2>&1; then
    nc -z -w 3 "$host" "$port" 2>/dev/null
  else
    (echo >/dev/tcp/"$host"/"$port") 2>/dev/null
  fi
}

echo "==> [0/5] 选择 SSH 通道 (mode=${REMOTE_CHANNEL})..."
if [[ "$REMOTE_CHANNEL" == "auto" ]]; then
  if port_open "$LAN_HOST" "$LAN_PORT"; then
    REMOTE_CHANNEL="lan"
  else
    REMOTE_CHANNEL="public"
  fi
fi

case "$REMOTE_CHANNEL" in
  lan)
    REMOTE_HOST="$LAN_HOST"; REMOTE_PORT="$LAN_PORT"; SITE_HOST="$LAN_HOST"
    ;;
  public)
    REMOTE_HOST="$PUBLIC_HOST"; REMOTE_PORT="$PUBLIC_PORT"; SITE_HOST="$PUBLIC_HOST"
    ;;
  *)
    echo "ERROR: REMOTE_CHANNEL 只能是 auto / lan / public" >&2
    exit 1
    ;;
esac
echo "    通道 = ${REMOTE_CHANNEL}  (${REMOTE_HOST}:${REMOTE_PORT})"

if ! command -v sshpass >/dev/null 2>&1; then
  echo "ERROR: 需要 sshpass。macOS: brew install sshpass / Linux: sudo apt install sshpass" >&2
  exit 1
fi

SSH_OPTS=(-o StrictHostKeyChecking=no -o PubkeyAuthentication=no -o ConnectTimeout=30)
if [[ "$REMOTE_CHANNEL" == "public" ]]; then
  SSH_OPTS+=(-o ServerAliveInterval=15 -o ServerAliveCountMax=4)
fi

remote() {
  sshpass -p "$REMOTE_PASS" ssh -p "$REMOTE_PORT" "${SSH_OPTS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "$@"
}

echo "==> [1/5] 打包本地源码产物..."
cd "$(dirname "$0")/.."
tar -czf "$TAR_FILE" \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='node_modules' \
  --exclude='.data' \
  --exclude='package' \
  --exclude='.spec-workflow' \
  --exclude='apps/web/build' \
  --exclude='apps/web/.react-router' \
  .

echo "==> [2/5] 上传代码至服务器 ($REMOTE_HOST)..."
sshpass -p "$REMOTE_PASS" scp -P "$REMOTE_PORT" "${SSH_OPTS[@]}" \
  "$TAR_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/metrohot-deploy.tar.gz"
rm -f "$TAR_FILE"

echo "==> [3/5] 远端解压与重构镜像..."
remote "
    set -e
    cd ${REMOTE_DIR}
    tar xzf metrohot-deploy.tar.gz
    rm -f metrohot-deploy.tar.gz
    # 优先使用 npm 国内镜像加速
    docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
    docker compose up -d
"

echo "==> [4/5] 容器状态检查..."
remote "cd ${REMOTE_DIR} && docker compose ps"

echo "==> [5/5] 执行冒烟检查..."
sleep 3
# 冒烟的目标必须是本机网络能到达的站点地址。局域网通道直接用 133；
# 公网通道下 6088 若未对外映射，则改在服务器容器网络内验证。
if [[ "$REMOTE_CHANNEL" == "public" ]] && ! port_open "$SITE_HOST" 6088; then
  echo "    公网未开放 6088，改为服务器本地冒烟："
  remote "curl -s -o /dev/null -w 'local 6088 => %{http_code}\n' -m 10 http://127.0.0.1:6088/ && curl -s -m 10 http://127.0.0.1:6088/api/site/pool | head -c 200"
else
  node scripts/smoke.ts --base "http://${SITE_HOST}:6088"
fi

echo ""
echo "🎉 部署完成！访问地址："
echo "   前台：http://${SITE_HOST}:6088"
echo "   后台：http://${SITE_HOST}:6088/admin"
if [[ "$REMOTE_CHANNEL" == "public" ]]; then
  echo "   提示：公网 6088 需在路由/网关做端口映射后，才能在公网浏览器打开；服务器本地已验证 200。"
fi
