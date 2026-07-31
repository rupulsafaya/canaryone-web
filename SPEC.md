# canaryone.ai — website spec

One-page marketing site for `canaryone` (open-source local CLI that benchmarks AI
agents across every route they could run on). Deployed on Vercel from
`github.com/rupulsafaya/canaryone-web`, served at `canaryone.ai`.

Reader profile: an engineer who saw a tweet, wants to know if this tool is real,
and will decide in 15 seconds whether to click through to GitHub. Not enterprise
buyers, not investors. No marketing gloss.

The kickoff doc at `fantastic-dollop/.local/canaryone-ai-website-kickoff.md` is the
narrative brief. This SPEC.md is the decision record — where the kickoff doc has
open questions, this file has answers.

---

## Context — the runcanary.ai collision

`runcanary.ai` is a YC-backed product also called "Canary" doing AI-generated QA
testing. Adjacent category, similar name, better SEO. Implications for this site:

- The wordmark is always written in full: **`canaryone`**. Never "Canary" alone.
- Palette leans hard on yellow (Canary 300 `#FDE047`); runcanary uses cream +
  red/orange. First-glance visual identity should read "yellow tool," not "cream
  tool."
- The tagline does the differentiating work: `route` and `benchmark` land before
  the reader has time to mis-associate.
- No visual mimicry of runcanary's JetBrains Mono h1, animated demos, or
  section-by-section product tour.

---

## Positioning

**Tagline (h2 under the wordmark):**
> Benchmark your AI agent across every route it could run on. Locally. Open source.

**Three claims, in this order** (coverage → route → local). Drafts below are for
Rupul to edit in-place during build:

1. **Every router, every direct provider. One tool.**
   canaryone benchmarks the same model across OpenRouter, Vercel AI Gateway, and
   AWS Bedrock — plus nine direct provider APIs. Baseten (fp8) through
   OpenRouter, Baseten (fp8) through Vercel, Baseten direct: three distinct
   lanes, three distinct results. No other tool covers this superset.

2. **The route matters, not just the model.**
   The same model on different routes has non-trivial spread in cost, quality,
   and reliability. Launch day: Kimi K3 across 10 routes — 3.9× cost spread, two
   lanes silently narrating instead of doing the work. canaryone lets you pick
   the cheapest *grounded* lane, not the cheapest lane.

3. **Local. Nothing leaves your machine.**
   API keys sit in `~/.c1/.env` at mode 0600. The proxy runs on localhost. The
   report is a static HTML file at `<repo>/.c1/runs/<runId>/report/index.html`.
   The only outbound traffic goes to the LLM providers you configured.

---

## Visual identity

### Palette

