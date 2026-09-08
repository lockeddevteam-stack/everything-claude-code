# Calibration A (agent 0G-A) — Workout Log and Settings

Scored independently from `screenshots/current/`, `flow-2/3/8.json`, `tests/baseline/*.json`, and a Playwright pass (`iPhone 15 Pro`, dark, seed via `fixtures/index.mjs`) for computed type, spacing, radii, contrast, pressed state, and 8px-blur squint captures. Line refs are into `input/locked-current-v6.html`.

---

## Page: Workout Log

### Function rubric

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 4 | `workout-log-populated.png`: 5 s note "logging bench press sets" (set table, timer, volume). Candidate primaries: 4 accent-filled buttons (Finish, done check x2, mic FAB) plus 3 accent-outlined (Add Exercise dashed, AI Rec, PARTIALS +). Shortfall: the dominant button is Finish, not the log action. |
| Feature completeness | 3 | `workout-log-populated-exercise-detail.png`: 700px blank media panel plus "No form video found" (half-built, ExerciseDetailModal L7202). `workout-log-populated-platecalc.png`: bar chip row clipped ("E"). Tools, rest, plate calc, block, action sheet, NumPad all open (`-tools`, `-rest-settings`, `-platecalc`, `-block-modal`, `-action-sheet`, `-numpad`). No baseline `interactive` test exists for this page (page-metrics.jsonl has populated/empty/error only). |
| Task success | 3 | flow-2 pass (`flow-2.json` ok, `flow-2-set-done.png`) but baseline `flow-metrics.jsonl` flow 2: 5 NumPad `del` taps needed to clear the prefilled 37.5 before typing (workaround). flow-3 pass (`flow-3-review.png`) with pageError `syncBidirectional is not defined` on save. |
| Speed | 1 | R2 ruling: every click/tap counted, flow as `user-flows.md` defines it. Baseline `flow-metrics.jsonl` flow 2 "Log one set" = **15 taps** (weight cell, digits, DONE, reps cell, digits, DONE, RIR, done, plus 5 `del` clears); 2 NumPad openings per set (`workout-log-populated-numpad.png`, `-numpad-reps.png`). Best-known 3 → 5.0x ≥ 3x = 1. |
| State handling | 4 | `workout-log-empty.png` "No exercises yet / Tap Add Exercise below" + Add Exercise; `-loading.png` "Thinking…" in AI Rec button; `-error.png` red toast; `-populated.png`. Shortfall: only network state is the AI Rec call and its toast auto-fades with no Retry control. |
| Data correctness | 1 | R2 ruling (unit label bug = wrong value). Seed `lk_activeWorkoutRows` w:"72.5", `lk_profile.useKg:true`. `workout-log-populated.png`: column header "LB" (L12080) beside header total "1088 kg" (72.5x8 + 72.5x7 = 1087.5, i.e. values treated as kg but labelled lb). Same screen: `-tools.png` offers "Switch to LBS" (implies kg) while `-action-sheet.png` offers "Switch to kg" (implies lb). Reps and set count correct; `flow-2-set-done.png` shows KG header under the flow seed. Two unit-label bugs on one screen → anchor 1. |
| Error recovery | 4 | `workout-log-error.png`: "Could not get a recommendation. Check your connection and retry." (L13596) names cause and fix; rows persisted to `lk_activeWorkoutRows` (page-map 2.7 P), set data intact in same shot. Shortfall: no Retry button, toast fades. |

Function mean: 2.9 (round 1: 3.0)

