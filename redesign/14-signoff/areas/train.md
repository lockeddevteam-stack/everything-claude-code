### F-TRAIN-001 — Exercise Library — muscle-group grid (root screen)
- location: Train tab > Exercise Library > root screen
- user action: Opens the library (Train > Library tab, or via "add exercise" flows), taps a muscle-group card.
- behaviour: 1. Renders header "Exercise Library" with an optional back button (only when `p.onBack` is passed) (8506–8535). 2. Renders a search field bound to state `q` (8536–8570). 3. Renders "SELECT MUSCLE GROUP" and a 2-column grid, one card per entry in the global `GROUPS` table (8548–8613). 4. Each card shows a `D.train` glyph tinted `g.col + "22"`, the group name via `readableAccent(g.col)`, and a count computed as `g.subs.reduce((a,s)=>a+s.ex.length,0)` (8600–8612). 5. Tapping sets `grp = g.id`, which re-renders into the sub-group screen (F-TRAIN-002) (8582–8584). 6. Cards animate in with `fadeUp .3s` staggered by `i * .04` (8592).
- v6 status: WORKING

### F-TRAIN-002 — Muscle-group screen — sub-group (muscle part) list
- location: Train tab > Exercise Library > <Group>
- user action: Taps a muscle group, then a muscle-part row.
- behaviour: 1. Resolves `ag = GROUPS.find(g => g.id === grp)` (8299–8301). 2. Header shows a gradient of `ag.col + "20"`, a back button ("All Muscles") that clears `grp`, and the group name uppercased in `readableAccent(ag.col)` (8376–8410). 3. For each `ag.subs` entry renders a row: a square badge with `mergedSub(ag, s).length` + "ex", the sub name, and a preview line of the first two exercise names `s.ex.slice(0,2)...join(", ")` (8412–8493). 4. Tapping a row sets `sub = s.id` → F-TRAIN-003 (8417–8419). 5. Rows animate `fadeUp .3s` staggered `i * .05` (8434).
- v6 status: WORKING

### F-TRAIN-003 — Exercise list for a muscle part
- location: Train tab > Exercise Library > <Group> > <Muscle part>
- user action: Taps a muscle part; sees the exercise list; taps an exercise.
- behaviour: 1. `as = ag.subs.find(s => s.id === sub)`; `muscle = as.name === "All" ? ag.name : as.name` (8302–8306). 2. `exList = mergedSub(ag, as)` merges the catalogue list with any `p.customs` whose `group`/`muscle` match and whose id is not already present (7776–7797). 3. Header: back chevron to the group screen, part name in `readableAccent(ag.col)`, and `exList.length + " exercises"` (8312–8349). 4. Each entry is normalised into a **full exercise record** — `{id, name, eq, gifUrl, group, muscle, col, gid, sid, custom, apiId, imageUrl}` — before being handed to `ExBtn` (8353–8371). This is the only place `apiId` and `imageUrl` are read. 5. Tapping a row sets `selectedDetail` → F-TRAIN-006.
- v6 status: WORKING

### F-TRAIN-004 — Exercise row button (`ExBtn`)
- location: any exercise list inside the library (search results and part lists)
- user action: Taps the row.
- behaviour: 1. Renders a card: colour-tinted 34×34 icon chip (`D.train`), name, and a meta line `ex.eq || ex.equipment` + `" · CUSTOM"` if `ex.custom` + `" · +Nkg base"` if `ex.startResist > 0` (7798–7854). 2. `onClick` → `setSelectedDetail(ex)` (7802–7804).
- v6 status: WORKING

### F-TRAIN-005 — Exercise search
- location: Train tab > Exercise Library > search field (root screen), and the dedicated Search Results screen
- user action: Types into "Search all exercises…".
- behaviour: 1. Typing sets `q`. The search screen activates only when `q.length > 1` (8191). 2. `res = ALL_EX.filter(e => e.name.toLowerCase().indexOf(q.toLowerCase()) >= 0)` (8192–8196). 3. Customs not already in `res` and matching the query are appended (8197–8206). 4. Renders a "Search Results" header with a back button that clears `q`, plus a second, `autoFocus` search input and a "Clear" button (8207–8287). 5. Results render as `ExBtn` rows; empty result shows the centred text "No results" (8288–8303).
- v6 status: WORKING

### F-TRAIN-006 — Exercise detail sheet
- location: Train tab > Exercise Library > any exercise row; also the live workout log screen (11644)
- user action: Taps an exercise row, or opens detail from a logging row.
- behaviour: 1. `ExLib` sets `selectedDetail` and short-circuits its whole render to `ExerciseDetailModal` (7855–7866). 2. On mount / whenever `ex.id` changes, `formVid` is set to `undefined` (loading) and `ytSearchVideo(ex.name, ex.id)` is called; the result sets `formVid` to a videoId or `null` (7205–7214). An `alive` flag guards the late resolve. 3. The sheet is portalled via `lkPortal` into `#lk-overlay-root` (7216, 5072), which scroll-locks the page through a MutationObserver (5033–5059). 4. Layout: bottom sheet, `maxHeight: 92dvh`, `maxWidth: 420`, drag handle wired to `useSheetDrag` (7204), scrim tap closes (7231–7239), title = `ex.name`, 44×44 close button (7281–7297). 5. **Animation panel** — if `ex.gifUrl`, an `<img>` with `aspectRatio: 1`, `loading="lazy"`, `decoding="async"`, and `onError` that hides the element (7305–7328). Otherwise a "No animation available" placeholder card (7329–7343). 6. **My Notes** — `ExerciseNotes` with `key: "notes_" + ex.id` (7343–7346) → F-TRAIN-007. 7. **Watch form** — three states: `undefined` → "Finding a form video…" (7347–7353); `null` → "No form video found for this exercise." (7354–7358); a videoId → a tappable card with the YouTube thumbnail `https://i.ytimg.com/vi/<id>/hqdefault.jpg`, a play triangle, the label "WATCH FORM" and `ytCreatorFor(ex.id) + " · opens YouTube"` (7359–7390). 8. Tapping the video card fires `logBetaActivity("form_video_opened", {exercise: ex.name})` then `window.open("https://www.youtube.com/watch?v=" + formVid, "_blank")` (7359–7363). 9. **Facts grid** — MUSCLE GROUP (`ex.group || "Unknown"`), MUSCLE PART (`ex.muscle || "General"`), and a full-width EQUIPMENT tile (`ex.eq || "Bodyweight"`) in accent colour (7391–7449). 10. **Footer** — "ADD TO WORKOUT" (rendered only when `p.onAddToWorkout` is supplied) and "BACK" (7450–7494). From `ExLib` the add handler calls `p.onSelect(selectedDetail)` then clears `selectedDetail` (7858–7864).
- v6 status: WORKING

### F-TRAIN-007 — Per-exercise personal notes (autosaving)
- location: Train tab > Exercise Library > exercise detail sheet > "MY NOTES"
- user action: Types cues/setup numbers into the textarea.
- behaviour: 1. Initial value seeded lazily from `getExNote(exId)` (7120–7122). 2. On each keystroke: `setText`, `setSaved(false)`, reset a 600 ms debounce timer; on fire, `saveExNote(exId, v)` and `setSaved(true)` (7136–7145). 3. On blur: cancel the timer, save immediately, mark saved (7176–7181). 4. On unmount: cancel the timer and flush `latestRef.current` so closing the sheet mid-sentence still saves (7128–7134). 5. Header shows "MY NOTES" plus a status chip reading "Saved" (green) or "Saves automatically" (7146–7175). 6. `saveExNote` deletes the key entirely when the text is empty/whitespace, otherwise stores `{text, updated: ISO}` (7107–7117).
- v6 status: WORKING

### F-TRAIN-008 — Create Custom Exercise
- location: Train tab > Exercise Library > root > "Create Custom Exercise"
- user action: Taps the dashed "Create Custom Exercise" button, fills the form, taps "CREATE EXERCISE".
- behaviour: 1. Button sets `showCreate = true` (8614–8623); `ExLib` returns the form instead of the library (7867). 2. Header: back button that resets `cName/cGrp/cSub/cStartResist/cSmithNoCB` (7884–7911). Note it does **not** reset `cEq`. 3. **EXERCISE NAME** — free text `cName`, border turns accent when non-empty (7921–7950). 4. **MUSCLE GROUP** — 2-column grid of `GROUPS`, each with a colour dot; selecting sets `cGrp` and clears `cSub` (7951–8014). 5. **MUSCLE PART** — pill row of `cgObj.subs`, only rendered once a group is chosen (8015–8055). 6. **EQUIPMENT** — hardcoded pill list: Barbell, Dumbbell, Cable, Machine, Plate Loaded, Smith Machine, Bodyweight, Band, Other. Selecting clears `cStartResist` (8056–8096). 7. **STARTING RESISTANCE** — shown only for `cEq === "Plate Loaded"`; numeric input with `step 0.01`, helper copy, unit label "kg / lb", plus a live line "Logged weight will show total including N base resistance." (8097–8145). 8. **SMITH MACHINE BAR** — shown only for `cEq === "Smith Machine"`; a single toggle "Counterbalance active (7kg / 15lb bar)" writing `cSmithNoCB`, with explanatory copy for each state (8146–8175). 9. **CREATE EXERCISE** — disabled until name+group+part are set. On submit it derives `muscle = csObj && csObj.name !== "All" ? csObj.name : cgObj.name`, allocates the first unused id starting at 90000 by scanning `ALL_EX` (8149–8156), builds `{id, name, eq, group, muscle, col, gid, sid, custom:true, startResist, smithNoCB}` (8147–8168), calls `p.onCustom(newEx)` and `p.onSelect(newEx)`, then resets the form and exits (8169–8188).
- v6 status: WORKING

### F-TRAIN-009 — Exercise action sheet (press-and-hold on a logging card)
- location: Train tab > active workout log > press-and-hold an exercise card (invoked at 11649)
- user action: Long-presses an exercise card during a workout; a blurred overlay lifts the card out and shows action pills; taps one.
- behaviour: 1. Caller passes `{rect, title, subtitle, items, onClose, onSelect}` where `items` come from `actionItems(ri)` and each item carries `{id, label, icon, color?, destructive?, run}` (11649–11659). 2. Sheet is portalled (`lkPortal`, 7551) into `#lk-overlay-root`; scroll is explicitly locked/unlocked in a mount-once effect (7530–7537). 3. `React.useLayoutEffect` positions the bubble at `p.rect.top`, clamped to `[16, viewportHeight - height - 16]` so it stays where the finger was (7511–7519). 4. Backdrop: `rgba(0,0,0,0.42)` with `backdrop-filter: blur(14px) saturate(140%)`, class `lk-veil` (7554–7568). 5. A full-bleed dismiss `<button>` with `transform: none` inline to defeat the global `button:active { transform: scale(0.97) }` edge-loss bug (7569–7583). 6. The held card is redrawn above the blur with `title` and optional `subtitle`, `transformOrigin` set from the press X within the card (`originX`, 7545–7548), class `lk-pop` (7598–7616). 7. Action pills render below, each with an `Ic` glyph, `readableAccent(col)` text, staggered `animationDelay 0.02 + i*0.03s`, class `lk-rise` (7617–7649). 8. Destructive items **arm in place**: first tap sets `armedId` and relabels to "Tap again to <label>"; second tap dismisses and runs (7624–7628, 7648). 9. `dismiss(then)` guards re-entry with `closingRef`, sets `closing` (swapping every class to `lk-out`), and after 170 ms runs the action then `p.onClose()` (7521–7529). 10. Escape closes via `useEscape(dismiss)` (7498).
- v6 status: WORKING

### F-TRAIN-010 — Replace / swap exercise panel
- location: Train tab > active workout > Swap action (rendered at 11418)
- user action: Chooses "Swap" on an exercise, then picks a replacement or searches.
- behaviour: 1. With `q.length <= 1`, shows up to 6 alternatives filtered by `e.muscle === ex.muscle && e.id !== ex.id` under the heading "SAME MUSCLE" (8629–8633, 8712–8717). 2. With `q.length > 1`, shows up to 8 name-substring matches excluding the current exercise, under "SEARCH RESULTS" (8629–8631). 3. Header shows "Replace Exercise" and "Replacing: <name>" in accent, plus a back button calling `p.onClose` (8636–8686). 4. An `autoFocus` search field bound to `q` (8687–8711). 5. Each row shows the colour chip, name, `e.eq`, and a "Swap" affordance; tapping calls `p.onSelect(e)` (8718–8772). 6. Empty list renders "No results" (8773–8780).
- v6 status: WORKING

