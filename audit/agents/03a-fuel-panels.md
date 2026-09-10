# Agent 3a — Fuel: nutrition panels, recipes, barcode, TDEE

Audited file: `redesign/input/locked-current-v6.html`
Exclusive range: **18641–22416** (3,776 lines). Read in 6 chunks, plus targeted greps outside the range to resolve callers and shared helpers.
All line cites are `redesign/input/locked-current-v6.html:<line>` unless stated. Short form below: `L18649` = that file, line 18649.

Range composition, measured:
- L18641–19692 — fuel helper/model layer (settings, nutrient tables, barcode lookup, TDEE math, exports, pantry depletion, AI food-text parsing).
- L19693–21838 — the nine UI components in scope.
- L21839–22416 — menstrual-cycle constants and pure helpers (`MC_*`, `mc*`). These physically fall in my range but their UI (`CycleTab`) lives outside it (rendered at L37455). They are indexed in Part B for completeness and otherwise out of scope.

---

## PART A — Features

### F-FUEL-001 "More nutrition" expandable micronutrient panel
- Location: Fuel tab > (intended) day summary card > "MORE NUTRITION" disclosure row
- User action: taps the "MORE NUTRITION" row to expand/collapse a micronutrient table
- Behavior:
  1. `sumDayNutrients(p.day)` walks `breakfast/lunch/dinner/snacks` and sums every key in `NUTRIENTS_P1 + NUTRIENTS_P2` from each item's `nut` object; any item missing a key sets `missing[k] = true` (L18731–18759).
  2. If `itemCount === 0` the component renders `null` (L19696).
  3. Targets come from `nutrientTargets(profile, adaptiveTDEE || tdee || 2200)` (L19698).
  4. Rows = all four P1 nutrients always, plus each P2 nutrient that has a non-null total (L19699–19702).
  5. Collapsed by default; the caret is `▸`/`▾` (L19740).
  6. Each row prints `value + ("*" if partial) + unit`, and `of ≈<goal> <unit>` when a goal exists; `—` when the total is null (L19755–19771).
  7. If any row is null or partial, a footnote "— / * = no data for some logged items" is shown (L19772–19778).
- Components: `DayNutritionPanel` (L19693–19779)
- Functions: `sumDayNutrients` (L18731–18759), `nutrientTargets` (L18761–18818)
- State: local `open` (L19694). Reads `lk_fuelProfile` at render.
- Storage: reads `fuelProfile`. Writes: none.
- Network: none. AI: none.
- Edge cases: no items → renders nothing (L19696); missing micros → `—` and `*`; `sugar` has `goal: null, type: "info"` so no goal text (L18770).
- Gating: always on where mounted — but it is never mounted.
- Status: **DEAD**
- Evidence for status: `DayNutritionPanel` appears exactly once in the whole 58k-line file (its definition at L19693); no `React.createElement(DayNutritionPanel, …)` anywhere. Verified by whole-file occurrence count.
- Notes: `nutrientTargets` mixes evidence-based DRIs with hardcoded fallbacks (`cal || 2200`, L18762). The `type` field (`min`/`max`/`info`) is computed but never used by this panel — no colour or pass/fail treatment is applied.

### F-FUEL-002 Nutrition Trends tab (range toggle + three charts)
- Location: Fuel tab > "trends" sub-tab (mounted at L37450–37454)
- User action: opens the Trends sub-tab; taps the 7 days / 30 days segmented control
- Behavior:
  1. `dailyIntakeSeries(p.fuelLog, range)` builds one row per day going back `range` days, summing `cal/pro/carb/fat`, item count, and `fiber`/`sodium` (null when nothing carries them) (L19342–19375).
  2. Range segmented control `DsSegmented` with options 7 / 30, default 7 (L19782, L19812–19833).
  3. Card 1 "Calories per day vs target": inline SVG bar chart, viewBox width `series.length*14+10`, height 110, bars 9px wide at 14px pitch. Bar height `max(3, cal/maxCal*90)`; empty days render height 0 with colour `SU`. Bars are `#F59E0B`, opacity 1 when over target else 0.85 (L19843–19889). A dashed target line is drawn only when `p.calTarget > 0` (L19858–19869).
  4. Caption: "Dashed line = your target. Logged N of RANGE days." (L19890–19898).
  5. Card 2 "Daily averages (logged days)": 3-column grid of six tiles — Calories, Protein g, Carbs g, Fat g, Fiber g, Sodium mg — each the mean over days with `items > 0`, nulls excluded, rounded (L19787–19800 for `avg`, L19918–19950 for the tiles). Empty state: "Nothing logged in this window yet." (L19910–19916).
  6. Card 3 "Weight trend": rendered only when `computeTrend(p.weightLog).slice(-range).length > 1`. Polyline of the EMA trend, stroke `#8B5CF6`, y auto-scaled with a minimum span of 0.5 kg (L19951–19957 / L19962–19990 region within the component, ending L20037).
- Components: `TrendsTab` (L19781–20038), `DsSegmented` (L18573, outside range)
- Functions: `dailyIntakeSeries` (L19342), `computeTrend` (L19093), inline `avg` (L19787)
- State: local `range` (L19782). Props: `fuelLog`, `weightLog`, `calTarget` (L37451–37453).
- Storage: none directly — data arrives as props from `FuelTab`.
- Network: none. AI: none.
- Edge cases: zero logged days → averages card shows the empty line; `maxCal` is floored at 1 to avoid divide-by-zero (L19801–19805); a single weight entry hides the weight card.
- Gating: always on.
- Status: **WORKING**
- Evidence for status: mounted at L37450 with all three props supplied.
- Notes: The 30-day bar chart is 430 SVG units wide squeezed into `width:"100%"` with no scroll container — bars become ~2px on a phone. Chart colours `#F59E0B` and `#8B5CF6` are hardcoded, not theme tokens. `series` is recomputed on every render (no memo).

### F-FUEL-003 Recipe log sheet (bottom sheet: servings, meal slot, log)
- Location: Recipes context > tap a recipe > bottom sheet modal
- User action: picks a meal slot, steps servings up/down, taps "Log to <slot>"
- Behavior:
  1. Sheet opens as a portal (`lkPortal`) with `role="dialog"`, `aria-modal`, focus target `lkDialogRef`, and Escape wired via `useEscape(p.onClose)` (L20040, L20079–20096).
  2. Default slot = `slotForNow()` — breakfast <11h, lunch <15h, dinner <21h, else snacks (L18936–18942, L20042).
  3. Header shows per-serving macros from `p.perServing` (L20140–20152).
  4. Four slot buttons; the active one is orange-outlined (L20153–20182).
  5. Servings stepper: `−` clamps to min 0.5, `+` to max 12, both snapped to 0.5 increments (L20189–20215, L20232–20250).
  6. A live 4-tile Cal/Pro/Carb/Fat preview multiplies per-serving by `n` (L20253–20272 region).
  7. "Log to <slot>" builds the item `{name, cal, pro, carb, fat, src:"recipe", qty:{n, unit:"serving"}}`, adds `est:true` if `p.est`, and scales `per.nut` micros by `n` to 1 decimal, then calls `p.addItem(slot, item)` and `p.onClose(true)` (L20051–20077).
  8. "Cancel" and the backdrop both call `p.onClose(false)` (L20097–20105).
