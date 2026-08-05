# canaryone.ai — design review brief

Everything a fresh thread needs to review this site on design and layout, without reading
the codebase first. Written 2026-08-05 against commit `00ab829`.

**What I want from you:** a design and layout critique. Where is it inconsistent, where does
it look unfinished, and what would make it read as one deliberate system across all four
pages. I will fix the design system first, then rebuild the pages against it. So bias your
output towards decisions I can write down as tokens and rules, not one-off patches.

---

## 1. The product and the reader

CanaryOne is an open-source local CLI. You point it at a repo whose tests call an LLM, and
it runs those tests against every provider and router you could ship on — three routers
(OpenRouter, Vercel AI Gateway, AWS Bedrock) plus nine direct provider APIs — then reports
real cost and quality per route. The pitch is that the *route* matters, not just the model:
the same model bought ten different ways showed a 3.6× spread in weighted cost per pass,
and the cheapest route was also the worst on pass rate.

**Reader profile, verbatim from the spec:** an engineer who saw a tweet, wants to know if
this tool is real, and will decide in 15 seconds whether to click through to GitHub. Not
enterprise buyers, not investors. No marketing gloss.

**Naming constraint that shapes the visual identity.** `runcanary.ai` is a YC-backed
product also called "Canary" in an adjacent category (AI-generated QA testing), with better
SEO. Two consequences the design has to carry: the wordmark is always the full word
`canaryone`, never "Canary" alone; and the palette leans hard on canary yellow because
runcanary uses cream with red and orange. First glance should read "yellow tool", not
"cream tool". No visual mimicry of runcanary's JetBrains Mono h1, animated demos, or
section-by-section product tour.

## 2. Page inventory

Four routes, all static, plus one published artefact.

| Route | What it is | Header pattern | Notes |
|---|---|---|---|
| `/` | The marketing home page. Dark hero, then five cream sections, then an install block and a status line. | Full-bleed dark hero with h1, sub, two CTAs, and a screenshot in a bezel frame. | ~2000px of content per section; the longest page by far. Carries a numbered section rhythm (`01 · COVERAGE` through `05 · THE RUNS`). |
| `/prices` | "Time Machine" — a Chart.js line chart of listed and effective LLM prices per million tokens over time, with a segmented metric toggle, a linear/log axis toggle, a combined legend-and-filter of model chips, and a `<details>` table view. | `.page-head` — plain h1 plus a lede paragraph on cream. No kicker, no hero. | The only page with meaningful client JS and interactive controls. Also the only page with a data-viz palette. |
| `/runs` | Index of published benchmark run reports. A single column of cards. | `.page-head`, same as `/prices`. | Six runs today. |
| `/runs/<slug>` | One run report. Rendered from imported markdown, with an identity strip, a status note, a section jump list, and long prose with wide scrolling tables. | `.crumb` breadcrumb, then h1, then a summary paragraph. A third header pattern. | The densest, most document-like page. Content comes from another repo and must render verbatim. |
| `/demo-report/index.html` | A real generated CanaryOne HTML report, published as a static artefact so home-page figures are checkable. | Not ours. | **Out of scope for the review** — it is the tool's own output, not our design, and is deliberately served as-is. |

Nav and footer are shared across all four of our pages, from `src/layouts/Layout.astro`.
Both list the same four destinations: `prices`, `runs`, `github`, `@CanaryOneOSS`.

## 3. How to look at it

```bash
pnpm install
pnpm dev              # http://localhost:4321
```

Production is https://canaryone.ai. Both are the same static output. The `/prices` chart
reads a Supabase table directly from the browser; if the chart is flat or empty that is
upstream cron data, not a layout bug, so review the chart's chrome rather than its shape.

Files worth opening, in order of how much they decide:

- `src/styles/global.css` — 1837 lines, the entire design system, hand-written, no framework.
- `src/layouts/Layout.astro` — nav, footer, head, brand link constants.
- `src/pages/index.astro` — the home page, including inline JS for the copy button,
  the receipt lightbox, and an SVG hub-and-spoke connector drawing.
