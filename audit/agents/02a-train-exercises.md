# Agent 2a — Train: Exercise Library & Exercise Surfaces

Audited file: `redesign/input/locked-current-v6.html` (58,015 lines). Exclusive range **4664–8781**.
All line cites below are into that file unless stated. Read-only audit; nothing was modified.

Range composition (surprising, worth stating up front): only ~1,100 of the 4,118 lines are exercise-library UI.
Lines **5452–7046** are an almost entirely non-UI **cardio constants + calorie-engine** block, and lines
**4664–5450** are shared primitives (overlay/portal/scroll-lock/dialog/escape helpers, recovery model, icons).
The library UI proper is `ExerciseNotes` (7118), `ExerciseDetailModal` (7202), `ExerciseActionSheet` (7496),
`ExLib` (7761) + inner `ExBtn` (7798), and `ReplacePanel` (8625).

---

## PART A — Features

### F-TRAIN-001 Exercise Library — muscle-group grid (root screen)
- Location: Train tab > Exercise Library > root screen
- User action: Opens the library (Train > Library tab, or via "add exercise" flows), taps a muscle-group card.
- Behavior:
  1. Renders header "Exercise Library" with an optional back button (only when `p.onBack` is passed) (8506–8535).
  2. Renders a search field bound to state `q` (8536–8570).
  3. Renders "SELECT MUSCLE GROUP" and a 2-column grid, one card per entry in the global `GROUPS` table (8548–8613).
  4. Each card shows a `D.train` glyph tinted `g.col + "22"`, the group name via `readableAccent(g.col)`, and a
     count computed as `g.subs.reduce((a,s)=>a+s.ex.length,0)` (8600–8612).
  5. Tapping sets `grp = g.id`, which re-renders into the sub-group screen (F-TRAIN-002) (8582–8584).
  6. Cards animate in with `fadeUp .3s` staggered by `i * .04` (8592).
- Components: `ExLib` (7761–8624)
- Functions: `readableAccent` (4318, outside range)
- State: local `grp`, `sub`, `q`, `showCreate`, `selectedDetail` (7762–7780)
- Storage: none directly on this screen
- Network: none
- AI: none
- Edge cases: The per-group count uses `s.ex.length` **only**, so user-created custom exercises are NOT counted
  on the root grid (8608–8611), while the sub-group screen counts them via `mergedSub` (8412). Counts therefore
  disagree between the two screens.
- Gating: always on
- Status: WORKING
- Evidence for status: 8548–8613 renders unconditionally from the in-file `GROUPS` constant; no async dependency.
- Notes: Group count inconsistency above. `GROUPS` is a hardcoded literal at 2975 (outside range).

### F-TRAIN-002 Muscle-group screen — sub-group (muscle part) list
- Location: Train tab > Exercise Library > <Group>
- User action: Taps a muscle group, then a muscle-part row.
- Behavior:
  1. Resolves `ag = GROUPS.find(g => g.id === grp)` (8299–8301).
  2. Header shows a gradient of `ag.col + "20"`, a back button ("All Muscles") that clears `grp`, and the group
     name uppercased in `readableAccent(ag.col)` (8376–8410).
  3. For each `ag.subs` entry renders a row: a square badge with `mergedSub(ag, s).length` + "ex", the sub name,
     and a preview line of the first two exercise names `s.ex.slice(0,2)...join(", ")` (8412–8493).
  4. Tapping a row sets `sub = s.id` → F-TRAIN-003 (8417–8419).
  5. Rows animate `fadeUp .3s` staggered `i * .05` (8434).
- Components: `ExLib` (7761–8624)
- Functions: `mergedSub` (7776–7797)
- State: `grp`, `sub`
- Storage: none (customs arrive as the `p.customs` prop)
- Network: none
- AI: none
- Edge cases: Preview line uses `s.ex` not `mergedSub`, so a sub-group whose only entries are customs shows a
  count > 0 with an empty preview string (8478–8481).
- Gating: always on
- Status: WORKING
- Evidence for status: 8375–8494 is a pure render off `GROUPS` + props.
- Notes: none.

### F-TRAIN-003 Exercise list for a muscle part
- Location: Train tab > Exercise Library > <Group> > <Muscle part>
- User action: Taps a muscle part; sees the exercise list; taps an exercise.
- Behavior:
  1. `as = ag.subs.find(s => s.id === sub)`; `muscle = as.name === "All" ? ag.name : as.name` (8302–8306).
  2. `exList = mergedSub(ag, as)` merges the catalogue list with any `p.customs` whose `group`/`muscle` match and
     whose id is not already present (7776–7797).
  3. Header: back chevron to the group screen, part name in `readableAccent(ag.col)`, and `exList.length + " exercises"` (8312–8349).
  4. Each entry is normalised into a **full exercise record** — `{id, name, eq, gifUrl, group, muscle, col, gid,
     sid, custom, apiId, imageUrl}` — before being handed to `ExBtn` (8353–8371). This is the only place `apiId`
     and `imageUrl` are read.
  5. Tapping a row sets `selectedDetail` → F-TRAIN-006.
- Components: `ExLib` (7761–8624), `ExBtn` (7798–7854)
- Functions: `mergedSub` (7776–7797)
- State: `grp`, `sub`, `selectedDetail`
- Storage: none
- Network: none
- AI: none
- Edge cases: Custom entries pushed by `mergedSub` carry only `{id,name,eq,custom,startResist,smithNoCB}`
  (7788–7794); the normaliser then supplies `gifUrl: null`, so a custom exercise always shows the "No animation
  available" panel in the detail sheet.
- Gating: always on
- Status: WORKING
- Evidence for status: 8305–8373 renders synchronously from in-memory data.
- Notes: `mergedSub` drops the custom exercise's `col`, so custom rows inherit the group colour — which is
  correct here but means `custom` records are not round-tripped identically.

### F-TRAIN-004 Exercise row button (`ExBtn`)
- Location: any exercise list inside the library (search results and part lists)
- User action: Taps the row.
- Behavior:
  1. Renders a card: colour-tinted 34×34 icon chip (`D.train`), name, and a meta line
     `ex.eq || ex.equipment` + `" · CUSTOM"` if `ex.custom` + `" · +Nkg base"` if `ex.startResist > 0` (7798–7854).
  2. `onClick` → `setSelectedDetail(ex)` (7802–7804).
- Components: `ExBtn` (7798–7854) — declared **inside** `ExLib`'s body
- Functions: `Ic` (5234)
- State: writes `selectedDetail`
- Storage: none
- Network: none
- AI: none
- Edge cases: none reachable; row always renders.
- Gating: always on
- Status: WORKING
- Evidence for status: 7798–7854; direct handler.
- Notes: **Performance bug** — `ExBtn` is a new function identity on every `ExLib` render (7798), so React
  unmounts/remounts every row on each keystroke in search. Also reads `ex.equipment` as a fallback for `ex.eq`
  (7833), a field name that appears nowhere in `GROUPS`/`ALL_EX` (4258–4275) — dead compatibility shim.

### F-TRAIN-005 Exercise search
- Location: Train tab > Exercise Library > search field (root screen), and the dedicated Search Results screen
- User action: Types into "Search all exercises…".
- Behavior:
  1. Typing sets `q`. The search screen activates only when `q.length > 1` (8191).
  2. `res = ALL_EX.filter(e => e.name.toLowerCase().indexOf(q.toLowerCase()) >= 0)` (8192–8196).
  3. Customs not already in `res` and matching the query are appended (8197–8206).
  4. Renders a "Search Results" header with a back button that clears `q`, plus a second, `autoFocus` search
     input and a "Clear" button (8207–8287).
  5. Results render as `ExBtn` rows; empty result shows the centred text "No results" (8288–8303).
- Components: `ExLib` (7761–8624), `ExBtn`
- Functions: none beyond the inline filters
- State: `q`, `selectedDetail`
- Storage: none (`ALL_EX` is built once at load, 4258–4289, and includes `lk_customEx` from localStorage)
- Network: none
- AI: none
- Edge cases: 1-character queries do nothing (8191). Substring match only — no fuzzy match, no equipment or
  muscle matching. Search is unbounded (no `.slice`), so a query like "a" returns hundreds of rows.
- Gating: always on
- Status: WORKING
- Evidence for status: 8191–8304 renders a filtered list synchronously.
- Notes: The root screen's input and the results screen's input are two separate elements bound to the same
  state, so focus is lost and re-acquired at the 2-character boundary (`autoFocus`, 8258).

### F-TRAIN-006 Exercise detail sheet
- Location: Train tab > Exercise Library > any exercise row; also the live workout log screen (11644)
- User action: Taps an exercise row, or opens detail from a logging row.
- Behavior:
  1. `ExLib` sets `selectedDetail` and short-circuits its whole render to `ExerciseDetailModal` (7855–7866).
  2. On mount / whenever `ex.id` changes, `formVid` is set to `undefined` (loading) and
     `ytSearchVideo(ex.name, ex.id)` is called; the result sets `formVid` to a videoId or `null` (7205–7214).
     An `alive` flag guards the late resolve.
  3. The sheet is portalled via `lkPortal` into `#lk-overlay-root` (7216, 5072), which scroll-locks the page
     through a MutationObserver (5033–5059).
  4. Layout: bottom sheet, `maxHeight: 92dvh`, `maxWidth: 420`, drag handle wired to `useSheetDrag` (7204),
     scrim tap closes (7231–7239), title = `ex.name`, 44×44 close button (7281–7297).
  5. **Animation panel** — if `ex.gifUrl`, an `<img>` with `aspectRatio: 1`, `loading="lazy"`,
     `decoding="async"`, and `onError` that hides the element (7305–7328). Otherwise a "No animation available"
     placeholder card (7329–7343).
  6. **My Notes** — `ExerciseNotes` with `key: "notes_" + ex.id` (7343–7346) → F-TRAIN-007.
  7. **Watch form** — three states: `undefined` → "Finding a form video…" (7347–7353); `null` → "No form video
     found for this exercise." (7354–7358); a videoId → a tappable card with the YouTube thumbnail
     `https://i.ytimg.com/vi/<id>/hqdefault.jpg`, a play triangle, the label "WATCH FORM" and
     `ytCreatorFor(ex.id) + " · opens YouTube"` (7359–7390).
  8. Tapping the video card fires `logBetaActivity("form_video_opened", {exercise: ex.name})` then
     `window.open("https://www.youtube.com/watch?v=" + formVid, "_blank")` (7359–7363).
  9. **Facts grid** — MUSCLE GROUP (`ex.group || "Unknown"`), MUSCLE PART (`ex.muscle || "General"`), and a
     full-width EQUIPMENT tile (`ex.eq || "Bodyweight"`) in accent colour (7391–7449).
  10. **Footer** — "ADD TO WORKOUT" (rendered only when `p.onAddToWorkout` is supplied) and "BACK" (7450–7494).
      From `ExLib` the add handler calls `p.onSelect(selectedDetail)` then clears `selectedDetail` (7858–7864).
