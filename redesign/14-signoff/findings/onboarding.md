# Onboarding, auth, system — findings (93: 14 present, 31 partial, 25 missing, 13 cut)

Files: onboarding.html, tutorial.html, and the demo shell (10-final/assemble.mjs)

## Class 1 — untrue

- **Password reset overwrites the typed email.** `case 'signin-forgot'`
  re-renders, and the reset branch writes `cesco@example.com` into the field
  and announces "If cesco@example.com has an account, a link is on the way."
  (onboarding.html:733-737, :1074). A reader who typed their own address is
  told a link went somewhere else. Read the field, guard the empty case, and
  say plainly that this build sends nothing.

## Class 2 — nothing is written

A full five-step run leaves `Object.keys(localStorage)` empty.

- **F-ONB-004/005/012** — the name, the unit choice and the finish all write
  nothing. Write `lk_profile` (displayName, username, useKg) through
  `LKStore`, and call `LKUnits.set()` for the unit.
- **F-ONB-001** — nothing reads `lk_profile` to decide whether to show
  onboarding at all. A first-run reader lands on Home.
- **F-ROOT-008** — the finish must convert the plan into `lk_splits`.

## Missing — build

| ID | What |
|---|---|
| F-ONB-004 | A username field, sanitised to `[a-z0-9_]` |
| F-ONB-011 | A real program preview: each split day with its exercise count |
| F-AUTH-005 | A change-password form with its four validations |
| F-AUTH-007 | A "check your inbox" screen with a resend |
| F-AUTH-008 | Run the session-restore state on boot rather than only from the dev menu |
| F-SYS-001/002 | A web app manifest, the apple-mobile-web-app metas, and a service worker registration (an offline cache of the demo's own assets is real and local) |
| F-SYS-005 | Gesture preventDefault for pinch zoom |
| F-SYS-011/012, F-SHARED-004 | An error boundary a reader can see: a panel naming the error with a Reload button, per screen and for the shell. Today a boot throw is console-logged and the host stays blank. |
| F-ROOT-006 | `?open=<pane>` deep links, stripped after routing |
| F-SHARED-003 | Storage-full recovery: quota detection, a one-shot toast, and a boolean return from the write so a caller can roll back. `LKStore.set` already returns a boolean — surface it. |
| F-SHARED-007 | A `visualViewport` listener that hides the tab bar under the keyboard |
| F-GAME-001 | The streak (report it to the Home agent if it belongs there) |

## Needs a server — local half plus a plain statement

F-AUTH-001/002/003 (accounts), F-SYNC-001/002 (cloud sync),
F-SYS-006/007/009 (push), F-PAY-001/004 (paywall — nothing in this build is
gated, so the honest answer is a note saying so rather than a fake paywall).

## Report, do not fix

F-ROOT-001 — there is no app root; screens share three globals and read
`LKFixtures` independently, so one screen's edit is invisible to the next.
`store.js` is the beginning of the answer; say what else you would need.