### F-TRAIN-011 — Throwback card (progress flashback)
- location: Home / Progress surfaces (rendered at 16536, 26605, 28645) — component body lives in this range
- user action: Views the card; taps ✕ to dismiss.
- behaviour: 1. Returns `null` when `p.data` is absent (4665–4666). 2. Header "THROWBACK — <label>" in accent, plus a ✕ dismiss button calling `p.onDismiss`, `aria-label` "Dismiss throwback" (4671–4680). 3. For each `d.items[i]`, renders the label (`"Body weight"` for `kind === "weight"`, else `it.name`) and a `then → now` line, with a ▲/▼ delta rounded to one decimal (4681–4694). 4. Values pass through `liftDisp(v, useKg)`; unit string is `kg`/`lbs` from `p.useKg !== false` (4667–4670). 5. Optional THEN/NOW progress-photo pair rendered side by side from `d.photoPair.then/.now.thumb` (4695–4708). 6. Footer copy: "Proof it's working. Keep going." (4709–4711).
- v6 status: PARTIAL

### F-TRAIN-012 — Decimal-safe number input (`DraftNum`)
- location: shared primitive — used in set logging (17392, 17412) and recipe ingredients (20465)
- user action: Types a weight/rep/quantity.
- behaviour: 1. Holds raw keystrokes in local `draft` while focused; falls back to `String(p.value)` otherwise (5086–5087). 2. Rejects any keystroke not matching `/^[0-9]*[.,]?[0-9]*$/` — no minus, no exponent (5094–5096). 3. Rejects separators entirely when `p.decimal === false`, and switches `inputMode` to `numeric` (5090, 5097). 4. Calls `p.onType(raw)` on each accepted keystroke (5100). 5. On blur: normalises `,` → `.`, clears the draft, and calls `p.onCommit(raw)` with `""` for empty or a bare "." (5102–5107). 6. Enter blurs the field (5109); `enterKeyHint: "done"`, autocomplete/autocorrect off (5091–5093).
- v6 status: WORKING

### F-TRAIN-013 — Icon primitive (`Ic`) and glyph table (`D`)
- location: shared primitive, used everywhere in this range and app-wide
- user action: n/a (render-only)
- behaviour: 1. Renders a 24×24-viewBox `<svg>` sized by `p.z` (default 20), stroke `p.c` (default `TX`), width `p.w` (default 1.8), round caps/joins (5234–5246). 2. `p.d` may be a string (one `<path>`) or an array (many, keyed by index) (5247–5254). 3. Accessibility: `aria-label` from `p.a`; `role` is `"img"` when labelled and `"presentation"` otherwise (5244–5245). 4. `D` (5281–5331) is the glyph table: 50 named paths covering navigation (home/train/fuel/prog/profile), chrome (back/plus/check/x/search/chev/edit/trash), stats (trophy/fire/star/bolt/scale), and a dedicated cardio set (run, bike, dumbbell, rower, elliptical, stairs, climb, swim, rope, mountain, ball) added because "every machine used to fall back to the dumbbell" (5318–5319).
- v6 status: WORKING (but see notes)

### F-TRAIN-014 — Loading spinner primitive
- location: shared primitive
- user action: n/a
- behaviour: Renders a centred 8px accent dot with `animation: pulse 1.4s infinite` and the text "Loading…" (5256–5279).
- v6 status: DEAD

### F-TRAIN-015 — Form-video lookup and cache
- location: backing service for F-TRAIN-006
- user action: Indirect — opening an exercise detail sheet triggers it.
- behaviour: 1. `ytSearchVideo(name, exId)`: builds `cacheKey = "yt3_" + name`; a cache hit resolves immediately (7067–7070). 2. Otherwise `POST {WORKER_API}/yt-search` with `{name, exId}` and `Content-Type: application/json` (7071–7079). 3. Reads `d.videoId`; on success writes it to `localStorage[cacheKey]` and resolves it, otherwise resolves `null` (7080–7085). 4. Any network/parse error resolves `null` (7086–7088). 5. `ytCreatorFor(exId)` picks a creator name by `exId % 4` from the hardcoded `YT_CREATORS` `["Jeff Nippard", "TNF", "Cbum", "Jacob Oestreicher"]` (7062–7065).
- v6 status: WORKING

### F-TRAIN-016 — ExerciseDB detail fetch (`ascendFetchDetail`)
- location: n/a — no UI
- user action: none
- behaviour: `GET {WORKER_API}/exercise-detail/<encodeURIComponent(exerciseId)>` and returns `r.json()` (7089–7093).
- v6 status: DEAD

### F-TRAIN-017 — Per-exercise equipment configuration (storage layer)
- location: backing storage for the plate calculator / bar setup (UI outside this range)
- user action: Indirect.
- behaviour: `getExEquip(exId)` reads `lk_exequip_<exId>` defaulting to `{bar:"oly", machine:false, baseKg:0, baseLb:0, plateInv:null, smithOffset:0}` (7047–7056); `setExEquip(exId, data)` writes it (7057–7059).
- v6 status: WORKING

### F-TRAIN-018 — Plate / barbell maths (`BARS`, `calcPlatesPerSide`)
- location: backing maths for the plate calculator (UI outside range)
- user action: Indirect.
- behaviour: 1. `BARS` (5332–5368): Olympic 20 kg/45 lb, Women's 15/35, EZ Curl 10/25, Trap 25/55, Smith 7/15, No Bar 0/0, each with `offset: 0`. 2. `PLATES_KG = [25,20,15,10,5,2.5,1.25,0.5]`, `PLATES_LB = [45,35,25,15,10,5,2.5]` (5369–5370). 3. `getBar(id)` linear-scans, defaulting to the Olympic bar (5371–5374). 4. `calcPlatesPerSide(target, bar, unit, inv)` subtracts bar weight + offset, halves, then greedily fills from the largest available plate (custom inventory `inv` sorted descending if given), returning `{plates, perSide, achievable, remainder}` (5375–5402).
- v6 status: WORKING

### F-TRAIN-019 — Muscle recovery model & volume summary (data layer for Train surfaces)
- location: backing model for recovery/physique surfaces (UI outside range)
- user action: Indirect.
- behaviour: 1. `muscleVolumeSummary(history)` — 6-week window, lifting sessions only, non-warm-up sets, expanded through `getInvolvement` and averaged per week (4715–4740). 2. `getInvolvement(name, group)` — primary muscle at weight 1.0, plus synergists at 0.5 and tertiary at 0.25 from the regex table `MUSCLE_SYNERGY` (4772–4816, 4817–4844). Only the **first** matching rule applies (`break`, 4842). 3. `resolveSavedEx(savedEx)` — id lookup via `getEx`, then a name lookup via `exByName`, else `null` (4845–4856). 4. `computeMuscleRecovery(history, now)` — walks up to 40 sessions within 14 days, weights each set by `rirIntensity` (RIR 0→1.0 … 4+→0.4, 4883–4891), scales `BASE_RECOVERY_H` (Quads 66h … Forearms 24h, 4869–4882) by `0.5 + load/6` clamped to [0.5, 1.5], and classifies each muscle `ready` / `recovering` / `heavy`, sorted ready-first (4892–4990). 5. `workoutNameGroups(name)` (4857–4868) is the fallback when no exercise in a session resolves — keyword matching on the workout name assigns a flat load of 3.0 per group (4952–4956).
- v6 status: WORKING

### F-TRAIN-020 — Overlay / portal / scroll-lock infrastructure
- location: shared primitive underlying every sheet in this range
- user action: Indirect — opening any sheet.
- behaviour: 1. `lkPortal(children, opts)` portals into `#lk-overlay-root` (scroll-locking) or, with `{lock:false}`, into `#lk-sheet-root` (not locking) — used by the number pad, which sits over live content (5061–5084). 2. `lkOverlayRoot()` lazily creates the host on `<body>` and attaches a `MutationObserver` that calls `lkLockScroll`/`lkUnlockScroll` whenever the host goes from empty to non-empty (5033–5060). 3. `lkLockScroll`/`lkUnlockScroll` are reference-counted, remember `.lk-scroll`'s `scrollTop`, and toggle the `lk-locked` class on `<html>`, restoring position on unlock (5011–5031). 4. `lkScroller`/`lkScrollTop`/`lkScrollBy`/`lkScrollToTop` route all scrolling through `.lk-scroll` with a `window` fallback (4992–5010). 5. Falls back to rendering children in place if `ReactDOM.createPortal` is missing or throws (5073–5083).
- v6 status: WORKING

### F-TRAIN-021 — Dialog focus trap, Escape stack, and two-tap confirm
- location: shared primitives for every dialog in this range
- user action: Presses Tab / Shift-Tab / Escape inside a sheet; taps a destructive control twice.
- behaviour: 1. `lkTrapTab(e)` collects visible focusables (`offsetParent !== null`) and wraps focus at both ends (5113–5124). 2. `lkDialogRef(node)` is a **callback ref**, not a mount effect, so focus management fires when the dialog mounts rather than when its parent does; it pushes the previously focused element onto `_lkDialogStack`, attaches `lkTrapTab`, focuses the node, and restores focus on unmount (5112, 5125–5140). 3. A single global capture-phase `keydown` listener, guarded by `window.__lkEscBound`, walks `_lkEscStack` from the top, skipping entries whose ref is `null`, and fires the first live handler (5142–5158). 4. `useEscape(onClose)` registers one stack entry per mount and reads the handler fresh through a ref (5160–5177). 5. `lkConfirm(key, message)` arms on the first call (toasting `message` as an error) and returns `true` only on a second call within 7 seconds (5179–5197). 6. `lkKeyActivate(e)` maps Enter/Space to `.click()` for `role="button"` wrappers (5227–5233).
- v6 status: WORKING

### F-TRAIN-022 — Workout identity helpers (`withWorkoutIds`, `sameWorkout`)
- location: data layer for history edit/delete
- user action: Indirect.
- behaviour: 1. `withWorkoutIds(list)` stamps `id = "wl_" + (dateISO||date||"x") + "_" + i` onto any id-less entry and persists the whole list back to `lk_history` if anything changed (5199–5212). 2. `sameWorkout(a,b)` prefers id equality, else compares a `[date,name,dur,sets,vol]` key — but **refuses to match** when both `sets` and `vol` are undefined (i.e. cardio), so two identical runs on one day are not conflated (5213–5226).
- v6 status: WORKING

### F-TRAIN-023 — Cardio activity catalogue and field schema (constants only)
- location: data layer for the Cardio logging surfaces (UI outside this range)
- user action: Indirect.
- behaviour: 1. `CARDIO_SCHEMA = 2` (5461). Records live in `lk_history` alongside strength work; everything is stored in metres and seconds so the mi/km toggle never touches disk (5452–5460). 2. `CARDIO_GROUPS` = Machines / Indoor / Outdoor / Sport (5467). 3. `CARDIO_FIELDS` (5469–5485) maps 14 field-set names (tread, curved, bike, spin, ellip, stair, erg, climb, outrun, ruck, outbike, swim, rounds, plain) to the metric list the form should ask for. 4. `CARDIO_ACTIVITIES` (5486–5533) — **41 activities**: 17 Machines, 6 Indoor, 13 Outdoor, 6 Sport (the "Sport" count includes `sport_other`). Each is `{id, name, group, icon, machine?, fields, legacy?}`. 5. `CARDIO_MACHINES` (5572–5589) — 15 machine categories. `CARDIO_BRANDS` (5590–5617) — 26 brands with model lists (Technogym, Life Fitness, Precor, Matrix, Cybex, StairMaster, Woodway, Concept2, Peloton, NordicTrack/iFIT, Sole, Bowflex, Assault, Rogue, Hydrow, Echelon, TrueForm, Star Trac, Nautilus, Schwinn, WaterRower, Keiser, Stages, Wattbike, Other). 6. `CARDIO_TYPES` (5403–5451) is the **v1** eight-entry table (run, walk, bike, stair, row, ellip, hiit, swim) with `met` and `trackDist` — still consumed by `estimateCardioCalories` (7015–7046). 7. Lookup helpers: `cardioActivity` (5534), `cardioFieldsFor` (5540), `cardioHasField` (5568), `cardioModalityForLegacy` (5554), `cardioLegacyForModality` (5561).
- v6 status: WORKING

