### F-CARDIO-001 — Cardio section shell with three tabs
- location: Train > CARDIO screen > header + tab bar
- user action: Taps Cardio on Train; taps Favorites / Log / History; taps back arrow.
- behaviour: 1. `CardioSection` mounts; initial tab is `"favorites"` if `cardioFavorites()` is non-empty, else `"log"` (56217-56219). 2. Header renders a back button (`p.onBack`, aria-label "Back to Train") and an `h1` "CARDIO" (56236-56252). 3. Tab bar renders `TABS = [["favorites","Favorites"],["log","Log"],["history","History"]]` (56227). 4. Tapping any tab other than `log` clears `preset` first, then sets the tab (56258). 5. `favorites` → `CardioFavorites` with `onPick: openLog`, `onBrowse: openLog(null)` (56270-56273). 6. `history` → `CardioHistory` with `history`, `useKg`, `profile` (56274-56278). 7. otherwise → `CardioLogFlow` with all of `p` spread plus `key: presetKey`, `embedded: true`, `preset`, `onBack`, `onDone` (56279-56284). 8. `openLog(fav)` sets `preset`, increments `presetKey` (forcing a full remount of the log flow, discarding all its state), and switches to `log` (56221-56225). 9. `onDone` clears the preset, bumps `presetKey`, and lands the user on `history` (56283). 10. `onBack` from the log flow returns to `favorites` if any favourite exists, else stays on `log` (56282).
- v6 status: WORKING

### F-CARDIO-002 — Favorites list (empty state)
- location: Cardio > Favorites tab
- user action: Opens Favorites with zero saved setups; taps "Browse activities".
- behaviour: 1. When `ordered.length === 0`, renders a centred star badge, "Star what you do most", helper copy, and a "Browse activities" CTA (55597-55622). 2. CTA calls `p.onBrowse()` → `openLog(null)` → Log tab at step `activity` (55613, 56272).
- v6 status: WORKING — 55597-55622 renders and the CTA is wired.

### F-CARDIO-003 — Favorites — quick chips (one-tap re-log)
- location: Cardio > Favorites > horizontal chip row
- user action: Taps a chip.
- behaviour: 1. `ordered` = favourites sorted ascending by `order` (55581). 2. `pinned` = those with `pinned !== false`, capped at **12** (55582). 3. Chip row renders only when not editing and `pinned.length > 0` (55651). 4. Each chip shows `Ic` with `D[f.emoji] || D.bolt` and `f.label` (55671). 5. Tap → `p.onPick(f)` → `openLog(fav)` → log flow mounts with that preset.
- v6 status: WORKING — 55658-55671, tap handler wired to `onPick`.

### F-CARDIO-004 — Favorites — full list rows
- location: Cardio > Favorites > card list
- user action: Taps a row (not editing).
- behaviour: 1. Renders every favourite in `order`, each as a card with icon tile, label, and a summary line (55674-55771). 2. `summaryLine(f)` builds "brand · N min": brand if `machine.brand`, else the `CARDIO_MACHINES` display name matched on `machine.category`; then `Math.round(defaults.durationSec/60) + " min"` (55584-55595). Falls back to "Tap to log" (55755). 3. Row tap when not editing → `p.onPick(f)` (55678). 4. Right-hand `CardioStar` is always `on: true`; toggling it removes that favourite from the list and saves (55766-55771). 5. A dashed "Log something else" button below the list calls `p.onBrowse()` (55773-55778).
- v6 status: WORKING — 55674-55771.

### F-CARDIO-005 — Favorites — edit mode (reorder, rename, delete)
- location: Cardio > Favorites > "Edit" in the section header
- user action: Taps Edit / Done; taps ▲ ▼; taps the name to rename; taps the trash then "Delete?".
- behaviour: 1. Header shows "FAVORITES (n)" and an Edit/Done toggle; toggling clears `renaming` and `confirmDel` (55631-55648). 2. Edit mode reveals per-row ▲/▼ buttons (55692-55723). `move(id, dir)` sorts by `order`, swaps neighbours, then rewrites every `order` to its index and persists (55561-55570). ▲ disabled at index 0, ▼ at the last index (55697, 55710). 3. Tapping the name in edit mode enters rename: `setRenaming(f.id)`, `setRenameVal(f.label)` (55757-55761); an autoFocus input commits on Enter or blur (55726-55740). 4. `rename(id)` trims; an empty value keeps the old label (55571-55578). 5. Delete is two-tap: trash icon → `confirmDel = f.id` → the button becomes "Delete?" → `remove(id)` filters and persists (55763-55765, 55579-55582).
- v6 status: WORKING — 55561-55582 plus the wired controls.

