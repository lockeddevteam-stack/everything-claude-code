# Function audit — Progress (`progress`, ProgressPage L28323, 841 lines)

## 1. Purpose
A container that should answer "how am I trending?" but parks five unrelated surfaces — lift PR cards, goals, a calendar, Photos, PR Vault — behind one scrolling tab strip, with no lift trend chart of its own.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Tab strip (5 tabs, `overflowX:auto`) | L28611-28640 | **hidden** | measured: scrollWidth 448 / clientWidth 353; "PR Vault" at x=382 in a 393px viewport, 11 of 87px visible. `progress-populated.png` shows 4 tabs |
| Featured lift Day-1-vs-PR cards | L28660-28840 | working | `progress-populated.png` (3 cards) |
| Unpin (×) | L28800 | working, no confirm | crawl `skipped: "Unpin this exercise" x3` (D15); `progress-populated.png` |
| ADD LIFT picker | L28844 | working | `progress-populated-add-lift-picker.png`; crawl `navigatedAway:true`, full-screen takeover |
| Body-weight sparkline | L28876 | working, read-only | `progress-populated-full.png`; empty copy sends the user to Fuel |
| ThrowbackCard | L28325-28330 | **hidden** | 25% random per mount; absent from all 21 progress captures |
| Goals list + progress bars | GoalsTab L26992, L28113 | working | `progress-populated-goals.png` |
| Goal detail (ring, start/current/target) | L27441 | working | `progress-populated-goals-detail.png` |
| Analyse My Progress (AI) | L27204 | working | `progress-populated-goals-detail-analysis.png` |
| Goal edit / new / delete-arm | L27810, L27004 | working | `-goals-edit.png`, `-goals-add.png`, `-goals-add-form.png`, `-goals-delete-armed.png` |
| Body Fat Log sheet + AI estimate | L27019, L27192 | working | `-goals-bodyfat-sheet.png`, `-bodyfat-ai.png` |
| Calendar grid, prev/next | L28382, L28960+ | working | `-calendar.png`, `-calendar-prev-month.png` |
| Calendar day cells | L29027 | **dead** | `div` + `title` tooltip, no `onClick`: hover-only, unreachable by touch; no day cell among the crawl's 11 interactive elements |
| Photos tab → ProgressPhotos | L29158 | **redundant** | 906-line page on a tab; `photos-populated.png` has its own header and tab strip |
| PR Vault tab → PRHub | L28438 | **redundant + hidden** | embedding passes `onBack`, suppressing PRHub's own tab bar, so its Last-7-Days overview is unreachable (screenshots/index.md L437) |
| Back → Home | L28594 | working | crawl `Back` responded; history back "ok" |

## 3. Task walkthrough — Flow 4, Home to one lift's chart (only flow through this page)

| Step | Action | Screen change | Video ts |
|---|---|---|---|
| 0 | boot Home, scroll to 8th block | — | 412 ms |
| 1 | "VIEW PROGRESS" | → ProgressPage Overview | 1382 ms |
| 2 | horizontal-scroll tab strip, tap "PR Vault" | → PRHub list | 2318 ms |
| 3 | "Bench Press" row | → detail, `svg polyline` e1RM | 3268 ms; assertion 3803 ms |

Taps **3** (= expected), 893 ms first-nav→success, 0 errors, flow 4 `pass:true`. Two uncounted scrolls: Home's progress block is the 8th card, and PR Vault is 11px wide on entry. Hesitation: Overview gives two numbers per lift and no chart, so "my bench over time" is unanswered on the screen just opened (user-flows.md L157), and the route to the chart is a tab the user cannot see. Playwright scrolls the strip automatically, which is why the spec passes where a human stalls.

## 4. State coverage (A = 4)

| State | Capture | Present? | Quality |
|---|---|---|---|
| Empty | `progress-empty.png`, `-empty-goals.png`, `-empty-calendar.png` | present (named: "Track your key lifts here…", "No Goals Set") | **generic** — Calendar empty is a full month grid, no dots, no copy |
| Loading | `progress-loading-goals-ai.png` | present (spinner + "Analysing goal…", absent from `-goals-detail.png` at same scroll/theme) | correct |
| Error | `progress-error-goals-ai.png` | present ("Analysis unavailable. Check connection." + Refresh + toast) | correct |
| Populated | `progress-populated.png` | — | correct |

