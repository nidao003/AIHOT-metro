---
name: metrohot-sources
description: >
  MetroHOT 信息源采集与接入作战手册：从零为一个城市/主体找到可抓取的一手信源，
  验证选择器、写 sources.json 配置、实测抓取、部署上线。包含 SPA/WAF/编码/TLS/JS 跳转等
  实战坑位与对策，以及业主官网、公共资源交易中心、产权交易所、国资委阳光采购四类官方渠道地图。
  当用户提到"补充信源"、"接入 XX 城市"、"找官网"、"招标渠道"、"这个站抓不到"、
  "信息源不全"、"新一线城市"等场景时使用。
---

# MetroHOT 信息源采集作战手册

> **全国性兜底源**：当某城市官网抓不到时，按此顺序找替代：
> ① 该市**公共资源交易平台**（多数支持关键词搜索，如重庆 `cqggzy.com/trade/014001?keyword=轨道交通`）
> ② **行业媒体**（城市交通网 `chinaiut.com/zhaobiao`、`/zhongbiao`，中城轨网 `rail-transit.com`）
> ③ 省级交易平台兜底（如昆明用 `ggzy.yn.gov.cn`）

> 目标：**一手、零噪声、可持续**。宁可少接一个源，也不接转载站或高噪声源。
> 所有结论都要用真实抓取验证，不靠推测。

---

## 零、自动化工具（先跑它，再动手）

**`scripts/probe-source.ts`** —— 输入一个列表页 URL，自动完成第 2–5 步：

```bash
node scripts/probe-source.ts "https://www.nbmetro.com/tender_report.php"
```

输出：

1. 连通性（状态码、字节数、最终 URL）
2. **页面形态判断**：服务端渲染 / SPA 壳 / 空响应体 / 拦截页
3. **候选条目容器**：自动找「每行一个、带日期」的重复结构，按出现次数排序
4. **推测的子选择器**：行内最长文本的链接（标题）、只含日期的叶子节点（发布时间）
5. **实测验证**：用真实采集器跑一遍，给出条数、日期解析率、首条内容
6. **推荐配置**：直接可粘贴进 `sources.json` 的 JSON

**用法约定**：
- 工具说「服务端渲染」→ 直接用它给的配置，改 name/owner_entity_id/tags 即可
- 工具说「SPA 壳」或「空响应体」→ 跳过选择器环节，直接去抓 XHR 接口（第 4 步）
- 工具说「全部候选都失败」→ 看它打印的首条文本，多半是选择器抓到了导航项，手工收窄

**批量探测 `scripts/probe-cities.ts`** —— 一次跑几十个城市，输出可直接粘贴的 Markdown 表：

```bash
cat > /tmp/cities.json <<'EOF'
[{"name":"无锡","official":"http://www.wxmetro.net"},
 {"name":"常州","official":"http://www.czmetro.net.cn","trading":"http://ggzy.changzhou.gov.cn"}]
EOF
node scripts/probe-cities.ts /tmp/cities.json          # 表格
node scripts/probe-cities.ts /tmp/cities.json --json   # 结构化结果 → /tmp/probe-cities-result.json
```

每条输出：渠道（官网/交易平台）、形态、条数、**推断出的选择器**、日期解析率。
`--json` 的结果可以直接喂给后续的自动写配置流程。

**这是扩展到几十个城市的关键工具**：不要逐个手跑 `probe-source.ts`，也不要手工填表。

**工具的已知盲区**（遇到就手工补，并回来升级工具）：
- 日期顺序反写（成都 `08-26` + `2026` 分两个节点）识别不到
- 纯表格 `<tbody><tr>` 结构
- 卡片式 `<article data-id>` 无 `<a href>` 的站
- 详情链接藏在 `onclick` 里的站

---

## 零之二、自更新协议（每轮结束必做）

技能的价值在于积累，不在当下。**每完成一轮采集，逐项执行**，不允许跳过：

| 动作 | 更新位置 | 触发条件 |
|---|---|---|
| 新接入一个源 | 第四节「官方渠道地图」+ 第五节「城市进度表」 | 每次 |
| 发现新的坑 | 第三节「实战坑位」，写清现象 → 根因 → 对策 | 每次 |
| 某个站被证伪 | 第四节「已知不可用」，写明原因，防止后人重试 | 每次 |
| 工具判断失误 | 第零节「已知盲区」，并考虑升级 `probe-source.ts` | 每次 |
| 破解了某个反爬/SPA | 第三节新增坑位 + 记录可复用的接口模式 | 每次 |

**判断标准**：如果下一轮的我（或另一个人）看到手册，能否不重复踩同一个坑、不重试同一个死站？
做不到就是没更新到位。

**升级工具的门槛**：同一种失败形态出现 2 次以上，就把它写进 `probe-source.ts`，而不是每次手工处理。

---

## 一、核心流程（五步）

### 第 1 步：定位官方渠道

一个城市的轨道交通信息有四个官方层级，按优先级探测：

| 层级 | 典型域名 | 覆盖 | 一手性 |
|---|---|---|---|
| **业主官网** | `xxmetro.com` / `xx-mtr.com` | 新闻、运营动态、部分招标 | 一手 |
| **业主自建采购平台** | `zhaocai.*` / `cg.*` / `bid.*` / `zb.*` | 工程、设备、服务招标 | 一手 |
| **地方公共资源交易中心** | `ggzyfw.*` / `ggzy.*.gov.cn` / `*.ggzy.com` | 依法必须招标的项目 | 一手（政府平台） |
| **产权交易所** | `*.gemas.com.cn` / `cbex` / `suaee` / `sotcbb` | 商铺租赁、广告经营权、资产处置 | 一手（交易所挂牌） |
| **国资委阳光采购** | `zc.cbexepp.com.cn` / `shoucaicloud.com` 等 | 市属国企非必须招标采购 | 一手 |

**反向搜索法（找不到入口时最有效）**：
拿一条已知的具体公告标题（如「北京地铁既有线便民用房招商项目」）去搜，看它出现在哪些域名。
第三方转载页里通常能看到「招标人」「代理机构」「发布媒介」，据此反推官方源头。
**不要正向猜域名，要反向追公告。**

