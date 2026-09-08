# Calibration B (agent 0G-B) — Workout Log and Settings

Scored independently from `screenshots/current/*.png`, `flow-2/3/8.json`, `tests/baseline/*.json` (targets, contrast, axe, page-metrics, flow-metrics) and two Playwright measurement runs (scratchpad `measure.mjs`, `pressB.mjs`: computed-style dump, 8px-grid deltas, press-to-change timing via rAF, 8px-blur squint shot, 120% text). Line refs are into `input/locked-current-v6.html`.

## Workout Log

### Function

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 3 | `workout-log-populated.png`: title, timer, set grid read as "log sets" after a scan, but 4 candidate primaries (Finish accent L12120, two orange done checks, orange mic FAB) and the core action (weight cell) is a grey box. 5-s note: "a workout in progress; what do I press?" |
| Feature completeness | 4 | page-metrics `workout-log/interactive`: 44 controls clicked, `nonResponders: []`. Shortfall: unit toggle exists 3 times and contradicts itself on one screen: tools menu "Switch to LBS" (`workout-log-populated-tools.png`, L12086) vs action sheet "Switch to kg" (`workout-log-populated-action-sheet.png`). |
| Task success | 3 | flow-2.json `ok:true` (12 steps), flow-3.json `ok:true`; baseline flow 2 `pass:true` but `taps:15` vs `expectedTaps:10` because 5 NumPad `del` presses were needed to clear the prefilled value (NumPad appends, `clearTaps:5`). Primary flow needs a workaround. flow-3 `pageErrors:1` "syncBidirectional is not defined" (guest no-op). |
| Speed | 2 | flow-2.json: Resume + 9 taps, 2 NumPad sheets (`workout-log-populated-numpad.png`, `-numpad-reps.png`) plus a native `<select>` for RIR; matches the anchor-1 example (9 taps, 2 sheets). One 3-condition met: with a prefilled recommendation the done check is 1 tap (`flow-2-set-done.png`). Elapsed 2445 ms baseline. |
| State handling | 3 | `workout-log-empty.png` "No exercises yet / Tap Add Exercise below" (purposeful, L12143); `workout-log-loading.png` only the AI Rec button reads "Thinking…"; `workout-log-error.png` transient toast. All four exist, loading and error are local and generic. |
| Data correctness | 2 | `workout-log-populated.png`: seed `useKg:true`, `lk_weightStorageUnit:"kg"`, rows `w:"72.5"`; column header "LB", NumPad "72.5 lb" (`-numpad.png`), header total "1088 kg". Measured: `unitHeader ["LB"]`, `totals ["1088 kg"]`, `useKg true`. Math right (72.5x8 + 72.5x7 = 1087.5). Cause: rows without `kg` field fall to "lb" at L12890 (app rows set `kg:null` L10109). Anchor-1 condition literally met on the harvest seed; values and precision right. |
| Error recovery | 4 | `workout-log-error.png`: toast "Could not get a recommendation. Check your connection and retry." (L13596) names cause and fix; rows persisted (`lk_activeWorkoutRows` L10686). Shortfall: no Retry control, toast fades. Discard is two-step (`-discard-confirm.png`). |

Function mean: 3.0

