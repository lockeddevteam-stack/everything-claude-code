# Agent 5 — Coach & AI audit

File audited: `redesign/input/locked-current-v6.html` (all cites are this file).
Exclusive range: **49400–53209**. Components: CoachCardioCard (49400), CoachSetupSection (49455), CoachSetupPane (49483), CoachInterview (49750), CoachScreen (49915), FeedbackScreen (52547), BetaAdminPanel (52806).
Shared helpers outside the range are cited where the range depends on them (`aiCall` 2663, `logBetaAI` 2783, `coachBuildContext` 49001, `COACH_MARKER_DOCS` 48885).

All storage keys below are written through `sd(k,v)`/`ld(k,fb)` which prefix every key with `lk_` (49400:file `sd` at 2435, `ld` at 2417). So `coachInstructions` on disk is `lk_coachInstructions`, `betaAILog` is `lk_betaAILog`.

---

## PART A — Features

### F-COACH-001 Coach screen shell: four panes, tabs, swipe, deep links
- Location: Coach tab > CoachScreen > header + tablist
- User action: taps one of Chat / Plan / Check-In / Setup, or swipes horizontally, or arrives from a notification deep link.
- Behavior:
  1. `coachTab` state defaults to `"chat"` (49973).
  2. Tablist renders four tabs `[["chat","Chat"],["plan","Plan"],["check-in","Check-In"],["instructions","Setup"]]` (50899-50944).
  3. The Check-In tab shows an accent dot when `!checkinDoneForDay(ld("feedback",[]))` (50905, helper 52459).
  4. Touch handlers implement a velocity-projected horizontal swipe: gesture must be ≥2× more horizontal than vertical, projected distance ≥64px, moving one step through `PANE_ORDER = ["chat","plan","check-in","instructions"]` (50750-50784, order at 50753).
  5. A deep link sets `window.__lockedCoachPane` or dispatches a `lockedCoachPane` event; `toPane` accepts only the four names (49991-50004).
  6. The chat composer's measured height is published to `window.__lkBottomBar` and a `lockedBottomBar` event fires, so the floating voice button parks clear of it (50029-50043).
- Components: CoachScreen (49915-52351)
- Functions: `toPane` (49993), `onEvt` (50000), swipe handlers inline (50750-50784)
- State: `coachTab`, `nearBottom`/`nearBottomRef`, `phaseOpen`, `savedMsg`, `interviewOpen`, `receiptOpen`, `dismissedChips`, `prefillOnce` (49973, 50014-50027); globals `window.__lockedCoachPane`, `window.__lkBottomBar`
- Storage: reads `lk_feedback` (50905)
- Network: none
- AI: none
- Edge cases: unknown pane name is ignored (49994); `prefillOnce` state is declared (50024) and never read — dead state.
- Gating: always on
- Status: WORKING
- Evidence for status: 50899-50944 renders all four panes and each pane body exists (50946, 51249, 52245, 52252).
- Notes: `prefillOnce`/`setPrefillOnce` (50024) and `memoryInput`/`setMemoryInput` (50083) are declared but never used — dead state. `p.go` is passed in (57710/57720) but unused in CoachScreen.

### F-COACH-002 Coach chat — send a message
- Location: Coach > Chat > composer textarea + send button
- User action: types in the textarea and taps send, or presses Enter (Shift+Enter newlines).
- Behavior:
  1. `send(prefill)` trims the message, returns early if empty or `loading` (52123-52133).
  2. Input clears; the user's row is appended to `msgs` optimistically; `{role:"user",content:msg}` is pushed to `histRef.current` (52127-52132).
  3. `fireRequest()` sets `loading`, creates an `AbortController` (guarded in try/catch), finds the last user turn in `histRef` (50052-50060).
  4. POST to `https://lockedapi.cescocugliari.workers.dev/` with `authHeaders()` and body `{system: buildContext(lastUser), max_tokens: 1000, messages: histRef.current}` (50061-50070).
  5. `r.status===429` throws `{kind:"limit"}`; any other non-ok throws `{kind:"server"}` (50072-50074).
  6. On success `handleReply(d)` parses markers and appends the assistant row (50077, 50159-50322).
  7. `useEffect` on `msgs` persists `coachLastMsgs` and `coachLastHist` capped at the last 40 entries, and auto-scrolls only when `nearBottomRef.current` (49924-49933).
- Components: CoachScreen (49915)
- Functions: `send` (52123), `fireRequest` (50048), `buildContext` (50043-50047 → `coachBuildContext` 49001), `handleReply` (50159), `authHeaders` (2653)
- State: `msgs`, `input`, `loading`, `histRef`, `sendAbortRef`, `silentAbortRef`
- Storage: writes `lk_coachLastMsgs`, `lk_coachLastHist` (49926-49927); context builder reads many keys — see "Data sent off-device".
- Network: see "THE AI CONTRACT".
- AI: model UNVERIFIED (server-side); system prompt built by `coachBuildContext` (49001-49268).
- Edge cases: empty input and concurrent send blocked (52125); 429 → "You've used your 10 free chats today. Resets at midnight." (50085); offline detected via `navigator.onLine === false` → "No connection. Your message is saved." (50083-50087); abort → "Stopped."; anything else → "The coach is down. Not your fault." (50088).
- Gating: always on (server enforces the 10/day free limit — UNVERIFIED client-side).
- Status: WORKING
- Evidence for status: complete request/response/error path at 50048-50100.
- Notes: `max_tokens: 1000` here differs from the shared `aiCall`'s 700 (2668) and the interview's 600 (49775). No `temperature`, no streaming. The failed attempt is deliberately never pushed into `histRef` so retry is clean (50109-50112).

### F-COACH-003 Chat error rows, retry, and paywall hand-off
- Location: Coach > Chat > error bubble under a failed turn
- User action: taps "Retry" / "Continue" / "See plans" on a red error bubble.
- Behavior:
  1. Errors append `{role:"assistant", error:true, errKind, text}` (50091-50093).
  2. The bubble renders red-tinted and its button label depends on `errKind`: `limit` → "See plans", `stopped` → "Continue", otherwise "Retry" (51380-51393).
  3. `limit` calls `window.LOCKED.paywall()`; others call `retryLast()` (51381-51383).
  4. `retryLast` early-returns while `loading`, strips all `error` rows from `msgs`, then re-fires (50104-50117).
- Components: CoachScreen
- Functions: `retryLast` (50104), `fireRequest` (50048)
- State: `msgs`, `loading`
- Storage: none directly (persisted with msgs)
- Network: repeat of F-COACH-002
- AI: same call
- Edge cases: double-tap guarded by both the `loading` early-return and the button's `disabled` (51377, 50106 — the comment at 50104-50107 records the bug this fixed).
- Gating: always on
- Status: WORKING
- Evidence for status: 50104-50117 plus button wiring 51376-51393.
- Notes: error rows persist into `lk_coachLastMsgs` (49926) so a stale "The coach is down." bubble survives a reload.

### F-COACH-004 Stop generation
- Location: Coach > Chat > composer, send button replaced by a stop square while loading
- User action: taps the red stop button.
- Behavior: `stopGeneration()` sets `silentAbortRef` false and aborts the controller (50121-50124); the abort surfaces as `errKind:"stopped"` with the text "Stopped." and a "Continue" button (50084-50088, 51383).
- Components: CoachScreen
- Functions: `stopGeneration` (50121)
- State: `sendAbortRef`, `silentAbortRef`, `loading`
- Storage: none
- Network: aborts the in-flight POST
- Edge cases: `AbortController` construction is try/caught, so a browser without it degrades to a non-abortable request (50051); when `silent` is true (edit path) the "Stopped." row is suppressed (50089-50093).
- Gating: always on
- Status: WORKING
- Evidence for status: 50121-50124 and the silent-abort branch at 50089.

### F-COACH-005 Edit a sent message and re-run from there
- Location: Coach > Chat > "Edit · re-runs from here" under a user bubble
- User action: taps Edit under their own message.
- Behavior:
  1. `editUserMessage(idx)` bails unless the row is a user row (50127-50129).
  2. If a reply is in flight it silently aborts (`stopGeneration(true)`) so the answer cannot graft onto a truncated history (50130-50134).
  3. Counts non-error user rows up to `idx`, finds the matching index in `histRef`, truncates `histRef` and `msgs` there, and loads the old text back into the composer (50135-50148).
- Components: CoachScreen
- Functions: `editUserMessage` (50126), `stopGeneration` (50121)
- State: `msgs`, `histRef`, `input`
- Storage: `lk_coachLastMsgs`/`lk_coachLastHist` rewritten by the msgs effect (49924)
- Edge cases: editing does not automatically re-send — the user must press send again.
- Gating: always on
- Status: WORKING
- Evidence for status: full truncation logic 50126-50148.

### F-COACH-006 Copy reply / retry last reply
- Location: Coach > Chat > "Copy" and "Retry" under an assistant reply
- User action: taps Copy (any reply) or Retry (last reply only, when not loading).
- Behavior: Copy writes `m.text` to `navigator.clipboard` inside try/catch (51404-51406). Retry pops the trailing assistant turn off `histRef`, truncates `msgs` to before that reply, and calls `fireRequest()` (51414-51421).
- Components: CoachScreen
- Functions: inline handlers (51404, 51414); `fireRequest` (50048)
- Edge cases: clipboard failure is swallowed silently — no toast (51405).
- Gating: always on
- Status: WORKING
- Evidence for status: 51396-51424.

