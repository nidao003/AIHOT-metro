// Seeds a fresh site from the industry pack: the demo sources (industry/sources.json, only the ones not
// there yet, so admin edits are never undone). Topics need no seeding: they are read from industry/topics.json.
// Re-runnable:  node --env-file=.env scripts/seed.ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@aihot/backend/config";
import { closeDb, sql } from "@aihot/backend/db";
import { assertSupportedConfig } from "@aihot/backend/sources/config-keys";

interface SeedSource {
  id: string;
  name: string;
  kind: "rss" | "web_list" | "json_list" | "x_search" | "mp_account" | "external";
  config: Record<string, unknown>;
  tier?: string;
  owner_entity_id?: string | null;
  participation_mode?: string;
  interval_minutes?: number;
  tags?: string[];
  site_fulltext?: boolean;
  syndicate_fulltext?: boolean;
  enabled?: boolean;
}

// This repository does not publish its source list; a checkout without it still migrates and prices.
const sourcesFile = path.join(REPO_ROOT, "industry/sources.json");
const { sources } = (existsSync(sourcesFile) ? JSON.parse(readFileSync(sourcesFile, "utf8")) : { sources: [] }) as { sources: SeedSource[] };
if (!sources.length) console.log("sources: industry/sources.json not present or empty, nothing to seed");
let added = 0;
for (const s of sources) {
  assertSupportedConfig(s.kind, s.config);
  const tier = s.tier ?? "T2";
  // First-party means a T1 source, as the admin sets it.
  const inserted = await sql`
    INSERT INTO sources (id, name, kind, config, tier, first_party, owner_entity_id, participation_mode, interval_minutes, tags, site_fulltext, syndicate_fulltext, enabled, next_fetch_at)
    VALUES (${s.id}, ${s.name}, ${s.kind}, ${sql.json(s.config as never)}, ${tier}, ${tier === "T1"}, ${s.owner_entity_id ?? null},
            ${s.participation_mode ?? "editorial"}, ${s.interval_minutes ?? 60}, ${s.tags ?? []}, ${s.site_fulltext ?? false}, ${s.syndicate_fulltext ?? false},
            ${s.enabled ?? true}, now())
    ON CONFLICT (id) DO NOTHING RETURNING id`;
  added += inserted.length;
}
console.log(`sources: ${added} added, ${sources.length - added} already there`);

// Seed default service pricing (e.g. DeepSeek official rates)
await sql`
  INSERT INTO service_prices (service, model, currency, input_per_mtok, cached_per_mtok, output_per_mtok, updated_at)
  VALUES
    ('deepseek', 'deepseek-flash', 'CNY', 2.000000, 0.040000, 8.000000, now()),
    ('deepseek', 'deepseek-flash-think', 'CNY', 2.000000, 0.040000, 8.000000, now()),
    ('deepseek', 'deepseek-chat', 'CNY', 2.000000, 0.500000, 8.000000, now()),
    ('deepseek', 'deepseek-reasoner', 'CNY', 4.000000, 1.000000, 16.000000, now()),
    ('deepseek', '', 'CNY', 2.000000, 0.040000, 8.000000, now()),
    ('llm', 'deepseek-flash', 'CNY', 2.000000, 0.040000, 8.000000, now()),
    ('llm', '', 'CNY', 2.000000, 0.040000, 8.000000, now())
  ON CONFLICT (service, model) DO UPDATE
  SET currency = EXCLUDED.currency,
      input_per_mtok = EXCLUDED.input_per_mtok,
      cached_per_mtok = EXCLUDED.cached_per_mtok,
      output_per_mtok = EXCLUDED.output_per_mtok,
      updated_at = now()`;
console.log("service_prices: seeded default model pricing");
await closeDb();
