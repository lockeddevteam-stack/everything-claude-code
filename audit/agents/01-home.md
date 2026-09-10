# Agent 1 — Home / Dashboard / Goals audit

File audited: `redesign/input/locked-current-v6.html`
Exclusive range: **26141–28322**. Components: `QuickActionsRow` (26141), `HomeScreen` (26220), `GoalsTab` (26992), plus module-level `GOAL_TYPES` (26957), `getBfLog` (26976), `addBfEntry` (26979).
References resolved outside range (read-only greps): `ld`/`sd` (2417/2435), `aiCall` (2663), `logBetaActivity` (2772), `getWeightLog` (2908), `readableAccent` (4318), `liftDisp` (4439), `convToKg` (4464), `throwbackForced`/`computeThrowback`/`dismissThrowback` (4603/4606/4662), `getEx` (4747), `lkConfirm` (5179), `liftVolume`/`liftSets`/`cardioMinutes` (6881/6887/6891), `sessionSummaryLine` (6908), `sessionMetaLine` (6927), `isFemaleUser` (21946), `HOME_BLOCK_DEFS`/`HOME_DEFAULT_ORDER`/`getHomeLayout` (25995–26078), `QUICK_ACTION_DEFS` (26082), `quickLogWater` (26124), `autoAddDueStaples` (43506).

---

## PART A — Features

### F-HOME-001 Quick Actions row (3 configurable shortcuts)
- Location: Home tab > HomeScreen > `quick` layout block > 3-column button grid
- User action: taps one of up to three emoji shortcut tiles
- Behavior:
  1. `layout.quick` (default `["water","checkin","food"]`) is read from the saved home layout (`redesign/input/locked-current-v6.html:26076`).
  2. Ids are filtered against `QUICK_ACTION_DEFS` and sliced to max 3 (`:26143-26145`).
  3. If none remain the whole row renders `null` (`:26146`).
  4. `run(id)`: for `"water"` it calls `quickLogWater(250)` and shows an inline flash "💧 N ml today" for 1800 ms (`:26149-26156`).
  5. For `"checkin"` it sets the global `window.__lockedCoachPane = "check-in"` before navigating (`:26158`).
  6. Otherwise (and for checkin) `p.go(def.go)` navigates to the tab named in the def (`:26159`).
- Components: QuickActionsRow (`:26141-26219`)
- Functions: run (`:26147-26160`), quickLogWater (`:26124-26140`), getHomeLayout (`:26065-26078`)
- State: local `flash` (`:26142`); global `window.__lockedCoachPane` (`:26158`); prop `p.go`, `p.quick`
- Storage: reads `lk_homeLayout` (via getHomeLayout `:26066`); water action reads+writes `lk_fuelLog` (`:26125,:26137`)
- Network: none
- AI: none
- Edge cases: empty picks → renders nothing (`:26146`); unknown ids silently dropped (`:26143-26145`); a def with no `go` and not "water" (none currently) would be a no-op (`:26159`)
- Gating: always on
- Status: WORKING
- Evidence for status: `:26147-26160` all three branches are implemented and reachable.
- Notes: hardcoded 250 ml increment (`:26150`) and hardcoded 1800 ms flash (`:26155`). Only "water" logs anything; every other action is pure navigation. The `pr` def navigates to "progress" and `supps`/`weight`/`food` all navigate to "fuel" (`:26082-26123`) — the label promises a log action the row does not perform.

### F-HOME-002 Home header greeting, name and streak pill
- Location: Home tab > HomeScreen > header
- User action: passive (view)
- Behavior:
  1. Time-of-day greeting chosen by `today.getHours()`: <5 "Up late,", <12 "Good morning,", <17 "Good afternoon,", else "Good evening," (`:26469-26472`).
  2. `profile.displayName || "Athlete"` rendered as the H1 (`:26482`).
  3. Streak is computed by walking back day-by-day through a set of workout ISO dates until a gap (`:26240-26249`).
  4. If `streak > 0` **and** `ld("gamingLayer", false)` is true, a flame pill with the streak count renders next to the name (`:26483-26506`).
  5. Avatar circle shows the first letter of the display name, uppercased, falling back to "A" (`:26507-26523`).
- Components: HomeScreen (`:26220-26955`)
- Functions: inline greeting IIFE (`:26469-26472`), streak loop (`:26240-26249`), `isoDay` (`:1961`), `dayOf`
- State: props `p.profile`, `p.history`; localStorage flag `gamingLayer`
- Storage: reads `lk_gamingLayer` (`:26483`)
- Network / AI: none
- Edge cases: empty history → streak 0 → no pill; missing displayName → "Athlete"/"A"
- Gating: streak pill gated behind the `gamingLayer` setting (`:26483`)
- Status: WORKING
- Evidence for status: `:26240-26249` streak math and `:26483` gate are both concrete.
- Notes: streak is recomputed on every render (O(days) loop, unmemoized). `today` is captured at render time (`:26224`) so the greeting does not update while the app sits open past a boundary hour.

### F-HOME-003 Configurable home block layout (order + hide)
- Location: Home tab > HomeScreen > body
- User action: passive here; the reorder/hide UI lives outside this range (`homeLayout` written by `saveHomeLayout` `:26079-26081`)
- Behavior:
  1. `getHomeLayout()` returns `{order, hidden, quick}`, filtering unknown ids and appending any missing default ids so new blocks appear for existing users (`:26065-26078`).
  2. A `BLOCKS` map defines a render function per block id: `stats`, `insight`, `throwback`, `cycletrack`, `quick`, `feed`, `start`, `supps`, `restock`, `cycle`, `progress`, `recap`, `calendar`, `recent` (`:26527-26903`).
  3. `layout.order.map` renders each block wrapped in a `React.Fragment` keyed by id, skipping ids in `layout.hidden` and ids with no renderer (`:26904-26913`).
