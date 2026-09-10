# Agent 2e — Cardio module audit

File under audit: `redesign/input/locked-current-v6.html`
Exclusive range: **55510–57185**. All `file:line` cites below are that file unless stated.
Out-of-range cites (constants block 5403–7015, App wiring ~57631) are included as **consumption evidence only** — those lines are owned by other agents.

Entry point: `App` renders `CardioSection` when `screen === "cardio"` (57631-57653), reached from the Train screen's `onCardio` (57628-57630).

---

## PART A — Features

### F-CARDIO-001 Cardio section shell with three tabs
- Location: Train > CARDIO screen > header + tab bar
- User action: Taps Cardio on Train; taps Favorites / Log / History; taps back arrow.
- Behavior:
  1. `CardioSection` mounts; initial tab is `"favorites"` if `cardioFavorites()` is non-empty, else `"log"` (56217-56219).
  2. Header renders a back button (`p.onBack`, aria-label "Back to Train") and an `h1` "CARDIO" (56236-56252).
  3. Tab bar renders `TABS = [["favorites","Favorites"],["log","Log"],["history","History"]]` (56227).
  4. Tapping any tab other than `log` clears `preset` first, then sets the tab (56258).
  5. `favorites` → `CardioFavorites` with `onPick: openLog`, `onBrowse: openLog(null)` (56270-56273).
  6. `history` → `CardioHistory` with `history`, `useKg`, `profile` (56274-56278).
  7. otherwise → `CardioLogFlow` with all of `p` spread plus `key: presetKey`, `embedded: true`, `preset`, `onBack`, `onDone` (56279-56284).
  8. `openLog(fav)` sets `preset`, increments `presetKey` (forcing a full remount of the log flow, discarding all its state), and switches to `log` (56221-56225).
  9. `onDone` clears the preset, bumps `presetKey`, and lands the user on `history` (56283).
  10. `onBack` from the log flow returns to `favorites` if any favourite exists, else stays on `log` (56282).
- Components: `CardioSection` (56216-56286)
- Functions: `openLog` (56221-56225)
- State: local `tab`, `preset`, `presetKey`. Props in: `history`, `useKg`, `profile`, `customCardio`, `onCustomCardio`, `onBack`, `onSave` (57632-57653).
- Storage: reads `lk_cardioFavorites` via `cardioFavorites()` (56218, 56282; 5821-5823 + `ld` 2417-2425).
- Network: none.
- AI: none.
- Edge cases: no favourites → opens on Log. `presetKey` remount means an in-progress unsaved log is silently discarded when a favourite is picked or after Done.
- Gating: always on.
- Status: WORKING
- Evidence for status: 56270-56284 — all three branches render real components with wired callbacks.
- Notes: `paddingBottom: 24` with a comment about the floating voice button (56232-56234). Container is `minHeight: "100vh"`.

### F-CARDIO-002 Favorites list (empty state)
- Location: Cardio > Favorites tab
- User action: Opens Favorites with zero saved setups; taps "Browse activities".
- Behavior:
  1. When `ordered.length === 0`, renders a centred star badge, "Star what you do most", helper copy, and a "Browse activities" CTA (55597-55622).
  2. CTA calls `p.onBrowse()` → `openLog(null)` → Log tab at step `activity` (55613, 56272).
- Components: `CardioFavorites` (55550-55779)
- Functions: none beyond the render
- State: `favs` (initialised from `cardioFavorites()`, 55551)
- Storage: reads `lk_cardioFavorites`
- Network / AI: none
- Edge cases: this is the empty case.
- Gating: always on
- Status: WORKING — 55597-55622 renders and the CTA is wired.
- Notes: `var prefs = cardioPrefs();` (55555) is computed and **never used** anywhere in the component — dead call that still hits localStorage on every render.

### F-CARDIO-003 Favorites — quick chips (one-tap re-log)
- Location: Cardio > Favorites > horizontal chip row
- User action: Taps a chip.
- Behavior:
  1. `ordered` = favourites sorted ascending by `order` (55581).
  2. `pinned` = those with `pinned !== false`, capped at **12** (55582).
  3. Chip row renders only when not editing and `pinned.length > 0` (55651).
  4. Each chip shows `Ic` with `D[f.emoji] || D.bolt` and `f.label` (55671).
  5. Tap → `p.onPick(f)` → `openLog(fav)` → log flow mounts with that preset.
- Components: `CardioFavorites` (55550)
- State: `favs`, `editing`
- Storage: reads `lk_cardioFavorites`
- Status: WORKING — 55658-55671, tap handler wired to `onPick`.
- Notes: `WebkitOverflowScrolling: "touch"` is declared **twice** in the same style object (55654, 55656) — harmless duplicate, present in several cardio scroll rows (56010/56012, 56093/56095, 56865/56866).

### F-CARDIO-004 Favorites — full list rows
- Location: Cardio > Favorites > card list
- User action: Taps a row (not editing).
- Behavior:
  1. Renders every favourite in `order`, each as a card with icon tile, label, and a summary line (55674-55771).
  2. `summaryLine(f)` builds "brand · N min": brand if `machine.brand`, else the `CARDIO_MACHINES` display name matched on `machine.category`; then `Math.round(defaults.durationSec/60) + " min"` (55584-55595). Falls back to "Tap to log" (55755).
  3. Row tap when not editing → `p.onPick(f)` (55678).
  4. Right-hand `CardioStar` is always `on: true`; toggling it removes that favourite from the list and saves (55766-55771).
  5. A dashed "Log something else" button below the list calls `p.onBrowse()` (55773-55778).
- Components: `CardioFavorites` (55550), `CardioStar` (55510-55544)
- Functions: `summaryLine` (55584-55595), `setFavs` (55557-55560)
- State: `favs`, `editing`, `renaming`, `renameVal`, `confirmDel`
- Storage: writes `lk_cardioFavorites` via `saveCardioFavorites` (5825-5827)
- Edge cases: unknown `f.emoji` falls back to `D.bolt` (55744).
- Status: WORKING — 55674-55771.
- Notes: the inner name block gets `role="button"` / `tabIndex` / `lkKeyActivate` only when NOT editing, with an explicit comment on avoiding nested buttons (55746-55752).

### F-CARDIO-005 Favorites — edit mode (reorder, rename, delete)
- Location: Cardio > Favorites > "Edit" in the section header
- User action: Taps Edit / Done; taps ▲ ▼; taps the name to rename; taps the trash then "Delete?".
- Behavior:
  1. Header shows "FAVORITES (n)" and an Edit/Done toggle; toggling clears `renaming` and `confirmDel` (55631-55648).
  2. Edit mode reveals per-row ▲/▼ buttons (55692-55723). `move(id, dir)` sorts by `order`, swaps neighbours, then rewrites every `order` to its index and persists (55561-55570). ▲ disabled at index 0, ▼ at the last index (55697, 55710).
  3. Tapping the name in edit mode enters rename: `setRenaming(f.id)`, `setRenameVal(f.label)` (55757-55761); an autoFocus input commits on Enter or blur (55726-55740).
  4. `rename(id)` trims; an empty value keeps the old label (55571-55578).
  5. Delete is two-tap: trash icon → `confirmDel = f.id` → the button becomes "Delete?" → `remove(id)` filters and persists (55763-55765, 55579-55582).
- Functions: `move` (55561-55570), `rename` (55571-55578), `remove` (55579-55582), `setFavs` (55557-55560)
- Storage: writes `lk_cardioFavorites` on every reorder/rename/delete
- Edge cases: `move` returns early when the index is out of range (55566). No undo for delete.
- Status: WORKING — 55561-55582 plus the wired controls.
- Notes: chip row and the "Log something else" button are hidden in edit mode (55651, 55773).

