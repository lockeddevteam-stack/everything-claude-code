# Design Audit — Progress (`progress`)

Evidence: `screenshots/current/progress-*.png`, `baseline/scans/progress.json`, own Playwright runs.

## 1. Squint and 5-second test

8px blur on `progress-populated.png`: two objects survive — the filled orange **Overview tab pill** and the global voice FAB. Next the green PR column, then three grey slabs of equal mass. `ADD LIFT`, the page's only action, blurs dimmer than the pill. **The winner is a navigation control.** In 5 seconds a user reads PROGRESS, then "I am on Overview", then three lift cards, and calls the page "three lifts and their records" — never seeing the goals, calendar, photos and PR vault it owns.

## 2. Callouts

`progress-annotated.png`, markers 1-8, legend on image.

## 3. Measurements

**Tab strip.** Container `clientWidth` **353px** (`overflow-x:auto`, gap 8); content = 5 tabs (91.8+70.1+89.6+78.1+86.8) + 4 gaps = **448.4px**, `scrollWidth` 448 — **127% of container, 95px (21%) off-screen at rest**. Right edges: Overview 111.8, Goals 190, Calendar 287.6, Photos **373.7**, PR Vault 468.4; container edge 373. **Three tabs fully visible, Photos clipped 0.7px, PR Vault clipped 86.8px = 100%**, with no chevron, mask, peek or indicator. A tab bar is not a labelled carousel, so **item 9 fails on scroll as well as targets**. Root `scrollWidth` 393 = `clientWidth`: the page-level check passes and hides it.

**Contrast.** `scans/progress.json`: 37 checked, 37 pass, 0 fail, **6 unknown ("gradient")**. I resolved all six by pixel-sampling `progress-populated.png`: unselected tab 7.23:1, `PROGRESS` 20.12:1, selected tab on `#c2410c` **5.18:1**, PR green 7.47:1, `#fb923c` 7.52:1. **43/43 = 100%.**

**Targets.** 16 controls, **7 under 44x44 (56% pass)**: Back 22x27, five tabs 33 tall, month arrows 34x39.

**Spacing.** Non-zero padding/gap/margin longhands, full page, nav and FAB out: 114 values, **101 on {4,8,12,16,24,32} = 88.6%**. Off-grid 2 x6, 20 x6, 58 x1, undocumented.

**Typography.** Distinct visible sizes: Overview 8 (32/22/20/18/14/13/12/11), Goals +15, Calendar +17 = **10**. Weights 400 x12, 600 x5, 700 x21, 800 x9, with 700/800 on 11px caps and 13px tabs. `line-height: normal` at 13, 20, 14px.

**Numbers.** 19 numeric nodes, **0 `tabular-nums`**; units adjacent. Three date formats (`7/30/2026`, `2026-07-28`, `Due: 2026-12-01`), all absolute, one 1 day old.

**Motion.** Real `mouse.down`, 100ms read: `ADD LIFT`, tab Goals, Back, unpin-x, `NEW GOAL`, month arrows — **7/7 change** (scale .97 + shadow); `button:disabled{opacity:.4}` exists. **Zero `animation-name`**; 30 transitions, all caused, none decorative or an insertion.

**Dark.** L* body 2.2 -> card 10.3 -> nested panel 18.1, strictly increasing; zero white-on-black text. Shadows: two achromatic (blur 24, 20), one **accent glow** `rgba(249,115,22,.25) 0 8px 22px`. Border `#f97316` (L* 63.7) on L* 2.2, +61.

**Accessibility.** axe: 1 violation, `meta-viewport` (critical, shell), 18 passes. Tabs carry `role=tab`/`aria-selected`. Calendar day cells are plain 47x47 `div`s, no role — the month is unreachable by keyboard. At 120% text, no clipping, no root overflow.

