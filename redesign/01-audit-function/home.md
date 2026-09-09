# Function Audit — Home (`home`)

HomeScreen L26220, DynamicFeed L17998, QuickActionsRow L26141. Captures: `screenshots/current/home-*.png`. "Measured" = my Playwright run, iPhone 15 Pro, seeded, `.lk-scroll` child rects.

## 1. Purpose

Home should tell the lifter whether to train today and start that session in one tap; today it is a 1,688px dashboard of ten blocks whose one primary action starts 659px down, below a 588px viewport.

Hypothesis partly overturned: Home has one primary-styled control, the accent `START WORKOUT` (`home-populated.png`, L26629), and renders 10 blocks under seed, not 12. The defect is worse than "no primary": it needs a scroll. Measured (scrollHeight 1,688, clientHeight 588):

| # | Block | Top | H | Returns |
|---|---|---|---|---|
| 1 | Greeting | 0 | 125 | name |
| 2 | Stats grid | 125 | 179 | 4 counts, no units, untappable |
| 3 | Quick actions | 304 | 94 | 1 inline log, 2 navigations |
| 4 | Feed | 398 | 261 | "train today?" |
| 5 | **START WORKOUT** | **659** | 69 | the job |
| 6 | VIEW PROGRESS | 728 | 52 | Progress entry |
| 7 | Weekly Recap | 780 | 50 | sheet, 4 numbers |
| 8 | Calendar | 830 | 338 | dots, no target |
| 9 | Recent Workouts | 1168 | 408 | drill-in |
| 10 | Cycle tracker | 1590 | 74 | LOG, blocked |

534px (blocks 2, 3, 8) is read-only. LayoutEditor is real but lives in Settings (L32192 → L31492): a reorder tool one tab away instead of an ordered screen.

## 2. Feature inventory

| Feature | Line | Status |
|---|---|---|
| Stats grid | L26547 | broken: "PRs Logged" = `Object.keys(prs).length` = 9 (L26565) vs 12 seeded PRs |
| Today's Insight | L17858, L17904 | works, hidden by default; POSTs on mount when the tip is not dated today |
| Quick actions (8 defined, 3 shown) | L26141 | works; Water logs inline (L26124); 5 of 8 targets are Fuel |
| Feed cards | L18055 | broken: comeback card prints the sentinel "999 days since your last session" (`home-empty-full.png`; L18012, L18364) |
| START WORKOUT | L26629 | works, below fold |
| VIEW PROGRESS | L26668 | redundant: a button standing in for a missing destination |
| Weekly Recap | L26698 | works (`home-populated-recap.png`) |
| Calendar; Recent Workouts, See all | L26728; L26816 | work; calendar read-only |
| Cycle tracker card | L26611 | broken in situ: LOG unclickable (§5) |
| Supp Reminder, Running Low, Cycle Reminder | L26659/62/65 | hidden: null under seed, in no capture |
| ThrowbackCard | L26600 | dead: `home-populated-throwback.png` (forced) is indistinguishable from `home-populated.png` |
| LayoutEditor | L31492 | works, hidden from Home |

## 3. Task walkthrough

| Flow | Home's part | Taps | ms | Video | Hesitation |
|---|---|---|---|---|---|
| 1 guest → first set | tap 3 of 14: START WORKOUT | 14 (17 cold) | 3090 | `flow-1` 6897 | below fold, and it opens a picker, not a workout |
| 4 Home → lift chart | tap 1 of 3: VIEW PROGRESS | 3 | 893 | `flow-4` 1382→3803 | best-known 3, but the entry is a button 728px down; no Progress tab |
| 8 units → Home | final Nav Home | 4 | 972 | `flow-8` 4300→4830 | D14: no Home number carries a unit, so the change is invisible |
| 3 finish → save | landing + toast (`flow-3-home-saved.png`) | 3 | 1076 | — | save throws `syncBidirectional is not defined` (D1) |

## 4. State coverage

| State | Capture | Present | Quality |
|---|---|---|---|
| Populated | `home-populated.png` | yes | correct |
| Empty | `home-empty-full.png` | yes (zeros, "Set up your first split") | **wrong**: "999 days since your last session"; teaching card is the last block |
| Loading | `home-loading.png` | yes: "TODAY'S INSIGHT / *Analysing your data…*", absent from populated (test 2b) | correct |
| Error | `home-error.png` | **missing**: diffed against `home-loading.png` (same seed, offset, theme), the card shows a stale cached tip under "TODAY'S INSIGHT", identical to a successful fetch (catch L17930) | — |

A = 4, M = 1, W = 1.

## 5. Baseline failures

| Item | Result | Cause |
|---|---|---|
| Blocked click "LOG" | home/interactive: voice button `intercepts pointer events` (D2) | VoiceButton fixed 50x50 L54052 over cycle LOG L22735, Home's last block (top 1,590) |
| 4/20 targets under 44px | `targets.json` | "Up next" 243x38, "Weekly Recap" 353x42, "See all" 58x25, "LOG" 60x33 |
| 12 recoveries, 14-element crawl | SUMMARY | 11 of 14 controls navigate away: Home is a link list |
| Network on load | POST L17904 when tip not dated today | fires before user intent; failure shows nothing (§4) |

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 2 | `home-populated.png`: at the fold, 4 stat tiles, 3 quick actions, 2 feed cards; measured primary top 659 vs 588 viewport. One primary-styled control exists (3-condition); nothing above the fold names the job |
| Feature completeness | 2 | §2: 1 dead (`home-populated-throwback.png` == populated), 3 hidden, 2 broken (999-day card; PRs 9 vs 12) |
| Task success | 3 | Flows 1, 4, 8 pass (SUMMARY); the cycle LOG cannot be tapped (D2); flow 8 ends with no confirmation (D14) |
| Speed | 4 | Flow 4: 3 taps/893ms = best-known 3; flow 8: 4 = best-known. Shortfall: the core action costs 1 tap plus a 659px scroll and lands on a picker |
| State handling | 1 | Band table, A=4, M=1 (error), W=1 (empty), §4 |
| Data correctness | 2 | PRs Logged 9 vs 12 (`home-populated.png`, L26565); no unit on any Home number (D14); recap "14k kg" vs 14,363 kg stored (`home-populated-recap.png`) |
| Error recovery | 2 | `home-error.png`: yesterday's tip presented as today's, no message, no retry; nothing lost, nothing said |

Function mean **2.3**.

## 7. Keep, fix, cut

**Keep**
- `START WORKOUT`, the only element that does the job (`home-populated.png`).
- Up-next feed card: names the session and exercise count.
- Recent Workouts rows: 5 drill-ins, all responded.
- Water +250: the only inline write (L26124).

**Fix**
- Raise the primary above the fold: 534px of read-only blocks precede it.
- Sentinel 999 in copy (L18012).
- PRs Logged count (L26565); units on tiles (D14).
- Insight error path: mark stale content or say the refresh failed (L17930).
- Voice-button overlap hiding the last block's LOG (D2).
- Empty state: teach the first action at the top.

**Cut**
- ThrowbackCard: dead even when forced (`home-populated-throwback.png`); fails "every screen finished".
- Weekly Recap: 50px for a 60%-empty sheet repeating "This Week" (`home-populated-recap.png`).
- Calendar: 338px, read-only; Progress owns this.
- Stats grid: 179px of unit-less, untappable counts; not a daily action.
- Supp Reminder, Running Low, Cycle Reminder: render nothing under seed.
- LayoutEditor: exists only because Home has no order; fixing the order removes it.
