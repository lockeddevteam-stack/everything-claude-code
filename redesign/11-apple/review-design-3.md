# Ship Review 3 — LOCKED redesign against the Apple Design Spec

Reviewer: design manager, third and final ship review
Spec of record: `redesign/11-apple/apple-design-spec.md`
Prior reviews: `review-design.md` (15/30), `review-design-2.md` (19/30)
Claims under test: `redesign/11-apple/spec-compliance-2.md`
Target: `redesign/08-build/` — 13 screens + `tokens.css`, `components.css`, `app.js`, `chrome.js`, `bodymap.js`
Assembled demo: `redesign/10-final/locked-demo.html`
Date: 2026-09-10

`mockup-bodymap.html` is out of the ship set by agreement and is not scored.

## How this was measured

Playwright 1.56.1 / Chromium at `/opt/pw-browsers`, 393×852, DPR 2, both themes.
Scripts committed as `tests/agent-design3-lib.mjs`, `-shots.mjs`, `-measure.mjs`,
`-motion.mjs`, `-ax5.mjs`, `-ax5b.mjs`, `-states.mjs`, `-sheet.mjs`, `-chrome.mjs`,
`-hdr.mjs`, `-hdr2.mjs`, `-corners.mjs`, `-misc.mjs`, `-week.mjs`, `-tablabels.mjs`,
`-demo.mjs`.

This time I walked each screen's own dev state switcher rather than reviewing the
resting screen. That is **288 surface/state combinations** (13 screens × their declared
states × 2 themes), 158 captures at default type, a full AX5 pass at
`document.documentElement.style.fontSize = '53px'` over every state, six sheets opened
through their real triggers, and reduced-motion / forced-colors / increased-contrast
contexts. Every figure below is from those runs. Where I disagree with a claim in
`spec-compliance-2.md` I say so and give the number I got.

---

# PART A — VERIFYING THE TWELVE, AND THE TWO BLOCKERS

## Blocker 1 — the build does not survive AX5, and the test cannot fail
### PARTLY. **The blocker is not cleared.**

The mechanism half is genuinely done and I want to be precise about how much moved.
The old assertion (`documentElement.scrollWidth > clientWidth` under `overflow-x: hidden`)
was unfalsifiable and is gone. I wrote my own per-element detector — text-bearing nodes
where `scrollWidth > clientWidth`, or where the box escapes the 393px viewport with no
horizontally-scrollable ancestor — and ran it over all 13 screens **and all 133 declared
states**. Most of the 89 clipped nodes are really gone:

- **`.btn` labels now wrap.** "Start Push" renders on two lines inside a grown capsule
  at AX5. "Choose another session" is fully legible. Where review 2 measured "ose
  another ses", I measure a wrapped, complete label.
- **The tab bar drops to an icon row.** Measured at root 53px: all five
  `.tabbar__item` are 74×56 at right edges 86/160/233/307/381 — every one on screen and
  above the 44pt minimum — with `.tabbar__label` at `clip-path: inset(50%)`, so
  "Profile, tab" survives as an accessible name. Review 2's "the fifth tab has no
  reachable label" is fixed, correctly, the way `.vis-hidden` does it.
- **Rows wrap instead of crushing.** `.row__main` takes the row when the title needs it.
- **The set grid scrolls sideways.** RIR and PARTIALS sit past x=393 but inside a real
  `overflow-x` scroller, so they are reachable. I counted those separately and did not
  score them as clips; the reasoning ("a set table is the one thing that cannot reflow")
  is right.

**What still breaks.** Five screens fail my detector with nothing to scroll them into view:

| screen | what | measured at root 53px |
|---|---|---|
| **workout-log** | **"Finish", the primary action, runs off the right edge in all 9 states** | box `left 322 → right 490` in a 393px viewport: **97px of a 168px button off screen (58%)**. In `first-set` and `empty` it is `left 429 → right 597` — **entirely off screen** |
| workout-log | the metrics line | `left 16 → right 490`, 97px overflow, "1,488 kg" cut to "1,48" |
| workout-log | "Add Exercise" | `left −21` |
| **home** | the week track | each `.week__day` collapses from **27.8px wide to 4.7px**, holding a label whose `scrollWidth` is 15–23px. Seven day marks in 4.7px columns is the unreadable smear review 2 named, unchanged |
| **shopping** | the segmented control | "Budget" sits at `left 382 → right 535` — the fourth segment is off screen and unreachable |
| review | "Save session" | `left 52 → right 404`, 11px overhang |
| split-builder | 4 of 11 presets | "Try saving again" `→ 498`, "Building" `→ 524`, "Use this split" `→ 408` |
| train / progress | SVG chart tick labels | `scrollWidth 47` in `clientWidth 24–34` |

