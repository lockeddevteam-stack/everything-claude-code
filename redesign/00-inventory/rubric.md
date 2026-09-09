# LOCKED Audit Rubric (0F)

Two rubrics, 1 to 5 per criterion, plus the 11-item checklist (pass/fail). Used in Waves 1, 2, 6, 7. Every score cites a screenshot (`00-inventory/screenshots/current/` or `09-review/screenshots/new/`), a test result, or a measured value; code lines support evidence, never replace it.

## 1. Function Rubric

| Criterion | Definition | 1 | 3 | 5 | Evidence to cite |
|---|---|---|---|---|---|
| Purpose clarity | A first-time user names the screen's job within 5 seconds. | No single job. Ex: Home shows 12 equal cards; tester says "a dashboard?" | Job inferable after a scan. Ex: Train Hub reads as "start a workout" once the segmented control is noticed. | Obvious at a glance, one primary action. Ex: Workout Log opens on the current exercise with Log Set dominant. | `<page>-populated.png`; 5-second note; count of candidate primary actions |
| Feature completeness | Everything the page promises works; nothing dead, stubbed, or half-built. | Core feature missing. Ex: Coach Plan renders "coming soon". | Core works; some secondary controls dead or redundant. Ex: PR Vault filters work, Share does nothing. | Every visible control works. Ex: all Cardio favorites, log, history actions complete. | Feature table: code line, status (works, dead, broken, redundant, hidden); screenshot per broken item |
| Task success | Flows from `user-flows.md` complete without workaround. | Primary flow fails. Ex: saving Review drops RIR values. | Primary passes; a secondary needs a workaround. Ex: reordering split exercises needs delete-and-readd. | Every flow passes first attempt. Ex: guest start to first logged set, no dead end. | Baseline spec name and result (`tests/baseline/results.json`); video timestamp |
| Speed | Taps and screen changes for the core action from the entry state. | 3x or more the best-known count. Ex: logging a set takes 9 taps and 2 sheets. | Within 2x. Ex: logging a set takes 5 to 6 taps. | Matches best-known. Ex: logging a set takes 3 taps from an open workout, zero screen changes. | Tap count (`page.click` + `page.tap` in flow spec); screen changes from video; elapsed ms |
| State handling | Empty, loading, error, populated each render something a user can tell apart from the populated screen, and each says the right thing. Presence is visual, not code: a branch that renders no distinguishable change is missing. See the round-3 ruling for the test and the band table. | A state missing plus any other defect, or two or more missing. Ex: Settings loading is pixel-identical to populated (no spinner, no disabled Verify, no label change) and the error names the wrong cause. | No applicable state missing; at most one present-but-wrong, any remainder correct-but-generic. Ex: Photos loading is a bare spinner and empty reads "No data". | Every applicable state distinguishable, correct and purposeful. Ex: empty Train Hub: "Build your first split" plus the button. | `<page>-empty/-loading/-error/-populated.png` in `00-inventory/screenshots/current/`; per state, the diff-vs-populated result or the named distinguishing element; for a missing state, how reaching it was attempted |
| Data correctness | Values match seed data, units, rounding. | Wrong values. Ex: seeded 100 kg shows as 100 lb with `useKg:true`. | Values right; units or precision inconsistent. Ex: 12,340.5 kg in one card, 12.3k in another. | All match seed, units everywhere, one precision. Ex: 6 weeks of volume matches chart to the kg. | 3+ checks: seed key, displayed value, screenshot |
| Error recovery | On failure the user learns what happened and continues without losing work. | Silent failure or loss. Ex: sync error drops an unsaved workout. | Error shown, vague, no path. Ex: "Something went wrong". | Cause named, fix offered, work kept. Ex: "Offline. Set saved locally." with Retry. | `<page>-error.png`; how induced; data survived yes/no |

Interpolation: 2 = anchor 1 mostly holds but one 3-condition is met. 4 = all 3-conditions met plus one 5-condition, with one named shortfall written in the evidence cell.

