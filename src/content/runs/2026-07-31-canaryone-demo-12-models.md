---
date: "2026-07-31"
title: "Twelve models, one endpoint each, on four tool-use tasks"
summary: "Twelve models, one endpoint each, four tool-use tasks, five repeats."
kind: "local-tool-run"
routes: "12 routes reached through 2 routers and 5 providers. Eleven are direct to the model's own provider; GPT 5.6 Luna alone came through OpenRouter."
spend: "$10.5043"
sourceFile: "outreach/results/2026-07-31-canaryone-demo-12-models.md"
---

# Run — twelve models, one endpoint each, on four tool-use tasks

The first run that measures **model choice** rather than host choice. Every lane is a different model, so
this run says nothing about the host axis that is our wedge — it is the same shape of comparison that
Artificial Analysis and Arena publish, taken on our own tasks.

Often referred to as "the 1 August run", because it finished in the early hours of 1 August local time.
Its UTC start date is 2026-07-31 and the report header carries that date, so it is filed under 31 July.

## Identity

| Field | Value |
|---|---|
| Run date | 2026-07-31, started 21:55:36 UTC, report generated 22:40:26 UTC |
| Run identifier | `2987b843-16e2-49f4-8399-d0ec8e75866a` |
| Kind of run | **Local tool run.** Not reproducible by a reader, so it carries demonstration material only. Cite the 28 July commissioned sweep for anything a skeptic would contest. |
| Captured by | Rupul, on his own machine. `targetDir` in the run metadata is `<repo>/canaryone-demo`. |
| Raw output location | Copied to `canaryone-demo/.c1/runs/2987b843-16e2-49f4-8399-d0ec8e75866a/` on Bhaskar's machine on 2026-08-03. Holds `meta.json`, a 39 MB `traffic.jsonl`, 251 session transcripts under `sessions/`, and the generated `report/` with `report.html`, `index.html` and `tweet.html`. The run's SQLite rows were **not** copied, so `.c1/db.sqlite` still holds only the two 30 July GLM runs. |
| Independently verified | 2026-08-03, by parsing the per-lane and per-task data out of `report/report.html` and cross-checking lane coverage against `traffic.jsonl`. |

## Method

Twelve models, each bought from exactly one endpoint, run against four tool-use tasks with five repeats
per cell. Graded by the tool's built-in judge on trajectory and outcome together, then divided into cost
to give a cost per successful task. **Run with parallelism 3, so no latency claim can come out of this
run** — the 28 July sweep is the only one of ours that ran serially on an uncontended machine.

| Field | Value |
|---|---|
| Models | GPT 5.6 Luna, GPT 5, GPT 5 Mini, GPT 5 Nano, Claude Sonnet 5, Claude Haiku 4.5, DeepSeek V4 Flash, DeepSeek V4 Pro, GLM 5.2, Gemini 3.6 Flash, Gemini 3.5 Flash Lite, Gemini 3.1 Pro Preview |
| Routes | 12 routes reached through 2 routers and 5 providers. Eleven are direct to the model's own provider; GPT 5.6 Luna alone came through OpenRouter. |
| Tasks | 4, being `t1-easy`, `t2-medium`, `t3-difficult` and `t4-super`, in the canaryone-demo repository |
| Repeats per cell | 5 |
| Total cells | 240 attempted as reported. **231 actually issued a single API request** — see the exclusions row. |
| Grading | The tool's judge, `anthropic/claude-haiku-4.5`, classifier version `2026-07-29-haiku-r5-local`. **It discriminated**, returning 62.00 to 93.00 across task-level means, so the quality axis carried real signal rather than being pinned. |
| Harness | canaryone's own runner and proxy. The repository's test command is `pnpm test`, detected from `package.json`. |
| Serial or parallel | **Parallel, 3 at a time.** No latency claims. |
| Cells excluded, and why | A thirteenth lane, GPT 5.1 direct from OpenAI, was configured and attempted. All 20 of its sessions failed with `model_not_found` — "Project `proj_lMix1EpexY3Ug8pluddaG4vU` does not have access to model `gpt-5.1`" — and the lane was dropped from the report **with no note in it**. Separately, both Google Flash lanes are short of cells: Gemini 3.6 Flash issued requests on 15 of 20 and Gemini 3.5 Flash Lite on 16 of 20. The report credits both with 20 attempted. See the defect section below. |
| Total spend | $10.5043 |

