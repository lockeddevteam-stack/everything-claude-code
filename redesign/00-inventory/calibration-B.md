# Calibration B (agent 0G-B) — Workout Log and Settings

Scored independently from `screenshots/current/*.png`, `flow-2/3/8.json`, `tests/baseline/*.json` (targets, contrast, axe, page-metrics, flow-metrics) and two Playwright measurement runs (scratchpad `measure.mjs`, `pressB.mjs`: computed-style dump, 8px-grid deltas, press-to-change timing via rAF, 8px-blur squint shot, 120% text). Line refs are into `input/locked-current-v6.html`.

## Workout Log

### Function

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 3 | `workout-log-populated.png`: title, timer, set grid read as "log sets" after a scan, but 4 candidate primaries (Finish accent L12120, two orange done checks, orange mic FAB) and the core action (weight cell) is a grey box. 5-s note: "a workout in progress; what do I press?" |
| Feature completeness | 4 | page-metrics `workout-log/interactive`: 44 controls clicked, `nonResponders: []`. Shortfall: unit toggle exists 3 times and contradicts itself on one screen: tools menu "Switch to LBS" (`workout-log-populated-tools.png`, L12086) vs action sheet "Switch to kg" (`workout-log-populated-action-sheet.png`). |
| Task success | 3 | flow-2.json `ok:true` (12 steps), flow-3.json `ok:true`; baseline flow 2 `pass:true` but `taps:15` vs `expectedTaps:10` because 5 NumPad `del` presses were needed to clear the prefilled value (NumPad appends, `clearTaps:5`). Primary flow needs a workaround. flow-3 `pageErrors:1` "syncBidirectional is not defined" (guest no-op). |
| Speed | 1 | Round 2, new counting rule: flow-2.json steps 2-12 = 10 `page.click` taps (Resume, weight cell, `1`,`0`,`0`, DONE, reps cell, `8`, DONE, Mark set 1 done) + RIR `selectOption` (0 taps in Playwright); `user-flows.md` Flow 2 states "Tap count: **9** (10 with Resume)". 2 NumPad sheets (`workout-log-populated-numpad.png`, `-numpad-reps.png`), `flow-2-set-done.png`. 10 >= 3x best-known 3 -> anchor 1. |
| State handling | 4 | Round 3 band table. A = 4 (E/L/X/P all applicable, page-map 2.7). Empty: named element "No exercises yet / Tap Add Exercise below" (`workout-log-empty.png`, L12143) — present-and-correct. Loading: diff vs `workout-log-populated.png` (same theme, same scroll offset, no sheet) 0.46% in bbox (87,181)-(720,1096); named element = the AI Rec button label swapped to "Thinking…" with a spinner glyph (`workout-log-loading.png`) — present, conveys only "something is happening" = GENERIC. Error: diff vs populated 6.32%, bbox (87,181)-(635,1591), the extra region is the red toast "Could not get a recommendation. Check your connection and retry." (`workout-log-error.png`) — correct for the induced worker abort and names the next action = present-and-correct. Populated correct. M=0, W=0, G=1 -> 4. |
| Data correctness | 1 | Round 2, unit-label ruling: `workout-log-populated.png`: seed `useKg:true`, `lk_weightStorageUnit:"kg"`, rows `w:"72.5"`; column header "LB", NumPad "72.5 lb" (`-numpad.png`), header total "1088 kg". Measured: `unitHeader ["LB"]`, `totals ["1088 kg"]`, `useKg true`. Math right (72.5x8 + 72.5x7 = 1087.5). Cause: rows without `kg` field fall to "lb" at L12890 (app rows set `kg:null` L10109). A unit label bug (kg values under an "LB" header, NumPad "72.5 lb", total "1088 kg" = two controls implying different current units) is a wrong value -> anchor 1; the seed-shape gap (rows without `kg`) is noted, not exempted. |
| Error recovery | 4 | `workout-log-error.png`: toast "Could not get a recommendation. Check your connection and retry." (L13596) names cause and fix; rows persisted (`lk_activeWorkoutRows` L10686). Shortfall: no Retry control, toast fades. Discard is two-step (`-discard-confirm.png`). |

