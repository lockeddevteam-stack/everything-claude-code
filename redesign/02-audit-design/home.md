# Design audit — Home (`home`)

393x852 @2x, dark, populated seed. Scroll height 1688px, content viewport 781px, tab bar 71px. **907px (54%) is below the fold.**

## 1. Squint + 5-second test (16px Gaussian on `home-populated.png`)

Winner: **START WORKOUT**, the only saturated orange mass, 353x53 at y659. Second: seven grey rectangles above it, blurring into one block. Third: two orange dots (avatar y58, mic FAB y720).

The win is late and contested: the primary begins at y659 of a 781px window — **84% down the fold**, after 534px a user cannot act on. The mic FAB (50x50, same `135deg` accent fill) sits at y720 and **overlaps VIEW PROGRESS**, so the squint shows two orange blobs touching.

5-second read: "a stats dashboard that also has a start button." The eye lands on `Cesco` (32px/800) and four 30px/800 numerals that are **not interactive** (0 of 4 stat cards in the 20-item inventory) — the heaviest type on the page is inert.

One-second question: **no.** Identity and history come first, intent last.

## 2. Vertical cost vs return

Blocks, top y → height (px), share of the 781px fold, controls returned:

1. Greeting + avatar, 0 → 125, 16.0%, 1 control.
2. **2x2 stat grid, 125 → 179, 22.9%, ZERO controls.**
3. Quick actions, 304 → 94, 12.0%, 3.
4. YOUR FEED (readiness + up-next), 398 → 261, 33.4%, 4.
5. **START WORKOUT, 659 → 69, 8.8%, 1.**
6. VIEW PROGRESS, 728 → 52, 6.7%, 1, FAB overlapping.
7–10. Below the fold: Weekly Recap 50, calendar 338, Recent Workouts 408, cycle row 74 = 907px, 8 controls.

304px (39% of the fold) precedes any control that changes what the user does. The calendar costs 338px and exposes zero interactive cells.

## 3. Measurements

**Contrast** (`scans/home.json`): 92 checked, 92 pass, 0 fail, **5 unknown**, all over gradients — greeting, "Cesco", avatar, **"START WORKOUT"**, FAB. The primary's label is unmeasurable, not passing.

**Targets**: 20 interactive, **4 under 44x44 = 80%** (sizes in §4). `scrollWidth 393 = clientWidth 393`, no horizontal overflow.

**Spacing**: 207 non-zero longhands (nav + FAB excluded), 53 off-grid = **74.4%**. Off-grid: 20px x20, 2px x18, 1px x11, 14px x3, 58px x1.

**Typography**: **12 sizes**: 11, 11.5008, 12, 13, 14, 15, 17, 18, 20, 24, 30, 32; weights 400/600/700/800; **6 at `line-height:normal`**; 700+ on text ≤15px on 12 nodes (`TOTAL WORKOUTS` 12/700, `Water +250` 11.5/700, `LOG` 13/800).

**Pressed** (real `mouse.down` at 100ms): START WORKOUT, VIEW PROGRESS, Water +250 and See all take `scale(0.97)`. **Recent-workout row: no change** (unstyled div). 4/5. `button:disabled{opacity:0.4}` exists.

**Numerals**: tabular-nums on **0 of 35** numeric nodes; a 1-day-old workout dated "9/8/2026".

## 4. Rubric scores (Design)

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 3 | Squint on `home-populated.png` shows one dominant orange bar, but the heaviest type (four 30px/800 numerals) is non-interactive and the FAB repeats the primary's fill over it. |
| Typography | 1 | 12 sizes; 700/800 on 11.5–12px running labels; 6 at `line-height:normal`. |
| Spacing | 2 | 53/207 off-grid = 74.4% (band 60–79%). |
| Contrast | 4 | 92/92 pass, 0 failures; 5 unknown over gradients incl. the primary's label, so 100% is not demonstrable. |
| Component consistency | 1 | Three page-action buttons, three treatments: gradient 18/800, accent outline 15/700, muted outline 14/600. 8 radii on one screen. |
| Targets | 2 | 16/20 = 80% (band 75–89%): See all 58x25, LOG 60x33, Up next 243x38, Weekly Recap 353x42. |
| Motion and feedback | 2 | 4/5 pressed (base 3); `pillIn .35s both` runs on mount on the Mood chip = load animation, decorative, −1. |
| HIG fit | 1 | 3 sections: Layout (FAB occludes VIEW PROGRESS), Buttons (accent glow `0 8px 22px rgba(249,115,22,.22)` on 2 controls, 3 stacked full-width buttons), Typography (12 sizes, 800 on 11.5px). |
| AI-look penalty | 1 | 5 tells: gradient hero + orange glow; 7 emoji icons; 8 radii; 7 stacked equal-weight cards; template copy ("Good evening, Cesco", "Feeling okay — train smart today."). |
| Accessibility | 3 | axe: 1 violation, `meta-viewport` (critical, caps at 3); all controls labeled; 120% text untested. |

