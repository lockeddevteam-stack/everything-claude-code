# Agent 9 — Onboarding & System Audit

File audited: `redesign/input/locked-current-v6.html` (58,015 lines).
Exclusive range: **33808–35762**. Actual contents of that range:

- `Onboarding` component — **33808–34767** (960 lines)
- `FOODS` constant array (~110 food entries) — **34768–35656**
- `estimateMacros` — **35657–35727**
- `calcTDEE` — **35728–35751**
- `calcMacros` — **35752–35762**

NOTE FOR THE REDESIGN TEAM: the range brief said "the entire `Onboarding` component" for 1,955 lines, but `Onboarding` ends at 34767 (`redesign/input/locked-current-v6.html:34767`). The remaining ~1,000 lines are the nutrition food database and three nutrition math helpers, which are documented here too (they belong to the Fuel/nutrition feature owned elsewhere, but no other agent has this range).

---

# PART A — Feature entries

## Onboarding

### F-ONB-001 Onboarding gate (when the flow appears / how it is skipped)
- Location: App root > pre-render gate
- User action: none — automatic on boot
- Behavior:
  1. `App` renders. If `profile` is falsy, or `profile.displayName` falsy, or `profile.username` falsy, it returns `<Onboarding onComplete={completeOnboarding}/>` and renders nothing else (`redesign/input/locked-current-v6.html:57556-57558`).
  2. Otherwise the full app renders.
  3. Guest mode bypasses onboarding entirely: `enterGuestMode()` seeds `lk_profile` with `{displayName:"Athlete", username:"athlete", useKg:true, createdAt}` then reloads, so the gate never fires (`redesign/input/locked-current-v6.html:168-178`).
- Components: `Onboarding` (`:33808-34767`), `App` (gate at `:57556`)
- Functions: `completeOnboarding` (`:57345-57407`), `enterGuestMode` (`:168-178`)
- State: `profile` in `App`; `step` 1..4 local to `Onboarding` (`:33809`)
- Storage: reads `lk_profile`; writes `lk_profile` (`:57352`), `lk_guestMode` (`:169`)
- Network: none at the gate
- AI: none
- Edge cases: There is **no resume**. `step` initialises to `1` every mount (`:33809`) and nothing about partial progress is persisted, so a refresh mid-onboarding restarts at step 1. Conversely, once `lk_profile` has displayName+username the flow can never be re-entered from the UI.
- Gating: always on
- Status: WORKING
- Evidence for status: `:57556` — the boolean gate is unconditional and complete.
- Notes: The guest seed writes a fake username `athlete`, which collides for every guest user (`:172`).

### F-ONB-002 Step 1 — Welcome / splash
- Location: Onboarding > step 1 screen
- User action: reads the pitch, optionally enters an invite code, taps GET STARTED
- Behavior:
  1. Renders full-screen gradient `linear-gradient(135deg,#0A0A0B 0%,#1A0A02 100%)` with an 88px logo tile, "LOCKED" headline, and the tagline "The training app built around how serious lifters actually train." (`:33994-34037`)
  2. Renders the optional invite-code card (F-ONB-003).
  3. GET STARTED calls `setStep(2)` unconditionally — the invite code is never required (`:34277`).
  4. Below the button: a legal line, "By continuing you agree not to copy, reverse-engineer, or reproduce any part of this application or its source code." (`:34295`)
- Components: inline in `Onboarding` (`:33994-34296`)
- Functions: none beyond the inline onClick
- State: `step` (`:33809`)
- Storage: none written at this step
- Network: none (unless Verify tapped)
- AI: none
- Edge cases: no validation; the step cannot fail.
- Gating: always on
- Status: WORKING
- Evidence for status: `:34277` — `onClick: setStep(2)` with no guard.
- Notes: The step-1 screen carries no "STEP n OF 3" label; the counter starts at step 2 ("STEP 1 OF 3", `:34342`), so the visible flow is 4 screens labelled 3.

### F-ONB-003 Invite / beta code entry + Beta Tester Agreement (step 1)
- Location: Onboarding > step 1 > "INVITE CODE (OPTIONAL)" card
- User action: types a code, taps **Verify**; if accepted, reads the agreement and taps **I Agree**
- Behavior:
  1. Input uppercases every keystroke and clears `betaErr` (`:34090-34093`).
  2. Verify with an empty field sets `betaErr = "Enter a code"` and returns (`:34107-34110`).
  3. Otherwise calls `validateBetaCodeRemote(betaCode, cb)` (`:34110`).
  4. `validateBetaCodeRemote` first runs the LOCAL check `validateBetaCode(clean)` against `lk_betaCodes`; failing that it returns `(false,"Invalid code")` without ever hitting the network (`:2730-2734`).
  5. If local passes, POST `https://lockedapi.cescocugliari.workers.dev/beta-validate` with `{code}` (`:2735-2744`). Response: `!d.valid` → "Invalid code"; `d.locked` → "This code is no longer available"; else success (`:2747-2753`).
  6. **On network failure the catch calls `onResult(true, null)` — fail-open, the code is accepted** (`:2754-2756`).
  7. Success sets `betaClaimed=true` and clears the error (`:34112-34114`). Failure shows `err || "Invalid or used code"`.
  8. When `betaClaimed && !betaAgreed`, the Beta Tester Agreement panel appears listing collected data: workout data, AI coach interactions, check-in entries, nutrition/weight logs, app usage activity; plus a no-reverse-engineering clause (`:34133-34176`).
  9. "I Agree" sets `betaAgreed=true` (`:34178`). Once both are true the card shows "Code accepted — you are in" (`:34193`).
  10. The code is only *claimed* later, on step 2's CONTINUE (F-ONB-004).
- Components: inline (`:34038-34272`)
- Functions: `validateBetaCodeRemote` (`:2729-2756`), `validateBetaCode` (`:2722-2728`), `initBetaCodes` (ends `:2720`), `claimBetaCode` (`:2757-2769`)
- State: `betaCode`, `betaErr`, `betaClaimed`, `betaAgreed` (`:33812-33815`)
- Storage: reads `lk_betaCodes` (via `ld("betaCodes")`, `:2723`)
- Network: POST `/beta-validate` to `lockedapi.cescocugliari.workers.dev`, body `{code:"UPPERCASE"}`, response `{valid:bool, locked:bool}`
- AI: none
- Edge cases: offline → **accepted** (fail-open, `:2754`). Empty → inline error. A code not in the local seed list can never validate even if the server would accept it (`:2730`).
- Gating: always on, optional
- Status: PARTIAL
- Evidence for status: `:2754-2756` — the network catch grants access, so any locally-known code works offline; and `:2730` — the local gate makes the remote check unreachable for server-only codes.
- Notes: **SECURITY FINDING.** `DEFAULT_BETA_CODES = ["JOSHBETA","SUMMERBETA","ROMANBETA","CESCOBETA","PUBLICBETA","OLIBETA","KENDALLBETA"]` is hardcoded in client source (`:2698`). These are access credentials shipped in plaintext to every visitor — value shown here because it is already public in the served bundle; treat as [REDACTED] in any new build and move validation server-side. Also `SILENT_BETA_IDS = ["summerbeta"]` (`:2793`) silently changes sync behaviour for one code.

### F-ONB-004 Step 2 — Create your profile (name + username)
- Location: Onboarding > step 2, labelled "STEP 1 OF 3"
- User action: types display name and username, taps CONTINUE
- Behavior:
  1. Header "STEP 1 OF 3" / "Create your profile" / "How you appear in the app." (`:34342-34362`)
  2. **YOUR NAME** free text, placeholder "e.g. Alex, Jordan, Mike...", stored raw in `dispName`; border turns accent when non-empty (`:34372-34392`).
  3. **USERNAME** free text, placeholder "e.g. alex_lifts". Every keystroke is transformed `value.toLowerCase().replace(/[^a-z0-9_]/g,"")` — lowercase, digits and underscore only (`:34294-34296` region, sanitiser at `:34296`/`:34297`).
  4. CONTINUE is `disabled` unless `dispName.trim() && username.trim()` and (`!betaClaimed || betaAgreed`) (`:34319`).
  5. On click: if beta claimed but not agreed, return (double guard, `:34313`); if `betaClaimed && betaCode`, call `claimBetaCode(betaCode, username.trim())`; then `setStep(3)` (`:34312-34317`).
  6. `claimBetaCode` marks the code `usedBy`/`claimedAt` in `lk_betaCodes` and writes `lk_betaStatus=true`, `lk_betaCode`, `lk_betaId` (lowercased code) (`:2757-2769`).
- Components: inline (`:34332-34331`… step-2 block `:34332-34331`; precisely `:34332` through `:34331` is the block ending at `:34331`) — block spans `:34332-34331`. Correct span: `:34332`…`:34331` is invalid; the block is `:34332-34331`. See `:34332` (start of step 3 check) — step 2 block is `:34273-34331`.
- Functions: `claimBetaCode` (`:2757-2769`)
- State: `dispName`, `username` (`:33810-33811`); `betaClaimed`, `betaAgreed`, `betaCode`
- Storage: writes `lk_betaCodes`, `lk_betaStatus`, `lk_betaCode`, `lk_betaId` (only if a code was claimed) (`:2765-2768`)
- Network: none
- AI: none
- Edge cases: No uniqueness check on username — nothing queries the server or local storage for collisions. No length limits. A username of only illegal characters becomes empty and the button stays disabled. Not skippable — this is the only mandatory step.
- Gating: always on
- Status: WORKING
- Evidence for status: `:34319` — the disabled expression covers all required fields.
- Notes: Username uniqueness is claimed by the placeholder-style UX but never enforced; two devices can both be `alex_lifts`.

