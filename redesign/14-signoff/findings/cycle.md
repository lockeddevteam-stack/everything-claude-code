# Cycle — sign-off findings (57 features: 10 present, 17 partial, 29 missing)

## Class 1 — untrue

- **The Irregular switch promises what it does not do.** Its sub-line says
  "Estimates are shown as a range rather than a date" (cycle.html:429-436).
  `p.irregular` is read nowhere else — flipping it leaves the today card
  byte-identical. Either widen the estimate into a range and add the
  disclaimer copy, or change the sentence. Widening it is better.
- **Discreet mode does not hide what it says it hides.** Its own note: "the
  phase name and the symptom names go". The phase goes; the symptom names
  survive in "What you have logged" and in the day sheet's chips.

## Class 2 — figures that do not reproduce from the seed

- **Three different answers for today.** `lk_mcProfile` in the seed is
  `lastStart 2026-08-29, cycleLen 28, periodLen 5`; TODAY is 2026-09-09. The
  correct reading is **Day 12, Follicular, next period 2026-09-26, 17 days**.
  Home hardcodes "Day 16 / Luteal / in 12 days" (home.html:297-298 — that is
  Home's to fix, not yours, but note it). `cycle.html:106-109` carries its own
  `seedProfile()` with `lastStart: '2026-08-25'` and renders Day 16 / Sep 22 /
  13 days. `fixtures.js` carries no cycle data at all.
  **Fix: add `mcProfile` and `mcDays` to the generator** (ask for it in your
  report — `fixtures.js` is shared and you may not edit it; until then read
  `lk_mcProfile` / `lk_mcDays` through `LKStore` and keep a seed matching the
  seed file exactly).
- **The day count wraps modulo the cycle length** (`(daysBetween % cycleLen) + 1`,
  :138-141), so a cycle ten days late reads "Day 11" and an overdue state is
  unreachable by construction.
- **A future start date is accepted.** `su-start` has no `max` and save checks
  only non-empty, so 2026-12-01 renders "Day -26" beside a next-period date
  before the start it came from.

## Class 3 — controls that do nothing

- **"Delete everything logged here" wipes on one tap** (:592-597), no confirm,
  no undo. Every other destructive control in this build arms first.
- **Clearing a flow day does not undo the prediction it moved.** Saving flow
  ≥ 2 rewrites `lastStart` (:554-557); clearing that day leaves it moved.

## Persistence

The profile and the day log must go through `LKStore` under `lk_mcProfile` and
`lk_mcDays`. Nothing survives a reload today.

## Missing — build these (all local)

| ID | What |
|---|---|
| F-CYCLE-003/004/007/008 | A real setup flow: privacy intro, goal, start date (clamped, with "I'm not sure"), lengths, irregular, birth control (7 options), progress dots, Skip |
| F-CYCLE-009/010/011 | The cycle ring: a 272px SVG with menstrual/follicular/ovulatory/luteal arcs, an elapsed clip, a today marker, drag-to-preview any day, and four centre states (normal, preview, no-data/stale, recovery) |
| F-CYCLE-012/013/014 | A quick-action grid (Log period / Symptoms / Energy or Pill / More) and inline energy and flow strips on the screen itself |
| F-CYCLE-015 | The phase card's typical-day-range footer |
| F-CYCLE-016 | Prediction cards: next period, fertile window, PMS window, each with a ± confidence band, and an "Any day" overdue variant |
| F-CYCLE-017/018 | The irregular disclaimer, and an overdue explainer once five days past |
| F-CYCLE-019 | The training card: on a rough day (cramps, fatigue, headache or low energy) name the reasons, offer "Take it lighter" / "I feel fine", write the answer onto the day, and offer Open Train |
| F-CYCLE-024/025/026/028/029/030 | Day sheet: 5 flow levels (Spotting back), a pill-taken toggle, 12 symptoms at three severities, energy and sleep rows, sex activity, and an events section (morning-after pill, pregnancy test, abortion, miscarriage, IUD) |
| F-CYCLE-032/033/034 | A calendar view behind a header toggle: a month grid with three cycles projected, predicted PMS, ovulation and fertile days, flow-alpha painting and a legend; a stats strip (cycles, average, variation); a cycle-length history bar chart. This needs a history of starts — keep one. |
| F-CYCLE-035/037/038 | Settings: birth control, export (a real JSON blob download), and a two-tap delete |
| F-CYCLE-039 | Athlete health flags (RED-S, amenorrhoea) from cycle gaps and training spikes, red never dismissible. Note: the screen currently says "This screen does not diagnose anything" — if you build this, it names a pattern and says to see a doctor; it still does not diagnose. Keep that line true. |
| F-CYCLE-040/041 | Pregnancy-end recovery mode and an EC card, both triggered from the events section |
| F-CYCLE-042 | Three derived insights: symptom timing relative to the period, energy by phase, training volume by phase |
| F-CYCLE-043 | The science accordion, including the Colenso-Semple 2023 citation and when to see a doctor |
| F-CYCLE-046 | Header: a calendar/cycle toggle and the privacy sub-line |

## Not yours but report it

F-CYCLE-002 (Home's hardcoded cycle row), F-CYCLE-020 (a Fuel nutrition
bridge), F-CYCLE-022 (a Train banner), F-CYCLE-036 (cloud backup — needs a
server), F-CYCLE-210 (a Home compounds-due card), F-CYCLE-200 (Fuel's Stack
chip is read once at boot and never re-read).
