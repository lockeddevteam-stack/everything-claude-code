# Agent 4 — Shopping & Budget audit

File under audit: `redesign/input/locked-current-v6.html` (abbreviated below as **v6**).
Exclusive range: **42079–46184**.
All line cites are `redesign/input/locked-current-v6.html:N`.

Component boundaries in range (derived from `grep -n "^function"`, v6:42079-46184):

| Component / helper | Lines |
|---|---|
| MyStoresTab | 42079–42419 |
| ShoppingTab | 42420–43414 |
| getPantry / savePantry / addToPantry | 43415–43462 |
| suggestRestockInterval | 43466–43487 |
| getOverdueStaples | 43488–43505 |
| autoAddDueStaples | 43506–43532 |
| markStapleBought | 43533–43541 |
| RunningLowCard | 43542–43577 |
| PantryTab | 43578–43963 |
| getBudgetData / saveBudgetData | 43964–43973 |
| BudgetTab | 43974–45227 |
| getMealPlans / saveMealPlans | 45228–45233 |
| MealPlannerTab | 45234–45906 |
| FITNESS_PICKS | 45907–45967 |
| ShoppingBudgetTab | 45968–46128 |
| Supplement helpers (out of module scope, in range) | 46129–46184 |

Shared code resolved outside the range (cited but not owned): `ld`/`sd` (v6:2417, v6:2435),
`useHubState` (v6:2121), `lcName` (v6:4742), `lkConfirm` (v6:5179), `logBetaActivity` (v6:2772),
`parseIngredient` (v6:41905), shopping-list CRUD (v6:41945–42024), `STORE_PATTERNS`/`STORE_PALETTE`/
`STORE_PRESETS`/`buildStoreSearchUrl`/`getMyStores`/`saveMyStores` (v6:41995–42078).

---

# PART A — Features

### F-SHOP-001 Shop & Budget hub shell (4 sub-tabs + status pills)
- Location: Fuel > Shop & Budget (`view === "shop"`, v6:37075; also `screen === "shopping"`, v6:57702) > header + tablist
- User action: taps "Fuel" back arrow, or one of the four segmented tabs List / Pantry / My Stores / Budget
- Behavior:
  1. `useHubState("shopTab","shopping",["shopping","pantry","stores","budget"])` restores the last tab (v6:45969).
  2. Reads unchecked shopping-list count (v6:45971-45973) and budget data (v6:45974).
  3. Computes the current week window (Sunday 00:00 → +7d) and week spend/target/percent/over flags (v6:45975-45987).
  4. Renders back button (only when `p.onBack` given, v6:45996), title "SHOP & BUDGET" (v6:46013), then up to three pills: "`N` to grab" (v6:46026), "$X left" or "Over budget" (v6:46049), "`N`% used" (v6:46076).
  5. Renders the active child: ShoppingTab / PantryTab / MyStoresTab / BudgetTab (v6:46125-46128).
- Components: ShoppingBudgetTab (v6:45968-46128)
- Functions: `useHubState` (v6:2121), `getShoppingList` (v6:41945), `getBudgetData` (v6:43964)
- State: local `tab` (persisted via useHubState); props `useKg`, `profile`, `go`, `onBack` — `useKg`/`profile`/`go` are accepted but never used inside (v6:45968-46128)
- Storage: reads `lk_shoppingList`, `lk_budgetData`, plus the useHubState key for `shopTab`
- Network: none
- AI: none
- Edge cases: no target → budget pills hidden (`wkTarget > 0`, v6:46049; `budgetPct !== null`, v6:46076); empty list → "to grab" pill hidden (v6:46026)
- Gating: always on
- Status: WORKING
- Evidence: v6:46125-46128 all four branches render real components.
- Notes: week math is duplicated verbatim from BudgetTab (v6:45975-45987 vs v6:44005-44017). Counts are computed at render from localStorage, not state, so they refresh only when the hub re-renders.

