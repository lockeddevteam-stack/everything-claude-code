# LOCKED — Full Feature & Function Audit

Read-only audit of the production build. No application code was changed.
Every claim below cites `file:line` in the production file.

---

## 1. Summary

| | |
|---|---|
| **Build** | LOCKED v6.0 (`<!-- LOCKED v6.0 - Auth System, Cloud Sync, Paywall, Progress Photos -->`, line 1) |
| **Production file** | `redesign/input/locked-current-v6.html` |
| **Size** | 58,015 lines / 1,839,441 bytes |
| **md5** | `a5c12205e699b730f61df574d827f03d` |
| **Verified live** | Byte-identical to `https://locked-seven.vercel.app` (fetched 2026-09-10) |
| **Stack** | Single-file HTML, React 18.3.1 + ReactDOM via unpkg (SRI-pinned, lines 122-123), supabase-js 2.45.4 via jsDelivr (line 125). Compiled to `React.createElement` — no JSX, no build step, no bundler. |
| **Components** | 111 |
| **Functions indexed** | 1,540 |
| **Features catalogued** | 541 |
| **Storage keys** | 82 logical (`ld`/`sd`) + 14 raw-access keys/prefixes |
| **External services** | 5 (Cloudflare Worker, Supabase, OpenFoodFacts, USDA FDC, ExerciseDB) |

### Status counts

| Status | Count | Share |
|---|---|---|
| WORKING | 389 | 71.9% |
| PARTIAL | 104 | 19.2% |
| DEAD | 20 | 3.7% |
| UNVERIFIED | 10 | 1.8% |
| BROKEN | 1 | 0.2% |
| Unspecified | 17 | 3.1% |
| **Total** | **541** | |

`UNVERIFIED` is concentrated on server-side behaviour. No Cloudflare Worker
source, Supabase SQL, migration, RLS policy or edge function exists anywhere in
this repository, so everything behind the Worker is unauditable here by
definition.

### Features by area

| Area | Features |
|---|---|
| Train (logging, hub, exercises, progress, PRs) | 100 |
| Profile & Settings | 74 |
| Fuel (nutrition, entry, panels, planning) | 73 |
| Cycle tracking (menstrual) | 57 |
| Coach (AI) | 40 |
| Shopping | 33 |
| Cardio | 26 |
| Onboarding | 17 |
| System (PWA, errors, notifications) | 16 |
| Home | 16 |
| Auth | 14 |
| Supplements | 11 |
| Budget | 10 |
| App root & navigation | 10 |
| Misc widgets | 9 |
| Shared / design system | 9 |
| Goals | 8 |
| Sync | 5 |
| Paywall | 4 |
| Beta program | 4 |
| Gamification | 3 |
| Storage | 2 |

---

## 2. Feature map

