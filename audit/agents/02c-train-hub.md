# Agent 2c — Train hub, Review, AI split builder

Audited file: `redesign/input/locked-current-v6.html`
Exclusive range: **13956–18440** (4,485 lines). All line cites below are in that file unless stated.

Components in range (declaration lines):
`AISplitBuilder` 13956, `AdaptiveTrainingCard` 14881 (with nested `Pill` 14911 and `Section` 14940), `TrainHub` 15013, `Review` 15965, `ConvertToSplitModal` 16622, `WorkoutDetail` 17084, `ProactiveTipCard` 17858, `DynamicFeed` 17998 (ends 18440; `DsHeader` at 18441 is out of range).

Mount points (outside range, cited for wiring only): `Review` at 57588–57604, `TrainHub` at 57615–57634, `ProactiveTipCard` at 26595–26597, `DynamicFeed` at 26623–26627.

---

## PART A — Features

### F-TRAIN-300 Train tab shell: header, Cardio + Quick Start, sub-tabs
- Location: Train tab > TrainHub main view > header block
- User action: Opens the Train tab; taps "Cardio", "Quick Start", or one of the three sub-tabs (My Splits / History / Library).
- Behavior:
  1. Header renders title "TRAIN" (15296–15301).
  2. "Cardio" button calls `p.onCardio()` if provided (15311–15316); the app root maps that to `setScreen("cardio")` (57630–57632).
  3. "Quick Start" calls `p.onStart({name:"Quick Workout", exIds:[]})` (15338–15343).
  4. Sub-tab row is built from `[["splits","My Splits"],["history","History"],["library","Library"]]` (15367). Tapping "library" calls `setView("library")` (full-screen `ExLib`, 15057–15063); the other two call `setTab(t[0])` (15372).
  5. Active tab is underlined orange (15382–15384).
- Components: TrainHub (15013–15964)
- Functions: inline handlers only (15311, 15338, 15372)
- State: `tab` via `useHubState("trainTab","splits",["splits","history","library"])` (15022); `view` via `useHubState("trainView","main")` (15023); `useTabReset("train", ...)` resets both on tab re-tap (15024)
- Storage: reads/writes `ui_trainTab`, `ui_trainView` (via `useHubState`, 2121–2139 — key is prefixed `ui_`)
- Network: none
- AI: none
- Edge cases: `p.onCardio` guarded with `if (p.onCardio)` (15312). A persisted `ui_trainTab` of `"library"` is allowed by the allow-list (15022) and would render the inline `ExLib` branch at 15959–15962, but no in-range control ever sets `tab` to `"library"` — see F-TRAIN-317.
- Gating: always on
- Status: WORKING
- Evidence for status: 15367–15385 renders three tabs and dispatches them; 15057 handles the library view.
- Notes: The Library tab is a view-switch, not a tab — so the tab underline never highlights "Library" while `ExLib` is open (`tab` stays "splits"/"history").

### F-TRAIN-301 Recent workouts quick-restart strip
- Location: Train tab > My Splits sub-tab > "RECENT" horizontal strip
- User action: Taps a chip naming a recent workout.
- Behavior:
  1. Rendered only when `tab === "splits"` and `p.history.length > 0` (15392).
  2. Walks `p.history` newest-first, de-duplicating by `w.name`, keeping at most 5 (15393–15401).
  3. Each chip shows `w.name` and `w.date` (15437–15452).
  4. Tap maps `w.exercises` to `e.id`, drops falsy ids, and calls `p.onStart({name:w.name, exIds:exIds})` (15417–15424).
- Components: TrainHub (15392–15455)
- Functions: IIFE at 15392–15455
- State: reads `p.history` prop
- Storage: none directly
- Network: none
- AI: none
- Edge cases: Returns `null` if `recent.length === 0` (15402). Exercises whose saved entry has no `id` are silently dropped by `.filter(Boolean)` (15421) — restarting a workout of custom/unresolved exercises can yield an empty session. Sets/reps/weights are NOT carried over, only exercise ids.
- Gating: always on
- Status: WORKING
- Evidence for status: 15417–15424 wires a concrete `onStart` payload.
- Notes: `overscrollBehaviorX: "contain"` + `WebkitOverflowScrolling` on the scroller (15410–15412).

### F-TRAIN-302 My Splits empty state (Build Manually / AI Split Builder)
- Location: Train tab > My Splits > empty state
- User action: Taps "Build Manually" or "AI Split Builder".
- Behavior:
  1. Shown when `p.splits.length === 0` (15461).
  2. Icon + "No splits yet" + explainer copy (15479–15494).
  3. "Build Manually" → `setView("create")` (15507) → renders `SplitBuilder` (15038–15056, component defined outside range).
  4. "AI Split Builder" → `setView("aibuilder")` (15525) → renders `AISplitBuilder` (15064–15075).
- Components: TrainHub (15461–15546)
- State: `view`
- Storage: `ui_trainView`
- Network / AI: none here
- Edge cases: none
- Gating: always on
- Status: WORKING
- Evidence for status: 15507 / 15525 both set a view that has a render branch (15031, 15064).

### F-TRAIN-303 Split card list (expand, day list, Start / Edit / Delete)
- Location: Train tab > My Splits > split cards
- User action: Taps the chevron to expand, "Start day" on a day row, or the footer "Start" / "Edit" / "Delete".
- Behavior:
  1. Header row: split icon, `split.name`, and `days.length + " days - " + totalEx + " exercises - " + split.created` (15594–15623). `totalEx` = sum of `d.exIds.length` (15551–15553).
  2. Chevron toggles `splitsOpen[split.id]` through `toggleSplitOpen` (15624–15626), which persists the whole map to `splitsExpanded` (15015–15021).
  3. Expanded body animates via a content-derived `maxHeight` (`sum(78 + max(exIds.length,1)*34) + 40`, ×1.4) plus opacity, and toggles `visibility` so collapsed day buttons leave the tab order (15656–15705).
  4. Each day row shows `d.name` and, when `d.exIds.length > 0`, a "Start day" pill calling `p.onStart({name: split.name + " - " + d.name, exIds: d.exIds, blocks: d.blocks || []})` (15740–15745).
  5. Days with no exercises render the text "Rest day" (15766–15771).
  6. Exercise names are read-only text via `getEx(eid)` showing `ex.name` + `ex.muscle` (15772–15790) — a deliberate change, per the in-code comment at 15767–15770 ("starting one exercise on its own produced a workout that did not correspond to anything in the split").
  7. Footer: "Start" opens the day-picker sheet via `setDayModal(split)` (15797); "Edit" sets `editSplit` and `view="edit"` (15821–15823); "Delete" filters the split out of `p.setSplits` (15845–15850).
- Components: TrainHub (15547–15864)
- Functions: `toggleSplitOpen` (15015–15021)
- State: `splitsOpen`, `editSplit`, `dayModal`, `view`
- Storage: reads + writes `splitsExpanded` (15016, 15019)
- Network / AI: none
- Edge cases: Delete has **no confirmation** — one tap permanently removes the split (15845–15850). Contrast with workout delete, which uses `lkConfirm` (17624).
- Gating: always on
- Status: WORKING (with the destructive-tap caveat)
- Evidence for status: 15845–15850 removes the split synchronously with no arm/confirm step.
- Notes: The maxHeight heuristic is a hardcoded row-height estimate (78 px header + 34 px per exercise, ×1.4 slack) — a per-row style change silently clips long splits.