### F-SHOP-002 Quick-add a preset store
- Location: Shop & Budget > My Stores > "QUICK ADD" chip row
- User action: taps a retailer chip (Walmart, Amazon, Target, Costco, Whole Foods, Kroger, Instacart, Aldi, Trader Joe's, Safeway)
- Behavior:
  1. `availablePresets` = `STORE_PRESETS` minus any preset whose `url` is already saved (v6:42137-42142).
  2. `addPreset` re-checks for a duplicate url and returns silently if found (v6:42092-42095).
  3. Assigns `STORE_PALETTE[stores.length % 10]` as colour (v6:42096).
  4. Pushes `{id:"store_"+Date.now(), name, url, description, color, enabled:true}` (v6:42097-42104).
  5. `setStores` writes state and `saveMyStores` → `lk_myStores` (v6:42087-42090).
- Components: MyStoresTab (v6:42079-42419)
- Functions: `addPreset` (v6:42091-42106), `setStores` (v6:42087-42090), `saveMyStores` (v6:42076)
- State: local `stores`
- Storage: writes `lk_myStores`
- Network / AI: none
- Edge cases: all 10 presets added → chip row hidden (v6:42143)
- Gating: always on
- Status: WORKING
- Evidence: v6:42097-42105 constructs and persists the record.
- Notes: id collides if two stores are added inside the same millisecond. Palette wraps after 10 stores so colours repeat.

### F-SHOP-003 Add a custom store
- Location: Shop & Budget > My Stores > "Add Custom Store" dashed button → inline form
- User action: taps "+ Add Custom Store", types name / URL / optional description, taps "Add Store" (or "Cancel")
- Behavior:
  1. `setShowForm(true)` swaps the dashed button for the form (v6:42352-42375).
  2. `addManual` trims name and url; returns silently if either is empty (v6:42108-42111).
  3. If url does not start with `http`, prefixes `https://` (v6:42111).
  4. Assigns palette colour, pushes the record with `enabled:true`, saves, clears all three inputs, closes the form (v6:42112-42126).
- Components: MyStoresTab (v6:42079-42419)
- Functions: `addManual` (v6:42107-42126)
- State: `nameVal`, `urlVal`, `descVal`, `showForm`, `stores`
- Storage: writes `lk_myStores`
- Network / AI: none
- Edge cases: blank name or url → no feedback at all, button appears dead (v6:42110)
- Gating: always on
- Status: PARTIAL
- Evidence: v6:42110 `if (!n || !u) return;` — silent failure, no toast, unlike the rest of the app which uses `window.LOCKED.toast` (cf. v6:43606).
- Notes: no URL validation beyond the `http` prefix; "store.com/foo" becomes `https://store.com/foo` and `buildStoreSearchUrl` will append `/search?q=` to it (v6:42071). The description field is fed verbatim into three AI prompts (v6:44306, v6:44344, v6:45266) — prompt-injection surface.

### F-SHOP-004 Toggle a store on/off
- Location: Shop & Budget > My Stores > store row > ON/OFF pill
- User action: taps the ON/OFF pill
- Behavior: flips `enabled` on that store, persists, and the row drops to `opacity 0.55` with a neutral border (v6:42127-42133, v6:42163, v6:42172).
- Components: MyStoresTab (v6:42079-42419)
- Functions: `toggleStore` (v6:42127-42133)
- State: `stores`; Storage: writes `lk_myStores`
- Status: WORKING — evidence v6:42128-42132 maps and persists.
- Notes: every consumer filters on `enabled` (v6:42580, v6:43995, v6:45245), so OFF removes the store from search, deep links, budget dropdowns and AI prompts.

### F-SHOP-005 Delete a store
- Location: Shop & Budget > My Stores > store row > trash icon
- User action: taps the trash icon
- Behavior: filters the store out by id and persists immediately (v6:42134-42138).
- Components: MyStoresTab; Functions: `deleteStore` (v6:42134-42138)
- Storage: writes `lk_myStores`
- Status: PARTIAL
- Evidence: v6:42134-42138 — no `lkConfirm` guard, unlike pantry delete (v6:43616) and list clears (v6:42750). One tap destroys the store.
- Notes: budget history entries keep the store *name* string, so deleting a store does not corrupt history (v6:44046).

### F-SHOP-006 My Stores empty state
- Location: Shop & Budget > My Stores
- Behavior: with zero stores and the form closed, shows "No stores added yet" / "Add stores near you to link your shopping list" (v6:42395-42419).
- Status: WORKING — evidence v6:42395 `stores.length === 0 && !showForm`.

### F-SHOP-007 Fitness Picks quick-add chips
- Location: Shop & Budget > List > "🏋️ FITNESS PICKS — tap to add"
- User action: taps one of 12 chips
- Behavior:
  1. `FITNESS_PICKS` (12 entries, v6:45907-45967) renders as chips with emoji (v6:42632).
  2. `alreadyIn` compares `lcName(item)` against `lcName(pick.name)` (v6:42634-42636).
  3. If not present, `quickAdd` calls `addShoppingItem(name, qty, unit)` and re-reads the list (v6:42619-42622).
  4. Already-present chips turn green, show ✓, and are non-interactive (v6:42641-42660).
- Components: ShoppingTab (v6:42420-43414)
- Functions: `quickAdd` (v6:42619-42622), `addShoppingItem` (v6:41951), `lcName` (v6:4742)
- Storage: writes `lk_shoppingList`
- Status: WORKING — evidence v6:42640 guards the click.
- Notes: the 12 picks and their default quantities are hardcoded (Chicken Breast 2 lb, Eggs 12 qty, Greek Yogurt 16 oz, Salmon 1 lb, Broccoli 2 qty, Brown Rice 2 cup, Sweet Potato 3 qty, Oats 2 cup, Avocado 2 qty, Cottage Cheese 16 oz, Almonds 4 oz, Ground Beef 1 lb — v6:45907-45967).

### F-SHOP-008 Suggested meal bundles ("ADD ALL")
- Location: Shop & Budget > List > empty-list card > "SUGGESTED MEALS TO PREP"
- User action: taps ADD ALL on one of three bundles
- Behavior: for each item name, looks it up in FITNESS_PICKS and uses `quickAdd`, else `addShoppingItem(n,1,"qty")`; then re-reads the list (v6:42722-42732).
- Components: ShoppingTab; Functions: inline handler (v6:42722-42734), `quickAdd` (v6:42619)
- Storage: writes `lk_shoppingList`
- Status: WORKING — evidence v6:42722-42731.
- Notes: three bundles hardcoded inline (v6:42700-42714): Chicken & Broccoli Bulk Prep, High Protein Breakfast Spread, Clean Eating Week. Only rendered while `totalCount === 0` (v6:42664), so they vanish once anything is on the list. No duplicate check on the fallback branch.

### F-SHOP-009 Add item — typeahead over the local FOODS table
- Location: Shop & Budget > List > "ADD ITEM" > text input
- User action: types ≥2 characters
- Behavior:
  1. Under 2 chars: clears suggestions, clears the loading flag, cancels the pending timer (v6:42437-42442).
  2. Splits `FOODS` (v6:34768) into prefix matches then substring matches, takes the first 3 (v6:42443-42450).
  3. Each generic row renders `food.n` plus a "`cal` cal" badge (v6:43106).
  4. Tapping a row sets the input to that name and closes the dropdown (v6:42501-42505).
- Components: ShoppingTab; Functions: `handleSearchChange` (v6:42435-42500), `selectSuggestion` (v6:42501-42505)
- State: `search`, `suggestions`, `storeLoading`, `storeSearchTimer` (useRef)
- Storage: none; Network: see F-SHOP-010
- Status: WORKING — evidence v6:42450 `.slice(0,3)`.
- Notes: selecting a suggestion only fills the box; the user must still press ADD TO LIST/Enter.

### F-SHOP-010 Store product search (`/store-search`)
- Location: Shop & Budget > List > ADD ITEM dropdown, "STORE PRODUCTS" section
- User action: typing ≥2 chars with at least one enabled store
- Behavior:
  1. Debounce 500 ms via `storeSearchTimer` (v6:42456).
  2. Takes the **first 3 enabled stores** (`myStores.slice(0,3)`, v6:42452) and fires one request per store in parallel; `pending` counts them down (v6:42457-42459).
  3. POST `https://lockedapi.cescocugliari.workers.dev/store-search`, `Content-Type: application/json`, body `{storeDomain, query, storeDescription}` where `storeDomain` = store.url with the scheme and any path stripped (v6:42460-42470).
  4. On `d.products` non-empty: rebuilds suggestions as `storeItems ++ otherStoreItems ++ genericItems.slice(0,2)` (v6:42472-42492). Each product may be a string or `{name, price}`; result rows are `{n, store, color, storePrice}` (v6:42481-42489).
  5. Each settle decrements `pending`; at 0 `storeLoading` is cleared (v6:42490-42497).
  6. Rows render a coloured store chip and a green price chip when `storePrice` is truthy (v6:43082-43103).
- Components: ShoppingTab (v6:42420-43414)
- Functions: `handleSearchChange` (v6:42435-42500)
- Network: POST `/store-search`; response `{products: (string | {name, price})[]}`
- AI: server-side; **no model, prompt or key is visible client-side** — the worker is a black box.
- Edge cases: no enabled stores → returns before setting loading (v6:42453); `.catch` swallows the error with no user message (v6:42494-42497); the header shows "— loading store products…" only while zero store rows exist (v6:43037-43046).
- Gating: always on
- Status: UNVERIFIED
- Evidence: v6:42460 the endpoint is called unconditionally, but nothing in this file proves the worker route exists or what it returns. Confirm by `curl -X POST https://lockedapi.cescocugliari.workers.dev/store-search -d '{"storeDomain":"walmart.com","query":"eggs","storeDescription":""}'`.
- Notes: the request is unauthenticated — no key, token or user id is sent (v6:42460-42470); anyone can call the worker. The store *description* the user typed is forwarded verbatim. Timer is never cleared on unmount (no cleanup `useEffect` in the component), so a pending 500 ms callback can `setState` after unmount.

### F-SHOP-011 Add item to the list (with duplicate merge dialog)
- Location: Shop & Budget > List > ADD ITEM > "ADD TO LIST" button or Enter key
- User action: types a name, optionally sets quantity + unit, presses Enter or ADD TO LIST
- Behavior:
  1. Empty search → returns (v6:42518).
  2. `normaliseName` title-cases every word (v6:42506-42510).
  3. `findDuplicateItem` does an exact case-insensitive `lcName` match against the list (v6:42511-42516).
  4. No duplicate → `addShoppingItem(name, quantity||1, unit)`, re-read list, reset search/qty/unit/suggestions (v6:42528-42535).
  5. Duplicate → opens `mergeDialog` `{itemName, existingQty, existingUnit, newQty, newUnit}` (v6:42522-42528).
  6. Dialog is portalled full-screen (`lkPortal`, v6:43268) and Escape-closable (`useEscape`, v6:42433).
  7. Same units → three buttons Cancel / Add Separate / Merge, with a live "Total would be X" line (v6:43300-43303).
  8. Different units → two buttons Cancel / Add Separate plus "Different units detected (a vs b)" (v6:43377-43390).
  9. `handleMerge("merge")` sums `parseFloat(existingQty) + parseFloat(newQty)` into the matching list row and saves (v6:42539-42548).
  10. `handleMerge("separate")` calls `addShoppingItem` with the normalised search text (v6:42549-42551).
  11. Any action closes the dialog and resets the form (v6:42553-42557).
- Components: ShoppingTab; merge dialog inline (v6:43267-43414)
- Functions: `addItem` (v6:42517-42537), `normaliseName` (v6:42506), `findDuplicateItem` (v6:42511), `handleMerge` (v6:42538-42557), `addShoppingItem` (v6:41951), `saveShoppingList` (v6:41948)
- State: `search`, `quantity`, `unit`, `mergeDialog`, `list`
- Storage: writes `lk_shoppingList`
- Status: WORKING
- Evidence: v6:42539-42548 the merge path mutates and persists the correct row.
- Notes: `addShoppingItem` overrides a `"qty"` unit with `smartUnit(itemName)` (v6:41955), so the unit the user picked can silently change. Units offered: qty, kg, g, lb, oz, cup, tbsp, tsp (v6:43148). Duplicate detection is exact-match only, so "Egg" and "Eggs" are separate rows.

### F-SHOP-012 Check off / uncheck a list item
- Location: Shop & Budget > List > category group > item row > checkbox button
- Behavior: `toggleShoppingItem(id)` flips `checked` and saves; the row strikes through and the per-store deep-link chips hide (v6:42562-42565, v6:43208, v6:43231).
- Components: ShoppingTab; Functions: `toggleItem` (v6:42562), `toggleShoppingItem` (v6:41974)
- Storage: writes `lk_shoppingList`
- Status: WORKING — evidence v6:41974-41981.
- Notes: aria-label toggles between "Mark as picked up" / "Mark as not picked up" (v6:43167).

### F-SHOP-013 Remove a single list item
- Location: Shop & Budget > List > item row > "Remove"
- Behavior: `removeShoppingItem(id)` filters by id and saves (v6:42558-42561, v6:41968).
- Status: PARTIAL — evidence v6:42558: no confirmation, unlike Clear Done / Clear All (v6:42750, v6:42775).

### F-SHOP-014 Category grouping of the shopping list
- Location: Shop & Budget > List > category headers
- Behavior: items are bucketed by `item.category` and rendered in the fixed order meat, dairy, produce, pantry, snacks, other, each with an emoji (v6:42611-42617, v6:42623-42625). Empty categories are dropped (v6:42616).
- Functions: `categorizeItem` (v6:41982-41992) assigns the category at insert time by substring matching a hardcoded keyword list.
- Status: WORKING — evidence v6:43158 `sortedCategories.map`.
- Notes: `categorizeItem` is keyword-based English only; "quinoa", "protein powder", "eggs" all fall through to `other` (v6:41982-41992).

### F-SHOP-015 Clear Done
- Location: Shop & Budget > List > summary card > "Clear Done"
- Behavior: `lkConfirm("clearDone", …)` two-tap guard (v6:42750); on the second tap filters out every `checked` item and saves (v6:42753-42755).
- Status: WORKING — evidence v6:42750-42755.

### F-SHOP-016 Clear All
- Location: Shop & Budget > List > summary card > "Clear All"
- Behavior: `lkConfirm("clearShoppingList", …)`; on confirm writes `[]` (v6:42775-42779).
- Status: WORKING — evidence v6:42776-42778.

### F-SHOP-017 Export / share the shopping list
- Location: Shop & Budget > List > summary card > "Export"
- Behavior:
  1. `exportShoppingList()` builds a plain-text list grouped by category with ☑/☐ marks (v6:41993-42011).
  2. If `navigator.share` exists → native share sheet `{title:"Shopping List", text}` (v6:42568-42573).
  3. Otherwise → `navigator.clipboard.writeText`, then `logBetaActivity("shopping_list_exported", {itemCount})` (v6:42574-42580).
- Functions: `exportList` (v6:42566-42583), `exportShoppingList` (v6:41993)
- Status: PARTIAL
- Evidence: v6:42568-42580 — the share path logs nothing and shows no toast; the clipboard path shows no toast either, so the user gets no confirmation the copy happened. `share().catch(function(){})` swallows failures (v6:42572).
- Notes: analytics under-counts exports on any device with `navigator.share` (most phones).

### F-SHOP-018 Per-item store deep links
- Location: Shop & Budget > List > item row > coloured store chips (unchecked items only)
- User action: taps a store chip
- Behavior: `window.open(buildStoreSearchUrl(store, item.itemName), "_blank")` (v6:43236-43238).
- Functions: `buildStoreSearchUrl` (v6:42067-42072)
- Status: WORKING — evidence v6:43236.
- Notes: chips only render when `myStores.length > 0 && !item.checked` (v6:43223). See "Store integrations" below for URL construction.

### F-SHOP-019 "Shop at…" — open the whole list at one store
- Location: Shop & Budget > List > summary card > "Shop at…" dropdown
- User action: taps "Shop at…", picks a store
- Behavior:
  1. Dropdown lists every enabled store with its colour swatch (v6:42836-42875).
  2. `openAllAtStore` takes unchecked items only; returns if none (v6:42586-42590).
  3. Caps at the **first 10 items** (`items.slice(0,10)`, v6:42591).
  4. Opens each in a new tab staggered by `i * 350` ms via `setTimeout` (v6:42592-42596).
  5. Closes the dropdown (v6:42597).
- Functions: `openAllAtStore` (v6:42585-42598), `buildStoreSearchUrl` (v6:42067)
- Status: PARTIAL
- Evidence: v6:42592-42596 — deferred `window.open` calls are outside the user-gesture window, so all but the first are blocked by every mainstream popup blocker. Confirm by running the flow in Safari/Chrome with default settings.
- Notes: the 10-item cap is silent — items 11+ are dropped with no message. No cleanup of the timeouts on unmount.

### F-SHOP-020 List summary header
- Location: Shop & Budget > List > summary card
- Behavior: shows "`unchecked` of `total`" and "items to get" (v6:42793-42815). Card only renders when `totalCount > 0`; otherwise the empty-state card (F-SHOP-008) takes its place (v6:42664).
- Status: WORKING — evidence v6:42793-42800.

### F-SHOP-021 Pantry — add item manually
- Location: Shop & Budget > Pantry > "ADD ITEM" row
- User action: types a name (+ optional qty), taps Add or presses Enter
- Behavior: returns silently on a blank name (v6:43633); otherwise **prepends** `{id:"p_"+Date.now(), name, quantity:parseInt(qty)||1, unit:"", store:"", category:categorizeItem(name), dateAdded, empty:false}` and persists (v6:43634-43645).
- Functions: `addManual` (v6:43632-43645), `set` (v6:43587-43590), `savePantry` (v6:43418)
- Storage: writes `lk_pantryItems`
- Status: PARTIAL — evidence v6:43633 blank name fails silently.
- Notes: manual items get **no `lastBought`**, so `getOverdueStaples` falls back to `dateAdded` (v6:43491). They also lack `lowStock`, which `addToPantry` sets (v6:43457) but nothing ever reads — dead field.

### F-SHOP-022 Pantry — mark out of stock / restocked
- Location: Shop & Budget > Pantry > item row > circular button, and the "OUT OF STOCK" banner "Got it ✓"
- Behavior:
  1. `toggleEmpty` flips `empty`; when it becomes true it also calls `addShoppingItem(name, quantity||1, unit||"qty")` (v6:43621-43631).
  2. Empty items dim to 0.5, strike through, gain a red border and an "OUT → on list" badge (v6:43648-43652, v6:43836-43844, v6:43884).
  3. A red banner at the top lists all empty items with a "Got it ✓" button that calls `toggleEmpty` again (v6:43658-43700).
- Functions: `toggleEmpty` (v6:43621-43631)
- Storage: writes `lk_pantryItems`, `lk_shoppingList`
- Status: PARTIAL
- Evidence: v6:43625 — un-emptying does **not** remove the item from the shopping list, and re-emptying adds a second copy. The banner text claims "added to shopping list" (v6:43672) whether or not that add succeeded.

### F-SHOP-023 Pantry — "+ List"
- Location: Shop & Budget > Pantry > item row > "+ List" (non-empty items only)
- Behavior: `addShoppingItem(name, quantity||1, "")` then `showVoiceToast(name + " → list")` (v6:43926-43930).
- Status: WORKING — evidence v6:43926-43929, `showVoiceToast` at v6:53465.
- Notes: no duplicate check — repeated taps stack duplicate rows.

### F-SHOP-024 Pantry — delete item
- Location: Shop & Budget > Pantry > item row > "×"
- Behavior: `lkConfirm("delPantry"+id, "Tap again to remove this item.")` then filters by id (v6:43614-43620).
- Status: WORKING — evidence v6:43616-43619.

### F-SHOP-025 Pantry — category grouping and All/Staples filter
- Location: Shop & Budget > Pantry > filter pills + category headers
- Behavior: pills are `All (N)` / `★ Staples (N)` (v6:43764-43772); `visiblePantry` filters on `staple` (v6:43646); items are bucketed by `category || "other"` and the keys sorted alphabetically (v6:43648-43656).
- Status: WORKING — evidence v6:43764-43773.
- Notes: pantry categories are alphabetical, unlike the shopping list's fixed order (F-SHOP-014) — inconsistent UX.

### F-SHOP-026 Pantry empty states
- Location: Shop & Budget > Pantry
- Behavior: with no visible items, shows either "★ / No staples yet / Tap the ☆ on any pantry item…" or "🗄️ / Pantry is empty / Scan a receipt in the Budget tab to auto-populate your pantry…" depending on the filter (v6:43774-43800).
- Status: WORKING — evidence v6:43797-43799.

### F-SHOP-027 Staples — mark/unmark a staple (☆/★)
- Location: Shop & Budget > Pantry > item row > star button
- Behavior:
  1. Unmarking sets `staple:false`, keeping `intervalDays` (v6:43593).
  2. Marking picks `i.intervalDays || suggestRestockInterval(name) || 7`, logs `logBetaActivity("staple_marked",{name,intervalDays})` and sets `{staple:true, intervalDays}` (v6:43594-43597).
- Functions: `toggleStaple` (v6:43591-43599), `suggestRestockInterval` (v6:43466-43487)
- Storage: writes `lk_pantryItems`; reads `lk_budgetData`
- Status: WORKING — evidence v6:43594-43597.

### F-SHOP-028 Staples — restock interval suggestion from purchase history
- Location: invisible; runs inside F-SHOP-027
- Behavior:
  1. Reads `getBudgetData().history`; for every history item whose lowercased name contains the pantry name or vice-versa, collects the entry date (v6:43467-43476).
  2. Sorts dates, requires ≥2 (v6:43477-43478).
  3. Computes day gaps, discarding gaps < 2 days (v6:43479-43483).
  4. Returns `clamp(round(mean(gaps)), 3, 60)`, or `null` if no usable gaps (v6:43484-43486).
- Functions: `suggestRestockInterval` (v6:43466-43487)
- Status: WORKING — evidence v6:43485-43486.
- Notes: substring matching is loose — "oat" matches "Oatly Oat Milk" and "Goat Cheese".

### F-SHOP-029 Staples — edit the restock interval
- Location: Shop & Budget > Pantry > staple row > "every Nd" chip
- Behavior: tapping the chip opens a number input seeded with `intervalDays || 7` (v6:43893-43896); Enter or "Set" calls `saveInterval`, which rejects anything outside 1–365 with a toast "Restock interval must be between 1 and 365 days." and keeps the editor open (v6:43600-43612).
- Functions: `saveInterval` (v6:43600-43612)
- Status: WORKING — evidence v6:43604-43607; an in-code comment at v6:43602 records that the silent-drop bug was fixed here.

### F-SHOP-030 Staples — auto-add due items to the shopping list
- Location: invisible; runs on RunningLowCard mount (Home)
- Behavior:
  1. `getOverdueStaples` returns pantry items with `staple && intervalDays` whose `(now - (lastBought||dateAdded)) / 86400000 >= intervalDays`, annotated with `overdueDays` and `onList` (`lastAutoAdded > lastBought`) (v6:43488-43505).
  2. `autoAddDueStaples` filters to `!onList`; for each, a loose name match against the current shopping list (equality or either-way substring) decides whether to `addShoppingItem(name, quantity||1, unit||"")` (v6:43506-43524).
  3. Regardless of whether it was added, `lastAutoAdded = now` is stamped on the pantry row so it does not retry every mount (v6:43525-43528).
  4. If anything was added, `logBetaActivity("restock_auto_added",{names})` (v6:43530).
- Functions: `autoAddDueStaples` (v6:43506-43532), `alreadyListed` (v6:43510-43516), `getOverdueStaples` (v6:43488-43505)
- Storage: reads/writes `lk_pantryItems`, writes `lk_shoppingList`
- Status: WORKING — evidence v6:43518-43528.
- Notes: undatable items (no `lastBought` and no `dateAdded`) are excluded (v6:43492). The loose substring match means a staple named "Oil" is suppressed by any list item containing "oil".

### F-SHOP-031 RUNNING LOW home card
- Location: Home > modular card slot `restock` (rendered at v6:26663)
- User action: taps "Bought" on a row
- Behavior:
  1. On mount, `useEffect` runs `autoAddDueStaples()` then bumps a `tick` to force a re-render (v6:43544-43547).
  2. Renders nothing when nothing is overdue (v6:43549).
  3. Each row shows the name and "`N`d overdue" or "due now", plus " · on your list" when `onList` (v6:43569).
  4. "Bought" calls `markStapleBought(id)` (sets `lastBought = now`, `empty = false`), bumps `tick`, and logs `logBetaActivity("staple_restocked",{name})` (v6:43571-43575, v6:43533-43541).
- Components: RunningLowCard (v6:43542-43577)
- Storage: writes `lk_pantryItems`
- Status: WORKING — evidence v6:26663 the card is wired into the Home card registry.
- Notes: `tick` is set but never read in the render body (v6:43543) — it exists purely as a re-render trigger; the initial mount effect therefore causes a guaranteed double render.

### F-SHOP-032 Receipt → pantry population
- Location: invisible; runs from BudgetTab "Confirm & Save" (F-BUDG-006)
- Behavior:
  1. For each parsed item with a non-empty name, searches the pantry case-insensitively, **preferring a `staple`-flagged match** over the first match (v6:43427-43437).
  2. Existing → sets `lastBought = now`, `empty = false`, `quantity = item.qty || existing.quantity || 1`, and `store` when given (v6:43438-43443).
  3. New → pushes `{id:"p_"+Date.now()+"_"+rand, name, quantity, unit:"", store, category:categorizeItem(name), dateAdded, lastBought, lowStock:false}` (v6:43444-43456).
  4. Persists (v6:43459).
- Functions: `addToPantry` (v6:43421-43462)
- Storage: writes `lk_pantryItems`
- Status: WORKING — evidence v6:43438-43443, the staple-preferring merge is deliberate (comment v6:43424-43427).
- Notes: this is the only path that resets a staple's restock clock automatically.

### F-BUDG-001 Weekly budget target
- Location: Shop & Budget > Budget > "WEEKLY BUDGET" card > Edit
- User action: taps Edit, types a number, taps Save
- Behavior: `saveTarget` parses a float; `NaN` or negative shows the toast "Enter a weekly budget of 0 or more." and keeps the editor open (v6:44025-44030); otherwise merges `weeklyTarget` into `budgetData` and closes (v6:44031-44036).
- Functions: `saveTarget` (v6:44025-44036), `setData` (v6:43999-44002), `saveBudgetData` (v6:43971)
- Storage: writes `lk_budgetData`
- Status: WORKING — evidence v6:44026-44029.

### F-BUDG-002 Weekly spend meter
- Location: Shop & Budget > Budget > "WEEKLY BUDGET" card
- Behavior:
  1. Week window = current Sunday 00:00 → +7 days (v6:44005-44011).
  2. `weekSpent = Σ h.total` over that window (v6:44016-44018).
  3. `pct = min(weekSpent / weeklyTarget * 100, 100)`; `overBudget = target > 0 && weekSpent > target` (v6:44019-44020).
  4. Big figure `$weekSpent` turns red when over; subtitle is "of $target" or "No target set" (v6:44446-44462).
  5. Bar colour: red gradient when over, amber above 75 %, green otherwise (v6:44474-44476).
  6. Footer shows "$X over budget" or "$X remaining", plus "`N`%" (v6:44487-44503).
- Status: WORKING — evidence v6:44474-44497.
- Notes: the bar caps at 100 % but the "over budget" figure is uncapped (v6:44019 vs v6:44490).

### F-BUDG-003 Month + purchase-count tiles
- Location: Shop & Budget > Budget > "THIS MONTH" / "PURCHASES" tiles
- Behavior: `monthSpent` = Σ totals of history entries dated ≥ the 1st of the current month (v6:44021-44024); "PURCHASES" shows `thisWeek.length` — a **week** count sitting next to a **month** figure (v6:44543).
- Status: PARTIAL — evidence v6:44543 `thisWeek.length` under a card whose sibling is monthly; the tile is unlabelled as to period.

### F-BUDG-004 Log a purchase manually
- Location: Shop & Budget > Budget > "+ Add Purchase" → "LOG PURCHASE" form
- User action: item name, price, qty, store select, "Add to History"
- Behavior:
  1. Missing name or unparseable price → toast "Give the purchase a name and a price." (v6:44041-44044).
  2. Builds `{id:"p_"+Date.now(), items:[{name,price,qty}], store: addStore || "Unknown", date, total: price*qty, source:"manual"}` (v6:44045-44056).
  3. Prepends to `history`, persists, clears the form and closes it (v6:44057-44065).
- Functions: `addPurchase` (v6:44037-44065)
- State: `addName`, `addPrice`, `addQty`, `addStore`, `showAdd`
- Storage: writes `lk_budgetData`
- Status: WORKING — evidence v6:44045-44060.
- Notes: the store `<select>` is built from enabled stores plus a literal "Other" option (v6:44757-44764). Negative prices are accepted.

### F-BUDG-005 Receipt scan (camera or library) → `/parse-receipt`
- Location: Shop & Budget > Budget > "SCAN RECEIPT" tile > Camera / Library
- User action: taps Camera (`capture="environment"`) or Library, picks an image
- Behavior:
  1. Two hidden `<input type="file" accept="image/*">`, one with `capture="environment"` (v6:44643-44661).
  2. `handleReceiptPhoto` sets `receiptLoading`, clears the input value so the same file can be re-picked (v6:44068-44072).
  3. `FileReader.readAsDataURL`; splits the data URL into `rawB64` (v6:44073-44077).
  4. POST `https://lockedapi.cescocugliari.workers.dev/parse-receipt`, `Content-Type: application/json`, body `{base64: <full data URL>, image: <bare base64>, mime}` — the image is sent **twice** in two encodings (v6:44078-44090).
  5. Non-2xx throws `HTTP <status>` (v6:44091).
  6. `extractReceiptJson(d)` normalises the response (see "Receipt parsing").
  7. On `success`: each item is coerced to `{name: it.name||it.item||"Item", price: parseFloat(it.price||it.cost||0)||0, qty: parseFloat(it.qty||it.quantity||1)||1, category: it.category||""}` (v6:44099-44107); a missing total is recomputed as `Σ price*qty` (v6:44108-44113); total is rounded to cents; store defaults to "Unknown" (v6:44114-44115); result goes into `pendingReceipt`.
  8. `ocr_failure` → pending receipt carrying "No items detected. Try a clearer, well-lit photo of the entire receipt." (v6:44117-44124).
  9. `backend_error` → "Receipt service temporarily unavailable. Please try again." (v6:44125-44131).
  10. Any other status → "Could not process receipt. Try again." (v6:44132-44138).
  11. `.catch` → "Scan failed: `<message>`. Try again." (v6:44140-44148).
  12. `reader.onerror` → "Could not read image file." (v6:44149-44157).
- Functions: `handleReceiptPhoto` (v6:44066-44155), `extractReceiptJson` (v6:44156-44241)
- State: `receiptLoading`, `pendingReceipt`, `fileRef`, `receiptLibRef`
- Network: POST `/parse-receipt`
- AI: server-side vision OCR. The client's fallback parser strips ```` ```json ```` fences and reads `d.content[0].text` (v6:44175-44177, v6:44199-44200), which is the Anthropic Messages API response shape — the worker is proxying a Claude vision call. **No model id, system prompt or key appears client-side.**
- Edge cases: both buttons disabled while `receiptLoading`; tile label flips to "SCANNING…" (v6:44583, v6:44596, v6:44620)
- Gating: always on
- Status: UNVERIFIED
- Evidence: v6:44078 the endpoint is called unconditionally, but the worker's contract is not in this file. Confirm with a real POST carrying a receipt image.
- Notes: no size limit or downscaling — a full-resolution phone photo is base64'd **twice** into one JSON body (v6:44085-44089), roughly 2.6× the file size; a 5 MB photo becomes a ~18 MB request. No auth on the request. No timeout: a hung request leaves "SCANNING…" forever.

### F-BUDG-006 Confirm receipt → history + pantry
- Location: Shop & Budget > Budget > "CONFIRM RECEIPT" card
- User action: optionally picks a store from the dropdown, taps "Confirm & Save" (or "Cancel")
- Behavior:
  1. The card lists each item as "`qty`x `name`" with "$price" and a Total row (v6:44827-44875).
  2. A store `<select>` seeded with `receiptStore || pendingReceipt.store`, options = "Unknown store" + enabled stores (v6:44805-44826).
  3. `confirmReceipt` resolves the store, recomputes a fallback total, builds `{id:"r_"+Date.now(), items, store, date, total: pendingReceipt.total || computed, source:"receipt"}` and prepends it to history (v6:44242-44259).
  4. Calls `addToPantry(items, store)` (v6:44260) — F-SHOP-032.
  5. Clears `pendingReceipt` and `receiptStore` (v6:44261-44262).
  6. Cancel just clears `pendingReceipt` (v6:44880-44882).
  7. When `pendingReceipt.error` is set, only the error text and Cancel render — "Confirm & Save" is hidden (v6:44790-44795, v6:44896).
- Functions: `confirmReceipt` (v6:44242-44263)
- Storage: writes `lk_budgetData`, `lk_pantryItems`
- Status: WORKING — evidence v6:44250-44260.
- Notes: parsed items are not editable — a mis-OCR'd price can only be accepted or the whole scan discarded. The store dropdown lacks the free-text "Other" option that F-BUDG-004 has.

### F-BUDG-007 Import checked shopping-list items as a pending purchase — DEAD
- Location: none — no UI renders it
- Behavior (as written): takes `checked` shopping-list items, maps them to `{name, price:0, qty}`, builds `{id:"sl_"+Date.now(), items, store:"Shopping List", date, total:0, source:"shopping_list", needsPrices:true}` and appends it to `data.pendingItems` (v6:44264-44289).
- Functions: `importCheckedItems` (v6:44264-44289)
- Storage: would write `lk_budgetData.pendingItems`
- Status: DEAD
- Evidence: `grep -n "importCheckedItems"` matches only its definition at v6:44264 — no call site anywhere in the 58k-line file. `pendingItems` is likewise only initialised (v6:43968) and appended here (v6:44286); it is never rendered or read.
- Notes: the history renderer has a `source === "shopping_list"` → "LIST" badge branch (v6:44989) that is therefore unreachable. Redesign should either wire this up or delete `pendingItems` and `needsPrices` entirely.

### F-BUDG-008 Smart Savings — AI cheaper swaps (bare-root AI call)
- Location: Shop & Budget > Budget > "SMART SAVINGS" > "Find Cheaper Swaps"
- User action: taps the link (card only renders when `thisWeek.length > 0`, v6:44911)
- Behavior:
  1. Returns immediately if the week is empty (v6:44291).
  2. Builds `recentItems` = for every this-week item with `price > 0`, the string `"<name> ($<price> at <store|unknown>)"` (v6:44293-44299).
  3. Builds `storeNames` = enabled stores as `"Name (description)"` joined by ", " (v6:44300-44302).
  4. POST `https://lockedapi.cescocugliari.workers.dev/` with `{system, messages:[{role:"user",content}], max_tokens:500}` (v6:44303-44317).
     - system: "You are a budget grocery advisor. The user shops at: `<storeNames>`. Suggest cheaper alternatives for their recent purchases. For each swap, name the specific cheaper product and which store. Return ONLY a JSON array: [{\"original\":…,\"swap\":…,\"store\":…,\"savings\":\"$X.XX\"}]. Max 6 swaps. No explanation, raw JSON array only." (v6:44306)
     - user: "My recent purchases:\n`<lines>`\n\nMy weekly budget: $`<target|not set>`. I've spent $`<weekSpent>` this week. Suggest cheaper swaps." (v6:44308-44310)
  5. Response: `d.content[0].text || "[]"`, first `[...]` block `JSON.parse`d; parse failure → `setSwaps([])` (v6:44318-44328).
  6. `.catch` → `setSwaps(null)` (explicitly *not* `[]`) plus the toast "Couldn't check for swaps. Check your connection and try again." (v6:44329-44333).
  7. Renders each swap as struck-through original / "save $X" / bold swap / orange store (v6:44946-44984). `swaps.length === 0` renders "No cheaper alternatives found. You're already shopping smart!" (v6:44985-44990).
- Functions: `getSwaps` (v6:44290-44333)
- AI: bare-root worker endpoint, Anthropic Messages request/response shape (`system` + `messages` in, `content[0].text` out). **Model is chosen server-side and is not visible client-side.** max_tokens 500.
- Status: UNVERIFIED
- Evidence: v6:44303 posts to the worker root; nothing in this file establishes the route's behaviour. Confirm with a POST to the root URL.
- Notes: unauthenticated. Prices are AI-invented, not looked up — the "save $X.XX" figure is a hallucination presented as fact. Store descriptions the user typed are injected into the system prompt (v6:44306). The `swaps === null` vs `[]` distinction is a deliberate fix noted in a code comment (v6:44330-44331).

### F-BUDG-009 Price comparison across stores (bare-root AI call)
- Location: Shop & Budget > Budget > "PRICE COMPARISON" card (renders only when `myStores.length >= 2`, v6:44899)
- User action: types an item, taps Compare or presses Enter
- Behavior:
  1. Returns if the input is blank or fewer than 2 enabled stores (v6:44335).
  2. POST to the worker root with `{system, messages, max_tokens:400}` (v6:44341-44355).
     - system: "You are a grocery price comparison expert. Compare prices of a product across stores. Return ONLY a JSON array sorted cheapest first: [{\"store\":…,\"product\":…,\"price\":\"$X.XX\",\"note\":…}]. Use realistic prices for each store. No explanation, raw JSON array only." (v6:44344)
     - user: "Compare prices for \"`<item>`\" across these stores: `<storeNames>`" (v6:44346)
  3. Same `content[0].text` → first `[...]` → `JSON.parse` extraction; failure → `[]` (v6:44356-44365).
  4. `.catch` → `setCompareResults(null)` + toast "Couldn't compare prices. Check your connection and try again." (v6:44366-44369).
  5. Row 0 is highlighted green with a "BEST" badge (v6:44779-44787 style, badge v6:44790).
- Functions: `comparePrices` (v6:44334-44369)
- AI: same bare-root endpoint, max_tokens 400
- Status: UNVERIFIED — evidence v6:44341; endpoint contract unproven.
- Notes: the system prompt literally instructs the model to invent plausible prices ("Use realistic prices for each store", v6:44344) and the UI then labels one of them "BEST". This is fabricated pricing shown as a shopping recommendation — the single highest-risk behaviour in this module. `compareResults.length === 0` renders nothing at all (v6:44770 requires `> 0`), so an empty result looks like a dead button.

### F-BUDG-010 Purchase history with week / month / all / receipts filters
- Location: Shop & Budget > Budget > "HISTORY" card
- User action: taps Week / Month / All / 🧾 Receipts
- Behavior:
  1. `filteredHistory` = `thisWeek`, `thisMonth`, all history, or `history.filter(source === "receipt")` (v6:44376-44380).
  2. Each entry renders store name, a source badge RECEIPT / LIST / MANUAL, `$total`, a delete "x", and the date as "Mon, Jan 5" (v6:44975-45010).
  3. Item lines: all items in the receipts view, otherwise the first 3 (v6:45011-45023).
  4. Outside the receipts view, entries with > 3 items append a "`N` items" line (v6:45024-45031).
- Functions: `deleteEntry` (v6:44370-44375)
- Storage: writes `lk_budgetData`
- Status: PARTIAL
- Evidence: v6:45024-45031 — the overflow line prints the *total* item count ("7 items"), not the remainder, directly under 3 already-listed items, so it reads as a contradiction.
- Notes: delete has no confirmation (v6:45000). Empty state: "No purchases logged yet. Add a purchase or scan a receipt to start tracking." (v6:44963-44968). The "LIST" badge branch is unreachable (see F-BUDG-007).

### F-SHOP-032b MealPlannerTab — dead duplicate meal planner
- Location: none — the component is never rendered
- User action (as written): "+ New Plan" → days (3/5/7) × meals/day (2–5) + diet + budget text → "Generate Meal Plan"; plan cards open a day-by-day detail view with "+ Shopping List"
- Behavior (as written):
  1. `buildMealContext` assembles a calorie/macro/goal/store/budget context string from `lk_fuelProfile` (falling back to `lk_profile` and `calcTDEE`), enabled store names+descriptions, `getBudgetData().weeklyTarget`, and the two free-text prefs (v6:45253-45274).
  2. `generatePlan` computes the upcoming day names and POSTs to the worker root with `{system, messages, max_tokens:4096}` (v6:45288-45303). The system prompt pins the per-day kcal target, the 30/30/30/10 split, and a full JSON schema `{name, days:[{day, meals:[{name,title,ingredients:[{item,amount}],totalCal,totalProtein,totalCarb,totalFat}]}], shoppingList:[{item,amount,category}]}` and demands store-specific product names (v6:45291).
  3. Response handling: first `{...}` block, then a **brace/bracket-balancing repair loop** that appends missing `]` and `}` before `JSON.parse` (v6:45312-45325).
  4. On success stamps `id:"mp_"+Date.now()`, `created`, `daysCount`, `mealsPerDay`, prepends to plans, opens it (v6:45326-45333).
  5. Four distinct failure toasts: "No response from the planner…", "The planner returned something unreadable. Try fewer days.", "The plan came back empty. Try again.", "Couldn't reach the planner…" (v6:45309-45345).
  6. `addToShopping` dedupes by the first 6 characters of the lowercased name, runs `parseIngredient` over "`amount` `name`", pushes rows flagged `fromMealPlan:true`, and toasts "`N` items added to shopping list (`M` already on list)" (v6:45347-45379).
  7. `deletePlan` uses a native `confirm()` (v6:45880).
- Components: MealPlannerTab (v6:45234-45906)
- Functions: `setPlans` (v6:45249), `buildMealContext` (v6:45253), `generatePlan` (v6:45275), `addToShopping` (v6:45347), `deletePlan` (v6:45380)
- Storage: reads `lk_fuelProfile`, `lk_profile`, `lk_myStores`, `lk_budgetData`; writes `lk_mealPlans`, `lk_shoppingList`
- Network / AI: POST worker root, max_tokens 4096
- Status: DEAD
- Evidence: `grep -n "MealPlanner"` returns only the definition at v6:45234 — there is no `React.createElement(MealPlannerTab, …)` anywhere. The live meal planner is `MealPlanFuelTab` (v6:37469), which reads the same `lk_mealPlans` key (v6:37471).
- Notes: ~670 lines of dead code sharing storage with the live planner. Only the dead copy uses `confirm()` (v6:45880) instead of `lkConfirm`; only the dead copy dedupes on a 6-character prefix, which will wrongly suppress e.g. "Chicken Breast" vs "Chicken Thighs" (v6:45355). The redesign should delete this and keep one planner.

---

# PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| MyStoresTab | component | v6:42079-42419 | Store list: quick-add presets, custom form, toggle, delete | ShoppingBudgetTab (v6:46127) | getMyStores, saveMyStores, addPreset, addManual, toggleStore, deleteStore | F-SHOP-002…006 |
| setStores | handler | v6:42087-42090 | Set state + persist stores | addPreset, addManual, toggleStore, deleteStore | saveMyStores | F-SHOP-002…005 |
| addPreset | handler | v6:42091-42106 | Add a STORE_PRESETS entry | preset chip onClick (v6:42165) | setStores | F-SHOP-002 |
| addManual (stores) | handler | v6:42107-42126 | Add a user-typed store | "Add Store" onClick (v6:42341) | setStores | F-SHOP-003 |
| toggleStore | handler | v6:42127-42133 | Flip `enabled` | ON/OFF pill (v6:42222) | setStores | F-SHOP-004 |
| deleteStore | handler | v6:42134-42138 | Remove a store by id | trash button (v6:42239) | setStores | F-SHOP-005 |
| ShoppingTab | component | v6:42420-43414 | Shopping list screen | ShoppingBudgetTab (v6:46125) | all handlers below | F-SHOP-007…020 |
| handleSearchChange | handler | v6:42435-42500 | Local typeahead + debounced /store-search fan-out | search input onChange (v6:42984) | fetch /store-search, setSuggestions | F-SHOP-009, F-SHOP-010 |
| selectSuggestion | handler | v6:42501-42505 | Fill the input from a suggestion row | suggestion button (v6:43053) | clearTimeout | F-SHOP-009 |
| normaliseName | function | v6:42506-42510 | Title-case an item name | addItem, handleMerge | — | F-SHOP-011 |
| findDuplicateItem | function | v6:42511-42516 | Exact case-insensitive list lookup | addItem | lcName | F-SHOP-011 |
| addItem | handler | v6:42517-42537 | Add or open the merge dialog | ADD TO LIST / Enter (v6:42987, v6:43156) | normaliseName, findDuplicateItem, addShoppingItem | F-SHOP-011 |
| handleMerge | handler | v6:42538-42557 | Resolve merge / separate / cancel | dialog buttons (v6:43318, v6:43334, v6:43350, v6:43394, v6:43408) | saveShoppingList, addShoppingItem | F-SHOP-011 |
| removeItem | handler | v6:42558-42561 | Delete one list item | "Remove" (v6:43214) | removeShoppingItem | F-SHOP-013 |
| toggleItem | handler | v6:42562-42565 | Check/uncheck a list item | checkbox (v6:43169) | toggleShoppingItem | F-SHOP-012 |
| exportList | handler | v6:42566-42583 | Share or copy the list as text | "Export" (v6:42879) | exportShoppingList, navigator.share/clipboard, logBetaActivity | F-SHOP-017 |
| openAllAtStore | handler | v6:42585-42598 | Open up to 10 items at one store | "Shop at…" menu row (v6:42840) | buildStoreSearchUrl, window.open | F-SHOP-019 |
| quickAdd | handler | v6:42619-42622 | Add a FITNESS_PICKS entry | pick chip (v6:42639), ADD ALL (v6:42726) | addShoppingItem | F-SHOP-007, F-SHOP-008 |
| getPantry | function | v6:43415-43417 | Read `lk_pantryItems` | PantryTab, addToPantry, getOverdueStaples, autoAddDueStaples, markStapleBought | ld | F-SHOP-021… |
| savePantry | function | v6:43418-43420 | Write `lk_pantryItems` | addToPantry, autoAddDueStaples, markStapleBought, PantryTab.set | sd | F-SHOP-021… |
| addToPantry | function | v6:43421-43462 | Merge receipt items into the pantry; reset staple clocks | confirmReceipt (v6:44260) | getPantry, categorizeItem, savePantry | F-SHOP-032 |
| suggestRestockInterval | function | v6:43466-43487 | Mean purchase gap (3–60 d) from budget history | toggleStaple (v6:43595) | getBudgetData | F-SHOP-028 |
| getOverdueStaples | function | v6:43488-43505 | Staples past their interval, with overdueDays/onList | autoAddDueStaples, RunningLowCard | getPantry | F-SHOP-030, F-SHOP-031 |
| autoAddDueStaples | function | v6:43506-43532 | Auto-add due staples once per cycle | RunningLowCard useEffect (v6:43545) | getOverdueStaples, getShoppingList, addShoppingItem, savePantry, logBetaActivity | F-SHOP-030 |
| alreadyListed | function | v6:43510-43516 | Loose name match against the shopping list | autoAddDueStaples | lcName-style inline compare | F-SHOP-030 |
| markStapleBought | function | v6:43533-43541 | Stamp lastBought, clear empty | RunningLowCard "Bought" (v6:43571) | getPantry, savePantry | F-SHOP-031 |
| RunningLowCard | component | v6:43542-43577 | Home card for overdue staples | Home card registry (v6:26663) | autoAddDueStaples, getOverdueStaples, markStapleBought, logBetaActivity | F-SHOP-031 |
| PantryTab | component | v6:43578-43963 | Pantry inventory screen | ShoppingBudgetTab (v6:46126) | handlers below | F-SHOP-021…029 |
| set (pantry) | handler | v6:43587-43590 | Set state + persist pantry | toggleStaple, saveInterval, remove, toggleEmpty, addManual | savePantry | F-SHOP-021…027 |
| toggleStaple | handler | v6:43591-43599 | Mark/unmark staple, seed interval | ☆/★ button (v6:43917) | suggestRestockInterval, logBetaActivity, set | F-SHOP-027 |
| saveInterval | handler | v6:43600-43612 | Validate + save restock interval (1–365) | "Set" / Enter (v6:43897, v6:43904) | LOCKED.toast, set | F-SHOP-029 |
| remove (pantry) | handler | v6:43614-43620 | Two-tap delete a pantry item | "×" (v6:43935) | lkConfirm, set | F-SHOP-024 |
| toggleEmpty | handler | v6:43621-43631 | Flip out-of-stock; add to list on empty | circle button (v6:43819), "Got it ✓" (v6:43687) | addShoppingItem, set | F-SHOP-022 |
| addManual (pantry) | handler | v6:43632-43645 | Add a pantry item by hand | "Add" / Enter (v6:43722, v6:43757) | categorizeItem, set | F-SHOP-021 |
| getBudgetData | function | v6:43964-43970 | Read `lk_budgetData` (default `{weeklyTarget:0,history:[],pendingItems:[]}`) | BudgetTab, ShoppingBudgetTab, suggestRestockInterval, buildMealContext | ld | F-BUDG-* |
| saveBudgetData | function | v6:43971-43973 | Write `lk_budgetData` | BudgetTab.setData | sd | F-BUDG-* |
| BudgetTab | component | v6:43974-45227 | Budget screen: target, receipts, AI swaps/compare, history | ShoppingBudgetTab (v6:46128) | handlers below | F-BUDG-001…010 |
| setData | handler | v6:43999-44002 | Set state + persist budget data | saveTarget, addPurchase, confirmReceipt, importCheckedItems, deleteEntry | saveBudgetData | F-BUDG-* |
| saveTarget | handler | v6:44025-44036 | Validate + save the weekly target | "Save" (v6:44435) | LOCKED.toast, setData | F-BUDG-001 |
| addPurchase | handler | v6:44037-44065 | Log a manual purchase | "Add to History" (v6:44766) | LOCKED.toast, setData | F-BUDG-004 |
| handleReceiptPhoto | handler | v6:44066-44155 | Read image, POST /parse-receipt, stage the result | both hidden file inputs (v6:44647, v6:44656) | FileReader, fetch, extractReceiptJson | F-BUDG-005 |
| extractReceiptJson | function | v6:44156-44241 | Normalise many possible worker shapes into success/ocr_failure/backend_error | handleReceiptPhoto | JSON.parse | F-BUDG-005 |
| confirmReceipt | handler | v6:44242-44263 | Commit the staged receipt to history + pantry | "Confirm & Save" (v6:44884) | setData, addToPantry | F-BUDG-006 |
| importCheckedItems | function | v6:44264-44289 | Turn checked list items into a pendingItems entry | **nobody — dead** | getShoppingList, setData | F-BUDG-007 |
| getSwaps | handler | v6:44290-44333 | AI cheaper-swap suggestions | "Find Cheaper Swaps" (v6:44930) | fetch worker root, LOCKED.toast | F-BUDG-008 |
| comparePrices | handler | v6:44334-44369 | AI cross-store price comparison | "Compare" / Enter (v6:44736, v6:44755) | fetch worker root, LOCKED.toast | F-BUDG-009 |
| deleteEntry | handler | v6:44370-44375 | Remove one history entry | "x" (v6:45000) | setData | F-BUDG-010 |
| getMealPlans | function | v6:45228-45230 | Read `lk_mealPlans` | MealPlannerTab (dead), MealPlanFuelTab (v6:37471, out of range) | ld | F-SHOP-032b |
| saveMealPlans | function | v6:45231-45233 | Write `lk_mealPlans` | MealPlannerTab.setPlans | sd | F-SHOP-032b |
| MealPlannerTab | component | v6:45234-45906 | Dead duplicate meal planner | **nobody** | handlers below | F-SHOP-032b |
| setPlans | handler | v6:45249-45252 | Set state + persist plans | generatePlan, deletePlan | saveMealPlans | F-SHOP-032b |
| buildMealContext | function | v6:45253-45274 | Build the calorie/macro/store/budget prompt context | generatePlan | ld, calcTDEE, getBudgetData | F-SHOP-032b |
| generatePlan | handler | v6:45275-45346 | POST worker root, repair + parse the plan JSON | "Generate Meal Plan" (v6:45772) | fetch, JSON.parse, setPlans, LOCKED.toast | F-SHOP-032b |
| addToShopping | handler | v6:45347-45379 | Push a plan's shoppingList onto the shopping list | "+ Shopping List" / "Add All" / "+ List" (v6:45411, v6:45613, v6:45857) | getShoppingList, parseIngredient, categorizeItem, saveShoppingList, LOCKED.toast | F-SHOP-032b |
| deletePlan | handler | v6:45380-45385 | Remove a saved plan | "×" (v6:45865) | setPlans | F-SHOP-032b |
| FITNESS_PICKS | const | v6:45907-45967 | 12 hardcoded fitness grocery picks | ShoppingTab | — | F-SHOP-007, F-SHOP-008 |
| ShoppingBudgetTab | component | v6:45968-46128 | Hub shell: 4 sub-tabs + status pills | Fuel hub (v6:37075), app router (v6:57702) | useHubState, getShoppingList, getBudgetData | F-SHOP-001 |
| PRESET_SUPPS / SUPP_TIMES / SUPP_FREQ | const | v6:46129-46131 | Supplement constants — **supplements module, not shopping** | SupplementsTab (out of range) | — | out of scope |
| getSuppLog | function | v6:46132-46134 | Read `lk_suppLog` — supplements module | supplements UI (out of range) | ld | out of scope |
| markSuppTaken | function | v6:46135-46142 | Mark a supplement taken today — supplements module | supplements UI | getSuppLog, isoDay, sd | out of scope |
| isSuppTaken | function | v6:46143-46147 | Was a supplement taken on a date — supplements module | supplements UI | getSuppLog, isoDay | out of scope |
| getSuppStreak | function | v6:46148-46160 | Consecutive-day streak — supplements module | supplements UI | getSuppLog, isoDay | out of scope |
| getDueSupps | function | v6:46161-46184 | Supplements due by time-of-day/frequency — supplements module | SuppReminderCard (v6:46185+) | ld, getSuppLog, isoDay | out of scope |

Totals: **46 functions/handlers/components owned by this module** (v6:42079-46128) plus **9 supplement-module symbols** that fall inside the numeric range (v6:46129-46184) and belong to another agent's scope.

---

## Data models

**Shopping list item** — array under `lk_shoppingList`; written by `addShoppingItem` (v6:41951-41967):
```
{ id: "sh_" + Date.now() + "_" + base36rand,   // v6:41953
  itemName: string,                             // v6:41957
  quantity: number,                             // v6:41958
  unit: string,        // the caller's unit, or smartUnit(name) when "qty"  v6:41955
  category: "meat"|"dairy"|"produce"|"pantry"|"snacks"|"other",  // v6:41952,41982
  dateAdded: ISO string,                        // v6:41960
  checked: boolean }                            // v6:41961
```
Meal-plan-sourced rows add `fromMealPlan: true` and use id prefix `"sh_"+(ts+idx)+"_"+rand` (v6:45362-45372).

**Pantry item** — array under `lk_pantryItems`. Receipt-created shape (v6:43444-43456):
```
{ id: "p_" + Date.now() + "_" + rand, name, quantity, unit: "",
  store: string, category: <categorizeItem>, dateAdded: ISO,
  lastBought: ISO, lowStock: false }
```
Manual shape omits `lastBought` and `lowStock` and adds `empty:false` (v6:43635-43643).
Optional fields added later: `empty` (v6:43628), `staple` (v6:43596), `intervalDays` (v6:43596/43609), `lastAutoAdded` (v6:43527). `lowStock` is written but never read — dead field.

**Budget entry** — element of `lk_budgetData.history`:
```
{ id: "p_"|"r_"|"sl_" + Date.now(),
  items: [{ name, price: number, qty: number, category?: string }],
  store: string,        // display name, not an id
  date: ISO string,
  total: number,
  source: "manual" | "receipt" | "shopping_list",
  needsPrices?: true }   // shopping_list only, dead
```
manual v6:44045-44056, receipt v6:44250-44257, shopping_list v6:44272-44280.
Container: `{ weeklyTarget: number, history: [], pendingItems: [] }` (v6:43964-43970).

**Store** — element of `lk_myStores` (v6:42097-42104, v6:42113-42120):
```
{ id: "store_" + Date.now(), name, url, description, color, enabled: boolean }
```
Presets carry only `{name, url, description}` (v6:42026-42066); `color` comes from `STORE_PALETTE` (v6:42025) by index modulo 10.

**Receipt (staged `pendingReceipt`)** — never persisted in this shape:
```
{ store: string,                   // "Unknown" default, v6:44114
  items: [{ name, price, qty, category }],   // v6:44100-44106
  total: number,                   // recomputed + rounded to cents, v6:44108-44113
  error?: string }                 // v6:44121, 44128, 44135, 44144, 44153
```

---

## Store integrations

`STORE_PATTERNS` (v6:41995-42024) maps a domain substring to a search-URL prefix. `buildStoreSearchUrl(store, query)` iterates the map, returns the first prefix whose key appears anywhere in `store.url`, and appends `encodeURIComponent(query)`; with no match it falls back to `store.url` (trailing slash stripped) + `"/search?q=" + encodeURIComponent(query)` (v6:42067-42072).

| Retailer | Domain key | URL built | Preset? | Real integration? |
|---|---|---|---|---|
| Walmart | walmart.com | `https://www.walmart.com/search?q=<q>` (v6:41996) | yes (v6:42027) | No — public web search URL |
| Amazon | amazon.com | `https://www.amazon.com/s?k=<q>` (v6:41997) | yes (v6:42031) | No |
| Amazon Fresh | fresh.amazon.com | `https://www.amazon.com/s?k=<q>` (v6:42023) | no | No — and it points at plain Amazon, not Fresh |
| Target | target.com | `https://www.target.com/s?searchTerm=<q>` (v6:41998) | yes (v6:42035) | No |
| Costco | costco.com | `https://www.costco.com/CatalogSearch?keyword=<q>` (v6:41999) | yes (v6:42039) | No |
| Whole Foods | wholefoodsmarket.com | `https://www.wholefoodsmarket.com/search?text=<q>` (v6:42000) | yes (v6:42043) | No |
| Kroger | kroger.com | `https://www.kroger.com/search?query=<q>` (v6:42001) | yes (v6:42047) | No |
| Trader Joe's | traderjoes.com | `https://www.traderjoes.com/home/search#?q=<q>` (v6:42002) | yes (v6:42055) | No — fragment-based, needs client JS to act on it |
| Safeway | safeway.com | `https://www.safeway.com/shop/search-results.html?q=<q>` (v6:42003) | yes (v6:42063) | No |
| Albertsons | albertsons.com | `https://www.albertsons.com/shop/search-results.html?q=<q>` (v6:42004) | **no preset** | No — reachable only by typing the URL manually (F-SHOP-003) |
| Publix | publix.com | `https://www.publix.com/shopping/product-search#/q=<q>` (v6:42005) | **no preset** | No — fragment-based |
| Instacart | instacart.com | `https://www.instacart.com/store/search_v3/<q>` (v6:42006) | yes (v6:42051) | No — path-segment search; `search_v3` is an undocumented internal route |
| Aldi | aldi.us | `https://www.aldi.us/en/search/?q=<q>` (v6:42007) | yes (v6:42059) | No |
| Any other domain | — | `<store.url>/search?q=<q>` (v6:42071) | n/a | No — a guess that fails on most sites |

**None of these is an API integration.** There is no OAuth, no cart API, no basket handoff, no affiliate parameter, no price feed. Every link is a `window.open` to a public search page (v6:43236, v6:42594). The only server-mediated store feature is `/store-search` (F-SHOP-010), which takes only a bare domain string and a query — the worker has no store credentials from the client.

Matching is `store.url.indexOf(domain) >= 0`, so a custom store at `https://mygrocer.com/blog/walmart-vs-target` would be routed to Walmart (v6:42069).

---

## Receipt parsing — `/parse-receipt` end to end

**Request** (v6:44078-44090):
```
POST https://lockedapi.cescocugliari.workers.dev/parse-receipt
Content-Type: application/json
{ "base64": "data:image/jpeg;base64,AAAA…",   // full data URL
  "image":  "AAAA…",                           // same bytes, bare base64
  "mime":   "image/jpeg" }                     // file.type or the jpeg default
```
No auth header, no user id, no size cap, no timeout, no downscaling. The payload carries the image twice (v6:44085-44089).

**Transport handling**: `!r.ok` → `throw new Error("HTTP "+status)` → the `.catch` branch (v6:44091, v6:44140).

**Response normalisation** — `extractReceiptJson(d)` (v6:44156-44241), tried in order:
1. Falsy `d` → `backend_error` / "Empty response from server" (v6:44161-44165).
2. `d.items` is an array → `success`, or `ocr_failure` when it is empty (v6:44166-44175).
3. `d.content[0].text || d.content[0].content` (the Anthropic Messages shape) (v6:44176-44179).
4. `d.text || d.result || d.output || d.response || d.message` (v6:44180).
5. `d.data`: object with `items` → success / ocr_failure; string → treat as text (v6:44181-44190).
6. No text → `backend_error` / "Unrecognized response format" (v6:44191-44195).
7. Strip a leading ```` ```json ```` fence and a trailing fence (v6:44196).
8. First `{…}` block; none → `backend_error` / "No valid JSON found" (v6:44197-44202).
9. `JSON.parse`; `items` array present → success / ocr_failure, else `backend_error` / "Response missing items array" (v6:44203-44215).
10. On parse throw, retry once after stripping trailing commas `,(\s*[}\]])` → `$1` (v6:44217-44230).

**Post-processing** (v6:44099-44116): item field aliases `name|item`, `price|cost`, `qty|quantity`; missing total recomputed as `Σ price*qty`; total rounded to cents; store defaults to "Unknown".

**Commit** (v6:44242-44263): a `source:"receipt"` history entry is prepended and `addToPantry(items, store)` runs, resetting staple restock clocks (v6:43438-43443).

**Bug — silent success on the inner repair path**: if the outer `JSON.parse` throws and the comma-repaired parse succeeds but yields an object *without* an `items` array, control falls off the end of `extractReceiptJson` and it returns `undefined` (v6:44219-44229 — the inner `if` has no else and no trailing `return result`). The caller reads `parseResult.status` on `undefined` and throws a TypeError, which is caught by the outer `.catch` and surfaces as "Scan failed: … Try again." (v6:44093, v6:44140). Confirm by feeding the client a response body whose text parses only after comma repair and lacks `items`.

**Unverified server side**: the model, the vision prompt, rate limits and whether images are retained are all invisible from the client. Confirm by inspecting the Cloudflare Worker `lockedapi`.

---

## Budget math

All figures are recomputed on every BudgetTab render (v6:44003-44024) and again, identically, in ShoppingBudgetTab (v6:45975-45987).

- **Week window**: `weekStart = now; weekStart.setDate(now.getDate() - now.getDay()); setHours(0,0,0,0)`; `weekEnd = weekStart + 7 days` (v6:44005-44011). Week starts **Sunday**, local time. Entry membership: `date >= weekStart && date < weekEnd` (v6:44012-44015).
- **Month window**: `monthStart = new Date(year, month, 1)`; membership `date >= monthStart` — no upper bound, but harmless because future dates are not creatable (v6:44021-44023).
- **weekSpent** = `Σ (h.total || 0)` over `thisWeek` (v6:44016-44018).
- **monthSpent** = `Σ (h.total || 0)` over `thisMonth` (v6:44022-44024).
- **pct** = `weeklyTarget > 0 ? min(weekSpent / weeklyTarget * 100, 100) : 0` (v6:44019). Displayed as `Math.round(pct)` (v6:44500).
- **overBudget** = `weeklyTarget > 0 && weekSpent > weeklyTarget` (v6:44020).
- **Remaining / over** = `(weeklyTarget - weekSpent).toFixed(2)` or `(weekSpent - weeklyTarget).toFixed(2)` — uncapped in both directions (v6:44490).
- **Bar colour thresholds**: over → red; `pct > 75` → amber; else green (v6:44474-44476).
- **Hub pill** = `"$" + (wkTarget - wkSpent).toFixed(0) + " left"`, or "Over budget" (v6:46064); `budgetPct = min(round(wkSpent/wkTarget*100), 100)` (v6:45985).
- **Manual entry total** = `price * qty` (v6:44054).
- **Receipt total** = the parsed total when present, else `Σ (price||0) * (qty||1)`, rounded to cents at parse time only (v6:44113, v6:44246-44249).
- **Purchases tile** = `thisWeek.length` (v6:44543).
- **Restock interval** = `max(3, min(60, round(mean(gaps ≥ 2 days))))`, requiring ≥ 2 purchase dates (v6:43479-43486).
- **Overdue** = `(Date.now() - Date.parse(lastBought || dateAdded)) / 86400000 >= intervalDays`; `overdueDays = max(0, floor(sameQuotient - intervalDays))` (v6:43492, v6:43497-43499).

There are no charts in this range — the only visualisation is the single CSS progress bar (v6:44465-44478).

---

## Storage keys touched

All go through `ld`/`sd`, which prefix `lk_` (v6:2420, v6:2437).

| Key | Read at | Written at |
|---|---|---|
| `lk_myStores` | v6:42074 (getMyStores) — used v6:42081, v6:42580, v6:43995, v6:45245 | v6:42077 (saveMyStores) — via v6:42089 |
| `lk_shoppingList` | v6:41946 — used v6:42421, v6:43508, v6:44265, v6:45351, v6:45971 | v6:41949 — via v6:42546, v6:42754, v6:42777, v6:45374, and every addShoppingItem |
| `lk_pantryItems` | v6:43416 | v6:43419 — via v6:43459, v6:43529, v6:43539, v6:43589 |
| `lk_budgetData` | v6:43965 — used v6:43975, v6:43467, v6:45268, v6:45974 | v6:43972 — via v6:44001 |
| `lk_mealPlans` | v6:45229 | v6:45232 (dead component only — the live writer is MealPlanFuelTab, v6:37469) |
| `lk_fuelProfile` | v6:45254, v6:45280 (read-only) | — |
| `lk_profile` | v6:45248 (read-only) | — |
| useHubState key for `shopTab` | v6:45969 | v6:45969 |

Note `lk_myGroceries` is listed in the app's key inventory (v6:37468) but is not touched anywhere in this range.

---

## Security findings

1. **No hardcoded secrets in this range.** No API key, token, or credential variable appears between v6:42079 and v6:46184 — verified across all four fetch call sites (v6:42460, v6:44078, v6:44303, v6:44341, v6:45288). Nothing to redact.
2. **Four unauthenticated calls to a public Cloudflare Worker.** `https://lockedapi.cescocugliari.workers.dev/store-search` (v6:42460), `/parse-receipt` (v6:44078) and the bare root (v6:44303, v6:44341, v6:45288) carry no auth of any kind. Anyone who views source gets a free LLM proxy. Server-side rate limiting is UNVERIFIED — confirm in the Worker.
3. **Prompt injection via user-controlled store descriptions.** The free-text description from F-SHOP-003 is interpolated straight into the *system* prompt of both AI features (v6:44306, v6:44344) and the meal-planner context (v6:45266). A user typing "ignore previous instructions…" controls the system message.
4. **Unbounded image upload.** A full-resolution receipt photo is base64-encoded twice into one JSON body with no size check (v6:44085-44089).
5. **Fabricated prices presented as fact.** The price-comparison prompt instructs the model to "Use realistic prices" (v6:44344) and the UI badges the top row "BEST" (v6:44790); likewise "save $X.XX" in Smart Savings (v6:44975). No price source, no disclaimer.