### F-COACH-007 Empty-state opener + suggestion chips + dismiss
- Location: Coach > Chat, when `msgs.length === 0`
- User action: taps a generated suggestion chip, or its "×" to dismiss it.
- Behavior:
  1. `coachOpener({history, prs})` produces `{line, chips}` from real data — six prioritised rules (red check-in, trained in last 12h, phase ending, stalled lift, nothing eaten after 2pm, goal fallback), topped up to 6 chips from staples (49277-49384; called at 51260).
  2. Chips filtered against `dismissedChips`; tapping one calls `logBetaActivity("coach_chip_used",{q})` then `send(q)` (51269-51276).
  3. "×" appends the chip to `dismissedChips` (session-only, not persisted) (51278-51287).
  4. A footer disclaimer renders: "AI coaching can be wrong. Sanity-check anything that affects your health." (51319-51322).
- Components: CoachScreen
- Functions: `coachOpener` (49277), `send` (52123), `logBetaActivity` (2770)
- State: `dismissedChips`
- Storage: `coachOpener` reads `lk_feedback`, `lk_coachPlan`, `lk_fuelLog`, `lk_goals` (49283, 49318, 49348, 49364)
- Edge cases: with no data at all the fallback line is "Tell me what you're training for and I'll build the road there." (49369).
- Gating: always on
- Status: WORKING
- Evidence for status: 51255-51322.
- Notes: dismissals reset on reload — no storage key.

### F-COACH-008 Context receipt ("Your coach can see N things about you")
- Location: Coach > Chat empty state > shield row
- User action: taps the row to expand; taps "Change what it sees →".
- Behavior: `coachVisibleData()` lists the enabled `COACH_DATA_KEYS` labels plus "Your saved memories" and "Your instructions" when present (49388-49398); count rendered inline (51294); expanded list at 51302-51310; the link switches `coachTab` to `"instructions"` (51311-51318).
- Components: CoachScreen
- Functions: `coachVisibleData` (49388), `coachDataPrefs` (48931), `coachMemoryOn` (48947)
- Storage: reads `lk_coachDataPrefs`, `lk_coachMemory`, `lk_coachMemoryOn`, `lk_coachInstructions`
- Gating: always on; only visible in the empty state (51255) — once a conversation exists the receipt is unreachable from chat.
- Status: PARTIAL
- Evidence for status: the whole block is inside `msgs.length === 0 && (...)` (51255), so it disappears as soon as the user sends anything.

### F-COACH-009 Reply parsing — structured action markers
- Location: Coach > Chat (invisible; drives the action cards)
- User action: none directly; triggered by every assistant reply.
- Behavior (`handleReply`, 50159-50322), in order:
  1. `txt = d.content[0].text`, falling back to `"Try again."` when empty (50160-50163).
  2. Push `{role:"assistant",content:txt}` into `histRef` (50164-50167).
  3. `###PROGRAM_START###…###PROGRAM_END###` → `JSON.parse` → `detectedSplit` (50168-50176). Fallback heuristic: search for the literal `"splits"`, back up to the previous `{`, parse from there (50177-50189).
  4. `###RECIPE_START###/###RECIPE_END###` → `detectedRecipe`, with an equivalent `"ingredients"` fallback requiring both `ingredients` and `steps` (50190-50213).
  5. `###GOAL_START###/###GOAL_END###` → `detectedGoal` (50200-50212).
  6. `###FOOD_START###/###FOOD_END###` → `detectedFood`, validated: every item must have a `name` and a numeric `cal` in 0..2000 or the whole payload is dropped (50214-50239).
  7. `###PLAN_START###/###PLAN_END###` → `detectedPlan` (50241-50255).
  8. `###INSTRUCTIONS_START###/###INSTRUCTIONS_END###` → `detectedInstructions` (plain text, not JSON) (50256-50266).
  9. `###CARDIO_START###/###CARDIO_END###` → `detectedCardio`, accepted only if `parsedCardioSeconds(pc) > 0` (50267-50281).
  10. `###REMEMBER###…###/REMEMBER###` → saved to memory immediately if `coachMemoryOn()` (50285-50295).
  11. `###SHOPPING_ADD###…###/SHOPPING_ADD###` → `parseShoppingFromCoach` → opens the approval modal (50296-50311).
  12. A catch-all `displayTxt.replace(/###\w+_START###[\s\S]*?###\w+_END###/g,"")` strips leftover markers; if nothing survives, `displayTxt = "Done!"` (50238-50240).
  13. `actionCount` = number of non-null detections; `saveAll: actionCount >= 3` (50282-50284, 50318).
- Components: CoachScreen
- Functions: `handleReply` (50159), `parseShoppingFromCoach` (50451), `parsedCardioSeconds` (external), `coachMemoryOn` (48947)
- Edge cases: every `JSON.parse` is inside an empty `catch {}` — a malformed payload silently degrades to plain text (50172, 50194, 50205, 50219, 50246, 50275). Note the marker-stripping regex only matches `_START`/`_END` pairs, so `###REMEMBER###`/`###SHOPPING_ADD###` need their own explicit replaces (50293, 50309).
- Gating: always on
- Status: WORKING
- Evidence for status: complete parse chain 50159-50322.
- Notes: `var re = txt.indexOf("###RECIPE_END###")` at 50177 shadows nothing but is named identically to a regex-ish variable; `ce`/`ci` at 50271-50272 shadow nothing. The `"splits"`/`"ingredients"` substring fallbacks (50177, 50196) can mis-fire on prose that merely mentions those words followed by a stray `{`.

### F-COACH-010 Action card — save a training split
- Location: Coach > Chat > orange split card under a reply
- User action: taps "ADD TO TRAIN TAB".
- Behavior: `saveCoachSplit(prog)` (50324-50372) either flattens N single-day splits into one multi-day split (when `allSingle && prog.splits.length >= 2`) or maps each split through with its days; ids are `"s"+Date.now()` (+`i*997` for the multi case); appended via `p.setSplits`; `savedMsg` banner "Split saved to Train tab" for 3s. The card then flags `savedSplit:true` so the button is permanently disabled (51459-51472).
- Components: CoachScreen; card 51436-51488
- Functions: `saveCoachSplit` (50324)
- State: `msgs` (flag), `savedMsg`; parent `setSplits`
- Storage: splits persisted by the parent (outside this range)
- Edge cases: no-op if `!prog || !prog.splits` (50325).
- Gating: always on
- Status: WORKING
- Evidence for status: 50324-50372 + disabled flag 51458.
- Notes: the disabled flag is a fix for double-adds on persisted messages — comment at 51455-51457.

### F-COACH-011 Action card — save a recipe / add ingredients to shopping
- Location: Coach > Chat > green recipe card
- User action: taps "OPEN IN FUEL" or "ADD TO SHOP".
- Behavior: `saveCoachRecipe` (50373-50396) appends `{id:"cr"+Date.now(), name, description, cal, pro, carb, fat, ingredients, steps, created}` to `lk_coachRecipes`, shows "Recipe saved to Fuel tab!", and logs `coach_recipe_saved`. "ADD TO SHOP" loops the ingredients, normalises `{amount, item|name}` into a string, runs `parseIngredient`, then `addShoppingItem(name, quantity, unit)` (51565-51578).
- Components: CoachScreen; card 51489-51590
- Functions: `saveCoachRecipe` (50373), `parseIngredient`/`addShoppingItem` (external)
- Storage: writes `lk_coachRecipes` (50385); `lk_betaLog` via `logBetaActivity`
- Edge cases: no-op without `recipe.name` (50374); "ADD TO SHOP" has no saved flag, so repeated taps add duplicates (51565).
- Gating: always on
- Status: WORKING
- Evidence for status: 50373-50396.
- Notes: the "ADD TO SHOP" button re-uses the loop variable name `i`, shadowing the outer message index `i` inside the handler (51566) — harmless here but fragile.

### F-COACH-012 Action card — create a goal
- Location: Coach > Chat > goal card
- User action: taps "ADD TO GOALS".
- Behavior: `saveCoachGoal` (50397-50450) resolves the current value from `p.prs` (best `w`, converted with `liftDisp`), `getWeightLog()` or `getBfLog()` depending on `goalData.type`; builds the entry with defaults (`unit` falls back to `%` for bf else kg/lb), pushes to `lk_goals`, shows "Goal added to Progress!", logs `coach_goal_created`.
- Components: CoachScreen; card 51591-51713
- Functions: `saveCoachGoal` (50397)
- Storage: reads/writes `lk_goals` (50440-50442)
- Edge cases: no-op without `goalData.name` (50398); `target` coerced via `parseFloat || 0`.
- Gating: always on
- Status: WORKING
- Evidence for status: 50397-50450.

### F-COACH-013 Action card — log food
- Location: Coach > Chat > blue food card
- User action: taps "LOG TO FUEL".
- Behavior: `saveCoachFood` (50478-50520) reads `lk_fuelLog`, gets/creates today's `{meals:{breakfast,lunch,dinner,snacks}, water:0}`, appends each item into `foodData.meal` (default `"snacks"`), writes back, shows "N items logged to <meal> (X cal)!", logs `coach_food_logged`.
- Components: CoachScreen; card 51714-51897
- Functions: `saveCoachFood` (50478)
- Storage: `lk_fuelLog` read+write (50482, 50499)
- Edge cases: no-op on empty items (50479); parser already rejected items with cal <0 or >2000 (50230).
- Gating: always on
- Status: WORKING
- Evidence for status: 50478-50520.

### F-COACH-014 Action card — log cardio (CoachCardioCard)
- Location: Coach > Chat > cardio card
- User action: taps "LOG CARDIO" (once).
- Behavior:
  1. `CoachCardioCard` builds a record with `buildParsedCardioRecord(p.data)` inside try/catch; returns `null` if it fails (49401-49404).
  2. Renders activity icon, duration in minutes, distance converted to km/mi from `ld("profile",{}).useKg !== false`, avg watts, and a calorie estimate with a range and a method label (`CE_METHOD_LABEL`) (49405-49437).
  3. Tapping calls `p.onSave()` once and locks to "✓ LOGGED" via local `done` state (49438-49447).
  4. `saveCoachCardio(data)` (50467-50477) rebuilds the record, toasts an error if it cannot ("I couldn't tell how long that session was"), otherwise prepends to history via `p.setHistory` and toasts "Logged <name>, N min".
