# Design audit — Shopping and Budget (`shopping-budget`)

Offline harness, iPhone 15 Pro 393x852, populated, all four sub-tabs. Shell excluded from spacing and type per calibration. Captures: `00-inventory/screenshots/current/shopping-budget-populated{,-scrolled-3,-pantry,-stores,-budget}.png`.

## 1. Squint and 5-second test

8px blur, four populated captures. **First: the orange mic button, bottom right — shell, not page.** Second: the white "SHOP & BUDGET" title. Third: the orange/green chip field (List), the red OUT OF STOCK banner (Pantry), the white $19.70 (Budget). ADD TO LIST, the page's own primary, is `rgb(44,44,46)` and gone at 8px; the only accent-filled button the page owns is Pantry's gradient **Add**. Accent-filled buttons on List: zero.

5 seconds: "a grocery list", then "$100 left / 16% used" revises it to "…and a money thing". The two jobs never resolve.

## 2. Callouts

Keyed to `shopping-budget-annotated.png` (5 panels, full legend on the image): 1 entry point, 2 header pills, 3 sub-tab pills, 4 quick-add chips, 5 list actions, 6 ADD TO LIST, 7 row targets, 8 Pantry primary and contrast, 9 store colour, 10 Budget's second system.

## 3. Measurements

**Targets (44x44)** — bounding-box script, per sub-tab:

| Sub-tab | Controls | Under 44 | Pass |
|---|---|---|---|
| List | 59 | 40 | 32% |
| Pantry | 33 | 20 | 39% |
| Stores | 23 | 17 | 26% |
| Budget | 21 | 14 | 33% |
| **All** | **136** | **91** | **33.1%** |

List's 40 (matching `tests/baseline/scans/shopping-budget.json`) is driven by: **Remove 45x14 (x10)** and **store chips 100x24 (x8)** — 18 of 40 — plus **12 quick-add chips at 34px**, **4 sub-tab pills 82x30**, four list actions at 32px, the 53x18 back control. The 44x44 row checkbox is the only compliant control in a row; the destructive Remove beside it is a third of that. Elsewhere: 33px store chips, 30px filter chips, 26/23/22/20/15/12px row controls.

**Contrast** — 88 distinct colour/size/weight/background combinations: 85 pass, 2 fail, 5 unknown (gradient). Excluding the shell FAB: 85/2/1 = 97.7%. Both failures on Pantry: `rgb(139,92,246)` "every 30d" 10px/700 on `#1C1C1E` = **4.02:1**; white ✕ 14px/700 on `rgb(240,81,81)` = **3.50:1**. Pantry's Add label sits on a gradient: unknown, not passing. Worst passing 4.83.

**Spacing** — non-zero padding/gap/margin longhands, shell excluded: **777/831 = 93.5%** on {4,8,12,16,24,32}. Off-grid: 2px x33, 6/7/14px x4 each, 10px x1, header 52px x4, nav clearance 88px x4. Undocumented.

**Typography** — distinct sizes on visible text: **10, 11, 12, 13, 14, 15, 16, 18, 28 = 9**; 19 size/weight pairs. Line height unpaired: 13px ships 18.85/19.5/`normal`, 11px 15.95/16.5/`normal`, 28px 40.6/42. 700+ on 10-13px running text. `tabular-nums`: **0 of 30** styles.

**Pressed state** (real `mouse.down`, read at 100ms): ADD TO LIST 0.97 + shadow, Pantry tab 0.979, Export 0.97, Clear Done 0.97, Chicken Breast 0.974 — **5/5**. `button:disabled{opacity:0.4}` present.

