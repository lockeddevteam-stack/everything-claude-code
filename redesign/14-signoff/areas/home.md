### F-HOME-001 — Quick Actions row (3 configurable shortcuts)
- location: Home tab > HomeScreen > `quick` layout block > 3-column button grid
- user action: taps one of up to three emoji shortcut tiles
- behaviour: 1. `layout.quick` (default `["water","checkin","food"]`) is read from the saved home layout (`redesign/input/locked-current-v6.html:26076`). 2. Ids are filtered against `QUICK_ACTION_DEFS` and sliced to max 3 (`:26143-26145`). 3. If none remain the whole row renders `null` (`:26146`). 4. `run(id)`: for `"water"` it calls `quickLogWater(250)` and shows an inline flash "💧 N ml today" for 1800 ms (`:26149-26156`). 5. For `"checkin"` it sets the global `window.__lockedCoachPane = "check-in"` before navigating (`:26158`). 6. Otherwise (and for checkin) `p.go(def.go)` navigates to the tab named in the def (`:26159`).
- v6 status: WORKING

### F-HOME-002 — Home header greeting, name and streak pill
- location: Home tab > HomeScreen > header
- user action: passive (view)
- behaviour: 1. Time-of-day greeting chosen by `today.getHours()`: <5 "Up late,", <12 "Good morning,", <17 "Good afternoon,", else "Good evening," (`:26469-26472`). 2. `profile.displayName || "Athlete"` rendered as the H1 (`:26482`). 3. Streak is computed by walking back day-by-day through a set of workout ISO dates until a gap (`:26240-26249`). 4. If `streak > 0` **and** `ld("gamingLayer", false)` is true, a flame pill with the streak count renders next to the name (`:26483-26506`). 5. Avatar circle shows the first letter of the display name, uppercased, falling back to "A" (`:26507-26523`).
- v6 status: WORKING

### F-HOME-003 — Configurable home block layout (order + hide)
- location: Home tab > HomeScreen > body
- user action: passive here; the reorder/hide UI lives outside this range (`homeLayout` written by `saveHomeLayout` `:26079-26081`)
- behaviour: 1. `getHomeLayout()` returns `{order, hidden, quick}`, filtering unknown ids and appending any missing default ids so new blocks appear for existing users (`:26065-26078`). 2. A `BLOCKS` map defines a render function per block id: `stats`, `insight`, `throwback`, `cycletrack`, `quick`, `feed`, `start`, `supps`, `restock`, `cycle`, `progress`, `recap`, `calendar`, `recent` (`:26527-26903`). 3. `layout.order.map` renders each block wrapped in a `React.Fragment` keyed by id, skipping ids in `layout.hidden` and ids with no renderer (`:26904-26913`).
- v6 status: WORKING

### F-HOME-004 — Stats grid (4 tiles)
- location: Home tab > `stats` block
- user action: passive
- behaviour: 2×2 grid of Total Workouts (`history.length`), My Splits (`p.splits.length`), This Week (`uDays`), PRs Logged (`Object.keys(prs).length`); zero values render muted (`:26528-26592`).
- v6 status: WORKING

### F-HOME-005 — Weekly aggregates (training days, volume, sets, cardio, consistency label)
- location: Home tab (feeds F-HOME-004 "This Week" and F-HOME-011 recap)
- user action: passive
- behaviour: 1. Week window starts at the most recent Sunday (`today.getDate() - today.getDay()`), 7 ISO keys built (`:26250-26257`). 2. `weekW` = history entries whose `dateISO` is in that window (`:26258-26260`). 3. `uDays` = count of distinct dates; `weekVol` via `liftVolume`; `weekSets` via `liftSets`; `weekCardioMin` via `cardioMinutes` (`:26261-26268`). 4. `consistency` label: ≥5 "Incredible week", ≥3 "Solid week", 0 "Rest week", else "Building momentum" (`:26270`).
- v6 status: PARTIAL

