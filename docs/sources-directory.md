# 全国城市轨道交通全生态信息源名录 (MetroHOT Sources Directory)

本名录系统性梳理了全国 54 座已开通城市轨道交通城市的核心母集团、运营子公司、资源与TOD商业子公司、招投标采购专栏及行业监管机构。

---

## 一、 当前系统已接入运行的自动化信源对照表

### 1.1 一线城市官方直连（北京 / 上海 / 广州 / 深圳）

| 城市 | 主体 | 信源 ID | 覆盖板块 | 采集地址 | 状态 |
|---|---|---|---|---|---|
| 北京 | 京投公司 | `web-bii-news` | 集团财报 / 债券投融资 / 规划 | `https://www.bii.com.cn/newsList_29_page1.html` | ✅ 活跃 |
| 北京 | 京投轨道运营 | `web-bjmoa-news` | 运营调度 / 新线开通 | `https://www.bjmoa.cn/newsList_350_page1.html` | ✅ 活跃 |
| 北京 | 北京地铁 | `web-bjsubway-news` | 运营调度 / 安全应急 | `https://www.bjsubway.com/news/qyxw/yyzd/` | ✅ 活跃 |
| 北京 | 京港地铁 | `web-mtr-bj-news` | 运营调度 / 智慧城轨 | `https://www.mtr.bj.cn/news/company-news` | ✅ 活跃 |
| 北京 | 京港地铁 | `web-mtr-bj-bids` | 招标采购 / 设备维保 | `https://www.mtr.bj.cn/category/business/tender-and-supplier-guidelines/tender-invitations` | ✅ 活跃 |
| 北京 | 京港地铁 | `web-mtr-bj-business` | 地铁广告 / 车站商业 | `https://www.mtr.bj.cn/business/mall/business-op` | ✅ 活跃 |
| 上海 | 申通地铁 | `web-shmetro-news` | 新线开通 / 运营调度 | `https://www.shmetro.com/p1/xwzx.html` | ✅ 活跃 |
| 上海 | 公共资源交易中心 | `web-shggzy-metro-bids` | 招标采购 / 地铁广告 | `shggzy.com/content/page?channelIds=301&title=地铁` | ✅ 活跃 |
| 上海 | 公共资源交易中心 | `web-shggzy-metro-awards` | 中标公示 / 招标采购 | 同上（`channelIds=302`） | ✅ 活跃 |
| 广州 | 广州地铁 | `web-gzmtr-news` | 运营调度 / 车站商业 | `https://www.gzmtr.com/ygwm/xwzx/gsxw/` | ✅ 活跃 |
| 广州 | 广州地铁招标平台 | `web-gzmtr-bids` | 招标采购 / 设备维保 | `https://bid.gzmtr.com/bizzbgg/` | ✅ 活跃 |
| 广州 | 广州地铁招标平台 | `web-gzmtr-awards` | 中标公示 / 工程建设 | `https://bid.gzmtr.com/bizzbgs/` | ✅ 活跃 |
| 广州 | 广州地铁资源经营 | `web-gzmtr-resource` | 车站商业 / 地铁广告 | `https://bid.gzmtr.com/bizzbgg/bid_zbgg_yysy_9/` | ✅ 活跃 |
| 广州 | 广州产权交易所 | `web-gemas-metro` | 车站商业 / TOD开发 | `newsys.gemas.com.cn/api/admin/app/listingProject?title=地铁` | ✅ 活跃 |
| 广州 | 广州产权交易所 | `web-gemas-rail` | TOD开发 / 车站商业 | 同上（`title=轨道交通`） | ✅ 活跃 |
| 深圳 | 深铁集团 | `web-szmc-bids` | 车站商业 / TOD / 广告 | `https://www.szmc.net/szmc_m/zhaobiaozhaoshang/zhaoshanggonggao/zhaoshangxinxi1/` | ✅ 活跃 |
| 深圳 | 深铁集团 | `web-szmc-announce` | 规划批复 / 经营动态 | `https://www.szmc.net/home/xinwenzhongxin/gongsigonggao/` | ✅ 活跃 |
| 深圳 | 深铁采购平台 | `web-szmc-cg-bids` | 招标采购 / 工程建设 | `https://cg.shenzhenmc.com/zzbgg/index.jhtml` | ✅ 活跃 |
| 深圳 | 深铁采购平台 | `web-szmc-cg-awards` | 中标候选人公示 | `https://cg.shenzhenmc.com/zzbhxrgs/index.jhtml` | ✅ 活跃 |
| 深圳 | 深铁采购平台 | `web-szmc-cg-results` | 中标结果公示 | `https://cg.shenzhenmc.com/zzbjggs/index.jhtml` | ✅ 活跃 |
| 深圳 | 深铁采购平台 | `web-szmc-cg-nonbid` | 非招标采购（商业/服务） | `https://cg.shenzhenmc.com/fcggggs/index.jhtml` | ✅ 活跃 |
| 深圳 | 深铁采购平台 | `web-szmc-cg-plan` | 采购计划 | `https://cg.shenzhenmc.com/zbxmjh/index.jhtml` | ✅ 活跃 |
| 深圳 | 港铁深圳 | `web-mtrsz-news` | 运营调度 / 智慧城轨 | `https://www.mtrsz.com.cn`（`content/page` JSON 接口，栏目 7599） | ✅ 活跃 |
| 深圳 | 港铁深圳 | `web-mtrsz-bids` | 招标采购 / 设备维保 | 同上（栏目 7620 采购公告） | ✅ 活跃 |
| 深圳 | 港铁深圳 | `web-mtrsz-ads` | 车站商业 / 地铁广告 | 同上（栏目 8368 招商公告） | ✅ 活跃 |

