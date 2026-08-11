# CanaryOne copy guide

How to write for this site. [`DESIGN.md`](./DESIGN.md) governs how the site looks; this governs what
it says. The two are siblings and neither overrides the other.

**This document does not decide the message.** `Strategy/positioning.md` in the `fantastic-dollop`
repository is the single source every piece of copy inherits from, and if a sentence here contradicts
it, that sentence is wrong. What this document covers is the part positioning cannot: how to turn a
decided message into page copy without accidentally promising something we have not built.

Current as of 2026-08-06.

## The one rule

**The site may promise anything the company intends to build. Every sentence must carry its own
status — shipped, building, or intended — so that a reader who never reads a button label still knows
which one they are looking at.**

This site is deliberately a business card that runs ahead of the product. That is a legitimate choice
and this guide is not an argument against it. The failure it guards against is narrower: attaching the
status to a call-to-action button while the prose beside it describes a mechanism in the present
indicative. Most readers skim the prose and never read the button.

The worked example, from this site in August 2026:

> **Wrong.** A card headed TUNE, with a button reading "Get early access →", and body text reading
> "The proxy records every request and response from your production workload automatically."
>
> **Right.** The same card and the same button, with body text reading "We plan to read the traces
> your stack already writes, so nothing new has to sit in front of your production traffic."

The first sentence describes how a thing works. A reader reasonably concludes the thing exists. The
second makes the same promise and stays true.

## The three registers

Every sentence on the site is in one of three registers. The register belongs in the sentence, not in
the badge next to it.

| Register | What it covers | How it is written | Test |
|---|---|---|---|
| **Shipped** | Behaviour in the published npm package today. | Present indicative, no hedging, no qualifier. "The runner reads the tests already in your repository." | Could someone run `npx canaryone` this afternoon and see it? If not, it is not shipped. |
| **Building** | On the build list, with work underway or committed. | "We're building X, so that…" The subject is us, and the verb makes clear the thing does not exist yet. | Is it in `Strategy/concept.md` § What we are building next? If it is not on a list anywhere, it is intended rather than building. |
| **Intended** | The direction, with no commitment to a date or a shape. | "We plan to…" or a section visibly headed as direction. Never describe the mechanism. | Would we be embarrassed if a reader held us to this in six months? Then it is intended, and say so. |

**The rule that does the most work: describing a mechanism implies it exists.** "We're building canary
deploys" is a promise. "Canary-split traffic between your current model and the fine-tuned one, then
roll back in one command" is a specification, and a specification reads as a description of something
real no matter what tense surrounds it. When writing in the building or intended register, promise the
outcome and leave the mechanism out.

**"Private beta" is a factual claim, not a softener.** Use it only when a beta exists and has people
in it. If it does not, the honest label is "we're building this."

## The number gate

**Numbers are exempt from the vision allowance entirely. The site may promise a product. It may not
promise a measurement.**

Every figure on the site clears the gate in `outreach/README.md` in the `fantastic-dollop` repository,
plus two clauses that a page needs and a post does not, because a post scrolls away and a page is read
by strangers indefinitely:

1. The number traces to a named run in `timeseries/`, which is the live evidence base. **Nothing in
   `outreach/results/` may carry a public claim** — that directory was archived on 2026-08-04.
2. Nothing in the copy is contradicted by that run's "what this run does not support" section.
3. **The run date is visible in the copy next to the figure,** not only in a tooltip or a caption.
4. **The run is one click away,** at a URL a reader can open.
5. The caveat a skeptic would raise is on the page, not waiting in a reply.

A figure that cannot meet all five comes off the page. It does not get a hedge and it does not get
smaller type.

**Losing the number does not mean losing the argument.** The `/evals` route section carried a "3.6×
spread" headline over a ten-row table whose run had no write-up. The figures came off; the finding
stayed, because the finding was never really the ratio — it was that the route which looked cheapest
per token was the worst at completing the task, and the only one flagged for narrating an answer
instead of grounding it. Write the mechanism, not the decimal, when the decimal cannot be sourced.

**Two figures are permanently blocked** and will keep resurfacing because they are memorable: the
eighteen-host study with its 2.87 times spread, and "73% of enterprises are over budget on AI." Both
travelled in collateral without anything behind them. Neither goes on the site.

## A logo is a claim

A grid of third-party marks under a bare heading invites the most generous reading available, and the
reader's generous reading is usually "these are partners."

