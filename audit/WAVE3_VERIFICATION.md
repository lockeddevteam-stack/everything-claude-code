# Wave 3 — Independent Verification of the LOCKED Audit

Fresh agent. I wrote none of the 18 reports. Every line cite below was re-read cold from
`redesign/input/locked-current-v6.html` with `sed -n 'A,Bp'` or located with `rg -n`.

**Scoring rule used** (stated up front so the numbers are reproducible):
- **CORRECT** — substance right and the cited range lands on the claimed code (drift of ≤3 lines
  treated as normal range rounding, not an error).
- **MINOR ERROR** — substance right, detail wrong: cited range misses the code by >3 lines, a
  supporting grep result is misstated, or a secondary name/line is wrong.
- **MAJOR ERROR** — the claim itself, or the status, is not supported by the code.

---

## Sample

**15 feature entries**, one per agent file for 15 of the 18 files, deliberately weighted toward
strong claims (6 DEAD / BROKEN / dead-code-security claims):

| # | Feature | Agent file | Why picked |
|---|---|---|---|
| 1 | F-GOAL-004 | 01-home | random |
| 2 | F-TRAIN-014 | 02a-train-exercises | **DEAD** claim |
| 3 | F-TRAIN-134 | 02b-train-logging | random |
| 4 | F-TRAIN-310 | 02c-train-hub | **BROKEN** claim |
| 5 | F-TRAIN-510 | 02d-progress-prs | "likely BROKEN for lb users" |
| 6 | F-CARDIO-023 | 02e-cardio | random |
| 7 | F-FUEL-017 | 03a-fuel-panels | **DEAD** (3 fns, "one occurrence each") |
| 8 | F-FUEL-202 | 03b-fuel-main | **BROKEN (partial)** claim |
| 9 | F-FUEL-411 | 03c-fuel-entry | random (API-key handling) |
| 10 | F-BUDG-007 | 04-shopping-budget | **DEAD**, "no call site anywhere" |
| 11 | F-CYCLE-207 | 04b-supplements-cycletab | random |
| 12 | F-COACH-037 | 05-coach | **DEAD (unreachable)** admin screen |
| 13 | F-PROF-022 | 06-profile | random |
| 14 | F-CYCLE-021 | 06b-cycle | **DEAD CODE** |
| 15 | F-AUTH-010 | 08-auth-sync-root | **DEAD CODE** + security-adjacent |

**25 function-index rows**, covering **all 18 agent files** (07, 09, 10 are covered here since
they were not in the feature sample):

01-home: `getBfLog`, `GOAL_TYPES` · 02a: `cardioMaxHr` · 02b: `PRESS_EASE`, `releaseHold` ·
02c: `handlePhoto`, `tryParse` · 02d: `onDismiss — throwback`, `onClick — vault back` ·
02e: `ceRowIcon` · 03a: `RecipeBuilder` · 03b: `WaterCard.add` · 03c: pantry-stock IIFE,
`searchFatSecret` · 04: `addToShopping` · 04b: `CYCLE_ROUTE_OPTS`, `coachVisibleData` ·
05: `exportAll`, `authHeaders` · 06: `ProfileScreen` · 06b: `McCalendar` · 07: `PlateCalc` ·
08: `updateProfile` · 09: `enable` · 10: `isEnabled`.

---

## Feature verification

