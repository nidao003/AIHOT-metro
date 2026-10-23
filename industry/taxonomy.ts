// 这个行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（教程、观点）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * tagColor 是飞书推送卡片里跟在标题后面的这一类小标签的颜色（飞书 text_tag 的颜色名）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  {
    key: "planning-construction",
    tagColor: "indigo",
    label: "规划建设",
    feedLabel: "规划与建设",
    section: "线路规划与建设批复",
    guide: "国家发改委或地方发改委线网规划批复、工可批复、初步设计批复；新线开工、贯通、轨通、电通、空载试运行及初期运营通车等全周期工程节点。"
  },
  {
    key: "operations-safety",
    tagColor: "turquoise",
    label: "运营安全",
    feedLabel: "运营与安全",
    section: "运营调度与安全",
    guide: "列车运行图调整、行车调度、信号系统CBTC/无人驾驶升级、列车延误、客流限流、防汛防灾应急演练及突发故障处置。"
  },
  {
    key: "passenger-flow",
    tagColor: "violet",
    label: "客流运力",
    feedLabel: "客流与运力",
    section: "客运流量与运力监测",
    guide: "交通运输部全国城市客运月报、重点城市及全网历史单日客流创新高、重点车站客运强度、运力投放与大客流应对保障。"
  },
  {
    key: "tod-development",
    tagColor: "green",
    label: "TOD开发",
    feedLabel: "TOD综合开发",
    section: "TOD与上盖物业开发",
    guide: "地铁沿线与车辆段上盖物业综合开发、站城一体化TOD项目、土地出让与规划、地铁附属商业地产投资与租售（参考港铁物业发展模式）。"
  },
  {
    key: "station-retail",
    tagColor: "yellow",
    label: "车站商业",
    feedLabel: "车站商业与零售",
    section: "车站商业与便民零售",
    guide: "地铁站厅与站台红线内商铺租赁、站内便利店、便民餐饮、自动售卖机、自助服务设施及车站商业空间经营管理（参考港铁车站商务模式）。"
  },
  {
    key: "metro-advertising",
    tagColor: "pink",
    label: "地铁广告",
    feedLabel: "地铁广告与媒体",
    section: "地铁广告与传媒经营",
    guide: "地铁列车车厢内外包装广告、车站站台灯箱与立柱广告、数字大屏媒体、车站广播与车载电视广告招商与特许经营。"
  },
  {
    key: "industry",
    tagColor: "orange",
    label: "经营财报",
    feedLabel: "经营与财报",
    section: "集团经营与财报",
    guide: "城轨集团年度报告、财务报表、票务收入与政府补贴收支、债务融资与绿色债券发行、高管人事任命与企业重组。"
  },
  {
    key: "policy-standard",
    tagColor: "purple",
    label: "政策标准",
    feedLabel: "政策与标准",
    section: "行业政策与标准",
    guide: "交通运输部、国家铁路局、中国城市轨道交通协会发布的产业指导意见、安全管理规定、智慧城轨技术规范及团体标准。",
    commentary: true
  },
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（地铁行业是新线开通）：日报报头的“N 条新开通线路”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 没有这样一类的行业设成 null，报头就不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = {
  category: "planning-construction",
  tag: "新线开通",
  unit: "条新开通线路"
};

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = [
  "metro", "subway", "tod", "cbtc", "ato", "atp", "atc", "camet", "mot", "ndrc",
  "客运量", "客运强度", "运营里程", "准点率", "工可", "初期运营", "试运行", "换乘站"
];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = [
  "line_milestone",
  "planning_approval",
  "operation_event",
  "flow_capacity_data",
  "tod_development",
  "station_commercial",
  "metro_advertising",
  "corporate_finance",
  "policy_standard",
] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "新线开通", "规划批复", "工程建设", "运营调度", "安全应急",
  "客流运能", "TOD开发", "车站商业", "地铁广告", "集团财报",
  "经营动态", "行业政策", "技术规范", "其他"
] as const;

