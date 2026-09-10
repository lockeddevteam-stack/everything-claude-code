# Agent 7 — Misc widgets, voice, tutorial, plate calc, gamification

File audited: `redesign/input/locked-current-v6.html` (58,015 lines). Exclusive range **53210–55509**, plus cross-cutting gamification grep across the whole file. All cites are `redesign/input/locked-current-v6.html:LINE` (path omitted below for brevity; every line number refers to that file).

---

## PART A — Feature entries

### F-MISC-001 Refeed day suggestion card
- Location: Fuel tab > Fuel dashboard (macros screen) > card rendered under the weigh-in card
- User action: After logging a body weight that trips the trigger, a card appears; user taps "Accept refeed" or "DISMISS"
- Behavior:
  1. User logs weight via `WeightLogCard` → `handleWeightLog` (37020-37026).
  2. `addWeightEntry(kg)` persists and returns the new log (2911-2935).
  3. `checkRefeedTrigger(newLog, fuelProfile)` runs; if true and no refeed already active today, `setShowRefeed(true)` (37023-37025).
  4. Card renders with `extraCarbs = calcRefeedCarbs(fuelProfile)` (36999, 37301-37305).
  5. Accept → `sd("refeedAccepted", todayISO)`, `setRefeedActive(true)`, hides card, `logBetaActivity("refeed_accepted", {extraCarbs})` (37026-37032).
  6. Dismiss → `sd("refeedDismissed", new Date().toISOString())`, hides card, `logBetaActivity("refeed_dismissed", {})` (37033-37037).
  7. Once accepted, a static amber "refeed active" strip replaces the card (37306-37320).
- Components: `RefeedCard` (53210-53311)
- Functions: `checkRefeedTrigger` (2936-2965), `calcRefeedCarbs` (2966-2974), `acceptRefeed` (37025-37032), `dismissRefeed` (37033-37037), `handleWeightLog` (37020-37024)
- State: `showRefeed`, `refeedActive` (36918-36921) in the Fuel screen; `RefeedCard` itself is stateless, props `extraCarbs`, `onAccept`, `onDismiss` (53210-53211, 53286, 53297)
- Storage: reads `lk_refeedDismissed`, `lk_refeedAccepted`, `lk_weightLog`, `lk_fuelProfile`; writes `lk_refeedAccepted`, `lk_refeedDismissed` (2939, 2944, 37026, 37034; key list 208-209)
- Network: none directly; `logBetaActivity` side-channel only (37029, 37036)
- AI: none
- Edge cases: no fuelProfile → `refeedCarbs` falls back to 75 (36999) and `checkRefeedTrigger` returns false when goal !== "cut" (2937); <3 weight entries → false (2938); dismissed within 5 days → suppressed (2939-2943); already accepted today → suppressed (2944-2946)
- Gating: always on, but only for `fuelProfile.goal === "cut"` (2937)
- Status: **PARTIAL**
- Evidence for status: 53289 — the accept button's background is `"linear-gradient(135deg,var(--color-accent-deep),#9A3412))"` with a stray extra `)`, an invalid CSS value the browser discards, so the primary CTA renders with no gradient background. Logic works; styling is broken.
- Notes: the "+Xg carbs" number is displayed only — nothing in this range or in `acceptRefeed` adds those carbs to the day's macro targets; the only downstream effect of accepting is the `lk_refeedAccepted` date and the amber strip (37026-37032, 37306-37320). Copy is hardcoded to "hit a new low weight 3 days in a row" (53257). `calcRefeedCarbs` hardcodes tiers 50/75/100 g and a +15 g bump above 90 kg (2966-2974).

### F-MISC-002 Daily weigh-in card (body-weight logging + history)
- Location: Fuel tab > Fuel dashboard > "Daily Weigh-In" card, between the water card and the TDEE report card (37293-37297)
- User action: Types a weight into the numeric field and taps "Log"; taps "History" to expand the last 14 entries
- Behavior:
  1. `todayISO = isoDay()`; `loggedToday` = any entry with that date (53316-53319).
  2. If logged today, the input is replaced by "Logged today: <value> kg/lbs" using the LAST entry in the array (53386-53392).
  3. Otherwise input + Log button; Log calls `submit()` (53320-53331).
  4. `submit` parses float; rejects non-finite or ≤0 with a toast "Enter a weight above 0." (53323-53327).
  5. Converts to kg if the user is in lbs (`num / 2.20462`) and calls `p.onLog(kg)`, then clears the field (53328-53330).
  6. Parent `handleWeightLog` writes via `addWeightEntry` and may open the refeed card (37020-37024).
  7. History toggle shows `weightLog.slice().reverse().slice(0,14)` in a 150px scroll area, converting kg→lbs for display (53431-53464).
- Components: `WeightLogCard` (53312-53465)
- Functions: `submit` (53320-53331), `getWeightLog` (2908-2910), `addWeightEntry` (2911-2935), `fmtQ` (shared), `isoDay` (shared)
- State: local `val`, `showLog` (53313-53314); props `weightLog`, `useKg`, `onLog` (53315-53317, 37294-37296)
- Storage: reads/writes `lk_weightLog` via `getWeightLog`/`addWeightEntry` (2909, 2932)
- Network: `logBetaActivity("weight_log", {kg, date})` inside `addWeightEntry` (2933)
- AI: none
- Edge cases: empty input disables the button (53409); `"0"`, `"-5"`, `"-"` pass the disabled check but are rejected by `submit` with a toast — the source comment at 53321-53322 says this used to fail silently and the toast is the fix; `weightLog.length === 0` hides the History button (53370)
- Gating: always on
- Status: **WORKING** with one display bug
- Evidence for status: 53388-53390 — the "Logged today" readout uses `weightLog[weightLog.length - 1]`, i.e. the last element after `addWeightEntry`'s date sort (2927-2929), which is correct only when today is the latest date; a back-dated entry cannot occur through this UI, so this is latent rather than live. Marked WORKING.
- Notes: `addWeightEntry` upserts by date, so re-logging the same day overwrites (2915-2922). Unit conversion constant 2.20462 hardcoded in three places in this component (53328, 53388, 53433).

### F-MISC-003 Floating voice command button (capture)
- Location: Global — fixed floating button rendered app-wide whenever nav is visible and a profile exists (57960)
- User action: Tap the mic button to start recording; tap (or release) again to stop. Drag it to any screen corner.
- Behavior:
  1. `VoiceButtonWrap` reads `lk_voiceEnabled` (default true) and renders nothing when off (53700-53717).
  2. Tap without drag → `toggleRec()` from the drag `finish()` handler (53757-53760, 53996-53998).
  3. `startRec` calls `navigator.mediaDevices.getUserMedia({audio:true})` (53726-53728).
  4. On success builds `new MediaRecorder(stream)`, collects `ondataavailable` chunks, `mr.start()`, `setRecording(true)` (53729-53746).
  5. Stop → `mr.stop()`; `onstop` stops all tracks, builds `new Blob(chunks, {type:"audio/webm"})`, calls `sendAudio` (53736-53744, 53752-53757).
  6. `sendAudio` POSTs multipart FormData to the worker (53761-53780) — see "Voice pipeline" section.
  7. Result opens a bottom-sheet confirm modal (53785-54225).