Function mean: 2.9

### Design

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 3 | Squint shot `workout-log-squint.png`: Finish, two done pills, mic FAB and orange "LB"/"PARTIALS" all survive blur. Script: 4 primary-styled buttons (Finish, Undo set 1, Undo set 2, voice). Primary findable, 3 peers compete. |
| Typography | 2 | Round 2 counting rule (visible non-empty text nodes, populated, full page, open sheets in, tab bar and FAB out): 9 distinct sizes 11/12/13/14/15/16/21/22/40 across 139 nodes (base alone 7: 11-16, 21; NumPad adds 22 and 40). `line-height: normal` on 92/139. 8+ sizes = anchor 1; no 700+ on running text 15px or under (all heavy nodes are titles, column labels or numerals: "Barbell Bench Press" 15/700, "LB"/"REPS"/"PARTIALS" 11/700, digits 11-13/800) -> 2. `workout-log-populated.png`, `-numpad.png`. |
| Spacing | 3 | Round 2 denominator (non-zero padding/gap/margin longhands, populated, full page, tab bar and FAB excluded): 138/158 on {4,8,12,16,24,32} = 87.3%. Breaks: 2px x11, 20px x4, 3px x2, 1px, 58px, 160px. 80-94% band. `workout-log-populated-full.png`. |
| Contrast | 5 | `baseline/contrast.json` workout-log: checked 32, passed 32, failures 0, unknown 1 (gradient mic FAB 🎙️). |
| Component consistency | 2 | Button radii on one screen: 0px x8, 6px x12, 7px x2, 12px x3, 14px x3 (5 variants); RIR is a native `<select>` beside custom cells (`workout-log-populated.png`); NumPad has no grabber, PlateCalc has one (`-numpad.png`, `-platecalc.png`). Cards consistent (16px x2). |
| Targets | 1 | `baseline/targets.json`: 31 interactive, 22 under 44 (29% meet). Worst: set index `1` 20x12, Undo/Mark done 32x30, weight/reps cells 109x33, Finish 79x34, Discard 75x32, Add Set 252x32, partial `+` 26x44. |
| Motion and feedback | 4 | Round 2 press method (`page.mouse.down()` at centre, computed transform/background-color/opacity/box-shadow read at 100 ms, mouse moved off before up so no click fires): 5/5 change - Finish, Set 3 weight, Mark set 3 done, Add Set, Workout tools all go `none` -> `matrix(0.97,...)` plus a raised shadow. Base 5. Inventory: `jiggle 0.45s infinite` on every exercise row (L11344, unconditional idle rotate = decorative), tools menu `opacity 0.15s` fade in place, NumPad sheet `animationName none` and a static transform over 6 frames (appears, no rise), Add Set inserts a row with no animation. -1 decorative -> 4. `workout-log-populated.png`, `-numpad.png`, `-add-set.png`. |
| HIG fit | 1 | Round 2 violation table (violated = visible in a cited screenshot and touching 2+ elements or the primary control): 4 sections. Layout (22/31 targets under 44, `baseline/targets.json`), Buttons (ALL CAPS "PARTIALS"/"LB", 5 button radii incl. the primary Finish), Sheets (NumPad no grabber, no rise, no swipe-dismiss while PlateCalc has a grabber), Typography (9 sizes, 800 weights). Pass: Tab bar (5 items), Color, Feedback, Toolbars. 3+ sections = 1. `workout-log-populated.png`, `-numpad.png`, `-platecalc.png`. |
| AI-look penalty | 2 | Tells: emoji as icons (🎙️ FAB, 🏋️ "APPLY TO NEXT SET", 🎯 in `-platecalc.png`); mixed radii (5 button radii); gradient buttons/FAB (`linear-gradient` shadow rule matches). 3 tells. |
| Accessibility | 3 | Round 2 caps: `baseline/axe.json` workout-log = 1 violation `meta-viewport` (impact `critical`, 1 node), 18 passes, 1 incomplete. It is a global-shell violation so it counts once for this page (not exempt); any critical violation caps the score at 3. Everything else clean: all controls aria-labeled (`Set 1 weight`, `Mark set 1 done`), reduced-motion rule L2290, 120% text 0 clipped (`workout-log-120.png`) so the untested-120% cap does not apply. |