### F-CARDIO-006 — History — empty state
- location: Cardio > History
- user action: 
- behaviour: with zero `type === "cardio"` records, renders "No cardio yet" + explanatory copy and nothing else (55934-55941).
- v6 status: WORKING — 55934-55941.

### F-CARDIO-007 — History — group filter chips
- location: Cardio > History > chip row
- user action: Taps All / Machines / Outdoor / Indoor / Sport / Yours.
- behaviour: 1. Groups are derived from the records actually present via `cardioActivity(w.modality).group`, defaulting to `"Other"` (55944-55948) — deliberately not a fixed list (comment 55943). 2. Chip row renders only when `groups.length > 1` (56007). 3. Selecting a chip sets `filter` and resets `openIdx` to null (56018). 4. `shown` = all, or all filtered to the chosen group (55949-55952). **Every downstream aggregate (weeks, PBs, zones, list) uses `shown`, not `all`** (55954-55959).
- v6 status: WORKING — 56007-56026.

### F-CARDIO-008 — History — "this week" stat row
- location: Cardio > History > three stat cards
- user action: 
- behaviour: renders THIS WEEK (`sessions` + singular/plural), MINUTES, CALORIES from `weeks[weeks.length-1]`, the current bucket of `cardioWeekBuckets(shown, 8)` (55954-55955, 56029-56045). Calories rounded with `Math.round`.
- v6 status: WORKING — 56029-56045.

### F-CARDIO-009 — History — 8-week minutes bar chart
- location: Cardio > History > "MINUTES PER WEEK" card
- user action: 
- behaviour: 1. `cardioWeekBuckets(list, 8)` builds Monday-start buckets, oldest first, ending with the current week; `dow = (getDay()+6)%7` makes Monday index 0 (55811-55821). Empty weeks are still emitted (comment 55809-55810). 2. Each bucket accumulates `minutes` (rounded from `cardioSecsOf/60`), `sessions`, `calories` for records with `type === "cardio"` and a `dateISO` inside `[startISO, endISO]` (55831-55842). 3. Bar height = `max(4, round(minutes / maxMin * 62))`, or 2px when zero (56063). 4. The current week gets a gradient fill; past weeks `OR_H + "55"`; empty weeks `BORD` (56074-56078). 5. The last bar is labelled "now"; others `M/D` (56083-56085). 6. The chart container is `role="img"` with an aria-label listing all eight minute totals (56057-56059).
- v6 status: WORKING — 56048-56087.

### F-CARDIO-010 — History — personal bests strip
- location: Cardio > History > "PERSONAL BESTS" horizontal cards
- user action: 
- behaviour: `cardioPBs(shown, distUnit)` (55846-55899) computes up to seven bests, rendered in the fixed order `["furthest","pace","split","speed","watts","longest","burn"]` (55895-55898). Each card shows an uppercase label, the value, and a sub-line of `name · date`. - `longest` — max `cardioSecsOf`, shown in minutes (55856-55857). - `furthest` — max metres, converted with `cardioDist` to `distUnit`, 2dp (55858-55860). - `pace` — lowest sec/km (converted to /mi via `toDispKm = 1.609344` when imperial) for `running|walking|hiking` **only when distance ≥ 1600 m** (55861-55866). Floor is deliberate (comment 55845). - `speed` — highest km/h for `cycling` only when distance ≥ 5000 m (55867-55872). - `split` — lowest 500 m split for `rowing|skierg`, taken from `metrics.splitSec` if present, else computed by `cardioSplit500` when distance ≥ 500 m (55873-55879). - `watts` — highest `metrics.avgWatts` (55880-55884). - `burn` — highest `cardioSessionCalories` (55885-55887).
- v6 status: WORKING — 56089-56117.

