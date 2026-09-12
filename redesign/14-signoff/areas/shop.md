### F-SHOP-001 — Shop & Budget hub shell (4 sub-tabs + status pills)
- location: Fuel > Shop & Budget (`view === "shop"`, v6:37075; also `screen === "shopping"`, v6:57702) > header + tablist
- user action: taps "Fuel" back arrow, or one of the four segmented tabs List / Pantry / My Stores / Budget
- behaviour: 1. `useHubState("shopTab","shopping",["shopping","pantry","stores","budget"])` restores the last tab (v6:45969). 2. Reads unchecked shopping-list count (v6:45971-45973) and budget data (v6:45974). 3. Computes the current week window (Sunday 00:00 → +7d) and week spend/target/percent/over flags (v6:45975-45987). 4. Renders back button (only when `p.onBack` given, v6:45996), title "SHOP & BUDGET" (v6:46013), then up to three pills: "`N` to grab" (v6:46026), "$X left" or "Over budget" (v6:46049), "`N`% used" (v6:46076). 5. Renders the active child: ShoppingTab / PantryTab / MyStoresTab / BudgetTab (v6:46125-46128).
- v6 status: WORKING - Evidence: v6:46125-46128 all four branches render real components.

### F-SHOP-002 — Quick-add a preset store
- location: Shop & Budget > My Stores > "QUICK ADD" chip row
- user action: taps a retailer chip (Walmart, Amazon, Target, Costco, Whole Foods, Kroger, Instacart, Aldi, Trader Joe's, Safeway)
- behaviour: 1. `availablePresets` = `STORE_PRESETS` minus any preset whose `url` is already saved (v6:42137-42142). 2. `addPreset` re-checks for a duplicate url and returns silently if found (v6:42092-42095). 3. Assigns `STORE_PALETTE[stores.length % 10]` as colour (v6:42096). 4. Pushes `{id:"store_"+Date.now(), name, url, description, color, enabled:true}` (v6:42097-42104). 5. `setStores` writes state and `saveMyStores` → `lk_myStores` (v6:42087-42090).
- v6 status: WORKING - Evidence: v6:42097-42105 constructs and persists the record.

### F-SHOP-003 — Add a custom store
- location: Shop & Budget > My Stores > "Add Custom Store" dashed button → inline form
- user action: taps "+ Add Custom Store", types name / URL / optional description, taps "Add Store" (or "Cancel")
- behaviour: 1. `setShowForm(true)` swaps the dashed button for the form (v6:42352-42375). 2. `addManual` trims name and url; returns silently if either is empty (v6:42108-42111). 3. If url does not start with `http`, prefixes `https://` (v6:42111). 4. Assigns palette colour, pushes the record with `enabled:true`, saves, clears all three inputs, closes the form (v6:42112-42126).
- v6 status: PARTIAL - Evidence: v6:42110 `if (!n || !u) return;` — silent failure, no toast, unlike the rest of the app which uses `window.LOCKED.toast` (cf. v6:43606).

### F-SHOP-004 — Toggle a store on/off
- location: Shop & Budget > My Stores > store row > ON/OFF pill
- user action: taps the ON/OFF pill
- behaviour: flips `enabled` on that store, persists, and the row drops to `opacity 0.55` with a neutral border (v6:42127-42133, v6:42163, v6:42172).
- v6 status: WORKING — evidence v6:42128-42132 maps and persists.

### F-SHOP-005 — Delete a store
- location: Shop & Budget > My Stores > store row > trash icon
- user action: taps the trash icon
- behaviour: filters the store out by id and persists immediately (v6:42134-42138).
- v6 status: PARTIAL - Evidence: v6:42134-42138 — no `lkConfirm` guard, unlike pantry delete (v6:43616) and list clears (v6:42750). One tap destroys the store.

### F-SHOP-006 — My Stores empty state
- location: Shop & Budget > My Stores
- user action: 
- behaviour: with zero stores and the form closed, shows "No stores added yet" / "Add stores near you to link your shopping list" (v6:42395-42419).
- v6 status: WORKING — evidence v6:42395 `stores.length === 0 && !showForm`.

### F-SHOP-007 — Fitness Picks quick-add chips
- location: Shop & Budget > List > "🏋️ FITNESS PICKS — tap to add"
- user action: taps one of 12 chips
- behaviour: 1. `FITNESS_PICKS` (12 entries, v6:45907-45967) renders as chips with emoji (v6:42632). 2. `alreadyIn` compares `lcName(item)` against `lcName(pick.name)` (v6:42634-42636). 3. If not present, `quickAdd` calls `addShoppingItem(name, qty, unit)` and re-reads the list (v6:42619-42622). 4. Already-present chips turn green, show ✓, and are non-interactive (v6:42641-42660).
- v6 status: WORKING — evidence v6:42640 guards the click.

### F-SHOP-008 — Suggested meal bundles ("ADD ALL")
- location: Shop & Budget > List > empty-list card > "SUGGESTED MEALS TO PREP"
- user action: taps ADD ALL on one of three bundles
- behaviour: for each item name, looks it up in FITNESS_PICKS and uses `quickAdd`, else `addShoppingItem(n,1,"qty")`; then re-reads the list (v6:42722-42732).
- v6 status: WORKING — evidence v6:42722-42731.

### F-SHOP-009 — Add item — typeahead over the local FOODS table
- location: Shop & Budget > List > "ADD ITEM" > text input
- user action: types ≥2 characters
- behaviour: 1. Under 2 chars: clears suggestions, clears the loading flag, cancels the pending timer (v6:42437-42442). 2. Splits `FOODS` (v6:34768) into prefix matches then substring matches, takes the first 3 (v6:42443-42450). 3. Each generic row renders `food.n` plus a "`cal` cal" badge (v6:43106). 4. Tapping a row sets the input to that name and closes the dropdown (v6:42501-42505).
- v6 status: WORKING — evidence v6:42450 `.slice(0,3)`.

### F-SHOP-010 — Store product search (`/store-search`)
- location: Shop & Budget > List > ADD ITEM dropdown, "STORE PRODUCTS" section
- user action: typing ≥2 chars with at least one enabled store
- behaviour: 1. Debounce 500 ms via `storeSearchTimer` (v6:42456). 2. Takes the **first 3 enabled stores** (`myStores.slice(0,3)`, v6:42452) and fires one request per store in parallel; `pending` counts them down (v6:42457-42459). 3. POST `https://lockedapi.cescocugliari.workers.dev/store-search`, `Content-Type: application/json`, body `{storeDomain, query, storeDescription}` where `storeDomain` = store.url with the scheme and any path stripped (v6:42460-42470). 4. On `d.products` non-empty: rebuilds suggestions as `storeItems ++ otherStoreItems ++ genericItems.slice(0,2)` (v6:42472-42492). Each product may be a string or `{name, price}`; result rows are `{n, store, color, storePrice}` (v6:42481-42489). 5. Each settle decrements `pending`; at 0 `storeLoading` is cleared (v6:42490-42497). 6. Rows render a coloured store chip and a green price chip when `storePrice` is truthy (v6:43082-43103).
- v6 status: UNVERIFIED - Evidence: v6:42460 the endpoint is called unconditionally, but nothing in this file proves the worker route exists or what it returns. Confirm by `curl -X POST https://lockedapi.cescocugliari.workers.dev/store-search -d '{"storeDomain":"walmart.com","query":"eggs","storeDescription":""}'`.

### F-SHOP-011 — Add item to the list (with duplicate merge dialog)
- location: Shop & Budget > List > ADD ITEM > "ADD TO LIST" button or Enter key
- user action: types a name, optionally sets quantity + unit, presses Enter or ADD TO LIST
- behaviour: 1. Empty search → returns (v6:42518). 2. `normaliseName` title-cases every word (v6:42506-42510). 3. `findDuplicateItem` does an exact case-insensitive `lcName` match against the list (v6:42511-42516). 4. No duplicate → `addShoppingItem(name, quantity||1, unit)`, re-read list, reset search/qty/unit/suggestions (v6:42528-42535). 5. Duplicate → opens `mergeDialog` `{itemName, existingQty, existingUnit, newQty, newUnit}` (v6:42522-42528). 6. Dialog is portalled full-screen (`lkPortal`, v6:43268) and Escape-closable (`useEscape`, v6:42433). 7. Same units → three buttons Cancel / Add Separate / Merge, with a live "Total would be X" line (v6:43300-43303). 8. Different units → two buttons Cancel / Add Separate plus "Different units detected (a vs b)" (v6:43377-43390). 9. `handleMerge("merge")` sums `parseFloat(existingQty) + parseFloat(newQty)` into the matching list row and saves (v6:42539-42548). 10. `handleMerge("separate")` calls `addShoppingItem` with the normalised search text (v6:42549-42551). 11. Any action closes the dialog and resets the form (v6:42553-42557).
- v6 status: WORKING - Evidence: v6:42539-42548 the merge path mutates and persists the correct row.

### F-SHOP-012 — Check off / uncheck a list item
- location: Shop & Budget > List > category group > item row > checkbox button
- user action: 
- behaviour: `toggleShoppingItem(id)` flips `checked` and saves; the row strikes through and the per-store deep-link chips hide (v6:42562-42565, v6:43208, v6:43231).
- v6 status: WORKING — evidence v6:41974-41981.

### F-SHOP-013 — Remove a single list item
- location: Shop & Budget > List > item row > "Remove"
- user action: 
- behaviour: `removeShoppingItem(id)` filters by id and saves (v6:42558-42561, v6:41968).
- v6 status: PARTIAL — evidence v6:42558: no confirmation, unlike Clear Done / Clear All (v6:42750, v6:42775).

### F-SHOP-014 — Category grouping of the shopping list
- location: Shop & Budget > List > category headers
- user action: 
- behaviour: items are bucketed by `item.category` and rendered in the fixed order meat, dairy, produce, pantry, snacks, other, each with an emoji (v6:42611-42617, v6:42623-42625). Empty categories are dropped (v6:42616).
- v6 status: WORKING — evidence v6:43158 `sortedCategories.map`.

### F-SHOP-015 — Clear Done
- location: Shop & Budget > List > summary card > "Clear Done"
- user action: 
- behaviour: `lkConfirm("clearDone", …)` two-tap guard (v6:42750); on the second tap filters out every `checked` item and saves (v6:42753-42755).
- v6 status: WORKING — evidence v6:42750-42755.

### F-SHOP-016 — Clear All
- location: Shop & Budget > List > summary card > "Clear All"
- user action: 
- behaviour: `lkConfirm("clearShoppingList", …)`; on confirm writes `[]` (v6:42775-42779).
- v6 status: WORKING — evidence v6:42776-42778.

### F-SHOP-017 — Export / share the shopping list
- location: Shop & Budget > List > summary card > "Export"
- user action: 
- behaviour: 1. `exportShoppingList()` builds a plain-text list grouped by category with ☑/☐ marks (v6:41993-42011). 2. If `navigator.share` exists → native share sheet `{title:"Shopping List", text}` (v6:42568-42573). 3. Otherwise → `navigator.clipboard.writeText`, then `logBetaActivity("shopping_list_exported", {itemCount})` (v6:42574-42580).
- v6 status: PARTIAL - Evidence: v6:42568-42580 — the share path logs nothing and shows no toast; the clipboard path shows no toast either, so the user gets no confirmation the copy happened. `share().catch(function(){})` swallows failures (v6:42572).

### F-SHOP-018 — Per-item store deep links
- location: Shop & Budget > List > item row > coloured store chips (unchecked items only)
- user action: taps a store chip
- behaviour: `window.open(buildStoreSearchUrl(store, item.itemName), "_blank")` (v6:43236-43238).
- v6 status: WORKING — evidence v6:43236.

### F-SHOP-019 — "Shop at…" — open the whole list at one store
- location: Shop & Budget > List > summary card > "Shop at…" dropdown
- user action: taps "Shop at…", picks a store
- behaviour: 1. Dropdown lists every enabled store with its colour swatch (v6:42836-42875). 2. `openAllAtStore` takes unchecked items only; returns if none (v6:42586-42590). 3. Caps at the **first 10 items** (`items.slice(0,10)`, v6:42591). 4. Opens each in a new tab staggered by `i * 350` ms via `setTimeout` (v6:42592-42596). 5. Closes the dropdown (v6:42597).
- v6 status: PARTIAL - Evidence: v6:42592-42596 — deferred `window.open` calls are outside the user-gesture window, so all but the first are blocked by every mainstream popup blocker. Confirm by running the flow in Safari/Chrome with default settings.

### F-SHOP-020 — List summary header
- location: Shop & Budget > List > summary card
- user action: 
- behaviour: shows "`unchecked` of `total`" and "items to get" (v6:42793-42815). Card only renders when `totalCount > 0`; otherwise the empty-state card (F-SHOP-008) takes its place (v6:42664).
- v6 status: WORKING — evidence v6:42793-42800.

### F-SHOP-021 — Pantry — add item manually
- location: Shop & Budget > Pantry > "ADD ITEM" row
- user action: types a name (+ optional qty), taps Add or presses Enter
- behaviour: returns silently on a blank name (v6:43633); otherwise **prepends** `{id:"p_"+Date.now(), name, quantity:parseInt(qty)||1, unit:"", store:"", category:categorizeItem(name), dateAdded, empty:false}` and persists (v6:43634-43645).
- v6 status: PARTIAL — evidence v6:43633 blank name fails silently.

### F-SHOP-022 — Pantry — mark out of stock / restocked
- location: Shop & Budget > Pantry > item row > circular button, and the "OUT OF STOCK" banner "Got it ✓"
- user action: 
- behaviour: 1. `toggleEmpty` flips `empty`; when it becomes true it also calls `addShoppingItem(name, quantity||1, unit||"qty")` (v6:43621-43631). 2. Empty items dim to 0.5, strike through, gain a red border and an "OUT → on list" badge (v6:43648-43652, v6:43836-43844, v6:43884). 3. A red banner at the top lists all empty items with a "Got it ✓" button that calls `toggleEmpty` again (v6:43658-43700).
- v6 status: PARTIAL - Evidence: v6:43625 — un-emptying does **not** remove the item from the shopping list, and re-emptying adds a second copy. The banner text claims "added to shopping list" (v6:43672) whether or not that add succeeded.

### F-SHOP-023 — Pantry — "+ List"
- location: Shop & Budget > Pantry > item row > "+ List" (non-empty items only)
- user action: 
- behaviour: `addShoppingItem(name, quantity||1, "")` then `showVoiceToast(name + " → list")` (v6:43926-43930).
- v6 status: WORKING — evidence v6:43926-43929, `showVoiceToast` at v6:53465.

### F-SHOP-024 — Pantry — delete item
- location: Shop & Budget > Pantry > item row > "×"
- user action: 
- behaviour: `lkConfirm("delPantry"+id, "Tap again to remove this item.")` then filters by id (v6:43614-43620).
- v6 status: WORKING — evidence v6:43616-43619.

### F-SHOP-025 — Pantry — category grouping and All/Staples filter
- location: Shop & Budget > Pantry > filter pills + category headers
- user action: 
- behaviour: pills are `All (N)` / `★ Staples (N)` (v6:43764-43772); `visiblePantry` filters on `staple` (v6:43646); items are bucketed by `category || "other"` and the keys sorted alphabetically (v6:43648-43656).
- v6 status: WORKING — evidence v6:43764-43773.

### F-SHOP-026 — Pantry empty states
- location: Shop & Budget > Pantry
- user action: 
- behaviour: with no visible items, shows either "★ / No staples yet / Tap the ☆ on any pantry item…" or "🗄️ / Pantry is empty / Scan a receipt in the Budget tab to auto-populate your pantry…" depending on the filter (v6:43774-43800).
- v6 status: WORKING — evidence v6:43797-43799.

### F-SHOP-027 — Staples — mark/unmark a staple (☆/★)
- location: Shop & Budget > Pantry > item row > star button
- user action: 
- behaviour: 1. Unmarking sets `staple:false`, keeping `intervalDays` (v6:43593). 2. Marking picks `i.intervalDays || suggestRestockInterval(name) || 7`, logs `logBetaActivity("staple_marked",{name,intervalDays})` and sets `{staple:true, intervalDays}` (v6:43594-43597).
- v6 status: WORKING — evidence v6:43594-43597.

### F-SHOP-028 — Staples — restock interval suggestion from purchase history
- location: invisible; runs inside F-SHOP-027
- user action: 
- behaviour: 1. Reads `getBudgetData().history`; for every history item whose lowercased name contains the pantry name or vice-versa, collects the entry date (v6:43467-43476). 2. Sorts dates, requires ≥2 (v6:43477-43478). 3. Computes day gaps, discarding gaps < 2 days (v6:43479-43483). 4. Returns `clamp(round(mean(gaps)), 3, 60)`, or `null` if no usable gaps (v6:43484-43486).
- v6 status: WORKING — evidence v6:43485-43486.

### F-SHOP-029 — Staples — edit the restock interval
- location: Shop & Budget > Pantry > staple row > "every Nd" chip
- user action: 
- behaviour: tapping the chip opens a number input seeded with `intervalDays || 7` (v6:43893-43896); Enter or "Set" calls `saveInterval`, which rejects anything outside 1–365 with a toast "Restock interval must be between 1 and 365 days." and keeps the editor open (v6:43600-43612).
- v6 status: WORKING — evidence v6:43604-43607; an in-code comment at v6:43602 records that the silent-drop bug was fixed here.

### F-SHOP-030 — Staples — auto-add due items to the shopping list
- location: invisible; runs on RunningLowCard mount (Home)
- user action: 
- behaviour: 1. `getOverdueStaples` returns pantry items with `staple && intervalDays` whose `(now - (lastBought||dateAdded)) / 86400000 >= intervalDays`, annotated with `overdueDays` and `onList` (`lastAutoAdded > lastBought`) (v6:43488-43505). 2. `autoAddDueStaples` filters to `!onList`; for each, a loose name match against the current shopping list (equality or either-way substring) decides whether to `addShoppingItem(name, quantity||1, unit||"")` (v6:43506-43524). 3. Regardless of whether it was added, `lastAutoAdded = now` is stamped on the pantry row so it does not retry every mount (v6:43525-43528). 4. If anything was added, `logBetaActivity("restock_auto_added",{names})` (v6:43530).
- v6 status: WORKING — evidence v6:43518-43528.

### F-SHOP-031 — RUNNING LOW home card
- location: Home > modular card slot `restock` (rendered at v6:26663)
- user action: taps "Bought" on a row
- behaviour: 1. On mount, `useEffect` runs `autoAddDueStaples()` then bumps a `tick` to force a re-render (v6:43544-43547). 2. Renders nothing when nothing is overdue (v6:43549). 3. Each row shows the name and "`N`d overdue" or "due now", plus " · on your list" when `onList` (v6:43569). 4. "Bought" calls `markStapleBought(id)` (sets `lastBought = now`, `empty = false`), bumps `tick`, and logs `logBetaActivity("staple_restocked",{name})` (v6:43571-43575, v6:43533-43541).
- v6 status: WORKING — evidence v6:26663 the card is wired into the Home card registry.

### F-SHOP-032 — Receipt → pantry population
- location: invisible; runs from BudgetTab "Confirm & Save" (F-BUDG-006)
- user action: 
- behaviour: 1. For each parsed item with a non-empty name, searches the pantry case-insensitively, **preferring a `staple`-flagged match** over the first match (v6:43427-43437). 2. Existing → sets `lastBought = now`, `empty = false`, `quantity = item.qty || existing.quantity || 1`, and `store` when given (v6:43438-43443). 3. New → pushes `{id:"p_"+Date.now()+"_"+rand, name, quantity, unit:"", store, category:categorizeItem(name), dateAdded, lastBought, lowStock:false}` (v6:43444-43456). 4. Persists (v6:43459).
- v6 status: WORKING — evidence v6:43438-43443, the staple-preferring merge is deliberate (comment v6:43424-43427).

### F-SHOP-032b — MealPlannerTab — dead duplicate meal planner
- location: none — the component is never rendered - User action (as written): "+ New Plan" → days (3/5/7) × meals/day (2–5) + diet + budget text → "Generate Meal Plan"; plan cards open a day-by-day detail view with "+ Shopping List" - Behavior (as written): 1. `buildMealContext` assembles a calorie/macro/goal/store/budget context string from `lk_fuelProfile` (falling back to `lk_profile` and `calcTDEE`), enabled store names+descriptions, `getBudgetData().weeklyTarget`, and the two free-text prefs (v6:45253-45274). 2. `generatePlan` computes the upcoming day names and POSTs to the worker root with `{system, messages, max_tokens:4096}` (v6:45288-45303). The system prompt pins the per-day kcal target, the 30/30/30/10 split, and a full JSON schema `{name, days:[{day, meals:[{name,title,ingredients:[{item,amount}],totalCal,totalProtein,totalCarb,totalFat}]}], shoppingList:[{item,amount,category}]}` and demands store-specific product names (v6:45291). 3. Response handling: first `{...}` block, then a **brace/bracket-balancing repair loop** that appends missing `]` and `}` before `JSON.parse` (v6:45312-45325). 4. On success stamps `id:"mp_"+Date.now()`, `created`, `daysCount`, `mealsPerDay`, prepends to plans, opens it (v6:45326-45333). 5. Four distinct failure toasts: "No response from the planner…", "The planner returned something unreadable. Try fewer days.", "The plan came back empty. Try again.", "Couldn't reach the planner…" (v6:45309-45345). 6. `addToShopping` dedupes by the first 6 characters of the lowercased name, runs `parseIngredient` over "`amount` `name`", pushes rows flagged `fromMealPlan:true`, and toasts "`N` items added to shopping list (`M` already on list)" (v6:45347-45379). 7. `deletePlan` uses a native `confirm()` (v6:45880).
- user action: 
- behaviour: 
- v6 status: DEAD - Evidence: `grep -n "MealPlanner"` returns only the definition at v6:45234 — there is no `React.createElement(MealPlannerTab, …)` anywhere. The live meal planner is `MealPlanFuelTab` (v6:37469), which reads the same `lk_mealPlans` key (v6:37471).
