# Function audit — split-builder

*SplitBuilder (SB) L8782, AISplitBuilder (AISB) L13956, ConvertToSplitModal L16622. Captures: `00-inventory/screenshots/current/`.*

## 1. Purpose

Assemble or edit a named split — days, and the exercises inside each day — then save it to `lk_splits`.

## 2. Feature inventory

| Feature | Component / line | Status | Note |
|---|---|---|---|
| Split name field | SB L9267 | working | `split-builder-populated-full.png` |
| Add a day | SB L9790-9818 | working | blank name → toast (`global-toast.png`) |
| Rename day | SB L8809 | working | `split-builder-populated-rename-day.png` |
| Remove day / exercise | SB L9390-9418 | working, unguarded | no confirm; crawl skipped all 19 |
| + Exercise → ExLib | SB L8808/L9216 | working | `split-builder-populated-pick.png` |
| 📝 Block | SB L9430+ | working | 3 inputs responded |
| Drag-reorder items | SB L8811, L8823 | hidden | `if (!e.touches…) return`: mouse and keyboard cannot reorder; only a grip glyph, `split-builder-populated.png` |
| SAVE SPLIT | SB L9819 | working | disabled until name + ≥1 day, `split-builder-empty.png` |
| Cancel / Back | SB L9247, L9832 | **broken** | discards all edits silently — §5 |
| AI: Chat with AI Coach | AISB L14012 | working | `split-builder-populated-ai.png` |
| AI: Send answer | AISB ≈L14000 | **broken** | voice FAB overlays it (D2) |
| AI: Import from Photo | AISB L14159 | **broken** | `imgData` never enters the request body (compare Fuel L40384 `body.base64 = imgData`); the worker gets only the note, so the "converted" split is invented from `photoNote` or the literal `"a training split"`. `split-builder-populated-ai-photo.png` |
| AI photo failure | AISB L14172 | dead | `onErr` = `setPhotoLoading(false)`; unparseable reply = `setPhotoResult(null)`. Nothing renders |
| ConvertToSplitModal | L16622 | hidden | reachable only from Workout Detail L17846; no capture among this page's 13 |

## 3. Task walkthrough

**Flow 6 — edit a split, start it.** `flow-metrics.jsonl` L8: taps 5, expected 5, ms 2300, pass, 0 errors.

| # | Step | t_ms (`flow-6.json`) | Hesitation |
|---|---|---|---|
| 1 | Nav Train | 1522 | — |
| 2 | card "Edit" | 2497 | sits beside an unconfirmed Delete (D15) |
| — | type "PPL v2" | 3071 | — |
| 3 | SAVE SPLIT | 3498 | scroll past 3 day cards; in `split-builder-populated.png` neither SAVE nor the name field is in frame |
| 4 | card "Start" | 4445 | — |
| 5 | day row "Push" | 5427 | sheet duplicates the 1-tap `Start <day>` header button (user-flows L210) |

Scratch creation is uncosted by any flow: `split-builder-empty.png` → name, day name, Add, then +Exercise → pick → back per exercise. A 3x5 split is ~20 taps; no template, no duplicate-day, no copy-from-existing.

## 4. State coverage (A = 4)

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty | `split-builder-empty.png`, `-empty-day-no-exercises.png` | yes | correct: "Add a new day", disabled SAVE, "No exercises yet" L9424 |
| Loading | `split-builder-loading.png` | yes (2b: three-dot bubble, Send disabled) | correct |
| Error | `split-builder-error.png` | **missing** | Test 2b: nothing distinguishes it from a successful first turn. The abort handler L14045 writes a hard-coded question, "What is your main training goal and how many days a week can you train?", into the assistant bubble. The baseline soft-check matched only because that string contains "train" |
| Populated | `split-builder-populated.png`, `-full.png` | yes | correct |

M = 1, W = 0, G = 0.

## 5. Baseline failures and non-responders

`page-metrics.jsonl` L53: populated/empty/error all **passed**; `nonResponders: []`, `blocked: []`, 0 console and page errors.

**The 21/40 gap is not dead UI.** All 19 unclicked elements sit in `skipped` with `reason: "destructive/allowlisted label"`: 3x `Remove this day`, 16x `Remove this exercise from the day`. Every non-destructive control responded. Cause: unconfirmed destructive actions, L9390-9418, same class as D15.