### 第 2 步：探测连通性与页面形态

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
curl -s -L -A "$UA" -m 20 -o /dev/null -w "%{http_code} %{size_download}B\n" "<URL>"
```

判断页面形态：

| 现象 | 形态 | 对策 |
|---|---|---|
| 返回 200 + 大体积 HTML，`<li>` 里有标题和日期 | **静态列表** | 直接提选择器 |
| 返回 200 但 body 极小（几百字节） | **SPA 壳** | 找 API（见第 4 步） |
| 返回 200 但 **0 字节** | **SSR + token 或反爬** | 找 JSON 接口（见坑位 3） |
| 返回 521 | **加速乐 JS 挑战** | Node 沙箱可过一层，过不了二层，放弃 |
| 返回 403 | **WAF/需登录** | 加完整浏览器头重试，仍不行则放弃 |
| `ERR_SSL_BAD_ECPOINT` | **TLS 曲线不兼容** | 已全局修复（见坑位 6） |

### 第 3 步：找列表页与栏目

- 从首页扫全部 `<a>`，筛含「新闻/公告/招标/采购/招商/公示/交易」的链接
- 栏目可能有多层，注意**子栏目才是专项**（例：广州 `bizzbgg` 里没有广告，广告在子栏目 `bid_zbgg_yysy_9`）
- 地方交易平台的栏目 ID 通常能枚举，从 `GET /channel/list` 之类接口一次性拿全

### 第 4 步：找数据接口（SPA / 空 body 必做）

**方法 A：浏览器抓包**（最可靠）

```bash
agent-browser open "<URL>" >/dev/null 2>&1
sleep 5
agent-browser network requests 2>&1 | grep -ivE "\.(js|css|png|jpg|gif|svg|ico|woff|ttf)"
```

**方法 B：拦截 XHR/fetch 拿请求体**

```bash
agent-browser eval "
(() => {
  window.__cap=[];
  const o=XMLHttpRequest.prototype.open, s=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,u){this.__u=u;return o.apply(this,arguments)};
  XMLHttpRequest.prototype.send=function(b){if(String(this.__u).includes('KEYWORD'))window.__cap.push(String(b));return s.apply(this,arguments)};
  return 'ok';
})()"
# 然后操作页面触发请求，再读 window.__cap
```

**方法 C：直接猜常见参数**
关键词参数在不同站叫法不同，实测过的：`title`、`KEY`、`qt`、`keyword`、`searchKey`。
频道参数注意**单复数**：上海是 `channelIds`（复数），`channelId`（单数）不生效。

### 第 5 步：验证选择器 + 写配置 + 实测

```typescript
// /tmp/probe.ts —— 用真实 HTML 跑解析，不靠肉眼判断
import { fetchWebList } from "/Users/daodao/Documents/Mactext/dsl/AIHOT/packages/backend/src/sources/web-list.ts";
const s = { id:"t", kind:"web_list", config:{ url:"…", itemSelector:"…", titleSelector:"…", publishedAtSelector:"…" } };
const out = await fetchWebList({ ...s, enabled: true });
console.log(out.length, out[0]);
```

写进 `industry/sources.json` → 再跑一次实测 → 跑 `npm run typecheck` + `npm run test:standalone` → 部署。

---

## 二、配置字段速查

### web_list（服务端渲染的 HTML 列表）

```json
{
  "id": "web-xxx", "name": "中文名", "kind": "web_list",
  "tier": "T1", "owner_entity_id": "实体id",
  "interval_minutes": 180,
  "config": {
    "url": "列表页地址",
    "itemSelector": "ul.list > li",
    "linkSelector": "a",
    "titleSelector": ".title",
    "publishedAtSelector": ".date",
    "publishedAtUtcOffset": "+08:00",
    "detail": { "maxFetches": 12, "summarySelector": ".content", "publishedAtSelector": ".source li" }
  },
  "tags": ["官方", "招标采购"], "site_fulltext": false, "syndicate_fulltext": false
}
```

- `detail` 只在列表页缺日期或缺正文时才需要
- `publishedAtRegex` 可替代 `publishedAtSelector`（正则取日期）
- `publishedAtAuthoritative: true` 表示日期只认详情页，列表页日期不可信

### json_list（JSON 接口）

```json
{
  "kind": "json_list",
  "config": {
    "url": "接口地址（可带查询参数）",
    "itemsPath": "data.records",
    "titlePaths": ["title"],
    "urlTemplate": "https://site/detail?id={id}",
    "publishedAtPath": "publishTime",
    "summaryPaths": ["content"], "summaryIsBody": true,
    "publishedAtUtcOffset": "+08:00"
  }
}
```

- `summaryIsBody: true` 把 summary 当正文用，适合接口直接返回全文的站（上海公共资源、北交所阳光采购）
- POST 接口用 `"method": "POST"` + `"bodyJson": {...}`
- `headers` 可加自定义请求头

### 分级（tier）

| tier | 含义 | 门槛 |
|---|---|---|
| T1 | 官方一手（业主官网、政府平台、交易所） | 60 |
| T1_5 | 官方账号/合资运营主体（京港、港铁深圳） | 65 |
| T2 | 行业媒体、聚合站 | 74 |

**能用 T1 就不要用 T2。** 中城轨网（rail-transit.com）是唯一保留的 T2，因为它是全国覆盖且零噪声。

---

## 三、实战坑位与对策

### 坑 1：SPA（Nuxt / Vue / React）

现象：HTML 里只有 `<div id="app"></div>` 或 `window.__NUXT__`，没有列表。

对策：
- 找 `_nuxt/entry.*.js` 里的接口路径
- 或浏览器抓包找 XHR
- 港铁深圳：`/server-front/front/content/page?channelIdStr=<id>` 返回结构化 JSON
- 广州产权交易所：`/api/admin/app/listingProject?title=<关键词>` 支持关键词过滤

### 坑 2：列表页返回 0 字节（SSR + token）

**上海公共资源交易中心实例**：`/jyxxwzcggg/` 直接请求返回 200 但 body 为空，浏览器也空白，看着像反爬。

真相：列表页是 SSR + `cExt` JWT 渲染。真实接口是：

```
GET /content/page?channelIds=<频道ID>&title=<关键词>&pageNo=1&pageSize=20
```

无需登录、返回完整 JSON、连正文（`txtCleanHtml`）都有。频道 ID 从 `GET /channel/list` 拿。

**教训：0 字节 ≠ 反爬，先找 JSON 接口再下结论。**

### 坑 3：链接有三种形态，改解析逻辑必须全量回归

`href` 在实际站点里有三种形态，**任何一种处理错都会导致整站采集静默失败（返回 0 条，不报错）**：

| 形态 | 例子 | 处理 |
|---|---|---|
| 绝对 URL | `https://www.zzmetro.cn/nav/article-detail/33/35/10239` | 原样使用 |
| 无 scheme 的相对路径 | `tender.php?info/11386`、`./202610/x.html`、`/p1/x.html`、`#anchor` | 原样使用，交给 URL 解析器拼 base |
| 带其他 scheme | `javascript:navigateTo('/p1/xwzx/x.html')` | 从引号参数里提取 |