Design mean: 2.6

### Checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 4 accent-filled buttons in `workout-log-populated.png` |
| 2 | Type scale | fail | 8 sizes, 10/40 off scale, `line-height: normal` on 24 nodes |
| 3 | 8px grid | fail | 83% on grid, breaks undocumented |
| 4 | Control states | pass | Round 2: 5/5 sampled controls (Finish, Set 3 weight, Mark set 3 done, Add Set, Workout tools) change transform+box-shadow at 100 ms under `page.mouse.down()`; `button:disabled { opacity:.4; cursor:not-allowed; transform:none }` rule present (1 matching rule in the sheet) |
| 5 | Meaningful motion | fail | Round 2 inventory: `jiggle 0.45s infinite` on exercise rows = decorative (idle jiggle, L11344); tools menu `opacity 0.15s` fade in place; NumPad sheet fades/appears with no origin; Add Set insertion not animated though the set list grows. `pillIn` (nav pill) is caused. Non-zero decorative count = fail |
| 6 | Empty and error copy | fail | Round 2: empty copy fine (2 lines, 6 words, one instruction) and the error toast is correct for the induced worker abort, but the empty-state block holds two action controls ("Add Exercise" and "+ Block", measured in the empty DOM) against "exactly one action control". `workout-log-empty.png`, `workout-log-error.png` |
| 7 | Numbers | fail | 0/11 numeric nodes `tabular-nums`; cell values carry no adjacent unit (header "LB" only) |
| 8 | One icon set | fail | SVG stroke 1.8 uniform but 7 optical sizes (11-21px); 1 emoji on screen, 2 more in PlateCalc |
| 9 | Scroll and targets | fail | scrollWidth 393/393 ok; 22/31 targets under 44 |
| 10 | Native dark | fail | Round 2 shadow rule: body L* 0 < card L* 10 < rows (strictly increasing) and max blur 6px, but the FAB carries `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px` - an accent glow shadow, which fails, FAB included. 7 shadows scanned, 1 chromatic. No white text on opaque black (the only rgb(255,255,255) node is the 🎙️ icon glyph, not text) |
| 11 | Copy | pass | 0 exclamation marks; labels under 4 words except "Auto Rest ON — tap to turn off" |

Checklist: 2/11

## Settings

