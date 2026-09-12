### F-GOAL-001 — Goals list (active + completed)
- location: Progress tab > Goals sub-tab > GoalsTab list view
- user action: taps a goal card
- behaviour: 1. Goals load lazily from `ld("goals", [])` on first render (`:26997-26999`). 2. Split into `active` (status "active") and `completed` (status "completed") (`:28102-28107`). 3. Empty state 🎯 "No Goals Set" when `goals.length === 0` (`:28113-28143`). 4. Active section header "ACTIVE (n)"; each card shows type icon, name, `current → target`, days-left suffix, a big percent, and a 4px progress bar clamped to 100% (`:28144-28234`). 5. Completed section header "COMPLETED (n)"; each row shows a check icon, name, `start → target`, and completion date (`:28235-28309`). 6. Any card tap sets `selIdx`, `view="detail"`, and clears `aiText` (`:28162-28166`).
- v6 status: WORKING

### F-GOAL-002 — Goal progress computation
- location: Progress > Goals (all views)
- user action: 
- behaviour: 1. `getCurrentValue`: type `lift` → best `w` in `prs[goal.exId]` via `liftDisp` (`:27040-27047`); `weight` → last `getWeightLog()` entry converted by `toDisp` (`:27048-27052`); `bf` → last `bfLog` entry `.pct` (`:27053-27056`); `custom` → `goal.currentManual || null` (`:27057`). 2. `getProgress`: null unless current, target and start all exist; `(cur-start)/(target-start)*100`, rounded, clamped to 0–100; equal start/target returns 100 (`:27060-27068`). 3. `getDaysLeft`: `ceil((targetDate@midnight - now)/86400000)`, null if no date (`:27069-27075`).
- v6 status: PARTIAL

### F-GOAL-003 — Create / edit a goal
- location: Progress > Goals > "NEW GOAL" button, or detail > edit pencil
- user action: picks a type, types name/target/deadline/notes, optionally searches an exercise, taps CREATE GOAL / SAVE CHANGES
- behaviour: 1. `openAdd(type)` resets every form field, sets unit ("%" for bf, else the display unit), clears `editIdx`, and sets `view="add"` (`:27076-27087`). The list button calls `openAdd("")` so the type picker shows (`:28312`). 2. `openEdit(idx)` prefills all fields from `goals[idx]` and sets `editIdx` (`:27088-27100`). 3. Type picker lists the four `GOAL_TYPES` cards; selecting one sets `gType` and unit (`:27817-27859`). 4. Name input (`:27884-27906`), lift-only exercise search over `ALL_EX` limited to 12 results and requiring non-empty query (`:27795-27800`, `:27907-27990`), numeric-sanitised target `[^0-9.]` stripped (`:28014`), date input with `colorScheme` matched to `isDarkMode` (`:28055-28066`), notes textarea (`:28067-28088`). 5. Save button disabled unless name + target, and (for lift) an exercise (`:28090-28093`). 6. `saveGoal()` recomputes a `start` baseline from PRs / weight log / bf log by type, builds the entry, preserves `start` and `created` when editing, then replaces at `editIdx` or appends (`:27101-27144`). 7. Logs beta activity `goal_create` / `goal_edit` with name, type, target (`:27139-27143`) and returns to the list.
- v6 status: PARTIAL

### F-GOAL-004 — Goal detail view (ring, start/current/target, deadline, notes)
- location: Progress > Goals > goal card → detail
- user action: back, edit, analyse, mark complete, delete
- behaviour: 1. Guarded by `view === "detail" && selIdx !== null && goals[selIdx]` (`:27428`). 2. Back clears view, `selIdx`, and `aiText` (`:27459-27464`). 3. Edit pencil calls `openEdit(selIdx)` (`:27491-27493`). 4. SVG ring: r=52, dasharray 327, offset scaled by `min(pct,100)/100`, stroke turns green at ≥100 (`:27524-27547`). 5. Three tiles: START (or "--"), CURRENT (or "--"), TARGET, each suffixed with `goal.unit` (`:27567-27637`). 6. Deadline chip when `daysLeft !== null`: green if ≤0 ("Deadline reached"), red if <14 days, blue otherwise (`:27638-27664`). 7. Notes block renders only if `goal.notes` (`:27738-27754`). 8. "Mark Complete" shows only when `isActive && pct >= 100` (`:27759-27775`); calls `completeGoal(selIdx)` which sets status "completed" and `completedDate = todayISO` (`:27145-27154`). 9. "Delete Goal" requires a double-tap via `lkConfirm("delGoal"+selIdx, "Tap Delete again to remove this goal.")` (`:27778-27779`), then `deleteGoal(idx)` logs `goal_deleted`, filters the goal out, and returns to the list if it was selected (`:27155-27168`).
- v6 status: PARTIAL