`web-list.ts` 的 `hrefTarget()` 就是按这三条分支实现的。

**血泪教训**：这两条分支我先后各漏过一条——
- 先漏了「无 scheme 相对路径」，导致宁波 `tender.php?info/11386` 全部被丢弃
- 补上后又漏了「绝对 URL」，导致郑州 `https://www.zzmetro.cn/...` 全部被丢弃

两次都是**静默失败**（`no items matched`），没有异常堆栈。

**规则**：改 `hrefTarget` / `absolute` / `fromHtml` 这类链接解析逻辑后，必须跑一遍全部已接入源的抓取回归，不能只测当前在调的那一个站。

```typescript
// 回归脚本模板
import { fetchWebList } from ".../sources/web-list.ts";
import { readFileSync } from "node:fs";
const all = JSON.parse(readFileSync("industry/sources.json","utf-8")).sources;
for (const s of all.filter((x:any) => x.kind === "web_list" && x.enabled !== false)) {
  try { const o = await fetchWebList({...s, enabled:true} as never);
        if (!o.length) console.log(`⚠️ ${s.id} 0 条`); }
  catch(e:any) { console.log(`❌ ${s.id} ${e.message}`); }
}
```

### 坑 3b：`onclick` 只有 id、拼不出 URL

城轨采购网 `mtrmart.com` 的列表是 `<span onclick="gotoPage('1','uuid')">`，`gotoPage` 内部按 type 拼不同前缀（`/Purchase/Notice/NewDetail?Id=` 或 `/Bids/BidsNotice/NewDetail?Id=`），单靠 CSS + 正则拿不到完整 URL。**当前解析器不支持，需要改用 JSON 接口或换入口。**

### 坑 3c：列表里混着导航项

`li.wow` 这类笼统选择器会把导航项一起抓进来（天津 `channels/17.html` 的「运营新闻 / 运营公告」导航就是 `li.wow`）。

对策：用「列表项独有的特征」收窄，比如 `li.wow:has(span)`（列表项有日期 span，导航项没有），或者 `li:has(a[href^="/contents/"])` 配合排除 `.pr`。

**验证方法**：跑一次看第一条的标题——如果抓到的是「信息公开」「运营新闻」这类导航文字，就是选择器太宽。

### 坑 3d：`.../index.htm` 是自跳转陷阱

长沙 `hncsmtr.com/908/944/index.htm` 返回 113 字节：

```html
<script>window.location.href=''+'/'+'9'+'0'+'8'+'/'+'9'+'4'+'4'+'/'+'i'+'n'+'d'+'e'+'x'+'.'+'h'+'t'+'m';</script>
```

它跳回自己，任何跟随重定向的客户端都拿到空页面。**该站正确的地址是带尾斜杠的目录形式** `/908/944/`（20KB），`/908/944`（无斜杠）则 403。

**对策**：看到「200 但只有一百多字节、内容是拼接字符串的 script」时，试「目录形式 + 尾斜杠」和「去掉 index 后缀」两种写法。

### 坑 3e：日期拆成兄弟节点

同一个日期被拆进两个元素，选择器只能拿到半截：

| 站 | HTML | textContent |
|---|---|---|
| 长沙 | `<span class="listday">09</span><span class="listyear">2026-10</span>` | `09 2026-10` |
| 成都 | `<span>08-26</span>2026` | `08-262026` |

**长沙已解决**：`publishedAtSelector: ".listyear"` 取到 `2026-10`，并给 `parseLooseDate` 加了「只有年月」的分支，按该月 1 日解析（不虚构日）。代价是日期精度降到月，对新闻列表可接受。

**成都仍未解决**：`08-262026` 没有分隔符，正则拆不开。要解只能改 `publishedAtRegex` 支持多捕获组拼接，尚未做。

### 坑 4：编码不是 UTF-8

北京地铁、部分老政务站是 `gb2312` / `gb18030`。
`http-fetch.ts` 已按 `content-type` 和 `<meta charset>` 自动解码，`gb2312` 会映射到 `gbk`。**不需要额外处理。**

### 坑 5：WAF 拦 Bot UA

现象：`UND_ERR_SOCKET: other side closed`。
`DEFAULT_UA` 已改为标准 Chrome UA。若仍被拦，加完整浏览器头（`Accept`、`Accept-Language`、`Sec-Fetch-*`）再试。

### 坑 6：`ERR_SSL_BAD_ECPOINT`

现象：curl 能访问，Node 报 TLS 错。
原因：TongWeb 等国产 Web 服务器拒绝 Node 默认的 `ecdhCurve: auto`（优先 X25519）。
已修复：`OUTBOUND_ECDH_CURVE = "X25519:P-256:P-384:P-521"`（`egress-proxy.ts`）。

**注意**：验证时要用项目的 `guardedFetch`，裸 `fetch` 不走项目 Agent，不会应用该配置。

### 坑 6b：`UNABLE_TO_VERIFY_LEAF_SIGNATURE`（证书链缺根）

现象：本地 Mac 能抓，容器里失败；或多个源里只有某一个站失败。

**先分清是「服务器发链不全」还是「我们缺根」**：

```bash
echo | openssl s_client -connect <host>:443 -servername <host> -showcerts 2>/dev/null \
  | grep -E "^ *[0-9]+ s:|^ *i:|Verify return code"
```

- `Verify return code: 0 (ok)` 且证书数 ≥2 → **服务器没问题，是我们缺根**
- `Verify return code` 非 0，或只有 1 张证书 → 服务器配置问题，我们无能为力

**这次的实例**（南京 `www.njmetro.com.cn`）：

```
叶子 (CN=njmetro.com.cn)
  → SHECA OV Server CA G5
    → UCA Global G2 Root
      → Certum Trusted Network CA   ← 服务器没发，Node 内置列表里也没有
```

容器是 `node:24-trixie-slim`，**不带系统 CA 存储**（`/etc/ssl/certs/ca-certificates.crt` 不存在），Node 用内置的 118 个 Mozilla 根证书——里面没有 Certum。

