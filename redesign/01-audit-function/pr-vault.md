# pr-vault — PRHub (L29165-30152), a tab of Progress

## 1. Purpose

Browse the lifts you hold records for and open one to see whether its estimated 1RM is going up.

## 2. Feature inventory

| Feature | Component / line | Status | Note |
|---|---|---|---|
| Header "PR VAULT" + back → Progress Overview | L29726-29741 | working | `pr-vault-populated.png`; in-app back `ok` |
| Inner tab bar Overview / PR Vault | L29742-29770 | **dead** | renders only in the `!p.onBack` branch; the sole call site (ProgressPage L28438-28452) passes `onBack`, so it never mounts. Absent from all 9 captures — `pr-vault-populated.png` shows the h1 branch |
| Overview sub-view: stat grid, "Last 7 Days" strip, volume, PR count | L29771-29965 (last7 L29689) | **dead** | gated on `tab==="overview"`; `tab` is pinned to `defaultTab:"prs"` (L28452) and only the dead tab bar can change it. ~195 lines, no capture; `screenshots/index.md` 437 concurs |
| Search exercises | input L29985, filter L30039 | working | `pr-vault-populated.png`; crawl responded |
| LOG A PR WITHOUT A WORKOUT | L29999-30023 | working | `-log-pr.png` |
| Lift row (name, muscle, 1RM / 6-8 REP / EST. 1RM chips) | L30049-30121 | working | `pr-vault-populated.png`, `-scrolled-2.png`; 9 rows, compounds first |
| 1RM chip | L30119 | hidden | "—" on all 9 rows in both list captures; only a manual 1RM entry fills it |
| Detail: 1 REP MAX / WORKING / ESTIMATED 1RM cards | L29452-29529 | working | `-detail.png` |
| PROGRESSION polyline (app's only per-lift line chart) | L29530-29589 | working | `-detail.png`; 6 points, flow 4 `chartPoints:6` |
| Range 30D / 90D / ALL | L29590-29593 | working, no-op on seed | `-detail-range.png` (90D) identical to `-detail.png` (ALL): same 6 sessions, same axis |
| STRENGTH PROFILE bar chart | L29594-29662 | redundant | repeats the est-1RM cards above; `-detail-full.png` |
| Log New PR (detail) | L29663-29687 | working | prefills current lift |
| Log sheet: exercise select, rep chips, weight, SAVE PR | L29224-29402 | working | `-log-pr.png`; from the list it defaults to exercise 107 "Incline DB Fly" (L29179), a lift with no record |
| doLog validation ("Enter both…", "Not a PR — your best at N reps is still X") | L29188-29200 | working | no toast capture |

## 3. Task walkthrough

Flow 4 (Home → lift chart) is the only flow touching this page.

| # | Step | Video ts | Notes |
|---|---|---|---|
| — | boot | 412 ms | |
| 1 | Home "VIEW PROGRESS" | 1382 ms | 8th Home block, needs a scroll (`flow-4-step0.png`) |
| 2 | Progress tab "PR Vault" | 2318 ms | 5th of 5 tabs, 87x33 px (`flow-4-progress.png`) |
| 3 | row "Barbell Bench Press" | 3268 ms | `flow-4-pr-vault.png` |
| — | chart asserted | 3803 ms | `flow-4-chart.png` |

Taps 3 / expected 3, 893 ms first-nav→assert, 0 errors, pass (`flow-metrics.jsonl` 4). Hesitation: finding Progress (no nav tab, Home-only entry); a chart with no y-axis and one value label; tapping 90D and seeing nothing change.

## 4. State coverage

| State | Capture | Present? | Content |
|---|---|---|---|
| populated | `pr-vault-populated.png` + 6 more | present (2a) | correct |
| empty | `pr-vault-empty.png` | present (2b: trophy glyph + "No PRs yet") | **generic**: no instruction |
| loading | — | N/A | no network in PRHub (page-map 2.3 "L/X n/a") |
| error | — | N/A | same |

A = 2, M = 0, W = 0, G = 1.

## 5. Baseline failures

Page specs all passed: 12/12 clicked, 0 non-responders, 0 console/page errors, 11 recoveries (every row navigates). The one failing test is `global.spec.ts` "reach pr-vault…":

| Failure | Measured | Cause |
|---|---|---|
| axe color-contrast, 6 nodes | 3x "1RM" #58585d on #232325 @11px/700 = **2.21:1**; 3x est-1RM #4186f6 on #2c2c2e @14px/800 = **3.96:1** (axe scans the viewport only) | chip label L30119, value L30121 |
| contrast scan, 9 / 44 fail | all 9 est-1RM values at 3.96:1; 2 unknown (gradient CTA, FAB) | `BLU` on `CARD` chip, L30121 |
| targets, 2 / 18 under 44px | Back 22x22 (L29726), LOG A PR… 353x42 (L29999) | `targets.json` |
| axe meta-viewport, 1 node | zoom disabled, global L5 (D9) | not page-owned |

D10 attributes all 6 axe nodes to est-1RM; `axe.json` shows 3 are the "1RM" label at 2.21:1 — a worse, unrecorded defect on the same chip.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `pr-vault-populated.png`: title, search, 1 accent-filled control, list of lifts with records; job named under 5 s. Shortfall: that one primary-styled element (LOG A PR WITHOUT A WORKOUT) is the secondary job; the real action, opening a row, is a plain card |
| Feature completeness | 3 | List, detail, chart work (`-populated.png`, `-detail.png`). Dead: tab bar + Overview sub-view, absent from all 9 captures. Redundant: STRENGTH PROFILE (`-detail-full.png`). Hidden: 1RM chip "—" on 9/9 rows |
| Task success | 5 | Flow 4 passed first attempt, 3/3 taps, `chartPoints:6`; crawl 12/12 responded, 0 non-responders (`page-metrics.jsonl` 35) |
| Speed | 5 | 3 taps = expected 3 = best-known, 893 ms (`flow-metrics.jsonl` 4); no extra screen changes |
| State handling | 4 | A=2 (loading/error N/A), M=0, W=0, G=1: `pr-vault-empty.png` "No PRs yet" is correct but instruction-free. Band table → 4 |
| Data correctness | 3 | Seed `lk_prs`: 703 165x10 → 220 kg (`-scrolled-2.png`) ✓; 221 110x6 → 132 ✓; 111 72.5x8 → 91.75 on chip and card ✓. Precision splits on one screen (`-detail.png`): cards 91.75 (0.25-quantised, true 91.83), bars below 91.8 / 84.6 (0.1). Dates split: card "5 days ago", axis "2026-07-30" |
| Error recovery | N/A | No failure surface: no network (page-map 2.3), no error capture; the only failure path, the doLog toast, is uncaptured |

Function mean **4.0** (6 scored).

## 7. Keep, fix, cut

**Keep**
- Per-lift est-1RM polyline: the app's only trend chart, and the payload of flow 4 (`-detail.png`).
- Three-card detail summary (`-detail.png`).
- Row list, compound-first ordering, search: 12/12 responded, 3-tap reach.
- doLog's rejection toasts: cause named, typed values kept (L29188-29200).

**Fix**
- Row chip contrast: est-1RM 3.96:1, "1RM" label 2.21:1 (L30119-30121) — the app's only contrast failures besides Cycle.
- Back 22x22 (L29726) below 44px.
- Precision: 91.75 vs 91.8 for the same estimate on one screen (L29478 vs L29597).
- Range control: no feedback when a range excludes nothing (`-detail-range.png` = `-detail.png`).
- Log sheet defaults to exercise 107 (L29179); default to the top row or unset.
- Empty state "No PRs yet" carries no instruction (L30038).

**Cut**
- Inner Overview tab bar and the entire `tab==="overview"` sub-view (L29742-29965). Unreachable from the only call site: a second, competing purpose no user has seen, against the north star's one job per screen.
- STRENGTH PROFILE bar chart (L29594-29662): restates the est-1RM above it in a second rounding convention.
- 1RM chip (L30119): "—" on every seeded row; a third of the row's data width says nothing.
