# Function audit — Cycle Tracker (`cycle`)

## 1. Purpose
A private daily menstrual log that predicts the next period and tells the user how to train and eat around it — three jobs (tracker, calendar, almanac/education) on one screen.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Cycle ring, day + phase + countdown, drag to preview | L25419-25475 | working | `cycle-populated-full.png` "CYCLE DAY 11 / Follicular / Period in ~18d" |
| Log Period toggle (inline, no sheet) | `quickLogPeriod` L25194, label L25504 | working | interactive log: "Log Period"→"Logged" both responded |
| Symptoms → McLogSheet | L25506 / L23147 | working | `cycle-populated-log-sheet.png` |
| More → McLogSheet (same sheet, same date) | L25585 | redundant | `cycle-populated-log-more.png` is byte-identical to `cycle-populated-log-sheet.png` (md5 d08cba93) |
| Energy inline 1–5 bar | L25560, L25583 | working | interactive log "Energy 1/5"…"5/5" all responded |
| Phase card, prediction chips (next period / fertile / PMS) | L25780-25826 | working | `cycle-populated-full.png` |
| McTrainingCard: "go lighter" / "keep plan", writes `coach:"adjusted"\|"kept"` | L24654-24777 | working | `cycle-populated-full.png` TRAINING card |
| McNutritionCard | L24777 | working (phase-gated) | absent in follicular capture; renders only menstrual/luteal/ovulatory (L24783) |
| McHealthCard RED-S / amenorrhea flag, cross-references `history` volume spike | `mcAthleteFlags` L22255, render L25826 | hidden | no capture: seed cycle is regular so `healthFlag` is null in all 26 captures |
| YOUR PATTERNS insights | L25866 | working-but-empty | `cycle-populated-full.png` shows the placeholder copy even with 6 seeded days |
| THE SCIENCE education accordion (4 sections) | L25908-25947 | working | `cycle-populated-settings-full.png` (expanded behind sheet) |
| McCalendar month grid + legend | L23754, toggle L25359 | working | `cycle-populated-calendar.png` |
| McSettings: lengths, irregular, birth control, discreet, cloud backup, export JSON, delete all | L24066, L26009 | working | `cycle-populated-settings-full.png` |
| McOnboarding 5 steps | L22751 | working | `cycle-empty-onboarding.png` … `-step5.png` |
| McTrainBanner in Train Hub | L25064, rendered L15465 | working, narrow | fires only if today's `cramps/fatigue/headache ≥2` or `energy ≤2`; text only, links back to this screen |
| Fuel connection (`mcFuelContext`, `McFuelStrip`, `mcLutealCalBump`, `lk_mcFuelAdjust` toggle) | L24876, L24915, L24912, L25037 | **dead** | grep: each is defined and never called/rendered. McNutritionCard still says "You can let Fuel add a small calorie allowance" (L24855) — the switch that enables it is unrenderable |
| Male gate message | L25168 | **dead** | Home hides both cycle blocks when `!isFemaleUser` (L26579/L21946); index line 439 records the gate as unreachable |
| Coach visibility of cycle data | Coach pref `cycle` L49186 | **broken (mislabelled)** | the toggle "Your cycle tracking visible to the coach" (coach-setup interactive log) feeds `getCycles()` — PED compound cycles (L47266) — not `mcDays`. The coach never reads menstrual data |

**Where cycle data is read outside this screen:** `mcGetProfile`/`mcGetDays`/`mcCompute` are called at exactly three sites — CycleTrackerCard on Home (L22597, L22667-22668), McTrainBanner in Train Hub (L25064), and this screen. No workout, split, volume, macro or coach output changes. Cycle data informs zero training decisions.

## 3. Task walkthrough
No flow in `user-flows.md` touches this page; `flow-metrics.jsonl` has no cycle row, so there is no elapsed-ms or video evidence for any task here. Taps counted from the reach paths in `screenshots/index.md` and the interactive crawl (`page-metrics.jsonl` cycle/interactive, 10,735 ms, 20/35 controls).

| Task | Steps | Taps | Hesitation |
|---|---|---|---|
| Log today's period | Home cycle card → "Log Period" | 2 | the Home card's **LOG** button is covered by the voice FAB and cannot be tapped (baseline D2, home interactive `blocked: "LOG"`); the card body still routes (L22650/L22681), so the user must discover the workaround |
| Log symptoms | card → "Symptoms" → chip → "Done" | 4 | "Symptoms", "Energy" and "More" are four identical chips; two of them open the same sheet |
| See the month | card → "Show calendar" | 2 | header icon changes from calendar to clock with no label change |
| Change settings | card → "Cycle settings" | 2 | crawl recorded `overlays: [{after:"Cycle settings", closedBy:"unresolved"}]` — the sheet trapped the crawler and 15 of 35 controls were never exercised |

