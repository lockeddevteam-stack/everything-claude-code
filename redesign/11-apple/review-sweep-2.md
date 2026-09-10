# Sweep 2 — second end-to-end bug and UX pass over 08-build and the assembled demo

Round 2. Everything below was reproduced in Chromium 1.56.1 at 393×852 from `file://`,
unless a finding names a different width or text size. Scripts are in
`redesign/tests/agent-sweep2-*.mjs`; raw output paths are named per finding.

Scope run this pass:

* every screen × every dev state at 320 / 393 / 430 px, light and dark
* every screen × every dev state at browser text 125% (`documentElement.style.fontSize = '20px'`)
  and 200% (`32px`)
* every `<button>` / `<a>` / `role=button` clicked from a fresh load in every state
  (941 recorded observations, `tests/agent-sweep2-clicks.json`)
* every sheet: geometry, three close paths, focus return, primary-button reachability
* the whole shopping write path driven end to end and its arithmetic checked
* the assembled demo: hash routing, tab bar, back, per-screen chrome, body map

Nothing was changed. **No page errors and no console errors were seen anywhere**, in any
state, in either theme, at any of the three widths or either text size.

---

## Severity 1 — Critical

### 1. Assembled demo: tapping "Climbing lift" on Home takes you to a blank screen and the app appears frozen

**File** `10-final/assemble.mjs:83` (`{ from: 'home', selector: '[data-testid="row-climbing-lift"]', to: 'progress', mode: 'tab' }`)
→ `10-final/locked-demo.html`.
**Selector** `[data-screen="home"]` shadow root → `[data-testid="row-climbing-lift"]`.

**Steps** — open `10-final/locked-demo.html`, wait for boot, tap the "Climbing lift" row on Home.

**Observed** — the hash becomes `#/progress`; the Progress host stays `display:none`;
the only screen with a non-zero box is still `home`. The user taps a row, the URL changes,
and the screen does not. Same result from `p.goto('#/progress')` directly.

```
home -> row-climbing-lift : clicked
hash #/progress   visible hosts: [ 'home' ]
[data-screen="progress"] display:none  rect 0×0  (booted:true, 17318 bytes of shadow DOM)
```

**Cause** — Progress is registered as a *pushed* screen, not a tab: no tab bar in the demo
contains `tab-progress` (all thirteen roots carry the same five: `tab-home`, `tab-train`,
`tab-fuel`, `tab-coach`, `tab-profile`), and `progress.html:85` itself marks `tab-home` as
`aria-current`. `mode: 'tab'` calls `goTab('progress')`, which writes a top-level route that
no tab owns, so `render()` shows nothing. The demo index entry for Progress works because it
pushes `#/home/progress` instead.

**Should** — the row should push (`mode: 'push'`, parent `home`), the way every other
non-tab destination does; or `goTab` should fall back to pushing when the target is not a tab.

**Repro script** `tests/agent-sweep2-demo3.mjs`

---

## Severity 2 — High

### 2. Opening a sheet after the tab bar has minimized shifts the whole overlay 56 px up, leaves an unscrimmed strip along the bottom edge, and lets taps through the modal

**File** `08-build/components.css:1812-1822` (`.tabbar[data-minimize]` / `[data-minimized="true"]`)
against `.screen { position: relative; overflow: hidden }` and the `position: absolute`
`.scrim` / `.sheet`.
**Reproduced on** `progress.html` (`[data-testid="choose-lift"]`) and `train.html`
(`[data-testid="open-activities"]`). Applies to every screen whose tab bar carries
`data-minimize`.

**Steps** — `progress.html` → scroll `#body` down far enough to minimize the tab bar
(a wheel event plus `scrollTop = 300`) → press **Choose a lift**.

**Observed**

