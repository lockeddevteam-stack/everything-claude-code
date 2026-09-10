# Code review — 08-build/, 10-final/assemble.mjs

Static prototype. Findings ordered most severe first. Every claim was checked
either by reading the call path or by running the page in Chromium
(Playwright, `/opt/pw-browsers`). "Verified" below names the check.

---

## 1. The body map renders solid black in `locked-demo.html`

**File:** `08-build/bodymap.js:118-133` (`installHues`), reached from `mount()` at `bodymap.js:297,300`

```js
function mount(host, opts) {
  var doc = host.ownerDocument || document;   // :297
  ...
  installHues(doc, ORDER);                    // :300
}
function installHues(doc, order) {
  if (doc.getElementById('lk-anat-hues')) return;   // :119
  ...
  (doc.head || doc.documentElement).appendChild(style);   // :132
}
```

`host.ownerDocument` is the **top-level document** even when `host` lives inside
a shadow root. In the assembled demo every screen is a shadow root whose styles
come from `adoptedStyleSheets` only, so a `<style>` appended to `document.head`
never reaches the map. Every `.mg__gnd` falls back to the SVG default fill,
which is black. The `getElementById` guard at :119 also means the style is
written exactly once, so a second map in a second root could never get one
either.

**Verified:** loaded `10-final/locked-demo.html`, routed to
`#/train/exercise-library`, clicked the map/list toggle, then read computed
style inside the shadow root:

```
demo:       { styleInDoc: true, styleInRoot: false, fill: 'rgb(0, 0, 0)',   --anat-chest: '#FF3146' }
standalone: { styleInDoc: true,                     fill: 'rgb(255, 49, 70)' }
```

The custom property resolves fine; it is the rule that is missing.

**Fix:** insert the style into the map's own root, not the owning document —
`var root = host.getRootNode(); (root.head || root).appendChild(style)`, and key
the "already installed" guard off that root (e.g. `root.querySelector('#lk-anat-hues')`)
rather than off `doc.getElementById`.

---

## 2. Onboarding stacks click listeners exponentially on the setup step

**File:** `08-build/onboarding.html:822-831` (inside `renderSetup`)

```js
LKPatch($('#setup-step'), html);        // :814
...
if (step.kind === 'text') {
  $('#setup-name').addEventListener('input', ...);          // :823
} else {
  $$('[data-choice]', $('#setup-step')).forEach(function (b) {
    b.addEventListener('click', function () {
      S.answers[step.id] = b.dataset.choice;
      renderSetup();                                        // :828
    });
  });
}
```

`LKPatch` morphs rather than replaces, and each option button carries
`data-testid="setup-<id>-<value>"`, which `app.js:75` uses as its match key —
so the *same DOM node* survives every render and collects one more listener each
time. Because the handler itself calls `renderSetup()`, one click fires *k*
handlers, each of which adds another listener: the count doubles per click.

**Verified:** instrumented `EventTarget.prototype.addEventListener` and clicked
one option five times on the "units" step:

```
after go:        setup-units-kg:click = 1
after 5 clicks:  setup-units-kg:click = 32     (2^5)
```

The text step stacks linearly for the same reason: 1 listener after one render,
5 after five renders on `#setup-name:input`.

**Fix:** delegate. `#setup-step` is a stable container — bind one `click` and one
`input` listener to it once at boot and read `data-choice` / `id` off
`e.target.closest(...)`, the pattern every other screen already uses
(e.g. `exercise-library.html:1020`).

---

## 3. Five screens lose all chrome behaviour in `locked-demo.html`

**Files:** `08-build/chrome.js:253-254`; `home.html` (no `LKChrome.init` call),
`progress.html`, `review.html`, `settings.html`, `workout-log.html`

`chrome.js` self-starts once against the real document:

```js
if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { init(doc); });
else init(doc);
```

