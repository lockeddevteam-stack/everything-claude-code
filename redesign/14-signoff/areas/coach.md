### F-COACH-001 — Coach screen shell: four panes, tabs, swipe, deep links
- location: Coach tab > CoachScreen > header + tablist
- user action: taps one of Chat / Plan / Check-In / Setup, or swipes horizontally, or arrives from a notification deep link.
- behaviour: 1. `coachTab` state defaults to `"chat"` (49973). 2. Tablist renders four tabs `[["chat","Chat"],["plan","Plan"],["check-in","Check-In"],["instructions","Setup"]]` (50899-50944). 3. The Check-In tab shows an accent dot when `!checkinDoneForDay(ld("feedback",[]))` (50905, helper 52459). 4. Touch handlers implement a velocity-projected horizontal swipe: gesture must be ≥2× more horizontal than vertical, projected distance ≥64px, moving one step through `PANE_ORDER = ["chat","plan","check-in","instructions"]` (50750-50784, order at 50753). 5. A deep link sets `window.__lockedCoachPane` or dispatches a `lockedCoachPane` event; `toPane` accepts only the four names (49991-50004). 6. The chat composer's measured height is published to `window.__lkBottomBar` and a `lockedBottomBar` event fires, so the floating voice button parks clear of it (50029-50043).
- v6 status: WORKING

### F-COACH-002 — Coach chat — send a message
- location: Coach > Chat > composer textarea + send button
- user action: types in the textarea and taps send, or presses Enter (Shift+Enter newlines).
- behaviour: 1. `send(prefill)` trims the message, returns early if empty or `loading` (52123-52133). 2. Input clears; the user's row is appended to `msgs` optimistically; `{role:"user",content:msg}` is pushed to `histRef.current` (52127-52132). 3. `fireRequest()` sets `loading`, creates an `AbortController` (guarded in try/catch), finds the last user turn in `histRef` (50052-50060). 4. POST to `https://lockedapi.cescocugliari.workers.dev/` with `authHeaders()` and body `{system: buildContext(lastUser), max_tokens: 1000, messages: histRef.current}` (50061-50070). 5. `r.status===429` throws `{kind:"limit"}`; any other non-ok throws `{kind:"server"}` (50072-50074). 6. On success `handleReply(d)` parses markers and appends the assistant row (50077, 50159-50322). 7. `useEffect` on `msgs` persists `coachLastMsgs` and `coachLastHist` capped at the last 40 entries, and auto-scrolls only when `nearBottomRef.current` (49924-49933).
- v6 status: WORKING

### F-COACH-003 — Chat error rows, retry, and paywall hand-off
- location: Coach > Chat > error bubble under a failed turn
- user action: taps "Retry" / "Continue" / "See plans" on a red error bubble.
- behaviour: 1. Errors append `{role:"assistant", error:true, errKind, text}` (50091-50093). 2. The bubble renders red-tinted and its button label depends on `errKind`: `limit` → "See plans", `stopped` → "Continue", otherwise "Retry" (51380-51393). 3. `limit` calls `window.LOCKED.paywall()`; others call `retryLast()` (51381-51383). 4. `retryLast` early-returns while `loading`, strips all `error` rows from `msgs`, then re-fires (50104-50117).
- v6 status: WORKING

### F-COACH-004 — Stop generation
- location: Coach > Chat > composer, send button replaced by a stop square while loading
- user action: taps the red stop button.
- behaviour: `stopGeneration()` sets `silentAbortRef` false and aborts the controller (50121-50124); the abort surfaces as `errKind:"stopped"` with the text "Stopped." and a "Continue" button (50084-50088, 51383).
- v6 status: WORKING

### F-COACH-005 — Edit a sent message and re-run from there
- location: Coach > Chat > "Edit · re-runs from here" under a user bubble
- user action: taps Edit under their own message.
- behaviour: 1. `editUserMessage(idx)` bails unless the row is a user row (50127-50129). 2. If a reply is in flight it silently aborts (`stopGeneration(true)`) so the answer cannot graft onto a truncated history (50130-50134). 3. Counts non-error user rows up to `idx`, finds the matching index in `histRef`, truncates `histRef` and `msgs` there, and loads the old text back into the composer (50135-50148).
- v6 status: WORKING