### F-TRAIN-024 — Cardio calorie engine (5-tier estimator)
- location: data layer behind cardio calorie displays (UI outside range)
- user action: Indirect.
- behaviour: 1. `ceEstimateCalories(w, profile, env, opts)` (6397–6494) climbs a ladder and reports which rung it used: tier 1 measured power (Concept2 split / erg watts / vertical work), tier 2 physics (Martin cycling model, Minetti ambulation, Pandolf-Santee load carriage, distance rule), tier 3 heart rate (Keytel), tiers 4–5 MET lookup. Each result packs `{kcal, netKcal, grossKcal, range, tier, method, confidence, basis, detail}` with error bands of 0.10–0.40 (6412–6425). 2. Net calories are the default because the number feeds a food tracker whose target already contains resting burn (6390–6396). 3. `cardioEngineInput(rec)` (6746–6808) translates a stored record into the highest-tier engine input, converting incline % to grade, floors→3 m, steps→0.2 m, and picking a fallback MET by speed. 4. `cardioEstimate(rec, bodyProfile)` (6809–6838) is "the one function the UI calls" and always returns something displayable, falling back to a bare MET estimate with a ±40 % range. 5. `cardioBodyProfile(profile, fuelProfile, weightLog)` (6720–6745) hunts bodyweight/height/age/sex across three sources and sets `complete` when Harris-Benedict can run. 6. Two documented deliberate omissions: no bodyweight scaling for weight-supported work, and no humidity/sun/AQI multipliers (5885–5905, `CE_SAFETY_ONLY` at 6106). 7. Display labels: `CE_CONFIDENCE_LABEL` (6846–6849), `CE_METHOD_LABEL` (6850–6861). 8. MET tables `CE_MET_RUNNING` (6506), `CE_MET_WALKING` (6544), `CE_MET_CYCLING` (6571), `CE_MET_SWIMMING` (6601), `CE_MET_MACHINES` (6625), cited as the 2024 Compendium (5954).
- v6 status: WORKING (as a library) — UNVERIFIED as a user-facing feature

### F-TRAIN-025 — Cardio v1 → v2 migration (runs on load)
- location: app boot
- user action: None — automatic.
- behaviour: 1. `setTimeout(migrateCardioV2, 0)` at 6999 schedules it on every load. 2. Guarded by `storageAvailable` and the `lk_cardioMigrated` flag (6953–6954). 3. For each `type === "cardio"` row below `CARDIO_SCHEMA`: maps `cardioType` through `CARDIO_LEGACY_MODALITY` (6947–6950), converts minutes→`durationSec`, display distance→`distanceM` via `cardioDistToM`, maps the v1 three-step intensity to RPE 8/5/3, wraps `calories` into `{value, method:"met", estimated:true}`, nulls `environment`/`machine`/`metrics`/`heartRate`, and stamps `schemaVersion` (6955–6987). 4. Writes `lk_history` back and sets `lk_cardioMigrated`, logging a `console.info` count (6988–6994). 5. Whole body wrapped in try/catch returning 0 (6995–6996).
- v6 status: WORKING

### F-TRAIN-026 — Cardio-vs-lifting accounting guards
- location: data layer read by every history/volume surface
- user action: Indirect.
- behaviour: 1. `isLiftingSession(w)` = `w.type !== "cardio"` (6873–6875). 2. `liftVolume(w)` strips non-digits from `w.vol`, detects the `lb`/`kg` suffix that was on screen when the session was saved, and converts to storage units so mixed-unit histories add up (6876–6886). 3. `liftSets(w)` returns 0 for cardio (6887–6890). 4. `cardioMinutes(list)` (6891–6899) and `cardioSessionCalories(w)` (6900–6907, handling both the v1 number and the v2 `{value}` object). 5. `sessionSummaryLine(w)` produces the AI-facing one-liner, branching cardio vs lifting (6908–6926). 6. `sessionMetaLine(w, withVolume)` produces the UI sub-line: `"30 min · 5.2 km · 320 cal"` for cardio, `"4 sets · 3800 kg"` for lifting (6927–6946).
- v6 status: WORKING

### F-TRAIN-027 — Bottom tab bar (`Nav`)
- location: global chrome (component body falls inside this range at 7652–7760)
- user action: Taps a tab.
- behaviour: 1. Five tabs: Home, Train, Fuel, Coach (`D.ai`), Profile (7695–7712). 2. Publishes its measured height to the CSS custom property `--lk-nav-h` on mount, on `ResizeObserver` fire, and on `window resize`, so content clearance tracks Dynamic Type / page zoom (7657–7694). 3. Deliberately `position: relative` — the last row of the shell's flex column rather than a fixed element, so a browser resizing the visual viewport has nothing to reposition (7714–7723). 4. Active tab: accent colour, a 46×28 pill background `OR_H + "1A"` animating `pillIn`, bolder label; sets `aria-current="page"` and appends " (current page)" to the `aria-label` (7736–7759). 5. Tapping calls `p.go(t.id)` (7731–7733).
- v6 status: WORKING

### F-TRAIN-100 — Replace exercise (search alternatives)
- location: Train > Workout Log > exercise card > hold > "Swap exercise" > Replace Exercise panel
- user action: Types into the search box or taps one of the suggested alternatives ("Swap").
- behaviour: 1. `WorkoutLog` sets `repIdx = ri` and `view = "replace"` (v6.html:10297). 2. `ReplacePanel` renders full-screen with the current exercise named in the subheader (v6.html:8672-8680). 3. With query length <= 1 it lists up to 6 exercises with the same `muscle`, excluding itself (v6.html:8630-8635). 4. With query length > 1 it lists up to 8 exercises whose `name` contains the query, case-insensitive, excluding itself (v6.html:8628-8631). 5. Tapping a row calls `p.onSelect(e)` (v6.html:8737-8739) → `WorkoutLog` replaces the row wholesale with `mkRow(ex.id)` (v6.html:11424-11431), returning to `view="log"`.
- v6 status: WORKING

### F-TRAIN-101 — Split builder — name a split
- location: Train > Splits > New Split / Edit Split > name input
- user action: Types the split name.
- behaviour: controlled input writes `name` (v6.html:9256-9276); SAVE is disabled until `name.trim()` and at least one day exist (v6.html:9800-9815).
- v6 status: WORKING

### F-TRAIN-102 — Split builder — add / rename / remove day
- location: Train > Splits > builder > "Add a new day" card and day header
- user action: Types a day name and taps Add (or presses Enter); taps the day title or pencil to rename; taps the red × to delete the day.
- behaviour: 1. `addDay` rejects an empty name with a toast "Name the day first — Push, Legs, whatever you call it." (v6.html:9125-9131). 2. Otherwise appends `{name, items: []}` and clears the input (v6.html:9132-9137). 3. Rename: tapping the title or pencil sets `renamingDay`/`renameVal`; the inline input commits on blur or Enter and cancels on Escape (v6.html:9309-9372). 4. `removeDay(di)` filters the day out immediately, **no confirmation** (v6.html:9139-9145).
- v6 status: WORKING

### F-TRAIN-103 — Split builder — add exercise to a day
- location: Train > Splits > builder > day card > "+ Exercise"
- user action: Taps "+ Exercise", picks from the exercise library.
- behaviour: sets `picking = di`, `view = "pick"` (v6.html:9704-9707) → renders `ExLib` (v6.html:9221-9229) → `pickEx` appends `{type:"ex", id}` to that day's `items` and returns to build (v6.html:9174-9187).
- v6 status: WORKING

### F-TRAIN-104 — Split builder — add a note "Block" to a day
- location: Train > Splits > builder > day card > "📝 Block"
- user action: Taps "📝 Block", then fills Note title / Details / Duration inline.
- behaviour: appends `{type:"block", title:"", notes:"", duration:""}` (v6.html:9724-9736); three inline inputs write through `updateBlock` (v6.html:9160-9173, UI 9622-9679).
- v6 status: WORKING

### F-TRAIN-105 — Split builder — drag to reorder items within a day
- location: Train > Splits > builder > day card > grab handle (3 bars) on an exercise or block row
- user action: Touch-and-hold the handle 350 ms, drag vertically, release.
- behaviour: 1. `sbLongStart` arms a 350 ms timer; >10 px of movement before it fires cancels (v6.html:8813-8830). 2. On fire: snapshots the geometry of all `[data-sbday][data-sbrow]` rows, lifts the dragged row (`scale(1.03)`, shadow, z-index 100), vibrates 30 ms (v6.html:8831-8890, 8965). 3. `sbUpdateTarget` translates the row with the finger and shifts neighbours by `±H`, with a 10 ms tick each time the insertion index changes (v6.html:8967-9001). 4. Edge auto-scroll: within 100 px of the top/bottom, after a 150 ms dwell, `lkScrollBy` runs each frame (v6.html:9100-9123). 5. `sbDragEnd` runs a spring animation (`SPRING.snap`, v6.html:2067) to the destination, then commits the reorder with `splice` and an 8 ms tick (v6.html:9010-9086). 6. Escape or `touchcancel` cancels the move (v6.html:8930-8944).
- v6 status: PARTIAL

### F-TRAIN-106 — Split builder — save split
- location: Train > Splits > builder > SAVE SPLIT
- user action: Taps SAVE SPLIT.
- behaviour: `save` splits `items` into `exIds` (type `"ex"`) and `blocks` (type `"block"` → `{title, notes, duration}`), emits `{id, name, days, created}` where `id` is the existing id or `"s"+Date.now()`, and `created` is `new Date().toLocaleDateString()` (v6.html:9188-9219). Parent replaces-or-appends into `splits` (v6.html:15045-15052).
- v6 status: WORKING

### F-TRAIN-107 — Number pad (weight / reps entry)
- location: Train > Workout Log > any weight / reps / L / R cell
- user action: Taps a cell; a bottom pad appears; taps digits, `.`, DEL, ±2.5/±5 chips (weight only), then DONE or CANCEL.
- behaviour: 1. `setNumpadTarget({ri, si, field, label, unit})` from the cell (e.g. v6.html:13182-13190). 2. `NumPad` mounts keyed by `ri_si_field` so switching cells re-seeds the initial value (v6.html:13692-13697). 3. `tap` handles digits, single decimal point (`""` → `"0."`), leading-zero replacement, DEL, and a hard 6-character cap (v6.html:9853-9863). 4. `increment(n)` (weight only) clamps to `[0, 9999]` and rounds to 2 dp (v6.html:9864-9873). 5. DONE calls `p.onDone(val)` → `setVal(...)`, which converts a weight from the display unit to the stored unit via `dispToKg` (v6.html:10716-10717) and closes the pad.
- v6 status: WORKING

### F-TRAIN-108 — Start / resume an active workout session
- location: Train > Workout Log (screen)
- user action: Starts a workout from a split or empty; on reload/return the session resumes.
- behaviour: 1. `rows` initialises from `ld("activeWorkoutRows", null)`; if absent, from `p.exIds.map(mkRow)` concatenated with `p.blocks.map(mkBlock)` (v6.html:10387-10396). 2. `sec` initialises from `ld("activeWorkoutSec", 0)` (v6.html:10397-10399). 3. `startTimeRef` back-dates to `Date.now() - sec*1000` so the elapsed clock survives a reload (v6.html:10530-10538). 4. A 500 ms interval recomputes elapsed from wall time; `visibilitychange` re-syncs on return (v6.html:10539-10570). 5. Rows and seconds are persisted on every change, **but only when some progress exists** (any `done`, `w`, `r`, `rL`, `rR`) (v6.html:10659-10668).
- v6 status: PARTIAL

