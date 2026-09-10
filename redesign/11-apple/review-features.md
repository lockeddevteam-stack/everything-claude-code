# Feature review — does every listed action actually do something, and did the
# two rebuilt screens keep what the live app had


## Verdict in one table

| | count | |
|---|---|---|
| Manifest actions with **no handler at all** | 10 | `profile.html` ×3, `fuel.html` ×1, `home.html` ×1, `shopping.html` ×3, `progress.html` ×1, `workout-log.html` ×1 |
| Controls that **move but do not do their job** | 9 groups | all in `shopping.html`: both clear confirmations, all three merge buttons, save-purchase, receipt-save, three history ranges, find-swaps, both store-search paths |
| Capabilities in `ShoppingTab`/`PantryTab`/`MyStoresTab`/`BudgetTab` with **no path at all** in `shopping.html` | 5 | export, store search, budget writes, clearing, merging |
| Capabilities in `ProfileScreen` with **no path at all** in `profile.html` | 2 | open Settings, create an account (both of its only two interactions) |
| **State-content leaks** between the fuel / profile / shopping states or the shopping panels | 0 | verified both by URL entry and by dev-menu switching |
| Manifest entries that **disappeared** | 2 | `mockup-bodymap.html` (whole screen), `shopping.html` `pan-interval` |

The redesign did not drop screens or sections. What it dropped is wiring: on the
two rebuilt screens the *shape* of every live-app capability survives, and a
third of the write paths do not reach the data.

Scope: `08-build/` driven from `file://` with Playwright 1.56.1 (Chromium at
`/opt/pw-browsers`). Scripts are in `redesign/tests/agent-feat-*.mjs`:

| script | what it does |
|---|---|
| `agent-feat-drive.mjs` | for each screen and each dev state / panel, loads fresh and clicks every visible `[data-action]` element by a stable `[data-action][data-testid]` + occurrence selector, comparing a hash of `documentElement.innerHTML` + `location.href` + `localStorage` before and after |
| `agent-feat-shopping.mjs` | drives every shopping control by testid, one fresh load per control |
| `agent-feat-shop2.mjs` | counts rows before/after the destructive and write actions, so "the sheet closed" is not mistaken for "the thing happened" |
| `agent-feat-states.mjs` | renders each state via `?state=` and again via the dev menu, diffing testid sets for leakage |
| `agent-feat-presets.mjs` / `agent-feat-presets2.mjs` | the same sweep for the screens whose dev menu uses `data-preset` (coach, exercise-library) or has no `?state=` support (workout-log) |
| `agent-feat-split*.mjs`, `agent-feat-exlib*.mjs`, `agent-feat-wl*.mjs`, `agent-feat-fuel.mjs`, `agent-feat-progress.mjs`, `agent-feat-profile2.mjs`, `agent-feat-keys.mjs`, `agent-feat-shop3.mjs`, `agent-feat-final.mjs` | per-screen confirmation of anything the sweep flagged, including popup and `navigator.share` / clipboard interception |

Everything below was confirmed by a second, targeted run. Sweep artifacts are
not listed as findings: an index-drift bug in the first pass, clicks on the
option that is already selected, `?state=` entries on the three screens whose
dev menu uses `data-preset` or has no URL support at all (`coach.html`,
`exercise-library.html`, `workout-log.html` — swept separately with
`agent-feat-presets*.mjs`), and clicks on the already-active segment of a
control the sweep reaches once per panel.

---

## A. Manifest actions that do nothing

### Dead: no handler at all