- Components: CoachCardioCard (49400-49447)
- Functions: `saveCoachCardio` (50467), `buildParsedCardioRecord`/`cardioActivity`/`cardioDist` (external)
- State: local `done`
- Storage: reads `lk_profile` (49405); history written by the parent
- Network: none
- AI: the model supplies the session; calories are computed locally on purpose — the prompt explicitly forbids the model from returning calories (48895).
- Edge cases: unparseable record renders nothing (49403).
- Gating: always on
- Status: WORKING
- Evidence for status: 49400-49447 + 50467-50477.
- Notes: `done` is component-local, so scrolling the card out of the DOM and back would re-enable the button — unlike the split/food cards which flag the persisted message. `p.setHistory` is used at 50472 but CoachScreen is not passed `setHistory` at its call site (57710-57721 lists `useKg, prs, splits, setSplits, history, profile, updateProfile, go`) → **`p.setHistory` is undefined and this throws**. See "Open questions".

### F-COACH-015 Action card — save a training plan
- Location: Coach > Chat > plan card
- User action: taps "SAVE PLAN".
- Behavior: `saveCoachPlan` (50521-50537) builds `{name, description, startDate (default `isoDay()`), phases, created, updatedAt}`, stores via `setPlan` → `sd("coachPlan", …)` (50069-50072 region: `setPlan` at 50100? see 49999) , shows "Plan saved to Coach!", logs `coach_plan_saved`.
- Components: CoachScreen; card 51898-52030
- Functions: `saveCoachPlan` (50521), `setPlan` (50040-50043)
- Storage: writes `lk_coachPlan`
- Edge cases: no-op without `planData.phases` (50522).
- Gating: always on
- Status: WORKING
- Evidence for status: 50521-50537.

### F-COACH-016 Action card — save coaching instructions from chat
- Location: Coach > Chat > "COACHING PROFILE" card
- User action: taps "SAVE INSTRUCTIONS".
- Behavior: preview shows the first 140 chars (52007); tapping calls `applyCoachInstructions(text)` which writes `lk_coachInstructions`, updates both `instructions` and `instrDraft`, and shows "Coaching instructions saved!" for 3s (50033-50042).
- Components: CoachScreen; card 51982-52034
- Functions: `applyCoachInstructions` (50033)
- Storage: writes `lk_coachInstructions`
- Gating: always on
- Status: WORKING
- Evidence for status: 50033-50042.

### F-COACH-017 "SAVE ALL (N ACTIONS)"
- Location: Coach > Chat, shown when a reply carried ≥3 actions
- User action: taps the SAVE ALL bar.
- Behavior: flags the message `savedAll` plus every per-card flag, then runs `saveCoachSplit`, `saveCoachRecipe`, `saveCoachGoal`, `saveCoachFood`, `saveCoachCardio`, `saveCoachPlan`, `applyCoachInstructions` for whichever payloads exist (52035-52061).
- Components: CoachScreen
- Functions: all of the above
- Edge cases: disabled once `savedAll` is set (52036); the shopping list is not part of SAVE ALL (it has its own modal).
- Gating: shown only when `actionCount >= 3` (50283, 52035)
- Status: WORKING
- Evidence for status: 52035-52061.
- Notes: fires up to five `savedMsg` banners in sequence, each overwriting the last (each save sets `savedMsg` with its own 3s timer).

### F-COACH-018 Shopping-list approval modal
- Location: Coach > Chat > full-screen modal
- User action: unchecks items, taps IMPORT or CANCEL (or Escape).
- Behavior:
  1. On a `###SHOPPING_ADD###` reply, `parseShoppingFromCoach` splits the block on commas and trims (50451-50466); `setShoppingApproval({items, context: lastLineBeforeMarker})` (50302-50310).
  2. Modal renders via `lkPortal` with per-item checkboxes defaulting to checked (52252-52340).
  3. IMPORT runs each selected item through `parseItemWithQuantity` (= `parseIngredient`, 50464-50466) then `addShoppingItem(name, quantity, unit)` and closes (52310-52327).
  4. `useEscape(shoppingApproval ? close : null)` closes it with Escape (50037-50039... see 49999-50001).
- Components: CoachScreen; modal 52252-52349
- Functions: `parseShoppingFromCoach` (50451), `parseItemWithQuantity` (50464), `addShoppingItem` (external), `useEscape` (5160), `lkPortal` (5072)
- State: `shoppingApproval`
- Edge cases: parse returns null on an empty block, so no modal (50455-50457); the checkbox toggle mutates `prev.selected` in place before returning a new object (52286-52296).
- Gating: always on
- Status: WORKING
- Evidence for status: 50296-50311 + 52252-52349.

### F-COACH-019 Remembered-fact chip with Undo
- Location: Coach > Chat > blue "Saved to memory" pill under a reply
- User action: taps "Undo".
- Behavior: a `###REMEMBER###` fact is saved immediately (only when `coachMemoryOn()`), the pill renders, and Undo filters the memory list by matching `text` + `date` and marks the message `rememberUndone` (50285-50295, 51425-51435).
- Components: CoachScreen
- Functions: `setCoachMemory` (50084-50090), `coachMemoryOn` (48947)
- Storage: writes `lk_coachMemory`
- Edge cases: when memory is off the fact is stripped from the text but never saved and no pill appears (50289).
- Gating: memory toggle
- Status: WORKING
- Evidence for status: 50285-50295 + 51425-51435.

### F-COACH-020 New chat (delete conversation)
- Location: Coach > header > "New chat" (only when `msgs.length > 0`)
- User action: taps it twice.
- Behavior: `clearConvo` requires a second tap via `lkConfirm("clearConvo", "Tap again to delete this conversation.")`, then empties `msgs`, `histRef`, and both storage keys (49935-49946; button 50880-50897).
- Components: CoachScreen
- Functions: `clearConvo` (49935), `lkConfirm` (5179)
- Storage: writes `lk_coachLastMsgs`, `lk_coachLastHist` to `[]`
- Gating: always on
- Status: WORKING
- Evidence for status: 49935-49946.
- Notes: the in-code comment flags this as a permanent delete labelled like a non-destructive "new chat" (49936-49938).

### F-COACH-021 Rename the coach
- Location: Coach > header > pencil next to the coach name
- User action: taps ✎, types a name, presses Enter or Save.
- Behavior: `saveCoachName` trims to 24 chars, calls `p.updateProfile({coachName: n || null})`, logs `coach_renamed` when non-empty, exits edit mode (50006-50013). The name renders as the `<h1>` with fallback "Coach" (50846-50852).
- Components: CoachScreen
- Functions: `saveCoachName` (50006)
- State: `nameEdit`, `nameDraft`
- Storage: profile (parent), `lk_betaLog`
- AI: the name is injected into the system prompt — "Your name is X — refer to yourself by it naturally when it fits." (49022).
- Gating: always on
- Status: WORKING
- Evidence for status: 50006-50013.

### F-COACH-022 Jump to latest / smart auto-scroll
- Location: Coach > Chat > floating pill above the composer
- User action: scrolls up (pill appears), taps "Jump to latest ↓".
- Behavior: `onScroll` sets `nearBottom` when within 100px of the bottom (51204-51210); the msgs effect only auto-scrolls when `nearBottomRef.current` (49929-49932); the pill resets both and scrolls to the bottom (52062-52078).
- Components: CoachScreen
- Gating: always on
- Status: WORKING
- Evidence for status: 51204-51210, 52062-52078.

### F-COACH-023 "Earlier messages trimmed" notice
- Location: Coach > Chat, above the transcript
- Behavior: rendered whenever `msgs.length >= 40` (51323-51328); the persistence effect keeps only `slice(-40)` of both msgs and history (49926-49927).
- Status: WORKING
- Evidence for status: 51323, 49926.
- Notes: the notice keys on the in-memory length, but trimming only happens on reload, so it can display before anything has actually been trimmed.

### F-COACH-024 Setup pane — "About you" free-text instructions
- Location: Coach > Setup > ABOUT YOU
- User action: types into the textarea (max 2000 chars), taps Save, or taps a "+ quick" chip.
- Behavior: `p.setInstrDraft` on change; the counter shows `length / 2000` (49543-49548); Save is disabled while draft === saved (49550); `saveInstructions` writes `lk_coachInstructions`, sets the saved flag for 2s, and logs `coach_instructions_updated` with `{length}` (50023-50032). Five quick chips (`QUICK` at 49505-49506: "I train fasted", "Short answers only", "I have a home gym", "Knees are dodgy", "Vegetarian") append `"<chip>."` on a new line (49564-49572).
- Components: CoachSetupPane (49483-49733), CoachSetupSection (49455-49482)
- Functions: `saveInstructions` (50023)
- Storage: writes `lk_coachInstructions`, `lk_betaLog`
- AI: injected as "USER INSTRUCTIONS (follow these closely, the user wrote them to guide you): …" (49030-49031).
- Edge cases: `maxLength: 2000` on the textarea (49535); nothing warns if the model's own generated instructions exceed it.
- Gating: always on
- Status: WORKING
- Evidence for status: 49508-49576.

### F-COACH-025 Setup pane — coaching style / persona
- Location: Coach > Setup > COACHING STYLE
- User action: taps one of seven persona buttons.
- Behavior: writes `lk_coachStyle`, updates local state, logs `logBetaActivity("persona_changed",{id})` (49584-49586). The eight-line `COACH_STYLES` array (48950-48967) carries `{id, name, desc, tone}`; `coachStyle()` resolves by id with a `"warm"` default (48968-48978) and the `tone` string is spliced into the system prompt head (49023).
- Personas: Direct, Warm (default), Technical, Teacher, Hype, Performance (`athlete`), Physiology-Aware (`physio`) — seven entries (48950-48967).
- Storage: writes `lk_coachStyle`, `lk_betaLog`
- Gating: always on
- Status: WORKING
- Evidence for status: 49578-49603.

