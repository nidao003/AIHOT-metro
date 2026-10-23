// Probes a list page and proposes a sources.json entry: connectivity, page shape, candidate
// selectors, and a live-verified config. Run it before writing any source by hand.
//   node scripts/probe-source.ts <url> [--base <listing-base-url>] [--id <source-id>]
//
// It answers the three questions that otherwise cost a round trip each:
//   1. Is this page server-rendered, a SPA shell, or refusing automated clients?
//   2. Which element repeats once per item, and which of its children hold title and date?
//   3. Does that selector actually yield dated items through the real collector?
import * as cheerio from "cheerio";
import { guardedFetch } from "@aihot/backend/lib/http-fetch";
import { fetchWebList } from "@aihot/backend/sources/web-list";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
if (!url) {
  console.error("usage: node scripts/probe-source.ts <url> [--base <url>] [--id <id>]");
  process.exit(2);
}
const flag = (name: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const base = flag("base") ?? url;
const id = flag("id") ?? "probe";

/** Text that reads as a publication day, in the shapes Chinese list pages print. */
const DATE_TEXT = /(20\d{2})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/;
const DATE_ONLY = /^\s*(20\d{2})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})\s*日?\s*$/;

function describeShape(html: string, finalUrl: string): string {
  if (html.length === 0) return "空响应体（0 字节）—— 多半是 SSR+token 或反爬，去抓 JSON 接口";
  if (/window\.__NUXT__|__NEXT_DATA__|<div id="app"><\/div>|<div id=app><\/div>/.test(html) && html.length < 20_000)
    return "SPA 壳 —— 列表由 JS 渲染，去抓 XHR 接口";
  const $ = cheerio.load(html);
  const text = $("body").text().replace(/\s+/g, " ").trim();
  if (text.length < 300) return `疑似 SPA 或拦截页（正文仅 ${text.length} 字，最终 URL ${finalUrl}）`;
  return "服务端渲染 —— 可直接提选择器";
}

/** The repeating wrapper that holds one row: the parent of the elements that carry a date. */
function candidateItems(html: string): Array<{ selector: string; count: number; sample: unknown }> {
  const $ = cheerio.load(html);
  const tally = new Map<string, { count: number; nodes: cheerio.Cheerio<never>[] }>();
  $("*").each((_i, node) => {
    const el = $(node);
    const own = el.clone().children().remove().end().text().trim();
    if (!DATE_ONLY.test(own) && !DATE_TEXT.test(own)) return;
    const parent = el.parent();
    if (!parent.length) return;
    const tag = (parent.get(0) as { tagName?: string })?.tagName?.toLowerCase() ?? "";
    if (!tag) return;
    const cls = (parent.attr("class") ?? "").split(/\s+/).filter(Boolean);
    // A wrapper is identified by tag + its first class: extra classes are often animation hooks.
    const selector = cls.length ? `${tag}.${cls[0]}` : tag;
    const entry = tally.get(selector) ?? { count: 0, nodes: [] };
    entry.count += 1;
    if (entry.nodes.length < 40) entry.nodes.push(parent as never);
    tally.set(selector, entry);
  });
  return [...tally.entries()]
    .map(([selector, v]) => ({ selector, count: v.count, nodes: v.nodes }))
    .filter((c) => c.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({ selector: c.selector, count: c.count, sample: c.nodes[0] }));
}

/** Within one row, the link with the longest text is the title; the element whose own text is only a date is the date. */
function childSelectors(row: cheerio.Cheerio<never>): { link?: string; title?: string; date?: string } {
  const describe = (el: cheerio.Cheerio<never>): string => {
    const tag = (el.get(0) as { tagName?: string })?.tagName?.toLowerCase() ?? "";
    const cls = (el.attr("class") ?? "").split(/\s+/).filter(Boolean);
    const href = el.attr("href");
    const attr = href?.startsWith("http") ? "" : "";
    return tag ? `${tag}${cls.length ? `.${cls[0]}` : ""}${attr}` : "";
  };
  let link: { sel: string; len: number } | undefined;
  row.find("a[href]").each((_i, node) => {
    const el = row.find(node as never);
    const len = el.text().replace(/\s+/g, " ").trim().length;
    const sel = describe(el);
    if (sel && (!link || len > link.len)) link = { sel, len };
  });
  let date: string | undefined;
  row.find("*").each((_i, node) => {
    if (date) return;
    const el = row.find(node as never);
    if (el.children().length) return;
    if (DATE_ONLY.test(el.text())) date = describe(el) || undefined;
  });
  const title = link?.sel;
  return { link: title, title, date };
}

