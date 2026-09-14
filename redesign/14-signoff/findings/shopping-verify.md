# Shopping / Budget / Supplements — verification of the earlier findings

Verified against `08-build/shopping.html`, `08-build/stack.html`, `08-build/fuel.html`,
`08-build/home.html` and the seed in `08-build/fixtures.js` (TODAY = Wed 9 Sep 2026),
driven with Playwright at `file:///…/08-build/…`.

Seed the numbers are checked against (`fixtures.js` → `budget.history`):
Trader Joe's $19.70 on 2026-09-07, Safeway $28.80 (receipt) on 2026-09-03,
Trader Joe's $12.20 on 2026-08-30. Weekly target $120.

## Fixed

- **Calendar week/month, not a rolling offset** — `shopping.html:246-247` anchors
  `WEEK_START` to `getUTCDay()` (Sun 6 Sep) and `MONTH_START` to the 1st. On the budget
  panel the screen reads `week-spent $19.70`, header `$100.30 left`, `16%`,
  `month-spent $48.50`, `week-count 1` — exactly the three seeded receipts split
  Sep-7-only / Sep-1-onward. The old $48.50 / $60.70 / 2 are gone.
- **History filter uses the same calendar periods** — `shopping.html:912`
  (`FROM = { week: WEEK_START, month: MONTH_START }`). Clicking each segment gave
  Week 1 row (TJ $19.70), Month 2 rows (+ Safeway $28.80), All 3 rows (+ 30 Aug $12.20),
  Receipts 1 row. Month and All are no longer identical.
- **A logged purchase stores the unit price** — `shopping.html:1766-1770` writes
  `total: price*qty` and `items:[{p: price}]`. Logging 2 × "tofu" at $3.50 produced
  a history row reading `2× tofu — $3.50` with a `$7.00` header, and week-spent moved
  $19.70 → $26.70.
- **"Search for it" rows in the item sheet actually search** — `shopping.html:1380-1388`
  emits `data-action="find-store"` with `data-item`. Opening Chicken thighs and tapping
  Trader Joe's called `window.open('https://traderjoes.com/search?q=Chicken%20thighs')`
  (stubbed and captured) and flashed "Searching Trader Joe's for Chicken thighs."
- **"Find swaps" renders a result and the card is gated** — `shopping.html:888` returns
  '' when `weekBuys()` is empty; `find-swaps` sets `S.swaps = swapsFor()` which the card
  reads. Pressing it rendered the honest `swaps-none` copy, which is correct for this
  seed: the only week purchase (TJ: Chicken thighs, Greek yogurt, Bananas) shares no item
  name with any other store's history.
- **"Compare" is about the typed item over the enabled stores** — `shopping.html:788-808`
  (`paidFor`) reads `BUDGET.history`. Typing `rice` → "Safeway · Rice · Thu, Sep 3 · $3.50"
  plus "No price on record at Trader Joe's"; `chicken` → "Trader Joe's · Chicken thighs ·
  Mon, Sep 7 · $9.50"; `zzz` → the "nothing matches" line. All three match the seed's unit
  prices. Blank input gives an inline error instead of a silent no-op.
- **Blank name on "Add shop" and on the pantry "Add" says so** — pressing `pan-add` empty
  rendered `pan-error` "What is it called?"; `add-custom` empty rendered `cs-error`
  "A name and a website, so the list can search it.", and with only a name,
  "Its website, so your list can search it."
- **Persistence through LKStore** — `shopping.html:385-405` reads/writes
  `lk_shoppingList`, `lk_pantryItems`, `lk_budgetData`, `lk_myStores`. After adding
  Costco, ticking items, saving a $150 target and adding a pantry row, a reload returned
  `Trader Joe's:true,Costco:true`, target `150`, pantry `Canned CHICK Peas / Whey protein /…`,
  and the logged $7.00 purchase survived (week-spent still $26.70).
- **F-SHOP-009 typeahead over the food table with calories** — `shopping.html:164-195`
  (111 rows) and `:551-558`. `spin` → "Spinach 23 cal / 100 g", `ban` → "Banana 89",
  `oat` → "Oat Milk 46, Oats 379", `tof` → "Tofu 76".
- **F-SHOP-011 units** — `shopping.html:219` UNITS now contains `pcs, bag, bottle, tubs`;
  the `#add-unit` select rendered all twelve. Adding 12 pcs Eggs opened the merge sheet
  ("Adding 12 pcs would make it 24 pcs") and "Make it 24 pcs" stored `24 pcs`. Every one
  of the 10 seeded units (kg/tubs/pcs/bag/g/bottle) is now reachable. `normaliseName`
  (`:225-229`) capitalises every word, so "olive oil" resolves onto "Olive oil".