### F-TRAIN-109 — Auto-prefill from last session ("LAST" row / rec values)
- location: Train > Workout Log > exercise card > set rows and the LAST line
- user action: None — automatic on adding an exercise.
- behaviour: 1. `lastSessionIndex` is memoised over `p.history`: for each exercise **name**, the first history entry encountered with non-empty sets wins (history is newest-first, v6.html:57426) (v6.html:10021-10041). 2. `mkRow` copies those sets into the new row with `done:false` and `rec:true`, preserving `w, r, rL, rR, rir, setType, partials` (v6.html:10056-10073). 3. With no history, three empty sets are created with `rir:"2"` (v6.html:10074-10105). 4. `rec:true` renders the value muted and the cell border tinted (v6.html:13173-13181); the first user edit clears `rec` (v6.html:10723-10726). 5. A "LAST wXr wXr … date" summary line renders only when `row.lastDate` exists, built from the sets still flagged `rec` (v6.html:13322-13345 unilateral, 13617-13646 normal).
- v6 status: WORKING

### F-TRAIN-110 — "Last done" stale badge
- location: Train > Workout Log > exercise card header
- user action: None.
- behaviour: `staleLast(ds)` returns true only when the last date is >31 days old, or when `Date.parse` fails (v6.html:10045-10051). Only then does the "· Last: <date>" chip render (v6.html:12960-12971).
- v6 status: WORKING

### F-TRAIN-111 — Log a set — weight, reps, RIR
- location: Train > Workout Log > exercise card > set row (grid `# | KG | REPS | RIR | ✓`)
- user action: Taps the weight cell or reps cell (opens NumPad); picks RIR from a `<select>` (0,1,2,3,4,"5+").
- behaviour: 1. Weight/reps go through `NumPad` → `setVal` (v6.html:13563-13590, 13648-13673). 2. `setVal` converts `field === "w"` from display to stored unit (`dispToKg(val, rowUsesKg(ri))`), records activity, clears `rec` (v6.html:10715-10736). 3. RIR writes directly on change (v6.html:13675-13691). 4. `getSetVal` reads back, converting weights for display (v6.html:11298-11307).
- v6 status: WORKING

### F-TRAIN-112 — Mark a set done (✓) — with haptics, pop animation, PR check and rest start
- location: Train > Workout Log > exercise card > ✓ button on a set row
- user action: Taps the ✓ checkbox. - Behavior (`toggleDone`, v6.html:10737-10812): 1. `noteActivity()`; `navigator.vibrate(30)`. 2. `setCompletedSetAnim("ri,si")` for 400 ms → `scalePopOut 0.3s` on the row (v6.html:13540). 3. `flip()` is computed outside the updater (purity fix documented at v6.html:10744-10748), then `setRows(flip)` commits. 4. If the set became `done` **and** has `w` and `r`: run the PR check (F-TRAIN-120). 5. If `restEnabled` and the set became `done`: `startRest(restTarget, rowName)` (v6.html:10811).
- behaviour: 
- v6 status: WORKING

### F-TRAIN-113 — Add a set / remove a set
- location: Train > Workout Log > exercise card > "+ Add Set"; swipe-left on a set row
- user action: Taps "+ Add Set" (v6.html:13536-13560), or swipes a set row left past the threshold.
- behaviour: 1. `addSet(ri)` appends `{w:"", r:"", rir:"2", done:false}` (v6.html:10824-10836). 2. Swipe: `onTouchStartSet` / `onTouchMoveSet` track dx with velocity smoothing; a >15 px vertical move aborts the swipe; crossing -80 px fires a 10 ms tick; positive dx gets rubber-banding via `swipeRubber` (v6.html:10851-10913). 3. `onTouchEndSet` deletes when `swipeShouldDelete` (projected position with 0.998 friction < -80 px) (v6.html:10841-10850, 10914-10922).
- v6 status: PARTIAL

### F-TRAIN-114 — Cycle set type: Normal → Warm-up → Drop
- location: Train > Workout Log > exercise card > the set-number button (`1`, `W`, `D`)
- user action: Taps the number at the left of a set row (title: "Tap to cycle: Normal → Warmup → Drop").
- behaviour: 1. `toggleSetType` advances `normal → warmup → drop → normal` (v6.html:10214-10240). 2. On entering `drop` with a preceding set that has a weight, it auto-fills 75 % of that weight rounded to 2.5 (v6.html:10229-10235). 3. Display: warm-ups show `W` in `WA` colour with an `WA_H+"08"` background and 0.85 opacity; drops show `D` in `OR`, indented 14 px; normal sets get a running counter that skips W/D rows (v6.html:13096-13103, 13584-13592). 4. Warm-ups are excluded from the session set count and volume totals (v6.html:10692-10706).
- v6 status: WORKING

### F-TRAIN-115 — Add warm-up sets automatically
- location: Train > Workout Log > exercise card > hold > "Add warm-up sets"
- user action: Holds the card, taps "Add warm-up sets".
- behaviour: `addWarmupSets(ri)` finds the first non-warm-up set with a weight, and prepends two warm-ups at 50 % × 8 reps @ RIR 4 and 70 % × 5 reps @ RIR 3, each rounded to 2.5. With no working weight it prepends the same rep/RIR scheme with blank weights (v6.html:10146-10213).
- v6 status: WORKING

### F-TRAIN-116 — Partials counter
- location: Train > Workout Log > exercise card > below a non-warm-up set row > "PARTIALS + / ✕"
- user action: Taps `+` to add one partial rep; taps `✕` to clear.
- behaviour: 1. Row rendered only when `!isWarmup && !ld("hidePartials", false)` (v6.html:13470). 2. `+` increments `set.partials` via `setVal(..., "partials", String(cur+1))` and flashes for 320 ms (`partialsFlash` animation) (v6.html:13494-13514). 3. `✕` sets `partials` to `""` (v6.html:13515-13529). 4. When >0, a `+NP` badge is overlaid on the reps cell (v6.html:13662-13673).
- v6 status: WORKING

### F-TRAIN-117 — Unilateral mode (track left & right)
- location: Train > Workout Log > exercise card > hold > "Track left & right"
- user action: Holds the card, taps "Track left & right" / "Stop tracking left & right".
- behaviour: `toggleUnilateral(ri)` flips `row.unilateral` (v6.html:10241-10251). The card then renders a six-column grid `# | UNIT | L | R | RIR | ✓` with separate L (blue) and R (`FAT` colour) cells, each opening the NumPad with labels "Left Reps"/"Right Reps" (v6.html:13212-13300). The LAST line renders `w×L|R` (v6.html:13334-13338).
- v6 status: PARTIAL

### F-TRAIN-118 — Per-row unit override (kg ⇄ lb for one exercise)
- location: Train > Workout Log > exercise card > hold > "Switch to lbs" / "Switch to kg"
- user action: Holds the card, taps the unit item.
- behaviour: `toggleRowUnit(ri)` sets `row.kg = row.kg === null ? !useKg : !row.kg` (v6.html:10252-10262). `rowUsesKg(ri)` resolves `null` to the global `useKg` (v6.html:10707-10714), and the column header shows the row unit (v6.html:12886-12889, 13602-13615).
- v6 status: PARTIAL

### F-TRAIN-119 — Superset (link two exercises A/B)
- location: Train > Workout Log > exercise card > hold > "Make it a superset" / "Remove superset"; the SS card's × button
- user action: Holds a card and taps the superset item. - Behavior (`toggleSuperset`, v6.html:10382-10420): 1. If already in a superset, clears `supersetId` on **every** row sharing that id. 2. Otherwise, if a later exercise row exists, both get a new `supersetId = "ss"+Date.now()`. 3. If it is the last exercise, `supersetPickRi = ri` and the view switches to `add`; picking an exercise inserts the new row directly after with the shared id (v6.html:11390-11410). 4. Rendering: only the first row of the pair renders; it draws a combined A/B header, one header grid, and interleaved `1A`/`1B` rows over `numSets = max(A.sets, B.sets)` (v6.html:12310-12868). 5. "Add Set" adds a set to both rows (v6.html:12824-12831). 6. A separate swipe handler deletes set index `si` from both rows at once (v6.html:12468-12504). 7. A's ✓ shows a half-state (`aHalf`, opacity 0.42) until B is also done; when both are done the pair highlights green and A's checkbox is hidden.
- behaviour: 
- v6 status: PARTIAL

### F-TRAIN-120 — PR detection during a session + ALL-TIME PR banner
- location: Train > Workout Log > full-width orange banner at the top
- user action: Ticks a set with both weight and reps filled in. - Behavior (inside `toggleDone`, v6.html:10761-10808): 1. `wkg = parseFloat(s.w)`; if `storedWeightUnit() === "lb"` it is divided by `LB_PER_KG` (2.20462, v6.html:4359) so PRs are always stored in kg. 2. `allPrs = p.prs[exId] || []`; `allTimeBest` = the heaviest entry regardless of reps; `repBest` = the entry with the same rep count. 3. If no `repBest` or `wkg > repBest.w`: `p.setPrs` re-checks against the live record (documented race fix, v6.html:10775-10778), then replaces the entry for that rep count with `{r, w, date: isoDay()}` and re-sorts by `r` ascending. 4. If it also beats `allTimeBest`: vibrate `[100,50,100]`, set `prMsg = "<name> <r>RM: <weight><unit>"`, cleared after 3500 ms. 5. The banner renders fixed at the top, z-index 200, with a trophy icon, "ALL-TIME PR" and the message (v6.html:11563-11602).
- behaviour: 
- v6 status: PARTIAL

### F-TRAIN-121 — Rest timer — automatic start after a set
- location: Train > Workout Log > pinned rest banner at the top
- user action: None (fires on ticking a set) — or manual via the duration chips.
- behaviour: 1. `startRest(secs, exName)` persists the target, sets `restSec = secs`, stamps `restStartRef`, then flips `restActive` on after a 50 ms tick to force a restart, and schedules a push (v6.html:10645-10655). 2. A 500 ms interval computes `remaining = restTarget - elapsed` from wall time; at ≤0 it clears everything and calls `window.LOCKEDPush.playAlert()` (v6.html:10571-10604). 3. `visibilitychange` re-syncs the countdown on return, ending it if it expired while hidden (v6.html:10605-10632 area, 10656-10683). 4. The banner shows a 52 px SVG ring (`strokeDasharray "138"`, `strokeDashoffset = (1 - restSec/restTarget) * 138`) that turns red at ≤10 s, the remaining seconds, quick chips 60/90/120/180, a "Custom" toggle, and a "Done" button that stops the rest and cancels the push (v6.html:11680-12020). 5. `bannerRef` + a `ResizeObserver` measure the banner and reserve exactly that height with a spacer div (v6.html:10500-10515, 12020-12027). 6. Every change dispatches a `lockedRest` CustomEvent so a mini rest pill can render outside the workout screen (v6.html:10633-10639; consumer at v6.html:57462-57468, 57903-57906).
- v6 status: WORKING

### F-TRAIN-122 — Rest timer settings sheet (on/off + duration presets)
- location: Train > Workout Log > header > Tools (⚡) > "Rest Timer"
- user action: Opens the sheet; toggles Auto Rest on/off; taps a preset (30 s, 60 s, 90 s, 2 m, 3 m, 5 m).
- behaviour: a top-anchored overlay (`slideFromTop 0.32s`) with an Auto-Rest toggle writing `lk_restEnabled` and six duration buttons calling `pickRest(s)` plus a redundant `sd("activeWorkoutRestTarget", s)` (v6.html:11444-11562). Escape closes it (v6.html:10430).
- v6 status: WORKING

### F-TRAIN-123 — Custom rest duration (m + s)
- location: Train > Workout Log > rest banner > "Custom"
- user action: Taps Custom, types minutes and seconds, taps Set (or Cancel).
- behaviour: the two numeric inputs strip non-digits, seconds are clamped to 59, "Set" computes `mins*60 + secs` and calls `pickRest(total)` only when >0 (v6.html:11790-11930). Opening Custom pre-seeds the fields from the current target (v6.html:11994-12002).
- v6 status: WORKING