### F-COACH-006 — Copy reply / retry last reply
- location: Coach > Chat > "Copy" and "Retry" under an assistant reply
- user action: taps Copy (any reply) or Retry (last reply only, when not loading).
- behaviour: Copy writes `m.text` to `navigator.clipboard` inside try/catch (51404-51406). Retry pops the trailing assistant turn off `histRef`, truncates `msgs` to before that reply, and calls `fireRequest()` (51414-51421).
- v6 status: WORKING

### F-COACH-007 — Empty-state opener + suggestion chips + dismiss
- location: Coach > Chat, when `msgs.length === 0`
- user action: taps a generated suggestion chip, or its "×" to dismiss it.
- behaviour: 1. `coachOpener({history, prs})` produces `{line, chips}` from real data — six prioritised rules (red check-in, trained in last 12h, phase ending, stalled lift, nothing eaten after 2pm, goal fallback), topped up to 6 chips from staples (49277-49384; called at 51260). 2. Chips filtered against `dismissedChips`; tapping one calls `logBetaActivity("coach_chip_used",{q})` then `send(q)` (51269-51276). 3. "×" appends the chip to `dismissedChips` (session-only, not persisted) (51278-51287). 4. A footer disclaimer renders: "AI coaching can be wrong. Sanity-check anything that affects your health." (51319-51322).
- v6 status: WORKING

### F-COACH-008 — Context receipt ("Your coach can see N things about you")
- location: Coach > Chat empty state > shield row
- user action: taps the row to expand; taps "Change what it sees →".
- behaviour: `coachVisibleData()` lists the enabled `COACH_DATA_KEYS` labels plus "Your saved memories" and "Your instructions" when present (49388-49398); count rendered inline (51294); expanded list at 51302-51310; the link switches `coachTab` to `"instructions"` (51311-51318).
- v6 status: PARTIAL

### F-COACH-009 — Reply parsing — structured action markers
- location: Coach > Chat (invisible; drives the action cards)
- user action: none directly; triggered by every assistant reply. - Behavior (`handleReply`, 50159-50322), in order: 1. `txt = d.content[0].text`, falling back to `"Try again."` when empty (50160-50163). 2. Push `{role:"assistant",content:txt}` into `histRef` (50164-50167). 3. `###PROGRAM_START###…###PROGRAM_END###` → `JSON.parse` → `detectedSplit` (50168-50176). Fallback heuristic: search for the literal `"splits"`, back up to the previous `{`, parse from there (50177-50189). 4. `###RECIPE_START###/###RECIPE_END###` → `detectedRecipe`, with an equivalent `"ingredients"` fallback requiring both `ingredients` and `steps` (50190-50213). 5. `###GOAL_START###/###GOAL_END###` → `detectedGoal` (50200-50212). 6. `###FOOD_START###/###FOOD_END###` → `detectedFood`, validated: every item must have a `name` and a numeric `cal` in 0..2000 or the whole payload is dropped (50214-50239). 7. `###PLAN_START###/###PLAN_END###` → `detectedPlan` (50241-50255). 8. `###INSTRUCTIONS_START###/###INSTRUCTIONS_END###` → `detectedInstructions` (plain text, not JSON) (50256-50266). 9. `###CARDIO_START###/###CARDIO_END###` → `detectedCardio`, accepted only if `parsedCardioSeconds(pc) > 0` (50267-50281). 10. `###REMEMBER###…###/REMEMBER###` → saved to memory immediately if `coachMemoryOn()` (50285-50295). 11. `###SHOPPING_ADD###…###/SHOPPING_ADD###` → `parseShoppingFromCoach` → opens the approval modal (50296-50311). 12. A catch-all `displayTxt.replace(/###\w+_START###[\s\S]*?###\w+_END###/g,"")` strips leftover markers; if nothing survives, `displayTxt = "Done!"` (50238-50240). 13. `actionCount` = number of non-null detections; `saveAll: actionCount >= 3` (50282-50284, 50318).
- behaviour: 
- v6 status: WORKING

