### F-ONB-001 — Onboarding gate (when the flow appears / how it is skipped)
- location: App root > pre-render gate
- user action: none — automatic on boot
- behaviour: 1. `App` renders. If `profile` is falsy, or `profile.displayName` falsy, or `profile.username` falsy, it returns `<Onboarding onComplete={completeOnboarding}/>` and renders nothing else (`redesign/input/locked-current-v6.html:57556-57558`). 2. Otherwise the full app renders. 3. Guest mode bypasses onboarding entirely: `enterGuestMode()` seeds `lk_profile` with `{displayName:"Athlete", username:"athlete", useKg:true, createdAt}` then reloads, so the gate never fires (`redesign/input/locked-current-v6.html:168-178`).
- v6 status: WORKING

### F-ONB-002 — Step 1 — Welcome / splash
- location: Onboarding > step 1 screen
- user action: reads the pitch, optionally enters an invite code, taps GET STARTED
- behaviour: 1. Renders full-screen gradient `linear-gradient(135deg,#0A0A0B 0%,#1A0A02 100%)` with an 88px logo tile, "LOCKED" headline, and the tagline "The training app built around how serious lifters actually train." (`:33994-34037`) 2. Renders the optional invite-code card (F-ONB-003). 3. GET STARTED calls `setStep(2)` unconditionally — the invite code is never required (`:34277`). 4. Below the button: a legal line, "By continuing you agree not to copy, reverse-engineer, or reproduce any part of this application or its source code." (`:34295`)
- v6 status: WORKING

### F-ONB-003 — Invite / beta code entry + Beta Tester Agreement (step 1)
- location: Onboarding > step 1 > "INVITE CODE (OPTIONAL)" card
- user action: types a code, taps **Verify**; if accepted, reads the agreement and taps **I Agree**
- behaviour: 1. Input uppercases every keystroke and clears `betaErr` (`:34090-34093`). 2. Verify with an empty field sets `betaErr = "Enter a code"` and returns (`:34107-34110`). 3. Otherwise calls `validateBetaCodeRemote(betaCode, cb)` (`:34110`). 4. `validateBetaCodeRemote` first runs the LOCAL check `validateBetaCode(clean)` against `lk_betaCodes`; failing that it returns `(false,"Invalid code")` without ever hitting the network (`:2730-2734`). 5. If local passes, POST `https://lockedapi.cescocugliari.workers.dev/beta-validate` with `{code}` (`:2735-2744`). Response: `!d.valid` → "Invalid code"; `d.locked` → "This code is no longer available"; else success (`:2747-2753`). 6. **On network failure the catch calls `onResult(true, null)` — fail-open, the code is accepted** (`:2754-2756`). 7. Success sets `betaClaimed=true` and clears the error (`:34112-34114`). Failure shows `err || "Invalid or used code"`. 8. When `betaClaimed && !betaAgreed`, the Beta Tester Agreement panel appears listing collected data: workout data, AI coach interactions, check-in entries, nutrition/weight logs, app usage activity; plus a no-reverse-engineering clause (`:34133-34176`). 9. "I Agree" sets `betaAgreed=true` (`:34178`). Once both are true the card shows "Code accepted — you are in" (`:34193`). 10. The code is only *claimed* later, on step 2's CONTINUE (F-ONB-004).
- v6 status: PARTIAL

### F-ONB-004 — Step 2 — Create your profile (name + username)
- location: Onboarding > step 2, labelled "STEP 1 OF 3"
- user action: types display name and username, taps CONTINUE
- behaviour: 1. Header "STEP 1 OF 3" / "Create your profile" / "How you appear in the app." (`:34342-34362`) 2. **YOUR NAME** free text, placeholder "e.g. Alex, Jordan, Mike...", stored raw in `dispName`; border turns accent when non-empty (`:34372-34392`). 3. **USERNAME** free text, placeholder "e.g. alex_lifts". Every keystroke is transformed `value.toLowerCase().replace(/[^a-z0-9_]/g,"")` — lowercase, digits and underscore only (`:34294-34296` region, sanitiser at `:34296`/`:34297`). 4. CONTINUE is `disabled` unless `dispName.trim() && username.trim()` and (`!betaClaimed || betaAgreed`) (`:34319`). 5. On click: if beta claimed but not agreed, return (double guard, `:34313`); if `betaClaimed && betaCode`, call `claimBetaCode(betaCode, username.trim())`; then `setStep(3)` (`:34312-34317`). 6. `claimBetaCode` marks the code `usedBy`/`claimedAt` in `lk_betaCodes` and writes `lk_betaStatus=true`, `lk_betaCode`, `lk_betaId` (lowercased code) (`:2757-2769`).
- v6 status: WORKING