So the shape of the failure changed. It used to be thirteen screens; it is now
concentrated, and one instance of it matters much more than the rest: **at the largest
accessibility size a user cannot reach the Finish button on the workout logger**, which is
the screen the app exists for, in every state that screen declares.

**On the claim "`node tests/dynamic-type.mjs` — 13/13 screens, all checks passed": I do
not get that result.** My detector finds hard clips on 5 of 13 screens at rest and on 26
of 133 states. The new assertion is far better than the old one, but it is still passing
screens that are visibly broken — the `ax5-workout-log.png` capture shows "Fin" cut by
the bezel. I did not diff the two detectors to find where they part; the render is
enough.

## Blocker 2 — an opaque debug chip on the body copy of all thirteen screens
### VERIFIED FIXED

`.dev__toggle` measures `left −54, right 8, transform matrix(1,0,0,1,-53.6,0)` on all
twelve screens that carry it — an 8px sliver of the capsule's trailing edge, no label.
Onboarding's `.dev-open` is the mirror image at `left 385`. In all 26 at-rest captures
the chip occludes nothing: "LAST SESSION" reads in full on home, the tick box and
"1 lb Ground beef" read in full on shopping, "Barbell Bench Press" and "75 kg" read in
full on review. The demo's "Screens" pill got the same treatment (`demo-btn` at
`left −73` at 393px wide, and at `left 228` beside the phone above 900px).

This was the embarrassing one and it is gone.

---

## The twelve priority items

### 1. Survive AX5, and fix the test — **PARTLY** (see Blocker 1)

### 2. Dev scaffolding off the content — **VERIFIED FIXED** (see Blocker 2)

### 3. Teach the accent audit to see SVG and states — **VERIFIED FIXED**

I rebuilt the audit myself rather than trusting theirs: no `namespaceURI` early return,
SVG `fill` and `stroke` counted, 300px² floor, scoped to the topmost surface (a sheet is
measured as its own surface), walked over all 288 surface/state combinations in both
themes.

**Result: at most one saturated accent fill on every one of the 288 combinations.**

The two specific violations review 2 found through the hole in the old audit are both
fixed at the source:

- **Progress's 1RM chart.** The polyline and six of the seven points are now
  `--text-secondary` / `--text` ink. One `circle.chart__dot--last` is
  `fill: rgb(249,115,22)` at 81px² — the latest reading, which is the figure the screen
  reports. In the light render the chart is a calm grey line with a single rust point at
  the top right. This is the correct answer.
- **The numeric pad sheet.** Scoped to the sheet, `workout-log [dev-keypad]` measures
  exactly one fill: `.btn--primary` (Done) at 10,312px². The four accent-outlined
  steppers are neutral. DEL survives as red ink only.
- I also found and confirmed the third one they name: coach's setup no longer marks
  chosen options with six filled accent discs.

Residual worth recording, none of it a failure of the stated rule:
- `workout-log` at rest carries orange Finish + three green `.done` circles, and in
  `rest`/`exercise-done` an amber `.rest` banner at 23,580px². One accent fill, three
  hues on one surface.
- `split-builder` still paints 12 red `.swipe` panes at 23,104px² each, occluded under
  their rows.
- `exercise-library [dev-preset-9]` draws the exercise demo figure entirely in accent
  stroke on accent-quiet fill — seven shapes, largest 12,274px² — inside a sheet that
  also carries the accent primary button. Defensible as an instructional highlight;
  it is the loudest thing in that sheet and it is not the action.

### 4. Split the transition rule at `components.css:586` — **VERIFIED FIXED**

