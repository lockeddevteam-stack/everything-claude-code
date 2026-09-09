# Design Audit: Split Builder (`split-builder`)

Surface: SplitBuilder editor, AISplitBuilder, ConvertToSplitModal. Captures: `split-builder-populated.png`, `-populated-full.png`, `-populated-ai.png`, `-empty.png`, `-error.png`; convert sheet re-captured live (no harvest shot exists).

## 1. Squint and 5-second test

8px blur, first viewport of `-populated-full.png`: the only saturated mass is the global voice FAB. The largest page mass is the "Edit Split" wordmark (32px/800). Three day cards blur into one grey column. Blurring the whole 1,711px page, SAVE SPLIT wins — but it sits 1,123px below the fold.

5-second: **first** "Edit Split"; **second** the FAB; **third** the exercise-name column. It reads as a read-only list. No control above the fold is styled primary; the squint winner is a title.

**Loss of work.** Back is 22x27px, hairline, top-left, styled exactly like Back on read-only pages. Measured: type a day name, tap Add, tap Back — returns to Train Hub, no dialog, no toast, nothing persisted. Nothing signals unsaved state (no dot, no "Edited", no change in SAVE SPLIT). The design gives a destructive discard the weight of a navigation affordance and hides the confirming action off-screen.

**Reordering.** The only affordance is a 20x26px three-bar glyph at opacity 0.35, 1.95:1 against the card (below the 3:1 floor), no label, no `aria-label`, no `title`, `onTouchStart` only, 350ms long-press that cancels if the finger moves >10px. `cursor:grab` is set with no pointer handler. A person tries dragging the row (nothing), long-pressing the row (nothing), then delete-and-re-add. Effectively invisible.

**Voice overlap (AI builder).** Send 46x46 at (331,510)-(377,556); FAB 50x50 at (327,527)-(377,577). Intersection 46x29 = **1,334px² = 63.0% of Send**. `elementFromPoint` at Send's centre returns the FAB — the centre is untappable.

**Convert sheet.** Two 353x71 options as equal peers in two accents (orange, info blue), each with an ➕ emoji; Cancel 353x41; no grabber; 20px radius against 16px page cards; no entrance transition.

## 2. Callouts

Keyed to `split-builder-annotated.png`, legend on the image: 1 Back, 2 title, 3 handle, 4 equal day cards, 5 Exercise/Block pair, 6 SAVE SPLIT, 7 Cancel, 8 Send/FAB overlap, 9 convert options, 10 convert Cancel.

## 3. Measurements

Contrast (`tests/baseline/scans/split-builder.json`): 45 checked, **45 pass, 0 fail, 2 unknown** — "SAVE SPLIT" and the FAB glyph sit on gradients, so unknown, not passing. Per style: 11/400 muscle 6.64:1; 12/600 "📝 Block" 6.64:1; 13/600 exercise name 15.63:1; 13/600 accent "Exercise" 7.52:1; 14/800 day index 7.52:1; 14/700 "Add" 5.18:1; 14/400 Cancel 8.19:1; 15/700 day name 15.63:1; 32/800 title 17.83:1. Drag handle (measured separately): **1.95:1**.

Targets: 42 interactive, **11 under 44x44 (73.8% pass)** — Back 22x27; rename `p[role=button]` 175x22 x3; "+ Exercise" 157x33 x3; "📝 Block" 155x33 x3; Cancel 353x42. Convert sheet adds Cancel 353x41. No horizontal overflow (`scrollWidth` 393 = `clientWidth`).

Spacing: 274 non-zero padding/gap/margin longhands, **238 on {4,8,12,16,24,32} = 86.9%**. Off-grid 2px x30, 20px x5, 58px x1; no breaks documented.

Type: **7 sizes** — 11, 12, 13, 14, 15, 18, 32. Weights 400/600/700/800; 800 on the 14px day index and 18px SAVE SPLIT; 700 on the 15px day name. Line-height explicit on 6 styles, `normal` on 8. Tabular figures 0 of 3 numeric nodes.

Radii: 16, 14, 12, 10, 7, 6, 5, 1px = **8 distinct**. Shadows: 3, one an accent glow `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px`.

Pressed (real `mouse.down`, read at 100ms): SAVE SPLIT, Add, + Exercise, Remove-exercise, Cancel — all scale to .97, **5/5**. `button:disabled{opacity:.4}`, measured 0.4 on SAVE SPLIT in `-empty.png`.

