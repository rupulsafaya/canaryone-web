# Model Market — Phase 1 technical proposal

Status: awaiting approval. No Phase 2 code has been written.

Audited 6 August 2026 against the live Supabase project `riiypeociifzrxxkfixj`, the collector at
`canaryone-automations/c1-kayak`, and OpenRouter's APIs with a real key.

---

## 1. The call

The data pipeline you asked me to build already exists, and it is already a database rather than
static files in Git. `c1-kayak` is a Vercel cron that writes two Postgres tables in Supabase. The
`provider_snapshots` table already carries per-provider price, time-to-first-token, throughput and
uptime for every endpoint of every tracked model. The website never reads it. Widgets 1 and 2 are
therefore mostly a frontend job on data you are already paying to collect.

What is actually broken is not what the brief describes, and one of the four widgets cannot be built
at all. Ranked by how much they matter:

1. **The cron has not run since 5 August at 11:17 UTC.** It is scheduled `0 0 * * *`, so it should
   have fired at midnight on the 6th and did not. There is no `.vercel` link in the `c1-kayak`
   directory and the GitHub workflow is still a placeholder `echo` step, so the most likely
   explanation is that the project was never deployed. Nothing else on this list matters until that
   is confirmed.
2. **The zero effective prices have a specific cause and a verified fix.** This is the problem the
   project memory flagged as upstream. `lib/collect.ts` reads
   `const { id: canonicalSlug } = endpointsJson.data`, but that response has no `canonical_slug`
   field at all — the keys are `architecture`, `created`, `description`, `endpoints`, `id` and
   `name`. The collector therefore sends the plain model id as the `permaslug` query parameter, and
   OpenRouter's effective-pricing endpoint returns zeros for every model whose real permaslug is
   date-stamped. Only `google/gemini-2.5-flash` and `google/gemini-2.5-flash-lite` worked, because
   their permaslug happens to equal their id.
3. **One widget has no data source and a second cannot be built as written.** Detail in section 3.
4. **The brief's design direction and model list both describe something other than this site.**
   Detail in section 4.

### The permaslug fix, verified

The real permaslug is recoverable from any endpoint's `name` field, which is formatted
`"<provider> | <permaslug>"` — for example `"StreamLake | z-ai/glm-5.2-20260616"`. Taking the
substring after the pipe and re-querying gives real data:

| Model | Before the fix | After the fix |
|---|---|---|
| `z-ai/glm-5.2` | 0 providers, weighted input price 0 | 32 providers, $0.376/M, 80.3% cache hit rate |
| `deepseek/deepseek-v4-flash` | 0 providers, weighted input price 0 | 20 providers, $0.051/M, 67.6% cache hit rate |
| `moonshotai/kimi-k3` | 0 providers, weighted input price 0 | 12 providers, $0.676/M, 86.4% cache hit rate |

A more robust alternative is to read `canonical_slug` from `GET /api/v1/models`, which does expose
that field, and fall back to parsing the endpoint name. I would implement both, preferring the
catalogue field, because parsing a display string is fragile if OpenRouter ever changes the
separator.

---

## 2. What the existing data supports

Measured, not estimated. One complete run holds 202 endpoint rows across 20 models, which is
43.9 KB of raw JSON and **6.0 KB gzipped**. That number drives the whole frontend architecture in
part 3: the entire latest snapshot fits in a single small request, so every filter and every
comparison can be computed in the browser with no further network calls.

For `z-ai/glm-5.2` in the most recent run there are 33 providers, with listed input prices from
$0.600/M to $2.310/M. That is a **3.9x spread for identical weights**, which I assume is where the
"3.8x" in the brief came from. The headline the brief asks for is real and reproducible.

OpenRouter returns richer percentiles than the collector currently stores:

| Field | OpenRouter returns | Collector stores today |
|---|---|---|
| `latency_last_30m` | `p50`, `p75`, `p90`, `p99` | `p50`, `p90` only |
| `throughput_last_30m` | `p50`, `p75`, `p90`, `p99` | `p50` only |
| `quantization` | Per endpoint, for example `fp8` | Not stored |
| `uptime_last_*` | `5m`, `30m`, `1d` | `1d` only |
| `pricing.discount` | Present, for example `0.8` | Not stored |
| `context_length`, `max_completion_tokens` | Present | Not stored |

