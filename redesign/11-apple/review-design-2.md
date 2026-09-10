# Ship Review 2 — LOCKED redesign against the Apple Design Spec

Reviewer: design manager, second ship review
Spec of record: `redesign/11-apple/apple-design-spec.md`
Prior review: `redesign/11-apple/review-design.md` (verdict: DO NOT SHIP, 15/30)
Claims under test: `redesign/11-apple/spec-compliance.md`
Target: `redesign/08-build/` — **13** screens + `tokens.css`, `components.css`, `app.js`, `chrome.js`, `bodymap.js`
Assembled demo: `redesign/10-final/locked-demo.html`
Date: 2026-09-10

`mockup-bodymap.html` is out of the ship set by agreement and is not scored.

## How this was measured

Playwright 1.56.1 / Chromium, 393×852, DPR 2, both themes. Scripts committed as
`tests/agent-design2-shots.mjs`, `-measure.mjs`, `-detail.mjs`, `-ax5.mjs`, `-chrome.mjs`,
`-sheet.mjs`, `-contrast.mjs`, `-icons.mjs`, `-misc.mjs`. 26 at-rest captures, 13 AX5
captures, 7 scrolled captures, 3 sheet-open captures, reduced-motion and forced-colors
states. Every figure below is from those runs, not from the build's own suite. Where I
disagree with a claim it is because I re-measured it and got a different number.

---

# PART A — VERIFYING THE THIRTEEN

## 1. Accent triage — one fill per screen, on the primary action only
### PARTLY (large, real improvement; the rule is not actually held)

**Measured.** Every element ≥300px² whose computed background is a saturated non-gray,
per screen, at rest:

| screen | orange fills | other saturated fills | accent inks |
|---|---|---|---|
| home, train, onboarding, review, coach | 1 | 0 | 1–7 |
| exercise-library, profile, progress | 0 | 0 | 2–6 |
| fuel | 1 (the split control) | 0 | 6 (incl. amber ESTIMATE, 2× green) |
| settings | 0 | 2 green switch tracks | 3 red |
| shopping | 1 | 3 green ticks (22×22) | 3 |
| split-builder | 0 | 12 red `.swipe` panes (occluded) | 1 |
| workout-log | 1 (Finish, 68×44) | 3 green `.done` (44×44) | 7 |

Workout-log went from ~15 accent instances to 1 orange fill. Fuel's three macro meters are
now neutral grey. That is the single biggest visual improvement in the build and it is real.

**Why not verified.** Three things the claim and the enforcing test both miss:

(a) `tests/accent-audit.mjs` returns early on `el.namespaceURI !== 'http://www.w3.org/1999/xhtml'`,
so **SVG is never counted**. `progress.html` draws its 1-rep-max chart as an orange
polyline with 7 orange 6px dots inside a 329×184 SVG. It is the loudest object on the
screen, it is not an action, and the screen's only button ("Choose another lift") is grey.
Under §12.4 that is exactly the violation the item names, and the audit reports `fills 0`.

(b) The audit measures **at rest only**. Open the numeric pad on `workout-log` (`.cell`)
and the sheet carries **four orange-outlined stepper buttons (−5 / −2.5 / +2.5 / +5), an
orange "Done", and a red "DEL"** — six accent instances on one surface. The settings
"Weight unit" sheet puts a solid orange 32×32 checkbox next to a grey one. States are
where accent discipline is easiest to lose and the harness does not look there.

(c) On `workout-log` the three saturated green 44×44 check fills are now the loudest thing
in the fold. They are per-set confirmations, i.e. the same objects the previous review
called out — recoloured, not demoted. The orange Finish still wins on position, so I do not
call this a failure of the primary-element test, but §12.4 says *one tint per surface*, and
this surface carries orange, green and red.

## 2. Second and third hues, semantic only — **VERIFIED FIXED**

`tokens.css` now defines a four-role semantic set — `--accent`, `--success`, `--warning`,
`--danger` — each with a `-quiet` ground, re-picked per theme (success `#3FD98B` dark →
`#0F6B41` light). Measured: the only green fills anywhere are a switch that is on, a tick
that is ticked and a set that is done; the only red fill is the swipe-to-delete pane
underneath a row. Both are state and consequence. This is the correct answer to the item
and it is documented in the token file.