- Components: `VoiceButtonWrap` (53700-53717), `VoiceButton` (53718-54227, `React.memo`)
- Functions: `startRec` (53725-53750), `stopRec` (53751-53757), `toggleRec` (53758-53760), `sendAudio` (53761-53780), `confirm` (53781-53786), `dismiss` (53787-53790)
- State: `recording`, `processing`, `result`, `showModal` (53719-53722); refs `mrRef`, `chunksRef` (53723-53724)
- Storage: reads `lk_voiceEnabled` (53702, 53706); reads/writes `lk_voiceBtnCorner` (53841, 53845, 54001)
- Network: `POST https://lockedapi.cescocugliari.workers.dev/voice` (53766)
- AI: transcription + intent parsing happen server-side in the Cloudflare Worker; **no model name or prompt exists in this file** — UNVERIFIED which model
- Edge cases: mic denied / getUserMedia throws → toast "Microphone access denied. Allow the microphone in browser settings." (53747-53749); fetch/JSON failure → toast "Voice processing failed. Check your connection and retry." (53775-53778); `processing` disables the button and blocks pointer-down (53923, 53968); no speech → modal shows "(no speech detected)" (54109)
- Gating: settings toggle `lk_voiceEnabled`, default on (32060-32061, 33261-33263, 53702)
- Status: **WORKING** (client side)
- Evidence for status: 53761-53780 — full capture→upload→modal path present with both error branches wired to toasts.
- Notes: no recording time cap and no max blob size — a long recording uploads unbounded. `MediaRecorder` is constructed with no mimeType option but the Blob is labelled `audio/webm` (53730, 53741), which is wrong on Safari/iOS where MediaRecorder emits mp4/aac; the server receives a mislabelled file. No `MediaRecorder` feature detection.

### F-MISC-004 Draggable/snapping voice button physics
- Location: Global floating button
- User action: Press and drag the mic button anywhere; release to fling it into the nearest corner
- Behavior:
  1. Corner→coordinate mapping via `cornerToXY` using `SIZE=50`, `EDGE=16`, `TOP_GAP=56`, `bottomGap() = 82 + safe-area-inset-bottom + window.__lkBottomBar` (53791-53836).
  2. `onPointerDown` records offsets, cancels any spring, sets dragging (54004-54021).
  3. `onMove` applies rubber-band clamping via `rubber()` and tracks smoothed velocity (53953-53989).
  4. On release `finish()` projects the fling with `DECEL = 0.998`, picks a corner with `chooseCorner`, persists `lk_voiceBtnCorner`, then `springToPoint` animates there with `SPRING.snap` constants (53990-54003, 53924-53952).
  5. Haptics: `navigator.vibrate(10)` on drag start, `vibrate(8)` on spring settle (53962-53965, 53942-53944).
  6. `repark` listener on `lockedBottomBar` and `resize` re-parks the button when the Coach composer publishes its height (53846-53858).
- Components: `VoiceButton` (53718-54227)
- Functions: `cornerToXY` (53812-53836), `applyXY` (53883-53888), `stopSpring` (53889-53894), `springToPoint` (53895-53922), `rubber` (53923-53929), `chooseCorner` (53935-53946), `onMove` (53947-53985), `finish` (53986-54005), `onEnd` (54006-54008), `onCancel` (54009-54011), `onPointerDown` (54012-54029), `SAFE_B` IIFE (53794-53806), `bottomGap` (53811)
- State: `corner`, `pos`, `dragging`; refs `dragRef`, `posRef`, `wrapRef`, `velRef`, `springRef` (53837-53882)
- Storage: `lk_voiceBtnCorner` (default `"br"`) read at 53841/53848 and written at 54001
- Network: none
- AI: none
- Edge cases: `touchcancel` treated as a cancelled drag with zero velocity (54009-54011); a <6px movement counts as a tap, not a drag (53956-53960); `SAFE_B` wrapped in try/catch returning 0 (53803-53805)
- Gating: always on when the button renders
- Status: **WORKING**
- Evidence for status: 53859-53882 + 53947-54005 — complete drag/velocity/spring loop with both mouse and touch listeners registered and torn down.
- Notes: the move/end listeners are re-registered on every `recording`/`processing` change (54023) — harmless but wasteful. Source comment at 53807-53810 documents the Coach-composer collision bug this solves.

### F-MISC-005 Voice command confirmation sheet
- Location: Global — bottom sheet over any screen after a voice capture
- User action: Reads the transcription, taps "Confirm ✓" or "Cancel" (or drags the sheet down / taps the scrim)
- Behavior:
  1. Sheet renders when `showModal && result` (53785, 54065).
  2. Shows the transcription in quotes, falling back to "(no speech detected)" (54105-54110).
  3. If `result.action` exists and !== "unknown", shows a "DETECTED ACTION" block with `getActionLabel(result)` (54111-54140).
  4. Otherwise shows the hint copy "Couldn't detect an action. Try saying something like…" and hides the Confirm button (54141-54150, 54194).
  5. Confirm → `executeVoiceAction(result)`, close, clear (53781-53786).
  6. `useSheetDrag(dismiss)` provides drag-to-close (53790, 54081, 54093).
- Components: `VoiceButton` (53718-54227)
- Functions: `getActionLabel` (53446-53464), `executeVoiceAction` (53476-53619), `confirm` (53781-53786), `dismiss` (53787-53790), `useSheetDrag` (2150)
- State: `result`, `showModal` (53721-53722)
- Storage: none at this layer; writes happen in `executeVoiceAction` (see F-MISC-006)
- Network: none
- AI: displays the model's parsed action; parse happens server-side
- Edge cases: `result.action === "unknown"` → no Confirm button (54194); missing `data` defaults to `{}` in both label and execute (53447, 53477)
- Gating: always on when voice is enabled
- Status: **WORKING**
- Evidence for status: 54194-54225 — Confirm button is conditionally rendered and bound to `confirm`.
- Notes: `getActionLabel` for `log_meal` interpolates `d.name` with no fallback, so a malformed payload renders `Log "undefined"` (53449).

### F-MISC-006 Voice action execution (six intents)
- Location: Global — runs on Confirm from the voice sheet; also reachable from the Coach chat path (shared helpers)
- User action: Tap "Confirm ✓"
- Behavior — one branch per `result.action` (53476-53619):
  1. `add_shopping` — each item parsed by `parseIngredient` then `addShoppingItem(name, qty, unit)`; toast "Added N item(s)…" (53479-53488).
  2. `log_meal` — reads `lk_fuelLog`, appends `{name, cal, pro, carb, fat, fromVoice:true}` to `meals[slot]` (default slot `snacks`), writes back, dispatches `lockedFuelUpdate`, toast (53489-53514).
  3. `log_water` — increments `fuelLog[today].water` by `d.glasses || 1`, dispatches `lockedFuelUpdate`, toast (53515-53535).
  4. `log_purchase` — `getBudgetData()`, unshifts `{id:"b_"+Date.now(), store, amount, total, note, date, items}`, `saveBudgetData` (53536-53551).
  5. `log_workout` — unshifts a record into `lk_history`, dispatches `lockedHistoryUpdate`, toast (53552-53576).
  6. `log_cardio` — `buildParsedCardioRecord(d)`; if null, toast "Couldn't work out how long that was"; else unshift into `lk_history` and toast with minutes and calories (53577-53592).
