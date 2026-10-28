import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  matchesKeywords,
  normalizeItem,
  parseJsonlFile,
  parseHumanNumber,
  isOfficialAccount,
  evaluateSocialImpact,
  isRoutineNoise,
  type SocialImpact,
} from '../scripts/ingest-mediacrawler.ts';

const TEST_KEYWORDS = ['地铁', '城轨', '地铁车站', '地铁广告', '地铁商铺'];

test('parseHumanNumber handles both numeric and formatted strings', () => {
  assert.equal(parseHumanNumber(120), 120);
  assert.equal(parseHumanNumber('1.6万'), 16000);
  assert.equal(parseHumanNumber('2.5w'), 25000);
  assert.equal(parseHumanNumber('3,456'), 3456);
  assert.equal(parseHumanNumber(null), 0);
});

test('isOfficialAccount identifies official subway operators', () => {
  const officialUids = new Set(['1889814407', '2612249974']);
  assert.equal(isOfficialAccount('成都地铁', '1889814407', officialUids), true);
  assert.equal(isOfficialAccount('广州地铁运营', undefined, officialUids), true);
  assert.equal(isOfficialAccount('港铁深圳', undefined, officialUids), true);
  assert.equal(isOfficialAccount('广州车迷俱乐部', undefined, officialUids), false);
  assert.equal(isOfficialAccount('路人小李', '9999999999', officialUids), false);
});

test('normalizeItem exempts official accounts from social score threshold', () => {
  const officialItem = {
    note_id: 'wb_off_1',
    title: '地铁4号线首班车时刻表微调通知',
    desc: '接上级调度安排，自下周一起首班车提早5分钟。',
    time: 1729833600,
    nickname: '成都地铁运营',
    liked_count: 0,
    comment_count: 0,
  };

  const officialUids = new Set(['3170665862']);
  // 即使 minSocialScore 要求 50 分，官方账号仍顺利通过收录
  const normalized = normalizeItem(officialItem, 'wb', TEST_KEYWORDS, 50, officialUids);
  assert.ok(normalized);
  assert.equal((normalized.raw.socialImpact as SocialImpact).isOfficial, true);
  assert.match(normalized.raw.desc as string, /【账号属性】官方账号/);
});

test('normalizeItem filters low-engagement UGC posts when minSocialScore is set', () => {
  const lowEngageItem = {
    note_id: 'xhs_low_1',
    title: '今天坐地铁好挤啊',
    desc: '地铁车站人山人海，随手一拍。',
    time: 1729833600,
    nickname: '路人甲',
    liked_count: 1, // 仅1赞
    comment_count: 0,
  };

  // 门槛要求 20 分
  const rejected = normalizeItem(lowEngageItem, 'xhs', TEST_KEYWORDS, 20);
  assert.equal(rejected, null);

  // 高赞笔记顺利通过并打上互动数据标头
  const highEngageItem = { ...lowEngageItem, liked_count: '1.2万', comment_count: 300 };
  const accepted = normalizeItem(highEngageItem, 'xhs', TEST_KEYWORDS, 20);
  assert.ok(accepted);
  assert.equal((accepted.raw.socialImpact as SocialImpact).isOfficial, false);
  assert.match(accepted.raw.desc as string, /【互动数据】点赞 1.2万/);
});

