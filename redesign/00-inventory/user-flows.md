# User Flows — LOCKED v6 (input/locked-current-v6.html)

All line refs are into `input/locked-current-v6.html`. Selectors: the app has no `data-testid`; use `text=`, `[aria-label=]`, `role=`, or DOM position as given. Tap counts count clicks only; native-input typing = 0 taps (noted). NumPad digits count 1 each.

## Global preconditions (every flow)

| Key | Value | Why | Ref |
|---|---|---|---|
| `lk_guestMode` | `"1"` | Guest boot: no auth overlay, `isPro:true`, no paywall, no trial banner | 164-166, 325, 331-340 |
| `lk_profile` | `{"displayName":"Cesco","username":"cesco","useKg":true}` | App renders `Onboarding` instead of shell when displayName/username missing | 57539-57541 |
| `lk_tutorialSeen` | `"true"` | Otherwise `TutorialOverlay` covers the shell on boot (fixed, full-screen) | 57219-57221, 57757 |
| `lk_activeWorkout` | absent | Otherwise "Resume Workout?" modal (`text=Resume Workout?`) at zIndex 2000 | 57262-57266, 57761 |
| `lk_activeWorkoutRows`, `lk_activeWorkoutSec`, `lk_activeWorkoutRestTarget` | absent | Stale rows send `startWorkout` to Review instead of the log | 57402-57410 |
| `lk_ui_trainView`, `lk_ui_fuelView` | absent or `"main"` | Hub sub-views persist across reloads via `useHubState` (`lk_ui_*`) | 2121-2138, 15025-15026, 36904-36905 |
| `lk_ui_trainTab`, `lk_ui_fuelTab`, `lk_ui_shopTab`, `lk_ui_progressTab` | absent | Same; defaults `splits` / `list` / `shopping` / `overview` | 15025, 36904, 45969, 28324 |
| `lk_proactiveTip` | `{"date":"<today ISO>","text":"..."}` | Home `insight` block calls the worker on mount when no same-day cache | 17858-17866, 17904 |
| `lk_throwbackDismissed` | ISO timestamp within 3 days | Suppresses random ThrowbackCard on Home/Progress | 4606-4610, 4662, 28328 |
| `lk_restEnabled` | `"false"` (optional) | Stops the 90 s rest countdown + `lockedRest` banner after each done set; not blocking | 10441-10443, 10807 |

Network: guest mode never touches Supabase for data; only `fetch` to `lockedapi.cescocugliari.workers.dev/` (AI, 2665, 50063, 17904), `/store-search` (42458, only when a store is enabled), `/beta-*` (only when `lk_betaStatus`). Nav bar: `nav[aria-label="Main navigation"] button[aria-label^="Home|Train|Fuel|Coach|Profile"]` (7695-7724); active tab gets `aria-current="page"` and aria-label suffix ` (current page)`, so match with `^=`.

Screen routing: `App.screen` string, `go()` at 57512-57531; `renderTab()` 57586-57728. Nav hidden on `review` (57585). Escape key closes the topmost overlay (`useEscape`, 5160).

---

## Flow 1 — Guest start to first logged set

Page sequence: auth overlay (`#locked-auth-overlay`, 771-790, pure DOM) → guest modal (`#locked-guest-modal`, 893-916) → reload → `App` 57186 → `HomeScreen` 26220 → `TrainHub` 15013 → `WorkoutLog` 10013 → `ExLib` 7761 (view `add`, 11388) → `ExerciseDetailModal` 7202 → `WorkoutLog` → `NumPad` 9847.