Rulings (round 1):
- Speed: count every `page.click` and `page.tap` in the flow spec, including digit, delete and confirm taps on an in-app keypad and Resume; run the flow as `user-flows.md` defines it (typed values, not accept-recommendation). Best-known: log a set 3; switch unit from Home 4. 5 = matches; 4 = +1 tap; 3 = within 2x; 2 = under 3x; 1 = 3x or more.
- Data correctness: a unit label bug (value under the other unit's label, or two controls implying different current units) is a wrong value, anchor 1. The seed fixture is canonical; a seed-shape gap is noted, not exempted.
- State handling: superseded by the State handling ruling (round 3) below. The N/A clause is carried forward unchanged.

Ruling (round 3): State handling

1. Applicable states. Empty, loading, error, populated. A state the page cannot have by design (no data list, so no empty state) is N/A: excluded from the denominator, never counted missing. Cite the page-map row that makes it impossible. Everything below is scored over the applicable states only.
2. Presence test (visual, not code). A state is PRESENT only if it renders something the user can distinguish from the populated screen. Settle it in this order, and write which test was used in the evidence cell:
   a. Screenshot diff. Diff `<page>-<state>.png` against a populated capture of the same page, theme, scroll offset and section, all in `00-inventory/screenshots/current/`. Present if the diff is human-visible in the state's own region (a changed pixel count over the whole frame is not enough: a different scroll offset, theme or open sheet is a capture artefact, not a state signal, and must be discounted). Ex: `settings-loading.png` is captured at the beta-section scroll offset while `settings-populated.png` is at the top of the page, so their 56% pixel delta is scroll, not state, and the diff is inconclusive.
   b. Named distinguishing element. When no matched populated capture exists, presence requires naming one element visible in the state screenshot that the populated screen does not show: a spinner or skeleton, a disabled or `aria-busy` control rendered as disabled, a changed label ("Verify" -> "Verifying…"), a progress bar, or state-specific text. Name the element and the screenshot. A code branch, a state variable, or a class that produces no visible change does not count.
   c. If neither test finds a distinguishable difference, the state is MISSING, however the code branches.
3. Quality of a present state. PRESENT-AND-CORRECT: correct for the induced cause and specific (names what happened or what to do next). GENERIC: correct but conveys nothing beyond "something is happening" or "nothing here" (bare spinner, "No data", untargeted toast, no next action). PRESENT-BUT-WRONG: distinguishable but says the wrong thing for the actual condition. Ex: Settings renders a `/beta-validate` network abort as "Invalid code".
4. Rank. Missing is worse than present-but-wrong, which is worse than generic, which is worse than present-and-correct. One missing state outweighs one wrong state; a page with a missing state can never score above 2.
5. Band table. Let A = applicable states, M = missing, W = present-but-wrong, G = generic (present, correct, unspecific). The remainder A - M - W - G are present-and-correct. Any two scorers with the same counts land on the same score:

| Score | Condition |
|---|---|
| 5 | M = 0, W = 0, G = 0 (every applicable state distinguishable, correct and purposeful) |
| 4 | M = 0, W = 0, G = 1 |
| 3 | M = 0, and either (W = 1 and G <= 1) or (W = 0 and G >= 2) |
| 2 | M = 1 and W = 0 (one missing, nothing wrong), or M = 0 and W >= 2 |
| 1 | M >= 2, or (M = 1 and W >= 1), or (M = 1 and G >= 1) |

6. Worked check (Settings). Applicable A = 3 (empty N/A by design, page-map 2.17 E n/a). `settings-loading.png` shows no spinner, no disabled Verify and no label change against populated, and its diff is scroll-confounded, so test 2b applies and finds nothing: loading is MISSING, M = 1. Error is present but names "Invalid code" for a network abort: W = 1. Populated is correct: remainder 1. M = 1 and W = 1 -> **score 1**.

## 2. Design Rubric

| Criterion | Definition | 1 | 3 | 5 | Evidence to cite |
|---|---|---|---|---|---|
| Hierarchy | Weight matches importance: one primary, quieter secondary, hidden tertiary. | All equal. Ex: Home's 12 cards share size, radius, title style. | Primary findable but 2 to 3 peers compete. Ex: Log Set is accent but the rest timer is equally large. | Squint shows one dominant element. Ex: blurred Workout Log shows one bright button, one big number. | Squint screenshot (8px blur) and note; count of primary-styled elements |
| Typography | Sizes, weights, line height, tracking from one scale. | 8+ sizes; 700/800 on body. Ex: Settings uses 11 sizes. | 5 to 7 sizes; line height unset. Ex: Review uses 6 sizes, 800 section labels. | All nodes on the 6-step scale; 700 only on numbers and titles. Ex: Workout Detail uses 15/17/22, tabular lifts. | Computed-style dump of distinct size/weight/line-height; off-scale count |
| Spacing | Padding, gaps, margins on the 8px grid (4 allowed), breaks documented. | Under 60% on grid. | 80 to 94%. | 95%+; each break documented. | Deltas table: element, value, nearest step, delta; % on grid |
| Contrast (WCAG AA) | Text 4.5:1 (large 3:1), UI boundaries 3:1, against rendered background. | Below 75% of text nodes pass. | 90 to 99% pass. | 100% pass, measured. | Contrast scan output: pass, fail, three worst ratios with selector |
| Component consistency | Same-purpose elements share one implementation and look. | 3+ variants of one component. Ex: three tab patterns, radii 8 to 999. | One variant with local overrides. Ex: cards share radius, four paddings. | One implementation per type. Ex: every list row is DsRow. | Table: type, variant count, radii; side-by-side screenshot |
| Targets (44px) | Every interactive element at least 44 x 44 CSS px including hit padding. | Below 75% meet 44px. | 90 to 99%. | 100%, measured. | Bounding-box script output: total, under-44 count, failures with selector and w x h |
| Motion and feedback | Pressed change within 100ms on 5 sampled controls (press method below); transitions carry meaning; no decorative motion. | 0 to 2 of 5 change. Ex: Finish, weight cell, done check unchanged at 100ms. | 3 to 4 of 5 change. Ex: buttons press; done check and Add Set do not. | 5 of 5; sheets rise from origin; insertions animate; nothing decorative. | 5 rows: selector, ms to change or `none`; transition inventory with purpose or `decorative`; screenshot |
| HIG fit | Follows HIG Layout, Typography, Color, Buttons, Tab bars, Sheets, Toolbars, Feedback. | 3+ sections violated. Ex: 7-item tab bar, mixed icon sizes, sheet with no grabber. | 1 section violated. Ex: sheet dismiss inconsistent, rest fine. | None violated. Ex: 5-item tab bar, sheet with grabber and swipe-dismiss, one primary in toolbar. | Per section pass/fail, one screenshot, section name |
| AI-look penalty | Absence of template tells: generic gradient cards, emoji as icons, mixed radii, stacked equal-weight cards, template copy ("Welcome back!", "Let's crush it"). | 4+ tells. | 2 tells. | 0 tells. | Five-tell checklist with count and screenshot per occurrence |
| Accessibility | axe clean, controls labeled, focus order logical, reduced motion honored, 120% text does not clip. | 5+ axe violations or unlabeled primary controls. | 1 to 2 minor violations; focus mostly logical. | Zero violations; all labeled; reduced motion; 120% text intact. | axe count and ids; focus-order list; 120% screenshot |

Numeric interpolation for Contrast and Targets: 2 = 75 to 89%; 4 = 100% except at most 2 cited failures that are decorative text or icon-only controls with an adjacent labeled hit area. AI-look: 5 = 0 tells, 4 = 1, 3 = 2, 2 = 3, 1 = 4+. Others use the Function rule.

Rulings (round 1):
- Press method: sample the primary action + 4 other controls; hold a real `page.mouse.down()` at the element centre; read computed transform, background-color, opacity, box-shadow at 100ms. Dispatched events do not trigger `:active` and are invalid. A `transition` rule counts only if the value has changed at 100ms; toasts, label swaps, navigation are not pressed states.
- Motion score: base from pressed count (5/5 = 5, 3 to 4 = 3, 0 to 2 = 1); -1 if any inventory row is decorative or a sheet fades in place; +1 if base is 1 or 3 and every row has a cause. Floor 1, cap 5. Transitions without pressed states = 1, or 2 when none is decorative.
- Spacing: 1 = under 60%; 2 = 60 to 79%; 3 = 80 to 94%; 4 = 95%+ undocumented; 5 = 95%+ documented. Denominator = non-zero padding, gap, margin longhands, populated state, full page, tab bar and FAB excluded. Checklist 3 uses the same.
- Typography: a size = one distinct computed `font-size` on a visible non-empty text node, populated state, full page, open sheets in, tab bar and FAB out; half-pixels distinct (21, 21.5, 22 = three). 8+ = 1, or 2 if no 700+ on running text 15px or under.
- HIG fit: 0 sections violated = 5; 1 on a single element = 4; 1 = 3; 2 = 2; 3+ = 1. Violated = visible in a cited screenshot, touching 2+ elements or the primary control.
- Accessibility: a global-shell violation (`meta-viewport`, tab bar) counts once per page; any critical violation caps at 3; 120% text untested caps at 4.

## 3. Detail Checklist (pass/fail)

| # | Item | Pass condition | Measurement |
|---|---|---|---|
| 1 | Primary action obvious | 5-second test names it; exactly one element has primary styling. | 5 s note; count accent-filled buttons in populated screenshot. |
| 2 | Type scale | Zero text nodes off the 6-size scale; line-height set per size. | Computed-style dump of all text nodes. |
| 3 | 8px grid | 95%+ of padding/gap/margin in {4, 8, 12, 16, 24, 32}; breaks listed. | Computed-style dump; deltas table. |
| 4 | Control states | Primary action + 4 other controls (selectors listed) all change within 100ms under the press method; a `:disabled` or `[aria-disabled="true"]` rule exists for the page's controls. Any unchanged, or no rule = fail. | 5 selectors with ms; disabled rule line. |
| 5 | Meaningful motion | Inventory every `animation-name` not `none`, `transition` over 0ms, and sheet or menu opened; mark each `caused` (follows input, shows origin or state change) or `decorative` (load fade-in, idle jiggle or pulse, glow, sheet fading in place). Pass = zero `decorative`; insertions animate where a list can grow. Pressed feedback is item 4, page navigation the global audit; a motionless page passes. | Inventory with purpose column. |
| 6 | Empty and error copy | Empty: at most 2 lines and 20 words, one instruction (title + instruction line counts as one), exactly one action control. Error: names what happened and what to do, correct for the induced cause (network abort shown as "Invalid code" fails). Every applicable state passes; N/A states skipped. | Both state screenshots; line and word count; induced cause. |
| 7 | Numbers | `tabular-nums` on all numerals; unit adjacent; dates relative under 7 days, absolute after. | Computed style on numeric nodes; screenshot of both date cases. |
| 8 | One icon set | One set, one stroke weight, one optical size; zero emoji. | Icon inventory; emoji grep count. |
| 9 | Scroll and targets | No horizontal overflow except labeled carousels; zero targets under 44 x 44 CSS px. | Run the bounding-box script; `scrollWidth <= clientWidth` on root. |
| 10 | Native dark | L* of body, card, nested row strictly increases. Every box-shadow achromatic (saturation under 10%), blur 24px or under; any accent glow shadow fails, FAB included. No rgb(255,255,255) text node on a nearest opaque rgb(0,0,0) background (knobs, icons are not text). No border over 20 L* lighter than its surface. | Surface L* per level; shadow inventory (colour, blur); white-on-black count. |
| 11 | Copy | Labels under 4 words unless a sentence is needed; no exclamation marks; no filler. | Copy inventory; exclamation grep. |

## 4. Scoring Procedure

1. Write the evidence row, then the score. One row per criterion:

| criterion | score | evidence |
|---|---|---|
| Targets | 2 | bounding-box script: 31/38 meet 44px (82%); `.rir-chip` 32x28; `settings-populated.png` |

2. N/A: a criterion that cannot apply (Ex: Error recovery with no network or input) is written `N/A` with a one-sentence reason; excluded from the total, never 0 or 5.
3. Page total = mean of scored criteria per rubric, one decimal. Report Function mean, Design mean, checklist x/11 separately; never combine.
4. Evidence citing only code is invalid; the score is deleted and the page fails the gate. Every evidence cell names a screenshot.
5. Contrast, Targets, Spacing, Typography, Accessibility must cite script or scan output.

## 5. Calibration Procedure (0G)

1. Two agents independently score Workout Log and Settings on both rubrics and the checklist from the same evidence, without reading each other's file.
2. Any criterion differing by 2+ on either page, or a checklist item split pass/fail, returns to 0F with both evidence rows; 0F rewrites its anchors and republishes.
3. Both re-score only the rewritten criteria until every criterion agrees within 1. `calibration.md` records score sets per round, criteria returned, anchor edits, final agreement.

## 6. Revision log

Round 1 (A vs B):
- Motion and feedback (Workout Log A=1 B=3; Settings A=1 B=4): A dispatched pointerdown at 50ms and saw no pressed state; B used real `mouse.down` and found presses under 10ms. Fixed press method, 5-control sample, base-plus-modifier rule.
- Checklist 4, 5 (Settings split), 6 (Workout Log split), 10 (both split): pass conditions made measurable; accent glow shadows fail 10.
- Rulings: Speed (A1, B1), unit labels (B2), size counting (A4, B3), HIG table (A7, B4), Accessibility cap (A5, B5), Spacing bands and denominator (B8; A 96% vs B 83% came from counting zeros), State N/A (A8). Agreed criteria untouched.

Round 2 (A vs B), one criterion left at delta 2:
- State handling, Settings (A=1 B=3): not a judgment gap. A counted the loading state missing because `settings-loading.png` shows no spinner, no disabled Verify and no label change; B counted it present because the code branches. The anchors never said whether a branch that renders no visible change counts as present. Replaced by the round-3 ruling: presence is visual, settled by screenshot diff then by naming a distinguishing element; missing outranks wrong; a full band table maps (missing, wrong, generic) counts to one score. Worked check included so the Settings answer is derivable, not arguable.
