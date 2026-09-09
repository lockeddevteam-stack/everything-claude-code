# Wave 1 Function Audit — Workout Detail (`workout-detail`)

Component `WorkoutDetail` L17084, `ConvertToSplitModal` L16622. Page-map 2.9.

## 1. Purpose

A read-only record of one finished session — name, date, note, feelings, every set — with Edit, Convert and Delete attached.

## 2. Feature inventory

| Feature | Line | Status | Note |
|---|---|---|---|
| Header: name, date, dur, sets · vol, "(edited)" | L17548 | working | matches seed (`-populated.png`) |
| Back → Home / TrainHub | L17532 | working | crawl responded (`page-metrics.jsonl:59`) |
| Edit | L17562 | **broken** | round-trip rewrites totals, destroys RIR 5; §5 |
| Convert → split | L17599 | working | `resolveExId(...).filter(Boolean)` L16637 drops unresolved names |
| Delete (two-tap confirm) | L17619 | working | toast in `-convert-modal.png` |
| NOTE card / HOW YOU FELT | L17638, L17660 | working | |
| EXERCISES list | L17710 | working | gated on `w.sets &&`; §5 |
| NOTES (`w.blocks`) / AI insight | ~L17795, L17840 | working | not in seed |
| Edit fields, Add Set, remove set/exercise | L17198-L17510 | working | `-populated-edit.png` |
| Empty-state copy "No exercises…" | L17509 | **dead** | edit-mode only; Edit hidden when `exercises.length===0` (L17562), so unreachable |
| Compare to last time | — | absent | no prior-session values in `-populated-full.png` |
| Repeat / start again | — | absent | only via Convert → split |

## 3. Task walkthrough

No flow in `user-flows.md` enters this page (8 flows; no match for the component or "past session"), so `flow-metrics.jsonl` has no row. Taps are counted from the capture paths in `screenshots/index.md` L200-211 and the crawl in `page-metrics.jsonl:59`; entry is Home.

| Job | Steps | Taps | Result |
|---|---|---|---|
| View the session | Home recent row | 1 | works; `workout-detail-populated.png` |
| **Compare to last time** | open A, Back, open B | 3 + memory | **unsupported** — no prior numbers on the page |
| **Fix a logging mistake** | Edit → field → type → SAVE | 3 | completes, but silently changes totals and drops RIR 5 (§5) |
| **Repeat it** | Convert → Create New Split → name → type → CREATE → Start Day | 5 + typing | workaround: builds a permanent program to re-run one session |

Hesitation: three equal-weight header buttons, no primary (`-populated.png`); the H1 wraps to three lines and shoves the meta under them; in edit mode ← and SAVE both exit but only one keeps the work; the empty session offers only Delete.

## 4. State coverage

Applicable A = 2. Loading and error are **N/A** — page-map 2.9 row `L/X | n/a` (no network branch); `screenshots/index.md` L443-444 records both as not captured for that reason.

| State | Capture | Present | Quality |
|---|---|---|---|
| populated | `workout-detail-populated.png` / `-full.png` | yes | correct |
| empty | `workout-detail-empty.png` | yes (test 2a: diff vs `-populated.png` visible in the list region — no EXERCISES card, no Edit, no Convert, a bare "0") | **present-but-wrong**: the list region holds only the digit `0`; no copy, no action, while NOTE and HOW YOU FELT still render as if content exists |
| loading | — | N/A | |
| error | — | N/A | |

M=0, W=1, G=0. (A second reading — that the `0` is a render artefact and nothing marks the state — gives M=1, W=0 and score 2; noted for the reviewer.)

## 5. Baseline failures

`SUMMARY.md` L35: populated passed, empty failed, error N/A, 3/4 clicked, 0 non-responders, 0 console/page errors. Delete skipped as destructive, not a defect.