Two starting points. **1A** (true cold start, no `lk_guestMode`, no `lk_profile`) exercises the DOM overlay. **1B** (seeded per Global preconditions) skips steps 1-2. Baseline should run 1A once and use 1B seeds elsewhere.

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 1 | "Continue without account" | `#locked-auth-overlay button:has-text("Continue without account")` (885); only in login mode | `_showGuestModal()` appends `#locked-guest-modal` (895-914) | Guest disclosure modal |
| 2 | "CONTINUE AS GUEST" | `#locked-guest-modal button:has-text("CONTINUE AS GUEST")` (910) | `enterGuestMode`: sets `lk_guestMode="1"`, seeds `lk_profile` `{displayName:"Athlete",username:"athlete",useKg:true}` if absent, `location.reload()` (167-178) | Reload → Home. **TutorialOverlay appears** (57219) unless `lk_tutorialSeen` |
| 2b | "Skip tutorial" (only if tutorial shown) | `button:has-text("Skip tutorial")` (54490); intro phase, opacity transition 0.85 s delay | `sd("tutorialSeen",true)`, `onDone` (54368-54371, 57756-57758) | Home |
| 3 | " START WORKOUT" | `button:has-text("START WORKOUT")` in Home `start` block (26634-26657); 5th block in default order (26062-26072), may need scroll | `go("train")` (26636) | TrainHub, My Splits tab |
| 4 | "Quick Start" | `button:has-text("Quick Start")` in TRAIN header (15352-15369) | `onStart({name:"Quick Workout",exIds:[]})` → `startWorkout`: `sd("activeWorkout",...)`, `setScreen("workout")` (57398-57410) | WorkoutLog, empty state "No exercises yet" / "Tap Add Exercise below" (12132-12147) |
| 5 | " Add Exercise" | `button:has-text("Add Exercise")` dashed (13664-13686) | `setView("add")` (13665) | ExLib picker (Back button `[aria-label="Back"]` 8494) |
| 0 | type ≥2 chars, e.g. `Bench` | `input[placeholder="Search all exercises..."]` (8523-8528); results render when `q.length > 1` (8191) | `setQ` | Search results list of `ExBtn` (8285) |
| 6 | exercise row | `button:has-text("Bench Press")` (ExBtn 7798-7812; whole card is a `<button>`) | `setSelectedDetail(ex)` (7803) | ExerciseDetailModal sheet |
| 7 | "ADD TO WORKOUT" | `button:has-text("ADD TO WORKOUT")` (7463-7476) | `onSelect(ex)` → `mkRow` appends row with 3 empty sets (or last-session sets, 10054-10099) → `setView("log")` | WorkoutLog with one exercise, 3 rows |
| 8 | set 1 weight cell | `button[aria-label="Set 1 weight"]` (13378) shows `--` | `setNumpadTarget({field:"w"})` (13367-13373) | NumPad portal in `#lk-sheet-root` (`[role=group][aria-label="Weight entry"]`, 9880-9881, 5066) |
| 9-11 | `1`,`0`,`0` | `#lk-sheet-root button:has-text("1")` etc. (keys 9873, buttons 9959-9977); max 6 chars | local `val` | NumPad |
| 12 | "DONE" | `#lk-sheet-root button:has-text("DONE")` (9997-10011) | `setVal(ri,si,"w","100")` → stores kg via `dispToKg` (10715-10716), `rec=false`; effect persists `lk_activeWorkoutRows` (10679-10688) | NumPad closes |
| 13 | set 1 reps cell | `button[aria-label="Set 1 reps"]` (13401) | `setNumpadTarget({field:"r"})` | NumPad `[aria-label="Reps entry"]` |
| 14 | `8` | as above | | |
| 15 | "DONE" | as above | `setVal(...,"r","8")` | WorkoutLog |
| 16 | done toggle | `button[aria-label="Mark set 1 done"]` (13454) | `toggleDone` (10734-10808): `done=true`, vibrate, PR check → `lk_prs[exId]` gets `{r:8,w:100,date}` (10770-10792), "ALL-TIME PR" banner 3.5 s (10798-10800, 11597), rest timer starts if `restEnabled` (10807) | WorkoutLog, row at opacity .65, button aria-label becomes "Undo set 1 done" |

Tap count: **16** (1B seeded: 14; +1 if tutorial not pre-seeded). RIR left at default "2" (10078).

Success assertion:
- `JSON.parse(localStorage.lk_activeWorkoutRows)[0].sets[0]` has `w === "100"`, `r === "8"`, `done === true` (10685-10687).
- `JSON.parse(localStorage.lk_activeWorkout)` equals `{name:"Quick Workout",exIds:[]}` (57402, 57254).
- DOM: `button[aria-label="Undo set 1 done"]` visible; `button[aria-label="Set 1 weight"]` text `100`.
- `JSON.parse(localStorage.lk_prs)` has key for the exercise id with `[{r:8,w:100,...}]`.