Two things follow. **There is no p95** anywhere in the source, so the tail-latency widget has to be
p50 against p90 against p99. And **OpenRouter's "latency" is time to first token**, not end-to-end
request duration — there is no total-latency metric available. I will name the columns `ttft_*`
rather than `latency_*`, because calling it latency invites us to imply we measure something we do
not.

---

## 3. Widget-by-widget verdict

| # | Widget | Verdict | Reasoning |
|---|---|---|---|
| 1 | Provider Arbitrage Matrix | Build now | Fully supported. Price, time to first token, throughput and uptime are already collected per endpoint. |
| 2 | Tail Latency and SLA Degradation | Build, respecified | Needs p75 and p99 added to the collector and two new columns. Charts p50 against p90 against p99, because p95 does not exist upstream. |
| 3 | Router Premium Index | Cannot build as specified; substitute proposed | Every row in `provider_snapshots` is a provider reached *through* OpenRouter, so OpenRouter's own markup is structurally absent from the data. Direct-provider pricing exists nowhere I could find: `~/.c1/provider-catalogs.json` holds model ids and canonical maps for Nebius, Baseten, Fireworks, Moonshot, Bedrock and Vercel, but no prices at all. Building this as written means a new price collector per provider, which is real scope and a separate project. |
| 4 | Quality-Adjusted True Cost per Pass | Cut from this build | Pass rates are produced by the CLI on a user's own machine and written to sqlite and static HTML under `<repo>/.c1/runs/`. Nothing uploads them, and this machine has no real runs — only a test fixture under `tests/fixtures/`. Separately, `/evals` sells the product on "nothing sits in your request path, and no dashboard or login stands between you and the result", so centrally harvesting customers' pass rates would contradict the pitch on the adjacent page. |

### The substitute for widget 3

The data does support a closely related and arguably sharper question: **what does accepting the
router's default endpoint cost you, versus the best endpoint available for the same weights?** We
hold all 33 endpoints for a model, so the penalty on price, on time to first token and on throughput
is directly computable. It needs no new collector and no new data source, and for a buyer deciding
whether to route or to pin a provider it is the more actionable number. I would ship this in slot 3
and label it honestly as routing choice cost, not as a router's margin.

---

## 4. Premise corrections

**The design brief describes a dark site with a `#FFFF00` accent. Neither is true.** The site is
cream, `--bg: #fafaf7`, with one dark header band on every page and cream below it. The accent is
`--accent: #FDE047`. DESIGN.md carries a hard contrast rule I intend to keep: `--accent-deep` on
cream measures 1.87:1, so on cream yellow may only be a fill behind dark text, never text itself, a
link underline, or a card's hover border. Yellow as a foreground colour is legal only on the dark
band. I will follow DESIGN.md rather than the brief, and the widgets will sit on cream with the dark
band reserved for the page header, as every other page does.

One consequence for the chart palette: `src/lib/prices.ts` already defines eight categorical hues
validated against this cream surface, and deliberately excludes canary yellow so no model looks like
the selected one. The market widgets will reuse that palette rather than introduce a second one.

**The model list does not match the audience.** The brief names Llama 3.3, DeepSeek-V3 and Qwen 2.5.
The tracked list in `settings.json` is OpenRouter's top 20 by traffic as of 5 August 2026, and 13 of
those 20 are closed models from Anthropic, Google and OpenAI. There is no Llama and no Qwen in it at
all. The open-weight models actually present are DeepSeek V4 Pro, DeepSeek V4 Flash in two dated
variants, GLM 5.2, Kimi K3, MiniMax M3, MiMo V2.5 in two variants, Step 3.7 Flash and Hy3 — all
newer than the three the brief names. If this page is for open-weight buyers, `settings.json` has to
change.