| Feature ID | Claim checked | Cited lines | Verdict | What the code actually says |
|---|---|---|---|---|
| F-GOAL-004 | Goal detail view; PARTIAL because `pct >= 100` compares a possibly-`null` `pct`, so Mark Complete never appears | `:27428` guard, `:27759-27775` Mark Complete, `:27145` `completeGoal` | **MINOR** | Substance correct. `completeGoal` **is** at `:27145` and sets `status:"completed"`/`completedDate: todayISO` exactly as described; `deleteGoal` at `:27155`; `lkConfirm("delGoal"+selIdx, …)` at `:27794`. But the detail guard is at **`:27441`**, not 27428, and `isActive && pct >= 100` is at **`:27777`**, not 27759-27775. Notes block starts **`:27755`**, not 27738. |
| F-TRAIN-014 | `LoadingSpinner`/`LoadingMemo` are DEAD — only the definition lines exist | `5256-5279`, `5280` | **CORRECT** | `rg -c` confirms exactly two hits file-wide: `5256:function LoadingSpinner()` and `5280:var LoadingMemo = React.memo(LoadingSpinner);`. Never rendered. DEAD is correct. |
| F-TRAIN-134 | Info & notes merges catalogue entry with live row; explicit "unknown bodyweight" comment | `v6.html:10288-10292`, modal render `11603-11610`, component `7202` | **MINOR** | Substance exactly right — the comment at `:10348` literally says "or it reports every lift as unknown bodyweight" and the merge is at `:10350`. But the cited 10288-10292 is `releaseHold`'s listener teardown, ~60 lines off; the modal render is at **`:11644`**, not 11603-11610. `ExerciseDetailModal` at `7202` ✅. |
| F-TRAIN-310 | **BROKEN** — `analyzePhoto` never sends `imgData`; a photo is displayed then discarded | `14141-14152` (`handlePhoto`), `14153-14166` (`analyzePhoto`), evidence `14153-14163` | **MINOR** | The BROKEN verdict is **correct**: `analyzePhoto` (`:14157`) builds `desc = photoNote.trim() \|\| "a training split"` and posts `[{role:"user",content:"Convert it now."}]` — `imgData` appears nowhere in the request. But both cites are ~6 lines early (`handlePhoto` is `14147-14156`, `analyzePhoto` `14157-14172`), and the entry's own prose is visibly garbled ("`analyzePhoto` 14153 is wrong … declared at 14153"), i.e. shipped mid-correction. |
| F-TRAIN-510 | `e1rmSeries` does no unit conversion despite its doc comment saying it must | `4563-4568` comment, `4569-4600` impl | **CORRECT** | Verified. Comment at `4565-4567`: "History set weights are stored in the session's display unit … so normalise to kg here." Body `4569-4595` feeds raw `parseFloat(s.w)` into `e1rm()` with no conversion, then the caller applies `kgToDisp`. "PARTIAL — likely BROKEN for lb users" is justified. |
| F-CARDIO-023 | `toggleCardioFav` creates favourite with `useCount:0`/`lastUsedAt:null` that are never updated | `5846-5874`, key `5830-5834`, `CardioStar 55510-55544` | **CORRECT** | `toggleCardioFav` at `5846-5874` ✅, `cardioFavKey` `5830` ✅, `CardioStar` `55510` ✅. `rg 'useCount\|lastUsedAt'` → only `5864`, `5865`. Never written elsewhere. PARTIAL justified. |
| F-FUEL-017 | `normalizeAiItems`, `cloneFoodItem`, `nameSimilarity` all DEAD — one occurrence each | `L19306`, `L19301`, `L19326` | **CORRECT** | `rg` returns exactly one hit each, at exactly those three lines. All definitions, no call sites. DEAD confirmed. |
| F-FUEL-202 | **BROKEN (partial)** — `m.val` is a `fmtQ` string, so the comparison and bar width rely on coercion and "would yield NaN" | evidence `37270`, `37287`, values at `37223/37228/37233` | **MAJOR** | See "Errors found" §1. Both evidence lines point at the wrong code, and the NaN scenario is impossible given `fmtQ`'s implementation. |
| F-FUEL-411 | USDA key screen; `saveUsdaKey` trims → `DEMO_KEY` fallback → `sd("usdaKey")`; PARTIAL, no verification call | `39379-39384`, key in URL `39442`, swap `40286-40295`/`39702` | **MINOR** | Substance right: `saveUsdaKey` is at **`39377-39382`**, does trim/`DEMO_KEY`/`sd("usdaKey", k)`/`setShowKeySetup(false)`; `lk_usdaKey` is a real key (`:198`). But the key is appended to the URL at **`:39385`**, not 39442 (57 off), and `showKeySetup` renders at **`:39716`**, not 40286-40295. |
| F-BUDG-007 | `importCheckedItems` DEAD, "no call site anywhere in the 58k-line file"; `pendingItems` only initialised and appended | `v6:44264-44289`, `43968`, `44286` | **CORRECT** | `rg 'importCheckedItems'` → single hit `44264`. `rg 'pendingItems'` → exactly `43968` and `44286`. Both claims verified precisely as written. |
| F-CYCLE-207 | Cycle detail renders COMPOUNDS/AI OVERVIEW/NOTES conditionally | `47962-48088`, `48090-48116`, `48117-48134`, `readableAccent 4318` | **CORRECT** | `"COMPOUNDS ("` at `48026`, `"AI OVERVIEW"` at `48086`, `"Coach Analysis"` at `48110`, `"NOTES"` at `48127`, `readableAccent` at `4318` exactly. All within/adjacent to the cited ranges. |
| F-COACH-037 | Beta admin code management is **DEAD (unreachable)** — `betaAdmin` only at 57710 and 57958 | `52823` `addCode`, `52834` `toggleCode`, `52815` `setCodes`, `2694` `DEFAULT_BETA_CODES` | **MINOR** | The DEAD verdict is **correct**: `rg 'betaAdmin'` returns exactly `57710` (the mount) and `57958` (a nav-highlight ternary) — nothing ever navigates there. Storage key `lk_betaCodes` ✅. But every function cite is ~5 lines early (`setCodes` `52821`, `addCode` `52828`, `toggleCode` `52839`) and `DEFAULT_BETA_CODES` is at **`2698`**, not 2694 (2694 is an unrelated fetch error handler). The seven code strings match exactly. |
| F-PROF-022 | Photos empty state: camera icon + "Start Your Transformation", shown when `photos.length === 0` | `30861-30906` | **MINOR** | Substance right — `photos.length === 0 &&` is at **`:30891`** and "Start Your Transformation" at **`:30930`**, i.e. the cited range starts 30 lines early and *ends before the headline it quotes*. |
| F-CYCLE-021 | `McFuelStrip` DEAD; `rg "McFuelStrip\|mcFuelContext"` returns only F:24876, F:24915, F:24923 | `24876-24911`, `24912-24914`, `24873-24875`, key `lk_mcFuelAdjust` at `:210` | **MINOR** | The DEAD verdict is **correct** — `McFuelStrip` occurs once (`24915`, its definition); no `createElement(McFuelStrip, …)` exists. `mcFuelAdjustOn` `24873-24875` ✅, `mcLutealCalBump` `24912-24914` ✅, `lk_mcFuelAdjust` in the SYNC list at `:210` ✅. But the quoted grep result is wrong: `mcFuelContext` occurs **only at 24876**, and there is **no hit at 24923**. |
| F-AUTH-010 | Supabase `profiles` read is **DEAD CODE** because `window.LOCKED` never exports `_client`; "`rg '_client'` returns only 153, 1003, 1102, 57225, 57229" | `57222-57251` | **MINOR** | The conclusion is **correct and independently verified**: the export literal at `1143-1201` contains `session, subscription, isLoggedIn, isGuest, isPro, enterGuest, … can, paywall, syncToCloud, restoreCloud …` and **no `_client`**, so `window.LOCKED._client.auth` throws, swallowed by the bare `catch (e) {}` at `:57252`. Every behavioural detail (merge-not-replace, the `typeof use_kg === "boolean"` guard and its comment, the `"Athlete"`/`"user"` fallbacks) matches `57222-57253` exactly. But the supporting grep statement is **false**: `_client` has ~14 hits (153, 273, 282, 299, 380, 386, 413, 420, 434, 441, 1003, 1102, 57225, 57229). |

