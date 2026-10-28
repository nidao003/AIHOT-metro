import { sql } from '../packages/backend/src/db.ts';

interface ItemToClassify {
  article_id: string;
  source_id: string;
  title: string;
  body_text: string | null;
  desc: string | null;
  liked_count: string | number | null;
  selected: boolean;
}

export function classifyItem(title: string, content: string): { category: string; summary: string; reason?: string } {
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

export async function runClassification(): Promise<{ updated: number }> {
  const rows = await sql<ItemToClassify[]>`
    SELECT
      p.article_id,
      p.source_id,
      p.title,
      a.body_text,
      a.excerpt AS desc,
      a.raw->>'likedCount' AS liked_count,
      p.selected
    FROM publications p
    JOIN articles a ON a.id = p.article_id
    WHERE p.source_id LIKE 'mc-%';
  `;

  let updated = 0;
  for (const r of rows) {
    const text = `${r.title} ${r.body_text || r.desc || ''}`;
    const result = classifyItem(r.title, text);

    await sql`
      UPDATE publications
      SET
        category = ${result.category},
        summary = CASE WHEN summary IS NULL OR summary = '' THEN ${result.summary} ELSE summary END,
        reason = CASE WHEN selected THEN coalesce(reason, ${result.reason || null}) ELSE reason END,
        updated_at = now()
      WHERE article_id = ${r.article_id};
    `;
    updated += 1;
  }

  return { updated };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const res = await runClassification();
  console.log(`Classified and enriched ${res.updated} items.`);
  process.exit(0);
}
