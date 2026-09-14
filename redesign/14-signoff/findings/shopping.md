# Shopping, Budget, Supplements — findings (54: 23 present, 16 partial, 12 missing)

## Class 2 — figures that do not reproduce

- **`sumSince(days)` is a rolling day-offset, not a calendar period**
  (shopping.html:305-311). With TODAY = Wed 9 Sep 2026:
  - The week should be the Sunday-anchored week (Sun 6 Sep →), giving
    **$19.70** spent, $100.30 left, 16%. It reads $48.50 / $71.50 / 40%,
    pulling in the Thu 3 Sep receipt.
  - The month should be from the 1st, giving **$48.50**. It reads $60.70,
    pulling in a 30 Aug purchase that is in August.
  - PURCHASES reads 2 (rolling 7) where the week holds 1.
  - Week/Month in the history filter have the same fault, so Month and All are
    identical on this seed.
  Fix `weekSpent`, `monthSpent` and the history WINDOW to calendar periods.
- **A logged purchase stores the line total in the item's price field**
  (:1400, `p: price * qty`), so the history renders "2× Tofu — $7.00" beside
  seeded rows that use unit prices. Store the unit price.

## Class 3 — controls that do nothing

- **"Search for it" store rows carry `data-action="close"`** (:1060). They are
  labelled as a search and dismiss the sheet. Wire them to
  `buildStoreSearchUrl(store, itemName)`.
- **"Find swaps"** sets `S.swapsShown`, which nothing reads (:1428). Either
  render a loading-then-result state or remove the button. Also gate the card
  on the week having purchases — it renders with an empty week today.
- **"Compare"** writes `S.compared`, which nothing renders (:1427). The three
  rows are a fixture for chicken thighs and never change. Make the comparison
  about the typed item, over the enabled stores.
- **A blank name on "Add shop" and on the pantry "Add"** returns silently
  (:1545, :1513). Every other form on the screen shows an inline error.

## Persistence

The list, the pantry, the budget and the stores must go through `LKStore`
(`lk_shoppingList`, `lk_pantryItems`, `lk_budgetData`, `lk_myStores`).

## Missing — build

| ID | What |
|---|---|
| F-SHOP-009 | Add-item typeahead over the food table, not the 12 fitness picks. "spin" and "ban" currently return nothing while Spinach and Bananas are on the list. Badge each with its calories. |
| F-SHOP-011 | Add `pcs`, `tubs`, `bag`, `bottle` to UNITS — 6 of the 10 seeded rows use units the merge path cannot reach. Title-case every word in `normaliseName`. |
| F-SHOP-017 | `navigator.share` when available, clipboard otherwise |
| F-SHOP-019 | "Shop at" opens every unchecked item, capped at 10, not just the first |
| F-SHOP-028 | Derive a staple's restock interval from the gaps between matching purchases in the budget history, clamped 3–60 |
| F-SHOP-030 | Overdue staples rejoin the list, with a `lastAutoAdded` stamp. The pantry sheet already promises this ("It rejoins the list on its own, before you run out") and nothing does it. |
| F-BUDG-005 | Receipt: two real file inputs (one `capture="environment"`), a preview, and a discard. Keep the parse honest — say it needs a server. |
| F-SUPP-001..009 | The whole supplements CRUD: an add form, a preset picker, dose/frequency/time-of-day controls, a per-supplement reminder toggle, a streak and a 14-day history, edit, and delete. Today the list is two seeded rows with a tick and nothing else. Store under `lk_supplements` and `lk_suppLog`. |

## Needs a server — local half plus a plain statement

F-SHOP-010 (store product search and prices), F-BUDG-005's parse step,
F-SUPP-011 (a reminder cron).

## Not yours but report it

F-SHOP-031 (a Home "running low" card), F-SUPP-010 (a Home "supplements due"
card, with the time-of-day windows).
