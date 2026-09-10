# Agent 10 — Shared code, design system, utilities

**File audited:** `redesign/input/locked-current-v6.html` (58,015 lines)
**Ranges owned:** 1–4663 and 18441–18640.
All `file:line` citations below are into that file unless stated. Read-only audit; nothing was modified.

Cross-references (owned by Agent 8, not duplicated here): Supabase config `SUPABASE_URL` / `SUPABASE_ANON` at `redesign/input/locked-current-v6.html:133-135` (anon JWT literal present in source — value [REDACTED] here), auth/paywall shell 126–1217, beta sync worker at `:2790`.

---

## PART A — user-facing shared features

### F-SHARED-001 Style profile (theme) switching
- **Location:** boot script `:15-31`; theme engine `:2469-2540`; CSS theme rules inside the `CSS` array `:2326`; pre-React shell tokens `:1218-1233`.
- **User action:** picks one of five style profiles in Settings (Settings screen is outside my range); `setTheme(id)` is the entry point (`:2534`).
- **Behavior:**
  1. Before first paint, the inline boot script reads `localStorage["lk_theme"]`, and with nothing stored follows `prefers-color-scheme: light` rather than forcing dark (`:20-21`).
  2. It stamps `data-style-profile="<id>"` on `<html>`, adds `light-mode` for light or `theme-<id>` for slate/navy/midnight; plain `dark` gets no class (`:23-25`).
  3. It rewrites `<meta name="theme-color">` from a hardcoded shell map `{light:#F2F2F7, dark:#080809, slate:#0D1117, navy:#070F1E, midnight:#0C0917}` (`:27-31`), so installed-PWA chrome matches.
  4. At React boot `initTheme()` re-reads `lk_theme`, falls back to the same system query, and calls `applyTheme` (`:2500-2510`).
  5. `applyTheme` sets `isDarkMode`, re-stamps the attribute, strips all of `ALL_THEME_CLASSES`, adds the right one, updates `theme-color`, and persists via `sd("theme", …)` (`:2511-2529`).
  6. `toggleTheme` / `setTheme` additionally dispatch a `window` `"theme-changed"` event so components re-render (`:2530-2538`).
- **Components:** none in range (Settings UI is elsewhere); the DOM shell only.
- **Functions:** `initTheme` `:2500`, `applyTheme` `:2511`, `toggleTheme` `:2530`, `setTheme` `:2534`.
- **State:** module-global `isDarkMode` `:1985`, `THEMES` `:2469`, `ALL_THEME_CLASSES` `:2498`.
- **Storage:** `lk_theme` (JSON string).
- **Network / AI:** none.
- **Edge cases:** the `light`→`dark` toggle in `toggleTheme` is binary and will move a slate/navy/midnight user to dark (`:2531-2532`). The pre-React `<style>` block at `:1218` duplicates a subset of tokens by hand and is explicitly documented as needing manual sync with the JS `CSS` array (`:1221-1222`) — a real drift risk.
- **Gating:** none.
- **Status:** Shipped.
- **Evidence for status:** full read/write/apply path present and wired at boot (`initTheme()` invoked at `:2539`).
- **Notes:** slate/navy/midnight override only a subset of tokens; they inherit the dark base `html{}` rule for accent/semantic colours (`:2268` `html{...}` vs `:2326` theme rules).

### F-SHARED-002 Text size (Dynamic Type)
- **Location:** boot script `:36-40`.
- **User action:** a Text Size setting (UI outside range) writes `lk_textScale` as an integer percentage.
- **Behavior:** on boot, `parseInt(localStorage.lk_textScale || "100")`; if non-100 it sets `document.documentElement.style.fontSize = scale + "%"`. Because every type token is `rem` (`:2101-2110`), the whole app scales. Applied pre-paint so nothing renders at the wrong size first.
- **Storage:** `lk_textScale` (raw integer string, **not** JSON — read with `parseInt`, so it bypasses `ld()`).
- **Edge cases:** the file explicitly notes the px type constants were converted to rem because headings previously stayed put while body text grew (`:2097-2100`). Numeric spacing tokens (`S1..S8`, `RAD`) remain px and do **not** scale — layout does not grow with text.
- **Status:** Shipped. **Evidence:** unconditional boot code.