**The site's typography is a system font stack**, `-apple-system, BlinkMacSystemFont, "Segoe UI"`
and so on, with no webfont anywhere. This matters in exactly one place: server-side image generation
cannot use system fonts, because satori requires an embedded font buffer. The clipboard export path
is unaffected, because a browser canvas can draw with system fonts. Section 7 covers how I would
resolve it.

---

## 5. The four decisions, and what I have assumed

Interactive prompts were unavailable when I tried to ask, so each of these is my recommendation
rather than your answer. Each one changes the build, so override any of them at approval and I will
adjust before writing code.

| Decision | Assumed | Why, and what changes if you disagree |
|---|---|---|
| Where the page lives | `/market`, with a permanent redirect from `/prices` | The brief asks for `/market` and the nav already labels the `/prices` link "model market", so the rename removes an existing inconsistency rather than creating one. Astro's `redirects` config emits a real 301 once the Vercel adapter is in place. If you would rather not move it, everything else in this plan is unchanged. |
| Widget 4 | Cut from this build | Shipping three widgets on live data beats four where one is a single synthetic run sitting next to real ones. The alternative worth having later is an opt-in publish command in the CLI, which is its own project: a CLI change, an ingest endpoint, authentication, and a privacy decision that the `/evals` positioning makes non-trivial. |
| Where ingestion lives | Move the collector and schema into this repo | This is the one I would most like overridden, because `c1-kayak` works and has alerting and hooks already, and moving it couples data collection to marketing-copy deploys. I am recommending the move anyway for two reasons: your acceptance criteria ask for it explicitly, and adding the Vercel adapter for the API routes and OG images puts a server runtime and cron capability in this repo regardless, so the marginal cost of hosting a 150-line collector here is small. |
| Model list | Widen it: add Llama and Qwen families, keep the closed models | A superset loses nothing and closed models are the honest baseline an open-weight buyer is comparing against, which is itself a buying question the page should answer. The page defaults its filter to open weights only. |

---

## 6. Database schema

Four tables replace the current two. Two of the changes are structural fixes rather than new
features, and they are the reason I am proposing a migration rather than adding columns.

**Runs become first-class, so debug re-runs cannot corrupt a chart again.** The seven near-identical
snapshots taken between 10:52 and 11:17 on 5 August are a cron being re-run by hand during
debugging, and today nothing in the schema distinguishes them from real nightly data. A `kind`
column of `scheduled`, `manual` or `test` means the charts read only successful scheduled runs and a
future debugging session is invisible to the site.

**Writes become idempotent.** The collector currently plain-inserts, so any retry duplicates rows.
A natural primary key on `(run_id, model_id, provider_slug, endpoint_tag)` turns a retry into an
upsert. The `endpoint_tag` is part of the key because one provider can serve the same model through
several endpoints at different quantizations — `streamlake/fp8` is a real example — and
`(model, provider)` alone silently collapses them.

