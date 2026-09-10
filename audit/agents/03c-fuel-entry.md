# Agent 3c — Fuel: food entry (search, photo, manual, recipes)

File audited: `redesign/input/locked-current-v6.html`
Exclusive range: **38554–42078**. All line cites are in that file unless noted.

Components in range: `ListTab` (38554), `ManualEntry` (39088), `isSpecificQuery` (39298), `rankFoodResults` (39304), `SearchTab` (39355), `PhotoTab` (40360), `RecipesTab` (40760, containing `RCard` at 40920), then the shopping-list / store helper block (41833–42078) which is physically in my range but belongs to the Shop/Budget surface — indexed here for completeness and flagged as such.

Parent context (outside range, cited for wiring only): `FuelHub` renders these tabs at `redesign/input/locked-current-v6.html:37429-37460`; `addItem` at `:37045-37053`, `removeItem` at `:37054-37063`, persistence via `setFuelLog` → `sd("fuelLog", n)` at `:36922-36928`.

---

## PART A — Features

### F-FUEL-400 Meal-slot selector (List tab)
- Location: Fuel hub > List tab > top card, "MEAL" row
- User action: taps one of Breakfast / Lunch / Dinner / Snack
- Behavior:
  1. `setMeal(m)` stores the chosen slot (38658-38678).
  2. Active pill gets orange border/background/text; others muted (38663-38676).
  3. The value is only consumed at log time by `log()` → `p.addItem(meal, item)` (38644-38646).
- Components: ListTab (38554-39087)
- Functions: inline `onClick` (38660-38662)
- State: local `meal`, default `"lunch"` (38556)
- Storage: none directly
- Network: none
- AI: none
- Edge cases: default is `lunch` regardless of time of day — no time-based inference anywhere in range.
- Gating: always on
- Status: WORKING
- Evidence for status: 38658-38678 — plain controlled state, no dead branches.
- Notes: identical 20-line meal-pill block is duplicated three times: ListTab 38658-38678, SearchTab 39811-39836, PhotoTab 40467-40492. Copy #1 adds `textTransform:"capitalize"` (38674) which the other two lack — cosmetic divergence.

### F-FUEL-401 Natural-language meal estimate ("ESTIMATE MACROS", List tab)
- Location: Fuel hub > List tab > "WHAT DID YOU EAT?" textarea + ESTIMATE MACROS button
- User action: types a free-text meal ("2 eggs, 3 oz chicken, 1 cup rice") and taps ESTIMATE MACROS
- Behavior:
  1. Guard: no-op if text is blank or a request is already in flight (38560).
  2. `setEstimating(true)`, clears any previous preview (38561-38562).
  3. POST `https://lockedapi.cescocugliari.workers.dev/analyze-meal`, headers from `authHeaders()`, body `{"description": text.trim()}` (38563-38569).
  4. Response parsed as JSON; text taken from `d.content[0].text` (38572).
  5. Text is sliced between the first `[` and last `]` and `JSON.parse`d into an item array (38574-38576).
  6. Empty/non-array throws → fallback (38576).
  7. Totals reduced across items summing `cal/pro/carb/fat` with `|| 0` defaults (38577-38590).
  8. `setPreview({items, totals})` renders the ESTIMATED card (38591-38594).
  9. Parse-failure fallback: local `estimateMacros(text)` (defined `:35657`); if that yields 0 items, a hardcoded 400 kcal guess is used, adjusted to 250 for "small", 700 for "large", 450 for "medium", with macros split 25% P / 45% C / 30% F by calories (38595-38617).
  10. Network-failure fallback (`.catch`): same `estimateMacros`, but the last-ditch guess is a fixed 400 kcal / 25P / 45C / 12F with **no** size-word adjustment (38620-38638).
- Components: ListTab (38554-39087)
- Functions: `estimate` (38559-38639); helpers `authHeaders` (`:2652-2662`), `estimateMacros` (`:35657`)
- State: `text`, `preview`, `estimating` (38555-38558)
- Storage: none written here
- Network: POST `/analyze-meal`, JSON `{description}`; response `{content:[{text}]}` (Anthropic Messages shape)
- AI: model and system prompt live server-side in the Cloudflare Worker — **not visible in this file**. Input: the raw description string. Output: JSON array of `{name, cal, pro, carb, fat}` (inferred from the reduce at 38577-38590 and the render at 38695-38712). UNVERIFIED: model id, prompt text, whether the worker gates on quota (`aiCall` handles a `d.gated` field at `:2691-2697`, but `estimate` does **not** check `d.gated`).
- Edge cases: blank input disabled (38560, 38720); in-flight disabled with "ESTIMATING…" label (38731); parse failure → local heuristic; network failure → local heuristic; **no error toast at all on this path** (38620-38638) — the user silently gets a 400 kcal guess presented identically to a real AI result.
- Gating: always on client-side; server may gate (unhandled).
- Status: PARTIAL
- Evidence for status: 38620-38638 — the catch swallows every failure and fabricates macros with no user-visible indication that the estimate is a fallback.
- Notes: BUG — `d.gated` never inspected here (contrast `aiCall` `:2691`), so a quota-gated response ("Daily limit reached…") will fail JSON.parse and be silently replaced by a 400 kcal guess. Hardcoded magic numbers: 400/250/700/450 kcal, 0.25/0.45/0.30 macro split (38598-38616).

### F-FUEL-402 Estimate preview card + "LOG THIS MEAL"
- Location: Fuel hub > List tab > orange ESTIMATED card (shown only when `preview` set)
- User action: reviews per-item names + kcal and the Cal/Pro/Carb/Fat totals, taps LOG THIS MEAL
- Behavior:
  1. Card lists every item name with its kcal, separated by hairlines (38695-38712).
  2. Totals row shows Cal / Pro g / Carb g / Fat g (38713-38759).
  3. On tap, `log()` iterates `preview.items` and calls `p.addItem(meal, item)` once per item (38641-38647).
  4. Clears the textarea and the preview (38648-38649).
- Components: ListTab (38554-39087)
- Functions: `log` (38640-38650); parent `addItem` (`:37045-37053`)
- State: `preview`, `text`, `meal`
- Storage: writes `lk_fuelLog` indirectly via parent `setFuelLog` → `sd("fuelLog", n)` (`:36922-36928`)
- Network: none
- AI: none
- Edge cases: no edit affordance — the user cannot change a name, portion, or macro before logging, and cannot deselect an individual item; it is all-or-nothing. Each AI item becomes a separate diary row.
- Gating: always on
- Status: WORKING
- Evidence for status: 38640-38650 — straight loop into `addItem`.
- Notes: UX gap — no per-item edit/remove in the preview; correcting a bad AI item requires logging then deleting via the diary (F-FUEL-404).

### F-FUEL-403 Today's Diary (show/hide, per-meal grouping)
- Location: Fuel hub > List tab > "TODAY'S DIARY" card (rendered only when at least one item exists)
- User action: taps Show / Hide
- Behavior:
  1. `allItems` is flattened from `p.day.meals` across `["breakfast","lunch","dinner","snacks"]`, each entry carrying `{meal, item, idx}` (38652-38657).
  2. Card renders only when `allItems.length > 0` (38760).
  3. Show/Hide toggles `showDiary` (38790-38793).
  4. When shown, items are re-bucketed by meal; empty meals render `null` (38810-38828).
  5. Each meal header shows a colour bar (breakfast `#FF6B35` hardcoded, lunch `BLU`, dinner `GR`, snacks `WA`), the label, and the meal's total kcal (38820-38826, 38845-38884).
  6. Each row shows name and `P / C / F / kcal` chips (38900-38962).
  7. Footer per meal shows summed Protein / Carbs / Fat in grams (38996-39080).
- Components: ListTab (38554-39087)
- Functions: inline IIFE at 38794-39084
- State: `showDiary` (default `false`, 38557)
- Storage: reads `p.day.meals` sourced from `lk_fuelLog` (`:36909-36911`, `:36932`)
- Network: none
- AI: none
- Edge cases: hidden entirely when the day is empty (38760) — no empty state; collapsed by default so a first-time user may not find the diary.
- Gating: always on
- Status: WORKING
- Evidence for status: 38794-39084 — full render path present and reachable.
- Notes: `#FF6B35` is a hardcoded hex outside the token system (38835). `showDiary` is not persisted, so it re-collapses on every remount.

### F-FUEL-404 Delete a logged food (diary row ✕)
- Location: Fuel hub > List tab > Today's Diary > per-row ✕ button
- User action: taps the small ✕ at the right of a diary row
- Behavior:
  1. `p.removeItem(entry.meal, entry.idx)` (38966-38968).
  2. Parent filters that index out of `day.meals[meal]` and persists (`:37054-37063`).
