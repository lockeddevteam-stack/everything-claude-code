# LOCKED Redesign Swarm v4: progress

Orchestrator log. Updated at the end of every wave.

## Setup (2026-09-08)

- Input `input/locked-current-v6.html` was absent from the repo. Recovered from the live deployment (locked-seven.vercel.app, last-modified 2026-09-03) via the Vercel connector. Verified: v6.0 header, 4,408 `React.createElement` calls, 1,837,935 chars.
- Shell egress is blocked except registry.npmjs.org. Vendor libs pulled from npm: react 18.3.1 and react-dom 18.3.1 (sha384 matches the original integrity attributes), @supabase/supabase-js 2.45.4 (umd/supabase.js plus chunk 591.supabase.js), @zxing/library 0.21.3 (lazy-loaded barcode lib).
- `tests/app/index.html` = source with the four CDN URLs rewritten to `../../input/vendor/`, integrity attributes dropped. No other change.
- `tests/serve.mjs` static server on 4173. `/sw.js` and `/manifest.json` mapped to no-op stubs in `tests/app/`.
- Playwright 1.56.1, axe-core 4.10.3 installed under `tests/node_modules` (gitignored).
- Smoke boot with `lk_guestMode=1` only: app renders onboarding screen, one external request to workers.dev `/app-version` (to be routed by the 0C fixture). Landing on Home needs more keys; 0A is finding them.

## Wave 0

In progress. Batch 1 launched: 0A, 0B, 0E, 0F.

Batch 1 done: 0A page-map + storage-keys (87 lk_ keys), 0B user-flows, 0E design-system-current (sprawl table corrected: 30 radii, 51 keyframes, 119 emoji, Ds* primitives used at 2 call sites), 0F rubric.
0C done: seed fixtures (53 keys), routing, smoke spec 3/3 green, zero console errors.
0D and 0H first attempt killed by API spend limit (429) at ~20:00 UTC; relaunched 22:40 UTC.