### F-HOME-006 — Proactive insight card
- location: Home tab > `insight` block
- user action: passive (card's own interactions live outside this range)
- behaviour: renders `ProactiveTipCard` with `profile` and `history` props (`:26593-26598`).
- v6 status: UNVERIFIED — only the mount site is in range.

### F-HOME-007 — Throwback card
- location: Home tab > `throwback` block
- user action: taps dismiss on the card
- behaviour: 1. `computeThrowback()` (`:4606`) is called each render; if it returns falsy the block renders `null` (`:26600-26601`). 2. Otherwise `ThrowbackCard` renders with `data`, `useKg`, and `onDismiss` (`:26602-26608`). 3. Dismiss calls `dismissThrowback()` (writes `lk_throwbackDismissed` with an ISO timestamp, `:4662`) then bumps local `tbTick` to force a re-render (`:26606`).
- v6 status: WORKING

### F-HOME-008 — Cycle tracking card (female users)
- location: Home tab > `cycletrack` block
- user action: 
- behaviour: renders `CycleTrackerCard` with `go` only when `isFemaleUser(p.profile)` (`:26609-26613`); otherwise `null`.
- v6 status: WORKING (mount), card internals UNVERIFIED (outside range)

### F-HOME-009 — Dynamic feed / supplement reminder / running-low / cycle reminder blocks
- location: Home tab > `feed`, `supps`, `restock`, `cycle` blocks
- user action: 
- behaviour: thin mounts — `DynamicFeed({history, splits, go})` (`:26620-26626`), `SuppReminderCard` (`:26662-26664`), `RunningLowCard` (`:26665-26667`), `CycleReminderCard` (`:26668-26670`). All four components are defined outside this range.
- v6 status: UNVERIFIED — mount sites only.

### F-HOME-010 — Start Workout / View Progress navigation buttons
- location: Home tab > `start` and `progress` blocks
- user action: taps the button
- behaviour: `start` is a full-width gradient CTA calling `p.go("train")` (`:26627-26661`); `progress` is an outlined button calling `p.go("progress")` (`:26671-26707`).
- v6 status: WORKING

### F-HOME-011 — Weekly Recap screen
- location: Home tab > `recap` block button → full-screen recap view
- user action: taps "Weekly Recap"; taps "Back" to return
- behaviour: 1. Button renders only when it is Sunday (`isSun`) **or** there is week data (`haswkdata`) (`:26709`). 2. Tap sets `showRecap` true (`:26716`), which short-circuits HomeScreen's render into the recap view (`:26314-26468`). 3. Missed days = weekday names before today with no logged session (`:26316-26323`). 4. Header shows `consistency.toUpperCase()` plus a copy variant per `uDays` bucket (0 / ≥5 / ≥3 / else) (`:26375-26377`). 5. Four stat tiles: Workouts, Training Days (`uDays + " / 7"`), Total Sets, Total Volume in `storedToUnit(weekVol, useKg)/1000` rounded to "k" (`:26379-26399`). 6. Streak card renders only if `streak > 0 && ld("gamingLayer", false)` (`:26430`). 7. Missed-days card renders when there is at least one missed day (`:26449`). 8. Back button sets `showRecap` false (`:26331-26333`).
- v6 status: WORKING

### F-HOME-012 — Month calendar with workout markers
- location: Home tab > `calendar` block
- user action: passive (days are not tappable)
- behaviour: 1. Header shows current month name uppercased + year (`:26732-26739`). 2. Weekday letters S M T W T F S (`:26740-26760`). 3. Leading blanks for `firstDay`, then `daysInM` cells (`:26767-26775`). 4. Per day: today → solid accent `ORD2`; a day with a workout → green tint plus a 4px dot; a future day → faded muted text (`:26776-26802`).
- v6 status: PARTIAL

### F-HOME-013 — Recent Workouts list + "See all"
- location: Home tab > `recent` block
- user action: taps a workout row (or Enter/Space via `lkKeyActivate`); taps "See all"
- behaviour: 1. Renders only if `history.length > 0` (`:26804`). 2. "See all" calls `p.go("train")` (`:26828`). 3. First 5 history entries rendered with a fire icon, name, and `date - dur - sessionMetaLine(w,false)` (`:26844-26898`). 4. Row tap sets `selectedWorkout` (`:26852`), which short-circuits HomeScreen into `WorkoutDetail` (`:26278-26313`).
- v6 status: WORKING

### F-HOME-014 — Workout detail (edit / delete / convert to split) from Home
- location: Home tab > Recent Workouts > row → WorkoutDetail
- user action: back, edit, delete, or convert-to-split inside `WorkoutDetail`
- behaviour: 1. `onBack` clears `selectedWorkout` (`:26283-26285`). 2. `onEdit(updated)` maps history replacing the entry matched by `sameWorkout` and re-selects the updated object (`:26286-26294`). 3. `onDelete` filters that entry out of history and clears the selection (`:26295-26301`). 4. `onConvertToSplit(split)` upserts into `p.splits` by `split.id` then clears the selection (`:26302-26312`).
- v6 status: WORKING

### F-HOME-015 — Auto-add due staples on Home mount
- location: Home tab (invisible side effect)
- user action: none — fires on Home mount
- behaviour: `useEffect(..., [])` calls `autoAddDueStaples()` once per mount (`:26225-26228`).
- v6 status: WORKING

### F-HOME-016 — "Set up your first split" empty-state card
- location: Home tab > below all layout blocks
- user action: taps "Create a Split"
- behaviour: renders only when `p.splits.length === 0` (`:26914`); button calls `p.go("train")` (`:26942-26944`).
- v6 status: WORKING
