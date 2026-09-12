### F-ROOT-001 — App root component & global state
- location: `redesign/input/locked-current-v6.html:57186-58006`
- user action: none — mounts at load.
- behaviour: 1. `App()` is a single function component holding all global app state (57186). 2. Lazy `useState` initializers read localStorage through `ld()`: `profile` (57187-57189), `useKg` derived from `profile.useKg !== false` (57190-57193), `splits` (57194-57196), `prs` (57197-57199), `history` wrapped in `withWorkoutIds` (57200-57202), `customs` (57203-57205), `workout` from `activeWorkout` (57206-57209), `showTutorial` from `!ld("tutorialSeen")` (57219-57221). 3. Non-persisted UI state: `screen` ("home"), `finRows`, `finSec`, `startTime`, `showSaveToast`, `showResumeDialog` (57205-57218), `restInfo` (57443), `discardArmed` (57517). 4. Every setter is a write-through wrapper that persists on change: `setSplits` (57281-57287), `setPrs` (57288-57294), `setHistory` (57295-57301), `setWorkout` (57254-57261). 5. If `profile` lacks `displayName` or `username`, App returns `<Onboarding onComplete={completeOnboarding}/>` and renders nothing else (57553-57555).
- v6 status: WORKING. - **Evidence**: full read of 57186-58006.

### F-ROOT-002 — Tab routing & screen switching
- location: `57589-57736` (`renderTab`), `57531-57552` (`go`).
- user action: tap a bottom-nav tab; call `go(screen)` from any child.
- behaviour: 1. `screen` is a plain string. `renderTab()` is an if/else chain mapping it to a screen component. 2. Screens: `review`→`Review` (57591-57607); `home`|`workout`→`HomeScreen` (57607-57619); `train`→`TrainHub` (57619-57636); `cardio`→`CardioSection` (57636-57664); `profile`→`ProfileScreen` (57664-57677); `settings`→`SettingsScreen` (57677-57686); `cycletrack`→`CycleTrackerScreen` (57686-57690); `progress`→`ProgressPage` (57690-57702); `fuel`→`FuelTab` (57702-57715, note: a separate `if`, not part of the chain); `shopping`→`ShoppingBudgetTab` (57702-57709); `betaAdmin`→`BetaAdminPanel` (57709-57711); `coach`→`CoachScreen` (57711-57721); fallback→`HomeScreen` (57721-57733). **14 routes.** 3. Result is wrapped in `ScreenBoundary` keyed by `screen`, so a crash in one tab does not take down the shell and remounts on tab change (57734-57736; boundary at 2601-2650). 4. `go(scr)`: tapping the current tab dispatches `lockedTabReset` and returns (57532-57537). Moving between top-level tabs (`home,train,fuel,coach,profile`) *replaces* the nav-stack root; any other target pushes and calls `window.history.pushState({lkDepth})` (57538-57550). 5. `popstate` pops `navStack` and restores the previous screen; at stack depth 1 the event is left alone so back exits the app (57519-57530).
- v6 status: WORKING. - **Evidence**: 57531-57736, 57905-57935.

### F-ROOT-003 — Bottom navigation bar (`Nav`)
- location: `7652-7758` (component), `57957-57961` (usage).
- user action: tap one of 5 tabs.
- behaviour: 1. 5 tabs: Home, Train, Fuel, Coach, Profile (7673-7692). 2. Not `position:fixed` — it is the last flex row of the shell column (7699-7704). 3. Measures its own height with a `ResizeObserver` + resize listener and publishes it as CSS var `--lk-nav-h` on `documentElement` (7657-7672); consumed at 1268-1269, 14599, 52056, 57964, 57984. 4. Active tab is *derived*, not equal to `screen`: workout/cardio→`train`; settings/betaAdmin→`profile`; progress/cycletrack→`home`; shopping→`fuel` (57958). 5. Accessibility: `role="navigation"`, `aria-label="Main navigation"`, per-tab `aria-label` with "(current page)" and `aria-current="page"` (7708-7720). 6. Hidden entirely when `screen === "review"` (`showNav`, 57588). 7. A decorative accent gradient scrim (150px, `pointerEvents:none`, z-99) sits behind it (57944-57956).
- v6 status: WORKING. - **Evidence**: 7652-7758, 57944-57961.

### F-ROOT-004 — In-progress workout banner
- location: `57556-57587` (height publishing), `57856-57903` (render).
- user action: 
- behaviour: 1. Shown when `workoutActive && !onWorkoutScreen` — i.e. a workout exists, you are not on the workout screen, and not on review (57548-57550, 57856). 2. Fixed to top, tap or keyboard-activate (`lkKeyActivate`) returns to `screen="workout"` (57857-57866). 3. Right side shows a live rest countdown `REST m:ss` when `restInfo.active`, else "TAP TO RETURN" (57899-57902). `restInfo` is fed by a `lockedRest` window event (57443-57450). 4. Its measured height is published as `--lk-top-off` via `ResizeObserver`, set to `0px` when hidden (57565-57587); pages consume it as `paddingTop` (57934).
- v6 status: WORKING. - **Evidence**: 57556-57587, 57856-57903.

