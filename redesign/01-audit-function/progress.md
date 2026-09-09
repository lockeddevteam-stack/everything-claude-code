# Function audit — Progress (`progress`, ProgressPage L28323, 841 lines)

## 1. Purpose
A container that should answer "how am I trending?" but instead parks five unrelated surfaces — featured-lift PR cards, goals, a training calendar, Photos and PR Vault — behind one scrolling tab strip, with no trend chart for any lift on its own screen.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Tab strip (5 tabs, `overflowX:auto`) | L28611-28640 | **hidden** | measured: `[aria-label="Progress section"]` scrollWidth 448 / clientWidth 353; "PR Vault" chip at x=382 in a 393px viewport, 11 of 87px on screen. `progress-populated.png` shows only 4 tabs |
| Featured lift Day-1-vs-PR cards | L28660-28840 | working | `progress-populated.png` (3 cards) |
| Unpin (×) | L28800 | working, no confirm | crawl `skipped: "Unpin this exercise" x3` (D15); `progress-populated.png` |
| ADD LIFT picker | L28844 | working | `progress-populated-add-lift-picker.png`; crawl `navigatedAway:true` — full-screen takeover, loses Progress chrome |
| Body-weight sparkline | L28876 | working, read-only | `progress-populated-full.png`; empty copy sends the user to Fuel to log |
| ThrowbackCard | L28325-28330 | **hidden** | 25% random per mount; absent from all 21 progress captures |
| Goals list + progress bars | GoalsTab L26992, L28113 | working | `progress-populated-goals.png` |
| Goal detail (ring, start/current/target, days) | L27441 | working | `progress-populated-goals-detail.png` |
| Analyse My Progress (AI) | L27204 | working | `progress-populated-goals-detail-analysis.png` |
| Goal edit / new goal / delete-arm | L27810, L27004 | working | `progress-populated-goals-edit.png`, `-goals-add.png`, `-goals-add-form.png`, `-goals-delete-armed.png` |
| Body Fat Log sheet + AI estimate | L27019, L27192 | working | `progress-populated-goals-bodyfat-sheet.png`, `-bodyfat-ai.png` |
| Calendar month grid, prev/next | L28382, L28960+ | working | `progress-populated-calendar.png`, `-calendar-prev-month.png` |
| Calendar day cells | L29027 | **dead** | rendered as `div` with a `title` tooltip, no `onClick`; hover-only, unreachable by touch. Crawl enumerated 11 interactive elements on Progress and no day cell among them |
| Photos tab → ProgressPhotos | L29158 | **redundant** | 906-line page hung off a tab; `photos-populated.png` has its own header and tab strip |
| PR Vault tab → PRHub | L28438 | **redundant + hidden** | embedding passes `onBack`, which suppresses PRHub's own Overview/PR Vault bar (screenshots/index.md L437), so PRHub's Last-7-Days overview is unreachable in v6 |
| Back → Home | L28594 | working | crawl `Back` responded, `navigatedAway:true`; history back "ok" |

## 3. Task walkthrough — Flow 4, Home to one lift's chart (only flow through this page)

| Step | Action | Screen change | Video ts |
|---|---|---|---|
| 0 | boot Home, scroll to 8th block | — | 412 ms |
| 1 | "VIEW PROGRESS" | → ProgressPage Overview | 1382 ms |
| 2 | horizontal-scroll tab strip, tap "PR Vault" | → PRHub list | 2318 ms |
| 3 | "Bench Press" row | → detail, `svg polyline` e1RM | 3268 ms; assertion 3803 ms |

Taps **3** (= expected), 893 ms first-nav→success, 0 console/page errors, `flow-metrics.jsonl` flow 4 `pass:true`. Two scroll gestures are required and not counted: Home's progress block is the 8th card, and PR Vault is 11px wide on entry. Hesitation points: Overview shows two numbers per lift and no chart, so "my bench over time" has no answer on the screen the user just opened (user-flows.md L157); the route to the chart is a tab the user cannot see. Playwright scrolls the strip automatically, which is why the spec passes and a human would not.

## 4. State coverage (A = 4)

| State | Capture | Present? | Quality |
|---|---|---|---|
| Empty | `progress-empty.png`, `progress-empty-goals.png`, `progress-empty-calendar.png` | present (named element: "Track your key lifts here…", "No Goals Set" + target icon, absent from populated) | **generic** — the Calendar empty renders a full month grid with no dots and no copy, identical in structure to populated minus data; nothing tells the user why it is bare |
| Loading | `progress-loading-goals-ai.png` | present (spinner + "Analysing goal…", absent from `-goals-detail.png`, same scroll/theme) | correct |
| Error | `progress-error-goals-ai.png` | present ("Coach Analysis — Analysis unavailable. Check connection." + Refresh + toast) | correct |
| Populated | `progress-populated.png` | — | correct |