- Components: n/a (module-level functions)
- Functions: `showVoiceToast` (53466-53475), `executeVoiceAction` (53476-53619), `parsedCardioModality` (53628-53661), `parsedCardioSeconds` (53662-53672), `parsedCardioMetres` (53673-53685), `buildParsedCardioRecord` (53686-53699)
- State: none (module scope + `_vToastTimer` at 53465)
- Storage: reads/writes `lk_fuelLog`, `lk_history`; reads `lk_profile`, `lk_fuelProfile`, `lk_weightLog`; budget via `getBudgetData`/`saveBudgetData`; shopping via `addShoppingItem` (53490, 53507, 53516, 53565, 53580, 53688, 53690)
- Network: none
- AI: consumes the worker's parsed `action` + `data`; the comment at 53621-53627 states the model is explicitly told not to guess calories — the prompt itself is server-side, **not in this file**
- Edge cases: cardio with no parseable duration → early return with toast (53583); unknown modality falls back to `"run"` (53632, 53660); distance with no unit falls back to the app's km/mi setting (53683-53684); `showVoiceToast` no-ops if the toast element is absent (53467)
- Gating: always on when voice is enabled
- Status: **WORKING** (a historical bug is documented as fixed)
- Evidence for status: 53553-53555 — source comment records that voice workouts were previously written to `lk_workoutHistory`, which no screen read; the code now writes `lk_history` (53565), the store the app actually renders.
- Notes: voice-logged workouts carry `exercises: []` and volume as a string (53570-53572). Cardio record uses `id: "w_"+Date.now()` and the comment at 53704-53706 (within `buildParsedCardioRecord`, 53687-53689) explains why cardio needs an id at all. Toast auto-hides after 3000 ms (53473).

### F-MISC-007 Voice enable/disable toggle
- Location: Profile tab > Settings > toggle "…" near the streaks toggle
- User action: Taps the switch
- Behavior: writes `lk_voiceEnabled` (33261-33263); `VoiceButtonWrap` re-reads on the `lockedVoiceToggle` and `storage` window events and unmounts the button when off (53703-53716).
- Components: `VoiceButtonWrap` (53700-53717); settings switch (33255-33290)
- Functions: `sync` (53705-53707)
- State: `enabled` (53701-53703); settings-side `voiceEnabled` (32060-32061)
- Storage: `lk_voiceEnabled`, default `true` (208, 32061, 53702)
- Network: none
- AI: none
- Edge cases: cross-tab sync handled via the `storage` event (53710)
- Gating: user setting
- Status: **WORKING**
- Evidence for status: 53713-53714 — `if (!enabled) return null;` removes the button entirely.
- Notes: none.

### F-MISC-008 First-run tutorial / onboarding walkthrough
- Location: Full-screen overlay (`zIndex: 2000`) over the whole app on first launch (57755-57759)
- User action: Taps "LET'S GO →", swipes or taps NEXT/←, taps dots to jump, taps "Skip"/"Skip tutorial", ends on "START TRAINING"
- Behavior:
  1. Host state `showTutorial = !ld("tutorialSeen", false)` (57219-57221).
  2. Phase `intro`: black screen, animated grid, "LOCKED" typed one letter per 110 ms up to 6 letters, tagline "YOUR TRAINING. LOCKED IN.", CTA + "Skip tutorial" (54276-54281, 54286-54294, 54376-54488).
  3. Phase `steps`: 7 hardcoded cards, each `{d (icon), accent, title, steps[3], tag}` (54229-54275). Title typewriters at 34 ms/char, then the three bullets fade up staggered 60 ms and the location tag fades in (54303-54321, 54805-54860).
  4. Navigation: `goNext`/`goPrev`/`jumpTo` each set `exiting` for a 240 ms cross-fade (280 ms on finish) before changing `step` (54322-54363); horizontal swipe threshold 50 px (54364-54371); progress bar width `(step+1)/total*100%` (54700-54710).
  5. Phase `done`: 12 coloured particle animations, an animated SVG padlock, "YOU'RE READY." / "GET LOCKED.", "START TRAINING" → `finish()` (54495-54690).
  6. `finish()` writes `lk_tutorialSeen` and calls `p.onDone()`, which also writes the flag and hides the overlay (54368-54371, 57756-57759).
- Components: `TutorialOverlay` (54228-54924)
- Functions: `goNext` (54322-54341), `goPrev` (54342-54353), `jumpTo` (54354-54363), `handleTouchStart` (54364-54366), `handleTouchEnd` (54367-54372), `finish` (54368-54371)
- State: `phase`, `step`, `displayTitle`, `titleDone`, `animKey`, `exiting`, `touchStartX`, `introLetters` (54276-54283)
- Storage: reads `lk_tutorialSeen` (57220); writes it at mount (54284-54286), on `finish` (54369) and in `onDone` (57757)
- Network: none
- AI: none
- Edge cases: `current = STEPS[step] || STEPS[0]` guards an out-of-range index (54285); all interval timers are cleared on unmount (54293, 54320)
- Gating: first run only — `lk_tutorialSeen`
- Status: **PARTIAL**
- Evidence for status: 54283-54286 — `useEffect` writes `sd("tutorialSeen", true)` on mount, before the user has seen anything. A reload mid-tutorial therefore never shows it again, and there is no "replay tutorial" entry anywhere (`tutorialSeen` appears only at 208, 54283, 54369, 57220, 57757).
- Notes: all copy is hardcoded in `STEPS` (54229-54275) and includes a claim the app does not support elsewhere — step 4 says "Voice mode reads your numbers back so you never look away from the bar" (54251); nothing in the voice implementation does text-to-speech (F-MISC-003 through F-MISC-006 are capture-only). Step 1 mentions "streak" and the "streak card" (54233), which are hidden by default (see gamification verdict). Overlay forces dark via `className: "lk-forcedark"` and `background: "#080809"` (54377-54385).

### F-MISC-009 Barbell plate calculator
- Location: Train tab > active workout screen > Tools menu > "Plate Calculator" — bottom sheet at `zIndex: 400` (12028-12031, 11439-11445)
- User action: Picks kg/lb, picks a bar, toggles Per Side / Total, taps plate buttons to add, taps a rendered plate or "↩ Undo" to remove, "Clear All" to reset, "🏋️ APPLY TO NEXT SET" to push the weight into the workout
- Behavior:
  1. Unit defaults to the profile unit (`p.useKg !== false ? "kg" : "lb"`), bar defaults to `"oly"` (54928-54929).
  2. Tapping a plate appends it to `addedPlates`, re-sorted descending (55005-55011).
  3. `platesSum` = sum of `addedPlates`; `totalWeight = barW + (perSide ? platesSum*2 : platesSum)` (55021-55024).
  4. Barbell graphic renders sleeve/collar/plates mirrored around a knurled centre; the left-hand plates are tap-to-remove (calls `undoLast`), the right-hand ones are not interactive (55238-55295).
  5. Unit switch re-maps every added plate to the nearest available plate in the new unit's option list (55117-55131).
  6. `nextTarget` scans `p.rows` for the first set with `done` falsy (54940-54955).
  7. Apply converts the total into the workout's unit and writes `{w: weightStr, rec: false}` into that set via `p.setRows` (54956-54983), then flashes "WEIGHT APPLIED" for 1800 ms (54979-54982).
