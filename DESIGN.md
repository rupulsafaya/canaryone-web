# CanaryOne design system

How this site is built, and the rules that keep it coherent. The colour palette itself is in
[`README.md` § Brand palette](./README.md#brand-palette-source-of-truth), which is canonical
for every CanaryOne repo — this document covers everything else, which is local to the web
site, plus the rules governing how the palette gets used.

Everything lives in one file, [`src/styles/global.css`](./src/styles/global.css). Hand-written
CSS with custom properties, no Tailwind, no CSS-in-JS, no component library.

## The one rule

**Nothing outside the `:root` token block should contain a literal length, radius, shadow,
duration, font size or colour.** If a use site needs a value the scale does not have, the
scale is wrong — widen it in `:root` rather than writing a one-off.

This exists because the file previously carried 15 distinct border radii, 9 bespoke
box-shadows, 24 font sizes, 30 spacing values and 9 content measures, none of them named.
The result looked fine at a glance and visibly noisy under inspection.

The documented exceptions, all deliberate:

| Exception | Why |
|---|---|
| `border-radius: 50%` on the traffic-light dots | On a square element it equals `--radius-full`, but 50% says "circle" where 9999px says "pill that happens to be square". |
| Six `clamp()` values carrying fluid section rhythm | These are intentional viewport-responsive values, not stray literals. |
| `margin: -1px` in `.sr-only` | Part of the visually-hidden clip idiom. |
| `0.01ms` in the reduced-motion block | A conventional near-zero, not a duration. |
| `font-size: 0.88em` on inline code | Relative to its parent on purpose, so a code chip scales with whatever text surrounds it. |
| `INK` in `prices.astro` | Chart.js takes colour strings and cannot read CSS variables. Each value carries a comment naming the token it mirrors, and they must be kept in step by hand. |
| The flywheel's SVG geometry in `archive/home-flywheel.astro` — two `stroke-width`s, `stroke-dasharray: 22 1075` and `stroke-dashoffset: -1097` | These are measured off the `#fw-circuit` path with `path.getTotalLength()` and mean nothing away from it, so a token holding one of them could never be reused. The dash array and the offset have to move together when the path changes. Archived rather than live since 2026-08-14; the row stays because the file is meant to be restorable. |
| `1px` hairlines and SVG `stroke-width`s | The scale has no token for the thickness of a mark, and a one-pixel rule is not layout rhythm. Every chart mark, panel border and table rule is 1px. |
| `3px` on a decorative rule | The one width canary is allowed to be on cream — the callout rule and the top rule on a numbered step. It is a fixed idiom rather than a value with a range, so a token would only be used by rules that must all match anyway. |
| Transform nudges of 1px and 2px on hover lifts | A one-pixel optical nudge is not layout rhythm, and `global.css` already does this at three sites. If it ever wants a token it should become one `--lift` used by both files, not a spacing token pressed into service. |

## Scales

Both the spacing and type scales were **derived from what the file already used**, not
imposed. That matters: an imposed type scale omitted `14px`, which was the second most common
size in the file, and would have silently absorbed nine use sites into `13px`.

**Spacing** is a 4px grid from `--space-0-5` (2px) to `--space-24` (96px). The old values sat
on a 2px rhythm, so snapping to 4px moved about half the use sites by 2px — imperceptible per
site, and it is what makes the values nameable. `--space-0-5` exists because inline elements
like code chips and badge padding need an optical adjustment that is not layout rhythm.

**Radii** collapse to five: `sm` 4px for inline code and badges, `md` 8px for buttons and
controls and chips, `lg` 12px for cards and panels and tables, `xl` 16px for framed
screenshots and terminal windows, `full` for stadium shapes.

**Elevation** is three levels plus three special cases. `--shadow-sm` is a card at rest,
`--shadow-md` is a card hovered, `--shadow-lg` is a large frame. `--shadow-cta` is the yellow
CTA glow, `--shadow-dark` carries the inset white hairline that reads as a lit top edge on
near-black panels, and `--shadow-pill-lit` is the lit state of a flywheel pill. Shadow rgba is
always neutral black unless the shadow *is* the yellow — a black shadow given a coloured rgba
comes out tinted, which is README brand rule 3.

**A `drop-shadow()` filter is a shadow and lives in the token layer too.** There are two.
`--glow-accent` trails the flywheel's travelling dot, and it stacks two shadows because a
single wide soft yellow reads as a blur rather than as light. `--glow-icon-on-dark` does the
opposite job: a tight black shadow under a third-party model mark, so a logo whose own artwork
is near-black keeps an edge against the hero panel. Those marks are other companies' assets
and cannot be recoloured, so the separation has to come from underneath them.

**Two component widths sit outside both the spacing scale and the measures**, because they cap
artwork rather than text and a `ch` value is meaningless for artwork. `--figure-max` capped the
flywheel, whose pills collided with the diagram's edges if it filled its grid column, and has no
live user since that page was archived; `--panel-max` is a standalone dark diagram, which reads
as a schematic at that width and as an empty band at full width.

**Type has two tracks**, because that is what this site is. Monospace marks anything that is a
fact, a path, a number or a label. Sans marks prose. The 1px gap between `--text-sm` (14px,
mono) and `--text-base` (15px, sans) is the seam between those tracks rather than a scale
step — nothing should ever need both.

Body is `--text-md` at 17px. Ledes are `--text-lg` at 19px. Three fluid display sizes cover
everything larger. There were four until the run reports were removed; `--display-sm` existed
only for the `h2` of their imported markdown.

**Subpage `h1` uses `--display-xl` and matches the home hero at 72px, changed 2026-08-11.**
It previously shared `--display-lg` with section `h2` at 56px, on the reasoning that an inner
page's title should carry the same weight as a section heading rather than its own arbitrary
size. In practice `/evals`, `/market` and `/market-v2` read as sections of the home page
rather than as pages in their own right. The change sits on the `.page-head h1` rule rather
than on the token, so section `h2` keeps 56px.

**`.page-head .lede` sets no colour, and that is deliberate.** It used to set `--muted`,
which is the cream-background token, and because it follows `.page-band .lede` at equal
specificity it won on source order — dark grey text on the near-black band at 2.51:1 against
the 4.5:1 body text needs. Leaving it unset lets `.page-band .lede` govern at
`--muted-on-dark` and 7.60:1. A `.page-head` on a light background instead inherits body
colour, which is also readable, so unsetting is more robust than swapping in another
hardcoded token.

**Never fight a clamp with a fixed override in a media query.** The display sizes are fluid
and their minimums *are* the mobile sizes. Overriding them at a breakpoint is how the file
ended up with six display sizes.

**Weights**: display and page headings are `--weight-medium`, UI and card titles and table
heads are `--weight-semibold`, and `--weight-bold` is reserved for the hub-and-spoke centre,
which reads as a mark rather than as text.

## The section shell

**Every section below a page's hero is the same five parts in the same order,** and they are one
set of classes in `global.css` rather than something each page invents:

| Part | Class | What it is |
|---|---|---|
| Eyebrow | `.kicker` | Two or three words naming the section. Muted on cream, canary on the dark band. |
| Statement | `h2` | A complete sentence ending in a full stop. |
| Paragraph | `.lede`, inside `.sec-copy` | One or two sentences at `--measure-lede`. |
| Claim | `.claim` | Optional. The one bold sentence a visitor understands before inspecting the thing below it. |
| Note | `.sec-note` | Optional. What a chart is showing or how to read a row, at prose measure. |
| Object | `.panel` | **Exactly one per section.** A chart panel, a comparison table, a diagram, a grid of cells. |
| Footer | `.evidence` | Provenance, caveats and disclosures, quietly. |

The footer has five parts of its own: `.evidence-src` for a run identifier, a date, a count or a
path, in mono; `.evidence-note` for a caveat in sans; `.evidence-caveat` for the one caveat that
stays visible when the rest goes behind a disclosure; `.evidence-cite` for a second measurement
cited in support, with a rule down its left edge; and `.disclose` for implementation detail.

**This exists because each page had invented its own grammar.** `/evals` had logo pills, an
architecture diagram and a fake browser window, with three footer treatments between them;
`/market` had `.tm-note` for prose and fifteen `.tm-coverage` callouts — tinted, with a yellow
left rule — which competed with the charts they annotated. Both classes are gone. `/market` reads
as one page because its charts are exhibits in one museum, and the shell is what makes the rest
of the site read the same way.

**What has to stay identical, because this is the whole point:** the copy measure, the gap from
copy to object, the object's border weight and radius, and the footer treatment. Anything that
wants to look different from this is a decision to argue for rather than a class to add.

**Nothing a figure depends on goes into a `.disclose`.** A number's date and the link to the run
it came from stay on the page — that is COPY.md's number gate, not a layout preference.

### The micro-label

`.micro` is the uppercase mono label above a block, on an axis, or naming a run. It replaced
**nine** classes across two pages that were the same five declarations with a different margin,
which is the token rule playing out one class at a time instead of one value at a time. The
margin it carries is the common case; a use site wanting another overrides only that. On the dark
band it takes `--muted-on-dark` the same way `.kicker` opts into yellow there.

### The selector, which is how a control works without JavaScript

`.sel` is a fieldset of hidden radios, `.sel-rail` is the row of labels styled as chips, and
`.sel-cards` holds one card per option with all but one hidden. Every variant renders at build
time and CSS shows one, so changing model or view costs no request and no script.

The rules pairing radio N with chip N and card N are generated, because the count is data — see
[`src/lib/selector.ts`](./src/lib/selector.ts), which records the two things about it that look
like style and are not: the pairing must win on **specificity** rather than source order, because
Astro emits scoped and global styles in an order that differed between dev and build; and the
fieldset needs `min-inline-size: 0`, because a fieldset will not shrink below its widest child and
that child is a chart carrying `--chart-min`.

**Put the rail above the object.** A control discovered after the thing it controls has been read
is a control nobody used.

## Where yellow is allowed

Canary yellow only works on dark. `--accent-deep` on `--bg` measures **1.87:1**, which is the
same number that disqualifies it as a focus ring.

**On a dark surface** yellow may be a foreground: the kicker, the terminal prompt, a
breadcrumb hover, the focus ring, the fading band hairlines.

**On cream** yellow may only be a fill sitting behind dark text — the primary button, the
selected chip on a `.sel-rail`, the highlight band behind a headline, the winner row tint, the
`OUTBOUND ONLY` pill where the arrow leaves the machine on `/evals` — or a 3px decorative rule,
where the label beside it carries the meaning and the rule is only drawing the eye, as on the
numbered steps.

**The crossing pill is the case worth understanding,** because the obvious version of it is
banned. The `/evals` machine diagram wanted a yellow arrow crossing the boundary, which is a
coloured line on cream and therefore out: at 1.87:1 nobody can reliably see it, and it would be
carrying the whole meaning of the diagram. A yellow chip carrying dark text, sitting on the
boundary the connector crosses, puts the accent exactly where the crossing happens and stays
legible. **A pill is not a licence for a line.**

**On cream yellow may not be text, a link underline, or a card's hover border.** Those read as
a wash that never resolves into emphasis, which is how a colour meant to be decisive ends up
looking incidental. Six hovered links were yellow before this rule existed, and they were
illegible.

`.kicker` defaults to muted and opts into yellow inside `.hero` and `.page-band`. That
direction is deliberate: a kicker added to a new cream section should not be able to come out
illegible.

**Low-alpha yellow gets its own tokens, and their names carry the constraint.**
`--accent-line-on-dark` at 25% is a yellow hairline and `--accent-bg-on-dark` at 4% is a yellow
wash. **Neither has a live use site as of 2026-08-17**, since the hero diagram was reshaped and
the last one went with it; both are kept under the archive exception in `global.css`, because
`archive/home-flywheel.astro` still uses them and restoring that page should be a `git mv`. The
`-on-dark` suffix is a rule rather than a description — on cream the hairline fails the
contrast above and the wash is invisible — so a use site that reaches for one of these on cream
is reaching for the wrong token. Alpha belongs in `:root` here for the same reason the
semantic `--good-bg` family keeps its alpha there.

## Icon-only links

GitHub and X carry no text label in either the nav or the footer, and both use the same
`.icon-only` component: square padding, `gap: 0`, a 32x32 target. The accessible name lives on
`aria-label` and `title` repeats it for a sighted reader on hover.

Do not compensate the padding with a negative margin between an adjacent pair. The padded box
is the hit target, and hit targets set the rhythm of a link row — pulling them together
collapsed the gap to 4px in the nav against 20px everywhere else.

## The header band

Every page opens on the same `--dark` surface. The nav is dark on every page and merges into
whatever sits beneath it — the full hero on the home page, a compact `.page-band` everywhere
else. Below the band each page is cream.

**Depth is the only thing that varies, and it varies by content rather than by a modifier
class.** `/evals` holds a kicker, a two-line title and a three-line lede; `/prices` holds a
title and a shorter lede and comes out shallower on its own. Nothing sets a depth directly, and
a new page should not start by doing so — give the band its content and let it size itself.

Giving subpages their own non-dark header colour was considered and rejected: two header
surfaces is the inconsistency the band removes, not a fix for it.

The band's bottom edge is a fading yellow hairline, not a solid rule. A solid full-width
yellow line under every page header would be far too much yellow for a treatment that appears
site-wide.

## Focus

One treatment, using `outline` rather than `box-shadow`. An outline follows the element's own
border-radius and composites with whatever shadow the element already carries; a box-shadow
ring erases the primary button's glow and every card's elevation on focus.

The ring is `--text` on light surfaces and `--accent` on dark ones. This is a contrast
constraint: WCAG 2.2 § 1.4.11 wants 3:1 for a focus indicator, `--accent-deep` on `--bg` is
1.87:1, `--text` on `--bg` is roughly 16:1 and `--accent` on `--dark` roughly 14:1. **Do not
"fix" the light ring back to yellow.**

Nothing in the stylesheet should set `outline: none` without putting an equivalent indicator
back.

## Tables

Data density is the point of this product, so both tables — the route comparison on `/evals`
and the model table on `/market` — share one contract, `.tm-data-table`.

Header rows are tinted, uppercase mono at `--text-2xs`, separated from the body by
`--line-strong` rather than `--line` so a head reads as a head. Body cells are `--text-sm`
mono with horizontal rules only, never vertical grid lines. Numeric columns right-align.

**Every cell carries `font-variant-numeric: tabular-nums`.** Proportional digits make a column
of prices visibly ragged, which is the one thing a cost table must not be.

The contract survives the drop from three tables to two on purpose: it is the thing a third
table should be built against rather than a shared rule worth inlining back into two places. The one known gap went with the run reports — their
imported-markdown tables wrapped inside numeric columns, and the fix would have meant teaching
a rehype plugin to detect them. That plugin no longer exists; no markdown is rendered on this
site.

## Third-party logos

**Since 2026-08-14 there is exactly one live logo row: the seventeen provider cells in the
`/evals` coverage grid.** The other three — two partner rows and two deploy-target rows in the old
home page's TUNE and DEPLOY sections, and the six open-weight model marks in its hero — went to
`archive/home-flywheel.astro` with that page. `pnpm build:logos` still generates every file,
because the archive is meant to be restorable and because a wordmark strip is the obvious thing a
future page reaches for. Everything below still governs the moment one comes back. They are the one
part of a page whose artwork we do not control, which is why they get a pipeline rather than a
rule.

**The tokens mean ink rather than box.** `--logo-h` at 26px is the bare wordmark strips on the
home page, `--logo-icon` at 32px is the square hero marks, and `--logo-icon-sm` at 26px is a
square mark beside one line of type. `--logo-h-lg` at 30px is unused since the `/evals` provider
hub was removed.

**`--logo-icon-sm` exists because the coverage grid was borrowing `--logo-h`,** a token
documented as a wordmark ink height, for a square glyph. At `--logo-icon`'s 32px the mark became
the tallest thing in its cell and set the cell's height; nothing named the size a labelled mark
actually wants. A square mark and a wordmark of the same nominal height are not the same optical
size, which is the whole reason the two scales are separate.

### The coverage grid is a labelled-mark row, and it is the documented exception

The rule below says to prefer a horizontal lockup to a bare mark in any row that names companies.
**The `/evals` coverage grid deliberately does the opposite:** seventeen square monochrome marks,
each with the company's name in our own mono beside it, in a five-column grid of identical cells.

Three reasons, in the order they mattered:

1. **Seventeen wordmarks is eleven typefaces.** Read as a block it was the busiest thing on the
   page, and the section's job is to say the coverage is broad rather than to be looked at.
2. **The library has no lockup for six of them.** Rendered as names beside eleven wordmarks they
   came out as a visibly second tier of support, which is a claim we did not intend to make.
3. **One of the colour marks is illegible on cream.** OpenRouter's is `#C8FF00`, about 1.3:1.

The prohibition it sets aside is that a bare-mark row cannot be read as names. A **labelled** mark
can, which is why the name is not optional here. `scripts/extract-adapters.mjs` copies only the
monochrome variant of each mark and reports any adapter that has none rather than copying a
coloured one, because a single coloured glyph in that row reads as a mistake nobody can account
for. Sizing the cell to its own content is also out: every cell is `--cell-min` tall and one
column of a `repeat(5, …)` grid wide, whatever its name is.

Those heights mean ink because [`scripts/build-logos.mjs`](./scripts/build-logos.mjs) crops every
logo's viewBox to its own artwork. Before that, `height: 24px` on a lobehub lockup drew between
20px and 24px of wordmark depending on how much padding the file happened to carry, and
CoreWeave's export carried 45% dead vertical padding, so it drew 11px of wordmark in a 20px row.

**Equal ink height is still not equal optical size, so the normalisation is on the body band.**
The script measures the shortest run of pixel rows holding 80% of a logo's ink — which lands on
the capitals and the x-height and ignores a lone descender — and pads each file until every band
is the same fraction of its box. Normalising total ink instead leaves a wordmark with a descender
rendering its capitals visibly smaller than one set in capitals; LangChain beside LlamaIndex was
exactly that, and it survived the cropping. All eighteen lockups now converge on a band of 0.460.

The band is a property of the artwork rather than of any render size, so **there is no table of
hand-tuned sizes to maintain.** Replace a logo file, re-run `pnpm build:logos`, and the new one is
normalised with the rest. `NUDGE` exists for artwork the measurement reads wrong and is currently
empty; an entry there should carry the reason, and a row that merely looks too big or too small is
a `--logo-h` question instead.

Marks normalise differently, on their longer side inside a square box, because there are no
letterforms to measure and a mark that is wider than it is tall should keep that proportion. This
is the same rule `build-logo.mjs` applies to the favicon.

Two rules follow from all this:

**Never put a `max-width` on a logo that has a height.** When a width clamp binds, the CSS
constraint table recomputes the height, so the clamp silently overrides it. `.dt-logo` carried
`height: 20px; max-width: 110px`, and nscale — 8.88:1 — wanted 178px of width, got clamped to
110px, and collapsed to 12.4px tall in a row of 20px logos. The row looked like a logo-sizing
problem and was a CSS specificity problem. Cropping to ink is what makes the clamp unnecessary;
do not reintroduce it to stop a wide lockup running off a row. Let the row wrap.

**Do not fade a logo to make it recede.** The partner rows sat at `opacity: 0.75`, which reads as
deliberate restraint on a solid black wordmark and as a printing fault on a two-colour mark —
LangChain and LlamaIndex looked broken rather than understated. Every logo now renders at full
opacity. If a row needs to sit back, that is a size or a spacing decision.

**Prefer a horizontal lockup to a bare mark in any row that names companies.** A row saying "we
deploy to these people" has to be readable as names, and half a row of unlabelled icons beside
half a row of wordmarks cannot be made to look like one system at any size. Scaleway, Vultr and
Lambda were bare marks and are now lockups. The hero strip is the deliberate exception: it is
decoration under a headline rather than a list, and six wordmarks there would compete with the
`h1`.

**A logo has to be legible on the surface it sits on, and the build checks it.** The script
measures each logo's alpha-weighted mean colour against its own group's background — cream for the
lockups, `--dark` for the hero marks — and fails below 1.6:1. Scaleway publishes only a
white-on-dark lockup, which measured 1.04:1 on cream; it is recoloured to `--text`, and that
recolour is only ever applied to artwork that is entirely one white, never to a logo carrying real
brand colour. Baseten's old file failed the same way from the other direction, shipping its own
green background plate so it read as a green pill among black wordmarks.

## Motion

Four durations. `--dur-fast` is a button press, `--dur-base` is hover and colour and border,
`--dur-slow` is lifts and frames, and `--dur-cycle` at 4s is one turn of the flywheel, which is
no longer on the site — see below.

**There is no looping animation on the site, and every remaining movement is
interaction-triggered.** That is the rule, and a loop is a design change to argue for rather than
a detail to add. The site is dense technical content, and a page that moves in several places at
once reads as a template rather than as a tool.

**This changed on 2026-08-14 and the reasoning is worth keeping.** Until then there was exactly
one loop, the home page's flywheel, and the budget was defensible because the loop was doing
work: it explained the thing the four pillars were trying to say, which is that testing, tuning,
deploying and improving is a cycle rather than a checklist. The company-level home page that
replaced it makes no cyclical claim — its hero says that many needs meet one system, which is a
structure rather than a process — so animating it would have been motion for its own sake. The
budget was not spent elsewhere; it was given up. **A page that wants the loop back has to argue
that its own diagram means something a still frame cannot show.**

The flywheel itself is intact at `archive/home-flywheel.astro`, outside `src/pages/` and
therefore not built. Its four tokens — `--dur-cycle`, `--figure-max`, `--shadow-pill-lit` and
`--glow-accent` — stay in `:root` with no live user, so restoring that page is a `git mv` rather
than a reconstruction. **They are the documented exception to deleting an unused token**, and a
second unused token needs its own reason rather than this one.

`prefers-reduced-motion` unwinds the global `scroll-behavior: smooth` along with all transitions
and animations. **Do not add a local reduced-motion block for a new animation** — the global block
caps every animation on the page at one iteration of `0.01ms`, which lands any loop on its first
frame, exactly what a local `animation: none` would show. Two local blocks existed in the old
`index.astro` and neither did anything the global block was not already doing.

## Breakpoints

Four, and there should not be a fifth. Custom properties cannot be used inside a media query
condition, so these are documentation rather than something the queries reference.

| Width | What changes |
|---|---|
| 480px | The nav stacks: lockup on its own row, links beneath. Was 380px until 2026-08-14, which was an unmeasured guess — the four links and the lockup stop fitting one row at about 455px, so the band between the two numbers showed the ragged wrap this breakpoint exists to prevent. |
| 640px | Type steps down, the band gives back a third of its depth, and a dense grid halves its columns — the coverage grid goes to one column here, because two leaves about 90px for a company name and truncates four of them. |
| 900px | Multi-column sections stack and horizontal chains go vertical: the hero's three stages, the three numbered steps, the machine diagram's three nodes. |
| 1024px | Reserved. |

## Generated assets

The lockup, both variants, the favicon and the OG card are all generated and committed. Run
`pnpm build:logo` then `pnpm build:og` when a new export lands. Third-party logos are generated
too, by a separate script — see § Third-party logos below, and README § Generated assets for
every command.

**`public/favicon.ico` is not optional either.** The `<link rel="icon">` tags cover the tab,
but Safari's Favorites, browser bookmark and history lists and most link unfurlers request
`/favicon.ico` by path and ignore the markup. It 404'd until 2026-08-05, which is exactly why
the icon rendered in the tab and nowhere else. See README § Generated assets for why the
`sizes="32x32"` hint on that link has to stay.

**`public/c1-logo-dark.svg` is not optional.** The light lockup normalises its wordmark to
`#0f0f10`, which is exactly `--dark`, so on the nav it would render as a yellow mark beside
nothing at all. `build-logo.mjs` emits the dark variant by swapping that fill for Canary 100
and throws if the fill it expects is missing.

Generate these, never hand-drop them. On 2026-08-03 a hand-dropped `favicon.png` silently kept
a stale yellow after the mark's colour changed.
