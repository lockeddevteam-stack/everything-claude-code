# Function audit — Cardio (`cardio`)

## 1. Purpose

Log a non-lifting session in two taps and see what recent aerobic work adds up to.

## 2. Feature inventory

Captures: `cardio-populated.png` (P), `-log.png` (L), `-log-step2.png` (S), `-history-full.png` (H), `-empty-favorites.png` (EF), `-empty-history.png` (EH), `-empty.png` (E).

| Feature | Line | Status | Evidence |
|---|---|---|---|
| Back to Train; Favorites/Log/History tabs | L56244, L56229 | working | P, L, H |
| Initial tab: favorites else log | L56217 | working | P vs E |
| Favourite chip + row, one-tap log | L55636/55668 | working | P; 2 measured taps |
| Edit mode: reorder, rename, delete | L55682-55764 | hidden | P shows only "Edit"; four controls behind it |
| 41-tile catalogue, groups, search, star | L56499-56590 | working | L ("41 activities") |
| "Yours" custom group | L56500 | **dead** | `onCustomCardio` passed L57638, zero consumers; no create control |
| Machine/brand step, model sub-step | L56610/56633 | redundant | S subtitle: "it never changes the estimate" |
| Duration presets, engine fields, surface, RPE, notes | L56330-56959 | working | measured form dump; 14 surfaces for an indoor treadmill |
| Console-fields block | L56936 | hidden | collapsed by default |
| Save + summary, calorie range/basis | L56425 | working | measured: "Logged · 30 min · 170 cal · Likely 105–240" |
| Empty-duration validation | L56427 | working | measured: Save not disabled; toast fires |
| History chips, chart, PBs, zones, row detail | L55924-56215 | working | H |
| History list | L55924 (`type==="cardio"`) | **redundant** | Train Hub History renders the same `lk_history` rows, same meta line (L6927); its crawl clicked "Treadmill run Sep 6" and "Rowing erg Aug 30" |
| `lk_cardioPrefs` (distUnit, weekly target, zones) | L5645-5656 | **dead** | `saveCardioPrefs` has zero callers; unit comes from `useKg` (L55928); the 150-min target is nowhere in H |

## 3. Task walkthrough

No flow in `user-flows.md` touches Cardio: no `flow-metrics.jsonl` row, no video. Measured with a throwaway Playwright spec on the baseline harness (populated seed, iPhone 15 Pro, counting `tap()`), since deleted.

| Task | Steps | Taps | ms |
|---|---|---|---|
| Repeat a favourite | Train → Cardio → row → Save → Done | 2 to save, 4 with entry | 2167 incl. boot |
| Log a new activity | + Log → tile → Skip brand → duration → Save → Done | 5 to save, 6 with Done | — |

Hesitation: the brand screen (S) demands a choice it calls cosmetic, "Skip" sits below 12 brands, and "Done" lands on History.

## 4. State coverage

A = 2. Loading and error N/A: no network (page-map 2.12 "L/X n/a"; index.md L445).

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty (history) | EH | yes — "No cardio yet", absent from populated (2b) | generic: correct, no action control |
| Empty (favorites) | EF | yes — star badge + "Browse activities" | correct |
| Populated | P, L, H | yes | correct (§6) |

M=0, W=0, G=1 → band 4.

## 5. Baseline failures

**D8, history back FAIL.** `onCardio` uses `setScreen("cardio")` L57628, not `go()` L57534-53, so nothing is pushed; only in-app back (L56244) works.

**8 / 87 crawl.** Not 79 non-responders: `page-metrics.jsonl` records `nonResponders: []`, `blocked: []`, `truncated: false`, 8 clicks in 4438 ms — inside the 42 s budget and the 60 cap. It stopped because `els.find(e => !visited.has(e.sig))` returned nothing (helpers.ts L661-663). The 87 is the Log tab's catalogue — I enumerated 93 visible interactive nodes there: 41 tiles, 41 stars, chrome. The first click, "Back to Train", forced a reseed onto **Favorites**; the crawl walked Favorites → Log → History, and under History's "Outdoor" filter one row remained. It never returned to Log, so 79 tiles were never re-enumerated. **Every element clicked responded.** A denominator artefact over a real fact: a 41-tile wall is screen two of the primary task.

Also: 8/15 targets under 44px (`targets.json`); axe 1 node, global `meta-viewport` (D9); no console errors.

## 6. Data correctness

Against `seed-data.json` → `lk_history` (4 cardio records), read off H: Furthest 9 km = `distanceM 9000` ✓; pace 5:46/km = 1800 s ÷ 5.2 ✓; split 2:10 = 1200 ÷ 9.2 ✓; zones 45+25+50 = 120 min = 30+20+45+25 ✓; all four rows match name/date/minutes/distance/calories ✓. Shortfall: distance unit derives from the **mass** unit (`p.useKg` L55928) while `lk_cardioPrefs.distUnit` is unwritable.

## 7. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 4 | P: "CARDIO" + 3 tabs, one job; shortfall — landing tab flips (L56217) and P shows three equal candidates (chip, row, "Log something else") |
| Feature completeness | 3 | Core works; "Yours" dead (L56500), `saveCardioPrefs` uncalled (L5656), brand step redundant (S), History duplicated |
| Task success | 3 | Primary log passes first attempt (2 taps); D8 back fails (`global.spec.ts` "reach cardio"); a cardio row opened from Train Hub History renders header + Delete only |
| Speed | 4 | From the Cardio screen: 2 taps to save a favourite, 3 with the mandatory "Done" = best-known +1; browse path 5, one spent on S |
| State handling | 4 | Band table, A=2, M=0 W=0 G=1: EH actionless; EF and P correct |
| Data correctness | 4 | 5 seed checks against H; shortfall — distance unit bound to `useKg` |
| Error recovery | N/A | No network branch (page-map 2.12); the only failure path is a validation toast, uncaptured |

**Function mean 3.7** (6 scored).

## 8. Merge test

The premise holds: one key, `lk_history`, interleaved (18 lifting + 4 cardio, `gen-seed.mjs` L136), and Train Hub's History tab already renders cardio rows with a correct meta line (L6927). **Moves:** favourites become a strip above Quick Start; the "Cardio" button opens the log flow. **Deletes:** the duplicate list and filter chips (L55924-56000), the second header and back (L56236-56255), the `screen==="cardio"` route (L57631), and with it D8. **Lost unless rebuilt:** week chart, personal bests, time-in-zone (L56031-56215) have no home in Train Hub; and `WorkoutDetail` has no cardio branch — a cardio row opened there gives a title, a duplicated duration and Delete, no pace, HR, RPE, surface or notes. Merging without that branch trades a working detail view for a broken one.

## 9. Keep, fix, cut

**Keep** — one-tap favourite → save (2 measured taps, the app's fastest logging path); the summary's calorie range and basis, the only place LOCKED admits an estimate is one; the expandable history row detail, which nothing else renders.

**Fix** — route through `go()` L57534 so back works (D8); fold the brand step into the form as an optional row (S says it changes nothing); give EH the action control EF has; add a cardio branch to `WorkoutDetail` before any merge; disable Save until a duration exists, as the favourite path pre-fills it; 8/15 targets under 44px; "Saved to favourites" vs the "FAVORITES" tab.

**Cut** — the separate History tab: it filters the key Train Hub already renders, and the north star is one place to see what you did, not two answers to one question. `lk_cardioPrefs`/`saveCardioPrefs` (L5645-5656): unwritable, its unit overridden by `useKg`; no job. The "Yours" group (L56500): `onCustomCardio` has no consumer, so it can never be non-empty.
