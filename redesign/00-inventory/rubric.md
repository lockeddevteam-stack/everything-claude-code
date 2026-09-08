# LOCKED Audit Rubric (0F)

Two rubrics, 1 to 5 per criterion, plus the 11-item checklist (pass/fail). Used in Waves 1, 2, 6, 7. Every score cites a screenshot from `00-inventory/screenshots/current/` (or `09-review/screenshots/new/`), a test result, or a measured value. Code lines support evidence, never replace it.

## 1. Function Rubric

| Criterion | Definition | 1 | 3 | 5 | Evidence to cite |
|---|---|---|---|---|---|
| Purpose clarity | A first-time user names the screen's job within 5 seconds. | No single job. Ex: Home shows 12 equal cards; tester says "a dashboard?" | Job inferable after a scan. Ex: Train Hub reads as "start a workout" once the segmented control is noticed. | Obvious at a glance, one primary action. Ex: Workout Log opens on the current exercise with Log Set dominant. | `<page>-populated.png`; 5-second note; count of candidate primary actions |
| Feature completeness | Everything the page promises works; nothing dead, stubbed, or half-built. | Core feature missing. Ex: Coach Plan renders "coming soon". | Core works; some secondary controls dead or redundant. Ex: PR Vault filters work, Share does nothing. | Every visible control works. Ex: all Cardio favorites, log, history actions complete. | Feature table: code line, status (works, dead, broken, redundant, hidden); screenshot per broken item |
| Task success | Flows from `user-flows.md` complete without workaround. | Primary flow fails. Ex: saving Review drops RIR values. | Primary passes; a secondary needs a workaround. Ex: reordering split exercises needs delete-and-readd. | Every flow passes first attempt. Ex: guest start to first logged set, no dead end. | Baseline spec name and result (`tests/baseline/results.json`); video timestamp |
| Speed | Taps and screen changes for the core action from the entry state. | 3x or more the best-known count. Ex: logging a set takes 9 taps and 2 sheets. | Within 2x. Ex: logging a set takes 5 to 6 taps. | Matches best-known. Ex: logging a set takes 3 taps from an open workout, zero screen changes. | Tap count (`page.click` + `page.tap` in flow spec); screen changes from video; elapsed ms |
| State handling | Empty, loading, error, populated all exist and are correct. | Two or more missing. Ex: Progress with no history renders blank. | All four exist, one generic. Ex: Photos empty state is spinner then "No data". | All four purposeful. Ex: empty Train Hub: "Build your first split" plus the button. | `<page>-empty/-loading/-error/-populated.png`; missing states with how reaching them was attempted |
| Data correctness | Values match seed data, units, rounding. | Wrong values. Ex: seeded 100 kg shows as 100 lb with `useKg:true`. | Values right; units or precision inconsistent. Ex: 12,340.5 kg in one card, 12.3k in another. | All match seed, units everywhere, one precision. Ex: 6 weeks of volume matches chart to the kg. | 3+ checks: seed key, displayed value, screenshot |
| Error recovery | On failure the user learns what happened and continues without losing work. | Silent failure or loss. Ex: sync error drops an unsaved workout. | Error shown, vague, no path. Ex: "Something went wrong". | Cause named, fix offered, work kept. Ex: "Offline. Set saved locally." with Retry. | `<page>-error.png`; how induced; data survived yes/no |

Interpolation: 2 = anchor 1 mostly holds but one 3-condition is met. 4 = all 3-conditions met plus one 5-condition, with one named shortfall written in the evidence cell.

## 2. Design Rubric

| Criterion | Definition | 1 | 3 | 5 | Evidence to cite |
|---|---|---|---|---|---|
| Hierarchy | Weight matches importance: one primary, quieter secondary, hidden tertiary. | All equal. Ex: Home's 12 cards share size, radius, title style. | Primary findable but 2 to 3 peers compete. Ex: Log Set is accent but the rest timer is equally large. | Squint shows one dominant element. Ex: blurred Workout Log shows one bright button, one big number. | Squint screenshot (8px blur) and note; count of primary-styled elements |
| Typography | Sizes, weights, line height, tracking from one scale. | 8+ sizes; 700/800 on body. Ex: Settings uses 11 sizes. | 5 to 7 sizes; line height unset. Ex: Review uses 6 sizes, 800 section labels. | All nodes on the 6-step scale; 700 only on numbers and titles. Ex: Workout Detail uses 15/17/22, tabular lifts. | Computed-style dump of distinct size/weight/line-height; off-scale count |
| Spacing | Padding, gaps, margins on the 8px grid (4 allowed), breaks documented. | Under 60% on grid. | 80 to 94%. | 95%+; each break documented. | Deltas table: element, value, nearest step, delta; % on grid |
| Contrast (WCAG AA) | Text 4.5:1 (large 3:1), UI boundaries 3:1, against rendered background. | Below 75% of text nodes pass. | 90 to 99% pass. | 100% pass, measured. | Contrast scan output: pass, fail, three worst ratios with selector |
| Component consistency | Same-purpose elements share one implementation and look. | 3+ variants of one component. Ex: three tab patterns, radii 8 to 999. | One variant with local overrides. Ex: cards share radius, four paddings. | One implementation per type. Ex: every list row is DsRow. | Table: type, variant count, radii; side-by-side screenshot |
| Targets (44px) | Every interactive element at least 44 x 44 CSS px including hit padding. | Below 75% meet 44px. | 90 to 99%. | 100%, measured. | Bounding-box script output: total, under-44 count, failures with selector and w x h |
| Motion and feedback | Pressed state and feedback under 100ms; transitions show origin and cause. | No pressed states; decorative fades. Ex: Home cards fade in for no reason. | Pressed on primary buttons only; sheets fade rather than rise. | Every control pressed under 100ms; sheets rise from origin; lists animate insertion; nothing decorative. | Frame count tap-to-change (ms at 60fps); transition list with purpose or "decorative" |
| HIG fit | Follows HIG Layout, Typography, Color, Buttons, Tab bars, Sheets, Toolbars, Feedback. | 3+ sections violated. Ex: 7-item tab bar, mixed icon sizes, sheet with no grabber. | 1 section violated. Ex: sheet dismiss inconsistent, rest fine. | None violated. Ex: 5-item tab bar, sheet with grabber and swipe-dismiss, one primary in toolbar. | Per section pass/fail, one screenshot, section name |
| AI-look penalty | Absence of template tells: generic gradient cards, emoji as icons, mixed radii, stacked equal-weight cards, template copy ("Welcome back!", "Let's crush it"). | 4+ tells. | 2 tells. | 0 tells. | Five-tell checklist with count and screenshot per occurrence |
| Accessibility | axe clean, controls labeled, focus order logical, reduced motion honored, 120% text does not clip. | 5+ axe violations or unlabeled primary controls. | 1 to 2 minor violations; focus mostly logical. | Zero violations; all labeled; reduced motion; 120% text intact. | axe count and ids; focus-order list; 120% screenshot |

