# Agent 8 — App root, auth, cloud sync, paywall

File audited (read-only, chunked): `redesign/input/locked-current-v6.html` (58,015 lines).
Scope: exclusive range **57186–58015** (App root + mount) and cross-cutting **auth/sync/paywall/beta/storage** layer (mostly 126–1217, plus 2340–2870).

All server-side behavior is **UNVERIFIED**: no Cloudflare Worker source, no Supabase SQL, no migrations and no RLS policies exist in this repo. Every statement about what `lockedapi.cescocugliari.workers.dev` or Supabase does on the server is inferred from client code only.

---

## PART A — Feature entries

### F-ROOT-001 App root component & global state
- **Location**: `redesign/input/locked-current-v6.html:57186-58006`
- **User action**: none — mounts at load.
- **Behavior**:
  1. `App()` is a single function component holding all global app state (57186).
  2. Lazy `useState` initializers read localStorage through `ld()`: `profile` (57187-57189), `useKg` derived from `profile.useKg !== false` (57190-57193), `splits` (57194-57196), `prs` (57197-57199), `history` wrapped in `withWorkoutIds` (57200-57202), `customs` (57203-57205), `workout` from `activeWorkout` (57206-57209), `showTutorial` from `!ld("tutorialSeen")` (57219-57221).
  3. Non-persisted UI state: `screen` ("home"), `finRows`, `finSec`, `startTime`, `showSaveToast`, `showResumeDialog` (57205-57218), `restInfo` (57443), `discardArmed` (57517).
  4. Every setter is a write-through wrapper that persists on change: `setSplits` (57281-57287), `setPrs` (57288-57294), `setHistory` (57295-57301), `setWorkout` (57254-57261).
  5. If `profile` lacks `displayName` or `username`, App returns `<Onboarding onComplete={completeOnboarding}/>` and renders nothing else (57553-57555).
- **Components**: `Onboarding`, `Nav`, `ScreenBoundary`, `TutorialOverlay`, `VoiceButtonWrap`, `WorkoutLog`, plus every screen (see F-ROOT-002).
- **Functions**: `setWorkout`, `setSplits`, `setPrs`, `setHistory`, `addCustom` (57302-57324), `toggleUnit` (57325-57337), `updateProfile` (57338-57346), `completeOnboarding` (57347-57404), `startWorkout` (57405-57415), `finishWorkout` (57416-57422), `saveWorkout` (57423-57461), `go` (57531-57552), `renderTab` (57589-57736).
- **State**: 13 `useState` hooks + 2 `useRef` (`navStack` 57518, `bannerRef` 57565).
- **Storage**: via `ld`/`sd` — `lk_profile`, `lk_splits`, `lk_prs`, `lk_history`, `lk_customEx`, `lk_activeWorkout`, `lk_activeWorkoutRows`, `lk_activeWorkoutSec`, `lk_activeWorkoutRestTarget`, `lk_tutorialSeen`.
- **Network**: only the profiles read at 57225-57250 (see F-AUTH-010).
- **AI**: none directly.
- **Edge cases**: `addCustom` invalidates `EX_NAME_INDEX` so newly created exercises appear in `exByName()` without reload (57314-57318).
- **Gating**: none.
- **Status**: WORKING.
- **Evidence**: full read of 57186-58006.
- **Notes**: no Context/Provider anywhere — all state is prop-drilled into screens.

### F-ROOT-002 Tab routing & screen switching
- **Location**: `57589-57736` (`renderTab`), `57531-57552` (`go`).
- **User action**: tap a bottom-nav tab; call `go(screen)` from any child.
- **Behavior**:
  1. `screen` is a plain string. `renderTab()` is an if/else chain mapping it to a screen component.
  2. Screens: `review`→`Review` (57591-57607); `home`|`workout`→`HomeScreen` (57607-57619); `train`→`TrainHub` (57619-57636); `cardio`→`CardioSection` (57636-57664); `profile`→`ProfileScreen` (57664-57677); `settings`→`SettingsScreen` (57677-57686); `cycletrack`→`CycleTrackerScreen` (57686-57690); `progress`→`ProgressPage` (57690-57702); `fuel`→`FuelTab` (57702-57715, note: a separate `if`, not part of the chain); `shopping`→`ShoppingBudgetTab` (57702-57709); `betaAdmin`→`BetaAdminPanel` (57709-57711); `coach`→`CoachScreen` (57711-57721); fallback→`HomeScreen` (57721-57733). **14 routes.**
  3. Result is wrapped in `ScreenBoundary` keyed by `screen`, so a crash in one tab does not take down the shell and remounts on tab change (57734-57736; boundary at 2601-2650).
  4. `go(scr)`: tapping the current tab dispatches `lockedTabReset` and returns (57532-57537). Moving between top-level tabs (`home,train,fuel,coach,profile`) *replaces* the nav-stack root; any other target pushes and calls `window.history.pushState({lkDepth})` (57538-57550).
  5. `popstate` pops `navStack` and restores the previous screen; at stack depth 1 the event is left alone so back exits the app (57519-57530).
- **Components**: `ScreenBoundary` (2601).
- **State**: `screen`, `navStack` ref.
- **Storage**: none for routing (screen is not persisted — reload always lands on `home`).
- **Edge cases**: the workout screen is *kept mounted but hidden* (`display:none`) while `workoutActive` so its timer survives tab changes (57905-57930). `fuel` uses `if` not `else if`, so it overrides any earlier match (57702).
- **Status**: WORKING.
- **Evidence**: 57531-57736, 57905-57935.

### F-ROOT-003 Bottom navigation bar (`Nav`)
- **Location**: `7652-7758` (component), `57957-57961` (usage).
- **User action**: tap one of 5 tabs.
- **Behavior**:
  1. 5 tabs: Home, Train, Fuel, Coach, Profile (7673-7692).
  2. Not `position:fixed` — it is the last flex row of the shell column (7699-7704).
  3. Measures its own height with a `ResizeObserver` + resize listener and publishes it as CSS var `--lk-nav-h` on `documentElement` (7657-7672); consumed at 1268-1269, 14599, 52056, 57964, 57984.
  4. Active tab is *derived*, not equal to `screen`: workout/cardio→`train`; settings/betaAdmin→`profile`; progress/cycletrack→`home`; shopping→`fuel` (57958).
  5. Accessibility: `role="navigation"`, `aria-label="Main navigation"`, per-tab `aria-label` with "(current page)" and `aria-current="page"` (7708-7720).
  6. Hidden entirely when `screen === "review"` (`showNav`, 57588).
  7. A decorative accent gradient scrim (150px, `pointerEvents:none`, z-99) sits behind it (57944-57956).
- **Status**: WORKING.
- **Evidence**: 7652-7758, 57944-57961.

### F-ROOT-004 In-progress workout banner
- **Location**: `57556-57587` (height publishing), `57856-57903` (render).
- **Behavior**:
  1. Shown when `workoutActive && !onWorkoutScreen` — i.e. a workout exists, you are not on the workout screen, and not on review (57548-57550, 57856).
  2. Fixed to top, tap or keyboard-activate (`lkKeyActivate`) returns to `screen="workout"` (57857-57866).
  3. Right side shows a live rest countdown `REST m:ss` when `restInfo.active`, else "TAP TO RETURN" (57899-57902). `restInfo` is fed by a `lockedRest` window event (57443-57450).
  4. Its measured height is published as `--lk-top-off` via `ResizeObserver`, set to `0px` when hidden (57565-57587); pages consume it as `paddingTop` (57934).
- **Status**: WORKING.
- **Evidence**: 57556-57587, 57856-57903.

### F-ROOT-005 Resume-workout dialog
- **Location**: `57262-57267` (trigger), `57761-57855` (render).
- **Behavior**:
  1. On mount, if `workout` exists and `screen !== "workout"`, show the dialog (57262-57267, empty dep array — mount only).
  2. Escape closes it via `useEscape` (57216-57218; helper at 5160).
  3. Rendered through `lkPortal` (5072) at z-2000.
  4. "Start Fresh" is a **two-tap armed destructive action**: first tap sets `discardArmed`, relabels to "Discard workout?" and turns red; second tap clears `lk_activeWorkout`, `lk_activeWorkoutRows`, `lk_activeWorkoutSec`, `lk_activeWorkoutRestTarget` (57808-57838).
  5. "Resume" sets `screen="workout"` (57839-57854).
- **Status**: WORKING.
- **Evidence**: 57761-57855.

### F-ROOT-006 Notification / deep-link routing
- **Location**: `57466-57500`.
- **Behavior**:
  1. Cold start: reads `?open=` from the query string; if present and not `endworkout`, routes and then `history.replaceState` strips it (57487-57493).
  2. Warm: listens for `lockedPushOpen` (from the service worker) and matches the URL substring (57494-57499).
  3. `open("checkin")` sets `window.__lockedCoachPane="check-in"`, goes to `coach`, and dispatches `lockedCoachPane` (57469-57474). `open("workout")` goes to `workout` if `lk_activeWorkout` exists else `train` (57475). `open("fuel")` → `fuel` (57476).
- **Status**: WORKING (client side). Service-worker message origin UNVERIFIED here.
- **Evidence**: 57466-57500.