## 4. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | Squint on `progress-populated.png`: winner is the Overview pill, `ADD LIFT` blurs dimmer. One accent-filled element, not an action; three identical cards. |
| Typography | 1 | 10 sizes across `progress-populated`/`-goals`/`-calendar`; 700 x21, 800 x9 on 11px caps; line-height unset at 13/14/20. |
| Spacing | 3 | 101/114 = 88.6%, undocumented. Band 80-94%. |
| Contrast | 5 | 37/37 pass; 6 gradient-unknowns pixel-sampled to 5.18-20.12:1. 43/43. |
| Component consistency | 1 | Tab pattern B unique to this page against 4 others; 11 radii; SVG icons on Overview vs emoji on Goals; cards 16 vs 14 (`-populated`, `-goals.png`). |
| Targets | 1 | 9/16 meet 44px = 56%; Back 22x27, tabs 33 tall, arrows 34x39. |
| Motion and feedback | 5 | 7/7 change within 100ms under real press; zero animations; every transition caused. |
| HIG fit | 1 | 3 sections violated (`-populated.png`, `-calendar.png`): Tab bars (tab 5 off-screen, 33px tall), Layout (7 controls <44px), Typography (800 at 11px). |
| AI-look penalty | 1 | 4 tells: emoji icons (`-goals.png`), stacked equal-weight cards, mixed radii (11), decorative gradient washes. |
| Accessibility | 3 | axe 1 critical (`meta-viewport`) caps at 3; calendar cells unlabelled; 120% clean. |

**Design mean 2.3.**

## 5. Detail checklist — 2/11

| # | Verdict | Measurement |
|---|---|---|
| 1 | FAIL | Squint winner is the Overview pill; `ADD LIFT` is dashed 353x42. |
| 2 | FAIL | 10 distinct sizes; line-height unset at 13/14/20px. |
| 3 | FAIL | 88.6% on grid, under 95%. |
| 4 | PASS | 7/7 change transform + box-shadow at 100ms; `button:disabled` rule exists. |
| 5 | FAIL | Zero decorative rows, but zero `animation-name`: Featured Lifts and Goals grow with no insertion. |
| 6 | FAIL | `-empty-goals.png` has two action controls (`NEW GOAL`, `Body Fat Log`) and an emoji; `-empty.png` is the populated layout with "--". Error copy is correct. |
| 7 | FAIL | 0/19 nodes `tabular-nums`; three date formats, all absolute, one 1 day old. |
| 8 | FAIL | SVG icons at 4 widths (22/20/16/11) plus 3 emoji on Goals. |
| 9 | FAIL | 448px strip in a 353px container, not a carousel, tab 5 100% clipped; 7/16 under 44. |
| 10 | FAIL | L* ramp and white-on-black pass; one accent-glow shadow (FAB), one `#f97316` border +61 L* over its surface. |
| 11 | PASS | Labels <=4 words; zero exclamations; empty copy 18 words, one instruction. |

## 6. Consistency deltas vs `design-system-current.md`

- **Tab pattern.** Progress is §12.2 pattern **B** (`ProgressPage` 28611): no track, radius **20**, pad `8px 16px`, 13px/600, selected = solid `OR` + white. A (`DsSegmented`) has a track, radius 10/7, 13px/500; C (Shopping) track 12 / item 9 / 700; D (Coach) track 12 / item 9 + dot. Progress alone has no container, alone uses radius 20, alone carries 5 items, and is **the only one that can overflow**: A, C and D split a fixed track and cannot clip.
- **Radii** 11 on one page (app 30, target 4). **Cards** 16 / 14 / 8. **Icons** two systems, four sizes. **Accent** three orange tints plus green and blue.
- **One system does not cover both densities.** Goals is three 84px cards, 18px titles, 20px percentages. Calendar is a 42-cell 47x47 grid at 17px with an 11px four-colour legend, adding a fourth tile radius (8) and two accent tints, then ~600px of empty black. They share only the tab strip and gutter; Calendar borrows nothing from the card language and is the only sub-tab with no action.

## 7. Keep, fix, cut

- **Keep**: the PR delta pattern — DAY 1 -> CURRENT PR with a signed `+12.5kg` survives the 8px blur, the one place where weight matches importance.
- **Fix**: the tab strip — 448px in 353px, tab five 100% hidden. Five destinations do not fit one row at 44px targets: this needs a list or a second level.
- **Cut**: the dashed outline on `ADD LIFT`/`NEW GOAL` (`#f97316`, +61 L*) — it makes the primary action read as a placeholder.

## 8. After reading the function audit

No score changes. One measurement conflicts: it reports PR Vault as "11 of 87px visible", clipping at the 393px viewport. The strip's client box is 353px, ending at x=373, so **0px is visible**.
