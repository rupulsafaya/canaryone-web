---
date: "2026-07-29"
title: "The fixture runs, mostly a record of what cannot be published"
summary: "Two runs against our own toy fixture."
kind: "local-tool-run"
sourceFile: "outreach/results/2026-07-29-fixture-runs.md"
---

# Run — the fixture runs, mostly a record of what cannot be published

Two runs by our own tool against a toy application we wrote to be detected, plus one scan of a foreign
repository.

## Identity

| Field | Value |
|---|---|
| Run date | 2026-07-29 |
| Run identifiers | `82fcef7f` at 09:34 UTC, `f6621491` at 13:46 UTC, plus a repository scan at 09:29 UTC |
| Kind of run | Local tool runs against our own fixture. Real API calls to live gateway routes, but a workload we wrote. |
| Workload | The tool's own echo fixture, which is a toy application written to be detected. |

**Both runs made real API calls against live routes, so the costs and latencies are real.** What is not real
is the workload's resemblance to anything a user would run, which is what limits them.

## Run `82fcef7f` — one model, eight hosts

Two tasks, three repeats each per host, for 48 runs across eight hosts. Cost figures below are the total for
that host's six sessions.

| Host | Cost, 6 sessions | Mean session | Sessions passing |
|---|---|---|---|
| decart, fp4 | $0.001761 | 2.04s | 6 of 6 |
| alibaba, fp8 | $0.001913 | 2.91s | 6 of 6 |
| novita, fp8 | $0.002191 | 4.61s | 6 of 6 |
| sail-research, fp8 | $0.002340 | 2.84s | 6 of 6 |
| siliconflow, fp8 | $0.002430 | 4.45s | 6 of 6 |
| coreweave, fp4 | $0.002670 | 2.43s | 6 of 6 |
| atlas-cloud, fp8 | $0.003120 | 3.58s | 6 of 6 |
| chutes, fp4 | $0.003806 | 3.25s | 6 of 6 |

That is a 2.16 times cost spread and a 2.26 times latency spread on identical work.

⚠️ **Neither spread figure is publishable.** Without token accounting, the cost spread may be nothing more
than a list-price difference that anyone could read off a pricing page without running anything. This is the
single most common trap in this whole category and it is why the template asks about token accounting
explicitly.

One incidental observation that *is* useful, and it corroborates the metadata scan: quantization does not
predict cost in either direction, since the cheapest host here was serving fp4 and so was the dearest.

### What this run does support

Three facts, and only three, because they are facts about running the tool rather than findings about hosts.

**Forty-eight runs, fifty-four seconds, about two cents.**

Say "about two cents" rather than a precise figure, since the workload was tiny and the honest point is the
order of magnitude. **Do not extend it into a claim that benchmarking a real repository costs two cents.** A
real workload costs meaningfully more, and the commissioned sweep at $42.30 is the counterexample somebody
will find.

## Run `f6621491`

Nine sessions, 9 of 9 passing, $0.000233 total, sixteen seconds.

| Lane | Model | Raw cost per pass | Judge | p50 latency |
|---|---|---|---|---|
| cloudflare | DeepSeek V4 Flash | $0.00000252 | 50 | 747ms |
| tencent, fp8 | Tencent HY3 | $0.0000150 | 50 | 2,061ms |
| xiaomi, fp8 | Xiaomi MiMo v2.5 | $0.0000602 | 50 | 3,408ms |

**Three things are wrong with this run and each one independently blocks it.**

 It compares three *different models* on
a single test whose whole assertion is that a function returns a non-empty string. It is a price-list
difference dressed as a finding. Blocked permanently, not pending a fix.

**The judge is pinned at exactly 50 across all nine sessions**, being 25 for action, 25 for efficiency, zero
for grounding and zero for verification. So the weighted metric is raw cost doubled for every lane and the
quality axis contributes nothing at all. Any judge number from this run is meaningless. The 30 July
multi-router run is the one with a judge that discriminates.

**Two of the nine session records are empty,** with the judge itself reporting that no steps were executed
and that it could not tell whether the test passed vacuously. That failure mode silently turns a missing
measurement into a passing one, which is the most dangerous bug in the system. It appears to be fixed as of
the 30 July run, where every lane has a plausible score and pass count, but that is worth one explicit check
rather than an assumption.

## The foreign-repository scan — a true negative, and the only external evidence we have

The scan at 09:29 UTC pointed the tool at an open-source repository we did not write and had never seen. It
found 39 files matching the test glob, summarised 15 of them with an LLM, marked every one as not using an
LLM, reported no SDK detected, and selected zero tasks.

**Every one of those classifications is correct.** The repository's dependencies were checked by hand and
there is no LLM SDK anywhere in it.

**What this proves and what it does not.** It proves the tool does not hallucinate a finding where there is
nothing to find, which is genuinely harder to ship than a tool that always returns a number, and it is the
only reason to trust the number when there is one. It proves **nothing** about whether the tool finds a real
LLM test in a foreign repository, because this repository had none. The detection claim, which is the best
thing in the product messaging, still has no external positive evidence.

## What would unblock the detection claim

**Scan two or three open-source repositories that have real LLM tests, and check the classifications by
hand.**