### F-ROOT-007 Workout lifecycle in the root
- **Location**: `57405-57461`.
- **Behavior**:
  1. `startWorkout(info)` restores `lk_activeWorkoutRows`/`Sec` if present and jumps straight to `review` when rows exist, else `workout` (57405-57415).
  2. `finishWorkout(rows, sec)` persists rows + seconds and goes to `review` (57416-57422).
  3. `saveWorkout(rec)` prepends a normalized record to `history` (id, name, sets, vol, dur, date, dateISO, exercises, blocks, reflection, note, aiInsight) (57424-57440), calls `logBetaActivity("workout_saved", …)` (57441-57446), shows a 2.5s toast, clears all four active-workout keys, returns home, then calls `syncBidirectional()` (57447-57460).
- **Edge cases**: on `visibilitychange` → hidden with a live workout, `isPaused:true` is written into the workout (57268-57280).
- **Status**: **BROKEN (partial)** — see SEC/BUG-2: `syncBidirectional` is not in scope at 57460.
- **Evidence**: 57460 vs. the only definition at 465 inside the auth IIFE; `rg 'syncBidirectional'` finds no global export other than `window.LOCKED.syncToCloud` (1159).

### F-ROOT-008 Onboarding completion
- **Location**: `57347-57404`.
- **Behavior**: builds `{displayName, username, useKg, createdAt}`, persists to `lk_profile`, and converts an AI-generated program (`prog.splits`) into the app's split shape — consolidating several single-day splits into one multi-day program when there are ≥2 and all have exactly one day (57369-57389); otherwise wraps `prog.splits` as days of one program (57390-57402). Ends at `screen="home"`.
- **Status**: WORKING.
- **Evidence**: 57347-57404.

### F-ROOT-009 Mount, ErrorBoundary and CDN fallback
- **Location**: `58007-58015`.
- **Behavior**:
  1. `ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>)` inside a `try` (58007-58009).
  2. On a synchronous mount throw, `#root.innerHTML` is replaced with a "Failed to Load App" panel showing `e.message` (58010).
  3. A separate trailing script waits 3000 ms and, if `!window.React`, renders a "CDN Error" panel with a Reload button (58012-58015).
- **Status**: WORKING.
- **Evidence**: 58007-58015. Note the fallback copy says "unpkg" (58014) — verify the actual CDN host in the head.

### F-ROOT-010 Shell chrome (status-bar scrim, toasts, voice button)
- **Location**: `57737-57760`, `57962-58005`.
- **Behavior**: renders `<style>{CSS}</style>` (57737); a fixed blurred status-bar scrim at z-180 sized `env(safe-area-inset-top)+8px` (57738-57760); `.lk-shell` max-width 420px centered (57849-57855); an empty `#lockedVoiceToast` div driven imperatively from outside React (57962-57983); the green "✓ Saved" toast when `showSaveToast` (57984-58005); `VoiceButtonWrap` rendered only when `showNav && profile` (57962).
- **Status**: WORKING.
- **Evidence**: as cited.

---

### F-AUTH-001 Supabase client bootstrap
- **Location**: `126-297` (module IIFE), client created at `273-280`.
- **Behavior**:
  1. An IIFE `"use strict"` module at 130-131 defines `SUPABASE_URL` = `https://fwimdnukebbrwpwdyjbv.supabase.co` (133), `SUPABASE_ANON` = `[REDACTED]` (134), `WORKER_URL` = `https://lockedapi.cescocugliari.workers.dev` (135).
  2. `init()` (267) aborts with a console error if `window.supabase` is absent (268-271).
  3. `createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "locked_session", storage: window.localStorage } })` (273-280).
  4. `init` is wired to `DOMContentLoaded` or run immediately (1210-1214).
- **Storage**: session JSON under localStorage key `locked_session` (277).
- **Status**: WORKING.
- **Security**: `SUPABASE_ANON` is a hardcoded anon-role JWT (`iat` 1778202921, `exp` 2093778921 ≈ year 2036) — see Security findings.

### F-AUTH-002 Sign up
- **Location**: `380-384` (`signUp`), `1000-1059` (`_submitAuth` signup branch).
- **User action**: SIGN UP tab → email + password → CREATE ACCOUNT.
- **Behavior**:
  1. Client-side password policy enforced before the call: ≥8 chars, one uppercase, one lowercase, one digit (1015-1026); live checklist via `_validatePw` (1079-1094).
  2. `_client.auth.signUp({email, password})` (1002).
  3. If the error message matches "already registered"/"already been registered"/"user already", it silently attempts `signIn` and, on failure, throws "An account with this email already exists. Try signing in." (1004-1018).
  4. If it matches "rate limit"/"email rate"/"too many", it attempts `signIn`; on "not confirmed" it shows the confirm screen; otherwise "Signup is temporarily limited." (1020-1038).
  5. If `!result.data.session` (email confirmation ON), it tries `signIn` anyway; on failure it stores `_pendingEmail` and switches to the `confirm` screen (1041-1053).
  6. On immediate session: `fetchSubscription`, `hideOverlay`, `checkTrialWarning`, toast "Welcome to LOCKED! Your 14-day trial starts now." (1054-1058).
- **Stored**: Supabase session under `locked_session`; `__lk_last_uid__` on the next `getSession` (301).
- **Status**: WORKING.
- **Notes**: the exported `LOCKED.signUp` (1155) is the bare 380-384 version, which does *not* do the fallbacks — the UI uses `_submitAuth` instead.

### F-AUTH-003 Sign in
- **Location**: `386-411`.
- **Behavior**:
  1. `auth.signInWithPassword({email, password})`; throws on error (387-388).
  2. **Account-switch wipe**: if `__lk_last_uid__` exists and differs from the new uid, every key in `SYNC_KEYS` plus its `__lk_ts__` twin is removed from localStorage so the old account cannot upload into the new account's cloud (393-400).
  3. Writes `__lk_last_uid__` (401), `fetchSubscription` (402), `syncBidirectional()` (403), `hideOverlay`, `checkTrialWarning` (404-405), then `reloadIfPulled(pulled)` — a full page reload when the merge pulled anything (410).
- **Error handling**: messages mapped in `_submitAuth`'s catch — "not confirmed" → confirm screen; "invalid login"/"invalid credentials" → "Incorrect email or password."; rate-limit → "Signup is temporarily limited…" (1063-1077). The button is restored and re-enabled only in the catch (1076).
- **Status**: WORKING.

### F-AUTH-004 Sign out
- **Location**: `413-418`.
- **Behavior**: `auth.signOut()`, clears `_session` and `_subscription`, calls `showOverlay()`.
- **Edge case**: **local data is NOT wiped on sign out** — only on a sign-in as a *different* uid (393-400). Signing out then browsing leaves the previous account's data in localStorage.
- **Status**: WORKING (with the caveat above).

### F-AUTH-005 Password change
- **Location**: `420-424` → `auth.updateUser({password:newPw})`. Exported as `LOCKED.changePassword` (1165). No current-password re-auth.
- **Status**: WORKING.

### F-AUTH-006 Password reset
- **Location**: `434-439` (`resetPassword`), `1096-1109` (`_forgotPassword`).
- **Behavior**: "Forgot password?" reads `#auth-email`; empty → inline error "Enter your email first." (1097-1103). Calls `auth.resetPasswordForEmail(email, { redirectTo: origin + pathname + "?reset=1" })` (434-437), then toast "Password reset email sent. Check your inbox."
- **Gap**: nothing in the app reads `?reset=1` — `rg '\?reset|reset=1'` finds only this line. The redirect lands on the app with a recovery session and no dedicated set-new-password screen. **UNVERIFIED** whether Supabase's implicit-session recovery makes this usable.
- **Status**: PARTIAL.

### F-AUTH-007 Resend confirmation
- **Location**: `1096-1108`? no — `1096` is `_resendConfirmation` at `1098-1108`: `auth.resend({type:"signup", email:_pendingEmail})`, success/failure toasts. Reached from the CHECK YOUR INBOX screen (`_buildConfirmScreen`, 924-955).
- **Status**: WORKING.

### F-AUTH-008 Session restore on load
- **Location**: `299-325`.
- **Behavior**:
  1. `auth.getSession()`; with a session: write `__lk_last_uid__`, `fetchSubscription`, flip `_ready` and drain `_readyCbs`, `hideOverlay`, `checkTrialWarning`, `syncBidirectional().then(reloadIfPulled)` (300-313).
  2. First boot of a new calendar day (`__lk_last_sync_date__` !== today) triggers a second `syncBidirectional` (314-319).
  3. Without a session: `_ready = true`, drain callbacks; if guest mode → `_setGuestSubscription()`; otherwise `showOverlay()` (320-324).
  4. `auth.onAuthStateChange` (282-297) mirrors this on every auth event: on session, clear the guest flag, `hideOverlay`, `fetchSubscription`; on none, clear `_subscription` and either set the guest subscription or show the overlay.
- **Status**: WORKING.

### F-AUTH-009 Guest / anonymous mode
- **Location**: `160-178` (`isGuestMode`, `enterGuestMode`), `330-341` (`_setGuestSubscription`), `856-886` (`_showGuestModal`), `887-890` (`_hideGuestModal`).
- **User action**: SIGN IN tab → "Continue without account" → modal → CONTINUE AS GUEST.
- **Behavior**:
  1. `isGuestMode()` = no session AND `localStorage.lk_guestMode === "1"` (161-163).
  2. `enterGuestMode()` sets the flag, seeds `lk_profile` = `{displayName:"Athlete", username:"athlete", useKg:true, createdAt:<locale date>}` if absent (so onboarding is skipped), then **reloads the page** (165-178).
  3. The disclosure modal states data is device-only with no cloud backup and offers CREATE ACCOUNT as the alternative (866-884).
  4. `_setGuestSubscription()` sets `_subscription = {status:"guest", isPro:true}` and clears `LOCKED.usage`/`limits` (331-340). **Guests get full Pro access** — `can()` returns `true` immediately for guests (357).
  5. `forceSyncNow()` silently no-ops for guests (600).
  6. Upgrade path: `LOCKED.upgradeFromGuest` opens the signup screen (1154); `onAuthStateChange` removes `lk_guestMode` when a session appears so the normal merge uploads local data (287-292).