### F-CARDIO-011 — History — time in heart-rate zone
- location: Cardio > History > "TIME IN ZONE" card
- user action: 
- behaviour: 1. `cardioZoneTime(shown, profile)` (55903-55922): max HR from `cardioMaxHr(profile)` (5664-5675 — Tanaka `208-0.7*age` for male/unknown, Gulati `206-0.88*age` for female, overridable via `lk_cardioPrefs.maxHrOverride`); zones from `cardioZones()` which defaults to the 5-zone model (5689-5691). 2. Only sessions carrying `heartRate.avg` or `metrics.avgHr` are counted; the **entire session** lands in the zone of its average HR (55911-55919, comment 55900-55902). 3. `cardioZoneOf` returns -1 below zone 1; the component clamps that to zone 0 (55917-55918) — so sub-zone-1 sessions are miscounted as Recovery. 4. Card renders only when `zoneTotal > 0` (56119), shows a proportional stacked bar (`flexGrow: minutes`) plus a colour legend, and states "From the N sessions with a heart rate, by session average." (56128-56131).
- v6 status: WORKING — 56119-56158.

### F-CARDIO-012 — History — session list and expandable detail
- location: Cardio > History > session cards
- user action: Taps a session row to expand/collapse.
- behaviour: 1. Each row: activity icon (`D[cardioActivity(w.modality).icon || "run"]`), name (`w.name || "Cardio"`), `line(w)`, and `w.date` on the right (56161-56194). 2. `line(w)` = "N min · X km · Y cal", omitting any missing part (55961-55970). 3. Tap toggles `openIdx` (56174-56175) with `aria-expanded`. 4. `detailRows(w)` (55972-56003) renders, in order: Pace (running/walking/hiking), Speed (cycling), Split (rowing/skierg, ≥500 m), Power (`metrics.avgWatts`), Heart rate (`heartRate.avg` or `metrics.avgHr`), Effort (`metrics.rpe` "/10"), Surface (`ceSurface(w.surface).label`), Gross burn (`calories.gross`), Notes.
- v6 status: WORKING — 56160-56210.

### F-CARDIO-013 — Log flow — step 1: pick an activity
- location: Cardio > Log > "What did you do?"
- user action: Types in the search box; taps an activity tile; taps a tile's star.
- behaviour: 1. Initial step is `"activity"` unless a preset with a resolvable modality exists, in which case the flow opens straight on `"form"` (56344-56347). 2. `pool = CARDIO_ACTIVITIES.concat(custom)` where custom entries come from `p.customCardio` mapped into `{id,name,group:"Yours",icon,fields:"plain",custom:true,met}` (56500-56504). 3. Group order is `["Machines","Outdoor","Indoor","Sport"]`, prefixed with `"Yours"` when customs exist (56499, 56505). 4. Header shows "What did you do?" and `pool.length + " activities"` (56508). 5. Search filters case-insensitively on `a.name` (56526-56527). 6. Each group renders a coloured dot (`ceGroupTone(g)`: Yours/Machines `#F97316`, Outdoor `#22C55E`, Indoor `#3B82F6`, Sport `#F59E0B` — 56332-56336), the group name, and the item count. 7. Tiles are a 2-column grid; each tile sets `activity`, sets `surface` to `ceActivityMap(a.id).surface || null`, and advances to `"machine"` if `a.machine` exists, else `"form"` (56554-56558). 8. Each tile carries a `CardioStar` (size 28) that calls `toggleCardioFav({modality: a.id, machine: null, defaults: {}}, a.name)` and bumps `favTick` to force a re-render (56590-56594). 9. Empty search → "Nothing matches “query”." (56596-56600).
- v6 status: WORKING — 56495-56601.

### F-CARDIO-014 — Log flow — step 2: which machine
- location: Cardio > Log > "Which <category>?"
- user action: Taps a brand, "My machine isn't listed", or "Skip".
- behaviour: 1. Reached only when the chosen activity has a `machine` category (56557). 2. Title resolves the category display name by scanning `CARDIO_MACHINES` (56604-56607, catalogue 5572-5588). 3. Sub-copy: "Remembered for next time" and "Only used to label the session — it never changes the estimate." (56609-56612). 4. Lists every `CARDIO_BRANDS` entry except `"Other"` (56614-56615; 24 brands, catalogue 5590-5616). Tapping one sets `machine = {category, brand, model: null}` and goes to `"form"` (56618-56621). 5. "My machine isn't listed" sets `{category, brand: null, model: null}` and goes to `"form"` (56631-56634). 6. "Skip" sets `machine = null` and goes to `"form"` (56643). 7. Back button ("Back to machines"/"Back to activities" wording is on the form; here it is "Back to activities") returns to step 1 (56608).
- v6 status: PARTIAL

