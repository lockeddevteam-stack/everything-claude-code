# Profile / Settings / Progress — verification of the earlier findings

Verified against 08-build on 2026-09-13, driving the screens headless with
Playwright 1.56.1 (file:// origin) and checking every figure against
`08-build/fixtures.js` (TODAY = 2026-09-09; 22 sessions, 288 sets, 140,204 kg,
12 records over 9 lifts; profile Cesco/29/female/168 cm/64.2 kg/build).

Settings is genuinely rebuilt and I could not break it. Profile is rebuilt and
its arithmetic is correct. **Progress is where the work did not land**: its
goals, photos, body-fat and record features are still the ones the audit
described, and — new, and worse than the audit found — *nothing Progress writes
survives a reload at all*.

## Fixed

- **Erase actually erases.** Pressed `row-reset` → `confirm-reset` with
  `lk_badges`, `lk_cycle`, `lk_profile` written first. Toast: "4 keys erased…";
  `LKStore.dump()` returned `{"lk_theme":"dark"}` immediately after and the same
  after a reload. (`lk_theme` is not a survivor — it is re-written by theme.js
  on the next paint; the four data keys are gone.) settings.html:1611-1614.
- **"Delete your account" now tells the truth and does the local half.** Dialog
  reads "There is no account server in this build, so nothing can be deleted
  from one…"; confirming erased the store, wrote `lk_guestMode=1`, and
  profile.html then opened with `data-state="guest"`. settings.html:1313-1321.
- **Export a backup builds a real file.** `row-export` produced a download named
  `LOCKED-backup-2026-09-09.json`; parsed it: `{app:"LOCKED", exported:
  "2026-09-09", keys:4, data:{lk_badges,lk_profile,lk_cycle,lk_theme}}`. Toast
  quoted the real key count and 211 bytes. settings.html:436-461.
- **Restore has a real file input and loads.** `confirm-restore` → clicked
  `#restore-file` (accept `application/json`), fed it the exported file: toast
  "4 keys restored from …", and the four keys were back in `dump()` both
  immediately and after a reload. settings.html:466-503.
- **Streaks and badges is a real streak.** profile.html?state=badges header reads
  "No run going, last trained Sep 7 · best 3", `data-current="0"
  data-best="3"`. Hand-checked against lk_history: last session 2026-09-07,
  TODAY 2026-09-09 so the current run is genuinely 0; longest consecutive run in
  the fixture is 09-05/06/07 (and 08-29/30/31) = 3. Card adds "…2 days ago,
  which is what ended the run."
- **Storage used is measured.** Fresh profile: "12 bytes of 5.0 MB on this
  phone, in 1 key", `data-bytes="12"`. After writing a 4.3 MB key it read
  "4.3 MB of 5.0 MB … in 5 keys", the meter carried `meter--warn` and an amber
  line appeared. settings.html:1116-1129 (threshold 80%).
- **Every Class-2 setting persists.** Set each, reloaded, read the row back:
  display name → `lk_profile.displayName:"Frankie"`; body stats →
  `age:31, heightCm:170, weightKg:66.5`; reminder off → `lk_reminderOn:false`;
  reminder time → `lk_reminderAt:"20:00"` ("8:00 PM"); check-in →
  `lk_checkin:"both"` + `lk_checkinPerDay:2`; plate rounding →
  `lk_plateKg:5`; week start → `lk_weekStart:"sun"`; distance →
  `lk_cardioPrefs.distUnit:"mi"` (merged, other cardio fields intact); rest
  timer → `lk_restEnabled`; partials → `lk_hidePartials`.
- **Guest mode is read from `lk_guestMode`, not just the dev switcher.** Wrote
  `lk_guestMode="1"` from the console, loaded profile.html with no query
  string: `data-state="guest"` and `guest-banner` present. Settings' Sign out
  and Delete both write the key and Profile picks it up. profile.html:531-533.
- **Weight unit propagates.** `opt-unit-lb` → `lk_profile.useKg=false`; then
  settings body row "141.5 lb", profile totals "309k lb" / PR "363.8 lb",
  progress "141.5 lb", home.html in lb. (140,204 kg × 2.20462 = 309,097 → 309k;
  165 kg → 363.8 lb. Both correct.) profile.html and settings.html both
  subscribe to `LKUnits.onChange`.
- **Notifications built.** Master switch calls `Notification.requestPermission`
  (stubbed to grant): wrote `lk_notifOn:true`. Six per-type switches write
  `lk_notifPrefs` (`{"workout":true,"rest":true,"checkin":true,"streak":false,
  "goal":true,"supps":true}` after toggling streak) and survive reload. Sound
  picker writes `lk_restSound:"chime"`, survives reload, and plays via
  WebAudio. `notif-test` constructed a real Notification
  ("LOCKED" / "This is what one looks like…"). Blocked state renders
  `notif-blocked` under real headless Chromium (permission denied). The card
  states plainly that scheduling needs a service worker this build has none of.
- **Storage meter / sync status.** Sync row reads "Never synced. This build has
  no server to sync with."; pressing `sync-now` ends with "Not in this build.
  Nothing has left this device." and writes **no** `lk_lastSync`. Profile's
  identity card reads "Not backed up — Nothing has left this device."
  settings.html:821-847.
- **Change-password form with four validations.** Empty → "Type the password you
  use now."; 5 chars → "A new password needs at least 8 characters."; same as
  current → "That is the password you already have."; mismatch → "The two new
  passwords are not the same."; valid → "…Nothing was changed and nothing was
  sent: this build has no account server." settings.html:1641-1659.
- **F-PROF-060 storage-unit row present.** "Your logs are stored in kilograms —
  Changing the weight unit converts what you see. It does not relabel it, and
  nothing in your history is rewritten." (`row-storage-unit`, settings.html:961).
- **Force refresh works.** `row-force-refresh` cleared caches and fired a real
  page `load` event (observed). settings.html:631-641.
- **Profile's own figures are counted, not stated.** Screen shows 22 sessions /
  12 records / 288 sets / 140k kg; summing `lk_history` in node gives exactly
  22 / 288 / 140,204, and `totals.records` is 12. The six PR rows are the top
  six of the nine flat fixture rows, and the header honestly says "12 in all".
- **F-PROF-021 analyse route reachable** — a photo's detail sheet offers
  "Analyse this photo", which opens a consent sheet naming exactly what would
  leave the device and then says "Not in this build. No photo has left this
  device." (progress.html:1123-1156).

## Still open

- **Nothing Progress writes persists.** `saveGoals()` (progress.html:317),
  `saveWeight()` (:261), `saveRecords()` (:236), `savePhotos()` (:291) and
  `saveBF()` (:269) are all defined and **never called anywhere in the file**
  (`grep -n "save\(Goals\|Weight\|Records\|BF\|Photos\)()" progress.html` returns
  only the definitions). Confirmed live: logged 70.5 kg → row read "70.5 kg",
  `LKStore.touched('lk_weightLog')` = **false**, after reload the row was back
  to "64.2 kg"; added a goal → 4 goals on screen, `touched('lk_goals')` = false,
  3 after reload; saved a 200 kg × 3 record → `touched('lk_prs')` = false, gone
  after reload; deleting a photo likewise reverts. This is the same class of
  defect the audit raised against Settings, now the whole of Progress.
- **F-GOAL-001..004 essentially untouched.** progress.html:889-930 renders the
  three seeded goals, but the add form (`gl-name`, `gl-by`) is still exactly
  "a name and a free-text date" — I enumerated the inputs inside `goals-sheet`
  after pressing `goals-add`: `['gl-name:text','gl-by:text']`. `saveGoal()`
  (:1288-1298) pushes `{name, by, now:'Not started'}` — no type picker, no
  target value, no exercise search, no date input, no notes, so the new goal
  shows **0% forever**, exactly as the audit said. Also still missing: completed
  section, empty state, edit path, detail view with progress ring and
  START/CURRENT/TARGET tiles, deadline chip, mark-complete, delete.
- **F-PROF-008/009/010 progress photos not built.** progress.html:1210-1211:
  `add-photo` does nothing but toast "Taking a photo needs a camera, which this
  build does not have." I confirmed `document.querySelectorAll('input[type=file]')`
  is empty before and after pressing it — there is no `capture="environment"`
  input, no library input, no canvas downscale, and no note field. The two
  seeded "photos" are flat colour blocks (`photoTile`, :1088).
- **F-PROF-015 lightbox prev/next and "n of N" missing.** `photoSheet`
  (progress.html:1123-1140) renders the image, an optional note, Analyse and
  Delete. No previous/next control and no counter; opened `photo-0` and there is
  nothing to move to `photo-1` with.
- **F-GOAL-006 body-fat log missing entirely.** `lk_bfLog` is read into `BF`
  (progress.html:267) and `BF_METHODS` is declared (:270), but neither is
  rendered anywhere: `grep -in "body fat" progress.html` returns nothing, and
  "Also tracked" (:733-770) has only Body weight, Photos and Goals. No
  percentage input, no method chips, no 1–75 validation, no history. The two
  seeded readings (24.1% on 2026-08-03, 23.2% on 2026-08-31) remain unreadable.
- **F-TRAIN-512 non-PR rejection missing.** `grep -rn "Not a PR" 08-build/*.html`
  returns nothing. `saveRecord()` (progress.html:1302-1316) validates only
  "load > 0" and "reps ≥ 1" and then `RECORDS.unshift(...)`; I saved 200 kg × 3
  and it was accepted with no comparison against the existing best at 3 reps.
- **Class 2: the rest timer and partial-rep settings still reach nothing.**
  Settings now persists them correctly, but workout-log.html:279-280 still
  initialises `hidePartials: false` and `restEnabled: true` as literals and the
  only occurrences of `lk_hidePartials` / `lk_restEnabled` / `lk_restSec` in
  that file are those two comments. Confirmed: wrote `lk_hidePartials=true`,
  `lk_restEnabled=false`, `lk_restSec=180`, opened workout-log.html — four
  visible `span.partials__label` "Partials" controls were still rendered.
- **F-PROF-061 nutrition CSV exports the wrong thing.** settings.html:595-607
  iterates `lk_nutrition.foods` — the 8-item food *catalogue* — and appends the
  daily target. The download (`LOCKED-nutrition-2026-09-09.csv`) is
  `name,kcal,protein_g,carbs_g,fat_g` with 8 food rows and no date column, while
  `lk_nutrition.days` holds the actual log (4 days, ~14 meals with dates, times
  and slots) and is never touched. The row calls it "A CSV of every meal and
  your daily targets", which the file does not contain.
- **onboarding.html:739-742 password reset still overwrites the typed email.**
  The `reset` branch unconditionally assigns `email.value = 'cesco@example.com'`
  and announces "If cesco@example.com has an account, a link is on the way",
  regardless of what was typed. (Another agent's file — reported, not fixed.)
- **exercise-library.html:189 still prints kg whatever the setting says.**
  `function kg(v) { return n(v) + ' kg'; }`, used at :871, :1064-1065; the file
  contains no reference to `LKUnits`. With `lk_profile.useKg=false` every other
  screen switched to lb and this one cannot. (Another agent's file — reported.)
- **F-GOAL-005 / F-GOAL-007 have no local half.** There is no goal-analysis
  entry point anywhere (goals have no detail view at all) and no body-fat
  estimate route, so neither the local work nor the plain statement the audit
  asked for exists. The photo-analysis consent flow (F-PROF-016..019) is the
  only one of this family that was built.