In the demo this runs before any shadow root exists (`DEMO.start()` is an inline
script in `<body>`, and `document.querySelectorAll` cannot see into shadow roots
anyway). Only screens that call `LKChrome.init` themselves get wired:
coach, exercise-library, fuel, profile, shopping, train (`grep -n LKChrome *.html`).
Everything else silently has no large-title collapse, no tab-bar minimize and
no scroll edge.

**Verified:** in `locked-demo.html`, read the `__lk_*` marks `chrome.js:58-62`
sets, per screen shadow root:

| screen | large title | scroll edge | tab minimize |
|---|---|---|---|
| home | markup present, **not wired** | **not wired** | **not wired** |
| progress | markup present, **not wired** | **not wired** | **not wired** |
| review / settings / workout-log | – | **not wired** | – |
| train / fuel / profile / coach / exercise-library / shopping | wired | wired | wired |

Standalone `home.html` *is* wired (`{lt: true, tab: true}`), so this is a
demo-only regression, which makes it easy to miss.

**Fix:** either have `assemble.mjs` call `LKChrome.init(root)` after `mount(rec)`
in the runtime (it already has the root), or add the one-line
`if (window.LKChrome) LKChrome.init(document);` to the five screens' render paths
as the other six do. The first is better — it removes the per-screen duplication
that caused the gap.

---

## 4. Home's "Climbing" row navigates nowhere

**File:** `10-final/assemble.mjs:83`

```js
{ from: 'home', selector: '[data-testid="row-climbing-lift"]', to: 'progress', mode: 'tab' },
```

`progress` is not a tab — `MANIFEST.tabs` (`assemble.mjs:54-60`) is
home/train/fuel/coach/profile. `goTab('progress')` sets `location.hash =
'#/progress'`; `parseHash` then does `tabOf('progress')` → `null` → falls back to
`TABS[0].id`, i.e. home. The tap changes the URL to a bogus route and shows the
screen you were already on. A reload of that URL also lands on Home.

**Verified:** in `locked-demo.html`, clicked `[data-testid="row-climbing-lift"]`
in the home shadow root:

```
hash after tap:  #/progress
visible screen:  demo-screen-home
```

`#/home/progress` does show progress, so the screen itself is fine.

**Fix:** `mode: 'push'` (progress already resolves a parent through
`push()`'s `route.base` fallback; adding `progress: { parent: 'home' }` to
`MANIFEST.pushed` makes it explicit and gives the back bar the right label).
Separately, `screenForTab` (`assemble.mjs`, runtime) should not assume `tabOf`
returned non-null — `t.id` on `null` would throw.

---

## 5. A stale large-title listener keeps driving a header that opted out

**File:** `08-build/chrome.js:58-62,72,82-100`; caller `exercise-library.html:889-893`

```js
hdr.classList.toggle('hdr--large', !pushedView);
if (pushedView) hdr.removeAttribute('data-large-title');   // :890  ← opt out
else hdr.setAttribute('data-large-title', '#body');
LKPatch(hdr, renderHdr());
if (window.LKChrome) LKChrome.init(document);              // :893
```

`once(bar, 'title')` sets an expando on the element and `chrome.js` never
unbinds. The header element is the same node across renders (LKPatch morphs it),
so removing `data-large-title` does nothing: the listener installed on the first
render keeps running, keeps writing `bar.style.height` interpolated from the
*large* header's measured height, and keeps flipping `data-collapsed`.

**Verified:** `exercise-library.html`, pushed into the Chest group (header is
now plain `.hdr`, `data-large-title` is `null`):

```
group, at top:    { cls: 'hdr', inline: '74px', off: 74, data-large-title: null, data-collapsed: 'false' }
group, scrolled:  { cls: 'hdr', inline: '44px', off: 44, data-large-title: null, data-collapsed: 'true'  }
natural height with the inline style cleared: 61px
```

So the pushed header is inflated 13px at rest and crushed to 44px on scroll, on a
header that asked not to be managed.