### F-TRAIN-124 — Hold-to-open exercise action sheet
- location: Train > Workout Log > anywhere on an exercise or superset card
- user action: Press and hold ~420 ms.
- behaviour: 1. `holdStart` ignores the press when wiggle mode or another menu is open, on a non-primary mouse button, and on any `button, input, select, textarea, a, [data-draghandle]` target (v6.html:10300-10310). 2. `setPress` squeezes the card to `scale(0.965)` over 420 ms with a spring `linear()` timing function (feature-detected, bezier fallback) (v6.html:10267-10294). 3. After 420 ms: clears the transform, vibrates 30 ms, opens `ExerciseActionSheet` anchored to the card's rect and the press X, and records `lk_holdTipSeen` (v6.html:10315-10327). 4. Movement >10 px, pointerup, pointercancel or any scroll releases the hold (v6.html:10311-10314, 10331-10334). 5. A "Hold for options" pill renders on the first card until the tip has been seen (v6.html:12996-13010).
- v6 status: WORKING

### F-TRAIN-125 — Drag to reorder exercises ("wiggle mode")
- location: Train > Workout Log > exercise/block card > 3-bar drag handle
- user action: Touch-and-hold the handle 350 ms → all cards collapse to compact jiggling rows → drag → release; tap outside a row to exit.
- behaviour: 1. `onLongPressStart` arms a 350 ms timer, cancelled by >10 px of movement (v6.html:10937-10967). 2. On fire: `wiggleMode = true`, 30 ms vibrate, `beginDrag(ri, wrapperEl, y, true)`. 3. `wrapRow` cross-fades each row between a `compactShell` (jiggle animation, staggered by `ri*137 % 450` ms) and the full card (v6.html:11240-11297). 4. `beginDrag` inserts a collapsing placeholder, fixes the dragged element, and after 560 ms (morph) snapshots all `[data-exrow]` geometry (v6.html:11040-11189). 5. `updateDragTarget` shifts rows and ticks on each index change (v6.html:10968-10995). 6. Edge auto-scroll identical to the split builder (v6.html:11223-11239). 7. `onDragEnd` runs a `SPRING.snap` animation then splices the row into place (v6.html:11190-11209). 8. Touching outside a `[data-exrow]` exits wiggle mode (v6.html:12126-12131).
- v6 status: PARTIAL

### F-TRAIN-126 — Add exercise mid-workout
- location: Train > Workout Log > footer > "+ Add Exercise"
- user action: Taps "+ Add Exercise", picks from `ExLib`.
- behaviour: `view = "add"` (v6.html:13660 area / 13660-13675 button at v6.html:13657-13684) → `ExLib` → on select, either inserts a superset partner (when `supersetPickRi` is set) or appends `mkRow(ex.id)` (v6.html:11308-11416). The footer collapses to zero height in wiggle mode (v6.html:13646-13656).
- v6 status: WORKING

### F-TRAIN-127 — Add a Block (note / timed section) mid-workout
- location: Train > Workout Log > footer > "+ Block" → bottom sheet
- user action: Taps "+ Block", types a title, optionally expands for notes + duration, taps "Add Block".
- behaviour: 1. `blockModal` opens a drag-dismissible bottom sheet (`useSheetDrag`, v6.html:10433-10435; sheet at v6.html:13712-13955). 2. "+ Add notes or duration" reveals the textarea and the duration input (v6.html:13849-13911). 3. "Add Block" rejects an empty title with a toast "Enter a title first", otherwise calls `addBlock` (v6.html:13930-13943). 4. `addBlock` → `mkBlock` creates `{type:"block", id:"blk_<ts>_<rand>", title, notes, duration, expanded:false}` and appends it, with a toast on failure (v6.html:10131-10159). 5. In the log, a block renders as a dashed card with a ⏱ duration chip, a `+/−` expand toggle (expanded shows an editable textarea), and a delete button armed by `lkConfirm("removeBlock"+ri, ...)` (v6.html:12148-12292).
- v6 status: PARTIAL

### F-TRAIN-128 — AI next-set recommendation ("AI Rec")
- location: Train > Workout Log > exercise card > "AI Rec" button beside "+ Add Set"
- user action: Taps "AI Rec".
- behaviour: 1. Re-entrancy guard: returns if `aiRecBusy === ri` (v6.html:13566-13568). 2. Collects sets that are `done && w && r`; with none it toasts "Complete at least one set first" and stops (v6.html:13569-13576). 3. Builds `summary` = `"<w><unit> x <r> RIR<rir>"` joined with commas; finds the first not-done set index; returns if none (v6.html:13577-13584). 4. System prompt: *"You are a strength coach. Reply with ONLY two numbers separated by a comma: recommended weight in `<unit>` and recommended reps for the next set. Example: 85,8. Nothing else."* (v6.html:13585). 5. User message: `"Exercise: <name>. Sets completed: <summary>. Recommend weight and reps for next set."` (v6.html:13586). 6. `aiCall(sys, usr, null, onDone, onFail)`; on success strips everything but digits/commas/dots, splits on `,`, writes part 0 to `w` and part 1 to `r` of the next undone set (v6.html:13588-13598). 7. On failure, toasts "Could not get a recommendation. Check your connection and retry." (v6.html:13599-13603). 8. The button reads "Thinking…" while busy (v6.html:13623).
- v6 status: WORKING

### F-TRAIN-129 — Session header — elapsed time, set count, total volume
- location: Train > Workout Log > sticky header
- user action: None.
- behaviour: `timeStr` = zero-padded `mm:ss` from `sec` (v6.html:10684-10691). `totalSets` counts sets that are `done && setType !== "warmup"` across non-block rows (v6.html:10692-10699). `totalVol` sums `parseFloat(w) * parseInt(r)` over the same set (v6.html:10700-10706), displayed as `Math.round(storedToUnit(totalVol, useKg))` (v6.html:12046-12048).
- v6 status: PARTIAL

### F-TRAIN-130 — Tools menu (⚡): rest timer, plate calculator, global unit switch
- location: Train > Workout Log > header > ⚡ button
- user action: Taps ⚡, then one of three items.
- behaviour: a 170 px dropdown (v6.html:12081-12110) with "Rest Timer" (opens F-TRAIN-122), "Plate Calc" (`showPlateCalc = true` → `PlateCalc`, v6.html:11434-11443, component at v6.html:54925), and "Switch to LBS/KG" calling `p.toggleUnit()` (v6.html:12036-12044 / 12060-12070).
- v6 status: PARTIAL

### F-TRAIN-131 — Discard workout (double-tap confirm)
- location: Train > Workout Log > header > "Discard"
- user action: Taps Discard, then taps it again to confirm.
- behaviour: `lkConfirm("discardWorkout", "Tap Discard again to throw this workout away")` (v6.html:5179, called at v6.html:12111-12118); on the second tap it cancels the rest push and the idle check, then calls `p.onDiscard()`, which clears `lk_activeWorkout`, `lk_activeWorkoutRows`, `lk_activeWorkoutSec`, `lk_activeWorkoutRestTarget` and returns to home (v6.html:57924-57931).
- v6 status: WORKING

### F-TRAIN-132 — Finish workout
- location: Train > Workout Log > header > "Finish"
- user action: Taps Finish.
- behaviour: cancels the rest push and the idle check, then `p.onFinish(rows, sec)` (v6.html:12125-12134) → `finishWorkout` stores `finRows`/`finSec`, persists `lk_activeWorkoutRows` / `lk_activeWorkoutSec`, and routes to the `review` screen (v6.html:57418-57424). Saving happens in the review screen via `saveWorkout` (v6.html:57425-57459).
- v6 status: WORKING

### F-TRAIN-133 — Idle "Still training?" prompt (30 min) + push notification
- location: Train > Workout Log > full-screen modal
- user action: None to trigger; taps "No, continue" or "End & review".
- behaviour: 1. A 5 s interval checks `Date.now() - lastActivityTime > 1800000` (30 min); on trip it clears its own interval and sets `idlePrompt = true` (v6.html:10547-10560). 2. `noteActivity(force)` (called by `setVal` and `toggleDone`) resets `lastActivityTime`, clears the prompt, and re-arms `LOCKEDPush.scheduleIdleCheck(1800, p.name, force)` (v6.html:10621-10626). 3. On mount the check is armed; a `lockedPushOpen` event with `type: "idle-continue"` re-arms it, and a URL containing `endworkout` opens the prompt (v6.html:10608-10620, 10627-10639 area). `?open=endworkout` at cold start also opens it (v6.html:10617). 4. "No, continue" → `noteActivity(true)`. "End & review" → clears the prompt, cancels the rest push and the idle check, and calls `p.onFinish(rows, secRef.current)` (v6.html:11616-11634).
- v6 status: PARTIAL

### F-TRAIN-134 — Exercise info & notes sheet
- location: Train > Workout Log > hold a card > "Info & notes"
- user action: Holds a card, taps "Info & notes".
- behaviour: `setShowExDetail(Object.assign({}, getEx(row.id), row))` — merges the catalogue entry with the live row so the modal has group/equipment/animation as well as the logged sets (v6.html:10288-10292); renders `ExerciseDetailModal` (v6.html:11603-11610; component at v6.html:7202).
- v6 status: WORKING

### F-TRAIN-135 — Empty workout state
- location: Train > Workout Log > body
- user action: 
- behaviour: with `rows.length === 0`, shows "No exercises yet / Tap Add Exercise below" (v6.html:12132-12147).
- v6 status: WORKING

### F-TRAIN-136 — Base-resistance badge (`startResist`)
- location: Train > Workout Log > exercise card subtitle
- user action: 
- behaviour: when the catalogue exercise has `startResist > 0`, the card shows "· +Nkg base" in blue (v6.html:12946-12956). `mkRow` copies `startResist` and `smithNoCB` onto the row (v6.html:10127-10128).
- v6 status: PARTIAL

### F-TRAIN-300 — Train tab shell: header, Cardio + Quick Start, sub-tabs
- location: Train tab > TrainHub main view > header block
- user action: Opens the Train tab; taps "Cardio", "Quick Start", or one of the three sub-tabs (My Splits / History / Library).
- behaviour: 1. Header renders title "TRAIN" (15296–15301). 2. "Cardio" button calls `p.onCardio()` if provided (15311–15316); the app root maps that to `setScreen("cardio")` (57630–57632). 3. "Quick Start" calls `p.onStart({name:"Quick Workout", exIds:[]})` (15338–15343). 4. Sub-tab row is built from `[["splits","My Splits"],["history","History"],["library","Library"]]` (15367). Tapping "library" calls `setView("library")` (full-screen `ExLib`, 15057–15063); the other two call `setTab(t[0])` (15372). 5. Active tab is underlined orange (15382–15384).
- v6 status: WORKING

### F-TRAIN-301 — Recent workouts quick-restart strip
- location: Train tab > My Splits sub-tab > "RECENT" horizontal strip
- user action: Taps a chip naming a recent workout.
- behaviour: 1. Rendered only when `tab === "splits"` and `p.history.length > 0` (15392). 2. Walks `p.history` newest-first, de-duplicating by `w.name`, keeping at most 5 (15393–15401). 3. Each chip shows `w.name` and `w.date` (15437–15452). 4. Tap maps `w.exercises` to `e.id`, drops falsy ids, and calls `p.onStart({name:w.name, exIds:exIds})` (15417–15424).
- v6 status: WORKING

### F-TRAIN-302 — My Splits empty state (Build Manually / AI Split Builder)
- location: Train tab > My Splits > empty state
- user action: Taps "Build Manually" or "AI Split Builder".
- behaviour: 1. Shown when `p.splits.length === 0` (15461). 2. Icon + "No splits yet" + explainer copy (15479–15494). 3. "Build Manually" → `setView("create")` (15507) → renders `SplitBuilder` (15038–15056, component defined outside range). 4. "AI Split Builder" → `setView("aibuilder")` (15525) → renders `AISplitBuilder` (15064–15075).
- v6 status: WORKING

