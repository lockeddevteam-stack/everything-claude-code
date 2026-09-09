# Function audit — Shopping and Budget (`shopping-budget`)

Components: ShoppingBudgetTab L45968, ShoppingTab L42420, PantryTab L43578, MyStoresTab L42079, BudgetTab L43974 (~3,331 lines).

## 1. Purpose

A four-tab grocery-errand and household-spending manager — list, pantry stock, retailer links, weekly food budget — hung off the Fuel tab, doing supermarket admin rather than anything that moves a lift.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Fitness Picks quick-add chips (12) | ShoppingTab L43000+ | working | `shopping-budget-populated.png`; adds/toggles on tap (my click sweep) |
| Add item (name, qty, unit) | L42517 / L41951 | working | flow-7 step 5, `flow-7-added.png` |
| Merge duplicate dialog | L42429 | working | `shopping-budget-populated-merge-dialog.png` |
| Store product suggestions `/store-search` | L42458 | working when a store is enabled; **silent on failure** | `shopping-budget-loading.png` vs `-error.png` |
| Check off / uncheck item | L41974 | working | sweep: DOM+storage change |
| Remove item | L42934 area | working (two-tap arm) | sweep |
| Clear Done / Clear All | L42931, L42945 | working, two-tap confirm | I clicked twice: list 10→8; toast `[role=status]` "Tap again to clear every checked item." |
| Export list | `exportList` L42566 | **broken feedback**: clipboard write with no toast, no visible change | sweep: body text identical before/after; `shopping-budget-populated.png` |
| "Shop at…" sheet → opens up to 10 browser tabs | L42584, `openAllAtStore` L42586 | working, hostile | `shopping-budget-populated-shop-at-sheet.png` |
| Pantry add / staple star / restock interval / + List / remove | PantryTab L43633, L43614 | working | `shopping-budget-populated-pantry.png`; sweep all responded |
| Out-of-stock banner + "Got it ✓" | L43782 | working | same capture |
| Supplement reminder card | SuppReminderCard L46185 | **redundant** — a Fuel supplement job rendered inside a shopping page | page-map 2.18 |
| Store presets (9), ON toggle, delete, custom store | MyStoresTab L42060-L42119 | working | `shopping-budget-populated-stores.png`; sweep |
| Weekly target edit | BudgetTab L44032 | working | `shopping-budget-populated-budget-edit-target.png` |
| Manual purchase entry | L44046 | working | `shopping-budget-populated-budget-add-purchase.png` |
| Receipt scan `/parse-receipt` (Camera/Library) | L44083 | working (network) | `-budget-full.png`; crawl clicked both |
| Find Cheaper Swaps `/swaps` | L44302 | working | `shopping-budget-loading-budget-swaps.png` |
| Price compare | L44340 | **hidden** — no trigger renders with one enabled store | screenshots/index.md L453 |
| History Week/Month/All/Receipts, delete purchase `x` | L43990 | working | `-budget-month.png`, `-budget-receipts` |
| `screen="shopping"` top-level route | L57702-L57710 | **dead** — nothing calls `go("shopping")` | page-map 2.18 Entry; user-flows L256 |

## 3. Task walkthrough

Flow 7 (the only flow touching this page) — add a shopping item, open Budget. 4 taps, expected 4, **1266 ms, pass** (`flow-metrics.jsonl`). Video `flow-7-shopping-add-budget.webm`: boot 433, Nav Fuel 1409, "Shopping and budget" 2396, type 2953, add 3366, Budget tab 4339, assert 4882 ms.

Hesitations: (1) step 2 is an unlabelled header icon inside Fuel — nothing on Home or the tab bar names shopping; (2) ADD TO LIST has no `disabled` attribute, only inert grey styling (L43161), and the SUGGESTIONS dropdown paints over it when a store is enabled (`shopping-budget-error.png`), which is why the harvest run fell back to Enter; (3) the same item exists twice as a chip and as typed text, so a picked chip re-taps into a merge dialog.

## 4. State coverage

A = 4 (all applicable; four lists can be empty, four network calls can load and fail).

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty | `shopping-budget-empty.png` (+ `-pantry`, `-stores`, `-budget`) | yes | correct: "Your list is empty" + a named next action per tab |
| Loading | `shopping-budget-loading.png`, `-loading-budget-swaps.png` | yes — "SUGGESTIONS — loading store products…" absent from populated | correct and specific |
| Error | `shopping-budget-error-budget-swaps.png` | yes — red toast absent from populated | correct: "Couldn't check for swaps. Check your connection and try again." |
| Populated | `shopping-budget-populated.png` | yes | correct |