**Fix:** make `initLargeTitle` re-check the attribute inside the scroll callback
(`if (!bar.hasAttribute('data-large-title')) { bar.style.height = ''; return; }`),
or give `chrome.js` a real teardown that `init` calls when the opt-in attribute
has gone. Also re-measure `expanded` when the bar's content changes — it is
captured once at `chrome.js:84` and never refreshed.

---

## 6. Sheet detents are inert on progress and split-builder — the grabber is a lie

**Files:** `08-build/progress.html:589-590`, `08-build/split-builder.html:646-647`;
`08-build/chrome.js:164-241`

Both render `class="sheet" data-detents="0.55 0.88" data-detent-open="0.88"` with
a `.sheet__grab [data-sheet-drag]` handle. `initSheets` is the only thing that
reads those attributes, and neither screen ever calls `LKChrome.init` — and even
if it did, the sheet is created *after* boot, so the page-load pass at
`chrome.js:254` would have missed it.

**Verified:** opened the lift picker on `progress.html`
(`[data-action="open-picker"]`) and inspected the sheet:

```
{ wired: false, inlineH: '', computedH: '704px', grabber: null, grabDisplay: 'block', grabH: '4px' }
```

`data-detent-open="0.88"` is never applied, the sheet cannot be dragged, and the
grabber pill still renders — a visible affordance for a gesture that does not
exist. `chrome.js:174-175` would have set `data-grabber="true"`; it is `null`.

**Fix:** call `LKChrome.init(document)` at the end of `render()` on both screens
(the `once`/`__detents` guards make repeat calls cheap), the way `fuel.html:435`
and `shopping.html:1024` already do for their sheets.

---

## 7. Buttons with a `data-action` that no handler reads

Grepped every `data-action` / `data-act` value per screen against that screen's
handler map and `===` comparisons, then read each hit.

| file | line | `data-action` | control |
|---|---|---|---|
| `progress.html` | 488 | `log-record` | "Log a record" button |
| `progress.html` | 501 | `open-weight` | "Body weight" row |
| `progress.html` | 510 | `open-goals` | "Goals" row |
| `progress.html` | 538 | `start-workout` | empty-state primary |
| `profile.html` | 181 | `signup` | guest-state primary |
| `profile.html` | 292 | `start` | new-account primary |
| `profile.html` | 167, 315 | `settings` | works in the demo only, via `assemble.mjs:91` `[data-testid="open-settings"]`; dead standalone |
| `fuel.html` | 265 | `meal` | every meal row |
| `fuel.html` | 302 | `meals` | header "Meals" action |
| `fuel.html` | 150, `home.html` 402 | `resume` | the running-session shelf |

The handlers are `progress.html:662-688` (`range`, `open-picker`, `close-sheet`,
`pick-lift`, `retry`, `show-cached`), `profile.html:331-338` (`retry` only) and
`fuel.html:438-445` (`mic`, `cam`, `close`, `retry`).

**Fix:** either wire them or drop the attribute. A `data-action` that does
nothing is indistinguishable from one that is broken, and the demo's own
click-through will read as a dead screen.

---

## 8. `assemble.mjs` has four paths that drop content without saying so

**File:** `10-final/assemble.mjs`

1. **A tab whose screen file is missing vanishes.** `:748-751`
   ```js
   const s = screens.find((x) => x.id === t.screen);
   if (s) records.push({...});
   ```
   With `MANIFEST.placeholders` now `{}` (`:104`), a renamed or deleted screen
   file produces no record, no placeholder and no error — but `cfg.tabs` still
   lists the tab with its screen id, so `show(id)` at runtime hides every screen
   and the tab renders blank. Make this throw.

2. **A missing fetch asset is dropped silently.** `:243`
   `if (existsSync(p)) map[a] = read(p);` — the screen then hits
   `scopedFetch`'s `Promise.reject(new Error('demo is offline: ' + key))` at
   runtime instead of failing the build.