`components.css:604–607` now reads exactly as argued: `background-color` and
`border-color` at `--dur-fast`/`--ease`, `transform` at `--dur-slow`/`--spring-snappy`,
`opacity` at `--dur-slow`/`--spring-smooth`. Measured across all 13 screens with a
paren-aware parser (the naive comma split in review 2 mangled `linear()`):

| duration | property | timing | count |
|---|---|---|---|
| 0.3s | transform | spring | **309** |
| 0.3s | opacity | spring | **281** |
| 0.15s | background-color | ease | 275 |
| 0.15s | border-color | ease | 82 |
| 0.3s | flex-basis / padding / left / width | spring | 102 |
| 0.15s | opacity | ease | **45** |
| 0.15s | box-shadow | ease | 11 |

**Opacity/transform on a non-spring 150ms ease: 425 → 45.** The 45 are
`.tabbar[data-minimize] .tabbar__item { opacity }` — the label crossfade during the
collapse, 5 items × 9 screens with a tab bar. A label crossfade is a content transition,
not motion, and 150ms is right for it. Item closed.

### 5. Rebuild fuel's split control — **VERIFIED FIXED**

Two separate capsules with a gap: "Say it" and "Snap it", both `--fill` grounds, and
**fuel now carries zero accent fills in any of its seven states in either theme**. The
seam through a filled capsule is gone, the deep-rust `#C2410C` bar across the top of the
light theme is gone, and the product decision the build defended — neither is the other's
fallback, neither is hidden — is intact. This is the fix I asked for and it is better than
what I asked for, because dropping the fill entirely is the right call for a reporting
screen.

### 6. The three claims that measured false — **VERIFIED FIXED**

All three re-measured:

- **Optical sizes.** `workout-log` renders **37 SVGs, all 20×20 at `stroke-width: 1.75px`.**
  Review 2 measured 20 at 24×24 and 17 at 20×20. Every screen in the build is now one
  size: coach 12, exercise-library 19, fuel 11, home 9 (+ one 64×24 sparkline), profile 7,
  progress 10 (+ one 329×184 chart), settings 13, shopping 20, split-builder 5, train 33
  (+ one 329×128 chart). The 18×18 `.chip--icon` is gone.
- **Shopping's tick.** 16×16 at 1.75px. Ratio 0.109 against the family's 0.0875 — was
  0.214 at 14×14/3px. Still a hair heavy at the smaller box, but it now reads as the same
  pen.
- **`.sheet__grab`.** Gated at the base rule. On the four non-resizable sheets I opened
  (`padsheet`, `.qa`, settings account, train session) the grabber computes
  `display: none`, `0×0`, transparent. On the two that carry detents it paints
  `36×16`, `rgb(106,106,116)`. A grabber now appears only where the sheet moves.

Not fixed, and correctly not claimed: stroke weight is a constant 1.75px whether the
adjacent label is 11px or 34px, so §2.1's weight-matching is still unimplemented.

### 7. Remove both dashed borders — **VERIFIED FIXED**

Zero dashed border sides across all 13 screens, all states, both themes.
`.card--unverified` is a `--fill` ground with a hairline and keeps its labelled head;
`.btn--dashed` is a secondary capsule.

### 8. workout-log's header collision — **VERIFIED FIXED**

At default type "21:01 · 3 sets · 1,488 kg" sits on its own line at y≈134, below a title
row carrying "PPL - Push", the bolt, Discard and Finish. Nothing overlaps. The diagnosis
in the compliance doc (the metrics line was a child of the title column, so `flex: 1 0 100%`
had no flex container to talk to) matches what I see in the render.

### 9. Large-title bar toward 96px, and stop autofocusing the library — **PARTLY**

The autofocus half is done: I checked `document.activeElement` after a 900ms settle on
all 13 screens and **every one is `BODY`**, with no `[autofocus]` in the markup. The
library renders at rest with no focus ring and no keyboard.

The morph is materially better and now matches §8.1 exactly. Measured on train, progress,
fuel and exercise-library through a real wheel event:

| scrollTop | `.hdr--large` height | large title | small title |
|---|---|---|---|
| 0 | 96px | 34px / 700 / opacity 1 / scale 1 | 17px / 600 / opacity 0 |
| 20 | 96px | opacity 0.385 / scale 0.892 | opacity 0 |
| 60 | 96px | opacity 0 / scale 0.72 | opacity 1, centred |