### F-COACH-026 Setup pane — memory list, add, delete, clear, master switch
- Location: Coach > Setup > MEMORY
- User action: toggles the switch, types a memory + Enter/Add, taps "×" on an item, taps "Clear all" twice.
- Behavior:
  1. Toggle writes `lk_coachMemoryOn`; when off the section shows "Off. Nothing here is sent to the coach." and the whole list is hidden and excluded from the prompt (49606-49638, prompt guard 49032).
  2. Items render with `text` plus a provenance line `src` ("added earlier" / "added by you, <date>" / "from your chat, <date>") (49499-49503, 49645-49660).
  3. Delete filters by strict identity on the raw item (`x !== m._raw`) (49662-49667).
  4. Add appends `{text, src:"added by you, <locale date>", date: ISO}` on Enter or the Add button (49682-49712).
  5. "Clear all" is a two-tap confirm using local `confirmClear` (49713-49728).
- Components: CoachSetupPane
- Functions: `setCoachMemory` (50084), `coachMemoryOn` (48947), `coachMemoryItems` (48938)
- Storage: `lk_coachMemory`, `lk_coachMemoryOn`
- Edge cases: legacy string memories are read and normalised (48939-48943, 49495-49498); empty list shows "Nothing remembered yet." (49669).
- Gating: always on
- Status: WORKING
- Evidence for status: 49604-49728.

### F-COACH-027 Setup pane — "What your coach can see" data switches
- Location: Coach > Setup > WHAT YOUR COACH CAN SEE (collapsed by default)
- User action: toggles any of nine switches.
- Behavior: `setDataPref(key,v)` clones the prefs object, writes `lk_coachDataPrefs`, updates state (49489-49495). `coachDataPrefs()` defaults every key to true unless explicitly `false` (48931-48937). Keys: training, nutrition, weight, checkins, supplements, cycle, bodyfat, goals, plan (48920-48930). Every tier of `coachBuildContext` is gated on these (49036, 49046, 49062, 49096, 49146, 49166, 49173, 49180, 49186, 49206, 49216, 49239).
- Storage: `lk_coachDataPrefs`
- Gating: always on
- Status: WORKING
- Evidence for status: 49729-49762 (render) + gating cites above.

### F-COACH-028 Coach interview (six questions → AI-written instructions)
- Location: Coach > Setup > "Let the coach interview you" → bottom-sheet dialog
- User action: taps an option or types a free answer for each of six questions; then Edit first / Save / Retry / close.
- Behavior:
  1. `COACH_INTERVIEW_QS` — six questions with tappable options (49735-49749): training-for, years training, injuries, tone preference, why they quit before, anything else.
  2. `answer(text)` appends `{q,a}`, clears the free field, advances, and on the last one calls `generate(next)` (49756-49763).
  3. `generate` sets `phase="writing"` and POSTs to the Worker root with `max_tokens: 600` and its own system prompt (49764-49793) — see "THE AI CONTRACT".
  4. Response: extracts between `###INSTRUCTIONS_START###` and `###INSTRUCTIONS_END###`, falling back to the whole trimmed text; empty → throw → `phase="error"` (49783-49792).
  5. Preview phase shows the draft in a scrollable box with "Edit first" (loads it into `instrDraft` and switches to the Setup tab) and "Save" (`applyCoachInstructions`) (49888-49911; wiring at 52260-52272).
  6. Error phase: "The coach is down. Not your fault — your answers are kept." with a Retry that re-runs `generate(answers)` (49869-49886).
- Components: CoachInterview (49750-49914)
- Functions: `answer` (49756), `generate` (49764), `authHeaders` (2653), `lkPortal` (5072), `lkDialogRef` (5125)
- State: `step`, `answers`, `free`, `phase` (ask|writing|preview|error), `draft`
- Storage: writes `lk_coachInstructions` only on Save (via `applyCoachInstructions`, 50033)
- Network: POST `https://lockedapi.cescocugliari.workers.dev/` — full detail in the AI contract.
- AI: system prompt verbatim in the AI contract; user message is the six Q/A pairs joined by blank lines (49771).
- Edge cases: no abort controller — closing the sheet mid-generation leaves the request running and its `.then` calls setState on an unmounted component; no `logBetaAI` (does not go through `aiCall`); backdrop click closes (49803).
- Gating: always on
- Status: WORKING
- Evidence for status: 49764-49793 is a complete request/parse/error path.
- Notes: `max_tokens: 600` but the prompt says "Under 300 words"; the generated block is not length-checked against the 2000-char textarea limit (49535).

### F-COACH-029 Plan pane — empty state
- Location: Coach > Plan, when `lk_coachPlan` is null
- User action: taps "Ask the coach for one".
- Behavior: switches to Chat and pre-fills the composer with "Build me a training plan around my current goal" (50968-50982).
- Status: WORKING
- Evidence for status: 50956-50982.

### F-COACH-030 Plan pane — this week, overall progress, phase timeline
- Location: Coach > Plan, with a plan saved
- Behavior:
  1. `getCurrentPhase()` computes the week number from `plan.startDate` and finds the phase whose `weekStart..weekEnd` contains it (50539-50553).
  2. "THIS WEEK" card names phase X of N, week Y of Z, prints `trainingNotes || focus`, with a special deload copy when the phase name/focus contains "deload"/"recovery week"/"taper" (`isDeload`, 51012-51015); session dots compare lifting sessions since Monday against the first split's non-empty day count (51017-51033, 51127-51150).
  3. "Overall" bar = mean of `calcPhaseProgress` across phases (50743-50749, 51152-51182).
  4. `calcPhaseProgress` = 40% elapsed time + 60% mean target progress, clamped 0-100; phases before the current one return 100, later ones 0 (50718-50742). The blend ratio is shown to the user ("40% time, 60% targets", 51281-51284 region 51285).
  5. Timeline renders at most 7 phases with done/current/upcoming states and a "+N more phases" line (51184-51261, cap at 51186 and 51248).
  6. Each phase expands to weeks, notes, nutrition notes and per-target progress bars.
- Functions: `getCurrentPhase` (50539), `calcPhaseProgress` (50718), `calcOverallProgress` (50743), `calcTargetProgress` (50701), `matchTargetToData` (50592), `parseTargetValue` (50574), `isDeload` (51012)
- Storage: `lk_coachPlan` (via state), `lk_goals`, weight/bf logs
- Status: WORKING
- Evidence for status: 50539-50749 + 50983-51248.
- Notes: `matchTargetToData` (50592-50700) contains a hardcoded exercise-ID shortcut table — bench 107, squat 701, deadlift 201, ohp/overhead press 301, row 202, pull up/pullup 207, lat pulldown 206, incline bench 108, dumbbell press 110 (50606-50619). `calcTargetProgress` fabricates a start value for weight/bf goals as `current * 1.1` (50706) — a synthetic baseline, not real data.

### F-COACH-031 Plan pane — phase/plan review prompt
- Location: Coach > Plan > green "Review with coach" card
- User action: taps it when the plan has finished or its current phase is in its last week.
- Behavior: switches to Chat and pre-fills one of two prompts naming the plan or the phase (51083-51102). `planOver` is computed from the last phase's `weekEnd` (51001-51007); `phaseDone` when `cp.currentWeek === cp.phase.weekEnd` (51008-51011).
- Status: WORKING
- Evidence for status: 51063-51102.

### F-COACH-032 Plan pane — adjust plan / delete plan
- Location: Coach > Plan > footer
- User action: taps "Adjust this plan" or the trash icon.
- Behavior: Adjust switches to Chat with a long pre-filled prompt naming the plan, the current phase, its week range and focus, ending in "Here's what I want to change: " (51253-51272). Delete uses a raw `confirm("Delete your current plan?")` then `setPlan(null)` (51288-51291).
- Status: WORKING
- Evidence for status: 51253-51296.
- Notes: the delete path uses the browser's blocking `confirm()` rather than the app's own `lkConfirm` two-tap pattern (51290 vs 5179) — inconsistent and non-native on iOS.

### F-COACH-033 Daily check-in — the form
- Location: Coach > Check-In (FeedbackScreen)
- User action: picks 1-5 on each of five items, optionally hours slept, up to 3 tags, a note; taps "Check in".
- Behavior:
  1. Five items with absolute word anchors: Sleep (Awful…Great), Energy (Empty/25/50/75/100%), Soreness (Wrecked…100%), Mood (Low…Great), Stress (Calm…Maxed, inverted) (`CHECKIN_ITEMS`, 52356-52379).
  2. Submit requires all five (`complete`, 52572); builds `{id:"fb"+Date.now(), date ISO, dateStr, mood, energy, stress, sleep, soreness, hoursSlept: parseFloat||null, tags, note, anchored:"usual"}` (52575-52586).
  3. `coachCheckinResponse` runs locally, the entry is prepended to `lk_feedback`, `logBetaActivity("feedback", entry)` fires, the response card replaces the form and all inputs reset (52587-52595).
  4. Tags capped at three with a toast "Pick up to three tags — tap one to swap it out." (52791-52799); `CHECKIN_TAGS = ["Travel","Illness","Poor food","Big day at work","Period"]` (52544).
  5. Multi-check-in support: `checkinPerDay()` reads `lk_checkinPerDay` and accepts only 1, 2 or 4 (52462-52465); a "Check-in N of M today" header shows when >1 (52736-52740).