### 1.2 部委与全国行业站

| 信源 ID | 信源名称 | 覆盖板块 | 类型 | 采集地址 | 状态 |
|---|---|---|---|---|---|
| **`web-mot-stats`** | 交通运输部 · 运力分析与城轨速报 | 客运流量 / 全国月报 | `web_list` | `https://www.mot.gov.cn/shuju/fenxigongbao/yunlifenxi/index.html` | ✅ 活跃 |
| **`web-ndrc-notices`** | 国家发改委 · 建设规划批复 | 规划批文 / 工可批复 | `web_list` | `https://www.ndrc.gov.cn/xwdt/tzgg/index.html` | ✅ 活跃 |
| **`web-rail-transit-news`** | 中国城市轨道交通网 · 行业要闻 | 全网动态 / 规划建设 | `web_list` | `http://www.rail-transit.com/xinwen/` | ✅ 活跃 |
| **`web-rail-transit-bids`** | 中国城市轨道交通网 · 招标采购 | 招标采购 / 设备工程 | `web_list` | `http://www.rail-transit.com/zhaobiao/` | ✅ 活跃 |
| **`web-rail-transit-awards`** | 中国城市轨道交通网 · 中标公示 | 中标结果 / 候选人公示 | `web_list` | `http://www.rail-transit.com/zhongbiao/` | ✅ 活跃 |
| **`web-sz-mtr-news`** | 苏州轨道交通 · 头条新闻与动态 | 新线建设 / 运营 / 商业 | `web_list` | `https://www.sz-mtr.com/news/hot/` | ✅ 活跃 |
| `web-zzmetro-bids` | 郑州地铁 · 采购公告 | 招标采购 / 设备维保 | `web_list` | `https://www.zzmetro.cn/nav/list/33/35` | ✅ 活跃 |
| `web-zzmetro-plan` | 郑州地铁 · 采购计划 | 招标采购 / 工程建设 | `web_list` | `https://www.zzmetro.cn/nav/list/33/34` | ✅ 活跃 |
| `web-zzmetro-single` | 郑州地铁 · 单一来源与直接采购公示 | 中标公示 / 招标采购 | `web_list` | `https://www.zzmetro.cn/nav/list/33/36` | ✅ 活跃 |
| `web-nbmetro-bids` | 宁波轨道 · 招标公告 | 招标采购 / 工程建设 | `web_list` | `http://www.nbmetro.com/tender_report.php` | ✅ 活跃 |
| `web-nbmetro-awards` | 宁波轨道 · 中标公示 | 中标公示 / 招标采购 | `web_list` | `http://www.nbmetro.com/tender_report.php?2` | ✅ 活跃 |
| `web-nbmetro-nonbid` | 宁波轨道 · 非招标采购公告 | 招标采购 / 车站商业 | `web_list` | `http://www.nbmetro.com/tender_report.php?10` | ✅ 活跃 |
| `web-tjgdjt-bids` | 天津轨道 · 招商公告 | 车站商业 / TOD开发 | `web_list` | `http://www.tjgdjt.com/channels/28.html` | ✅ 活跃 |
| `web-tjgdjt-news` | 天津轨道 · 运营动态 | 运营调度 / 安全应急 | `web_list` | `http://www.tjgdjt.com/channels/17.html` | ✅ 活跃 |
| `web-njmetro-bids` | 南京地铁 · 招标投标 | 招标采购 / 中标公示 | `web_list` | `njmetro.com.cn/njdtweb/home/go-tender-center.do?...` | ✅ 活跃 |
| `web-njmetro-resource` | 南京地铁 · 资源招商 | 车站商业 / TOD开发 | `web_list` | `njmetro.com.cn/njdtweb/home/go-resource-center.do?...` | ✅ 活跃 |
| `web-csmtr-ops` | 长沙轨道 · 运营动态 | 运营调度 / 客流运能 | `web_list` | `https://www.hncsmtr.com/905/918/` | ✅ 活跃 |
| `web-csmtr-build` | 长沙轨道 · 建设进展 | 新线开通 / 工程建设 | `web_list` | `https://www.hncsmtr.com/906/923/` | ✅ 活跃 |
| `web-hzmetro-bids` | 杭州地铁招采 · 采购公告 | 招标采购 / 设备维保 | `web_list` | `https://zhaocai.hzmetro.com/cmsfwcggg/index.html` | ✅ 活跃 |
| `web-hzmetro-review` | 杭州地铁招采 · 结果公示 | 中标公示 / 招标采购 | `web_list` | `https://zhaocai.hzmetro.com/cmsfwjggs/index.html` | ✅ 活跃 |
| `web-hzmetro-results` | 杭州地铁招采 · 结果公告 | 中标公示 / 招标采购 | `web_list` | `https://zhaocai.hzmetro.com/cmsfwjggg/index.html` | ✅ 活跃 |
| `web-cqggzy-metro` | 重庆公共资源交易 · 轨道交通招标 | 招标采购 / 中标公示 | `web_list` | `https://www.cqggzy.com/trade/014001?categoryNum=014001&keyword=轨道交通` | ✅ 活跃 |
| `web-chinaiut-bids` | 城市交通网 · 轨道交通招标 | 招标采购 | `web_list` | `http://www.chinaiut.com/zhaobiao` | ✅ 活跃 |
| `web-chinaiut-awards` | 城市交通网 · 轨道交通中标 | 中标公示 | `web_list` | `http://www.chinaiut.com/zhongbiao` | ✅ 活跃 |
| `web-lysubway-bids` | 洛阳轨道 · 采购公告 | 招标采购 / 设备维保 | `web_list` | `http://www.lysubway.com.cn/procurement.html` | ✅ 活跃 |
| `web-lysubway-news` | 洛阳轨道 · 新闻中心 | 运营调度 / 经营动态 | `web_list` | `http://www.lysubway.com.cn/news_info.html` | ✅ 活跃 |
| `web-urumqi-bids` | 乌鲁木齐轨道 · 采购信息 | 招标采购 / TOD开发 | `web_list` | `http://www.urumqimtr.com/cgxx` | ✅ 活跃 |
| `web-urumqi-ops` | 乌鲁木齐轨道 · 运营公告 | 运营调度 / 安全应急 | `web_list` | `http://www.urumqimtr.com/yygg` | ✅ 活跃 |
| `web-sjzmetro-news` | 石家庄轨道 · 集团动态 | 运营调度 / 经营动态 | `web_list` | `http://www.sjzmetro.cn` | ✅ 活跃 |
| `web-ncmtr-news` | 南昌轨道 · 集团新闻 | 运营调度 / 客流运能 | `web_list` | `http://www.ncmtr.com` | ✅ 活跃 |
| `web-xmgdjt-news` | 厦门轨道 · 公司新闻 | 运营调度 / 新线开通 | `web_list` | `https://www.xmgdjt.com.cn/list-48385ou5/gongsixingweng/1/10` | ✅ 活跃 |
| `web-xmgdjt-leasing` | 厦门轨道 · 招商信息 | TOD开发 / 车站商业 | `web_list` | `https://www.xmgdjt.com.cn/list-77tl1l0i/zhaoshangxingxin/1/10` | ✅ 活跃 |
| `web-fzmetro-bids` | 福州地铁 · 招标与中标公示 | 招标采购 / 中标公示 | `web_list` | `http://www.fzmtr.com` | ✅ 活跃 |
| `web-lzgdjt-news` | 兰州轨道 · 轨道动态 | 运营调度 / 客流运能 | `web_list` | `http://www.lzgdjt.com/lzgd/new_list.jsp?cId=11070` | ✅ 活跃 |
| `web-hrbggzy-news` | 哈尔滨公共资源 · 招标公告 | 招标采购（全行业，靠预筛） | `web_list` | `https://hrbggzy.harbin.gov.cn/` | ✅ 活跃 |
| `web-cdmetro-news` | 成都轨道 · 轨道动态 | 运营调度 / 客流运能 | `web_list` | `https://www.chengdurail.com/xwzx/gddt.htm` | ✅ 活跃 |
| `web-cdmetro-announce` | 成都轨道 · 公告公示 | 规划批复 / 安全应急 | `web_list` | `https://www.chengdurail.com/xwzx/gggs.htm` | ✅ 活跃 |
| `web-qdggzy-bids` | 青岛公共资源 · 地铁招标采购 | 招标采购 / 工程建设 | `json_list` | `https://ggzy.qingdao.gov.cn/ztbservice/web/web/getSearchList` (POST keyWord=地铁) | ✅ 活跃 |
| `web-mtrhz-bids` | 杭港地铁 · 采购信息 | 招标采购 / 设备维保 | `web_list` | `https://www.mtrhz.com.cn/about/cggs.htm` | ✅ 活跃 |
| `web-tokyu-news` | 东急电铁 · 官方新闻与TOD开发 | TOD开发 / 车站商业 | `json_list` | `https://www.tokyu.co.jp/company/api/news.json` (3019条) | ✅ 活跃 |
| `web-tetsudo-news` | 日本铁道新闻 · 东京与首都圈轨道 | 运营调度 / 智慧城轨 | `web_list` | `https://tetsudo-shimbun.com/` | ✅ 活跃 |

