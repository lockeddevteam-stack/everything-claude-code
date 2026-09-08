# Baseline summary — LOCKED v6 (tests/app/index.html)

Wave 0H. Suite: 8 flow specs, 18 page specs (populated / empty / error / interactive crawl), global nav + axe-core 4.10.3 (wcag2a, wcag2aa) + 44 px target scan + WCAG contrast scan. Tables between the GENERATED markers are produced by `node summarize-baseline.mjs baseline`; everything below them is hand-written.

<!-- GENERATED:START -->
## Suite
Run: 2026-09-08T23:32:21.098Z · 78 passed · 25 failed · 0 skipped · 222 s · Playwright 1.56.1

## Flows (e2e/flows)

| # | Flow | Taps | Expected | ms (first nav → success) | Console errors | Page errors | Flow steps | Test | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1A cold start (overlay + tutorial) | 17 | 17 | 3716 | 0 | 0 | pass | passed | tutorial shown: true; onboarding taps 3, without onboarding 14. 2 unrouted external requests (lockedapi.cescocugliari.workers.dev/yt-search, static.exercisedb.dev/media/EIeI8Vf.gif). 16 per user-flows +1 Skip tutorial (2b); the guest seed has no lk_tutorialSeen |
| 1 | 1B seeded guest (no overlay/tutorial) | 14 | 14 | 3090 | 0 | 0 | pass | passed | 2 unrouted external requests (lockedapi.cescocugliari.workers.dev/yt-search, static.exercisedb.dev/media/EIeI8Vf.gif) |
| 2 | Log one set | 15 | 10 | 2475 | 0 | 0 | pass | passed | 5 taps are NumPad "del" presses to clear the pre-filled recommendation (37.5 / 8). header reads "0 sets" after a done warm-up set. 9 + Resume per user-flows; RIR is a native <select> (0 Playwright taps). Extra taps = NumPad del presses needed to clear the pre-filled recommendation. |
| 3 | Finish, Review, save | 3 | 3 | 1076 | 0 | 1 | pass | failed | errors: syncBidirectional is not defined. 2 + Resume (boot via seeded active workout) |
| 4 | Home to lift chart | 3 | 3 | 893 | 0 | 0 | pass | passed |  |
| 5 | Coach message and reply | 2 | 2 | 795 | 0 | 0 | pass | passed |  |
| 6 | Edit split and start | 5 | 5 | 2300 | 0 | 0 | pass | passed |  |
| 7 | Add shopping item, open Budget | 4 | 4 | 1266 | 0 | 0 | pass | passed | lk_myStores emptied so typing stays offline (README quirk) |
| 8 | Change units, return Home | 4 | 4 | 972 | 0 | 0 | pass | passed |  |

## Pages (e2e/pages + global.spec)