```
App (57186) — root, tab routing, mount at 58007
├── Onboarding (33808-34767)          first run, 9 steps
├── TutorialOverlay (54228)           coach marks
├── ErrorBoundary (2540) / ScreenBoundary (2601)
│
├── HOME — HomeScreen (26220)
│   ├── QuickActionsRow (26141)
│   ├── DynamicFeed (17998) · ProactiveTipCard (17858)   AI daily tip
│   ├── ThrowbackCard (4664)
│   ├── AdaptiveTrainingCard (14881)
│   ├── WeightLogCard (53312) · RefeedCard (53210)
│   ├── CycleTrackerCard (22596)      gated: isFemaleUser
│   ├── McTrainBanner (25064)
│   ├── streak + badges                gated: lk_gamingLayer (default OFF)
│   └── GoalsTab (26992)
│
├── TRAIN — TrainHub (15013)
│   ├── WorkoutLog (10013-13955)      the core loop, 3,943 lines
│   │   ├── NumPad (9847) · PlateCalc (54925) · ReplacePanel (8625)
│   │   └── rest timer, supersets, warmups, drop sets, RIR, partials
│   ├── SplitBuilder (8782) · AISplitBuilder (13956)     AI program generation
│   ├── ExLib (7761) → ExerciseDetailModal (7202) → ExerciseActionSheet (7496)
│   ├── Review (15965)                post-workout + AI insight
│   ├── WorkoutDetail (17084) · ConvertToSplitModal (16622)
│   ├── ProgressPage (28323) → PRHub (29165)
│   └── CardioSection (56216) → CardioLogFlow (56343)   4-step, 41 activities
│
├── FUEL — FuelTab (36895)            two-level nav, persisted
│   ├── view: main | profile (FuelProfileSetup 35794) | shop
│   ├── Log group:  list · search · scan · photo · trends · supps · cycle
│   ├── Meals group: plan · recipes
│   ├── ListTab (38554) — free-text AI estimate
│   ├── SearchTab (39355) — My Store + FOODS + USDA + OFF
│   ├── BarcodeTab (20859) — OFF then USDA
│   ├── PhotoTab (40360) — AI vision
│   ├── ManualEntry (39088) · RecipesTab (40760) → RCard (40920)
│   ├── MealPlanFuelTab (37469) — AI meal plans
│   ├── WaterCard (36538) · MacroRing (35763) · SmartNutritionCard (36671)
│   ├── SupplementsTab (46278) → SuppReminderCard (46185)
│   ├── CycleTab (47432) "Stack" — gated: lk_perfTracking (default OFF)
│   └── ShoppingBudgetTab (45968)
│       ├── ShoppingTab (42420) · MyStoresTab (42079)
│       ├── PantryTab (43578) → RunningLowCard (43542)
│       └── BudgetTab (43974) — receipt parsing, AI price compare
│
├── COACH — CoachScreen (49915)
│   ├── CoachSetupPane (49483) · CoachInterview (49750)
│   ├── CoachCardioCard (49400) · VoiceButton (53718)
│   ├── check-in flow
│   └── FeedbackScreen (52547) · BetaAdminPanel (52806, unreachable)
│
├── PROFILE — ProfileScreen (30153)
│   ├── SettingsScreen (32031)        32 persisted settings
│   ├── ProgressPhotos (30585)        AI physique analysis
│   ├── LayoutEditor (31492)          home card ordering
│   └── NotificationsCard (31756) · TextSizeCard (31945) · StorageCard (31987)
│
└── CYCLE TRACKING (separate route "cycletrack")
    └── CycleTrackerScreen (25108)
        ├── McOnboarding (22751) · McLogSheet (23147) · McCalendar (23754)
        ├── McSettings (24066) · McRing (22417)
        └── McHealthCard · McRecoveryCard · McEcCard · McTrainingCard · McNutritionCard
```

### Full feature entries

All 541 entries, grouped by area with status, storage, network and notes, are in
**[`FEATURES_BY_AREA.md`](FEATURES_BY_AREA.md)**. Per-field detail for every
entry (user action, numbered behaviour, components, functions, state, edge
cases, gating, evidence) is in the 18 reports under `audit/agents/`. The
machine-readable form is `features.json`.

---

## 3. Data layer

### 3.1 Storage architecture

There is no IndexedDB anywhere (`raw/indexeddb.txt` = 0 matches). All local
persistence is localStorage, through **three coexisting layers**:

1. **The `ld`/`sd` wrapper** (2417-2451) — 82 logical keys. Prefixes every key
   with `lk_` and JSON-encodes (2420, 2437). Assumes a 5 MB budget (2470).
2. **Direct raw access** — 14 further keys and prefixes bypass the wrapper
   entirely (table below), so they escape quota warnings and sync.
3. **A monkey-patched `setItem`** (233-235) that shadows every write with a
   `__lk_ts__<key>` timestamp used by sync.

| Raw-access key / prefix | Lines | Purpose |
|---|---|---|
| `lk_theme` | 20 | boot-time theme, read before React |
| `lk_textScale` | 38 | boot-time text scale |
| `lk_deployVersion` | 83, 96, 114, 33577 | deploy check / cache bust |
| `lk_guestMode` | 166, 169, 287-288 | guest flag — **grants `isPro:true`** (161-163) |
| `lk_profile` | 171-172 | seeded directly on guest start |
| `lk_mcCloudSync` | 224, 1188 | cycle-data sync opt-in |
| `__lk_ts__<key>` | 397, 1193, 19476, 19494 | per-key sync timestamps |
| device id | 1345, 1358 | device identifier |
| `test` | 2413-2414 | availability probe, not cleaned up on throw |
| `lk_customEx` | 4278 | custom exercises, raw parse |
| `lk_weightStorageUnit` | 4389 | unit preference |
| `lk_throwbackForce` | 4604 | debug flag |
| `yt3_*` | 7068, 7083 | YouTube id cache — **no `lk_` prefix** |
| `lk_mcProfile`, `lk_mcDays` | 26009-26010 | deleted raw on "delete all cycle data" |

