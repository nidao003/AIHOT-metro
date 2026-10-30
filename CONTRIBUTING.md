# 参与贡献

本仓库是 **MetroHot** 站点的定制版本（基于 [AIHOT](https://github.com/KKKKhazix/AIHOT) 框架），不是通用框架仓库。这里接受的是本站相关的改动；对引擎、公开接口、后台等通用能力的改进，请提交到上游 [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT)。

## 这里收什么

- 新的城轨行业信源、失效信源的修复与选择器更新（`industry/sources.json`，该文件只在部署环境，不入库）
- 分类、标签、主题、主体名录的补充与修正（`industry/taxonomy.ts`、`industry/topics.json`）
- 精选、写作、归组提示词与门槛的调整（`industry/prompts/`、`industry/selection.ts`）
- 站点文案、条款页、更新日志（`site/`）
- 采集与入库链路的 Bug 修复，以及可复现问题的测试

## 安全底线

本仓库是公开的，提交前必须确认：

- 不提交 `.env`、API Key、管理员密码、Cookie、服务器凭据、生产数据与完整数据库导出；
- `docs/`（运维手册与行业调研）与 `scripts/deploy-*`、`scripts/metrohot-remote.sh`、`scripts/cron-*` 等私有脚本已在 `.gitignore` 中，不要强行加入；
- 日志、截图和示例数据里的敏感信息要先移除。

## 提交改动

1. 从最新 `main` 拉分支，一次提交解决一个清楚的问题，不夹带无关重构和依赖锁文件的变动。
2. 先读本地仓库根目录的 `AGENTS.md`（不入库），尤其是“仓库边界”和“要守住的规则”两节。
3. 本地验证：

   ```bash
   npm run typecheck
   DATABASE_URL=postgres://127.0.0.1:5432/metrohot_test npm test
   npm run build -w @aihot/web && node --test apps/web/tests/*.test.ts
   ```

   改采集、日期解析、正文清洗、精选或归组的，用真实信源跑改动前后对比，并说明有多少条结果变了、变的是否都对。测试守行为不守写法，不为一处修复新开测试文件。

4. 提交信息使用 Conventional Commits，描述用中文，例如 `fix(sources): 修复南京地铁招标列表选择器失效`。

## 合并上游更新

```bash
git fetch upstream
git merge upstream/main
```

冲突处理：`site/`、`industry/` 与本站自己的改动保留本站内容；`apps/`、`packages/` 以上游为准，本站对框架的补丁逐个重新应用。合并后至少跑 `npm run typecheck` 和网页构建，涉及采集链路的用真实信源抽样验证。

## 许可

代码沿用 [MIT 许可证](LICENSE)。AIHOT 的名字与 Logo 不在许可范围内。