34pt bold left-aligned morphing to 17pt semibold centred is Apple's figure, and the
weights are right.

**But the claim "the band is 52px of travel against the 44px collapsed bar" is false as
measured, and I want the reason on record.** `chrome.js` does write `height: 44px` as an
inline style — I read it back: `{"inline":"height: 44px","height":"96px",
"minHeight":"96px","rect":96,"collapsed":"true"}`. `min-height: 96px` at
`components.css:1925` beats it. **The bar measures 96px at rest and 96px collapsed:
0px of travel, not 52.** In `scrolled-train.png` the collapsed 17px "Train" floats in a
96px band with ~52px of dead air under it, which is the visual tell. One line —
`min-height: var(--nav-h-compact)` under `[data-collapsed="true"]`, or drop `min-height`
for `height` — and this item closes.

### 10. Re-tune `--corner-smooth` — **VERIFIED FIXED**

`--corner-smooth: squircle`. Computed `corner-shape` resolves to `squircle` on **168
elements** across the build, **0 of them capsules** (a superellipse flattens a capsule and
they are correctly opted out). The measurement in the compliance doc is right —
Chromium's `superellipse()` argument is log₂ of the exponent, so the keyword is
|x|⁴+|y|⁴=1 where `superellipse(1.8)` was e≈3.5. §3.1 puts the app-icon exponent nearer
5, but the keyword is the platform value for components and naming it beats approximating
it. Accepted as done.

I also re-ran nesting: **zero pinched pairs.** The only elements sharing a radius with
their parent are `meter__fill` inside `meter` and `hdr__initial` inside `hdr__account`,
both 999px circles inside circles, which is not what §3.4 warns about. `.seg__item` is
r10 inside `.seg` r12 with 2px of padding — concentric, where review 2 measured r8.

### 11. Sheets spring from their trigger, and conditional dimming — **PARTLY**

The transform-origin work is real. Measured on six sheets opened through their actual
triggers:

| screen | trigger | sheet `transform-origin` |
|---|---|---|
| workout-log | `.cell` at x≈97 | `97.25px 0px` |
| workout-log | `.qa` at x≈185 | `184.81px 0px` |
| fuel | "Say it" | `96.25px 0px` |
| shopping | "Shop at" | `103.25px 0px` |
| settings | a full-width row | `188.5px 0px` |
| train | a full-width row | `188.5px 0px` |

The x tracks the control; the two at 188.5 are full-width rows whose own centre is
188.5, so those are correct too. The y is clamped to 0 — the top of a bottom-anchored
overlay — so the motion has a horizontal relationship to the tap and no vertical one.
That is a defensible clamp for a sheet that must rise from the bottom, and it is a real
implementation where review 2 found none. Partial fidelity, real work.

Dimming was declined. **I accept it — see below.**

### 12. Inset-group the full-bleed lists — **VERIFIED FIXED**

Every `.row` / `.item` on every screen measures **361px wide** — 16px margins both sides,
zero full-bleed rows anywhere in the build. Shopping's item rows now sit in inset rounded
groups under section headers, matching settings and train. One list idiom.

---

## The refusals

The compliance document argues for not following the spec in three named places. I
accepted four refusals in review 1 and rejected two; the standard I used then was *accept
when the argument names a real property of the medium that the spec did not anticipate,
reject when it generalises past the case that justifies it.* Same standard here.

### Opaque sheet backgrounds, against §8.6's glass — **I do not accept the argument as given.**

The argument: glass shows what is behind it; a sheet has a dimming scrim behind it, so
there is nothing to see; a 20px blur under dense numeric content buys a view of a flat
grey rectangle.

That is exactly right **for the numeric pad**, and wrong as a rule for the set. Three
things it misses. The scrim is `rgba(0,0,0,0.5)`, not opaque — I measured it — so there
is content behind every sheet in this build, at half strength. §8.6 is specific that
**partial-height** sheets are inset with a glass background, and this build now has real
partial-height sheets: fuel at detents `0.45 0.88` and shopping at `0.42 0.8`, both
383/358px tall over 852px of live screen. And the build already owns the exact recipe —
`.tabbar` runs `saturate(1.8) blur(20px)` over an 0.82-alpha ground and it is the best
piece of material craft in the build.

