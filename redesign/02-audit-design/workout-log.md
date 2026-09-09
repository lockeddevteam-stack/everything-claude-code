# Design audit — Workout Log

Evidence: `00-inventory/screenshots/current/workout-log-*.png`, `tests/baseline/scans/workout-log.json`, and my own Playwright pass (393x852 @2x, dark). Callouts key to `workout-log-annotated.png`.

## 1. Squint and 5-second test

8px blur of `workout-log-populated.png`: four orange blobs survive — **Finish** (top-right), the **voice FAB** (bottom-right), two **done checks** (right rail), the dashed **Add Exercise** band. The set rows blur to one flat grey slab, and the live set (3, undone) is the *dimmest* region on screen. **Finish wins the squint — the button that ends the workout.**

Five seconds: Finish, the FAB, then a grey table of numbers — "a workout table with a big orange End button". The primary act carries no visual weight: three 33px cells and a 32x30 check, less ink than a decorative microphone.

**One-handed read.** Green arc = right-thumb reach. Inside it: dead space, the FAB, the tab bar. Outside it: Finish (y=64), Discard (y=65), tools (y=59) — the toolbar is a grip change. The per-set commit sits on the right rail at y=231/327/423, at the arc's top edge, 32px wide. The one well-placed control is the numpad DONE (231x44, y=788): the keypad is the best surface here, and the design treats it as a subordinate sheet. CANCEL at x=12–142 is a cross-screen stretch beside that commit.

## 2. Sheets and keypad

Numpad at 30/120/400ms after tap: `y=401`, `animation-name: none`, transform unchanged. It **snaps in**, never rising from the tapped cell; square top corners, no grabber. Keys 118x60, ±2.5/±5 chips 86x32. The exercise action sheet (`-action-sheet.png`) is a top-aligned full-screen list, not a bottom sheet, colouring rows orange/amber/green/red/white — five accents in eight rows. Tools (`-tools.png`) is a third pattern, a popover under the header. Three geometries for three sibling menus; tools says "Switch to LBS", the sheet "Switch to kg".

## 3. Measurements

Type (sheets in): 10 sizes — 11, 12, 13, 14, 15, 16, 20, 21, 22, 40px; 11px carries 29 of 78 nodes. Weights 400/600/700/800. Leading `normal` on 20 of 44 nodes; 11px runs three leadings. 0 of 13 numeric nodes are tabular.

Spacing: 134/154 non-zero padding/gap/margin longhands on {4,8,12,16,24,32} = **87.0%** (tab bar and FAB excluded). Off-grid: 2px x11, 20px x4, 3px x2, 1, 58, 160, none documented.

Targets (`scans/workout-log.json`): 31 interactive, **22 under 44x44 = 29% pass**. Worst: set index 20x12, partials 26x44, done check 32x30, cells 109x33, Finish 79x34.

Contrast: 32 nodes checked, 32 pass, 0 fail, **1 unknown** (FAB emoji over a gradient; unknown, not passing).

Radii 1/6/7/12/14/16px plus the pill FAB. Shadows: two achromatic card shadows plus the FAB's `rgba(249,115,22,.22) 0 8px 22px` glow. Surfaces L* 0.0 → 2.2 → 18.1, strictly increasing. `scrollWidth 393 = clientWidth`.

Pressed (real `mouse.down`, read at 100ms): Finish, Set 3 weight, Mark set 3 done, Add Set, Workout tools, numpad DONE all take `scale(0.97)` + shadow — **6/6 changed**. `button:disabled{opacity:.4}` present. At rest: `jiggle 0.45s infinite` on the exercise header.