### F-CARDIO-006 History — empty state
- Location: Cardio > History
- Behavior: with zero `type === "cardio"` records, renders "No cardio yet" + explanatory copy and nothing else (55934-55941).
- Components: `CardioHistory` (55924-56212)
- State: `all` derived from `p.history` filtered to `type === "cardio"` (55925)
- Status: WORKING — 55934-55941.

### F-CARDIO-007 History — group filter chips
- Location: Cardio > History > chip row
- User action: Taps All / Machines / Outdoor / Indoor / Sport / Yours.
- Behavior:
  1. Groups are derived from the records actually present via `cardioActivity(w.modality).group`, defaulting to `"Other"` (55944-55948) — deliberately not a fixed list (comment 55943).
  2. Chip row renders only when `groups.length > 1` (56007).
  3. Selecting a chip sets `filter` and resets `openIdx` to null (56018).
  4. `shown` = all, or all filtered to the chosen group (55949-55952). **Every downstream aggregate (weeks, PBs, zones, list) uses `shown`, not `all`** (55954-55959).
- State: `filter`, `openIdx`
- Status: WORKING — 56007-56026.

### F-CARDIO-008 History — "this week" stat row
- Location: Cardio > History > three stat cards
- Behavior: renders THIS WEEK (`sessions` + singular/plural), MINUTES, CALORIES from `weeks[weeks.length-1]`, the current bucket of `cardioWeekBuckets(shown, 8)` (55954-55955, 56029-56045). Calories rounded with `Math.round`.
- Functions: `cardioWeekBuckets` (55811-55844), `cardioSecsOf` (55800-55802), `cardioSessionCalories` (6900-6903)
- Status: WORKING — 56029-56045.

### F-CARDIO-009 History — 8-week minutes bar chart
- Location: Cardio > History > "MINUTES PER WEEK" card
- Behavior:
  1. `cardioWeekBuckets(list, 8)` builds Monday-start buckets, oldest first, ending with the current week; `dow = (getDay()+6)%7` makes Monday index 0 (55811-55821). Empty weeks are still emitted (comment 55809-55810).
  2. Each bucket accumulates `minutes` (rounded from `cardioSecsOf/60`), `sessions`, `calories` for records with `type === "cardio"` and a `dateISO` inside `[startISO, endISO]` (55831-55842).
  3. Bar height = `max(4, round(minutes / maxMin * 62))`, or 2px when zero (56063).
  4. The current week gets a gradient fill; past weeks `OR_H + "55"`; empty weeks `BORD` (56074-56078).
  5. The last bar is labelled "now"; others `M/D` (56083-56085).
  6. The chart container is `role="img"` with an aria-label listing all eight minute totals (56057-56059).
- Functions: `cardioWeekBuckets` (55811-55844)
- Status: WORKING — 56048-56087.
- Notes: `today` param of `cardioWeekBuckets` exists for testability but is never passed by the UI (55811, 55954).

### F-CARDIO-010 History — personal bests strip
- Location: Cardio > History > "PERSONAL BESTS" horizontal cards
- Behavior: `cardioPBs(shown, distUnit)` (55846-55899) computes up to seven bests, rendered in the fixed order `["furthest","pace","split","speed","watts","longest","burn"]` (55895-55898). Each card shows an uppercase label, the value, and a sub-line of `name · date`.
  - `longest` — max `cardioSecsOf`, shown in minutes (55856-55857).
  - `furthest` — max metres, converted with `cardioDist` to `distUnit`, 2dp (55858-55860).
  - `pace` — lowest sec/km (converted to /mi via `toDispKm = 1.609344` when imperial) for `running|walking|hiking` **only when distance ≥ 1600 m** (55861-55866). Floor is deliberate (comment 55845).
  - `speed` — highest km/h for `cycling` only when distance ≥ 5000 m (55867-55872).
  - `split` — lowest 500 m split for `rowing|skierg`, taken from `metrics.splitSec` if present, else computed by `cardioSplit500` when distance ≥ 500 m (55873-55879).
  - `watts` — highest `metrics.avgWatts` (55880-55884).
  - `burn` — highest `cardioSessionCalories` (55885-55887).
- Functions: `cardioPBs` (55846-55899), inner `take` (55849-55854)
- Status: WORKING — 56089-56117.
- Notes: PBs are computed over `shown`, so a filter chip changes what "personal best" means. Sub-line uses `w.date` (the human "Mar 4" string), not `dateISO` (55855).

### F-CARDIO-011 History — time in heart-rate zone
- Location: Cardio > History > "TIME IN ZONE" card
- Behavior:
  1. `cardioZoneTime(shown, profile)` (55903-55922): max HR from `cardioMaxHr(profile)` (5664-5675 — Tanaka `208-0.7*age` for male/unknown, Gulati `206-0.88*age` for female, overridable via `lk_cardioPrefs.maxHrOverride`); zones from `cardioZones()` which defaults to the 5-zone model (5689-5691).
  2. Only sessions carrying `heartRate.avg` or `metrics.avgHr` are counted; the **entire session** lands in the zone of its average HR (55911-55919, comment 55900-55902).
  3. `cardioZoneOf` returns -1 below zone 1; the component clamps that to zone 0 (55917-55918) — so sub-zone-1 sessions are miscounted as Recovery.
  4. Card renders only when `zoneTotal > 0` (56119), shows a proportional stacked bar (`flexGrow: minutes`) plus a colour legend, and states "From the N sessions with a heart rate, by session average." (56128-56131).
- Functions: `cardioZoneTime` (55903-55922)
- Status: WORKING — 56119-56158.
- Notes: `cardioZoneTime` calls `cardioZones()` with no model argument, so the user's `lk_cardioPrefs.zoneModel === "3zone"` preference (5651) is **ignored** here. Bug.

### F-CARDIO-012 History — session list and expandable detail
- Location: Cardio > History > session cards
- User action: Taps a session row to expand/collapse.
- Behavior:
  1. Each row: activity icon (`D[cardioActivity(w.modality).icon || "run"]`), name (`w.name || "Cardio"`), `line(w)`, and `w.date` on the right (56161-56194).
  2. `line(w)` = "N min · X km · Y cal", omitting any missing part (55961-55970).
  3. Tap toggles `openIdx` (56174-56175) with `aria-expanded`.
  4. `detailRows(w)` (55972-56003) renders, in order: Pace (running/walking/hiking), Speed (cycling), Split (rowing/skierg, ≥500 m), Power (`metrics.avgWatts`), Heart rate (`heartRate.avg` or `metrics.avgHr`), Effort (`metrics.rpe` "/10"), Surface (`ceSurface(w.surface).label`), Gross burn (`calories.gross`), Notes.
- Functions: `line` (55961-55970), `detailRows` (55972-56003), `cardioMetresOf` (55803-55807), `cardioSecsOf` (55800-55802)
- Status: WORKING — 56160-56210.
- Notes: rows are keyed by array index and `openIdx` is an index, so the open card can jump if `shown` changes; changing the filter resets it (56018), but a new save arriving does not.