```
before scroll   .screen scrollTop 0   scrollHeight 852  clientHeight 852
after minimize  .screen scrollTop 0   scrollHeight 908  clientHeight 852   <- 56px of hidden overflow
after open      .screen scrollTop 56
                sheet  46..796   (clean open: 102..852)
                scrim  -56..796  (clean open: 0..852)
                tabbar 796..852  data-minimized=true, opacity 0
elementFromPoint(196, 845) -> screen-progress      (not .scrim)
```

Three consequences, all visible:

1. The **scrim stops 56 px short of the bottom**. The bottom strip of the screen is
   un-dimmed while a modal sheet is open.
2. `document.elementFromPoint` in that strip returns the underlying screen, not the scrim,
   so **taps in it reach the screen behind the modal**. (No button happens to sit there in the
   progress or train fixtures, so nothing fires today — but the modal barrier is gone, and any
   layout with a control in the last 56 px will be tappable through the sheet.)
3. The sheet itself is **shifted 56 px up**: its top rides at 46 instead of 102 and its bottom
   edge floats 56 px off the bezel, so the inset-sheet shape is wrong and the sheet's bottom
   corners are visible in the middle of the screen.

**Cause** — the minimize is a `transform: translateY(...)` on an element that stays in flow.
The translated bar overflows `.screen` by 56 px (`scrollHeight` 852 → 908). `.screen` is
`overflow: hidden`, which is still *scrollable programmatically*, so when the sheet opens and
the browser scrolls the newly focused dialog into view, it scrolls `.screen` itself by 56 px.
Everything absolutely positioned inside — scrim, sheet, tab bar — moves with it.

**Should** — the minimized bar should not create overflow (translate a wrapper that is
`position: absolute`, or use `visibility`/`opacity` plus a transform that stays inside the
box), and `.screen` should be pinned against being scrolled (`overflow: clip`, or resetting
`scrollTop` on open). Either fix restores a full-bleed scrim.

**Repro scripts** `tests/agent-sweep2-strip.mjs`, `tests/agent-sweep2-scrimgap.mjs`;
screenshots `scratchpad/progress-minimized-sheet.png`, `scratchpad/train-minimized-sheet.png`.

### 3. exercise-library: the last row of a group list is permanently under the floating bottom search bar and cannot be tapped

**File** `08-build/components.css:361-363` (`--float-h`) + `08-build/exercise-library.html:78`.
**Selector** `[data-testid="row-ex-900001"]` in the Chest group.

**Steps** — `exercise-library.html` → STATE → **Group: Chest** → scroll `#body` to the end.

**Observed** — the scroller is fully scrolled (`scrollTop 88 === max 88`). The find bar
occupies 656–776 and the tab bar 784–840. The last row sits at 648–712, so its centre
(680) is inside the find bar. `document.elementFromPoint` at the row's centre returns
`search-input`; a real Playwright click times out on "waiting for element to be visible,
enabled and stable". The row is unreachable at every scroll position.

```
findbar: {t:656, b:776, h:120}   scroller padding-bottom: 140px
row-ex-123    584–648  reachable
row-ex-900001 648–712  hit = search-input   reachable:false   <-- click BLOCKED
```

**Cause** — `.screen:has(.tabbar):has(.findbar--bottom)` budgets
`--float-h = --nav-h + --tap + --sp-5` = 56 + 44 + 20 = 120 px for the whole floating stack.
The real find bar is **120 px tall on its own** — it holds a search field *and* a filter chip
row — so the stack is ~200 px and the scroller is short by ~60 px. The 44 px in the formula
assumes the accessory is one tap target high; nothing measures it.

**Should** — the scroller's bottom inset should be derived from the accessory's measured
height, not from `--tap`. Same latent under-padding affects `#shelf-slot`: fuel's shelf is
54 px, not 44.

**Repro script** `tests/agent-sweep2-findbar.mjs`; screenshot
`scratchpad/exlib-findbar.png`. Corroborated independently by
`tests/agent-sweep2-clicks.json` (`CLICK-BLOCKED` on `row-ex-900001`) and by
`tests/agent-sweep2-cover.mjs`, which reports the same row blocked by `findbar--bottom`
at both the top and the bottom of the scroll.

