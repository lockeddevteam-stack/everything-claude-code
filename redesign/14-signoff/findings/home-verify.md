# Home / Recap / Cardio — verification of 14-signoff/findings/home.md

TODAY = 2026-09-09. Every line below was driven in Chromium over `file://`, not read
off the source alone.

## Fixed

- **Class 1, hardcoded cycle row.** With `lk_cycle` on, `cycle-day` reads "Day 12" and
  `cycle-sub` "Follicular, estimated · next period in 17 days"; the same page's
  `LKFixtures.cycleOn('2026-09-09')` returns `{day:12, phase:"follicular",
  nextStart:"2026-09-26", daysToNext:17}`. The string now comes from the seed
  (home.html:543-561), not from a literal.
- **Class 1, empty state gated on a dev state.** With `lk_splits` set to `[]` and **no**
  `?state`, `#screen[data-state]` is `empty` and `card-answer` reads "No sessions yet /
  Build a split". `autoState()` (home.html:1040) picks the state; the dev switcher only
  overrides. F-HOME-016 same evidence.
- **F-HOME-005 uDays + consistency.** `week-summary` renders "1 day this week · Building
  momentum"; the seed has one session (Mon Sep 7) in the Mon-first week of Sep 7.
  `M.uDays`/`M.consistency` at home.html:239-244.
- **F-HOME-006 insight card.** `card-insight` renders "90 kg to 115 kg on the barbell
  deadlift top set in 5 weeks…"; `lk_proactiveTip` after load is
  `{"text":"90 kg to 115 kg…","date":"2026-09-09"}` — cached per day. Pressing
  `dismiss-insight` removes it and it is still gone after `reload()`, with a
  "Show 1 hidden card" restore button (`lk_homeLayout.hidden`).
- **F-HOME-009 dynamic feed.** All four card slots proved reachable and data-driven:
  insight and restock at default; `card-supps` appears once the clock is inside the
  window (below); `card-compounds` appears once `lk_cycles` holds an active cycle.
- **F-HOME-013 / F-HOME-014 recents.** Exactly 5 `row-recent` rows plus `recent-see-all`
  (→ train.html). Clicking the 2nd row navigated to **workout-detail.html** with
  `lk_openWorkout = w_1788678900000`, and the detail page opened on "Treadmill run,
  30 min · 5.2 km · 340 kcal" — the session the row named. `row-last-session` likewise
  → workout-detail.html with `w_1788804300000`, heading "PPL - Legs".
- **F-HOME-015 auto-add due staples.** With the seed nothing is due (Whey protein,
  staple, added 2026-08-19, interval 30 → due Sep 18), and nothing is written — correct.
  Backdating its `lastBought` to 2026-07-01 and reloading wrote `lk_shoppingList` with a
  new `{itemName:"Whey protein", auto:true}` entry (10 → 11 items) **before** first
  paint, and the card then read "Whey protein · 40 days overdue · on your list".
- **F-SHOP-031 running low.** `card-restock` lists "Canned tuna · marked empty" (the seed's
  only `empty:true` pantry row) and the overdue staple. Pressing `staple-bought` removed
  the Whey row and it was still gone after `reload()` (`lk_pantryItems.lastBought`).
- **F-SUPP-010 supplements due, with windows.** With the page clock fixed to
  2026-09-09T08:30 `card-supps` reads "Creatine 5 g · Morning / Vitamin D 2000 IU ·
  Morning". At 00:30 the card is absent — the Morning 05-12 window in `SUPP_WINDOW`
  (home.html:672-675) is real. Pressing `supp-taken` on Creatine wrote
  `lk_suppLog = {"2026-09-09":["Creatine"]}` and after `reload()` only Vitamin D remained.
- **F-GAME-001, the Profile half.** With Settings' "Streaks and badges" switched on
  (`switch-badges` → `lk_badges = true`) and a history seeded with Sep 7/8/9, Profile's
  header shows `[data-testid=streak]` = "3 days in a row · best 3". (The Home half is
  open — see below.)