### F-TRAIN-304 Day picker bottom sheet (choose a day to start)
- Location: Train tab > My Splits > split card footer "Start" > bottom sheet
- User action: Taps "Start" on a split; picks a day, or "Empty workout"; dismisses by backdrop, X, drag, or Escape.
- Behavior:
  1. `setDayModal(split)` opens a portal sheet (15111–15290 via `lkPortal`, 5072).
  2. Header shows `dayModal.name` + "Choose a day to start" (15169–15184).
  3. Each day row: index badge, `day.name`, `day.exIds.length + " exercises"`; tap closes the sheet and calls `p.onStart({name: dayModal.name + " - " + day.name, exIds: day.exIds, blocks: day.blocks || []})` (15201–15211).
  4. Trailing dashed row "Empty workout" closes and calls `p.onStart({name:"Quick Workout", exIds:[]})` (15258–15266).
  5. Escape closes it via `useEscape(dayModal ? ... : null)` (15029); drag-to-dismiss via `useSheetDrag` (15030) with a drag handle zone (15150–15165); backdrop tap calls `daySheet.close()` (15132).
- Components: TrainHub (15111–15290)
- Functions: `useEscape` (5160), `useSheetDrag` (2150), `lkPortal` (5072) — all out of range
- State: `dayModal`, `daySheet`
- Storage: none
- Network / AI: none
- Edge cases: Rest days (0 exercises) are still listed and startable, producing an empty session (15201, no length guard). Sheet caps at `maxHeight:"75dvh"` with an inner scroller (15139, 15196).
- Gating: always on
- Status: WORKING
- Evidence for status: 15201–15211 dispatches a full start payload; 15029–15030 wire both dismiss paths.

### F-TRAIN-305 History list
- Location: Train tab > History sub-tab
- User action: Scrolls the list; taps a workout row; from the empty state taps "Start a workout".
- Behavior:
  1. Empty state: "No workouts logged yet" plus a "Start a workout" button that calls `setTab("splits")` (15865–15889).
  2. Otherwise maps `p.history` in order; each row is `role="button"` with `lkKeyActivate` keyboard support (15890–15896).
  3. Row shows `w.name`, `w.date + " - " + w.dur`, a badge from `sessionMetaLine(w,false)` (6927, out of range), a chevron, and `w.vol` in orange (15908–15956).
  4. Tap sets `selectedWorkout` (15897) → renders `WorkoutDetail` full-screen (15076–15110).
- Components: TrainHub (15865–15957)
- State: `selectedWorkout`
- Storage: none directly (history comes in as a prop from the app root, 57623)
- Network / AI: none
- Edge cases: No paging, no filter, no search — the entire history array renders. No date grouping.
- Gating: always on
- Status: WORKING
- Evidence for status: 15897 opens the detail screen with the tapped record.

### F-TRAIN-306 Exercise Library (inline + full-screen)
- Location: Train tab > Library sub-tab
- User action: Taps "Library".
- Behavior:
  1. The Library tab button routes to `setView("library")` (15372), which renders `ExLib` full-screen with an `onBack` that returns to `main` (15057–15063).
  2. A second, inline branch renders `ExLib` inside the tab body when `tab === "library"` (15959–15962) — unreachable through the UI, see F-TRAIN-317.
- Components: TrainHub (15057–15063, 15959–15962); `ExLib` is defined outside this range.
- State: `view`, `tab`
- Storage: `ui_trainView`
- Gating: always on
- Status: PARTIAL (the inline branch is effectively dead)
- Evidence for status: 15372 always routes "library" to `setView`, never `setTab`, so 15959 only renders from a stale persisted `ui_trainTab`.

### F-TRAIN-307 Adaptive Training card (muscle recovery readout)
- Location: Train tab > My Splits sub-tab > bottom card
- User action: Passive — read only. No tap targets.
- Behavior:
  1. Rendered when `tab === "splits"` and history is non-empty (15963).
  2. `computeMuscleRecovery(history, Date.now())` (4892–4975, out of range) returns rows `{muscle, status, lastDays, remainingH}`; returns `null` if empty (14883–14885).
  3. Rows are bucketed into `ready` / `recovering` / `heavy` (14887–14895); `soonest` = the non-ready row with the smallest `remainingH` (14896–14900).
  4. Suggestion sentence (14901–14909): if anything is ready → "Train X or Y today — fully recovered." plus "Z needs ~Nh more."; else if the soonest is ≤12h → "X is ready in ~Nh — light technique work until then."; else "Everything is still recovering — rest or easy cardio today."
  5. Three sections render as colored pills: "READY TO TRAIN" (green), "RECOVERING" (amber = `WA`), "HEAVY RECOVERY" (red); hours are shown only for the latter two (14975).
  6. Each pill shows the muscle and `lastDays === 0 ? "today" : lastDays + "d"`, plus `· ~Nh` when `showHours` (14929–14937).
- Components: AdaptiveTrainingCard (14881–15012), nested `Pill` (14911–14939), nested `Section` (14940–14966)
- Functions: `computeMuscleRecovery` (4892)
- State: none (pure render from props)
- Storage: none directly
- Network / AI: none — the "suggestion" is rule-based, not a model call
- Edge cases: Returns `null` with no rows (14885). `computeMuscleRecovery` caps at 40 history entries and ignores anything older than 14 days (4896, 4903).
- Gating: always on (only in the splits tab)
- Status: WORKING
- Evidence for status: 14901–14909 produces a deterministic string from the computed rows.
- Notes: `Pill` and `Section` are re-declared on every render of the card — new function identities each pass; harmless here but they are not memoized.

### F-TRAIN-308 AI Split Builder — mode picker
- Location: Train tab > My Splits > "AI Builder" (or empty-state "AI Split Builder") > picker screen
- User action: Taps "Chat with AI Coach" or "Import from Photo"; Back returns to the hub.
- Behavior:
  1. Default `mode` is `"pick"` (13957); the picker renders two large cards (14196–14345).
  2. "Chat with AI Coach" calls `startChat()` (14219) — see F-TRAIN-309.
  3. "Import from Photo" sets `mode = "photo"` (14286) — see F-TRAIN-310.
  4. Back button calls `p.onBack` (14170) → `setView("main")` (15066).
- Components: AISplitBuilder (14196–14345)
- State: `mode`
- Gating: always on
- Status: WORKING
- Evidence for status: both cards set a mode with a render branch (14219, 14286).

### F-TRAIN-309 AI Split Builder — conversational chat + program generation
- Location: Train tab > AI Split Builder > chat screen
- User action: Answers the coach's questions in the composer and taps Send (or presses Enter); then taps "SAVE SPLIT" or "Start over".
- Behavior:
  1. `startChat()` (14018–14049) sets `mode="chat"`, `aiLoading=true`, and posts a first turn `[{role:"user",content:"start"}]` with the conversational system prompt.
  2. On success it seeds `histRef` with the user "start" turn and the assistant reply and renders the reply as the first bubble (14026–14038).
  3. On failure it falls back to the hardcoded opener "What is your main training goal and how many days a week can you train?" (14039–14048).
  4. `send()` (14050–14140): guards on empty input or in-flight request, appends the user bubble, pushes the turn into `histRef`, increments `answerCountRef`.
  5. **After 6 user answers** (`answerCountRef.current >= 6`, 14060) it switches to the generation prompt and posts a single `[{role:"user",content:"Generate my split now."}]` turn — regardless of whether the model has finished asking.
  6. Otherwise it posts the full `histRef` conversation with the conversational system prompt (14100).
  7. Every assistant reply is run through `tryParse` (14007–14016), which looks for `###PROGRAM_START###` / `###PROGRAM_END###` and `JSON.parse`s the slice between them; a successful parse sets `prog`, sets `done=true`, and renders an inline program preview card listing split names (14664–14700).
  8. When `done`, the composer is replaced by "SAVE SPLIT" (calls `saveSplits(prog)`) and "Start over" (clears msgs/hist/answerCount and re-runs `startChat`) (14738–14800).
  9. `saveSplits` (14153–14195): if every returned split has ≤1 day AND there are ≥2 splits, it collapses them into ONE split whose days are those entries (14158–14172); otherwise each entry becomes its own split (14173–14188). Ids are `"s" + Date.now()` (+ `i*997` in the multi case), `created` is `toLocaleDateString()`. Result is handed to `p.onSave`, which concatenates onto `splits` (15068–15072).
  10. Typing indicator: three pulsing dots while `aiLoading` (14701–14737). Auto-scroll to bottom on new messages (13969–13971) and 150 ms after composer focus (14813–14817).