**修复**：把证书放进仓库，用 `NODE_EXTRA_CA_CERTS` 追加（不改默认列表，不影响其他站）：

```dockerfile
ENV NODE_EXTRA_CA_CERTS=/app/docker/certs/certum-chain.pem
```

**关键细节：只给根证书不够。** 实测在容器里显式 `ca: certum-root.pem` 仍然报 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`，尽管服务器在 handshake 时发了中间证书。必须把**根 + 中间证书**合并成一个 PEM：

| 顺序 | 证书 | 有效期 |
|---|---|---|
| 1 | Certum Trusted Network CA（根） | 2029+ |
| 2 | UCA Global G2 Root | 2029-01-06 |
| 3 | SHECA OV Server CA G5 | 2036-03-16 |

导出与合并：

```bash
# 根（从本机钥匙串）
security find-certificate -c "Certum Trusted Network CA" -p \
  /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/root.pem

# 中间证书（从服务器握手链里取）
echo | openssl s_client -connect <host>:443 -servername <host> -showcerts 2>/dev/null > /tmp/chain.txt
# 合并顺序：根 → UCA → SHECA（从深到浅）
```

**备选方案：装系统 CA**。`docker run --rm node:24-trixie-slim sh -c 'apt-get update && apt-get install -y --no-install-recommends ca-certificates'` 实测**可以成功**，但耗时约 3–5 分钟（133 访问 Debian 源很慢）。如果未来缺的 CA 越来越多，把这一步加回 Dockerfile 比手工维护证书文件更省心；只是每次构建都会慢几分钟。**测 apt 时不要用 180 秒以内的超时，会误判为失败。**

**为什么不能全局关闭证书校验**：那会让所有源的中间人攻击风险归零，绝不能用（仓库有测试专门拦截这类写法）。

**判断这一站要不要为它加根**：看数据价值。南京是招标 20 条 + 车站商铺招商 15 条，值。如果只是零星几条，记为「不可用」即可。

### 坑 7：加速乐（`__jsl_clearance`）双层 JS 挑战

现象：返回 521 + 一段混淆 JS。

- 第一层（字符串拼接生成 cookie）：Node `vm` 沙箱可过
- 第二层（混淆 VM 代码，依赖完整 DOM/canvas）：**Node 过不了**

对策：**放弃**。除非引入 Playwright（会给部署加一个 Chromium 容器，不划算）。
北京产权交易所 `cbex.com.cn` 就是这种情况。

### 坑 8：时间窗口过滤

首次导入只收最近的数据，老公告不会入库存量。
所以「health = ok 但 items = 0」是正常现象——抓取成功，只是内容太旧。
**不要误判为抓取失败。**

### 坑 9：栏目结构看起来一样，其实不同

广州 `bid.gzmtr.com/bizzbgg/` 主列表里没有广告类，广告在子栏目 `bid_zbgg_yysy_9/`。
**接一个栏目控制不了其他子栏目，专项内容要单独找子栏目。**

### 坑 11：正文抽取只在首次采集时执行

已入库的条目，手动将 `body_status` 设为 `pending` 并重置 `processing_state='new'`，**不会**重新去源站抓取正文——采集任务（`sources.fetch`）已经完成，worker 只会走分析步骤，分析时发现正文仍为空，就再次置为 `unconfirmed`。

**结论**：`detail.summarySelector` 配置**只对后续新采集的条目生效**，无法追溯历史。

**因此**：
- 给源配 detail 必须在**首次部署该源前**就配好
- 如果漏配了，历史存量只能接受无正文；等站点发新公告时自动就会带正文
- **不要**试图用 UPDATE articles 重置去刷历史正文，只会徒增模型调用失败日志

### 坑 12：`seed.ts` 不更新已存在的源

`scripts/seed.ts` 对 sources 表的逻辑是：

```sql
INSERT INTO sources (...) ON CONFLICT (id) DO NOTHING
```

因此，在 `industry/sources.json` 里修改已有源的配置（加 detail、改 interval 等），**重新部署不会覆盖数据库里的旧配置**。

**对策**：改了已有源的配置后，必须在数据库里直接 UPDATE：

```sql
UPDATE sources SET config = jsonb_set(config, '{detail}', '{"maxFetches": 20, "summarySelector": "..."}'::jsonb), updated_at=now() WHERE id='web-xxx';
```

### 坑 10：验证脚本的 Node 版本

项目要求 Node ≥ 24，本机默认可能是 22。
验证脚本用 `~/.nvm/versions/node/v24.13.0/bin/node --experimental-strip-types`。
生产容器是 Node 24，行为要以后者为准。

---

## 四、官方渠道地图（实测，持续补充）

### 已确认可用

| 城市 | 渠道 | 入口 | 类型 |
|---|---|---|---|
| 深圳 | 深铁采购平台 | `cg.shenzhenmc.com/{zzbgg,zzbhxrgs,zzbjggs,fcggggs,zbxmjh,zzgys,zgzgggs,zzzgg,fcgjggg}/index.jhtml` | web_list |
| 深圳 | 深铁官网 | `szmc.net/home/xinwenzhongxin/gongsigonggao/` | web_list |
| 深圳 | 港铁深圳 | `mtrsz.com.cn/server-front/front/content/page?channelIdStr=<7599/7620/8368>` | json_list |
| 广州 | 广州地铁招标 | `bid.gzmtr.com/{bizzbgg,bizzbgs}/` | web_list |
| 广州 | 资源经营子栏目 | `bid.gzmtr.com/bizzbgg/bid_zbgg_yysy_9/` | web_list |
| 广州 | 产权交易所 GEMAS | `newsys.gemas.com.cn/api/admin/app/listingProject?title=<关键词>` | json_list |
| 上海 | 公共资源·物资采购 | `shggzy.com/content/page?channelIds=<301/302>&title=地铁` | json_list |
| 北京 | 京港地铁 | `mtr.bj.cn/{news/company-news,category/business/.../tender-invitations,business/mall/business-op}` | web_list |
| 北京 | 北交所阳光采购 | `zc.cbexepp.com.cn/freecms/rest/v1/notice/selectInfoMoreChannel.do?purchaser=<采购人>` | json_list |
| 苏州 | 苏州轨交 | `sz-mtr.com/news/hot/` | web_list |
| 全国 | 中城轨网 | `rail-transit.com/{xinwen,zhaobiao,zhongbiao}/` | web_list |
| 全国 | 交通部 | `mot.gov.cn/shuju/fenxigongbao/yunlifenxi/index.html` | web_list |
| 全国 | 发改委 | `ndrc.gov.cn/xwdt/tzgg/index.html` | web_list |

### 已知不可用（不要再试）

| 渠道 | 原因 |
|---|---|
| `zhaocai.bjsubway.com` | 需登录，接口 nginx 403 |
| `eps.shmetro.com` | 已停用，`/portal/DispatchAction.do` 404 |
| `cbex.com.cn` | 加速乐二层挑战 |
| `ggzyfw.beijing.gov.cn` | 地铁占比 2%，噪声过大 |
| `shggzy.com/jyxxwzcggg/` 列表页 | 0 字节，须走 `/content/page` |
| `shexgrp.com` 综合采购 | 通用采购为主，地铁无独立分类 |
| `zhaocai.bjsubway.com` 之外的北京地铁商业 | 主体只发第三方，无官网 |

---

## 五、新一线城市清单与进度

第一财经 2025 新一线（15 城）：

| 城市 | 主体 | 官网 | 探测结论（2026-10） | 状态 |
|---|---|---|---|---|
| 成都 | 成都轨道集团 | `chengdurail.com` | ✅ dates.ts 扩展支持 MM-DDYYYY 格式后彻底解决；`h4`+`time` 成功接入轨道动态（10 条）与公告公示（3 条），全带日期 | ✅ 已接入 2 源 |
| 重庆 | 重庆轨道集团 | `cqmetro.cn`（卡片式 SPA） | ✅ 招标走公共资源交易平台 `cqggzy.com`：`/trade/014001?categoryNum=014001&keyword=轨道交通` 服务端渲染，12 条。首页卡片式仍不可用 | ✅ 已接入 1 源 |
| 杭州 | 杭州地铁 | `hzmetro.com`（SPA） | ✅ 招采平台独立域名 `zhaocai.hzmetro.com`（服务端渲染），采购/澄清/结果公示/结果公告/流标五栏结构统一：`li:has(span.Right)` + `span.Right` 日期 | ✅ 已接入 3 源 |
| 武汉 | 武汉地铁 | `whrt.com` | 302 跳到 `ww16.whrt.com/?sub1=…`（泛域名轮换） | 🟡 需跟跳转 |
| 西安 | 西安轨道 | `xianrail.com` | hash 路由 SPA；网关 `/pas-gateway-api/...`。空 body 返回 404「非法请求，请求内容不存在」，带常规分页参数返回空响应体，`OPTIONS` 预检也失败——**请求体经过签名/加密**，需要逆向前端 JS 的加密逻辑 | 🟡 需逆向签名算法 |
| 南京 | 南京地铁 | `njmetro.com.cn` | ✅ 仅 https 可用；`li.tender_tli` 招标 20 条、`li.buil_mli1li` 资源招商 15 条（日期嵌在标题里，用 `publishedAtRegex` 提） | ✅ 已接入 2 源 |
| 天津 | 天津轨道 | `tjgdjt.com` | ✅ `channels/17.html`（运营动态）、`channels/28.html`（招商公告）；招采平台 `xmzc.tjgdjt.com:8084` 接口可用但详情路由未破 | ✅ 已接入 2 源 |
| 长沙 | 长沙轨道 | `hncsmtr.com`（不是 hnsgzjt.com） | ✅ `905/918` 运营动态、`906/923` 建设进展；`908/944` 招标栏目停更在 2023 年 | ✅ 已接入 2 源 |
| 郑州 | 郑州地铁 | `zzmetro.cn` | ✅ `nav/list/33/{34,35,36}` 采购计划/公告/单一来源 | ✅ 已接入 3 源 |
| 青岛 | 青岛地铁 / 市公共资源中心 | `ggzy.qingdao.gov.cn` | ✅ 官网虽不可达，但公共资源平台提供完整 JSON 接口 `POST /ztbservice/web/web/getSearchList`（在架 3957 条），20 条全带日期 | ✅ 已接入 1 源 |
| 东莞 | 东莞轨道 | `dggdjt.com` | 70KB 可访问，`node/112.htmx` 招标、`node/123.htmx` 招商；**TLS 握手超时**（curl 与 Node 均超时） | 🟡 待解决 TLS |
| 宁波 | 宁波轨道 | `nbmetro.com` | ✅ `tender_report.php` 系列，招标/中标/非招标三栏结构一致 | ✅ 已接入 3 源 |
| 合肥 | 合肥轨道 | `hfgdjt.com` | **瑞数（Riverse）防护**，详见下方专节 | ⏸ 暂缓（需浏览器容器） |
| 佛山 | 佛山铁投 | `fmtr.cn` | 4.3KB，正文 0 字，疑似 SPA | 🟡 需抓接口 |
| 昆明 | 昆明轨道集团 / 云南京建（4 号线 PPP） | `kmgdgs.com` / `yjrt.com.cn` | 官网 503；京建站 200 但招商信息仅 1 条（2020 介绍页）；云南省级平台 `ggzy.yn.gov.cn` 是 Vue SPA，只找到「开标场地占用」接口；行业媒体暂未收录昆明内容 | ❌ 暂缺（四条路都不通） |

**图例**：🟡 已探测未接入 / ✅ 已接入 / ❌ 不可用（DNS 或 TLS 层面）

### 合肥（hfgdjt.com）：瑞数防护专节

**识别特征**（2026-10 实测）：

| 特征 | 值 |
|---|---|
| 返回体 | 1.2KB 壳，只引一个 1.2MB 的 `app.js` |
| 拦截页 | `/1ywuKELSO2ahQuWZ/assets/attackBlocking.png`（"当前使用的浏览器存在安全隐患"） |
| 随机路径 | `/1ywuKELSO2ahQuWZ/` 这类 16 位随机目录，每次部署会变 |
| JS 特征 | `river` 出现 7 次、`waf` 101 次、`_ac` 5 次 |
| 附属库 | 壳内含 SockJS 路径（`/api/v1/sessions`、`/websocket`、`/xhr_streaming`） |
| 拦截范围 | curl 与 headless Playwright **都被拦**，不是 UA 层面的问题 |

**社区方案与代价**：

| 方案 | 代表项目 | 适用范围 | 代价 |
|---|---|---|---|
| 补环境（Node + jsdom 补 `window`/`document`/`navigator`） | `huaerxiela/rs-reverse`、`cxapython/rs-reverse` | **仅瑞数 4 代**，5/6 代已失效 | 无额外运行时 |
| Playwright + 指纹伪造 + 自定义事件屏蔽 | `Big-fat-dog/js-spider` | 5/6 代 | 服务器常驻 Chromium（镜像 +300MB、内存 +500MB），每站单独维护指纹 |
| 商业打码/代理服务 | 各数据服务商 | 通吃 | 按量付费 |

**为什么暂缓**：
1. 瑞数是对抗型产品，每次升级都要重做补环境，不是一次性投入
2. 引入 Playwright 影响的是**全部 47 个源**的部署复杂度，不只合肥一个站
3. 合肥地铁已在中城轨网（rail-transit）的全国招标源里间接覆盖

**以后若要重启，路径**：
1. 先确认瑞数版本（看 `app.js` 里 `_ac` 附近或拦截页的 JS 版本号）
2. 4 代以内 → 试 `rs-reverse` 的补环境方案，不需要浏览器
3. 5/6 代 → 单独起一个 Playwright 容器，只跑瑞数站，与主 worker 隔离
4. 无论哪种，都要把 `attackBlocking` 作为健康检查信号，拦截时告警而不是静默失败

### 二线城市批量探测结果（2026-10-24，25 城）

| 结果 | 城市 |
|---|---|
| ✅ 可接入 | **洛阳**（`/news_info.html` + `/procurement.html`，已接 2 源）、**乌鲁木齐**（`div.w-al-unit`，8 条，未接） |
| 找到列表但无日期 | 厦门（3 栏目 `div.item-box`）、南昌（`div.cbox-15`）、长春（`div.list`）、石家庄（`div.item`） |
| SPA 壳 | 无锡、常州、沈阳 |
| 域名不存在/不可达 | 徐州、福州、大连、哈尔滨、太原、芜湖、兰州、呼和浩特 |
| WAF 拦截 | 济南、贵阳、澳门 |
| 空响应 | 绍兴、温州、金华、南通、南宁 |

**教训**：名录里的官网域名有一半是过时或错误的。批量探测的 `getaddrinfo ENOTFOUND` 就是信号——**不要相信旧名录，每次都实测**。

**工具的两次自适应升级**（因这批城市触发）：
1. 首页无列表 → 自动跟进「新闻/招标/公告」栏目链接（解决厦门、南昌、长春、石家庄、南宁）
2. 栏目页无日期 → 退回到「重复的单链接容器」识别（解决洛阳）

### 零数据城市清单（2026-10-24 实测）

| 城市 | 名录域名 | 实测 |
|---|---|---|
| 呼和浩特 | `hhhtmetro.com` | 域名不存在（试过 hhhtmetro.cn 也不通） |
| 哈尔滨 | `hrbdt.com` / `harbin-metro.ecrrc.com` | `hrbdt.com` 是**域名待售页**；`harbin-metro.ecrrc.com` 跳 404。可用：市级 `hrbggzy.harbin.gov.cn`（首页 24 条带日期、全行业混合；**子栏目 `/zbgg/` nginx 层 403**，Referer 无效）✅ 已接首页 |
| 昆明 | `kmgdgs.com` / `yjrt.com.cn` | 503 / 内容仅 1 条 2020 介绍页 |
| 温州 | `wzmtr.com` | SPA 壳（所有路径均返回同一 2600 字节 index）；XHR 里出现 `challenge_vcode` 与 `Ahxwd_bot…`，**有人机验证挑战** |
| 绍兴 | `sxmtr.com` | 空响应 |
| 芜湖 | `wuhurail.com` | 域名不存在；轨道交通已并入芜湖市交通能源投资集团 `whsjttz.com`（1658 字节，疑似壳） |
| 金华 | `jhrail.com` | **Cloudflare 403「you have been blocked」** |
| 南通 | `ntmetro.com.cn` | **域名正在出售**（DNSPod 停放页） |

**重要教训**：`docs/sources-directory.md` 里的域名名录是早期整理的，**未经实测**。这 8 个城市里有 3 个域名根本不存在、1 个待售、1 个空壳、1 个 Cloudflare 拦截。

**正确做法**：名录只作为线索，**任何域名在使用前必须先 `curl` 实测**。判断标准：
- 字节数 < 5KB 且 `<a>` 标签 < 5 个 → 几乎一定是停泊页/空壳
- 页面含 "DOMAIN IS FOR SALE" / "正在转让出售" → 域名已废弃
- 含 "Cloudflare" + "blocked" → WAF

### 暂缓城市（用户确认，2026-10-24）

以下 6 个城市规模小、公开信息少，**用户确认暂不处理**，记录备查：

| 城市 | 实测原因 |
|---|---|
| 呼和浩特 | `hhhtmetro.com` / `.cn` 域名不存在 |
| 昆明 | 官网 503、京建站仅 1 条 2020 内容、省级平台 SPA |
| 温州 | `wzmtr.com` 人机验证（`challenge_vcode` + `Ahxwd_bot`） |
| 绍兴 | `sxmtr.com` 空响应 |
| 芜湖 | `wuhurail.com` 不存在，并入集团 `whsjttz.com`（疑似壳） |
| 金华 | `jhrail.com` Cloudflare 403 |

**重启条件**：如果这些城市的招标量上升、或它们更换了官网域名、或有本地渠道提供，再重新探测。

### 待攻克清单

| 目标 | 卡在哪 | 下一步 |
|---|---|---|
| 天津招采平台 `xmzc.tjgdjt.com:8084` | 接口 `GET /track/docdirlist?page=&limit=&id=&search=&billtype=轨道招标` 可用（149 条），但详情页是深层 hash 路由（`#/orbitalGateway` 再进二级），拼不出直达 URL | 抓前端 JS 的路由表，或接受「跳到网关首页」的降级方案 |
| 东莞 `dggdjt.com` | TLS 握手挂起，curl `-v` 显示到 Server hello 后超时，Node 报 `operation was aborted` | 试 `-k`、换 TLS 版本、或用容器内代理出口 |
| 成都 `cdggzy.com` | 成都公共资源交易平台首页 106KB，具体公告页 1.1KB（疑似 SPA/需参数） | 按第 4 步找 JSON 接口 |
| 杭州 / 西安 / 合肥 | 首页都是 1–3KB 的 SPA 壳 | 按第 4 步抓包找接口 |

