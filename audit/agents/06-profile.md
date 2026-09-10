# Agent 6 — Profile & Settings Audit

File under audit: `redesign/input/locked-current-v6.html` (all cites are this file unless noted).
Exclusive range: **30153–33807**.
Components in range: `ProfileScreen` (30153), `ProgressPhotos` (30585), `LayoutEditor` (31492), `NotificationsCard` (31756), `TextSizeCard` (31945), `StorageCard` (31987), `SettingsScreen` (32031). `Onboarding` begins at 33806 (out of scope).

Shared helpers cited outside the range are resolved for correctness only: `ld` (2417-2425), `sd` (2435-2452), `lkStorageUsage` (2456-2468), `THEMES` (2469-2500), `applyTheme` (2508-2532), `setTheme` (2535-2538), `saveProgressPhoto` (2856-2877), `resizeImage` (2878-2910), `validateBetaCodeRemote` (2729-2756), `claimBetaCode` (2757-2771), `logBetaActivity` (2772-2784), `isSilentBeta` (2796-2799), `syncBetaData` (2800+), `storedWeightUnit` (4379-4413), `muscleVolumeSummary` (4715), `lkPortal` (5072), `useEscape` (5160), `lkConfirm` (5179), `exportFuelCSV` (19376), `downloadText` (19415-19428), `exportEverything` (19436-19452), `importEverything` (19454+), `HOME_BLOCK_DEFS` (26019-26061), `HOME_DEFAULT_ORDER` (26062-26064), `getHomeLayout` (26065-26078), `saveHomeLayout` (26079-26081), `QUICK_ACTION_DEFS` (26082+), `checkinPerDay` (52445-52448), `window.LOCKEDPush` (1307-1935).

---

## PART A — Features

### F-PROF-001 Guest-mode upgrade banner (Profile header)
- Location: Profile tab > ProfileScreen > top banner
- User action: taps "SIGN UP"
- Behavior: 1) banner renders only when `window.LOCKED.isGuest` is truthy (30243, 30245-30248); 2) tap calls `window.LOCKED.upgradeFromGuest()` (30281-30283)
- Components: ProfileScreen (30153-30584)
- Functions: inline onClick (30281-30283)
- State: reads global `window.LOCKED.isGuest` (30243)
- Storage: none directly in range
- Network: none in range (delegated to `window.LOCKED.upgradeFromGuest`)
- AI: none
- Edge cases: banner absent for signed-in users; header top padding switches 52px→18px when banner shows (30297)
- Gating: guest accounts only (30243)
- Status: UNVERIFIED
- Evidence for status: 30281 — `upgradeFromGuest` is defined outside this range; its success/failure UI cannot be confirmed here.
- Notes: identical duplicated card exists in Settings (F-PROF-045).

### F-PROF-002 Profile identity header (avatar, display name, @username)
- Location: Profile tab > ProfileScreen > header
- User action: passive (read-only)
- Behavior: 1) avatar circle renders first letter of `profile.displayName` uppercased, fallback "A" (30322); 2) display name (30331-30338); 3) "@" + `profile.username` (30339-30346)
- Components: ProfileScreen (30294-30347)
- Functions: none
- State: `p.profile` prop
- Storage: none read in range (profile supplied by parent)
- Network: none
- AI: none
- Edge cases: missing displayName → avatar "A" but name line renders empty (30322, 30338)
- Gating: always on
- Status: WORKING
- Evidence for status: 30322-30346 — pure render of props.
- Notes: no avatar image support anywhere; initial-only.

### F-PROF-003 Settings entry button
- Location: Profile tab > ProfileScreen > header right
- User action: taps "Settings"
- Behavior: calls `p.go("settings")` (30348-30350)
- Components: ProfileScreen
- Functions: inline onClick (30348-30350)
- State: parent router
- Storage: none
- Network: none
- AI: none
- Edge cases: none
- Gating: always on
- Status: WORKING
- Evidence for status: 30349 — direct navigation call.

### F-PROF-004 Lifetime stats grid (Workouts / PRs / Total Sets / Volume)
- Location: Profile tab > ProfileScreen > 2×2 grid
- User action: passive
- Behavior: 1) `totalSets` = sum of `liftSets(w)` over history (30158); 2) `totalVol` = sum of `liftVolume(w)` (30159); 3) `prCount` = `Object.keys(prs).length` (30160); 4) volume shown as `Math.round(storedToUnit(totalVol, useKg)/1000) + "k " + unit` (30378)
- Components: ProfileScreen (30364-30419)
- Functions: `liftSets`, `liftVolume`, `storedToUnit` (4414, out of range)
- State: props `history`, `prs`, `useKg`
- Storage: none in range
- Network: none
- AI: none
- Edge cases: zero values render as `0` in muted colour (30415-30417)
- Gating: always on
- Status: WORKING
- Evidence for status: 30364-30419 — deterministic derivation from props.
- Notes: volume rounds to whole "k", so anything under 500 units displays "0k".

### F-PROF-005 Earned badges grid
- Location: Profile tab > ProfileScreen > Badges section
- User action: passive
- Behavior: 1) badges array built from thresholds: history≥1 "First Rep", ≥5, ≥10, ≥25; prCount≥1 "First PR", ≥5 "5 PRs"; totalSets≥100 "100 Sets" (30167-30207); 2) each rendered with tint `col+"12"` and border `col+"30"` (30437-30444); 3) empty state copy when none (30427-30435)
- Components: ProfileScreen (30420-30480)
- Functions: `readableAccent` (used at 30453, defined out of range)
- State: derived from props
- Storage: reads `lk_gamingLayer` via `ld("gamingLayer", false)` (30420)
- Network: none
- AI: none
- Edge cases: 0 badges → explainer card (30427)
- Gating: **gated on `gamingLayer` setting** (30420); off by default (`ld("gamingLayer", false)`)
- Status: WORKING
- Evidence for status: 30420-30480 — render is guarded and complete.
- Notes: comment at 30161-30165 documents a fixed bug where `var(--color-info)12` produced invalid colours; badge colours are now hex constants (`GR_H`, `BLU_H`, `OR_H`, `WA_H`, hardcoded `#06B6D4` at 30206).

### F-PROF-006 Locked (unearned) badges
- Location: Profile tab > ProfileScreen > Badges section, below earned
- User action: passive
- Behavior: locked list built for history<5, history<10, prCount<5 with "N more to go" copy (30208-30226); rendered in neutral grey `LOCKED_BADGE` tints (30482-30520)
- Components: ProfileScreen (30481-30541)
- Functions: none
- State: derived
- Storage: `lk_gamingLayer` (shares the F-PROF-005 gate, 30420)
- Network: none
- AI: none
- Edge cases: fully-earned users see no locked list
- Gating: `gamingLayer` (30420)
- Status: WORKING
- Evidence for status: 30481-30520 — renders inside the same guarded fragment.
- Notes: inline comments (30484-30489, 30508-30511) record deliberate accessibility decisions: no opacity fade (contrast), and grey tint instead of `var(--color-card)` to avoid a global radius/shadow rule. `LOCKED_BADGE = "#8E8E93"` (2029).

### F-PROF-007 Personal records list (top 6)
- Location: Profile tab > ProfileScreen > "Personal Records"
- User action: passive
- Behavior: 1) iterate `prs` keys, `getEx(parseInt(eid))` (30229-30231); 2) pick the entry with `r === 1` else first (30233-30235); 3) push {name, muscle, w, r, col}; 4) `slice(0,6)` (30244); 5) weight displayed via `kgToDisp(pr.w, useKg)` with kg/lb suffix (30546, 30578-30582)
- Components: ProfileScreen (30542-30583)
- Functions: `getEx`, `kgToDisp` (4430, out of range)
- State: props
- Storage: none in range
- Network: none
- AI: none
- Edge cases: section hidden entirely when `bestPRs.length === 0` (30542)
- Gating: always on (not gamified-gated)
- Status: WORKING
- Evidence for status: 30228-30244, 30542 — complete derivation and guard.
- Notes: hard cap of 6 with no "see all" affordance; `r` is collected but never displayed.

### F-PROF-008 Progress photo — capture from camera
- Location: Progress > ProgressPhotos > "Camera" button
- User action: taps Camera
- Behavior: 1) creates an ad-hoc `<input type=file accept=image/* capture=environment>` and `.click()`s it (30798-30805); 2) `handleFile` runs `resizeImage(file, 800, cb)` (30683); 3) `saveProgressPhoto(thumb, note.trim())` persists (30684); 4) on success `setPhotos(updated)` and clears the note (30691-30692); 5) input value reset (30694)
- Components: ProgressPhotos (30585-31491)
- Functions: `handleFile` (30681-30695); `resizeImage` (2878-2910); `saveProgressPhoto` (2856-2877)
- State: `photos`, `note`
- Storage: writes `lk_progressPhotos` (2856-2871)
- Network: none at capture time — images stay on device
- AI: none
- Edge cases: no file → early return (30682); quota failure → `saveProgressPhoto` returns null, previous list restored, note deliberately preserved (30685-30690, 2866-2871)
- Gating: always on
- Status: WORKING
- Evidence for status: 30681-30695 + 2856-2877 — full path with failure handling.
- Notes: `capture:"environment"` is a hint only; desktop browsers fall through to a file picker.

### F-PROF-009 Progress photo — pick from library
- Location: Progress > ProgressPhotos > "Library" button
- User action: taps Library
- Behavior: clicks the hidden persistent `fileRef` input (30843-30845, ref declared 30600, element 30765-30774) → same `handleFile` path as F-PROF-008
- Components: ProgressPhotos
- Functions: `handleFile` (30681-30695)
- State: `fileRef`, `photos`, `note`
- Storage: `lk_progressPhotos`
- Network: none
- AI: none
- Edge cases: same as F-PROF-008
- Gating: always on
- Status: WORKING
- Evidence for status: 30765-30774, 30843-30845.

### F-PROF-010 Progress photo note field
- Location: Progress > ProgressPhotos > textarea above Camera/Library
- User action: types an optional note
- Behavior: controlled textarea, 2 rows, placeholder "Optional note — e.g. Week 4, front pose" (30775-30797); value passed trimmed into `saveProgressPhoto` (30684); cleared on success (30692)
- Components: ProgressPhotos
- Functions: inline onChange (30777-30779)
- State: `note` (30589)
- Storage: stored inside each `lk_progressPhotos` entry as `note` (2859-2862)
- Network: none directly (note is NOT sent to the analysis endpoint — see F-PROF-016)
- AI: none
- Edge cases: no length limit enforced anywhere
- Gating: always on
- Status: WORKING
- Evidence for status: 30775-30797, 30684.

### F-PROF-011 Photo grid grouped by month
- Location: Progress > ProgressPhotos > grid
- User action: scroll/browse
- Behavior: 1) `groups` IIFE keys photos by `YYYY-MM` of `ph.date`, labels with `toLocaleDateString("en-US",{month:"long",year:"numeric"})` (30719-30748); 2) groups reversed so newest month first (30745-30747); 3) 3-column grid of square thumbnails with a bottom gradient showing short date and truncated note (30907-30990)
- Components: ProgressPhotos
- Functions: `groups` IIFE (30719-30748)
- State: `photos`
- Storage: reads `lk_progressPhotos` at mount (30587)
- Network: none
- AI: none
- Edge cases: empty → "Start Your Transformation" empty state (30861-30906)
- Gating: always on
- Status: WORKING
- Evidence for status: 30719-30748, 30907-30990.
- Notes: months are reversed but photos **within** a month keep insertion order (oldest first), so ordering is mixed.

### F-PROF-012 Photo count + "stored on device" label
- Location: Progress > ProgressPhotos > header
- User action: passive
- Behavior: renders `N photo(s) · stored on device` when `photos.length > 0` (30757-30763)
- Components: ProgressPhotos
- Functions: none
- State: `photos`
- Storage: none
- Network: none
- AI: none
- Edge cases: hidden at zero
- Gating: always on
- Status: WORKING — but the claim is only true until the user taps Analyse (see F-PROF-016)
- Evidence for status: 30763 vs 30626-30642 — the analyse call uploads `photo.thumb` off-device.
- Notes: **privacy finding.** Copy says "stored on device" while an AI action sends the image to a third-party worker.

### F-PROF-013 Open photo lightbox
- Location: Progress > ProgressPhotos > tap a thumbnail
- User action: taps a grid tile
- Behavior: `openLightbox(idx)` sets `lightbox`, clears `analysis`, clears `analysing` (30705-30709); rendered through `lkPortal` at `zIndex 99999` over a 96% black scrim (31031-31043); backdrop click closes (31032-31036)
- Components: ProgressPhotos
- Functions: `openLightbox` (30705-30709), `lkPortal` (5072)
- State: `lightbox`, `analysis`, `analysing`
- Storage: none
- Network: none
- AI: none
- Edge cases: guarded by `photos[lightbox]` existing (31030)
- Gating: always on
- Status: WORKING
- Evidence for status: 30705-30709, 31030-31043.