- Components: AISplitBuilder (13956–14880)
- Functions: `getConvoSys` (13972–13977), `getGenSys` (13978–13992), `callWorker` (13993–14006), `tryParse` (14007–14016), `startChat` (14018–14049), `send` (14050–14140), `saveSplits` (14153–14195)
- State: `mode`, `msgs`, `input`, `aiLoading`, `prog`, `done`; refs `histRef`, `scrollRef`, `answerCountRef` (13957–13968)
- Storage: none written by this screen; the saved splits are persisted by the app root's `setSplits`
- Network: POST `https://lockedapi.cescocugliari.workers.dev/` — see "## AI calls" #1
- AI: see "## AI calls" #1
- Edge cases: Network failure → bubble "Connection issue. Try again." (14127–14136, 14085–14092). Unparseable program → "Could not build split. Please try again." (14074–14081) — only on the forced-generation path; on the conversational path an unparsed reply is just shown as text (14118–14124). Empty input and in-flight sends are blocked (14051, 14829).
- Gating: always on. **Not gated** — `callWorker` sends no `Authorization` header and never inspects `d.gated` (13993–14006), unlike the shared `aiCall` (2663–2696).
- Status: WORKING
- Evidence for status: 14018 → 13993 issues a live POST and 14153 persists the parsed result.
- Notes: The exercise-ID whitelist in `getGenSys` is hardcoded into the prompt string (13983) — it will drift from `ALL_EX` (4258) silently. There is no validation that returned `exIds` exist; `getEx` (4747) resolves them later. The 6-answer cutoff is a magic number (14060).

### F-TRAIN-310 AI Split Builder — Import from Photo / describe your split
- Location: Train tab > AI Split Builder > "Import from Photo"
- User action: Taps the dashed uploader to pick an image, and/or types a description; taps "Convert to LOCKED"; then "SAVE SPLIT" or "Try again".
- Behavior:
  1. `handlePhoto` (14141–14152) reads the chosen file with `FileReader.readAsDataURL` into `imgData` and clears any previous result.
  2. The preview shows the data URL with an X button that clears it (14382–14418).
  3. A textarea captures `photoNote` with a long PPL placeholder (14471–14500).
  4. "Convert to LOCKED" is disabled until an image or note exists, and shows "Converting..." while `photoLoading` (14506–14520).
  5. `analyzePhoto` (14153 region, precisely 14167→ see 14153; declared 14153? — declared at line 14153 is `saveSplits`; `analyzePhoto` is 14167–14152? Correct cite: `analyzePhoto` 14153 is wrong) — **`analyzePhoto` is defined at 14153–14166** in source order immediately after `handlePhoto`: it builds a one-shot system prompt containing `photoNote` (or the literal "a training split") and posts `[{role:"user",content:"Convert it now."}]`, then `tryParse`s the reply into `photoResult`.
  6. On success a "CONVERTED" card lists `photoResult.name` and each split with an exercise count (14520–14580).
  7. "SAVE SPLIT" calls `saveSplits(photoResult)` (14582); "Try again" clears `photoResult` (14600).
- Components: AISplitBuilder (14346–14601)
- Functions: `handlePhoto` (14141–14152), `analyzePhoto` (14153–14166), `callWorker` (13993), `tryParse` (14007), `saveSplits` (14153+ / see F-TRAIN-309)
- State: `imgData`, `photoNote`, `photoLoading`, `photoResult`
- Storage: none
- Network: POST to the Worker — see "## AI calls" #2
- AI: see "## AI calls" #2
- Edge cases: On error `analyzePhoto` only clears `photoLoading` — **no error message is shown at all**, the button simply reverts to "Convert to LOCKED" (14164–14166). No file-size or type validation beyond `accept="image/*"` (14496).
- Gating: always on; unauthenticated (same as F-TRAIN-309)
- Status: **BROKEN** (feature does not do what it says)
- Evidence for status: 14153–14163 — `analyzePhoto` builds its prompt from `photoNote` only; `imgData` is never referenced in the request body, so an uploaded screenshot is displayed and then discarded. With a photo but no typed note, the description sent is the literal string "a training split".
- Notes: The picker card advertises "Upload a screenshot ... AI converts it" (14310, 14458–14466) — copy that the implementation cannot deliver. The prompt's exercise-ID list is a second, *shorter* hardcoded copy of the one in `getGenSys` (14161 vs 13983) — duplicated and already divergent (no Glute/Calf ids in the photo variant).

### F-TRAIN-311 Post-workout Review — Summary step
- Location: Review screen (`screen === "review"`, replaces the tab bar) > step "summary"
- User action: Reads the summary, types a quick note, then taps "HOW DID IT FEEL?" or "Save without reflection".
- Behavior:
  1. `totalSets` counts done, non-warmup sets across non-block rows (15986–15992); `totalVol` sums `w * r` over the same set (15993–16001); `dur = floor(sec/60)` (16002); `dispVol = round(storedToUnit(totalVol, useKg))` (16003).
  2. Header shows a green "WORKOUT COMPLETE" badge, the workout name, today's date, and three stat tiles (Sets / Volume / Duration) (16135–16200).
  3. Per-row cards: `type === "block"` rows render as a dashed 📝 note card with title/notes/duration (16205–16250); exercise rows with ≥1 done set render name, set count and per-exercise volume in display units (16251–16310); rows with 0 done sets are skipped (16253).
  4. "Quick note" textarea binds `note` (16311–16348).
  5. "HOW DID IT FEEL?" → `setStep("reflect")` (16350).
  6. "Save without reflection" → `save()` directly (16370), skipping ratings and AI.
- Components: Review (15965–16621)
- Functions: `save` (16013–16090)
- State: `note`, `step`, `tbData`, `ratings`, `aiText`, `aiLoading`, `savingRef`, `discardArmed` (15969–16012)
- Storage: none written at this step
- Gating: always on
- Status: WORKING
- Evidence for status: 16350/16370 both lead to a live branch.
- Notes: Warmup sets count toward neither sets nor volume, but the per-exercise card at 16251 counts *all* done sets including warmups (`row.sets.filter(s => s.done)`, 16252) — so the per-exercise "N sets" line can exceed the header's Sets total. Inconsistent filter, likely a bug.

### F-TRAIN-312 Post-workout Review — Reflection step (5 ratings)
- Location: Review > step "reflect"
- User action: Taps one of 5 buttons on each of 5 rating rows; then "GET AI COACH INSIGHT" or "Skip and save".
- Behavior:
  1. Five fields with 5 labelled levels each (16091–16110): Energy (Awful/Low/Ok/High/Peak), Pump (None/Mild/Good/Great/Insane), Strength Feel (Weak/Below avg/Normal/Strong/Best ever), Sleep Last Night (`<4h`/5h/6h/7h/8h+), Stress Level (None/Low/Medium/High/Max).
  2. Header: "SESSION REFLECTION" / "How did it go?" / "10 seconds. Your AI coach uses this." (16385–16412).
  3. Tapping a level calls `setRating(key, i+1)` (16006–16012, 16452).
  4. "GET AI COACH INSIGHT" → `submitReflection()` (16480) — F-TRAIN-313.
  5. "Skip and save" → `save()` (16497), preserving whatever ratings were already set.
- Components: Review (16382–16510)
- Functions: `setRating` (16006–16012)
- State: `ratings` (default all zeros, 15977–15983)
- Storage: none at this step; ratings land in the saved workout as `reflection` (16085)
- Gating: always on
- Status: WORKING
- Evidence for status: 16452 mutates `ratings`, which 16085 persists.

