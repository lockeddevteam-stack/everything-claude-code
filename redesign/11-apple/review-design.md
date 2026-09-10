# Ship Review — LOCKED redesign against the Apple Design Spec

Reviewer: design manager, final review before ship
Spec of record: `redesign/11-apple/apple-design-spec.md`
Target: `redesign/08-build/` — 14 screens + `tokens.css`, `components.css`, `app.js`, `chrome.js`
Assembled demo: `redesign/10-final/locked-demo.html`
Date: 2026-09-10

## Note on which rubric I scored

The spec's **section 7** is the iOS 27 / WWDC 2026 changelog, not a rubric. The objectively
checkable, numbered list is **section 12, "The 1:1 Recreation Checklist"** — twelve items.
That is what I scored. Item 12 is inherently subjective, so it moves to the subjective
block along with three other qualitative claims the spec makes (§6.3, §8.7, §8.8).

## How this was measured

All numbers below come from Playwright 1.56.1 / Chromium at 393×852, DPR 2, both themes.
Scripts committed as `tests/agent-design-shots.mjs`, `-measure.mjs`, `-behaviour.mjs`,
`-collapse.mjs`, `-rhythm.mjs`, `-rhythm2.mjs`, `-motion-contrast.mjs`, `-controls.mjs`,
`-sheet.mjs`, `-sheet2.mjs`, `-demo.mjs`. 28 full-screen captures plus scrolled, sheet-open,
reduced-motion and forced-colors states were rendered and read.

---

# PART 1 — THE 12 HARD ITEMS (§12)

## 1. Type from the 11-style scale, tracking per size, optical split at 20pt — **1/2**

**Measured.** I walked every element in `.screen` that owns a direct text node and read its
computed `font-size`, `line-height` and `font-weight`: **784 text nodes per theme across all
14 screens**. Every computed size on 13 of 14 screens falls in
`{11, 12, 13, 15, 16, 17, 20, 22, 28, 34}` — the spec's table exactly, with the spec's
leading (17/22, 28/34, 34/41) and the spec's tracking applied as explicit `letter-spacing`
tokens (`--tr-body: -0.43px` at 17, `--tr-title-1: -0.8px` at 28 — both match §1.3's
published conversions to the decimal). `tokens.css` names the roles, not the sizes, and
aliases the legacy size-named tokens onto them so the two cannot drift.

**Why not 2.** `mockup-bodymap.html` renders **10 SVG muscle labels at 6.72px** — off-scale
by 4.3px below the floor the spec says Caption 2 never goes under. Those same 10 labels are
the only contrast failures in the entire build (see item 11). Second, the stack is
`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui` — pinning **SF Pro
Text** by name defeats §1.3's optical split at 20pt on any machine where that face is
installed but the variable `opsz` axis is not resolved; the spec's own recommended stack
(§1.4) does not name it.

## 2. Continuous corners, concentric nesting, nothing shares a radius with its parent — **1/2**

**Measured.** I read `borderTopLeftRadius` on every visible element and compared it to its
parent's. Across all 14 screens: **0 parent/child pairs share a radius**. No pinched corners
anywhere. `corner-shape: superellipse(1.8)` is applied and resolves on 4–85 elements per
screen (85 on workout-log, 27 on shopping, 22 on train). The radius ladder is disciplined —
only `{8, 12, 16, 999}` appear, all inside the spec's `{10, 12, 14, 20}` + capsule set.

**Why not 2.** Three things.
(a) §3.1 requires `corner-shape` to ship **with a JS/SVG clip-path fallback** because it is
Chromium-only. There is none — in Safari and Firefox, which is the majority of the target
audience for an iOS recreation, every corner in the app is a plain circular arc with the
visible kink the spec explicitly warns about above 16px.
(b) The corners that do resolve are not the iOS value. `superellipse(1.8)` is not 60%
smoothing; §3.1 puts the app-icon exponent near 5 and Figma's iOS preset at s ≈ 0.6.
(c) Nesting avoids the identical-radius trap but is not actually *concentric*. Measured:
`.seg` is r12 with 2px padding, so concentric would be r10 — the item inside is r8. `.btn`
is r12 inside a card of r16 with 16px padding — concentric would be r0. The rule that was
implemented is "never the same", not "parent minus padding".

