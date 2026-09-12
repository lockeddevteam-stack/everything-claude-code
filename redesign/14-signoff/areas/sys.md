### F-SYS-001 — Service worker registration
- location: `<head>` inline boot script
- user action: 
- behaviour: `if("serviceWorker" in navigator){ window.addEventListener("load", function(){ navigator.serviceWorker.register("/sw.js").catch(function(){}); }); }` (`:70-74`). - Storage / Network: registers `/sw.js` (a separate file, not in this document)
- v6 status: WORKING (registration code); the `/sw.js` file itself is outside this repo file — UNVERIFIED that it exists at deploy time.

### F-SYS-002 — PWA manifest and iOS install metadata
- location: 
- user action: 
- behaviour: `<link rel="manifest" href="/manifest.json"/>` (`:13`); `apple-mobile-web-app-capable=yes` (`:6`), `apple-mobile-web-app-status-bar-style=black-translucent` (`:7`), `apple-mobile-web-app-title=LOCKED` (`:8`), `theme-color=#080809` rewritten at runtime by the theme script (`:12`), viewport `user-scalable=no, viewport-fit=cover` (`:5`).
- v6 status: WORKING (declarations present); `/manifest.json` content UNVERIFIED — not in this file.

### F-SYS-003 — Install prompt (`beforeinstallprompt`)
- location: 
- user action: 
- behaviour: **NONE.** `grep -c beforeinstallprompt` over the whole file returns `0`. There is no custom Android/Chrome install prompt, no deferred prompt, no "Add to Home Screen" button. - Related: the app *detects* standalone mode (`isStandalone()` at `:1407-1410`) and, on iOS, tells the user to install manually rather than offering a prompt: "On iPhone, add LOCKED to your Home Screen first — Share → Add to Home Screen" (`:1581-1583`).
- v6 status: DEAD / NOT IMPLEMENTED

### F-SYS-004 — Deploy-version check and cache bust
- location: `<head>` boot script
- user action: 
- behaviour: 1. On every load, `fetch("https://lockedapi.cescocugliari.workers.dev/app-version", {cache:"no-store"})` (`:78-83`). 2. If `data.version` differs from `localStorage.lk_deployVersion`, it drops caches and hard-reloads so users get the latest build (`:84-90`).
- v6 status: WORKING

### F-SYS-005 — Zoom lock
- location: 
- user action: 
- behaviour: `["gesturestart","gesturechange","gestureend"].forEach(evt => document.addEventListener(evt, e => e.preventDefault(), {passive:false}))` — pinch-zoom is swallowed so overlays and the number pad are never drawn against a scaled viewport (`:62-68`). Double-tap zoom is handled by `touch-action:manipulation` in CSS instead of swallowing `touchend`, deliberately, so repeated `+2.5` taps all register (`:66-67`).
- v6 status: WORKING — `:63-65`.

### F-SYS-006 — Push notification module (`window.LOCKEDPush`)
- location: IIFE in `<head>`, `:1278-1953`
- user action: flipping the switch in Settings → Notifications
- behaviour: 1. Capability gate: `supported()` requires `serviceWorker` + `PushManager` + `Notification` (`:1413-1417`). 2. `enable()` must be called from a user gesture (iOS ignores otherwise) (`:1575-1577`). It: checks support, reads `Notification.permission`, calls `Notification.requestPermission()` if `default`, throws a specific message on `denied` vs not-granted (`:1586-1592`). 3. `await navigator.serviceWorker.ready`, GET `API + "/push/key"` → `{publicKey}`, throws if absent (`:1594-1600`). 4. Compares any existing subscription's `applicationServerKey` byte-for-byte against the fetched key; on mismatch it unsubscribes and re-subscribes with `{userVisibleOnly:true, applicationServerKey}` (`:1603-1623`). 5. POST `/push/subscribe` with `{deviceId, subscription: sub.toJSON(), tz, prefs, ctx: buildContext()}` (`:1625-1631`). On non-ok it throws the server's `error`. 6. Writes `lk_pushEnabled = true` (`:1636`). `_enabling` de-dupes concurrent calls (`:1573`, `:1579`).
- v6 status: WORKING

### F-SYS-007 — Notification preferences and scheduling
- location: 
- user action: 
- behaviour: 1. `DEFAULT_PREFS = {rest:true, training:true, trainingTime:"07:30", checkin:true, checkinTime:"08:00", idle:true, supps:true, compounds:true, restock:true}` (`:1311-1321`). 2. `setPrefs(partial)` merges, writes `lk_pushPrefs`, and if enabled POSTs `/push/prefs` with `{deviceId, tz, prefs, ctx}`. A `404` means the Worker lost the record → `enable()` re-registers (`:1662-1678`). 3. `refresh(force)` re-POSTs the context snapshot, throttled to once per 60s (`:1680-1699`), and fires on every `visibilitychange` → visible (`:1791-1793`). 4. `buildContext()` reads `lk_profile`, `lk_splits`, `lk_history`, `lk_feedback` and mirrors the Home feed's "what's next" logic so the reminder and the app agree on which day is up (`:1418-1430`). 5. **Rest-timer alert**: `scheduleRest(seconds, exerciseName)` POSTs `/push/rest` with `{deviceId, seconds, exercise}`, gated on `prefs.rest`; `cancelRest()` cancels (`:1723-1737`). 6. **Idle-workout check**: `scheduleIdleCheck(seconds, workoutName, force)` POSTs `/push/idle` — "half an hour after the last thing you logged, ask whether the session is still going", throttled to once/60s unless forced (`:1739-1757`); `cancelIdleCheck()` clears (`:1758-1762`). 7. `postHealing(path, body)` retries once through `enable()` on a 404, so a lost rest alert self-heals (`:1712-1722`). 8. `test()` POSTs `/push/test` and surfaces the server error verbatim (`:1702-1709`).
- v6 status: WORKING