1. **Empty spec failed** (D6, `page-metrics.jsonl:56`, check `text=/no exercises/i`). Traced: the copy sits at L17509 inside the `if (editing)` block; read mode returns at L17511 with no empty branch. Edit and Convert are each gated on `w.exercises && w.exercises.length > 0` (L17562, L17599), so an empty session cannot enter edit mode — the copy is unreachable by any path, not merely misplaced.
2. **Stray "0"**. L17710 renders the EXERCISES card as `w.sets && React.createElement(...)`; with `w.sets === 0` React prints `0`. Visible mid-page in `workout-detail-empty.png`.
3. **Edit round-trip rewrites totals** (not in the baseline defect list). `saveEdit` L17160-L17193 recounts every set with `s.w || s.r` and recomputes `vol`. Seed `seed-data.json` L15 stores `sets:16, vol:"14363 kg"` while listing 17 rows, one `setType:"warmup"`. After Edit → SAVE with no user change, `-convert-modal.png` and `-convert-new.png` read **"17 sets · 14723 kg (edited)"** — +1 set and +360 kg, the warm-up's 45 × 8. Index L201 records no edit between Edit and SAVE.
4. **Edit destroys RIR 5**. The RIR `<select>` offers `"", 0, 1, 2, 3, 4, "5+"` (L17451). The seed's first squat set has `rir:"5"`, matching no option: `-populated-edit.png` shows `--` where `-populated.png` shows `RIR 5`. Saving writes `rir:""`.
5. **Edit-mode Back discards silently**. L17220 is `onClick: setEditing(false)`, no confirm; typed changes lost without warning.
6. `saveEdit` L17176 forces `done:true` on every surviving set.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 3 | `workout-detail-populated.png`: job ("a past session") readable after a scan, but three primary-styled header buttons (Edit orange, Convert blue, Delete red) compete and the H1 wraps to three lines pushing the meta below them; candidate primary actions = 3 |
| Feature completeness | 2 | Feature table §2: Edit is broken (wrong totals, lost RIR — `-populated-edit.png` vs `-populated.png`, `-convert-modal.png`); empty-state copy dead and unreachable (`workout-detail-empty.png`); shortfall: display features all work |
| Task success | 2 | Primary (view) passes: populated spec passed, crawl 3/4 with 0 non-responders. Fix returns a wrong result (§5.3-5.4); repeat needs the Convert→split workaround; compare has no affordance at all (`-populated-full.png`) |
| Speed | 4 | View = 1 tap from Home (`index.md` L211), matches best-known, 0 extra screen changes; named shortfall: repeat costs 5 taps + typing vs a best-known 1 (`-convert-new.png`) |
| State handling | 3 | Band table: A=2 (L/X N/A, page-map 2.9), M=0, W=1, G=0. Empty present by test 2a but wrong: `workout-detail-empty.png` shows header, Delete and a bare `0`, no copy, no action |
| Data correctness | 2 | 5 checks vs `seed-data.json` L15: sets 16 ✓, vol "14363 kg" ✓, squat set 2 "87.5 kg x 8 reps RIR 2" ✓ (`-populated.png`); but 17 rows shown under a "16 sets" header with the warm-up unmarked, and a no-op Edit→SAVE flips it to "17 sets · 14723 kg" (`-convert-modal.png`) |
| Error recovery | 2 | Delete is guarded and names the consequence — "Tap Delete again to remove this workout for good." (`workout-detail-populated-delete-armed.png`, `-convert-modal.png`); but edit-mode Back discards typed work with no prompt (L17220) and a saved edit has no undo, so work is lost silently |

**Function mean 2.6.**

## 7. Keep, fix, cut

**Keep**
- Set list with weight × reps, RIR and done tick — the only legible full record of a session (`-populated.png`).
- NOTE and HOW YOU FELT: seeded values render correctly and give context.
- Two-tap Delete confirm naming the consequence (`-populated-delete-armed.png`).
- One-tap entry from Home and TrainHub History (`-populated-from-train.png`).

**Fix**
- Empty state: render "No exercises" copy in read mode and kill the `w.sets &&` truthiness bug at L17710 that prints `0`.
- Ungate Edit/Convert from `exercises.length > 0` (L17562, L17599) so an empty session can be repaired, not only deleted.
- `saveEdit` must preserve `setType`, `done` and out-of-range RIR, and not recount warm-ups into the header (L17160, L17451).
- Add a discard confirm to edit-mode Back (L17220).
- Add a previous-session column beside each set, so compare costs 0 extra taps, not 3 plus memory.
- Add a Repeat action that starts this session directly; 5 taps through Convert is the wrong price.

**Cut**
- Convert to Split. North star: a lifter opening a past session wants to compare, fix or repeat it. Convert does none of those — it builds a permanent program as a side effect of viewing one session, silently drops unresolved exercises (L16637), and holds one of three equal header slots that should carry the page's real primary. Split creation belongs in Split Builder.
