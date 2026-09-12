### F-AUTH-001 — Supabase client bootstrap
- location: `126-297` (module IIFE), client created at `273-280`.
- user action: 
- behaviour: 1. An IIFE `"use strict"` module at 130-131 defines `SUPABASE_URL` = `https://fwimdnukebbrwpwdyjbv.supabase.co` (133), `SUPABASE_ANON` = `[REDACTED]` (134), `WORKER_URL` = `https://lockedapi.cescocugliari.workers.dev` (135). 2. `init()` (267) aborts with a console error if `window.supabase` is absent (268-271). 3. `createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "locked_session", storage: window.localStorage } })` (273-280). 4. `init` is wired to `DOMContentLoaded` or run immediately (1210-1214).
- v6 status: WORKING. - **Security**: `SUPABASE_ANON` is a hardcoded anon-role JWT (`iat` 1778202921, `exp` 2093778921 ≈ year 2036) — see Security findings.

### F-AUTH-002 — Sign up
- location: `380-384` (`signUp`), `1000-1059` (`_submitAuth` signup branch).
- user action: SIGN UP tab → email + password → CREATE ACCOUNT.
- behaviour: 1. Client-side password policy enforced before the call: ≥8 chars, one uppercase, one lowercase, one digit (1015-1026); live checklist via `_validatePw` (1079-1094). 2. `_client.auth.signUp({email, password})` (1002). 3. If the error message matches "already registered"/"already been registered"/"user already", it silently attempts `signIn` and, on failure, throws "An account with this email already exists. Try signing in." (1004-1018). 4. If it matches "rate limit"/"email rate"/"too many", it attempts `signIn`; on "not confirmed" it shows the confirm screen; otherwise "Signup is temporarily limited." (1020-1038). 5. If `!result.data.session` (email confirmation ON), it tries `signIn` anyway; on failure it stores `_pendingEmail` and switches to the `confirm` screen (1041-1053). 6. On immediate session: `fetchSubscription`, `hideOverlay`, `checkTrialWarning`, toast "Welcome to LOCKED! Your 14-day trial starts now." (1054-1058). - **Stored**: Supabase session under `locked_session`; `__lk_last_uid__` on the next `getSession` (301).
- v6 status: WORKING.

### F-AUTH-003 — Sign in
- location: `386-411`.
- user action: 
- behaviour: 1. `auth.signInWithPassword({email, password})`; throws on error (387-388). 2. **Account-switch wipe**: if `__lk_last_uid__` exists and differs from the new uid, every key in `SYNC_KEYS` plus its `__lk_ts__` twin is removed from localStorage so the old account cannot upload into the new account's cloud (393-400). 3. Writes `__lk_last_uid__` (401), `fetchSubscription` (402), `syncBidirectional()` (403), `hideOverlay`, `checkTrialWarning` (404-405), then `reloadIfPulled(pulled)` — a full page reload when the merge pulled anything (410). - **Error handling**: messages mapped in `_submitAuth`'s catch — "not confirmed" → confirm screen; "invalid login"/"invalid credentials" → "Incorrect email or password."; rate-limit → "Signup is temporarily limited…" (1063-1077). The button is restored and re-enabled only in the catch (1076).
- v6 status: WORKING.

### F-AUTH-004 — Sign out
- location: `413-418`.
- user action: 
- behaviour: `auth.signOut()`, clears `_session` and `_subscription`, calls `showOverlay()`. - **Edge case**: **local data is NOT wiped on sign out** — only on a sign-in as a *different* uid (393-400). Signing out then browsing leaves the previous account's data in localStorage.
- v6 status: WORKING (with the caveat above).

### F-AUTH-005 — Password change
- location: `420-424` → `auth.updateUser({password:newPw})`. Exported as `LOCKED.changePassword` (1165). No current-password re-auth.
- user action: 
- behaviour: 
- v6 status: WORKING.