3. **Any `<script src=...>` in a `<body>` is silently emptied.** `:138`
   `stripTag(bodyMatch[1], 'script')` keeps only the *text* between the tags, so
   `<script src="x.js"></script>` contributes an empty string and the file is
   never inlined. No screen does this today (checked all 14), so it is latent,
   but nothing warns.

4. **Inline `<script>` in a `<head>` is dropped entirely.** `:130-137` mines the
   head for `<title>` and `<style>` only. Every screen currently uses only
   `<script src>` in the head and every one of those is in `MANIFEST.js`
   (checked all 14), but a head-level inline script would disappear.

`buildAssets` correctly picks up `exercise-library.html`'s
`../tests/fixtures/exercise-db.json`; the emitted CFG carries all 13 screens.

**Also dead in this file:** `tabbarFor` (`:198`), `placeholderMarkup` (`:209`)
and the `t.id + '-placeholder'` branches in `build()` and the runtime's
`screenForTab` are unreachable while `placeholders` is `{}` — roughly 60 lines
that no longer run and are no longer exercised by any test.

---

## 9. The exercise sheet's body figures are torn down and rebuilt on every render

**File:** `08-build/exercise-library.html:413-421` (`mountSheetFigures`), called
from `render()` at `:902`

```js
var gid = slot.getAttribute('data-fig-gid');
if (slot.getAttribute('data-fig-built') === gid) return;    // :415  the guard
```

The guard is stored as an attribute on a node inside the container that
`LKPatch(layer, renderLayer())` patches. `syncAttributes` (`app.js:272-282`)
removes every attribute the new markup does not declare, and `bodymap(it)`
(`:427-431`) emits the slot with no `data-fig-built`. So the guard is wiped on
every render and both SVG figures are re-mounted from scratch each time.

**Verified:** opened a detail sheet, held a reference to the mounted `<svg>`,
switched to another detail preset, re-read:
`{ same: false, built: 'chest' }` — a different node, guard re-set.

**Fix:** keep the built marker off the DOM (a `WeakMap`/`Map` keyed by slot, or
a JS property rather than an attribute, since LKPatch does not touch expandos),
or mount the figures into a container that is not patched, as `syncMap()`
already does for the full-screen map (`:854-878`).

---

## 10. Three different press scales, and the tab bar gets the wrong one

**Files:** `08-build/tokens.css:559-561`, `08-build/components.css:1597-1621`

```css
/* tokens.css:559 */  button:active, [role="button"]:active, .row:active, .chip:active { transform: scale(0.97); }
/* components.css:1608 */ .btn:active, .chip:active, ... { transform: scale(0.96); }
/* components.css:1618 */ .row:active, .shelf:active, ...  { transform: scale(0.99); }
```

`components.css` loads after `tokens.css` on every screen and in the assembled
stylesheet, and the selectors have equal specificity, so **both class selectors
in the tokens rule are dead**. The rule survives only through its bare
`button:active`, which now silently governs anything with no component press
class — including `.tabbar__item`, which is listed in the transition rule
(`:1597`) and in the reduced-motion reset (`:1637`) but was **left out of the
`:active` scale rule** (`:1608-1610`). The tab bar therefore presses at 0.97
while every other control presses at 0.96 or 0.99.

**Verified:** injected both stylesheets in order into a page and enumerated every
`:active` rule that declares `transform` and matches each element:

```
tabbar__item: [ button:active => scale(0.97) ]
row:          [ button:active => 0.97, .row:active => 0.97, .row:active => 0.99, ... ]   ← 0.97 twice, both lose
chip:         [ button:active => 0.97, .chip:active => 0.97, .chip:active => 0.96, ... ]
btn:          [ button:active => 0.97, .btn:active => 0.96, ... ]
```

**Fix:** delete `.row:active, .chip:active` from `tokens.css:559`, add
`.tabbar__item:active` to `components.css:1608`, and make the scales tokens
(`--press-scale`, `--press-scale-wide`) so a fourth value cannot appear.