## 3. Every spacing value on the 4/8 grid; screen margin 16pt — **1/2**

**Measured.** I collected `padding-*`, `margin-top/bottom` and `row/column-gap` from every
visible element on all 14 screens: **1,902 non-zero declarations**. The distinct values are
`2, 4, 8, 12, 16, 24, 32, 36, 48`. Exactly one is off-grid — **2px, appearing 208 times
(10.9%)** — in `.seg` padding, `.row__sub` margin-top and `.tabbar__item` gap. Everything
else is on the 4-grid, and the six-step token ladder (4/8/12/16/24/32) matches §5.3 minus
the 20 step. Screen margin measured **16px on all 14 screens** (`--page-x`), correct for a
393pt-class device per §5.1.

**Why not 2.** 208 declarations at 2px. It is one value and a defensible one (optical
half-step), but the spec says every spacing value sits on the 4/8 grid, and 10.9% of them
do not.

## 4. Exactly one accent tint per surface, on the primary action only — **0/2**

**Measured.** I counted elements ≥300px² whose computed background is a saturated non-gray,
plus accent-coloured text and borders, per screen. Results:

| Screen | Accent-carrying elements | Hues |
|---|---|---|
| home | 1 (Start Push) | 1 |
| onboarding | 1 (Create account) — plus accent-text "Continue as guest" | 1 |
| profile, split-builder | 0 visible | 0 |
| train | 4 — fill + "+ New" + CURRENT badge + active tab | 1 |
| progress | orange chart line + 6 orange dots + green "+17.8 kg" | 2 |
| review | green delta ×4 + PR pill green + red −53 kg + orange Save session | 3 |
| settings | green switch tracks ×2 (`rgb(63,217,139)`) — and **no** orange primary | 1, wrong one |
| shopping | orange primary + **3 green** tick fills + red "Clear all" | 3 |
| coach | tinted user bubbles ×2 + orange avatar marks ×2 + orange send FAB + active tab | 1 |
| fuel | **two co-equal full-width orange fills side by side** + 3 orange meter fills + orange "Meals" + orange ESTIMATE badge + 2 green VERIFIED badges | 2 |
| workout-log | **~15** — orange timer, orange "Discard", orange KG header, 4× orange PARTIALS, 4× orange-tinted "+" wells, orange AI Rec, orange bolt, 3 solid-orange 44×44 check fills, active tab, orange ring on the STATE pill | 1 |
| mockup-bodymap | 8+ saturated hues (red, magenta, purple, blue, teal, green, amber, grey) | 8+ |

`fuel.html` puts **two accent-filled primaries of identical weight adjacent to each other**
("Say it" / "Snap it"), which by definition means neither is the primary action.
`workout-log.html` has roughly fifteen accent instances on one 852px screen. This is the
single clearest, most repeated failure in the build, and it is the one a reviewer sees first.
**0.**

## 5. Every animation a spring, interruptible, 200–500ms, carrying gesture velocity — **1/2**

**Measured.** The spring layer is genuinely good and genuinely correct: `tokens.css` carries
`--spring-smooth / -snappy / -bouncy` as 35-point `linear()` samples generated by
`tests/gen-springs.mjs` from §4.2's corrected equations. I verified the overshoot numerically
from the token text — snappy peaks at **1.0063**, bouncy at **1.046**, smooth never exceeds
1.0. That is a real solved spring, not a cubic pretending to be one, and it runs on the
compositor.

**Why not 2.** I then counted what actually uses it. Across all 14 screens Chromium reports
**1,379 transition declarations**: **1,125 at 0.15s** and 254 at 0.3s, plus 11 keyframe
animations at 0.3s. So **81.6% of all motion in the build runs at 150ms — below the spec's
200ms floor.** And by timing function, `--ease` (`cubic-bezier(0.2,0,0.2,1)`, no overshoot)
is referenced on 19 CSS rules against 17 spring references; on the state-change path the
non-spring curve dominates. Gesture velocity: `.swipe__pane` carries `touch-action: pan-y`
and a snappy spring, but the transition is a fixed 150ms — it does not carry the release
velocity of the drag.