### F-PROF-014 Escape key closes lightbox
- Location: Progress > ProgressPhotos
- User action: presses Esc
- Behavior: `useEscape(lightbox !== null ? handler : null)` registers once for the component lifetime; handler clears lightbox, analysis, analysing (30594-30596)
- Components: ProgressPhotos
- Functions: `useEscape` (5160)
- State: `lightbox`, `analysis`, `analysing`
- Storage: none
- Network: none
- AI: none
- Edge cases: passing null keeps the entry inert (comment 30591-30593)
- Gating: always on
- Status: WORKING
- Evidence for status: 30594-30596.

### F-PROF-015 Lightbox prev / next navigation
- Location: Progress > lightbox footer arrows
- User action: taps ‹ or ›
- Behavior: `prevPhoto` wraps to last when at 0 (30710-30713); `nextPhoto` wraps to 0 at the end (30714-30717); both reset `analysis`/`analysing`; counter shows `lightbox+1 / photos.length` (31413-31419)
- Components: ProgressPhotos
- Functions: `prevPhoto` (30710-30713), `nextPhoto` (30714-30717)
- State: `lightbox`, `analysis`, `analysing`
- Storage: none
- Network: none
- AI: none
- Edge cases: single photo → both buttons no-op back to index 0
- Gating: always on
- Status: WORKING
- Evidence for status: 30710-30717.

### F-PROF-016 AI "Analyse Physique" (photo → Cloudflare Worker)
- Location: Progress > lightbox > "ANALYSE PHYSIQUE" button
- User action: taps the gradient button under the photo
- Behavior:
  1. guard `if (analysing) return` (30622)
  2. clear previous analysis, set spinner (30623-30624)
  3. read `ld("profile", null) || {}` (30625)
  4. `fetch("https://lockedapi.cescocugliari.workers.dev/analyze-physique", { method:"POST", headers:{"Content-Type":"application/json"} })` (30626-30630)
  5. body: `{ base64: photo.thumb, profile: { goal, weight }, training: { weeklySetsPerMuscle: muscleVolumeSummary(history), splits: [ "<splitName> (day, day)" ] } }` (30631-30643)
  6. response parsed as `d.content[0].text` (Anthropic Messages-API shape), stripped of ```json fences, `JSON.parse`d (30644-30649)
  7. fallback 1: regex `/\{[\s\S]*\}/` then parse (30652-30655)
  8. fallback 2: whole text becomes `{summary:text, observations:[], strengths:[], focus:"", bodyComposition:"", qualifier:""}` (30656-30670)
  9. `.catch` stops spinner and toasts "Couldn't analyse that photo. Check your connection and try again." (30674-30680)
- Components: ProgressPhotos; result panels 31201-31355
- Functions: `analysePhoto` (30621-30680); `muscleVolumeSummary` (4715)
- State: `analysis`, `analysing`
- Storage: reads `lk_profile`; reads `lk_history` and `lk_splits` as fallbacks when props are absent (30637-30641). Result is **never persisted** — it is lost on close/prev/next.
- Network: `POST https://lockedapi.cescocugliari.workers.dev/analyze-physique`. Request: full base64 JPEG data-URI of the photo plus goal, weight, per-muscle weekly set counts, and split names. Response: Anthropic-style `{content:[{text}]}` carrying JSON with `summary`, `bodyComposition`, `observations[]`, `strengths[]`, `focus`, `weakPoints[]{muscle, evidence, prescription:{exercises[], setsPerWeek}}`, `qualifier`.
- AI: model and prompt live server-side in the Worker — **not present in this file**. Inputs: image + profile + training context. Outputs: the JSON above.
- Edge cases: non-JSON response → two-tier fallback; network error → toast; no HTTP status check (a 500 body still goes through `r.json()` and can throw into `.catch`); no timeout; no auth header
- Gating: always on — no premium/beta gate
- Status: WORKING (client side)
- Evidence for status: 30626-30680 — complete request/parse/error path.
- Notes: **privacy/security finding.** The photo leaves the device un-authenticated to a personal `workers.dev` subdomain. No consent prompt, no opt-out, and the screen simultaneously says "stored on device" (30763). No API key is present client-side (good), but the endpoint is unauthenticated from the client's point of view — UNVERIFIED whether the Worker enforces anything.

### F-PROF-017 Analysis result panels (summary / composition / observations / strengths / focus / qualifier)
- Location: Progress > lightbox > below the analyse button
- User action: passive after F-PROF-016
- Behavior: each section renders only if present — summary (31207-31226), BODY COMPOSITION (31227-31247), OBSERVATIONS bulleted (31248-31290), STRENGTHS with ✓ (31291-31329), FOCUS AREA (31330-31352), qualifier as fine print (31383-31391)
- Components: ProgressPhotos
- Functions: none
- State: `analysis`
- Storage: none
- Network: none
- AI: consumes F-PROF-016 output
- Edge cases: all sections optional; a bare-text fallback still shows via `summary`
- Gating: always on
- Status: WORKING
- Evidence for status: 31201-31391.

### F-PROF-018 Weak point → prescription cards
- Location: Progress > lightbox > "WEAK POINT → FIX"
- User action: passive
- Behavior: 1) for each `weakPoints[i]`, `prescription.exercises` ids are mapped through `getEx(parseInt(id,10))` and filtered to drop `name === "Unknown"` (31355-31357); 2) renders muscle, evidence, exercise names joined by ", " plus `· N sets/wk` (31358-31371)
- Components: ProgressPhotos (31353-31375)
- Functions: `getEx` (out of range)
- State: `analysis`
- Storage: none
- Network: none
- AI: consumes weakPoints from F-PROF-016
- Edge cases: unknown exercise ids silently dropped (31357)
- Gating: always on
- Status: WORKING
- Evidence for status: 31353-31371.

### F-PROF-019 "ADD TO SPLIT" from a weak point
- Location: Progress > lightbox > weak point card
- User action: taps ADD TO SPLIT, then picks a split day in the sheet
- Behavior: 1) button only renders when resolved exercises exist AND `p.splits.length > 0` AND `p.setSplits` is provided (31372); 2) sets `addTarget = {ids, muscle}` (31373); 3) bottom sheet lists every split × day (31404-31417); 4) `addFocusWork(exIds, splitId, dayIdx)` maps splits, appends only ids not already in `day.exIds` (30602-30617); 5) `logBetaActivity("physique_focus_added", {exIds})` (30618); 6) clears target, shows "Added to your split" for 2500ms (30619-30621)
- Components: ProgressPhotos
- Functions: `addFocusWork` (30602-30621), `logBetaActivity` (2772)
- State: `addTarget`, `addedMsg`; calls parent `p.setSplits`
- Storage: writes via parent's splits persistence; `lk_betaLog` written by `logBetaActivity` when beta is active (2772-2784)
- Network: none
- AI: consumes F-PROF-016 prescription
- Edge cases: no `setSplits` → `addFocusWork` early-returns (30603); no splits → button hidden
- Gating: requires at least one split
- Status: WORKING
- Evidence for status: 30602-30621, 31372-31374.
- Notes: the sheet is `position:fixed` with `zIndex 400` **inside** a `zIndex 99999` portal (31396) — it renders correctly only because it is a descendant; the z-index value is misleading.

### F-PROF-020 Delete a progress photo
- Location: Progress > lightbox footer > "Delete"
- User action: taps Delete twice
- Behavior: 1) `lkConfirm("delPhoto"+lightbox, "Tap Delete again to remove this photo for good.")` gates the first tap (31421-31423); 2) `removePhoto(idx)` filters the array, `sd("progressPhotos", updated)`, updates state, closes the lightbox and clears analysis (30696-30704)
- Components: ProgressPhotos
- Functions: `removePhoto` (30696-30704), `lkConfirm` (5179)
- State: `photos`, `lightbox`, `analysis`, `analysing`
- Storage: writes `lk_progressPhotos`
- Network: none
- AI: none
- Edge cases: `sd` return value is ignored here (30699) — unlike the save path, a failed delete write is silent
- Gating: always on
- Status: WORKING
- Evidence for status: 30696-30704, 31421-31423.
- Notes: comment at 31420 explains the double-tap rationale ("cannot be recreated").

### F-PROF-021 "Tap a photo → Analyse Physique" hint banner
- Location: Progress > ProgressPhotos > below the grid
- User action: passive
- Behavior: orange hint card rendered only when `photos.length > 0` (30991-31029)
- Components: ProgressPhotos
- Functions: none
- State: `photos`
- Storage: none
- Network: none
- AI: none
- Edge cases: hidden when empty
- Gating: always on
- Status: WORKING
- Evidence for status: 30991-31029.

### F-PROF-022 Progress photos empty state
- Location: Progress > ProgressPhotos
- User action: passive
- Behavior: camera icon + "Start Your Transformation" + explainer, shown when `photos.length === 0` (30861-30906)
- Components: ProgressPhotos
- Functions: none
- State: `photos`
- Storage: none
- Network: none
- AI: none
- Edge cases: n/a
- Gating: always on
- Status: WORKING
- Evidence for status: 30861-30906.

### F-PROF-023 Home layout — reorder blocks
- Location: Settings > Home Layout > BLOCKS > ▲ / ▼
- User action: taps up/down arrows on a block row
- Behavior: 1) `move(id, dir)` swaps adjacent entries in `layout.order`, bailing at the ends (31497-31509); 2) `setLayout` persists via `saveHomeLayout` then updates state (31493-31496)
- Components: LayoutEditor (31492-31755)
- Functions: `move` (31497-31509), `setLayout` (31493-31496), `saveHomeLayout` (26079-26081), `getHomeLayout` (26065-26078)
- State: `layout` (31492)
- Storage: reads/writes `lk_homeLayout`
- Network: none
- AI: none
- Edge cases: first row's ▲ and last row's ▼ are `disabled` and faded (31612-31625, 31634-31647)
- Gating: always on
- Status: WORKING
- Evidence for status: 31497-31509, 31493-31496.
- Notes: 14 blocks (26019-26061) — arrow-only reordering means moving a block from bottom to top is 13 taps. No drag handle.

### F-PROF-024 Home layout — hide / show a block
- Location: Settings > Home Layout > BLOCKS > Hide/Show button
- User action: taps Hide or Show
- Behavior: `toggleHide(id)` adds or deletes the key in `layout.hidden` and persists (31510-31518); row shows line-through and 0.45 opacity when hidden (31601, 31655)
- Components: LayoutEditor
- Functions: `toggleHide` (31510-31518)
- State: `layout.hidden`
- Storage: `lk_homeLayout`
- Network: none
- AI: none
- Edge cases: every block can be hidden — nothing prevents an empty Home page
- Gating: always on
- Status: WORKING
- Evidence for status: 31510-31518, 31658-31672.

### F-PROF-025 Home layout — quick actions (max 3)
- Location: Settings > Home Layout > QUICK ACTIONS
- User action: taps quick-action chips
- Behavior: 1) `toggleQuick(id)` removes if present; otherwise appends unless `q.length >= 3`, in which case it silently returns (31519-31530); 2) unselected chips are `disabled` + 0.45 opacity once 3 are chosen (31702-31718); 3) counter "(N/3 selected)" (31691)
- Components: LayoutEditor
- Functions: `toggleQuick` (31519-31530), `QUICK_ACTION_DEFS` (26082+)
- State: `layout.quick`
- Storage: `lk_homeLayout`
- Network: none
- AI: none
- Edge cases: hitting the cap gives **no feedback** — the return at 31526 is silent
- Gating: always on
- Status: WORKING
- Evidence for status: 31519-31530, 31702-31718.
- Notes: default quick set is `["water","checkin","food"]` (26076).

### F-PROF-026 Home layout — reset to default
- Location: Settings > Home Layout > "Reset to Default"
- User action: taps twice
- Behavior: `lkConfirm("resetLayout", "Tap again to reset your home layout.")` gates; then sets `{order: HOME_DEFAULT_ORDER.slice(), hidden: {}, quick: ["water","checkin","food"]}` (31721-31730)
- Components: LayoutEditor
- Functions: `lkConfirm` (5179)
- State: `layout`
- Storage: `lk_homeLayout`
- Network: none
- AI: none
- Edge cases: none
- Gating: always on
- Status: WORKING
- Evidence for status: 31721-31730.

