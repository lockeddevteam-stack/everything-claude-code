# Design Audit: Split Builder (`split-builder`)

Surface: SplitBuilder editor, AISplitBuilder, ConvertToSplitModal. Captures: `split-builder-populated.png`, `-populated-full.png`, `-populated-ai.png`, `-empty.png`, `-loading.png`, `-error.png`; convert sheet re-captured live (no harvest shot exists).

## 1. Squint and 5-second test

8px blur on the first viewport of `split-builder-populated-full.png`: the only saturated mass is the global voice FAB, bottom-right. The largest page mass is the "Edit Split" wordmark (32px/800). Nothing else separates — three day cards blur into one grey column. Blurring the whole 1,711px page instead, SAVE SPLIT wins, but it is 1,123px below the fold.

5-second: **first** "Edit Split"; **second** the orange FAB; **third** the exercise-name column. Testers read this as a read-only list of what is in the split. No control in the first viewport is styled as the primary action; the winning element is a title. Save is not discoverable without scrolling ~2 viewports.

**Loss of work.** The Back chevron (callout 1) is 22x27px, hairline, top-left, identical in styling to Back on every read-only page. Measured: type a day name, tap Add, tap Back — the app returns to Train Hub with no dialog, no toast, nothing persisted. Nothing on screen ever signals unsaved state (no dot, no "Edited", no enabled/disabled shift on SAVE SPLIT once populated). The design gives a destructive discard the visual weight of a navigation affordance and hides the confirming action off-screen.

**Reordering.** The only affordance is a 20x26px three-bar glyph at opacity 0.35, computed 1.95:1 against the card (below the 3:1 UI-boundary floor), no label, no `aria-label`, no `title`, and only an `onTouchStart` handler with a 350ms long-press that cancels if the finger moves >10px. `cursor:grab` is set but no pointer handler exists. A person would first try dragging the row itself (nothing), then long-pressing the row (nothing), then delete-and-re-add. The affordance is effectively invisible.

**Voice button overlap (AI builder).** Send: 46x46 at (331,510)-(377,556). FAB: 50x50 at (327,527)-(377,577). Intersection 46x29 = **1,334px² = 63.0% of Send**. `elementFromPoint` at Send's centre returns the FAB — Send's centre is untappable.

**Convert sheet.** Two 353x71 options styled as equal peers in two different accents (orange, info blue), each with an ➕ emoji; Cancel 353x41; no grabber; sheet radius 20px against the page's 16px cards; appears with no entrance transition.

## 2. Callouts

Keyed to `split-builder-annotated.png`, legend inline on the image (1 Back, 2 title, 3 handle, 4 equal day cards, 5 Exercise/Block pair, 6 SAVE SPLIT, 7 Cancel, 8 Send/FAB overlap, 9 convert options, 10 convert Cancel).

## 3. Measurements

Contrast (`tests/baseline/scans/split-builder.json`): 45 nodes checked, **45 pass, 0 fail, 2 unknown** — "SAVE SPLIT" and the FAB glyph sit on gradients, so their ratio is unknown, not passing. Per style: 11/400 muscle label 6.64:1; 12/600 "📝 Block" 6.64:1; 13/600 exercise name 15.63:1; 13/600 accent "Exercise" 7.52:1; 14/800 day index 7.52:1; 14/700 "Add" on #C2410C 5.18:1; 14/400 Cancel 8.19:1; 15/700 day name 15.63:1; 32/800 title 17.83:1. Drag-handle glyph (measured, not in scan): **1.95:1**.

Targets: 42 interactive, **11 under 44x44 (73.8% pass)** — Back 22x27; day-name rename `p[role=button]` 175x22 x3; "+ Exercise" 157x33 x3; "📝 Block" 155x33 x3; Cancel 353x42. Convert sheet adds Cancel 353x41. No horizontal overflow (`scrollWidth` 393 = `clientWidth` 393).

Spacing: 274 non-zero padding/gap/margin longhands, **238 on {4,8,12,16,24,32} = 86.9%**. Off-grid: 2px x30 (handle bar gap), 20px x5, 58px x1. No breaks documented.

Type: **7 distinct sizes** — 11, 12, 13, 14, 15, 18, 32. Weights 400/600/700/800. 800 on the 14px day index and 18px SAVE SPLIT; 700 on the 15px day name. Line-height explicit on 6 styles, `normal` on 8. Tabular figures: **0 of 3** numeric nodes.

Radii on one screen: 16, 14, 12, 10, 7, 6, 5, 1px = **8 distinct**. Shadows: 3, one an accent glow `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px`.

Pressed (real `mouse.down`, 100ms): SAVE SPLIT scale .97 ✓; Add ✓; + Exercise ✓; Remove-exercise ✓; Cancel ✓ — **5/5**. Disabled rule exists: `button:disabled{opacity:.4}`, measured 0.4 on SAVE SPLIT in the empty state.