### 4. At 200% browser text, sixteen button, chip and badge labels run off the edges of the screen

**File** `08-build/components.css:98` (`.btn { white-space: nowrap }`) and
`components.css:1168` (`.badge { white-space: nowrap }`).

**Steps** — open the screen, run `document.documentElement.style.fontSize = '32px'`
(browser text 200%), switch to the state named.

**Observed** — the label box extends past the viewport on one or both sides. Viewport is
0–393. Nothing scrolls horizontally, so the text is simply cut.

| file | state | selector | label | left | right |
|---|---|---|---|---|---|
| coach.html | preset 6, 7 | `[data-testid="plan-adjust"]` | "Ask the coach to adjust it" | 0 | **421** |
| coach.html | preset 10 | `[data-testid="plan-retry"]` | "Ask the coach to send it again" | **-52** | **445** |
| coach.html | presets 11-14 | `[data-testid="setup-quick-1"]` (`.chip`) | "Keep replies under 80 words." | 32 | **458** |
| exercise-library.html | preset 3 | `[data-testid="create-custom"]` | "Create “kettlebell swing”" | **-52** | **445** |
| exercise-library.html | preset 13 | `[data-testid="create-custom"]` | "Create a custom exercise" | **-50** | **443** |
| exercise-library.html | presets 5-9 | `[data-testid="sheet-primary"]` | "Start a workout with this" | 5 | **417** |
| exercise-library.html | preset 11 | `[data-testid="sheet-primary"]` | "Add to today’s workout" | 18 | **403** |
| exercise-library.html | preset 15 | `[data-testid="show-customs"]` | "Show my custom exercises" | **-26** | **419** |
| fuel.html | error | `[data-testid="log-offline"]` | "Log anyway, without targets" | **-39** | **432** |
| progress.html | populated | `[data-testid="log-record"]` | "Log a record without a workout" | **-16** | **437** |
| progress.html | error | `[data-testid="show-cached"]` | "Show what is on this phone" | **-31** | **424** |
| review.html | diff-skip | `[data-testid="split-update"]` | "Remove Lateral Raise from Push" | **-72** | **465** |
| review.html | diff-many | `[data-testid="split-sheet-apply"]` | "Apply to Push" | 171 | **399** |
| review.html | **all seven states** | `[data-testid="card-ai"] .badge` | "Generated, not measured" | 44 | **424** |
| train.html | error | `[data-testid="use-cached"]` | "Use what is on this phone" | **-17** | **410** |
| workout-log.html | default | `[data-testid="discard-confirm"]` (inside `discard-dialog`) | "Discard" | 238 | **411** |

The workout-log one is the worst of the set because it is a **destructive confirm button that
leaves its own dialog**. The dialog box is 24..369; the two-button row does not wrap, so at
200% "Discard" runs from 238 to 411 — 42 px outside the dialog and 18 px past the right edge
of the screen. At 100% it sits at 220..330, comfortably inside. Steps:
`workout-log.html` → `[data-testid="btn-discard"]` at `fontSize:32px`.

Notes:
* The `review.html` badge overflows in **every** state, not just one — it is on the standing
  "Coach note" card.
* The tab bar itself is clean at 200%: no `.tabbar__item` overflows or clips its label on any
  screen. That part of the float rework holds up.
* **125% is clean.** The whole matrix at `fontSize:20px` produced zero overflows
  (`scratchpad/big125.json` is `[]`). The breakage starts somewhere between 125% and 200%.

**Should** — a button label that cannot fit should wrap and let the capsule grow, or the
button should be allowed to shrink its type; `white-space: nowrap` on a full-width block
button buys nothing and costs the label.

**Repro script** `tests/agent-sweep2-big.mjs 32px` → `scratchpad/big200.json`

### 5. shopping.html: "Add to history" writes a purchase attributed to "Unknown store" when the store select is left at its prompt