---

## Function verification

| Name | Cited lines | Verdict | Notes |
|---|---|---|---|
| `getBfLog` (01) | 26976-26978 | **CORRECT** | Exact. `return ld("bfLog", [])`. |
| `GOAL_TYPES` (01) | 26957-26975 | **MINOR** | Array starts at **`26951`**; 26957 is mid-array (`id:"weight"`). Four goal kinds ✅. |
| `cardioMaxHr` (02a) | 5664-5675 | **CORRECT** | `5664-5673`. Tanaka `208-0.7·age`, Gulati `206-0.88·age`, `maxHrOverride` short-circuit — all as described. |
| `PRESS_EASE` (02b) | 10269-10276 | **MINOR** | Substance right (IIFE, `CSS.supports("transition-timing-function", spring)` → `linear(…)` else `cubic-bezier(0.32,0.72,0,1)`), but it lives at **`10258-10264`**. 10269-10276 is `setPress` applying the easing. |
| `releaseHold` (02b) | "10295-10299 area" | **MINOR** | Actually **`10285-10294`**. `10295` is `function holdStart`. The row's own hedging ("area", "295-…") shows the author knew the cite was unverified. |
| `handlePhoto` (02c) | 14141-14152 | **MINOR** | Actually **`14147-14156`**. Behaviour (FileReader → `setImgData`, `setPhotoResult(null)`) ✅. |
| `tryParse` (02c) | 14007-14016 | **MINOR** | Actually **`14013-…`**; 14007 is inside `callWorker`. Parses the `###PROGRAM_START/END###` block ✅. |
| `onDismiss — throwback` (02d) | 28648 | **CORRECT** | Exact: `onDismiss: function () { dismissThrowback(); setTbData(null); }` at 28648. |
| `onClick — vault back` (02d) | 29424-29426 | **CORRECT** | Button at 29424, `setSel(null)` at 29427. Within rounding. |
| `ceRowIcon` (02e) | 56983-57006 | **MINOR** | Definition at **`56999`**; cited range starts 16 lines early. 28px icon tile ✅. |
| `RecipeBuilder` (03a) | 20275-20799, "*(none — dead)*" | **CORRECT** | `rg 'RecipeBuilder'` → single hit at `20275`. The dead-caller claim is verified. |
| `WaterCard.add` (03b) | 36546-36549 | **CORRECT** | Exact. `var ml = useOz ? Math.round(amt * 29.574) : amt; p.addWater(ml);` |
| pantry-stock IIFE (03c) | 41242-41300 | **MINOR** | The `"IN YOUR PANTRY"` label it claims to render is at **`41236`** — outside the cited range. |
| `searchFatSecret` (03c) | 39480-39493 | **MINOR** | Actually **`39416-…`** (64 off). Behaviour ✅: `fetch(WORKER_API + "/food-search?src=fatsecret&q=" + …)`. |
| `addToShopping` (04) | v6:45347-45379 | **CORRECT** | Exact at 45347. (Note there is a second same-named inner fn at 37716; the 04 report cites the right one.) |
| `CYCLE_ROUTE_OPTS` (04b) | 47283 | **MINOR** | Actually **`47264`**. Content is exactly the 6 routes claimed. |
| `coachVisibleData` (04b) | 49386-49399+ | **CORRECT** | Exact at 49386. |
| `exportAll` (05) | 52843-52859 | **MINOR** | Actually **`52848`**. Blob + `URL.createObjectURL` + codes/activity/aiInteractions/feedback ✅. |
| `authHeaders` (05) | 2653-2662 | **CORRECT** | `2652-2662`. `Content-Type` + `Authorization: Bearer <window.LOCKED.session.access_token>` inside try/catch — exactly as described. |
| `ProfileScreen` (06) | 30153-30584 | **CORRECT** | Exact at 30153. |
| `McCalendar` (06b) | F:23754-24065 | **CORRECT** | Exact at 23754. |
| `PlateCalc` (07) | 54925-55508 | **CORRECT** | Exact at 54925. |
| `updateProfile` (08) | 57338-57346 | **CORRECT** | Exact at 57338. |
| `enable` (09) | :1578-1646 | **CORRECT** | `async function enable()` at `1577`; within rounding. Permission → subscribe → register ✅. |
| `isEnabled` (10) | :1659-1665 | **CORRECT** | `1659-1662`. `readRaw(ENABLED_KEY, false) === true && "Notification" in window && Notification.permission === "granted"` — the "Reads `lk_pushEnabled`" summary is right. |

