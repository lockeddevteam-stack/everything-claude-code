# Train area — verification of the earlier findings

Method: source read under `08-build/`, then Playwright 1.56.1 (Chromium at
/opt/pw-browsers) driving the screens at 420x900 over `file://` and, where the
build fetches, over `http://localhost:8899/08-build/`. Numbers were checked
against `08-build/fixtures.js` evaluated in node. TODAY = 2026-09-09.

## Fixed

- **workout-detail "How it felt" no longer prints undefined.** `FEEL_LABELS`
  (workout-detail.html:178) now carries energy/focus/pump/difficulty/enjoyment
  and filters out absent keys. Opened `w_1788804300000` (Sep 7) via
  `lk_openWorkout`: chips read `Energy 4, Focus 4, Pump 3, Difficulty 3,
  Enjoyment 4`, which is exactly that record's `reflection`. Opened
  `w_1788631500000` (Sep 5, `reflection: null`): zero chips, no placeholders.
- **workout-detail totals now come off the record.** Sep 5 printed "16 working
  sets · 7,158 kg · 51 min"; counting the fixture's done, non-warm sets gives
  16 and 7,157.5 kg. Sep 7 printed 16 / 14,363 kg against 16 / 14,362.5.
- **The split sheet no longer reads "edited undefined NaN".** `loadSplits`
  (train.html:266) counts `d.exercises.length` and `absDate` parses the
  US-format `created`. Opened all three sheets: "3 days · 15 exercises ·
  edited Jul 25", "2 days · 10 exercises · edited Aug 9", "3 days · 15
  exercises · edited Aug 27" — matching the fixture's 5/5/5, 5/5, 5/5/5 and
  its created dates.
- **The exercise-info "Last session" line reports the last session.**
  `set()` now defaults `prevKg`/`prevReps` to null (workout-log.html:203).
  Long-pressed Barbell Bench Press → Info & notes: "37.5kg x 8 · 72.5kg x 8 ·
  72.5kg x 6 · 72.5kg x 5", which is Sep 3's bench in the fixture, not today's.
- **The cardio picker's count is true.** `CARDIO_CAT` (train.html:397) holds
  41. Opened the sheet: 41 `log-cardio` rows in 4 groups (Machines 12,
  Outdoors 11, Water and snow 7, Classes/other 11), "All 41 activities", and
  typing reduces every group.
- **"Track left & right" does something.** Long-pressed card 0, tapped it: the
  subtitle became "Mid Chest · left and right" and working rows split into
  `1L`/`1R` pairs, each separately editable and tickable.
- **"Make it a superset" does something.** Long-pressed card 1, tapped it: DB
  Shoulder Press and Incline Cable Fly merged into one card with a Superset
  badge and interleaved `A1 B1 A2 B2 A3 B3` rows (workout-log.html:608).
- **The exercise grip reorders.** Tapped grip 0, pressed `move-down-0`: order
  went Bench/Shoulder Press → Shoulder Press/Bench, held after `move-done`,
  and survived a reload. ArrowUp/ArrowDown on the grip work too
  (workout-log.html:1685).
- **"Edit the sets" edits the record you were reading.** It no longer
  navigates. On `w_1788804300000` it opened an in-place editor
  (`ed-name`, `ed-kg-*`, `ed-reps-*`, `ed-rir-*`, `ed-addset`, `ed-delset`,
  `ed-delex`). Changed squat set 2 from 87.5 to 200: totals moved 14,363 →
  15,263 kg live (+112.5 x 8 = +900, correct). Deleted a set and an exercise:
  13 sets / 12,290 kg. Saved, reloaded — name "ZZ RENAMED LEGS", 13 / 12,290
  still there, and `lk_history`'s `w_1788804300000` held the same. That also
  clears F-TRAIN-317.
- **Review's "Save session" writes to `lk_history`.** `saveSession`
  (review.html:1057) pushes through `LKStore`. Drove the whole loop: logged a
  set in workout-log, pressed Finish, landed on review.html with
  `lk_lastSession` handed over, rated Energy 4 / Pump 2, typed a note, pressed
  Save session. Status became "Saved to history"; `lk_history` went 22 → 23
  with `{id, kind, name, date, min, sets:3, kg:1450, exercises:[…full sets…],
  note, reflection:{energy:4,pump:2}}`; `lk_lastSession` was cleared; train.html
  then listed the session. (It writes `date`, not `dateISO` — the seed's own
  vocabulary, and every reader uses it.)