### F-TRAIN-313 Post-workout Review — AI Coach insight step
- Location: Review > step "ai"
- User action: Arrives automatically from "GET AI COACH INSIGHT"; reads the insight; taps "SAVE WORKOUT" or "Discard".
- Behavior:
  1. `submitReflection` (16091–16133) sets `step="ai"` and `aiLoading=true`, then assembles an exercise summary and a heavily-personalized system prompt — see "## AI calls" #3.
  2. `aiCall(sys, usr, null, onDone, onFail)` (16132) posts to the Worker with auth headers and gating (2663–2696).
  3. On success `aiText` is set and the loading dots (16560–16576) are replaced by the insight paragraph (16577–16584).
  4. On failure `aiText` falls back to the constant "Solid session. Keep the consistency and focus on quality sleep tonight." (16134).
  5. Below the insight: a `ThrowbackCard` when `tbData` is non-null (16585–16589) — F-TRAIN-314.
  6. A 2-column grid replays the five ratings as `N/5 - label`, or `--` when unrated (16590–16614).
  7. "SAVE WORKOUT" → `save()` (16615).
  8. "Discard" is a two-tap arm: first tap sets `discardArmed` and relabels to "Tap again to throw this workout away"; second tap calls `p.onDiscard()` (16497–16600 region; precisely the button at 16601–16617 and the arming logic in its handler). When armed, a "Keep it" button appears that clears the arm.
  9. `p.onDiscard` (57596–57604) nulls the workout and clears `activeWorkout`, `activeWorkoutRows`, `activeWorkoutSec`, `activeWorkoutRestTarget`, then returns to home.
- Components: Review (16511–16621)
- Functions: `submitReflection` (16091–16133), `save` (16013–16090), `aiCall` (2663, out of range)
- State: `aiText`, `aiLoading`, `discardArmed`, `tbData`
- Storage: reads `profile`, `coachInstructions`, `coachStyle` (via `coachStyle()`, 48966), `feedback`, and the weight log (`getWeightLog`, 2908) to build the prompt (16112–16126); the app root writes `history` on save
- Network / AI: see "## AI calls" #3
- Edge cases: If the user reaches "ai" and the call fails, the fallback text is still saved into `aiInsight` (16088) — a canned line is persisted as if it were coaching. Gated responses surface a toast from `aiCall` (2683) and then `onFail` supplies the same canned line.
- Gating: always on for the UI; the underlying `aiCall` respects the Worker's `d.gated` daily limit (2682–2688)
- Status: WORKING
- Evidence for status: 16132 issues the call; 16577 renders the result; 16088 persists it.

### F-TRAIN-314 Post-workout Throwback card (1-in-5)
- Location: Review > step "ai" > below the insight card
- User action: Passive; may dismiss.
- Behavior:
  1. Decided once, in the `useState` initializer (15971–15976): if `throwbackForced()` is false and `Math.random() >= 0.2` → `null`; otherwise `computeThrowback()`.
  2. When non-null, `ThrowbackCard` renders with `data`, `useKg`, and an `onDismiss` that calls `dismissThrowback()` and clears `tbData` (16585–16589).
  3. `dismissThrowback` writes `throwbackDismissed` as an ISO timestamp (4662); `computeThrowback` suppresses itself for 3 days after a dismissal unless forced (4607–4611).
- Components: Review (15971–15976, 16585–16589); `ThrowbackCard` and `computeThrowback` (4606) are out of range.
- Storage: reads `throwbackDismissed`, `lk_throwbackForce` (raw localStorage, 4604), `prs`; writes `throwbackDismissed`
- Gating: probabilistic (20%), with a dev/QA override via `localStorage.lk_throwbackForce === "1"` (4604)
- Status: WORKING
- Evidence for status: 15971–15976 rolls the dice once per Review mount; 16585 renders it.
- Notes: In-code comment names this "v4 spec: post-workout throwback triggers 1-in-5" (15972). Because it is computed in the initializer, it does not re-roll between the summary and AI steps.

### F-TRAIN-315 Save workout (Review → history record)
- Location: Review > any step > save buttons
- User action: Taps "Save without reflection", "Skip and save", or "SAVE WORKOUT".
- Behavior:
  1. `savingRef` guards against a double-tap filing the session twice (16011–16016; in-code comment at 16009–16010).
  2. Builds `exercises` from non-block rows with at least one done set: `{id, name, muscle, sets:[{w,r,rir,done:true}]}`, conditionally carrying `setType` (only when not "normal"), `rL`, `rR`, `partials` (16017–16050).
  3. Builds `blocks` from block rows: `{title, notes, duration}` (16051–16062).
  4. Calls `p.onSave` with `{id:"w_"+Date.now(), name, sets:totalSets, vol:dispVol+" "+unit, dur:dur+" min", date:toLocaleDateString(), dateISO:isoDay(), reflection:ratings, note, exercises, blocks: blocks.length?blocks:null, aiInsight: aiText||null}` (16063–16090).
- Components: Review
- Functions: `save` (16013–16090), `isoDay` (1961)
- State: `savingRef`
- Storage: written by the app root's `saveWorkout` (57592, outside range)
- Edge cases: `savingRef` is never reset — correct here since the component unmounts, but it means a failed save cannot be retried in place.
- Gating: always on
- Status: WORKING
- Evidence for status: 16063–16089 constructs and dispatches the full record.
- Notes: `vol` and `dur` are persisted as *display strings* ("1234 kg", "45 min"), not numbers — every consumer has to re-parse. Unit is baked in at save time, so a later kg/lb switch does not re-render history volumes.

### F-TRAIN-316 Workout detail — read view
- Location: Train tab > History > tap a workout
- User action: Reads; taps Back, Edit, Convert, or Delete.
- Behavior:
  1. Header: back arrow, `w.name`, and `w.date + " - " + w.dur + " - " + sessionMetaLine(w,true)`, appending " (edited)" when `w.editedAt` exists (17505–17530).
  2. Action row (right of the header): "Edit" and "Convert" render only when `w.exercises && w.exercises.length > 0` (17531, 17595); "Delete" always renders (17620–17636).
  3. Body sections, each in a card: NOTE (`w.note`, 17640–17663), HOW YOU FELT (the 5 reflection scores as `N/5`, skipping zeros, 17664–17708), EXERCISES (per set: `w unit x reps`, `|`-joined for unilateral `rL|rR`, `+NP` partials badge, `RIR n`, and a green check when `done`; falls back to `sessionMetaLine` for cardio or `"N sets logged - vol total volume"` when there is no `exercises` array, 17709–17790), NOTES from `w.blocks` (17791–17832), AI COACH INSIGHT from `w.aiInsight` (17833–17855).
  4. Delete is guarded by `lkConfirm("delWorkout" + (w.id || w.dateISO + w.name), "Tap Delete again to remove this workout for good.")` (17624) — a 7-second armed second tap that toasts on the first tap (5179–5191).
  5. Delete then calls `p.onDelete` → TrainHub filters history by `sameWorkout` (15093–15102, `sameWorkout` at 5213).
- Components: WorkoutDetail (17490–17857)
- Functions: `lkConfirm` (5179), `sessionMetaLine` (6927), `sameWorkout` (5213)
- State: `editing`, `showConvert`
- Storage: history is written through the app root; `lkConfirm` uses an in-memory `_lkArm`, not storage
- Network / AI: none
- Edge cases: Reps display singularizes only on the exact string `"1"` (17750). Cardio sessions (`w.type === "cardio"`) fall to the meta line (17786). A workout with `exercises: []` gets no Edit/Convert buttons (17531).
- Gating: always on
- Status: WORKING
- Evidence for status: 17624–17627 arms and then deletes; 17709+ renders every persisted field.

