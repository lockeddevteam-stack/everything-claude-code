# LOCKED — Wave 0 Manifest

## Production entry file (verified)

`redesign/input/locked-current-v6.html` — 58,015 lines, 1,839,441 bytes,
md5 `a5c12205e699b730f61df574d827f03d`.

**Byte-identical to what is live at https://locked-seven.vercel.app** (fetched
2026-09-10, md5 matches exactly). This is the production build. Audit it.

### Other files, and whether they ship

| File | Lines | Ships? | What it is |
|---|---|---|---|
| `redesign/input/locked-current-v6.html` | 58,015 | **YES — live on locked-seven.vercel.app** | v6.0 production single-file app |
| `redesign/tests/app/index.html` | 58,015 | no | Test copy of v6, md5 `6338f7ee…` differs (test harness injection) |
| `demo/index.html` | 21,035 | separate deploy | Apple-redesign demo, md5 `48524f5f…` |
| `redesign/10-final/locked-demo.html` | 21,035 | no | Identical to `demo/index.html` (same md5) — duplicate |
| `redesign/08-build/*.html` (16 files) | 496–1,609 | no | Per-screen redesign concept pages |
| `redesign/08-build/{app,chrome,bodymap}.js`, `{tokens,components}.css` | 443–2,633 | no | Redesign build assets |
| `redesign/00-inventory/`, `02-audit-design/`, `09-review/`, `11-apple/` | — | no | Prior audit/review artifacts, screenshots |
| `redesign/tests/` | — | no | Playwright fixtures, baselines, scans |

No `vercel.json` exists in the repo. Root has no build config; the Vercel
`locked` project serves the v6 file, the `locked-demo` project serves `demo/`.

## Script block boundaries in the production file

| Lines | Content |
|---|---|
| 1–14 | doctype, meta, head open |
| 15–119 | inline boot script |
| 122–125 | CDN: React 18.3.1, ReactDOM 18.3.1, supabase-js 2.45.4 (all SRI-pinned) |
| 126–1217 | Supabase client, auth wrapper, paywall, sync |
| 1218–1272 | `<style>` |
| 1276–1954 | second script block |
| **1955–58006** | **main app script (all 111 components)** |
| 58007–58015 | mount script |

## Raw inventory counts (Wave 0)

| Inventory | File | Raw count |
|---|---|---|
| Components (`function [A-Z]`) | `raw/components-function.txt` | **111** |
| Components (`const [A-Z] = (`) | `raw/components-arrow.txt` | 0 |
| `React.memo` / `forwardRef` | `raw/components-memo.txt` | 4 |
| All functions / arrows | `raw/functions-all.txt` | 963 |
| Hook references (`use[A-Z]`) | `raw/hooks.txt` | 842 |
| localStorage/sessionStorage calls | `raw/storage-calls.txt` | 43 |
| Distinct `lk_*` keys | `raw/storage-keys-lk.txt` | 160 |
| IndexedDB | `raw/indexeddb.txt` | **0 (none used)** |
| `fetch(` calls | `raw/net-fetch.txt` | 36 |
| Supabase `.from/.rpc/.auth/.storage/.channel` | `raw/net-supabase.txt` | 14 |
| Distinct URLs | `raw/net-urls.txt` | 284 |
| Event listeners | `raw/events.txt` | 106 |
| Timers | `raw/timers.txt` | 81 |
| PWA / SW / Notification | `raw/pwa.txt` | 26 |
| Gating / premium / beta / dev | `raw/gating.txt` | 85 |

## External services (Wave 0 findings)

