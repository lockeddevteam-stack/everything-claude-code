### F-MISC-001 — Refeed day suggestion card
- location: Fuel tab > Fuel dashboard (macros screen) > card rendered under the weigh-in card
- user action: After logging a body weight that trips the trigger, a card appears; user taps "Accept refeed" or "DISMISS"
- behaviour: 1. User logs weight via `WeightLogCard` → `handleWeightLog` (37020-37026). 2. `addWeightEntry(kg)` persists and returns the new log (2911-2935). 3. `checkRefeedTrigger(newLog, fuelProfile)` runs; if true and no refeed already active today, `setShowRefeed(true)` (37023-37025). 4. Card renders with `extraCarbs = calcRefeedCarbs(fuelProfile)` (36999, 37301-37305). 5. Accept → `sd("refeedAccepted", todayISO)`, `setRefeedActive(true)`, hides card, `logBetaActivity("refeed_accepted", {extraCarbs})` (37026-37032). 6. Dismiss → `sd("refeedDismissed", new Date().toISOString())`, hides card, `logBetaActivity("refeed_dismissed", {})` (37033-37037). 7. Once accepted, a static amber "refeed active" strip replaces the card (37306-37320).
- v6 status: **PARTIAL**

### F-MISC-002 — Daily weigh-in card (body-weight logging + history)
- location: Fuel tab > Fuel dashboard > "Daily Weigh-In" card, between the water card and the TDEE report card (37293-37297)
- user action: Types a weight into the numeric field and taps "Log"; taps "History" to expand the last 14 entries
- behaviour: 1. `todayISO = isoDay()`; `loggedToday` = any entry with that date (53316-53319). 2. If logged today, the input is replaced by "Logged today: <value> kg/lbs" using the LAST entry in the array (53386-53392). 3. Otherwise input + Log button; Log calls `submit()` (53320-53331). 4. `submit` parses float; rejects non-finite or ≤0 with a toast "Enter a weight above 0." (53323-53327). 5. Converts to kg if the user is in lbs (`num / 2.20462`) and calls `p.onLog(kg)`, then clears the field (53328-53330). 6. Parent `handleWeightLog` writes via `addWeightEntry` and may open the refeed card (37020-37024). 7. History toggle shows `weightLog.slice().reverse().slice(0,14)` in a 150px scroll area, converting kg→lbs for display (53431-53464).
- v6 status: **WORKING** with one display bug

### F-MISC-003 — Floating voice command button (capture)
- location: Global — fixed floating button rendered app-wide whenever nav is visible and a profile exists (57960)
- user action: Tap the mic button to start recording; tap (or release) again to stop. Drag it to any screen corner.
- behaviour: 1. `VoiceButtonWrap` reads `lk_voiceEnabled` (default true) and renders nothing when off (53700-53717). 2. Tap without drag → `toggleRec()` from the drag `finish()` handler (53757-53760, 53996-53998). 3. `startRec` calls `navigator.mediaDevices.getUserMedia({audio:true})` (53726-53728). 4. On success builds `new MediaRecorder(stream)`, collects `ondataavailable` chunks, `mr.start()`, `setRecording(true)` (53729-53746). 5. Stop → `mr.stop()`; `onstop` stops all tracks, builds `new Blob(chunks, {type:"audio/webm"})`, calls `sendAudio` (53736-53744, 53752-53757). 6. `sendAudio` POSTs multipart FormData to the worker (53761-53780) — see "Voice pipeline" section. 7. Result opens a bottom-sheet confirm modal (53785-54225).
- v6 status: **WORKING** (client side)

### F-MISC-004 — Draggable/snapping voice button physics
- location: Global floating button
- user action: Press and drag the mic button anywhere; release to fling it into the nearest corner
- behaviour: 1. Corner→coordinate mapping via `cornerToXY` using `SIZE=50`, `EDGE=16`, `TOP_GAP=56`, `bottomGap() = 82 + safe-area-inset-bottom + window.__lkBottomBar` (53791-53836). 2. `onPointerDown` records offsets, cancels any spring, sets dragging (54004-54021). 3. `onMove` applies rubber-band clamping via `rubber()` and tracks smoothed velocity (53953-53989). 4. On release `finish()` projects the fling with `DECEL = 0.998`, picks a corner with `chooseCorner`, persists `lk_voiceBtnCorner`, then `springToPoint` animates there with `SPRING.snap` constants (53990-54003, 53924-53952). 5. Haptics: `navigator.vibrate(10)` on drag start, `vibrate(8)` on spring settle (53962-53965, 53942-53944). 6. `repark` listener on `lockedBottomBar` and `resize` re-parks the button when the Coach composer publishes its height (53846-53858).
- v6 status: **WORKING**

### F-MISC-005 — Voice command confirmation sheet
- location: Global — bottom sheet over any screen after a voice capture
- user action: Reads the transcription, taps "Confirm ✓" or "Cancel" (or drags the sheet down / taps the scrim)
- behaviour: 1. Sheet renders when `showModal && result` (53785, 54065). 2. Shows the transcription in quotes, falling back to "(no speech detected)" (54105-54110). 3. If `result.action` exists and !== "unknown", shows a "DETECTED ACTION" block with `getActionLabel(result)` (54111-54140). 4. Otherwise shows the hint copy "Couldn't detect an action. Try saying something like…" and hides the Confirm button (54141-54150, 54194). 5. Confirm → `executeVoiceAction(result)`, close, clear (53781-53786). 6. `useSheetDrag(dismiss)` provides drag-to-close (53790, 54081, 54093).
- v6 status: **WORKING**