Failure modes:
- Auth overlay only renders once `window.supabase` loaded and `getSession()` resolves null (266-269, 298-330). If supabase-js is blocked, `init()` returns early and no overlay appears; guest flag never set but app still runs if `lk_profile` exists.
- Guest modal backdrop click dismisses (915). "CREATE ACCOUNT" switches to signup.
- Empty `lk_profile` → `Onboarding` (57539). Guest seed writes `Athlete/athlete`, so 1A ends with displayName "Athlete", not fixture name.
- NumPad rejects second `.`, caps at 6 chars, `0`→digit replacement (9852-9862). Increment buttons `-5 -2.5 +2.5 +5` clamp 0..9999 (9863-9872).
- `toggleDone` PR write only when `w` and `r` both set (10760). Un-ticking does not start rest (10806-10807).
- Rest countdown (default 90 s) shows a banner and, on other tabs, in the in-progress bar (57632-57660). Not modal.
- Idle prompt `[role=dialog][aria-label="Still training?"]` after 30 min without activity (10484, 10514); irrelevant to fast tests.
- `lk_activeWorkoutRows` is only written once any set has `done||w||r` (10680-10684).

Prerequisite state: Global preconditions. For 1A start with an empty localStorage. `lk_history` may be empty.

---

## Flow 2 — Log one set: weight, reps, RIR

Page sequence: `WorkoutLog` 10013 (already on `screen === "workout"`) → `NumPad` 9847 ×2 → native `<select>` for RIR.

Entry: seed `lk_activeWorkout = {"name":"Push A","exIds":[<benchId>]}` and boot. Boot shows "Resume Workout?" (57262-57266); tap "Resume" (`button:has-text("Resume")`, 57847-57866) → `setScreen("workout")`. Or arrive via Flow 6/1.

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 0/1 | "Resume" (only if entering via seeded `lk_activeWorkout`) | `button:has-text("Resume")` not `:has-text("Resume Workout?")` (57863) | `setShowResumeDialog(false); setScreen("workout")` | WorkoutLog |
| 1 | weight cell | `button[aria-label="Set 1 weight"]` (13378) | `setNumpadTarget` field `w` | NumPad "Weight entry" |
| 2-4 | `1`,`0`,`0` | `#lk-sheet-root button:has-text("N")` | | |
| 5 | "DONE" | `#lk-sheet-root button:has-text("DONE")` | `setVal(...,"w")` (10715) | WorkoutLog |
| 6 | reps cell | `button[aria-label="Set 1 reps"]` (13401) | field `r` | NumPad "Reps entry" |
| 7 | `8` | | | |
| 8 | "DONE" | | `setVal(...,"r")` | WorkoutLog |
| 0 | RIR select | `select[aria-label="Set 1 reps in reserve"]` options `0,1,2,3,4,5+` (13427-13445); Playwright `selectOption("1")` = 0 taps (note: on device this is a native picker, ~2 taps) | `setVal(...,"rir","1")` (13431) | WorkoutLog |
| 9 | done toggle | `button[aria-label="Mark set 1 done"]` (13454) | `toggleDone` (10734) | Row marked; rest starts if enabled |

Tap count: **9** (10 with Resume). Alternative ±buttons: `-5 -2.5 +2.5 +5` (9932-9950) count 1 each.

Success assertion:
- `JSON.parse(localStorage.lk_activeWorkoutRows)[0].sets[0]` deep-equals `{w:"100", r:"8", rir:"1", done:true, rec:false, setType:"normal", partials:"", rL:"", rR:""}` (10715-10731, 10745-10752).
- Header set count `span` reads `1 set` (11945, `totalSets`).
- `button[aria-label="Undo set 1 done"]` present.

Failure modes:
- Weight is converted display→kg on write (`dispToKg`, 10716) and back on read (13379 `kgToDisp`). With `useKg:true` stored string equals typed string.
- Blank NumPad + DONE writes `""` → cell shows `--`; done still allowed but no PR (10760).
- Superset rows use a different grid with `L`/`R` columns (13018-13230); aria-labels identical, so scope to the exercise card (`[data-exrow]`, 12127).
- Unilateral rows have `rL`/`rR` instead of `r` (13018).
- `hidePartials` false shows a partial-reps row under each set (13470-13516) — extra buttons `[aria-label="Add a partial rep"]`.
- Quota failure: `sd` swallows and toasts "Storage is full" (2435-2450); UI still updates.

