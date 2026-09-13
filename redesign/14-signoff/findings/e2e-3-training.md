# E2E 3 — a lifter running a programme

TODAY = 2026-09-09. Seed: `redesign/tests/fixtures/seed-data.json`.
Screens served over `http://127.0.0.1:PORT/08-build/…` (so the 867-exercise
library loads) and the assembled demo at `10-final/locked-demo.html`.
`pageerror` and console listeners were attached for every run; **no page threw
and no console error was raised anywhere** (all nine training screens including
every dev state, and nine demo routes).

## Defects

### 1. In the assembled demo a workout cannot be saved at all. Finish hands Review a different session.
`locked-demo.html#/train` → **Start Push** → tick set 4 → header reads
`1,450 kg · 3 working sets · 1 W` → **Finish**.
Review opens at `#/train/review` showing **`Push · 16 working sets · 4,383 kg ·
52 min`**, five exercises I never logged, and a **`PERSONAL RECORD — Barbell
Bench Press 75 kg × 8`** that did not happen. Pressing **Save session** returns
`"Nothing to save: this screen was opened without a workout, so no record was
written."` — `lk_history` is never written (localStorage after the whole run
holds only `lk_liveSessionRows`, `lk_proactiveTip`, `lk_theme`), and Train still
reads `All 22`.

Cause: the demo router takes nav clicks in the **capture** phase and calls
`e.preventDefault(); e.stopPropagation()` (`10-final/assemble.mjs:722-729`,
built at `10-final/locked-demo.html:14324`). `btn-finish` is in `CFG.nav`, so
`workout-log.html`'s own `case 'finish'` (`08-build/workout-log.html:1910-1915`)
never runs and `handOff()` (`:2307`, writes `lk_lastSession`) never fires.
Review reads exactly that key (`08-build/review.html:279`). The code comment at
`workout-log.html:2341` already knows "the demo's router … has to swallow the
click", but nothing moves the hand-off.

The standalone path is fine: `08-build/workout-log.html` → Finish → Review shows
`3 working sets · 1,728 kg · 21 min` and Save writes history (23 entries).

### 2. Logging a PR in the workout log silently destroys three stored records.
Progress before: `RECORDS — 12 across 9 lifts`, e.g. `Barbell Deadlift · Sep 5 ·
110 kg × 6 · 2 records`, `6–8 reps: 110 kg`.
Log bench 80 kg × 8 in `workout-log.html` and tick it (correctly announced
`Personal best. 80 kg for 8, past 72.5 kg.`). Progress after: **`RECORDS — 10
across 9 lifts`** and `Barbell Deadlift · Sep 5 · 115 kg × 4`, `6–8 reps: —`.

Expected 13. Three seed records are gone: bench `72.5 × 5`, squat `82.5 × 5`,
deadlift `110 × 6`.

