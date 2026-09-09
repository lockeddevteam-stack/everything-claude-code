# Design Audit — PR Vault (`PRHub` L29165)

Captures: `pr-vault-populated.png`, `-populated-detail.png`, `-detail-range.png`, `-empty.png`. Numbers measured by me on the harness (iPhone 15 Pro, dark) unless a baseline file is named.

## 1. Squint (8px blur) and 5-second test

Blurred `pr-vault-populated.png`: one orange bar burns through; the rest is nine grey slabs of identical size, radius and title position, with a faint blue mark repeating down the right edge. First the bar, second the slabs, third the blue column. **The winner is `LOG A PR WITHOUT A WORKOUT`**, the rarest action wearing the only primary styling. A reader guesses "somewhere to add a PR", not "my records".

## 2. Callouts (`pr-vault-annotated.png`; left panel list, right detail)

1. Accent bar: gradient plus a `rgba(249,115,22,.25/.22)` glow; 353×42, h<44.
2. Dimmed `1RM` chip: `opacity:.5` when no 1RM exists (L29496). Rendered pixels `#58585d` on `#232325` = **2.22:1**, the page's worst.
3. Its `—` shares 2.22:1 and is the only 1RM shown for 9 of 9 lifts.
4. `EST. 1RM` `#4186f6` on `#2c2c2e` = **3.96:1**, the only coloured number: the eye lands on the estimate, not the record.
5. Nine cards, identical 353×119.5, r16, same title style.
6. Back button 22×22.
7. Chart `<svg width:100% viewBox="0 0 120 120">` (L29558) renders 319px wide; `xMidYMid meet` letterboxes it to 120px, **62% dead width**.
8. Range chips 38.4×19; `90D` output byte-identical to `ALL`.
9. `1 REP MAX` card at `opacity:.5`: all three lines 2.65–2.71:1.

## 3. The chart as a chart

Polyline, 6 points, accent stroke. No axes, gridlines or y labels: `y = 110 − (e1−mn)/rg*100` rescales to the visible min/max, pinning the lowest point to the floor and the highest to the ceiling whatever the spread. X is `i*(vw−20)/(n−1)`, **index-based, not time-based**, while the corner labels are dates, so a 3-day and a 10-day gap draw the same. All a reader gets is `6 sessions` and `91.75 kg`, the latter in the header.

Range: `ALL` and `90D` return identical points and labels — two of three chips are a no-op on 6 weeks of seed. `30D` drops to 4 points, but the y rescale keeps the same amplitude, so **nothing in the shape signals the change** beyond the chip tint and `4 sessions`.

## 4. Measurements

Contrast, list view, by distinct style (74 nodes):

| style | fg / bg | ratio | verdict |
|---|---|---|---|
| 32/800 `PR VAULT` | #f5f5f7 / #0d0d0f | 17.83 | pass (req 3) |
| 14/700 name | #f5f5f7 / #1c1c1e | 15.63 | pass |
| 11/400 muscle | #a1a1aa / #1c1c1e | 6.64 | pass |
| 11/700 `6-8 REP` | #a1a1aa / #2c2c2e | 5.44 | pass |
| 14/800 record | #f5f5f7 / #2c2c2e | 12.8 | pass |
| 11/700 `1RM` op.45 | #58585d / #232325 | **2.22** | fail ×11 |
| 14/800 `—` op.45 | #58585d / #232325 | **2.22** | fail ×11 |
| 14/800 est. 1RM | #4186f6 / #2c2c2e | **3.96** | fail ×9 |
| 16/800 button | over gradient | unknown | unknown |

**42/73 known nodes pass = 57.5%.** Detail adds 4 failures at 2.65–2.71 and `≈` at 4.26; 27/32 = 84%. `contrast.json` logged only the nine 3.96 nodes: it composites background but not inherited `opacity`, missing the worse one. The Wave-1 claim holds three ways — axe 2.21, my pixel read 2.22, computed style 2.35.

Targets: list 10/12 (Back 22×22; accent button 353×42); detail 0/5 (Back 22×27; three chips 38.4×19; `Log New PR` 353×42). **Page 10/17 = 58.8%.** `targets.json` (18 nodes, 2 under) walked the list only.

Spacing (non-zero longhands, shell excluded): list 71.3%, detail 62.5%, **page 214/309 = 69.3%**; off-grid 6px ×54, 1px ×9, 14/9/3px ×6 each; no breaks documented.