### F-COACH-010 — Action card — save a training split
- location: Coach > Chat > orange split card under a reply
- user action: taps "ADD TO TRAIN TAB".
- behaviour: `saveCoachSplit(prog)` (50324-50372) either flattens N single-day splits into one multi-day split (when `allSingle && prog.splits.length >= 2`) or maps each split through with its days; ids are `"s"+Date.now()` (+`i*997` for the multi case); appended via `p.setSplits`; `savedMsg` banner "Split saved to Train tab" for 3s. The card then flags `savedSplit:true` so the button is permanently disabled (51459-51472).
- v6 status: WORKING

### F-COACH-011 — Action card — save a recipe / add ingredients to shopping
- location: Coach > Chat > green recipe card
- user action: taps "OPEN IN FUEL" or "ADD TO SHOP".
- behaviour: `saveCoachRecipe` (50373-50396) appends `{id:"cr"+Date.now(), name, description, cal, pro, carb, fat, ingredients, steps, created}` to `lk_coachRecipes`, shows "Recipe saved to Fuel tab!", and logs `coach_recipe_saved`. "ADD TO SHOP" loops the ingredients, normalises `{amount, item|name}` into a string, runs `parseIngredient`, then `addShoppingItem(name, quantity, unit)` (51565-51578).
- v6 status: WORKING

### F-COACH-012 — Action card — create a goal
- location: Coach > Chat > goal card
- user action: taps "ADD TO GOALS".
- behaviour: `saveCoachGoal` (50397-50450) resolves the current value from `p.prs` (best `w`, converted with `liftDisp`), `getWeightLog()` or `getBfLog()` depending on `goalData.type`; builds the entry with defaults (`unit` falls back to `%` for bf else kg/lb), pushes to `lk_goals`, shows "Goal added to Progress!", logs `coach_goal_created`.
- v6 status: WORKING

### F-COACH-013 — Action card — log food
- location: Coach > Chat > blue food card
- user action: taps "LOG TO FUEL".
- behaviour: `saveCoachFood` (50478-50520) reads `lk_fuelLog`, gets/creates today's `{meals:{breakfast,lunch,dinner,snacks}, water:0}`, appends each item into `foodData.meal` (default `"snacks"`), writes back, shows "N items logged to <meal> (X cal)!", logs `coach_food_logged`.
- v6 status: WORKING

### F-COACH-014 — Action card — log cardio (CoachCardioCard)
- location: Coach > Chat > cardio card
- user action: taps "LOG CARDIO" (once).
- behaviour: 1. `CoachCardioCard` builds a record with `buildParsedCardioRecord(p.data)` inside try/catch; returns `null` if it fails (49401-49404). 2. Renders activity icon, duration in minutes, distance converted to km/mi from `ld("profile",{}).useKg !== false`, avg watts, and a calorie estimate with a range and a method label (`CE_METHOD_LABEL`) (49405-49437). 3. Tapping calls `p.onSave()` once and locks to "✓ LOGGED" via local `done` state (49438-49447). 4. `saveCoachCardio(data)` (50467-50477) rebuilds the record, toasts an error if it cannot ("I couldn't tell how long that session was"), otherwise prepends to history via `p.setHistory` and toasts "Logged <name>, N min".
- v6 status: WORKING

### F-COACH-015 — Action card — save a training plan
- location: Coach > Chat > plan card
- user action: taps "SAVE PLAN".
- behaviour: `saveCoachPlan` (50521-50537) builds `{name, description, startDate (default `isoDay()`), phases, created, updatedAt}`, stores via `setPlan` → `sd("coachPlan", …)` (50069-50072 region: `setPlan` at 50100? see 49999) , shows "Plan saved to Coach!", logs `coach_plan_saved`.
- v6 status: WORKING

### F-COACH-016 — Action card — save coaching instructions from chat
- location: Coach > Chat > "COACHING PROFILE" card
- user action: taps "SAVE INSTRUCTIONS".
- behaviour: preview shows the first 140 chars (52007); tapping calls `applyCoachInstructions(text)` which writes `lk_coachInstructions`, updates both `instructions` and `instrDraft`, and shows "Coaching instructions saved!" for 3s (50033-50042).
- v6 status: WORKING