- Components: `PlateCalc` (54925-55508)
- Functions: `applyToNextSet` (54956-54983), `pColor` (54984-55004), `pH` (55005-55007), `pW` (55008-55010), `addPlate` (55011-55017), `undoLast` (55018-55022), `reset` (55023-55025), `fmt` (55031-55034), `getBar` (5371-5374)
- State: `unit`, `barId`, `addedPlates`, `perSide`, `applied` (54928-54932); props `useKg`, `rows`, `setRows`, `onClose` (11440-11445)
- Storage: none — nothing is persisted; state resets every open (54928-54932)
- Network: none
- AI: none
- Edge cases: `nextTarget` null → the Apply block is not rendered at all (55452); `addedPlates.length === 0` disables Undo and Clear (55398, 55420); `getBar` falls back to the Olympic bar for an unknown id (5372-5373); "No Bar" (0 kg / 0 lb) is selectable (5364-5369)
- Gating: always on inside an active workout
- Status: **PARTIAL**
- Evidence for status: 55238-55295 — only the reversed (left) plate stack is clickable and every one of those plates calls `undoLast()`, which removes the *last-added smallest* plate rather than the plate tapped; the `title: "Tap to remove"` at 55271 promises per-plate removal that does not happen.
- Notes: there is no solver — the user stacks plates by hand; the shared `calcPlatesPerSide` at 5376+ and the inventories `PLATES_KG`/`PLATES_LB` at 5367-5368 are **not used by this component**, which defines its own `KG_OPTS`/`LB_OPTS` (54935-54936). Unit conversion constant 2.20462 hardcoded at 54960-54961 and 55120. Unit re-mapping is lossy and irreversible (kg→lb→kg does not round-trip). Plate colours follow IPF/IWF convention but are hardcoded hex (54984-55004).

### F-GAME-001 Streak counter (Home)
- Location: Home tab > dashboard streak card, and the profile header chip
- User action: none — passive display; finishing a workout updates it
- Behavior: counts consecutive training days backwards from today (or yesterday if today is untrained), capped at 30 iterations (26237-26252). A second, uncapped implementation walks the same way over a date set built from history (1458-1466). Rendered only when `streak > 0 && ld("gamingLayer", false)` (26423, 26510).
- Components: Home dashboard (26423-26452), profile header chip (26510-26531)
- Functions: streak loop (26237-26252), streak loop (1458-1466), `getSuppStreak` (46148-46159), `getCompoundStreak` (47289-47301)
- State: local `streak` variables; not stored
- Storage: **derived, never persisted** — computed from `lk_history` (and supplement/compound logs) on every render; there is no `lk_streak` key (208-209 key list contains none)
- Network: the value is included in the push-subscription payload (1290, 1545)
- AI: none
- Edge cases: 30-day cap in the Home implementation (26241) means a 31+ day streak displays as 30; the other implementation (1458-1466) has no cap — the two disagree
- Gating: `lk_gamingLayer`, **default false** (26423, 26510)
- Status: **WORKING but hidden by default**
- Evidence for status: 26423 — `ld("gamingLayer", false)` gates the whole card, and the default is `false`, so a fresh install never sees a streak.
- Notes: 44 total `streak` matches break down as: 2 workout-streak computations (1458-1470, 26238-26251), 4 render sites (26423-26452, 26510-26531), supplement streaks (46148-46159, 46392, 46459-46465, 46849, 46915-46924), compound/cycle streaks (47289-47301, 47934, 48004-48013), 1 settings label (33039-33053), 1 tutorial copy line (54233), 1 AI system-prompt rule forbidding streak-guilt (49124), 1 explicit anti-streak design comment (52601), and the rest are code comments (1290, 1959, 5454, 6865).

### F-GAME-002 Badges (Progress screen)
- Location: Home tab > Progress screen > "Badges" grid
- User action: none — passive; earned by logging workouts and PRs
- Behavior: seven earn conditions evaluated inline on render from `history.length`, `prCount` and `totalSets` (30166-30208); up to three "locked" placeholders with "N more to go" copy (30209-30227); grid of earned then locked tiles (30424-30500).
- Components: the Progress screen component containing 30155-30500
- Functions: none dedicated — the badge array is built inline (30166-30227)
- State: `badges`, `locked` local arrays (30166, 30209)
- Storage: **none** — badges are recomputed every render, never persisted, and nothing records *when* one was earned
- Network: none
- AI: none
- Edge cases: `badges.length === 0` → "Log your first workout to earn a badge." (30403-30417)
- Gating: `lk_gamingLayer`, **default false** (30396)
- Status: **WORKING but hidden by default**
- Evidence for status: 30396 — `ld("gamingLayer", false) && React.createElement(React.Fragment, …)` wraps the entire Badges block.
- Notes: the seven badges are First Rep (≥1 workout), 5 Workouts, 10 Workouts, 25 Workouts, First PR, 5 PRs, 100 Sets (30167-30208). There is no unlock moment, notification, toast or animation anywhere — a badge simply appears in the grid. Of the 35 `badge` matches, only 30161-30500 are the badge system; the rest are the not-yet-earned colour constant (2027-2029), a metaphorical use in cycle-tracking copy ("never a badge of fitness", 25954), unrelated UI chrome labelled "badge" in a PR-table row (29461-29512) and a pro badge (682), plus comments (474, 4298, 57077) and the settings label (33039-33053).

### F-GAME-003 Streaks-and-badges master toggle
- Location: Profile tab > Settings > "Streaks and badges" switch, subtitle "Show the streak counter and achievement badges"
- User action: Taps the switch
- Behavior: `setGamingEnabled(next)` and `sd("gamingLayer", next)` (33046-33050); all three consumers read `ld("gamingLayer", false)` at render time (26423, 26510, 30396).
- Components: Settings screen (33022-33080)
- Functions: inline onClick (33046-33050)
- State: `gamingEnabled` (32066-32067)
- Storage: `lk_gamingLayer`, **default false** (209, 32067)
- Network: none
- AI: none
- Edge cases: consumers call `ld()` directly during render rather than subscribing, so another tab's change does not propagate until re-render — UNVERIFIED whether any screen re-renders promptly
- Gating: user setting
- Status: **WORKING**
- Evidence for status: 33046-33050 + 30396 — write and read use the same key with the same `false` default.
- Notes: the brief describes gamification as opt-*out*; the code ships it opt-*in* (default `false` at 32067, 26423, 26510, 30396).

