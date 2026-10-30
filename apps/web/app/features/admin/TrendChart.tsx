/** PV/UV trend as an inline SVG: no chart library for two series, and it inherits the page's colours
 *  in both themes. Points carry a native <title> so hovering explains the day without extra state. */
export interface TrendPoint { day: string; pv: number; uv: number }

export function TrendChart({ rows, height = 200 }: { rows: TrendPoint[]; height?: number }) {
  if (rows.length === 0) return <div className="px-4 py-10 text-center text-[13px] text-ink-4">暂无数据</div>;

  const width = 900;
  const padX = 36;
  const padTop = 16;
  const padBottom = 28;
  const plotH = height - padTop - padBottom;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.pv, r.uv)));
  // Round the top up so the gridline reads a whole number.
  const top = Math.max(4, Math.ceil(max / 4) * 4);
  const stepX = rows.length > 1 ? (width - padX * 2) / (rows.length - 1) : 0;

  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => padTop + plotH - (v / top) * plotH;
  const line = (key: "pv" | "uv") => rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join(" ");
  const area = `${line("pv")} L${x(rows.length - 1).toFixed(1)},${padTop + plotH} L${padX},${padTop + plotH} Z`;

  const labelEvery = Math.max(1, Math.ceil(rows.length / 10));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="px-4 pb-3 pt-2">
      <div className="mb-2 flex items-center gap-4 text-[12px] text-ink-3">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[2px] w-4 rounded bg-accent" />PV 浏览量</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[2px] w-4 rounded bg-ink-3" />UV 访客数</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img" aria-label="PV 与 UV 趋势">
        {gridLines.map((g) => {
          const value = Math.round(top * (1 - g));
          return (
            <g key={g}>
              <line x1={padX} x2={width - padX} y1={padTop + plotH * g} y2={padTop + plotH * g} className="stroke-line" strokeWidth="1" />
              <text x={padX - 8} y={padTop + plotH * g + 4} textAnchor="end" className="fill-ink-4 text-[10px]">{value}</text>
            </g>
          );
        })}
        <path d={area} className="fill-accent/10" />
        <path d={line("pv")} fill="none" className="stroke-accent" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={line("uv")} fill="none" className="stroke-ink-3" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" />
        {rows.map((r, i) => (
          <g key={r.day}>
            <circle cx={x(i)} cy={y(r.pv)} r="2.5" className="fill-accent" />
            <title>{`${r.day}  PV ${r.pv}  UV ${r.uv}`}</title>
          </g>
        ))}
        {rows.map((r, i) => (i % labelEvery === 0 || i === rows.length - 1) ? (
          <text key={`l-${r.day}`} x={x(i)} y={height - 8} textAnchor="middle" className="fill-ink-4 text-[10px]">
            {r.day.slice(5)}
          </text>
        ) : null)}
      </svg>
    </div>
  );
}
