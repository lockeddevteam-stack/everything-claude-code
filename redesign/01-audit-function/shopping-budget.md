# Function audit — Shopping and Budget (`shopping-budget`)

ShoppingBudgetTab L45968, ShoppingTab L42420, PantryTab L43578, MyStoresTab L42079, BudgetTab L43974; ~3,331 lines.

## 1. Purpose
A four-tab grocery-errand and household-spending manager — list, pantry, retailer links, weekly food budget — hung off Fuel, doing supermarket admin rather than anything that moves a lift.

Fuel dependency is thin: the header-icon entry (L37075) and SuppReminderCard; all four data keys are its own. Standalone it needs a nav slot and an owner; no strength user asked for one.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Fitness Picks chips (12) | ShoppingTab L43000+ | working | `-populated.png`; adds on tap |
| Add item | L42517 | working | flow-7 step 5, `flow-7-added.png` |
| Merge duplicate dialog | L42429 | working | `-merge-dialog.png` |
| Store suggestions `/store-search` | L42458 | works with a store enabled; **silent on failure** | `-loading.png`, `-error.png` |
| Check off item; remove item | L41974, L42934 | working (two-tap arm) | sweep: DOM + storage change |
| Clear Done / Clear All | L42931, L42945 | working, two-tap | clicked twice: list 10→8; toast `[role=status]` "Tap again to clear every checked item." |
| Export list | L42566 | **broken feedback**: clipboard write, no toast, no visible change | sweep: body text identical before/after |
| "Shop at…" sheet, opens 10 browser tabs | L42584 | working, hostile | `-populated-shop-at-sheet.png` |
| Pantry add, staple, restock, + List, remove, out-of-stock banner | PantryTab L43633, L43614, L43782 | working | `-populated-pantry.png` |
| Supplement reminder card | SuppReminderCard L46185 | **redundant** — a Fuel job rendered here | page-map 2.18 |
| Store presets (9), ON toggle, delete, custom | MyStoresTab L42060-L42119 | working | `-populated-stores.png` |
| Weekly target edit; manual purchase | BudgetTab L44032, L44046 | working | `-budget-edit-target.png`, `-budget-add-purchase.png` |
| Receipt scan `/parse-receipt` | L44083 | working | `-budget-full.png`; crawl clicked Camera, Library |
| Find Cheaper Swaps | L44302 | working | `-loading-budget-swaps.png` |
| Price compare | L44340 | **hidden** — no trigger with one enabled store | index.md L453 |
| History Week/Month/All/Receipts, delete | L43990 | working | `-budget-month.png` |
| `screen="shopping"` route | L57702-L57710 | **dead** — nothing calls `go("shopping")` | page-map 2.18; user-flows L256 |

## 3. Task walkthrough

Flow 7, the only flow here. 4 taps, expected 4, **1266 ms, pass** (`flow-metrics.jsonl`). `flow-7.json`: boot 433, Nav Fuel 1409, "Shopping and budget" 2396, type 2953, add 3366, Budget tab 4339, assert 4882 ms.

Hesitations: (1) step 2 is a header icon inside Fuel — nothing on Home or the tab bar names shopping; (2) ADD TO LIST has no `disabled` attribute, only inert styling (L43161), and the SUGGESTIONS dropdown paints over it when a store is enabled (`-error.png`), which is why the harvest fell back to Enter; (3) a food exists as both chip and typed text, so re-adding hits a merge dialog.

## 4. State coverage

A = 4: four lists can empty, four network calls can load and fail.

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty | `-empty.png` (+ `-pantry`, `-stores`, `-budget`) | yes | correct: "Your list is empty" + next action per tab |
| Loading | `-loading.png`, `-loading-budget-swaps.png` | yes — "loading store products…" absent from populated | correct, specific |
| Error | `-error-budget-swaps.png` | yes — red toast absent from populated | correct: "Couldn't check for swaps. Check your connection and try again." |
| Populated | `-populated.png` | yes | correct |

