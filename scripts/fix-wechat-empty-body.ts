import { sql } from '../packages/backend/src/db.ts';
import { extractFromUrl } from '../packages/backend/src/content/extract.ts';

async function main() {
  console.log('=== 扫描并修复微信公众号空正文（小于120字且来自微信）的文章 ===');

  const candidates = await sql<any[]>`
    SELECT id, title, url, source_id, length(coalesce(body_text, '')) as len
    FROM articles
    WHERE (url LIKE '%mp.weixin.qq.com%' OR source_id LIKE 'rss-mp-%')
      AND length(coalesce(body_text, '')) < 120
    ORDER BY published_at DESC NULLS LAST;
  `;

  console.log(`发现 ${candidates.length} 篇正文残缺的微信文章需要回补正文`);

  let successCount = 0;
  for (const item of candidates) {
    console.log(`\n正在抓取 [${item.title}] (ID: ${item.id})...`);
    try {
      const extracted = await extractFromUrl(item.url, item.title);
      if (!extracted || !extracted.text || extracted.text.length < 50) {
        console.warn(`  ⚠️ 未提取到足够正文 (len: ${extracted?.text?.length ?? 0})，跳过`);
        continue;
      }

      console.log(`  ✅ 提取成功: ${extracted.text.length} 字, ${extracted.images.length} 张图`);

      await sql`
        UPDATE articles
        SET body_text = ${extracted.text},
            body_html = ${extracted.html},
            body_status = 'ok',
            media = ${JSON.stringify(extracted.images)}::jsonb,
            processing_state = 'new',
            processing_attempts = 0,
            processing_error = NULL,
            processing_retry_at = NULL,
            updated_at = now()
        WHERE id = ${item.id};
      `;

      successCount++;
    } catch (err: any) {
      console.error(`  ❌ 抓取失败: ${err.message}`);
    }
  }

  console.log(`\n=== 回补完成！共成功更新 ${successCount}/${candidates.length} 篇文章，已重置为 new 状态等待 worker 重新出刊 ===`);
  process.exit(0);
}

await main();
