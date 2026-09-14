# E2E 1 — First run

Journey walked as a brand-new person: `localStorage.clear()` → cold load of
`10-final/locked-demo.html` → onboarding → setup (skip / back / blank name) → the plan it
built → first session logged and ticked → Finish → Review → Save → Home / Train / Progress.
TODAY in the build is **2026-09-09**. Reference data: `tests/fixtures/seed-data.json`,
`tests/fixtures/exercise-db.json`.

Zero `pageerror` and zero console errors were seen anywhere — all 18 routes, the whole
journey, and a click-crawl of every button on Home / Train / Progress / Recap / Review /
Workout detail / Profile / Workout log / Fuel / Coach.

## Defects

### 1. First run never reaches onboarding — the gate navigates to a route that renders Home
Cleared localStorage, loaded the file with no hash. The shell's first-run gate fires
correctly and sets `#/onboarding` (locked-demo.html:14464-14473), but `onboarding` is
registered as a *pushed* screen under `profile`, and `parseHash` only accepts a **tab id**
in the first path segment (locked-demo.html:14182-14187: `var base = tabOf(parts[0]) ?
parts[0] : TABS[0].id`). `onboarding` is not a tab, so it silently falls back to `home`.

- Pressed: nothing — just opened the app with empty storage.
- Expected: the Welcome screen (`#/profile/onboarding` is the working route).
- Got: URL `#/onboarding`, screen `demo-screen-home` — a stranger's "5 weeks on plan",
  "PPL - Legs · 2 days ago · 16 sets · 14,363 kg", "90 kg to 115 kg on the barbell
  deadlift", a Push session to start, and a restock card for canned tuna.
  `Object.keys(localStorage)` is `[]` the whole time.

