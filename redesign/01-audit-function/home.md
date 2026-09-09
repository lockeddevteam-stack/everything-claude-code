# Function Audit — Home (`home`)

HomeScreen L26220, DynamicFeed L17998, QuickActionsRow L26141. Evidence: `00-inventory/screenshots/current/home-*.png`, `tests/baseline/*`, and one measurement of my own (Playwright, iPhone 15 Pro, seeded populated, `.lk-scroll` child rects — reported as "measured").

## 1. Purpose

Home should tell the lifter whether to train today and start that session in one tap; today it is a 1,688px scrolling dashboard of ten blocks whose single primary action begins 659px down, below a 588px viewport.

**On the directive's hypothesis.** Partly overturned. Home does have exactly one primary-styled control — the accent-filled `START WORKOUT` (`home-populated.png`, block 5, L26629) — and it renders 10 blocks under seed, not 12. What is true is worse than "no primary action": the primary exists but is unreachable without a scroll. Measured block tops/heights (populated, scrollHeight 1,688, clientHeight 588):

| # | Block | Top | Height | Returns |
|---|---|---|---|---|
| 1 | Greeting + avatar | 0 | 125 | name, time-of-day |
| 2 | Stats grid (4 tiles) | 125 | 179 | 4 counts, no units, no trend, not tappable |
| 3 | Quick actions (3) | 304 | 94 | 1 inline log (water), 2 navigations |
| 4 | Feed (readiness + up-next) | 398 | 261 | the one card that answers "train today?" |
| 5 | **START WORKOUT** | **659** | 69 | the job |
| 6 | VIEW PROGRESS | 728 | 52 | duplicate of the `progress` route |
| 7 | Weekly Recap | 780 | 50 | sheet, 4 numbers, 60% empty (`home-populated-recap.png`) |
| 8 | Calendar | 830 | 338 | dot per trained day, no tap target |
| 9 | Recent Workouts (5) | 1168 | 408 | drill-in to WorkoutDetail |
| 10 | Cycle tracker | 1590 | 74 | LOG — blocked, see §5 |

534px (blocks 2, 3, 8) return read-only counts. The LayoutEditor is real but lives in Settings (L32192 → L31492 "Home Layout"), not on Home: users are given the reordering tool one tab away instead of an ordered screen.

## 2. Feature inventory

| Feature | Location | Status |
|---|---|---|
| Stats grid | L26547 | broken — "PRs Logged" = `Object.keys(prs).length` = 9 (L26565) against 12 seeded PRs |
| Today's Insight (ProactiveTipCard) | L17858, fetch L17904 | working, hidden by default layout; fires a worker POST on mount when `lk_proactiveTip.date !== today` |
| Quick actions row | L26141, defs L26085 | working; 8 defined, 3 shown; 5 of 8 targets are Fuel (out of scope) |
| Water +250 inline log | `quickLogWater` L26124 | working (baseline: responded, no navigation) |
| Feed: check-in / recovery / rest / comeback / next-split | L18055-L18086 | broken — comeback card renders the sentinel: "999 days since your last session" (`home-empty-full.png`; sentinel L18012, render L18364) |
| START WORKOUT | L26629 | working, below fold (measured 659px) |
| VIEW PROGRESS | L26668 | redundant — sole entry to Progress, which should be a destination not a Home button |
| Weekly Recap | L26698 | working, thin (`home-populated-recap.png`: 4 numbers, one duplicates "This Week") |
| Calendar | L26728 | working, read-only |
| Recent Workouts + See all | L26816 | working |
| Cycle tracker card | L26611 | broken in situ — LOG unclickable (§5) |
| Supplement Reminder / Running Low | L26659, L26662 | hidden — render null under seed; absent from every populated capture; both depend on Fuel data |
| Cycle Reminder | L26665 | hidden — absent from all captures |
| ThrowbackCard | L26600, L4606 | dead — `home-populated-throwback.png` (captured with `lk_throwbackForce=1`) is indistinguishable from `home-populated.png`: no card renders even when forced |
| Streak badge (gaming layer) | L26423 | working, off by default (`home-populated-gaming.png`) |
| LayoutEditor | L31492, entry L32192 | working, hidden from Home |

## 3. Task walkthrough

| Flow | Home's part | Taps (total) | ms | Video | Hesitation |
|---|---|---|---|---|---|
| 1 guest → first set | tap 3 of 14 (1B): `START WORKOUT` → Train | 14 (17 cold) | 3090 (3716) | `flow-1` 6897ms | Home is the landing screen; the button is below the fold, and it opens TrainHub rather than a workout — the label promises the set, the screen delivers a picker |
| 4 Home → lift chart | tap 1 of 3: `VIEW PROGRESS` | 3 | 893 | `flow-4` 1382 → 3803 | matches best-known 3, but the entry is a mid-page button 728px down and there is no Progress nav tab (user-flows L148) |
| 8 units → Home | last tap: Nav Home | 4 | 972 | `flow-8` 4300 → 4830 | D14: no Home number carries a unit, so the change is invisible on arrival |
| 3 finish → save | Home is the landing with "Saved" toast (`flow-3-home-saved.png`) | 3 | 1076 | — | save throws `syncBidirectional is not defined` (D1) before Home renders |

