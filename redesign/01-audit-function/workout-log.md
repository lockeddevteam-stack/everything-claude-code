# Function audit — workout-log

## 1. Purpose
Record the set just finished — weight, reps, RIR, done — and time the rest, without leaving the screen.

## 2. Feature inventory

| Feature | Line | Status | Evidence |
|---|---|---|---|
| Header timer / set count / volume | L10693 | **broken** — `totalSets` filters `setType!=="warmup"`; a done warm-up reads "0 sets" | flow 2 `headerSets:"0 sets"` |
| Set rows; unit header | L12890 | **broken** — `row.kg===null?…:row.kg?…` sends `undefined` to "lb"; reads **LB** under a kg profile | `workout-log-populated.png`, `-tools.png` |
| NumPad weight / reps | L9847 | **broken (cost)** — `useState(p.value)` pre-fills, `tap()` appends, only key is `del` | `-numpad.png` |
| RIR select; mark / undo done | L13390, L13460 | working | crawl responded |
| Partials + | L13470 | hidden — gated by `hidePartials`, set only in Settings L32996 | `-populated.png` |
| Add Set; AI Rec | L12100, L13586 | working | `-add-set.png`, `-loading.png` |
| Add Exercise; Block; rest settings | L11388, L10445, L11515 | working | `-add-exercise.png`, `-block-modal.png` |
| Plate Calc | L54925 | working; **redundant** KG/LB pair | `-platecalc.png` |
| Tools "Switch to LBS" | L12055 | working; **redundant** (2nd toggle) | `-tools.png` |
| Long-press action sheet, 7 actions | L7496 / L10319 | hidden — gesture only, one-time tip L10323 | `-action-sheet.png` |
| Sheet "Switch to kg" | L7496 | **redundant, contradicts** tools and the LB header | `-action-sheet.png` |
| Exercise detail; swap | L7202, L8625 | working; detail fires 2 unrouted guest calls (D13) | `-exercise-detail.png` |
| Reorder (wiggle) | L10936 / L10961 | hidden — 350 ms hold on a 20×12 handle | `-populated.png` |
| Idle "still training?" | L10483 | dead — 30 min timer, no capture reaches it | none |
| Discard (two-tap arm); Finish → Review | L12091, L11636 | working, but the save throws (§5) | `-discard-confirm.png`, flow 3 |
| Voice FAB | L53718 | shell control over page content | `-populated.png` |

## 3. Task walkthrough

**Flow 2, log one set: 15 taps, 2475 ms** (`flow-metrics.jsonl`, `log-set`). Resume 1 → weight cell 1 → **del ×4** clearing the pre-filled 37.5 → 1, 0, 0 (3) → DONE 1 → reps cell 1 → **del ×1** clearing the pre-filled 8 → 8 (1) → DONE 1 → Mark set 1 done 1. Five taps are deletions (`clearTaps:5`), two are sheet dismissals, one is Resume; only four carry the value. Best known 3. Hesitation is at pad open: last session's number sits there, so the lifter must judge whether it is a suggestion or their entry, then find DEL is the only exit. The crawl logged the failure as data — "Set 3 weight | **6072.5**", a 60 typed onto an uncleared 72.5.

**Flow 1B, guest to first set: 14 taps, 3090 ms.** Six are the pad; the deletion cost is absent only because a new cell starts empty.

**Flow 3, finish/review/save: 3 taps, 1076 ms.** Reaches Saved; throws (§5).

## 4. State coverage

| State | Capture | Present (test 2b) | Quality |
|---|---|---|---|
| Empty | `-empty.png` | yes — "No exercises yet / Tap Add Exercise below" | correct; one instruction, one action |
| Loading | `-loading.png` | yes — "AI Rec" swapped to "Thinking…", disabled | correct |
| Error | `-error.png` | yes — red toast absent from populated | correct: cause and next step |
| Populated | `-populated.png` | yes | correct except the unit header |

A=4, M=0, W=0, G=0.

## 5. Baseline failures