| Host | Hits | Use |
|---|---|---|
| `static.exercisedb.dev` | 225 | Exercise demo GIFs/images |
| `lockedapi.cescocugliari.workers.dev` | 24 | **Cloudflare Worker — all AI + server calls** |
| `world.openfoodfacts.org` | 2 | Barcode + food search |
| `api.nal.usda.gov` | 2 | USDA FoodData Central search |
| `fwimdnukebbrwpwdyjbv.supabase.co` | 1 | Supabase project |
| 12 grocery retailer domains | 2 each | Store deep links (Amazon, Walmart, Target, Kroger, Costco, Aldi, Safeway, Publix, Albertsons, Trader Joe's, Whole Foods, Instacart) |
| `unpkg.com`, `cdn.jsdelivr.net` | 5 | React + supabase-js CDN |
| `youtube.com`, `i.ytimg.com` | 2 | Exercise video links |

### Worker routes seen in client
`/beta-sync`, `/beta-validate`, `/analyze-meal` (×2), `/analyze-physique`,
`/parse-receipt`, `/store-search`, `/voice`, plus 12 calls to bare `/` (root).

### Secrets in client code
- `SUPABASE_URL` — line 133 — `https://fwimdnukebbrwpwdyjbv.supabase.co`
- `SUPABASE_ANON` — line 134 — JWT `[REDACTED]` (anon role, exp 2093). Anon keys
  are designed to be public, but RLS must be verified. **Security review item.**
- `usdaKey` — line 19032 — read from localStorage, defaults to `"DEMO_KEY"`.
  User-supplied. **Security review item** (rate-limited shared demo key).

No Cloudflare Worker source, Supabase SQL, migration, RLS policy, or edge
function source exists anywhere in this repo. All server code lives outside it.
Everything server-side is therefore **UNVERIFIED by definition** — flag it.

## Wave 1 line-range assignments

Every line of the production file lands in exactly one agent's range.

| Agent | Range | Lines | Components in range |
|---|---|---|---|
| **10 Shared** | 1–4663 | 4,663 | boot, Supabase client, auth wrapper, paywall, design tokens, CSS, `useHubState`, `useTabReset`, `useSheetDrag`, storage `ld`/`sd`, themes, `ErrorBoundary`, `ScreenBoundary`, `authHeaders`, `aiCall`, beta codes, `syncBetaData`, photos, weight log, `GROUPS`, `ALL_EX` |
| **10 Shared (DS)** | 18441–18640 | 200 | `DsHeader`, `DsSection`, `DsCard`, `DsRow`, `DsSegmented`, `DsStat` |
| **2a Train — exercises** | 4664–8781 | 4,118 | `ThrowbackCard`, `DraftNum`, `Ic`, `LoadingSpinner`, Cardio v2 constants, `ExerciseNotes`, `ExerciseDetailModal`, `ExerciseActionSheet`, `ExLib`, `ExBtn` |
| **2b Train — logging** | 8782–13955 | 5,174 | `ReplacePanel`, `SplitBuilder`, `NumPad`, `WorkoutLog` |
| **2c Train — hub** | 13956–18440 | 4,485 | `AISplitBuilder`, `AdaptiveTrainingCard`, `Pill`, `Section`, `TrainHub`, `Review`, `ConvertToSplitModal`, `WorkoutDetail`, `ProactiveTipCard`, `DynamicFeed` |
| **3a Fuel — panels** | 18641–22416 | 3,776 | `DayNutritionPanel`, `TrendsTab`, `RecipeLogSheet`, `RecipeBuilder`, `QuickChip`, `BarcodeTab`, `FuelDisplayCard`, `PrivacyCard`, `TdeeReportCard` |
| **6b Cycle tracking** | 22417–26140 | 3,724 | `McRing`, `CycleTrackerCard`, `McOnboarding`, `Btn`, `McLogSheet`, `McCalendar`, `McSettings`, `McHealthCard`, `McRecoveryCard`, `McEcCard`, `McTrainingCard`, `McNutritionCard`, `McFuelStrip`, `McTrainBanner`, `CycleTrackerScreen` |
| **1 Home** | 26141–28322 | 2,182 | `QuickActionsRow`, `HomeScreen`, `GoalsTab` |
| **2d Progress / PRs** | 28323–30152 | 1,830 | `ProgressPage`, `PRHub` |
| **6 Profile** | 30153–33807 | 3,655 | `ProfileScreen`, `ProgressPhotos`, `LayoutEditor`, `NotificationsCard`, `TextSizeCard`, `StorageCard`, `SettingsScreen` |
| **9 Onboarding** | 33808–35762 | 1,955 | `Onboarding` |
| **3b Fuel — main tab** | 35763–38553 | 2,791 | `MacroRing`, `FuelProfileSetup`, `WaterCard`, `SmartNutritionCard`, `FuelTab`, `MealPlanFuelTab` |
| **3c Fuel — entry** | 38554–42078 | 3,525 | `ListTab`, `ManualEntry`, `SearchTab`, `PhotoTab`, `RecipesTab`, `RCard` |
| **4 Shopping & Budget** | 42079–46184 | 4,106 | `MyStoresTab`, `ShoppingTab`, `RunningLowCard`, `PantryTab`, `BudgetTab`, `MealPlannerTab`, `ShoppingBudgetTab` |
| **4b Supplements / Cycle tab** | 46185–49399 | 3,215 | `SuppReminderCard`, `SupplementsTab`, `CycleReminderCard`, `CycleTab`, `Placeholder` |
| **5 Coach** | 49400–53209 | 3,810 | `CoachCardioCard`, `CoachSetupSection`, `CoachSetupPane`, `CoachInterview`, `CoachScreen`, `FeedbackScreen`, `BetaAdminPanel` |
| **7 Misc / gamification** | 53210–55509 | 2,300 | `RefeedCard`, `WeightLogCard`, `VoiceButtonWrap`, `VoiceButton`, `TutorialOverlay`, `PlateCalc` |
| **2e Cardio** | 55510–57185 | 1,676 | `CardioStar`, `CardioFavorites`, `CardioHistory`, `CardioSection`, `CardioLogFlow`, `CeCount`, `CeTierMeter` |
| **8 App root / auth / sync** | 57186–58015 | 830 | `App` (root, routing, tab bar, auth wiring) + cross-cutting auth/sync grep across all ranges |

Coverage: 1–58015, no gaps, no overlaps.

## Component tree (root → tabs)

```
App (57186)
├── ErrorBoundary / ScreenBoundary (shared, 2540/2601)
├── Onboarding (33808)              [first run]
├── TutorialOverlay (54228)
└── 5 tabs
    ├── Home    → HomeScreen (26220)
    │              ├── QuickActionsRow (26141)
    │              ├── DynamicFeed (17998) / ProactiveTipCard (17858)
    │              ├── ThrowbackCard (4664)
    │              ├── AdaptiveTrainingCard (14881)
    │              ├── WeightLogCard (53312) / RefeedCard (53210)
    │              ├── McFuelStrip (24915) / McTrainBanner (25064)
    │              └── GoalsTab (26992)
    ├── Train   → TrainHub (15013)
    │              ├── WorkoutLog (10013) + NumPad (9847) + PlateCalc (54925)
    │              ├── SplitBuilder (8782) / AISplitBuilder (13956)
    │              ├── ExLib (7761) + ExerciseDetailModal (7202)
    │              ├── Review (15965) / WorkoutDetail (17084)
    │              ├── CardioSection (56216) + CardioLogFlow (56343)
    │              ├── ProgressPage (28323) / PRHub (29165)
    │              └── ConvertToSplitModal (16622) / ReplacePanel (8625)
    ├── Fuel    → FuelTab (36895)
    │              ├── SearchTab (39355) / BarcodeTab (20859) / PhotoTab (40360)
    │              ├── ManualEntry (39088) / ListTab (38554)
    │              ├── RecipesTab (40760) + RecipeBuilder (20275)
    │              ├── DayNutritionPanel (19693) / TrendsTab (19781)
    │              ├── FuelProfileSetup (35794) / TdeeReportCard (21751)
    │              ├── WaterCard (36538) / SmartNutritionCard (36671)
    │              ├── MealPlannerTab (45234) / MealPlanFuelTab (37469)
    │              ├── ShoppingBudgetTab (45968)
    │              │     ├── ShoppingTab (42420) / MyStoresTab (42079)
    │              │     ├── PantryTab (43578) / RunningLowCard (43542)
    │              │     └── BudgetTab (43974)
    │              ├── SupplementsTab (46278)
    │              └── CycleTab (47432) → CycleTrackerScreen (25108)
    ├── Coach   → CoachScreen (49915)
    │              ├── CoachSetupPane (49483) / CoachInterview (49750)
    │              ├── CoachCardioCard (49400)
    │              ├── VoiceButton (53718)
    │              └── FeedbackScreen (52547) / BetaAdminPanel (52806)
    └── Profile → ProfileScreen (30153)
                   ├── SettingsScreen (32031)
                   ├── ProgressPhotos (30585)
                   ├── LayoutEditor (31492)
                   └── NotificationsCard / TextSizeCard / StorageCard (31756/31945/31987)
```

## Wave 0 drift flags (to confirm in Wave 2)

1. **Gamification largely absent.** `xp` = 1 hit, `achievement` = 1 hit, `clan`
   = 0, `leaderboard` = 0. Only `streak` (44) and `badge` (35) exist. The claim
   "XP, clans" looks wrong.
2. **No Groq or Llama model name in client code.** Zero matches for `groq`,
   `llama`. All AI is proxied through the Cloudflare Worker. Model selection is
   server-side and not auditable from this repo.
3. **No IndexedDB.** Zero matches. All local persistence is localStorage.
4. **Only one Supabase table referenced in the app script**: `profiles`
   (line 57229). Cloud sync goes through the Worker, not direct Supabase writes.
5. **Two extra top-level areas not in the stated 5-tab model**: cycle tracking
   (~3,700 lines) and cardio (~1,700 lines).
6. **`demo/index.html` is a second, parallel 21k-line app** (Apple redesign),
   deployed separately. Not the same codebase as v6.