---

## PART B — Function index (range 53210–55509)

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| `RefeedCard` | component | 53210-53311 | Renders the refeed-day suggestion card with accept/dismiss | Fuel screen (37301) | `Ic` | F-MISC-001 |
| `WeightLogCard` | component | 53312-53465 | Daily weigh-in input + 14-entry history list | Fuel screen (37293) | `isoDay`, `fmtQ`, `Ic`, `submit` | F-MISC-002 |
| `submit` | handler | 53320-53331 | Validates and converts the typed weight, calls `p.onLog` | Log button (53410) | `parseFloat`, `window.LOCKED.toast`, `p.onLog` | F-MISC-002 |
| `getActionLabel` | function | 53446-53464 | Human-readable one-line summary of a parsed voice action | voice sheet (54139) | `cardioActivity`, `parsedCardioModality`, `parsedCardioSeconds` | F-MISC-005 |
| `showVoiceToast` | function | 53466-53475 | Shows the global `#lockedVoiceToast` element for 3 s | `executeVoiceAction` (all branches) | `document.getElementById`, `setTimeout` | F-MISC-006 |
| `executeVoiceAction` | function | 53476-53619 | Applies a confirmed voice action to local storage | `confirm` (53783) | `parseIngredient`, `addShoppingItem`, `ld`, `sd`, `getBudgetData`, `saveBudgetData`, `buildParsedCardioRecord`, `showVoiceToast`, `isoDay` | F-MISC-006 |
| `parsedCardioModality` | function | 53628-53661 | Maps spoken activity text to a cardio activity id | `getActionLabel`, `buildParsedCardioRecord` | `cardioActivity` | F-MISC-006 |
| `parsedCardioSeconds` | function | 53662-53672 | Normalises duration (sec / min / mm:ss) to seconds | `getActionLabel`, `buildParsedCardioRecord` | `clockToSec` | F-MISC-006 |
| `parsedCardioMetres` | function | 53673-53685 | Normalises a spoken distance to metres | `buildParsedCardioRecord` | `cardioDistToM`, `ld` | F-MISC-006 |
| `buildParsedCardioRecord` | function | 53686-53699 | Builds a full v2 cardio history record from voice data | `executeVoiceAction` (53578) | `parsedCardioSeconds`, `parsedCardioModality`, `parsedCardioMetres`, `cardioActivity`, `cardioBodyProfile`, `cardioEstimate`, `cardioDist`, `cardioLegacyForModality`, `isoDay`, `ld` | F-MISC-006 |
| `VoiceButtonWrap` | component | 53700-53717 | Gates the voice button on `lk_voiceEnabled` | App root (57960) | `ld`, `VoiceButton` | F-MISC-007 |
| `sync` | handler | 53705-53707 | Re-reads the voice-enabled flag on toggle/storage events | window listeners (53709-53710) | `ld` | F-MISC-007 |
| `VoiceButton` | component (memo) | 53718-54227 | Draggable mic button + capture + result sheet | `VoiceButtonWrap` (53716) | see below | F-MISC-003/004/005 |
| `startRec` | function | 53725-53750 | Requests the mic and starts MediaRecorder | `toggleRec` | `navigator.mediaDevices.getUserMedia`, `MediaRecorder`, `sendAudio` | F-MISC-003 |
| `stopRec` | function | 53751-53757 | Stops the recorder (triggers `onstop` → upload) | `toggleRec`, button mouse/touch-up | `mrRef.current.stop` | F-MISC-003 |
| `toggleRec` | function | 53758-53760 | Start/stop switch for a tap | `finish` (53997) | `startRec`, `stopRec` | F-MISC-003 |
| `sendAudio` | function | 53761-53780 | POSTs the audio blob to the /voice worker | `mr.onstop` (53743) | `fetch`, `FormData` | F-MISC-003 |
| `confirm` | handler | 53781-53786 | Executes the parsed action and closes the sheet | Confirm button (54196) | `executeVoiceAction` | F-MISC-005/006 |
| `dismiss` | handler | 53787-53790 | Clears result and closes the sheet | `useSheetDrag`, Cancel button | setState | F-MISC-005 |
| `SAFE_B` | IIFE | 53794-53806 | Measures `env(safe-area-inset-bottom)` in px | inline at definition | DOM measurement | F-MISC-004 |
| `bottomGap` | function | 53811 | Bottom clearance = 82 + safe area + `window.__lkBottomBar` | `cornerToXY` | — | F-MISC-004 |
| `cornerToXY` | function | 53812-53836 | Corner id → x/y coordinates | `repark`, `onResize`, `finish`, initial state | `bottomGap` | F-MISC-004 |
| `repark` | handler | 53847-53852 | Re-positions the button on bottom-bar/resize events | window listeners (53853-53854) | `cornerToXY`, `applyXY` | F-MISC-004 |
| `applyXY` | function | 53883-53888 | Writes the transform directly to the DOM node | `springToPoint`, `onMove`, `repark`, `onResize` | — | F-MISC-004 |
| `stopSpring` | function | 53889-53894 | Cancels an in-flight spring animation | `springToPoint`, `onPointerDown`, `onResize` | `cancelAnimationFrame` | F-MISC-004 |
| `springToPoint` | function | 53895-53922 | Critically-damped spring to a corner + haptic | `finish` (54002) | `applyXY`, `requestAnimationFrame`, `navigator.vibrate` | F-MISC-004 |
| `step` (inner) | function | 53905-53920 | One rAF frame of the spring integration | `springToPoint` | `applyXY` | F-MISC-004 |
| `rubber` | function | 53923-53929 | Rubber-band resistance past the viewport edges | `onMove` | — | F-MISC-004 |
| `onResize` | handler | 53931-53936 | Re-parks on window resize (corner-dependent effect) | window listener (53937) | `cornerToXY`, `stopSpring`, `applyXY` | F-MISC-004 |
| `chooseCorner` | function | 53941-53952 | Projects the fling and picks the destination corner | `finish` | — | F-MISC-004 |
| `onMove` | handler | 53953-53985 | Drag tracking, clamping, velocity smoothing | mousemove/touchmove | `rubber`, `applyXY`, `navigator.vibrate` | F-MISC-004 |
| `finish` | function | 53986-54005 | Ends a drag: snap to corner, or treat as a tap | `onEnd`, `onCancel` | `chooseCorner`, `sd`, `cornerToXY`, `springToPoint`, `toggleRec` | F-MISC-003/004 |
| `onEnd` | handler | 54006-54008 | mouseup/touchend → `finish(false)` | window listeners | `finish` | F-MISC-004 |
| `onCancel` | handler | 54009-54011 | touchcancel → `finish(true)` | window listener | `finish` | F-MISC-004 |
| `onPointerDown` | handler | 54012-54029 | Starts a drag, seeds offsets and velocity | button mousedown/touchstart | `stopSpring` | F-MISC-004 |
| `TutorialOverlay` | component | 54228-54924 | Three-phase first-run onboarding walkthrough | App root (57755) | `sd`, `Ic`, `lkKeyActivate` | F-MISC-008 |
| `goNext` | function | 54322-54341 | Advance a step, or exit to the done phase | NEXT button, swipe left | setState, `setTimeout` | F-MISC-008 |
| `goPrev` | function | 54342-54353 | Go back a step | ← button, swipe right | setState, `setTimeout` | F-MISC-008 |
| `jumpTo` | function | 54354-54363 | Jump to a step from the dot indicator | dot onClick (54878) | setState, `setTimeout` | F-MISC-008 |
| `handleTouchStart` | handler | 54364-54366 | Records swipe origin x | overlay root (54692) | setState | F-MISC-008 |
| `handleTouchEnd` | handler | 54367-54372 | 50 px swipe threshold → next/prev | overlay root (54693) | `goNext`, `goPrev` | F-MISC-008 |
| `finish` | function | 54368-54371 | Marks the tutorial seen and calls `p.onDone` | Skip buttons, START TRAINING | `sd`, `p.onDone` | F-MISC-008 |
| `PlateCalc` | component | 54925-55508 | Barbell plate-loading sheet with apply-to-set | Workout screen (11439) | `useEscape`, `useSheetDrag`, `getBar`, `lkPortal`, `Ic`, `lkKeyActivate` | F-MISC-009 |
| `applyToNextSet` | function | 54956-54983 | Writes the computed total into the next unfinished set | APPLY button (55471) | `p.setRows`, `setTimeout` | F-MISC-009 |
| `pColor` | function | 54984-55004 | IPF-style colour for a plate weight | plate render, chips, buttons | — | F-MISC-009 |
| `pH` | function | 55005-55007 | Pixel height for a plate weight | plate render | — | F-MISC-009 |
| `pW` | function | 55008-55010 | Pixel width for a plate weight | plate render | — | F-MISC-009 |
| `addPlate` | function | 55011-55017 | Adds a plate, keeps the list sorted descending | plate buttons (55361) | setState | F-MISC-009 |
| `undoLast` | function | 55018-55022 | Removes the last plate in the array | Undo button, plate tap | setState | F-MISC-009 |
| `reset` | function | 55023-55025 | Clears all plates | Clear All button (55411) | setState | F-MISC-009 |
| `fmt` | function | 55031-55034 | Trims trailing zeros from a 2-dp number | total display, chips, apply preview | `toFixed` | F-MISC-009 |
| `CardioStar` | component | 55510+ (starts at range edge) | Favourite-toggle star for cardio setups — **out of range, owned by the cardio agent** | — | — | — |