- `src/pages/prices.astro` — the chart page and its client script.
- `src/pages/runs/index.astro`, `src/pages/runs/[slug].astro`, `src/components/RunCard.astro`.
- `src/lib/prices.ts` — the data-viz palette lives here, at `SERIES_COLORS`.
- `README.md` § Brand palette — the palette is documented there as canonical for downstream
  CanaryOne repos, so any change to it has consequences beyond this site.

---

## 4. The design system as it exists today

Hand-written CSS with custom properties in one file. No Tailwind, no CSS-in-JS, no component
library. The token layer is **colour-complete and geometry-empty**: every colour is a
variable, and almost nothing else is.

### 4.1 Colour tokens

All of these are declared in `:root` in `src/styles/global.css`. The comments are mine from
the source, kept because they record why each value is what it is.

```css
/* Identity — canary yellow, used generously */
--accent:        #FDE047;   /* Canary 300 · primary CTA, wordmark underline, hub centre, highlight */
--accent-soft:   #fef08a;   /* Canary 200 · declared but never used anywhere */
--accent-deep:   #EAB308;   /* Canary 500 · hover, interactive-active, left-border rules */

/* Cream body */
--bg:            #fafaf7;   /* warm off-white page background */
--bg-tint:       #f5f2e8;   /* warm cream tint · table headers, boundary panel, inline code */
--panel:         #ffffff;   /* white card background */

/* Neutral dark — never slate or navy */
--dark:          #0f0f10;   /* hero panel bg, install terminal bg, hub-centre glyph fill */
--line-dark:     #262626;   /* borders on dark surfaces */
--text-on-dark:  #fef9c3;   /* Canary 100 · headlines and body on dark */
--muted-on-dark: #a8a29e;   /* stone-400 warm grey · secondary text on dark */

/* Text on cream */
--text:          #0f172a;   /* primary text */
--muted:         #6b7280;   /* secondary text */
--muted-strong:  #57534e;   /* stone-600 · muted text on --bg-tint, where --muted fails AA */
--line:          #e5e7eb;   /* hairline borders */
--line-strong:   #d1d5db;   /* stronger separators */

/* Semantic */
--good:          #16a34a;   /* pass green */
--warn:          #ca8a04;   /* narrated / warning */
```

**Rules that are documented as binding on this palette** (from `README.md`, which other
CanaryOne repos inherit from):

1. `#FDE047` is the identity. Use it decisively — wordmark accents, primary CTAs, winner
   rows, hub centres — not sprinkled as tiny underlines. The README says outright: if you
   find yourself thinking the yellow is too much, it isn't.
2. No blue-slate on dark surfaces. Body text at `#0f172a` is acceptable because it is small
   type, but large dark panels must be `#0f0f10`. Tailwind's `slate-900` reads visibly blue
   under a yellow radial gradient, which is how this rule was earned.
3. Shadows are `rgba(0, 0, 0, X)`. Never `rgba(15, 23, 42, X)`, which tints the shadow cool.
4. Muted-on-dark is `#a8a29e` (stone-400), never `#94a3b8` (slate-400).
5. System font stack only. No web fonts anywhere in the brand system.

Family navigation, for picking new shades: `#FEF9C3` Canary 100 is text-on-dark, `#FEF08A`
Canary 200 is soft accents, `#FDE047` Canary 300 is the identity, `#FACC15` Canary 400 is
the logo mark in both the lockup and the favicon, `#EAB308` Canary 500 is hover and active.

### 4.2 Colours that exist in the code but not in the token layer

These are hardcoded hex values scattered through the CSS and the chart script. I am listing
them because they are exactly the kind of thing a design system should absorb, and because
a couple of them may be outright violations of the rules above.