**File** `08-build/shopping.html:573` (the select) and `1272-1283` (`save-purchase`).
**Selectors** `[data-testid="add-purchase"]`, `#p-name`, `#p-price`, `#p-qty`, `#p-store`,
`[data-testid="save-purchase"]`.

**Steps** — `shopping.html` → `[data-testid="seg-budget"]` → **Log a purchase** → type a name
and a price → leave the store select on its first option ("Select a store") → **Add to history**.

**Observed** — the purchase is written and the toast, the history row and the budget all read
**"Unknown store"** — a name that appears nowhere in the store list and that the user was
never offered. `save-purchase` validates `name` and `price` (`S.purchaseError`) but not
`store`; with `sel.value === ''` the lookup misses and falls through to the
`|| 'Unknown store'` default.

```
save-purchase with store="" -> history row "$20.00 at Unknown store"
```

**Should** — either treat the store as required (the option text says "Select a store", which
promises validation) or default it to the same "Other" the list already offers. The receipt
sheet gets this right: its empty option is *labelled* "Unknown store"
(`shopping.html:607`), so it never surprises anybody.

Everything else in the shopping write path is correct and was checked against the fixture:
clear-all and clear-done both write and both undo; merge is unit-aware and refuses to add
3 tsp to 2 lb; a logged purchase moves the week from $86.40 to $106.40 and the header from
"$34 left" to "$14 left"; deleting a history row moves it back and undo restores it;
confirming the receipt moves the week to $138.80 and correctly flips the card to
"$18.80 over budget"; Export now copies a real list and says how many items.

**Repro scripts** `tests/agent-sweep2-shopping.mjs`, `tests/agent-sweep2-shop2.mjs`

---

## Severity 3 — Medium

### 6. progress.html: all three new sheets have a primary button that does nothing

**File** `08-build/progress.html:645`, `679`, `713`.

| sheet | primary button | `data-action` | effect |
|---|---|---|---|
| Body weight (`weight-sheet`) | `[data-testid="weight-log"]` "Log today’s weight" | `close-sheet` | closes, writes nothing, no toast |
| Goals (`goals-sheet`) | `[data-testid="goals-add"]` "Add a goal" | `close-sheet` | closes, adds nothing |
| Log a record (`record-sheet`) | `[data-testid="rec-save"]` "Add to my records" | `close-sheet` | closes and **discards** whatever was typed into `#rec-lift`, `#rec-kg`, `#rec-reps` |

**Steps** — `progress.html` → `[data-testid="row-body-weight"]` → **Log today's weight**.
Observed: the sheet closes; the weight list, the trend line and the row above are byte-identical.
Then `[data-testid="log-record"]` → type 100 into `#rec-kg` → **Add to my records**: the sheet
closes, the record list is unchanged, and the typed value is gone.

**Should** — a sheet whose whole job is to add something either adds it or does not offer
the button. `rec-save` is the worst of the three because it takes typed input first.

**Repro script** `tests/agent-sweep2-progress.mjs`

### 7. fuel.html: eight controls across the five new sheets are decorative, three of them are not even wired

**File** `08-build/fuel.html`.

| selector | label | wiring | what happens |
|---|---|---|---|
| `[data-testid="cam-a1"]`, `cam-a2`, `cam-a3` | "None" / "A little" / "A lot" | **no `data-action` at all** | nothing, not even a pressed state — the sheet asks "Was there oil or sauce?" and cannot record the answer |
| `[data-testid="cam-confirm"]` | "Log it" | `data-action="close"` | closes; no meal added, kcal unchanged |
| `[data-testid="mic-confirm"]` | "Log both" | `data-action="close"` | closes; still 3 meal rows, hero still 1,410 kcal |
| `[data-testid="meal-delete"]` | "Remove this entry" | `data-action="close"` | closes; still 3 meal rows; **no confirmation and no undo on a destructive label** |
| `[data-testid="meal-edit"]`, `meal-swap` | "Change the portion", "It was something else" | `data-action="close"` | close only |
| `[data-testid="often-0…3"]` | the four "Meals you log often" rows, each with a chevron | `data-action="close"` | close only, though the sheet's own copy says "One tap logs it again with the same portion" |
| `[data-testid="chip-more"]` | "More" | `data-action="more"` — **no branch in the handler** | dead standalone (it does navigate in the assembled demo) |

