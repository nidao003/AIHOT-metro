// Classify a referrer host into the channel an editor thinks in. Hosts are matched by suffix so
// cn.bing.com and www.bing.com both land in search, and m.baidu.com does not need its own entry.
import { config } from "../config.ts";

export type Channel = "search" | "ai" | "social" | "referral" | "internal" | "direct";

const SEARCH = [
  "baidu.com", "sogou.com", "so.com", "360.cn", "sm.cn", "toutiao.com", "bing.com",
  "google.com", "google.com.hk", "google.co.jp", "google.co.uk", "yandex.com", "yandex.ru",
  "yahoo.com", "duckduckgo.com", "naver.com", "ecosia.org", "brave.com",
];

// Generative engines. Most phone apps open links without a referrer, so this catches only the
// browser and desktop traffic — the rest arrives as "direct" and is read through deep-link landings.
const AI = [
  "chatgpt.com", "openai.com", "perplexity.ai", "copilot.microsoft.com", "claude.ai",
  "gemini.google.com", "bard.google.com", "deepseek.com", "poe.com", "you.com", "phind.com",
  "doubao.com", "kimi.com", "moonshot.cn", "yiyan.baidu.com", "wenxin.baidu.com",
  "yuanbao.tencent.com", "tongyi.aliyun.com", "chatglm.cn", "metaso.cn", "n.cn",
];

const SOCIAL = [
  "weixin.qq.com", "wechat.com", "weibo.com", "weibo.cn", "t.cn", "zhihu.com", "xiaohongshu.com",
  "douyin.com", "bilibili.com", "qq.com", "toutiao.com", "facebook.com", "twitter.com", "x.com",
  "linkedin.com", "t.me", "telegram.org", "whatsapp.com", "reddit.com", "youtube.com",
];

function matches(host: string, list: readonly string[]): boolean {
  const h = host.toLowerCase();
  return list.some((entry) => h === entry || h.endsWith(`.${entry}`));
}

/** The site's own hostname, so a click between our pages is not counted as external traffic. */
function selfHost(): string {
  try {
    return new URL(config.siteUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function classifyReferrer(host: string | null | undefined): Channel {
  const h = (host ?? "").trim().toLowerCase();
  if (!h) return "direct";
  if (h === selfHost()) return "internal";
  if (matches(h, AI)) return "ai";
  if (matches(h, SEARCH)) return "search";
  if (matches(h, SOCIAL)) return "social";
  return "referral";
}

const CHANNEL_NAME: Record<Channel, string> = {
  search: "搜索引擎",
  ai: "AI 引擎",
  social: "社交平台",
  referral: "其他外链",
  internal: "站内跳转",
  direct: "直接访问",
};

export function channelName(channel: string): string {
  return CHANNEL_NAME[channel as Channel] ?? channel;
}
