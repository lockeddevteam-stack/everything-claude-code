# LOCKED Redesign Swarm v4: progress

Orchestrator log. Updated at the end of every wave.

## Setup (2026-09-08)

- Input `input/locked-current-v6.html` was absent from the repo. Recovered from the live deployment (locked-seven.vercel.app, last-modified 2026-09-03) via the Vercel connector. Verified: v6.0 header, 4,408 `React.createElement` calls, 1,837,935 chars.
- Shell egress is blocked except registry.npmjs.org. Vendor libs pulled from npm: react 18.3.1 and react-dom 18.3.1 (sha384 matches the original integrity attributes), @supabase/supabase-js 2.45.4 (umd/supabase.js plus chunk 591.supabase.js), @zxing/library 0.21.3 (lazy-loaded barcode lib).
- `tests/app/index.html` = source with the four CDN URLs rewritten to `../../input/vendor/`, integrity attributes dropped. No other change.
- `tests/serve.mjs` static server on 4173. `/sw.js` and `/manifest.json` mapped to no-op stubs in `tests/app/`.
- Playwright 1.56.1, axe-core 4.10.3 installed under `tests/node_modules` (gitignored).
- Smoke boot with `lk_guestMode=1` only: app renders onboarding screen, one external request to workers.dev `/app-version` (to be routed by the 0C fixture). Landing on Home needs more keys; 0A is finding them.

## Wave 0: complete, Gate 0 passed (2026-09-09)

| Agent | Output | Result |
|---|---|---|
| 0A Page Mapper | page-map.md, storage-keys.md | 18 pages mapped, 87 lk_ keys, guest boot keys identified |
| 0B Flow Mapper | user-flows.md | 8 flows, selectors and tap counts, all reachable in guest mode |
| 0C Offline Harness | tests/fixtures, smoke.spec.ts | 53 seeded keys, smoke 3/3 green, zero console errors, zero unrouted requests |
| 0D Screenshot Harvester | screenshots/current | 326 PNG, 8 flow videos, 8 step logs, index.md |
| 0E Design System Extractor | design-system-current.md | sprawl table measured and corrected |
| 0F Rubric Author | rubric.md | 2 rubrics, 11-item checklist, 3 revision rounds |
| 0G Calibration Pair | calibration.md, calibration-A/B.md | converged round 3, max delta 1 on every criterion |
| 0H Baseline Test Author | tests/e2e, baseline/ | 78 passed, 25 failed (all findings), stable across two runs |

Corrections to the directive's stated facts, measured by 0E: 30 border radii not 24; 51 keyframes not 24; 119 emoji occurrences not 65; 57 hex literals confirmed, plus 483 more built at runtime by string concatenation that a regex cannot see. The real stylesheet is a 2,262-line `var CSS` string, not the 54-line style block, and it contains attribute selectors that rewrite inline radii after render, so the radius in the JS is not the radius on screen. The Ds* primitives named as the component library seed have two call sites in the entire app.

Baseline defects worth carrying into the audits: every workout save throws a ReferenceError (the save still lands); the floating voice button covers two primary actions; the numeric keypad opens pre-filled and only deletes, costing 15 taps to log a set against a best known 3; a unit label bug shows kg values under an LB header; browser back from Cardio does not return to Train; 179 of 466 interactive targets are under 44px; zoom is disabled app-wide.

Calibration found no genuine disagreement between scorers. All three deltas of 2 or more traced to unstated measurement method: a synthetic pointer event that never triggers :active, zero-valued padding counted as on-grid, and no definition of whether a state that branches in code but renders nothing counts as present. Rules for all later scoring are in calibration.md.

Gate 0: passed.

## Wave 1 and 2: complete

Eighteen pages scored on both rubrics, two scorers per criterion. Means are in
`10-final/scorecard.md`. Design was the weaker half everywhere: eleven of eleven
scored pages landed between 1.8 and 2.6.

## Build: complete

Eleven screens built as static HTML, CSS and vanilla JavaScript that open from
disk, assembled into `10-final/locked-demo.html`. What changed and why is in
`10-final/changelog.md`; what it measures against the original is in
`10-final/scorecard.md`.

Measured, both themes: zero targets under 44px against 179 of 466 in the
original, zero axe violations, zero sub-AA text, zero console errors, no
horizontal overflow, six type sizes, five radii, two durations. Logging one set
costs 9 taps typing new numbers or 1 accepting last session's, against 15 in the
original. State changes no longer lose focus, caret or scroll on any screen.
The assembled demo passes 86 of 86 checks.

Not re-scored: the judgment half of the rubric. Scoring my own build on
criteria a reader judges would be worth less than saying it has not been done.
`10-final/scorecard.md` says what that pass would take.

Not built: cardio, cycle, photos, pr-vault, profile, shopping-budget and
workout-detail. Fuel was redesigned separately. A whole-app score cannot be
compared against the original's eighteen-page average until those exist.