Note for the record: fuel's amber `--warning` ESTIMATE badge makes that screen carry four
hues at once (orange fill, amber badge, two green badges, plus the orange "Meals" link) in
a 400px band. Semantically each is defensible; compositionally it is busy.

## 3. Rebuild or cut `mockup-bodymap.html` — **VERIFIED FIXED**

Gone from `08-build`. 13 screens remain. I re-ran contrast across every visible text node
in both themes: **1,564 nodes, 0 failures**, against 9 failures before — all nine were that
file's 6.72px SVG labels. The body map inside `exercise-library` and `progress` renders no
text. The smallest type in the build is now 11px, the Caption 2 floor.

## 4. Add a Dynamic Type path — **PARTLY**

**The scaling path is done and it is done well.** Every `--type-*` and `--lh-*` is `rem`,
every `--tr-*` is `em` so tracking scales with the size. `html { font-size: 100% }` — the
`font-size: var(--type-15)` that would have silently shrunk the whole ladder by 15/16 is
gone, and `"SF Pro Text"` is out of the stack, so §1.3's optical split is no longer pinned.
At the default root the rendered ladder is `{11, 12, 13, 15, 17, 22, 28, 34}` — Apple's
table. At AX5 (root 49.88px, Body anchor 53) it is `{34, 37, 41, 47, 53, 69, 87, 106}` and
**type moved on 13 of 13 screens**, against 0 of 14 before. That is the largest piece of
work on the list and the mechanism is correct.

**But the screens do not survive AX5, and the test that says they do is measuring the wrong
thing.** `tests/dynamic-type.mjs` asserts
`document.documentElement.scrollWidth > clientWidth`. `.screen` sets `overflow-x: hidden`,
so that condition can never fire — the document width is pinned at 393 by construction. I
re-measured per element (`scrollWidth > clientWidth` on text-bearing nodes) and then looked
at the renders:

- **`home` at AX5:** "Today" collides with the account avatar; the week track collapses into
  an unreadable smear with M/W/T/F/S/S overlapping; **"Choose another session" clips off
  both edges of its card** to "ose another ses"; the tab bar's five labels run together and
  **"Profile" is cut off entirely** — the fifth tab has no reachable label.
- **`workout-log` at AX5:** the title clips to "P", **"Finish" clips to "Fini"** at the right
  edge, the header row overlaps the metrics line, and the set grid's done column runs off
  screen.
- 12 clipped inline nodes on `exercise-library`, 8 on `train`.

§11 says "Test every screen at AX5. That is where hardcoded frames break." The frames still
break; the difference is that they now break by clipping rather than by ignoring the setting.
Mechanism: fixed. Survival: not yet.

## 5. The two visible bugs — **VERIFIED FIXED**

Coach's half-faded title is gone. At rest `coach.html` renders the small 17px centred title
at opacity 1 and the large title at 0 — it is fully collapsed, because the chat is scrolled
to the latest message, which is the correct resting state for that screen rather than the
half-state it was in. `chrome.js` now gates the minimize on a real `touchstart`/`wheel`, so
a programmatic scroll-to-latest no longer reads as a person scrolling.

The first-gap difference is gone. I read the gap under the header on every scroll body and
it is uniform.

## 6. Capsule buttons — **VERIFIED FIXED**

Every `.btn` in the build (38 across 13 screens) computes
`border-top-left-radius >= height/2`. Measured a representative set at 44px tall / 999px
radius. The search field on `exercise-library` is **48px tall at 999px** — capsule, was 48
at r8. Chips, header actions, the composer send button and the tab bar are all capsules.
This is the change with the biggest effect per line and it landed.

Residual: a family of 44px-tall controls is still `r8`/`r12` — `.cell` (28 on workout-log),
`.done` (14), `.partials__btn` (14), `.seg__item`, `.iconbtn`, `.qa`, `.exc__grip`. Fields
and keyboard keys at continuous-rounded are within §3.2. `.done` and `.qa` are buttons and
are not.

## 7. Replace the native `<select>` controls — **PARTLY**

