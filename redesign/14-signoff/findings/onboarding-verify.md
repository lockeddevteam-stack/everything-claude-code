# Onboarding, auth, system — verification of the earlier findings

Verified 2026-09-13 against `08-build/onboarding.html`, `08-build/tutorial.html`,
`08-build/settings.html`, `08-build/home.html` and `10-final/assemble.mjs` /
`10-final/locked-demo.html`, by reading the source and then driving it with
Playwright (Chromium, `file://`).

**Context that explains the result.** `onboarding.html` and `tutorial.html` have
not been touched since the audit was written. The last commit touching either is
`82e4873` (2026-09-12 18:54); the findings file landed in `5daa6d7` (18:59) and
nothing later modifies them (`git log -- 08-build/onboarding.html`). `working
tree is clean`. So the onboarding screen itself is byte-identical to the one
that was audited. The items below that are fixed were fixed in *other* files
(Settings, Home) which were in scope for the same IDs.

## Fixed

- **F-AUTH-005 — change-password form with its four validations.** Built in
  `08-build/settings.html:1272-1286` (sheet) and `:1641-1658` (`savePassword`).
  Drove it four times through `[data-testid="row-password"]` →
  `[data-testid="save-password"]`: empty current → "Type the password you use
  now."; `abc`/`short` → "A new password needs at least 8 characters.";
  `abcdefgh`/`abcdefgh` → "That is the password you already have.";
  `newpass123`/`nope123456` → "The two new passwords are not the same." The
  sheet also states plainly that nothing is sent (`:1278-1279`), and the success
  toast says the same (`:1658`).
- **F-GAME-001 — the streak, and it belongs on Home.** Computed at
  `08-build/home.html:262-266`, rendered at `:393-400`. Verified honestly-gated:
  with the seed (`LKFixtures.today` = 2026-09-09, last session 2026-09-07) the
  pill count is 0 — a zero streak is never claimed. Injected three history rows
  dated 09-09/08/07 and set `lk_gamingLayer`, reloaded: pill reads "5 day
  streak", and it is still there after a second reload (read back through
  `LKStore`/localStorage).