- Components: ListTab (38554-39087)
- Functions: parent `removeItem` (`:37054-37063`)
- State: parent `fuelLog`/`day`
- Storage: writes `lk_fuelLog`
- Network: none
- AI: none
- Edge cases: **no confirmation and no undo** (38966). `idx` is captured from the flatten pass (38654-38656) and is the index within that meal array, so it stays correct — but it is a stale closure over the render's `allItems`; two rapid taps on different rows before re-render would delete by outdated indices. UNVERIFIED: needs a runtime test of two taps inside one React batch.
- Gating: always on
- Status: WORKING (with the caveat above)
- Evidence for status: 38966-38968 wired to a real parent mutator at `:37054`.
- Notes: this is the only delete path for logged food anywhere in my range. No edit path exists at all — a mis-logged portion must be deleted and re-entered.

### F-FUEL-405 Manual macro entry (collapsed prompt)
- Location: Fuel hub > Search tab > bottom dashed card "Add custom macros"
- User action: taps "+ Enter macros manually"
- Behavior:
  1. Collapsed state renders a dashed card: title "Add custom macros", subtitle "Can't find it? Enter macros manually." (39112-39131).
  2. Tap sets `show = true` (39132-39134), expanding to the form (F-FUEL-406).
- Components: ManualEntry (39088-39297), mounted only by SearchTab at 40355-40358
- Functions: inline `onClick` (39132)
- State: local `show` (39089)
- Storage: none
- Network: none
- AI: none
- Edge cases: reachable **only** from the Search tab; there is no manual-entry affordance on the List, Photo, or Recipes tabs.
- Gating: always on
- Status: WORKING
- Evidence for status: 39110-39150 renders the collapsed card; 40355-40358 is the only mount site.
- Notes: discoverability issue — it sits below the whole result list, so it is off-screen until the user scrolls past results.

### F-FUEL-406 Custom macro form (name + 4 numeric fields)
- Location: Fuel hub > Search tab > expanded "Custom Entry" card
- User action: types a food name, calories, protein, carbs, fat; taps ADD (or Cancel / ✕)
- Behavior:
  1. Name input is free text; focusing it scrolls it to viewport centre after 100 ms (39185-39192).
  2. Four numeric inputs rendered from a config array — Calories, Protein (g), Carbs (g), Fat (g); `type=number`, `step=0.01`, `inputMode=decimal`, centred (39215-39260).
  3. ADD is disabled unless name is non-blank **and** `mCal` is truthy (39268-39280).
  4. `add()` calls `p.onAdd(p.meal, {...})` — i.e. the parent `addItem` with the meal currently selected in SearchTab (39095-39102).
  5. All five fields cleared and the card collapses (39103-39109).
- Components: ManualEntry (39088-39297)
- Functions: `add` (39094-39110)
- State: `show`, `mName`, `mCal`, `mPro`, `mCarb`, `mFat` (39089-39093)
- Storage: writes `lk_fuelLog` via parent
- Network: none
- AI: none
- Edge cases: **BUG — decimals are truncated.** Inputs advertise `step="0.01"` and `inputMode="decimal"` (39216-39219) but `add()` uses `parseInt` on all four numbers (39098-39101), so `0.5 g` fat becomes `0`, `12.7 g` protein becomes `12`. `parseInt("abc") || 0` also silently zeroes garbage. Calories `0` is falsy so "0 cal" cannot be submitted (39096, 39268). Negative numbers are not blocked (no `min` attribute).
- Gating: always on
- Status: PARTIAL
- Evidence for status: 39098-39101 — `parseInt` contradicts the `step="0.01"` decimal affordance at 39218.
- Notes: no serving-size or gram field here; the user must pre-compute the macros for the portion they ate.

### F-FUEL-407 Food text search (multi-source fan-out)
- Location: Fuel hub > Search tab > search input + "Go" (or Enter key)
- User action: types ≥2 characters and taps Go / presses Enter
- Behavior:
  1. Guard: query shorter than 2 chars is ignored (39494).
  2. **Barcode shortcut** — a bare 8–14 digit query is handed to `p.onScan(code)`, which sets `pendingGtin` and switches the hub to the scan tab (39496; parent `:37442-37445`).
  3. Any in-flight search is aborted via `AbortController` (39497-39500).
  4. `loading = true`; results, selection cleared (39501-39503).
  5. **My Store** matches (substring, case-insensitive) mapped to `{product_name, brands:"MY STORE", nutriments, _store:true}` (39505-39517).
  6. **Local FOODS** table (`:34768`) matched the same way → `brands:"Database", _local:true` (39518-39530).
  7. If either local pool has hits, results render immediately and `loading` is cleared — instant local-first paint (39546-39549).
  8. Three remote sources fan out in parallel with `pending = 3` (39550-39552):
     - `searchUSDA` (39440-39479): GET `https://api.nal.usda.gov/fdc/v1/foods/search?query=…&api_key=<usdaKey>&dataType=Foundation,SR%20Legacy&pageSize=12&sortBy=score&sortOrder=desc`. Maps nutrient ids 1008→kcal, 1003→protein, 1005→carbs, 1004→fat; drops any food with no kcal; title-cases the description; tags `_usda:true`.
     - `searchFatSecret` (39480-39493): GET `WORKER_API + "/food-search?src=fatsecret&q=…"` (`WORKER_API` = `https://lockedapi.cescocugliari.workers.dev`, `:7060`). Maps `{name, brand, cal, pro, carb, fat, type}`; `type === "Generic"` sets `_generic`; tags `_fatsecret:true`. **Note: no auth headers on this call.**
     - Open Food Facts (39568-39586): GET `https://world.openfoodfacts.org/cgi/search.pl?search_terms=…&search_simple=1&action=process&json=1&page_size=10`; keeps only products with `nutriments["energy-kcal_100g"]`; tags `_off:true`.
  9. Each completion decrements `pending`, re-merges **all five** pools, dedupes by lowercased `product_name`, ranks, and slices to 30 (39553-39562, 39531-39545).
  10. `loading` clears when `pending <= 0` (39561).
- Components: SearchTab (39355-40359)
- Functions: `search` (39493-39587), `searchUSDA` (39440-39479), `searchFatSecret` (39480-39493), `mergeAndRank` (39531-39545), `rankFoodResults` (39304-39354), `isSpecificQuery` (39298-39303)
- State: `q`, `results`, `loading`, `selected`, `searchCtrlRef`, `storeItems`, `usdaKey` (39356-39374)
- Storage: reads `lk_myGroceries` (39366), `lk_usdaKey` (39369)
- Network: three endpoints above; OFF and USDA are called direct from the browser, FatSecret is proxied through the worker
- AI: none
- Edge cases: aborts are swallowed by name check on all three paths (39476, 39490, 39584); every remote failure calls `onSourceDone()` so the spinner always clears; if *all* remote sources fail the user sees only local/store hits with **no error message** (39563-39586). Empty state offers the USDA-key link (39272-39299 of the render block, i.e. 40269-40296). Query of 1 char silently does nothing (39494).
- Gating: always on
- Status: WORKING
- Evidence for status: 39550-39586 — all three sources wired with matched success/fail handlers and a shared abort signal.
- Notes: **there is no debounce** — search fires only on Enter/Go, which is deliberate but means no as-you-type results. `_serving` is rendered in the detail card (39962-39969) but **nothing in my range ever sets `_serving`** — dead display branch (likely fed by the barcode path outside my range). UNVERIFIED: whether `BarcodeTab` sets `_serving`; confirm by grepping `_serving` outside 38554–42078.

### F-FUEL-408 Result ranking + "★ BEST" badge
- Location: Fuel hub > Search tab > results list
- User action: none (automatic)
- Behavior:
  1. `isSpecificQuery` returns true if the query matches a large hardcoded brand/chain regex (≈120 brands: Burger King … Prime Hydration) **or contains any digit** (39298-39303).
  2. Specific queries reward exact name match (+800), substring (+500), all-words (+300), brand-word hits (+150 each), FatSecret (+100) (39311-39319).
  3. Generic queries reward generic-ness (+600), local (+200), FatSecret-generic (+500), USDA (+400), exact (+300) / prefix (+200) / substring (+80), and **penalise branded non-USDA rows (−150)** (39320-39331).
  4. My Store rows always get +2000 so they float to the top (39310).
  5. Any row missing `energy-kcal_100g` is penalised −800 (39332-39334).
  6. After sorting, the first non-store row is tagged `_best = true` and gets a "★ BEST" pill plus a tinted card (39337-39348; render 40197-40209, 40165-40175).
- Components: SearchTab (39355-40359)
- Functions: `rankFoodResults` (39304-39354), `isSpecificQuery` (39298-39303)
- State: none (pure)
- Storage: none
- Network: none
- AI: none
- Edge cases: `/\d/` means "chicken 100g" is classified as a *brand-specific* query and loses all generic boosts (39301) — a real mis-classification. The brand list is a frozen hardcoded snapshot with no update path.
- Gating: always on
- Status: WORKING (logic executes) with a design defect
- Evidence for status: 39301 — the digit heuristic conflates portions with brands.
- Notes: source badges rendered per row: STORE, USDA, FATSECRET, OFF (40208-40245).

