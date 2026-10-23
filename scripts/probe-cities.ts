// Probes a batch of city sources and prints a fill-ready result table. One command instead of
// running probe-source.ts per site by hand, which is what makes expanding to dozens of cities
// practical. The output is Markdown so a run can be pasted straight into the skill's city table.
//   node scripts/probe-cities.ts <cities.json> [--json]
//
// cities.json: [{ "name": "无锡", "official": "http://www.wxmetro.net" }, …]
// Optional per-city keys: "trading" (local public-resource platform), "note".
import { readFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { guardedFetch } from "@aihot/backend/lib/http-fetch";
import { fetchWebList } from "@aihot/backend/sources/web-list";

interface CityEntry {
  name: string;
  official?: string;
  trading?: string;
  note?: string;
}

const DATE_TEXT = /(20\d{2})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/;

type Shape = "静态可解析" | "SPA 壳" | "空响应" | "不可达" | "被拦截";

interface ProbeResult {
  name: string;
  url: string;
  kind: "official" | "trading";
  status: string;
  bytes: number;
  shape: Shape;
  items: number;
  dated: number;
  selector?: string;
  sample?: string;
  error?: string;
}

function shapeOf(html: string): Shape {
  if (html.length === 0) return "空响应";
  if (/window\.__NUXT__|__NEXT_DATA__|<div id="app">|doesn't work properly without JavaScript|attackBlocking/i.test(html) && html.length < 60_000) return "SPA 壳";
  const text = cheerio.load(html)("body").text().replace(/\s+/g, " ").trim();
  if (text.length < 200) return "被拦截";
  return "静态可解析";
}

/** The wrapper that repeats once per dated row, plus the child selectors that fit it. */
function guessSelectors(html: string): { item: string; link: string; title: string; date?: string } | null {
  const $ = cheerio.load(html);
  const tally = new Map<string, { count: number; first: cheerio.Cheerio<never> }>();
  $("*").each((_i, node) => {
    const el = $(node);
    if (el.children().length) return;
    if (!DATE_TEXT.test(el.text())) return;
    const parent = el.parent();
    const tag = (parent.get(0) as { tagName?: string })?.tagName?.toLowerCase();
    if (!tag) return;
    const cls = (parent.attr("class") ?? "").split(/\s+/).filter(Boolean);
    const sel = cls.length ? `${tag}.${cls[0]}` : tag;
    const entry = tally.get(sel) ?? { count: 0, first: parent as never };
    entry.count += 1;
    tally.set(sel, entry);
  });
  const best = [...tally.entries()].filter(([, v]) => v.count >= 3).sort((a, b) => b[1].count - a[1].count)[0];
  if (best) {
    const row = best[1].first;
    let link: string | undefined;
    let longest = 0;
    row.find("a[href]").each((_i, node) => {
      const a = row.find(node as never);
      const len = a.text().trim().length;
      const tag = (a.get(0) as { tagName?: string })?.tagName?.toLowerCase();
      const cls = (a.attr("class") ?? "").split(/\s+/).filter(Boolean);
      if (tag && len > longest) { longest = len; link = cls.length ? `${tag}.${cls[0]}` : tag; }
    });
    if (link) {
      let date: string | undefined;
      row.find("*").each((_i, node) => {
        if (date) return;
        const el = row.find(node as never);
        if (el.children().length) return;
        if (!/^\s*\(?20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}日?\)?\s*$/.test(el.text())) return;
        const tag = (el.get(0) as { tagName?: string })?.tagName?.toLowerCase();
        const cls = (el.attr("class") ?? "").split(/\s+/).filter(Boolean);
        if (tag) date = cls.length ? `${tag}.${cls[0]}` : tag;
      });
      return { item: best[0], link, title: link, date };
    }
  }

  // No dated rows: many listings print no date at all. Fall back to the repeating wrapper that
  // holds a link, provided the links it collects look like headlines rather than menu items.
  const rows = new Map<string, { count: number; first: cheerio.Cheerio<never> }>();
  $("li, tr, article, div").each((_i, node) => {
    const el = $(node);
    const links = el.find("a[href]");
    if (links.length !== 1) return;
    const text = links.first().text().replace(/\s+/g, " ").trim();
    if (text.length < 10) return;
    const tag = (el.get(0) as { tagName?: string })?.tagName?.toLowerCase();
    if (!tag) return;
    const cls = (el.attr("class") ?? "").split(/\s+/).filter(Boolean);
    const sel = cls.length ? `${tag}.${cls[0]}` : tag;
    const entry = rows.get(sel) ?? { count: 0, first: el as never };
    entry.count += 1;
    rows.set(sel, entry);
  });
  const fallback = [...rows.entries()].filter(([, v]) => v.count >= 5).sort((a, b) => b[1].count - a[1].count)[0];
  if (!fallback) return null;
  const tag = (fallback[1].first.get(0) as { tagName?: string })?.tagName?.toLowerCase();
  const cls = (fallback[1].first.attr("class") ?? "").split(/\s+/).filter(Boolean);
  const item = tag ? `${tag}${cls.length ? `.${cls[0]}` : ""}` : fallback[0];
  return { item, link: "a", title: "a" };
}

/** Section links a homepage offers: a listing normally lives one level down, not on the homepage. */
const SECTION_HINT = /新闻|资讯|动态|公告|招标|采购|公示|招商|要闻|头条|建设|运营/;

function sectionLinks(html: string, baseUrl: string): Array<{ label: string; url: string }> {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const seen = new Map<string, string>();
  $("a[href]").each((_i, node) => {
    const a = $(node);
    const label = a.text().replace(/\s+/g, " ").trim();
    if (!label || label.length > 14 || !SECTION_HINT.test(label)) return;
    const href = a.attr("href") ?? "";
    if (!href || href.startsWith("#") || /^javascript:/i.test(href)) return;
    let url: string;
    try { url = new URL(href, base).toString(); } catch { return; }
    if (new URL(url).host !== base.host) return;
    // A homepage link back to itself is navigation, not a section.
    if (url.replace(/\/$/, "") === baseUrl.replace(/\/$/, "")) return;
    if (!seen.has(url)) seen.set(url, label);
  });
  // Deeper paths first: a section listing usually sits below the homepage.
  return [...seen.entries()].map(([url, label]) => ({ label, url })).slice(0, 6);
}

async function probe(name: string, url: string, kind: "official" | "trading", depth = 0): Promise<ProbeResult[]> {
  const base: ProbeResult = { name, url, kind, status: "-", bytes: 0, shape: "不可达", items: 0, dated: 0 };
  let html: string;
  try {
    const res = await guardedFetch(url, { timeoutMs: 20_000 });
    html = await res.text();
    base.status = String(res.status);
    base.bytes = html.length;
  } catch (error) {
    base.error = (error as { cause?: { code?: string } }).cause?.code ?? (error as Error).message;
    return [base];
  }
  base.shape = shapeOf(html);
  if (base.shape !== "静态可解析") return [base];

  const attempt = async (pageUrl: string): Promise<ProbeResult | null> => {
    let pageHtml: string;
    try { pageHtml = await (await guardedFetch(pageUrl, { timeoutMs: 20_000 })).text(); } catch { return null; }
    if (pageHtml.length < 1000) return null;
    const guess = guessSelectors(pageHtml);
    if (!guess) return null;
    const source = {
      id: "probe", kind: "web_list", tier: "T1", enabled: true,
      config: {
        url: pageUrl,
        itemSelector: guess.item,
        linkSelector: guess.link,
        titleSelector: guess.title,
        ...(guess.date ? { publishedAtSelector: guess.date } : {}),
        publishedAtUtcOffset: "+08:00",
      },
    };
    try {
      const out = await fetchWebList(source as never);
      if (!out.length) return null;
      return { ...base, url: pageUrl, selector: guess.item, items: out.length, dated: out.filter((c) => c.publishedAt).length, sample: out[0]?.title.slice(0, 40) };
    } catch { return null; }
  };

  const own = await attempt(url);
  if (own) return [own];

  // Homepage has no listing: descend into its section links (one level only).
  if (depth > 0) return [base];
  const sections = sectionLinks(html, url);
  if (!sections.length) return [base];
  const results: ProbeResult[] = [base];
  for (const section of sections) {
    process.stderr.write(`  ↓ ${section.label} … `);
    const r = await attempt(section.url);
    if (r) { results.push(r); process.stderr.write(`${r.items} 条\n`); }
    else process.stderr.write("无\n");
  }
  return results;
}

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node scripts/probe-cities.ts <cities.json> [--json]");
    process.exit(2);
  }
  const cities = JSON.parse(readFileSync(file, "utf8")) as CityEntry[];
  const results: ProbeResult[] = [];

  for (const city of cities) {
    for (const [kind, url] of [["official", city.official], ["trading", city.trading]] as const) {
      if (!url) continue;
      process.stderr.write(`probe ${city.name} ${kind} … `);
      const rs = await probe(city.name, url, kind);
      const best = rs.find((r) => r.items > 0);
      process.stderr.write(best ? `${best.items} 条 (${best.url.replace(/^https?:\/\//, "").slice(0, 40)})\n` : `${rs[0]!.shape}\n`);
      results.push(...rs);
    }
  }

  if (process.argv.includes("--json")) {
    writeFileSync("/tmp/probe-cities-result.json", JSON.stringify(results, null, 2));
    console.log("json → /tmp/probe-cities-result.json");
    return;
  }

  console.log("\n| 城市 | 渠道 | 页面 | 形态 | 条数 | 选择器 | 状态 |");
  console.log("|---|---|---|---|---|---|---|");
  for (const r of results) {
    const sel = r.selector ? `\`${r.selector}\`` : "—";
    const path = new URL(r.url).pathname.slice(0, 30) || "/";
    const state = r.items > 0 ? `✅ ${r.dated}/${r.items} 有日期` : r.error ? `⚠️ ${r.error.slice(0, 24)}` : `⬜ ${r.shape}`;
    console.log(`| ${r.name} | ${r.kind === "official" ? "官网" : "交易"} | ${path} | ${r.shape} | ${r.items || "—"} | ${sel} | ${state} |`);
  }
  const hit = new Set(results.filter((r) => r.items > 0).map((r) => r.name)).size;
  const total = new Set(results.map((r) => r.name)).size;
  console.log(`\n有可用列表页的城市 ${hit} / ${total}`);
}

await main();