### Design rubric

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | Squint (8px blur, scratch `workout-log-squint.png`): four orange blocks of equal brightness (Finish, two check squares, mic FAB) plus three orange PARTIALS labels; no single dominant element and no big number. `workout-log-populated.png`: 4 accent-filled, 3 accent-outlined. |
| Typography | 3 | R2 count method (visible non-empty text nodes, populated, full page, tab bar + FAB out, half-px distinct): **7 distinct sizes** — 11(x14), 12(x6), 13(x7), 14(x1), 15(x4), 16(x1), 21(x1) over 34 nodes. The 20px of round 1 was the tab bar / FAB, now excluded. Line-height `normal` on most nodes; 16 nodes at 700/800 <=15px but all titles, numbers or column labels, none on running text. 5-7 sizes = 3. `workout-log-populated.png`. |
| Spacing | 3 | R2 denominator (non-zero padding/gap/margin longhands, populated, full page, tab bar + FAB excluded): **138/158 on {4,8,12,16,24,32} = 87.3%**. Off-grid: 2px x11, 20px x4, 3px x2, 1px, 58px, 160px. Round 1's 96% counted zeros. 80-94% = 3. `workout-log-populated-full.png`. |
| Contrast (WCAG AA) | 5 | Baseline `contrast.json`: 32 checked, 32 pass, 0 fail, 1 unknown (gradient mic FAB). Own scan: 34/34 pass; worst Finish 5.18:1, "--" placeholder 5.44:1, "Mid Chest" 6.64:1. `workout-log-populated.png`. |
| Component consistency | 2 | `workout-log-populated.png` buttons: Finish pill filled, Discard text, Add Set grey 12px, AI Rec outlined, Add Exercise dashed, Block text, PARTIALS + square outlined, done square filled, mic FAB = 9 looks. Radii in viewport: 1, 6, 7, 10, 12, 14, 16px (7 values). Sheets: NumPad (no grabber), PlateCalc (grabber), tools popover, action sheet full-screen blur (`-numpad`, `-platecalc`, `-tools`, `-action-sheet`). |
| Targets (44px) | 1 | Baseline `targets.json` workout-log: 31 interactive, 22 under 44 → 9/31 = 29% meet. Set weight/reps cells 109x33, done 32x30, Add Set 252x32, Finish 79x34, Discard 75x32, partial + 26x44, set number 20x12. `workout-log-populated.png`. |
| Motion and feedback | 4 | R2 press method (real `page.mouse.down()` at element centre, computed style read at 100ms). **5/5 changed**: Mark set 3 done 32x30, Set 3 weight 109x33, Add Set 252x32, Workout tools 44x44, Finish 79x34 — each `transform: none -> matrix(0.97,...)` + `box-shadow: none -> rgba(0,0,0,0.5) 0 1px 4px`. Round 1 used a dispatched pointerdown, which never fires `:active`. Base 5; **-1 decorative**: `getAnimations()` shows `jiggle 0.45s infinite` running at rest on the exercise header ("Barbell Bench Press", playState `running`, currentTime 817ms). Sheets: NumPad opens with `transform:none`, no animation (appears, does not fade in place). `workout-log-populated.png`, `-numpad.png`. |
| HIG fit | 1 | R2 table (3+ sections = 1; violation must touch 2+ elements or the primary control). Violated: Buttons (9 styles, above), Sheets (NumPad sheet lacks grabber, `-numpad.png`; action sheet is a full-screen blurred list, `-action-sheet.png`), Toolbars (header holds Discard, Finish and an unlabeled lightning icon, `-populated.png`), Color (action sheet rows in orange, yellow, green, red with no semantic reason). Pass: 5-item tab bar, Layout, Feedback toast. 4 sections violated, all multi-element → 1. |
| AI-look penalty | 2 | 3 tells: emoji as icons (mic 🎙 FAB `-populated.png`, 🏋️ on APPLY TO NEXT SET `-platecalc.png`, 📝 ADD BLOCK title `-block-modal.png`); gradient fills (mic FAB, Finish; contrast scan marks the FAB "gradient"); mixed radii (7 values in one viewport). No stacked equal cards, no template copy. |
| Accessibility | 3 | `scans/workout-log.json` axe: 1 violation, `meta-viewport` (impact `critical`, `user-scalable=no`) — a global-shell violation, counted once for this page. All set controls labelled (`Set 1 weight`, `Mark set 1 done`, `Workout tools`); `prefers-reduced-motion` present (4 rules). R2 rule: any critical violation **caps at 3**; 120% untested would cap at 4, not binding. `workout-log-populated.png`. |