### F-ONB-005 — Step 3 — Choose your units (kg / lbs)
- location: Onboarding > step 3, labelled "STEP 2 OF 3"
- user action: taps one of two radio cards, taps CONTINUE
- behaviour: 1. Header "STEP 2 OF 3" / "Choose your units" / "Change anytime in your profile." (`:34337-34361`) 2. Two options rendered from a literal array: `{id:"kg", label:"Kilograms (KG)", desc:"Used in most countries"}` and `{id:"lbs", label:"Pounds (LBS)", desc:"Used in the US and UK"}` (`:34366-34375`). 3. Each is `role="button" tabIndex=0 onKeyDown={lkKeyActivate}` — keyboard accessible (`:34379-34381`). 4. Tapping sets `unitChoice`; the selected card gets an accent border and a filled radio dot (`:34383`, `:34400-34418`). 5. Default is `"kg"` (`:33812` — `useState("kg")`). 6. CONTINUE always enabled → `setStep(4)` (`:34427`).
- v6 status: WORKING

### F-ONB-006 — Step 4 — AI coach chat interview (auto-kickoff)
- location: Onboarding > step 4, header "LOCKED AI COACH" / "Building your personalized program" / "STEP 3 OF 3"
- user action: none to start — it fires automatically
- behaviour: 1. An effect on `[step]` fires when `step === 4 && msgs.length === 0 && !aiLoading`, and calls `kickoffChat()` after a `setTimeout(..., 100)` (`:33828-33833`). 2. `kickoffChat` sets `aiLoading=true` and calls `callWorker(getChatSys(), [{role:"user",content:"hi"}], …)` (`:33886-33889`). 3. On success it seeds `histRef.current = [user "hi", assistant txt]` and renders the reply (`:33890-33903`). 4. On failure it substitutes a hardcoded fallback: `"Hey " + dispName + "! How long have you been training and what is your main goal?"` and seeds history with it as if the model had said it (`:33904-33916`). 5. While `msgs` is empty and not loading, the pane shows the empty state "Starting your coaching session..." (`:34506-34517`). 6. While loading, a three-dot bubble animates with `animation: "pulse 1.4s "+i*0.2+"s infinite"` (`:34640-34665`). 7. A `useEffect` on `[msgs]` pins the scroll container to the bottom (`:33825-33827`).
- v6 status: WORKING (with the caveat above)

### F-ONB-007 — Step 4 — Answering questions (3-question loop, counter, send)
- location: Onboarding > step 4 > composer bar
- user action: types into "Type your answer...", presses Enter or taps the send button
- behaviour: 1. Input is a controlled field; `onKeyDown` sends on `Enter` (`:34704-34708`). 2. Send button is `aria-label="Send answer"`, disabled while `!input.trim() || aiLoading` (`:34722-34724`). 3. `send()` returns early if empty or loading (`:33918-33919`). 4. It clears the input, appends the user bubble, pushes `{role:"user",content:msg}` to `histRef`, increments `answerCountRef`, sets loading (`:33920-33934`). 5. **If `answerCountRef.current >= 3`** it stops conversing and calls `callWorker(getGenSys(), [{role:"user",content:"Generate my program now."}])` — the generation call (F-ONB-010) — and returns (`:33935-33976`). 6. Otherwise it calls `callWorker(getChatSys(), histRef.current, …)`, pushes the assistant reply to history, and — importantly — **also checks each conversational reply for an embedded program** via `tryParseProg`; if the model volunteers a program early, it is accepted and `done=true` (`:33977-34005`). 7. Under the composer: `"Question " + Math.min(userMsgCount + 1, 3) + " of 3"` (`:34742-34745`). 8. Error path in both branches appends the literal assistant bubble "Connection issue. Try again." and clears loading (`:33970-33975`, `:34006-34011`).
- v6 status: WORKING

