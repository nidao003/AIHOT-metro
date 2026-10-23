---
name: metrohot-deploy
description: >
  MetroHOT (地铁与城轨热点平台) 的测试服务器部署操作手册，目标环境为局域网测试机器 192.168.3.133。
  当用户提到"部署"、"更新服务器"、"发布到测试机"、"部署到133"、"更新133"、"测试环境部署"、
  "重启133服务"、"192.168.3.133"等场景时使用此技能。
---

# MetroHOT 133 测试服务器部署操作手册

> **测试服务器**：局域网 `192.168.3.133:22`（主通道）/ 公网 `ooh.oohforce.com:228`（备用通道）  
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

## 常用部署方式

### 方式 1：一键脚本执行（推荐）
在本地终端执行项目根目录下的部署脚本：
```bash
./scripts/deploy-133.sh
```
该脚本会自动：
1. 打包本地必要代码（排除 `.git`、`node_modules` 等无关文件）。
2. 通过 scp 推送至 133 服务器 `/home/oohclaw/metrohot-deploy`。
3. 在 133 上执行 `docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com` 并 `docker compose up -d`。
4. 运行 `node scripts/smoke.ts --base http://192.168.3.133:6088` 自动验证 29 项核心端点。

### 方式 2：分步手动部署（调试时使用）

```bash
# 1. 本地打包
tar -czf /tmp/metrohot-deploy.tar.gz \
  --exclude='.git' --exclude='.env' --exclude='node_modules' --exclude='.data' \
  --exclude='apps/web/build' --exclude='.spec-workflow' .

# 2. 上传代码
sshpass -p 'oohforceb3505' scp -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  /tmp/metrohot-deploy.tar.gz oohclaw@192.168.3.133:/home/oohclaw/metrohot-deploy/

# 3. 登录并重启服务
sshpass -p 'oohforceb3505' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no oohclaw@192.168.3.133 "
  cd /home/oohclaw/metrohot-deploy
  tar xzf metrohot-deploy.tar.gz && rm -f metrohot-deploy.tar.gz
  docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
  docker compose up -d
"

# 4. 验证服务
curl -sI http://192.168.3.133:6088
node scripts/smoke.ts --base http://192.168.3.133:6088
```

---

## 运维与排障命令

```bash
# 查看容器运行状态
sshpass -p 'oohforceb3505' ssh oohclaw@192.168.3.133 "cd /home/oohclaw/metrohot-deploy && docker compose ps"

# 查看各组件实时日志
sshpass -p 'oohforceb3505' ssh oohclaw@192.168.3.133 "cd /home/oohclaw/metrohot-deploy && docker compose logs -f api worker web"

# 仅重启 worker 或 api 服务
sshpass -p 'oohforceb3505' ssh oohclaw@192.168.3.133 "cd /home/oohclaw/metrohot-deploy && docker compose restart worker api"

# 停止服务
sshpass -p 'oohforceb3505' ssh oohclaw@192.168.3.133 "cd /home/oohclaw/metrohot-deploy && docker compose down"
```