Design mean: 2.6 (round 1: 2.2)

### Detail checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 4 accent-filled buttons in `workout-log-populated.png`; 5 s test names Finish, not the log action |
| 2 | Type scale | fail | 10/35 nodes off-scale, 19 with line-height unset (computed dump) |
| 3 | 8px grid | fail | 96% on grid but zero breaks documented (2px x11, 20px x4) |
| 4 | Control states | pass | R2 press method: 5/5 sampled controls change at 100ms (Mark set 3 done, Set 3 weight, Add Set, Workout tools, Finish — transform 0.97 + box-shadow); global `button:disabled{opacity:0.4;cursor:not-allowed;transform:none}` rule exists |
| 5 | Meaningful motion | fail | R2 inventory: `pillIn .35s` on the nav tab pill = caused; transitions (`background-color/box-shadow .24s` x39, `max-height/opacity`, `transform .2s`) all caused; but **`jiggle 0.45s infinite` runs at rest** on the exercise header (`getAnimations` playState running) = decorative → fail. `workout-log-populated.png` |
| 6 | Empty and error copy | fail | R2 conditions: empty copy **passes** (2 lines / 7 words / one instruction, title+instruction counted as one); error **passes** (worker aborted → "Could not get a recommendation. Check your connection and retry.", correct for the induced cause). Fails the empty-state control count: `workout-log-empty.png` shows **two action controls** in the empty area, "+ Add Exercise" and "+ Block", not exactly one |
| 7 | Numbers | fail | `tabular-nums` on 0 of 12 numeric nodes; unit adjacent OK ("1088 kg"); no dates on page |
| 8 | One icon set | fail | Emoji 🎙, 🏋️, 📝 plus outline SVG icons (`-populated.png`, `-platecalc.png`, `-block-modal.png`) |
| 9 | Scroll and targets | fail | scrollWidth 393 = clientWidth (pass) but 22 targets under 44px (`targets.json`) |
| 10 | Native dark | fail | R2 conditions: L* increases 0 → 28,28,30 → 44,44,46 (pass); zero white-on-pure-black text nodes (the round-1 "Finish" hit is on `rgb(194,65,12)`, false positive) (pass); no border >20 L* over its composited surface (pass); **fails shadows** — the FAB carries an accent glow `rgba(249,115,22,0.25) 0 2px 6px, rgba(249,115,22,0.22) 0 8px 22px`, saturation 91% (`workout-log-populated.png`) |
| 11 | Copy | pass | Zero "!" in rendered text; longest label "Tap Discard again to throw this workout away" (8 words, a sentence); no cheer |

Checklist: 2/11 (round 1: 1/11)

---

## Page: Settings