- Components: FeedbackScreen (52547-52805)
- Functions: `submit` (52574), `setVal` (52566), `dotRow` (52604), `setEntries` (52558), `checkinPerDay` (52462), `checkinCountToday` (52466), `checkinDoneForDay` (52474), `checkinDoneToday` (52477)
- Storage: reads/writes `lk_feedback`; writes `lk_betaLog`; reads `lk_checkinPerDay`
- Network: none — deliberately local ("a network round-trip here would break the fifteen-second promise", 52481-52484)
- AI: none. The response is generated by rules.
- Edge cases: submit is a no-op when incomplete and the button is disabled (52575, 52820); `hoursSlept` accepts `step:"0.01"` decimals (52773).
- Gating: always on
- Status: WORKING
- Evidence for status: 52574-52601.
- Notes: full entries are logged verbatim into `lk_betaLog` including the free-text note (52590).

### F-COACH-034 Check-in — the local coach response ("payoff card")
- Location: Coach > Check-In, immediately after submitting
- Behavior (`coachCheckinResponse`, 52489-52543), first branch that fires wins:
  1. No baseline yet (<14 entries in 30 days): "Saved. After N more check-in(s) I'll know your usual…", plus a soft note if sleep ≤2 (52506-52514).
  2. Any red flag (≥2 SD the bad way): names the item, folds in a sleep run of ≥3, then offers two options ("cut the top set… or push it to tomorrow… Your call.") and sets a follow-up `prompt` (52515-52525).
  3. Amber (1-2 SD): "keep the intensity honest today… Or train as planned and see how the first set feels. Your call." (52526-52530).
  4. Sleep run ≥3 with an otherwise normal day (52531-52534).
  5. Otherwise praise the items at/above usual, else "Right on your usual across the board. Steady is underrated." (52535-52541).
  6. Wellbeing rule: if mood has been ≤2 for ≥7 consecutive entries and `lk_coachMoodRaisedAt` is older than 14 days, one kind paragraph is appended and the timestamp is written so it stays quiet for a fortnight (52544-52552).
  7. The card shows `response.text`, the optional `wellbeing` paragraph, a "Talk about this" button (deep-links into Chat with `response.prompt` pre-filled, via `p.onTalk` → 52247-52251), and "Done" (52626-52664).
- Functions: `coachCheckinResponse` (52489), `checkinStats` (52391), `checkinFlag` (52415), `checkinFlags` (52427), `checkinLowRun` (52440), `checkinScaleLabel` (52381)
- Storage: writes `lk_coachMoodRaisedAt` (52551)
- Statistics: 30-day window, minimum 14 entries (`CHECKIN_MIN_BASELINE`, 52390), per-item mean and SD; flags suppressed when SD < 0.25 (52419).
- Gating: always on
- Status: WORKING
- Evidence for status: 52489-52553.
- Notes: the same wellbeing rule is duplicated in `coachBuildContext` (49111-49117) but only that copy is gated on `prefs.checkins`; the check-in copy writes `coachMoodRaisedAt` and thereby silences the prompt-side mention too — duplicated logic with a shared side-effect.

### F-COACH-035 Check-in — 14-day dot row and day inspector
- Location: Coach > Check-In > dots
- User action: taps a filled dot.
- Behavior: 14 dots, oldest first, filled when an entry exists for that ISO day; disabled when empty; tapping toggles a detail card showing every item's word label and the note in quotes (52604-52625, 52689-52713). Explicit design note: no streak counter (52602-52603).
- Status: WORKING
- Evidence for status: 52604-52625.

### F-COACH-036 Check-in — done-for-today state
- Location: Coach > Check-In after the per-day quota is met
- Behavior: shows "Today's check-in is done" (or "Today's check-ins are done (N of M)") plus "Come back tomorrow. Tap a dot to look at any day.", the dot row and the inspector (52666-52713).
- Status: WORKING
- Evidence for status: 52666-52688.

### F-COACH-037 Beta admin — code management
- Location: Settings > (screen `"betaAdmin"`) > Codes tab
- User action: types a code, taps Add; taps Revoke/Reactivate on a row.
- Behavior: `addCode` uppercases and appends `{code, active:true, usedBy:null}` (52823-52833); `toggleCode` flips `active` (52834-52842); rows show "Claimed by: X on <date>" or "Unclaimed" and strike through inactive codes (53005-53037). Seeded defaults come from `DEFAULT_BETA_CODES = ["JOSHBETA","SUMMERBETA","ROMANBETA","CESCOBETA","PUBLICBETA","OLIBETA","KENDALLBETA"]` (2694).
- Components: BetaAdminPanel (52806-53209)
- Functions: `addCode` (52823), `toggleCode` (52834), `setCodes` (52815)
- Storage: reads/writes `lk_betaCodes`
- Network: none
- Gating: dev-only in intent, but see status.
- Status: DEAD (unreachable)
- Evidence for status: `screen === "betaAdmin"` is the only mount point (57710) and no call site anywhere passes `"betaAdmin"` to `go()`/`setScreen()` — a repo-wide grep for `betaAdmin` returns only 57710 and 57958.
- Notes: beta codes live in `localStorage`, so any user can read, add or reactivate them from devtools — the "validation" at 2708-2715 is purely client-side, with a server cross-check in `validateBetaCodeRemote` (2716-2745) that **fails open** (`.catch(function(){ onResult(true,null); })`, 2743).

### F-COACH-038 Beta admin — activity / AI logs / feedback tabs
- Location: Settings > betaAdmin > tabs
- Behavior: four pill tabs (Codes, Activity, AI Logs, Feedback) (52906-52924). Activity shows the newest 50 `lk_betaLog` entries with `JSON.stringify(a.data).slice(0,200)` (53038-53090). AI Logs shows the newest 30 `lk_betaAILog` entries with input and output each truncated to 300 chars (53091-53160). Feedback shows the newest 50 `lk_feedback` entries with a mood emoji, energy, stress and the note (53161-53207). All four logs are snapshotted into state at mount and never refresh (52807-52821).
- Storage: reads `lk_betaCodes`, `lk_betaLog`, `lk_betaAILog`, `lk_feedback`
- Status: DEAD (unreachable, same evidence as F-COACH-037)
- Evidence for status: 57710 is the only mount point; no navigation to it.

### F-COACH-039 Beta admin — export all data (JSON download)
- Location: Settings > betaAdmin > "Export All Data (JSON)"
- Behavior: `exportAll` builds `{codes, activity, aiInteractions, feedback}`, creates a Blob, and triggers a synthetic `<a download="locked-beta-export.json">` click, then revokes the object URL (52843-52859).
- Status: DEAD (unreachable panel); the function itself is correct.
- Evidence for status: 52843-52859 + unreachable mount (57710).
- Notes: the export contains the complete AI transcript (`aiInteractions`) and every free-text check-in note.

### F-COACH-040 Beta admin — "Sync All to Server Now"
- Location: Settings > betaAdmin > green button
- Behavior: calls `syncBetaData(onDone, onFail)` (52936-52948); on success toasts "Synced to server", on failure "Sync failed. Check your connection and retry."; a "Last sync: <lk_lastSync or Never>" line renders below (52958-52966).
- Functions: `syncBetaData` (2797-2841)
- Network: POST `https://lockedapi.cescocugliari.workers.dev/beta-sync`, `Content-Type: application/json` only (**no Authorization header**, 2823-2830), body `{betaId, data:{activity, aiLogs, feedback, weightLog, workouts, cycles, cycleLog, coachInstructions, goals, bfLog, coachPlan}}` (2803-2821). Response `{ok:true}` → writes `lk_lastSync`; else `onFail(d.error)`.
- Status: DEAD (unreachable panel); the sync function itself is also invoked by a midnight interval (2842-2855).
- Evidence for status: 52936-52948 + unreachable mount.
- Notes: `betaId` is an unauthenticated, guessable string (the lowercased beta code, 2765) and is the only identity on this endpoint — anyone can POST arbitrary data as `joshbeta`. Security finding.

---