### Function

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 4 | `settings-populated.png`: "Settings" title with back arrow, grouped cards; job obvious in 5 s. Shortfall: 5 accent-filled buttons (CUSTOMIZE, SIGN UP, Save Name, Save Stats, toggle) so no single primary. |
| Feature completeness | 3 | page-metrics `settings/interactive`: 41 clicked, `nonResponders: []`, 6 destructive skipped. Redundant: "Weight units" info card duplicates the Weight Unit row (`-scrolled-2.png`, `-scrolled-3.png`); section header "DATA & SYNC" appears twice and "PREFERENCES" twice (`-scrolled-4.png`, `-scrolled-5.png`); "Delete Account" shown to a guest with no account (`-scrolled-6.png`, L33784). |
| Task success | 4 | flow-8.json `ok:true`, baseline flow 8 `pass:true`, 4 taps, 1072 ms, 0 errors; `lk_profile.useKg` flips. Shortfall: `homeShowsUnit:false` (Home shows no unit to confirm, `flow-8-home.png`) and body weight value stays "64.25" under a "(lbs)" label (`settings-populated-units-lbs.png`). |
| Speed | 5 | Round 2, new counting rule: flow-8.json = 4 `page.click` taps (Nav Profile, "Settings", "Switch to LBS", Nav Home), 3 screen changes, 4830 ms; best-known for switch-unit-from-Home is 4, so it matches -> 5. Note (not a deduction under the rule): the control sits ~1000 px down a 3989 px page, reached by auto-scroll, not a tap (`settings-populated-full.png`, `-scrolled-2.png`, `flow-8-lbs.png`). |
| State handling | 1 | Round 3 band table. A = 3: empty is N/A by design (no data list, page-map 2.17 row "E \| n/a"), excluded from the denominator. Loading: diff `settings-loading.png` vs `settings-populated.png` = 55.21%, but the loading shot is captured at the beta-section scroll offset and populated at the top of the page, so the diff is scroll-confounded and inconclusive (ruling 2a); named-element test (2b) finds nothing — no spinner, no skeleton, no progress bar, the Verify button is still accent-filled with an unchanged "Veri…" label and no disabled rendering -> MISSING. Error: `settings-error.png` renders the `/beta-validate` network abort as "Invalid code" (L2732/2747, page-metrics note) -> PRESENT-BUT-WRONG (ruling §3 example). Note: `settings-error.png` and `settings-loading.png` are pixel-identical in the captured viewport (diff bbox 19x27 px on the FAB, 0 px over threshold) because the beta message sits below the fold; on the ruling's own worked check the error is counted present-but-wrong, and counting it missing instead lands on the same score (M=2 -> 1). M=1, W=1 -> 1. |
| Data correctness | 1 | Round 2, unit-label ruling: seed `lk_profile`: displayName Cesco ✓, age 29 ✓, heightCm 168 ✓ (`settings-populated.png`, `-scrolled-2.png`). weightKg 64.2 shows "64.25" (fmtQ rounding, L32089). After toggle: label "Body Weight (lbs)", value still 64.25 (`settings-populated-units-lbs.png`; state set once on mount L32087-32090). Seed `sex:"female"`, `goal:"build"`: no Sex or Goal option highlighted (`-scrolled-2.png`). The kg value left standing under a "(lbs)" label is a unit label bug = wrong value -> anchor 1. |
| Error recovery | 2 | Beta network failure reported as "Invalid code" (wrong cause, no path); input text kept (`settings-error.png`). Reset is two-step with Cancel and consequence copy (`settings-populated-reset-armed.png`, L33708), which is the one 3-condition met. |

Function mean: 2.9