| Page | Populated | Empty | Error | Interactive: clicked / total | Non-responders | Blocked clicks | Skipped (destructive) | Recoveries | Console errors | Page errors | axe violations (nodes) | Targets < 44 / total | Contrast fails / checked (unknown) | In-app back | History back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | passed | passed | passed | 14 / 14 | — | "LOG" | — | 12 | 0 | 0 | 1 (1) | 4 / 20 | 0 / 92 (5) | n/a | n/a |
| progress | passed | passed | N/A | 6 / 11 | — | — | Unpin this exercise (+1 already-selected tab) | 3 | 0 | 0 | 1 (1) | 7 / 16 | 0 / 37 (6) | ok | ok |
| pr-vault | passed | passed | N/A | 12 / 12 | — | — | — | 11 | 0 | 0 | 2 (7) | 2 / 18 | 9 / 44 (2) | ok | n/a |
| photos | passed | passed | passed | 10 / 11 | — | — | — (+1 already-selected tab) | 5 | 0 | 0 | 1 (1) | 8 / 17 | 0 / 18 (10) | ok | n/a |
| cycle | passed | passed | N/A | 20 / 35 | — | — | — | 2 | 0 | 0 | 2 (2) | 1 / 14 | 1 / 37 (3) | ok | ok |
| train-hub | passed | passed | N/A | 26 / 30 | — | "Start Day A" | Delete | 16 | 0 | 0 | 1 (1) | 19 / 33 | 0 / 97 (2) | n/a | n/a |
| workout-log | passed | passed | passed | 49 / 39 | — | — | Discard, Finish, Clear partials | 1 | 0 | 0 | 1 (1) | 22 / 31 | 0 / 32 (1) | n/a | n/a |
| review | passed | passed | passed | 2 / 3 | — | — | Save without reflection | 1 | 0 | 0 | 1 (1) | 1 / 3 | 0 / 13 (4) | n/a | n/a |
| workout-detail | passed | failed | N/A | 3 / 4 | — | — | Delete | 2 | 0 | 0 | 1 (1) | 4 / 10 | 0 / 50 (1) | ok | n/a |
| exercise-library | passed | passed | N/A | 15 / 15 | — | — | — | 14 | 0 | 0 | 1 (1) | 2 / 21 | 0 / 28 (1) | ok | n/a |
| split-builder | passed | passed | passed | 21 / 40 | — | — | Remove this day, Remove this exercise from the day | 6 | 0 | 0 | 1 (1) | 11 / 42 | 0 / 45 (2) | ok | n/a |
| cardio | passed | passed | N/A | 8 / 87 | — | — | — | 1 | 0 | 0 | 1 (1) | 8 / 15 | 0 / 16 (1) | ok | FAIL |
| coach-chat | passed | passed | passed | 12 / 20 | "Coach name" | — | — (+1 already-selected tab) | 4 | 0 | 0 | 1 (1) | 7 / 18 | 0 / 20 (1) | n/a | n/a |
| coach-plan | passed | passed | N/A | 11 / 12 | "Coach name" | — | Delete this plan (+1 already-selected tab) | 4 | 0 | 0 | 1 (1) | 3 / 17 | 0 / 29 (5) | n/a | n/a |
| coach-setup | passed | passed | N/A | 29 / 30 | "Coach name" | — | — (+1 already-selected tab) | 3 | 0 | 0 | 1 (1) | 10 / 35 | 0 / 47 (1) | n/a | n/a |
| profile | passed | passed | N/A | 1 / 2 | — | — | SIGN UP | 1 | 0 | 0 | 1 (1) | 2 / 8 | 0 / 35 (7) | n/a | n/a |
| settings | passed | N/A | passed | 41 / 44 | — | — | SIGN UP, Nutrition CSV, Full backup (JSON), 🎯 Replay Tutorial, Reset all data, Delete Account | 3 | 0 | 0 | 1 (1) | 28 / 49 | 0 / 101 (3) | ok | ok |
| shopping-budget | passed | passed | passed | 20 / 53 | — | — | — (+1 already-selected tab) | 1 | 0 | 0 | 1 (1) | 40 / 59 | 0 / 92 (1) | ok | n/a |

Totals: axe 20 violations / 25 nodes · 179 targets under 44px · 10 contrast failures (56 text nodes over gradients/images not measured) · 0 console errors · 0 page errors across the 18 page scans.

### axe rules hit

| Rule | Impact | Pages | Nodes | Help |
|---|---|---|---|---|
| meta-viewport | critical | 18 | 18 | Zooming and scaling must not be disabled |
| color-contrast | serious | 1 | 6 | Elements must meet minimum color contrast ratio thresholds |
| scrollable-region-focusable | serious | 1 | 1 | Scrollable region must have keyboard access |

### Targets under 44x44 (most widespread)

| Control | Size | Pages |
|---|---|---|
| button "Back" | 22x27 | progress, photos, workout-detail, exercise-library, split-builder |
| button "Rename your coach" | 10x12 | coach-chat, coach-plan, coach-setup |
| button "New chat" | 79x32 | coach-chat, coach-plan, coach-setup |
| button[tab] "Overview" | 92x33 | progress, photos |
| button[tab] "Goals" | 70x33 | progress, photos |
| button[tab] "Calendar" | 90x33 | progress, photos |
| button[tab] "Photos" | 78x33 | progress, photos |
| button[tab] "PR Vault" | 87x33 | progress, photos |
| button "History" | 118x42 | train-hub, cardio |
| div[button] "Up next: Push 5 exercises plan" | 243x38 | home |
| button "Weekly Recap" | 353x42 | home |
| button "See all" | 58x25 | home |
| button "LOG" | 60x33 | home |
| button "ADD LIFT" | 353x42 | progress |
| button "Back" | 22x22 | pr-vault |
| button "LOG A PR WITHOUT A WORKOUT" | 353x42 | pr-vault |
| button "Camera" | 156x41 | photos |
| button "Library" | 156x41 | photos |
| button "THE SCIENCE" | 319x16 | cycle |
| button "Cardio" | 88x34 | train-hub |
| button "Quick Start" | 107x34 | train-hub |
| button "My Splits" | 118x42 | train-hub |
| button "Library" | 118x42 | train-hub |
| button "AI Builder" | 99x33 | train-hub |
| button "New" | 70x33 | train-hub |

### Contrast failures (most widespread fg/bg pairs)