Shortfall: the second error path is silent. `shopping-budget-error.png` (with `/store-search` aborted) is indistinguishable from a successful search — the local fallback list renders as if it were store data (catch at L42458; screenshots/index.md L493).

## 5. Baseline failures

Zero. `page-metrics.jsonl`: populated, empty, error all pass; 0 console errors, 0 page errors; **`nonResponders: []`, `blocked: []`**.

- **"20 / 53 interactive"** is a coverage artefact, not dead UI. The crawl visits by signature and never returns to a tab it leaves (`crawlInteractive` L659-L706): it clicked back-"Fuel" first (navigatedAway, 1 recovery), then hopped List→Pantry→My Stores→Budget, exhausted Budget's 16 controls and stopped. The 33 unclicked elements are the List and Pantry rows it walked past. I re-enumerated and clicked all of them via Playwright: 18 responded, 4 did not — Clear Done, Clear All, pantry ×, all `lkConfirm` two-tap arms (L5179) that toast and then work on the second tap, and Export, which genuinely produces nothing visible.
- Only 1 skip recorded ("List — already selected"). SUMMARY D15's claim that shopping "Remove" was declined as destructive does not appear in this page's `skipped` array; the crawl never reached it.
- **Targets 40 / 59 under 44px** (worst in the app) reproduced on the List tab: my enumeration counts 54 in-page controls, 40 under 44px — `Remove` 45x14 x10, item store chips 100x24 x8, Fitness Picks chips 34px tall x12, Shop at…/Export/Clear 32px, back "Fuel" 53x18. Budget adds `Edit` 21x12 and delete-purchase `x` 7x16; Stores has `Delete store` 22x28.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 2 | `shopping-budget-populated.png`: title plus 3 stat chips, 4 sub-tabs, 12 add-chips and 4 list-management buttons above the fold; ≥5 candidate primary actions, two unrelated jobs (groceries, money) |
| Feature completeness | 4 | Feature table: every visible control responded in my click sweep; shortfalls — Export silent (L42566), price compare unreachable, `screen="shopping"` dead |
| Task success | 4 | flow-7 pass, 4/4 taps, 0 errors; shortfall — ADD TO LIST overlapped by suggestions in `shopping-budget-error.png`, harvest used Enter |
| Speed | 4 | flow-metrics 4 taps / 1266 ms; best-known is 3 (chip tap adds instantly) — the extra tap is the Fuel-header hop |
| State handling | 4 | A=4, M=0, W=0, G=0; shortfall — `/store-search` error silent (`shopping-budget-error.png`) |
| Data correctness | 3 | `-budget-full.png`: $19.70 week and $48.50 month both match seed (`gen-seed.mjs` L215-217); "8 to grab" = "8 of 10"; precision inconsistent — header "$100 left" vs card "$100.30 remaining" |
| Error recovery | 3 | `-error-budget-swaps.png` names cause and fix, data kept; `shopping-budget-error.png` shows nothing at all for the store-search failure |

**Function mean 3.4.**

## 7. Keep, fix, cut

**Keep**
- Shopping list + Fitness Picks chips: one tap adds a training-relevant food (`shopping-budget-populated.png`).
- Empty states: specific, one instruction, one action (`shopping-budget-empty.png`).
- Swaps error toast: the app's best error copy (`-error-budget-swaps.png`).

**Fix**
- 40 of 59 targets under 44px — Remove 45x14, chips 34px, `x` 7x16 (measured, §5).
- Export must confirm (silent clipboard, L42566).
- Store-search failure must say so instead of passing local data off as store data (`shopping-budget-error.png`).
- Settle the route: `screen="shopping"` exists but only the Fuel header icon reaches it, and tapping Fuel again resets out of it (L57514).
- Move SuppReminderCard back to Fuel; it is not a shopping job.

**Cut**
- **My Stores + `/store-search` + "Shop at…"**: retailer accounts and a control that opens ten browser tabs are e-commerce plumbing; nothing here helps anyone train, and the north star is the lift, not the errand.
- **Budget tab entire** (receipts, swaps, price compare, weekly target): grocery-price fintech. It fails the north star outright — no output feeds a workout, a lift, or a body metric, and it carries three of the four network calls on the page.
- **Pantry**: household inventory. If any part survives, it is "out of stock → add to list", which the list already does.

Residue after the cuts is one shopping list — a Fuel accessory, not a page. That is the recommendation to the global auditor: this is not a location problem, it is a scope problem.