### F-PROF-027 Home layout — back navigation
- Location: Settings > Home Layout > back chevron
- User action: taps ‹
- Behavior: calls `p.onBack` (31552-31560), which sets `settingsView` back to "main" (32109-32113)
- Components: LayoutEditor, SettingsScreen
- Functions: inline
- State: `settingsView`
- Storage: none
- Network: none
- AI: none
- Edge cases: none
- Gating: always on
- Status: WORKING
- Evidence for status: 31552-31560, 32109-32113.
- Notes: LayoutEditor fully replaces SettingsScreen's render (`if (settingsView === "layout") return ...`, 32109) — it is a sub-view, not a modal, so the device back gesture is not wired to it. UNVERIFIED whether hardware back is handled elsewhere.

### F-PROF-028 Push notifications master switch
- Location: Settings > NOTIFICATIONS card > "Push notifications"
- User action: taps the switch
- Behavior: 1) `toggleMain` guards on `!P || busy` (31782); 2) clears messages, sets busy; 3) if enabled → `await P.disable()` + "Notifications turned off."; else `await P.enable()` + "You're set — rest timers and daily reminders will arrive on this device." (31785-31786); 4) errors surface `e.message` or "Couldn't change notifications." (31787); 5) `reread()` re-pulls `P.status()` (31788, 31780)
- Components: NotificationsCard (31756-31944)
- Functions: `toggleMain` (31781-31790), `reread` (31780), `row` (31816-31840), `window.LOCKEDPush.enable/disable/status` (1915-1935, 1764-1772)
- State: `st`, `busy`, `err`, `note`
- Storage: `lk_pushEnabled` (1309), `lk_pushDeviceId` (1307), `lk_pushPrefs` (1308) — written by the push module
- Network: subscription/registration handled inside `window.LOCKEDPush` (outside range)
- AI: none
- Edge cases: `st.needsInstall` (iOS non-standalone) → Add-to-Home-Screen instructions instead of any control (31844-31849); `!st.supported` → "This browser doesn't support push notifications." (31850-31852); `permission === "denied"` → red block explaining browser/OS settings (31856-31860); "Working…" while busy (31936)
- Gating: always on where supported
- Status: WORKING
- Evidence for status: 31781-31790, 31844-31860.
- Notes: comment at 31750-31755 explains the switch doubles as the permission prompt (browsers require a user gesture).

### F-PROF-029 Notification preference — Rest timer
- Location: Settings > NOTIFICATIONS > "Rest timer"
- User action: taps the switch
- Behavior: `setPref({rest: prefs.rest === false})` — optimistic local state then `await P.setPrefs(patch)` then `reread()` (31863-31864, 31792-31801)
- Components: NotificationsCard
- Functions: `setPref` (31792-31801), `row` (31816-31840)
- State: `st.prefs`
- Storage: `lk_pushPrefs` (1308)
- Network: `P.setPrefs` (server-side subscription update, outside range)
- AI: none
- Edge cases: failure → "Couldn't save that — check your connection." (31800); optimistic update is **not** rolled back on failure — `reread()` is expected to correct it
- Gating: visible only when `st.enabled` (31862)
- Status: WORKING
- Evidence for status: 31792-31801, 31863-31864.
- Notes: default-on semantics (`prefs.rest !== false`), so an absent key means enabled.

### F-PROF-030 Notification preference — Training day + send time
- Location: Settings > NOTIFICATIONS > "Training day" and "Send at"
- User action: taps the switch; picks a time in the `<input type=time>`
- Behavior: toggle `setPref({training: prefs.training === false})` (31866-31867); when on, a `timeRow` renders with default "07:30" and writes `setPref({trainingTime: v})` only when `e.target.value` is non-empty (31868-31870, 31803-31814)
- Components: NotificationsCard
- Functions: `setPref` (31792), `timeRow` (31803-31814)
- State: `st.prefs.training`, `st.prefs.trainingTime`
- Storage: `lk_pushPrefs`
- Network: `P.setPrefs`
- AI: none
- Edge cases: cleared time input ignored (31808); `colorScheme` follows `isDarkMode` (31811)
- Gating: only when push enabled
- Status: WORKING
- Evidence for status: 31866-31870, 31803-31814.
- Notes: no timezone handling visible client-side — UNVERIFIED how the Worker interprets "07:30".

### F-PROF-031 Notification preference — Daily check-in + send time
- Location: Settings > NOTIFICATIONS > "Daily check-in"
- User action: switch + time picker
- Behavior: `setPref({checkin: prefs.checkin === false})` (31872-31873); time row default "08:00" → `setPref({checkinTime: v})` (31874-31876)
- Components: NotificationsCard
- Functions: `setPref`, `timeRow`
- State: `st.prefs.checkin`, `st.prefs.checkinTime`
- Storage: `lk_pushPrefs`
- Network: `P.setPrefs`
- AI: none
- Edge cases: sub-copy says "Skipped automatically once you've logged it" — server-side behaviour, UNVERIFIED here
- Gating: only when push enabled
- Status: WORKING
- Evidence for status: 31872-31876.

### F-PROF-032 Notification preference — Unfinished workout
- Location: Settings > NOTIFICATIONS > "Unfinished workout"
- User action: taps the switch
- Behavior: `setPref({idle: prefs.idle === false})`; copy "Asks after 30 quiet minutes instead of ending it for you" (31878-31879)
- Components: NotificationsCard
- Functions: `setPref`
- State: `st.prefs.idle`
- Storage: `lk_pushPrefs`
- Network: `P.setPrefs`
- AI: none
- Edge cases: the 30-minute window is enforced by `scheduleIdleCheck` (1915-1935, outside range)
- Gating: push enabled
- Status: WORKING
- Evidence for status: 31878-31879.

### F-PROF-033 Notification preference — Supplements
- Location: Settings > NOTIFICATIONS > "Supplements"
- User action: taps the switch
- Behavior: `setPref({supps: prefs.supps === false})` (31881-31882)
- Components: NotificationsCard
- Functions: `setPref`
- State: `st.prefs.supps`
- Storage: `lk_pushPrefs`
- Network: `P.setPrefs`
- AI: none
- Edge cases: none in range
- Gating: push enabled
- Status: WORKING
- Evidence for status: 31881-31882.

### F-PROF-034 Notification preference — Compounds
- Location: Settings > NOTIFICATIONS > "Compounds"
- User action: taps the switch
- Behavior: `setPref({compounds: prefs.compounds === false})`; copy notes it only fires "if performance tracking is on" (31884-31885)
- Components: NotificationsCard
- Functions: `setPref`
- State: `st.prefs.compounds`
- Storage: `lk_pushPrefs`
- Network: `P.setPrefs`
- AI: none
- Edge cases: the row renders even when `lk_perfTracking` is false, so a user can enable a notification that can never fire
- Gating: push enabled; effectively also gated on F-PROF-057
- Status: PARTIAL
- Evidence for status: 31884-31885 — no client-side link to `ld("perfTracking")`, the dependency is only stated in copy.

### F-PROF-035 Notification preference — Restock
- Location: Settings > NOTIFICATIONS > "Restock"
- User action: taps the switch
- Behavior: `setPref({restock: prefs.restock === false})` (31887-31888)
- Components: NotificationsCard
- Functions: `setPref`
- State: `st.prefs.restock`
- Storage: `lk_pushPrefs`
- Network: `P.setPrefs`
- AI: none
- Edge cases: none in range
- Gating: push enabled
- Status: WORKING
- Evidence for status: 31887-31888.

### F-PROF-036 Rest timer sound picker (Bell / Plates / Silent)
- Location: Settings > NOTIFICATIONS > "Rest timer sound"
- User action: taps one of three segment buttons
- Behavior: 1) `setSound(P.setSound(opt[0]))` persists and echoes back the accepted value (31900-31901); 2) unless "none", `P.playAlert(opt[0])` previews immediately (31902); 3) explanatory copy states a locked phone uses the system sound and no browser can change it (31894-31895)
- Components: NotificationsCard
- Functions: `P.getSound` (1809-1812), `P.setSound` (1813-1817), `P.playAlert` (1915-1935)
- State: `sound` (31762)
- Storage: `lk_pushSound` (1806) — written raw, not via `sd`
- Network: none
- AI: none
- Edge cases: `setSound` rejects unknown names and returns the current value (1814)
- Gating: push enabled
- Status: WORKING
- Evidence for status: 31890-31910, 1806-1817.
- Notes: sounds are synthesised with WebAudio, not files (comment 1800-1805).

### F-PROF-037 Send a test notification
- Location: Settings > NOTIFICATIONS > "Send a test notification"
- User action: taps the button
- Behavior: `sendTest` guards on `!P || testing`, calls `await P.test()`, then "Test sent — it should appear in a moment."; failure shows `e.message` or "Test failed." (31805-31812 → actual 31806-31813 region: 31805-31813); button label swaps to "Sending…" and is disabled (31913-31921)
- Components: NotificationsCard
- Functions: `sendTest` (31806-31814)
- State: `testing`, `note`, `err`
- Storage: none
- Network: `P.test()` (outside range)
- AI: none
- Edge cases: no timeout; if the push service silently drops the message the UI still reports success
- Gating: push enabled
- Status: WORKING
- Evidence for status: 31806-31814, 31913-31921.

### F-PROF-038 Text size / Dynamic Type
- Location: Settings > TEXT SIZE card
- User action: taps Default / Large / Larger / Largest
- Behavior: 1) initial value parsed from `ld("textScale", 100)` with `isNaN` guard (31946-31949); 2) `apply(v)` sets state, `sd("textScale", v)`, and sets `document.documentElement.style.fontSize = v === 100 ? "" : v + "%"` (31950-31954); 3) options `[[100,"Default"],[110,"Large"],[125,"Larger"],[150,"Largest"]]` (31955)
- Components: TextSizeCard (31945-31986)
- Functions: `apply` (31950-31954)
- State: `scale`
- Storage: reads/writes `lk_textScale`
- Network: none
- AI: none
- Edge cases: 100 clears the inline style rather than setting 100% (31953); `aria-pressed` set on each button (31968)
- Gating: always on
- Status: PARTIAL
- Evidence for status: 31950-31954 — the value persists, but nothing in this component re-applies it on boot; if no boot-time re-apply exists elsewhere the setting resets visually on reload. UNVERIFIED — confirm by grepping for another `documentElement.style.fontSize` assignment at startup.
- Notes: comment 31946-31948 explains this exists because an installed PWA has no Safari page zoom.

### F-PROF-039 On-device storage meter
- Location: Settings > ON-DEVICE STORAGE card
- User action: passive
- Behavior: 1) `lkStorageUsage()` sums `(key.length + value.length) * 2` bytes across all localStorage and isolates `lk_progressPhotos` (2456-2468); 2) budget hardcoded at `5 * 1024 * 1024` (2467); 3) refreshes on the `lockedStorageFull` window event and every 5000ms (31989-31998); 4) `pct` capped at 100 (32001); 5) `tight` at ≥80% turns the bar amber, the card border amber, and appends "Running low. Delete a few progress photos in Progress to keep saving." (32002, 32026-32029)
- Components: StorageCard (31987-32030)
- Functions: `mb` (32000), `lkStorageUsage` (2456-2468)
- State: `usage`
- Storage: reads every localStorage key (no writes)
- Network: none
- AI: none
- Edge cases: read errors swallowed (2465); the 5 MB budget is an assumption, not a measurement
- Gating: always on
- Status: WORKING
- Evidence for status: 31987-32030, 2456-2468.
- Notes: a 5s `setInterval` runs for the whole time Settings is open; hardcoded 5 MB is wrong on browsers with larger quotas.

### F-PROF-040 Home Layout entry (Settings → Customize)
- Location: Settings > PREFERENCES > HOME LAYOUT > "CUSTOMIZE"
- User action: taps CUSTOMIZE
- Behavior: `setSettingsView("layout")` (32191-32193) → LayoutEditor replaces the screen (32109-32113)
- Components: SettingsScreen (32031-33805)
- Functions: inline
- State: `settingsView` (32033)
- Storage: none
- Network: none
- AI: none
- Edge cases: none
- Gating: always on
- Status: WORKING
- Evidence for status: 32109-32113, 32191-32193.

