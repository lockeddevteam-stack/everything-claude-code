# Agent 2b — Train / Workout Logging Audit

Range audited: `redesign/input/locked-current-v6.html:8782-13955` (read from 8625 for `ReplacePanel` context).
Components: `ReplacePanel` (8625-8781), `SplitBuilder` (8782-9846), `NumPad` (9847-10012), `WorkoutLog` (10013-13955).
File abbreviated below as `v6.html` = `redesign/input/locked-current-v6.html`.

All weights are stored in the unit returned by `storedWeightUnit()` (v6.html:4379) and converted for display by `kgToDisp`/`dispToKg` (v6.html:4430-4452).

---

# PART A — Features

### F-TRAIN-100 Replace exercise (search alternatives)
- Location: Train > Workout Log > exercise card > hold > "Swap exercise" > Replace Exercise panel
- User action: Types into the search box or taps one of the suggested alternatives ("Swap").
- Behavior:
  1. `WorkoutLog` sets `repIdx = ri` and `view = "replace"` (v6.html:10297).
  2. `ReplacePanel` renders full-screen with the current exercise named in the subheader (v6.html:8672-8680).
  3. With query length <= 1 it lists up to 6 exercises with the same `muscle`, excluding itself (v6.html:8630-8635).
  4. With query length > 1 it lists up to 8 exercises whose `name` contains the query, case-insensitive, excluding itself (v6.html:8628-8631).
  5. Tapping a row calls `p.onSelect(e)` (v6.html:8737-8739) → `WorkoutLog` replaces the row wholesale with `mkRow(ex.id)` (v6.html:11424-11431), returning to `view="log"`.
- Components: `ReplacePanel` (v6.html:8625-8781)
- Functions: inline filter/render only; consumer wiring at v6.html:11417-11433
- State: local `q` (v6.html:8626); parent `repIdx`, `view`
- Storage: none directly (the replacing `mkRow` reads `p.history` in memory)
- Network: none
- AI: none
- Edge cases: `if (!ex) return null` when the row is missing (v6.html:8628). "No results" shown when the filtered list is empty (v6.html:8772-8780).
- Gating: always on
- Status: WORKING
- Evidence for status: v6.html:11424-11431 — the swap handler rebuilds the row and returns to the log view.
- Notes: **Data loss** — replacing discards all sets already logged on that row because `mkRow` builds a fresh row (v6.html:11427). No confirm. Search does not match muscle or equipment, only `name`.

### F-TRAIN-101 Split builder — name a split
- Location: Train > Splits > New Split / Edit Split > name input
- User action: Types the split name.
- Behavior: controlled input writes `name` (v6.html:9256-9276); SAVE is disabled until `name.trim()` and at least one day exist (v6.html:9800-9815).
- Components: `SplitBuilder` (v6.html:8782-9846)
- Functions: `save` (v6.html:9188-9219)
- State: `name` (v6.html:8784)
- Storage: written by the parent via `p.setSplits` (v6.html:15045-15050); persisted under `lk_splits` by the app shell (outside range).
- Network: none in range
- Edge cases: whitespace-only name keeps SAVE disabled.
- Gating: always on
- Status: WORKING
- Evidence for status: v6.html:9800 disabled expression matches the `save` guard at v6.html:9189.

### F-TRAIN-102 Split builder — add / rename / remove day
- Location: Train > Splits > builder > "Add a new day" card and day header
- User action: Types a day name and taps Add (or presses Enter); taps the day title or pencil to rename; taps the red × to delete the day.
- Behavior:
  1. `addDay` rejects an empty name with a toast "Name the day first — Push, Legs, whatever you call it." (v6.html:9125-9131).
  2. Otherwise appends `{name, items: []}` and clears the input (v6.html:9132-9137).
  3. Rename: tapping the title or pencil sets `renamingDay`/`renameVal`; the inline input commits on blur or Enter and cancels on Escape (v6.html:9309-9372).
  4. `removeDay(di)` filters the day out immediately, **no confirmation** (v6.html:9139-9145).
- Components: `SplitBuilder`
- Functions: `addDay` (9124-9138), `removeDay` (9139-9145)
- State: `days`, `dayName`, `renamingDay`, `renameVal`
- Storage: none until SAVE
- Network: none
- Edge cases: rename with an empty value silently reverts (v6.html:9315-9327).
- Gating: always on
- Status: WORKING
- Evidence for status: v6.html:9132-9137 — append + clear.
- Notes: deleting a day with exercises in it is irreversible and unguarded (v6.html:9139).

### F-TRAIN-103 Split builder — add exercise to a day
- Location: Train > Splits > builder > day card > "+ Exercise"
- User action: Taps "+ Exercise", picks from the exercise library.
- Behavior: sets `picking = di`, `view = "pick"` (v6.html:9704-9707) → renders `ExLib` (v6.html:9221-9229) → `pickEx` appends `{type:"ex", id}` to that day's `items` and returns to build (v6.html:9174-9187).
- Components: `SplitBuilder`, `ExLib` (v6.html:7761, outside range)
- Functions: `pickEx` (9174-9187)
- State: `picking`, `view`, `days`
- Storage: custom exercises via `p.onCustom` (passed through, v6.html:9227)
- Gating: always on
- Status: WORKING
- Evidence for status: v6.html:9176-9184 — items concat on the picking day.

### F-TRAIN-104 Split builder — add a note "Block" to a day
- Location: Train > Splits > builder > day card > "📝 Block"
- User action: Taps "📝 Block", then fills Note title / Details / Duration inline.
- Behavior: appends `{type:"block", title:"", notes:"", duration:""}` (v6.html:9724-9736); three inline inputs write through `updateBlock` (v6.html:9160-9173, UI 9622-9679).
- Components: `SplitBuilder`
- Functions: `updateBlock` (9160-9173), `removeItem` (9146-9159)
- State: `days`
- Gating: always on
- Status: WORKING
- Evidence for status: v6.html:9724-9736 — concat of a block item.
- Notes: `duration` is a free-text string, never parsed or validated anywhere in range (v6.html:9660-9679).

### F-TRAIN-105 Split builder — drag to reorder items within a day
- Location: Train > Splits > builder > day card > grab handle (3 bars) on an exercise or block row
- User action: Touch-and-hold the handle 350 ms, drag vertically, release.
- Behavior:
  1. `sbLongStart` arms a 350 ms timer; >10 px of movement before it fires cancels (v6.html:8813-8830).
  2. On fire: snapshots the geometry of all `[data-sbday][data-sbrow]` rows, lifts the dragged row (`scale(1.03)`, shadow, z-index 100), vibrates 30 ms (v6.html:8831-8890, 8965).
  3. `sbUpdateTarget` translates the row with the finger and shifts neighbours by `±H`, with a 10 ms tick each time the insertion index changes (v6.html:8967-9001).
  4. Edge auto-scroll: within 100 px of the top/bottom, after a 150 ms dwell, `lkScrollBy` runs each frame (v6.html:9100-9123).
  5. `sbDragEnd` runs a spring animation (`SPRING.snap`, v6.html:2067) to the destination, then commits the reorder with `splice` and an 8 ms tick (v6.html:9010-9086).
  6. Escape or `touchcancel` cancels the move (v6.html:8930-8944).
- Components: `SplitBuilder`
- Functions: `sbLongStart` (8813-8966), `sbUpdateTarget` (8967-9001), `sbLongCancel` (9002-9011 area — 8993-9001+), `sbDetach` (9-…, v6.html:8993-9000/`sbDetach` 8993), `sbReset` (9002-9012), `sbDragEnd` (9013-9086)
- State: `sbDrag`, refs `sbDragRef`, `sbDragYRef`, `sbLongRef`, `sbHandlersRef`, `sbWaitMoveRef`, `sbVelRef`, `sbDropRafRef`, `sbGeoRef`
- Storage: none
- Edge cases: unmount cleanup removes listeners and cancels the RAF (v6.html:9087-9099).
- Gating: always on — touch only. There is no mouse/pointer path (`if (!e.touches...) return`, v6.html:8814).
- Status: PARTIAL
- Evidence for status: v6.html:8814 — `sbLongStart` returns early without `e.touches`, so reordering is impossible on a desktop/mouse browser.
- Notes: dead locals `dragTarget`, `dragY`, `dragItem` (v6.html:9232-9236) and `isDraggingThis`/`spacer` hardcoded `false`/`null` (v6.html:9445-9447, 9545) — leftovers from an older drag implementation. `isMinimized`/`bMinimized` are hardcoded `false` (v6.html:9459, 9545) so the "jiggle" branches and the minimized block label are permanently DEAD.

### F-TRAIN-106 Split builder — save split
- Location: Train > Splits > builder > SAVE SPLIT
- User action: Taps SAVE SPLIT.
- Behavior: `save` splits `items` into `exIds` (type `"ex"`) and `blocks` (type `"block"` → `{title, notes, duration}`), emits `{id, name, days, created}` where `id` is the existing id or `"s"+Date.now()`, and `created` is `new Date().toLocaleDateString()` (v6.html:9188-9219). Parent replaces-or-appends into `splits` (v6.html:15045-15052).
- Components: `SplitBuilder`
- Functions: `save` (9188-9219), `initDays` (8785-8804) for the inverse mapping on edit
- State: `name`, `days`
- Storage: `lk_splits` (written by parent, outside range)
- Status: WORKING
- Evidence for status: v6.html:9188-9219 — full round-trip with `initDays`.
- Notes: `save()` returns silently on an invalid state (v6.html:9189) — the disabled button is the only feedback. **Order is not preserved across save/load**: `initDays` rebuilds `items` as all exercises first, then all blocks (v6.html:8786-8803), so a block placed between two exercises jumps to the end after a reload. `created` uses a locale string, not ISO.