### F-COACH-017 — "SAVE ALL (N ACTIONS)"
- location: Coach > Chat, shown when a reply carried ≥3 actions
- user action: taps the SAVE ALL bar.
- behaviour: flags the message `savedAll` plus every per-card flag, then runs `saveCoachSplit`, `saveCoachRecipe`, `saveCoachGoal`, `saveCoachFood`, `saveCoachCardio`, `saveCoachPlan`, `applyCoachInstructions` for whichever payloads exist (52035-52061).
- v6 status: WORKING

### F-COACH-018 — Shopping-list approval modal
- location: Coach > Chat > full-screen modal
- user action: unchecks items, taps IMPORT or CANCEL (or Escape).
- behaviour: 1. On a `###SHOPPING_ADD###` reply, `parseShoppingFromCoach` splits the block on commas and trims (50451-50466); `setShoppingApproval({items, context: lastLineBeforeMarker})` (50302-50310). 2. Modal renders via `lkPortal` with per-item checkboxes defaulting to checked (52252-52340). 3. IMPORT runs each selected item through `parseItemWithQuantity` (= `parseIngredient`, 50464-50466) then `addShoppingItem(name, quantity, unit)` and closes (52310-52327). 4. `useEscape(shoppingApproval ? close : null)` closes it with Escape (50037-50039... see 49999-50001).
- v6 status: WORKING

### F-COACH-019 — Remembered-fact chip with Undo
- location: Coach > Chat > blue "Saved to memory" pill under a reply
- user action: taps "Undo".
- behaviour: a `###REMEMBER###` fact is saved immediately (only when `coachMemoryOn()`), the pill renders, and Undo filters the memory list by matching `text` + `date` and marks the message `rememberUndone` (50285-50295, 51425-51435).
- v6 status: WORKING

### F-COACH-020 — New chat (delete conversation)
- location: Coach > header > "New chat" (only when `msgs.length > 0`)
- user action: taps it twice.
- behaviour: `clearConvo` requires a second tap via `lkConfirm("clearConvo", "Tap again to delete this conversation.")`, then empties `msgs`, `histRef`, and both storage keys (49935-49946; button 50880-50897).
- v6 status: WORKING

### F-COACH-021 — Rename the coach
- location: Coach > header > pencil next to the coach name
- user action: taps ✎, types a name, presses Enter or Save.
- behaviour: `saveCoachName` trims to 24 chars, calls `p.updateProfile({coachName: n || null})`, logs `coach_renamed` when non-empty, exits edit mode (50006-50013). The name renders as the `<h1>` with fallback "Coach" (50846-50852).
- v6 status: WORKING

### F-COACH-022 — Jump to latest / smart auto-scroll
- location: Coach > Chat > floating pill above the composer
- user action: scrolls up (pill appears), taps "Jump to latest ↓".
- behaviour: `onScroll` sets `nearBottom` when within 100px of the bottom (51204-51210); the msgs effect only auto-scrolls when `nearBottomRef.current` (49929-49932); the pill resets both and scrolls to the bottom (52062-52078).
- v6 status: WORKING

### F-COACH-023 — "Earlier messages trimmed" notice
- location: Coach > Chat, above the transcript
- user action: 
- behaviour: rendered whenever `msgs.length >= 40` (51323-51328); the persistence effect keeps only `slice(-40)` of both msgs and history (49926-49927).
- v6 status: WORKING

### F-COACH-024 — Setup pane — "About you" free-text instructions
- location: Coach > Setup > ABOUT YOU
- user action: types into the textarea (max 2000 chars), taps Save, or taps a "+ quick" chip.
- behaviour: `p.setInstrDraft` on change; the counter shows `length / 2000` (49543-49548); Save is disabled while draft === saved (49550); `saveInstructions` writes `lk_coachInstructions`, sets the saved flag for 2s, and logs `coach_instructions_updated` with `{length}` (50023-50032). Five quick chips (`QUICK` at 49505-49506: "I train fasted", "Short answers only", "I have a home gym", "Knees are dodgy", "Vegetarian") append `"<chip>."` on a new line (49564-49572).
- v6 status: WORKING