```sql
-- ─── Dimension: providers ────────────────────────────────────────────────────
-- Hand-curated. `kind` is what lets the page group by "who am I actually buying
-- from", and separates a GPU cloud reselling open weights from a first-party lab
-- serving its own model.
create table market_providers (
  slug          text primary key,          -- 'deepinfra', normalised from provider_name
  display_name  text not null,             -- 'DeepInfra'
  kind          text not null
    check (kind in ('gpu-cloud','first-party','hyperscaler','router')),
  logo_path     text,                      -- '/logos/deepinfra.svg', null when uncovered
  homepage      text
);

-- ─── Dimension: models ───────────────────────────────────────────────────────
-- Replaces the model list in settings.json as the source of truth. `weights` is
-- the column the whole page's audience filter depends on.
create table market_models (
  model_id    text primary key,            -- 'z-ai/glm-5.2'
  label       text not null,               -- 'GLM 5.2'
  permaslug   text,                        -- 'z-ai/glm-5.2-20260616', refreshed each run
  weights     text not null check (weights in ('open','closed')),
  license     text,                        -- 'MIT', 'Apache-2.0', 'custom', null if unknown
  params_b    numeric,                     -- 235, null when the vendor does not publish it
  is_tracked  boolean not null default true,
  sort_order  integer
);

-- ─── Fact: collection runs ───────────────────────────────────────────────────
create table market_runs (
  id            uuid primary key default gen_random_uuid(),
  started_at    timestamptz not null,
  finished_at   timestamptz,
  kind          text not null default 'scheduled'
    check (kind in ('scheduled','manual','test')),
  status        text not null default 'running'
    check (status in ('running','ok','partial','failed')),
  models_ok     integer not null default 0,
  models_failed integer not null default 0,
  error         text
);

create index on market_runs (kind, status, started_at desc);

-- ─── Fact: one row per endpoint per run ──────────────────────────────────────
-- Replaces provider_snapshots. Named ttft_* rather than latency_* because
-- OpenRouter's latency metric is time to first token; no end-to-end request
-- duration is available from this source and the column name should not imply
-- one.
create table market_endpoint_snapshots (
  run_id                uuid not null references market_runs(id) on delete cascade,
  collected_at          timestamptz not null,
  model_id              text not null references market_models(model_id),
  provider_slug         text not null references market_providers(slug),
  endpoint_tag          text not null default '',   -- 'streamlake/fp8'
  quantization          text,                       -- 'fp8','bf16','int4', null if unstated
  context_length        integer,
  max_completion_tokens integer,

  -- Prices are dollars per single token, matching the existing tables. Every
  -- display converts to dollars per million.
  input_price           numeric,
  output_price          numeric,
  cache_read_price      numeric,
  discount              numeric,                    -- pricing.discount, 0-1
  eff_input_price       numeric,                    -- after observed caching
  eff_output_price      numeric,
  cache_hit_rate        numeric,                    -- 0-1

  ttft_p50_ms           numeric,
  ttft_p75_ms           numeric,
  ttft_p90_ms           numeric,
  ttft_p99_ms           numeric,
  tps_p50               numeric,
  tps_p75               numeric,
  tps_p90               numeric,
  tps_p99               numeric,

  uptime_30m            numeric,                    -- 0-100
  uptime_1d             numeric,
  status_code           integer,                    -- endpoint 'status'
  total_tokens_1d       bigint,

  primary key (run_id, model_id, provider_slug, endpoint_tag)
);

create index on market_endpoint_snapshots (model_id, collected_at desc);
create index on market_endpoint_snapshots (provider_slug, collected_at desc);

-- ─── Fact: one row per model per run ─────────────────────────────────────────
-- A thin rollup. Kept because the existing Time Machine chart is model-level and
-- because a 90-day model-level series should not have to scan every endpoint row.
create table market_model_snapshots (
  run_id             uuid not null references market_runs(id) on delete cascade,
  collected_at       timestamptz not null,
  model_id           text not null references market_models(model_id),
  permaslug          text,
  listed_input_price   numeric,
  listed_output_price  numeric,
  cache_read_price     numeric,
  weighted_input_price  numeric,
  weighted_output_price numeric,
  weighted_cache_hit_rate numeric,
  endpoint_count     integer,
  provider_count     integer,
  -- Computed at write time because it is the page's headline and recomputing it
  -- per request over every endpoint is wasteful for a value that changes daily.
  min_input_price    numeric,
  max_input_price    numeric,
  price_spread_ratio numeric,                       -- max/min, the "3.9x" number
  best_ttft_p50_ms   numeric,
  best_tps_p50       numeric,
  primary key (run_id, model_id)
);
```

Row-level security keeps the current shape: `anon` may select, only `service_role` may write. The
website's read path uses the anon key; only the collector holds the service-role key.

### Aggregation

Two read helpers, so no API route ever scans raw history.