- Components: HomeScreen (`:26220-26955`)
- Functions: getHomeLayout (`:26065-26078`), BLOCKS.* (`:26528-26903`)
- State: none persisted locally; layout read fresh on each render (`:26526`)
- Storage: reads `lk_homeLayout` (`:26066`)
- Network / AI: none
- Edge cases: absent key → defaults; ids present in layout but missing from `BLOCKS` render `null` (`:26908`)
- Gating: always on
- Status: WORKING
- Evidence for status: `:26904-26913` order/hidden are both honoured.
- Notes: `HOME_BLOCK_DEFS` (`:25995-26061`) lists ids including `cycletrack`; every def id has a matching `BLOCKS` entry. Layout is read during render rather than in state, so a layout change elsewhere only shows after some other re-render of HomeScreen.

### F-HOME-004 Stats grid (4 tiles)
- Location: Home tab > `stats` block
- User action: passive
- Behavior: 2×2 grid of Total Workouts (`history.length`), My Splits (`p.splits.length`), This Week (`uDays`), PRs Logged (`Object.keys(prs).length`); zero values render muted (`:26528-26592`).
- Components: HomeScreen BLOCKS.stats (`:26528-26592`)
- Functions: none beyond inline map
- State: props `history`, `splits`, `prs`
- Storage / Network / AI: none
- Edge cases: all zero → muted color (`:26586`)
- Gating: always on (hideable via layout)
- Status: WORKING
- Evidence for status: `:26548-26567` value expressions are direct.
- Notes: staggered `fadeUp` animation delay `i*0.06` (`:26576`). "PRs Logged" counts *exercises with PRs*, not PR entries.

### F-HOME-005 Weekly aggregates (training days, volume, sets, cardio, consistency label)
- Location: Home tab (feeds F-HOME-004 "This Week" and F-HOME-011 recap)
- User action: passive
- Behavior:
  1. Week window starts at the most recent Sunday (`today.getDate() - today.getDay()`), 7 ISO keys built (`:26250-26257`).
  2. `weekW` = history entries whose `dateISO` is in that window (`:26258-26260`).
  3. `uDays` = count of distinct dates; `weekVol` via `liftVolume`; `weekSets` via `liftSets`; `weekCardioMin` via `cardioMinutes` (`:26261-26268`).
  4. `consistency` label: ≥5 "Incredible week", ≥3 "Solid week", 0 "Rest week", else "Building momentum" (`:26270`).
- Functions: liftVolume (`:6881`), liftSets (`:6887`), cardioMinutes (`:6891`)
- Storage / Network / AI: none
- Edge cases: empty history → `haswkdata` false, "Rest week"
- Gating: always on
- Status: PARTIAL
- Evidence for status: `weekCardioMin` is computed at `:26268` but never referenced anywhere in 26141–28322 — dead computation.
- Notes: week is hardcoded Sunday-start with no locale option (`:26251`). Cardio minutes never surface on Home.