### F-PROF-041 Cloud sync status readout
- Location: Settings > ACCOUNT > CLOUD SYNC
- User action: passive
- Behavior: 1) "Never synced on this device" if no `lastSync` (32260); 2) same-day → "Last synced 4:32 PM"; ≤7 days → weekday + clock; older → "Mar 3 — 41 days ago" (32261-32268); 3) state chip: Synced ✓ / Syncing… / Failed / "Paused — workout open" / "Not signed in" / Idle with a colour dot (32275-32293)
- Components: SettingsScreen
- Functions: inline IIFE (32256-32269), `isoDay` (out of range)
- State: `syncStatus` (32071-32077, seeded from `window.LOCKED.syncStatus`)
- Storage: none in range
- Network: none for display
- AI: none
- Edge cases: `syncStatus` is snapshotted at mount and only updated by the manual button — it does **not** subscribe to sync events
- Gating: hidden for guests (32234)
- Status: PARTIAL
- Evidence for status: 32071-32077 vs 32295-32340 — no listener/interval refreshes `syncStatus`, so a background sync completing while Settings is open is not reflected.
- Notes: comment 32250-32255 documents the date-formatting fix (a stale June sync used to read as "Last synced 4:32 PM").

### F-PROF-042 "SYNC NOW" manual sync
- Location: Settings > ACCOUNT > CLOUD SYNC > button
- User action: taps SYNC NOW
- Behavior: 1) guards `!window.LOCKED || syncLoading` (32296); 2) `await window.LOCKED.forceSync()` (32300); 3) re-reads `window.LOCKED.syncStatus`; success toast "Sync complete" when state === "synced" (32305-32307); otherwise `setSyncErr("Sync finished but reported: <state>. Check your connection.")` (32309); 4) throw → state set to error, message shown inline and as an error toast (32311-32320)
- Components: SettingsScreen
- Functions: inline async onClick (32295-32323)
- State: `syncLoading`, `syncErr`, `syncStatus`
- Storage: none in range
- Network: `window.LOCKED.forceSync()` (outside range)
- AI: none
- Edge cases: button disabled + "SYNCING…" + 0.65 opacity while running (32324-32339)
- Gating: signed-in only (32234)
- Status: WORKING
- Evidence for status: 32295-32323.

### F-PROF-043 Account email display
- Location: Settings > ACCOUNT card
- User action: passive
- Behavior: `acctEmail` read once from `window.LOCKED.session.user.email` (32068-32070), rendered with `wordBreak: break-all` (32357-32364)
- Components: SettingsScreen
- Functions: none
- State: `acctEmail`
- Storage: none
- Network: none
- AI: none
- Edge cases: empty string hides the line (32357); accessing `.session.user` without an optional chain would throw if `session` existed without `user` — guarded only by the `window.LOCKED && window.LOCKED.session` check (32069)
- Gating: signed-in only (32341)
- Status: WORKING
- Evidence for status: 32068-32070, 32357-32364.

### F-PROF-044 Sign out
- Location: Settings > ACCOUNT > "Sign Out"
- User action: taps Sign Out
- Behavior: `window.LOCKED.signOut()` (32366-32368) — **no confirmation**
- Components: SettingsScreen
- Functions: inline
- State: none
- Storage: none in range
- Network: delegated
- AI: none
- Edge cases: no loading state, no error surface
- Gating: signed-in only
- Status: WORKING
- Evidence for status: 32366-32368.
- Notes: unguarded destructive-ish action sitting directly above the password fields.

### F-PROF-045 Guest mode card (Settings)
- Location: Settings > ACCOUNT > GUEST MODE
- User action: taps SIGN UP
- Behavior: card renders when `window.LOCKED.isGuest` (32204); copy: "Your data lives on this device only. Create an account to enable cloud backup and sync across devices."; button calls `upgradeFromGuest()` (32227-32229)
- Components: SettingsScreen (32204-32233)
- Functions: inline
- State: global
- Storage: none
- Network: delegated
- AI: none
- Edge cases: mutually exclusive with the sync/account cards (32234, 32341)
- Gating: guests only
- Status: UNVERIFIED
- Evidence for status: 32228 — `upgradeFromGuest` is out of range.

### F-PROF-046 Change password
- Location: Settings > ACCOUNT > CHANGE PASSWORD
- User action: types a new password twice, taps Update Password
- Behavior: validation in order — 1) `!pwNew || pwNew.length < 8` → "Minimum 8 characters" (32431-32437); 2) missing uppercase / lowercase / digit → "Needs uppercase, lowercase, and a number" (32438-32444); 3) mismatch → "Passwords don't match" (32445-32451); 4) `await window.LOCKED.changePassword(pwNew)` → "Password updated" and both fields cleared (32453-32461); 5) throw → `e.message` or "Failed to update password" (32462-32467)
- Components: SettingsScreen (32370-32491)
- Functions: inline async onClick (32430-32469)
- State: `pwNew`, `pwConfirm`, `pwMsg`, `pwLoading`
- Storage: none
- Network: `window.LOCKED.changePassword` (outside range)
- AI: none
- Edge cases: no current-password re-authentication requested; button disabled + "Updating…" while loading (32470-32489); typing clears the message (32379, 32399)
- Gating: signed-in only
- Status: WORKING
- Evidence for status: 32430-32469.
- Notes: **security note** — password change with no re-auth step in the client; whether the backend requires a fresh session is UNVERIFIED.

### F-PROF-047 Display name edit + Save Name
- Location: Settings > PROFILE card
- User action: types a name, taps "Save Name"
- Behavior: controlled input (32511-32530); `if (name.trim()) p.updateProfile({displayName: name.trim()})` (32541-32545)
- Components: SettingsScreen
- Functions: inline
- State: `name` (32048)
- Storage: persisted by parent `updateProfile` (writes `lk_profile`, outside range)
- Network: none in range
- AI: none
- Edge cases: whitespace-only input silently does nothing (32542); no success feedback; no length limit
- Gating: always on
- Status: WORKING
- Evidence for status: 32541-32545.

### F-PROF-048 Username display (read-only)
- Location: Settings > PROFILE card
- User action: passive
- Behavior: renders `"Username: @" + p.profile.username` (32531-32540)
- Components: SettingsScreen
- Functions: none
- State: props
- Storage: none
- Network: none
- AI: none
- Edge cases: no edit path anywhere in range
- Gating: always on
- Status: WORKING (read-only by design)
- Evidence for status: 32531-32540.

### F-PROF-049 About Me — Age
- Location: Settings > ABOUT ME
- User action: types age
- Behavior: `inputMode:"numeric"`, onChange strips non-digits `replace(/[^0-9]/g,"")` (32586-32588); placeholder "e.g. 19"; committed by Save Stats (F-PROF-054) as `parseInt(bodyAge) || null` (32770)
- Components: SettingsScreen
- Functions: inline
- State: `bodyAge` (32049)
- Storage: via `updateProfile` → `lk_profile`
- Network: none
- AI: none
- Edge cases: no min/max — "999" is accepted
- Gating: always on
- Status: WORKING
- Evidence for status: 32586-32588, 32770.

### F-PROF-050 About Me — Sex (Male / Female)
- Location: Settings > ABOUT ME
- User action: taps a segment
- Behavior: two buttons over `["Male","Female"]`, active state styled with `OR` border and `OR_H+"15"` fill (32617-32642); saved as `bodySex || null` (32771)
- Components: SettingsScreen
- Functions: inline
- State: `bodySex` (32050)
- Storage: `lk_profile` via `updateProfile`
- Network: none
- AI: none
- Edge cases: no way to clear once set; no other options
- Gating: always on
- Status: WORKING
- Evidence for status: 32617-32642, 32771.

### F-PROF-051 About Me — Body weight (unit-aware)
- Location: Settings > ABOUT ME > "Body Weight (kg|lbs)"
- User action: types a weight
- Behavior: 1) initial value `fmtQ(p.useKg ? profile.weightKg : profile.weightKg * 2.20462)` (32083-32086); 2) input strips to digits and "." (32661-32663); 3) label and placeholder swap on `p.useKg` (32649, 32664); 4) saved as `bwKg = useKg ? bw : bw / 2.20462` (32768-32769)
- Components: SettingsScreen
- Functions: inline; `fmtQ` (out of range)
- State: `bodyWeight` (32082-32087)
- Storage: `lk_profile.weightKg` — always stored in **kg**
- Network: none
- AI: none
- Edge cases: multiple "." characters pass the filter and `parseFloat` truncates at the second one (32662); empty → null (32767)
- Gating: always on
- Status: WORKING
- Evidence for status: 32082-32087, 32767-32769.
- Notes: the initial-state derivation runs once at mount, so toggling the unit while on Settings does not reformat the field until remount. UNVERIFIED whether the parent remounts SettingsScreen on unit change.

### F-PROF-052 About Me — Height (cm, or ft + in)
- Location: Settings > ABOUT ME > "Height"
- User action: types cm, or ft and in
- Behavior: 1) `heightCm` seeded as `Math.round(profile.heightCm)` (32091); 2) `heightFt = floor(heightCm/30.48)` (32092-32095); 3) `heightIn = round((heightCm/2.54) % 12)` (32096-32100); 4) when `p.useKg` a single cm field renders, otherwise two fields (32672-32735); 5) saved as `hcm = useKg ? parseInt(heightCm)||null : ((ft*12)+in)*2.54 || null` (32772)
- Components: SettingsScreen
- Functions: inline
- State: `heightCm`, `heightFt`, `heightIn`
- Storage: `lk_profile.heightCm` — always stored in **cm**
- Network: none
- AI: none
- Edge cases: 11.6 inches rounds to 12, producing e.g. "5 ft 12 in" (32099); imperial entry of 0 ft 0 in yields `0 * 2.54 || null` = null (32772)
- Gating: always on
- Status: PARTIAL
- Evidence for status: 32096-32100 — the inches rounding can render an invalid 12-inch value.
- Notes: height unit is derived from the **weight** unit toggle; there is no independent cm/in setting.

### F-PROF-053 About Me — Goal (Cut / Maintain / Bulk)
- Location: Settings > ABOUT ME > "Goal"
- User action: taps a segment
- Behavior: three buttons over `["Cut","Maintain","Bulk"]` (32746-32766); saved as `bodyGoal || null` (32774)
- Components: SettingsScreen
- Functions: inline
- State: `bodyGoal` (32051)
- Storage: `lk_profile.goal`
- Network: this value is read back and **sent to the physique-analysis endpoint** (30634)
- AI: feeds F-PROF-016 as `profile.goal`
- Edge cases: cannot be cleared once chosen
- Gating: always on
- Status: WORKING
- Evidence for status: 32746-32774.

### F-PROF-054 Save Stats
- Location: Settings > ABOUT ME > "Save Stats"
- User action: taps Save Stats
- Behavior: builds and commits `{displayName: p.profile.displayName, age, sex, weightKg, heightCm, goal}` via `p.updateProfile` (32765-32776)
- Components: SettingsScreen
- Functions: inline onClick (32765-32777)
- State: reads all About-Me state
- Storage: `lk_profile` via parent
- Network: none
- AI: none
- Edge cases: no validation, no success toast, no dirty indicator; note it re-sends `p.profile.displayName` (not the edited `name`), so Save Stats does **not** save a pending name edit
- Gating: always on
- Status: WORKING
- Evidence for status: 32769, 32765-32776.
- Notes: two separate save buttons on one screen (Save Name, Save Stats) is a known redesign hazard — an edited name plus tapping only Save Stats loses the name.

### F-PROF-055 Weight unit toggle (KG ↔ LBS)
- Location: Settings > PREFERENCES > "Weight Unit"
- User action: taps the pill
- Behavior: calls `p.toggleUnit` (32809); label reads "KG - Switch to LBS" or "LBS - Switch to KG" (32821)
- Components: SettingsScreen
- Functions: `p.toggleUnit` (parent, outside range)
- State: `p.useKg`
- Storage: parent-owned (see storage table); `storedWeightUnit()` (4379-4413) is the separate *storage* unit
- Network: none
- AI: none
- Edge cases: this is a **display** unit only — an explanatory row (F-PROF-058) says logs are stored in whichever unit `storedWeightUnit()` reports
- Gating: always on
- Status: WORKING
- Evidence for status: 32800-32822.
- Notes: comment at 32790-32791 records that a standalone UNITS card was removed and this is the single place the unit is set.

### F-PROF-056 Daily check-in frequency (1 / 2 / 4 per day)
- Location: Settings > PREFERENCES > "Daily check-ins"
- User action: taps Once a day / Twice / 4 times
- Behavior: `sd("checkinPerDay", opt[0])` then `setCheckinFreq(opt[0])` (32860-32863); options `[[1,"Once a day"],[2,"Twice"],[4,"4 times"]]` (32857); `checkinPerDay()` clamps to 1 unless the stored value is exactly 2 or 4 (52445-52448)
- Components: SettingsScreen
- Functions: `checkinPerDay` (52445-52448)
- State: `checkinFreq` (32032)
- Storage: reads/writes `lk_checkinPerDay`
- Network: none
- AI: none
- Edge cases: any other stored value falls back to 1 (52447); `aria-pressed` set; `minHeight: 44` respects tap-target guidance (32868)
- Gating: always on
- Status: WORKING
- Evidence for status: 32857-32874, 52445-52448.