### F-TRAIN-107 Number pad (weight / reps entry)
- Location: Train > Workout Log > any weight / reps / L / R cell
- User action: Taps a cell; a bottom pad appears; taps digits, `.`, DEL, ±2.5/±5 chips (weight only), then DONE or CANCEL.
- Behavior:
  1. `setNumpadTarget({ri, si, field, label, unit})` from the cell (e.g. v6.html:13182-13190).
  2. `NumPad` mounts keyed by `ri_si_field` so switching cells re-seeds the initial value (v6.html:13692-13697).
  3. `tap` handles digits, single decimal point (`""` → `"0."`), leading-zero replacement, DEL, and a hard 6-character cap (v6.html:9853-9863).
  4. `increment(n)` (weight only) clamps to `[0, 9999]` and rounds to 2 dp (v6.html:9864-9873).
  5. DONE calls `p.onDone(val)` → `setVal(...)`, which converts a weight from the display unit to the stored unit via `dispToKg` (v6.html:10716-10717) and closes the pad.
- Components: `NumPad` (v6.html:9847-10012)
- Functions: `tap` (9853-9863), `increment` (9864-9873)
- State: local `val`; parent `numpadTarget`
- Storage: indirectly `lk_activeWorkoutRows` via the rows effect (v6.html:10659-10668)
- Edge cases: `useEscape(p.onCancel)` closes it (v6.html:9851). Rendered via `lkPortal(..., {lock:false})` — deliberately non-modal so the page behind stays scrollable (v6.html:9875-9879, 10011).
- Gating: always on
- Status: WORKING
- Evidence for status: v6.html:13692-13697 — the `key` comment documents a fixed bug where DONE wrote the previous cell's value.
- Notes: `isWeight` is decided by string-comparing the label to `"Weight"` (v6.html:9849) — a fragile coupling; "Left Reps"/"Right Reps" correctly get no ± chips. No max/negative guard on typed digits (only on `increment`).

### F-TRAIN-108 Start / resume an active workout session
- Location: Train > Workout Log (screen)
- User action: Starts a workout from a split or empty; on reload/return the session resumes.
- Behavior:
  1. `rows` initialises from `ld("activeWorkoutRows", null)`; if absent, from `p.exIds.map(mkRow)` concatenated with `p.blocks.map(mkBlock)` (v6.html:10387-10396).
  2. `sec` initialises from `ld("activeWorkoutSec", 0)` (v6.html:10397-10399).
  3. `startTimeRef` back-dates to `Date.now() - sec*1000` so the elapsed clock survives a reload (v6.html:10530-10538).
  4. A 500 ms interval recomputes elapsed from wall time; `visibilitychange` re-syncs on return (v6.html:10539-10570).
  5. Rows and seconds are persisted on every change, **but only when some progress exists** (any `done`, `w`, `r`, `rL`, `rR`) (v6.html:10659-10668).
- Components: `WorkoutLog`
- Functions: `mkRow` (10052-10130), `mkBlock` (10131-10145)
- State: `rows`, `sec`, `startTimeRef`, `secRef`
- Storage: reads/writes `lk_activeWorkoutRows`, `lk_activeWorkoutSec`; parent also uses `lk_activeWorkout` (v6.html:57925-57928)
- Network: none
- Status: PARTIAL
- Evidence for status: v6.html:10659-10668 — the persistence guard means a session where the user only reordered rows, added exercises, or added blocks is lost on reload.
- Notes: elapsed time is wall-clock based, so it keeps counting while the app is backgrounded (intended). `secRef` is used for the idle-prompt finish path (v6.html:11629).

### F-TRAIN-109 Auto-prefill from last session ("LAST" row / rec values)
- Location: Train > Workout Log > exercise card > set rows and the LAST line
- User action: None — automatic on adding an exercise.
- Behavior:
  1. `lastSessionIndex` is memoised over `p.history`: for each exercise **name**, the first history entry encountered with non-empty sets wins (history is newest-first, v6.html:57426) (v6.html:10021-10041).
  2. `mkRow` copies those sets into the new row with `done:false` and `rec:true`, preserving `w, r, rL, rR, rir, setType, partials` (v6.html:10056-10073).
  3. With no history, three empty sets are created with `rir:"2"` (v6.html:10074-10105).
  4. `rec:true` renders the value muted and the cell border tinted (v6.html:13173-13181); the first user edit clears `rec` (v6.html:10723-10726).
  5. A "LAST wXr wXr … date" summary line renders only when `row.lastDate` exists, built from the sets still flagged `rec` (v6.html:13322-13345 unilateral, 13617-13646 normal).
- Components: `WorkoutLog`
- Functions: `mkRow` (10052-10130), `getLastSession` (10042-10044), `setVal` (10715-10736)
- State: `rows`, memo `lastSessionIndex`
- Storage: reads `p.history` (from `lk_history`)
- Status: WORKING
- Evidence for status: v6.html:10056-10073 — sets cloned with `rec:true`.
- Notes: matching is by **exercise name string**, not id (v6.html:10029) — a renamed custom exercise loses its history. The LAST line reads `kgToDisp(s.w, useKg)` using the **global** unit, ignoring the row's per-row unit override (v6.html:13334, 13633) — inconsistent with the cells beside it, which use `rowUsesKg(ri)`.

### F-TRAIN-110 "Last done" stale badge
- Location: Train > Workout Log > exercise card header
- User action: None.
- Behavior: `staleLast(ds)` returns true only when the last date is >31 days old, or when `Date.parse` fails (v6.html:10045-10051). Only then does the "· Last: <date>" chip render (v6.html:12960-12971).
- Components: `WorkoutLog`
- Functions: `staleLast` (10045-10051)
- Status: WORKING
- Evidence for status: v6.html:10049-10050 — 31-day threshold, unparseable treated as stale.
- Notes: hardcoded 31 days (v6.html:10050). The dual date format (locale string vs ISO) is acknowledged in the comment at v6.html:10036-10039.

### F-TRAIN-111 Log a set — weight, reps, RIR
- Location: Train > Workout Log > exercise card > set row (grid `# | KG | REPS | RIR | ✓`)
- User action: Taps the weight cell or reps cell (opens NumPad); picks RIR from a `<select>` (0,1,2,3,4,"5+").
- Behavior:
  1. Weight/reps go through `NumPad` → `setVal` (v6.html:13563-13590, 13648-13673).
  2. `setVal` converts `field === "w"` from display to stored unit (`dispToKg(val, rowUsesKg(ri))`), records activity, clears `rec` (v6.html:10715-10736).
  3. RIR writes directly on change (v6.html:13675-13691).
  4. `getSetVal` reads back, converting weights for display (v6.html:11298-11307).
- Components: `WorkoutLog`, `NumPad`
- Functions: `setVal` (10715-10736), `getSetVal` (11298-11307), `rowUsesKg` (10707-10714), `noteActivity` (10621-10626)
- State: `rows`, `numpadTarget`, `lastActivityTime`
- Storage: `lk_activeWorkoutRows`
- Edge cases: `rowUsesKg` and `getSetVal` are wrapped in try/catch returning defaults for a missing row (v6.html:10708-10713, 11299-11306).
- Gating: always on
- Status: WORKING
- Evidence for status: v6.html:10716-10717 — unit conversion on write.
- Notes: the RIR `<select>` for the normal path offers `"5+"` (v6.html:13681) but the superset path offers only `0-4` (v6.html:12744-12750) — inconsistent. `"5+"` is a non-numeric string stored in `rir`.

### F-TRAIN-112 Mark a set done (✓) — with haptics, pop animation, PR check and rest start
- Location: Train > Workout Log > exercise card > ✓ button on a set row
- User action: Taps the ✓ checkbox.
- Behavior (`toggleDone`, v6.html:10737-10812):
  1. `noteActivity()`; `navigator.vibrate(30)`.
  2. `setCompletedSetAnim("ri,si")` for 400 ms → `scalePopOut 0.3s` on the row (v6.html:13540).
  3. `flip()` is computed outside the updater (purity fix documented at v6.html:10744-10748), then `setRows(flip)` commits.
  4. If the set became `done` **and** has `w` and `r`: run the PR check (F-TRAIN-120).
  5. If `restEnabled` and the set became `done`: `startRest(restTarget, rowName)` (v6.html:10811).
- Components: `WorkoutLog`
- Functions: `toggleDone` (10737-10812), `startRest` (10645-10655)
- State: `rows`, `completedSetAnim`, `prMsg`, rest state; parent `p.prs` / `p.setPrs`
- Storage: `lk_activeWorkoutRows`; PRs persisted by the parent (`lk_prs`, outside range)
- Status: WORKING
- Evidence for status: v6.html:10809-10811 — the `s.done` guard stops un-ticking from starting a rest (documented regression fix).
- Notes: un-ticking a PR set does **not** roll the PR back (v6.html:10763). Hardcoded 3500 ms PR banner, 400 ms anim, 30/[100,50,100] ms vibration patterns.

### F-TRAIN-113 Add a set / remove a set
- Location: Train > Workout Log > exercise card > "+ Add Set"; swipe-left on a set row
- User action: Taps "+ Add Set" (v6.html:13536-13560), or swipes a set row left past the threshold.
- Behavior:
  1. `addSet(ri)` appends `{w:"", r:"", rir:"2", done:false}` (v6.html:10824-10836).
  2. Swipe: `onTouchStartSet` / `onTouchMoveSet` track dx with velocity smoothing; a >15 px vertical move aborts the swipe; crossing -80 px fires a 10 ms tick; positive dx gets rubber-banding via `swipeRubber` (v6.html:10851-10913).
  3. `onTouchEndSet` deletes when `swipeShouldDelete` (projected position with 0.998 friction < -80 px) (v6.html:10841-10850, 10914-10922).
