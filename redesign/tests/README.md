# LOCKED redesign test harness

Offline Playwright harness for the current app (`tests/app/index.html`, v6.0 with vendored React/Supabase) and, later, the demo (`10-final/locked-demo.html`). Everything runs from this directory.

## Run

```sh
cd redesign/tests
npx playwright test                       # all specs, results in baseline/
npx playwright test e2e/smoke.spec.ts     # boot smoke only
npx playwright test --project=flows       # flow specs with video
APP_URL=/10-final/locked-demo.html RESULTS_DIR=final npx playwright test   # against the demo
node fixtures/gen-seed.mjs [YYYY-MM-DD]   # regenerate fixtures/seed-data.json
```

The config starts `node serve.mjs 4173` itself (`reuseExistingServer: true`, so a server you started by hand is reused). Device is `iPhone 15 Pro` forced onto Chromium (only Chromium is installed; never run `playwright install`). Reporters: list, `RESULTS_DIR/results.json`, `RESULTS_DIR/report/` (HTML, never auto-opens). Projects: `flows` (`e2e/flows/*.spec.ts`, video on) and `pages` (`e2e/pages/*`, `e2e/global.spec.ts`, `e2e/smoke.spec.ts`, no video). Screenshots only on failure, retries 0, 60 s timeout.

## Fixtures

| File | Contents |
|---|---|
| `fixtures/gen-seed.mjs` | Deterministic generator (mulberry32 seed 20260908). `generateSeed(anchorISO)` returns `{ lk_key: exactStoredString }`. CLI writes `seed-data.json`. |
| `fixtures/seed-data.json` | Frozen output, anchor **2026-09-08** (53 keys, 64 KB). Builders (Wave 5) read this file. All dates are relative to the anchor: last lifting session 2026-09-07, oldest 2026-07-30. |
| `fixtures/exercise-db.json` | The 225 built-in exercises extracted from `GROUPS` (source L2975-L4257): `{id,name,eq,group,muscle,gid,sid}`. Ids used in the seed are real (111 Barbell Bench Press, 701 Barbell Squat, 221 Barbell Deadlift, ...). Note: id 107 is "Incline DB Fly", not Bench Press. |
| `fixtures/coach-replies.json` | 5 worker replies in the exact shape the app parses (`{content:[{type:"text",text}]}`), plus `proactiveTip`, `interview`, `appVersion`, `storeSearch`, and the mapping rule (keyword on the last user message, else sequence by request count). Reply 4 carries a `###PLAN_START###` block: the plan is not a separate endpoint, it is parsed out of the chat text (source L50241-L50260). |
| `fixtures/index.mjs` | Helpers: `seedStorage(page, overrides?, {anchor, frozen})`, `routeNetwork(page)`, `collectConsoleErrors(page, {allow})`, `gotoApp(page)`, `states.*`, `forceNetworkError(log)`, `APP_URL`, `HOME_READY`. |

### Seed dates: runtime vs frozen

The app gates several things on *today* (proactive tip cache `lk_proactiveTip.date`, the check-in card via `lk_feedback`, throwback dismissal within 3 days, "next split day" via `history[0].dateISO`). `seedStorage()` therefore regenerates the seed relative to the real current date by default, so specs keep passing on any day. Pass `{ frozen: true }` to load `seed-data.json` byte-for-byte, or `{ anchor: '2026-09-08' }` to pin. The content (loads, names, counts) is identical either way; only dates shift.

### What the seed contains

- Boot gates: `lk_guestMode="1"` (raw), `lk_profile` Cesco/cesco, `useKg:true`, `sex:"female"` (Cycle Tracker reachable), `lk_tutorialSeen`, `lk_theme "dark"`, `lk_textScale 100`, `lk_weightStorageUnit "kg"`, migration flags (`prDatesFixed`, `cardioMigrated`, `weightsKgMigrated`, `reminderMigrated`) so boot rewrites nothing.
- Training: 18 lifting sessions (PPL, 3 per week, 6 weeks, ending yesterday, 5 exercises each, weekly progression, warm-up + back-off sets on compounds, `vol "<n> kg"`, `dur`, `date`, `dateISO`, `id`), 4 cardio records (schema v2), 3 splits (PPL, Upper/Lower, Full Body 3x), 12 PRs mined from the history so they agree with it (8 dated in the last 7 days), featured lifts 111/701/221, one custom exercise, one exercise note, one cardio favourite, cardio prefs.
- Progress/body: 7 weekly weight-log points, 2 body-fat points, 3 goals, 2 progress photos (1x1 JPEG data URLs), `lk_throwbackDismissed` today, `lk_proactiveTip` today, `lk_homeLayout {hidden:{insight:true}}`.
- Cycle: `lk_mcProfile` set up (last start 10 days ago, 28/5), 6 logged days.
- Coach: 4 messages + matching hist, 12-week plan (3 phases), instructions, one memory item, style `direct`, data prefs, check-in frequency 1, 6 feedback entries (one today).
- Shopping/Budget: 10 list items (2 checked), 4 pantry items (1 staple, 1 empty), 1 enabled store (its `/store-search` call is routed), budget target 120 with 3 purchases.
- Supplements: 2 daily (Home supps card), empty supp log.
- Settings: `restEnabled`, `hidePartials false`, `holdTipSeen`, `gamingLayer false`, `voiceEnabled true`, `voiceBtnCorner "br"`, `perfTracking false`.