- Components: `ExerciseDetailModal` (7202–7495), `ExerciseNotes` (7118–7201), `Ic` (5234)
- Functions: `useEscape` (5160), `useSheetDrag` (2150, outside range), `lkPortal` (5072), `ytSearchVideo` (7066),
  `ytCreatorFor` (7063), `logBetaActivity` (2772, outside range)
- State: local `formVid` (`undefined` | `null` | string); `edSheet` drag state
- Storage: reads/writes `yt3_<exercise name>` in localStorage (raw key, no `lk_` prefix) via `ytSearchVideo` (7067–7070, 7082)
- Network: `POST {WORKER_API}/yt-search`, body `{name, exId}`, response `{videoId}` (7071–7086)
- AI: none directly (the worker may use an API; not visible in this file)
- Edge cases: Loading state shown while the fetch is in flight; fetch failure is swallowed and returns `null`
  → "No form video found" (7086–7088), so **offline is indistinguishable from genuinely-no-video**. Negative
  results are never cached, so every open of a video-less exercise re-hits the worker. GIF failures hide the
  image and leave an empty tinted box rather than falling back to the placeholder (7311).
- Gating: always on
- Status: WORKING
- Evidence for status: 7202–7495 full render path; network path is guarded and degrades to a message.
- Notes: `ExLib` renders the detail sheet *instead of* the list (`return` at 7855), not on top of it, so the
  library screen behind is unmounted — losing scroll position when the sheet closes. The dedicated
  `ExerciseActionSheet`-style dismiss animation is not used here; close is via `edSheet.close()`.

### F-TRAIN-007 Per-exercise personal notes (autosaving)
- Location: Train tab > Exercise Library > exercise detail sheet > "MY NOTES"
- User action: Types cues/setup numbers into the textarea.
- Behavior:
  1. Initial value seeded lazily from `getExNote(exId)` (7120–7122).
  2. On each keystroke: `setText`, `setSaved(false)`, reset a 600 ms debounce timer; on fire,
     `saveExNote(exId, v)` and `setSaved(true)` (7136–7145).
  3. On blur: cancel the timer, save immediately, mark saved (7176–7181).
  4. On unmount: cancel the timer and flush `latestRef.current` so closing the sheet mid-sentence still saves
     (7128–7134).
  5. Header shows "MY NOTES" plus a status chip reading "Saved" (green) or "Saves automatically" (7146–7175).
  6. `saveExNote` deletes the key entirely when the text is empty/whitespace, otherwise stores
     `{text, updated: ISO}` (7107–7117).
- Components: `ExerciseNotes` (7118–7201)
- Functions: `loadExNotes` (7098–7101), `getExNote` (7102–7106), `saveExNote` (7107–7117)
- State: local `text`, `saved`; refs `timerRef`, `latestRef`
- Storage: reads/writes `lk_exNotes` (a single object keyed by `String(exId)`) via `ld`/`sd` (7098–7117)
- Network: none directly — `sd` is the app-wide persist path and the comment at 7094–7097 claims the object is
  synced across devices (sync itself lives outside this range)
- AI: none
- Edge cases: `loadExNotes` type-guards against arrays/non-objects and returns `{}` (7099–7100). `exId`
  `undefined`/`null` short-circuits both read and write (7103, 7108). `sd` failure (quota) is surfaced by a
  global toast, but `ExerciseNotes` still displays "Saved" — a **false-success state** (7107–7117 vs. 2435+).
- Gating: always on
- Status: WORKING
- Evidence for status: 7118–7201; three independent save paths (debounce, blur, unmount).
- Notes: All notes live in one localStorage value, so a large note set is rewritten on every keystroke-debounce.

### F-TRAIN-008 Create Custom Exercise
- Location: Train tab > Exercise Library > root > "Create Custom Exercise"
- User action: Taps the dashed "Create Custom Exercise" button, fills the form, taps "CREATE EXERCISE".
- Behavior:
  1. Button sets `showCreate = true` (8614–8623); `ExLib` returns the form instead of the library (7867).
  2. Header: back button that resets `cName/cGrp/cSub/cStartResist/cSmithNoCB` (7884–7911). Note it does **not**
     reset `cEq`.
  3. **EXERCISE NAME** — free text `cName`, border turns accent when non-empty (7921–7950).
  4. **MUSCLE GROUP** — 2-column grid of `GROUPS`, each with a colour dot; selecting sets `cGrp` and clears
     `cSub` (7951–8014).
  5. **MUSCLE PART** — pill row of `cgObj.subs`, only rendered once a group is chosen (8015–8055).
  6. **EQUIPMENT** — hardcoded pill list: Barbell, Dumbbell, Cable, Machine, Plate Loaded, Smith Machine,
     Bodyweight, Band, Other. Selecting clears `cStartResist` (8056–8096).
  7. **STARTING RESISTANCE** — shown only for `cEq === "Plate Loaded"`; numeric input with `step 0.01`, helper
     copy, unit label "kg / lb", plus a live line "Logged weight will show total including N base resistance."
     (8097–8145).
  8. **SMITH MACHINE BAR** — shown only for `cEq === "Smith Machine"`; a single toggle "Counterbalance active
     (7kg / 15lb bar)" writing `cSmithNoCB`, with explanatory copy for each state (8146–8175).
  9. **CREATE EXERCISE** — disabled until name+group+part are set. On submit it derives
     `muscle = csObj && csObj.name !== "All" ? csObj.name : cgObj.name`, allocates the first unused id starting
     at 90000 by scanning `ALL_EX` (8149–8156), builds
     `{id, name, eq, group, muscle, col, gid, sid, custom:true, startResist, smithNoCB}` (8147–8168), calls
     `p.onCustom(newEx)` and `p.onSelect(newEx)`, then resets the form and exits (8169–8188).
- Components: `ExLib` (7761–8624)
- Functions: inline id allocator (8149–8156)
- State: `showCreate`, `cName`, `cGrp`, `cSub`, `cEq`, `cStartResist`, `cSmithNoCB`
- Storage: none written here — persistence is the caller's `onCustom` (customs are read at load from
  `lk_customEx`, 4278)
- Network: none
- AI: none
- Edge cases: Submit is a no-op if name/group/part missing (8147). No duplicate-name check. The "kg / lb" label
  means the base resistance is stored **unit-less** — a value entered in lb is later treated as whatever the
  display unit is (8138). `p.onSelect` is called alongside `p.onCustom`, so creating an exercise from the plain
  Library tab (15958, 15056 — no `onSelect` passed) is fine, but from a picker it both saves and adds it.
- Gating: always on
- Status: WORKING
- Evidence for status: 7867–8190 full form; the id-collision comment at 8149 documents a fix already applied.
- Notes: Hardcoded equipment list duplicated from nothing else in the file. Back button not resetting `cEq`
  (7889–7896) is a minor state leak.

### F-TRAIN-009 Exercise action sheet (press-and-hold on a logging card)
- Location: Train tab > active workout log > press-and-hold an exercise card (invoked at 11649)
- User action: Long-presses an exercise card during a workout; a blurred overlay lifts the card out and shows
  action pills; taps one.
- Behavior:
  1. Caller passes `{rect, title, subtitle, items, onClose, onSelect}` where `items` come from `actionItems(ri)`
     and each item carries `{id, label, icon, color?, destructive?, run}` (11649–11659).
  2. Sheet is portalled (`lkPortal`, 7551) into `#lk-overlay-root`; scroll is explicitly locked/unlocked in a
     mount-once effect (7530–7537).
  3. `React.useLayoutEffect` positions the bubble at `p.rect.top`, clamped to `[16, viewportHeight - height - 16]`
     so it stays where the finger was (7511–7519).
  4. Backdrop: `rgba(0,0,0,0.42)` with `backdrop-filter: blur(14px) saturate(140%)`, class `lk-veil` (7554–7568).
  5. A full-bleed dismiss `<button>` with `transform: none` inline to defeat the global `button:active
     { transform: scale(0.97) }` edge-loss bug (7569–7583).
  6. The held card is redrawn above the blur with `title` and optional `subtitle`, `transformOrigin` set from
     the press X within the card (`originX`, 7545–7548), class `lk-pop` (7598–7616).
  7. Action pills render below, each with an `Ic` glyph, `readableAccent(col)` text, staggered
     `animationDelay 0.02 + i*0.03s`, class `lk-rise` (7617–7649).
  8. Destructive items **arm in place**: first tap sets `armedId` and relabels to "Tap again to <label>";
     second tap dismisses and runs (7624–7628, 7648).
  9. `dismiss(then)` guards re-entry with `closingRef`, sets `closing` (swapping every class to `lk-out`), and
     after 170 ms runs the action then `p.onClose()` (7521–7529).
  10. Escape closes via `useEscape(dismiss)` (7498).
- Components: `ExerciseActionSheet` (7496–7651)
- Functions: `dismiss` (7521–7529), `lkPortal` (5072), `lkDialogRef` (5125), `useEscape` (5160),
  `lkLockScroll`/`lkUnlockScroll` (5011, 5017), `readableAccent` (4318)
- State: local `top`, `closing`, `armedId`; refs `boxRef`, `closeTimer`, `closingRef`
- Storage: none
- Network: none
- AI: none
- Edge cases: `top === null` on the first paint renders the bubble at `-9999` with `visibility: hidden` to avoid
  a flash (7590–7596). Falls back to `top: 80` when no `rect` is given (7515). If the item list is taller than
  the viewport the container is `overflowY: auto` (7566).
- Gating: always on (only reachable during an active workout)
- Status: WORKING
- Evidence for status: 7496–7651; caller at 11649 supplies real items and `onSelect: it => it.run()`.
- Notes: `armedId` never auto-disarms (unlike the global `lkConfirm` 7-second timer at 5179–5197) — two different
  confirm idioms coexist in this range.

