# Feature completeness audit — what the original did that the rebuild does not,
# and what the rebuild says it does but does not

Scope: `08-build/` (13 screens) and `10-final/locked-demo.html`, against
`input/locked-current-v6.html` as inventoried in `00-inventory/page-map.md`.
Everything below was driven with Playwright 1.56.1 (Chromium at
`/opt/pw-browsers`), never read-and-assumed. Scripts left in `redesign/tests/`:

| script | what it does |
|---|---|
| `agent-feat3-reach.mjs` | BFS over the assembled demo from the five tabs only — never the screen index, never a typed hash — clicking every visible control in the visible shadow root and recording which route each click produces |
| `agent-feat3-nav.mjs` | every declared cross-screen edge in the demo's MANIFEST: does the selector ever render (default state and each of the screen's own dev states), and does clicking it change the route |
| `agent-feat3-chain.mjs` | multi-step probes inside the demo (open a sheet, then press the thing inside it) |
| `agent-feat3-probe.mjs` | single-selector probe in the demo, fresh load per selector |
| `agent-feat3-claims.mjs` / `agent-feat3-deep.mjs` | drives label-bearing controls on the standalone screens through each screen's own dev switcher, typing real input where the control needs it, and diffs the region the label promises to change |
| `agent-feat3-wl.mjs` | workout log: every exercise-sheet action, counting exercises and sets rather than diffing markup |
| `agent-feat3-fuel.mjs` | every Fuel control in all seven states, watching the day's totals |
| `agent-feat3-shop.mjs` | shopping and budget write paths, counting rows |

---

## A. Reachable from the five tabs? Two screens are not

Driven with `agent-feat3-reach.mjs`. Eleven of thirteen screens are reachable by
tapping alone. Zero console errors on the whole crawl.

| Screen | Reached by |
|---|---|
| home, train, fuel, coach, profile | their tab |
| progress | Home → Climbing lift row (`row-climbing-lift`) |
| settings | Profile → Settings row, and Home → avatar (`open-account`) |
| workout-log | Train → Start Push (`start-today`) |
| split-builder | Train → New, Train → split sheet → Edit split, Coach → plan's "Runs on …" row |
| exercise-library | Train → Exercise library row |
| shopping | Fuel → **More** chip |
| **review** | **nothing. Screen index only.** |
| **onboarding** | **nothing. Screen index only.** |

### A1. Review is orphaned by a one-word selector mismatch — highest severity

`10-final/assemble.mjs` declares the edge

```
{ from: 'workout-log', selector: '[data-action="finish"]', to: 'review', mode: 'push' }
```

but the Finish button in `08-build/workout-log.html:337` is
`data-act="finish" data-testid="btn-finish"` — `data-act`, not `data-action`.
`agent-feat3-nav.mjs` reports `SELECTOR NEVER RENDERS` for this edge across every
one of the nine workout-log dev states. Pressing Finish
(`agent-feat3-chain.mjs`) leaves the route on `#/train/workout-log` and raises a
toast reading **"3 sets saved. Opening review."** — the one screen in the app
that ends the core flow is both unreachable and announced as reached.

Review itself is a finished, well-wired screen (save, armed discard, feel chips,
the carry-into-the-split decision with per-change picking and undo, AI insight
with loading/error — `review.html:868-970`). It is 996 lines that no tap reaches.

**Where it should live:** the demo's `pushed` table already declares it under
Train with a back control. Fixing the selector to `[data-act="finish"]` is the
whole repair.

### A2. Onboarding has no entrance anywhere in the app

`onboarding.html` is a 17-step setup flow (name, units, experience, days per
week, …, `onboarding.html:439+`). Nothing pushes it, and the three controls that
should:

| Control | File | What it does |
|---|---|---|
| Profile → guest banner → **Create an account** (`signup`) | `profile.html` | nothing. The file's only click branch is `if (data-action === 'retry')` (`profile.html`, click listener) |
| Profile → new-account state → **Start** (`start-first`) | `profile.html` | same handler; nothing |
| Settings → **Create an account** / **Sign in** (signed-out and guest states) | `settings.html:890` | `toast('Account setup opens next.')` |