**Steps** for the sharpest one — `fuel.html` → the camera FAB `[data-testid="log-cam"]` →
tap **A little**. Observed: `.sheet` outerHTML is byte-identical before and after.

**Should** — the three answer chips should at minimum take a selected state; the two confirm
buttons should log something; "Remove this entry" should either remove and offer undo, or
be a confirmation.

The five fuel sheets are otherwise in good shape: every one opens, is fully readable, has its
primary button in view, closes by Escape, by scrim and by its close button, and returns focus
to the control that opened it.

**Repro script** `tests/agent-sweep2-fuel.mjs`

### 8. Sheet geometry snaps 8 px sideways and grows rounded bottom corners the instant you touch the grabber

**File** `08-build/components.css:444-449`
(`.sheet[data-detents][style*="88%"] { left:0; right:0; bottom:0; border-radius: 22px 22px 0 0 }`).

**Steps** — `progress.html` → `[data-testid="choose-lift"]` (or `row-body-weight`) → press
the grab handle and move down 1 px.

**Observed** — the sheet is full-bleed at rest because `data-detent-open="0.88"` sets
`style="height:88%"`, which the substring selector matches. The first `pointermove` writes a
non-88 height, the selector stops matching, and in one frame the sheet jumps from
`left 0 / right 393 / bottom 852 / bottom-radius 0` to
`left 8 / right 385 / bottom 844 / bottom-radius 22px`.

```
open        {"style":"88%",       "l":0,"r":393,"bo":852,"rad":"0px"}
mid-drag    {"style":"64.5258%",  "l":8,"r":385,"bo":844,"rad":"22px"}   <- snap
settled low {"style":"55%",       "l":8,"r":385,"bo":844,"rad":"22px"}
settled hi  {"style":"88%",       "l":0,"r":393,"bo":852,"rad":"0px"}
```

**Should** — the width and corner change should be interpolated with the height, or the
full-bleed form should be selected by a class the drag maintains rather than by matching a
substring of the inline style. Keying layout off `style*="88%"` is also fragile in a second
way: any sheet whose inline style happens to contain the characters `88%` for any other
reason takes the full-bleed rules.

**Repro scripts** `tests/agent-sweep2-detent.mjs`, `tests/agent-sweep2-detent2.mjs`

### 9. exercise-library: the "Add to" sheet cannot be closed with Escape while the detail sheet is under it

**File** `08-build/exercise-library.html:727` (`sheet-days`), handler at `1059-1065`.
**Selector** `[data-testid="sheet-secondary"]` opens it; `[data-testid="sheet-days"]` is the sheet.

**Steps** — `exercise-library.html` → STATE → **Detail: logged lift** (presets 5-9, 11) →
press **Add to a training day** (`sheet-secondary`) → press Escape.

**Observed** — the `sheet-days` overlay is still on screen. The scrim closes it and the
`days-close` button closes it, so it is not a trap, but Escape — the one dismissal a keyboard
user reaches for — leaves it up. Every other sheet in the build closes on Escape.
This is the only `ESC-NOOP` in 941 recorded interactions.

**Should** — Escape should close the topmost overlay. The keydown handler does branch on
`S.days` first, so the failure is that the branch does not take effect while the parent detail
sheet is also open.

**Repro** `tests/agent-sweep2-clicks.json`, entries with `"kind":"ESC-NOOP"`.

### 10. Focus is dropped to `<body>` after 125 ordinary interactions, not only after a sheet closes