Numeric interpolation for Contrast and Targets: 2 = 75 to 89%; 4 = 100% except at most 2 cited failures that are decorative text or icon-only controls with an adjacent labeled hit area. AI-look: 5 = 0 tells, 4 = 1, 3 = 2, 2 = 3, 1 = 4+. Others use the Function rule.

## 3. Detail Checklist (pass/fail)

| # | Item | Pass condition | Measurement |
|---|---|---|---|
| 1 | Primary action obvious | 5-second test names it; exactly one element has primary styling. | 5 s note; count accent-filled buttons in populated screenshot. |
| 2 | Type scale | Zero text nodes off the 6-size scale; line-height set per size. | Computed-style dump of all text nodes. |
| 3 | 8px grid | 95%+ of padding/gap/margin in {4, 8, 12, 16, 24, 32}; breaks listed. | Computed-style dump; deltas table. |
| 4 | Control states | Every control has pressed and disabled styles; change within 100ms (6 frames). | Frame count on 3 sampled controls; `:active`/disabled inspection. |
| 5 | Meaningful motion | Every transition has a cause; sheets rise from trigger; insertions animate; zero decorative fades. | Transition inventory with purpose column. |
| 6 | Empty and error copy | Empty: one sentence plus one action. Error: what happened and what to do. | `<page>-empty.png`, `<page>-error.png`; word count. |
| 7 | Numbers | `tabular-nums` on all numerals; unit adjacent; dates relative under 7 days, absolute after. | Computed style on numeric nodes; screenshot of both date cases. |
| 8 | One icon set | One set, one stroke weight, one optical size; zero emoji. | Icon inventory; emoji grep count. |
| 9 | Scroll and targets | No horizontal overflow except labeled carousels; zero targets under 44 x 44 CSS px. | Run the bounding-box script; `scrollWidth <= clientWidth` on root. |
| 10 | Native dark | Surface tone steps by elevation (measured L*); shadows secondary; no pure white on pure black, no light-mode borders. | Sampled surface colors per level; shadow inventory. |
| 11 | Copy | Labels under 4 words unless a sentence is needed; no exclamation marks; no filler. | Copy inventory; exclamation grep. |

## 4. Scoring Procedure

1. Write the evidence row, then the score.
2. One row per criterion:

| criterion | score | evidence |
|---|---|---|
| Targets | 2 | bounding-box script: 31/38 meet 44px (82%); `.rir-chip` 32x28, `.header .back` 40x40; `settings-populated.png` |

3. N/A: if a criterion cannot apply (Ex: Error recovery on a page with no network or input), write `N/A` with a one-sentence reason. Excluded from the total, never 0 or 5.
4. Page total = mean of scored criteria per rubric, one decimal. Report Function mean, Design mean, and checklist x/11 separately. Never combine the two rubrics.
5. Scores whose evidence cites only code (file and line) are invalid; reviewers delete them and the page fails the gate. Every evidence cell names at least one screenshot.
6. Contrast, Targets, Spacing, Typography, Accessibility must cite script or scan output. Eyeballed percentages are invalid.

## 5. Calibration Procedure (0G)

1. Two agents independently score Workout Log and Settings on both rubrics and the checklist from the same screenshots and baseline results. Neither reads the other's file until both are written.
2. Any criterion differing by 2 or more on either page returns to 0F with both evidence rows. 0F rewrites that criterion's anchors (tighter examples, numeric thresholds, or added evidence requirement) and republishes this file.
3. Both re-score only the rewritten criteria on both pages. Repeat until every criterion agrees within 1 on both pages.
4. A checklist item one scorer passes and the other fails counts as disagreement; its pass condition is rewritten.
5. `calibration.md` records both score sets per round, criteria returned, anchor edits, final agreement.
