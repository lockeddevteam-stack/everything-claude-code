# Design Audit — Progress (`progress`)

Evidence: `00-inventory/screenshots/current/progress-*.png`; `tests/baseline/scans/progress.json`; my own Playwright runs on `http://127.0.0.1:4173/tests/app/index.html` (iPhone 15 Pro, 393x852, seeded).

## 1. Squint and 5-second test

8px blur on `progress-populated.png`: two objects survive — the filled orange **Overview tab pill** and the global voice FAB. Next the repeating green PR column, then three grey slabs of equal mass. `ADD LIFT`, the page's only action, blurs dimmer than the tab pill. **The winner is a navigation control.** In 5 seconds a user reads PROGRESS, then "I am on Overview", then three lift cards, and calls the page "three lifts and their records" — never seeing the goals, calendar, photos and PR vault it also owns, because the fifth tab is off-screen.

## 2. Callouts

`progress-annotated.png`, markers 1-8, legend on the image.

## 3. Measurements

**Tab strip.** Container `clientWidth` **353px** (`overflow-x:auto`, gap 8, pad 0); content = 5 tabs (91.8+70.1+89.6+78.1+86.8) + 4 gaps = **448.4px**, `scrollWidth` 448 — **127% of container, 95px (21%) off-screen at rest**. Rights: Overview 111.8, Goals 190, Calendar 287.6, Photos **373.7**, PR Vault 468.4; container edge 373. **Three tabs fully visible, Photos clipped 0.7px (1%), PR Vault clipped 86.8px = 100%**, with no chevron, mask, peek or indicator. A tab bar is not a labelled carousel, so **item 9 fails on scroll as well as targets**. Root `scrollWidth` 393 = `clientWidth`, so the page-level check passes and hides it.

**Contrast.** `scans/progress.json`: 37 checked, 37 pass, 0 fail, **6 unknown ("gradient")**. I resolved all six by sampling the rendered pixel under each node in `progress-populated.png`: unselected tab `#a1a1aa` on `#141315` 7.23:1; `PROGRESS` 20.12:1; selected tab on `#c2410c` **5.18:1**; PR green 7.47:1; `#fb923c` 7.52:1. **43/43 = 100%.**

**Targets.** 16 controls, **7 under 44x44 (56% pass)**: Back 22x27; five tabs 33 tall; Calendar month arrows 34x39. `ADD LIFT` 353x42, `NEW GOAL` 353x51.

**Spacing.** Non-zero padding/gap/margin longhands, full page, nav and FAB out: 114 values, **101 on {4,8,12,16,24,32} = 88.6%**. Off-grid: 2 x6, 20 x6 (gutter), 58 x1. No breaks documented.

**Typography.** Distinct visible sizes: Overview 8 (32/22/20/18/14/13/12/11), Goals +15, Calendar +17 = **10**. Weights 400 x12, 600 x5, 700 x21, 800 x9; 700/800 sit on 11px caps (`FEATURED LIFTS`, `CURRENT PR`, `DAY 1`) and 13px tabs. `line-height: normal` at 13, 20 and one 14px node.

**Numbers.** 19 numeric nodes, **0 `tabular-nums`**. Units adjacent. Dates render three ways — `7/30/2026`, `2026-07-28`, `Due: 2026-12-01` — all absolute, including a 1-day-old entry.

**Motion.** Real `mouse.down`, 100ms read: `ADD LIFT`, tab Goals, Back, unpin-x, `NEW GOAL`, month arrows — **7/7 change** (scale .97 + shadow). `button:disabled{opacity:.4}` exists. **Zero `animation-name`**; 30 transition rows (27x `background-color, box-shadow .24s`), all caused, none decorative, none an insertion.

**Dark.** L* body 2.2 -> card 10.3 -> nested panel 18.1, strictly increasing; zero white-on-black text nodes. Shadows: two achromatic (blur 24, 20) and one **accent glow** `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px`. Border `#f97316` (L* 63.7) on an L* 2.2 surface, +61 L*.

**Accessibility.** axe: 1 violation, `meta-viewport` (critical, shell), 18 passes. Tabs have `role=tab`/`aria-selected`. Calendar day cells are plain 47x47 `div`s, no role — the month is unreachable by keyboard. 120% text: no clipped node, no root overflow.