Cause: `prMap()` (`workout-log.html:2187`) reads `LKStore.get('lk_prs')`, which
falls back to `LKFixtures.prs` — and the fixture generator flattens the key to
**one row per lift** (`tests/fixtures/gen-fixtures.mjs:127-128`, 9 rows vs the
seed's 12). `recordPR()` then writes that truncated map back
(`workout-log.html:2235`), and from then on it is the stored truth. Progress has
its own `SEED_RECORDS` table (`progress.html:210-222`) written precisely to work
around the lossy fixture, so the two writers disagree — Progress's own
"Log a record" writer preserves all 12 and correctly goes 12 → 13.

### 3. In the demo, "New" and "Edit split" always open the PPL split — and editing renames the wrong split.
`#/train` → **Edit split** on **Full Body 3x** (sheet header confirms
`Full Body 3x · 3 days · 15 exercises · edited Aug 27`). The builder opens
titled **PPL**, 3 days, `Push, Pull, Legs`. Rename to `Renamed By Me` → Save
split → `lk_splits` becomes
`Renamed By Me/s1784970000000 | Upper / Lower | Full Body 3x` — **PPL was
renamed, Full Body 3x untouched.**
Same for the **New** button: it opens the populated PPL split, not an empty one.

Cause: both selectors are in `CFG.nav`, so the capture handler's
`stopPropagation` prevents `train.html:2021-2028` from ever writing
`lk_openSplit` (it reads `null` in the demo), and `show()` boots a screen only
once (`assemble.mjs:606` / `locked-demo.html:14209`), so `seedSplit()`
(`split-builder.html:167-169`) falls through to `splitFromFixture(null)` →
`all[0]` = PPL.

### 4. Recap never reflects a saved session; it and Train disagree.
Save the Push session in the standalone flow. Train: `All 23`, top row
`PPL · Push · Today · 21 min · 3 sets · 1,728 kg`. Home: `2 days this week`.
Progress: `23 sessions logged`. **Recap "This week" is byte-identical to its
pre-save state**: `1 session`, `14.4k kg`, `16 Sets`, `52 min`, `1/1 Lifting`,
`SESSIONS: PPL - Legs` only, `RECORDS 3` (no bench 80 × 8).
Cause: `recap.html:144-146` reads `window.LKFixtures` only and never touches
`LKStore`/`lk_history`. Same in the demo (`locked-demo.html:40891`).

### 5. Demo: "Split saved." but Train still shows the old name until a full page reload.
After defect 3's rename, `lk_splits` holds `Renamed By Me`, the builder says
`Saved just now`, but navigating back to `#/train` still lists
`PPL CURRENT · 3 days · Push, Pull, Legs`. Only `location.reload()` shows
`Renamed By Me CURRENT`. Screens boot once and Train does not re-read
`lk_splits` on `lk:enter`.

### 6. A brand-new, empty split claims it has been saved.
`split-builder.html` with `lk_openSplit='__new__'`: title `New split`, subtitle
**`Saved 2 minutes ago`**, body `No days yet · A split is a list of training
days.` Nothing has been saved. The same false subtitle sits over every split you
open for editing. Cause: the screen boots through the dev preset
`Manual · populated`, which hard-codes `S.manual.savedAt = '2 minutes ago'`
(`split-builder.html:793`, invoked at `:1364`; `locked-demo.html:26523`).

### 7. Progress → Goals → "A lift": the From hint always says nothing is logged.
Add a goal → **A lift** → select **Barbell Bench Press**. Hint under From reads
`kg. Left blank, From is where you are now, and nothing is logged yet.` and the
placeholder reads `now` — for every lift, including Leg Press with `165 kg × 10`
on record. Saving proves the copy wrong: the goal is stored with
`"start":72.5`, i.e. it *did* know where you are.
Cause: the hint is computed from `document.getElementById('gl-lift').value`
while that select is still being built, so `exId` is `0`
(`progress.html:1060`), and changing the lift does not re-render the hint
(`progress.html:1089-1090`).

### 8. Plate calculator in lb cannot make 225 lb.
Workout log → tools → **Switch to lb** → Plate Calc. Bar presets read
`44.1lb / 33.1lb / 22lb` (the kg bars converted). Type `225` → **Load it** →
`The nearest this bar and these plates can make is 224.1 lb, not 225 lb.
Per side: 45 + 45 lb.` A 45 lb bar plus two 45s is the commonest loading in
lb-land and is unreachable. (The refusal itself is correct behaviour; the bar
table is what is wrong.)

### 9. "Last session" in the exercise info sheet changes when you delete one of today's sets.
Open Barbell Bench Press → Info & notes → `LAST SESSION: 37.5kg x 8 · 72.5kg x 8
· 72.5kg x 6 · 72.5kg x 5` (Sep 3's bench, minus its fifth set `67.5 × 5`
because today only has four rows). Now remove today's set 1 via
`Remove a set by number` and reopen: the same panel reads
`37.5kg x 8 · 72.5kg x 6 · 72.5kg x 5`. What was done on Sep 3 does not depend
on how many rows today has; the panel is rendered from
`ex.sets[].prevKg` (`workout-log.html:983-985`).

### 10. Home and Train give different durations for the same next session.
Home: `Push — PPL · 5 exercises · about 55 min, from your last Push sessions`
(mean of the six logged Push sessions = 55.2 min, correct).
Train, same card: `5 exercises · about 50 min · last done 6 days ago`
(flat 10 min × 5). Two screens, two figures, same session.

## Worked

- Recovery block matches the seed exactly by hand: Legs 16/Ready(2 d), Back 10/4 d, Chest 7/6 d, Shoulders 9/4 d, Arms 6/4 d, Core 0/Never — from working (non-warm, done) sets since 2026-09-03.
- Building a split from scratch: add day, name it, add exercises from the 867-row picker, rename a day, tap-grip reorder (Up/Down/Done), swipe/edit remove, Save → `lk_splits` gains the split at the front; reload shows it; Train lists it and makes it the current split.
- Saving the same split twice updates it in place rather than duplicating.
- Deleting a split needs a second confirming tap, says "The sessions you logged from it stay in your history", persists, and history stays at 22.
- Plate calculator forward: 20 kg bar + 20 + 10 per side = 30 per side / 80 total, with the correct bar diagram.
- Plate calculator reverse: `102.5` → `Per side: 25 + 15 + 1.25 kg`; `101` → refuses, `The nearest … is 100 kg, not 101 kg`; **Apply to next set** writes 100 into set 3.
- Set-type cycle work → warm-up → drop → failure → work, with the numbering (`1`, `W`, `1D`, `1F`) and volume both following: marking the 72.5 × 8 as a warm-up drops volume 1,088 → 508 kg (= 72.5 × 7).
- Warm-up ramp: rungs 50/70/85 % inserted before the working sets (`Warm-up at 51 kg added.` against a 72.5 top set), capped at three with a stated reason.
- Custom rest: `215` → `Rest set to 3:35.`; `3` → `Between 5 and 900 seconds.`
- Partials: tap increments, reps render `8+4`, aria reads `4 logged`, volume correctly unaffected.
- Per-set delete by number lists every set with its figures; removing 72.5 × 8 takes volume to 508 kg and renumbers.
- Exercise notes: the seeded note `Pinkies on rings, feet back` loads, edits save to `lk_exNotes` and survive a reload.
- Equipment memory: Smith machine + 15 kg base writes `lk_exEquip {"302":{"eq":"Smith machine","base":15}}`, shows `· +15 kg base` on the card, and survives a reload.
- Swap picker replaces in place (5 exercises stay 5, `Swapped to Incline Barbell Press`) while Add Exercise appends (5 → 6).
- Unilateral (`1L/1R/2L/2R/…`), superset, AI Rec (suggested 27.5 × 9 off a 25 × 9 last session), Add Set and Block all do something.
- A live session survives a reload of the log: ticked sets, weights and totals all return.
- PR announced on the tick: `Personal best. 80 kg for 8, past 72.5 kg.` — correct against `lk_prs` 111.
- Review's comparison arithmetic: `1,728 kg today, 1,715 kg on Sep 3`, `+13 kg`, `+0.8%` — Sep 3's bench is 580+435+362.5+337.5 = 1,715 kg exactly.
- Saved session is identical across Train, Home, Progress and workout-detail (3 sets · 1,728 kg · 21 min), with per-set `Was 72.5 x 8` back-references.
- Weigh-in: 63.8 kg appends to `lk_weightLog`, redraws the chart, and the summary moves from `−1.1 kg over 6 weeks, or −0.2 kg a week` to `−1.5 kg / −0.3 kg a week`; survives reload.
- Body fat 22.4 % (Calipers) appends newest-first, survives reload, and the row updates to `3 readings since Aug 3 · Calipers`.
- Goals persist; the percentages are reproducible: Bench 75 = (72.5−60)/(75−60) = 83 %, Squat 100 = 50 %, Body weight 63 = (65.4−64.2)/(65.4−63) = 50 %.
- Junk record refused: Leg Press 1 kg × 5 → `Leg Press already has 165 kg for 10. A record has to beat the record … Log it as a set instead.` and `lk_prs` stays untouched. A genuine 175 kg × 8 is accepted, takes records 12 → 13 and survives reload.
- Home's insight checks out: deadlift top set 90 → 115 kg between Aug 1 and Sep 5 is +25 kg over 5 weeks = 5 kg/week. Progress's `Biggest gain: Leg Press, +35 kg on the estimate` (196.0 → 231.0 Epley) and bench e1RM 91.8 kg (72.5 × (1+8/30)) both reproduce.
- Recap's `-43% on last week` is right for the data it uses: 14,363 vs 25,124 kg.
- lb conversion is self-consistent: 72.5 kg → 159.8 lb, 1,087.5 kg → 2,397 lb.
