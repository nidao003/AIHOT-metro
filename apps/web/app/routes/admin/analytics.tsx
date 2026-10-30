import { SITE } from "@aihot/site";
import { Link } from "react-router";
import type { Route } from "./+types/analytics";
import { adminGet } from "../../lib/admin.server";
import { AdminPage, Card, DataTable, Stat } from "../../features/admin/ui";
import { TrendChart } from "../../features/admin/TrendChart";
import { num } from "../../features/admin/format";

interface DayRow {
  day: string; pv: number; uv: number; sessions: number; bounces: number;
  shares: number; outbound: number; searches: number; avgDurationMs: number;
}
interface DimRow { value: string; label: string; pv: number; uv: number }
interface Overview {
  range: { from: string; to: string };
  timeline: DayRow[];
  totals: Omit<DayRow, "day" | "avgDurationMs">;
  today: DayRow | null;
  realtime: { visitors: number; views: number };
  deepLanding: { deep: number; sessions: number };
}

const RANGES = [7, 30, 90];

function seconds(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}分${s % 60}秒` : `${s}秒`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 365);
  const query = from && to ? `from=${from}&to=${to}` : `days=${days}`;
  const [overview, channel, referrer, device, city, article, path] = await Promise.all([
    adminGet<Overview>(request, `/api/admin/analytics/overview?${query}`),
    adminGet<DimRow[]>(request, `/api/admin/analytics/dimension?name=channel&${query}`),
    adminGet<DimRow[]>(request, `/api/admin/analytics/dimension?name=referrer&${query}`),
    adminGet<DimRow[]>(request, `/api/admin/analytics/dimension?name=device&${query}`),
    adminGet<DimRow[]>(request, `/api/admin/analytics/dimension?name=city&${query}`),
    adminGet<DimRow[]>(request, `/api/admin/analytics/dimension?name=article&${query}`),
    adminGet<DimRow[]>(request, `/api/admin/analytics/dimension?name=path&${query}`),
  ]);
  return { days, custom: !!(from && to), overview, channel, referrer, device, city, article, path };
}

export const meta: Route.MetaFunction = () => [{ title: `访问 · ${SITE.name} 后台` }];

const dayColumns = [
  { key: "day", label: "日期", render: (r: DayRow) => r.day },
  { key: "pv", label: "PV", align: "right" as const, render: (r: DayRow) => num(r.pv) },
  { key: "uv", label: "UV", align: "right" as const, render: (r: DayRow) => num(r.uv) },
  { key: "sessions", label: "会话", align: "right" as const, render: (r: DayRow) => num(r.sessions) },
  { key: "bounce", label: "跳出率", align: "right" as const, render: (r: DayRow) => (r.sessions ? `${Math.round((r.bounces / r.sessions) * 100)}%` : "—") },
  { key: "duration", label: "平均停留", align: "right" as const, render: (r: DayRow) => seconds(r.avgDurationMs) },
  { key: "shares", label: "分享", align: "right" as const, render: (r: DayRow) => num(r.shares) },
];

function dimColumns(unit: string) {
  return [
    { key: "label", label: unit, render: (r: DimRow) => r.label || "—" },
    { key: "pv", label: "PV", align: "right" as const, render: (r: DimRow) => num(r.pv) },
    { key: "uv", label: "UV", align: "right" as const, render: (r: DimRow) => num(r.uv) },
  ];
}

export default function AnalyticsAdmin({ loaderData }: Route.ComponentProps) {
  const { days, custom, overview, channel, referrer, device, city, article, path } = loaderData;
  const today = overview.today;
  const t = overview.totals;

  return (
    <AdminPage
      title="访问统计"
      subtitle={`公开页面访问数据 · 当前区间 ${overview.range.from} 至 ${overview.range.to}。IP 归属地由本地库解析，精到城市；经纬度是城市中心点。`}
      actions={
        <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
          {RANGES.map((d) => (
            <Link key={d} to={`/admin/analytics?days=${d}`} className={`rounded-full px-3 py-1 ring-1 ${!custom && d === days ? "bg-ink text-bg ring-ink" : "ring-line text-ink-3 hover:text-ink"}`}>
              {d} 天
            </Link>
          ))}
          <form method="get" className="flex items-center gap-1.5">
            <input type="date" name="from" defaultValue={custom ? overview.range.from : ""} className="h-7 rounded-full border border-line bg-surface px-2.5 text-[12.5px] text-ink" />
            <span className="text-ink-4">至</span>
            <input type="date" name="to" defaultValue={custom ? overview.range.to : ""} className="h-7 rounded-full border border-line bg-surface px-2.5 text-[12.5px] text-ink" />
            <button type="submit" className="h-7 rounded-full bg-ink px-3 text-[12.5px] font-medium text-bg">应用</button>
          </form>
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="今日 PV" value={num(today?.pv ?? 0)} hint="页面浏览量" />
        <Stat label="今日 UV" value={num(today?.uv ?? 0)} hint="独立访客" />
        <Stat label="今日会话" value={num(today?.sessions ?? 0)} hint="30 分钟窗口" />
        <Stat label="跳出率" value={today?.sessions ? `${Math.round((today.bounces / today.sessions) * 100)}%` : "—"} hint="单页会话占比" />
        <Stat label="平均停留" value={seconds(today?.avgDurationMs ?? 0)} hint="每会话时长" />
        <Stat label="实时在线" value={num(overview.realtime.visitors)} tone="ok" hint="近 5 分钟独立访客" />
      </div>

      <Card className="mb-5" title={`访问趋势 · ${overview.range.from} 至 ${overview.range.to}`} right={<span>区间合计 PV {num(t.pv)} · UV {num(t.uv)} · 分享 {num(t.shares)}</span>}>
        <TrendChart rows={overview.timeline} />
      </Card>

      <Card className="mb-5" title="每日明细" pad={false}>
        <DataTable rows={[...overview.timeline].reverse()} columns={dayColumns} rowKey={(r) => r.day} dense />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="访问渠道"
          right={<span>深链接落地 {num(overview.deepLanding.deep)} 次 · 无来源直接打开文章，多为 App 或 AI 助手</span>}
          pad={false}
        >
          <DataTable rows={channel} columns={dimColumns("渠道")} rowKey={(r) => r.value} dense />
        </Card>
        <Card title="来源明细" pad={false}><DataTable rows={referrer} columns={dimColumns("来源")} rowKey={(r) => r.value} dense /></Card>
        <Card title="设备与客户端" pad={false}><DataTable rows={device} columns={dimColumns("设备")} rowKey={(r) => r.value} dense /></Card>
        <Card title="访客地区" pad={false}><DataTable rows={city} columns={dimColumns("城市")} rowKey={(r) => r.value} dense /></Card>
        <Card title="热门页面" pad={false}><DataTable rows={path} columns={dimColumns("路径")} rowKey={(r) => r.value} dense /></Card>
        <Card title="文章阅读排行" pad={false}><DataTable rows={article} columns={dimColumns("文章")} rowKey={(r) => r.value} dense /></Card>
      </div>
    </AdminPage>
  );
}
