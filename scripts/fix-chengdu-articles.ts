import { sql } from '../packages/backend/src/db.ts';
import { extractFromUrl } from '../packages/backend/src/content/extract.ts';

async function main() {
  console.log('=== 专门修复成都地铁公众号正文残缺文章 ===');

  const articles = await sql<any[]>`
    SELECT id, title, url, source_id, length(coalesce(body_text, '')) as len
    FROM articles
    WHERE source_id LIKE 'rss-mp-成都%'
      AND length(coalesce(body_text, '')) < 120
    ORDER BY published_at DESC NULLS LAST;
  `;

  console.log(`找到 ${articles.length} 篇成都地铁相关文章需要补齐正文`);

  for (const item of articles) {
    // 微信 URL 修正：把 ~ 换回 _
    const cleanUrl = item.url.replace(/~/g, '_');
    console.log(`\n正在抓取 [${item.title}] (ID: ${item.id})...`);
    console.log(`  URL: ${cleanUrl}`);

    try {
      const extracted = await extractFromUrl(cleanUrl, item.title);
      if (!extracted || !extracted.text || extracted.text.length < 50) {
        console.warn(`  ⚠️ 提取正文长度不足 (${extracted?.text?.length ?? 0})，跳过`);
        continue;
      }

      console.log(`  ✅ 成功提取正文: ${extracted.text.length} 字, ${extracted.images.length} 张配图`);

      await sql`
        UPDATE articles
        SET body_text = ${extracted.text},
            body_html = ${extracted.html},
            body_status = 'ok',
            media = ${JSON.stringify(extracted.images)}::jsonb,
            url = ${cleanUrl},
            processing_state = 'new',
            processing_attempts = 0,
            processing_error = NULL,
            processing_retry_at = NULL,
            updated_at = now()
        WHERE id = ${item.id};
      `;
      console.log(`  🎉 已更新 articles 表并重置 processing_state 为 new`);
    } catch (err: any) {
      console.error(`  ❌ 抓取失败: ${err.message}`);
    }
  }

  console.log('\n=== 成都地铁文章修复完毕 ===');
  process.exit(0);
}

await main();