### F-TRAIN-303 — Split card list (expand, day list, Start / Edit / Delete)
- location: Train tab > My Splits > split cards
- user action: Taps the chevron to expand, "Start day" on a day row, or the footer "Start" / "Edit" / "Delete".
- behaviour: 1. Header row: split icon, `split.name`, and `days.length + " days - " + totalEx + " exercises - " + split.created` (15594–15623). `totalEx` = sum of `d.exIds.length` (15551–15553). 2. Chevron toggles `splitsOpen[split.id]` through `toggleSplitOpen` (15624–15626), which persists the whole map to `splitsExpanded` (15015–15021). 3. Expanded body animates via a content-derived `maxHeight` (`sum(78 + max(exIds.length,1)*34) + 40`, ×1.4) plus opacity, and toggles `visibility` so collapsed day buttons leave the tab order (15656–15705). 4. Each day row shows `d.name` and, when `d.exIds.length > 0`, a "Start day" pill calling `p.onStart({name: split.name + " - " + d.name, exIds: d.exIds, blocks: d.blocks || []})` (15740–15745). 5. Days with no exercises render the text "Rest day" (15766–15771). 6. Exercise names are read-only text via `getEx(eid)` showing `ex.name` + `ex.muscle` (15772–15790) — a deliberate change, per the in-code comment at 15767–15770 ("starting one exercise on its own produced a workout that did not correspond to anything in the split"). 7. Footer: "Start" opens the day-picker sheet via `setDayModal(split)` (15797); "Edit" sets `editSplit` and `view="edit"` (15821–15823); "Delete" filters the split out of `p.setSplits` (15845–15850).
- v6 status: WORKING (with the destructive-tap caveat)

### F-TRAIN-304 — Day picker bottom sheet (choose a day to start)
- location: Train tab > My Splits > split card footer "Start" > bottom sheet
- user action: Taps "Start" on a split; picks a day, or "Empty workout"; dismisses by backdrop, X, drag, or Escape.
- behaviour: 1. `setDayModal(split)` opens a portal sheet (15111–15290 via `lkPortal`, 5072). 2. Header shows `dayModal.name` + "Choose a day to start" (15169–15184). 3. Each day row: index badge, `day.name`, `day.exIds.length + " exercises"`; tap closes the sheet and calls `p.onStart({name: dayModal.name + " - " + day.name, exIds: day.exIds, blocks: day.blocks || []})` (15201–15211). 4. Trailing dashed row "Empty workout" closes and calls `p.onStart({name:"Quick Workout", exIds:[]})` (15258–15266). 5. Escape closes it via `useEscape(dayModal ? ... : null)` (15029); drag-to-dismiss via `useSheetDrag` (15030) with a drag handle zone (15150–15165); backdrop tap calls `daySheet.close()` (15132).
- v6 status: WORKING

### F-TRAIN-305 — History list
- location: Train tab > History sub-tab
- user action: Scrolls the list; taps a workout row; from the empty state taps "Start a workout".
- behaviour: 1. Empty state: "No workouts logged yet" plus a "Start a workout" button that calls `setTab("splits")` (15865–15889). 2. Otherwise maps `p.history` in order; each row is `role="button"` with `lkKeyActivate` keyboard support (15890–15896). 3. Row shows `w.name`, `w.date + " - " + w.dur`, a badge from `sessionMetaLine(w,false)` (6927, out of range), a chevron, and `w.vol` in orange (15908–15956). 4. Tap sets `selectedWorkout` (15897) → renders `WorkoutDetail` full-screen (15076–15110).
- v6 status: WORKING

### F-TRAIN-306 — Exercise Library (inline + full-screen)
- location: Train tab > Library sub-tab
- user action: Taps "Library".
- behaviour: 1. The Library tab button routes to `setView("library")` (15372), which renders `ExLib` full-screen with an `onBack` that returns to `main` (15057–15063). 2. A second, inline branch renders `ExLib` inside the tab body when `tab === "library"` (15959–15962) — unreachable through the UI, see F-TRAIN-317.
- v6 status: PARTIAL (the inline branch is effectively dead)

### F-TRAIN-307 — Adaptive Training card (muscle recovery readout)
- location: Train tab > My Splits sub-tab > bottom card
- user action: Passive — read only. No tap targets.
- behaviour: 1. Rendered when `tab === "splits"` and history is non-empty (15963). 2. `computeMuscleRecovery(history, Date.now())` (4892–4975, out of range) returns rows `{muscle, status, lastDays, remainingH}`; returns `null` if empty (14883–14885). 3. Rows are bucketed into `ready` / `recovering` / `heavy` (14887–14895); `soonest` = the non-ready row with the smallest `remainingH` (14896–14900). 4. Suggestion sentence (14901–14909): if anything is ready → "Train X or Y today — fully recovered." plus "Z needs ~Nh more."; else if the soonest is ≤12h → "X is ready in ~Nh — light technique work until then."; else "Everything is still recovering — rest or easy cardio today." 5. Three sections render as colored pills: "READY TO TRAIN" (green), "RECOVERING" (amber = `WA`), "HEAVY RECOVERY" (red); hours are shown only for the latter two (14975). 6. Each pill shows the muscle and `lastDays === 0 ? "today" : lastDays + "d"`, plus `· ~Nh` when `showHours` (14929–14937).
- v6 status: WORKING

### F-TRAIN-308 — AI Split Builder — mode picker
- location: Train tab > My Splits > "AI Builder" (or empty-state "AI Split Builder") > picker screen
- user action: Taps "Chat with AI Coach" or "Import from Photo"; Back returns to the hub.
- behaviour: 1. Default `mode` is `"pick"` (13957); the picker renders two large cards (14196–14345). 2. "Chat with AI Coach" calls `startChat()` (14219) — see F-TRAIN-309. 3. "Import from Photo" sets `mode = "photo"` (14286) — see F-TRAIN-310. 4. Back button calls `p.onBack` (14170) → `setView("main")` (15066).
- v6 status: WORKING

### F-TRAIN-309 — AI Split Builder — conversational chat + program generation
- location: Train tab > AI Split Builder > chat screen
- user action: Answers the coach's questions in the composer and taps Send (or presses Enter); then taps "SAVE SPLIT" or "Start over".
- behaviour: 1. `startChat()` (14018–14049) sets `mode="chat"`, `aiLoading=true`, and posts a first turn `[{role:"user",content:"start"}]` with the conversational system prompt. 2. On success it seeds `histRef` with the user "start" turn and the assistant reply and renders the reply as the first bubble (14026–14038). 3. On failure it falls back to the hardcoded opener "What is your main training goal and how many days a week can you train?" (14039–14048). 4. `send()` (14050–14140): guards on empty input or in-flight request, appends the user bubble, pushes the turn into `histRef`, increments `answerCountRef`. 5. **After 6 user answers** (`answerCountRef.current >= 6`, 14060) it switches to the generation prompt and posts a single `[{role:"user",content:"Generate my split now."}]` turn — regardless of whether the model has finished asking. 6. Otherwise it posts the full `histRef` conversation with the conversational system prompt (14100). 7. Every assistant reply is run through `tryParse` (14007–14016), which looks for `###PROGRAM_START###` / `###PROGRAM_END###` and `JSON.parse`s the slice between them; a successful parse sets `prog`, sets `done=true`, and renders an inline program preview card listing split names (14664–14700). 8. When `done`, the composer is replaced by "SAVE SPLIT" (calls `saveSplits(prog)`) and "Start over" (clears msgs/hist/answerCount and re-runs `startChat`) (14738–14800). 9. `saveSplits` (14153–14195): if every returned split has ≤1 day AND there are ≥2 splits, it collapses them into ONE split whose days are those entries (14158–14172); otherwise each entry becomes its own split (14173–14188). Ids are `"s" + Date.now()` (+ `i*997` in the multi case), `created` is `toLocaleDateString()`. Result is handed to `p.onSave`, which concatenates onto `splits` (15068–15072). 10. Typing indicator: three pulsing dots while `aiLoading` (14701–14737). Auto-scroll to bottom on new messages (13969–13971) and 150 ms after composer focus (14813–14817).
- v6 status: WORKING

### F-TRAIN-310 — AI Split Builder — Import from Photo / describe your split
- location: Train tab > AI Split Builder > "Import from Photo"
- user action: Taps the dashed uploader to pick an image, and/or types a description; taps "Convert to LOCKED"; then "SAVE SPLIT" or "Try again".
- behaviour: 1. `handlePhoto` (14141–14152) reads the chosen file with `FileReader.readAsDataURL` into `imgData` and clears any previous result. 2. The preview shows the data URL with an X button that clears it (14382–14418). 3. A textarea captures `photoNote` with a long PPL placeholder (14471–14500). 4. "Convert to LOCKED" is disabled until an image or note exists, and shows "Converting..." while `photoLoading` (14506–14520). 5. `analyzePhoto` (14153 region, precisely 14167→ see 14153; declared 14153? — declared at line 14153 is `saveSplits`; `analyzePhoto` is 14167–14152? Correct cite: `analyzePhoto` 14153 is wrong) — **`analyzePhoto` is defined at 14153–14166** in source order immediately after `handlePhoto`: it builds a one-shot system prompt containing `photoNote` (or the literal "a training split") and posts `[{role:"user",content:"Convert it now."}]`, then `tryParse`s the reply into `photoResult`. 6. On success a "CONVERTED" card lists `photoResult.name` and each split with an exercise count (14520–14580). 7. "SAVE SPLIT" calls `saveSplits(photoResult)` (14582); "Try again" clears `photoResult` (14600).
- v6 status: **BROKEN** (feature does not do what it says)

### F-TRAIN-311 — Post-workout Review — Summary step
- location: Review screen (`screen === "review"`, replaces the tab bar) > step "summary"
- user action: Reads the summary, types a quick note, then taps "HOW DID IT FEEL?" or "Save without reflection".
- behaviour: 1. `totalSets` counts done, non-warmup sets across non-block rows (15986–15992); `totalVol` sums `w * r` over the same set (15993–16001); `dur = floor(sec/60)` (16002); `dispVol = round(storedToUnit(totalVol, useKg))` (16003). 2. Header shows a green "WORKOUT COMPLETE" badge, the workout name, today's date, and three stat tiles (Sets / Volume / Duration) (16135–16200). 3. Per-row cards: `type === "block"` rows render as a dashed 📝 note card with title/notes/duration (16205–16250); exercise rows with ≥1 done set render name, set count and per-exercise volume in display units (16251–16310); rows with 0 done sets are skipped (16253). 4. "Quick note" textarea binds `note` (16311–16348). 5. "HOW DID IT FEEL?" → `setStep("reflect")` (16350). 6. "Save without reflection" → `save()` directly (16370), skipping ratings and AI.
- v6 status: WORKING

### F-TRAIN-312 — Post-workout Review — Reflection step (5 ratings)
- location: Review > step "reflect"
- user action: Taps one of 5 buttons on each of 5 rating rows; then "GET AI COACH INSIGHT" or "Skip and save".
- behaviour: 1. Five fields with 5 labelled levels each (16091–16110): Energy (Awful/Low/Ok/High/Peak), Pump (None/Mild/Good/Great/Insane), Strength Feel (Weak/Below avg/Normal/Strong/Best ever), Sleep Last Night (`<4h`/5h/6h/7h/8h+), Stress Level (None/Low/Medium/High/Max). 2. Header: "SESSION REFLECTION" / "How did it go?" / "10 seconds. Your AI coach uses this." (16385–16412). 3. Tapping a level calls `setRating(key, i+1)` (16006–16012, 16452). 4. "GET AI COACH INSIGHT" → `submitReflection()` (16480) — F-TRAIN-313. 5. "Skip and save" → `save()` (16497), preserving whatever ratings were already set.
- v6 status: WORKING