**The correct fix:** scope the glass to `.sheet[data-detents]` — the two sheets that are
partial-height and sit over content the user is meant to keep seeing — and leave the
full-bleed pad, the account sheet and the session picker opaque. That is one selector and
it gives §8.6 what it asks for in the only cases where §8.6's reasoning applies. The
refusal as written declines glass for all 36 sheets to protect the one case where it
would genuinely hurt.

Not a ship blocker. A named defect.

### Unconditional dimming, against §8.6's "dim only when interrupting" — **I accept the argument.**

The count is the argument, and I verified it: every sheet I opened carries
`aria-modal="true"`, and the compliance doc counts 36. §8.6's condition — *dim when the
sheet interrupts the main flow, skip it when the task runs in parallel* — is met by every
member of the set, so a branch on it would be dead code that only exists to satisfy a
reader of the source. This is the same shape as the `clip-path` refusal I accepted in
review 2: a real property of what was actually built, not an excuse. If a non-modal sheet
is ever added the branch goes in then, and the commitment to do so is in the document.

### Tab bar height 56 against §5.1's 49pt — **I accept the argument.**

§5.1's 49pt describes a bar welded to the bottom edge with the 34pt home indicator below
it: 83pt of bottom chrome. This bar is the iOS 26 shape §8.2 describes instead — measured
at `left 12, right 12, bottom 12, 369×56, r999`, floating clear on three sides with its
own hairline all the way round — and Apple publishes no height for that shape. Total
bottom chrome here is **68px against Apple's 83**. The floating bar is *less* chrome than
the welded one, not more, and at 49px the label would sit 2px off the capsule's edge.
The argument names a real property of the shape being drawn. Accepted.

### Carried over from earlier reviews

- **The `clip-path` corner fallback** — accepted in review 2, and the position is
  strengthened now that `corner-shape: squircle` smooths 168 elements where it resolves.
- **The food emoji** — accepted in review 2. The correction I asked for was taken: the
  Dinner empty-state row now carries a line icon from the interface family, not a flat
  grey 🍽 next to three colour emoji. Only three `.fuel-thumb` emoji render, all colour.
- **The native `<select>` controls** — accepted in review 2. 14 remain on workout-log,
  1 on shopping, all `appearance: none` with the build's own chevron.

---

# PART B — RE-SCORE

Same rubric and method as reviews 1 and 2.

## The 12 hard items (§12.1–11), out of 22