| Screen | Action | Element | Evidence | Severity |
|---|---|---|---|---|
| `profile.html` | `settings` | `open-settings` (identity row, and again in the error state) | the file's only click handler is `if (getAttribute('data-action') === 'retry')` — line 332-338. Clicking leaves the page byte-identical. | **High** — this is the screen's one documented exit ("SETTINGS IS A PUSH, NOT A PANEL") and it does not push. |
| `profile.html` | `signup` | `signup` (guest state) | same handler; no change. Live `ProfileScreen` calls `window.LOCKED.upgradeFromGuest()`. | **High** — the guest banner's whole purpose. |
| `profile.html` | `start` | `start-first` (new state) | same handler; no change. | Medium |
| `fuel.html` | `resume` | `shelf-resume` (live state) | the click handler (line 612-628) has branches for `mic/cam/meal/meals/water-*/supp/close/retry` and none for `resume`. | Medium — the shelf exists *specifically* so a session is not lost; its comment says so. |
| `home.html` | `resume` | `shelf-resume` | `home.html` has no `[data-action]` click listener at all; the only listeners are the dev toggle and dev menu. | Medium — same shelf, same reason. |
| `shopping.html` | `export` | `export` | handler is `export: function () { S.sheet = null; }` and `S.sheet` is already null. No DOM/clipboard/share change. Live `ShoppingTab.exportList()` builds the list text and calls `navigator.share` or `clipboard.writeText`. | Medium |
| `shopping.html` | `compare` | `compare` | handler is `compare: function () {}`. Typing in `cmp-input` and pressing Compare changes nothing; the three comparison rows are static seed data that were already on screen. | Medium |
| `shopping.html` | `back` | `back` | handler is `back: function () {}`. | Low — standalone mockup, nothing to go back to. |
| `progress.html` | `start-workout` | `empty-action` | the click handler covers `range / open-picker / close-sheet / pick-lift / open-weight / open-goals / log-record / retry / show-cached` and not `start-workout`. | Medium |
| `workout-log.html` | `addex-q` | `addex-search` | the "Search all exercises" field in the add-exercise sheet. There is no `case 'addex-q'` in the click switch (`:841-1000`) and the `input` listener only matches `[data-act="note"]` (`:1004`). Typing `zzzqqq` leaves all 6 rows and the DOM unchanged. | Medium — a search box that is only a picture. |

`shopping.html` also declares `store-open`, which is `function () {}`, but it is
not attached to any element, so it is dead code rather than a dead control.

### Wired but inert: the control moves, the feature does not happen

These are worse than a missing handler, because the screen acknowledges the tap.
All were confirmed by counting rows, not by diffing markup.

| Screen | Control | What happens | What should happen | Severity |
|---|---|---|---|---|
| `shopping.html` | `confirm-clear-done` | dialog closes, **12 items and 3 ticked items remain** | clears the ticked items | **High** |
| `shopping.html` | `confirm-clear-all` | dialog closes, **12 items remain** | empties the list | **High** |
| `shopping.html` | `merge-do` ("Make it 3 lb") | sheet closes, list still 12 rows, "Chicken breast" still reads `2 lb` | merges the quantity | **High** |
| `shopping.html` | `merge-sep` ("Keep them separate") | identical to `merge-do` — same −1158 char delta, list still 12 rows | adds a second row | **High** |
| `shopping.html` | `save-purchase` ("Add to history") | form closes; history stays 3 entries, week spend stays `$86.40` | appends the purchase | **High** |
| `shopping.html` | `receipt-save` ("Confirm and save") | receipt card closes; history stays 3, spend stays `$86.40` — byte-identical outcome to `receipt-cancel` | appends the receipt | **High** |
| `shopping.html` | `hist-week` / `hist-month` / `hist-all` | only `aria-selected` moves (a 21-char delta); the row set is **3 / 3 / 3** | filter by range. Only `hist-receipts` filters (3 → 1). | Medium |
| `shopping.html` | `find-swaps` | 21-char delta (button press state); the swaps list is static seed data | Low-Medium |
| `shopping.html` | `sa-<store>` (Shop at sheet) and `find-<store>` (item sheet) | all carry `data-action="close"`, so picking a shop just closes the sheet | live `openAllAtStore` opens a store search per item | Medium — see part B |

The merge sheet is also hardcoded: it always says *"Chicken breast is already on
the list … 2 lb … would make it 3 lb"* regardless of what was typed.

### Clean screens

Driven to exhaustion with no dead action found:

- `coach.html` — 17 dev presets, every action reached and observable except
  `iv-use` and `iv-edit-first` (three levels into the interview flow; both have
  handlers at `:1050` and `:1060`) and `instr` / `iv-free`, which are
  `<textarea>` inputs wired to the `input` listener.
