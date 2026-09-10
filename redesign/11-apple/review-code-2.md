# Code review 2 — `08-build/` JS+CSS and `10-final/assemble.mjs`

Scope: `git diff b7ad1ef..HEAD -- redesign/08-build redesign/10-final` (Dynamic Type rework,
transition split, `--full` sheet geometry, `initAccessory`, trigger-anchored overlay origins,
focus-restore fallback, fuel/progress/shopping write paths, nav validation).
No visual-design judgements — correctness, compat, dead code, and comments that lie.

Every finding below was reproduced in the bundled Chromium (Playwright 1.56.1, throwaway
scripts in `redesign/tests/`, since deleted) or is proved by the quoted lines.

---

## 1. `progress.html:894-898` — "Start a workout" kills the assembled demo

```js
} else if (a === 'start-workout') {
  /* Standalone this is a page; in the demo the router takes the click
     before this runs. ... */
  location.href = 'train.html';
```

The comment is false. `MANIFEST.nav` in `assemble.mjs:84-99` has **no entry whose `from` is
`progress`**, so `wire()` never matches this click and never calls `stopPropagation()`. The
screen's own handler runs, and `location` handed to a screen is the **real** `window.location`
(`assemble.mjs:409`: `defs[rec.id](doc, scopedWindow(rec, doc), window.location, ...)`), not
anything scoped.

Reproduced in `10-final/locked-demo.html`: route to `#/home/progress`, switch Progress to its
`empty` state, click `[data-testid="empty-action"]`:

```
URL before: .../locked-demo.html#/home/progress
URL after : chrome-error://chromewebdata/     (train.html does not exist in 10-final/)
demo still alive? false
```

The whole demo is gone — one click, hard dead end. The two sibling cases added by the same diff
are fine because they *are* routed: `fuel.html:656` (`chip-more` → nav entry exists) and
`shopping.html:1412` (`back` → `pushed.shopping.backSelector`); I verified both stay inside the
demo. Progress is the one that was added without the matching manifest row.

Severity: highest. This is the exact class of bug the new `assemble.mjs` validation was written
to catch, and the validation cannot see it because the crossing was never declared.

---

## 2. `fuel.html:743-758` — deleting a meal strands its carbs and fat forever

`addMeal` (`fuel.html:697-702`) bumps three macros in; `removeMeal` subtracts one:

```js
DAY.eaten -= m.kcal;
bump('pro', -m.pro);      // no carb, no fat
```

The meal record written by `addMeal` doesn't even carry `carb`/`fat`, so there is nothing to
subtract — the loss is structural, not a missed line.