## 4. State coverage

| State | Capture | Present | Quality |
|---|---|---|---|
| Populated | `home-populated.png`, `-full` | yes | correct |
| Empty | `home-empty-full.png` | yes (zeros, "Set up your first split") | **present-but-wrong**: "999 days since your last session"; the one teaching card is the last block, ~1,600px down |
| Loading | `home-loading.png` | yes — "TODAY'S INSIGHT / *Analysing your data…*", element absent from populated (test 2b) | correct, scoped to the one async block |
| Error | `home-error.png` | **missing** — diffed against `home-loading.png` (same seed, offset, theme): the card swaps to a stale cached tip under the label "TODAY'S INSIGHT" with no failure marker; nothing distinguishes it from a successful fetch (catch L17930) | — |

A = 4, M = 1, W = 1.

## 5. Baseline failures

| Item | Result | Cause |
|---|---|---|
| Blocked click "LOG" | `page-metrics.jsonl` home/interactive: `<button aria-label="Start voice command"> intercepts pointer events` (D2) | VoiceButton fixed 50x50 bottom-right L54052 overlaps the cycle card's LOG L22735, which Home renders as its last block (measured top 1,590 of 1,688) |
| 4 / 20 targets under 44px | `targets.json`, SUMMARY | "Up next: Push" 243x38 (L18320), "Weekly Recap" 353x42 (L26698), "See all" 58x25 (L26836), "LOG" 60x33 |
| 1 axe violation (1 node) | `axe.json` | global `meta-viewport` L5 (D9), not page-owned |
| 12 recoveries in a 14-element crawl | SUMMARY note | 11 of 14 Home controls navigate away; Home is a link list, not a workspace |
| Unrequested network on load | `lk_proactiveTip` stale → POST L17904 | fires before any user intent; on failure nothing is shown (§4) |
| Non-responders / console errors | none, 0, 0 | — |

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 2 | `home-populated.png`: at the fold the user sees 4 stat tiles, 3 quick actions, 2 feed cards; measured, `START WORKOUT` top 659px vs 588px viewport. One primary-styled control exists (the 3-condition), but nothing above the fold names the screen's job |
| Feature completeness | 2 | Feature table: 1 dead (throwback, `home-populated-throwback.png` == populated), 3 hidden (supps, restock, cycle reminder), 2 broken (999-day card `home-empty-full.png`; PRs Logged 9 vs 12) |
| Task success | 3 | Flows 1, 4, 8 pass (SUMMARY); the cycle LOG on this page cannot be tapped at all (D2), and flow 8 ends with no visible confirmation (D14) |
| Speed | 4 | Flow 4: 3 taps / 893ms = best-known 3; flow 8: 4 = best-known 4. Shortfall: the core action costs 1 tap plus a scroll past 659px (measured), and lands on a picker, not a workout |
| State handling | 1 | Band table with A=4, M=1 (error, §4), W=1 (empty) |
| Data correctness | 2 | PRs Logged 9 vs 12 seeded PRs (`home-populated.png`, L26565); no Home number carries a unit (D14, `homeShowsUnit:false`); recap shows "14k kg" where history stores 14,363 kg (`home-populated-recap.png`) |
| Error recovery | 2 | `home-error.png`: yesterday's tip presented as today's, no message, no retry; nothing is lost, nothing is said |

Function mean **2.3**.

## 7. Keep, fix, cut

**Keep**
- `START WORKOUT` as the single accent control — the only element on Home that does the job (`home-populated.png`).
- The up-next feed card: names the session and its exercise count (`home-populated.png`), the one block that answers "train today?".
- Recent Workouts rows: 5 taps into WorkoutDetail, all responded in the crawl.
- Water +250: the only inline write on Home (`quickLogWater` L26124).

**Fix**
- Move the primary above the fold; measured cost to clear it is 534px of read-only blocks.
- `daysSinceLast` sentinel 999 (L18012) leaking into copy (`home-empty-full.png`).
- PRs Logged count (L26565) and missing units on all four tiles (D14).
- Error path for the insight tip: label stale content or say the refresh failed (L17930).
- Voice button overlap that makes the last block's LOG untappable (D2).
- Empty state: teach the first action at the top, not at 1,600px.

**Cut**
- ThrowbackCard — dead even when forced (`home-populated-throwback.png`); fails "every screen finished".
- Weekly Recap button and sheet — 50px for a sheet that is 60% empty and repeats "This Week" (`home-populated-recap.png`); one job per screen.
- Calendar block — 338px, read-only, no target; belongs to Progress, which already has one.
- Stats grid as four tiles — 179px of counts with no units, no trend, no tap; not a daily action.
- Supplement Reminder, Running Low, Cycle Reminder — render nothing under seed; they cannot justify a place they never occupy.
- LayoutEditor — a settings screen that exists to compensate for Home having no order; removing the sprawl removes its reason to exist.
