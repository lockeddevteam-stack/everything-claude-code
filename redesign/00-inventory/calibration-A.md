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
| Speed | 1 | Log one set: `flow-2.json` 11 taps after Resume (weight cell, 1,0,0, DONE, reps cell, 8, DONE, RIR select, done); baseline run 15 taps incl. clears. 2 sheet openings per set (`-numpad.png`, `-numpad-reps.png`). Best-known 3 taps, zero sheets → 3.7x. |
| State handling | 4 | `workout-log-empty.png` "No exercises yet / Tap Add Exercise below" + Add Exercise; `-loading.png` "Thinking…" in AI Rec button; `-error.png` red toast; `-populated.png`. Shortfall: only network state is the AI Rec call and its toast auto-fades with no Retry control. |
| Data correctness | 2 | Seed `lk_activeWorkoutRows` w:"72.5", `lk_profile.useKg:true`. `workout-log-populated.png`: column header "LB" (L12080) beside header total "1088 kg" (72.5x8 + 72.5x7 = 1087.5, i.e. values treated as kg but labelled lb). Same screen: `-tools.png` offers "Switch to LBS" (implies kg) while `-action-sheet.png` offers "Switch to kg" (implies lb). Reps and set count correct; `flow-2-set-done.png` shows KG header under the flow seed. |
| Error recovery | 4 | `workout-log-error.png`: "Could not get a recommendation. Check your connection and retry." (L13596) names cause and fix; rows persisted to `lk_activeWorkoutRows` (page-map 2.7 P), set data intact in same shot. Shortfall: no Retry button, toast fades. |

Function mean: 3.0

### Design rubric

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | Squint (8px blur, scratch `workout-log-squint.png`): four orange blocks of equal brightness (Finish, two check squares, mic FAB) plus three orange PARTIALS labels; no single dominant element and no big number. `workout-log-populated.png`: 4 accent-filled, 3 accent-outlined. |
| Typography | 1 | Computed dump, viewport of `workout-log-populated.png`: 17 size/weight/line-height combos, 8 distinct sizes (11,12,13,14,15,16,20,21), 10/35 nodes off the 6-step scale, 19/35 line-height `normal`, 16 nodes at 700/800 on <=15px (column labels, PARTIALS, set numbers). |
| Spacing | 4 | Computed dump: 479/499 padding/gap/margin values on {0,4,8,12,16,24,32} = 96%. Deltas: 2px x11, 20px x4, 3px x2, 1px, 58px, 160px. Shortfall: no breaks documented. |
| Contrast (WCAG AA) | 5 | Baseline `contrast.json`: 32 checked, 32 pass, 0 fail, 1 unknown (gradient mic FAB). Own scan: 34/34 pass; worst Finish 5.18:1, "--" placeholder 5.44:1, "Mid Chest" 6.64:1. `workout-log-populated.png`. |
| Component consistency | 2 | `workout-log-populated.png` buttons: Finish pill filled, Discard text, Add Set grey 12px, AI Rec outlined, Add Exercise dashed, Block text, PARTIALS + square outlined, done square filled, mic FAB = 9 looks. Radii in viewport: 1, 6, 7, 10, 12, 14, 16px (7 values). Sheets: NumPad (no grabber), PlateCalc (grabber), tools popover, action sheet full-screen blur (`-numpad`, `-platecalc`, `-tools`, `-action-sheet`). |
| Targets (44px) | 1 | Baseline `targets.json` workout-log: 31 interactive, 22 under 44 → 9/31 = 29% meet. Set weight/reps cells 109x33, done 32x30, Add Set 252x32, Finish 79x34, Discard 75x32, partial + 26x44, set number 20x12. `workout-log-populated.png`. |
| Motion and feedback | 1 | Pointerdown sample on Finish, Set 3 weight, Mark set 3 done: computed transform/background/opacity unchanged after 50ms (no pressed state). Transitions: `background-color .24s, box-shadow .24s` on 19/23 buttons, 240ms > 100ms. Source `:active` count 2 for the whole file. `workout-log-populated.png`. |
| HIG fit | 1 | Violated: Buttons (9 styles, above), Sheets (NumPad sheet lacks grabber, `-numpad.png`; action sheet is a full-screen blurred list, `-action-sheet.png`), Toolbars (header holds Discard, Finish and an unlabeled lightning icon, `-populated.png`), Color (action sheet rows in orange, yellow, green, red with no semantic reason). Pass: 5-item tab bar, Layout, Feedback toast. 4 sections violated. |
| AI-look penalty | 2 | 3 tells: emoji as icons (mic 🎙 FAB `-populated.png`, 🏋️ on APPLY TO NEXT SET `-platecalc.png`, 📝 ADD BLOCK title `-block-modal.png`); gradient fills (mic FAB, Finish; contrast scan marks the FAB "gradient"); mixed radii (7 values in one viewport). No stacked equal cards, no template copy. |
| Accessibility | 3 | Baseline `axe.json`: 1 violation `meta-viewport` (critical, `user-scalable=no`). All set controls labelled (`Set 1 weight`, `Mark set 1 done`, `Workout tools`); `prefers-reduced-motion` present (4 rules). Shortfall: the one violation is critical, not minor; 120% text not tested. |

