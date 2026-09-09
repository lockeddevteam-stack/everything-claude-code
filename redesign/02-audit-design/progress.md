# Design Audit — Progress (`progress`)

Evidence: `00-inventory/screenshots/current/progress-*.png`; `tests/baseline/scans/progress.json`; my own Playwright runs against `http://127.0.0.1:4173/tests/app/index.html` (iPhone 15 Pro, 393x852 CSS, seeded).

## 1. Squint and 5-second test

8px Gaussian blur on `progress-populated.png`. Two objects survive: the filled orange **Overview tab pill** and the global voice FAB. Next is the repeating green PR column (three identical bright blocks), then three grey slabs of equal mass. `ADD LIFT` — the page's only page-level action — blurs to a dim dashed band darker than the tab pill. **The element that wins is a navigation control, not an action.**

5-second read: first the word PROGRESS, second the orange pill (read as "I am on Overview"), third the three cards. A first-time user calls this "a list of three lifts and their records" and does not see that the page also owns goals, a calendar, photos and a PR vault, because the fifth tab is off-screen.

## 2. Callouts

See `progress-annotated.png`, markers 1-8, legend on the image.

## 3. Measurements

**Tab strip (the page-specific question).** Container `clientWidth` 353px (`overflow-x: auto`, gap 8, padding 0). Content = 5 tabs (91.8 + 70.1 + 89.6 + 78.1 + 86.8) + 4 gaps = **448.4px**, `scrollWidth` 448. Content is **127% of container**; 95px (21%) is off-screen at rest. Tab lefts/rights: Overview 20-111.8, Goals 119.8-190, Calendar 198-287.6, Photos 295.6-**373.7**, PR Vault 381.7-468.4. Container right edge is 373. So **three tabs fully visible, Photos clipped 0.7px (~1%), PR Vault clipped 86.8px = 100%**. There is no chevron, no gradient mask, no partial peek and no scroll indicator; the strip is visually flush. This is a tab bar, not a labelled carousel, so **checklist 9 fails on scroll as well as on targets**. Root `scrollWidth` 393 = `clientWidth` 393, so the page-level check passes and hides the defect.

**Contrast.** `scans/progress.json`: 37 checked, 37 pass, 0 fail, **6 unknown ("gradient")**. I resolved all six by sampling the rendered pixel under each node in `progress-populated.png`: unselected tab `#a1a1aa` on `#141315` = **7.23:1**; `PROGRESS` white on `#0d0601` = 20.12:1; selected tab white on `#c2410c` = **5.18:1**; PR green `#22c55e` on `#1c1c1e` = 7.47:1; accent `#fb923c` on `#1c1c1e` = 7.52:1. **43/43 pass (100%).**

**Targets.** 16 interactive elements, **7 under 44x44 (56% pass)**: Back 22x27; the five tabs 33px tall (92/70/90/78/87 wide); on Calendar, Previous month and Next month 34x39. `ADD LIFT` 353x42 and `NEW GOAL` 353x51.

**Spacing.** Non-zero padding/gap/margin longhands, full page, nav and FAB excluded: 114 values, **101 on {4,8,12,16,24,32} = 88.6%**. Off-grid: 2px x6 (goal progress-bar radius/height), 20px x6 (page gutter), 58px x1 (header top). No breaks documented.

**Typography.** Distinct computed sizes on visible text: Overview 8 (32, 22, 20, 18, 14, 13, 12, 11); Goals adds 15; Calendar adds 17 — **10 across the page**. Weights 400 x12, 600 x5, 700 x21, 800 x9. 700/800 sit on 11px caps (`FEATURED LIFTS`, `CURRENT PR`, `DAY 1`) and 13px tab labels. Line-height is `normal` at 13px, 20px and one 14px node; the rest are 1.45x.

**Numbers.** 19 numeric text nodes, **0 with `tabular-nums`**. Units adjacent ("72.5kg"). Dates: `7/30/2026` on cards, `2026-07-28`/`2026-09-08` on the body-weight chart, `Due: 2026-12-01` in goal detail — three renderings, all absolute, including a 1-day-old entry.

**Motion.** Real `mouse.down`, 100ms read: `ADD LIFT` scale(0.97)+shadow ✓; tab Goals ✓; Back ✓; unpin-x ✓; `NEW GOAL` ✓; Previous/Next month ✓ — **5/5 (7/7)**. `button:disabled{opacity:.4;cursor:not-allowed}` exists. Animation inventory: **zero** `animation-name` on the page. Transitions: 27x `background-color, box-shadow 0.24s`, 1x `box-shadow, transform 0.2s`, 1x 6-property 0.3s, 1x `background-color, color 0.3s` — all caused, none decorative. No insertion animation on Featured Lifts or Goals, both of which grow.

**Dark.** L* body 2.2 -> card 10.3 -> nested stat panel 18.1, strictly increasing. Zero white-on-black text nodes. Three shadows: two achromatic (blur 24, 20); one **accent glow** `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px`. Border `#f97316` (L* 63.7) sits on an L* 2.2 surface, +61 L*.

**Accessibility.** axe: 1 violation, `meta-viewport` (critical, global shell), 18 passes. Tabs carry `role=tab`/`aria-selected`; Back and unpin are labelled. Calendar day cells are plain `div`s (47x47, `cursor:auto`) with no role — the month's data is unreachable by keyboard. At 120% text: no clipped node, no root overflow.

