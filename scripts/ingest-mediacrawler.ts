#!/usr/bin/env node
//
// Ingests scraped social media items from MediaCrawler into MetroHOT via POST /api/ingest/items.
//
// Usage:
//   node scripts/ingest-mediacrawler.ts [--data-dir=../MediaCrawler/data] [--dry-run] [--platform=xhs]
//
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const DEFAULT_KEYWORDS = [
  '地铁',
  '城轨',
  '地铁城轨',
  '地铁车站',
  '地铁广告',
  '地铁商铺',
  '轨道交通',
  '轻轨',
  '站内商业',
  '车站商铺',
  '地铁商圈',
  '地铁新线',
  '地铁开线',
  '新线开通',
  '地铁通车',
  '地铁试运行',
  '地铁首通段',
  '地下商业街',
  '地铁商业街',
  '地铁便利店',
  '地铁招商',
  '车厢广告',
  '站台灯箱',
  '地铁包车',
  '地铁大屏',
  '地铁媒体',
  '地铁营销',
  '地铁换乘站',
  '地铁出入口',
  '地铁tod',
  '以地养铁',
  '地铁亏损',
  '地铁盈利',
  '地铁财报',
  '地铁客流',
  '地铁客运量',
];

interface RawItem {
  note_id?: string;
  id?: string;
  content_id?: string;
  video_id?: string;
  title?: string;
  desc?: string;
  content?: string;
  content_text?: string;
  note_url?: string;
  share_url?: string;
  content_url?: string;
  video_url?: string;
  video_cover_url?: string;
  video_play_count?: string | number;
  video_danmaku?: string | number;
  video_comment?: string | number;
  time?: number;
  create_time?: number | string;
  created_time?: string | number;
  nickname?: string;
  user_nickname?: string;
  author?: string;
  liked_count?: string | number;
  voteup_count?: string | number;
  collected_count?: string | number;
  comment_count?: string | number;
  comments_count?: string | number;
  share_count?: string | number;
  shared_count?: string | number;
  create_date_time?: string;
  source_keyword?: string;
  [key: string]: unknown;
}

export interface IngestItem {
  title: string;
  url: string;
  publishedAt: string;
  author: string | null;
  bodyText?: string;
  bodyHtml?: string;
  excerpt?: string;
  raw: Record<string, unknown>;
}

export interface SyncOptions {
  dataDir: string;
  apiBase: string;
  ingestToken: string;
  dryRun?: boolean;
  force?: boolean;
  platform?: string;
  keywords?: string[];
  stateFile?: string;
  minSocialScore?: number;
}

const PLATFORM_MAP: Record<string, { id: string; name: string }> = {
  xhs: { id: 'mc-xhs-metro', name: '小红书·地铁城轨' },
  xiaohongshu: { id: 'mc-xhs-metro', name: '小红书·地铁城轨' },
  zhihu: { id: 'mc-zhihu-metro', name: '知乎·地铁城轨' },
  wb: { id: 'mc-wb-metro', name: '微博·地铁城轨' },
  weibo: { id: 'mc-wb-metro', name: '微博·地铁城轨' },
  bili: { id: 'mc-bili-metro', name: 'B站·地铁城轨' },
  bilibili: { id: 'mc-bili-metro', name: 'B站·地铁城轨' },
  dy: { id: 'mc-dy-metro', name: '抖音·地铁城轨' },
  douyin: { id: 'mc-dy-metro', name: '抖音·地铁城轨' },
  ks: { id: 'mc-ks-metro', name: '快手·地铁城轨' },
  kuaishou: { id: 'mc-ks-metro', name: '快手·地铁城轨' },
};

export function parseHumanNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (!val || typeof val !== 'string') return 0;
  const s = val.trim();
  if (s.endsWith('万') || s.endsWith('w') || s.endsWith('W')) {
    const num = parseFloat(s.slice(0, -1));
    return Number.isNaN(num) ? 0 : Math.round(num * 10000);
  }
  const clean = s.replace(/,/g, '');
  const num = parseFloat(clean);
  return Number.isNaN(num) ? 0 : Math.round(num);
}

let cachedOfficialUids: Set<string> | null = null;

export function loadOfficialUids(docPath?: string): Set<string> {
  if (cachedOfficialUids) return cachedOfficialUids;
  cachedOfficialUids = new Set<string>();
  const candidates = [
    docPath,
    path.resolve(process.cwd(), 'docs/subway-weibo-accounts.json'),
    path.resolve(process.cwd(), '../docs/subway-weibo-accounts.json'),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item?.uid) cachedOfficialUids.add(String(item.uid));
          }
          break;
        }
      } catch {
        // ignore
      }
    }
  }
  return cachedOfficialUids;
}

