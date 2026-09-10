# Agent 3b — Fuel (main tab, water, meal plan)

Audited file: `redesign/input/locked-current-v6.html`
Exclusive range: **35763–38553**
Components in range: `MacroRing` (35763–35792), `FuelProfileSetup` (35794–36537), `WaterCard` (36538–36670), `SmartNutritionCard` (36671–36894), `FuelTab` (36895–37468), `MealPlanFuelTab` (37469–38547). `ListTab` begins at 38548 (owned by another agent).

All file references below are `redesign/input/locked-current-v6.html:<line>` unless another path is given.

---

## PART A — Features

### F-FUEL-200 Fuel tab shell / header
- Location: Fuel tab > main view > header block
- User action: Selects the Fuel tab in the app nav; sees the "FUEL" title with two header buttons.
- Behavior:
  1. `FuelTab` reads fuel settings via `getFuelSettings()` (36899) and derives `hideNums` (36900) and `eatenFraming` (36904).
  2. Renders a gradient header band, `padding: "52px 20px 16px"` with `linear-gradient(180deg,OR_H+"18" 0%,transparent 100%)` (37078–37082).
  3. `h1` "FUEL" at `fontSize: "2rem"`, weight 800 (37090–37096).
  4. Right side: "Shop" button (aria-label "Shopping and budget") and "My Profile" button (aria-label "Fuel profile and targets") (37103–37160).
  5. Body wrapper has `paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))"` with a code comment explaining the floating voice button used to cover the Smart Nutrition dismiss X (37069–37077).
- Components: FuelTab (36895–37468)
- Functions: `getFuelSettings` (18649–18655, out of range)
- State: `fuelSet`, `hideNums`, `eatenFraming` (36899–36904); `tab`, `view` via `useHubState` (36905–36906)
- Storage: reads `fuelSettings` (18650)
- Network: none
- AI: none
- Edge cases: `getFuelSettings()` may return null-ish → `|| {}` guard (36899).
- Gating: always on
- Status: WORKING
- Evidence for status: 37090 header renders unconditionally inside the main view return.
- Notes: The two comment blocks at 36896–36903 and 37136–37139 are developer commentary retained in production output.

### F-FUEL-201 Fuel sub-tab navigation (Log / Meals toggle + pill row)
- Location: Fuel tab > main view > tab strip below the macro card
- User action: Taps "Log" or "Meals" segmented buttons; then taps a pill (List / Search / Scan / Photo / Trends / Supps / Stack) or (Meal Plans / Recipes).
- Behavior:
  1. An IIFE renders the whole strip (37388–37468... actually 37388 onward; strip IIFE at 37388–37462).
  2. `outerMeals = tab === "plan" || tab === "recipes"` (37389).
  3. `logTabs` array is `[["list","List"],["search","Search"],["scan","Scan"],["photo","Photo"],["trends","Trends"],["supps","Supps"]]` (37390).
  4. If `ld("perfTracking", false)` is truthy, `["cycle","Stack"]` is appended (37391).
  5. Top segmented control: "Log" button sets `tab` to `"list"` only when currently in the meals group (37400–37419); "Meals" button sets `tab` to `"plan"` only when not already in the meals group (37420–37437).
  6. When not in the meals group, a horizontally scrollable pill row renders `logTabs` (37438–37448 region; `overflowX: "auto"` at 37440).
  7. When in the meals group, a two-button row renders `[["plan","Meal Plans"],["recipes","Recipes"]]` (37449–37461).
  8. Content area `padding: "12px 20px"` routes on `tab` (37463–37468 region, routing block 37464 onward).
- Components: FuelTab (36895–37468)
- Functions: `useHubState` (2121–2138)
- State: `tab` (`useHubState("fuelTab","list",["list","search","scan","photo","trends","recipes","supps","plan","cycle"])`, 36905); `view` (`useHubState("fuelView","main")`, 36906)
- Storage: reads/writes `ui_fuelTab` and `ui_fuelView` via `useHubState` → `ld`/`sd` with `"ui_" + key` prefix (2123, 2134); reads `perfTracking` (37391)
- Network: none
- AI: none
- Edge cases: `useHubState`'s `allowed` list resets an out-of-range persisted tab to `"list"` (2126–2128). Note the allowed list includes `"cycle"` even when `perfTracking` is off — see Open questions.
- Gating: "Stack" (cycle) pill gated on `perfTracking` localStorage flag (37391); everything else always on.
- Status: WORKING
- Evidence for status: 37391 conditional push and 37464+ routing both present and reachable.
- Notes: A persisted `tab === "cycle"` survives `useHubState` validation even with `perfTracking` off, since `"cycle"` is in the allowed array (36905) — the pill disappears but `CycleTab` still renders (37467 region).

### F-FUEL-202 Calorie / macro summary card (MacroRing + macro bars)
- Location: Fuel tab > main view > summary card directly under header
- User action: Passive; the card reflects everything logged today.
- Behavior:
  1. `getDay()` returns `fuelLog[todayISO]` or a default `{meals:{breakfast:[],lunch:[],dinner:[],snacks:[]},water:0}` (36932–36942).
  2. All items across the four meal keys are flattened into `allItems` (36959–36966).
  3. `totalCal`, `totalPro`, `totalCarb`, `totalFat` are reduced sums with `|| 0` per field (36967–36978).
  4. `MacroRing` renders at `size: 90, stroke: 9, color: OR, pct: totalCal / targets.cal` (37170–37175).
  5. Centre label: if `hideNums`, shows "Over" (color `WA`) when `totalCal > targets.cal` else "On track" (color `GR`) (37185–37197); otherwise `fmtCal(totalCal)` with `/targets.cal` subscript (37198–37211) and a caption "kcal eaten" or "kcal" depending on `eatenFraming` (37212–37218).
  6. Three macro rows — Protein (`BLU`), Carbs (`WA`), Fat (`FAT`) — each with label, value/target, a 5px progress bar clamped at 100%, and a "Ng left" / "Ng eaten" line (37219–37320 region).
  7. `hideNums` swaps each macro value for "Over"/"On track" (37270–37274) and suppresses the `/target` suffix and the left/eaten line.
- Components: MacroRing (35763–35792), FuelTab (36895–37468)
- Functions: `getDay` (36932–36942), `fmtCal` (4355), `fmtQ` (4349)
- State: `fuelLog`, derived `day`, `allItems`, totals, `targets`
- Storage: reads `fuelLog` (36910)
- Network: none
- AI: none
- Edge cases: If `targets.cal` were 0, `pct` is Infinity → `Math.min(pct,1)` in MacroRing clamps it (35768).
- Gating: always on
- Status: WORKING *(corrected in Wave 3 — was BROKEN)*
- **Wave 3 correction:** the original BROKEN status cited 37270/37287, which are
  CSS style properties, not the logic described. The real code is at 37275/37281.
  The posited NaN cannot occur: `fmtQ` (4349-4354) returns `String(r)` or `""`,
  never `"NaN"`. Reclassified WORKING with a code smell. See WAVE3_VERIFICATION.md.
- Evidence for status: 37270 compares `m.val > m.target` where `m.val` is `fmtQ(totalPro)` — a formatted **string** (37223, 37228, 37233), so the hide-numbers "Over"/"On track" comparison and the `Math.min(m.val / m.target, 1)` bar width (37287) both rely on string→number coercion; `fmtQ` output containing a non-numeric suffix would yield NaN.
- Notes: Verify `fmtQ` (4349–4354) return type. Bar-width math `m.val / m.target` at 37287 uses the same possibly-string value. The hide-numbers and framing settings were previously dead per the code comments at 36896–36903; they are now read here.

### F-FUEL-203 MacroRing SVG progress ring
- Location: reusable — Fuel summary card (and any caller)
- User action: none (visual)
- Behavior:
  1. `size` defaults 120, `stroke` defaults 10 (35764–35765).
  2. Radius `(size - stroke) / 2`; circumference uses a hardcoded `3.14159` rather than `Math.PI` (35766–35767).
  3. `pct` clamped to max 1 (35768).
  4. `strokeDasharray` built as `pct*circ + " " + (circ - pct*circ)` (35769).
  5. Two concentric circles: track stroked `SU`, progress stroked `p.color || OR` with `strokeLinecap: "round"` (35777–35791).
  6. Whole `svg` rotated `-90deg` so the arc starts at 12 o'clock (35773–35775).
- Components: MacroRing (35763–35792)
- Functions: MacroRing (35763–35792)
- State: none (pure)
- Storage: none
- Network: none
- AI: none
- Edge cases: negative `pct` is not clamped at the low end (35768) → a negative dasharray. No `viewBox`, so the SVG does not scale responsively.
- Gating: always on
- Status: WORKING
- Evidence for status: 35770–35791 returns a complete SVG on every call.
- Notes: hardcoded `3.14159` (35767); no low-end clamp; no `viewBox`.

### F-FUEL-204 Fuel Profile Setup — open / back / save
- Location: Fuel tab > header "My Profile" button > full-screen Fuel Profile screen
- User action: Taps "My Profile" (37136–37160); fills the form; taps "SAVE PROFILE"; or taps Back.
- Behavior:
  1. Tapping "My Profile" calls `setView("profile")` (37142–37144).
  2. `FuelTab` short-circuits its render: `if (view === "profile") return React.createElement(FuelProfileSetup, {...})` (37058–37066).
  3. `FuelProfileSetup` seeds every field from `p.fuelProfile` with fallbacks (35795–35816).
  4. Header: 52px top padding, Back `Ic` button (aria-label "Back"), title "Fuel Profile" 1.625rem/800, subtitle "Your stats power calorie and macro targets." (35917–35979).
  5. `save()` (35829–35887) converts to metric, computes TDEE/macros and calls `p.onSave(prof)`.
  6. `onSave` in FuelTab calls `setFuelProfile(prof)` (which writes localStorage) and `setView("main")` (37061–37065).
  7. Back button calls `p.onBack` → `setView("main")` (37059–37061).
