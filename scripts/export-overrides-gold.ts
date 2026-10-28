// 把后台人工修正（editorial_overrides）导出成精选校准的标注样本（gold JSONL）。
// 用法（在 133 worker 容器或本机有库连接时）：
//   node scripts/export-overrides-gold.ts [--since 2026-10-25] [--out /tmp/overrides-gold.jsonl]
// 只导出人工改过 selected 的案例（精选/撤精选判断）；改标题摘要等不进标注集。
// 决策语义：人工 selected=true → "select"；=false → "reject"。与 .data/gold.jsonl 合并后跑
// scripts/eval-selection.ts 校准（见 docs/selection.md）。
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { sql, closeDb } from "@aihot/backend/db";

const { values } = parseArgs({
  options: {
    since: { type: "string", default: "1970-01-01" },
    out: { type: "string", default: ".data/overrides-gold.jsonl" },
  },
});

const rows = await sql<
  {
    article_id: string;
    title: string;
    source_name: string;
    source_kind: string;
    source_tier: string | null;
    language: string | null;
    body_text: string | null;
    excerpt: string | null;
    fields: { selected?: boolean };
    reason: string;
    updated_by: string;
    updated_at: Date;
  }[]
>`
  SELECT o.article_id, a.title, s.name AS source_name, s.kind AS source_kind, s.tier AS source_tier,
         a.language, a.body_text, a.excerpt, o.fields, o.reason, o.updated_by, o.updated_at
  FROM editorial_overrides o
  JOIN articles a ON a.id = o.article_id
  JOIN sources s ON s.id = a.source_id
  WHERE o.fields ? 'selected' AND o.updated_at >= ${new Date(values.since!)}
  ORDER BY o.updated_at`;

const out = rows
  .filter((r) => typeof r.fields.selected === "boolean")
  .map((r) => ({
    caseId: `manual-${r.article_id}`,
    material: {
      title: r.title,
      sourceName: r.source_name,
      originalTitle: null,
      publishedAt: null,
      bodyZh: (r.body_text ?? r.excerpt ?? null)?.slice(0, 4000) ?? null,
      bodyOriginal: null,
    },
    sourceFacts: { sourceKind: r.source_kind, sourceTier: r.source_tier ?? undefined, language: r.language ?? "zh" },
    samplingContext: { origin: "manual-override", reason: r.reason, by: r.updated_by, at: r.updated_at },
    gold: { decision: r.fields.selected ? "select" : "reject" },
  }));

writeFileSync(values.out!, out.map((r) => JSON.stringify(r)).join("\n") + (out.length ? "\n" : ""));
console.log(`${out.length} manual-override cases -> ${values.out}`);
await closeDb();