### F-AUTH-006 — Password reset
- location: `434-439` (`resetPassword`), `1096-1109` (`_forgotPassword`).
- user action: 
- behaviour: "Forgot password?" reads `#auth-email`; empty → inline error "Enter your email first." (1097-1103). Calls `auth.resetPasswordForEmail(email, { redirectTo: origin + pathname + "?reset=1" })` (434-437), then toast "Password reset email sent. Check your inbox." - **Gap**: nothing in the app reads `?reset=1` — `rg '\?reset|reset=1'` finds only this line. The redirect lands on the app with a recovery session and no dedicated set-new-password screen. **UNVERIFIED** whether Supabase's implicit-session recovery makes this usable.
- v6 status: PARTIAL.

### F-AUTH-007 — Resend confirmation
- location: `1096-1108`? no — `1096` is `_resendConfirmation` at `1098-1108`: `auth.resend({type:"signup", email:_pendingEmail})`, success/failure toasts. Reached from the CHECK YOUR INBOX screen (`_buildConfirmScreen`, 924-955).
- user action: 
- behaviour: 
- v6 status: WORKING.

### F-AUTH-008 — Session restore on load
- location: `299-325`.
- user action: 
- behaviour: 1. `auth.getSession()`; with a session: write `__lk_last_uid__`, `fetchSubscription`, flip `_ready` and drain `_readyCbs`, `hideOverlay`, `checkTrialWarning`, `syncBidirectional().then(reloadIfPulled)` (300-313). 2. First boot of a new calendar day (`__lk_last_sync_date__` !== today) triggers a second `syncBidirectional` (314-319). 3. Without a session: `_ready = true`, drain callbacks; if guest mode → `_setGuestSubscription()`; otherwise `showOverlay()` (320-324). 4. `auth.onAuthStateChange` (282-297) mirrors this on every auth event: on session, clear the guest flag, `hideOverlay`, `fetchSubscription`; on none, clear `_subscription` and either set the guest subscription or show the overlay.
- v6 status: WORKING.

### F-AUTH-009 — Guest / anonymous mode
- location: `160-178` (`isGuestMode`, `enterGuestMode`), `330-341` (`_setGuestSubscription`), `856-886` (`_showGuestModal`), `887-890` (`_hideGuestModal`).
- user action: SIGN IN tab → "Continue without account" → modal → CONTINUE AS GUEST.
- behaviour: 1. `isGuestMode()` = no session AND `localStorage.lk_guestMode === "1"` (161-163). 2. `enterGuestMode()` sets the flag, seeds `lk_profile` = `{displayName:"Athlete", username:"athlete", useKg:true, createdAt:<locale date>}` if absent (so onboarding is skipped), then **reloads the page** (165-178). 3. The disclosure modal states data is device-only with no cloud backup and offers CREATE ACCOUNT as the alternative (866-884). 4. `_setGuestSubscription()` sets `_subscription = {status:"guest", isPro:true}` and clears `LOCKED.usage`/`limits` (331-340). **Guests get full Pro access** — `can()` returns `true` immediately for guests (357). 5. `forceSyncNow()` silently no-ops for guests (600). 6. Upgrade path: `LOCKED.upgradeFromGuest` opens the signup screen (1154); `onAuthStateChange` removes `lk_guestMode` when a session appears so the normal merge uploads local data (287-292).
- v6 status: WORKING. - **Security**: writing `lk_guestMode="1"` in devtools grants `isPro:true` locally — see Security findings.