So a guest — the mode the original supported as a first-class path — has no way
to become an account holder, and a new install has no way into setup.
`ProfileScreen`'s two live interactions (`upgradeFromGuest`, `go("settings")`)
are still both dead in the file; Settings only works because the demo router
intercepts `open-settings` before `profile.html` sees it.

### A3. Two routes exist only in states that also carry the data

`row-climbing-lift` (the only tap to Progress) renders in default / training /
live / rest, and **not** in Home's empty, loading or error states. `chip-more`
(the only tap to Shopping) is absent from Fuel's empty, loading and error
states. A new user on an empty Home cannot reach Progress at all.

### A4. Cross-screen taps that are toasts

These render, are pressed, and announce a destination that no route serves.
Train's are documented in a code comment (`train.html:815-817`, "in the demo they
say where they go"); Coach's and the library's are not.

| Screen | Control | Toast |
|---|---|---|
| train | history row (`open-session`) | "Opens that session." — the Workout Detail screen does not exist (§B2) |
| train | day row in the split sheet (`start-day`) | "Starts that day." |
| coach | plan → **Start Push** (`plan-start`) | "Starting Push in Workout Log, loaded from this phase." The demo declares this edge as `[data-act="plan-start"]`; the element is `data-act="start" data-testid="plan-start"`, so like Finish it never matches |
| coach | a phase target row (`target`) | "Opening this lift in Progress." |
| coach | bind toast's **Open in Train** | "Opening PPL in Train." |
| exercise-library | **Start a workout with this** / **Add to today's workout** | "Workout started with Barbell Bench Press." / "Added … to today's workout." |
| exercise-library | **Add to a split day** | "Added … to Push, PPL." |

---

## B. What the original did that the rebuild does not

### B1. Coach Check-In — dropped silently, and three surfaces still reference it

The original Coach had four panes: Chat, Plan, **Check-In**, Setup
(`page-map.md` §2.13, `CoachScreen` pane bar L50912; the check-in pane rendered
`FeedbackScreen` L52547, which wrote `lk_feedback` and `lk_coachMoodRaisedAt`).
`lk_feedback` drove Home's feed card and fed the coach its sleep/soreness/stress
context.

The rebuild's `coach.html:301` is `var VIEWS = [['chat','Chat'],['plan','Plan'],['setup','Setup']]`.
There is no check-in anywhere in `08-build/` — no writer, no reader, no screen.
Nothing in the changelog or in any code comment says it was cut. Meanwhile:

- `coach.html:199` still lists **"Check-ins — Sleep, soreness and stress you have entered"** as a data permission Coach can be granted, and `:245` defaults it on;
- `coach.html:424` still tells the user "I can see 18 sessions over 6 weeks, 9 lifts **and your check-ins**";
- `settings.html` still ships a **"Daily check-in — Evening"** reminder row.

Three places promise a thing the app can no longer record. Also gone with it:
the original's check-in frequency setting (`checkinPerDay` 1/2/4) and Home's
`checkin` quick action.

**Where it should live:** a fourth Coach view, or a Home card. It is the only
input the coach has that is not derived from the log.

### B2. Workout Detail — dropped silently

`WorkoutDetail` (page 9 of 18, 773 lines: a past session's exercises and sets,
its reflection, its note, its AI insight, rename/edit, delete, and
**Convert to split**) has no successor. `grep -ri "workout detail"` over
`08-build/` returns nothing. Train's history list and Home's last-session row
both point at it; Train's row toasts "Opens that session."

Consequences that reach other screens: there is now nowhere to read a session's
note (and Review no longer captures one — §B6), and `ConvertToSplitModal`
("turn this session into a split") is gone with it.

**Where it should live:** pushed from Train → History, and from Home's
`row-last-session`.

Written acknowledgement: `10-final/scorecard.md` §3 names `workout-detail` as
one of eight pages "not rebuilt", but that list is stale — it also names Cardio,
PR Vault, Profile, Shopping-Budget and Fuel, all five of which are now built.