| # | Item | R1 | R2 | **R3** | What moved |
|---|---|---|---|---|---|
| 1 | Type scale, tracking, optical split | 1 | 2 | **2** | Rendered ladder {11,12,13,15,17,22,28,34} on Apple's table; tokens `rem`, tracking `em`; ladder scales cleanly to AX5. Unchanged and correct. |
| 2 | Continuous + concentric corners | 1 | 1 | **2** | `--corner-smooth: squircle` (the platform value, was `superellipse(1.8)`), 168 elements smoothed, 0 capsules smoothed; `.seg__item` r10 inside `.seg` r12 with 2px padding — concentric, was r8; **zero pinched nestings** in the build. No Safari/Firefox fallback (declined, accepted twice). |
| 3 | 4/8 spacing grid, 16pt margin | 1 | 1 | **1** | Unchanged. 2,004 declarations, 214 at 2px (10.7%), documented optical half-steps. Margin 16px everywhere. |
| 4 | One accent tint per surface | 0 | 1 | **2** | **≤1 accent fill on all 288 surface/state combinations**, verified by my own audit that sees SVG and walks states. Progress's chart is ink with one accent last point; the pad sheet is down to one accent Done. Both docks from review 2 fixed at the source. |
| 5 | Springs, 200–500ms, velocity | 1 | 1 | **2** | 590 opacity/transform declarations on `linear()` springs at 300ms; non-spring 150ms motion 425 → **45**, and those 45 are a label crossfade. Colour and hairline at 150ms as argued. No gesture-velocity carry outside the sheet drag. |
| 6 | Haptics | 1 | 1 | **1** | Unchanged. No Vibration API in Safari/iOS; §10's compensation present — no tap highlight, tight press states, **0 tap targets under 44×44** anywhere. |
| 7 | Glass in chrome only | 2 | 2 | **2** | Exactly `.tabbar` and `.findbar--bottom` across all 13 screens. Zero content glass. |
| 8 | Large-title collapse, bottom search | 1 | 1 | **1** | The morph is now Apple's: 34px/700 left → 17px/600 centred, opacity crossfade, scale 1→0.72, gated on real input; bottom capsule search. Docked because **`min-height: 96px` overrides the inline `height: 44px`, so the band measures 96px collapsed — 0px of travel, where the claim is 52.** |
| 9 | Sheet detents, grabber, dimming | 1 | 1 | **2** | Grabber declared only under `[data-grabber="true"]` and painted only on the two sheets that carry detents; four non-resizable sheets paint nothing. Inset 8, r22 four corners, hairline, spring entry. Dimming unconditional but every sheet is modal — accepted. |
| 10 | SF Symbols, weight-matched | 1 | 1 | **2** | Three of four docks cleared and re-measured: one optical size (20×20/1.75) on every screen; shopping's tick 16×16/1.75; the 18×18 gone. Still docked in spirit — stroke is a constant 1.75 regardless of adjacent text, so §2.1 weight-matching is unimplemented. |
| 11 | AX5 / RM / RT / dark | 1 | 1 | **1** | **0 contrast failures across 9,360 text nodes**, both themes, all declared states (was 1,564 nodes). RM/forced-colors/increased-contrast hold. AX5 mechanism right and most screens now survive. Docked because workout-log's Finish is 58–100% off screen in all 9 states, home's week track crushes to 4.7px columns, and shopping's fourth segment is unreachable. |
| | **Total** | **11 / 22** | **13 / 22** | **18 / 22** | |

## Subjective items, out of 8

**§12.12 — primary element identifiable in two seconds — was 2, now 2/2.**
Fuel was the holdout and fuel is fixed: two equal secondary capsules, no accent fill in
any of its seven states, and the screen now reads as what it is — a report. Home, train,
onboarding, review, shopping, settings, split-builder and coach each hand you one capsule.
Workout-log passes on position: Finish is the one orange object, top-trailing. Progress
has no primary, which is right for a chart, and its chart no longer pretends to be one.
Thirteen of thirteen.

**§6.3 / §12 — iOS 27 material treatment — was 2, now 2/2.**
Unchanged and still right, and the tab bar earned more credit this round: it now
*collapses to the active tab* rather than leaving. Measured on train, progress, fuel and
exercise-library — **369px → 71–80px, re-centred at x≈156–159, still at bottom 12, height
unchanged, `.screen` scrollHeight unchanged at 852.** That is §8.2's described behaviour
and it fixed the overflow bug underneath it. No darkened outer edge stroke and no
displacement layer, but §6.3 says those values are unpublished and §6.4 permits the
blur-only case as the ship fallback.

**§8.7 — menus and sheets spring from the triggering control — was 0, now 1/2.**
Implemented in x and clamped in y (table in Part A item 11). A cell at x≈97 opens its pad
at origin `97.25px 0px`; a full-width row opens at `188.5px`, which is that row's own
centre. Half credit: the geometry is real and derived from the trigger, but a
bottom-anchored sheet rising from `translateY(100%)` with a horizontal-only origin is not
yet the zoom-from-the-control motion §8.7 describes.

**§8.8 — empty, loading and error states as instructions — was 2, now 2/2.**
Unchanged and still right, and better verified: walking all 133 declared states, every
`banner--error` I saw carried a labelled recovery action rather than a dead sentence, and
fuel's "Dinner — usually 7:30, about 40 g protein" row is still the best empty state in
the build.

**Subjective total: 4 → 6 → 7 / 8.**

## Totals

| | Review 1 | Review 2 | **Review 3** |
|---|---|---|---|
| Hard items (§12.1–11) | 11 / 22 | 13 / 22 | **18 / 22** |
| Subjective (§12.12, §6.3, §8.7, §8.8) | 4 / 8 | 6 / 8 | **7 / 8** |
| **Total** | **15 / 30** | **19 / 30** | **25 / 30** |

