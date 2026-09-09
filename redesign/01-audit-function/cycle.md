# Function audit — Cycle Tracker (`cycle`)

## 1. Purpose
A private daily menstrual log that predicts the next period and advises how to train and eat around it — tracker, calendar and almanac on one screen.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Cycle ring, day/phase/countdown, drag-preview | L25419-25475 | working | `cycle-populated-full.png` "CYCLE DAY 11 / Follicular / Period in ~18d" |
| Log Period toggle (inline) | `quickLogPeriod` L25194 | working | interactive log: "Log Period"→"Logged" responded |
| Symptoms → McLogSheet | L25506, L23147 | working | `cycle-populated-log-sheet.png` |
| More → McLogSheet (same sheet, same date) | L25585 | redundant | `cycle-populated-log-more.png` byte-identical to `cycle-populated-log-sheet.png` (md5 d08cba93) |
| Energy inline 1–5 bar | L25560 | working | interactive log, "Energy 1/5"…"5/5" responded |
| Phase card, prediction chips (period/fertile/PMS) | L25780 | working | `cycle-populated-full.png` |
| McTrainingCard: go-lighter / keep-plan, writes `coach` flag | L24654 | working | `cycle-populated-full.png` TRAINING card |
| McHealthCard RED-S/amenorrhea flag, reads `history` volume spike | `mcAthleteFlags` L22255 | hidden | no capture: seed cycle is regular, `healthFlag` null in all 26 |
| YOUR PATTERNS insights | L25866 | working-but-empty | placeholder copy shows with 6 seeded days (`cycle-populated-full.png`) |
| THE SCIENCE accordion (4 sections) | L25908 | working | `cycle-populated-settings-full.png` |
| McCalendar grid + legend | L23754 | working | `cycle-populated-calendar.png` |
| McSettings: lengths, irregular, birth control, discreet, cloud, export, delete | L24066 | working | `cycle-populated-settings-full.png` |
| McOnboarding, 5 steps | L22751 | working | `cycle-empty-onboarding.png`…`-step5.png` |
| McTrainBanner in Train Hub | L25064, render L15465 | working, narrow | fires only on today's `sym ≥2` or `energy ≤2`; text only |
| Fuel link: `mcFuelContext`, `McFuelStrip`, `mcLutealCalBump`, `lk_mcFuelAdjust` | L24876/24915/24912/25037 | **dead** | each defined, never called. McNutritionCard still offers "let Fuel add a small calorie allowance" (L24855); its switch is unrenderable |
| Male gate message | L25168 | **dead** | Home hides both cycle blocks when `!isFemaleUser` (L26579/L21946); index line 439 |
| Coach visibility of cycle data | pref `cycle` L49186 | **broken (mislabelled)** | toggle "Your cycle tracking visible to the coach" (coach-setup interactive log) feeds `getCycles()`, PED compounds (L47266), not `mcDays` |

**Read outside this screen:** `mcGetProfile`/`mcGetDays`/`mcCompute` are called at three sites only — Home's CycleTrackerCard (L22597/22667), McTrainBanner (L25064), this screen. No workout, split, volume, macro or coach output changes. Cycle data informs zero training decisions.

## 3. Task walkthrough
No flow in `user-flows.md` touches this page and `flow-metrics.jsonl` has no cycle row, so no elapsed-ms or video evidence exists. Taps counted from `screenshots/index.md` reach paths plus the interactive crawl (10,735 ms, 20/35 controls).

| Task | Steps | Taps | Hesitation |
|---|---|---|---|
| Log today's period | Home cycle card → "Log Period" | 2 | the card's **LOG** button is covered by the voice FAB and untappable (D2, home interactive `blocked:"LOG"`); the card body still routes (L22650/22681), so the workaround must be discovered |
| Log symptoms | card → Symptoms → chip → Done | 4 | four identical chips, two opening the same sheet |
| See the month | card → Show calendar | 2 | header icon flips calendar→clock, no label |
| Change settings | card → "Cycle settings" | 2 | crawl logged `closedBy:"unresolved"` on this sheet; it trapped the crawl, 15/35 controls never exercised |