- **The live session persists the sets, not only the clock.** `ROWS_KEY =
  'lk_liveSessionRows'` (workout-log.html:1161) stores exercises, blocks, rest
  settings and ties them to `LKSession`'s `startedAt`. Typed 33 into
  `cell-1-0-weight`, ticked `done-1-0`, reloaded: cell still 33,
  `aria-checked="true"`, header "3 working sets · 1 W · 1,385 kg".
- **Review's per-exercise set list, quick note and five ratings exist**
  (F-TRAIN-311/312). The review screen shows "EVERY SET" with every row
  (`W 40 kg × 10 4 RIR`, `1 72.5 × 8` …), a note field, and five 1-to-5 rating
  rows (`rate-energy-*` … `rate-enjoyment-*`). Its comparison arithmetic checks
  out: "1,450 kg today, 1,715 kg on Sep 3, −265, −15.5%" against
  `liftStats(lastTime(111,'2026-09-09'))` = `{vol:1715, top:[72.5,8]}`, with
  "Warm-ups excluded" stated.
- **The cardio catalogue, per-activity fields and the calorie estimator exist**
  (F-TRAIN-023/024). `estimate()` (train.html:520) returns kcal, a lo/hi band,
  a tier and a confidence. Opened Treadmill run (30 min, 5.2 km, 152 bpm
  prefilled): "HIGH CONFIDENCE / 368 kcal / 323 to 412 / Hard effort, 10.9 MET
  from your actual pace, at 64.2 kg body weight. Net … 334 kcal." Switched to
  45 min: 384 kcal, 338–431, 7.6 MET, Vigorous. Both match
  `MET*3.5*64.2/200*min` (384.2 and 333.7 for the net) and 64.2 kg is the last
  `lk_weightLog` entry. "Log it" wrote a cardio record to `lk_history` carrying
  `cal:384` and a full `calDetail {value, net, gross, range, method, tier,
  confidence, basis, estimated}`; it survived a reload and drove train's
  "CALORIES 384 estimated" tile.
- **Press-and-hold opens the exercise sheet** (F-TRAIN-124). A 600 ms
  mouse-down on `exercise-card-0` opened the options sheet.
- **The picker reaches the whole library** (F-TRAIN-103/126). Over
  `http://localhost:8899/` the swap sheet read "867 exercises", paged 40 at a
  time, and searching "lateral" returned 40+ matches from the real 866-row
  `tests/fixtures/exercise-db.json` plus the one custom. The "Replacing:
  Barbell Bench Press" header is there (workout-log.html:1007).

## Still open

- **progress.html:1534 `saveRecord` still accepts any number as a record.**
  The only guards are `load > 0` (:1540) and `reps >= 1` (:1541); there is no
  comparison against the stored best and no "Not a PR — your best at N reps is
  still X". Opened Progress → "Log a record without a workout", chose Leg
  Press, entered 1 kg × 5, pressed "Add to my records": toast "Leg Press, 1 kg
  for 5. Added.", Records header went "12 across 9 lifts" → "13 across 9
  lifts". The junk record also silently redates the row — Leg Press then read
  "Sep 9 · 165 kg × 10", because `recordLifts` (progress.html:467) takes the
  date from the newest record and the weight from the heaviest, so the screen
  now asserts a Sep 9 record of 165×10 that was never lifted.
- **split-builder.html:905 `doSave` persists nothing.** There is no `LKStore`
  or `localStorage` write anywhere in the file (only a read of `lk_openSplit`
  at :151). Opened train → PPL → Edit split → Edit, renamed to "ZZ RENAMED",
  removed `ex-remove-x2`, pressed Save split: the screen said "Saved just now"
  and "3 · 14 exercises"; `localStorage.getItem('lk_splits')` was `null`; going
  back to train.html still showed "PPL / 3 days" and the sheet still said 15
  exercises. The "Saved" claim is false.