## 4. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | squint of first viewport: winner is the global FAB, then the 32/800 title; zero primary-styled page controls above the fold; SAVE SPLIT 1,123px down, flanked by a full-width Cancel (`-populated-full.png`) |
| Typography | 3 | 7 sizes (11/12/13/14/15/18/32); `normal` line-height on 8 of 14 styles; 700 on 15px running text (`-populated.png`) |
| Spacing | 3 | 238/274 = 86.9%; off-grid 2px x30, 20px x5, 58px x1; undocumented |
| Contrast | 4 | scan 45/45 text pass, 0 fail; shortfall — 2 unknown over gradients and the drag handle, a real control, at 1.95:1 |
| Component consistency | 1 | 8 radii on one screen; 3 shadow variants; 3 card styles (day card 16px, dashed add-day, sheet 20px); 2 accents in the sheet; SVG icons mixed with 📝 and ➕ |
| Targets | 1 | 11/42 under 44px = 73.8% (below 75%): Back 22x27, rename 175x22, Cancel 353x42 (`scans/split-builder.json`) |
| Motion and feedback | 4 | 5/5 pressed at 100ms; zero page animations, zero decorative rows; shortfall — the convert sheet has no entrance transition and adding a day does not animate the insertion (measured) |
| HIG fit | 1 | 3 sections violated: Buttons (11 sub-44 targets incl. the header control), Sheets (no grabber, 20px radius, two co-equal primaries), Feedback (destructive discard on Back, no confirmation) |
| AI-look penalty | 1 | 5 tells: emoji icons (📝 x3, ➕ x2), 8 mixed radii, three stacked equal-weight cards, gradient + accent glow on SAVE SPLIT, "Build a smart split in seconds." (`-populated-ai.png`) |
| Accessibility | 3 | axe 1 critical `meta-viewport` (global shell; critical caps at 3); focus order logical (14 stops, Back first); reduced-motion query present; 120% root text: no root overflow; shortfall — unnamed, unfocusable drag handle |

**Design mean 2.3.**

## 5. Detail checklist — 2/11

| # | Item | Verdict | Measurement |
|---|---|---|---|
| 1 | Primary action obvious | Fail | 5-second test names the title; zero accent-filled page controls above the fold |
| 2 | Type scale | Fail | 7 sizes; 12/14/18/32 off the scale; `normal` line-height on 8 styles |
| 3 | 8px grid | Fail | 86.9% on grid, no breaks documented |
| 4 | Control states | **Pass** | 5/5 changed at 100ms under real press; `button:disabled{opacity:.4}` measured |
| 5 | Meaningful motion | Fail | Zero decorative rows, but adding a day inserts with no animation (measured after Add) |
| 6 | Empty and error copy | Fail | `-empty.png`: no instruction sentence, three action controls. `-error.png` (worker aborted) renders the canned first question with no error text |
| 7 | Numbers | Fail | 0/3 numeric nodes carry `tabular-nums` |
| 8 | One icon set | Fail | SVG line icons plus 📝 x3 and ➕ x2 |
| 9 | Scroll and targets | Fail | 11 targets under 44x44; no horizontal overflow |
| 10 | Native dark | Fail | Surfaces rise (#000 → #1C1C1E) but SAVE SPLIT carries a saturated accent-glow shadow |
| 11 | Copy | **Pass** | No exclamation marks; labels ≤3 words; the one long line is a needed sentence |

## 6. Consistency deltas vs `design-system-current.md`

- Radii: 8 values here incl. 1, 5, 6, 7, 10px, plus 20px on the sheet; the app's `--ds-r-*` set is 10/14/18/22 and the CSSARR override normalises cards to 16px — the sheet and the small chips escape both.
- Row control: the day header is a `p[role=button]` 175x22; every other page uses a real button.
- Card style: 16px day card, dashed accent add-day card, 20px sheet — three treatments where the system defines one.
- Accent: the convert sheet promotes `--color-info` to a co-equal second accent, against the one-accent rule.
- Icons: 📝 and ➕ beside SVG stroke icons; the doc counts 65 emoji app-wide, target 0.

## 7. Keep, fix, cut

- **Keep** pressed feedback: 5/5 controls respond under 100ms, the one Apple-grade detail here.
- **Keep** the day-card grouping: split → days → exercises reads correctly at a glance.
- **Fix** Save: pin it as a persistent primary and make Back a real dismiss with an unsaved-changes confirmation; today it discards silently at 22x27px.
- **Fix** reordering: replace the 1.95:1 touch-only handle with a labelled 44px control and a visible drag state.
- **Fix** the FAB covering 63% of Send; inset it or suppress it on input surfaces.
- **Fix** the AI error state; an aborted worker call currently renders a normal question.
- **Cut** the sheet's second accent and both ➕; make "Create New Split" the single primary.
- **Cut** the "📝 Block" emoji and its 155x33 footprint; fold it into the Exercise picker.