| Value | Where | What it does |
|---|---|---|
| `#15803d` and `rgba(22, 163, 74, …)` | `.kind.commissioned-sweep` | Green run-kind badge text, border, fill. |
| `#a16207` and `rgba(234, 179, 8, …)` | `.kind.local-tool-run` | Amber run-kind badge text, border, fill. |
| `#b42318` | `.tm-status.error` | The only error red on the site. Not in the palette at all. |
| `#ff5f57`, `#febc2e`, `#28c840` | `.report-toolbar` and `.install .terminal-bar` | macOS traffic-light dots. Duplicated in two rules at two different sizes (10px and 12px). |
| `#0a0a0b` | `.hero .receipt-frame` | A second, darker near-black used only for the screenshot bezel. |
| `rgba(15, 23, 42, 0.08)` | `INK.grid` in `prices.astro` | Chart gridlines. This is slate rgba, which rule 3 above forbids for shadows and which the palette avoids generally. |
| `#2a78d6 #eb6834 #1baf7a #eda100 #e87ba4 #008300 #4a3aa7 #e34948` | `SERIES_COLORS` in `src/lib/prices.ts` | The eight-slot categorical palette for the chart. Documented as validated for colour-vision separation and lightness against the cream surface. Canary yellow is deliberately excluded so no arbitrary model looks like the highlighted one. Only eight series can be plotted at once, and that cap is the palette length. |

### 4.3 Typography