### 1.3 微信公众号（暂停，待充值恢复）

| 信源 ID | 信源名称 | ghid | 状态 |
|---|---|---|---|
| **`mp-camet`** | 中国城市轨道交通协会 | `gh_91fe691c0773` | ⏸ 停用 |
| **`mp-shmetro`** | 上海地铁shmetro | `gh_df0517199e46` | ⏸ 停用 |
| **`mp-gzmtr`** | 广州地铁 | `gh_a86e29353afa` | ⏸ 停用 |
| **`mp-szmc`** | 深圳地铁 | `gh_44017a8822b0` | ⏸ 停用 |
| **`mp-bjsubway`** | 北京地铁 | `gh_cb33bb00aef3` | ⏸ 停用 |
| **`mp-cdmetro`** | 成都地铁 | `gh_ad6d6e1f4cb3` | ⏸ 停用 |

---

## 二、 全国各城市地铁母集团与运营公司官网名录

### 1. 直辖市
| 城市 | 集团 / 运营公司全称 | 官方网站 | 核心关注板块 |
|---|---|---|---|
| **北京** | 北京市基础设施投资有限公司 (京投公司) | `https://www.bii.com.cn` | 投融资、两区建设债、资产运营 |
| **北京** | 京投轨道运营 (北京市轨道交通运营管理有限公司) | `https://www.bjmoa.cn` | 19号线、燕房线、大兴机场线、22号线（平谷线）运营 |
| **北京** | 北京市地铁运营有限公司 (北京地铁) | `https://www.bjsubway.com` | 运营时刻表、行车调度、客流 |
| **北京** | 北京京港地铁有限公司 (京港地铁) | `https://www.mtr.bj.cn` | 4/14/16/17号线PPP运营、港式服务 |
| **北京** | 北京京城地铁有限公司 | 无独立官网 | 首都机场线运营（2017 年起） |
| **北京** | 北京公交有轨电车有限公司 | 无独立官网 | 西郊线运营 |
| **北京** | 城市铁建公司 | 无独立官网 | 大兴国际机场线建设 |
| **上海** | 上海申通地铁集团有限公司 | `https://www.shmetro.com` | 集团动态、建设规划、企业年报 |
| **上海** | 上海地铁运营服务网 (服务与实时客流) | `https://service.shmetro.com` | 线路实时动态、致歉信、客流预警 |
| **广州** | 广州地铁集团有限公司 | `https://www.gzmtr.com` | 大湾区城际直联、线网运营、海外输出 |
| **深圳** | 深圳市地铁集团有限公司 (深铁集团) | `https://www.szmc.net` | 建设规划、客运月报、低空轨道联运 |
| **深圳** | 港铁轨道交通（深圳）有限公司 (港铁深圳) | `https://www.mtrsz.com.cn` | 4号线运营管理、港式运营标准 |
| **重庆** | 重庆市轨道交通（集团）有限公司 | `http://www.cqmetro.cn` | 山地跨座式单轨、城市快线贯通 |
| **重庆** | 重庆交通开投集团 / 重庆铁投 | `http://www.cqttjt.com` | 市域(郊)铁路投资规划 |
| **天津** | 天津轨道交通集团有限公司 | `http://www.tjgdjt.com` | 线网建设推进、智慧城轨改造 |

