# Wave 1 Function Audit — Review (`review`, Review L15965)

## 1. Purpose
Review is the post-workout receipt: it restates what was just logged, optionally takes a five-item feel rating and an AI insight, and banks the session to history.

## 2. Feature inventory

| Feature | Line | Status | Note |
|---|---|---|---|
| Header "WORKOUT COMPLETE" + name + date | 16157 | broken in empty | asserts completion at 0 sets (`review-empty.png`) |
| Stat tiles Sets / Volume / Duration | 16177 | working | 2 / 1088 kg / 21 min (`review-populated.png`) |
| Per-exercise volume cards | 16254 | working | counts warm-ups; header does not (15985) |
| Block (note) cards | 16207 | hidden | needs a `type:"block"` row; no capture reaches it |
| Quick note textarea | 16294 | working | crawl `responded:true` (page-metrics L42) |
| "HOW DID IT FEEL?" | 16335 | working | only accent button; not the completing action |
| "Save without reflection" | 16347 | working | flow-3 step 4, t=3327 ms |
| 5 rating rows x 5 chips | 16348 | working | `review-populated-reflect-rated.png` |
| "GET AI COACH INSIGHT" → `aiCall` | 16442/16108 | working | `review-populated-ai-insight.png` |
| Canned fallback on aiCall fail | 16112 | broken | fabricated insight styled as a real one (`review-error.png`) |
| Retry after insight failure | — | dead | no control on the ai step; only Save or Discard |
| ThrowbackCard | 16536 | hidden, redundant | 1-in-5 random (15973), ai step only; Progress renders it too (28645) |
| "SAVE WORKOUT" | 16584 | working | `review-populated-ai-insight.png` |
| Two-step Discard / "Keep it" | 16606/16620 | working | `review-populated-discard-armed.png` |
| Zero-set guard on `save()` | 16012 | missing | saves `sets:0, exercises:[]` (`review-empty.png`) |
| Cloud push after save | 57460 | broken | `syncBidirectional is not defined` (D1) |

## 3. Task walkthrough

**Flow 3 — Finish, Review, save** (the only flow through Review; `user-flows.md` L110).

| Step | Tap | t_ms (`flow-3.json`) | Screen |
|---|---|---|---|
| boot | — | 491 | resume dialog (`flow-3-step0.png`) |
| 1 | Resume | 1472 | Workout Log (`flow-3-log.png`) |
| 2 | Finish | 2403 | Review summary (`flow-3-review.png`) |
| 3 | Save without reflection | 3327 | Home + "Saved" (`flow-3-home-saved.png`) |
| — | assertion ok | 3902 | — |

Taps 3 (2 + Resume), expected 3, 1076 ms (`flow-metrics.jsonl` flow 3). Reflection path 7 taps, insight path 8. Hesitation: the accent button is "HOW DID IT FEEL?" while the exit is the quiet outline below it. Again on the ai step: a failed insight has no retry, so the choices are keep the canned line or Discard.

Entry hazard: stale `lk_activeWorkoutRows` sends `startWorkout` straight to Review instead of the log (57402, `user-flows.md` L13).

## 4. State coverage

A = 4 (loading/error exist only for the insight `aiCall`, `screenshots/index.md` L456).

| State | Capture | Present? | Test used | Quality |
|---|---|---|---|---|
| Empty | `review-empty.png` | yes | diff vs `review-populated.png` (matched frame): 0 Sets, 0 kg, card gone | **wrong** — "WORKOUT COMPLETE" over an unlogged session; no copy, no guard, both buttons live |
| Loading | `review-loading.png` | yes | 2b: three pulsing dots replace the insight text | generic — no copy, no cancel |
| Error | `review-error.png` | yes | diff vs `review-populated-ai-insight.png`: red toast + canned text | **wrong** — toast names the cause, but the card shows "Solid session…" as a real insight; no retry |
| Populated | `review-populated.png` | yes | — | correct |

M=0, W=2, G=1 → band row "M = 0 and W >= 2" → **2**.

## 5. Baseline failures