### F-CARDIO-013 Log flow — step 1: pick an activity
- Location: Cardio > Log > "What did you do?"
- User action: Types in the search box; taps an activity tile; taps a tile's star.
- Behavior:
  1. Initial step is `"activity"` unless a preset with a resolvable modality exists, in which case the flow opens straight on `"form"` (56344-56347).
  2. `pool = CARDIO_ACTIVITIES.concat(custom)` where custom entries come from `p.customCardio` mapped into `{id,name,group:"Yours",icon,fields:"plain",custom:true,met}` (56500-56504).
  3. Group order is `["Machines","Outdoor","Indoor","Sport"]`, prefixed with `"Yours"` when customs exist (56499, 56505).
  4. Header shows "What did you do?" and `pool.length + " activities"` (56508).
  5. Search filters case-insensitively on `a.name` (56526-56527).
  6. Each group renders a coloured dot (`ceGroupTone(g)`: Yours/Machines `#F97316`, Outdoor `#22C55E`, Indoor `#3B82F6`, Sport `#F59E0B` — 56332-56336), the group name, and the item count.
  7. Tiles are a 2-column grid; each tile sets `activity`, sets `surface` to `ceActivityMap(a.id).surface || null`, and advances to `"machine"` if `a.machine` exists, else `"form"` (56554-56558).
  8. Each tile carries a `CardioStar` (size 28) that calls `toggleCardioFav({modality: a.id, machine: null, defaults: {}}, a.name)` and bumps `favTick` to force a re-render (56590-56594).
  9. Empty search → "Nothing matches “query”." (56596-56600).
- Components: `CardioLogFlow` (56343-56927), `CardioStar` (55510)
- Functions: `ceGroupTone` (56337), `header` (56465-56490)
- State: `step`, `activity`, `surface`, `query`, `favTick`
- Storage: reads/writes `lk_cardioFavorites` via `isCardioFav`/`toggleCardioFav` (5842-5874)
- Status: WORKING — 56495-56601.
- Notes: (a) `p.embedded` is true inside `CardioSection`, so step 1 renders **no back button** (56509); the section header's back is the only exit. (b) Tile stars save with `machine: null` while the form/summary star saves `favShape()` including the machine — the same activity can therefore appear as two favourites and the star can read "off" after a machine is chosen (56591 vs 56419-56425, key builder 5830-5834).

### F-CARDIO-014 Log flow — step 2: which machine
- Location: Cardio > Log > "Which <category>?"
- User action: Taps a brand, "My machine isn't listed", or "Skip".
- Behavior:
  1. Reached only when the chosen activity has a `machine` category (56557).
  2. Title resolves the category display name by scanning `CARDIO_MACHINES` (56604-56607, catalogue 5572-5588).
  3. Sub-copy: "Remembered for next time" and "Only used to label the session — it never changes the estimate." (56609-56612).
  4. Lists every `CARDIO_BRANDS` entry except `"Other"` (56614-56615; 24 brands, catalogue 5590-5616). Tapping one sets `machine = {category, brand, model: null}` and goes to `"form"` (56618-56621).
  5. "My machine isn't listed" sets `{category, brand: null, model: null}` and goes to `"form"` (56631-56634).
  6. "Skip" sets `machine = null` and goes to `"form"` (56643).
  7. Back button ("Back to machines"/"Back to activities" wording is on the form; here it is "Back to activities") returns to step 1 (56608).
- Status: PARTIAL
- Evidence for status: 56618-56621 — `model` is hardcoded `null` and the `models` arrays in `CARDIO_BRANDS` (5590-5616) are never rendered anywhere in this range. There is no model-picker step.
- Notes: `machine.model` is written into every saved record as `null` (via `machine`, 56435) yet the data model and the brand catalogue both carry model lists. Dead data.

### F-CARDIO-015 Log flow — step 3: the form (duration, distance, engine fields, surface, ride position, console fields, notes)
- Location: Cardio > Log > activity form (the default render, 56761-56926)
- User action: Taps a duration chip or types minutes; types distance; fills engine fields; picks a surface; picks a riding position; expands the console block; types notes; taps Save session.
- Behavior:
  1. `fieldKeys = cardioFieldsFor(activity.id)` (56694) — resolves the activity's `fields` preset in `CARDIO_FIELDS` (5469-5484), defaulting to `plain`.
  2. Fields are split in two: `engineFields` (those with `CE_FIELDS[fk].engine === true`) and `consoleFields` (the rest). `distance` is skipped because it has its own row (56704-56712). `speed` and `pace` are `null` in `CE_FIELDS` and therefore never rendered (56323).
  3. **RPE special case**: `rpeCounts = ceActivityMap(activity.id).met != null` — RPE is filed under "changes the estimate" only for MET-fallback activities; for runs and rides it drops into the console group (56702, 56710).
  4. `wantsSurface` = modality is running/walking/hiking; `isOutdoorFoot` additionally requires `group === "Outdoor"`; `wantsDistance` = the field list contains `distance` (56713-56715).
  5. Hero row: back button (to `machine` if the activity has one, else `activity` — 56763-56766), activity icon, name, and either the machine brand or the group as the sub-line, plus a size-34 `CardioStar` bound to `favShape()` (56789-56826).
  6. Live estimate card renders whenever `activity && parseFloat(durMin) > 0` (56414, 56829).
  7. HOW LONG: quick chips `DURATIONS = [10,15,20,30,45,60]` (56716) plus a numeric "Duration" input in minutes (56832-56860).
  8. "CHANGES THE ESTIMATE" card renders when any of distance / surface / engineFields / cycling applies (56863-56865): Distance row with the `distUnit` suffix, then `engineFields.map(numField)`, then the riding-position row (outdoor cycling only, `mapping.m === "cycling" && !mapping.indoor`), then the surface row.
  9. Riding position: `CE_RIDE_POSITIONS` chips — Upright / On the hoods / In the drops / On aero bars (6704-6709), labelled "Changes the estimate by about 30%." (56884-56891).
  10. Surface: `CE_SURFACE` chips (5973-5987, 14 surfaces), filtered to exclude `treadmill` and `track` when `isOutdoorFoot`; default selection is `surface || "pavement"` (56900-56911). Copy: "The biggest lever there is — dry sand more than doubles a walk."
  11. Console block is collapsed behind a chevron; its heading reads "ALSO WORTH RECORDING" when RPE is in that group, else "FROM THE CONSOLE" (56915-56930 region, 56921-56922). Expanded copy explains the numbers are stored but unused (56932-56934).
  12. NOTES: a 2-row textarea bound to `notes` (56938-56952).
  13. Save button is disabled unless `parseFloat(durMin) > 0`; its background and cursor change accordingly (56955-56970).
  14. `numField(fk)` (56727-56779) renders three shapes: `rpe` → `rpeField()`; `clock` → a text input displaying `secToClock(value)` and storing `clockToSec(input)` with placeholder "2:00"; everything else → `type="number" step="0.01"` with the unit suffix. `elev` fields take `elevUnit`, `wt` fields take `wtUnit`.
  15. `rpeField()` (56781-56807) renders ten 1–10 buttons; re-tapping the selected value clears it (`setField("rpe", v === n ? "" : n)`); the buttons fill cumulatively (`on = v >= n`).
  16. `setField(key, v)` shallow-copies `mx` via `ceMerge` and sets one key (56392-56396).
- Components: `CardioLogFlow` (56343)
- Functions: `numField` (56727-56779), `rpeField` (56781-56807), `setField` (56392-56396), `draft` (56399-56412), `favShape` (56418-56425), `ceLabelStyle` (56974-56976), `ceCardStyle` (56977-56979), `ceRowStyle` (56980-56982), `ceRowIcon` (56983-56999+ through 57006), `ceInputStyle` (57007-57015), `ceUnitStyle` (57016-57018)
- State: `durMin`, `distVal`, `surface`, `ridePos`, `mx`, `notes`, `showConsole`, `favTick`
- Storage: `lk_cardioFavorites` (star); body profile reads `lk_fuelProfile` and `lk_weightLog` via `cardioBodyProfile(p.profile, ld("fuelProfile",{}), ld("weightLog",[]))` (56386)
- Network / AI: none
- Edge cases: duration 0 → no estimate card and Save disabled; invalid numeric text yields `NaN` → `parseFloat` guards downstream; `CE_FIELDS[fk]` undefined skips the field (56708).
- Gating: always on
- Status: WORKING — 56761-56970 renders every branch and Save is wired.
- Notes: (a) `mapping` is computed at 56695 but `ceActivityMap(activity.id)` is called a second time at 56702 for `rpeCounts` — duplicated lookup. (b) `showConsole` starts false so console fields are hidden by default (56370).