**Counts: 9 features in-range (F-MISC-001…009) + 3 gamification features (F-GAME-001…003) = 12. 50 functions/components/handlers indexed in-range** (the `CardioStar` row is a boundary marker and is not counted).

---

## GAMIFICATION VERDICT

**Definitive: LOCKED has no XP system, no levels, no clans and no leaderboards. It has exactly two gamification elements — a derived streak counter and seven derived badges — and both are OFF by default behind one settings toggle.**

- **XP** — does not exist. A case-insensitive search for `\bxp\b` across all 58,015 lines returns zero standalone matches; the only `xp` substrings are inside unrelated identifiers. There is no points value, no accrual, no XP storage key (208-209).
- **Levels** — do not exist. No level, rank, tier or prestige system anywhere; the only `rank` matches are `compoundRank` (4530, 30043), `rankFoodResults`/`ranked` in food search (39304-39353, 39485-39511) and a comment about "rankable anchors" for check-ins (52361). None are user-facing progression.
- **Clans / social / guilds** — do not exist. Zero matches for `clan`. There is no social graph, no group, no friends list in the file.
- **Leaderboards** — do not exist. Zero matches for `leaderboard`. Nothing compares the user to any other user.
- **Achievements** — the word appears once, at 33045, and only as settings subtitle copy: `"Show the streak counter and achievement badges"`. There is no achievements engine; that copy refers to F-GAME-002.
- **Streaks (44 matches, F-GAME-001)** — real but derived and hidden by default. Computed twice, independently: a 30-iteration-capped backward walk over `lk_history` in the Home dashboard (26237-26252) and an uncapped walk over a date set (1458-1466, exported in the push payload at 1545). Displayed in exactly two places, both gated: the Home streak card (26423-26452) and the profile header chip (26510-26531), each behind `streak > 0 && ld("gamingLayer", false)`. **Never stored** — no streak key exists (208-209); it is recomputed from workout history on every render, so it cannot be gamed or lost independently of the history. Two unrelated streak counters exist for supplements (`getSuppStreak`, 46148-46159, shown at 46459-46465 and 46915-46924) and for cycle compounds (`getCompoundStreak`, 47289-47301, shown at 48004-48013); **these are not gated by `gamingLayer`** and are always visible. Notably the app argues against streak psychology in two places: the coach system prompt forbids using a streak as pressure (49124) and a design comment states "No streak counter, no streak language — a missed day is a data point" (52601).
- **Badges (35 matches, F-GAME-002)** — real earned badges, but thin, derived and hidden by default. Seven conditions computed inline on the Progress screen from workout count, PR count and total sets: First Rep ≥1 workout, 5/10/25 Workouts, First PR, 5 PRs, 100 Sets (30166-30208), plus up to three greyed "locked" placeholders with "N more to go" (30209-30227, rendered 30469-30500). **Never persisted, no earn timestamp, no unlock moment** — no toast, notification or animation fires when the threshold is crossed; the tile simply exists on next render. The whole block is behind `ld("gamingLayer", false)` (30396). Of the 35 matches only 30161-30500 are the badge system: the rest are the grey "not yet earned" constant `LOCKED_BADGE` (2027-2029), a metaphorical use in cycle-tracking education copy (25954), a table-row field also called `badge` in the PR-estimate table (29461-29512), a pro badge in the paywall (682), an estimate-confidence badge comment (57077), the settings label (33039-33053) and comments (474, 4298).
- **Off-toggle** — **yes, one exists, and the brief has its polarity backwards.** Profile > Settings, "Streaks and badges" / "Show the streak counter and achievement badges", writes `lk_gamingLayer` (33036-33080, write at 33049). Every consumer reads `ld("gamingLayer", false)` and the settings state seeds from `ld("gamingLayer", false)` (26423, 26510, 30396, 32066-32067). **The default is `false`**, so gamification is opt-in, not opt-out: a fresh install shows no streak card, no profile streak chip and no Badges section at all. The tutorial nonetheless tells first-run users "The Home tab is your dashboard — streak, history, weekly stats all here" and "The calendar and streak card update every time you finish a workout" (54233), describing UI they will not see until they turn the toggle on. That is a live content bug.

**Bottom line for the redesign team: the "XP, clans" line in the project brief is unsupported by the code. What actually ships is (a) a derived consecutive-training-day counter, (b) seven threshold badges, (c) two ungated habit streaks for supplements and cycle compounds — all of it opt-in, none of it persisted, none of it social, none of it points-based.**

---

## Voice pipeline