Round 1 recorded this for sheet and dialog dismissal (review-bugs §8). It is much wider than
that: **125 distinct controls** across twelve screens leave `document.activeElement` on
`<body>` after a plain tap, because the delegated handler re-renders and the clicked node is
replaced.

| screen | controls affected | examples |
|---|---|---|
| coach | 25 | `chat-suggest-0…2`, `chat-save-plan`, `chat-dismiss-plan`, `msg-retry`, `composer-send`, `setup-perms-on/off` |
| split-builder | 25 | `ex-remove-x17…x30`, `day-remove-d16/d21/d26`, `ai-accept`, `ai-regenerate`, `save-split` |
| exercise-library | 21 | every `row-group-*`, `sheet-close`, `sheet-primary`, `media-retry` |
| shopping | 16 | every `pick-*`, `add-meal-0…2`, `retry` |
| train / progress / profile / fuel / workout-log / home | 4-6 each | mostly `retry` and the inert `tab-*` |
| review | 5 | `ai-ask`, `split-update`, `split-keep`, `split-undo`, `action-retry-compare` |
| settings | 2 | `sync-now`, `retry-account` |

**Steps** — `split-builder.html` → tap any `[data-testid^="ex-remove-"]`. Observed:
`document.activeElement.tagName === 'BODY'`; the next Tab restarts at the top of the screen.

**Should** — after a re-render, focus should be restored to the equivalent node.
`progress.html` and `exercise-library.html` already do this for their sheets
(`render({ focus: … })`); the same mechanism is not applied to list interactions.

**Repro script** `tests/agent-sweep2-clicks.mjs` → `tests/agent-sweep2-clicks.json`, `"kind":"FOCUS-LOST"`.

---

## Severity 4 — Low

### 11. shopping.html: the "Clear what you picked up" dialog says "1 items"

**File** `08-build/shopping.html:1066-1073`.

**Steps** — `shopping.html` → untick every picked-up item, tick exactly one →
`[data-testid="clear-done"]`.

**Observed**
```
"Clear what you picked up
 1 picked-up items go. The 11 still to get stay where they are.
 [Clear 1 items] [Keep them]"
```
Two plural failures: the body sentence and the button label. The toast that follows gets it
right ("1 picked-up item cleared."), so the pluralisation exists in the file — it is just not
used in the dialog.

### 12. shopping.html: "Empty the list" offers a zero-count clause when everything is ticked

**File** `08-build/shopping.html:1067-1069`.

**Steps** — `shopping.html` → tick all twelve items → `[data-testid="clear-all"]`.

**Observed** — "All 12 items go, **including the 0 you have not picked up yet**. Your pantry
and your history are untouched." The clause exists to warn about unfinished shopping; with
nothing unfinished it should be dropped, not printed as a zero.

### 13. workout-log: the session title is clipped to nothing at 320 px and at 200% text

**File** `08-build/workout-log.html:321`, `[data-testid="session-name"]`.

**Steps** — `workout-log.html` at viewport width 320, or at 393 with `fontSize:32px`.

**Observed**

| condition | text | needed | given |
|---|---|---|---|
| 320 px | "PPL - Push" | 126 px | **74 px** |
| 200% text | "PPL - Push" | 253 px | **49 px** |

The `.sess` header packs an `h1`, a three-part meta line, an icon button and two capsule
buttons ("Discard", "Finish") into one row; at 393/100% it fits exactly (147 px, one line —
the round-1 orphan wrap is fixed), and it has no slack at all. At 200% the title is a 49 px
column showing roughly one and a half characters.

**Should** — the title should get the row to itself below a certain width, or the two
capsules should move.

### 14. settings.html and shopping.html: the header Back button is still dead

Round 1 reported both (review-bugs §4, §7). Re-verified this pass, unchanged:

* `settings.html:142` — `<button class="hdr__back" data-testid="back" aria-label="Back to Home">`
  has **no `data-action`**, and the file's handler is keyed on `data-action`.