```sql
-- The newest run that actually succeeded and was scheduled. Every "current
-- state" query starts here, which is what makes a debug run invisible.
create view market_current_run as
  select id, started_at
    from market_runs
   where kind = 'scheduled' and status in ('ok','partial')
   order by started_at desc
   limit 1;

-- One row per model per day, taken from that day's last successful scheduled
-- run rather than averaged. A daily series means "the value at the nightly
-- snapshot", and averaging several same-day debug runs would misrepresent it.
create materialized view market_endpoint_daily as
  select date_trunc('day', s.collected_at) as day,
         s.model_id, s.provider_slug, s.endpoint_tag,
         s.input_price, s.output_price,
         s.ttft_p50_ms, s.ttft_p75_ms, s.ttft_p90_ms, s.ttft_p99_ms,
         s.tps_p50, s.tps_p90, s.uptime_1d
    from market_endpoint_snapshots s
    join (
      select date_trunc('day', r.started_at) as day, max(r.started_at) as pick
        from market_runs r
       where r.kind = 'scheduled' and r.status in ('ok','partial')
       group by 1
    ) d on d.day = date_trunc('day', s.collected_at)
   where s.collected_at = d.pick;

create unique index on market_endpoint_daily (day, model_id, provider_slug, endpoint_tag);
```

The materialized view is refreshed concurrently at the end of each successful run, which is cheap at
this data volume and means the reliability charts read a few hundred rows instead of scanning the
fact table.

### Migration and backfill

The existing 121 model rows and 1,214 provider rows are all from one morning of debug runs, and
their effective-pricing columns are the zeros caused by the permaslug bug. They have no analytical
value. I would create the new tables alongside the old ones, import the old rows into a single run
marked `kind = 'test'` so nothing is destroyed, point the site at the new tables, and drop the old
ones only once the new collector has produced several real nightly runs. That keeps the change
reversible and means `/prices` never serves an empty chart during the transition.

---

## 7. Ingestion

### Where it runs

Moving into this repo as `src/pages/api/cron/collect.ts`, a Vercel cron entry point. The mechanics
are unchanged from `c1-kayak`: a `vercel.json` cron block calls the path daily, the handler checks a
`CRON_SECRET` bearer token, and a Resend email fires on partial or total failure.

Two constraints worth stating before you approve the move. Vercel's Hobby plan permits **daily
crons only, and at most two of them**, so a nightly schedule is the only option available and there
is room for exactly one more job later. And a cron in this repo means a marketing-copy commit
redeploys the collector; that is the cost I flagged in section 5, and the mitigation is that the
collector is a pure function of `settings` plus OpenRouter, so a redeploy has no state to lose.

### What the collector does differently

Five changes, in order of how much they matter:

1. **Resolve the permaslug properly.** Read `canonical_slug` from `GET /api/v1/models`, which does
   expose it, and fall back to parsing the `"<provider> | <permaslug>"` endpoint name. This is the
   fix from section 1 and it is what makes effective pricing, cache hit rates and therefore any
   honest cost number work at all.
2. **Open a run row first, close it last.** `market_runs` gets a `running` row before any fetching,
   and is updated to `ok`, `partial` or `failed` at the end with the counts. A crashed invocation
   leaves a `running` row that the `market_current_run` view ignores, so a half-written run can never
   reach the page.
3. **Store every percentile.** `p75` and `p99` for both time to first token and throughput, plus
   `quantization`, `endpoint_tag`, `context_length`, `discount` and the shorter uptime windows.
4. **Upsert rather than insert**, on the natural key from section 6, so a retry is idempotent.
5. **Compute the model rollup from the endpoint rows**, including the spread ratio, rather than
   deriving it per request in the browser.

One behavioural note on the existing code that I would keep: `collect.ts` fans out over all 20
models with `Promise.all`, and the spec's flow diagram says sequential "respect rate limits". The
parallel version has evidently been working, but 20 models times two API calls in one burst is the
kind of thing that starts returning 429s as the model list grows. I would add a small concurrency
limit of about 5 rather than leave it unbounded — it costs nothing at this size and removes a
failure mode that only appears once you widen the model list, which decision 4 does.

### Seeding the dimension tables

`market_models` and `market_providers` need initial content. Models come from the existing
`settings.json` list plus the Llama and Qwen additions, with `weights` set by hand — that flag is a
judgement call about licensing, not something to infer from a model id. Providers can be seeded from
the distinct `provider_name` values already in the database, which is 33 names for GLM 5.2 alone, and
then annotated with `kind` and a logo path by hand. The collector should insert an unknown provider
with `kind = 'gpu-cloud'` and no logo rather than fail, and log it, so a new entrant appears in the
data immediately and gets curated later.