### F-CARDIO-016 Log flow — live calorie estimate card
- Location: Cardio > Log > form, directly under the hero
- Behavior:
  1. `est = activity && parseFloat(durMin) > 0 ? cardioEstimate(draft(), body) : null` — recomputed on every keystroke (56414).
  2. `ceEstimateCard(e, big)` (57078-57140): tone is green for tier ≤ 2, blue for tier 3, amber otherwise (57079-57080); hero number is `CeCount` (animated count-up); a `CeTierMeter` and a confidence pill (`CE_CONFIDENCE_LABEL`) sit top-right; below, "Likely a–b cal", then `CE_METHOD_LABEL[e.method]` plus the fixed sentence "Net — this is on top of what you'd burn resting, so it's safe to add to your food target."
  3. When `tier > 2`, `ceImproveHint(e)` is shown in orange: "Add a distance, a wattage or a split and this stops being a guess." for `met-lookup`, otherwise "There is a more accurate reading available for this activity." (57142-57146, 57135-57137).
  4. When `e.bodyComplete === false`, an amber line asks for height, age and sex (57138-57140).
- Components: `CeCount` (57019-57044), `CeTierMeter` (57052-57071)
- Functions: `ceEstimateCard` (57078-57140), `ceImproveHint` (57142-57146)
- Status: WORKING — 56829, 57078-57140.
- Notes: `ceEstimateCard` and `ceImproveHint` live at 57078/57142, i.e. **outside** the stated 55510-57185 boundary is false — they are inside it. `ceSummaryStats` (57149-57185) is the last function in range.

### F-CARDIO-017 Animated calorie counter (CeCount)
- Location: inside the estimate card, hero number
- Behavior:
  1. Holds `shown`, seeded from `p.value`; `fromRef` tracks the previous target (57020-57021).
  2. On `p.value` change: if unchanged, snap. If `window.matchMedia("(prefers-reduced-motion: reduce)").matches` (in a try/catch), snap. Otherwise animate over `dur = 420` ms with an ease-out cubic `1 - (1-t)^3`, rounding each frame to the nearest 5 (57022-57041).
  3. Cleanup cancels the rAF (57043).
- Components: `CeCount` (57019-57044)
- Status: WORKING — 57022-57043, rAF loop with cleanup and reduced-motion guard.

### F-CARDIO-018 Estimate-quality tier meter (CeTierMeter)
- Location: estimate card, top-right
- Behavior: `lit = 6 - p.tier` (tier 1 lights all five; tier 5 lights one) (57053). Five bars of increasing height (`5 + i*2.2`), lit ones filled with the tone at full opacity and animated in with a staggered 45 ms delay; unlit ones grey at 0.22 (57055-57070). Container is `role="img"` with aria-label "Estimate quality N out of 5, <confidence label>".
- Components: `CeTierMeter` (57052-57071)
- Status: WORKING — 57052-57071.

### F-CARDIO-019 Save a cardio session
- Location: Cardio > Log > "Save session"
- User action: Taps Save session.
- Behavior:
  1. `save()` (56427-56463) builds `d = draft()`.
  2. Guard: no activity or `durationSec === 0` → toast "Pick an activity and a duration first" via `window.LOCKED.toast(..., "error")` and return (56429-56432).
  3. `e = cardioEstimate(d, body)` (56433).
  4. `fav = findCardioFav(cardioFavorites(), {modality, machine})` so the record can carry `favoriteId` (56434, 56446).
  5. Builds the record (see "Cardio record shape" below) with `id: "w_" + Date.now()`, human `date` via `toLocaleDateString("en-US",{month:"short",day:"numeric"})`, `dateISO: isoDay()`, `schemaVersion: CARDIO_SCHEMA` (=2, 5461).
  6. Calls `p.onSave(rec)` → `App` prepends it to `history` (57649-57653).
  7. Sets `saved = {rec, est}` and `step = "done"`.
- Functions: `save` (56427-56463), `draft` (56399-56412)
- State: `saved`, `step`
- Storage: indirect — `App`'s `setHistory` persists to `lk_history` (UNVERIFIED at this range; `setHistory` is defined outside 55510-57185).
- Network / AI: none.
- Edge cases: toast path requires `window.LOCKED.toast` to exist, guarded (56430). No duplicate-submit guard, but the button is disabled below 1 minute (56956).
- Status: WORKING — 56427-56463 plus the wired `onSave` at 57649.
- Notes: an explicit comment records that `vol` and `sets` are deliberately omitted because writing them made strength volume totals include cardio calories (56439-56441).

### F-CARDIO-020 Unit conversion on the way into the engine (`draft`)
- Location: internal to `CardioLogFlow`
- Behavior (56399-56412):
  1. `durSec = Math.round(parseFloat(durMin) * 60)`.
  2. `metrics = ceMerge(mx, {})`; for cycling, `metrics.ridePosition = ridePos` is injected.
  3. `elevationGainM` and `verticalM` are multiplied by `0.3048` when `elevUnit === "ft"`; `packKg` is multiplied by `0.45359237` when `wtUnit === "lb"` — "Convert on the way in, never on the way out" (56405-56411).
  4. `distanceM = Math.round(cardioDistToM(dv, distUnit))` or `null`.
  5. Returns `{modality, durationSec, distanceM, surface, metrics}`; modality defaults to `"run"` when no activity is set.
- `distUnit`/`elevUnit`/`wtUnit` all key off the single `p.useKg` flag: `km/m/kg` when `useKg !== false`, else `mi/ft/lb` (56387-56389).
- Status: WORKING — 56399-56412.
- Notes: the converted values are written into the record's `metrics` (56436 uses `d.metrics`), so **stored metrics are already in SI** even though the user typed feet or pounds. The form input re-reads `mx` (unconverted display state), so display stays correct while editing — but a favourite's preset metrics (`ceMerge(d, {})` at 56366) would be re-converted a second time if metrics were ever saved into a favourite. Currently unreachable because `favShape()` never stores metrics.

### F-CARDIO-021 Log flow — step 4: the summary ("Logged")
- Location: Cardio > Log > post-save screen
- User action: Taps "Save this setup" / "★ Saved to favourites"; taps "Done".
- Behavior (56652-56692):
  1. Renders only when `step === "done" && saved` (56653).
  2. Green check badge, "Logged", and "<activity name> · N min".
  3. `ceEstimateCard(saved.est, true)` — the big variant (56673).
  4. `ceSummaryStats(saved.rec, distUnit)` (56674).
  5. Left button toggles the favourite via `toggleCardioFav(favShape(), activity.name)` and bumps `favTick`; its label and colour flip on `isCardioFav({modality, machine})` (56655, 56676-56687).
  6. Right button calls `p.onDone || p.onBack` — inside the section this clears the preset and jumps to History (56688-56691, 56283).
- Functions: `ceSummaryStats` (57149-57185)
- Status: WORKING — 56652-56692.
- Notes: The source defines this block **before** step 3 (comment "step 4: the summary" at 56651, "step 3: the form" at 56693) — a reading hazard, not a runtime one, since step 3 is the fall-through render.