### Function rubric

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 3 | `settings-populated.png`: h1 "Settings" makes the job inferable, but the first viewport shows 3 accent-filled CTAs (CUSTOMIZE, SIGN UP, Save Name) plus the mic FAB, and `settings-populated-full.png` is a 3,989px stack of 21 cards. No primary action. |
| Feature completeness | 3 | Baseline `page-metrics.jsonl` settings interactive: 44 controls clicked, 0 non-responders (6 destructive skipped). Redundant: section header "PREFERENCES" appears twice and "DATA & SYNC" twice (DOM text scan; `settings-populated.png`, `-scrolled-2.png`, `-scrolled-4.png`, `-scrolled-6.png`); a read-only "Weight units" info card (`-scrolled-3.png`) duplicates the Weight Unit toggle. `settings-populated-light-theme.png` (seed `lk_theme=light`) renders identical to dark. |
| Task success | 5 | flow-8 pass first attempt (`flow-8.json` ok, `flow-8-lbs.png`, `flow-8-home.png`); baseline flow 8 pass, 0 console errors. |
| Speed | 5 | R2 ruling: taps only, best-known for "switch unit from Home" = 4. Baseline `flow-metrics.jsonl` flow 8 "Change units, return Home" = **4 taps** (Profile, Settings, Switch to LBS, Home), 3 screen changes, 1072 ms; `flow-8.json` ok, `flow-8-lbs.png`, `flow-8-home.png`. Matches best-known = 5 (scrolling is not a tap). |
| State handling | 1 | R2 N/A rule: Empty excluded by design (no data list, page-map 2.17), score on the remaining three. Loading **missing**: `settings-loading.png` shows the Verify button in its normal orange state, no spinner, no disabled styling, partly occluded by the mic FAB. Error **wrong**: network abort renders "Invalid code" (`settings-error.png`, L2732/L2747). Populated OK. One missing + one wrong = anchor 1. |
| Data correctness | 1 | R2 ruling (unit label bug = wrong value). Seed `lk_profile.weightKg` 64.2 → shown "64.25" (`settings-populated-scrolled-2.png`). After "Switch to LBS" label reads "Body Weight (lbs)" but value stays 64.25 (`settings-populated-units-lbs.png`; DOM check label kg→lbs, input unchanged), i.e. kg shown as lb. Height 168 → 5 / 6 converts correctly; age 29 and name match seed. Value shown under the other unit's label → anchor 1. |
| Error recovery | 2 | Beta Verify with worker aborted → "Invalid code" (L2747): cause misnamed, no retry path, no hint it was a connection failure. Input text retained (`settings-error.png` shows BADCODE still in field). |

Function mean: 2.9 (round 1: 3.0)

### Design rubric

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 1 | Squint (scratch `settings-squint.png`): three equal orange bars (CUSTOMIZE, SIGN UP, Save Name) and the FAB, all one brightness; cards share size, radius and label style. `settings-populated-full.png`: 21 cards, 7 accent-filled buttons, no dominant element. |
| Typography | 3 | R2 count method: **7 distinct sizes** — 11(x29), 12(x27), 13(x29), 14(x6), 16(x2), 18(x1), 32(x1) over 95 visible text nodes, full page, tab bar + FAB out (the round-1 20px was the FAB/tab bar). Line-height `normal` on 27 nodes; 36 nodes at 700/800 <=14px, all section labels, card titles or buttons — none on running paragraph text. 5-7 sizes = 3. `settings-populated-full.png`. |
| Spacing | 3 | R2 denominator (non-zero longhands, populated, full page, tab bar + FAB excluded): **293/358 = 81.8%**. Off-grid: 10px x14, 6px x13, 1px x8, 11px x6, 14px x6, 2px x5, 17px x4, 20px x4, -4px x4, 58px. Round 1's 93.5% counted zeros. 80-94% = 3. `settings-populated-full.png`. |
| Contrast (WCAG AA) | 5 | Baseline `contrast.json`: 101 checked, 101 pass, 0 fail, 3 unknown (gradient CUSTOMIZE, SIGN UP, mic). Own full-page scan: 93/93 pass; worst red text rgb(240,81,81) 4.86:1 ("Notifications are blocked…", DANGER ZONE, Reset all data). |
| Component consistency | 1 | Toggles at three widths 46x26, 39x26, 35x26 (`targets.json`; `-scrolled-3.png`). Segmented pickers in 4 looks: Male/Female grey pills, Once a day outlined chips, Text Size chips, Left/Eaten 24px mini pills (`-scrolled-2`, `-scrolled-4`). Radii in full page: 2, 8, 10, 12, 13, 14, 16, 20, 50%, 999px (10 values). Buttons: pill CUSTOMIZE, gradient SIGN UP, flat Save Name, outlined Nutrition CSV, red-outlined Reset. |
| Targets (44px) | 1 | Baseline `targets.json` settings: 49 interactive, 28 under 44 → 43% meet. Back 22x27, CUSTOMIZE 114x32, Save Name 319x32, switches 46x26, Left/Eaten 48x24 / 59x24, SIGN UP 319x42. `settings-populated.png`. |
| Motion and feedback | 5 | R2 press method (real `page.mouse.down()`, computed style at 100ms). **5/5 changed**: CUSTOMIZE 114x32 (transform 0.97), Save Name 319x32 (transform + box-shadow), Push notifications switch 46x26, Back to profile 22x27, SIGN UP 319x42 — round 1's dispatched pointerdown was invalid. Base 5; no modifier: `getAnimations()` returns only `pillIn .35s` once on the nav tab pill (a state change, caused); transitions are press feedback (`.24s` x87), segmented-pill `left .2s` / `width .3s` and `background .2s` — no decorative row, no sheet fading in place. `settings-populated.png`. |
| HIG fit | 1 | R2 table (3+ = 1; violation must touch 2+ elements or the primary control). Violated: Layout (no grouped inset list; cards with paragraph descriptions, `-full.png`), Buttons (5 styles), Toolbars (back button 22x27 with no label text, `-populated.png`), Color (section headers in orange, red and grey with no rule: NOTIFICATIONS orange, PERFORMANCE TRACKING red, TEXT SIZE grey, `-scrolled-3`/`-scrolled-6`). Tab bar passes. Toolbars is now **excluded** (the 22x27 unlabeled back button is a single non-primary element), leaving Layout, Buttons, Color = 3 sections → still 1. |
| AI-look penalty | 1 | 5 tells: emoji as icon (🎯 Replay Tutorial `-scrolled-6.png`, 🎙 FAB); gradient CTA cards (SIGN UP, CUSTOMIZE flagged "gradient" in contrast scan); mixed radii (10 values); stacked equal-weight cards (21 in `-full.png`); template copy ("Your data is yours.", "Have an invite code? Enter it to join the beta."). |
| Accessibility | 3 | `scans/settings.json` axe: 1 violation, `meta-viewport` (impact `critical`) — global shell, counted once for this page. Switches use `role=switch` with labels; back button `aria-label="Back to profile"`; `prefers-reduced-motion` rules present. R2 rule: any critical violation **caps at 3** (the 120%-untested cap of 4 is not binding). `settings-populated.png`. |