---

## Open questions / UNVERIFIED

1. **`/store-search` contract** (v6:42460). Whether the route exists, what `products` elements look like, whether `price` is a string or number, and what the latency is. Confirm: `curl -X POST https://lockedapi.cescocugliari.workers.dev/store-search -H 'Content-Type: application/json' -d '{"storeDomain":"walmart.com","query":"eggs","storeDescription":""}'`.
2. **`/parse-receipt` contract** (v6:44078). Which of the ten response shapes `extractReceiptJson` handles is the real one; the model and vision prompt; image retention. Confirm by reading the Worker source or POSTing a test receipt.
3. **Bare-root AI endpoint** (v6:44303, v6:44341, v6:45288). Confirmed *shape* is Anthropic Messages (`system` + `messages` in, `content[0].text` out), but the model id, temperature and any server-side system prefix are invisible. Confirm in the Worker.
4. **`extractReceiptJson` undefined return** (v6:44219-44229). The comma-repair branch that parses successfully but has no `items` array falls through with no return. Confirm by stubbing the fetch with such a body and observing the "Scan failed:" toast rather than the expected "Could not process receipt".
5. **`openAllAtStore` popup blocking** (v6:42592-42596). Deferred `window.open` calls almost certainly fail past the first. Confirm by running the flow in Chrome and Safari at default settings.
6. **`smartUnit` unit override** (v6:41955, defined outside this range). Whether the user's explicit "qty" selection is silently replaced for common foods. Confirm by reading `smartUnit` and adding "Chicken Breast" with unit "qty".
7. **RunningLowCard placement** (v6:26663). Whether the `restock` slot is enabled by default in the Home card registry, or opt-in — this decides whether `autoAddDueStaples` ever runs for a typical user. Confirm by reading the default card-order config.
8. **Is MealPlannerTab reachable via any dynamic dispatch?** `grep` finds no reference (v6:45234), but a string-keyed component registry would not show up. Confirm by grepping the app for a components map keyed by name.

## Notes for the redesign

- Two meal planners share `lk_mealPlans`; only `MealPlanFuelTab` (v6:37469) is live. Delete `MealPlannerTab` (v6:45234-45906, ~670 lines).
- `pendingItems` / `needsPrices` / `importCheckedItems` / the "LIST" history badge form a complete dead feature (v6:43968, v6:44264-44289, v6:44989).
- `lowStock` (v6:43457) is written and never read; `empty` (v6:43628) is the real flag. Pick one.
- Week-window math is duplicated in two components (v6:44005-44020 vs v6:45975-45987) — extract it.
- Silent-failure inconsistency: some validation toasts (v6:43606, v6:44027, v6:44042) and some bare returns (v6:42110, v6:42518, v6:43633).
- Destructive-action inconsistency: `lkConfirm` on Clear Done / Clear All / pantry delete (v6:42750, v6:42776, v6:43616), nothing on store delete, list-item remove or history delete (v6:42136, v6:42558, v6:45000), and a native `confirm()` in the dead planner (v6:45880).