### F-ONB-005 Step 3 — Choose your units (kg / lbs)
- Location: Onboarding > step 3, labelled "STEP 2 OF 3"
- User action: taps one of two radio cards, taps CONTINUE
- Behavior:
  1. Header "STEP 2 OF 3" / "Choose your units" / "Change anytime in your profile." (`:34337-34361`)
  2. Two options rendered from a literal array: `{id:"kg", label:"Kilograms (KG)", desc:"Used in most countries"}` and `{id:"lbs", label:"Pounds (LBS)", desc:"Used in the US and UK"}` (`:34366-34375`).
  3. Each is `role="button" tabIndex=0 onKeyDown={lkKeyActivate}` — keyboard accessible (`:34379-34381`).
  4. Tapping sets `unitChoice`; the selected card gets an accent border and a filled radio dot (`:34383`, `:34400-34418`).
  5. Default is `"kg"` (`:33812` — `useState("kg")`).
  6. CONTINUE always enabled → `setStep(4)` (`:34427`).
- Components: inline (`:34332-34440`)
- Functions: `lkKeyActivate` (shared helper, referenced `:34380`)
- State: `unitChoice` (`:33812`)
- Storage: none yet — persisted only at `finish()` as `profile.useKg` (`:57351`)
- Network: none
- AI: none
- Edge cases: cannot be invalid; always has a default; not skippable but zero-cost.
- Gating: always on
- Status: WORKING
- Evidence for status: `:34427` — unconditional advance with a defaulted value.

### F-ONB-006 Step 4 — AI coach chat interview (auto-kickoff)
- Location: Onboarding > step 4, header "LOCKED AI COACH" / "Building your personalized program" / "STEP 3 OF 3"
- User action: none to start — it fires automatically
- Behavior:
  1. An effect on `[step]` fires when `step === 4 && msgs.length === 0 && !aiLoading`, and calls `kickoffChat()` after a `setTimeout(..., 100)` (`:33828-33833`).
  2. `kickoffChat` sets `aiLoading=true` and calls `callWorker(getChatSys(), [{role:"user",content:"hi"}], …)` (`:33886-33889`).
  3. On success it seeds `histRef.current = [user "hi", assistant txt]` and renders the reply (`:33890-33903`).
  4. On failure it substitutes a hardcoded fallback: `"Hey " + dispName + "! How long have you been training and what is your main goal?"` and seeds history with it as if the model had said it (`:33904-33916`).
  5. While `msgs` is empty and not loading, the pane shows the empty state "Starting your coaching session..." (`:34506-34517`).
  6. While loading, a three-dot bubble animates with `animation: "pulse 1.4s "+i*0.2+"s infinite"` (`:34640-34665`).
  7. A `useEffect` on `[msgs]` pins the scroll container to the bottom (`:33825-33827`).
- Components: inline (`:34441-34766`)
- Functions: `kickoffChat` (`:33885-33917`), `getChatSys` (`:33835-33843`), `callWorker` (`:33856-33880`)
- State: `msgs`, `aiLoading`, `scrollRef`, `histRef` (`:33817-33823`)
- Storage: none — **nothing in the chat is persisted** until `finish()`
- Network: see F-ONB-008
- AI: system prompt from `getChatSys()` (`:33835-33843`). Model is decided server-side by the Worker; the client only sends `system`, `max_tokens: 800`, `messages` (`:33858-33868`). Prompt text is documented under F-ONB-009.
- Edge cases: offline/error → silent hardcoded fallback question, indistinguishable from a real reply. The 100ms `setTimeout` is not cleaned up; if the component unmounts inside that window `kickoffChat` still runs and calls `setState` on an unmounted tree (`:33830-33832`).
- Gating: always on
- Status: WORKING (with the caveat above)
- Evidence for status: `:33828-33833` — the effect is unconditional on reaching step 4 and both branches render.

### F-ONB-007 Step 4 — Answering questions (3-question loop, counter, send)
- Location: Onboarding > step 4 > composer bar
- User action: types into "Type your answer...", presses Enter or taps the send button
- Behavior:
  1. Input is a controlled field; `onKeyDown` sends on `Enter` (`:34704-34708`).
  2. Send button is `aria-label="Send answer"`, disabled while `!input.trim() || aiLoading` (`:34722-34724`).
  3. `send()` returns early if empty or loading (`:33918-33919`).
  4. It clears the input, appends the user bubble, pushes `{role:"user",content:msg}` to `histRef`, increments `answerCountRef`, sets loading (`:33920-33934`).
  5. **If `answerCountRef.current >= 3`** it stops conversing and calls `callWorker(getGenSys(), [{role:"user",content:"Generate my program now."}])` — the generation call (F-ONB-010) — and returns (`:33935-33976`).
  6. Otherwise it calls `callWorker(getChatSys(), histRef.current, …)`, pushes the assistant reply to history, and — importantly — **also checks each conversational reply for an embedded program** via `tryParseProg`; if the model volunteers a program early, it is accepted and `done=true` (`:33977-34005`).
  7. Under the composer: `"Question " + Math.min(userMsgCount + 1, 3) + " of 3"` (`:34742-34745`).
  8. Error path in both branches appends the literal assistant bubble "Connection issue. Try again." and clears loading (`:33970-33975`, `:34006-34011`).
- Components: inline composer (`:34686-34760`)
- Functions: `send` (`:33918-34011`), `tryParseProg` (`:33881-33884`), `getGenSys` (`:33844-33855`), `callWorker` (`:33856-33880`)
- State: `input`, `msgs`, `aiLoading`, `histRef`, `answerCountRef`, `prog`, `done`
- Storage: none
- Network: F-ONB-008
- AI: F-ONB-009 / F-ONB-010
- Edge cases: The question counter caps at 3 but `answerCountRef` is what actually triggers generation, and it is a ref so it survives re-render correctly. There is no retry button — after "Connection issue. Try again." the user must type something again, which increments `answerCountRef` a further time.
- Gating: always on
- Status: WORKING
- Evidence for status: `:33935` — the `>= 3` branch is reachable and complete.
- Notes: There is no limit on message length and no sanitisation of user text before it goes into the prompt (prompt-injection surface, `:33928`).

### F-ONB-008 Worker AI endpoint (`callWorker`) — the fetch at ~33857
- Location: Onboarding internals (used by every AI call in the flow)
- User action: indirect
- Behavior:
  1. `fetch("https://lockedapi.cescocugliari.workers.dev/", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({system: sys, max_tokens: 800, messages: messages})})` (`:33857-33868`).
  2. `.then(r => r.json())` — **no `r.ok` check**, so a 4xx/5xx JSON body is parsed as if it were a success (`:33869-33871`).
  3. Response shaping tries three shapes in order (`:33872-33876`):
     - Anthropic shape: `d.content[0].text`
     - OpenAI shape: `d.choices[0].message.content` (note: `.content` on the message object)
     - Error shape: `d.error.message` → `txt = "API error: " + message`
  4. If `txt.trim()` is truthy it calls `onDone(txt)`, else `onErr()` (`:33877`).
  5. `.catch(onErr)` for network/parse failure (`:33878-33880`).
- Components: n/a
- Functions: `callWorker` (`:33856-33880`)
- State: none of its own
- Storage: none
- Network: **POST `https://lockedapi.cescocugliari.workers.dev/`** (root path). Request `{system: string, max_tokens: 800, messages: [{role, content}]}`. No auth header, no API key from the client — the key lives in the Worker. Response handled as above.
- AI: yes — the Worker proxies to a model; the model id is not visible client-side.
- Edge cases: **An API error body is treated as a successful assistant message**: `d.error.message` produces a non-empty `txt`, so `onDone` runs and the string `"API error: …"` is rendered to the user as a coach reply, and worse, on the generation path it is `tryParseProg`'d, fails, and shows "Could not generate program." (`:33874-33877`, `:33953`). Non-JSON responses fall to `onErr`.
- Gating: always on
- Status: PARTIAL
- Evidence for status: `:33869` — missing `r.ok` check means HTTP errors surface as chat text rather than as the error path.
- Notes: Hardcoded absolute Worker origin with no env indirection (`:33857`); the same host appears at `:2735`, `:2793`, `:1305`, and `:78`. No timeout and no AbortController — a hanging request leaves `aiLoading` true forever with no escape except the Skip button.

### F-ONB-009 Chat system prompt (`getChatSys`)
- Location: Onboarding internals
- User action: none
- Behavior: builds a single string from six fragments (`:33835-33843`):
  - `"You are LOCKED AI, a strength coach onboarding " + dispName + "."`
  - `" Ask short questions one at a time to learn: training experience, main goal, days per week available."`
  - `" Keep replies to 1-2 sentences. After 3 answers you MUST generate their program."`
  - `" To generate: output ###PROGRAM_START### then a JSON object then ###PROGRAM_END### then one sentence."`
  - `" JSON shape: {name:string, splits:[{name:string, days:[{name:string, exIds:[numbers]}]}]}."`
  - An exercise-ID whitelist: Chest `107,101,108,110,112`; Back `201,202,206,207,208`; Shoulders `301,302,306,307,311`; Triceps `403,406,407,408`; Biceps `503,502,506,505`; Quads `701,702,703,704`; Hams `801,802,803`; Abs `1001,1008`.
