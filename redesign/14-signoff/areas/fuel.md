### F-FUEL-001 — "More nutrition" expandable micronutrient panel
- location: Fuel tab > (intended) day summary card > "MORE NUTRITION" disclosure row
- user action: taps the "MORE NUTRITION" row to expand/collapse a micronutrient table
- behaviour: 1. `sumDayNutrients(p.day)` walks `breakfast/lunch/dinner/snacks` and sums every key in `NUTRIENTS_P1 + NUTRIENTS_P2` from each item's `nut` object; any item missing a key sets `missing[k] = true` (L18731–18759). 2. If `itemCount === 0` the component renders `null` (L19696). 3. Targets come from `nutrientTargets(profile, adaptiveTDEE || tdee || 2200)` (L19698). 4. Rows = all four P1 nutrients always, plus each P2 nutrient that has a non-null total (L19699–19702). 5. Collapsed by default; the caret is `▸`/`▾` (L19740). 6. Each row prints `value + ("*" if partial) + unit`, and `of ≈<goal> <unit>` when a goal exists; `—` when the total is null (L19755–19771). 7. If any row is null or partial, a footnote "— / * = no data for some logged items" is shown (L19772–19778).
- v6 status: **DEAD**

### F-FUEL-002 — Nutrition Trends tab (range toggle + three charts)
- location: Fuel tab > "trends" sub-tab (mounted at L37450–37454)
- user action: opens the Trends sub-tab; taps the 7 days / 30 days segmented control
- behaviour: 1. `dailyIntakeSeries(p.fuelLog, range)` builds one row per day going back `range` days, summing `cal/pro/carb/fat`, item count, and `fiber`/`sodium` (null when nothing carries them) (L19342–19375). 2. Range segmented control `DsSegmented` with options 7 / 30, default 7 (L19782, L19812–19833). 3. Card 1 "Calories per day vs target": inline SVG bar chart, viewBox width `series.length*14+10`, height 110, bars 9px wide at 14px pitch. Bar height `max(3, cal/maxCal*90)`; empty days render height 0 with colour `SU`. Bars are `#F59E0B`, opacity 1 when over target else 0.85 (L19843–19889). A dashed target line is drawn only when `p.calTarget > 0` (L19858–19869). 4. Caption: "Dashed line = your target. Logged N of RANGE days." (L19890–19898). 5. Card 2 "Daily averages (logged days)": 3-column grid of six tiles — Calories, Protein g, Carbs g, Fat g, Fiber g, Sodium mg — each the mean over days with `items > 0`, nulls excluded, rounded (L19787–19800 for `avg`, L19918–19950 for the tiles). Empty state: "Nothing logged in this window yet." (L19910–19916). 6. Card 3 "Weight trend": rendered only when `computeTrend(p.weightLog).slice(-range).length > 1`. Polyline of the EMA trend, stroke `#8B5CF6`, y auto-scaled with a minimum span of 0.5 kg (L19951–19957 / L19962–19990 region within the component, ending L20037).
- v6 status: **WORKING**

### F-FUEL-003 — Recipe log sheet (bottom sheet: servings, meal slot, log)
- location: Recipes context > tap a recipe > bottom sheet modal
- user action: picks a meal slot, steps servings up/down, taps "Log to <slot>"
- behaviour: 1. Sheet opens as a portal (`lkPortal`) with `role="dialog"`, `aria-modal`, focus target `lkDialogRef`, and Escape wired via `useEscape(p.onClose)` (L20040, L20079–20096). 2. Default slot = `slotForNow()` — breakfast <11h, lunch <15h, dinner <21h, else snacks (L18936–18942, L20042). 3. Header shows per-serving macros from `p.perServing` (L20140–20152). 4. Four slot buttons; the active one is orange-outlined (L20153–20182). 5. Servings stepper: `−` clamps to min 0.5, `+` to max 12, both snapped to 0.5 increments (L20189–20215, L20232–20250). 6. A live 4-tile Cal/Pro/Carb/Fat preview multiplies per-serving by `n` (L20253–20272 region). 7. "Log to <slot>" builds the item `{name, cal, pro, carb, fat, src:"recipe", qty:{n, unit:"serving"}}`, adds `est:true` if `p.est`, and scales `per.nut` micros by `n` to 1 decimal, then calls `p.addItem(slot, item)` and `p.onClose(true)` (L20051–20077). 8. "Cancel" and the backdrop both call `p.onClose(false)` (L20097–20105).
- v6 status: **DEAD**

### F-FUEL-004 — Recipe builder (create a user recipe)
- location: Recipes context > "NEW RECIPE" card
- user action: types a name, searches and adds ingredients, sets grams per ingredient, toggles raw/cooked, adds manual ingredients, sets servings, taps SAVE RECIPE
- behaviour: 1. Name input (L20415–20434). 2. Ingredient search: typing ≥2 chars runs `pickerResults()`, which scans `FOODS` (the built-in table, L34768), `lk_myGroceries`, and `lk_favFoods` for a case-insensitive substring on the name, concatenated in that order and truncated to 8 (L20288–20328). 3. Tapping a result calls `addIng`, appending `{name, per100, grams:100, cooked:false}` and clearing the query (L20330–20338). 4. Each ingredient row: name (ellipsised), a `DraftNum` grams field (holds keystrokes until blur — the inline comment at L20456–20458 documents that live `parseFloat` deleted the decimal point as you typed), a "g" label, and a remove `✕` (L20443–20510). 5. If `yieldFactorFor(ing.name)` matches (rice 2.8 / pasta 2.4 / oats 2.5 dry, meat & fish 0.75 raw — L19966–19986), a raw/cooked `role="switch"` appears plus the live conversion "≈ X g cooked = Y g dry" using `grams / factor` (L20510–20560). 6. "+ Manual ingredient" opens a per-100g form (name + Cal/Pro/Carb/Fat); `addManual` requires a name and calories, parses with `parseInt`, and stores `nut: null, manual: true` (L20339–20362, L20600–20680). 7. Servings stepper clamps 1–24 (L20690–20760). 8. A "PER SERVING" summary appears once at least one ingredient exists, showing `calcRecipe` output plus a `·`-joined line of the P1 micros (L20762–20790). 9. `save()` requires a non-empty name and ≥1 ingredient; it builds `{id:"ur"+Date.now(), name, servings, ingredients, source:"user", createdAt}`, attaches `perServing = calcRecipe(rec)`, and prepends to `lk_userRecipes` via `saveUserRecipes` (L20368–20385). 10. `saveUserRecipes` persists and dispatches the global `lockedFuelUpdate` event (L19962–19965).
- v6 status: **DEAD**

### F-FUEL-005 — Quick-log food chip (tap to log, long-press to favourite)
- location: Fuel tab > quick-add chip row
- user action: taps a chip to log the food; presses and holds ~500 ms to toggle it as a favourite
- behaviour: 1. `onPointerDown` starts a 500 ms timer (L20803–20810). 2. If the timer fires: `toggleFav(p.item)` and `navigator.vibrate(10)` when supported (L20806–20809). 3. `onPointerUp` clears the timer; if the long-press did not fire, `p.onTap(p.item)` runs (L20811–20814). 4. `onPointerLeave` cancels without firing either action (L20815–20817). 5. Context menu is suppressed so long-press does not open the OS menu (L20822–20824). 6. A favourited chip renders a `★` and an orange-tinted border (L20825–20857).
- v6 status: **DEAD**

### F-FUEL-006 — Barcode scanning — idle / entry screen
- location: Fuel tab > "scan" sub-tab, `mode === "idle"` or `"manual"`
- user action: taps "OPEN CAMERA", or types a barcode and taps "Look up" / presses Enter
- behaviour: 1. Default `mode` is `"idle"` (L20860). A hero card shows a barcode glyph, "Scan a barcode", and the copy "Packaged food logs in seconds — looked up on Open Food Facts, then USDA." (L21400–21460 region). 2. "OPEN CAMERA" calls `startScan` (F-FUEL-007). 3. Below it, a manual-entry card. Its heading switches to "CAMERA UNAVAILABLE — TYPE THE BARCODE" when `mode === "manual"`, otherwise "OR TYPE THE BARCODE" (L21470–21480). 4. The input is `inputMode="numeric"`, placeholder `e.g. 0123456789012`; Enter or the "Look up" button calls `doLookup(gtinInput)` when non-empty (L21490–21548). 5. A `p.gtin` prop handed over from the Search tab seeds the field and triggers `doLookup` immediately, then calls `p.onConsumeGtin()` to clear it (L20868–20876; producer at L37442–37449).
- v6 status: **WORKING**

### F-FUEL-007 — Live camera barcode scanning (BarcodeDetector, ZXing fallback)
- location: Fuel tab > scan sub-tab, `mode === "scanning"`
- user action: taps "OPEN CAMERA", points the camera at a barcode, or taps Cancel
- behaviour: 1. If `navigator.mediaDevices.getUserMedia` is absent, jump straight to `mode="manual"` (L20931–20935). 2. Request `{video:{facingMode:"environment"}}`; on grant store the stream, set `mode="scanning"`, and wait 50 ms for the `<video>` to mount (L20936–20944). 3. Attach the stream, `play()` with a swallowed rejection (L20945–20947). 4. **Path A** — if `"BarcodeDetector" in window`, construct one for `ean_13, ean_8, upc_a, upc_e`; on success poll `det.detect(video)` every 200 ms and pass the first `rawValue` to `onCode` (L20948–20970). 5. **Path B** — otherwise lazily `loadZXing()`, which injects `https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js` and caches the promise, then `new ZX.BrowserMultiFormatReader().decodeFromVideoElement(video, cb)` (L19076–19092, L20971–20985). 6. `onCode` stops the camera, then runs `doLookup` (L20903–20906). 7. UI: full-width `<video playsInline muted>` capped at 320px, an orange horizontal reticle line at 42% height, the hint "Point the camera at the barcode", and a Cancel button that calls `reset()` (L21088–21170). 8. `stopCam()` clears the poll interval, resets the ZXing reader in a try/catch, and stops every `MediaStreamTrack`. It is also the effect cleanup, so unmounting always releases the camera (L20885–20902).
- v6 status: **PARTIAL**