* `shopping.html:46` — has `data-action="back"`, and the handler is
  `back: function () {}` (`shopping.html:1383`).

Both work in the assembled demo (`assemble.mjs` intercepts `[data-testid="back"]`), so this
is standalone-only — but the control is visible and enabled on both standalone screens.

### 15. progress.html: the empty state's only call to action is still dead

Round 1 reported this (review-bugs §5). Re-verified: `progress.html:567` renders
`<button data-action="start-workout" data-testid="empty-action">`, and the delegated handler
(`progress.html:815-846`) implements `range`, `open-picker`, `close-sheet`, `pick-lift`,
`open-weight`, `open-goals`, `log-record`, `retry` and `show-cached` — no `start-workout`
branch. Three new actions were added to that switch this round and this one was left out.

**Steps** — `progress.html` → STATE → **Empty** → press "Start a workout". Observed: the
document is byte-identical.

### 16. shopping.html: "Undo" after Clear-done restores the items in a different order

**File** `08-build/shopping.html:1205-1212` (`do-clear-done`), restore closure
`Array.prototype.push.apply(LIST, gone)`.

**Steps** — `shopping.html` → `[data-testid="clear-done"]` → **Clear 4 items** → **Undo**.

**Observed** — twelve rows come back, but the meat group now reads
`Salmon, Chicken breast, Ground beef` where it read `Chicken breast, Ground beef, Salmon`.
The cleared items are appended, not put back where they were. `remove` and `del-hist` both
splice back at the recorded index; this one does not.

### 17. shopping.html: two handlers are still empty functions

`'store-open': function () {}` (`shopping.html:1257`) and `back: function () {}`
(`shopping.html:1383`). `store-open` is unreachable from any of the four panels in any of the
four states, so it is a source-level finding; `back` is finding 14 above. Round 1's other
three empty handlers — `export`, `compare`, `find-swaps` — are all genuinely implemented now.

### 18. Assembled demo: the workout-log tab bar is the only one that never minimizes

**File** `08-build/workout-log.html` — its `<nav class="tabbar">` has no `data-minimize`
attribute, so `chrome.js:initTabBar` returns early.

**Steps** — demo `#/train/workout-log` (or the standalone screen) → scroll the log.

**Observed** — the bar stays at 784..840 through a 2429 px scroller. Every other screen with
a tab bar minimizes it and brings it back on reverse. On the screen with by far the longest
scroll and the most bottom-edge controls, the bar never gets out of the way.

Measured across the demo: `home`, `train`, `fuel`, `coach`, `profile`, `progress` and
`exercise-library` all carry `data-minimize`; `workout-log` does not. (`home`, `fuel`, `coach`
and `profile` simply have nothing to scroll at 393×852 in the demo, so they never trigger it
either — but they are wired.)

**Repro script** `tests/agent-sweep2-demochrome.mjs`

### 19. fuel.html: the four accessory chips come to rest under the floating tab bar on first paint

**File** `08-build/fuel.html:337` (`[data-testid="fuel-chips"]`).
**Selectors** `chip-trends`, `chip-water`, `chip-supps`, `chip-more`.

**Steps** — `fuel.html`, Populated, do not scroll.

**Observed** — the chip row sits at 807..851; the tab bar occupies 784..840, so all four chips
are behind it and `elementFromPoint` at each centre returns a `tabbar__item`. In the
"Session running" state the shelf takes the same place instead. Scrolling the page one notch
frees them (they move to 724..768), so nothing is permanently unreachable — this is the
intended "content scrolls under glass" — but the row is the screen's only navigation to four
of its sheets, and on first paint every one of them is hidden behind the bar.

**Should** — the first paint should either leave the chip row clear of the float, or the chips
should sit above the fold. This is the only place in the build where the whole of a control
group is under the floating bar at rest.

**Repro script** `tests/agent-sweep2-cover2.mjs`

---

## Verified fixed this pass (do not re-report)