### F-ROOT-005 — Resume-workout dialog
- location: `57262-57267` (trigger), `57761-57855` (render).
- user action: 
- behaviour: 1. On mount, if `workout` exists and `screen !== "workout"`, show the dialog (57262-57267, empty dep array — mount only). 2. Escape closes it via `useEscape` (57216-57218; helper at 5160). 3. Rendered through `lkPortal` (5072) at z-2000. 4. "Start Fresh" is a **two-tap armed destructive action**: first tap sets `discardArmed`, relabels to "Discard workout?" and turns red; second tap clears `lk_activeWorkout`, `lk_activeWorkoutRows`, `lk_activeWorkoutSec`, `lk_activeWorkoutRestTarget` (57808-57838). 5. "Resume" sets `screen="workout"` (57839-57854).
- v6 status: WORKING. - **Evidence**: 57761-57855.

### F-ROOT-006 — Notification / deep-link routing
- location: `57466-57500`.
- user action: 
- behaviour: 1. Cold start: reads `?open=` from the query string; if present and not `endworkout`, routes and then `history.replaceState` strips it (57487-57493). 2. Warm: listens for `lockedPushOpen` (from the service worker) and matches the URL substring (57494-57499). 3. `open("checkin")` sets `window.__lockedCoachPane="check-in"`, goes to `coach`, and dispatches `lockedCoachPane` (57469-57474). `open("workout")` goes to `workout` if `lk_activeWorkout` exists else `train` (57475). `open("fuel")` → `fuel` (57476).
- v6 status: WORKING (client side). Service-worker message origin UNVERIFIED here. - **Evidence**: 57466-57500.

### F-ROOT-007 — Workout lifecycle in the root
- location: `57405-57461`.
- user action: 
- behaviour: 1. `startWorkout(info)` restores `lk_activeWorkoutRows`/`Sec` if present and jumps straight to `review` when rows exist, else `workout` (57405-57415). 2. `finishWorkout(rows, sec)` persists rows + seconds and goes to `review` (57416-57422). 3. `saveWorkout(rec)` prepends a normalized record to `history` (id, name, sets, vol, dur, date, dateISO, exercises, blocks, reflection, note, aiInsight) (57424-57440), calls `logBetaActivity("workout_saved", …)` (57441-57446), shows a 2.5s toast, clears all four active-workout keys, returns home, then calls `syncBidirectional()` (57447-57460).
- v6 status: **BROKEN (partial)** — see SEC/BUG-2: `syncBidirectional` is not in scope at 57460. - **Evidence**: 57460 vs. the only definition at 465 inside the auth IIFE; `rg 'syncBidirectional'` finds no global export other than `window.LOCKED.syncToCloud` (1159).

### F-ROOT-008 — Onboarding completion
- location: `57347-57404`.
- user action: 
- behaviour: builds `{displayName, username, useKg, createdAt}`, persists to `lk_profile`, and converts an AI-generated program (`prog.splits`) into the app's split shape — consolidating several single-day splits into one multi-day program when there are ≥2 and all have exactly one day (57369-57389); otherwise wraps `prog.splits` as days of one program (57390-57402). Ends at `screen="home"`.
- v6 status: WORKING. - **Evidence**: 57347-57404.

### F-ROOT-009 — Mount, ErrorBoundary and CDN fallback
- location: `58007-58015`.
- user action: 
- behaviour: 1. `ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>)` inside a `try` (58007-58009). 2. On a synchronous mount throw, `#root.innerHTML` is replaced with a "Failed to Load App" panel showing `e.message` (58010). 3. A separate trailing script waits 3000 ms and, if `!window.React`, renders a "CDN Error" panel with a Reload button (58012-58015).
- v6 status: WORKING. - **Evidence**: 58007-58015. Note the fallback copy says "unpkg" (58014) — verify the actual CDN host in the head.

### F-ROOT-010 — Shell chrome (status-bar scrim, toasts, voice button)
- location: `57737-57760`, `57962-58005`.
- user action: 
- behaviour: renders `<style>{CSS}</style>` (57737); a fixed blurred status-bar scrim at z-180 sized `env(safe-area-inset-top)+8px` (57738-57760); `.lk-shell` max-width 420px centered (57849-57855); an empty `#lockedVoiceToast` div driven imperatively from outside React (57962-57983); the green "✓ Saved" toast when `showSaveToast` (57984-58005); `VoiceButtonWrap` rendered only when `showNav && profile` (57962).
- v6 status: WORKING. - **Evidence**: as cited. ---