### F-FUEL-409 Food detail card: grams + serving-size quick chips
- Location: Fuel hub > Search tab > selected-food card
- User action: taps a result row, then edits Grams or taps a preset chip
- Behavior:
  1. Row tap sets `selected` and resets `grams` to `"100"` (40168-40171); rows are keyboard-activatable via `role=button` + `lkKeyActivate` (`:5227`) at 40161-40163.
  2. Grams input: `type=number`, `step=0.01`, `inputMode=decimal`, scroll-into-view on focus (40031-40062).
  3. Seven preset chips: 100 g, 150 g, 200 g, ½ cup = **60 g**, 1 cup = **120 g**, 1 oz = **28 g**, 1 tbsp = **15 g** (40064-40066). Active chip highlighted by `parseInt(grams) === value` (40072-40075).
  4. Macros recomputed live as `per-100g × grams/100`, rounded (40088-40103).
  5. "Log to <Meal>" builds the item and calls `p.addItem(meal, item)`; clears selection, grams, query, results (39564-39580 → `logSelected` 39564-39580).
  6. "Back" clears `selected` only (40136-40141).
- Components: SearchTab (39355-40359)
- Functions: `logSelected` (39564-39580)
- State: `selected`, `grams`, `meal`
- Storage: writes `lk_fuelLog` via parent
- Network: none
- AI: none
- Edge cases: `parseFloat(grams) || 0` defaults to **100** when blank or 0 (39566, 40089) — an empty grams box silently logs 100 g. The cup/oz/tbsp chips are **single fixed gram weights applied to every food** (40064) — 1 cup of oats and 1 cup of milk both become 120 g, a real accuracy defect. Chip highlight uses `parseInt`, so `100.5` still highlights the 100 g chip (40073). Volume presets are meaningless for a per-100 g database with no density data.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 40064 — volumetric presets mapped to universal gram constants regardless of food.
- Notes: no per-serving option even when the source exposes one; everything is normalised to /100 g.

### F-FUEL-410 My Store (saved foods)
- Location: Fuel hub > Search tab > "My Store" chip (header) and the `view === "mystore"` screen
- User action: taps "Save" on a selected food; taps My Store to browse; taps Log or ✕ on a stored row
- Behavior:
  1. `saveToMyStore(item)` scales the food by the **current grams value** and stores `{name, cal, pro, carb, fat, savedAt: ISO}` (39546-39563 → 39547-39563).
  2. Dedupe: the new entry is unshifted and any existing entry with the same lowercased name is filtered out (39556-39559).
  3. `setStoreItems` writes state **and** `sd("myGroceries", v)` (39375-39378).
  4. "Saved" confirmation shows for 1500 ms then reverts (39560-39562).
  5. My Store screen: back button, title, item count badge with singular/plural (39581-39623).
  6. Empty state: "No items saved yet" + instructions (39624-39637).
  7. Each row shows name and `fmtCal(cal) kcal · fmtQ(pro)g pro` (`:4355`, `:4349`) at 39655-39668.
  8. "Log" re-hydrates the row into a synthetic `selected` object (`brands:"MY STORE"`, `_store:true`) and returns to the search view (39670-39694) — it does **not** log directly, it opens the detail card.
  9. ✕ removes by index (39696-39700). No confirmation.
  10. When the search box is empty, up to 6 store items render as quick chips (40297-40354), and a "View all →" link opens the full screen (40313-40326).
- Components: SearchTab (39355-40359)
- Functions: `saveToMyStore` (39546-39563), `setStoreItems` (39375-39378)
- State: `storeItems`, `savedToStore`, `view`
- Storage: reads/writes **`lk_myGroceries`** (39366, 39377)
- Network: none
- AI: none
- Edge cases: saved macros are frozen at the grams the user had selected, but the item is re-hydrated as `energy-kcal_100g` (39674-39681) — **so a food saved at 200 g comes back claiming those are its per-100 g values and double-counts if logged at 200 g again.** This is a real data-integrity bug. Delete has no undo. No rename, no edit.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 39549-39555 scales by grams on save; 39674-39681 re-reads the same numbers as per-100 g on load — unit mismatch.
- Notes: the storage key is `myGroceries` while the UI is called "My Store" and a *separate* `myStores` key exists for retailers (42073) — three overlapping names for two concepts.

### F-FUEL-411 USDA API key setup
- Location: Fuel hub > Search tab > empty-results state link → key screen
- User action: taps "Add your free USDA key for higher rate limits", pastes a key, taps SAVE
- Behavior:
  1. `showKeySetup = true` swaps the whole tab for the key screen (40286-40295, 39702).
  2. Copy explains it works keyless and that blank means "the free shared key (1,000 req/hour)" (39710-39730).
  3. `saveUsdaKey()` trims the input, falls back to the literal `"DEMO_KEY"`, writes `sd("usdaKey", k)`, updates state, closes (39379-39384).
  4. Subsequent searches use the stored key in the URL query string (39441-39442).
- Components: SearchTab (39355-40359)
- Functions: `saveUsdaKey` (39379-39384)
- State: `usdaKey` (default `"DEMO_KEY"`, 39368-39370), `showKeySetup`, `keyInput`
- Storage: reads/writes **`lk_usdaKey`**
- Network: the key is appended to the USDA URL (39442)
- AI: none
- Edge cases: no validation — a bad key is stored and every USDA search then silently fails (the `onFail` path just calls `onSourceDone`, 39566). No "clear key" affordance; only reachable from the no-results state, so a user who never gets an empty result can never find it.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 39379-39384 — no verification call before persisting.
- Notes: **SECURITY** — the user's USDA key is sent in a URL query string (39442), so it lands in browser history and any intermediary logs. Value not hardcoded; the default sentinel is the literal `"DEMO_KEY"` (39368, 39380, 39441). USDA's shared DEMO_KEY is rate-limited far below the "1,000 req/hour" claimed at 39724 — UNVERIFIED against USDA's current published limits.

### F-FUEL-412 Barcode hand-off from the search box
- Location: Fuel hub > Search tab > search input, and the barcode icon button beside it
- User action: types a bare 8–14 digit number and taps Go; or taps the barcode icon
- Behavior:
  1. Typed digits: `search()` regex-tests `/^\d{8,14}$/` and calls `p.onScan(q.trim())`, returning before any network call (39496).
  2. Icon: calls `p.onScan()` with no argument (39882-39884).
  3. Parent sets `pendingGtin` (string or `""`) and switches to the `scan` tab (`:37442-37445`), which mounts `BarcodeTab` with `gtin` (`:37446-37449`).
  4. The icon renders only when `p.onScan` is supplied (39881).
- Components: SearchTab (39355-40359)
- Functions: `search` (39496), inline handler (39882)
- State: parent `pendingGtin`
- Storage: none
- Network: none in my range — lookup lives in `BarcodeTab` (outside range)
- AI: none
- Edge cases: a 8–14 digit query can never reach the text-search path, so a food genuinely named with a long number is unsearchable. Behaviour of the scan screen itself is out of my scope.
- Gating: conditional on the `onScan` prop, which the hub always passes (`:37442`) — effectively always on
- Status: WORKING
- Evidence for status: 39496 plus the parent wiring at `:37442-37449`.
- Notes: the hand-off comment at 39495 matches the receiving comment at `:20869`.

### F-FUEL-413 Photo capture / library pick
- Location: Fuel hub > Photo tab > dashed "Add meal photo" card
- User action: taps Camera or Library, picks an image
- Behavior:
  1. Two hidden `<input type=file accept="image/*">` — the camera one adds `capture="environment"` (40676-40694).
  2. Visible buttons `.click()` the corresponding hidden ref (40615-40617, 40645-40647).
  3. `handleFile` grabs `files[0]`, and reads it with `FileReader.readAsDataURL` (40367-40376).
  4. `setImgData(dataURL)`, clears any previous result (40372-40374).
  5. Preview renders the raw data URL at `maxHeight:220, objectFit:cover` (40529-40540).
  6. A round ✕ overlay discards the photo and the result (40541-40566).
- Components: PhotoTab (40360-40759)
- Functions: `handleFile` (40367-40376)
- State: `imgData`, `result`, refs `cameraRef`, `libRef` (40363-40366)
- Storage: none — the photo is never persisted
- Network: none at this step
- AI: none at this step
- Edge cases: **no resize, no compression, no size cap.** The shared `resizeImage` helper exists at `:2878` but is *not* called here — the full-resolution image is base64-encoded and later POSTed whole (40384). A 12 MP phone photo is ~4–8 MB raw, ~6–11 MB base64. No file-type validation beyond the `accept` attribute; `FileReader.onerror` is not handled, so a read failure leaves the UI silently unchanged.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 40367-40376 — `readAsDataURL` with no downscale, while `resizeImage` (`:2878`) is available and used elsewhere.
- Notes: top redesign priority — this is the single largest payload the app sends.