**Back discards edits silently — verified.** Measured with Playwright (`fixtures/index.mjs`, iPhone 15 Pro, seeded): Edit PPL, rename to "DISCARD ME", tap `[aria-label="Remove this day"]`, tap `[aria-label="Back"]`. Result `{dialogs: [], overlayText: null, afterName: "PPL", afterDays: ["Push","Pull","Legs"]}` — no dialog, no confirm copy, storage untouched, 700 ms. Trace: Back L9247 and Cancel L9832 both call TrainHub `onBack` L15039 (`setView("main"); setEditSplit(null)`); `name`/`days` are component `useState` L8784/L8805, dropped on unmount; no dirty flag in L8782-9845. Reload loses the same work: `lk_ui_trainView` persists `"edit"` while `editSplit` resets to null, reopening a blank New Split (user-flows L222).

D2: voice FAB blocks Send answer, forced tap needed — in `split-builder-error.png` the mic sits over a second button. D12: 11/42 targets under 44px — Back 22x27, "+ Exercise" 157x33 x3, "📝 Block" 155x33 x3, day name 175x22 x3, Cancel 353x42 (`targets.json`). axe: 1 node, global `meta-viewport` (D9).

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 3 | `split-builder-empty.png` states the job ("New Split", name, Add a day). `split-builder-populated.png` shows neither title, name field nor SAVE; four peer accents (+Exercise x3, Add) compete. Job inferable after a scan |
| Feature completeness | 3 | Manual build works end to end, 21/21 non-destructive controls responded. Secondary broken: photo import never transmits the image (L14164 vs L40384), Send answer occluded (D2), drag hidden to touch only (L8823) |
| Task success | 3 | Flow 6 passes first attempt, 5/5 taps, `flow-metrics.jsonl` L8. Secondary needs a workaround: reorder is unreachable without touch; photo import has none. Shortfall: any edit is one mis-tap from silent loss (§5) |
| Speed | 4 | 5 taps / 2300 ms, equal to `expectedTaps`, `flow-metrics.jsonl` L8. Shortfall: +1 tap vs the `Start <day>` header the sheet duplicates; scratch build ~20 taps, no template |
| State handling | 2 | A=4, M=1 (error, `split-builder-error.png`, test 2b), W=0, G=0 → band table row "M = 1 and W = 0" |
| Data correctness | 5 | `split-builder-populated.png` vs seed `s1784970000000`: days Push/Pull/Legs; Legs = 701 Barbell Squat, 801 Romanian Deadlift, 703 Leg Press, 802 Lying Leg Curl, 1101 Standing Calf Raise, same order; badges 1/2/3. No units here |
| Error recovery | 1 | Silent loss and silent failure: Back drops edits with no prompt (measured, §5); AI abort fabricates a coach question (`split-builder-error.png`); photo failure renders nothing (L14172) |

**Function mean 3.0.**

## 7. Keep, fix, cut

**Keep**
- Day card → exercise rows → +Exercise structure; every control responded (`page-metrics.jsonl` L53).
- SAVE disabled until name + ≥1 day (`split-builder-empty.png`): blocks an unusable split.
- Data fidelity: 5/5 Legs ids match seed order.

**Fix**
- Back/Cancel must detect dirty state and confirm or autosave: measured loss of a rename plus a deleted day, no dialog (§5).
- Persist the draft so reload does not reopen a blank builder (user-flows L222).
- Show that the AI request failed instead of a hard-coded question (L14045).
- Send the image on photo import, or remove the upload control (L14164).
- Move the voice FAB off Send answer (D2).
- Confirm or undo the 19 remove actions (skipped list, L9390).
- Raise Back, day name, +Exercise, Block to 44px (`targets.json`).
- Expose reorder to non-touch input (L8823).

**Cut**
- "Import from Photo" as shipped: it fails the job it names, discarding the photo and inventing a split — worse than no feature under "one job per screen".
- The day-picker sheet's duplication of the per-day Start button: two paths to one action.

North star: building a program is monthly, so a home one level below Train Hub is right, and 2-tap entry is right; the cost is not. A 10-minute build is destroyable by a 1-tap Back, and the ~20-tap scratch path has no template. Directive **refine** holds — keep the placement and structure, fix persistence, the error state and the photo path.