- Components: FuelProfileSetup (35794–36537)
- Functions: `save` (35829–35887), `togglePref` (35817–35828), `calcTDEE` (35728–35751), `calcMacros` (35752–35762), `setFuelProfile` (36925–36928)
- State: 17 local `useState` hooks (35795–35816)
- Storage: writes `fuelProfile` via `sd` in `setFuelProfile` (36927)
- Network: none
- AI: none
- Edge cases: No validation before save — empty weight yields `parseFloat("") = NaN`, `Math.round(NaN*10)/10 = NaN` stored as `weightKg` (35830, 35838). `calcTDEE` then falls back to 2200 because `!profile.weightKg` is false for NaN — actually NaN is falsy, so the guard at 35729 catches it and returns 2200. See Open questions.
- Gating: always on
- Status: WORKING
- Evidence for status: 36525–36536 the SAVE PROFILE button wires `onClick: save`.
- Notes: The `view` state is persisted (`ui_fuelView`, 36906), so a user who left the app on the profile screen re-enters on it; `useTabReset("fuel", ...)` resets `view` to `"main"` and `tab` to `"list"` on a tab re-tap (36908).

### F-FUEL-205 Fuel Profile — body weight input + unit toggle
- Location: Fuel Profile screen > BODY WEIGHT section
- User action: Taps LBS/KG; types a weight.
- Behavior:
  1. Two toggle buttons rendered from `["lbs","kg"]`, active one bordered/tinted `OR` (35997–36020).
  2. Numeric input, `inputMode: "decimal"`, `type: "number"`, `step: "0.01"`, placeholder "e.g. 185" (lbs) or "e.g. 84" (kg) (36021–36041).
  3. Border turns `OR` once a value is present (36032).
  4. On save: `kg = weightUnit === "kg" ? parseFloat(weightVal) : parseFloat(weightVal) / 2.20462` (35830).
- Components: FuelProfileSetup (35794–36537)
- Functions: `save` (35829)
- State: `weightVal`, `weightUnit` (35796–35797)
- Storage: persisted inside `fuelProfile` as `weightVal`, `weightUnit`, `weightKg` (35832–35839)
- Network / AI: none
- Edge cases: switching unit does not convert the entered number — the raw value is reinterpreted under the new unit (35997–36013 has no conversion side effect).
- Gating: always on
- Status: PARTIAL
- Evidence for status: 36003–36005 the unit button only calls `setWeightUnit(u)`; no value conversion.
- Notes: Unit-switch data loss is a real bug for the redesign to fix.

### F-FUEL-206 Fuel Profile — height input (ft/in or cm)
- Location: Fuel Profile screen > HEIGHT section
- User action: Taps ft/cm; types feet+inches or centimetres.
- Behavior:
  1. Toggle from `["ft","cm"]` (36055–36078).
  2. `ft` mode renders two numeric inputs with literal "ft" and "in" separators, placeholders "5" and "10" (36079–36150).
  3. `cm` mode renders one numeric input, placeholder "e.g. 178" (36151–36174).
  4. On save: `cm = heightUnit === "cm" ? parseFloat(heightCm) : (parseInt(heightFt)||0)*30.48 + (parseInt(heightIn)||0)*2.54` (35831).
  5. Stored as `heightFt`, `heightIn`, `heightCmRaw`, `heightUnit`, and rounded `heightCm` (35834–35840).
- Components: FuelProfileSetup (35794–36537)
- Functions: `save` (35829)
- State: `heightFt`, `heightIn`, `heightCm`, `heightUnit` (35798–35801)
- Storage: `fuelProfile` fields above
- Network / AI: none
- Edge cases: In cm mode with an empty field, `parseFloat("")` → NaN → `heightCm: NaN` (35840). Ft/in inputs never turn the accent border on (36094, 36130 use plain `BORD`), unlike weight.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 35840 `Math.round(cm)` with no NaN guard.
- Notes: Note the odd key name mismatch: the raw cm string is stored as `heightCmRaw` while the seed reads `fp.heightCm` (35799) — so re-opening the profile in cm mode shows the **rounded computed** cm, not the raw entry. Minor but real (35799 vs 35835).

### F-FUEL-207 Fuel Profile — age and sex
- Location: Fuel Profile screen > AGE / SEX row
- User action: Types an age; taps Male or Female.
- Behavior:
  1. Side-by-side flex row, gap 16 (36175–36180).
  2. AGE numeric input, `step: "1"`, placeholder "25" (36191–36211).
  3. SEX two buttons from `["male","female"]`, labels "Male"/"Female", active bordered 1.5px `OR` (36225–36253).
  4. Both feed the Mifflin/Harris-Benedict branch in `calcTDEE` (35733–35737).
- Components: FuelProfileSetup (35794–36537)
- State: `age`, `sex` (35802–35803; `sex` defaults `"male"`)
- Storage: `fuelProfile.age`, `fuelProfile.sex` (35841–35842)
- Network / AI: none
- Edge cases: only two sex options; no "prefer not to say".
- Gating: always on
- Status: WORKING
- Evidence for status: 36244 the button sets `sex` and the active style follows.
- Notes: Default `"male"` is applied silently even if the user never touches the control (35803).

### F-FUEL-208 Fuel Profile — activity level picker
- Location: Fuel Profile screen > ACTIVITY LEVEL
- User action: Taps one of five radio rows (or activates via keyboard).
- Behavior:
  1. Options defined at 35888–35907: `sedentary` "Sedentary / Desk job, little exercise"; `light` "Light / Exercise 1-3 days/week"; `moderate` "Moderate / Exercise 3-5 days/week"; `active` "Active / Hard exercise 6-7 days"; `very` "Very Active / Hard exercise + physical job".
  2. Each row is a `div role="button" tabIndex=0 onKeyDown={lkKeyActivate}` with a custom radio dot (36266–36335).
  3. Selected row tints background `OR_H+"15"` and borders `OR` (36277–36282).
  4. Feeds the multiplier table in `calcTDEE`: 1.2 / 1.375 / 1.55 / 1.725 / 1.9 (35739–35746).
- Components: FuelProfileSetup (35794–36537)
- State: `activity` (35804, default `"moderate"`)
- Storage: `fuelProfile.activityLevel` (35843)
- Network / AI: none
- Edge cases: unknown value falls back to 1.55 in `calcTDEE` (35746).
- Gating: always on
- Status: WORKING
- Evidence for status: 36273 onClick sets activity; 35746 consumes it.

### F-FUEL-209 Fuel Profile — goal picker (Cut / Maintain / Bulk)
- Location: Fuel Profile screen > GOAL
- User action: Taps one of three equal-width cards.
- Behavior:
  1. Options at 35908–35916: `cut` "Cut / Lose body fat"; `maintain` "Maintain / Keep current weight"; `bulk` "Bulk / Build mass".
  2. Cards are `div role="button" tabIndex=0 onKeyDown={lkKeyActivate}`, `flex: 1`, 1.0625rem/800 label (36336–36376 region).
  3. Goal multiplies TDEE: cut ×0.8, bulk ×1.1, maintain ×1.0 (35747–35749).
  4. Goal also sets protein per kg in `calcMacros`: cut 2.4, bulk 2.0, else 2.2 g/kg (35754).
  5. Goal `"cut"` is the precondition for the refeed trigger (2937).
- Components: FuelProfileSetup (35794–36537)
- State: `goal` (35805, default `"maintain"`)
- Storage: `fuelProfile.goal` (35844)
- Network / AI: none
- Edge cases: none beyond defaults.
- Gating: always on
- Status: WORKING
- Evidence for status: 36348 onClick sets goal; 35747 and 35754 consume it.

### F-FUEL-210 Fuel Profile — Auto vs Custom macros
- Location: Fuel Profile screen > MACROS section
- User action: Taps "Auto" or "Custom"; in Custom, types Calories / Protein / Carbs / Fat.
- Behavior:
  1. Segmented toggle built from `[{id:false,label:"Auto"},{id:true,label:"Custom"}]` (36336–36358 region; the option array at 36337–36343).
  2. Auto mode shows the copy "Targets calculated automatically from your stats and goal." (36433–36438).
  3. Custom mode renders four labelled numeric rows: Calories (kcal, "e.g. 2400"), Protein (g, "e.g. 180"), Carbs (g, "e.g. 250"), Fat (g, "e.g. 70") (36359–36432).
  4. On save, `tdee = calcTDEE(prof)` and `macros = calcMacros(tdee, kg, goal)` are always computed first (35852–35853).
  5. If `useCustomMacros && customCal`, the four custom values override with per-field `parseInt(...) || <auto value>` fallbacks (35859–35864); otherwise auto values are used (35865–35870).
- Components: FuelProfileSetup (35794–36537)
- Functions: `save` (35829–35887), `calcTDEE` (35728), `calcMacros` (35752)
- State: `useCustomMacros`, `customCal`, `customPro`, `customCarb`, `customFat` (35810–35815)
- Storage: `fuelProfile.useCustomMacros/customCal/customPro/customCarb/customFat` plus resolved `tdee`, `macroProtein`, `macroCarbs`, `macroFat` (35854–35870)
- Network / AI: none
- Edge cases: Custom mode with an empty Calories field silently falls back to the whole auto set — the `&& customCal` guard at 35859 gates all four overrides, not just calories.
- Gating: always on
- Status: WORKING
- Evidence for status: 35859–35870 both branches assign all four targets.
- Notes: `useCustomMacros: true` also **disables adaptive TDEE** entirely (`applyAdaptiveTDEE` returns null at 19262) — an interaction the redesign should surface to the user, since nothing in this UI says so.