### F-SHARED-003 Storage-full recovery
- **Location:** `:2411-2467`.
- **User action:** implicit — any save that exceeds the localStorage quota.
- **Behavior:**
  1. `storageAvailable` is probed once at boot with a write/remove of key `test` (`:2411-2416`); private-browsing failure makes every later read return the fallback and every write a silent no-op.
  2. `sd()` catches, and if `lkIsQuotaError` matches (`QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, code 22, code 1014) shows a one-shot toast: "Storage is full - changes are not being saved. Free space by deleting progress photos." (`:2443-2448`).
  3. It also dispatches a `lockedStorageFull` CustomEvent carrying the key (`:2450`).
  4. `sd()` returns a boolean so callers can roll back — `saveProgressPhoto` does exactly that (`:2868-2871`).
  5. `lkStorageUsage()` walks every localStorage key, sums `(key.length + value.length) * 2` bytes, isolates `lk_progressPhotos`, and reports against a hardcoded `budgetBytes: 5 * 1024 * 1024` (`:2456-2467`).
- **Storage:** all `lk_`-prefixed keys.
- **Edge cases:** `_lkQuotaWarned` (`:2429`) means the warning fires **once per page load** only. The 5 MB budget is a guess, not measured.
- **Status:** Shipped. **Evidence:** guard + toast + event + boolean return all present and used by a caller at `:2868`.

### F-SHARED-004 Error recovery screens
- **Location:** `ErrorBoundary` `:2540-2600`; `ScreenBoundary` `:2601-2657`.
- **Behavior:** see "Error boundaries" section below.
- **Status:** Shipped. **Evidence:** both are React class components with `getDerivedStateFromError` and a rendered fallback.

### F-SHARED-005 Progress photo capture & compression
- **Location:** `resizeImage` `:2878-2905`, `saveProgressPhoto` `:2856-2877`.
- **Behavior:** file → `FileReader.readAsDataURL` → `<img>` → canvas downscale constrained on **both** axes (`maxH = round(maxW * 1.6)`) → `toDataURL("image/jpeg", 0.6)`. `saveProgressPhoto` appends `{date: ISO, note, thumb: base64}` to `lk_progressPhotos`, checks the `sd()` return, and on failure restores the previous array and returns `null`.
- **Storage:** `lk_progressPhotos`. **Network/AI:** none here.
- **Status:** Shipped. **Evidence:** `:2866-2871` rollback logic.

### F-SHARED-006 Weight log & refeed trigger
- **Location:** `getWeightLog` `:2907`, `addWeightEntry` `:2910-2932`, `checkRefeedTrigger` `:2933-2963`, `calcRefeedCarbs` `:2964-2972`.
- **Behavior:** one entry per local calendar day (`isoDay()`), upserted and re-sorted ascending. Refeed fires only when `fuelProfile.goal === "cut"`, ≥3 entries exist, and each of the last three entries is a new all-time low; suppressed for 5 days after `lk_refeedDismissed` and for the day recorded in `lk_refeedAccepted`. `calcRefeedCarbs` returns 50/75/100 g by TDEE thresholds (2500/3000) plus 15 g if bodyweight > 90 kg.
- **Storage:** `lk_weightLog`, `lk_refeedDismissed`, `lk_refeedAccepted`.
- **Edge case:** weight log entries are documented as **always kilograms**, unlike lifted weights (`:4433-4435`).
- **Status:** Shipped.

### F-SHARED-007 Keyboard-aware chrome & zoom lock
- **Location:** `:41-68` (boot), `:1240` (`html.lk-kb-open nav{display:none}` is in the CSS array at `:2268`).
- **Behavior:** a `visualViewport` resize/scroll listener toggles `html.lk-kb-open` when the visual viewport drops below 80% of `innerHeight`, hiding the nav while the keyboard is up; `focusout` re-syncs after 60 ms to work around an iOS 26 `offsetTop` bug. Separately `gesturestart/change/end` are `preventDefault`ed to block pinch-zoom, with double-tap handled by `touch-action:manipulation` in CSS rather than swallowing `touchend`.
- **Status:** Shipped.

### F-SHARED-008 Deploy-version cache bust
- **Location:** `:76-116`.
- **Behavior:** every load fetches `https://lockedapi.cescocugliari.workers.dev/app-version` with `cache:"no-store"`; if the returned version differs from `lk_deployVersion`, it stores the new version, deletes every Cache Storage entry **except** `locked-v1`, then hard-reloads. Deliberately does not unregister the service worker (that would kill the push subscription). Fails silently on any error.
- **Network:** the Worker. **Storage:** `lk_deployVersion` (raw string).
- **Status:** Shipped.

### F-SHARED-009 Progress throwback
- **Location:** `throwbackForced` `:4594`, `computeThrowback` `:4597-4662`, `dismissThrowback` `:4663`.
- **Behavior:** walks anchors 365/180/90/30 days, oldest-with-data wins; surfaces positive-only progression across bodyweight (direction judged by cut/bulk goal, threshold ±0.5 kg), up to two lifts by est-1RM delta (>0.5), and a photo pair within ±30 d of the anchor that is ≥21 d newer. Dismissal cooldown 3 days via `lk_throwbackDismissed`; `localStorage.lk_throwbackForce === "1"` bypasses the cooldown.
- **Status:** Shipped (dev override present).

---

## PART B — function index

Notation: all lines are in `redesign/input/locked-current-v6.html`.

### Boot script (IIFE scope, lines 15–116)

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature |
|---|---|---|---|---|---|---|
| (theme pre-paint IIFE) | anon block | :19-31 | Applies persisted/system style profile before first paint | boot | localStorage, matchMedia | F-SHARED-001 |
| (text scale block) | anon block | :36-40 | Applies `lk_textScale` to root font-size | boot | localStorage | F-SHARED-002 |
| `keyboardChrome` | named IIFE | :45-56 | Toggles `.lk-kb-open` from visualViewport | boot | `sync` | F-SHARED-007 |
| `sync` | closure fn | :49-51 | Classlist toggle helper | vv listeners | — | F-SHARED-007 |
| `lockZoom` | named IIFE | :63-68 | Blocks pinch-zoom gestures | boot | addEventListener | F-SHARED-007 |
| `checkDeployVersion` | named IIFE | :81-116 | Version check + cache bust + reload | boot | fetch, caches | F-SHARED-008 |
| (SW register block) | anon block | :70-74 | Registers `/sw.js` on load | boot | — | — |

### Push module (IIFE, lines 1240–1950) — in my range, indexed for completeness

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature |
|---|---|---|---|---|---|---|
| `readRaw` | fn | :1325-1333 | Raw JSON localStorage read w/ fallback | push module | — | — |
| `writeRaw` | fn | :1334-1341 | Raw JSON localStorage write | push module | — | — |
| `deviceId` | fn | :1342-1362 | Stable per-device id, crypto random | subscribe/test | crypto | — |
| `getPrefs` | fn | :1363-1367 | Merge stored prefs over `DEFAULT_PREFS` | setPrefs, refresh | readRaw | — |
| `timeZone` | fn | :1368-1375 | IANA tz string | buildContext/post | Intl | — |
| `todayISO` | fn | :1376-1384 | Local YYYY-MM-DD (push-module copy of `isoDay`) | buildContext | — | — |
| `dayOf` | fn | :1385-1400 | **Duplicate** of the global `dayOf` (`:1969`) inside this IIFE | buildContext | — | — |
| `isIOS` | fn | :1401-1406 | UA sniff | supported | — | — |
| `isStandalone` | fn | :1407-1411 | Installed-PWA check | supported | — | — |
| `supported` | fn | :1412-1421 | Whether web push can work here | status | isIOS, isStandalone | — |
| `buildContext` | fn | :1422-1555 | Server-side snapshot: next split day, streak, trained/checked-in today, due supplements/compounds/restock | subscribe, refresh | readRaw, todayISO, dayOf | — |
| `post` | fn | :1556-1563 | POST helper to Worker `/push/*` | all push calls | fetch | — |
| `b64uToUint8` | fn | :1564-1572 | base64url → VAPID key bytes | enable | atob | — |
| `enable` | async fn | :1577-1647 | Permission, SW ready, VAPID fetch, subscribe | UI, boot heal | post, b64uToUint8 | — |
| `disable` | async fn | :1648-1658 | Unsubscribe | UI | post | — |
| `isEnabled` | fn | :1659-1665 | Reads `lk_pushEnabled` | many | readRaw | — |
| `setPrefs` | async fn | :1666-1682 | Merge + push prefs to server | UI | getPrefs, post | — |
| `refresh` | async fn | :1687-1701 | Re-send context snapshot (throttled) | boot, UI | buildContext, post | — |
| `test` | async fn | :1702-1714 | Fire a test notification | UI | post | — |
| `postHealing` | async fn | :1715-1723 | Retry a POST after re-enabling | schedulers | post, enable | — |
| `scheduleRest` | fn | :1724-1732 | Server-scheduled rest-timer alarm | workout | postHealing | — |
| `cancelRest` | fn | :1733-1741 | Cancel that alarm | workout | postHealing | — |
| `scheduleIdleCheck` | fn | :1744-1756 | Idle-workout nudge | workout | postHealing | — |
| `cancelIdleCheck` | fn | :1757-1763 | Cancel idle nudge | workout | postHealing | — |
| `status` | fn | :1764-1777 | `{supported, needsInstall, permission, enabled}` | Settings | supported | — |
| `getSound` / `setSound` | fn | :1809-1818 | Alert sound preference (`bell`/`plate`/`none`) | Settings | readRaw/writeRaw | — |
| `audio` | fn | :1819-1829 | Lazily create/resume AudioContext | playAlert | — | — |
| `playBell` | fn | :1830-1853 | Synthesised bell (additive partials) | playAlert | WebAudio | — |
| `playPlate` | fn | :1854-1897 | Synthesised plate clank (thud + noise + ring) | playAlert | WebAudio | — |
| `playAlert` | fn | :1898-1913 | Dispatch by preference + `navigator.vibrate([180,90,180])` | rest timer | audio, playBell/Plate | — |
| (boot heal IIFE) | anon | :1941-1950 | Re-subscribe if permission still granted but subscription gone | module load | enable, refresh | — |

### Main app preamble (lines 1961–4663)

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature |
|---|---|---|---|---|---|---|
| `isoDay` | fn | :1961-1964 | **Local** calendar day `YYYY-MM-DD` (avoids the UTC off-by-one) | app-wide | — | utils |
| `dayOf` | fn | :1969-1977 | Calendar day of a stored date (bare date or ISO timestamp) | app-wide | isoDay | utils |
| `_extends` | fn | :1979 | Babel `Object.assign` polyfill helper | compiled JSX spread | — | — |
| `useHubState` | hook | :2121-2139 | Persisted hub sub-tab state with an allow-list | hub screens | ld, sd, useState, useRef | hooks |
| `useTabReset` | hook | :2140-2149 | Subscribes to the `lockedTabReset` window event | hub screens | useEffect | hooks |
| `useSheetDrag` | hook | :2150-2267 | Drag-to-dismiss bottom sheets with a spring | sheets | requestAnimationFrame, SPRING | hooks |
| ↳ `setY` | closure | :2161-2164 | Writes `translateY` directly to the node | move/spring | — | hooks |
| ↳ `springTo` | closure | :2165-2188 | Critically-damped spring integrator | end/close | rAF | hooks |
| ↳ `start` | closure | :2189-2207 | Touch start; cancels entry keyframe | zone | — | hooks |
| ↳ `move` | closure | :2208-2222 | Tracks drag, rubber-bands upward, EMA velocity | zone | setY | hooks |
| ↳ `end` | closure | :2223-2237 | Projects momentum; dismiss past 45% height | zone | springTo | hooks |
| ↳ `cancel` | closure | :2238-2243 | Springs back on touchcancel | zone | springTo | hooks |
| ↳ `close` | closure | :2248-2255 | Programmatic dismissal through the same exit | Close btn/backdrop | springTo | hooks |
| `migratePrDates` | fn | :2349-2387 | One-shot: recover real dates for PRs stamped `"Today"` | `setTimeout(…,0)` :2388 | ld, sd, isoDay | migration |
| `migrateSuppReminders` | fn | :2393-2406 | One-shot: force `reminder:true` on supplements | `setTimeout(…,0)` :2407 | ld, sd | migration |
| `lkIsQuotaError` | fn | :2430-2433 | Cross-browser quota-error detection | sd | — | F-SHARED-003 |
| `ld` | fn | :2417-2427 | Namespaced JSON read (`lk_` prefix) with fallback | app-wide | JSON.parse | storage |
| `sd` | fn | :2435-2455 | Namespaced JSON write; returns bool; quota toast + event | app-wide | lkIsQuotaError | F-SHARED-003 |
| `lkStorageUsage` | fn | :2456-2467 | Approximate bytes used, photo bytes, 5 MB budget | Settings | — | F-SHARED-003 |
| `initTheme` | fn | :2500-2510 | Resolve stored/system profile at React boot | :2539 | ld, applyTheme | F-SHARED-001 |
| `applyTheme` | fn | :2511-2529 | Stamp attribute/class, update theme-color, persist | initTheme, set/toggle | sd | F-SHARED-001 |
| `toggleTheme` | fn | :2530-2533 | Binary dark↔light toggle + `theme-changed` event | Settings | ld, applyTheme | F-SHARED-001 |
| `setTheme` | fn | :2534-2537 | Set a named profile + `theme-changed` event | Settings | applyTheme | F-SHARED-001 |
| `ErrorBoundary` | React class | :2540-2600 | App-level crash screen | root render | — | F-SHARED-004 |
| `ScreenBoundary` | React class | :2601-2657 | Per-screen crash screen | screen wrappers | — | F-SHARED-004 |
| `authHeaders` | fn | :2658-2662 | JSON + Bearer header builder from `window.LOCKED.session` | aiCall | — | — |
| `aiCall` | fn | :2663-2696 | Single AI request wrapper (Worker root URL) | every AI feature | authHeaders, fetch, logBetaAI | AI |
| `initBetaCodes` | fn | :2698-2720 | Seed `DEFAULT_BETA_CODES` (Agent 8 owns) | :2721 | ld, sd | beta |
| `validateBetaCode` | fn | :2722-2727 | Local code check | validateBetaCodeRemote | ld | beta |
| `validateBetaCodeRemote` | fn | :2728-2752 | Worker `/beta-validate` | onboarding | fetch | beta |
| `claimBetaCode` | fn | :2753-2767 | Mark claimed, set beta flags | onboarding | ld, sd | beta |
| `logBetaActivity` | fn | :2768-2778 | Append to `lk_betaLog` | many | ld, sd | beta |
| `logBetaAI` | fn | :2779-2789 | Append prompt/response to `lk_betaAILog` | aiCall | ld, sd | beta |
| `isSilentBeta` | fn | :2792-2795 | Suppress beta UI for listed ids | UI | ld | beta |
| `syncBetaData` | fn | :2796-2836 | POST the beta payload to `/beta-sync` | timer, UI | fetch, ld, sd | beta |
| (midnight beta sync IIFE) | anon | :2837-2851 | 60 s interval; syncs once at 00:00 local | module load | syncBetaData, isoDay | beta |
| `saveProgressPhoto` | fn | :2856-2877 | Append photo, roll back if the write fails | camera UI | ld, sd, logBetaActivity | F-SHARED-005 |
| `resizeImage` | fn | :2878-2905 | Two-axis downscale → JPEG q0.6 data URL | camera UI | FileReader, canvas | F-SHARED-005 |
| `getWeightLog` | fn | :2907-2909 | Read `lk_weightLog` | weight UI | ld | F-SHARED-006 |
| `addWeightEntry` | fn | :2910-2932 | Upsert today's kg, sort, persist | weight UI | isoDay, sd, logBetaActivity | F-SHARED-006 |
| `checkRefeedTrigger` | fn | :2933-2963 | Three consecutive all-time-low weigh-ins on a cut | Fuel | ld, isoDay | F-SHARED-006 |
| `calcRefeedCarbs` | fn | :2964-2972 | Refeed carb bump by TDEE/bodyweight | Fuel | — | F-SHARED-006 |
| `GROUPS` | data | :2975-4257 | Muscle-group → sub-group → exercise catalogue | ALL_EX build | — | catalogue |
| `ALL_EX` build | IIFE-ish loop | :4258-4275 | Flatten GROUPS into a searchable list | module load | — | catalogue |
| (custom exercise merge) | anon IIFE | :4276-4290 | Append `lk_customEx` entries not already present | module load | localStorage | catalogue |
| `unitConvOn` | fn | :4291-4297 | Whether unit conversion is enabled (default true) | storedWeightUnit | ld | utils |
| `lkLum` | fn | :4307-4313 | WCAG relative luminance | lkRatio callers | — | a11y |
| `lkRatio` | fn | :4314-4316 | WCAG contrast ratio | readableAccent | — | a11y |
| `readableAccent` | fn | :4318-4344 | Lighten/darken a palette hex until ≥4.5:1 on the card; memoised | 23 call sites | lkLum, lkRatio | a11y |
| `fmtQ` | fn | :4351-4356 | Round to nearest 0.25, no trailing decimals | weights/macros | — | formatting |
| `fmtCal` | fn | :4357-4360 | Whole-number calories | Fuel | — | formatting |
| `storedWeightUnit` | fn | :4380-4411 | Resolve-once-and-record what stored lift weights mean | conversions | ld, sd, unitConvOn | units |
| `storedToUnit` | fn | :4414-4419 | Stored unit → display unit | kgToDisp, liftDisp | storedWeightUnit | units |
| `unitToStored` | fn | :4420-4425 | Display unit → stored unit | dispToKg, convToKg | storedWeightUnit | units |
| `kgToDisp` | fn | :4430-4435 | Display string for a stored weight (quarter-rounded) | UI | storedToUnit, fmtQ | units |
| `liftDisp` | fn | :4439-4443 | Numeric display for a **lift** weight, 1 dp | UI | storedToUnit | units |
| `dispToKg` | fn | :4444-4451 | Typed value → stored value, 4 dp | inputs | unitToStored | units |
| `freezeWeightStorageUnit` | named IIFE | :4455-4463 | Resolve+record the unit at boot; sets the retired migration guard | module load | storedWeightUnit, sd | units |
| `convToKg` | fn | :4465-4470 | Lenient display→stored conversion | Fuel/profile | unitToStored | units |
| `e1rm` | fn | :4479-4486 | Epley estimated 1RM; a single is returned uninflated | PRs, series | — | PRs |
| `prSummary` | fn | :4491-4511 | Heaviest single / best 6–8 working set / best est-1RM | Vault | e1rm | PRs |
| `compoundRank` | fn | :4529-4535 | Rank a lift name against `PR_COMPOUNDS` regexes | Vault sort | — | PRs |
| `prDay` | fn | :4540-4547 | Real day for a PR, or null for legacy `"Today"` | prLabel, series | isoDay | PRs |
| `prLabel` | fn | :4551-4561 | "Today"/"Yesterday"/"N days ago"/locale date | Vault | prDay, isoDay | PRs |
| `e1rmSeries` | fn | :4568-4592 | Est-1RM time series per exercise from history + PRs | charts | e1rm, prDay, getEx, isLiftingSession | PRs |
| `throwbackForced` | fn | :4594-4596 | Dev bypass via `lk_throwbackForce` | computeThrowback | — | F-SHARED-009 |
| `computeThrowback` | fn | :4597-4662 | Build the past-vs-now comparison card | Hub | ld, e1rmSeries | F-SHARED-009 |
| `dismissThrowback` | fn | :4663 | Record dismissal timestamp | Hub | sd | F-SHARED-009 |

### Design-system primitives (18441–18640)

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature |
|---|---|---|---|---|---|---|
| `DsHeader` | component | :18441-18488 | Large-title page header w/ eyebrow, subtitle, actions, tint wash | one call site `:25332` | — | DS |
| `DsSection` | component | :18489-18512 | Titled section wrapper w/ action slot and footnote | **no call sites** | — | DS |
| `DsCard` | component | :18513-18529 | Elevated/soft surface card, optional accent border, keyboard-activatable | **no call sites** | lkKeyActivate | DS |
| `DsRow` | component | :18530-18572 | List row: leading/label/detail/value/trailing, 48 or 38 px | **no call sites** | lkKeyActivate | DS |
| `DsSegmented` | component | :18573-18609 | ARIA tablist segmented control | one call site `:19815` | — | DS |
| `DsStat` | component | :18610-18640 | Uppercase label + tabular-nums value + unit + detail | **no call sites** | — | DS |

**Totals in my ranges:** 6 Ds components, 2 React class components, 3 custom hooks, 2 top-level data structures (`GROUPS`, `ALL_EX`), 27 named functions/IIFEs in the push module, 47 named functions/IIFEs in the main preamble, 7 boot-script blocks — **~94 named units indexed**.

---

## COMPLETE DESIGN TOKEN SET

### A. CSS custom properties — colour

Base (`dark`) is `html{}` at `:2268`. `light` is `html.light-mode,html[data-style-profile='light']` at `:2268`. `slate` / `navy` / `midnight` are the `html.theme-*` rules inside the `CSS` array at `:2326`. **A blank cell means that profile does not redefine the token and inherits the dark base value.**

| Token | dark (base) | light | slate | navy | midnight | Used for |
|---|---|---|---|---|---|---|
| `--color-bg` | `#000000` | `#F2F2F7` | `#0D1117` | `#070F1E` | `#0C0917` | page ground (`BG`) |
| `--color-surface` | `#0D0D0F` | `#F2F2F7` | `#161B22` | `#0C1829` | `#14102A` | secondary surface (`SURF`); reduced-transparency fallback |
| `--color-card` | `#1C1C1E` | `#FFFFFF` | `#21262D` | `#112035` | `#1C183A` | card fill (`CARD`) |
| `--color-border` | `rgba(255,255,255,0.09)` | `rgba(60,60,67,0.12)` | `rgba(48,54,61,0.9)` | `rgba(56,139,253,0.12)` | `rgba(139,92,246,0.14)` | hairlines (`BORD`) |
| `--color-text` | `#F5F5F7` | `#1C1C1E` | `#E6EDF3` | `#E0EFFF` | `#EDE9FE` | primary text (`TX`) |
| `--color-text-muted` | `#A1A1AA` | `#5F5F66` | `#A3ADB8` | `#6B91BE` | `#A79BCC` | secondary text (`MU`) |
| `--color-text-subtle` | `#2C2C2E` | `#E5E5EA` | `#2D333B` | `#142035` | `#201A3D` | track/inactive fills (`SU`) — note: a *surface*, not a text colour |
| `--color-text-tertiary` | `#8E8E93` | `#6C6C70` | | | | tertiary text (`TX3`) |
| `--color-accent` | `#F97316` | | | | | brand orange (`OR`, `VI`) |
| `--color-accent-dark` | `#7C3A0E` | | | | | pressed/deep accent (`ORD`) |
| `--color-accent-deep` | `#C2410C` | | | | | accent that carries white text (`ORD2`) |
| `--color-accent-text` | `#FB923C` | `#9A3412` | | | | accent used *as text* (`ORTX`) |
| `--color-accent-rgb` | `249,115,22` | | | | | for `rgba(var(--color-accent-rgb), α)` |
| `--color-success` | `#22C55E` | `#15803D` | | | | success text (`GR`) |
| `--color-success-deep` | `#178841` | `#15803D` | | | | success fill under white text (`GR_D`) |
| `--color-error` | `#F05151` | `#DC2626` | | | | error (`RE`) |
| `--color-error-deep` | `#B91C1C` (shell `<style>` only, `:1226`) | | | | | pre-React shell only |
| `--color-info` | `#4186F6` | `#2563EB` | | | | info blue (`BLU`) |
| `--color-warning` | `#F59E0B` | `#B45309` | | | | warning (`WA`) |
| `--color-feature` | `#8B5CF6` | `#6D28D9` | | | | feature/violet highlights |
| `--color-macro-protein` | `#3B82F6` | `#2563EB` | | | | macro ring (`PRO`) |
| `--color-macro-carbs` | `#F59E0B` | `#B45309` | | | | macro ring (`CAR`) |
| `--color-macro-fat` | `#EC4899` | `#BE185D` | | | | macro ring (`FAT`) |
| `--color-positive-alt` | `#10B981` | `#047857` | | | | second positive/emerald (`EMD`) |
| `--color-positive-alt-deep` | `#0C875E` | `#046148` | | | | emerald under white text (`EMD_D`) |
| `--color-shadow` | `rgba(0,0,0,0.5)` | `rgba(15,23,42,0.10)` | `rgba(1,4,9,0.4)` | `rgba(0,4,15,0.5)` | `rgba(0,0,0,0.45)` | elevation (`SHADOW`) |
| `--color-shadow-light` | `rgba(0,0,0,0.18)` | `rgba(15,23,42,0.06)` | `rgba(1,4,9,0.15)` | `rgba(0,4,15,0.18)` | `rgba(0,0,0,0.18)` | subtle elevation |
| `--glass-bar` | `rgba(0,0,0,0.78)` | `rgba(242,242,247,0.85)` | `rgba(13,17,23,0.85)` | `rgba(7,15,30,0.88)` | `rgba(12,9,23,0.88)` | translucent nav/bar (`GLASSBAR`) |
| `--color-fill1` | `#111113` | `#E4E6E9` | | | | inset fill level 1 |
| `--color-fill2` | `#18181B` | `#F0F2F5` | | | | inset fill level 2 |
| `--color-fill3` | `#2A2A2F` | `#D4D8DF` | | | | inset fill level 3 |
| `--color-shell-bg` | `#080809` (`:1228`) | `#F2F2F7` (`:1233`) | | | | pre-React auth/paywall shell ground |
| `--color-shell-logo` | `#F97316` | `#C2410C` | | | | shell logo |
| `--color-shell-card` | `#111113` | `#FFFFFF` | | | | shell card |
| `--color-shell-fill` | `#18181B` | `#E9E9EF` | | | | shell input fill |

Note: `--color-shell-*` and `--color-error-deep` exist **only** in the static `<style>` block (`:1218-1233`), not in the JS `CSS` array. Everything else is defined in both places and must be kept in sync by hand (`:1221-1222`).

### B. CSS custom properties — "Design system v3" surface/type/space (`:2326`)

| Token | dark (`:root`) | light | slate | navy | midnight | Used for |
|---|---|---|---|---|---|---|
| `--ds-grouped` | `#000000` | `#F2F2F7` | `#0D1117` | `#070F1E` | `#0C0917` | grouped-inset page ground (`GROUPED`) |
| `--ds-elevated` | `#1C1C1E` | `#FFFFFF` | `#21262D` | `#112035` | `#1C183A` | card / selected segment (`ELEV`) |
| `--ds-elevated-2` | `#2C2C2E` | `#F2F2F7` | `#2D333B` | `#16294280` | `#241E47` | second elevation (`ELEV2`) |
| `--ds-separator` | `rgba(84,84,88,0.34)` | `rgba(60,60,67,0.20)` | `rgba(48,54,61,0.9)` | `rgba(56,139,253,0.14)` | `rgba(139,92,246,0.16)` | 0.5 px list hairline (`SEP`) |
| `--ds-fill` | `rgba(120,120,128,0.20)` | `rgba(120,120,128,0.16)` | `rgba(139,148,158,0.16)` | `rgba(107,145,190,0.16)` | `rgba(167,155,204,0.16)` | control fill (`FILL`) |
| `--ds-fill-soft` | `rgba(120,120,128,0.12)` | `rgba(120,120,128,0.08)` | `rgba(139,148,158,0.09)` | `rgba(107,145,190,0.09)` | `rgba(167,155,204,0.09)` | soft card / segmented track (`FILL_SOFT`) |
| `--ds-material` | `rgba(30,30,32,0.72)` | `rgba(255,255,255,0.78)` | `rgba(13,17,23,0.72)` | `rgba(7,15,30,0.75)` | `rgba(12,9,23,0.75)` | blur material (`MATERIAL`) |

Type scale (identical in every profile): `--ds-t-large 2.125rem`, `--ds-t-title 1.625rem`, `--ds-t-head 1.25rem`, `--ds-t-body 1rem`, `--ds-t-sub 0.9375rem`, `--ds-t-foot 0.8125rem`, `--ds-t-cap 0.75rem`, `--ds-t-cap2 0.6875rem`.

Spacing rhythm: `--ds-s1 4px`, `--ds-s2 8px`, `--ds-s3 12px`, `--ds-s4 16px`, `--ds-s5 20px`, `--ds-s6 24px`, `--ds-s8 32px`.

Radii: `--ds-r-sm 10px`, `--ds-r-md 14px`, `--ds-r-lg 18px`, `--ds-r-xl 22px`.

Layout variables set from JS (consumed in the static `<style>`): `--lk-nav-h` (measured nav height, fallback `80px + env(safe-area-inset-bottom)`) `:1266`, `--lk-top-off` (in-progress workout bar height, default 0) `:1266`.

`.lk-forcedark` (`:2298`) re-points `--color-text`, `--color-text-muted`, `--color-text-tertiary`, `--color-card`, `--color-surface`, `--color-border` to dark values for the tutorial subtree only, because the tutorial paints its own near-black backdrop.

### C. JS token constants (`:1985-2115`)

Colour aliases (all `var(--…)` strings unless marked hex):
`BG`, `SURF`, `CARD` `:1986-1988` · `BORD` `:1989` · `OR`, `ORD`, `TX`, `MU`, `SU` `:1990-1994` · `GR`, `GR_D`, `RE`, `BLU` `:1995-2000` · `SHADOW` `:2013` · `WA`, `VI`(=accent), `PRO`, `CAR`, `FAT`, `EMD`, `EMD_D` `:2014-2022` · `ORD2`, `ORTX`, `TX3`, `GLASSBAR` `:2023-2026` · `GROUPED`, `ELEV`, `ELEV2` `:2084-2086` · `SEP`, `FILL`, `FILL_SOFT`, `MATERIAL` `:2087-2090`.

Hex twins (they exist because a `var()` cannot be concatenated with an alpha suffix — see the comment at `:2001-2003`):
`OR_H #F97316`, `ORD_H #7C3A0E`, `GR_H #22C55E`, `RE_H #F05151`, `BLU_H #3B82F6` `:2004-2012` · `WA_H #F59E0B`, `VI_H #8B5CF6`, `PRO_H #3B82F6`, `CAR_H #F59E0B`, `FAT_H #EC4899`, `EMD_H #10B981`, `ORD2_H #C2410C` `:2030-2036` · `LOCKED_BADGE #8E8E93` `:2029`.

Numeric scales:
- `SP = {xs:4, s:8, m:12, l:16, xl:20, xxl:24, xxxl:32}` `:2037-2045`
- `RAD = {s:8, m:12, l:16, xl:20, sheet:24, pill:999}` `:2046-2053`
- `TYPE = {largeTitle:34, title1:28, title2:22, title3:20, headline:17, body:17, callout:16, subhead:15, footnote:13, caption1:12, caption2:11}` (px, iOS names) `:2054-2066`
- `SPRING = {press:{response:0.18,damping:1}, reflow:{0.3,1}, snap:{0.35,1}, sheet:{0.45,1}}` `:2067-2083`
- `S1..S8 = 4,8,12,16,20,24,32` `:2091-2096` (JS mirror of `--ds-s*`)
- `R_SM 10, R_MD 14, R_LG 18, R_XL 22` `:2093-2096` (JS mirror of `--ds-r-*`)
- `T_LARGE 2.125rem, T_TITLE 1.625rem, T_HEAD 1.25rem, T_BODY 1rem, T_SUB 0.9375rem, T_FOOT 0.8125rem, T_CAP 0.75rem, T_CAP2 0.6875rem` `:2101-2110` (rem so Text Size works)
- `FONT_D = "inherit"` `:2111` — the "display font" hook is a no-op; there is exactly one font stack, `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (`body` rule, `:2268`).
- `LB_PER_KG = 2.20462` `:4364`
- `PR_WORK_LO = 6, PR_WORK_HI = 8` `:4489`

**Redundancy to flag for the redesign:** three parallel scales express the same values — `SP`/`RAD`/`TYPE` (px, iOS-named), `S1..S8`/`R_SM..R_XL`/`T_*` (the actual DS), and `--ds-s*`/`--ds-r*`/`--ds-t*` (CSS). `SP`, `RAD` and `TYPE` are legacy; the Ds primitives use only the `S*`/`R_*`/`T_*` set.

---

## Design system primitives

Type scale used by the primitives (rem, scaling with Text Size): `T_LARGE 2.125rem` → `T_TITLE 1.625rem` → `T_HEAD 1.25rem` → `T_BODY 1rem` → `T_SUB 0.9375rem` → `T_FOOT 0.8125rem` → `T_CAP 0.75rem` → `T_CAP2 0.6875rem`.
Spacing rhythm: 4 / 8 / 12 / 16 / 20 / 24 / 32.
Radii: 10 / 14 / 18 / 22 (plus `RAD.sheet` 24 for bottom sheets, enforced by a CSS override at `:2326`: any `border-radius: 22px 22px 0 0` or `24px…` is forced to `24px 24px 0 0`).

**`DsHeader(p)`** `:18441-18488`
Props: `top` (default 52), `bottom` (default `S4`), `tint` (hex; renders a `linear-gradient(180deg, tint+"14", transparent)` wash), `eyebrow`, `title`, `size` (default `T_LARGE`), `subtitle`, `actions`, `children`.
Renders: padded block → flex row (`gap S3`, `align flex-start`) → left column `{eyebrow (T_CAP2/600/0.08em uppercase/MU), h1.ds-largetitle, subtitle (T_FOOT/MU/1.4)}` + right `actions` row (`gap S2`, `flexShrink 0`) → then `children` below.
`.ds-largetitle` is 800 weight, `letter-spacing 0.02em`, `line-height 1.05` (`:2326`). A CSS override at `:2326` retargets `padding: 52px` headers to `max(12px, max(58px, env(safe-area-inset-top)+10px) - var(--lk-top-off))` and shrinks the h1 to 32px inside `.lk-page`.

**`DsSection(p)`** `:18489-18512`
Props: `gap` (default `S5` bottom margin), `title`, `action`, `children`, `footnote`.
Renders: optional baseline-aligned header row `{p.ds-section-hd, action}` + children + footnote (`T_CAP2`, `MU`, `paddingLeft S1`).
`.ds-section-hd` = `T_CAP2`/600/`0.06em`/uppercase/`--color-text-muted`, margin-bottom `--ds-s2` (`:2326`).

**`DsCard(p)`** `:18513-18529`
Props: `tone` (`"soft"` → `FILL_SOFT`, else `ELEV`), `radius` (default `R_LG` 18), `pad` (default `S4` 16), `accent` (adds `1px solid <accent>`), `onClick`, `style`, `children`.
When `onClick` is set it becomes `role="button"`, `tabIndex=0`, `onKeyDown=lkKeyActivate` — keyboard-activatable. `overflow:hidden` always.

**`DsRow(p)`** `:18530-18572`
Props: `onClick`, `leading`, `label`, `detail`, `value`, `valueColor`, `trailing`, `strong`, `dense`, `style`.
Renders a flex row, `gap S3`, padding `S3 S4` (or `S2 S4` when dense), `minHeight 48` (38 dense). Label `T_SUB`/`TX`, weight 600 when `strong`, ellipsised; detail `T_CAP`/`MU`; value `T_SUB` in `.ds-num` (tabular figures), `flexShrink 0`. Same keyboard treatment as `DsCard`.
Composition: `.ds-list > * + * { border-top: 0.5px solid var(--ds-separator) }` (`:2326`) turns a stack of `DsRow`s into an iOS grouped list — separators come from the parent, not the row.

**`DsSegmented(p)`** `:18573-18609`
Props: `label` (aria-label, default "View"), `options: [{id,label}]`, `value`, `onChange`, `style`.
Renders `role="tablist"` over `FILL_SOFT`, `borderRadius R_SM` (10), `padding 2`, `gap 2`; each option is `role="tab"` with `aria-selected`, `flex:1`, `padding 7px 10px`, `borderRadius R_SM-3` (7), selected = `ELEV` background + `TX` + 600 + `0 1px 3px SHADOW`, unselected = transparent + `MU` + 500. Transition `background .18s, color .18s`.
**Gap:** the tabs carry no `aria-controls` and there is no `tabpanel`, so the tablist semantics are incomplete.

**`DsStat(p)`** `:18610-18640`
Props: `label`, `value`, `unit`, `detail`, `size` (default `T_TITLE`), `color`, `style`.
Renders label (`T_CAP2`/600/`0.05em`/uppercase/`MU`) over value (`.ds-num`, `FONT_D`, weight 800, `line-height 1.05`, colour `p.color || TX`) with an inline unit (`T_FOOT`/600/`MU`, `marginLeft 3`) and an optional detail line (`T_CAP2`/`MU`).

**Intended composition:** `DsHeader` → `DsSection(title)` → `DsCard(pad:0)` wrapping a `.ds-list` of `DsRow`s; `DsStat` in a grid inside a `DsCard`; `DsSegmented` in the section `action` slot.

**Critical finding:** four of the six primitives (`DsSection`, `DsCard`, `DsRow`, `DsStat`) have **zero call sites** in the 58k-line file, and `DsHeader` and `DsSegmented` have exactly **one each** (`:25332` and `:19815` respectively). Verified by `grep -n "Ds…"` over the whole file — each name appears only at its definition plus those two uses. The design system exists but the app is still built from ad-hoc inline `style` objects; this is why the stylesheet is full of attribute-substring hacks like `[style*='padding: 52px ']` and `button[style*='width: 32px']` (`:2326`).

---

## Custom hooks

**`useHubState(key, initial, allowed)`** `:2121-2139` → `[value, set]`
Persists a hub's sub-tab / drill-down position to `lk_ui_<key>` so switching bottom-tabs (which unmounts the inactive tab) does not reset it. On init it reads `ld("ui_"+key, initial)` and, if an `allowed` array is supplied and the stored value is not in it, falls back to `initial` — guarding against a remembered position pointing at a sub-tab since gated off. `set` accepts a value or an updater, mirrors into a `useRef` so consecutive updaters compose, writes through `sd`, then `setValue`. Used at 3 call sites beyond the definition (7 total occurrences of the name).

**`useTabReset(screen, reset)`** `:2140-2149`
Subscribes to the `window` event `lockedTabReset`; when `e.detail === screen` it calls `reset()`. Dispatched when the user taps the already-active bottom tab. **Note:** the `useEffect` has **no dependency array**, so the listener is removed and re-added on every render — correct but wasteful, and it means `reset` is always the latest closure (probably why it was written this way). Used at 1 call site beyond the definition.

**`useSheetDrag(onClose)`** `:2150-2267` → `{ref, close, zone}`
Drag-to-dismiss for bottom sheets. `ref` goes on the sheet element; `zone` spreads `onTouchStart/Move/End/Cancel` plus `style:{touchAction:"none"}` onto the grabber area.
- `start` cancels any in-flight spring **and sets `element.style.animation = "none"`**, because the entry keyframe animates the same `transform` and a running animation wins — without it the sheet ignored the first ~0.5 s of touch (`:2195-2197`).
- `move` computes `dy`; upward drags are rubber-banded via `-(1 - 1/(-dy*0.55/300 + 1)) * 300 * 0.3`; velocity is an EMA `0.75*instant + 0.25*previous`.
- `end` projects momentum with the iOS deceleration constant `0.998/(1-0.998)`; if the projection exceeds 45% of the sheet height it springs to `height+40` and calls `onClose`, else springs back to 0.
- `springTo` is a hand-written critically-damped spring: `ω = 2π/SPRING.sheet.response` (0.45 s), `k = ω²`, `c = 2ω`, `dt` clamped to 64 ms, settling when `|v| < 4 && |y-target| < 1`.
- `close` routes programmatic dismissal (Close button, backdrop tap) through the same exit animation, so both paths look identical (`:2244-2255`).
Used at ~7 call sites (8 total occurrences).

---

## Storage abstraction

- **Namespace:** every key is prefixed `lk_` by `ld`/`sd`; callers pass the bare name (`ld("history", [])` → `lk_history`).
- **`storageAvailable`** `:2411-2416`: one-time `setItem("test",1)/removeItem` probe at module load. Note it writes an **un-prefixed** `test` key. When false, `ld` returns the fallback and `sd` is a no-op that still returns `true` (`:2437` — the `return true` is outside the `if`), so a private-browsing user gets silent data loss with no signal. **This is a bug worth fixing in the redesign.**
- **`ld(k, fb)`** `:2417-2427`: `JSON.parse` with a try/catch; any falsy raw value (including a legitimately stored `""` or `"0"`… note `"0"` is truthy as a string, so only `""`/`null` fall through) returns the fallback.
- **`sd(k, v)`** `:2435-2455`: `JSON.stringify` + `setItem`, returns `true`/`false`. On a quota error it fires a one-per-page-load toast and a `lockedStorageFull` CustomEvent with `{detail:{key}}`.
- **`lkIsQuotaError(e)`** `:2430-2433`: `QuotaExceededError` | `NS_ERROR_DOM_QUOTA_REACHED` | `code 22` | `code 1014`.
- **`lkStorageUsage()`** `:2456-2467`: `{totalBytes, photoBytes, budgetBytes: 5*1024*1024}`, bytes estimated as `(key.length + value.length) * 2` (UTF-16 assumption).
- **Bypasses:** the boot script reads `lk_theme` / `lk_textScale` / `lk_deployVersion` directly (`:20, :38, :83`); the push module has its own `readRaw`/`writeRaw` with no prefixing (`:1325-1341`); the custom-exercise merge reads `lk_customEx` raw (`:4278`); `storedWeightUnit` deliberately re-reads `lk_weightStorageUnit` raw when `ld` fails to parse it (`:4386-4392`); Agent 8's sync layer monkey-patches `localStorage.setItem/getItem` (`:233-234`).

---

## Themes

Five profiles, defined in `THEMES` `:2469-2497`: `dark` (`bg #000000`, `card #1C1C1E`), `slate` (`#0D1117`/`#21262D`), `navy` (`#070F1E`/`#112035`), `midnight` (`#0C0917`/`#1C183A`), `light` (`#F2F2F7`/`#FFFFFF`). All five declare `accent: OR` — there is no per-theme accent.

Applied two ways simultaneously, belt and braces: an attribute `data-style-profile="<id>"` on `<html>` and a class from `ALL_THEME_CLASSES = ["light-mode","theme-slate","theme-navy","theme-midnight"]` `:2498` (dark = no class). Every theme CSS rule is written to match both selectors (`:2326`).

Persistence: `lk_theme`, written by `applyTheme` via `sd` `:2528`; read pre-paint by the boot script `:20` and again by `initTheme` `:2503`. With nothing stored, both paths follow `prefers-color-scheme: light`. `theme-color` meta is rewritten from a separate shell-colour map that is duplicated in the boot script (`:27`) and in `applyTheme` (`:2521-2524`) — a third copy of the same five values.

The non-dark themes rely heavily on `!important` overrides that target inline styles by substring — e.g. `html.theme-slate [style*='rgba(8, 8, 9']{background-color:rgba(13,17,23,0.92)!important}` and per-theme `input[style*='background']` / `textarea` / `select` overrides (`:2326`). This is brittle and is a direct consequence of the app not using the Ds primitives.

---

## Exercise data catalogue

**`GROUPS`** `:2975-4257` — 12 muscle groups, 23 sub-groups, **225 exercises**.

Group shape: `{id, name, col, subs:[…]}`. Sub shape: `{id, name, ex:[…]}`. Exercise shape: `{id:<int>, name, eq, gifUrl}` plus an optional `apiId` on exactly 5 entries (`exr_41n2hd6SThQhAdnZ` on Chin Up `:3161`, and 4 more at `:3573, :3603, :4210, :4226`).

| Group id | Name | `col` | Sub-groups |
|---|---|---|---|
| chest | Chest | `RE` | Upper Chest, Mid Chest, Lower Chest |
| back | Back | `BLU` | Lats, Mid Back, Lower Back, Traps |
| shoulders | Shoulders | `OR` | Front Delt, Side Delt, Rear Delt |
| triceps | Triceps | `OR` | Long Head, Lateral Head, Medial Head |
| biceps | Biceps | `EMD` | Long Head, Short Head |
| forearms | Forearms | `#06B6D4` | All |
| quads | Quads | `WA` | All |
| hams | Hamstrings | `#DC2626` | All |
| glutes | Glutes | `FAT` | All |
| adduc | Adductors | `#A78BFA` | All |
| abs | Abs | `GR` | Weighted, Bodyweight |
| calves | Calves | `#64748B` | All |

Group ids/line anchors: chest `:2976`, back `:3143`, shoulders `:3365`, triceps `:3527`, biceps `:3696`, forearms `:3809`, quads `:3858`, hams `:3912`, glutes `:3971`, adduc `:4030`, abs `:4089`, calves `:4202`.

Note six of the twelve `col` values are `var()` aliases and six are raw hex — this mixture is exactly why `readableAccent()` exists (`:4298-4306`).

Equipment vocabulary (10 values, 225 total): Cable 55, Dumbbell 47, Barbell 45, Machine 35, Bodyweight 29, Smith Machine 4, EZ Bar 4, Plate 3, Band 2, Wheel 1.

**Image URLs** are **not** built at runtime — every exercise carries a fully-literal `gifUrl` of the form `https://static.exercisedb.dev/media/<8-char id>.gif` (e.g. `:2984`, `:2989`). There is no base-URL constant and no template; a redesign that wants a CDN swap must rewrite 225 literals. `ALL_EX` passes it through as `e.gifUrl || null` (`:4266`).

**`ALL_EX`** `:4258-4275` — flattened at module load into `{id, name, eq, gifUrl, group: g.name, muscle: s.name === "All" ? g.name : s.name, col: g.col, gid: g.id, sid: s.id}`. Sub-groups literally named "All" collapse to the group name for display.

Immediately after (`:4276-4290`), user-defined exercises from raw `localStorage["lk_customEx"]` are appended if their `id` is not already present — an O(n·m) linear scan, and custom entries are trusted to carry the same shape.

---

## Utility functions

**Date:** `isoDay(d)` `:1961` returns the **local** calendar day, written specifically because `toISOString()` filed a 7 pm UTC-5 workout under tomorrow and broke streaks, "trained today", the food diary and every date comparison (`:1955-1960`). `dayOf(v)` `:1969` normalises either a bare `YYYY-MM-DD` or a full ISO timestamp to a local day. The push module carries its own duplicates, `todayISO` `:1376` and a second `dayOf` `:1385`.

**Units:** `LB_PER_KG 2.20462` `:4364`. `storedWeightUnit()` `:4380` resolves *once* what stored lift weights mean, records it in `lk_weightStorageUnit`, and never derives it again — the long comment at `:4366-4379` documents that deriving it live from `lk_unitConversion` caused every weight in the app to silently rescale by 2.2 when three independently-synced keys disagreed. `storedToUnit` / `unitToStored` `:4414-4425` are the numeric core; `kgToDisp` `:4430` (quarter-rounded display string), `liftDisp` `:4439` (1 dp numeric — distinct from `kgToDisp` because applying the bodyweight conversion to a lift turned 225 lb into 496, `:4436-4438`), `dispToKg` `:4444` (4 dp for storage), `convToKg` `:4465` (lenient). `freezeWeightStorageUnit` `:4455` pins it at boot. `unitConvOn()` `:4291` defaults to `true`.

**Formatting:** `fmtQ(v)` `:4351` snaps to the nearest 0.25 and drops unnecessary decimals (84.1→"84", 84.5→"84.5"); `fmtCal(v)` `:4357` rounds to whole numbers. Documented as app-wide policy: storage keeps full precision, only display is snapped (`:4346-4350`).

**Colour contrast:** `lkLum(r,g,b)` `:4307` (WCAG relative luminance, sRGB linearisation), `lkRatio(a,b)` `:4314`, `readableAccent(hex)` `:4318` — takes a 7-char hex, walks 21 steps toward white (dark card, luminance of `#1C1C1E`) or black (light card, luminance 1.0) and returns the first value clearing 4.5:1, memoised in `_lkReadable` keyed by `hex + "L"/"D"`. Non-hex or non-7-char input is returned untouched. 22 call sites.

**Training maths:** `e1rm(w,r)` `:4479` Epley, with a deliberate exception that a 1-rep set returns the weight itself rather than ×1.033. `prSummary(list)` `:4491`. `compoundRank(name)` `:4529` over `PR_COMPOUNDS` `:4516-4527` — 10 regexes allowing 0–2 words between the movement word and the lift ("Overhead Barbell Press"). `prDay` `:4540` / `prLabel` `:4551` handle the legacy `"Today"` string PRs. `e1rmSeries` `:4568` merges history sets (skipping `setType === "warmup"`) with dated PRs, max per day.

---

## Accessibility

Everything below is in the `CSS` array at `:2268`/`:2326` unless noted.

- **Reduced motion** — three separate blocks (redundant, all present): `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`; a second block that additionally converts spinners (`[style*="animation: spin"], .lk-spin`) to a 1.4 s `pulse` so a loading indicator remains legible rather than freezing; a third near-identical no-space variant.
- **Increased contrast** — `@media (prefers-contrast: more){:root{--color-border:rgba(255,255,255,0.35);--color-text-muted:#D4D4D8}html.light-mode{--color-border:rgba(60,60,67,0.60);--color-text-muted:#3C3C43}}` plus a border-width reassertion.
- **Reduced transparency** — `@media (prefers-reduced-transparency:reduce){nav,[style*='backdrop-filter'],[style*='var(--glass-bar)'],[style*='rgba(8, 8, 9']{backdrop-filter:none!important;background:var(--color-surface)!important}}`.
- **Touch targets (44 px)** — `input:not([type=checkbox]):not([type=radio]),select{min-height:44px}`; a `button::after,[role=button]::after` pseudo-element that expands the hit area to `width:max(100%,44px);height:max(100%,44px)` without changing layout; explicit `min-width/min-height:44px` rescues for inline-styled buttons and `div[role='button']`s declared at 20–40 px.
- **Focus rings** — `button:focus-visible, a:focus-visible, [role=button]:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;box-shadow:none}` and the same for `input/textarea/select`; both switch to `--color-accent-deep` under `html.light-mode` for contrast against a white card.
- **Text scaling** — the whole type scale is rem and the root font-size is driven by `lk_textScale` (`:36-40`, `:2097-2110`).
- **iOS focus-zoom prevention** — `input…,textarea,select{font-size:16px!important}`, deliberate because a zoomed page mis-anchors every `position:fixed` element (`:2270-2276`).
- **Contrast-corrected accents** — `readableAccent()` `:4318`; plus blanket CSS retargeting of `[style*='color: var(--color-accent)']` and `[style*='color: rgb(249, 115, 22)']` to `--color-accent-text`, and of accent-background buttons with white text to `--color-accent-deep`. Several token comments document specific ratio failures that drove the values (`GR` at 2.27:1 `:1996-1997`, `RE_H #EF4444` at 4.22:1 `:2008-2010`, `#DC2626` at 3.5:1 on dark and `#06B6D4` at 2.4:1 on light `:4302-4304`).
- **Text selection** — the body is `user-select:none` (app-like), re-enabled for `input,textarea` and for `p, li, .lk-selectable`.
- **Semantics** — `DsSegmented` provides `role="tablist"`/`role="tab"`/`aria-selected`/`aria-label`; `DsCard` and `DsRow` add `role="button"`, `tabIndex=0` and `onKeyDown=lkKeyActivate` when clickable.
- **Gaps:** no `prefers-color-scheme` **media** styling (theme is class-driven only, so a system theme change mid-session does not propagate); no skip link, no `sr-only` utility class anywhere in the stylesheet (verified by grep); `DsSegmented` tabs have no `aria-controls` and no matching `tabpanel`; the `user-scalable=no, maximum-scale=1.0` viewport (`:5`) plus the gesture blocker at `:63-68` remove pinch-zoom entirely, which the Text Size setting only partly compensates for.

---

## Error boundaries

| | `ErrorBoundary` `:2540-2600` | `ScreenBoundary` `:2601-2657` |
|---|---|---|
| State | `{hasError, error}` | `{hasError, msg}` |
| Catches | any throw in the whole subtree it wraps (app root) | any throw within one screen |
| Renders | full-viewport (`minHeight:100vh`) centred column on a **hardcoded** `#080809` with `#EF4444` text: h2 "Error Loading App", the error message, "Check browser console (F12) for details", and a **hardcoded** `#F97316` "Refresh Page" button | inline block (`padding 40px 20px`, colour `RE`): "Something went wrong on this screen", the message in `--color-text-muted`, and an `OR` "Reload" button |
| Recovery | `window.location.reload()` | `window.location.reload()` |
| Logging | `componentDidCatch` is defined but **empty** `:2555` — nothing is reported anywhere | no `componentDidCatch` at all |

Both bypass the token system with literal hex in the fallback (deliberate for `ErrorBoundary` — the stylesheet is rendered by React at `:34028`, so if React itself failed the tokens may not exist; `ScreenBoundary` uses tokens because React is clearly alive by then). Neither offers a "go back / reset this screen" path short of a full reload, and neither clears the state that caused the crash — a poisoned `localStorage` value produces a reload loop. "Check browser console (F12)" is user-hostile copy on a phone-first PWA.

---

## Open questions / UNVERIFIED

1. **UNVERIFIED — where the Text Size setting writes `lk_textScale`.** Only the read at `:38` is in my range. Confirm by grepping `lk_textScale` in the Settings screen (Agent owning Settings).
2. **UNVERIFIED — `lkKeyActivate`.** Used by `DsCard` `:18521` and `DsRow` `:18535` and 27 other places, but defined outside my ranges. Confirm its definition handles both Enter and Space and calls `preventDefault` on Space.
3. **UNVERIFIED — `getEx` and `isLiftingSession`,** called by `e1rmSeries` `:4570` and `:4572`, are defined outside my ranges.
4. **UNVERIFIED — whether the four unused Ds primitives are dead code or aspirational.** Grep confirms zero call sites today; whether they were ever used in an earlier build cannot be determined from this file.
5. **UNVERIFIED — the 5 MB `budgetBytes` in `lkStorageUsage` `:2467`** is a hardcoded assumption; actual Safari/Chrome origin quotas differ. Confirm against `navigator.storage.estimate()` if accuracy matters.
6. **UNVERIFIED — `useTabReset`'s missing dependency array `:2141-2148`.** It re-subscribes every render. Whether this is deliberate (to keep `reset` fresh) or an oversight is not stated in a comment.
7. **Open — `sd()` returns `true` when `storageAvailable` is false `:2437`.** Callers that check the return (e.g. `saveProgressPhoto` `:2868`) therefore cannot distinguish "saved" from "storage unavailable, silently discarded". This looks like a genuine bug.
8. **Open — three copies of the shell colour map** (`:27`, `:2521`, plus the `--color-shell-bg` values at `:1228`/`:1233`) and two copies of the colour token set (`<style>` `:1218` vs `CSS` `:2268`), with only a comment (`:1221-1222`) keeping them in sync.