Measured on all 15 remaining selects (14 workout-log, 1 shopping):
`appearance: none / -webkit-appearance: none`, `border-radius: 8px`, and a
`background-image: url("data:image/svg+xml,...")` chevron drawn at the build's own weight.
The browser chevron is gone; in the render the RIR column reads as three matched fields, not
as a form control. The argument that the platform's wheel picker beats anything a page can
build is right, and keeping `<select>` to get it is the correct call.

**The second half of item 7 was not done.** "Remove the dashed border on review's coach
note" — `components.css:1316` still carries `.card--unverified { border: 1px dashed var(--border) }`
and it renders on `review.html`. There is now a **second** dashed element:
`.btn--dashed { border: 1px dashed var(--accent-text) }` on workout-log's "Add Exercise" and
its rest-timer toggle. Dashed borders do not exist in iOS; the build added one rather than
removing one.

## 8. Raise the motion floor — **DELIBERATELY DECLINED. I do not accept the argument as given.**

The argument: the 150ms transitions are `background-color`, a control's colour answering a
finger, and the spec's 200–500ms band is for the spring.

**The premise does not survive measurement.** I read `transition-duration` paired with
`transition-property` on every visible element, all 13 screens:

| duration | property | count |
|---|---|---|
| 0.15s | opacity | **327** |
| 0.15s | background-color | 321 |
| 0.15s | transform | **98** |
| 0.15s | border-color | 83 |
| 0.15s | box-shadow | 11 |
| 0.3s | transform | 256 (`linear()` spring) |
| 0.3s | width | 3 |

So of 840 declarations at 150ms, **321 (38%) are background-color**. 327 are opacity and 98
are transform — those are motion by any reading, and they run on `--ease`
(`cubic-bezier(0.2,0,0.2,1)`, no overshoot), not on a spring. The shared rule at
`components.css:586` applies all four properties at `--dur-fast` in one declaration, which
is why the colour argument cannot be separated from the movement argument: they are the same
rule.

I accept the narrow point completely — **a colour change that eases over 200ms feels late,
and 150ms is right for it.** What I do not accept is the conclusion, because the fix that
follows from the correct premise is not "leave the floor" but "split the rule": keep
`background-color` and `border-color` at 150ms, move `opacity` and `transform` onto
`--spring-snappy` at 300ms, which already exists and is already correct. The 300ms spring
layer in this build is genuinely good — I verified the `linear()` samples overshoot to 1.006
(snappy) and 1.046 (bouncy) and that 256 transform transitions use them. The declined item
leaves 425 opacity/transform transitions outside it for a reason that only covers 38% of the
set.

## 9. Float the tab bar — **VERIFIED FIXED**

Measured on every screen: `left: 12, right: 12, bottom: 12, width: 369, height: 56,
border-radius: 999px`, `backdrop-filter: saturate(1.8) blur(20px)`, and a box-shadow of
`inset 0 1px 0 rgba(245,245,247,0.22)` (specular) + `inset 0 0 0 1px rgba(245,245,247,0.14)`
(hairline all the way round) + `0 8px 32px rgba(0,0,0,0.35)` (outer). Content scrolls under
it and is visible through the glass. The bottom search bar on `exercise-library` floats with
it. This is the iOS 26 tab bar and it is right.

Two notes. Height is 56px where §5.1 puts the iPhone tab bar at 49pt. And the minimize
behaviour **hides the bar entirely** (`data-minimized="true"`, width unchanged at 369) where
§8.2 says it "collapses to the active tab, re-expands on reverse scroll". Hiding is not
collapsing.

## 10. Sheets: inset, rounded, detents, spring from the trigger — **PARTLY**

Measured by opening three sheets (`workout-log` numeric pad, `settings` weight unit,
`train` session picker):

| property | measured | spec |
|---|---|---|
| insets | left 8, right 8, bottom 8 | inset — ✔ |
| radius | 22px on all four corners | ~22pt, no hardcoded bottom — ✔ |
| edge | `inset 0 0 0 1px --glass-edge` | hairline — ✔ |
| entry | `sheetUp 300ms --spring-snappy` | spring — ✔ |
| background | opaque `rgb(28,28,31)` | §8.6 says **glass** — ✘ |
| detents | `data-detents` **null** on all three | detent set — ✘ |
| grabber | **rendered, 36×4, on all three** | only when resizable — ✘ |
| scrim | `rgba(0,0,0,0.5)` unconditional | dim only when interrupting — ✘ |
| transform-origin | `188.5px 225px` (centre) | spring from the trigger — ✘ |