### F-TRAIN-313 — Post-workout Review — AI Coach insight step
- location: Review > step "ai"
- user action: Arrives automatically from "GET AI COACH INSIGHT"; reads the insight; taps "SAVE WORKOUT" or "Discard".
- behaviour: 1. `submitReflection` (16091–16133) sets `step="ai"` and `aiLoading=true`, then assembles an exercise summary and a heavily-personalized system prompt — see "## AI calls" #3. 2. `aiCall(sys, usr, null, onDone, onFail)` (16132) posts to the Worker with auth headers and gating (2663–2696). 3. On success `aiText` is set and the loading dots (16560–16576) are replaced by the insight paragraph (16577–16584). 4. On failure `aiText` falls back to the constant "Solid session. Keep the consistency and focus on quality sleep tonight." (16134). 5. Below the insight: a `ThrowbackCard` when `tbData` is non-null (16585–16589) — F-TRAIN-314. 6. A 2-column grid replays the five ratings as `N/5 - label`, or `--` when unrated (16590–16614). 7. "SAVE WORKOUT" → `save()` (16615). 8. "Discard" is a two-tap arm: first tap sets `discardArmed` and relabels to "Tap again to throw this workout away"; second tap calls `p.onDiscard()` (16497–16600 region; precisely the button at 16601–16617 and the arming logic in its handler). When armed, a "Keep it" button appears that clears the arm. 9. `p.onDiscard` (57596–57604) nulls the workout and clears `activeWorkout`, `activeWorkoutRows`, `activeWorkoutSec`, `activeWorkoutRestTarget`, then returns to home.
- v6 status: WORKING

### F-TRAIN-314 — Post-workout Throwback card (1-in-5)
- location: Review > step "ai" > below the insight card
- user action: Passive; may dismiss.
- behaviour: 1. Decided once, in the `useState` initializer (15971–15976): if `throwbackForced()` is false and `Math.random() >= 0.2` → `null`; otherwise `computeThrowback()`. 2. When non-null, `ThrowbackCard` renders with `data`, `useKg`, and an `onDismiss` that calls `dismissThrowback()` and clears `tbData` (16585–16589). 3. `dismissThrowback` writes `throwbackDismissed` as an ISO timestamp (4662); `computeThrowback` suppresses itself for 3 days after a dismissal unless forced (4607–4611).
- v6 status: WORKING

### F-TRAIN-315 — Save workout (Review → history record)
- location: Review > any step > save buttons
- user action: Taps "Save without reflection", "Skip and save", or "SAVE WORKOUT".
- behaviour: 1. `savingRef` guards against a double-tap filing the session twice (16011–16016; in-code comment at 16009–16010). 2. Builds `exercises` from non-block rows with at least one done set: `{id, name, muscle, sets:[{w,r,rir,done:true}]}`, conditionally carrying `setType` (only when not "normal"), `rL`, `rR`, `partials` (16017–16050). 3. Builds `blocks` from block rows: `{title, notes, duration}` (16051–16062). 4. Calls `p.onSave` with `{id:"w_"+Date.now(), name, sets:totalSets, vol:dispVol+" "+unit, dur:dur+" min", date:toLocaleDateString(), dateISO:isoDay(), reflection:ratings, note, exercises, blocks: blocks.length?blocks:null, aiInsight: aiText||null}` (16063–16090).
- v6 status: WORKING

### F-TRAIN-316 — Workout detail — read view
- location: Train tab > History > tap a workout
- user action: Reads; taps Back, Edit, Convert, or Delete.
- behaviour: 1. Header: back arrow, `w.name`, and `w.date + " - " + w.dur + " - " + sessionMetaLine(w,true)`, appending " (edited)" when `w.editedAt` exists (17505–17530). 2. Action row (right of the header): "Edit" and "Convert" render only when `w.exercises && w.exercises.length > 0` (17531, 17595); "Delete" always renders (17620–17636). 3. Body sections, each in a card: NOTE (`w.note`, 17640–17663), HOW YOU FELT (the 5 reflection scores as `N/5`, skipping zeros, 17664–17708), EXERCISES (per set: `w unit x reps`, `|`-joined for unilateral `rL|rR`, `+NP` partials badge, `RIR n`, and a green check when `done`; falls back to `sessionMetaLine` for cardio or `"N sets logged - vol total volume"` when there is no `exercises` array, 17709–17790), NOTES from `w.blocks` (17791–17832), AI COACH INSIGHT from `w.aiInsight` (17833–17855). 4. Delete is guarded by `lkConfirm("delWorkout" + (w.id || w.dateISO + w.name), "Tap Delete again to remove this workout for good.")` (17624) — a 7-second armed second tap that toasts on the first tap (5179–5191). 5. Delete then calls `p.onDelete` → TrainHub filters history by `sameWorkout` (15093–15102, `sameWorkout` at 5213).
- v6 status: WORKING

### F-TRAIN-317 — Workout detail — edit mode
- location: Workout detail > "Edit"
- user action: Renames the workout, edits the note, edits/adds/removes sets, removes exercises, taps SAVE (or Back to abandon).
- behaviour: 1. "Edit" sets `editing` and re-seeds `eName`/`eNote`/`eExercises` from the workout (17531–17570) — note this second seeding omits `partials` (17563), unlike the initial `useState` seeding at 17092–17109 which includes it. 2. Editor header: back arrow (`setEditing(false)`, discards changes), "EDITING", and an orange SAVE button (17197–17240). 3. WORKOUT NAME input (17250–17270) and NOTE textarea (17271–17300). 4. Per-exercise card: name + a trash button calling `removeExercise(ei)` (17310–17350). 5. Per-set grid `#, KG/LB, REPS, RIR, x`: weight uses `DraftNum` with `kgToDisp`/`dispToKg` conversion on commit (17380–17400); reps use `DraftNum` with `decimal:false` (17401–17420); RIR is a `<select>` of `-- / 0 / 1 / 2 / 3 / 4 / 5+` (17421–17455); the x button calls `removeExSet(ei,si)` (17456–17475). 6. "Add Set" appends `{w:"", r:"", rir:"2"}` (17476–17488, `addExSet` 17124–17137). 7. `saveEdit` (17155–17194) keeps only sets with a weight or reps, recomputes `totalSets` and `totalVol`, drops exercises left with no sets, and produces `Object.assign({}, w, {name, note, exercises, sets, vol, editedAt: new Date().toISOString()})`; then calls `p.onEdit` and exits edit mode. 8. `p.onEdit` in TrainHub maps history through `sameWorkout` and also refreshes `selectedWorkout` (15082–15092). 9. Empty editor shows "No exercises. This workout will be empty." (17481–17489).
- v6 status: PARTIAL

### F-TRAIN-318 — Convert workout to split
- location: Workout detail > "Convert" > bottom sheet
- user action: Chooses "Create New Split" or "Add to Existing Split", names the split/day, taps CREATE or ADD DAY.
- behaviour: 1. `showConvert` renders `ConvertToSplitModal` in a portal (17843–17856, modal at 16622–17083). 2. Mode picker sheet: title "CONVERT TO SPLIT", explainer, "➕ Create New Split", "➕ Add to Existing Split" (only when `splits.length > 0`), and Cancel (16671–16795). 3. "new" screen: SPLIT NAME input (required), DAY NAME input (optional, defaults to "Day 1"), a line stating "This workout (N exercises) will be added as the first day", Back + CREATE (CREATE disabled until the name is non-empty) (16796–16930). 4. "existing" screen: a radio-style list of splits showing `N day(s)`, a DAY NAME input (optional, auto-numbered), Back + ADD DAY (disabled until a split is selected) (16931–17082). 5. `convertToNewSplit` (16636–16652): maps `w.exercises` through `resolveExId` and filters falsy, then builds `{id:"s"+Date.now(), name, days:[{name, exIds, blocks:[]}], created}` and calls `p.onConvert`. 6. `convertToExistingSplit` (16653–16670): finds the split, resolves ids the same way, appends `{name: dayName || "Day "+(days.length+1), exIds, blocks:[]}`. 7. `p.onConvert` closes the modal and forwards to `p.onConvertToSplit` (17849–17854), which in TrainHub upserts the split by id and clears `selectedWorkout` (15103–15110).
- v6 status: PARTIAL