### B3. Cycle Tracker — dropped silently

`CycleTrackerScreen` and its four sub-components (page 5, 1,032 lines: onboarding,
day log sheet with flow/symptoms/mood/note/events, calendar, settings with cloud
sync and delete-all, training banner) have no successor.
`grep -ri "cycletrack\|CycleTracker"` over `08-build/` returns nothing. The
directive's Gate-3 hypothesis was "merge 5 into 2" — Progress does not carry it,
and `progress.html`'s own CUT list (`:40-53`) does not mention it.

The only traces are two removals of its *pointers*: Home's cycle row
(`home.html:41`, "CUT: … cycle row") and Settings' cycle-logging flag
(`settings.html:87`). Both read as tidying a link, not as deleting a screen.

**Where it should live:** the directive's own answer — as a Progress section
behind the existing sex condition.

### B4. Replace an exercise mid-workout — built as a label, wired as an append

The original had a dedicated `ReplacePanel` (`page-map.md` §2.7) reached from the
exercise action sheet. The rebuild's exercise sheet still offers **"Swap
exercise"** (`workout-log.html`, `exSheetHTML` items), and `case 'exact'` maps
`swap` to `S.overlay = 'addex'` — the *add* picker, whose `addex-pick` branch
does `S.exercises.push(...)`.

Measured (`agent-feat3-wl.mjs`): before 5 exercises
`[Bench | DB Shoulder Press | Incline Cable Fly | Lateral Raise | Tricep Pushdown]`,
after Swap → pick: **6 exercises**, the original still first, toast
"Lat Pulldown added." Nothing was swapped.

### B5. Per-exercise notes and per-exercise equipment — dropped silently

The original stored `lk_exNotes` (a note per exercise, shown in the log and the
detail modal) and `exequip_<id>` (which equipment variant of a lift *your* gym
has, which drove the plate calculator's bar and the starting resistance —
`page-map.md` §2.7, §2.10). The rebuilt exercise detail sheet shows equipment as
a read-only fact ("EQUIPMENT · Barbell") and offers no note field; the workout
log carries `note: ''` on each exercise and a `note` input for the *session*
block, not the exercise.

### B6. Review's free-text session note — dropped silently

Original Review step 2 captured ratings **and** a note (`page-map.md` §2.8,
L15969). The rebuild keeps the ratings as feel chips (`review.html:637`,
`data-feel`) and has **zero inputs on the screen** (confirmed by the manifest's
own Inputs column and by grep: no `<textarea>`, no `<input>`). With Workout
Detail also gone (§B2), both the writer and the reader of a session note are now
absent.

### B7. Cardio — moved into Train, but reduced to a one-tap logger that does not log

Cardio (page 12) correctly merged into Train: a Cardio section with a
minutes-per-week chart, favourite rows, and a searchable 41-activity sheet
(`train.html`, `cardioBlock` / `activitySheet`). Two things did not come with it:

1. **The log flow.** The original `CardioLogFlow` captured duration, distance,
   intensity and computed calories from body mass. The rebuild logs at a fixed
   default: rows read "30 min by default" and the handler takes the minutes
   straight out of the `aria-label`. There is no way to log 22 minutes.
2. **Favourites management.** `lk_cardioFavorites` was user-editable; `CARDIO_QUICK`
   is a hardcoded array.

And the log does not happen at all: `train.html:806-811` for `log-cardio` is
`say('Logged ' + name + '.')` and nothing else. Measured
(`agent-feat3-claims.mjs`): the Cardio section is **byte-identical** before and
after — "120 min in 4 weeks" stays 120, no history row appears — while the toast
says "Logged Upright bike · 25 min." with an Undo beside it for something that
never happened.

### B8. The badges / gaming layer toggle — dropped, leaving Profile's badges unreachable

`profile.html:21-23` explains "Streaks and badges are **a setting**, off unless
somebody turned them on." No such setting exists: `settings.html`'s full row list
(driven, §C4) has no gaming-layer, streak or badge control anywhere. The
original's `lk_gamingLayer` toggle is gone. The `badges` state of Profile can
therefore be reached only from the dev switcher or the demo's screen index.