* **coach tab bar off-screen in auto-scrolled chat states** — fixed. The bar sits at
  784-840 with `data-minimized:null` in presets 0, 2 and 4; `chrome.js` now gates the
  minimize on a real pointer/wheel/touch/key event.
* **split-builder name field deleting itself** — the field no longer exists in the default
  state; no keystroke-loss reproduced.
* **review Discard buttons hidden under the pinned Save bar** — the discard confirmation is
  now an inline `[data-testid="section-discard"]` with `action-discard-cancel` /
  `action-discard-confirm`, not an overlay; nothing is covered.
* **exercise-library group search placeholder cut off mid-word** — now
  "Search all 227, not just Chest", 251 px into 253 px of field. It fits, but with 2 px to
  spare; a longer group name will clip it again.
* **workout-log session title wrapping to an orphan** — one line at 393 px (147 px wide).
  It now fails by clipping instead, at 320 px and at 200% — see finding 13.
* **shopping Export / Compare / Find swaps** — all three write and report now.
* **fuel meal rows and the "Meals" link** — both open sheets now.
* **The body map** — works identically standalone and inside the demo: 632 paths, 17 hit
  groups, front/back toggle flips `aria-selected` both ways, a group tap navigates to that
  group in both. No finding.

## Categories checked that produced nothing

* **Uncaught page errors and console errors** — zero, across 13 screens × every dev state ×
  {320, 393, 430} px × {100%, 125%, 200%} text × {light, dark}, plus every sheet open/close
  cycle and the whole shopping write path.
* **NaN / undefined / null / empty required values in rendered text** — none, including
  progress's empty-range guards: every lift × every range (4w, 12w) renders a well-formed
  polyline with no `NaN` in the points attribute and no empty trend copy.
* **Horizontal overflow at 320, 393 and 430 px** — none at 100% text. The only sub-393
  findings are `.truncate` rows behaving as designed (exercise-library group subtitles) and
  finding 13.
* **125% browser text** — completely clean.
* **Select chevrons overlapping their value** — checked every `select.input` and
  `select.cell` on every screen and state: all carry the background chevron, and in no case
  does the measured option text exceed the field's content box. No overlap.
* **Capsule buttons clipping their label** — no `.btn` clips its label at 100% text on any
  screen. (The only flags were full-width `btn--block` labels, which span the button by
  design and centre their text.)
* **Dark theme** — no errors, no overflow, and the floating chrome keeps an opaque tint
  (`color(srgb 0.039 0.039 0.043 / 0.82)` behind a 20 px blur) on every screen.
* **Sheet dismissal and geometry** — 34 distinct sheets and dialogs were opened and measured
  (`tests/agent-sweep2-sheetgeo.mjs` → `scratchpad/sheetgeo.json`): 7 on fuel, 4 on progress,
  14 on settings, 2 on train, 6 on workout-log, 1 on split-builder, plus shopping's four.
  At the default text size **every one** is inset at `left 8 / right 385 / bottom 844` (or
  full-bleed at the 88% detent), has its `.sheet__foot` primary button fully in view and
  unobstructed, and has a scrim. Exactly one failed a close path (finding 9); there were
  **no dialog traps** — every overlay closes by at least two of {Escape, scrim, close button}.
  Focus returns to the opening control on every fuel and progress sheet tested.
  At 200% text the only geometry failure is the workout-log Discard dialog in finding 4;
  the long-list sheets (`lift-sheet`, `pick-sheet`, `sheet-meals`, `sheet-supps`,
  `addex-sheet`, `activity-sheet`, `split-sheet`, `sheet-body`) all overflow *inside*
  `.sheet__body`, which scrolls, so nothing is lost.
* **Assembled demo navigation** — all five tabs switch correctly and update the hash; all
  five push routes push, show "Back to <parent>", and return to the parent on
  `[data-testid="demo-back"]`; the demo index lists all thirteen screens. The only navigation
  defect is finding 1.