- State: reads `dispName`
- AI: this is the prompt itself. **The three topics the coach is told to elicit are the de-facto onboarding questions: training experience, main goal, days per week available** (`:33837`).
- Edge cases: `dispName` is interpolated unescaped into the system prompt (`:33836`) — a crafted display name is a prompt-injection vector.
- Gating: always on
- Status: WORKING
- Evidence for status: `:33835-33843` — string is returned and passed to `callWorker` at `:33887`.
- Notes: The ID whitelist is duplicated verbatim in `getGenSys` (`:33851` vs `:33841`) — two copies to keep in sync. The IDs are hardcoded magic numbers with no reference to the exercise DB.

### F-ONB-010 Program generation + parsing (`getGenSys`, `tryParseProg`)
- Location: Onboarding internals, triggered on the 3rd answer
- User action: sending the 3rd answer
- Behavior:
  1. `getGenSys()` concatenates all prior user turns except the literal `"hi"` seed, joined by `". "`, into `"Build a training split. User info: " + answers + "."` (`:33844-33850`).
  2. Adds `" Output ONLY: ###PROGRAM_START### then JSON then ###PROGRAM_END### then one line."`, the same JSON shape line, `" Match days to their schedule."` and the same exercise-ID whitelist (`:33851-33855`).
  3. Sent as a single user message `"Generate my program now."` (`:33937`).
  4. `tryParseProg(txt)` finds `###PROGRAM_START###` and `###PROGRAM_END###`, slices `si+19 .. ei`, `JSON.parse`s it, returns `null` on any throw or on missing/ordered-wrong markers (`:33881-33884`).
  5. `displayTxt = txt.slice(txt.indexOf("###PROGRAM_END###") + 17).trim()` — the one-sentence tail after the JSON (`:33940`).
  6. On success: `setProg(parsed)`, append an assistant bubble carrying `prog`, `setDone(true)` (`:33941-33952`).
  7. On parse failure: append "Could not generate program. Please try again." — but `done` stays false, so the composer remains and the user can send more (each further send re-enters the `>= 3` generation branch) (`:33953-33961`).
- Functions: `getGenSys` (`:33844-33855`), `tryParseProg` (`:33881-33884`)
- State: `prog`, `done`, `msgs`
- Storage: none until finish
- Network: same endpoint as F-ONB-008
- AI: prompt at `:33844-33855`; output is a `{name, splits:[{name, days:[{name, exIds:[]}]}]}` JSON blob
- Edge cases: Magic offsets 19 and 17 are the marker lengths — correct, but brittle if the markers change (`:33883`, `:33940`). No validation that returned `exIds` exist in the exercise DB. No schema validation beyond `JSON.parse`.
- Gating: always on
- Status: WORKING
- Evidence for status: `:33941-33952` — parse-success path sets `done` and renders the program card.

### F-ONB-011 Program preview card (in-chat)
- Location: Onboarding > step 4 > assistant bubble carrying `m.prog`
- User action: none — read-only
- Behavior: renders `m.prog.name` as an accent-coloured label, then one row per split: index (`si+1`), split name, and `s.days[0].exIds.length + " ex"` (`:34590-34638`).
- State: derived from `msgs[i].prog`
- Edge cases: **The exercise count only ever reads `days[0]`**, so a 5-day split shows the exercise count of day 1 as if it were the whole split (`:34633`). If `days` is missing it renders `0 ex`.
- Gating: always on
- Status: PARTIAL
- Evidence for status: `:34633` — `s.days && s.days[0] ? s.days[0].exIds.length : 0` misrepresents multi-day splits.

### F-ONB-012 Finish — SAVE MY PROGRAM
- Location: Onboarding > step 4 > fixed bottom bar, visible only when `done`
- User action: taps "SAVE MY PROGRAM"
- Behavior:
  1. `finish(true)` → `p.onComplete({displayName: dispName.trim(), username: username.trim(), useKg: unitChoice === "kg"}, prog)` (`:33986`… precisely `finish` at `:34011-34017`).
  2. `completeOnboarding(data, prog)` builds `pr = {displayName, username, useKg, createdAt: new Date().toLocaleDateString()}`, writes `sd("profile", pr)` → `lk_profile`, sets `profileRaw` and `useKgRaw` (`:57346-57353`).
  3. If `prog && prog.splits`: it checks whether any split has `days`.
     - **Nested shape** (`hasDays`): each split becomes `{id:"s"+Date.now()+i*997, name, days: d.map(d => ({name, exIds: d.exIds || d.exercises || []})), created}` (`:57360-57373`).
     - Then a consolidation heuristic: if every split has exactly one day AND there are ≥2 splits, they are merged into a single split named `prog.name || "My Program"` whose `days` are the former splits (`:57374-57391`).
     - **Flat shape** (no `days`): one split `{id:"s"+Date.now(), name: prog.name||"My Program", days: prog.splits.map(s => ({name: s.name, exIds: s.exIds || s.exercises || []}))}` (`:57392-57403`).
  4. `setSplits(newSplits)` then `setScreen("home")` (`:57404-57406`).
- Components: bottom bar (`:34666-34685`)
- Functions: `finish` (`:34011-34017`), `completeOnboarding` (`:57345-57407`)
- State: writes App-level `profile`, `useKg`, `splits`, `screen`
- Storage: writes `lk_profile` (`:57352`); `lk_splits` via `setSplits` (App state setter that persists)
- Network: none
- AI: none
- Edge cases: `id: "s"+Date.now()+i*997` is string concatenation, not addition — `Date.now()` is stringified then `i*997` is appended, so ids are like `"1700000000000997"`; still unique per index but not the intended arithmetic (`:57363`). Accepts both `exIds` and `exercises` key names defensively (`:57368`, `:57398`).
- Gating: always on (only when `done`)
- Status: WORKING
- Evidence for status: `:57404-57406` — splits are set and the app navigates home.

### F-ONB-013 Skip — "Skip - set up manually"
- Location: Onboarding > step 4 > two places
- User action: taps "Skip - set up manually"
- Behavior:
  1. Available **before** any answer, at the bottom of the composer bar (`:34746-34759`), and **after** generation, under SAVE MY PROGRAM (`:34670-34684`).
  2. Both call `finish(false)` → `onComplete(profileData, null)` (`:34011-34017`).
  3. `completeOnboarding` writes the profile and, with `prog` null, skips the splits branch entirely and goes straight to `setScreen("home")` (`:57354`, `:57406`).
- Functions: `finish` (`:34011-34017`)
- Storage: writes `lk_profile` only
- Edge cases: The user lands on Home with zero splits — the empty state of the Home/Train screens must handle it.
- Gating: always on
- Status: WORKING
- Evidence for status: `:34753` and `:34672` — both onClicks call `finish(false)`.
- Notes: Steps 1–3 are NOT skippable; only the AI interview is. There is no back button on any step — `setStep` is only ever called forward (`:34277`, `:34317`, `:34427`).

## Nutrition helpers inside the range

### F-ONB-014 FOODS database
- Location: module scope, used by the Fuel/nutrition screens
- Behavior: a literal array of ~110 food objects, each `{n: name, cal, pro, carb, fat, unit, g}` where `cal/pro/carb/fat` are **per 100 g** and `g` is the grams in one `unit` (`:34768-35656`). Examples: `{n:"Chicken Breast", cal:165, pro:31, carb:0, fat:3.6, unit:"oz", g:28}` (`:34768-34775`); last entry `{n:"Granola Bar", cal:411, pro:8.5, carb:64, fat:14, unit:"bar", g:47}` (`:35648-35655`).
- Storage / Network / AI: none
- Status: WORKING — `:35657` consumes it directly.
- Notes: Entirely hardcoded; no barcode/API source. `unit` values mix `oz`, `cup`, `strip`, `bar`.

### F-ONB-015 `estimateMacros` — natural-language food parser
- Location: nutrition logging
- User action: types e.g. "6 oz chicken 1 cup rice"
- Behavior:
  1. Lowercases and splits on `/[\s,]+/` (`:35658`).
  2. Walks the token list. If `words[i]` parses as a float it treats it as a quantity, takes `words[i+1]` as the unit word and `words[i+2] || words[i+1]` as the food word (`:35667-35670`).
  3. Matches by substring either direction against `FOODS[fi].n.toLowerCase()` or its first word (`:35671-35678`).
  4. On match: `grams = qty * match.g`, `factor = grams/100`, each macro `Math.round(macro*factor)`, pushed to `found` with name `qty + " " + match.n`, then `i += 3` (`:35679-35695`).
  5. If the token is not a number and is longer than 2 chars, it looks for a bare food-name match and adds **one unit** (`factor = match.g/100`) (`:35697-35719`).
  6. Returns `{items: found, totals}` (`:35723-35726`).