- **Status**: WORKING.
- **Security**: writing `lk_guestMode="1"` in devtools grants `isPro:true` locally — see Security findings.

### F-AUTH-010 Supabase `profiles` table read (App root)
- **Location**: `57222-57251`.
- **Behavior (as written)**:
  1. Runs once on mount, and only when the local profile is missing `displayName` or `username` (57223).
  2. `window.LOCKED._client.auth.getSession()` → `window.LOCKED._client.from("profiles").select("*").eq("user_id", user.id).single()` (57225, 57229).
  3. On a row, it *merges* (never replaces): `displayName` from `local.displayName || r.data.display_name || r.data.displayName || user_metadata.displayName || "Athlete"`; `username` from `local.username || r.data.username || meta.username || email.split("@")[0] || "user"`; `useKg` only when `typeof r.data.use_kg === "boolean"` (a missing/null column keeps the local unit — the comment at 57235-57238 records that the old default-to-kg silently switched units mid-workout); `createdAt` from `local.createdAt || r.data.created_at` (57240-57247). Then `sd("profile", …)`, `setProfileRaw`, `setUseKgRaw`.
- **Columns referenced**: `user_id`, `display_name`, `displayName`, `username`, `use_kg`, `created_at`.
- **Status**: **DEAD CODE.** `window.LOCKED` (1141-1201) does **not** export `_client` — `rg '_client'` returns only 153, 1003, 1102, 57225, 57229. `window.LOCKED._client.auth` therefore throws `TypeError`, caught by the outer `try` at 57224/57250, silently. This is the only `.from(...)` call in the entire file (`rg '\.from\("'` → one hit).
- **Evidence for status**: absence of `_client` in the export object literal 1141-1201; single-hit grep.
- **Notes**: a redesign either exports the client or drops the path. Also note the outer guard means it never runs for a complete profile anyway.

### F-AUTH-011 Auth overlay UI
- **Location**: `773-855` (`_buildAuthScreen`), `716-772` (`showOverlay`/`hideOverlay`/`buildOverlay`/`_overlayContent`), `891-955` (`_buildConfirmScreen`).
- **Behavior**: a pre-React, string-HTML overlay at z-99999 that hides `#root` while shown (738-740). Three modes driven by `_authMode`: `login`, `signup`, `confirm` (`_setAuthMode`, 960-964). Includes a LOCKED wordmark, SIGN IN/SIGN UP pill switcher wired to `window.LOCKED._setAuthMode`, an inline `#auth-error` region, email + password inputs (16px font to avoid iOS zoom), a password eye toggle (`_togglePw`, 966-973), the signup-only live requirement checklist, "Forgot password?" (login only), the submit button with a three-dot pulse loading state (1044? — 986-993), a signup-only "14-day free trial · No credit card required" note (846-848), and the guest entry button (login only, 851-855).
- **Accessibility gap**: overlay is built from raw HTML strings with inline `onclick` handlers; no focus trap, no `role="dialog"`, no labels beyond visual `<label>` text without `for`/`id` pairing (`<label>` at 811 has no `for`).
- **Status**: WORKING.

### F-AUTH-012 `getToken` / `headers` / `authHeaders`
- **Location**: `441-446` (`getToken`), `448-453` (`headers`), `2652-2662` (`authHeaders`).
- **Behavior**: `getToken()` awaits `auth.getSession()` and returns `session.access_token` or `null` (442-445). `headers(extra)` builds `{Content-Type: application/json}` plus `Authorization: Bearer <token>` when a token exists, merged with `extra` (449-452). `authHeaders(extra)` is the React-side synchronous twin reading `window.LOCKED.session.access_token` inside a try/catch (2652-2662) — it does **not** await a refresh, so an expired-in-memory session yields an unauthenticated request.
- **Called by**: `fetchSubscription` (343-355 builds its own header), `deleteAccount` (426), `syncBidirectional` (479), `setCycleSync` cloud-clear (1189), `aiCall` (2666), and every worker-calling screen.
- **Status**: WORKING.

### F-AUTH-013 Account deletion
- **Location**: `426-432`.
- **Behavior**: `DELETE {WORKER_URL}/user/delete` with auth headers; throws `data.error || "Delete failed"` on non-OK; then `signOut()`.
- **Edge case**: local data is **not** cleared after deletion — only `signOut()` runs (431).
- **Status**: WORKING client-side; server behavior UNVERIFIED.

### F-AUTH-014 Toast
- **Location**: `1111-1139`. Fixed above the nav (`--lk-nav-h + 12px`), green `#178841` / red `#B91C1C`, `role="status"` for assistive tech (1132), auto-dismiss after 3500 ms with a 300 ms fade.
- **Status**: WORKING. Exported as `LOCKED.toast` (1199).

---

### F-SYNC-001 Bidirectional cloud sync
- **Location**: `455-583` (`syncBidirectional`), `585-593` (`reloadIfPulled`), `595-610` (`forceSyncNow`).
- **Triggers**: page load with a session (312); a second time on the first boot of a new day (314-319); after sign-in (403); every **120 s** via `setInterval` (612-616); on `visibilitychange → visible` (618-626) — described in-code as the primary cross-device trigger; after `saveWorkout` (57460, broken); when cycle sync is enabled (1186); manually via `LOCKED.forceSync` / `syncToCloud` / `restoreCloud` (1159-1161).
- **Behavior**:
  1. Re-entrancy guard on `_syncState === "syncing"`; no session → state `"signedout"` and return (466-467).
  2. **Active-workout guard**: if `lk_activeWorkout` exists AND its `__lk_ts__` is missing or younger than 12 h, state `"paused"` and return (479-483). The comment at 469-478 records the prior bug: testing the key alone let one abandoned workout stop an account syncing indefinitely while the badge still reported the last success.
  3. **Pull**: `GET {WORKER_URL}/user/data` with auth headers → `json().data` (487-490).
  4. **Merge**, per key in `SYNC_KEYS`: compare `cloud[k].updatedAt` against `__lk_ts__<k>`. Cloud newer → write the value with the *native* setItem so the cloud timestamp is preserved (bypassing the timestamping patch) and increment `pulled`; else if local data exists → queue for upload (493-513). **Ties go to local** (`localTs >= cloudTs` uploads).
  5. **Push**: `lk_progressPhotos` is split out and sent last in its own best-effort request (521-523, 556-563). The rest is sorted smallest-first and chunked under **18 keys / 450 KB** per request — the code states the worker enforces 20 keys and 512 KB (515-536, UNVERIFIED). A key larger than 450 KB is skipped and recorded in `failedKeys`. Each chunk `POST {WORKER_URL}/user/sync` with body `{data:{key:value,…}}`; a failed chunk adds its keys to `failedKeys` and the loop continues (537-555).
  6. **Record**: `__lk_last_sync__` = now; state `"error"` if any key failed, else `"synced"`; returns `pulled` (566-576).
  7. On throw: state `"error"`, re-thrown so manual callers can surface it (578-582).
- **`reloadIfPulled(pulled)`**: full `location.reload()` when `pulled > 0` and no active workout — because React state was initialized from localStorage at mount and is now stale (585-592). Cannot loop, since after a pull local timestamps equal cloud timestamps.
- **`forceSyncNow()`**: guest no-op; throws "Not signed in"; temporarily blanks `lk_activeWorkout` to bypass the guard and restores it in `finally` (595-610).
- **Offline behavior**: no queue, no retry, no backoff — a failed sync just sets `"error"` and waits for the next trigger.
- **Status**: WORKING (server contract UNVERIFIED).

### F-SYNC-002 The sync key set & write timestamping
- **Location**: `183-231` (`SYNC_KEYS`), `233-238` (`MC_SYNC_KEYS`/flag), `240-241` (`_syncKeySet`), `245-254` (localStorage patch), `256-278`? (see below).
- **Behavior**:
  1. `SYNC_KEYS` is a hand-maintained list of **73** `lk_*` keys grouped as training, profile & body, nutrition & shopping, goals/cycles/feedback/supplements, coach, settings (183-231). Transient per-device keys (`activeWorkout*`, beta logs, `lastSync`) are deliberately excluded (180-182).
  2. `window.localStorage.setItem` is **monkey-patched** (247-254): the native method is captured once as `_origSetItem`/`_origGetItem` (245-246), and any write to a sync key also writes `__lk_ts__<key>` = ISO now. This is how sync knows when local data changed without touching app code.
  3. `_lastSyncAt` restored from `__lk_last_sync__` (257).
  4. **Timestamp seeding migration** (`seedExistingTimestamps`, 259-278? — 264-278): guarded by `__lk_ts_migrated_v2__`; stamps every sync key that has data but no timestamp so pre-existing data counts as locally-current and uploads on the first merge rather than being overwritten by an empty cloud.
- **Status**: WORKING.
- **Risk**: patching a global built-in is fragile; any code holding a reference to the original `setItem` (e.g. `_origSetItem`) bypasses timestamping — which `syncBidirectional` relies on deliberately (505-508).

