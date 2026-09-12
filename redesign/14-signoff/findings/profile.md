# Profile, Settings, Progress — findings (74: 26 present, 20 partial, 18 missing, 10 cut)

## Class 1 — untrue

- **"Erase everything on this phone" erases nothing.** The dialog is right,
  the toast says "Everything on this phone was erased", and localStorage is
  untouched (settings.html:981-985). `lk_badges`, `lk_perfTracking`,
  `lk_cycle`, `lk_fuelNumbers`, `lk_profile` and `lk_theme` all survive.
  **Use `LKStore.reset()`.**
- **"Delete your account" deletes nothing** and reports success
  (settings.html:1013-1017). Say what it does in this build, or make it clear
  the local data goes.
- **"Export a backup" toasts a filename and builds no file** (:966). Use
  `LKStore.dump()` into a Blob and an `<a download>`, with the real key count.
- **"Restore from a backup" has no file input** (:975). Add one and use
  `LKStore.load()`.
- **"Streaks and badges"** promises a streak that does not exist anywhere in
  the build (:565-567). Build the streak (consecutive training days back from
  today, from `lk_history`) or rename the switch.
- **"Storage used — 1.2 MB of 5.0 MB" is a literal** (:601-608). Measure it
  from `LKStore.dump()`, refresh it, and show an amber state at ≥80%.
- **Password reset overwrites the typed email.** `renderSignin`'s reset branch
  writes `cesco@example.com` into the field and announces a link went there
  (onboarding.html:733-737) — that is another agent's file; report it.

## Class 2 — figures / settings that do not persist

Almost nothing in Settings is written. The toggle handler persists only
`fuelNumbers|badges|cycle|perfTracking` (:910-913). These all revert on
reload and reach no other screen:

- the display name (`save-name`, :942) — write `lk_profile.displayName`
- every body stat (`Save Stats`, :949) — write `lk_profile`
- the workout reminder and its time, and the daily check-in (`lk_checkinPerDay`)
- partial reps (`lk_hidePartials`) and the rest timer (`lk_restEnabled`) —
  workout-log.html hardcodes both, so the settings reach nothing
- the plate rounding (`lk_plateKg`), the week start, the distance unit

## Class 3 — gaps

- **Guest mode is gated on the dev switcher only.** `lk_guestMode` is in the
  seed and `grep guestMode 08-build/*` returns nothing. Read it.
- **The weight unit does not propagate live.** `LKUnits.onChange` exists and
  no screen subscribes, so switching to lb leaves other screens in kg until a
  reload. Subscribe on this screen, and report the others.
- **`exercise-library.html:188` defines its own `kg()`** and prints kg
  whatever the setting says. That file is another agent's; report it.

## Missing — build

| ID | What |
|---|---|
| F-PROF-008/009/010 | Progress photos: a camera input (`capture="environment"`), a library input, a canvas downscale to a JPEG data URL, and a note field. Persist to `lk_progressPhotos`. |
| F-PROF-015 | Lightbox prev/next with an "n of N" counter |
| F-PROF-021 | A hint pointing at the analyse route |
| F-PROF-028..037 | Notifications: a master switch (`Notification.requestPermission`), six per-type preferences, a rest-timer sound picker with a preview, a test send, and a blocked state. The permission API is real in a browser; the scheduling half needs a service worker — build the preferences and say so. |
| F-PROF-039 | A real storage meter |
| F-PROF-041 | Sync status from a real timestamp, including "never synced" |
| F-PROF-046 | A change-password form with its four validations (no server — validate locally and say so) |
| F-PROF-060 | A row under Training stating that logs are stored in kilograms and switching converts rather than relabels |
| F-PROF-061 | A nutrition CSV export |
| F-PROF-070 | Force refresh: clear caches and hard reload |
| F-GOAL-001..004 | Goals: a completed section, an empty state, a type picker (lift / weight / body fat / custom), a target value, an exercise search for lift goals, a deadline date input, notes, an edit path, a detail view with a progress ring and START/CURRENT/TARGET tiles, a deadline chip, mark-complete and delete. Persist to `lk_goals`. Today "Add a goal" takes a name and a free-text date and shows 0% forever. |
| F-GOAL-006 | A body-fat log: a percentage input, five method chips, 1–75 validation, newest-first history. `lk_bfLog` ships in fixtures and nothing reads it. |
| F-TRAIN-512 | Reject a non-PR: "Not a PR — your best at N reps is still X" |

## Needs a server — local half plus a plain statement

F-PROF-016/017/018/019 (physique analysis and its prescriptions),
F-GOAL-005 (AI goal analysis), F-GOAL-007 (AI body-fat estimate),
F-PROF-062/063 are local and must be built for real.