**Every logo row carries a label saying what the relationship is.** Three are permitted:

| Label | Means | Bar to clear |
|---|---|---|
| **Hosts we measure** | They appear in a run in `timeseries/`. | Named in a committed run. Check before adding; being wrong about this in front of a partner is unrecoverable. |
| **Works with** | A shipped integration a user can exercise today. | Someone has run it end to end. |
| **Planned support** | We intend to support them. No conversation implied. | Honest intent. Say "planned" in the label, not only in a footnote. |

**We have measured exactly these hosts:** the five GLM 5.2 routes of run one, being Baidu, Alibaba,
Wafer, Z.AI and CoreWeave; the five Opus 5 routes of the same run, being Anthropic direct, Bedrock,
Azure, Vertex global and Vertex Europe; and the five Kimi K3 routes of run two, being Moonshot AI
through a gateway, Moonshot direct, Baseten, Fireworks and Nebius. Nothing else. Anyone not on that
list is "planned support" at best.

## The privacy paragraph, which is frozen

This wording took two attempts to get right and one of the wrong versions is already blocked at the
tooling level, in `BLOCKED_CLAIMS` in `tools/x_post.py`. The site carries the same fence.

**Never write, in any variation:** that no data leaves your machine, that nothing is sent anywhere, or
that the tool is fully offline or fully local. The code contradicts all three. The judge sends each
session transcript to a gateway by default, and the scan summariser sends your test files there to be
classified.

**The safe formulation is that CanaryOne runs on your machine, against your own tests, and that
nothing sits in your request path.** Both halves are true and must stay true. Where a page describes
something on the roadmap that would touch production traffic, say explicitly that it does not
intercept it — as the DEPLOY section does with "CanaryOne writes the config; your own stack keeps
serving the traffic."

**"Nothing sits in your request path" is a standing product principle,** decided rather than
inherited. If the roadmap ever gives it up, that is a change to `Strategy/concept.md` first and to
this document second, and only then to the site.

## Prose

Inherited from the house writing rules, with one exemption this site earns.

- **The exemption.** Noun phrases and short fragments are fine in kickers, card titles, table headers,
  labels and buttons, where a one- or two-word verdict is doing exactly the job a label should do.
  "ROUTE MATTERS" is a good kicker and does not want a verb.
- **The exemption does not extend to body text.** Every lede, paragraph and card description is a real
  sentence with a subject and a verb. The four drift-signal descriptions — "Output scores fall below
  threshold", "Provider silently updates the model" — sit on the wrong side of this line and are the
  standing example of it.
- **No arrows or symbols standing in for words in prose.** "Your app, then a proxy on localhost, then
  a report in your repo" rather than a chain of arrows. Arrows are allowed as pure ornament inside a
  button label and inside a diagram, where they are graphics rather than grammar.
- **No slash-stacked lists.** Write "chatter on X, Reddit and GitHub" rather than stacking them with
  slashes.
- **One number per sentence.** Two figures in one sentence forces the reader to hold both and compare
  them, which is what a table is for.
- **Spell out multipliers in prose.** "Three and a half times" reads aloud; "3.5×" does not. Inside a
  table cell the compact form is fine.

## Naming

| Context | Form |
|---|---|
| Prose, headings, titles, meta descriptions, anything a person reads | **CanaryOne** |
| The npm package and the install line | `canaryone`, as in `npx canaryone` |
| The command-line binary | `c1` |
| Repositories, paths, URLs, handles | Lowercase as they actually are: `canaryone-web`, `canaryone.ai`, `../canaryone` |

npm forbids uppercase in package names, so the split is permanent rather than a transitional state.
The company and the tool currently share the name, which `Strategy/concept.md` still lists as an open
decision; until it closes, both are **CanaryOne** in prose.

## The check before a page ships

Confirm each of these in one line. If any fails, fix it rather than noting it.

- Every sentence's register is legible from the sentence itself, without reading a nearby button.
- No mechanism is described for anything in the building or intended register.
- Every figure traces to a run in `timeseries/`, carries its date in the visible copy, and links to
  something a reader can open.
- Every logo row is labelled, and every host named under "hosts we measure" appears in a run.
- The privacy wording matches the frozen formulation, and no blocked phrasing has crept back.
- No host is named in judgement, and no third party's judgement of a host is quoted.
- The page builds, and `pnpm build` is clean.

**Then stop.** Committing to `main` in this repository publishes to production immediately. Treat a
commit as a publish and confirm before making one.