### F-SYNC-003 Cycle-tracking opt-in sync
- **Location**: `233-238`, `1170-1198`.
- **Behavior**: `lk_mcProfile` and `lk_mcDays` are device-local unless `lk_mcCloudSync === "1"`, which is checked at module load and appends them to `SYNC_KEYS` (233-238). `LOCKED.setCycleSync(true)` sets the flag, appends the keys, stamps existing local data, and kicks a sync (1173-1186). `setCycleSync(false)` removes the flag and the keys from the set, deletes their `__lk_ts__` entries, and best-effort `POST /user/sync` with `{lk_mcProfile:null, lk_mcDays:null}` to clear the cloud copy while leaving local data intact (1187-1197). `LOCKED.cycleSyncEnabled` is a getter over the flag (1170).
- **Status**: WORKING (cloud-side null semantics UNVERIFIED).

### F-SYNC-004 Beta data sync (`/beta-sync`) — separate, legacy channel
- **Location**: `2794` (`SYNC_URL`), `2800-2832` (`syncBetaData`), `2833-2846` (midnight scheduler), `33556` (manual trigger in Settings).
- **Behavior**:
  1. `SYNC_URL = https://lockedapi.cescocugliari.workers.dev/beta-sync` (2794).
  2. `syncBetaData(onDone, onFail)` aborts with "No beta ID" if `lk_betaId` is empty (2801-2805).
  3. Payload: `{ betaId, data: { activity: lk_betaLog, aiLogs: lk_betaAILog, feedback, weightLog, workouts: lk_history, cycles, cycleLog, coachInstructions, goals, bfLog, coachPlan } }` (2806-2822).
  4. **Headers are `Content-Type: application/json` only — no `Authorization`** (2814-2817). The only identifier is the beta code string.
  5. On `d.ok`: `sd("lastSync", ISO)` and `onDone()`; else `onFail(d.error || "Sync failed")`; network errors → `onFail(e.message)` (2823-2831).
  6. A `setInterval` every 60 s (guarded on `lk_betaStatus`) fires `syncBetaData()` once when the clock reads exactly 00:00 and `lk_lastSync` is not today (2833-2846).
- **Status**: WORKING client-side; unauthenticated — see Security findings. Server behavior UNVERIFIED.
- **Notes**: this is a *one-way upload* and entirely separate from F-SYNC-001. Nothing is pulled back.

### F-SYNC-005 Deploy-version check / cache bust
- **Location**: `78-96` (`checkDeployVersion`).
- **Behavior**: fetches `{WORKER}/app-version` with `cache:"no-store"`, compares to `lk_deployVersion` in localStorage, and busts the service-worker cache + hard-reloads on a mismatch (78-86 read; rest of the IIFE beyond the chunk read — **UNVERIFIED in detail**, confirm by reading 86-125).
- **Status**: UNVERIFIED (partial read).

---

### F-PAY-001 The paywall sheet
- **Location**: `655-847`? — `showPaywall` at `655-843`, `_paywallCard` at `845-855`? (precisely: `showPaywall` 655-840, `_paywallCard` 842-853).
- **User action**: `window.LOCKED.paywall()`.
- **Behavior**:
  1. If `#locked-paywall` exists it is re-shown (`display:flex`) rather than rebuilt (656-657).
  2. A z-10000 full-screen scrim (`rgba(0,0,0,0.72)`, 8px backdrop blur) with a bottom sheet that slides up via a `requestAnimationFrame` transform (659-668, 834-839). Tapping the scrim hides it (829-831).
  3. Content: a "PRO FEATURE" pill, "UNLOCK LOCKED PRO" headline, subcopy, a 2-column feature grid of six `_paywallCard(title, desc)` entries, two pricing cards, and the CTA block.
  4. Feature cards (698-705): "Unlimited AI Coach / No daily coaching limits"; "Meal Analysis / USDA-accurate nutrition"; "Split Builder / Unlimited AI programs"; "Coach Instructions / Fully personalise your AI"; "Budget Tracking / Grocery & cost analytics"; "Weight Selector / AI-assisted load picking".
  5. Pricing: **MONTHLY $6.99/month**; **ANNUAL $60/year** with a "SAVE 28%" badge (708-728).
  6. CTA is **not purchasable**: "Available on the App Store Soon — In-app purchase launches with the iOS app. Keep training — your trial data is saved." (731-742), plus a "Continue with free access" button that merely hides the sheet (743-748).
- **Status**: WORKING as a display; **no purchase flow exists anywhere** (no Stripe, no StoreKit, no checkout URL in the file).
- **Accessibility**: no `role="dialog"`, no focus trap, no Escape handler; the only close affordances are the scrim tap and the text button.
- **Notes**: `_paywallCard` is a pure string-template helper (842-853).

### F-PAY-002 Entitlement fetch & the `can()` gate
- **Location**: `343-355` (`fetchSubscription`), `357-372` (`can`), `374-376` (`_LOCKED_usage`).
- **Behavior**:
  1. `fetchSubscription(userId)` — note `userId` is accepted but unused; the call is `GET {WORKER_URL}/user/check` with only `Authorization: Bearer <token>` (344-347). Non-OK returns silently (348).
  2. Response shape consumed: `{ subscription, usage, limits }` → `window.LOCKED.subscription`, `.usage`, `.limits` (349-353). Errors are console-warned only (354).
  3. `can(feature)`: guests → `true` (358); no subscription → `false` (359); `isPro` → `true` (360); otherwise a literal gate map (361-370):
     - `coach_chat`: `usage.coachChatsToday < 10`
     - `meal_analysis`: `usage.mealAnalisesToday < 5` (note the typo `mealAnalises`)
     - `split_builder`: `usage.splitsThisMonth < 1`
     - `instructions`: `false`
     - `budgeting`: `false`
     - `select_weight`: `false`
     - unknown feature → `false` (371).
  4. `_LOCKED_usage(field)` reads `window.LOCKED.usage[field] || 0` (374-376).
- **Status**: **DEAD CODE.** `LOCKED.can` is exported (1157) but **never called anywhere in the file** — `rg 'LOCKED\.can\(|\.can\("'` returns zero hits. `window.LOCKED.isPro` (1148) likewise has no call sites. `_subscription.isPro` is read only inside the module (360, 1148).
- **Evidence for status**: zero-hit grep for `.can(`; only hits for `isPro` are 333, 360, 1148.

### F-PAY-003 Actual runtime gating — server-side 429 / `gated`
- **Location**: `2679-2686` (`aiCall` gated branch), `50075` and `50088-50098` (coach chat 429), `51374-51384` (the paywall CTA).
- **Behavior**:
  1. Enforcement happens **on the worker**. `aiCall` inspects `d.gated` on the JSON response and, when true, toasts `d.content[0].text` or "Daily limit reached. Upgrade to Pro for unlimited access." and calls `onFail` (2681-2686).
  2. The coach chat maps HTTP `429` to `{kind:"limit"}` (50075) and renders the message "You've used your 10 free chats today. Resets at midnight." (50088) with an action button labelled "See plans" that calls `window.LOCKED.paywall()` (51376, 51384).
  3. This is the **only** place in the app that opens the paywall besides the trial banner's UPGRADE TO PRO button (648).
- **Status**: WORKING. Server limits UNVERIFIED (no worker source).

### F-PAY-004 Trial banner
- **Location**: `628-653` (`checkTrialWarning`).
- **Behavior**: only when `_subscription.status === "trial"` and `daysLeft <= 4` (629-630); idempotent via `#locked-trial-banner` (631-632). Renders a fixed top banner in `--color-accent-deep` reading "Trial ends in N day(s)" or "Your trial has expired" when `daysLeft <= 0` (644-646), with an "UPGRADE TO PRO" button calling `LOCKED.paywall()` and a 44×44 "×" dismiss button (648-651). Prepended to `document.body` (652). Called after session restore (309), after sign-in (405), and after signup (1057).
- **Status**: WORKING. Trial length (14 days per the copy at 847 and 1058) and `daysLeft` originate on the server — UNVERIFIED.

---

### F-BETA-001 Beta code system
- **Location**: `2698` (`DEFAULT_BETA_CODES`), `2699-2721` (`initBetaCodes`), `2723-2728` (`validateBetaCode`), `2729-2756` (`validateBetaCodeRemote`), `2757-2771` (`claimBetaCode`).
- **Behavior**:
  1. `DEFAULT_BETA_CODES = ["JOSHBETA","SUMMERBETA","ROMANBETA","CESCOBETA","PUBLICBETA","OLIBETA","KENDALLBETA"]` — **7 codes, hardcoded in the client** (2698).
  2. `initBetaCodes()` runs immediately at 2722; it merges any missing default into `lk_betaCodes` as `{code, active:true, usedBy:null}`.
  3. `validateBetaCode(code)` — local only: uppercase-trims and returns true if the code exists, is `active`, and has no `usedBy` (2723-2728).
  4. `validateBetaCodeRemote(code, onResult)` — local check first, then `POST /beta-validate` with `{code}` and **no auth header** (2731-2744). `!d.valid` → "Invalid code"; `d.locked` → "This code is no longer available"; else success. **On any network failure it calls `onResult(true, null)` — fail-open** (2754).
  5. `claimBetaCode(code, userId)` marks the local entry `usedBy`/`claimedAt` and writes `lk_betaStatus = true`, `lk_betaCode`, `lk_betaId` = lowercase code (2757-2771). The `userId` passed in is the *username string*, not a Supabase uid (33490, 34315).
- **Entry points**: Settings (33420 validate, 33490 claim) and onboarding (34110 validate, 34315 claim).
- **Status**: WORKING; security-relevant (see findings).