### F-TRAIN-010 Replace / swap exercise panel
- Location: Train tab > active workout > Swap action (rendered at 11418)
- User action: Chooses "Swap" on an exercise, then picks a replacement or searches.
- Behavior:
  1. With `q.length <= 1`, shows up to 6 alternatives filtered by `e.muscle === ex.muscle && e.id !== ex.id`
     under the heading "SAME MUSCLE" (8629–8633, 8712–8717).
  2. With `q.length > 1`, shows up to 8 name-substring matches excluding the current exercise, under
     "SEARCH RESULTS" (8629–8631).
  3. Header shows "Replace Exercise" and "Replacing: <name>" in accent, plus a back button calling `p.onClose`
     (8636–8686).
  4. An `autoFocus` search field bound to `q` (8687–8711).
  5. Each row shows the colour chip, name, `e.eq`, and a "Swap" affordance; tapping calls `p.onSelect(e)`
     (8718–8772).
  6. Empty list renders "No results" (8773–8780).
- Components: `ReplacePanel` (8625–8781)
- Functions: none beyond inline filters
- State: local `q`
- Storage: none
- Network: none
- AI: none
- Edge cases: `if (!ex) return null` (8627–8628). Searches `ALL_EX` only, so a **custom exercise can never be
  chosen as a replacement** (8629–8633) — customs are only in `ALL_EX` if they were in `lk_customEx` at page
  load (4278–4288), which they are, so this is actually partly covered; but customs created in this session and
  not yet reloaded are missing.
- Gating: always on
- Status: WORKING
- Evidence for status: 8625–8781 renders synchronously; caller at 11418.
- Notes: Hardcoded caps of 6 and 8 results with no "show more".

### F-TRAIN-011 Throwback card (progress flashback)
- Location: Home / Progress surfaces (rendered at 16536, 26605, 28645) — component body lives in this range
- User action: Views the card; taps ✕ to dismiss.
- Behavior:
  1. Returns `null` when `p.data` is absent (4665–4666).
  2. Header "THROWBACK — <label>" in accent, plus a ✕ dismiss button calling `p.onDismiss`, `aria-label`
     "Dismiss throwback" (4671–4680).
  3. For each `d.items[i]`, renders the label (`"Body weight"` for `kind === "weight"`, else `it.name`) and a
     `then → now` line, with a ▲/▼ delta rounded to one decimal (4681–4694).
  4. Values pass through `liftDisp(v, useKg)`; unit string is `kg`/`lbs` from `p.useKg !== false` (4667–4670).
  5. Optional THEN/NOW progress-photo pair rendered side by side from `d.photoPair.then/.now.thumb` (4695–4708).
  6. Footer copy: "Proof it's working. Keep going." (4709–4711).
- Components: `ThrowbackCard` (4664–4713)
- Functions: `disp` (4669), `liftDisp` (outside range)
- State: none (fully controlled by props)
- Storage: none directly
- Network: none
- AI: none
- Edge cases: No data → `null`. Direction arrow is computed as `down = it.kind === "weight" && it.deltaKg < 0`,
  so a **strength item that went down still shows ▲** (4686). The delta text recomputes from displayed values
  rather than using `it.deltaKg` (4694).
- Gating: always on when the caller supplies `tbData`
- Status: PARTIAL
- Evidence for status: 4686 — the ▼ arrow is unreachable for `kind !== "weight"` items, so a regressed lift is
  rendered as an increase.
- Notes: `GR` (green) is used for the delta regardless of direction (4692).

### F-TRAIN-012 Decimal-safe number input (`DraftNum`)
- Location: shared primitive — used in set logging (17392, 17412) and recipe ingredients (20465)
- User action: Types a weight/rep/quantity.
- Behavior:
  1. Holds raw keystrokes in local `draft` while focused; falls back to `String(p.value)` otherwise (5086–5087).
  2. Rejects any keystroke not matching `/^[0-9]*[.,]?[0-9]*$/` — no minus, no exponent (5094–5096).
  3. Rejects separators entirely when `p.decimal === false`, and switches `inputMode` to `numeric` (5090, 5097).
  4. Calls `p.onType(raw)` on each accepted keystroke (5100).
  5. On blur: normalises `,` → `.`, clears the draft, and calls `p.onCommit(raw)` with `""` for empty or a bare
     "." (5102–5107).
  6. Enter blurs the field (5109); `enterKeyHint: "done"`, autocomplete/autocorrect off (5091–5093).
- Components: `DraftNum` (5085–5110)
- Functions: none
- State: local `draft`
- Storage: none
- Network: none
- AI: none
- Edge cases: Empty commit is `""` not `0`. Pasting an invalid string is silently dropped whole.
- Gating: always on
- Status: WORKING
- Evidence for status: 5085–5110; the header comment (5078–5084) documents the "62.5 → 625" bug this fixes.
- Notes: none.

### F-TRAIN-013 Icon primitive (`Ic`) and glyph table (`D`)
- Location: shared primitive, used everywhere in this range and app-wide
- User action: n/a (render-only)
- Behavior:
  1. Renders a 24×24-viewBox `<svg>` sized by `p.z` (default 20), stroke `p.c` (default `TX`), width `p.w`
     (default 1.8), round caps/joins (5234–5246).
  2. `p.d` may be a string (one `<path>`) or an array (many, keyed by index) (5247–5254).
  3. Accessibility: `aria-label` from `p.a`; `role` is `"img"` when labelled and `"presentation"` otherwise
     (5244–5245).
  4. `D` (5281–5331) is the glyph table: 50 named paths covering navigation (home/train/fuel/prog/profile),
     chrome (back/plus/check/x/search/chev/edit/trash), stats (trophy/fire/star/bolt/scale), and a dedicated
     cardio set (run, bike, dumbbell, rower, elliptical, stairs, climb, swim, rope, mountain, ball) added
     because "every machine used to fall back to the dumbbell" (5318–5319).
- Components: `Ic` (5234–5254), `IcMemo` (5255)
- Functions: none
- State: none
- Storage: none
- Network: none
- AI: none
- Edge cases: A missing `p.d` renders `<path d={undefined}>` — an invisible but valid node.
- Gating: always on
- Status: WORKING (but see notes)
- Evidence for status: 5234–5254 renders unconditionally; used at 7383, 7818, 7838, 8342, etc.
- Notes: **`IcMemo` (5255) is DEAD** — grep across all 58,015 lines finds exactly one occurrence, its own
  definition. The memoisation was never adopted; every `Ic` re-renders.

### F-TRAIN-014 Loading spinner primitive
- Location: shared primitive
- User action: n/a
- Behavior: Renders a centred 8px accent dot with `animation: pulse 1.4s infinite` and the text "Loading…"
  (5256–5279).
- Components: `LoadingSpinner` (5256–5279), `LoadingMemo` (5280)
- Functions: none
- State/Storage/Network/AI: none
- Edge cases: none
- Gating: always on
- Status: DEAD
- Evidence for status: grep for `LoadingSpinner` and `LoadingMemo` across the whole file returns only the two
  definition lines (5256, 5280) — neither is ever rendered.
- Notes: The exercise detail sheet rolls its own "Finding a form video…" text (7351–7353) rather than using this.

### F-TRAIN-015 Form-video lookup and cache
- Location: backing service for F-TRAIN-006
- User action: Indirect — opening an exercise detail sheet triggers it.
- Behavior:
  1. `ytSearchVideo(name, exId)`: builds `cacheKey = "yt3_" + name`; a cache hit resolves immediately
     (7067–7070).
  2. Otherwise `POST {WORKER_API}/yt-search` with `{name, exId}` and `Content-Type: application/json`
     (7071–7079).
  3. Reads `d.videoId`; on success writes it to `localStorage[cacheKey]` and resolves it, otherwise resolves
     `null` (7080–7085).
  4. Any network/parse error resolves `null` (7086–7088).
  5. `ytCreatorFor(exId)` picks a creator name by `exId % 4` from the hardcoded `YT_CREATORS`
     `["Jeff Nippard", "TNF", "Cbum", "Jacob Oestreicher"]` (7062–7065).
- Components: consumed by `ExerciseDetailModal`
- Functions: `ytSearchVideo` (7066–7088), `ytCreatorFor` (7063–7065)
- State: none
- Storage: writes/reads `yt3_<name>` **raw** localStorage keys (no `lk_` prefix, bypassing `ld`/`sd`) (7067, 7082)
- Network: `POST https://lockedapi.cescocugliari.workers.dev/yt-search` → `{videoId}`
- AI: none visible client-side
- Edge cases: Cache is keyed by name only, so two exercises with the same name collide; the cache never expires
  and negative results are never cached. Because the key bypasses `sd`, it also bypasses the quota-warning path
  (2435+) and any device sync.
- Gating: always on
- Status: WORKING
- Evidence for status: 7066–7088; consumed at 7213 and rendered at 7359–7390.
- Notes: The comment at 7061 says the creator list "Mirrors the creator rotation in worker.js /yt-search — keep
  in sync", i.e. **duplicated constant across two codebases with no enforcement**. The displayed creator is
  therefore a guess, not the actual video's channel — a correctness risk visible to users (7386).

### F-TRAIN-016 ExerciseDB detail fetch (`ascendFetchDetail`)
- Location: n/a — no UI
- User action: none
- Behavior: `GET {WORKER_API}/exercise-detail/<encodeURIComponent(exerciseId)>` and returns `r.json()`
  (7089–7093).
- Components: none
- Functions: `ascendFetchDetail` (7089–7093)
- State/Storage/AI: none
- Network: `GET https://lockedapi.cescocugliari.workers.dev/exercise-detail/{id}`
- Edge cases: No `.catch`, so a rejection would be unhandled — but there is no call site.
- Gating: n/a
- Status: DEAD
- Evidence for status: grep across all 58,015 lines finds `ascendFetchDetail` only at its definition (7089).
- Notes: Almost certainly the intended source of instructions/secondary muscles for the detail sheet. The
  normaliser at 8353–8371 already carries `apiId` through, which is the field this would key on — the wiring
  was never finished.

### F-TRAIN-017 Per-exercise equipment configuration (storage layer)
- Location: backing storage for the plate calculator / bar setup (UI outside this range)
- User action: Indirect.
- Behavior: `getExEquip(exId)` reads `lk_exequip_<exId>` defaulting to
  `{bar:"oly", machine:false, baseKg:0, baseLb:0, plateInv:null, smithOffset:0}` (7047–7056);
  `setExEquip(exId, data)` writes it (7057–7059).
- Components: none in range
- Functions: `getExEquip` (7047–7056), `setExEquip` (7057–7059)
- State: none
- Storage: reads/writes `lk_exequip_<exerciseId>` — **one localStorage key per exercise**
- Network/AI: none
- Edge cases: A partial stored object is returned as-is (no merge with the default), so a record written by an
  older build missing `plateInv` returns `undefined` for it (7048).
- Gating: always on
- Status: WORKING
- Evidence for status: 7047–7059; plain `ld`/`sd` wrappers.
- Notes: Unbounded key growth (one key per exercise ever configured) against a shared localStorage quota.