---

## 11. `--nav-h-compact` does not exist; two copies of the fallback

**Files:** `08-build/chrome.js:86`, `08-build/components.css:1676`

```js
var compact = parseFloat(getComputedStyle(bar).getPropertyValue('--nav-h-compact')) || 44;
```
```css
.hdr--large[data-collapsed="true"] { height: var(--nav-h-compact, 44px); }
```

`grep -rn "nav-h-compact"` across `08-build/` returns only these two lines — the
token is never defined (`tokens.css:326` defines `--nav-h: 56px` and nothing
else). **Verified:** `getComputedStyle(header).getPropertyValue('--nav-h-compact')`
on `train.html` returns the empty string, and the header collapses to exactly
44px.

Two consequences beyond the missing token:

- The literal 44 is duplicated in JS and CSS, so the two can drift.
- `.hdr` carries `padding-top: calc(var(--sp-2) + var(--safe-top))`
  (`components.css:35`), so on a device with a top inset the real compact height
  is more than 44px and this squashes the bar into the notch.
- The CSS rule at `:1676` is itself dead whenever the script runs: `chrome.js:87`
  writes `bar.style.height` inline on every scroll frame, and inline style beats
  any selector. Verified: after scrolling, `inline: '44px'` and `offsetHeight: 44`.

**Fix:** define `--nav-h-compact` in `tokens.css` next to `--nav-h`, and have
`chrome.js` read it with no numeric fallback (bail if it is empty), so a missing
token is loud instead of a silent 44.

---

## 12. `.switch` had its "on" colour declared twice — fixed under me mid-review

**File:** `08-build/components.css`, around `:240` and `:1189`

When I first read the file it contained two identical selectors with identical
specificity in the same stylesheet:

```css
/* :240  */ .switch[aria-checked="true"] .switch__track { background: var(--accent); }
/* :1190 */ .switch[aria-checked="true"] .switch__track { background: var(--success); box-shadow: none; }
```

so no switch was ever accent-coloured and the first rule was unreachable.
`components.css` was edited by another process at 04:47 while this review was
running and the `:240` rule is now gone; `:1188-1189` is the surviving pair.

**Still open:** `.switch__track` is *still* declared twice —
`:223-227` (base) and `:1188` (the `--border` ring the comment at `:1177-1187`
explains). Two blocks for one component is how the `--accent` duplicate got
there in the first place. Fold `:1188` into `:223`.

**Note for the rest of this report:** `tokens.css` and `components.css` were
being modified during the review (mtimes 04:46 and 04:47; `mockup-bodymap.html`
was also deleted). All CSS line numbers were re-checked against the files as of
04:47 — re-grep before acting if they have moved again.

## 13. Dead CSS

Verified by grepping every `class="..."` literal and every string-concatenated
class name in `*.html`, `*.js`, `vendor/body-art.js` and `assemble.mjs`.

| selector | file:line | note |
|---|---|---|
| `.glass`, `.glass--clear`, `.glass-group` | `components.css:1542-1578` | ~40 lines including two media queries. No element anywhere carries any of these. The `--glass-*` tokens are still live via `.tabbar` / `.findbar--bottom` / `.searchbar`. |
| `.searchbar` | `components.css:1949-1959`, `:1995` | Nothing uses it; `.search` (`:212`) and `.findbar--bottom` (`:1966`) are the live ones. |
| `.sheet__grip` | `components.css:1706`, `:1712`; looked for in `chrome.js:174` | No markup uses `sheet__grip`; every sheet uses `sheet__grab`. |
| `.t-large-title`, `.t-title-2`, `.t-title-3`, `.t-callout` | `tokens.css:600,602,603,606` | Four of the typography scale classes are never applied. (`.t-title`, `.t-section`, `.t-label`, `.t-detail`, `.t-meta`, `.t-hero`, `.t-body-em` are all live.) |
| `VALUE_PROPS` entry `['indeterminate', null]` | `app.js:66` | Skipped unconditionally by `if (!attrName) continue;` at `:295`. |