System stack only, by hard constraint. Zero external font requests anywhere.

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
```

Body is `19px / 1.55`, dropping to `17px` under 640px. That is a large base size for a
marketing site and it is deliberate.

**There is no type scale.** Sizes are written as literal pixel values at each use site.
Across the file there are 24 distinct font-size values, including `13.5px`, `14.5px`,
`12.5px` and `11.5px` — half-pixel sizes chosen by eye rather than derived from a ratio.
Count by frequency: `12px` appears 12 times, `14px` 9 times, `11px` 8 times, `13px` 7 times.

Display sizes are fluid clamps, and every page-level heading has its own:

| Heading | Clamp | Weight |
|---|---|---|
| `.hero h1` | `clamp(38px, 6.8vw, 76px)` | 500 |
| `.section h2` (home) | `clamp(32px, 5vw, 60px)` | 500 |
| `.page-head h1` (`/prices`, `/runs`) | `clamp(34px, 5vw, 56px)` | 500 |
| `.run h1` (a run report) | `clamp(30px, 4.2vw, 46px)` | 500 |
| `.prose h2` (imported markdown) | `clamp(24px, 2.6vw, 30px)` | 600 |
| `.run-card h2, h3` | `21px` fixed | 600 |
| `.install .terminal-body` | `clamp(18px, 2.4vw, 26px)` | mono, regular |

Letter-spacing is tightened on display type by hand at each size: `-0.03em`, `-0.025em`,
`-0.02em`, `-0.015em`, `-0.01em`. Uppercase mono labels go the other way at `0.08em`,
`0.1em`, `0.12em` and `0.14em`. Neither set is tokenised.

Mono is doing a lot of work and carries a consistent meaning: it marks anything that is a
fact, a path, a number, a label, or a piece of the terminal. Nav links, the kicker, table
bodies, run dates, identity strips, breadcrumbs, jump pills, chart chips, captions and the
footer are all mono. Prose and headlines are sans. That distinction is one of the more
coherent things in the system and is worth preserving.

### 4.4 Layout and spacing

Three layout tokens, and that is the whole geometric system:

```css
--gutter:      clamp(20px, 5vw, 64px);   /* horizontal page padding */
--content-max: 1200px;                    /* .container max width */
--section-y:   clamp(80px, 12vw, 160px);  /* vertical section rhythm */
```

Everything else — every padding, every gap, every margin — is a literal pixel value at the
use site. There is no spacing scale, so values like `22px 24px`, `18px 22px`, `14px 18px`
and `20px 20px 12px` appear as one-off panel paddings that are near-identical but not equal.

Content widths are set per component in characters, which is good for prose but is another
uncontrolled axis: `20ch` (hero h1), `22ch` (section h2), `24ch` (page-head h1), `56ch`
(hero sub), `62ch` (section lede and status), `66ch` (page-head lede), `70ch` (chart
status), `78ch` (run prose column, chart note), `82ch` (chart coverage note). Nine values.

The `/runs/<slug>` prose column is `78ch` inside a `1200px` container, so the run pages are
effectively a narrow document centred in a wide shell, while the home page uses the full
1200px. Results tables inside prose are allowed to break out and scroll horizontally in
their own container, because they are the point of the page.

Breakpoints: `900px`, `640px`, `560px`. The 560px one exists only for the chart page's
controls and picker grid. There is no shared breakpoint token.

### 4.5 Elevation, borders and radii

**Radii have 15 distinct values** and no scale: `3px`, `4px`, `5px`, `6px`, `7px`, `8px`,
`9px`, `10px`, `12px`, `14px`, `16px`, `20px`, `50%`, `999px`, and `0 8px 8px 0`. The most
common are `10px` (6 uses), `14px` (5) and `12px` (5).

Shadows are all bespoke, written inline per component, with no tokens. Examples, to show
the range in play:

```css
/* primary button — a yellow glow */
box-shadow: 0 6px 24px -8px rgba(253, 224, 71, 0.55);
/* hub centre — yellow glow plus a soft yellow ring */
box-shadow: 0 22px 48px -20px rgba(234, 179, 8, 0.55), 0 0 0 6px rgba(253, 224, 71, 0.18);
/* receipt bezel */
box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
/* report frame */
box-shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.28);
/* report frame, hovered — the shadow changes hue on hover */
box-shadow: 0 32px 70px -30px rgba(234, 179, 8, 0.35);
/* scoreboard */
box-shadow: 0 8px 30px -20px rgba(0, 0, 0, 0.18);
/* hub card, hovered */
box-shadow: 0 6px 20px -12px rgba(0, 0, 0, 0.18);
/* run card, hovered */
box-shadow: 0 14px 34px -22px rgba(234, 179, 8, 0.55);
/* install terminal */
box-shadow: 0 30px 60px -25px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
```

Every one of those is a different y-offset, blur and spread. Nine elevations for what is
probably three levels of surface.

Borders are almost always `1px solid var(--line)`, with `var(--line-strong)` for emphasis.
Exceptions: the localhost boundary diagram uses `1.5px dashed var(--line-strong)`, and three
components use a coloured left rule — `4px solid var(--accent-deep)` on the run status note,
`3px solid var(--accent-deep)` on the chart coverage note, `3px solid var(--accent)` on
prose blockquotes. Three different left-rule widths in two different yellows.

### 4.6 Motion

Transition durations in use: `80ms` (button press), `120ms` (nearly everything), `160ms`
(the report frame), `220ms` (the Chart.js update animation). All `ease`.

Named motion:

- `@keyframes pulse` — a 2.4s infinite expanding ring on the hero kicker's dot. The only
  looping animation on the site.
- `html { scroll-behavior: smooth }` — global, **not** wrapped in a `prefers-reduced-motion`
  guard.
- Hover lifts are `translateY(-1px)` on hub cards and `translateY(-2px)` on run cards and
  the report frame. Active state on buttons is `translateY(1px)`.
- The chart does honour `prefers-reduced-motion` and disables its animation.

---

## 5. Component inventory

There is no component library and no naming convention. Classes are page-scoped by
convention only — `.tm-*` for the chart page, `.run-*` for runs, `.hero`/`.hub`/`.boundary`
for home-page set pieces. Astro components exist only for `Layout` and `RunCard`; every
other "component" is a CSS class plus markup written inline in a page.

### Shared across pages

- **Top nav** (`.topnav`). Logo lockup on the left at 153×28, four mono links on the right
  in pill-shaped hover targets. Not sticky. Sits on cream, above the dark hero, with 28px of
  top padding and no bottom border. Wraps rather than overflows on narrow screens.
- **Footer** (`.footer`). Logo at 109×20, a flex spacer, then the same four links plus a
  bare `MIT`. All mono, 13px, muted. Top border only.
- **Container** (`.container`). `max-width: 1200px`, `--gutter` padding.
- **Buttons** (`.btn`, `.btn.primary`, `.btn.ghost`). Only two variants and both live in the
  hero. Primary is a yellow fill with a yellow glow shadow and near-black text. Ghost is a
  mono, translucent-bordered pill that reads as a code snippet. Nothing else on the site
  uses `.btn` at all — every other action is a bare link with a bottom border.
- **Kind badges** (`.kind`, plus `.commissioned-sweep` and `.local-tool-run` modifiers).
  Uppercase mono pills with a leading coloured dot. Used on run cards. The content schema
  allows a third kind, `metadata-scan`, which has **no CSS rule** and therefore falls
  through to the neutral grey base style. Two of the six published runs are that kind.
- **Run card** (`.run-card`). Whole card is one `<a>`. Date and kind badge on a meta row,
  then a title, a summary, and optionally a facts line. Used on both the home page and the
  `/runs` index, with the heading level passed as a prop.
- **Lightbox** (`.lightbox`). A fixed full-screen overlay for the hero screenshot only.
  Opens on click or Enter/Space, closes on click or Escape.
- **`.sr-only`** utility for visually hidden text.

### Home page only

- **Hero** (`.hero`). Full-bleed `--dark` panel with two stacked yellow radial gradients, a
  22px dot-grid overlay masked to fade downward, and a 1px yellow gradient hairline along
  its bottom edge. Contains the kicker, h1, sub, CTAs and the screenshot bezel.
- **Kicker** (`.kicker`). Uppercase mono 12px at `0.14em` tracking. In the hero it is yellow
  with an animated pulsing dot; in cream sections it is plain muted grey with no dot.
- **Receipt frame** (`.receipt-frame`). A `#0a0a0b` bezel with an 8px inset, a yellow
  gradient hairline across its top, a heavy drop shadow, and `cursor: zoom-in`.