Prerequisite state: Global preconditions + `lk_activeWorkout` with at least one `exIds` entry (ids are numeric strings/numbers in `ALL_EX`; see storage-keys.md for a valid id). `lk_history` optional — when the exercise exists in history, `mkRow` pre-fills set rows from the last session (`rec:true`, 10058-10071) so the cell shows a recommendation not `--`.

---

## Flow 3 — Finish workout, Review, save

Page sequence: `WorkoutLog` 10013 → `Review` 15965 (`screen === "review"`, Nav hidden 57585) → `HomeScreen` 26220 + "Saved" toast 57996-58013.

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 1 | "Finish" | header `button:has-text("Finish")` (12105-12120), always visible, no confirm | `finishWorkout(rows, sec)`: `sd("activeWorkoutRows")`, `sd("activeWorkoutSec")`, `setScreen("review")` (57417-57424) | Review step `summary` (16137) |
| 2 | "Save without reflection" | `button:has-text("Save without reflection")` (16336-16347) | `save()` (16012-16064) → `p.onSave(rec)` → `saveWorkout` (57425-57462): prepends to `lk_history`, `lk_activeWorkout*` cleared, `setScreen("home")`, toast 2.5 s | Home with `✓ Saved` toast |

Tap count: **2**. Reflection path: "HOW DID IT FEEL?" (16318-16335) → 5 rating rows (1 tap each, 16348-16430) → "Skip and save" (16445-16455) = 7; "GET AI COACH INSIGHT" (16425-16443) adds an `aiCall` (2664) then "SAVE WORKOUT" (16571-16584).

Success assertion:
- `JSON.parse(localStorage.lk_history).length` increases by 1; `[0]` has `name`, `sets` (count of done non-warmup sets, 15985-15990), `vol` string `"800 kg"`, `dur` `"N min"`, `dateISO`, `exercises[0].sets[0]` `{w:"100",r:"8",rir:"…",done:true}` (16015-16041, 16050-16062).
- `localStorage.lk_activeWorkout === "null"`, `lk_activeWorkoutRows === "null"` (57454-57458).
- DOM: `text=Saved` toast visible (58013); `nav [aria-label^="Home"][aria-current="page"]`.

Failure modes:
- Zero done sets: Finish still works; Review saves an entry with `sets:0`, `exercises:[]` (16015-16018 filter). No guard.
- `savingRef` blocks double taps (16013-16014).
- Discard in Review is two-step: first tap arms, label becomes "Tap again to throw this workout away" (16011, 16586-16606). Discard in WorkoutLog header is two-step via `lkConfirm` toast "Tap Discard again..." with 7 s window (5179-5190, 12089-12104).
- AI insight failure falls back to canned text (16126-16130); gated response toasts "Daily limit reached" (2685-2690). Offline → toast "Connection error." (2696-2699).
- `saveWorkout` calls `syncBidirectional().catch` (57461) — no-op noise in guest mode.
- Back/popstate during Review pops nav stack (57493-57505); Review is pushed as a new entry only via `go`; `finishWorkout` uses `setScreen` directly so browser back from Review returns to the previous stack top with `workout` still set → resume banner.

Prerequisite state: Global preconditions + active workout with ≥1 done set (run Flow 2 first, or seed `lk_activeWorkout` + `lk_activeWorkoutRows` — note `startWorkout` routes straight to Review when `lk_activeWorkoutRows` exists, 57402-57410, but the boot path goes through the Resume dialog then `setScreen("workout")`).

---

## Flow 4 — Home to one lift's progress chart