### F-SYS-008 — Notifications settings UI (`NotificationsCard`)
- location: Settings/Profile screen
- user action: 
- behaviour: `NotificationsCard` (`:31756`+) reads `P.status()` defaulting to `{supported:false, needsInstall:false, permission:"unsupported", enabled:false, prefs:{}}` when the module is absent (`:31758-31760`). Toggling off calls `P.disable()` and shows "Notifications turned off." (`:31776`). When `permission === "denied" && !enabled` it replaces the switch with "Notifications are blocked for this site in your browser or phone settings. Allow them there, then flip this on." (`:31856-31859`). Mounted in the settings tree at `:32956`.
- v6 status: WORKING

### F-SYS-009 — Service worker → app messaging and push deep links
- location: 
- user action: 
- behaviour: 1. `navigator.serviceWorker.addEventListener("message", …)` filters on `msg.source === "locked-push"` (`:1776-1782`). 2. `msg.type === "resubscribe"` → the browser rotated the subscription, quietly `enable()` again (`:1780-1784`). 3. Any other message → `window.dispatchEvent(new CustomEvent("lockedPushOpen", {detail: msg}))` so React can route (`:1786`). 4. Cold start from a notification carries `?open=…` in the URL; the app routes on it (`:49945`, `:57482`). Example: `?open=checkin` (`:49945`).
- v6 status: WORKING

### F-SYS-010 — Boot self-heal for push subscriptions
- location: 
- user action: 
- behaviour: on `navigator.serviceWorker.ready`, if `lk_pushEnabled` is true but `pushManager.getSubscription()` returns nothing, silently `enable()`; otherwise `refresh(true)` (`:1944-1951`). The in-source rationale: unregistering the SW on every deploy used to kill subscriptions while the UI still said notifications were on (`:1937-1943`).
- v6 status: WORKING

### F-SYS-011 — `ErrorBoundary` — whole-app crash screen
- location: wraps `<App/>` at the React root
- user action: 
- behaviour: 1. `class ErrorBoundary extends React.Component` with `state {hasError:false, error:null}` (`:2540-2547`). 2. `getDerivedStateFromError(error)` → `{hasError:true, error}` (`:2548-2553`). 3. **`componentDidCatch(error, errorInfo) {}` — an empty body. Nothing is logged, reported, or sent anywhere** (`:2554`). 4. Fallback UI: full-screen `#080809`, red text, `<h2>Error Loading App</h2>`, `error.message` or "Something went wrong", "Check browser console (F12) for details", and a "Refresh Page" button calling `window.location.reload()` (`:2555-2596`). 5. Mounted: `ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ErrorBoundary, null, React.createElement(App, null)))` (`:58002`).
- v6 status: PARTIAL

### F-SYS-012 — `ScreenBoundary` — per-screen crash containment
- location: 
- user action: 
- behaviour: 1. `class ScreenBoundary` with `state {hasError:false, msg:""}` (`:2601-2608`); `getDerivedStateFromError(e)` stores `e.message || "Unexpected error"` (`:2609-2614`). **No `componentDidCatch` at all** — nothing is logged. 2. Fallback: inline red panel "Something went wrong on this screen", the message, and a "Reload" button that calls `window.location.reload()` (`:2615-2653`). 3. Usage: every routed screen is wrapped, keyed by screen name — `React.createElement(ScreenBoundary, {key: screen}, content)` (`:57734-57737`). The `key` means switching tabs remounts the boundary, which resets `hasError` — so navigating away and back is an implicit recovery path.
- v6 status: PARTIAL

### F-SYS-013 — Loading and empty-state patterns
- location: 
- user action: 
- behaviour: 
- v6 status: WORKING (as a pattern), but there is **no retry affordance anywhere in onboarding** — every error path requires the user to re-type.

### F-SYS-014 — Event listeners at a system level (54 `addEventListener` calls)
- location: 
- user action: 
- behaviour: 

### F-SYS-015 — Timers at a system level
- location: 
- user action: 
- behaviour: 

### F-SYS-016 — Beta data collection and sync (touched by onboarding)
- location: 
- user action: 
- behaviour: once `lk_betaStatus` is true (set by `claimBetaCode`, `:2766`), `logBetaActivity(action, data)` appends `{ts, action, data, betaId}` to `lk_betaLog` (`:2770-2780`) and `logBetaAI(input, output)` appends `{ts, input, output, betaId}` to `lk_betaAILog` (`:2781-2791`). Both no-op if `lk_betaStatus` is false. Data is uploaded to `SYNC_URL = "https://lockedapi.cescocugliari.workers.dev/beta-sync"` (`:2792`) by `syncBetaData` (`:2796`+). `SILENT_BETA_IDS = ["summerbeta"]` makes `isSilentBeta()` true for that one code (`:2793-2795`). - Consent: obtained by the Beta Tester Agreement at F-ONB-003 (`:34133-34176`).
- v6 status: WORKING
