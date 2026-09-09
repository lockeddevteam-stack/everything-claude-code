# Design audit — Train Hub (`train-hub`)

Captures: `00-inventory/screenshots/current/train-hub-{populated,populated-full,populated-scrolled-3,populated-history,empty}.png`, `exercise-library-populated.png`. Numbers: `tests/baseline/{targets,contrast,axe}.json` and my Playwright dumps, 393×852 dark, populated seed.

## 1. Squint and 5-second test

8px blur of `train-hub-populated.png`: three masses survive at equal weight — the white **TRAIN** wordmark (32px/800), the filled orange **Quick Start** pill, the orange **mic FAB**. Everything below dissolves into one grey slab. First TRAIN, second Quick Start, third the FAB; read as "a list of my workout programs."

**Answer to the page question: no.** Quick Start wins among actions but does not start today's session — that is `Start day` (86×24, smallest of 33 targets) or split-card `Start` (164×39), and both vanish under the blur. The only accent-*filled* control starts an *unplanned* session; the planned path is accent-*outlined* text, two taps behind a chevron.

## 2. Callouts

`train-hub-annotated.png`; full legend printed on the image. 1 Quick Start · 2 underline sub-tabs · 3 Start-day chip · 4 footer Start · 5 footer Delete · 6 clipped RECENT carousel · 7 AI Builder/New · 8 chevron · 9 Adaptive chips · 10 emoji FAB + glow · 11 absolute date, 2 days old.

## 3. Measurements

**Targets** (`targets.json`, min 44): 33 total, **19 under 44×44 — 42.4% pass**. Every failure is height, never width: `Start day` 86×**24** ×3 · `Quick Start` 107×34 · `Cardio` 88×34 · `AI Builder` 99×33 · `New` 70×33 · sub-tabs 118×**42** ×3 · footer `Start`/`Edit`/`Delete` 164/94/93×**39** ×3. Root `scrollWidth` = `clientWidth` 393; RECENT is a labeled carousel.

**Contrast** (`contrast.json`): 97 checked, **97 pass, 0 fail, 2 unknown** — `Quick Start`'s label and the FAB glyph sit on gradients: unknown, not passing. One is the primary action.