## 4. State coverage
Applicable states = 2. Loading and error are N/A: page-map 2.5 `L/X n/a`, no network in the component (index line 440); the only error branch, the male gate, is unreachable (index line 439).

| State | Capture | Present? | Content |
|---|---|---|---|
| Empty | `cycle-empty.png` | **MISSING** — test 2a: byte-identical to `cycle-populated.png` (md5 `a2ad5bb0…`); `-full` and `-scrolled-2` pairs are identical too | n/a. Every element on the base view derives from `lk_mcProfile`, and the patterns card already shows its empty copy in the populated capture, so clearing `lk_mcDays` changes nothing on screen. The baseline empty assertion (`text=/Log symptoms and energy through a couple of cycles/`) passes in both states — a false pass |
| Populated | `cycle-populated.png` | present, correct | ring, chips, training and science cards all render |

Band table: M=1, W=0 → **2**.

## 5. Baseline failures
Populated and empty passed; error N/A; 0 console and 0 page errors. Non-failing defects:
- **D2** (blocks a task): Home cycle-card **LOG** intercepted by VoiceButton (L53718, fixed L54052; LOG at L22735).
- **D10** (a11y serious): "PMS WINDOW" `#7c5ce8` on `#09060f`, 11px/800 = 4.36:1 vs 4.5 required — 1/37 contrast fail.
- **D11** (a11y serious): chip strip `overflow-x:auto` not keyboard focusable (`scrollable-region-focusable`, ≈L25400).
- Targets: 1/14 under 44px — "THE SCIENCE" row 319x16 (L25937).
- Interactive coverage 20/35: settings sheet overlay unresolved (above).

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `cycle-populated-full.png`: title + ring name the job in under a second. Shortfall: four identically styled action chips (Log Period / Symptoms / Energy / More), no primary; six stacked content cards below |
| Feature completeness | 3 | Core log + prediction work (feature table). Dead: the whole Fuel-adjust subsystem and the male gate; redundant: "More" duplicates "Symptoms" (identical captures) |
| Task success | 3 | Primary entry blocked by the FAB (D2, home interactive), completes only via the card-body workaround; settings sheet trapped the crawl at 20/35 |
| Speed | 4 | Log a period = 2 taps, zero screen changes, from Home (`screenshots/index.md` reach path + interactive log). +1 over best-known because the labelled LOG target is unusable |
| State handling | 2 | Empty missing: `cycle-empty.png` byte-identical to `cycle-populated.png`. M=1, W=0 |
| Data correctness | 4 | Seed `lastStart` 2026-08-29, `cycleLen` 28 → day 11 ✓, "Sep 26 / in 18d" ✓, fertile "Sep 6 – Sep 12" ✓ (`cycle-populated-full.png`, `cycle-populated-calendar.png`). Shortfall: the calendar paints `flow≥1` as "Period" (L23877) while the engine counts a period only at `flow≥2` (L21972), so seeded Sep 1–2 read as period days the predictions ignore |
| Error recovery | N/A | No network calls (page-map 2.5 L/X n/a) and no error capture exists |

Function mean **3.3**.

## 7. Keep, fix, cut
**Keep**
- Ring + day + next-period countdown: the whole page's value in one glance (`cycle-populated-full.png`).
- Inline Log Period (2 taps, no sheet) — the daily action, correctly one level shallower than everything else.
- Privacy model: local-only default, opt-in `lk_mcCloudSync` (L222), discreet card, export, delete-all (`cycle-populated-settings-full.png`).
- McHealthCard RED-S flag: the only feature here that joins training history to cycle data (L22255) — the one job a dedicated cycle app cannot do.

**Fix**
- Empty state renders nothing distinguishable — build one (identical PNGs, §4).
- Merge "More" into "Symptoms"; four chips become two (identical captures).
- Wire or delete `mcFuelContext`/`McFuelStrip`; today the app promises a Fuel link in onboarding copy it cannot deliver.
- Relabel or rewire the Coach `cycle` pref — it exposes PED cycles under a menstrual label (L49186).
- Unblock the Home LOG target (D2); calendar/period-day threshold disagreement (§6).

**Cut**
- THE SCIENCE accordion and the phase almanac copy: north star item 1 is one job per screen; a 2,258px education surface no training decision consumes belongs in a link, not the tracker.
- **Merge into Progress: no.** The directive's hypothesis assumes shared purpose; the trace in §2 shows cycle data drives no training output anywhere, so merging buys no data join — it only moves medically sensitive, separately-gated, separately-synced data onto a lift-analytics screen. Either build the join (readiness → session adjustment, RED-S from history) and keep this a standalone page, or cut the page and keep only the RED-S flag inside Progress. Shipping it unjoined, as v6 does, is a worse cycle app than any free dedicated one.