- **Hub-and-spoke** (`.hub`, `.hub-card`, `.hub-center`, `#hub-lines`). Three rows of white
  logo cards — 3 routers above, then a yellow `CanaryOne` core, then 4+4 direct providers
  below — with curved cubic Bézier connectors drawn into an inline SVG by JS on load,
  resize, and via ResizeObserver. The connectors are hidden entirely under 640px. Logo
  images sit at `opacity: 0.86`.
- **Scoreboard** (`.scoreboard`). An all-mono results table in a white card with a tinted
  header row. Supports a `.winner` row treatment (yellow gradient wash plus a yellow left
  bar) and a `.narrator` row treatment (last cell in `--warn`). **The winner treatment is
  currently unused by design** — the code comment explains that highlighting the cheapest
  lane would endorse exactly the lane the section warns against.
- **Boundary diagram** (`.boundary`). A dashed rounded rectangle with a `your machine`
  label notched into its top-left border, containing three mono nodes joined by `→`
  glyphs, plus an egress panel below with a `▼ only outbound` pseudo-element label. On
  mobile the row goes vertical and the arrows rotate 90°.
- **Report frame** (`.report-frame`). A fake browser window — three traffic-light dots, a
  mono file path, and a yellow `open full report →` chip — wrapping two stacked screenshots
  with captions. The whole thing is one link and lifts on hover.
- **Install terminal** (`.install .terminal`). A dark rounded panel with its own traffic-
  light bar, a yellow `$` prompt, the command in large mono, and a copy button that turns
  green on success.
- **Status strip** (`.status`). One muted sentence above the footer, separated by a rule.

### `/prices` only, all prefixed `.tm-`

- **Segmented control** (`.tm-toggle`). Mono buttons in a bordered track; the pressed
  segment takes a yellow fill via `aria-pressed="true"`. Two instances: metric and axis.
- **Chart panel** (`.tm-panel`). White card, fixed-height canvas wrapper at
  `clamp(320px, 46vw, 520px)` with the canvas absolutely filling it.
- **Model chips** (`.tm-chip`). A grid of `auto-fill minmax(250px, 1fr)` checkbox rows, each
  with a colour swatch, a brand icon in a fixed-width slot, the model name, and its latest
  price. Doubles as the chart legend and its filter, so series identity never rests on
  colour alone. At the eight-series cap, unselected rows go to `opacity: 0.5` and
  `cursor: not-allowed`.
- **Coverage note** (`.tm-coverage`), **metric note** (`.tm-note`), **status line**
  (`.tm-status`, with an `.error` variant).
- **Table view** (`.tm-table`). A `<details>` disclosure containing a horizontally scrolling
  table with a sticky first column.

### `/runs` and run pages