### F-CARDIO-022 Derived summary stats (`ceSummaryStats`)
- Location: summary screen, card below the estimate
- Behavior (57149-57185): from the saved record, pushes Distance (2dp in `distUnit`); then Pace (`secToClock` per unit) for running/walking/hiking, else Speed in unit/h; then Split /500m for rowing/skierg; then Average power from `metrics.avgWatts`; then Gross burn from `calories.gross`. Returns `null` when no rows (57181).
- Status: WORKING — 57149-57185.
- Notes: unlike `detailRows` (55993-55995), the Split branch here has **no ≥500 m floor**, so a 50 m erg piece produces a nonsense split on the summary but is correctly suppressed in History.

### F-CARDIO-023 Favourite creation / toggling (star)
- Location: everywhere a `CardioStar` appears — activity tiles, form hero, summary button, favourites rows
- User action: Taps a star.
- Behavior:
  1. `CardioStar` (55510-55544) is a button with `aria-pressed` and an aria-label that reads "Remove/Save <label> from favourites"; it stops propagation and prevents default before calling `p.onToggle` (55516-55520). Glyph is ★ when on, ☆ when off, coloured `OR_H` at full opacity vs `MU` at 0.55.
  2. `toggleCardioFav(o, label)` (5846-5874): looks the favourite up by `cardioFavKey` = `modality|machine.category|machine.brand` (5830-5834); if found, removes it; else creates `{id:"fav_"+Date.now(), label, emoji: activity.icon, modality, subType, environment, machine, defaults, order:0, useCount:0, lastUsedAt:null, pinned:true}` and prepends it, renumbering everything else (5850-5872).
  3. Each call site bumps `favTick` purely to force a re-render (56592, 56678, 56825).
- Status: PARTIAL
- Evidence for status: 5863-5864 — `useCount` and `lastUsedAt` are initialised and **never updated anywhere**; picking a favourite (56221) does not touch them.
- Notes: `favShape()` (56418-56425) stores only `{durationSec, surface}` in `defaults` — never `metrics` — even though `CardioLogFlow` reads `preset.defaults.metrics` on mount (56365-56368). That read path is currently unreachable dead code unless a favourite is written by some other code path (UNVERIFIED). `subType` in `toggleCardioFav` is likewise never supplied by any cardio call site in range.

### F-CARDIO-024 Preset (favourite) prefill of the log flow
- Location: Cardio > Favorites > tap a favourite → Log
- Behavior:
  1. `step` starts at `"form"` when `cardioActivity(preset.modality)` resolves, else `"activity"` (56344-56347).
  2. `activity` = `cardioActivity(preset.modality)` (56348-56350); `machine` = `preset.machine` (56351-56353).
  3. `durMin` = `round(preset.defaults.durationSec / 60)` as a string, else `""` (56354-56357).
  4. `surface` = `preset.defaults.surface` or null (56359-56361).
  5. `mx` = `ceMerge(preset.defaults.metrics, {})` or `{}` (56365-56368).
  6. `distVal` and `notes` always start empty (56358, 56369).
- Status: PARTIAL
- Evidence for status: 56365-56368 reads `defaults.metrics`, which `favShape()` (56418-56425) never writes — the metrics branch is unreachable via the in-app flow.

### F-CARDIO-025 Custom cardio activities ("Yours" group)
- Location: Cardio > Log > step 1, "YOURS" group
- Behavior: `p.customCardio` entries are mapped into pool items with `group:"Yours"`, `fields:"plain"`, `custom:true` and a carried `met` (56500-56504); the "Yours" group is prepended when non-empty (56505). `App` supplies them from `customs.filter(c => c.type === "cardio")` (57635-57637).
- Status: PARTIAL
- Evidence for status: `onCustomCardio` is passed down by `App` (57638-57643) but grep shows **no reference to it anywhere in the cardio module** — there is no UI in 55510-57185 to create a custom cardio activity.
- Notes: a custom activity's `met` is carried onto the pool item but `ceActivityMap(id)` will not find its id and falls back to `{m:"other", met:6.0}` (6698-6700) — so the custom MET is **ignored by the estimator**. Every custom activity is estimated at MET 6.0. Bug.

### F-CARDIO-026 Calorie estimation (consumption of the CARDIO v2 engine)
- Location: form live estimate and save
- Behavior: `cardioEstimate(rec, body)` is called from exactly two places in range — `est` (56414) and `save()` (56433). Body profile comes from `cardioBodyProfile(p.profile, ld("fuelProfile", {}), ld("weightLog", []))` (56386). Full math in the "Calorie estimation math" section below.
- Storage read: `lk_fuelProfile`, `lk_weightLog` (56386)
- Status: WORKING — 56414, 56433.
- Notes: `cardioEstimate` never throws (it wraps `ceEstimateCalories` in try/catch and falls back to a MET-6.0 tier-5 result, 6816-6829).

---