## The table

Twelve lanes, sorted by cost per successful task. Judge scores are means of the per-task means.

| Model | Provider | Router | Cost per successful task | Judge | Passed | Spend |
|---|---|---|---|---|---|---|
| GPT 5.6 Luna | OpenAI | OpenRouter | $0.003050 | 80.60 | 18 of 20 | $0.0549 |
| GPT 5 Nano | OpenAI | direct | $0.005395 | 79.25 | 14 of 20 | $0.0755 |
| DeepSeek V4 Flash | DeepSeek | direct | $0.006065 | 83.20 | 18 of 20 | $0.1092 |
| GPT 5 Mini | OpenAI | direct | $0.012405 | 80.65 | 17 of 20 | $0.2109 |
| DeepSeek V4 Pro | DeepSeek | direct | $0.017737 | 83.45 | 20 of 20 | $0.3547 |
| Gemini 3.5 Flash Lite | Google | direct | $0.035586 | 77.75 | 8 of 20 | $0.2847 |
| GLM 5.2 | Z.AI | direct | $0.047985 | 81.35 | 16 of 20 | $0.7678 |
| Claude Haiku 4.5 | Anthropic | direct | $0.050644 | 81.30 | 18 of 20 | $0.9116 |
| ⚠️ Gemini 3.6 Flash | Google | direct | ⚠️ $0.068473 | ⚠️ 89.60 | ⚠️ 15 of 20 | $1.0271 |
| GPT 5 | OpenAI | direct | $0.086713 | 81.70 | 17 of 20 | $1.4741 |
| Claude Sonnet 5 | Anthropic | direct | $0.102950 | 85.40 | 20 of 20 | $2.0590 |
| Gemini 3.1 Pro Preview | Google | direct | $0.317482 | 75.15 | 10 of 20 | $3.1748 |

**The Pareto frontier**, recomputed rather than taken from the chart: GPT 5.6 Luna, DeepSeek V4 Flash,
DeepSeek V4 Pro, and Gemini 3.6 Flash. Every other lane is dominated on both cost and judge score by
something cheaper and better. Gemini 3.6 Flash's place on the frontier is a consequence of the defect
below and should not be quoted.

### The hard task separates the field, and the easy one does not

Judge means per task, which is the most useful thing in this run:

| Task | Judge range across the field | Reading |
|---|---|---|
| t01, easy | 76.60 to 93.00 | Almost everything passes 5 of 5. Nine of twelve lanes went perfect. |
| t02, medium | 70.20 to 90.40 | Pass rates start to separate. |
| t03, difficult | 70.40 to 92.40 | Cost spreads open up sharply, from $0.0049 to $1.0958 per pass. |
| t04, super | 62.00 to 82.60 | **Everything collapses.** No lane exceeds 82.60 and the mean sits near 71. |

## The defect that blocks the headline

**Gemini 3.6 Flash never ran task 4.** The per-task views in `report.html` carry twelve lanes for t01,
t02 and t03 and only eleven for t04, and the missing lane is Gemini 3.6 Flash. The traffic log agrees, at
15 distinct sessions for that lane against 20 for every complete lane.

Because t04 is the task that flattens the whole field, its absence flatters that lane twice over:

- **Its judge score of 89.60 is the mean of its three easy tasks only**, being 93.00, 85.20 and 90.60. Every
 other lane's score carries the t04 penalty. Give it a field-typical t04 score near 71 and its overall
 lands around 85, which places it *below* Claude Sonnet 5 at 85.40 rather than five points clear of the
 field.
- **Its cost per successful task is understated for the same reason.** t04 is the dearest task for every
 lane that ran it.