- **Page head** (`.page-head`) — h1 plus lede, used by `/prices` and `/runs`.
- **Breadcrumb** (`.crumb`) — `runs / 2026-07-30`, mono, underlined link.
- **Identity strip** (`.run .identity`) — a `<dl>` rendered as an auto-fit grid of cells
  separated by 1px gaps showing the border colour through. Run date, kind, route matrix,
  total spend.
- **Status note** (`.run .status-note`) — tinted panel with a 4px yellow left rule and a
  small uppercase label, saying how much weight the run carries.
- **Jump list** (`.run .jump`) — a white panel of pill-shaped anchor links to every h2.
- **Prose** (`.prose`) — the imported markdown. h2s get a top border and 56px of top margin,
  the source file's own h1 is hidden because the page header already carries it, tables are
  wrapped in scroll containers by a rehype plugin, inline code gets a tinted chip.
- **Provenance line** (`.provenance`) — a muted note above the footer, separated by a rule,
  naming the source file in the other repo.
- **Table source line** (`.table-source`) — the same idea on the home page, under the
  scoreboard, linking to the full report.

---

## 6. My own notes on what looks wrong

These are raw observations from reading the CSS, not conclusions. Treat them as leads to
confirm, extend or reject, not as the answer. I specifically want you to find the things
that are **not** on this list.

**Three unrelated page-header patterns.** The home page opens with a full-bleed dark hero.
`/prices` and `/runs` open with `.page-head` — a plain h1 on cream with no kicker, no rule,
no dark surface, at a different clamp from the hero h1. A run page opens with a mono
breadcrumb. Nothing carries the dark surface or the numbered rhythm past the home page, so
the inner pages read as a different site.

**The numbered kicker rhythm breaks at the end.** Sections run `01 · COVERAGE` through
`05 · THE RUNS`, and then the install section's kicker is `GET STARTED` with no number.

**The kicker loses its identity off the hero.** In the hero it is yellow with a pulsing dot.
On cream it is `--muted` grey with no dot, which makes the same component read as two
different things.

**Two incompatible emphasis treatments for the same job.** `.hero h1 .em` is a 6px solid
yellow bottom border. `.section h2 .em` is a yellow gradient highlighter band sitting behind
the text between 62% and 92% of the line box. Both mean "this is the important phrase".

**Three left-rule accents at three widths in two yellows.** 4px `--accent-deep` on the run
status note, 3px `--accent-deep` on the chart coverage note, 3px `--accent` on blockquotes.

**Traffic-light dots are duplicated.** `.report-toolbar .dot` is 10px at `opacity: 0.8`;
`.install .terminal-bar .dot` is 12px at full opacity. Same three hardcoded hex values in
both rules.

**Focus states are almost entirely absent.** The only `:focus-visible` rule in 1837 lines is
on `.run-card`. Nav links, buttons, the segmented controls, the model chips, the jump pills,
the copy button and the `role="button"` receipt frame all fall back to the UA default ring
against a cream or dark background. The hero receipt frame is a div with `tabindex="0"` and
no visible focus treatment at all.

**`scroll-behavior: smooth` is global and unguarded.** No `prefers-reduced-motion` wrapper,
even though the chart page bothers to check the same query.

**The dark surface appears twice and never explains itself.** `--dark` is the hero and the
install terminal, at opposite ends of the home page, with 4000-odd pixels of unbroken cream
between them. Nothing else on the site is dark. It reads as two islands rather than a
rhythm.

**`.kind.metadata-scan` is unstyled** while the other two kinds have deliberate green and
amber treatments. A third of the published runs render with the fallback grey.

**Nav and footer are the same list twice** — prices, runs, github, `@CanaryOneOSS` — with
the footer adding only `MIT`. Neither has any hierarchy.

**`/prices` is called two different things.** The nav says `prices`; the page h1 says
`Time Machine`. The `<title>` says `Time Machine — CanaryOne`.

**`.btn` exists only in the hero.** Every other action on the site is a text link with a
1px bottom border that turns `--accent-deep` on hover. There is no secondary or tertiary
button, and no defined pattern for an action that is not the hero CTA.

**`--accent-soft` is declared and never used.** The README lists it as
"unused-but-reserved", which after this many pages is probably a sign it should either earn
a job or leave the palette.

