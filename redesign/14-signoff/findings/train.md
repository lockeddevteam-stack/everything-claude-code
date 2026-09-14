# Train area — findings (100: 40 present, 34 partial, 12 missing, 13 cut)

Files: train.html, workout-log.html, workout-detail.html, review.html,
split-builder.html, exercise-library.html

## Class 1 — untrue / broken figures

- **workout-detail's "How it felt" prints undefined.** "Energy 4 · Pump 3 ·
  Strength undefined · Sleep undefined · Stress undefined". The seed's
  reflection is `{energy, focus, pump, difficulty, enjoyment}`; `FEEL_LABELS`
  (workout-detail.html:169) asks for `energy, pump, strength, sleep, stress`.
  Three chips are dead and two stored values are never shown.
- **The split sheet reads "edited undefined NaN"** (train.html `splitSheet`,
  `absDate(sp.updated)`) and counts exercises as `days.length * 5` rather than
  summing them.
- **The exercise-info sheet's "Last session" line reports today's figures.**
  `set()` defaults `prevKg`/`prevReps` to today's own values
  (workout-log.html:279), so `exFromHistory`'s `st.prevKg === undefined` guard
  never fires for a pre-seeded set. Sep 3's bench was 37.5×8 W, 72.5×8,
  72.5×6, 72.5×5; the sheet shows today's.
- **The cardio picker says "41 activities, searchable"** over a catalogue of
  9 (`CARDIO_ALL`, train.html:273).
- **Logging a PR without a workout accepts anything.** `saveRecord`
  (progress.html:1189) checks weight > 0 and reps ≥ 1 only, so 1 kg × 5 is
  filed as a record for a lift whose best is 100 × 5. v6 rejected it with
  "Not a PR — your best at N reps is still X".

## Class 3 — controls that do nothing

- **"Track left & right"** sets `cur.unilateral` and no render function reads
  it (workout-log.html:1209). Either build the six-column L/R grid or remove
  the item.
- **"Make it a superset"** sets `cur.superset` and no render function reads it
  (:1203). Either build the A/B pairing (interleaved rows, one shared Add Set,
  A's tick half-states until B is done) or remove it.
- **The exercise grip announces "Reordering" and nothing can move**
  (:1161). split-builder.html:1246 has a working drag plus Up/Down buttons —
  use the same pattern.
- **"Edit the sets" on a stored workout** navigates to the live workout log,
  which opens today's session, not the record you were reading.
- **Review's "Save session"** sets `S.saved` and writes no history record
  (review.html:998). This is the single biggest gap in the training loop: a
  finished workout never joins `lk_history`.

## Persistence

- `lk_liveSession` stores name, startedAt, done and total — **not the sets**.
  After a reload the header loses the work and keeps the clock. Persist the
  session rows.
- Review's Save must write a full record to `lk_history` through `LKStore`:
  `{id, name, sets, vol, dur, date, dateISO, reflection, note, exercises}`.
- Split edits must persist to `lk_splits`. Exercise notes must persist to
  `lk_exNotes` — the card says "Saves automatically" and nothing is written.
- Custom exercises must persist to `lk_customEx`.

## Missing — build

| ID | What |
|---|---|
| F-TRAIN-008 | Custom exercise: an equipment picker (9 items), starting resistance for plate-loaded, a Smith counterbalance toggle |
| F-TRAIN-010/100 | Swap: a "Replacing: <name>" header and up to 6 same-muscle alternatives, then search |
| F-TRAIN-017 | Per-exercise equipment memory (`lk_exequip_<id>`): bar, machine flag, base weight, plate inventory |
| F-TRAIN-018 | Plate maths: six bars (add Trap and Smith), and a greedy solver that takes a target load and returns plates per side, achievable and remainder — not only additive tapping |
| F-TRAIN-019 | Muscle recovery and a weekly volume summary per muscle |
| F-TRAIN-021 | A Tab focus trap in the workout log's overlays (progress.html:1211 has one) |
| F-TRAIN-023/024 | The cardio catalogue (41 activities in 4 groups), a field schema per activity, and a calorie estimator returning kcal, a range, a tier and a confidence. Today a logged cardio session carries no calorie figure at all. |
| F-TRAIN-103/126 | The add/swap picker must reach the whole 867-exercise library, not 6 or 14 curated rows |
| F-TRAIN-104 | A Block/note item in the split builder |
| F-TRAIN-110 | A "Last: <date>" stale chip on an exercise card over 31 days old |
| F-TRAIN-113 | Remove any set, not only the last one |
| F-TRAIN-114 | Tap the set number to cycle Normal → Warm-up → Drop; a drop set auto-fills 75% of the preceding weight |
| F-TRAIN-115 | Two warm-ups (50% × 8 @ RIR 4 and 70% × 5 @ RIR 3), rounded to 2.5 |
| F-TRAIN-116 | Partials: a clear control, and a `+N` badge on the reps cell |
| F-TRAIN-120 | An in-session PR check when a set is ticked, with the all-time banner |
| F-TRAIN-123 | A custom rest duration (minutes + seconds) |
| F-TRAIN-124 | Press-and-hold (~420 ms) on an exercise card to open its sheet, with the "Hold for options" tip. The screen's own notes claim this is restored and it is not. |
| F-TRAIN-127 | Block: reject an empty title, separate notes and duration, an expand toggle, a confirmed delete |
| F-TRAIN-133 | A 30-minute idle prompt: "Still training?" with "No, continue" / "End and review" |
| F-TRAIN-136 | A "+N kg base" badge from `startResist` |
| F-TRAIN-303 | Delete a split — it can be deleted nowhere in the build |
| F-TRAIN-307 | The Adaptive Training card |
| F-TRAIN-311/312 | Review: a per-exercise set list, a quick note, and the five reflection ratings (energy, pump, strength feel, sleep, stress) rather than one four-chip question |
| F-TRAIN-317 | Workout-detail edit mode: rename, edit/add/remove sets, remove exercises, recompute the volume |
| F-TRAIN-504 | The 30-point body-weight chart on the Progress page itself |
| F-TRAIN-508/509 | PR vault: search, compound-first sort, three tiles per row (1RM / 6-8 rep / est 1RM), and a per-lift detail |

## Needs a server — local half plus a plain statement

F-TRAIN-309/310 (a conversational AI split builder and photo import),
F-TRAIN-015/016.