### 2. 华东地区（主要省会与新一线）
| 城市 | 公司全称 | 官方网站 | 核心关注板块 |
|---|---|---|---|
| **杭州** | 杭州市地铁集团有限责任公司 | `https://www.hzmetro.com` | 五期建设规划、客流强度攀升 |
| **杭州** | 杭港地铁 (杭州杭港地铁有限公司) | `https://www.mtrhz.com.cn` | 1号线/5号线特许经营运营 |
| **南京** | 南京地铁集团有限公司 | `http://www.njmetro.com.cn` | 都市圈跨市域城轨网络运营 |
| **苏州** | 苏州轨道交通集团有限公司 | `https://www.sz-mtr.com` | 11号线与上海11号线跨省直连互通 |
| **成都** | 成都轨道交通集团有限公司 | `https://www.chengdurail.com` | 600+公里超大线网运营、全自动运行 |
| **武汉** | 武汉地铁集团有限公司 | `https://www.whrt.com` | 穿江隧道运营、新线路试运行 |
| **西安** | 西安市轨道交通集团有限公司 | `https://www.xianrail.com` | 历史文化名城地下施工与客流保障 |
| **郑州** | 郑州地铁集团有限公司 | `https://www.zzmetro.cn` | 郑许市域铁路跨市运营、防汛应急保障 |
| **长沙** | 长沙市轨道交通集团有限公司 | `http://www.hnsgzjt.com` | 磁浮快线、客运强度全国领跑 |
| **青岛** | 青岛地铁集团有限公司 | `https://www.qd-metro.com` | 胶州湾跨海地铁、TACS列控系统试点 |
| **宁波** | 宁波市轨道交通集团有限公司 | `http://www.nbmetro.com` | 沿海软土盾构施工与线网调度 |
| **合肥** | 合肥市轨道交通集团有限公司 | `http://www.hfgdjt.com` | 巢湖都市圈市域铁路衔接 |
| **无锡** | 无锡地铁集团有限公司 | `http://www.wxmetro.net` | 锡澄S1线跨市域运营、第三期建设 |
| **常州** | 常州市轨道交通发展有限公司 | `http://www.czmetro.net.cn` | 骨干线网运营、长三角一体化对接 |
| **徐州** | 徐州地铁集团有限公司 | `http://www.xzmtr.net` | 淮海经济区中心城市线网 |
| **温州** | 温州市铁路与轨道交通投资集团 | `http://www.wzmtr.com` | S1/S2市域铁路快速通勤网络 |
| **绍兴** | 绍兴市轨道交通集团有限公司 | `http://www.sxmtr.com` | 杭绍城际同城化运营 |
| **金华** | 金华市金义东轨道交通有限公司 | `http://www.jhrail.com` | 金义东市域轨道交通客运 |
| **南通** | 南通市轨道交通集团有限公司 | `http://www.ntmetro.com.cn` | 过江通道与长三角北翼枢纽 |
| **福州** | 福州地铁集团有限公司 | `https://www.fz-metro.com.cn` | 滨海快线与骨干网换乘运营 |
| **厦门** | 厦门轨道建设发展集团有限公司 | `https://www.xmgdjt.com.cn` | 海底隧道、两岸融合与TOD开发 |
| **南昌** | 南昌轨道交通集团有限公司 | `http://www.ncmtr.com` | 赣江跨江隧道运营与建设 |