### F-BETA-002 Silent beta
- **Location**: `2795-2799`.
- **Behavior**: `SILENT_BETA_IDS = ["summerbeta"]`; `isSilentBeta()` lowercases `lk_betaId` and tests membership. Used at 33512 to hide the beta UI section in Settings while beta logging still runs.
- **Status**: WORKING.

### F-BETA-003 Activity & AI logging
- **Location**: `2772-2783` (`logBetaActivity`), `2784-2793` (`logBetaAI`).
- **Behavior**: both no-op unless `lk_betaStatus` is true. `logBetaActivity(action, data)` appends `{ts, action, data, betaId}` to `lk_betaLog`; `logBetaAI(input, output)` appends `{ts, input, output, betaId}` to `lk_betaAILog` (called from `aiCall` at 2687). Both arrays are **unbounded** and both are uploaded by `syncBetaData`.
- **Call sites**: 30+ across the app — workout_saved (57441), progress_photo (2872), weight_log (2930), form_video_opened (7360), goal_*/bf_logged (27138-27182), physique_focus_added (30616), refeed_* (37029-37036), shopping_list_exported (42575), restock/staple (43530-43596), supplement_* (46201-46369), compound_taken (47351-47471), cycle_* (47582-47602), persona_changed (49576), coach_* (49963-50512).
- **Status**: WORKING.
- **Privacy risk**: `logBetaAI` stores full prompt and response text, and `syncBetaData` uploads it unauthenticated.

### F-BETA-004 Beta admin panel
- **Location**: component at `52806`, route at `57709-57711` (`screen === "betaAdmin"`, mapped to the `profile` tab in `Nav`, 57958). Not read in detail — outside this agent's exclusive range; **UNVERIFIED**, owned by whichever agent covers 52806.

---