**`sd()` returns `true` when storage is unavailable** (2437 — the `return true`
sits outside the `if (storageAvailable)` guard), so private-browsing users get
silent, undetectable data loss even in callers that correctly check the return.

### 3.2 Supabase usage

| Table / call | Line | Status |
|---|---|---|
| `.from("profiles")` | 57229 | **DEAD** — `_client` (153) is never exported outside the auth IIFE |
| `.auth.signUp` | 380 | live |
| `.auth.signInWithPassword` | 386 | live |
| `.auth.signOut` | 413 | live |
| `.auth.updateUser` | 420 | live |
| `.auth.resetPasswordForEmail` | 434 | live |
| `.auth.getSession` | 299, 441 | live |
| `.auth.onAuthStateChange` | 282 | live |
| `.auth.resend` | — | live |

Supabase is used **for authentication only**. The single PostgREST call is
unreachable. All data movement goes through the Cloudflare Worker.

---

## 4. External services

| Service | Host | Calls | Auth |
|---|---|---|---|
| **Cloudflare Worker** | `lockedapi.cescocugliari.workers.dev` | 24 | inconsistent — see below |
| Supabase | `fwimdnukebbrwpwdyjbv.supabase.co` | auth only | anon JWT (line 134) |
| OpenFoodFacts | `world.openfoodfacts.org` | 2 | none (public) |
| USDA FoodData Central | `api.nal.usda.gov` | 2 | `usdaKey`, defaults `DEMO_KEY` (19032) |
| ExerciseDB | `static.exercisedb.dev` | 225 image URLs | none |
| 12 grocery retailers | various | deep links only | n/a |

### Worker routes

| Route | Call sites | Auth header? |
|---|---|---|
| `/` (bare root, AI) | 12 | mixed — `aiCall` yes (2658), `callWorker` **no** (13996, 17907, 33869) |
| `/analyze-meal` | 38564, 40385 | no |
| `/analyze-physique` | 30626 | **no** |
| `/parse-receipt` | 44083 | **no** |
| `/store-search` | 42458 | no |
| `/voice` | 53766 | **no** |
| `/beta-sync` | 2823 | **no** |
| `/beta-validate` | 2735 | no |

**No model name appears anywhere in client code.** Zero matches for `groq` or
`llama` across all 58,015 lines; no `model` field in any request body (49775,
50064, 2666). The only `model:` occurrence is `"pandolf-santee"` (6234), a
metabolic energy-expenditure model, not an AI model. Model selection is
server-side and **UNVERIFIED**.

---

## 5. Orphans

### 5.1 Dead components — defined, never rendered
Verified by whole-file reference count of exactly 1 (the definition itself).

| Component | Line | Note |
|---|---|---|
| `DayNutritionPanel` | 19693 | |
| `RecipeBuilder` | 20275 | |
| `RecipeLogSheet` | 20039 | |
| `QuickChip` | 20800 | |
| `MealPlannerTab` | 45234 | ~670 lines; live twin is `MealPlanFuelTab` (37469), same storage key |
| `McFuelStrip` | 24915 | cycle→Fuel pathway |
| `Placeholder` | 48843 | "Coming soon" scaffolding, zero render sites |
| `IcMemo` | 5255 | |
| `LoadingSpinner` / `LoadingMemo` | 5256 | only referenced by each other |
| `ascendFetchDetail` | 7089 | intended ExerciseDB detail fetch |
| `DsSection` | 18489 | design system |
| `DsCard` | 18513 | design system |
| `DsRow` | 18530 | design system |
| `DsStat` | 18610 | design system |

`DsHeader` (18441) and `DsSegmented` (18573) have exactly one call site each
(25332, 19815). **Four of six design-system primitives are unused.**

### 5.2 Unreachable code
- **`BetaAdminPanel`** (52806) — mounted at 57710 but no `go("betaAdmin")`
  exists anywhere, so no navigation path reaches it.
- **`PRHub` "Overview" tab** (29708-29966, ~260 lines) — `tab` is always
  `"prs"` because `ProgressPage` always passes `defaultTab:"prs"` and `onBack`
  (28438-28452), and the `setTab` buttons render only when `onBack` is absent.