Design mean: 2.2

### Detail checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 4 accent-filled buttons in `workout-log-populated.png`; 5 s test names Finish, not the log action |
| 2 | Type scale | fail | 10/35 nodes off-scale, 19 with line-height unset (computed dump) |
| 3 | 8px grid | fail | 96% on grid but zero breaks documented (2px x11, 20px x4) |
| 4 | Control states | fail | 3 sampled controls: no computed change on pointerdown; no disabled styling seen (`disabled` count 0) |
| 5 | Meaningful motion | fail | No pressed feedback; NumPad sheet and tools popover appear with 240ms colour transitions only; toast fades (`-error.png`, `-discard-confirm.png`) |
| 6 | Empty and error copy | fail | Empty is two sentences ("No exercises yet" / "Tap Add Exercise below", `-empty.png`); error copy passes (what happened + what to do) |
| 7 | Numbers | fail | `tabular-nums` on 0 of 12 numeric nodes; unit adjacent OK ("1088 kg"); no dates on page |
| 8 | One icon set | fail | Emoji 🎙, 🏋️, 📝 plus outline SVG icons (`-populated.png`, `-platecalc.png`, `-block-modal.png`) |
| 9 | Scroll and targets | fail | scrollWidth 393 = clientWidth (pass) but 22 targets under 44px (`targets.json`) |
| 10 | Native dark | fail | Surfaces step by tone (0,0,0 → 28,28,30 → 44,44,46) but body is pure #000 under white 21px title; 3 box-shadow variants in one viewport |
| 11 | Copy | pass | Zero "!" in rendered text; longest label "Tap Discard again to throw this workout away" (8 words, a sentence); no cheer |

Checklist: 1/11

---

## Page: Settings

### Function rubric

| criterion | score | evidence |
|---|---|---|
| Purpose clarity | 3 | `settings-populated.png`: h1 "Settings" makes the job inferable, but the first viewport shows 3 accent-filled CTAs (CUSTOMIZE, SIGN UP, Save Name) plus the mic FAB, and `settings-populated-full.png` is a 3,989px stack of 21 cards. No primary action. |
| Feature completeness | 3 | Baseline `page-metrics.jsonl` settings interactive: 44 controls clicked, 0 non-responders (6 destructive skipped). Redundant: section header "PREFERENCES" appears twice and "DATA & SYNC" twice (DOM text scan; `settings-populated.png`, `-scrolled-2.png`, `-scrolled-4.png`, `-scrolled-6.png`); a read-only "Weight units" info card (`-scrolled-3.png`) duplicates the Weight Unit toggle. `settings-populated-light-theme.png` (seed `lk_theme=light`) renders identical to dark. |
| Task success | 5 | flow-8 pass first attempt (`flow-8.json` ok, `flow-8-lbs.png`, `flow-8-home.png`); baseline flow 8 pass, 0 console errors. |
| Speed | 4 | `flow-8.json`: 4 taps (Profile, Settings, Switch to LBS, Home), 3 screen changes, 1072 ms (`flow-metrics.jsonl`). Matches the 4-tap best-known for Apple-style Settings. Shortfall: the unit control sits ~700px below the fold (`-scrolled-2.png`), reached only by scrolling. |
| State handling | 2 | Empty: n/a (no data list, page-map 2.17). Loading: `settings-loading.png` shows no spinner or disabled Verify (button hidden under the mic FAB; shot indistinguishable from `settings-error.png`). Error: network abort renders "Invalid code" (baseline note, L2732/L2747), a wrong message. Populated OK. |
| Data correctness | 2 | Seed `lk_profile.weightKg` 64.2 → shown "64.25" (`settings-populated-scrolled-2.png`). After "Switch to LBS" label reads "Body Weight (lbs)" but value stays 64.25 (`settings-populated-units-lbs.png`; DOM check label kg→lbs, input unchanged), i.e. kg shown as lb. Height 168 → 5 / 6 converts correctly; age 29 and name match seed. |
| Error recovery | 2 | Beta Verify with worker aborted → "Invalid code" (L2747): cause misnamed, no retry path, no hint it was a connection failure. Input text retained (`settings-error.png` shows BADCODE still in field). |

Function mean: 3.0

