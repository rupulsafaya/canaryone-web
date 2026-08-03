---
date: "2026-07-27"
title: "Host metadata for GLM 5.2"
summary: "Host metadata for one model, read from a gateway API."
kind: "metadata-scan"
sourceFile: "outreach/results/2026-07-27-glm52-host-metadata.md"
---

# Run — host metadata for GLM 5.2

A metadata scan rather than a measurement. It reads a gateway's endpoint listings without running any
inference, which makes it free, fast and independently verifiable.

## Identity

| Field | Value |
|---|---|
| Run date | 2026-07-27, captured at 19:21:44 UTC |
| Run identifier | `a3-glm52` |
| Kind of run | Metadata scan. Live read of a gateway's endpoint listing for one model. |
| Source | The gateway's model-endpoints API, read live |
| Model | `z-ai/glm-5.2` |

⚠️ **This capture is from 27 July and metadata moves within days.** Treat the shape of the finding as
durable and every specific figure as needing a fresh pull before publication. A host count or a price
quoted from a week-old scan is the easiest avoidable error in this whole category.

## The table

| Fact | Value |
|---|---|
| Hosts advertised | 7 |
| Hosts live | 5 |
| Hosts deranked or disabled | 2, being 29% |
| Input price spread across live hosts | 2.76× |
| Output price spread across live hosts | 2.73× |
| Cheapest input | $0.760 per million, CoreWeave at fp4 |
| Dearest input | $2.100 per million, Wafer at fp4 |
| Hosts not disclosing quantization | 1 of 5 |
| Precision and price inversions | 2 host pairs |

### The precision inversions, which are the finding

A host charging more to serve a coarser model than another host charges for a finer one.

| Better precision, cheaper | Worse precision, dearer | Premium |
|---|---|---|
| Baidu at fp8, $0.770 | Wafer at fp4, $2.100 | 173% more |
| Z.AI at fp8, $1.400 | Wafer at fp4, $2.100 | 50% more |

### All live hosts, cheapest input first

| Host | Quantization | Input per million | Output per million | Context | Uptime, 30 minutes |
|---|---|---|---|---|---|
| CoreWeave | fp4 | $0.760 | $2.420 | 262,144 | 99.0% |
| Baidu | fp8 | $0.770 | $2.420 | 1,048,576 | 99.8% |
| Alibaba | unknown | $0.826 | $2.596 | 1,048,576 | 99.7% |
| Z.AI | fp8 | $1.400 | $4.400 | 1,048,576 | 99.9% |
| Wafer | fp4 | $2.100 | $6.600 | 1,048,576 | 100.0% |

### The two deranked hosts, excluded from the sweep

Both were advertised and both were disabled by the gateway at capture time. That a model advertises seven
hosts and serves five is itself a finding.

## What this run supports

-
- **The precision inversion.** Two host pairs on this one model where the higher-precision endpoint is
 cheaper than the lower-precision one, by 173% and 50%.
- **Advertised host count overstates available host count.** Seven advertised, five live, two deranked, which
 is 29% of the list.
- **Quantization is not disclosed consistently.** One of five live hosts on this model would not say.
- **Quantization does not predict price in either direction.** The cheapest and the dearest host on this
 model are both serving fp4. A separate eight-host run on a different model showed the same thing.

## What this run does not support

- **No quality claim whatsoever.** This is a price and metadata read. It says nothing about whether any of
 these hosts produces correct answers, which is exactly the axis the public comparisons already cover and
 we exist to add. Quality on these hosts requires a completed sweep, which is
 [the commissioned sweep](/runs/2026-07-28-commissioned-sweep-14-routes).
- **No claim that the price spread costs you 2.76 times as much.** It is a list-price spread. What you
 actually pay depends on cache behaviour and token burn, which is the whole point of the sweep and is
 precisely where the list-price order came out reversed.
- **Nothing about the two deranked hosts beyond the fact that they were deranked at capture time.** Do not
 speculate about why, and do not publish a judgement about either.
- **Nothing current.** See the staleness warning at the top.

## Reconciliation

Consistent with [the commissioned sweep](/runs/2026-07-28-commissioned-sweep-14-routes), which ran the day
after this capture on the same five live hosts. Note that the sweep's realised ordering is almost the
reverse of the price ordering here,
