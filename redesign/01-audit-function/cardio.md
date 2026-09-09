# Function audit — Cardio (`cardio`)

## 1. Purpose

Log a non-lifting session in two taps and see what recent aerobic work adds up to.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Back to Train | CardioSection L56244 | working | `cardio-populated.png`; crawl "Back to Train" responded |
| Favorites / Log / History tabs | L56229, L56255 | working | `cardio-populated.png`, `-log.png`, `-history-full.png` |
| Initial tab = favorites if any, else log | L56217 | working | `cardio-populated.png` (Favorites) vs `cardio-empty.png` (Log) |
| Favorite chip + row, one-tap log | L55636/L55668 | working | `cardio-populated.png`; measured 2 taps to save |
| Favorites Edit: reorder ▲▼, rename, delete-confirm | L55682-L55764 | hidden | `cardio-populated.png` shows only "Edit"; all four controls live behind it, none reachable in the crawl |
| Favorites empty + "Browse activities" | L55601 | working | `cardio-empty-favorites.png` |
| Activity catalogue, 41 tiles, 4 groups | L56499-L56560 | working | `cardio-populated-log.png` ("41 activities") |
| Search activities | L56517 | working | `cardio-populated-log.png` |
| Star-from-catalogue | L56590 | working | `cardio-populated-log.png` (☆ per tile) |
| "Yours" custom-activity group | L56500 | **dead** | `onCustomCardio` is passed at L57638 and never read by any cardio component (grep: zero consumers); no create control in `cardio-populated-log.png` |
| Machine/brand step | L56610-L56640 | redundant | `cardio-populated-log-step2.png` — its own subtitle says "it never changes the estimate"; a whole screen for a label |
| Model sub-step | L56633 | hidden | reached only by picking a brand; no capture in the 19-shot set |
| Duration presets + typed minutes | L56833-L56860 | working | measured; form text "HOW LONG 10 15 20 30 45 60" |
| Engine fields (distance, incline, watts, split…) | CE_FIELDS L56330-L56382 | working | measured form dump |
| Surface picker | L56906 | working | 14 options render for an indoor treadmill run (measured form dump) |
| "From the console" disclosure | L56936 | hidden | collapsed by default; no capture |
| RPE 1-10, notes | L56765, L56959 | working | measured form dump |
| Save + summary with calorie range/basis | L56425-L56470 | working | measured: "Logged · Treadmill run · 30 min · 170 cal · Likely 105–240" |
| Validation on empty duration | L56427 | working | measured: Save is **not** disabled (`isDisabled:false`, opacity 1); tapping fires a toast |
| History: filter chips, week chart, PBs, zones, expandable rows | CardioHistory L55924-L56215 | working | `cardio-populated-history-full.png` |
| History list itself | L55924 filter on `w.type==="cardio"` | **redundant** | Train Hub History renders the same `lk_history` rows with the same meta line (`sessionMetaLine` L6927): crawl clicked "Treadmill run Sep 6", "Rowing erg Aug 30" there |
| `lk_cardioPrefs` (distUnit, weeklyTargetMin, zoneModel, restingHr) | L5645-L5656 | **dead** | `saveCardioPrefs` L5656 has zero callers; distance unit is taken from `useKg` instead (L55928, L56378), and the 150-min target appears nowhere in `cardio-populated-history-full.png` |

## 3. Task walkthrough

No flow in `user-flows.md` touches Cardio; there is no row in `flow-metrics.jsonl`, so no video timestamp exists. Measured myself with a throwaway Playwright spec on the baseline harness (seed `states.populated()`, iPhone 15 Pro, counting `tap()` calls), spec deleted after the run.

| Task | Steps | Taps | ms |
|---|---|---|---|
| Repeat a favourite | Train → Cardio → tap "Treadmill run" row → Save session → Done | 2 to save (4 incl. entry) | 2167 (incl. boot) |
| Log a new activity | + Log tab → tile → **Skip** brand → duration → Save → Done | 5 to save, 6 with Done | — |

Hesitation points: the brand screen (`cardio-populated-log-step2.png`) demands a choice it then says is cosmetic, and "Skip" is at the bottom of a 12-brand list; the summary ends on "Done", which lands on History rather than back where you started.

## 4. State coverage

Applicable A = 2. Loading and error are N/A: no network on this page (page-map 2.12 "L/X n/a"; `screenshots/index.md` L445-446).

| State | Capture | Present? | Quality |
|---|---|---|---|
| Empty (history) | `cardio-empty-history.png` | present — "No cardio yet" not in any populated shot (test 2b) | generic: correct, but zero action controls |
| Empty (favorites) | `cardio-empty-favorites.png` | present — star badge + "Browse activities" | correct |
| Populated | `cardio-populated.png`, `-log.png`, `-history-full.png` | present | correct; values verified in §6 |
| Loading | — | N/A | — |
| Error | — | N/A | form-validation toast (L56427) exists but is uncaptured |

M=0, W=0, G=1 → band 4.

## 5. Baseline failures