## PART B — Function / component index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| CoachCardioCard | component | 49400-49447 | Cardio session card with locally computed calorie estimate and one-shot log button | CoachScreen (51845) | buildParsedCardioRecord, cardioActivity, cardioDist, ld | F-COACH-014 |
| CoachSetupSection | component | 49455-49482 | Collapsible titled section with optional pill | CoachSetupPane (49509, 49578, 49604, 49729) | — | F-COACH-024..027 |
| CoachSetupPane | component | 49483-49733 | The four setup sections: about you, style, memory, data visibility | CoachScreen (50948) | CoachSetupSection, coachDataPrefs, coachMemoryOn, sd, ld, logBetaActivity | F-COACH-024..027 |
| setDataPref | function (inner) | 49489-49495 | Write one coach data-visibility pref | CoachSetupPane switches (49751) | sd | F-COACH-027 |
| CoachInterview | component | 49750-49914 | Six-question onboarding sheet that has the AI write the instructions block | CoachScreen (52256) | answer, generate, lkPortal, lkDialogRef | F-COACH-028 |
| answer | function (inner) | 49756-49763 | Record an interview answer, advance or generate | CoachInterview option/free buttons (49838, 49851, 49862) | generate | F-COACH-028 |
| generate | function (inner) | 49764-49793 | POST the interview answers, parse the instructions block | answer (49762), Retry (49874) | fetch, authHeaders | F-COACH-028 |
| CoachScreen | component | 49915-52351 | The whole Coach tab: chat, plan, check-in, setup | App router (57712) | everything below | F-COACH-001..032 |
| clearConvo | function (inner) | 49935-49946 | Two-tap delete of the conversation | "New chat" (50881) | lkConfirm, sd | F-COACH-020 |
| toPane | function (inner) | 49993-49996 | Validate and apply a deep-linked pane name | CoachScreen effect (49997, 50000) | setCoachTab | F-COACH-001 |
| onEvt | handler (inner) | 50000 | `lockedCoachPane` event listener | window event | toPane | F-COACH-001 |
| saveCoachName | function (inner) | 50006-50013 | Persist a renamed coach (≤24 chars) | name input Enter / Save (50830, 50834) | p.updateProfile, logBetaActivity | F-COACH-021 |
| setCoachMemory | function (inner) | 50084-50090 | Functional setter that also persists `lk_coachMemory` | memory UI, handleReply, undo chip | sd | F-COACH-019, F-COACH-026 |
| setPlan | function (inner) | 50018-50021 | Set + persist `lk_coachPlan` | saveCoachPlan (50534), delete (51290) | sd | F-COACH-015, F-COACH-032 |
| saveInstructions | function (inner) | 50023-50032 | Save the instructions draft and flash "✓ Saved" | Setup Save button (49551) | sd, logBetaActivity | F-COACH-024 |
| applyCoachInstructions | function (inner) | 50033-50042 | Apply instructions from chat/interview and banner it | instructions card (52020), interview onSave (52262), SAVE ALL (52059) | sd | F-COACH-016, F-COACH-028 |
| buildContext | function (inner) | 50043-50047 | Thin wrapper over the top-level context builder | fireRequest (50064) | coachBuildContext | F-COACH-002 |
| fireRequest | function (inner) | 50048-50100 | The chat POST, error classification, error rows | send (52132), retryLast (50116), reply Retry (51420) | fetch, authHeaders, buildContext, handleReply | F-COACH-002, 003, 006 |
| stopGeneration | function (inner) | 50121-50124 | Abort the in-flight reply, optionally silently | Stop button (52196), editUserMessage (50133) | AbortController.abort | F-COACH-004 |
| retryLast | function (inner) | 50104-50117 | Drop error rows and re-fire | error bubble (51383) | fireRequest | F-COACH-003 |
| editUserMessage | function (inner) | 50126-50148 | Truncate history to a user turn and reload it into the composer | "Edit · re-runs from here" (51397) | stopGeneration | F-COACH-005 |
| handleReply | function (inner) | 50159-50322 | Parse every action marker out of a reply and build the assistant row | fireRequest (50077) | JSON.parse, setCoachMemory, parseShoppingFromCoach, coachMemoryOn, parsedCardioSeconds | F-COACH-009 |
| send | function (inner) | 52123-52133 | Optimistically append the user turn and fire | composer, chips, Enter key | fireRequest | F-COACH-002 |
| saveCoachSplit | function (inner) | 50324-50372 | Convert an AI split payload into app splits | split card (51461), SAVE ALL (52053) | p.setSplits | F-COACH-010 |
| saveCoachRecipe | function (inner) | 50373-50396 | Persist a recipe to `lk_coachRecipes` | recipe card (51544), SAVE ALL (52054) | sd, ld, logBetaActivity | F-COACH-011 |
| saveCoachGoal | function (inner) | 50397-50450 | Create a goal with a resolved current value | goal card (51698), SAVE ALL (52055) | getWeightLog, getBfLog, liftDisp, sd, logBetaActivity | F-COACH-012 |
| parseShoppingFromCoach | function (inner) | 50451-50463 | Split a `###SHOPPING_ADD###` block into item strings | handleReply (50303) | — | F-COACH-018 |
| parseItemWithQuantity | function (inner) | 50464-50466 | Alias for `parseIngredient` | shopping modal IMPORT (52320) | parseIngredient | F-COACH-018 |
| saveCoachCardio | function (inner) | 50467-50477 | Rebuild and log a cardio session from the AI payload | CoachCardioCard onSave (51847), SAVE ALL (52057) | buildParsedCardioRecord, p.setHistory, toast | F-COACH-014 |
| saveCoachFood | function (inner) | 50478-50520 | Append AI-parsed food items into today's fuel log | food card (51877), SAVE ALL (52056) | ld, sd, isoDay, logBetaActivity | F-COACH-013 |
| saveCoachPlan | function (inner) | 50521-50537 | Persist an AI plan | plan card (52001), SAVE ALL (52058) | setPlan, logBetaActivity | F-COACH-015 |
| getCurrentPhase | function (inner) | 50539-50553 | Find the plan phase containing the current week | plan pane (50984), calcPhaseProgress (50719) | — | F-COACH-030 |
| parseTargetValue | function (inner) | 50574-50591 | Parse "315 lb"/"12%" style target strings | matchTargetToData (50594) | parseFloat | F-COACH-030 |
| matchTargetToData | function (inner) | 50592-50700 | Match a phase target to a PR, bodyweight, bf or goal | calcTargetProgress (50702) | parseTargetValue, getEx, liftDisp, getWeightLog, getBfLog, ld | F-COACH-030 |
| calcTargetProgress | function (inner) | 50701-50717 | Percentage progress toward one phase target | calcPhaseProgress (50748), timeline (51231) | matchTargetToData | F-COACH-030 |
| calcPhaseProgress | function (inner) | 50718-50742 | 40% time + 60% targets, clamped | calcOverallProgress (50746), timeline (51196) | getCurrentPhase, calcTargetProgress | F-COACH-030 |
| calcOverallProgress | function (inner) | 50743-50749 | Mean phase progress across the plan | plan pane (50985) | calcPhaseProgress | F-COACH-030 |
| isDeload | function (inner) | 51012-51015 | Name/focus substring test for deload weeks | this-week card (51045), timeline (51199) | — | F-COACH-030 |
| dotRow | function (inner) | 52604-52625 | 14-day check-in dot strip | FeedbackScreen (52664, 52685, 52836) | isoDay, dayOf | F-COACH-035 |
| setEntries | function (inner) | 52558-52565 | Functional setter that persists `lk_feedback` | submit (52588) | sd | F-COACH-033 |
| setVal | function (inner) | 52566-52571 | Set one check-in item's 1-5 value | scale buttons (52750) | — | F-COACH-033 |
| submit | function (inner) | 52574-52601 | Build, evaluate and store a check-in | "Check in" button (52815) | coachCheckinResponse, setEntries, logBetaActivity | F-COACH-033 |
| FeedbackScreen | component | 52547-52805 | The daily check-in pane: form, payoff card, history dots | CoachScreen (52246) | coachCheckinResponse, checkin* helpers | F-COACH-033..036 |
| BetaAdminPanel | component | 52806-53209 | Beta code management, activity/AI/feedback log viewers, export, sync | App router (57710) — unreachable | addCode, toggleCode, exportAll, syncBetaData | F-COACH-037..040 |
| setCodes | function (inner) | 52815-52822 | Functional setter that persists `lk_betaCodes` | addCode, toggleCode | sd | F-COACH-037 |
| addCode | function (inner) | 52823-52833 | Append a new uppercase beta code | Add button (52993) | setCodes | F-COACH-037 |
| toggleCode | function (inner) | 52834-52842 | Revoke / reactivate a code | row button (53026) | setCodes | F-COACH-037 |
| exportAll | function (inner) | 52843-52859 | Download codes + all logs as JSON | Export button (52925) | Blob, URL.createObjectURL | F-COACH-039 |

Shared helpers the range depends on (defined outside 49400-53209, indexed for completeness):

| Name | Kind | file:lines | Purpose | Feature ID(s) |
|---|---|---|---|---|
| aiCall | function | 2663-2692 | Shared AI helper, `max_tokens:700`, gated-response handling, `logBetaAI` | **not called from this range** |
| authHeaders | function | 2653-2662 | `Content-Type` + `Authorization: Bearer <window.LOCKED.session.access_token>` | F-COACH-002, F-COACH-028 |
| logBetaAI | function | 2783-2793 | Append `{ts,input,output,betaId}` to `lk_betaAILog` | F-COACH-038 (viewer only) |
| logBetaActivity | function | 2770-2782 | Append `{ts,action,data,betaId}` to `lk_betaLog` | F-COACH-007, 011..015, 021, 024, 025, 033 |
| syncBetaData | function | 2797-2841 | POST all local beta data to `/beta-sync` | F-COACH-040 |
| coachBuildContext | function | 49001-49268 | Builds the entire chat system prompt | F-COACH-002 |
| coachTier3For | function | 48979-49000 | Keyword gate deciding which deep data blocks are attached | F-COACH-002 |
| coachStyle | function | 48968-48978 | Resolve the selected persona | F-COACH-025 |
| coachDataPrefs | function | 48931-48937 | Data-visibility prefs, default all-on | F-COACH-027 |
| coachMemoryItems | function | 48938-48946 | Normalise legacy + new memory shapes | F-COACH-026 |
| coachMemoryOn | function | 48947-48949 | Memory master switch | F-COACH-019, 026 |
| coachOpener | function | 49277-49384 | Data-driven empty-state line + chips | F-COACH-007 |
| coachVisibleData | function | 49388-49398 | Human-readable list for the context receipt | F-COACH-008 |
| coachContextTokens | function | 49272 | `length/4` token estimate — **no caller in this range** | — |
| checkinScaleLabel | function | 52381-52389 | Word label for a 1-5 value | F-COACH-035 |
| checkinStats | function | 52391-52414 | 30-day per-item mean/SD, min 14 entries | F-COACH-034 |
| checkinFlag | function | 52415-52426 | amber/red at 1/2 SD, stress inverted | F-COACH-034 |
| checkinFlags | function | 52427-52439 | Flags for a whole entry | F-COACH-034 |
| checkinLowRun | function | 52440-52461 | Consecutive low days from newest | F-COACH-034 |
| checkinPerDay | function | 52462-52465 | 1, 2 or 4 check-ins/day | F-COACH-033 |
| checkinCountToday | function | 52466-52473 | Count today's entries | F-COACH-033 |
| checkinDoneForDay | function | 52474-52476 | Quota met? | F-COACH-001, 033 |
| checkinDoneToday | function | 52477-52484 | First entry for today, or null | F-COACH-034 |
| coachCheckinResponse | function | 52489-52543 | The local rules engine behind the payoff card | F-COACH-034 |