Not dead, despite looking it: `.week__mark--*`, `.strength__seg--*` and
`.delta--down` are all built by string concatenation
(`home.html:192`, `onboarding.html:588`, `review.html:395` with
`dir()` at `review.html:199` returning `'down'`).

---

## 14. Coach's tab controls point at ids that do not exist

**File:** `08-build/coach.html:327` vs `:943`

```js
'" aria-controls="panel-' + v[0] + '" data-act="view" ...'      // :327  — one per view
'<div id="panel-' + S.view + '" role="tabpanel" ...'            // :943  — only the ACTIVE panel
```

Three tabs are rendered, one panel exists. The two inactive tabs'
`aria-controls` always dangle.

**Verified:** DOM audit across all 13 screens found exactly this —
`badControls: ['seg-plan -> panel-plan', 'seg-setup -> panel-setup']` on
`coach.html`, and nothing on any other screen. (The same sweep found no broken
`aria-labelledby`, `aria-describedby` or `label[for]`, no `div`/`span` used as an
interactive control, and no skipped heading levels anywhere.)

**Fix:** drop `aria-controls` from the inactive tabs, or render all three panels
and hide the inactive ones (which is also what the roving-tabindex pattern a
`role="tablist"` implies would want).

---

## 15. Fixture-shape assumptions that would throw on an empty or one-item list

None of these fire with the shipped fixtures — I ran every dev state on every
screen and saw zero page errors — but each is a crash rather than a degraded
render.

- **`home.html:229-240` `sparkline(series)`** — `(i / (series.length - 1))` is
  `0/0 = NaN` for a one-point series, and `((v - lo) / (hi - lo))` is `NaN` when
  every value is equal (a flat lift). Both produce `points="NaN,NaN"` and an
  invisible line. Guard: `series.length < 2` → render the dot only; `hi === lo`
  → put the line at mid-height. `progress.html:328,301-303` already does exactly
  this for its big chart (`if (t1 === t0)`, `if (span <= 0)`), so the two chart
  routines have drifted.
- **`progress.html:424-426` `trendCard`** — `var cur = pts[pts.length - 1];
  var delta = cur[1] - pts[0][1];` throws if `ptsIn(lift, days)` is empty, i.e. a
  lift with no session inside the selected range. Safe today only because every
  fixture lift has ≥3 points inside 28 days.
- **`progress.html:407-417` `answerCard`** — `dayLabel(s.from)` throws on `null`
  and `s.best.name` throws on `null` when no lift has two points in the window
  (`summary` at `:248-262` leaves both null in that case).
- **`progress.html:601-609`** — `p[p.length - 1][1]` in the picker row, same
  empty-window hazard; note `:601` already guards `p.length > 1` for the delta on
  the line above and then does not guard the line below.
- **Long strings:** `onboarding.html:838 escapeAttr` escapes `"` only, while
  `escapeHtml` at `:930` escapes the rest. `escapeAttr(S.answers.name)` at `:792`
  puts a raw `&` into an attribute value. Every other screen has an `esc()` that
  handles `& < > "` (10 near-identical copies, two spellings — `coach.html:99`,
  `fuel.html:103`, etc.).

---

## 16. `LKBodyMap` sizes its tap targets from the window, not the phone frame

**File:** `08-build/bodymap.js:88-107`

```js
var FRAME_UNITS = 240;
function unitPx() { var w = global.innerWidth || 390; return Math.min(w, 430) / FRAME_UNITS; }
```