### F-CARDIO-015 — Log flow — step 3: the form (duration, distance, engine fields, surface, ride position, console fields, notes)
- location: Cardio > Log > activity form (the default render, 56761-56926)
- user action: Taps a duration chip or types minutes; types distance; fills engine fields; picks a surface; picks a riding position; expands the console block; types notes; taps Save session.
- behaviour: 1. `fieldKeys = cardioFieldsFor(activity.id)` (56694) — resolves the activity's `fields` preset in `CARDIO_FIELDS` (5469-5484), defaulting to `plain`. 2. Fields are split in two: `engineFields` (those with `CE_FIELDS[fk].engine === true`) and `consoleFields` (the rest). `distance` is skipped because it has its own row (56704-56712). `speed` and `pace` are `null` in `CE_FIELDS` and therefore never rendered (56323). 3. **RPE special case**: `rpeCounts = ceActivityMap(activity.id).met != null` — RPE is filed under "changes the estimate" only for MET-fallback activities; for runs and rides it drops into the console group (56702, 56710). 4. `wantsSurface` = modality is running/walking/hiking; `isOutdoorFoot` additionally requires `group === "Outdoor"`; `wantsDistance` = the field list contains `distance` (56713-56715). 5. Hero row: back button (to `machine` if the activity has one, else `activity` — 56763-56766), activity icon, name, and either the machine brand or the group as the sub-line, plus a size-34 `CardioStar` bound to `favShape()` (56789-56826). 6. Live estimate card renders whenever `activity && parseFloat(durMin) > 0` (56414, 56829). 7. HOW LONG: quick chips `DURATIONS = [10,15,20,30,45,60]` (56716) plus a numeric "Duration" input in minutes (56832-56860). 8. "CHANGES THE ESTIMATE" card renders when any of distance / surface / engineFields / cycling applies (56863-56865): Distance row with the `distUnit` suffix, then `engineFields.map(numField)`, then the riding-position row (outdoor cycling only, `mapping.m === "cycling" && !mapping.indoor`), then the surface row. 9. Riding position: `CE_RIDE_POSITIONS` chips — Upright / On the hoods / In the drops / On aero bars (6704-6709), labelled "Changes the estimate by about 30%." (56884-56891). 10. Surface: `CE_SURFACE` chips (5973-5987, 14 surfaces), filtered to exclude `treadmill` and `track` when `isOutdoorFoot`; default selection is `surface || "pavement"` (56900-56911). Copy: "The biggest lever there is — dry sand more than doubles a walk." 11. Console block is collapsed behind a chevron; its heading reads "ALSO WORTH RECORDING" when RPE is in that group, else "FROM THE CONSOLE" (56915-56930 region, 56921-56922). Expanded copy explains the numbers are stored but unused (56932-56934). 12. NOTES: a 2-row textarea bound to `notes` (56938-56952). 13. Save button is disabled unless `parseFloat(durMin) > 0`; its background and cursor change accordingly (56955-56970). 14. `numField(fk)` (56727-56779) renders three shapes: `rpe` → `rpeField()`; `clock` → a text input displaying `secToClock(value)` and storing `clockToSec(input)` with placeholder "2:00"; everything else → `type="number" step="0.01"` with the unit suffix. `elev` fields take `elevUnit`, `wt` fields take `wtUnit`. 15. `rpeField()` (56781-56807) renders ten 1–10 buttons; re-tapping the selected value clears it (`setField("rpe", v === n ? "" : n)`); the buttons fill cumulatively (`on = v >= n`). 16. `setField(key, v)` shallow-copies `mx` via `ceMerge` and sets one key (56392-56396).
- v6 status: WORKING — 56761-56970 renders every branch and Save is wired.