### 3. 华北 / 东北 / 中南 / 西南 / 西北地区
| 城市 | 公司全称 | 官方网站 | 核心关注板块 |
|---|---|---|---|
| **沈阳** | 沈阳地铁集团有限公司 | `http://www.symtc.com` | 数据资产入表、东北首张数据产权证书 |
| **大连** | 大连公共交通建设投资集团 (大连地铁) | `http://www.dlsubway.com.cn` | 跨海大桥与陆海联运地铁 |
| **长春** | 长春市轨道交通集团有限公司 | `http://www.ccqg.com` | 严寒地区高架轨道与轻轨运营 |
| **哈尔滨** | 哈尔滨地铁集团有限公司 | `http://www.hrbdt.com.cn` | 高寒地铁施工维保与冰雪旅游大客流保障 |
| **石家庄** | 石家庄市轨道交通集团有限责任公司 | `http://www.sjzmetro.cn` | 京津冀一体化协同城轨发展 |
| **太原** | 太原中铁轨道交通 / 太原轨道交通 | `http://www.tytygd.com.cn` | 央地合作PPP示范项目、信息化生产 |
| **济南** | 济南轨道交通集团有限公司 | `http://www.jngdjt.cn` | 泉水环境保护与地下穿泉施工 |
| **南宁** | 南宁轨道交通集团有限责任公司 | `http://www.nngdjt.com` | 面向东盟门户城轨枢纽 |
| **昆明** | 昆明轨道交通集团有限公司 | `http://www.kmgdjt.com` | 高原城市轨道交通网络 |
| **贵阳** | 贵阳市公共交通投资运营集团 | `http://www.gyrt.cn` | 喀斯特地貌复杂地质施工运营 |
| **乌鲁木齐**| 乌鲁木齐城市轨道集团有限公司 | `http://www.urumqimtr.com` | 亚欧大陆桥核心区高寒抗风沙地铁 |
| **兰州** | 兰州市轨道交通有限公司 | `http://www.lzgdjt.cn` | 黄河穿河隧道地铁运营 |
| **呼和浩特**| 呼和浩特市城市轨道交通公司 | `http://www.hhhtmetro.com` | 北疆首座地铁运营 |
| **洛阳** | 洛阳市轨道交通集团有限公司 | `http://www.lysubway.com.cn` | 中西部中等城市地铁精细化经营 |
| **芜湖** | 芜湖市城市轨道交通 (芜湖单轨) | `http://www.wuhurail.com` | 全自动无人驾驶跨座式单轨示范 |
| **东莞** | 东莞市轨道交通有限公司 | `http://www.dggdjt.com` | 广深两地互通互连节点 |
| **佛山** | 佛山市轨道交通发展有限公司 (佛山铁投)| `http://www.fmtr.cn` | 广佛同城化网络深度接驳 |
| **香港** | 香港铁路有限公司 (MTR Corporation) | `https://www.mtr.com.hk` | 国际公认“铁路+物业”(R+P)盈利标杆 |
| **澳门** | 澳门轻轨股份有限公司 | `https://www.mlm.com.mo` | 横琴口岸延伸线跨界运营 |

---

## 三、 下属资源经营 / TOD综合开发 / 商业置业公司名录

地铁集团最大的非票业务支柱集中在 **TOD上盖物业开发、站内商业零售与广告传媒** 三大板块：

| 所属集团 | 资源/商业子公司名称 | 核心经营范围 | 业务映射分类 |
|---|---|---|---|
| **深圳地铁** | 深圳市深铁置业集团有限公司 | 车辆段及车站上盖物业投资、大型TOD社区开发（如深铁前海时代、深铁阅山境） | `tod-development` |
| **深圳地铁** | 深圳市深铁商业发展有限公司 | 车站红线内地下商铺招商、便民连锁便利餐饮、站台广告投影租赁 | `station-retail` / `metro-advertising` |
| **北京地铁/京投** | 京投发展股份有限公司 (`600683.SH`) | 亚洲首家专注轨道物业TOD开发的A股上市公司（“TOD智慧生态圈”） | `tod-development` |
| **北京地铁/京投** | 北京京投置地 / 京投轨道资产管理 | 站内广告资源特许经营、商业综合体运营 | `station-retail` / `metro-advertising` |
| **上海申通** | 上海申通资产管理有限公司 | 上海轨道交通全网广告、车站商铺、地下管廊及TOD物业运营管理 | `tod-development` / `station-retail` |
| **广州地铁** | 广州万胜物业管理有限公司 / 资源经营部 | 站内零售商户招商、全包车广告招商、TOD上盖万胜广场综合体 | `station-retail` / `metro-advertising` |
| **成都轨道** | 成都轨道城市投资集团有限公司 | **全国最大TOD开发体量**：首批14个TOD示范项目建设、站城一体化开发 | `tod-development` |
| **成都轨道** | 成都轨道资源经营管理有限公司 | 站内“世纪城”、“春熙路”等超级枢纽商圈地下商铺招商租赁 | `station-retail` |
| **杭州地铁** | 杭州地铁开发有限公司 / 物业经营公司 | 车辆段上盖万象城、七堡车辆段TOD、站厅便民生活圈建设 | `tod-development` / `station-retail` |
| **武汉地铁** | 武汉地铁资源开发投资有限公司 | 车站广告传媒特许经营、地下商业街招商运营、TOD上盖地产 | `tod-development` / `station-retail` |
| **南京地铁** | 南京地铁资源开发有限责任公司 | 全网车站灯箱与车体广告、便民商铺租赁、站城一体化综合体 | `station-retail` / `metro-advertising` |
| **青岛地铁** | 青岛青铁商业发展有限公司 / 青铁置业 | 青岛地铁TOD“站城融合”项目开发、车站商业点位公开招商 | `tod-development` / `station-retail` |
| **苏州轨交** | 苏州轨道交通资源开发有限公司 | 站内自动零售终端、站厅商铺、车体平面广告及数字媒体特许经营 | `station-retail` / `metro-advertising` |
| **港铁公司** | 港铁物业发展及投资部 (MTR Property) | 国际公认“铁路加物业”鼻祖：德福广场、青衣城、圆方(Elements) | `tod-development` |