### F-PROF-057 Theme / App Style picker
- Location: Settings > PREFERENCES > "App Style"
- User action: taps one of five theme swatches
- Behavior: 1) `THEMES.map` renders a 44×44 swatch painted `t.bg` with a `t.card` corner and a `t.accent` dot (32892-32950); 2) tap → `setTheme(t.id)` → `applyTheme` + `window.dispatchEvent(new Event("theme-changed"))` (2535-2538); 3) `applyTheme` sets `isDarkMode`, `data-style-profile` attribute, removes all of `ALL_THEME_CLASSES`, adds the matching class, updates `<meta name="theme-color">`, and `sd("theme", theme)` (2508-2532); 4) SettingsScreen listens for `theme-changed` and re-reads `ld("theme","dark")` into `activeTheme` (32039-32047)
- Components: SettingsScreen (32876-32952)
- Functions: `setTheme` (2535-2538), `applyTheme` (2508-2532), `initTheme` (2501-2507)
- State: `activeTheme` (32036-32038)
- Storage: reads/writes `lk_theme`
- Network: none
- AI: none
- Edge cases: no saved theme → `prefers-color-scheme: light` decides (2502-2506); active swatch gets an `OR_H` border, glow shadow and opacity 1 vs 0.8 (comment at 32908 notes 0.7 dropped the label under 4.5:1)
- Gating: always on
- Status: WORKING
- Evidence for status: 32892-32950, 2508-2538.
- Notes: see the Themes section below. The picker is **5** themes, not 4.

### F-PROF-058 Partial reps toggle
- Location: Settings > WORKOUT TRACKING > "Partial Reps"
- User action: taps the switch
- Behavior: `setPartialsEnabled(next); sd("hidePartials", !next)` — the stored key is **inverted** relative to the switch (32979-32983); initial state `!ld("hidePartials", false)` (32063-32065)
- Components: SettingsScreen
- Functions: inline
- State: `partialsEnabled`
- Storage: `lk_hidePartials` (inverted)
- Network: none
- AI: none
- Edge cases: none
- Gating: always on
- Status: WORKING
- Evidence for status: 32063-32065, 32979-32983.
- Notes: inverted key naming is a redesign trap — default (absent key) means partials **shown**.

### F-PROF-059 Streaks and badges toggle (`gamingLayer`)
- Location: Settings > WORKOUT TRACKING > "Streaks and badges"
- User action: taps the switch
- Behavior: `setGamingEnabled(next); sd("gamingLayer", next)` (33019-33023); default false (32066-32068)
- Components: SettingsScreen
- Functions: inline
- State: `gamingEnabled`
- Storage: `lk_gamingLayer`
- Network: none
- AI: none
- Edge cases: controls the Profile badges block (30420) and, per its copy, the streak counter elsewhere
- Gating: always on
- Status: WORKING
- Evidence for status: 32066-32068, 33019-33023, 30420.

### F-PROF-060 Weight-units explanation row
- Location: Settings > WORKOUT TRACKING > "Weight units"
- User action: passive
- Behavior: renders `"Your logs are stored in " + (storedWeightUnit() === "kg" ? "kilograms" : "pounds") + ". Switching your profile between kg and lb converts what you see — it never changes what was recorded."` (33069-33071)
- Components: SettingsScreen
- Functions: `storedWeightUnit` (4379-4413)
- State: none
- Storage: reads `lk_weightStorageUnit` (4384, incl. a raw-string fallback at 4388-4392)
- Network: none
- AI: none
- Edge cases: `storedWeightUnit` is memoised in `_storedWeightUnit` and falls back to derivation when unset (4380, 4400+)
- Gating: always on
- Status: WORKING
- Evidence for status: 33069-33071, 4379-4413.
- Notes: informational only — there is no control to change the *storage* unit.

### F-PROF-061 Export nutrition CSV
- Location: Settings > EXPORT MY DATA > "Nutrition CSV"
- User action: taps the button
- Behavior: `downloadText("locked-fuel-log.csv", exportFuelCSV(), "text/csv")` (33112-33114); `downloadText` builds a Blob, creates an `<a download>`, clicks it, and revokes the object URL after 500ms (19415-19428)
- Components: SettingsScreen
- Functions: `exportFuelCSV` (19376), `downloadText` (19415-19428)
- State: none
- Storage: reads the fuel/nutrition keys inside `exportFuelCSV` (outside range)
- Network: none — fully local
- AI: none
- Edge cases: no empty-data guard in range; filename is fixed (no date stamp), unlike the JSON backup
- Gating: always on
- Status: WORKING
- Evidence for status: 33112-33114, 19415-19428.

### F-PROF-062 Full backup (JSON) export
- Location: Settings > EXPORT MY DATA > "Full backup (JSON)"
- User action: taps the button
- Behavior: 1) `exportEverything()` walks every localStorage key and keeps those starting `lk_` or `__lk_ts__`, plus `__lk_last_sync__`, storing raw string values (19436-19452); 2) envelope `{format:"locked-full-backup", version:1, exportedAt, keys:{}, keyCount}`; 3) key count parsed back out of the JSON for the toast (33134-33136); 4) `downloadText("locked-full-backup-" + isoDay() + ".json", json, "application/json")` (33137); 5) toast "Backed up N keys — keep this file somewhere safe." (33138-33140)
- Components: SettingsScreen
- Functions: `exportEverything` (19436-19452), `downloadText`, `isoDay`
- State: none
- Storage: reads **all** `lk_*` keys — including `lk_progressPhotos` (base64 images) and `lk_betaLog`/`lk_betaAILog`
- Network: none
- AI: none
- Edge cases: read failure recorded as `out.error` but the file still downloads (19449); no size warning — a photo-heavy account produces a multi-megabyte JSON
- Gating: always on
- Status: WORKING
- Evidence for status: 33131-33141, 19436-19452.
- Notes: comment 33128-33131 records the fix — the button previously said "Everything" but shipped only the food diary.

### F-PROF-063 Restore from backup
- Location: Settings > EXPORT MY DATA > "Restore from backup" (label-wrapped file input)
- User action: picks a `.json` backup file
- Behavior: 1) `FileReader.readAsText` (33196); 2) `importEverything(String(reader.result), false)` — `overwrite = false` (33177); 3) `importEverything` rejects anything whose `format !== "locked-full-backup"` with "That is not a LOCKED backup file." (19456-19458); 4) additive merge: a key is skipped when the local `__lk_ts__` is newer than or equal to the backup's stamp (or `exportedAt` as fallback) (19470-19483); 5) values written first, timestamps second, deliberately (comment 19473-19480); 6) toast "Restored N keys. Reloading…" then `window.location.reload()` after 1200ms (33178-33183); 7) parse/other errors → error toast with `err.message` or "That file could not be read." (33184-33188); 8) input value reset (33197)
- Components: SettingsScreen (33144-33200)
- Functions: `importEverything` (19454+), inline reader handlers
- State: none
- Storage: writes arbitrary `lk_*` and `__lk_ts__*` keys from the file
- Network: none
- AI: none
- Edge cases: no confirmation before overwriting; helper copy advises airplane mode first (33199)
- Gating: always on
- Status: WORKING
- Evidence for status: 33170-33199, 19454-19483.
- Notes: **security consideration** — a hostile JSON file can set any `lk_*` key, including `lk_betaStatus`, `lk_perfTracking`, and `lk_theme`. Only the envelope `format` field is validated; key names and values are not.

### F-PROF-064 Voice / microphone button toggle
- Location: Settings > VOICE COMMANDS > "Microphone Button"
- User action: taps the switch
- Behavior: `setVoiceEnabledState(next); sd("voiceEnabled", next); window.dispatchEvent(new Event("lockedVoiceToggle"))` (33245-33250); a mount effect subscribes to the same event to re-sync from storage (32088-32096); default true (32060-32062)
- Components: SettingsScreen
- Functions: inline; effect `sync` (32089-32091)
- State: `voiceEnabled`
- Storage: `lk_voiceEnabled`
- Network: none
- AI: none
- Edge cases: cross-component sync is event-based, so another surface toggling it updates this switch
- Gating: always on
- Status: WORKING
- Evidence for status: 32060-32096, 33245-33250.

### F-PROF-065 Performance tracking (cycle logging) toggle
- Location: Settings > PERFORMANCE TRACKING > "Cycle Logging"
- User action: taps the switch
- Behavior: `var cur = ld("perfTracking", false); sd("perfTracking", !cur); window.location.reload();` (33307-33311); the switch's rendered state reads `ld("perfTracking", false)` **directly from storage on every render** rather than from React state (33313, 33319, 33361)
- Components: SettingsScreen (33272-33366)
- Functions: inline
- State: none — deliberately storage-backed with a full page reload
- Storage: `lk_perfTracking`
- Network: none
- AI: none
- Edge cases: full reload discards any unsaved name/stats edits on the screen; no confirmation
- Gating: always on
- Status: PARTIAL
- Evidence for status: 33307-33311 — functional, but the mandatory `window.location.reload()` silently drops in-progress edits elsewhere on the same screen.
- Notes: the only toggle in Settings that reloads the app; switch renders red (`RE`) rather than orange when on (33319).

### F-PROF-066 Beta invite code entry + verification
- Location: Settings > BETA TESTING (shown only when `!isBeta`)
- User action: types a code, taps Verify
- Behavior: 1) input uppercases on change and clears the error (33398-33401); 2) empty → "Enter a code" (33417-33420); 3) `validateBetaCodeRemote(code, cb)` runs a local `validateBetaCode` shape check then `POST https://lockedapi.cescocugliari.workers.dev/beta-validate` with `{code}` (2729-2748); 4) `!d.valid` → "Invalid code"; `d.locked` → "This code is no longer available"; else success (2745-2752); 5) success sets `settingsBetaVerified` (33422-33427)
- Components: SettingsScreen (33371-33443)
- Functions: `validateBetaCodeRemote` (2729-2756)
- State: `settingsBetaCode`, `settingsBetaErr`, `settingsBetaVerified`
- Storage: none at this step
- Network: `POST .../beta-validate`, body `{code:"UPPERCASE"}`, response `{valid, locked}`
- AI: none
- Edge cases: **network failure calls `onResult(true, null)` — it fails open and treats the code as valid** (2753-2755)
- Gating: hidden once `lk_betaStatus` is true (33371)
- Status: WORKING (with a fail-open defect)
- Evidence for status: 2753-2755 — the `.catch` grants access.
- Notes: **security finding.** Beta gating can be bypassed by taking the device offline before tapping Verify.

### F-PROF-067 Beta tester agreement + activation
- Location: Settings > BETA TESTING > agreement panel
- User action: reads the agreement, taps "I Agree — Activate Beta"
- Behavior: 1) panel shows only when `settingsBetaVerified && !settingsBetaAgreed` (33443); 2) discloses collection of workout data, AI coach interactions, check-in entries, nutrition/weight logs, and app usage activity (33463-33465); 3) states data is not shared with third parties and participation can stop at any time (33466-33472); 4) includes an anti-reverse-engineering clause (33473-33479); 5) tap → `claimBetaCode(code, p.profile.username || "user")` which marks the local code used and writes `lk_betaCodes`, `lk_betaStatus=true`, `lk_betaCode`, `lk_betaId` (2757-2771); 6) sets `settingsBetaAgreed`, `settingsBetaOk`, `isBeta` (33481-33486); 7) "Beta activated!" confirmation (33504-33510)
- Components: SettingsScreen (33443-33510)
- Functions: `claimBetaCode` (2757-2771)
- State: `settingsBetaAgreed`, `settingsBetaOk`, `isBeta`
- Storage: writes `lk_betaCodes`, `lk_betaStatus`, `lk_betaCode`, `lk_betaId`
- Network: none at this step — the claim is purely local
- AI: none
- Edge cases: there is **no opt-out control** anywhere in this range despite the "stop participating at any time" promise
- Gating: requires successful verification
- Status: PARTIAL
- Evidence for status: 33468 promises withdrawal; no code in 30153-33807 clears `lk_betaStatus` except the global Reset (F-PROF-072).
- Notes: `claimBetaCode` mutates a **local** `lk_betaCodes` list, so the code is not marked used server-side — the same code works on another device.