### F-GOAL-005 — AI goal progress analysis
- location: Progress > Goals > detail > "Analyse My Progress" / "Refresh"
- user action: taps the button
- behaviour: 1. `getGoalAiAnalysis(goal)` sets `aiLoading` true (`:27213`). 2. Assembles current value, progress %, days left, and the last 5 workouts via `sessionSummaryLine` (`:27214-27219`). 3. System prompt: "You are an elite strength coach analysing goal progress. Be direct, specific, and actionable. Reference the numbers." (`:27220`). 4. User prompt includes goal name/type/target/current/start/progress/days remaining (`:27221`); for lift goals it appends the exercise name and full PR history as `"{w}kg x{r} (date)"` (`:27222-27228`); appends recent workouts (`:27229`); appends up to 300 chars of `ld("coachInstructions","")` as "User context" (`:27230-27231`); asks for 3–5 sentences (`:27232`). 5. `aiCall(sys, usr, null, onDone, onFail)` (`:27233-27239`) POSTs to the worker endpoint. 6. Success sets `aiText`; failure sets "Analysis unavailable. Check connection." (`:27237`). 7. While loading a spinner + "Analysing goal..." shows (`:27686-27709`); the result card has a "Refresh" button re-running the same call (`:27723-27737`).
- v6 status: WORKING

### F-GOAL-006 — Body Fat Log (manual entry, method chips, history)
- location: Progress > Goals > "📐 Body Fat Log" button → BF log screen
- user action: types a percentage, picks a method chip, taps LOG ENTRY; back to return
- behaviour: 1. List-view button opens the screen and clears `bfAiText` (`:28310-28312`); its label appends "— current: N%" when entries exist (`:28309`). 2. Input sanitises to `[0-9.]` (`:27310-27312`). 3. Method chips: Manual, Calipers, DEXA, Scale, Visual — stored lowercased (`:27350-27377`). 4. LOG ENTRY disabled while the input is empty (`:27379-27394`). 5. `logBf()` parses the input and rejects non-finite, ≤0, or >75 with a toast "Enter a body fat percentage between 1 and 75." (`:27169-27186`). 6. Valid values go to `addBfEntry(pct, method)` which appends `{pct, method, date: isoDay()}`, sorts by date ascending, and writes `lk_bfLog` (`:26979-26991`). 7. State updated, input cleared, `logBetaActivity("bf_logged", {pct, method})` (`:27181-27185`). 8. History renders newest-first with pct, date, and a method pill; empty state "No body fat entries yet." (`:27419-27427`).
- v6 status: WORKING

### F-GOAL-007 — AI body fat estimate
- location: Progress > Goals > Body Fat Log > "AI Body Fat Estimate"
- user action: taps the button
- behaviour: 1. `getAiBfEstimate()` early-returns if `bfAiLoading` (`:27191`), then sets loading true. 2. Gathers last weight-log entry, the last 5 `lk_progressPhotos` notes with dates, and the last 5 bf log entries (`:27193-27201`). 3. System prompt: "You are a fitness coach estimating body fat percentage. Be practical and give a specific number range. Do not hedge excessively." (`:27202`). 4. User prompt includes displayName, sex (default "male"), age, weight in kg, height in cm, goal, previous BF logs, and photo notes; asks for a 2–3 sentence range estimate (`:27203`). 5. `aiCall` → success sets `bfAiText`; failure sets "Unable to estimate. Try logging more data points." (`:27204-27211`). 6. Button shows " Estimating…" and is `disabled` while loading (`:27395-27410`); a separate "Analysing..." line renders below (`:27411`).
- v6 status: WORKING

### F-GOAL-008 — Beta activity telemetry from Goals
- location: Progress > Goals (background)
- user action: 
- behaviour: `logBetaActivity` fires on `goal_create`/`goal_edit` (`:27139-27143`), `goal_deleted` (`:27156-27158`), and `bf_logged` (`:27182-27185`).
- v6 status: WORKING
