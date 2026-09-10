# LOCKED redesign — browser-driven bug review

Target: `/home/user/everything-claude-code/redesign/08-build/` (13 screens + `tokens.css`,
`components.css`, `app.js`, `chrome.js`, `bodymap.js`), opened from `file://` in
Chromium via Playwright 1.56.1 at 402x874 (and 320x844 for the overflow pass).

Harness scripts (all under `/home/user/everything-claude-code/redesign/tests/`):

| script | what it does |
|---|---|
| `agent-bug-recon.mjs` | loads every screen, dumps dev states + testids + load errors |
| `agent-bug-states.mjs` | cycles every `.dev__item` state, checks errors / bad text / empty lists / overflow / dev aria |
| `agent-bug-clicks.mjs` | **main sweep** — for every dev state x every visible `[data-testid]` control: fresh load, set state, click, then diff DOM, URL, focus, aria, overflow, bad text, and test Escape/scrim/close on anything that opened |
| `agent-bug-typing.mjs` | types into every visible input/textarea in every state; checks value, focus and caret survive the re-render |
| `agent-bug-overflow2.mjs` | every screen x state at 320px and 402px; document overflow + any element escaping the `.screen` box |
| `agent-bug-axe.mjs`, `agent-bug-axe1.mjs` | axe-core violations per screen/state |
| `agent-bug-blocked.mjs`, `agent-bug-noop.mjs` | triage passes over the sweep's CLICK-BLOCKED / NO-OP hits |
| `agent-bug-splitname.mjs`, `agent-bug-tabbar.mjs`, `agent-bug-occl.mjs`, `agent-bug-focus*.mjs`, `agent-bug-padscrim.mjs`, `agent-bug-exdays.mjs`, `agent-bug-bodymap.mjs` | isolated reproductions of the findings below |

Raw sweep output: `agent-bug-clicks.json` (~1,100 raw hits before triage),
`agent-bug-clicks.progress`, `agent-bug-typing.log`, `agent-bug-blocked.log`,
`agent-bug-noop.log`.

Coverage: 13 screens x 101 dev states, ~1,900 isolated control clicks (fresh page load +
state set before every click), every visible input typed into in every state, every overlay
that opened tested against Escape / scrim / close button.

---

## Findings, most severe first

### 1. `split-builder.html` — naming a new split is impossible: the field deletes itself after the first keystroke
**Severity: critical.** File `08-build/split-builder.html`, selector `[data-testid="split-name"]`.

Steps
1. Open `split-builder.html`.
2. STATE chip -> **Manual · empty** (`[data-testid="dev-preset-0"]`).
3. Click the *Split name* field and type `Push`.

Observed (`tests/agent-bug-splitname.mjs`):
```
name field present: 1
typed "P" -> {"present":false,"val":null,"focus":"BODY#"}
typed "u" -> {"present":false,"val":null,"focus":"BODY#"}
typed "s" -> {"present":false,"val":null,"focus":"BODY#"}
typed "h" -> {"present":false,"val":null,"focus":"BODY#"}
```
The input is removed from the DOM on the first keystroke, focus falls to `<body>`, and every
further character is dropped. The split is left named `P`, and the only way back to the field
is the *Edit* affordance, which is itself covered by the STATE chip (finding 9).

Cause: the header block is rendered only while the split is unnamed —
`var head = (m.edit || !m.name.trim()) ? <field> : '';` (split-builder.html:372). The `input`
handler `'split-name'` (line 929) sets `S.manual.name`, calls `markDirty()` and `patch()`;
`patch()` (line 936-939) sees `S.manual.dirty && !document.querySelector('.hdr .dot')` and
falls through to a full `render()` — which no longer emits the field.

Should: the field stays mounted (and focused, with the caret intact) for as long as the user
is typing in it. This is the same class of problem `app.js` LKPatch was written to prevent —
here the markup itself stops describing the node, so LKPatch correctly removes it.

### 2. `coach.html` — the tab bar starts off-screen and untappable in every auto-scrolled chat state
**Severity: high.** Files `08-build/coach.html` + `08-build/chrome.js` + `components.css:1696`.
Selectors `[data-testid="tab-home"]`, `tab-train`, `tab-fuel`, `tab-coach`, `tab-profile`.