- **Flow 3 page error, `ReferenceError: syncBidirectional is not defined`** (D1): called bare at **L57460**, defined inside the pre-React IIFE at L465, never exported. State writes at L57456-L57458 precede it, so the save lands and routes home; the handler then dies. Every save throws.
- **Flow 2, 15 taps vs 10 expected** (D3): `NumPad` L9848 pre-fills, `tap()` L9851 appends, key array L9873 has no clear.
- **`headerSets:"0 sets"` after a done warm-up** (D4): L10693.
- **Seeded rows render "LB" under a kg profile** (D5): L12890.
- **22 of 31 targets under 44 px** (`targets.json`): weight and reps cells **109×33** ×6 (most-tapped), done/undo 32×30 ×3, set number 20×12 ×3, RIR 42×44 ×3, partial + 26×44 ×3, Discard 75×32, Finish 79×34, Add Set 252×32, AI Rec 71×32.
- No non-responders (49 clicks, 1 recovery). axe: 1, the global `meta-viewport` (D9). Contrast 0/32 fail.

## 6. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 3 | `-populated.png`: job readable on a scan, but four accent controls compete (Finish, Add Exercise, AI Rec, voice FAB), the loudest ends the workout, and the primary act — the done check — is a 32×30 grey square |
| Feature completeness | 3 | Feature table: core logging works, 0 non-responders in 49 crawl clicks; 3 broken (header count, unit header, save), 2 redundant unit toggles, 2 hidden (reorder, partials); `-tools.png`, `-action-sheet.png` |
| Task success | 3 | Flows 1B, 2, 3 all `pass:true` in `flow-metrics.jsonl`, but entering a weight needs the DEL workaround (`clearTaps:5`) and flow 3 ends in a page error; shortfall: no flow needed a retry |
| Speed | 1 | 15 taps vs best-known 3 = 5x (flow 2 tapLog); 2 sheet open/close screen changes; 2475 ms |
| State handling | 5 | A=4, M=0, W=0, G=0 by test 2b: `-empty.png`, `-loading.png` ("Thinking…"), `-error.png` ("Could not get a recommendation. Check your connection and retry."), `-populated.png` |
| Data correctness | 1 | Unit-label bug, anchor 1: `-populated.png` header reads **LB** and `-numpad.png` "72.5 **lb**" while the same frames total "1088 **kg**" and `-tools.png` reads "KG · Switch to LBS" — three controls, two implied units. "2 sets" also excludes done warm-ups (flow 2: "0 sets") |
| Error recovery | 4 | `-error.png` names cause and fix, set values survive; shortfall: the save-path `ReferenceError` is invisible, so a real failure would look identical to success |

**Function mean 2.9.**

## 7. Keep, fix, cut

**Keep**
- Set row as the unit of interaction: weight, reps, RIR, done on one line (`-populated.png`).
- Empty and error copy; both name the next action (`-empty.png`, `-error.png`).
- Plate Calc "Apply to next set", which writes back rather than forcing a re-key (`-platecalc.png`).
- Rest presets 1m/1m30/2m/3m/Custom, all responsive in the crawl.

**Fix**
- NumPad: open empty or replace on first digit; add a clear key. 5 of 15 taps are deletions.
- `totalSets` L10693: count warm-ups or relabel "working sets".
- `rowUnit` L12890: treat `undefined` as the profile unit.
- Export `syncBidirectional`, or call it inside the IIFE (L57460).
- Weight and reps cells to 44 px: at 109×33 they are the most-tapped targets (`targets.json`).
- Give the action sheet a visible affordance: a 350 ms hold on a 20×12 handle hides seven actions.

**Cut**
- Two of the three unit toggles (L12055, L7496). Between sets a lifter needs the number, not a unit switch; three toggles disagreeing with the LB header mislead them about what they logged.
- Idle prompt L10483: a 30-minute timer no capture reaches; useless between sets.
- AI Rec in the row footer: a round-trip and a "Thinking…" wait mid-set, whose output is the pre-fill the NumPad then makes expensive to override.