/** 可选的主题标签。 */
export const TOPIC_TAGS = [
  "全自动运行", "CBTC", "智慧城轨", "客运强度", "早晚高峰", "防汛应急",
  "站城一体", "物业上盖", "市域铁路", "有轨电车", "低碳节能", "票制票价",
  "设备维保", "资产盘活", "既有线改造", "客流纪录", "站内商铺", "便民餐饮",
  "车辆段上盖", "车厢广告", "站台灯箱", "特许经营", "招标采购", "中标公示"
] as const;

/** 可选的实体标签（公司、机构、平台）。 */
export const ENTITY_TAGS = [
  "交通运输部", "中国城市轨道交通协会", "国家发改委",
  "申通地铁", "北京地铁", "广州地铁", "深圳地铁", "成都轨道集团",
  "武汉地铁", "南京地铁", "重庆轨道交通", "杭州地铁", "青岛地铁",
  "苏州轨道交通", "西安地铁", "郑州地铁", "长沙轨道交通", "天津轨道交通",
  "沈阳地铁", "合肥轨道交通", "宁波轨道交通", "无锡地铁", "佛山地铁", "东莞轨道交通",
  "深铁商业", "深铁置业", "京投发展", "京港地铁", "杭港地铁", "港铁深圳", "京投轨道运营", "洛阳轨道", "乌鲁木齐轨道", "石家庄轨道", "南昌轨道", "兰州轨道", "哈尔滨地铁",
  "港铁公司", "中国中车", "京投公司"
] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "客流": "客流运能", "客流量": "客流运能", "客运量": "客流运能", "运力": "客流运能",
  "开通": "新线开通", "通车": "新线开通", "试运营": "新线开通", "初期运营": "新线开通",
  "批复": "规划批复", "工可": "规划批复", "可行性研究": "规划批复", "建设规划": "规划批复",
  "施工": "工程建设", "贯通": "工程建设", "轨通": "工程建设", "电通": "工程建设", "封顶": "工程建设",
  "财报": "集团财报", "年报": "集团财报", "半年报": "集团财报", "业绩": "集团财报", "营收": "集团财报",
  "商业": "车站商业", "商铺": "车站商业", "站内商业": "车站商业", "便民商业": "车站商业",
  "TOD": "TOD开发", "上盖开发": "TOD开发", "站城融合": "TOD开发", "物业开发": "TOD开发", "上盖综合体": "TOD开发",
  "广告": "地铁广告", "广告传媒": "地铁广告", "车厢广告": "地铁广告", "灯箱广告": "地铁广告", "数字媒体": "地铁广告",
  "调度": "运营调度", "运行图": "运营调度", "延误": "运营调度", "列车故障": "运营调度",
  "安全": "安全应急", "事故": "安全应急", "消防": "安全应急", "演练": "安全应急", "防汛": "安全应急",
  "标准": "技术规范", "规范": "技术规范", "技术标准": "技术规范",
  "政策": "行业政策", "规章": "行业政策", "法规": "行业政策",
  "招标": "招标采购", "采购": "招标采购", "招标公告": "招标采购",
  "中标": "中标公示", "中选": "中标公示", "评标结果": "中标公示",
  "智慧地铁": "智慧城轨", "无人驾驶": "全自动运行", "自动化": "全自动运行"
};

// ── 公司与主体 ──────────────────────────────────────────────────────────────────────────