---

## Error rate

| Metric | Major | Minor | Total | Rate |
|---|---|---|---|---|
| Features (n=15) | 1 | 8 | 9 | **60.0%** |
| Functions (n=25) | 0 | 10 | 10 | **40.0%** |
| **Overall (n=40)** | **1** | **18** | **19** | **47.5%** |
| **MAJOR-only (n=40)** | 1 | — | 1 | **2.5%** |

**Verdict against the 5% threshold: FAIL.** The overall error rate of **47.5%** is roughly ten
times the threshold. Zero items were UNCONFIRMABLE — every claim was resolvable from source.

**Where the errors concentrate.** Errors are *not* clustered in a few bad files; line-cite drift is
spread across almost every agent file. Clean files in this sample (all sampled items CORRECT):
`02d-progress-prs`, `06-profile` (function row; the feature row still erred), `06b-cycle`
(function row), `07-misc-gamification`, `08-auth-sync-root` (function row), `09-onboarding-system`,
`10-shared`, `04-shopping-budget`.

Files with the largest drift:
- **02b-train-logging** — 2/2 function rows wrong, plus the F-TRAIN-134 feature cite off by ~60 lines. Worst file sampled.
- **03c-fuel-entry** — 2/2 function rows wrong (one by 64 lines), plus F-FUEL-411 off by 57.
- **02c-train-hub** — 2/2 function rows wrong (~6 lines), and the F-TRAIN-310 entry is visibly unfinished prose.
- **03b-fuel-main** — the only MAJOR: a BROKEN status that the code does not support.
- **01-home**, **02e-cardio**, **04b-supplements-cycletab**, **05-coach** — consistent 5-19 line offsets.