Page sequence: `HomeScreen` 26220 → `ProgressPage` 28323 (screen `progress`) → `PRHub` 29165 (rendered by ProgressPage when `tab==="prs"`, 28438-28452, `defaultTab:"prs"`) → PRHub detail (`sel !== null`, 29403) with est-1RM polyline chart (29531-29570).

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 1 | " VIEW PROGRESS" | `button:has-text("VIEW PROGRESS")` Home `progress` block (26673-26700); 8th default block, scroll | `go("progress")` (26675) | ProgressPage, Overview (Back `[aria-label="Back"]` 28592 → home) |
| 2 | "PR Vault" | `[aria-label="Progress section"] button:has-text("PR Vault")` (28612-28624) | `setTab("prs")` → `lk_ui_progressTab="prs"`; ProgressPage returns `PRHub` | PRHub, tab `prs` (list) |
| 3 | lift row | `[role=button]:has-text("Bench Press")` (30044-30058); rows only for exercises with entries in `lk_prs` (`withPRs`, 29183-29185), sorted compounds first | `setSel(ex.id)` | PRHub detail: `svg polyline` chart (29559-29575), range tabs (29590), "STRENGTH PROFILE — EST. 1RM" (29627) |

Tap count: **3**. Alternative without Home button: Nav "Home" already active; there is no Progress nav tab — Progress hangs off Home only (26674-26675, Nav maps `progress` to Home 57757-57760).

Success assertion:
- DOM: within PRHub detail, `svg polyline` exists and header shows `N sessions` (29557) and current e1RM `<n> kg` (29559). Back `[aria-label="Back"]` (29425) returns to list.
- `localStorage.lk_ui_progressTab === "\"prs\""`.

Failure modes:
- Chart needs `data.length >= 2` else `text=Not enough data in this range.` (29544-29548). Data = union of `lk_history` sessions with `dateISO` + `exercises[].sets` for that exercise and `lk_prs[exId]` entries with a date (4569-4596). Range default `all` (29176).
- Empty `lk_prs` → `text=No PRs yet` (30038) and no rows.
- ProgressPage Overview "featured lifts" (28660-28840, `lk_featuredLifts`, " ADD LIFT" 28844) is Day-1-vs-PR cards, not a chart. The only per-lift line chart is in PRHub detail. Overview `svg` at 28876 is body-weight.
- `lk_ui_progressTab` persistence means a second run lands directly on PRHub (skip step 2). Clear it or accept 2 taps.
- Random ThrowbackCard on Progress Overview (28325-28330, 25%) — seed `lk_throwbackDismissed`.
- PRHub `logging` sheet ("LOG A PR WITHOUT A WORKOUT", 30023) is a separate view.

Prerequisite state: Global preconditions + `lk_prs` with ≥1 exercise (`{"<exId>":[{"r":5,"w":100,"date":"2026-08-01"}]}`) + `lk_history` with ≥2 sessions containing that exercise (`exercises:[{id,name,sets:[{w,r}]}]`, `dateISO`) so the polyline has ≥2 points.

---

## Flow 5 — Send one coach message, receive reply

Page sequence: any → `CoachScreen` 49915 (screen `coach`, tab `chat` default 49943) → same screen with reply.

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 1 | Nav "Coach" | `nav button[aria-label^="Coach"]` (7695-7724) | `go("coach")` | CoachScreen chat pane (51237); empty state = data-driven opener + suggestion chips (51255-51330) |
| 0 | type message | `textarea/input[aria-label="Ask your coach"]` placeholder "Ask your coach..." (52115-52116) | `setInput` | Send enabled (`disabled: !input.trim()`, 52154) |
| 2 | Send | `button[aria-label="Send message to coach"]` (52153-52155); Enter without Shift also sends (52101-52103) | `send()` (50331-50341): user bubble appended immediately, `fireRequest` POST `https://lockedapi.cescocugliari.workers.dev/` body `{system,max_tokens:1000,messages}` (50055-50072); while `loading`, button swaps to `[aria-label="Stop the reply"]` (52133-52135) and a typing indicator renders (52031) | Reply bubble appended (`handleReply` 50144-50329, `setMsgs` 50312-50316), `lk_coachLastMsgs` written (49925-49927) |

Tap count: **2**.

Success assertion:
- DOM: message list contains a left-aligned (`justifyContent:flex-start`, 51340) bubble whose text equals the fixture reply `content[0].text` (50146). User bubble right-aligned (`isUser`, 51335).
- `JSON.parse(localStorage.lk_coachLastMsgs)` last two entries: `{role:"user",text:"…"}` then `{role:"assistant",text:"…"}` (49917-49927, slice(-40)).
- `button[aria-label="Send message to coach"]` re-enabled (input cleared, 50334).