## 4. Rubric scores (Design)

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | 8px blur of `-populated.png`: 4 accent blobs (Finish, FAB, 2 done checks, Add Exercise); the un-logged set is the dimmest area and the loudest control ends the workout. |
| Typography | 2 | 10 sizes with sheets in (11–40px); leading unset on 20/44 nodes; 700+ only on caps labels, numbers and titles, so 2 not 1. `-populated.png`, `-numpad.png`. |
| Spacing | 3 | 134/154 = 87.0% on grid; off-grid 2px x11, 20px x4, 58, 160, undocumented. `-populated.png`. |
| Contrast | 4 | 32/32 measured nodes pass; one unknown (mic emoji over gradient, `-populated.png`) is the single cited exception. |
| Component consistency | 2 | One card implementation carries every set row, but with heavy overrides: 3 overlay patterns (`-tools`, `-action-sheet`, `-numpad`), 4 add-button styles, 6 radii, 2 contradictory unit switches. Borderline 1. |
| Targets | 1 | 9/31 = 29% meet 44x44, far below the 75% floor; done check 32x30, cells 109x33. `scans/workout-log.json`. |
| Motion and feedback | 4 | Base 5 (6/6 pressed at 100ms), −1: `jiggle 0.45s infinite` on the exercise header is decorative and the numpad appears with no transition rather than rising (`-numpad.png`). |
| HIG fit | 1 | 3 sections: Sheets (no grabber, no rise, square corners; action sheet full-screen), Buttons/Layout (toolbar and commit out of thumb reach, 29% of targets ≥44), Typography. `-numpad.png`, `-action-sheet.png`. |
| AI-look penalty | 2 | 3 tells: emoji as icon (🎙️ FAB), mixed radii (6 on one screen), decorative gradient + glow on the FAB. `-populated.png`. |
| Accessibility | 3 | 1 axe violation, `meta-viewport` (critical, global shell), which caps at 3; all 31 controls labelled; 120% untested. `scans/workout-log.json`. |

**Design mean 2.4.**

## 5. Detail checklist — 2/11

| # | Verdict | Measurement |
|---|---|---|
| 1 | FAIL | 3 solid accent fills plus a gradient FAB; the 5-second test names Finish. |
| 2 | FAIL | 10 sizes; line-height `normal` on 20/44 nodes. |
| 3 | FAIL | 87.0% on grid; breaks undocumented. |
| 4 | **PASS** | 6/6 controls change at 100ms under real press; `button:disabled{opacity:.4}` exists. |
| 5 | FAIL | `jiggle 0.45s infinite` decorative; numpad has no entry motion. |
| 6 | FAIL | Error copy correct ("Could not get a recommendation. Check your connection and retry."); empty state carries two action controls (Add Exercise, + Block). |
| 7 | FAIL | 0/13 numerals tabular; header "1088 kg" over an "LB" table. |
| 8 | FAIL | 1 emoji (🎙️); icon optical sizes vary (bolt 44, drag handle ~18, sheet ~22). |
| 9 | FAIL | No horizontal overflow (393=393); 22/31 targets under 44. |
| 10 | FAIL | L* strictly increases; the FAB carries an accent glow shadow. |
| 11 | **PASS** | Labels ≤3 words, no exclamation marks, no filler. |

## 6. Consistency deltas vs `design-system-current.md`

Six radii against the app's 24 (target 4). The exercise card computes to `rgb(8,8,9)`, L* 2.2, darker than the `--color-card #1C1C1E` used elsewhere: this page invents its own card. The single accent covers five roles (commit, glow, tint, dashed border, chip). Icon size unbounded; the tools popover uses a `KG` text badge where siblings use glyphs. No tab pattern on-page, but three overlay patterns is that defect one level down.

## 7. Keep, fix, cut

- **Keep**: the numpad key grid — 118x60 keys, 231x44 DONE at y=788, all inside the thumb arc; the only well-placed surface measured.
- **Fix**: invert the weight map — the live set and its commit become the largest, brightest, thumb-reachable object; Finish and Discard go quiet and leave the corner.
- **Cut**: the voice FAB (emoji, gradient, accent glow, 50x50 holding the best thumb real estate) and the `jiggle` loop.

## After reading the function audit

Read after the above was written. Its Speed 1 (15 taps per set, 5 of them DEL against a pre-filled pad) and Data correctness 1 (kg/LB conflict) confirm what I found visually. **No design score revised.** One explicit disagreement: it reads the empty state as "one instruction, one action"; `workout-log-empty.png` shows two action controls (Add Exercise, + Block), so checklist 6 stays FAIL. Its NumPad finding sharpens my Keep — the pad's geometry is right, its behaviour is not.