---

## 六、收尾检查清单

接入一个源之前，逐项确认：

- [ ] 是官方一手，不是转载
- [ ] 用真实抓取验证过条数和日期解析
- [ ] 标题干净（没有【区县】[编号] 之类前缀，或可接受）
- [ ] 详情页能拿到正文/摘要（拿不到就评估标题是否够用）
- [ ] `npm run typecheck` 通过
- [ ] `npm run test:standalone` 通过
- [ ] 部署后 `health = ok`
- [ ] 更新 `docs/sources-directory.md`
- [ ] 更新本手册第四节的渠道地图

**最后一条同样重要**：每发现一个新坑或新方法，回来更新本手册。手册过期比没有更糟。

---

## 七、 地铁全产业链四大板块矩阵与全量城市对账清单

> **硬准则**：地铁行业不仅仅是“工程挖隧道”和“买车买信号”！
> 一座成熟的地铁城市，其非票收入（车站商业、TOD物业、广告传媒）占据利润的半壁江山。
> **评估一个城市的信源是否完整，必须穿透以下四大产业链板块，缺失必须明确标注！**

### 1. 全产业链四大核心板块定义

| 板块 | 覆盖业务范围 | 典型一手发布渠道 |
|---|---|---|
| **① 建设与运营** | 规划报批、工可批复、新线通车、行车调度、大客流预警、运营时刻表、防汛安全应急 | 地铁集团官网、市交通局、交投集团新闻室 |
| **② 工程与设备招标** | 土建施工、盾构、车辆购置与架修、通信信号CBTC、供电变电、机电风水电辅材 | 集团招采平台、市公共资源交易中心、机电产品招标平台 |
| **③ 车站商业与商铺** | 站厅站台商铺租赁、便利店/餐饮招商、地下商业街（Echika/万博星光里）、自动售货机(VEM)、ATM/快照机点位 | **极少在工程招标网！** 走**资源经营子公司官网**、**城市产权交易所**（GEMAS等）、MTR Shops平台 |
| **④ TOD与广告媒体** | 车辆段上盖综合体、站城一体化开发、车厢平面/全包车广告、屏蔽门投影、12封灯箱、梯面媒体、PIS屏媒体、官方APP广告 | 资源经营子公司、不动产开发平台、广告特许经营商（德高JCDecaux、中南传媒、雅仕等） |