export function detectOfficialSubway(rawText: string, author: string | null): { isOfficial: boolean; cleanName?: string; sourceId?: string } {
  const combined = `${author || ''} ${rawText}`;
  if (combined.includes('成都地铁运营') || (author === '成***营' || (author === '成***铁' && combined.includes('运营')))) {
    return { isOfficial: true, cleanName: '成都地铁运营', sourceId: 'mc-wb-cdmetro-ops' };
  }
  if (combined.includes('成都地铁') || author === '成***铁') {
    return { isOfficial: true, cleanName: '成都地铁', sourceId: 'mc-wb-cdmetro' };
  }
  if (combined.includes('上海地铁') || author === '上***o') {
    return { isOfficial: true, cleanName: '上海地铁shmetro', sourceId: 'mc-wb-shmetro' };
  }
  if (combined.includes('北京地铁') || author === '北***铁') {
    return { isOfficial: true, cleanName: '北京地铁', sourceId: 'mc-wb-bjmetro' };
  }
  if (combined.includes('广州地铁') || author === '广***铁') {
    return { isOfficial: true, cleanName: '广州地铁', sourceId: 'mc-wb-gzmetro' };
  }
  if (combined.includes('深圳地铁') || author === '深***铁') {
    return { isOfficial: true, cleanName: '深圳地铁', sourceId: 'mc-wb-szmetro' };
  }
  if (author && (author.endsWith('地铁') || author.endsWith('地铁运营') || author.endsWith('轨道交通'))) {
    return { isOfficial: true, cleanName: author };
  }
  return { isOfficial: false };
}

export function isOfficialAccount(author: string | null, uidOrUrl?: string, officialUids?: Set<string>, rawText: string = ''): boolean {
  if (detectOfficialSubway(rawText, author).isOfficial) return true;
  if (!author && !uidOrUrl) return false;
  // 1. UID 匹配
  if (uidOrUrl) {
    const uids = officialUids || loadOfficialUids();
    for (const u of uids) {
      if (uidOrUrl.includes(u)) return true;
    }
    // MediaCrawler 拿不到原始 uid，只给脱敏后的 creator_hash
    if (/^[0-9a-f]{16}$/.test(uidOrUrl) && getWeiboHashMap().has(uidOrUrl)) return true;
  }
  // 2. 账号名称包含典型的地铁/城轨官方特征，且不是个人探店/代购/车迷
  if (author) {
    const name = author.trim();
    if (
      (name.endsWith('地铁') ||
       name.endsWith('地铁运营') ||
       name.endsWith('轨道交通') ||
       name.endsWith('轨道运营') ||
       name.endsWith('铁投') ||
       name.endsWith('有轨电车') ||
       name.includes('京港地铁') ||
       name.includes('港铁深圳') ||
       name.includes('港铁中国')) &&
      !name.includes('车迷') &&
      !name.includes('小助手') &&
      !name.includes('探店')
    ) {
      return true;
    }
  }
  return false;
}

export interface SocialImpact {
  isOfficial: boolean;
  likedCount: number;
  collectedCount: number;
  commentCount: number;
  shareCount: number;
  playCount: number;
  score: number;
}

export function evaluateSocialImpact(
  row: RawItem,
  author: string | null,
  url: string,
  officialUids?: Set<string>
): SocialImpact {
  const isOfficial = isOfficialAccount(author, (row.creator_id as string) || (row.creator_hash as string) || url, officialUids);
  const likes = parseHumanNumber(row.voteup_count ?? row.liked_count);
  const collects = parseHumanNumber(row.collected_count);
  const comments = parseHumanNumber(row.comment_count ?? row.comments_count ?? row.video_comment);
  const shares = parseHumanNumber(row.share_count ?? row.shared_count);
  const plays = parseHumanNumber(row.video_play_count);

  // 综合影响力：点赞*1 + 收藏*2 + 评论*3 + 分享*2 + 播放/100
  const score = likes * 1 + collects * 2 + comments * 3 + shares * 2 + Math.round(plays / 100);

  return {
    isOfficial,
    likedCount: likes,
    collectedCount: collects,
    commentCount: comments,
    shareCount: shares,
    playCount: plays,
    score,
  };
}

let cachedWeiboAccountMap: Map<string, { city: string; name: string; uid: string }> | null = null;