### Design

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 3 | Squint shot `workout-log-squint.png`: Finish, two done pills, mic FAB and orange "LB"/"PARTIALS" all survive blur. Script: 4 primary-styled buttons (Finish, Undo set 1, Undo set 2, voice). Primary findable, 3 peers compete. |
| Typography | 2 | Computed dump (40 text nodes): 8 sizes 11/12/13/14/15/16/20/21, weights 400/500/600/700/800, 10/40 off the 6-step scale (25%), `line-height: normal` on 24/40, 800 on 8 nodes ("LB", "PARTIALS"). 8 sizes is the anchor-1 line; one 3-condition (no 800 on running body text). `workout-log-populated.png`. |
| Spacing | 3 | Grid dump: 149/180 values on {4,8,12,16,24,32} = 83%; deltas 2px x21, 20px x4, 3px x2, 14px x1, 58px, 160px. 80-94% band. |
| Contrast | 5 | `baseline/contrast.json` workout-log: checked 32, passed 32, failures 0, unknown 1 (gradient mic FAB 🎙️). |
| Component consistency | 2 | Button radii on one screen: 0px x8, 6px x12, 7px x2, 12px x3, 14px x3 (5 variants); RIR is a native `<select>` beside custom cells (`workout-log-populated.png`); NumPad has no grabber, PlateCalc has one (`-numpad.png`, `-platecalc.png`). Cards consistent (16px x2). |
| Targets | 1 | `baseline/targets.json`: 31 interactive, 22 under 44 (29% meet). Worst: set index `1` 20x12, Undo/Mark done 32x30, weight/reps cells 109x33, Finish 79x34, Discard 75x32, Add Set 252x32, partial `+` 26x44. |
| Motion and feedback | 3 | Press timing: Finish 5 ms, Set 3 weight 1 ms (global `button:active` scale .97), Mark set 3 done and Add Set no change within 400 ms (2/5 sampled fail). NumPad sheet: `animationName none`, static transform (appears, no rise). Tools menu `fadeIn 0.15s`. Add Set: no insertion animation. Decorative `jiggle`, `pillIn`, accent glow shadow on FAB present. |
| HIG fit | 1 | Violated: Layout (22 targets under 44pt), Buttons (ALL CAPS "PARTIALS", four button styles), Sheets (NumPad no grabber or swipe-dismiss; PlateCalc grabber), Typography (8 sizes). Pass: Tab bar (5 items), Color (one accent), Feedback. `workout-log-populated.png`, `-numpad.png`. |
| AI-look penalty | 2 | Tells: emoji as icons (🎙️ FAB, 🏋️ "APPLY TO NEXT SET", 🎯 in `-platecalc.png`); mixed radii (5 button radii); gradient buttons/FAB (`linear-gradient` shadow rule matches). 3 tells. |
| Accessibility | 3 | `baseline/axe.json`: 1 violation `meta-viewport` (user-scalable=no, critical), 18 passes; every control aria-labeled (`Set 1 weight`, `Mark set 1 done`); reduced-motion media rule present (L2290); 120% text: 0 clipped nodes (`workout-log-120.png`). One violation, but critical not minor. |

Design mean: 2.5

### Checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 4 accent-filled buttons in `workout-log-populated.png` |
| 2 | Type scale | fail | 8 sizes, 10/40 off scale, `line-height: normal` on 24 nodes |
| 3 | 8px grid | fail | 83% on grid, breaks undocumented |
| 4 | Control states | fail | `button:disabled` rule exists; pressed measured on 3/5 sampled controls, Mark done and Add Set unchanged at 400 ms |
| 5 | Meaningful motion | fail | NumPad no rise, Add Set no insertion animation, tools `fadeIn`, decorative `jiggle`/`pillIn`/glow |
| 6 | Empty and error copy | pass | `workout-log-empty.png` one sentence plus Add Exercise; error toast names cause and fix |
| 7 | Numbers | fail | 0/11 numeric nodes `tabular-nums`; cell values carry no adjacent unit (header "LB" only) |
| 8 | One icon set | fail | SVG stroke 1.8 uniform but 7 optical sizes (11-21px); 1 emoji on screen, 2 more in PlateCalc |
| 9 | Scroll and targets | fail | scrollWidth 393/393 ok; 22/31 targets under 44 |
| 10 | Native dark | pass | body L* 0, card L* 10, cells lighter; 3 shadows, one accent glow (noted); pure-white text only on orange buttons |
| 11 | Copy | pass | 0 exclamation marks; labels under 4 words except "Auto Rest ON — tap to turn off" |

Checklist: 3/11

## Settings