## 6. Every action has haptic feedback of the correct class — **1/2**

**Measured.** `grep` for `vibrate` across `app.js`, `chrome.js`, `components.css` and all 14
screens: **0 occurrences**. There is no haptic layer of any kind.

I am scoring this 1 rather than 0 because the spec itself (§10, Haptics) states the Vibration
API is unsupported in Safari on iOS and there is no web equivalent to the Taptic Engine, and
prescribes a specific compensation: "tighter visual press states". That compensation is
present and measurable — `-webkit-tap-highlight-color: transparent` is set,
`touch-action: manipulation` is global, and `:active` states with distinct
`--fill-press`/`--accent-deep` grounds exist on `.row`, `.btn`, `.chip`, `.opt`, the keypad
and the segmented control, at 150ms. The item as literally written is unachievable on this
platform; the fallback the spec asks for is done.

## 7. Glass only in the chrome layer; content cards opaque — **2/2**

**Measured.** I read `backdrop-filter` on every visible element on all 14 screens.
It resolves to a non-`none` value on **exactly two component classes: `.tabbar` and
`.findbar--bottom`** — both chrome. Value is `saturate(1.8) blur(20px)`, inside §6.4's
readable 12–30px band, with `-webkit-` prefix present and an `inset 0 1px 0` specular
highlight on the top edge, matching the §6.4 recipe. **Zero content elements carry glass.**
Every `.card` computes to a fully opaque background (`#141416` dark, `#F5F5F8` light).
`@media (prefers-reduced-transparency: reduce)` swaps `.glass`, `.glass--clear` and `.tabbar`
to an opaque `--surface-raised` with `backdrop-filter: none`.

This is the item the build gets exactly right, and it is the hardest one to get right. **2.**

## 8. Large title collapses natively; search sits at the bottom on iPhone — **1/2**

**Measured.** 6 of 14 screens declare `data-large-title`. I set `scrollTop = 300`, dispatched
scroll, waited two frames, and read both title elements:

| Screen | large title opacity | small title opacity | bar height |
|---|---|---|---|
| progress | 1 → 0 | 0 → 1 | 69 → 44px |
| exercise-library | 1 → 0 | 0 → 1 | 69 → 44px |
| train | 1 → 0 | 0 → 1 | 69 → 44px |
| fuel | 1 → 0 | 0 → 0.615 (partial, only 41px of scroll available) | 50px |
| profile | 1 → 0.754 | 0 (only 8px of scroll available) | 69px |
| **coach** | **0.508 at rest** | 0 | 65px |

Search: `exercise-library.html` puts the field at the **bottom** above the tab bar — correct
per §8.3. Scroll-edge effect is wired (`data-scroll-edge`) on all six.

**Why not 2.** Three defects.
(a) It is a **crossfade between two fixed sizes, not a morph**. `font-size` reads 34px on the
large title and 17px on the small title before and after — nothing interpolates. §8.1 asks
for 34pt bold left-aligned morphing to 17pt semibold centred.
(b) **`coach.html` renders at rest in a half-collapsed state** — large title at 50.8% opacity,
small title at 0, bar at 65px. The title is visibly faded on load with no scroll applied.
That is a visible bug on a shipping screen and it is in the screenshot.
(c) Expanded bar measures **69px**; §5.1 puts the large-title nav bar at ~96pt (44 + 52).
`mockup-bodymap.html` puts its search field at the **top**.

## 9. Sheets use detents, grabber when resizable, dim only when interrupting — **1/2**