### F-STOR-001 Storage layer (`ld` / `sd` / `lkStorageUsage`)
- **Location**: `2409-2413` (`storageAvailable` probe), `2414-2423` (`ld`), `2425-2432` (`lkIsQuotaError`), `2433-2452` (`sd`), `2453-2469` (`lkStorageUsage`).
- **Behavior**:
  1. `storageAvailable` is probed once by writing and removing `test` (2409-2413).
  2. `ld(k, fb)` → `JSON.parse(localStorage.getItem("lk_" + k))`, returning `fb` on absence, parse failure, or unavailable storage (2414-2423). **The `lk_` prefix is added here**, which is why `SYNC_KEYS` lists prefixed names and app code does not.
  3. `sd(k, v)` → `localStorage.setItem("lk_" + k, JSON.stringify(v))`, **returns boolean success** (2433-2445).
  4. **Quota handling**: `lkIsQuotaError` recognises `QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, code 22, code 1014 (2426-2429). On the first quota failure only (`_lkQuotaWarned`), it toasts "Storage is full - changes are not being saved. Free space by deleting progress photos." and dispatches a `lockedStorageFull` CustomEvent carrying the key (2437-2448). Non-quota failures are swallowed and return `false`.
  5. `lkStorageUsage()` walks every localStorage key summing `(key.length + value.length) * 2` bytes, isolating `lk_progressPhotos`, and returns `{totalBytes, photoBytes, budgetBytes: 5*1024*1024}` (2453-2469).
- **Callers that check the return value**: `saveProgressPhoto` rolls back to the previous photo list and returns `null` when `sd` fails (2860-2871). Most call sites ignore it.
- **Status**: WORKING.

### F-STOR-002 Schema migrations
- **Location**: `migratePrDates` 2349-2387 (scheduled at 2388 `setTimeout(…, 0)`), `migrateSuppReminders` 2393-2406 (scheduled 2407), plus `seedExistingTimestamps` (F-SYNC-002) and the flags `lk_weightsKgMigrated`, `lk_cardioMigrated`, `lk_unitConversion` listed in `SYNC_KEYS` (222-224) whose owning code is outside this scope.
- **Behavior**:
  1. `migratePrDates()` — guarded by `lk_prDatesFixed`. Deliberately deferred to a macrotask because it needs the exercise catalogue and the storage probe, both initialised further down the file (2345-2348). For each PR record whose `date` is not `YYYY-MM-DD`, it scans workout history sorted ascending for the earliest session containing that exercise with matching reps and weight within 0.51 (2360-2381), and writes the found day. Unmatched records keep their original text and are simply omitted from the calendar — "an honest gap rather than an invented date" (2338-2343). Sets the flag either way.
  2. `migrateSuppReminders()` — guarded by `lk_reminderMigrated`. Every supplement with `reminder === false` is reset to `true`, because the toggle was inert before the reminder engine shipped so a stored `false` is a meaningless editor default, not an opt-out (2390-2406).
  3. Both wrapped in bare `try/catch {}` — a migration failure is invisible.
- **Status**: WORKING.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| (auth IIFE) | IIFE | 130-1216 | Whole pre-React auth/sync/paywall module | — | init | F-AUTH-001 |
| isGuestMode | fn | 161-163 | True when no session and `lk_guestMode==="1"` | onAuthStateChange, getSession, can, forceSyncNow, LOCKED.isGuest | — | F-AUTH-009 |
| enterGuestMode | fn | 165-178 | Set guest flag, seed profile, reload | LOCKED.enterGuest (modal) | location.reload | F-AUTH-009 |
| seedExistingTimestamps | IIFE | 264-278 | One-time `__lk_ts__` backfill for sync keys | module load | _origGetItem/_origSetItem | F-SYNC-002 |
| _setSyncState | fn | 280-282 | Set `_syncState` | syncBidirectional | — | F-SYNC-001 |
| init | fn | 267-326 | Create Supabase client, wire auth listeners, first sync | DOMContentLoaded / immediate | createClient, onAuthStateChange, getSession, fetchSubscription, syncBidirectional, checkTrialWarning, showOverlay, hideOverlay | F-AUTH-001, F-AUTH-008 |
| _setGuestSubscription | fn | 331-340 | Grant guests `{status:"guest", isPro:true}` | onAuthStateChange, getSession | — | F-AUTH-009 |
| fetchSubscription | async fn | 343-355 | `GET /user/check` → subscription/usage/limits | init, signIn, _submitAuth | getToken, fetch | F-PAY-002 |
| can | fn | 357-372 | Client entitlement check (DEAD — no callers) | none | isGuestMode, _LOCKED_usage | F-PAY-002 |
| _LOCKED_usage | fn | 374-376 | Read a usage counter with 0 default | can | — | F-PAY-002 |
| signUp | async fn | 380-384 | Bare `auth.signUp` | LOCKED.signUp (unused by UI) | auth.signUp | F-AUTH-002 |
| signIn | async fn | 386-411 | Sign in, wipe on uid change, merge, reload | _submitAuth, LOCKED.signIn | signInWithPassword, fetchSubscription, syncBidirectional, hideOverlay, checkTrialWarning, reloadIfPulled | F-AUTH-003 |
| signOut | async fn | 413-418 | Sign out and show the overlay | deleteAccount, LOCKED.signOut | auth.signOut, showOverlay | F-AUTH-004 |
| changePassword | async fn | 420-424 | `auth.updateUser({password})` | LOCKED.changePassword | auth.updateUser | F-AUTH-005 |
| deleteAccount | async fn | 426-432 | `DELETE /user/delete` then sign out | LOCKED.deleteAccount | headers, fetch, signOut | F-AUTH-013 |
| resetPassword | async fn | 434-439 | `resetPasswordForEmail` with `?reset=1` redirect | _forgotPassword | auth.resetPasswordForEmail | F-AUTH-006 |
| getToken | async fn | 441-446 | Return `session.access_token` | fetchSubscription, headers | auth.getSession | F-AUTH-012 |
| headers | async fn | 448-453 | JSON + `Authorization: Bearer` header object | deleteAccount, syncBidirectional, setCycleSync, LOCKED.headers | getToken | F-AUTH-012 |
| syncBidirectional | async fn | 465-583 | Full timestamp-merge sync with the worker | init, signIn, interval, visibilitychange, forceSyncNow, setCycleSync, saveWorkout(broken) | headers, fetch, _setSyncState | F-SYNC-001 |
| reloadIfPulled | fn | 585-592 | Reload once when cloud data was pulled | init, signIn, visibilitychange | location.reload | F-SYNC-001 |
| forceSyncNow | async fn | 595-610 | Manual sync bypassing the workout guard | LOCKED.forceSync | isGuestMode, syncBidirectional | F-SYNC-001 |
| (periodic sync) | setInterval | 612-616 | Sync every 120 s when signed in | — | syncBidirectional | F-SYNC-001 |
| (visibility sync) | listener | 618-626 | Sync on foreground | — | syncBidirectional, reloadIfPulled | F-SYNC-001 |
| checkTrialWarning | fn | 628-653 | Top trial banner at ≤4 days left | init, signIn, _submitAuth | LOCKED.paywall (inline) | F-PAY-004 |
| showPaywall | fn | 655-840 | Build/show the Pro upsell sheet | LOCKED.paywall (coach limit 51376, banner 648) | _paywallCard | F-PAY-001 |
| _paywallCard | fn | 842-853 | One feature card's HTML string | showPaywall (×6) | — | F-PAY-001 |
| showOverlay | fn | 716-720 | Show or build the auth overlay | init, onAuthStateChange, signOut, upgradeFromGuest | buildOverlay | F-AUTH-011 |
| hideOverlay | fn | 722-731 | Fade out the overlay and restore `#root` | init, onAuthStateChange, signIn, _submitAuth | — | F-AUTH-011 |
| buildOverlay | fn | 733-753 | Create the overlay DOM, hide `#root` | showOverlay | _buildAuthScreen | F-AUTH-011 |
| _overlayContent | fn | 755-762 | Swap overlay inner HTML | _setAuthMode | — | F-AUTH-011 |
| _buildAuthScreen | fn | 773-855 | Login/signup screen HTML | buildOverlay, _setAuthMode | _buildConfirmScreen | F-AUTH-011 |
| _showGuestModal | fn | 857-885 | Guest disclosure modal | overlay button, LOCKED._showGuestModal | — | F-AUTH-009 |
| _hideGuestModal | fn | 887-890 | Remove the guest modal | modal buttons | — | F-AUTH-009 |
| _buildConfirmScreen | fn | 892-955 | "CHECK YOUR INBOX" screen HTML | _buildAuthScreen | — | F-AUTH-007 |
| _setAuthMode | fn | 960-964 | Switch login/signup/confirm | overlay buttons, _submitAuth | _buildAuthScreen, _overlayContent | F-AUTH-011 |
| _togglePw | fn | 966-973 | Password visibility toggle | eye button | — | F-AUTH-011 |
| _submitAuth | async fn | 975-1077 | Validate, sign up or in, map every error | submit button, Enter key | signIn, auth.signUp, fetchSubscription, hideOverlay, checkTrialWarning, showToast, _setAuthMode | F-AUTH-002, F-AUTH-003 |
| _validatePw | fn | 1079-1094 | Live password-requirement checklist | password `oninput` | — | F-AUTH-002 |
| _resendConfirmation | async fn | 1096-1108 | `auth.resend({type:"signup"})` | confirm screen button | showToast | F-AUTH-007 |
| _forgotPassword | async fn | 1110-1122? (1096-1109 region) | Send a reset email for the typed address | "Forgot password?" | resetPassword, showToast | F-AUTH-006 |
| showToast | fn | 1111-1139 | Global toast with `role="status"` | _submitAuth, _resendConfirmation, _forgotPassword, sd, aiCall, LOCKED.toast | — | F-AUTH-014 |
| window.LOCKED (object) | export | 1141-1201 | Public surface: getters + methods | whole app | — | all |
| LOCKED.onReady | fn | 1166-1168 | Run a callback once auth is resolved | app code | — | F-AUTH-008 |
| LOCKED.setCycleSync | fn | 1171-1198 | Toggle opt-in cycle-data cloud sync | Cycle Settings | headers, fetch, syncBidirectional | F-SYNC-003 |
| checkDeployVersion | IIFE | 82-~125 | Compare `/app-version` to `lk_deployVersion`, bust cache | module load | fetch | F-SYNC-005 |
| ErrorBoundary | class | 2540-2651 | Top-level crash screen with a Reload button | mount 58008 | — | F-ROOT-009 |
| ScreenBoundary | class | 2601-2650 | Per-screen crash isolation | renderTab 57734 | — | F-ROOT-002 |
| authHeaders | fn | 2652-2662 | Sync `Bearer` headers from `LOCKED.session` | aiCall and every worker caller | — | F-AUTH-012 |
| aiCall | fn | 2663-2696 | POST to the worker root, handle `d.gated` | AI features app-wide | authHeaders, LOCKED.toast, logBetaAI | F-PAY-003 |
| initBetaCodes | fn | 2699-2721 | Seed `lk_betaCodes` from the defaults | 2722 (module load) | ld, sd | F-BETA-001 |
| validateBetaCode | fn | 2723-2728 | Local code validity check | validateBetaCodeRemote | ld | F-BETA-001 |
| validateBetaCodeRemote | fn | 2729-2756 | Local check + `POST /beta-validate` (fail-open) | 33420, 34110 | validateBetaCode, fetch | F-BETA-001 |
| claimBetaCode | fn | 2757-2771 | Mark used, set betaStatus/betaCode/betaId | 33490, 34315 | ld, sd | F-BETA-001 |
| logBetaActivity | fn | 2772-2783 | Append an action to `lk_betaLog` | 30+ sites incl. saveWorkout 57441 | ld, sd | F-BETA-003 |
| logBetaAI | fn | 2784-2793 | Append prompt/response to `lk_betaAILog` | aiCall 2687 | ld, sd | F-BETA-003 |
| isSilentBeta | fn | 2796-2799 | True for `summerbeta` | 33512 | ld | F-BETA-002 |
| syncBetaData | fn | 2800-2832 | Unauthenticated upload of beta+user data | 2851 scheduler, 33556 Settings | ld, sd, fetch | F-SYNC-004 |
| (beta midnight sync) | IIFE+interval | 2833-2846 | Fire `syncBetaData` once at 00:00 | module load | ld, isoDay, syncBetaData | F-SYNC-004 |
| ld | fn | 2414-2423 | Read+parse `lk_<k>` with fallback | everything | — | F-STOR-001 |
| lkIsQuotaError | fn | 2426-2432 | Recognise quota-exceeded errors | sd | — | F-STOR-001 |
| sd | fn | 2433-2452 | Write `lk_<k>`, toast+event on quota, return bool | everything | lkIsQuotaError, LOCKED.toast | F-STOR-001 |
| lkStorageUsage | fn | 2453-2469 | Bytes used total / by photos / budget | Settings | — | F-STOR-001 |
| migratePrDates | fn | 2349-2387 | Recover real PR dates from history | 2388 setTimeout | ld, sd, dayOf, getEx | F-STOR-002 |
| migrateSuppReminders | fn | 2393-2406 | Reset inert `reminder:false` to true | 2407 setTimeout | ld, sd | F-STOR-002 |
| Nav | React.memo | 7652-7758 | 5-tab bottom bar, publishes `--lk-nav-h` | App 57957 | p.go | F-ROOT-003 |
| App | component | 57186-58006 | Root component, all global state and routing | mount 58008 | everything below | F-ROOT-001..010 |
| setWorkout | fn | 57254-57261 | Set + persist the active workout | App | sd | F-ROOT-007 |
| setSplits | fn | 57281-57287 | Set + persist splits | App, children | sd | F-ROOT-001 |
| setPrs | fn | 57288-57294 | Set + persist PRs | App, children | sd | F-ROOT-001 |
| setHistory | fn | 57295-57301 | Set + persist workout history | App, children | sd | F-ROOT-001 |
| addCustom | fn | 57302-57324 | Add a custom exercise, invalidate the name index | screens | sd | F-ROOT-001 |
| toggleUnit | fn | 57325-57337 | Flip kg/lb and persist to profile | Profile, Settings, WorkoutLog | sd | F-ROOT-001 |
| updateProfile | fn | 57338-57346 | Merge updates into profile and persist | Settings, Coach | sd | F-ROOT-001 |
| completeOnboarding | fn | 57347-57404 | Persist profile, normalise the AI program | Onboarding | sd, setSplits, setScreen | F-ROOT-008 |
| startWorkout | fn | 57405-57415 | Begin/restore a session, route to workout or review | TrainHub | ld, setWorkout | F-ROOT-007 |
| finishWorkout | fn | 57416-57422 | Persist rows/sec, route to review | WorkoutLog | sd | F-ROOT-007 |
| saveWorkout | fn | 57423-57461 | Commit a session to history, clear active keys, sync | Review | setHistory, logBetaActivity, sd, syncBidirectional(broken) | F-ROOT-007 |
| go | fn | 57531-57552 | Navigate, maintain the nav stack + history | Nav, every screen | pushState, setScreen | F-ROOT-002 |
| renderTab | fn | 57589-57736 | Map `screen` to a screen component | App render | React.createElement | F-ROOT-002 |
| (profiles effect) | useEffect | 57222-57251 | Backfill the profile from Supabase (DEAD) | App mount | LOCKED._client (undefined) | F-AUTH-010 |
| (rest mirror effect) | useEffect | 57444-57450 | Mirror the rest timer via `lockedRest` | App | — | F-ROOT-004 |
| (history reread effect) | useEffect | 57457-57464? (57456-57464) | Re-read history on `lockedHistoryUpdate` (voice writes) | App | ld, withWorkoutIds | F-ROOT-001 |
| (deep-link effect) | useEffect | 57466-57500 | `?open=` and `lockedPushOpen` routing | App | setScreen | F-ROOT-006 |
| (popstate effect) | useEffect | 57519-57530 | Unwind the nav stack on back | App | setScreen | F-ROOT-002 |
| (banner height effect) | useEffect | 57566-57587 | Publish `--lk-top-off` | App | ResizeObserver | F-ROOT-004 |
| (visibility pause effect) | useEffect | 57268-57280 | Pause the workout when backgrounded | App | setWorkout | F-ROOT-007 |
| (mount) | try/catch | 58007-58011 | `createRoot(...).render(<ErrorBoundary><App/></ErrorBoundary>)` | — | ReactDOM | F-ROOT-009 |
| (CDN fallback) | setTimeout | 58012-58015 | Show a CDN error panel if React is absent after 3 s | — | — | F-ROOT-009 |

**Counts** — features: 30 (10 F-ROOT, 14 F-AUTH, 5 F-SYNC, 4 F-PAY, 4 F-BETA, 2 F-STOR; total entries 33 with sub-numbering). Functions indexed: **86**.

---

## Auth flows

**Sign up** (`_submitAuth("signup")`, 975-1058) — validate non-empty (981-986) → client password policy (1015-1026) → button enters a three-dot loading state and is disabled (988-994) → `auth.signUp` (1002) → branch on "already registered" (1004-1018), rate limit (1020-1038), no-session/confirmation-required (1041-1053), or success (1054-1058). Stored: `locked_session` in localStorage (277); `__lk_last_uid__` on the next `getSession` (301). Errors render into `#auth-error` and re-enable the button (1076).