The inset/radius/hairline half is done and it looks right. But the claim "a grabber only
where a sheet actually moves" fails on all three sheets I opened: `.sheet__grab` carries
`background: var(--border)` unconditionally at the base rule, and only the `:active` cursor
is gated on `data-grabber="true"`. Three non-resizable sheets each promise, with a grabber,
that they move. And §8.7 — the sheet springing from its trigger — is still not implemented
anywhere: `@keyframes sheetUp { from { transform: translateY(100%) } }` rises from the bezel
with no geometric relationship to the control that opened it.

## 11. The clip-path corner fallback — **DELIBERATELY DECLINED. I accept the argument.**

The argument: a `clip-path` squircle removes the element's border and its entire box-shadow,
because a clip cuts everything outside the path. A card that loses its 1px boundary and its
elevation in Safari and Firefox is worse in those browsers than a circular corner is.

**This is correct and I would have made the same call.** It is a real property of `clip-path`,
not an excuse, and the build's elevation model leans hard on `inset 0 0 0 1px` hairlines and
outer shadows — clipping them away would break the light theme's entire raised/ground
distinction, which is the strongest piece of craft in the build. Treating `corner-shape` as
progressive enhancement, with 179 elements smoothed where it resolves and 113 capsules
deliberately opted out because a superellipse flattens a capsule, is the right shape of
answer. `tests/squircle-check.mjs` holding both halves is the right way to keep it honest.

I would have accepted an SVG-mask alternative had one been offered, but I am not going to
block a ship on a browser-specific enhancement whose only available fallback is worse than
the thing it replaces.

**One thing that was not declined and was not done:** the previous item also said "re-tune
the exponent toward the iOS value". `--corner-smooth` is still `superellipse(1.8)`.
§3.1 puts the app-icon exponent near 5 and Figma's iOS preset at 60% smoothing. 1.8 is a
gentle smoothing that is barely distinguishable from a plain arc at the radii in use. That
is a one-token change with no fallback implications and it is still open.

## 12. Remove the demo scaffolding — **PARTLY, and it is worse in one respect**

The state chip is out of the header's trailing action slot. That was the important half: it
was covering New on coach, Account on home, Edit on train and Finish on the workout log, and
those actions are now visible and reachable.

But it moved onto the **content**. `.dev__toggle` is `transform: translateX(-32px)`, fully
opaque, `background: var(--surface-raised)`, vertically centred on the left edge. In all 26
at-rest captures a ~40px opaque capsule reading "TATE" sits over the body copy at y≈425:

- `home` — clips the "LAST SESSION" section header to "ST SESSION"
- `shopping` — covers the tick box and half the label of "1 lb Ground beef"
- `settings` — clips "Distance" to "istance"
- `review` — clips "Barbell Bench Press" to "arbell Bench Press" and "75 kg" to "5 kg"
- `split-builder` — clips "Rope Pushdown"
- and the same on the remaining eight

The comment in `components.css` says it is "mostly off the edge at rest" and that
scaffolding "is allowed to be discreet and is not allowed to be unreadable". It is neither
discreet nor off the edge — it is the most consistently visible defect in the screenshot
set. The assembled demo adds a "SCREENS" pill above the tab bar. Either fully off-canvas
until an edge swipe, or transparent to hit-testing and at 15% opacity, or gone from the
ship build.

## 13. Icon cleanup — **PARTLY. Two of the three claims are measurably false.**

Claim: "The workout log's two optical sizes are one; the tick's stroke ratio matches the
family; the W/T letters are gone."

I read every visible `<svg>` on all 13 screens:

- **`workout-log` still mixes two optical sizes.** 20 icons at 24×24 (`.qa`, `.exc__grip`,
  `.done`, `.done--ready`) and 17 at 20×20. That is the same count the previous review
  reported. Not fixed.
- **`shopping`'s tick glyphs are still 14×14 at `stroke-width: 3px`.** Ratio 0.214 against
  0.0875 for the other 178 icons — 2.4× heavier, unchanged. Not fixed.