### F-CARDIO-016 — Log flow — live calorie estimate card
- location: Cardio > Log > form, directly under the hero
- user action: 
- behaviour: 1. `est = activity && parseFloat(durMin) > 0 ? cardioEstimate(draft(), body) : null` — recomputed on every keystroke (56414). 2. `ceEstimateCard(e, big)` (57078-57140): tone is green for tier ≤ 2, blue for tier 3, amber otherwise (57079-57080); hero number is `CeCount` (animated count-up); a `CeTierMeter` and a confidence pill (`CE_CONFIDENCE_LABEL`) sit top-right; below, "Likely a–b cal", then `CE_METHOD_LABEL[e.method]` plus the fixed sentence "Net — this is on top of what you'd burn resting, so it's safe to add to your food target." 3. When `tier > 2`, `ceImproveHint(e)` is shown in orange: "Add a distance, a wattage or a split and this stops being a guess." for `met-lookup`, otherwise "There is a more accurate reading available for this activity." (57142-57146, 57135-57137). 4. When `e.bodyComplete === false`, an amber line asks for height, age and sex (57138-57140).
- v6 status: WORKING — 56829, 57078-57140.

### F-CARDIO-017 — Animated calorie counter (CeCount)
- location: inside the estimate card, hero number
- user action: 
- behaviour: 1. Holds `shown`, seeded from `p.value`; `fromRef` tracks the previous target (57020-57021). 2. On `p.value` change: if unchanged, snap. If `window.matchMedia("(prefers-reduced-motion: reduce)").matches` (in a try/catch), snap. Otherwise animate over `dur = 420` ms with an ease-out cubic `1 - (1-t)^3`, rounding each frame to the nearest 5 (57022-57041). 3. Cleanup cancels the rAF (57043).
- v6 status: WORKING — 57022-57043, rAF loop with cleanup and reduced-motion guard.

### F-CARDIO-018 — Estimate-quality tier meter (CeTierMeter)
- location: estimate card, top-right
- user action: 
- behaviour: `lit = 6 - p.tier` (tier 1 lights all five; tier 5 lights one) (57053). Five bars of increasing height (`5 + i*2.2`), lit ones filled with the tone at full opacity and animated in with a staggered 45 ms delay; unlit ones grey at 0.22 (57055-57070). Container is `role="img"` with aria-label "Estimate quality N out of 5, <confidence label>".
- v6 status: WORKING — 57052-57071.

### F-CARDIO-019 — Save a cardio session
- location: Cardio > Log > "Save session"
- user action: Taps Save session.
- behaviour: 1. `save()` (56427-56463) builds `d = draft()`. 2. Guard: no activity or `durationSec === 0` → toast "Pick an activity and a duration first" via `window.LOCKED.toast(..., "error")` and return (56429-56432). 3. `e = cardioEstimate(d, body)` (56433). 4. `fav = findCardioFav(cardioFavorites(), {modality, machine})` so the record can carry `favoriteId` (56434, 56446). 5. Builds the record (see "Cardio record shape" below) with `id: "w_" + Date.now()`, human `date` via `toLocaleDateString("en-US",{month:"short",day:"numeric"})`, `dateISO: isoDay()`, `schemaVersion: CARDIO_SCHEMA` (=2, 5461). 6. Calls `p.onSave(rec)` → `App` prepends it to `history` (57649-57653). 7. Sets `saved = {rec, est}` and `step = "done"`.
- v6 status: WORKING — 56427-56463 plus the wired `onSave` at 57649.

### F-CARDIO-020 — Unit conversion on the way into the engine (`draft`)
- location: internal to `CardioLogFlow` - Behavior (56399-56412): 1. `durSec = Math.round(parseFloat(durMin) * 60)`. 2. `metrics = ceMerge(mx, {})`; for cycling, `metrics.ridePosition = ridePos` is injected. 3. `elevationGainM` and `verticalM` are multiplied by `0.3048` when `elevUnit === "ft"`; `packKg` is multiplied by `0.45359237` when `wtUnit === "lb"` — "Convert on the way in, never on the way out" (56405-56411). 4. `distanceM = Math.round(cardioDistToM(dv, distUnit))` or `null`. 5. Returns `{modality, durationSec, distanceM, surface, metrics}`; modality defaults to `"run"` when no activity is set. - `distUnit`/`elevUnit`/`wtUnit` all key off the single `p.useKg` flag: `km/m/kg` when `useKg !== false`, else `mi/ft/lb` (56387-56389).
- user action: 
- behaviour: 
- v6 status: WORKING — 56399-56412.