### F-TRAIN-319 — Proactive Tip card ("💡 TODAY'S INSIGHT")
- location: Home tab (rendered by the dashboard's `insight` block, 26595–26597) — component defined in this range
- user action: Passive; may tap × to dismiss for the session.
- behaviour: 1. On mount, reads `proactiveTip` from storage; if its `date` matches today's `isoDay()`, the cached text is used and no request is made (17859–17862). 2. Otherwise a `useEffect` (17864–17952, deps `[]`) builds a plain-text context string from: `profile.displayName`, `profile.goal`, the last workout's name + set count and total workout count, today's `fuelLog` entry (summed calories and protein across breakfast/lunch/dinner/snacks, or "No food logged today."), `fuelProfile.tdee` + `macroProtein`, and this week's grocery spend vs `getBudgetData().weeklyTarget` (17866–17903). 3. Posts to the Worker — see "## AI calls" #4 — with an `AbortController` whose `abort()` is the effect cleanup (17904, 17949–17951). 4. On a non-empty reply, sets `tip` and caches `{text, date: todayISO}` under `proactiveTip` (17936–17944). 5. Renders an orange-tinted card: "💡 TODAY'S INSIGHT" plus either the italic placeholder "Analysing your data..." while loading, or the tip (17954–18000 region: header 17963–17975, dismiss button 17976–17997, body 17998-ish → precisely 17954–17997). 6. × sets `dismissed`, which returns `null` for the rest of the mount (17888? — precisely: `dismissed` set at 17979, early return at 17953).
- v6 status: WORKING (with the gating gap)

### F-TRAIN-320 — Dynamic Feed ("YOUR FEED" cards)
- location: Home tab (rendered by the dashboard's `feed` block, 26623–26627) — component defined in this range
- user action: Taps a card (check-in, comeback, next-split) to navigate; the rest are read-only.
- behaviour: 1. Derives: `todayFb` = today's entry in the `feedback` log (18004–18010); `lastW` = `history[0]` (18011); `daysSinceLast` from `lastW.dateISO` (default 999) (18012–18018); `trainedToday` (18019–18025); `consec` = consecutive training days walking back up to 10 days (18026–18042); `nextSplitDay` (18043–18058). 2. Card selection (18059–18085): no check-in today → `checkin`; else if today's feedback has sleep or soreness → `recovery`. Then `consec >= 4` → `rest`, else `daysSinceLast >= 3 && !trainedToday` → `comeback`. Then `nextSplitDay && !trainedToday` → `nextsplit`. Returns `null` when no cards qualify (18085). 3. `checkin` card: 📋 icon, "Check in today" / "Log your sleep, recovery and mood"; whole card `onClick` → `go("coach")` (18106–18160). 4. `recovery` card: "TODAY'S READINESS" with up to three emoji tiles (Sleep `["","😫","😕","😴","💤","⭐"]`, Recovery `["","🔥","😣","😐","💪","✨"]`, Mood `["","😞","😕","😐","😊","🔥"]`), each colour-coded green/red/amber by score, plus a verdict line: good → "Well rested and feeling fresh — push hard today."; bad → "Take it steady — your body is asking for recovery."; else "Feeling okay — train smart today." (18161–18265). 5. `rest` card: 😴, "N days straight" / "Rest is training too — muscles grow during recovery." — non-interactive (18266–18320). 6. `comeback` card: fire icon, "You rested yesterday" (1 day) or "N days since your last session" / "Ready to get back at it?"; `onClick` → `go("train")` (18321–18390). 7. `nextsplit` card: train icon, "Up next: {day.name}" / "N exercises planned" or "Your next scheduled session"; `onClick` → `go("train")` (18391–18440).
- v6 status: PARTIAL

### F-TRAIN-500 — Progress hub tab bar (Overview / Goals / Calendar / Photos / PR Vault)
- location: Progress tab > PROGRESS screen > pill tab row
- user action: taps one of five pills; taps back arrow to return home
- behaviour: 1. `useHubState("progressTab","overview",[...])` restores the last tab from `lk_ui_progressTab` (28324, 2121–2139). 2. A restored value not in the allow-list falls back to "overview" (2126–2128). 3. Tapping a pill calls `setTab`, which writes `lk_ui_progressTab` (2132–2136). 4. `tab === "prs"` short-circuits the whole render and returns `<PRHub>` instead (28438–28452). 5. Back arrow calls `p.go("home")` (28565).
- v6 status: WORKING - Evidence: 28324, 28438

### F-TRAIN-501 — Throwback card (1-in-4 roll on Progress load)
- location: Progress > Overview > top card
- user action: passive; taps dismiss
- behaviour: 1. On mount, if `throwbackForced()` is false and `Math.random() >= 0.25`, state is `null` (28325–28330). 2. Otherwise `computeThrowback()` (4606) supplies the comparison. 3. Renders `ThrowbackCard` (4664) only on the overview tab (28645–28649). 4. Dismiss calls `dismissThrowback()` → writes `lk_throwbackDismissed` (4662) and clears local state.
- v6 status: WORKING - Evidence: 28325–28330 roll is done once in the useState initializer, per the in-code comment about not burning the budget on hub-persisted tabs

### F-TRAIN-502 — Featured Lifts — Day 1 vs Current PR cards
- location: Progress > Overview > "FEATURED LIFTS"
- user action: views cards; taps X to unpin
- behaviour: 1. `featuredIds` seeded from `lk_featuredLifts` (28331–28333). 2. Per id: `getFirstLogged(eid)` walks `history` **backwards** to find the earliest session containing that exercise and returns the heaviest set of it (28349–28368). 3. `getCurrentPR(eid)` reduces `prs[eid]` to the max `w` (28369–28376). 4. Both are converted with `liftDisp(..., useKg)` (28677–28678) and `gain = round((prW-firstW)*10)/10` (28679). 5. Card shows DAY 1 tile (grey, with the first date), a chevron, and CURRENT PR tile coloured green when `gain > 0` else orange, plus a `+gain unit` line (28749–28831). 6. X button filters the id out and persists via `setFeaturedIds` → `sd("featuredLifts", n)` (28342–28348, 28712–28720).
- v6 status: PARTIAL

### F-TRAIN-503 — Add Featured Lift search screen
- location: Progress > Overview > "ADD LIFT" button > full-screen picker
- user action: taps ADD LIFT, types in search, taps a result
- behaviour: 1. `setShowAddLift(true)` (28839–28841) swaps the whole page for the picker (28448–28556). 2. `available` = `ALL_EX` minus already-featured, filtered case-insensitively by name, **capped at 20** (28449–28454). 3. Tapping a row appends the id, closes the picker, clears the search (28503–28511). 4. Back arrow closes and clears search (28470–28474).
- v6 status: WORKING - Evidence: 28449–28454

### F-TRAIN-504 — Body weight trend chart (SVG line, last 30 entries)
- location: Progress > Overview > "BODY WEIGHT"
- user action: passive
- behaviour: 1. `weightLog = ld("weightLog", [])` (28339); `graphData = weightLog.slice(-30)` (28430). 2. min/max/range computed over `.kg` (28431–28437); `graphRange = max(range,1)`. 3. Header shows "Last N entries" and the latest value via `toDisp` (bodyweight-only kg→lb ×2.20462, 28378–28382, 28866–28883). 4. `<svg height=120 viewBox="0 0 max(N*12,100) 120">` with one `<polyline>` and one `<circle>` per point; `x = i*(vw-20)/(N-1)+10`, `y = 110 - (kg-min)/range*100` (28884–28903). 5. First and last entry `date` strings shown under the chart (28904–28921).
- v6 status: PARTIAL

### F-TRAIN-505 — Training calendar (month grid with per-day dots)
- location: Progress > Calendar
- user action: taps ‹ / › to change month; hovers a day for its tooltip
- behaviour: 1. `calM`/`calY` initialised to the current month/year (28383–28385); arrows wrap year boundaries (28945–28956, 28965–28978). 2. `calKey(day)` builds `YYYY-MM-DD` from the local calendar (28389–28391). 3. Four date maps built each render: `weighInDates` from `weightLog` via `dayOf(e.date)` (28399–28403); `prDates` from every PR via `prDay(pr)`, storing `{ex, w, r}` (28404–28417); `photoDates` from `lk_progressPhotos` (28418–28422); `workoutDates` from `history` via `dayOf(w.dateISO || w.date)` storing workout names (28425–28429). 4. Grid: 7 header letters, `firstDay` blank cells, then `daysInM` cells (28986–29012). 5. A trained day is filled (`OR_H+"26"` bg, orange bold text); any other day with data gets CARD bg; today gets a 1.5px accent border (29018–29046). 6. Up to three dots per day: blue weigh-in, amber PR, green photo (29050–29082). 7. `title` attribute concatenates workout names · "N PRs" · "weighed in" · "photo" (29013–29018). 8. Legend row: Trained / Weigh-in / PR / Photo (29083–29157).
- v6 status: WORKING - Evidence: 28404–28417 + 4541 — `prDay` handles the legacy literal `"Today"` by returning null rather than mis-dating

### F-TRAIN-506 — Goals tab passthrough
- location: Progress > Goals
- user action: 
- behaviour: renders `GoalsTab` with `useKg`, `prs`, `history`, `profile` (28934–28939).
- v6 status: WORKING (passthrough only) - Evidence: 28934–28939

### F-TRAIN-507 — Photos tab passthrough
- location: Progress > Photos
- user action: 
- behaviour: renders `ProgressPhotos` with `splits`, `setSplits`, `history`, `useKg` (29158–29163).
- v6 status: WORKING (passthrough only) - Evidence: 29158–29163

### F-TRAIN-508 — PR Vault list (search, compound-first sort, three-number tiles)
- location: Progress > PR Vault (PRHub `tab === "prs"`)
- user action: types in the search box; taps an exercise row
- behaviour: 1. `withPRs` = `ALL_EX` entries with a non-empty `p.prs[e.id]` (29183–29185). 2. Search input filters by lowercase substring of `ex.name` (30037–30040). 3. Sort: `compoundRank(name)` first (deadlift, squat, bench, leg press, overhead press, row, pull/chin-up, hip thrust, clean/snatch, dip — 4515–4536), then alphabetical (30041–30047). 4. Each row: trophy icon, name, muscle, chevron, then three tiles from `prSummary(exPrs)`: `1RM`, `6-8 REP`, `EST. 1RM`, each dimmed to 0.45 opacity and showing `—` when unset (30110–30146). 5. Tapping a row sets `sel = ex.id` and opens the detail screen (30053–30055).
- v6 status: WORKING - Evidence: 29183, 30041–30047

### F-TRAIN-509 — PR detail — three summary cards (1RM / Working / Estimated)
- location: PR Vault > exercise detail (top)
- user action: 
- behaviour: 1. `sel !== null` renders the detail screen; missing exercise returns `null` (29403–29408). 2. `prSummary(exPrs)` returns `{oneRM, working, est, estFrom}` (4492–4511). 3. Three rows built at 29456–29481: "1 REP MAX" (badge `1`, orange, note = `prLabel(oneRM)`), "WORKING WEIGHT" (badge `6-8`, note = `prLabel + reps`), "ESTIMATED 1RM" (badge `≈`, blue, note = "from Wkg × R"). 4. Unset rows render at 0.5 opacity with `—` and an explanatory note (29484–29520).
- v6 status: WORKING - Evidence: 29456–29481

### F-TRAIN-510 — Est-1RM progression chart with 30D / 90D / ALL range filter
- location: PR Vault > exercise detail > "PROGRESSION — EST. 1RM"
- user action: taps 30D, 90D or ALL
- behaviour: 1. `e1rmSeries(sel, p.history, p.prs)` (29531; impl 4569–4600) mines the best non-warmup set per lifting session plus dated PR entries, max per day, sorted by ISO date, each point `{date, e1, isPr}`. 2. `series.length < 2` → empty card "Log more sessions with this exercise…" (29535–29539). 3. Range: `cutoffDays = prRange === "all" ? null : parseInt(prRange)`; cutoff = `Date.now() - days*86400000` sliced to `YYYY-MM-DD`; series filtered by `pt.date >= cutoff` (29540–29542). 4. Filtered `< 2` points → "Not enough data in this range." (29543–29547). 5. Otherwise SVG polyline, `vw = max(N*14,120)`, `y = 110 - (e1-min)/range*100`; PR points draw radius 4 in solid orange, session points radius 2.5 in `OR_H+"88"` (29548–29575). 6. Header shows "N sessions" and the latest est-1RM; footer shows first/last ISO date (29553–29578). 7. Range buttons `[["30","30D"],["90","90D"],["all","ALL"]]` set `prRange` (29583–29593).
- v6 status: PARTIAL — likely BROKEN for lb users

### F-TRAIN-511 — Strength profile bar chart (est. 1RM per rep record)
- location: PR Vault > exercise detail > "STRENGTH PROFILE — EST. 1RM"
- user action: 
- behaviour: 1. Rendered only when `exPrs.length >= 2` (29595). 2. `ests = exPrs.map(pr => ({r, est: round(pr.w*(1+pr.r/30)*10)/10}))` (29596–29601). 3. `maxEst`; if not `> 0` the card returns null — guard added for bodyweight lifts logged at 0 kg (29602–29609). 4. Bar width `bW = max(4, min(36, floor((300-20)/n) - 6))` — the clamp exists because past ~40 records the width went negative (comment 29606–29608). 5. SVG 300×98: one `<rect rx=4>` per record, value text above, `NRM` label below (29629–29676).
- v6 status: PARTIAL

### F-TRAIN-512 — Log a PR without a workout (manual PR entry)
- location: PR Vault > "LOG A PR WITHOUT A WORKOUT" button, or detail > "Log New PR"
- user action: picks exercise from a `<select>`, taps a rep chip, types a weight, taps SAVE PR
- behaviour: 1. `setLogging(true)` swaps in the full-screen form (30000–30020; from detail: 29679–29683 which also pre-selects `logEx = sel`). 2. Exercise `<select>` lists every `ALL_EX` entry; default `logEx = "107"` (29179, 29273–29296). 3. Rep chips: `[1,2,3,4,5,6,8,10,12]`, label `1RM` or `NRM` (29310–29332). 4. Weight `<input type=number step=0.01 inputMode=decimal>` (29334–29358). 5. Live preview card once both are set: "Est. 1RM" = `fmtQ(w*(1+r/30))` and "Logged as W unit × R" (29359–29392). 6. `doLog()` (29186–29218): parses; if `!r || !w` → toast "Enter both a weight and a rep count." and abort; if an existing record at the same rep count is `>= w` → toast "Not a PR — your best at R reps is still X unit."; otherwise `p.setPrs` replaces the record for that rep count and re-sorts ascending by `r`, stamping `date: isoDay()`. 7. On success: closes the sheet, sets `sel = eid` (jumping to that exercise's detail), clears the inputs.
- v6 status: WORKING - Evidence: 29186–29218 — validation + guarded `setPrs` updater that re-checks the existing record inside the reducer

### F-TRAIN-513 — PR Vault header / back navigation
- location: PR Vault header
- user action: 
- behaviour: when `p.onBack` is supplied the header is a back arrow + "PR VAULT" (29722–29744); otherwise it renders "PROGRESS" plus a two-tab underline bar (Overview | PR Vault) (29745–29779). `ProgressPage` always passes `onBack` and `defaultTab: "prs"` (28438–28452).
- v6 status: PARTIAL — the standalone header branch is unreachable from ProgressPage - Evidence: 28438–28452 always supplies `onBack`, so 29745–29779 never renders

### F-TRAIN-514 — PRHub "Overview" tab — stats grid, Last 7 Days, Top PRs (DEAD)
- location: PRHub `tab === "overview"` (29780–29966) - Behavior (were it reachable): 1. `last7` / `last4w` filter `history` by `dateISO` within 7 / 28 days (29691–29703). 2. 2×2 stat grid: Total Workouts, This Week, Last 4 Weeks, PRs Logged (29782–29840). 3. "Last 7 Days" list of session cards (name, `w.date - w.dur - sessionMetaLine(w,false)`, `w.vol`) or "No workouts in the last 7 days" (29841–29900). 4. "Top PRs": `Object.keys(prs).slice(0, 5)` → best record by weight per exercise, trophy card showing `kgToDisp(best.w)` and `best.r + "RM"` (29903–29966).
- user action: 
- behaviour: 
- v6 status: DEAD