---

## 8. API design

The site is currently a fully static Astro build with no adapter. Adding `@astrojs/vercel` does not
mean giving that up: in Astro 5 the default `output: 'static'` prerenders every page, and individual
routes opt into server rendering with `export const prerender = false`. So every marketing page keeps
building exactly as it does now, and only the API routes, the OG image endpoint and the market page
shell run on demand. That is a materially smaller change than switching the whole site to server
output, and it is what I would do.

### The routes

The measurement in section 2 drives this. One complete run is 202 rows, 43.9 KB raw, **6.0 KB
gzipped**. The entire current market state fits in one small response, so there is no reason to build
a chatty per-widget API.

| Route | Returns | Cache | Notes |
|---|---|---|---|
| `GET /api/market/snapshot` | The whole latest successful run: every endpoint for every tracked model, plus the model rollups and the dimension tables it references | `s-maxage=1800, stale-while-revalidate=86400` | About 6 KB gzipped. Every widget and every filter reads this one payload. |
| `GET /api/market/overview` | Hero figures only: the largest spread and which model it belongs to, tracked model and provider counts, and the timestamp of the last successful run | Same | Roughly 1 KB. Exists so the page shell and the OG endpoint can render a headline without pulling the full snapshot. |
| `GET /api/market/history?model=<id>&days=30` | Daily series from `market_endpoint_daily` for one model: p50, p90 and p99 time to first token, throughput and uptime per endpoint | `s-maxage=3600` | Fetched only when a reader opens the reliability view, because it is the one payload that grows with history. |
| `GET /api/market/og/<widget>.png` | A generated Open Graph image | `s-maxage=86400` | Section 9. |

`days` is clamped server-side to a maximum of 90, so a crafted request cannot ask the database for
everything. All four routes read through the anon key with row-level security, so the web app never
holds a service-role credential.

Because data changes once daily, a 30-minute edge cache means the database sees a handful of queries
per day regardless of traffic. That is the answer to the brief's requirement to serve aggregated data
"without loading full raw history on client render": the client loads one 6 KB aggregate, and raw
history is never sent at all.

### A hygiene win worth taking

`src/lib/prices.ts` currently hardcodes the Supabase anon key and ships it to the browser, with a
comment explaining that this is deliberate because the key is read-only. That reasoning is sound, but
once these routes exist the browser has no reason to talk to Supabase directly. Moving the query
server-side removes the key from the client bundle entirely and gives us edge caching for free. I
would migrate `/prices` onto `/api/market/history` at the same time rather than leave two data paths
to the same tables.

---

## 9. Frontend architecture

### Charting library: stay on Chart.js

The brief suggests Recharts or Tremor. I would reject both, for a reason that is about this repo
rather than about the libraries: **Recharts and Tremor are React, and this repo has no framework
integration at all.** Adding React, `@astrojs/react` and a component library to obtain a scatter plot
is a large permanent change to the build, the bundle and the mental model of every future page, and
the thing it buys is already present.

Chart.js 4.5.1 is already a dependency with a working, carefully commented integration in
[prices.astro](src/pages/prices.astro) — registered controllers, a shared crosshair tooltip, a
logarithmic axis toggle, and the eight-hue palette from `prices.ts`. It draws scatter and line, which
is all four widgets need.

There is also a concrete second argument, which is your export acceptance criterion. Chart.js renders
to a real `<canvas>`, so exporting means compositing actual canvas pixels — no DOM rasterisation, no
font-substitution guesswork. `html2canvas` re-implements CSS layout in JavaScript and is unreliable
precisely where this site is opinionated: system font stacks, subpixel spacing, and CSS variables.
Choosing Chart.js makes the crisp-PNG criterion easy instead of a fight.

| Need | Chart.js approach |
|---|---|
| Arbitrage matrix | `scatter` type, price on one axis and time to first token on the other, bubble radius from throughput |
| Tail latency | `line` type, three series per endpoint for p50, p90 and p99 |
| Routing cost | Horizontal `bar`, default pick against best available |
| Provider table | Plain HTML, not a chart; exported server-side per section 10 |