### F-TRAIN-018 Plate / barbell maths (`BARS`, `calcPlatesPerSide`)
- Location: backing maths for the plate calculator (UI outside range)
- User action: Indirect.
- Behavior:
  1. `BARS` (5332–5368): Olympic 20 kg/45 lb, Women's 15/35, EZ Curl 10/25, Trap 25/55, Smith 7/15, No Bar 0/0,
     each with `offset: 0`.
  2. `PLATES_KG = [25,20,15,10,5,2.5,1.25,0.5]`, `PLATES_LB = [45,35,25,15,10,5,2.5]` (5369–5370).
  3. `getBar(id)` linear-scans, defaulting to the Olympic bar (5371–5374).
  4. `calcPlatesPerSide(target, bar, unit, inv)` subtracts bar weight + offset, halves, then greedily fills from
     the largest available plate (custom inventory `inv` sorted descending if given), returning
     `{plates, perSide, achievable, remainder}` (5375–5402).
- Components: none in range
- Functions: `getBar` (5371), `calcPlatesPerSide` (5375)
- State/Storage/Network/AI: none
- Edge cases: `perSide <= 0` returns an empty plate list with `achievable: target === barW` (5379–5385). Greedy
  fill is optimal for these plate sets but not in general for a custom `inv`.
- Gating: always on
- Status: WORKING
- Evidence for status: 5371–5402, pure functions with explicit return contracts.
- Notes: Every bar's `offset` is hardcoded `0`, so the Smith-machine counterbalance the create-exercise form
  talks about (8146–8175) is handled by a *different* mechanism (`smithNoCB` on the exercise record), not here.

### F-TRAIN-019 Muscle recovery model & volume summary (data layer for Train surfaces)
- Location: backing model for recovery/physique surfaces (UI outside range)
- User action: Indirect.
- Behavior:
  1. `muscleVolumeSummary(history)` — 6-week window, lifting sessions only, non-warm-up sets, expanded through
     `getInvolvement` and averaged per week (4715–4740).
  2. `getInvolvement(name, group)` — primary muscle at weight 1.0, plus synergists at 0.5 and tertiary at 0.25
     from the regex table `MUSCLE_SYNERGY` (4772–4816, 4817–4844). Only the **first** matching rule applies
     (`break`, 4842).
  3. `resolveSavedEx(savedEx)` — id lookup via `getEx`, then a name lookup via `exByName`, else `null` (4845–4856).
  4. `computeMuscleRecovery(history, now)` — walks up to 40 sessions within 14 days, weights each set by
     `rirIntensity` (RIR 0→1.0 … 4+→0.4, 4883–4891), scales `BASE_RECOVERY_H` (Quads 66h … Forearms 24h,
     4869–4882) by `0.5 + load/6` clamped to [0.5, 1.5], and classifies each muscle `ready` / `recovering` /
     `heavy`, sorted ready-first (4892–4990).
  5. `workoutNameGroups(name)` (4857–4868) is the fallback when no exercise in a session resolves — keyword
     matching on the workout name assigns a flat load of 3.0 per group (4952–4956).
- Components: none in range
- Functions: `muscleVolumeSummary` (4715), `getEx` (4747), `exByName` (4763), `getInvolvement` (4817),
  `resolveSavedEx` (4845), `workoutNameGroups` (4857), `rirIntensity` (4883), `computeMuscleRecovery` (4892)
- State: module-level memo `EX_NAME_INDEX` (4762), built lazily on first `exByName` call
- Storage: none (history passed in)
- Network/AI: none
- Edge cases: `getEx` returns a synthetic `{name:"Unknown", group:"", …}` record rather than `null` (4751–4760),
  and callers test `ex.name !== "Unknown"` (4849) — a **name-string sentinel**, so a real exercise literally
  named "Unknown" would be discarded.
- Gating: always on
- Status: WORKING
- Evidence for status: 4715–4990, deterministic pure functions.
- Notes: `EX_NAME_INDEX` is built once and never invalidated (4762–4771), so a custom exercise created after the
  first name lookup is invisible to `exByName` until reload. `MUSCLE_SYNERGY` rules 6 and 7 both match `/press/`
  and are disambiguated only by `grp` (4794–4802).

### F-TRAIN-020 Overlay / portal / scroll-lock infrastructure
- Location: shared primitive underlying every sheet in this range
- User action: Indirect — opening any sheet.
- Behavior:
  1. `lkPortal(children, opts)` portals into `#lk-overlay-root` (scroll-locking) or, with `{lock:false}`, into
     `#lk-sheet-root` (not locking) — used by the number pad, which sits over live content (5061–5084).
  2. `lkOverlayRoot()` lazily creates the host on `<body>` and attaches a `MutationObserver` that calls
     `lkLockScroll`/`lkUnlockScroll` whenever the host goes from empty to non-empty (5033–5060).
  3. `lkLockScroll`/`lkUnlockScroll` are reference-counted, remember `.lk-scroll`'s `scrollTop`, and toggle the
     `lk-locked` class on `<html>`, restoring position on unlock (5011–5031).
  4. `lkScroller`/`lkScrollTop`/`lkScrollBy`/`lkScrollToTop` route all scrolling through `.lk-scroll` with a
     `window` fallback (4992–5010).
  5. Falls back to rendering children in place if `ReactDOM.createPortal` is missing or throws (5073–5083).
- Components: none
- Functions: `lkScroller` (4992), `lkScrollTop` (4999), `lkScrollBy` (5003), `lkScrollToTop` (5007),
  `lkLockScroll` (5011), `lkUnlockScroll` (5017), `lkOverlayRoot` (5033), `lkSheetRoot` (5061), `lkPortal` (5072)
- State: module globals `_lkScrollLocks`, `_lkScrollY` (4991), `_lkOverlayRoot` (5032), `_lkSheetRoot` (5060)
- Storage/Network/AI: none
- Edge cases: `isConnected` re-check handles a host removed from the DOM (5034, 5062). `lkUnlockScroll` no-ops
  at zero count (5018).
- Gating: always on
- Status: WORKING
- Evidence for status: 4992–5084 with the containing-block rationale documented at 5020–5032; consumed at
  7216 and 7551.
- Notes: `ExerciseActionSheet` **also** calls `lkLockScroll` explicitly (7531) on top of the observer's lock —
  harmless only because the counter is reference-counted.

### F-TRAIN-021 Dialog focus trap, Escape stack, and two-tap confirm
- Location: shared primitives for every dialog in this range
- User action: Presses Tab / Shift-Tab / Escape inside a sheet; taps a destructive control twice.
- Behavior:
  1. `lkTrapTab(e)` collects visible focusables (`offsetParent !== null`) and wraps focus at both ends
     (5113–5124).
  2. `lkDialogRef(node)` is a **callback ref**, not a mount effect, so focus management fires when the dialog
     mounts rather than when its parent does; it pushes the previously focused element onto `_lkDialogStack`,
     attaches `lkTrapTab`, focuses the node, and restores focus on unmount (5112, 5125–5140).
  3. A single global capture-phase `keydown` listener, guarded by `window.__lkEscBound`, walks `_lkEscStack`
     from the top, skipping entries whose ref is `null`, and fires the first live handler (5142–5158).
  4. `useEscape(onClose)` registers one stack entry per mount and reads the handler fresh through a ref
     (5160–5177).
  5. `lkConfirm(key, message)` arms on the first call (toasting `message` as an error) and returns `true` only
     on a second call within 7 seconds (5179–5197).
  6. `lkKeyActivate(e)` maps Enter/Space to `.click()` for `role="button"` wrappers (5227–5233).
- Components: none
- Functions: `lkTrapTab` (5113), `lkDialogRef` (5125), `useEscape` (5160), `lkConfirm` (5179),
  `lkKeyActivate` (5227)
- State: module globals `_lkDialogStack` (5112), `_lkEscStack` (5145), `_lkArm` (5179)
- Storage/Network/AI: none
- Edge cases: Escape stack skips `null` handlers so a component that registers once and passes `null` while
  closed does not swallow the key (5149–5152). `lkConfirm` depends on `window.LOCKED.toast` existing and
  degrades silently if it does not (5195).
- Gating: always on
- Status: WORKING
- Evidence for status: 5112–5233; `useEscape` consumed at 7203 and 7498.
- Notes: `lkKeyActivate` (5227) and `lkTrapTab` are used from outside this range only.

### F-TRAIN-022 Workout identity helpers (`withWorkoutIds`, `sameWorkout`)
- Location: data layer for history edit/delete
- User action: Indirect.
- Behavior:
  1. `withWorkoutIds(list)` stamps `id = "wl_" + (dateISO||date||"x") + "_" + i` onto any id-less entry and
     persists the whole list back to `lk_history` if anything changed (5199–5212).
  2. `sameWorkout(a,b)` prefers id equality, else compares a `[date,name,dur,sets,vol]` key — but **refuses to
     match** when both `sets` and `vol` are undefined (i.e. cardio), so two identical runs on one day are not
     conflated (5213–5226).
- Components: none
- Functions: `withWorkoutIds` (5199), `sameWorkout` (5213)
- Storage: writes `lk_history` (5209)
- Network/AI: none
- Edge cases: The id is **index-derived**, so reordering or deleting an earlier entry re-keys every later
  id-less entry (5205–5207) — safe only because the ids are written back on first read.
- Gating: always on
- Status: WORKING
- Evidence for status: 5199–5226 with the rationale documented at 5188–5198.
- Notes: The write at 5209 is inside a bare `try{}catch(e){}`, so a quota failure means the ids are re-derived
  every load.

### F-TRAIN-023 Cardio activity catalogue and field schema (constants only)
- Location: data layer for the Cardio logging surfaces (UI outside this range)
- User action: Indirect.
- Behavior:
  1. `CARDIO_SCHEMA = 2` (5461). Records live in `lk_history` alongside strength work; everything is stored in
     metres and seconds so the mi/km toggle never touches disk (5452–5460).
  2. `CARDIO_GROUPS` = Machines / Indoor / Outdoor / Sport (5467).
  3. `CARDIO_FIELDS` (5469–5485) maps 14 field-set names (tread, curved, bike, spin, ellip, stair, erg, climb,
     outrun, ruck, outbike, swim, rounds, plain) to the metric list the form should ask for.
  4. `CARDIO_ACTIVITIES` (5486–5533) — **41 activities**: 17 Machines, 6 Indoor, 13 Outdoor, 6 Sport (the "Sport"
     count includes `sport_other`). Each is `{id, name, group, icon, machine?, fields, legacy?}`.
  5. `CARDIO_MACHINES` (5572–5589) — 15 machine categories. `CARDIO_BRANDS` (5590–5617) — 26 brands with model
     lists (Technogym, Life Fitness, Precor, Matrix, Cybex, StairMaster, Woodway, Concept2, Peloton,
     NordicTrack/iFIT, Sole, Bowflex, Assault, Rogue, Hydrow, Echelon, TrueForm, Star Trac, Nautilus, Schwinn,
     WaterRower, Keiser, Stages, Wattbike, Other).
  6. `CARDIO_TYPES` (5403–5451) is the **v1** eight-entry table (run, walk, bike, stair, row, ellip, hiit, swim)
     with `met` and `trackDist` — still consumed by `estimateCardioCalories` (7015–7046).
  7. Lookup helpers: `cardioActivity` (5534), `cardioFieldsFor` (5540), `cardioHasField` (5568),
     `cardioModalityForLegacy` (5554), `cardioLegacyForModality` (5561).