## PART B — Function index (everything in 55510-57185)

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| `CardioStar` | component | 55510-55544 | ★/☆ favourite toggle button | CardioFavorites, CardioLogFlow (x3) | `p.onToggle` | F-CARDIO-023 |
| `CardioFavorites` | component | 55550-55779 | Favorites tab: chips, list, edit mode | CardioSection (56270) | `cardioFavorites`, `cardioPrefs`, `saveCardioFavorites`, `CardioStar`, `Ic`, `lkKeyActivate` | 002,003,004,005 |
| `setFavs` | handler | 55557-55560 | Persist + set favourites state | move/rename/remove/star | `saveCardioFavorites`, `setFavsRaw` | 004,005 |
| `move` | handler | 55561-55570 | Reorder a favourite by ±1 | ▲/▼ buttons | `setFavs` | 005 |
| `rename` | handler | 55571-55578 | Commit a favourite rename | input blur/Enter | `setFavs` | 005 |
| `remove` | handler | 55579-55582 | Delete a favourite | "Delete?" button | `setFavs` | 005 |
| `summaryLine` | function | 55584-55595 | "brand · N min" sub-line | favourite rows | — (reads `CARDIO_MACHINES`) | 004 |
| `cardioSecsOf` | function | 55800-55802 | Session seconds, v2 field with v1 fallback | weekBuckets, PBs, zoneTime, line, detailRows | — | 008-012 |
| `cardioMetresOf` | function | 55803-55807 | Session metres, v2 with v1 fallback | PBs, line, detailRows | `cardioDistToM` | 010,012 |
| `cardioWeekBuckets` | function | 55811-55844 | 8 Monday-start weekly buckets | CardioHistory (55954) | `isoDay`, `cardioSecsOf`, `cardioSessionCalories` | 008,009 |
| `cardioPBs` | function | 55846-55899 | Personal bests across a record list | CardioHistory (55958) | `cardioSecsOf`, `cardioMetresOf`, `ceActivityMap`, `cardioDist`, `secToClock`, `cardioSplit500`, `cardioSessionCalories` | 010 |
| `take` | function (inner) | 55849-55854 | Keep the better of two candidates | cardioPBs | — | 010 |
| `cardioZoneTime` | function | 55903-55922 | Minutes per HR zone by session average | CardioHistory (55959) | `cardioMaxHr`, `cardioZones`, `cardioZoneOf`, `cardioSecsOf` | 011 |
| `CardioHistory` | component | 55924-56212 | History tab | CardioSection (56274) | `cardioActivity`, `cardioWeekBuckets`, `cardioPBs`, `cardioZoneTime`, `Ic` | 006-012 |
| `line` | function (inner) | 55961-55970 | "N min · X km · Y cal" row sub-line | session rows | `cardioSecsOf`, `cardioMetresOf`, `cardioDist`, `cardioSessionCalories` | 012 |
| `detailRows` | function (inner) | 55972-56003 | Expanded session detail rows | session cards | `cardioSecsOf`, `cardioMetresOf`, `ceActivityMap`, `cardioPaceSecPerKm`, `cardioSpeedKph`, `cardioSplit500`, `secToClock`, `ceSurface` | 012 |
| `CardioSection` | component | 56216-56286 | Cardio screen shell + tabs | App (57631) | `cardioFavorites`, CardioFavorites, CardioHistory, CardioLogFlow, `Ic` | 001 |
| `openLog` | handler | 56221-56225 | Open the log flow with/without a preset | tab callbacks | `setPreset`, `setPresetKey`, `setTab` | 001 |
| `CE_FIELDS` | const (data) | 56297-56324 | Field definitions: label, unit, kind, icon, engine flag, hint | numField, field split | — | 015 |
| `CE_FIELD_KEY` | const (data) | 56326-56331 | field id → stored `metrics` key | numField, field split | — | 015 |
| `CE_GROUP_TONE` | const (data) | 56332-56335 | Accent hue per activity group | ceGroupTone | — | 013 |
| `ceGroupTone` | function | 56337 | Group hue lookup with orange default | step 1 render | — | 013 |
| `CardioLogFlow` | component | 56343-56927 | The whole 4-step log flow | CardioSection (56279) | `cardioActivity`, `ceActivityMap`, `cardioBodyProfile`, `cardioEstimate`, `cardioFieldsFor`, `toggleCardioFav`, `isCardioFav`, `findCardioFav`, `cardioFavorites`, `cardioDistToM`, `cardioDist`, `cardioLegacyForModality`, `isoDay`, `ceMerge`, `ceEstimateCard`, `ceSummaryStats`, `CardioStar`, `Ic` | 013-024 |
| `setField` | handler | 56392-56396 | Set one metrics key immutably | numField, rpeField | `ceMerge`, `setMx` | 015 |
| `draft` | function (inner) | 56399-56412 | Build the live/save engine record, converting units | `est`, `save` | `ceMerge`, `ceActivityMap`, `cardioDistToM` | 016,019,020 |
| `favShape` | function (inner) | 56418-56425 | Favourite payload from current form state | hero star, summary star | — | 023 |
| `save` | handler | 56427-56463 | Validate, estimate, build the record, hand it up | Save session button | `draft`, `cardioEstimate`, `findCardioFav`, `cardioFavorites`, `isoDay`, `cardioLegacyForModality`, `cardioDist`, `p.onSave`, `window.LOCKED.toast` | 019 |
| `header` | function (inner) | 56465-56490 | Shared step header with optional back button | steps 1 and 2 | `Ic` | 013,014 |
| `numField` | function (inner) | 56727-56779 | Render one metric input (num / clock / rpe) | engine + console field lists | `rpeField`, `secToClock`, `clockToSec`, `setField`, `ceRowStyle`, `ceRowIcon`, `ceInputStyle`, `ceUnitStyle` | 015 |
| `rpeField` | function (inner) | 56781-56807 | 1-10 effort selector | numField | `setField`, `ceRowIcon` | 015 |
| `ceLabelStyle` | function | 56974-56976 | Section label style object | form sections | — | 015 |
| `ceCardStyle` | function | 56977-56979 | Card container style object | form sections, ceSummaryStats | — | 015,022 |
| `ceRowStyle` | function | 56980-56982 | Form row style object | numField, form rows | — | 015 |
| `ceRowIcon` | function | 56983-57006 | 28px icon tile for a form row | numField, rpeField, form rows | `Ic` | 015 |
| `ceInputStyle` | function | 57007-57015 | Right-aligned input style object | numField, form rows | — | 015 |
| `ceUnitStyle` | function | 57016-57018 | Unit suffix style object | numField, form rows | — | 015 |
| `CeCount` | component | 57019-57044 | rAF count-up number, reduced-motion aware | ceEstimateCard (57121) | `useState`, `useRef`, `useEffect`, `matchMedia`, `requestAnimationFrame` | 017 |
| `step` | function (inner) | 57031-57039 | One rAF frame of the count-up easing | CeCount effect | `setShown`, `requestAnimationFrame` | 017 |
| `CeTierMeter` | component | 57052-57071 | Five-bar estimate-quality meter | ceEstimateCard (57128) | — (reads `CE_CONFIDENCE_LABEL`) | 018 |
| `ceEstimateCard` | function (render helper) | 57078-57140 | The calorie estimate card | CardioLogFlow (56829, 56673) | `CeCount`, `CeTierMeter`, `ceImproveHint` | 016 |
| `ceImproveHint` | function | 57142-57146 | "What one more number buys you" copy | ceEstimateCard (57137) | — | 016 |
| `ceSummaryStats` | function (render helper) | 57149-57185 | Derived pace/speed/split/power/gross rows | CardioLogFlow (56674) | `ceActivityMap`, `cardioDist`, `cardioPaceSecPerKm`, `cardioSpeedKph`, `cardioSplit500`, `secToClock`, `ceCardStyle` | 022 |

**Totals: 7 components, 34 named functions/handlers/render-helpers, 3 constant data blocks — 44 entries.**

---

## Cardio log flow

Runtime order (the source defines step 4 before step 3 — see 56651 vs 56693):

1. **`activity`** (56495-56601) — collects `activity` (a `CARDIO_ACTIVITIES` or custom entry) and seeds `surface` from `ceActivityMap(a.id).surface` (56555-56556). Search box filters the pool (56526-56527). Each tile also carries a favourite star (56590-56594).
   - Branch: `a.machine` truthy → step `machine`; else → step `form` (56557).
   - Skipped entirely when a preset resolves to a known activity (56344-56347).
2. **`machine`** (56602-56650) — collects `machine = {category, brand, model:null}`. Three exits, all to `form`: a brand (56618-56621), "My machine isn't listed" → `brand: null` (56631-56634), "Skip" → `machine = null` (56643). Back → `activity` (56608). Copy states explicitly the machine never changes the estimate (56611).
3. **`form`** (56693-56926, the fall-through render) — collects `durMin` (required), `distVal`, engine metrics, `surface`, `ridePos`, console metrics, `notes`. Live estimate re-renders on every change (56414). Back → `machine` if the activity has one, else `activity` (56763-56764). Save is disabled until `durMin > 0` (56956).
4. **`done`** (56652-56692) — no collection; displays the estimate (big card), derived stats, a favourite toggle, and Done. Entered only via `save()` (56462). Done → `p.onDone` → History tab (56688, 56283).

There is **no back path out of `done`** — the flow can only go forward to History or be remounted.

## Activity and machine catalogue

**41 built-in activities** in `CARDIO_ACTIVITIES` (5486-5532), consumed as `pool` at 56505:

- **Machines (17)** — treadmill_run, treadmill_walk, curved_tread, bike_upright, bike_recumbent, spin, air_bike, elliptical, arc, stairmill, step, row, ski_erg, versaclimber, jacobs, hand_cycle, treadclimber (5488-5504).
- **Indoor (6)** — jump_rope, hiit, dance, boxing, stairs, swim (5506-5511).
- **Outdoor (12)** — run, trail_run, walk, hike, ruck, road_cycle, gravel, mtb, open_water, paddle, ski, skate (5513-5524).
- **Sport (6)** — basketball, soccer, tennis, squash, hockey, sport_other (5526-5531).
- **Yours** — user customs injected at 56500-56504.

**15 machine categories** in `CARDIO_MACHINES` (5572-5588): treadmill, curved, bike, spin, airbike, elliptical, arc, stairmill, step, rower, skierg, versaclimber, jacobs, handcycle, treadclimber. Used for the step-2 title (56604-56607) and the favourites summary line (55588-55591).

**25 brands** in `CARDIO_BRANDS` (5590-5616): Technogym, Life Fitness, Precor, Matrix, Cybex, StairMaster, Woodway, Concept2, Peloton, NordicTrack / iFIT, Sole, Bowflex, Assault Fitness, Rogue, Hydrow, Echelon, TrueForm, Star Trac, Nautilus, Schwinn, WaterRower, Keiser, Stages, Wattbike, Other. Step 2 renders all except "Other" — **24 rows** (56614-56615). Every brand's `models` array is unused (see F-CARDIO-014).