Design mean: 2.4 (round 1: 1.8)

### Detail checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 3 accent-filled buttons in first viewport, 7 on the full page (`settings-populated.png`, `-full.png`) |
| 2 | Type scale | fail | 38/96 nodes off-scale; 27 line-height unset |
| 3 | 8px grid | fail | 93.5% full page; no breaks listed |
| 4 | Control states | pass | R2 press method: 5/5 change at 100ms (CUSTOMIZE, Save Name, Push notifications switch, Back to profile, SIGN UP); global `button:disabled{opacity:0.4;cursor:not-allowed;transform:none}` rule exists |
| 5 | Meaningful motion | pass | R2 inventory: one animation (`pillIn .35s` once, nav tab pill = state change) and transitions `background-color/box-shadow .24s` x87 (press), `left .2s` / `width .3s` (segmented pill follows selection), `background .2s/.25s` (toggle) — **zero decorative**; page navigation is the global audit, pressed feedback is item 4. `settings-populated.png` |
| 6 | Empty and error copy | fail | R2: empty N/A, skipped. Error fails the named example exactly — worker aborted, screen reads "Invalid code" (`settings-error.png`, L2747), naming a wrong cause and offering no fix |
| 7 | Numbers | fail | `tabular-nums` on 0 nodes; "0.1 MB of about 5.0 MB" unit adjacent OK; body weight 64.25 vs seed 64.2 |
| 8 | One icon set | fail | Emoji 🎯, 🎙 alongside SVG arrow and plus (`-scrolled-6.png`, `-scrolled-4.png`) |
| 9 | Scroll and targets | fail | No horizontal overflow (393 = 393) but 28 targets under 44px |
| 10 | Native dark | fail | R2 conditions: L* increases (pass); zero white text nodes on a nearest-opaque black surface once gradient-backed nodes are excluded — knobs and icons are not text (pass). **Fails twice**: FAB accent glow `rgba(249,115,22,0.25) 0 2px 6px` + `rgba(249,115,22,0.22) 0 8px 22px` (sat 91%) and a `rgb(249,115,22) 0 0 0 1px` ring shadow; and 4 accent borders 46-64 L* over their surface (Once a day, Left, Default chips). `settings-populated-full.png`, `-scrolled-4.png` |
| 11 | Copy | fail | Filler "Your data is yours." (`-scrolled-4.png`); "Beta activated!" exclamation in the Verify success toast (L33512); paragraph-length card descriptions ("Restoring keeps anything newer… overwrite it.") |