Failure modes (all render as an assistant-side error bubble with a retry button, 50097-50110, 51358-51386):
- HTTP 429 → "You've used your 10 free chats today. Resets at midnight." (50075, 50087). Guest `isPro:true` is client-side only (333); the worker decides. Fixture must return 200 with `{content:[{type:"text",text:"…"}]}`.
- `!r.ok` → `kind:"server"`. `navigator.onLine===false` → "No connection. Your message is saved." (50085-50088).
- Empty text (`!txt`) → "Try again." (50147).
- Reply containing `###PROGRAM_START###…###PROGRAM_END###` is parsed as a split and shows a save-split card (50152-50160, 50342+); avoid in fixtures unless testing that.
- No guest gating in CoachScreen (no `isGuest` reference 49915-52547). Coach name prompt is inline (50857-50858), not blocking.
- `?open=checkin` or `window.__lockedCoachPane` lands on the Check-In pane (49946-49952, 57474-57481).

Prerequisite state: Global preconditions. `lk_coachLastMsgs` absent or `[]` for a clean empty state. Optional `lk_coachPlan` for the Plan pane. Route `**/lockedapi.cescocugliari.workers.dev/` POST → fixture.

---

## Flow 6 — Edit a split, start it

Page sequence: any → `TrainHub` 15013 (My Splits) → `SplitBuilder` 8782 (view `edit`, 15036-15062) → `TrainHub` → day-picker sheet (15139-15230) → `WorkoutLog` 10013.

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 1 | Nav "Train" | `nav button[aria-label^="Train"]` | `go("train")` | TrainHub, My Splits (15374-15395 tabs "My Splits", "History", "Library") |
| 2 | " Edit" | split card footer `button:has-text("Edit")` (15824-15846); footer row = `Start | Edit | Delete` (15801-15872) | `setEditSplit(split); setView("edit")` → `lk_ui_trainView="edit"` | SplitBuilder (Back `[aria-label="Back"]` 9247) |
| 0 | rename | `input[placeholder="Split name (e.g. Push Pull Legs)"]` (9267) fill `"PPL v2"` | `setName` | |
| 0 | new day name (optional) | `input[placeholder="e.g. Push, Pull, Legs..."]` (9795); Enter triggers `addDay` (9793) | | |
| (3) | "Add" (optional) | `button:has-text("Add")` next to that input (9807-9818) | `addDay` — toasts "Name the day first…" if blank (9129) | new day card |
| 3 | "SAVE SPLIT" | `button:has-text("SAVE SPLIT")` (9819-9833); `disabled` until `name.trim() && days.length>0` (9820) | `save()` (9187-9214) → `onSave` → `setSplits(map by id)` → `lk_splits`, `setView("main")` (15044-15053) | TrainHub |
| 4 | " Start" | same split card footer `button:has-text("Start")` (15801-15823) | `setDayModal(split)` | Sheet "Choose a day to start" (15188), Close `[aria-label="Close"]` 15189 |
| 5 | day row | `[role=button]:has-text("<day name>")` inside sheet (15208-15230) | `onStart({name:"<split> - <day>", exIds, blocks})` → `startWorkout` → `lk_activeWorkout`, `screen="workout"` | WorkoutLog with pre-filled exercise rows |

Tap count: **5** (rename only) / **6** with an added day. One-tap alternative: when a split is expanded (`lk_splitsExpanded[id]=true`, 15014-15024, chevron `[aria-label="Expand split"]` 15663), each day header has `button[aria-label="Start <day>"]` (15741-15748) — skips the sheet.

Success assertion:
- `JSON.parse(localStorage.lk_splits).find(s=>s.id===<id>).name === "PPL v2"`; `days[i]` shape `{name, exIds:[…], blocks:[…]}` (9189-9207).
- `JSON.parse(localStorage.lk_activeWorkout).name === "PPL v2 - <day>"` and `exIds` equals the day's ids (15215-15219).
- DOM: WorkoutLog header `text=PPL v2 - <day>` (11928); `button[aria-label="Set 1 weight"]` count ≥ exIds.length × 3.