Type: 9 sizes (9–16, 26, 32); weights 400/600/700/800, with 800 on 14px and 700 on 10/11px labels; 12 unpaired line-heights; `font-variant-numeric: normal` throughout.

Motion: real `mouse.down` read at 100ms — 5/5 change (accent button, card, Back, input, range chip; `scale(.97)` except the input's `.8→.89` alpha). Two transition rows (`.24s ease` ×51, a 6-prop `.3s` ×1), zero `animation-name`, nothing decorative; no `:disabled` rule in L29165–30580. Dark: L* 0 → 10.3 → 18.1, strictly increasing; one accent glow.

## 5. Rubric — Design

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 3 | squint: one dominant element, but it is the tertiary action; 9 identical 353×119.5/r16 cards |
| Typography | 1 | 9 sizes, 800 on 14px, 700 on 10/11px labels, 12 unpaired line-heights |
| Spacing | 2 | 214/309 = 69.3% on grid; 6px ×54 |
| Contrast | 1 | 42/73 = 57.5%; worst 2.22:1 (`1RM` chip), then 3.96:1 |
| Component consistency | 1 | 8 radii (7–16); 3 chip variants; card r16 vs r14 |
| Targets | 1 | 10/17 = 58.8%; all 5 detail controls fail |
| Motion and feedback | 5 | 5/5 press-change at 100ms; 2 caused transitions; zero animations |
| HIG fit | 1 | Buttons (42px primary, 19px chips, glow), Typography (9 sizes), Layout (62% dead chart width): 3 sections |
| AI-look penalty | 2 | 3 tells: gradient+glow button, mixed radii, 9 equal-weight cards |
| Accessibility | 2 | `axe.json`: `color-contrast` serious ×6 nodes (31 in fact) plus `meta-viewport` critical (caps at 3); 120% clips only the Back icon |

**Design mean 1.9.**

## 6. Detail checklist — 2/11

| # | verdict | measurement |
|---|---|---|
| 1 | pass | 5-s test names it; one accent-filled control. Shortfall: wrong action |
| 2 | fail | 9 sizes, 12 line-heights |
| 3 | fail | 69.3% on grid |
| 4 | fail | 5/5 press at 100ms, but no `:disabled`/`aria-disabled` rule |
| 5 | pass | 2 transitions, both caused; 0 animations; 0 decorative |
| 6 | fail | empty = `No PRs yet`: 3 words, no instruction, no action control; error N/A per index.md |
| 7 | fail | `font-variant-numeric: normal` on every numeral; units adjacent, dates correct |
| 8 | fail | one stroke weight 1.8, zero emoji, four optical sizes: 22/17/16/15 |
| 9 | fail | no horizontal overflow (393/393), but 7 targets under 44 |
| 10 | fail | L* ladder correct, but an accent glow on the primary button |
| 11 | fail | `LOG A PR WITHOUT A WORKOUT` = 6 words; no exclamations |

## 7. Consistency deltas vs `design-system-current.md`

- **Tab pattern**: the range control (r7, pad `3px 9px`, 10px/700, `OR_H+"15"` fill) matches none of patterns A–E (§12.2) — a sixth segmented implementation.
- **Reach**: entry is pattern B, the Progress pill strip. Measured `clientWidth` 353, `scrollWidth` 448, `scrollLeft` 0; the `PR Vault` tab sits at x 381.7–468.4 — **visible fraction −0.1: no pixels on screen, no scroll affordance, no fade**. The Progress auditor's finding reproduces; this page is reached only by dragging a strip that gives no sign it scrolls.
- **Radii**: 8 values on one page; card r16 (list) vs r14 (detail) for the same role.
- **Icons**: one stroke weight (1.8) but z = 22/17/16/15, none from a scale.
- **Accent**: two accents — orange for the action, `--color-info` blue for the estimate; the blue is the failing one.

## 8. Keep, fix, cut

- **Keep**: the three-fact card (record / rep-band best / estimate) answers "what can I lift" in one row; 5/5 pressed feedback.
- **Fix**: the `opacity:.5` dimming (2.22:1) and the blue estimate (3.96:1); the chart — labelled y ticks, date-proportional x, no letterboxing; every sub-44 target.
- **Cut**: the `90D` chip; the accent glow; the full-width `LOG A PR WITHOUT A WORKOUT` bar as the loudest thing on screen — it belongs in the toolbar, so the records win the squint.