`states.empty()`, `states.emptyTraining()`, `states.male()`, `states.lbs()`, `states.activeWorkout()` (Resume dialog → Review), `states.light()`, `states.tutorial()`, `states.coldStart()` return override maps. Override values may be objects (stringified for you) or `null` (key removed). `forceNetworkError(log)` aborts every later external request to reach the error branches.

## Network routing

`routeNetwork` intercepts `**/*`, passes `127.0.0.1`/`localhost` through, and fulfils everything else: `*.supabase.co` → `200 {}`; worker `/app-version` → `appVersion`; `/store-search` → `storeSearch`; worker `/` → proactive tip, interview, or coach reply by system-prompt/keyword; any other host or endpoint → `200 {}` (images get a 1x1 GIF) and an entry in `log.unexpected` plus a `console.warn` in the test process. The smoke asserts `log.unexpected` is empty. In a seeded boot the only external call is `/app-version`.

## Smoke result (2026-09-08)

`npx playwright test e2e/smoke.spec.ts`: 3 passed. Boot to Home with seeded name and data, coach chat round-trip through the routed worker, empty state boot. Zero console errors, zero page errors, zero unrouted requests. A manual walk of all 18 pages with the seed (Home, Train, History, Coach chat/plan/setup, Profile, Settings, Progress, PR Vault list + detail chart, Goals, Photos, Calendar, Cycle Tracker, Fuel → Shop → Budget → Pantry, Cardio) also produced zero errors.

## Allowlisted console errors

None. `ALLOWED_CONSOLE_ERRORS` in `e2e/smoke.spec.ts` is empty; add an entry with a reason only for an error inherent to the app.

## Known quirks for spec authors

- `iPhone 15 Pro` is WebKit in Playwright's device list; the config overrides `browserName` to Chromium.
- The app scrolls inside its own shell, so `fullPage` screenshots do not capture below the fold; scroll the element instead.
- PR Vault detail Back returns to the PR list, not the Progress tab bar (two Backs to reach the tabs).
- `lk_ui_*` hub tabs persist; the seed leaves them absent so every run starts on the default tab.
- With `lk_myStores` non-empty, typing in the shopping input fires `/store-search` (routed). Set `lk_myStores: []` to keep that page fully offline.

## Baseline suite (0H)

Specs live in `e2e/flows/<n>-<slug>.spec.ts` (8 flows), `e2e/pages/<slug>.spec.ts` (18 pages, thin wrappers over `pageSuite()` in `e2e/helpers.ts`) and `e2e/global.spec.ts` (nav/back, axe, 44 px targets, contrast). Everything page-specific (entry path, ready selector, empty/error seeds and triggers, crawl skip list) is the `PAGES` table in `e2e/helpers.ts`; Wave 4G rewrites that table for the demo's `data-testid` hooks.

- `tap(page, selector)` wraps click and counts; a flow's tap count is the number of `tap()` calls actually made. Typing and `selectOption` are 0 taps.
- `runFlow()` records `{taps, expectedTaps, ms (first navigation → success assertion), consoleErrors, pageErrors, pass}` as a test attachment (`metrics`) and appends a line to `RESULTS_DIR/flow-metrics.jsonl`. 7C reads the last line per flow.
- Page specs write `RESULTS_DIR/page-metrics.jsonl` (states rendered, crawl results: clicked, non-responders, blocked clicks, skipped destructive labels, recoveries). The crawl clicks every visible `button, [role=button], a, input, select, textarea, [tabindex]` inside `.lk-shell` (nav and the voice button excluded), re-enumerating after each click, capped at 60 clicks / 42 s per page, Escape + Close/Cancel/backdrop between, reseed+reload when the page is left. Labels matching Delete / Reset / Sign out / Clear / Remove / Discard / Forget / Unpin / Start Fresh / Sign up / Sign in are skipped and recorded.
- `global.spec.ts` writes `RESULTS_DIR/axe.json`, `targets.json`, `contrast.json`, `global-summary.json` (per page: axe violations, targets under 44 px with selector path, contrast failures with fg/bg/ratio; text over gradients/images is reported as `unknown`). Per-page raw scans are in `RESULTS_DIR/scans/`.
- Failures on the current app are findings: scans and state checks use `expect.soft`; console errors and page errors stay hard. In error-state tests Chromium's own `net::ERR_FAILED` console lines from the aborted requests are excluded and counted as `abortNoise`.
- Outputs: `baseline/results.json`, `baseline/report/index.html` (+ copy `baseline/report.html`; attachments stay under `report/data/`), `baseline/SUMMARY.md` (tables generated by `node summarize-baseline.mjs baseline`, defects hand-written). `node compare-runs.mjs a/results.json b/results.json` checks two runs have identical outcomes.