Failure modes:
- Split with zero days: "SAVE SPLIT" disabled (9820); Start button on the card still opens an empty sheet.
- Day with `exIds.length === 0` gets no header Start button (15739) but is still listed in the sheet.
- Delete in footer (15847-15853) has **no confirmation** — a mis-tap on the third footer button removes the split.
- Back in SplitBuilder discards unsaved edits silently (9247-9250, `onBack` 15039-15042).
- `lk_ui_trainView` persists `"edit"`/`"create"` across reload with `editSplit` reset to null → reload mid-edit reopens a blank Create builder (15028, 15036).
- Adding exercises to a day: `button:has-text("Exercise")` dashed (9707-9735) → `ExLib` picker (`view === "pick"`, 9216) → `pickEx` returns to build (9172-9185); same ExBtn → "ADD TO WORKOUT" pattern (7463).
- Empty `lk_splits`: My Splits shows empty state with "+ New Split"/AI builder buttons (15468-15600); Edit unreachable.
- If `lk_history` non-empty a "RECENT" horizontal strip (15396-15467) precedes the split list — its buttons also call `onStart`; scope selectors to the split card.

Prerequisite state: Global preconditions + `lk_splits` `[{"id":"s1","name":"PPL","days":[{"name":"Push","exIds":[<ids>],"blocks":[]}],"created":"…"}]`. `lk_ui_trainView` absent.

---

## Flow 7 — Add a shopping item, open Budget

Page sequence: any → `FuelTab` 36895 (screen `fuel`, view `main`) → `ShoppingBudgetTab` 45968 (FuelTab `view === "shop"`, 37075-37080) → `ShoppingTab` 42420 → `BudgetTab` 43974.

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 1 | Nav "Fuel" | `nav button[aria-label^="Fuel"]` | `go("fuel")` | FuelTab main (tab `list`) |
| 2 | shop icon button | `button[aria-label="Shopping and budget"]` (37115-37119) | `setView("shop")` → `lk_ui_fuelView="shop"` | ShoppingBudgetTab, header "SHOP & BUDGET" (46030), back `button:has-text("Fuel")` (46002-46012), tabs `[aria-label="Shopping section"]` List / Pantry / My Stores / Budget (45970, 46095-46127) |
| 0 | type item | `input[placeholder="e.g. Chicken Breast"]` (42992); Enter also adds (42997-42998) | `setSearch`; store suggestions fetch only if a store is enabled (42449-42458) | |
| 3 | "ADD TO LIST" | `button:has-text("ADD TO LIST")` (43155-43167); inert styling until `search.trim()` | `addItem` (42517-42536) → `addShoppingItem` pushes `{id:"sh_…",itemName,quantity,unit,category,dateAdded,checked:false}` to `lk_shoppingList` (41951-41966); inputs reset | Item appears under its category (43168+), checkbox `[aria-label="Mark as picked up"]` (43199) |
| 4 | "Budget" | `[aria-label="Shopping section"] button:has-text("Budget")` (46105-46110) | `setTab("budget")` → `lk_ui_shopTab="budget"` | BudgetTab: "WEEKLY BUDGET" (44404), "Edit" (44417), "SCAN RECEIPT" (44592) |

Tap count: **4**.

Success assertion:
- `JSON.parse(localStorage.lk_shoppingList)` length +1, last item `itemName === "Chicken Breast"` (normalised by `normaliseName`, 42519), `checked === false`.
- DOM: `text=Chicken Breast` row present after step 3; after step 4 `text=WEEKLY BUDGET` visible and `localStorage.lk_ui_shopTab === "\"budget\""`.

Failure modes:
- Duplicate name → merge dialog (`text=Add … more? Total would be`, 43322) with "Add Separate" (43357) — seed a list without the test item.
- Blank input: `addItem` returns (42518); button has no `disabled` attr, only styling.
- Unit `qty` is replaced by `smartUnit(name)` (41955); do not assert `unit === "qty"`.
- Store suggestions call `/store-search` only when `lk_myStores` has an enabled store (42452-42458); otherwise offline-safe.
- `lk_ui_fuelView="shop"` and `lk_ui_shopTab="budget"` persist — a second run opens directly in Shop/Budget (skip steps 2 and 4).
- Budget with `lk_budgetData` absent uses `{weeklyTarget:0,history:[],pendingItems:[]}` (43964-43970); shows editable target, no blocking setup.
- `screen === "shopping"` route exists (57702-57710) but nothing navigates to it; Shop is only reachable inside Fuel.
- Nav "Fuel" tap while on Fuel fires `lockedTabReset` → `setView("main")` (36907, 57514-57517), which leaves Shop.