- **The "W"/"T" letters are gone.** Verified — no match in `shopping.html`. Fixed.
- New: `exercise-library` adds an 18×18 in `.chip--icon`, a third optical size in the build.

Weight is still a constant 1.75px whether the adjacent label is 11px or 34px, so §2.1's
weight-matching is still not implemented. The underlying family remains excellent: 178 of
185 icons on one 24-unit grid at 20×20 / 1.75 / round caps.

### The food emoji — **DELIBERATELY DECLINED. I accept the argument, with one correction.**

The argument: the emoji are not interface, they are the food, in the two screens that are
about food, and a monochrome line drawing of a chicken breast is a worse chicken breast.

**I accept this.** It is the right distinction — content imagery and interface iconography
are different systems and holding them to one stroke weight is a category error. Apple does
exactly this: Health's activity rings are line icons, Food logging apps on iOS ship colour
food imagery, and SF Symbols has no vocabulary for "salmon fillet versus chicken breast". The
scanning argument is also the correct one: this is a list read while walking a shop.

**The correction:** the set is not internally consistent, and that is a smaller and fixable
problem than the one that was declined. In both themes the three logged meals render
full-colour system emoji (🍳 🥗 🥤) while the "Dinner" empty-state row renders 🍽 as a flat
grey monochrome glyph at the same size in the same well. Three colour objects and one grey
one in a four-row list reads as a rendering failure, not as a designed distinction. Either
give the empty row a line icon from the family (it is interface — it is an instruction, not
a food) or pick a colour emoji for it.

---

# PART B — RE-SCORE

Same rubric, same method, so the two totals are comparable.

## The 12 hard items (§12)

| # | Item | Was | Now | What moved |
|---|---|---|---|---|
| 1 | Type scale, tracking, optical split | 1 | **2** | Off-scale 6.72px labels gone with the body map; `"SF Pro Text"` out of the stack so the 20pt optical split is no longer pinned; tracking now `em` so it scales with size. All 8 rendered sizes on Apple's table. |
| 2 | Continuous + concentric corners | 1 | **1** | No clip-path fallback (accepted as declined), exponent still `superellipse(1.8)` not the iOS ~0.6/e≈5, and nesting still is not concentric — `.seg` is r12 with 2px padding, so concentric is r10; the item is r8. |
| 3 | 4/8 spacing grid, 16pt margin | 1 | **1** | Unchanged. 202 declarations at 2px (10.6%), now documented as three deliberate optical half-steps. Margin 16px everywhere. |
| 4 | One accent tint per surface | **0** | **1** | One orange fill per screen at rest, verified independently. Docked for progress's orange SVG chart (invisible to the audit), six accent instances inside the numeric-pad sheet (states unaudited), and three hues on workout-log. |
| 5 | Springs, 200–500ms, velocity | 1 | **1** | Spring layer excellent and now carries 256 transform transitions at 300ms. But 425 opacity/transform transitions still run 150ms on a non-spring ease. |
| 6 | Haptics | 1 | **1** | Unchanged. No Vibration API; §10's prescribed compensation (tight press states, no tap highlight) present. |
| 7 | Glass in chrome only | **2** | **2** | Still exactly `.tabbar` and `.findbar--bottom`. Zero content glass. Now with a hairline ring all the way round. |
| 8 | Large-title collapse, bottom search | 1 | **1** | Now a continuous offset-driven morph (scale 1→0.72, bar 74→44) with the coach at-rest bug gone, and a capsule search field at the bottom. Docked: bar is 74px where §5.1 says ~96, so the large-title band is 30px of travel where Apple's is 52; the morph ends at 24.5px and a second 17px element crossfades in. |
| 9 | Sheet detents, grabber, dimming | 1 | **1** | Inset 8px, r22 four corners, hairline, spring entry — all correct. Docked: grabber renders on three sheets that have no detents, dimming still unconditional, background opaque where §8.6 says glass. |
| 10 | SF Symbols, weight-matched | 1 | **1** | "W"/"T" gone. But workout-log still mixes 24×24 and 20×20 (20/17), shopping's ticks are still 3px stroke at 14×14, a new 18×18 appeared, and stroke is still fixed at 1.75 regardless of adjacent text. |
| 11 | AX5 / RM / RT / dark | 1 | **1** | Dark and light now **0 contrast failures across 1,564 nodes** (was 9). RM and RT blocks hold. AX5 now scales type on 13/13 (was 0/14) — but home's tab bar loses its fifth label, "Choose another session" clips off both card edges, and workout-log's Finish clips to "Fini". It scales; it does not survive. |
| | **Total (items 1–11)** | **11 / 22** | **13 / 22** | |