test('isRoutineNoise correctly identifies and filters routine daily subway snapshots', () => {
  // 1. 用户截图中的日常随手拍报时流水账，以及站外社会商场普通超市探店（如盒马开业）均应被过滤
  assert.equal(isRoutineNoise('#南昌地铁# 网友：2026年10月25日（周日，多云转晴，21～28度），14时30分南昌地铁4号线白马山方向，起凤路'), true);
  assert.equal(isRoutineNoise('#南京地铁# 网友：2026-10-25（周日）南京地铁6号线，栖霞山方向，间隔6分钟图1，18:59，南京南站候车客流'), true);
  assert.equal(isRoutineNoise('#厦门地铁# 网友：2026.10.25 （星期天，厦门：阴）。图1 15:51 厦门地铁1号线（6B，间隔6′，往'), true);
  assert.equal(isRoutineNoise('#深圳地铁# 网友：2026.10.25（周日，晴），晚上21:20左右，深圳地铁12号线灵芝站往松岗方向站台及灵芝-上'), true);
  assert.equal(isRoutineNoise('#成都地铁文明365#搭乘扶梯时，请握紧扶手，切勿逆行哦！'), true);
  assert.equal(isRoutineNoise('#厦门地铁#网友投稿，2026-10-25（周日）17:54，厦门新开业的中华城盒马生鲜超市，也是厦门首家盒马（P1-P'), true);

  // 2. 具备实质行业价值的真实车站内商业/新线/硬件事实必须保留
  assert.equal(isRoutineNoise('广州地铁人民公园站内商铺正式开业，多家品牌入驻地下商业街'), false);
  assert.equal(isRoutineNoise('#福州地铁#网友：2026.10.25 福州，P1-P3：福州地铁2号线0206号车，正在试验的28寸LCD 新UI设计'), false);
  assert.equal(isRoutineNoise('【中国城市#地铁客流排行榜# 2026-10-24（周六）】广州1005.1万'), false);
});

test('matchesKeywords matches subway related keywords', () => {
  assert.equal(matchesKeywords('北京地铁1号线新开商铺', TEST_KEYWORDS), true);
  assert.equal(matchesKeywords('城轨交通广告招标发布', TEST_KEYWORDS), true);
  assert.equal(matchesKeywords('今日天气晴朗无云', TEST_KEYWORDS), false);
  assert.equal(matchesKeywords('', TEST_KEYWORDS), false);
});

test('normalizeItem extracts and formats xhs item correctly', () => {
  const xhsItem = {
    note_id: '671abc123',
    title: '地铁车站内的宝藏商铺打卡！',
    desc: '今天在地铁人民广场站发现了一家超好喝的咖啡店！',
    time: 1729833600, // 2024-10-25 08:00:00 UTC
    nickname: '地铁探店达人',
    liked_count: '1.2万',
    comment_count: 320,
  };

  const normalized = normalizeItem(xhsItem, 'xhs', TEST_KEYWORDS);
  assert.ok(normalized);
  assert.equal(normalized.title, '地铁车站内的宝藏商铺打卡！');
  assert.equal(normalized.url, 'https://www.xiaohongshu.com/explore/671abc123');
  assert.equal(normalized.author, '地铁探店达人');
  assert.equal(normalized.publishedAt, new Date(1729833600 * 1000).toISOString());
  assert.equal(normalized.raw.platform, 'xhs');
  assert.equal(normalized.raw.likedCount, '1.2万');
  assert.equal(normalized.raw.commentCount, 320);
});

test('normalizeItem extracts and formats zhihu item correctly', () => {
  const zhihuItem = {
    content_id: '99887766',
    title: '如何评价某城市地铁TOD上盖物业的商业规划？',
    content_text: '从轨道交通换乘枢纽的人流导向来看，本次地铁车站的站城一体化设计非常先进...',
    created_time: '2024-10-25T12:00:00Z',
    user_nickname: '城轨规划师老张',
    voteup_count: 580,
    comment_count: 96,
    content_url: 'https://www.zhihu.com/question/12345/answer/99887766',
  };

  const normalized = normalizeItem(zhihuItem, 'zhihu', TEST_KEYWORDS);
  assert.ok(normalized);
  assert.equal(normalized.title, '如何评价某城市地铁TOD上盖物业的商业规划？');
  assert.equal(normalized.url, 'https://www.zhihu.com/question/12345/answer/99887766');
  assert.equal(normalized.author, '城轨规划师老张');
  assert.equal(normalized.publishedAt, '2024-10-25T12:00:00.000Z');
  assert.equal(normalized.raw.platform, 'zhihu');
  assert.equal(normalized.raw.likedCount, 580);
  assert.equal(normalized.raw.commentCount, 96);
});