### B9. Fuel's other input paths — see §D

Food text search, barcode scanning, recipes, macro-target editing and the Fuel
cycle tab are all gone; details and evidence in §D, because the brief for Fuel is
its own question.

### B10. Coach chat's saveable cards, other than the plan

The original coach reply could carry a split, a **recipe**, a goal, a food entry,
a cardio entry or a shopping approval, each with its own save path
(`page-map.md` §2.13, L50314-L50341). The rebuild keeps the plan card
(`chat-save-plan`, `chat-open-plan`, `chat-dismiss-plan`) and the split link, and
drops the other five. Recipes have no home anywhere in `08-build/`
(`grep -ril recipe` returns nothing).

### B11. Smaller drops, no comment anywhere

- **Change your password.** Settings' account section has Sign out, Erase everything and Delete your account, but not the original's password change (`page-map.md` §2.17, L32471).
- **Superset and left/right tracking.** Both survive as rows in the exercise sheet and both are toast-only: `case 'exact'` falls through to `toast('Superset on.')` / `toast('Left and right tracked separately.')`. Measured: exercise list identical before and after (`agent-feat3-wl.mjs`).
- **Discard a workout.** `discard-confirm` toasts "Workout discarded." and leaves all five exercises on screen; the original returned Home and cleared `lk_activeWorkout*`.
- **`mockup-bodymap.html`** is gone from `08-build/`, and with it the group-region zoom demo. `scorecard.md` §4 still says it "remains as the screen that also demonstrates the zoom into a group's regions". (The manifest itself is now clean — see §E.)

### B12. Deliberate cuts, correctly argued in code or changelog — not gaps

Recorded here so a future reader does not re-litigate them: Home's greeting,
2×2 stat grid, quick actions, feed cards, Weekly Recap, calendar, ThrowbackCard
and voice FAB (`home.html:38-42`); Progress's tab strip, Photos, Calendar,
day-1-vs-PR cards, Strength Profile, third range option (`progress.html:40-53`);
Settings' LayoutEditor, beta code, Replay Tutorial, cycle and microphone flags,
text size, Fuel display preferences, the five app themes and the privacy block
(`settings.html:77-105`); Fuel's Fuel Score and receipt scanning, the latter
moved to Shopping and working there (`fuel.html:26-32`); TutorialOverlay, cut by
the directive.

### B13. Moved, and found where they went — not gaps

PR Vault → Progress's **Records** section, including "Log a record without a
workout", which writes (measured: a 200 kg × 5 Leg Press record appears at the
top of `records-list` and re-sorts the list). Body-weight logging → Progress's
body-weight row (measured: 70.5 kg logged, row updates). Goals → Progress's goals
sheet. Cardio → Train (§B7). Shopping and Budget → Fuel's More chip. Receipt
scanning → Shopping's Budget panel, where it works (week spend $86.40 → $138.80,
purchases 3 → 4). Exercise detail's YouTube clip → the inline Demonstration
block. The Pantry's per-row star/cart/cross → the pantry sheet.

---

## C. Claims the rebuild does not deliver

Everything here was verified by driving the control, not by reading it. §A2, §A4,
§B4, §B7, §B8 and §B11 are claims as well as gaps; not repeated.

### C1. "Opens a search for each of your first ten unchecked items, one tab at a time"

Shopping → **Shop at** sheet. That sentence is the sheet's own body copy. Both
store rows are `data-testid="sa-s1" data-action="close"`, as are the item
sheet's "SEARCH FOR IT → Walmart / Target" rows (`find-s1`/`find-s2`, all
`data-action="close"`). Dumped live in `agent-feat3-shop.mjs`. Picking a shop
closes the sheet and does nothing else, so the entire **My Stores** panel — the
preset chips, the on/off toggles, the custom-store form, all of which work — has
no consequence anywhere in the app. This is unchanged from the previous features
review.

### C2. The session shelf cannot return you to the session

