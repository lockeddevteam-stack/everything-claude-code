# Design audit — Settings (`settings`)

Evidence: `00-inventory/screenshots/current/settings-*.png`, `tests/baseline/{targets,contrast,axe}.json`, live measurement at 393x852 dark. Scores written before opening `01-audit-function/settings.md`.

## 1. Squint and 5-second test

8px-equivalent blur on `settings-populated.png`: four bright shapes, no winner — a pill (CUSTOMIZE), a full-width bar inside a glowing orange-bordered card (SIGN UP), a second full-width bar (Save Name), and the "Settings" wordmark. **The element that wins is SIGN UP**, on lit area alone, and it is not this page's job.

5-second read: first the title, second the glowing GUEST MODE card, third the CUSTOMIZE pill. Verdict: "a sign-up screen with settings under it." The page is a 3,894px scroller (5.0 viewports at 781px) and nothing in the first screen says so.

**Grouping.** 22 uppercase headers at 11px: 5 group labels (DOM depth 4) and 17 card headers (depth 5-7), same 11px/700 style at both ranks (callouts 5, 6). Two strings repeat: **PREFERENCES** (y131 group, y1070 card) and **DATA & SYNC** (y2318 and y3393, both group level, 1,075px apart). Header styling is itself unsystematic: weight 700 x21 / 600 x1, letter-spacing normal x18 / 0.66px x4, three colours (#a1a1aa x14, #fb923c x6, #f05151 x2). Placement is unpredictable: TEXT SIZE sits under DATA & SYNC; Cycle logging under PERFORMANCE TRACKING in the danger red; Home layout at the top while every other display preference is 1,000px lower. A person cannot predict which section holds a given control.

## 2. Callouts

In `settings-annotated.png`: 1 Back 22x27. 2 CUSTOMIZE gradient, contrast unknown, accent glow. 3 SIGN UP. 4 Save Name. 5/6 group and card headers share one style. 7 Male/Female 74x33. 8 FAB over the Body Weight field. Off-frame: 9 editor arrows 44x24 x28; 10 DATA & SYNC repeated; 11 loading identical to populated.

## 3. Measurements

**Contrast** (`contrast.json`): 101 nodes checked, 101 pass, 0 fail, 3 **unknown** — CUSTOMIZE, SIGN UP and the voice FAB sit on gradients, so their ratios are unknown, not passing.

**Targets** (`targets.json`, 44x44): 49 controls, 28 under = **21/49 pass (42.9%)**. Worst: Back 22x27; toggles 35-46x26; Left/Eaten 48x24 and 59x24; Male/Female/Cut/Maintain/Bulk 74x33 and 101x33; Save Name 319x32. Layout editor measured live: 53 controls, **44 under** — 28 arrows at 44x24, 13 Hide/Show chips at 52x32. Page plus editor: 30/102 pass (29.4%). No horizontal overflow (`scrollWidth == clientWidth`).

**Spacing**: 358 non-zero padding/gap/margin longhands, 293 in {4,8,12,16,24,32} = **81.8%**. Off-grid: 10px x14, 6px x13, 1px x8, 11px x6, 14px x6, 2px x5, 17px x4, 20px x4, -4px x4. No breaks documented.

**Type**: 8 distinct sizes — 11 (x29), 13 (x29), 12 (x27), 14, 16, 18, 20, 32. Weights 400/500/600/700/800 (800 x3). Line-height is `normal` at 12, 13, 14, 16 and 20px; set at 11, 13 and 32px. No 700+ on running text at or under 15px.

**Motion** (real `mouse.down`, read at 100ms): CUSTOMIZE, Switch to LBS, Push notifications toggle, Save Stats, Reset all data — **5/5** changed (all scale to 0.97, four gain `0 1px 4px`). Inventory: 0 animations; transitions background-color/box-shadow 0.24s x78, 6-prop 0.2s x5, background 0.2s x6, knob `left` 0.2s x6, storage meter `width` 0.3s x1 — every row caused, none decorative.

**Dark**: body L* 0.0, card L* 10.3, nested row L* 3.7 — nested is darker than its card, so tone does not increase with elevation. Three accent glow shadows `rgba(249,115,22,.25/.22)`. Zero white-on-black text nodes.

## 4. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 1 | Squint of `settings-populated.png`: 3 accent-filled peers in one viewport (5 page-wide), no dominant element; callouts 2-4 |
| Typography | 2 | 8 distinct sizes measured (band 1), lifted to 2 only because no 700+ on running text <=15px; line-height `normal` at 5 sizes |
| Spacing | 3 | 293/358 non-zero longhands on grid = 81.8%, breaks undocumented |
| Contrast | 4 | `contrast.json`: 101/101 measured pass, but 3 gradient nodes unknown, so 100% is not established; `settings-populated.png` |
| Component consistency | 1 | 11 radii on one page (12 x30, 16 x19, 10 x10, 14 x8, 2 x5, 50% x5, `8px 0 0` x5, 999 x2, 8 x2, 13, 20); 5 box-shadow variants; 4 header styles |
| Targets | 1 | 21/49 pass (42.9%); layout editor 9/53; `settings-populated-layout-editor.png` |
| Motion and feedback | 5 | 5/5 pressed at 100ms; 0 animations; every transition row caused, none decorative |
| HIG fit | 1 | Buttons (3 peer primaries, no disabled/pending), Layout (43% targets), Feedback (Verify has no pending state) — 3 sections; `settings-loading.png` |
| AI-look penalty | 1 | 4 tells: gradient buttons/glow card, emoji-as-icon "🎯 Replay Tutorial", 11 mixed radii, 19 equal-weight stacked cards |
| Accessibility | 3 | `axe.json`: 1 critical (`meta-viewport` user-scalable=no) caps at 3; toggles labelled; focus follows DOM order |

**Design mean 2.2.**

## 5. Detail checklist — 2/11

| # | Verdict | Measurement |
|---|---|---|
| 1 | Fail | 5 accent-filled buttons; 5-second test names SIGN UP, not a settings action |
| 2 | Fail | 8 sizes; line-height unset at 12/13/14/16/20px |
| 3 | Fail | 81.8% on grid, no documented breaks |
| 4 | **Pass** | 5/5 controls change at 100ms; global `button:disabled{opacity:.4}` rule exists |
| 5 | **Pass** | 0 animations, 0 decorative transitions; no list can grow |
| 6 | Fail | Empty N/A; error `settings-error.png` says "Invalid code" — names what happened, offers no next action |
| 7 | Fail | 2 numeric nodes, 0 with `tabular-nums` ("0.1 MB of about 5.0 MB") |
| 8 | Fail | 1 SVG (22px, stroke 1.8) plus 🎯 used as an icon in a button |
| 9 | Fail | 28/49 targets under 44; 44 more in the layout editor |
| 10 | Fail | Nested row L* 3.7 < card L* 10.3; 3 accent glow shadows |
| 11 | Fail | "KG - Switch to LBS" is a 5-word label mixing state and action; "🎯 Replay Tutorial" carries an emoji |

## 6. Consistency deltas

Against `design-system-current.md`: cards land on radius 16 (CSSARR remap) but the page still ships 11 radii, including the rare `8px 0 0` x5 and 2px x5. Segmented controls use three shapes at once — 999px pills, 10px groups, 8px chips — while the app's four existing segmented patterns (A-D) go unused. Icons: one `Ic` glyph at 22px/1.8, the app default, plus one emoji. Accent orange carries six roles here — headers, fills, toggle tints, borders, glow shadows, danger-adjacent labels — so it no longer marks a primary action.

## 7. Keep, fix, cut

**Keep**: the pressed-state system — 5/5 controls respond at 100ms with one scale value, the only fully consistent behaviour on the page.
**Fix**: grouping — 22 headers, 2 repeated strings, 5 viewports; collapse to 5-6 predictable sections with one header style and one accent role.
**Cut**: the LayoutEditor — 53 controls, 44 under 44px, and it exists so users can repair Home themselves.

## After reading the function audit

No score changes. It reaches the repeated headers, the 28/49 target failures, the absent Verify busy state and the emoji independently. Two facts I had not measured — the unit switch relabels without converting, and beta validation fails open — are function defects, outside the Design rubric, and they reinforce Hierarchy 1 and HIG 1 rather than move them.
