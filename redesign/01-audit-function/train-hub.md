# Function Audit: Train Hub (`train-hub`, TrainHub L15013-L15964)

## 1. Purpose

Train Hub is where a lifter picks today's session and starts it, with past sessions and the exercise library parked one tab away.

## 2. Feature inventory

| Feature | Line | Status |
|---|---|---|
| Header "Cardio" → separate screen | L15330-L15352 | working, redundant (leaves the hub; `cardio` renders under nav active=Train L57958) |
| Header "Quick Start" (empty workout) | L15353-L15369 | working; the only accent-filled control, but starts a blank session |
| Tab bar My Splits / History / Library | L15374-L15395 | broken as a set: "Library" calls `setView("library")` L15378 and replaces the whole hub (`exercise-library-populated.png`: no tabs, Back arrow), while the other two swap content |
| Inline library branch `tab==="library"` | L15958 | dead — unreachable, the tab button sets `view` first |
| RECENT repeat strip (5, horizontal) | L15396-L15467 | working, hidden past the 3rd chip (`train-hub-populated.png` clips card 4) |
| AI Builder / New | L15514-L15600 | working |
| Split card, expand chevron | L15640-L15705 | working |
| Per-day "Start day" button | L15739-L15760 | working; blocked in crawl, see §5 |
| Footer Start → day sheet | L15801-L15823 | working, redundant with per-day Start |
| Footer Edit → SplitBuilder | L15824-L15846 | working (flow 6) |
| Footer Delete | L15847-L15870 | working, no confirm, no undo, no toast |
| Day sheet "Empty workout" row | L15273-L15309 | redundant with Quick Start (same `onStart({exIds:[]})`) |
| History list (lifting + cardio rows) | L15896-L15956 | working; cardio rows render a blank volume line (`w.vol` undefined L15950) — see `train-hub-populated-history.png` |
| History row → WorkoutDetail | L15074, L15902 | working, cardio-aware (L17782) |
| AdaptiveTrainingCard | L15961 (body L14930-L15010) | hidden — below 3 split cards, ~1,500px down (`train-hub-populated-full.png`, 393x1804) |
| Empty splits / empty history states | L15468-L15496, L15872-L15895 | working |

## 3. Task walkthrough

**Flow 1 (guest → first set), 1B seeded**: 14 taps, 3,090 ms, pass (`flow-metrics.jsonl` flow 1). Hub owns taps 1-2: `START WORKOUT` → hub, `Quick Start` → WorkoutLog. Video `artifacts/flows-01-guest-first-set-f-c4621…/video.webm`; no per-step log was emitted, so order comes from tapLog over 3,090 ms. Hesitation: the accent button starts an *empty* workout while the user's PPL split sits below the fold; nothing on the header says which one produces today's session.

**Flow 6 (edit a split, start it)**: 5 taps, 2,300 ms, pass (`flow-metrics.jsonl` flow 6, tapLog `Train → Edit → SAVE SPLIT → Start → Push`). Video `artifacts/flows-06-edit-split-start--d2ee6…/video.webm`. Hesitation at tap 4: three footer buttons (Start 164x39, Edit 94x39, Delete 93x39) share one row, weight and size, with the destructive one a thumb-width from Start (`train-hub-populated-full.png`). Second hesitation at tap 5: the sheet re-lists days already visible on the expanded card (`train-hub-populated-day-modal.png`).

**Core action, cold app open**: Home → Train tab → footer Start → day row = 3 taps to a running programmed workout (2 if the split was left expanded; `splitsOpen` defaults to `{}` L15014-L15016, so cold state is collapsed). Best known in class is 2 (tab, then Start Routine).

## 4. State coverage

Applicable A = 2. Loading and error are N/A: the hub reads `lk_splits`/`lk_history` synchronously and issues no request (page-map 2.6, "L/X n/a in hub itself"); baseline lists error as N/A for this page.

