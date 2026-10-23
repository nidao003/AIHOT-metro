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
| 成都 | 成都轨道集团 | `chengdurail.com` | 静态可解析，但日期拆成两个节点（`<span>08-26</span>2026`，textContent 变成 `08-262026`），现有解析器读不出 | 🟡 需扩展日期解析 |
| 重庆 | 重庆轨道集团 | `cqmetro.cn` | 首页是 `<article class="news-card" data-id>` 卡片，**无 `a[href]`**，靠 JS 跳转；日期只在图片路径里 | 🟡 需找列表页/接口 |
| 杭州 | 杭州地铁 | `hzmetro.com` | 2.1KB SPA 壳 | 🟡 需抓接口 |
| 武汉 | 武汉地铁 | `whrt.com` | 302 跳到 `ww16.whrt.com/?sub1=…`（泛域名轮换） | 🟡 需跟跳转 |
| 西安 | 西安轨道 | `xianrail.com` | 1.1KB SPA 壳 | 🟡 需抓接口 |
| 南京 | 南京地铁 | `njmetro.com.cn` | 仅 https 可用；`go-tender-center.do` 返回框架，列表靠 AJAX | 🟡 需抓接口 |
| 天津 | 天津轨道 | `tjgdjt.com` | ✅ `channels/17.html`（运营动态）、`channels/28.html`（招商公告）；招采平台 `xmzc.tjgdjt.com:8084` 接口可用但详情路由未破 | ✅ 已接入 2 源 |
| 长沙 | 长沙轨道 | `hnsgzjt.com` | DNS 不通（http/https/www 全试过） | ❌ 不可用 |
| 郑州 | 郑州地铁 | `zzmetro.cn` | ✅ `nav/list/33/{34,35,36}` 采购计划/公告/单一来源 | ✅ 已接入 3 源 |
| 青岛 | 青岛地铁 | `qd-metro.com` | DNS 不通 | ❌ 不可用 |
| 东莞 | 东莞轨道 | `dggdjt.com` | 70KB 可访问，`node/112.htmx` 招标、`node/123.htmx` 招商；**TLS 握手超时**（curl 与 Node 均超时） | 🟡 待解决 TLS |
| 宁波 | 宁波轨道 | `nbmetro.com` | ✅ `tender_report.php` 系列，招标/中标/非招标三栏结构一致 | ✅ 已接入 3 源 |
| 合肥 | 合肥轨道 | `hfgdjt.com` | 1.2KB SPA 壳（正文 0 字） | 🟡 需抓接口 |
| 佛山 | 佛山铁投 | `fmtr.cn` | 4.3KB，正文 0 字，疑似 SPA | 🟡 需抓接口 |
| 昆明 | 昆明轨道 | `kmgdjt.com` | DNS 不通 | ❌ 不可用 |

**图例**：🟡 已探测未接入 / ✅ 已接入 / ❌ 不可用（DNS 或 TLS 层面）

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
