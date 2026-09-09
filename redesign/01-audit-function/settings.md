# Function audit — Settings (SettingsScreen L32031, LayoutEditor L31492)

## Purpose
Settings is the drawer for everything with nowhere else to live — profile fields, preferences, feature flags, export, beta scaffolding and the Home layout editor — so its only job is "the rest of the app".

## Feature inventory
29 `button` createElements in L32031–33800 (grep); 44 interactive elements in the guest capture (`page-metrics.jsonl`). **S** setting, **A** one-time account action, **D** developer/beta scaffolding.

| Group | Controls (line) | Class | Status |
|---|---|---|---|
| Chrome | Back to profile 32131 | — | works (`settings-populated.png`) |
| Home layout | CUSTOMIZE 32191 → LayoutEditor 31492 | S | redundant: reorders Home from another tab (`settings-populated-layout-editor-full.png`) |
| Account, guest | SIGN UP 32236 | A | works; crawl-skipped as destructive |
| Account, signed-in | SYNC NOW 32318, Sign out 32379, Update Password 32471, Delete Account 33784 | A | hidden in the guest build; absent from every capture |
| Profile | Display name + Save Name 32549 | S | works |
| Body stats | age, sex ×2, weight, height, goal ×3, Save Stats 32771 | S | **broken** with the unit switch (below) |
| Preferences | Weight Unit 32825; check-ins ×3 32861; App Style ×5 32036 | S | work (`settings-populated-units-lbs.png`) |
| Notifications | Push toggle 31756 | S | works; permanent red blocked-by-browser line (scrolled-3) |
| Workout tracking | Partial reps 32996; Streaks/badges 33049; "Weight units" explainer | S / D | toggles work; explainer sits 700 px from its control and claims switching "converts what you see" — false (scrolled-3) |
| Fuel display | Hide calories; Left/Eaten | S | work; govern another tab |
| Privacy | disclosure +/− | S | works |
| Text size | 4 chips 31945 | S | work (scrolled-4) |
| Storage | usage bar 31987 | — | display only |
| Export | Nutrition CSV, Full backup, Restore | A | crawl-skipped |
| Voice | Microphone button 33263 | D | flag for the button that blocks other pages' controls (D2) |
| Performance tracking | Cycle Logging 33336 | D | feature flag; adds a whole tab, crawl records `navigatedAway: true` |
| Beta testing | code + Verify 33393–33440 | D | shipped to every user; no busy state; fail-open |
| Help | 🎯 Replay Tutorial 33629 | D | replays the overlay the directive cuts; emoji in UI |
| Danger | Reset all data 33665 two-tap (`settings-populated-reset-armed.png`); Delete Account 33784 | A | work |

Three established defects, with consequences: (1) **Verify has no busy state** — with the request in flight, `settings-loading.png` differs from control `settings-populated-beta.png` by one subpixel, 0.0001% (index.md Capture corrections); on a slow network a tap is indistinguishable from no tap. (2) **Fail-open validation** — `.catch` calls `onResult(true)` (L2751–2753, D7): a network failure *grants* beta access and renders the verified panel. (3) **Unit switch relabels body weight without converting** — `bodyWeight` seeds once at mount (L32087–32090), so "(kg) 64.25" becomes "(lbs) 64.25" and the next Save Stats divides by 2.20462, writing 29.1 kg.

**Dead / hidden**: no dead controls; the signed-in account block is hidden from the guest build the app defaults to.

## Task walkthrough
Flow 8 (change units, return Home) is the only flow touching this page.

| Step | Tap | t_ms (`flow-8.json`) | Hesitation |
|---|---|---|---|
| 1 | Nav Profile | 1406 | units are not obviously under Profile |
| 2 | Settings | 2372 | — |
| 3 | KG - Switch to LBS | 3315 | ~2,100 px of scroll past ACCOUNT and body stats |
| 4 | Nav Home | 4300 | no unit-bearing value on Home confirms it (D14) |