- **F-CARDIO-002..004 favourites surface.** Cardio lives in train.html, not home.html.
  `open-favs` opens `favs-sheet` with the one stored favourite, up/down reorder buttons
  (first correctly `disabled`), a rename input that writes `lk_cardioFavorites[].label`
  on type ("Morning jog" landed in storage), and a two-tap delete: the first tap turns
  the bin into a red "Remove" and storage is untouched; the second writes `[]`. The
  `favs-empty` state ("No favourites yet") then shows and survives a reload.
- **F-CARDIO-005 ★ on the quick rows.** `log-fav-fav_1787122800000` carries the star path
  `M12 4l2.4…`; the two recent-modality rows beside it do not. (The catalogue tiles do
  not — see below.)
- **F-CARDIO-008 this-week stat row.** `cardio-week` reads "This week 0 sessions /
  Minutes 0 of 150 target / Calories 0 estimated" — correct, the seed's newest cardio is
  Sun Sep 6, outside the Mon Sep 7 week. After logging a 30-min row it read
  "1 session / 30 / 329", so the figures are computed, not fixed.
- **F-CARDIO-010/011 bests + time in zone.** `cardio-bests` renders Furthest 9 km
  (Upright bike, Aug 16), Best pace 5:46 /km (Treadmill run, Sep 6), Fastest 21.6 km/h,
  Longest 45 min (Walking, Aug 23), Biggest burn 340 kcal — each checked against the four
  cardio records in fixtures.js and each correct (9 km/25 min = 21.6 km/h; 30 min/5.2 km
  = 5:46). Pace is withheld from wheeled activities on purpose (train.html:826-834).
  Time in zone reads "120 min placed / Z1 45 / Z2 45 / Z3 30, heart rate reserve 58 to
  191 bpm" from the seed's `heartRate.avg` values. **The fixture blocker named in the
  finding is gone**: fixtures.js now carries `heartRate`, `metrics`, `intensity` and
  `machine` on every cardio record.
- **F-CARDIO-012 expandable session detail.** `history-w_1788678900000` toggles open
  `detail-w_1788678900000`: "Duration 30 min / Distance 5.2 km / Pace 5:46 /km / Speed
  10.4 km/h / Heart rate 152 bpm / Effort RPE 6 / Surface Machine / Machine Treadmill /
  Gross burn 340 kcal / Net burn 304 kcal" plus the estimate caveat. A 500 m split is
  added for rowing modalities (train.html:649).
- **F-CARDIO-015..020 the log form.** Rowing erg form: minute chips 10/15/20/30/45/60,
  `cf-dist`, `cf-watts`, `cf-hr`, four `cf-effort-*` chips, notes. `cardio-estimate`
  showed "191 kcal / 168 to 214 / High confidence" with a 5-segment meter
  (`qbar-0..4`, 3 of 5 lit) and a basis line naming 8.5 MET and 64.2 kg body weight;
  pressing `cf-min-30` moved it to 286 kcal and filling distance/watts/HR/effort lit all
  5 bars and moved it to 329 kcal. Surface and riding position exist as `choice` fields
  on the activities that have them (walk/run carry `surface`, Outdoor cycling carries
  `position`, train.html:414/417).
- **F-CARDIO-021/022 Logged summary and Save this setup.** `cardio-save` opened
  `cardio-logged` with derived stats (Pace 4:25 /km, Speed 13.6 km/h, Split 2:12 /500 m,
  Net burn 296 kcal). `cardio-fav` appended a second entry to `lk_cardioFavorites`
  carrying the whole answered form in `defaults.v`.
- **F-CARDIO-025 custom activities.** `new-cardio` → name "Jump rope", 12 min, MET 9 →
  `lk_cardioCustom` holds `{id:"own_…", g:"yours", met:9, min:12, custom:true}`, and
  after a reload the catalogue has a "Yours" group containing it.
- **Persistence — cardio sessions are no longer in-memory minutes.** The logged session
  was written through `LKStore` to `lk_history` as a full record: `kind`, `act`,
  `modality`, `min`, `durationSec`, `km`, `distanceM`, `cal`, `calDetail`
  (net/gross/range/method/tier/confidence), `intensity.estMET`, `watts`,
  `heartRate.avg`, `effort`, `machine`, `note`. It survived `reload()` and moved the
  week stats and the "Most power 205 W" best.

## Still open