- Components: `WorkoutLog`
- Functions: `addSet` (10824-10836), `removeSet` (10813-10823), `swipeRubber` (10841-10844), `swipeShouldDelete` (10845-10848), `setSwipe2` (10849-10852), `onTouchStartSet` (10859-10872), `onTouchMoveSet` (10873-10913), `onTouchEndSet` (10914-10922), `onTouchCancelSet` (10923-10925)
- State: `swipe`, `swipeRef`
- Status: PARTIAL
- Evidence for status: v6.html:10828-10833 — `addSet` creates a set missing `rL`, `rR`, `setType` and `partials`, unlike `mkRow`'s shape (v6.html:10074-10105). Downstream code defaults these (`set.setType || "normal"`, v6.html:13096), so it renders, but the data model is inconsistent.
- Notes: swipe-to-delete is touch-only and has no undo and no confirm.

### F-TRAIN-114 Cycle set type: Normal → Warm-up → Drop
- Location: Train > Workout Log > exercise card > the set-number button (`1`, `W`, `D`)
- User action: Taps the number at the left of a set row (title: "Tap to cycle: Normal → Warmup → Drop").
- Behavior:
  1. `toggleSetType` advances `normal → warmup → drop → normal` (v6.html:10214-10240).
  2. On entering `drop` with a preceding set that has a weight, it auto-fills 75 % of that weight rounded to 2.5 (v6.html:10229-10235).
  3. Display: warm-ups show `W` in `WA` colour with an `WA_H+"08"` background and 0.85 opacity; drops show `D` in `OR`, indented 14 px; normal sets get a running counter that skips W/D rows (v6.html:13096-13103, 13584-13592).
  4. Warm-ups are excluded from the session set count and volume totals (v6.html:10692-10706).
- Components: `WorkoutLog`
- Functions: `toggleSetType` (10214-10240)
- Status: WORKING
- Evidence for status: v6.html:10218-10221 — the three-way cycle.
- Notes: hardcoded 0.75 drop factor and 2.5 rounding increment (v6.html:10232) — the 2.5 step is wrong for a lb-configured user. No UI hint that Drop auto-fills the weight.

### F-TRAIN-115 Add warm-up sets automatically
- Location: Train > Workout Log > exercise card > hold > "Add warm-up sets"
- User action: Holds the card, taps "Add warm-up sets".
- Behavior: `addWarmupSets(ri)` finds the first non-warm-up set with a weight, and prepends two warm-ups at 50 % × 8 reps @ RIR 4 and 70 % × 5 reps @ RIR 3, each rounded to 2.5. With no working weight it prepends the same rep/RIR scheme with blank weights (v6.html:10146-10213).
- Components: `WorkoutLog`, `ExerciseActionSheet` (v6.html:7496, outside range)
- Functions: `addWarmupSets` (10146-10213), `actionItems` (10336-10381)
- Status: WORKING
- Evidence for status: v6.html:10159-10186 — the 50 %/70 % construction.
- Notes: hardcoded 0.5/0.7 percentages, 8/5 reps, RIR 4/3, 2.5 rounding (v6.html:10161-10186). Repeated taps stack more warm-ups with no dedupe. The generated warm-up objects omit `partials` (v6.html:10163-10186).

### F-TRAIN-116 Partials counter
- Location: Train > Workout Log > exercise card > below a non-warm-up set row > "PARTIALS + / ✕"
- User action: Taps `+` to add one partial rep; taps `✕` to clear.
- Behavior:
  1. Row rendered only when `!isWarmup && !ld("hidePartials", false)` (v6.html:13470).
  2. `+` increments `set.partials` via `setVal(..., "partials", String(cur+1))` and flashes for 320 ms (`partialsFlash` animation) (v6.html:13494-13514).
  3. `✕` sets `partials` to `""` (v6.html:13515-13529).
  4. When >0, a `+NP` badge is overlaid on the reps cell (v6.html:13662-13673).
- Components: `WorkoutLog`
- Functions: `setVal` (10715-10736)
- State: `partialsFlash`
- Storage: reads `lk_hidePartials` (toggled elsewhere at v6.html:32996)
- Gating: flag — hidden when `lk_hidePartials` is true; hidden on warm-up sets.
- Status: WORKING
- Evidence for status: v6.html:13470 — the render guard and the toggle key.
- Notes: partials are **not** used in the volume calc (v6.html:10700-10706) or in the PR check (v6.html:10763). `ld()` is called during render on every set row (v6.html:13470) — a `localStorage` read per row per render.

### F-TRAIN-117 Unilateral mode (track left & right)
- Location: Train > Workout Log > exercise card > hold > "Track left & right"
- User action: Holds the card, taps "Track left & right" / "Stop tracking left & right".
- Behavior: `toggleUnilateral(ri)` flips `row.unilateral` (v6.html:10241-10251). The card then renders a six-column grid `# | UNIT | L | R | RIR | ✓` with separate L (blue) and R (`FAT` colour) cells, each opening the NumPad with labels "Left Reps"/"Right Reps" (v6.html:13212-13300). The LAST line renders `w×L|R` (v6.html:13334-13338).
- Components: `WorkoutLog`
- Functions: `toggleUnilateral` (10241-10251)
- Status: PARTIAL
- Evidence for status: v6.html:13460-13470 — the partials row exists only in the non-unilateral branch; unilateral rows have no partials control. Also, the PR check only reads `s.r` (v6.html:10763), so a unilateral set logged as L/R with an empty `r` never records a PR.
- Notes: `mkRow` always initialises `unilateral:false` (v6.html:10112) so the setting is not remembered between sessions.

### F-TRAIN-118 Per-row unit override (kg ⇄ lb for one exercise)
- Location: Train > Workout Log > exercise card > hold > "Switch to lbs" / "Switch to kg"
- User action: Holds the card, taps the unit item.
- Behavior: `toggleRowUnit(ri)` sets `row.kg = row.kg === null ? !useKg : !row.kg` (v6.html:10252-10262). `rowUsesKg(ri)` resolves `null` to the global `useKg` (v6.html:10707-10714), and the column header shows the row unit (v6.html:12886-12889, 13602-13615).
- Components: `WorkoutLog`
- Functions: `toggleRowUnit` (10252-10262), `rowUsesKg` (10707-10714)
- Status: PARTIAL
- Evidence for status: v6.html:13334 and 13633 — the "LAST" summary uses the global `useKg`, not `rowUsesKg(ri)`, so the last-session line contradicts the cells below it for an overridden row. The superset B cell at v6.html:12718 does use `rowUsesKg(riBval)` correctly.
- Notes: the header total volume is always shown in the global unit (v6.html:12046-12048), which mixes rows logged in different units without conversion.

### F-TRAIN-119 Superset (link two exercises A/B)
- Location: Train > Workout Log > exercise card > hold > "Make it a superset" / "Remove superset"; the SS card's × button
- User action: Holds a card and taps the superset item.
- Behavior (`toggleSuperset`, v6.html:10382-10420):
  1. If already in a superset, clears `supersetId` on **every** row sharing that id.
  2. Otherwise, if a later exercise row exists, both get a new `supersetId = "ss"+Date.now()`.
  3. If it is the last exercise, `supersetPickRi = ri` and the view switches to `add`; picking an exercise inserts the new row directly after with the shared id (v6.html:11390-11410).
  4. Rendering: only the first row of the pair renders; it draws a combined A/B header, one header grid, and interleaved `1A`/`1B` rows over `numSets = max(A.sets, B.sets)` (v6.html:12310-12868).
  5. "Add Set" adds a set to both rows (v6.html:12824-12831).
  6. A separate swipe handler deletes set index `si` from both rows at once (v6.html:12468-12504).
  7. A's ✓ shows a half-state (`aHalf`, opacity 0.42) until B is also done; when both are done the pair highlights green and A's checkbox is hidden.
- Components: `WorkoutLog`, `ExLib`
- Functions: `toggleSuperset` (10382-10420), `setSsSwipe2` (10853-10856)
- State: `ssSwipe`, `ssSwipeRef`, `supersetPickRi`
- Status: PARTIAL
- Evidence for status: v6.html:12776-12781 — when `pairDone`, A's checkbox gets `opacity: 0` and `pointerEvents: "none"`, so a mis-ticked A set cannot be undone without first un-ticking B.
- Notes: only pairs are supported (`ssRows[1]`, v6.html:12308) — a third row carrying the same id would render nothing. `ssSwipe`'s initial state omits `v`, `t`, `crossed` (v6.html:12474-12480) unlike the set swipe (v6.html:10862-10871), so the first `swipeShouldDelete` projection uses `v = 0`. A comment at v6.html:12762-12764 documents a crash (`set` vs `setA`) that took down the whole workout screen.

### F-TRAIN-120 PR detection during a session + ALL-TIME PR banner
- Location: Train > Workout Log > full-width orange banner at the top
- User action: Ticks a set with both weight and reps filled in.
- Behavior (inside `toggleDone`, v6.html:10761-10808):
  1. `wkg = parseFloat(s.w)`; if `storedWeightUnit() === "lb"` it is divided by `LB_PER_KG` (2.20462, v6.html:4359) so PRs are always stored in kg.
  2. `allPrs = p.prs[exId] || []`; `allTimeBest` = the heaviest entry regardless of reps; `repBest` = the entry with the same rep count.
  3. If no `repBest` or `wkg > repBest.w`: `p.setPrs` re-checks against the live record (documented race fix, v6.html:10775-10778), then replaces the entry for that rep count with `{r, w, date: isoDay()}` and re-sorts by `r` ascending.
  4. If it also beats `allTimeBest`: vibrate `[100,50,100]`, set `prMsg = "<name> <r>RM: <weight><unit>"`, cleared after 3500 ms.
  5. The banner renders fixed at the top, z-index 200, with a trophy icon, "ALL-TIME PR" and the message (v6.html:11563-11602).