---

### 2. 全国 56 城全产业链覆盖现状与缺失清单（2026-10 实测对账）

#### 【第一梯队：四大一线城市】

| 城市 | 建设运营 | 工程与设备招标 | 车站商业与商铺 | TOD与广告媒体 | 关键缺失与对策 |
|---|---|---|---|---|---|
| **深圳** | ✅ 深铁新闻/公告/港铁深圳 | ✅ 深铁采购平台（5栏目全开）+ 港铁深圳 | ✅ 深铁商业招商公告 + 港铁深圳零售 | ✅ 深圳北站/东站枢纽广告招商 + 闸机/资讯牌广告 | **四项全齐**（标杆城市，一手全覆盖） |
| **广州** | ✅ 广州地铁官网新闻 | ✅ 广州地铁招标平台（招标/中标） | ✅ **广州产权交易所 GEMAS 238条商铺挂牌** | ✅ 资源经营公司广告投放招标 + 电视/播音媒体 | **四项全齐**（商业商铺挂牌极全） |
| **北京** | ✅ 北京地铁官网/京投/京港/京投运营 | ✅ 京港地铁招标 + 中城轨网二手 | ⚠️ **京港便民用房/VEM已接**；**北京地铁主力线网商铺缺失** | ⚠️ **京港 PIS/梯面广告已接**；**北京地铁主力线网广告缺失** | **缺失主力线网商业广告**：北京地铁资源开发公司无官网，主力线网商业只发第三方或走内网需登录平台 |
| **上海** | ✅ 申通地铁官网新闻 | ✅ 上海公共资源交易中心（采购262条/中标207条） | ❌ **车站商铺公开招商一手缺失** | ✅ 上海公共资源挂牌中南地铁传媒全行业广告代理供应商采购 | **缺失车站商铺公开一手挂牌**：商铺走集合竞价发第三方平台；采购平台已停用 |