## 4. State coverage
Applicable states = 2. Loading and error N/A: page-map 2.5 `L/X n/a`, no network (index 440); the only error branch, the male gate, is unreachable (index 439).

| State | Capture | Present? | Content |
|---|---|---|---|
| Empty | `cycle-empty.png` | **MISSING** — test 2a: byte-identical to `cycle-populated.png` (md5 `a2ad5bb0…`), as are the `-full` and `-scrolled-2` pairs | Every base-view element derives from `lk_mcProfile`, and the patterns card shows empty copy even when populated, so clearing `lk_mcDays` changes nothing. The baseline empty assertion passes in both states, a false pass |
| Populated | `cycle-populated.png` | present, correct | all cards render |

Band table: M=1, W=0 → **2**.

## 5. Baseline failures
Populated and empty passed; error N/A; 0 console/page errors. Non-failing defects:
- **D2** (blocks a task): Home cycle-card **LOG** intercepted by VoiceButton (L53718, L54052; LOG L22735).
- **D10** (a11y serious): "PMS WINDOW" `#7c5ce8` on `#09060f`, 11px/800 = 4.36:1 — 1/37 contrast fail.
- **D11** (a11y serious): chip strip `overflow-x:auto` not keyboard focusable (≈L25400).
- Targets: 1/14 under 44px, "THE SCIENCE" row 319x16 (L25937). Coverage 20/35 (above).

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `cycle-populated-full.png`: title + ring name the job in under a second. Shortfall: four identically styled chips, no primary; six stacked cards below |
| Feature completeness | 3 | Core log and prediction work (§2). Dead: the Fuel-adjust subsystem, the male gate. Redundant: "More" duplicates "Symptoms" (identical captures) |
| Task success | 3 | Primary entry blocked by the FAB (D2), completes only via the card-body workaround; settings sheet trapped the crawl at 20/35 |
| Speed | 4 | Period logged in 2 taps from Home, zero screen changes (`screenshots/index.md` reach path + interactive log); +1 over best-known because the labelled LOG target is unusable |
| State handling | 2 | Empty missing: `cycle-empty.png` byte-identical to `cycle-populated.png`. M=1, W=0 |
| Data correctness | 4 | Seed `lastStart` 2026-08-29, `cycleLen` 28 → day 11 ✓, "Sep 26 / in 18d" ✓, fertile "Sep 6 – Sep 12" ✓ (`cycle-populated-full.png`, `-calendar.png`). Shortfall: the calendar paints `flow≥1` as "Period" (L23877) while the engine counts one only at `flow≥2` (L21972), so seeded Sep 1–2 read as period days predictions ignore |
| Error recovery | N/A | No network calls (page-map 2.5 L/X n/a) and no error capture exists |

Function mean **3.3**.

## 7. Keep, fix, cut
**Keep**
- Ring, day and next-period countdown: the page's value in one glance (`cycle-populated-full.png`).
- Inline Log Period, 2 taps, no sheet: the daily action, correctly one level shallower than the rest.
- Privacy model: local-only default, opt-in `lk_mcCloudSync` (L222), discreet card, export, delete (`cycle-populated-settings-full.png`).
- McHealthCard RED-S flag (L22255): the only feature joining training history to cycle data — the one job a dedicated cycle app cannot do.

**Fix**
- Build an empty state; today nothing is distinguishable (§4).
- Merge "More" into "Symptoms": four chips become two (identical captures).
- Wire or delete `mcFuelContext`/`McFuelStrip`: onboarding promises a Fuel link the build cannot deliver.
- Relabel or rewire the Coach `cycle` pref: it exposes PED cycles under a menstrual label (L49186).
- Unblock the Home LOG target (D2); settle the calendar/engine period threshold (§6).

**Cut**
- THE SCIENCE accordion and phase-almanac copy: one job per screen. A 2,258px education surface no training decision consumes belongs behind a link.
- **Merge into Progress: no.** §2 shows cycle data drives no training output anywhere, so a merge buys no data join — it only moves medically sensitive, separately gated and separately synced data onto a lift-analytics screen. Either build the join (readiness → session adjustment, RED-S from history) and keep this standalone, or cut the page and keep only the RED-S flag. Shipped unjoined, as v6 does, it is a worse cycle app than any free dedicated one.
