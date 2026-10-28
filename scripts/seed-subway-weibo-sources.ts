import fs from 'node:fs';
import path from 'node:path';
import { sql } from '../packages/backend/src/db.ts';

interface SubwayWeiboAccount {
  city: string;
  name: string;
  role: string;
  uid: string;
  url: string;
}

export async function seedSubwayWeiboSources(): Promise<number> {
  const jsonPath = path.resolve(process.cwd(), 'docs/subway-weibo-accounts.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`subway-weibo-accounts.json not found at: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const accounts: SubwayWeiboAccount[] = JSON.parse(raw);
  let count = 0;

  for (const acc of accounts) {
    const sourceId = `mc-wb-${acc.uid}`;
    const sourceName = `${acc.name}（官方微博）`;
    const tags = ['weibo', 'metro', 'official', acc.city];
    const config = {
      uid: acc.uid,
      city: acc.city,
      role: acc.role,
      url: acc.url,
    };

    await sql`
      INSERT INTO sources (
        id, name, kind, config, tags, first_party, tier,
        participation_mode, interval_minutes, enabled, health
      ) VALUES (
        ${sourceId}, ${sourceName}, 'external', ${sql.json(config)}, ${tags}, true, 'T1',
        'editorial', 720, true, 'ok'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        config = EXCLUDED.config,
        tags = EXCLUDED.tags,
        first_party = true,
        tier = 'T1',
        participation_mode = 'editorial',
        enabled = true,
        health = 'ok',
        updated_at = now();
    `;
    count += 1;
  }

  // 保证阿牛专家信源也并存
  await sql`
    INSERT INTO sources (
      id, name, kind, config, tags, first_party, tier,
      participation_mode, interval_minutes, enabled, health
    ) VALUES (
      'mc-wb-2728041997', '地铁客流及运输研究阿牛（微博）', 'external', '{"uid":"2728041997","role":"专家大V"}'::jsonb,
      '{"weibo","metro","analysis","expert"}'::text[], false, 'T1_5',
      'editorial', 720, true, 'ok'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      tier = 'T1_5',
      participation_mode = 'editorial',
      enabled = true,
      health = 'ok';
  `;

  // 保证其他民间微博信源存在
  await sql`
    INSERT INTO sources (
      id, name, kind, config, tags, first_party, tier,
      participation_mode, interval_minutes, enabled, health
    ) VALUES (
      'mc-wb-metro', '微博·地铁城轨', 'external', '{}'::jsonb,
      '{"weibo","metro","ugc"}'::text[], false, 'T2',
      'editorial', 720, true, 'ok'
    )
    ON CONFLICT (id) DO UPDATE SET
      participation_mode = 'editorial',
      enabled = true,
      health = 'ok';
  `;

  return count;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const seeded = await seedSubwayWeiboSources();
  console.log(`Successfully seeded ${seeded} official subway Weibo sources into database.`);
  process.exit(0);
}