### F-HOME-006 Proactive insight card
- Location: Home tab > `insight` block
- User action: passive (card's own interactions live outside this range)
- Behavior: renders `ProactiveTipCard` with `profile` and `history` props (`:26593-26598`).
- Components: HomeScreen BLOCKS.insight (`:26593-26598`); ProactiveTipCard (defined outside this range)
- Status: UNVERIFIED — only the mount site is in range.
- Evidence for status: `:26594-26597` mount only; behavior lives in `ProactiveTipCard`.
- Gating: hideable via layout

### F-HOME-007 Throwback card
- Location: Home tab > `throwback` block
- User action: taps dismiss on the card
- Behavior:
  1. `computeThrowback()` (`:4606`) is called each render; if it returns falsy the block renders `null` (`:26600-26601`).
  2. Otherwise `ThrowbackCard` renders with `data`, `useKg`, and `onDismiss` (`:26602-26608`).
  3. Dismiss calls `dismissThrowback()` (writes `lk_throwbackDismissed` with an ISO timestamp, `:4662`) then bumps local `tbTick` to force a re-render (`:26606`).
- State: local `tbTick` (`:26223`)
- Storage: writes `lk_throwbackDismissed` (`:4662`)
- Status: WORKING
- Evidence for status: `:26600-26608` full render + dismiss path present.
- Notes: `tbTick` is only ever incremented, never read — it exists purely as a re-render trigger (`:26223`, `:26606`). Home calls `computeThrowback()` unconditionally, whereas `ProgressPage` gates it behind a 1-in-4 roll (`:28317-28322`) — two different throwback policies in the same app.

### F-HOME-008 Cycle tracking card (female users)
- Location: Home tab > `cycletrack` block
- Behavior: renders `CycleTrackerCard` with `go` only when `isFemaleUser(p.profile)` (`:26609-26613`); otherwise `null`.
- Functions: isFemaleUser (`:21946`)
- Gating: profile sex-gated
- Status: WORKING (mount), card internals UNVERIFIED (outside range)
- Evidence for status: `:26610-26612` conditional mount is explicit.

### F-HOME-009 Dynamic feed / supplement reminder / running-low / cycle reminder blocks
- Location: Home tab > `feed`, `supps`, `restock`, `cycle` blocks
- Behavior: thin mounts — `DynamicFeed({history, splits, go})` (`:26620-26626`), `SuppReminderCard` (`:26662-26664`), `RunningLowCard` (`:26665-26667`), `CycleReminderCard` (`:26668-26670`). All four components are defined outside this range.
- Status: UNVERIFIED — mount sites only.
- Evidence for status: `:26620-26670` are single-line component mounts with no local logic.
- Gating: each hideable via layout

### F-HOME-010 Start Workout / View Progress navigation buttons
- Location: Home tab > `start` and `progress` blocks
- User action: taps the button
- Behavior: `start` is a full-width gradient CTA calling `p.go("train")` (`:26627-26661`); `progress` is an outlined button calling `p.go("progress")` (`:26671-26707`).
- Status: WORKING
- Evidence for status: `:26633` and `:26677` are direct `go()` calls.
- Notes: `start` uses `var(--color-accent-deep)` plus a hardcoded `#9A3412` in the same gradient (`:26640`) — half themed, half literal. Same pattern repeats on the Goals save button (`:28090`).

### F-HOME-011 Weekly Recap screen
- Location: Home tab > `recap` block button → full-screen recap view
- User action: taps "Weekly Recap"; taps "Back" to return
- Behavior:
  1. Button renders only when it is Sunday (`isSun`) **or** there is week data (`haswkdata`) (`:26709`).
  2. Tap sets `showRecap` true (`:26716`), which short-circuits HomeScreen's render into the recap view (`:26314-26468`).
  3. Missed days = weekday names before today with no logged session (`:26316-26323`).
  4. Header shows `consistency.toUpperCase()` plus a copy variant per `uDays` bucket (0 / ≥5 / ≥3 / else) (`:26375-26377`).
  5. Four stat tiles: Workouts, Training Days (`uDays + " / 7"`), Total Sets, Total Volume in `storedToUnit(weekVol, useKg)/1000` rounded to "k" (`:26379-26399`).
  6. Streak card renders only if `streak > 0 && ld("gamingLayer", false)` (`:26430`).
  7. Missed-days card renders when there is at least one missed day (`:26449`).
  8. Back button sets `showRecap` false (`:26331-26333`).
- State: local `showRecap` (`:26221`)
- Storage: reads `lk_gamingLayer` (`:26430`)
- Network / AI: none
- Edge cases: `uDays === 0` → "You took the week off. Rest is part of the program." (`:26375`); no missed days → card hidden
- Gating: button visibility conditional; streak card gated by `gamingLayer`
- Status: WORKING
- Evidence for status: `:26314-26468` complete self-contained view with back navigation.
- Notes: total volume is rounded to whole "k" (`:26394`) so any week under 500 units displays "0k". Recap uses `storedToUnit` while the body copy at `:26376` prints `weekVol/1000` **unconverted** — the two numbers disagree in lb mode. Hardcoded gradient `#0A0A0B → #1A0A02` (`:26326`).

### F-HOME-012 Month calendar with workout markers
- Location: Home tab > `calendar` block
- User action: passive (days are not tappable)
- Behavior:
  1. Header shows current month name uppercased + year (`:26732-26739`).
  2. Weekday letters S M T W T F S (`:26740-26760`).
  3. Leading blanks for `firstDay`, then `daysInM` cells (`:26767-26775`).
  4. Per day: today → solid accent `ORD2`; a day with a workout → green tint plus a 4px dot; a future day → faded muted text (`:26776-26802`).
- Functions: calKey (`:26274-26276`)
- State: derived only (`calY`, `calM`, `firstDay`, `daysInM` at `:26272-26273`)
- Storage / Network / AI: none
- Edge cases: none handled — no month navigation
- Gating: hideable via layout
- Status: PARTIAL
- Evidence for status: `:26728-26731` renders the month title in a `justifyContent:"space-between"` flex row with only one child and no prev/next controls — the layout expects navigation arrows that do not exist. Days are also non-interactive (`:26776`), unlike Recent Workouts.
- Notes: `calKey` zero-pads correctly (`:26275`). Current month only.

### F-HOME-013 Recent Workouts list + "See all"
- Location: Home tab > `recent` block
- User action: taps a workout row (or Enter/Space via `lkKeyActivate`); taps "See all"
- Behavior:
  1. Renders only if `history.length > 0` (`:26804`).
  2. "See all" calls `p.go("train")` (`:26828`).
  3. First 5 history entries rendered with a fire icon, name, and `date - dur - sessionMetaLine(w,false)` (`:26844-26898`).
  4. Row tap sets `selectedWorkout` (`:26852`), which short-circuits HomeScreen into `WorkoutDetail` (`:26278-26313`).
- State: local `selectedWorkout` (`:26222`)
- Functions: sessionMetaLine (`:6927`), lkKeyActivate
- Status: WORKING
- Evidence for status: `:26844-26898` list + `:26278-26313` detail routing both present.
- Notes: rows use `role="button"` + `tabIndex` on a div rather than a real button (`:26845-26847`).

### F-HOME-014 Workout detail (edit / delete / convert to split) from Home
- Location: Home tab > Recent Workouts > row → WorkoutDetail
- User action: back, edit, delete, or convert-to-split inside `WorkoutDetail`
- Behavior:
  1. `onBack` clears `selectedWorkout` (`:26283-26285`).
  2. `onEdit(updated)` maps history replacing the entry matched by `sameWorkout` and re-selects the updated object (`:26286-26294`).
  3. `onDelete` filters that entry out of history and clears the selection (`:26295-26301`).
  4. `onConvertToSplit(split)` upserts into `p.splits` by `split.id` then clears the selection (`:26302-26312`).
- State: `p.setHistory`, `p.setSplits` (parent state)
- Status: WORKING
- Evidence for status: `:26286-26312` all four callbacks fully implemented.
- Notes: identity relies on `sameWorkout` (defined outside range); two identical sessions could collide. UNVERIFIED whether `sameWorkout` uses a unique id.

### F-HOME-015 Auto-add due staples on Home mount
- Location: Home tab (invisible side effect)
- User action: none — fires on Home mount
- Behavior: `useEffect(..., [])` calls `autoAddDueStaples()` once per mount (`:26225-26228`).
- Functions: autoAddDueStaples (`:43506`)
- Status: WORKING
- Evidence for status: `:26227` unconditional mount-time call with an empty dep array.
- Notes: the in-code comment at `:26225-26226` states this exists so hiding the "Running Low" block does not silently disable the restock loop — a deliberate coupling worth preserving or making explicit in the redesign.

### F-HOME-016 "Set up your first split" empty-state card
- Location: Home tab > below all layout blocks
- User action: taps "Create a Split"
- Behavior: renders only when `p.splits.length === 0` (`:26914`); button calls `p.go("train")` (`:26942-26944`).
- Status: WORKING
- Evidence for status: `:26914` + `:26942` are explicit.
- Notes: rendered outside the layout-block system, so it cannot be hidden or reordered.

### F-GOAL-001 Goals list (active + completed)
- Location: Progress tab > Goals sub-tab > GoalsTab list view
- User action: taps a goal card
- Behavior:
  1. Goals load lazily from `ld("goals", [])` on first render (`:26997-26999`).
  2. Split into `active` (status "active") and `completed` (status "completed") (`:28102-28107`).
  3. Empty state 🎯 "No Goals Set" when `goals.length === 0` (`:28113-28143`).
  4. Active section header "ACTIVE (n)"; each card shows type icon, name, `current → target`, days-left suffix, a big percent, and a 4px progress bar clamped to 100% (`:28144-28234`).
  5. Completed section header "COMPLETED (n)"; each row shows a check icon, name, `start → target`, and completion date (`:28235-28309`).
  6. Any card tap sets `selIdx`, `view="detail"`, and clears `aiText` (`:28162-28166`).
- Components: GoalsTab (`:26992-28322`)
- Functions: getCurrentValue (`:27039-27059`), getProgress (`:27060-27068`), getDaysLeft (`:27069-27075`)
- State: `goals`, `selIdx`, `view`, `aiText` (`:26997-27007`)
- Storage: reads `lk_goals` (`:26998`)
- Network / AI: none in list view
- Edge cases: no goals → empty state; `cur === null` renders "--" (`:28206`); unknown goal type falls back to `GOAL_TYPES[3]` ("custom") (`:28157-28159`)
- Gating: always on
- Status: WORKING
- Evidence for status: `:28102-28309` both sections render and route to detail.
- Notes: `idx` is derived by `goals.indexOf(goal)` (`:28152`) — two structurally identical goal objects are distinct references so this is safe, but it is O(n²) and index-based identity flows into edit/delete.

### F-GOAL-002 Goal progress computation
- Location: Progress > Goals (all views)
- Behavior:
  1. `getCurrentValue`: type `lift` → best `w` in `prs[goal.exId]` via `liftDisp` (`:27040-27047`); `weight` → last `getWeightLog()` entry converted by `toDisp` (`:27048-27052`); `bf` → last `bfLog` entry `.pct` (`:27053-27056`); `custom` → `goal.currentManual || null` (`:27057`).
  2. `getProgress`: null unless current, target and start all exist; `(cur-start)/(target-start)*100`, rounded, clamped to 0–100; equal start/target returns 100 (`:27060-27068`).
  3. `getDaysLeft`: `ceil((targetDate@midnight - now)/86400000)`, null if no date (`:27069-27075`).
- Functions: toDisp (`:27032-27035`), toKg (`:27036-27038`), liftDisp (`:4439`), getWeightLog (`:2908`), convToKg (`:4464`)
- Status: PARTIAL
- Evidence for status: `custom` goals read `goal.currentManual` (`:27057`) but nothing in this file's Goals UI ever sets `currentManual` — the add/edit form (`:27860-28101`) has no current-value field. Custom goals therefore always show "--" and 0%.
- Notes: `toKg` (`:27036-27038`) is defined and never called anywhere in range — dead code. `getProgress` also silently treats `start === 0` (the fallback written by `saveGoal` at `:27124`) as a valid baseline, so a goal created with no baseline data measures progress from zero.

### F-GOAL-003 Create / edit a goal
- Location: Progress > Goals > "NEW GOAL" button, or detail > edit pencil
- User action: picks a type, types name/target/deadline/notes, optionally searches an exercise, taps CREATE GOAL / SAVE CHANGES
- Behavior:
  1. `openAdd(type)` resets every form field, sets unit ("%" for bf, else the display unit), clears `editIdx`, and sets `view="add"` (`:27076-27087`). The list button calls `openAdd("")` so the type picker shows (`:28312`).
  2. `openEdit(idx)` prefills all fields from `goals[idx]` and sets `editIdx` (`:27088-27100`).
  3. Type picker lists the four `GOAL_TYPES` cards; selecting one sets `gType` and unit (`:27817-27859`).
  4. Name input (`:27884-27906`), lift-only exercise search over `ALL_EX` limited to 12 results and requiring non-empty query (`:27795-27800`, `:27907-27990`), numeric-sanitised target `[^0-9.]` stripped (`:28014`), date input with `colorScheme` matched to `isDarkMode` (`:28055-28066`), notes textarea (`:28067-28088`).
  5. Save button disabled unless name + target, and (for lift) an exercise (`:28090-28093`).
  6. `saveGoal()` recomputes a `start` baseline from PRs / weight log / bf log by type, builds the entry, preserves `start` and `created` when editing, then replaces at `editIdx` or appends (`:27101-27144`).
  7. Logs beta activity `goal_create` / `goal_edit` with name, type, target (`:27139-27143`) and returns to the list.
- Functions: openAdd (`:27076`), openEdit (`:27088`), saveGoal (`:27101`), setGoals (`:27022-27029`)
- State: `gType, gName, gTarget, gDate, gExId, gExSearch, gUnit, gNotes, editIdx` (`:27008-27017`)
- Storage: writes `lk_goals` on every mutation via `setGoals` → `sd` (`:27026`); reads `lk_weightLog` (via getWeightLog) and `lk_bfLog`
- Network: `logBetaActivity` (`:2772`) — see F-GOAL-007
- AI: none
- Edge cases: `saveGoal` early-returns on blank name or target (`:27102`); empty exercise search shows no results by design (`:27796`); no upper bound on target value
- Gating: always on
- Status: PARTIAL
- Evidence for status: `saveGoal` (`:27101-27102`) does **not** re-check `gType === "lift" && !gExId`; only the disabled attribute prevents it (`:28091`). A lift goal saved without an exercise would have `exId: null` and permanently return `null` from `getCurrentValue` (`:27041`).
- Notes: the button's `background`/`color`/`cursor` styles use a *different* condition than `disabled` — `color` and `cursor` ignore the exercise requirement (`:28092-28095`), so for a lift goal with no exercise the button looks enabled-ish while being disabled. `gUnit` for `weight` and `custom` collapses to the same `unit` expression (`:27083`) — a "Custom" goal is forced into kg/lb with no way to set its own unit despite the type promising "any numeric goal".

### F-GOAL-004 Goal detail view (ring, start/current/target, deadline, notes)
- Location: Progress > Goals > goal card → detail
- User action: back, edit, analyse, mark complete, delete
- Behavior:
  1. Guarded by `view === "detail" && selIdx !== null && goals[selIdx]` (`:27428`).
  2. Back clears view, `selIdx`, and `aiText` (`:27459-27464`).
  3. Edit pencil calls `openEdit(selIdx)` (`:27491-27493`).
  4. SVG ring: r=52, dasharray 327, offset scaled by `min(pct,100)/100`, stroke turns green at ≥100 (`:27524-27547`).
  5. Three tiles: START (or "--"), CURRENT (or "--"), TARGET, each suffixed with `goal.unit` (`:27567-27637`).
  6. Deadline chip when `daysLeft !== null`: green if ≤0 ("Deadline reached"), red if <14 days, blue otherwise (`:27638-27664`).
  7. Notes block renders only if `goal.notes` (`:27738-27754`).
  8. "Mark Complete" shows only when `isActive && pct >= 100` (`:27759-27775`); calls `completeGoal(selIdx)` which sets status "completed" and `completedDate = todayISO` (`:27145-27154`).
  9. "Delete Goal" requires a double-tap via `lkConfirm("delGoal"+selIdx, "Tap Delete again to remove this goal.")` (`:27778-27779`), then `deleteGoal(idx)` logs `goal_deleted`, filters the goal out, and returns to the list if it was selected (`:27155-27168`).
- Functions: completeGoal (`:27145`), deleteGoal (`:27155`), lkConfirm (`:5179`), readableAccent (`:4318`)
- Storage: writes `lk_goals`
- Status: PARTIAL
- Evidence for status: `pct >= 100` at `:27759` and `:27772` compares a possibly-`null` `pct`; `null >= 100` is false so Mark Complete simply never appears for a goal with no current value — a lift goal for an exercise with no PRs can never be completed and can only be deleted.
- Notes: `pct >= 100` is also used for the ring text color at `:27563` where `pct` may be null. Goal completion is only ever reachable through the ≥100% path — there is no manual "mark done anyway".

### F-GOAL-005 AI goal progress analysis
- Location: Progress > Goals > detail > "Analyse My Progress" / "Refresh"
- User action: taps the button
- Behavior:
  1. `getGoalAiAnalysis(goal)` sets `aiLoading` true (`:27213`).
  2. Assembles current value, progress %, days left, and the last 5 workouts via `sessionSummaryLine` (`:27214-27219`).
  3. System prompt: "You are an elite strength coach analysing goal progress. Be direct, specific, and actionable. Reference the numbers." (`:27220`).
  4. User prompt includes goal name/type/target/current/start/progress/days remaining (`:27221`); for lift goals it appends the exercise name and full PR history as `"{w}kg x{r} (date)"` (`:27222-27228`); appends recent workouts (`:27229`); appends up to 300 chars of `ld("coachInstructions","")` as "User context" (`:27230-27231`); asks for 3–5 sentences (`:27232`).
  5. `aiCall(sys, usr, null, onDone, onFail)` (`:27233-27239`) POSTs to the worker endpoint.
  6. Success sets `aiText`; failure sets "Analysis unavailable. Check connection." (`:27237`).
  7. While loading a spinner + "Analysing goal..." shows (`:27686-27709`); the result card has a "Refresh" button re-running the same call (`:27723-27737`).
- Functions: getGoalAiAnalysis (`:27212-27240`), aiCall (`:2663`), sessionSummaryLine (`:6908`)
- State: `aiText`, `aiLoading` (`:27006-27007`)
- Storage: reads `lk_coachInstructions` (`:27230`)
- Network: `POST https://lockedapi.cescocugliari.workers.dev/` with `{system, max_tokens: 700, messages:[{role:"user",content}]}`, headers from `authHeaders()` (`:2665-2678`)
- AI: model not specified client-side — chosen server-side by the Cloudflare Worker. Prompt at `:27220-27232`.
- Edge cases: failure → static message; `aiText` cleared on every navigation into or out of detail (`:27463`, `:28165`, `:28268`), so the analysis is never cached
- Gating: only for `isActive` goals (`:27665`)
- Status: WORKING
- Evidence for status: `:27233-27239` both callbacks are wired.
- Notes: no re-entrancy guard — unlike `getAiBfEstimate`, `getGoalAiAnalysis` has no `if (aiLoading) return`, but the button is hidden while loading (`:27666`) so double-fire is only reachable via the "Refresh" button (`:27723`), which *is* clickable during a pending refresh. PR history is sent raw in kg regardless of the user's display unit (`:27226`).

### F-GOAL-006 Body Fat Log (manual entry, method chips, history)
- Location: Progress > Goals > "📐 Body Fat Log" button → BF log screen
- User action: types a percentage, picks a method chip, taps LOG ENTRY; back to return
- Behavior:
  1. List-view button opens the screen and clears `bfAiText` (`:28310-28312`); its label appends "— current: N%" when entries exist (`:28309`).
  2. Input sanitises to `[0-9.]` (`:27310-27312`).
  3. Method chips: Manual, Calipers, DEXA, Scale, Visual — stored lowercased (`:27350-27377`).
  4. LOG ENTRY disabled while the input is empty (`:27379-27394`).
  5. `logBf()` parses the input and rejects non-finite, ≤0, or >75 with a toast "Enter a body fat percentage between 1 and 75." (`:27169-27186`).
  6. Valid values go to `addBfEntry(pct, method)` which appends `{pct, method, date: isoDay()}`, sorts by date ascending, and writes `lk_bfLog` (`:26979-26991`).
  7. State updated, input cleared, `logBetaActivity("bf_logged", {pct, method})` (`:27181-27185`).
  8. History renders newest-first with pct, date, and a method pill; empty state "No body fat entries yet." (`:27419-27427`).
- Functions: logBf (`:27169`), addBfEntry (`:26979`), getBfLog (`:26976`)
- State: `bfLog`, `bfInput`, `bfMethod`, `showBfLog` (`:27001-27020`)
- Storage: reads/writes `lk_bfLog` (`:26977`, `:26989`)
- Network: `logBetaActivity` only
- Edge cases: covered by the explicit validation at `:27174-27178`
- Gating: always on
- Status: WORKING
- Evidence for status: `:27169-27186` validation, persistence, and telemetry all present.
- Notes: the comment at `:27170-27173` documents the historical bug — a lone "." passed the input sanitiser and stored `NaN`, which read back as `null%` and fed body-fat goals. The fix is the `isFinite` check at `:27174`. Multiple entries on the same day are all kept (no dedupe, `:26980`), and the sort is stable-by-date only, so same-day ordering depends on insertion. `getCurrentValue` for bf reads `bfLog[bfLog.length-1]` (`:27055`) — after the sort that is the latest date, correct.

### F-GOAL-007 AI body fat estimate
- Location: Progress > Goals > Body Fat Log > "AI Body Fat Estimate"
- User action: taps the button
- Behavior:
  1. `getAiBfEstimate()` early-returns if `bfAiLoading` (`:27191`), then sets loading true.
  2. Gathers last weight-log entry, the last 5 `lk_progressPhotos` notes with dates, and the last 5 bf log entries (`:27193-27201`).
  3. System prompt: "You are a fitness coach estimating body fat percentage. Be practical and give a specific number range. Do not hedge excessively." (`:27202`).
  4. User prompt includes displayName, sex (default "male"), age, weight in kg, height in cm, goal, previous BF logs, and photo notes; asks for a 2–3 sentence range estimate (`:27203`).
  5. `aiCall` → success sets `bfAiText`; failure sets "Unable to estimate. Try logging more data points." (`:27204-27211`).
  6. Button shows " Estimating…" and is `disabled` while loading (`:27395-27410`); a separate "Analysing..." line renders below (`:27411`).
- Functions: getAiBfEstimate (`:27187-27211`)
- State: `bfAiText`, `bfAiLoading` (`:27019-27020`)
- Storage: reads `lk_progressPhotos` (`:27195`), `lk_weightLog`, `lk_bfLog`
- Network: same worker endpoint as F-GOAL-005 (`:2664`)
- AI: model server-side; prompt at `:27202-27203`
- Edge cases: missing profile fields substituted with "unknown"/"male" (`:27203`); failure message is static
- Gating: always on
- Status: WORKING
- Evidence for status: `:27191` guard + `:27204-27210` both callbacks.
- Notes: the comment at `:27188-27190` documents the original bug — no disabled state meant three taps burned three daily-quota requests in a race. Two mitigations were added and both remain (`:27191` guard and `:27398` disabled), which is redundant but harmless. **Privacy**: `profile.displayName`, sex, age, height, weight and free-text photo notes are sent to a third-party endpoint with no consent prompt in this range (`:27203`). Estimating body fat from user-described photo notes is a health-adjacent inference worth flagging for the redesign.

### F-GOAL-008 Beta activity telemetry from Goals
- Location: Progress > Goals (background)
- Behavior: `logBetaActivity` fires on `goal_create`/`goal_edit` (`:27139-27143`), `goal_deleted` (`:27156-27158`), and `bf_logged` (`:27182-27185`).
- Functions: logBetaActivity (`:2772`)
- Status: WORKING
- Evidence for status: three explicit call sites listed above.
- Notes: goal names and body-fat percentages are included in the payloads (`:27140`, `:27183`) — user-identifying health data leaving the device via telemetry. No `goal_completed` event exists even though `completeGoal` (`:27145`) is a meaningful funnel step — a telemetry gap.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| QuickActionsRow | component | 26141-26219 | Renders up to 3 configurable quick-action tiles with a transient flash message | HomeScreen BLOCKS.quick (26621-26625) | useState, QUICK_ACTION_DEFS, run | F-HOME-001 |
| run | handler (inner) | 26147-26160 | Dispatches a quick action: water logs, others navigate | QuickActionsRow tile onClick (26165) | quickLogWater, setFlash, setTimeout, p.go | F-HOME-001 |
| HomeScreen | component | 26220-26955 | The whole Home tab: header, layout blocks, recap view, workout detail routing | app router (outside range) | useState, useEffect, autoAddDueStaples, isoDay, dayOf, liftVolume, liftSets, cardioMinutes, getHomeLayout, calKey | F-HOME-002…016 |
| calKey | function (inner) | 26274-26276 | Builds a zero-padded YYYY-MM-DD key for a calendar day number | BLOCKS.calendar (26770) | String.padStart | F-HOME-012 |
| BLOCKS.stats | render fn | 26528-26592 | 2×2 counters: workouts, splits, this week, PRs | layout.order map (26907) | — | F-HOME-004 |
| BLOCKS.insight | render fn | 26593-26598 | Mounts ProactiveTipCard | layout.order map | ProactiveTipCard | F-HOME-006 |
| BLOCKS.throwback | render fn | 26599-26608 | Computes and renders a throwback card with dismiss | layout.order map | computeThrowback, ThrowbackCard, dismissThrowback, setTbTick | F-HOME-007 |
| BLOCKS.cycletrack | render fn | 26609-26613 | Mounts CycleTrackerCard for female profiles only | layout.order map | isFemaleUser, CycleTrackerCard | F-HOME-008 |
| BLOCKS.quick | render fn | 26614-26619 | Mounts QuickActionsRow with the saved quick ids | layout.order map | QuickActionsRow | F-HOME-001 |
| BLOCKS.feed | render fn | 26620-26626 | Mounts DynamicFeed | layout.order map | DynamicFeed | F-HOME-009 |
| BLOCKS.start | render fn | 26627-26661 | Full-width START WORKOUT CTA | layout.order map | p.go | F-HOME-010 |
| BLOCKS.supps | render fn | 26662-26664 | Mounts SuppReminderCard | layout.order map | SuppReminderCard | F-HOME-009 |
| BLOCKS.restock | render fn | 26665-26667 | Mounts RunningLowCard | layout.order map | RunningLowCard | F-HOME-009 |
| BLOCKS.cycle | render fn | 26668-26670 | Mounts CycleReminderCard | layout.order map | CycleReminderCard | F-HOME-009 |
| BLOCKS.progress | render fn | 26671-26707 | VIEW PROGRESS navigation button | layout.order map | p.go | F-HOME-010 |
| BLOCKS.recap | render fn | 26708-26727 | Weekly Recap button, shown on Sunday or with week data | layout.order map | setShowRecap | F-HOME-011 |
| BLOCKS.calendar | render fn | 26728-26803 | Current-month grid with today/workout/future day states | layout.order map | calKey | F-HOME-012 |
| BLOCKS.recent | render fn | 26804-26902 | Last 5 workouts + See all | layout.order map | sessionMetaLine, setSelectedWorkout, p.go, lkKeyActivate | F-HOME-013 |
| greeting IIFE | inline function | 26469-26472 | Picks a time-of-day greeting string | HomeScreen header render | Date.getHours | F-HOME-002 |
| onBack (WorkoutDetail) | handler | 26283-26285 | Clears the selected workout | WorkoutDetail | setSelectedWorkout | F-HOME-014 |
| onEdit (WorkoutDetail) | handler | 26286-26294 | Replaces the edited workout in history | WorkoutDetail | p.setHistory, sameWorkout, setSelectedWorkout | F-HOME-014 |
| onDelete (WorkoutDetail) | handler | 26295-26301 | Removes the workout from history | WorkoutDetail | p.setHistory, sameWorkout | F-HOME-014 |
| onConvertToSplit | handler | 26302-26312 | Upserts a split derived from the workout | WorkoutDetail | p.setSplits | F-HOME-014 |
| onDismiss (throwback) | handler | 26606 | Dismisses the throwback and forces a re-render | ThrowbackCard | dismissThrowback, setTbTick | F-HOME-007 |
| GOAL_TYPES | const data | 26957-26975 | The four goal kinds (lift, weight, bf, custom) with icon/color/desc | GoalsTab detail, add, list | — | F-GOAL-001, F-GOAL-003 |
| getBfLog | function | 26976-26978 | Reads the body-fat log from storage | GoalsTab init (27002), addBfEntry | ld | F-GOAL-006 |
| addBfEntry | function | 26979-26991 | Appends a bf entry, sorts by date, persists | logBf (27180) | getBfLog, isoDay, sd | F-GOAL-006 |
| GoalsTab | component | 26992-28322 | Goals list/detail/add plus the body-fat log sub-screen | ProgressPage goals tab | 20 useState hooks, ld, all inner fns below | F-GOAL-001…008 |
| setGoals | function (inner) | 27022-27029 | State setter that also persists goals to localStorage | saveGoal, completeGoal, deleteGoal | sd, setGoalsRaw | F-GOAL-001, 003, 004 |
| toDisp | function (inner) | 27032-27035 | Converts a stored kg bodyweight to the display unit | getCurrentValue, saveGoal | fmtQ | F-GOAL-002 |
| toKg | function (inner) | 27036-27038 | Converts a displayed value back to kg — **never called** | (none — dead) | convToKg | F-GOAL-002 |
| getCurrentValue | function (inner) | 27039-27059 | Resolves a goal's current value by type | getProgress, detail, list, saveGoal, getGoalAiAnalysis | liftDisp, getWeightLog, toDisp | F-GOAL-002 |
| getProgress | function (inner) | 27060-27068 | Percent complete, clamped 0-100 | detail, list, getGoalAiAnalysis | getCurrentValue, parseFloat | F-GOAL-002 |
| getDaysLeft | function (inner) | 27069-27075 | Days until the goal deadline | detail, list, getGoalAiAnalysis | Date | F-GOAL-002 |
| openAdd | function (inner) | 27076-27087 | Resets the form and opens the add view | NEW GOAL button (28312) | 9 setters | F-GOAL-003 |
| openEdit | function (inner) | 27088-27100 | Prefills the form from an existing goal | detail edit button (27492) | 9 setters | F-GOAL-003 |
| saveGoal | function (inner) | 27101-27144 | Validates, computes the start baseline, creates or updates a goal | CREATE/SAVE button (28089) | getWeightLog, liftDisp, toDisp, setGoals, logBetaActivity | F-GOAL-003 |
| completeGoal | function (inner) | 27145-27154 | Marks a goal completed with today's date | Mark Complete button (27761) | setGoals | F-GOAL-004 |
| deleteGoal | function (inner) | 27155-27168 | Logs and removes a goal, resetting selection | Delete Goal button (27778) | logBetaActivity, setGoals | F-GOAL-004 |
| logBf | function (inner) | 27169-27186 | Validates and stores a body-fat entry | LOG ENTRY button (27380) | parseFloat, isFinite, window.LOCKED.toast, addBfEntry, logBetaActivity | F-GOAL-006 |
| getAiBfEstimate | function (inner) | 27187-27211 | Builds and sends the AI body-fat estimate prompt | AI Body Fat Estimate button (27396) | getWeightLog, ld, aiCall | F-GOAL-007 |
| getGoalAiAnalysis | function (inner) | 27212-27240 | Builds and sends the AI goal-analysis prompt | Analyse / Refresh buttons (27668, 27724) | getCurrentValue, getProgress, getDaysLeft, getWeightLog, sessionSummaryLine, getEx, ld, aiCall | F-GOAL-005 |
| bf back handler | handler | 27249-27251 | Closes the body-fat log screen | BF back button | setShowBfLog | F-GOAL-006 |
| bf input onChange | handler | 27310-27312 | Sanitises the bf input to digits and dots | bf input | setBfInput | F-GOAL-006 |
| bf method onClick | handler | 27353-27355 | Selects a measurement method | method chips | setBfMethod | F-GOAL-006 |
| detail back handler | handler | 27459-27464 | Returns to the list and clears the AI text | detail back button | setView, setSelIdx, setAiText | F-GOAL-004 |
| delete confirm handler | handler | 27777-27780 | Double-tap confirmation before deleting | Delete Goal button | lkConfirm, deleteGoal | F-GOAL-004 |
| add close handler | handler | 27806-27808 | Closes the add/edit form | X button | setView | F-GOAL-003 |
| type picker onClick | handler | 27821-27824 | Selects the goal type and default unit | GOAL_TYPES cards | setGType, setGUnit | F-GOAL-003 |
| gName onChange | handler | 27886-27888 | Updates the goal name | name input | setGName | F-GOAL-003 |
| gExSearch onChange | handler | 27949-27951 | Updates the exercise query | exercise search input | setGExSearch | F-GOAL-003 |
| exercise result onClick | handler | 27968-27971 | Picks an exercise and clears the query | result buttons | setGExId, setGExSearch | F-GOAL-003 |
| exercise Change onClick | handler | 27931-27933 | Clears the chosen exercise | Change button | setGExId | F-GOAL-003 |
| gTarget onChange | handler | 28013-28015 | Sanitises the target to digits and dots | target input | setGTarget | F-GOAL-003 |
| gDate onChange | handler | 28047-28049 | Updates the deadline | date input | setGDate | F-GOAL-003 |
| gNotes onChange | handler | 28070-28072 | Updates the notes | notes textarea | setGNotes | F-GOAL-003 |
| goal card onClick (active) | handler | 28162-28166 | Opens the goal detail | active goal cards | setSelIdx, setView, setAiText | F-GOAL-001 |
| goal card onClick (completed) | handler | 28265-28269 | Opens the goal detail | completed goal rows | setSelIdx, setView, setAiText | F-GOAL-001 |
| BF log open handler | handler | 28310-28312 | Opens the body-fat log, clearing prior AI text | 📐 Body Fat Log button | setShowBfLog, setBfAiText | F-GOAL-006 |
| NEW GOAL onClick | handler | 28312-28314 | Opens the add form at the type picker | NEW GOAL button | openAdd | F-GOAL-003 |

Counts: 3 top-level components, 2 top-level functions, 1 top-level const, 17 inner named functions, 14 `BLOCKS` render functions, 22 inline handlers/IIFEs indexed above — **59 rows**.

---

## Storage keys touched

| Key (`lk_` prefixed) | Read at | Written at | Feature |
|---|---|---|---|
| `homeLayout` | 26066 (via getHomeLayout, called 26526) | 26080 (saveHomeLayout, outside range) | F-HOME-003 |
| `fuelLog` | 26125 | 26137 | F-HOME-001 |
| `gamingLayer` | 26430, 26483 | — | F-HOME-002, F-HOME-011 |
| `throwbackDismissed` | 4603/4606 (via computeThrowback) | 4662 (via dismissThrowback, triggered 26606) | F-HOME-007 |
| `goals` | 26998 | 27026 | F-GOAL-001, 003, 004 |
| `bfLog` | 26977 (getBfLog, called 27002 and 26980) | 26989 | F-GOAL-006 |
| `weightLog` | via getWeightLog at 27049, 27110, 27193, 27216 | — | F-GOAL-002, 003, 005, 007 |
| `progressPhotos` | 27195 | — | F-GOAL-007 |
| `coachInstructions` | 27230 | — | F-GOAL-005 |

Also touched indirectly: workout history and splits arrive as props (`p.history`, `p.splits`, `p.prs`) and are persisted by the parent, not here (`:26286-26312`).

## Network endpoints

| Endpoint | Method | Payload | Called from | Response handling |
|---|---|---|---|---|
| `https://lockedapi.cescocugliari.workers.dev/` | POST | `{system, max_tokens: 700, messages:[{role:"user", content}]}`, headers from `authHeaders()` (2665-2678) | `getGoalAiAnalysis` (27233), `getAiBfEstimate` (27204) | success → `setAiText`/`setBfAiText`; failure → static fallback strings (27237, 27208) |
| beta activity sink | via `logBetaActivity` (2772) | `{name,type,target}` (27140), `{name}` (27157), `{pct,method}` (27183) | saveGoal, deleteGoal, logBf | fire-and-forget from this range's perspective |

**Security notes.** No hardcoded secret literal appears in 26141–28322 — auth is delegated to `authHeaders()` at `:2666` (outside range; Agent covering 1-4663 should confirm whether a token is embedded there). Flagging for the redesign regardless: the AI endpoint is a fixed personal-account Cloudflare Worker hostname (`:2664`), and the two prompts in this range transmit `displayName`, sex, age, height, weight, body-fat history and free-text progress-photo notes off-device (`:27203`), with goal names and body-fat percentages additionally sent through beta telemetry (`:27140`, `:27183`).

## Open questions / UNVERIFIED

1. `ProactiveTipCard`, `DynamicFeed`, `SuppReminderCard`, `RunningLowCard`, `CycleReminderCard`, `CycleTrackerCard`, `ThrowbackCard`, `WorkoutDetail` — mounted at 26594, 26621, 26663, 26666, 26669, 26610, 26603, 26279 but defined outside this range. Confirm by locating each definition; behavior is out of my scope.
2. `sameWorkout` (used at 26289, 26298) — does it use a unique id or field equality? If the latter, editing one of two identical sessions edits both. Confirm by reading its definition.
3. `authHeaders()` (`:2666`) — does it embed a static client token? Needs the shared-code agent to confirm.
4. `goal.currentManual` (`:27057`) — no writer exists in this range. Confirm with `rg -n 'currentManual'` across the file; if there is no writer anywhere, custom goals are permanently stuck at 0% (F-GOAL-002).
5. `weekCardioMin` (`:26268`) — computed and unused in range. Confirm it is not referenced elsewhere before removing.
6. `tbTick` (`:26223`) — write-only re-render trigger; confirm no consumer exists elsewhere.
7. `toKg` (`:27036`) — defined, never called in range. Likely dead.
8. `isDarkMode` (`:28063`) — read as a bare global for the date input's `colorScheme`; confirm whether it is reactive or a snapshot, since a theme switch may not update the picker.
9. `fmtQ` (`:27034`) and `dayOf` (`:26236`) — used but defined outside range; confirm rounding/parse semantics.
10. Whether the Home layout editor (writer of `lk_homeLayout`) exposes all 14 block ids and the quick-action picker; the editor UI is outside this range.