| Colours | Ratio | Required | Pages | Sample text |
|---|---|---|---|---|
| #4186f6 on #2c2c2e @14px/800 | 3.96 | 4.5 | pr-vault | 132 kg |
| #7c5ce8 on #09060f @11px/800 | 4.36 | 4.5 | cycle | PMS WINDOW |

<!-- GENERATED:END -->

## How to read this

- Suite: `cd redesign/tests && RESULTS_DIR=baseline npx playwright test` (Chromium, iPhone 15 Pro viewport 393x852, dark, offline via `fixtures/index.mjs` routing). Run six times on 2026-09-08 while the harness was tuned; the last two runs (identical code) have identical outcomes, 78 passed / 25 failed (`node compare-runs.mjs`). `results.json`, `report/` and the metric files are from the final run.
- A **failed** test in the tables above is a finding on v6, not a harness fault: scans and state checks are `expect.soft`, so every failed test still ran to completion and its numbers are in `results.json`, `flow-metrics.jsonl`, `page-metrics.jsonl`, `axe.json`, `targets.json`, `contrast.json`, `global-summary.json`. Console errors and page errors are hard checks; they are 0 everywhere except flow 3 (D1).
- Tap counts are `tap()` calls actually made (`e2e/helpers.ts`). Typing and `selectOption` are 0 taps. ms is measured from the first `page.goto` to the success assertion, so it includes app boot (~600 ms) and is comparable only against the same harness on the demo.
- Flow 1 tap count with the onboarding steps (1A: overlay → guest modal → skip tutorial → first set) is 17; without them (1B, seeded guest) 14; the onboarding steps alone cost 3 taps.
- Crawl columns: "clicked / total" is clicks made vs the largest element set seen (tabs reveal more elements, so clicked can exceed total; cardio's 87 elements are the 40-activity catalogue behind the Log tab, capped by the 42 s budget). "Recoveries" is how often a click left the page and the harness re-seeded, reloaded and re-entered; a high number (Home 12, Train Hub 16, Exercise Library 14, PR Vault 11) means most controls on that page navigate elsewhere.
- Contrast "unknown" is text over a `linear-gradient` or image background, which the scanner does not composite; 56 such nodes across 18 pages (mostly headers and CTA buttons) are listed per page in `contrast.json → unknownItems` for the design auditors to measure by hand.

## Genuine app defects found (v6, evidence in the spec named)

| # | Severity | Defect | Where seen | Source |
|---|---|---|---|---|
| D1 | blocks nothing, but every save throws | `ReferenceError: syncBidirectional is not defined` fires on every workout save: `saveWorkout` calls `syncBidirectional()` as a free identifier, but the function is defined inside the pre-React IIFE and never exported. The save still lands (state updates precede the call) but the React handler ends in an uncaught error. | `e2e/flows/03-finish-review-save.spec.ts` (page error, hard fail) | call L57460, definition L465 (inside the IIFE that starts near L100) |
| D2 | blocks a task | The floating voice button (fixed, 50x50, bottom-right) covers controls: the Home cycle card **LOG** button and the AI Split Builder **Send answer** button cannot be tapped (Playwright: `<button aria-label="Start voice command"> intercepts pointer events`). | `pages/home.spec.ts` interactive (blocked "LOG"); `pages/split-builder.spec.ts` error state (needs Enter / forced tap) | VoiceButton L53718, fixed position L54052; cycle LOG L22735; AI builder send ≈L14000 |
| D3 | slows the core task | NumPad opens pre-filled with the current/recommended value (`useState(p.value)`) and digits append; the only editing key is `del`. Logging 100 kg x 8 over a 37.5 x 8 recommendation costs 5 extra taps (flow 2: 15 taps vs the 10 in user-flows.md). No clear key, no select-all-on-open. | `e2e/flows/02-log-set.spec.ts` (`clearTaps: 5`) | NumPad L9848, keys L9873 |
| D4 | data display | The header set counter excludes warm-up sets. The inherited first set (a warm-up in the last session) reads **"0 sets"** after it is marked done. | `e2e/flows/02-log-set.spec.ts` (`headerSets: "0 sets"`) | `totalSets` L10693-L10698 |
| D5 | data display, low | Set-table unit header derives from `row.kg === null`; a row without the `kg` field (undefined, e.g. rows stored before the field existed or the fixture's `lk_activeWorkoutRows`) renders **LB** while the profile is kg. | `pages/workout-log.spec.ts` populated (seeded rows show "LB") | `rowUnit` L12890; `mkRow` sets `kg: null` L10109 |
| D6 | missing state | Workout Detail for a session with no exercises shows header, Delete and a stray "0"; no empty-state copy. The "No exercises. This workout will be empty." string exists only in edit mode. | `pages/workout-detail.spec.ts` empty state (soft fail) | L17503 (edit mode only) |
| D7 | correctness (fail-open) | Beta code verification: the local format check rejects a malformed code as "Invalid code" before any request (so the error-state test never reached the network), but `validateBetaCodeRemote`'s `.catch` calls `onResult(true, null)`: a network failure while validating a well-formed code **accepts** it. | `pages/settings.spec.ts` error state (`softChecks`, shows "Invalid code") | local check L2722/L2731; fail-open catch L2751-L2753 |
| D8 | navigation | Browser back from **Cardio** does not return to Train: the cardio route is entered with `setScreen("cardio")`, not `go()`, so nothing is pushed onto history. Every other pushed screen (Progress, Cycle, Settings) pops correctly. | `e2e/global.spec.ts` "reach cardio" (`historyBack: false`) | L57628 vs `go()` L57534-L57553 |
| D9 | a11y, critical (axe) | `meta-viewport` disables zoom (`maximum-scale=1.0, user-scalable=no`) on all 18 pages. | `global.spec.ts`, `axe.json` (18 nodes) | L5 |
| D10 | a11y, serious (axe + contrast scan) | PR Vault est-1RM values `#4186f6` on `#2c2c2e` at 14 px/800 = **3.96:1** (9 nodes, axe reports 6). Cycle "PMS WINDOW" `#7c5ce8` on `#09060f` at 11 px/800 = 4.36:1. | `contrast.json`, `axe.json` pr-vault, cycle | PRHub est-1RM `var(--color-info)` ≈L30050; cycle PMS card |
| D11 | a11y, serious (axe) | Cycle Tracker horizontal chip strip (`overflow-x:auto`) is scrollable but not keyboard focusable. | `axe.json` cycle `scrollable-region-focusable` | CycleTrackerScreen ≈L25400 |
| D12 | targets | 179 interactive elements under 44x44 across the 18 pages (of 466 enumerated). Worst: shopping "Remove" 45x14 (x10), store chips 100x24 (x8), Back arrows 22x27 / 22x22 (x6), "Rename your coach" 10x12 (x3), set-number buttons 20x12 (x3), split day "Start day" 86x24 (x3), Coach plan "Edit" 21x12, "THE SCIENCE" disclosure 319x16, nav-adjacent tab bars 33-42 px tall (Progress, Train, Coach, Shop). Full list with selector paths in `targets.json`. | `global.spec.ts`, `targets.json` | per item |
| D13 | external calls in guest mode | Opening an exercise detail sheet fires two requests the 0C routing table does not know: worker `/yt-search` and an exercise GIF from `static.exercisedb.dev`. Both were answered `200 {}` by the harness and produced no console error; they show as `unexpectedRequests` in flow 1's metrics. | `e2e/flows/01-guest-first-set.spec.ts` (`unexpectedRequests: 2`) | ExerciseDetailModal L7070 (`/yt-search`), GIF ≈L7300 |
| D14 | no visible confirmation | Flow 8 (change units) has no unit-bearing value anywhere on Home, so returning Home shows no evidence the setting changed (`homeShowsUnit: false`); the only confirmation is the Settings button label. | `e2e/flows/08-units-settings.spec.ts` | HomeScreen stat tiles L26547+ |
| D15 | destructive without confirm (not exercised) | Split card **Delete** (L15847), Progress **Unpin this exercise**, Coach **Delete this plan**, Shopping **Remove** were skipped by the crawl as destructive; user-flows.md notes the split Delete has no confirmation. | recorded as `skipped` in `page-metrics.jsonl` | L15847-L15853 |

Harness observations that are not app defects: (a) `Failed to load resource: net::ERR_FAILED` console lines appear only in error-state tests where the harness aborts requests; they are excluded from the hard check and counted as `abortNoise`. (b) "Coach name" appears as a non-responder on the three Coach pages because the rename input is already focused when the crawl clicks it. (c) Already-selected tabs are skipped, not clicked (counted in the Skipped column). (d) Train Hub "Start Day A" is reported blocked ("element is not visible"): the day header Start button of a split appears while the expand animation runs and is hidden again by the time the crawl retries; it is reachable by hand.

## Blocked / not covered

- Error states marked N/A in the test title have no network branch on that page (page-map.md), or the branch needs a multi-step flow not exercised in baseline: Coach Setup interview POST (six answers first), Exercise Library detail fetch (not reachable from the Library tab in v6), Progress Goals AI estimate (inside a goal detail).
- Contrast over gradients/images (56 text nodes) is reported as `unknown`, not measured.
- Video: every flow spec has a `video.webm` under `baseline/artifacts/<flow>/` (Playwright `video: 'on'` for the flows project).