- Edge cases: `i += 3` assumes "qty unit food"; "2 eggs" (qty + food, no unit) consumes a following token wrongly. First-substring-match wins, so "chicken" hits "Chicken Breast" not "Chicken Thigh". No fuzzy matching, no plurals handling. `var match`/`var fn` are redeclared in both branches (`:35671`, `:35703`) — legal via hoisting but shadow-prone.
- Status: PARTIAL
- Evidence for status: `:35688` — the fixed `i += 3` stride mis-parses any input that is not exactly qty/unit/food.

### F-ONB-016 `calcTDEE`
- Behavior: returns `2200` if profile or `weightKg`/`heightCm`/`age` missing (`:35729`). Mifflin/Harris-Benedict-style BMR: female `447.593 + 9.247*kg + 3.098*cm - 4.330*age`; else `88.362 + 13.397*kg + 4.799*cm - 5.677*age` (`:35734-35738`) — these are the **revised Harris-Benedict** coefficients. Activity multipliers `{sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9}`, default `1.55` (`:35739-35746`). Goal adjust: `cut` ×0.8, `bulk` ×1.1 (`:35748-35749`).
- Status: WORKING — `:35750` returns the value.
- Notes: `2200` is a hardcoded fallback with no user signal that the number is a guess.

### F-ONB-017 `calcMacros`
- Behavior: `kg = parseFloat(weightKg) || 80`; protein `kg × (cut 2.4 | bulk 2.0 | else 2.2)` g; fat `tdee*0.25/9` g; carbs `(tdee - pro*4 - fat*9)/4`, floored at 50 (`:35752-35762`).
- Status: WORKING — `:35757-35761`.
- Notes: hardcoded 80 kg default and a 50 g carb floor that silently breaks the calorie identity on aggressive cuts.

## System-level features

### F-SYS-001 Service worker registration
- Location: `<head>` inline boot script
- Behavior: `if("serviceWorker" in navigator){ window.addEventListener("load", function(){ navigator.serviceWorker.register("/sw.js").catch(function(){}); }); }` (`:70-74`).
- Storage / Network: registers `/sw.js` (a separate file, not in this document)
- Edge cases: failure is swallowed by an empty catch (`:72`).
- Gating: always on
- Status: WORKING (registration code); the `/sw.js` file itself is outside this repo file — UNVERIFIED that it exists at deploy time.
- Evidence for status: `:70-74` — unconditional registration on load.

### F-SYS-002 PWA manifest and iOS install metadata
- Behavior: `<link rel="manifest" href="/manifest.json"/>` (`:13`); `apple-mobile-web-app-capable=yes` (`:6`), `apple-mobile-web-app-status-bar-style=black-translucent` (`:7`), `apple-mobile-web-app-title=LOCKED` (`:8`), `theme-color=#080809` rewritten at runtime by the theme script (`:12`), viewport `user-scalable=no, viewport-fit=cover` (`:5`).
- Status: WORKING (declarations present); `/manifest.json` content UNVERIFIED — not in this file.
- Evidence for status: `:13` — the link tag is present and unconditional.

### F-SYS-003 Install prompt (`beforeinstallprompt`)
- Behavior: **NONE.** `grep -c beforeinstallprompt` over the whole file returns `0`. There is no custom Android/Chrome install prompt, no deferred prompt, no "Add to Home Screen" button.
- Related: the app *detects* standalone mode (`isStandalone()` at `:1407-1410`) and, on iOS, tells the user to install manually rather than offering a prompt: "On iPhone, add LOCKED to your Home Screen first — Share → Add to Home Screen" (`:1581-1583`).
- Status: DEAD / NOT IMPLEMENTED
- Evidence for status: whole-file grep count 0 for `beforeinstallprompt`.

### F-SYS-004 Deploy-version check and cache bust
- Location: `<head>` boot script
- Behavior:
  1. On every load, `fetch("https://lockedapi.cescocugliari.workers.dev/app-version", {cache:"no-store"})` (`:78-83`).
  2. If `data.version` differs from `localStorage.lk_deployVersion`, it drops caches and hard-reloads so users get the latest build (`:84-90`).
- Storage: reads/writes `lk_deployVersion` (`:79`)
- Network: GET `/app-version`, response `{version}`
- Edge cases: `r.ok ? r.json() : null` guards non-200; null data returns early (`:83-85`).
- Gating: always on
- Status: WORKING
- Evidence for status: `:78-90` — full fetch/compare/reload chain present.

### F-SYS-005 Zoom lock
- Behavior: `["gesturestart","gesturechange","gestureend"].forEach(evt => document.addEventListener(evt, e => e.preventDefault(), {passive:false}))` — pinch-zoom is swallowed so overlays and the number pad are never drawn against a scaled viewport (`:62-68`). Double-tap zoom is handled by `touch-action:manipulation` in CSS instead of swallowing `touchend`, deliberately, so repeated `+2.5` taps all register (`:66-67`).
- Status: WORKING — `:63-65`.

### F-SYS-006 Push notification module (`window.LOCKEDPush`)
- Location: IIFE in `<head>`, `:1278-1953`
- User action: flipping the switch in Settings → Notifications
- Behavior:
  1. Capability gate: `supported()` requires `serviceWorker` + `PushManager` + `Notification` (`:1413-1417`).
  2. `enable()` must be called from a user gesture (iOS ignores otherwise) (`:1575-1577`). It: checks support, reads `Notification.permission`, calls `Notification.requestPermission()` if `default`, throws a specific message on `denied` vs not-granted (`:1586-1592`).
  3. `await navigator.serviceWorker.ready`, GET `API + "/push/key"` → `{publicKey}`, throws if absent (`:1594-1600`).
  4. Compares any existing subscription's `applicationServerKey` byte-for-byte against the fetched key; on mismatch it unsubscribes and re-subscribes with `{userVisibleOnly:true, applicationServerKey}` (`:1603-1623`).
  5. POST `/push/subscribe` with `{deviceId, subscription: sub.toJSON(), tz, prefs, ctx: buildContext()}` (`:1625-1631`). On non-ok it throws the server's `error`.
  6. Writes `lk_pushEnabled = true` (`:1636`). `_enabling` de-dupes concurrent calls (`:1573`, `:1579`).
- Storage: `lk_pushDeviceId` (`:1307`), `lk_pushPrefs` (`:1308`), `lk_pushEnabled` (`:1309`)
- Network: `POST /push/subscribe`, `/push/unsubscribe`, `/push/prefs`, `/push/test`, `/push/rest`, `/push/rest/cancel`, `/push/idle`, `/push/idle/cancel`, `GET /push/key` — all on `https://lockedapi.cescocugliari.workers.dev` (`:1304-1306`)
- Gating: always on where supported; iOS non-standalone shows `needsInstall` instead of a switch (`:1767`)
- Status: WORKING
- Evidence for status: `:1636` — the enable path completes and persists.
- Notes: The device id is deliberately excluded from cloud sync — "Notifications are a property of this phone, not of the account" (`:1340-1341`).

### F-SYS-007 Notification preferences and scheduling
- Behavior:
  1. `DEFAULT_PREFS = {rest:true, training:true, trainingTime:"07:30", checkin:true, checkinTime:"08:00", idle:true, supps:true, compounds:true, restock:true}` (`:1311-1321`).
  2. `setPrefs(partial)` merges, writes `lk_pushPrefs`, and if enabled POSTs `/push/prefs` with `{deviceId, tz, prefs, ctx}`. A `404` means the Worker lost the record → `enable()` re-registers (`:1662-1678`).
  3. `refresh(force)` re-POSTs the context snapshot, throttled to once per 60s (`:1680-1699`), and fires on every `visibilitychange` → visible (`:1791-1793`).
  4. `buildContext()` reads `lk_profile`, `lk_splits`, `lk_history`, `lk_feedback` and mirrors the Home feed's "what's next" logic so the reminder and the app agree on which day is up (`:1418-1430`).
  5. **Rest-timer alert**: `scheduleRest(seconds, exerciseName)` POSTs `/push/rest` with `{deviceId, seconds, exercise}`, gated on `prefs.rest`; `cancelRest()` cancels (`:1723-1737`).
  6. **Idle-workout check**: `scheduleIdleCheck(seconds, workoutName, force)` POSTs `/push/idle` — "half an hour after the last thing you logged, ask whether the session is still going", throttled to once/60s unless forced (`:1739-1757`); `cancelIdleCheck()` clears (`:1758-1762`).
  7. `postHealing(path, body)` retries once through `enable()` on a 404, so a lost rest alert self-heals (`:1712-1722`).
  8. `test()` POSTs `/push/test` and surfaces the server error verbatim (`:1702-1709`).
- Storage: `lk_pushPrefs`, `lk_pushEnabled`; reads `lk_profile`, `lk_splits`, `lk_history`, `lk_feedback`
- Status: WORKING
- Evidence for status: `:1726`, `:1750` — both schedulers POST and return the ok flag.
- Notes: **All scheduling is server-side.** There is no client-side `setTimeout`-based notification. A hard limitation is documented in-source: web push cannot carry a custom sound (`:1799-1800`).