Checklist: 2/11 (round 1: 0/11)

---

## Anchor ambiguities

1. **Speed (Function)** — unclear whether each NumPad digit counts as a tap. `flow-2.json` reports `taps: 5` while listing 11 tap steps; baseline counts 15. Wording that would resolve it: "Count every `page.click`/`page.tap`, including keypad digits and Resume; state the best-known count for the page in the anchor (Workout Log: 3)."
2. **Task success** — flow-2 passes but only after 5 clearing taps. Is a workaround on the primary flow a 3 or a 4? Add: "Primary flow passing only via extra unplanned taps or a recovery step scores 3."
3. **Spacing 4 vs 5 and checklist 3** — 96% on grid with no documented breaks. Anchor 5 says "each break documented"; the current app documents nothing. Add: "Undocumented breaks cap the score at 4 and fail checklist 3" (or drop the documentation clause for the current-app baseline).
4. **Typography 1 vs 2** — anchor 1 is "8+ sizes; 700/800 on body". I found exactly 8 sizes on both pages, with a 0.5px rounding question (21px vs 22px). Specify: "distinct sizes after rounding to the nearest px, within the first viewport" and whether the count is per viewport or full page (Settings: 8 either way, Workout Log: 8 in viewport).
5. **Accessibility** — one *critical* axe violation (`meta-viewport`) that is app-global. Anchor 3 says "1 to 2 minor violations". Add: "A single global violation shared by every page (meta-viewport) counts as one minor for page scoring" or "critical severity caps at 2".
6. **Contrast with unknowns** — 100% pass but 1 to 3 gradient-background nodes unmeasured. Add: "Unknown (gradient/transparent) nodes are excluded from the denominator and listed; they do not block a 5."
7. **HIG fit 1 vs 2** — "3+ sections violated" vs "1 section violated" leaves 2 violations with no anchor. Add: "2 sections violated = 2."
8. **State handling when Empty is N/A** — Settings has no empty branch by design. Unclear whether that counts as "missing". Add: "A state that cannot exist for the page type is excluded, not counted missing; score on the remaining three."
9. **Checklist 6 empty copy** — "one sentence plus one action". Workout Log uses a title line plus an instruction line. Add: "Two short lines totalling one instruction count as one sentence" or "exactly one text node".
10. **Motion 1 vs 2** — anchor 1 bundles "no pressed states" with "decorative fades". Pages with no pressed states and no decorative fades observed sit between. Add: "No pressed state on any sampled control = 1 regardless of fades."
11. **Purpose clarity 3 vs 4 for Settings** — job is obvious from the h1 but there is no primary action. Add: "A title alone does not satisfy 'one primary action'; utility pages with no primary action cap at 3."

---

## Round 2

Re-scored only the criteria and checklist items 0F rewrote. Measurement rerun with Playwright (`iPhone 15 Pro`, dark, `fixtures/index.mjs`, `http://127.0.0.1:4173/tests/app/index.html`); targets and contrast reused from `tests/baseline/`. Press method as revised: real `page.mouse.down()` at the element centre, computed `transform` / `background-color` / `opacity` / `box-shadow` read 100ms after press, primary action plus 4 other controls.