## 4. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 2 | Squint, all four captures: shell FAB wins; ADD TO LIST is `rgb(44,44,46)`, zero accent-filled buttons on List, while Pantry's Add is gradient-accent. Only Budget has a dominant element ($19.70, 28px/800). |
| Typography | 1 | 9 sizes; three line-heights on 13px; 700 on 13px and 10px running text. `-scrolled-3.png`. |
| Spacing | 3 | 93.5% on grid (777/831); 2px x33 is the main break; undocumented. |
| Contrast | 3 | 97.7% (85/87 page styles); 4.02:1 and 3.50:1 fail on `-pantry.png`; 1 gradient unknown. |
| Component consistency | 1 | Six pill variants (quick-add r20/34px, sub-tab r12-in-r20, preset r20, store link r999 grey, filter r999, history r7), five button treatments (grey primary, gradient, tinted, ghost, unstyled UA), 11 radii. |
| Targets | 1 | 91/136 under 44 = 33.1% pass, all four sub-tabs. |
| Motion and feedback | 5 | 5/5 pressed at 100ms; inventory is `pillIn 0.35s` (state-conditional) plus input-driven transitions, nothing decorative. Shortfall: an inserted row does not animate. |
| HIG fit | 1 | Four sections: Buttons/Layout (67% under 44), Navigation (no tab-bar home, entered by a Fuel header icon), Color (`rgb(239,239,239)` UA button in a black UI), Toolbars (FAB covers Clear All, Find Cheaper Swaps). `-populated.png`, `-budget.png`. |
| AI-look penalty | 1 | Four tells: 34 emoji as icons; 11 mixed radii; gradient buttons (Pantry Add, FAB); template copy ("🏋️ FITNESS PICKS — tap to add", the three-option empty line). |
| Accessibility | 3 | axe: 1 violation, `meta-viewport` (critical, global shell, counted once). Zero unlabeled buttons. Reduced motion honoured. 120% text untested (caps 4); critical caps 3. |

**Design mean 2.1.**

## 5. Detail checklist — 1/11

| # | Item | Verdict | Measurement |
|---|---|---|---|
| 1 | Primary action obvious | FAIL | 0 accent-filled buttons on List; ADD TO LIST gone at 8px blur. |
| 2 | Type scale | FAIL | 9 sizes; 13px has 3 line-heights. |
| 3 | 8px grid | FAIL | 93.5%, under 95%, undocumented. |
| 4 | Control states | PASS | 5/5 changed at 100ms; `button:disabled{opacity:0.4}` present. |
| 5 | Meaningful motion | FAIL | Zero decorative rows, but an inserted list row does not animate (only the header `pillIn` re-runs). |
| 6 | Empty and error copy | FAIL | List empty: 4-word title + a 20-word line offering three routes, no action control. Error: store-search failure renders nothing (`-error.png`). |
| 7 | Numbers | FAIL | 0/30 styles use tabular-nums; $19.70 / $120.00 / 16% proportional. |
| 8 | One icon set | FAIL | 34 emoji across four sub-tabs, mixed with ✓ ✕ ★ ☆ glyphs and 16px SVGs. |
| 9 | Scroll and targets | FAIL | 91/136 under 44. no overflow, scrollWidth 393 = clientWidth. |
| 10 | Native dark | FAIL | FAB shadow `rgba(249,115,22,.25/.22)`, 91% saturation; ON button `rgb(239,239,239)`, black text. |
| 11 | Copy | FAIL | "🏋️ FITNESS PICKS — tap to add", a 5-word section label with an emoji. Zero exclamation marks. |

## 6. Consistency deltas vs `design-system-current.md`

- **Radii**: 11 distinct on one page (4, 6, 7, 8, 10, 12, 14, 16, 20, 999, 50%). The r20 pill and the r999 pill do the same job side by side.
- **Tab pattern**: a fourth pattern, r12 pills in a r20 track at 82x30, atop the app's three.
- **Card style**: List uses `--color-card` r16 with the CSSARR shadow; Budget uses r16 outer, r6/r7 inner tiles, a green gradient meter.
- **Icon size**: 16px SVGs, 20px emoji, 14px text glyphs.
- **Accent use**: `#F97316` carries list state, tab state, store identity and section headers at once. `STORE_PALETTE` (10 retailer-brand hexes, L42025) is the page's only non-token colour source and is dead in the populated state: it colours stores added in-session only, so the seeded store hits `s.color === undefined` and renders an unstyled browser button. Ten hex literals, zero pixels.

## 7. Keep, fix, cut

- **Keep**: the 44x44 row checkbox, `aria-label="Mark as picked up"` — the one control meeting both the target and labelling bar.
- **Fix**: the target floor. 91/136 under 44; Remove (45x14) and the store chip (100x24) are 18 of List's 40, both in a one-handed row.
- **Cut**: the merge of two jobs under one header. Three status pills in three colour codes are all that ties them; Budget already runs a second card system, type ramp and meter behind the same tab strip.

## 8. After reading the function audit

No score changes. The function audit calls the empty states "one instruction, one action"; against checklist 6 the List empty block is 24 words over two lines, offers three routes and holds no action control, so item 6 stays FAIL — a copy-length disagreement, not a state-presence one. Its "Export does nothing visible" is the functional twin of callout 5.