### F-SYS-008 Notifications settings UI (`NotificationsCard`)
- Location: Settings/Profile screen
- Behavior: `NotificationsCard` (`:31756`+) reads `P.status()` defaulting to `{supported:false, needsInstall:false, permission:"unsupported", enabled:false, prefs:{}}` when the module is absent (`:31758-31760`). Toggling off calls `P.disable()` and shows "Notifications turned off." (`:31776`). When `permission === "denied" && !enabled` it replaces the switch with "Notifications are blocked for this site in your browser or phone settings. Allow them there, then flip this on." (`:31856-31859`). Mounted in the settings tree at `:32956`.
- Status: WORKING
- Evidence for status: `:31856-31859` — the denied branch renders explanatory copy instead of a dead switch.

### F-SYS-009 Service worker → app messaging and push deep links
- Behavior:
  1. `navigator.serviceWorker.addEventListener("message", …)` filters on `msg.source === "locked-push"` (`:1776-1782`).
  2. `msg.type === "resubscribe"` → the browser rotated the subscription, quietly `enable()` again (`:1780-1784`).
  3. Any other message → `window.dispatchEvent(new CustomEvent("lockedPushOpen", {detail: msg}))` so React can route (`:1786`).
  4. Cold start from a notification carries `?open=…` in the URL; the app routes on it (`:49945`, `:57482`). Example: `?open=checkin` (`:49945`).
- Status: WORKING
- Evidence for status: `:1786` — the custom event is dispatched, and two `addEventListener("lockedPushOpen")` consumers exist.

### F-SYS-010 Boot self-heal for push subscriptions
- Behavior: on `navigator.serviceWorker.ready`, if `lk_pushEnabled` is true but `pushManager.getSubscription()` returns nothing, silently `enable()`; otherwise `refresh(true)` (`:1944-1951`). The in-source rationale: unregistering the SW on every deploy used to kill subscriptions while the UI still said notifications were on (`:1937-1943`).
- Status: WORKING
- Evidence for status: `:1946-1950` — both branches present and awaited.

### F-SYS-011 `ErrorBoundary` — whole-app crash screen
- Location: wraps `<App/>` at the React root
- Behavior:
  1. `class ErrorBoundary extends React.Component` with `state {hasError:false, error:null}` (`:2540-2547`).
  2. `getDerivedStateFromError(error)` → `{hasError:true, error}` (`:2548-2553`).
  3. **`componentDidCatch(error, errorInfo) {}` — an empty body. Nothing is logged, reported, or sent anywhere** (`:2554`).
  4. Fallback UI: full-screen `#080809`, red text, `<h2>Error Loading App</h2>`, `error.message` or "Something went wrong", "Check browser console (F12) for details", and a "Refresh Page" button calling `window.location.reload()` (`:2555-2596`).
  5. Mounted: `ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ErrorBoundary, null, React.createElement(App, null)))` (`:58002`).
- Status: PARTIAL
- Evidence for status: `:2554` — `componentDidCatch` is empty, so every production crash is invisible to the developer; and the copy tells a phone user to press F12.
- Notes: "Check browser console (F12)" is wrong guidance for a mobile-first PWA (`:2583`). No error reporting/telemetry hook anywhere.

### F-SYS-012 `ScreenBoundary` — per-screen crash containment
- Behavior:
  1. `class ScreenBoundary` with `state {hasError:false, msg:""}` (`:2601-2608`); `getDerivedStateFromError(e)` stores `e.message || "Unexpected error"` (`:2609-2614`). **No `componentDidCatch` at all** — nothing is logged.
  2. Fallback: inline red panel "Something went wrong on this screen", the message, and a "Reload" button that calls `window.location.reload()` (`:2615-2653`).
  3. Usage: every routed screen is wrapped, keyed by screen name — `React.createElement(ScreenBoundary, {key: screen}, content)` (`:57734-57737`). The `key` means switching tabs remounts the boundary, which resets `hasError` — so navigating away and back is an implicit recovery path.
- Status: PARTIAL
- Evidence for status: `:2601-2653` — no logging hook, and the only offered action is a full page reload rather than a retry of the screen.
- Notes: `ErrorBoundary` (app-level) and `ScreenBoundary` (screen-level) are near-duplicate logic with different copy — a single parameterised boundary would do.

### F-SYS-013 Loading and empty-state patterns
- Behavior (as observed in the onboarding range, representative of the app):
  - **Loading**: an animated three-dot bubble driven by CSS `animation: "pulse 1.4s <i*0.2>s infinite"` staggered across `[0,1,2]` (`:34640-34665`). No skeletons, no spinners in this flow.
  - **Empty**: a centred muted paragraph — "Starting your coaching session..." (`:34506-34517`).
  - **Error**: an inline assistant bubble with fixed copy ("Connection issue. Try again.", `:33973`, `:34009`) rather than a banner or a retry control.
  - **Disabled-affordance**: buttons stay mounted but switch `background` to `SU`, `color` to `MU`, and `cursor` to `default` (`:34322-34328`, `:34727-34731`).
- Status: WORKING (as a pattern), but there is **no retry affordance anywhere in onboarding** — every error path requires the user to re-type.
- Evidence for status: `:33973` — the error branch appends text and nothing else.

