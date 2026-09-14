# Home, Recap, Cardio — findings

## Class 1 — untrue / unreproducible

- **Home's cycle row is a hardcoded string** (home.html:297-298): "Day 16 /
  Luteal, estimated · next period in 12 days". From `lk_mcProfile`
  (lastStart 2026-08-29, cycleLen 28) on TODAY 2026-09-09 the answer is
  **Day 12, Follicular, next period 2026-09-26, 17 days**. Read it.
- **The empty state is gated on a dev state, not on the data.** `render(...)
  get('state') || 'training'` (home.html:440), so a reader with no splits
  still sees the training-day view.

## Missing — build

| ID | What |
|---|---|
| F-HOME-005 | Distinct training days this week (`uDays`) and the consistency label |
| F-HOME-006 | The proactive insight card — cached per day, dismissible, derived from the history. Not in Home's cut list, so it was dropped without a decision. |
| F-HOME-009 | The dynamic feed, the supplement reminder, the running-low card and the cycle reminder |
| F-HOME-013 | Five recent workouts, each tappable, and a "See all" |
| F-HOME-014 | A recent row opens workout-detail, not Train |
| F-HOME-015 | Auto-add due staples on mount |
| F-HOME-016 | Gate the empty card on `splits.length` |
| F-SHOP-031 | A "running low" card |
| F-SUPP-010 | A "supplements due" card, with the time-of-day windows (Morning 05-12 etc.) |
| F-CYCLE-210 | A "compounds due" card when performance tracking is on |
| F-GAME-001 | The streak: consecutive training days counted back from today, on Home and on the Profile header, shown when the gaming layer is on |
| F-CARDIO-002..005 | A favourites surface read from `lk_cardioFavorites`: an empty state, the list, reorder, rename, two-tap delete, and a ★ on activity tiles |
| F-CARDIO-008 | A this-week stat row: sessions, minutes, calories |
| F-CARDIO-010/011 | A personal-bests strip (furthest, pace, split, speed, watts, longest, burn) and a time-in-zone card. The generated fixture drops `heartRate`, `metrics`, `intensity` and `machine` — ask for them in your report; do not edit fixtures.js. |
| F-CARDIO-012 | Expandable session detail: pace, speed, split, power, heart rate, effort, surface, gross burn, notes |
| F-CARDIO-015..022 | The cardio log form: duration chips, distance with a unit, surface, ride position, a console block, notes; a live calorie estimate with a count-up, a 5-bar quality meter and a confidence pill; then a "Logged" summary with derived stats and a "Save this setup" favourite |
| F-CARDIO-025 | Custom cardio activities ("Yours") |

## Persistence

Cardio sessions logged in the build are in-memory and carry only minutes.
Write a full record to `lk_history` through `LKStore`.