- `exercise-library.html` — 16 presets. `save-custom` and `scope-all` needed a
  targeted run (`agent-feat-exlib*.mjs`); `save-custom` fires from the create
  sheet, and `scope-all` renders only when a within-group search has fewer
  results than the same query across the whole catalogue — searching "pull"
  inside the Back group produces it, and it works. `cname` / `cgroup` / `csub`
  are inputs.
- `split-builder.html` — 11 presets, all `ai-*` plus `pick-add` and `choose`
  driven and observable.
- `workout-log.html` — 9 dev states, 25 of 38 actions driven and observable in
  one pass and the rest reached by the depth-2 sweep
  (`agent-feat-presets2.mjs`), which found no dead click action. Every declared
  action except `addex-q` has a matching `case` in the switch at `:841`, and
  `note` is the input handler at `:1004`. `rir` is a set of `<input>` radios.
  Only `addex-q` is dead (above).
- `train.html`, `settings.html`, `review.html`, `onboarding.html` — nothing dead.

### Correct, but silent

`shopping.html` `pan-add` and `add-custom` return early when their required
fields are empty (`if (!n) return;`), which is exactly what live `PantryTab` and
`MyStoresTab` do. Verified: pantry 7 → 7 rows, stores 3 → 3 with the fields
blank; both add correctly once filled. The gap is that neither says why — no
message, no field error, and the sweep flagged them as dead for the same reason
a user would think they were. Not a lost feature; a missing explanation.

### Not driven, but a handler exists — not a loss

- `coach.html` `instr`, `split-builder.html` `split-name` / `day-name` /
  `ai-note` / `pick-search`: these are `data-act` on `<input>` / `<textarea>`
  and are wired to the `input` listener (`coach.html:1252`,
  `split-builder.html:985-990`). A click on them correctly does nothing.
  `pick-search` typing was driven and works.
- `split-builder.html` `lift-clear` and `toast-action`: handlers exist
  (`:901`, `:927`) but the elements only render during a grip-lift drag and
  while an undo toast is up. Neither renders from any of the 11 dev presets.
- `split-builder.html` `pick-add`, `choose`, and every `ai-*` action were
  driven from the dev presets and all produce change.
- Segmented / radio controls flagged "inert" by the sweep — `train.html`
  `filter-all`, `progress.html` `range-12w` and `record-111`, `settings.html`
  `seg-sex-female` and `seg-goal-build`, `coach.html` `seg-chat` — are simply
  the option that is already selected. Not findings.

### Tab bar

Every screen's five `tabbar__item` buttons (`tab-home` … `tab-profile`) are
inert on every screen; there is no navigation code in `chrome.js` or `app.js`.
This is consistent across all 13 screens and reads as deliberate for isolated
mockups, but it means no testid-level press test of the tab bar can pass.

---

## B. shopping.html against ShoppingTab / PantryTab / MyStoresTab / BudgetTab

Read from `/home/user/locked/index.html`: `ShoppingTab` 42722, `PantryTab`
43880, `BudgetTab` 44276, `MyStoresTab` 42381, wrapper `ShoppingBudgetTab`
46270.

### Kept, and works

`ShoppingTab` — fitness-pick quick add; the empty state with the three
"suggested meals to prep" and their **Add all**; category grouping over the same
six buckets with the same keyword table; per-item tick with the same two aria
labels; remove; the quantity field; the unit select over the same eight units;
the two-character autocomplete with startsWith-before-contains ordering; the
duplicate-detection prompt; Enter-to-add on the name field.

`PantryTab` — add with name + qty; the All / Staples filter with counts; out of
stock ⇄ restocked, and out-of-stock pushing the item onto the shopping list (and
restocking pulling it off); mark/unmark staple; the restock-interval field with
the same 1–365 validation (typing 900 shows the error); remove.

`MyStoresTab` — quick-add preset chips filtered to unsaved; the store list with
initial, name, description-or-host; on/off toggle; delete; the custom form's
three fields and its add.

`BudgetTab` — weekly target with edit/cancel/save and the ≥0 rule; this-month
and purchase-count tiles; the log-purchase form with item/price/qty/store;
camera and library receipt entry; the confirm-receipt card with a store select,
the itemised lines and the total; the price-comparison field with a Best marker;
the cheaper-swaps section; the history list with delete.

