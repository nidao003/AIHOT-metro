// Probes each source's detail page and proposes a `detail.summarySelector`: the container that
// holds the article body. Run after probe-cities.ts, which yields the listing side.
//   node scripts/probe-detail.ts <source-id> [<source-id> …]
//
// For each source it takes the first listing item, fetches that page, and ranks the containers by
// their text length minus the boilerplate a reader would not call content (nav, footer, comments).
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { guardedFetch } from "@aihot/backend/lib/http-fetch";
import { fetchWebList } from "@aihot/backend/sources/web-list";

interface SourceJson {
  id: string;
  name: string;
  kind: string;
  config: Record<string, unknown>;
}

const TEXT_MIN = 80;
const NOISE = /nav|menu|footer|header|comment|share|related|recommend|sidebar|breadcrumb|pagination|banner/i;

function rankContainers(html: string): Array<{ selector: string; chars: number; sample: string }> {
  const $ = cheerio.load(html);
  const seen = new Map<string, { chars: number; sample: string }>();
  $("div, article, section, td").each((_i, node) => {
    const el = $(node);
    const ownText = el.clone().children().remove().end().text().replace(/\s+/g, " ").trim();
    // Score a container by the text its descendants carry, not just its own.
    const text = el.text().replace(/\s+/g, " ").trim();
    if (text.length < TEXT_MIN) return;
    const tag = (el.get(0) as { tagName?: string })?.tagName?.toLowerCase();
    if (!tag) return;
    const cls = (el.attr("class") ?? "").split(/\s+/).filter(Boolean);
    const id = el.attr("id");
    if (NOISE.test(cls.join(" ")) || (id && NOISE.test(id))) return;
    const selector = id ? `#${id}` : cls.length ? `${tag}.${cls[0]}` : tag;
    const score = text.length - ownText.length; // containers earn their place through children
    const prev = seen.get(selector);
    if (!prev || score > prev.chars) seen.set(selector, { chars: text.length, sample: text.slice(0, 70) });
  });
  return [...seen.entries()]
    .map(([selector, v]) => ({ selector, ...v }))
    .sort((a, b) => b.chars - a.chars)
    .slice(0, 5);
}

async function main(): Promise<void> {
  const ids = process.argv.slice(2);
  if (!ids.length) {
    console.error("usage: node scripts/probe-detail.ts <source-id> …");
    process.exit(2);
  }
  const all = JSON.parse(readFileSync("industry/sources.json", "utf8")).sources as SourceJson[];
  for (const id of ids) {
    const source = all.find((s) => s.id === id);
    if (!source) { console.log(`\n${id}: 源不存在`); continue; }
    const row = { ...source, enabled: true } as never;
    console.log(`\n=== ${id}  ${source.name}`);
    let items;
    try { items = await fetchWebList(row); } catch (error) { console.log(`  列表抓取失败: ${(error as Error).message}`); continue; }
    const first = items.find((c) => c.url);
    if (!first) { console.log("  列表为空"); continue; }
    console.log(`  样本: ${first.title.slice(0, 50)}`);
    let html: string;
    try { html = await (await guardedFetch(first.url, { timeoutMs: 20_000 })).text(); }
    catch (error) { console.log(`  详情抓取失败: ${(error as Error).message}`); continue; }
    const ranked = rankContainers(html);
    if (!ranked.length) { console.log("  未找到正文容器（可能是 SPA）"); continue; }
    for (const r of ranked.slice(0, 3)) console.log(`  ${r.selector.padEnd(26)} ${String(r.chars).padStart(5)} 字 | ${r.sample}`);
  }
}

await main();