**Design mean: 2.0**

## 5. Detail checklist — 0/11

| # | Item | Verdict | Measurement |
|---|---|---|---|
| 1 | Primary obvious | FAIL | 2 accent-gradient-filled controls (START WORKOUT, mic FAB); primary starts at 84% of fold depth. |
| 2 | Type scale | FAIL | 12 sizes vs 6; 6 at `line-height:normal`. |
| 3 | 8px grid | FAIL | 74.4% on grid. |
| 4 | Control states | FAIL | Recent row unchanged at 100ms (4/5). |
| 5 | Meaningful motion | FAIL | `pillIn .35s both` plays on mount = decorative; no insertion animation on a growing list. |
| 6 | Empty/error copy | FAIL | `home-empty.png`: 8 action controls, not one, plus "999 days since your last session". `home-error.png` renders no error UI. |
| 7 | Numbers | FAIL | 0/35 numeric nodes tabular; 1-day-old workout dated "9/8/2026". |
| 8 | One icon set | FAIL | 7 emoji beside a stroked line set. |
| 9 | Scroll and targets | FAIL | No h-overflow; 4 targets under 44. |
| 10 | Native dark | FAIL | Surfaces increase (#000 → #1C1C1E → #2C2C2E), but `0 8px 22px rgba(249,115,22,.22)` is an accent glow on 2 controls. |
| 11 | Copy | FAIL | 0 exclamations, labels ≤4 words, but 2 filler sentences in the inventory. |

## 6. Consistency deltas vs `design-system-current.md`

- **Accent gradient.** The system's most common gradient is `linear-gradient(135deg, accent-deep, #9A3412)`: 66 occurrences, ~82% of 146 gradients decorative. Home paints 5 gradient elements — **2 of those 66 button fills** (START WORKOUT, mic FAB), the avatar, and two accent scrims (393x125 top tint; 393x150 glow at y702). Only 3% of that fill's stock lands here, but CSSARR uses `button[style*='linear-gradient']` as the *primary-button selector*: spending it twice on one screen, once on a mic, destroys the signal.
- **Radii.** System: 30 literals remapped to 12/14/16/24. Home renders 8 (6px x30 calendar cells, 9 x5, 10 x5, 14 x4, 16 x16, 50% x7).
- **Card style.** 15 elements hit the CSSARR 16px card; calendar cells (6px) and pills (9/10px) do not.
- **Icons.** Emoji 24px, line icons 20px, tab icons 22px — three optical sizes. Tab pattern matches the shell.

## 7. Keep, fix, cut

- **Keep:** the START WORKOUT / VIEW PROGRESS pair — `scale(0.97)` at 100ms, the only block stating intent.
- **Fix:** raise the primary above y200, reserve the accent gradient for it alone, and stop the FAB overlapping controls (y720–770 over a button ending y780).
- **Cut:** the stat grid (179px, 22.9% of fold, zero controls) and the calendar (338px, no tappable cells).

## After reading the function audit

`01-audit-function/home.md` reaches the same block map and the same 534px of read-only material before the primary at y659, arrived at independently. **No score changes.** Two notes:

- It reports `clientHeight` 588 where I measured 781. That is chrome, not layout: at 588 the primary is fully off-screen rather than 84% down.
- It confirms callout 6 as a functional blocker, not only aesthetic — the FAB `intercepts pointer events` over the cycle LOG, hardening the HIG Layout violation.