- Components: none in range
- Functions: as listed
- Storage: none directly
- Network/AI: none
- Edge cases: `cardioModalityForLegacy` deliberately consults `CARDIO_LEGACY_MODALITY` first because several
  ids claim the same `legacy` marker (both `treadmill_run` and outdoor `run` answer to legacy `"run"`), and
  array order should not decide (5545–5553).
- Gating: always on
- Status: WORKING
- Evidence for status: 5461–5589; consumed by `cardioEngineInput` (6746) and `migrateCardioV2` (6951).
- Notes: **Two parallel cardio catalogues coexist** — `CARDIO_TYPES` (v1, 8 entries) and `CARDIO_ACTIVITIES`
  (v2, 41 entries) — and the comment at 5542–5544 says "the v1 log form still speaks the eight legacy ids",
  i.e. the form was never rebuilt against v2. This is the largest piece of technical debt in the range.

### F-TRAIN-024 Cardio calorie engine (5-tier estimator)
- Location: data layer behind cardio calorie displays (UI outside range)
- User action: Indirect.
- Behavior:
  1. `ceEstimateCalories(w, profile, env, opts)` (6397–6494) climbs a ladder and reports which rung it used:
     tier 1 measured power (Concept2 split / erg watts / vertical work), tier 2 physics (Martin cycling model,
     Minetti ambulation, Pandolf-Santee load carriage, distance rule), tier 3 heart rate (Keytel), tiers 4–5
     MET lookup. Each result packs `{kcal, netKcal, grossKcal, range, tier, method, confidence, basis, detail}`
     with error bands of 0.10–0.40 (6412–6425).
  2. Net calories are the default because the number feeds a food tracker whose target already contains resting
     burn (6390–6396).
  3. `cardioEngineInput(rec)` (6746–6808) translates a stored record into the highest-tier engine input,
     converting incline % to grade, floors→3 m, steps→0.2 m, and picking a fallback MET by speed.
  4. `cardioEstimate(rec, bodyProfile)` (6809–6838) is "the one function the UI calls" and always returns
     something displayable, falling back to a bare MET estimate with a ±40 % range.
  5. `cardioBodyProfile(profile, fuelProfile, weightLog)` (6720–6745) hunts bodyweight/height/age/sex across
     three sources and sets `complete` when Harris-Benedict can run.
  6. Two documented deliberate omissions: no bodyweight scaling for weight-supported work, and no
     humidity/sun/AQI multipliers (5885–5905, `CE_SAFETY_ONLY` at 6106).
  7. Display labels: `CE_CONFIDENCE_LABEL` (6846–6849), `CE_METHOD_LABEL` (6850–6861).
  8. MET tables `CE_MET_RUNNING` (6506), `CE_MET_WALKING` (6544), `CE_MET_CYCLING` (6571),
     `CE_MET_SWIMMING` (6601), `CE_MET_MACHINES` (6625), cited as the 2024 Compendium (5954).
- Components: none in range
- Functions: the full `cc*`/`ce*` set — see Part B (5956–6716)
- State: none (pure)
- Storage: `cardioPrefs`/`saveCardioPrefs` read/write `lk_cardioPrefs` (5646–5658)
- Network/AI: none
- Edge cases: `cardioEstimate` wraps the engine in try/catch and substitutes a tier-5 estimate on any throw
  (6815–6832). `ceEstimateCalories` returns `null` when nothing usable was supplied (6493).
- Gating: always on
- Status: WORKING (as a library) — UNVERIFIED as a user-facing feature
- Evidence for status: 6397–6494 is complete and self-consistent; but no call site for `cardioEstimate` exists
  within this range, so whether the UI surfaces the tier/confidence labels cannot be confirmed here.
- Notes: `ceKeytelKcalPerMin` is explicitly "Unused today, kept for when straps land" (6349); tier 3 is
  therefore unreachable in practice since no `avgHr` source exists. `CE_MACHINE_OVERREAD` /
  `ceCorrectMachineDisplay` (6341–6348), `ceAcsmLegCyclingVo2` / `ceAcsmArmCyclingVo2` (6336–6337),
  `ceConcept2SplitFromWatts` (6320), `ceGradeMultiplier` (6071), `ceApproxWbgt` / `ceHeatSafetyLevel`
  (6112–6124), `CE_SURFACE_TO_PANDOLF` (6005) and `ceCorrectMachineDisplay` have **no call sites in this range**
  and appear to be ported-but-unwired.

### F-TRAIN-025 Cardio v1 → v2 migration (runs on load)
- Location: app boot
- User action: None — automatic.
- Behavior:
  1. `setTimeout(migrateCardioV2, 0)` at 6999 schedules it on every load.
  2. Guarded by `storageAvailable` and the `lk_cardioMigrated` flag (6953–6954).
  3. For each `type === "cardio"` row below `CARDIO_SCHEMA`: maps `cardioType` through
     `CARDIO_LEGACY_MODALITY` (6947–6950), converts minutes→`durationSec`, display distance→`distanceM` via
     `cardioDistToM`, maps the v1 three-step intensity to RPE 8/5/3, wraps `calories` into
     `{value, method:"met", estimated:true}`, nulls `environment`/`machine`/`metrics`/`heartRate`, and stamps
     `schemaVersion` (6955–6987).
  4. Writes `lk_history` back and sets `lk_cardioMigrated`, logging a `console.info` count (6988–6994).
  5. Whole body wrapped in try/catch returning 0 (6995–6996).
- Components: none
- Functions: `migrateCardioV2` (6951–6998)
- State: none
- Storage: reads/writes `lk_history`; writes `lk_cardioMigrated`
- Network/AI: none
- Edge cases: `lk_cardioMigrated` is set even when zero rows were migrated (6990), so a later-arriving v1 row
  (from a sync) is never migrated.
- Gating: always on
- Status: WORKING
- Evidence for status: 6951–6999, self-flagging one-shot with a documented guard.
- Notes: The unconditional flag-set is a real latent bug for synced accounts.

### F-TRAIN-026 Cardio-vs-lifting accounting guards
- Location: data layer read by every history/volume surface
- User action: Indirect.
- Behavior:
  1. `isLiftingSession(w)` = `w.type !== "cardio"` (6873–6875).
  2. `liftVolume(w)` strips non-digits from `w.vol`, detects the `lb`/`kg` suffix that was on screen when the
     session was saved, and converts to storage units so mixed-unit histories add up (6876–6886).
  3. `liftSets(w)` returns 0 for cardio (6887–6890).
  4. `cardioMinutes(list)` (6891–6899) and `cardioSessionCalories(w)` (6900–6907, handling both the v1 number
     and the v2 `{value}` object).
  5. `sessionSummaryLine(w)` produces the AI-facing one-liner, branching cardio vs lifting (6908–6926).
  6. `sessionMetaLine(w, withVolume)` produces the UI sub-line: `"30 min · 5.2 km · 320 cal"` for cardio,
     `"4 sets · 3800 kg"` for lifting (6927–6946).
- Components: none
- Functions: as listed
- Storage/Network: none
- AI: `sessionSummaryLine` (6908) is explicitly the shape fed to the AI coach — the comment at 6903–6907 says a
  shared template previously printed "undefined sets, undefined" for cardio rows.
- Edge cases: The header comment (6863–6872) documents the original bug: `vol: "320 cal"` on a cardio record
  made a run add 320 to a kilogram total and one phantom set.
- Gating: always on
- Status: WORKING
- Evidence for status: 6873–6946 with the regression documented inline.
- Notes: These three helpers are described as "the only way volume and set counts should ever be read off a
  history row" (6871) — a convention with no enforcement.

### F-TRAIN-027 Bottom tab bar (`Nav`)
- Location: global chrome (component body falls inside this range at 7652–7760)
- User action: Taps a tab.
- Behavior:
  1. Five tabs: Home, Train, Fuel, Coach (`D.ai`), Profile (7695–7712).
  2. Publishes its measured height to the CSS custom property `--lk-nav-h` on mount, on `ResizeObserver` fire,
     and on `window resize`, so content clearance tracks Dynamic Type / page zoom (7657–7694).
  3. Deliberately `position: relative` — the last row of the shell's flex column rather than a fixed element,
     so a browser resizing the visual viewport has nothing to reposition (7714–7723).
  4. Active tab: accent colour, a 46×28 pill background `OR_H + "1A"` animating `pillIn`, bolder label; sets
     `aria-current="page"` and appends " (current page)" to the `aria-label` (7736–7759).
  5. Tapping calls `p.go(t.id)` (7731–7733).
- Components: `Nav` (7652–7760), wrapped in `React.memo`
- Functions: `sync` (7659–7661)
- State: `navRef`
- Storage/Network/AI: none
- Edge cases: `ResizeObserver` presence is feature-detected with a `window resize` fallback (7663–7670).
- Gating: always on
- Status: WORKING
- Evidence for status: 7652–7760; memoised and self-measuring.
- Notes: Out of scope for the exercise library but physically inside this range; flagged so no one double-counts
  it. `GLASSBAR` + `backdrop-filter: saturate(180%) blur(20px)` (7724–7726).

---