**Sign in** (386-411, entered from `_submitAuth` 1060) — `signInWithPassword` → **if `__lk_last_uid__` differs, delete all 73 sync keys and their timestamps** (393-400) → store the uid → `fetchSubscription` → `syncBidirectional` → `hideOverlay` → `checkTrialWarning` → **reload if anything was pulled** (403-410). Errors mapped to human text at 1063-1075.

**Sign out** (413-418) — `auth.signOut`, null out `_session`/`_subscription`, `showOverlay()`. Nothing local is deleted.

**Password reset** (434-439, 1096-1109) — email required inline; `resetPasswordForEmail` with `redirectTo = origin + pathname + "?reset=1"`; success toast. No screen consumes `?reset=1` (grep: single occurrence) — PARTIAL.

**Email resend** (1098-1108) — `auth.resend({type:"signup", email:_pendingEmail})`; success/failure toasts. `_pendingEmail` is set only by the signup branches (1030, 1050, 1066).

**Session restore** (299-325 + 282-297) — `getSession` on init, mirrored by `onAuthStateChange`; drains `_readyCbs` for `LOCKED.onReady`; syncs immediately and again on the first boot of a new day.

**Guest mode** (161-178, 331-340, 857-885) — flag `lk_guestMode="1"`, a seeded `lk_profile`, a page reload, and a synthetic `{status:"guest", isPro:true}` subscription. No cloud sync at all (600). Upgrading clears the flag on the next session (287-292) so the local timestamps beat the empty cloud and everything uploads.

---

## THE PAYWALL

| Gated feature | Paywall card | Client check (`can`, 361-370) | Free-tier limit | Real enforcement | Entitlement source |
|---|---|---|---|---|---|
| AI coach chat | "Unlimited AI Coach / No daily coaching limits" (699) | `usage.coachChatsToday < 10` (362) | 10 chats/day, resets midnight (50088) | **Server**: HTTP 429 → `errKind:"limit"` → "See plans" opens the paywall (50075, 51376) | `GET /user/check` → `usage` (349-352) |
| Meal analysis | "Meal Analysis / USDA-accurate nutrition" (700) | `usage.mealAnalisesToday < 5` (363) | 5/day | Server via `d.gated` in `aiCall` (2681-2686) — UNVERIFIED for this endpoint | same |
| Split builder | "Split Builder / Unlimited AI programs" (701) | `usage.splitsThisMonth < 1` (364) | 1/month | Server `d.gated` (assumed) — UNVERIFIED | same |
| Coach instructions | "Coach Instructions / Fully personalise your AI" (702) | `false` (365) | **Pro only** | No client check found | same |
| Budget tracking | "Budget Tracking / Grocery & cost analytics" (703) | `false` (366) | **Pro only** | No client check found | same |
| Weight selector | "Weight Selector / AI-assisted load picking" (704) | `false` (367) | **Pro only** | No client check found | same |
| any unknown key | — | `undefined → false` (371) | denied | — | — |

**Pricing**: $6.99/month (711-715) or $60/year with "SAVE 28%" (717-727). **There is no purchase flow** — the CTA is "Available on the App Store Soon" (731-742). Trial: 14 days, no credit card (847, 1058); banner from ≤4 days left (628-653).

**Is gating client-side only?** No — and that is the important nuance. `can()` (357-372) is the only client-side gate and **it is never called** (`rg 'LOCKED\.can\('` → zero hits). All observed enforcement is **server-side** on the Cloudflare worker, surfaced as `d.gated` (2681) or HTTP 429 (50075). The client's role is limited to *displaying* the paywall. Two client-side weaknesses remain: (a) guests self-grant `isPro:true` by setting `lk_guestMode="1"` (161-163, 331-340) — but since nothing consults `isPro`, the practical impact depends entirely on whether the worker also honours some guest path, which is **UNVERIFIED**; (b) the beta claim path (F-BETA-001) is fully client-side. If the redesign ever moves gating into `can()`, it becomes trivially bypassable.

---

## Sync architecture

- **What syncs**: 73 `lk_*` keys enumerated in `SYNC_KEYS` (183-231) — training (history, workoutHistory, splits, prs, cardio, customEx, featuredLifts, perfTracking, exNotes), profile & body (profile, weightLog, bfLog, progressPhotos), nutrition & shopping (fuelLog, fuelProfile, mealPlans, myStores, myGroceries, pantryItems, shoppingList, usdaKey, budgetData), goals/cycles/feedback/supplements, coach (plan, instructions, memory, lastMsgs, lastHist, recipes), and settings (theme, homeLayout, restEnabled, hidePartials, voice, tutorialSeen, refeed, gamingLayer, migration flags, textScale, coachMemoryOn, coachDataPrefs). Plus `lk_mcProfile`/`lk_mcDays` only when opted in (233-238).
- **What does NOT sync**: `lk_activeWorkout*` and rest target, `lk_betaLog`, `lk_betaAILog`, `lk_betaCodes`, `lk_betaStatus`, `lk_betaId`, `lk_lastSync`, `lk_guestMode`, `lk_deployVersion`, `__lk_*` metadata, and — importantly — the `screen` you are on (not persisted at all). Explicitly documented as intentional at 180-182.
- **Triggers**: page load (312); new-day second pass (314-319); post-sign-in (403); every 120 s (612-616); every foreground `visibilitychange` (618-626, the primary cross-device trigger); after `saveWorkout` (57460, **broken**); on cycle-sync enable (1186); manual `forceSync` (595-610).
- **Endpoints** (the *account* sync, distinct from `/beta-sync`): `GET {WORKER_URL}/user/data` → `{data: {key: {value, updatedAt}}}` (488-490); `POST {WORKER_URL}/user/sync` body `{data: {key: value}}` (539-545, 557-562); `GET /user/check` (345); `DELETE /user/delete` (427).
- **`/beta-sync` payload** (2806-2822): `{betaId, data:{activity, aiLogs, feedback, weightLog, workouts, cycles, cycleLog, coachInstructions, goals, bfLog, coachPlan}}`. **Response**: `{ok: true}` or `{error}` (2823-2830). No auth header (2814-2817). One-way upload only.
- **Conflict handling**: last-write-wins per key by ISO timestamp; ties resolve to local (496-513). No field-level merge — a whole key's value is replaced. Two devices editing different exercises in the same `lk_history` on the same trip means one device's edits are lost.
- **Offline**: no queue, no retry, no exponential backoff. A failure sets `_syncState = "error"` and the next trigger tries again. `LOCKED.syncStatus` exposes `{state, lastSync}` (1162).
- **Limits**: uploads chunked at 18 keys / 450 KB against a stated worker cap of 20 keys / 512 KB (515-536, **UNVERIFIED**); any single key over 450 KB is permanently skipped and can never reach the cloud (528-532); `lk_progressPhotos` is uploaded last, best-effort, and its failure is swallowed (556-563).
- **Post-pull reload**: because React state is initialized from localStorage at mount, a pull forces `location.reload()` (585-592) — a visible full-page flash after every foreground with remote changes.

---

## Supabase usage

- **Project URL**: `https://fwimdnukebbrwpwdyjbv.supabase.co` (133).
- **Anon key**: `SUPABASE_ANON` = `[REDACTED]` (134) — anon role, `exp` 2093778921.
- **Client options** (273-280): `persistSession: true`, `autoRefreshToken: true`, `storageKey: "locked_session"`, `storage: window.localStorage`.
- **Auth calls used**: `onAuthStateChange` (282), `getSession` (299, 441, 57225), `signUp` (380, 1002), `signInWithPassword` (386), `signOut` (413), `updateUser` (420), `resetPasswordForEmail` (434), `resend` (1102). No OAuth/social, no magic link, no MFA, no `signInAnonymously` (guest mode is a localStorage flag, not a Supabase anonymous user).
- **Tables**: exactly one PostgREST call in the whole file — `.from("profiles").select("*").eq("user_id", user.id).single()` (57229). Columns read: `user_id`, `display_name`, `displayName`, `username`, `use_kg`, `created_at`. **This call is dead** (F-AUTH-010) because `LOCKED._client` is never exported.
- **User metadata read**: `user.user_metadata.displayName`, `.username`, and `user.email` (57228, 57243-57244).
- **RLS**: **UNVERIFIED and, in practice, untested by this client.** Since the only table read is dead code, the app currently relies on the *worker* (which holds its own credentials) for all data access. If the worker uses a service-role key, RLS is bypassed entirely and every access rule lives in unaudited worker code. Confirm by inspecting the worker source and `supabase.rls` policies on `profiles` and whatever table backs `/user/data`.

---

## Storage layer