**Permissions.** `navigator.mediaDevices.getUserMedia({ audio: true })` is called only at record time, inside `startRec` (53726-53728) — no pre-flight `permissions.query`, no priming screen. On rejection (denied, insecure context, or no device) the `.catch` shows the toast "Microphone access denied. Allow the microphone in browser settings." (53747-53749) and leaves `recording` false. There is no permanent-denial detection, no deep link to browser settings, and no `MediaRecorder`/`mediaDevices` feature detection — on a browser without either, the call throws into the same generic catch.

**Capture.** `new MediaRecorder(stream)` with default options (53730). Chunks accumulate in `chunksRef` via `ondataavailable` when `e.data.size > 0` (53734-53736). No timeslice argument, so one blob is emitted at stop. No duration cap, no size cap, no silence detection, no waveform/level meter.

**Teardown.** `mr.onstop` calls `stream.getTracks().forEach(t => t.stop())` — the mic indicator is released before upload (53737-53740).

**Encoding.** `new Blob(chunksRef.current, { type: "audio/webm" })` (53741-53743). This label is asserted, not read from `mr.mimeType` — on Safari/iOS MediaRecorder produces mp4/aac and the upload is mislabelled. **Security/robustness finding.**

**Upload.** `sendAudio(blob)` (53761-53780):
- Method: `POST`
- URL: `https://lockedapi.cescocugliari.workers.dev/voice` (53766) — a hardcoded Cloudflare Worker origin, no env/config indirection, no versioning
- Body: `FormData` with a single field `audio`, filename `"voice.webm"` (53763-53765)
- Headers: none set — the browser supplies the multipart boundary
- Auth: **none.** No bearer token, no user id, no session cookie (`credentials` is not set, so same-origin default = omitted cross-origin). The endpoint is unauthenticated from the client's point of view. **Security finding: an open, unauthenticated transcription endpoint on a personal-domain Worker; anyone can POST arbitrary audio to it and consume the owner's model quota.**
- Timeout: none; no AbortController.
- Retry: none.

**Response contract** (inferred from every consumption site; the Worker source is not in this repo):
```
{
  transcription: string,          // 54109
  action: "add_shopping" | "log_meal" | "log_water" | "log_purchase"
        | "log_workout" | "log_cardio" | "unknown",   // 53479-53577, 54111
  data: {                          // shape varies by action, 53447-53463 + 53476-53619
    // add_shopping
    items: [{ name, quantity, unit }],
    // log_meal
    name, slot, calories, protein, carbs, fat,
    // log_water
    glasses,
    // log_purchase
    amount, store, note, items,
    // log_workout
    name, minutes, sets, volume,
    // log_cardio
    activity|modality|name, durationSec|minutes|duration,
    distance|distanceM, distanceUnit|unit, watts, heartRate|hr,
    rpe, incline, surface, notes
  }
}
```
Parsed with `r.json()` (53768-53770) — no status check, so a 4xx/5xx returning JSON is treated as a successful result and a non-JSON error body falls into the catch.

**Result handling.** `setProcessing(false); setResult(d); setShowModal(true)` (53771-53774) — the sheet always opens, even for `action: "unknown"`, where it shows the transcription plus the hint copy and hides Confirm (54141-54150, 54194). Confirm runs `executeVoiceAction` entirely client-side against localStorage (F-MISC-006).

**Errors.** Network failure or a JSON parse throw → `setProcessing(false)` + toast "Voice processing failed. Check your connection and retry." (53775-53778). There is no offline pre-check, no queue, and the recording is discarded — the user must speak again.

**AI details.** Model, prompt and transcription provider all live in the Worker and **do not appear in this file** — UNVERIFIED. The source comment at 53621-53627 states the model is instructed not to guess calories and to report only what was said, which is the only visible evidence about the prompt.

---

## Plate calculator math

**This is a manual stacker, not a solver.** The user taps plates; the app sums them. There is no "enter a target weight, get a loading" path in `PlateCalc` (54925-55508).

**Bar inventory** — `BARS` (5332-5366), selected via `getBar(barId)` (5371-5374), default `"oly"` (54929):

| id | name | kg | lb | offset |
|---|---|---|---|---|
| `oly` | Olympic Bar | 20 | 45 | 0 |
| `wmn` | Women's Bar | 15 | 35 | 0 |
| `ez` | EZ Curl Bar | 10 | 25 | 0 |
| `trap` | Trap Bar | 25 | 55 | 0 |
| `smith` | Smith Machine | 7 | 15 | 0 |
| `none` | No Bar | 0 | 0 | 0 |

Every `offset` is 0, so the field is dead weight here (`PlateCalc` never reads `bar.offset`; only the unused `calcPlatesPerSide` at 5376+ does).

**Plate inventory** — defined locally inside the component, unlimited quantity of each (54935-54937):
- `KG_OPTS = [1.25, 2.5, 5, 10, 15, 20, 25]`
- `LB_OPTS = [2.5, 5, 10, 15, 25, 35, 45]`

Note these differ from the module-level `PLATES_KG = [25,20,15,10,5,2.5,1.25,0.5]` and `PLATES_LB = [45,35,25,15,10,5,2.5]` (5367-5368) — the kg list here **omits 0.5 kg**, and the two lists are in opposite sort order. Duplicated inventory, one of the two definitions unused by this screen.

**The math** (55021-55024):
```
barW       = unit === "lb" ? bar.lb : bar.kg
platesSum  = sum(addedPlates)                 // what the user tapped
totalWeight = barW + (perSide ? platesSum * 2 : platesSum)
```
`addedPlates` is kept sorted descending on every add (55013-55015). `counts` is a tally used for the "N× 25kg /side" chips (55025-55030). `fmt(n)` = `n.toFixed(2)` with trailing zeros stripped (55031-55034).

**Unit switching** (55117-55131): each existing plate is converted (`×2.20462` kg→lb, `÷2.20462` lb→kg) and then snapped to the **nearest** entry in the new option list via a `reduce` on absolute difference, then re-sorted descending. Lossy: 1.25 kg → nearest lb option is 2.5 lb (2.755 actual), and converting back gives 1.25 kg only by luck; 15 kg → 35 lb (33.07 actual) and back → 15 kg, but 20 kg → 45 lb (44.09) and back → 20 kg. The *displayed total changes* on every unit switch because the plates are re-quantised, not merely re-labelled. This is a real usability bug.

**Apply to next set** (54940-54983): scans `p.rows` in order for the first `row.sets[i]` with falsy `done` (labelled loop `outer:`). On apply, converts the calculator's unit into the workout's unit (`p.useKg !== false`) with the same 2.20462 constant, rounds to 2 dp, and merges `{ w: weightStr, rec: false }` into that set through `p.setRows` (54956-54978). `rec: false` clears any "recommended weight" marker. Success flashes for 1800 ms (54979-54982).

**Plate visuals** — `pColor` (54984-55004) is IPF/IWF-convention hardcoded hex: lb 45 red / 35 blue / 25 yellow / 15 green / 10 orange / 5 white / else muted; kg 25 red / 20 blue / 15 yellow / 10 green / 5 white / 2.5 muted / else `#C084FC`. `pH` (55005-55007) and `pW` (55008-55010) are per-unit height/width ladders. Barbell render: sleeve caps `#52525B`, knurl `#374151`/`#1F2937`, left plates reversed and clickable, right plates mirrored and inert (55238-55295).