- **`LOCKED.can()`** (361-370, exported 1157) — zero call sites in 58,015
  lines. Entitlement logic exists but nothing consults it.
- **`CE_SURFACE_TO_PANDOLF`** (6005) — dead; `pandolfTerrain` is never set, so
  every hike and ruck runs at terrain factor 1.0.
- **`mcFuelContext`** (24876) and **`mcLutealCalBump`** (24912) — no call sites.

### 5.3 Storage orphans
- `weightsKgMigrated` — written 4460, never read. Migration flag nothing checks.
- `unitConversion` — read 4293 (`ld("unitConversion", true)`), never written.
- `fuelSettings.waterGoalMl` — exists (18651) but the water goal is hardcoded
  to 3000 ml (36541).

### 5.4 Collected but never used
- **Allergies and fridge contents** — collected at 36510 under the label "Used
  for meal suggestions", absent from both meal-AI payloads (36699-36707,
  37583-37604). An allergy field ignored by a meal-suggestion AI.
- **`preferences` chips** — unused by the meal planner.
- **Favourite `useCount` / `lastUsedAt`** (cardio) — never updated.

---

## 6. Drift — where the brief and the code disagree

| # | Brief said | Code says | Evidence |
|---|---|---|---|
| 1 | "Gamification (XP, clans) exists as optional secondary features" | **No XP, no levels, no clans, no leaderboards.** Zero matches for `clan` or `leaderboard`; `xp` has no standalone match; `achievement` appears once, as settings copy (33045). What exists: a streak counter and 7 badges, neither persisted. | 26237-26252, 30166-30208 |
| 2 | Gamification is *optional secondary* (implying on by default) | Behind `lk_gamingLayer`, **default `false`** — opt-in, not opt-out | 33049, 26423, 32067 |
| 3 | "AI coaching through Groq (Llama models)" | **No model name exists client-side.** Zero `groq`/`llama` matches; no `model` field in any request body. All AI proxies through the Worker; model choice is server-side and unverifiable from this repo. | 49775, 50064, 2666 |
| 4 | "Beta AI interactions logged to `lk_betaAILog`" | **Coach chat and the interview are never logged.** Both bypass the shared `aiCall` wrapper, so the log captures only the 9 *other* call sites. The flagship AI feature is the one thing missing. | 49764-49793, 50048-50100 vs 2663 |
| 5 | "About 111 components" | **Exactly 111.** Correct. | `raw/components-function.txt` |
| 6 | "5 tabs: Home, Train, Fuel, Coach, Profile" | Correct, but menstrual cycle tracking is a **sixth top-level route** (`screen === "cycletrack"`), not inside any tab | 57675 |
| 7 | "Shopping and Budget live under Fuel" | Correct | 45968, 37460 |
| 8 | "Cloud sync through Supabase and Cloudflare Workers" | Supabase is **auth only**. Its one data call is dead code. All sync is Worker-only. | 57229, 153 |
| 9 | (not mentioned) | **Menstrual cycle tracking** — 57 features, ~3,700 lines | 22417-26140 |
| 10 | (not mentioned) | **Performance-compound "Stack" tracking** — AAS/PED cycles with dose and route, behind `lk_perfTracking` | 47432, 37329 |
| 11 | (not mentioned) | **Cardio** — 26 features, 41 activities, 5-tier calorie engine | 55510-57185, 5452-7046 |
| 12 | (not mentioned) | **A paywall with no purchase flow.** Six gated cards, $6.99/mo or $60/yr, CTA reads "Available on the App Store Soon" | 655-840 |
| 13 | "v6.0, single-file HTML" | Correct | line 1 |
| 14 | 4 themes implied | **5 themes**: dark, slate, navy, midnight, light | 2469-2500 |
| 15 | (not mentioned) | `demo/index.html` is a **separate 21,035-line Apple-redesign app** on its own Vercel deploy, duplicated verbatim at `redesign/10-final/locked-demo.html` | md5 `48524f5f…` |

Wave 0 count corrections: `Onboarding` ends at **34767**, not 35762 (34768-35656
is a `FOODS` database). Event listeners **54**, not 106. Timers **65**, not 81.

---

## 7. Findings, ranked

### CRITICAL