M=0, W=0, G=1 → band table row 4.

## 5. Baseline failures

No hard failures: populated and empty passed, error N/A (the only network branch sits inside a goal detail, SUMMARY "Blocked / not covered"), 0 console/page errors, both backs ok, contrast 0/37. No non-responders; 6 of 11 clicked, the rest 3 Unpins and the selected tab.

| Defect | Cause |
|---|---|
| D12 targets 7/16 under 44px | tab chips 33px tall (L28617), Back 22x27 (L28592) |
| D15 Unpin has no confirmation | L28800 handler writes `featuredLifts` directly |
| axe 1 violation (1 node) | D9 `meta-viewport` `user-scalable=no` L5, global shell |

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 2 | `progress-populated.png`: title names one job, the tabs five; one accent control (ADD LIFT) and no primary action; the promised trend is not on screen. Anchor-1 holds, anchor-3 met |
| Feature completeness | 3 | Cards, goals, calendar work (crawl 6/6 responded); day cells dead (L29027); PR Vault tab 11px visible; PRHub overview unreachable when embedded; Throwback 25% random |
| Task success | 4 | Flow 4 pass, 3/3 taps, 893 ms, 0 errors; shortfall: step 2 needs an uncounted scroll to reveal PR Vault (x=382 of 393) |
| Speed | 3 | 3 taps + 2 scrolls + 3 screen changes to one lift's chart vs best-known 2 taps (tab → lift); within 2x |
| State handling | 4 | A=4, M=0, W=0, G=1 (`progress-empty-calendar.png` bare grid, no copy); loading and error present-and-correct |
| Data correctness | 3 | `lk_prs[111]` 72.5 → "72.5kg" ✓; `[221]` 115 → "115kg" ✓; `lk_weightLog` last **64.2** → **"64.25 kg"** (`progress-populated-full.png`) and "64.25kg → 63kg" (`-goals.png`): body weight runs through `fmtQ` L4349, quantised to 0.25. Three date formats: `7/30/2026`, `2026-07-27`, "Due: 2026-12-01" |
| Error recovery | 5 | `progress-error-goals-ai.png`: cause named, Refresh offered, ring and notes intact |

Function mean **3.4**.

## 7. Keep, fix, cut

**Keep**
- Goal detail ring + start/current/target/days: maths correct against seed (83% = (72.5-60)/(75-60)), `progress-populated-goals-detail.png`.
- AI error handling: named cause, Refresh, no lost work.
- Calendar's four-signal day encoding, `progress-populated-calendar.png`.

**Fix**
- Put a per-lift trend chart on Overview: Flow 4 must leave the page to find one (user-flows.md L157).
- Tab strip overflows at 393px (448/353): PR Vault must not be reachable only by scrolling.
- Make calendar days tappable: the day detail already exists as `title` text (L29027).
- Body weight must not go through `fmtQ` (64.2 → 64.25, L4349); one date format.
- Unpin needs a confirm (D15); chips and Back must reach 44px (D12).

**Cut**
- Photos tab: a 906-line screen with its own header and tab bar wearing Progress's chrome; it does not serve the lift-trend job, and its tab slot pushes PR Vault off screen.
- Day-1-vs-PR cards as Overview's whole answer: two static numbers cannot show the trend the title promises.
- Random ThrowbackCard: unreproducible in 21 captures, duplicated on Home.

**Directive hypotheses.** *Rebuild — supported*: the page's own question is answered only on another component behind an off-screen tab; three of five tabs are separate screens. *Cycle merge — supported*: the app renders two month grids with different chrome and opposite interaction models (Cycle days are tappable and card-wrapped with ‹›, `cycle-populated-calendar.png`; Progress days are inert with ←→, `progress-populated-calendar.png`), both routes hang off Home and both map to the Home nav item (page-map L41). One calendar, layered signals.