### F-ONB-008 — Worker AI endpoint (`callWorker`) — the fetch at ~33857
- location: Onboarding internals (used by every AI call in the flow)
- user action: indirect
- behaviour: 1. `fetch("https://lockedapi.cescocugliari.workers.dev/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({system: sys, max_tokens: 800, messages: messages})})` (`:33857-33868`). 2. `.then(r => r.json())` — **no `r.ok` check**, so a 4xx/5xx JSON body is parsed as if it were a success (`:33869-33871`). 3. Response shaping tries three shapes in order (`:33872-33876`): - Anthropic shape: `d.content[0].text` - OpenAI shape: `d.choices[0].message.content` (note: `.content` on the message object) - Error shape: `d.error.message` → `txt = "API error: " + message` 4. If `txt.trim()` is truthy it calls `onDone(txt)`, else `onErr()` (`:33877`). 5. `.catch(onErr)` for network/parse failure (`:33878-33880`).
- v6 status: PARTIAL

### F-ONB-009 — Chat system prompt (`getChatSys`)
- location: Onboarding internals
- user action: none
- behaviour: builds a single string from six fragments (`:33835-33843`): - `"You are LOCKED AI, a strength coach onboarding " + dispName + "."` - `" Ask short questions one at a time to learn: training experience, main goal, days per week available."` - `" Keep replies to 1-2 sentences. After 3 answers you MUST generate their program."` - `" To generate: output ###PROGRAM_START### then a JSON object then ###PROGRAM_END### then one sentence."` - `" JSON shape: {name:string, splits:[{name:string, days:[{name:string, exIds:[numbers]}]}]}."` - An exercise-ID whitelist: Chest `107,101,108,110,112`; Back `201,202,206,207,208`; Shoulders `301,302,306,307,311`; Triceps `403,406,407,408`; Biceps `503,502,506,505`; Quads `701,702,703,704`; Hams `801,802,803`; Abs `1001,1008`.
- v6 status: WORKING

### F-ONB-010 — Program generation + parsing (`getGenSys`, `tryParseProg`)
- location: Onboarding internals, triggered on the 3rd answer
- user action: sending the 3rd answer
- behaviour: 1. `getGenSys()` concatenates all prior user turns except the literal `"hi"` seed, joined by `". "`, into `"Build a training split. User info: " + answers + "."` (`:33844-33850`). 2. Adds `" Output ONLY: ###PROGRAM_START### then JSON then ###PROGRAM_END### then one line."`, the same JSON shape line, `" Match days to their schedule."` and the same exercise-ID whitelist (`:33851-33855`). 3. Sent as a single user message `"Generate my program now."` (`:33937`). 4. `tryParseProg(txt)` finds `###PROGRAM_START###` and `###PROGRAM_END###`, slices `si+19 .. ei`, `JSON.parse`s it, returns `null` on any throw or on missing/ordered-wrong markers (`:33881-33884`). 5. `displayTxt = txt.slice(txt.indexOf("###PROGRAM_END###") + 17).trim()` — the one-sentence tail after the JSON (`:33940`). 6. On success: `setProg(parsed)`, append an assistant bubble carrying `prog`, `setDone(true)` (`:33941-33952`). 7. On parse failure: append "Could not generate program. Please try again." — but `done` stays false, so the composer remains and the user can send more (each further send re-enters the `>= 3` generation branch) (`:33953-33961`).
- v6 status: WORKING

### F-ONB-011 — Program preview card (in-chat)
- location: Onboarding > step 4 > assistant bubble carrying `m.prog`
- user action: none — read-only
- behaviour: renders `m.prog.name` as an accent-coloured label, then one row per split: index (`si+1`), split name, and `s.days[0].exIds.length + " ex"` (`:34590-34638`).
- v6 status: PARTIAL

