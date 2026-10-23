# 133 测试服务器部署指南

本项目采用前后端一体化与轻量容器化部署。测试环境已固定部署至局域网机器 **`192.168.3.133`**。

## 机器与端口信息

- **SSH 通道**（两条指向同一台机器）：
  - 局域网 `192.168.3.133:22`（主）
  - 公网 `ooh.oohforce.com:228`（备，局域网不通时自动切换）
- **SSH 用户 / 密码**：`oohclaw` / `oohforceb3505`
- **部署目录**：`/home/oohclaw/metrohot-deploy`
- **对外访问端口**：**`6088`**
- **读者前台**：`http://192.168.3.133:6088`
- **管理后台**：`http://192.168.3.133:6088/admin`
- **后台账号密码**：账号任意，密码查看服务器 `.env` 中的 `ADMIN_PASSWORD`

> **公网访问站点**：公网入口只映射了 SSH(228) 与既有业务端口，`ooh.oohforce.com:6088` 当前被其他设备占用。metrohot 站点仍需在局域网内用 `192.168.3.133:6088` 访问；如需公网访问，要在路由器上为 6088 做端口映射，或经网关加域名反代。

## 环境规则

1. **Mac 本机仅供代码开发与单元测试**，开发完成后通过部署技能推送到 133，不保留 Mac 本机的 Docker 容器运行。
2. **端口隔离**：为防止与 133 机器上已有的业务系统（MySQL、PostgreSQL 16、Redis、MinIO、Web网关）产生端口冲突，本项目的数据库、API 与后台 Worker 一律仅在内部 Docker 网络通信，**宿主机只映射 6088 端口**。
3. **一键部署**（自动选通道）：
   ```bash
   ./scripts/deploy-133.sh

   # 强制指定通道
   REMOTE_CHANNEL=public ./scripts/deploy-133.sh
   REMOTE_CHANNEL=lan    ./scripts/deploy-133.sh
   ```
4. **远程运维助手**：
   ```bash
   source scripts/metrohot-remote.sh
   metrohot-env                       # 查看两条通道可达性与自动选择结果
   metrohot-ssh "docker compose ps"
   metrohot-scp ./file /home/oohclaw/metrohot-deploy/
   ```
5. **生产环境**：目前仍处于开发定制阶段，生产服务器信息暂未确认，待后续通知。