### F-PROF-068 Beta status card (status, code, last sync)
- Location: Settings > BETA card
- User action: passive
- Behavior: renders when `isBeta && !isSilentBeta()` (33511); shows "Status: Active", `ld("betaCode", "")` when present (33540-33549), and "Last sync: " + `ld("lastSync", "Never")` (33550-33557)
- Components: SettingsScreen (33511-33557)
- Functions: `isSilentBeta` (2796-2799)
- State: `isBeta` (32057-32059)
- Storage: reads `lk_betaCode`, `lk_lastSync`, `lk_betaId`
- Network: none
- AI: none
- Edge cases: `SILENT_BETA_IDS = ["summerbeta"]` hides the whole card for that cohort (2795-2799)
- Gating: beta users, excluding silent-beta ids
- Status: WORKING
- Evidence for status: 33511, 2796-2799.
- Notes: hardcoded cohort id `"summerbeta"` at 2795.

### F-PROF-069 "Send Data to Dev" (beta sync)
- Location: Settings > BETA card > green button
- User action: taps Send Data to Dev
- Behavior: `syncBetaData(onDone, onFail)` (33559-33566); success toast "Data synced", failure toast "Sync failed. Check your connection and retry."; `syncBetaData` posts to `SYNC_URL = "https://lockedapi.cescocugliari.workers.dev/beta-sync"` (2794) with a payload including `betaLog`, `betaAILog`, `feedback`, `weightLog` and more (2800-2820)
- Components: SettingsScreen
- Functions: `syncBetaData` (2800+)
- State: none
- Storage: reads `lk_betaLog`, `lk_betaAILog`, `lk_feedback`, `lk_weightLog`, `lk_betaId`
- Network: `POST .../beta-sync`
- AI: none
- Edge cases: no `betaId` → immediate `onFail("No beta ID")` (2802-2805)
- Gating: beta, non-silent
- Status: WORKING
- Evidence for status: 33559-33566, 2800-2805.
- Notes: an empty statement `;` sits inside the success callback (33562) — harmless dead code.

### F-PROF-070 "Force Refresh App"
- Location: Settings > BETA card > orange button
- User action: taps Force Refresh App
- Behavior: 1) `localStorage.removeItem("lk_deployVersion")` (33585); 2) if `"caches" in window`, delete every cache then `window.location.reload(true)`; `.catch` also reloads (33587-33599); 3) else reload directly (33601)
- Components: SettingsScreen
- Functions: inline
- State: none
- Storage: removes `lk_deployVersion`
- Network: none directly
- AI: none
- Edge cases: comment 33586-33587 states the service worker is deliberately **not** unregistered because that would drop the push subscription
- Gating: beta, non-silent
- Status: WORKING
- Evidence for status: 33585-33601.
- Notes: `reload(true)` is a long-deprecated non-standard argument, ignored by modern browsers.

### F-PROF-071 Replay Tutorial
- Location: Settings > HELP card
- User action: taps "🎯 Replay Tutorial"
- Behavior: `if (p.onShowTutorial) p.onShowTutorial()` (33628-33630)
- Components: SettingsScreen (33607-33654)
- Functions: `p.onShowTutorial` (parent)
- State: none
- Storage: none in range
- Network: none
- AI: none
- Edge cases: silently no-ops when the prop is absent (33629)
- Gating: always on
- Status: UNVERIFIED
- Evidence for status: 33629 — the handler is supplied by a parent outside this range.

### F-PROF-072 Reset all data (arm → confirm)
- Location: Settings > DANGER ZONE > "Reset all data"
- User action: taps once to arm, again to erase
- Behavior:
  1. first tap sets `resetArmed` and returns (33668-33671)
  2. records `wasGuest = !!localStorage.getItem("lk_guestMode")` (33673)
  3. deletes every key starting `lk_` or `__lk_ts__` (33675-33677)
  4. if the user was a guest, re-writes `lk_guestMode = "1"` so they land in a fresh app rather than the sign-in overlay (33678-33681)
  5. if signed in with `auth.isLoggedIn && auth.signOut`, awaits sign-out then reloads (33685-33692) — the comment at 33682-33684 explains that without this the next boot re-syncs everything back from the cloud
  6. otherwise reload (33693)
  7. armed state shows a red filled button labelled "Tap again to erase everything", plus a Cancel button and the warning "This erases every workout, PR, photo, goal and log on this device. It cannot be undone." (33706-33736)
- Components: SettingsScreen (33655-33736)
- Functions: inline onClick (33665-33694)
- State: `resetArmed` (32079)
- Storage: removes all `lk_*` and `__lk_ts__*` keys; preserves `lk_guestMode` for guests. Note `__lk_last_sync__` is **not** in the delete filter (33676) even though it is included in the backup filter (19446).
- Network: `auth.signOut()` for signed-in users
- AI: none
- Edge cases: entire body wrapped in `try/catch {}` with an empty catch (33674, 33683) — a mid-loop failure is invisible; no cloud data is deleted, only the local copy plus the session
- Gating: always on
- Status: WORKING
- Evidence for status: 33665-33694.
- Notes: this is local-only. A signed-in user who resets and signs back in gets everything back from the cloud — UNVERIFIED whether `signOut` also clears the server copy (nothing here suggests it does).

### F-PROF-073 Delete Account (two-step, destructive)
- Location: Settings > DANGER ZONE > "Delete Account"
- User action: taps Delete Account, then "Yes, Delete" in the inline panel
- Behavior: 1) first tap sets `deleteConfirm` (33737-33753); 2) panel: "This cannot be undone." + "Your account, subscription, and all stored data will be permanently deleted." (33755-33777); 3) Cancel resets the flag (33780-33795); 4) confirm → `setDeleteLoading(true)`, `await window.LOCKED.deleteAccount()` (33797-33800); 5) on throw, toast "Delete failed: " + message, clear loading and confirm (33801-33805)
- Components: SettingsScreen (33737-33805)
- Functions: inline async onClick (33796-33806), `window.LOCKED.deleteAccount` (outside range)
- State: `deleteConfirm`, `deleteLoading`
- Storage: none written in range
- Network: `window.LOCKED.deleteAccount()`
- AI: none
- Edge cases: no success path in range — the code assumes `deleteAccount` navigates or reloads; button disabled + "Deleting…" while running (33806)
- Gating: rendered for all users, including guests (it sits outside the `isGuest` guards)
- Status: PARTIAL
- Evidence for status: 33797-33805 — only the failure branch is handled; success behaviour is entirely delegated and unverified. A guest with no account can still tap it.
- Notes: no typed confirmation (e.g. typing "DELETE"), no password re-entry, and no local data wipe on the client side.