`ShoppingBudgetTab` — the four-way segmented control and the header status pill
(items to get / left / over).

### Lost — no path at all

1. **Export the list.** `ShoppingTab.exportList()` shares or copies the list;
   `shopping.html`'s `export` handler is a no-op. There is no other way to get
   the list off the screen. *Not built.*
2. **Search a shop for an item.** Live does this twice — a store chip under
   every unchecked row (`window.open(buildStoreSearchUrl(...))`) and
   `openAllAtStore`, which opens the first ten unchecked items at one store, one
   tab every 350 ms. The rebuild has the UI for both (the item sheet's
   "Search for it" rows, the "Shop at" sheet whose own copy promises *"Opens a
   search for each of your first ten unchecked items"*) but every row is
   `data-action="close"`. *Built, then not wired.* This is the reason My Stores
   exists, so the whole Stores panel currently has no payoff.
3. **Persisting anything you log in Budget.** Live `addPurchase` and
   `confirmReceipt` write to `budgetData.history`. Neither rebuild path adds a
   row. *Built, then not wired.*
4. **Clearing the list.** Live's `clearDone` / `clearShoppingList` (double-tap
   confirm) actually clear. The rebuild's confirmation dialog — a genuinely
   better pattern — does not. *Built, then not wired.*
5. **Merging a duplicate.** Live offers Merge / Add Separate / Cancel with
   distinct outcomes, and a units-differ variant with only two. The rebuild's
   three buttons are the same `close`. *Built, then not wired.*
6. **Store product search inside the item suggestions.** Live debounces a POST
   per enabled store and splits the dropdown into STORE PRODUCTS and
   SUGGESTIONS. The rebuild suggests only from its local `PICKS` table. *Not
   built* — consistent with the prototype having no network anywhere, so this is
   scope rather than regression.
7. **Real receipt OCR and real price/swap lookups.** Same category: the rebuild
   models the outcomes (`ok` / `none` / `down` and a canned result set) but not
   the calls. *Not built, by scope.*
8. **Enter to add in the Pantry.** Live's pantry name input submits on Enter
   (`onKeyDown`); `shopping.html`'s keydown handler only covers `add-name`.
   Confirmed: pantry rows 7 → 7. *Small regression.* One extra tap on **Add**
   still works, so this is a papercut, not a lost capability.

### Rebuilt differently — reachable, not lost

- Per-item store chips moved from the row into the item sheet — one extra tap,
  and the file argues for it in a comment. Fine.
- Picks already on the list are hidden instead of greyed out. Fine.
- Live's two-tap "tap again to confirm" became a named dialog. Better; it just
  needs to work.
- Live's pantry "Got it ✓" toast became the persistent out-of-stock banner.
- The custom-store form is always open instead of behind Add / Cancel.
- The pantry's per-row star / cart / cross became one sheet behind the row, and
  the interval editor is now always visible in that sheet instead of behind its
  own tap. That is why the manifest's `pan-interval` action is gone — the
  capability survives, the verb does not.
- History gained a **Receipts** filter that live did not have.
- `BudgetTab.importCheckedItems` is not in the rebuild; it is also unreferenced
  dead code in the live app, so nothing was lost.

---

## C. profile.html against ProfileScreen (line 30225)

`ProfileScreen`'s complete surface: guest banner (heading, body, SIGN UP →
`upgradeFromGuest`); avatar initial, display name, @username; a Settings button
→ `go("settings")`; four stat tiles (Workouts, PRs, Total Sets, Volume); a badge
section with seven earned tiers, three locked tiers showing "N more to go", and
an empty line; a Personal Records list with trophy, lift name, muscle and weight
in the user's unit.

Everything is present in `profile.html`, and the badge model is richer (ten
tiers instead of seven earned + three locked, each with its threshold written
next to it). Nothing is missing from the render.

**What is lost is not content but the two things the screen can do**: the
Settings row and the guest banner's Create-an-account button are both dead
(section A). Those are `ProfileScreen`'s only two interactions, so the rebuild
keeps 100% of the record and 0% of the behaviour.