**The important qualification:** 18 of the 19 errors are *citation* errors, not *conclusion*
errors. Every strong claim I stress-tested — six DEAD/BROKEN/dead-code verdicts across
`LoadingSpinner`, `normalizeAiItems`/`cloneFoodItem`/`nameSimilarity`, `importCheckedItems`,
`betaAdmin`, `McFuelStrip`, `RecipeBuilder`, `window.LOCKED._client`, `LOCKED.can` — held up under
independent `rg` verification, and so did the `e1rmSeries` unit bug and the `analyzePhoto` photo
bug. Two of those verdicts, however, were propped up by grep transcripts that are demonstrably
fabricated or misremembered (F-CYCLE-021, F-AUTH-010) — the conclusions happened to be right, but
the stated evidence was not real.

---

## Errors found

### 1. MAJOR — F-FUEL-202 (`03b-fuel-main`): the BROKEN status is not supported by the code

The report says:

> `37270` compares `m.val > m.target` where `m.val` is `fmtQ(totalPro)` — a formatted **string**
> (37223, 37228, 37233) … and the `Math.min(m.val / m.target, 1)` bar width (`37287`) both rely on
> string→number coercion; `fmtQ` output containing a non-numeric suffix would yield NaN.

Three problems:

**(a) Both evidence lines point at the wrong code.** Line 37270 is inside a style object
(`borderRadius: 3, overflow: "hidden"`), not a comparison. The actual code:

```js
// :37275
width: Math.min(m.val / m.target, 1) * 100 + "%",
// :37281
}, !hideNums && (eatenFraming || m.val < m.target) && React.createElement("p", {
```

So the bar width is at **37275** (cited 37287) and the only `m.val` vs `m.target` comparison is
`m.val < m.target` at **37281** (cited 37270). The values are at 37226/37231/37236, not
37223/37228/37233.

**(b) The comparison described does not exist.** The report calls 37270 "the hide-numbers
'Over'/'On track' comparison". Line 37281 is the opposite — it is gated on `!hideNums` and chooses
between "Ng eaten" and "Ng left". The Over/On-track logic belongs to the ring centre label
(37185-37197 region), which uses `totalCal`, a genuine number, not `m.val`.

**(c) The NaN failure mode is impossible.** `fmtQ` (verified at `4349-4354`):

```js
function fmtQ(v) {
  var n = parseFloat(v);
  if (isNaN(n)) return "";
  var r = Math.round(n * 4) / 4;
  return String(r);
}
```