### F-FUEL-211 Fuel Profile — dietary preferences chips
- Location: Fuel Profile screen > DIETARY PREFERENCES
- User action: Taps any of six pill chips to toggle.
- Behavior:
  1. Options at 35917–35934 (`prefOpts`): `high-protein` "High Protein", `vegetarian` "Vegetarian", `vegan` "Vegan", `no-dairy` "No Dairy", `gluten-free` "Gluten Free", `low-carb` "Low Carb".
  2. Chips wrap (`flexWrap: "wrap"`, gap 8), radius 20 (36444–36476 region).
  3. `togglePref(id)` does a manual linear scan for membership then filters or concats (35817–35828).
- Components: FuelProfileSetup (35794–36537)
- Functions: `togglePref` (35817–35828)
- State: `prefs` (35806)
- Storage: `fuelProfile.preferences` (35845)
- Network / AI: none
- Edge cases: none; empty array is valid.
- Gating: always on
- Status: WORKING
- Evidence for status: 36464 chip onClick calls `togglePref`.
- Notes: `preferences` is stored but **not** read by `MealPlanFuelTab`'s `buildMealContext` (37583–37604), which uses the free-text `dietPref` field instead. Likely dead data for meal planning — see Open questions.

### F-FUEL-212 Fuel Profile — allergies and fridge/pantry
- Location: Fuel Profile screen > ALLERGIES / INTOLERANCES and FRIDGE / PANTRY STAPLES
- User action: Types free text in an input and a 3-row textarea.
- Behavior:
  1. Allergies text input, placeholder "e.g. nuts, shellfish, gluten..." (36477–36499).
  2. Fridge section carries helper copy "What do you usually have on hand? Used for meal suggestions." (36500–36510).
  3. Fridge `textarea`, `rows: 3`, `resize: "none"`, placeholder "e.g. chicken breast, rice, eggs, broccoli, olive oil..." (36511–36524).
- Components: FuelProfileSetup (35794–36537)
- State: `allergies`, `fridge` (35807–35808)
- Storage: `fuelProfile.allergies`, `fuelProfile.fridge` (35846–35847)
- Network / AI: none
- Edge cases: no length limit; no parsing.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 36510 promises "Used for meal suggestions" but neither `SmartNutritionCard.suggest` (36699–36707) nor `buildMealContext` (37583–37604) reads `allergies` or `fridge`.
- Notes: **High-value finding.** Two fields the user is explicitly told feed suggestions are never sent to any AI call in this range. Allergy data being ignored by a meal-suggestion AI is a safety concern.

### F-FUEL-213 Water tracking card
- Location: Fuel tab > main view > water card under the macro summary
- User action: Taps the ml/fl oz chip; taps +250/+500 (or +8/+16); taps "−" to remove one glass.
- Behavior:
  1. `WaterCard` gets `waterMl`, `addWater`, `setDay` from FuelTab (37321–37325).
  2. Goal is **hardcoded** `var goal = 3000;` (36541).
  3. `display` and `goalDisplay` convert by `/29.574` when `useOz` (36542–36543); unit label "fl oz" or "ml" (36544).
  4. `addAmts` is `[8,16]` in oz mode, `[250,500]` in ml mode (36545).
  5. `add(amt)` converts oz→ml with `Math.round(amt*29.574)` then calls `p.addWater(ml)` (36546–36549).
  6. `minus()` calls `p.setDay` directly, subtracting 250 ml (or 8 oz ≈ 237 ml) clamped at 0 (36550–36557).
  7. Progress bar `pct = Math.min(waterMl/goal, 1)`, 5px, colour `BLU` (36558; bar at 36620–36636).
  8. The "−" button (aria-label "Remove one glass") renders only when `waterMl > 0` (36654–36669).
- Components: WaterCard (36538–36670)
- Functions: `add` (36546–36549), `minus` (36550–36557), `addWater` (37026–37032), `setDay` (36943–36958)
- State: `useOz` local (36539); `day.water` in `fuelLog`
- Storage: writes `fuelLog` (via `setFuelLog` → `sd("fuelLog", n)`, 36921)
- Network / AI: none
- Edge cases: `waterMl` defaults 0 (36540); `minus` clamps at 0 (36555).
- Gating: always on
- Status: PARTIAL
- Evidence for status: 36541 hardcodes `goal = 3000` while `getFuelSettings()` exposes a `waterGoalMl` setting (18651) that this card never reads.
- Notes: `useOz` is component-local and **not persisted** — it resets to ml on every remount (36539). The oz "−" removes 236.6 ml while the ml "−" removes 250 ml, so unit choice silently changes the decrement (36552).