async function main(): Promise<void> {
  console.log(`probe: ${url}`);
  let res;
  try {
    res = await guardedFetch(url, { timeoutMs: 25_000 });
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause;
    console.log(`✗ 连接失败: ${(error as Error).message}${cause?.code ? ` (${cause.code})` : ""}`);
    console.log("  ERR_SSL_BAD_ECPOINT → TLS 曲线问题，项目已全局修复，检查是否走了 guardedFetch");
    console.log("  UND_ERR_SOCKET / ECONNRESET → WAF 拦 UA，补完整浏览器头");
    console.log("  TimeoutError → 站点响应过慢，或 TLS 握手挂起，暂缓");
    process.exit(1);
  }
  const html = await res.text();
  console.log(`  状态 ${res.status} / ${html.length} 字节 / 最终 ${res.url}`);
  console.log(`  形态: ${describeShape(html, res.url)}`);

  if (html.length < 500) {
    console.log("\n结论: 页面无内容，先按技能手册第 4 步找 JSON 接口，不要继续提选择器。");
    return;
  }

  const candidates = candidateItems(html);
  if (!candidates.length) {
    console.log("\n结论: 没找到成组的「带日期条目」。可能是表格结构、或列表里没有日期。");
    console.log("      手工看一眼：grep -o '<li[^>]*>' 或找表格 <tbody><tr>。");
    return;
  }

  console.log("\n候选条目容器（按出现次数）:");
  for (const c of candidates.slice(0, 3)) {
    const row = c.sample as cheerio.Cheerio<never>;
    const kids = childSelectors(row);
    console.log(`  ${c.selector}  ×${c.count}`);
    console.log(`    首条: ${row.text().replace(/\s+/g, " ").trim().slice(0, 70)}`);
    console.log(`    推测: link=${kids.link ?? "?"} title=${kids.title ?? "?"} date=${kids.date ?? "?"}`);
  }

  console.log("\n实测验证（用真实采集器）:");
  const results: Array<{ selector: string; ok: number; first?: string; date?: string; error?: string }> = [];
  for (const c of candidates.slice(0, 3)) {
    const kids = childSelectors(c.sample as cheerio.Cheerio<never>);
    if (!kids.link) {
      results.push({ selector: c.selector, ok: 0, error: "行内无链接" });
      continue;
    }
    const source = {
      id, kind: "web_list", tier: "T1", enabled: true,
      config: {
        url,
        baseUrl: base,
        itemSelector: c.selector,
        linkSelector: kids.link,
        titleSelector: kids.title,
        ...(kids.date ? { publishedAtSelector: kids.date } : {}),
        publishedAtUtcOffset: "+08:00",
      },
    };
    try {
      const out = await fetchWebList(source as never);
      const dated = out.filter((x) => x.publishedAt).length;
      results.push({ selector: c.selector, ok: out.length, first: out[0]?.title, date: out[0]?.publishedAt?.toISOString().slice(0, 10) });
      console.log(`  ${c.selector.padEnd(28)} ${out.length} 条（${dated} 条有日期）`);
      if (out[0]) console.log(`     ${out[0].publishedAt?.toISOString().slice(0, 10) ?? "无日期"} | ${out[0].title.slice(0, 50)}`);
      console.log(`     ${out[0].url}`);
    } catch (error) {
      results.push({ selector: c.selector, ok: 0, error: (error as Error).message });
      console.log(`  ${c.selector.padEnd(28)} ✗ ${(error as Error).message}`);
    }
  }

  const best = results.filter((r) => r.ok > 0).sort((a, b) => b.ok - a.ok)[0];
  if (!best) {
    console.log("\n结论: 全部候选都失败，回第 4 步找接口，或手工看结构。");
    return;
  }
  const winner = candidates.find((c) => c.selector === best.selector)!;
  const kids = childSelectors(winner.sample as cheerio.Cheerio<never>);
  console.log("\n推荐配置:");
  console.log(JSON.stringify({
    id, name: "待命名", kind: "web_list", tier: "T1",
    owner_entity_id: "待填", participation_mode: "editorial", interval_minutes: 180,
    config: {
      url,
      ...(base !== url ? { baseUrl: base } : {}),
      itemSelector: best.selector,
      linkSelector: kids.link,
      titleSelector: kids.title,
      ...(kids.date ? { publishedAtSelector: kids.date } : {}),
      publishedAtUtcOffset: "+08:00",
    },
    tags: ["官方"], site_fulltext: false, syndicate_fulltext: false,
  }, null, 2));
}

await main();