### F-ONB-012 — Finish — SAVE MY PROGRAM
- location: Onboarding > step 4 > fixed bottom bar, visible only when `done`
- user action: taps "SAVE MY PROGRAM"
- behaviour: 1. `finish(true)` → `p.onComplete({displayName: dispName.trim(), username: username.trim(), useKg: unitChoice === "kg"}, prog)` (`:33986`… precisely `finish` at `:34011-34017`). 2. `completeOnboarding(data, prog)` builds `pr = {displayName, username, useKg, createdAt: new Date().toLocaleDateString()}`, writes `sd("profile", pr)` → `lk_profile`, sets `profileRaw` and `useKgRaw` (`:57346-57353`). 3. If `prog && prog.splits`: it checks whether any split has `days`. - **Nested shape** (`hasDays`): each split becomes `{id:"s"+Date.now()+i*997, name, days: d.map(d => ({name, exIds: d.exIds || d.exercises || []})), created}` (`:57360-57373`). - Then a consolidation heuristic: if every split has exactly one day AND there are ≥2 splits, they are merged into a single split named `prog.name || "My Program"` whose `days` are the former splits (`:57374-57391`). - **Flat shape** (no `days`): one split `{id:"s"+Date.now(), name: prog.name||"My Program", days: prog.splits.map(s => ({name: s.name, exIds: s.exIds || s.exercises || []}))}` (`:57392-57403`). 4. `setSplits(newSplits)` then `setScreen("home")` (`:57404-57406`).
- v6 status: WORKING

### F-ONB-013 — Skip — "Skip - set up manually"
- location: Onboarding > step 4 > two places
- user action: taps "Skip - set up manually"
- behaviour: 1. Available **before** any answer, at the bottom of the composer bar (`:34746-34759`), and **after** generation, under SAVE MY PROGRAM (`:34670-34684`). 2. Both call `finish(false)` → `onComplete(profileData, null)` (`:34011-34017`). 3. `completeOnboarding` writes the profile and, with `prog` null, skips the splits branch entirely and goes straight to `setScreen("home")` (`:57354`, `:57406`).
- v6 status: WORKING

### F-ONB-014 — FOODS database
- location: module scope, used by the Fuel/nutrition screens
- user action: 
- behaviour: a literal array of ~110 food objects, each `{n: name, cal, pro, carb, fat, unit, g}` where `cal/pro/carb/fat` are **per 100 g** and `g` is the grams in one `unit` (`:34768-35656`). Examples: `{n:"Chicken Breast", cal:165, pro:31, carb:0, fat:3.6, unit:"oz", g:28}` (`:34768-34775`); last entry `{n:"Granola Bar", cal:411, pro:8.5, carb:64, fat:14, unit:"bar", g:47}` (`:35648-35655`). - Storage / Network / AI: none
- v6 status: WORKING — `:35657` consumes it directly.

### F-ONB-015 — `estimateMacros` — natural-language food parser
- location: nutrition logging
- user action: types e.g. "6 oz chicken 1 cup rice"
- behaviour: 1. Lowercases and splits on `/[\s,]+/` (`:35658`). 2. Walks the token list. If `words[i]` parses as a float it treats it as a quantity, takes `words[i+1]` as the unit word and `words[i+2] || words[i+1]` as the food word (`:35667-35670`). 3. Matches by substring either direction against `FOODS[fi].n.toLowerCase()` or its first word (`:35671-35678`). 4. On match: `grams = qty * match.g`, `factor = grams/100`, each macro `Math.round(macro*factor)`, pushed to `found` with name `qty + " " + match.n`, then `i += 3` (`:35679-35695`). 5. If the token is not a number and is longer than 2 chars, it looks for a bare food-name match and adds **one unit** (`factor = match.g/100`) (`:35697-35719`). 6. Returns `{items: found, totals}` (`:35723-35726`).
- v6 status: PARTIAL

### F-ONB-016 — `calcTDEE`
- location: 
- user action: 
- behaviour: returns `2200` if profile or `weightKg`/`heightCm`/`age` missing (`:35729`). Mifflin/Harris-Benedict-style BMR: female `447.593 + 9.247*kg + 3.098*cm - 4.330*age`; else `88.362 + 13.397*kg + 4.799*cm - 5.677*age` (`:35734-35738`) — these are the **revised Harris-Benedict** coefficients. Activity multipliers `{sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9}`, default `1.55` (`:35739-35746`). Goal adjust: `cut` ×0.8, `bulk` ×1.1 (`:35748-35749`).
- v6 status: WORKING — `:35750` returns the value.

### F-ONB-017 — `calcMacros`
- location: 
- user action: 
- behaviour: `kg = parseFloat(weightKg) || 80`; protein `kg × (cut 2.4 | bulk 2.0 | else 2.2)` g; fat `tdee*0.25/9` g; carbs `(tdee - pro*4 - fat*9)/4`, floored at 50 (`:35752-35762`).
- v6 status: WORKING — `:35757-35761`.