**Spacing** (non-zero padding/gap/margin longhands, page scope, nav + FAB out): 474 values, **328 on {4,8,12,16,24,32} = 69.2%**, no breaks documented. Off-grid: `5px` ×96 (the chip's `5px 11px`), `10px` ×18, `11px` ×16, plus 16 others.

**Typography**: 6 sizes — 32/15/14/13/12/11; weights 400/600/700/800 with **37 visible nodes at 700 ≤13px**; `line-height: normal` on 5 of 11 size/lh pairs; `tabular-nums` on **0** elements though 14363 kg, 16 sets and ~53h are figures. **Radii**: 8, 9, 10, 11, 12, 14, 16, 999.

**Pressed** (real `mouse.down()`, read at 100ms): Quick Start `transform` ✓ · History tab `transform`+`box-shadow` ✓ · footer Start same ✓ · footer **Delete none** ✗ · **Start day none** ✗ — 3 of 5.

**Motion inventory**: animations `cardRise 0.5s`, `pillIn 0.45s` — entrances, decorative. Transitions `background-color, box-shadow .24s` ×60, `transform .25s` ×3, `max-height/opacity/visibility .4s` ×3 (expand), 2 singletons — all caused.

**Dark**: body L\* 0.0 → card `#1C1C1E` 10.3 → nested `#2C2C2E` 18.1, strictly increasing — but Quick Start and the FAB carry `rgba(249,115,22,0.25) 0 2px 6px, rgba(249,115,22,0.22) 0 8px 22px`, an accent glow. **axe**: 1 violation, `meta-viewport` (critical, shell), 16 passes.

## 4. The split card as a component

Header (icon, name, meta line, chevron), optional day list, then a **three-cell footer: `Start` | `Edit` | `Delete`** — all 39px tall, 13px, radius 0, transparent, one equal-weight row. `Start` is `#FB923C` at 700, `Delete` `#F05151` at **400**: the destructive action is *lighter* than the primary, and hue is the only separator. Under the blur, or with a red-green deficit, cells 1 and 3 are indistinguishable, `Delete` sits on the outer edge where a thumb lands, and it has no pressed state to warn on a mis-tap.

The page also carries **three "start" idioms**: `Quick Start` (gradient pill, r14, 14px/700), `Start day` (tinted chip, r999, 11px/700, 86×24), footer `Start` (text, r0, 13px/700, 164×39).

## 5. Rubric — Design (mean 2.0)

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 2 | 8px blur of `train-hub-populated.png`: TRAIN, Quick Start and the FAB survive at equal weight; 11 further accent controls compete; the semantic primary (`Start day` 86×24) disappears. |
| Typography | 3 | 6 sizes; line-height unset on 5 of 11 pairs; 700 on 37 nodes ≤13px. `-populated-full.png`. |
| Spacing | 2 | 328/474 = 69.2%, undocumented. Band 2 = 60–79%. |
| Contrast | 4 | 97/97 known pass, 0 fail; 2 unknown over gradients — one being the primary action's own label. |
| Component consistency | 1 | 3 "start" variants (r14 pill / r999 chip / r0 row); 8 radii. `-populated-full.png`, `-scrolled-3.png`. |
| Targets | 1 | 14/33 = 42.4% ≥44px, band 1 (<75%); `targets.json`. |
| Motion and feedback | 2 | 3 of 5 pressed (base 3); decorative `cardRise`/`pillIn` entrances → −1. |
| HIG fit | 1 | 3 sections: Buttons (destructive equals primary, `-scrolled-3.png`); Tab bars (no `role=tablist`; Library navigates away, `exercise-library-populated.png`); Layout (19/33 under 44px). |
| AI-look penalty | 1 | 4 tells: emoji icon (🎙️ FAB), 8 mixed radii, gradient + glow button, stacked equal-weight split cards. |
| Accessibility | 3 | 1 critical `meta-viewport` (shell) caps at 3; focus order = DOM = visual; sub-tabs expose no `aria-selected`; three identical "Delete" names carry no split context. |

## 6. Detail checklist — 1 / 11

| # | Item | Verdict | Measurement |
|---|---|---|---|
| 1 | Primary action obvious | fail | 2 accent-filled elements (Quick Start, FAB); 5-sec test names Quick Start, not `Start`. |
| 2 | Type scale | fail | `line-height: normal` on the 14/13/12/11px variants (5 of 11 pairs). |
| 3 | 8px grid | fail | 69.2% (328/474) vs 95%. |
| 4 | Control states | fail | `Delete` and `Start day` unchanged at 100ms under real `mouse.down()`. |
| 5 | Meaningful motion | fail | `cardRise 0.5s`, `pillIn 0.45s` — load entrances. |
| 6 | Empty/error copy | fail | `train-hub-empty.png` has **two** action controls (Build Manually, AI Split Builder); rule is one. Error N/A. |
| 7 | Numbers | fail | 0 `tabular-nums`; "9/7/2026" absolute at 2 days old, beside "Sep 6". |
| 8 | One icon set | fail | 1 emoji (🎙️) as the FAB icon. |
| 9 | Scroll and targets | fail | 19/33 under 44×44; no root overflow. |
| 10 | Native dark | fail | L\* 0.0 → 10.3 → 18.1 ✓, but accent glow on Quick Start and the FAB. |
| 11 | Copy | **pass** | Labels ≤4 words; 0 exclamation marks in innerText; no filler. |

## 7. Consistency deltas vs `design-system-current.md`

- **A sixth tab idiom.** §12.2 lists A `DsSegmented` (r10/7), B ProgressPage pills (r20), C ShoppingBudget (r12/9), D CoachScreen (r12/9), E r999 chips, F nav. Train Hub's sub-tabs match none: `flex:1`, `padding 12px 0`, **radius 0**, no container fill, selected = `2px solid #F97316` bottom border + `#FB923C` 600 (L15375–15391). It is the only underline bar, the only one with no container and no radius, and it skips the `role=tablist`/`aria-selected` A alone has. The screen also uses idiom **E** (r999, L15751) for `Start day` and the Adaptive chips.
- **Radii** 8 here vs 30 app-wide: card 12/14/16, chips 999, `New` 8, strays 9 and 11. **Cards**: split cards `#1C1C1E` r16 with `0 1px 2px / 0 6px 20px rgba(0,0,0,0.18)`; History rows share the fill with no shadow — one object type, two elevations. **Accent**: 12 accent-coloured controls in one viewport, so it no longer signals "primary". **Icons**: 14/16/22px plus one emoji.

## 8. Keep, fix, cut

- **Keep**: the underline sub-tab row — the app's clearest tab affordance; it needs only 44px height and tablist semantics.
- **Fix**: make split-card `Start` the filled primary at ≥44px and pull `Delete` out of that row — today they are 39px siblings separated by hue, `Delete` at the lighter weight.
- **Cut**: `Quick Start` or the `Start day` chips — three "start" idioms, and the loudest is the least likely intent.

## After reading the function audit

No score changes. One disagreement: its §7 reads the empty state as "one action", but `train-hub-empty.png` shows **two**, so my checklist 6 still fails — a design rule, not a function defect. It names a motion defect I did not measure (the day panel collapses with `visibility 0s linear .4s`, L15697–15705, leaving `Start day` un-hittable for 400ms), which reinforces Motion 2 without moving it. We reached "demote Quick Start" independently.