**C1. Cloud sync never runs after finishing a workout — `ReferenceError` on every save.**
Line 57460 calls bare `syncBidirectional()`. That function is declared at 465
**inside the auth module's strict-mode IIFE** (`(function(){` at 129, `})();` at
1217) and is exposed only as `window.LOCKED.syncToCloud` (1159). There is no
global binding. The trailing `.catch(function(){})` cannot catch it, because a
`ReferenceError` on the callee throws synchronously before any promise exists.
Fires at the end of every single workout finish.
*Correct call:* `window.LOCKED.syncToCloud()`.

**C2. `/beta-sync` uploads health data with no authentication.**
2800-2832 POSTs workouts, weight, body fat, cycle data, PED compounds and doses,
coach instructions and full free-text check-in notes with **no `Authorization`
header**, identified only by a `betaId` derived from beta codes **hardcoded in
the client bundle** (2698: `["JOSHBETA","SUMMERBETA","ROMANBETA","CESCOBETA",
"PUBLICBETA","OLIBETA","KENDALLBETA"]`). Anyone reading the bundle can derive
another user's `betaId` namespace.

### HIGH

**H2. AI failures fabricate data and present it as genuine.**
Reported independently by four agents. On parse or network failure the app
invents plausible values and renders them in the identical UI with no badge, no
error and no retry:
- Meal analysis → hardcoded 400/250/700/450 kcal (38595-38638), 250-750 (40416-40434)
- Meal swaps → four invented meals written into the saved plan (37520-37546)
- Grocery prices → invented, cheapest row badged **"BEST"** (44344, 44790)
- Savings → invented "save $X.XX" (44975)
None of these callers checks `d.gated`, so a quota-gated response also becomes a
fabricated number.

**H3. Beta gating fails open.**
`validateBetaCodeRemote`'s `.catch` calls `onResult(true, null)` (2753-2755) —
going offline before tapping Verify grants access. `claimBetaCode` marks a code
used only in local storage (2757-2771), so one code works on unlimited devices.

**H4. Progress photos contradict their own UI.**
`analysePhoto` POSTs the full base64 JPEG plus goal, bodyweight, weekly set
volume and split names to `/analyze-physique` with **no auth header, no consent
step and no opt-out** (30626-30643) — on the screen that reads "stored on
device" (30763).

**H5. Prompt injection via user-typed store descriptions.**
User input is interpolated directly into **system** prompts (44306, 44344, 45266).

**H6. Restore-from-backup validates only a `format` string** (19456-19483), so a
crafted file can set arbitrary `lk_*` keys, including `lk_betaStatus` and
`lk_perfTracking`.

**H7. Cycle data escapes its consent gate.**
`lk_mcProfile`/`lk_mcDays` are correctly gated behind `lk_mcCloudSync` (218-227),
but `lk_mcFuelAdjust` sits in the unconditional `SYNC_KEYS` list (210) and
survives "Delete all cycle data" (26009-26010).

**H8. Guest mode grants Pro.** `lk_guestMode="1"` yields `isPro:true`
(161-163, 331-333). Currently harmless because `can()` is never called (§5.2),
but it becomes a live privilege escalation the moment the redesign uses it.

### MEDIUM

**M1. Every production crash is invisible.** `ErrorBoundary.componentDidCatch`
is an empty function (2554); `ScreenBoundary` has no `componentDidCatch` at all.
The crash screen tells phone users to press F12 (2583). 90 empty catch blocks
app-wide compound this.

**M2. Silent data loss in private browsing.** `sd()` returns `true` when storage
is unavailable (2437).

**M3. Workout data loss paths.** Swapping an exercise rebuilds the row via
`mkRow`, discarding logged sets with no confirmation (11427). The session only
persists when a set has progress (10659-10668), so reorders and added exercises
are lost on reload. Editing a workout destroys `setType`, losing warmup flags
(17155-17194).

**M4. PR detection is unit- and set-type-blind.** Warm-up and drop sets can set
PRs (no `setType` filter, 10763); unilateral sets never can; PRs never roll back
on un-tick.

**M5. Three different 1RM formulas on one screen.** `e1rm()` (4479-4487) returns
`W` for a single, while the strength bars (29597) and the live preview (29377)
use raw Epley, inflating singles by 3.3%. `e1rmSeries` never converts units
despite a comment saying it does (4563-4600).