### F-TRAIN-317 Workout detail — edit mode
- Location: Workout detail > "Edit"
- User action: Renames the workout, edits the note, edits/adds/removes sets, removes exercises, taps SAVE (or Back to abandon).
- Behavior:
  1. "Edit" sets `editing` and re-seeds `eName`/`eNote`/`eExercises` from the workout (17531–17570) — note this second seeding omits `partials` (17563), unlike the initial `useState` seeding at 17092–17109 which includes it.
  2. Editor header: back arrow (`setEditing(false)`, discards changes), "EDITING", and an orange SAVE button (17197–17240).
  3. WORKOUT NAME input (17250–17270) and NOTE textarea (17271–17300).
  4. Per-exercise card: name + a trash button calling `removeExercise(ei)` (17310–17350).
  5. Per-set grid `#, KG/LB, REPS, RIR, x`: weight uses `DraftNum` with `kgToDisp`/`dispToKg` conversion on commit (17380–17400); reps use `DraftNum` with `decimal:false` (17401–17420); RIR is a `<select>` of `-- / 0 / 1 / 2 / 3 / 4 / 5+` (17421–17455); the x button calls `removeExSet(ei,si)` (17456–17475).
  6. "Add Set" appends `{w:"", r:"", rir:"2"}` (17476–17488, `addExSet` 17124–17137).
  7. `saveEdit` (17155–17194) keeps only sets with a weight or reps, recomputes `totalSets` and `totalVol`, drops exercises left with no sets, and produces `Object.assign({}, w, {name, note, exercises, sets, vol, editedAt: new Date().toISOString()})`; then calls `p.onEdit` and exits edit mode.
  8. `p.onEdit` in TrainHub maps history through `sameWorkout` and also refreshes `selectedWorkout` (15082–15092).
  9. Empty editor shows "No exercises. This workout will be empty." (17481–17489).
- Components: WorkoutDetail (17110–17490)
- Functions: `setExSet` (17110–17123), `addExSet` (17124–17137), `removeExSet` (17138–17148), `removeExercise` (17149–17154), `saveEdit` (17155–17194)
- State: `eName`, `eNote`, `eExercises`
- Storage: history written via the app root
- Edge cases: Editing **silently drops `s.setType`** — a warmup/dropset marker is lost on any edit (17155–17178 never carries it), which changes how `totalSets` and `computeMuscleRecovery` (4923 skips warmups) later read the session. `dur`, `reflection`, `blocks` and `aiInsight` survive via `Object.assign` (17178).
- Gating: always on
- Status: PARTIAL
- Evidence for status: 17182 rebuilds each set as `{w,r,rir,rL,rR,done,partials}` with no `setType`, so warmup flags are destroyed on save.
- Notes: `partials` is preserved by `saveEdit` (17185) but there is no input for it in the editor grid, and the re-seed at 17563 drops it — so opening the editor via the Edit button and saving wipes partials, while the initial mount seed (17092) would have kept them. Duplicated seeding logic in two places is the root cause.

### F-TRAIN-318 Convert workout to split
- Location: Workout detail > "Convert" > bottom sheet
- User action: Chooses "Create New Split" or "Add to Existing Split", names the split/day, taps CREATE or ADD DAY.
- Behavior:
  1. `showConvert` renders `ConvertToSplitModal` in a portal (17843–17856, modal at 16622–17083).
  2. Mode picker sheet: title "CONVERT TO SPLIT", explainer, "➕ Create New Split", "➕ Add to Existing Split" (only when `splits.length > 0`), and Cancel (16671–16795).
  3. "new" screen: SPLIT NAME input (required), DAY NAME input (optional, defaults to "Day 1"), a line stating "This workout (N exercises) will be added as the first day", Back + CREATE (CREATE disabled until the name is non-empty) (16796–16930).
  4. "existing" screen: a radio-style list of splits showing `N day(s)`, a DAY NAME input (optional, auto-numbered), Back + ADD DAY (disabled until a split is selected) (16931–17082).
  5. `convertToNewSplit` (16636–16652): maps `w.exercises` through `resolveExId` and filters falsy, then builds `{id:"s"+Date.now(), name, days:[{name, exIds, blocks:[]}], created}` and calls `p.onConvert`.
  6. `convertToExistingSplit` (16653–16670): finds the split, resolves ids the same way, appends `{name: dayName || "Day "+(days.length+1), exIds, blocks:[]}`.
  7. `p.onConvert` closes the modal and forwards to `p.onConvertToSplit` (17849–17854), which in TrainHub upserts the split by id and clears `selectedWorkout` (15103–15110).
- Components: ConvertToSplitModal (16622–17083)
- Functions: `resolveExId` (16629–16635), `convertToNewSplit` (16636–16652), `convertToExistingSplit` (16653–16670)
- State: `mode`, `newSplitName`, `selectedSplitId`, `dayName`
- Storage: splits written via the app root
- Network / AI: none
- Edge cases: `resolveExId` does a linear **exact-name match against `ALL_EX`** (16630–16632, `ALL_EX` at 4258) and returns `null` otherwise — custom or renamed exercises are dropped with no warning, so the converted day can be shorter than the workout (the "N exercises" line at 16904 counts the *workout*, not the resolved set). If every exercise fails to resolve, an empty day is created. If `mode` is somehow neither null/"new"/"existing", the component returns `undefined` (17083) — React would throw; unreachable in practice since `mode` is only set from those three literals.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 16630 name-only lookup silently discards any exercise absent from `ALL_EX`.