## Subjective items

**§12.12 — primary element identifiable in two seconds — was 1, now 2/2.**
Home, train, onboarding, split-builder, profile, settings, review and shopping each hand you
one capsule and nothing competes. Workout-log now passes: three green squares are loud, but
they are a different hue and read as "done", and the one orange object on the screen is
Finish, top-trailing, where the thumb expects it. The holdout is **fuel**, and it is the
declined item — two identical orange halves separated by a hairline, and I still cannot tell
you in two seconds whether the screen wants me to speak or to photograph. Progress has no
primary action at all, which is legitimate for a chart screen. Twelve of thirteen.

**On fuel's split button specifically — DELIBERATELY DECLINED, and I do not accept it.**
The argument is that voice and camera are the same job done two ways, neither is the
fallback, a single button with a mode is a mode to get wrong, and the count is one fill
holding one job. The reasoning about modes is good and I agree with the product decision:
do not hide one behind the other. But the conclusion does not follow, because the problem
was never the count — the previous review said "two co-equal primaries cancelling each
other", and one capsule split down the middle by a hairline is still two co-equal targets.
Apple's own precedent is against it: iOS has no split filled primary. Messages puts camera
and audio as two **plain glyph buttons** flanking one field; Notes puts camera, scan and
draw as equal-weight glyphs in a toolbar. Both keep the "neither is the fallback" property
without either half claiming primary emphasis. The fix that respects the argument is to
demote **both** halves to a secondary/tinted capsule pair and let the screen's real primary
be nothing at all — a Fuel screen whose job is reporting does not need a filled button. In
light theme this is more visible, not less: the fill resolves to `#C2410C`, a deep rust that
reads as destructive rather than inviting, across 361×46px at the top of the screen.

**§6.3 / §12 — iOS 27 material treatment — was 1, now 2/2.**
The thing the previous review docked is fixed. The tab bar now carries a hairline
(`inset 0 0 0 1px`) all the way round on top of the top-edge specular, floats inset from all
three edges as a capsule, and has an outer `0 8px 32px` shadow. In the renders it reads as a
floating pane of glass with a defined boundary, which it did not before. There is still no
darkened outer edge stroke and no displacement/refraction layer, but §6.3 says those values
are unpublished and §6.4 explicitly permits shipping the blur-only case as the fallback.
The build made the considered attempt the item asks for.

**§8.7 — menus and sheets spring from the triggering control — was 0, now 0/2.**
Measured: `transform-origin` on every opened sheet resolves to the element centre
(`188.5px 225px`, `188.5px 120px`, `188.5px 203px`), and every sheet animates
`translateY(100%)` from the bezel. No geometric relationship to the trigger anywhere in the
build. The rule is stated plainly in the spec and is still not implemented.

**§8.8 — empty, loading and error states as instructions — was 2, now 2/2.**
Unchanged and still right. The `.empty` `ContentUnavailableView` anatomy, the `.skeleton`
loading state, and fuel's "Dinner — usually 7:30, about 40 g protein, closes today" row as
an instruction rather than a blank.

**Subjective total: was 4 / 8 → now 6 / 8.**

## Totals

| | Review 1 | Review 2 |
|---|---|---|
| Hard items (§12.1–11) | 11 / 22 | **13 / 22** |
| Subjective (§12.12, §6.3, §8.7, §8.8) | 4 / 8 | **6 / 8** |
| **Total** | **15 / 30** | **19 / 30** |

Four points, and the two that moved on the hard side are the two the previous review called
non-negotiable — accent went 0→1 and type went 1→2, with the Dynamic Type mechanism
underneath item 11 rebuilt from nothing. That is the right work, done in the right order.

---

# PART C — FRESH EYES

Ignoring everything above. Twenty-six at-rest renders, thirteen AX5 renders.

## The single worst-looking screen

**`fuel.html`**, in light theme.