**M6. Unbounded uploads.** Photo analysis sends a full-resolution data URL
(40375-40384) — 6-11 MB for a 12 MP photo — despite `resizeImage` existing at
2878. `/parse-receipt` sends the image **twice** in one body (44078). No size
cap, no timeout on either.

**M7. `usdaKey` travels in a URL query string** (39442) and is swept into
`exportEverything()`'s unencrypted dump of every `lk_` key alongside weight, age,
sex and cycle data.

**M8. Cycle→Fuel integration is dead while the UI claims it works.**
`McNutritionCard` tells users Fuel "is tracking your iron against the 18 mg
daily target" (24847) and "is adding a small calorie allowance" (24855). Neither
happens — the entire pathway is dead code (§5.1).

**M9. Migration reverses an explicit user choice.** `migrateSuppReminders`
(2393-2406) force-resets every `reminder:false` back to `true`, inside a bare
empty catch. Users who muted a supplement got it back with no notice.

**M10. Unit corruption in My Store.** Foods are saved scaled by current grams
(39549-39555) but re-hydrated as `energy-kcal_100g` (39674-39681) — a food saved
at 200 g double-counts when logged again.

**M11. `ZXing` loads from unpkg with no SRI** (19082), unlike React and Supabase.

### LOW

**L1. Design system defined but unused.** Four of six `Ds*` primitives have zero
call sites. The app is built from inline `style` objects, which is why the
stylesheet needs brittle substring hacks like `[style*='padding: 52px ']` and
`button[style*='width: 32px']`.

**L2. Tokens triplicated.** Three parallel scales say the same thing
(`SP`/`RAD`/`TYPE` px, `S*`/`R_*`/`T_*` rem, `--ds-*` CSS); the colour set is
defined twice (static `<style>` 1218 and JS `CSS` 2268) kept in sync only by a
comment; the five-theme shell map exists in three places.

**L3. Duplicated frequency logic, already diverging.** Supplement due-logic
exists four times (46161, 47320, 47890, 1482/1519); a custom `timeOf` is "due all
day" in-app (46180) but clamped 08-22 for push (1497).

**L4. Name-keyed logs with no cleanup and no undo.** `lk_suppLog`/`lk_cycleLog`
key on the name string (46135, 47294), so renaming orphans all history and
re-adding a name resurrects an old streak. `markSuppTaken` has no inverse.

**L5. Split builder loses item order on save** (9188-9219 vs 8786-8803) — a block
placed between two exercises jumps to the end after reload.

**L6. Two parallel cardio taxonomies.** `CARDIO_TYPES` (8 entries) vs
`CARDIO_ACTIVITIES` (41), with a source comment at 5542-5544 admitting the v1
log form was never rebuilt against v2.

**L7. `ExBtn` is redeclared inside `ExLib` on every render** (7798), remounting
every row on each search keystroke.

**L8. Custom goals can never show progress.** `getCurrentValue` reads
`goal.currentManual` (27057) but no form field writes it (27860-28101).

**L9. Custom cardio is unreachable and mis-estimated** — no creation UI consumes
`onCustomCardio`, and a custom id falls back to MET 6.0, discarding its own `met`.

**L10. Asymmetric destructive actions.** "Delete Account" has no typed
confirmation or re-auth and handles only the failure branch (33796-33806), while
"Reset all data" is careful and well-reasoned (33665-33694). Split Delete has no
confirmation (15845) while workout Delete does.

**L11. 7 `console.*` calls and 4 blocking `alert`/`confirm` dialogs** remain in
production.

**L12. No install prompt.** `beforeinstallprompt` has zero matches; iOS users are
told to use Share → Add to Home Screen manually (1581). A service worker
(`/sw.js`, 70-74) and manifest (`/manifest.json`, 13) do exist.

---

## 8. Coverage

| Inventory | Raw count | Mapped | Orphans | Unmapped |
|---|---|---|---|---|
| Components (`function [A-Z]`) | 111 | 111 | 14 dead | **0** |
| Storage keys (`ld`/`sd`) | 82 | 82 | 3 | **0** |
| Worker routes + external APIs | 11 | 11 | 0 | **0** |
| Function index entries | 1,540 | 1,540 | — | **0** |
| Feature entries | 541 | 541 | — | **0** |
| Duplicate feature IDs | — | — | — | **0** |