`home.html` and `fuel.html` both render an accessory shelf in the `live` state
whose whole stated purpose is that "a session that is running is visible from
whichever tab you wandered to" (`fuel.html:55-57`). `shelf-resume` has no branch
in either file's click handler — `home.html` has no `[data-action]` listener at
all. Measured: clicking it leaves both screens byte-identical. Unchanged from the
previous review.

### C3. "Numbers are off in Settings"

Fuel's `hidden` state (a good idea, well executed) says exactly that. Settings
has no such control — its full row list is in §C4 and the changelog explicitly
cut "Fuel display preferences (hide calories, Left/Eaten)" as belonging on the
Fuel screen (`settings.html:93-95`). The state is real; the sentence points at a
switch that was deliberately deleted and never replaced on Fuel either.

### C4. Settings, driven: what actually works

For the record, because most of it does. Driven with `agent-feat3-deep.mjs`:
display name (identity row → field → Save → the row and its avatar initial
change to "B / Bruno"), body and goal (64.2 → 99 kg, row updates), Sync now
(row goes to "Checking for changes / Syncing"), and all three switches — rest
timer, count partial reps, workout reminder — flip and **survive a state
round-trip**. The dead ones are Create an account and Sign in (§A2).

The full row inventory is: identity, body and goal, sync; weight unit, distance,
week starts on, appearance; rest timer, rest between sets, count partial reps,
round weights to; workout reminder, reminder time, daily check-in; storage used,
export a backup, restore from a backup, sign out, erase everything, delete your
account. Twenty rows against the original's twenty-nine buttons — the difference
is §B8, §B11 and the deliberate cuts in §B12.

### C5. Screens that are clean

Driven to exhaustion with no claim broken and no dead control found:
`review.html` (every action in the switch at `:868` observable),
`split-builder.html` (all eleven presets, manual and AI, save gated on dirty +
valid which is correct), `exercise-library.html` (create-custom writes — "Zercher
hold added to Lower Chest" and the list re-renders around it; the body map's
twelve groups all select and land on the same place the list row lands),
`progress.html`, `coach.html` chat and setup, `onboarding.html`.

`shopping.html` has been substantially repaired since the previous review: clear
done (12 → 9 rows), clear all (12 → 0), keep-them-separate (12 → 13),
save-purchase (validates name / price / store, then writes), receipt-save
(spend and count move), the three history ranges (3 / 5 / 5 rows, receipts 2),
export (real clipboard write with an honest failure message), compare and
find-swaps. What remains broken there is §C1 only.

`workout-log.html`'s add-exercise search — dead in the previous review — now
filters (6 rows → 0 on "zzzq").

---

## D. Fuel against its brief

Fuel is well built and, unlike most of the build, its write paths move the
number: `agent-feat3-fuel.mjs` shows the hero figure and the day's macros
tracking every log, and Undo restoring them exactly.