- **Flow 3 spec `failed`** (`SUMMARY.md`, D1): `saveWorkout` calls `syncBidirectional()` as a free identifier at L57460; it is defined at L465 inside the pre-React IIFE and exported only as `LockedSync.syncToCloud` (L1159). Uncaught `ReferenceError`, hard-fails the page-error check. **User-visible consequence: none in the tested path; no data is lost.** The throw is the last statement, after `setHistory`, the toast, the `lk_activeWorkout*` clears and `setScreen("home")`; React commits the batched updates in its `finally`, so Home renders with "Saved" (`flow-3-home-saved.png`, t=3327 ms) and `lk_history` gains the entry. Lost is the immediate cloud push for signed-in users: the session reaches the server only on the next 2-minute interval (L613), foreground return (L624) or boot (L312), so saving then switching device inside that window shows no workout.
- **Zero-set save** (`user-flows.md` L127): no guard at 16012; `exercises` filters to `[]` (16015) and `totalSets` is 0. `review-empty.png` shows "WORKOUT COMPLETE" with both save paths live — an empty record joins history and inflates Home's "TOTAL WORKOUTS".
- Crawl: 2/3 clicked, 0 non-responders, 0 console errors, 1 axe node (global `meta-viewport`, D9), 1/3 targets under 44px (`page-metrics.jsonl` L37-42).

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 3 | `review-populated.png`: the one accent button is "HOW DID IT FEEL?"; the job (bank the session) sits in the quiet "Save without reflection" — inferable after a scan, 2 candidate primaries |
| Feature completeness | 3 | §2: save and summary work; fallback broken, retry dead, throwback hidden and redundant (`review-populated-ai-insight.png`, `review-error.png`) |
| Task success | 3 | Flow 3 completes first attempt (`flow-3-home-saved.png`, 1076 ms) but the spec fails on D1; the insight branch has no retry — recovery means discarding (`review-error.png`) |
| Speed | 5 | 1 tap, 0 screen changes to save from the entry state (`flow-3.json` step 4); flow total 3 = expected 3 |
| State handling | 2 | Band table, M=0 W=2 G=1: `review-empty.png` and `review-error.png` wrong, `review-loading.png` generic, `review-populated.png` correct |
| Data correctness | 4 | `review-populated.png` vs seed `lk_activeWorkoutRows` (72.5x8, 72.5x7, 1260 s): Sets 2, Volume 1088 kg (1087.5 rounded), Duration 21 min, kg matches profile. Shortfall: the row line counts warm-ups (16254), the header does not (15985) |
| Error recovery | 3 | `review-error.png`: cause named ("Connection error…"), workout kept and saveable, but no retry path and the failure is dressed as a genuine insight |

**Function mean 3.3.**

## 7. Keep, fix, cut

**Keep**
- One-tap save from the summary, 0 screen changes (`flow-3.json`).
- Stat tiles and per-exercise volume, correct against seed (`review-populated.png`).
- Two-step Discard with "Keep it", confirmed in place (`review-populated-discard-armed.png`).
- The AI insight when it lands: `review-populated-ai-insight.png` names a six-week bench trend and a load rule — the only content here the lifter did not already know.

**Fix**
- D1: call the exported `LockedSync.syncToCloud()` at 57460 so a signed-in save syncs at once.
- Guard `save()` at 16012 on `totalSets === 0`; give the empty state its own copy and a single Discard action (`review-empty.png`).
- Make the completing action primary, demote reflection (`review-populated.png`).
- Replace the canned fallback (16112) with a named failure plus Retry, save still available (`review-error.png`).
- Give loading one line of purposeful copy (`review-loading.png`).
- Reconcile warm-up counting between 15985 and 16254.

**Cut**
- ThrowbackCard here (16536): 1-in-5 random, on a branch most saves never reach, and Progress already carries it (28645). North star: this screen must say something about *this* session; a nostalgia card is neither reliable nor about today.
- The five-rating gate as the primary path (16348): five taps of self-report whose only visible use is a network call that may not answer. Five seconds after racking, a lifter wants the comparison — this session against the last, per lift, and whether anything was a PR — which is computable locally (`prs` 10760, `history`). Reflection belongs as an option, not the gate.