### F-CARDIO-021 — Log flow — step 4: the summary ("Logged")
- location: Cardio > Log > post-save screen
- user action: Taps "Save this setup" / "★ Saved to favourites"; taps "Done". - Behavior (56652-56692): 1. Renders only when `step === "done" && saved` (56653). 2. Green check badge, "Logged", and "<activity name> · N min". 3. `ceEstimateCard(saved.est, true)` — the big variant (56673). 4. `ceSummaryStats(saved.rec, distUnit)` (56674). 5. Left button toggles the favourite via `toggleCardioFav(favShape(), activity.name)` and bumps `favTick`; its label and colour flip on `isCardioFav({modality, machine})` (56655, 56676-56687). 6. Right button calls `p.onDone || p.onBack` — inside the section this clears the preset and jumps to History (56688-56691, 56283).
- behaviour: 
- v6 status: WORKING — 56652-56692.

### F-CARDIO-022 — Derived summary stats (`ceSummaryStats`)
- location: summary screen, card below the estimate - Behavior (57149-57185): from the saved record, pushes Distance (2dp in `distUnit`); then Pace (`secToClock` per unit) for running/walking/hiking, else Speed in unit/h; then Split /500m for rowing/skierg; then Average power from `metrics.avgWatts`; then Gross burn from `calories.gross`. Returns `null` when no rows (57181).
- user action: 
- behaviour: 
- v6 status: WORKING — 57149-57185.

### F-CARDIO-023 — Favourite creation / toggling (star)
- location: everywhere a `CardioStar` appears — activity tiles, form hero, summary button, favourites rows
- user action: Taps a star.
- behaviour: 1. `CardioStar` (55510-55544) is a button with `aria-pressed` and an aria-label that reads "Remove/Save <label> from favourites"; it stops propagation and prevents default before calling `p.onToggle` (55516-55520). Glyph is ★ when on, ☆ when off, coloured `OR_H` at full opacity vs `MU` at 0.55. 2. `toggleCardioFav(o, label)` (5846-5874): looks the favourite up by `cardioFavKey` = `modality|machine.category|machine.brand` (5830-5834); if found, removes it; else creates `{id:"fav_"+Date.now(), label, emoji: activity.icon, modality, subType, environment, machine, defaults, order:0, useCount:0, lastUsedAt:null, pinned:true}` and prepends it, renumbering everything else (5850-5872). 3. Each call site bumps `favTick` purely to force a re-render (56592, 56678, 56825).
- v6 status: PARTIAL

### F-CARDIO-024 — Preset (favourite) prefill of the log flow
- location: Cardio > Favorites > tap a favourite → Log
- user action: 
- behaviour: 1. `step` starts at `"form"` when `cardioActivity(preset.modality)` resolves, else `"activity"` (56344-56347). 2. `activity` = `cardioActivity(preset.modality)` (56348-56350); `machine` = `preset.machine` (56351-56353). 3. `durMin` = `round(preset.defaults.durationSec / 60)` as a string, else `""` (56354-56357). 4. `surface` = `preset.defaults.surface` or null (56359-56361). 5. `mx` = `ceMerge(preset.defaults.metrics, {})` or `{}` (56365-56368). 6. `distVal` and `notes` always start empty (56358, 56369).
- v6 status: PARTIAL

### F-CARDIO-025 — Custom cardio activities ("Yours" group)
- location: Cardio > Log > step 1, "YOURS" group
- user action: 
- behaviour: `p.customCardio` entries are mapped into pool items with `group:"Yours"`, `fields:"plain"`, `custom:true` and a carried `met` (56500-56504); the "Yours" group is prepended when non-empty (56505). `App` supplies them from `customs.filter(c => c.type === "cardio")` (57635-57637).
- v6 status: PARTIAL

### F-CARDIO-026 — Calorie estimation (consumption of the CARDIO v2 engine)
- location: form live estimate and save
- user action: 
- behaviour: `cardioEstimate(rec, body)` is called from exactly two places in range — `est` (56414) and `save()` (56433). Body profile comes from `cardioBodyProfile(p.profile, ld("fuelProfile", {}), ld("weightLog", []))` (56386). Full math in the "Calorie estimation math" section below. - Storage read: `lk_fuelProfile`, `lk_weightLog` (56386)
- v6 status: WORKING — 56414, 56433.
