---
date: "2026-07-28"
title: "Fourteen routes across three frontier models"
summary: "Fourteen routes, three frontier models, 195 cells, $42.30."
kind: "commissioned-sweep"
routes: "14"
spend: "$42.30"
sourceFile: "outreach/results/2026-07-28-commissioned-sweep-14-routes.md"
---

# Run — fourteen routes across three frontier models

The deepest and most defensible measurement we have.

## Identity

| Field | Value |
|---|---|
| Run date | 2026-07-28 |
| Run identifier | Referenced as the 28 July findings report in the measurement repository |
| Kind of run | Commissioned hosted sweep. It has a committed write-up, which means a reader can in principle be pointed at something. |
| Raw output location | The measurement repository, in three per-arm directories under `_scratch/`, named `stageA1-20260728T101410`, `stageA2-20260728T134310` and `stageA3-20260728T123239`. Each holds `runs.jsonl` with one record per cell, plus per-cell configs, transcripts, an endpoint snapshot and the grid. A dated findings report and a technical companion sit in `reports/`. Not stored in this folder. |
| Independently recomputed | 2026-08-03, from `runs.jsonl` alone. Every figure in the tables below reproduced exactly: the five GLM per-host costs to four decimal places, 93 of 100 and 43 of 50 on pass counts, the $0.613 to $0.749 Opus range, and $28.93 of Opus spend. |

⚠️ **One trap for anyone recomputing this.** `cost_actual_usd` is zero in all 195 cells and the real
figures are in `cost_reported_usd`. Summing the wrong field returns zero for every host, which looks like
a free run rather than a bug.

## Method

Fourteen routes across three frontier models, arranged as three arms, one per model. Graded on file and
test assertions rather than an LLM judge, which is why the numbers here are more defensible than any run
that depends on a judge. Run serially on an uncontended machine, which is what makes the latency figures
usable. Timeouts were counted as real results rather than discarded, because they are billed.

| Field | Value |
|---|---|
| Models | GLM 5.2, Claude Opus 5, Kimi K3 |
| Routes | 14 |
| Tasks | 10 real coding tasks |
| Repeats per cell | 2 on the GLM arm, 1 on the others |
| Total cells | 195 |
| Grading | File and test assertions. No LLM judge. |
| Serial or parallel | Serial, on an uncontended machine |
| Cells excluded | Harness crashes excluded, of which there were 0 of 195 |
| Total spend | $42.30 |

## The table

### The three arms

| Arm | Model | Hosts | Pass rate | Cost per completed task | Spread |
|---|---|---|---|---|---|
| A3 | GLM 5.2 | 5 of 5 | 93 of 100, 93% | $0.0351 to $0.0514 | 1.46× |
| A2 | Claude Opus 5 | 5 of 5 | 43 of 50, 86% | $0.613 to $0.749 | 1.22× |
| A1 | Kimi K3 | 3 of 4 | 26 of 45, 58% | $0.291 to $0.809 | 2.78× |

### The GLM 5.2 host table

| Host | List price, input per million | Prompt cache hit rate | Full-price input tokens per run | Cost per completed task |
|---|---|---|---|---|
| baidu, fp8 | $0.77 | 87.5% | 18,114 | $0.0351 |
| alibaba | $0.83 | 89.8% | 19,977 | $0.0417 |
| wafer, fast tier | $2.10 | 86.0% | 22,828 | $0.0429 |
| z-ai, fp8 | $1.40 | 88.2% | 19,840 | $0.0441 |
| coreweave, fp4 | $0.76 | 69.0% | 44,351 | $0.0514 |

Ranked by list price: CoreWeave, Baidu, Alibaba, Z.AI, Wafer. Ranked by what we actually paid: Baidu,
Alibaba, Wafer, Z.AI, CoreWeave. Almost exactly reversed.

### Timeouts are billed

| Arm | Cells | Non-completing | Spend on work that never completed |
|---|---|---|---|
| A1, Kimi K3 | 45 | 19 | $4.26 of $9.37, or 45.4% |
| A2, Opus 5 | 50 | 7 | $2.23 of $28.93, or 7.7% |
| A3, GLM 5.2 | 100 | 7 | $0.15 of $4.00, or 3.8% |
| All arms | 195 | 33 | $6.64 of $42.30, or 15.7% |

## The mechanism

**The cache, not the rate.** CoreWeave and Baidu list within a cent of each other on input and have the
identical cache-read price at $0.14 per million. CoreWeave still came out dearest per completed task,
because it billed 2.4 times more full-price input tokens per run, 44,351 against 18,114, with a prompt-cache
hit rate of 69.0% against 87.5%.

## What this run supports

- **The cheapest endpoint on paper was the most expensive per completed task, on identical weights.** The
 list-price order and the actually-paid order came out almost exactly reversed across five hosts of one
 model, and the driver was prompt-cache hit rate rather than the rate card.
- **Timeouts are billed, so ranking on raw cost is wrong.** Across all arms, 15.7% of spend went on work
 that never completed, and on the worst arm it was 45.4%.
- **There is no host arbitrage on a closed model.** Five ways to buy Claude Opus 5, being the vendor direct,
 Bedrock, Azure, Vertex global and Vertex Europe. List price is identical on four of the five, and pass
 rates all land between 80% and 90% with overlapping intervals. The cost differences observed are
 trajectory noise at one repeat per cell. **The host axis exists on open weights, which is the real
 claim, and this arm sharpens it rather than supporting it.**
- **A cheap model matched a frontier model at roughly a seventeenth of the price per completed task, and
 the reason is our suite rather than the models.** GLM 5.2 passed 93 of 100, Opus 5 passed 43 of 50. nine of the ten tasks were too easy to separate them, and on the one genuinely
 hard task Opus went 5 for 5 while GLM went 5 for 10. Opus also never returned a wrong answer, since all
 seven of its misses were timeouts.
- **Z.AI's own endpoint was the slowest of the five hosts running its own model,** at a 61 second median per
 task against 25 seconds on the fastest, listing at $1.40 per million input against $0.76.

## What this run does not support

- **Do not rank the Kimi K3 hosts in the A1 arm, or say anything about K3 quality from it.** Timeouts rather
 than wrong answers dominated that arm at 19 of 45 cells, and one host contributed only five cells.
- **Do not use the realised figure for the Z.AI comparison.** The 1.8 times multiple holds on list price. On
 cost per completed task Z.AI is only 1.26 times Baidu, so do not reach for the bigger number on the
 realised figure.
- **The Opus arm cannot carry a route-cost claim.** One repeat per cell means the differences are trajectory
 noise. Specifically, the claim that the vendor's own endpoint was 24% dearer than another cloud is not
 defensible: list price is identical across those routes and the per-task breakdown has the vendor priciest
 on four tasks and cheapest on two.
- **No latency claim beyond the medians recorded here.** In particular, a claim that one host answers in
 about one second while another takes eleven at the same price point is not in this data. Every $3.00 host
 in the endpoint snapshot reports a median between 3.9 and 7.4 seconds.
- **This is our workload.** Ten coding tasks chosen by us.

## Reconciliation

This is the anchor. Everything else in the verified-numbers file is checked against it.
