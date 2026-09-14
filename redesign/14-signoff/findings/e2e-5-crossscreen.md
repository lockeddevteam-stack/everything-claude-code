# E2E-5 — cross-screen consistency

Method: Playwright/Chromium on `file://`, empty `localStorage` (so `LKStore` falls back to
`window.LKFixtures`, which is the seed), clock pinned to 2026-09-09 09:30 so time-of-day cards
render. Every screen opened standalone from `08-build/`, and the biggest findings re-checked in
`10-final/locked-demo.html`. Seed figures below are from `08-build/fixtures.js`, generated from
`tests/fixtures/seed-data.json`.

## Defects

### 1. exercise-library invents personal bests, and a split that does not exist
`08-build/exercise-library.html:688-701` is a hardcoded table.

| Lift | exercise-library | Progress / Profile / Train / workout-log | Seed (`lk_prs`) |
|---|---|---|---|
| Barbell Bench Press (111) | last 82.5 kg × 8, "2 days ago"; **best 90 kg × 5, Aug 24** | 72.5 kg × 8, Sep 3 | 72.5 kg × 8, 2026-09-03 |
| Barbell Squat (701) | last 120 kg × 5 Sep 5; **best 140 kg × 3, Aug 15** | 87.5 kg × 8, Sep 7 | 87.5 kg × 8, 2026-09-07 |
| Lat Pulldown (202) | last 72.5 kg × 10 Sep 8; **best 80 kg × 7, Aug 17** | 62.5 kg × 8, Sep 5 | 62.5 kg × 8, 2026-09-05 |

None of these reproduce from the seed or from anything logged. The dates are wrong too: the
"last bench" is stamped 2026-09-07, which was a Legs session, and the "last lat pulldown"
2026-09-08, on which nothing was logged. Exercises 101, 211 and 301 get a history in this table
and have never been logged at all (Progress and Train both say 15 lifts logged).

Same file, `IN_SPLIT` at line 697: the detail panel says the lift is in **"PPL v2 · Push"**.
Home, Train, split-builder and Coach all call the split **"PPL"**. Line 701 also gives Legs
**6** exercises; split-builder and Train say **5** (seed: 5).

### 2. Recap reads only the fixture, so nothing anyone does ever reaches it
`08-build/recap.html` has zero `LKStore` calls — `HISTORY`, `PRS`, `WEIGHT` and `NUT` are read
straight off `window.LKFixtures` (lines 144-157). Everything written by another screen is
invisible to it. Reproduced, each with a reload in between:

- Logged "Beef mince and pasta" (810 kcal) on Fuel. Fuel then reads **2,380 of 2,980 kcal,
  169 g protein**; Recap → Day still reads **1,570 of 2,980 kcal, 1,410 left, protein 121 g**.
