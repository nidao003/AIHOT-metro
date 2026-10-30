// Display names for the values geoip-lite and the UA parser produce. The database keeps the raw codes
// (stable, language-neutral); only the admin page reads Chinese.
import { CATEGORIES } from "@aihot/industry/taxonomy";

const COUNTRY: Record<string, string> = {
  CN: "中国", HK: "中国香港", TW: "中国台湾", MO: "中国澳门",
  US: "美国", JP: "日本", KR: "韩国", SG: "新加坡", GB: "英国", DE: "德国", FR: "法国",
  RU: "俄罗斯", CA: "加拿大", AU: "澳大利亚", IN: "印度", TH: "泰国", MY: "马来西亚",
  VN: "越南", PH: "菲律宾", ID: "印度尼西亚", NL: "荷兰", IT: "意大利", ES: "西班牙",
  BR: "巴西", MX: "墨西哥", AE: "阿联酋", NZ: "新西兰", CH: "瑞士", SE: "瑞典", PL: "波兰",
  TR: "土耳其", SA: "沙特阿拉伯", EG: "埃及", ZA: "南非", NG: "尼日利亚", PK: "巴基斯坦",
  BD: "孟加拉国", LK: "斯里兰卡", MM: "缅甸", KH: "柬埔寨", LA: "老挝", MN: "蒙古",
};

const REGION: Record<string, string> = {
  BJ: "北京", TJ: "天津", HE: "河北", SX: "山西", NM: "内蒙古", LN: "辽宁", JL: "吉林",
  HL: "黑龙江", SH: "上海", JS: "江苏", ZJ: "浙江", AH: "安徽", FJ: "福建", JX: "江西",
  SD: "山东", HA: "河南", HB: "湖北", HN: "湖南", GD: "广东", GX: "广西", HI: "海南",
  CQ: "重庆", SC: "四川", GZ: "贵州", YN: "云南", XZ: "西藏", SN: "陕西", GS: "甘肃",
  QH: "青海", NX: "宁夏", XJ: "新疆", TW: "台湾", HK: "香港", MO: "澳门",
};

const CITY: Record<string, string> = {
  Beijing: "北京", Shanghai: "上海", Guangzhou: "广州", Shenzhen: "深圳", Chengdu: "成都",
  Hangzhou: "杭州", Chongqing: "重庆", Wuhan: "武汉", "Xi'an": "西安", Xian: "西安",
  Nanjing: "南京", Tianjin: "天津", Suzhou: "苏州", Zhengzhou: "郑州", Changsha: "长沙",
  Dongguan: "东莞", Qingdao: "青岛", Kunming: "昆明", Ningbo: "宁波", Hefei: "合肥",
  Fuzhou: "福州", Xiamen: "厦门", Jinan: "济南", Shenyang: "沈阳", Dalian: "大连",
  Harbin: "哈尔滨", Changchun: "长春", Shijiazhuang: "石家庄", Taiyuan: "太原",
  Nanchang: "南昌", Nanning: "南宁", Guiyang: "贵阳", Haikou: "海口", Lanzhou: "兰州",
  Xining: "西宁", Yinchuan: "银川", Urumqi: "乌鲁木齐", Hohhot: "呼和浩特", Wuxi: "无锡",
  Changzhou: "常州", Xuzhou: "徐州", Wenzhou: "温州", Shaoxing: "绍兴", Jiaxing: "嘉兴",
  Nantong: "南通", Yangzhou: "扬州", Wuhu: "芜湖", Luoyang: "洛阳", Yantai: "烟台",
  Weifang: "潍坊", Zibo: "淄博", Tangshan: "唐山", Baoding: "保定", Handan: "邯郸",
  Datong: "大同", Baotou: "包头", Ordos: "鄂尔多斯", Xianyang: "咸阳", Baoji: "宝鸡",
  Mianyang: "绵阳", Yibin: "宜宾", Zunyi: "遵义", Guilin: "桂林", Liuzhou: "柳州",
  Zhanjiang: "湛江", Zhuhai: "珠海", Foshan: "佛山", Huizhou: "惠州", Zhongshan: "中山",
  Jiangmen: "江门", Shantou: "汕头", Quanzhou: "泉州", Zhangzhou: "漳州", Putian: "莆田",
  Jinhua: "金华", Taizhou: "台州", Zhoushan: "舟山", Huzhou: "湖州", Quzhou: "衢州",
  Lishui: "丽水", Zhenjiang: "镇江", Taian: "泰安", Jining: "济宁", Linyi: "临沂",
  Xiangyang: "襄阳", Yichang: "宜昌", Zhuzhou: "株洲", Yueyang: "岳阳", Ganzhou: "赣州",
  Jiujiang: "九江", Shangrao: "上饶", Anshan: "鞍山", Fushun: "抚顺", Jilin: "吉林",
  Qiqihar: "齐齐哈尔", Daqing: "大庆", Lhasa: "拉萨", Tianshui: "天水",
  Macau: "澳门", "Hong Kong": "香港", Taipei: "台北", Kaohsiung: "高雄",
};

const DEVICE: Record<string, string> = {
  desktop: "桌面", mobile: "手机", tablet: "平板", bot: "爬虫", unknown: "未知",
};

const REFERRER: Record<string, string> = {
  "(direct)": "直接访问",
};

export function countryName(code: string): string {
  return COUNTRY[code.toUpperCase()] ?? code;
}

export function regionName(code: string): string {
  return REGION[code.toUpperCase()] ?? code;
}

export function cityName(name: string): string {
  if (!name) return "未知";
  return CITY[name] ?? name;
}

export function deviceName(value: string): string {
  return DEVICE[value.toLowerCase()] ?? value;
}

export function referrerName(host: string): string {
  return REFERRER[host] ?? host;
}

/** Page names for the popular-pages table, so a path is readable without opening it. Longest prefixes
 *  first: /daily-archive must win over /daily. */
const PATHS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/items\//, "文章详情"],
  [/^\/daily-archive/, "日报归档"],
  [/^\/daily/, "日报"],
  [/^\/topic\//, "话题详情"],
  [/^\/topics/, "话题列表"],
  [/^\/story\//, "专题"],
  [/^\/all/, "全部动态"],
  [/^\/hot/, "热门"],
  [/^\/agent/, "Agent 接入"],
  [/^\/about/, "关于"],
  [/^\/changelog/, "更新日志"],
  [/^\/feedback/, "反馈"],
  [/^\/search-busy/, "搜索"],
  [/^\/starred/, "收藏"],
  [/^\/more/, "更多"],
  [/^\/privacy/, "隐私政策"],
  [/^\/terms/, "服务条款"],
  [/^\/admin/, "后台"],
  [/^\/$/, "首页"],
];

const CATEGORY_LABEL = new Map<string, string>(CATEGORIES.map((c) => [c.key, c.label]));

export function pathName(path: string): string {
  const [base, search] = path.split("?");
  const label = PATHS.find(([re]) => re.test(base ?? ""))?.[1] ?? (base || "/");
  const params = new URLSearchParams(search ?? "");
  const category = params.get("category");
  if (category) return `${label} · ${CATEGORY_LABEL.get(category) ?? category}`;
  const kind = params.get("kind");
  if (kind) return `${label} · ${kind}`;
  return label;
}