test('normalizeItem extracts and formats bilibili video item correctly', () => {
  const biliItem = {
    video_id: 'BV1xx411c7mD',
    title: '【地铁新线】全国首条全自动运行城轨快线开通试乘！',
    desc: '今天带大家沉浸式体验新线地铁车站的内部换乘与商业街区...',
    create_time: 1729833600,
    nickname: '铁道迷小刘',
    liked_count: 8900,
    video_comment: 450,
    video_play_count: '15.6万',
    video_danmaku: '1200',
    video_cover_url: 'https://i0.hdslb.com/bfs/archive/cover.jpg',
  };

  const normalized = normalizeItem(biliItem, 'bili', TEST_KEYWORDS);
  assert.ok(normalized);
  assert.equal(normalized.title, '【地铁新线】全国首条全自动运行城轨快线开通试乘！');
  assert.equal(normalized.url, 'https://www.bilibili.com/video/BV1xx411c7mD');
  assert.equal(normalized.author, '铁道迷小刘');
  assert.equal(normalized.raw.platform, 'bili');
  assert.equal(normalized.raw.likedCount, 8900);
  assert.equal(normalized.raw.commentCount, 450);
  assert.equal(normalized.raw.videoPlayCount, '15.6万');
  assert.equal(normalized.raw.videoDanmaku, '1200');
});

test('normalizeItem rejects items without subway keywords', () => {
  const irrelevantItem = {
    note_id: '888xyz',
    title: '周末去爬山看日落',
    desc: '风景太美了，推荐大家去体验！',
    time: 1729833600,
  };

  const normalized = normalizeItem(irrelevantItem, 'xhs', TEST_KEYWORDS);
  assert.equal(normalized, null);
});

test('normalizeItem falls back to desc if title is empty', () => {
  const noTitleItem = {
    id: 'douyin_123',
    desc: '广州地铁三号线最新早高峰实况播报！',
    time: 1729833600000, // ms
    nickname: '羊城拍客',
  };

  const normalized = normalizeItem(noTitleItem, 'dy', TEST_KEYWORDS);
  assert.ok(normalized);
  assert.equal(normalized.title, '广州地铁三号线最新早高峰实况播报！');
  assert.equal(normalized.url, 'https://www.douyin.com/video/douyin_123');
});

test('parseJsonlFile parses valid jsonl and ignores malformed lines', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mediacrawler-test-'));
  const filePath = path.join(tmpDir, 'test_search.jsonl');

  const lines = [
    JSON.stringify({ note_id: '1', title: '地铁车站新风系统升级', time: 1729833600 }),
    'this is a malformed json line',
    '',
    JSON.stringify({ note_id: '2', title: '无关美食推荐', time: 1729833600 }),
    JSON.stringify({ note_id: '3', title: '城轨商业新格局发布会', time: 1729833600 }),
  ];
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

  try {
    const items = await parseJsonlFile(filePath, 'xhs', TEST_KEYWORDS);
    assert.equal(items.length, 2);
    assert.equal(items[0]!.title, '地铁车站新风系统升级');
    assert.equal(items[1]!.title, '城轨商业新格局发布会');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('normalizeItem associates comments and formats public feedback section in bodyHtml', () => {
  const itemWithComments = {
    note_id: 'test_cmt_100',
    title: '地铁站内新开便利店体验',
    desc: '早高峰进站买了一杯热咖啡，速度很快。',
    time: 1729833600,
    nickname: '通勤族小张',
    liked_count: 50,
  };

  const mockComments = [
    { content: '不用出闸机就能买到早餐，太方便了！', author: '乘客小李', likeCount: 320 },
    { content: '价格很公道，跟站外便利店一样。', author: '市民老王', likeCount: 150 },
    { content: '希望能支持微信提前点单自提。', author: '打工人小赵', likeCount: 88 },
  ];

  const normalized = normalizeItem(itemWithComments, 'xhs', TEST_KEYWORDS, 0, undefined, mockComments);
  assert.ok(normalized);
  assert.match(normalized.bodyHtml as string, /热门讨论/);
  assert.match(normalized.bodyHtml as string, /@乘客小李/);
  assert.match(normalized.bodyHtml as string, /赞 320/);
  assert.match(normalized.bodyText as string, /【热门讨论】/);
  assert.equal(Array.isArray(normalized.raw.comments), true);
  assert.equal((normalized.raw.comments as any[]).length, 3);
});