## PART B — Function / component index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| ThrowbackCard | component | 4664–4713 | Then/now progress flashback card | 16536, 26605, 28645 | liftDisp, disp | F-TRAIN-011 |
| disp | function (inner) | 4669 | Unit-aware display wrapper | ThrowbackCard | liftDisp | F-TRAIN-011 |
| muscleVolumeSummary | function | 4715–4740 | 6-week synergy-weighted weekly set volume per muscle | physique analysis (outside range) | isLiftingSession, resolveSavedEx, getInvolvement | F-TRAIN-019 |
| lcName | function | 4742–4746 | Tolerant lowercase name for shopping rows | Shopping tab (outside range) | — | — |
| getEx | function | 4747–4761 | Look up an exercise by id in ALL_EX; synthetic "Unknown" fallback | resolveSavedEx, app-wide | — | F-TRAIN-019 |
| exByName | function | 4763–4771 | Memoised name→exercise lookup | resolveSavedEx | — | F-TRAIN-019 |
| getInvolvement | function | 4817–4844 | Primary/secondary/tertiary muscle weights for an exercise | muscleVolumeSummary, computeMuscleRecovery | MUSCLE_SYNERGY regexes | F-TRAIN-019 |
| add | function (inner) | 4822–4830 | Dedup helper inside getInvolvement | getInvolvement | — | F-TRAIN-019 |
| resolveSavedEx | function | 4845–4856 | Resolve a saved set-row back to a catalogue exercise | muscleVolumeSummary, computeMuscleRecovery | getEx, exByName | F-TRAIN-019 |
| workoutNameGroups | function | 4857–4868 | Keyword-guess muscle groups from a workout name | computeMuscleRecovery | — | F-TRAIN-019 |
| rirIntensity | function | 4883–4891 | RIR → intensity factor (1.0 … 0.4) | computeMuscleRecovery | — | F-TRAIN-019 |
| computeMuscleRecovery | function | 4892–4990 | Per-muscle ready/recovering/heavy rows | recovery UI (outside range) | resolveSavedEx, getInvolvement, rirIntensity, workoutNameGroups | F-TRAIN-019 |
| lkScroller | function | 4992–4998 | Get the `.lk-scroll` region | lkScrollTop/By/ToTop, lock/unlock | — | F-TRAIN-020 |
| lkScrollTop | function | 4999–5002 | Read scroll offset from the region | drag-reorder | lkScroller | F-TRAIN-020 |
| lkScrollBy | function | 5003–5006 | Nudge the region | drag-reorder | lkScroller | F-TRAIN-020 |
| lkScrollToTop | function | 5007–5010 | Reset the region | navigation | lkScroller | F-TRAIN-020 |
| lkLockScroll | function | 5011–5016 | Ref-counted scroll lock | lkOverlayRoot observer, ExerciseActionSheet | lkScroller | F-TRAIN-020, 009 |
| lkUnlockScroll | function | 5017–5031 | Ref-counted unlock + restore | same | lkScroller | F-TRAIN-020, 009 |
| lkOverlayRoot | function | 5033–5059 | Lazily create the locking portal host | lkPortal | lkLockScroll/Unlock, MutationObserver | F-TRAIN-020 |
| lkSheetRoot | function | 5061–5071 | Lazily create the non-locking portal host | lkPortal | — | F-TRAIN-020 |
| lkPortal | function | 5072–5084 | Portal children into the right host, with fallback | ExerciseDetailModal 7216, ExerciseActionSheet 7551 | lkOverlayRoot, lkSheetRoot, ReactDOM.createPortal | F-TRAIN-020, 006, 009 |
| DraftNum | component | 5085–5110 | Decimal-safe numeric input | 17392, 17412, 20465 | — | F-TRAIN-012 |
| lkTrapTab | handler | 5113–5124 | Focus wrap inside a dialog | lkDialogRef | — | F-TRAIN-021 |
| lkDialogRef | function (callback ref) | 5125–5140 | Dialog focus capture/restore + trap install | ExerciseActionSheet 7553 | lkTrapTab | F-TRAIN-021, 009 |
| (anonymous Escape listener) | handler | 5145–5158 | Global capture-phase Escape dispatcher | document | stack handlers | F-TRAIN-021 |
| useEscape | hook | 5160–5177 | Register a close handler on the Escape stack | ExerciseDetailModal 7203, ExerciseActionSheet 7498 | — | F-TRAIN-021, 006, 009 |
| lkConfirm | function | 5179–5197 | Two-tap destructive confirm with 7s disarm | destructive actions (outside range) | window.LOCKED.toast | F-TRAIN-021 |
| withWorkoutIds | function | 5199–5212 | Backfill stable ids onto history rows | history load | sd | F-TRAIN-022 |
| sameWorkout | function | 5213–5226 | Identity test for a history row | edit/delete | — | F-TRAIN-022 |
| lkKeyActivate | handler | 5227–5233 | Enter/Space activation for role=button wrappers | outside range | — | F-TRAIN-021 |
| Ic | component | 5234–5254 | SVG icon primitive | app-wide (7383, 7818, 8342, …) | — | F-TRAIN-013 |
| IcMemo | component (memo) | 5255 | Memoised Ic — **DEAD** | nobody | — | F-TRAIN-013 |
| LoadingSpinner | component | 5256–5279 | Pulsing dot + "Loading…" — **DEAD** | nobody | — | F-TRAIN-014 |
| LoadingMemo | component (memo) | 5280 | Memoised spinner — **DEAD** | nobody | — | F-TRAIN-014 |
| getBar | function | 5371–5374 | Bar lookup, Olympic default | plate calculator | — | F-TRAIN-018 |
| calcPlatesPerSide | function | 5375–5402 | Greedy per-side plate breakdown | plate calculator | — | F-TRAIN-018 |
| cardioActivity | function | 5534–5539 | v2 activity lookup by id | cardioFieldsFor, toggleCardioFav, cardioLegacyForModality | — | F-TRAIN-023 |
| cardioFieldsFor | function | 5540–5543 | Field list for an activity | cardioHasField, cardio form | cardioActivity | F-TRAIN-023 |
| cardioModalityForLegacy | function | 5554–5560 | v1 id → v2 activity id | v1 log form | — | F-TRAIN-023 |
| cardioLegacyForModality | function | 5561–5567 | v2 activity id → v1 id | v1 log form | cardioActivity | F-TRAIN-023 |
| cardioHasField | function | 5568–5570 | Does this activity ask for this metric? | cardio form | cardioFieldsFor | F-TRAIN-023 |
| mToKm | function | 5619 | metres → km | cardioDist, pace/speed helpers | — | F-TRAIN-023 |
| mToMi | function | 5620 | metres → miles | cardioDist | — | F-TRAIN-023 |
| kmToM | function | 5621 | km → metres | cardioDistToM | — | F-TRAIN-023 |
| miToM | function | 5622 | miles → metres | cardioDistToM | — | F-TRAIN-023 |
| cardioDist | function | 5623–5625 | Display distance in the chosen unit | cardio UI | mToMi, mToKm | F-TRAIN-023 |
| cardioDistToM | function | 5626–5628 | Entered distance → metres | migrateCardioV2, cardio form | miToM, kmToM | F-TRAIN-023, 025 |
| secToClock | function | 5630–5635 | mm:ss / h:mm:ss | cardio UI | — | F-TRAIN-023 |
| clockToSec | function | 5636–5643 | Parse a clock string to seconds | cardio form | — | F-TRAIN-023 |
| cardioPrefs | function | 5646–5655 | Read cardio preferences with defaults | cardioMaxHr, cardio UI | ld | F-TRAIN-024 |
| saveCardioPrefs | function | 5656–5658 | Merge-write cardio preferences | cardio settings | cardioPrefs, sd | F-TRAIN-024 |
| cardioMaxHr | function | 5664–5675 | Tanaka / Gulati max HR with override | zone UI | cardioPrefs | F-TRAIN-024 |
| cardioZones | function | 5689–5691 | Pick the 3- or 5-zone table | cardioZoneOf | — | F-TRAIN-024 |
| cardioZoneOf | function | 5697–5708 | bpm → zone index, −1 below zone 1 | zone charts | cardioZones | F-TRAIN-024 |
| cardioKarvonen | function | 5709–5713 | Heart-rate-reserve target | advanced zone UI | — | F-TRAIN-024 |
| cardioMet | function | 5729–5792 | v1 MET picker from speed/watts/RPE | cardioCalories | — | F-TRAIN-024 |
| cardioCalories | function | 5793–5819 | v1 calorie estimate (watts or MET) | v1 cardio UI | cardioMet | F-TRAIN-024 |
| cardioFavorites | function | 5821–5824 | Read the favourites array | findCardioFav/isCardioFav/toggleCardioFav | ld | F-TRAIN-023 |
| saveCardioFavorites | function | 5825–5827 | Persist favourites | toggleCardioFav | sd | F-TRAIN-023 |
| cardioFavKey | function | 5830–5834 | Identity = modality|category|brand | findCardioFav | — | F-TRAIN-023 |
| findCardioFav | function | 5835–5841 | Locate a matching favourite | isCardioFav, toggleCardioFav | cardioFavKey | F-TRAIN-023 |
| isCardioFav | function | 5842–5845 | Boolean favourite test | cardio UI | cardioFavorites, findCardioFav | F-TRAIN-023 |
| toggleCardioFav | function | 5846–5878 | Add/remove a saved setup, new ones first | cardio UI | cardioFavorites, findCardioFav, cardioActivity, saveCardioFavorites | F-TRAIN-023 |
| ccClamp | function | 5956 | Clamp | engine-wide | — | F-TRAIN-024 |
| ccRound5 | function | 5957 | Round to 5 | pack, ceAmbulationKcal, cardioEstimate | — | F-TRAIN-024 |
| ccRound1 | function | 5958 | Round to 0.1 | ceCyclingKcal | — | F-TRAIN-024 |
| ccRound2 | function | 5959 | Round to 0.01 | ceAmbulationKcal, ceLoadCarriageKcal | — | F-TRAIN-024 |
| ccRound3 | function | 5960 | Round to 0.001 | air-density detail | — | F-TRAIN-024 |
| ccNum | function | 5961–5964 | parseFloat with a default | engine-wide | — | F-TRAIN-024 |
| ccKgToLb | function | 5965 | kg → lb | ceConcept2Kcal | — | F-TRAIN-024 |
| ccMphToMPerSec | function | 5966 | mph → m/s | ceEstimateCalories | — | F-TRAIN-024 |
| ceSurface | function | 5989–5994 | Surface row lookup, pavement default | ceAmbulationKcal | — | F-TRAIN-024 |
| ceSaturationVapourPressurePa | function | 6019–6021 | Saturation vapour pressure | ceAirDensity, ceApproxWbgt | — | F-TRAIN-024 |
| cePressureAtElevationPa | function | 6022–6024 | Barometric pressure at altitude | ceAirDensity | — | F-TRAIN-024 |
| ceAirDensity | function | 6028–6039 | Air density from temp/elevation/humidity | ceAmbulationKcal, ceCyclingKcal | ccNum, ccClamp, cePressureAtElevationPa, ceSaturationVapourPressurePa | F-TRAIN-024 |
| ceHeadwindComponent | function | 6040–6045 | Signed headwind along the travel bearing | ceAmbulationKcal, ceCyclingKcal | — | F-TRAIN-024 |
| ceHarrisBenedictKcalPerDay | function | 6047–6052 | RMR per day | ceRmrKcalPerMin | — | F-TRAIN-024 |
| ceRmrKcalPerMin | function | 6053–6059 | RMR per minute, 1-MET fallback | every net-calorie path | ceHarrisBenedictKcalPerDay | F-TRAIN-024 |
| ceMinettiRunJPerKgPerM | function | 6061–6065 | Running cost polynomial vs grade | ceAmbulationKcal, ceGradeMultiplier | ccClamp | F-TRAIN-024 |
| ceMinettiWalkJPerKgPerM | function | 6066–6070 | Walking cost polynomial vs grade | ceAmbulationKcal, ceGradeMultiplier | ccClamp | F-TRAIN-024 |
| ceGradeMultiplier | function | 6071–6074 | Grade cost ratio vs flat — **no call site in range** | — | Minetti fns | F-TRAIN-024 |
| ceRunAeroJPerKgPerM | function | 6082–6096 | Aero cost of running, floored at 0 | ceAmbulationKcal | ccNum | F-TRAIN-024 |
| ceHeatMultiplier | function | 6097–6104 | Capped heat correction, off by default | ambulation/cycling/load paths | — | F-TRAIN-024 |
| ceApproxWbgt | function | 6112–6116 | Rough WBGT — **no call site in range** | — | ccNum, ceSaturationVapourPressurePa | F-TRAIN-024 |
| ceHeatSafetyLevel | function | 6117–6124 | WBGT → risk band — **no call site in range** | — | — | F-TRAIN-024 |
| ceAmbulationKcal | function | 6126–6182 | Minetti + surface + aero + heat run/walk model | ceEstimateCalories | ceSurface, ceAirDensity, Minetti fns, ceHeadwindComponent, ceRunAeroJPerKgPerM, ceHeatMultiplier, ceRmrKcalPerMin | F-TRAIN-024 |
| cePandolfWatts | function | 6184–6198 | Pandolf load-carriage watts + Santee downhill | ceLoadCarriageKcal | — | F-TRAIN-024 |
| ceLoadCarriageKcal | function | 6200–6242 | Rucking/hiking calories | ceEstimateCalories | cePandolfWatts, ceHeatMultiplier, ceRmrKcalPerMin | F-TRAIN-024 |
| ceCyclingPowerWatts | function | 6244–6257 | Martin 1998 power model | ceCyclingKcal | ccNum | F-TRAIN-024 |
| ceCyclingKcalFromPower | function | 6259–6262 | kJ → kcal at a gross efficiency | ceCyclingKcal | ccNum | F-TRAIN-024 |
| ceCyclingKcal | function | 6264–6317 | Cycling calories, power-meter or modelled | ceEstimateCalories | ceAirDensity, ceRmrKcalPerMin, ceCyclingKcalFromPower, ceCyclingPowerWatts, ceHeadwindComponent | F-TRAIN-024 |
| ceConcept2WattsFromSplit | function | 6319 | 500 m split → watts | ceEstimateCalories | — | F-TRAIN-024 |
| ceConcept2SplitFromWatts | function | 6320 | watts → split — **no call site in range** | — | — | F-TRAIN-024 |
| ceConcept2DisplayedCalPerHour | function | 6323 | What the erg screen shows | ceConcept2Kcal | — | F-TRAIN-024 |
| ceConcept2Kcal | function | 6324–6328 | Weight-corrected erg calories | ceEstimateCalories | ceConcept2DisplayedCalPerHour, ccKgToLb | F-TRAIN-024 |
| ceStairClimbKcal | function | 6329–6334 | Vertical work → calories | ceEstimateCalories | ceRmrKcalPerMin | F-TRAIN-024 |
| ceAcsmLegCyclingVo2 | function | 6336 | ACSM leg-ergometer VO2 — **no call site in range** | — | — | F-TRAIN-024 |
| ceAcsmArmCyclingVo2 | function | 6337 | ACSM arm-ergometer VO2 — **no call site in range** | — | — | F-TRAIN-024 |
| ceCorrectMachineDisplay | function | 6344–6347 | Divide out console over-read — **no call site in range** | — | — | F-TRAIN-024 |
| ceKeytelKcalPerMin | function | 6350–6363 | Heart-rate calories (tier 3) | ceEstimateCalories | ceRmrKcalPerMin | F-TRAIN-024 |
| ceMetToKcalPerMin | function | 6365–6367 | MET → kcal/min | metFallback, cardioEstimate | — | F-TRAIN-024 |
| ceLookupMetBySpeed | function | 6368–6378 | Nearest MET row by mph | cardioEngineInput | — | F-TRAIN-024 |
| ceLookupMetByWatts | function | 6379–6384 | MET row by watt band | cardioEngineInput | — | F-TRAIN-024 |
| ceRunningKcalFromDistance | function | 6386–6388 | 1 kcal/kg/km rule | ceEstimateCalories | — | F-TRAIN-024 |
| ceEstimateCalories | function | 6397–6494 | The 5-tier entry point | cardioEstimate | all ce* models | F-TRAIN-024 |
| fromGross | function (inner) | 6408 | gross → {gross,net} | ceEstimateCalories | — | F-TRAIN-024 |
| pack | function (inner) | 6410–6423 | Wrap a result with tier/confidence/range | ceEstimateCalories | ccRound5 | F-TRAIN-024 |
| metFallback | function (inner) | 6425–6431 | Tier 4/5 result | ceEstimateCalories | ceMetToKcalPerMin, ceHeatMultiplier, pack | F-TRAIN-024 |
| ceMerge | function | 6495–6501 | Shallow one-directional merge | ceEstimateCalories, cardioEstimate | — | F-TRAIN-024 |
| ceActivityMap | function | 6698–6700 | Activity id → engine modality + defaults | cardioEngineInput | — | F-TRAIN-024 |
| ceRidePosition | function | 6710–6715 | Ride position → CdA, drops default | cardioEngineInput | — | F-TRAIN-024 |
| cardioBodyProfile | function | 6720–6745 | Assemble weight/height/age/sex from 3 sources | cardio UI | — | F-TRAIN-024 |
| cardioEngineInput | function | 6746–6808 | Stored record → highest-tier engine input | cardioEstimate | ceActivityMap, ceRidePosition, ceLookupMetBySpeed, ceLookupMetByWatts, ccClamp | F-TRAIN-024 |
| cardioEstimate | function | 6809–6838 | The one function the UI calls; always returns | cardio UI (outside range) | ceMerge, cardioEngineInput, ceEstimateCalories, cardioEnv, ceMetToKcalPerMin, ceRmrKcalPerMin, ccRound5 | F-TRAIN-024 |
| cardioEnv | function | 6839–6845 | Build the environment object (temp only) | cardioEstimate | — | F-TRAIN-024 |
| isLiftingSession | function | 6873–6875 | Not-cardio test | liftVolume, liftSets, muscleVolumeSummary | — | F-TRAIN-026 |
| liftVolume | function | 6881–6886 | Parse `vol` to storage units | volume counters | isLiftingSession, unitToStored | F-TRAIN-026 |
| liftSets | function | 6887–6890 | Set count, 0 for cardio | set counters | isLiftingSession | F-TRAIN-026 |
| cardioMinutes | function | 6891–6899 | Total cardio minutes in a list | weekly counters | — | F-TRAIN-026 |
| cardioSessionCalories | function | 6900–6907 | Calories from v1 number or v2 object | sessionSummaryLine, sessionMetaLine | — | F-TRAIN-026 |
| sessionSummaryLine | function | 6908–6926 | One-line session description for the AI | AI prompt builders | cardioSessionCalories | F-TRAIN-026 |
| sessionMetaLine | function | 6927–6946 | Sub-line under a session in history lists | history UI | cardioSessionCalories | F-TRAIN-026 |
| migrateCardioV2 | function | 6951–6998 | One-shot v1→v2 cardio migration | setTimeout at 6999 | ld, sd, cardioDistToM | F-TRAIN-025 |
| cardioPaceSecPerKm | function | 7000–7004 | Derived pace | cardio UI | mToKm | F-TRAIN-023 |
| cardioSplit500 | function | 7005–7009 | Derived 500 m split | cardio UI | — | F-TRAIN-023 |
| cardioSpeedKph | function | 7010–7013 | Derived speed | cardio UI | mToKm | F-TRAIN-023 |
| estimateCardioCalories | function | 7015–7046 | v1 MET estimate self-calibrated from the last 5 sessions | v1 cardio form | CARDIO_TYPES | F-TRAIN-023 |
| getExEquip | function | 7047–7056 | Read per-exercise bar/plate config | plate calculator | ld | F-TRAIN-017 |
| setExEquip | function | 7057–7059 | Write per-exercise bar/plate config | plate calculator | sd | F-TRAIN-017 |
| ytCreatorFor | function | 7063–7065 | Creator name by `exId % 4` | ExerciseDetailModal 7386 | — | F-TRAIN-015 |
| ytSearchVideo | function | 7066–7088 | Cached form-video lookup via the worker | ExerciseDetailModal 7213 | fetch, localStorage | F-TRAIN-015, 006 |
| ascendFetchDetail | function | 7089–7093 | Fetch ExerciseDB detail — **DEAD** | nobody | fetch | F-TRAIN-016 |
| loadExNotes | function | 7098–7101 | Read the whole notes object, type-guarded | getExNote, saveExNote | ld | F-TRAIN-007 |
| getExNote | function | 7102–7106 | Read one exercise's note text | ExerciseNotes 7121 | loadExNotes | F-TRAIN-007 |
| saveExNote | function | 7107–7117 | Write or delete one note | ExerciseNotes (3 paths) | loadExNotes, sd | F-TRAIN-007 |
| ExerciseNotes | component | 7118–7201 | Autosaving per-exercise notes textarea | ExerciseDetailModal 7343 | getExNote, saveExNote | F-TRAIN-007 |
| onChange | handler | 7136–7145 | Debounced note save | ExerciseNotes textarea | saveExNote | F-TRAIN-007 |
| ExerciseDetailModal | component | 7202–7495 | Exercise detail bottom sheet | ExLib 7856, log screen 11644 | useEscape, useSheetDrag, lkPortal, ytSearchVideo, ytCreatorFor, logBetaActivity, ExerciseNotes, Ic | F-TRAIN-006 |
| ExerciseActionSheet | component | 7496–7651 | Hold-to-lift action bubble over a logging card | 11649 | useEscape, lkPortal, lkDialogRef, lkLockScroll/Unlock, readableAccent, Ic | F-TRAIN-009 |
| dismiss | function (inner) | 7521–7529 | Guarded animated dismissal, runs the action on the way out | ExerciseActionSheet handlers, useEscape | p.onClose | F-TRAIN-009 |
| Nav | component (memo) | 7652–7760 | Bottom tab bar; publishes `--lk-nav-h` | app shell | Ic | F-TRAIN-027 |
| sync | function (inner) | 7659–7661 | Measure and publish nav height | Nav effect / ResizeObserver / resize | — | F-TRAIN-027 |
| ExLib | component | 7761–8624 | The whole exercise library (5 screens in one component) | 9216, 11388, 15056, 15958 | mergedSub, ExBtn, ExerciseDetailModal, Ic, readableAccent | F-TRAIN-001…008 |
| mergedSub | function (inner) | 7776–7797 | Merge catalogue + custom exercises for a sub-group | ExLib list + counts | — | F-TRAIN-002, 003 |
| ExBtn | component (inner) | 7798–7854 | One exercise row button | ExLib search + part lists | Ic | F-TRAIN-004 |
| (custom id allocator) | function (IIFE) | 8149–8156 | First unused id ≥ 90000 | Create Exercise submit | — | F-TRAIN-008 |
| ReplacePanel | component | 8625–8781 | Swap-exercise picker (same-muscle or search) | 11418 | Ic | F-TRAIN-010 |