### F-AUTH-010 — Supabase `profiles` table read (App root)
- location: `57222-57251`. - **Behavior (as written)**: 1. Runs once on mount, and only when the local profile is missing `displayName` or `username` (57223). 2. `window.LOCKED._client.auth.getSession()` → `window.LOCKED._client.from("profiles").select("*").eq("user_id", user.id).single()` (57225, 57229). 3. On a row, it *merges* (never replaces): `displayName` from `local.displayName || r.data.display_name || r.data.displayName || user_metadata.displayName || "Athlete"`; `username` from `local.username || r.data.username || meta.username || email.split("@")[0] || "user"`; `useKg` only when `typeof r.data.use_kg === "boolean"` (a missing/null column keeps the local unit — the comment at 57235-57238 records that the old default-to-kg silently switched units mid-workout); `createdAt` from `local.createdAt || r.data.created_at` (57240-57247). Then `sd("profile", …)`, `setProfileRaw`, `setUseKgRaw`. - **Columns referenced**: `user_id`, `display_name`, `displayName`, `username`, `use_kg`, `created_at`.
- user action: 
- behaviour: 
- v6 status: **DEAD CODE.** `window.LOCKED` (1141-1201) does **not** export `_client` — `rg '_client'` returns only 153, 1003, 1102, 57225, 57229. `window.LOCKED._client.auth` therefore throws `TypeError`, caught by the outer `try` at 57224/57250, silently. This is the only `.from(...)` call in the entire file (`rg '\.from\("'` → one hit).

### F-AUTH-011 — Auth overlay UI
- location: `773-855` (`_buildAuthScreen`), `716-772` (`showOverlay`/`hideOverlay`/`buildOverlay`/`_overlayContent`), `891-955` (`_buildConfirmScreen`).
- user action: 
- behaviour: a pre-React, string-HTML overlay at z-99999 that hides `#root` while shown (738-740). Three modes driven by `_authMode`: `login`, `signup`, `confirm` (`_setAuthMode`, 960-964). Includes a LOCKED wordmark, SIGN IN/SIGN UP pill switcher wired to `window.LOCKED._setAuthMode`, an inline `#auth-error` region, email + password inputs (16px font to avoid iOS zoom), a password eye toggle (`_togglePw`, 966-973), the signup-only live requirement checklist, "Forgot password?" (login only), the submit button with a three-dot pulse loading state (1044? — 986-993), a signup-only "14-day free trial · No credit card required" note (846-848), and the guest entry button (login only, 851-855). - **Accessibility gap**: overlay is built from raw HTML strings with inline `onclick` handlers; no focus trap, no `role="dialog"`, no labels beyond visual `<label>` text without `for`/`id` pairing (`<label>` at 811 has no `for`).
- v6 status: WORKING.

### F-AUTH-012 — `getToken` / `headers` / `authHeaders`
- location: `441-446` (`getToken`), `448-453` (`headers`), `2652-2662` (`authHeaders`).
- user action: 
- behaviour: `getToken()` awaits `auth.getSession()` and returns `session.access_token` or `null` (442-445). `headers(extra)` builds `{Content-Type: application/json}` plus `Authorization: Bearer <token>` when a token exists, merged with `extra` (449-452). `authHeaders(extra)` is the React-side synchronous twin reading `window.LOCKED.session.access_token` inside a try/catch (2652-2662) — it does **not** await a refresh, so an expired-in-memory session yields an unauthenticated request. - **Called by**: `fetchSubscription` (343-355 builds its own header), `deleteAccount` (426), `syncBidirectional` (479), `setCycleSync` cloud-clear (1189), `aiCall` (2666), and every worker-calling screen.
- v6 status: WORKING.

### F-AUTH-013 — Account deletion
- location: `426-432`.
- user action: 
- behaviour: `DELETE {WORKER_URL}/user/delete` with auth headers; throws `data.error || "Delete failed"` on non-OK; then `signOut()`. - **Edge case**: local data is **not** cleared after deletion — only `signOut()` runs (431).
- v6 status: WORKING client-side; server behavior UNVERIFIED.

### F-AUTH-014 — Toast
- location: `1111-1139`. Fixed above the nav (`--lk-nav-h + 12px`), green `#178841` / red `#B91C1C`, `role="status"` for assistive tech (1132), auto-dismiss after 3500 ms with a 300 ms fade.
- user action: 
- behaviour: 
- v6 status: WORKING. Exported as `LOCKED.toast` (1199). ---