- **exercise-library.html:1436 `save-custom` persists nothing.** It pushes onto
  the in-memory `S.customs` and never writes `lk_customEx`, while the sheet
  states "It is saved on this device and appears in browse, search and the
  counts" (:1189). Created "ZZTESTLIFT", saved, then read
  `Object.keys(localStorage)` → `[]`; after a reload, searching ZZTESTLIFT
  returned no rows. It also hard-codes `eq: 'Machine'`.
- **Exercise notes never reach `lk_exNotes`.** The only write is
  `S.exercises[S.overlayEx].note = t.value` (workout-log.html:1708), which
  rides along in `lk_liveSessionRows`. Typed "ZZNOTE elbow cue" into
  `detail-note`: it survived a reload of the same live session, but
  `localStorage.getItem('lk_exNotes')` was `null`, and `exFromHistory`
  (workout-log.html:251-259) seeds notes from hard-coded strings, so the note
  is gone the next time that exercise is programmed.
- **F-TRAIN-008 — no equipment picker on a custom exercise.**
  `sheetCreate` (exercise-library.html:1168) offers Name, Muscle group and
  Region only. No 9-item equipment list, no starting resistance for
  plate-loaded, no Smith counterbalance toggle — even though the seed's custom
  carries `startResist: 0` and `smithNoCB: false` (`LKFixtures.customEx`).
  `grep -n startResist` over every build HTML returns nothing.
- **F-TRAIN-010/100 — the swap picker offers no same-muscle alternatives.**
  The "Replacing:" header landed, but `addExList` (workout-log.html:1025)
  filters nothing by muscle. Swapping Barbell Bench Press (Mid Chest) over http
  opened the plain alphabetical library: "3/4 Sit-Up, 45° Incline Lateral
  Raise, Ab Crunch Machine, Ab Roller…".
- **F-TRAIN-017 — no per-exercise equipment memory.** `grep -rn exequip
  08-build/*.html` returns nothing; there is no bar, machine flag, base weight
  or plate inventory stored per exercise.
- **F-TRAIN-018 — plate maths is still four bars and additive tapping.**
  workout-log.html:894 offers `[[20,'Olympic 20kg'],[15,"Women's 15kg"],
  [10,'EZ bar 10kg'],[0,'No bar']]` — no Trap, no Smith. Opened the Plate
  calculator dev state: the only controls are `plate-add` per plate,
  `plate-undo`, `plate-clear`, `plate-apply`. There is no target-load field and
  no solver, so no "plates per side / achievable / remainder" anywhere.
- **F-TRAIN-019 — no muscle recovery and no weekly volume per muscle.** Dumped
  the whole of train.html's `#screen`: the sections are Today/PPL, Your splits,
  Cardio (favourites, this week, minutes per week, your bests, time in zone),
  History and Reference. Nothing per muscle.
- **F-TRAIN-021 — no Tab focus trap in the workout log's overlays.** The only
  key handlers are ArrowUp/Down on the grip (:1685) and Escape (:1712); the
  `Tab` trap that progress.html:1324 has was not copied. Opened the plate
  sheet and pressed Tab 45 times: focus ran `plate-bar-20 … plates-apply` and
  then straight out to `dev-toggle`, the dev state buttons, `btn-discard`,
  `btn-finish`, `grip-0`, `cell-0-0-weight` and on down the page behind the
  scrim, never returning.
- **F-TRAIN-104 — no Block/note item in the split builder.** The only add
  controls are `add-day` and `add-exercise-<day>` (split-builder.html:407,
  :476); the edit-mode action list read back from the DOM was
  `manual-back, edit-toggle, day-remove, ex-remove, add-exercise, add-day,
  save`.
- **F-TRAIN-110 — no stale "Last: <date>" chip.** Nothing in workout-log.html
  or train.html computes a 31-day gap on an exercise card.
- **F-TRAIN-113 — only the last set can be removed.** workout-log.html:1432
  `delset` does `cur.sets.pop()` and toasts "Last set removed"; the sheet item
  is literally "Remove the last set" and there is no per-row delete or swipe.