`fmtQ` returns `String(number)` or `""`. It **never** emits a non-numeric suffix, so the
hypothesised NaN cannot occur. `Number("")` is `0`, not NaN, so even the empty-string path yields a
0-width bar and a correct `<` comparison. String→number coercion here is ugly but functionally
harmless. **The correct status is WORKING with a code-smell note, not BROKEN (partial).**

### 2. MINOR — F-CYCLE-021 (`06b-cycle`): fabricated grep output

Claimed: `rg -n "McFuelStrip|mcFuelContext"` returns `F:24876, F:24915, F:24923`. Actual: two hits
only — `24876` (`function mcFuelContext`) and `24915` (`function McFuelStrip`). Line 24923 contains
`var bump = ctx.phase === "luteal" && …` and matches neither pattern. The DEAD conclusion is
nonetheless correct.

### 3. MINOR — F-AUTH-010 (`08-auth-sync-root`): fabricated grep output

Claimed: `rg '_client'` returns only `153, 1003, 1102, 57225, 57229`. Actual: 14 hits, including
`273` (`_client = window.supabase.createClient(…)`), `282`, `299`, `380`, `386`, `413`, `420`,
`434`, `441`. The DEAD CODE conclusion is still correct — `_client` is a module-private var and is
genuinely absent from the `window.LOCKED` export literal at `1143-1201` — but the stated evidence
is not what the tool returns, which is exactly the kind of citation a reader would trust without
re-running.

### 4. MINOR — F-COACH-037 (`05-coach`): `DEFAULT_BETA_CODES` cited at 2694, actually 2698

Line 2694 is `if (window.LOCKED && window.LOCKED.toast) window.LOCKED.toast("Connection error…")`.
The array is at 2698 and its seven strings match the report exactly.

### 5. MINOR — F-PROF-022 (`06-profile`): cited range excludes the quoted string

Cited `30861-30906`. The guard `photos.length === 0 &&` is at 30891; `"Start Your Transformation"`
is at 30930 — 24 lines past the end of the cited range.

### 6-19. MINOR — systematic line-cite drift

The remaining errors are the same failure repeated: a cited range that misses its target by more
than a rounding margin. Largest offenders, with corrections:

| Item | Cited | Actual | Drift |
|---|---|---|---|
| F-TRAIN-134 merge | 10288-10292 | **10350** (comment 10345-10348) | ~60 |
| F-TRAIN-134 modal render | 11603-11610 | **11644** | ~40 |
| `searchFatSecret` | 39480-39493 | **39416** | 64 |
| F-FUEL-411 URL key | 39442 | **39385** | 57 |
| F-FUEL-411 key screen | 40286-40295 | **39716** | ~570 |
| F-GOAL-004 Mark Complete | 27759-27775 | **27777** | 18 |
| `CYCLE_ROUTE_OPTS` | 47283 | **47264** | 19 |
| `ceRowIcon` | 56983-57006 | **56999** | 16 |
| F-GOAL-004 detail guard | 27428 | **27441** | 13 |
| `releaseHold` | 10295-10299 | **10285-10294** | 10 |
| `PRESS_EASE` | 10269-10276 | **10258-10264** | 11 |
| `handlePhoto` / `analyzePhoto` | 14141-14152 / 14153-14166 | **14147-14156 / 14157-14172** | 6 |
| `tryParse` | 14007-14016 | **14013** | 6 |
| pantry IIFE label | 41242-41300 | label at **41236** | 6 |
| `GOAL_TYPES` | 26957-26975 | **26951** | 6 |
| `exportAll`, `setCodes`, `addCode`, `toggleCode` | 52843 / 52815 / 52823 / 52834 | **52848 / 52821 / 52828 / 52839** | 5 |

The pattern is file-local and roughly constant within a file (02c is uniformly −6, 05 uniformly −5),
which is the signature of a report written against a slightly different revision of the file, or of
an offset introduced when ranges were transcribed — not of random carelessness.

---

## Playwright step