**14 field presets** in `CARDIO_FIELDS` (5469-5484): tread, curved, bike, spin, ellip, stair, erg, climb, outrun, ruck, outbike, swim, rounds, plain.

**14 surfaces** in `CE_SURFACE` (5973-5987): treadmill, track, pavement (all 1.00), grass 1.08, dirt 1.10, gravel 1.15, trail 1.20, woodchip 1.27, sandWet run 1.30 / walk 1.50, sandDry run 1.60 / walk 2.40, mud 1.80, snowLight 2.50, snowMedium 3.30, snowDeep 4.10.

**4 riding positions** in `CE_RIDE_POSITIONS` (6704-6709): upright CdA 0.42, hoods 0.36, drops 0.32, aero 0.28.

## Calorie estimation math

The UI calls exactly one entry point, `cardioEstimate(rec, bodyProfile)` (6809-6834), from 56414 (live) and 56433 (save).

**Step 1 — build the engine input.** `cardioEngineInput(rec)` (6746-6807) maps the catalogue activity id to an engine modality via `CE_ACTIVITY_MAP` (6655-6697), defaulting to `{m:"other", met:6.0}` (6698-6700). Grade is derived two ways:

```js
if (mx.inclinePct != null && w.distanceM) w.grade = parseFloat(mx.inclinePct) / 100;
else if (mx.elevationGainM != null && w.distanceM) {
  w.grade = parseFloat(mx.elevationGainM) / parseFloat(w.distanceM);
}
```
(6757-6761)

Stairs convert to vertical metres by convention — a floor is 3 m, a step 0.2 m (6768-6772). Indoor cycling deliberately discards distance so speed-derived power cannot be used (6779-6781). A pack weight promotes the profile: `prof.carriedKg = parseFloat(mx.packKg)` (6812).

**Step 2 — tiered model selection.** `ceEstimateCalories(w, profile, env, opts)` (6397-6486) picks the highest rung whose inputs exist. Net is preferred (`preferNet !== false`, 6400) and `restKcal = ceRmrKcalPerMin(profile) * dur` is subtracted from gross (6408-6410).

| Tier | Method id | Applies when | Formula | Error band |
|---|---|---|---|---|
| 1 | `concept2-split` | `splitSecPer500m` and modality rowing/skierg | `watts = 2.80 / (sec500/500)^3` (6319), then `ceConcept2Kcal` | ±12% (6432) |
| 1 | `erg-power` | `avgWatts` and rowing/skierg | `kJ = W·min·60/1000`, `kcal = kJ / KJ_PER_KCAL / ROWING_GE` | ±12% (6436) |
| 1 | `vertical-work` | `verticalMetres` and modality stairs | `ceStairClimbKcal` (6329-6334) | ±15% (6439) |
| 1 | `power-meter` | cycling with `avgWatts` | `ceCyclingKcal` | ±10% (6452-6455) |
| 2 | `martin-power-model` | cycling with distance/segments, no watts | Martin et al. 1998 via `ceCyclingPowerWatts` (6244-…) — CdA from ride position, Crr from `CE_CRR`, air density from `ceAirDensity` | ±20% (6452-6455) |
| 2 | `pandolf-santee` | running/walking/hiking **and** (modality is hiking **or** `carriedKg > 0`) and distance present | `ceLoadCarriageKcal` → `cePandolfWatts` | ±20% (6461-6463) |
| 2 | `minetti-environment` | remaining foot travel with a distance | `ceAmbulationKcal` (6126-6177) | ±18% (6466-6473) |
| 2 | `distance-rule` | running with distance and nothing else | `ceRunningKcalFromDistance(km, kg)` (6386) | ±20% (6480-6482) |
| 3 | `keytel-hr` | `avgHr` present, not swimming, `age` known | `ceKeytelKcalPerMin` (6350) | ±25% (6476-6478) |
| 4 | `met-lookup` (specific) | a MET row picked from a speed/watts table | `ceMetToKcalPerMin(met, kg) * dur * heat` | ±28% (6423-6427) |
| 5 | `met-lookup` (generic) | bare activity MET | same | ±40% (6423-6427) |

**Pandolf 1977 + Santee downhill correction** (6184-6198) — this is the `model: "pandolf-santee"` string at 6234 (a metabolic model name, **not** an AI model):

```js
var eta = CE_PANDOLF_TERRAIN[o.terrain] || 1.0;
var loadTerm = L > 0 ? 2.0 * (W + L) * Math.pow(L / W, 2) : 0;
var M = 1.5 * W + loadTerm + eta * (W + L) * (1.5 * V * V + 0.35 * V * G);
if (G < 0) {
  var cf = eta * (
    (G * (W + L) * V) / 3.5
    - ((W + L) * Math.pow(G + 6, 2)) / W
    + (25 - V * V)
  );
  M = M - cf;
}
return Math.max(1.5 * W, M);
```
Inputs: bodyweight kg, load kg, speed m/s, grade **percent**, terrain factor. Terrain factors `CE_PANDOLF_TERRAIN` (5999-6003): treadmill/pavement 1.0, dirt 1.1, lightBrush 1.2, heavyBrush 1.5, mud 1.8, sandDry 2.1, snowLight 2.5, snowMedium 3.3, snowDeep 4.1.

**Minetti polynomials** power the non-load foot model (6061-6069, applied at 6131-6132):
```js
var costFn = mode === "walking" ? ceMinettiWalkJPerKgPerM : ceMinettiRunJPerKgPerM;
var surfaceMult = mode === "walking" ? surface.walk : surface.run;
...
locomotionJ += costFn(grade) * surfaceMult * totalKg * segD;
aeroJ       += ceRunAeroJPerKgPerM(groundSpeedMps, headwind, totalKg, {airDensity: rho}) * totalKg * segD;
netKcal = ((locomotionJ + aeroJ) / CE.J_PER_KCAL) * ceHeatMultiplier(env);
```
(6126-6160)

**RMR / net conversion** — Harris-Benedict (6047-6052), per-minute at 6053-6059:
```js
if (profile.heightCm == null || profile.age == null || profile.sex == null) {
  return profile.weightKg / 60;            /* fallback, roughly 1 MET */
}
return ceHarrisBenedictKcalPerDay(profile) / 1440;
```
This is why the estimate card nags for height/age/sex (57138-57140) — without them RMR is a 1-MET approximation and `bodyComplete` is false (6831).

**RPE scaling of a generic MET** (6800-6805):
```js
var rpe = parseFloat(mx.rpe);
if (rpe) { w.met = map.met * (0.7 + 0.06 * ccClamp(rpe, 1, 10)); w.metIsSpecific = true; }
```
So RPE 1 → 0.76×, RPE 5 → 1.0×, RPE 10 → 1.3× the table MET. This is exactly the set of activities for which the form files RPE under "CHANGES THE ESTIMATE" (`rpeCounts`, 56702).

**Fallback when the engine returns null** (6816-6829): MET 6.0, gross − rest, range ×0.6/×1.4, tier 5, `met-lookup`, confidence `low`.

**Rounding**: every displayed calorie value passes through `ccRound5` — nearest 5 (6410-6415, 5945-ish). The count-up animation also rounds each frame to 5 (57037).

**Environment**: `cardioEnv(rec)` reads only `metrics.tempC` (6839-6844). No cardio form field in range writes `tempC` (`CE_FIELDS`, 56297-56324, has no temperature entry), so the environment is **always empty** and heat/air-density corrections always run at standard conditions. Comment at 6836-6838 acknowledges there is no weather API.