### Component tree

No framework, so the pattern follows `/prices`: Astro components for markup, one bundled client
module per interactive concern, and communication through a tiny shared store rather than a
framework's state.

```
src/pages/market.astro                 prerender = false; server-renders hero + shell
  src/components/market/
    HeroHeadline.astro                 the daily anomaly sentence, server-rendered
    ModelSelector.astro                multi-select, open/closed filter, sort controls
    ChartFrame.astro                   slot wrapper: title, note, export button, embed button
      ArbitrageMatrix.astro            <canvas> + legend
      TailLatency.astro                <canvas> + endpoint picker
      RoutingCost.astro                <canvas>
      ProviderTable.astro              sortable HTML table
    CoverageNote.astro                 honest description of how much history exists
    EmbedModal.astro                   iframe snippet, copy button

  src/lib/market/
    types.ts                           shared row and payload types
    derive.ts                          spread ratio, routing penalty, sort comparators
    format.ts                          re-exports the money and date formatters from prices.ts

  src/scripts/market/
    store.ts                           selected models, filters, sort; publishes on change
    snapshot.ts                        fetches /api/market/snapshot once, caches in memory
    chart-arbitrage.ts                 subscribes to the store, updates the scatter in place
    chart-latency.ts                   lazily fetches /api/market/history on first open
    export-png.ts                      the branded frame compositor
    embed.ts                           modal + clipboard for the iframe snippet
```

`format.ts` re-exporting rather than reimplementing matters: `prices.ts` already has
`formatUsdPerM`, `formatSnapshotFull` and `describeCoverage`, and `describeCoverage` in particular
already handles the "all seven snapshots are from one morning" case honestly. That function is
exactly what this page needs while the history is still thin, and duplicating it would let the two
pages drift into telling the reader different things.

### How client-side filtering meets the acceptance criterion

`snapshot.ts` fetches the 6 KB payload once on load. Every subsequent interaction — changing model,
filtering to open weights, re-sorting the table, switching axes — is a pure function over data
already in memory, and updates the charts through `chart.update()` rather than re-creating them. No
interaction touches the network, so there is nothing to be slow. The only lazy fetch is the
historical reliability view, which is the one payload that grows over time.

### A sequencing problem worth naming now

The historical reliability view and the tail-latency time series both need history, and there is
currently **one morning of it**. Until the nightly cron has run for a couple of weeks, those two
widgets will render a nearly vertical slice and look broken even though they are correct. This is the
same trap the project memory records. Two mitigations, and I would do both: reuse
`describeCoverage()` so the page states in words how much history exists, and treat the two
history-dependent widgets as the last things built, so the cron is accumulating real days while the
arbitrage matrix and routing widgets — which need only the latest run — are being finished.

---

## 10. Export and sharing engine

Three distinct mechanisms, because one does not fit all three surfaces.

**Chart PNG to clipboard, no new dependencies.** For any canvas widget: create an offscreen canvas at
twice device pixel ratio, paint the dark branded frame with the Canvas 2D API, `drawImage` the chart's
own canvas into it, then `toBlob()` and
`navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`. The frame carries the
CanaryOne logo, the snapshot timestamp from the run, and `canaryone.ai/market`, per the brief. Because
the source is already a canvas the output is genuinely crisp rather than a rasterised approximation.
Safari needs the `ClipboardItem` promise form and Firefox has historically not supported image writes
at all, so the fallback is a direct PNG download — the button reads "copy image" where the API exists
and "download image" where it does not, rather than failing silently.

The dark frame is worth a note against section 4: the exported image is its own surface, not part of
the cream page, so canary yellow is legal as a foreground there. That is consistent with DESIGN.md's
rule rather than an exception to it, and it is why a shared image can look like the brand.

**HTML widgets and OG images, server-side.** The provider table is not a canvas, and rasterising a
table in the browser is exactly where `html2canvas` disappoints. Those go through
`/api/market/og/<widget>.png`, generated with satori and resvg — which is what `@vercel/og` wraps, and
either entry point is fine on the Vercel Node runtime.