### F-FUEL-414 AI photo/description meal analysis
- Location: Fuel hub > Photo tab > "ANALYZE PHOTO" / "ESTIMATE MACROS" button
- User action: taps the primary button after adding a photo and/or a description
- Behavior:
  1. Guard: no-op unless there is a photo **or** a non-blank note, and not already analyzing (40378).
  2. `analyzing = true`, previous result cleared (40379-40380).
  3. Body assembled conditionally: `description` only if the note is non-blank; `base64` only if a photo exists (40381-40384). **Both may be sent together; either alone is valid.**
  4. `base64` is the raw `FileReader` data URL — i.e. it still carries the `data:image/jpeg;base64,` prefix (40372 → 40384). UNVERIFIED whether the worker strips that prefix; confirming requires the worker source, which is not in this repo.
  5. POST `https://lockedapi.cescocugliari.workers.dev/analyze-meal` with `authHeaders()` (40385-40389).
  6. Response text taken from `d.content[0].text`, sliced between first `[` / last `]`, `JSON.parse`d (40393-40397).
  7. Non-array or empty array throws (40397).
  8. Totals reduced over `cal/pro/carb/fat` (40398-40411).
  9. `setResult({items, totals})` (40412-40415).
  10. Parse-failure fallback: a single fabricated item using keyword heuristics on the **note only** — 400 default, 250 "small", 650 "large", 750 "restaurant"/"takeout", 300 "salad", 700 "burger"/"pizza"; macros split 25% P / 40% C / 35% F (40416-40434).
  11. Network-failure `.catch`: clears `analyzing` and shows a toast "Couldn't analyse that photo. Check your connection and try again." via `window.LOCKED.toast` (40437-40440). **No result is produced on this path** — unlike ListTab.
- Components: PhotoTab (40360-40759)
- Functions: `analyze` (40377-40441); `authHeaders` (`:2652`)
- State: `imgData`, `note`, `result`, `analyzing`
- Storage: none
- Network: POST `/analyze-meal`, body `{description?, base64?}`, response `{content:[{text}]}`
- AI: server-side model and system prompt in the Cloudflare Worker — **not present in this file**. Inputs: base64 image and/or free-text description. Output: JSON array of `{name, cal, pro, carb, fat}`. UNVERIFIED: model id, prompt, image-token cost, whether both `description` and `base64` are honoured together.
- Edge cases: button label switches "ANALYZE PHOTO" / "ESTIMATE MACROS" by presence of a photo (40724); disabled + 0.7 opacity while analyzing (40718-40723). Photo-only failures fall into the keyword branch with an empty note → generic "Meal", 400 kcal (40418, 40426). `d.gated` is not checked here either, so a quota response silently becomes a 400 kcal guess. No timeout on the fetch — a hung request leaves "ANALYZING…" forever.
- Gating: always on client-side; server may gate (unhandled)
- Status: PARTIAL
- Evidence for status: 40416-40434 — parse failure fabricates macros indistinguishable from real analysis; 40437 handles only the network branch.
- Notes: the parse/reduce/slice logic at 40393-40415 is a **near-verbatim duplicate** of ListTab 38572-38594; only the fallback constants differ (0.40/0.35 carb/fat here vs 0.45/0.30 there — the two paths disagree about what an unknown meal looks like).

### F-FUEL-415 Photo result card: Log Meal / Re-estimate
- Location: Fuel hub > Photo tab > "ESTIMATED MACROS" card
- User action: taps Log Meal or Re-estimate
- Behavior:
  1. Card shows only the four totals — Cal / Pro / Carb / Fat (40734-40780). **Individual items are never shown here**, unlike ListTab.
  2. Log Meal → `log()` iterates `result.items` calling `p.addItem(meal, item)` per item, then clears photo, note and result (40442-40451).
  3. Re-estimate clears `result` only, which re-reveals the analyze button (40745-40758).
- Components: PhotoTab (40360-40759)
- Functions: `log` (40442-40452)
- State: `result`, `imgData`, `note`, `meal`
- Storage: writes `lk_fuelLog` via parent
- Network: none
- AI: none
- Edge cases: because items are hidden, the user logs N diary rows having seen only the aggregate — they cannot tell whether the AI split the plate into 1 item or 6. No editing. "Re-estimate" does not re-run anything; it just returns to the button.
- Gating: always on
- Status: WORKING (label is misleading)
- Evidence for status: 40745-40757 — "Re-estimate" only calls `setResult(null)`.
- Notes: asymmetry with F-FUEL-402, which does list items — worth unifying in the redesign.

### F-FUEL-416 Recipes: For You / From Pantry tab switch
- Location: Fuel hub > Recipes tab > two-pill segmented control
- User action: taps "For You" or "🗄️ From Pantry"
- Behavior: `setRecipeTab(t[0])`; active pill gets the accent gradient (41213-41240).
- Components: RecipesTab (40760-41832)
- Functions: inline `onClick` (41220)
- State: `recipeTab` default `"foryou"` (40761)
- Storage: none
- Network: none
- AI: none
- Edge cases: state resets to "foryou" on remount (not persisted).
- Gating: always on
- Status: WORKING
- Evidence for status: 41213-41240.
- Notes: raw emoji "🗄️" in the label (41216).

### F-FUEL-417 Static "Classic Recipes" library
- Location: Fuel hub > Recipes tab > For You > "CLASSIC RECIPES"
- User action: browses; taps Add to diary / Add to shop on a card
- Behavior:
  1. Six hardcoded recipes, `r1`–`r6`: Chicken & Rice Bowl (520), Egg & Oat Breakfast (410), Salmon & Sweet Potato (580), Greek Yogurt Parfait (310), Tuna Wrap (440), Ground Beef Stir Fry (640) — each with tag, time, ingredients array, steps array (40851-40919).
  2. Filtering (41193-41199): if the user is vegetarian/vegan, `r1/r3/r5/r6` are dropped; if goal is `"cut"`, anything over 550 kcal is dropped.
  3. Safety valve: if the filters remove everything, the **unfiltered** list is shown (41199) — so a vegan cutting user is shown the beef stir fry.
  4. Rendered through `RCard` with `ai:false`, so the tag pill shows the recipe's own tag in blue (41531-41535).
- Components: RecipesTab (40760-41832), RCard (40920-41192)
- Functions: filter IIFE (41193-41199)
- State: derived from `fp.preferences` and `fp.goal` (40789-40791)
- Storage: reads `lk_fuelProfile` via the `fuelProfile` prop (`:36912-36914`)
- Network: none
- AI: none
- Edge cases: only two of six survive a vegetarian filter (r2, r4); combined with `goal === "cut"` that is still two, so the valve rarely fires — but vegetarian + cut is the case where it does. Recipes are per-recipe totals with no serving scaling.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 41199 — the fallback serves meat recipes to vegans rather than showing an empty state.
- Notes: vegetarian filtering is by hardcoded id, not by ingredient inspection (41194) — adding a seventh recipe silently bypasses the filter.

### F-FUEL-418 RCard: Add to diary
- Location: Fuel hub > Recipes tab > any recipe card > left footer button
- User action: taps "Add to diary"
- Behavior:
  1. Guarded by `isDone = added[key]` where `key = r.id || r.name` (40923-40925, 41125-41126).
  2. `p.addItem("lunch", {name, cal, pro, carb, fat})` — **hardcoded to lunch** (41128-41134).
  3. Sets `added[key] = true` (label → "Added to diary", green check) and schedules a 2000 ms `setTimeout` that deletes the key so the same recipe can be logged again later in the day (41135-41149).
- Components: RCard (40920-41192)
- Functions: inline `onClick` (41125-41150)
- State: `added` map held in RecipesTab (40762)
- Storage: writes `lk_fuelLog` via parent
- Network: none
- AI: none
- Edge cases: the whole recipe becomes **one** diary row; there is no per-ingredient breakdown for static/AI recipes (contrast coach recipes, F-FUEL-424). No meal-slot picker at all — breakfast recipes land in lunch. The `setTimeout` is never cleared on unmount → a React state update on an unmounted component if the user leaves within 2 s.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 41128 — `"lunch"` is a literal, so every recipe logs to lunch regardless of its tag or its `r.meal` field.
- Notes: `r.meal` **is** produced by the "Plan my day" prompt (41396) and **is** honoured by Log Full Day (41505) — but RCard ignores it. Direct inconsistency between two buttons on the same screen.

