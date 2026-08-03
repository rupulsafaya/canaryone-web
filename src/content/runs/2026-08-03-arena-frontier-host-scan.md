---
date: "2026-08-03"
title: "Host count and price spread for the five models on Arena's Pareto frontier"
summary: "Metadata scan of the five models on Arena's Pareto frontier."
kind: "metadata-scan"
sourceFile: "outreach/results/2026-08-03-arena-frontier-host-scan.md"
---

# Scan — host count and price spread for the five models on Arena's Pareto frontier

A metadata scan, not an inference run. It costs nothing, took about ten minutes, and it is
independently verifiable by anyone with a browser, because the endpoint API it reads is public and
unauthenticated.

**The trigger.** Arena posted a cost-performance Pareto frontier for Frontend Code Arena at
2026-08-03T03:12 UTC, which drew 69,166 impressions in its first twelve hours. The post names five
models on the frontier — Claude Opus 5, Kimi K3, Qwen3.8-Max, GLM 5.2 and DeepSeek V4 Flash — and gives
Qwen3.8-Max a single price of $2 per million input tokens and $6 per million output.

The scan asks one question of that chart: **is a model a point on a price axis, or is it a range?**

## Identity

| Field | Value |
|---|---|
| Capture date | 2026-08-03, endpoint files written 14:38 local time |
| Kind of run | **Metadata scan.** No inference was run, nothing was billed, and no quality claim can come out of it. |
| Source | OpenRouter's public endpoints API, `GET /api/v1/models/{author}/{slug}/endpoints`, plus `/api/v1/models` for the availability check. No authentication required. |
| Captured by | Bhaskar, from the strategy repository |
| Prices | List prices, converted to dollars per million tokens. Input price is used for every spread figure below. |
| Live endpoint definition | The API returns a `status` field. An endpoint with status 0 is treated as live; negative values are excluded from the "live" counts. Both counts are given because the difference matters on Kimi K3. |

## The table

| Model | Weights | Endpoints, all | Endpoints, live | Input price spread, live | Live range |
|---|---|---|---|---|---|
| Claude Opus 5 | Closed | 7 | 7 | 1.10× | $5.000 to $5.500 |
| Kimi K3 | Open | 11 | 7 | 1.50× | $3.000 to $4.500 |
| GLM 5.2 | Open | 34 | 30 | 3.27× | $0.706 to $2.310 |
| DeepSeek V4 Flash | Open | 21 | 20 | 2.27× | $0.088 to $0.200 |
| Qwen3.8-Max | — | **0** | **0** | Not applicable | Not on OpenRouter at capture time |

**Qwen3.8-Max is absent from OpenRouter entirely, and the reason is not propagation delay.** The models
list holds 337 entries and the newest Qwen is `qwen/qwen3.7-max`. Qwen's own account announced at
2026-08-03T02:56 UTC that the model is available on Qwen Cloud and that **the open weights are released
next week**, alongside Qwen3.8-27B going open-weights.

So at capture time Qwen3.8-Max is a single-vendor API model with one price, which is why it sits on
Arena's frontier as a single point quite legitimately. **In about a week it becomes an open-weight model
and acquires a host population.**

### Precision disclosure

Counted only on the open-weight models, because quantization is not a meaningful attribute of a closed
vendor API and all seven Opus 5 endpoints report it as unknown for that reason.

| Model | Endpoints not stating precision | Precisions offered |
|---|---|---|
| GLM 5.2 | 9 of 34 | fp4, fp8, and unstated |
| Kimi K3 | 6 of 11 | fp8, mxfp4, and unstated |
| DeepSeek V4 Flash | 7 of 21 | fp4, fp8, and unstated |

### The precision inversion is live on GLM 5.2 right now

Baidu serves fp8 at $0.756 per million input tokens. Wafer serves fp4, a coarser precision, at $2.100.
That is 2.8 times the price for the coarser weights. Nearer the bottom of the table the two precisions
sit on top of each other: Decart's fp4 at $0.720 against Baidu's fp8 at $0.756, a difference of five
percent between two different precisions.

### The same provider sells the same model at more than one price

Recorded because it is striking and because **the mechanism is not confirmed.**

| Model | Provider | Prices | Ratio |
|---|---|---|---|
| GLM 5.2 | Alibaba | $0.966 and $2.310 | 2.39× |
| GLM 5.2 | Wafer | $1.260 and $2.100 | 1.67× |
| GLM 5.2 | Fireworks, Cloudflare, BaseTen | $1.400 and $2.100 each | 1.50× |
| Kimi K3 | Morph | $2.900 and $6.000 | 2.07× |

The likely explanation is throughput tiers or context-window variants sold as separate endpoints, and in
the Alibaba case both rows report the same precision and the same context length, which does not fit that
explanation.

## What this scan supports

- **Four of the five models on the frontier do not have a price, they have a range.** GLM 5.2 alone is
 served by thirty live endpoints spanning 3.27 times on input price. A chart that gives each model one
 price has projected that range onto a single point.
- **The closed model is the flat one.** Claude Opus 5 spans
 1.10 times across seven endpoints and the entire difference is one provider's premium tier. Every
 open-weight model on the same frontier spans between 1.50 and 3.27 times. There is no route to arbitrage
 on a closed model and there is real spread on open weights.
- **This replicates the 28 July commissioned sweep's null result by a completely different method.** That
 run tested five ways to buy Opus 5 with real inference and found no meaningful arbitrage. This scan
 reaches the same conclusion from list prices alone, for nothing. Two independent methods agreeing is
 worth more than either alone.
- **Between a quarter and a half of open-weight endpoints do not say what precision they serve.**

## What this scan does not support

- **No quality claim of any kind.** No inference was run. Nothing here says whether any endpoint returns
 good output, and the entire point of our own argument is that price rank and quality rank differ.
- **No claim about what anyone actually pays.** These are list prices. The 28 July sweep exists precisely
 because list price order and paid order came out almost exactly reversed once prompt-cache hit rates
 were accounted for.
- **No verdict about any host,** including the ones with the widest internal price gaps.
- **Nothing about Qwen3.8-Max** beyond its absence from one gateway at one moment. No quality claim, no
 price claim, no availability claim about any other route to it.
- **The same-provider price gaps,** until the mechanism is confirmed.
- **This goes stale within days.** Host counts and prices on a newly launched model move hourly.

## Reconciliation

- **Against run three, the GLM 5.2 host metadata scan of 27 July.** That capture is a week old and this one
 supersedes it for any current claim. A deliberate diff of the two would be a drift finding on host
 population and price, which is worth doing and is not done here.
- **Against run one, the commissioned sweep of 28 July.** The five hosts measured there — baidu, alibaba,
 wafer, z-ai and coreweave — all still serve GLM 5.2 today. Their list prices have moved: baidu was $0.77
 and is now $0.756, alibaba was $0.83 and is now $0.966, wafer's higher tier was $2.10 and still is, z-ai
 was $1.40 and still is, coreweave was $0.76 and still is. **Alibaba is up about 16 percent in six days**,
 which is the kind of movement the drift format exists to catch.
- **Nothing here contradicts anything in the verified-numbers file.** It adds a current host-population
 figure where we previously had only a one-model snapshot from 27 July.
