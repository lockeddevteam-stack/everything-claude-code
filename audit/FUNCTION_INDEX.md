# LOCKED — Function & Component Index

Every function, component, hook and handler in the production build
`redesign/input/locked-current-v6.html` (58,015 lines), sorted by line number.

**1540 entries.** Line numbers are **machine-re-anchored**: each symbol's
definition line was recomputed directly from the source, replacing the
agent-reported cites (Wave 3 found those drifted by 5-64 lines).
939 anchored to an exact definition (168 of which corrected real drift);
601 unresolved — inline handlers and closures with no top-level definition,
where the original cite is kept and marked.

| Location | Symbol | Kind | Purpose | Source agent |
|---|---|---|---|---|
| redesign/input/locked-current-v6.html:49 | `sync` | closure fn | Classlist toggle helper | 10-shared |
| redesign/input/locked-current-v6.html:49 | `sync` | function (inner) | Measure and publish nav height | 02a-train-exercises |
| redesign/input/locked-current-v6.html:49 | `sync` | handler | Re-reads the voice-enabled flag on toggle/storage events | 07-misc-gamification |
| redesign/input/locked-current-v6.html:49 | `sync` | function | Re-read `lk_voiceEnabled` | 06-profile |
| redesign/input/locked-current-v6.html:165 | `isGuestMode` | fn | True when no session and `lk_guestMode==="1"` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:168 | `enterGuestMode` | function | Seeds a fake profile so guests skip onboarding, then reloads | 09-onboarding-system |
| redesign/input/locked-current-v6.html:168 | `enterGuestMode` | fn | Set guest flag, seed profile, reload | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:263 | `_setSyncState` | fn | Set `_syncState` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:267 | `init` | fn | Create Supabase client, wire auth listeners, first sync | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:332 | `_setGuestSubscription` | fn | Grant guests `{status:"guest", isPro:true}` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:360 | `can` | fn | Client entitlement check (DEAD — no callers) | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:375 | `_LOCKED_usage` | fn | Read a usage counter with 0 default | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:590 | `reloadIfPulled` | fn | Reload once when cloud data was pulled | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:628 | `checkTrialWarning` | fn | Top trial banner at ≤4 days left | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:655 | `showPaywall` | fn | Build/show the Pro upsell sheet | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:760 | `_paywallCard` | fn | One feature card's HTML string | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:770 | `showOverlay` | fn | Show or build the auth overlay | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:776 | `hideOverlay` | fn | Fade out the overlay and restore `#root` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:786 | `buildOverlay` | fn | Create the overlay DOM, hide `#root` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:804 | `_overlayContent` | fn | Swap overlay inner HTML | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:812 | `_buildAuthScreen` | fn | Login/signup screen HTML | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:894 | `_showGuestModal` | fn | Guest disclosure modal | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:917 | `_hideGuestModal` | fn | Remove the guest modal | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:922 | `_buildConfirmScreen` | fn | "CHECK YOUR INBOX" screen HTML | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:953 | `_setAuthMode` | fn | Switch login/signup/confirm | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:959 | `_togglePw` | fn | Password visibility toggle | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:1082 | `_validatePw` | fn | Live password-requirement checklist | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:1122 | `showToast` | fn | Global toast with `role="status"` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:1325 | `readRaw` | fn | Raw JSON localStorage read w/ fallback | 10-shared |
| redesign/input/locked-current-v6.html:1334 | `writeRaw` | fn | Raw JSON localStorage write | 10-shared |
| redesign/input/locked-current-v6.html:1342 | `deviceId` | function | Stable per-device UUID, excluded from cloud sync | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1342 | `deviceId` | fn | Stable per-device id, crypto random | 10-shared |
| redesign/input/locked-current-v6.html:1363 | `getPrefs` | fn | Merge stored prefs over `DEFAULT_PREFS` | 10-shared |
| redesign/input/locked-current-v6.html:1363 | `getPrefs` | function | DEFAULT_PREFS merged with stored prefs | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1368 | `timeZone` | fn | IANA tz string | 10-shared |
| redesign/input/locked-current-v6.html:1368 | `timeZone` | function | IANA tz with a `"UTC"` fallback | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1376 | `todayISO` | fn | Local YYYY-MM-DD (push-module copy of `isoDay`) | 10-shared |
| redesign/input/locked-current-v6.html:1385 | `dayOf` | fn | **Duplicate** of the global `dayOf` (`:1969`) inside this IIFE | 10-shared |
| redesign/input/locked-current-v6.html:1385 | `dayOf` | fn | Calendar day of a stored date (bare date or ISO timestamp) | 10-shared |
| redesign/input/locked-current-v6.html:1401 | `isIOS` | function | UA + maxTouchPoints iOS/iPadOS detection | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1401 | `isIOS` | fn | UA sniff | 10-shared |
| redesign/input/locked-current-v6.html:1407 | `isStandalone` | function | `navigator.standalone` or `display-mode: standalone` | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1407 | `isStandalone` | fn | Installed-PWA check | 10-shared |
| redesign/input/locked-current-v6.html:1412 | `supported` | fn | Whether web push can work here | 10-shared |
| redesign/input/locked-current-v6.html:1412 | `supported` | function | SW + PushManager + Notification present | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1422 | `buildContext` | function | Snapshot of next split day, streak, trained/checked-in today | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1422 | `buildContext` | fn | Server-side snapshot: next split day, streak, trained/checked-in today, due supplements/compounds/restock | 10-shared |
| redesign/input/locked-current-v6.html:1422 | `buildContext` | function (inner) | Thin wrapper over the top-level context builder | 05-coach |
| redesign/input/locked-current-v6.html:1556 | `post` | fn | POST helper to Worker `/push/*` | 10-shared |
| redesign/input/locked-current-v6.html:1564 | `b64uToUint8` | fn | base64url → VAPID key bytes | 10-shared |
| redesign/input/locked-current-v6.html:1659 | `isEnabled` | function | True only if the flag is set AND permission is granted | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1659 | `isEnabled` | fn | Reads `lk_pushEnabled` | 10-shared |
| redesign/input/locked-current-v6.html:1724 | `scheduleRest` | function | Asks the Worker to push a rest-timer alert in N seconds | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1724 | `scheduleRest` | fn | Server-scheduled rest-timer alarm | 10-shared |
| redesign/input/locked-current-v6.html:1733 | `cancelRest` | function | Cancels a pending rest alert | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1733 | `cancelRest` | fn | Cancel that alarm | 10-shared |
| redesign/input/locked-current-v6.html:1744 | `scheduleIdleCheck` | function | Schedules the "still training?" nudge, throttled | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1744 | `scheduleIdleCheck` | fn | Idle-workout nudge | 10-shared |
| redesign/input/locked-current-v6.html:1757 | `cancelIdleCheck` | fn | Cancel idle nudge | 10-shared |
| redesign/input/locked-current-v6.html:1757 | `cancelIdleCheck` | function | Cancels the idle nudge | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1764 | `status` | function | Reports support/needsInstall/permission/enabled/prefs | 09-onboarding-system |
| redesign/input/locked-current-v6.html:1764 | `status` | fn | `{supported, needsInstall, permission, enabled}` | 10-shared |
| redesign/input/locked-current-v6.html:1819 | `audio` | fn | Lazily create/resume AudioContext | 10-shared |
| redesign/input/locked-current-v6.html:1830 | `playBell` | fn | Synthesised bell (additive partials) | 10-shared |
| redesign/input/locked-current-v6.html:1854 | `playPlate` | fn | Synthesised plate clank (thud + noise + ring) | 10-shared |
| redesign/input/locked-current-v6.html:1898 | `playAlert` | fn | Dispatch by preference + `navigator.vibrate([180,90,180])` | 10-shared |
| redesign/input/locked-current-v6.html:1961 | `isoDay` | fn | **Local** calendar day `YYYY-MM-DD` (avoids the UTC off-by-one) | 10-shared |
| redesign/input/locked-current-v6.html:1979 | `_extends` | fn | Babel `Object.assign` polyfill helper | 10-shared |
| redesign/input/locked-current-v6.html:2121 | `useHubState` | hook | Persisted hub sub-tab state with an allow-list | 10-shared |
| redesign/input/locked-current-v6.html:2132 | `set` | handler | Set state + persist pantry | 04-shopping-budget |
| redesign/input/locked-current-v6.html:2132 | `set` | handler (inner) | Patch today's/this day's log | 06b-cycle |
| redesign/input/locked-current-v6.html:2140 | `useTabReset` | hook | Subscribes to the `lockedTabReset` window event | 10-shared |
| redesign/input/locked-current-v6.html:2150 | `useSheetDrag` | hook | Drag-to-dismiss bottom sheets with a spring | 10-shared |
| redesign/input/locked-current-v6.html:2171 | `step` | function (inner) | One rAF frame of the count-up easing | 02e-cardio |
| redesign/input/locked-current-v6.html:2171 | `step` | function | One rAF frame of the spring integration | 07-misc-gamification |
| redesign/input/locked-current-v6.html:2207 | `move` | handler | Reorder a favourite by ±1 | 02e-cardio |
| redesign/input/locked-current-v6.html:2207 | `move` | function | Swap a block with its neighbour | 06-profile |
| redesign/input/locked-current-v6.html:2235 | `cancel` | handler | Cancel on pointer leave | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:2349 | `migratePrDates` | fn | One-shot: recover real dates for PRs stamped `"Today"` | 10-shared |
| redesign/input/locked-current-v6.html:2349 | `migratePrDates` | fn | Recover real PR dates from history | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2393 | `migrateSuppReminders` | fn | One-shot: force `reminder:true` on supplements | 10-shared |
| redesign/input/locked-current-v6.html:2393 | `migrateSuppReminders` | fn | Reset inert `reminder:false` to true | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2417 | `ld` | fn | Namespaced JSON read (`lk_` prefix) with fallback | 10-shared |
| redesign/input/locked-current-v6.html:2417 | `ld` | fn | Read+parse `lk_<k>` with fallback | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2431 | `lkIsQuotaError` | fn | Cross-browser quota-error detection | 10-shared |
| redesign/input/locked-current-v6.html:2431 | `lkIsQuotaError` | fn | Recognise quota-exceeded errors | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2435 | `sd` | fn | Namespaced JSON write; returns bool; quota toast + event | 10-shared |
| redesign/input/locked-current-v6.html:2435 | `sd` | fn | Write `lk_<k>`, toast+event on quota, return bool | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2456 | `lkStorageUsage` | fn | Approximate bytes used, photo bytes, 5 MB budget | 10-shared |
| redesign/input/locked-current-v6.html:2456 | `lkStorageUsage` | fn | Bytes used total / by photos / budget | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2501 | `initTheme` | fn | Resolve stored/system profile at React boot | 10-shared |
| redesign/input/locked-current-v6.html:2512 | `applyTheme` | fn | Stamp attribute/class, update theme-color, persist | 10-shared |
| redesign/input/locked-current-v6.html:2530 | `toggleTheme` | fn | Binary dark↔light toggle + `theme-changed` event | 10-shared |
| redesign/input/locked-current-v6.html:2535 | `setTheme` | fn | Set a named profile + `theme-changed` event | 10-shared |
| redesign/input/locked-current-v6.html:2540 | `ErrorBoundary` | component (class) | App-wide crash screen with a Refresh button | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2540 | `ErrorBoundary` | React class | App-level crash screen | 10-shared |
| redesign/input/locked-current-v6.html:2540 | `ErrorBoundary` | Wraps the entire `<App/>` at the React root (`:58002`) | "Refresh Page" → `window.location.reload()` | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2540 | `ErrorBoundary` | class | Top-level crash screen with a Reload button | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2601 | `ScreenBoundary` | component (class) | Per-screen crash panel with a Reload button | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2601 | `ScreenBoundary` | React class | Per-screen crash screen | 10-shared |
| redesign/input/locked-current-v6.html:2601 | `ScreenBoundary` | Wraps each routed screen, `key={screen}` (`:57734-57737`) | "Reload" → `window.location.reload()` | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2601 | `ScreenBoundary` | class | Per-screen crash isolation | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2652 | `authHeaders` | fn | JSON + Bearer header builder from `window.LOCKED.session` | 10-shared |
| redesign/input/locked-current-v6.html:2652 | `authHeaders` | function | `Content-Type` + `Authorization: Bearer <window.LOCKED.session.access_token>` | 05-coach |
| redesign/input/locked-current-v6.html:2652 | `authHeaders` | fn | Sync `Bearer` headers from `LOCKED.session` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2663 | `aiCall` | function | Shared AI helper, `max_tokens:700`, gated-response handling, `logBetaAI` | 05-coach |
| redesign/input/locked-current-v6.html:2663 | `aiCall` | fn | Single AI request wrapper (Worker root URL) | 10-shared |
| redesign/input/locked-current-v6.html:2663 | `aiCall` | fn | POST to the worker root, handle `d.gated` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2699 | `initBetaCodes` | fn | Seed `DEFAULT_BETA_CODES` (Agent 8 owns) | 10-shared |
| redesign/input/locked-current-v6.html:2699 | `initBetaCodes` | fn | Seed `lk_betaCodes` from the defaults | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2722 | `validateBetaCode` | function | Checks a code against the local `lk_betaCodes` list | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2722 | `validateBetaCode` | fn | Local code check | 10-shared |
| redesign/input/locked-current-v6.html:2722 | `validateBetaCode` | fn | Local code validity check | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2729 | `validateBetaCodeRemote` | fn | Worker `/beta-validate` | 10-shared |
| redesign/input/locked-current-v6.html:2729 | `validateBetaCodeRemote` | function | Local-then-remote invite-code validation (fails open offline) | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2729 | `validateBetaCodeRemote` | fn | Local check + `POST /beta-validate` (fail-open) | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2757 | `claimBetaCode` | fn | Mark claimed, set beta flags | 10-shared |
| redesign/input/locked-current-v6.html:2757 | `claimBetaCode` | function | Marks a code used and flips the beta flags | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2757 | `claimBetaCode` | fn | Mark used, set betaStatus/betaCode/betaId | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2772 | `logBetaActivity` | fn | Append to `lk_betaLog` | 10-shared |
| redesign/input/locked-current-v6.html:2772 | `logBetaActivity` | function | Appends an action record to `lk_betaLog` when beta is active | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2772 | `logBetaActivity` | function | Append `{ts,action,data,betaId}` to `lk_betaLog` | 05-coach |
| redesign/input/locked-current-v6.html:2772 | `logBetaActivity` | fn | Append an action to `lk_betaLog` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2783 | `logBetaAI` | fn | Append prompt/response to `lk_betaAILog` | 10-shared |
| redesign/input/locked-current-v6.html:2783 | `logBetaAI` | function | Appends an AI turn to `lk_betaAILog` when beta is active | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2783 | `logBetaAI` | function | Append `{ts,input,output,betaId}` to `lk_betaAILog` | 05-coach |
| redesign/input/locked-current-v6.html:2783 | `logBetaAI` | fn | Append prompt/response to `lk_betaAILog` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2796 | `isSilentBeta` | fn | Suppress beta UI for listed ids | 10-shared |
| redesign/input/locked-current-v6.html:2796 | `isSilentBeta` | function | True for the hardcoded `summerbeta` id | 09-onboarding-system |
| redesign/input/locked-current-v6.html:2796 | `isSilentBeta` | fn | True for `summerbeta` | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2800 | `syncBetaData` | fn | POST the beta payload to `/beta-sync` | 10-shared |
| redesign/input/locked-current-v6.html:2800 | `syncBetaData` | function | POST all local beta data to `/beta-sync` | 05-coach |
| redesign/input/locked-current-v6.html:2800 | `syncBetaData` | fn | Unauthenticated upload of beta+user data | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:2856 | `saveProgressPhoto` | fn | Append photo, roll back if the write fails | 10-shared |
| redesign/input/locked-current-v6.html:2878 | `resizeImage` | fn | Two-axis downscale → JPEG q0.6 data URL | 10-shared |
| redesign/input/locked-current-v6.html:2908 | `getWeightLog` | fn | Read `lk_weightLog` | 10-shared |
| redesign/input/locked-current-v6.html:2911 | `addWeightEntry` | fn | Upsert today's kg, sort, persist | 10-shared |
| redesign/input/locked-current-v6.html:2936 | `checkRefeedTrigger` | fn | Three consecutive all-time-low weigh-ins on a cut | 10-shared |
| redesign/input/locked-current-v6.html:2966 | `calcRefeedCarbs` | fn | Refeed carb bump by TDEE/bodyweight | 10-shared |
| redesign/input/locked-current-v6.html:4291 | `unitConvOn` | fn | Whether unit conversion is enabled (default true) | 10-shared |
| redesign/input/locked-current-v6.html:4307 | `lkLum` | fn | WCAG relative luminance | 10-shared |
| redesign/input/locked-current-v6.html:4314 | `lkRatio` | fn | WCAG contrast ratio | 10-shared |
| redesign/input/locked-current-v6.html:4318 | `readableAccent` | fn | Lighten/darken a palette hex until ≥4.5:1 on the card; memoised | 10-shared |
| redesign/input/locked-current-v6.html:4349 | `fmtQ` | fn | Round to nearest 0.25, no trailing decimals | 10-shared |
| redesign/input/locked-current-v6.html:4355 | `fmtCal` | fn | Whole-number calories | 10-shared |
| redesign/input/locked-current-v6.html:4379 | `storedWeightUnit` | fn | Resolve-once-and-record what stored lift weights mean | 10-shared |
| redesign/input/locked-current-v6.html:4414 | `storedToUnit` | fn | Stored unit → display unit | 10-shared |
| redesign/input/locked-current-v6.html:4420 | `unitToStored` | fn | Display unit → stored unit | 10-shared |
| redesign/input/locked-current-v6.html:4430 | `kgToDisp` | fn | Display string for a stored weight (quarter-rounded) | 10-shared |
| redesign/input/locked-current-v6.html:4439 | `liftDisp` | fn | Numeric display for a **lift** weight, 1 dp | 10-shared |
| redesign/input/locked-current-v6.html:4444 | `dispToKg` | fn | Typed value → stored value, 4 dp | 10-shared |
| redesign/input/locked-current-v6.html:4464 | `convToKg` | fn | Lenient display→stored conversion | 10-shared |
| redesign/input/locked-current-v6.html:4479 | `e1rm` | fn | Epley estimated 1RM; a single is returned uninflated | 10-shared |
| redesign/input/locked-current-v6.html:4492 | `prSummary` | fn | Heaviest single / best 6–8 working set / best est-1RM | 10-shared |
| redesign/input/locked-current-v6.html:4530 | `compoundRank` | fn | Rank a lift name against `PR_COMPOUNDS` regexes | 10-shared |
| redesign/input/locked-current-v6.html:4541 | `prDay` | fn | Real day for a PR, or null for legacy `"Today"` | 10-shared |
| redesign/input/locked-current-v6.html:4552 | `prLabel` | fn | "Today"/"Yesterday"/"N days ago"/locale date | 10-shared |
| redesign/input/locked-current-v6.html:4569 | `e1rmSeries` | fn | Est-1RM time series per exercise from history + PRs | 10-shared |
| redesign/input/locked-current-v6.html:4603 | `throwbackForced` | fn | Dev bypass via `lk_throwbackForce` | 10-shared |
| redesign/input/locked-current-v6.html:4606 | `computeThrowback` | fn | Build the past-vs-now comparison card | 10-shared |
| redesign/input/locked-current-v6.html:4662 | `dismissThrowback` | fn | Record dismissal timestamp | 10-shared |
| redesign/input/locked-current-v6.html:4664 | `ThrowbackCard` | component | Then/now progress flashback card | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4669 | `disp` | function (inner) | Unit-aware display wrapper | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4715 | `muscleVolumeSummary` | function | 6-week synergy-weighted weekly set volume per muscle | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4742 | `lcName` | function | Tolerant lowercase name for shopping rows | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4747 | `getEx` | function | Look up an exercise by id in ALL_EX; synthetic "Unknown" fallback | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4763 | `exByName` | function | Memoised name→exercise lookup | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4817 | `getInvolvement` | function | Primary/secondary/tertiary muscle weights for an exercise | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4823 | `add` | function (inner) | Dedup helper inside getInvolvement | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4823 | `add` | handler | Validate and emit a manual food item | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:4845 | `resolveSavedEx` | function | Resolve a saved set-row back to a catalogue exercise | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4857 | `workoutNameGroups` | function | Keyword-guess muscle groups from a workout name | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4883 | `rirIntensity` | function | RIR → intensity factor (1.0 … 0.4) | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4892 | `computeMuscleRecovery` | function | Per-muscle ready/recovering/heavy rows | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4992 | `lkScroller` | function | Get the `.lk-scroll` region | 02a-train-exercises |
| redesign/input/locked-current-v6.html:4999 | `lkScrollTop` | function | Read scroll offset from the region | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5003 | `lkScrollBy` | function | Nudge the region | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5007 | `lkScrollToTop` | function | Reset the region | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5011 | `lkLockScroll` | function | Ref-counted scroll lock | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5017 | `lkUnlockScroll` | function | Ref-counted unlock + restore | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5033 | `lkOverlayRoot` | function | Lazily create the locking portal host | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5061 | `lkSheetRoot` | function | Lazily create the non-locking portal host | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5072 | `lkPortal` | function | Portal children into the right host, with fallback | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5085 | `DraftNum` | component | Decimal-safe numeric input | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5113 | `lkTrapTab` | handler | Focus wrap inside a dialog | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5125 | `lkDialogRef` | function (callback ref) | Dialog focus capture/restore + trap install | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5160 | `useEscape` | hook | Register a close handler on the Escape stack | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5179 | `lkConfirm` | function | Two-tap destructive confirm with 7s disarm | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5199 | `withWorkoutIds` | function | Backfill stable ids onto history rows | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5213 | `sameWorkout` | function | Identity test for a history row | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5227 | `lkKeyActivate` | handler | Enter/Space activation for role=button wrappers | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5234 | `Ic` | component | SVG icon primitive | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5256 | `LoadingSpinner` | component | Pulsing dot + "Loading…" — **DEAD** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5371 | `getBar` | function | Bar lookup, Olympic default | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5375 | `calcPlatesPerSide` | function | Greedy per-side plate breakdown | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5534 | `cardioActivity` | function | v2 activity lookup by id | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5540 | `cardioFieldsFor` | function | Field list for an activity | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5554 | `cardioModalityForLegacy` | function | v1 id → v2 activity id | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5561 | `cardioLegacyForModality` | function | v2 activity id → v1 id | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5568 | `cardioHasField` | function | Does this activity ask for this metric? | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5619 | `mToKm` | function | metres → km | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5620 | `mToMi` | function | metres → miles | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5621 | `kmToM` | function | km → metres | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5622 | `miToM` | function | miles → metres | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5623 | `cardioDist` | function | Display distance in the chosen unit | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5626 | `cardioDistToM` | function | Entered distance → metres | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5630 | `secToClock` | function | mm:ss / h:mm:ss | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5636 | `clockToSec` | function | Parse a clock string to seconds | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5646 | `cardioPrefs` | function | Read cardio preferences with defaults | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5656 | `saveCardioPrefs` | function | Merge-write cardio preferences | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5664 | `cardioMaxHr` | function | Tanaka / Gulati max HR with override | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5689 | `cardioZones` | function | Pick the 3- or 5-zone table | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5697 | `cardioZoneOf` | function | bpm → zone index, −1 below zone 1 | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5709 | `cardioKarvonen` | function | Heart-rate-reserve target | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5729 | `cardioMet` | function | v1 MET picker from speed/watts/RPE | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5793 | `cardioCalories` | function | v1 calorie estimate (watts or MET) | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5821 | `cardioFavorites` | function | Read the favourites array | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5825 | `saveCardioFavorites` | function | Persist favourites | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5830 | `cardioFavKey` | function | Identity = modality | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5835 | `findCardioFav` | function | Locate a matching favourite | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5842 | `isCardioFav` | function | Boolean favourite test | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5846 | `toggleCardioFav` | function | Add/remove a saved setup, new ones first | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5956 | `ccClamp` | function | Clamp | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5957 | `ccRound5` | function | Round to 5 | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5958 | `ccRound1` | function | Round to 0.1 | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5959 | `ccRound2` | function | Round to 0.01 | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5960 | `ccRound3` | function | Round to 0.001 | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5961 | `ccNum` | function | parseFloat with a default | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5965 | `ccKgToLb` | function | kg → lb | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5966 | `ccMphToMPerSec` | function | mph → m/s | 02a-train-exercises |
| redesign/input/locked-current-v6.html:5989 | `ceSurface` | function | Surface row lookup, pavement default | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6019 | `ceSaturationVapourPressurePa` | function | Saturation vapour pressure | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6022 | `cePressureAtElevationPa` | function | Barometric pressure at altitude | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6028 | `ceAirDensity` | function | Air density from temp/elevation/humidity | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6040 | `ceHeadwindComponent` | function | Signed headwind along the travel bearing | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6047 | `ceHarrisBenedictKcalPerDay` | function | RMR per day | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6053 | `ceRmrKcalPerMin` | function | RMR per minute, 1-MET fallback | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6061 | `ceMinettiRunJPerKgPerM` | function | Running cost polynomial vs grade | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6066 | `ceMinettiWalkJPerKgPerM` | function | Walking cost polynomial vs grade | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6071 | `ceGradeMultiplier` | function | Grade cost ratio vs flat — **no call site in range** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6082 | `ceRunAeroJPerKgPerM` | function | Aero cost of running, floored at 0 | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6097 | `ceHeatMultiplier` | function | Capped heat correction, off by default | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6112 | `ceApproxWbgt` | function | Rough WBGT — **no call site in range** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6117 | `ceHeatSafetyLevel` | function | WBGT → risk band — **no call site in range** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6126 | `ceAmbulationKcal` | function | Minetti + surface + aero + heat run/walk model | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6184 | `cePandolfWatts` | function | Pandolf load-carriage watts + Santee downhill | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6200 | `ceLoadCarriageKcal` | function | Rucking/hiking calories | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6244 | `ceCyclingPowerWatts` | function | Martin 1998 power model | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6259 | `ceCyclingKcalFromPower` | function | kJ → kcal at a gross efficiency | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6264 | `ceCyclingKcal` | function | Cycling calories, power-meter or modelled | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6319 | `ceConcept2WattsFromSplit` | function | 500 m split → watts | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6320 | `ceConcept2SplitFromWatts` | function | watts → split — **no call site in range** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6323 | `ceConcept2DisplayedCalPerHour` | function | What the erg screen shows | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6324 | `ceConcept2Kcal` | function | Weight-corrected erg calories | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6329 | `ceStairClimbKcal` | function | Vertical work → calories | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6336 | `ceAcsmLegCyclingVo2` | function | ACSM leg-ergometer VO2 — **no call site in range** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6337 | `ceAcsmArmCyclingVo2` | function | ACSM arm-ergometer VO2 — **no call site in range** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6344 | `ceCorrectMachineDisplay` | function | Divide out console over-read — **no call site in range** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6350 | `ceKeytelKcalPerMin` | function | Heart-rate calories (tier 3) | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6365 | `ceMetToKcalPerMin` | function | MET → kcal/min | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6368 | `ceLookupMetBySpeed` | function | Nearest MET row by mph | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6379 | `ceLookupMetByWatts` | function | MET row by watt band | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6386 | `ceRunningKcalFromDistance` | function | 1 kcal/kg/km rule | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6397 | `ceEstimateCalories` | function | The 5-tier entry point | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6407 | `fromGross` | function (inner) | gross → {gross,net} | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6409 | `pack` | function (inner) | Wrap a result with tier/confidence/range | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6422 | `metFallback` | function (inner) | Tier 4/5 result | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6495 | `ceMerge` | function | Shallow one-directional merge | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6698 | `ceActivityMap` | function | Activity id → engine modality + defaults | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6710 | `ceRidePosition` | function | Ride position → CdA, drops default | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6720 | `cardioBodyProfile` | function | Assemble weight/height/age/sex from 3 sources | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6746 | `cardioEngineInput` | function | Stored record → highest-tier engine input | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6809 | `cardioEstimate` | function | The one function the UI calls; always returns | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6839 | `cardioEnv` | function | Build the environment object (temp only) | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6873 | `isLiftingSession` | function | Not-cardio test | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6881 | `liftVolume` | function | Parse `vol` to storage units | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6887 | `liftSets` | function | Set count, 0 for cardio | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6891 | `cardioMinutes` | function | Total cardio minutes in a list | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6900 | `cardioSessionCalories` | function | Calories from v1 number or v2 object | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6908 | `sessionSummaryLine` | function | One-line session description for the AI | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6927 | `sessionMetaLine` | function | Sub-line under a session in history lists | 02a-train-exercises |
| redesign/input/locked-current-v6.html:6951 | `migrateCardioV2` | function | One-shot v1→v2 cardio migration | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7000 | `cardioPaceSecPerKm` | function | Derived pace | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7005 | `cardioSplit500` | function | Derived 500 m split | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7010 | `cardioSpeedKph` | function | Derived speed | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7015 | `estimateCardioCalories` | function | v1 MET estimate self-calibrated from the last 5 sessions | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7047 | `getExEquip` | function | Read per-exercise bar/plate config | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7057 | `setExEquip` | function | Write per-exercise bar/plate config | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7063 | `ytCreatorFor` | function | Creator name by `exId % 4` | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7066 | `ytSearchVideo` | function | Cached form-video lookup via the worker | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7089 | `ascendFetchDetail` | function | Fetch ExerciseDB detail — **DEAD** | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7098 | `loadExNotes` | function | Read the whole notes object, type-guarded | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7102 | `getExNote` | function | Read one exercise's note text | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7107 | `saveExNote` | function | Write or delete one note | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7118 | `ExerciseNotes` | component | Autosaving per-exercise notes textarea | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7137 | `onChange` | handler | Debounced note save | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7202 | `ExerciseDetailModal` | component | Exercise detail bottom sheet | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7496 | `ExerciseActionSheet` | component | Hold-to-lift action bubble over a logging card | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7530 | `dismiss` | function (inner) | Guarded animated dismissal, runs the action on the way out | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7530 | `dismiss` | handler | Clears result and closes the sheet | 07-misc-gamification |
| redesign/input/locked-current-v6.html:7761 | `ExLib` | component | The whole exercise library (5 screens in one component) | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7774 | `mergedSub` | function (inner) | Merge catalogue + custom exercises for a sub-group | 02a-train-exercises |
| redesign/input/locked-current-v6.html:7798 | `ExBtn` | component (inner) | One exercise row button | 02a-train-exercises |
| redesign/input/locked-current-v6.html:8625 | `ReplacePanel` | component | Search/suggest an alternative exercise to swap in | 02b-train-logging |
| redesign/input/locked-current-v6.html:8625 | `ReplacePanel` | component | Swap-exercise picker (same-muscle or search) | 02a-train-exercises |
| redesign/input/locked-current-v6.html:8782 | `SplitBuilder` | component | Create/edit a split: days, exercises, note blocks | 02b-train-logging |
| redesign/input/locked-current-v6.html:8785 | `initDays` | function | Map a saved split's `exIds`+`blocks` back into ordered `items` | 02b-train-logging |
| redesign/input/locked-current-v6.html:8823 | `sbLongStart` | handler | Arm 350 ms long-press then start a split-builder row drag | 02b-train-logging |
| redesign/input/locked-current-v6.html:8950 | `sbUpdateTarget` | function | Move the dragged row and shift neighbours to the insertion index | 02b-train-logging |
| redesign/input/locked-current-v6.html:8983 | `sbLongCancel` | function | Cancel the pending long-press timer/listener | 02b-train-logging |
| redesign/input/locked-current-v6.html:8993 | `sbDetach` | function | Remove the active drag document listeners | 02b-train-logging |
| redesign/input/locked-current-v6.html:9002 | `sbReset` | function | Clear all split-builder drag refs and state | 02b-train-logging |
| redesign/input/locked-current-v6.html:9012 | `sbDragEnd` | function | Spring-animate the drop and commit the item reorder | 02b-train-logging |
| redesign/input/locked-current-v6.html:9040 | `finish` | handler (inner) | Build + persist the cycle profile, clamp lengths | 06b-cycle |
| redesign/input/locked-current-v6.html:9040 | `finish` | function | Hands `{displayName, username, useKg}` and optional program to the parent | 09-onboarding-system |
| redesign/input/locked-current-v6.html:9040 | `finish` | function | Ends a drag: snap to corner, or treat as a tap | 07-misc-gamification |
| redesign/input/locked-current-v6.html:9040 | `finish` | function | Marks the tutorial seen and calls `p.onDone` | 07-misc-gamification |
| redesign/input/locked-current-v6.html:9127 | `addDay` | handler | Append a named day to the split | 02b-train-logging |
| redesign/input/locked-current-v6.html:9140 | `removeDay` | handler | Delete a day | 02b-train-logging |
| redesign/input/locked-current-v6.html:9147 | `removeItem` | handler | Delete one exercise/block from a day | 02b-train-logging |
| redesign/input/locked-current-v6.html:9147 | `removeItem` | handler | Delete one list item | 04-shopping-budget |
| redesign/input/locked-current-v6.html:9159 | `updateBlock` | handler | Patch a block item's title/notes/duration | 02b-train-logging |
| redesign/input/locked-current-v6.html:9159 | `updateBlock` | handler | Patch a block row (notes / expanded) | 02b-train-logging |
| redesign/input/locked-current-v6.html:9172 | `pickEx` | handler | Append the picked exercise to the day being edited | 02b-train-logging |
| redesign/input/locked-current-v6.html:9187 | `save` | handler | Serialise days into `{exIds, blocks}` and emit the split | 02b-train-logging |
| redesign/input/locked-current-v6.html:9187 | `save` | function | Builds the history record and calls `p.onSave` (double-tap guarded) | 02c-train-hub |
| redesign/input/locked-current-v6.html:9187 | `save` | handler | Validate, estimate, build the record, hand it up | 02e-cardio |
| redesign/input/locked-current-v6.html:9187 | `save` | handler | Persist the new recipe with its computed per-serving | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:9187 | `save` | handler | Validates and persists a new/edited supplement | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:9847 | `NumPad` | component | Non-modal bottom numeric keypad for weight/reps | 02b-train-logging |
| redesign/input/locked-current-v6.html:9851 | `tap` | handler | Append a digit / decimal / delete, capped at 6 chars | 02b-train-logging |
| redesign/input/locked-current-v6.html:9864 | `increment` | handler | ±2.5 / ±5 weight nudge, clamped to 0-9999 | 02b-train-logging |
| redesign/input/locked-current-v6.html:10013 | `WorkoutLog` | component | The live workout logging screen (largest component in the app) | 02b-train-logging |
| redesign/input/locked-current-v6.html:10040 | `getLastSession` | function | Look up the most recent sets for an exercise name | 02b-train-logging |
| redesign/input/locked-current-v6.html:10048 | `staleLast` | function | True when the last session was >31 days ago or undateable | 02b-train-logging |
| redesign/input/locked-current-v6.html:10054 | `mkRow` | function | Build an exercise row, prefilled from last session or 3 blanks | 02b-train-logging |
| redesign/input/locked-current-v6.html:10117 | `mkBlock` | function | Build a note-block row object | 02b-train-logging |
| redesign/input/locked-current-v6.html:10131 | `addBlock` | handler | Append a block row, toasting on failure | 02b-train-logging |
| redesign/input/locked-current-v6.html:10151 | `addWarmupSets` | handler | Prepend two 50 %/70 % warm-up sets | 02b-train-logging |
| redesign/input/locked-current-v6.html:10205 | `toggleSetType` | handler | Cycle normal → warmup → drop, auto-filling 75 % on drop | 02b-train-logging |
| redesign/input/locked-current-v6.html:10231 | `toggleUnilateral` | handler | Flip L/R tracking on a row | 02b-train-logging |
| redesign/input/locked-current-v6.html:10241 | `toggleRowUnit` | handler | Override kg/lb for one row | 02b-train-logging |
| redesign/input/locked-current-v6.html:10258 | `PRESS_EASE` | function | Feature-detect a spring `linear()` easing, else a bezier | 02b-train-logging |
| redesign/input/locked-current-v6.html:10265 | `setPress` | function | Squeeze/release a card under a long press | 02b-train-logging |
| redesign/input/locked-current-v6.html:10285 | `releaseHold` | function | Tear down a pending hold and its listeners | 02b-train-logging |
| redesign/input/locked-current-v6.html:10296 | `holdStart` | handler | Start the 420 ms hold that opens the action sheet | 02b-train-logging |
| redesign/input/locked-current-v6.html:10334 | `holdProps` | function | Spread `onPointerDown`/`onContextMenu` onto a card | 02b-train-logging |
| redesign/input/locked-current-v6.html:10340 | `actionItems` | function | Build the 7-item action sheet list for a row | 02b-train-logging |
| redesign/input/locked-current-v6.html:10377 | `toggleSuperset` | handler | Link/unlink two consecutive exercises | 02b-train-logging |
| redesign/input/locked-current-v6.html:10572 | `noteActivity` | function | Reset idle tracking and re-arm the server idle check | 02b-train-logging |
| redesign/input/locked-current-v6.html:10606 | `pushRest` | function | Schedule the server-side rest notification | 02b-train-logging |
| redesign/input/locked-current-v6.html:10611 | `cancelPushRest` | function | Cancel the scheduled rest notification | 02b-train-logging |
| redesign/input/locked-current-v6.html:10615 | `startRest` | function | Persist the target and start a fresh rest countdown | 02b-train-logging |
| redesign/input/locked-current-v6.html:10631 | `retargetRest` | function | Re-aim an in-flight rest without restarting it | 02b-train-logging |
| redesign/input/locked-current-v6.html:10650 | `pickRest` | function | Set the next rest length, or retarget if one is running | 02b-train-logging |
| redesign/input/locked-current-v6.html:10707 | `rowUsesKg` | function | Resolve a row's effective unit (`kg` override or global) | 02b-train-logging |
| redesign/input/locked-current-v6.html:10715 | `setVal` | function | Write one field of one set, converting weight to storage unit | 02b-train-logging |
| redesign/input/locked-current-v6.html:10715 | `setVal` | function (inner) | Set one check-in item's 1-5 value | 05-coach |
| redesign/input/locked-current-v6.html:10734 | `toggleDone` | function | Tick/untick a set: haptics, animation, PR check, rest start | 02b-train-logging |
| redesign/input/locked-current-v6.html:10783 | `list` | List | `day, fuelLog, addItem, removeItem` | 03b-fuel-main |
| redesign/input/locked-current-v6.html:10809 | `removeSet` | function | Delete one set from a row | 02b-train-logging |
| redesign/input/locked-current-v6.html:10821 | `removeRow` | function | Delete a whole exercise/block row | 02b-train-logging |
| redesign/input/locked-current-v6.html:10828 | `addSet` | function | Append a blank set to a row | 02b-train-logging |
| redesign/input/locked-current-v6.html:10847 | `swipeRubber` | function | Rubber-band resistance for a rightward swipe | 02b-train-logging |
| redesign/input/locked-current-v6.html:10851 | `swipeShouldDelete` | function | Project the swipe with friction and decide if it deletes | 02b-train-logging |
| redesign/input/locked-current-v6.html:10855 | `setSwipe2` | function | Write the set-swipe state to both ref and state | 02b-train-logging |
| redesign/input/locked-current-v6.html:10859 | `setSsSwipe2` | function | Same, for superset pair swipes | 02b-train-logging |
| redesign/input/locked-current-v6.html:10863 | `onTouchStartSet` | handler | Begin tracking a set-row swipe | 02b-train-logging |
| redesign/input/locked-current-v6.html:10877 | `onTouchMoveSet` | handler | Track dx/velocity, abort on vertical scroll, tick at -80 px | 02b-train-logging |
| redesign/input/locked-current-v6.html:10914 | `onTouchEndSet` | handler | Delete the set if the projected swipe passes the threshold | 02b-train-logging |
| redesign/input/locked-current-v6.html:10922 | `onTouchCancelSet` | handler | Reset the swipe | 02b-train-logging |
| redesign/input/locked-current-v6.html:10944 | `onLongPressStart` | handler | Arm the 350 ms hold that enters wiggle/reorder mode | 02b-train-logging |
| redesign/input/locked-current-v6.html:10971 | `onLongPressCancel` | function | Cancel the pending reorder long-press | 02b-train-logging |
| redesign/input/locked-current-v6.html:10981 | `updateDragTarget` | function | Move the dragged card and shift others to the target index | 02b-train-logging |
| redesign/input/locked-current-v6.html:11008 | `detachDragHandlers` | function | Remove the reorder document listeners | 02b-train-logging |
| redesign/input/locked-current-v6.html:11017 | `resetDragState` | function | Clear all reorder refs and state | 02b-train-logging |
| redesign/input/locked-current-v6.html:11030 | `cancelDrag` | function | Abort a reorder (Escape / touchcancel), snapping back | 02b-train-logging |
| redesign/input/locked-current-v6.html:11040 | `beginDrag` | function | Lift a card, snapshot geometry, attach drag listeners | 02b-train-logging |
| redesign/input/locked-current-v6.html:11167 | `onDragEnd` | function | Spring to the drop position and splice `rows` | 02b-train-logging |
| redesign/input/locked-current-v6.html:11254 | `startWiggleDrag` | handler | Start a drag from a card already in wiggle mode | 02b-train-logging |
| redesign/input/locked-current-v6.html:11259 | `exitWiggleMode` | function | Leave wiggle mode and reset drag state | 02b-train-logging |
| redesign/input/locked-current-v6.html:11304 | `wrapRow` | function | Cross-fade a row between its compact and full renderings | 02b-train-logging |
| redesign/input/locked-current-v6.html:11334 | `compactShell` | function | The jiggling compact card used in wiggle mode | 02b-train-logging |
| redesign/input/locked-current-v6.html:11379 | `getSetVal` | function | Read a set field for the NumPad, converting weight for display | 02b-train-logging |
| redesign/input/locked-current-v6.html:13956 | `AISplitBuilder` | component | AI split builder: mode picker, chat, photo import | 02c-train-hub |
| redesign/input/locked-current-v6.html:13973 | `getConvoSys` | function | Builds the conversational coach system prompt | 02c-train-hub |
| redesign/input/locked-current-v6.html:13979 | `getGenSys` | function | Builds the program-generation system prompt from prior answers | 09-onboarding-system |
| redesign/input/locked-current-v6.html:13979 | `getGenSys` | function | Builds the program-generation system prompt from collected answers | 02c-train-hub |
| redesign/input/locked-current-v6.html:13992 | `callWorker` | function | POSTs `{system,max_tokens,messages}` to the Worker and normalises the reply | 09-onboarding-system |
| redesign/input/locked-current-v6.html:13992 | `callWorker` | function | Raw POST to the Cloudflare Worker; extracts text from Anthropic- or OpenAI-shaped replies | 02c-train-hub |
| redesign/input/locked-current-v6.html:14013 | `tryParse` | function | Extracts and JSON-parses the `###PROGRAM_START/END###` block | 02c-train-hub |
| redesign/input/locked-current-v6.html:14023 | `startChat` | function | Opens the chat mode and fetches the first coach turn | 02c-train-hub |
| redesign/input/locked-current-v6.html:14058 | `send` | function | Submits an answer; after 3 answers switches to program generation | 09-onboarding-system |
| redesign/input/locked-current-v6.html:14058 | `send` | function | Sends a user answer; forces generation after 6 answers | 02c-train-hub |
| redesign/input/locked-current-v6.html:14058 | `send` | function (inner) | Optimistically append the user turn and fire | 05-coach |
| redesign/input/locked-current-v6.html:14147 | `handlePhoto` | function | Reads the selected image into a data URL for preview | 02c-train-hub |
| redesign/input/locked-current-v6.html:14157 | `analyzePhoto` | function | Sends the typed split description for conversion (image not sent) | 02c-train-hub |
| redesign/input/locked-current-v6.html:14176 | `saveSplits` | function | Normalises the AI program into split objects and hands them up | 02c-train-hub |
| redesign/input/locked-current-v6.html:14881 | `AdaptiveTrainingCard` | component | Muscle-recovery readout + rule-based training suggestion | 02c-train-hub |
| redesign/input/locked-current-v6.html:14911 | `Pill` | function (render helper) | One muscle pill with last-trained/hours-remaining | 02c-train-hub |
| redesign/input/locked-current-v6.html:14940 | `Section` | function (render helper) | A labelled group of pills; null when empty | 02c-train-hub |
| redesign/input/locked-current-v6.html:15013 | `TrainHub` | component | The Train tab: sub-tabs, splits, history, sub-screens | 02c-train-hub |
| redesign/input/locked-current-v6.html:15017 | `toggleSplitOpen` | handler | Flips a split's expanded flag and persists the map | 02c-train-hub |
| redesign/input/locked-current-v6.html:15965 | `Review` | component | Post-workout summary → reflection → AI insight → save/discard | 02c-train-hub |
| redesign/input/locked-current-v6.html:16001 | `setRating` | handler | Sets one reflection score | 02c-train-hub |
| redesign/input/locked-current-v6.html:16065 | `submitReflection` | function | Assembles the personalized coach prompt and requests the insight | 02c-train-hub |
| redesign/input/locked-current-v6.html:16622 | `ConvertToSplitModal` | component | Bottom-sheet flow turning a logged workout into a split day | 02c-train-hub |
| redesign/input/locked-current-v6.html:16629 | `resolveExId` | function | Exact-name lookup of an exercise id in `ALL_EX` | 02c-train-hub |
| redesign/input/locked-current-v6.html:16635 | `convertToNewSplit` | handler | Creates a new split with this workout as day 1 | 02c-train-hub |
| redesign/input/locked-current-v6.html:16653 | `convertToExistingSplit` | handler | Appends this workout as a new day on a chosen split | 02c-train-hub |
| redesign/input/locked-current-v6.html:17084 | `WorkoutDetail` | component | Read + edit view of one history entry | 02c-train-hub |
| redesign/input/locked-current-v6.html:17110 | `setExSet` | handler | Immutably updates one field of one set in edit mode | 02c-train-hub |
| redesign/input/locked-current-v6.html:17126 | `addExSet` | handler | Appends a blank set (rir "2") to an exercise | 02c-train-hub |
| redesign/input/locked-current-v6.html:17140 | `removeExSet` | handler | Removes one set | 02c-train-hub |
| redesign/input/locked-current-v6.html:17152 | `removeExercise` | handler | Removes a whole exercise from the edited workout | 02c-train-hub |
| redesign/input/locked-current-v6.html:17159 | `saveEdit` | function | Recomputes totals and emits the updated workout | 02c-train-hub |
| redesign/input/locked-current-v6.html:17858 | `ProactiveTipCard` | component | Daily AI "today's insight" card, cached per day | 02c-train-hub |
| redesign/input/locked-current-v6.html:17998 | `DynamicFeed` | component | Rule-based home feed: check-in, readiness, rest, comeback, next split | 02c-train-hub |
| redesign/input/locked-current-v6.html:18441 | `DsHeader` | component | Large-title page header w/ eyebrow, subtitle, actions, tint wash | 10-shared |
| redesign/input/locked-current-v6.html:18489 | `DsSection` | component | Titled section wrapper w/ action slot and footnote | 10-shared |
| redesign/input/locked-current-v6.html:18513 | `DsCard` | component | Elevated/soft surface card, optional accent border, keyboard-activatable | 10-shared |
| redesign/input/locked-current-v6.html:18530 | `DsRow` | component | List row: leading/label/detail/value/trailing, 48 or 38 px | 10-shared |
| redesign/input/locked-current-v6.html:18573 | `DsSegmented` | component | ARIA tablist segmented control | 10-shared |
| redesign/input/locked-current-v6.html:18610 | `DsStat` | component | Uppercase label + tabular-nums value + unit + detail | 10-shared |
| redesign/input/locked-current-v6.html:18649 | `getFuelSettings` | function | Read `lk_fuelSettings` with defaults `{waterGoalMl:null, hideNumbers:false, framing:"remaining"}` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18656 | `setFuelSettings` | function | Merge-patch fuel settings, persist, dispatch `lockedFuelUpdate` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18716 | `FDC_NUT_IDS` | const map | USDA FDC nutrient id → internal micro key | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18731 | `sumDayNutrients` | function | Sum all micros across a day's four meal slots, tracking gaps | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18761 | `nutrientTargets` | function | Sex- and calorie-scaled micro goals with min/max/info type | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18819 | `scaleNut` | function | Scale a per-100g micro object by a factor, 1 dp | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18830 | `offNut100` | function | Map OpenFoodFacts `*_100g` fields to internal micro keys | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18842 | `normFoodName` | function | Lowercase/trim/collapse a food name into a match key | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18845 | `_chipCache` | module var | Identity-keyed memo for recent/frequent foods | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18852 | `getRecentFoods` | function | Last N distinct logged foods, newest first | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18878 | `getFrequentFoods` | function | Foods logged ≥3× in the last N days, by count | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18911 | `getFavFoods` | function | Read `lk_favFoods` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18914 | `isFav` | function | Is a name in favourites | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18920 | `toggleFav` | function | Add/remove a favourite, stamp `savedAt`, dispatch event | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18936 | `slotForNow` | function | Meal slot from the current hour (11/15/21 cutoffs) | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18943 | `nextSlot` | function | Next meal slot in cyclic order | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18947 | `isTrainingDayToday` | function | Did a workout happen today | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18955 | `waterGoal` | function | Water target: override, else 35 ml/kg to nearest 50, else 3000 | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18961 | `normalizeGTIN` | function | Strip non-digits; pad a 12-digit UPC to 13 | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18966 | `getBarcodeCache` | function | Read `lk_barcodeCache` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18969 | `cacheBarcode` | function | Store a resolved product under its GTIN with `fetchedAt` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18977 | `offSodiumMg` | function | Sodium mg from OFF `sodium_100g`, else `salt_100g / 2.5` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:18982 | `parseOffProduct` | function | OFF product JSON → internal per-100g item; null without kcal | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19002 | `lookupBarcode` | function | My Store → cache → OpenFoodFacts → USDA resolution chain | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19076 | `loadZXing` | function | Inject the ZXing UMD bundle from unpkg once | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19093 | `computeTrend` | function | EMA (α=0.10) weight trend series | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19095 | `log` | handler | Log every previewed item to the chosen meal | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:19095 | `log` | handler | Log all analysed items and reset the tab | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:19095 | `log` | handler | Build and add the scaled recipe item | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19112 | `trendOnOrBefore` | function | Last trend point at or before a date | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19118 | `weeklyRatePct` | function | Weekly weight change as %/kg from the trend | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19132 | `avgIntake` | function | Mean calories over N days, logged days only | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19159 | `calcBMR` | function | Revised Harris–Benedict BMR, sex-split | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19169 | `applyCalFloor` | function | Clamp a target to max(BMR, 1200 F / 1500 M) | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19181 | `calcTDEEInfo` | function | BMR × activity multiplier, goal deficit/surplus, floored | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19206 | `reconcileTDEE` | function | Observed TDEE from 14 d of intake vs weight-trend change | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19259 | `applyAdaptiveTDEE` | function | Weekly 70/30 blend, ±150 kcal step, rewrite targets + macros | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19301 | `cloneFoodItem` | function | Shallow clone with a copied `nut` object | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19306 | `normalizeAiItems` | function | Coerce AI meal items into logged-item shape, `src:"ai"`, `est` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19326 | `nameSimilarity` | function | Token-overlap ratio between two food names | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19342 | `dailyIntakeSeries` | function | Per-day totals for the last N days incl. fiber/sodium | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19376 | `exportFuelCSV` | function | Two-table CSV of the food diary and the weight log | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19400 | `exportFuelJSON` | function | Full nutrition-domain JSON bundle | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19415 | `downloadText` | function | Blob + synthetic anchor download, URL revoked after 500 ms | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19436 | `exportEverything` | function | Raw dump of every `lk_`/`__lk_ts__` localStorage key | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19454 | `importEverything` | function | Restore a backup; additive by stamp unless `overwrite` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19499 | `PANTRY_EXPIRY_DAYS` | const map | Category → shelf-life days | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19508 | `pantryUseSoon` | function | Is a pantry item within 3 days of its shelf life | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19514 | `pantryBestPrice` | function | Cheapest recorded price for an item | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19521 | `pantryLastPriceFor` | function | Most recent price for a fuzzy name match | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19531 | `depletePantry` | function | Decrement pantry stock on a log; auto-add to shopping when empty | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19560 | `UNIT_GRAMS` | const map | 25 unit→gram equivalences | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19586 | `parseFoodText` | function | AI-parse free text into `{qty,unit,food}` tuples | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19605 | `tupleGrams` | function | Tuple + food entry → grams | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19611 | `matchTupleLocal` | function | Score-match a tuple against favs/groceries/FOODS, build item | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19614 | `scoreName` | inner function | 3/2/1/0 name-match score | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19681 | `matchTuples` | function | Split tuples into matched items and unmatched | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19693 | `DayNutritionPanel` | component | Collapsible micronutrient table for a day | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19781 | `TrendsTab` | component | Nutrition trends: calorie bars, averages grid, weight line | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19787 | `avg` | inner function | Mean of a series key over logged days | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19959 | `getUserRecipes` | function | Read `lk_userRecipes` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19962 | `saveUserRecipes` | function | Persist recipes and dispatch `lockedFuelUpdate` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19987 | `yieldFactorFor` | function | First matching yield factor for a name | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19993 | `effectiveGrams` | function | Convert cooked grams back to raw/dry grams | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:19999 | `calcRecipe` | function | Per-serving macros + micros for a recipe | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20039 | `RecipeLogSheet` | component | Bottom sheet to log N servings of a recipe to a slot | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20275 | `RecipeBuilder` | component | Create a user recipe from searched/manual ingredients | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20288 | `pickerResults` | inner function | Substring search over FOODS + groceries + favs, cap 8 | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20330 | `addIng` | handler | Append a picked ingredient at 100 g | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20339 | `addManual` | handler | Add a pantry item by hand | 04-shopping-budget |
| redesign/input/locked-current-v6.html:20339 | `addManual` | handler | Add a user-typed store | 04-shopping-budget |
| redesign/input/locked-current-v6.html:20339 | `addManual` | handler | Append a hand-entered per-100g ingredient | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20363 | `updIng` | handler | Patch one ingredient immutably | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20800 | `QuickChip` | component | Tap-to-log / hold-to-favourite food chip | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20803 | `down` | handler | Start the 500 ms long-press timer | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20811 | `up` | handler | Cancel the timer; tap-log if it never fired | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20859 | `BarcodeTab` | component | Six-mode barcode scan / lookup / log screen | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20885 | `stopCam` | handler | Clear the poll, reset ZXing, stop all camera tracks | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20903 | `onCode` | handler | A code was decoded: stop the camera and look it up | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20907 | `doLookup` | handler | Normalise, set loading, resolve, branch found/notfound | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20930 | `startScan` | handler | Acquire the camera and start BarcodeDetector or ZXing | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:20987 | `logFound` | handler | Log the scaled product and auto-save it to My Store | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21030 | `logNotFound` | handler | Log hand-entered label values and save to My Store | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21050 | `reset` | handler | Stop the camera and return to idle | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21050 | `reset` | function | Clears all plates | 07-misc-gamification |
| redesign/input/locked-current-v6.html:21550 | `FuelDisplayCard` | component | Settings card: hide numbers + dashboard framing | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21552 | `upd` | handler (inner) | Merge a patch into the cycle profile | 06b-cycle |
| redesign/input/locked-current-v6.html:21552 | `upd` | handler | Patch fuel settings and mirror into local state | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21678 | `PrivacyCard` | component | Collapsible five-section privacy disclosure | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21680 | `row` | function (inner) | Settings row layout (label + control + description) | 06b-cycle |
| redesign/input/locked-current-v6.html:21680 | `row` | inner function | Title + body paragraph pair | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21680 | `row` | function | Render a title/sub/switch row | 06-profile |
| redesign/input/locked-current-v6.html:21751 | `TdeeReportCard` | component | Weekly adaptive-TDEE check-in banner, dismissible | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21853 | `MC_PHASE_INFO` | const map | Per-phase description and training guidance copy | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21904 | `MC_PREG_END` | const map | Events that terminate a pregnancy | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21911 | `mcISO` | function | Local-date → `YYYY-MM-DD` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21914 | `mcParse` | function | `YYYY-MM-DD` → local `Date` | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21918 | `mcAddDays` | function | Shift an ISO date by N days | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21923 | `mcDiff` | function | Whole-day difference between two ISO dates | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21926 | `mcFmt` | function | ISO date → "Mon D" | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21931 | `mcTodayISO` | function | Today as ISO | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21946 | `isFemaleUser` | function | True if `profile.sex` or `fuelProfile.sex` is female | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21952 | `mcPregEnds` | function | Sorted dates of abortion/miscarriage events | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21960 | `mcPeriodStarts` | function | Derive period start dates from flow ≥2 runs, excluding post-pregnancy bleeds | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:21990 | `mcCompute` | function | Full cycle model: avg length, SD, confidence, phase, ovulation, fertile and PMS windows, pregnancy recovery, EC adjustment | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22053 | `phaseOfDay` | inner function | Cycle day → phase name | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22062 | `dayOfDate` | inner function | ISO date → cycle day number | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22150 | `mcSymptomBuckets` | function | Per-symptom during/before/total counts | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22184 | `mcSymLabel` | function | Symptom id → label | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22189 | `mcPreSymptoms` | function | Symptoms occurring ≥60% pre-period with ≥3 logs | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22199 | `mcExportData` | function | Share or download cycle JSON via Web Share, else Blob download | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22233 | `mcAthleteFlags` | function | Detect long gaps / missed cycles against training history | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22319 | `mcInsights` | function | Build the phrased insight list from buckets and flags | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22404 | `mcPolar` | function | Polar→cartesian for the cycle dial | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22411 | `mcArcPath` | function | SVG arc path between two angles | 03a-fuel-panels |
| redesign/input/locked-current-v6.html:22417 | `McRing` | component | 272px SVG cycle ring with phase arcs, today marker and drag-scrub | 06b-cycle |
| redesign/input/locked-current-v6.html:22466 | `angA` | function (inner) | Start angle for a cycle day | 06b-cycle |
| redesign/input/locked-current-v6.html:22469 | `angB` | function (inner) | End angle for a cycle day | 06b-cycle |
| redesign/input/locked-current-v6.html:22476 | `scrub` | handler (inner) | Pointer position → previewed cycle day | 06b-cycle |
| redesign/input/locked-current-v6.html:22596 | `CycleTrackerCard` | component | Home-feed cycle card: setup promo or day/phase status | 06b-cycle |
| redesign/input/locked-current-v6.html:22751 | `McOnboarding` | component | 5-step cycle setup wizard | 06b-cycle |
| redesign/input/locked-current-v6.html:22776 | `Btn` | component (inner) | Full-width orange primary CTA used across onboarding steps | 06b-cycle |
| redesign/input/locked-current-v6.html:22794 | `optBtn` | function (inner) | Renders a selectable option row with label + description | 06b-cycle |
| redesign/input/locked-current-v6.html:23147 | `McLogSheet` | component | Bottom sheet for logging one day (flow, symptoms, mood, energy, sleep, sex, events, note) | 06b-cycle |
| redesign/input/locked-current-v6.html:23160 | `setEv` | handler (inner) | Set or delete one event key | 06b-cycle |
| redesign/input/locked-current-v6.html:23167 | `cycleSym` | handler (inner) | Advance a symptom through severity 0→1→2→3→0 | 06b-cycle |
| redesign/input/locked-current-v6.html:23754 | `McCalendar` | component | Month grid with logged/predicted period, fertile and PMS overlays, stats and history chart | 06b-cycle |
| redesign/input/locked-current-v6.html:23788 | `cellISO` | function (inner) | Day number → ISO date for the displayed month | 06b-cycle |
| redesign/input/locked-current-v6.html:24066 | `McSettings` | component | Cycle settings sheet: lengths, irregular, BC, discreet, cloud backup, export, delete | 06b-cycle |
| redesign/input/locked-current-v6.html:24073 | `exportData` | handler (inner) | Export button handler | 06b-cycle |
| redesign/input/locked-current-v6.html:24104 | `toggle` | function (inner) | iOS-style switch used by settings rows | 06b-cycle |
| redesign/input/locked-current-v6.html:24405 | `McHealthCard` | component | Surfaces an athlete/amenorrhea health flag with acknowledge or doctor-export | 06b-cycle |
| redesign/input/locked-current-v6.html:24501 | `McRecoveryCard` | component | Post-abortion/miscarriage recovery explainer with expectation window and red-flag advice | 06b-cycle |
| redesign/input/locked-current-v6.html:24587 | `McEcCard` | component | Morning-after-pill aftermath card, dismissable | 06b-cycle |
| redesign/input/locked-current-v6.html:24654 | `McTrainingCard` | component | Phase/symptom-aware training guidance with lighter/keep decision | 06b-cycle |
| redesign/input/locked-current-v6.html:24777 | `McNutritionCard` | component | Phase-specific fuel tip with dismiss and Open Fuel link | 06b-cycle |
| redesign/input/locked-current-v6.html:24873 | `mcFuelAdjustOn` | function | Reads the luteal calorie-allowance preference | 06b-cycle |
| redesign/input/locked-current-v6.html:24876 | `mcFuelContext` | function | Builds the cycle context object Fuel would consume (phase, tip, ironFocus, calAdj) | 06b-cycle |
| redesign/input/locked-current-v6.html:24912 | `mcLutealCalBump` | function | 5% of base calories, rounded to 10, capped at 150 kcal | 06b-cycle |
| redesign/input/locked-current-v6.html:24915 | `McFuelStrip` | component | Fuel-tab cycle strip: phase tip, iron progress, luteal kcal toggle | 06b-cycle |
| redesign/input/locked-current-v6.html:25064 | `McTrainBanner` | component | Train-tab nudge when today's cycle log looks rough | 06b-cycle |
| redesign/input/locked-current-v6.html:25108 | `CycleTrackerScreen` | component | The whole cycle screen: state owner, ring/calendar views, cards, sheets | 06b-cycle |
| redesign/input/locked-current-v6.html:25128 | `setMcp` | handler (inner) | Persist + set the cycle profile | 06b-cycle |
| redesign/input/locked-current-v6.html:25132 | `updateDay` | handler (inner) | Merge a patch into one day and persist the whole day map | 06b-cycle |
| redesign/input/locked-current-v6.html:25194 | `quickLogPeriod` | handler (inner) | One-tap log/unlog today's period at flow 3 | 06b-cycle |
| redesign/input/locked-current-v6.html:26141 | `QuickActionsRow` | component | Renders up to 3 configurable quick-action tiles with a transient flash message | 01-home |
| redesign/input/locked-current-v6.html:26147 | `run` | handler (inner) | Dispatches a quick action: water logs, others navigate | 01-home |
| redesign/input/locked-current-v6.html:26220 | `HomeScreen` | component | The whole Home tab: header, layout blocks, recap view, workout detail routing | 01-home |
| redesign/input/locked-current-v6.html:26274 | `calKey` | function (inner) | Builds a zero-padded YYYY-MM-DD key for a calendar day number | 01-home |
| redesign/input/locked-current-v6.html:26274 | `calKey` | function (closure) | `YYYY-MM-DD` for a day in the displayed month | 02d-progress-prs |
| redesign/input/locked-current-v6.html:26976 | `getBfLog` | function | Reads the body-fat log from storage | 01-home |
| redesign/input/locked-current-v6.html:26979 | `addBfEntry` | function | Appends a bf entry, sorts by date, persists | 01-home |
| redesign/input/locked-current-v6.html:26992 | `GoalsTab` | component | Goals list/detail/add plus the body-fat log sub-screen | 01-home |
| redesign/input/locked-current-v6.html:27022 | `setGoals` | function (inner) | State setter that also persists goals to localStorage | 01-home |
| redesign/input/locked-current-v6.html:27032 | `toDisp` | function (inner) | Converts a stored kg bodyweight to the display unit | 01-home |
| redesign/input/locked-current-v6.html:27032 | `toDisp` | function (closure) | kg → display unit | 02d-progress-prs |
| redesign/input/locked-current-v6.html:27032 | `toDisp` | function (closure) | Bodyweight kg → display unit | 02d-progress-prs |
| redesign/input/locked-current-v6.html:27036 | `toKg` | function (inner) | Converts a displayed value back to kg — **never called** | 01-home |
| redesign/input/locked-current-v6.html:27036 | `toKg` | function (closure) | Display unit → stored unit | 02d-progress-prs |
| redesign/input/locked-current-v6.html:27039 | `getCurrentValue` | function (inner) | Resolves a goal's current value by type | 01-home |
| redesign/input/locked-current-v6.html:27060 | `getProgress` | function (inner) | Percent complete, clamped 0-100 | 01-home |
| redesign/input/locked-current-v6.html:27069 | `getDaysLeft` | function (inner) | Days until the goal deadline | 01-home |
| redesign/input/locked-current-v6.html:27076 | `openAdd` | function (inner) | Resets the form and opens the add view | 01-home |
| redesign/input/locked-current-v6.html:27076 | `openAdd` | handler | Resets the form and opens it in add mode | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:27076 | `openAdd` | handler | Resets the cycle form, opens `add` view | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:27088 | `openEdit` | function (inner) | Prefills the form from an existing goal | 01-home |
| redesign/input/locked-current-v6.html:27088 | `openEdit` | handler | Hydrates the form from an existing supplement | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:27088 | `openEdit` | handler | Hydrates the cycle form from an existing cycle | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:27101 | `saveGoal` | function (inner) | Validates, computes the start baseline, creates or updates a goal | 01-home |
| redesign/input/locked-current-v6.html:27145 | `completeGoal` | function (inner) | Marks a goal completed with today's date | 01-home |
| redesign/input/locked-current-v6.html:27155 | `deleteGoal` | function (inner) | Logs and removes a goal, resetting selection | 01-home |
| redesign/input/locked-current-v6.html:27169 | `logBf` | function (inner) | Validates and stores a body-fat entry | 01-home |
| redesign/input/locked-current-v6.html:27187 | `getAiBfEstimate` | function (inner) | Builds and sends the AI body-fat estimate prompt | 01-home |
| redesign/input/locked-current-v6.html:27212 | `getGoalAiAnalysis` | function (inner) | Builds and sends the AI goal-analysis prompt | 01-home |
| redesign/input/locked-current-v6.html:28323 | `ProgressPage` | component | Progress hub: tabs, featured lifts, bodyweight chart, calendar | 02d-progress-prs |
| redesign/input/locked-current-v6.html:28342 | `setFeaturedIds` | function (closure) | Functional setter that mirrors featured lifts to storage | 02d-progress-prs |
| redesign/input/locked-current-v6.html:28349 | `getFirstLogged` | function (closure) | Earliest logged heaviest set for an exercise | 02d-progress-prs |
| redesign/input/locked-current-v6.html:28369 | `getCurrentPR` | function (closure) | Max-weight record from `prs[exId]` | 02d-progress-prs |
| redesign/input/locked-current-v6.html:29165 | `PRHub` | component | PR vault: list, detail, charts, manual PR logging | 02d-progress-prs |
| redesign/input/locked-current-v6.html:29186 | `doLog` | handler | Validate and persist a manually logged PR | 02d-progress-prs |
| redesign/input/locked-current-v6.html:30153 | `ProfileScreen` | component | Profile tab: identity, lifetime stats, badges, PRs | 06-profile |
| redesign/input/locked-current-v6.html:30585 | `ProgressPhotos` | component | Progress-photo gallery, lightbox and AI analysis | 06-profile |
| redesign/input/locked-current-v6.html:30602 | `addFocusWork` | function | Append prescribed exercises to a chosen split day | 06-profile |
| redesign/input/locked-current-v6.html:30621 | `analysePhoto` | function | POST photo + context to the physique-analysis Worker and parse JSON | 06-profile |
| redesign/input/locked-current-v6.html:30684 | `handleFile` | handler | Read the picked image as a base64 data URL | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:30684 | `handleFile` | function | Resize and persist a chosen/captured image | 06-profile |
| redesign/input/locked-current-v6.html:30699 | `removePhoto` | function | Delete one photo and close the lightbox | 06-profile |
| redesign/input/locked-current-v6.html:30709 | `openLightbox` | function | Open the lightbox at an index, resetting analysis | 06-profile |
| redesign/input/locked-current-v6.html:30714 | `prevPhoto` | function | Wrap to the previous photo | 06-profile |
| redesign/input/locked-current-v6.html:30719 | `nextPhoto` | function | Wrap to the next photo | 06-profile |
| redesign/input/locked-current-v6.html:30724 | `groups` | function | Group photos by month, newest month first | 06-profile |
| redesign/input/locked-current-v6.html:31492 | `LayoutEditor` | component | Home-screen layout editor | 06-profile |
| redesign/input/locked-current-v6.html:31494 | `setLayout` | function | Persist and set layout state | 06-profile |
| redesign/input/locked-current-v6.html:31511 | `toggleHide` | function | Add/remove a block from `hidden` | 06-profile |
| redesign/input/locked-current-v6.html:31520 | `toggleQuick` | function | Toggle a quick action, capped at 3 | 06-profile |
| redesign/input/locked-current-v6.html:31533 | `labelOf` | function | Map a block id to its display label | 06-profile |
| redesign/input/locked-current-v6.html:31756 | `NotificationsCard` | component | Settings UI for the push switch and per-type prefs | 09-onboarding-system |
| redesign/input/locked-current-v6.html:31756 | `NotificationsCard` | component | Push permission, per-type prefs, sound, test | 06-profile |
| redesign/input/locked-current-v6.html:31770 | `reread` | function | Re-pull `P.status()` into state | 06-profile |
| redesign/input/locked-current-v6.html:31828 | `timeRow` | function | Render a labelled `<input type=time>` | 06-profile |
| redesign/input/locked-current-v6.html:31945 | `TextSizeCard` | component | Root font-size scaling control | 06-profile |
| redesign/input/locked-current-v6.html:31953 | `apply` | function | Persist and apply a text scale | 06-profile |
| redesign/input/locked-current-v6.html:31987 | `StorageCard` | component | localStorage usage meter | 06-profile |
| redesign/input/locked-current-v6.html:31994 | `refresh` | async function | Re-uploads the reminder context, throttled to 60s | 09-onboarding-system |
| redesign/input/locked-current-v6.html:31994 | `refresh` | async fn | Re-send context snapshot (throttled) | 10-shared |
| redesign/input/locked-current-v6.html:31994 | `refresh` | function | Re-read usage | 06-profile |
| redesign/input/locked-current-v6.html:32002 | `mb` | function | Format bytes as "N.N MB" | 06-profile |
| redesign/input/locked-current-v6.html:32031 | `SettingsScreen` | component | The full settings screen | 06-profile |
| redesign/input/locked-current-v6.html:32040 | `handleThemeChange` | function | Re-read `lk_theme` | 06-profile |
| redesign/input/locked-current-v6.html:33808 | `Onboarding` | component | The entire 4-step first-run flow | 09-onboarding-system |
| redesign/input/locked-current-v6.html:33835 | `getChatSys` | function | Builds the conversational coach system prompt | 09-onboarding-system |
| redesign/input/locked-current-v6.html:33877 | `tryParseProg` | function | Extracts and `JSON.parse`s the JSON between the two markers | 09-onboarding-system |
| redesign/input/locked-current-v6.html:33888 | `kickoffChat` | function | Sends the seed "hi" turn and renders the first coach question (or a fallback) | 09-onboarding-system |
| redesign/input/locked-current-v6.html:35657 | `estimateMacros` | function | Parses free-text food entries into items + macro totals | 09-onboarding-system |
| redesign/input/locked-current-v6.html:35728 | `calcTDEE` | function | Harris-Benedict BMR × activity multiplier, adjusted for cut/bulk | 09-onboarding-system |
| redesign/input/locked-current-v6.html:35752 | `calcMacros` | function | Splits a TDEE into protein/fat/carb grams by goal | 09-onboarding-system |
| redesign/input/locked-current-v6.html:35763 | `MacroRing` | component | SVG donut progress ring | 03b-fuel-main |
| redesign/input/locked-current-v6.html:35794 | `FuelProfileSetup` | component | Full-screen fuel profile / targets form | 03b-fuel-main |
| redesign/input/locked-current-v6.html:36538 | `WaterCard` | component | Daily water total, unit toggle, +/- controls | 03b-fuel-main |
| redesign/input/locked-current-v6.html:36671 | `SmartNutritionCard` | component | AI meal suggestion fitting remaining macros | 03b-fuel-main |
| redesign/input/locked-current-v6.html:36895 | `FuelTab` | component | Fuel tab shell, targets, sub-tab routing | 03b-fuel-main |
| redesign/input/locked-current-v6.html:37045 | `addItem` | handler | Add or open the merge dialog | 04-shopping-budget |
| redesign/input/locked-current-v6.html:37469 | `MealPlanFuelTab` | component | AI meal plan generation, browsing, swapping | 03b-fuel-main |
| redesign/input/locked-current-v6.html:37493 | `setPlans` | handler | Set state + persist plans | 04-shopping-budget |
| redesign/input/locked-current-v6.html:37585 | `buildMealContext` | function | Build the calorie/macro/store/budget prompt context | 04-shopping-budget |
| redesign/input/locked-current-v6.html:37607 | `generatePlan` | handler | POST worker root, repair + parse the plan JSON | 04-shopping-budget |
| redesign/input/locked-current-v6.html:37716 | `addToShopping` | handler | Push a plan's shoppingList onto the shopping list | 04-shopping-budget |
| redesign/input/locked-current-v6.html:37749 | `deletePlan` | handler | Remove a saved plan | 04-shopping-budget |
| redesign/input/locked-current-v6.html:38554 | `ListTab` | component | Free-text meal entry + today's diary | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:38560 | `estimate` | function (inner) | POST description to /analyze-meal, parse or fall back | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39088 | `ManualEntry` | component | Collapsed prompt + custom macro form | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39298 | `isSpecificQuery` | function | True if query names a brand or contains a digit | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39304 | `rankFoodResults` | function | Score, sort and tag ★BEST across merged pools | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39355 | `SearchTab` | component | Multi-source food search, detail card, My Store | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39373 | `setStoreItems` | function (inner) | Set My Store state and persist to lk_myGroceries | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39377 | `saveUsdaKey` | function (inner) | Persist the USDA key (blank → DEMO_KEY) | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39383 | `searchUSDA` | function (inner) | Query USDA FDC, map nutrient ids to /100g | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39416 | `searchFatSecret` | function (inner) | Query the worker's FatSecret proxy | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39444 | `search` | Search | `day, addItem, removeItem, onScan` (onScan sets `pendingGtin` and jumps to `scan`) | 03b-fuel-main |
| redesign/input/locked-current-v6.html:39444 | `search` | function (inner) | Barcode shortcut, local-first, 3-source fan-out | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39485 | `mergeAndRank` | function (inner) | Dedupe pools by name, then rank | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39543 | `saveToMyStore` | function (inner) | Scale by grams and save to My Store | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:39564 | `logSelected` | function (inner) | Scale selected food by grams and log it | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:40360 | `PhotoTab` | component | Photo/description AI meal analysis | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:40378 | `analyze` | function (inner) | POST base64+description to /analyze-meal | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:40760 | `RecipesTab` | component | Static, AI, pantry and coach recipes | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:40791 | `generatePantryRecipes` | function (inner) | Ask the model for 4 recipes from pantry stock | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:40825 | `generateAIMeals` | function (inner) | Ask the model for 4 goal-matched meals | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:40920 | `RCard` | component (nested) | One recipe card: macros, ingredients, steps, 2 actions | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:40926 | `setShoppingDone` | function (inner) | Set/clear this card's "added to shop" flag | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41833 | `UNIT_NORM` | const map | Canonicalise ~50 unit spellings | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41883 | `smartUnit` | function | Guess a sensible unit from a food name | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41905 | `parseIngredient` | function | Split "2 cups rice" into {name, quantity, unit} | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41945 | `getShoppingList` | function | Read lk_shoppingList | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41948 | `saveShoppingList` | function | Write lk_shoppingList | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41951 | `addShoppingItem` | function | Append a categorised shopping row | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41968 | `removeShoppingItem` | function | Delete a shopping row by id | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41974 | `toggleShoppingItem` | function | Flip a row's checked flag | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41982 | `categorizeItem` | function | Substring-bucket an item into a store aisle | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:41993 | `exportShoppingList` | function | Render the list as grouped plain text | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:42010 | `STORE_PATTERNS` | const map | 13 retailer search-URL templates | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:42067 | `buildStoreSearchUrl` | function | Build a retailer search URL for a query | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:42073 | `getMyStores` | function | Read lk_myStores | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:42076 | `saveMyStores` | function | Write lk_myStores | 03c-fuel-entry |
| redesign/input/locked-current-v6.html:42079 | `MyStoresTab` | component | Store list: quick-add presets, custom form, toggle, delete | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42087 | `setStores` | handler | Set state + persist stores | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42091 | `addPreset` | handler | Add a STORE_PRESETS entry | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42127 | `toggleStore` | handler | Flip `enabled` | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42134 | `deleteStore` | handler | Remove a store by id | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42420 | `ShoppingTab` | component | Shopping list screen | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42435 | `handleSearchChange` | handler | Local typeahead + debounced /store-search fan-out | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42501 | `selectSuggestion` | handler | Fill the input from a suggestion row | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42506 | `normaliseName` | function | Title-case an item name | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42511 | `findDuplicateItem` | function | Exact case-insensitive list lookup | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42538 | `handleMerge` | handler | Resolve merge / separate / cancel | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42562 | `toggleItem` | handler | Check/uncheck a list item | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42566 | `exportList` | handler | Share or copy the list as text | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42585 | `openAllAtStore` | handler | Open up to 10 items at one store | 04-shopping-budget |
| redesign/input/locked-current-v6.html:42619 | `quickAdd` | handler | Add a FITNESS_PICKS entry | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43415 | `getPantry` | function | Read `lk_pantryItems` | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43418 | `savePantry` | function | Write `lk_pantryItems` | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43421 | `addToPantry` | function | Merge receipt items into the pantry; reset staple clocks | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43466 | `suggestRestockInterval` | function | Mean purchase gap (3–60 d) from budget history | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43488 | `getOverdueStaples` | function | Staples past their interval, with overdueDays/onList | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43506 | `autoAddDueStaples` | function | Auto-add due staples once per cycle | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43510 | `alreadyListed` | function | Loose name match against the shopping list | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43533 | `markStapleBought` | function | Stamp lastBought, clear empty | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43542 | `RunningLowCard` | component | Home card for overdue staples | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43578 | `PantryTab` | component | Pantry inventory screen | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43591 | `toggleStaple` | handler | Mark/unmark staple, seed interval | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43600 | `saveInterval` | handler | Validate + save restock interval (1–365) | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43614 | `remove` | handler | Two-tap delete a pantry item | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43614 | `remove` | handler | Delete a favourite | 02e-cardio |
| redesign/input/locked-current-v6.html:43614 | `remove` | handler | Two-tap delete of a supplement | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:43621 | `toggleEmpty` | handler | Flip out-of-stock; add to list on empty | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43964 | `getBudgetData` | function | Read `lk_budgetData` (default `{weeklyTarget:0,history:[],pendingItems:[]}`) | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43971 | `saveBudgetData` | function | Write `lk_budgetData` | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43974 | `BudgetTab` | component | Budget screen: target, receipts, AI swaps/compare, history | 04-shopping-budget |
| redesign/input/locked-current-v6.html:43999 | `setData` | handler | Set state + persist budget data | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44025 | `saveTarget` | handler | Validate + save the weekly target | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44037 | `addPurchase` | handler | Log a manual purchase | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44066 | `handleReceiptPhoto` | handler | Read image, POST /parse-receipt, stage the result | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44156 | `extractReceiptJson` | function | Normalise many possible worker shapes into success/ocr_failure/backend_error | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44242 | `confirmReceipt` | handler | Commit the staged receipt to history + pantry | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44264 | `importCheckedItems` | function | Turn checked list items into a pendingItems entry | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44290 | `getSwaps` | handler | AI cheaper-swap suggestions | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44334 | `comparePrices` | handler | AI cross-store price comparison | 04-shopping-budget |
| redesign/input/locked-current-v6.html:44370 | `deleteEntry` | handler | Remove one history entry | 04-shopping-budget |
| redesign/input/locked-current-v6.html:45228 | `getMealPlans` | function | Read `lk_mealPlans` | 04-shopping-budget |
| redesign/input/locked-current-v6.html:45231 | `saveMealPlans` | function | Write `lk_mealPlans` | 04-shopping-budget |
| redesign/input/locked-current-v6.html:45234 | `MealPlannerTab` | component | Dead duplicate meal planner | 04-shopping-budget |
| redesign/input/locked-current-v6.html:45968 | `ShoppingBudgetTab` | component | Hub shell: 4 sub-tabs + status pills | 04-shopping-budget |
| redesign/input/locked-current-v6.html:46132 | `getSuppLog` | function | Read `lk_suppLog` — supplements module | 04-shopping-budget |
| redesign/input/locked-current-v6.html:46135 | `markSuppTaken` | function | Mark a supplement taken today — supplements module | 04-shopping-budget |
| redesign/input/locked-current-v6.html:46143 | `isSuppTaken` | function | Was a supplement taken on a date — supplements module | 04-shopping-budget |
| redesign/input/locked-current-v6.html:46148 | `getSuppStreak` | function | Consecutive-day streak — supplements module | 04-shopping-budget |
| redesign/input/locked-current-v6.html:46161 | `getDueSupps` | function | Supplements due by time-of-day/frequency — supplements module | 04-shopping-budget |
| redesign/input/locked-current-v6.html:46185 | `SuppReminderCard` | component | Home card listing supplements due now | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:46193 | `take` | function (inner) | Keep the better of two candidates | 02e-cardio |
| redesign/input/locked-current-v6.html:46193 | `take` | handler | Logs a compound taken from the Home card | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:46193 | `take` | handler | Logs a compound taken from the detail screen | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:46193 | `take` | handler | Marks one supplement taken and drops it from the card | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:46193 | `take` | handler | Marks a supplement taken from the list | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:46278 | `SupplementsTab` | component | Full supplement CRUD + history screen | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:46297 | `setSupps` | function | State setter that also persists `lk_supplements` | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47265 | `getCycles` | function | Reads `lk_cycles` | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47268 | `saveCycles` | function | Writes `lk_cycles` | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47271 | `getCycleLog` | function | Reads `lk_cycleLog` | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47274 | `markCompoundTaken` | function | Appends `cycle::compound` to today's log | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47283 | `isCompoundTaken` | function | Whether a compound was logged on a date | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47289 | `getCompoundStreak` | function | Consecutive-day streak for a compound | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47303 | `getDueCompounds` | function | Due list for the Home compounds card | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47334 | `CycleReminderCard` | component | Home card listing compounds due today | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47432 | `CycleTab` | component | Entire cycle module: list, add, detail, compound form | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47461 | `setCycles` | function | State setter that persists `lk_cycles` | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47499 | `addPresetComp` | handler | Prefills the compound form from a preset | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47509 | `openCompEdit` | handler | Hydrates the compound form from `cComps[idx]` | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47519 | `saveComp` | handler | Adds/replaces a compound in the draft cycle | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47544 | `removeComp` | handler | Removes a compound from the draft (no confirm) | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47551 | `calcEndDate` | function | start + weeks*7 → ISO end date | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47557 | `saveCycle` | handler | Validates and persists a cycle | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47588 | `endCycle` | handler | Marks a cycle completed with today's date | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47601 | `deleteCycle` | handler | Removes a cycle and resets the view | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:47615 | `getAiOverview` | handler | Builds the prompt and calls the AI for a cycle overview | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:48931 | `coachDataPrefs` | function | Reads per-key coach data-sharing prefs | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:48931 | `coachDataPrefs` | function | Data-visibility prefs, default all-on | 05-coach |
| redesign/input/locked-current-v6.html:48939 | `coachMemoryItems` | function | Reads saved coach memories | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:48939 | `coachMemoryItems` | function | Normalise legacy + new memory shapes | 05-coach |
| redesign/input/locked-current-v6.html:48947 | `coachMemoryOn` | function | Whether coach memory is enabled | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:48947 | `coachMemoryOn` | function | Memory master switch | 05-coach |
| redesign/input/locked-current-v6.html:48966 | `coachStyle` | function | Resolves the active coach style with a "warm" fallback | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:48966 | `coachStyle` | function | Resolve the selected persona | 05-coach |
| redesign/input/locked-current-v6.html:48981 | `coachTier3For` | function | Keyword-triggers which deep data tiers to include | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:48981 | `coachTier3For` | function | Keyword gate deciding which deep data blocks are attached | 05-coach |
| redesign/input/locked-current-v6.html:49001 | `coachBuildContext` | function | Assembles the full coach system prompt (reads `supplements` at 49181 and `cycles` at 49186 when opted in) | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:49001 | `coachBuildContext` | function | Builds the entire chat system prompt | 05-coach |
| redesign/input/locked-current-v6.html:49269 | `coachContextTokens` | function | Rough token estimate (len/4) | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:49269 | `coachContextTokens` | function | `length/4` token estimate — **no caller in this range** | 05-coach |
| redesign/input/locked-current-v6.html:49277 | `coachOpener` | function | Builds the coach's opening line | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:49277 | `coachOpener` | function | Data-driven empty-state line + chips | 05-coach |
| redesign/input/locked-current-v6.html:49365 | `goals` | 26998 | F-GOAL-001, 003, 004 | 01-home |
| redesign/input/locked-current-v6.html:49386 | `coachVisibleData` | function | Lists which data categories the coach can currently see | 04b-supplements-cycletab |
| redesign/input/locked-current-v6.html:49386 | `coachVisibleData` | function | Human-readable list for the context receipt | 05-coach |
| redesign/input/locked-current-v6.html:49400 | `CoachCardioCard` | component | Cardio session card with locally computed calorie estimate and one-shot log button | 05-coach |
| redesign/input/locked-current-v6.html:49455 | `CoachSetupSection` | component | Collapsible titled section with optional pill | 05-coach |
| redesign/input/locked-current-v6.html:49483 | `CoachSetupPane` | component | The four setup sections: about you, style, memory, data visibility | 05-coach |
| redesign/input/locked-current-v6.html:49490 | `setDataPref` | function (inner) | Write one coach data-visibility pref | 05-coach |
| redesign/input/locked-current-v6.html:49750 | `CoachInterview` | component | Six-question onboarding sheet that has the AI write the instructions block | 05-coach |
| redesign/input/locked-current-v6.html:49757 | `answer` | function (inner) | Record an interview answer, advance or generate | 05-coach |
| redesign/input/locked-current-v6.html:49764 | `generate` | function (inner) | POST the interview answers, parse the instructions block | 05-coach |
| redesign/input/locked-current-v6.html:49915 | `CoachScreen` | component | The whole Coach tab: chat, plan, check-in, setup | 05-coach |
| redesign/input/locked-current-v6.html:49934 | `clearConvo` | function (inner) | Two-tap delete of the conversation | 05-coach |
| redesign/input/locked-current-v6.html:49946 | `toPane` | function (inner) | Validate and apply a deep-linked pane name | 05-coach |
| redesign/input/locked-current-v6.html:49953 | `onEvt` | handler (inner) | `lockedCoachPane` event listener | 05-coach |
| redesign/input/locked-current-v6.html:49959 | `saveCoachName` | function (inner) | Persist a renamed coach (≤24 chars) | 05-coach |
| redesign/input/locked-current-v6.html:50005 | `setCoachMemory` | function (inner) | Functional setter that also persists `lk_coachMemory` | 05-coach |
| redesign/input/locked-current-v6.html:50020 | `setPlan` | function (inner) | Set + persist `lk_coachPlan` | 05-coach |
| redesign/input/locked-current-v6.html:50024 | `saveInstructions` | function (inner) | Save the instructions draft and flash "✓ Saved" | 05-coach |
| redesign/input/locked-current-v6.html:50035 | `applyCoachInstructions` | function (inner) | Apply instructions from chat/interview and banner it | 05-coach |
| redesign/input/locked-current-v6.html:50054 | `fireRequest` | function (inner) | The chat POST, error classification, error rows | 05-coach |
| redesign/input/locked-current-v6.html:50108 | `stopGeneration` | function (inner) | Abort the in-flight reply, optionally silently | 05-coach |
| redesign/input/locked-current-v6.html:50112 | `retryLast` | function (inner) | Drop error rows and re-fire | 05-coach |
| redesign/input/locked-current-v6.html:50125 | `editUserMessage` | function (inner) | Truncate history to a user turn and reload it into the composer | 05-coach |
| redesign/input/locked-current-v6.html:50145 | `handleReply` | function (inner) | Parse every action marker out of a reply and build the assistant row | 05-coach |
| redesign/input/locked-current-v6.html:50342 | `saveCoachSplit` | function (inner) | Convert an AI split payload into app splits | 05-coach |
| redesign/input/locked-current-v6.html:50383 | `saveCoachRecipe` | function (inner) | Persist a recipe to `lk_coachRecipes` | 05-coach |
| redesign/input/locked-current-v6.html:50408 | `saveCoachGoal` | function (inner) | Create a goal with a resolved current value | 05-coach |
| redesign/input/locked-current-v6.html:50452 | `parseShoppingFromCoach` | function (inner) | Split a `###SHOPPING_ADD###` block into item strings | 05-coach |
| redesign/input/locked-current-v6.html:50465 | `parseItemWithQuantity` | function (inner) | Alias for `parseIngredient` | 05-coach |
| redesign/input/locked-current-v6.html:50468 | `saveCoachCardio` | function (inner) | Rebuild and log a cardio session from the AI payload | 05-coach |
| redesign/input/locked-current-v6.html:50479 | `saveCoachFood` | function (inner) | Append AI-parsed food items into today's fuel log | 05-coach |
| redesign/input/locked-current-v6.html:50518 | `saveCoachPlan` | function (inner) | Persist an AI plan | 05-coach |
| redesign/input/locked-current-v6.html:50538 | `getCurrentPhase` | function (inner) | Find the plan phase containing the current week | 05-coach |
| redesign/input/locked-current-v6.html:50553 | `parseTargetValue` | function (inner) | Parse "315 lb"/"12%" style target strings | 05-coach |
| redesign/input/locked-current-v6.html:50568 | `matchTargetToData` | function (inner) | Match a phase target to a PR, bodyweight, bf or goal | 05-coach |
| redesign/input/locked-current-v6.html:50686 | `calcTargetProgress` | function (inner) | Percentage progress toward one phase target | 05-coach |
| redesign/input/locked-current-v6.html:50718 | `calcPhaseProgress` | function (inner) | 40% time + 60% targets, clamped | 05-coach |
| redesign/input/locked-current-v6.html:50743 | `calcOverallProgress` | function (inner) | Mean phase progress across the plan | 05-coach |
| redesign/input/locked-current-v6.html:50999 | `isDeload` | function (inner) | Name/focus substring test for deload weeks | 05-coach |
| redesign/input/locked-current-v6.html:52380 | `checkinScaleLabel` | function | Word label for a 1-5 value | 05-coach |
| redesign/input/locked-current-v6.html:52389 | `checkinStats` | function | 30-day per-item mean/SD, min 14 entries | 05-coach |
| redesign/input/locked-current-v6.html:52413 | `checkinFlag` | function | amber/red at 1/2 SD, stress inverted | 05-coach |
| redesign/input/locked-current-v6.html:52423 | `checkinFlags` | function | Flags for a whole entry | 05-coach |
| redesign/input/locked-current-v6.html:52434 | `checkinLowRun` | function | Consecutive low days from newest | 05-coach |
| redesign/input/locked-current-v6.html:52445 | `checkinPerDay` | function | 1, 2 or 4 check-ins/day | 05-coach |
| redesign/input/locked-current-v6.html:52449 | `checkinCountToday` | function | Count today's entries | 05-coach |
| redesign/input/locked-current-v6.html:52456 | `checkinDoneForDay` | function | Quota met? | 05-coach |
| redesign/input/locked-current-v6.html:52459 | `checkinDoneToday` | function | First entry for today, or null | 05-coach |
| redesign/input/locked-current-v6.html:52476 | `coachCheckinResponse` | function | The local rules engine behind the payoff card | 05-coach |
| redesign/input/locked-current-v6.html:52547 | `FeedbackScreen` | component | The daily check-in pane: form, payoff card, history dots | 05-coach |
| redesign/input/locked-current-v6.html:52557 | `setEntries` | function (inner) | Functional setter that persists `lk_feedback` | 05-coach |
| redesign/input/locked-current-v6.html:52572 | `submit` | function (inner) | Build, evaluate and store a check-in | 05-coach |
| redesign/input/locked-current-v6.html:52572 | `submit` | handler | Validates and converts the typed weight, calls `p.onLog` | 07-misc-gamification |
| redesign/input/locked-current-v6.html:52602 | `dotRow` | function (inner) | 14-day check-in dot strip | 05-coach |
| redesign/input/locked-current-v6.html:52806 | `BetaAdminPanel` | component | Beta code management, activity/AI/feedback log viewers, export, sync | 05-coach |
| redesign/input/locked-current-v6.html:52821 | `setCodes` | function (inner) | Functional setter that persists `lk_betaCodes` | 05-coach |
| redesign/input/locked-current-v6.html:52828 | `addCode` | function (inner) | Append a new uppercase beta code | 05-coach |
| redesign/input/locked-current-v6.html:52839 | `toggleCode` | function (inner) | Revoke / reactivate a code | 05-coach |
| redesign/input/locked-current-v6.html:52848 | `exportAll` | function (inner) | Download codes + all logs as JSON | 05-coach |
| redesign/input/locked-current-v6.html:53210 | `RefeedCard` | component | Renders the refeed-day suggestion card with accept/dismiss | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53312 | `WeightLogCard` | component | Daily weigh-in input + 14-entry history list | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53447 | `getActionLabel` | function | Human-readable one-line summary of a parsed voice action | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53465 | `showVoiceToast` | function | Shows the global `#lockedVoiceToast` element for 3 s | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53477 | `executeVoiceAction` | function | Applies a confirmed voice action to local storage | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53590 | `parsedCardioModality` | function | Maps spoken activity text to a cardio activity id | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53622 | `parsedCardioSeconds` | function | Normalises duration (sec / min / mm:ss) to seconds | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53633 | `parsedCardioMetres` | function | Normalises a spoken distance to metres | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53645 | `buildParsedCardioRecord` | function | Builds a full v2 cardio history record from voice data | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53655 | `draft` | function (inner) | Build the live/save engine record, converting units | 02e-cardio |
| redesign/input/locked-current-v6.html:53700 | `VoiceButtonWrap` | component | Gates the voice button on `lk_voiceEnabled` | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53725 | `startRec` | function | Requests the mic and starts MediaRecorder | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53752 | `stopRec` | function | Stops the recorder (triggers `onstop` → upload) | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53759 | `toggleRec` | function | Start/stop switch for a tap | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53762 | `sendAudio` | function | POSTs the audio blob to the /voice worker | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53781 | `confirm` | handler | Executes the parsed action and closes the sheet | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53796 | `SAFE_B` | IIFE | Measures `env(safe-area-inset-bottom)` in px | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53816 | `bottomGap` | function | Bottom clearance = 82 + safe area + `window.__lkBottomBar` | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53819 | `cornerToXY` | function | Corner id → x/y coordinates | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53850 | `repark` | handler | Re-positions the button on bottom-bar/resize events | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53879 | `applyXY` | function | Writes the transform directly to the DOM node | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53886 | `stopSpring` | function | Cancels an in-flight spring animation | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53892 | `springToPoint` | function | Critically-damped spring to a corner + haptic | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53925 | `rubber` | function | Rubber-band resistance past the viewport edges | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53932 | `onResize` | handler | Re-parks on window resize (corner-dependent effect) | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53944 | `chooseCorner` | function | Projects the fling and picks the destination corner | 07-misc-gamification |
| redesign/input/locked-current-v6.html:53954 | `onMove` | handler | Drag tracking, clamping, velocity smoothing | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54009 | `onEnd` | handler | mouseup/touchend → `finish(false)` | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54012 | `onCancel` | handler | touchcancel → `finish(true)` | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54030 | `onPointerDown` | handler | Starts a drag, seeds offsets and velocity | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54228 | `TutorialOverlay` | component | Three-phase first-run onboarding walkthrough | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54315 | `goNext` | function | Advance a step, or exit to the done phase | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54335 | `goPrev` | function | Go back a step | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54348 | `jumpTo` | function | Jump to a step from the dot indicator | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54359 | `handleTouchStart` | handler | Records swipe origin x | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54362 | `handleTouchEnd` | handler | 50 px swipe threshold → next/prev | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54925 | `PlateCalc` | component | Barbell plate-loading sheet with apply-to-set | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54954 | `applyToNextSet` | function | Writes the computed total into the next unfinished set | 07-misc-gamification |
| redesign/input/locked-current-v6.html:54982 | `pColor` | function | IPF-style colour for a plate weight | 07-misc-gamification |
| redesign/input/locked-current-v6.html:55001 | `pH` | function | Pixel height for a plate weight | 07-misc-gamification |
| redesign/input/locked-current-v6.html:55004 | `pW` | function | Pixel width for a plate weight | 07-misc-gamification |
| redesign/input/locked-current-v6.html:55007 | `addPlate` | function | Adds a plate, keeps the list sorted descending | 07-misc-gamification |
| redesign/input/locked-current-v6.html:55014 | `undoLast` | function | Removes the last plate in the array | 07-misc-gamification |
| redesign/input/locked-current-v6.html:55030 | `fmt` | function | Trims trailing zeros from a 2-dp number | 07-misc-gamification |
| redesign/input/locked-current-v6.html:55510 | `CardioStar` | component | ★/☆ favourite toggle button | 02e-cardio |
| redesign/input/locked-current-v6.html:55510 | `CardioStar` | component | Favourite-toggle star for cardio setups — **out of range, owned by the cardio agent** | 07-misc-gamification |
| redesign/input/locked-current-v6.html:55550 | `CardioFavorites` | component | Favorites tab: chips, list, edit mode | 02e-cardio |
| redesign/input/locked-current-v6.html:55558 | `setFavs` | handler | Persist + set favourites state | 02e-cardio |
| redesign/input/locked-current-v6.html:55571 | `rename` | handler | Commit a favourite rename | 02e-cardio |
| redesign/input/locked-current-v6.html:55587 | `summaryLine` | function | "brand · N min" sub-line | 02e-cardio |
| redesign/input/locked-current-v6.html:55800 | `cardioSecsOf` | function | Session seconds, v2 field with v1 fallback | 02e-cardio |
| redesign/input/locked-current-v6.html:55803 | `cardioMetresOf` | function | Session metres, v2 with v1 fallback | 02e-cardio |
| redesign/input/locked-current-v6.html:55811 | `cardioWeekBuckets` | function | 8 Monday-start weekly buckets | 02e-cardio |
| redesign/input/locked-current-v6.html:55846 | `cardioPBs` | function | Personal bests across a record list | 02e-cardio |
| redesign/input/locked-current-v6.html:55903 | `cardioZoneTime` | function | Minutes per HR zone by session average | 02e-cardio |
| redesign/input/locked-current-v6.html:55924 | `CardioHistory` | component | History tab | 02e-cardio |
| redesign/input/locked-current-v6.html:55962 | `line` | function (inner) | "N min · X km · Y cal" row sub-line | 02e-cardio |
| redesign/input/locked-current-v6.html:55973 | `detailRows` | function (inner) | Expanded session detail rows | 02e-cardio |
| redesign/input/locked-current-v6.html:56216 | `CardioSection` | component | Cardio screen shell + tabs | 02e-cardio |
| redesign/input/locked-current-v6.html:56223 | `openLog` | handler | Open the log flow with/without a preset | 02e-cardio |
| redesign/input/locked-current-v6.html:56297 | `CE_FIELDS` | const (data) | Field definitions: label, unit, kind, icon, engine flag, hint | 02e-cardio |
| redesign/input/locked-current-v6.html:56326 | `CE_FIELD_KEY` | const (data) | field id → stored `metrics` key | 02e-cardio |
| redesign/input/locked-current-v6.html:56337 | `CE_GROUP_TONE` | const (data) | Accent hue per activity group | 02e-cardio |
| redesign/input/locked-current-v6.html:56341 | `ceGroupTone` | function | Group hue lookup with orange default | 02e-cardio |
| redesign/input/locked-current-v6.html:56343 | `CardioLogFlow` | component | The whole 4-step log flow | 02e-cardio |
| redesign/input/locked-current-v6.html:56382 | `setField` | handler | Set one metrics key immutably | 02e-cardio |
| redesign/input/locked-current-v6.html:56416 | `favShape` | function (inner) | Favourite payload from current form state | 02e-cardio |
| redesign/input/locked-current-v6.html:56473 | `header` | function (inner) | Shared step header with optional back button | 02e-cardio |
| redesign/input/locked-current-v6.html:56722 | `numField` | function (inner) | Render one metric input (num / clock / rpe) | 02e-cardio |
| redesign/input/locked-current-v6.html:56765 | `rpeField` | function (inner) | 1-10 effort selector | 02e-cardio |
| redesign/input/locked-current-v6.html:56990 | `ceLabelStyle` | function | Section label style object | 02e-cardio |
| redesign/input/locked-current-v6.html:56993 | `ceCardStyle` | function | Card container style object | 02e-cardio |
| redesign/input/locked-current-v6.html:56996 | `ceRowStyle` | function | Form row style object | 02e-cardio |
| redesign/input/locked-current-v6.html:56999 | `ceRowIcon` | function | 28px icon tile for a form row | 02e-cardio |
| redesign/input/locked-current-v6.html:57007 | `ceInputStyle` | function | Right-aligned input style object | 02e-cardio |
| redesign/input/locked-current-v6.html:57014 | `ceUnitStyle` | function | Unit suffix style object | 02e-cardio |
| redesign/input/locked-current-v6.html:57020 | `CeCount` | component | rAF count-up number, reduced-motion aware | 02e-cardio |
| redesign/input/locked-current-v6.html:57053 | `CeTierMeter` | component | Five-bar estimate-quality meter | 02e-cardio |
| redesign/input/locked-current-v6.html:57081 | `ceEstimateCard` | function (render helper) | The calorie estimate card | 02e-cardio |
| redesign/input/locked-current-v6.html:57141 | `ceImproveHint` | function | "What one more number buys you" copy | 02e-cardio |
| redesign/input/locked-current-v6.html:57147 | `ceSummaryStats` | function (render helper) | Derived pace/speed/split/power/gross rows | 02e-cardio |
| redesign/input/locked-current-v6.html:57186 | `App` | component | Root component, all global state and routing | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57255 | `setWorkout` | fn | Set + persist the active workout | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57283 | `setSplits` | fn | Set + persist splits | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57290 | `setPrs` | fn | Set + persist PRs | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57297 | `setHistory` | fn | Set + persist workout history | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57304 | `addCustom` | fn | Add a custom exercise, invalidate the name index | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57325 | `toggleUnit` | fn | Flip kg/lb and persist to profile | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57338 | `updateProfile` | fn | Merge updates into profile and persist | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57345 | `completeOnboarding` | function | Persists the profile and converts the AI program into `splits` | 09-onboarding-system |
| redesign/input/locked-current-v6.html:57345 | `completeOnboarding` | fn | Persist profile, normalise the AI program | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57408 | `startWorkout` | fn | Begin/restore a session, route to workout or review | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57418 | `finishWorkout` | fn | Persist rows/sec, route to review | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57425 | `saveWorkout` | fn | Commit a session to history, clear active keys, sync | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57537 | `go` | fn | Navigate, maintain the nav stack + history | 08-auth-sync-root |
| redesign/input/locked-current-v6.html:57586 | `renderTab` | fn | Map `screen` to a screen component | 08-auth-sync-root |
| Fire `syncBetaData` once at 00:00 *(unresolved)* | `` | IIFE+interval | Fire `syncBetaData` once at 00:00 | 08-auth-sync-root |
| :19-31 *(unresolved)* | `` | anon block | Applies persisted/system style profile before first paint | 10-shared |
| :36-40 *(unresolved)* | `` | anon block | Applies `lk_textScale` to root font-size | 10-shared |
| :70-74 *(unresolved)* | `` | anon block | Registers `/sw.js` on load | 10-shared |
| :1941-1950 *(unresolved)* | `` | anon | Re-subscribe if permission still granted but subscription gone | 10-shared |
| :2837-2851 *(unresolved)* | `` | anon | 60 s interval; syncs once at 00:00 local | 10-shared |
| :4276-4290 *(unresolved)* | `` | anon IIFE | Append `lk_customEx` entries not already present | 10-shared |
| — *(unresolved)* | `` | setTimeout | Show a CDN error panel if React is absent after 3 s | 08-auth-sync-root |
| — *(unresolved)* | `` | handler | Global capture-phase Escape dispatcher | 02a-train-exercises |
| — *(unresolved)* | `` | IIFE | Whole pre-React auth/sync/paywall module | 08-auth-sync-root |
| — *(unresolved)* | `` | useEffect | Publish `--lk-top-off` | 08-auth-sync-root |
| — *(unresolved)* | `` | function (IIFE) | First unused id ≥ 90000 | 02a-train-exercises |
| — *(unresolved)* | `` | useEffect | `?open=` and `lockedPushOpen` routing | 08-auth-sync-root |
| — *(unresolved)* | `` | useEffect | Re-read history on `lockedHistoryUpdate` (voice writes) | 08-auth-sync-root |
| — *(unresolved)* | `` | try/catch | `createRoot(...).render(<ErrorBoundary><App/></ErrorBoundary>)` | 08-auth-sync-root |
| — *(unresolved)* | `` | setInterval | Sync every 120 s when signed in | 08-auth-sync-root |
| — *(unresolved)* | `` | useEffect | Unwind the nav stack on back | 08-auth-sync-root |
| — *(unresolved)* | `` | useEffect | Backfill the profile from Supabase (DEAD) | 08-auth-sync-root |
| — *(unresolved)* | `` | inline render fn | Est-1RM line chart + range buttons | 02d-progress-prs |
| — *(unresolved)* | `` | inline render fn | Three PR tiles on a vault list row | 02d-progress-prs |
| — *(unresolved)* | `` | useEffect | Mirror the rest timer via `lockedRest` | 08-auth-sync-root |
| — *(unresolved)* | `` | hook (useEffect) | Pins the chat scroller to the bottom on new messages | 02c-train-hub |
| — *(unresolved)* | `` | inline render fn | Est-1RM bar chart per rep record | 02d-progress-prs |
| — *(unresolved)* | `` | inline render fn | Builds the 1RM / Working / Est rows | 02d-progress-prs |
| — *(unresolved)* | `` | hook (useEffect) | Builds context, calls the Worker, caches the tip | 02c-train-hub |
| — *(unresolved)* | `` | useEffect | Pause the workout when backgrounded | 08-auth-sync-root |
| — *(unresolved)* | `` | listener | Sync on foreground | 08-auth-sync-root |
| `:34177-34179` *(unresolved)* | `"I Agree" `onClick` handler` | handler | Records agreement to the beta terms | 09-onboarding-system |
| — *(unresolved)* | `#` | `step` | Question asked | 09-onboarding-system |
| — *(unresolved)* | `**Placeholder**` | component | Renders an icon + name + "Coming soon" | 04b-supplements-cycletab |
| — *(unresolved)* | `**none**` | — | `PlateCalc` persists nothing (54928-54932) | 07-misc-gamification |
| — *(unresolved)* | `--color-accent` | `#F97316` |  | 10-shared |
| — *(unresolved)* | `--color-accent-dark` | `#7C3A0E` |  | 10-shared |
| — *(unresolved)* | `--color-accent-deep` | `#C2410C` |  | 10-shared |
| — *(unresolved)* | `--color-accent-rgb` | `249,115,22` |  | 10-shared |
| — *(unresolved)* | `--color-accent-text` | `#FB923C` |  | 10-shared |
| — *(unresolved)* | `--color-bg` | `#000000` | `#0D1117` | 10-shared |
| — *(unresolved)* | `--color-border` | `rgba(255,255,255,0.09)` | `rgba(48,54,61,0.9)` | 10-shared |
| — *(unresolved)* | `--color-card` | `#1C1C1E` | `#21262D` | 10-shared |
| — *(unresolved)* | `--color-error` | `#F05151` |  | 10-shared |
| `#B91C1C` (shell `<style>` only, `:1226`) *(unresolved)* | `--color-error-deep` | `#B91C1C` (shell `<style>` only, `:1226`) |  | 10-shared |
| — *(unresolved)* | `--color-feature` | `#8B5CF6` |  | 10-shared |
| — *(unresolved)* | `--color-fill1` | `#111113` |  | 10-shared |
| — *(unresolved)* | `--color-fill2` | `#18181B` |  | 10-shared |
| — *(unresolved)* | `--color-fill3` | `#2A2A2F` |  | 10-shared |
| — *(unresolved)* | `--color-info` | `#4186F6` |  | 10-shared |
| — *(unresolved)* | `--color-macro-carbs` | `#F59E0B` |  | 10-shared |
| — *(unresolved)* | `--color-macro-fat` | `#EC4899` |  | 10-shared |
| — *(unresolved)* | `--color-macro-protein` | `#3B82F6` |  | 10-shared |
| — *(unresolved)* | `--color-positive-alt` | `#10B981` |  | 10-shared |
| — *(unresolved)* | `--color-positive-alt-deep` | `#0C875E` |  | 10-shared |
| — *(unresolved)* | `--color-shadow` | `rgba(0,0,0,0.5)` | `rgba(1,4,9,0.4)` | 10-shared |
| — *(unresolved)* | `--color-shadow-light` | `rgba(0,0,0,0.18)` | `rgba(1,4,9,0.15)` | 10-shared |
| `#080809` (`:1228`) *(unresolved)* | `--color-shell-bg` | `#080809` (`:1228`) |  | 10-shared |
| — *(unresolved)* | `--color-shell-card` | `#111113` |  | 10-shared |
| — *(unresolved)* | `--color-shell-fill` | `#18181B` |  | 10-shared |
| — *(unresolved)* | `--color-shell-logo` | `#F97316` |  | 10-shared |
| — *(unresolved)* | `--color-success` | `#22C55E` |  | 10-shared |
| — *(unresolved)* | `--color-success-deep` | `#178841` |  | 10-shared |
| — *(unresolved)* | `--color-surface` | `#0D0D0F` | `#161B22` | 10-shared |
| — *(unresolved)* | `--color-text` | `#F5F5F7` | `#E6EDF3` | 10-shared |
| — *(unresolved)* | `--color-text-muted` | `#A1A1AA` | `#A3ADB8` | 10-shared |
| — *(unresolved)* | `--color-text-subtle` | `#2C2C2E` | `#2D333B` | 10-shared |
| — *(unresolved)* | `--color-text-tertiary` | `#8E8E93` |  | 10-shared |
| — *(unresolved)* | `--color-warning` | `#F59E0B` |  | 10-shared |
| — *(unresolved)* | `--ds-elevated` | `#1C1C1E` | `#21262D` | 10-shared |
| — *(unresolved)* | `--ds-elevated-2` | `#2C2C2E` | `#2D333B` | 10-shared |
| — *(unresolved)* | `--ds-fill` | `rgba(120,120,128,0.20)` | `rgba(139,148,158,0.16)` | 10-shared |
| — *(unresolved)* | `--ds-fill-soft` | `rgba(120,120,128,0.12)` | `rgba(139,148,158,0.09)` | 10-shared |
| — *(unresolved)* | `--ds-grouped` | `#000000` | `#0D1117` | 10-shared |
| — *(unresolved)* | `--ds-material` | `rgba(30,30,32,0.72)` | `rgba(13,17,23,0.72)` | 10-shared |
| — *(unresolved)* | `--ds-separator` | `rgba(84,84,88,0.34)` | `rgba(48,54,61,0.9)` | 10-shared |
| — *(unresolved)* | `--glass-bar` | `rgba(0,0,0,0.78)` | `rgba(13,17,23,0.85)` | 10-shared |
| Always → step 2 (`:34277`) *(unresolved)* | `0` | 1 | — (pitch only) | 09-onboarding-system |
| on claim: `lk_betaCodes`, `lk_betaStatus`, `lk_betaCode`, `lk_betaId` (written at step 2, `:2765-2768`) *(unresolved)* | `0a` | 1 | "Enter code if you have one" | 09-onboarding-system |
| `lk_profile.displayName` (at finish, `:57347`) *(unresolved)* | `1` | 2 | "YOUR NAME" | 09-onboarding-system |
| `lk_profile.username` (`:57348`) *(unresolved)* | `1` | 2 | "USERNAME" | 09-onboarding-system |
| — *(unresolved)* | `1` | `concept2-split` | `watts = 2.80 / (sec500/500)^3` (6319), then `ceConcept2Kcal` | 02e-cardio |
| — *(unresolved)* | `1` | `erg-power` | `kJ = W·min·60/1000`, `kcal = kJ / KJ_PER_KCAL / ROWING_GE` | 02e-cardio |
| — *(unresolved)* | `1` | `vertical-work` | `ceStairClimbKcal` (6329-6334) | 02e-cardio |
| — *(unresolved)* | `1` | `power-meter` | `ceCyclingKcal` | 02e-cardio |
| `lk_profile.useKg` (boolean, `unitChoice === "kg"`, `:34015`/`:57349`) *(unresolved)* | `2` | 3 | "Choose your units" | 09-onboarding-system |
| — *(unresolved)* | `2` | `martin-power-model` | Martin et al. 1998 via `ceCyclingPowerWatts` (6244-…) — CdA from ride position, Crr from `CE_CRR`, air density from `ceAirDensity` | 02e-cardio |
| — *(unresolved)* | `2` | `pandolf-santee` | `ceLoadCarriageKcal` → `cePandolfWatts` | 02e-cardio |
| — *(unresolved)* | `2` | `minetti-environment` | `ceAmbulationKcal` (6126-6177) | 02e-cardio |
| — *(unresolved)* | `2` | `distance-rule` | `ceRunningKcalFromDistance(km, kg)` (6386) | 02e-cardio |
| On the 3rd send, `answerCountRef >= 3` diverts to program generation (`:33935`) *(unresolved)* | `3` | 4 | AI-generated; model told to elicit **days per week available** | 09-onboarding-system |
| `:33837` *(unresolved)* | `3` | 4 | AI-generated; model told to elicit **main goal** | 09-onboarding-system |
| `done` true → the composer is replaced by SAVE MY PROGRAM / Skip (`:34666`) *(unresolved)* | `3` | 4 | — (result shown) | 09-onboarding-system |
| **Yes — "Skip - set up manually"** (`:34747`) *(unresolved)* | `3` | 4 | AI-generated. Model is told to elicit **training experience**. Offline fallback: "Hey {name}! How long have you been training and what is your main goal?" | 09-onboarding-system |
| — *(unresolved)* | `3` | `keytel-hr` | `ceKeytelKcalPerMin` (6350) | 02e-cardio |
| — *(unresolved)* | `4` | `met-lookup` (specific) | `ceMetToKcalPerMin(met, kg) * dur * heat` | 02e-cardio |
| — *(unresolved)* | `5` | `met-lookup` (generic) | same | 02e-cardio |
| — *(unresolved)* | `AI coach chat` | "Unlimited AI Coach / No daily coaching limits" (699) | 10 chats/day, resets midnight (50088) | 08-auth-sync-root |
| :4258-4275 *(unresolved)* | `ALL_EX` build` | IIFE-ish loop | Flatten GROUPS into a searchable list | 10-shared |
| — *(unresolved)* | `Add-to-diary handler` | handler | Log the recipe as one lunch item, 2 s confirm | 03c-fuel-entry |
| — *(unresolved)* | `Add-to-shop handler` | handler | Merge each parsed ingredient into the shopping list | 03c-fuel-entry |
| — *(unresolved)* | `Age` | numeric text input | `null` | 06-profile |
| `https://www.albertsons.com/shop/search-results.html?q=<q>` (v6:42004) *(unresolved)* | `Albertsons` | albertsons.com | **no preset** | 04-shopping-budget |
| `https://www.aldi.us/en/search/?q=<q>` (v6:42007) *(unresolved)* | `Aldi` | aldi.us | yes (v6:42059) | 04-shopping-budget |
| `https://www.amazon.com/s?k=<q>` (v6:41997) *(unresolved)* | `Amazon` | amazon.com | yes (v6:42031) | 04-shopping-budget |
| `https://www.amazon.com/s?k=<q>` (v6:42023) *(unresolved)* | `Amazon Fresh` | fresh.amazon.com | no | 04-shopping-budget |
| `<store.url>/search?q=<q>` (v6:42071) *(unresolved)* | `Any other domain` | — | n/a | 04-shopping-budget |
| — *(unresolved)* | `App Style` | 5 swatches | system light→`light`, else `dark` | 06-profile |
| — *(unresolved)* | `BF log open handler` | handler | Opens the body-fat log, clearing prior AI text | 01-home |
| — *(unresolved)* | `BLOCKS.calendar` | render fn | Current-month grid with today/workout/future day states | 01-home |
| — *(unresolved)* | `BLOCKS.cycle` | render fn | Mounts CycleReminderCard | 01-home |
| — *(unresolved)* | `BLOCKS.cycletrack` | render fn | Mounts CycleTrackerCard for female profiles only | 01-home |
| — *(unresolved)* | `BLOCKS.feed` | render fn | Mounts DynamicFeed | 01-home |
| — *(unresolved)* | `BLOCKS.insight` | render fn | Mounts ProactiveTipCard | 01-home |
| — *(unresolved)* | `BLOCKS.progress` | render fn | VIEW PROGRESS navigation button | 01-home |
| — *(unresolved)* | `BLOCKS.quick` | render fn | Mounts QuickActionsRow with the saved quick ids | 01-home |
| — *(unresolved)* | `BLOCKS.recap` | render fn | Weekly Recap button, shown on Sunday or with week data | 01-home |
| — *(unresolved)* | `BLOCKS.recent` | render fn | Last 5 workouts + See all | 01-home |
| — *(unresolved)* | `BLOCKS.restock` | render fn | Mounts RunningLowCard | 01-home |
| — *(unresolved)* | `BLOCKS.start` | render fn | Full-width START WORKOUT CTA | 01-home |
| — *(unresolved)* | `BLOCKS.stats` | render fn | 2×2 counters: workouts, splits, this week, PRs | 01-home |
| — *(unresolved)* | `BLOCKS.supps` | render fn | Mounts SuppReminderCard | 01-home |
| — *(unresolved)* | `BLOCKS.throwback` | render fn | Computes and renders a throwback card with dismiss | 01-home |
| — *(unresolved)* | `Barcode` | typed digits 39496 / icon 39882 | Exact product when found | 03c-fuel-entry |
| — *(unresolved)* | `Beta Agree onClick` | handler | Claim the code and activate beta | 06-profile |
| — *(unresolved)* | `Beta Verify onClick` | handler | Validate an invite code | 06-profile |
| — *(unresolved)* | `Beta invite code` | text input + Verify | not beta | 06-profile |
| — *(unresolved)* | `Body weight` | decimal input (unit-aware) | `null` | 06-profile |
| — *(unresolved)* | `Boundary` | Scope | Recovery offered | 09-onboarding-system |
| — *(unresolved)* | `Budget tracking` | "Budget Tracking / Grocery & cost analytics" (703) | **Pro only** | 08-auth-sync-root |
| — *(unresolved)* | `Button` | Label | Line | 03b-fuel-main |
| — *(unresolved)* | `COACH_DATA_KEYS` | const array | Toggleable coach data-sharing categories | 04b-supplements-cycletab |
| — *(unresolved)* | `COACH_MARKER_DOCS` | const string | AI action-marker schema block appended to the coach system prompt | 04b-supplements-cycletab |
| — *(unresolved)* | `COACH_STYLES` | const array | Coach personality presets | 04b-supplements-cycletab |
| — *(unresolved)* | `COMPOUND_CATEGORIES` | const array | 5 compound categories with display colours | 04b-supplements-cycletab |
| — *(unresolved)* | `CYCLE_FREQ_OPTS` | const array | 7 frequency options | 04b-supplements-cycletab |
| — *(unresolved)* | `CYCLE_ROUTE_OPTS` | const array | 6 administration routes | 04b-supplements-cycletab |
| — *(unresolved)* | `Check-in frequency map cb` | handler | Render/select a check-in frequency | 06-profile |
| `"08:00"` *(unresolved)* | `Check-in send time` | `<input type=time>` | `"08:00"` | 06-profile |
| — *(unresolved)* | `Coach +Log handler` | handler | Log a single coach ingredient to lunch | 03c-fuel-entry |
| — *(unresolved)* | `Coach add-to-diary handler` | handler | Log every coach ingredient separately to lunch | 03c-fuel-entry |
| — *(unresolved)* | `Coach add-to-shop handler` | handler | Push coach ingredients to the shopping list | 03c-fuel-entry |
| — *(unresolved)* | `Coach instructions` | "Coach Instructions / Fully personalise your AI" (702) | **Pro only** | 08-auth-sync-root |
| — *(unresolved)* | `Coach recipe` | 41668-41702 | Coach-authored; string ingredients get macros split evenly (41671-41677) | 03c-fuel-entry |
| — *(unresolved)* | `Compound reminders` | switch | on | 06-profile |
| `https://www.costco.com/CatalogSearch?keyword=<q>` (v6:41999) *(unresolved)* | `Costco` | costco.com | yes (v6:42039) | 04-shopping-budget |
| — *(unresolved)* | `Customize onClick` | handler | Open LayoutEditor | 06-profile |
| — *(unresolved)* | `Cycle Logging onClick` | handler | Toggle perf tracking and reload | 06-profile |
| — *(unresolved)* | `Cycle logging` | switch + reload | `false` | 06-profile |
| — *(unresolved)* | `D.drop`, `D.gear` | icon path constants | Droplet and gear SVG paths appended to the shared `D` icon map | 03a-fuel-panels |
| — *(unresolved)* | `Daily check-in reminder` | switch | on | 06-profile |
| — *(unresolved)* | `Daily check-ins per day` | 3-way segment | `1` | 06-profile |
| — *(unresolved)* | `Delete Account onClick` | handler | Show the confirmation panel | 06-profile |
| — *(unresolved)* | `Delete Cancel onClick` | handler | Dismiss the confirmation | 06-profile |
| — *(unresolved)* | `Display name` | text input + Save | existing profile value | 06-profile |
| — *(unresolved)* | `Endpoint` | Method | Called from | 01-home |
| — *(unresolved)* | `Endpoint` | Method | Response handling | 02a-train-exercises |
| — *(unresolved)* | `Endpoint` | Method | Payload | 02b-train-logging |
| — *(unresolved)* | `Endpoint` | Method | Auth | 02c-train-hub |
| v6:45907-45967 *(unresolved)* | `FITNESS_PICKS` | const | 12 hardcoded fitness grocery picks | 04-shopping-budget |
| `:34768-35656` *(unresolved)* | `FOODS` | constant (array literal) | ~110-entry per-100g nutrition database | 09-onboarding-system |
| — *(unresolved)* | `Force Refresh onClick` | handler | Clear caches and hard-reload | 06-profile |
| Silent: local `estimateMacros` (`:35657`), then a fixed 400 kcal / 25-45-30 split (38595-38638). **No error shown.** *(unresolved)* | `Free-text AI estimate` | ListTab textarea 38680-38735 | Model-dependent; portion inferred from words only | 03c-fuel-entry |
| — *(unresolved)* | `FuelProfileSetup.save` | handler | Convert units, compute TDEE+macros, emit profile | 03b-fuel-main |
| — *(unresolved)* | `FuelProfileSetup.togglePref` | handler | Add/remove a dietary preference id | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.acceptRefeed` | handler | Accept refeed day, boost carb target | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.addItem` | handler | Append a food item to a meal slot | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.addWater` | handler | Add ml to today's water | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.dismissRefeed` | handler | Dismiss refeed for 5 days | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.getDay` | function | Today's log entry or a default shape | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.handleWeightLog` | handler | Persist a weight entry and re-check refeed | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.removeItem` | handler | Remove a food item by index | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.setDay` | function | Immutable update of today's log entry | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.setFuelLog` | function | State + localStorage writer for fuelLog | 03b-fuel-main |
| — *(unresolved)* | `FuelTab.setFuelProfile` | function | State + localStorage writer for fuelProfile | 03b-fuel-main |
| — *(unresolved)* | `Full backup onClick` | handler | Download a whole-account JSON backup | 06-profile |
| `:34276-34278` *(unresolved)* | `GET STARTED `onClick` handler` | handler | Advances to step 2 unconditionally | 09-onboarding-system |
| — *(unresolved)* | `GOAL_TYPES` | const data | The four goal kinds (lift, weight, bf, custom) with icon/color/desc | 01-home |
| :2975-4257 *(unresolved)* | `GROUPS` | data | Muscle-group → sub-group → exercise catalogue | 10-shared |
| — *(unresolved)* | `Gated feature` | Paywall card | Free-tier limit | 08-auth-sync-root |
| — *(unresolved)* | `Goal` | 3-way segment | `null` | 06-profile |
| — *(unresolved)* | `Goal map cb` | handler | Render a goal segment | 06-profile |
| — *(unresolved)* | `Group id` | Name | Sub-groups | 10-shared |
| — *(unresolved)* | `Guest signup onClick` | handler | Upgrade guest | 06-profile |
| — *(unresolved)* | `Height` | two numeric inputs, ft + in | `null` | 06-profile |
| — *(unresolved)* | `Height` | numeric input, cm | `null` | 06-profile |
| — *(unresolved)* | `Home Layout → block order` | ▲/▼ reorder list (14 blocks) | `HOME_DEFAULT_ORDER` | 06-profile |
| — *(unresolved)* | `Home Layout → hidden blocks` | Hide/Show per row | `{}` | 06-profile |
| — *(unresolved)* | `Home Layout → quick actions` | multi-select chips, max 3 | `["water","checkin","food"]` | 06-profile |
| — *(unresolved)* | `IcMemo` | component (memo) | Memoised Ic — **DEAD** | 02a-train-exercises |
| `https://www.instacart.com/store/search_v3/<q>` (v6:42006) *(unresolved)* | `Instacart` | instacart.com | yes (v6:42051) | 04-shopping-budget |
| — *(unresolved)* | `Key` | Read by | Notes | 02a-train-exercises |
| — *(unresolved)* | `Key` | Read | Where | 02b-train-logging |
| — *(unresolved)* | `Key` | Read at | Notes | 02e-cardio |
| — *(unresolved)* | `Key` | Read | Purpose | 03b-fuel-main |
| — *(unresolved)* | `Key` | Read | Feature | 03c-fuel-entry |
| — *(unresolved)* | `Key` | Read at | Notes | 04b-supplements-cycletab |
| — *(unresolved)* | `Key` | Read | By | 06b-cycle |
| — *(unresolved)* | `Key` | Read at | By | 07-misc-gamification |
| — *(unresolved)* | `Key` | Read | By | 09-onboarding-system |
| — *(unresolved)* | `Key` | Read at | Feature | 01-home |
| `https://www.kroger.com/search?query=<q>` (v6:42001) *(unresolved)* | `Kroger` | kroger.com | yes (v6:42047) | 04-shopping-budget |
| — *(unresolved)* | `LOCKED.onReady` | fn | Run a callback once auth is resolved | 08-auth-sync-root |
| — *(unresolved)* | `LOCKED.setCycleSync` | fn | Toggle opt-in cycle-data cloud sync | 08-auth-sync-root |
| — *(unresolved)* | `Label` | Control type | Default | 06-profile |
| — *(unresolved)* | `LayoutEditor order map cb` | handler | Render one block row | 06-profile |
| — *(unresolved)* | `LayoutEditor quick map cb` | handler | Render one quick-action chip | 06-profile |
| — *(unresolved)* | `LayoutEditor reset onClick` | handler | Two-tap reset to defaults | 06-profile |
| — *(unresolved)* | `Left` | "Log" | 37400–37419 | 03b-fuel-main |
| — *(unresolved)* | `LoadingMemo` | component (memo) | Memoised spinner — **DEAD** | 02a-train-exercises |
| — *(unresolved)* | `Log-Full-Day handler` | handler | Bulk-log the AI plan into its four slots | 03c-fuel-entry |
| — *(unresolved)* | `MC_BC_OPTS` | const array | Birth-control picker options | 03a-fuel-panels |
| — *(unresolved)* | `MC_COL` / `MC_TXT` | const maps | Phase colours (chart / text variants) | 03a-fuel-panels |
| — *(unresolved)* | `MC_EVENTS` | const array | 5 loggable reproductive events | 03a-fuel-panels |
| — *(unresolved)* | `MC_FLOWS` | const array | 5 flow levels, None…Heavy | 03a-fuel-panels |
| — *(unresolved)* | `MC_GOALS` | const array | Cycle-tracking goal options | 03a-fuel-panels |
| — *(unresolved)* | `MC_HBC` | const array | Hormonal birth-control method ids | 03a-fuel-panels |
| — *(unresolved)* | `MC_MOODS` | const array | 8 mood labels | 03a-fuel-panels |
| — *(unresolved)* | `MC_SYMPTOMS` | const array | 12 symptom id/label pairs | 03a-fuel-panels |
| — *(unresolved)* | `Manual macros` | ManualEntry 39094-39110 | Exactly what the user types, **truncated to integers** (39098-39101) | 03c-fuel-entry |
| — *(unresolved)* | `Meal analysis` | "Meal Analysis / USDA-accurate nutrition" (700) | 5/day | 08-auth-sync-root |
| — *(unresolved)* | `MealPlanFuelTab.addToShopping` | handler | Merge a plan's shopping list into the app list | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.buildMealContext` | function | Build the system-prompt context string | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.deletePlan` | handler | Remove a plan by id | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.generateAlternatives` | handler | Fetch 4 AI meal alternatives; canned fallbacks | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.generatePlan` | handler | Request, repair, normalise and save a meal plan | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.logMeal` | handler | Map a plan meal to a log slot and log it | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.selectAlternative` | handler | Overwrite a plan meal with a chosen alternative | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.setPlans` | function | State + localStorage writer for mealPlans | 03b-fuel-main |
| — *(unresolved)* | `MealPlanFuelTab.toggleStar` | handler | Toggle starred and re-sort non-active plans | 03b-fuel-main |
| — *(unresolved)* | `Microphone button` | switch | `true` | 06-profile |
| — *(unresolved)* | `Microphone onClick` | handler | Toggle the floating voice button | 06-profile |
| — *(unresolved)* | `NEW GOAL onClick` | handler | Opens the add form at the type picker | 01-home |
| — *(unresolved)* | `NUTRIENTS_P1` | const array | Primary micros: fiber, sugar, satfat, sodium | 03a-fuel-panels |
| — *(unresolved)* | `NUTRIENTS_P2` | const array | Secondary micros: potassium…folate (9) | 03a-fuel-panels |
| — *(unresolved)* | `Nav` | component (memo) | Bottom tab bar; publishes `--lk-nav-h` | 02a-train-exercises |
| — *(unresolved)* | `Nav` | React.memo | 5-tab bottom bar, publishes `--lk-nav-h` | 08-auth-sync-root |
| — *(unresolved)* | `New password` | two password inputs + button | — | 06-profile |
| — *(unresolved)* | `NotificationsCard sound map cb` | handler | Render one sound option and preview it | 06-profile |
| — *(unresolved)* | `Nutrition CSV onClick` | handler | Download the food-diary CSV | 06-profile |
| — *(unresolved)* | `PRESET_COMPOUNDS` | const array | 32-entry compound database (dose/freq/routes/half-life) | 04b-supplements-cycletab |
| v6:46129-46131 *(unresolved)* | `PRESET_SUPPS / SUPP_TIMES / SUPP_FREQ` | const | Supplement constants — **supplements module, not shopping** | 04-shopping-budget |
| — *(unresolved)* | `Partial reps` | switch (inverted key) | shown (key absent = false) | 06-profile |
| — *(unresolved)* | `Partial reps onClick` | handler | Toggle `hidePartials` (inverted) | 06-profile |
| — *(unresolved)* | `Path` | Where | Accuracy | 03c-fuel-entry |
| — *(unresolved)* | `Photo / AI vision` | PhotoTab 40377-40441 | Lowest — visual portion estimate, totals shown without item breakdown | 03c-fuel-entry |
| — *(unresolved)* | `Plan-my-day handler` | handler | Ask for 4 slot-tagged meals and parse them | 03c-fuel-entry |
| — *(unresolved)* | `ProfileScreen badges map cb` | handler | Render one earned badge | 06-profile |
| — *(unresolved)* | `ProfileScreen bestPRs map cb` | handler | Render one PR row | 06-profile |
| — *(unresolved)* | `ProfileScreen guest-signup onClick` | handler | Launch guest upgrade | 06-profile |
| — *(unresolved)* | `ProfileScreen locked map cb` | handler | Render one locked badge | 06-profile |
| — *(unresolved)* | `ProfileScreen prs forEach cb` | handler | Build bestPRs from the PR map | 06-profile |
| — *(unresolved)* | `ProfileScreen settings onClick` | handler | Navigate to Settings | 06-profile |
| — *(unresolved)* | `ProfileScreen stats map cb` | handler | Render one stat tile | 06-profile |
| — *(unresolved)* | `ProgressPhotos addTarget sheet map cb` | handler | Render one split-day target row | 06-profile |
| — *(unresolved)* | `ProgressPhotos camera onClick` | handler | Build and click a capture input | 06-profile |
| — *(unresolved)* | `ProgressPhotos delete onClick` | handler | Two-tap delete guard | 06-profile |
| — *(unresolved)* | `ProgressPhotos escape handler` | handler | Close the lightbox on Esc | 06-profile |
| — *(unresolved)* | `ProgressPhotos group map cb` | handler | Render a month section of thumbnails | 06-profile |
| — *(unresolved)* | `ProgressPhotos library onClick` | handler | Click the hidden file input | 06-profile |
| — *(unresolved)* | `ProgressPhotos weakPoints map cb` | handler | Render one weak point and its prescription | 06-profile |
| `https://www.publix.com/shopping/product-search#/q=<q>` (v6:42005) *(unresolved)* | `Publix` | publix.com | **no preset** | 04-shopping-budget |
| — *(unresolved)* | `Push notifications` | switch | off | 06-profile |
| — *(unresolved)* | `Quick-add` | **does not exist in my range** | — | 03c-fuel-entry |
| Generation needs POST `/` (`:2664`); logging is offline *(unresolved)* | `Recipe` | 40825-40851, 40791-40824, 41380-41416 | Model-estimated recipe totals | 03c-fuel-entry |
| — *(unresolved)* | `Recipe` | RCard 41125-41150 | Fixed hardcoded recipe totals (40851-40919) | 03c-fuel-entry |
| — *(unresolved)* | `Replay Tutorial onClick` | handler | Restart the onboarding tutorial | 06-profile |
| — *(unresolved)* | `Reset Cancel onClick` | handler | Disarm the reset | 06-profile |
| — *(unresolved)* | `Reset all data onClick` | handler | Arm then wipe every local key and end the session | 06-profile |
| — *(unresolved)* | `Rest timer alerts` | switch | on (absent = on) | 06-profile |
| — *(unresolved)* | `Rest timer sound` | 3-way segment | `"bell"` | 06-profile |
| — *(unresolved)* | `Restock reminders` | switch | on | 06-profile |
| — *(unresolved)* | `Restore onChange` | handler | Read and import a backup file | 06-profile |
| — *(unresolved)* | `Retailer` | Domain key | Preset? | 04-shopping-budget |
| — *(unresolved)* | `Right` | "Meals" | 37420–37437 | 03b-fuel-main |
| `:34671-34673` *(unresolved)* | `SAVE MY PROGRAM `onClick` handler` | handler | Finishes with the generated program | 09-onboarding-system |
| — *(unresolved)* | `STORE_PALETTE` | const array | 10 store accent colours | 03c-fuel-entry |
| — *(unresolved)* | `STORE_PRESETS` | const array | 10 preset retailers with descriptions | 03c-fuel-entry |
| `:1777-1788` *(unresolved)* | `SW `message` listener` | handler | Handles `resubscribe` and re-dispatches taps as `lockedPushOpen` | 09-onboarding-system |
| `:70-74` *(unresolved)* | `SW registration` | inline script | Registers `/sw.js` on window load | 09-onboarding-system |
| — *(unresolved)* | `SYNC NOW onClick` | handler (async) | Force a cloud sync and report the outcome | 06-profile |
| `https://www.safeway.com/shop/search-results.html?q=<q>` (v6:42003) *(unresolved)* | `Safeway` | safeway.com | yes (v6:42063) | 04-shopping-budget |
| — *(unresolved)* | `Save Name onClick` | handler | Commit the display name | 06-profile |
| — *(unresolved)* | `Save Stats onClick` | handler | Convert units and commit body stats | 06-profile |
| — *(unresolved)* | `Send Data to Dev onClick` | handler | Upload beta logs | 06-profile |
| — *(unresolved)* | `SettingsScreen back onClick` | handler | Return to the Profile tab | 06-profile |
| — *(unresolved)* | `SettingsScreen theme effect` | hook | Sync `activeTheme` from the `theme-changed` event | 06-profile |
| — *(unresolved)* | `SettingsScreen voice effect` | hook | Sync voice toggle from `lockedVoiceToggle` | 06-profile |
| — *(unresolved)* | `Sex` | 2-way segment | `null` | 06-profile |
| — *(unresolved)* | `Sex map cb` | handler | Render a sex segment | 06-profile |
| — *(unresolved)* | `Sign Out onClick` | handler | End the session | 06-profile |
| — *(unresolved)* | `SmartNutritionCard.addMeal` | handler | Log the suggested meal to snacks | 03b-fuel-main |
| — *(unresolved)* | `SmartNutritionCard.suggest` | handler | POST remaining macros to Worker, parse JSON meal | 03b-fuel-main |
| — *(unresolved)* | `Split builder` | "Split Builder / Unlimited AI programs" (701) | 1/month | 08-auth-sync-root |
| — *(unresolved)* | `StorageCard effect` | hook | Refresh usage on event + 5s interval | 06-profile |
| — *(unresolved)* | `Streaks and badges` | switch | `false` | 06-profile |
| — *(unresolved)* | `Streaks/badges onClick` | handler | Toggle `gamingLayer` | 06-profile |
| — *(unresolved)* | `Supplement reminders` | switch | on | 06-profile |
| — *(unresolved)* | `THEMES map cb` | handler | Render one theme swatch | 06-profile |
| `https://www.target.com/s?searchTerm=<q>` (v6:41998) *(unresolved)* | `Target` | target.com | yes (v6:42035) | 04-shopping-budget |
| Partial — local `FOODS` (`:34768`) and My Store render offline (39546-39549); USDA/FatSecret/OFF need network *(unresolved)* | `Text search` | SearchTab 39493-39587 | Highest — real per-100 g database values | 03c-fuel-entry |
| — *(unresolved)* | `Text size` | 4-way segment | `100` | 06-profile |
| — *(unresolved)* | `TextSizeCard options map cb` | handler | Render one size option | 06-profile |
| — *(unresolved)* | `Tier` | Method id | Formula | 02e-cardio |
| — *(unresolved)* | `Token` | dark (base) | slate | 10-shared |
| — *(unresolved)* | `Token` | dark (`:root`) | slate | 10-shared |
| `https://www.traderjoes.com/home/search#?q=<q>` (v6:42002) *(unresolved)* | `Trader Joe's` | traderjoes.com | yes (v6:42055) | 04-shopping-budget |
| — *(unresolved)* | `Training day reminder` | switch | on | 06-profile |
| `"07:30"` *(unresolved)* | `Training day send time` | `<input type=time>` | `"07:30"` | 06-profile |
| — *(unresolved)* | `Unfinished workout nudge` | switch | on | 06-profile |
| — *(unresolved)* | `Update Password onClick` | handler (async) | Validate and change the password | 06-profile |
| `:34106-34120` *(unresolved)* | `Verify `onClick` handler` | handler | Validates the invite code locally then remotely | 09-onboarding-system |
| — *(unresolved)* | `VoiceButton` | component (memo) | Draggable mic button + capture + result sheet | 07-misc-gamification |
| `https://www.walmart.com/search?q=<q>` (v6:41996) *(unresolved)* | `Walmart` | walmart.com | yes (v6:42027) | 04-shopping-budget |
| — *(unresolved)* | `WaterCard.add` | handler | Convert oz→ml and add water | 03b-fuel-main |
| — *(unresolved)* | `WaterCard.minus` | handler | Subtract one glass, clamped at 0 | 03b-fuel-main |
| — *(unresolved)* | `Weight Unit onClick` | handler | Toggle kg/lb display | 06-profile |
| — *(unresolved)* | `Weight selector` | "Weight Selector / AI-assisted load picking" (704) | **Pro only** | 08-auth-sync-root |
| — *(unresolved)* | `Weight unit` | toggle pill | kg (`p.useKg !== false`) | 06-profile |
| `https://www.wholefoodsmarket.com/search?text=<q>` (v6:42000) *(unresolved)* | `Whole Foods` | wholefoodsmarket.com | yes (v6:42043) | 04-shopping-budget |
| — *(unresolved)* | `YIELD_FACTORS` | const array | Regex→cooked/raw yield factor for rice/pasta/oats/meat | 03a-fuel-panels |
| — *(unresolved)* | `Yes, Delete onClick` | handler (async) | Permanently delete the account | 06-profile |
| sync timestamp stamps (F:236-240, F:1181-1184, F:1193) *(unresolved)* | `__lk_ts__lk_mcProfile`, `__lk_ts__lk_mcDays` | — | sync timestamp stamps (F:236-240, F:1181-1184, F:1193) | 06b-cycle |
| — *(unresolved)* | `_forgotPassword` | async fn | Send a reset email for the typed address | 08-auth-sync-root |
| — *(unresolved)* | `_resendConfirmation` | async fn | `auth.resend({type:"signup"})` | 08-auth-sync-root |
| — *(unresolved)* | `_submitAuth` | async fn | Validate, sign up or in, map every error | 08-auth-sync-root |
| — *(unresolved)* | `_zxingP` | module var | Cached ZXing load promise | 03a-fuel-panels |
| — *(unresolved)* | `abs` | Abs | Weighted, Bodyweight | 10-shared |
| `:57410-57411`, `:57370-57371` region → `:57370`, `:57371` *(unresolved)* | `activeWorkoutRows` / `activeWorkoutSec` | yes | `startWorkout`/`finishWorkout` (adjacent to `completeOnboarding`) | 09-onboarding-system |
| — *(unresolved)* | `add close handler` | handler | Closes the add/edit form | 01-home |
| — *(unresolved)* | `adduc` | Adductors | All | 10-shared |
| — *(unresolved)* | `any unknown key` | — | denied | 08-auth-sync-root |
| — *(unresolved)* | `back` | Back | Lats, Mid Back, Lower Back, Traps | 10-shared |
| v6.html:10500-10515 *(unresolved)* | `banner measure effect` | hook (`useLayoutEffect`) | Measure the rest banner and reserve its height | 02b-train-logging |
| — *(unresolved)* | `beta activity sink` | via `logBetaActivity` (2772) | saveGoal, deleteGoal, logBf | 01-home |
| `:34090-34093` *(unresolved)* | `beta-code `onChange` handler` | handler | Uppercases the code and clears the error | 09-onboarding-system |
| — *(unresolved)* | `bf back handler` | handler | Closes the body-fat log screen | 01-home |
| — *(unresolved)* | `bf input onChange` | handler | Sanitises the bf input to digits and dots | 01-home |
| — *(unresolved)* | `bf method onClick` | handler | Selects a measurement method | 01-home |
| — *(unresolved)* | `bfLog` | 26977 (getBfLog, called 27002 and 26980) | F-GOAL-006 | 01-home |
| — *(unresolved)* | `biceps` | Biceps | Long Head, Short Head | 10-shared |
| v6.html:10433-10435 *(unresolved)* | `blockSheet` | hook (`useSheetDrag`) | Drag-to-dismiss for the Add Block sheet | 02b-train-logging |
| `:1944-1951` *(unresolved)* | `boot self-heal` | IIFE tail | Re-subscribes if the flag is on but the subscription is gone | 09-onboarding-system |
| — *(unresolved)* | `budget data` | `getBudgetData()` 53538 | F-MISC-006 | 07-misc-gamification |
| — *(unresolved)* | `budget data key` | 43964 (via `getBudgetData`, called 37599) | Weekly grocery budget for the prompt | 03b-fuel-main |
| — *(unresolved)* | `calves` | Calves | All | 10-shared |
| — *(unresolved)* | `changePassword` | async fn | `auth.updateUser({password})` | 08-auth-sync-root |
| `:76-90`+ *(unresolved)* | `checkDeployVersion` | IIFE | Compares deployed version and busts caches on change | 09-onboarding-system |
| :81-116 *(unresolved)* | `checkDeployVersion` | named IIFE | Version check + cache bust + reload | 10-shared |
| — *(unresolved)* | `checkDeployVersion` | IIFE | Compare `/app-version` to `lk_deployVersion`, bust cache | 08-auth-sync-root |
| — *(unresolved)* | `chest` | Chest | Upper Chest, Mid Chest, Lower Chest | 10-shared |
| — *(unresolved)* | `coachInstructions` | 27230 | F-GOAL-005 | 01-home |
| — *(unresolved)* | `cycle` | Stack | none | 03b-fuel-main |
| — *(unresolved)* | `dark` | Dark | `#1C1C1E` | 06-profile |
| — *(unresolved)* | `delete confirm handler` | handler | Double-tap confirmation before deleting | 01-home |
| — *(unresolved)* | `deleteAccount` | async fn | `DELETE /user/delete` then sign out | 08-auth-sync-root |
| — *(unresolved)* | `detail back handler` | handler | Returns to the list and clears the AI text | 01-home |
| — *(unresolved)* | `diary render IIFE` | function (inline) | Group diary items by meal and render totals | 03c-fuel-entry |
| `:1648-1657` *(unresolved)* | `disable` | async function | Unsubscribes locally and on the Worker | 09-onboarding-system |
| :1648-1658 *(unresolved)* | `disable` | async fn | Unsubscribe | 10-shared |
| `:34374-34376` *(unresolved)* | `dispName` `onChange` handler` | handler | Stores the display name verbatim | 09-onboarding-system |
| v6.html:11223-11239 *(unresolved)* | `drag autoscroll effect` | hook | Edge auto-scroll while dragging an exercise | 02b-train-logging |
| v6.html:11223-11239 area (11215-11222 + 11223-11239) *(unresolved)* | `drag cleanup effect` | hook | Remove listeners / cancel RAF on unmount | 02b-train-logging |
| v6.html:10539-10570 *(unresolved)* | `elapsed-clock effect` | hook | 500 ms wall-clock tick + 5 s idle poll | 02b-train-logging |
| :1577-1647 *(unresolved)* | `enable` | async fn | Permission, SW ready, VAPID fetch, subscribe | 10-shared |
| `:1578-1646` *(unresolved)* | `enable` | async function | Requests permission, subscribes, registers with the Worker | 09-onboarding-system |
| — *(unresolved)* | `exercise Change onClick` | handler | Clears the chosen exercise | 01-home |
| — *(unresolved)* | `exercise result onClick` | handler | Picks an exercise and clears the query | 01-home |
| — *(unresolved)* | `ez` | EZ Curl Bar | 25 | 07-misc-gamification |
| — *(unresolved)* | `fetchSubscription` | async fn | `GET /user/check` → subscription/usage/limits | 08-auth-sync-root |
| — *(unresolved)* | `filteredPresets` | derived value | Preset compounds filtered by category + query | 04b-supplements-cycletab |
| — *(unresolved)* | `filteredPresets` | derived value | Presets minus already-added, filtered by query | 04b-supplements-cycletab |
| — *(unresolved)* | `forceSyncNow` | async fn | Manual sync bypassing the workout guard | 08-auth-sync-root |
| — *(unresolved)* | `forearms` | Forearms | All | 10-shared |
| :4455-4463 *(unresolved)* | `freezeWeightStorageUnit` | named IIFE | Resolve+record the unit at boot; sets the retired migration guard | 10-shared |
| — *(unresolved)* | `fuelLog` | 26125 | F-HOME-001 | 01-home |
| — *(unresolved)* | `fuelLog` | 36910; 37008 (via listener re-read) | Per-day meals + water | 03b-fuel-main |
| — *(unresolved)* | `fuelProfile` | 36913; 37585, 37608 (direct `ld` in MealPlanFuelTab) | Fuel profile and targets | 03b-fuel-main |
| — *(unresolved)* | `fuelSettings` | 18650 (via `getFuelSettings`, called at 36899) | `hideNumbers`, `framing`, unused `waterGoalMl` | 03b-fuel-main |
| — *(unresolved)* | `gDate onChange` | handler | Updates the deadline | 01-home |
| — *(unresolved)* | `gExSearch onChange` | handler | Updates the exercise query | 01-home |
| — *(unresolved)* | `gName onChange` | handler | Updates the goal name | 01-home |
| — *(unresolved)* | `gNotes onChange` | handler | Updates the notes | 01-home |
| — *(unresolved)* | `gTarget onChange` | handler | Sanitises the target to digits and dots | 01-home |
| — *(unresolved)* | `gamingLayer` | 26430, 26483 | F-HOME-002, F-HOME-011 | 01-home |
| :1809-1818 *(unresolved)* | `getSound` / `setSound` | fn | Alert sound preference (`bell`/`plate`/`none`) | 10-shared |
| — *(unresolved)* | `getToken` | async fn | Return `session.access_token` | 08-auth-sync-root |
| — *(unresolved)* | `glutes` | Glutes | All | 10-shared |
| — *(unresolved)* | `goal card onClick` | handler | Opens the goal detail | 01-home |
| — *(unresolved)* | `goal card onClick` | handler | Opens the goal detail | 01-home |
| — *(unresolved)* | `grams-preview IIFE` | function (inline) | Recompute the four macro tiles from grams | 03c-fuel-entry |
| — *(unresolved)* | `greeting IIFE` | inline function | Picks a time-of-day greeting string | 01-home |
| — *(unresolved)* | `hams` | Hamstrings | All | 10-shared |
| — *(unresolved)* | `headers` | async fn | JSON + `Authorization: Bearer` header object | 08-auth-sync-root |
| — *(unresolved)* | `homeLayout` | 26066 (via getHomeLayout, called 26526) | F-HOME-003 | 01-home |
| — *(unresolved)* | `https://i.ytimg.com/vi/<videoId>/hqdefault.jpg` | GET (`<img src>`) | `onError` hides the `<img>` | 02a-train-exercises |
| AI Rec (v6.html:13588) via `aiCall` (v6.html:2663-2696) *(unresolved)* | `https://lockedapi.cescocugliari.workers.dev/` | POST | `{system, max_tokens: 700, messages:[{role:"user", content}]}`, headers from `authHeaders()` incl. `Authorization: Bearer <session.access_token>` (v6.html:2652-2662) | 02b-train-logging |
| `{system, max_tokens: 700, messages:[{role:"user", content}]}`, headers from `authHeaders()` (2665-2678) *(unresolved)* | `https://lockedapi.cescocugliari.workers.dev/` | POST | `getGoalAiAnalysis` (27233), `getAiBfEstimate` (27204) | 01-home |
| — *(unresolved)* | `https://lockedapi.cescocugliari.workers.dev/` | POST | none | 02c-train-hub |
| — *(unresolved)* | `https://lockedapi.cescocugliari.workers.dev/` | POST | `Bearer` from `window.LOCKED.session` | 02c-train-hub |
| — *(unresolved)* | `https://lockedapi.cescocugliari.workers.dev/` | POST | none | 02c-train-hub |
| — *(unresolved)* | `https://lockedapi.cescocugliari.workers.dev/exercise-detail/{id}` | GET | `r.json()`, no catch — **never called** | 02a-train-exercises |
| — *(unresolved)* | `https://lockedapi.cescocugliari.workers.dev/yt-search` | POST, `application/json` | reads `d.videoId`; caches on hit; `null` on miss or any error | 02a-train-exercises |
| — *(unresolved)* | `https://static.exercisedb.dev/media/<hash>.gif` | GET (`<img src>`) | `onError` hides the `<img>` | 02a-train-exercises |
| — *(unresolved)* | `https://www.youtube.com/watch?v=<videoId>` | `window.open(_blank)` | n/a | 02a-train-exercises |
| — *(unresolved)* | `id` | label | card | 06-profile |
| — *(unresolved)* | `id` | name | lb | 07-misc-gamification |
| v6.html:10608-10620 *(unresolved)* | `idle-push effect` | hook | Arm the server idle check, handle `lockedPushOpen` and `?open=` | 02b-train-logging |
| `:34702-34704` *(unresolved)* | `input `onChange` handler` | handler | Tracks the composer text | 09-onboarding-system |
| `:34705-34707` *(unresolved)* | `input `onKeyDown` handler` | handler | Sends on Enter | 09-onboarding-system |
| — *(unresolved)* | `isTrainingDay IIFE` | function (inline) | True if p.history has an entry dated today | 03c-fuel-entry |
| :45-56 *(unresolved)* | `keyboardChrome` | named IIFE | Toggles `.lk-kb-open` from visualViewport | 10-shared |
| `:33828-33833` *(unresolved)* | `kickoff effect` | hook (`useEffect` on `[step]`) | Auto-starts the AI interview 100ms after reaching step 4 | 09-onboarding-system |
| v6.html:10021-10041 *(unresolved)* | `lastSessionIndex` | memo | name → `{sets, date}` index over workout history | 02b-train-logging |
| — *(unresolved)* | `lastSync formatter IIFE` | function | Human-readable last-sync string | 06-profile |
| — *(unresolved)* | `light` | Light | `#FFFFFF` | 06-profile |
| v6.html:57926 *(unresolved)* | `lk_activeWorkout` | no | v6.html:57926 | 02b-train-logging |
| v6.html:10405, 10646, 10658, 10679, 11549 *(unresolved)* | `lk_activeWorkoutRestTarget` | yes | v6.html:10405, 10646, 10658, 10679, 11549 | 02b-train-logging |
| v6.html:10388, 10664 *(unresolved)* | `lk_activeWorkoutRows` | yes | v6.html:10388, 10664 | 02b-train-logging |
| v6.html:10398, 10665 *(unresolved)* | `lk_activeWorkoutSec` | yes | v6.html:10398, 10665 | 02b-train-logging |
| `:2783-2790` *(unresolved)* | `lk_betaAILog` | yes | `logBetaAI` | 09-onboarding-system |
| `:2767` *(unresolved)* | `lk_betaCode` | — | `claimBetaCode` | 09-onboarding-system |
| `:2700-2720`, `:2723`, `:2765` *(unresolved)* | `lk_betaCodes` | yes | `initBetaCodes`, `validateBetaCode`, `claimBetaCode` | 09-onboarding-system |
| `:2768`, `:2794` *(unresolved)* | `lk_betaId` | yes | `claimBetaCode`, `isSilentBeta`, loggers | 09-onboarding-system |
| `:2772-2779` *(unresolved)* | `lk_betaLog` | yes | `logBetaActivity` | 09-onboarding-system |
| inside `aiCall` (`:2699`) *(unresolved)* | `lk_betaStatus` | inside `aiCall` (`:2699`) | F-FUEL-420, 421, 423 | 03c-fuel-entry |
| `:2766`, `:2771`, `:2782` *(unresolved)* | `lk_betaStatus` | yes | `claimBetaCode`, `logBetaActivity`, `logBetaAI` | 09-onboarding-system |
| — *(unresolved)* | `lk_cardioFavorites` | `cardioFavorites` 5822 | Array of saved cardio setups | 02a-train-exercises |
| — *(unresolved)* | `lk_cardioFavorites` | 55551, 56218, 56282, 56591 (via `isCardioFav`), 56655, 56434 — all resolving to 5822 | The only key this module writes directly | 02e-cardio |
| — *(unresolved)* | `lk_cardioMigrated` | 6954 | One-shot migration flag, set even when 0 rows migrated | 02a-train-exercises |
| — *(unresolved)* | `lk_cardioPrefs` | `cardioPrefs` 5647 | `{distUnit, weeklyTargetMin, maxHrOverride, zoneModel, restingHr}` | 02a-train-exercises |
| — *(unresolved)* | `lk_cardioPrefs` | 55555 (`cardioPrefs`, 5647), 55908 (via `cardioMaxHr`, 5665) | `prefs` at 55555 is unused | 02e-cardio |
| not in range (written `:50399`) *(unresolved)* | `lk_coachRecipes` | 40773 | F-FUEL-424 | 03c-fuel-entry |
| — *(unresolved)* | `lk_customEx` | 4278 (outside range, feeds `ALL_EX`) | Custom exercises created by F-TRAIN-008 | 02a-train-exercises |
| — *(unresolved)* | `lk_cycleLog` | 47292, 2813, 1506 | Date→`cycle::compound` keys; never pruned | 04b-supplements-cycletab |
| — *(unresolved)* | `lk_cycles` | 47286, 2812, 1505 | Cycle list; synced (201) | 04b-supplements-cycletab |
| `:79`, `:84-90` *(unresolved)* | `lk_deployVersion` | yes | `checkDeployVersion` | 09-onboarding-system |
| — *(unresolved)* | `lk_exNotes` | `loadExNotes` 7098, `getExNote` 7102 | One object keyed by `String(exId)`, value `{text, updated}` | 02a-train-exercises |
| — *(unresolved)* | `lk_exequip_<exerciseId>` | `getExEquip` 7048 | One key per exercise; unbounded growth | 02a-train-exercises |
| `:1422` *(unresolved)* | `lk_feedback` | yes | `buildContext` | 09-onboarding-system |
| via `p.day` prop (`:36932`) *(unresolved)* | `lk_fuelLog` | via `p.day` prop (`:36932`) | F-FUEL-402, 404, 406, 409, 415, 418, 422, 424 | 03c-fuel-entry |
| — *(unresolved)* | `lk_fuelLog` | 53490, 53516 | F-MISC-006 | 07-misc-gamification |
| via `p.fuelProfile` prop (`:36912`) *(unresolved)* | `lk_fuelProfile` | via `p.fuelProfile` prop (`:36912`) | F-FUEL-417, 420, 421, 423 | 03c-fuel-entry |
| — *(unresolved)* | `lk_fuelProfile` | 56386 | body profile fallback | 02e-cardio |
| — *(unresolved)* | `lk_fuelProfile` | 36913, 53688 | F-MISC-001, F-MISC-006 | 07-misc-gamification |
| — *(unresolved)* | `lk_gamingLayer` | 26423, 26510, 30396, 32067 | F-GAME-001/002/003 | 07-misc-gamification |
| `:164-169` *(unresolved)* | `lk_guestMode` | yes | `isGuestMode`, `enterGuestMode` | 09-onboarding-system |
| v6.html:13470 (written elsewhere, v6.html:32996) *(unresolved)* | `lk_hidePartials` | yes | v6.html:13470 (written elsewhere, v6.html:32996) | 02b-train-logging |
| `:1421` *(unresolved)* | `lk_history` | yes | `buildContext` | 09-onboarding-system |
| — *(unresolved)* | `lk_history` | `migrateCardioV2` 6955 | Shared with strength sessions by design (5452–5460) | 02a-train-exercises |
| — *(unresolved)* | `lk_history` | indirectly — records reach `App`'s `setHistory` (57649-57653) | persistence itself is outside this range | 02e-cardio |
| — *(unresolved)* | `lk_history` | 53565, 53580 | F-MISC-006 | 07-misc-gamification |
| v6.html:57425-57459, 15045 *(unresolved)* | `lk_history`, `lk_prs`, `lk_splits` | via props | v6.html:57425-57459, 15045 | 02b-train-logging |
| v6.html:10020, 10323 *(unresolved)* | `lk_holdTipSeen` | yes | v6.html:10020, 10323 | 02b-train-logging |
| `cycletrack` home block visibility (F:26105-26111, F:26169) *(unresolved)* | `lk_homeLayout` | yes | `cycletrack` home block visibility (F:26105-26111, F:26169) | 06b-cycle |
| `window.LOCKED.cycleSyncEnabled` / `setCycleSync` (F:1175-1205), toggled at F:24304 and F:26006 *(unresolved)* | `lk_mcCloudSync` | yes | `window.LOCKED.cycleSyncEnabled` / `setCycleSync` (F:1175-1205), toggled at F:24304 and F:26006 | 06b-cycle |
| `mcGetDays`/`mcSaveDays` (F:21940-21945); deleted F:26010 *(unresolved)* | `lk_mcDays` | yes | `mcGetDays`/`mcSaveDays` (F:21940-21945); deleted F:26010 | 06b-cycle |
| `mcFuelAdjustOn` (F:24874), `sd("mcFuelAdjust", n)` (F:25037) *(unresolved)* | `lk_mcFuelAdjust` | yes | `mcFuelAdjustOn` (F:24874), `sd("mcFuelAdjust", n)` (F:25037) | 06b-cycle |
| `mcGetProfile`/`mcSaveProfile` (F:21934-21939); deleted F:26009 *(unresolved)* | `lk_mcProfile` | yes | `mcGetProfile`/`mcSaveProfile` (F:21934-21939); deleted F:26009 | 06b-cycle |
| — *(unresolved)* | `lk_myGroceries` | 39366 | F-FUEL-410 | 03c-fuel-entry |
| — *(unresolved)* | `lk_myStores` | 42074 | F-FUEL-425 | 03c-fuel-entry |
| — *(unresolved)* | `lk_perfTracking` | 47321, 47335, 37329, 33335/33340/33347/33360, 1504, 49186 | Opt-in gate for all cycle features | 04b-supplements-cycletab |
| `:57352`, `:171-175`, `:1419`, `:57556` *(unresolved)* | `lk_profile` | yes (gate, push context) | `completeOnboarding`, `enterGuestMode`, `buildContext` | 09-onboarding-system |
| — *(unresolved)* | `lk_profile` | 53683, 53688, 53693 | F-MISC-006 | 07-misc-gamification |
| `isFemaleUser` gate (F:21946-21951) *(unresolved)* | `lk_profile`, `lk_fuelProfile` | yes | `isFemaleUser` gate (F:21946-21951) | 06b-cycle |
| `:1307`, `:1344`, `:1358` *(unresolved)* | `lk_pushDeviceId` | yes | `deviceId` | 09-onboarding-system |
| — *(unresolved)* | `lk_pushDeviceId` / `lk_pushPrefs` / `lk_pushEnabled` | 1307–1309 | Referenced only by the push path behind F-SUPP-011 | 04b-supplements-cycletab |
| `:1309`, `:1636`, `:1650`, `:1660` *(unresolved)* | `lk_pushEnabled` | yes | `enable`, `disable`, `isEnabled` | 09-onboarding-system |
| `:1308`, `:1365`, `:1667` *(unresolved)* | `lk_pushPrefs` | yes | `getPrefs`, `setPrefs` | 09-onboarding-system |
| — *(unresolved)* | `lk_refeedAccepted` | 2944, 36920 | F-MISC-001 | 07-misc-gamification |
| — *(unresolved)* | `lk_refeedDismissed` | 2939 | F-MISC-001 | 07-misc-gamification |
| — *(unresolved)* | `lk_reminderMigrated` | 2395 | One-shot migration flag | 04b-supplements-cycletab |
| v6.html:10426, 11515 *(unresolved)* | `lk_restEnabled` | yes | v6.html:10426, 11515 | 02b-train-logging |
| — *(unresolved)* | `lk_shoppingList` | 41946 | F-FUEL-419, 424, 425 | 03c-fuel-entry |
| `:57404`, `:1420` *(unresolved)* | `lk_splits` | yes (push context) | `completeOnboarding`, `buildContext` | 09-onboarding-system |
| — *(unresolved)* | `lk_suppLog` | 46132, 46282, 46407, 1485, 19409 | Date→names map; **never pruned on delete** | 04b-supplements-cycletab |
| — *(unresolved)* | `lk_supplements` | 46279, 46162, 2396, 1484, 19408, 49181 | The supplement list; synced (201–202) | 04b-supplements-cycletab |
| `:19` *(unresolved)* | `lk_theme` | yes | pre-paint theme script | 09-onboarding-system |
| — *(unresolved)* | `lk_tutorialSeen` | 57220 | F-MISC-008 | 07-misc-gamification |
| — *(unresolved)* | `lk_usdaKey` | 39369 | F-FUEL-411 | 03c-fuel-entry |
| — *(unresolved)* | `lk_voiceBtnCorner` | 53841, 53848 | F-MISC-004 | 07-misc-gamification |
| — *(unresolved)* | `lk_voiceEnabled` | 32061, 53702, 53706 | F-MISC-007 | 07-misc-gamification |
| — *(unresolved)* | `lk_weightLog` | 56386 | body profile fallback | 02e-cardio |
| — *(unresolved)* | `lk_weightLog` | 2909 (`getWeightLog`), 53690 | F-MISC-002, F-MISC-001, F-MISC-006 | 07-misc-gamification |
| via v6.html:4379 *(unresolved)* | `lk_weightStorageUnit` | indirect (`storedWeightUnit`) | via v6.html:4379 | 02b-train-logging |
| `:62-68` *(unresolved)* | `lockZoom` | IIFE | Blocks pinch-zoom gestures document-wide | 09-onboarding-system |
| :63-68 *(unresolved)* | `lockZoom` | named IIFE | Blocks pinch-zoom gestures | 10-shared |
| v6.html:10633-10639 *(unresolved)* | `lockedRest` broadcast effect` | hook | Dispatch rest state for the out-of-screen rest pill | 02b-train-logging |
| — *(unresolved)* | `main` | Fuel dashboard | default | 03b-fuel-main |
| — *(unresolved)* | `mcGetDays` / `mcSaveDays` | functions | Read/write `lk_mcDays` | 03a-fuel-panels |
| — *(unresolved)* | `mcGetProfile` / `mcSaveProfile` | functions | Read/write `lk_mcProfile` | 03a-fuel-panels |
| — *(unresolved)* | `mealPlans` | 45228 (via `getMealPlans`, called 37470) | Saved AI meal plans | 03b-fuel-main |
| `:34518-34639` *(unresolved)* | `message map callback` | function (inline `.map`) | Renders one chat bubble, with the program card when present | 09-onboarding-system |
| — *(unresolved)* | `midnight` | Midnight | `#1C183A` | 06-profile |
| — *(unresolved)* | `navy` | Navy | `#112035` | 06-profile |
| — *(unresolved)* | `none` | No Bar | 0 | 07-misc-gamification |
| — *(unresolved)* | `oly` | Olympic Bar | 45 | 07-misc-gamification |
| — *(unresolved)* | `onBack` | handler | Clears the selected workout | 01-home |
| — *(unresolved)* | `onChange — liftSearch` | handler | Update picker query | 02d-progress-prs |
| — *(unresolved)* | `onChange — logEx select` | handler | Choose exercise | 02d-progress-prs |
| — *(unresolved)* | `onChange — logW` | handler | Weight input | 02d-progress-prs |
| — *(unresolved)* | `onChange — vault search` | handler | Filter vault list | 02d-progress-prs |
| — *(unresolved)* | `onClick — ADD LIFT` | handler | Open the exercise picker | 02d-progress-prs |
| — *(unresolved)* | `onClick — LOG A PR WITHOUT A WORKOUT` | handler | Open log form | 02d-progress-prs |
| — *(unresolved)* | `onClick — Log New PR` | handler | Open log form pre-set to this exercise | 02d-progress-prs |
| — *(unresolved)* | `onClick — PRHub inner tab` | handler | Switch PRHub tab (unreachable) | 02d-progress-prs |
| — *(unresolved)* | `onClick — back to home` | handler | `p.go("home")` | 02d-progress-prs |
| — *(unresolved)* | `onClick — log-form back` | handler | Close log form | 02d-progress-prs |
| — *(unresolved)* | `onClick — next month` | handler | Increment month, wrap year | 02d-progress-prs |
| — *(unresolved)* | `onClick — pick exercise` | handler | Append id to featured list | 02d-progress-prs |
| — *(unresolved)* | `onClick — picker back` | handler | Close picker, clear search | 02d-progress-prs |
| — *(unresolved)* | `onClick — prev month` | handler | Decrement month, wrap year | 02d-progress-prs |
| — *(unresolved)* | `onClick — progress tab pill` | handler | `setTab(t[0])` | 02d-progress-prs |
| — *(unresolved)* | `onClick — range button` | handler | `setPrRange(t[0])` | 02d-progress-prs |
| — *(unresolved)* | `onClick — rep chip` | handler | Choose rep count | 02d-progress-prs |
| — *(unresolved)* | `onClick — unpin featured lift` | handler | Remove id from featured list | 02d-progress-prs |
| — *(unresolved)* | `onClick — vault back` | handler | `setSel(null)` | 02d-progress-prs |
| — *(unresolved)* | `onClick — vault row` | handler | Open exercise detail | 02d-progress-prs |
| — *(unresolved)* | `onConvertToSplit` | handler | Upserts a split derived from the workout | 01-home |
| — *(unresolved)* | `onDelete` | handler | Removes the workout from history | 01-home |
| — *(unresolved)* | `onDismiss` | handler | Dismisses the throwback and forces a re-render | 01-home |
| — *(unresolved)* | `onDismiss — throwback` | handler | Dismiss throwback card | 02d-progress-prs |
| — *(unresolved)* | `onEdit` | handler | Replaces the edited workout in history | 01-home |
| via `getPantry()` (`:43415`) *(unresolved)* | `pantry key` | via `getPantry()` (`:43415`) | F-FUEL-423 | 03c-fuel-entry |
| — *(unresolved)* | `pantry-stock IIFE` | function (inline) | Render the "IN YOUR PANTRY" summary or empty state | 03c-fuel-entry |
| — *(unresolved)* | `perfTracking` | 37391 | Gates the "Stack" (cycle) pill | 03b-fuel-main |
| v6.html:10659-10668 *(unresolved)* | `persistence effect` | hook | Persist rows + seconds when any progress exists | 02b-train-logging |
| — *(unresolved)* | `photo` | Photo | `addItem` | 03b-fuel-main |
| — *(unresolved)* | `plan` | Meal Plans | `fuelProfile, addItem` | 03b-fuel-main |
| `:34674-34676` *(unresolved)* | `post-done Skip `onClick` handler` | handler | Finishes without the program | 09-onboarding-system |
| `:1712-1722` *(unresolved)* | `postHealing` | async function | POST that re-registers and retries once on a 404 | 09-onboarding-system |
| :1715-1723 *(unresolved)* | `postHealing` | async fn | Retry a POST after re-enabling | 10-shared |
| `:34747-34749` *(unresolved)* | `pre-done Skip `onClick` handler` | handler | Abandons the interview and finishes | 09-onboarding-system |
| — *(unresolved)* | `profile` | Fuel Profile | header "My Profile" button (37142) | 03b-fuel-main |
| — *(unresolved)* | `profile` | 37490 (direct `ld("profile", {})`) | Fallback macro/goal source in `buildMealContext` | 03b-fuel-main |
| — *(unresolved)* | `progressPhotos` | 27195 | F-GOAL-007 | 01-home |
| — *(unresolved)* | `quads` | Quads | All | 10-shared |
| `:1323-1338` *(unresolved)* | `readRaw` / `writeRaw` | function | try/catch JSON localStorage helpers scoped to the push module | 09-onboarding-system |
| — *(unresolved)* | `reader.onload` | handler | Apply the parsed backup | 06-profile |
| — *(unresolved)* | `recipes` | Recipes | `fuelProfile, addItem, history: p.history` | 03b-fuel-main |
| — *(unresolved)* | `refeedAccepted` | 36919; 2946 | ISO day the refeed was accepted | 03b-fuel-main |
| — *(unresolved)* | `refeedDismissed` | 2940 | ISO timestamp of last dismissal (5-day cooldown) | 03b-fuel-main |
| — *(unresolved)* | `resetPassword` | async fn | `resetPasswordForEmail` with `?reset=1` redirect | 08-auth-sync-root |
| v6.html:10571-10604 *(unresolved)* | `rest countdown effect` | hook | 500 ms rest tick, expiry alert | 02b-train-logging |
| v6.html:10656-10683 area (10684-…) *(unresolved)* | `rest visibility effect` | hook | Re-sync the rest countdown on tab return | 02b-train-logging |
| v6.html:9100-9123 *(unresolved)* | `sb autoscroll effect` | hook | Edge auto-scroll while dragging a split-builder row | 02b-train-logging |
| v6.html:9087-9099 *(unresolved)* | `sb drag cleanup effect` | hook | Same, for the split builder | 02b-train-logging |
| — *(unresolved)* | `scan` | Scan | `addItem, gtin: pendingGtin, onConsumeGtin` | 03b-fuel-main |
| `:33825-33827` *(unresolved)* | `scroll-pin effect` | hook (`useEffect` on `[msgs]`) | Pins the chat scroller to the bottom on new messages | 09-onboarding-system |
| — *(unresolved)* | `seedExistingTimestamps` | IIFE | One-time `__lk_ts__` backfill for sync keys | 08-auth-sync-root |
| `:34723` *(unresolved)* | `send-button `onClick` | handler | Sends the answer | 09-onboarding-system |
| — *(unresolved)* | `sendTest` | function (async) | Fire a test push | 06-profile |
| — *(unresolved)* | `setPref` | function (async) | Optimistically patch one push preference | 06-profile |
| `:1665-1678` *(unresolved)* | `setPrefs` | async function | Persists prefs locally and on the Worker, re-registering on 404 | 09-onboarding-system |
| :1666-1682 *(unresolved)* | `setPrefs` | async fn | Merge + push prefs to server | 10-shared |
| — *(unresolved)* | `shop` | Shopping & Budget | header "Shop" button (37105) | 03b-fuel-main |
| — *(unresolved)* | `shopping list` | via `addShoppingItem` 53484 | F-MISC-006 | 07-misc-gamification |
| — *(unresolved)* | `shopping list key` | 41945 (via `getShoppingList`, called 37720) | Shopping list merge target | 03b-fuel-main |
| — *(unresolved)* | `shoulders` | Shoulders | Front Delt, Side Delt, Rear Delt | 10-shared |
| — *(unresolved)* | `shown filter IIFE` | function (inline) | Filter classic recipes by diet and cut goal | 03c-fuel-entry |
| — *(unresolved)* | `signIn` | async fn | Sign in, wipe on uid change, merge, reload | 08-auth-sync-root |
| — *(unresolved)* | `signOut` | async fn | Sign out and show the overlay | 08-auth-sync-root |
| — *(unresolved)* | `signUp` | async fn | Bare `auth.signUp` | 08-auth-sync-root |
| — *(unresolved)* | `slate` | Slate | `#21262D` | 06-profile |
| — *(unresolved)* | `smith` | Smith Machine | 15 | 07-misc-gamification |
| `:34610-34637` *(unresolved)* | `split map callback` | function (inline `.map`) | Renders one split row inside the program card | 09-onboarding-system |
| `:34311-34318` *(unresolved)* | `step-2 CONTINUE `onClick` handler` | handler | Claims the beta code if present and advances to step 3 | 09-onboarding-system |
| `:34426-34428` *(unresolved)* | `step-3 CONTINUE `onClick` handler` | handler | Advances to the AI interview | 09-onboarding-system |
| — *(unresolved)* | `stores key` | 42073 (via `getMyStores`, called 37488) | Enabled store names for the prompt | 03b-fuel-main |
| — *(unresolved)* | `supps` | Supps | none | 03b-fuel-main |
| — *(unresolved)* | `syncBidirectional` | async fn | Full timestamp-merge sync with the worker | 08-auth-sync-root |
| — *(unresolved)* | `tab` | Label | Props passed | 03b-fuel-main |
| — *(unresolved)* | `tab` | Label | Props passed | 03b-fuel-main |
| — *(unresolved)* | `tdeeHistory` | 19263 | Adaptive TDEE weekly entries | 03b-fuel-main |
| `:1702-1709` *(unresolved)* | `test` | async function | Fires a test push | 09-onboarding-system |
| :1702-1714 *(unresolved)* | `test` | async fn | Fire a test notification | 10-shared |
| — *(unresolved)* | `throwbackDismissed` | 4603/4606 (via computeThrowback) | F-HOME-007 | 01-home |
| `:1377-1396` *(unresolved)* | `todayISO` / `dayOf` | function | Local-calendar day helpers (duplicated at `:1954-1976`) | 09-onboarding-system |
| — *(unresolved)* | `toggleMain` | function (async) | Enable/disable push | 06-profile |
| — *(unresolved)* | `trap` | Trap Bar | 55 | 07-misc-gamification |
| — *(unresolved)* | `trends` | Trends | `fuelLog, weightLog, calTarget: baseTargets.cal` | 03b-fuel-main |
| — *(unresolved)* | `triceps` | Triceps | Long Head, Lateral Head, Medial Head | 10-shared |
| — *(unresolved)* | `type picker onClick` | handler | Selects the goal type and default unit | 01-home |
| `:34655-34664` *(unresolved)* | `typing-dot map callback` | function (inline `.map`) | Renders the three staggered loading dots | 09-onboarding-system |
| — *(unresolved)* | `ui_fuelTab` | 2123 (via `useHubState`, 36905) | Persisted sub-tab | 03b-fuel-main |
| — *(unresolved)* | `ui_fuelView` | 2123 (via `useHubState`, 36906) | Persisted view (main/profile/shop) | 03b-fuel-main |
| `:34382-34384` *(unresolved)* | `unit option `onClick` handler` | handler | Selects kg or lbs | 09-onboarding-system |
| `:34376-34424` *(unresolved)* | `unit option map callback` | function (inline `.map`) | Renders one unit radio card | 09-onboarding-system |
| `:34296-34298` *(unresolved)* | `username` `onChange` handler` | handler | Lowercases and strips to `[a-z0-9_]` | 09-onboarding-system |
| — *(unresolved)* | `validateBetaCodeRemote callback` | handler | Apply the verification result | 06-profile |
| — *(unresolved)* | `view` | Screen | Reached by | 03b-fuel-main |
| v6.html:10561-10570 area *(unresolved)* | `visibility effect` | hook | Re-sync elapsed time on tab return | 02b-train-logging |
| `:1791-1793` *(unresolved)* | `visibilitychange` listener` | handler | Refreshes reminder context on foreground | 09-onboarding-system |
| — *(unresolved)* | `weightLog` | via getWeightLog at 27049, 27110, 27193, 27216 | F-GOAL-002, 003, 005, 007 | 01-home |
| — *(unresolved)* | `weightLog` | 36913 (via `getWeightLog`, 2908) | Bodyweight history | 03b-fuel-main |
| — *(unresolved)* | `window.LOCKED` | export | Public surface: getters + methods | 08-auth-sync-root |
| — *(unresolved)* | `wmn` | Women's Bar | 35 | 07-misc-gamification |
| — *(unresolved)* | `yt3_<exercise name>` | `ytSearchVideo` 7068 | **Raw key — no `lk_` prefix**, bypasses `ld`/`sd`, quota warning and sync | 02a-train-exercises |
| :2238-2243 *(unresolved)* | `↳ `cancel` | closure | Springs back on touchcancel | 10-shared |
| :2248-2255 *(unresolved)* | `↳ `close` | closure | Programmatic dismissal through the same exit | 10-shared |
| :2223-2237 *(unresolved)* | `↳ `end` | closure | Projects momentum; dismiss past 45% height | 10-shared |
| :2208-2222 *(unresolved)* | `↳ `move` | closure | Tracks drag, rubber-bands upward, EMA velocity | 10-shared |
| :2161-2164 *(unresolved)* | `↳ `setY` | closure | Writes `translateY` directly to the node | 10-shared |
| :2165-2188 *(unresolved)* | `↳ `springTo` | closure | Critically-damped spring integrator | 10-shared |
| :2189-2207 *(unresolved)* | `↳ `start` | closure | Touch start; cancels entry keyframe | 10-shared |