- Logged 63.1 kg on Progress (`lk_weightLog` written, Fuel's hero follows to 63.1 kg).
  Recap → Day still reads **64.2 kg**.
- Finished and saved a session in workout-log → review (`lk_history` grows to 23; Home,
  Train "All 23", Progress "23 sessions", Profile 23/290/141k kg all follow). Recap → Week
  still reads **1 session, 16 sets, 14.4k kg**; Recap → Day still says **"Rest day."**

The same isolation makes Recap ship values that contradict the seed on first open:

- **Supplements "Creatine · Vitamin D — 2 of 2".** `lk_suppLog["2026-09-09"]` is
  `["Creatine"]` only. Home's Supplements-due card correctly lists Vitamin D as outstanding and
  Fuel's Supps panel correctly shows a Vitamin D streak of 2 days (broken today). Recap reads
  `LKFixtures.nutrition.days["2026-09-09"].supps`, where both are `taken:true` — the fixture
  disagrees with itself, and Recap is the screen that repeats the wrong half.
- **"Body weight — Wed 9 Sep — 64.2 kg".** `weightOn()` (recap.html:164) takes the last reading
  on or before the day and then labels it with the day. The last reading is 2026-09-07. Fuel
  says "Last weighed **Mon 7 Sep**".
- **"How it felt — Rest day. Legs still heavy from Monday. / Good".** That is the literal
  `FEEL` map at recap.html:157-162. `lk_feedback` has no 2026-09-09 entry (latest is 9/8) and
  every seeded note is empty. Coach → Check-in, which does read `lk_feedback`, correctly shows
  the most recent check-in as "Yesterday".

### 3. Fuel ignores the weight unit
`08-build/fuel.html` contains no reference to `LKUnits` (every other weight-printing screen
does). After Settings → Weight unit → Pounds:

- Settings: `29 · Female · 5 ft 6 in · **141.5 lb**`; Home, Progress, Profile, Train, Recap,
  workout-log, review all switch to lb.
- Fuel hero and Fuel's Body-weight card still read **`64.2 kg`**, on the same reload.

Same result in `10-final/locked-demo.html` (Profile "309k lb" / "363.8 lb" next to Fuel "64.2 kg").

### 4. Settings' body weight never follows a weigh-in
Settings' "Body and goal" row reads `lk_profile.weightKg`, which nothing updates. After logging
63.1 kg on Progress: Progress **63.1 kg**, Fuel **63.1 kg**, Settings still **64.2 kg**. Same
after saving 62.4 kg from Fuel's own weight card.

### 5. Home's insight card freezes the unit it was first rendered in
`home.html:660-668` caches the finished sentence in `lk_proactiveTip` for the day, units and
all. Open Home once in kg, switch to lb, reload Home: the card reads **"90 kg to 115 kg on the
barbell deadlift top set in 5 weeks. That is 5 kg a week"** while, on the same screen, the
recent sessions read **31,665 lb** and the Climbing card reads **254 lb** — and Progress /
Profile read 253.5 lb for that same deadlift. Reproduced in the demo build.

### 6. Home and Train disagree on how long today's Push takes
Same split, same day, same seed. Home: `PPL · 5 exercises · **about 55 min**, from your last
Push sessions` (`medianMinutes`, home.html:319 — the median of the logged Push durations).
Train: `5 exercises · **about 50 min** · last done 6 days ago` (`count * MIN_PER_EX`,
train.html:272). The seed's three Push sessions took 55, 55 and 51 min, so 55 is the supported
figure.

### 7. Coach counts 18 sessions where every other screen counts 22
Coach's opening line on a new chat: "I can see **18 sessions**, over 5 weeks, 9 lifts with
records and 6 check-ins." Home ("RECENT"), Train ("All 22"), Progress ("22 sessions logged")
and Profile ("22 SESSIONS") all say 22. The seed has 22 entries in `lk_history` — 18 lift, 4
cardio — and `totals.sessions` is 22. Coach filters to `kind === 'lift'` (coach.html:604) but
prints the unqualified word "sessions".

### 8. `lk_repeatWorkout` is written and never read
`workout-detail.html:636` writes it on "Do this session again", with a comment claiming "the
log reads lk_repeatWorkout at boot and starts from these lifts". `workout-log.html` contains no
reference to the key (it is the only occurrence in the whole build). The repeat therefore lands
on whatever day the log builds from the split, which is the bug the comment says it fixed.

### 9. workout-detail opened without a hand-over shows a session that is not in the history
Opened directly (no `lk_openWorkout`), the screen falls back to the literal `SESSION` object and
renders it as a real past workout: header **"SAT, SEP 5 · PPL · Pull · 14 working sets ·
7,603 kg · 51 min"**, exercises **Barbell Row 82.5 kg**, **Lat Pulldown 65 kg**, **Face Pull
29.3 kg with a PR badge**, plus reflection 4/4/3/3/4 and the note "Left elbow tight on the first
two sets of rows." The seed's 2026-09-05 session is **16 working sets, 7,158 kg**, starts with
**Barbell Deadlift 115 kg**, has Lat Pulldown at 62.5 and Face Pull at 20, and carries no
reflection and no note (the 4/4/3/3/4 and a note belong to the 2026-09-07 Legs session). Home,
Train and Recap all disagree with this screen about the same date. Navigating from a history row
is correct — `lk_openWorkout` is set and the screen renders 16 sets / 7,158 kg / Barbell
Deadlift — so this is the standalone/deep-link state only, but that state is reachable from the
demo's screen index.

### 10. Progress' 1RM chart axis stays in kilograms after the switch to lb
The figures above the chart read 202.4 lb / 159.8 lb, the axis ticks read 70–95, and the caption
reads "Vertical axis in kilograms, starting at 70, not at zero." The caption and ticks are the
kg values; the numbers beside them are lb.

## Agreed

- **Body weight.** Fuel 64.2 kg, Progress "ALSO TRACKED 64.2 kg", Settings 64.2 kg = seed
  `lk_weightLog` last entry 2026-09-07 64.2 and `profile.weightKg` 64.2. Profile and Coach do
  not print a body weight. (Recap and Settings break on change — defects 2 and 4.)
- **Cycle.** With cycle tracking on: Cycle "Day 12 · Follicular · Next in 17 days · Sep 26" and
  Home "Day 12 · Follicular, estimated · next period in 17 days". `LKFixtures.cycleOn('2026-09-09')`
  returns day 12, follicular, nextStart 2026-09-26, daysToNext 17. Both gate on `lk_cycle`.
- **Today's calories and macros.** Fuel 1,570 eaten / 1,410 left of 2,980, 121/168/44 g = the
  seed's three meals for 2026-09-09 exactly. Coach's canned nutrition reply ("2,702 kcal over the
  last fourteen days against a 2,980 target") matches the mean of `nutrition.trend`. Home prints
  no calorie figure at all. (Recap disagrees — defect 2.)
- **Session count, volume, sets.** Progress "22 sessions logged", Train "All 22", Profile
  22 / 288 sets / 140k kg, Home's recent list = seed `totals` {sessions 22, sets 288,
  volumeKg 140204}. All four follow a newly saved session (23 / 290 / 141k). (Coach and Recap
  disagree — defects 7 and 2.)
- **Personal bests.** Progress records (12 across 9 lifts), Profile's PR list, Recap → Week's
  three Sep 7 records and workout-log's prefill (bench 72.5 kg) all match `lk_prs` exactly.
  (exercise-library disagrees — defect 1.)
- **Split.** Home "PPL · 5 exercises" for Push, Train "PPL — 3 days · Push, Pull, Legs",
  split-builder "3 · 15 exercises" with 5 per day, Coach's plan "Linear progression on PPL" =
  seed `lk_splits[0]`. (exercise-library disagrees — defect 1; Home/Train disagree on duration —
  defect 6.)
- **Supplements list.** Fuel's Supps panel and Home's due card both list exactly Creatine (5 g,
  Morning) and Vitamin D (2000 IU, Morning) = seed `lk_supplements`. Ticking Vitamin D on Home
  writes `lk_suppLog` and Fuel's streak goes 2 → 3 days on the next load. (Recap disagrees about
  what was taken — defect 2.)
- **Shopping and pantry.** Shopping "8 of 10" with Oats and Almonds checked, four pantry items
  with Canned tuna empty = seed `lk_shoppingList` / `lk_pantryItems`. Home's Running-low card
  names Canned tuna; pressing "Bought" writes `lk_pantryItems` and Shopping's Pantry tab drops it
  out of Restocking on the next load. Fuel reads and writes the same two keys.
- **Units.** Settings, Home, Progress, Profile, Train, Recap, workout-log, review and
  workout-detail all convert through `LKUnits` off `lk_profile.useKg`. (Fuel does not — defect 3;
  Home's cached insight and Progress' axis caption do not — defects 5 and 10.)
- **Streak.** Both count consecutive days with a session from the seed's last session (Sep 7) and
  get 0. With `lk_badges` on, Home suppresses a zero-day pill and Profile shows "0 DAY STREAK /
  3 days BEST RUN / last trained Sep 7". Home's "5 weeks ON PLAN" is weeks-on-plan, not a streak.