Steps
1. Open `coach.html`.
2. STATE chip -> **Chat / thinking** (`dev-preset-2`). Same in **Chat / error** (`dev-preset-3`)
   and **Chat / plan offered** (`dev-preset-5`).
3. Without scrolling, try to tap any tab.

Observed (`tests/agent-bug-tabbar.mjs`, `tests/agent-bug-coachtabs.mjs`):
```
on load   {"min":"true","y":874,"scrollTop":239,"sh":895,"ch":656}
after up  {"min":"false","y":818,...}
coach dev-preset-3 {"min":"true","y":874,"scrollTop":215,...}
coach dev-preset-5 {"min":"true","y":874,"scrollTop":409,...}
```
`.tabbar` carries `data-minimized="true"` before any user gesture; in an 874px viewport its
top edge is at y=874, i.e. entirely below the fold, and `.tabbar[data-minimized="true"]` sets
`opacity: 0; pointer-events: none`. All five tab clicks time out. The app's whole primary
navigation is gone on arrival; it only returns after scrolling the chat back up.

Cause: `chrome.js` `initTabBar` starts `last = 0` and treats the screen's own scroll-to-latest
as a downward user scroll, so `down && y > 64` fires on load.

Should: a programmatic scroll performed during render must not minimize the bar, and no screen
should open with its tab bar hidden.

### 3. Three screens have no wired controls at all
**Severity: high** (as a prototype-completeness defect — the other ten screens are fully wired,
so this reads as unfinished rather than intentional).

Verified by clicking each control on a fresh load and diffing the whole document
(`tests/agent-bug-noop.mjs` -> `tests/agent-bug-noop.log`; every entry below is a real
"clicked it, nothing anywhere in the DOM changed, URL unchanged").

