# Function Audit: Profile (ProfileScreen L30153-L30578)

## Purpose

Profile shows read-only identity and four lifetime training totals, and is the app's only door to Settings.

## Feature inventory

| Feature | Location | Status | Note |
|---|---|---|---|
| Guest banner + SIGN UP | L30244-L30291 | redundant | Settings ACCOUNT renders the same card and `upgradeFromGuest` (page-map 2.17). `profile-populated.png` |
| Avatar, displayName | L30303-L30328 | working | Editable only in Settings (L32549) |
| `@username` | L30329-L30335 | working | Only datum shown nowhere else in the app; read-only after onboarding |
| Settings button | L30336-L30351 | working | Only route to Settings: `go("settings")` occurs at L30340 and L52884 (BetaAdminPanel back). `flow-8-profile.png` |
| Workouts / PRs / Sets tiles | L30362-L30371 | working | Same metrics as Home recap (L26383) and PR Vault overview (L29783); only the lifetime scope differs |
| Volume tile | L30372-L30378 | broken | `item.value > 0 ? TX : MU` compares string `"140k KG"` to 0, so non-zero volume renders muted like the empty case: grey "140k KG" beside white "288" (`profile-populated.png`) |
| Earned badges | L30166-L30206, gate L30396 | hidden | Gated on `lk_gamingLayer`, fixture default false. Absent in `profile-populated.png`, present in `-badges.png` |
| Locked badges | L30211-L30224 | broken | Ladder stops at 10 workouts / 5 PRs; the 25-workout tier (L30186) has no locked counterpart, so `-badges.png` shows no next goal |
| Personal Records list | L30227-L30243, L30510 | broken | `slice(0,6)` caps the list at 6 while the tile reads 9; no "see all", no PR Vault link. `profile-populated-full.png` |
| PR rows tappable | L30521 | dead | Plain `div`s, no handler; PR Vault renders identical rows as `[role=button]` (user-flows 146). Baseline: 2 interactive elements page-wide |
| Plan / trial / usage | — | missing | `can(feature)` gates (L360-L372) and trial banner (L629-L650) exist; `profile-populated.png` names no plan, trial days or usage |
| Signed-in account state | isGuest L30242 | missing | Only signal is the guest banner; no email, sync status or sign-out (all Settings, L32318) |

## Task walkthrough

Flow 8 is the only flow touching Profile (user-flows 265).

| Flow | Steps | Taps | ms | Video | Hesitation |
|---|---|---|---|---|---|
| 8 Change units, return Home | Nav Profile → Settings → Switch to LBS → Nav Home | 4/4, pass, 0 errors | 972 total; 966 on Profile | `flow-8.json`: 1406 Nav Profile, 2372 Settings, 3315 LBS, 4300 Home, 4830 assertion | Step 2: the loudest element is the orange SIGN UP pill; "Settings" is 73x33 of muted outline in the corner. `flow-8-profile.png` |

Profile has no task of its own: 2 controls, 1 of them the exit.

## State coverage

Applicable: empty, populated. Loading and error N/A — no network call, no input (page-map 2.16 "L/X n/a"; `index.md` 450-451).

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty | `profile-empty.png` | present — distinguishing elements: four `0` tiles, "Log your first workout to earn a badge.", no PR section | generic: that instruction sits in the badge block, gated on `lk_gamingLayer` (L30396), off by default, so the shipped empty screen is four zeros, no action control |
| Populated | `profile-populated.png`, `-full`, `-lbs`, `-badges` | present | correct except the muted Volume tile |
| Loading / Error | — | N/A | page-map 2.16 |

A = 2, M = 0, W = 0, G = 1 → band table 4.

## Baseline failures

| Result | Cause |
|---|---|
| Interactive 1/2 (`page-metrics.jsonl` 32) | Not a defect: `nonResponders: []`. The unclicked control is SIGN UP, skipped as destructive/allowlisted (auth overlay L1152). The finding is the denominator: 2 controls |
| axe 1 critical (`axe.json` profile) | `meta-viewport` `user-scalable=no`; global shell, not this page |
| Targets 2/8 under 44px | Both of the page's own buttons: SIGN UP 90x32 (L30273-L30288), Settings 73x33 (L30341-L30350) |
| Populated, empty, console, page errors | all pass, 0 errors |

## Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 2 | `profile-populated.png`: four equal tiles plus six equal rows read as "a stats page", a job Home's recap and PR Vault hold; the real job (reach Settings) is the quietest control, and the one accent-filled element, SIGN UP, advertises a different job. Accent-filled count 1, guest-only; signed-in users get zero primary actions |
| Feature completeness | 3 | Feature table: identity and stats work; Volume broken (L30378), PR list 6 of 9, badges hidden by a default-off flag, locked ladder incomplete, PR rows dead. `profile-populated-full.png`, `-badges.png` |
| Task success | 4 | Flow 8 passes first attempt, 4/4 taps, 0 errors (`flow-8.json`). Shortfall: "see my records" cannot complete here — 6 of the 9 claimed, forcing Home → Progress → PR Vault (`profile-populated-full.png`) |
| Speed | 4 | Settings is 2 taps from anywhere (Nav Profile 1406, Settings 2372 in `flow-8.json`), +1 over a direct settings entry; nothing else is actionable |
| State handling | 4 | A = 2 (loading/error N/A, page-map 2.16), M = 0, W = 0, G = 1: `profile-empty.png` distinguishable and correct, but its only instruction lives in the default-off badge block |
| Data correctness | 3 | Matches seed: 22 workouts = 22 history entries, 9 PRs = 9 `lk_prs` keys, 140k KG = 309k LBS at 2.20462 (`profile-populated.png` vs `-lbs.png`), bench 72.5 kg = 159.75 lb. Units and precision inconsistent: "140k KG" against "72.5kg" in one view; volume to whole thousands, PRs to two decimals; tile 9 vs a 6-row list |
| Error recovery | N/A | No network call, no input on this screen (page-map 2.16); nothing can fail here |

Function mean (6 scored): **3.2**

## Keep

- `@username` and avatar: the only identity surface in the app (`profile-populated.png`).
- Lifetime totals: Home shows the week (L26383), PR Vault counts (L29783); lifetime volume and sets exist only here.
- Guest banner placement: the one screen where account state is legible at a glance (`flow-8-profile.png`).

## Fix

- Volume tile muted when non-zero, string-vs-0 compare L30378 (`profile-populated.png`).
- PR list capped at 6 beside a tile reading 9 (`profile-populated-full.png`).
- SIGN UP 90x32 and Settings 73x33 under 44px (`targets.json`).
- Settings entry is the page's job but its quietest control (`flow-8-profile.png`).
- Empty state teaches nothing with badges off (`profile-empty.png`).
- Locked ladder gives no goal past 10 workouts (`profile-populated-badges.png`).
- Surface plan, trial and gate usage here; today only a fixed banner (L629-L650), absent from `profile-populated.png`.

## Cut

- Guest SIGN UP card: identical job to the Settings ACCOUNT card (page-map 2.17); two doors to one action.
- Badges: default-off, so they teach nothing to a user who never opened Settings; when on, six equal decorative tiles compete with the stats (`profile-populated-badges.png`) and justify no place.
- Dead PR rows: six non-tappable cards styled like PR Vault's tappable rows (L30521, user-flows 146) promise a drill-down the page cannot do.

## North-star answer

A user who never opened Profile would lose `@username`, lifetime sets and volume, and the entrance to Settings. Only the last is load-bearing, and it is 1 of 2 controls: by controls, half of Profile's value is being a doorway; by flow, all of it — flow 8 is the only flow through and passes straight through in 966 ms. Nothing but `@username` is absent from Settings, PR Vault or Home. **Refine** holds only if Profile takes on the account state it hides (plan, trial, sync, sign-out) and drops the stats other pages own; otherwise name the fifth nav tab Settings and fold identity into its header.