The report still prints `attempted: 20` for that lane, so five cells that never issued a single API request
are counted as attempted and failed. That is the mirror image of the empty-session bug from the 29 July
fixture run: that one turned a missing measurement into a pass, this one turns non-execution into
measurement.

**What would unblock it:** re-run the Gemini 3.6 Flash lane on t04. Five cells, cheap.

### Gemini 3.5 Flash Lite has the same reporting fault, less damagingly

That lane issued requests on 16 of its 20 cells. Unlike Gemini 3.6 Flash it does appear in all four
per-task views, so its judge mean of 77.75 is not biased by a missing difficulty band. **Its pass rate is
the problem:** 8 of 20 counts four never-run cells as failures, where 8 of 16 executed is the honest
denominator. That is 40% against 50%.

So the judge score is usable and **the pass rate is not.** Do not publish "passed 8 of 20" for that lane.

### Why both short lanes are Google, which is worth knowing before the re-run

Nine of nine non-Google lanes issued requests on all 20 cells. Both lanes that came up short are Google
direct, and Gemini 3.1 Pro Preview — also Google — was complete but slowest and dearest by a wide margin,
at 594 traffic events against a median near 340. That pattern points at rate limiting or quota on the
Google direct provider rather than at anything about the models. **It is a guess, not a finding**, and the
run holds no error responses for those lanes to confirm it. Worth checking before the re-run, because a
re-run into the same limit reproduces the same gap.

## What this run supports

- **Cost per successful task spanned 104 times across twelve models on the same four tasks**, from
 $0.003050 to $0.317482. Same tasks, same judge, same repeats.
- **The most expensive model in the run also scored the lowest.** Gemini 3.1 Pro Preview cost $0.317482 per
 successful task, scored 75.15, and passed only 10 of 20. It is a preview model, and saying so belongs in
 the same sentence.
- **On the difficult task, GPT 5 Mini scored 92.40 at $0.019309 per pass while Claude Sonnet 5 scored 92.00
 at $0.154798.** Eight times the price for the same score on that task.
- **A hard task is what makes a suite discriminate.** Nine of twelve lanes passed t01 perfectly and nothing
 cleared 82.60 on t04. This is the same lesson as the 28 July sweep, where nine of ten tasks were too easy
 to separate GLM 5.2 from Opus 5.

## What this run does not support

- **No host claim of any kind.** Every lane is a different model at one endpoint, so nothing here speaks to
 buying the same weights from different places. Do not let this run near the host-variance argument.
- **Nothing about Gemini 3.6 Flash.** Not its judge score, not its cost per pass, not its place on the
 frontier. Blocked until t04 is re-run.
- **No latency claim.** Parallelism was 3.
- **No contested number.** This is a local run, so a reader cannot reproduce it. Use it for screenshots,
 transcripts and qualitative findings, and cite the 28 July sweep when a figure is challenged.
- **Four tasks is a small suite,** and the field ranks differently task by task. GPT 5 Mini is fourth
 cheapest overall and top of the field on t03; GLM 5.2 is mid-table overall and worst on t04 at 63.60.
 Any single-number ranking from this run hides that.
- **Do not present the twelve-lane count as twelve providers.** It is twelve routes across five providers
 and two routers.

## Reconciliation

Two things it does not resolve:

- **It does not connect to the eighteen-host DeepSeek V4 Flash figures** of $0.0013 to $0.0066 per completed
 task that still sit in the internal one-pager. The
 ranges overlap and the models share a name, and that is all. That was eighteen hosts of one model; this is
 one endpoint per model across twelve models. They measure different things and neither substitutes for the
 other. The unresolved-conflict entry in the verified-numbers file stands.

GLM 5.2 appears in both this run and the 28 July sweep and the figures are not comparable: $0.047985 per
pass here on four tool-use tasks against $0.0351 to $0.0514 there on ten coding tasks across five hosts.
**Say which run any GLM figure came from.** This is exactly the two-public-numbers failure recorded in
`numbers.md`, and it now has a second opportunity to happen.
