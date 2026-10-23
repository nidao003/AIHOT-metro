#!/usr/bin/env bash
# ============================================================================
#  MetroHOT 133 测试服务器的跨平台 SSH/SCP 助手（macOS / Linux）
# ============================================================================
# 两条通道指向同一台机器，局域网不通时走公网：
#   局域网  192.168.3.133:22
#   公网    ooh.oohforce.com:228
#
# 用法（先 source 一次，或直接用下面的命令）：
#   source scripts/metrohot-remote.sh
#
#   metrohot-ssh  "docker compose ps"              # 自动选通道（局域网优先）
#   metrohot-ssh  -c public "docker compose logs"  # 强制走公网
#   metrohot-scp  ./web/dist  /home/oohclaw/metrohot-deploy/web/dist
#   metrohot-check-port 192.168.3.133 22
# ----------------------------------------------------------------------------

: "${METROHOT_SSH_PASS:=oohforceb3505}"
: "${METROHOT_SSH_USER:=oohclaw}"
: "${METROHOT_DEPLOY_DIR:=/home/oohclaw/metrohot-deploy}"

_metrohot_channel_lan()    { echo "192.168.3.133:22"; }
_metrohot_channel_public() { echo "ooh.oohforce.com:228"; }

# ============================================================================
#  metrohot-check-port  -  端口探测（macOS / Linux 兼容）
# ============================================================================
metrohot-check-port() {
    local host="$1" port="$2"
    if [[ -z "$host" || -z "$port" ]]; then
        echo "Usage: metrohot-check-port <host> <port>" >&2
        return 1
    fi
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if nc -z -G 3 "$host" "$port" 2>/dev/null; then echo "OPEN"; else echo "CLOSED"; fi
    elif command -v nc >/dev/null 2>&1; then
        if nc -z -w 3 "$host" "$port" 2>/dev/null; then echo "OPEN"; else echo "CLOSED"; fi
    else
        if (echo >/dev/tcp/"$host"/"$port") 2>/dev/null; then echo "OPEN"; else echo "CLOSED"; fi
    fi
}

# ============================================================================
#  metrohot-pick-channel  -  自动选通道：局域网通就用局域网，否则公网
# ============================================================================
metrohot-pick-channel() {
    if metrohot-check-port 192.168.3.133 22 2>/dev/null | grep -q OPEN; then
        echo "lan"
    else
        echo "public"
    fi
}

# ============================================================================
#  metrohot-ssh  -  在 133 上跑命令
# ============================================================================
metrohot-ssh() {
    local channel="auto"
    local cmd=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -c|--channel) channel="$2"; shift 2 ;;
            -h|--help)
                echo "Usage: metrohot-ssh [-c auto|lan|public] <command>"
                return 0 ;;
            *) cmd="$1"; shift ;;
        esac
    done

    if [[ -z "$cmd" ]]; then
        echo "Usage: metrohot-ssh [-c auto|lan|public] <command>" >&2
        return 1
    fi

    if ! command -v sshpass >/dev/null 2>&1; then
        echo "ERROR: 需要 sshpass。macOS: brew install sshpass / Linux: sudo apt install sshpass" >&2
        return 1
    fi

    [[ "$channel" == "auto" ]] && channel=$(metrohot-pick-channel)

    local host port extra=()
    if [[ "$channel" == "public" ]]; then
        host="ooh.oohforce.com"; port="228"
        extra=(-o ConnectTimeout=30 -o ServerAliveInterval=15)
    else
        host="192.168.3.133"; port="22"
        extra=(-o ConnectTimeout=15)
    fi

    sshpass -p "$METROHOT_SSH_PASS" ssh \
        -o StrictHostKeyChecking=no \
        -o PubkeyAuthentication=no \
        "${extra[@]}" -p "$port" \
        "$METROHOT_SSH_USER@$host" "$cmd"
}

# ============================================================================
#  metrohot-scp  -  上传文件/目录到 133
# ============================================================================
metrohot-scp() {
    local channel="auto"
    local local_path="" remote_path=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -c|--channel) channel="$2"; shift 2 ;;
            -h|--help)
                echo "Usage: metrohot-scp [-c auto|lan|public] <local-path> <remote-path>"
                return 0 ;;
            *)
                if [[ -z "$local_path" ]]; then local_path="$1"; else remote_path="$1"; fi
                shift ;;
        esac
    done

    if [[ -z "$local_path" || -z "$remote_path" ]]; then
        echo "Usage: metrohot-scp [-c auto|lan|public] <local-path> <remote-path>" >&2
        return 1
    fi

    if ! command -v sshpass >/dev/null 2>&1; then
        echo "ERROR: 需要 sshpass。" >&2
        return 1
    fi

    [[ "$channel" == "auto" ]] && channel=$(metrohot-pick-channel)

    local host port
    if [[ "$channel" == "public" ]]; then
        host="ooh.oohforce.com"; port="228"
    else
        host="192.168.3.133"; port="22"
    fi

    sshpass -p "$METROHOT_SSH_PASS" scp \
        -o StrictHostKeyChecking=no \
        -o PubkeyAuthentication=no \
        -P "$port" -r \
        "$local_path" "$METROHOT_SSH_USER@$host:$remote_path"
}

# ============================================================================
#  metrohot-env  -  打印当前配置
# ============================================================================
metrohot-env() {
    cat <<EOF
User:       $METROHOT_SSH_USER
DeployDir:  $METROHOT_DEPLOY_DIR
LAN:        $(_metrohot_channel_lan)   => $(metrohot-check-port 192.168.3.133 22)
Public:     $(_metrohot_channel_public) => $(metrohot-check-port ooh.oohforce.com 228)
Auto pick:  $(metrohot-pick-channel)
sshpass:    $(command -v sshpass 2>/dev/null || echo "NOT FOUND")
EOF
}