* `home.html` — has **no application click listener at all** (the only `addEventListener('click')`
  calls in the file are the dev menu's, lines 431/436). Dead: `primary-action`,
  `action-choose-session`, `row-last-session`, `row-climbing-lift`, `shelf-resume`,
  `open-account`, and all five `tab-*`.
* `profile.html` — the delegated handler (line 331) only implements `retry`. Dead:
  `open-settings` (`data-action="settings"`), `signup`, `start-first` (`data-action="start"`),
  and all five `tab-*`.
* `fuel.html` — the delegated handler (line 438-445) only implements `mic`, `cam`, `close`,
  `retry`. Dead: `open-meals` (`data-action="meals"`), `meal-0`, `meal-1`, `meal-2`
  (`data-action="meal"`), `shelf-resume` (`data-action="resume"`), and all five `tab-*`.

The tab bar is inert on **all thirteen** screens (`tab-home`, `tab-train`, `tab-fuel`,
`tab-coach`, `tab-profile` have no `data-action` and no handler anywhere). If that is deliberate
for a screen-by-screen prototype, the tabs should at least not present as enabled buttons.

### 4. `shopping.html` — five controls are bound to handlers that do nothing
**Severity: medium.** File `08-build/shopping.html`.

| testid | handler | line |
|---|---|---|
| `back` (header, `aria-label="Back to Fuel"`) | `back: function () {}` | 1210 |
| `export` ("Export") | `export: function () { S.sheet = null; }` — no sheet is open, so it is a no-op | 1124 |
| `compare` ("Compare", Budget panel) | `compare: function () {}` | 1139 |
| `find-swaps` ("Find swaps", Budget panel) | `'find-swaps': function () {}` | 1139 |
| `store-open` | `'store-open': function () {}` | 1125 |

Steps for `export`: `shopping.html` -> STATE -> **Populated** -> press **Export**. Observed: the
document is byte-identical before and after. Should: open the export sheet (or be removed).

Steps for the Budget pair (`tests/agent-bug-shopbudget.mjs`, `tests/agent-bug-swaps.mjs`):
`shopping.html` -> `[data-testid="seg-budget"]` -> press **Compare** (with or without text in
`cmp-input`) or **Find swaps**. Observed: `compare` leaves the document byte-identical;
`find-swaps` leaves `[data-testid="swaps-card"]` byte-identical (the only whole-document delta
is the tab bar minimizing because the click scrolled the panel). `store-open` is not reachable
from any of the four panels in the swept states, so it is a source-level finding only.

### 5. `progress.html` — the empty state's only call to action is dead
**Severity: medium.** `[data-testid="empty-action"]` (`data-action="start-workout"`,
progress.html:538).

Steps: `progress.html` -> STATE -> **Empty** -> press **Start a workout**. Observed: nothing
changes. Cause: the delegated click handler (progress.html:661-686) implements `range`,
`open-picker`, `close-sheet`, `pick-lift`, `retry` and `show-cached` only — `start-workout` has
no branch. Should: the empty state's single button does something.

### 6. `shopping.html` — in the Empty state, adding an item can never show a result
**Severity: medium.** `[data-testid="add-meal-0"]`, `add-meal-1`, `add-meal-2`,
`pick-chicken-breast`, `pick-eggs`.

Steps: `shopping.html` -> STATE -> **Empty** -> press any *Add* / suggested-item button.
Observed: no DOM change at all; the screen keeps saying the list is empty.

Cause: `bodyHTML()` (shopping.html:931-944) implements the empty state by emptying `LIST`,
`PANTRY` and `MYSTORES` for the duration of the render and restoring them afterwards. The
`pick` / `add-meal` handlers push into `LIST`, but the very next render throws that away again.
Should: adding from the empty state leaves the empty state.

### 7. `settings.html` — the header Back button is dead
**Severity: medium.** `[data-testid="back"]` (settings.html:142). The element has no
`data-action`, and the file's delegated handler is keyed on `data-action`, so nothing runs.
Same shape as shopping's `back`. Steps: `settings.html` -> press the back chevron. Observed:
nothing. Should: return to Home (its own `aria-label` says "Back to Home").

### 8. Focus is dropped to `<body>` when a sheet or dialog is dismissed
**Severity: medium** (keyboard/VoiceOver: after any of these the next Tab restarts at the top of
the document). 138 raw hits in the sweep; the reproducible ones:

* `workout-log.html` — `[data-testid="pad-cancel"]` and `[data-testid="pad-done"]`.
  Steps: open `workout-log.html`, press `[data-testid="cell-0-3-weight"]` (focus moves to that
  cell), then Cancel or Done. Observed: `document.activeElement` is `BODY` even though
  `cell-0-3-weight` is still in the DOM. Should: focus returns to the cell that opened the pad.
* `split-builder.html` — the leave dialog never receives focus in the first place.
  Steps: STATE -> **Manual · leave prompt** (`dev-preset-5`). Observed: `activeElement` is
  `BODY` while a `role="dialog" aria-modal="true"` is on screen, and it is still `BODY` after
  `[data-testid="leave-cancel"]`. There is no focus trap either. Should: focus moves into the
  dialog on open and back to the trigger on close.
* `review.html` — `[data-testid="action-save"]`, `action-discard`, `ai-ask`. Steps: open
  `review.html`, press **Save**. Observed: the button survives the re-render (same DOM node)
  but is set `disabled`, which blurs it, and nothing re-homes focus.

The same codebase already does this correctly twice, which is what makes it a bug rather than a
scope decision: `exercise-library.html` returns focus to `row-ex-101` after `sheet-close`, and
`progress.html` returns it to `choose-lift` (`closeSheet(refocus)`, progress.html:653-659).

### 9. The dev STATE chip sits on top of a real header control on four screens
**Severity: low** (the chip itself is intentional; its *placement* is what makes four shipped
controls untappable in the prototype). Measured with `document.elementFromPoint` at each
control's centre — `tests/agent-bug-occl.mjs`:

```
coach          covered by STATE chip: action-new-chat
home           covered by STATE chip: open-account
split-builder  covered by STATE chip: edit-toggle
workout-log    covered by STATE chip: btn-finish
```
A real click on any of these hits `button.dev__toggle#dev-toggle` instead (Playwright reports
`locator.click: Timeout` on all four). `workout-log`'s `btn-finish` is the button that ends a
session, and `split-builder`'s `edit-toggle` is the only route back to the name field broken in
finding 1.

### 10. `onboarding.html` — "Terms and privacy" navigates to the screen it is already on
**Severity: low.** `[data-testid="welcome-legal"]` (onboarding.html:133). The handler is
`case 'welcome-legal': go('welcome'); break;` (line 964) — the welcome screen is already
showing, so the button is a visible no-op. Should: open the legal screen, or be removed.

### 11. `split-builder.html` — the leave dialog's scrim is inert while every other scrim closes
**Severity: low.** `split-builder.html:668` renders `<div class="scrim" data-testid="scrim">`
with **no** `data-action`, unlike the pick sheet (line 620) and swap sheet (line 645), which
both carry `data-action="close-modal"`.

Steps: STATE -> **Manual · leave prompt** -> click the dark area above the dialog. Observed:
nothing happens (Escape and *Keep editing* both work). If tap-outside is deliberately disabled
for this destructive confirmation, fine — but it is the only scrim in the file that behaves
differently, and there is no comment saying so.

---

## Categories checked that produced nothing

* **Uncaught page errors / console errors / console warnings** — none. Zero across 13 screens x
  101 dev states and ~1,900 clicks (`agent-bug-clicks.json` contains no `ERROR` records; the
  recon pass reported `errs 0` for every screen on load).
* **`NaN` / `undefined` / `null` / `[object Object]` / empty required field** — none, in any
  state or after any click (`BADTEXT`: 0).
* **A form input whose typed value is discarded by the next re-render** — none.
  `agent-bug-typing.mjs` typed into every visible input and textarea in every state on all 13
  screens and checked value, focus and caret afterwards; the only failure was the split-name
  field-removal already filed as finding 1. LKPatch's value/caret preservation holds everywhere
  else. (Two `TYPE-FAIL` entries in `agent-bug-typing.log` are `exercise-library` presets 14/15,
  where `search-input` is deliberately `disabled` in Loading and Error — not a bug.)
* **A sheet or dialog that opens but cannot be closed** — none. `DIALOG-TRAP`: 0. Every overlay
  closed via Escape, its scrim, or its close button. The six `ESC-NOOP` records against
  `exercise-library` `sheet-secondary` are a false positive in the detector (the days sheet
  *replaces* the detail sheet, so the count of open dialogs stays at 1); verified by hand in
  `tests/agent-bug-exdays.mjs` that Escape closes the days sheet and returns to the detail sheet,
  and a second Escape closes that.
* **A list that renders zero rows in a state that should have rows** — none.
* **Horizontal overflow** — none. `document.scrollingElement.scrollWidth` never exceeded
  `clientWidth`, and no element escaped the `.screen` box, at either 320px or 402px, in any
  state (`agent-bug-overflow2.mjs`, zero output).
* **`aria-expanded` / `aria-pressed` / `aria-selected` / `aria-checked` that never changes** —
  none. All 17 raw `ARIA-STUCK` hits are clicks on the item that was already active
  (`coach` `seg-chat`/`seg-plan`/`seg-setup`, `exercise-library` `filter-all`,
  `coach` `setup-style-direct`). Cross-checked in `tests/agent-bug-seg.mjs`: the coach segmented
  control and the library filter chips both flip `aria-selected` / `aria-pressed` correctly.
* **axe-core violations** — none, on any screen or state (`agent-bug-axe.mjs` produced no output;
  spot-confirmed `0 violations` for home, workout-log, settings and coach in
  `agent-bug-axe1.mjs`). Colour-contrast results are unreliable on `file://` for the documented
  CORS reason.
* **Body map** (`bodymap.js`, exercise-library) — works: the Body/List toggle mounts the map,
  Front/Back flips `aria-selected` on both tabs, and the muscle regions carry proper
  `aria-label`s ("Chest, 10 exercises", ...). Note that no dev preset shows the map, so the dev
  menu alone never exercises it.