M=0, W=0, G=1 → band table row 4.

## 5. Baseline failures

No hard failures: populated passed (`FEATURED LIFTS`, `Barbell Bench Press`, `BODY WEIGHT`), empty passed, error N/A (the only network branch is inside a goal detail — SUMMARY "Blocked / not covered"), 0 console errors, 0 page errors, in-app and history back both ok, contrast 0/37. Non-responders: none; 6 of 11 clicked, the 5 unclicked being 3 destructive Unpins and the already-selected Overview tab.

| Defect | Cause |
|---|---|
| D12 targets 7/16 under 44px | tab chips 33px tall (L28617 `padding:"8px 16px"`), Back 22x27 (L28592) |
| D15 Unpin has no confirmation | L28800 handler writes `featuredLifts` directly |
| axe 1 violation (1 node) | D9 `meta-viewport` `user-scalable=no`, L5 — global shell, not this page |

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 2 | `progress-populated.png`: title names a job, five tabs name five; no primary action (only ADD LIFT is accent-styled); the trend the title promises is not on the screen. Anchor-1 "no single job" holds, anchor-3 "inferable after a scan" met |
| Feature completeness | 3 | Core cards, goals and calendar work (crawl 6/6 responded); calendar day cells dead (L29027, no day cell in the 11 enumerated elements); PR Vault tab 11px visible; PRHub overview unreachable when embedded; Throwback 25% random |
| Task success | 4 | Flow 4 pass, 3/3 taps, 893 ms, 0 errors; shortfall: step 2 needs an uncounted horizontal scroll to reveal PR Vault (measured x=382 of 393) |
| Speed | 3 | 3 taps + 2 scrolls + 3 screen changes to reach one lift's chart vs best-known 2 taps (tab → lift); within 2x |
| State handling | 4 | A=4, M=0, W=0, G=1 (`progress-empty-calendar.png` bare grid, no copy); loading and error present-and-correct |
| Data correctness | 3 | 3 checks: `lk_prs[111]` max 72.5 → "72.5kg" ✓, `[221]` 115 → "115kg" ✓, `lk_weightLog` last **64.2** → shown **"64.25 kg"** on `progress-populated-full.png` and "64.25kg → 63kg" on `progress-populated-goals.png` (body weight passed through `fmtQ` L4349, which quantises to 0.25). Three date formats on one page: `7/30/2026`, `2026-07-27`, "Due: 2026-12-01" |
| Error recovery | 5 | `progress-error-goals-ai.png`: cause named, Refresh offered, goal ring/notes intact |

Function mean **3.4**.

## 7. Keep, fix, cut

**Keep**
- Goal detail ring + start/current/target/days: correct maths against seed (83% = (72.5-60)/(75-60)), one screen, `progress-populated-goals-detail.png`.
- AI error handling: named cause, Refresh, no lost work — the best error state audited on this page.
- Calendar's four-signal day encoding (trained fill, weigh-in/PR/photo dots), `progress-populated-calendar.png`.

**Fix**
- Put a per-lift trend chart on Overview: the page's own flow (Flow 4) has to leave it to find one (user-flows.md L157).
- Tab strip overflows at 393px (measured 448/353): PR Vault must not be discoverable only by scrolling.
- Make calendar days tappable (L29027 div + `title` is hover-only) — the day detail already exists as tooltip text.
- Body weight must not go through `fmtQ` (64.2 → 64.25, L4349); one date format.
- Unpin needs a confirm (D15); tab chips and Back must reach 44px (D12).

**Cut**
- The Photos tab: a 906-line screen with its own header and tab bar wearing Progress's chrome; it does not help the north-star job of seeing a lift trend, and hosting it costs the tab slot that hides PR Vault.
- Featured-lift Day-1-vs-PR cards as the Overview's whole answer: two static numbers cannot show a trend, which is the job the page's title promises.
- Random ThrowbackCard: unreproducible in 21 captures, duplicated on Home.

**Directive hypotheses.** *Rebuild — supported*: the page's own primary question is answered only on another component reached through an off-screen tab; three of five tabs are separate screens. *Cycle merge — supported*: the app renders two month grids with different chrome and opposite interaction models (Cycle days are tappable and card-wrapped with ‹›, `cycle-populated-calendar.png`; Progress days are inert with ←→, `progress-populated-calendar.png`), both routes hang off Home and both map to the Home nav item (page-map L41). One calendar, layered signals.