### Design rubric

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 1 | Squint (scratch `settings-squint.png`): three equal orange bars (CUSTOMIZE, SIGN UP, Save Name) and the FAB, all one brightness; cards share size, radius and label style. `settings-populated-full.png`: 21 cards, 7 accent-filled buttons, no dominant element. |
| Typography | 1 | Full-page computed dump: 22 size/weight/line-height combos, 8 sizes (11,12,13,14,16,18,20,32), 38/96 nodes off-scale, 27 line-height `normal`, 36 nodes at 700/800 on <=14px (section labels 11/700, card titles 13/700, 32/800 title). |
| Spacing | 3 | Full page: 877/938 = 93.5% on grid (viewport only: 95.9%). Deltas: 10px x14, 6px x13, 1px x8, 11px x6, 14px x6, 2px x5, 17px x4, 20px x4. No breaks documented. |
| Contrast (WCAG AA) | 5 | Baseline `contrast.json`: 101 checked, 101 pass, 0 fail, 3 unknown (gradient CUSTOMIZE, SIGN UP, mic). Own full-page scan: 93/93 pass; worst red text rgb(240,81,81) 4.86:1 ("Notifications are blocked…", DANGER ZONE, Reset all data). |
| Component consistency | 1 | Toggles at three widths 46x26, 39x26, 35x26 (`targets.json`; `-scrolled-3.png`). Segmented pickers in 4 looks: Male/Female grey pills, Once a day outlined chips, Text Size chips, Left/Eaten 24px mini pills (`-scrolled-2`, `-scrolled-4`). Radii in full page: 2, 8, 10, 12, 13, 14, 16, 20, 50%, 999px (10 values). Buttons: pill CUSTOMIZE, gradient SIGN UP, flat Save Name, outlined Nutrition CSV, red-outlined Reset. |
| Targets (44px) | 1 | Baseline `targets.json` settings: 49 interactive, 28 under 44 → 43% meet. Back 22x27, CUSTOMIZE 114x32, Save Name 319x32, switches 46x26, Left/Eaten 48x24 / 59x24, SIGN UP 319x42. `settings-populated.png`. |
| Motion and feedback | 1 | Pointerdown sample on CUSTOMIZE, Save Name, SIGN UP: no computed change after 50ms. All 39 buttons carry `background-color .24s, box-shadow .24s` (240ms). RESET arms via a label swap only (`settings-populated-reset-armed.png`). |
| HIG fit | 1 | Violated: Layout (no grouped inset list; cards with paragraph descriptions, `-full.png`), Buttons (5 styles), Toolbars (back button 22x27 with no label text, `-populated.png`), Color (section headers in orange, red and grey with no rule: NOTIFICATIONS orange, PERFORMANCE TRACKING red, TEXT SIZE grey, `-scrolled-3`/`-scrolled-6`). Tab bar passes. 4 sections violated. |
| AI-look penalty | 1 | 5 tells: emoji as icon (🎯 Replay Tutorial `-scrolled-6.png`, 🎙 FAB); gradient CTA cards (SIGN UP, CUSTOMIZE flagged "gradient" in contrast scan); mixed radii (10 values); stacked equal-weight cards (21 in `-full.png`); template copy ("Your data is yours.", "Have an invite code? Enter it to join the beta."). |
| Accessibility | 3 | Baseline `axe.json`: 1 violation `meta-viewport` (critical). Switches use `role=switch` with labels; back button `aria-label="Back to profile"`; `prefers-reduced-motion` rules present. Shortfall: violation is critical; text-size control exists (TextSizeCard L31945) but 120% not screenshot-tested. |

Design mean: 1.8

### Detail checklist

| # | item | result | evidence |
|---|---|---|---|
| 1 | Primary action obvious | fail | 3 accent-filled buttons in first viewport, 7 on the full page (`settings-populated.png`, `-full.png`) |
| 2 | Type scale | fail | 38/96 nodes off-scale; 27 line-height unset |
| 3 | 8px grid | fail | 93.5% full page; no breaks listed |
| 4 | Control states | fail | 3 sampled controls: no pointerdown change; 240ms transitions; 0 disabled styles |
| 5 | Meaningful motion | fail | No pressed feedback; CUSTOMIZE navigates to LayoutEditor with no origin transition (`-layout-editor.png`); toggles animate colour only |
| 6 | Empty and error copy | fail | Empty n/a; error says "Invalid code" for a network abort (baseline note) |
| 7 | Numbers | fail | `tabular-nums` on 0 nodes; "0.1 MB of about 5.0 MB" unit adjacent OK; body weight 64.25 vs seed 64.2 |
| 8 | One icon set | fail | Emoji 🎯, 🎙 alongside SVG arrow and plus (`-scrolled-6.png`, `-scrolled-4.png`) |
| 9 | Scroll and targets | fail | No horizontal overflow (393 = 393) but 28 targets under 44px |
| 10 | Native dark | fail | Pure white rgb(255,255,255) x7 (toggle knobs, title) on #000 body; 5 shadow variants on the full page |
| 11 | Copy | fail | Filler "Your data is yours." (`-scrolled-4.png`); "Beta activated!" exclamation in the Verify success toast (L33512); paragraph-length card descriptions ("Restoring keeps anything newer… overwrite it.") |

Checklist: 0/11

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