### F-SYS-014 Event listeners at a system level (54 `addEventListener` calls)
Whole-file `grep -c addEventListener` = **54** (not 106; the brief's figure does not match this build). Breakdown by event type from `grep -o`:

| Event | Count | What it does at system level |
|---|---|---|
| `visibilitychange` | 5 | Foreground refresh — push context refresh (`:1791`), timer resync, sync triggers |
| `touchmove` | 5 | Scroll/gesture suppression and swipe tracking in sheets and sliders |
| `resize` | 5 | Viewport/keyboard-height recalculation; bottom-bar and safe-area measurement |
| `keydown` | 4 | Keyboard activation of `role="button"` divs (`lkKeyActivate`, e.g. `:34380`) and modal escape |
| `touchend` / `touchcancel` | 3 / 3 | End-of-gesture cleanup for drag/swipe interactions |
| `scroll` | 2 | Sticky-header and scroll-position logic |
| `click` | 2 | Outside-click dismissal |
| `lockedVoiceToggle` | 2 | Custom event bus — voice input toggle |
| `lockedPushOpen` | 2 | Custom event bus — routing a tapped notification (`:1786`) |
| `pointermove`/`pointerup`/`pointercancel`, `mousemove`/`mouseup` | 1 each (5) | Desktop+pointer drag implementations (sliders, reorder) |
| `message` | 1 | Service-worker → page channel (`:1777`) |
| `storage` | 1 | Cross-tab localStorage sync |
| `popstate` | 1 | Back-button navigation against the pushed `{lkDepth}` history stack (`:57552`) |
| `load` | 1 | Service-worker registration (`:71`) |
| `DOMContentLoaded` | 1 | Boot |
| `theme-changed` | 1 | Theme repaint |
| `focusout` | 1 | Input blur handling |
| `lockedTabReset`, `lockedStorageFull`, `lockedRest`, `lockedHistoryUpdate`, `lockedFuelUpdate`, `lockedCoachPane`, `lockedBottomBar` | 1 each (7) | An ad-hoc **`window` CustomEvent bus** used as a cross-component message channel in place of context/state management |
| `gesturestart`/`gesturechange`/`gestureend` | (registered via a `forEach`, not counted individually) | Pinch-zoom lock (`:63-65`) |

The single most notable system-level pattern: **9 distinct `locked*` custom DOM events** are used as a global event bus, bypassing React state entirely. Any redesign must inventory and replace these.

### F-SYS-015 Timers at a system level
Whole-file counts: `setTimeout` **52**, `setInterval` **13** (total 65, not 81 — the brief's figure does not match this build). Categories observed:
- **Deferred kickoff**: `setTimeout(kickoffChat, 100)` in onboarding (`:33830-33832`) — a 100ms hack to let the step-4 render settle. Not cleaned up on unmount.
- **Throttles implemented with timestamps rather than timers**: `_lastRefresh` 60s (`:1691`), `_lastIdleSchedule` 60s (`:1748`) — these avoid timers deliberately.
- **`setInterval`** is used for the live workout/rest clocks and periodic sync ticks.
- **Transient UI**: toast/confirmation auto-dismiss ("Notifications turned off." style notes, e.g. `:31776`).
- Risk: several `setTimeout`s in the onboarding path have no `clearTimeout` in an effect cleanup (`:33828-33833`), the classic React unmounted-setState leak.

### F-SYS-016 Beta data collection and sync (touched by onboarding)
- Behavior: once `lk_betaStatus` is true (set by `claimBetaCode`, `:2766`), `logBetaActivity(action, data)` appends `{ts, action, data, betaId}` to `lk_betaLog` (`:2770-2780`) and `logBetaAI(input, output)` appends `{ts, input, output, betaId}` to `lk_betaAILog` (`:2781-2791`). Both no-op if `lk_betaStatus` is false. Data is uploaded to `SYNC_URL = "https://lockedapi.cescocugliari.workers.dev/beta-sync"` (`:2792`) by `syncBetaData` (`:2796`+). `SILENT_BETA_IDS = ["summerbeta"]` makes `isSilentBeta()` true for that one code (`:2793-2795`).
- Consent: obtained by the Beta Tester Agreement at F-ONB-003 (`:34133-34176`).
- Status: WORKING
- Evidence for status: `:2766` — the gate flag is written at claim time, enabling both loggers.
- Notes: `isSilentBeta()` altering behaviour for a specific named tester is a hardcoded per-user branch (`:2793`).

---

# PART B — Function index

Every function, component, hook, and inline handler in range 33808–35762, plus the system-level items I audited outside it.

| Name | Kind | file:lines | Purpose (1 line) | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| `Onboarding` | component | `:33808-34767` | The entire 4-step first-run flow | `App` gate `:57556` | all below | F-ONB-001..013 |
| scroll-pin effect | hook (`useEffect` on `[msgs]`) | `:33825-33827` | Pins the chat scroller to the bottom on new messages | React | — | F-ONB-006 |
| kickoff effect | hook (`useEffect` on `[step]`) | `:33828-33833` | Auto-starts the AI interview 100ms after reaching step 4 | React | `setTimeout`, `kickoffChat` | F-ONB-006 |
| `getChatSys` | function | `:33835-33843` | Builds the conversational coach system prompt | `kickoffChat`, `send` | — | F-ONB-009 |
| `getGenSys` | function | `:33844-33855` | Builds the program-generation system prompt from prior answers | `send` | — | F-ONB-010 |
| `callWorker` | function | `:33856-33880` | POSTs `{system,max_tokens,messages}` to the Worker and normalises the reply | `kickoffChat`, `send` | `fetch` | F-ONB-008 |
| `tryParseProg` | function | `:33881-33884` | Extracts and `JSON.parse`s the JSON between the two markers | `send` | `JSON.parse` | F-ONB-010 |
| `kickoffChat` | function | `:33885-33917` | Sends the seed "hi" turn and renders the first coach question (or a fallback) | kickoff effect | `callWorker`, `getChatSys` | F-ONB-006 |
| `send` | function | `:33918-34011` | Submits an answer; after 3 answers switches to program generation | send button, Enter key | `callWorker`, `getChatSys`, `getGenSys`, `tryParseProg` | F-ONB-007, F-ONB-010 |
| `finish` | function | `:34011-34017` | Hands `{displayName, username, useKg}` and optional program to the parent | SAVE / both Skip buttons | `p.onComplete` | F-ONB-012, F-ONB-013 |
| beta-code `onChange` handler | handler | `:34090-34093` | Uppercases the code and clears the error | invite input | `setBetaCode`, `setBetaErr` | F-ONB-003 |
| Verify `onClick` handler | handler | `:34106-34120` | Validates the invite code locally then remotely | Verify button | `validateBetaCodeRemote` | F-ONB-003 |
| "I Agree" `onClick` handler | handler | `:34177-34179` | Records agreement to the beta terms | agreement panel | `setBetaAgreed` | F-ONB-003 |
| GET STARTED `onClick` handler | handler | `:34276-34278` | Advances to step 2 unconditionally | step-1 CTA | `setStep` | F-ONB-002 |
| `dispName` `onChange` handler | handler | `:34374-34376` | Stores the display name verbatim | name input | `setDispName` | F-ONB-004 |
| `username` `onChange` handler | handler | `:34296-34298` | Lowercases and strips to `[a-z0-9_]` | username input | `setUsername` | F-ONB-004 |
| step-2 CONTINUE `onClick` handler | handler | `:34311-34318` | Claims the beta code if present and advances to step 3 | CONTINUE | `claimBetaCode`, `setStep` | F-ONB-004 |
| unit option `onClick` handler | handler | `:34382-34384` | Selects kg or lbs | unit cards | `setUnitChoice` | F-ONB-005 |
| unit option map callback | function (inline `.map`) | `:34376-34424` | Renders one unit radio card | step-3 render | — | F-ONB-005 |
| step-3 CONTINUE `onClick` handler | handler | `:34426-34428` | Advances to the AI interview | CONTINUE | `setStep` | F-ONB-005 |
| message map callback | function (inline `.map`) | `:34518-34639` | Renders one chat bubble, with the program card when present | step-4 render | — | F-ONB-006, F-ONB-011 |
| split map callback | function (inline `.map`) | `:34610-34637` | Renders one split row inside the program card | message map | — | F-ONB-011 |
| typing-dot map callback | function (inline `.map`) | `:34655-34664` | Renders the three staggered loading dots | step-4 render | — | F-ONB-006 |
| SAVE MY PROGRAM `onClick` handler | handler | `:34671-34673` | Finishes with the generated program | done bar | `finish(true)` | F-ONB-012 |
| post-done Skip `onClick` handler | handler | `:34674-34676` | Finishes without the program | done bar | `finish(false)` | F-ONB-013 |
| input `onChange` handler | handler | `:34702-34704` | Tracks the composer text | composer | `setInput` | F-ONB-007 |
| input `onKeyDown` handler | handler | `:34705-34707` | Sends on Enter | composer | `send` | F-ONB-007 |
| send-button `onClick` | handler | `:34723` | Sends the answer | composer | `send` | F-ONB-007 |
| pre-done Skip `onClick` handler | handler | `:34747-34749` | Abandons the interview and finishes | composer footer | `finish(false)` | F-ONB-013 |
| `FOODS` | constant (array literal) | `:34768-35656` | ~110-entry per-100g nutrition database | `estimateMacros` | — | F-ONB-014 |
| `estimateMacros` | function | `:35657-35727` | Parses free-text food entries into items + macro totals | nutrition logging screens | `FOODS` lookup | F-ONB-015 |
| `calcTDEE` | function | `:35728-35751` | Harris-Benedict BMR × activity multiplier, adjusted for cut/bulk | nutrition/targets screens | — | F-ONB-016 |
| `calcMacros` | function | `:35752-35762` | Splits a TDEE into protein/fat/carb grams by goal | nutrition/targets screens | — | F-ONB-017 |

Out-of-range functions required to understand this flow (audited, cited, indexed for completeness):

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| `completeOnboarding` | function | `:57345-57407` | Persists the profile and converts the AI program into `splits` | `Onboarding.onComplete` | `sd`, `setSplits`, `setScreen` | F-ONB-012, F-ONB-013 |
| `validateBetaCodeRemote` | function | `:2729-2756` | Local-then-remote invite-code validation (fails open offline) | Onboarding `:34110`, Settings `:33420` | `validateBetaCode`, `fetch` | F-ONB-003 |
| `validateBetaCode` | function | `:2722-2728` | Checks a code against the local `lk_betaCodes` list | `validateBetaCodeRemote` | `ld` | F-ONB-003 |
| `claimBetaCode` | function | `:2757-2769` | Marks a code used and flips the beta flags | Onboarding `:34315`, Settings `:33490` | `ld`, `sd` | F-ONB-004 |
| `logBetaActivity` | function | `:2770-2780` | Appends an action record to `lk_betaLog` when beta is active | app-wide | `ld`, `sd` | F-SYS-016 |
| `logBetaAI` | function | `:2781-2791` | Appends an AI turn to `lk_betaAILog` when beta is active | AI screens | `ld`, `sd` | F-SYS-016 |
| `isSilentBeta` | function | `:2793-2795` | True for the hardcoded `summerbeta` id | sync layer | `ld` | F-SYS-016 |
| `ErrorBoundary` | component (class) | `:2540-2599` | App-wide crash screen with a Refresh button | React root `:58002` | — | F-SYS-011 |
| `ScreenBoundary` | component (class) | `:2601-2655` | Per-screen crash panel with a Reload button | screen router `:57734` | — | F-SYS-012 |
| `NotificationsCard` | component | `:31756`+ | Settings UI for the push switch and per-type prefs | Settings tree `:32956` | `LOCKEDPush.*` | F-SYS-008 |
| `enable` | async function | `:1578-1646` | Requests permission, subscribes, registers with the Worker | `NotificationsCard`, self-heal | `Notification.requestPermission`, `post` | F-SYS-006 |
| `disable` | async function | `:1648-1657` | Unsubscribes locally and on the Worker | `NotificationsCard` | `post` | F-SYS-006 |
| `isEnabled` | function | `:1659-1663` | True only if the flag is set AND permission is granted | everywhere in the module | — | F-SYS-006 |
| `setPrefs` | async function | `:1665-1678` | Persists prefs locally and on the Worker, re-registering on 404 | `NotificationsCard` | `post`, `enable` | F-SYS-007 |
| `refresh` | async function | `:1682-1699` | Re-uploads the reminder context, throttled to 60s | `visibilitychange`, boot | `post`, `buildContext` | F-SYS-007 |
| `test` | async function | `:1702-1709` | Fires a test push | `NotificationsCard` | `post` | F-SYS-007 |
| `postHealing` | async function | `:1712-1722` | POST that re-registers and retries once on a 404 | `scheduleRest`, `scheduleIdleCheck` | `post`, `enable` | F-SYS-007 |
| `scheduleRest` | function | `:1723-1731` | Asks the Worker to push a rest-timer alert in N seconds | rest timer | `postHealing` | F-SYS-007 |
| `cancelRest` | function | `:1733-1737` | Cancels a pending rest alert | rest timer | `post` | F-SYS-007 |
| `scheduleIdleCheck` | function | `:1743-1757` | Schedules the "still training?" nudge, throttled | workout logging | `postHealing` | F-SYS-007 |
| `cancelIdleCheck` | function | `:1758-1762` | Cancels the idle nudge | workout end | `post` | F-SYS-007 |
| `status` | function | `:1764-1772` | Reports support/needsInstall/permission/enabled/prefs | `NotificationsCard` | `supported`, `isEnabled`, `getPrefs` | F-SYS-008 |
| `buildContext` | function | `:1418-1430`+ | Snapshot of next split day, streak, trained/checked-in today | `enable`, `setPrefs`, `refresh` | `readRaw` | F-SYS-007 |
| `deviceId` | function | `:1342-1362` | Stable per-device UUID, excluded from cloud sync | all push posts | `crypto.randomUUID` | F-SYS-006 |
| `getPrefs` | function | `:1364-1367` | DEFAULT_PREFS merged with stored prefs | push module | `readRaw` | F-SYS-007 |
| `supported` | function | `:1413-1417` | SW + PushManager + Notification present | `status`, `enable` | — | F-SYS-006 |
| `isIOS` | function | `:1400-1404` | UA + maxTouchPoints iOS/iPadOS detection | `status`, `enable` | — | F-SYS-006 |
| `isStandalone` | function | `:1407-1410` | `navigator.standalone` or `display-mode: standalone` | `status`, `enable` | `matchMedia` | F-SYS-003, F-SYS-006 |
| `readRaw` / `writeRaw` | function | `:1323-1338` | try/catch JSON localStorage helpers scoped to the push module | push module | `localStorage` | F-SYS-006 |
| `timeZone` | function | `:1369-1375` | IANA tz with a `"UTC"` fallback | push posts | `Intl` | F-SYS-007 |
| `todayISO` / `dayOf` | function | `:1377-1396` | Local-calendar day helpers (duplicated at `:1954-1976`) | `buildContext` | — | F-SYS-007 |
| SW `message` listener | handler | `:1777-1788` | Handles `resubscribe` and re-dispatches taps as `lockedPushOpen` | service worker | `enable`, `dispatchEvent` | F-SYS-009 |
| `visibilitychange` listener | handler | `:1791-1793` | Refreshes reminder context on foreground | document | `refresh` | F-SYS-007 |
| boot self-heal | IIFE tail | `:1944-1951` | Re-subscribes if the flag is on but the subscription is gone | module load | `enable`, `refresh` | F-SYS-010 |
| `enterGuestMode` | function | `:168-178` | Seeds a fake profile so guests skip onboarding, then reloads | guest CTA | `localStorage`, `reload` | F-ONB-001 |
| `lockZoom` | IIFE | `:62-68` | Blocks pinch-zoom gestures document-wide | boot | `preventDefault` | F-SYS-005 |
| SW registration | inline script | `:70-74` | Registers `/sw.js` on window load | boot | `navigator.serviceWorker.register` | F-SYS-001 |
| `checkDeployVersion` | IIFE | `:76-90`+ | Compares deployed version and busts caches on change | boot | `fetch` | F-SYS-004 |

---

## Onboarding step flow

Four rendered screens, labelled to the user as three steps. `step` state at `:33809`.

| # | `step` | Screen name / label | Question asked | Input type | Options / validation | Storage key written | Skippable? | Branching | Lines |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | Welcome (no step label) | — (pitch only) | Button | none | none | n/a — must tap GET STARTED | Always → step 2 (`:34277`) | `:33994-34296` |
| 0a | 1 | Invite code card ("INVITE CODE (OPTIONAL)") | "Enter code if you have one" | Text, force-uppercased | Must match `lk_betaCodes` locally, then `/beta-validate`; empty → "Enter a code" | on claim: `lk_betaCodes`, `lk_betaStatus`, `lk_betaCode`, `lk_betaId` (written at step 2, `:2765-2768`) | **Yes — fully optional** | If verified → Beta Tester Agreement panel appears and step-2 CONTINUE is blocked until "I Agree" (`:34313`, `:34319`) | `:34038-34272` |
| 1 | 2 | "STEP 1 OF 3 — Create your profile" | "YOUR NAME" | Text, free | non-empty after `.trim()` | `lk_profile.displayName` (at finish, `:57347`) | **No** | — | `:34372-34392` |
| 1 | 2 | same screen | "USERNAME" | Text, sanitised to `[a-z0-9_]` lowercase | non-empty after sanitise+trim; **no uniqueness check** | `lk_profile.username` (`:57348`) | **No** | If `betaClaimed`, `claimBetaCode(code, username)` fires here (`:34315`) | `:34294-34310` |
| 2 | 3 | "STEP 2 OF 3 — Choose your units" | "Choose your units" | Radio cards (2) | `kg` = "Kilograms (KG) / Used in most countries"; `lbs` = "Pounds (LBS) / Used in the US and UK". Default `kg` | `lk_profile.useKg` (boolean, `unitChoice === "kg"`, `:34015`/`:57349`) | Effectively yes (default pre-selected) | — | `:34332-34440` |
| 3 | 4 | "STEP 3 OF 3 — LOCKED AI COACH" Q1 | AI-generated. Model is told to elicit **training experience**. Offline fallback: "Hey {name}! How long have you been training and what is your main goal?" | Free text chat | none | nothing until finish | **Yes — "Skip - set up manually"** (`:34747`) | — | `:33837`, `:33906` |
| 3 | 4 | Q2 | AI-generated; model told to elicit **main goal** | Free text chat | none | none | Yes | — | `:33837` |
| 3 | 4 | Q3 | AI-generated; model told to elicit **days per week available** | Free text chat | none | none | Yes | On the 3rd send, `answerCountRef >= 3` diverts to program generation (`:33935`) | `:33837`, `:33935` |
| 3 | 4 | Program result | — (result shown) | Two buttons | none | `lk_profile` + `lk_splits` on SAVE; `lk_profile` only on Skip | Yes (Skip) | `done` true → the composer is replaced by SAVE MY PROGRAM / Skip (`:34666`) | `:34666-34685` |

Branching summary:
- The **only** hard gate is step 2 (name + username) — `App` re-enters onboarding forever until both exist (`:57556`).
- Beta agreement is a conditional sub-gate: claimed-but-not-agreed disables step-2 CONTINUE (`:34319`).
- The AI interview can be exited at any point via Skip, which still writes the profile (`:34011-34017`, `:57354`).
- The model may emit a program **before** three answers; `send` checks every conversational reply with `tryParseProg` and jumps to `done` if it finds one (`:33982-33999`).
- **No back navigation and no resume.** `setStep` is only called with increasing values; `step` resets to 1 on remount (`:33809`).

---

## PWA / service worker

Definitive answers:

- **Service worker: YES.** Registered at `redesign/input/locked-current-v6.html:70-74` — `navigator.serviceWorker.register("/sw.js")` on `window load`, with errors swallowed. Additionally consumed at `:1594` (`serviceWorker.ready` for push), `:1777` (message channel), and `:1944-1951` (boot self-heal). The `/sw.js` file itself is **not** in this document — UNVERIFIED whether it is deployed; confirm by requesting `https://locked-seven.vercel.app/sw.js`.
- **PWA manifest: YES.** `<link rel="manifest" href="/manifest.json"/>` at `:13`. Supporting iOS meta: `apple-mobile-web-app-capable` (`:6`), `apple-mobile-web-app-status-bar-style=black-translucent` (`:7`), `apple-mobile-web-app-title=LOCKED` (`:8`), `theme-color` (`:12`), `viewport-fit=cover, user-scalable=no` (`:5`). Manifest contents are outside this file — UNVERIFIED; confirm by requesting `/manifest.json`.
- **`beforeinstallprompt` / custom install prompt: NONE FOUND.** Whole-file grep count is `0`. There is no deferred install prompt and no in-app "Install" button. The app only *detects* standalone mode (`:1407-1410`) and, for iOS push, instructs the user to install manually via Share → Add to Home Screen (`:1581-1583`).
- **Standalone detection: YES** — `window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches` (`:1407-1410`), used to decide `needsInstall` in push status (`:1767`) and referenced in the UI-scale setting copy (`:31984`).
- **Cache/version strategy: YES** — a Worker-driven deploy-version check drops caches and hard-reloads when the deployed version changes (`:76-90`).

---

## Notifications

- **Module**: a single IIFE exporting `window.LOCKEDPush` (and mirrored to `window.LOCKED.push`), `:1278-1953`. Header comment describes it as "LOCKED Push Notifications v1.0" (`:1278`).
- **Permission flow**: `enable()` (`:1578-1646`) must be invoked from a user gesture — iOS ignores non-gesture prompts (`:1575-1577`). It (1) checks `supported()` = SW + PushManager + Notification (`:1413-1417`); (2) reads `Notification.permission`, and only calls `Notification.requestPermission()` when it is `"default"` (`:1586-1587`); (3) throws distinct copy for `denied` vs otherwise-not-granted (`:1588-1592`). The permission prompt is therefore **never** shown during onboarding — it lives only in Settings → `NotificationsCard` (`:31756`, mounted `:32956`).
- **Subscription**: `serviceWorker.ready` → GET `/push/key` for the VAPID public key → byte-compare against any existing subscription's `applicationServerKey` and re-subscribe on mismatch → `pushManager.subscribe({userVisibleOnly:true, applicationServerKey})` (`:1594-1623`).
- **Registration payload**: POST `/push/subscribe` `{deviceId, subscription: sub.toJSON(), tz, prefs, ctx: buildContext()}` (`:1625-1631`). Then `lk_pushEnabled = true` (`:1636`).
- **What gets scheduled** — **all scheduling is server-side on the Cloudflare Worker; there are no client-side notification timers**:
  | Notification | Pref key | Default | Endpoint | Payload | Lines |
  |---|---|---|---|---|---|
  | Rest-timer alert | `rest` | true | POST `/push/rest` | `{deviceId, seconds, exercise}` | `:1723-1731` |
  | Training reminder | `training` / `trainingTime` | true / `"07:30"` | POST `/push/prefs` (server cron) | `{deviceId, tz, prefs, ctx}` | `:1311-1321`, `:1670-1675` |
  | Check-in reminder | `checkin` / `checkinTime` | true / `"08:00"` | POST `/push/prefs` | same | `:1311-1321` |
  | Idle-workout nudge (~30 min of silence) | `idle` | true | POST `/push/idle` | `{deviceId, seconds, workout}` | `:1739-1757` |
  | Supplements | `supps` | true | `/push/prefs` | — | `:1317` |
  | Compounds | `compounds` | true | `/push/prefs` | — | `:1318` |
  | Restock | `restock` | true | `/push/prefs` | — | `:1319` |
- **Context snapshot**: `buildContext()` reads `lk_profile`, `lk_splits`, `lk_history`, `lk_feedback` and mirrors the Home feed's next-day logic so the notification and the app agree (`:1418-1430`). Re-uploaded on every foreground `visibilitychange`, throttled to 60s (`:1682-1699`, `:1791-1793`). This is deliberate so reminders work for guest accounts with no cloud sync (`:1288-1292`).
- **Self-healing**: `postHealing` retries once through `enable()` on a `404` (`:1712-1722`); `setPrefs` and `refresh` do the same (`:1675-1677`, `:1697`); boot re-subscribes if the flag is on but the subscription is gone (`:1944-1951`); an SW `resubscribe` message triggers a silent `enable()` (`:1780-1784`).
- **Deep links**: a tapped notification on a running app dispatches `lockedPushOpen` (`:1786`); a cold start carries `?open=…` (e.g. `?open=checkin`) which the router consumes (`:49945`, `:57482`).
- **Known limitation documented in source**: web push cannot carry a custom sound, so gym alert sounds are synthesised with WebAudio in-app instead (`:1795-1801`).
- **Denied state**: the switch is replaced with "Notifications are blocked for this site in your browser or phone settings. Allow them there, then flip this on." (`:31856-31859`).
- **iOS**: `needsInstall` is true in mobile Safari and the UI says so rather than offering a switch that cannot work (`:1293-1296`, `:1767`).

---

## Error boundaries and recovery

| Boundary | Scope | On throw | Recovery offered | Logging | Lines |
|---|---|---|---|---|---|
| `ErrorBoundary` | Wraps the entire `<App/>` at the React root (`:58002`) | Full-screen dark panel: "Error Loading App", `error.message`, "Check browser console (F12) for details" | "Refresh Page" → `window.location.reload()` | **None** — `componentDidCatch` has an empty body (`:2554`) | `:2540-2599` |
| `ScreenBoundary` | Wraps each routed screen, `key={screen}` (`:57734-57737`) | Inline red panel: "Something went wrong on this screen" + `e.message` | "Reload" → `window.location.reload()` | **None** — no `componentDidCatch` at all | `:2601-2655` |

What actually happens when a screen throws:
1. `ScreenBoundary.getDerivedStateFromError` captures the message and renders the inline panel in place of the screen; the rest of the shell (tab bar, workout banner) stays mounted (`:2609-2653`).
2. Because the boundary is keyed by `screen` (`:57735`), navigating to a different tab **remounts** the boundary with fresh state — a working implicit recovery path the UI never mentions.
3. If the throw happens above the screen router (in `App` itself, the shell, or during initial render), `ErrorBoundary` catches it and the whole app is replaced by the crash screen (`:58002`).
4. Neither boundary reports anywhere. There is no Sentry-style hook, no `/error` endpoint, no beta log write. **Production crashes are completely invisible to the developer.**

Gaps for the redesign: (a) add reporting in `componentDidCatch`; (b) replace "F12" copy with mobile-appropriate guidance (`:2583`); (c) offer "go back / try again" instead of a full reload; (d) merge the two near-duplicate boundary classes.

---

## Storage keys touched

Written or read by the onboarding flow and the system code I audited. All app keys use the `lk_` prefix, applied by the `ld`/`sd` helpers (`ld("profile")` → `lk_profile`).

| Key | Read | Written | By | Lines |
|---|---|---|---|---|
| `lk_profile` | yes (gate, push context) | yes | `completeOnboarding`, `enterGuestMode`, `buildContext` | `:57352`, `:171-175`, `:1419`, `:57556` |
| `lk_splits` | yes (push context) | yes (via `setSplits`) | `completeOnboarding`, `buildContext` | `:57404`, `:1420` |
| `lk_history` | yes | — | `buildContext` | `:1421` |
| `lk_feedback` | yes | — | `buildContext` | `:1422` |
| `lk_betaCodes` | yes | yes | `initBetaCodes`, `validateBetaCode`, `claimBetaCode` | `:2700-2720`, `:2723`, `:2765` |
| `lk_betaStatus` | yes | yes | `claimBetaCode`, `logBetaActivity`, `logBetaAI` | `:2766`, `:2771`, `:2782` |
| `lk_betaCode` | — | yes | `claimBetaCode` | `:2767` |
| `lk_betaId` | yes | yes | `claimBetaCode`, `isSilentBeta`, loggers | `:2768`, `:2794` |
| `lk_betaLog` | yes | yes | `logBetaActivity` | `:2772-2779` |
| `lk_betaAILog` | yes | yes | `logBetaAI` | `:2783-2790` |
| `lk_guestMode` | yes | yes | `isGuestMode`, `enterGuestMode` | `:164-169` |
| `lk_theme` | yes | (elsewhere) | pre-paint theme script | `:19` |
| `lk_deployVersion` | yes | yes | `checkDeployVersion` | `:79`, `:84-90` |
| `lk_pushDeviceId` | yes | yes | `deviceId` | `:1307`, `:1344`, `:1358` |
| `lk_pushPrefs` | yes | yes | `getPrefs`, `setPrefs` | `:1308`, `:1365`, `:1667` |
| `lk_pushEnabled` | yes | yes | `enable`, `disable`, `isEnabled` | `:1309`, `:1636`, `:1650`, `:1660` |
| `activeWorkoutRows` / `activeWorkoutSec` | yes | yes | `startWorkout`/`finishWorkout` (adjacent to `completeOnboarding`) | `:57410-57411`, `:57370-57371` region → `:57370`, `:57371` |

**Nothing about onboarding progress is persisted.** No `lk_onboardingStep`, no draft answers, no chat transcript. A refresh at step 4 loses the entire interview.

---

## Open questions / UNVERIFIED

1. **`/sw.js` contents** — the file is registered (`:70-74`) and messaged (`:1777`) but is not in this document. Confirm by fetching `https://locked-seven.vercel.app/sw.js`. Needed to know the caching strategy, the push `showNotification` payload shape, and what `source:"locked-push"` messages it emits.
2. **`/manifest.json` contents** — linked at `:13`, not in this file. Confirm by fetching `https://locked-seven.vercel.app/manifest.json`. Needed for icons, `display`, `start_url`, `theme_color`.
3. **Which model the Worker calls** — `callWorker` sends only `{system, max_tokens: 800, messages}` (`:33858-33868`) and handles both Anthropic-shaped and OpenAI-shaped responses (`:33872-33875`), so the client cannot tell. Confirm by reading the Worker source for `lockedapi.cescocugliari.workers.dev`.
4. **Whether `/beta-validate` actually gates anything** — because `validateBetaCodeRemote` short-circuits on the local list (`:2730`) and fails open on network error (`:2754`), the remote check may be decorative. Confirm by POSTing a server-only code and observing rejection.
5. **Exercise-ID validity** — the prompt whitelists IDs like `107, 201, 1001` (`:33841`, `:33851`) but nothing validates the model's `exIds` against the real exercise DB before `setSplits` (`:57368`). Confirm by cross-referencing the exercise table (owned by another agent) for every listed ID.
6. **The `lockedRest` / `lockedStorageFull` / `lockedTabReset` / `lockedFuelUpdate` / `lockedHistoryUpdate` / `lockedCoachPane` / `lockedBottomBar` / `lockedVoiceToggle` custom events** — I confirmed each has exactly one or two listeners but did not trace every dispatcher. Confirm with `grep -n 'dispatchEvent(new CustomEvent("locked'`.
7. **Timer/listener counts** — the brief cited 106 `addEventListener` and 81 timers; this build has **54** `addEventListener`, **52** `setTimeout`, **13** `setInterval`. Either the brief's numbers came from a different build or counted differently (e.g. including `removeEventListener`, or the three gesture events registered inside a `forEach` at `:63`). Confirm which file version the brief measured.
8. **Username uniqueness** — nothing in the client checks it (`:34311-34318`). UNVERIFIED whether the sync backend enforces it on first upload; confirm in the Worker / Supabase schema.
9. **Unmounted-setState leak** — `setTimeout(kickoffChat, 100)` has no cleanup (`:33830-33832`). In practice `Onboarding` only unmounts on completion, so this is likely unreachable; confirm by unmounting mid-timeout in a test harness.