export function getWeiboAccountMap(): Map<string, { city: string; name: string; uid: string }> {
  if (cachedWeiboAccountMap) return cachedWeiboAccountMap;
  cachedWeiboAccountMap = new Map();
  const candidates = [
    path.resolve(process.cwd(), 'docs/subway-weibo-accounts.json'),
    path.resolve(process.cwd(), '../docs/subway-weibo-accounts.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item?.uid) cachedWeiboAccountMap.set(String(item.uid), item);
          }
          break;
        }
      } catch {}
    }
  }
  return cachedWeiboAccountMap;
}

let cachedWeiboHashMap: Map<string, { city: string; name: string; uid: string }> | null = null;

// MediaCrawler 教学版只写脱敏后的 creator_hash（sha256(uid)[:16]），不落原始 user_id。
// accounts.json 里都是机构号，哈希可逆推，用它在入库时还原官博归属。
export function getWeiboHashMap(): Map<string, { city: string; name: string; uid: string }> {
  if (cachedWeiboHashMap) return cachedWeiboHashMap;
  cachedWeiboHashMap = new Map();
  for (const [uid, acc] of getWeiboAccountMap()) {
    cachedWeiboHashMap.set(crypto.createHash('sha256').update(uid).digest('hex').slice(0, 16), acc);
  }
  return cachedWeiboHashMap;
}

export function resolveSourceMeta(item: IngestItem, defaultMeta: { id: string; name: string }): { id: string; name: string } {
  if (defaultMeta.id.includes('wb')) {
    const author = (item.author || '').trim();
    const desc = (item.raw?.desc as string) || '';

    // 1. 阿牛专属信源
    if (author.includes('阿牛') || desc.includes('阿牛') || desc.includes('地铁客流排行榜') || author === '地***牛') {
      return { id: 'mc-wb-aniu', name: '地铁客流及运输研究阿牛（微博）' };
    }

    // 2. 全国地铁公司官方账号独立信源
    const weiboMap = getWeiboAccountMap();
    const rawUid = String(item.raw?.creator_id || item.raw?.uid || '');
    if (rawUid && weiboMap.has(rawUid)) {
      const acc = weiboMap.get(rawUid)!;
      return { id: `mc-wb-${acc.uid}`, name: `${acc.name}（官方微博）` };
    }

    const creatorHash = String(item.raw?.creatorHash || item.raw?.creator_hash || '');
    if (creatorHash) {
      const acc = getWeiboHashMap().get(creatorHash);
      if (acc) return { id: `mc-wb-${acc.uid}`, name: `${acc.name}（官方微博）` };
    }

    for (const [, acc] of weiboMap) {
      if (author === acc.name || (desc.includes(acc.name) && (author.includes(acc.city) || author.endsWith('铁')))) {
        return { id: `mc-wb-${acc.uid}`, name: `${acc.name}（官方微博）` };
      }
    }

    // 城市特征兜底识别（如成都地铁、成都地铁运营）
    if (author.includes('成都地铁运营') || desc.includes('成都地铁运营') || author === '成***营') {
      return { id: 'mc-wb-3170665862', name: '成都地铁运营（官方微博）' };
    }
    if (author.includes('成都地铁') || author === '成***铁' || desc.includes('成都轨道交通')) {
      return { id: 'mc-wb-2384889627', name: '成都地铁（官方微博）' };
    }
    if (author.includes('上海地铁') || author === '上***o') {
      return { id: 'mc-wb-1742987497', name: '上海地铁shmetro（官方微博）' };
    }
    if (author.includes('北京地铁') || author === '北***铁') {
      return { id: 'mc-wb-2778292197', name: '北京地铁（官方微博）' };
    }
    if (author.includes('广州地铁') || author === '广***铁') {
      return { id: 'mc-wb-2612249974', name: '广州地铁（官方微博）' };
    }
    if (author.includes('深圳地铁') || author === '深***铁') {
      return { id: 'mc-wb-2311331195', name: '深圳地铁（官方微博）' };
    }

    const social = item.raw?.socialImpact as SocialImpact | undefined;
    if (social?.isOfficial && author) {
      const safeId = author.replace(/[^一-龥a-zA-Z0-9_-]/g, '').slice(0, 30);
      return { id: `mc-wb-${safeId}`, name: `${author}（官方微博）` };
    }

    // 3. 其余非官方散客微博：统一合并为"微博·地铁城轨"
    return { id: 'mc-wb-metro', name: '微博·地铁城轨' };
  }

  return defaultMeta;
}

const ROUTINE_NOISE_PATTERNS = [
  /文明365/,
  /握紧扶手/,
  /切勿逆行/,
  /晚安/,
  /晚安心语/,
  /早安/,
  /铁铁来互动/,
  /看图猜站点/,
  /猜猜这是哪个站/,
  /灯闪铃响时/,
  /请勿饮食/,
  /治好了谁的强迫症/,
  /失物招领/,
  /寻人启事/,
  /好人好事/,
];