## 4. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | Squint of first viewport: winner is the global FAB, then the 32/800 title; zero primary-styled page controls above the fold; SAVE SPLIT 1,123px down, flanked by a full-width Cancel; `-populated-full.png` |
| Typography | 3 | 7 distinct sizes (11/12/13/14/15/18/32); line-height `normal` on 8 of 14 styles; 700 on 15px running text; `-populated.png` |
| Spacing | 3 | 238/274 = 86.9% on grid; off-grid 2px x30, 20px x5, 58px x1; undocumented |
| Contrast | 4 | scan: 45/45 text pass, 0 fail; shortfall — 2 unknown over gradients, and the drag handle at 1.95:1 is a real control below 3:1 |
| Component consistency | 1 | 8 radii on one screen (1–16px); 3 shadow variants; 3 card styles (day card 16px, add-day dashed, convert sheet 20px); 2 accents in the convert sheet; SVG icons mixed with 📝 and ➕ |
| Targets | 1 | 11/42 under 44px = 73.8% pass (below 75%); Back 22x27, rename 175x22, Cancel 353x42; `scans/split-builder.json` |
| Motion and feedback | 4 | 5/5 pressed at 100ms; zero page animations, zero decorative rows; shortfall — the convert sheet appears with no transition and adding a day does not animate the insertion (measured) |
| HIG fit | 1 | 3 sections violated: Buttons (11 sub-44 targets incl. the header control), Sheets (convert sheet has no grabber, 20px radius, two co-equal primaries), Feedback (destructive discard on Back with no confirmation); `convert` capture + `-populated-full.png` |
| AI-look penalty | 1 | 5 tells: emoji icons (📝 x3, ➕ x2), 8 mixed radii, three stacked equal-weight cards, decorative gradient + accent-glow on SAVE SPLIT, marketing copy "Build a smart split in seconds." (`-populated-ai.png`) |
| Accessibility | 3 | axe: 1 critical `meta-viewport` (global shell) — critical caps at 3; focus order logical (14 stops measured, Back first); reduced-motion query present; 120% root text: no root overflow; shortfall — the drag handle is an unnamed, unfocusable control |

**Design mean 2.3.**

## 5. Detail checklist — 2/11

| # | Item | Verdict | Measurement |
|---|---|---|---|
| 1 | Primary action obvious | Fail | 5-second test names the title; zero accent-filled page controls in the first viewport |
| 2 | Type scale | Fail | 7 sizes; 12/14/18/32 are off the 11/13/15/17/22/28 scale; line-height `normal` on 8 styles |
| 3 | 8px grid | Fail | 86.9% on grid; no breaks documented |
| 4 | Control states | **Pass** | 5/5 changed at 100ms under real press; `button:disabled{opacity:.4}` measured |
| 5 | Meaningful motion | Fail | Zero decorative rows, but adding a day inserts with no animation (measured after Add) |
| 6 | Empty and error copy | Fail | `-empty.png`: no instruction sentence, three action controls (Add, SAVE SPLIT, Cancel). `-error.png` (worker aborted) renders the canned first question with no error text — indistinguishable from populated |
| 7 | Numbers | Fail | 0/3 numeric nodes carry `tabular-nums` |
| 8 | One icon set | Fail | Inline SVG line icons plus 📝 x3 and ➕ x2 emoji |
| 9 | Scroll and targets | Fail | 11 targets under 44x44; no horizontal overflow |
| 10 | Native dark | Fail | Surfaces increase (#000 → #1C1C1E) but SAVE SPLIT carries a saturated accent-glow shadow |
| 11 | Copy | **Pass** | No exclamation marks; labels ≤3 words; the one long line ("Turn this workout into a training day in a split program") is a needed sentence |

## 6. Consistency deltas vs `design-system-current.md`

- Radii: page uses 8 values incl. 1, 5, 6, 7, 10px; the sheet uses 20px. The app's own `--ds-r-*` set is 10/14/18/22 and the CSSARR override normalises cards to 16px — the sheet and the small chips escape both.
- Tab pattern: none here, but the day card header re-implements a row control (`p[role=button]`, 175x22) that no other page uses; every other page uses a real button.
- Card style: day card 16px/`--color-card`; add-day card dashed 1px accent border at 30% alpha; convert sheet 20px top corners — three card treatments where the system defines one.
- Accent: the convert sheet promotes `--color-info` to a second co-equal accent, against the one-accent rule.
- Icons: emoji `📝` and `➕` sit beside SVG stroke icons; the doc counts 65 emoji app-wide and targets 0.

## 7. Keep, fix, cut

- **Keep**: pressed feedback — 5/5 controls respond under 100ms, the only Apple-grade detail on the page.
- **Keep**: the day-card grouping model; the mental model (split → days → exercises) reads correctly at a glance.
- **Fix**: make Save the persistent primary (pinned bar) and turn Back into a real dismiss with an unsaved-changes confirmation; it currently discards silently at 22x27px.
- **Fix**: reordering — replace the 1.95:1 touch-only handle with a labelled 44px control and a visible drag state.
- **Fix**: the voice FAB must not cover Send (63% overlap); either inset the FAB or suppress it on input surfaces.
- **Fix**: the AI error state must say what failed; today an aborted worker call renders a normal question.
- **Cut**: the convert sheet's second accent and both ➕ emoji; make "Create New Split" the single primary.
- **Cut**: the "📝 Block" button's emoji and its 155x33 footprint; fold it into the Exercise picker.