### F-FUEL-214 Smart Nutrition suggestion card
- Location: Fuel tab > Log > List sub-tab only > card rendered after ListTab
- User action: Taps "Suggest" (then "New"), taps "Add to today's log", or taps "×" to dismiss.
- Behavior:
  1. Rendered only when `tab === "list"` (37460–37468 region; the `tab === "list" && React.createElement(SmartNutritionCard, ...)` call).
  2. `dismissed` short-circuits to `null` before any hooks-dependent render — but *after* the four `useState` calls (36672–36676).
  3. `calLeft = p.targets.cal - p.totalCal`; `proLeft = p.targets.pro - p.totalPro` (36677–36678).
  4. Header shows a location-pin icon path, "SMART NUTRITION", and either "N cal remaining today" or "Target reached — great work" (36753–36790).
  5. "Suggest"/"New" button calls `suggest()` (36791–36808); disabled and shown as "..." while loading.
  6. `suggest()` POSTs to the Cloudflare Worker (see AI calls #1, 36679–36730).
  7. On success the suggestion card shows name, four macro tiles (cal/protein/carbs/fat in `EMD`/`OR`/`BLU`/`WA`), the `reason` sentence, and an "Add to today's log" button (36827–36893).
  8. `addMeal()` calls `p.addItem("snacks", {...})` with rounded macros and flips `added` to true, changing the button to "✓ Added to log" (36731–36741).
- Components: SmartNutritionCard (36671–36894)
- Functions: `suggest` (36679–36730), `addMeal` (36731–36741), `addItem` (37033–37041)
- State: `suggestion`, `loading`, `added`, `dismissed` (36672–36675)
- Storage: writes `fuelLog` indirectly via `addItem` (36921)
- Network: `POST https://lockedapi.cescocugliari.workers.dev/` — see AI calls #1
- AI: yes — see AI calls #1
- Edge cases: parse failure falls back to a `/\{[\s\S]*?\}/` regex extract (36716–36724); double failure leaves `suggestion` null with **no error message shown** (36722, empty catch). `.catch` only clears `loading` (36727–36729) — a network failure is silent. Dismissal is per-mount, not persisted.
- Gating: always on, but only on the List sub-tab.
- Status: PARTIAL
- Evidence for status: 36727–36729 network errors produce no user-visible feedback.
- Notes: `if (dismissed) return null;` at 36676 sits after four `useState` calls — legal, but any future hook added below it would violate the rules of hooks. Dietary `preferences`/`allergies` from the fuel profile are **not** included in the prompt (36699–36707) — see F-FUEL-212.

### F-FUEL-215 Fuel log data model + per-day totals
- Location: Fuel tab > (data layer behind every sub-tab)
- User action: Any food add/remove from any sub-tab.
- Behavior:
  1. `fuelLog` is loaded once from localStorage `ld("fuelLog", {})` (36909–36911).
  2. `setFuelLog(fn)` accepts value or updater, writes `sd("fuelLog", n)` synchronously inside the state updater, and returns the new state (36917–36924).
  3. `todayISO = isoDay()` keys the day (36907).
  4. `setDay(fn)` reads/creates today's entry and copies the outer map immutably (36943–36958).
  5. `addItem(meal, item)` appends to `meals[meal]` (37033–37041); `removeItem(meal, idx)` filters by index (37042–37052).
  6. A `lockedFuelUpdate` window event listener re-reads `fuelLog` from storage — the hook for the voice-logging path (37004–37013).
- Components: FuelTab (36895–37468)
- Functions: `setFuelLog` (36917–36924), `setFuelProfile` (36925–36928), `getDay` (36932–36942), `setDay` (36943–36958), `addItem` (37033–37041), `removeItem` (37042–37052), `addWater` (37026–37032)
- State: `fuelLog`, `fuelProfile`, `weightLog`
- Storage: reads/writes `fuelLog`, `fuelProfile`; reads `weightLog` via `getWeightLog()` (36912–36914)
- Network / AI: none
- Edge cases: writing to localStorage inside a React state updater (36921) makes the updater impure — under React 18 StrictMode double-invocation this would double-write (idempotent here, but fragile).
- Gating: always on
- Status: WORKING
- Evidence for status: 36921 `sd` call inside `setFuelLogRaw` persists every mutation.
- Notes: The default day shape is duplicated verbatim in `getDay` (36933–36941) and `setDay` (36945–36953).

### F-FUEL-216 Adaptive TDEE application on tab mount
- Location: Fuel tab > main view (invisible; effect on mount)
- User action: none — runs when the Fuel tab mounts.
- Behavior:
  1. `useEffect(..., [])` calls `applyAdaptiveTDEE()` inside a try/catch that swallows all errors (36979–36983).
  2. `applyAdaptiveTDEE` (19259–19299, out of range) bails if there is no profile, if `useCustomMacros` is set, or if the last `tdeeHistory` entry is ≤6 days old (19260–19267).
  3. Otherwise it reconciles observed TDEE, blends `0.7*current + 0.3*observed`, clamps the step to ±150 kcal, applies a calorie floor, recomputes macros and writes `fuelProfile` (19272–19296).
  4. FuelTab then reads `fuelProfile.adaptiveTDEE || fuelProfile.tdee || 2200` for its calorie target (36984–36990).
- Components: FuelTab (36895–37468)
- Functions: `applyAdaptiveTDEE` (19259), `calcMacros` (35752)
- State: `fuelProfile` (stale in this render — see below)
- Storage: reads/writes `fuelProfile`, reads/writes `tdeeHistory`, reads `fuelLog`, `weightLog` (19263, 19288, 19294)
- Network / AI: none
- Edge cases: the try/catch (36980–36982) discards every error silently.
- Gating: always on (implicitly off when `useCustomMacros` is true, 19262)
- Status: PARTIAL
- Evidence for status: 36979–36983 the effect runs but its result is discarded — `fuelProfile` React state was already initialised at 36912 from the pre-update localStorage value, so a newly-applied adaptive TDEE only takes effect on the **next** mount.
- Notes: One-render-stale adaptive targets is a concrete, user-visible bug.

### F-FUEL-217 Refeed day prompt and active banner
- Location: Fuel tab > main view > below the TDEE report card
- User action: Taps Accept or Dismiss on the refeed card; or logs a weight that triggers it.
- Behavior:
  1. `refeedActive` initialises to `ld("refeedAccepted", null) === isoDay()` (36918–36920 region; 36916–36920).
  2. `refeedTriggered = checkRefeedTrigger(weightLog, fuelProfile)` (36991).
  3. `refeedCarbs = fuelProfile ? calcRefeedCarbs(fuelProfile) : 75` (36992).
  4. When `refeedActive`, targets are boosted: `carb + refeedCarbs`, `cal + refeedCarbs * 4` (36993–36999).
  5. A mount effect sets `showRefeed` when `refeedTriggered && !refeedActive` (37000–37003).
  6. `RefeedCard` (53210, out of range) renders when `showRefeed && !refeedActive` (37333–37342).
  7. `acceptRefeed()` writes `refeedAccepted = todayISO`, sets `refeedActive`, hides the card and logs beta activity `"refeed_accepted"` with `{extraCarbs}` (37014–37021).
  8. `dismissRefeed()` writes `refeedDismissed = new Date().toISOString()` and logs `"refeed_dismissed"` (37022–37025).
  9. When active, an inline banner shows a bolt icon and "Refeed day active — carbs boosted by +Ng today" (37343–37370).
  10. Trigger logic (2936–2965): requires `goal === "cut"`, ≥3 weight entries, no dismissal in the last 5 days, not already accepted today, and three consecutive new lows.
- Components: FuelTab (36895–37468), RefeedCard (53210, out of range)
- Functions: `acceptRefeed` (37014–37021), `dismissRefeed` (37022–37025), `checkRefeedTrigger` (2936–2965), `calcRefeedCarbs` (2966–2974)
- State: `showRefeed`, `refeedActive`, `refeedCarbs`, `targets`
- Storage: reads/writes `refeedAccepted`, `refeedDismissed`; reads `weightLog`
- Network: `logBetaActivity` (out of range) — endpoint not audited here
- AI: none
- Edge cases: `calcRefeedCarbs` defaults tdee 2200 / weight 80 kg; tiers 50/75/100 g plus +15 g over 90 kg (2967–2973).
- Gating: effectively gated on `goal === "cut"` (2937)
- Status: WORKING
- Evidence for status: 37000–37003 the effect fires and 37333 renders the card.
- Notes: The mount effect has an empty dep array (37003), so a refeed triggered later in the session by `handleWeightLog` relies on that handler's own duplicate check (37010–37012).

### F-FUEL-218 Weight log card + TDEE report card (hosted here)
- Location: Fuel tab > main view > under the water card
- User action: Logs today's bodyweight in `WeightLogCard`.
- Behavior:
  1. `WeightLogCard` is rendered with `weightLog`, `useKg` (from `p.useKg`) and `onLog: handleWeightLog` (37326–37330).
  2. `handleWeightLog(kg)` calls `addWeightEntry(kg)` (2911–2935), stores the returned log in state, and re-checks the refeed trigger (37006–37013).
  3. `TdeeReportCard` is rendered with no props (37331–37332).
- Components: FuelTab (36895–37468); WeightLogCard (53312, out of range), TdeeReportCard (21751, out of range)
- Functions: `handleWeightLog` (37006–37013), `addWeightEntry` (2911–2935)
- State: `weightLog` (36912–36914)
- Storage: writes `weightLog` (2932)
- Network: `logBetaActivity("weight_log", ...)` (2933)
- AI: none
- Edge cases: `addWeightEntry` overwrites the same-day entry rather than appending (2914–2921).
- Gating: always on
- Status: WORKING
- Evidence for status: 37326–37332 both cards render unconditionally in the main view.
- Notes: Internals of both cards are outside this range.

### F-FUEL-219 Shopping & Budget entry point
- Location: Fuel tab > header "Shop" button > full-screen Shopping/Budget screen
- User action: Taps "Shop".
- Behavior:
  1. `onClick: setView("shop")` (37105–37107).
  2. `FuelTab` returns `ShoppingBudgetTab` directly, passing `useKg`, `profile`, `go`, and `onBack: () => setView("main")` (37067–37077 region; the branch at 37067).
- Components: FuelTab (36895–37468); ShoppingBudgetTab (out of range)
- Functions: none new
- State: `view`
- Storage: `ui_fuelView` (2134)
- Network / AI: none
- Edge cases: none in range.
- Gating: always on
- Status: WORKING
- Evidence for status: 37067 the `view === "shop"` branch returns before the main render.

### F-FUEL-220 Meal plan — today's plan card
- Location: Fuel tab > Meals > Meal Plans sub-tab > "TODAY'S PLAN" card
- User action: Taps "Log" next to any meal in today's plan.
- Behavior:
  1. `activePlan = plans[0]` (37570).
  2. Today's day is matched by name against `dayNames[new Date().getDay()]` (37571–37575).
  3. If no name match, it falls back to `activePlan.days[dayIdx % activePlan.days.length]` (37576–37579).
  4. The card shows "TODAY'S PLAN", the day name, the plan name, then each meal with its slot name (uppercase, `OR`), title, and cal/P/C/F chips (37752–37870 region).
  5. Each meal has a "Log" button calling `logMeal(meal)` (37862–37880 region).
  6. `logMeal` maps the plan's meal name to a log slot: contains "breakfast"→breakfast, "lunch"→lunch, "dinner"/"supper"→dinner, else snacks; then calls `p.addItem(slot, {name: meal.title, cal, pro, carb, fat, fromPlan: true})` (37700–37712).
  7. Below each meal, ingredients render as a comma-joined `amount + " " + item` list (37881–37895).
- Components: MealPlanFuelTab (37469–38547)
- Functions: `logMeal` (37700–37712)
- State: `plans`
- Storage: reads `mealPlans` (45228); writes `fuelLog` via `addItem`
- Network / AI: none
- Edge cases: `meal.totalCal || "?"` when missing (37838); each macro chip is conditionally rendered on truthiness so a genuine `0` is hidden (37843, 37850, 37857).
- Gating: always on
- Status: WORKING
- Evidence for status: 37700–37712 `logMeal` writes through `p.addItem`.
- Notes: A plan meal logged twice creates two entries — no dedupe. The `fromPlan: true` flag is written but its readers are outside this range.

### F-FUEL-221 Meal plan — full-week accordion
- Location: Fuel tab > Meals > Meal Plans > "FULL WEEK" card
- User action: Taps a day row to expand/collapse; taps "+ Shopping List (N)".
- Behavior:
  1. Header row "FULL WEEK" plus a button reading `"+ Shopping List (" + (activePlan.shoppingList||[]).length + ")"` (37896–37930 region).
  2. Each day is a full-width button with a numbered colour swatch (`dayColors = [OR, BLU, GR, OR, RE, "#06B6D4", WA]`, 37744), the day name (or "Day N"), the summed calories for the day, and a ▲/▼ chevron (37931–38010 region).
  3. Today's row is highlighted: swatch filled `OR`, label `OR` and bold (37956–37980 region).
  4. `expandedDay` holds the index of the open day; tapping the open day collapses it (37938–37940).
  5. Expanded content is indented 32px and lists each meal with its name (coloured via `readableAccent(col)`), a "⇄ Swap" button, the title, the ingredient list, and a right-aligned cal + P/C/F column (38011–38094).
- Components: MealPlanFuelTab (37469–38547)
- Functions: `addToShopping` (37713–37730 region — see F-FUEL-223), `readableAccent` (4318, out of range)
- State: `expandedDay` (37477)
- Storage: reads `mealPlans`
- Network / AI: none
- Edge cases: `(activePlan.days || [])` guards a malformed plan (37931); `dayColors` repeats `OR` at indices 0 and 3 (37744).
- Gating: rendered only when `activePlan` is truthy (37896)
- Status: WORKING
- Evidence for status: 37938 the day button toggles `expandedDay`.

### F-FUEL-222 Meal plan — AI meal swap (alternatives sheet)
- Location: Fuel tab > Meals > Meal Plans > expanded day > "⇄ Swap" button > bottom sheet
- User action: Taps "⇄ Swap"; waits; taps one of up to four alternatives, or closes via × / Escape.
- Behavior:
  1. Swap button sets `swapModal = {dayIdx, mealIdx}` and immediately calls `generateAlternatives(di, mi)` (38035–38055 region).
  2. `generateAlternatives` reads the current meal from `plans[0].days[dayIdx].meals[mealIdx]`, lowercases its name as `mealType`, sets `altLoading`, and POSTs to the Worker (37497–37560) — see AI calls #2.
  3. On parse success it stores `alts.slice(0, 4)` (37517–37519).
  4. On parse failure it substitutes **four hardcoded meals** ("Grilled chicken with sweet potato", "Salmon with broccoli and rice", "Turkey meatballs with pasta", "Tofu stir-fry with vegetables") each reusing `currentMeal.totalCal` (37520–37546).
  5. On network failure it substitutes **one** hardcoded meal, "Grilled chicken with vegetables" (37549–37558).
  6. The sheet is `lkPortal`-ed to body, `position: fixed`, `zIndex: 1000`, `borderRadius: "20px 20px 0 0"`, `maxWidth: 420`, `maxHeight: "80dvh"`, with a safe-area bottom pad (38402–38440 region).
  7. Escape closes it via `useEscape(swapModal ? closeFn : null)` (37486).
  8. Loading state shows "Finding alternatives..." plus a pulsing "..." (38487–38505 region).
  9. Each alternative is a tappable card showing title and P/C/F/cal (38506–38543 region).
  10. `selectAlternative(alt)` deep-clones plans via `JSON.parse(JSON.stringify(plans))`, overwrites title and the four macro totals on the target meal, saves, and closes (37561–37569).
  11. Empty-state copy: "Couldn't generate alternatives. Try again or pick another meal." (38544–38546).
- Components: MealPlanFuelTab (37469–38547)
- Functions: `generateAlternatives` (37497–37560), `selectAlternative` (37561–37569), `useEscape` (5160), `lkPortal` (5072)
- State: `swapModal`, `altLoading`, `alternatives` (37481–37484)
- Storage: writes `mealPlans` via `setPlans` → `saveMealPlans` (37494–37497, 45231)
- Network: `POST https://lockedapi.cescocugliari.workers.dev/` — see AI calls #2
- AI: yes — see AI calls #2
- Edge cases: `generateAlternatives` indexes `plans[0]` directly (37498) — if the active plan changed mid-flight the swap targets the wrong plan. The success path does `JSON.parse(match[0])` inside the try (37517–37518) so a null `match` throws into the same catch that emits the four canned meals — a silent-fallback path indistinguishable from real AI output.
- Gating: always on within the Meal Plans sub-tab
- Status: PARTIAL
- Evidence for status: 37520–37546 the parse-failure path presents four fabricated meals to the user with no indication that the AI failed.
- Notes: **Top finding.** Fabricated nutrition numbers (protein 35 g, carbs 45 g etc. at 37524–37527) are shown as if AI-generated and are then written into the saved plan by `selectAlternative`, with `totalCal` copied from the meal being replaced. The swap request also does **not** send a `system` field (37503–37512), unlike the other two calls.

### F-FUEL-223 Meal plan — add shopping list
- Location: Fuel tab > Meals > Meal Plans > FULL WEEK header > "+ Shopping List (N)"
- User action: Taps the button.
- Behavior:
  1. Empty `plan.shoppingList` triggers `window.LOCKED.toast("This plan has no shopping list", "error")` and returns (37714–37719).
  2. Loads the current list via `getShoppingList()` (37720; 41945).
  3. For each plan item, a dedupe check matches an existing entry whose lowercased name contains the **first 6 characters** of the new name (37725–37727).
  4. New entries are built with `parseIngredient(amount + " " + name)` (41905), an id `"sh_" + (ts+idx) + "_" + random`, `category: item.category || categorizeItem(name)`, `dateAdded`, `checked: false`, `fromMealPlan: true` (37728–37742 region).
  5. `saveShoppingList(list)` persists (37743; 41948).
  6. Toast reports "N items added to shopping list" and, when some were skipped, "(M already on list)" (37744–37746 region).
- Components: MealPlanFuelTab (37469–38547)
- Functions: `addToShopping` (37713–37746), `getShoppingList` (41945), `saveShoppingList` (41948), `parseIngredient` (41905), `categorizeItem` (41982), `lcName` (4742)
- State: none local
- Storage: reads/writes the shopping list key (via `getShoppingList`/`saveShoppingList`, 41945–41949)
- Network / AI: none
- Edge cases: The 6-character prefix match (37726) is aggressive — "chicken breast" and "chicken thighs" both start "chicke" and collide, so the second is silently dropped as a duplicate.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 37726 prefix-6 substring dedupe produces false-positive duplicates.
- Notes: The empty-list branch has a stray empty statement `;` after the toast (37718).

### F-FUEL-224 Meal plan — generate new plan form
- Location: Fuel tab > Meals > Meal Plans > "MANAGE PLANS" / "GET STARTED" card
- User action: Taps "+ New Plan"; picks days and meals/day; optionally types diet and budget prefs; taps "Generate Meal Plan".
- Behavior:
  1. Card header reads "MANAGE PLANS" when a plan exists, "GET STARTED" otherwise (38095–38125 region).
  2. Toggle button reads "+ New Plan" / "Cancel" and flips `showForm` (38126–38141).
  3. DAYS select: 3 / 5 / 7 days, default "3"… actually default state is `"7"` (37473) while the first option is 3 days (38178–38186).
  4. MEALS/DAY select: 2 / 3 / 4 / 5 meals, default `"3"` (37474; options 38199–38213).
  5. Two free-text inputs: "Diet preferences (high protein, keto, halal, no dairy...)" and "Budget (cheap, moderate, no limit)" (38214–38258).
  6. "Generate Meal Plan" button, disabled and greyed while `generating`, label swaps to "Generating..." (38259–38281).
  7. While generating a pulsing "..." shows (38282–38296).
  8. `genError` renders in red below (38297–38310).
  9. Footer copy lists the user's enabled stores or prompts "Add stores for store-specific ingredients" (38311–38323).
  10. Empty state when no form and no plan: "No meal plan yet. Tap "+ New Plan" to generate one tailored to your macros and stores." (38324–38334).
  11. `generatePlan()` builds context and POSTs to the Worker — see AI calls #3 (37605–37699).
- Components: MealPlanFuelTab (37469–38547)
- Functions: `generatePlan` (37605–37699), `buildMealContext` (37583–37604)
- State: `daysCount`, `mealsPerDay`, `dietPref`, `budgetPref`, `showForm`, `generating`, `genError` (37471–37480)
- Storage: reads `fuelProfile`, `profile`, budget data, stores; writes `mealPlans`
- Network: `POST https://lockedapi.cescocugliari.workers.dev/` — see AI calls #3
- AI: yes — see AI calls #3
- Edge cases: five distinct error strings — "No response from AI. Try again." (37642), "AI didn't return valid JSON. Try fewer days." (37649), "Plan was empty. Try again." (37690), "Failed to parse plan. Try 3 days instead of 7." (37696), "Network error: <message>" (37699).
- Gating: always on
- Status: WORKING
- Evidence for status: 38270 the button wires `onClick: generatePlan` and the full error surface is implemented.
- Notes: Default `daysCount` is `"7"` (37473) but the select's option list starts at 3 — since "7 days" is a valid option the select shows 7; the mismatch with the error copy ("Try 3 days instead of 7", 37696) suggests 7 is known to be unreliable.

### F-FUEL-225 Meal plan — JSON repair and shopping list rebuild
- Location: Fuel tab > Meals > Meal Plans (invisible; inside `generatePlan`'s response handler)
- User action: none directly.
- Behavior:
  1. First non-greedy `{...}` match extracted from the response text (37645).
  2. Bracket repair: counts `[` vs `]` and appends `]` until balanced (37652–37657).
  3. Brace repair: counts `{` vs `}` and appends `}` until balanced (37658–37663).
  4. `JSON.parse(raw)` (37664).
  5. Every ingredient across every meal is collected into an `allIng` map keyed by `name.toLowerCase().replace(/\s+/g,"")`, keeping the first occurrence's amount and computing `categorizeItem(n)` (37665–37680).
  6. If any were collected, `plan.shoppingList` is **overwritten** with the rebuilt list, discarding the AI's own store-specific product names (37681–37685).
  7. Metadata attached: `id = "mp_" + Date.now()`, `created` ISO timestamp, `daysCount`, `mealsPerDay` (37686–37689).
  8. Empty `plan.days` → error "Plan was empty. Try again." (37690–37693).
  9. The new plan is unshifted to the front of `plans` (making it active) and the form closes (37694–37698 region).
- Components: MealPlanFuelTab (37469–38547)
- Functions: `generatePlan` (37605–37699), `categorizeItem` (41982)
- State: `plans`, `showForm`, `genError`
- Storage: writes `mealPlans` (45231)
- Network / AI: part of AI calls #3
- Edge cases: the bracket/brace counters count characters inside string literals too, so a meal title containing `{` or `[` skews the repair (37653–37662).
- Gating: always on
- Status: PARTIAL
- Evidence for status: 37681–37685 the rebuilt list overrides `plan.shoppingList`, defeating the system prompt's explicit "use the exact product name as it would appear in the user's store" instruction (37623).
- Notes: **Second top finding.** The prompt spends tokens asking for branded store-specific product names (e.g. "Quaker Old Fashioned Oats"), and the client then throws them away in favour of generic ingredient names whenever any ingredient exists.

### F-FUEL-226 Meal plan — saved plans list (activate / star / delete)
- Location: Fuel tab > Meals > Meal Plans > "SAVED PLANS" card
- User action: Taps a plan name or "Use" to activate; taps the star; taps "×" to delete.
- Behavior:
  1. The card renders only when `plans.length > 1` (38335–38346).
  2. Each row shows the plan name (or "Meal Plan") and a subtitle `"<N>d, <M> meals | <locale date>"` (38366–38394 region).
  3. `pi === 0` is the active plan — shown in `OR`, bold, with an "ACTIVE" chip (38431–38445 region).
  4. Tapping a non-active row (a `div role="button" tabIndex=0 onKeyDown={lkKeyActivate}`) or its "Use" button reorders `[plan, ...rest]` (38350–38365 and 38413–38430).
  5. Star button toggles `plan.starred` via `toggleStar` (37731–37743) and, when more than one plan exists, sorts everything except the active plan so starred plans rise (37734–37741).
  6. Delete button (aria-label `"Delete <name>"`) calls `confirm("Delete <name>?")` then `deletePlan(id)` (38446–38480 region; `deletePlan` at 37725–37730).
- Components: MealPlanFuelTab (37469–38547)
- Functions: `deletePlan` (37725–37730), `toggleStar` (37731–37743), `setPlans` (37494–37497)
- State: `plans`
- Storage: writes `mealPlans` (45231)
- Network / AI: none
- Edge cases: the star button calls `e.stopPropagation()` but the "Use" button does not (38415) — harmless since they are siblings, not nested.
- Gating: rendered only with 2+ plans (38335)
- Status: PARTIAL
- Evidence for status: 38335 the whole management UI (including delete) is hidden when only one plan exists, so a user with a single bad plan cannot delete it.
- Notes: Uses a native blocking `confirm()` (38448) rather than the app's own modal/toast system.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| MacroRing | component | 35763–35792 | SVG donut progress ring | FuelTab (37170) | React.createElement | F-FUEL-203, F-FUEL-202 |
| FuelProfileSetup | component | 35794–36537 | Full-screen fuel profile / targets form | FuelTab (37058) | useState, save, togglePref, Ic | F-FUEL-204..212 |
| FuelProfileSetup.togglePref | handler | 35817–35828 | Add/remove a dietary preference id | pref chips (36464) | setPrefs, Array.filter/concat | F-FUEL-211 |
| FuelProfileSetup.save | handler | 35829–35887 | Convert units, compute TDEE+macros, emit profile | SAVE PROFILE button (36526) | parseFloat, parseInt, calcTDEE, calcMacros, p.onSave | F-FUEL-204, F-FUEL-210 |
| WaterCard | component | 36538–36670 | Daily water total, unit toggle, +/- controls | FuelTab (37321) | useState, add, minus | F-FUEL-213 |
| WaterCard.add | handler | 36546–36549 | Convert oz→ml and add water | +250/+500 buttons (36641) | p.addWater, Math.round | F-FUEL-213 |
| WaterCard.minus | handler | 36550–36557 | Subtract one glass, clamped at 0 | "−" button (36656) | p.setDay, Math.max | F-FUEL-213 |
| SmartNutritionCard | component | 36671–36894 | AI meal suggestion fitting remaining macros | FuelTab (37464 region) | useState, suggest, addMeal, Ic | F-FUEL-214 |
| SmartNutritionCard.suggest | handler | 36679–36730 | POST remaining macros to Worker, parse JSON meal | Suggest/New button (36792) | fetch, JSON.parse, setSuggestion | F-FUEL-214, AI #1 |
| SmartNutritionCard.addMeal | handler | 36731–36741 | Log the suggested meal to snacks | Add-to-log button (36878) | p.addItem, Math.round | F-FUEL-214 |
| FuelTab | component | 36895–37468 | Fuel tab shell, targets, sub-tab routing | app router (out of range) | useHubState, useTabReset, useState, useEffect, all handlers below | F-FUEL-200..219 |
| FuelTab.setFuelLog | function | 36917–36924 | State + localStorage writer for fuelLog | setDay (36944) | sd, setFuelLogRaw | F-FUEL-215 |
| FuelTab.setFuelProfile | function | 36925–36928 | State + localStorage writer for fuelProfile | onSave (37062) | sd, setFuelProfileRaw | F-FUEL-204 |
| FuelTab.getDay | function | 36932–36942 | Today's log entry or a default shape | render (36958) | — | F-FUEL-215 |
| FuelTab.setDay | function | 36943–36958 | Immutable update of today's log entry | addWater, addItem, removeItem, WaterCard.minus | setFuelLog, Object.assign | F-FUEL-215 |
| FuelTab.handleWeightLog | handler | 37006–37013 | Persist a weight entry and re-check refeed | WeightLogCard.onLog (37329) | addWeightEntry, checkRefeedTrigger, setShowRefeed | F-FUEL-218, F-FUEL-217 |
| FuelTab.acceptRefeed | handler | 37014–37021 | Accept refeed day, boost carb target | RefeedCard.onAccept (37337) | sd, logBetaActivity | F-FUEL-217 |
| FuelTab.dismissRefeed | handler | 37022–37025 | Dismiss refeed for 5 days | RefeedCard.onDismiss (37339) | sd, logBetaActivity | F-FUEL-217 |
| FuelTab.addWater | handler | 37026–37032 | Add ml to today's water | WaterCard (37323) | setDay | F-FUEL-213 |
| FuelTab.addItem | handler | 37033–37041 | Append a food item to a meal slot | SmartNutritionCard, MealPlanFuelTab, sub-tabs | setDay | F-FUEL-215, F-FUEL-220 |
| FuelTab.removeItem | handler | 37042–37052 | Remove a food item by index | ListTab, SearchTab (props) | setDay | F-FUEL-215 |
| MealPlanFuelTab | component | 37469–38547 | AI meal plan generation, browsing, swapping | FuelTab (37464) | useState, useEscape, all handlers below | F-FUEL-220..226 |
| MealPlanFuelTab.setPlans | function | 37494–37497 | State + localStorage writer for mealPlans | generatePlan, selectAlternative, deletePlan, toggleStar, row activate | saveMealPlans, setPlansRaw | F-FUEL-224, F-FUEL-226 |
| MealPlanFuelTab.generateAlternatives | handler | 37497–37560 | Fetch 4 AI meal alternatives; canned fallbacks | Swap button (38040) | fetch, JSON.parse, setAlternatives | F-FUEL-222, AI #2 |
| MealPlanFuelTab.selectAlternative | handler | 37561–37569 | Overwrite a plan meal with a chosen alternative | alternative card (38510) | JSON.parse/stringify, Object.assign, setPlans | F-FUEL-222 |
| MealPlanFuelTab.buildMealContext | function | 37583–37604 | Build the system-prompt context string | generatePlan (37607) | ld, calcTDEE, getBudgetData | F-FUEL-224, AI #3 |
| MealPlanFuelTab.generatePlan | handler | 37605–37699 | Request, repair, normalise and save a meal plan | Generate button (38270) | buildMealContext, fetch, JSON.parse, categorizeItem, setPlans | F-FUEL-224, F-FUEL-225, AI #3 |
| MealPlanFuelTab.logMeal | handler | 37700–37712 | Map a plan meal to a log slot and log it | Log button (37864) | p.addItem, String.indexOf | F-FUEL-220 |
| MealPlanFuelTab.addToShopping | handler | 37713–37724 | Merge a plan's shopping list into the app list | "+ Shopping List" button (37905) | getShoppingList, parseIngredient, categorizeItem, saveShoppingList, LOCKED.toast | F-FUEL-223 |
| MealPlanFuelTab.deletePlan | handler | 37725–37730 | Remove a plan by id | delete button (38448) | Array.filter, setPlans | F-FUEL-226 |
| MealPlanFuelTab.toggleStar | handler | 37731–37743 | Toggle starred and re-sort non-active plans | star button (38396) | Array.map/sort, setPlans | F-FUEL-226 |

Count: **6 top-level components**, **24 nested functions/handlers** — **30 entries**.

Helpers used but defined outside 35763–38553 (not counted, cited for the redesign): `calcTDEE` (35728–35751), `calcMacros` (35752–35762), `getFuelSettings` (18649–18655), `applyAdaptiveTDEE` (19259–19299), `checkRefeedTrigger` (2936–2965), `calcRefeedCarbs` (2966–2974), `getWeightLog` (2908–2910), `addWeightEntry` (2911–2935), `useHubState` (2121–2138), `useTabReset` (2140–2147), `useEscape` (5160), `lkPortal` (5072), `isoDay` (1961), `fmtQ` (4349), `fmtCal` (4355), `readableAccent` (4318), `lcName` (4742), `getMealPlans` (45228), `saveMealPlans` (45231), `getMyStores` (42073), `getBudgetData` (43964), `categorizeItem` (41982), `parseIngredient` (41905), `getShoppingList` (41945), `saveShoppingList` (41948), `TdeeReportCard` (21751), `RefeedCard` (53210), `WeightLogCard` (53312).

---

## Fuel tab navigation map

Two levels of state, both persisted through `useHubState` (2121–2138, keys prefixed `ui_`).

**Level 0 — `view`** (`useHubState("fuelView", "main")`, 36906). Full-screen replacements returned before the main render:

| view | Screen | Component | Reached by | Exit | Gating |
|---|---|---|---|---|---|
| `main` | Fuel dashboard | FuelTab body (37067+) | default | — | always |
| `profile` | Fuel Profile | FuelProfileSetup (37058–37066) | header "My Profile" button (37142) | Back (37059) or SAVE PROFILE (37062) | always |
| `shop` | Shopping & Budget | ShoppingBudgetTab (37067) | header "Shop" button (37105) | `onBack` → main | always |

`useTabReset("fuel", ...)` resets `view` to `"main"` and `tab` to `"list"` when the tab is re-tapped (36908, 2140–2147).

**Level 1 — group toggle.** `outerMeals = tab === "plan" || tab === "recipes"` (37389). Two segmented buttons:

| Button | Label | Action | Line |
|---|---|---|---|
| Left | "Log" | `if (outerMeals) setTab("list")` | 37400–37419 |
| Right | "Meals" | `if (!outerMeals) setTab("plan")` | 37420–37437 |

**Level 2 — `tab`** (`useHubState("fuelTab", "list", [...])`, 36905). Allowed values: `list, search, scan, photo, trends, recipes, supps, plan, cycle`.

Log group pills (horizontally scrollable row, 37438–37448):

| tab | Label | Component | Props passed | Gating | Line |
|---|---|---|---|---|---|
| `list` | List | `ListTab` | `day, fuelLog, addItem, removeItem` | always | 37390, routing ~37465 |
| `search` | Search | `SearchTab` | `day, addItem, removeItem, onScan` (onScan sets `pendingGtin` and jumps to `scan`) | always | 37390, routing ~37465 |
| `scan` | Scan | `BarcodeTab` | `addItem, gtin: pendingGtin, onConsumeGtin` | always | 37390, routing ~37466 |
| `photo` | Photo | `PhotoTab` | `addItem` | always | 37390, routing ~37466 |
| `trends` | Trends | `TrendsTab` | `fuelLog, weightLog, calTarget: baseTargets.cal` | always | 37390, routing ~37466 |
| `supps` | Supps | `SupplementsTab` | none | always | 37390, routing ~37467 |
| `cycle` | Stack | `CycleTab` | none | **`ld("perfTracking", false)`** (37391) | 37391, routing ~37467 |

Meals group buttons (two equal-width, 37449–37461):

| tab | Label | Component | Props passed | Gating | Line |
|---|---|---|---|---|---|
| `plan` | Meal Plans | `MealPlanFuelTab` | `fuelProfile, addItem` | always | 37450, routing ~37464 |
| `recipes` | Recipes | `RecipesTab` | `fuelProfile, addItem, history: p.history` | always | 37450, routing ~37467 |

Additional conditional content in the routing block: `SmartNutritionCard` renders **in addition to** `ListTab` when `tab === "list"` (routing block ~37468), receiving `totalCal, totalPro, totalCarb, totalFat, targets, addItem`.

Always-visible above the tab strip in `view === "main"`: header (37078–37161), macro summary card (37162–37320), `WaterCard` (37321–37325), `WeightLogCard` (37326–37330), `TdeeReportCard` (37331–37332), `RefeedCard` or the active-refeed banner (37333–37370).

Cross-tab navigation: `SearchTab.onScan(code)` sets `pendingGtin` then `setTab("scan")` (37465 region); `BarcodeTab.onConsumeGtin` clears it (37466 region).

---

## AI calls

All three hit the same Cloudflare Worker with no auth header. Model is **not specified client-side** — it is chosen inside the Worker, which is outside this repo file. No `model` field appears in any of the three payloads (36688–36710, 37503–37512, 37613–37633).

### AI #1 — Smart Nutrition suggestion (36679–36730)
- Endpoint: `POST https://lockedapi.cescocugliari.workers.dev/` (36684)
- Headers: `{"Content-Type": "application/json"}` (36686)
- Payload: `{system, messages: [{role: "user", content: ctx}], max_tokens: 150}` (36688–36710)
- **max_tokens: 150** (36709)
- System prompt (36689, verbatim):
  > "You are a nutrition coach. Reply ONLY with a single valid JSON object for a meal suggestion. No markdown, no explanation outside the JSON."
- User content template (36680–36683, verbatim):
  > "My remaining macros today: " + Math.round(calLeft) + " calories, " + Math.round(proLeft) + "g protein, " + Math.round(p.targets.carb - p.totalCarb) + "g carbs, " + Math.round(p.targets.fat - p.totalFat) + "g fat. Suggest ONE specific realistic meal or food that fits. Reply ONLY with JSON: {\"name\":\"...\",\"cal\":0,\"pro\":0,\"carb\":0,\"fat\":0,\"reason\":\"one sentence why this fits\"}"
- Inputs: remaining calories/protein/carbs/fat only. **No** dietary preferences, allergies, fridge contents, or goal.
- Response parsing (36711–36726): reads `d.content[0].text`, strips ```` ```json ```` and ```` ``` ```` fences, `JSON.parse`; on throw, extracts the first `/\{[\s\S]*?\}/` and parses that; requires `meal.name` before setting state.
- Fallback: none. Inner catch is empty (36722–36724); `.catch` only clears loading (36727–36729). Both leave the card looking idle.
- Risk: 150 tokens is tight for a JSON object plus a `reason` sentence — truncation is a plausible cause of the silent-failure path.

### AI #2 — Meal alternatives / swap (37497–37560)
- Endpoint: `POST https://lockedapi.cescocugliari.workers.dev/` (37502)
- Headers: `{"Content-Type": "application/json"}` (37504)
- Payload: `{messages: [{role: "user", content: prompt}], max_tokens: 500}` (37506–37512) — **no `system` field**, unlike #1 and #3.
- **max_tokens: 500** (37511)
- User prompt (37501, verbatim):
  > "Generate 4 alternative " + mealType + " options with similar calories (" + currentMeal.totalCal + " kcal) and macros (" + currentMeal.totalProtein + "g protein, " + currentMeal.totalCarb + "g carbs, " + currentMeal.totalFat + "g fat). Return ONLY a JSON array of 4 meal objects with: title, totalCal, totalProtein, totalCarb, totalFat. No markdown, no text."
- Inputs: `mealType` (the meal's lowercased slot name) and the current meal's four macro totals. No diet prefs, allergies, stores or budget.
- Response parsing (37513–37519): `d.content[0].text`, match `/\[[\s\S]*\]/`, `JSON.parse(match[0])`, `.slice(0, 4)`.
- Fallback (parse/throw, 37520–37546): four hardcoded meals — "Grilled chicken with sweet potato" (35P/45C/5F), "Salmon with broccoli and rice" (32/48/8), "Turkey meatballs with pasta" (30/52/6), "Tofu stir-fry with vegetables" (20/50/7); each takes `totalCal` from the meal being replaced.
- Fallback (network, 37549–37558): one hardcoded meal — "Grilled chicken with vegetables" (35P/40C/5F), same `totalCal`.
- Risk: fallbacks are visually indistinguishable from AI results and get written into the persisted plan (37561–37569).

### AI #3 — Meal plan generation (37605–37699)
- Endpoint: `POST https://lockedapi.cescocugliari.workers.dev/` (37610)
- Headers: `{"Content-Type": "application/json"}` (37612)
- Payload: `{system, messages: [{role: "user", content}], max_tokens: 4096}` (37614–37633)
- **max_tokens: 4096** (37632)
- System prompt (37623, verbatim):
  > "You are a meal planner. " + ctx + " CRITICAL: Each day MUST total approximately " + dailyCal + " kcal. Every day must have " + meals + " main meals PLUS 1-2 snacks. Meal structure per day: Breakfast, Lunch, Dinner" + (meals > 3 ? ", Meal " + meals : "") + " and Snack (or Snack 1 + Snack 2). Distribute calories: ~30% breakfast, ~30% lunch, ~30% dinner, ~10% snacks. Return ONLY valid JSON. Be concise — short titles, 2-4 ingredients per meal. Format: {\"name\":\"Plan Name\",\"days\":[{\"day\":\"DayName\",\"meals\":[{\"name\":\"Breakfast\",\"title\":\"Title\",\"ingredients\":[{\"item\":\"food\",\"amount\":\"qty\"}],\"totalCal\":N,\"totalProtein\":N,\"totalCarb\":N,\"totalFat\":N},{\"name\":\"Snack\",\"title\":\"Snack Title\",\"ingredients\":[{\"item\":\"food\",\"amount\":\"qty\"}],\"totalCal\":N,\"totalProtein\":N,\"totalCarb\":N,\"totalFat\":N}]}],\"shoppingList\":[{\"item\":\"specific product name as sold at store\",\"amount\":\"qty\",\"category\":\"meat\"}]}. IMPORTANT: In the shoppingList, use the exact product name as it would appear in the user's store (e.g. 'Quaker Old Fashioned Oats' not just 'oats', 'Chobani Greek Yogurt' not just 'yogurt'). Days: " + dayNamesList.join(",") + ". Keep response under 3500 tokens."
- `ctx` from `buildMealContext()` (37583–37604), assembled in order:
  1. `"STRICT CALORIE TARGET: " + tdee + " kcal per day. "` (37589)
  2. `"The TOTAL calories across ALL meals + snacks for each day MUST add up to approximately " + tdee + " kcal. "` (37590)
  3. `"Macros per day: " + pro + "g protein, " + carb + "g carbs, " + fat + "g fat. "` (37591)
  4. `"Goal: " + goal + ". "` (37592)
  5. `"Weight: " + profile.weightKg + "kg. "` if present (37593)
  6. `"Shops at: <name (description), ...>. "` from `getMyStores().filter(s => s.enabled)` (37594–37598)
  7. `"Weekly grocery budget: $" + budgetData.weeklyTarget + ". "` when > 0 (37599–37600)
  8. `"Budget preference: " + budgetPref + ". "` (37601)
  9. `"Diet preferences/restrictions: " + dietPref + ". "` (37602)
- User content (37629, verbatim):
  > "Create a " + days + "-day meal plan totaling " + dailyCal + " kcal per day. ACCURACY RULES: 1) Use REAL calorie counts — oatmeal 1 cup = 300 kcal, banana = 105 kcal, chicken breast 150g = 250 kcal, eggs 2 = 140 kcal, rice 1 cup cooked = 200 kcal, etc. NEVER inflate numbers. 2) To hit " + dailyCal + " kcal, use LARGER PORTIONS or MORE FOOD — do not fake calorie numbers. 3) Each day: " + meals + " main meals + 1-2 snacks. 4) Distribute roughly: breakfast 25%, lunch 30%, dinner 35%, snacks 10%. " + (dietPref ? " Preferences: " + dietPref + ". " : "") + (budgetPref ? " Budget: " + budgetPref + ". " : "") + "Return ONLY valid JSON."
- Response parsing (37637–37698): see F-FUEL-225 — extract first `{...}`, balance `[`/`]` and `{`/`}` by appending, `JSON.parse`, rebuild `shoppingList` from ingredients, attach id/created/daysCount/mealsPerDay, unshift to `plans`.
- Fallback: none. Five distinct `genError` strings only (37642, 37649, 37690, 37696, 37699). No canned plan.
- Contradictions in the prompt: the system prompt says 30/30/30/10 (37623) while the user message says 25/30/35/10 (37629). `dailyCal` is `fp.tdee` only — it ignores `adaptiveTDEE` (37609), unlike the dashboard target (36985).

**Security finding:** the Worker URL `https://lockedapi.cescocugliari.workers.dev/` is hardcoded in three places (36684, 37502, 37610) with no API key or auth token in the client — so no client secret leaks here, but the endpoint is an unauthenticated, un-rate-limited (from the client's view) proxy to a paid LLM. Anyone reading the shipped HTML can call it. Variable name: none (inline string literal). Value: not redacted here because it is a public hostname, not a secret; the actual model API key lives server-side in the Worker.

---

## Fuel profile / targets model

**Persisted shape** (`localStorage` key `fuelProfile`), written at 35832–35870 and 19291–19296:

```
{
  weightVal, weightUnit,            // raw entry, "lbs"|"kg"        (35832-35833)
  heightFt, heightIn, heightCmRaw,  // raw entry                     (35834-35836)
  heightUnit,                        // "ft"|"cm"                     (35836)
  weightKg,                          // Math.round(kg*10)/10          (35838)
  heightCm,                          // Math.round(cm)                (35840)
  age, sex,                          // string, "male"|"female"       (35841-35842)
  activityLevel,                     // sedentary|light|moderate|active|very (35843)
  goal,                              // cut|maintain|bulk             (35844)
  preferences: [],                   // chip ids                      (35845)
  allergies, fridge,                 // free text                     (35846-35847)
  useCustomMacros,                   // bool                          (35854)
  customCal, customPro, customCarb, customFat,                        // (35855-35858)
  tdee, macroProtein, macroCarbs, macroFat,                           // (35859-35870)
  adaptiveTDEE                       // written only by applyAdaptiveTDEE (19292)
}
```

**Unit conversion** (35830–35831):
- `kg = weightUnit === "kg" ? parseFloat(weightVal) : parseFloat(weightVal) / 2.20462`
- `cm = heightUnit === "cm" ? parseFloat(heightCm) : (parseInt(heightFt)||0)*30.48 + (parseInt(heightIn)||0)*2.54`

**BMR / TDEE** — `calcTDEE(profile)` (35728–35751):
- Guard: missing `weightKg`, `heightCm` or `age` → returns **2200** (35729).
- Female: `bmr = 447.593 + 9.247*kg + 3.098*cm - 4.330*age` (35735) — Mifflin-St Jeor revised / Harris-Benedict female.
- Male: `bmr = 88.362 + 13.397*kg + 4.799*cm - 5.677*age` (35737) — Harris-Benedict male.
- Multipliers (35739–35745): sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very 1.9; unknown → 1.55 (35746).
- `tdee = Math.round(bmr * mult)` (35747).
- Goal adjustment: cut `×0.8`, bulk `×1.1`, maintain unchanged (35748–35749).

**Macros** — `calcMacros(tdee, weightKg, goal)` (35752–35762):
- `kg = parseFloat(weightKg) || 80` (35753)
- `pro = Math.round(kg * (goal === "cut" ? 2.4 : goal === "bulk" ? 2.0 : 2.2))` g (35754)
- `fat = Math.round(tdee * 0.25 / 9)` g (25% of calories) (35755)
- `carb = Math.round((tdee - pro*4 - fat*9) / 4)`, floored at **50 g** (35756, 35759)

**Custom override** (35859–35870): applied only when `useCustomMacros && customCal`; each field falls back to its auto value via `parseInt(x) || auto`.

**Dashboard targets** — `baseTargets` (36984–36990):
- `cal: fuelProfile.adaptiveTDEE || fuelProfile.tdee || 2200`
- `pro: fuelProfile.macroProtein || 160`
- `carb: fuelProfile.macroCarbs || 220`
- `fat: fuelProfile.macroFat || 60`
- No-profile defaults: `{cal: 2200, pro: 160, carb: 220, fat: 60}` (36990)

**Refeed adjustment** — when `refeedActive` (36993–36999): `carb = baseCarb + refeedCarbs`, `cal = baseCal + refeedCarbs * 4`. `refeedCarbs` from `calcRefeedCarbs` (2966–2974): base 50 g; 75 g if tdee > 2500; 100 g if tdee > 3000; `+15` g if weight > 90 kg. Fallback 75 when there is no profile (36992).

**Adaptive TDEE** — `applyAdaptiveTDEE` (19259–19299): weekly (≥7 days since last `tdeeHistory` entry), skipped when `useCustomMacros`; `blended = round(0.7*current + 0.3*observed)`, step clamped to ±150 kcal, passed through `applyCalFloor`, then macros recomputed with `calcMacros(next, weightKg, goal)` and `fuelProfile` rewritten with `adaptiveTDEE`.

**Water goal**: hardcoded `3000` ml in `WaterCard` (36541), ignoring `fuelSettings.waterGoalMl` (18651).

**Fuel log shape** (`fuelLog`, keyed by `isoDay()`):
```
{ "<YYYY-MM-DD>": { meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }, water: 0 } }
```
(36933–36941, 36945–36953). Item shape observed from writers: `{name, cal, pro, carb, fat}` (36732–36740) plus optional `fromPlan: true` (37706–37711).

**Meal plan shape** (`mealPlans`, array; index 0 = active):
```
{ id: "mp_<ts>", name, created: ISO, daysCount, mealsPerDay, starred?,
  days: [{ day: "DayName", meals: [{ name, title, ingredients: [{item, amount}],
                                     totalCal, totalProtein, totalCarb, totalFat }] }],
  shoppingList: [{ item, amount, category }] }
```
(37623 format spec; 37665–37689 client-side normalisation; 37734–37737 `starred`).

---

## Storage keys touched

All via the shared `ld` / `sd` helpers.

| Key | Read | Written | Purpose |
|---|---|---|---|
| `fuelLog` | 36910; 37008 (via listener re-read) | 36921 | Per-day meals + water |
| `fuelProfile` | 36913; 37585, 37608 (direct `ld` in MealPlanFuelTab) | 36927 | Fuel profile and targets |
| `fuelSettings` | 18650 (via `getFuelSettings`, called at 36899) | — (written elsewhere) | `hideNumbers`, `framing`, unused `waterGoalMl` |
| `weightLog` | 36913 (via `getWeightLog`, 2908) | 2932 (via `addWeightEntry`) | Bodyweight history |
| `refeedAccepted` | 36919; 2946 | 37016 | ISO day the refeed was accepted |
| `refeedDismissed` | 2940 | 37023 | ISO timestamp of last dismissal (5-day cooldown) |
| `tdeeHistory` | 19263 | 19289 | Adaptive TDEE weekly entries |
| `ui_fuelTab` | 2123 (via `useHubState`, 36905) | 2134 | Persisted sub-tab |
| `ui_fuelView` | 2123 (via `useHubState`, 36906) | 2134 | Persisted view (main/profile/shop) |
| `perfTracking` | 37391 | — | Gates the "Stack" (cycle) pill |
| `mealPlans` | 45228 (via `getMealPlans`, called 37470) | 45231 (via `saveMealPlans`, called 37496) | Saved AI meal plans |
| `profile` | 37490 (direct `ld("profile", {})`) | — | Fallback macro/goal source in `buildMealContext` |
| shopping list key | 41945 (via `getShoppingList`, called 37720) | 41948 (via `saveShoppingList`, called 37743) | Shopping list merge target |
| budget data key | 43964 (via `getBudgetData`, called 37599) | — | Weekly grocery budget for the prompt |
| stores key | 42073 (via `getMyStores`, called 37488) | — | Enabled store names for the prompt |

Window events: listens for `lockedFuelUpdate` (37009–37012); `useTabReset` listens for `lockedTabReset` (2144).

---

## Open questions / UNVERIFIED

1. **`fmtQ` return type.** UNVERIFIED. `m.val` at 37270 and 37287 is `fmtQ(totalPro)` (37223). If `fmtQ` (4349–4354) returns a string with a unit suffix, the hide-numbers "Over"/"On track" comparison and the bar width both break. Confirm by reading 4349–4354 and, at runtime, logging `typeof fmtQ(180.4)`.
2. **`preferences` / `allergies` / `fridge` are never sent to any AI in this range.** Confirmed absent from 36699–36707 and 37583–37604, but they may be consumed by `RecipesTab` (out of range). Confirm by grepping for `.allergies` and `.fridge` across the whole file.
3. **Worker model and `system` handling.** UNVERIFIED. AI call #2 sends no `system` field (37506–37512). Whether the Worker injects a default system prompt, and which model it selects, cannot be determined from this file. Confirm by reading the Worker source or with a test request.
4. **`cycle` tab reachable with `perfTracking` off.** `"cycle"` is in the `useHubState` allowed list (36905) but the pill is only pushed when `perfTracking` is true (37391). A previously-persisted `ui_fuelTab === "cycle"` should therefore render `CycleTab` with no way to navigate away except the Log/Meals toggle. Confirm by setting `localStorage.ui_fuelTab = "cycle"` with `perfTracking` false.
5. **NaN profile values.** `weightKg`/`heightCm` can be stored as `NaN` (35838, 35840) when fields are blank. `JSON.stringify(NaN)` yields `null`, so the persisted value is likely `null` rather than NaN, which `calcTDEE`'s guard (35729) then catches → 2200. UNVERIFIED — depends on `sd`'s serialisation. Confirm by reading `sd`.
6. **`adaptiveTDEE` ignored by the meal planner.** `generatePlan` uses `fp.tdee` (37609) and `buildMealContext` uses `fp.tdee` (37586), while the dashboard prefers `adaptiveTDEE` (36985). Is this deliberate? No comment explains it.
7. **`useKg` and `history` props.** `FuelTab` forwards `p.useKg` (37327, 37069), `p.profile`, `p.go` (37069–37071) and `p.history` (37467 region) without using them locally. Their producers are outside this range.