/**
 * 公司主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。
 * aliases 给结构抽取模型看；orgNames 是这家公司发消息时开头用的组织名（公司、实验室、团队），
 * 在它自己的主题页上读者知道说的是谁，可以省去；otherNames 是公司的其他称呼（官方账号名、子品牌）。
 * 所有这些名字都用来认出说的是哪家公司，比如把事实的主体对到发布方。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] }> = {
  mot: { name: "交通运输部", displayTag: "交通运输部", aliases: ["交通运输部", "交通部", "部运输服务司"], orgNames: ["交通运输部"] },
  camet: { name: "中国城市轨道交通协会", displayTag: "中城轨协", aliases: ["中国城市轨道交通协会", "中城轨协", "CAMET"], orgNames: ["中国城市轨道交通协会"] },
  ndrc: { name: "国家发改委", displayTag: "国家发改委", aliases: ["国家发改委", "发改委基础司", "国家发展改革委"], orgNames: ["国家发展改革委"] },
  shmetro: { name: "申通地铁", displayTag: "申通地铁", aliases: ["申通地铁", "上海地铁", "上海申通地铁集团"], orgNames: ["申通地铁集团", "上海地铁"], otherNames: ["上海地铁shmetro"] },
  bjsubway: { name: "北京地铁", displayTag: "北京地铁", aliases: ["北京地铁", "北京市地铁运营有限公司", "北京地铁运营"], orgNames: ["北京地铁"], otherNames: ["北京地铁公司"] },
  gzmtr: { name: "广州地铁", displayTag: "广州地铁", aliases: ["广州地铁", "广州地铁集团", "广州地铁建设"], orgNames: ["广州地铁集团", "广州地铁"], otherNames: ["广州地铁微讯"] },
  szmc: { name: "深圳地铁", displayTag: "深圳地铁", aliases: ["深圳地铁", "深铁集团", "深圳市地铁集团"], orgNames: ["深圳地铁集团", "深铁集团"] },
  cdmetro: { name: "成都轨道集团", displayTag: "成都轨道", aliases: ["成都轨道集团", "成都地铁", "成都轨道交通集团"], orgNames: ["成都轨道交通集团", "成都地铁"] },
  whrt: { name: "武汉地铁", displayTag: "武汉地铁", aliases: ["武汉地铁", "武汉地铁集团"], orgNames: ["武汉地铁集团"] },
  mtr: { name: "港铁公司", displayTag: "港铁", aliases: ["港铁", "港铁公司", "香港铁路有限公司", "MTR"], orgNames: ["香港铁路有限公司", "港铁公司"] },
  crrc: { name: "中国中车", displayTag: "中国中车", aliases: ["中国中车", "中车", "CRRC"], orgNames: ["中国中车股份有限公司", "中车长客", "中车四方", "中车株机"] },
  bii: { name: "京投公司", displayTag: "京投公司", aliases: ["京投公司", "北京市基础设施投资有限公司"], orgNames: ["京投公司"] },
  bjmoa: { name: "京投轨道运营", displayTag: "京投轨道运营", aliases: ["京投轨道运营", "京投轨道运营公司", "北京市轨道交通运营管理有限公司", "北京轨道运营"], orgNames: ["京投轨道运营公司", "北京市轨道交通运营管理有限公司"] },
  hzmetro: { name: "杭州地铁", displayTag: "杭州地铁", aliases: ["杭州地铁", "杭州市地铁集团"], orgNames: ["杭州市地铁集团"] },
  njmetro: { name: "南京地铁", displayTag: "南京地铁", aliases: ["南京地铁", "南京地铁集团"], orgNames: ["南京地铁集团"] },
  cqmetro: { name: "重庆轨道交通", displayTag: "重庆轨道", aliases: ["重庆轨道交通", "重庆地铁", "重庆轨道集团"], orgNames: ["重庆市轨道交通（集团）有限公司"] },
  xianrail: { name: "西安地铁", displayTag: "西安地铁", aliases: ["西安地铁", "西安市轨道交通集团"], orgNames: ["西安市轨道交通集团"] },
  szmtr: { name: "苏州轨道交通", displayTag: "苏州轨交", aliases: ["苏州轨道交通", "苏州地铁", "苏州轨道集团"], orgNames: ["苏州轨道交通集团"] },
  zzmetro: { name: "郑州地铁", displayTag: "郑州地铁", aliases: ["郑州地铁", "郑州地铁集团"], orgNames: ["郑州地铁集团"] },
  csmtr: { name: "长沙轨道交通", displayTag: "长沙轨道", aliases: ["长沙轨道交通", "长沙地铁", "长沙市轨道交通集团"], orgNames: ["长沙市轨道交通集团"] },
  qdmetro: { name: "青岛地铁", displayTag: "青岛地铁", aliases: ["青岛地铁", "青岛地铁集团"], orgNames: ["青岛地铁集团"] },
  tjgdjt: { name: "天津轨道交通", displayTag: "天津轨道", aliases: ["天津轨道交通", "天津地铁", "天津轨道集团"], orgNames: ["天津轨道交通集团"] },
  symtc: { name: "沈阳地铁", displayTag: "沈阳地铁", aliases: ["沈阳地铁", "沈阳地铁集团"], orgNames: ["沈阳地铁集团"] },
  nbmetro: { name: "宁波轨道交通", displayTag: "宁波轨道", aliases: ["宁波轨道交通", "宁波地铁"], orgNames: ["宁波市轨道交通集团"] },
  hfgdjt: { name: "合肥轨道交通", displayTag: "合肥轨道", aliases: ["合肥轨道交通", "合肥地铁"], orgNames: ["合肥市轨道交通集团"] },
  wxmetro: { name: "无锡地铁", displayTag: "无锡地铁", aliases: ["无锡地铁", "无锡地铁集团"], orgNames: ["无锡地铁集团"] },
  fmtr: { name: "佛山地铁", displayTag: "佛山地铁", aliases: ["佛山地铁", "佛山铁投", "佛山市轨道交通发展有限公司"], orgNames: ["佛山铁投"] },
  dggdjt: { name: "东莞轨道交通", displayTag: "东莞轨道", aliases: ["东莞轨道交通", "东莞地铁"], orgNames: ["东莞市轨道交通有限公司"] },
  xmgdjt: { name: "厦门轨道交通", displayTag: "厦门轨道", aliases: ["厦门轨道交通", "厦门地铁", "厦门轨道建设发展集团"], orgNames: ["厦门轨道建设发展集团"] },
  fzmetro: { name: "福州地铁", displayTag: "福州地铁", aliases: ["福州地铁", "福州地铁集团"], orgNames: ["福州地铁集团"] },
  "szmc-comm": { name: "深铁商业", displayTag: "深铁商业", aliases: ["深铁商业", "深圳市深铁商业发展有限公司"], orgNames: ["深铁商业"] },
  "szmc-prop": { name: "深铁置业", displayTag: "深铁置业", aliases: ["深铁置业", "深圳市深铁置业集团有限公司"], orgNames: ["深铁置业"] },
  "cdmetro-tod": { name: "成都轨道城投 (TOD)", displayTag: "成都TOD", aliases: ["成都轨道城市投资", "成都轨道城投", "成都TOD"], orgNames: ["成都轨道城市投资集团"] },
  "bii-dev": { name: "京投发展", displayTag: "京投发展", aliases: ["京投发展", "京投发展股份有限公司"], orgNames: ["京投发展"] },
  "mtr-bj": { name: "京港地铁", displayTag: "京港地铁", aliases: ["京港地铁", "北京京港地铁有限公司"], orgNames: ["京港地铁"] },
  "mtrsz": { name: "港铁深圳", displayTag: "港铁深圳", aliases: ["港铁深圳", "港铁轨道交通（深圳）有限公司", "港铁轨道交通(深圳)有限公司"], orgNames: ["港铁轨道交通（深圳）有限公司", "港铁深圳"] },
  "mtr-hz": { name: "杭港地铁", displayTag: "杭港地铁", aliases: ["杭港地铁", "杭州杭港地铁有限公司"], orgNames: ["杭港地铁"] },
  hrbdt: { name: "哈尔滨地铁", displayTag: "哈尔滨", aliases: ["哈尔滨地铁集团", "哈尔滨市轨道交通"], orgNames: ["哈尔滨地铁集团有限公司"] },
  lzgdjt: { name: "兰州轨道", displayTag: "兰州轨道", aliases: ["兰州市轨道交通", "兰州地铁"], orgNames: ["兰州市轨道交通有限公司"] },
  sjzmetro: { name: "石家庄轨道", displayTag: "石家庄", aliases: ["石家庄市轨道交通", "石家庄地铁"], orgNames: ["石家庄市轨道交通集团有限责任公司"] },
  ncmtr: { name: "南昌轨道", displayTag: "南昌轨道", aliases: ["南昌轨道交通", "南昌地铁"], orgNames: ["南昌轨道交通集团有限公司"] },
  urumqi: { name: "乌鲁木齐轨道", displayTag: "乌鲁木齐", aliases: ["乌鲁木齐轨道交通", "乌鲁木齐地铁", "乌鲁木齐城市轨道集团"], orgNames: ["乌鲁木齐城市轨道集团有限公司"] },
  lysubway: { name: "洛阳轨道", displayTag: "洛阳轨道", aliases: ["洛阳市轨道交通集团", "洛阳地铁", "洛阳轨道"], orgNames: ["洛阳市轨道交通集团有限责任公司"] },
};

/**
 * 身份词典：摘要和标题里出现的公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 行业没有这个问题时可以留空数组。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "mot", name: "交通运输部", patterns: [/交通运输部|交通部/i] },
  { id: "camet", name: "中国城市轨道交通协会", patterns: [/中国城市轨道交通协会|中城轨协|\bcamet\b/i] },
  { id: "ndrc", name: "国家发改委", patterns: [/国家发改委|国家发展改革委/i] },
  { id: "shmetro", name: "申通地铁", patterns: [/申通地铁|上海地铁/i] },
  { id: "bjsubway", name: "北京地铁", patterns: [/北京地铁/i] },
  { id: "gzmtr", name: "广州地铁", patterns: [/广州地铁/i] },
  { id: "szmc", name: "深圳地铁", patterns: [/深圳地铁|深铁/i] },
  { id: "cdmetro", name: "成都轨道集团", patterns: [/成都轨道|成都地铁/i] },
  { id: "whrt", name: "武汉地铁", patterns: [/武汉地铁/i] },
  { id: "mtr", name: "港铁公司", patterns: [/港铁|香港铁路|\bmtr\b/i] },
  { id: "crrc", name: "中国中车", patterns: [/中国中车|\bcrrc\b/i] },
  { id: "bii", name: "京投公司", patterns: [/京投公司|北京市基础设施投资/i] },
  { id: "bjmoa", name: "京投轨道运营", patterns: [/京投轨道运营|北京市轨道交通运营管理|北京轨道运营/i] },
  { id: "hzmetro", name: "杭州地铁", patterns: [/杭州地铁/i] },
  { id: "njmetro", name: "南京地铁", patterns: [/南京地铁/i] },
  { id: "cqmetro", name: "重庆轨道交通", patterns: [/重庆轨道|重庆地铁/i] },
  { id: "xianrail", name: "西安地铁", patterns: [/西安地铁|西安市轨道交通/i] },
  { id: "szmtr", name: "苏州轨道交通", patterns: [/苏州轨道|苏州地铁|苏州轨交/i] },
  { id: "zzmetro", name: "郑州地铁", patterns: [/郑州地铁/i] },
  { id: "csmtr", name: "长沙轨道交通", patterns: [/长沙轨道|长沙地铁/i] },
  { id: "qdmetro", name: "青岛地铁", patterns: [/青岛地铁/i] },
  { id: "tjgdjt", name: "天津轨道交通", patterns: [/天津轨道|天津地铁/i] },
  { id: "symtc", name: "沈阳地铁", patterns: [/沈阳地铁/i] },
  { id: "nbmetro", name: "宁波轨道交通", patterns: [/宁波轨道|宁波地铁/i] },
  { id: "hfgdjt", name: "合肥轨道交通", patterns: [/合肥轨道|合肥地铁/i] },
  { id: "wxmetro", name: "无锡地铁", patterns: [/无锡地铁/i] },
  { id: "fmtr", name: "佛山地铁", patterns: [/佛山地铁|佛山铁投/i] },
  { id: "dggdjt", name: "东莞轨道交通", patterns: [/东莞轨道|东莞地铁/i] },
  { id: "xmgdjt", name: "厦门轨道交通", patterns: [/厦门轨道|厦门地铁/i] },
  { id: "fzmetro", name: "福州地铁", patterns: [/福州地铁/i] },
  { id: "szmc-comm", name: "深铁商业", patterns: [/深铁商业/i] },
  { id: "szmc-prop", name: "深铁置业", patterns: [/深铁置业/i] },
  { id: "cdmetro-tod", name: "成都轨道城投 (TOD)", patterns: [/成都轨道城市投资|成都TOD/i] },
  { id: "bii-dev", name: "京投发展", patterns: [/京投发展/i] },
  { id: "mtr-bj", name: "京港地铁", patterns: [/京港地铁/i] },
  { id: "mtrsz", name: "港铁深圳", patterns: [/港铁深圳|港铁轨道交通（深圳）|港铁轨道交通\(深圳\)/i] },
  { id: "mtr-hz", name: "杭港地铁", patterns: [/杭港地铁/i] },
  { id: "hrbdt", name: "哈尔滨地铁", patterns: [/哈尔滨.{0,4}(地铁|轨道)/i] },
  { id: "lzgdjt", name: "兰州轨道", patterns: [/兰州.{0,4}(轨道|地铁)/i] },
  { id: "sjzmetro", name: "石家庄轨道", patterns: [/石家庄.{0,4}(轨道|地铁)/i] },
  { id: "ncmtr", name: "南昌轨道", patterns: [/南昌.{0,4}(轨道|地铁)/i] },
  { id: "urumqi", name: "乌鲁木齐轨道", patterns: [/乌鲁木齐.{0,4}(轨道|地铁)/i] },
  { id: "lysubway", name: "洛阳轨道", patterns: [/洛阳轨道|洛阳地铁|洛阳市轨道交通/i] },
];

/** 这些域名上的文章，发布方就是对应的公司（托管平台如 GitHub、arXiv 不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "mot", domains: ["mot.gov.cn"] },
  { entityId: "camet", domains: ["camet.org.cn"] },
  { entityId: "ndrc", domains: ["ndrc.gov.cn"] },
  { entityId: "shmetro", domains: ["shmetro.com"] },
  { entityId: "bjsubway", domains: ["bjsubway.com"] },
  { entityId: "gzmtr", domains: ["gzmtr.com"] },
  { entityId: "szmc", domains: ["szmc.net"] },
  { entityId: "cdmetro", domains: ["chengdurail.com"] },
  { entityId: "whrt", domains: ["whrt.com"] },
  { entityId: "mtr", domains: ["mtr.com.hk"] },
  { entityId: "crrc", domains: ["crrcgc.cc"] },
  { entityId: "bii", domains: ["bii.com.cn"] },
  { entityId: "bjmoa", domains: ["bjmoa.cn"] },
  { entityId: "hzmetro", domains: ["hzmetro.com"] },
  { entityId: "njmetro", domains: ["njmetro.com.cn"] },
  { entityId: "cqmetro", domains: ["cqmetro.cn"] },
  { entityId: "xianrail", domains: ["xianrail.com"] },
  { entityId: "szmtr", domains: ["sz-mtr.com"] },
  { entityId: "zzmetro", domains: ["zzmetro.cn"] },
  { entityId: "csmtr", domains: ["hnsgzjt.com"] },
  { entityId: "qdmetro", domains: ["qd-metro.com"] },
  { entityId: "tjgdjt", domains: ["tjgdjt.com"] },
  { entityId: "symtc", domains: ["symtc.com"] },
  { entityId: "nbmetro", domains: ["nbmetro.com"] },
  { entityId: "hfgdjt", domains: ["hfgdjt.com"] },
  { entityId: "wxmetro", domains: ["wxmetro.net"] },
  { entityId: "fmtr", domains: ["fmtr.cn"] },
  { entityId: "dggdjt", domains: ["dggdjt.com"] },
  { entityId: "xmgdjt", domains: ["xmgdjt.com.cn"] },
  { entityId: "fzmetro", domains: ["fz-metro.com.cn"] },
  { entityId: "mtr-bj", domains: ["mtr.bj.cn"] },
  { entityId: "mtrsz", domains: ["mtrsz.com.cn"] },
  { entityId: "mtr-hz", domains: ["mtrhz.com.cn"] },
  { entityId: "lysubway", domains: ["lysubway.com.cn"] },
  { entityId: "urumqi", domains: ["urumqimtr.com"] },
  { entityId: "sjzmetro", domains: ["sjzmetro.cn"] },
  { entityId: "lzgdjt", domains: ["lzgdjt.com"] },
  { entityId: "hrbdt", domains: ["hrbggzy.harbin.gov.cn"] },
  { entityId: "ncmtr", domains: ["ncmtr.com"] },
];

/** 原文里的这些写法也算提到了对应公司。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "shmetro", pattern: /上海地铁shmetro/i },
  { entityId: "gzmtr", pattern: /广州地铁微讯/i },
];