### F-FUEL-419 RCard: Add to shop (ingredients → shopping list)
- Location: Fuel hub > Recipes tab > any recipe card > right footer button
- User action: taps "Add to shop"
- Behavior:
  1. Guarded by `shoppingDone` from the `shopDone` map (40926-40934, 41152-41154).
  2. For each ingredient string, `parseIngredient` (41905-41944) splits quantity / unit / name, normalising the unit via `UNIT_NORM` (41833-41882) or guessing with `smartUnit` (41883-41904).
  3. The current list is re-read from storage **inside the loop** (41158); a matching name+unit entry has its quantity incremented and the list is saved (41159-41165), otherwise `addShoppingItem` appends a new row (41166).
  4. Sets the done flag, reverting after 2000 ms (41169-41173).
- Components: RCard (40920-41192)
- Functions: `parseIngredient` (41905-41944), `getShoppingList` (41945-41947), `saveShoppingList` (41948-41950), `addShoppingItem` (41951-41967), `smartUnit` (41883-41904), `categorizeItem` (41982-41992), `lcName` (`:4742`)
- State: `shopDone` (40769)
- Storage: reads/writes **`lk_shoppingList`**
- Network: none
- AI: none
- Edge cases: `getShoppingList()` is called once per ingredient inside the loop (41158) — O(n) redundant reads and a stale-list hazard, though the immediate `saveShoppingList` after each merge keeps it consistent in practice. Free-text ingredients like `"soy sauce, garlic"` (40860) parse as a **single item named "soy sauce, garlic"** (41938-41943) — the comma is never split.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 40860 vs 41938 — comma-joined ingredient strings become one nonsense shopping row.
- Notes: the comment block at 40763-40768 documents the exact bug this state placement fixed (RCard being redeclared per render wiped card state and let a second tap double every quantity) — worth preserving in the redesign as a known trap.

### F-FUEL-420 AI "Meal ideas" (4 meals from profile)
- Location: Fuel hub > Recipes tab > For You > "Meal ideas" (filled gradient button)
- User action: taps Meal ideas
- Behavior:
  1. Requires a Fuel Profile; otherwise sets error "Set up your Fuel Profile first (tap My Profile above)." and returns (40826-40829).
  2. `aiLoading = true`, clears meals and error (40830-40832).
  3. System prompt (40833, verbatim): *"You are a sports nutritionist. Return ONLY a JSON array of 4 meal objects with no extra text or markdown. Each object must have: name, description, cal, pro, carb, fat (all numbers), ingredients (array of strings), steps (array of strings)."*
  4. User prompt (40834) interpolates: `goal`, `fp.tdee`, `fp.macroProtein`, `fp.macroCarbs`, `fp.macroFat`, `fp.fridge` (or "standard groceries"), `fp.allergies` as "Avoid: …", ". Vegetarian." if `isVeg`, and ". Training day."/". Rest day." from `isTrainingDay`.
  5. `isTrainingDay` is true iff `p.history` contains an entry whose `dateISO` equals today (40780-40787).
  6. `aiCall(sys, usr, null, onDone, onFail)` → POST `https://lockedapi.cescocugliari.workers.dev/` with `authHeaders()`, body `{system, max_tokens: 700, messages:[{role:"user", content: usr}]}` (`:2663-2676`).
  7. Response text stripped of ``` and ```json fences (built via `String.fromCharCode(96,96,96)` to avoid literal backticks), sliced between first `[` / last `]`, parsed into `aiMeals` (40835-40848).
  8. Parse failure → "Could not parse meal plan. Try again."; network failure → "Connection issue. Try again." (40843-40850).