## Cardio record shape

Written by `save()` (56435-56461):

| Field | Value | Line |
|---|---|---|
| `id` | `"w_" + Date.now()` | 56436 |
| `type` | `"cardio"` | 56437 |
| `name` | `activity.name` | 56438 |
| `date` | `toLocaleDateString("en-US",{month:"short",day:"numeric"})` | 56439 |
| `dateISO` | `isoDay()` | 56440 |
| `dur` | `"<N> min"` | 56441 |
| `schemaVersion` | `CARDIO_SCHEMA` = 2 | 56445 |
| `modality` | `activity.id` | 56446 |
| `durationSec` | integer seconds | 56447 |
| `distanceM` | metres or `null` | 56448 |
| `surface` | surface id or `null` | 56449 |
| `environment` | `"outdoor"` if `activity.group === "Outdoor"`, else `"indoor"` | 56450 |
| `machine` | `{category, brand, model:null}` or `null` | 56451 |
| `metrics` | SI-converted metrics object (keys per `CE_FIELD_KEY`, 56326-56331, plus `ridePosition` for cycling) | 56452 |
| `heartRate` | `{avg: Number}` or `null` | 56453 |
| `intensity` | `{rpe, estMET, talkTest: null}` | 56454 |
| `fasted` | `false` (hardcoded) | 56455 |
| `calories` | `{value, net, gross, range, method, tier, confidence, basis, estimated:true}` or `null` | 56456-56459 |
| `favoriteId` | matching favourite id or `null` | 56460 |
| `source` | `"manual"` (hardcoded) | 56461 |
| `notes` | textarea string | 56462 |
| `cardioType` | v1 legacy id via `cardioLegacyForModality` | 56464 |
| `duration` | v1 minutes | 56465 |
| `distance` | v1 display-unit distance, 2dp | 56466 |
| `distanceUnit` | `"km"` or `"mi"` | 56467 |

Explicitly **absent**: `vol` and `sets`, with a comment explaining that writing them made strength volume totals absorb cardio calories (56442-56444).

`metrics` keys (from `CE_FIELD_KEY`, 56326-56331): `inclinePct`, `elevationGainM`, `avgWatts`, `splitSec`, `floors`, `steps`, `verticalM`, `packKg`, `rpe`, `avgHr`, `level`, `resistance`, `rpm`, `spm`, `spm2`, `drag`, `kj`, `laps`, `pace100Sec`, `rounds` — plus `ridePosition` injected by `draft()` (56403).

Favourite shape (`toggleCardioFav`, 5851-5867): `{id, label, emoji, modality, subType, environment, machine, defaults:{durationSec, surface}, order, useCount, lastUsedAt, pinned}`.

## Storage keys touched

All go through `ld`/`sd`, which prefix `lk_` (2417-2425, 2435).

| Key | Read at | Written at | Notes |
|---|---|---|---|
| `lk_cardioFavorites` | 55551, 56218, 56282, 56591 (via `isCardioFav`), 56655, 56434 — all resolving to 5822 | 55558 (via 5826), 56592/56678/56825 (via `toggleCardioFav`, 5869) | The only key this module writes directly |
| `lk_cardioPrefs` | 55555 (`cardioPrefs`, 5647), 55908 (via `cardioMaxHr`, 5665) | never in this range | `prefs` at 55555 is unused |
| `lk_fuelProfile` | 56386 | never | body profile fallback |
| `lk_weightLog` | 56386 | never | body profile fallback |
| `lk_history` | indirectly — records reach `App`'s `setHistory` (57649-57653) | indirectly | persistence itself is outside this range |

Also referenced in the app-wide key list at 192: `lk_cardioFavorites`, `lk_cardioPrefs`, `lk_cardioMigrated`.

**Secrets: none found in 55510-57185.** No API keys, tokens, endpoints, or credentials appear anywhere in the range. No network calls of any kind — the entire cardio module is local-only.

## Open questions / UNVERIFIED

1. **`lk_history` persistence** — `p.onSave` prepends to `App`'s `history` (57649-57653), but the `setHistory` implementation is outside my range. UNVERIFIED that a saved cardio session survives a reload. Confirm by reading `setHistory` in the App component.
2. **Migration of v1 cardio records** — `CARDIO_LEGACY_MODALITY` (6947-6950) and `lk_cardioMigrated` (192) imply a migration runs at boot; nothing in my range invokes it. UNVERIFIED whether `CardioHistory` ever sees unmigrated v1 records (its `cardioSecsOf`/`cardioMetresOf` fallbacks at 55800-55807 suggest yes).
3. **Custom cardio creation** — `onCustomCardio` reaches `CardioLogFlow` through the prop spread (56279) but grep finds no consumer in the file besides its definition (57638). UNVERIFIED whether custom cardio can be created from any other screen (e.g. ProfileScreen `onCustom`, 57659).
4. **`favShape().defaults.metrics`** — read at 56365-56368, never written by any in-range code path. UNVERIFIED whether any other writer populates it.
5. **`useCount` / `lastUsedAt`** — initialised at 5863-5864, never incremented. UNVERIFIED whether any planned sort or "most used" surface depends on them.

### Notable bugs and dead code (all cited above)

1. **`CE_SURFACE_TO_PANDOLF` is dead** (6005-6011) — grep shows zero references. `ceLoadCarriageKcal` reads `a.pandolfTerrain` (6220, 6233) which `cardioEngineInput` never sets, so **every hike and every ruck is computed on terrain factor 1.0 (pavement)** regardless of the surface the user picked. The surface chip is presented as "the biggest lever there is" (56903) but is silently ignored for exactly the two activities routed to Pandolf (6461-6463).
2. **Custom activities always estimate at MET 6.0** — the custom item carries `met` (56504) but `ceActivityMap` cannot resolve a custom id and returns `{m:"other", met:6.0}` (6698-6700).
3. **Zone model preference ignored** — `cardioZoneTime` calls `cardioZones()` with no argument (55905), so `lk_cardioPrefs.zoneModel === "3zone"` (5651) never takes effect in the History chart.
4. **Sub-zone-1 heart rates counted as Recovery** — `if (z < 0) z = 0` (55917-55918) contradicts the explicit intent of `cardioZoneOf` returning -1 (comment 5692-5696).
5. **Star identity mismatch** — step-1 tiles toggle with `machine: null` (56591); the form and summary toggle with `favShape()` including the machine (56425, 56677). `cardioFavKey` includes the machine category and brand (5830-5834), so the same activity yields two distinct favourites and the star state visibly disagrees between step 1 and step 3.
6. **No ≥500 m floor on the summary split** — `ceSummaryStats` (57177-57180) vs `detailRows` (55993-55995).
7. **`prefs` computed and unused** in `CardioFavorites` (55555).
8. **Duplicated `WebkitOverflowScrolling`** in four scroll containers (55654/55656, 56010/56012, 56093/56095, 56865/56866).
9. **`machine.model` is always null** and `CARDIO_BRANDS[].models` (5590-5616) is never rendered — a whole tier of the data model has no UI.
10. **No temperature input** exists in `CE_FIELDS` (56297-56324), so `cardioEnv` (6839-6844) always returns `{}` and every heat/air-density term in the engine runs at standard conditions.
11. **Outdoor cycling defaults to `upright`** — `ridePos` state initialises to `"upright"` (56362) and `draft()` always writes it (56403), pre-empting the engine's own outdoor default of `"drops"` (6775). Outdoor rides are therefore estimated at CdA 0.42 rather than 0.32 unless the user changes the chip — roughly a 30% swing by the app's own copy (56888).
12. **Unsaved work is discarded silently** — `presetKey` remounts `CardioLogFlow` on every favourite pick and after Done (56222-56224, 56283).