Six points, and five of them on the hard side. Every item that moved this round moved
because something was measurably rebuilt, not because a claim got better. Items 2, 4, 5,
9 and 10 each went 1 → 2, and four of those five were items where review 2 said the claim
and the measurement disagreed. The disagreements are gone.

---

# PART C — FRESH EYES

Ignoring everything above. Twenty-six at-rest renders, 132 state renders, thirteen AX5
renders, two demo renders.

## The single worst-looking screen

**`workout-log.html`**, and it is now the only screen I would call badly composed.

Fuel — the previous holder — is fixed and is now one of the better screens in the build.
So this is the last one.

The set card is a four-column grid where the fourth column is a 44px circle and the space
under it is a right-aligned "PARTIALS" label with a lone `+` button beside it, repeated
once per set. In `mid-session` that produces four ragged half-rows of grey uppercase text
hanging off the right side of the card with nothing under them on the left. Read down the
card: a row of numbers, a stranded PARTIALS, a row of numbers, a stranded PARTIALS, four
times. It is the one place in the build where I cannot see the grid the designer was
working to.

Then the colour: three saturated green circles at 44×44 stacked vertically down the right
edge, an orange ring under them for the next set, an orange Finish at the top and a red
Discard beside it. The green circles are the loudest objects in the fold and they are
confirmations of things already done.

And every input on the screen — 28 `.cell` fields, 14 `.partials__btn`, the `.exc__grip` —
is an r8 rectangle at 44px tall, in a build where everything else that is tapped is a
capsule. The card looks like it came from a different app than the one around it.

Runner-up: **`onboarding.html`**, which puts 780px of flat black above the headline and
then stacks three buttons and a legal line in the last 400px. Not broken. Not composed
either.

## Does anything still read as a web page rather than an iOS app?

**Much less than at review 2, and less than I expected.** Flipping through the 26 at-rest
captures the first impression is iOS on every screen. The four things that broke it last
time — the debug chip on the body copy, the dashed borders, the header collision, the
split filled primary — are all gone, and the list idiom is now consistent. Three things
still read as web:

1. **The r8 rectangle family on the workout log.** `.cell`, `.partials__btn`,
   `.exc__grip` at 44px tall with an 8px radius is the shape of an HTML form field, not
   an iOS control. It is the single largest remaining "this is a page" signal in the
   build, and it is confined to one screen.
2. **The 96px collapsed header.** After the title morphs, a 17px centred label sits in a
   96px band with 52px of empty space under it and a hairline at the bottom. No iOS
   navigation bar has that proportion. It reads as a header div that forgot to shrink —
   which is literally what it is.
3. **The segmented control at four items.** `shopping`'s List / Pantry / Stores / Budget
   at 88px each is fine at default type and falls apart the moment type grows. iOS
   segmented controls cap out around three on a phone.

## Does anything look broken, unfinished, or placeholder?

- **The AX5 workout log is broken, not degraded.** "Fin" cut by the bezel with the rest of
  the button past the edge, in every one of nine states.
- **The AX5 home week track** is seven glyphs overlapping inside 4.7px columns. In the
  render it is a grey smear with a white M and an orange W poking out of it. Nothing else
  in the build looks like a rendering fault; this does.
- **The AX5 shopping segmented control** loses its fourth tab off the right edge.
- **The 96px collapsed header** looks unfinished in every scrolled capture.
- **`coach.html` at rest** spends its top 96px on a centred 17px "Coach" and a "New" link
  with nothing else in the band, then puts the segmented control below it. Two bands of
  chrome before the first message.
- **Onboarding's dead zone**, above.

Nothing in the ship set now looks like placeholder content, and the sheet, tab bar,
chart and list surfaces all look finished.

## What I would change next, in priority order

1. **Make the workout log survive AX5.** Let the header actions wrap or drop to icons
   above xxxLarge — the tab bar's container query already does exactly this and the
   pattern can be lifted. `Finish` at `right 490` on a 393px screen is the one remaining
   accessibility failure that matters.