One constraint from the audit: **satori cannot use system fonts.** This site's entire type stack is
`-apple-system, BlinkMacSystemFont, "Segoe UI"` with no webfont anywhere, so a generated image has no
font to load. We must pick one concrete face, commit the `.woff2`, and load it as an `ArrayBuffer` in
the endpoint. Inter or a similar neutral grotesque is the closest match to the macOS and Windows
system faces the site actually renders in, so an exported image will look near-identical to a
screenshot on those platforms but will not be byte-identical. That is a small deliberate divergence,
and the alternative — adding a webfont to the site itself so they match exactly — is a design decision
I would not make silently.

**Embed snippets.** The modal offers an `<iframe>` pointing at `/market/embed/<widget>?model=<id>`, a
minimal prerendered-shell route that renders one widget with no nav, no footer and no page chrome,
sized for a blog column. It reads the same `/api/market/snapshot` payload, so an embed stays current
without the embedding site doing anything.

---

## 11. What I would build, in order

Each step is shippable and verifiable on its own, and the ordering is chosen so the cron accumulates
history while the parts that do not need history are being built.

| Step | Work | Why here |
|---|---|---|
| 1 | Confirm whether `c1-kayak` is deployed, and get one real scheduled run to land | Everything downstream is unverifiable until data is arriving. This may turn out to be the only real blocker. |
| 2 | New schema, dimension seeds, old rows imported as one `kind = 'test'` run | Reversible, and `/prices` keeps working throughout. |
| 3 | Rewritten collector with the permaslug fix, all percentiles, run rows and upserts | Turns on effective pricing and cache hit rates, which nothing has had until now. |
| 4 | `@astrojs/vercel` adapter, `/api/market/snapshot` and `/api/market/overview` | The data layer the whole page reads. Verifiable with `curl` before any UI exists. |
| 5 | Page shell, hero, model selector, arbitrage matrix, provider table | The half of the page that needs only the latest run. |
| 6 | Export compositor, embed modal, OG endpoint | Your export acceptance criterion, testable against step 5. |
| 7 | Routing cost widget | Needs only the latest run, but depends on provider `kind` curation from step 2. |
| 8 | Tail latency and historical reliability views | Last, so there are real days of history to draw by the time they exist. |
| 9 | Redirect `/prices` to `/market`, migrate the Time Machine chart onto the new API | Retires the second data path and the client-side Supabase key together. |

---

## 12. Open risks

**The cron may not be deployed, and I cannot check from here.** No Vercel token is available in this
environment, so "never deployed" is inference from a missing `.vercel` directory, a placeholder CI
workflow, and a midnight run that did not happen. It could equally be deployed and failing. This is
the first thing to check and the only item that could invalidate the schedule in section 11.

**Prices in the database disagree with prices in the API right now.** The stored StreamLake row for
GLM 5.2 has an input price of $0.685/M, while the live endpoint returns `0.00000028` with a
`discount` of `0.8`, which is $0.28/M. I have not established whether `pricing.prompt` is quoted
before or after the discount, or whether the price simply moved in the intervening day. It matters,
because the arbitrage headline is a ratio of these numbers and a mixed convention would corrupt it.
This needs settling against OpenRouter's documentation before step 3, and it is the reason I am
storing `discount` as its own column rather than folding it into the price.

**A 30-minute edge cache means the page can be half an hour stale.** For daily data that is
invisible, but the "updated" stamp must come from the run's `started_at` and never from request
time, or the page will claim freshness it does not have.

**Widening the model list multiplies the endpoint rows.** Twenty models produce 202 endpoint rows.
Adding the Llama and Qwen families, which are served by many providers each, could plausibly double
or triple that. At 600 rows the snapshot payload is still around 18 KB gzipped and the architecture
holds, but it is worth re-measuring after decision 4 rather than assuming.

**`quantization` is self-reported and often absent.** It is the honest input to any quality-loss
story, but a null does not mean full precision, it means the provider did not say. Any display has to
distinguish "bf16", "fp8" and "not stated" as three states rather than two.