Counts: **40 features**, **56 indexed entries** (46 defined inside the range + 10 in-range-critical shared helpers; the shared-helper table lists 25 rows in total).

---

## THE AI CONTRACT

Every AI request from this range goes to the same Cloudflare Worker origin. There are **exactly two** fetches in 49400-53209.

### Call 1 — Coach chat (`fireRequest`, 50048-50100)

- **Endpoint**: `https://lockedapi.cescocugliari.workers.dev/` (50061)
- **Method**: POST (50062)
- **Headers**: `authHeaders()` (50063) → `{"Content-Type":"application/json"}` plus `Authorization: Bearer <window.LOCKED.session.access_token>` when a Supabase session exists (2653-2662). The token read is wrapped in try/catch, so an anonymous user sends no auth header at all.
- **Body**: `{ system: <full context string>, max_tokens: 1000, messages: histRef.current }` (50064-50069). `messages` is the entire local transcript of `{role:"user"|"assistant", content:string}` — up to 40 turns (49927). **No `model` field, no `temperature`, no `stream`.**
- **Streaming**: none. Single JSON response.
- **Abort**: `AbortController` created in try/catch, stored in `sendAbortRef`, wired to `signal` (50050-50070); the Stop button aborts it (50121-50124).
- **Rate limiting**: none client-side; HTTP 429 is interpreted as the daily free-chat cap and shown as "You've used your 10 free chats today. Resets at midnight." (50072, 50085) — the number 10 is hardcoded copy, the actual limit is server-side and UNVERIFIED.
- **Response shape expected**: Anthropic-style `{content:[{text:"…"}]}` (50160-50161). If `content[0].text` is absent the reply becomes the literal string `"Try again."` — the OpenAI-style `choices[0].message.content` fallback that `aiCall` has (2681) is **absent here**.
- **Parsing**: `handleReply` (50159-50322), documented in F-COACH-009.
- **Fallbacks on error**: 429 → limit row + "See plans" → `window.LOCKED.paywall()`; non-ok → "The coach is down. Not your fault."; `navigator.onLine === false` → "No connection. Your message is saved."; AbortError → "Stopped." (50072-50098).

**The system prompt** is assembled at request time by `coachBuildContext` (49001-49268). Its fixed literal parts, verbatim:

Head (49018-49027):
> "You are an elite personal trainer and sports nutritionist coaching " + (profile.displayName || "the user") + " inside the LOCKED app." + (profile.coachName ? " Your name is " + profile.coachName + " — refer to yourself by it naturally when it fits." : "") + " " + coachStyle().tone + " Reference their actual data when relevant — never give generic advice when you have their numbers. Offer options with reasons rather than orders: when advising a change, give the why and, where sensible, two ways to act on it. Vary response length: short answers for simple questions. Never bullet-point a conversational reply."

Then, conditionally (49029-49038):
> "\nUSER INSTRUCTIONS (follow these closely, the user wrote them to guide you): " + `lk_coachInstructions`
> "\nMEMORY (facts this user has let you keep):" followed by one "\n- <fact>" per memory.

The persona `tone` sentence is one of seven (48950-48967), verbatim, e.g. Warm (the default):
> "Tone: warm and conversational, like a knowledgeable friend who trains. Notice effort as well as results. Use contractions, keep it real."

Constraint block, verbatim (49122-49129):
> "CONSTRAINT RULES (FOLLOW STRICTLY): 1) Weight increases must be realistic: suggest max +15% above their current PR, never more than +50lbs/22kg per 6 weeks. 2) Food portions must be reasonable: if they eat 100g protein daily, suggest 150-250g max (1.5-2.5x current). Never suggest 5kg portions. 3) Volume scaling: suggest +10-20% weekly volume increases only. Progressive overload is gradual. 4) Recovery bounds: never suggest workouts exceeding 90 min or <4hr sleep without noting it's suboptimal. 5) If their PR is unknown, ask for it before suggesting increases. 6) In workout data, '+NP' means N partial reps performed after reaching failure on a set. 7) Never frame a low check-in as the user's fault, and never push training through a red day to protect a plan or a streak."

Then `COACH_MARKER_DOCS` (48885-48896) is appended verbatim — the complete action-marker contract for PROGRAM, RECIPE, GOAL, FOOD, PLAN, SHOPPING_ADD, INSTRUCTIONS, CARDIO and REMEMBER, including a hardcoded exercise-ID table (48886: "Exercise IDs: Chest=107,101,108,110,112. Back=201,202,206,207,208. Shoulders=301,302,306,307,311. Triceps=403,406,407,408. Biceps=503,502,506,505. Quads=701,702,703,704. Hams=801,802,803. Abs=10…") and an explicit "IMPORTANT: You can take actions!" paragraph (48891). Notable clause (48895): "NEVER include a calorie number — the app calculates calories from a physics model…".

Final assembly (49261-49267): `head + "\n\n" + <tier-1 lines> + "\n\n" + constraints + COACH_MARKER_DOCS + ("\n\n== PULLED FOR THIS QUESTION ==\n" + deep) + "\n\n" + <tier-2 last-7-days lines>`.

### Call 2 — Coach interview (`generate`, 49764-49793)

- **Endpoint**: `https://lockedapi.cescocugliari.workers.dev/` (49772)
- **Method**: POST (49773)
- **Headers**: `authHeaders()` (49774) — same Bearer token as above.
- **Body**: `{system: <prompt below>, max_tokens: 600, messages:[{role:"user", content: usr}]}` (49775-49778). No `model`, `temperature` or `stream`.
- **System prompt, verbatim** (49765-49770):
> "You are a personal training coach. The user answered a six-question onboarding interview. Write personalised coaching instructions for yourself based on their answers: goals, experience, injuries to work around, how to speak to them, what made them quit before, anything else. Under 300 words, plain text, written as directives (\"Keep answers short\", \"Never programme X\"). Output ONLY the instructions between ###INSTRUCTIONS_START### and ###INSTRUCTIONS_END###."
- **User message**: `all.map(a => a.q + "\n" + a.a).join("\n\n")` — the six questions and the user's answers only (49771). **No profile, history or memory is attached to this call.**
- **Response shape expected**: `{content:[{text}]}` (49783). Extraction: slice between the markers (offset +24 for the 24-char start marker), else the whole trimmed text; an empty body throws (49784-49789).
- **Fallback on error**: any non-ok status or empty body → `phase="error"` → "The coach is down. Not your fault — your answers are kept." plus a Retry that re-runs `generate(answers)` (49790-49792, 49869-49886).
- **Abort / rate limiting**: **none**. No `AbortController`, no `signal`, no 429 branch — a 429 here is reported as a generic outage.

### `aiCall` is not used by this range

`aiCall(sys, userMsg, onLoad, onDone, onFail, signal)` (2663-2692, `max_tokens: 700`) is called at 13586, 16108, 19588, 27204, 27234, 40808, 40835, 41400 and 47623 — **none of which are in 49400-53209**. The coach chat and the interview both hand-roll their own `fetch`. Consequences:
- Neither call implements `aiCall`'s `d.gated` branch (2673-2679), so a gated/quota response from the Worker would be rendered as an ordinary reply or as "Try again.".
- Neither call reaches `logBetaAI` (2683) — so **coach chat and the interview are never written to `lk_betaAILog`**.

---

## Model names

**Definitive: no AI model name appears anywhere client-side in this file.**

- A case-insensitive search for `groq|llama` over the whole 58,015-line file returns **0 matches**.
- Searching the whole file for `model:` / `"model"` returns only four unrelated hits: `zoneModel` for cardio heart-rate zones (5652), a calorie-method label `model: "pandolf-santee"` (6234), and gym-machine brand/model fields (56620, 56634). None is an LLM.
- Within 49400-53209, a search for `groq|llama|gpt|claude|model|temperature|anthropic|openai|api[_-]?key|token` matches only: the word "model" in two prose comments (49451, 52482), `max_tokens: 600` (49775) and `max_tokens: 1000` (50065).
- Neither request body carries a `model` field (49775-49778, 50064-50069), nor does the shared `aiCall` (2666-2671).

Model selection therefore happens entirely inside the Cloudflare Worker at `lockedapi.cescocugliari.workers.dev`, whose source is not in this repo. **Whether that Worker uses Groq/Llama is UNVERIFIED and unverifiable from the client.** The one client-side hint is the response shape: both parsers expect Anthropic's `{content:[{text}]}` first (49783, 50160), with `aiCall` alone also accepting the OpenAI/Groq-style `{choices:[{message:{content}}]}` (2681) — consistent with a Worker that may proxy either or both, but not proof.

**No hardcoded API key or secret appears in this range.** The only credential is the runtime bearer token read from `window.LOCKED.session.access_token` (2657-2659), which is not a hardcoded value.

---

## Data sent off-device

Every field below is concatenated into the `system` string of the chat POST (50064) and leaves the device on **every message**, unless the named `lk_coachDataPrefs` switch is off (F-COACH-027). Cites are into `coachBuildContext` (49001-49268).

Always sent (no pref gate):
1. `profile.displayName` — real name (49019, 49041).
2. `profile.coachName` (49022).
3. Selected persona tone string (49023).
4. `lk_coachInstructions` — the user's free-text instruction block, up to 2000 chars (49030).
5. `lk_coachMemory` — every remembered fact verbatim, when `lk_coachMemoryOn !== false` (49032-49037). Facts are explicitly injuries, boundaries, preferences (48896).
6. `profile.age`, `profile.sex`, `profile.weightKg`, `profile.heightCm`, preferred unit (49042-49046).
7. `profile.goal` (49048).
8. The full conversation transcript, up to 40 turns, in `messages` (50068).

