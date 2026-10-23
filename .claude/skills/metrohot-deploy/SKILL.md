---
name: metrohot-deploy
description: >
  MetroHOT (地铁与城轨热点平台) 的测试服务器部署操作手册。目标机器 133 有两条 SSH 通道：
  局域网 192.168.3.133:22（主）与公网 ooh.oohforce.com:228（备，局域网不通时自动切换）。
  当用户提到"部署"、"更新服务器"、"发布到测试机"、"部署到133"、"更新133"、"测试环境部署"、
  "重启133服务"、"192.168.3.133"、"ooh.oohforce.com"、"外网部署"、"公网部署"、"局域网不通"等场景时使用此技能。
---

# MetroHOT 133 测试服务器部署操作手册

> **两条 SSH 通道指向同一台机器**：
> - 局域网 `192.168.3.133:22`（主通道）
> - 公网 `ooh.oohforce.com:228`（备用通道，局域网不通时用）
>
> **SSH 用户**：`oohclaw`，**密码**：`oohforceb3505`
> **远端部署目录**：`/home/oohclaw/metrohot-deploy`
> **对外访问端口**：`6088`
> **前台地址**：`http://192.168.3.133:6088`
> **管理后台**：`http://192.168.3.133:6088/admin`

---

## 核心约定（必读）

1. **Mac 本机仅作为代码开发与单元测试**，禁止在 Mac 本机常驻 Docker 部署服务，避免资源浪费与端口占用。
2. **所有测试环境部署一律发布到 133 机器**。
3. **生产环境部署目前暂未确认**，在开发完成前不进行生产部署。
4. **端口规范**：
   - Web 容器对外映射端口严格锁定为 **`6088`**。
   - `db`、`api`、`worker` 均在内部 Docker 网络通信，不对宿主机暴露端口，绝对避免与 133 上已有的 MySQL(3306)、Postgres(5432/15432)、Redis(6379/16379)、MinIO 等既有业务产生冲突。

---

## 通道选择

| 通道 | 地址 | 何时用 |
|---|---|---|
| 局域网 | `192.168.3.133:22` | 本机与服务器在同一网段时，延迟低 |
| 公网 | `ooh.oohforce.com:228` | 局域网不通（外网办公、出差、网段变更）时 |

**部署脚本默认 `auto`**：先探测局域网 22 端口，通就用局域网，不通自动切公网，无需手动指定。

手动指定通道：

```bash
REMOTE_CHANNEL=public ./scripts/deploy-133.sh   # 强制走公网
REMOTE_CHANNEL=lan    ./scripts/deploy-133.sh   # 强制走局域网
```

**关于公网访问站点**：公网入口只映射了 SSH(228) 与既有业务端口。`ooh.oohforce.com:6088` 当前被其他设备占用（TCP 可连但 HTTP 无响应），**metrohot 站点只能在局域网内用 `192.168.3.133:6088` 访问**。若日后需要公网访问站点，需在路由器/网关上为 6088 做端口映射，或经 lucky 网关加一条域名反代。

---

## 常用部署方式

### 方式 1：一键脚本执行（推荐）

```bash
./scripts/deploy-133.sh
```

该脚本会自动：
1. 选择 SSH 通道（auto：局域网优先，不通走公网）。
2. 打包本地必要代码（排除 `.git`、`.env`、`node_modules`、`.data` 等）。
3. 通过 scp 推送至 `/home/oohclaw/metrohot-deploy`。
4. 在服务器上执行 `docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com` 并 `docker compose up -d`。
5. 执行冒烟检查：局域网通道跑本地 `scripts/smoke.ts`；公网通道下若 6088 对外不可达，改为在服务器内 `curl 127.0.0.1:6088` 验证。

### 方式 2：使用远程助手（交互操作）

```bash
source scripts/metrohot-remote.sh

metrohot-env                                    # 查看两条通道的实时可达性
metrohot-ssh "cd /home/oohclaw/metrohot-deploy && docker compose ps"
metrohot-ssh -c public "docker compose logs --tail=50 api"
metrohot-scp ./some-file  /home/oohclaw/metrohot-deploy/
```

`metrohot-ssh` 和 `metrohot-scp` 不指定 `-c` 时也是自动选通道。

### 方式 3：分步手动部署（调试时使用）

```bash
CH=ooh.oohforce.com; PT=228     # 局域网时改成 CH=192.168.3.133; PT=22

# 1. 本地打包
tar -czf /tmp/metrohot-deploy.tar.gz \
  --exclude='.git' --exclude='.env' --exclude='node_modules' --exclude='.data' \
  --exclude='apps/web/build' --exclude='.spec-workflow' .

# 2. 上传代码
sshpass -p 'oohforceb3505' scp -P $PT -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  /tmp/metrohot-deploy.tar.gz oohclaw@$CH:/home/oohclaw/metrohot-deploy/

# 3. 登录并重启服务
sshpass -p 'oohforceb3505' ssh -p $PT -o StrictHostKeyChecking=no -o PubkeyAuthentication=no oohclaw@$CH "
  cd /home/oohclaw/metrohot-deploy
  tar xzf metrohot-deploy.tar.gz && rm -f metrohot-deploy.tar.gz
  docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
  docker compose up -d
"

# 4. 验证服务（局域网内才可用 133 地址）
curl -sI http://192.168.3.133:6088
node scripts/smoke.ts --base http://192.168.3.133:6088
```

---

## 运维与排障命令

以下统一用助手函数，自动走可用通道。不用助手时，把 `-p 228` 和主机名换成对应通道即可。

```bash
source scripts/metrohot-remote.sh

# 查看容器运行状态
metrohot-ssh "cd /home/oohclaw/metrohot-deploy && docker compose ps"

# 查看各组件实时日志
metrohot-ssh "cd /home/oohclaw/metrohot-deploy && docker compose logs -f api worker web"

# 仅重启 worker 或 api 服务
metrohot-ssh "cd /home/oohclaw/metrohot-deploy && docker compose restart worker api"

# 停止服务
metrohot-ssh "cd /home/oohclaw/metrohot-deploy && docker compose down"
```

---

## 排障速查

| 现象 | 原因 | 处理 |
|---|---|---|
| `ssh: connect to host 192.168.3.133 port 22: Operation timed out` | 本机不在局域网网段 | 改用公网通道（脚本 auto 已自动切换） |
| `sshpass: command not found` | 未装 sshpass | macOS `brew install sshpass`；Linux `apt install sshpass` |
| 公网通道慢或超时 | 公网路由质量 | 脚本已为公网通道加 `ConnectTimeout=30` 与 `ServerAliveInterval=15` |
| 容器起来了但页面打不开 | `.env` 未同步或被本地覆盖 | 部署脚本已排除 `.env`；服务器配置在 `/home/oohclaw/metrohot-deploy/.env`，改动后需 `docker compose down && up -d`（`restart` 不重读环境变量） |
| 模型调用报 `Model default is not configured` | 容器环境变量没刷新 | `docker compose down && docker compose up -d` |
| 站点 6088 公网打不开 | 公网只映射了 SSH 端口 | 保持局域网访问，或在网关加端口映射/域名反代 |