### Function

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 4 | `settings-populated.png`: "Settings" title with back arrow, grouped cards; job obvious in 5 s. Shortfall: 5 accent-filled buttons (CUSTOMIZE, SIGN UP, Save Name, Save Stats, toggle) so no single primary. |
| Feature completeness | 3 | page-metrics `settings/interactive`: 41 clicked, `nonResponders: []`, 6 destructive skipped. Redundant: "Weight units" info card duplicates the Weight Unit row (`-scrolled-2.png`, `-scrolled-3.png`); section header "DATA & SYNC" appears twice and "PREFERENCES" twice (`-scrolled-4.png`, `-scrolled-5.png`); "Delete Account" shown to a guest with no account (`-scrolled-6.png`, L33784). |
| Task success | 4 | flow-8.json `ok:true`, baseline flow 8 `pass:true`, 4 taps, 1072 ms, 0 errors; `lk_profile.useKg` flips. Shortfall: `homeShowsUnit:false` (Home shows no unit to confirm, `flow-8-home.png`) and body weight value stays "64.25" under a "(lbs)" label (`settings-populated-units-lbs.png`). |
| Speed | 3 | flow-8: 4 taps, 3 screen changes; Weight Unit sits ~1000 px down a 3989 px page (`settings-populated-full.png`, `-scrolled-2.png`). Within 2x of a 3-tap Settings pattern. |
| State handling | 2 | Empty n/a (no branch, page-map 2.17). `settings-loading.png`: only the beta Verify button pends. `settings-error.png` plus page-metrics note: a network abort on `/beta-validate` renders "Invalid code" (L2732/2747), wrong state. Signed-in loading/error unreachable in guest. Two of three applicable states exist, error incorrect. |
| Data correctness | 2 | Seed `lk_profile`: displayName Cesco ✓, age 29 ✓, heightCm 168 ✓ (`settings-populated.png`, `-scrolled-2.png`). weightKg 64.2 shows "64.25" (fmtQ rounding, L32089). After toggle: label "Body Weight (lbs)", value still 64.25 (`settings-populated-units-lbs.png`; state set once on mount L32087-32090). Seed `sex:"female"`, `goal:"build"`: no Sex or Goal option highlighted (`-scrolled-2.png`). |
| Error recovery | 2 | Beta network failure reported as "Invalid code" (wrong cause, no path); input text kept (`settings-error.png`). Reset is two-step with Cancel and consequence copy (`settings-populated-reset-armed.png`, L33708), which is the one 3-condition met. |

Function mean: 2.9

### Design

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | `settings-squint.png`: three full-width orange bars (CUSTOMIZE, SIGN UP, Save Name) dominate the first screen, Save Stats next. Script: 5 primary-styled buttons. Nothing reads as the one job. |
| Typography | 2 | Dump (69 text nodes): 7 sizes 11/12/13/14/16/18/32, 27/69 off scale (39%), weight 700 on 28 nodes at 14px and below (card titles, pills), `line-height: normal` on 19, 800 on 3 (CUSTOMIZE, SIGN UP, h1). 5-7 sizes but 700 on body-size text. |
| Spacing | 2 | Grid dump: 205/263 on grid = 78%; deltas 10px x14, 6px x12, 11px x6, 14px x6, 1px x6, 17px x4, 20px x4, -4px x2. Between the 60% and 80% anchors. |
| Contrast | 5 | `baseline/contrast.json` settings: checked 101, passed 101, failures 0, unknown 3 (gradient CUSTOMIZE, SIGN UP, FAB). |
| Component consistency | 1 | Card radii 16px x13, 13px x1, 10px x6; button radii 0/8/12/14/20 (5). Toggles: pill switch (Push, Partial Reps) vs bare white knob with no track (Streaks, Hide calories, Cycle Logging) in `-scrolled-3.png`, `-scrolled-5.png`. Segmented pickers in 3 styles: Male/Female grey, "Once a day" outlined, Text Size outlined with different padding (`-scrolled-2.png`, `-scrolled-4.png`). |
| Targets | 1 | `baseline/targets.json`: 49 interactive, 28 under 44 (43% meet). Back 22x27, switches 46x26 and 35x26, Male/Female 74x33, CUSTOMIZE 114x32, Save Name 319x32, Left/Eaten 48x24. |
| Motion and feedback | 4 | Press timing: Switch to LBS 6 ms, Partial reps 8 ms, Reset all data 8 ms, Back 3 ms (4/4 under 100 ms). `animationName` inventory empty; no sheets on the page; no decorative fades. Shortfall: no disabled control rendered to verify, theme-swatch change untimed. |
| HIG fit | 1 | Violated: Layout (28 targets under 44pt, back 22x27), Buttons (gradient ALL CAPS CUSTOMIZE/SIGN UP), Typography (7 sizes, 32px h1), Toggles (two switch renderings). Pass: Tab bar, Color. `settings-populated.png`, `-scrolled-3.png`. |
| AI-look penalty | 1 | Tells: gradient buttons (CUSTOMIZE, SIGN UP), emoji as icon (🎯 Replay Tutorial `-scrolled-6.png`, 🎙️ FAB), mixed radii (3 card radii, 5 button radii), 13 stacked equal-weight cards (`settings-populated-full.png`), template copy "Your data is yours." (`-scrolled-4.png`). 5 tells. |
| Accessibility | 3 | `baseline/axe.json`: 1 violation `meta-viewport` (critical), 19 passes; switches have `role=switch` and labels, back has `aria-label`; DOM order is visual order; 120% text 0 clipped (`settings-120.png`). |