### F-COACH-025 — Setup pane — coaching style / persona
- location: Coach > Setup > COACHING STYLE
- user action: taps one of seven persona buttons.
- behaviour: writes `lk_coachStyle`, updates local state, logs `logBetaActivity("persona_changed",{id})` (49584-49586). The eight-line `COACH_STYLES` array (48950-48967) carries `{id, name, desc, tone}`; `coachStyle()` resolves by id with a `"warm"` default (48968-48978) and the `tone` string is spliced into the system prompt head (49023). - Personas: Direct, Warm (default), Technical, Teacher, Hype, Performance (`athlete`), Physiology-Aware (`physio`) — seven entries (48950-48967).
- v6 status: WORKING

### F-COACH-026 — Setup pane — memory list, add, delete, clear, master switch
- location: Coach > Setup > MEMORY
- user action: toggles the switch, types a memory + Enter/Add, taps "×" on an item, taps "Clear all" twice.
- behaviour: 1. Toggle writes `lk_coachMemoryOn`; when off the section shows "Off. Nothing here is sent to the coach." and the whole list is hidden and excluded from the prompt (49606-49638, prompt guard 49032). 2. Items render with `text` plus a provenance line `src` ("added earlier" / "added by you, <date>" / "from your chat, <date>") (49499-49503, 49645-49660). 3. Delete filters by strict identity on the raw item (`x !== m._raw`) (49662-49667). 4. Add appends `{text, src:"added by you, <locale date>", date: ISO}` on Enter or the Add button (49682-49712). 5. "Clear all" is a two-tap confirm using local `confirmClear` (49713-49728).
- v6 status: WORKING

### F-COACH-027 — Setup pane — "What your coach can see" data switches
- location: Coach > Setup > WHAT YOUR COACH CAN SEE (collapsed by default)
- user action: toggles any of nine switches.
- behaviour: `setDataPref(key,v)` clones the prefs object, writes `lk_coachDataPrefs`, updates state (49489-49495). `coachDataPrefs()` defaults every key to true unless explicitly `false` (48931-48937). Keys: training, nutrition, weight, checkins, supplements, cycle, bodyfat, goals, plan (48920-48930). Every tier of `coachBuildContext` is gated on these (49036, 49046, 49062, 49096, 49146, 49166, 49173, 49180, 49186, 49206, 49216, 49239).
- v6 status: WORKING

### F-COACH-028 — Coach interview (six questions → AI-written instructions)
- location: Coach > Setup > "Let the coach interview you" → bottom-sheet dialog
- user action: taps an option or types a free answer for each of six questions; then Edit first / Save / Retry / close.
- behaviour: 1. `COACH_INTERVIEW_QS` — six questions with tappable options (49735-49749): training-for, years training, injuries, tone preference, why they quit before, anything else. 2. `answer(text)` appends `{q,a}`, clears the free field, advances, and on the last one calls `generate(next)` (49756-49763). 3. `generate` sets `phase="writing"` and POSTs to the Worker root with `max_tokens: 600` and its own system prompt (49764-49793) — see "THE AI CONTRACT". 4. Response: extracts between `###INSTRUCTIONS_START###` and `###INSTRUCTIONS_END###`, falling back to the whole trimmed text; empty → throw → `phase="error"` (49783-49792). 5. Preview phase shows the draft in a scrollable box with "Edit first" (loads it into `instrDraft` and switches to the Setup tab) and "Save" (`applyCoachInstructions`) (49888-49911; wiring at 52260-52272). 6. Error phase: "The coach is down. Not your fault — your answers are kept." with a Retry that re-runs `generate(answers)` (49869-49886).
- v6 status: WORKING

### F-COACH-029 — Plan pane — empty state
- location: Coach > Plan, when `lk_coachPlan` is null
- user action: taps "Ask the coach for one".
- behaviour: switches to Chat and pre-fills the composer with "Build me a training plan around my current goal" (50968-50982).
- v6 status: WORKING