**Counts:** 27 features; 131 indexed entries (13 components incl. 4 memo/inner, 1 hook, 117 functions/handlers).

---

## Storage keys touched

| Key | Read by | Written by | Notes |
|---|---|---|---|
| `lk_exNotes` | `loadExNotes` 7098, `getExNote` 7102 | `saveExNote` 7113/7115 | One object keyed by `String(exId)`, value `{text, updated}` |
| `lk_exequip_<exerciseId>` | `getExEquip` 7048 | `setExEquip` 7058 | One key per exercise; unbounded growth |
| `lk_history` | `migrateCardioV2` 6955 | `withWorkoutIds` 5209, `migrateCardioV2` 6988 | Shared with strength sessions by design (5452–5460) |
| `lk_cardioMigrated` | 6954 | 6989 | One-shot migration flag, set even when 0 rows migrated |
| `lk_cardioPrefs` | `cardioPrefs` 5647 | `saveCardioPrefs` 5657 | `{distUnit, weeklyTargetMin, maxHrOverride, zoneModel, restingHr}` |
| `lk_cardioFavorites` | `cardioFavorites` 5822 | `saveCardioFavorites` 5826 | Array of saved cardio setups |
| `lk_customEx` | 4278 (outside range, feeds `ALL_EX`) | outside range (`p.onCustom`) | Custom exercises created by F-TRAIN-008 |
| `yt3_<exercise name>` | `ytSearchVideo` 7068 | `ytSearchVideo` 7082 | **Raw key — no `lk_` prefix**, bypasses `ld`/`sd`, quota warning and sync |