| criterion | page | round 1 | round 2 | measurement |
|---|---|---|---|---|
| Motion and feedback | Workout Log | 1 | 4 | 5/5 pressed at 100ms (Mark set 3 done, Set 3 weight, Add Set, Workout tools, Finish: `transform none -> matrix(0.97,...)` + `box-shadow none -> rgba(0,0,0,0.5) 0 1px 4px`). Base 5, -1 for `jiggle 0.45s infinite` running at rest on the exercise header. |
| Motion and feedback | Settings | 1 | 5 | 5/5 pressed at 100ms (CUSTOMIZE, Save Name, Push notifications switch, Back to profile, SIGN UP). Base 5, no decorative row, no sheet fading in place. |
| Spacing | Workout Log | 4 | 3 | 138/158 non-zero longhands on grid = 87.3% (round 1's 96% counted zeros). |
| Spacing | Settings | 3 | 3 | 293/358 = 81.8% under the fixed denominator (was 93.5% with zeros); same band. |
| Typography | Workout Log | 1 | 3 | 7 distinct sizes (11,12,13,14,15,16,21) over 34 visible text nodes, tab bar + FAB excluded. |
| Typography | Settings | 1 | 3 | 7 distinct sizes (11,12,13,14,16,18,32) over 95 nodes; the round-1 20px was the FAB. |
| HIG fit | Workout Log | 1 | 1 | 4 multi-element sections violated (Buttons, Sheets, Toolbars, Color) → 3+ = 1. |
| HIG fit | Settings | 1 | 1 | Toolbars dropped (single non-primary element); Layout, Buttons, Color remain = 3 → 1. |
| Accessibility | Workout Log | 3 | 3 | 1 axe violation, `meta-viewport`, critical and global-shell → critical cap 3. |
| Accessibility | Settings | 3 | 3 | Same single critical global-shell violation → cap 3. |
| Speed | Workout Log | 1 | 1 | flow 2 = 15 taps vs best-known 3 = 5.0x ≥ 3x. |
| Speed | Settings | 4 | 5 | flow 8 = 4 taps, equals the 4-tap best-known; scrolling is not a tap. |
| Data correctness | Workout Log | 2 | 1 | "LB" column header over a "1088 kg" total with `useKg:true`, plus "Switch to LBS" and "Switch to kg" on the same screen = unit label bug. |
| Data correctness | Settings | 2 | 1 | "Body Weight (lbs)" label with the value still 64.25 kg = unit label bug. |
| State handling | Workout Log | 4 | 4 | N/A rule does not apply; all four states present and purposeful, shortfall = no Retry on the error toast. |
| State handling | Settings | 2 | 1 | Empty excluded by design; loading missing (no spinner or disabled Verify) and error wrong ("Invalid code" for a network abort) = one missing + one wrong. |
| Checklist 4 | Workout Log | fail | pass | 5/5 change at 100ms; global `button:disabled` rule. |
| Checklist 4 | Settings | fail | pass | 5/5 change at 100ms; same global disabled rule. |
| Checklist 5 | Workout Log | fail | fail | `jiggle 0.45s infinite` at rest = one decorative row. |
| Checklist 5 | Settings | fail | pass | Inventory has zero decorative rows (`pillIn` follows a tab change; transitions all press or selection). |
| Checklist 6 | Workout Log | fail | fail | Copy and error clauses now pass; the empty screen offers two action controls ("+ Add Exercise", "+ Block"), not exactly one. |
| Checklist 6 | Settings | fail | fail | Empty N/A; error is the rubric's own failing example (network abort shown as "Invalid code"). |
| Checklist 10 | Workout Log | fail | fail | L*, white-on-black and border clauses pass; FAB accent-glow shadow (sat 91%) fails. |
| Checklist 10 | Settings | fail | fail | FAB accent glow plus an accent ring shadow, and 4 accent borders 46-64 L* over their surface. |

Corrections to round 1 worth recording: the round-1 pressed-state result was an artefact of a dispatched `pointerdown` (never triggers `:active`) sampled at 50ms; the round-1 spacing percentages included zero-valued longhands; the round-1 size counts included tab bar and FAB nodes; and the round-1 "white on pure black" hit on Workout Log ("Finish") was a false positive — the button's own background is `rgb(194,65,12)`.