Reproduced (`fuel.html`, log via camera → "A lot" → "Log it", then open that meal → "Remove this
entry"):

| | kcal left | Protein | Carbs | Fat |
|---|---|---|---|---|
| before  | 1,410 | 121 | 178 | 58 |
| logged  |   560 | 175 | 256 | 94 |
| deleted | 1,410 | 121 | **256** | **94** |

Calories and protein return exactly; carbs and fat keep the deleted meal's contribution
permanently. `S.undo` (`fuel.html:752-756`) has the mirror-image hole, so delete-then-undo
happens to end up consistent while delete alone does not.

---

## 3. `components.css:189-190` — the row rework breaks a row at the **default** ladder

```css
.row { flex-wrap: wrap; }
.row__main { flex: 1 1 auto; min-width: min(100%, 8em); }
```

The comment above it says "at the default ladder 8em is 120px of a 361px row, so nothing that
fits today changes." It does change. `flex: 1` was `flex: 1 1 0%`, whose hypothetical main size
is 0 and which therefore can never trigger a wrap; `flex: 1 1 auto` makes the hypothetical main
size the text's max-content width, and flex line-breaking uses that figure, not the shrunk one.

Fuel's closing row (`[data-testid="meal-closing"]`, `fuel.html:327`) now lays out on three lines
at 402px viewport and the default type size — thumb alone on line 1, text on line 2, the empty
chevron slot on line 3:

```
row height now .......................... 120px
with the pre-diff rules (.row nowrap / .row__main flex:1;min-width:0) ... 82px
isolating: flex-wrap:nowrap alone → 82px;  flex:1 alone → 82px
```

so both halves of the change are required to produce it. It is the only row of the twelve
screens that regresses at default type (I scanned every `.row` on all twelve), but it regresses
visibly and permanently, in Fuel's default state.

---

## 4. `chrome.js:350-361` — `anchor()` measures the sheet **mid-animation**, so the vertical origin is wrong

```js
function anchor(box) {
  ...
  try { r = box.getBoundingClientRect(); } catch (err) { return; }
  ...
  var oy = openerBox.top + openerBox.height / 2 - r.top;
  box.style.transformOrigin = ... Math.max(0, Math.min(r.height, oy)) + 'px';
  box.setAttribute('data-from-trigger', 'true');
}
```

`anchor()` runs from the MutationObserver the instant the sheet lands in the DOM — while
`animation: sheetUp` (`components.css:500`, `from { transform: translateY(100%) }`) is still in
effect. `getBoundingClientRect()` returns the *transformed* box, so `r.top` is the sheet's
animated position, not its layout position, and `oy` comes out large-negative and clamps to 0.

Measured (trigger scrolled to centre, origin read from the inline style, sheet box read after it
settles):

| screen / trigger | trigger centre y | settled sheet | origin written | correct y |
|---|---|---|---|---|
| progress `open-weight` | 694 | 105..874 | `193px **0px**` | 589 |
| progress `choose-lift` | 485 | 105..874 | `193px **78px**` | 380 |
| fuel `log-mic` | 206 | 473..866 | `98.5px 0px` | 0 (correct by luck) |
| shopping `shop-at` | 225 | 499..866 | `105.5px 0px` | 0 (correct by luck) |

The two cases where the trigger is genuinely inside the sheet — the ones the feature exists for —
both get the wrong answer, and one lands at the *opposite* end of the box. It is also sensitive
to scroll position and timing (the same trigger produced `0px`, `78px` and `286px` across runs
with different scroll offsets), so the "clamped into the overlay's own box" the comment describes
is doing all the work for the wrong reason. The horizontal component is fine (no X translation in
the keyframe).

---

## 5. `chrome.js:235-239` — the top detent is assumed to be full screen; two sheets are not

```js
var top = detents[detents.length - 1];
var BAND = 0.08;
var mark = function (frac) {
  var t = (frac - (top - BAND)) / BAND;
  sheet.style.setProperty('--full', String(Math.min(1, Math.max(0, t))));
};
```

`--full` is 1 at *whatever the largest detent happens to be*, and `components.css:513-520` reads
1 as "full bleed": `left/right/bottom → 0`, bottom radii → 0. Two sheets top out below full
screen:

- `shopping.html:978` `data-detents="0.42 0.8"`
- `shopping.html:1006` `data-detents="0.5 0.85"`

Reproduced by dragging `sheet-shop-at` to its top detent:

```
inline style: height: 80%; --full: 0.9999999999999994
computed:     left 0px  right 0px  bottom 0px  border-bottom-left-radius 0px
rect:         x=0 w=402 (viewport 402), top=174.8, bottom=874
```

An 80%-tall sheet now welds itself to the bezel with square bottom corners. This is a regression
introduced by the diff: the old `[style*="88%"]` selector, whatever else was wrong with it, never
matched `height: 80%`. The band should key off a real "is this full screen" threshold, not off
`detents[detents.length - 1]`.

---

## 6. Validation errors and form state survive close-and-reopen (progress, shopping)

`openSheet`/`closeSheet` (`progress.html:844-855`) never clear the four new state fields added at
`progress.html:389-394`, and `'add-purchase'` (`shopping.html:1283`) never clears
`S.purchaseError`. Reproduced:

```
progress weight: error after bad save = 1
  sheet closed?  true
  error on REOPEN = 1  | "A weight between 20 and 400 kg."
progress goals:  error after empty save = 1
  on REOPEN: form still open = 1, error still shown = 1
shopping: error after empty save = 1 | "What did you buy?"
  error after collapse+REOPEN = 1
```

So a freshly-opened, untouched form accuses the reader of something they have not done yet — and
in the goals case the sheet opens straight into a half-filled add form instead of the "Add a goal"
button. Every other piece of state these sheets own is reset on open; these four are not.

---

## 7. `fuel.html:729-741` — `portion()`'s comment lies about what it scales

```
/* A portion, not a rewrite. Scaling every figure by the same factor is the
   honest edit ... */
```

Only `kcal` and `pro` are scaled. Reproduced ("A quarter more" on Chicken rice bowl):

```
meal row:  720 kcal / 52 g protein  →  900 kcal / 65 g protein   (both ×1.25)
day total: Protein 121→134,  Carbs 178→178,  Fat 58→58           (unchanged)
```

Same structural cause as finding 2 — the meal record has no `carb`/`fat` to scale. Either the
record grows those fields or the comment has to stop claiming "every figure".

Minor, same function: `portion()` calls `render()` and then `say()`, which calls `render()`
again — two full renders per tap.

---

## 8. `fuel.html:781` — Escape leaves `S.camOil` set, `close` clears it

```js
if (a === 'close') { S.sheet = null; S.camOil = null; render(); return; }   // :661
...
if (e.key === 'Escape' && S.sheet) { S.sheet = null; render(); }            // :781
```

Reproduced: open the camera sheet, answer "A lot", press Escape, reopen it —

> "Chicken, rice, broccoli. About **850** kcal, 54 g protein. Estimated from the photo, 71%
> confident. **Adjusted for a lot of oil.**"

A brand-new photo arrives already carrying the previous plate's answer, and the sheet says so.
The two exits have to agree.

---

## 9. `assemble.mjs:812-828` — the new nav guard can't catch a missing `mode`

```js
if (n.mode === 'tab' && !tabIds.has(n.to)) { throw ... }
if (n.mode === 'push' && !MANIFEST.pushed[n.to]) { throw ... }
```

Nothing asserts that `mode` *is* one of those two. A row with `mode` omitted or misspelled passes
both branches, and the router at `assemble.mjs:557` does
`if (n.mode === 'push') push(n.to); else goTab(n.to);` — i.e. it silently treats it as a tab,
which is precisely the failure the comment above the guard says it now prevents ("`mode: 'tab'`
writes a top-level route, and a top-level route that no tab owns renders nothing"). `n.from` is
likewise never checked against `records`, so a crossing declared from a screen that does not
exist is a silent no-op rather than a build error. The two checks that were written are correct;
the set is incomplete.

---

## 10. `chrome.js:219-234` — duplicated comment, and the first copy describes code that isn't there

Two near-identical 8-line comments sit back to back. The first one is the stale draft:

```
/* data-full, not a substring match on the inline style.
   ...  The top detent is a fact this code knows; it says so. */
/* --full, not a substring match on the inline style.
   ...  it writes a 0-to-1 figure over the last 8% of the travel ... */
```

There is no `data-full` attribute anywhere in the build — the code writes a `--full` custom
property. In a codebase where comments are load-bearing, the first sixteen lines a reader hits in
this function describe a mechanism that does not exist. Delete the first block.

Related, `components.css:503-512`: "A sheet with one height and the `--full` **class** set is at 1
the whole time". There is no such class, and a sheet with one detent returns at
`chrome.js:204` (`if (detents.length < 2) return;`) before `mark()` ever runs, so it sits at `--full: 0` (inset) — which is the right
geometry, but not what the sentence says happens.

---

## 11. `components.css:521-525` — `.sheet--full` is now dead, and would lose if it weren't

The diff split `.sheet[data-detents][style*="88%"], .sheet--full { ... }` into two rules and left
`.sheet--full` standing. `grep -rn "sheet--full"` across `08-build/` and `10-final/` matches only
this rule — no markup uses it. Worse, if something did: `.sheet[data-detents]` is specificity
(0,2,0) against `.sheet--full`'s (0,1,0) and sits earlier in the file, so a sheet carrying both
would take the interpolated geometry and `.sheet--full`'s `left/right/bottom: 0` would never
apply. Dead code that is also a trap.

---

## 12. `components.css:527-535` — "the rise stays" is no longer true

```
/* ... the rise stays, because a sheet still comes from the bottom edge --
   what changes is that it also grows from the point that was touched ... */
.sheet[data-from-trigger] { animation-name: sheetFromTrigger; }
@keyframes sheetFromTrigger { from { opacity: 0; transform: translateY(24px) scale(0.92); } }
```

`animation-name` *replaces* `sheetUp`; it does not compose with it. The 100%-of-its-own-height
rise becomes a 24px nudge. Whether that is the better motion is a design question and not mine,
but "a sheet still comes from the bottom edge" is not what the rule does.

---

## 13. `chrome.js:441-455` — `initAccessory` housekeeping

The measurement itself is correct (see "clean" below). Two smaller things:

- The `ResizeObserver` is created and never disconnected, and there is no path that stops
  observing when a screen is torn down. In the demo screens are permanent so nothing leaks in
  practice, but this is the only observer in `chrome.js` with no owner.
- `initAccessory` has no `once()` guard around `measure`, unlike its neighbours
  (`initLargeTitle`/`initTabBar`/`initScrollEdge` all use `once(el, ...)`). The `acc.__lk_acc`
  flag guards the *observer*, but `apply()` still runs — a forced layout read plus a style write
  on every `.screen` — on every `LKChrome.init(root)` call, and six screens call that on every
  render.

---

## 14. `assemble.mjs:521-527` — pre-existing: the deep-link back guard can't fire

Not from this diff, but the diff made Progress deep-linkable and I hit it while testing, so:

```js
function back() {
  /* No entry to go back to (a deep link opened straight into a pushed
     screen): fall back to that screen's parent rather than leaving the page. */
  var route = parseHash();
  if (!prevRoute || !route.top) { history.back(); return; }
  if (history.length > 1) history.back();
  else location.hash = '#/' + (...parent...);
}
```

On the deep link the comment names, `prevRoute` has already been set by the first `render()` and
`route.top` is exactly the pushed screen — so the guard is false, and control reaches
`history.length > 1 → history.back()`, which leaves the page. Reproduced: load
`locked-demo.html#/fuel/shopping` directly with one prior entry in the tab, click Back → the
browser leaves for the previous document and the demo is gone. Normal in-demo navigation
(fuel → More → Back) works correctly. The condition wants to be "did *this* document create the
entry we would go back to", which `prevRoute` cannot answer.

---

## Sections that are clean

- **Focus-restore fallback (`app.js:170-220`).** `focusables`/`snap.index` behaves. Verified on
  shopping: focus on a tick button survives the row moving groups
  (`Mark as picked up, Chicken breast` → `Mark as not picked up, Chicken breast`), and confirming
  "clear picked up" — which destroys the focused control and its whole group — lands focus on
  `[data-action="clear-done"]` rather than `<body>`. The shadow-piercing `deepActive` and the
  `index >= 0` guard agree with each other (an element found only inside a nested shadow root
  yields `-1` and correctly disables the fallback).
- **`initAccessory` measurement.** exercise-library: `--accessory-h: 120px`,
  `--float-h: calc(56px + max(44px, 120px) + 24px + 0px)`. Fuel with the live shelf: `54px`,
  body padding 150px. Same numbers inside the demo's shadow root
  (`#demo-screen-exercise-library` → `120px`), so `:scope >` and the scoped `document` proxy are
  both fine. The `--tap` floor in `components.css:394-396` does what its comment says.
- **Tab bar Dynamic Type + collapse.** The container query fires exactly as documented: at body
  15px the label is 32.5px wide and `position: static`; at 30px and 53px it is 1px and
  `absolute` (name preserved, not `display: none`). The collapse works and the
  `container-type: normal` note is real — measured 378px→74px wide, `inline-size`→`normal`, and
  it expands back to 378px on reverse scroll.
- **`--corner-smooth: squircle` (`tokens.css:99`).** Verified in Chromium 141:
  `corner-shape: squircle` computes to `squircle`, `superellipse(2)` also computes to `squircle`,
  `superellipse(1.8)` stays `superellipse(1.8)`. The token comment is accurate, and the
  progressive-enhancement story holds elsewhere (unsupported → plain radius).
- **shopping `do-clear-done` undo ordering (`shopping.html:1220-1228`).** The
  `unshift({at: i, ...})` while walking backwards produces an ascending-index list, and replaying
  `splice(g.at, 0, g.item)` in that order restores the original positions. Correct, and the
  comment matches.
- **Removed `'store-open': function () {}`** — no `data-action="store-open"` remains in
  `shopping.html`; that was genuinely dead.
- **No horizontal-overflow regressions.** Scanned every element on all thirteen screens at 402px
  and the default ladder: nothing crosses the viewport except onboarding's dev scaffolding, which
  this diff did not touch.
- **Non-Chromium / `file://`.** Nothing in the diff is Chromium-only apart from `corner-shape`,
  which is guarded by design. `:has()`, `container-type`/`@container`, `linear()` easings,
  `:scope >`, `overflow-wrap: break-word`, `clip-path: inset(50%)` and `ResizeObserver` are all
  available in current Safari and Firefox, and every new path is `file://`-safe (no fetch, no
  module graph).