### F-COACH-030 — Plan pane — this week, overall progress, phase timeline
- location: Coach > Plan, with a plan saved
- user action: 
- behaviour: 1. `getCurrentPhase()` computes the week number from `plan.startDate` and finds the phase whose `weekStart..weekEnd` contains it (50539-50553). 2. "THIS WEEK" card names phase X of N, week Y of Z, prints `trainingNotes || focus`, with a special deload copy when the phase name/focus contains "deload"/"recovery week"/"taper" (`isDeload`, 51012-51015); session dots compare lifting sessions since Monday against the first split's non-empty day count (51017-51033, 51127-51150). 3. "Overall" bar = mean of `calcPhaseProgress` across phases (50743-50749, 51152-51182). 4. `calcPhaseProgress` = 40% elapsed time + 60% mean target progress, clamped 0-100; phases before the current one return 100, later ones 0 (50718-50742). The blend ratio is shown to the user ("40% time, 60% targets", 51281-51284 region 51285). 5. Timeline renders at most 7 phases with done/current/upcoming states and a "+N more phases" line (51184-51261, cap at 51186 and 51248). 6. Each phase expands to weeks, notes, nutrition notes and per-target progress bars.
- v6 status: WORKING

### F-COACH-031 — Plan pane — phase/plan review prompt
- location: Coach > Plan > green "Review with coach" card
- user action: taps it when the plan has finished or its current phase is in its last week.
- behaviour: switches to Chat and pre-fills one of two prompts naming the plan or the phase (51083-51102). `planOver` is computed from the last phase's `weekEnd` (51001-51007); `phaseDone` when `cp.currentWeek === cp.phase.weekEnd` (51008-51011).
- v6 status: WORKING

### F-COACH-032 — Plan pane — adjust plan / delete plan
- location: Coach > Plan > footer
- user action: taps "Adjust this plan" or the trash icon.
- behaviour: Adjust switches to Chat with a long pre-filled prompt naming the plan, the current phase, its week range and focus, ending in "Here's what I want to change: " (51253-51272). Delete uses a raw `confirm("Delete your current plan?")` then `setPlan(null)` (51288-51291).
- v6 status: WORKING

### F-COACH-033 — Daily check-in — the form
- location: Coach > Check-In (FeedbackScreen)
- user action: picks 1-5 on each of five items, optionally hours slept, up to 3 tags, a note; taps "Check in".
- behaviour: 1. Five items with absolute word anchors: Sleep (Awful…Great), Energy (Empty/25/50/75/100%), Soreness (Wrecked…100%), Mood (Low…Great), Stress (Calm…Maxed, inverted) (`CHECKIN_ITEMS`, 52356-52379). 2. Submit requires all five (`complete`, 52572); builds `{id:"fb"+Date.now(), date ISO, dateStr, mood, energy, stress, sleep, soreness, hoursSlept: parseFloat||null, tags, note, anchored:"usual"}` (52575-52586). 3. `coachCheckinResponse` runs locally, the entry is prepended to `lk_feedback`, `logBetaActivity("feedback", entry)` fires, the response card replaces the form and all inputs reset (52587-52595). 4. Tags capped at three with a toast "Pick up to three tags — tap one to swap it out." (52791-52799); `CHECKIN_TAGS = ["Travel","Illness","Poor food","Big day at work","Period"]` (52544). 5. Multi-check-in support: `checkinPerDay()` reads `lk_checkinPerDay` and accepts only 1, 2 or 4 (52462-52465); a "Check-in N of M today" header shows when >1 (52736-52740).
- v6 status: WORKING

