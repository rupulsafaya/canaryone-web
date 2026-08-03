---
date: "2026-07-30"
title: "Five routes, one model, by our own tool"
summary: "Five routes, one model, twelve tasks each, run by our own tool."
kind: "local-tool-run"
routes: "5"
sourceFile: "outreach/results/2026-07-30-canaryone-kimi-k3-5-routes.md"
---

# Run — five routes, one model, by our own tool

The first run by canaryone itself with a judge that discriminates rather than returning a flat score.

## Identity

| Field | Value |
|---|---|
| Run date | 2026-07-30 |
| Kind of run | Local tool run. Not reproducible by a reader, so it carries demonstration material rather than contested numeric claims. |
| Raw output location | The product README, where this table is already public, plus the local run directory on the machine that produced it. |

## Method

Five routes serving one model, twelve tasks each, reaching four distinct providers through three gateways
plus one direct endpoint. The judge reads each session transcript afterwards and scores four things: whether
the model acted, whether it grounded its answer in what the tools actually returned, whether it verified,
and whether it was efficient.

| Field | Value |
|---|---|
| Models | Kimi K3 |
| Routes | 5 |
| Tasks | 12 per route |
| Total cells | 60 |
| Grading | Test assertions for pass or fail, plus an LLM judge scoring the trajectory out of 100 |
| Judge behaviour | **Discriminating**, with scores from 69 to 88 and a warning flag on the lowest. This is the first run where that is true. |

## The table

| Model | Provider | Router | Pass | Raw cost per pass | Judge | Weighted cost per pass |
|---|---|---|---|---|---|---|
| Kimi K3 | Moonshot AI, mxfp4 | OpenRouter | 12 of 12 | $0.1852 | 88 | $0.2104 |
| Kimi K3 | baseten | Vercel | 11 of 12 | $0.0967 | 84 | $0.1151 |
| Kimi K3 | Fireworks | Vercel | 9 of 12 | $0.0921 | 86 | $0.1071 |
| Kimi K3 | moonshot-intl | direct | 9 of 12 | $0.0686 | 87 | $0.0789 |
| Kimi K3 | nebius | Vercel | 6 of 12 | $0.0472 | 69, flagged | $0.0683 |

## The mechanism

**Cheap and finished are different questions, and this run separates them.** The cheapest route on raw cost
is also the worst on pass rate, at 6 of 12, and it is the only route carrying the narration warning at 69.
It is cheap partly *because* it narrated an answer instead of grounding it in tool output, which costs fewer
tokens and produces a worse result. Ranked on raw cost it wins. Ranked on cost per grounded pass it does
not.

## What this run supports

- **A 3.6 times spread on identical weights and identical tests,** across five ways to buy the same model.
- **A passing test does not tell you the model did the work.** A route can pass by confidently narrating an
 answer rather than using what its tools returned, and the judge catches it. On this run the scores came
 out 88, 87, 86, 84 and 69, and the 69 is the cheapest route on raw cost.
- **The maker's own model bought through a gateway cost 2.7 times the maker's own direct endpoint** for the
 same tests, at $0.1852 against $0.0686 per passing outcome.

## What this run does not support

- **No law about any named host or any named gateway.** Twelve tasks on one model is a demonstration of the
 method, not a finding about nebius or about a gateway.
- **It is not reproducible by a reader,** because it is a local run against a local target. Any numeric
 assertion a host employee might check should cite
 [the commissioned sweep](/runs/2026-07-28-commissioned-sweep-14-routes) instead.
- **It does not settle the maker-endpoint question.** See the reconciliation below.

## Reconciliation

**Two things need saying, and both are the kind of error a careful reader catches.**

**First, this run and the commissioned sweep disagree about makers, and the disagreement is real rather than
an error.** On GLM 5.2 the maker's own endpoint was among the worst of five hosts. Here, the maker's own
direct endpoint was the cheapest of five and it was the maker's model *through a gateway* that cost the
most. So the defensible claim is not that makers are bad sellers. It is that **the route is a variable in
its own right, and a leaderboard testing one endpoint per model cannot see it.**

**Second, there is a second public number for one of these hosts, from a different run, and nothing connects
them.** A separate ten-repeat run on direct-provider endpoints only was posted publicly, reporting the
Baseten route as best on cost per outcome with a judge score of 87. In the table above Baseten scores 84 and
ranks second on weighted cost per pass rather than first. Both are probably correct for their own run.