### F-MISC-006 — Voice action execution (six intents)
- location: Global — runs on Confirm from the voice sheet; also reachable from the Coach chat path (shared helpers)
- user action: Tap "Confirm ✓" - Behavior — one branch per `result.action` (53476-53619): 1. `add_shopping` — each item parsed by `parseIngredient` then `addShoppingItem(name, qty, unit)`; toast "Added N item(s)…" (53479-53488). 2. `log_meal` — reads `lk_fuelLog`, appends `{name, cal, pro, carb, fat, fromVoice:true}` to `meals[slot]` (default slot `snacks`), writes back, dispatches `lockedFuelUpdate`, toast (53489-53514). 3. `log_water` — increments `fuelLog[today].water` by `d.glasses || 1`, dispatches `lockedFuelUpdate`, toast (53515-53535). 4. `log_purchase` — `getBudgetData()`, unshifts `{id:"b_"+Date.now(), store, amount, total, note, date, items}`, `saveBudgetData` (53536-53551). 5. `log_workout` — unshifts a record into `lk_history`, dispatches `lockedHistoryUpdate`, toast (53552-53576). 6. `log_cardio` — `buildParsedCardioRecord(d)`; if null, toast "Couldn't work out how long that was"; else unshift into `lk_history` and toast with minutes and calories (53577-53592).
- behaviour: 
- v6 status: **WORKING** (a historical bug is documented as fixed)

### F-MISC-007 — Voice enable/disable toggle
- location: Profile tab > Settings > toggle "…" near the streaks toggle
- user action: Taps the switch
- behaviour: writes `lk_voiceEnabled` (33261-33263); `VoiceButtonWrap` re-reads on the `lockedVoiceToggle` and `storage` window events and unmounts the button when off (53703-53716).
- v6 status: **WORKING**

### F-MISC-008 — First-run tutorial / onboarding walkthrough
- location: Full-screen overlay (`zIndex: 2000`) over the whole app on first launch (57755-57759)
- user action: Taps "LET'S GO →", swipes or taps NEXT/←, taps dots to jump, taps "Skip"/"Skip tutorial", ends on "START TRAINING"
- behaviour: 1. Host state `showTutorial = !ld("tutorialSeen", false)` (57219-57221). 2. Phase `intro`: black screen, animated grid, "LOCKED" typed one letter per 110 ms up to 6 letters, tagline "YOUR TRAINING. LOCKED IN.", CTA + "Skip tutorial" (54276-54281, 54286-54294, 54376-54488). 3. Phase `steps`: 7 hardcoded cards, each `{d (icon), accent, title, steps[3], tag}` (54229-54275). Title typewriters at 34 ms/char, then the three bullets fade up staggered 60 ms and the location tag fades in (54303-54321, 54805-54860). 4. Navigation: `goNext`/`goPrev`/`jumpTo` each set `exiting` for a 240 ms cross-fade (280 ms on finish) before changing `step` (54322-54363); horizontal swipe threshold 50 px (54364-54371); progress bar width `(step+1)/total*100%` (54700-54710). 5. Phase `done`: 12 coloured particle animations, an animated SVG padlock, "YOU'RE READY." / "GET LOCKED.", "START TRAINING" → `finish()` (54495-54690). 6. `finish()` writes `lk_tutorialSeen` and calls `p.onDone()`, which also writes the flag and hides the overlay (54368-54371, 57756-57759).
- v6 status: **PARTIAL**

### F-MISC-009 — Barbell plate calculator
- location: Train tab > active workout screen > Tools menu > "Plate Calculator" — bottom sheet at `zIndex: 400` (12028-12031, 11439-11445)
- user action: Picks kg/lb, picks a bar, toggles Per Side / Total, taps plate buttons to add, taps a rendered plate or "↩ Undo" to remove, "Clear All" to reset, "🏋️ APPLY TO NEXT SET" to push the weight into the workout
- behaviour: 1. Unit defaults to the profile unit (`p.useKg !== false ? "kg" : "lb"`), bar defaults to `"oly"` (54928-54929). 2. Tapping a plate appends it to `addedPlates`, re-sorted descending (55005-55011). 3. `platesSum` = sum of `addedPlates`; `totalWeight = barW + (perSide ? platesSum*2 : platesSum)` (55021-55024). 4. Barbell graphic renders sleeve/collar/plates mirrored around a knurled centre; the left-hand plates are tap-to-remove (calls `undoLast`), the right-hand ones are not interactive (55238-55295). 5. Unit switch re-maps every added plate to the nearest available plate in the new unit's option list (55117-55131). 6. `nextTarget` scans `p.rows` for the first set with `done` falsy (54940-54955). 7. Apply converts the total into the workout's unit and writes `{w: weightStr, rec: false}` into that set via `p.setRows` (54956-54983), then flashes "WEIGHT APPLIED" for 1800 ms (54979-54982).
- v6 status: **PARTIAL**