- Components: `WorkoutLog`
- Functions: `toggleDone` (10737-10812), `isoDay` (v6.html:1961)
- State: `prMsg`; parent `prs` via `p.setPrs`
- Storage: PRs persisted by the app shell (`lk_prs`, outside range)
- Status: PARTIAL
- Evidence for status: v6.html:10763 — PRs require `s.r`, so unilateral sets (which fill `rL`/`rR`) never produce one; and warm-up/drop sets are **not** excluded, so a `setType: "warmup"` or `"drop"` row with weight and reps can register a PR.
- Notes: the banner's weight uses `kgToDisp(s.w, useKg)` (the raw stored value), while the stored PR is normalised to kg — two different conversions in the same block (v6.html:10767 vs 10797). Un-ticking never reverts a PR.

### F-TRAIN-121 Rest timer — automatic start after a set
- Location: Train > Workout Log > pinned rest banner at the top
- User action: None (fires on ticking a set) — or manual via the duration chips.
- Behavior:
  1. `startRest(secs, exName)` persists the target, sets `restSec = secs`, stamps `restStartRef`, then flips `restActive` on after a 50 ms tick to force a restart, and schedules a push (v6.html:10645-10655).
  2. A 500 ms interval computes `remaining = restTarget - elapsed` from wall time; at ≤0 it clears everything and calls `window.LOCKEDPush.playAlert()` (v6.html:10571-10604).
  3. `visibilitychange` re-syncs the countdown on return, ending it if it expired while hidden (v6.html:10605-10632 area, 10656-10683).
  4. The banner shows a 52 px SVG ring (`strokeDasharray "138"`, `strokeDashoffset = (1 - restSec/restTarget) * 138`) that turns red at ≤10 s, the remaining seconds, quick chips 60/90/120/180, a "Custom" toggle, and a "Done" button that stops the rest and cancels the push (v6.html:11680-12020).
  5. `bannerRef` + a `ResizeObserver` measure the banner and reserve exactly that height with a spacer div (v6.html:10500-10515, 12020-12027).
  6. Every change dispatches a `lockedRest` CustomEvent so a mini rest pill can render outside the workout screen (v6.html:10633-10639; consumer at v6.html:57462-57468, 57903-57906).
- Components: `WorkoutLog`
- Functions: `startRest` (10645-10655), `retargetRest` (10656-10676), `pickRest` (10677-10683), `pushRest` (10640-10644), `cancelPushRest` (10645 area — v6.html:10643-10645)
- State: `restSec`, `restActive`, `restTarget`, `restCustom`, `restCustomMins`, `restCustomSecs`, `restEnabled`, `restSettingsOpen`, refs `restRef`, `restStartRef`, `restExerciseRef`, `bannerRef`, `bannerBottom`
- Storage: reads/writes `lk_activeWorkoutRestTarget`; reads/writes `lk_restEnabled`
- Network: `window.LOCKEDPush.scheduleRest` / `cancelRest` / `playAlert` (implementation outside range)
- Edge cases: `restTarget` falls back to 90 when the stored value is missing **or 0** (v6.html:10404-10407).
- Gating: `restEnabled` (default true) gates the automatic start only (v6.html:10811).
- Status: WORKING
- Evidence for status: v6.html:10571-10604 — wall-clock countdown with an expiry alert.
- Notes: `retargetRest` re-targets an in-flight rest rather than restarting it (documented at v6.html:10656-10662) — good behaviour but non-obvious. The `useLayoutEffect` measuring the banner has **no dependency array** (v6.html:10500-10515), so it re-measures and re-subscribes a `ResizeObserver` on every render of a 3,900-line component.

### F-TRAIN-122 Rest timer settings sheet (on/off + duration presets)
- Location: Train > Workout Log > header > Tools (⚡) > "Rest Timer"
- User action: Opens the sheet; toggles Auto Rest on/off; taps a preset (30 s, 60 s, 90 s, 2 m, 3 m, 5 m).
- Behavior: a top-anchored overlay (`slideFromTop 0.32s`) with an Auto-Rest toggle writing `lk_restEnabled` and six duration buttons calling `pickRest(s)` plus a redundant `sd("activeWorkoutRestTarget", s)` (v6.html:11444-11562). Escape closes it (v6.html:10430).
- Components: `WorkoutLog`
- Functions: `pickRest` (10677-10683)
- Storage: `lk_restEnabled`, `lk_activeWorkoutRestTarget`
- Status: WORKING
- Evidence for status: v6.html:11512-11527 — the toggle writes and persists.
- Notes: `pickRest` already persists the target (v6.html:10679), so v6.html:11549 is a duplicated write. The preset label formatter renders 300 s as `"5m"` and 90 s as `"1:30m"` (v6.html:11556) — an odd format.

### F-TRAIN-123 Custom rest duration (m + s)
- Location: Train > Workout Log > rest banner > "Custom"
- User action: Taps Custom, types minutes and seconds, taps Set (or Cancel).
- Behavior: the two numeric inputs strip non-digits, seconds are clamped to 59, "Set" computes `mins*60 + secs` and calls `pickRest(total)` only when >0 (v6.html:11790-11930). Opening Custom pre-seeds the fields from the current target (v6.html:11994-12002).
- Components: `WorkoutLog`
- Status: WORKING
- Evidence for status: v6.html:11866-11871 — seconds clamped to 59.
- Notes: the Custom control only exists inside the *active* rest banner, so a custom length cannot be set before the first rest of the session; the settings sheet only offers the six presets.

### F-TRAIN-124 Hold-to-open exercise action sheet
- Location: Train > Workout Log > anywhere on an exercise or superset card
- User action: Press and hold ~420 ms.
- Behavior:
  1. `holdStart` ignores the press when wiggle mode or another menu is open, on a non-primary mouse button, and on any `button, input, select, textarea, a, [data-draghandle]` target (v6.html:10300-10310).
  2. `setPress` squeezes the card to `scale(0.965)` over 420 ms with a spring `linear()` timing function (feature-detected, bezier fallback) (v6.html:10267-10294).
  3. After 420 ms: clears the transform, vibrates 30 ms, opens `ExerciseActionSheet` anchored to the card's rect and the press X, and records `lk_holdTipSeen` (v6.html:10315-10327).
  4. Movement >10 px, pointerup, pointercancel or any scroll releases the hold (v6.html:10311-10314, 10331-10334).
  5. A "Hold for options" pill renders on the first card until the tip has been seen (v6.html:12996-13010).
- Components: `WorkoutLog`, `ExerciseActionSheet` (v6.html:7496)
- Functions: `holdStart` (10300-10330), `releaseHold` (10295-10299 area / v6.html:10295-10299), `setPress` (10267-10294), `holdProps` (10336-10341), `actionItems` (10336-10381)
- State: `actionMenu`, `holdRef`, `holdTipSeen`
- Storage: `lk_holdTipSeen`
- Status: WORKING
- Evidence for status: v6.html:11635-11648 — the sheet is rendered with `items: actionItems(actionMenu.ri)` and a "n/m sets done" subtitle.
- Notes: seven actions: Info & notes, Swap exercise, unit switch, Add warm-up sets, superset toggle, unilateral toggle, Remove exercise (destructive) (v6.html:10336-10381). Remove exercise has **no confirmation** (v6.html:10380) even though removing a *block* does (v6.html:12244-12248).

### F-TRAIN-125 Drag to reorder exercises ("wiggle mode")
- Location: Train > Workout Log > exercise/block card > 3-bar drag handle
- User action: Touch-and-hold the handle 350 ms → all cards collapse to compact jiggling rows → drag → release; tap outside a row to exit.
- Behavior:
  1. `onLongPressStart` arms a 350 ms timer, cancelled by >10 px of movement (v6.html:10937-10967).
  2. On fire: `wiggleMode = true`, 30 ms vibrate, `beginDrag(ri, wrapperEl, y, true)`.
  3. `wrapRow` cross-fades each row between a `compactShell` (jiggle animation, staggered by `ri*137 % 450` ms) and the full card (v6.html:11240-11297).
  4. `beginDrag` inserts a collapsing placeholder, fixes the dragged element, and after 560 ms (morph) snapshots all `[data-exrow]` geometry (v6.html:11040-11189).
  5. `updateDragTarget` shifts rows and ticks on each index change (v6.html:10968-10995).
  6. Edge auto-scroll identical to the split builder (v6.html:11223-11239).
  7. `onDragEnd` runs a `SPRING.snap` animation then splices the row into place (v6.html:11190-11209).
  8. Touching outside a `[data-exrow]` exits wiggle mode (v6.html:12126-12131).
- Components: `WorkoutLog`
- Functions: `onLongPressStart` (10937-10967), `onLongPressCancel` (10951-10962), `updateDragTarget` (10968-10995), `detachDragHandlers` (10996-11005), `resetDragState` (11006-11020), `cancelDrag` (11021-11031), `beginDrag` (11032-11189), `onDragEnd` (11190-11209), `startWiggleDrag` (11210-11214), `exitWiggleMode` (11215-11222), `wrapRow` (11240-11274), `compactShell` (11275-11297)
- State: `dragIdx`, `dragY`, `dragTargetRi`, `wiggleMode`, refs `longPressRef`, `dragYRef`, `dragIdxRef`, `dragTargetRef`, `dragHandlersRef`, `waitMoveRef`, `wiggleModeRef`, `dragVelRef`, `dropRafRef`, `dragGeoRef`
- Status: PARTIAL
- Evidence for status: v6.html:10938 — touch-only (`if (!e.touches...) return`), so exercises cannot be reordered with a mouse. `dragY`/`setDragY` and `dragTargetRi`/`setDragTargetRi` are set but never read in any render path (v6.html:10927-10929, 11006-11019) — DEAD state.
- Notes: the two drag systems (this one and `sbLongStart` in `SplitBuilder`) are near-identical duplicated logic ~250 lines each (v6.html:8813-9099 vs 10937-11239) — a prime consolidation target.

