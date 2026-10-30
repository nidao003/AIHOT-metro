# MetroHot — Urban Rail Transit News Desk

**MetroHot is a news aggregation and daily-briefing site for China's urban rail transit (metro) industry.** It watches official sources, tender notices, WeChat public accounts and social media, filters and rewrites what matters with LLMs, groups reports of the same event, and publishes a daily briefing at 08:00 Beijing time.

Live site: <https://metrohot.oohforce.com> · [简体中文](README.md)

---

## What it does

Industry information is scattered: new line approvals on the NDRC's pages, tenders on provincial public-resource trading platforms, station retail and advertising leases on operators' WeChat accounts, ridership data in the Ministry of Transport's monthly reports, and news across dozens of metro-group websites.

MetroHot pulls all of it into one pipeline:

1. **Collect** — RSS, HTML list pages, JSON APIs, X, WeChat public accounts, and pushed-in social media data.
2. **Select** — a prefilter decides whether an item is even about the industry; a scorer rates each surviving item twice against the same published rubric, and per-tier thresholds decide what gets in.
3. **Group** — reports of the same event are clustered into one story; heat is counted per independent outlet.
4. **Publish** — a daily briefing at 08:00, a weekly recap on Mondays at 10:00, and a monthly review on the 1st at 10:30 (Beijing time).

Every prompt, rubric and threshold lives in the repository — changing editorial standards does not require touching code.

## Coverage

| Category | What it covers |
|---|---|
| Station retail | Shop leases inside paid areas, convenience stores, vending, station commercial space management |
| Metro advertising | In-car and platform advertising, digital screens, broadcast and in-train TV concessions |
| Ridership & capacity | Ministry of Transport monthly reports, record single-day ridership, crowding, capacity deployment |
| Operations & safety | Timetable changes, signalling and driverless upgrades, delays, crowd control, emergency response |
| TOD development | Property above depots and along lines, station-city integration, land sales, attached commercial real estate |
| Corporate finance | Annual reports, fare and subsidy revenue, debt and green bonds, executive changes, restructuring |
| Planning & construction | Network plans and approvals, construction milestones, trial running, openings |
| Policy & standards | Ministry of Transport, National Railway Administration and CAMET guidance, safety rules, standards |

There are also 24 topic pages (key cities, MTR ecosystem, TOD, retail, advertising, business lines) and an entity directory of 51 organisations.

## Sources

`industry/sources.json` defines **326 sources**: 199 RSS feeds, 87 HTML list pages, 29 JSON APIs, 6 WeChat public accounts (collected through [we-mp-rss](https://github.com/rachelos/we-mp-rss)) and 5 X searches.

Social media content from Weibo, Douyin, Xiaohongshu, Bilibili and Zhihu is collected separately and ingested through `scripts/ingest-mediacrawler.ts`.

Sources are tiered (first-party official, official/quasi-official accounts, media and individuals) with different acceptance thresholds. Fetch intervals adapt to each source's output over the last seven days, from 15 minutes up.

## How the pipeline works

```
sources → collect (dedupe, fetch body) → judge & write (prefilter, score, title/summary, structure)
        → group (story, heat, digest) → publication layer → web / RSS / API / MCP / briefings
```

Selection runs the same rubric twice independently; weights differ by content type, and thresholds depend on the source tier. Grouping searches the last two weeks for candidate reports, then asks a model whether two reports are the same occurrence, a follow-up, or unrelated. Heat counts each independent outlet once within 48 hours, halving after 24.

## Public outputs

| Path | Content |
|---|---|
| `/` `/all` `/hot` `/topics` `/daily` `/weekly` `/monthly` | Selected, all, hot, topics, daily/weekly/monthly briefings |
| `/feed.xml` `/feed/all.xml` `/feed/daily.xml` … | RSS: selected, all, briefings, per category |
| `/api/v1/` · `/openapi-v1.json` | Public read-only API, no key required |
| `/api/mcp` | MCP server, tools prefixed `metrohot_` |
| `/llms.txt` · `/sitemap.xml` · `/agent` | Guidance for LLM agents and search engines |

Pages are anonymous and identical for admins and visitors. By default only the summary and a link to the original are shown; full text is enabled per source only where the source allows it.

## Stack

Node.js 24 running TypeScript directly (no backend build step) · React Router SSR · Fastify · PostgreSQL 17 · pg-boss · Tailwind CSS · Docker Compose.

Three processes: `apps/api` (HTTP API, RSS, MCP, image proxy), `apps/worker` (collection, model jobs, grouping, briefings), `apps/web` (server-rendered pages, reads the API over HTTP only).

## Run locally

Requires Docker, Node.js 24 and an OpenAI-compatible model API key.

```bash
node scripts/init-env.ts --llm-key <your-model-api-key>
docker compose up -d --build
```

Open <http://localhost:3000>; the admin panel is at `/admin` with the password from `ADMIN_PASSWORD` in `.env`.

## Relationship to upstream

MetroHot is a customised deployment of the open-source [AIHOT](https://github.com/KKKKhazix/AIHOT) framework (MIT). The engine, admin, selection pipeline, grouping and briefing system come from upstream. This repository adds the industry layer: taxonomy, topics, 326 sources, prompts and thresholds, site copy and branding, and the WeChat / social-media collection chain.

Upstream changes are merged regularly; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Code is under the [MIT licence](LICENSE). The AIHOT name and logo are not included; this site does not use them.