**Heading weights are split 500 / 600 with no rule.** Display headings are 500; card
titles, prose h2/h3 and the report-frame chip are 600. `.prose strong` is 650, which is a
synthetic weight the system stack will approximate differently per platform.

**Nine bespoke shadows and fifteen radii** — see §4.5. Two hover shadows change hue to
yellow (`.report-frame`, `.run-card`) while two stay neutral (`.hub-card`, and the
scoreboard has no hover at all), so "hoverable" is signalled inconsistently.

**Body copy is 19px and `--muted` grey at `#6b7280`.** Section ledes are 19px muted, run
summaries are 19px muted, prose body is 17px at full `--text`. So the marketing pages set
long-form copy in grey and the document pages set it in near-black, at different sizes.

---

## 7. Constraints — things you must not propose

These began as `SPEC.md`'s non-goals list. SPEC.md was deleted on 2026-08-05 once it had drifted
too far from the site to be safe to read, so this is now the only place the list survives; it
needs a permanent home in README.md or DESIGN.md. All of it is still binding except where noted.

- **No web fonts.** System stack only. No Google Fonts, no Inter, no JetBrains Mono, zero
  external font requests. This is both a performance rule and an anti-mimicry rule.
- **No component libraries** — no Tailwind, no shadcn, Radix or Headless UI, no CSS-in-JS.
  Hand-written CSS with custom properties.
- **No dark-mode toggle.**
- **No gradient meshes or "as seen on" logo walls.** The hero gradients and dot grid are
  static.
- **Amended — one looping animation is allowed, and the hero flywheel is it.** The original
  rule was no hero animations at all, and it was dropped because a page with no movement
  anywhere reads as static and unfinished. The budget is one loop, above the fold, and
  DESIGN.md § Motion holds the argument for why it is not two.
- **Lifted — the site captures email.** "No email capture, newsletter, book a demo, or
  scheduling" was a non-goal when this was a one-page link to a GitHub repo. It is now a lead
  generation page for a platform in private beta, so the early-access waitlist is the point of
  the page rather than a violation of it. Scheduling and newsletter are still out.
- **No analytics of any kind.** Not Vercel Web Analytics, not Plausible, not GA.
- **No emojis in copy.**
- **No feature comparison tables against OpenRouter, Braintrust, LangSmith or anyone else.**
- **No claim that isn't already true in the product repo today.** Every figure on the site
  has to trace to a published artefact, which is why the provenance lines exist. Do not
  propose copy that invents a number, and treat the provenance lines as load-bearing
  content rather than clutter to be tidied away.
- Lighthouse targets: Performance ≥ 95, Accessibility ≥ 95. Astro ships zero JS by default
  and the only client JS is the copy button, the lightbox, the hub connectors and Chart.js.
- **Lifted:** the spec's original "single page, scroll only" and "≤ 3 viewport heights"
  rules no longer apply — they were dropped when the site grew past one page.

Two things are fixed by generated assets rather than CSS, so treat their proportions as
given: the logo lockup is a 714×131 viewBox at 5.4504:1, which is where the nav's 153×28
and the footer's 109×20 come from; and the OG card is 1200×630, composed by a script from
the logo, the headline and the receipt screenshot.

---

## 8. What I would find most useful back

1. A tokenised system I can paste into `:root` — a spacing scale, a radius scale, a type
   scale, and a small set of named elevations — with a rule for which token each existing
   use site should collapse to.
2. A decision on the page-header problem: one pattern that works for a marketing home page,
   a data page, an index and a long document, or an explicit argument for why these should
   stay visually distinct.
3. A component contract for the things that repeat: surfaces and cards, tables, notes and
   callouts, badges, links and buttons, and interactive controls. Including states — hover,
   active, focus-visible, disabled — since focus is currently missing almost everywhere.
4. Where the yellow should and should not appear, given the README's instruction to use it
   decisively. Right now it is in the hero underline, the primary button, the hub centre,
   the winner row treatment, three left rules, two hover shadows, the pressed segment, the
   terminal prompt, the report-frame chip, and two hairline gradients. I cannot tell whether
   that is decisive or diffuse and I would like a view.
5. Whether the two dark islands should become a real alternating rhythm, collapse to one, or
   something else.