### F-TRAIN-126 Add exercise mid-workout
- Location: Train > Workout Log > footer > "+ Add Exercise"
- User action: Taps "+ Add Exercise", picks from `ExLib`.
- Behavior: `view = "add"` (v6.html:13660 area / 13660-13675 button at v6.html:13657-13684) → `ExLib` → on select, either inserts a superset partner (when `supersetPickRi` is set) or appends `mkRow(ex.id)` (v6.html:11308-11416). The footer collapses to zero height in wiggle mode (v6.html:13646-13656).
- Components: `WorkoutLog`, `ExLib`
- Functions: `mkRow` (10052-10130)
- Status: WORKING
- Evidence for status: v6.html:11408-11412 — plain append path.

### F-TRAIN-127 Add a Block (note / timed section) mid-workout
- Location: Train > Workout Log > footer > "+ Block" → bottom sheet
- User action: Taps "+ Block", types a title, optionally expands for notes + duration, taps "Add Block".
- Behavior:
  1. `blockModal` opens a drag-dismissible bottom sheet (`useSheetDrag`, v6.html:10433-10435; sheet at v6.html:13712-13955).
  2. "+ Add notes or duration" reveals the textarea and the duration input (v6.html:13849-13911).
  3. "Add Block" rejects an empty title with a toast "Enter a title first", otherwise calls `addBlock` (v6.html:13930-13943).
  4. `addBlock` → `mkBlock` creates `{type:"block", id:"blk_<ts>_<rand>", title, notes, duration, expanded:false}` and appends it, with a toast on failure (v6.html:10131-10159).
  5. In the log, a block renders as a dashed card with a ⏱ duration chip, a `+/−` expand toggle (expanded shows an editable textarea), and a delete button armed by `lkConfirm("removeBlock"+ri, ...)` (v6.html:12148-12292).
- Components: `WorkoutLog`, `useSheetDrag` (v6.html:2150)
- Functions: `mkBlock` (10131-10145), `addBlock` (10146-10158), `updateBlock` (10159-10170)
- State: `blockModal`, `blockSheet`; also unused `blockTitle`, `blockNotes`, `blockDuration`
- Storage: `lk_activeWorkoutRows`
- Status: PARTIAL
- Evidence for status: v6.html:10436-10441 — `blockTitle`, `blockNotes`, `blockDuration` state is declared and never read or written anywhere in the range: DEAD state left over from a pre-`blockModal` version.
- Notes: `blockModal.mode: "create"` is set (v6.html:13687) but never read — no edit mode exists. Blocks contribute nothing to sets/volume totals (guarded at v6.html:10693, 10700).

### F-TRAIN-128 AI next-set recommendation ("AI Rec")
- Location: Train > Workout Log > exercise card > "AI Rec" button beside "+ Add Set"
- User action: Taps "AI Rec".
- Behavior:
  1. Re-entrancy guard: returns if `aiRecBusy === ri` (v6.html:13566-13568).
  2. Collects sets that are `done && w && r`; with none it toasts "Complete at least one set first" and stops (v6.html:13569-13576).
  3. Builds `summary` = `"<w><unit> x <r> RIR<rir>"` joined with commas; finds the first not-done set index; returns if none (v6.html:13577-13584).
  4. System prompt: *"You are a strength coach. Reply with ONLY two numbers separated by a comma: recommended weight in `<unit>` and recommended reps for the next set. Example: 85,8. Nothing else."* (v6.html:13585).
  5. User message: `"Exercise: <name>. Sets completed: <summary>. Recommend weight and reps for next set."` (v6.html:13586).
  6. `aiCall(sys, usr, null, onDone, onFail)`; on success strips everything but digits/commas/dots, splits on `,`, writes part 0 to `w` and part 1 to `r` of the next undone set (v6.html:13588-13598).
  7. On failure, toasts "Could not get a recommendation. Check your connection and retry." (v6.html:13599-13603).
  8. The button reads "Thinking…" while busy (v6.html:13623).
- Components: `WorkoutLog`
- Functions: `aiCall` (v6.html:2663-2696, outside range)
- State: `aiRecBusy`
- Network: `POST https://lockedapi.cescocugliari.workers.dev/` (v6.html:2665) with `authHeaders()` (Bearer token from `window.LOCKED.session.access_token`, v6.html:2652-2662). Payload `{system, max_tokens: 700, messages: [{role:"user", content}]}`. Response read as `d.content[0].text` (Anthropic shape) with an OpenAI-shape fallback `d.choices[0].message.content`. `d.gated === true` toasts an upgrade message and calls `onFail`.
- AI: model chosen server-side by the Cloudflare Worker — **not visible in this file**. Prompt at v6.html:13585-13586.
- Edge cases: rate/quota gating handled centrally (v6.html:2682-2687); `AbortError` swallowed (v6.html:2693).
- Gating: always on in the UI; the worker applies a daily limit with a Pro upsell (v6.html:2683).
- Status: WORKING
- Evidence for status: v6.html:13588-13598 — full request/response wiring with a busy guard.
- Notes: **The recommended weight is written raw via `setVal(..., "w", w)`, which runs `dispToKg(w, rowUsesKg(ri))`** (v6.html:10716) — correct only because the prompt asks for the row's display unit; but the prompt uses the **global** `unit` (v6.html:13585) while `setVal` converts using the **row** unit, so an lb-overridden row inside a kg profile gets a kg number treated as lb. There is no validation that the parsed numbers are sane (e.g. `"1000,50"` is accepted). The summary uses `kgToDisp(s.w, useKg)` — global unit again (v6.html:13578).

### F-TRAIN-129 Session header — elapsed time, set count, total volume
- Location: Train > Workout Log > sticky header
- User action: None.
- Behavior: `timeStr` = zero-padded `mm:ss` from `sec` (v6.html:10684-10691). `totalSets` counts sets that are `done && setType !== "warmup"` across non-block rows (v6.html:10692-10699). `totalVol` sums `parseFloat(w) * parseInt(r)` over the same set (v6.html:10700-10706), displayed as `Math.round(storedToUnit(totalVol, useKg))` (v6.html:12046-12048).
- Components: `WorkoutLog`
- Status: PARTIAL
- Evidence for status: v6.html:10700-10706 — volume uses `s.r` only, so unilateral sets (`rL`/`rR`) and partials contribute **zero** volume; drop sets *are* counted.
- Notes: mixed-unit rows (F-TRAIN-118) are summed without per-row conversion.

### F-TRAIN-130 Tools menu (⚡): rest timer, plate calculator, global unit switch
- Location: Train > Workout Log > header > ⚡ button
- User action: Taps ⚡, then one of three items.
- Behavior: a 170 px dropdown (v6.html:12081-12110) with "Rest Timer" (opens F-TRAIN-122), "Plate Calc" (`showPlateCalc = true` → `PlateCalc`, v6.html:11434-11443, component at v6.html:54925), and "Switch to LBS/KG" calling `p.toggleUnit()` (v6.html:12036-12044 / 12060-12070).
- Components: `WorkoutLog`, `PlateCalc` (v6.html:54925, outside range)
- State: `showTools`, `showPlateCalc`
- Status: PARTIAL
- Evidence for status: v6.html:12081 — the dropdown has no outside-click or Escape handler; nothing closes it except selecting an item or the ⚡ toggle.
- Notes: `PlateCalc` receives `rows` and `setRows` (v6.html:11436-11438), so it can write weights back into the session — that write path lives outside this range.

### F-TRAIN-131 Discard workout (double-tap confirm)
- Location: Train > Workout Log > header > "Discard"
- User action: Taps Discard, then taps it again to confirm.
- Behavior: `lkConfirm("discardWorkout", "Tap Discard again to throw this workout away")` (v6.html:5179, called at v6.html:12111-12118); on the second tap it cancels the rest push and the idle check, then calls `p.onDiscard()`, which clears `lk_activeWorkout`, `lk_activeWorkoutRows`, `lk_activeWorkoutSec`, `lk_activeWorkoutRestTarget` and returns to home (v6.html:57924-57931).
- Components: `WorkoutLog`
- Status: WORKING
- Evidence for status: v6.html:12112 — the arm-then-confirm guard.