### Design

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | `settings-squint.png`: three full-width orange bars (CUSTOMIZE, SIGN UP, Save Name) dominate the first screen, Save Stats next. Script: 5 primary-styled buttons. Nothing reads as the one job. |
| Typography | 3 | Round 2 counting rule (visible non-empty text nodes, populated, full page, no sheets on this page, tab bar and FAB out): 7 distinct sizes 11/12/13/14/16/18/32 across 98 nodes -> the 5-to-7 band = 3. `line-height: normal` on 26/98. 36 nodes at 14px or under carry 700+, but all are section labels or control labels ("PREFERENCES", "Save Name", "Once a day", CUSTOMIZE 14/800), none running text, and the 3-anchor explicitly allows heavy section labels. `settings-populated.png`, `-scrolled-2.png`. |
| Spacing | 3 | Round 2 denominator (non-zero longhands only, populated, full page, tab bar and FAB excluded; round 1's 78% counted zero values): 293/358 = 81.8%. Breaks: 10px x14, 6px x13, 1px x8, 11px x6, 14px x6, 2px x5, 17px x4, 20px x4, -4px x4, 58px. 80-94% band. `settings-populated-full.png`. |
| Contrast | 5 | `baseline/contrast.json` settings: checked 101, passed 101, failures 0, unknown 3 (gradient CUSTOMIZE, SIGN UP, FAB). |
| Component consistency | 1 | Card radii 16px x13, 13px x1, 10px x6; button radii 0/8/12/14/20 (5). Toggles: pill switch (Push, Partial Reps) vs bare white knob with no track (Streaks, Hide calories, Cycle Logging) in `-scrolled-3.png`, `-scrolled-5.png`. Segmented pickers in 3 styles: Male/Female grey, "Once a day" outlined, Text Size outlined with different padding (`-scrolled-2.png`, `-scrolled-4.png`). |
| Targets | 1 | `baseline/targets.json`: 49 interactive, 28 under 44 (43% meet). Back 22x27, switches 46x26 and 35x26, Male/Female 74x33, CUSTOMIZE 114x32, Save Name 319x32, Left/Eaten 48x24. |
| Motion and feedback | 5 | Round 2 press method (`page.mouse.down()`, computed styles read at 100 ms, mouse moved off before up): 5/5 change - CUSTOMIZE (primary), Switch to LBS, Partial Reps switch, RESET, Back to profile all take `matrix(0.97,...)`, four of them also a raised shadow. Base 5. Inventory: one `animation-name` on the page, `pillIn 0.35s` on the nav tab pill = caused (marks the selected tab), no sheets; transitions are press feedback (`background-color, box-shadow .24s` x87), switch knob `left .2s`, accordion `width .3s` - every row has a cause, none decorative, so no -1. `settings-populated.png`, `-scrolled-3.png`. |
| HIG fit | 1 | Round 2 violation table: 3 sections violated (visible, each touching 2+ elements or the primary control). Layout (28/49 targets under 44, back 22x27, `baseline/targets.json`); Buttons (gradient ALL CAPS CUSTOMIZE and SIGN UP plus two switch renderings - pill track vs bare knob - and 5 button radii); Typography (7 sizes, 32px h1, 36 nodes 700+ at <=14px). Pass: Tab bar, Color, Sheets (none), Toolbars, Feedback. 3+ = 1. `settings-populated.png`, `-scrolled-3.png`, `-scrolled-5.png`. |
| AI-look penalty | 1 | Tells: gradient buttons (CUSTOMIZE, SIGN UP), emoji as icon (🎯 Replay Tutorial `-scrolled-6.png`, 🎙️ FAB), mixed radii (3 card radii, 5 button radii), 13 stacked equal-weight cards (`settings-populated-full.png`), template copy "Your data is yours." (`-scrolled-4.png`). 5 tells. |
| Accessibility | 3 | Round 2 caps: `baseline/axe.json` settings = 1 violation `meta-viewport` (impact `critical`, 1 node), 19 passes, 1 incomplete. Global-shell violation counted once for the page; critical impact caps at 3. Otherwise clean: switches have `role=switch` + labels, back has `aria-label="Back to profile"`, DOM order matches visual order, 120% text 0 clipped (`settings-120.png`) so the untested cap does not apply. |

Design mean: 2.5

### Checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 5 accent-filled buttons on first screen |
| 2 | Type scale | fail | 7 sizes, 27/69 off scale, line-height normal on 19 |
| 3 | 8px grid | fail | 78% on grid |
| 4 | Control states | pass | Round 2: 5/5 sampled (CUSTOMIZE, Switch to LBS, Partial Reps switch, RESET, Back to profile) change transform at 100 ms under `page.mouse.down()`; `button:disabled { opacity:.4 }` rule present |
| 5 | Meaningful motion | pass | Round 2 inventory: one animation (`pillIn` nav tab pill = caused, marks selection); transitions all caused (press `background-color, box-shadow .24s`, switch knob `left .2s`, `width .3s` on the segmented indicator); zero decorative; no growable list on the page |
| 6 | Empty and error copy | fail | Round 2: empty is N/A and skipped; the error state is incorrect for the induced cause - a `/beta-validate` network abort renders "Invalid code" (L2732/2747), which is the rule's own failing example. `settings-error.png` |
| 7 | Numbers | fail | no `tabular-nums`; "0.1 MB of about 5.0 MB" unit adjacent but weight/height inputs unitless in field |
| 8 | One icon set | fail | 🎯 emoji in Replay Tutorial, 🎙️ FAB; back arrow is the only SVG |
| 9 | Scroll and targets | fail | scrollWidth 393/393 ok; 28/49 under 44 |
| 10 | Native dark | fail | Round 2 shadow rule: L* strictly increases (body 0 < card 10 < rows) and max blur 8px, but 4 of 29 scanned shadows are chromatic accent glows - CUSTOMIZE and SIGN UP `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px`, a theme swatch ring `rgb(249,115,22) 0 0 0 1px`, and the FAB - any accent glow fails, FAB included. No white text on opaque black. `settings-populated.png` |
| 11 | Copy | fail | 30-word helper paragraphs ("Restoring keeps anything newer…"), filler "Your data is yours.", 0 exclamation marks |

Checklist: 2/11

## Anchor ambiguities

1. **Speed**: anchor 1 says "9 taps and 2 sheets" but the count depends on whether a prefilled recommendation is accepted (1 tap) or overridden (9-10). Wording that would settle it: "count the flow spec's `page.click`/`page.tap` total for a set whose weight and reps must be typed; ignore the accept-recommendation path."
2. **Data correctness**: the 72.5 kg shown as "LB" arises from seed rows lacking the `kg` field. Needed: "score displayed vs seed only when the seed matches the app's own storage shape; otherwise mark the check invalid and cite the shape gap."
3. **Typography**: anchor 1 "8+ sizes" vs anchor 3 "5 to 7" leaves 8 exactly at the boundary, and it is unclear whether nav-bar, sheet and FAB nodes count. Wording: "count distinct computed font sizes of visible text nodes inside `.lk-page`, excluding the global nav; 8+ = 1."
4. **HIG fit**: "3+ sections violated = 1" makes 1 unreachable from 3 by interpolation; a page with four minor violations and a correct tab bar reads harsher than a page with one gross one. Wording: "a section is violated only when the failure is visible in a screenshot and affects 3+ elements; 2 sections = 2."
5. **Accessibility**: anchor 3 says "1 to 2 minor violations"; the only violation here is critical (`meta-viewport`) but global. Wording: "global-shell violations (viewport meta, nav) count once for the app, not per page; per-page score uses page-owned nodes."
6. **Checklist 10**: "shadows secondary" — an accent glow shadow on the FAB/CUSTOMIZE is decorative; unclear if it fails the item. Wording: "fail if any shadow uses the accent color or exceeds 8px blur."
7. **Checklist 4 and Motion**: when a global `:active` rule exists but a sampled control shows no change within 400 ms, it is unclear whether the item fails or the sample is retried. Wording: "sample 5 controls; fail if any shows no computed-style change within 6 frames."
8. **Spacing** at 78%: sits between the 60% and 80% anchors with no stated 2-band; state "2 = 60 to 79%" explicitly.

## Round 2

Re-scored only the criteria and checklist items 0F rewrote. Unchanged rows above were left as scored in round 1. Fresh Playwright runs against `http://127.0.0.1:4173/tests/app/index.html` with `tests/fixtures/index.mjs` (scratchpad `r2.mjs`, `r2d.mjs`, `r2f.mjs`, `r2g.mjs`, `r2i.mjs`); targets and contrast reused from `tests/baseline/`.

| criterion | page | old | new | measurement that produced it |
|---|---|---|---|---|
| Speed | Workout Log | 2 | 1 | flow-2.json: 10 `page.click` taps (Resume, weight cell, 1/0/0, DONE, reps cell, 8, DONE, Mark set 1 done) + RIR `selectOption` = 0 taps; `user-flows.md` Flow 2 "Tap count: 9 (10 with Resume)". 10 >= 3x best-known 3 -> anchor 1. |
| Speed | Settings | 3 | 5 | flow-8.json: 4 taps (Nav Profile, Settings, Switch to LBS, Nav Home), 3 screen changes, 4830 ms = best-known 4 for switch-unit-from-Home -> matches. |
| Data correctness | Workout Log | 2 | 1 | `workout-log-populated.png` + measured: `unitHeader ["LB"]`, NumPad "72.5 lb", `totals ["1088 kg"]`, seed `useKg:true`. Two controls implying different current units = unit label bug -> anchor 1; seed-shape gap noted, not exempted. |
| Data correctness | Settings | 2 | 1 | `settings-populated-units-lbs.png`: after "Switch to LBS" the label reads "Body Weight (lbs)" while the value stays 64.25 (the kg number, L32087-32090). Value under the other unit's label -> anchor 1. |
| State handling | Workout Log | 3 | 3 | All four states applicable and present (`-empty`, `-loading`, `-error`, `-populated`); loading is one button reading "Thinking…", error a transient toast -> "all present, one generic" = 3. |
| State handling | Settings | 2 | 3 | Empty excluded by the N/A rule (no data list, page-map 2.17 E n/a). Of the 3 applicable states none is missing; error is wrong ("Invalid code" for a network abort) -> "all present, one wrong" = 3, not 1 (1 needs a missing state). |
| Motion and feedback | Workout Log | 3 | 4 | New sample and press method: 5 controls (Finish primary + Set 3 weight, Mark set 3 done, Add Set, Workout tools), `page.mouse.down()` at centre, transform/background-color/opacity/box-shadow read at 100 ms, pointer moved off before `up`. 5/5 changed (`none` -> `matrix(0.97,...)` + raised shadow) where round 1 read 3/5. Base 5; -1 for decorative rows (`jiggle 0.45s infinite` on every exercise row L11344, tools menu `opacity .15s` fade in place, NumPad sheet `animationName none` and static transform over 6 frames). |
| Motion and feedback | Settings | 4 | 5 | Same method, 5 controls (CUSTOMIZE primary + Switch to LBS, Partial Reps switch, RESET, Back to profile): 5/5 changed at 100 ms. Inventory: only `pillIn` on the nav tab pill (caused), transitions all press/knob/accordion; zero decorative -> no -1. |
| Spacing | Workout Log | 3 | 3 | New denominator (non-zero padding/gap/margin longhands, populated, full page, tab bar and FAB out): 138/158 = 87.3% on {4,8,12,16,24,32}; 80-94% band. |
| Spacing | Settings | 2 | 3 | Same denominator: 293/358 = 81.8% (round 1's 78% counted zero-valued longhands); 80-94% band. |
| Typography | Workout Log | 2 | 2 | New counting rule (visible non-empty text nodes, full page, open sheets in, tab bar and FAB out): 9 distinct sizes 11/12/13/14/15/16/21/22/40 over 139 nodes (base 7 sizes; NumPad adds 22 and 40). 8+ = 1, raised to 2 because no 700+ falls on running text 15px or under. |
| Typography | Settings | 2 | 3 | Same rule: 7 distinct sizes 11/12/13/14/16/18/32 over 98 nodes, no sheets on the page -> 5-to-7 band = 3; the 36 heavy nodes at <=14px are section and control labels, which the 3-anchor allows. |
| HIG fit | Workout Log | 1 | 1 | Violation-count table: 4 sections violated (Layout, Buttons, Sheets, Typography), each visible in a cited screenshot and touching 2+ elements or the primary control. 3+ = 1. |
| HIG fit | Settings | 1 | 1 | 3 sections violated (Layout, Buttons incl. the two switch renderings, Typography). 3+ = 1. |
| Accessibility | Workout Log | 3 | 3 | `baseline/axe.json`: 1 `meta-viewport` violation, impact critical. Counted once for the page as a global-shell violation; critical caps at 3. 120% text tested (0 clipped), so the untested cap does not bind. |
| Accessibility | Settings | 3 | 3 | Same: 1 critical `meta-viewport` violation, 19 passes, 120% tested -> critical cap = 3. |
| Checklist 4 | Workout Log | fail | pass | 5/5 sampled controls change at 100 ms under the real press; `button:disabled { opacity:.4; cursor:not-allowed; transform:none }` rule present. |
| Checklist 4 | Settings | pass | pass | 5/5 sampled controls change at 100 ms; same disabled rule. |
| Checklist 5 | Workout Log | fail | fail | Inventory has decorative rows (infinite `jiggle`, menu fade in place, sheet with no origin) and Add Set inserts a row with no animation while the set list can grow. |
| Checklist 5 | Settings | pass | pass | Inventory: `pillIn` (caused) plus press/knob/accordion transitions; zero decorative; no growable list. |
| Checklist 6 | Workout Log | pass | fail | Empty copy passes (2 lines, 6 words, one instruction) and the error toast is correct for the induced worker abort, but the empty-state block contains two action controls ("Add Exercise" and "+ Block"), against "exactly one action control". |
| Checklist 6 | Settings | fail | fail | Empty is N/A and skipped; the error state renders "Invalid code" for a `/beta-validate` network abort - the rule's own failing example. |
| Checklist 10 | Workout Log | pass | fail | L* strictly increases (0 / 10 / rows) and max blur 6px, but the FAB shadow is an accent glow `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px`; any accent glow fails, FAB included. |
| Checklist 10 | Settings | pass | fail | 4 of 29 shadows chromatic: CUSTOMIZE, SIGN UP, a theme-swatch accent ring, and the FAB. |

Round 2 totals: Workout Log Function 2.7, Design 2.6, checklist 2/11. Settings Function 3.1, Design 2.5, checklist 2/11.

## Round 3

Re-scored only Function → State handling for both pages, strictly by the round-3 ruling (presence is visual: diff first, then named distinguishing element; then the band table). No other criterion or checklist item touched. Diffs computed with Pillow over `00-inventory/screenshots/current/` (threshold: per-pixel luminance delta > 10).

### Workout Log — applicable states A = 4 (E, L, X, P; page-map 2.7 lists a branch for each, none N/A)

| state | test that settled it | result | class |
|---|---|---|---|
| empty | named element (2b): "No exercises yet" + "Tap Add Exercise below" in `workout-log-empty.png` (L12143), absent from populated | present | present-and-correct (says what is missing and the next action) |
| loading | diff (2a) `workout-log-loading.png` vs `workout-log-populated.png`, same theme, same scroll offset, no sheet open: 0.46% changed, bbox (87,181)-(720,1096); human-visible in the state's own region — the AI Rec button reads "Thinking…" with a spinner glyph (also confirmed by 2b) | present | generic (conveys only "something is happening"; no cause, no next action) |
| error | diff (2a) `workout-log-error.png` vs populated, same offset: 6.32% changed, bbox (87,181)-(635,1591); the added region is the red toast "Could not get a recommendation. Check your connection and retry." | present | present-and-correct (correct for the induced worker abort, names cause and next action) |
| populated | reference (`workout-log-populated.png`) | present | present-and-correct |

Counts: A = 4, M = 0, W = 0, G = 1 -> band table row 4. **Old 3 → new 4.**

### Settings — applicable states A = 3 (empty N/A: page-map 2.17 states row `E | n/a`, no data list on the page, so no empty state by design; screenshot index "Unreachable or absent states" repeats it)

| state | test that settled it | result | class |
|---|---|---|---|
| loading | diff (2a) `settings-loading.png` vs `settings-populated.png` = 55.21% changed, but the loading shot sits at the beta-section scroll offset and populated at the top of the page — a scroll artefact, so the diff is INCONCLUSIVE per the ruling's warning; fell through to 2b: no spinner, no skeleton, no progress bar, no `aria-busy`/disabled rendering, Verify still accent-filled with an unchanged label ("Veri…", partly behind the mic FAB). No distinguishing element nameable | MISSING (however the code branches) | — |
| error | named element (2b): the beta message "Invalid code" for an aborted `/beta-validate` (L2732/2747), the ruling's own §3 example | present | present-but-wrong (network abort reported as a bad code) |
| populated | reference (`settings-populated.png` and `-scrolled-2..6`) | present | present-and-correct |

Caveat recorded: `settings-error.png` and `settings-loading.png` are pixel-identical inside the captured viewport (diff bbox 19x27 px on the mic FAB, 0 px over threshold) — the beta message renders below the fold and no scrolled error capture exists. The ruling's worked check counts the error present-but-wrong, which is what is scored here; counting it missing instead gives M = 2 and the same band-table row.

Counts: A = 3, M = 1, W = 1, G = 0 -> band table row 1 (M = 1 and W >= 1). **Old 3 → new 1.** Matches the ruling's worked check.

Round 3 means: Workout Log Function 2.9 (was 2.7); Settings Function 2.9 (was 3.1). Design means and checklists unchanged (Workout Log 2.6 / 2/11; Settings 2.5 / 2/11).