## 4. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | Squint on `progress-populated.png`: winner is the Overview pill; `ADD LIFT` blurs dimmer. One accent-filled element, not an action; three identical cards. |
| Typography | 1 | 10 sizes across `progress-populated`/`-goals`/`-calendar`; 700 x21, 800 x9 on 11px caps and 13px tabs; line-height unset at 13/14/20. 8+ with 700 on <=15px = 1. |
| Spacing | 3 | 101/114 = 88.6%; off-grid 2 x6, 20 x6, 58 x1; undocumented. Band 80-94%. |
| Contrast | 5 | 37/37 pass, 6 unknown resolved by pixel sampling to 5.18-20.12:1. 43/43 measured. |
| Component consistency | 1 | Tab pattern B unique to this page against 4 others; 11 radii (20/16/14/10/9/8/6/3/2/999/50%); SVG icons on Overview vs emoji on Goals; cards 16 vs 14. `progress-populated.png`, `-goals.png`. |
| Targets | 1 | 9/16 meet 44px = 56%; Back 22x27, tabs 33 tall, arrows 34x39. Below 75%. |
| Motion and feedback | 5 | 7/7 change within 100ms under real press; zero animations; every transition row caused. |
| HIG fit | 1 | 3 sections violated (`progress-populated.png`, `-calendar.png`): Tab bars (5th tab 100% off-screen, 33px tall), Layout (7 controls <44px), Typography (800 at 11px, 10 sizes). |
| AI-look penalty | 1 | 4 tells: emoji icons (`-goals.png`, 3), stacked equal-weight cards (3), mixed radii (11), decorative gradient washes (393x144 + 393x150). |
| Accessibility | 3 | axe 1 critical (`meta-viewport`) caps at 3; calendar cells unlabelled `div`s; 120% clean. |

**Design mean 2.3.**

## 5. Detail checklist — 2/11

| # | Verdict | Measurement |
|---|---|---|
| 1 | FAIL | Squint winner is the Overview pill; `ADD LIFT` dashed 353x42. |
| 2 | FAIL | 10 distinct sizes; line-height unset at 13/14/20px. |
| 3 | FAIL | 88.6% on grid (<95%), no breaks documented. |
| 4 | PASS | 7/7 change transform+box-shadow at 100ms; `button:disabled{opacity:.4}` present. |
| 5 | FAIL | Zero decorative rows, but zero `animation-name`: Featured Lifts and Goals both grow with no insertion animation. |
| 6 | FAIL | `progress-empty-goals.png` has two action controls (`NEW GOAL` + `Body Fat Log`) and an emoji; `progress-empty.png` shows the same three cards with "--". Error copy is correct. |
| 7 | FAIL | 0/19 nodes `tabular-nums`; three date renderings, all absolute, one 1 day old. |
| 8 | FAIL | SVG icons at 4 rendered widths (22/20/16/11 in a 24 box) plus 3 emoji on Goals. |
| 9 | FAIL | 448px strip in a 353px container, not a carousel, 5th tab 100% clipped; 7/16 targets under 44. |
| 10 | FAIL | L* 2.2/10.3/18.1 and zero white-on-black pass, but one accent-glow shadow (FAB) and a `#f97316` border +61 L* over its surface. |
| 11 | PASS | Labels <=4 words; zero exclamations; empty copy 18 words, one instruction. |

## 6. Consistency deltas vs `design-system-current.md`

- **Tab pattern.** Progress is §12.2 pattern **B** (`ProgressPage` 28611): no container, no track, radius **20**, pad `8px 16px`, 13px/600, selected = solid `OR` + white. A (`DsSegmented`) uses a track, radius 10/7, 13px/500; C (Shopping) track 12 / item 9 / 12px 700; D (Coach) track 12 / item 9 / 12px + dot. Progress is the only one with no container, the only one at radius 20, the only one with 5 items, and **the only one that can overflow** — A, C and D divide a fixed track between 3-4 items and cannot clip. It is also the only pattern whose selected item is the brightest object on screen.
- **Radii** 11 distinct on one page (app 30, target 4). **Cards** 16 Overview / 14 Goals / 8 calendar cells. **Icons** two systems, four optical sizes. **Accent** three orange tints plus semantic green and blue.
- **One system does not cover both densities.** Goals is three 84px cards, 18px titles, 20px percentages. Calendar is a 42-cell 47x47 grid at 17px with an 11px four-colour legend, adding a fourth tile radius (8) and two accent tints, then ~600px of empty black. They share only the tab strip and the 20px gutter; Calendar borrows nothing from the card language and is the only sub-tab with no action.

## 7. Keep, fix, cut

- **Keep**: the PR delta pattern — DAY 1 -> CURRENT PR with a signed `+12.5kg` survives the 8px blur (`progress-populated.png`), the one place where weight matches importance.
- **Fix**: the tab strip — 448px in 353px, fifth tab 100% hidden. Five destinations do not fit one row at 44px targets; this needs a list or a second level, not a wider pill.
- **Cut**: the dashed outline on `ADD LIFT`/`NEW GOAL` (`#f97316` border, +61 L*, 353x42) — it makes the primary action read as a placeholder.