### F-TRAIN-132 Finish workout
- Location: Train > Workout Log > header > "Finish"
- User action: Taps Finish.
- Behavior: cancels the rest push and the idle check, then `p.onFinish(rows, sec)` (v6.html:12125-12134) → `finishWorkout` stores `finRows`/`finSec`, persists `lk_activeWorkoutRows` / `lk_activeWorkoutSec`, and routes to the `review` screen (v6.html:57418-57424). Saving happens in the review screen via `saveWorkout` (v6.html:57425-57459).
- Components: `WorkoutLog`
- Status: WORKING
- Evidence for status: v6.html:57418-57424.
- Notes: **no confirmation** — a mis-tap on Finish ends the session (contrast with Discard's double-tap). Sets that are filled in but not ticked are still passed on; whether the review screen keeps them is outside this range → see Open Questions.

### F-TRAIN-133 Idle "Still training?" prompt (30 min) + push notification
- Location: Train > Workout Log > full-screen modal
- User action: None to trigger; taps "No, continue" or "End & review".
- Behavior:
  1. A 5 s interval checks `Date.now() - lastActivityTime > 1800000` (30 min); on trip it clears its own interval and sets `idlePrompt = true` (v6.html:10547-10560).
  2. `noteActivity(force)` (called by `setVal` and `toggleDone`) resets `lastActivityTime`, clears the prompt, and re-arms `LOCKEDPush.scheduleIdleCheck(1800, p.name, force)` (v6.html:10621-10626).
  3. On mount the check is armed; a `lockedPushOpen` event with `type: "idle-continue"` re-arms it, and a URL containing `endworkout` opens the prompt (v6.html:10608-10620, 10627-10639 area). `?open=endworkout` at cold start also opens it (v6.html:10617).
  4. "No, continue" → `noteActivity(true)`. "End & review" → clears the prompt, cancels the rest push and the idle check, and calls `p.onFinish(rows, secRef.current)` (v6.html:11616-11634).
- Components: `WorkoutLog`
- Functions: `noteActivity` (10621-10626)
- State: `idlePrompt`, `lastActivityTime`, `idleMinutes` (30), `inactivityLimit` (1800000)
- Network: `window.LOCKEDPush.scheduleIdleCheck` / `cancelIdleCheck` (outside range)
- Status: PARTIAL
- Evidence for status: v6.html:10547-10560 — the interval clears itself on trip, and the enclosing effect depends on `[lastActivityTime, rows]`, so once the prompt is dismissed by anything other than `noteActivity` (which changes `lastActivityTime` and re-runs the effect) the check does not re-arm. The 5 s poll is also re-created on **every `rows` change** — i.e. on every keystroke of a set — tearing down and rebuilding both intervals constantly.
- Notes: the comment at v6.html:10551-10555 documents that this used to end sessions silently.

### F-TRAIN-134 Exercise info & notes sheet
- Location: Train > Workout Log > hold a card > "Info & notes"
- User action: Holds a card, taps "Info & notes".
- Behavior: `setShowExDetail(Object.assign({}, getEx(row.id), row))` — merges the catalogue entry with the live row so the modal has group/equipment/animation as well as the logged sets (v6.html:10288-10292); renders `ExerciseDetailModal` (v6.html:11603-11610; component at v6.html:7202).
- Components: `WorkoutLog`, `ExerciseDetailModal` (v6.html:7202)
- Status: WORKING
- Evidence for status: v6.html:10288-10292 — the merge is explicitly commented as the fix for "every lift reported as unknown bodyweight".

### F-TRAIN-135 Empty workout state
- Location: Train > Workout Log > body
- Behavior: with `rows.length === 0`, shows "No exercises yet / Tap Add Exercise below" (v6.html:12132-12147).
- Status: WORKING
- Evidence for status: v6.html:12132.

### F-TRAIN-136 Base-resistance badge (`startResist`)
- Location: Train > Workout Log > exercise card subtitle
- Behavior: when the catalogue exercise has `startResist > 0`, the card shows "· +Nkg base" in blue (v6.html:12946-12956). `mkRow` copies `startResist` and `smithNoCB` onto the row (v6.html:10127-10128).
- Status: PARTIAL
- Evidence for status: v6.html:12951 — the label is hardcoded `"kg"` regardless of the user's unit, and neither `startResist` nor `smithNoCB` is used anywhere else in this range (no volume or PR adjustment).

---

# PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| `ReplacePanel` | component | v6.html:8625-8781 | Search/suggest an alternative exercise to swap in | `WorkoutLog` (11417) | `ALL_EX.filter`, `Ic` | F-TRAIN-100 |
| `SplitBuilder` | component | v6.html:8782-9846 | Create/edit a split: days, exercises, note blocks | `TrainScreen` (15037) | `initDays`, `save`, `ExLib` | F-TRAIN-101..106 |
| `initDays` | function | v6.html:8785-8804 | Map a saved split's `exIds`+`blocks` back into ordered `items` | `useState(days)` init (8805) | — | F-TRAIN-106 |
| `sbLongStart` | handler | v6.html:8813-8966 | Arm 350 ms long-press then start a split-builder row drag | row drag handles (9463, 9563) | `sbLongCancel`, `sbUpdateTarget`, `sbDragEnd`, `lkScrollTop` | F-TRAIN-105 |
| `sbUpdateTarget` | function | v6.html:8967-9001 | Move the dragged row and shift neighbours to the insertion index | `sbLongStart.handleMove`, autoscroll loop | `lkScrollTop`, `navigator.vibrate` | F-TRAIN-105 |
| `sbLongCancel` | function | v6.html:8985-9001 area (`function sbLongCancel()` at 8985) | Cancel the pending long-press timer/listener | `sbLongStart`, row `onTouchEnd`, `sbDragEnd` | — | F-TRAIN-105 |
| `sbDetach` | function | v6.html:8993-9001 | Remove the active drag document listeners | `sbDragEnd` | — | F-TRAIN-105 |
| `sbReset` | function | v6.html:9002-9012 | Clear all split-builder drag refs and state | `sbDragEnd`, `finish` | `setSbDrag` | F-TRAIN-105 |
| `sbDragEnd` | function | v6.html:9013-9086 | Spring-animate the drop and commit the item reorder | drag `touchend`/`touchcancel` | `sbLongCancel`, `sbDetach`, `setDays`, `sbReset` | F-TRAIN-105 |
| `addDay` | handler | v6.html:9124-9138 | Append a named day to the split | Add button (9788), Enter key (9767) | `window.LOCKED.toast`, `setDays` | F-TRAIN-102 |
| `removeDay` | handler | v6.html:9139-9145 | Delete a day | day × button (9410) | `setDays` | F-TRAIN-102 |
| `removeItem` | handler | v6.html:9146-9159 | Delete one exercise/block from a day | row × buttons (9524, 9683) | `setDays` | F-TRAIN-103, 104 |
| `updateBlock` (SplitBuilder) | handler | v6.html:9160-9173 | Patch a block item's title/notes/duration | block inputs (9625, 9645, 9665) | `setDays` | F-TRAIN-104 |
| `pickEx` | handler | v6.html:9174-9187 | Append the picked exercise to the day being edited | `ExLib.onSelect` (9225) | `setDays`, `setView` | F-TRAIN-103 |
| `save` (SplitBuilder) | handler | v6.html:9188-9219 | Serialise days into `{exIds, blocks}` and emit the split | SAVE SPLIT (9799) | `p.onSave` | F-TRAIN-106 |
| `NumPad` | component | v6.html:9847-10012 | Non-modal bottom numeric keypad for weight/reps | `WorkoutLog` (13692) | `tap`, `increment`, `useEscape`, `lkPortal` | F-TRAIN-107 |
| `tap` | handler | v6.html:9853-9863 | Append a digit / decimal / delete, capped at 6 chars | keypad buttons (9977) | `setVal` (local) | F-TRAIN-107 |
| `increment` | handler | v6.html:9864-9873 | ±2.5 / ±5 weight nudge, clamped to 0-9999 | ± chips (9945) | — | F-TRAIN-107 |
| `WorkoutLog` | component | v6.html:10013-13955 | The live workout logging screen (largest component in the app) | app shell (57912) | everything below | F-TRAIN-108..136 |
| `getLastSession` | function | v6.html:10042-10044 | Look up the most recent sets for an exercise name | `mkRow` | `lastSessionIndex` | F-TRAIN-109 |
| `staleLast` | function | v6.html:10045-10051 | True when the last session was >31 days ago or undateable | card header render (12960) | `Date.parse` | F-TRAIN-110 |
| `mkRow` | function | v6.html:10052-10130 | Build an exercise row, prefilled from last session or 3 blanks | rows init (10391), add (11409), replace (11427), superset pick (11393) | `getEx`, `getLastSession` | F-TRAIN-108, 109, 126 |
| `mkBlock` | function | v6.html:10131-10145 | Build a note-block row object | `addBlock`, rows init (10392) | — | F-TRAIN-127 |
| `addBlock` | handler | v6.html:10146-10158 | Append a block row, toasting on failure | block sheet "Add Block" (13940) | `mkBlock`, `setRows`, toast | F-TRAIN-127 |
| `updateBlock` (WorkoutLog) | handler | v6.html:10159-10170 | Patch a block row (notes / expanded) | expand toggle (12228), textarea (12261) | `setRows` | F-TRAIN-127 |
| `addWarmupSets` | handler | v6.html:10171-10213 | Prepend two 50 %/70 % warm-up sets | action sheet "warmup" (10362) | `setRows` | F-TRAIN-115 |
| `toggleSetType` | handler | v6.html:10214-10240 | Cycle normal → warmup → drop, auto-filling 75 % on drop | set-number button (13140, 13555) | `setRows` | F-TRAIN-114 |
| `toggleUnilateral` | handler | v6.html:10241-10251 | Flip L/R tracking on a row | action sheet "unilateral" (10373) | `setRows` | F-TRAIN-117 |
| `toggleRowUnit` | handler | v6.html:10252-10262 | Override kg/lb for one row | action sheet "unit" (10357) | `setRows` | F-TRAIN-118 |
| `PRESS_EASE` (IIFE) | function | v6.html:10269-10276 | Feature-detect a spring `linear()` easing, else a bezier | module init of `setPress` | `CSS.supports` | F-TRAIN-124 |
| `setPress` | function | v6.html:10277-10294 | Squeeze/release a card under a long press | `holdStart`, `releaseHold` | — | F-TRAIN-124 |
| `releaseHold` | function | v6.html:10295-10299 area (295-… `function releaseHold(keepPress)`) | Tear down a pending hold and its listeners | `holdStart`, unmount effect (10331) | `setPress`, `clearTimeout` | F-TRAIN-124 |
| `holdStart` | handler | v6.html:10300-10330 | Start the 420 ms hold that opens the action sheet | `holdProps` on cards (12240, 12889) | `setPress`, `releaseHold`, `setActionMenu`, `sd` | F-TRAIN-124 |
| `holdProps` | function | v6.html:10336-10341 | Spread `onPointerDown`/`onContextMenu` onto a card | exercise & superset cards | `holdStart` | F-TRAIN-124 |
| `actionItems` | function | v6.html:10336-10381 | Build the 7-item action sheet list for a row | `ExerciseActionSheet` render (11640) | `getEx`, `toggleRowUnit`, `addWarmupSets`, `toggleSuperset`, `toggleUnilateral`, `removeRow` | F-TRAIN-124 |
| `toggleSuperset` | handler | v6.html:10382-10420 | Link/unlink two consecutive exercises | action sheet (10368), SS × (12657) | `setRows`, `setSupersetPickRi`, `setView` | F-TRAIN-119 |
| `noteActivity` | function | v6.html:10621-10626 | Reset idle tracking and re-arm the server idle check | `setVal`, `toggleDone`, idle "No, continue" | `LOCKEDPush.scheduleIdleCheck` | F-TRAIN-133 |
| `pushRest` | function | v6.html:10640-10644 | Schedule the server-side rest notification | `startRest`, `retargetRest` | `LOCKEDPush.scheduleRest` | F-TRAIN-121 |
| `cancelPushRest` | function | v6.html:10643-10645 | Cancel the scheduled rest notification | `retargetRest`, banner "Done", Discard, Finish, idle end | `LOCKEDPush.cancelRest` | F-TRAIN-121 |
| `startRest` | function | v6.html:10645-10655 | Persist the target and start a fresh rest countdown | `toggleDone` (10811) | `sd`, `pushRest` | F-TRAIN-121 |
| `retargetRest` | function | v6.html:10656-10676 | Re-aim an in-flight rest without restarting it | `pickRest` | `sd`, `pushRest`, `cancelPushRest` | F-TRAIN-121 |
| `pickRest` | function | v6.html:10677-10683 | Set the next rest length, or retarget if one is running | duration chips (11540, 11972), Custom "Set" (11901) | `retargetRest`, `sd` | F-TRAIN-121, 122, 123 |
| `rowUsesKg` | function | v6.html:10707-10714 | Resolve a row's effective unit (`kg` override or global) | `setVal`, `getSetVal`, weight cells | — | F-TRAIN-118 |
| `setVal` | function | v6.html:10715-10736 | Write one field of one set, converting weight to storage unit | NumPad DONE, RIR selects, partials, AI Rec | `dispToKg`, `noteActivity`, `setRows` | F-TRAIN-111, 116, 128 |
| `toggleDone` | function | v6.html:10737-10812 | Tick/untick a set: haptics, animation, PR check, rest start | ✓ buttons (12758, 12800, 13292, 13674) | `noteActivity`, `p.setPrs`, `isoDay`, `startRest`, `kgToDisp` | F-TRAIN-112, 120, 121 |
| `removeSet` | function | v6.html:10813-10823 | Delete one set from a row | `onTouchEndSet` | `setRows` | F-TRAIN-113 |
| `removeRow` | function | v6.html:10817-10823 area (`function removeRow(ri)`) | Delete a whole exercise/block row | action sheet "remove", block × | `setRows` | F-TRAIN-124, 127 |
| `addSet` | function | v6.html:10824-10836 | Append a blank set to a row | "+ Add Set" (13538), superset add (12826) | `setRows` | F-TRAIN-113, 119 |
| `swipeRubber` | function | v6.html:10841-10844 | Rubber-band resistance for a rightward swipe | `onTouchMoveSet`, superset swipe | — | F-TRAIN-113, 119 |
| `swipeShouldDelete` | function | v6.html:10845-10848 | Project the swipe with friction and decide if it deletes | `onTouchEndSet`, superset swipe end | — | F-TRAIN-113, 119 |
| `setSwipe2` | function | v6.html:10849-10852 | Write the set-swipe state to both ref and state | swipe handlers | `setSwipe` | F-TRAIN-113 |
| `setSsSwipe2` | function | v6.html:10853-10856 | Same, for superset pair swipes | superset swipe handlers | `setSsSwipe` | F-TRAIN-119 |
| `onTouchStartSet` | handler | v6.html:10859-10872 | Begin tracking a set-row swipe | set row `onTouchStart` (13124, 13579) | `setSwipe2` | F-TRAIN-113 |
| `onTouchMoveSet` | handler | v6.html:10873-10913 | Track dx/velocity, abort on vertical scroll, tick at -80 px | set row `onTouchMove` | `swipeRubber`, `setSwipe2`, vibrate | F-TRAIN-113 |
| `onTouchEndSet` | handler | v6.html:10914-10922 | Delete the set if the projected swipe passes the threshold | set row `onTouchEnd` | `swipeShouldDelete`, `removeSet` | F-TRAIN-113 |
| `onTouchCancelSet` | handler | v6.html:10923-10925 | Reset the swipe | set row `onTouchCancel` | `setSwipe2` | F-TRAIN-113 |
| `onLongPressStart` | handler | v6.html:10937-10967 | Arm the 350 ms hold that enters wiggle/reorder mode | drag handles (12162, 12594, 12912) | `beginDrag`, `setWiggleMode` | F-TRAIN-125 |
| `onLongPressCancel` | function | v6.html:10951-10962 | Cancel the pending reorder long-press | handle `onTouchEnd`, `onDragEnd` | — | F-TRAIN-125 |
| `updateDragTarget` | function | v6.html:10968-10995 | Move the dragged card and shift others to the target index | `beginDrag.handleMove`, autoscroll loop | `lkScrollTop`, vibrate | F-TRAIN-125 |
| `detachDragHandlers` | function | v6.html:10996-11005 | Remove the reorder document listeners | `onDragEnd` | — | F-TRAIN-125 |
| `resetDragState` | function | v6.html:11006-11020 | Clear all reorder refs and state | `onDragEnd`, `finish` | `setDragIdx`, `setDragTargetRi`, `setDragY` | F-TRAIN-125 |
| `cancelDrag` | function | v6.html:11021-11031 | Abort a reorder (Escape / touchcancel), snapping back | drag key/cancel handlers | `onDragEnd` | F-TRAIN-125 |
| `beginDrag` | function | v6.html:11032-11189 | Lift a card, snapshot geometry, attach drag listeners | `onLongPressStart`, `startWiggleDrag` | `updateDragTarget`, `onDragEnd`, `lkScrollTop` | F-TRAIN-125 |
| `onDragEnd` | function | v6.html:11190-11209 | Spring to the drop position and splice `rows` | drag `touchend`, `cancelDrag` | `onLongPressCancel`, `detachDragHandlers`, `setRows`, `resetDragState` | F-TRAIN-125 |
| `startWiggleDrag` | handler | v6.html:11210-11214 | Start a drag from a card already in wiggle mode | `wrapRow` `onTouchStart` (11245) | `beginDrag` | F-TRAIN-125 |
| `exitWiggleMode` | function | v6.html:11215-11222 | Leave wiggle mode and reset drag state | body `onTouchStart` outside a row (12127) | `setWiggleMode` | F-TRAIN-125 |
| `wrapRow` | function | v6.html:11240-11274 | Cross-fade a row between its compact and full renderings | every row render (12197, 12847, 13624) | — | F-TRAIN-125 |
| `compactShell` | function | v6.html:11275-11297 | The jiggling compact card used in wiggle mode | `wrapRow` call sites | — | F-TRAIN-125 |
| `getSetVal` | function | v6.html:11298-11307 | Read a set field for the NumPad, converting weight for display | NumPad `value` (13699) | `kgToDisp`, `rowUsesKg` | F-TRAIN-107 |
| `lastSessionIndex` | memo | v6.html:10021-10041 | name → `{sets, date}` index over workout history | `getLastSession` | — | F-TRAIN-109 |
| elapsed-clock effect | hook | v6.html:10539-10570 | 500 ms wall-clock tick + 5 s idle poll | React | `setSec`, `setIdlePrompt` | F-TRAIN-108, 133 |
| visibility effect (session) | hook | v6.html:10561-10570 area | Re-sync elapsed time on tab return | React | `setSec` | F-TRAIN-108 |
| rest countdown effect | hook | v6.html:10571-10604 | 500 ms rest tick, expiry alert | React | `LOCKEDPush.playAlert` | F-TRAIN-121 |
| idle-push effect | hook | v6.html:10608-10620 | Arm the server idle check, handle `lockedPushOpen` and `?open=` | React | `LOCKEDPush.scheduleIdleCheck/cancelIdleCheck` | F-TRAIN-133 |
| `lockedRest` broadcast effect | hook | v6.html:10633-10639 | Dispatch rest state for the out-of-screen rest pill | React | `window.dispatchEvent` | F-TRAIN-121 |
| rest visibility effect | hook | v6.html:10656-10683 area (10684-…) | Re-sync the rest countdown on tab return | React | `setRestSec` | F-TRAIN-121 |
| persistence effect | hook | v6.html:10659-10668 | Persist rows + seconds when any progress exists | React | `sd` | F-TRAIN-108 |
| banner measure effect | hook (`useLayoutEffect`) | v6.html:10500-10515 | Measure the rest banner and reserve its height | React | `ResizeObserver` | F-TRAIN-121 |
| drag cleanup effect | hook | v6.html:11223-11239 area (11215-11222 + 11223-11239) | Remove listeners / cancel RAF on unmount | React | — | F-TRAIN-125 |
| drag autoscroll effect | hook | v6.html:11223-11239 | Edge auto-scroll while dragging an exercise | React | `lkScrollBy`, `updateDragTarget` | F-TRAIN-125 |
| sb drag cleanup effect | hook | v6.html:9087-9099 | Same, for the split builder | React | — | F-TRAIN-105 |
| sb autoscroll effect | hook | v6.html:9100-9123 | Edge auto-scroll while dragging a split-builder row | React | `lkScrollBy`, `sbUpdateTarget` | F-TRAIN-105 |
| `blockSheet` | hook (`useSheetDrag`) | v6.html:10433-10435 | Drag-to-dismiss for the Add Block sheet | React | v6.html:2150 | F-TRAIN-127 |

**Counts: 4 components, 62 functions/handlers/hooks indexed (66 rows total).**

---

## Workout data model

### Set (the atom) — v6.html:10056-10105, 10163-10186, 10828-10833
```
{
  w:        string,   // weight in the STORED unit (storedWeightUnit(), v6.html:4379); "" when blank
  r:        string,   // reps
  rL:       string,   // left-side reps (unilateral only)
  rR:       string,   // right-side reps (unilateral only)
  rir:      string,   // "0".."4" or "5+"  (default "2")
  done:     boolean,
  rec:      boolean,  // true = value carried over from last session, not yet edited (v6.html:10723)
  setType:  "normal" | "warmup" | "drop",
  partials: string    // count of partial reps, "" when none
}
```
Note: `addSet` (v6.html:10828-10833) creates only `{w, r, rir, done}` — `rL`, `rR`, `setType`, `partials` are absent and defaulted at render.

### Exercise row — v6.html:10106-10129
```
{
  type: "exercise",
  id, name, muscle, col,     // copied from the catalogue via getEx()
  unilateral: boolean,       // always false at creation (10112)
  kg: null | boolean,        // per-row unit override; null = follow global useKg
  sets: [Set],
  lastDate: string | null,   // date of the session the sets were prefilled from
  supersetId: null | "ss<timestamp>",
  startResist: number,       // base resistance in kg from the catalogue
  smithNoCB: boolean
}
```

### Block row — v6.html:10133-10143
```
{ type: "block", id: "blk_<ts>_<rand6>", title, notes, duration: string|null, expanded: boolean }
```

### Active session (in-flight) — v6.html:10387-10407, 10659-10668
- `lk_activeWorkoutRows` = `[ExerciseRow | BlockRow]` (order = display order)
- `lk_activeWorkoutSec` = elapsed seconds (number)
- `lk_activeWorkoutRestTarget` = rest length in seconds
- `lk_activeWorkout` = `{name, exIds, blocks}` (written by the app shell, v6.html:57913-57915)

### Saved workout (history record) — v6.html:57425-57441 (outside range, the consumer of `onFinish`)
```
{ id: "w_<ts>", name, sets, vol, dur, date, dateISO,
  exercises: [{name, sets:[Set]}] | null, blocks | null,
  reflection | null, note | null, aiInsight | null }
```
`lastSessionIndex` reads `w.exercises[].name` and `.sets` and `w.date || w.dateISO` (v6.html:10025-10038).

### PR record — v6.html:10784-10795
`prs[exerciseId] = [{ r: number, w: number /* always kg */, date: isoDay() }]`, sorted ascending by `r`, one entry per rep count.

### Split / program — v6.html:9188-9219
```
{ id: "s<timestamp>", name, created: toLocaleDateString(),
  days: [{ name, exIds: [exerciseId], blocks: [{title, notes, duration}] }] }
```
The builder's in-memory form is `days: [{name, items: [{type:"ex", id} | {type:"block", title, notes, duration}]}]` (v6.html:8786-8803) — the ordering between exercises and blocks is **lost** on save.

---

## Storage keys touched
(all prefixed `lk_` by `sd`/`ld`, v6.html:2417-2445)

| Key | Read | Written | Where |
|---|---|---|---|
| `lk_activeWorkoutRows` | yes | yes | v6.html:10388, 10664 |
| `lk_activeWorkoutSec` | yes | yes | v6.html:10398, 10665 |
| `lk_activeWorkoutRestTarget` | yes | yes | v6.html:10405, 10646, 10658, 10679, 11549 |
| `lk_restEnabled` | yes | yes | v6.html:10426, 11515 |
| `lk_holdTipSeen` | yes | yes | v6.html:10020, 10323 |
| `lk_hidePartials` | yes | no | v6.html:13470 (written elsewhere, v6.html:32996) |
| `lk_weightStorageUnit` | indirect (`storedWeightUnit`) | no | via v6.html:4379 |
| `lk_activeWorkout` | no | cleared by parent | v6.html:57926 |
| `lk_history`, `lk_prs`, `lk_splits` | via props | via parent callbacks | v6.html:57425-57459, 15045 |

---

## Network endpoints

| Endpoint | Method | Called from | Payload | Response handling |
|---|---|---|---|---|
| `https://lockedapi.cescocugliari.workers.dev/` | POST | AI Rec (v6.html:13588) via `aiCall` (v6.html:2663-2696) | `{system, max_tokens: 700, messages:[{role:"user", content}]}`, headers from `authHeaders()` incl. `Authorization: Bearer <session.access_token>` (v6.html:2652-2662) | `d.content[0].text` (Anthropic) or `d.choices[0].message.content` (OpenAI fallback); `d.gated` → upsell toast + `onFail` |

Non-HTTP side channels used from this range:
- `window.LOCKEDPush.scheduleRest / cancelRest / playAlert` (v6.html:10641-10645, 10594)
- `window.LOCKEDPush.scheduleIdleCheck / cancelIdleCheck` (v6.html:10624, 10609, 10619)
- `window` events: `lockedRest` dispatched (v6.html:10634), `lockedPushOpen` listened (v6.html:10616), `visibilitychange` (v6.html:10562, 10684)

**Security:** no hardcoded secrets, API keys or tokens appear anywhere in lines 8782-13955. The bearer token is read from `window.LOCKED.session` at call time (v6.html:2657-2659). The worker URL is a hardcoded personal-account Cloudflare subdomain (v6.html:2665) — worth flagging as an infrastructure coupling, not a leaked credential.

---

## Progression / PR logic

**Weight suggestion (three independent mechanisms, none of them a real progression model):**

1. **Repeat last session** — `mkRow` copies the previous session's sets verbatim with `rec: true` (v6.html:10056-10073). No progressive overload is applied: the user is offered exactly what they did last time. With no history, three blank sets at RIR 2 (v6.html:10074-10105).
2. **Warm-up ramp** — 50 % and 70 % of the first working weight, rounded to 2.5, at 8 reps/RIR 4 and 5 reps/RIR 3 (v6.html:10161-10186).
3. **Drop set** — 75 % of the immediately preceding set's weight, rounded to 2.5 (v6.html:10229-10235).
4. **AI Rec** — an LLM call given only this exercise's completed sets in this session (weight × reps @ RIR) and asked for `weight,reps` (v6.html:13577-13598). No history, no PR data, no RIR-based rule is passed in; the model is chosen server-side.

`rir` is captured on every set (0-4, or `5+` on non-superset rows) but **is never read by any progression rule** in this range other than being echoed into the AI Rec summary string (v6.html:13578).

**PR detection** (`toggleDone`, v6.html:10761-10808):
- Trigger: a set transitions to `done` and has both `w` and `r`.
- Normalisation: `wkg = parseFloat(s.w)`, divided by `LB_PER_KG` when `storedWeightUnit() === "lb"` — PRs are stored in kg (v6.html:10766-10768).
- Rep-specific PR: beats or newly creates the entry for that exact rep count → written with a live re-read guard against a stale props snapshot (v6.html:10771-10796).
- All-time PR: also heavier than *any* existing entry for that exercise → `[100,50,100]` haptic + the ALL-TIME PR banner for 3500 ms (v6.html:10797-10806).
- Not filtered by `setType`, so warm-up and drop sets can set PRs. Not triggered by unilateral sets (they fill `rL`/`rR`, not `r`). Never rolled back on un-ticking.

---

## Open questions / UNVERIFIED

1. **UNVERIFIED — does the review screen drop untidied sets?** `p.onFinish(rows, sec)` passes the whole rows array including sets that are filled but not ticked (v6.html:12130). Whether the review screen at `setScreen("review")` (v6.html:57423) filters on `done` is outside this range. Confirm by reading the review/finish component that consumes `finRows`.
2. **UNVERIFIED — `PlateCalc`'s write-back into the session.** It receives `rows` and `setRows` (v6.html:11436-11438); which set it writes and in what unit is defined at v6.html:54925+. Confirm by reading `PlateCalc`.
3. **UNVERIFIED — `LOCKEDPush.scheduleRest` timing accuracy on a locked phone.** The comment at v6.html:10636-10639 claims the push is what actually fires; the implementation is outside this range. Confirm in the service worker / `LOCKEDPush` definition.
4. **UNVERIFIED — the AI model behind AI Rec.** The Cloudflare Worker decides; nothing in the client names a model (v6.html:2663-2696). Confirm by inspecting the worker source or a live response.
5. **UNVERIFIED — where `lk_prs` is persisted and whether it syncs.** `p.setPrs` is a parent setter (v6.html:57916-57917); the storage write and any Supabase sync live outside this range.
6. **UNVERIFIED — is `smithNoCB` used anywhere?** It is copied onto every row (v6.html:10128) but never read in lines 8782-13955.
7. **UNVERIFIED — `ALL_EX` composition for `ReplacePanel`.** Whether custom user exercises appear in the swap list depends on how `ALL_EX` is built (outside range); `ReplacePanel` does not receive `p.customs` (v6.html:11417-11433).