- **F-SHOP-017 share then clipboard** — `shopping.html:1720-1760`. With no
  `navigator.share` the export copied the grouped list and flashed "List copied. 10 items,
  ready to paste." (clipboard read back and matched); with `navigator.share` stubbed it
  called share with `{title,text}` and flashed "List shared. 10 items."
- **F-SHOP-019 "Shop at" opens every unchecked item, capped at 10** —
  `shopping.html:1610-1630`. With 8 unchecked it opened 8 distinct search URLs; after
  padding the list to 12 unchecked it opened exactly 10 and said "The first 10 of 12."
- **F-SHOP-028 restock interval derived from the history** — `shopping.html:1041-1066`.
  Seeding `lk_budgetData` with Peanut butter bought 10 Aug / 24 Aug / 7 Sep and then
  switching Peanut butter to a staple produced "rejoins the list every 14 days" and
  stored `intervalDays: 14` — the mean of the two 14-day gaps, clamped 3–60.
- **F-SHOP-030 overdue staples rejoin the list with a `lastAutoAdded` stamp** —
  `shopping.html:1004-1032` + `staplesDue()` at `:1974`. Setting Whey protein's interval
  to 1 day flashed "Whey protein is due and has rejoined your list", appended it to the
  list, and stored `lastAutoAdded: "2026-09-09T00:00:00.000Z"`; both survived a reload
  and it was not added a second time.
- **F-BUDG-005 receipt, local half, honest about the parse** —
  `shopping.html:735-742` renders `#r-cam` (`capture="environment"`) and `#r-lib`, both
  `accept="image/*"`. Setting a file on `#r-lib` rendered the preview card with a
  `blob:` image (naturalWidth 1), the copy "Reading a receipt needs a server and this
  build has none", a working Discard, and a "Type it in" path whose saved purchase
  correctly lands under source `Receipt` in the Receipts filter.
- **fuel → shopping loop** — logging "Peanut butter toast" in `fuel.html` (manual entry)
  set `lk_pantryItems` Peanut butter to `quantity 0, empty true` and pushed it onto
  `lk_shoppingList`. Opening `shopping.html?panel=pantry` then read both keys through
  LKStore: header "2 in stock, 2 out", banner "Peanut butter is already on the list.
  Canned tuna is not.", and the list showed the new row.
- **F-SHOP-031 / F-SUPP-010 (report-only, other screen)** — both now exist in
  `home.html`: `CARD_NAMES` at `:610` has "Running low" and "Supplements due";
  `suppDue()` at `:672-688` keeps the per-time-of-day windows and writes the tick to
  `lk_suppLog` (`:1121-1128`). The "Running low" card rendered on Home.

## Still open

- **F-SUPP-001..009 — the supplements CRUD does not exist anywhere.** `stack.html` is
  the compound/cycle screen (`stack.html:6,19-48`) and contains no supplement code; the
  only supplements UI in the build is the fuel sheet at `fuel.html:2093-2116`, which is
  still exactly what the audit described: two rows from the fixture with a tick and
  nothing else. Driving it, `[data-testid=sheet-supps]` exposes only
  `close, supp, supp` — no add form, no preset picker, no dose/frequency/time-of-day
  controls, no per-supplement reminder toggle, no streak, no 14-day history, no edit,
  no delete. `lk_suppLog` is never written by this screen (`LKStore.get('lk_suppLog')`
  returned `null` after ticking a supplement); only `home.html` writes it.
- **fuel.html's supplement write is lossy and silently drops the reminder flag.**
  `fuel.html:196-199` re-serialises `lk_supplements` as `{name, dose, timeOf, taken}`.
  Read before: `[{name:"Creatine",dose:"5 g",freq:"Daily",timeOf:"Morning",reminder:true,
  created:"2026-07-30T…"}, …]`; after one tick in the supps sheet:
  `[{"name":"Creatine","dose":"5 g","timeOf":"Morning","taken":false}, …]`. `freq`,
  `reminder` and `created` are gone, which is the exact data F-SUPP-004/005 and
  `home.html:679-686` (`s.reminder === false`, `s.freq`) depend on — so any future
  per-supplement reminder or frequency is destroyed the first time Fuel saves a day.
- **"Opened 10 searchs" — the F-SHOP-019 toast is ungrammatical.**
  `shopping.html:1628` calls `plural(opened, 'search')`, and `plural` at
  `shopping.html:115` is `word + 's'`. Observed on screen with 8 unchecked items
  ("Opened 8 searchs at Trader Joe's.") and with 12 ("Opened 10 searchs at Trader Joe's.
  The first 10 of 12."). Same helper is used for `plural(batch.length,'link')`, which is
  fine; only "search" is wrong.