---

## 四、 北上广深招标与采购公告渠道（实测）

地铁行业的招标分两类：**依法招标**（工程、设备、车辆）走公共资源交易平台或自建采购平台；**非招标采购**（商业招商、广告、物业、服务）多走集团自建平台。以下是 2026-10 逐个实测的结果。

### 4.1 北京

| 渠道 | 地址 | 覆盖 | 实测结果 |
|---|---|---|---|
| 京港地铁采购与招标 | `mtr.bj.cn/category/business/...` | 4/14/16/17 号线设备维保、工程 | ✅ 已接入 `web-mtr-bj-bids` |
| 京港地铁招商信息 | `mtr.bj.cn/business/mall/business-op` | **广告代理经营权、梯面媒体、自动售货机、便民用房招商** | ✅ 已接入 `web-mtr-bj-business` |
| 北京地铁电子商务采购平台 | `zhaocai.bjsubway.com/zhaocai-portal/` | 采购项目公示、采购结果公示、社会化采购 | ⚠️ Nuxt SPA；接口 `POST /bjdt/manage-server/home/{project,inform/notice/page}` 在 nginx 层 403，需登录，非公开渠道 |
| 京投公司官网 | `bii.com.cn` | 集团投融资、企业新闻 | ✅ 已接入 `web-bii-news`（无招标栏目） |
| 京投轨道运营 | `bjmoa.cn` | 19 号线、燕房线、大兴机场线、22 号线运营 | ✅ 已接入 `web-bjmoa-news`（无招标栏目） |
| **北交所阳光采购平台** | `zc.cbexepp.com.cn` | 北京市属国企采购（按采购人筛选） | ✅ 已接入 `web-cbex-metro`（`purchaser=北京市地铁`，3 条历史，零噪声持续监控） |
| 北京产权交易所主站 | `cbex.com.cn` | 产权转让、实物资产、租赁 | ❌ **加速乐（`__jsl_clearance`）双层 JS 挑战**，Node 沙箱可过第一层、过不了第二层（需完整浏览器环境） |
| 中国招标投标公共服务平台 | `bulletin.cebpubservice.com` | 国家法定招标公告媒介 | ⚠️ 首页可访问，公告页有 WAF 挑战 |
| 北京市公共资源交易服务平台 | `ggzyfw.beijing.gov.cn` | 全市工程招标 | ⚠️ 地铁项目分散在 `jyxxggjtbyqs`（交通工程）、`jyxxgcjszbjh`（工程建设-招标计划）、`jyxxgcjsgzgg` 等栏目，实测 5 页 50 条里仅 1 条地铁（约 2%），噪声过大未接入 |
| 中国城市轨道交通网 · 招标/中标 | `rail-transit.com` | **全国城轨招标，含北京地铁与京投轨道运营** | ✅ 已接入 `web-rail-transit-bids` / `web-rail-transit-awards`（实测覆盖北京地铁巡检系统、联络线信号系统、京投轨道运营京雄快线维保等） |

**北京商业招商的关键发现**：北京地铁主力线网的招商主体是 **北京地铁资源开发经营有限公司**（便民用房、自助机具、售货机、货币兑换处、地铁智采供应链），该公司**没有独立官网**，所有招商公告只通过第三方招标平台发布（国信、采购招投标网、乙方宝等）。

**北京招标的实际路径**：
- 主力线网工程/设备招标 → 北京市公共资源交易平台（分散在多个栏目）+ 中城轨网转载
- 京投轨道运营招标 → 中城轨网、第三方平台
- 京港地铁 → 官网直接发布（已接）
- 商业招商 → 北京地铁资源开发经营有限公司，只发第三方

