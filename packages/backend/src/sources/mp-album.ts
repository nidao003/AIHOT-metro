// WeChat official account "album" (合集) collections, adapter "mp_album" on web_list sources.
// The public appmsgalbum JSON endpoint lists an account's curated collections with titles,
// article URLs and second-precision dates, paged by begin_msgid/begin_itemidx until
// continue_flag=0. It covers only the collections an account maintains — not the whole account.
// First import walks up to maxPages; later runs read the first page only, so more new posts
// than one page between runs can be missed (documented in docs/sources.md).
import { languageHeaders, requireOk } from "../lib/http-fetch.ts";
import { collapseWhitespace } from "../lib/text.ts";
import { fetchListing } from "./listing-fetch.ts";
import { allowed } from "./filters.ts";
import { FetchError, type Candidate, type SourceRow } from "./types.ts";

/** The collection an mp_album config names, for duplicate detection; null for any other source. */
export function mpAlbumIdentity(config: Record<string, unknown>): string | null {
  if (config.adapter !== "mp_album") return null;
  try {
    const u = new URL(String(config.url ?? ""));
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    const biz = u.searchParams.get("__biz");
    const albumId = u.searchParams.get("album_id");
    if (!biz || !albumId) return null;
    return `mp-album:${biz}:${albumId}`;
  } catch {
    return null;
  }
}

interface AlbumPage {
  articles: Array<Record<string, unknown>>;
  continueFlag: boolean;
  lastMsgid?: string;
  lastItemidx?: string;
}

/** Request only the collection identity plus paging parameters; tracking params are dropped. */
function pageUrl(config: Record<string, unknown>, pageSize: number, begin?: { msgid: string; itemidx: string }): string {
  const identity = mpAlbumIdentity(config);
  if (!identity) throw new FetchError("mp_album: url 必须是含 __biz 和 album_id 的地址");
  const [, biz, albumId] = identity.split(":");
  // The endpoint keeps the configured origin (mp.weixin.qq.com in production), so a local fixture
  // server can serve the same shape in tests.
  const base = new URL(String(config.url));
  const u = new URL(`${base.origin}${base.pathname}`);
  u.search = "";
  u.searchParams.set("action", "getalbum");
  u.searchParams.set("__biz", biz!);
  u.searchParams.set("album_id", albumId!);
  u.searchParams.set("count", String(pageSize));
  u.searchParams.set("f", "json");
  if (begin) {
    u.searchParams.set("begin_msgid", begin.msgid);
    u.searchParams.set("begin_itemidx", begin.itemidx);
  }
  return u.toString();
}

function parsePage(text: string): AlbumPage {
  let data: any;
  try { data = JSON.parse(text); } catch { throw new FetchError("mp_album: 响应不是 JSON（可能是验证页或错误页）"); }
  const base = data?.base_resp;
  if (base && Number(base.ret) !== 0) throw new FetchError(`mp_album: 上游错误 ${base.ret} ${base.err_msg ?? ""}`);
  const resp = data?.getalbum_resp;
  if (!resp || typeof resp !== "object" || !Array.isArray(resp.article_list)) {
    throw new FetchError("mp_album: 响应缺少 getalbum_resp.article_list");
  }
  const articles = resp.article_list.filter((a: unknown) => a && typeof a === "object");
  const last = articles[articles.length - 1] as Record<string, unknown> | undefined;
  return {
    articles,
    continueFlag: String(resp.continue_flag) === "1",
    lastMsgid: last?.msgid != null ? String(last.msgid) : undefined,
    lastItemidx: last?.itemidx != null ? String(last.itemidx) : "1",
  };
}

export async function fromMpAlbum(source: SourceRow): Promise<Candidate[]> {
  const firstImport = !source.cursor?.initializedAt;
  const maxPages = Math.min(20, Math.max(1, Number(source.config.maxPages ?? 5)));
  const pageSize = Math.min(10, Math.max(1, Number(source.config.pageSize ?? 10)));
  const pageLimit = firstImport ? maxPages : 1;
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const seenCursors = new Set<string>();
  let begin: { msgid: string; itemidx: string } | undefined;
  for (let page = 0; page < pageLimit; page++) {
    const res = requireOk(await fetchListing(pageUrl(source.config, pageSize, begin), {
      headers: { accept: "application/json", ...languageHeaders(source.config.acceptLanguage) },
      timeoutMs: 25_000,
    }), "mp_album");
    const parsed = parsePage(res.text());
    // Pagination progress is measured on raw page entries, even ones without a title or URL.
    if (parsed.continueFlag) {
      if (!parsed.lastMsgid) throw new FetchError("mp_album: continue_flag=1 但本页没有 msgid 进度");
      const cursor = `${parsed.lastMsgid}/${parsed.lastItemidx}`;
      if (seenCursors.has(cursor)) throw new FetchError(`mp_album: 分页游标重复（${cursor}）`);
      seenCursors.add(cursor);
    }
    for (const a of parsed.articles) {
      const url = typeof a.url === "string" && /^https?:\/\//i.test(a.url) ? a.url : null;
      const title = collapseWhitespace(String(a.title ?? ""));
      if (!url || !title || !allowed(url, source)) continue;
      const key = `${a.msgid}/${a.itemidx ?? 1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const epoch = Number(a.create_time);
      const publishedAt = Number.isFinite(epoch) && epoch > 0 ? new Date(epoch * 1000) : null;
      // No bodyStatus/excerpt: with a detail.summarySelector config the detail pass fills both from the
      // article page (#js_content); without one the entry analyzes from its listing metadata, and the
      // generic body extractor never reaches mp.weixin.qq.com pages anyway.
      out.push({ url, title, publishedAt, publicationTime: publishedAt ? publishedAt.toISOString() : null });
    }
    if (!parsed.continueFlag) break;
    begin = { msgid: parsed.lastMsgid!, itemidx: parsed.lastItemidx ?? "1" };
  }
  if (!out.length) throw new FetchError("no items matched (mp_album)");
  return out;
}