- **"Needs a server" — the local half plus a plain statement, for accounts,
  sync and push.** `settings.html:822` ("Never synced. This build has no server
  to sync with."), `:813`, `:1278-1279`, `:1316` and `:1658` for accounts; the
  push half is real and local — `notifCard()` at `settings.html:1012-1060` reads
  `Notification.permission` and renders distinct unsupported / denied / granted
  rows rather than faking a subscription. No fake paywall exists anywhere
  (`grep -i 'paywall|subscription|premium|upgrade'` over the build: 0 hits).

## Still open

- **Class 1 — password reset overwrites the typed email.**
  `08-build/onboarding.html:1072` (`case 'signin-forgot': go('signin','reset')`)
  and `:739-743`. Typed `myown@thing.io` into `#signin-email`, pressed
  `[data-testid="signin-forgot"]`: the field came back reading
  `cesco@example.com` and the banner read "Reset link sent — If
  cesco@example.com has an account, a link is on the way. It expires in one
  hour." Pressing it with an empty field gives the identical banner. Unchanged
  from the audit, and it is still the untrue claim: it names an address the
  reader never typed and asserts a link was sent by a build with no server.
- **F-ONB-004/005/012 — the run still writes nothing.** `onboarding.html` never
  mentions `LKStore`, `LKUnits`, `lk_profile` or `lk_splits`
  (`grep -n 'LKStore\|LKUnits\|lk_profile\|lk_splits\|username' onboarding.html`
  → no matches); answers live only in the in-memory `S.answers`
  (`:440-446`, `:905-916`) and `advanceSetup` (`:926-934`) just re-renders.
  Cleared localStorage, ran guest → all five steps (name "Testy", kg, 1to3, 4,
  strength) → overview rendered; `Object.keys(localStorage)` came back `[]`,
  `lk_profile` `null`, `lk_splits` `null`.
- **F-ONB-004 — no username field.** Only a name `text` step exists
  (`onboarding.html:489-496`); `#setup-username` / `[data-testid*="username"]`
  match 0 elements at every step. No `[a-z0-9_]` sanitising anywhere.
- **F-ONB-001 — nothing gates on first run.** No screen reads `lk_profile` to
  decide whether onboarding is due. Cleared localStorage and opened
  `home.html`: it stayed on `home.html`. Same in the shell — cleared storage,
  reloaded `locked-demo.html`, landed on `#/home`.
- **F-ROOT-008 — the finish converts nothing into `lk_splits`.** Same run as
  above; `lk_splits` is `null` after Finish. The overview's split is a literal
  lookup table (`onboarding.html:544`, `SPLIT`) used for display only.
- **F-ONB-011 — no real program preview.** `renderOverview` (`:938-1030`)
  prints one session — "Upper A · 6 exercises, about 59 minutes" — from a
  hardcoded per-days count at `:989` (`{'2':8,'3':7,'4':6,'5':5,'6':5}`). There
  is no list of the split's days and no per-day exercise count; the "6" is a
  constant keyed on the days answer, not a count of anything.
- **F-AUTH-007 — no "check your inbox" screen and no resend.**
  `grep -ni 'inbox\|resend\|verify\|verification' onboarding.html` → 0 matches;
  `/check your inbox|resend/i` over the assembled demo's rendered `innerText` →
  false. The reset path terminates in the banner described above.
- **F-AUTH-008 — session restore still only reachable from the dev menu.**
  `onboarding.html:440-442` boots `S = {screen:'welcome', variant:'default'}`
  and `render()` runs at `:1245`; the "Checking for a session" state exists only
  as a `DEV` entry (`:1124`). Loading `onboarding.html` shows the default
  welcome immediately, never the restore state.
- **F-SYS-001/002 — no manifest, no apple metas, no service worker.**
  `onboarding.html:1-14` head has none; in `locked-demo.html`,
  `document.querySelector('link[rel=manifest]')` → null,
  `meta[name^="apple-mobile"]` → null, `navigator.serviceWorker.controller` →
  null. `grep -c 'rel="manifest"\|serviceWorker\|apple-mobile-web-app'` over
  `locked-demo.html` → 0/0/0. The only mention is a comment at
  `10-final/assemble.mjs:974` noting there is no manifest row.
- **F-SYS-005 — no pinch-zoom gesture preventDefault.** `grep -c gesturestart`
  over `locked-demo.html` → 0; no `gesturestart`/`gesturechange` handler in
  `08-build/app.js` or `chrome.js`.
- **F-SYS-011/012, F-SHARED-004 — no error boundary a reader can see.**
  `10-final/assemble.mjs:489-500`: `boot()` wraps the screen factory in
  try/catch and does `console.error('[demo] ' + rec.id + ' failed to boot', err)`
  — nothing else; `:517` does the same for chrome. Confirmed by forcing a throw:
  loaded `locked-demo.html#/train` with an init script making `window.LKFixtures`
  throw, waited 2s, and `document.body.innerText` was the single word
  `"SCREENS"` — a blank host, no named error, no Reload button.
- **F-ROOT-006 — no `?open=<pane>` deep links.** `grep -c '?open='` over
  `assemble.mjs` and `locked-demo.html` → 0. Loaded
  `locked-demo.html?open=settings#/home`: nothing opened and the URL still reads
  `?open=settings#/home`, so it is neither honoured nor stripped.
- **F-SHARED-003 — the storage-full boolean is still swallowed.**
  `08-build/store.js:63-72` already returns false on a failed write and
  `set()` (`:130-135`) returns it, but no caller reads it —
  `grep -rn 'LKStore.set(\|LKStore.patch(\|LKStore.push(' *.html` shows every
  call site discarding the result (e.g. `workout-detail.html:219`,
  `workout-log.html:1754`, `coach.html:1569`, `coach.html:1828`). There is no
  quota detection and no one-shot toast anywhere
  (`grep -i 'storage is full\|out of space\|no room'` → 0). The only quota-aware
  code is the Settings usage meter (`settings.html:404`, `:1117-1129`), which
  reports space used but is not a write-failure path.
- **F-SHARED-007 — no `visualViewport` listener.** `grep -c visualViewport` over
  `locked-demo.html`, `app.js`, `chrome.js` → 0. The tab bar is not hidden under
  the keyboard.
- **F-PAY-001/004 — the honest note is missing.** There is no fake paywall
  (good), but there is also no statement anywhere that nothing in this build is
  gated: `grep -i 'paywall|subscription|premium|upgrade|free plan'` over
  `08-build/*.html` → 0 hits. The finding asked for the note, not just the
  absence of the paywall.
- **F-ROOT-001 (report only, still true).** There is no app root. Screens are
  separate documents sharing `LKFixtures`/`LKStore`/`LKUnits` and the shell
  boots each one into its own scoped document (`assemble.mjs:489-495`,
  `scopedDocument`/`scopedWindow`). `store.js` gives a shared key space and a
  change notifier (`store.js:onChange`, plus the `storage` event at `:205-213`),
  which is the persistence half; what is still missing is a single mounted
  model that screens render *from* — today each screen re-derives its own view
  model at boot, so a screen already mounted does not re-render on another
  screen's write unless it happens to have subscribed.