- **Prefix**: `ld`/`sd` prepend `lk_` (2417, 2436). App code passes unprefixed names; `SYNC_KEYS` lists the prefixed ones.
- **`ld(k, fb)`** (2414-2423): returns `fb` when storage is unavailable, the key is missing, or JSON parsing throws.
- **`sd(k, v)`** (2433-2452): JSON-stringifies and writes; **returns a boolean**. On the *first* quota error only, toasts "Storage is full - changes are not being saved…" and dispatches `lockedStorageFull` with the key (2437-2448). Non-quota errors return `false` silently.
- **Availability probe** (2409-2413): one write/remove of `test` at load; false in private browsing with storage blocked.
- **Quota surface**: `lkStorageUsage()` (2453-2469) returns `{totalBytes, photoBytes, budgetBytes: 5 MB}` by summing `(key+value).length * 2`.
- **Monkey patch**: `localStorage.setItem` is globally overridden (247-254) to stamp `__lk_ts__<key>` for sync keys; `_origSetItem`/`_origGetItem` (245-246) are the escape hatch sync itself uses.
- **Migrations**: `seedExistingTimestamps` (264-278, flag `__lk_ts_migrated_v2__`), `migratePrDates` (2349-2388, flag `lk_prDatesFixed`), `migrateSuppReminders` (2393-2407, flag `lk_reminderMigrated`). Additional migration flags appear in `SYNC_KEYS` — `lk_cardioMigrated`, `lk_weightsKgMigrated`, `lk_unitConversion`, `lk_weightStorageUnit` (185, 222-224) — owned elsewhere in the file.
- **Total key count**: `SYNC_KEYS` holds **73** synced keys (+2 opt-in cycle keys). Distinct literal `sd("…")` call sites use **78** distinct unprefixed key names; the app also writes non-synced keys (`activeWorkout*`, `beta*`, `lastSync`, `deployVersion`, `guestMode`) and a `__lk_ts__` shadow key per synced key, so the realistic worst-case footprint is roughly **~160 localStorage entries** against a 5 MB budget.

---

## Beta program

- **Codes**: 7 hardcoded in the bundle — `JOSHBETA, SUMMERBETA, ROMANBETA, CESCOBETA, PUBLICBETA, OLIBETA, KENDALLBETA` (2698). Seeded into `lk_betaCodes` at load (2699-2722).
- **Validation**: local first (`validateBetaCode`, 2723-2728), then `POST /beta-validate` with `{code}` and no auth (2731-2744). `d.valid`/`d.locked` drive the result. **A network failure calls back success** (2754) — fail-open.
- **Claiming** (`claimBetaCode`, 2757-2771): marks the local entry `usedBy` + `claimedAt`, sets `lk_betaStatus = true`, `lk_betaCode`, `lk_betaId` (lowercased). `usedBy` receives a *username string*, not a Supabase uid (33490, 34315). The claim is never reported to the server.
- **Silent beta**: `SILENT_BETA_IDS = ["summerbeta"]` (2795); `isSilentBeta()` hides the beta UI in Settings (33512) while logging continues.
- **Activity logging**: `logBetaActivity(action, data)` → `lk_betaLog` (2772-2783), 30+ call sites. `logBetaAI(input, output)` → `lk_betaAILog`, called from `aiCall` for every AI response (2687, 2784-2793). Both arrays are unbounded.
- **Upload**: `syncBetaData` (2800-2832) uploads the logs plus workouts, weight, body fat, goals, cycles, feedback, coach instructions and coach plan to `/beta-sync`, unauthenticated, identified only by the beta code. A 60 s interval fires it once at 00:00 (2833-2846); Settings has a manual button (33556).
- **Admin**: `BetaAdminPanel` at 52806, routed via `screen === "betaAdmin"` (57709) — not audited here.

---

## Security findings

1. **CRITICAL — `/beta-sync` uploads a user's full training, body-composition, cycle and AI-conversation history with no authentication.** The only identifier is a beta code that is hardcoded in the client bundle. Anyone reading the JS knows all 7 codes (2698) and can `POST` to `https://lockedapi.cescocugliari.workers.dev/beta-sync` with any `betaId`. Evidence: 2800-2832, headers `Content-Type` only (2814-2817); payload including `aiLogs` (2808), `weightLog`, `bfLog`, `cycles`, `cycleLog` (2810-2818). **UNVERIFIED** whether the worker also permits a `GET` — if it does, this is a full data-disclosure hole. Fix: require `Authorization: Bearer` (i.e. use `headers()`/`authHeaders()`), and key the record on the Supabase uid.
2. **HIGH — hardcoded Supabase anon JWT with a ~2036 expiry, and no evidence RLS is exercised.** `SUPABASE_ANON` = `[REDACTED]` at line 134. An anon key is designed to be public *only when RLS protects every table*. This app makes exactly one PostgREST call (`profiles`, 57229) and it is dead code, so the RLS posture has never been exercised by the client and cannot be assessed from this repo. If the worker holds a service-role key, all authorization logic sits in unaudited code. Confirm by exporting the RLS policies on `profiles` and any `/user/data` backing table.
3. **HIGH — client-settable Pro entitlement via guest mode.** `localStorage.setItem("lk_guestMode","1")` makes `isGuestMode()` true (161-163), which makes `_setGuestSubscription()` assign `{status:"guest", isPro:true}` (331-333) and `can()` return `true` unconditionally (358). Today the blast radius is limited because `can()` and `isPro` have zero call sites, but this is a booby trap for the redesign: the moment anything reads `LOCKED.isPro`, Pro is one devtools line away. Fix: never derive entitlement from a client-writable flag.
4. **HIGH — beta-code validation fails open.** `validateBetaCodeRemote`'s `.catch` calls `onResult(true, null)` (2753-2755), so blocking the request (offline, DNS, or a blocked host) grants beta access. Combined with the codes being in the bundle (2698) and the claim being purely local (2757-2771), beta gating is decorative.
5. **MEDIUM — full AI prompt and response text is persisted and uploaded.** `logBetaAI` stores raw `input`/`output` in `lk_betaAILog` (2784-2793) for every AI call (2687), unbounded, and `syncBetaData` ships it unauthenticated (2808). Coach conversations contain body weight, body fat, injuries and cycle data.
6. **MEDIUM — sign-out does not clear local data.** `signOut` (413-418) only nulls the in-memory session; the previous user's 73 sync keys stay in localStorage. The wipe happens only on a *sign-in* with a different uid (393-400). On a shared device, signing out leaves everything readable.
7. **MEDIUM — password change requires no re-authentication.** `changePassword` calls `auth.updateUser({password})` directly (420-424). Anyone with a live session (an unlocked device) can lock the owner out.
8. **MEDIUM — `authHeaders` reads a possibly-stale token.** It takes `window.LOCKED.session.access_token` synchronously (2655-2657) instead of awaiting `getSession()` like `headers()` does (448-453), so requests made just after expiry go out unauthenticated rather than refreshing.
9. **LOW — `showToast` and every overlay/paywall screen build DOM from concatenated HTML strings with inline `onclick`** (e.g. 668-826, 892-955). `_pendingEmail` is interpolated straight into `_buildConfirmScreen` (940) — a user-supplied string in an `innerHTML` sink. It comes from the app's own email field so exploitation is self-directed, but the pattern is wrong and blocks any CSP that forbids `unsafe-inline`.
10. **LOW — monkey-patching `window.localStorage.setItem`** (247-254) is fragile and observable by any other script on the page.

### Non-security bugs worth flagging to the redesign
- **BUG-1 (F-AUTH-010)**: the Supabase `profiles` backfill at 57222-57251 can never run — `LOCKED._client` is not exported (1141-1201). Silently swallowed by the try/catch at 57224.
- **BUG-2 (F-ROOT-007)**: `syncBidirectional()` at 57460 references a function private to the auth IIFE (defined 465). The correct call is `window.LOCKED.syncToCloud()` (1159). As written this throws a `ReferenceError` synchronously — the `.catch()` never sees it — at the end of every `saveWorkout`, so a finished workout is saved locally but never pushed by that path, and the exception escapes into React's event handler.
- **BUG-3 (F-PAY-002)**: `can()`, the entire client entitlement model, is dead code (zero call sites). The `usage` field name `mealAnalisesToday` (363) is misspelled and must match whatever the worker returns.
- **BUG-4 (F-AUTH-006)**: nothing handles the `?reset=1` redirect the reset email lands on (434-437).
- **BUG-5 (F-SYNC-001)**: any single synced key exceeding 450 KB is skipped forever with only a `console.warn` (528-532) — a long-running user's `lk_history` will eventually cross this and stop syncing silently.

---

## Open questions / UNVERIFIED

1. **All worker behavior.** No source for `lockedapi.cescocugliari.workers.dev` exists in this repo. Unverified: `/user/check` response schema, `/user/data` and `/user/sync` semantics, the claimed 20-key/512 KB caps (515), whether `/user/sync` treats `null` as a delete (1191-1195), what `/user/delete` actually deletes, whether `/beta-sync` authenticates or accepts reads, whether `/beta-validate` is authoritative, and what `/app-version` returns. Confirm by reading the worker's `src/index.js` and `wrangler.toml`.
2. **Supabase schema and RLS.** No SQL or migrations here. Unverified: whether a `profiles` table exists, its column names (`display_name` vs `displayName` are both read at 57243), whether RLS is enabled, and whether the worker uses the anon or service-role key. Confirm with `supabase db dump` / the dashboard policy list.
3. **Where subscription state is stored server-side** and how `status`, `isPro`, `daysLeft` are computed (628-653, 343-355).
4. **Whether email confirmation is ON in Supabase Auth.** `_submitAuth` branches for both (1041-1053), which suggests it has been toggled. Confirm in the Auth settings.
5. **`checkDeployVersion` (82-~125)** was only partially read (78-86). Confirm the cache-bust and reload logic by reading 86-125.
6. **`BetaAdminPanel` (52806)** — outside this scope; needs an owner.
7. **Service-worker `lockedPushOpen` origin** (57494-57499) — confirm which SW file dispatches it and what URLs it sends.
8. **The CDN host.** The fallback panel says "unpkg" (58014) but the CSP/allowlist and actual `<script src>` in the head were not read.
9. **`window.LOCKED.usage`/`limits`** are written (351-352) and cleared for guests (337-338) but read only by `_LOCKED_usage` (374-376), itself only used by dead `can()`. Confirm nothing else in the app depends on them.