- **D8 (history back FAIL).** `onCardio` calls `setScreen("cardio")` L57628 instead of `go()` L57534-L57553, so nothing is pushed; browser back leaves Cardio for whatever preceded Train. Only in-app "Back to Train" (L56244) works.
- **8 / 87 crawl.** Not 79 non-responders: `page-metrics.jsonl` records `nonResponders: []`, `blocked: []`, `truncated: false`, 8 clicks in 4438 ms — well inside the 42 s budget and the cap of 60. The crawl stopped because `els.find(e => !visited.has(e.sig))` returned nothing (helpers.ts L661-663). The 87 is the Log tab's catalogue (I enumerated 93 visible interactive nodes there: 41 tiles + 41 stars + tabs, back, search). The crawl's first click ("Back to Train") forced a reseed/re-enter onto **Favorites**; it then walked Favorites → Log → History and, once on History with the "Outdoor" filter applied, only one row remained unvisited. It never returned to Log, so 79 catalogue tiles were never enumerated again. **Every element it did click responded.** The finding is a denominator artifact plus a real design fact: a 41-tile wall is the second screen of the primary task.
- **Targets:** 8 / 15 under 44px, incl. "History" 118x42 shared with Train Hub (`targets.json`).
- axe: 1 node, the global `meta-viewport` (D9). Console/page errors 0.

## 6. Data correctness

Checked against `tests/fixtures/seed-data.json` → `lk_history` (4 cardio records) in `cardio-populated-history-full.png`: Furthest 9 km = `distanceM 9000` ✓; Best pace 5:46/km = 1800 s / 5.2 km ✓; Best 500m split 2:10 = 1200 s / 9.2 ✓; zone total 45+25+50 = 120 min = 30+20+45+25 ✓; four rows match name/date/minutes/distance/calories ✓. Shortfall: distance unit is derived from the **mass** unit (`p.useKg` L55928) while `lk_cardioPrefs.distUnit` exists and is unwritable, so a kg user cannot get miles.

## 7. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 4 | `cardio-populated.png`: "CARDIO" + 3 tabs, one job; shortfall — the landing tab flips between Favorites and Log (L56217), and the favourites view shows three equally-styled candidates (chip, row, "Log something else") |
| Feature completeness | 3 | Feature table: core log/history/favorites work; "Yours" group dead (L56500), `saveCardioPrefs` uncalled (L5656), machine step redundant (`cardio-populated-log-step2.png`), History duplicates Train Hub |
| Task success | 3 | Primary log passes first attempt (measured, 2 taps); D8 browser back fails (`global.spec.ts` "reach cardio", `historyBack:false`); a cardio row opened from Train Hub History renders header + Delete only (measured: "Treadmill run / 30 min · 5.2 km · 340 cal / Delete") |
| Speed | 4 | Measured from the Cardio screen: 2 taps to save a favourite, 3 with Done — best-known + 1 for the mandatory "Done"; browse path is 5 (`cardio-populated-log-step2.png` costs one of them for a label) |
| State handling | 4 | Band table, A=2, M=0 W=0 G=1: `cardio-empty-history.png` is correct but offers no action; `cardio-empty-favorites.png` and `cardio-populated.png` correct |
| Data correctness | 4 | 5 seed checks above against `cardio-populated-history-full.png`; shortfall — distance unit bound to `useKg`, `lk_cardioPrefs.distUnit` unreachable |
| Error recovery | N/A | No network branch (page-map 2.12); the only failure path is a form-validation toast, absent from the 19-capture set |

**Function mean 3.7** (6 scored).

## 8. Merge test (Train Hub hypothesis)

The Train Hub auditor's premise holds: one key, `lk_history`, interleaved (seed: 18 lifting + 4 cardio, `gen-seed.mjs` L136), and Train Hub's History tab already renders cardio rows with a correct cardio meta line (`sessionMetaLine` L6927). What would actually move: `CardioSection`'s three tabs collapse into Train Hub — Favorites becomes a strip above Quick Start, Log becomes the existing "Cardio" button's destination, History merges into the tab that already exists. What gets deleted: the duplicate list and its filter chips (L55924-L56000), the second header/back (L56236-L56255), the `screen==="cardio"` route (L57631) and with it D8. What would be lost, and must be rebuilt, not merged: the week chart, personal bests and time-in-zone (L56031-L56215) have no home in Train Hub; and `WorkoutDetail` has **no cardio branch** — opening a cardio row from Train Hub History today shows a title, a duplicated duration and a Delete button, no pace, HR, RPE, surface or notes. Merging without fixing `WorkoutDetail` trades a working detail view for a broken one.

## 9. Keep, fix, cut

**Keep**
- One-tap favourite → save: 2 measured taps, the fastest logging path in the app.
- The summary's calorie range and basis ("Likely 105–240 cal … Net"): the only place LOCKED admits an estimate is an estimate.
- Expandable history row detail (pace, split, power, HR, effort, surface, notes) — nothing else in the app renders these.

**Fix**
- D8: route through `go()` L57534 so back works (`historyBack: false`).
- Fold the brand step into the form as an optional row; its own copy says it changes nothing (`cardio-populated-log-step2.png`).
- Give `cardio-empty-history.png` the action control its favourites twin has.
- Add a cardio branch to `WorkoutDetail` before any merge (measured: header + Delete only).
- Disable Save until a duration exists (measured `isDisabled:false`), or pre-fill it as the favourite path already does.
- 8/15 targets under 44px; "Saved to favourites" vs the "FAVORITES" tab — pick one spelling.

**Cut**
- The separate Cardio History tab. It filters the same key Train Hub already renders; the north star is one place to see what you did, and two histories of one list is two answers to one question.
- `lk_cardioPrefs` and `saveCardioPrefs` (L5645-L5656): unwritable, and the unit it stores is overridden by `useKg`. It does no job.
- The "Yours" custom-activity group (L56500): `onCustomCardio` has no consumer, so the group can never be non-empty — it fails the only job it has.