Every component, storage key and endpoint in the Wave 0 raw inventories appears
in at least one feature entry or in the Orphans list above.

### Wave 3 verification — FAILED the 5% threshold

A fresh agent re-read 40 sampled items (15 features, 25 function rows) cold
across all 18 reports. Full detail in `WAVE3_VERIFICATION.md`.

| Rate | Result |
|---|---|
| Feature entries | 9/15 = **60.0%** (1 major, 8 minor) |
| Function rows | 10/25 = **40.0%** (0 major, 10 minor) |
| **Overall** | **19/40 = 47.5% — FAIL** (threshold 5%) |
| Major-only | 1/40 = **2.5%** |

**What actually failed.** 18 of the 19 errors are *citation* errors — line
numbers drifted 5-64 lines — not *conclusion* errors. The agents read their
ranges in `sed` chunks and accumulated offset drift when reporting absolute
line numbers. Every substantive claim that was stress-tested held:

- **9 of 9 dead-code claims verified independently** under `rg`
  (`LoadingSpinner`, `RecipeBuilder`, `McFuelStrip`, `LOCKED.can`,
  `window.LOCKED._client`, `betaAdmin`, `normalizeAiItems`, `cloneFoodItem`,
  `importCheckedItems`).
- `DEAD` statuses held 9/9. `BROKEN` held only 1/2.

**Remediation applied.**
1. **All 1,540 function-index entries were machine-re-anchored.** Each symbol's
   definition line was recomputed directly from the source rather than trusting
   the agent cite. 939 anchored exactly, **168 of which corrected real drift**;
   601 are inline handlers and closures with no top-level definition, which keep
   their original cite and are explicitly marked `*(unresolved)*`.
2. **The single major error was corrected.** F-FUEL-202 was labelled BROKEN on
   evidence pointing at CSS properties (37270/37287 rather than 37275/37281),
   describing a NaN that `fmtQ` (4349-4354) cannot produce — it returns
   `String(r)` or `""`, never `"NaN"`. Reclassified **WORKING**.

**Standing caveat for the redesign.** Feature-entry line cites in
`audit/agents/*.md` were *not* re-anchored and should be treated as approximate
to within ~60 lines. Re-anchor by symbol name, not by line number. The audit is
reliable as a map of what exists, what is dead and how it behaves; it is not a
reliable coordinate system. Re-verify any remaining `BROKEN` or `PARTIAL` status
before acting on it.

### Playwright

Ran. Playwright v1.56.1 with preinstalled Chromium; nothing was installed. The
production file cannot boot from a local server here because it loads React and
Supabase from unpkg/jsDelivr and the environment proxy blocks browser CDN
fetches. The verifier served a scratchpad copy repointed at the repo's own
`redesign/input/vendor/` files — `redesign/input/` itself was not modified.
Guest → skip tutorial → all five tabs clicked, **zero page errors**.
Screenshots in `audit/screens/`.

---

## 9. What this means for the redesign

1. **Fix C1 first.** It is one line, and cloud sync is currently broken for
   every user on the app's most important action.
2. **Decide the AI-failure policy before rebuilding any AI surface.** Fabricated
   macros and invented grocery prices shown as real data is the most damaging
   pattern in the app, and it appears in at least four places.
3. **Adopt the `Ds*` primitives rather than inventing new ones.** They already
   exist, are coherent, and are 4/6 unused. Doing so lets you delete the
   substring-matching CSS hacks.
4. **~3,000 lines are safely deletable** — 14 dead components, the dead
   `MealPlannerTab` twin, the unreachable PRHub Overview tab, and `Placeholder`.
5. **Two features are entirely undocumented** and need product decisions:
   menstrual cycle tracking (57 features) and PED "Stack" tracking (AAS dosing).
6. **Reconcile the storage layer to one abstraction.** Three coexist today.
7. **The paywall has no purchase flow.** Six features are gated behind a CTA
   that says "Available on the App Store Soon".

---

*Evidence: `audit/agents/` (18 reports), `audit/raw/` (Wave 0 inventories),
`audit/FUNCTION_INDEX.md` (1,540 entries), `audit/features.json` (541 features),
`audit/MANIFEST.md` (line-range assignments), `audit/WAVE3_VERIFICATION.md`.*