**DONE.** Playwright 1.56.1 is installed globally at `/opt/node22/lib/node_modules/playwright`
(not in the repo's `node_modules`), with Chromium preinstalled at `/opt/pw-browsers`. Nothing was
installed.

One obstacle had to be worked around honestly and is worth recording as an audit finding in its own
right: **the production file cannot boot from a plain local server in this environment.** Lines
122-125 load React 18.3.1 and React-DOM from `unpkg.com` and Supabase from `cdn.jsdelivr.net`. The
agent proxy returns `ERR_TUNNEL_CONNECTION_FAILED` (and `405` when the proxy is configured
explicitly) for browser-originated CDN requests, so the page rendered a blank body with
`PAGEERROR: React is not defined`.

The repo already ships local copies at `redesign/input/vendor/` (`react.js`, `react-dom.js`,
`supabase.js`). I copied the HTML to the scratchpad, rewrote only those three `src` attributes to
point at `vendor/`, and stripped the now-invalid SRI `integrity` hashes. **No file under
`redesign/input/` was modified** — the source of truth is untouched; the rewrite lives in the
session scratchpad.

With that, the app boots cleanly. Flow exercised: `Continue without account` → `CONTINUE AS GUEST`
→ `Skip tutorial` → all five tab buttons (they are `<button aria-label="…">` in a bottom nav, not
text links, which is why a naive text locator fails).

**Result: all 5 tabs clicked successfully. Zero uncaught page errors** (`pageerror` listener
captured nothing across the whole session).

Screenshots in `audit/screens/` (430×932, mobile viewport):

- `00-boot.png` — sign-in screen at first load
- `00-home.png` — Home after guest entry and tutorial skip
- `home.png`, `train.png`, `fuel.png`, `coach.png`, `profile.png` — the five tabs

Spot-check of `train.png`: renders "TRAIN", the My Splits / History / Library tab row, the
"No splits yet" empty state with "Build Manually" and "AI Split Builder", the voice-command FAB,
and the 5-item bottom nav with Train active — consistent with what `02c-train-hub.md` describes.

---

## Overall assessment

**Trustworthy in its conclusions; not trustworthy as a coordinate system.**

The audit's *judgment* is good. I attacked its riskiest claims deliberately — nine separate
dead-code and broken-feature verdicts — and every single one survived independent verification.
`LoadingSpinner`, `normalizeAiItems`/`cloneFoodItem`/`nameSimilarity`, `importCheckedItems`,
`RecipeBuilder`, `McFuelStrip`, and the `betaAdmin` screen really are unreachable;
`window.LOCKED._client` really is undefined so the Supabase `profiles` read really does throw into
a silent catch; `LOCKED.can` really has zero call sites; `analyzePhoto` really does throw the
uploaded photo away; `e1rmSeries` really does contradict its own doc comment. The behavioural prose
— merge semantics, fallback chains, storage keys, worker endpoints, default arrays — was accurate
everywhere I checked it, sometimes down to quoting in-code comments verbatim. Storage keys
(`lk_goals`, `lk_usdaKey`, `lk_betaCodes`, `lk_mcFuelAdjust`, `lk_bfLog`) and network endpoints
(`/user/check`, `/food-search?src=fatsecret`, the USDA URL) were correct in every instance.

But **47.5% of sampled items carry a wrong detail, and the wrong detail is almost always the line
number** — the one field a redesign team will actually use to navigate a 58,015-line file. Drift
ranged from 5 to 570 lines. Two entries additionally quote grep output that the tool does not
produce, and one entry (F-TRAIN-310) shipped with the author's unresolved self-correction still in
the prose. One status (F-FUEL-202) is simply wrong: BROKEN, on evidence that points at style
properties and posits a NaN that `fmtQ` cannot produce.

**Recommendation.** Use this audit as a *map of what exists and what is dead* — on that it is
reliable and it saved real work. Do **not** use its line numbers as anchors without re-resolving
them; instead re-anchor every entry by symbol name with `rg -n 'function <name>'`, which is
mechanical and would take one pass. Before the redesign relies on any status field, re-verify the
`PARTIAL`/`BROKEN` entries specifically: the `DEAD` verdicts held at 9/9, but `BROKEN` held at only
1/2 in this sample, and `BROKEN` is precisely the label that will drive someone to rewrite working
code.