| State | Capture | Test | Result |
|---|---|---|---|
| Empty (splits) | `train-hub-empty.png` | 2b — "No splits yet" + instruction + Build Manually | present, correct |
| Empty (history) | `train-hub-empty-history.png` | 2b — "No workouts logged yet" + Start a workout | present, correct |
| Populated | `train-hub-populated.png`, `-full`, `-history`, `-split-expanded` | — | correct |
| Loading / Error | — | N/A | excluded |

M=0, W=0, G=0 → band 5.

## 5. Baseline failures

- **Blocked click, "Start Day A"** (`page-metrics.jsonl` train-hub interactive; 26/30 clicked). Cause L15697-L15705: the day panel collapses via `max-height .4s` with `visibility 0s linear .4s`, so after the crawler collapsed split 2 the day's Start button stayed in the DOM, un-hittable, for 400 ms — Playwright reported "element is not visible". A user tapping in that window loses the tap.
- **19/33 targets under 44px** (`targets.json`), second worst in the app: Start day 86x24 (x3), Start 164x39 / Edit 94x39 / Delete 93x39 (x3 cards), tabs 118x42 (x3), Cardio 88x34, Quick Start 107x34, AI Builder 99x33, New 70x33.
- 16 crawler recoveries: most hub controls navigate away, forcing 16 re-entries.
- No console errors, no page errors, 1 axe violation (global shell), 0 contrast failures of 97.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 3 | `train-hub-populated.png`: job readable once the tab bar is noticed (rubric's own anchor-3 example); 8 start-capable controls compete above the fold |
| Feature completeness | 3 | Core start path works; dead inline library branch L15958; "Empty workout" duplicates Quick Start; cardio history rows render an empty volume line (`train-hub-populated-history.png`) |
| Task success | 4 | Flows 1 and 6 pass first attempt (`flow-metrics.jsonl`); shortfall: a zero-day split's Start opens a sheet with nothing but "Empty workout" |
| Speed | 4 | 3 taps cold to a programmed workout vs best-known 2 (+1 → 4); flow 6 = 5 taps / 2,300 ms as specified |
| State handling | 5 | A=2, M=W=G=0; `train-hub-empty.png`, `train-hub-empty-history.png` both name the next action |
| Data correctness | 3 | Volumes and split meta match seed (14363 kg, 7158 kg, "3 days - 15 exercises - 7/25/2026"), but one list mixes date formats: cardio "Sep 6" (L56435) with lifting "9/7/2026" (L16056), and cardio rows show a blank volume slot (`train-hub-populated-history.png`) |
| Error recovery | 1 | Delete (L15847-L15853) removes a split with no confirm, undo or toast; in guest mode the split is gone (`train-hub-populated-full.png` shows it as an equal third of the footer) |

**Function mean 3.3.**

## 7. Keep, fix, cut

**Keep**
- Per-day "Start day" on the expanded card — the only 2-tap path to today's session (L15739).
- Both empty states: title, one instruction, one action (`train-hub-empty.png`).
- History that already interleaves cardio and lifting from one `lk_history` (`train-hub-populated-history.png`).

**Fix**
- Make the programmed next session the single accent control; demote Quick Start (`train-hub-populated.png`).
- Every target to 44px; the 19 failures are listed in §5.
- Delete needs confirm + undo (L15847).
- Replace the 400 ms `visibility` delay with a collapse that removes hit-testing immediately (L15697-L15705).
- One date format across the History list (L56435 vs L16056).

**Cut**
- Day sheet (L15139-L15230) and its "Empty workout" row: it repeats days already on screen and duplicates Quick Start — a second screen for a daily action breaks "daily actions take one tap".
- RECENT strip (L15396): horizontally clipped, and every chip is reachable from History or the split card.
- Separate Cardio screen: merge in. `CardioHistory` (L55925) filters the same `lk_history` this tab already renders, so one of the two lists is pure duplication; the hub's Cardio button (L15333) is the screen's only entry and its browser back is broken (SUMMARY: cardio "History back | FAIL"). Cost: `CardioLogFlow`/`CardioFavorites` move in as a second start path; `CardioHistory` and the "Back to Train" screen (L56244) are deleted.