The comment at `:83-88` justifies the constant with "the figure is a fixed
fraction of the viewport". It is not: above the breakpoint
(`components.css:568-581`) `.phone` is a fixed **393px**, so on a desktop window
`unitPx()` returns `430/240 = 1.79` where the truth is `393/240 = 1.64`. Every
muscle then measures ~9% wider than it renders, so `reachOf` computes a smaller
shortfall and each thin muscle ends up with a target *under* the 44px the file
sets out to guarantee. `mount()` also samples this once and never recomputes on
resize.

Note the reach maths itself is correct — `.hit` carries
`vector-effect: non-scaling-stroke` (`components.css:1503-1504`), so the
`stroke-width` attribute is in screen pixels, not art units. Verified by reading
the computed `vector-effect` and the emitted `stroke-width` attributes
(abs 36.2, quads 34.1, shoulders 0.2 — consistent with `MIN_HIT - thin`).

**Fix:** measure the host (`host.getBoundingClientRect().width`) after mount, or
read `--frame-w`; and recompute on resize, which `exercise-library.html` already
listens for elsewhere.

---

## 17. Copies of the tab bar have drifted

Eight screens hand-write the same five-item tab bar (one of them, `coach.html:339`,
builds it in JS). Read out of the live DOM on each screen:

| screen | `data-minimize` | current tab |
|---|---|---|
| home, exercise-library, fuel, profile, shopping, train | `#body` | correct |
| coach | `.body` | correct |
| **progress** | `#body` | **none marked** |
| **workout-log** | **absent** (`id="tabs"` instead) | train |

So `workout-log`'s bar is the one copy that can never minimize, and `progress`
is the one copy with no `aria-current`. In the demo the runtime's `syncTabs`
papers over the second one; standalone it does not.

**Fix:** emit the bar from one helper (or one template `assemble.mjs` already
knows how to lift — `tabbarFor` at `:198` does exactly this and is currently
dead code, see finding 8).

---

## 18. Two smaller state bugs

- **`shopping.html:1198` and `:1206`** —
  `hue: 'var(--id-' + ((MYSTORES.length % 6) + 1) + ')'`. `MYSTORES` seeds with
  `--id-1`, `--id-4`, `--id-2` (`:253-255`), so the *first* store a user adds gets
  `(3 % 6) + 1 = 4` — the same hue as Target. `store-remove` (`:1190-1193`)
  shrinks the array, so collisions get more likely, not less. Pick the lowest
  unused id instead of deriving it from the length.
- **`app.js:594-597`** — `stop()` calls `find(el, key)` at call time rather than
  holding the spring object. If the spring has finished and a *new* spring for
  the same element and key is in flight, the stale handle stops the new one.
  Same shape at `:571-576`: `if (!opts.velocity)` treats an explicit
  `velocity: 0` as "not supplied" and inherits the in-flight velocity instead of
  honouring the zero.

---

## What I checked and found clean

- All 13 screens boot with no console or page errors, and every dev state on
  every screen (172 state clicks total) renders without throwing.
- `:root[data-theme="light"]` and the `@media (prefers-color-scheme: light)`
  block are byte-identical after comment stripping (49 declarations each), and
  the media block is correctly guarded with `:not([data-theme])`, so an explicit
  dark choice on a light OS still wins.
- No dangling `aria-labelledby`, `aria-describedby` or `label[for]`; no
  `div`/`span` used as an interactive control; no skipped heading levels.
  (`split-builder.html` has no `<h1>` but uses `role="heading" aria-level="1"`
  at `:253` and `:462`, which is valid — just the only screen that does it that way.)
- `components.css` has exactly one unintentionally global selector,
  `h1, h2, h3, h4, p` at `:14`, and it is deliberate and documented.
- The screen-level document listeners (`document.addEventListener` at
  `coach.html:1237`, `train.html:795`, `workout-log.html:833`, etc.) are all bound
  once at boot outside any render function — finding 2 is the only listener that
  stacks.
- `assemble.mjs` emits all 13 screens with the right tab assignment, inlines the
  one fetched fixture, and `DEMO.leakedGlobals` is empty.
