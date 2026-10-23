# 全国城市轨道交通全生态信息源名录 (MetroHOT Sources Directory)

本名录系统性梳理了全国 54 座已开通城市轨道交通城市的核心母集团、运营子公司、资源与TOD商业子公司、招投标采购专栏及行业监管机构。

---

## 一、 当前系统已接入运行的自动化信源对照表

### 1.1 一线城市官方直连（北京 / 上海 / 广州 / 深圳）

| 城市 | 主体 | 信源 ID | 覆盖板块 | 采集地址 | 状态 |
|---|---|---|---|---|---|
| 北京 | 京投公司 | `web-bii-news` | 集团财报 / 债券投融资 / 规划 | `https://www.bii.com.cn/newsList_29_page1.html` | ✅ 活跃 |
| 北京 | 北京地铁 | `web-bjsubway-news` | 运营调度 / 安全应急 | `https://www.bjsubway.com/news/qyxw/yyzd/` | ✅ 活跃 |
| 北京 | 京港地铁 | `web-mtr-bj-news` | 运营调度 / 智慧城轨 | `https://www.mtr.bj.cn/news/company-news` | ✅ 活跃 |
| 北京 | 京港地铁 | `web-mtr-bj-bids` | 招标采购 / 设备维保 | `https://www.mtr.bj.cn/category/business/tender-and-supplier-guidelines/tender-invitations` | ✅ 活跃 |
| 上海 | 申通地铁 | `web-shmetro-news` | 新线开通 / 运营调度 | `https://www.shmetro.com/p1/xwzx.html` | ✅ 活跃 |
| 广州 | 广州地铁 | `web-gzmtr-news` | 运营调度 / 车站商业 | `https://www.gzmtr.com/ygwm/xwzx/gsxw/` | ✅ 活跃 |
| 广州 | 广州地铁招标平台 | `web-gzmtr-bids` | 招标采购 / 设备维保 | `https://bid.gzmtr.com/bizzbgg/` | ✅ 活跃 |
| 广州 | 广州地铁招标平台 | `web-gzmtr-awards` | 中标公示 / 工程建设 | `https://bid.gzmtr.com/bizzbgs/` | ✅ 活跃 |
| 深圳 | 深铁集团 | `web-szmc-bids` | 车站商业 / TOD / 广告 | `https://www.szmc.net/szmc_m/zhaobiaozhaoshang/zhaoshanggonggao/zhaoshangxinxi1/` | ✅ 活跃 |
| 深圳 | 深铁集团 | `web-szmc-announce` | 规划批复 / 经营动态 | `https://www.szmc.net/home/xinwenzhongxin/gongsigonggao/` | ✅ 活跃 |
| 深圳 | 深铁采购平台 | `web-szmc-cg-bids` | 招标采购 / 工程建设 | `https://cg.shenzhenmc.com/zzbgg/index.jhtml` | ✅ 活跃 |
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
| **北京** | 北京市地铁运营有限公司 (北京地铁) | `https://www.bjsubway.com` | 运营时刻表、行车调度、客流 |
| **北京** | 北京京港地铁有限公司 (京港地铁) | `https://www.mtr.bj.cn` | 4/14/16/17号线PPP运营、港式服务 |
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

## 四、 招投标与采购公示平台清单

地铁行业是高投资、严监管行业，大量车辆采购、信号维保、商业租赁均必须走公开招投标程序：

| 平台名称 | 官方入口 | 覆盖重点信息 | 抓取策略 |
|---|---|---|---|
| **中国轨道交通网 · 招标采购** | `http://www.rail-transit.com/zhaobiao/` | 全国54城地铁机电设备、车辆、通信信号、工程施工招标公告 | `web_list`（已接入） |
| **中国轨道交通网 · 中标公示** | `http://www.rail-transit.com/zhongbiao/` | 中标候选人公示、评标结果公告、合同签约金额公布 | `web_list`（已接入） |
| **深圳地铁 · 招标招商公告** | `https://www.szmc.net/szmc_m/zhaobiaozhaoshang/` | 车站商业点位招商、商铺租赁竞价、广告媒体刊例经营权招商 | `web_list`（已接入） |
| **上海地铁采购电子商务平台 (EPS)** | `https://eps.shmetro.com` | 申通地铁全网物资设备采购、工程施工、维保服务公开招标 | `web_list` |
| **广州地铁招投标平台** | `http://zb.gzmtr.cn` | 广州地铁及大湾区城际线网设备采购与服务招投标 | `web_list` |
| **北京公共资源交易服务平台** | `https://ggzyfw.beijing.gov.cn` | 北京地铁及京投公司基础设施工程与车辆装备招标 | `web_list` |
| **机电产品招标投标电子交易平台** | `https://www.chinabidding.com` | 全国各城市地铁盾构机、列控CBTC、牵引供电系统国际招标 | `web_list` |
| **中国招标投标公共服务平台** | `http://www.cebpubservice.com` | 国家级法定招投标公告发布媒介（带“轨道交通”专项过滤） | `web_list` |

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