---

#### 【第二梯队：新一线重点地铁城市】

| 城市 | 建设运营 | 工程与设备招标 | 车站商业与商铺 | TOD与广告媒体 | 关键缺失与对策 |
|---|---|---|---|---|---|
| **成都** | ✅ 成都轨道动态（10条全带日期） | ✅ 公告公示 + 城市交通网 | ⚠️ 行李寄存便民点位扩容 | ✅ 成都轨道城投 TOD 项目推进（180亿重磅发布） | 缺独立站内商铺公开招租源（走成都市公共资源平台） |
| **南京** | ✅ 南京地铁概况/建设 | ✅ 南京地铁招标投标（20条全带日期） | ✅ **南京地铁资源招商（新街口/S9高淳等14条商铺出租）** | ⚠️ 明发广场/南京南站上盖商业整体出租 | 商业商铺一手源非常完整；缺独立广告刊例源 |
| **杭州** | ✅ 行业网覆盖 | ✅ **杭州地铁招采平台（采购/公示/结果30条）** + 杭港地铁采购（12条） | ❌ **车站商铺公开一手缺失** | ❌ **地铁广告公开一手缺失** | 招采工程设备极全（含杭港）；但商铺招商与广告一手源完全缺失 |
| **重庆** | ✅ 行业网覆盖 | ✅ **重庆公共资源交易中心（轨道交通招标12条）** | ❌ **车站商业一手缺失** | ❌ **广告媒体招商一手缺失** | 工程招标已通；**商业合资与广告媒体一手缺失**（德高合资案发在反垄断公示与第三方） |
| **天津** | ✅ 天津轨道运营动态（10条） | ✅ 天津轨道招采平台接口 | ✅ **天津轨道招商公告（车位/底商10条）** | ⚠️ 底商/停车场综合利用 | 官网招商覆盖底商；工程招标走子域名平台 |
| **宁波** | ✅ 宁波轨道建设/运营动态 | ✅ **宁波轨道采购信息（招标/中标/非招标36条）** | ❌ 官网商铺招商停更在2021年 | ❌ 广告媒体一手缺失 | 工程采购极全；商铺招商停滞，缺广告一手源 |
| **郑州** | ✅ 郑州地铁新闻/建设动态 | ✅ **郑州地铁采购公告/计划/单一来源（17条）** | ⚠️ 商业二次开发改造施工招标计划 | ❌ 广告媒体一手缺失 | 官方招标计划覆盖商业二次改造；缺广告刊例源 |
| **长沙** | ✅ 长沙轨道运营动态 + 建设进展（20条） | ❌ 官网招标停更在2023（转公共资源） | ❌ 车站商业一手缺失 | ❌ 广告媒体一手缺失 | 官网仅有运营动态与客流；招标与商业广告一手缺失 |
| **青岛** | ❌ 官网不可达 | ✅ **青岛公共资源交易中心（3957条在架，接入20条全带日期）** | ❌ 青铁商业一手缺失 | ❌ 广告媒体一手缺失 | 招标工程极全；青铁商业与广告资源无一手源 |
| **苏州** | ✅ 苏州轨交头条新闻（广济南小楼试营业等） | ⚠️ 行业网覆盖 | ⚠️ 广济南便民生活圈 | ⚠️ 资源开发公司业务覆盖平面与数字媒体 | 官网新闻质量高；缺独立招投标与广告刊例一手源 |
| **东莞** | ⚠️ 官网 TLS 超时 | ⚠️ 城市交通网覆盖（18条） | ⚠️ 广州产权交易所挂牌东莞轨道大厦出租 | ❌ 广告媒体一手缺失 | 官网 TLS 握手异常；商业部分借道省联交所 |
| **佛山** | ⚠️ 官网仅4.3KB壳 | ⚠️ 城市交通网覆盖（15条） | ⚠️ 广佛肇城际地块出租 | ❌ 广告媒体一手缺失 | 官网内容极少；主要依赖城际与周边源带动 |
| **武汉** | ⚠️ 官网 302 泛域名 | ⚠️ 城市交通网覆盖（13条） | ❌ 车站商业一手缺失 | ❌ 广告媒体一手缺失 | 官网跳转异常；全产业链一手源待攻克 |
| **西安** | ⚠️ 官网不可达 / 接口签名 | ⚠️ 城市交通网覆盖（20条） | ❌ 车站商业一手缺失 | ❌ 广告媒体一手缺失 | 官网接口带加密签名；全产业链一手源待攻克 |
| **合肥** | ⚠️ 官网瑞数反爬拦截 | ⚠️ 城市交通网覆盖（17条）+ 市公共资源交易中心 | ❌ 车站商业一手缺失 | ❌ 广告媒体一手缺失 | 官网受瑞数防护；市公共资源平台带 A11 城市轨道分类待打通 |