### F-PROF-074 Section headers and embedded shared cards
- Location: Settings > various
- User action: passive
- Behavior: section labels "PREFERENCES" (32164), "ACCOUNT" (32196), "DATA & SYNC" rendered **twice** (33091 via `className:"ds-section-hd"` and 33366-33371 as an inline-styled `<p>`), "HELP & DANGER ZONE" (33602). Shared cards mounted here but defined outside the range: `FuelDisplayCard` (33089, defined 21550), `PrivacyCard` (33094, defined 21678), plus in-range `NotificationsCard` (32952), `TextSizeCard` (33095), `StorageCard` (33096)
- Components: SettingsScreen
- Functions: none
- State: none
- Storage: none
- Network: none
- AI: none
- Edge cases: duplicated "DATA & SYNC" heading with two different styling mechanisms
- Gating: always on
- Status: PARTIAL
- Evidence for status: 33091 and 33366 — the same heading text appears twice with inconsistent styling, splitting the section.
- Notes: for the redesign, the section grouping is inconsistent: Export/Restore, Voice, Performance Tracking and Beta all sit between the two "DATA & SYNC" headings.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| ProfileScreen | component | 30153-30584 | Profile tab: identity, lifetime stats, badges, PRs | app router | liftSets, liftVolume, storedToUnit, kgToDisp, getEx, readableAccent, ld, Ic | F-PROF-001..007 |
| ProfileScreen guest-signup onClick | handler | 30281-30283 | Launch guest upgrade | ProfileScreen | window.LOCKED.upgradeFromGuest | F-PROF-001 |
| ProfileScreen settings onClick | handler | 30348-30350 | Navigate to Settings | ProfileScreen | p.go | F-PROF-003 |
| ProfileScreen stats map cb | handler | 30380-30419 | Render one stat tile | ProfileScreen | — | F-PROF-004 |
| ProfileScreen badges map cb | handler | 30436-30480 | Render one earned badge | ProfileScreen | readableAccent | F-PROF-005 |
| ProfileScreen locked map cb | handler | 30481-30520 | Render one locked badge | ProfileScreen | — | F-PROF-006 |
| ProfileScreen prs forEach cb | handler | 30229-30243 | Build bestPRs from the PR map | ProfileScreen | getEx | F-PROF-007 |
| ProfileScreen bestPRs map cb | handler | 30545-30583 | Render one PR row | ProfileScreen | kgToDisp, Ic | F-PROF-007 |
| ProgressPhotos | component | 30585-31491 | Progress-photo gallery, lightbox and AI analysis | Progress screen | ld, sd, useEscape, lkPortal, resizeImage, saveProgressPhoto, lkConfirm, muscleVolumeSummary, getEx, logBetaActivity | F-PROF-008..022 |
| addFocusWork | function | 30602-30621 | Append prescribed exercises to a chosen split day | ADD-TO-SPLIT sheet | p.setSplits, logBetaActivity, setTimeout | F-PROF-019 |
| analysePhoto | function | 30621-30680 | POST photo + context to the physique-analysis Worker and parse JSON | ANALYSE PHYSIQUE button | fetch, ld, muscleVolumeSummary, JSON.parse, window.LOCKED.toast | F-PROF-016, F-PROF-017, F-PROF-018 |
| handleFile | function | 30681-30695 | Resize and persist a chosen/captured image | Camera + Library inputs | resizeImage, saveProgressPhoto | F-PROF-008, F-PROF-009 |
| removePhoto | function | 30696-30704 | Delete one photo and close the lightbox | Delete button | sd | F-PROF-020 |
| openLightbox | function | 30705-30709 | Open the lightbox at an index, resetting analysis | grid tile | — | F-PROF-013 |
| prevPhoto | function | 30710-30713 | Wrap to the previous photo | ‹ button | — | F-PROF-015 |
| nextPhoto | function | 30714-30717 | Wrap to the next photo | › button | — | F-PROF-015 |
| groups (IIFE) | function | 30719-30748 | Group photos by month, newest month first | ProgressPhotos render | Date, toLocaleDateString | F-PROF-011 |
| ProgressPhotos camera onClick | handler | 30798-30806 | Build and click a capture input | ProgressPhotos | handleFile | F-PROF-008 |
| ProgressPhotos library onClick | handler | 30843-30845 | Click the hidden file input | ProgressPhotos | — | F-PROF-009 |
| ProgressPhotos escape handler | handler | 30594-30596 | Close the lightbox on Esc | useEscape | — | F-PROF-014 |
| ProgressPhotos group map cb | handler | 30907-30990 | Render a month section of thumbnails | ProgressPhotos | openLightbox | F-PROF-011 |
| ProgressPhotos delete onClick | handler | 31419-31424 | Two-tap delete guard | lightbox footer | lkConfirm, removePhoto | F-PROF-020 |
| ProgressPhotos weakPoints map cb | handler | 31354-31375 | Render one weak point and its prescription | ProgressPhotos | getEx | F-PROF-018, F-PROF-019 |
| ProgressPhotos addTarget sheet map cb | handler | 31404-31417 | Render one split-day target row | ProgressPhotos | addFocusWork | F-PROF-019 |
| LayoutEditor | component | 31492-31755 | Home-screen layout editor | SettingsScreen (settingsView==="layout") | getHomeLayout, saveHomeLayout, lkConfirm, Ic | F-PROF-023..027 |
| setLayout | function | 31493-31496 | Persist and set layout state | move, toggleHide, toggleQuick, reset | saveHomeLayout | F-PROF-023..026 |
| move | function | 31497-31509 | Swap a block with its neighbour | ▲/▼ buttons | setLayout | F-PROF-023 |
| toggleHide | function | 31510-31518 | Add/remove a block from `hidden` | Hide/Show button | setLayout | F-PROF-024 |
| toggleQuick | function | 31519-31530 | Toggle a quick action, capped at 3 | quick chips | setLayout | F-PROF-025 |
| labelOf | function | 31531-31536 | Map a block id to its display label | LayoutEditor render | HOME_BLOCK_DEFS.find | F-PROF-023 |
| LayoutEditor reset onClick | handler | 31721-31730 | Two-tap reset to defaults | Reset button | lkConfirm, setLayout | F-PROF-026 |
| LayoutEditor quick map cb | handler | 31697-31718 | Render one quick-action chip | LayoutEditor | toggleQuick | F-PROF-025 |
| LayoutEditor order map cb | handler | 31589-31672 | Render one block row | LayoutEditor | move, toggleHide, labelOf | F-PROF-023, F-PROF-024 |
| NotificationsCard | component | 31756-31944 | Push permission, per-type prefs, sound, test | SettingsScreen (32952) | window.LOCKEDPush.* | F-PROF-028..037 |
| reread | function | 31780 | Re-pull `P.status()` into state | toggleMain, setPref | P.status | F-PROF-028..035 |
| toggleMain | function (async) | 31781-31790 | Enable/disable push | main switch | P.enable, P.disable, reread | F-PROF-028 |
| setPref | function (async) | 31792-31801 | Optimistically patch one push preference | all pref rows | P.setPrefs, reread | F-PROF-029..035 |
| sendTest | function (async) | 31806-31814 | Fire a test push | test button | P.test | F-PROF-037 |
| row | function | 31816-31840 | Render a title/sub/switch row | NotificationsCard | — | F-PROF-028..035 |
| timeRow | function | 31803-31814 (render helper, 31803 region) / 31842-31856 | Render a labelled `<input type=time>` | NotificationsCard | onChange cb | F-PROF-030, F-PROF-031 |
| NotificationsCard sound map cb | handler | 31896-31909 | Render one sound option and preview it | NotificationsCard | P.setSound, P.playAlert | F-PROF-036 |
| TextSizeCard | component | 31945-31986 | Root font-size scaling control | SettingsScreen (33095) | ld, sd | F-PROF-038 |
| apply | function | 31950-31954 | Persist and apply a text scale | TextSizeCard buttons | sd, documentElement.style | F-PROF-038 |
| TextSizeCard options map cb | handler | 31959-31980 | Render one size option | TextSizeCard | apply | F-PROF-038 |
| StorageCard | component | 31987-32030 | localStorage usage meter | SettingsScreen (33096) | lkStorageUsage | F-PROF-039 |
| StorageCard effect | hook | 31989-31998 | Refresh usage on event + 5s interval | StorageCard | lkStorageUsage, addEventListener, setInterval | F-PROF-039 |
| refresh (inside StorageCard effect) | function | 31990 | Re-read usage | effect, event | lkStorageUsage | F-PROF-039 |
| mb | function | 32000 | Format bytes as "N.N MB" | StorageCard render | — | F-PROF-039 |
| SettingsScreen | component | 32031-33805 | The full settings screen | app router | LayoutEditor, NotificationsCard, TextSizeCard, StorageCard, FuelDisplayCard, PrivacyCard, ld, sd, setTheme, downloadText, exportEverything, importEverything, exportFuelCSV, checkinPerDay, storedWeightUnit, validateBetaCodeRemote, claimBetaCode, syncBetaData, isSilentBeta | F-PROF-040..074 |
| SettingsScreen theme effect | hook | 32039-32047 | Sync `activeTheme` from the `theme-changed` event | SettingsScreen | ld | F-PROF-057 |
| handleThemeChange | function | 32040-32042 | Re-read `lk_theme` | theme effect | ld | F-PROF-057 |
| SettingsScreen voice effect | hook | 32088-32096 | Sync voice toggle from `lockedVoiceToggle` | SettingsScreen | ld | F-PROF-064 |
| sync (voice) | function | 32089-32091 | Re-read `lk_voiceEnabled` | voice effect | ld | F-PROF-064 |
| SettingsScreen back onClick | handler | 32127-32129 | Return to the Profile tab | SettingsScreen | p.go | F-PROF-040 (nav) |
| Customize onClick | handler | 32191-32193 | Open LayoutEditor | SettingsScreen | setSettingsView | F-PROF-040 |
| Guest signup onClick (settings) | handler | 32227-32229 | Upgrade guest | SettingsScreen | window.LOCKED.upgradeFromGuest | F-PROF-045 |
| lastSync formatter IIFE | function | 32256-32269 | Human-readable last-sync string | SettingsScreen | Date, isoDay | F-PROF-041 |
| SYNC NOW onClick | handler (async) | 32295-32323 | Force a cloud sync and report the outcome | SettingsScreen | window.LOCKED.forceSync, toast | F-PROF-042 |
| Sign Out onClick | handler | 32366-32368 | End the session | SettingsScreen | window.LOCKED.signOut | F-PROF-044 |
| Update Password onClick | handler (async) | 32430-32469 | Validate and change the password | SettingsScreen | window.LOCKED.changePassword | F-PROF-046 |
| Save Name onClick | handler | 32541-32545 | Commit the display name | SettingsScreen | p.updateProfile | F-PROF-047 |
| Sex map cb | handler | 32619-32642 | Render a sex segment | SettingsScreen | setBodySex | F-PROF-050 |
| Goal map cb | handler | 32748-32766 | Render a goal segment | SettingsScreen | setBodyGoal | F-PROF-053 |
| Save Stats onClick | handler | 32765-32777 | Convert units and commit body stats | SettingsScreen | p.updateProfile, parseInt, parseFloat | F-PROF-049..054 |
| Weight Unit onClick | handler | 32809 | Toggle kg/lb display | SettingsScreen | p.toggleUnit | F-PROF-055 |
| Check-in frequency map cb | handler | 32857-32874 | Render/select a check-in frequency | SettingsScreen | sd, setCheckinFreq | F-PROF-056 |
| THEMES map cb | handler | 32892-32950 | Render one theme swatch | SettingsScreen | setTheme | F-PROF-057 |
| Partial reps onClick | handler | 32979-32983 | Toggle `hidePartials` (inverted) | SettingsScreen | sd | F-PROF-058 |
| Streaks/badges onClick | handler | 33019-33023 | Toggle `gamingLayer` | SettingsScreen | sd | F-PROF-059 |
| Nutrition CSV onClick | handler | 33112-33114 | Download the food-diary CSV | SettingsScreen | exportFuelCSV, downloadText | F-PROF-061 |
| Full backup onClick | handler | 33131-33141 | Download a whole-account JSON backup | SettingsScreen | exportEverything, downloadText, isoDay, toast | F-PROF-062 |
| Restore onChange | handler | 33170-33197 | Read and import a backup file | SettingsScreen | FileReader, importEverything, toast, reload | F-PROF-063 |
| reader.onload (restore) | handler | 33174-33189 | Apply the parsed backup | Restore onChange | importEverything | F-PROF-063 |
| Microphone onClick | handler | 33245-33250 | Toggle the floating voice button | SettingsScreen | sd, dispatchEvent | F-PROF-064 |
| Cycle Logging onClick | handler | 33307-33311 | Toggle perf tracking and reload | SettingsScreen | ld, sd, location.reload | F-PROF-065 |
| Beta Verify onClick | handler | 33416-33428 | Validate an invite code | SettingsScreen | validateBetaCodeRemote | F-PROF-066 |
| validateBetaCodeRemote callback | handler | 33422-33427 | Apply the verification result | validateBetaCodeRemote | setSettingsBetaVerified/Err | F-PROF-066 |
| Beta Agree onClick | handler | 33481-33487 | Claim the code and activate beta | SettingsScreen | claimBetaCode | F-PROF-067 |
| Send Data to Dev onClick | handler | 33559-33566 | Upload beta logs | SettingsScreen | syncBetaData, toast | F-PROF-069 |
| Force Refresh onClick | handler | 33583-33601 | Clear caches and hard-reload | SettingsScreen | caches.keys/delete, location.reload | F-PROF-070 |
| Replay Tutorial onClick | handler | 33628-33630 | Restart the onboarding tutorial | SettingsScreen | p.onShowTutorial | F-PROF-071 |
| Reset all data onClick | handler | 33665-33694 | Arm then wipe every local key and end the session | SettingsScreen | localStorage.removeItem, auth.signOut, reload | F-PROF-072 |
| Reset Cancel onClick | handler | 33707-33709 | Disarm the reset | SettingsScreen | setResetArmed | F-PROF-072 |
| Delete Account onClick | handler | 33739-33741 | Show the confirmation panel | SettingsScreen | setDeleteConfirm | F-PROF-073 |
| Delete Cancel onClick | handler | 33780-33782 | Dismiss the confirmation | SettingsScreen | setDeleteConfirm | F-PROF-073 |
| Yes, Delete onClick | handler (async) | 33796-33806 | Permanently delete the account | SettingsScreen | window.LOCKED.deleteAccount, toast | F-PROF-073 |

Totals: **7 components**, **21 named functions/hooks**, **48 inline handlers/callbacks** indexed = **76 rows**.

---

## Complete settings inventory

Every user-changeable setting reachable from this range. "Key" values are the raw localStorage names (`ld`/`sd` prefix every key with `lk_`, 2419/2437).

| Label | Control type | Storage key | Default | Allowed values | Cite |
|---|---|---|---|---|---|
| Home Layout → block order | ▲/▼ reorder list (14 blocks) | `lk_homeLayout.order` | `HOME_DEFAULT_ORDER` | permutation of the 14 block ids | 31497-31509, 26019-26064 |
| Home Layout → hidden blocks | Hide/Show per row | `lk_homeLayout.hidden` | `{}` | map of blockId→true | 31510-31518 |
| Home Layout → quick actions | multi-select chips, max 3 | `lk_homeLayout.quick` | `["water","checkin","food"]` | keys of `QUICK_ACTION_DEFS` | 31519-31530, 26076, 26082 |
| Push notifications (master) | switch | `lk_pushEnabled` (+`lk_pushDeviceId`) | off | on/off | 31781-31790, 1307-1309 |
| Rest timer alerts | switch | `lk_pushPrefs.rest` | on (absent = on) | true/false | 31863-31864 |
| Training day reminder | switch | `lk_pushPrefs.training` | on | true/false | 31866-31867 |
| Training day send time | `<input type=time>` | `lk_pushPrefs.trainingTime` | `"07:30"` | HH:MM | 31868-31870 |
| Daily check-in reminder | switch | `lk_pushPrefs.checkin` | on | true/false | 31872-31873 |
| Check-in send time | `<input type=time>` | `lk_pushPrefs.checkinTime` | `"08:00"` | HH:MM | 31874-31876 |
| Unfinished workout nudge | switch | `lk_pushPrefs.idle` | on | true/false | 31878-31879 |
| Supplement reminders | switch | `lk_pushPrefs.supps` | on | true/false | 31881-31882 |
| Compound reminders | switch | `lk_pushPrefs.compounds` | on | true/false | 31884-31885 |
| Restock reminders | switch | `lk_pushPrefs.restock` | on | true/false | 31887-31888 |
| Rest timer sound | 3-way segment | `lk_pushSound` | `"bell"` | `bell` \| `plate` \| `none` | 31896-31909, 1806-1817 |
| Text size | 4-way segment | `lk_textScale` | `100` | `100` \| `110` \| `125` \| `150` | 31946-31955 |
| Weight unit (display) | toggle pill | parent-owned (`p.useKg`/`p.toggleUnit`) | kg (`p.useKg !== false`) | KG \| LBS | 32034, 32809 |
| Daily check-ins per day | 3-way segment | `lk_checkinPerDay` | `1` | `1` \| `2` \| `4` | 32857-32874, 52445-52448 |
| App Style (theme) | 5 swatches | `lk_theme` | system light→`light`, else `dark` | `dark` \| `slate` \| `navy` \| `midnight` \| `light` | 32892-32950, 2469-2500, 2501-2507 |
| Partial reps | switch (inverted key) | `lk_hidePartials` | shown (key absent = false) | true/false | 32063-32065, 32979-32983 |
| Streaks and badges | switch | `lk_gamingLayer` | `false` | true/false | 32066-32068, 33019-33023 |
| Microphone button (voice) | switch | `lk_voiceEnabled` | `true` | true/false | 32060-32062, 33245-33250 |
| Cycle logging (perf tracking) | switch + reload | `lk_perfTracking` | `false` | true/false | 33307-33311 |
| Display name | text input + Save | `lk_profile.displayName` | existing profile value | any non-blank string | 32511-32545 |
| Age | numeric text input | `lk_profile.age` | `null` | digits only | 32586-32588, 32770 |
| Sex | 2-way segment | `lk_profile.sex` | `null` | `Male` \| `Female` | 32617-32642, 32771 |
| Body weight | decimal input (unit-aware) | `lk_profile.weightKg` (kg) | `null` | digits and "." | 32661-32663, 32767-32769 |
| Height (metric) | numeric input, cm | `lk_profile.heightCm` (cm) | `null` | digits | 32676-32697, 32772 |
| Height (imperial) | two numeric inputs, ft + in | `lk_profile.heightCm` (cm) | `null` | digits | 32700-32735, 32772 |
| Goal | 3-way segment | `lk_profile.goal` | `null` | `Cut` \| `Maintain` \| `Bulk` | 32746-32774 |
| Beta invite code | text input + Verify | `lk_betaStatus`, `lk_betaCode`, `lk_betaId`, `lk_betaCodes` | not beta | uppercase code string | 33398-33427, 2757-2771 |
| New password | two password inputs + button | none (server-side) | — | ≥8 chars, upper+lower+digit | 32430-32451 |