| Required | Present? | Evidence |
|---|---|---|
| Voice logging | **Yes** | Say it → sheet → Log it: hero 1,410 → 380, meals 4 → 6 |
| Camera logging | **Yes** | Snap it → the oil question (None / A little / A lot, and the answer changes the plate's kcal and fat) → Log it: hero 1,410 → 560, meals 4 → 5 |
| Barcode path | **No** | `grep -i barcode` in `fuel.html` returns only prose. There is no scan control in any of the seven states. The original shipped a real scanner (`input/locked-current-v6.html:19075-20970`, zxing + `BarcodeDetector` + `getUserMedia`) as its own Fuel tab |
| Verified source badge | **Partly** | The badge exists and is well argued (`fuel.html:289-293`, and the meal sheet explains "A barcode matched a database row"), but nothing in the app can *produce* a verified row by scanning: the two seeded rows and the canned voice/often results simply carry `src:'verified'` |
| Macro targets | **Read-only** | Protein 121/160 g, Carbs 178/380 g, Fat 58/80 g render and move with each log. There is no way to set or change a target — no input on the screen at all (0 inputs, all states), and no Settings row for it. The original had a Fuel `plan` tab |
| Water | **Yes** | Water chip → sheet: +250 ml takes 1.75 → 2.00 L, −250 takes it to 1.50, meter follows. The daily goal is fixed |
| Supplements | **Partly** | Supps chip → sheet, each row ticks and holds. The list is fixed: no add, edit, remove or schedule. The original had a supplements tab and a reminder card |
| Trends | **Partly** | Trends chip → 14-day energy line with average, low and high. Calories only — no protein, no weight, no macro trend |
| Meals you log often | **Yes** | Meals → an "often" list; one tap logs it again (hero 1,410 → 870, meals 4 → 5, and the row's own count increments) |
| Shopping | **Yes** | More chip → `shopping.html`, four panels, all working except §C1 |
| Budget | **Yes** | Inside `shopping.html`'s fourth segment: target with edit/save, week and month tiles, purchase form, receipt scan, price comparison, swaps, history with delete and four range filters |

Also gone from the original Fuel and not requested by the brief, so listed once:
**food text search** (there is no way to log a food by typing its name — the
resolver-backed one-result card the brief specifies in §4 has no UI at all),
**recipes**, and the **cycle** tab.

Two smaller things inside Fuel:

- `shelf-resume` is dead (§C2).
- The meal detail sheet reports Energy and Protein only, though the record now
  carries carbs and fat and both are correctly subtracted on delete and rescaled
  on a portion change.

One note on the brief itself: `07-briefs/fuel-data-layer.md` §"What this means
for the redesign demo" §2 says navigation is "Home, Train, Fuel, **Progress**,
Coach" and that "Profile does not earn a tab". The build ships Home, Train, Fuel,
Coach, Profile with Progress pushed under Home. The built shape matches the
instruction I was given; the brief in the tree still disagrees with it.

---

## E. The freeze manifest is now clean

`python3 11-apple/gen-manifest.py` against the current tree differs from the
committed `FEATURE-MANIFEST.md` **only in the Lines column** (fuel 813 → 825,
onboarding 1133 → 1148, progress 1029 → 1038, shopping 1522 → 1525), which the
manifest's own text excludes from the freeze. Actions, listeners, buttons, inputs
and testids are identical across all thirteen screens. The two drifts the
previous review reported — `mockup-bodymap.html` and `shopping.html`'s
`pan-interval` — are resolved in the manifest, though the file itself is still
gone and `scorecard.md` still promises it (§B11).

Worth saying plainly, since the manifest is the freeze instrument: it counts
*declared* actions, so it cannot see any of §B4, §B7, §C1 or §C2. Every one of
those is an action that is present, dispatched and does not do its job. A freeze
built on `data-action` values will pass a build in which every one of them is a
toast.

---

## F. Ranked

1. **Review is unreachable** and Finish claims to open it. One selector
   (`data-action` → `data-act`) in `assemble.mjs`. §A1
2. **Onboarding is unreachable** and the three controls that should reach it are
   dead or toasts, so a guest can never make an account. §A2
3. **Coach Check-In is gone**, silently, while three surfaces still say the app
   has check-ins. §B1
4. **Workout Detail is gone**, silently; Train's history rows and Home's
   last-session row point at it. Convert-to-split went with it. §B2
5. **Cycle Tracker is gone**, silently; the directive said merge it into
   Progress and it is not there. §B3
6. **Logging cardio does not log.** Toast plus Undo for a write that never
   happens; and there is no way to log a duration other than the default. §B7
7. **"Swap exercise" appends a sixth exercise instead of replacing the first.**
   §B4
8. **Shopping's whole Stores panel has no payoff** — both store-search paths are
   `data-action="close"` under copy that promises ten browser tabs. §C1
9. **Fuel has no barcode path and no food search**, so the verified badge is a
   claim nothing in the app can earn, and the macro targets cannot be set. §D
10. **The session shelf cannot resume the session** on either screen that
    renders it. §C2
11. Superset, left/right tracking and Discard are toast-only. §B11
12. Per-exercise notes and equipment, Review's session note, the badges toggle,
    password change, recipes, coach's non-plan cards. §B5, §B6, §B8, §B10, §B11