### F-COACH-034 — Check-in — the local coach response ("payoff card")
- location: Coach > Check-In, immediately after submitting - Behavior (`coachCheckinResponse`, 52489-52543), first branch that fires wins: 1. No baseline yet (<14 entries in 30 days): "Saved. After N more check-in(s) I'll know your usual…", plus a soft note if sleep ≤2 (52506-52514). 2. Any red flag (≥2 SD the bad way): names the item, folds in a sleep run of ≥3, then offers two options ("cut the top set… or push it to tomorrow… Your call.") and sets a follow-up `prompt` (52515-52525). 3. Amber (1-2 SD): "keep the intensity honest today… Or train as planned and see how the first set feels. Your call." (52526-52530). 4. Sleep run ≥3 with an otherwise normal day (52531-52534). 5. Otherwise praise the items at/above usual, else "Right on your usual across the board. Steady is underrated." (52535-52541). 6. Wellbeing rule: if mood has been ≤2 for ≥7 consecutive entries and `lk_coachMoodRaisedAt` is older than 14 days, one kind paragraph is appended and the timestamp is written so it stays quiet for a fortnight (52544-52552). 7. The card shows `response.text`, the optional `wellbeing` paragraph, a "Talk about this" button (deep-links into Chat with `response.prompt` pre-filled, via `p.onTalk` → 52247-52251), and "Done" (52626-52664).
- user action: 
- behaviour: 
- v6 status: WORKING

### F-COACH-035 — Check-in — 14-day dot row and day inspector
- location: Coach > Check-In > dots
- user action: taps a filled dot.
- behaviour: 14 dots, oldest first, filled when an entry exists for that ISO day; disabled when empty; tapping toggles a detail card showing every item's word label and the note in quotes (52604-52625, 52689-52713). Explicit design note: no streak counter (52602-52603).
- v6 status: WORKING

### F-COACH-036 — Check-in — done-for-today state
- location: Coach > Check-In after the per-day quota is met
- user action: 
- behaviour: shows "Today's check-in is done" (or "Today's check-ins are done (N of M)") plus "Come back tomorrow. Tap a dot to look at any day.", the dot row and the inspector (52666-52713).
- v6 status: WORKING

### F-COACH-037 — Beta admin — code management
- location: Settings > (screen `"betaAdmin"`) > Codes tab
- user action: types a code, taps Add; taps Revoke/Reactivate on a row.
- behaviour: `addCode` uppercases and appends `{code, active:true, usedBy:null}` (52823-52833); `toggleCode` flips `active` (52834-52842); rows show "Claimed by: X on <date>" or "Unclaimed" and strike through inactive codes (53005-53037). Seeded defaults come from `DEFAULT_BETA_CODES = ["JOSHBETA","SUMMERBETA","ROMANBETA","CESCOBETA","PUBLICBETA","OLIBETA","KENDALLBETA"]` (2694).
- v6 status: DEAD (unreachable)

### F-COACH-038 — Beta admin — activity / AI logs / feedback tabs
- location: Settings > betaAdmin > tabs
- user action: 
- behaviour: four pill tabs (Codes, Activity, AI Logs, Feedback) (52906-52924). Activity shows the newest 50 `lk_betaLog` entries with `JSON.stringify(a.data).slice(0,200)` (53038-53090). AI Logs shows the newest 30 `lk_betaAILog` entries with input and output each truncated to 300 chars (53091-53160). Feedback shows the newest 50 `lk_feedback` entries with a mood emoji, energy, stress and the note (53161-53207). All four logs are snapshotted into state at mount and never refresh (52807-52821).
- v6 status: DEAD (unreachable, same evidence as F-COACH-037)

### F-COACH-039 — Beta admin — export all data (JSON download)
- location: Settings > betaAdmin > "Export All Data (JSON)"
- user action: 
- behaviour: `exportAll` builds `{codes, activity, aiInteractions, feedback}`, creates a Blob, and triggers a synthetic `<a download="locked-beta-export.json">` click, then revokes the object URL (52843-52859).
- v6 status: DEAD (unreachable panel); the function itself is correct.

### F-COACH-040 — Beta admin — "Sync All to Server Now"
- location: Settings > betaAdmin > green button
- user action: 
- behaviour: calls `syncBetaData(onDone, onFail)` (52936-52948); on success toasts "Synced to server", on failure "Sync failed. Check your connection and retry."; a "Last sync: <lk_lastSync or Never>" line renders below (52958-52966).
- v6 status: DEAD (unreachable panel); the sync function itself is also invoked by a midnight interval (2842-2855).