Shortfall: the second error path is silent. `-error.png` (`/store-search` aborted) is indistinguishable from a successful search — the local fallback renders as if it were store data (catch L42458; index.md L493).

## 5. Baseline failures

Zero. `page-metrics.jsonl`: populated, empty and error pass; 0 console and page errors; **`nonResponders: []`, `blocked: []`**.

- **"20 / 53 interactive"** is a coverage artefact, not dead UI. The crawl visits by signature, never returning to a tab it leaves (`crawlInteractive` L659-706): it clicked back-"Fuel" first (navigatedAway, 1 recovery), hopped List→Pantry→My Stores→Budget, exhausted Budget's 16 controls, stopped. The 33 unclicked are List and Pantry rows it walked past. I re-enumerated and clicked all of them in Playwright: 18 responded, 4 did not — Clear Done, Clear All and pantry ×, all `lkConfirm` two-tap arms (L5179) that toast then act on tap two, plus Export, which truly does nothing visible.
- Only 1 skip recorded ("List — already selected"). SUMMARY D15's claim that shopping "Remove" was declined as destructive is not in this page's `skipped` array; the crawl never reached it. No control on this page is dead.
- **Targets 40 / 59 under 44px** (worst in the app) reproduced on the List tab: 54 in-page controls, 40 under 44 — `Remove` 45x14 x10, store chips 100x24 x8, picks chips 34px x12, Shop at…/Export/Clear 32px, back "Fuel" 53x18. Budget adds `Edit` 21x12 and `x` 7x16; Stores `Delete store` 22x28.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 2 | `-populated.png`: 3 stat chips, 4 sub-tabs, 12 add-chips, 4 list buttons above the fold; ≥5 candidate primary actions, two unrelated jobs |
| Feature completeness | 4 | §2: every visible control responded in the sweep; shortfalls — Export silent (L42566), compare unreachable, `screen="shopping"` dead |
| Task success | 4 | flow-7 pass, 4/4 taps, 0 errors; shortfall — ADD TO LIST overlapped by suggestions in `-error.png`, harvest used Enter |
| Speed | 4 | flow-metrics 4 taps / 1266 ms; best-known 3 (chip adds in one tap) — the extra tap is the Fuel-header hop |
| State handling | 4 | A=4, M=0, W=0, G=0 (§4); shortfall — `/store-search` error silent (`-error.png`) |
| Data correctness | 3 | `-budget-full.png`: $19.70 week, $48.50 month match seed (`gen-seed.mjs` L215-217); "8 to grab" = "8 of 10"; precision inconsistent — "$100 left" vs "$100.30 remaining" |
| Error recovery | 3 | `-error-budget-swaps.png` names cause and fix, data kept; `-error.png` shows nothing for the store-search failure |

**Function mean 3.4**.

## 7. Keep, fix, cut

**Keep**
- Shopping list + Fitness Picks chips: one tap adds a training food (`-populated.png`).
- Empty states: specific, one instruction, one action (`-empty.png`).
- Swaps error toast: the app's best error copy (`-error-budget-swaps.png`).


**Fix**
- 40 of 59 targets under 44px: Remove 45x14, chips 34px, `x` 7x16 (measured, §5).
- Export must confirm (L42566).
- Store-search failure must say so, not pass local data off as store data (`-error.png`).
- Route: `screen="shopping"` exists, only the Fuel header icon reaches it, and tapping Fuel resets out of it (L57514).
- Move SuppReminderCard back to Fuel.

**Cut**
- **My Stores + `/store-search` + "Shop at…"**: retailer plumbing, plus a control that opens ten browser tabs. None of it helps anyone train.
- **Budget tab entire** (receipts, swaps, compare, target): grocery-price fintech. No output feeds a workout, a lift or a body metric; it carries three of the page's four network calls.
- **Pantry**: household inventory; its one useful bit, "out of stock → add to list", the list already does.

Residue after the cuts is one shopping list: a Fuel accessory, not a page. For the global auditor — not a location problem, a scope problem.