**Measured** by opening the "Shop at" sheet on `shopping.html`: height **358px**, grabber
present (**36×4px**; Apple's is 36×5), `data-sheet-drag` handle present, scrim
`rgba(0,0,0,0.5)`, entry animation `sheetUp 300ms --spring-snappy`. Top radius **16px**,
bottom radius **0px**, `left: 0` — full-bleed to the screen edges.

**Why not 2.** There is **one detent**, not a set — the sheet has a single fixed height, so
"grabber when resizable" is not a decision the system is making, and `.presentationDetents`
has no analogue here. §8.6's iOS 26 rule is explicit: partial-height sheets are **inset by
default with a glass background**, and at smaller heights the bottom edges pull inward to
nest in the display's curved corners. This sheet is edge-to-edge, opaque, square-bottomed.
Top radius is 16px where `--r-xl: 22px` already exists in tokens and matches Apple's ~22pt
sample value — the right token is defined and not used. Dimming is unconditional (0.5 scrim
on every sheet), so the "skip dimming when the task runs in parallel" half of the rule is
not implemented.

## 10. All symbols SF Symbols, weight-matched to adjacent text — **1/2**

**Measured.** I read every visible `<svg>` and its children across all 14 screens — **168 UI
icons**. The consistency is genuinely strong: **every one is `viewBox="0 0 24 24"`, rendered
at 20×20 CSS px, `stroke-width: 1.75px`, `stroke-linecap: round`**. One family, one grid, one
weight, no exceptions in the main set. That is better than most shipping apps.

**Why not 2.** Four measured breaks.
(a) **Emoji used as content icons**: `fuel.html` uses 🍳 🥗 🥤 🍽 as meal-row icons and
`shopping.html` uses 🥚 🍠. These are a second, incompatible icon family — full-colour,
platform-drawn, no stroke weight — sitting in the same rows as 1.75px line icons.
(b) `workout-log.html` mixes **two optical sizes on one screen**: 20 icons at 24×24 and 17 at
20×20.
(c) `shopping.html`'s tick marks are 14×14 at **stroke 3px** — a stroke/size ratio of 0.214
against 0.0875 everywhere else, so they read visibly heavier than every other icon.
(d) **Weight is not matched to adjacent text.** Stroke is a constant 1.75px whether the label
beside it is an 11px Caption 2 or a 28px Title 1. §2.1 asks for the symbol weight to track
the text weight; here it is fixed.
(e) The "Shop at" sheet uses bare letters **"W"** and **"T"** in place of icons.

## 11. Survives AX5, Reduce Motion, Reduce Transparency, and dark mode — **1/2**

Four sub-conditions; three hold, one fails outright.

**Dark mode — passes, strongly.** Two fully authored token sets, not a filter. I computed
WCAG contrast for all **784 visible text nodes in each theme** against their resolved opaque
ancestor background: **0 failures in dark**; **9 failures in light**, every one of them a
`mockup-bodymap.html` SVG muscle label at 6.72px, ranging 3.01–3.57:1 against a 4.5
requirement. 1,559 of 1,568 measured text nodes pass. `tokens.css` documents the measured
pair table and records corrections where a shipped value had failed (`--border` moved from
`#35353A` at 1.51:1 to `#6A6A74` at 3.18–3.81:1).

**Reduce Motion — passes.** 7 `@media (prefers-reduced-motion: reduce)` blocks across
`components.css` and `tokens.css`. Rendered under `reducedMotion: 'reduce'` without error.

**Reduce Transparency — passes.** 2 blocks; glass surfaces resolve to opaque
`--surface-raised` with `backdrop-filter: none`.

**AX5 — fails outright.** Every type token is an absolute `px` value. I set
`document.documentElement.style.fontSize = '53px'` (AX5's Body anchor per §1.2) on all 14
screens and re-read the computed size of the first text-bearing element: **it changed on
0 of 14 screens.** There is no `rem`/`em` scaling path, no `text-size-adjust` strategy, no
container queries. The build cannot respond to Dynamic Type at any category, let alone AX5.
§11 opens by saying accessibility is "not optional polish" and that AX5 "is where hardcoded
frames break" — the frames here are all hardcoded.

Three of four is a 1.

## 12. The primary element is identifiable within two seconds

Moved to the subjective block — it is a judgement, not a measurement.

---

## Hard-item scorecard

| # | Item | Score |
|---|---|---|
| 1 | Type scale, tracking, optical split | 1 |
| 2 | Continuous + concentric corners | 1 |
| 3 | 4/8 spacing grid, 16pt margin | 1 |
| 4 | One accent tint per surface | **0** |
| 5 | Springs, 200–500ms, velocity | 1 |
| 6 | Haptics | 1 |
| 7 | Glass in chrome only | **2** |
| 8 | Large-title collapse, bottom search | 1 |
| 9 | Sheet detents, grabber, dimming | 1 |
| 10 | SF Symbols, weight-matched | 1 |
| 11 | AX5 / RM / RT / dark | 1 |
| | **Total (items 1–11)** | **11 / 22** |

---

# PART 2 — SUBJECTIVE ITEMS

## §12.12 — The primary element is identifiable within two seconds — **1/2**

On home, train and onboarding this is emphatically true: a single orange capsule, one per
screen, sitting exactly where the eye lands after the title, with everything else in semantic
gray. Home in particular is a genuinely well-edited screen — the build notes document cutting
ten blocks down to four, and the result is a screen that answers one question and hands you
one button. Profile and split-builder are calm and legible. But the average across the
thirteen is dragged down hard by the screens where accent discipline collapsed: on
`workout-log` there is no primary element at all — fifteen orange things compete and the eye
settles on the three solid check squares, which are per-set confirmations, not the screen's
purpose. On `fuel` the two adjacent orange fills actively cancel each other, and I could not
tell you in two seconds whether the screen wants me to speak or to photograph. On
`mockup-bodymap` the primary element is a rainbow anatomical figure that is not an action at
all. Roughly half the screens pass this cleanly and half fail it; that is a 1.

## §6.3 / §12 — iOS 27 material treatment (darkened edge stroke, brighter speculars) — **1/2**

The spec flags this as qualitative and unpublished, so I judged it on whether the build made
a considered attempt. It did, partially. The glass recipe follows §6.4 closely — 20px blur
and 1.8 saturation, both inside the readable band, with an `inset 0 1px 0 --glass-specular`
top highlight that is the specular the spec describes, and a `--glass-tint` at 0.82 alpha
that adapts between themes. What is missing is iOS 27's headline change: there is **no
darkened edge stroke** around the glass elements — §6.4 asks for a hairline
`border: 1px solid rgba(255,255,255,0.18)` and §6.3 for a darkened outer stroke on top of it,
and the tab bar carries only the inset top highlight, no outer edge at all. In the
screenshots the tab bar therefore has no defined boundary against the content above it; it
reads as a slightly lighter band, not as a floating pane of glass. There is also no
displacement/refraction layer and no attempt at one, which the spec permits as the shipped
fallback but which means the material never actually looks like Liquid Glass — it looks like
a translucent bar, which is iOS 16.

## §8.7 — Menus and action sheets spring from the control that triggered them — **0/2**

Measured as well as judged: `transform-origin` appears twice in the entire stylesheet, on
`.week__mark` and on the collapsing title, and on neither a sheet nor a menu. Every sheet in
the build animates with `@keyframes sheetUp { from { transform: translateY(100%) } }` — it
slides up from the screen edge, which is precisely the behaviour §8.7 tells you not to use
under Liquid Glass. The "Shop at" sheet is triggered by a button sitting in the middle of a
card near the top of the screen, and the panel it produces rises from the bottom bezel with
no geometric relationship to that button. The rule is stated plainly in the spec and it is
not implemented anywhere. **0.**

## §8.8 — Empty, loading and error states designed as instructions — **2/2**

This is done properly and I want to say so. `components.css` carries a real `.empty`
component with the four-part `ContentUnavailableView` anatomy — icon well in
`--text-tertiary`, a 17px semibold title, a 13px secondary body capped at `max-width: 30ch`
so it never runs to a full-width paragraph, and an action button below with an 8px gap. There
is a matching `.skeleton` so a loading state is distinguishable from a loaded one rather than
being a spinner over nothing. The `fuel` screen's "Dinner — usually 7:30, about 40 g protein,
closes today" row is exactly what §8.8 asks for: an empty slot written as an instruction for
the next action rather than a blank. The build notes also record removing a "999 days"
sentinel, which is the same discipline applied to degenerate data. **2.**

**Subjective total: 4 / 8.**

---

# PART 3 — DESIGNER'S READ OF THE SCREENSHOTS (393×852, both themes)

### Does any screen have more than one accent fill competing for attention?

Yes — seven of thirteen.

The worst is `workout-log`, where I counted roughly fifteen accent instances in one fold: the
running timer, the "Discard" action, the KG column header, four "PARTIALS" labels, four
orange-bordered "+" wells, "AI Rec", the lightning bolt, three solid orange 44×44 check fills,
the active tab, and an orange focus ring drawn around the STATE pill. Nothing recedes.

`fuel` is the more instructive failure because it is a composition error rather than an
accumulation one: "Say it" and "Snap it" are two accent-filled capsules of identical width,
weight and height, sitting flush against each other separated by a hairline. Two primaries is
zero primaries. Below them three macro meters are also filled in the same orange, so the eye
gets five orange bars stacked in the top half of the screen.

Then there is hue proliferation. Green (`#3FD98B` dark / `#12693E`-family light) is a second
accent that appears on settings toggles, shopping tick boxes, fuel's VERIFIED badges, review's
PR pill and every positive delta. Red appears on "Clear all" and negative deltas. `review`
carries orange, green and red simultaneously. `mockup-bodymap` carries eight saturated hues at
once and belongs to no system at all.

Clean screens: home, onboarding, profile, split-builder. Four out of thirteen.

### Is the type hierarchy readable in one glance?

Mostly yes, and this is the build's real strength. The scale is being used as a scale rather
than as a bag of sizes: a 13px uppercase tracked eyebrow, a 34px bold large title, 17px body,
15px secondary, 13px tertiary — and crucially the weight and colour move together with the
size, so on `home` you read "5 weeks / ON PLAN → Push → Start Push → LAST SESSION" in that
order without effort. `profile` and `settings` are textbook grouped-list hierarchy. Numbers
are tabular and carry their units, which is a detail most teams skip.

Two screens break it. `workout-log`'s header crams a 22px title, an orange 17px timer, two
metrics, a bolt button, a "Discard" text button and the STATE pill onto one 60px line — seven
elements at four different weights, none dominant. And `review` renders five right-aligned
green/red deltas at the same 17px bold as the exercise names beside them, so the column of
numbers fights the column of labels instead of supporting it.

### Is the vertical rhythm consistent?

Yes, and this one measures clean. I read the gap between every pair of adjacent top-level
blocks in each scroll body: **24px between sections on home, train, fuel, progress, shopping,
review and settings — identical on all seven**. `workout-log` uses a consistent 12px between
exercise cards. Every gap in the build is on the 4-grid.

The one inconsistency is the first gap under the header, which is 16px on home/review/fuel and
12px on progress/profile — `mt-4` versus `mt-3` in the same structural slot. It is small and
it is fixable in two lines, but it means the top of the content area sits at a different
height depending on which tab you are on, and on a tab bar you feel that as a jump.

Separately, `home` and `onboarding` have a rhythm problem of a different kind: dead space.
Home's content ends at y≈1200 of a 1704px (2×) fold, leaving roughly 350 real pixels of empty
ground above the tab bar. Onboarding is worse — a headline sitting 30% down, then 500px of
nothing, then the buttons. Neither is *inconsistent*, but neither is composed either.

### Does anything look like a web page rather than an iOS app?

Yes. The single worst offender: **the native `<select>` in the RIR column of
`workout-log.html`** — a bordered rectangle with a browser-drawn chevron, sitting in a row of
hand-built number fields. On iOS that value is a picker or a stepper; here it is unmistakably
an HTML form control, and it is repeated on every set row on the screen. There are six
`<select>` elements in the build (3 in shopping, 2 in exercise-library, 1 in workout-log).

Close behind:
- **Every button is a 12px-radius rounded rectangle at 44px tall.** §3.2 says buttons are
  capsules by default. A 12px radius on a 44px-tall button is the Bootstrap/Material shape,
  not the iOS one, and because it is systematic it is the thing that most makes the whole app
  read as web. The search field is the same — 48px tall at r8, where iOS draws a capsule.
- **The dashed 1px border** on review's "COACH NOTE" box. Dashed borders do not exist in iOS.
- **The `.sheet` slides up from the bezel** with square bottom corners and full-bleed edges —
  a bottom-sheet, not an iOS 26 inset sheet.
- **The tab bar is glued to the bottom edge**, 393px wide, 0px radius, 56px tall. §8.2 is
  explicit that in iOS 26 the tab bar floats over content, centred, no longer glued to the
  edge. Measured left inset 0, right inset 0, radius 0px.
- **The "STATE" pill in the nav bar of all 13 screens** and the floating "SCREENS" pill in
  the demo. These are demo scaffolding occupying the trailing nav-bar slot where a real
  action belongs, and in light theme the STATE pill is white-on-white with only a shadow
  separating it.

### Are the icons a consistent family?

The line-icon set is excellent and I would ship it as-is: 168 icons, every one on a 24-unit
grid, every one rendered at 20×20, every one at stroke 1.75 with round caps. That is a real
system.

It is broken in four places. Emoji (🍳🥗🥤🍽 in fuel, 🥚🍠 in shopping) are a full-colour
second family sitting in the same rows as the line icons. `workout-log` mixes 24×24 and 20×20
optical sizes on one screen. Shopping's tick glyphs run stroke 3 at 14×14 — 2.4× the stroke
ratio of everything else, so they punch visibly heavier. And the shop sheet substitutes the
letters "W" and "T" for icons entirely. Corner treatment is uniformly round-capped; that part
never wavers.

### Does the light theme look designed, or like the dark theme flipped?

**Designed.** This is the strongest single piece of craft in the build and I checked it three
ways. The accent is re-picked, not inverted: `#F97316` in dark becomes `#C2410C` in light, and
`--text-on-accent` flips to white, because the bright orange cannot carry white text at 4.5:1
— that is a decision, not a transform. The elevation model *reverses correctly*: in dark,
raised means lighter (`#141416` card on `#0A0A0B` ground); in light, raised means white
(`#FFFFFF`) on a lavender-tinted `#E9E9F0` ground, which is Apple's grouped-background
behaviour, while fills move the *opposite* direction (`#D8D8E5`, darker than the card) — the
token file explicitly separates `--fill` from `--surface-raised` for exactly this reason and
documents why. Separate `--fill-press` values exist per theme so pressed states move a
measurable step in both. And it measures: 0 contrast failures in dark, 9 in light, all nine
confined to one screen's 6.7px SVG labels.

Two places where the flip does show through. On `home`, the week track's "trained" mark
inverts to pure `#0A0A0B` — in dark it is a white chip that reads as a filled day, in light it
is a black hole that reads as a void. It needed to become the accent or a mid-gray, not the
inverse. And the STATE pill goes white on a white nav bar with only a shadow to hold it.

### The single worst-looking screen

**`mockup-bodymap.html`**, and it is not close.

It is the only screen in the build that belongs to no design system. An anatomical figure
filled with eight fully saturated hues at once — crimson pectorals, magenta calves, violet
delts, cyan forearms, amber abs, two greens for quads and hamstrings — each with gradient
fills and grey outlines, against the app's calm neutral ground. Nothing about it is Apple; it
reads as stock medical clip art dropped into a fitness app. It carries the only off-scale type
in the build (10 labels at 6.72px, 4.3px below the Caption 2 floor), the only contrast
failures (nine, at 3.01–3.57:1 against a 4.5 requirement), and nine sub-44px tap targets
(measured 13×179, 18×46, 19×80, 26×89 — thin muscle strips that no thumb can reliably hit).
Its search field sits at the top, contradicting §8.3 and contradicting `exercise-library`,
which puts the same field at the bottom. It has no tab bar. Its 140 animation declarations are
more than any other screen except workout-log.

The runner-up is `workout-log.html` — better structured but visually the loudest thing in the
app, with fifteen accent instances and the native `<select>`.

---

# VERDICT

## DO NOT SHIP

The foundation is real and I want that on the record: the type scale is Apple's, applied
correctly across 784 measured nodes; the spring curves are solved from the corrected WWDC23
equations rather than eyeballed; glass is confined to the chrome layer with zero leakage into
content, which almost nobody gets right; the light theme is independently authored and proves
it with 1,559 of 1,568 text nodes passing contrast; the icon grid is disciplined; the vertical
rhythm measures at a uniform 24px across seven screens. Roughly 70% of a very good iOS
recreation is in this build.

But it fails on the two things the spec treats as non-negotiable. Accent discipline — the
item the spec puts fourth and states as an absolute — is broken on seven of thirteen screens,
with one screen carrying fifteen accent instances and another carrying two co-equal primary
fills. And the build has no Dynamic Type path at all: every size is a hardcoded pixel, and I
verified that AX5 moves nothing on any of the fourteen screens. §11 opens by saying Liquid
Glass shipped broken partly because accessibility was treated as optional polish. Shipping a
recreation with zero type scaling repeats that mistake deliberately.

## Ordered list of what must change first

1. **Accent triage — one fill per screen, on the primary action only.**
   `workout-log` from ~15 accent instances to 1. `fuel`: pick one of "Say it"/"Snap it" as
   the filled primary and demote the other to a secondary; demote the three macro meters to
   `--fill` with a neutral track. Demote CURRENT/ESTIMATE badges, the KG header, PARTIALS
   labels, and the "+" wells to `--text-secondary`. This is the change that decides whether
   the app reads as Apple.

2. **Retire the second and third accent hues, or give them semantic-only jobs.**
   Green appears as a fill on settings toggles, shopping ticks, fuel badges and review's PR
   pill. Either accept green as the system's success semantic and use it *only* as text/glyph
   (never as a fill competing with orange), or remove it. Same for red beyond destructive
   confirmation.

3. **Rebuild or cut `mockup-bodymap.html`.**
   Eight hues, ten 6.7px labels, nine sub-44px targets, nine of the build's nine contrast
   failures, a top-anchored search field. Restyle to a single-hue heat scale on the app's
   ground with a 24-unit label size and 44pt hit regions, or drop it from the ship set.

4. **Add a Dynamic Type path.**
   Move `--type-*` to `rem` anchored on the root, so the scale responds to the user's text
   size, then re-run every screen at AX5 and fix the frames that break. This is the single
   largest piece of work on the list and the one the spec is least willing to negotiate.

5. **Fix the two visible bugs.**
   `coach.html` renders its large title at 50.8% opacity at rest — a half-faded title on load.
   And the first content gap under the header is 16px on some tabs and 12px on others; unify
   to one value so the content top does not jump between tabs.

6. **Make buttons capsules.**
   `.btn` at 44px tall with r12 is the single most web-looking systematic decision in the
   build. Move to `--r-full`. Same for the search field (48px at r8 → capsule). This is a
   two-line change with an outsized effect on how iOS-native the whole app reads.

7. **Replace the native `<select>` controls** (6 across workout-log, shopping,
   exercise-library) with the build's own sheet/picker component. Remove the dashed border on
   review's coach note.

8. **Raise the motion floor and extend spring coverage.**
   1,125 of 1,379 transitions run at 150ms; move `--dur-fast` to 200ms and switch the
   remaining `--ease` state-change rules onto `--spring-snappy`, which already exists and is
   already correct.

9. **Float the tab bar** — inset from the screen edges with a capsule/rounded shape and an
   outer hairline edge stroke per §6.3/§8.2, instead of a full-bleed 56px square-cornered
   band glued to the bottom.

10. **Sheets: inset them, round the bottom, add a second detent**, and give the sheet a
    `transform-origin` relationship to its trigger so it springs from the control rather than
    from the bezel (§8.7). Move the top radius to the `--r-xl: 22px` token that is already
    defined and unused.

11. **Ship a corner-shape fallback.** `superellipse(1.8)` resolves only in Chromium; add the
    SVG clip-path path at smoothing 0.6 so Safari and Firefox do not fall back to circular
    arcs on every card, and re-tune the exponent toward the iOS value.

12. **Remove the demo scaffolding from the product surface** — the STATE pill from the nav
    bar of all 13 screens and the floating SCREENS/`<>` pills — or move them behind a
    long-press so they stop occupying the trailing nav-bar action slot.

13. **Icon cleanup.** Replace the six emoji with line icons from the existing 24-grid family;
    unify workout-log to one optical size; bring shopping's tick glyphs to a 1.75 stroke
    ratio; replace the "W"/"T" letter placeholders.

Items 1–5 are ship blockers. 6–9 are what separate "close" from "convincing". 10–13 are the
polish pass.