> **北交所阳光采购平台的实测结论**（2026-10）：平台本身很活跃（全站 7751 条，2026-10-23 仍有更新），但**北京地铁只占 3 条**（均为 2024 年 6 月的「数字档案室建设（一期）」项目），京投 / 轨道交通 / 地铁资源三个采购人关键词均为 0 条。说明**北京地铁的主采购不走这个平台**，仍在其自建的 `zhaocai.bjsubway.com`（需登录）。该源接入价值在于零噪声持续监控后续新增公告，而非补历史存量。
>
> 数据接口：`GET /freecms/rest/v1/notice/selectInfoMoreChannel.do?siteId=…&channel=…&purchaser=<采购人名>&title=<标题关键词>`，返回结构化 JSON（含 `content` 完整正文、`budget` 预算、`agency` 代理机构、`purchaseManner` 采购方式）。

> **TLS 兼容性记录**：`ggzyfw.beijing.gov.cn`（TongWeb 前置）拒绝 Node 默认的 `ecdhCurve: auto`（优先 X25519），报 `ERR_SSL_BAD_ECPOINT`。已在 `OUTBOUND_ECDH_CURVE` 显式指定 `X25519:P-256:P-384:P-521`，直连与容器内均恢复正常。

### 4.2 上海

| 渠道 | 地址 | 覆盖 | 实测结果 |
|---|---|---|---|
| **上海市公共资源交易中心 · 物资采购** | `shggzy.com/content/page?channelIds=301` | **地铁采购公告（262 条）、成交结果（207 条）、单一来源（4 条含虹桥地铁 LED 屏）、变更公告（23 条）** | ✅ 已接入 `web-shggzy-metro-bids`、`web-shggzy-metro-awards` |
| 上海地铁采购电子商务平台 | `eps.shmetro.com` | 申通全网物资、工程、维保 | ❌ **已停用**：首页只剩 banner 图；历史详情路径 `/portal/DispatchAction.do` 直接 404 |
| 上海联合产权交易所 | `suaee.com` | 租赁项目（POST `/si/prjs/lease/list`，`KEY` 参数搜索） | ⚠️ 接口可调，但搜「地铁」「轨道交通」「申通」「车站」均为 0 条，搜「商铺」只有江苏项目——**上海地铁商业不走联交所** |
| 上海交易集团综合采购 | `shexgrp.com/jyzx/001001/001001016/` | 全市综合采购 | ⚠️ 数据经 ES 检索接口渲染；内容是镇政府、医院、学校为主，地铁项目无独立分类 |

> **上海渠道的破解过程值得记录**：`shggzy.com` 的列表页 `/jyxxwzcggg/` 直接请求返回 200 但**响应体为空**，浏览器打开也是空白，看上去是反爬。实际是列表页依赖带 `cExt` JWT 的 SSR 渲染；真正的数据接口是 `GET /content/page?channelIds=<频道ID>&title=<关键词>`，无需登录、返回完整 JSON，连正文（`txtCleanHtml`）都在里面。
>
> 频道 ID 从 `GET /channel/list`（41KB，344 个频道）拿。物资采购这一组：
> - `2481` 采购意向 `jyxxwzcgyx`
> - `392` 资格预审公告 `jyxxwzcgzgys`
> - **`301` 采购公告 `jyxxwzcggg`**
> - `393` 变更公告 `jyxxwzcgbggg`
> - `374` 单一来源公示 `jyxxwzcgdyly`
> - **`302` 成交结果公告 `jyxxwzcgzbjg`**
> - `394` 异常公告 `jyxxwzcgycgg`
>
> 注意参数名是 `channelIds`（复数）不是 `channelId`；关键词参数是 `title`。

**结论：上海地铁的招标采购已通过公共资源交易中心覆盖（含广告代理供应商采购）。仍缺的是车站商铺招商的公开挂牌渠道。**

**上海商铺招商的实测细节**（2026-10）：

- 形式是「集合竞价」，公告标题形如「轨道交通多线路 6 间商铺招商集合竞价」「轨道交通多线路 165 间商铺招商」
- 渠道全部是第三方招标聚合站：必联 `bidcenter.com.cn`、中国招标与采购网 `chinabidding.cn`、`gc-zb.com`、`yfbzb.com` 等
- 上海联交所租赁接口（`POST /si/prjs/lease/list`，`KEY` 参数）搜「地铁」「轨道交通」「申通」「车站」均为 0 条
- 上海公共资源交易中心的产权/租赁类频道（`354` 不动产租赁、`44` 国有产权、`299` 综合采购、`2651` 国企采购）本身无数据，返回 `totalElements = 0`
- 上海地铁采购电商平台 `eps.shmetro.com` 已停用

**即上海地铁商铺招商没有官方公开挂牌渠道**，要覆盖只能接第三方聚合站。

### 4.3 广州

| 渠道 | 地址 | 覆盖 | 实测结果 |
|---|---|---|---|
| 广州地铁招标公告 | `bid.gzmtr.com/bizzbgg/` | 工程、设备、备件、服务 | ✅ 已接入 `web-gzmtr-bids` |
| 广州地铁中标公示 | `bid.gzmtr.com/bizzbgs/` | 中标候选人、结果 | ✅ 已接入 `web-gzmtr-awards` |
| **广州产权交易所（GEMAS）** | `new.gemas.com.cn` | **车站商铺招商、自助设备招商、出入口地块出租** | ✅ 已接入 `web-gemas-metro`（238 条在架）、`web-gemas-rail`（14 条） |
| 城轨采购网 | `mtrmart.com/Purchase/Notice/SearchNewList` | 广州/东莞/昆明地铁招标 | ⚠️ 列表可用，但详情链接是 `gotoPage('N','uuid')` 脚本跳转、无 href，按当前 web_list 解析器取不到 URL |
| 广州地铁招投标通知 | `bid.gzmtr.com/bizztbtz/` | 制度类通知 | ⏸ 只有 1 条制度文件，无招标信息 |
| 资质复查 / 供应商评分 | `bid.gzmtr.com/bizztbqykzzqc/`、`gyspjgl/` | 企业库资质、供应商评分 | ⏸ 低频制度类 |