## 4. Rubric scores

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | Squint on `progress-populated.png`: the winner is the Overview tab pill; `ADD LIFT` blurs dimmer than a nav control. 1 accent-filled element on the page and it is not an action; 3 identical cards. |
| Typography | 1 | 10 distinct sizes (`progress-populated`/`-goals`/`-calendar`); 700 x21 and 800 x9, on 11px caps and 13px tab labels; line-height `normal` at 13/14/20px. Rule: 8+ sizes with 700+ on <=15px running text = 1. |
| Spacing | 3 | 101/114 non-zero longhands on grid = 88.6%; off-grid 2 x6, 20 x6, 58 x1; no breaks documented. Band 80-94% = 3. |
| Contrast | 5 | scan 37/37 pass, 6 unknown resolved by pixel sampling to 5.18-20.12:1. 43/43 = 100% measured. |
| Component consistency | 1 | Tab pattern B (pill, radius 20) is unique to this page against 4 other implementations; 11 distinct radii in one page (20/16/14/10/9/8/6/3/2/999/50%); SVG icons on Overview vs emoji on Goals; cards radius 16 (Overview) vs 14 (Goals). `progress-populated.png` + `-goals.png`. |
| Targets | 1 | 9/16 meet 44px = 56%; Back 22x27, tabs 33 tall, month arrows 34x39. Below 75% = 1. |
| Motion and feedback | 5 | 7/7 controls change within 100ms under real press; zero `animation-name`; all 30 transition rows caused. |
| HIG fit | 1 | 3 sections violated in `progress-populated.png`/`-calendar.png`: Tab bars (5th tab 100% off-screen, 33px tall), Layout (7 controls <44px), Typography (800 weight at 11px caps, 10 sizes). |
| AI-look penalty | 1 | 4 tells: emoji as icons (`progress-populated-goals.png`, 3), stacked equal-weight cards (3), mixed radii (11), decorative gradient washes (393x144 + 393x150). |
| Accessibility | 3 | axe 1 critical (`meta-viewport`) caps at 3; calendar day cells unlabelled `div`s; 120% text clean. |

**Design mean 2.3.**

## 5. Detail checklist — 2/11

| # | Verdict | Measurement |
|---|---|---|
| 1 | FAIL | Squint winner is the Overview tab pill; `ADD LIFT` is dashed 353x42. One accent-filled element, and it is navigation. |
| 2 | FAIL | 10 distinct sizes; line-height unset at 13/14/20px. |
| 3 | FAIL | 88.6% on grid, under 95%; no breaks documented. |
| 4 | PASS | 7/7 controls change transform+box-shadow at 100ms; `button:disabled{opacity:.4}` rule present. |
| 5 | FAIL | Zero decorative rows, but zero `animation-name` anywhere: Featured Lifts and Goals both grow with no insertion animation. |
| 6 | FAIL | Goals empty (`progress-empty-goals.png`) has two action controls (`NEW GOAL` + `Body Fat Log` row) and an emoji; Overview empty renders the same three cards with "--". Error copy is correct ("Analysis unavailable. Check connection." + a toast naming the network). |
| 7 | FAIL | 0/19 numeric nodes `tabular-nums`; three date renderings, all absolute, including a 1-day-old entry. |
| 8 | FAIL | SVG line icons at 4 rendered widths (22/20/16/11 in a 24 box) plus 3 emoji (dumbbell, scales, triangle) on Goals. |
| 9 | FAIL | Tab strip 448px in 353px, not a carousel, 5th tab 100% clipped; 7/16 targets under 44x44. |
| 10 | FAIL | L* 2.2/10.3/18.1 ✓ and zero white-on-black ✓, but one accent-glow shadow (FAB) and a `#f97316` border +61 L* over its surface. |
| 11 | PASS | Every label <=4 words; zero exclamation marks; empty copy is 18 words, one instruction. |

## 6. Consistency deltas vs `design-system-current.md`

- **Tab pattern.** Progress is §12.2 pattern **B** (`ProgressPage` 28611): no container, no track, item radius **20**, pad `8px 16px`, 13px/600, selected = solid `OR` with white text. A (`DsSegmented`) uses a `FILL_SOFT` track, radius 10/7, 13px/500. C (Shopping) uses a track radius 12, item 9, 12px/700. D (Coach) uses a track radius 12, item 9, 12px, plus a 7px dot. Progress is the **only** one with no container, the only one at radius 20, the only one carrying 5 items, and **the only one that overflows its container** — A, C and D divide a fixed track between 3-4 items and cannot clip. It is also the only pattern where the selected item is the brightest object on the screen.
- **Radii.** 11 distinct on one page against the app's 30 and the target of 4.
- **Cards.** 16 on Overview, 14 on Goals, 8 on calendar cells — three card/tile radii inside one page.
- **Icons.** Two systems (SVG + emoji), four optical sizes; the design system claims one set.
- **Accent.** Three orange tints (`#c2410c` fill, `#f97316` border/bar, `#fb923c` label) plus semantic green PR values and blue "84 days remaining" on one screen.

**One system does not cover both densities.** Goals is a 3-row list of 84px cards with 18px titles and 20px percentages; Calendar is a 42-cell 47x47 grid at 17px with 11px legend text and 30 more 8px radii, sitting above ~600px of empty black. They share only the tab strip and the gutter. Calendar borrows nothing from the card language and adds a fourth radius, a fifth and sixth accent tint (dot legend), and its own type sizes (17, 11) — and it is the only sub-tab with no action at all.

## 7. Keep, fix, cut

- **Keep**: the PR delta pattern — DAY 1 -> CURRENT PR with a signed `+12.5kg` reads correctly at a squint (`progress-populated.png`), the only place on the page where weight matches importance.
- **Fix**: the tab strip — 448px in 353px with the 5th tab 100% hidden; five destinations do not fit one row at 44px targets, so this must become a list or a two-level structure, not a wider pill.
- **Cut**: the dashed-outline treatment on `ADD LIFT`/`NEW GOAL` (353x42 and 353x51, `#f97316` border at +61 L*) — it makes the primary action read as a placeholder and costs the page its hierarchy score.