---

## Refeed logic

**Trigger** — `checkRefeedTrigger(weightLog, fuelProfile)` (2936-2965). All must hold:
1. `fuelProfile.goal === "cut"` (2937) — no refeed on maintain or bulk.
2. `weightLog.length >= 3` (2938).
3. Not dismissed within the last 5 days: `lk_refeedDismissed` is an ISO timestamp; `daysAgo < 5` → false (2939-2943).
4. Not already accepted today: `lk_refeedAccepted === isoDay()` → false (2944-2946).
5. The last three entries (after ascending date sort, 2947-2951) must **each be a new all-time low** — for each of the three, `currentKg` must be strictly less than the minimum of every entry dated before it (2952-2964). Special case: if the first of the three has no prior entries at all, that day is skipped rather than failing (2957). If any later one has no priors, the check fails (2958).

So the card only fires on three consecutive all-time-low weigh-ins while cutting — not merely three decreasing days.

**Carb math** — `calcRefeedCarbs(fuelProfile)` (2966-2974), reading `fuelProfile.tdee` (default 2200) and `fuelProfile.weightKg` (default 80):
```
base = 50
if (tdee > 2500)  base = 75
if (tdee > 3000)  base = 100
if (weightKg > 90) base += 15
return Math.round(base)
```
Result set: 50, 65, 75, 90, 100, 115 g. Call site falls back to a literal `75` when there is no fuel profile (36999).

**Consequence of accepting.** `acceptRefeed` writes `lk_refeedAccepted = todayISO`, sets `refeedActive`, hides the card, and logs beta activity (37025-37032). It does **not** modify the day's carb target — the "+Xg carbs" figure at 53275-53285 is informational only, and the only visible after-effect is the amber "refeed active" strip (37306-37320). Flag this to the redesign team: the feature promises a macro change it does not make.

**Dismissing.** `dismissRefeed` writes `lk_refeedDismissed = new Date().toISOString()` and logs beta activity (37033-37037); the 5-day cooldown at 2939-2943 consumes it.

---

## Storage keys touched

All keys are `lk_`-prefixed via `ld`/`sd`; the canonical list is at 208-209.

| Key | Read at | Written at | By |
|---|---|---|---|
| `lk_weightLog` | 2909 (`getWeightLog`), 53690 | 2932 (`addWeightEntry`) | F-MISC-002, F-MISC-001, F-MISC-006 |
| `lk_refeedAccepted` | 2944, 36920 | 37026 | F-MISC-001 |
| `lk_refeedDismissed` | 2939 | 37034 | F-MISC-001 |
| `lk_fuelProfile` | 36913, 53688 | — (elsewhere) | F-MISC-001, F-MISC-006 |
| `lk_voiceEnabled` | 32061, 53702, 53706 | 33263 | F-MISC-007 |
| `lk_voiceBtnCorner` | 53841, 53848 | 54001 | F-MISC-004 |
| `lk_tutorialSeen` | 57220 | 54284, 54369, 57757 | F-MISC-008 |
| `lk_fuelLog` | 53490, 53516 | 53506, 53531 | F-MISC-006 |
| `lk_history` | 53565, 53580 | 53573, 53587 | F-MISC-006 |
| `lk_profile` | 53683, 53688, 53693 | — | F-MISC-006 |
| `lk_gamingLayer` | 26423, 26510, 30396, 32067 | 33049 | F-GAME-001/002/003 |
| budget data | `getBudgetData()` 53538 | `saveBudgetData()` 53549 | F-MISC-006 |
| shopping list | via `addShoppingItem` 53484 | same | F-MISC-006 |
| **none** | — | — | `PlateCalc` persists nothing (54928-54932) |

Custom window events dispatched: `lockedFuelUpdate` (53509, 53533), `lockedHistoryUpdate` (53574, 53588). Listened for: `lockedVoiceToggle`, `storage` (53709-53710), `lockedBottomBar`, `resize` (53853-53854, 53937). Global read: `window.__lkBottomBar` (53811). Global DOM id: `lockedVoiceToast` (53467, 57961).

---

## Security findings

1. **Unauthenticated third-party AI endpoint.** `https://lockedapi.cescocugliari.workers.dev/voice` (53766) is called with no auth header, no token and no user identifier. Variable name: none — the URL is an inline string literal. Value is not a secret so nothing to redact, but the endpoint is an open, abusable proxy to a paid transcription/LLM backend on a personal Cloudflare account. Recommend signed requests or Supabase-session auth in the redesign.
2. **No response status validation.** `sendAudio` calls `r.json()` without checking `r.ok` (53768-53770), so a server error body shaped like JSON is rendered to the user as a transcription result.
3. **Unbounded upload.** No recording duration or blob size limit (53730-53743) — a stuck recording uploads arbitrarily large audio.
4. No hardcoded API keys, tokens or secrets were found anywhere in range 53210-55509.

---

## Open questions / UNVERIFIED

1. **The /voice Worker's model, provider and prompt.** Not in this file. Confirmed only by the comment at 53621-53627 that the prompt forbids guessing calories. To confirm: read the Worker source, or `mcp__Cloudflare_Developer_Platform__workers_get_worker_code` for the `lockedapi` worker.
2. **Actual response JSON shape.** Reconstructed purely from consumption sites (53447-53463, 53476-53619, 54105-54150). To confirm: capture one real `/voice` response, or read the Worker.
3. **Does accepting a refeed change the day's macro targets anywhere outside 36999-37320?** I found no such write. To confirm: a full-file trace of `refeedActive` and `refeedCarbs` consumers — my grep shows only 36999, 37026, 37029, 37304, 37306.
4. **Safari/iOS voice capture.** `MediaRecorder` without a mimeType, blob labelled `audio/webm` (53730, 53741). To confirm: record on iOS Safari and inspect `mr.mimeType` and the Worker's received Content-Type.
5. **`lk_gamingLayer` cross-tab propagation.** Consumers call `ld()` inline during render (26423, 26510, 30396) with no subscription. To confirm: toggle in one tab and observe whether the other tab's Home/Progress screens update without a manual re-render.
6. **`WeightLogCard` "Logged today" with a back-dated entry.** Uses `weightLog[weightLog.length - 1]` (53388) after a date sort (2927-2929). No UI path produces a back-dated entry, so this is latent. To confirm: inject a future-dated entry into `lk_weightLog` and re-open the Fuel screen.
7. **Is the Progress-screen badge block reachable at all for a new user?** Both the badge grid and its "Log your first workout to earn a badge." empty state are inside the `gamingLayer` gate (30396), so the empty state can only be seen by someone who enabled the toggle before their first workout. To confirm: fresh profile, toggle on, open Progress.
8. **Tutorial replay.** `lk_tutorialSeen` is written on mount (54284) and there is no reset control anywhere (only occurrences: 208, 54283, 54369, 57220, 57757). To confirm: search the settings screen for any "replay tutorial" affordance — I found none.