Design mean: 2.2

### Checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 5 accent-filled buttons on first screen |
| 2 | Type scale | fail | 7 sizes, 27/69 off scale, line-height normal on 19 |
| 3 | 8px grid | fail | 78% on grid |
| 4 | Control states | pass | 4/4 sampled controls change in 3-8 ms; `button:disabled` rule present (opacity .4) |
| 5 | Meaningful motion | pass | no animations on page, no decorative fades; transitions limited to button press |
| 6 | Empty and error copy | fail | error "Invalid code" for a network failure; empty n/a |
| 7 | Numbers | fail | no `tabular-nums`; "0.1 MB of about 5.0 MB" unit adjacent but weight/height inputs unitless in field |
| 8 | One icon set | fail | 🎯 emoji in Replay Tutorial, 🎙️ FAB; back arrow is the only SVG |
| 9 | Scroll and targets | fail | scrollWidth 393/393 ok; 28/49 under 44 |
| 10 | Native dark | pass | body L* 0, card L* 10, inner rows lighter; shadows 4 incl. one accent glow (noted) |
| 11 | Copy | fail | 30-word helper paragraphs ("Restoring keeps anything newer…"), filler "Your data is yours.", 0 exclamation marks |

Checklist: 3/11

## Anchor ambiguities

1. **Speed**: anchor 1 says "9 taps and 2 sheets" but the count depends on whether a prefilled recommendation is accepted (1 tap) or overridden (9-10). Wording that would settle it: "count the flow spec's `page.click`/`page.tap` total for a set whose weight and reps must be typed; ignore the accept-recommendation path."
2. **Data correctness**: the 72.5 kg shown as "LB" arises from seed rows lacking the `kg` field. Needed: "score displayed vs seed only when the seed matches the app's own storage shape; otherwise mark the check invalid and cite the shape gap."
3. **Typography**: anchor 1 "8+ sizes" vs anchor 3 "5 to 7" leaves 8 exactly at the boundary, and it is unclear whether nav-bar, sheet and FAB nodes count. Wording: "count distinct computed font sizes of visible text nodes inside `.lk-page`, excluding the global nav; 8+ = 1."
4. **HIG fit**: "3+ sections violated = 1" makes 1 unreachable from 3 by interpolation; a page with four minor violations and a correct tab bar reads harsher than a page with one gross one. Wording: "a section is violated only when the failure is visible in a screenshot and affects 3+ elements; 2 sections = 2."
5. **Accessibility**: anchor 3 says "1 to 2 minor violations"; the only violation here is critical (`meta-viewport`) but global. Wording: "global-shell violations (viewport meta, nav) count once for the app, not per page; per-page score uses page-owned nodes."
6. **Checklist 10**: "shadows secondary" — an accent glow shadow on the FAB/CUSTOMIZE is decorative; unclear if it fails the item. Wording: "fail if any shadow uses the accent color or exceeds 8px blur."
7. **Checklist 4 and Motion**: when a global `:active` rule exists but a sampled control shows no change within 400 ms, it is unclear whether the item fails or the sample is retried. Wording: "sample 5 controls; fail if any shows no computed-style change within 6 frames."
8. **Spacing** at 78%: sits between the 60% and 80% anchors with no stated 2-band; state "2 = 60 to 79%" explicitly.