Family reference: [figma.com/colors/canary](https://www.figma.com/colors/canary/).
Canonical brand palette (locked hex values + rules for downstream repos) lives in
[`README.md` § Brand palette](./README.md#brand-palette-source-of-truth) — other
CanaryOne repos (canaryone, canaryone-cloud, canaryone-demo) should inherit from
that section rather than declare their own values.

```
--bg:          #fafaf7   /* warm off-white page background */
--panel:       #ffffff   /* card / section background */
--line:        #e5e7eb   /* hairline borders */
--line-strong: #d1d5db   /* stronger separators */
--muted:       #6b7280   /* secondary text */
--text:        #0f172a   /* primary text */
--accent:      #FDE047   /* canary yellow — Canary 300, brighter than tweet-card */
--accent-deep: #EAB308   /* Canary 500 — reserved for interactive states / hovers */
--good:        #16a34a   /* pass / positive */
--warn:        #ca8a04   /* warning / narrated */
--bar-track:   #f1f5f9   /* neutral background rails */
```

`#FDE047` is the identity color. Use it decisively — the wordmark underline, CTA
button fill, the receipt frame corner — not sprinkled as background wash.

### Typography

- **Body + headlines:** system-sans stack, no web fonts, no CDN calls
  ```
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               Helvetica, Arial, sans-serif;
  ```
- **Code, numbers, terminal:** monospace stack
  ```
  font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
  ```
- **H1:** ~44px, weight 600, tight line-height, restrained.
- **H2 (section heads):** ~24px, weight 600.
- No JetBrains Mono, no Inter web-font, no Google Fonts. Zero external font
  requests.

### Wordmark

`canaryone` in `--text` near-black, with a thick underline (~4px height) in
`--accent` yellow beneath the `canary` portion only. The word reads as one unit
first; the yellow underline signals identity without splitting the word visually.

---

## Page structure (single page, scroll only, ~2-3 viewport heights)

### Above the fold
- Wordmark: `canaryone` (yellow underline under `canary`).
- H1 / tagline (one line): *"Benchmark your AI agent across every route it could
  run on. Locally. Open source."*
- Primary CTA button (yellow fill): → `https://github.com/rupulsafaya/canaryone`
- Secondary CTA (monospace, copyable): `npx canaryone` — assumes another thread
  ships the `canaryone` npm package before launch. If it hasn't, swap to the
  git-clone snippet.

### Below the fold (in order)

1. **The receipt** — `c1-kimi2.png` in a subtle bezel frame. Caption:
   *"Kimi K3, 10 routes, launch day — 3.9× cost spread on the identical model."*
   Static image; no video, no motion. Mobile: fitted width, tap to open in
   lightbox for full detail.

2. **What it does** — three claim blocks in the order specified above. Each
   block: 1 headline + 2-3 sentences. No icons, no feature grid.

   Under claim #1 ("Every router, every direct provider"): compact horizontal
   logo strip. Ship with the SVGs available in
   `fantastic-dollop/.local/Logos/`. Rupul to drop remaining router/provider
   SVGs (OpenRouter, Vercel AI Gateway, Bedrock, Moonshot, Together, Groq,
   DeepSeek, Cerebras) into that folder before build. If any are missing at
   build time, render text labels for the gaps in monospace.

3. **How you use it** — one large monospace code block:
   ```
   npx canaryone
   ```
   Copy-to-clipboard button on the block. One line of muted secondary text
   below: *"Point it at any repo whose tests call an LLM. See the README for
   the walk-through."*

4. **Status** — brief, honest paragraph:
   *"v0.1 in development. Bugs and provider adds welcome as issues on the
   repo."*
   No star count. No cloud showcase link.

5. **Footer** — three items, minimal:
   - `github.com/rupulsafaya/canaryone`
   - `@Rupul` on X (profile only; no specific launch tweet URL)
   - `MIT`
   Nothing else. No newsletter, no analytics, no "made with" footer.

---

## Tech choices

- **Framework:** Astro (zero JS by default, first-class Vercel support).
- **CSS:** hand-written CSS with CSS variables. No Tailwind, no CSS-in-JS.
- **No component libraries:** no shadcn, Radix, Headless UI.
- **No analytics:** none. Not Vercel Web Analytics, not Plausible, not GA.
- **No web fonts.** System stack only.
- **Node 22+, pnpm** to match the product repo.
- **No client JS** except:
  - Copy-to-clipboard button (`navigator.clipboard.writeText`).
  - Lightbox for TUI screenshot on mobile (~10 lines of vanilla JS or a
    `<details>`-based zoom pattern).

---

## OG / social preview

`public/og.png`, 1200×630. A 1200×630 crop of the Kimi K3 receipt tweet-card.
Same image for Twitter, LinkedIn, Slack unfurl. Cache aggressively.

Meta tags in `<head>`:
```html
<meta property="og:title" content="canaryone — benchmark your AI agent across every route">
<meta property="og:description" content="Same model, different routes, different answers. Local. Open source.">
<meta property="og:image" content="https://canaryone.ai/og.png">
<meta name="twitter:card" content="summary_large_image">
```

---

## Repo setup

```bash
gh repo create rupulsafaya/canaryone-web \
  --public \
  --description "Website for canaryone — canaryone.ai" \
  --clone
cd canaryone-web
git config user.email rsafaya@gmail.com   # Vercel Hobby requires personal email
```

Working copy already exists at `/Users/rupulsafaya/Documents/GitHub/canaryone-web`
with a symlink from `fantastic-dollop/canaryone-web` (gitignored).

Verify after first commit:
```
git log -1 --pretty=%ae   # must be rsafaya@gmail.com
```

Scaffold:
```
pnpm create astro@latest . --template minimal --typescript strict \
  --install --git=no
```

---

## Deploy + domain

1. Vercel: `pnpm i -g vercel && vercel && vercel --prod` or wire the GitHub repo
   in the Vercel dashboard.
2. Domain: `canaryone.ai` apex is canonical. `www.canaryone.ai` 301-redirects to
   the apex. Set A/AAAA records at the registrar per Vercel's shown values —
   this step needs Rupul's registrar login; flag it, don't attempt yourself.
3. Verify: `https://canaryone.ai` returns the page over HTTPS with a valid cert.

---

## Verification checklist (before handoff)

- [ ] `git log -1 --pretty=%ae` is `rsafaya@gmail.com`
- [ ] Page loads in Chrome, Safari, mobile Safari
- [ ] Lighthouse Performance ≥ 95, Accessibility ≥ 95
- [ ] GitHub CTA link works
- [ ] `npx canaryone` copy-to-clipboard works
- [ ] TUI screenshot lightbox works on mobile
- [ ] OG image renders correctly in a Twitter card validator
- [ ] No console errors, no console warnings
- [ ] No external HTTP requests except the one for OG image
- [ ] Total scroll ≤ 3 viewport heights on a 15" laptop
- [ ] Apex + www both resolve to HTTPS
- [ ] `canaryone` wordmark always appears as full word (never truncated to
      "Canary")

---

## Explicit non-goals (do not add)

- Hero animations, gradient meshes, "as seen on" logos
- Email capture / newsletter signup
- "Book a demo" / Calendly / any scheduling
- Dark-mode toggle
- Emojis in copy
- Feature comparisons vs OpenRouter, Braintrust, LangSmith, etc.
- Any claim that isn't already true in the product repo today
- Any dependency on the product repo (`github.com/rupulsafaya/canaryone`) —
  don't touch it. File an issue there if the site needs a change.

---

## Open items Rupul owns

- Drop remaining router/provider SVGs into `fantastic-dollop/.local/Logos/`
  before build (OpenRouter, Vercel AI Gateway, Bedrock, Moonshot, Together,
  Groq, DeepSeek, Cerebras).
- Confirm the `npx canaryone` npm package is published by the parallel thread
  before launch. If it isn't, primary CTA (secondary text) needs to fall back
  to `git clone` — flag before deploying to production.
- Registrar DNS configuration for `canaryone.ai` apex + `www` redirect.
- Edit or replace claim copy above; drafts are placeholders.