- Components: `RecipeLogSheet` (L20039–20274)
- Functions: inner `log` (L20051–20077), `slotForNow` (L18936)
- State: local `n` (servings, L20041), `slot` (L20042). Props: `name`, `perServing`, `est`, `addItem`, `onClose`.
- Storage: none directly (writing is `addItem`'s job, defined in `FuelTab`).
- Network / AI: none.
- Edge cases: `p.perServing` falls back to all-zero macros (L20043–20049); no upper guard on `per.cal` being absent.
- Gating: always on where mounted — never mounted.
- Status: **DEAD**
- Evidence for status: `RecipeLogSheet` occurs once in the file (definition, L20039); no call site.
- Notes: The macro preview and the `log()` function each round independently, so the tile shown and the value logged use identical arithmetic — no drift. Duplicate slot-button markup exists in `BarcodeTab.mealBtns` (L21057–21086).

### F-FUEL-004 Recipe builder (create a user recipe)
- Location: Recipes context > "NEW RECIPE" card
- User action: types a name, searches and adds ingredients, sets grams per ingredient, toggles raw/cooked, adds manual ingredients, sets servings, taps SAVE RECIPE
- Behavior:
  1. Name input (L20415–20434).
  2. Ingredient search: typing ≥2 chars runs `pickerResults()`, which scans `FOODS` (the built-in table, L34768), `lk_myGroceries`, and `lk_favFoods` for a case-insensitive substring on the name, concatenated in that order and truncated to 8 (L20288–20328).
  3. Tapping a result calls `addIng`, appending `{name, per100, grams:100, cooked:false}` and clearing the query (L20330–20338).
  4. Each ingredient row: name (ellipsised), a `DraftNum` grams field (holds keystrokes until blur — the inline comment at L20456–20458 documents that live `parseFloat` deleted the decimal point as you typed), a "g" label, and a remove `✕` (L20443–20510).
  5. If `yieldFactorFor(ing.name)` matches (rice 2.8 / pasta 2.4 / oats 2.5 dry, meat & fish 0.75 raw — L19966–19986), a raw/cooked `role="switch"` appears plus the live conversion "≈ X g cooked = Y g dry" using `grams / factor` (L20510–20560).
  6. "+ Manual ingredient" opens a per-100g form (name + Cal/Pro/Carb/Fat); `addManual` requires a name and calories, parses with `parseInt`, and stores `nut: null, manual: true` (L20339–20362, L20600–20680).
  7. Servings stepper clamps 1–24 (L20690–20760).
  8. A "PER SERVING" summary appears once at least one ingredient exists, showing `calcRecipe` output plus a `·`-joined line of the P1 micros (L20762–20790).
  9. `save()` requires a non-empty name and ≥1 ingredient; it builds `{id:"ur"+Date.now(), name, servings, ingredients, source:"user", createdAt}`, attaches `perServing = calcRecipe(rec)`, and prepends to `lk_userRecipes` via `saveUserRecipes` (L20368–20385).
  10. `saveUserRecipes` persists and dispatches the global `lockedFuelUpdate` event (L19962–19965).
- Components: `RecipeBuilder` (L20275–20799), `DraftNum` (L5085, outside range), `Ic` (icon)
- Functions: `pickerResults` (L20288), `addIng` (L20330), `addManual` (L20339), `updIng` (L20363), `save` (L20368), `calcRecipe` (L19999), `effectiveGrams` (L19993), `yieldFactorFor` (L19987), `saveUserRecipes` (L19962), `getUserRecipes` (L19959)
- State: local `name`, `servings`, `ings`, `pq`, `manualOpen`, `mn` (L20276–20287)
- Storage: reads `myGroceries`, `favFoods`, `userRecipes`; writes `userRecipes`. Dispatches window event `lockedFuelUpdate`.
- Network / AI: none.
- Edge cases: SAVE is disabled and non-clickable until name+ingredient exist (L20780–20798); grams cleared to empty commits `0` (L20463); `calcRecipe` floors servings at 0.5 (L20001).
- Gating: always on where mounted — never mounted.
- Status: **DEAD**
- Evidence for status: `RecipeBuilder` occurs once in the file (definition at L20275); no call site anywhere.
- Notes: `pickerResults()` runs on every render (not memoised) and scans the entire `FOODS` array. Manual macros use `parseInt`, silently truncating "10.5" to 10, while the input declares `step="0.01"` (L20344–20348 vs L20640). Duplicate names from FOODS/groceries/favs are not de-duplicated.

### F-FUEL-005 Quick-log food chip (tap to log, long-press to favourite)
- Location: Fuel tab > quick-add chip row
- User action: taps a chip to log the food; presses and holds ~500 ms to toggle it as a favourite
- Behavior:
  1. `onPointerDown` starts a 500 ms timer (L20803–20810).
  2. If the timer fires: `toggleFav(p.item)` and `navigator.vibrate(10)` when supported (L20806–20809).
  3. `onPointerUp` clears the timer; if the long-press did not fire, `p.onTap(p.item)` runs (L20811–20814).
  4. `onPointerLeave` cancels without firing either action (L20815–20817).
  5. Context menu is suppressed so long-press does not open the OS menu (L20822–20824).
  6. A favourited chip renders a `★` and an orange-tinted border (L20825–20857).
- Components: `QuickChip` (L20800–20858)
- Functions: `down`/`up`/`cancel` (L20803–20817), `toggleFav` (L18920–18935), `isFav` (L18914)
- State: refs `tRef`, `firedRef` (L20801–20802)
- Storage: `toggleFav` reads/writes `lk_favFoods` and dispatches `lockedFuelUpdate` (L18920–18935).
- Network / AI: none.
- Edge cases: no visual affordance or haptic-free fallback signals that a hold happened on devices without `navigator.vibrate`; no cancel on scroll (only on pointer leave).
- Gating: always on where mounted — never mounted.
- Status: **DEAD**
- Evidence for status: `QuickChip` occurs once in the file (definition at L20800); no call site.
- Notes: `getRecentFoods` (L18852) and `getFrequentFoods` (L18878), which exist solely to feed a chip row, are likewise defined-once/never-called. `_chipCache` (L18845) memoises them by object identity.

### F-FUEL-006 Barcode scanning — idle / entry screen
- Location: Fuel tab > "scan" sub-tab, `mode === "idle"` or `"manual"`
- User action: taps "OPEN CAMERA", or types a barcode and taps "Look up" / presses Enter
- Behavior:
  1. Default `mode` is `"idle"` (L20860). A hero card shows a barcode glyph, "Scan a barcode", and the copy "Packaged food logs in seconds — looked up on Open Food Facts, then USDA." (L21400–21460 region).
  2. "OPEN CAMERA" calls `startScan` (F-FUEL-007).
  3. Below it, a manual-entry card. Its heading switches to "CAMERA UNAVAILABLE — TYPE THE BARCODE" when `mode === "manual"`, otherwise "OR TYPE THE BARCODE" (L21470–21480).
  4. The input is `inputMode="numeric"`, placeholder `e.g. 0123456789012`; Enter or the "Look up" button calls `doLookup(gtinInput)` when non-empty (L21490–21548).
  5. A `p.gtin` prop handed over from the Search tab seeds the field and triggers `doLookup` immediately, then calls `p.onConsumeGtin()` to clear it (L20868–20876; producer at L37442–37449).
- Components: `BarcodeTab` (L20859–21549)
- Functions: `doLookup` (L20907–20929), `startScan` (L20930–20986), `normalizeGTIN` (L18961)
- State: `mode`, `gtinInput`, `item`, `grams`, `meal`, `nf*` fields, refs `videoRef/streamRef/loopRef/zxingRef` (L20860–20884)
- Storage: none at this stage.
- Network: none until lookup.
- Edge cases: `doLookup` with a code that strips to empty falls back to `mode="manual"` (L20908–20912); the "Look up" button is disabled while the field is blank (L21534).
- Gating: always on.
- Status: **WORKING**
- Evidence for status: mounted at L37446–37449 with `addItem`, `gtin`, `onConsumeGtin`.
- Notes: `mode === "manual"` renders the same tree as idle, differing only by the heading string — the camera card with "OPEN CAMERA" still shows even when the camera was just proven unavailable (L21400ff, no mode guard).

### F-FUEL-007 Live camera barcode scanning (BarcodeDetector, ZXing fallback)
- Location: Fuel tab > scan sub-tab, `mode === "scanning"`
- User action: taps "OPEN CAMERA", points the camera at a barcode, or taps Cancel
- Behavior:
  1. If `navigator.mediaDevices.getUserMedia` is absent, jump straight to `mode="manual"` (L20931–20935).
  2. Request `{video:{facingMode:"environment"}}`; on grant store the stream, set `mode="scanning"`, and wait 50 ms for the `<video>` to mount (L20936–20944).
  3. Attach the stream, `play()` with a swallowed rejection (L20945–20947).
  4. **Path A** — if `"BarcodeDetector" in window`, construct one for `ean_13, ean_8, upc_a, upc_e`; on success poll `det.detect(video)` every 200 ms and pass the first `rawValue` to `onCode` (L20948–20970).
  5. **Path B** — otherwise lazily `loadZXing()`, which injects `https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js` and caches the promise, then `new ZX.BrowserMultiFormatReader().decodeFromVideoElement(video, cb)` (L19076–19092, L20971–20985).
  6. `onCode` stops the camera, then runs `doLookup` (L20903–20906).
  7. UI: full-width `<video playsInline muted>` capped at 320px, an orange horizontal reticle line at 42% height, the hint "Point the camera at the barcode", and a Cancel button that calls `reset()` (L21088–21170).
  8. `stopCam()` clears the poll interval, resets the ZXing reader in a try/catch, and stops every `MediaStreamTrack`. It is also the effect cleanup, so unmounting always releases the camera (L20885–20902).
- Components: `BarcodeTab` (L20859)
- Functions: `startScan` (L20930), `stopCam` (L20885), `onCode` (L20903), `loadZXing` (L19076), `reset` (L21050)
- State: `mode`, refs `videoRef`, `streamRef`, `loopRef`, `zxingRef`
- Network: GET `https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js` (script tag, L19082)
- AI: none.
- Edge cases: permission denial → `mode="manual"` (L20984–20986); ZXing construction or load failure → `stopCam()` + `mode="manual"` (L20977–20984); `videoRef.current` null after the 50 ms delay silently aborts with the stream left open (L20941–20943) — a leak.
- Gating: always on.
- Status: **PARTIAL**
- Evidence for status: the happy paths are complete, but L20941–20943 returns without calling `stopCam()`, leaving the camera track running and `mode` stuck on `"scanning"` with no video.
- Notes: ZXing is loaded from **unpkg**, a third-party CDN pinned to 0.21.3, with no SRI hash (L19082) — a supply-chain surface. There is no torch/flashlight control and no manual "I can't scan it" escape from the scanning screen other than Cancel.

### F-FUEL-008 Barcode product found — portion, meal, log
- Location: Fuel tab > scan sub-tab, `mode === "found"`
- User action: picks a meal slot, edits grams (or taps the "1 serving (Ng)" shortcut), taps "Log to <slot>"
- Behavior:
  1. On a successful `lookupBarcode`, `item` is stored, `grams` seeded to `item.servingG || 100`, `mode="found"` (L20913–20919).
  2. Header: product name; sub-line = brand · source label (`off` → "Open Food Facts", `usda` → "USDA", else "My Store") · GTIN (L21180–21200).
  3. Four meal-slot buttons (shared `mealBtns`, L21057–21086), default `slotForNow()`.
  4. Grams `type="number" step="0.01" inputMode="decimal"`; the "1 serving (Ng)" button only appears when `item.servingG` is truthy (L21210–21270).
  5. Live Cal/Pro/Carb/Fat tiles recompute at `f = grams/100` on every keystroke (L21275–21330).
  6. `logFound()` builds `{name, cal, pro, carb, fat, src: item.src, gtin, qty:{n:grams, unit:"g"}}`, scales `per.nut` micros by `f` to 1 dp, calls `p.addItem(meal, logged)` (L20987–21029).
  7. **Side effect** — when the item has a GTIN, it is written to `lk_myGroceries` as per-100g values with `savedAt`, replacing any prior row with the same GTIN, so the next scan or search resolves locally (L21010–21027).
  8. `mode="logged"`.
  9. When `item.src === "off"`, the ODbL attribution "Product data: © Open Food Facts contributors (ODbL)" is rendered (L21380–21395).
- Components: `BarcodeTab` (L20859)
- Functions: `logFound` (L20987), `lookupBarcode` (L19002), `slotForNow` (L18936)
- State: `item`, `grams`, `meal`, `mode`
- Storage: writes `myGroceries` (L21012–21027); reads it too. `addItem` (in `FuelTab`) writes `fuelLog`.
- Network: see "External food APIs".
- Edge cases: `parseFloat(grams) || 100` means a cleared field logs 100 g silently (L20989); the auto-save to My Store drops micronutrients — only `cal/pro/carb/fat/gtin` are kept (L21013–21021), so a re-log from My Store loses fibre/sodium.
- Gating: always on.
- Status: **WORKING**
- Evidence for status: reachable from `doLookup` success at L20913–20919 with all handlers wired.
- Notes: The USDA branch has no attribution line — only OFF does (L21380). Rounding for the logged macros is to whole numbers, so a 20 g portion of a 3 g/100 g protein food logs 1 g.

### F-FUEL-009 Barcode not found — manual label entry
- Location: Fuel tab > scan sub-tab, `mode === "notfound"`
- User action: types the product name and the label's Cal/Pro/Carb/Fat, taps "LOG & SAVE"
- Behavior:
  1. When both lookups return null, the GTIN is stashed in `nfGtin`, all `nf*` fields cleared, `mode="notfound"` (L20919–20928).
  2. Copy: "Not found — add it yourself" / "Barcode <gtin> isn't in any database yet. Enter the label values once — next scan finds it instantly." (L21335–21360).
  3. Meal buttons, name input, and a 2×2 grid of CALORIES / PROTEIN (G) / CARBS (G) / FAT (G) numeric inputs (L21360–21500 region).
  4. `logNotFound()` requires name + calories; parses all four with `parseInt`; builds `{name, cal, pro, carb, fat, src:"manual", gtin}`; calls `p.addItem(meal, it)`; then prepends the same object plus `savedAt` to `lk_myGroceries`, replacing any same-GTIN row (L21030–21049).
  5. `mode="logged"`.
- Components: `BarcodeTab` (L20859)
- Functions: `logNotFound` (L21030–21049)
- State: `nfName`, `nfCal`, `nfPro`, `nfCarb`, `nfFat`, `nfGtin`, `meal`, `mode`
- Storage: writes `myGroceries`; `addItem` writes `fuelLog`.
- Network / AI: none.
- Edge cases: LOG & SAVE is disabled until name and calories are present (L21500–21520).
- Gating: always on.
- Status: **PARTIAL**
- Evidence for status: functional, but the values typed are the *label serving* values while the item is stored into `myGroceries` — which every other consumer (`lookupBarcode` at L19008–19017, `matchTupleLocal` at L19638, `pickerResults` at L20303) treats as **per 100 g**. The screen never says which basis to enter.
- Notes: This is a real data-integrity bug: a "per serving" entry becomes a "per 100 g" record on the next scan. `parseInt` again truncates decimals despite `step="0.01"` inputs.

### F-FUEL-010 Barcode logged confirmation
- Location: Fuel tab > scan sub-tab, `mode === "logged"`
- User action: taps "Scan another"
- Behavior: centred green "Logged ✓" plus a "Scan another" button calling `reset()`, which stops the camera, clears `item` and `gtinInput`, and returns to `mode="idle"` (L21050–21056, L21332–21400 region).
- Components: `BarcodeTab` (L20859)
- Functions: `reset` (L21050)
- State: `mode`
- Storage / Network / AI: none.
- Edge cases: no undo of the log from this screen.
- Gating: always on. Status: **WORKING**
- Evidence for status: `setMode("logged")` is reached from both `logFound` (L21028) and `logNotFound` (L21048).
- Notes: none.

### F-FUEL-011 Barcode loading state
- Location: Fuel tab > scan sub-tab, `mode === "loading"`
- Behavior: renders only the centred text "Looking up product…" (L21172–21178). Set by `doLookup` before `lookupBarcode` resolves (L20913).
- Components: `BarcodeTab`. Functions: `doLookup` (L20907).
- Edge cases: **no timeout and no cancel**. `lookupBarcode`'s promise chain always resolves (both `.catch`es return null, L19070–19074), so a network hang leaves this screen indefinitely with no way back except switching sub-tabs.
- Gating: always on. Status: **PARTIAL**
- Evidence for status: L20913–20929 has no abort path or timer; L19070–19074 catches errors but nothing bounds the request duration.
- Notes: offline behaviour is a rejected `fetch` → caught → `null` → the "not found" manual-entry screen, which misleadingly claims the barcode "isn't in any database yet" (L21350).

### F-FUEL-012 Fuel display settings card (hide numbers, dashboard framing)
- Location: Settings tab > below the weight-unit card, above "DATA & SYNC" (mounted L33105)
- User action: toggles "Hide calorie numbers"; picks "Left" or "Eaten" for dashboard framing
- Behavior:
  1. Card header "FUEL DISPLAY" (L21562–21570).
  2. Row 1: "Hide calorie numbers" / "Log without the math — progress shows as on track / over" with a `role="switch"` pill toggle (L21571–21622).
  3. Row 2: "Dashboard framing" / "Count calories left, or calories eaten" with two segmented buttons `remaining` ("Left") and `consumed` ("Eaten"), default `remaining` (L21623–21676).
  4. Every change calls `upd(patch)` → `setFuelSettings(patch)`, which merges into `lk_fuelSettings`, persists, dispatches `lockedFuelUpdate`, and returns the merged object for local state (L18656–18661, L21552–21554).
- Components: `FuelDisplayCard` (L21550–21677)
- Functions: `upd` (L21552), `getFuelSettings` (L18649), `setFuelSettings` (L18656)
- State: local `fs` seeded from `getFuelSettings` (L21551)
- Storage: reads/writes `lk_fuelSettings` (fields `waterGoalMl`, `hideNumbers`, `framing`; `tdeeReportDismissed` is added by F-FUEL-014).
- Network / AI: none.
- Edge cases: `waterGoalMl` defaults to `null` and is not editable from this card — it is only consumed by `waterGoal()` (L18955–18960), itself uncalled.
- Gating: always on.
- Status: **WORKING**
- Evidence for status: mounted at L33105; both settings are read by `FuelTab` at L36899–36903 (`hideNums`, `eatenFraming`), whose inline comments explicitly record that they previously did nothing and were wired up.
- Notes: the toggle is a hand-rolled div-slider, not a native control; keyboard activation works only because it is a `<button>`.

### F-FUEL-013 Privacy disclosure card
- Location: Settings tab > "DATA & SYNC" section (mounted L33110)
- User action: taps the header to expand/collapse five plain-language privacy sections
- Behavior: collapsed by default, `+`/`−` affordance, `aria-expanded` set (L21679, L21694–21740). Expanded content = five `row(title, body)` blocks: "On your device", "Cloud sync (signed in)", "AI features", "Beta testers", "Your controls" (L21741–21749).
- Components: `PrivacyCard` (L21678–21750)
- Functions: `row` (L21680–21693)
- State: local `open` (L21679). Storage / Network / AI: none.
- Edge cases: none — static copy.
- Gating: always on. Status: **WORKING**
- Evidence for status: mounted at L33110.
- Notes: The "AI features" paragraph enumerates meal photos, descriptions, voice recordings, receipt photos, physique photos, and a training/nutrition summary as data sent to a server (L21746). Copy is hardcoded English with no versioning or acceptance timestamp — a policy change is invisible to the user.

### F-FUEL-014 Adaptive TDEE weekly check-in card
- Location: Fuel tab > main view, below the weight-log card (mounted L37297)
- User action: reads the card; taps "?" for an explanation; taps "×" to dismiss
- Behavior:
  1. Reads `lk_tdeeHistory` and takes the last entry (L21752–21754).
  2. Renders `null` unless the entry exists **and** `entry.applied` is true (L21755).
  3. Renders `null` if the entry's `weekISO` is more than 3 days old (L21756–21757).
  4. Renders `null` if `fuelSettings.tdeeReportDismissed === entry.weekISO` (L21758–21759).
  5. Body: "We estimate you burn ≈<adaptiveTDEE||tdee> kcal/day, from <daysUsed> logged days and your weight trend." followed by either " Targets nudged ±N kcal." or " Targets unchanged this week." (L21800–21820).
  6. "?" toggles the explainer: "This compares what you log with how your weight trend actually moves… the estimate self-corrects over time." (L21822–21836).
  7. "×" calls `setFuelSettings({tdeeReportDismissed: entry.weekISO})` — dismissal is per-week, so next week's entry shows again (L21787–21798).
  8. The entry itself is produced by `applyAdaptiveTDEE()`, run once from `FuelTab`'s mount effect (L36982–36986).
- Components: `TdeeReportCard` (L21751–21838)
- Functions: `applyAdaptiveTDEE` (L19259–19300), `reconcileTDEE` (L19206–19258), `computeTrend` (L19093), `applyCalFloor` (L19169), `calcMacros` (L35752, outside range), `getFuelSettings`/`setFuelSettings` (L18649/L18656)
- State: local `showInfo` (L21752)
- Storage: reads `tdeeHistory`, `fuelProfile`, `fuelSettings`; `applyAdaptiveTDEE` writes `tdeeHistory` and `fuelProfile`.
- Network / AI: none.
- Edge cases: `delta === 0` still passes the `entry.applied` gate only if `next !== current`, so a zero-delta card is unreachable in practice (L19282–19287); the `weekISO + "T00:00:00"` parse is **local-time**, unlike `isoDay`-produced dates elsewhere.
- Gating: always on, but `applyAdaptiveTDEE` returns early (no card) when `profile.useCustomMacros` is set (L19262).
- Status: **WORKING**
- Evidence for status: mounted at L37297; the producing call runs at L36984.
- Notes: `applyAdaptiveTDEE` silently rewrites the user's protein/carb/fat targets alongside calories (L19292–19298) but the card only mentions calories — a user reading it will not know their macros moved. `prof.adaptiveTDEE || prof.tdee` is read *after* the write, so the number shown is the new target, not the observed TDEE (`entry.observedTDEE` is stored but never displayed).

### F-FUEL-015 Nutrition CSV / JSON export and full-account backup/restore
- Location: Settings tab > data section (CSV export mounted L33138; full backup L33157; restore L33200)
- User action: taps export (CSV), taps backup (JSON), picks a file to restore
- Behavior:
  1. `exportFuelCSV()` emits `date,meal,item,qty,cal,pro,carb,fat,fiber,sugar,satfat,sodium,src,est` for every logged item across every day, then a blank line and a second `date,weight_kg` table. Fields are RFC-4180-escaped by the inner `esc` (L19376–19399).
  2. `downloadText` builds a Blob, clicks a synthetic `<a download>`, and revokes the object URL after 500 ms (L19415–19435).
  3. `exportFuelJSON()` bundles `fuelLog, fuelProfile, weightLog, favFoods, userRecipes, supplements, suppLog, fuelSettings, mealPlans, tdeeHistory` (L19400–19414) — **never called**.
  4. `exportEverything()` dumps every `localStorage` key starting `lk_` or `__lk_ts__` plus `__lk_last_sync__` raw, as `{format:"locked-full-backup", version:1, exportedAt, keys, keyCount}` (L19436–19453).
  5. `importEverything(text, overwrite)` rejects anything whose `format` is not `locked-full-backup`; writes values first and `__lk_ts__` stamps second (the comment at L19467–19474 explains that a single pass lets the sync layer's `localStorage` patch overstamp restored data and make months-old data claim to be current); when `overwrite` is false it skips any key whose local stamp is newer; returns `{written, skipped, exportedAt}` (L19454–19498).
- Components: none in range (buttons live at L33138ff)
- Functions: `exportFuelCSV` (L19376), `exportFuelJSON` (L19400), `downloadText` (L19415), `exportEverything` (L19436), `importEverything` (L19454)
- State: none. Storage: reads all `lk_*`; `importEverything` writes all `lk_*` and `__lk_ts__*`.
- Network / AI: none.
- Edge cases: `importEverything` throws on malformed JSON — the caller at L33200 must handle it (outside my range, UNVERIFIED whether it does); individual `setItem` failures (quota) increment `skipped` silently (L19489).
- Gating: always on. Status: **PARTIAL**
- Evidence for status: CSV, full backup and restore are all wired (L33138/33157/33200); `exportFuelJSON` is defined at L19400 and occurs exactly once in the file — dead.
- Notes: CSV micronutrients are limited to fiber/sugar/satfat/sodium even though the model carries nine more.

### F-FUEL-016 Natural-language food text parsing (AI) → local food matching
- Location: intended for the Fuel search / voice logging path
- User action: types or dictates something like "2 eggs and toast with butter"
- Behavior:
  1. `parseFoodText(text, cb)` calls `aiCall(sys, text, null, onDone, onFail)` with a system prompt demanding a bare JSON array of `{"qty":number,"unit":string,"food":string}` and an allowed-unit whitelist (L19586–19604). Full prompt quoted in the AI section below.
  2. The response is salvaged by slicing between the first `[` and the last `]` before `JSON.parse`; any failure calls back `null` (L19588–19603).
  3. `matchTuples(tuples)` runs `matchTupleLocal` per tuple and splits into `{matched, unmatched}` (L19681–19692).
  4. `matchTupleLocal` scores candidate names 3 (exact) / 2 (substring either way) / 1 (all query words present) / 0, over `favFoods` + `myGroceries` first, then the built-in `FOODS` table; the highest score wins (L19611–19680).
  5. Grams: a saved food (fav/grocery) is always taken as **100 g** ("asLogged"); a `FOODS` entry uses `tupleGrams` — `qty × food.g` when the unit is "serving" and the food declares a gram weight, else `qty × UNIT_GRAMS[unit]` with a 100 g fallback (L19605–19610, L19664).
  6. `UNIT_GRAMS` is a hardcoded table of 25 unit→gram equivalences: g/ml 1, oz 28.35, cup 240, tbsp 15, tsp 5, slice 30, piece 50, serving 100, scoop 30, can 150, small 80, medium 118, large 150, egg 50 (L19560–19585).
  7. The result item carries `src:"local"` and `qty:{n, unit}`, with micros scaled through `scaleNut` (L19666–19680).
- Components: none in range.
- Functions: `parseFoodText` (L19586), `tupleGrams` (L19605), `matchTupleLocal` (L19611), inner `scoreName` (L19614), `matchTuples` (L19681), `scaleNut` (L18819), `normFoodName` (L18842)
- State: none. Storage: reads `favFoods`, `myGroceries`.
- Network: via `aiCall` (L2663, outside range).
- AI: model and endpoint are inside `aiCall` (L2663) — **UNVERIFIED from my range**. Prompt at L19587. Input: the raw user text. Output: JSON tuple array.
- Edge cases: non-array or unparseable output → `cb(null)`; empty-after-filter array → `cb(null)` (L19597–19602).
- Gating: always on where called — never called.
- Status: **DEAD**
- Evidence for status: `parseFoodText`, `matchTuples`, `matchTupleLocal` and `tupleGrams` each occur only at their definition and internal use; `parseFoodText` and `matchTuples` have no external caller anywhere in the file.
- Notes: `matchTupleLocal` hardcodes 100 g for any fav/grocery match, so "3 scoops whey" from a saved item logs one 100 g portion regardless of quantity (L19664) — a silent 3× error if it were live.

### F-FUEL-017 AI meal-item normalisation
- Location: photo/voice meal-analysis result path
- Behavior: `normalizeAiItems(items)` coerces a model's item array into the logged-item shape — rounds `cal/pro/carb/fat` to integers, defaults the name to "Item", stamps `src:"ai"` and `est:true`, and picks up optional `fiber`, `sugar`, `satfat`/`sat_fat`, `sodium` into a `nut` sub-object only when at least one is present (L19306–19325).
- Functions: `normalizeAiItems` (L19306), `cloneFoodItem` (L19301), `nameSimilarity` (L19326)
- Status: **DEAD** — all three occur once each in the file (definitions only).
- Evidence for status: whole-file occurrence count = 1 for `normalizeAiItems` (L19306), `cloneFoodItem` (L19301), `nameSimilarity` (L19326).
- Notes: `nameSimilarity` (token-overlap ratio ignoring words ≤2 chars, L19326–19341) looks like the dedupe scorer an AI-suggestion merge would need; nothing consumes it. It accepts `satfat` under two spellings, evidence the model output was inconsistent.

### F-FUEL-018 Pantry depletion on logging + expiry heuristics
- Location: intended side-effect of logging a food item
- Behavior:
  1. `depletePantry(loggedItem)` fuzzy-matches the logged name against pantry names (substring either direction, or any pantry word >3 chars appearing in the logged name), taking the **first** hit only (L19531–19559).
  2. It assumes `quantity × 4` total servings, decrements `servingsLeft` by exactly 1, sets `lowStock` at ≤20% remaining, and when it hits 0 marks `empty` and auto-adds the item to the shopping list via `addShoppingItem` in a swallowed try/catch (L19541–19555).
  3. `pantryUseSoon(item)` flags an item as needing use when its age reaches `PANTRY_EXPIRY_DAYS[category] - 3`, with a 30-day fallback for unknown categories. Table: produce 7, meat 4, dairy 10, bakery 5, frozen 60, drinks 90, snacks 60 (L19499–19513).
  4. `pantryBestPrice` returns the cheapest recorded price (L19514–19520); `pantryLastPriceFor(name)` finds the most recent price of the first fuzzy-matching pantry item (L19521–19530).
- Functions: `pantryUseSoon` (L19508), `pantryBestPrice` (L19514), `pantryLastPriceFor` (L19521), `depletePantry` (L19531)
- Storage: reads/writes pantry via `getPantry`/`savePantry` (L43415, outside range); writes the shopping list.
- Status: **DEAD** (`depletePantry`) / **UNVERIFIED** (the three pantry read helpers)
- Evidence for status: `depletePantry` occurs once in the file (L19531). The other three were not counted against the whole file in this audit — confirm with `rg -c "pantryUseSoon"` etc.
- Notes: the "1 logged item = 1 serving = ¼ of a unit" model (L19541–19544) is an unqualified guess and would misreport any bulk item.

### F-FUEL-019 Weight-trend and intake statistics helpers
- Location: model layer feeding F-FUEL-002 and F-FUEL-014
- Behavior:
  1. `computeTrend(weightLog, alpha=0.10)` sorts by date and produces an exponentially weighted moving average `trend = α·kg + (1−α)·trend`, seeded by the first valid reading, rounded to 2 dp; non-positive weights are skipped (L19093–19111).
  2. `trendOnOrBefore(arr, dateISO)` scans backwards for the last point at or before a date (L19112–19117).
  3. `weeklyRatePct(arr)` compares the latest trend against the trend 7 days earlier (falling back to the first point), normalises to a per-week rate, and returns `{pct, kg}`; null when fewer than 2 points or a non-positive span (L19118–19131).
  4. `avgIntake(fuelLog, days=7)` averages calories over the last N days **counting only days with ≥1 item**, returning `{avg, days}` or null (L19132–19158).
- Status: `computeTrend` and `trendOnOrBefore` **WORKING** (used by `TrendsTab` L19952 and `reconcileTDEE` L19243–19245). `weeklyRatePct` and `avgIntake` are **DEAD** — each occurs once in the file.
- Evidence for status: whole-file occurrence counts — `computeTrend` 3, `weeklyRatePct` 1, `avgIntake` 1.
- Notes: `weeklyRatePct` divides by `prev.trend` without a zero guard (L19128).

### F-FUEL-020 Fuel micro-helpers (slots, favourites, training day, water goal)
- Location: model layer
- Behavior / status, one line each:
  - `slotForNow()` — time-of-day meal slot, thresholds 11/15/21 (L18936). **WORKING**, used by `RecipeLogSheet` (L20042) and `BarcodeTab` (L20864).
  - `nextSlot(s)` — cycles breakfast→lunch→dinner→snacks→breakfast (L18943). **DEAD**, one occurrence.
  - `isTrainingDayToday(history)` — true if any history entry's `dateISO` equals today (L18947). **DEAD**, one occurrence.
  - `waterGoal(profile, settings)` — `settings.waterGoalMl` if >0, else `35 ml × kg` rounded to the nearest 50, else a flat 3000 ml (L18955). **DEAD**, one occurrence.
  - `getFavFoods` / `isFav` / `toggleFav` (L18911/L18914/L18920) — favourites list in `lk_favFoods`, matched on the normalised name; `toggleFav` stamps `savedAt` and dispatches `lockedFuelUpdate`. `toggleFav` is called only by the dead `QuickChip`; `isFav` has one occurrence. **DEAD**.
  - `getRecentFoods(fuelLog, limit=12)` — most recent distinct foods, walking days newest-first and slots in the order snacks→dinner→lunch→breakfast (L18852). **DEAD**.
  - `getFrequentFoods(fuelLog, days=30, limit=8)` — foods logged ≥3 times in the window, ranked by count (L18878). **DEAD**. Its cache ignores the `days` argument (L18881–18882) — calling it with a different window returns the previous window's result.
  - `normFoodName(n)` — lowercase, trim, collapse whitespace (L18842). **WORKING**, the join key everywhere.
- Notes: `_chipCache` (L18845) is a module-level mutable singleton keyed on object identity; it is never invalidated by the `lockedFuelUpdate` event.

---

## PART B — Function / component index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| `getFuelSettings` | function | 18649–18655 | Read `lk_fuelSettings` with defaults `{waterGoalMl:null, hideNumbers:false, framing:"remaining"}` | FuelDisplayCard 21551, TdeeReportCard 21760, FuelTab 36899, exportFuelJSON 19409 | `ld` | F-FUEL-012, 014 |
| `setFuelSettings` | function | 18656–18661 | Merge-patch fuel settings, persist, dispatch `lockedFuelUpdate` | FuelDisplayCard 21553, TdeeReportCard 21789 | `sd`, `getFuelSettings` | F-FUEL-012, 014 |
| `NUTRIENTS_P1` | const array | 18662–18675 | Primary micros: fiber, sugar, satfat, sodium | DayNutritionPanel, RecipeBuilder, sumDayNutrients | — | F-FUEL-001, 004 |
| `NUTRIENTS_P2` | const array | 18676–18715 | Secondary micros: potassium…folate (9) | DayNutritionPanel, sumDayNutrients | — | F-FUEL-001 |
| `FDC_NUT_IDS` | const map | 18716–18730 | USDA FDC nutrient id → internal micro key | *(nothing — see notes)* | — | — |
| `sumDayNutrients` | function | 18731–18759 | Sum all micros across a day's four meal slots, tracking gaps | DayNutritionPanel 19695 | — | F-FUEL-001 |
| `nutrientTargets` | function | 18761–18818 | Sex- and calorie-scaled micro goals with min/max/info type | DayNutritionPanel 19698 | — | F-FUEL-001 |
| `scaleNut` | function | 18819–18829 | Scale a per-100g micro object by a factor, 1 dp | matchTupleLocal 19678 | — | F-FUEL-016 |
| `offNut100` | function | 18830–18841 | Map OpenFoodFacts `*_100g` fields to internal micro keys | parseOffProduct 18985 | `offSodiumMg` | F-FUEL-008 |
| `normFoodName` | function | 18842–18844 | Lowercase/trim/collapse a food name into a match key | getRecentFoods, getFrequentFoods, isFav, toggleFav, matchTupleLocal, pantryLastPriceFor, depletePantry, nameSimilarity | — | many |
| `_chipCache` | module var | 18845–18851 | Identity-keyed memo for recent/frequent foods | getRecentFoods, getFrequentFoods | — | F-FUEL-005 |
| `getRecentFoods` | function | 18852–18877 | Last N distinct logged foods, newest first | *(none — dead)* | `normFoodName` | F-FUEL-005 |
| `getFrequentFoods` | function | 18878–18910 | Foods logged ≥3× in the last N days, by count | *(none — dead)* | `isoDay`, `normFoodName` | F-FUEL-005 |
| `getFavFoods` | function | 18911–18913 | Read `lk_favFoods` | isFav, toggleFav, matchTupleLocal, pickerResults, exportFuelJSON | `ld` | F-FUEL-004, 005, 016 |
| `isFav` | function | 18914–18919 | Is a name in favourites | *(none — dead)* | `getFavFoods`, `normFoodName` | F-FUEL-005 |
| `toggleFav` | function | 18920–18935 | Add/remove a favourite, stamp `savedAt`, dispatch event | QuickChip 20807 | `getFavFoods`, `sd` | F-FUEL-005 |
| `slotForNow` | function | 18936–18942 | Meal slot from the current hour (11/15/21 cutoffs) | RecipeLogSheet 20042, BarcodeTab 20864 | — | F-FUEL-003, 006 |
| `nextSlot` | function | 18943–18946 | Next meal slot in cyclic order | *(none — dead)* | — | F-FUEL-020 |
| `isTrainingDayToday` | function | 18947–18954 | Did a workout happen today | *(none — dead)* | `isoDay` | F-FUEL-020 |
| `waterGoal` | function | 18955–18960 | Water target: override, else 35 ml/kg to nearest 50, else 3000 | *(none — dead)* | — | F-FUEL-020 |
| `normalizeGTIN` | function | 18961–18965 | Strip non-digits; pad a 12-digit UPC to 13 | lookupBarcode 19003, doLookup 20908, USDA filter 19040 | — | F-FUEL-006 |
| `getBarcodeCache` | function | 18966–18968 | Read `lk_barcodeCache` | lookupBarcode 19019, cacheBarcode | `ld` | F-FUEL-008 |
| `cacheBarcode` | function | 18969–18976 | Store a resolved product under its GTIN with `fetchedAt` | lookupBarcode 19026, 19065 | `getBarcodeCache`, `sd` | F-FUEL-008 |
| `offSodiumMg` | function | 18977–18981 | Sodium mg from OFF `sodium_100g`, else `salt_100g / 2.5` | offNut100 18835 | — | F-FUEL-008 |
| `parseOffProduct` | function | 18982–19001 | OFF product JSON → internal per-100g item; null without kcal | lookupBarcode 19024 | `offNut100` | F-FUEL-008 |
| `lookupBarcode` | function | 19002–19074 | My Store → cache → OpenFoodFacts → USDA resolution chain | doLookup 20913 | `normalizeGTIN`, `ld`, `getBarcodeCache`, `parseOffProduct`, `cacheBarcode`, `fetch` | F-FUEL-006, 008 |
| `_zxingP` | module var | 19075 | Cached ZXing load promise | loadZXing | — | F-FUEL-007 |
| `loadZXing` | function | 19076–19092 | Inject the ZXing UMD bundle from unpkg once | startScan 20971 | — | F-FUEL-007 |
| `computeTrend` | function | 19093–19111 | EMA (α=0.10) weight trend series | TrendsTab 19952, reconcileTDEE 19243 | — | F-FUEL-002, 014 |
| `trendOnOrBefore` | function | 19112–19117 | Last trend point at or before a date | weeklyRatePct 19124, reconcileTDEE 19244–19245 | — | F-FUEL-014, 019 |
| `weeklyRatePct` | function | 19118–19131 | Weekly weight change as %/kg from the trend | *(none — dead)* | `trendOnOrBefore`, `isoDay` | F-FUEL-019 |
| `avgIntake` | function | 19132–19158 | Mean calories over N days, logged days only | *(none — dead)* | `isoDay` | F-FUEL-019 |
| `calcBMR` | function | 19159–19168 | Revised Harris–Benedict BMR, sex-split | applyCalFloor 19170, calcTDEEInfo 19182, reconcileTDEE 19249 | — | TDEE math |
| `applyCalFloor` | function | 19169–19180 | Clamp a target to max(BMR, 1200 F / 1500 M) | calcTDEEInfo 19204, applyAdaptiveTDEE 19285 | `calcBMR` | TDEE math |
| `calcTDEEInfo` | function | 19181–19205 | BMR × activity multiplier, goal deficit/surplus, floored | *(none — dead)* | `calcBMR`, `applyCalFloor` | TDEE math |
| `reconcileTDEE` | function | 19206–19258 | Observed TDEE from 14 d of intake vs weight-trend change | applyAdaptiveTDEE 19271 | `isoDay`, `computeTrend`, `trendOnOrBefore`, `calcBMR` | F-FUEL-014 |
| `applyAdaptiveTDEE` | function | 19259–19300 | Weekly 70/30 blend, ±150 kcal step, rewrite targets + macros | FuelTab 36984 | `ld`, `getWeightLog`, `reconcileTDEE`, `isoDay`, `applyCalFloor`, `calcMacros`, `sd` | F-FUEL-014 |
| `cloneFoodItem` | function | 19301–19305 | Shallow clone with a copied `nut` object | *(none — dead)* | — | F-FUEL-017 |
| `normalizeAiItems` | function | 19306–19325 | Coerce AI meal items into logged-item shape, `src:"ai"`, `est` | *(none — dead)* | — | F-FUEL-017 |
| `nameSimilarity` | function | 19326–19341 | Token-overlap ratio between two food names | *(none — dead)* | `normFoodName` | F-FUEL-017 |
| `dailyIntakeSeries` | function | 19342–19375 | Per-day totals for the last N days incl. fiber/sodium | TrendsTab 19783 | `isoDay` | F-FUEL-002 |
| `exportFuelCSV` | function | 19376–19399 | Two-table CSV of the food diary and the weight log | Settings 33138 | `ld`, `getWeightLog` | F-FUEL-015 |
| `exportFuelJSON` | function | 19400–19414 | Full nutrition-domain JSON bundle | *(none — dead)* | `ld`, `getWeightLog`, `getFavFoods`, `getUserRecipes`, `getSuppLog`, `getFuelSettings` | F-FUEL-015 |
| `downloadText` | function | 19415–19435 | Blob + synthetic anchor download, URL revoked after 500 ms | Settings 33138 | — | F-FUEL-015 |
| `exportEverything` | function | 19436–19453 | Raw dump of every `lk_`/`__lk_ts__` localStorage key | Settings 33157 | — | F-FUEL-015 |
| `importEverything` | function | 19454–19498 | Restore a backup; additive by stamp unless `overwrite` | Settings 33200 | — | F-FUEL-015 |
| `PANTRY_EXPIRY_DAYS` | const map | 19499–19507 | Category → shelf-life days | pantryUseSoon | — | F-FUEL-018 |
| `pantryUseSoon` | function | 19508–19513 | Is a pantry item within 3 days of its shelf life | *(UNVERIFIED)* | — | F-FUEL-018 |
| `pantryBestPrice` | function | 19514–19520 | Cheapest recorded price for an item | *(UNVERIFIED)* | — | F-FUEL-018 |
| `pantryLastPriceFor` | function | 19521–19530 | Most recent price for a fuzzy name match | *(UNVERIFIED)* | `normFoodName`, `getPantry` | F-FUEL-018 |
| `depletePantry` | function | 19531–19559 | Decrement pantry stock on a log; auto-add to shopping when empty | *(none — dead)* | `normFoodName`, `getPantry`, `addShoppingItem`, `savePantry` | F-FUEL-018 |
| `UNIT_GRAMS` | const map | 19560–19585 | 25 unit→gram equivalences | tupleGrams | — | F-FUEL-016 |
| `parseFoodText` | function | 19586–19604 | AI-parse free text into `{qty,unit,food}` tuples | *(none — dead)* | `aiCall` | F-FUEL-016 |
| `tupleGrams` | function | 19605–19610 | Tuple + food entry → grams | matchTupleLocal 19664 | — | F-FUEL-016 |
| `matchTupleLocal` | function | 19611–19680 | Score-match a tuple against favs/groceries/FOODS, build item | matchTuples 19684 | `normFoodName`, `getFavFoods`, `ld`, `tupleGrams`, `scaleNut` | F-FUEL-016 |
| `scoreName` | inner function | 19614–19625 | 3/2/1/0 name-match score | matchTupleLocal | `normFoodName` | F-FUEL-016 |
| `matchTuples` | function | 19681–19692 | Split tuples into matched items and unmatched | *(none — dead)* | `matchTupleLocal` | F-FUEL-016 |
| `DayNutritionPanel` | component | 19693–19779 | Collapsible micronutrient table for a day | *(none — dead)* | `sumDayNutrients`, `nutrientTargets`, `ld` | F-FUEL-001 |
| `TrendsTab` | component | 19781–20038 | Nutrition trends: calorie bars, averages grid, weight line | FuelTab 37450 | `dailyIntakeSeries`, `computeTrend`, `DsSegmented` | F-FUEL-002 |
| `avg` (inner) | inner function | 19787–19800 | Mean of a series key over logged days | TrendsTab | — | F-FUEL-002 |
| `getUserRecipes` | function | 19959–19961 | Read `lk_userRecipes` | RecipeBuilder.save 20383, exportFuelJSON | `ld` | F-FUEL-004 |
| `saveUserRecipes` | function | 19962–19965 | Persist recipes and dispatch `lockedFuelUpdate` | RecipeBuilder.save 20383 | `sd` | F-FUEL-004 |
| `YIELD_FACTORS` | const array | 19966–19986 | Regex→cooked/raw yield factor for rice/pasta/oats/meat | yieldFactorFor | — | F-FUEL-004 |
| `yieldFactorFor` | function | 19987–19992 | First matching yield factor for a name | effectiveGrams 19996, RecipeBuilder 20444 | — | F-FUEL-004 |
| `effectiveGrams` | function | 19993–19998 | Convert cooked grams back to raw/dry grams | calcRecipe 20009 | `yieldFactorFor` | F-FUEL-004 |
| `calcRecipe` | function | 19999–20038 | Per-serving macros + micros for a recipe | RecipeBuilder 20384/20387 | `effectiveGrams` | F-FUEL-004 |
| `RecipeLogSheet` | component | 20039–20274 | Bottom sheet to log N servings of a recipe to a slot | *(none — dead)* | `useEscape`, `lkPortal`, `slotForNow` | F-FUEL-003 |
| `log` (inner) | handler | 20051–20077 | Build and add the scaled recipe item | RecipeLogSheet | `p.addItem`, `p.onClose` | F-FUEL-003 |
| `RecipeBuilder` | component | 20275–20799 | Create a user recipe from searched/manual ingredients | *(none — dead)* | `calcRecipe`, `saveUserRecipes`, `DraftNum`, `fmtQ` | F-FUEL-004 |
| `pickerResults` | inner function | 20288–20328 | Substring search over FOODS + groceries + favs, cap 8 | RecipeBuilder | `ld`, `getFavFoods` | F-FUEL-004 |
| `addIng` | handler | 20330–20338 | Append a picked ingredient at 100 g | RecipeBuilder | — | F-FUEL-004 |
| `addManual` | handler | 20339–20362 | Append a hand-entered per-100g ingredient | RecipeBuilder | — | F-FUEL-004 |
| `updIng` | handler | 20363–20367 | Patch one ingredient immutably | RecipeBuilder | — | F-FUEL-004 |
| `save` | handler | 20368–20385 | Persist the new recipe with its computed per-serving | RecipeBuilder | `calcRecipe`, `saveUserRecipes`, `getUserRecipes` | F-FUEL-004 |
| `QuickChip` | component | 20800–20858 | Tap-to-log / hold-to-favourite food chip | *(none — dead)* | `toggleFav` | F-FUEL-005 |
| `down` | handler | 20803–20810 | Start the 500 ms long-press timer | QuickChip | `toggleFav`, `navigator.vibrate` | F-FUEL-005 |
| `up` | handler | 20811–20814 | Cancel the timer; tap-log if it never fired | QuickChip | `p.onTap` | F-FUEL-005 |
| `cancel` | handler | 20815–20817 | Cancel on pointer leave | QuickChip | — | F-FUEL-005 |
| `BarcodeTab` | component | 20859–21549 | Six-mode barcode scan / lookup / log screen | FuelTab 37446 | `lookupBarcode`, `loadZXing`, `slotForNow`, `normalizeGTIN` | F-FUEL-006…011 |
| `stopCam` | handler | 20885–20902 | Clear the poll, reset ZXing, stop all camera tracks | BarcodeTab (effect cleanup, onCode, reset, error paths) | — | F-FUEL-007 |
| `onCode` | handler | 20903–20906 | A code was decoded: stop the camera and look it up | BarcodeDetector poll, ZXing callback | `stopCam`, `doLookup` | F-FUEL-007 |
| `doLookup` | handler | 20907–20929 | Normalise, set loading, resolve, branch found/notfound | startup effect, Enter key, Look up button, onCode | `normalizeGTIN`, `lookupBarcode` | F-FUEL-006 |
| `startScan` | handler | 20930–20986 | Acquire the camera and start BarcodeDetector or ZXing | OPEN CAMERA button | `getUserMedia`, `loadZXing`, `onCode` | F-FUEL-007 |
| `logFound` | handler | 20987–21029 | Log the scaled product and auto-save it to My Store | "Log to <slot>" | `p.addItem`, `ld`, `sd` | F-FUEL-008 |
| `logNotFound` | handler | 21030–21049 | Log hand-entered label values and save to My Store | "LOG & SAVE" | `p.addItem`, `ld`, `sd` | F-FUEL-009 |
| `reset` | handler | 21050–21056 | Stop the camera and return to idle | Cancel, Back, Scan another | `stopCam` | F-FUEL-010 |
| `FuelDisplayCard` | component | 21550–21677 | Settings card: hide numbers + dashboard framing | Settings 33105 | `getFuelSettings`, `setFuelSettings` | F-FUEL-012 |
| `upd` | handler | 21552–21554 | Patch fuel settings and mirror into local state | FuelDisplayCard | `setFuelSettings` | F-FUEL-012 |
| `PrivacyCard` | component | 21678–21750 | Collapsible five-section privacy disclosure | Settings 33110 | — | F-FUEL-013 |
| `row` | inner function | 21680–21693 | Title + body paragraph pair | PrivacyCard | — | F-FUEL-013 |
| `TdeeReportCard` | component | 21751–21838 | Weekly adaptive-TDEE check-in banner, dismissible | FuelTab 37297 | `ld`, `getFuelSettings`, `setFuelSettings` | F-FUEL-014 |

**Out-of-scope but inside my line range** (menstrual-cycle module; UI is `CycleTab`, mounted at L37455, audited elsewhere). Listed for completeness:

| Name | Kind | file:lines | Purpose |
|---|---|---|---|
| `D.drop`, `D.gear` | icon path constants | 21836–21838 | Droplet and gear SVG paths appended to the shared `D` icon map |
| `MC_COL` / `MC_TXT` | const maps | 21839–21852 | Phase colours (chart / text variants) |
| `MC_PHASE_INFO` | const map | 21853–21879 | Per-phase description and training guidance copy |
| `MC_SYMPTOMS` | const array | 21880 | 12 symptom id/label pairs |
| `MC_MOODS` | const array | 21881 | 8 mood labels |
| `MC_FLOWS` | const array | 21882 | 5 flow levels, None…Heavy |
| `MC_EVENTS` | const array | 21883–21903 | 5 loggable reproductive events |
| `MC_PREG_END` | const map | 21904–21907 | Events that terminate a pregnancy |
| `MC_HBC` | const array | 21908 | Hormonal birth-control method ids |
| `MC_BC_OPTS` | const array | 21909 | Birth-control picker options |
| `MC_GOALS` | const array | 21910 | Cycle-tracking goal options |
| `mcISO` | function | 21911–21913 | Local-date → `YYYY-MM-DD` |
| `mcParse` | function | 21914–21917 | `YYYY-MM-DD` → local `Date` |
| `mcAddDays` | function | 21918–21922 | Shift an ISO date by N days |
| `mcDiff` | function | 21923–21925 | Whole-day difference between two ISO dates |
| `mcFmt` | function | 21926–21930 | ISO date → "Mon D" |
| `mcTodayISO` | function | 21931–21933 | Today as ISO |
| `mcGetProfile` / `mcSaveProfile` | functions | 21934–21939 | Read/write `lk_mcProfile` |
| `mcGetDays` / `mcSaveDays` | functions | 21940–21945 | Read/write `lk_mcDays` |
| `isFemaleUser` | function | 21946–21951 | True if `profile.sex` or `fuelProfile.sex` is female |
| `mcPregEnds` | function | 21952–21959 | Sorted dates of abortion/miscarriage events |
| `mcPeriodStarts` | function | 21960–21989 | Derive period start dates from flow ≥2 runs, excluding post-pregnancy bleeds |
| `mcCompute` | function | 21990–22149 | Full cycle model: avg length, SD, confidence, phase, ovulation, fertile and PMS windows, pregnancy recovery, EC adjustment |
| `phaseOfDay` | inner function | 22053–22061 | Cycle day → phase name |
| `dayOfDate` | inner function | 22062–22068 | ISO date → cycle day number |
| `mcSymptomBuckets` | function | 22150–22183 | Per-symptom during/before/total counts |
| `mcSymLabel` | function | 22184–22188 | Symptom id → label |
| `mcPreSymptoms` | function | 22189–22198 | Symptoms occurring ≥60% pre-period with ≥3 logs |
| `mcExportData` | function | 22199–22232 | Share or download cycle JSON via Web Share, else Blob download |
| `mcAthleteFlags` | function | 22233–22318 | Detect long gaps / missed cycles against training history |
| `mcInsights` | function | 22319–22403 | Build the phrased insight list from buckets and flags |
| `mcPolar` | function | 22404–22410 | Polar→cartesian for the cycle dial |
| `mcArcPath` | function | 22411–22416 | SVG arc path between two angles |

Totals in my range: **20 features**, **107 named functions/components/handlers indexed** (85 in-scope fuel + 22 cycle-module entries listed above; constant tables counted separately in the tables).

---

## Nutrition data model

**Food item as logged** (the atom stored in a meal slot). Built in five places, all agreeing on this shape:
```
{ name: string,
  cal: int, pro: int, carb: int, fat: int,      // whole numbers, portion-scaled
  src: "recipe"|"local"|"ai"|"manual"|"off"|"usda",
  est?: true,                                    // AI/uncertain estimate
  gtin?: string,                                 // barcode items only
  qty?: { n: number, unit: "g"|"serving"|<UNIT_GRAMS key> },
  nut?: { fiber?, sugar?, satfat?, sodium?, potassium?, calcium?, iron?,
          magnesium?, zinc?, vitc?, vitd?, b12?, folate? }   // 1 dp
}
```
Cites: recipe path L20052–20076; barcode path L20991–21009; manual path L21032–21040; local-match path L19666–19680; AI path L19307–19324. Micro keys and units come from `NUTRIENTS_P1` (L18662–18675) and `NUTRIENTS_P2` (L18676–18715): fiber/sugar/satfat in g, sodium/potassium/calcium/iron/magnesium/zinc/vitc in mg, vitd/b12/folate in µg.

**Per-100g source item** (what `lookupBarcode` and the ingredient picker pass around, never itself logged):
```
{ name, brand, per100: { cal, pro, carb, fat, nut: {…} },
  servingG: number|null, gtin, src: "off"|"usda"|"local" }
```
Cite: L18985–19000 (OFF), L19053–19064 (USDA), L19008–19017 (My Store).

**A day** in `lk_fuelLog`, keyed by `isoDay()`:
```
fuelLog["2026-09-10"] = {
  meals: { breakfast: [item…], lunch: […], dinner: […], snacks: […] },
  water: <ml>
}
```
Cite: the default shape constructed in `FuelTab.getDay` L36934–36942, and the four-slot iteration used everywhere in my range (L18735, L19133–19147, L19352–19365, L19381–19385).

**Day totals** are never persisted. They are derived on the fly two ways:
- macros — `FuelTab` reduces `allItems` (L36960–36980);
- micros — `sumDayNutrients(day)` → `{ totals:{key:number}, missing:{key:true}, itemCount:int }` (L18731–18759). `missing[k]` is set whenever *any* item lacks that key, which is what drives the `*` and the `— / *` footnote.

**A recipe** in `lk_userRecipes`:
```
{ id: "ur"+Date.now(), name, servings: int,
  ingredients: [ { name, per100:{cal,pro,carb,fat,nut|null},
                   grams: number, cooked: bool, manual?: true } ],
  source: "user", createdAt: ISO,
  perServing: { cal, pro, carb, fat, nut?: {…} }   // snapshot from calcRecipe
}
```
Cite: L20374–20385 (build), L19999–20038 (`calcRecipe`). `perServing` is a **snapshot** — editing an ingredient later would not refresh it, and there is no edit path anyway. A recipe may instead carry `fixedPerServing`, which short-circuits the whole calculation (L20000).

**Favourites** (`lk_favFoods`) and **My Store** (`lk_myGroceries`) both store flat per-100g rows `{name, cal, pro, carb, fat, nut?, gtin?, savedAt}` — see L18928–18930, L21013–21021, L21042–21045, and the consumers at L19008–19017 / L19638–19650 / L20303–20314.

---

## TDEE / macro math

**BMR — revised Harris–Benedict** (L19159–19168), quoted:
```
female: 447.593 + 9.247*kg + 3.098*cm - 4.330*age
male:    88.362 + 13.397*kg + 4.799*cm - 5.677*age
```
Returns null if weight, height or age is missing (L19160).

**Activity multipliers** (L19186–19192): `sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very 1.9`; default `1.55` for an unknown level (L19193).

**Goal adjustment** (L19196–19202), quoted:
```
cut:  rate>0 && kg>0 ? tdee - round(rate/100 * kg * 7700 / 7) : round(tdee * 0.8)
bulk: rate>0 && kg>0 ? tdee + round(rate/100 * kg * 7700 / 7) : round(tdee * 1.1)
```
`ratePct` is % of bodyweight per week; 7700 kcal per kg is the assumed energy density.

**Calorie floor** (L19169–19180):
```
floor = max(round(BMR), sex==="female" ? 1200 : 1500)
cal   = max(tdee, floor);  floored = tdee < floor
```

**Fallback when BMR is unknown:** `calcTDEEInfo` returns a flat `{cal: 2200, floored:false}` (L19183–19186). 2200 also appears as the hardcoded default in `nutrientTargets` (L18762), `applyAdaptiveTDEE` (L19281) and `DayNutritionPanel` (L19698).

**Observed (reconciled) TDEE** — `reconcileTDEE`, L19206–19258. Gates, in order:
1. 14-day window; a day counts only if ≥2 meal slots have items **and** total ≥800 kcal (L19229).
2. Need ≥8 such valid days, else null (L19234).
3. Need ≥2 weight entries in the window (L19236–19238) spanning ≥10 days (L19241).
4. `deltaKgPerDay = (trendEnd - trendStart) / spanDays` from the EMA trend.
5. `observed = round(totalCal/validDays - deltaKgPerDay * 7700)` (L19248).
6. Clamped to `[BMR, BMR*2.6]` when BMR is known (L19250–19252).

**Weekly adaptation** — `applyAdaptiveTDEE`, L19259–19300:
- skipped entirely when `profile.useCustomMacros` (L19262);
- runs at most once per 7 days (`daysSince <= 6` → return, L19266–19269);
- `blended = round(0.7*current + 0.3*observed)`; `step = clamp(blended - current, -150, +150)`; `next = applyCalFloor(current + step).cal` (L19282–19285);
- appends `{weekISO, observedTDEE, daysUsed, applied, delta}` to `lk_tdeeHistory` and writes `adaptiveTDEE` + the three macro fields back into `lk_fuelProfile` (L19286–19298).

**Macro split** — `calcMacros` (L35752–35762, outside my range but the consumer of the above), quoted:
```
pro  = round(kg * (goal==="cut" ? 2.4 : goal==="bulk" ? 2.0 : 2.2))   // g/kg
fat  = round(tdee * 0.25 / 9)                                          // 25% of kcal
carb = max(round((tdee - pro*4 - fat*9) / 4), 50)                      // remainder, floor 50 g
```
Default weight if none is set: 80 kg (L35753, and L19290 on the caller side).

**Micronutrient targets** — `nutrientTargets` (L18761–18818), quoted:
```
fiber      min  round(14 * cal / 1000)
sugar      info (no goal)
satfat     max  round(cal * 0.10 / 9)
sodium     max  2300 mg
potassium  min  F 2600 / M 3400 mg
calcium    min  1000 mg
iron       min  F 18 / M 8 mg
magnesium  min  F 310 / M 400 mg
zinc       min  F 8  / M 11 mg
vitc       min  F 75 / M 90 mg
vitd       min  15 µg
b12        min  2.4 µg
folate     min  400 µg
```

**Weight trend** — `computeTrend` EMA with α = 0.10 (L19093–19111): `trend = α*kg + (1-α)*trend`, seeded by the first valid reading.

**Other hardcoded constants in the fuel domain:** water 35 ml/kg with a 3000 ml fallback (L18955–18960); yield factors rice 2.8, pasta 2.4, oats 2.5, meat/fish 0.75 (L19966–19986); `UNIT_GRAMS` 25-entry table (L19560–19585); pantry `quantity × 4` servings (L19541) and the shelf-life table (L19499–19507).

---

## External food APIs

`lookupBarcode(gtin)` (L19002–19074) is the single entry point. Resolution order:

**0. Normalise** — `normalizeGTIN` strips non-digits and left-pads a 12-digit UPC-A with "0" to make an EAN-13 (L18961–18965).

**1. My Store (local, no network)** — the first row in `lk_myGroceries` whose `gtin` matches wins immediately, returned as `{…, brand:"MY STORE", src:"local"}` (L19005–19017). A user's own entry therefore permanently shadows both databases for that barcode.

**2. Barcode cache** — `lk_barcodeCache[gtin]` is used when `now - fetchedAt < 30 * 86400000` (30 days) (L19018–19021). Cached entries are never evicted, only overwritten.

**3. OpenFoodFacts**
- Request: `GET https://world.openfoodfacts.org/api/v2/product/<gtin>.json` (L19022). No auth, no headers, no User-Agent (OFF asks for an identifying UA), no timeout, no `AbortController`.
- Accepted only when `d.status === 1 && d.product` (L19024).
- Response fields read, all from `product.nutriments` (L18982–19001, L18830–18841, L18977–18981):
  `energy-kcal_100g` (**required** — a product without it is rejected, L18984), `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g`, `sugars_100g`, `saturated-fat_100g`, `sodium_100g` **or** `salt_100g` (salt is converted with `salt/2.5*1000` mg, L18977–18981), `potassium_100g`, `calcium_100g`, `iron_100g` (all three ×1000 to mg). Plus `product.product_name` (fallback `"Product <gtin>"`), `product.brands`, `product.serving_quantity`.
- Only 7 of the 13 internal micro keys can come from OFF — magnesium, zinc, vitc, vitd, b12 and folate are never populated from this source (L18830–18841).
- Success → `cacheBarcode(gtin, item)` and return (L19025–19028).

**4. USDA FoodData Central** (only if OFF returned nothing usable)
- Key: `var key = ld("usdaKey", "DEMO_KEY")` at **L19032** — value **[REDACTED]** in this report; see the security note below.
- Request: `GET https://api.nal.usda.gov/fdc/v1/foods/search?query=<gtin>&api_key=<key>&dataType=Branded&pageSize=3` (L19033). The API key travels in the **query string**.
- Ranking: prefer the first food whose `normalizeGTIN(gtinUpc)` equals the requested GTIN; **fall back to `foods[0]` regardless of barcode** (L19039–19042). This is the merge/rank rule and it is unsafe — a text search for a numeric string can return an unrelated product that is then presented as the scanned item.
- Response fields read, from `food.foodNutrients[].nutrientId` (L19050–19061): 1008 → cal, 1003 → pro, 1005 → carb, 1004 → fat, 1079 → fiber, 2000 → sugar, 1258 → satfat, 1093 → sodium. Plus `description` (fallback `"Product <gtin>"`), `brandOwner || brandName`, `servingSize`.
- Rejected when `per100.cal` is falsy (L19052). Success → cached, `src:"usda"`.
- **USDA values are treated as per-100g but the API returns per-100g only for `Branded` foods' `labelNutrients`-independent `foodNutrients`; `servingSize` is taken as grams without checking `servingSizeUnit`** — UNVERIFIED, see open questions.

**Error handling:** both `fetch` chains end in `.catch(function(){ return null; })` (L19070, L19073). Nothing distinguishes offline, a 404, a 429 rate-limit, or malformed JSON — all four surface identically as the "Not found — add it yourself" screen (L21335–21360), whose copy asserts the barcode "isn't in any database yet".

**Unused mapping:** `FDC_NUT_IDS` (L18716–18730) maps 13 FDC nutrient ids — including magnesium 1090, zinc 1095, vitc 1162, vitd 1114, b12 1178, folate 1177 — to internal keys, but `lookupBarcode` hardcodes only 8 of them inline (L19050–19061) and never references the table. `FDC_NUT_IDS` occurs once in the file: dead, and its existence shows the richer mapping was intended.

**Third-party script:** ZXing 0.21.3 is fetched from `https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js` with no integrity attribute (L19082).

### Security findings
1. **`usdaKey` — hardcoded fallback secret in client code.** Variable `usdaKey`, read at **L19032** as `ld("usdaKey", "DEMO_KEY")`; value **[REDACTED]**. Any real key a user or the build places in `lk_usdaKey` is (a) stored in plain `localStorage`, (b) transmitted in a URL query string where it lands in proxy and server logs and in the browser's referrer/history, and (c) trivially readable by anyone with devtools access or via `exportEverything()` (L19436–19453), which dumps every `lk_` key into a shareable JSON file. There is no UI in my range that sets this key — UNVERIFIED where it is written.
2. **Unpinned-integrity third-party script from unpkg** (L19082) executes in the app's origin with full access to all `lk_*` health data.
3. **`exportEverything()` produces an unencrypted, unredacted dump of every `lk_` key** (L19436–19453), including `fuelProfile` (weight, height, age, sex), `mcProfile`/`mcDays` (reproductive health), and any stored API key. It is handed to a plain file download (L19415–19435).
4. **Barcode GTINs are sent to two third parties** (OpenFoodFacts, USDA) with no consent prompt and no mention in `PrivacyCard`, whose "AI features" row lists server-bound data but omits barcode lookups entirely (L21746).

---

## Storage keys touched

All access goes through `ld(key, fallback)` / `sd(key, value)` (L2417 / L2435), which prefix `lk_`.

| Key | Read at | Written at |
|---|---|---|
| `fuelSettings` | 18650, 21760, 36899 | 18658 |
| `fuelProfile` | 19260, 19402, 19697, 21766 | 19297 |
| `fuelLog` | 19271, 19378, 19403 | *(written by `FuelTab.setFuelLog`, L36923)* |
| `tdeeHistory` | 19263, 19412, 21753 | 19288 |
| `favFoods` | 18912 | 18933 |
| `myGroceries` | 19006, 19638, 20303 | 21014, 21043 |
| `barcodeCache` | 18967 | 18973 |
| `usdaKey` | **19032** (default `"DEMO_KEY"` — [REDACTED]) | — (not written in my range) |
| `userRecipes` | 19960, 19406 | 19963 |
| `supplements` | 19407 | — |
| `mealPlans` | 19411 | — |
| `refeedAccepted` | *(36920, outside range)* | — |
| `mcProfile` | 21935 | 21938 |
| `mcDays` | 21941 | 21944 |
| `profile` | 21948 | — |
| every `lk_*`, `__lk_ts__*`, `__lk_last_sync__` | 19440–19444 (`exportEverything`) | 19483, 19496 (`importEverything`) |

Non-`lk_` globals: `window.ZXing` (L19077), `window.BarcodeDetector` (L20948), and the custom window event **`lockedFuelUpdate`**, dispatched by `setFuelSettings` (L18659), `toggleFav` (L18934) and `saveUserRecipes` (L19964).

Weight data is read via `getWeightLog()` (L2908, outside range) rather than a direct key.

---

## Open questions / UNVERIFIED

1. **Why are nine components/helpers dead?** `DayNutritionPanel`, `RecipeLogSheet`, `RecipeBuilder`, `QuickChip`, plus `parseFoodText`/`matchTuples`/`normalizeAiItems`/`getRecentFoods`/`getFrequentFoods`/`calcTDEEInfo`/`exportFuelJSON`/`weeklyRatePct`/`avgIntake`/`depletePantry`/`waterGoal`/`isFav`/`nextSlot`/`isTrainingDayToday`/`cloneFoodItem`/`nameSimilarity`/`FDC_NUT_IDS` each occur exactly once in the file. Confirm with `rg -c '\bDayNutritionPanel\b' redesign/input/locked-current-v6.html` (returns 1). It is possible a newer `FuelTab` (L36895+) reimplemented all of this inline — Agent covering L36895+ should confirm whether equivalent UI exists there, and whether the redesign should restore these or delete them.
2. **`calcTDEEInfo` is dead, yet `profile.tdee` is read in three places** (L19281, L19698, L21815). Where is `fuelProfile.tdee` first written? Confirm with `rg -n 'tdee:' redesign/input/locked-current-v6.html`. If onboarding computes TDEE inline rather than calling `calcTDEEInfo`, the two formulas may have drifted.
3. **`aiCall` model, endpoint and prompt transport** (L2663) are outside my range, so F-FUEL-016's AI section names only the prompt location (L19587) and not the model. Confirm by reading L2663–2760.
4. **USDA `servingSize` units.** `parseFloat(f.servingSize)` (L19063) is used as grams with no check on `servingSizeUnit`; a millilitre or ounce serving would be mis-scaled. Confirm by scanning a beverage barcode absent from OFF and inspecting the `servingG` used.
5. **USDA per-100g basis.** The code assumes `foodNutrients[].value` on a Branded food is per 100 g (L19045–19052). Confirm against a known product against its label.
6. **`pantryUseSoon` / `pantryBestPrice` / `pantryLastPriceFor` call sites** were not counted whole-file. Confirm with `rg -c 'pantryUseSoon|pantryBestPrice|pantryLastPriceFor'`.
7. **Does the restore button at L33200 catch `importEverything`'s throw?** The throw path is L19457. Confirm by reading L33190–33215 (outside my range).
8. **Where is `lk_usdaKey` written?** No writer exists in my range. Confirm with `rg -n 'usdaKey' redesign/input/locked-current-v6.html` — if there is no writer at all, every user is permanently on the shared `DEMO_KEY` and USDA fallback will rate-limit at 30 requests/hour per IP.
9. **`FuelTab.addItem` shape.** The exact item written to `fuelLog` is assembled by `addItem` in `FuelTab` (outside my range). My model section describes what my components *pass in*; confirm `addItem` does not further reshape it, at L37440 and its definition.
10. **`lockedFuelUpdate` listeners.** Three functions in my range dispatch it; no listener exists in my range. Confirm with `rg -n 'lockedFuelUpdate'` — if nothing listens, favourite and recipe writes will not refresh open screens.
