# Function audit — split-builder

*SB = SplitBuilder L8782, AISB = AISplitBuilder L13956. Captures: `00-inventory/screenshots/current/`.*

## 1. Purpose

Assemble or edit a named split — its days and their exercises — then save it to `lk_splits`.

## 2. Feature inventory

| Feature | Component / line | Status | Note |
|---|---|---|---|
| Split name | SB L9267 | working | `split-builder-populated-full.png` |
| Add a day | SB L9790-9818 | working | blank name → `global-toast.png` |
| Rename day | SB L8809 | working | `split-builder-populated-rename-day.png` |
| Remove day / exercise | SB L9390-9418 | unguarded | no confirm; crawl skipped all 19 |
| + Exercise → ExLib | SB L8808/L9216 | working | `split-builder-populated-pick.png` |
| 📝 Block | SB L9430+ | working | 3 inputs responded |
| Drag-reorder items | SB L8811, L8823 | hidden | `if (!e.touches…) return`: mouse and keyboard cannot reorder; only a grip glyph in `split-builder-populated.png` |
| SAVE SPLIT | SB L9819 | working | disabled until name + ≥1 day, `split-builder-empty.png` |
| Cancel / Back | SB L9247, L9832 | **broken** | discards all edits silently — §5 |
| AI: Chat with AI Coach | AISB L14012 | working | `split-builder-populated-ai.png` |
| AI: Send answer | AISB ≈L14000 | **broken** | voice FAB overlays it (D2) |
| AI: Import from Photo | AISB L14159 | **broken** | `imgData` never enters the request body (compare Fuel L40384 `body.base64 = imgData`); the worker gets only the note, so the "converted" split is invented from `photoNote` or the literal `"a training split"`. `onErr` L14172 only clears loading; nothing renders. `split-builder-populated-ai-photo.png` |

ConvertToSplitModal L16622 is hidden: reachable only from Workout Detail L17846.

## 3. Task walkthrough

**Flow 6 — edit a split, start it.** `flow-metrics.jsonl` L8: 5 taps, expected 5, 2300 ms, pass, 0 errors. Timestamps from `flow-6.json`.

| # | Step | t_ms | Hesitation |
|---|---|---|---|
| 1 | Nav Train | 1522 | — |
| 2 | card "Edit" | 2497 | beside an unconfirmed Delete (D15) |
| — | type "PPL v2" | 3071 | — |
| 3 | SAVE SPLIT | 3498 | scroll past 3 day cards; `split-builder-populated.png` frames neither it nor the name field |
| 4 | card "Start" | 4445 | — |
| 5 | day row "Push" | 5427 | sheet duplicates the 1-tap `Start <day>` header (user-flows L210) |

Scratch creation, uncosted by any flow: `split-builder-empty.png` → name, day name, Add, then +Exercise → pick → back per exercise. A 3x5 split is ~20 taps, no template or duplicate-day.

## 4. State coverage (A = 4)

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty | `split-builder-empty.png`, `-empty-day-no-exercises.png` | yes | correct: "Add a new day", disabled SAVE, "No exercises yet" |
| Loading | `split-builder-loading.png` | yes (2b: three-dot bubble, Send disabled) | correct |
| Error | `split-builder-error.png` | **missing** | Test 2b: nothing distinguishes it from a successful first turn. Abort handler L14045 writes a hard-coded question, "What is your main training goal and how many days a week can you train?", into the assistant bubble; the baseline soft-check matched only because it contains "train" |
| Populated | `split-builder-populated.png`, `-full.png` | yes | correct |

M = 1, W = 0, G = 0.

## 5. Baseline failures and non-responders

`page-metrics.jsonl` L53: populated/empty/error **passed**; `nonResponders: []`, `blocked: []`, 0 errors.

**The 21/40 gap is not dead UI.** All 19 unclicked elements sit in `skipped`, `reason: "destructive/allowlisted label"`: 3x `Remove this day`, 16x `Remove this exercise from the day`. Every non-destructive control responded. Cause: unconfirmed destructive actions L9390-9418 (D15).