- Components: RecipesTab (40760-41832)
- Functions: `generateAIMeals` (40825-40851); `aiCall` (`:2663-2696`)
- State: `aiMeals`, `aiLoading`, `aiError`
- Storage: none written; reads `lk_fuelProfile` via prop and `lk_betaStatus` inside `aiCall` (`:2699`)
- Network: POST worker root `/`
- AI: server-selected model (UNVERIFIED — not in this file); `max_tokens: 700` (`:2668`); prompts at 40833-40834
- Edge cases: `max_tokens: 700` is shared by every `aiCall` in the app and is **tight for 4 full recipes with ingredients and steps** — a truncated response loses its closing `]`, so `lastIndexOf("]")` picks an inner bracket and JSON.parse fails → "Could not parse meal plan". This is the most likely real-world failure and is indistinguishable to the user from a bad model day. Quota gating *is* handled here (via `aiCall`'s `d.gated` branch, `:2691-2697`) — unlike the `/analyze-meal` paths.
- Gating: always on; server-side daily quota enforced through `aiCall`
- Status: PARTIAL
- Evidence for status: `:2668` (`max_tokens: 700`) against the 4-recipe demand at 40833 — high truncation risk.
- Notes: results render as `RCard ai:true` (41520-41526) with an orange "AI" pill (41531-41535).

### F-FUEL-421 AI "Plan my day" (4 meals with slots)
- Location: Fuel hub > Recipes tab > For You > "Plan my day" (outlined button)
- User action: taps Plan my day
- Behavior:
  1. Same profile guard, but with a shorter message: "Set up your Fuel Profile first." (41381-41385).
  2. System prompt (41395, verbatim): *"You are a sports nutritionist. Return ONLY a JSON array of exactly 4 meal objects. Each must have: name, description, meal (one of: breakfast, lunch, dinner, snacks), cal, pro, carb, fat (numbers), ingredients (array of strings), steps (array of strings). No markdown, no extra text."* — the key difference from F-FUEL-420 is the required **`meal`** field.
  3. User prompt (41396) interpolates goal, tdee, the three macro targets, allergies, vegetarian flag; it does **not** include `fp.fridge` and does **not** include training/rest day.
  4. Same fence-strip / bracket-slice / parse into `aiMeals` (41400-41412).
  5. Errors: "Could not parse plan. Try again." / "Connection issue. Try again." (41407-41414).
- Components: RecipesTab (40760-41832)
- Functions: inline handler (41380-41416); `aiCall` (`:2663`)
- State: `aiMeals`, `aiLoading`, `aiError`
- Storage: none
- Network: POST worker root `/`
- AI: prompts at 41395-41396; `max_tokens: 700`
- Edge cases: writes into the **same** `aiMeals` slot as Meal ideas, so the two buttons overwrite each other with no indication of which generated the current list. Same truncation risk. This handler is ~35 lines of inline logic inside JSX rather than a named function, unlike its sibling.
- Gating: always on; server quota via `aiCall`
- Status: PARTIAL
- Evidence for status: 41400-41412 duplicates `generateAIMeals`' parser verbatim (40836-40842) with different error strings.
- Notes: fence-stripping here uses literal `"```json"` strings (41401) while `generateAIMeals` uses `String.fromCharCode` (40836) — same intent, two implementations.

### F-FUEL-422 "Log Full Day" (bulk-log the AI plan)
- Location: Fuel hub > Recipes tab > For You > "AI MEAL PLAN" header > green Log Full Day button
- User action: taps Log Full Day
- Behavior:
  1. Iterates `aiMeals`; the target slot is `r.meal || mealTypes[i] || "lunch"` — the model's own slot, else positional breakfast/lunch/dinner/snacks, else lunch (41498-41508).
  2. One `p.addItem(mt, {...})` per meal (41502-41508).
  3. Marks every meal's key in `added` so the individual cards show "Added to diary" (41509-41515).
- Components: RecipesTab (40760-41832)
- Functions: inline `onClick` (41496-41516)
- State: `added`, parent `fuelLog`
- Storage: writes `lk_fuelLog`
- Network: none
- AI: none
- Edge cases: the `added` keys set here are **never cleared** — unlike RCard's 2000 ms timeout (41135-41149), so after Log Full Day those cards stay permanently disabled for the session and cannot be re-logged. No confirmation before writing four rows; no undo beyond four individual diary deletions.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 41509-41515 sets `added` with no reset timer, contradicting the deliberate reset at 41135-41149.
- Notes: this is the only place `r.meal` is honoured (41500); F-FUEL-418 ignores it.

### F-FUEL-423 Pantry-based recipe generation
- Location: Fuel hub > Recipes tab > From Pantry
- User action: taps "Generate Recipes From My Pantry"
- Behavior:
  1. Reads `getPantry()` (defined `:43415`, outside range) filtered to `!i.empty` (40792-40794).
  2. Empty pantry → error "Your pantry is empty. Scan a receipt to add items." and return (40795-40798).
  3. Loading true; meals and error cleared (40799-40801).
  4. Item list built as `name (qty:N)` for quantities > 1, comma-joined (40802-40804).
  5. System prompt (40806, verbatim): *"You are a chef. Create recipes using primarily the provided pantry ingredients. Return ONLY a JSON array of 4 recipe objects. Each: {name, description, cal, pro, carb, fat (numbers), ingredients:[strings], steps:[strings]}. No markdown, no explanation."*
  6. User prompt (40807): *"My pantry currently has: <list>. "* + optional *"Daily targets: <tdee> kcal, <macroProtein>g protein. "* + *"Create 4 meals using these ingredients. Prioritise items I already have. JSON array only."*
  7. Same `aiCall` → fence strip → bracket slice → parse into `pantryMeals` (40808-40823).
  8. Errors: "Could not parse recipes. Try again." / "Connection issue. Try again."
  9. Above the button, an "IN YOUR PANTRY" card lists the first 12 item names plus "+N more"; if empty, a 🗄️ empty state points the user to the Budget tab receipt scanner (41241-41300).
  10. While loading, three pulsing dots and "Checking what you have..." (41320-41352).
  11. Results render as `RCard ai:true` (41353-41359).
- Components: RecipesTab (40760-41832)
- Functions: `generatePantryRecipes` (40791-40824); `getPantry` (`:43415`); `aiCall` (`:2663`)
- State: `pantryMeals`, `pantryLoading`, `pantryError`
- Storage: reads the pantry store via `getPantry` (key outside my range — UNVERIFIED, resolve by reading `:43415`)
- Network: POST worker root `/`
- AI: prompts at 40806-40807; `max_tokens: 700`
- Edge cases: the pantry list is sent **unbounded** — a 100-item pantry produces a very long user message with no truncation (40802-40804), inflating cost and squeezing the 700-token output budget. `pantryError` is set but never auto-cleared on a later success path other than the explicit resets at 40801.
- Gating: always on; server quota via `aiCall`; effectively depends on the Budget tab's receipt scanner having populated the pantry
- Status: PARTIAL
- Evidence for status: 40802-40804 — no cap on the interpolated pantry list.
- Notes: a third near-identical parse block (40809-40816) — the app now has four copies of "strip fences, slice brackets, JSON.parse".

### F-FUEL-424 Coach recipes (read-only, from a coach)
- Location: Fuel hub > Recipes tab > For You > "FROM YOUR COACH" section
- User action: taps View Recipe / Add to Diary / the shopping-cart icon / per-ingredient "+Log"
- Behavior:
  1. `coachRecipes` loaded once from `ld("coachRecipes", [])` (40772-40774); written elsewhere at `:50399` (outside range).
  2. Section renders only when non-empty (41537); cards are green-accented with a "Coach" pill (41565-41580).
  3. **View Recipe** toggles `expandedRecipe` by index (41648-41666).
  4. **Add to Diary** maps every ingredient to a diary item: strings get `cal/pro/carb/fat` divided evenly by ingredient count; objects use their own `cal/pro/carb/fat` (41668-41692). Each ingredient is logged **separately** to `"lunch"` (41693-41695).
  5. Marks `added[cr.id]`, which is **never cleared** here (41696-41701).
  6. **Cart icon** parses each ingredient (string, or `amount + item/name`) through `parseIngredient` and calls `addShoppingItem` — with **no dedupe/merge**, unlike RCard (41722-41734).
  7. **Expanded view**: ingredient rows with optional per-ingredient calories and a "+Log" button that logs that single ingredient to `"lunch"` (41757-41812); then numbered INSTRUCTIONS (41813-41830).
- Components: RecipesTab (40760-41832)
- Functions: inline handlers (41648-41830); `parseIngredient` (41905), `addShoppingItem` (41951)
- State: `coachRecipes`, `expandedRecipe`, `added`
- Storage: reads **`lk_coachRecipes`**; writes `lk_shoppingList`, `lk_fuelLog`
- Network: none in range
- AI: none
- Edge cases: even macro-splitting across ingredients is arbitrary — "olive oil, lemon" gets the same calories as "200g salmon" (41671-41677). Division by `cr.ingredients.length` will throw/NaN if `ingredients` is missing but `cal` is present (41672) — `(cr.ingredients || [])` guards the map at 41669 but the divisor at 41672 dereferences `cr.ingredients` directly; safe only because the map never runs on undefined. Everything logs to `"lunch"`. The cart path can add the same item repeatedly.
- Gating: present only if a coach has pushed recipes (`lk_coachRecipes` non-empty)
- Status: PARTIAL
- Evidence for status: 41722-41734 — no merge, so tapping the cart twice duplicates every ingredient row, the exact bug fixed for RCard at 40763-40768.
- Notes: this whole 300-line block duplicates RCard's job with a different visual language and different bugs — a prime consolidation target.

### F-FUEL-425 Shopping-list & store helper layer (in range, not a Fuel-entry UI)
- Location: no UI in my range — these are module-level helpers consumed by `MyStoresTab` (42079, outside range) and the Shop/Budget surface
- User action: n/a
- Behavior: `getShoppingList`/`saveShoppingList` read/write `lk_shoppingList` (41945-41950); `addShoppingItem` appends `{id:"sh_"+Date.now()+"_"+random, itemName, quantity, unit, category, dateAdded, checked:false}` (41951-41967); `removeShoppingItem` filters by id (41968-41973); `toggleShoppingItem` flips `checked` (41974-41981); `categorizeItem` buckets by substring into meat/dairy/produce/pantry/snacks/other (41982-41992); `exportShoppingList` renders a plain-text list grouped by category with ☑/☐ marks (41993-42009); `buildStoreSearchUrl` maps a store URL to one of 13 retailer search patterns, else appends `/search?q=` (42067-42072); `getMyStores`/`saveMyStores` read/write `lk_myStores` (42073-42078).
- Components: none
- Functions: as listed above, plus `UNIT_NORM` (41833-41882), `smartUnit` (41883-41904), `parseIngredient` (41905-41944), `STORE_PATTERNS` (42010-42024), `STORE_PALETTE` (42025), `STORE_PRESETS` (42026-42066)
- State: none (module scope)
- Storage: `lk_shoppingList`, `lk_myStores`
- Network: none (URLs are built, not fetched)
- AI: none
- Edge cases: `categorizeItem` matches "cream" before "ice cream" would reach snacks, and "coconut oil" lands in pantry via "oil" — order-dependent substring rules (41982-41991). `smartUnit` returns `"qty"` for anything unmatched (41903).
- Gating: always on
- Status: WORKING
- Evidence for status: 41945-42078 — pure helpers with real callers at 41155-41167 and 41722-41733.
- Notes: **flagged as out-of-scope for the Fuel-entry redesign** — audited only because it sits inside my assigned line range. The redesign team should assign 41833-42078 to whoever owns Shop/Budget.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| ListTab | component | 38554-39087 | Free-text meal entry + today's diary | FuelHub `:37433` | estimate, log, addItem, removeItem, Ic | F-FUEL-400..404 |
| estimate | function (inner) | 38559-38639 | POST description to /analyze-meal, parse or fall back | ESTIMATE MACROS button 38716 | fetch, authHeaders, estimateMacros, setPreview | F-FUEL-401 |
| log (ListTab) | handler | 38640-38650 | Log every previewed item to the chosen meal | LOG THIS MEAL 38743 | p.addItem | F-FUEL-402 |
| diary render IIFE | function (inline) | 38794-39084 | Group diary items by meal and render totals | ListTab render | p.removeItem, Ic | F-FUEL-403, 404 |
| ManualEntry | component | 39088-39297 | Collapsed prompt + custom macro form | SearchTab 40355 | add, Ic | F-FUEL-405, 406 |
| add (ManualEntry) | handler | 39094-39110 | Validate and emit a manual food item | ADD button 39267 | p.onAdd, parseInt | F-FUEL-406 |
| isSpecificQuery | function | 39298-39303 | True if query names a brand or contains a digit | rankFoodResults 39305 | RegExp.test | F-FUEL-408 |
| rankFoodResults | function | 39304-39354 | Score, sort and tag ★BEST across merged pools | mergeAndRank 39544 | isSpecificQuery | F-FUEL-408 |
| SearchTab | component | 39355-40359 | Multi-source food search, detail card, My Store | FuelHub `:37438` | search, logSelected, saveToMyStore, ManualEntry | F-FUEL-407..412 |
| setStoreItems | function (inner) | 39375-39378 | Set My Store state and persist to lk_myGroceries | saveToMyStore, delete handler 39697 | sd | F-FUEL-410 |
| saveUsdaKey | function (inner) | 39379-39384 | Persist the USDA key (blank → DEMO_KEY) | SAVE 39770 | sd | F-FUEL-411 |
| searchUSDA | function (inner) | 39440-39479 | Query USDA FDC, map nutrient ids to /100g | search 39563 | fetch | F-FUEL-407 |
| searchFatSecret | function (inner) | 39480-39493 | Query the worker's FatSecret proxy | search 39566 | fetch | F-FUEL-407 |
| search | function (inner) | 39493-39587 | Barcode shortcut, local-first, 3-source fan-out | Go 40? (39906), Enter 39866 | p.onScan, searchUSDA, searchFatSecret, fetch, mergeAndRank | F-FUEL-407, 412 |
| mergeAndRank | function (inner) | 39531-39545 | Dedupe pools by name, then rank | search 39547, 39557 | rankFoodResults | F-FUEL-407, 408 |
| saveToMyStore | function (inner) | 39546-39563 | Scale by grams and save to My Store | Save 39982 | setStoreItems | F-FUEL-410 |
| logSelected | function (inner) | 39564-39580 | Scale selected food by grams and log it | Log to <Meal> 40121 | p.addItem | F-FUEL-409 |
| grams-preview IIFE | function (inline) | 40088-40103 | Recompute the four macro tiles from grams | SearchTab render | — | F-FUEL-409 |
| PhotoTab | component | 40360-40759 | Photo/description AI meal analysis | FuelHub `:37454` | handleFile, analyze, log, Ic | F-FUEL-413..415 |
| handleFile | handler | 40367-40376 | Read the picked image as a base64 data URL | both file inputs 40681, 40691 | FileReader.readAsDataURL | F-FUEL-413 |
| analyze | function (inner) | 40377-40441 | POST base64+description to /analyze-meal | ANALYZE PHOTO 40716 | fetch, authHeaders, window.LOCKED.toast | F-FUEL-414 |
| log (PhotoTab) | handler | 40442-40452 | Log all analysed items and reset the tab | Log Meal 40751 | p.addItem | F-FUEL-415 |
| RecipesTab | component | 40760-41832 | Static, AI, pantry and coach recipes | FuelHub `:37456` | generatePantryRecipes, generateAIMeals, RCard, aiCall | F-FUEL-416..424 |
| isTrainingDay IIFE | function (inline) | 40780-40787 | True if p.history has an entry dated today | RecipesTab body | isoDay | F-FUEL-420 |
| generatePantryRecipes | function (inner) | 40791-40824 | Ask the model for 4 recipes from pantry stock | Generate… 41302 | getPantry, aiCall | F-FUEL-423 |
| generateAIMeals | function (inner) | 40825-40851 | Ask the model for 4 goal-matched meals | Meal ideas 41461 | aiCall | F-FUEL-420 |
| RCard | component (nested) | 40920-41192 | One recipe card: macros, ingredients, steps, 2 actions | RecipesTab 41355, 41522, 41533 | p.addItem, parseIngredient, addShoppingItem, Ic | F-FUEL-418, 419 |
| setShoppingDone | function (inner) | 40927-40934 | Set/clear this card's "added to shop" flag | Add to shop 41156, 41171 | setShopDone | F-FUEL-419 |
| Add-to-diary handler | handler | 41125-41150 | Log the recipe as one lunch item, 2 s confirm | RCard footer | p.addItem, setAdded | F-FUEL-418 |
| Add-to-shop handler | handler | 41152-41174 | Merge each parsed ingredient into the shopping list | RCard footer | parseIngredient, getShoppingList, saveShoppingList, addShoppingItem, lcName | F-FUEL-419 |
| shown filter IIFE | function (inline) | 41193-41199 | Filter classic recipes by diet and cut goal | RecipesTab body | — | F-FUEL-417 |
| pantry-stock IIFE | function (inline) | 41242-41300 | Render the "IN YOUR PANTRY" summary or empty state | RecipesTab render | getPantry | F-FUEL-423 |
| Plan-my-day handler | handler | 41380-41416 | Ask for 4 slot-tagged meals and parse them | Plan my day 41417 | aiCall | F-FUEL-421 |
| Log-Full-Day handler | handler | 41496-41516 | Bulk-log the AI plan into its four slots | Log Full Day 41517 | p.addItem, setAdded | F-FUEL-422 |
| Coach add-to-diary handler | handler | 41668-41702 | Log every coach ingredient separately to lunch | Add to Diary 41703 | p.addItem, setAdded | F-FUEL-424 |
| Coach add-to-shop handler | handler | 41722-41734 | Push coach ingredients to the shopping list | cart icon 41735 | parseIngredient, addShoppingItem | F-FUEL-424 |
| Coach +Log handler | handler | 41783-41806 | Log a single coach ingredient to lunch | +Log 41807 | p.addItem | F-FUEL-424 |
| UNIT_NORM | const map | 41833-41882 | Canonicalise ~50 unit spellings | parseIngredient 41917 | — | F-FUEL-419, 425 |
| smartUnit | function | 41883-41904 | Guess a sensible unit from a food name | parseIngredient, addShoppingItem | RegExp.test | F-FUEL-419, 425 |
| parseIngredient | function | 41905-41944 | Split "2 cups rice" into {name, quantity, unit} | RCard 41157, coach 41730 | UNIT_NORM, smartUnit | F-FUEL-419, 424, 425 |
| getShoppingList | function | 41945-41947 | Read lk_shoppingList | RCard 41158, helpers | ld | F-FUEL-419, 425 |
| saveShoppingList | function | 41948-41950 | Write lk_shoppingList | addShoppingItem, RCard 41163 | sd | F-FUEL-419, 425 |
| addShoppingItem | function | 41951-41967 | Append a categorised shopping row | RCard 41166, coach 41731 | getShoppingList, categorizeItem, smartUnit, saveShoppingList | F-FUEL-419, 424, 425 |
| removeShoppingItem | function | 41968-41973 | Delete a shopping row by id | Shop tab (outside range) | getShoppingList, saveShoppingList | F-FUEL-425 |
| toggleShoppingItem | function | 41974-41981 | Flip a row's checked flag | Shop tab (outside range) | getShoppingList, saveShoppingList | F-FUEL-425 |
| categorizeItem | function | 41982-41992 | Substring-bucket an item into a store aisle | addShoppingItem 41953 | — | F-FUEL-425 |
| exportShoppingList | function | 41993-42009 | Render the list as grouped plain text | Shop tab (outside range) | getShoppingList | F-FUEL-425 |
| STORE_PATTERNS | const map | 42010-42024 | 13 retailer search-URL templates | buildStoreSearchUrl | — | F-FUEL-425 |
| STORE_PALETTE | const array | 42025 | 10 store accent colours | MyStoresTab (outside range) | — | F-FUEL-425 |
| STORE_PRESETS | const array | 42026-42066 | 10 preset retailers with descriptions | MyStoresTab (outside range) | — | F-FUEL-425 |
| buildStoreSearchUrl | function | 42067-42072 | Build a retailer search URL for a query | MyStoresTab (outside range) | encodeURIComponent | F-FUEL-425 |
| getMyStores | function | 42073-42075 | Read lk_myStores | MyStoresTab 42081 | ld | F-FUEL-425 |
| saveMyStores | function | 42076-42078 | Write lk_myStores | MyStoresTab (outside range) | sd | F-FUEL-425 |

**Counts: 26 features (F-FUEL-400 … F-FUEL-425); 52 indexed entries (7 components incl. nested RCard, 45 functions/handlers/consts).**

---

## Food entry paths

| Path | Where | Collects | Accuracy | Network dependency | Fallback on failure |
|---|---|---|---|---|---|
| Free-text AI estimate | ListTab textarea 38680-38735 | meal slot + free text | Model-dependent; portion inferred from words only | **Hard** — POST /analyze-meal (38563) | Silent: local `estimateMacros` (`:35657`), then a fixed 400 kcal / 25-45-30 split (38595-38638). **No error shown.** |
| Text search | SearchTab 39493-39587 | query, grams, meal slot | Highest — real per-100 g database values | Partial — local `FOODS` (`:34768`) and My Store render offline (39546-39549); USDA/FatSecret/OFF need network | Local + store results only; **no message if all three remote sources fail** (39563-39586) |
| Barcode | typed digits 39496 / icon 39882 | GTIN | Exact product when found | Hard (handled in BarcodeTab, outside range) | Out of range — UNVERIFIED |
| Photo / AI vision | PhotoTab 40377-40441 | photo (base64) and/or note, meal slot | Lowest — visual portion estimate, totals shown without item breakdown | **Hard** — POST /analyze-meal (40385) | Parse failure → keyword guess 250/300/400/650/700/750 kcal (40416-40434); network failure → toast + no result (40437-40440) |
| Manual macros | ManualEntry 39094-39110 | name + 4 integers | Exactly what the user types, **truncated to integers** (39098-39101) | **None** — fully offline | n/a |
| Recipe (static) | RCard 41125-41150 | one tap | Fixed hardcoded recipe totals (40851-40919) | None | n/a |
| Recipe (AI / pantry) | 40825-40851, 40791-40824, 41380-41416 | one tap after generation | Model-estimated recipe totals | Generation needs POST `/` (`:2664`); logging is offline | "Could not parse…" / "Connection issue. Try again." (40843-40850, 40817-40822, 41407-41414) |
| Coach recipe | 41668-41702 | one tap, or per-ingredient +Log | Coach-authored; string ingredients get macros split evenly (41671-41677) | None (read from `lk_coachRecipes`) | n/a |
| Quick-add | **does not exist in my range** | — | — | — | — |

No path lets the user set a **time** for a meal, and only Log Full Day (41500) respects a per-meal slot chosen by anything other than the tab's own selector.

## AI meal analysis (`/analyze-meal`)

**Endpoint:** `https://lockedapi.cescocugliari.workers.dev/analyze-meal`, `POST`, called from exactly two places: ListTab 38563-38569 and PhotoTab 40385-40389.

**Headers:** `authHeaders()` (`:2652-2662`) → `{"Content-Type":"application/json"}` plus `Authorization: Bearer <window.LOCKED.session.access_token>` when a session exists. The token read is wrapped in an empty try/catch, so an unauthenticated call is sent silently (`:2656-2660`).

**Request body:**
- ListTab: `{ "description": "<trimmed textarea>" }` (38566-38568) — never carries an image.
- PhotoTab: `{ "description"?: "<trimmed note>", "base64"?: "<FileReader data URL>" }` — both keys optional, at least one guaranteed by the guard at 40378 (40381-40384).

**Image handling:** `FileReader.readAsDataURL` (40375) — the value assigned to `base64` therefore **includes the `data:<mime>;base64,` prefix**. There is **no downscaling, re-encoding or size limit**, even though `resizeImage(file, maxW, cb)` exists at `:2878` and is used elsewhere in the app. UNVERIFIED: whether the worker strips the data-URL prefix before forwarding to the model — confirming requires the Cloudflare Worker source, which is not in this repo.

**System prompt:** **not present in this file.** Unlike the recipe features (which pass their prompts client-side via `aiCall`), `/analyze-meal` sends only data — the model choice, system prompt and token limits all live server-side. UNVERIFIED; resolve by reading the worker source or `workers_get_worker_code` for `lockedapi`.

**Response shape (as parsed):** Anthropic Messages format — `{ content: [ { text: "<string>" } ] }` (38572, 40393). The text is expected to contain a JSON array of `{name, cal, pro, carb, fat}`.

**Parsing (identical in both callers):**
1. `txt = d.content[0].text || ""` (38572 / 40393).
2. `s = txt.indexOf("[")`, `e = txt.lastIndexOf("]")` (38574-38575 / 40394-40395).
3. `JSON.parse(s>=0 && e>s ? txt.slice(s, e+1) : txt)` (38576 / 40396).
4. Throw if not an array or empty (38576 / 40397).
5. Reduce to totals with `|| 0` per field (38577-38590 / 40398-40411).

**Failure modes:**
| Mode | ListTab | PhotoTab |
|---|---|---|
| Non-JSON / truncated / prose reply | `estimateMacros` then 400/250/700/450 kcal guess (38595-38617) | keyword guess 250–750 kcal (40416-40434) |
| Empty array | same as above (38576) | same as above (40397) |
| Network / DNS / CORS failure | `estimateMacros` then fixed 400 kcal, **silent** (38620-38638) | toast "Couldn't analyse that photo…", **no result** (40437-40440) |
| Quota-gated response (`d.gated`) | **not handled** — falls into the parse-failure guess (38571-38618) | **not handled** — same (40392-40435) |
| Hung request | no timeout — button stuck on "ESTIMATING…" (38731) | no timeout — stuck on "ANALYZING…" (40724) |
| HTTP 4xx/5xx with a JSON body | `r.json()` succeeds, `d.content` undefined → `txt = ""` → parse throws → fabricated macros | same |

The single most important finding for the redesign: **on both paths a failure produces fabricated macros that are rendered in exactly the same UI as a real AI result**, with no badge, disclaimer or retry prompt (38591-38594 vs 38617; 40412-40415 vs 40427).

## Logged food record shape

Every entry method converges on `p.addItem(meal, item)` → `:37045-37053`, which appends `item` to `day.meals[meal]` and persists the whole `fuelLog` under `lk_fuelLog` keyed by `isoDay()` (`:36922-36928`, `:36932`).

The item object is:

```
{
  name:  string,   // required by every producer
  cal:   number,
  pro:   number,
  carb:  number,
  fat:   number
}
```

Producers, verbatim:
- Search: 39568-39575 — all four numbers `Math.round(per100g * grams/100)`.
- Manual: 39095-39102 — `parseInt` on all four (integers only).
- AI text / photo: 38644-38646, 40446 — the model's raw object is passed through **unfiltered**, so any extra keys the model emits are stored verbatim in the diary.
- Recipe: 41129-41134 — recipe totals as one item.
- Coach ingredient: 41671-41691, 41784-41799.

There is **no** id, no timestamp, no source/provenance field, no serving or gram amount, no confidence marker, and no per-item meal field. Consequences visible in this range: rows are addressed only by array index (38966), so edits are impossible and deletes are index-based; and there is no way to tell a hand-typed row from a 400 kcal AI fallback after the fact.

The diary reader assumes all four numeric fields may be missing and defaults them with `|| 0` (38856-38878, 38913-38955).

## Storage keys touched

All keys are prefixed `lk_` by `ld`/`sd` (`:2419`, `:2437`).

| Key | Read | Written | Feature |
|---|---|---|---|
| `lk_fuelLog` | via `p.day` prop (`:36932`) | via parent `addItem`/`removeItem` (`:37045`, `:37054`, `:36922`) | F-FUEL-402, 404, 406, 409, 415, 418, 422, 424 |
| `lk_myGroceries` | 39366 | 39377 | F-FUEL-410 |
| `lk_usdaKey` | 39369 | 39381 | F-FUEL-411 |
| `lk_coachRecipes` | 40773 | not in range (written `:50399`) | F-FUEL-424 |
| `lk_shoppingList` | 41946 | 41949 | F-FUEL-419, 424, 425 |
| `lk_myStores` | 42074 | 42077 | F-FUEL-425 |
| `lk_fuelProfile` | via `p.fuelProfile` prop (`:36912`) | not in range | F-FUEL-417, 420, 421, 423 |
| `lk_betaStatus` | inside `aiCall` (`:2699`) | not in range | F-FUEL-420, 421, 423 |
| pantry key | via `getPantry()` (`:43415`) | not in range | F-FUEL-423 |

## Security findings

1. **No hardcoded secret found in my range.** The only credential-shaped literal is `"DEMO_KEY"` (39368, 39380, 39441) — USDA's public shared sentinel, not a private key. Value recorded as-is because it is a documented public placeholder, not a secret.
2. **User-supplied USDA key travels in a URL query string** — `&api_key=` + key (39442). Variable `usdaKey` (39368), persisted at `lk_usdaKey` (39381), value `[REDACTED]` at runtime. URLs are logged by browsers, proxies and USDA's own access logs. Should move to a header or proxy through the worker like FatSecret already does (39481).
3. **Two of three food sources are called direct from the browser**: USDA (39441) and Open Food Facts (39568) — the user's raw search terms and the app's traffic pattern are exposed to third parties with no proxy. FatSecret is correctly proxied (39481).
4. **`/analyze-meal` accepts unauthenticated calls silently** — `authHeaders` swallows any error reading the session and omits the `Authorization` header rather than failing (`:2656-2660`), so a signed-out client still POSTs images to the worker. Server-side enforcement is UNVERIFIED.
5. **Unbounded image upload** — full-resolution base64 with no size cap (40375, 40384); a trivially cheap way to run up worker costs.

## Open questions / UNVERIFIED

1. **The `/analyze-meal` model, system prompt and token limits.** Not in this file. Confirm by reading the Cloudflare Worker source for `lockedapi` (e.g. `workers_get_worker_code`).
2. **Whether the worker strips the `data:image/...;base64,` prefix** from `base64` (40384). Confirm from the worker source, or by POSTing a known image both with and without the prefix.
3. **Whether `/analyze-meal` returns a `gated` field** like the root endpoint does (`:2691`). If it does, both callers mishandle it (38571, 40392). Confirm by exhausting the daily quota and inspecting the raw response.
4. **Does `BarcodeTab` set `_serving`?** SearchTab renders `selected._serving` (39962-39969) but nothing in 38554-42078 assigns it. Grep `_serving` outside my range.
5. **Rapid double-delete in the diary** (38966): whether two taps inside one React batch delete the wrong rows, given `entry.idx` is closed over a stale `allItems`. Needs a runtime test.
6. **The pantry storage key** used by `getPantry()` (`:43415`) — outside my range; read that function to fill in the storage table.
7. **The "1,000 req/hour" claim** for USDA's shared DEMO_KEY (39724) — check against USDA FDC's current published rate limits; the real DEMO_KEY limit is believed to be far lower.
8. **`max_tokens: 700`** (`:2668`) versus the 4-recipe-with-steps demand of F-FUEL-420/421/423 — measure a real response's token count to confirm truncation is the dominant "Could not parse" cause.
9. **`window.LOCKED.toast`** is called defensively (40439) — confirm it is always defined at the time PhotoTab can be reached, or the error is swallowed entirely.