2. **Collapse the home week track to a summary line above xxLarge**, the way the tab bar
   drops its labels. Seven columns in 105px cannot work at 53px type and should not try.
3. **Fix the collapsed header height.** `min-height: 96px` is beating `chrome.js`'s
   inline `height: 44px`. One line, and it turns a claimed 52px of travel into a real one.
4. **Let shopping's segmented control wrap or scroll at large type** so "Budget" stays
   reachable. The CSS comment says a segmented control wraps rather than scrolling; at
   AX5 it does neither.
5. **Take the workout log's `.cell`, `.partials__btn` and `.exc__grip` to capsules**, and
   give the PARTIALS row a left-aligned home so the card reads as a grid.
6. **Glass the two detented sheets** (`fuel`, `shopping`) with the tab bar's own recipe,
   leaving the full-bleed ones opaque. §8.6 with the build's own argument respected.
7. **Demote the three green `.done` circles** to a filled ring or a check on the ground
   rather than a saturated 44px disc, so the loudest objects on the workout log are not
   the completed sets.
8. **Give `§8.7` its vertical half** — scale the sheet from the trigger's y as well as
   its x, or accept the clamp and say so in the spec notes.
9. **Compose onboarding's first pane** — the headline wants to be near the optical
   centre, not at 46%.
10. **`exercise-library [dev-preset-9]`** — take the demo figure off the accent and put
    the accent on the end position only, the way progress's chart now does it.

---

# VERDICT

## DO NOT SHIP — one blocker

I want to be exact about the distance, because it is small and it was not small before.
This build answered eleven of twelve priority items and cleared one of two blockers, and
it did it by rebuilding things rather than by re-describing them. The three claims review
2 measured false are now true — I re-measured all three. The accent rule is held on all
288 surface/state combinations I could reach, including inside sheets, including SVG,
which is the audit hole that hid the last violation. Motion moved 425 declarations onto a
spring. Contrast is clean on 9,360 nodes. The tab bar collapses to the active tab. The
grabber only appears where a sheet moves. Corners are the platform squircle and nothing
nests pinched. Fuel went from the worst screen in the build to one of the better ones.
15 → 19 → 25 out of 30, and this time the two lowest scores that moved (items 4 and 5)
were the two that had a claim standing behind them that did not survive measurement.

**The blocker.**

**At AX5 the workout log's primary action is off the screen.** `Finish` measures
`left 322 → right 490` in a 393px viewport in `mid-session`, `keypad`, `rest`,
`exercise-done`, `loading` and `error` — 97px of a 168px button past the bezel — and
`left 429 → right 597`, entirely off screen, in `first-set` and `empty`. "Add Exercise"
starts at `left −21`. This is on the screen the app is for, in all nine states it
declares, and §11 opens by saying accessibility is not optional polish and that AX5 is
where hardcoded frames break. A person who has turned the type up cannot end their
workout.

**To clear it:** the header actions on `workout-log` must stay inside 393px at root
53px in all nine declared states, with `Finish` fully visible and at least 44×44. The
build already owns the mechanism — the container query that drops the tab bar to an icon
row above ~xxLarge — and the same treatment on `.hdr` (icon-only Discard and Finish, or a
wrapped action row) would do it. Verify by walking the nine states at
`document.documentElement.style.fontSize = '53px'` and measuring
`getBoundingClientRect().right <= 393` on every `.btn` in the header.

**Two more that I would not block on alone, but that I am naming so they are not
forgotten by a fourth review:**

- **Home's week track at AX5** — each day collapses to a 4.7px column holding a 15–23px
  glyph. It is not an action and it is not the primary content, which is why it is not
  the blocker, but it is the ugliest thing in the build at any setting and it has now
  survived two reviews.
- **The 96px collapsed header** — `min-height: 96px` at `components.css:1925` overrides
  the inline `height: 44px` that `chrome.js` writes, so the large-title band has **0px of
  travel** where the compliance document claims 52. A claim that does not survive
  re-measurement is the thing I have said twice now costs more than the defect it
  describes. This one is a single line.

Fix the workout log's AX5 header and this ships. Everything else on the list above is the
difference between a convincing iOS recreation and an indistinguishable one, and none of
it is structural any more.
