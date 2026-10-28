import { sql } from '../packages/backend/src/db.ts';
import { buildBodyHtml } from './ingest-mediacrawler.ts';

async function main() {
  console.log('=== 批量补齐已有自媒体图文正文与开启全文 ===');
  await sql`UPDATE sources SET site_fulltext = true WHERE id LIKE 'mc-%';`;
  await sql`UPDATE publications SET body_mode = 'full' WHERE source_id LIKE 'mc-%';`;

  const articles = await sql<any[]>`
    SELECT id, title, body_text, raw, excerpt
    FROM articles
    WHERE source_id LIKE 'mc-%';
  `;

  let count = 0;
  for (const a of articles) {
    const raw = a.raw || {};
    const desc = (a.body_text || a.excerpt || raw.desc || '').trim();
    const html = buildBodyHtml(a.title, desc, raw.imageList || raw.image_list, raw.videoCoverUrl || raw.video_cover_url);

    await sql`
      UPDATE articles
      SET body_html = ${html}
      WHERE id = ${a.id};
    `;
    count++;
  }

  console.log(`成功为 ${count} 篇自媒体文章补齐完整正文与配图！`);
  process.exit(0);
}

await main();