**Back discards edits silently — verified.** Measured with Playwright (`fixtures/index.mjs`, iPhone 15 Pro, seeded): Edit PPL, rename to "DISCARD ME", tap `[aria-label="Remove this day"]`, then Back. Result `{dialogs: [], overlayText: null, afterName: "PPL", afterDays: ["Push","Pull","Legs"]}` — no dialog, no confirm copy, storage untouched, 700 ms. Trace: Back L9247 and Cancel L9832 both call TrainHub `onBack` L15039 (`setView("main"); setEditSplit(null)`); `name`/`days` are `useState` L8784/L8805, dropped on unmount; no dirty flag in L8782-9845. Reload loses the same work: `lk_ui_trainView` persists `"edit"` while `editSplit` resets to null, reopening a blank New Split (user-flows L222).

D2: the voice FAB blocks Send answer; in `split-builder-error.png` the mic sits over a second button. D12: 11/42 targets under 44px — Back 22x27, +Exercise 157x33 x3, Block 155x33 x3, day name 175x22 x3, Cancel 353x42 (`targets.json`). axe: 1 node, global `meta-viewport` (D9).

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 3 | `split-builder-empty.png` states the job ("New Split", name, Add a day). `split-builder-populated.png` shows no title, name field or SAVE; four peer accents compete. Job inferable after a scan |
| Feature completeness | 3 | Manual build works end to end, 21/21 non-destructive controls responded. Secondary broken: photo import never sends the image (L14164), Send answer occluded (D2), drag touch-only (L8823) |
| Task success | 3 | Flow 6 passes first attempt, 5/5 taps, `flow-metrics.jsonl` L8. Secondary needs a workaround: reorder is unreachable without touch; photo import has none. Shortfall: an edit is one mis-tap from silent loss (§5) |
| Speed | 4 | 5 taps / 2300 ms = `expectedTaps`, `flow-metrics.jsonl` L8. Shortfall: +1 tap vs the `Start <day>` header the sheet duplicates; scratch build ~20 taps |
| State handling | 2 | A=4, M=1 (error, `split-builder-error.png`, test 2b), W=0, G=0 → band table row "M = 1 and W = 0" |
| Data correctness | 5 | `split-builder-populated.png` vs seed `s1784970000000`: days Push/Pull/Legs; Legs = 701 Barbell Squat, 801 Romanian Deadlift, 703 Leg Press, 802 Lying Leg Curl, 1101 Standing Calf Raise, in order; badges 1/2/3. No units here |
| Error recovery | 1 | Silent loss and silent failure: Back drops edits with no prompt (§5); the AI abort fabricates a question (`split-builder-error.png`); photo failure renders nothing (L14172) |

**Function mean 3.0.**

## 7. Keep, fix, cut

**Keep**
- Day card → exercise rows → +Exercise structure; all controls responded (`page-metrics.jsonl` L53).
- SAVE disabled until name + ≥1 day (`split-builder-empty.png`).
- Data fidelity: 5/5 Legs ids match seed order.

**Fix**
- Back/Cancel must detect dirty state and confirm or autosave: measured loss of a rename plus a deleted day (§5).
- Persist the draft; reload must not reopen a blank builder (L222).
- Say the AI request failed instead of faking a question (L14045).
- Send the image on photo import, or remove the upload control (L14164).
- Move the voice FAB off Send answer (D2).
- Confirm or undo the 19 remove actions (L9390).
- Raise Back, day name, +Exercise and Block to 44px (`targets.json`).
- Expose reorder to non-touch input (L8823).

**Cut**
- "Import from Photo" as shipped: it fails the job it names, discarding the photo and inventing a split — worse than no feature under "one job per screen".
- The day-picker sheet duplicating the per-day Start button: two paths, one action.

North star: building a program is monthly, so a home one level below Train Hub and 2-tap entry are right; the cost is not. A 10-minute build dies to a 1-tap Back, and the ~20-tap scratch path has no template. **Refine** holds — keep placement and structure; fix persistence, the error state, the photo path.
