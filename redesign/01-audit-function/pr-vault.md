# pr-vault — PRHub (L29165-30152), a tab of Progress

## 1. Purpose

Browse every lift you hold a record for and open one to see whether its estimated 1RM is going up.

## 2. Feature inventory

| Feature | Component / line | Status | Note |
|---|---|---|---|
| Header "PR VAULT" + back → Progress Overview | L29726-29741 | working | `pr-vault-populated.png`; baseline in-app back `ok` |
| Inner tab bar Overview / PR Vault | L29742-29770 | **dead** | renders only in the `!p.onBack` branch; the sole call site (ProgressPage L28438-28452) passes `onBack`, so it never mounts. No capture in 9 shows it; `pr-vault-populated.png` shows the h1 branch instead |
| Overview sub-view: stat grid, "Last 7 Days" strip, 7-day volume, PR count | L29771-29965 (last7 L29689, totalVol7 L29702) | **dead** | gated on `tab==="overview"`; `tab` is fixed to `defaultTab:"prs"` (L28452) and only the dead tab bar can change it. ~195 lines, no capture, `screenshots/index.md` line 437 records the same |
| Search exercises | input L29985 (filter L30039-30040) | working | `pr-vault-populated.png`; crawl "Search exercises..." responded |
| LOG A PR WITHOUT A WORKOUT | L29999-30023 | working | `pr-vault-populated-log-pr.png` |
| Lift row (name, muscle, 1RM / 6-8 REP / EST. 1RM chips) | L30049-30121 | working | `pr-vault-populated.png`, `-scrolled-2.png`; 9 rows, compounds first (L30043-30046) |
| 1RM chip | L30119 | hidden | reads "—" on all 9 rows in both list captures; only a manual 1RM entry ever fills it, and the manual sheet defaults elsewhere |
| Detail: 1 REP MAX / WORKING WEIGHT / ESTIMATED 1RM cards | L29452-29529 | working | `pr-vault-populated-detail.png` |
| PROGRESSION — EST. 1RM polyline (app's only per-lift line chart) | L29530-29589 | working | `pr-vault-populated-detail.png`; 6 points, flow 4 `chartPoints:6` |
| Range 30D / 90D / ALL | L29590-29593 | working, no-op on seed | `-detail-range.png` (90D) is identical to `-detail.png` (ALL): same 6 sessions, same 2026-07-30→2026-09-03 axis. Only 30D changes anything |
| STRENGTH PROFILE bar chart | L29594-29662 | redundant | same est-1RM numbers as the cards above, one per rep record; `-detail-full.png` |
| Log New PR (from detail) | L29663-29687 | working | prefills `logEx` = current lift |
| Log sheet: exercise select, rep chips, weight, SAVE PR | L29224-29402 | working | `-log-pr.png`; defaults to exercise 107 "Incline DB Fly" (L29179) when opened from the list — a lift the user has no record for |
| doLog validation ("Enter both…", "Not a PR — your best at N reps is still X") | L29188-29200 | working | source only, no toast capture |

## 3. Task walkthrough

Flow 4 (Home → one lift's progress chart) is the only flow touching this page.

| # | Step | Video ts | Notes |
|---|---|---|---|
| — | boot | 412 ms | |
| 1 | Home "VIEW PROGRESS" | 1382 ms | 8th default Home block, needs a scroll (`flow-4-step0.png`) |
| 2 | Progress tab "PR Vault" | 2318 ms | 5th of 5 tabs, 87x33 px (`flow-4-progress.png`) |
| 3 | row "Barbell Bench Press" | 3268 ms | `flow-4-pr-vault.png` |
| — | chart asserted | 3803 ms | `flow-4-chart.png` |

Taps 3 / expected 3, 893 ms first-nav→assert, 0 console/page errors, pass (`flow-metrics.jsonl` line 4). Hesitation points: finding Progress at all (no nav tab, Home-only entry); reading a chart with no y-axis and no value labels except the endpoint; tapping 90D and seeing nothing change.

## 4. State coverage

| State | Capture | Present? | Content |
|---|---|---|---|
| populated | `pr-vault-populated.png`, `-full`, `-scrolled-2`, `-detail`, `-detail-range`, `-detail-full`, `-log-pr` | present (test 2a) | correct |
| empty | `pr-vault-empty.png` | present — trophy glyph + "No PRs yet" not in the populated frame (test 2b) | **generic**: states absence, no instruction; the CTA above is unchanged |
| loading | — | N/A | no network in PRHub (page-map 2.3 "L/X n/a"); spec titled "error state N/A" passes |
| error | — | N/A | same |

A = 2, M = 0, W = 0, G = 1.

## 5. Baseline failures

Page specs: populated passed, empty passed, error N/A, interactive 12/12 clicked, 0 non-responders, 0 blocked, 0 console/page errors, 11 recoveries (every row navigates). The failing test is `global.spec.ts` "reach pr-vault…", three soft assertions:

| Failure | Measured | Cause |
|---|---|---|
| axe color-contrast, 6 nodes | 3x "1RM" `--color-text-muted` #58585d on #232325 @11px/700 = **2.21:1**; 3x est-1RM `--color-info` #4186f6 on #2c2c2e @14px/800 = **3.96:1** (axe scans the visible viewport only) | chip label L30119 and value L30121 |
| contrast scan, 9 / 44 fail | all 9 est-1RM values (132, 98.25, 110.75, 91.75, 220, 31.75, 38, 79.25, 76.75 kg) at 3.96:1; 2 unknown (gradient CTA, voice FAB) | `BLU` on `CARD` chip, L30121 |
| targets, 2 / 18 under 44px | Back 22x22 (L29726-29740), LOG A PR WITHOUT A WORKOUT 353x42 (L29999) | `targets.json` |
| axe meta-viewport, 1 node | zoom disabled, global L5 (D9) | not page-owned |

D10 in `SUMMARY.md` attributes all 6 axe nodes to est-1RM; `axe.json` shows 3 of them are the "1RM" label at 2.21:1 — a worse, unrecorded defect on the same chip.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `pr-vault-populated.png`: title "PR VAULT", search, one accent-filled control, list of lifts with records; job named in under 5 s. Shortfall: the single primary-styled element (LOG A PR WITHOUT A WORKOUT) is the secondary job — the page's real action is opening a row, which is styled as a plain card |
| Feature completeness | 3 | Core list + detail + chart work (`-populated.png`, `-detail.png`). Dead: inner tab bar and the whole Overview sub-view, absent from all 9 captures. Redundant: STRENGTH PROFILE repeats the est-1RM cards (`-detail-full.png`). Hidden: 1RM chip "—" on 9/9 rows |
| Task success | 5 | Flow 4 passed, 3/3 taps, `chartPoints:6`, 0 errors; crawl 12/12 responded, 0 non-responders (`page-metrics.jsonl` line 35); in-app back `ok` |
| Speed | 5 | 3 taps = expected 3 = best-known for this flow, 893 ms (`flow-metrics.jsonl` line 4); zero extra screen changes |
| State handling | 4 | A=2 (loading/error N/A, page-map 2.3), M=0, W=0, G=1: `pr-vault-empty.png` shows "No PRs yet", correct but instruction-free. Band table → 4 |
| Data correctness | 3 | Seed `lk_prs`: 703 = 165 kg x 10 → 220 kg est shown (`-scrolled-2.png`) ✓; 221 = 110 x 6 → 132 kg ✓; 111 = 72.5 x 8 → chip and card both 91.75 kg ✓. Precision splits on one screen: `-detail.png` cards read 91.75 kg (0.25 quantised, true value 91.83) while the bars directly below read 91.8 and 84.6 (0.1). Dates split too: card "5 days ago", chart axis "2026-07-30" |
| Error recovery | N/A | No failure surface on this page: no network (page-map 2.3), no error capture exists; the only failure path is the doLog toast, uncaptured |

Function mean **4.0** (6 scored).

## 7. Keep, fix, cut

**Keep**
- Per-lift est-1RM polyline: the only trend chart in the app and the payload of flow 4 (`-detail.png`, `chartPoints:6`).
- Three-card detail summary (1RM / working / estimated) — one card per rep count would be a wall (`-detail.png`).
- Row list with compound-first ordering and search; 12/12 controls responded, 3-tap reach.
- doLog's two rejection toasts: cause named, sheet and typed values kept (L29188-29200).

**Fix**
- 6 axe nodes: est-1RM 3.96:1 and "1RM" label 2.21:1 on the row chip (L30119-30121) — the app's only contrast failures besides Cycle.
- Back 22x22 (L29726) below 44px.
- Precision: 91.75 vs 91.8 for the same estimate on one screen (L29478 vs L29597).
- Range control gives no feedback when a range excludes nothing (`-detail-range.png` = `-detail.png`).
- Log sheet defaults to exercise 107 from the list entry (L29179); default to the top row or to unset.
- Empty state "No PRs yet" carries no instruction (L30038).

**Cut**
- Inner Overview tab bar and the entire `tab==="overview"` sub-view (L29742-29965). Unreachable from the only call site, so it does nothing for the north star's "one obvious job per screen" — it is a second, competing purpose that no user has ever seen.
- STRENGTH PROFILE bar chart (L29594-29662): restates the est-1RM already given above it and adds a second rounding convention; it fails to add any information the cards do not.
- 1RM chip on the row (L30119): "—" on every seeded row, so it spends a third of the row's data width saying nothing.