**32 distinct settings.** Actions that are not settings (buttons with no persisted state) are: Customize, SYNC NOW, Sign Out, Update Password, Save Name, Save Stats, Nutrition CSV, Full backup, Restore, Send a test notification, Send Data to Dev, Force Refresh App, Replay Tutorial, Reset to Default (layout), Reset all data, Delete Account, SIGN UP, Analyse Physique, Add to Split, Delete photo — 20 actions.

---

## Themes

Five themes ship, contrary to the brief's four (2469-2500):

| id | label | bg | card | accent | root class applied | `theme-color` meta |
|---|---|---|---|---|---|---|
| `dark` | Dark | `#000000` | `#1C1C1E` | `OR` | *(none — the base stylesheet)* | `#080809` |
| `slate` | Slate | `#0D1117` | `#21262D` | `OR` | `theme-slate` | `#0D1117` |
| `navy` | Navy | `#070F1E` | `#112035` | `OR` | `theme-navy` | `#070F1E` |
| `midnight` | Midnight | `#0C0917` | `#1C183A` | `OR` | `theme-midnight` | `#0C0917` |
| `light` | Light | `#F2F2F7` | `#FFFFFF` | `OR` | `light-mode` | `#F2F2F7` |

Cites: THEMES array 2469-2500; `ALL_THEME_CLASSES = ["light-mode","theme-slate","theme-navy","theme-midnight"]` 2500; shell colour map 2523-2526.

How the picker drives them (32892-32950 → 2508-2538):
1. Tapping a swatch calls `setTheme(t.id)` (32894-32896).
2. `setTheme` calls `applyTheme(theme)` then dispatches a bare `Event("theme-changed")` (2535-2538).
3. `applyTheme` (2508-2532): sets the module global `isDarkMode = theme !== "light"`; sets `document.documentElement` attribute `data-style-profile` to the theme id; removes all four theme classes; adds the one matching class (dark adds none); rewrites `<meta name="theme-color">` so an installed PWA repaints its chrome; and persists with `sd("theme", theme)`.
4. `SettingsScreen`'s effect listens for `theme-changed` and re-reads `ld("theme","dark")` into `activeTheme`, which drives the selected-swatch styling (32039-32047).

Persistence and boot: `initTheme()` runs at module load (2540). If `lk_theme` is unset it consults `window.matchMedia("(prefers-color-scheme: light)")` and picks `light` or `dark` (2501-2507). The comment there records a fixed bug where a hardcoded `"dark"` fallback overrode the boot script's system-preference choice and then persisted it, permanently locking light-mode users out.

A separate `toggleTheme()` exists (2529-2534 region, 2529-2533) that flips only dark↔light; **it is not used by this range's picker**.

`isDarkMode` is consumed in range at 31852 to set `colorScheme` on the time inputs (F-PROF-030/031).

---

## Data export / account deletion

**Nutrition CSV** (F-PROF-061, 33112-33114): `exportFuelCSV()` (19376) serialised to `locked-fuel-log.csv` via `downloadText` (19415-19428). Fixed filename, no date stamp, no network.

**Full backup JSON** (F-PROF-062, 33131-33141 → 19436-19452): iterates every localStorage key, keeping any that begins `lk_` or `__lk_ts__`, plus the literal `__lk_last_sync__`. Values are stored **raw** (still JSON-encoded strings). Envelope: `{format:"locked-full-backup", version:1, exportedAt:<ISO>, keys:{...}, keyCount:N}`. Filename `locked-full-backup-<isoDay()>.json`. Includes progress photos as base64, all beta logs, and every setting. Entirely local — nothing is uploaded.

**Restore** (F-PROF-063, 33170-33197 → 19454-19483): validates only `parsed.format === "locked-full-backup"`. Merge is additive with `overwrite=false`: a local key survives when its `__lk_ts__` stamp is newer than or equal to the backup's stamp (falling back to `exportedAt`). Values are written before timestamps deliberately, because the sync layer's localStorage patch restamps `__lk_ts__` on every write (comment 19473-19480). Success toasts the written count and reloads after 1200ms. No confirmation dialog; a malicious file can set arbitrary `lk_*` keys.

**Reset all data** (F-PROF-072, 33665-33694): local only. Arm → confirm. Deletes every `lk_*` and `__lk_ts__*` key, preserves `lk_guestMode` for guests, and — critically — signs a logged-in user out before reloading, because otherwise the next boot's sync sees no local timestamps against a full cloud copy and restores everything (comment 33682-33684). `__lk_last_sync__` is not covered by the delete filter. Nothing server-side is deleted.

**Delete Account** (F-PROF-073, 33737-33806): two taps (Delete Account → Yes, Delete). Copy promises "Your account, subscription, and all stored data will be permanently deleted." All actual work is `await window.LOCKED.deleteAccount()`, defined outside this range. Only the failure path is handled here (toast + reset both flags). No typed confirmation, no re-auth, no local wipe in this code, and the button renders for guests who have no account.

---

## Progress photos

- **Where stored:** `localStorage["lk_progressPhotos"]`, a JSON array of `{date: ISO string, note: string, thumb: <data URI>}` (2856-2865). Nothing else — no IndexedDB, no filesystem, no server-side photo store.
- **Format and size limits:** images are downscaled by `resizeImage(file, 800, cb)` (2878-2910): max width 800px, max height `800 * 1.6 = 1280px`, both axes constrained, then `canvas.toDataURL("image/jpeg", 0.6)` — always JPEG at quality 0.6, encoded base64 into the string.
- **Quota handling:** `saveProgressPhoto` checks `sd`'s return value; on quota failure it rewrites the previous array and returns `null`, and `handleFile` keeps the note so the entry is not lost (2866-2871, 30685-30690). `sd` also toasts once and dispatches `lockedStorageFull` (2443-2451), which `StorageCard` listens for (31992).
- **Budget:** the app assumes a 5 MB localStorage budget (2467) shared with every other key; `StorageCard` isolates the `lk_progressPhotos` byte count and warns at 80% (32002, 32026-32029).
- **Do they leave the device?** Not on capture or storage. **Yes on demand:** tapping ANALYSE PHYSIQUE POSTs the full base64 image to `https://lockedapi.cescocugliari.workers.dev/analyze-physique` alongside the user's goal, body weight, weekly sets per muscle, and split names (30626-30643). No consent prompt precedes this. They are also written verbatim into the Full-backup JSON file (19436-19452), and included in beta sync only if the payload lists them — `syncBetaData`'s payload at 2806-2820 lists `betaLog`, `betaAILog`, `feedback`, `weightLog` and does **not** appear to include photos (partially read; see Open questions).
- **Privacy copy conflict:** the header says "N photos · stored on device" (30763) while the same screen offers the upload action.
- **Metadata leak:** `logBetaActivity("progress_photo", {date, note})` records the note text in `lk_betaLog` for beta users, which is later uploaded by Send Data to Dev (2872-2876, 33559-33566).
- **Deletion:** per-photo two-tap delete (31421-31423); bulk deletion only via Reset all data.

---

## Storage keys touched

Read and/or written from this range (all `ld`/`sd` keys carry the `lk_` prefix, 2419/2437):

| Key | R/W | Where |
|---|---|---|
| `lk_progressPhotos` | R/W | 30587, 30699, 2856-2871; sized by 2461 |
| `lk_profile` | R (in range), W via `p.updateProfile` | 30625, 32541, 32765 |
| `lk_history` | R (fallback) | 30637 |
| `lk_splits` | R (fallback) | 30638 |
| `lk_homeLayout` | R/W | 31492, 31493, 26065-26081 |
| `lk_gamingLayer` | R/W | 30420, 32066, 33020-33022 |
| `lk_theme` | R/W | 32036, 32041, 2532 |
| `lk_textScale` | R/W | 31947, 31952 |
| `lk_checkinPerDay` | R/W | 32032, 32861, 52445 |
| `lk_hidePartials` | R/W (inverted) | 32064, 32982 |
| `lk_voiceEnabled` | R/W | 32061, 32090, 33247 |
| `lk_perfTracking` | R/W | 33307-33309, 33313, 33319, 33361 |
| `lk_betaStatus` | R/W | 32058, 2769 |
| `lk_betaCode` | R/W | 33540-33549, 2770 |
| `lk_betaId` | R/W | 2771, 2796, 2801 |
| `lk_betaCodes` | R/W | 2758, 2768 |
| `lk_betaLog` | W (via logBetaActivity), R (via syncBetaData) | 30618, 2772-2784 |
| `lk_betaAILog` | R | 2806 |
| `lk_lastSync` | R | 33553 |
| `lk_feedback`, `lk_weightLog` | R | 2807-2809 |
| `lk_weightStorageUnit` | R | 4384-4392 (via `storedWeightUnit()` at 33069) |
| `lk_guestMode` | R/W (raw) | 33673, 33680 |
| `lk_deployVersion` | Removed (raw) | 33585 |
| `lk_pushEnabled`, `lk_pushPrefs`, `lk_pushDeviceId`, `lk_pushSound` | R/W via `window.LOCKEDPush` | 1307-1309, 1806; driven from 31781-31909 |
| all `lk_*`, `__lk_ts__*`, `__lk_last_sync__` | R (export) | 19436-19452 via 33131 |
| all `lk_*`, `__lk_ts__*` | W (import) | 19454+ via 33177 |
| all `lk_*`, `__lk_ts__*` | Removed (reset) | 33675-33677 |
| every localStorage key | R (size only) | 2456-2468 via 31988 |

---

## Security findings

1. **Unauthenticated photo upload to a personal Worker domain** — `POST https://lockedapi.cescocugliari.workers.dev/analyze-physique` carries a full base64 image plus body weight and goal, with no auth header and no consent step (30626-30643). No client secret is present (the AI key lives server-side, which is correct), but the endpoint is open from the client's perspective. UNVERIFIED whether the Worker rate-limits or authenticates.
2. **Beta gate fails open** — `validateBetaCodeRemote`'s `.catch` calls `onResult(true, null)` (2753-2755), so any network failure grants beta access.
3. **Beta code claim is client-side only** — `claimBetaCode` marks the code used in the local `lk_betaCodes` array (2757-2771); nothing tells the server, so one code works on unlimited devices.
4. **Unvalidated backup import** — only the envelope's `format` string is checked; arbitrary `lk_*` keys (including `lk_betaStatus` and `lk_perfTracking`) can be set from a file (19456-19483).
5. **Password change with no re-authentication** in the client (32430-32469).
6. **Hardcoded cohort id** `SILENT_BETA_IDS = ["summerbeta"]` (2795). No secret value to redact — nothing in this range holds a credential.

---

## Open questions / UNVERIFIED

1. **Text scale on boot** (F-PROF-038) — `apply` sets `documentElement.style.fontSize` but only from the Settings card. Confirm by grepping for another `documentElement.style.fontSize` write in the boot path; if none exists, the setting persists but does not take effect until Settings is reopened.
2. **`window.LOCKED` surface** — `upgradeFromGuest`, `forceSync`, `signOut`, `changePassword`, `deleteAccount`, `syncStatus`, `session`, `toast`, `isGuest`, `isLoggedIn` are all consumed here and defined outside 30153-33807. Their success behaviour, error shapes and whether `deleteAccount` navigates on success are unconfirmed (32228, 32300, 32367, 32455, 33799).
3. **`p.updateProfile` persistence** — assumed to write `lk_profile`; confirm in the parent screen's code (32543, 32769).
4. **`p.toggleUnit`** — where the display unit is persisted is not visible in range (32809). Agent covering the app shell should record the key.
5. **Analyse-physique prompt and model** — entirely server-side in the Worker; not auditable from this file (30626).
6. **Time-zone handling for `trainingTime`/`checkinTime`** — the client sends a bare "HH:MM" (31869, 31875); how the push service localises it is unknown.
7. **`syncBetaData` payload completeness** — I read 2800-2820; whether `progressPhotos` appears further down that object is unconfirmed. Read 2800-2856 to settle it.
8. **Hardware/gesture back out of LayoutEditor** — the editor is a full render swap, not a routed view (32109); whether the app shell intercepts back is unknown.
9. **Does `p.useKg` change remount SettingsScreen?** — several About-Me fields derive their initial value once at mount (32082-32100); if the parent does not remount, the height/weight fields keep stale formatting after a unit switch.
10. **`__lk_last_sync__` after reset** — included in backups (19446) but not in the reset delete filter (33676). Whether a stale value there affects the post-reset first sync is unconfirmed.