---

#### 【第三梯队：其他二三线已开通地铁城市】

| 城市 | 建设运营 | 工程与设备招标 | 车站商业与商铺 | TOD与广告媒体 | 关键状态 |
|---|---|---|---|---|---|
| **乌鲁木齐** | ✅ 运营公告（8条） | ✅ **采购信息（15条，带置业/机械维保）** | ⚠️ 乌鲁木齐地铁置业涵盖商业点位竞价 | ⚠️ 置业资产评估 | 采购信息覆盖置业公司，全产业链较为均衡 |
| **厦门** | ✅ 公司新闻（10条） | ⚠️ 集团招标采购平台独立端口 | ✅ **招商信息（海沧中心TOD底层商业等10条）** | ✅ TOD·湿地公园财富中心/K11开业 | TOD与车站商业表现亮眼，带官方日期 |
| **福州** | ✅ 官网新闻 | ✅ **福州地铁招标与中标公示（10条全带日期）** | ⚠️ 涂料工程专业分包征集 | ⚠️ 文创制作项目成交结果公示 | 招标平台一手覆盖工程、维保与文创 |
| **洛阳** | ✅ 新闻中心（10条） | ✅ **采购公告（10条全带日期）** | ❌ 商业一手缺失 | ❌ 广告一手缺失 | 招标工程与运营新闻已打通 |
| **南昌** | ✅ 集团新闻（客流创新高272万/脱轨演练） | ⚠️ 行业网覆盖 | ❌ 商业一手缺失 | ❌ 广告一手缺失 | 运营动态质量高，无日期；缺商业广告一手源 |
| **石家庄** | ✅ 集团动态（26条，正则提取日期） | ⚠️ 行业网覆盖 | ❌ 商业一手缺失 | ❌ 广告一手缺失 | 新闻覆盖首班车调整、全国工人先锋号等 |
| **兰州** | ✅ 轨道动态（6条全带日期） | ⚠️ 行业网覆盖 | ⚠️ 轨客盈栈自研电子商城生态共建 | ❌ 广告一手缺失 | 运营动态正常，涵盖穿黄双线与客流 |
| **哈尔滨** | ⚠️ 官网待售 | ⚠️ **市公共资源交易平台（58条全行业混合，靠预筛）** | ❌ 商业一手缺失 | ❌ 广告一手缺失 | 官网废弃，市交易平台子栏目403，仅能依靠首页全行业过滤 |
| **济南/太原/沈阳/大连/长春/南宁/贵阳** | ⚠️ 行业网覆盖 | ⚠️ 城市交通网/中城轨网覆盖（各10-18条） | ❌ 商业一手缺失 | ❌ 广告一手缺失 | 官网多为 SPA 壳或域名失效，主要依赖全国行业源兜底 |
| **昆明/呼和浩特/温州/绍兴/芜湖/金华** | ❌ 官网不可达/反爬 | ⚠️ 行业网零星覆盖 | ❌ 商业一手缺失 | ❌ 广告一手缺失 | 暂缓处理的 6 座城市，公开一手渠道全部封死 |

---

#### 【第四梯队：国际与特区标杆】

| 对象 | 建设运营 | 工程与设备招标 | 车站商业与商铺 | TOD与广告媒体 | 关键状态 |
|---|---|---|---|---|---|
| **港铁全生态 (MTR Family)** | ✅ 京港/深港新闻 + 香港本部公报 | ✅ **京港招标 + 深港采购 + 杭港采购 (42条)** | ✅ **京港便民用房招商 + 深港商业招商 + 港铁MTR Shops租务平台** | ✅ **深港广告招商 + 港铁德高广告JCDecaux + 京港PIS/梯面广告** | **港铁大家族全产业链完全打通**（北京/深圳/杭州/香港全系联动） |
| **东京轨道 (Tokyo Transit)** | ✅ **日本铁道新闻网（10条全带日期，覆盖JR/地下铁/私铁）** | ⚠️ 结合年报与IR公报 | ✅ **东急电铁（3019条全量API，覆盖车站商业/星野度假村商业）** | ✅ **东急电铁（全球TOD标杆，涩谷站再开发/曼谷海外TOD项目）** | **日本TOD与新线运行图一手打通** |