- **F-TRAIN-114 — the set number is not tappable and there is no drop set.**
  `setRows` renders it as `<div class="setgrid__n" aria-hidden="true">`
  (workout-log.html:531). `grep -n "drop"` over workout-log.html returns no set
  type; `set()` (:192) knows only `warm`.
- **F-TRAIN-115 — "Add warm-up sets" adds one warm-up, not two.**
  workout-log.html:1429 unshifts a single set at 50% × 10 reps @ RIR 4. The
  spec's second warm-up (70% × 5 @ RIR 3) does not exist, and the plural label
  overstates what the control does.
- **F-TRAIN-116 — no `+N` badge on the reps cell, and the partials toggle is
  dead.** Partials are a separate cell (`partialsHTML`, :507) that cycles 0→9→0;
  `cellHTML` (:464) never renders a partials badge. `S.hidePartials` (:279) is
  read at :537 and :648 and persisted at :1176, but no control anywhere sets
  it, so the "clear control" is a flag nothing can flip.
- **F-TRAIN-120 — no in-session PR check.** `grep -n lk_prs workout-log.html`
  returns nothing. Typed 100 kg × 5 into bench set 4 (stored best is
  `{exId:111, kg:72.5, reps:8}`) and ticked it: the live region said only "Set 4
  logged. 3 sets this session." — no banner, no toast, nothing on screen
  mentioning a record.
- **F-TRAIN-123 — no custom rest duration.** `restSettingsHTML`
  (workout-log.html:922) offers `[30, 60, 90, 120, 180, 300]` as fixed chips;
  there is no minutes + seconds field.
- **F-TRAIN-127 — the block is one field, unvalidated and unconfirmed.**
  workout-log.html:1596 does
  `title: (ti && ti.value.trim()) || 'Block'`, so an empty title is silently
  accepted — I pressed `block-add` with both fields empty and got a block named
  "Block". `duration` is hard-coded `''` (the sheet has one combined "Notes or
  duration" field at :946), there is no expand toggle, and `block-remove`
  (:1601) splices immediately with no confirmation.
- **F-TRAIN-133 — no idle prompt.** `grep -n "Still training\|idle"
  workout-log.html` returns nothing; no timer offers "No, continue" / "End and
  review".
- **F-TRAIN-136 — no "+N kg base" badge.** `startResist` appears in the seed's
  custom exercise but in no build file.
- **F-TRAIN-303 — a split still cannot be deleted.** `splitSheet`
  (train.html:1397) has only "Edit split" in its foot; I opened all three
  sheets and `[data-testid*="delete"]` matched nothing. split-builder has
  `day-remove` and `ex-remove` but no split-level delete.
- **F-TRAIN-307 — no Adaptive Training card.** Not present in train.html's
  rendered screen (full text dump above) and `grep -n Adaptive` finds nothing.
- **F-TRAIN-504 — no body-weight chart on the Progress page.** Body weight is
  still a drill-down: `row-body-weight` calls `openSheet('weight')`
  (progress.html:1204). Clicking it opened a sheet containing a 7-row list of
  dates and deltas and no SVG (`[role=dialog] svg polyline` → none). Note the
  seed only has 7 `lk_weightLog` points, so "30-point" is unreachable from this
  data regardless.
- **F-TRAIN-508/509 — the PR vault is still one flat list.** `recordsSection`
  (progress.html:696) renders one row per lift with a single est. 1RM value,
  sorted by date (`out.sort` on date, :471). There is no search field, no
  compound-first sort, no three tiles per row (1RM / 6-8 rep / est 1RM), and the
  per-lift detail was deliberately removed — the comment at :707 says the
  chevron "promised a detail screen there is not one of".
- **The 867-exercise picker is unreachable over `file://`.** `loadLibrary`
  (workout-log.html:984) bails out to the 6 hard-coded rows whenever
  `location.protocol === 'file:'`. Opened the same swap sheet as a file URL:
  "7 exercises, which is all this build could read from here", and searching
  "lateral" returned 0 rows. The caption is honest, so this is a delivery
  caveat rather than a false claim — but if the build is shipped as files, the
  feature is not there.