4/4 taps, 972 ms, pass (`flow-metrics.jsonl`). Baseline populated/error/interactive passed; 41/44 controls responded, 0 non-responders, 0 errors.

## State coverage
Applicable = 3; empty is N/A (page-map 2.17 "E n/a": no list).

| State | Capture | Present? | Quality |
|---|---|---|---|
| Populated | `settings-populated.png` + 6 scrolls | yes | correct |
| Loading | `settings-loading.png` vs `settings-populated-beta.png` | **missing**: 0.0001% diff; test 2b finds no spinner, no `aria-busy`, Verify still enabled | — |
| Error | `settings-error.png` | present: red "Invalid code", 16.78% diff, card 135→151 px | correct for a resolved-invalid reply; **wrong for the network cause**, which renders the verified panel |
| Empty | — | N/A | — |

M=1, W=1 → band table gives **1**.

## Baseline failures
- D7 fail-open beta validation (L2722/2731, L2751–2753) — the page's only network branch is unsafe.
- D14 no confirmation after a unit change (HomeScreen L26547+).
- D9 `meta-viewport` blocks zoom (L5; the page's 1 axe violation).
- D12 **28 of 49 targets under 44×44** (`targets.json`), the worst count of any page; mostly LayoutEditor ▲/▼ and chip rows.
- No non-responders or blocked clicks; contrast 0/101 fails (3 unknown).

## Rubric scores (Function)

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 3 | `settings-populated.png`: job inferable, but the first card is Home Layout, 12 sections follow, PREFERENCES appears twice |
| Feature completeness | 3 | All controls respond (41/44 crawl); LayoutEditor redundant, 5 controls scaffolding |
| Task success | 4 | Flow 8 passes first attempt, 4/4 taps; shortfall: body weight must be retyped after a unit switch (`settings-populated-units-lbs.png`) |
| Speed | 5 | 4 taps = best-known for a unit switch (`flow-8.json`, 972 ms) |
| State handling | 1 | A=3 (empty N/A, page-map 2.17); loading missing (0.0001% vs `settings-populated-beta.png`), error wrong for the network cause. M=1, W=1 |
| Data correctness | 1 | `settings-populated-units-lbs.png`: 64.25 kg under the "lbs" label; unit-label bug = anchor 1 |
| Error recovery | 2 | `settings-error.png`: "Invalid code", no cause, no next step; network failure silently succeeds (D7); no work lost |

**Function mean 2.7.**

## Keep, fix, cut
**Keep**
- Weight Unit, App Style, Text Size, check-ins, partial reps, notifications — real preferences, all responded.
- Two-tap Reset arming (`settings-populated-reset-armed.png`), the right destructive pattern.
- Export/Restore and account actions, moved to a separate Account destination.

**Fix**
- Recompute `bodyWeight` on unit change (L32087): a relabel that rewrites 64.25 kg to 29.1 kg is data loss.
- Put a unit-bearing value on Home so flow 8 confirms itself (D14).
- Fold the "Weight units" explainer into the Weight Unit row; correct its claim.
- Deduplicate headers: PREFERENCES twice, DATA & SYNC twice (scrolled-4 ≈2324 px, scrolled-5 ≈3399 px).
- Raise the 28 sub-44 px targets.

**Cut**
- **LayoutEditor** (51 controls: 14 blocks × ▲▼ + Hide, 8 quick actions, Reset). It exists because Home has no priority, and hands the user that design work one tab away; north star 1 is met by ordering Home, not by exporting the decision. Its ▲▼ pairs supply most of this page's target failures.
- **Beta testing card**: no busy state, and grants access when the network fails — unfinished, and wrong when it fails.
- **🎯 Replay Tutorial**: replays the overlay the directive cuts; emoji in UI.
- **Cycle Logging / Microphone flags**: a toggle that adds or removes a tab is build configuration, not a preference; the voice button blocks controls on two other pages (D2).