### F-FUEL-008 — Barcode product found — portion, meal, log
- location: Fuel tab > scan sub-tab, `mode === "found"`
- user action: picks a meal slot, edits grams (or taps the "1 serving (Ng)" shortcut), taps "Log to <slot>"
- behaviour: 1. On a successful `lookupBarcode`, `item` is stored, `grams` seeded to `item.servingG || 100`, `mode="found"` (L20913–20919). 2. Header: product name; sub-line = brand · source label (`off` → "Open Food Facts", `usda` → "USDA", else "My Store") · GTIN (L21180–21200). 3. Four meal-slot buttons (shared `mealBtns`, L21057–21086), default `slotForNow()`. 4. Grams `type="number" step="0.01" inputMode="decimal"`; the "1 serving (Ng)" button only appears when `item.servingG` is truthy (L21210–21270). 5. Live Cal/Pro/Carb/Fat tiles recompute at `f = grams/100` on every keystroke (L21275–21330). 6. `logFound()` builds `{name, cal, pro, carb, fat, src: item.src, gtin, qty:{n:grams, unit:"g"}}`, scales `per.nut` micros by `f` to 1 dp, calls `p.addItem(meal, logged)` (L20987–21029). 7. **Side effect** — when the item has a GTIN, it is written to `lk_myGroceries` as per-100g values with `savedAt`, replacing any prior row with the same GTIN, so the next scan or search resolves locally (L21010–21027). 8. `mode="logged"`. 9. When `item.src === "off"`, the ODbL attribution "Product data: © Open Food Facts contributors (ODbL)" is rendered (L21380–21395).
- v6 status: **WORKING**

### F-FUEL-009 — Barcode not found — manual label entry
- location: Fuel tab > scan sub-tab, `mode === "notfound"`
- user action: types the product name and the label's Cal/Pro/Carb/Fat, taps "LOG & SAVE"
- behaviour: 1. When both lookups return null, the GTIN is stashed in `nfGtin`, all `nf*` fields cleared, `mode="notfound"` (L20919–20928). 2. Copy: "Not found — add it yourself" / "Barcode <gtin> isn't in any database yet. Enter the label values once — next scan finds it instantly." (L21335–21360). 3. Meal buttons, name input, and a 2×2 grid of CALORIES / PROTEIN (G) / CARBS (G) / FAT (G) numeric inputs (L21360–21500 region). 4. `logNotFound()` requires name + calories; parses all four with `parseInt`; builds `{name, cal, pro, carb, fat, src:"manual", gtin}`; calls `p.addItem(meal, it)`; then prepends the same object plus `savedAt` to `lk_myGroceries`, replacing any same-GTIN row (L21030–21049). 5. `mode="logged"`.
- v6 status: **PARTIAL**

### F-FUEL-010 — Barcode logged confirmation
- location: Fuel tab > scan sub-tab, `mode === "logged"`
- user action: taps "Scan another"
- behaviour: centred green "Logged ✓" plus a "Scan another" button calling `reset()`, which stops the camera, clears `item` and `gtinInput`, and returns to `mode="idle"` (L21050–21056, L21332–21400 region).

### F-FUEL-011 — Barcode loading state
- location: Fuel tab > scan sub-tab, `mode === "loading"`
- user action: 
- behaviour: renders only the centred text "Looking up product…" (L21172–21178). Set by `doLookup` before `lookupBarcode` resolves (L20913).

### F-FUEL-012 — Fuel display settings card (hide numbers, dashboard framing)
- location: Settings tab > below the weight-unit card, above "DATA & SYNC" (mounted L33105)
- user action: toggles "Hide calorie numbers"; picks "Left" or "Eaten" for dashboard framing
- behaviour: 1. Card header "FUEL DISPLAY" (L21562–21570). 2. Row 1: "Hide calorie numbers" / "Log without the math — progress shows as on track / over" with a `role="switch"` pill toggle (L21571–21622). 3. Row 2: "Dashboard framing" / "Count calories left, or calories eaten" with two segmented buttons `remaining` ("Left") and `consumed` ("Eaten"), default `remaining` (L21623–21676). 4. Every change calls `upd(patch)` → `setFuelSettings(patch)`, which merges into `lk_fuelSettings`, persists, dispatches `lockedFuelUpdate`, and returns the merged object for local state (L18656–18661, L21552–21554).
- v6 status: **WORKING**

### F-FUEL-013 — Privacy disclosure card
- location: Settings tab > "DATA & SYNC" section (mounted L33110)
- user action: taps the header to expand/collapse five plain-language privacy sections
- behaviour: collapsed by default, `+`/`−` affordance, `aria-expanded` set (L21679, L21694–21740). Expanded content = five `row(title, body)` blocks: "On your device", "Cloud sync (signed in)", "AI features", "Beta testers", "Your controls" (L21741–21749).

### F-FUEL-014 — Adaptive TDEE weekly check-in card
- location: Fuel tab > main view, below the weight-log card (mounted L37297)
- user action: reads the card; taps "?" for an explanation; taps "×" to dismiss
- behaviour: 1. Reads `lk_tdeeHistory` and takes the last entry (L21752–21754). 2. Renders `null` unless the entry exists **and** `entry.applied` is true (L21755). 3. Renders `null` if the entry's `weekISO` is more than 3 days old (L21756–21757). 4. Renders `null` if `fuelSettings.tdeeReportDismissed === entry.weekISO` (L21758–21759). 5. Body: "We estimate you burn ≈<adaptiveTDEE||tdee> kcal/day, from <daysUsed> logged days and your weight trend." followed by either " Targets nudged ±N kcal." or " Targets unchanged this week." (L21800–21820). 6. "?" toggles the explainer: "This compares what you log with how your weight trend actually moves… the estimate self-corrects over time." (L21822–21836). 7. "×" calls `setFuelSettings({tdeeReportDismissed: entry.weekISO})` — dismissal is per-week, so next week's entry shows again (L21787–21798). 8. The entry itself is produced by `applyAdaptiveTDEE()`, run once from `FuelTab`'s mount effect (L36982–36986).
- v6 status: **WORKING**