> **广州产权交易所是广州地铁车站商业的官方挂牌渠道**：车站商铺、自助设备、出入口地块全部通过 GEMAS 公开挂牌，接口 `newsys.gemas.com.cn/api/admin/app/listingProject` 支持 `title=` 关键词过滤，返回结构化 JSON（项目名、编号、挂牌价、截止日期）。搜索「地铁」238 条在架，「轨道交通」14 条（含东莞轨道交通大厦等）。

### 4.4 深圳

深铁的采购平台 `cg.shenzhenmc.com` 是四城里栏目最完整的，全站结构统一（`li` + `a` 标题 + `span.Gray` 发布时间）。

| 渠道 | 地址 | 覆盖 | 实测结果 |
|---|---|---|---|
| 招标公告 | `cg.shenzhenmc.com/zzbgg/` | 工程、货物、服务招标 | ✅ 已接入 `web-szmc-cg-bids` |
| 中标候选人公示 | `cg.shenzhenmc.com/zzbhxrgs/` | 中标候选人 | ✅ 已接入 `web-szmc-cg-awards` |
| 中标结果公示 | `cg.shenzhenmc.com/zzbjggs/` | 最终中标结果 | ✅ 已接入 `web-szmc-cg-results` |
| 非招标采购公告 | `cg.shenzhenmc.com/fcggggs/` | 商业、服务、酒店、物业 | ✅ 已接入 `web-szmc-cg-nonbid` |
| 采购计划 | `cg.shenzhenmc.com/zbxmjh/` | 采购前瞻计划 | ✅ 已接入 `web-szmc-cg-plan` |
| 商业招商与广告租售 | `szmc.net/szmc_m/...` | 站内商铺、广告位 | ✅ 已接入 `web-szmc-bids` |
| 港铁深圳采购公告 | `mtrsz.com.cn`（栏目 7620） | 4/13 号线维保、物资 | ✅ 已接入 `web-mtrsz-bids` |
| 港铁深圳招商公告 | `mtrsz.com.cn`（栏目 8368） | 广告资源、商铺招商 | ✅ 已接入 `web-mtrsz-ads` |
| 资审结果 / 变更 / 终止公告 | `zzgys/`、`zgzgggs/`、`zzzgg/` | 过程性公告 | ⏸ 结构一致，可按需追加 |
| 非招标成交结果 | `fcgjggg/` | 成交结果 | ⏸ 与中标结果重复度较高，暂未接入 |

### 4.5 缺口汇总

| 城市 | 建设招标 | 运营/维保 | 商业/车站 | 广告 |
|---|---|---|---|---|
| 北京 | ⚠️ 北京地铁采购平台需登录 | ✅ 京港地铁 | ✅ 京港招商信息（便民用房、VEM 售货机） | ✅ 京港 PIS 广告代理、梯面媒体独家代理 |
| 上海 | ✅ 公共资源采购公告（262 条） | ✅ 采购公告 | ❌ 商铺招商无公开挂牌渠道 | ✅ 广告代理供应商采购（中南地铁传媒等） |
| 广州 | ✅ 招标公告 | ✅ 招标公告 | ✅ GEMAS 车站商铺招商（238 条在架） | ⚠️ 混在招标公告中（电视媒体、播音导向、APP SDK 广告） |
| 深圳 | ✅ 采购平台 | ✅ 采购平台 | ✅ 招商公告 | ✅ 招商 + 广告招商 |

**北京还有一个缺口**：上述「商业/广告」覆盖的是京港地铁运营的 4/14/16/17 号线。北京地铁运营的主力线网（1/2/5/6/8/9/10/13 等）的商业招商走的是需要登录的 `zhaocai.bjsubway.com`，公开渠道未见。

**剩余缺口：上海的商铺招商**——上海地铁商铺走集合竞价，公开渠道只余第三方招标网和公众号。

下一步若要补上海和北京商业渠道，需要确认：上海申通是否已更换采购平台域名；北京地铁电子商务采购平台的登录/公开访问策略。

---

## 五、 后续接入与拓展指引

1. **增补单个网站信源步骤**：
   - 登录后台：`http://192.168.3.133:6088/admin/sources/new`
   - 类型选择 `web_list`。
   - 填入对应列表页 URL 及 CSS 选择器（通常为 `li`、`a`、`span.date`），点击“预览抓取”核验。
   - 满意后点击“创建”，系统将按设定的 `interval_minutes` 自动定期巡检。
2. **批量配置更新**：
   - 本地直接在 `industry/sources.json` 追加 JSON 配置。
   - 运行 `./scripts/deploy-133.sh`，15 秒内自动打包部署同步至 133 服务器并执行 `seed` 导入。