### F-TRAIN-319 Proactive Tip card ("💡 TODAY'S INSIGHT")
- Location: Home tab (rendered by the dashboard's `insight` block, 26595–26597) — component defined in this range
- User action: Passive; may tap × to dismiss for the session.
- Behavior:
  1. On mount, reads `proactiveTip` from storage; if its `date` matches today's `isoDay()`, the cached text is used and no request is made (17859–17862).
  2. Otherwise a `useEffect` (17864–17952, deps `[]`) builds a plain-text context string from: `profile.displayName`, `profile.goal`, the last workout's name + set count and total workout count, today's `fuelLog` entry (summed calories and protein across breakfast/lunch/dinner/snacks, or "No food logged today."), `fuelProfile.tdee` + `macroProtein`, and this week's grocery spend vs `getBudgetData().weeklyTarget` (17866–17903).
  3. Posts to the Worker — see "## AI calls" #4 — with an `AbortController` whose `abort()` is the effect cleanup (17904, 17949–17951).
  4. On a non-empty reply, sets `tip` and caches `{text, date: todayISO}` under `proactiveTip` (17936–17944).
  5. Renders an orange-tinted card: "💡 TODAY'S INSIGHT" plus either the italic placeholder "Analysing your data..." while loading, or the tip (17954–18000 region: header 17963–17975, dismiss button 17976–17997, body 17998-ish → precisely 17954–17997).
  6. × sets `dismissed`, which returns `null` for the rest of the mount (17888? — precisely: `dismissed` set at 17979, early return at 17953).
- Components: ProactiveTipCard (17858–17997)
- Functions: `ld`/`sd` (2417/2435), `isoDay` (1961), `getBudgetData` (43964), `coachStyle` (48966)
- State: `tip`, `loading`, `dismissed`
- Storage: reads `proactiveTip`, `profile`, `fuelLog`, `fuelProfile`, budget data (via `getBudgetData`); writes `proactiveTip`
- Network / AI: see "## AI calls" #4
- Edge cases: On fetch failure, `loading` goes false with no `tip` → the component returns `null` (17953), so the card just disappears; no retry, no error copy. `AbortError` is swallowed (17946). Dismissal is per-mount only (not persisted), but the cache means only one request per calendar day.
- Gating: always on. **Not gated** — the fetch is hand-rolled with a bare `Content-Type` header and never checks `d.gated` (17904–17935).
- Status: WORKING (with the gating gap)
- Evidence for status: 17904 issues a live POST; 17936–17944 caches and renders the result.
- Notes: Because there is no `d.gated` check, a gated Worker response whose `content[0].text` is the upsell string ("Daily limit reached…", cf. 2683) would be cached to `proactiveTip` and displayed as the day's coaching insight. UNVERIFIED — depends on the Worker's gated response shape.

### F-TRAIN-320 Dynamic Feed ("YOUR FEED" cards)
- Location: Home tab (rendered by the dashboard's `feed` block, 26623–26627) — component defined in this range
- User action: Taps a card (check-in, comeback, next-split) to navigate; the rest are read-only.
- Behavior:
  1. Derives: `todayFb` = today's entry in the `feedback` log (18004–18010); `lastW` = `history[0]` (18011); `daysSinceLast` from `lastW.dateISO` (default 999) (18012–18018); `trainedToday` (18019–18025); `consec` = consecutive training days walking back up to 10 days (18026–18042); `nextSplitDay` (18043–18058).
  2. Card selection (18059–18085): no check-in today → `checkin`; else if today's feedback has sleep or soreness → `recovery`. Then `consec >= 4` → `rest`, else `daysSinceLast >= 3 && !trainedToday` → `comeback`. Then `nextSplitDay && !trainedToday` → `nextsplit`. Returns `null` when no cards qualify (18085).
  3. `checkin` card: 📋 icon, "Check in today" / "Log your sleep, recovery and mood"; whole card `onClick` → `go("coach")` (18106–18160).
  4. `recovery` card: "TODAY'S READINESS" with up to three emoji tiles (Sleep `["","😫","😕","😴","💤","⭐"]`, Recovery `["","🔥","😣","😐","💪","✨"]`, Mood `["","😞","😕","😐","😊","🔥"]`), each colour-coded green/red/amber by score, plus a verdict line: good → "Well rested and feeling fresh — push hard today."; bad → "Take it steady — your body is asking for recovery."; else "Feeling okay — train smart today." (18161–18265).
  5. `rest` card: 😴, "N days straight" / "Rest is training too — muscles grow during recovery." — non-interactive (18266–18320).
  6. `comeback` card: fire icon, "You rested yesterday" (1 day) or "N days since your last session" / "Ready to get back at it?"; `onClick` → `go("train")` (18321–18390).
  7. `nextsplit` card: train icon, "Up next: {day.name}" / "N exercises planned" or "Your next scheduled session"; `onClick` → `go("train")` (18391–18440).
- Components: DynamicFeed (17998–18440)
- Functions: `isoDay` (1961), `dayOf` (1969), `ld` (2417), `lkKeyActivate` (out of range)
- State: none — recomputed on every render from props + storage
- Storage: reads `feedback`
- Network / AI: none (all rules are local)
- Edge cases: `daysSinceLast` defaults to 999 when there is no `dateISO`, which cannot trigger `comeback` because that branch also requires history to exist implicitly through `lastW` (18011, 18077) — with an empty history `lastW` is null so `daysSinceLast` stays 999 and `comeback` **does** fire for a brand-new user showing "999 days since your last session". Confirmed by reading 18011–18018 and 18077: nothing guards `lastW` being null in the comeback condition.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 18077 — `daysSinceLast >= 3 && !trainedToday` is true for a user with zero history (`daysSinceLast` initialised to 999 at 18013), producing a "999 days since your last session" card.
- Notes: The `nextSplitDay` lookup compares `split.days[i].name === lastW.name` (18048). Workouts started from a split are named `"{split} - {day}"` (15742, 15207), so this equality almost never matches and the code falls through to `splits[0].days[0]` (18057) — the "Up next" card therefore usually shows day 1 of the first split regardless of where the user is in the rotation. The accessibility pattern (an inner `role="button"` label block inside a card whose `onClick` is on the outer div, 18132–18139, 18355, 18418) means keyboard activation fires `lkKeyActivate` on an element with no handler of its own — the `onClick` lives on the parent, so Enter/Space on the focused block relies on click bubbling from `lkKeyActivate`. UNVERIFIED: needs `lkKeyActivate`'s implementation to confirm it synthesizes a click that bubbles.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| AISplitBuilder | component | 13956–14880 | AI split builder: mode picker, chat, photo import | TrainHub (15064) | useState/useRef/useEffect, callWorker, startChat, saveSplits, Ic, lkKeyActivate | F-TRAIN-308/309/310 |
| (scroll effect) | hook (useEffect) | 13969–13971 | Pins the chat scroller to the bottom on new messages | React, dep `[msgs]` | — | F-TRAIN-309 |
| getConvoSys | function | 13972–13977 | Builds the conversational coach system prompt | startChat, send | — | F-TRAIN-309 |
| getGenSys | function | 13978–13992 | Builds the program-generation system prompt from collected answers | send | histRef filter/map/join | F-TRAIN-309 |
| callWorker | function | 13993–14006 | Raw POST to the Cloudflare Worker; extracts text from Anthropic- or OpenAI-shaped replies | startChat, send, analyzePhoto | fetch | F-TRAIN-309/310 |
| tryParse | function | 14007–14016 | Extracts and JSON-parses the `###PROGRAM_START/END###` block | startChat path, send, analyzePhoto | JSON.parse | F-TRAIN-309/310 |
| startChat | function | 14018–14049 | Opens the chat mode and fetches the first coach turn | picker card (14219), "Start over" (14790) | callWorker, getConvoSys | F-TRAIN-309 |
| send | function | 14050–14140 | Sends a user answer; forces generation after 6 answers | send button (14829), Enter key (14808) | callWorker, getConvoSys, getGenSys, tryParse | F-TRAIN-309 |
| handlePhoto | function | 14141–14152 | Reads the selected image into a data URL for preview | file input (14494) | FileReader | F-TRAIN-310 |
| analyzePhoto | function | 14153–14166 | Sends the typed split description for conversion (image not sent) | "Convert to LOCKED" (14507) | callWorker, tryParse | F-TRAIN-310 |
| saveSplits | function | 14167–14195 | Normalises the AI program into split objects and hands them up | "SAVE SPLIT" ×2 (14582, 14750) | p.onSave | F-TRAIN-309/310 |
| AdaptiveTrainingCard | component | 14881–15012 | Muscle-recovery readout + rule-based training suggestion | TrainHub (15963) | computeMuscleRecovery, Pill, Section, Ic | F-TRAIN-307 |
| Pill | function (render helper) | 14911–14939 | One muscle pill with last-trained/hours-remaining | Section | React.createElement | F-TRAIN-307 |
| Section | function (render helper) | 14940–14966 | A labelled group of pills; null when empty | AdaptiveTrainingCard render | Pill | F-TRAIN-307 |
| TrainHub | component | 15013–15964 | The Train tab: sub-tabs, splits, history, sub-screens | app root (57615) | SplitBuilder, ExLib, AISplitBuilder, WorkoutDetail, McTrainBanner, AdaptiveTrainingCard, getEx, sessionMetaLine, lkPortal | F-TRAIN-300…307 |
| toggleSplitOpen | handler | 15015–15021 | Flips a split's expanded flag and persists the map | chevron button (15625) | sd | F-TRAIN-303 |
| Review | component | 15965–16621 | Post-workout summary → reflection → AI insight → save/discard | app root (57588) | setRating, save, submitReflection, aiCall, ThrowbackCard, storedToUnit | F-TRAIN-311…315 |
| setRating | handler | 16006–16012 | Sets one reflection score | rating buttons (16452) | setRatings | F-TRAIN-312 |
| save | function | 16013–16090 | Builds the history record and calls `p.onSave` (double-tap guarded) | 3 save buttons (16370, 16497, 16615) | isoDay | F-TRAIN-315 |
| submitReflection | function | 16091–16133 | Assembles the personalized coach prompt and requests the insight | "GET AI COACH INSIGHT" (16480) | aiCall, ld, coachStyle, getWeightLog | F-TRAIN-313 |
| ConvertToSplitModal | component | 16622–17083 | Bottom-sheet flow turning a logged workout into a split day | WorkoutDetail (17843) | resolveExId, convertToNewSplit, convertToExistingSplit, lkPortal | F-TRAIN-318 |
| resolveExId | function | 16629–16635 | Exact-name lookup of an exercise id in `ALL_EX` | convertToNewSplit, convertToExistingSplit | — | F-TRAIN-318 |
| convertToNewSplit | handler | 16636–16652 | Creates a new split with this workout as day 1 | CREATE (16920) | resolveExId, p.onConvert | F-TRAIN-318 |
| convertToExistingSplit | handler | 16653–16670 | Appends this workout as a new day on a chosen split | ADD DAY (17070) | resolveExId, p.onConvert | F-TRAIN-318 |
| WorkoutDetail | component | 17084–17857 | Read + edit view of one history entry | TrainHub (15076) | saveEdit, setExSet, addExSet, removeExSet, removeExercise, ConvertToSplitModal, DraftNum, lkConfirm, sessionMetaLine | F-TRAIN-316/317/318 |
| setExSet | handler | 17110–17123 | Immutably updates one field of one set in edit mode | DraftNum onCommit, RIR select | setEExercises | F-TRAIN-317 |
| addExSet | handler | 17124–17137 | Appends a blank set (rir "2") to an exercise | "Add Set" (17477) | setEExercises | F-TRAIN-317 |
| removeExSet | handler | 17138–17148 | Removes one set | per-set x button (17458) | setEExercises | F-TRAIN-317 |
| removeExercise | handler | 17149–17154 | Removes a whole exercise from the edited workout | trash button (17331) | setEExercises | F-TRAIN-317 |
| saveEdit | function | 17155–17194 | Recomputes totals and emits the updated workout | SAVE (17228) | storedToUnit, p.onEdit | F-TRAIN-317 |
| ProactiveTipCard | component | 17858–17997 | Daily AI "today's insight" card, cached per day | HomeScreen dashboard (26595) | ld, sd, isoDay, getBudgetData, coachStyle, fetch | F-TRAIN-319 |
| (tip fetch effect) | hook (useEffect) | 17864–17952 | Builds context, calls the Worker, caches the tip | React, deps `[]` | fetch, AbortController, ld, sd | F-TRAIN-319 |
| DynamicFeed | component | 17998–18440 | Rule-based home feed: check-in, readiness, rest, comeback, next split | HomeScreen dashboard (26623) | ld, isoDay, dayOf, lkKeyActivate, Ic | F-TRAIN-320 |

Total functions/components/hooks/handlers indexed: **32**.

---

## AI calls

All four hit the same origin: `https://lockedapi.cescocugliari.workers.dev/`, `POST`, JSON body.

### 1. AI Split Builder — conversation and program generation (`callWorker`, 13993–14006)
- Endpoint: `https://lockedapi.cescocugliari.workers.dev/` (13994), method POST.
- Headers: `{"Content-Type":"application/json"}` only — **no `Authorization`** (13996–13998), unlike shared `aiCall` which uses `authHeaders()` (2652–2667).
- Request payload: `{ system: <string>, max_tokens: 800, messages: [{role, content}, ...] }` (13999–14004).
- **max_tokens: 800** (14001).
- System prompt A — conversational (13972–13977), concatenated:
  > "You are LOCKED AI, a strength coach building a custom split for the user. Ask one or two questions at a time to collect: goal, days per week, split style (PPL/Upper-Lower/Full Body/Bro/custom), sets per exercise, exercises per session, equipment access, any injuries. After collecting all details generate the split. Keep replies short and conversational."
- System prompt B — generation (13978–13992), where `{answers}` is every non-"start" user turn joined by ". ":
  > "Build a custom training split based on: {answers}. Output ONLY: ###PROGRAM_START### then JSON then ###PROGRAM_END### then one sentence. JSON: {name:string, splits:[{name:string, days:[{name:string, exIds:[numbers]}]}]}. IDs: Chest=107,101,108,110,112,117. Back=201,202,206,207,208,213. Shoulders=301,302,306,307,311,312. Triceps=403,406,407,408. Biceps=503,502,506,505,509. Quads=701,702,703,704,705. Hams=801,802,803. Glutes=901,903. Abs=1001,1008. Calves=1101,1102. Match days to schedule. Avoid injuries mentioned."
- Messages: conversational turns are the full `histRef` array (14100); generation is a single `[{role:"user",content:"Generate my split now."}]` (14061–14064); the opening turn is `[{role:"user",content:"start"}]` (14021–14024).
- Response parsing (13993–14006): `r.json()`, then `d.content[0].text` (Anthropic shape) → else `d.choices[0].message.content` (OpenAI shape) → else `"API error: " + d.error.message`. Empty/whitespace text routes to `onErr`. `tryParse` (14007–14016) then locates `###PROGRAM_START###` (+19 chars) and `###PROGRAM_END###` and `JSON.parse`s the slice; the display sentence is `txt.slice(indexOf("###PROGRAM_END###") + 17).trim()` (14068, 14107).
- Fallback on failure: opener falls back to the hardcoded question "What is your main training goal and how many days a week can you train?" (14040); mid-conversation failure appends "Connection issue. Try again." (14090, 14132); an unparseable forced generation appends "Could not build split. Please try again." (14077).
- Rate limiting: **none client-side, and no `d.gated` check** — the shared `aiCall` handles gating at 2682–2688 but `callWorker` does not. A gated response would be rendered as a normal assistant message.

### 2. AI Split Builder — photo/description conversion (`analyzePhoto`, 14153–14166)
- Same endpoint, method, headers, and `max_tokens: 800` (it reuses `callWorker`).
- System prompt, where `{desc}` is `photoNote.trim()` or the literal `"a training split"` (14156):
  > "Convert this training plan to LOCKED app format: {desc}. Output ONLY: ###PROGRAM_START### then JSON then ###PROGRAM_END###. JSON: {name:string, splits:[{name:string, days:[{name:string, exIds:[numbers]}]}]}. IDs: Chest=107,101,108,110,112. Back=201,202,206,207,208. Shoulders=301,302,306,307,311. Triceps=403,406,407. Biceps=503,502,506. Quads=701,702,703,704. Hams=801,802,803. Abs=1001,1008."
- Messages: `[{role:"user",content:"Convert it now."}]` (14162).
- **The image is never transmitted.** `imgData` (14144) is used only for the `<img src>` preview (14385) and is absent from the request body (14162).
- Response parsing: `tryParse` → `photoResult` (14163).
- Fallback on failure: none — only `setPhotoLoading(false)` (14165); the UI shows no error.
- Rate limiting: none; ungated (same as #1).

### 3. Post-workout coach insight (`submitReflection`, 16091–16133 → `aiCall`, 2663–2696)
- Endpoint: same Worker (2665), method POST, headers from `authHeaders()` — `Content-Type` plus `Authorization: Bearer {window.LOCKED.session.access_token}` when a session exists (2652–2661).
- Payload: `{ system: <string>, max_tokens: 700, messages: [{role:"user", content: <usr>}] }` (2667–2675). **max_tokens: 700** (2669).
- Base system prompt (16108):
  > "You are a concise strength coach. Give a 2-3 sentence post-workout insight. Be specific, reference the actual data. No fluff or generic advice."
  Then appended in order: `" Your name is {profile.coachName}."` when set (16110); `" " + coachStyle().tone` (16111, `coachStyle` at 48966); `" User instructions for you: {coachInstructions}"` when set (16112–16113); `" Their goal is: {profile.goal}."` (16115); `" Latest weigh-in: {kg}kg on {date}."` from the last `getWeightLog()` entry (16116–16120); `" Last check-in: mood N/5, energy N/5, stress N/5 note: {first 60 chars}."` from `feedback[0]` (16121–16125).
- User message (16130):
  > "Workout: {name}. Duration: {dur}min. {exSummary}{". Notes/blocks: {blockSummary}" or "."}. Athlete ratings - Energy: N/5, Pump: N/5, Strength: N/5, Sleep: N/5, Stress: N/5. Note: {note}. Give a brief specific coach insight."
  where `exSummary` is per exercise `"{name}: {N} sets, top {w}{unit}x{r}"` joined by ". " (16095–16107).
- Response parsing (2676–2694): `d.gated` → toast the gate message and call `onFail`; else `d.content[0].text` → else `d.choices[0].message.content`; when `betaStatus` is set, `logBetaAI(userMsg, txt)` records the exchange (2692).
- Fallback on failure: `setAiText("Solid session. Keep the consistency and focus on quality sleep tonight.")` (16134) — and this canned text is then persisted into the workout's `aiInsight` (16088).
- Rate limiting: server-side via `d.gated` (2682–2688); an AbortError is swallowed (2696); a network error toasts "Connection error. Check your internet and try again." (2699).

### 4. Proactive daily insight (ProactiveTipCard effect, 17904–17948)
- Endpoint: same Worker (17905), POST, headers `{"Content-Type":"application/json"}` only — **no `Authorization`** (17907–17909).
- Payload: `{ system: <string>, messages: [{role:"user", content: ctx + "\nGive me one insight based on my data right now."}], max_tokens: 100 }` (17910–17925). **max_tokens: 100** (17924).
- System prompt (17911–17916):
  > "You are a personal coach. Give ONE short, specific, actionable insight in 1-2 sentences based on this person's data. Reference their actual numbers. Be direct, not generic."
  plus `" Your name is {profile.coachName}."` when set, plus `" " + coachStyle().tone` (17913).
- User context `ctx`, assembled at 17866–17903 from: display name, goal, last workout name + set count + total workout count, today's `fuelLog` calories/protein (or "No food logged today."), `fuelProfile.tdee` + `macroProtein`, and weekly grocery target vs spend from `getBudgetData()` (43964).
- Response parsing: `d.content[0].text || ""`; if non-empty, `setTip(text.trim())` and `sd("proactiveTip", {text, date: todayISO})` (17931–17944). **The OpenAI shape is not handled here** (contrast 14002, 2691).
- Fallback on failure: none — `setLoading(false)` and the card returns `null` (17945–17947, 17953). `AbortError` is ignored.
- Rate limiting: one request per calendar day enforced client-side by the `proactiveTip` date cache (17859–17862); an `AbortController` cancels an in-flight request on unmount (17904, 17949–17951). **No `d.gated` check.**

Secrets: no API keys, tokens, or credentials are hardcoded anywhere in 13956–18440. The only credential in the request path is the Supabase-style bearer read from `window.LOCKED.session.access_token` in `authHeaders` (2658, out of range) — a runtime session token, not a literal. The Worker origin `lockedapi.cescocugliari.workers.dev` is hardcoded four times (13994, 17905, plus 2665 out of range) with no config indirection.

---

## Storage keys touched

Via `ld` (2417) / `sd` (2435) unless noted.

| Key | R/W | Where |
|---|---|---|
| `splitsExpanded` | read + write | 15015 (init), 15019 (toggle) |
| `ui_trainTab` | read + write | 15022 via `useHubState` (2123, 2135) |
| `ui_trainView` | read + write | 15023 via `useHubState` |
| `profile` | read | 16109, 16114 (Review prompt), 17912 (tip prompt) |
| `coachInstructions` | read | 16112 |
| `coachStyle` | read | via `coachStyle()` (48967), from 16111 and 17913 |
| `feedback` | read | 16121 (Review prompt), 18003 (DynamicFeed) |
| `betaStatus` | read | 2692, reached from 16132 |
| `proactiveTip` | read + write | 17860 (read), 17939 (write) |
| `fuelLog` | read | 17877 |
| `fuelProfile` | read | 17891 |
| `throwbackDismissed` | read + write | 4607 / 4662, reached from 15975 and 16588 |
| `lk_throwbackForce` | read (raw localStorage) | 4604, reached from 15972 |
| `prs` | read | 4612 inside `computeThrowback`, reached from 15975 |
| budget data (`getBudgetData`, 43964) | read | 17893 |
| weight log (`getWeightLog`, 2908) | read | 16116 |
| `activeWorkout`, `activeWorkoutRows`, `activeWorkoutSec`, `activeWorkoutRestTarget` | write (cleared) | 57599–57602, invoked by Review's Discard (F-TRAIN-313) |

Splits and history are not written directly from this range — they are passed in as props and mutated through `p.setSplits` / `p.setHistory` / `p.onSave` from the app root (57615–57634, 57588).

---

## Network endpoints

| Endpoint | Method | Call sites | Auth | max_tokens | Gated? |
|---|---|---|---|---|---|
| `https://lockedapi.cescocugliari.workers.dev/` | POST | 13994 (`callWorker`, used by chat 14021/14061/14100 and photo 14162) | none | 800 | no |
| `https://lockedapi.cescocugliari.workers.dev/` | POST | 2665 via `aiCall`, called at 16132 | `Bearer` from `window.LOCKED.session` | 700 | yes (`d.gated`) |
| `https://lockedapi.cescocugliari.workers.dev/` | POST | 17905 (ProactiveTipCard) | none | 100 | no |

No other network I/O, no Supabase table access, and no direct storage sync occurs in 13956–18440.

---

## Open questions / UNVERIFIED

1. **Worker gated-response shape.** Two of the four call sites (`callWorker`, ProactiveTipCard) ignore `d.gated`. Whether a gated reply also populates `content[0].text` with the upsell string — and would therefore be rendered as chat/insight text and cached under `proactiveTip` (17939) — cannot be determined from this file. Confirm by inspecting the Worker source or capturing a gated response.
2. **Unauthenticated Worker calls.** `callWorker` (13996) and the tip fetch (17907) send no `Authorization` header while `aiCall` does (2658). Either the Worker permits anonymous calls (a quota/abuse gap) or these two features fail for every user. Confirm with a request against the deployed Worker without a bearer token. Flagged as a security/abuse finding.
3. **`lkKeyActivate` semantics.** DynamicFeed and several card rows place `role="button"` + `onKeyDown={lkKeyActivate}` on an inner element while `onClick` lives on the outer card (18132–18139, 18355, 18418; also 15194–15200, 15891–15896). Whether Enter/Space actually activates the card depends on `lkKeyActivate` synthesizing a bubbling click. Confirm by reading its definition (not located in the shared 1–4663 region by the greps run) or by keyboard-testing the live build.
4. **`tab === "library"` inline branch (15959).** Reachable only if `ui_trainTab` was persisted as `"library"` by an earlier build, since the allow-list still accepts it (15022). Confirm by seeding `localStorage.ui_trainTab = "library"` and reloading; otherwise treat as dead code.
5. **`McTrainBanner` (25064).** Rendered unconditionally in the Train tab body (15456–15459) with `profile` and `go`; its own gating (menstrual-cycle related, judging by the name) is out of range and not audited here.
6. **`analyzePhoto` line numbers.** `handlePhoto` ends at 14152 and `saveSplits` begins immediately after `analyzePhoto`; the exact boundary (14153–14166 vs 14167) was derived from reading the contiguous block 13956–14200 rather than from a per-function marker. The behavior described is verbatim from that read.
7. **`getEx` on unknown ids.** Split day rows call `getEx(eid)` and immediately read `.name`/`.muscle` (15773–15789). If the AI returns an id absent from `ALL_EX`, whether `getEx` (4747) returns a placeholder or `undefined` (which would throw) is unverified — confirm by reading 4747–4760 or by injecting a bogus `exIds` entry.