Prerequisite state: Global preconditions. `lk_shoppingList` `[]` or seeded without the test item. `lk_fuelProfile` optional (FuelTab does not force setup: `view` only becomes `"profile"` on tap 37143). `lk_ui_fuelView`, `lk_ui_shopTab` absent.

---

## Flow 8 — Change units in Settings, return Home

Page sequence: any → `ProfileScreen` 30153 → `SettingsScreen` 32031 (screen `settings`, Nav highlights Profile 57757) → `ProfileScreen` → `HomeScreen`.

| # | Tap | Selector hint | State change | Screen after |
|---|---|---|---|---|
| 1 | Nav "Profile" | `nav button[aria-label^="Profile"]` | `go("profile")` | ProfileScreen ("Guest account" card 30251-30273 for guests) |
| 2 | "Settings" | `button:has-text("Settings")` (30338-30351) | `go("settings")` (30340) | SettingsScreen `settingsView="main"` (32033) |
| 3 | "KG - Switch to LBS" | PREFERENCES row "Weight Unit" (32807-32836) `button:has-text("Switch to LBS")` | `toggleUnit` (57349-57361): `useKg=false`, `lk_profile.useKg=false` | Same screen; button now "LBS - Switch to KG", body-weight placeholder flips to "e.g. 176" (32661) |
| 4 | Nav "Home" | `nav button[aria-label^="Home"]` | `go("home")` (TOP-tab swap, 57523-57526) | Home |

Tap count: **4**. Alternative back: `button[aria-label="Back to profile"]` (32131-32135) → Profile, then Nav Home = 5.

Success assertion:
- `JSON.parse(localStorage.lk_profile).useKg === false` (57354-57358).
- DOM after step 3: `button:has-text("LBS - Switch to KG")`. After step 4: `nav [aria-label^="Home"][aria-current="page"]`; Home stats render lb values (HomeScreen receives `useKg` 57603).

Failure modes:
- `toggleUnit` also exists in WorkoutLog tools menu ("Switch to LBS/KG", 12056-12085) and ProfileScreen prop (57663); all write the same key.
- Remote profile sync only runs when `lk_profile` lacks displayName/username (57222-57223) — never in seeded guest runs, so the unit cannot be overwritten by cloud.
- Settings "Show tutorial" button (33629) re-opens `TutorialOverlay`; avoid.
- Settings has sub-view `layout` (`LayoutEditor`, 32110-32112) via "CUSTOMIZE" (32191-32205); "Weight Unit" is on `main`, below ACCOUNT (32213), a long scroll (29 buttons). Playwright auto-scroll handles it.
- Guest Settings shows a "SIGN UP" upgrade card (32213-32249) — `upgradeFromGuest` opens the auth overlay (1152); do not tap.
- Weight display conversion uses `2.20462` inline in Settings (32089, 32769) and `LB_PER_KG` elsewhere.

Prerequisite state: Global preconditions with `lk_profile.useKg === true`.

---

## Summary

| Flow | Taps | Reachable in guest | Notes |
|---|---|---|---|
| 1 Guest start → first set | 16 (14 seeded) | yes | Cold start hits TutorialOverlay; Quick Start requires 3-step exercise picker |
| 2 Log one set | 9 (+1 Resume) | yes | RIR is a native `<select>` (0 Playwright taps, 2+ on device) |
| 3 Finish → Review → save | 2 | yes | Saves even with zero done sets |
| 4 Home → lift chart | 3 | yes | Only real per-lift chart is inside PR Vault detail; needs ≥2 data points |
| 5 Coach message → reply | 2 | yes | Reply depends on worker 200 + `content[0].text`; 429 = limit bubble |
| 6 Edit split → start | 5 | yes | Delete has no confirm; Back discards silently |
| 7 Shopping add → Budget | 4 | yes | Shop only via Fuel header icon; `screen:"shopping"` route orphaned |
| 8 Units → Home | 4 | yes | No confirmation, immediate |

Nothing is unreachable in guest mode; guest gets `isPro:true` client-side (333), but Coach/Review AI limits are enforced server-side (429 → limit message, 50075).