Differences that are not losses: the stat tiles are relabelled
(Workouts→Sessions, PRs→Records, Total Sets→Sets); records are capped at six
with an "N in all" count and the rest deferred to the exercise's own history;
badges are behind a setting and so only render in the `badges` state; three
states (`new`, `loading`, `error`) are additions the live screen had no
equivalent for.

---

## D. Cross-screen state and panel switching

`agent-feat-states.mjs` rendered each state twice — once via `?state=`, once by
switching from `populated` through the dev menu — and compared the testid sets.

**No leakage anywhere.** In `shopping.html` (populated / empty / loading /
error) the two paths are byte-identical. In `fuel.html` (7 states) and
`profile.html` (6 states) the two paths differ by a constant 61 characters,
which is an inline `transform: scale(1); opacity: 1` the large-title chrome
leaves on `[data-title-large]` on the fresh-load path; the testid sets are
identical, with nothing extra and nothing missing.

Each state renders its own content:

- `fuel.html` — `populated` 8239 / `first-weeks` 8197 (adds the DAY 3 OF 14
  banner and the "starting formula" caveat) / `hidden` 7691 (swaps every figure
  for the "On track" summary) / `live` 8663 (adds the shelf into `#shelf-slot`,
  which is outside `#body`) / `empty` 4444 / `loading` 3354 / `error` 3638. The
  first sweep called `live` a duplicate of `populated`; that was measuring
  `#body` only and was wrong.
- `profile.html` — 6467 / 9179 (badges) / 6935 (guest banner, and the identity
  row flips to "On this phone only") / 5234 (zeroed figures, empty block) /
  2881 / 3409.
- `shopping.html` — 16237 / 9114 / 3268 / 3515.

The four-panel segmented control switches cleanly: clicking `seg-list`,
`seg-pantry`, `seg-stores`, `seg-budget` in sequence gives exactly one
`aria-selected="true"`, and the first testids under `#body` are respectively
`list-summary…`, `out-banner / pan-all / pan-staples…`, `presets /
preset-amazon-com…`, `budget-card / edit-target…`. No panel's content survives
into the next.

One inconsistency in the Budget panel's segmented control: `hist-budget`'s
`aria-selected` moves for Week / Month / All but the rows do not change (part A).

---

## E. Freeze-manifest drift

`python3 11-apple/gen-manifest.py` against the current tree:

**Lost:**
1. `mockup-bodymap.html` is **gone from `08-build/`**. The manifest still lists
   it with 2 actions (`back`, `open`) and 2 testids. It was untracked, so git
   shows no deletion.
2. `shopping.html` no longer has `pan-interval`. The capability survives (the
   interval editor is now always rendered in the pantry sheet); the verb is
   replaced by `pan-open`.

**Gained** (not losses, but the freeze diff is not clean): `fuel.html` +3
actions (`supp`, `water-add`, `water-sub`) and +19 testids; `progress.html` +14
testids; `shopping.html` + `undo`, `pan-open`, +7 testids.

Note: `08-build/shopping.html`, `settings.html`, `review.html` and `chrome.js`
were being edited by another session while this review ran, so the counts are a
snapshot.

---

## F. What to fix first

1. `shopping.html` — replace `data-action="close"` on `confirm-clear-done`,
   `confirm-clear-all`, `merge-do`, `merge-sep` with real handlers, and make
   `save-purchase` and `receipt-save` append to `BUDGET.history`. Six controls,
   all currently claiming to have done something they did not.
2. `profile.html` — give `settings`, `signup` and `start` a click branch. Right
   now `ProfileScreen`'s only two interactions are both gone, so the rebuilt
   screen is read-only.
3. `shopping.html` — make the Shop-at and item-sheet store rows open a search
   (or say plainly that they are inert), and make `export` do something. As it
   stands the entire Stores panel has no consequence anywhere in the app.
4. `fuel.html` / `home.html` — wire `resume` on the session shelf. Both files
   carry a comment explaining that the shelf exists to stop a session being
   abandoned; neither can return to it.
5. `workout-log.html` `addex-q`, `progress.html` `start-workout`,
   `shopping.html` `compare` and the three history ranges — smaller, but each is
   a control that answers a tap with nothing.
6. Regenerate `FEATURE-MANIFEST.md` (or restore `mockup-bodymap.html`); the
   freeze diff is currently not clean and so is not doing its job.