The old worst screen is gone, and nothing in the ship set is ugly the way the body map was.
So this is a narrower complaint, but it is the one screen where I can point at the
composition and say it is wrong rather than unfinished.

The top 400px is: a 34px title, a 56px number, a caption, then a **361×46 solid rust-red bar
split down the middle by a black hairline**, then a caption apologising for it ("Say what
you ate, or snap the plate"), then three grey meters. In dark the fill is orange and merely
loud; in light it resolves to `#C2410C` and reads as an alert banner. The hairline through
the middle is the tell — a filled capsule with a seam in it is a shape iOS does not have,
and your eye keeps trying to resolve whether it is one object or two. Below it the meal list
puts three full-colour system emoji and one flat grey emoji in four identical wells, next to
a green badge, an amber badge and an orange text link. It is the only screen in the build
where I cannot name the visual hierarchy.

Runner-up: **`progress`**, for the opposite reason — it is calm and well-typed, and then
draws a thick saturated orange line with seven orange dots as the only coloured object,
which makes the chart look like the thing to tap.

## Does anything still read as a web page rather than an iOS app?

Much less than before. The capsule buttons, the floating glass tab bar and the inset r22
sheets did most of the work — flipping through the renders, the first impression is now iOS.
Four things still break it:

1. **The "TATE" chip sitting on top of the body text of every screen.** Nothing shipped by
   Apple has an opaque grey capsule half-off the left edge occluding a list row. In the
   screenshots it is the first thing I see, before the content, on all thirteen.
2. **Dashed borders**, now in two places: review's `.card--unverified` coach note and
   workout-log's `.btn--dashed` "Add Exercise" and rest-timer toggle. iOS has no dashed
   stroke. On workout-log it is also drawn in the accent, so it reads as a disabled web
   upload dropzone.
3. **`workout-log`'s header collides with itself.** "1,488 kg" runs underneath the lightning
   button at default type — visible in the render, not just at AX5. Six elements at four
   weights on one 62px line.
4. **The lists are full-bleed `.grouped`, not `.insetGrouped`.** `shopping` and
   `exercise-library` run rows edge to edge with section headers on the ground. This is a
   legitimate iOS list style, but every other surface in the build is an inset rounded card,
   so the two idioms sit next to each other on the same screen (`settings` gets inset cards;
   `shopping` does not).

## Does anything look broken, unfinished, or placeholder?

- **The AX5 renders are broken, not degraded.** Home loses the "Profile" tab label entirely
  and "Choose another session" is clipped at both ends; workout-log's "Finish" reads "Fini".
  A user at AX5 cannot reach the fifth tab by name or read the primary action.
- **`exercise-library` autofocuses its search field on load**, so the screen renders at rest
  with a 4px orange focus ring around the search capsule and — on device — the keyboard up.
  Opening a tab should not raise the keyboard. In the screenshot it reads as a stuck focus
  state.
- **Three sheets show a grabber and do not move.** A grabber is a promise.
- **The tab bar's minimize hides the bar** instead of collapsing it to the active tab. On
  train after scrolling there is simply no tab bar, which reads as a rendering failure
  rather than a behaviour.
- **The numeric-pad sheet** is the least-finished surface in the build: four orange outlined
  steppers, a red DEL, an orange Done, and a 12-key grid of r8 rectangles. It looks like a
  calculator someone dropped into an iOS app.
- **Home and onboarding still have large dead zones.** Home's content ends around y≈1200 of
  a 1704px fold. Onboarding puts a headline at 27% and buttons at 74% with 500px of black
  between. Neither is broken; neither is composed.

## What I would change next, in priority order

1. **Make the screens survive AX5, not just scale at AX5.** Give the tab bar a
   vertical/icon-only layout above xxxLarge, let `.btn` labels wrap instead of clip, and
   collapse the home week track to a summary line. Then fix `tests/dynamic-type.mjs` — assert
   per-element `scrollWidth > clientWidth` on text nodes, because `overflow-x: hidden` makes
   the current document-level check unfalsifiable.
2. **Get the dev scaffolding off the content.** Fully off-canvas until an edge gesture, or
   out of the ship build. It is one `transform` value and it is the most visible defect in
   every screenshot.
3. **Teach the accent audit to see SVG and states.** Drop the `namespaceURI` early return so
   progress's chart is counted; run the audit over each screen's declared states so the
   numeric-pad sheet's six accent instances are counted. Then demote the progress chart to
   `--text-secondary` with the accent reserved for the latest point, and take the pad's four
   steppers to `--fill`.
4. **Split the transition rule at `components.css:586`.** Keep `background-color` and
   `border-color` at 150ms — that argument is right — and move `opacity` and `transform` onto
   `--spring-snappy` at 300ms. 425 declarations, one rule, and the spring already exists.
5. **Rebuild fuel's split control** as two equal-weight secondary capsules or two toolbar
   glyphs. Keep the "neither is the fallback" property; lose the two-primaries composition.
6. **Fix the three things that were claimed and are not true**: workout-log's 20 icons at
   24×24 → 20×20; shopping's `.tick__box` from 3px stroke at 14×14 to 1.75 at 20×20;
   `.sheet__grab` gated on `data-grabber="true"` at the base rule, not just on `:active`.
7. **Remove both dashed borders.** Replace review's with a `--fill` ground and its existing
   label; replace workout-log's with `.btn--secondary`.
8. **Fix workout-log's header collision** — move the metrics line below the title row, or
   drop "1,488 kg" to the exercise cards.
9. **Raise the large-title bar from 74px toward 96**, and stop autofocusing
   exercise-library's search.
10. **Re-tune `--corner-smooth`** from `superellipse(1.8)` toward the iOS value. One token,
    no fallback implications, and the corners are currently smoothed by an amount that is
    hard to see.
11. **Give sheets a `transform-origin` relationship to their trigger** (§8.7) and make the
    scrim conditional on whether the sheet interrupts.
12. **Inset-group the full-bleed lists** on shopping and exercise-library so the build has
    one list idiom.

---

# VERDICT

## DO NOT SHIP

This is a different build from the one I reviewed a week ago and I want that on the record
before the blockers. Nine of the thirteen items are genuinely fixed or genuinely improved.
Accent discipline went from the worst thing in the build to a real rule with a test behind
it. Buttons and the search field are capsules, the tab bar is a floating glass capsule with
a proper hairline, sheets are inset with concentric corners, the coach title bug is gone,
the body map is out, and contrast is now clean across 1,564 nodes in both themes. The
Dynamic Type rebuild — every token to `rem`, tracking to `em`, the `html { font-size }` trap
found and removed — is the hardest single piece of work on the list and it was done properly.
15/30 to 19/30 understates it, because two of the four points came on the items the last
review called non-negotiable.

It does not ship for two reasons, one substantive and one embarrassing.

**Blocker 1 — the build does not survive AX5, and the test that says it does cannot fail.**
Type now scales on 13 of 13 screens, which is the mechanism, and the mechanism is right. But
at AX5 `home` loses the "Profile" tab label entirely, its primary secondary action clips off
both edges of its card, and its week track becomes an unreadable overlap; `workout-log`
clips its title to "P" and its primary action to "Fini". `tests/dynamic-type.mjs` asserts
`documentElement.scrollWidth > clientWidth` under `overflow-x: hidden`, which is a condition
that cannot occur, so the suite reports green on 13 screens that are visibly broken. §11
opens by saying accessibility is not optional polish and that AX5 is where hardcoded frames
break. The frames break. A user at the largest accessibility size cannot read the app's
primary button or name its fifth tab.

**Blocker 2 — an opaque grey debug chip is sitting on top of the body copy of all thirteen
screens.** It clips "LAST SESSION" to "ST SESSION" on home, hides a checkbox and half a
label on shopping, and cuts the first character off list rows on five more. It is in every
one of the twenty-six renders. The fix is one `transform` value. Nothing ships looking like
this.

**Two more that I would not block on alone but that must not survive a third review:** the
grabber that renders on three sheets with no detents (a control that promises motion and
does not move is a lie to the user), and the three item-13 claims that measure false —
workout-log's two optical sizes, shopping's 3px tick stroke. Claims in a compliance document
that do not survive re-measurement cost more than the defects they describe.

Fix items 1 and 2 in the priority list and this ships. Everything else on that list is the
difference between a good iOS recreation and a convincing one, and none of it is structural
any more.
