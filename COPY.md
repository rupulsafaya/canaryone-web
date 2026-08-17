# CanaryOne copy guide

How to write for this site. [`DESIGN.md`](./DESIGN.md) governs how the site looks; this governs what
it says. The two are siblings and neither overrides the other.

**This document does not decide the message.** `Strategy/positioning.md` in the `fantastic-dollop`
repository is the single source every piece of copy inherits from, and if a sentence here contradicts
it, that sentence is wrong. What this document covers is the part positioning cannot: how to turn a
decided message into page copy without accidentally promising something we have not built.

Current as of 2026-08-17. Revised that day when positioning.md was rewritten: the company is the
packaged AI stack, with the benchmarking tool as its measurement layer rather than as the product.
Three things changed here as a result — the worked examples, which used to illustrate an archived
page; the number gate, which is narrower; and the privacy paragraph, which is no longer frozen.

## The one rule

**The site may promise anything the company intends to build. Every sentence must carry its own
status — shipped, building, or intended — so that a reader who never reads a button label still knows
which one they are looking at.**

This site is deliberately a business card that runs ahead of the product. That is a legitimate choice
and this guide is not an argument against it. The failure it guards against is narrower: attaching the
status to a call-to-action button while the prose beside it describes a mechanism in the present
indicative. Most readers skim the prose and never read the button.

The worked example, taken from the live home page:

> **Wrong.** A card headed **Ask**, with body text reading "Ask questions across company information
> without copying documents into another tool" — and nothing else. That is a description of a
> working feature, and a reader reasonably concludes it works.
>
> **Right.** The same card and the same sentence, with an **In build** chip inside the card, above
> the sentence it qualifies, and the section's lede underneath still in the building register: "We're
> building three surfaces on one shared layer."

**Why the chip is allowed here when the guide otherwise says the register goes in the sentence.**
Three cards each opening on "We're building" followed the rule literally and cost each sentence the
thing it was there to say. What the rule actually forbids is a status living on a *button* while the
prose beside it describes a mechanism in the present indicative, because a skimmer reads the prose
and never the button. A chip **inside** the card and **above** the sentence is read by exactly the
person who skims, and the section lede keeps the status in a sentence as well. A chip beside the
eyebrow of a whole section does the same job for **Planned**.

## The three registers

Every sentence on the site is in one of three registers. The register belongs in the sentence, not in
the badge next to it.

| Register | What it covers | How it is written | Test |
|---|---|---|---|
| **Shipped** | The benchmarking tool in the published npm package, the free daily market capture, and the paid nightly sweep. Nothing else. | Present indicative, no hedging, no qualifier. "The runner reads the tests already in your repository." | Could someone run `npx canaryone` this afternoon and see it, or is it a number the measurement already produced? If neither, it is not shipped. |
| **Building** | On the build list, with work underway or committed. Today: the three surfaces, Ask, Build and Control. | "We're building X, so that…" The subject is us, and the verb makes clear the thing does not exist yet. | Is it in `Strategy/positioning.md` § The register? If it is not on a list anywhere, it is intended rather than building. |
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

Every figure on the site clears the gate in `outreach/COPY-RULES.md` in the `fantastic-dollop`
repository, plus two clauses that a page needs and a post does not, because a post scrolls away and a
page is read by strangers indefinitely:

1. The number traces to a named run in `timeseries/`, which is the live evidence base. Both of its
   layers can carry a public claim, with one distinction: the free daily capture reads disclosed
   metadata and can establish nothing about quality, so a claim about quality comes from the paid
   sweep. **Nothing under `archive/` may carry a public claim,** which includes the run records set
   aside on 2026-08-04.
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

## Naming a host, and when not to

**The rule inherited from `CLAUDE.md` in fantastic-dollop is publish the magnitude, never the
winner:** the size of a gap reproduces from run to run and the identity of whoever sits at either
end does not. The two pages resolve that rule in opposite directions, both deliberately, and the
difference is the kind of run behind the figure.

**`/market` names hosts.** Its comparison comes from the nightly commissioned sweep, which runs
again every night, so a reader can be told which two routes were measured and the page can carry
the caveat that the names will change while the size of the gap will not. `routeLabel()` is the
single place those names are resolved, which is also the single place to neutralise them if that
call is ever reversed.

**`/evals` letters them — Route A, Route B, Route C.** Its comparison is one local tool run on one
repository, its archive file is now under `archive/outreach-results/` and set aside, and the route with the lowest
completion count has a slowest step close to the runner's own six-minute session timeout. That
last detail is decisive: `archive/outreach-results/README.md` names publishing a false failure about a
named host as the worst unforced error available to us, and a timeout artefact presented as a
route's quality is exactly that. The full report is one click away and names all ten.

**The test, for a third page later:** can a reader reproduce this, and would being wrong about it
be a statement about a company? A commissioned sweep that reruns nightly can carry names. A single
local run cannot, however tempting the specificity is.

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

## The privacy paragraph, which is no longer frozen and now depends on the layer

**This section changed on 2026-08-17 and it is the single most likely place on this site to publish
something false.** It used to say that nothing sits in your request path, full stop, as a standing
product principle. The packaged stack gives that up: a governed layer doing routing, budgets, policy
and audit is in the request path by definition, because that is what governing traffic means.

**So the claim is attributed to the layer it belongs to. There is no site-wide version of it.**

| Layer | What is true, and may be written |
|---|---|
| The benchmarking tool | It runs on your machine, against your own tests, and stays out of your request path. Both halves are true and must stay true. |
| The governed layer, meaning Ask, Build and Control | It is in the request path by design. Never imply otherwise to borrow the tool's reassurance. |

**Never let a sentence about the tool sit where a reader will take it as a sentence about the
platform.** That is the specific error, it is easy to commit while writing a hero paragraph, and
since the `BLOCKED_CLAIMS` list was removed from `tools/x_post.py` on 2026-08-17 nothing in the
tooling will catch it. The rule lives in `outreach/COPY-RULES.md` in fantastic-dollop and in this
paragraph, and is enforced by whoever is writing.

**What did not change.** Never write, in any variation, that no data leaves your machine, that
nothing is sent anywhere, or that the tool is fully offline or fully local. The code contradicts all
three: the judge sends each session transcript to a gateway by default, and the scan summariser
sends your test files there to be classified. That was true of the tool before the platform existed
and has nothing to do with this revision.

**Where a page describes something that would touch production traffic, say what it does and does
not do rather than reaching for a blanket reassurance.** The archived DEPLOY section did this well
with "CanaryOne writes the config; your own stack keeps serving the traffic", and that shape of
sentence still works: name the boundary rather than denying the category.

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
The company and the tool currently share the name, which `Strategy/PLAN.md` still lists as an open
decision; until it closes, both are **CanaryOne** in prose.

## The check before a page ships

Confirm each of these in one line. If any fails, fix it rather than noting it.

- Every sentence's register is legible from the sentence itself, without reading a nearby button.
- No mechanism is described for anything in the building or intended register.
- Every figure traces to a run in `timeseries/`, carries its date in the visible copy, and links to
  something a reader can open.
- Every logo row is labelled, and every host named under "hosts we measure" appears in a run.
- Every request-path sentence names which layer it is about, and no sentence about the benchmarking
  tool sits where a reader would apply it to the platform.
- No host is named in judgement, and no third party's judgement of a host is quoted.
- The page builds, and `pnpm build` is clean.

**Then stop.** Committing to `main` in this repository publishes to production immediately. Treat a
commit as a publish and confirm before making one.
