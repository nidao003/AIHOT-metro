/**
 * 招标/招商数据质量专项清理与维护脚本
 *
 * 识别并清理历史抓取入库的非地铁相关招标采购垃圾数据。
 *
 * 用法：
 *   node scripts/cleanup-irrelevant-bids.ts               # 仅审计与分析（默认 dry-run）
 *   node scripts/cleanup-irrelevant-bids.ts --apply       # 执行下架（设为 withdrawn，不在前台/API展示）
 *   node scripts/cleanup-irrelevant-bids.ts --purge       # 执行彻底物理删除（CASCADE 清除 articles 及其派生数据）
 */

import { sql } from '../packages/backend/src/db.ts';

const METRO_KEYWORDS = [
  '地铁', '轻轨', '轨道交通', '城轨', '市域铁路', '市域快线', '有轨电车', '磁浮', '磁悬浮', '单轨',
  '车站', '站台', '站厅', '地下通道', '换乘通道', '车厢', '列车', '车辆段', '停车场', '控制中心',
  '屏蔽门', '站台门', '接触网', '受电弓', '走形轨', '轨枕', '道岔', '转向架', '牵引供电',
  '信号系统', 'CBTC', '通信系统', 'PIS', '综合监控', 'BAS', 'FAS', '自动售检票', 'AFC',
  'TOD', '站城一体', '地下商业',
  '申通', '深铁', '穗铁', '京港', '港铁', '杭铁', '成都轨道', '广州地铁', '深圳地铁',
  '北京地铁', '上海地铁', '武汉地铁', '南京地铁', '重庆轨道', '天津轨道', '西安地铁',
  '青岛地铁', '长沙地铁', '郑州地铁', '苏州轨道', '合肥轨道', '宁波轨道', '无锡地铁',
  '南宁轨道', '南昌轨道', '福州地铁', '厦门轨道', '长春轨道', '大连地铁', '沈阳地铁',
  '石家庄轨道', '贵阳地铁', '昆明轨道', '乌鲁木齐轨道', '兰州轨道', '洛阳轨道', '徐州地铁',
  '常州地铁', '南通轨道', '绍兴轨道', '温州轨道', '东莞轨道', '佛山地铁'
];

function isMetroRelated(title: string, excerpt: string = '', bodyText: string = ''): boolean {
  const hay = `${title}\n${excerpt}\n${bodyText}`.toLowerCase();
  return METRO_KEYWORDS.some(k => hay.includes(k.toLowerCase()));
}

async function main() {
  const args = process.argv.slice(2);
  const applyWithdraw = args.includes('--apply');
  const applyPurge = args.includes('--purge');
  const dryRun = !applyWithdraw && !applyPurge;

  console.log('======================================================');
  console.log('       城轨招标采购数据质量审计与清理工具');
  console.log('======================================================');
  console.log(`运行模式: ${applyPurge ? '【物理清理 (PURGE)】' : applyWithdraw ? '【安全下架 (WITHDRAW)】' : '【仅预览 (DRY RUN)】'}\n`);

  // 1. 重点扫描泛行业招标源（如广告招标网）以及标题明显偏离的招标条目
  const rows = await sql<{
    id: string;
    source_id: string;
    title: string;
    excerpt: string | null;
    body_text: string | null;
    published_at: Date | null;
    score: number | null;
    visibility: string | null;
  }[]>`
    SELECT a.id, a.source_id, a.title, a.excerpt, a.body_text, a.published_at,
           p.score, coalesce(p.visibility, 'public') as visibility
    FROM articles a
    LEFT JOIN publications p ON p.article_id = a.id
    WHERE a.source_id = 'web-ad-guanggaozhaobiao'
       OR a.source_id = 'web-365trade-metro'
    ORDER BY a.published_at DESC NULLS LAST;
  `;

  console.log(`扫描到目标待核验招标源条目共: ${rows.length} 篇`);

  const junkArticles: typeof rows = [];
  const keepArticles: typeof rows = [];

  for (const row of rows) {
    if (isMetroRelated(row.title, row.excerpt ?? '', row.body_text ?? '')) {
      keepArticles.push(row);
    } else {
      junkArticles.push(row);
    }
  }

  console.log(`\n核验结果：`);
  console.log(`- 确认城轨相关保留: ${keepArticles.length} 篇`);
  console.log(`- 确认非城轨垃圾条目: ${junkArticles.length} 篇\n`);

  if (junkArticles.length > 0) {
    console.log('部分将被清理的典型垃圾条目样例:');
    junkArticles.slice(0, 15).forEach((j, i) => {
      console.log(`  ${i + 1}. [${j.source_id}] (评分:${j.score ?? '无'}) ${j.title}`);
    });
    if (junkArticles.length > 15) {
      console.log(`  ... 以及其余 ${junkArticles.length - 15} 篇`);
    }
  }

  if (dryRun) {
    console.log('\n[DRY RUN 提示] 未执行任何写入。若需正式清理，请使用：');
    console.log('  --apply   将这些条目设为 withdrawn 下架（推荐，对前台和API立即隐藏）');
    console.log('  --purge   彻底从数据库中删除这些条目及级联数据');
    await sql.end();
    return;
  }

  const ids = junkArticles.map(j => j.id);

  if (applyPurge) {
    console.log(`\n正在物理删除 ${ids.length} 篇无关垃圾文章...`);
    // 每次处理 100 个
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      await sql`DELETE FROM articles WHERE id = ANY(${chunk}::text[])`;
    }
    console.log(`✅ 成功物理删除 ${ids.length} 篇垃圾文章及所有级联记录！`);
  } else if (applyWithdraw) {
    console.log(`\n正在下架 ${ids.length} 篇无关垃圾文章...`);
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      await sql`
        UPDATE publications
        SET visibility = 'withdrawn',
            eligible = false,
            selected = false
        WHERE article_id = ANY(${chunk}::text[])
      `;
      await sql`
        INSERT INTO editorial_overrides (article_id, visibility, reason, version, updated_by)
        SELECT id, 'withdrawn', '非地铁相关常规广告/招标清理', 1, 'system:quality-cleanup'
        FROM unnest(${chunk}::text[]) AS id
        ON CONFLICT (article_id) DO UPDATE
        SET visibility = 'withdrawn',
            reason = EXCLUDED.reason,
            updated_at = now()
      `;
    }
    console.log(`✅ 成功下架 ${ids.length} 篇垃圾文章（设为 withdrawn，不再对外展示）！`);
  }

  await sql.end();
  console.log('\n清理操作完成！');
}

main().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