- **F-GAME-001, the Home half — the streak pill can never appear.** home.html:266 reads
  `bool('lk_gamingLayer')`; nothing in the build writes that key (`grep lk_gamingLayer
  *.html *.js` matches only that one line). Settings' "Streaks and badges" switch writes
  `lk_badges` (settings.html:319, 984-986), which Profile reads and Home does not.
  Confirmed: pressed `switch-badges` (aria-checked went to true, `lk_badges="true"`,
  `lk_gamingLayer` still `null`), seeded a Sep 7/8/9 history, loaded Home —
  `streak-pill` (home.html:397) **absent**; Profile on the same data showed "3 days in a
  row · best 3". Only a hand-written `lk_gamingLayer` makes Home's pill render.
- **F-CYCLE-210, the compounds card has no data path.** home.html:803-816 reads
  `lk_cycles`, which has no seed in store.js's `seedFor()` (lines 78-105) and no writer:
  stack.html:201 still holds its cycles in a `var CYCLES = [...]` literal. Confirmed: with
  `lk_perfTracking = true` the cards on Home were `[card-insight, card-restock]` only;
  after injecting an active cycle into `lk_cycles` by hand the card appeared
  ("COMPOUNDS DUE / BPC-157 250 mcg · Subcutaneous · Autumn block / Taken"). The card is
  built correctly and is unreachable by anything a reader can do.
- **train.html:1572, 1574, 1578, 1581, 1585 — the favourites sheet renders the literal
  string "undefined".** `favSheet()` reads `f.name`, `f.min` and `f.last`, but the stored
  shape (and the shape `saveFavourite()` writes, train.html:982-996) is `{label,
  defaults.durationSec, lastUsedAt}`; the helpers `favName(f)`/`favMin(f)`
  (train.html:751-755) that exist for exactly this are not used here. Confirmed on the
  seeded favourite: `fav-name-fav_1787122800000`.inputValue() === `"undefined"`, the
  row sub reads `"undefined min"`, and the buttons are labelled `"Move undefined up"`
  and `"Remove undefined"`. Every favourite is nameless in the sheet that exists to name
  them, and the screen-reader labels are worse than useless.
- **train.html:1107 and 1109 — the "Logged" summary silently drops the heart rate and the
  surface the reader just typed.** `loggedSheet()` reads `w.hr` and `w.surface` off the
  record it was handed, but the record `saveCardio()` writes stores `heartRate:{avg:…}`
  and `machine:{category:…}` (verified in the written `lk_history` entry). Confirmed: I
  logged a rowing session with `cf-hr` = 151 and surface "Machine"; the `cardio-logged`
  sheet listed Duration/Distance/Pace/Speed/Split/Average power/Effort/Gross burn/Net
  burn and **no Heart rate and no Surface**. The same two lines read correctly in
  `cardioDetail()` (train.html:652) because that one is fed the normalised row from
  `loadHistory()` (train.html:301-308).
- **train.html:1500-1513 — no ★ on the catalogue activity tiles (F-CARDIO-005, half).**
  `activityRow()` always emits `ICO.cardio`. Confirmed: with the seeded Treadmill-run
  favourite in place, zero `#overlay [data-testid^="pick-"]` tiles contain the star path,
  while the quick row `log-fav-fav_1787122800000` does. Nothing in "Log something else"
  tells you which activities you have already saved.
- **train.html:811-838 — no 500 m split in the personal-bests strip (F-CARDIO-010,
  partial).** `cardioBests()` keeps far/long/burn/watts/pace/speed and never computes a
  split, so the strip cannot show one even for the rowing sessions whose detail rows do
  (train.html:649). Confirmed: the rendered strip is Furthest / Best pace / Fastest /
  Longest / Biggest burn, and Most power once a session carries watts — never Split.
- **F-CARDIO-018, the count-up on the live calorie estimate, was not built.**
  train.html:1024-1027 declines it in a source comment ("A count-up would be motion for
  its own sake on a figure that changes as you type"). Confirmed behaviourally: pressing
  `cf-min-30` moved `cardio-kcal` from 191 to 286 in one step, with no intermediate
  value at 100 ms or 600 ms. Noted as a deliberate deviation rather than an oversight,
  but it is still a named requirement that is not in the build.