// 重大事实白名单：必须真正属于城市轨道交通系统的关键动作
const ESSENTIAL_FACT_PATTERNS = [
  /站内.*(?:开业|入驻|开街)|商铺.*(?:开业|入驻|签约|招租)|商业街.*(?:开街|开业|改造)|特许经营|经营权出让/,
  /跑图|通车|开通|试运行|贯通|盾构|工可|批复|空载/,
  /以地养铁|亏损|财报|利润|破产|绿色债券/,
  /客运量破|地铁客流排行榜|客流报告|客流日报|历史最高纪录/,
  /LCD|新UI|新屏幕|车厢大屏/,
  /运行有调整|运行图调整|列车时刻表调整/,
];

export function isRoutineNoise(text: string): boolean {
  if (!text) return false;
  // 1. 命中绝对口号类
  if (ROUTINE_NOISE_PATTERNS.some(pat => pat.test(text))) {
    return true;
  }

  // 2. 站外社会商场/普通百货超市探店（蹭地铁词，非站内商业，非地铁主导）
  if (/(?:盒马|生鲜超市|大厦餐饮|商超开业|美食广场)/.test(text) && !/(?:站厅|站台|地下商业街|站内|地铁集团|地铁商业)/.test(text)) {
    return true;
  }

  // 3. 检查是否属于网友日常随手拍碎碎念（报天气、报发车间隔、单站日常候车拍图）
  const isCrowdSnapshot = /(网友[：:]|网友投稿|车迷投稿)/.test(text);
  if (isCrowdSnapshot) {
    // 如果包含重大核心事实，不作为噪音排除
    const isEssential = ESSENTIAL_FACT_PATTERNS.some(pat => pat.test(text));
    if (isEssential) {
      return false;
    }

    // 只要是网友/车迷日常投稿，且包含周几/日期、发车间隔、天气或单站候车站台碎念的，一律过滤
    const isDailyRoutineTick =
      /(周[一二三四五六日天]|星期[一二三四五六日天])/.test(text) ||
      /间隔\s*[0-9]+['分秒]/.test(text) ||
      /多云|转晴|小雨|阴天|晴，|阴。|[0-9]+～[0-9]+度|[0-9]+度/.test(text) ||
      /候车客流|站台客流|站厅客流|往.*方向|图\d|P\d/.test(text);

    if (isDailyRoutineTick) {
      return true;
    }
  }

  return false;
}

export function classifyTextToCategory(title: string, content: string): { category: string; summary: string; reason: string } {
  const text = `${title} ${content}`.toLowerCase();

  // 1. TOD 综合开发
  if (text.includes('以地养铁') || text.includes('tod') || text.includes('上盖物业') || text.includes('港式繁荣') || text.includes('港铁操盘')) {
    return {
      category: 'tod-development',
      summary: title.slice(0, 150),
      reason: '探讨轨道交通站城一体化与以地养铁模式，具备显著的TOD商业与物业开发借鉴价值。',
    };
  }

  // 2. 经营与财报
  if (text.includes('亏损') || text.includes('财报') || text.includes('利润') || text.includes('破产')) {
    return {
      category: 'industry',
      summary: title.slice(0, 150),
      reason: '披露重点城市城轨经营与财务盈亏核心数据，反映行业可持续运营与补贴机制面临的深层挑战。',
    };
  }

  // 3. 车站商业与零售
  if (
    text.includes('商铺') || text.includes('商业街') || text.includes('直达商场') ||
    text.includes('盒马') || text.includes('便利店') || text.includes('市集') ||
    text.includes('集市') || text.includes('餐饮') || text.includes('商业模式')
  ) {
    return {
      category: 'station-retail',
      summary: title.slice(0, 150),
      reason: '实测车站商业街区与便民零售业态，直观反映乘客真实打卡偏好与站内客流变现潜力。',
    };
  }

  // 4. 地铁广告与媒体
  if (text.includes('广告') || text.includes('lcd') || text.includes('新ui') || text.includes('大屏') || text.includes('全包车')) {
    return {
      category: 'metro-advertising',
      summary: title.slice(0, 150),
      reason: '展示车厢屏幕媒体新版式及车站创意营销案例，对城轨传媒经营与场景营销有直接参考意义。',
    };
  }

  // 5. 客流与运力
  if (text.includes('客流') || text.includes('客运量') || text.includes('排行榜') || text.includes('日报')) {
    return {
      category: 'passenger-flow',
      summary: title.slice(0, 150),
      reason: '追踪全国主要线网实时客运强度与客流大盘，是评估车站商业与媒介曝光的核心量化指标。',
    };
  }

  // 6. 规划建设
  if (
    text.includes('跑图') || text.includes('新线') || text.includes('贯通') ||
    text.includes('探线') || text.includes('通车') || text.includes('试运行') ||
    text.includes('施工') || text.includes('规划')
  ) {
    return {
      category: 'planning-construction',
      summary: title.slice(0, 150),
      reason: '记录新线空载试跑与车站工程关键节点，跟踪城市轨道交通线网骨架延展动态。',
    };
  }

  // 7. 运营安全
  return {
    category: 'operations-safety',
    summary: title.slice(0, 150),
    reason: '反映城市轨道交通一线运营调度与客运服务实况。',
  };
}

export function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

export function normalizeItem(
  row: RawItem,
  platform: string,
  keywords: string[],
  minSocialScore: number = 0,
  officialUids?: Set<string>,
  comments?: CommentItem[],
  alignRecent: boolean = false
): IngestItem | null {
  const rawTitle = (row.title || '').trim();
  const desc = (row.desc || row.content_text || row.content || '').trim();
  const combinedText = `${rawTitle} ${desc} ${row.source_keyword || ''}`;

  // 严格过滤日常安全宣传口号、寻物问候等零商业/行业价值的噪音
  if (isRoutineNoise(combinedText)) {
    return null;
  }

  const title = rawTitle || desc.slice(0, 60).replace(/\r?\n/g, ' ') || '地铁城轨资讯';

  // 必须与地铁城轨关键词相关
  if (!matchesKeywords(combinedText, keywords)) {
    return null;
  }

  // 链接归一化
  let url = (row.video_url || row.content_url || row.note_url || row.share_url || (row.aweme_url as string) || '').trim();
  const noteId = row.video_id || row.content_id || row.note_id || row.id || (row.aweme_id as string);
  if (!url && noteId) {
    if (platform === 'xhs' || platform === 'xiaohongshu') url = `https://www.xiaohongshu.com/explore/${noteId}`;
    else if (platform === 'zhihu') url = `https://www.zhihu.com/question/${noteId}`;
    else if (platform === 'dy' || platform === 'douyin') url = `https://www.douyin.com/video/${noteId}`;
    else if (platform === 'wb' || platform === 'weibo') url = `https://weibo.com/detail/${noteId}`;
    else if (platform === 'bili' || platform === 'bilibili') url = `https://www.bilibili.com/video/${noteId}`;
    else if (platform === 'ks' || platform === 'kuaishou') url = `https://www.kuaishou.com/short-video/${noteId}`;
    else url = `https://${platform}.com/item/${noteId}`;
  }
  if (!url) return null;

  // 时间归一化
  let timestampMs = Date.now();
  let originalPublishedAt: string | null = null;
  const rawTs = row.time || row.create_time || row.created_time || row.create_date_time;
  if (typeof rawTs === 'number' && rawTs > 0) {
    const rawMs = rawTs > 1e11 ? rawTs : rawTs * 1000;
    originalPublishedAt = new Date(rawMs).toISOString();
    timestampMs = alignRecent && (Date.now() - rawMs > 3 * 86400 * 1000) ? Date.now() : rawMs;
  } else if (typeof rawTs === 'string' && rawTs.trim()) {
    const parsed = Date.parse(rawTs);
    if (!Number.isNaN(parsed)) {
      originalPublishedAt = new Date(parsed).toISOString();
      timestampMs = alignRecent && (Date.now() - parsed > 3 * 86400 * 1000) ? Date.now() : parsed;
    }
  }
  const publishedAt = new Date(timestampMs).toISOString();

  const author = (row.user_nickname || row.nickname || row.author || '').trim() || null;
  const likedCount = row.voteup_count ?? row.liked_count ?? null;
  const commentCount = row.comment_count ?? row.comments_count ?? row.video_comment ?? null;
  const shareCount = row.share_count ?? row.shared_count ?? null;

  // 账号属性与社会影响力综合评判（官方账号除外）
  const impact = evaluateSocialImpact(row, author, url, officialUids);

  // 自动分类与分析（推入即已分类，完全自动化）
  const classified = classifyTextToCategory(title, combinedText);

  // 若设置了最低影响力门槛，非官方自媒体必须满足门槛
  if (minSocialScore > 0 && !impact.isOfficial) {
    if (impact.score < minSocialScore) {
      return null; // 过滤无社会影响力的孤立自媒体琐碎内容
    }
  }

  // 为材料注入客观元数据标头
  let impactHeader = '';
  if (impact.isOfficial) {
    impactHeader = `【账号属性】官方账号\n\n`;
  } else {
    impactHeader = `【互动数据】点赞 ${likedCount ?? impact.likedCount} · 评论 ${commentCount ?? impact.commentCount} · 收藏 ${row.collected_count ?? impact.collectedCount} · 转发 ${shareCount ?? impact.shareCount}\n\n`;
  }

  // 格式化评论总结文本
  let commentSummaryText = '';
  if (comments && comments.length > 0) {
    commentSummaryText = `\n\n【热门讨论】\n` +
      comments.slice(0, 5).map((c, i) => `${i + 1}. ${c.author ? `@${c.author}` : '网友'}${c.likeCount ? `（赞 ${c.likeCount}）` : ''}：${c.content}`).join('\n');
  }

  const enrichedDesc = desc ? `${impactHeader}${desc}${commentSummaryText}` : `${impactHeader}${commentSummaryText}`.trim();
  const cover = (row.video_cover_url || row.cover_url) as string | undefined;
  const bodyHtml = buildBodyHtml(title, desc || enrichedDesc, row.image_list, cover, comments);

  return {
    title,
    url,
    publishedAt,
    author,
    bodyText: enrichedDesc,
    bodyHtml,
    excerpt: desc ? desc.slice(0, 300) : enrichedDesc.slice(0, 300),
    raw: {
      platform,
      desc: enrichedDesc.slice(0, 1500),
      bodyHtml,
      category: classified.category,
      summary: classified.summary,
      reason: classified.reason,
      likedCount,
      collectedCount: row.collected_count ?? null,
      commentCount,
      shareCount,
      sourceKeyword: row.source_keyword || null,
      creatorHash: (row.creator_hash as string) || null,
      videoUrl: row.video_download_url || row.video_url || null,
      videoCoverUrl: row.video_cover_url || row.cover_url || null,
      videoPlayCount: row.video_play_count || null,
      videoDanmaku: row.video_danmaku || null,
      socialImpact: impact,
      originalPublishedAt,
      comments: comments && comments.length > 0 ? comments.slice(0, 15) : undefined,
    },
  };
}

export interface CommentItem {
  id?: string;
  content: string;
  author?: string;
  likeCount?: number | string;
  publishTime?: string | number;
}

export function buildBodyHtml(
  title: string,
  desc: string,
  imageList?: unknown,
  videoCover?: unknown,
  comments?: CommentItem[]
): string {
  const paragraphs: string[] = [];

  // 1. 正文段落
  if (desc && desc.trim()) {
    const lines = desc.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    for (const l of lines) {
      paragraphs.push(`<p>${l}</p>`);
    }
  } else if (title) {
    paragraphs.push(`<p>${title}</p>`);
  }

  // 2. 提取配图
  const images: string[] = [];
  if (Array.isArray(imageList)) {
    images.push(...imageList.filter((x): x is string => typeof x === 'string' && !!x.trim()));
  } else if (typeof imageList === 'string' && imageList.trim()) {
    images.push(...imageList.split(',').map(u => u.trim()).filter(Boolean));
  }
  if (typeof videoCover === 'string' && videoCover.trim() && !images.includes(videoCover.trim())) {
    images.unshift(videoCover.trim());
  }

  for (let idx = 0; idx < images.length; idx++) {
    const imgUrl = images[idx]!;
    paragraphs.push(`<p><img src="${imgUrl}" alt="${title} 配图 ${idx + 1}" /></p>`);
  }

  // 3. 热门讨论
  if (comments && comments.length > 0) {
    paragraphs.push('<hr />');
    paragraphs.push('<h3>热门讨论</h3>');
    for (const c of comments.slice(0, 8)) {
      const authorText = c.author ? `<strong>@${c.author}</strong>` : '<strong>网友</strong>';
      const likeText = c.likeCount ? `（赞 ${c.likeCount}）` : '';
      paragraphs.push(`<blockquote><p>${authorText}${likeText}：${c.content}</p></blockquote>`);
    }
  }

  return paragraphs.join('\n');
}

export function findJsonlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function loadCommentsIndex(platformDir: string): Promise<Map<string, CommentItem[]>> {
  const map = new Map<string, CommentItem[]>();
  const commentFiles = findJsonlFiles(platformDir).filter(f => f.includes('comment'));
  for (const file of commentFiles) {
    const rl = readline.createInterface({
      input: fs.createReadStream(file, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const item = JSON.parse(trimmed) as Record<string, unknown>;
        const noteId = String(item.aweme_id || item.note_id || item.video_id || item.weibo_id || item.content_id || item.id || '');
        const content = typeof item.content === 'string' ? item.content : (typeof item.content_text === 'string' ? item.content_text : (typeof item.text === 'string' ? item.text : ''));
        if (!noteId || !content || !content.trim()) continue;
        const author = typeof item.nickname === 'string' ? item.nickname : (typeof item.user_nickname === 'string' ? item.user_nickname : (typeof item.author === 'string' ? item.author : undefined));
        const rawLikes = item.liked_count ?? item.like_count ?? item.digg_count ?? item.voteup_count ?? 0;
        const likeCount = parseHumanNumber(rawLikes as string | number);
        if (!map.has(noteId)) {
          map.set(noteId, []);
        }
        map.get(noteId)!.push({
          content: content.trim(),
          author,
          likeCount: likeCount > 0 ? likeCount : undefined,
        });
      } catch {}
    }
  }

  for (const [, list] of map.entries()) {
    list.sort((a, b) => (Number(b.likeCount) || 0) - (Number(a.likeCount) || 0));
  }
  return map;
}

export async function parseJsonlFile(
  filePath: string,
  platform: string,
  keywords: string[],
  minSocialScore: number = 0,
  officialUids?: Set<string>,
  commentsMap?: Map<string, CommentItem[]>
): Promise<IngestItem[]> {
  if (!fs.existsSync(filePath) || path.basename(filePath).includes('comment')) return [];

  const items: IngestItem[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as RawItem;
      const noteId = String(parsed.video_id || parsed.content_id || parsed.note_id || parsed.id || parsed.aweme_id || '');
      const comments = commentsMap?.get(noteId);
      const normalized = normalizeItem(parsed, platform, keywords, minSocialScore, officialUids, comments);
      if (normalized) {
        items.push(normalized);
      }
    } catch {
      // 忽略损坏的单行
    }
  }

  return items;
}

export async function syncMediaCrawler(opts: SyncOptions): Promise<{ totalPushed: number; totalScanned: number }> {
  const {
    dataDir,
    apiBase,
    ingestToken,
    dryRun = false,
    force = false,
    platform: targetPlatform,
    keywords = DEFAULT_KEYWORDS,
    stateFile = path.resolve(process.cwd(), '.data/mediacrawler-synced.json'),
    minSocialScore = 0,
  } = opts;

  if (!fs.existsSync(dataDir)) {
    console.warn(`[MediaCrawler Ingest] 数据目录不存在: ${dataDir}`);
    return { totalPushed: 0, totalScanned: 0 };
  }

  const officialUids = loadOfficialUids();

  // 读取已同步状态
  let syncedUrls = new Set<string>();
  if (!force && fs.existsSync(stateFile)) {
    try {
      const stateContent = fs.readFileSync(stateFile, 'utf-8');
      const loaded = JSON.parse(stateContent);
      if (Array.isArray(loaded)) syncedUrls = new Set(loaded);
    } catch {
      syncedUrls = new Set();
    }
  }

  const platforms = targetPlatform ? [targetPlatform] : Object.keys(PLATFORM_MAP);
  let totalScanned = 0;
  let totalPushed = 0;

  for (const plat of platforms) {
    const platDir = path.join(dataDir, plat);
    if (!fs.existsSync(platDir)) continue;

    const sourceMeta = PLATFORM_MAP[plat] || { id: `mc-${plat}-metro`, name: `${plat}·地铁城轨` };
    const commentsMap = await loadCommentsIndex(platDir);
    if (commentsMap.size > 0) {
      console.log(`[MediaCrawler Ingest] ${sourceMeta.name}: 已加载 ${commentsMap.size} 条主贴关联的评论数据`);
    }

    const files = findJsonlFiles(platDir).filter(f => !f.includes('comment'));
    const candidateItems: IngestItem[] = [];

    for (const filePath of files) {
      const items = await parseJsonlFile(filePath, plat, keywords, minSocialScore, officialUids, commentsMap);
      totalScanned += items.length;
      for (const it of items) {
        if (!force && syncedUrls.has(it.url)) continue;
        candidateItems.push(it);
      }
    }

    if (candidateItems.length === 0) {
      console.log(`[MediaCrawler Ingest] ${sourceMeta.name}: 无待同步的新增条目`);
      continue;
    }

    // 按目标独立信源分组（如 成都地铁（官方微博）、微博·地铁城轨 等）
    const grouped = new Map<string, { meta: { id: string; name: string }; items: IngestItem[] }>();
    for (const it of candidateItems) {
      const targetMeta = resolveSourceMeta(it, sourceMeta);
      if (!grouped.has(targetMeta.id)) {
        grouped.set(targetMeta.id, { meta: targetMeta, items: [] });
      }
      grouped.get(targetMeta.id)!.items.push(it);
    }

    for (const [, group] of grouped) {
      const currentMeta = group.meta;
      const groupItems = group.items;
      console.log(`[MediaCrawler Ingest] ${currentMeta.name}: 待推入 ${groupItems.length} 条`);

      // 分批推送（每次最多 50 条）
      for (let i = 0; i < groupItems.length; i += 50) {
        const chunk = groupItems.slice(i, i + 50);

        if (dryRun) {
          console.log(`[DRY-RUN] 将推入 ${chunk.length} 条至 ${currentMeta.id} (${currentMeta.name}):`);
          for (const item of chunk.slice(0, 3)) {
            console.log(`  - [${item.publishedAt}] ${item.title} (${item.url})`);
          }
          totalPushed += chunk.length;
          continue;
        }

        try {
          const resp = await fetch(`${apiBase}/api/ingest/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${ingestToken}`,
            },
            body: JSON.stringify({
              sourceId: currentMeta.id,
              sourceName: currentMeta.name,
              items: chunk,
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            console.error(`[MediaCrawler Ingest] ${currentMeta.name} 推送失败 (HTTP ${resp.status}): ${errText}`);
            continue;
          }

          const resData = (await resp.json()) as { ok: boolean; created: number };
          totalPushed += resData.created;
          console.log(`[MediaCrawler Ingest] ${currentMeta.name} 成功推入批次 ${chunk.length} 条 (新增 ${resData.created} 条)`);

          // 记账
          for (const c of chunk) syncedUrls.add(c.url);
        } catch (err) {
          console.error(`[MediaCrawler Ingest] ${currentMeta.name} 网络或接口异常:`, err);
        }
      }
    }
  }

  // 保存记账状态
  if (!dryRun && syncedUrls.size > 0) {
    try {
      const stateDir = path.dirname(stateFile);
      if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(stateFile, JSON.stringify(Array.from(syncedUrls), null, 2), 'utf-8');
    } catch (e) {
      console.warn(`[MediaCrawler Ingest] 保存记账状态文件失败:`, e);
    }
  }

  // 自动将本次推入的所有条目同步更新 publications 的分类、摘要与理由（推入即分类，零人工）
  if (!dryRun) {
    try {
      const { sql } = await import('../packages/backend/src/db.ts');
      await sql`
        UPDATE publications p
        SET
          category = a.raw->>'category',
          summary = CASE WHEN p.summary IS NULL OR p.summary = '' THEN a.raw->>'summary' ELSE p.summary END,
          reason = CASE WHEN p.selected THEN coalesce(p.reason, a.raw->>'reason') ELSE p.reason END,
          updated_at = now()
        FROM articles a
        WHERE a.id = p.article_id
          AND a.source_id LIKE 'mc-%'
          AND a.raw->>'category' IS NOT NULL
          AND (p.category IS NULL OR p.category <> a.raw->>'category');
      `;
    } catch {
      // 外部客户端环境下若无直连 DB，静默跳过
    }
  }

  console.log(`[MediaCrawler Ingest] 任务完成: 扫描 ${totalScanned} 条，推入新增 ${totalPushed} 条`);
  return { totalPushed, totalScanned };
}

// CLI 执行入口
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const args = process.argv.slice(2);
  const getArg = (prefix: string) => {
    const match = args.find(a => a.startsWith(prefix));
    return match ? match.slice(prefix.length) : undefined;
  };

  const dataDir = getArg('--data-dir=') || process.env.MEDIACRAWLER_DATA_DIR || path.resolve(process.cwd(), '../MediaCrawler/data');
  const apiBase = getArg('--api-base=') || process.env.API_BASE_URL || 'http://localhost:3001';
  const ingestToken = getArg('--token=') || process.env.INGEST_TOKEN || '';
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const platform = getArg('--platform=');
  const minSocialScoreStr = getArg('--min-social-score=');
  const minSocialScore = minSocialScoreStr ? parseInt(minSocialScoreStr, 10) : 0;

  if (!dryRun && !ingestToken) {
    console.error('错误: 请通过环境变量 INGEST_TOKEN 或 --token= 参数提供推送密钥');
    process.exit(1);
  }

  await syncMediaCrawler({
    dataDir,
    apiBase,
    ingestToken,
    dryRun,
    force,
    platform,
    minSocialScore,
  });
}