## Network endpoints

| Endpoint | Method | Payload | Response handling | Cite |
|---|---|---|---|---|
| `https://lockedapi.cescocugliari.workers.dev/yt-search` | POST, `application/json` | `{name, exId}` | reads `d.videoId`; caches on hit; `null` on miss or any error | 7060, 7071–7088 |
| `https://lockedapi.cescocugliari.workers.dev/exercise-detail/{id}` | GET | none | `r.json()`, no catch — **never called** | 7089–7093 |
| `https://static.exercisedb.dev/media/<hash>.gif` | GET (`<img src>`) | none | `onError` hides the `<img>` | 7305–7328; 225 URLs at 2986+ |
| `https://i.ytimg.com/vi/<videoId>/hqdefault.jpg` | GET (`<img src>`) | none | `onError` hides the `<img>` | 7370–7376 |
| `https://www.youtube.com/watch?v=<videoId>` | `window.open(_blank)` | none | n/a | 7362 |

**Secrets:** none found in this range. `WORKER_API` (7060) is a public endpoint URL, not a credential. No API
keys, tokens, or client secrets appear between 4664 and 8781. The worker URL does embed the developer's personal
account name (`cescocugliari.workers.dev`) — an information-disclosure nit, not a secret.

## Exercise data model

**`GROUPS`** (declared at 2975, outside this range; consumed here at 7868, 7967, 8299, 8560):

```
GROUPS: [{
  id:   "chest",            // slug, matches ALL_EX.gid
  name: "Chest",            // display name, matches ALL_EX.group
  col:  RE,                 // hex accent, e.g. "#DC2626"
  subs: [{
    id:   "upper",          // matches ALL_EX.sid
    name: "Upper Chest",    // "All" means "the whole group"
    ex:   [{ id: 101, name: "Incline Barbell Press",
             eq: "Barbell",
             gifUrl: "https://static.exercisedb.dev/media/3TZduzM.gif" }, …]
  }, …]
}, …]
```

**`ALL_EX`** is a flat denormalised index built once at load (4258–4275) by walking `GROUPS`:

```
{ id, name, eq, gifUrl|null, group: g.name, muscle: (s.name==="All" ? g.name : s.name),
  col: g.col, gid: g.id, sid: s.id }
```

Immediately afterwards, entries from `localStorage["lk_customEx"]` are appended if their `id` is not already
present (4276–4289). So `ALL_EX` is **catalogue + customs-as-of-page-load**, and never refreshed at runtime.

**Custom exercise record** (built at 8147–8168) adds three fields the catalogue never has:

```
{ id: ≥90000, name, eq, group, muscle, col, gid, sid,
  custom: true, startResist: Number, smithNoCB: Boolean }
```

**The "full" record** the library hands to the detail sheet (8353–8371) additionally carries `apiId` and
`imageUrl` — neither of which is populated anywhere in `GROUPS`, and `imageUrl` is never rendered.

**How images resolve.** There is no image API call and no ExerciseDB SDK. Every animation is a **hardcoded
absolute URL in the `GROUPS` literal** — 225 `gifUrl` strings of the form
`https://static.exercisedb.dev/media/<8-char hash>.gif`, first at 2986. It flows
`GROUPS.ex[].gifUrl` → `ALL_EX[].gifUrl` (4266) → the normaliser's `gifUrl: e.gifUrl || null` (8358) →
`ExerciseDetailModal`'s `<img src={ex.gifUrl}>` (7305–7328). Consequences:
- The app has **no license/CDN control** over these assets; if `static.exercisedb.dev` changes or expires, all
  225 animations break silently (the `onError` at 7311 just hides the element).
- Hashes are **reused across exercises** — e.g. `vmwLyCg.gif` appears at 2991, 3045, 3075, 3099 and
  `FVmZVhk.gif` at 3011, 3055, 3065, 3104 — so several distinct exercises show the same animation.
- Custom exercises and any exercise whose entry lacks `gifUrl` fall through to the "No animation available"
  card (7329–7343).
- Images are `loading="lazy" decoding="async"` with a reserved `aspectRatio: 1` box so the sheet does not jump
  (7307–7327).

**Cardio record (schema v2)** — as produced by `migrateCardioV2` (6955–6987), stored in `lk_history`:

```
{ type: "cardio", schemaVersion: 2, dateISO, name,
  modality,                    // a CARDIO_ACTIVITIES id
  durationSec, distanceM,      // ALWAYS seconds and metres
  environment, machine, metrics, heartRate,
  intensity: { rpe, estMET, talkTest },
  fasted: Boolean,
  calories: { value, method, estimated },
  favoriteId, source: "manual" }
```

## Open questions / UNVERIFIED

1. **Does any surface actually display the calorie engine's tier/confidence output?** `cardioEstimate` (6809) is
   described as "the one function the UI calls" and `CE_CONFIDENCE_LABEL` / `CE_METHOD_LABEL` (6846–6861) exist,
   but there is no call site within 4664–8781. *Confirm:* grep `cardioEstimate|CE_METHOD_LABEL` in 8782–58015.
2. **Is the v2 cardio logging form built at all?** The comment at 5542–5544 says "the v1 log form still speaks
   the eight legacy ids… until the form is rebuilt". If it was never rebuilt, `CARDIO_ACTIVITIES` (41 entries),
   `CARDIO_MACHINES`, `CARDIO_BRANDS` and `CARDIO_FIELDS` are all unreachable data. *Confirm:* find the call
   sites of `CARDIO_ACTIVITIES` and `cardioFieldsFor` outside this range.
3. **`ascendFetchDetail` (7089) is dead** — was it meant to fill instructions/secondary muscles into the detail
   sheet, keyed on the `apiId` the normaliser already carries (8365)? *Confirm:* check the worker's
   `/exercise-detail` implementation (not in this repo).
4. **`IcMemo` (5255) and `LoadingMemo`/`LoadingSpinner` (5256–5280) are dead** — verified by grep across the
   whole 58,015-line file; each name appears only on its definition line. Intentional or an abandoned
   optimisation?
5. **`getExEquip` / `setExEquip` (7047–7059) have no call site in this range.** The plate calculator UI that
   consumes them lives elsewhere. *Confirm:* grep `getExEquip` in 8782–58015.
6. **Does `lk_exNotes` really sync across devices?** The comment at 7094–7097 claims it does, but the sync layer
   is outside this range. *Confirm:* check whether `exNotes` is in the sync key allowlist.
7. **Nine engine functions have no in-range call site** and may be dead app-wide: `ceGradeMultiplier` (6071),
   `ceApproxWbgt` (6112), `ceHeatSafetyLevel` (6117), `ceConcept2SplitFromWatts` (6320),
   `ceAcsmLegCyclingVo2` (6336), `ceAcsmArmCyclingVo2` (6337), `ceCorrectMachineDisplay` (6344), plus the
   constants `CE_SURFACE_TO_PANDOLF` (6005) and `CE_SAFETY_ONLY` (6106). *Confirm:* grep each outside the range.
8. **Tier 3 (heart rate) is unreachable.** `ceKeytelKcalPerMin` is annotated "Unused today, kept for when straps
   land" (6349), and `cardioEnv` (6839) only ever populates `tempC`. Confirmed by code comment; flagged as a
   design decision, not a bug.
9. **`ThrowbackCard`'s ▼ arrow (4686)** is unreachable for non-bodyweight items. This is a code-level certainty
   (`down = it.kind === "weight" && …`) but whether a regressed lift ever reaches this card depends on the
   `tbData` producer outside this range. *Confirm:* find where `tbData` items are built.
10. **Two confirm idioms coexist**: `ExerciseActionSheet`'s in-place `armedId` (7501, 7624) never auto-disarms,
    while the global `lkConfirm` (5179) disarms after 7 s. Which is the intended pattern for the redesign?
