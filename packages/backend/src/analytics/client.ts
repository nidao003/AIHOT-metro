// User-agent → device, browser and OS, plus the bot test that keeps scanners out of the counters.
// Deliberately regex-only: a full UA parser is not worth a dependency for four columns.

export type DeviceType = "desktop" | "mobile" | "tablet" | "bot" | "unknown";

const BOT = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headlesschrome|puppeteer|playwright|python-requests|python-urllib|curl\/|wget\/|go-http-client|java\/|okhttp|axios\/|node-fetch|undici|scrapy|httpclient/i;

export interface ClientInfo {
  deviceType: DeviceType;
  browser: string;
  os: string;
  isBot: boolean;
}

export function parseClient(ua: string | null | undefined): ClientInfo {
  const s = (ua ?? "").trim();
  if (!s) return { deviceType: "unknown", browser: "unknown", os: "unknown", isBot: false };
  const isBot = BOT.test(s);
  const deviceType: DeviceType = isBot
    ? "bot"
    : /iPad|Tablet|PlayBook|Silk/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s))
      ? "tablet"
      : /Mobi|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(s)
        ? "mobile"
        : "desktop";
  // In-app browsers carry the desktop engine too, so they are matched before Chrome/Safari.
  const browser = /MicroMessenger/i.test(s) ? "WeChat"
    : /Weibo/i.test(s) ? "Weibo"
    : /Edg\//i.test(s) ? "Edge"
    : /OPR\/|Opera/i.test(s) ? "Opera"
    : /Firefox\/|FxiOS/i.test(s) ? "Firefox"
    : /Chrome\/|CriOS/i.test(s) ? "Chrome"
    : /Safari\//i.test(s) ? "Safari"
    : "Other";
  const os = /Windows/i.test(s) ? "Windows"
    : /Android/i.test(s) ? "Android"
    : /iPhone|iPad|iPod/i.test(s) ? "iOS"
    : /Mac OS X|Macintosh/i.test(s) ? "macOS"
    : /Linux/i.test(s) ? "Linux"
    : "Other";
  return { deviceType, browser, os, isBot };
}