### F-FUEL-015 — Nutrition CSV / JSON export and full-account backup/restore
- location: Settings tab > data section (CSV export mounted L33138; full backup L33157; restore L33200)
- user action: taps export (CSV), taps backup (JSON), picks a file to restore
- behaviour: 1. `exportFuelCSV()` emits `date,meal,item,qty,cal,pro,carb,fat,fiber,sugar,satfat,sodium,src,est` for every logged item across every day, then a blank line and a second `date,weight_kg` table. Fields are RFC-4180-escaped by the inner `esc` (L19376–19399). 2. `downloadText` builds a Blob, clicks a synthetic `<a download>`, and revokes the object URL after 500 ms (L19415–19435). 3. `exportFuelJSON()` bundles `fuelLog, fuelProfile, weightLog, favFoods, userRecipes, supplements, suppLog, fuelSettings, mealPlans, tdeeHistory` (L19400–19414) — **never called**. 4. `exportEverything()` dumps every `localStorage` key starting `lk_` or `__lk_ts__` plus `__lk_last_sync__` raw, as `{format:"locked-full-backup", version:1, exportedAt, keys, keyCount}` (L19436–19453). 5. `importEverything(text, overwrite)` rejects anything whose `format` is not `locked-full-backup`; writes values first and `__lk_ts__` stamps second (the comment at L19467–19474 explains that a single pass lets the sync layer's `localStorage` patch overstamp restored data and make months-old data claim to be current); when `overwrite` is false it skips any key whose local stamp is newer; returns `{written, skipped, exportedAt}` (L19454–19498).

### F-FUEL-016 — Natural-language food text parsing (AI) → local food matching
- location: intended for the Fuel search / voice logging path
- user action: types or dictates something like "2 eggs and toast with butter"
- behaviour: 1. `parseFoodText(text, cb)` calls `aiCall(sys, text, null, onDone, onFail)` with a system prompt demanding a bare JSON array of `{"qty":number,"unit":string,"food":string}` and an allowed-unit whitelist (L19586–19604). Full prompt quoted in the AI section below. 2. The response is salvaged by slicing between the first `[` and the last `]` before `JSON.parse`; any failure calls back `null` (L19588–19603). 3. `matchTuples(tuples)` runs `matchTupleLocal` per tuple and splits into `{matched, unmatched}` (L19681–19692). 4. `matchTupleLocal` scores candidate names 3 (exact) / 2 (substring either way) / 1 (all query words present) / 0, over `favFoods` + `myGroceries` first, then the built-in `FOODS` table; the highest score wins (L19611–19680). 5. Grams: a saved food (fav/grocery) is always taken as **100 g** ("asLogged"); a `FOODS` entry uses `tupleGrams` — `qty × food.g` when the unit is "serving" and the food declares a gram weight, else `qty × UNIT_GRAMS[unit]` with a 100 g fallback (L19605–19610, L19664). 6. `UNIT_GRAMS` is a hardcoded table of 25 unit→gram equivalences: g/ml 1, oz 28.35, cup 240, tbsp 15, tsp 5, slice 30, piece 50, serving 100, scoop 30, can 150, small 80, medium 118, large 150, egg 50 (L19560–19585). 7. The result item carries `src:"local"` and `qty:{n, unit}`, with micros scaled through `scaleNut` (L19666–19680).
- v6 status: **DEAD**

### F-FUEL-017 — AI meal-item normalisation
- location: photo/voice meal-analysis result path
- user action: 
- behaviour: `normalizeAiItems(items)` coerces a model's item array into the logged-item shape — rounds `cal/pro/carb/fat` to integers, defaults the name to "Item", stamps `src:"ai"` and `est:true`, and picks up optional `fiber`, `sugar`, `satfat`/`sat_fat`, `sodium` into a `nut` sub-object only when at least one is present (L19306–19325).
- v6 status: **DEAD** — all three occur once each in the file (definitions only).

### F-FUEL-018 — Pantry depletion on logging + expiry heuristics
- location: intended side-effect of logging a food item
- user action: 
- behaviour: 1. `depletePantry(loggedItem)` fuzzy-matches the logged name against pantry names (substring either direction, or any pantry word >3 chars appearing in the logged name), taking the **first** hit only (L19531–19559). 2. It assumes `quantity × 4` total servings, decrements `servingsLeft` by exactly 1, sets `lowStock` at ≤20% remaining, and when it hits 0 marks `empty` and auto-adds the item to the shopping list via `addShoppingItem` in a swallowed try/catch (L19541–19555). 3. `pantryUseSoon(item)` flags an item as needing use when its age reaches `PANTRY_EXPIRY_DAYS[category] - 3`, with a 30-day fallback for unknown categories. Table: produce 7, meat 4, dairy 10, bakery 5, frozen 60, drinks 90, snacks 60 (L19499–19513). 4. `pantryBestPrice` returns the cheapest recorded price (L19514–19520); `pantryLastPriceFor(name)` finds the most recent price of the first fuzzy-matching pantry item (L19521–19530).
- v6 status: **DEAD** (`depletePantry`) / **UNVERIFIED** (the three pantry read helpers)

### F-FUEL-019 — Weight-trend and intake statistics helpers
- location: model layer feeding F-FUEL-002 and F-FUEL-014
- user action: 
- behaviour: 1. `computeTrend(weightLog, alpha=0.10)` sorts by date and produces an exponentially weighted moving average `trend = α·kg + (1−α)·trend`, seeded by the first valid reading, rounded to 2 dp; non-positive weights are skipped (L19093–19111). 2. `trendOnOrBefore(arr, dateISO)` scans backwards for the last point at or before a date (L19112–19117). 3. `weeklyRatePct(arr)` compares the latest trend against the trend 7 days earlier (falling back to the first point), normalises to a per-week rate, and returns `{pct, kg}`; null when fewer than 2 points or a non-positive span (L19118–19131). 4. `avgIntake(fuelLog, days=7)` averages calories over the last N days **counting only days with ≥1 item**, returning `{avg, days}` or null (L19132–19158).
- v6 status: `computeTrend` and `trendOnOrBefore` **WORKING** (used by `TrendsTab` L19952 and `reconcileTDEE` L19243–19245). `weeklyRatePct` and `avgIntake` are **DEAD** — each occurs once in the file.

### F-FUEL-020 — Fuel micro-helpers (slots, favourites, training day, water goal)
- location: model layer - Behavior / status, one line each: - `slotForNow()` — time-of-day meal slot, thresholds 11/15/21 (L18936). **WORKING**, used by `RecipeLogSheet` (L20042) and `BarcodeTab` (L20864). - `nextSlot(s)` — cycles breakfast→lunch→dinner→snacks→breakfast (L18943). **DEAD**, one occurrence. - `isTrainingDayToday(history)` — true if any history entry's `dateISO` equals today (L18947). **DEAD**, one occurrence. - `waterGoal(profile, settings)` — `settings.waterGoalMl` if >0, else `35 ml × kg` rounded to the nearest 50, else a flat 3000 ml (L18955). **DEAD**, one occurrence. - `getFavFoods` / `isFav` / `toggleFav` (L18911/L18914/L18920) — favourites list in `lk_favFoods`, matched on the normalised name; `toggleFav` stamps `savedAt` and dispatches `lockedFuelUpdate`. `toggleFav` is called only by the dead `QuickChip`; `isFav` has one occurrence. **DEAD**. - `getRecentFoods(fuelLog, limit=12)` — most recent distinct foods, walking days newest-first and slots in the order snacks→dinner→lunch→breakfast (L18852). **DEAD**. - `getFrequentFoods(fuelLog, days=30, limit=8)` — foods logged ≥3 times in the window, ranked by count (L18878). **DEAD**. Its cache ignores the `days` argument (L18881–18882) — calling it with a different window returns the previous window's result. - `normFoodName(n)` — lowercase, trim, collapse whitespace (L18842). **WORKING**, the join key everywhere.
- user action: 
- behaviour: 

### F-FUEL-200 — Fuel tab shell / header
- location: Fuel tab > main view > header block
- user action: Selects the Fuel tab in the app nav; sees the "FUEL" title with two header buttons.
- behaviour: 1. `FuelTab` reads fuel settings via `getFuelSettings()` (36899) and derives `hideNums` (36900) and `eatenFraming` (36904). 2. Renders a gradient header band, `padding: "52px 20px 16px"` with `linear-gradient(180deg,OR_H+"18" 0%,transparent 100%)` (37078–37082). 3. `h1` "FUEL" at `fontSize: "2rem"`, weight 800 (37090–37096). 4. Right side: "Shop" button (aria-label "Shopping and budget") and "My Profile" button (aria-label "Fuel profile and targets") (37103–37160). 5. Body wrapper has `paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))"` with a code comment explaining the floating voice button used to cover the Smart Nutrition dismiss X (37069–37077).
- v6 status: WORKING

### F-FUEL-201 — Fuel sub-tab navigation (Log / Meals toggle + pill row)
- location: Fuel tab > main view > tab strip below the macro card
- user action: Taps "Log" or "Meals" segmented buttons; then taps a pill (List / Search / Scan / Photo / Trends / Supps / Stack) or (Meal Plans / Recipes).
- behaviour: 1. An IIFE renders the whole strip (37388–37468... actually 37388 onward; strip IIFE at 37388–37462). 2. `outerMeals = tab === "plan" || tab === "recipes"` (37389). 3. `logTabs` array is `[["list","List"],["search","Search"],["scan","Scan"],["photo","Photo"],["trends","Trends"],["supps","Supps"]]` (37390). 4. If `ld("perfTracking", false)` is truthy, `["cycle","Stack"]` is appended (37391). 5. Top segmented control: "Log" button sets `tab` to `"list"` only when currently in the meals group (37400–37419); "Meals" button sets `tab` to `"plan"` only when not already in the meals group (37420–37437). 6. When not in the meals group, a horizontally scrollable pill row renders `logTabs` (37438–37448 region; `overflowX: "auto"` at 37440). 7. When in the meals group, a two-button row renders `[["plan","Meal Plans"],["recipes","Recipes"]]` (37449–37461). 8. Content area `padding: "12px 20px"` routes on `tab` (37463–37468 region, routing block 37464 onward).
- v6 status: WORKING

### F-FUEL-202 — Calorie / macro summary card (MacroRing + macro bars)
- location: Fuel tab > main view > summary card directly under header
- user action: Passive; the card reflects everything logged today.
- behaviour: 1. `getDay()` returns `fuelLog[todayISO]` or a default `{meals:{breakfast:[],lunch:[],dinner:[],snacks:[]},water:0}` (36932–36942). 2. All items across the four meal keys are flattened into `allItems` (36959–36966). 3. `totalCal`, `totalPro`, `totalCarb`, `totalFat` are reduced sums with `|| 0` per field (36967–36978). 4. `MacroRing` renders at `size: 90, stroke: 9, color: OR, pct: totalCal / targets.cal` (37170–37175). 5. Centre label: if `hideNums`, shows "Over" (color `WA`) when `totalCal > targets.cal` else "On track" (color `GR`) (37185–37197); otherwise `fmtCal(totalCal)` with `/targets.cal` subscript (37198–37211) and a caption "kcal eaten" or "kcal" depending on `eatenFraming` (37212–37218). 6. Three macro rows — Protein (`BLU`), Carbs (`WA`), Fat (`FAT`) — each with label, value/target, a 5px progress bar clamped at 100%, and a "Ng left" / "Ng eaten" line (37219–37320 region). 7. `hideNums` swaps each macro value for "Over"/"On track" (37270–37274) and suppresses the `/target` suffix and the left/eaten line.
- v6 status: WORKING *(corrected in Wave 3 — was BROKEN)* - **Wave 3 correction:** the original BROKEN status cited 37270/37287, which are CSS style properties, not the logic described. The real code is at 37275/37281. The posited NaN cannot occur: `fmtQ` (4349-4354) returns `String(r)` or `""`, never `"NaN"`. Reclassified WORKING with a code smell. See WAVE3_VERIFICATION.md.

### F-FUEL-203 — MacroRing SVG progress ring
- location: reusable — Fuel summary card (and any caller)
- user action: none (visual)
- behaviour: 1. `size` defaults 120, `stroke` defaults 10 (35764–35765). 2. Radius `(size - stroke) / 2`; circumference uses a hardcoded `3.14159` rather than `Math.PI` (35766–35767). 3. `pct` clamped to max 1 (35768). 4. `strokeDasharray` built as `pct*circ + " " + (circ - pct*circ)` (35769). 5. Two concentric circles: track stroked `SU`, progress stroked `p.color || OR` with `strokeLinecap: "round"` (35777–35791). 6. Whole `svg` rotated `-90deg` so the arc starts at 12 o'clock (35773–35775).
- v6 status: WORKING

### F-FUEL-204 — Fuel Profile Setup — open / back / save
- location: Fuel tab > header "My Profile" button > full-screen Fuel Profile screen
- user action: Taps "My Profile" (37136–37160); fills the form; taps "SAVE PROFILE"; or taps Back.
- behaviour: 1. Tapping "My Profile" calls `setView("profile")` (37142–37144). 2. `FuelTab` short-circuits its render: `if (view === "profile") return React.createElement(FuelProfileSetup, {...})` (37058–37066). 3. `FuelProfileSetup` seeds every field from `p.fuelProfile` with fallbacks (35795–35816). 4. Header: 52px top padding, Back `Ic` button (aria-label "Back"), title "Fuel Profile" 1.625rem/800, subtitle "Your stats power calorie and macro targets." (35917–35979). 5. `save()` (35829–35887) converts to metric, computes TDEE/macros and calls `p.onSave(prof)`. 6. `onSave` in FuelTab calls `setFuelProfile(prof)` (which writes localStorage) and `setView("main")` (37061–37065). 7. Back button calls `p.onBack` → `setView("main")` (37059–37061).
- v6 status: WORKING

### F-FUEL-205 — Fuel Profile — body weight input + unit toggle
- location: Fuel Profile screen > BODY WEIGHT section
- user action: Taps LBS/KG; types a weight.
- behaviour: 1. Two toggle buttons rendered from `["lbs","kg"]`, active one bordered/tinted `OR` (35997–36020). 2. Numeric input, `inputMode: "decimal"`, `type: "number"`, `step: "0.01"`, placeholder "e.g. 185" (lbs) or "e.g. 84" (kg) (36021–36041). 3. Border turns `OR` once a value is present (36032). 4. On save: `kg = weightUnit === "kg" ? parseFloat(weightVal) : parseFloat(weightVal) / 2.20462` (35830).
- v6 status: PARTIAL

### F-FUEL-206 — Fuel Profile — height input (ft/in or cm)
- location: Fuel Profile screen > HEIGHT section
- user action: Taps ft/cm; types feet+inches or centimetres.
- behaviour: 1. Toggle from `["ft","cm"]` (36055–36078). 2. `ft` mode renders two numeric inputs with literal "ft" and "in" separators, placeholders "5" and "10" (36079–36150). 3. `cm` mode renders one numeric input, placeholder "e.g. 178" (36151–36174). 4. On save: `cm = heightUnit === "cm" ? parseFloat(heightCm) : (parseInt(heightFt)||0)*30.48 + (parseInt(heightIn)||0)*2.54` (35831). 5. Stored as `heightFt`, `heightIn`, `heightCmRaw`, `heightUnit`, and rounded `heightCm` (35834–35840).
- v6 status: PARTIAL

### F-FUEL-207 — Fuel Profile — age and sex
- location: Fuel Profile screen > AGE / SEX row
- user action: Types an age; taps Male or Female.
- behaviour: 1. Side-by-side flex row, gap 16 (36175–36180). 2. AGE numeric input, `step: "1"`, placeholder "25" (36191–36211). 3. SEX two buttons from `["male","female"]`, labels "Male"/"Female", active bordered 1.5px `OR` (36225–36253). 4. Both feed the Mifflin/Harris-Benedict branch in `calcTDEE` (35733–35737).
- v6 status: WORKING

### F-FUEL-208 — Fuel Profile — activity level picker
- location: Fuel Profile screen > ACTIVITY LEVEL
- user action: Taps one of five radio rows (or activates via keyboard).
- behaviour: 1. Options defined at 35888–35907: `sedentary` "Sedentary / Desk job, little exercise"; `light` "Light / Exercise 1-3 days/week"; `moderate` "Moderate / Exercise 3-5 days/week"; `active` "Active / Hard exercise 6-7 days"; `very` "Very Active / Hard exercise + physical job". 2. Each row is a `div role="button" tabIndex=0 onKeyDown={lkKeyActivate}` with a custom radio dot (36266–36335). 3. Selected row tints background `OR_H+"15"` and borders `OR` (36277–36282). 4. Feeds the multiplier table in `calcTDEE`: 1.2 / 1.375 / 1.55 / 1.725 / 1.9 (35739–35746).
- v6 status: WORKING

### F-FUEL-209 — Fuel Profile — goal picker (Cut / Maintain / Bulk)
- location: Fuel Profile screen > GOAL
- user action: Taps one of three equal-width cards.
- behaviour: 1. Options at 35908–35916: `cut` "Cut / Lose body fat"; `maintain` "Maintain / Keep current weight"; `bulk` "Bulk / Build mass". 2. Cards are `div role="button" tabIndex=0 onKeyDown={lkKeyActivate}`, `flex: 1`, 1.0625rem/800 label (36336–36376 region). 3. Goal multiplies TDEE: cut ×0.8, bulk ×1.1, maintain ×1.0 (35747–35749). 4. Goal also sets protein per kg in `calcMacros`: cut 2.4, bulk 2.0, else 2.2 g/kg (35754). 5. Goal `"cut"` is the precondition for the refeed trigger (2937).
- v6 status: WORKING

### F-FUEL-210 — Fuel Profile — Auto vs Custom macros
- location: Fuel Profile screen > MACROS section
- user action: Taps "Auto" or "Custom"; in Custom, types Calories / Protein / Carbs / Fat.
- behaviour: 1. Segmented toggle built from `[{id:false,label:"Auto"},{id:true,label:"Custom"}]` (36336–36358 region; the option array at 36337–36343). 2. Auto mode shows the copy "Targets calculated automatically from your stats and goal." (36433–36438). 3. Custom mode renders four labelled numeric rows: Calories (kcal, "e.g. 2400"), Protein (g, "e.g. 180"), Carbs (g, "e.g. 250"), Fat (g, "e.g. 70") (36359–36432). 4. On save, `tdee = calcTDEE(prof)` and `macros = calcMacros(tdee, kg, goal)` are always computed first (35852–35853). 5. If `useCustomMacros && customCal`, the four custom values override with per-field `parseInt(...) || <auto value>` fallbacks (35859–35864); otherwise auto values are used (35865–35870).
- v6 status: WORKING

### F-FUEL-211 — Fuel Profile — dietary preferences chips
- location: Fuel Profile screen > DIETARY PREFERENCES
- user action: Taps any of six pill chips to toggle.
- behaviour: 1. Options at 35917–35934 (`prefOpts`): `high-protein` "High Protein", `vegetarian` "Vegetarian", `vegan` "Vegan", `no-dairy` "No Dairy", `gluten-free` "Gluten Free", `low-carb` "Low Carb". 2. Chips wrap (`flexWrap: "wrap"`, gap 8), radius 20 (36444–36476 region). 3. `togglePref(id)` does a manual linear scan for membership then filters or concats (35817–35828).
- v6 status: WORKING

### F-FUEL-212 — Fuel Profile — allergies and fridge/pantry
- location: Fuel Profile screen > ALLERGIES / INTOLERANCES and FRIDGE / PANTRY STAPLES
- user action: Types free text in an input and a 3-row textarea.
- behaviour: 1. Allergies text input, placeholder "e.g. nuts, shellfish, gluten..." (36477–36499). 2. Fridge section carries helper copy "What do you usually have on hand? Used for meal suggestions." (36500–36510). 3. Fridge `textarea`, `rows: 3`, `resize: "none"`, placeholder "e.g. chicken breast, rice, eggs, broccoli, olive oil..." (36511–36524).
- v6 status: PARTIAL

### F-FUEL-213 — Water tracking card
- location: Fuel tab > main view > water card under the macro summary
- user action: Taps the ml/fl oz chip; taps +250/+500 (or +8/+16); taps "−" to remove one glass.
- behaviour: 1. `WaterCard` gets `waterMl`, `addWater`, `setDay` from FuelTab (37321–37325). 2. Goal is **hardcoded** `var goal = 3000;` (36541). 3. `display` and `goalDisplay` convert by `/29.574` when `useOz` (36542–36543); unit label "fl oz" or "ml" (36544). 4. `addAmts` is `[8,16]` in oz mode, `[250,500]` in ml mode (36545). 5. `add(amt)` converts oz→ml with `Math.round(amt*29.574)` then calls `p.addWater(ml)` (36546–36549). 6. `minus()` calls `p.setDay` directly, subtracting 250 ml (or 8 oz ≈ 237 ml) clamped at 0 (36550–36557). 7. Progress bar `pct = Math.min(waterMl/goal, 1)`, 5px, colour `BLU` (36558; bar at 36620–36636). 8. The "−" button (aria-label "Remove one glass") renders only when `waterMl > 0` (36654–36669).
- v6 status: PARTIAL

### F-FUEL-214 — Smart Nutrition suggestion card
- location: Fuel tab > Log > List sub-tab only > card rendered after ListTab
- user action: Taps "Suggest" (then "New"), taps "Add to today's log", or taps "×" to dismiss.
- behaviour: 1. Rendered only when `tab === "list"` (37460–37468 region; the `tab === "list" && React.createElement(SmartNutritionCard, ...)` call). 2. `dismissed` short-circuits to `null` before any hooks-dependent render — but *after* the four `useState` calls (36672–36676). 3. `calLeft = p.targets.cal - p.totalCal`; `proLeft = p.targets.pro - p.totalPro` (36677–36678). 4. Header shows a location-pin icon path, "SMART NUTRITION", and either "N cal remaining today" or "Target reached — great work" (36753–36790). 5. "Suggest"/"New" button calls `suggest()` (36791–36808); disabled and shown as "..." while loading. 6. `suggest()` POSTs to the Cloudflare Worker (see AI calls #1, 36679–36730). 7. On success the suggestion card shows name, four macro tiles (cal/protein/carbs/fat in `EMD`/`OR`/`BLU`/`WA`), the `reason` sentence, and an "Add to today's log" button (36827–36893). 8. `addMeal()` calls `p.addItem("snacks", {...})` with rounded macros and flips `added` to true, changing the button to "✓ Added to log" (36731–36741).
- v6 status: PARTIAL

### F-FUEL-215 — Fuel log data model + per-day totals
- location: Fuel tab > (data layer behind every sub-tab)
- user action: Any food add/remove from any sub-tab.
- behaviour: 1. `fuelLog` is loaded once from localStorage `ld("fuelLog", {})` (36909–36911). 2. `setFuelLog(fn)` accepts value or updater, writes `sd("fuelLog", n)` synchronously inside the state updater, and returns the new state (36917–36924). 3. `todayISO = isoDay()` keys the day (36907). 4. `setDay(fn)` reads/creates today's entry and copies the outer map immutably (36943–36958). 5. `addItem(meal, item)` appends to `meals[meal]` (37033–37041); `removeItem(meal, idx)` filters by index (37042–37052). 6. A `lockedFuelUpdate` window event listener re-reads `fuelLog` from storage — the hook for the voice-logging path (37004–37013).
- v6 status: WORKING

### F-FUEL-216 — Adaptive TDEE application on tab mount
- location: Fuel tab > main view (invisible; effect on mount)
- user action: none — runs when the Fuel tab mounts.
- behaviour: 1. `useEffect(..., [])` calls `applyAdaptiveTDEE()` inside a try/catch that swallows all errors (36979–36983). 2. `applyAdaptiveTDEE` (19259–19299, out of range) bails if there is no profile, if `useCustomMacros` is set, or if the last `tdeeHistory` entry is ≤6 days old (19260–19267). 3. Otherwise it reconciles observed TDEE, blends `0.7*current + 0.3*observed`, clamps the step to ±150 kcal, applies a calorie floor, recomputes macros and writes `fuelProfile` (19272–19296). 4. FuelTab then reads `fuelProfile.adaptiveTDEE || fuelProfile.tdee || 2200` for its calorie target (36984–36990).
- v6 status: PARTIAL

### F-FUEL-217 — Refeed day prompt and active banner
- location: Fuel tab > main view > below the TDEE report card
- user action: Taps Accept or Dismiss on the refeed card; or logs a weight that triggers it.
- behaviour: 1. `refeedActive` initialises to `ld("refeedAccepted", null) === isoDay()` (36918–36920 region; 36916–36920). 2. `refeedTriggered = checkRefeedTrigger(weightLog, fuelProfile)` (36991). 3. `refeedCarbs = fuelProfile ? calcRefeedCarbs(fuelProfile) : 75` (36992). 4. When `refeedActive`, targets are boosted: `carb + refeedCarbs`, `cal + refeedCarbs * 4` (36993–36999). 5. A mount effect sets `showRefeed` when `refeedTriggered && !refeedActive` (37000–37003). 6. `RefeedCard` (53210, out of range) renders when `showRefeed && !refeedActive` (37333–37342). 7. `acceptRefeed()` writes `refeedAccepted = todayISO`, sets `refeedActive`, hides the card and logs beta activity `"refeed_accepted"` with `{extraCarbs}` (37014–37021). 8. `dismissRefeed()` writes `refeedDismissed = new Date().toISOString()` and logs `"refeed_dismissed"` (37022–37025). 9. When active, an inline banner shows a bolt icon and "Refeed day active — carbs boosted by +Ng today" (37343–37370). 10. Trigger logic (2936–2965): requires `goal === "cut"`, ≥3 weight entries, no dismissal in the last 5 days, not already accepted today, and three consecutive new lows.
- v6 status: WORKING

### F-FUEL-218 — Weight log card + TDEE report card (hosted here)
- location: Fuel tab > main view > under the water card
- user action: Logs today's bodyweight in `WeightLogCard`.
- behaviour: 1. `WeightLogCard` is rendered with `weightLog`, `useKg` (from `p.useKg`) and `onLog: handleWeightLog` (37326–37330). 2. `handleWeightLog(kg)` calls `addWeightEntry(kg)` (2911–2935), stores the returned log in state, and re-checks the refeed trigger (37006–37013). 3. `TdeeReportCard` is rendered with no props (37331–37332).
- v6 status: WORKING

### F-FUEL-219 — Shopping & Budget entry point
- location: Fuel tab > header "Shop" button > full-screen Shopping/Budget screen
- user action: Taps "Shop".
- behaviour: 1. `onClick: setView("shop")` (37105–37107). 2. `FuelTab` returns `ShoppingBudgetTab` directly, passing `useKg`, `profile`, `go`, and `onBack: () => setView("main")` (37067–37077 region; the branch at 37067).
- v6 status: WORKING

### F-FUEL-220 — Meal plan — today's plan card
- location: Fuel tab > Meals > Meal Plans sub-tab > "TODAY'S PLAN" card
- user action: Taps "Log" next to any meal in today's plan.
- behaviour: 1. `activePlan = plans[0]` (37570). 2. Today's day is matched by name against `dayNames[new Date().getDay()]` (37571–37575). 3. If no name match, it falls back to `activePlan.days[dayIdx % activePlan.days.length]` (37576–37579). 4. The card shows "TODAY'S PLAN", the day name, the plan name, then each meal with its slot name (uppercase, `OR`), title, and cal/P/C/F chips (37752–37870 region). 5. Each meal has a "Log" button calling `logMeal(meal)` (37862–37880 region). 6. `logMeal` maps the plan's meal name to a log slot: contains "breakfast"→breakfast, "lunch"→lunch, "dinner"/"supper"→dinner, else snacks; then calls `p.addItem(slot, {name: meal.title, cal, pro, carb, fat, fromPlan: true})` (37700–37712). 7. Below each meal, ingredients render as a comma-joined `amount + " " + item` list (37881–37895).
- v6 status: WORKING

### F-FUEL-221 — Meal plan — full-week accordion
- location: Fuel tab > Meals > Meal Plans > "FULL WEEK" card
- user action: Taps a day row to expand/collapse; taps "+ Shopping List (N)".
- behaviour: 1. Header row "FULL WEEK" plus a button reading `"+ Shopping List (" + (activePlan.shoppingList||[]).length + ")"` (37896–37930 region). 2. Each day is a full-width button with a numbered colour swatch (`dayColors = [OR, BLU, GR, OR, RE, "#06B6D4", WA]`, 37744), the day name (or "Day N"), the summed calories for the day, and a ▲/▼ chevron (37931–38010 region). 3. Today's row is highlighted: swatch filled `OR`, label `OR` and bold (37956–37980 region). 4. `expandedDay` holds the index of the open day; tapping the open day collapses it (37938–37940). 5. Expanded content is indented 32px and lists each meal with its name (coloured via `readableAccent(col)`), a "⇄ Swap" button, the title, the ingredient list, and a right-aligned cal + P/C/F column (38011–38094).
- v6 status: WORKING

### F-FUEL-222 — Meal plan — AI meal swap (alternatives sheet)
- location: Fuel tab > Meals > Meal Plans > expanded day > "⇄ Swap" button > bottom sheet
- user action: Taps "⇄ Swap"; waits; taps one of up to four alternatives, or closes via × / Escape.
- behaviour: 1. Swap button sets `swapModal = {dayIdx, mealIdx}` and immediately calls `generateAlternatives(di, mi)` (38035–38055 region). 2. `generateAlternatives` reads the current meal from `plans[0].days[dayIdx].meals[mealIdx]`, lowercases its name as `mealType`, sets `altLoading`, and POSTs to the Worker (37497–37560) — see AI calls #2. 3. On parse success it stores `alts.slice(0, 4)` (37517–37519). 4. On parse failure it substitutes **four hardcoded meals** ("Grilled chicken with sweet potato", "Salmon with broccoli and rice", "Turkey meatballs with pasta", "Tofu stir-fry with vegetables") each reusing `currentMeal.totalCal` (37520–37546). 5. On network failure it substitutes **one** hardcoded meal, "Grilled chicken with vegetables" (37549–37558). 6. The sheet is `lkPortal`-ed to body, `position: fixed`, `zIndex: 1000`, `borderRadius: "20px 20px 0 0"`, `maxWidth: 420`, `maxHeight: "80dvh"`, with a safe-area bottom pad (38402–38440 region). 7. Escape closes it via `useEscape(swapModal ? closeFn : null)` (37486). 8. Loading state shows "Finding alternatives..." plus a pulsing "..." (38487–38505 region). 9. Each alternative is a tappable card showing title and P/C/F/cal (38506–38543 region). 10. `selectAlternative(alt)` deep-clones plans via `JSON.parse(JSON.stringify(plans))`, overwrites title and the four macro totals on the target meal, saves, and closes (37561–37569). 11. Empty-state copy: "Couldn't generate alternatives. Try again or pick another meal." (38544–38546).
- v6 status: PARTIAL

### F-FUEL-223 — Meal plan — add shopping list
- location: Fuel tab > Meals > Meal Plans > FULL WEEK header > "+ Shopping List (N)"
- user action: Taps the button.
- behaviour: 1. Empty `plan.shoppingList` triggers `window.LOCKED.toast("This plan has no shopping list", "error")` and returns (37714–37719). 2. Loads the current list via `getShoppingList()` (37720; 41945). 3. For each plan item, a dedupe check matches an existing entry whose lowercased name contains the **first 6 characters** of the new name (37725–37727). 4. New entries are built with `parseIngredient(amount + " " + name)` (41905), an id `"sh_" + (ts+idx) + "_" + random`, `category: item.category || categorizeItem(name)`, `dateAdded`, `checked: false`, `fromMealPlan: true` (37728–37742 region). 5. `saveShoppingList(list)` persists (37743; 41948). 6. Toast reports "N items added to shopping list" and, when some were skipped, "(M already on list)" (37744–37746 region).
- v6 status: PARTIAL

### F-FUEL-224 — Meal plan — generate new plan form
- location: Fuel tab > Meals > Meal Plans > "MANAGE PLANS" / "GET STARTED" card
- user action: Taps "+ New Plan"; picks days and meals/day; optionally types diet and budget prefs; taps "Generate Meal Plan".
- behaviour: 1. Card header reads "MANAGE PLANS" when a plan exists, "GET STARTED" otherwise (38095–38125 region). 2. Toggle button reads "+ New Plan" / "Cancel" and flips `showForm` (38126–38141). 3. DAYS select: 3 / 5 / 7 days, default "3"… actually default state is `"7"` (37473) while the first option is 3 days (38178–38186). 4. MEALS/DAY select: 2 / 3 / 4 / 5 meals, default `"3"` (37474; options 38199–38213). 5. Two free-text inputs: "Diet preferences (high protein, keto, halal, no dairy...)" and "Budget (cheap, moderate, no limit)" (38214–38258). 6. "Generate Meal Plan" button, disabled and greyed while `generating`, label swaps to "Generating..." (38259–38281). 7. While generating a pulsing "..." shows (38282–38296). 8. `genError` renders in red below (38297–38310). 9. Footer copy lists the user's enabled stores or prompts "Add stores for store-specific ingredients" (38311–38323). 10. Empty state when no form and no plan: "No meal plan yet. Tap "+ New Plan" to generate one tailored to your macros and stores." (38324–38334). 11. `generatePlan()` builds context and POSTs to the Worker — see AI calls #3 (37605–37699).
- v6 status: WORKING

### F-FUEL-225 — Meal plan — JSON repair and shopping list rebuild
- location: Fuel tab > Meals > Meal Plans (invisible; inside `generatePlan`'s response handler)
- user action: none directly.
- behaviour: 1. First non-greedy `{...}` match extracted from the response text (37645). 2. Bracket repair: counts `[` vs `]` and appends `]` until balanced (37652–37657). 3. Brace repair: counts `{` vs `}` and appends `}` until balanced (37658–37663). 4. `JSON.parse(raw)` (37664). 5. Every ingredient across every meal is collected into an `allIng` map keyed by `name.toLowerCase().replace(/\s+/g,"")`, keeping the first occurrence's amount and computing `categorizeItem(n)` (37665–37680). 6. If any were collected, `plan.shoppingList` is **overwritten** with the rebuilt list, discarding the AI's own store-specific product names (37681–37685). 7. Metadata attached: `id = "mp_" + Date.now()`, `created` ISO timestamp, `daysCount`, `mealsPerDay` (37686–37689). 8. Empty `plan.days` → error "Plan was empty. Try again." (37690–37693). 9. The new plan is unshifted to the front of `plans` (making it active) and the form closes (37694–37698 region).
- v6 status: PARTIAL

### F-FUEL-226 — Meal plan — saved plans list (activate / star / delete)
- location: Fuel tab > Meals > Meal Plans > "SAVED PLANS" card
- user action: Taps a plan name or "Use" to activate; taps the star; taps "×" to delete.
- behaviour: 1. The card renders only when `plans.length > 1` (38335–38346). 2. Each row shows the plan name (or "Meal Plan") and a subtitle `"<N>d, <M> meals | <locale date>"` (38366–38394 region). 3. `pi === 0` is the active plan — shown in `OR`, bold, with an "ACTIVE" chip (38431–38445 region). 4. Tapping a non-active row (a `div role="button" tabIndex=0 onKeyDown={lkKeyActivate}`) or its "Use" button reorders `[plan, ...rest]` (38350–38365 and 38413–38430). 5. Star button toggles `plan.starred` via `toggleStar` (37731–37743) and, when more than one plan exists, sorts everything except the active plan so starred plans rise (37734–37741). 6. Delete button (aria-label `"Delete <name>"`) calls `confirm("Delete <name>?")` then `deletePlan(id)` (38446–38480 region; `deletePlan` at 37725–37730).
- v6 status: PARTIAL

### F-FUEL-400 — Meal-slot selector (List tab)
- location: Fuel hub > List tab > top card, "MEAL" row
- user action: taps one of Breakfast / Lunch / Dinner / Snack
- behaviour: 1. `setMeal(m)` stores the chosen slot (38658-38678). 2. Active pill gets orange border/background/text; others muted (38663-38676). 3. The value is only consumed at log time by `log()` → `p.addItem(meal, item)` (38644-38646).
- v6 status: WORKING

### F-FUEL-401 — Natural-language meal estimate ("ESTIMATE MACROS", List tab)
- location: Fuel hub > List tab > "WHAT DID YOU EAT?" textarea + ESTIMATE MACROS button
- user action: types a free-text meal ("2 eggs, 3 oz chicken, 1 cup rice") and taps ESTIMATE MACROS
- behaviour: 1. Guard: no-op if text is blank or a request is already in flight (38560). 2. `setEstimating(true)`, clears any previous preview (38561-38562). 3. POST `https://lockedapi.cescocugliari.workers.dev/analyze-meal`, headers from `authHeaders()`, body `{"description": text.trim()}` (38563-38569). 4. Response parsed as JSON; text taken from `d.content[0].text` (38572). 5. Text is sliced between the first `[` and last `]` and `JSON.parse`d into an item array (38574-38576). 6. Empty/non-array throws → fallback (38576). 7. Totals reduced across items summing `cal/pro/carb/fat` with `|| 0` defaults (38577-38590). 8. `setPreview({items, totals})` renders the ESTIMATED card (38591-38594). 9. Parse-failure fallback: local `estimateMacros(text)` (defined `:35657`); if that yields 0 items, a hardcoded 400 kcal guess is used, adjusted to 250 for "small", 700 for "large", 450 for "medium", with macros split 25% P / 45% C / 30% F by calories (38595-38617). 10. Network-failure fallback (`.catch`): same `estimateMacros`, but the last-ditch guess is a fixed 400 kcal / 25P / 45C / 12F with **no** size-word adjustment (38620-38638).
- v6 status: PARTIAL

### F-FUEL-402 — Estimate preview card + "LOG THIS MEAL"
- location: Fuel hub > List tab > orange ESTIMATED card (shown only when `preview` set)
- user action: reviews per-item names + kcal and the Cal/Pro/Carb/Fat totals, taps LOG THIS MEAL
- behaviour: 1. Card lists every item name with its kcal, separated by hairlines (38695-38712). 2. Totals row shows Cal / Pro g / Carb g / Fat g (38713-38759). 3. On tap, `log()` iterates `preview.items` and calls `p.addItem(meal, item)` once per item (38641-38647). 4. Clears the textarea and the preview (38648-38649).
- v6 status: WORKING

### F-FUEL-403 — Today's Diary (show/hide, per-meal grouping)
- location: Fuel hub > List tab > "TODAY'S DIARY" card (rendered only when at least one item exists)
- user action: taps Show / Hide
- behaviour: 1. `allItems` is flattened from `p.day.meals` across `["breakfast","lunch","dinner","snacks"]`, each entry carrying `{meal, item, idx}` (38652-38657). 2. Card renders only when `allItems.length > 0` (38760). 3. Show/Hide toggles `showDiary` (38790-38793). 4. When shown, items are re-bucketed by meal; empty meals render `null` (38810-38828). 5. Each meal header shows a colour bar (breakfast `#FF6B35` hardcoded, lunch `BLU`, dinner `GR`, snacks `WA`), the label, and the meal's total kcal (38820-38826, 38845-38884). 6. Each row shows name and `P / C / F / kcal` chips (38900-38962). 7. Footer per meal shows summed Protein / Carbs / Fat in grams (38996-39080).
- v6 status: WORKING

### F-FUEL-404 — Delete a logged food (diary row ✕)
- location: Fuel hub > List tab > Today's Diary > per-row ✕ button
- user action: taps the small ✕ at the right of a diary row
- behaviour: 1. `p.removeItem(entry.meal, entry.idx)` (38966-38968). 2. Parent filters that index out of `day.meals[meal]` and persists (`:37054-37063`).
- v6 status: WORKING (with the caveat above)

### F-FUEL-405 — Manual macro entry (collapsed prompt)
- location: Fuel hub > Search tab > bottom dashed card "Add custom macros"
- user action: taps "+ Enter macros manually"
- behaviour: 1. Collapsed state renders a dashed card: title "Add custom macros", subtitle "Can't find it? Enter macros manually." (39112-39131). 2. Tap sets `show = true` (39132-39134), expanding to the form (F-FUEL-406).
- v6 status: WORKING

### F-FUEL-406 — Custom macro form (name + 4 numeric fields)
- location: Fuel hub > Search tab > expanded "Custom Entry" card
- user action: types a food name, calories, protein, carbs, fat; taps ADD (or Cancel / ✕)
- behaviour: 1. Name input is free text; focusing it scrolls it to viewport centre after 100 ms (39185-39192). 2. Four numeric inputs rendered from a config array — Calories, Protein (g), Carbs (g), Fat (g); `type=number`, `step=0.01`, `inputMode=decimal`, centred (39215-39260). 3. ADD is disabled unless name is non-blank **and** `mCal` is truthy (39268-39280). 4. `add()` calls `p.onAdd(p.meal, {...})` — i.e. the parent `addItem` with the meal currently selected in SearchTab (39095-39102). 5. All five fields cleared and the card collapses (39103-39109).
- v6 status: PARTIAL

### F-FUEL-407 — Food text search (multi-source fan-out)
- location: Fuel hub > Search tab > search input + "Go" (or Enter key)
- user action: types ≥2 characters and taps Go / presses Enter
- behaviour: 1. Guard: query shorter than 2 chars is ignored (39494). 2. **Barcode shortcut** — a bare 8–14 digit query is handed to `p.onScan(code)`, which sets `pendingGtin` and switches the hub to the scan tab (39496; parent `:37442-37445`). 3. Any in-flight search is aborted via `AbortController` (39497-39500). 4. `loading = true`; results, selection cleared (39501-39503). 5. **My Store** matches (substring, case-insensitive) mapped to `{product_name, brands:"MY STORE", nutriments, _store:true}` (39505-39517). 6. **Local FOODS** table (`:34768`) matched the same way → `brands:"Database", _local:true` (39518-39530). 7. If either local pool has hits, results render immediately and `loading` is cleared — instant local-first paint (39546-39549). 8. Three remote sources fan out in parallel with `pending = 3` (39550-39552): - `searchUSDA` (39440-39479): GET `https://api.nal.usda.gov/fdc/v1/foods/search?query=…&api_key=<usdaKey>&dataType=Foundation,SR%20Legacy&pageSize=12&sortBy=score&sortOrder=desc`. Maps nutrient ids 1008→kcal, 1003→protein, 1005→carbs, 1004→fat; drops any food with no kcal; title-cases the description; tags `_usda:true`. - `searchFatSecret` (39480-39493): GET `WORKER_API + "/food-search?src=fatsecret&q=…"` (`WORKER_API` = `https://lockedapi.cescocugliari.workers.dev`, `:7060`). Maps `{name, brand, cal, pro, carb, fat, type}`; `type === "Generic"` sets `_generic`; tags `_fatsecret:true`. **Note: no auth headers on this call.** - Open Food Facts (39568-39586): GET `https://world.openfoodfacts.org/cgi/search.pl?search_terms=…&search_simple=1&action=process&json=1&page_size=10`; keeps only products with `nutriments["energy-kcal_100g"]`; tags `_off:true`. 9. Each completion decrements `pending`, re-merges **all five** pools, dedupes by lowercased `product_name`, ranks, and slices to 30 (39553-39562, 39531-39545). 10. `loading` clears when `pending <= 0` (39561).
- v6 status: WORKING

### F-FUEL-408 — Result ranking + "★ BEST" badge
- location: Fuel hub > Search tab > results list
- user action: none (automatic)
- behaviour: 1. `isSpecificQuery` returns true if the query matches a large hardcoded brand/chain regex (≈120 brands: Burger King … Prime Hydration) **or contains any digit** (39298-39303). 2. Specific queries reward exact name match (+800), substring (+500), all-words (+300), brand-word hits (+150 each), FatSecret (+100) (39311-39319). 3. Generic queries reward generic-ness (+600), local (+200), FatSecret-generic (+500), USDA (+400), exact (+300) / prefix (+200) / substring (+80), and **penalise branded non-USDA rows (−150)** (39320-39331). 4. My Store rows always get +2000 so they float to the top (39310). 5. Any row missing `energy-kcal_100g` is penalised −800 (39332-39334). 6. After sorting, the first non-store row is tagged `_best = true` and gets a "★ BEST" pill plus a tinted card (39337-39348; render 40197-40209, 40165-40175).
- v6 status: WORKING (logic executes) with a design defect

### F-FUEL-409 — Food detail card: grams + serving-size quick chips
- location: Fuel hub > Search tab > selected-food card
- user action: taps a result row, then edits Grams or taps a preset chip
- behaviour: 1. Row tap sets `selected` and resets `grams` to `"100"` (40168-40171); rows are keyboard-activatable via `role=button` + `lkKeyActivate` (`:5227`) at 40161-40163. 2. Grams input: `type=number`, `step=0.01`, `inputMode=decimal`, scroll-into-view on focus (40031-40062). 3. Seven preset chips: 100 g, 150 g, 200 g, ½ cup = **60 g**, 1 cup = **120 g**, 1 oz = **28 g**, 1 tbsp = **15 g** (40064-40066). Active chip highlighted by `parseInt(grams) === value` (40072-40075). 4. Macros recomputed live as `per-100g × grams/100`, rounded (40088-40103). 5. "Log to <Meal>" builds the item and calls `p.addItem(meal, item)`; clears selection, grams, query, results (39564-39580 → `logSelected` 39564-39580). 6. "Back" clears `selected` only (40136-40141).
- v6 status: PARTIAL

### F-FUEL-410 — My Store (saved foods)
- location: Fuel hub > Search tab > "My Store" chip (header) and the `view === "mystore"` screen
- user action: taps "Save" on a selected food; taps My Store to browse; taps Log or ✕ on a stored row
- behaviour: 1. `saveToMyStore(item)` scales the food by the **current grams value** and stores `{name, cal, pro, carb, fat, savedAt: ISO}` (39546-39563 → 39547-39563). 2. Dedupe: the new entry is unshifted and any existing entry with the same lowercased name is filtered out (39556-39559). 3. `setStoreItems` writes state **and** `sd("myGroceries", v)` (39375-39378). 4. "Saved" confirmation shows for 1500 ms then reverts (39560-39562). 5. My Store screen: back button, title, item count badge with singular/plural (39581-39623). 6. Empty state: "No items saved yet" + instructions (39624-39637). 7. Each row shows name and `fmtCal(cal) kcal · fmtQ(pro)g pro` (`:4355`, `:4349`) at 39655-39668. 8. "Log" re-hydrates the row into a synthetic `selected` object (`brands:"MY STORE"`, `_store:true`) and returns to the search view (39670-39694) — it does **not** log directly, it opens the detail card. 9. ✕ removes by index (39696-39700). No confirmation. 10. When the search box is empty, up to 6 store items render as quick chips (40297-40354), and a "View all →" link opens the full screen (40313-40326).
- v6 status: PARTIAL

### F-FUEL-411 — USDA API key setup
- location: Fuel hub > Search tab > empty-results state link → key screen
- user action: taps "Add your free USDA key for higher rate limits", pastes a key, taps SAVE
- behaviour: 1. `showKeySetup = true` swaps the whole tab for the key screen (40286-40295, 39702). 2. Copy explains it works keyless and that blank means "the free shared key (1,000 req/hour)" (39710-39730). 3. `saveUsdaKey()` trims the input, falls back to the literal `"DEMO_KEY"`, writes `sd("usdaKey", k)`, updates state, closes (39379-39384). 4. Subsequent searches use the stored key in the URL query string (39441-39442).
- v6 status: PARTIAL

### F-FUEL-412 — Barcode hand-off from the search box
- location: Fuel hub > Search tab > search input, and the barcode icon button beside it
- user action: types a bare 8–14 digit number and taps Go; or taps the barcode icon
- behaviour: 1. Typed digits: `search()` regex-tests `/^\d{8,14}$/` and calls `p.onScan(q.trim())`, returning before any network call (39496). 2. Icon: calls `p.onScan()` with no argument (39882-39884). 3. Parent sets `pendingGtin` (string or `""`) and switches to the `scan` tab (`:37442-37445`), which mounts `BarcodeTab` with `gtin` (`:37446-37449`). 4. The icon renders only when `p.onScan` is supplied (39881).
- v6 status: WORKING

### F-FUEL-413 — Photo capture / library pick
- location: Fuel hub > Photo tab > dashed "Add meal photo" card
- user action: taps Camera or Library, picks an image
- behaviour: 1. Two hidden `<input type=file accept="image/*">` — the camera one adds `capture="environment"` (40676-40694). 2. Visible buttons `.click()` the corresponding hidden ref (40615-40617, 40645-40647). 3. `handleFile` grabs `files[0]`, and reads it with `FileReader.readAsDataURL` (40367-40376). 4. `setImgData(dataURL)`, clears any previous result (40372-40374). 5. Preview renders the raw data URL at `maxHeight:220, objectFit:cover` (40529-40540). 6. A round ✕ overlay discards the photo and the result (40541-40566).
- v6 status: PARTIAL

### F-FUEL-414 — AI photo/description meal analysis
- location: Fuel hub > Photo tab > "ANALYZE PHOTO" / "ESTIMATE MACROS" button
- user action: taps the primary button after adding a photo and/or a description
- behaviour: 1. Guard: no-op unless there is a photo **or** a non-blank note, and not already analyzing (40378). 2. `analyzing = true`, previous result cleared (40379-40380). 3. Body assembled conditionally: `description` only if the note is non-blank; `base64` only if a photo exists (40381-40384). **Both may be sent together; either alone is valid.** 4. `base64` is the raw `FileReader` data URL — i.e. it still carries the `data:image/jpeg;base64,` prefix (40372 → 40384). UNVERIFIED whether the worker strips that prefix; confirming requires the worker source, which is not in this repo. 5. POST `https://lockedapi.cescocugliari.workers.dev/analyze-meal` with `authHeaders()` (40385-40389). 6. Response text taken from `d.content[0].text`, sliced between first `[` / last `]`, `JSON.parse`d (40393-40397). 7. Non-array or empty array throws (40397). 8. Totals reduced over `cal/pro/carb/fat` (40398-40411). 9. `setResult({items, totals})` (40412-40415). 10. Parse-failure fallback: a single fabricated item using keyword heuristics on the **note only** — 400 default, 250 "small", 650 "large", 750 "restaurant"/"takeout", 300 "salad", 700 "burger"/"pizza"; macros split 25% P / 40% C / 35% F (40416-40434). 11. Network-failure `.catch`: clears `analyzing` and shows a toast "Couldn't analyse that photo. Check your connection and try again." via `window.LOCKED.toast` (40437-40440). **No result is produced on this path** — unlike ListTab.
- v6 status: PARTIAL

### F-FUEL-415 — Photo result card: Log Meal / Re-estimate
- location: Fuel hub > Photo tab > "ESTIMATED MACROS" card
- user action: taps Log Meal or Re-estimate
- behaviour: 1. Card shows only the four totals — Cal / Pro / Carb / Fat (40734-40780). **Individual items are never shown here**, unlike ListTab. 2. Log Meal → `log()` iterates `result.items` calling `p.addItem(meal, item)` per item, then clears photo, note and result (40442-40451). 3. Re-estimate clears `result` only, which re-reveals the analyze button (40745-40758).
- v6 status: WORKING (label is misleading)

### F-FUEL-416 — Recipes: For You / From Pantry tab switch
- location: Fuel hub > Recipes tab > two-pill segmented control
- user action: taps "For You" or "🗄️ From Pantry"
- behaviour: `setRecipeTab(t[0])`; active pill gets the accent gradient (41213-41240).
- v6 status: WORKING

### F-FUEL-417 — Static "Classic Recipes" library
- location: Fuel hub > Recipes tab > For You > "CLASSIC RECIPES"
- user action: browses; taps Add to diary / Add to shop on a card
- behaviour: 1. Six hardcoded recipes, `r1`–`r6`: Chicken & Rice Bowl (520), Egg & Oat Breakfast (410), Salmon & Sweet Potato (580), Greek Yogurt Parfait (310), Tuna Wrap (440), Ground Beef Stir Fry (640) — each with tag, time, ingredients array, steps array (40851-40919). 2. Filtering (41193-41199): if the user is vegetarian/vegan, `r1/r3/r5/r6` are dropped; if goal is `"cut"`, anything over 550 kcal is dropped. 3. Safety valve: if the filters remove everything, the **unfiltered** list is shown (41199) — so a vegan cutting user is shown the beef stir fry. 4. Rendered through `RCard` with `ai:false`, so the tag pill shows the recipe's own tag in blue (41531-41535).
- v6 status: PARTIAL

### F-FUEL-418 — RCard: Add to diary
- location: Fuel hub > Recipes tab > any recipe card > left footer button
- user action: taps "Add to diary"
- behaviour: 1. Guarded by `isDone = added[key]` where `key = r.id || r.name` (40923-40925, 41125-41126). 2. `p.addItem("lunch", {name, cal, pro, carb, fat})` — **hardcoded to lunch** (41128-41134). 3. Sets `added[key] = true` (label → "Added to diary", green check) and schedules a 2000 ms `setTimeout` that deletes the key so the same recipe can be logged again later in the day (41135-41149).
- v6 status: PARTIAL

### F-FUEL-419 — RCard: Add to shop (ingredients → shopping list)
- location: Fuel hub > Recipes tab > any recipe card > right footer button
- user action: taps "Add to shop"
- behaviour: 1. Guarded by `shoppingDone` from the `shopDone` map (40926-40934, 41152-41154). 2. For each ingredient string, `parseIngredient` (41905-41944) splits quantity / unit / name, normalising the unit via `UNIT_NORM` (41833-41882) or guessing with `smartUnit` (41883-41904). 3. The current list is re-read from storage **inside the loop** (41158); a matching name+unit entry has its quantity incremented and the list is saved (41159-41165), otherwise `addShoppingItem` appends a new row (41166). 4. Sets the done flag, reverting after 2000 ms (41169-41173).
- v6 status: PARTIAL

### F-FUEL-420 — AI "Meal ideas" (4 meals from profile)
- location: Fuel hub > Recipes tab > For You > "Meal ideas" (filled gradient button)
- user action: taps Meal ideas
- behaviour: 1. Requires a Fuel Profile; otherwise sets error "Set up your Fuel Profile first (tap My Profile above)." and returns (40826-40829). 2. `aiLoading = true`, clears meals and error (40830-40832). 3. System prompt (40833, verbatim): *"You are a sports nutritionist. Return ONLY a JSON array of 4 meal objects with no extra text or markdown. Each object must have: name, description, cal, pro, carb, fat (all numbers), ingredients (array of strings), steps (array of strings)."* 4. User prompt (40834) interpolates: `goal`, `fp.tdee`, `fp.macroProtein`, `fp.macroCarbs`, `fp.macroFat`, `fp.fridge` (or "standard groceries"), `fp.allergies` as "Avoid: …", ". Vegetarian." if `isVeg`, and ". Training day."/". Rest day." from `isTrainingDay`. 5. `isTrainingDay` is true iff `p.history` contains an entry whose `dateISO` equals today (40780-40787). 6. `aiCall(sys, usr, null, onDone, onFail)` → POST `https://lockedapi.cescocugliari.workers.dev/` with `authHeaders()`, body `{system, max_tokens: 700, messages:[{role:"user", content: usr}]}` (`:2663-2676`). 7. Response text stripped of ``` and ```json fences (built via `String.fromCharCode(96,96,96)` to avoid literal backticks), sliced between first `[` / last `]`, parsed into `aiMeals` (40835-40848). 8. Parse failure → "Could not parse meal plan. Try again."; network failure → "Connection issue. Try again." (40843-40850).
- v6 status: PARTIAL

### F-FUEL-421 — AI "Plan my day" (4 meals with slots)
- location: Fuel hub > Recipes tab > For You > "Plan my day" (outlined button)
- user action: taps Plan my day
- behaviour: 1. Same profile guard, but with a shorter message: "Set up your Fuel Profile first." (41381-41385). 2. System prompt (41395, verbatim): *"You are a sports nutritionist. Return ONLY a JSON array of exactly 4 meal objects. Each must have: name, description, meal (one of: breakfast, lunch, dinner, snacks), cal, pro, carb, fat (numbers), ingredients (array of strings), steps (array of strings). No markdown, no extra text."* — the key difference from F-FUEL-420 is the required **`meal`** field. 3. User prompt (41396) interpolates goal, tdee, the three macro targets, allergies, vegetarian flag; it does **not** include `fp.fridge` and does **not** include training/rest day. 4. Same fence-strip / bracket-slice / parse into `aiMeals` (41400-41412). 5. Errors: "Could not parse plan. Try again." / "Connection issue. Try again." (41407-41414).
- v6 status: PARTIAL

### F-FUEL-422 — "Log Full Day" (bulk-log the AI plan)
- location: Fuel hub > Recipes tab > For You > "AI MEAL PLAN" header > green Log Full Day button
- user action: taps Log Full Day
- behaviour: 1. Iterates `aiMeals`; the target slot is `r.meal || mealTypes[i] || "lunch"` — the model's own slot, else positional breakfast/lunch/dinner/snacks, else lunch (41498-41508). 2. One `p.addItem(mt, {...})` per meal (41502-41508). 3. Marks every meal's key in `added` so the individual cards show "Added to diary" (41509-41515).
- v6 status: PARTIAL

### F-FUEL-423 — Pantry-based recipe generation
- location: Fuel hub > Recipes tab > From Pantry
- user action: taps "Generate Recipes From My Pantry"
- behaviour: 1. Reads `getPantry()` (defined `:43415`, outside range) filtered to `!i.empty` (40792-40794). 2. Empty pantry → error "Your pantry is empty. Scan a receipt to add items." and return (40795-40798). 3. Loading true; meals and error cleared (40799-40801). 4. Item list built as `name (qty:N)` for quantities > 1, comma-joined (40802-40804). 5. System prompt (40806, verbatim): *"You are a chef. Create recipes using primarily the provided pantry ingredients. Return ONLY a JSON array of 4 recipe objects. Each: {name, description, cal, pro, carb, fat (numbers), ingredients:[strings], steps:[strings]}. No markdown, no explanation."* 6. User prompt (40807): *"My pantry currently has: <list>. "* + optional *"Daily targets: <tdee> kcal, <macroProtein>g protein. "* + *"Create 4 meals using these ingredients. Prioritise items I already have. JSON array only."* 7. Same `aiCall` → fence strip → bracket slice → parse into `pantryMeals` (40808-40823). 8. Errors: "Could not parse recipes. Try again." / "Connection issue. Try again." 9. Above the button, an "IN YOUR PANTRY" card lists the first 12 item names plus "+N more"; if empty, a 🗄️ empty state points the user to the Budget tab receipt scanner (41241-41300). 10. While loading, three pulsing dots and "Checking what you have..." (41320-41352). 11. Results render as `RCard ai:true` (41353-41359).
- v6 status: PARTIAL

### F-FUEL-424 — Coach recipes (read-only, from a coach)
- location: Fuel hub > Recipes tab > For You > "FROM YOUR COACH" section
- user action: taps View Recipe / Add to Diary / the shopping-cart icon / per-ingredient "+Log"
- behaviour: 1. `coachRecipes` loaded once from `ld("coachRecipes", [])` (40772-40774); written elsewhere at `:50399` (outside range). 2. Section renders only when non-empty (41537); cards are green-accented with a "Coach" pill (41565-41580). 3. **View Recipe** toggles `expandedRecipe` by index (41648-41666). 4. **Add to Diary** maps every ingredient to a diary item: strings get `cal/pro/carb/fat` divided evenly by ingredient count; objects use their own `cal/pro/carb/fat` (41668-41692). Each ingredient is logged **separately** to `"lunch"` (41693-41695). 5. Marks `added[cr.id]`, which is **never cleared** here (41696-41701). 6. **Cart icon** parses each ingredient (string, or `amount + item/name`) through `parseIngredient` and calls `addShoppingItem` — with **no dedupe/merge**, unlike RCard (41722-41734). 7. **Expanded view**: ingredient rows with optional per-ingredient calories and a "+Log" button that logs that single ingredient to `"lunch"` (41757-41812); then numbered INSTRUCTIONS (41813-41830).
- v6 status: PARTIAL

### F-FUEL-425 — Shopping-list & store helper layer (in range, not a Fuel-entry UI)
- location: no UI in my range — these are module-level helpers consumed by `MyStoresTab` (42079, outside range) and the Shop/Budget surface
- user action: n/a
- behaviour: `getShoppingList`/`saveShoppingList` read/write `lk_shoppingList` (41945-41950); `addShoppingItem` appends `{id:"sh_"+Date.now()+"_"+random, itemName, quantity, unit, category, dateAdded, checked:false}` (41951-41967); `removeShoppingItem` filters by id (41968-41973); `toggleShoppingItem` flips `checked` (41974-41981); `categorizeItem` buckets by substring into meat/dairy/produce/pantry/snacks/other (41982-41992); `exportShoppingList` renders a plain-text list grouped by category with ☑/☐ marks (41993-42009); `buildStoreSearchUrl` maps a store URL to one of 13 retailer search patterns, else appends `/search?q=` (42067-42072); `getMyStores`/`saveMyStores` read/write `lk_myStores` (42073-42078).
- v6 status: WORKING