Pref-gated:
9. `goals` — up to 3 active goals with name, target, unit, target date and days remaining (`prefs.goals`, 49050-49058).
10. `coachPlan` — plan name, phase index, phase name, current week, focus (`prefs.plan`, 49060-49080).
11. Today's check-in — every 1-5 value with amber/red flags, hours slept, tags, and the free-text note truncated to 120 chars (`prefs.checkins`, 49082-49110); plus a wellbeing note when mood has been low ≥7 days (49111-49117).
12. Whether they trained today and a one-line session summary (`prefs.training`, 49119-49127).
13. **Tier 3, keyword-gated** (`coachTier3For`, 48979-49000) — attached only when the question matches:
    - Full detail of the last 5 sessions: exercise names, set counts, top weight, partial reps (`t3.lifts && prefs.training`, 49132-49154).
    - Up to 10 PRs with weight × reps (49146-49151).
    - Every split name and its day names (49152-49155).
    - `fuelProfile`: goal, TDEE, protein/carb/fat targets, **allergies**, diet preferences (`t3.food && prefs.nutrition`, 49158-49165).
    - Every food item logged today by meal with calories and protein (49166-49173).
    - Linked grocery stores by name and description (49174-49178).
    - `supplements`: name, dose, frequency, timing (`t3.supps && prefs.supplements`, 49180-49185).
    - **Active PED cycles**: cycle name, week, compound names, doses, frequencies (`t3.cycle && prefs.cycle && lk_perfTracking`, 49186-49195). This is the most sensitive category in the app.
    - Last 5 body-fat entries with dates (`t3.bf && prefs.bodyfat`, 49196-49201).
    - Last 5 cardio sessions (`t3.cardio && prefs.training`, 49202-49206).
14. Tier 2, last 7 days: session count and names, total volume, cardio minutes (`prefs.training`, 49210-49222); average calories and protein vs targets (`prefs.nutrition`, 49223-49238); current bodyweight and its ~7-day trend (`prefs.weight`, 49239-49250).

The **interview call** (49772) sends far less: only the six question strings and the user's six answers (49771) — which nonetheless include stated injuries and reasons for quitting.

The **beta sync** endpoint (2823, triggered from F-COACH-040 and a midnight interval at 2842) sends, unauthenticated, keyed only by `betaId`: `betaLog`, `betaAILog`, `feedback` (every check-in including free-text notes), `weightLog`, full workout `history`, `cycles`, `cycleLog`, `coachInstructions`, `goals`, `bfLog` and `coachPlan` (2803-2821).

---

## Beta logging

- **Key**: `lk_betaAILog` (`sd("betaAILog", …)` at 2792 with the `lk_` prefix from 2437).
- **Writer**: `logBetaAI(input, output)` (2783-2793). It returns immediately unless `ld("betaStatus", false)` is truthy (2784), then appends `{ts: new Date().toISOString(), input, output, betaId: ld("betaId","unknown")}` and writes the whole array back.
- **`input` is the raw user message string only** — the system prompt is never logged (2683 passes `userMsg`, not `sys`). **`output` is the complete raw model text**, including all `###…###` action markers.
- **Only caller**: `aiCall` at 2683, guarded by `if (ld("betaStatus", false))`.
- **Critical finding**: because neither fetch in this range goes through `aiCall` (see the AI contract), **the flagship coach chat and the coach interview are never logged to `lk_betaAILog`**. What the panel at 53091 displays is only the nine other `aiCall` sites (13586, 16108, 19588, 27204, 27234, 40808, 40835, 41400, 47623) — none of which is the coach.
- **Size limits**: **none**. No cap, no trimming, no pruning anywhere — `logBetaAI` unconditionally pushes and rewrites (2785-2792). Contrast `lk_coachLastMsgs`, capped at 40 (49926). The only backstop is the global `sd` quota handler, which toasts "Storage is full - changes are not being saved." once and dispatches `lockedStorageFull` (2440-2452).
- **Display truncation** (viewer only, not storage): newest 30 entries, input and output each sliced to 300 chars (53092, 53132, 53155).
- **Also written**: `lk_betaLog` via `logBetaActivity` (2770-2782), same no-cap shape. From this range it records `persona_changed` (49585), `coach_renamed` (50010), `coach_instructions_updated` (50027), `coach_chip_used` (51270), `coach_recipe_saved` (50393), `coach_goal_created` (50446), `coach_food_logged` (50516), `coach_plan_saved` (50534) and `feedback` — **the entire check-in entry, free-text note included** (52590).
- Both logs are uploaded by `syncBetaData` as `aiLogs` and `activity` (2805-2806).

---

## Storage keys touched

(all real keys carry the `lk_` prefix, 2420/2437)

Read and written by this range:
| Key | Read | Written |
|---|---|---|
| `coachLastMsgs` | 49916 | 49926, 49943 |
| `coachLastHist` | 49921 | 49927, 49944 |
| `coachInstructions` | 50075, 50078 | 50024, 50034 |
| `coachMemory` | 50081 | 50086 (via setCoachMemory) |
| `coachMemoryOn` | 49485 (`coachMemoryOn()`), 50289 | 49618 |
| `coachStyle` | 49484 | 49585 |
| `coachDataPrefs` | 49487 (`coachDataPrefs()`) | 49492 |
| `coachPlan` | 50016 | 50020 |
| `coachRecipes` | 50384 | 50385 |
| `goals` | 50440, 50673 | 50442 |
| `fuelLog` | 50482 | 50499 |
| `feedback` | 50905, 52548 | 52560 (via setEntries) |
| `coachMoodRaisedAt` | 52548 (`coachCheckinResponse` 52546) | 52551 |
| `checkinPerDay` | 52463 | — |
| `profile` | 49405 | — |
| `betaCodes` | 52808 | 52818 |
| `betaLog` | 52811 | via `logBetaActivity` (2779) |
| `betaAILog` | 52814 | via `logBetaAI` (2792) — never from this range |
| `lastSync` | 52964 | via `syncBetaData` (2834) |
| `betaStatus` | 2784, 2772 (gate for both logs) | — |
| `betaId` | 2780, 2790 | — |

Read indirectly by `coachBuildContext` on every chat message: `coachInstructions`, `coachMemory`, `coachMemoryOn`, `coachDataPrefs`, `coachStyle`, `goals`, `coachPlan`, `feedback`, `coachMoodRaisedAt`, `fuelProfile`, `fuelLog`, `myStores`, `supplements`, `perfTracking` + cycles, `bfLog` (49030-49250).

---

## Open questions / UNVERIFIED

1. **Model and provider** — UNVERIFIED. No `model` field is sent (49775, 50064) and no model name exists client-side. *Confirmed by*: reading the Worker source at `lockedapi.cescocugliari.workers.dev` (not in this repo), or capturing a response that carries a provider-identifying field.
2. **The "10 free chats today" number** — UNVERIFIED. The copy at 50085 is hardcoded; the actual cap is whatever the Worker enforces before returning 429 (50072). *Confirmed by*: the Worker source, or observing when 429 first appears.
3. **`p.setHistory` in `saveCoachCardio` (50472)** — likely BROKEN. CoachScreen's call site (57710-57721) passes `useKg, prs, splits, setSplits, history, profile, updateProfile, go` — no `setHistory`. If that list is complete, tapping "LOG CARDIO" on a coach cardio card throws `p.setHistory is not a function` and the session is never saved, after the button has already flipped to "✓ LOGGED" (49439). *Confirmed by*: re-reading 57705-57730 in full (Agent covering the router should confirm) or tapping the button in the live app. Marked UNVERIFIED because the prop list sits outside my range.
4. **`BetaAdminPanel` reachability** — no `go("betaAdmin")` or `setScreen("betaAdmin")` exists anywhere in the file (only 57710 and 57958 mention the string). *Confirmed by*: whoever audits Settings/router should confirm no dynamic screen name is constructed at runtime.
5. **Gated responses (`d.gated`)** — the coach chat never checks for the field `aiCall` handles at 2673. Whether the Worker returns `{gated:true}` on the free-tier cap or a bare 429 is UNVERIFIED; if it returns 200 + `gated`, the user sees the upsell text rendered as an ordinary coach reply.
6. **Anonymous requests** — `authHeaders` silently omits `Authorization` when there is no session (2656-2661). Whether the Worker accepts unauthenticated coach requests is UNVERIFIED.
7. **`coachContextTokens` (49272)** is defined for telemetry but has no caller in the file — DEAD as far as this range shows.

### Security findings
- **S-1** Beta gating is entirely client-side. `lk_betaCodes` lives in localStorage and `validateBetaCode` reads it (2708-2715); `validateBetaCodeRemote` **fails open** on any network error (`.catch(function(){ onResult(true, null); })`, 2743). Anyone can grant themselves beta status from devtools.
- **S-2** `/beta-sync` is called with **no Authorization header** (2823-2830) and is keyed only by `betaId` — the lowercased beta code (2765), drawn from a published list of seven (2694). Any party who guesses `joshbeta` can POST arbitrary data as that user, and the payload includes workouts, weight, body fat, PED cycles and check-in notes (2803-2821).
- **S-3** No hardcoded API key or secret appears in this range. The only credential is the runtime `window.LOCKED.session.access_token` (2657), read defensively.
- **S-4** `lk_betaAILog` and `lk_betaLog` grow without bound (2785-2792, 2774-2781) inside a ~5 MB localStorage budget shared with progress photos (comment at 2857-2861). Long-running beta users will hit quota and silently stop persisting *everything*.
- **S-5** Privacy: active PED cycle names, compounds and doses are placed in the system prompt whenever a question mentions "cycle", "compound", "testosterone", "pct", "blast" or "cruise" (48986, 49186-49195). The user's own "what your coach can see" switch defaults to ON for this (48937).