There is also no in-app control anywhere in the seeded build that reaches onboarding
(Profile has no signup row; Settings' `create-account` / `sign-in` rows are not rendered),
so onboarding is only reachable by typing the URL.

### 2. Finish hands nothing to Review: the Review screen invents the session, and "Save session" refuses to save it
Logged a real session in `#/train/workout-log`: ticked every remaining working set,
edited Incline Cable Fly set 1 from 15 kg to 17.5 kg on the keypad. Header read
**15 working sets · 1 W, 4,001 kg, 21:06**. Pressed **Finish**.

- Expected: a review of that session.
- Got: `#/train/review` showing **16 working sets, 4,383 kg, 52 min**, a "Personal record —
  Barbell Bench Press 75 kg × 8, beat 72.5 kg × 8 set Sep 3", and per-lift rows
  (DB Shoulder Press 25 × 10, Incline Cable Fly 15 × 12, Lateral Raise 10.5 × 13) that
  contradict what I logged (25 × 9, 17.5/15 × 11, 10.5 × 15). I never lifted 75 kg.
  These are the screen's hard-coded dev fixture, locked-demo.html:35268 / :35287 — the same
  numbers the source comment at :35190-35193 says were removed.
- Then pressed **Save session**: toast *"Nothing to save: this screen was opened without a
  workout, so no record was written."* `lk_history` is never written; `lk_lastSession` never
  exists; `lk_liveSession` was deleted by Finish. The session is gone.

Root cause: the demo shell wires nav clicks in the **capture** phase and calls
`e.stopPropagation()` (locked-demo.html:14324-14332). `btn-finish` is a nav entry
(`{from:"workout-log", to:"review", endsSession:true}`), so the workout log's own `finish`
handler — which calls `handOff()` to write `lk_lastSession` (locked-demo.html:32509-32515,
:32905-32938) — never runs. Instrumented `LKStore.set`: **zero** calls fire on Finish.

Same root cause, two more user-visible breakages (defects 6 and 7 below).

### 3. The split onboarding builds is written with the wrong exercise IDs
Completed setup (name "Dana", kg, 1-3 years, 4 days, muscle size). The plan overview and the
written `lk_splits` name the right lifts, but the ids attached to them
(onboarding.html:557-571 = locked-demo.html:28283-28297) are a different exercise in the
app's own catalogue (`exercise-library.html`, matching `fixtures/exercise-db.json`):

| Plan says | id written | id actually is |
|---|---|---|
| Barbell Row | 201 | Pull Up |
| Lat Pulldown | 205 | Straight-Arm Pulldown |
| Barbell Curl | 401 | Overhead DB Extension |
| Barbell Squat | 501 | Incline DB Curl |
| Barbell Deadlift | 502 | Hammer Curl |
| Romanian Deadlift | 503 | Barbell Curl |
| Leg Press | 511 | Preacher Curl |
| Seated Leg Curl | 513 | Wide Grip Cable Curl |
| Seated Calf Raise | 521 | **does not exist** |

The real ids are 211, 202, 503, 701, 221, 801, 703, 803, 1102. Nine of the fourteen lifts in
the first plan are mis-keyed, so anything that joins a plan entry to history, PRs or the
library (Progress' record rows, the log's "last session" prefill, the exercise library) will
resolve the wrong lift or none. The comment directly above the table claims *"These are real
days with real exercises out of the same catalogue Train reads."*

### 4. "Start Upper A" on the plan overview opens somebody else's half-finished Push session
Pressed `overview-start` at the end of setup.

- Expected: a new Upper A workout — bench, barbell row, DB shoulder press, lat pulldown,
  barbell curl, tricep pushdown — with the copy above it saying *"Start Upper A and log the
  first set of the bench press. That set fixes the starting load for every session after
  it."*
- Got: `#/train/workout-log` titled **PPL - Push**, clock already at **21:14**, already
  **2 working sets · 1 W** and **1,088 kg** logged, five exercises pre-loaded with a
  stranger's weights (bench 72.5 kg from the Sep 3 seed session). The starting load is
  already fixed, by someone else.

The workout log is the same fixture whatever route you enter by; Train's "Start Upper A"
does the same thing.

### 5. Home's "Recent" rows and "See all" navigate out of the app into a browser error page
On `#/home`, tapped any row in the **Recent** list, or **See all**.

- Expected: that session's detail / the Train list.
- Got: `net::ERR_FILE_NOT_FOUND` for `10-final/workout-detail.html` (rows) and
  `10-final/train.html` (See all); the page becomes `chrome-error://chromewebdata/`. The app
  is gone — no tab bar, no back control, only the browser Back button. Reproduced on all
  five Recent rows.

Cause: `GOES` still does a page navigation for these two ids (locked-demo.html:15546-15547),
and they are the only two Home selectors missing from the demo's nav manifest
(`assemble.mjs` MANIFEST.nav, lines 106-111 + the `open-account` / `shelf-resume` / `row-cycle` entries later in the same list, covers `primary-action`,
`action-choose-session`, `row-last-session`, `row-climbing-lift`, `row-recap`,
`open-account`, `shelf-resume`, `row-cycle` — not `row-recent`, not `recent-see-all`).

### 6. Every session row in Recap opens the same invented workout, which also contradicts the row that opened it
From `#/home/recap`, tapped **PPL - Legs · Mon 7 Sep · 16 sets · 14,363 kg · 52 min**.

- Expected: that Monday Legs session.
- Got: `#/train/workout-detail` headed **SAT, SEP 5 · PPL · Pull**, *14 working sets,
  7,603 kg, 51 min*, first exercise **Barbell Row 82.5 × 8**. Tapping the Sep 3 Push row
  gives the identical screen.
- The seed's Sep 5 Pull is 16 sets / 7,158 kg / 51 min, and its first exercise is Barbell
  Deadlift 115 × 5 — Barbell Row is not in it. Recap's own row for Sep 5 prints
  16 sets / 7,158 kg. The detail's record id `w_1788618300000` (locked-demo.html:36278-36283)
  matches nothing in `lk_history` (Sep 5 is `w_1788631500000`).

Cause: Recap sets `lk_openWorkout` and then navigates (locked-demo.html:41377-41379), but
the capture-phase nav interceptor stops it, so `lk_openWorkout` stays `null` and
workout-detail falls back to its hand-written `SESSION`. Verified: after the tap,
`localStorage.getItem('lk_openWorkout') === null`.

### 7. Home's "Barbell Deadlift, up 25 kg in 5 weeks" row opens a Barbell Bench Press chart
Tapped `row-climbing-lift` ("Barbell Deadlift · Up 25 kg in 5 weeks · 115 kg").

- Expected: Progress plotting the deadlift.
- Got: Progress on **Barbell Bench Press** (91.8 kg, +17.8 kg since Jul 30).
  `lk_openLift` is `null` after the tap — same capture-phase interception
  (locked-demo.html:15562-15567). The comment there describes exactly this bug as fixed.

### 8. Progress' Barbell Deadlift record row dates a set to a day it was not lifted
`#/home/progress` → Records → **"Barbell Deadlift — Sep 5 · 110 kg × 6 · 2 records"**.

- `lk_prs["221"]` holds two records: `115 kg × 4, 2026-09-05` and `110 kg × 6, 2026-08-29`.
  The row takes its **date** from the most recent record and its **weight × reps** from the
  best-estimated-1RM record (progress.html:466-478 → `date: latest.date` paired with
  `best: rs[0]`; rendered at progress.html:815-817 = locked-demo.html:39550).
- Result: a set of 110 kg × 6 attributed to Sep 5. On Sep 5 the deadlift sets were
  115/115/115/105; 110 × 6 was Aug 29. The row's own "heaviest 115 kg" contradicts it.
  (Only the deadlift exposes this — every other lift's records share one date.)

### 9. Home and Train state two different durations for the same session
- Home: *"PPL · 5 exercises · about **55** min, **from your last Push sessions**"*
  (median of the six logged Push sessions = 55.5 → 55; home.html:316, :330).
- Train, same session, same moment: *"5 exercises · about **50** min"* —
  `minutes: count * MIN_PER_EX` with `MIN_PER_EX = 10` (train.html:258, :272 =
  locked-demo.html:15784). Nothing measured; it just multiplies.
- After onboarding the pair is 59 vs 60 for Upper A. Home's sentence claims provenance Train
  does not have.

### 10. Train's "New" split opens an existing split that claims it was just saved
`#/train` → **New** (`new-split`).

- Expected: an empty split to build.
- Got: `#/train/split-builder` showing **"PPL — Saved 2 minutes ago — 3 days · 15 exercises"**
  fully populated with Push/Pull/Legs. Nothing was saved 2 minutes ago; `lk_splits` records
  the PPL split as created 7/25/2026.
- The same screen also ignores the split onboarding just wrote: after completing setup,
  Train lists only "Upper / lower" and `lk_splits` contains only it, but split-builder still
  renders PPL.

### 11. Onboarding writes demographics the user never gave, backdated before the account existed
Finishing setup with only name/units/experience/days/goal answered writes
`lk_profile = {"name":"Dana","username":"cesco","age":29,"sex":"female","heightCm":168,
"weightKg":64.2,"goal":"build","coachName":"Coach","createdAt":"7/25/2026", ...}` — the
seeded persona's body data and a creation date six weeks before the account was made
(onboarding.html:618-625 merges onto the fixture profile). It also writes
`lk_proactiveTip` asserting a 5-week deadlift progression the new user has not done.

### 12. Home's "Start Push", "Choose another session" and "Last session" all just switch to the Train tab
`primary-action`, `action-choose-session` and `row-last-session` are all mapped
`to: "train", mode: "tab"` in the demo manifest. "Start Push" does not start anything, and
the "Last session — PPL - Legs" row lands on the Train hub rather than that session — which
is the behaviour locked-demo.html:15568-15570 says was replaced ("The last-session row went
to Train, which is a list of every session and not the one the row names").

### 13. Minor: the onboarding Welcome screen has no way back into the app
`#/profile/onboarding` renders standalone (no tab bar) and the Welcome screen offers only
Create account / Sign in / Continue as guest / Terms. Sign-in and sign-up both dead-end into
Setup. The only exit is to walk the whole guest + setup flow to the overview, or the browser
Back button. Low severity because nothing in the seeded build links here.

## Worked

- Cold boot, every one of the 18 routes, and a click-crawl of 286 controls across ten screens produced **zero** page errors and zero console errors.
- Setup skipping: Continue with a blank name, and "Skip this step" on any step, both advance without complaint, and the "n of 5 answered" counter tracks correctly.
- Setup Back: step 2 → step 1 restores the typed name; Back on step 1 returns to Welcome.
- The plan overview is internally consistent: "6 exercises, about 59 minutes" matches the six exercises it lists, the split shape matches the 4-days answer, and the rep range matches the goal.
- Choosing Pounds converts rather than relabels: Home then reads 31,665 lb for the 14,363 kg session and 198.4 → 253.5 lb for the deadlift line (exact × 2.20462).
- Home and Train both pick up the onboarding split immediately (Upper A, Upper / lower, 4 days · Upper A, Lower A, Upper B, Lower B).
- Ticking a set in the workout log fills the prescribed reps, and the header totals are exact: 2 → 15 working sets and 1,088 → 4,001 kg, every step equal to Σ weight × reps with warm-ups excluded.
- The number pad works and persists: 15 kg → 17.5 kg on Incline Cable Fly set 1 survived and was counted in volume.
- Live session state survives a reload: after F5 the ticks, edited weights and totals were all still there (`lk_liveSession`, `lk_liveSessionRows`).
- Prefilled weights and "was …" hints match the seed's Sep 3 Push exactly (bench 72.5 × 8/6/5, fly 15, lateral raise 10.5, pushdown 30).
- Train's "By muscle, this week" is exact against the seed's last seven days: Legs 16, Back 10, Chest 7, Shoulders 9, Arms 6, Core 0 working sets.
- Progress' headline checks out: 15 of 15 lifts heavier, 22 sessions since Jul 30, biggest gain Leg Press +35 kg, bench 91.8 kg (+17.8 since Jul 30) — all reproduce from the seed with Epley.
- Recap week view checks out: 1 session, 14.4k kg, 16 sets, 52 min, −43% on last week (14,363 / 25,124), 3 records on Mon 7 Sep, 3 of 7 days elapsed.
- Profile totals check out: 22 sessions, 12 records, 288 sets, 140k kg (seed sums to 140,204).
- Home's "5 weeks on plan" is right under its own definition (five consecutive whole weeks carrying ≥3 lifting sessions, Aug 3 – Aug 31).
- "Bought" on the restock card and "dismiss" on the insight card both persist across a reload (`lk_pantryItems`, `lk_homeLayout`).
- Back works from every pushed screen entered cold: split-builder, settings, review, workout-detail, cycle, recap, stack, tutorial all return to their parent tab.
