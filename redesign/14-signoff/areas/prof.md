### F-PROF-001 — Guest-mode upgrade banner (Profile header)
- location: Profile tab > ProfileScreen > top banner
- user action: taps "SIGN UP"
- behaviour: 1) banner renders only when `window.LOCKED.isGuest` is truthy (30243, 30245-30248); 2) tap calls `window.LOCKED.upgradeFromGuest()` (30281-30283)
- v6 status: UNVERIFIED

### F-PROF-002 — Profile identity header (avatar, display name, @username)
- location: Profile tab > ProfileScreen > header
- user action: passive (read-only)
- behaviour: 1) avatar circle renders first letter of `profile.displayName` uppercased, fallback "A" (30322); 2) display name (30331-30338); 3) "@" + `profile.username` (30339-30346)
- v6 status: WORKING

### F-PROF-003 — Settings entry button
- location: Profile tab > ProfileScreen > header right
- user action: taps "Settings"
- behaviour: calls `p.go("settings")` (30348-30350)
- v6 status: WORKING

### F-PROF-004 — Lifetime stats grid (Workouts / PRs / Total Sets / Volume)
- location: Profile tab > ProfileScreen > 2×2 grid
- user action: passive
- behaviour: 1) `totalSets` = sum of `liftSets(w)` over history (30158); 2) `totalVol` = sum of `liftVolume(w)` (30159); 3) `prCount` = `Object.keys(prs).length` (30160); 4) volume shown as `Math.round(storedToUnit(totalVol, useKg)/1000) + "k " + unit` (30378)
- v6 status: WORKING

### F-PROF-005 — Earned badges grid
- location: Profile tab > ProfileScreen > Badges section
- user action: passive
- behaviour: 1) badges array built from thresholds: history≥1 "First Rep", ≥5, ≥10, ≥25; prCount≥1 "First PR", ≥5 "5 PRs"; totalSets≥100 "100 Sets" (30167-30207); 2) each rendered with tint `col+"12"` and border `col+"30"` (30437-30444); 3) empty state copy when none (30427-30435)
- v6 status: WORKING

### F-PROF-006 — Locked (unearned) badges
- location: Profile tab > ProfileScreen > Badges section, below earned
- user action: passive
- behaviour: locked list built for history<5, history<10, prCount<5 with "N more to go" copy (30208-30226); rendered in neutral grey `LOCKED_BADGE` tints (30482-30520)
- v6 status: WORKING

### F-PROF-007 — Personal records list (top 6)
- location: Profile tab > ProfileScreen > "Personal Records"
- user action: passive
- behaviour: 1) iterate `prs` keys, `getEx(parseInt(eid))` (30229-30231); 2) pick the entry with `r === 1` else first (30233-30235); 3) push {name, muscle, w, r, col}; 4) `slice(0,6)` (30244); 5) weight displayed via `kgToDisp(pr.w, useKg)` with kg/lb suffix (30546, 30578-30582)
- v6 status: WORKING

### F-PROF-008 — Progress photo — capture from camera
- location: Progress > ProgressPhotos > "Camera" button
- user action: taps Camera
- behaviour: 1) creates an ad-hoc `<input type=file accept=image/* capture=environment>` and `.click()`s it (30798-30805); 2) `handleFile` runs `resizeImage(file, 800, cb)` (30683); 3) `saveProgressPhoto(thumb, note.trim())` persists (30684); 4) on success `setPhotos(updated)` and clears the note (30691-30692); 5) input value reset (30694)
- v6 status: WORKING

### F-PROF-009 — Progress photo — pick from library
- location: Progress > ProgressPhotos > "Library" button
- user action: taps Library
- behaviour: clicks the hidden persistent `fileRef` input (30843-30845, ref declared 30600, element 30765-30774) → same `handleFile` path as F-PROF-008
- v6 status: WORKING

### F-PROF-010 — Progress photo note field
- location: Progress > ProgressPhotos > textarea above Camera/Library
- user action: types an optional note
- behaviour: controlled textarea, 2 rows, placeholder "Optional note — e.g. Week 4, front pose" (30775-30797); value passed trimmed into `saveProgressPhoto` (30684); cleared on success (30692)
- v6 status: WORKING

### F-PROF-011 — Photo grid grouped by month
- location: Progress > ProgressPhotos > grid
- user action: scroll/browse
- behaviour: 1) `groups` IIFE keys photos by `YYYY-MM` of `ph.date`, labels with `toLocaleDateString("en-US",{month:"long",year:"numeric"})` (30719-30748); 2) groups reversed so newest month first (30745-30747); 3) 3-column grid of square thumbnails with a bottom gradient showing short date and truncated note (30907-30990)
- v6 status: WORKING

### F-PROF-012 — Photo count + "stored on device" label
- location: Progress > ProgressPhotos > header
- user action: passive
- behaviour: renders `N photo(s) · stored on device` when `photos.length > 0` (30757-30763)
- v6 status: WORKING — but the claim is only true until the user taps Analyse (see F-PROF-016)

### F-PROF-013 — Open photo lightbox
- location: Progress > ProgressPhotos > tap a thumbnail
- user action: taps a grid tile
- behaviour: `openLightbox(idx)` sets `lightbox`, clears `analysis`, clears `analysing` (30705-30709); rendered through `lkPortal` at `zIndex 99999` over a 96% black scrim (31031-31043); backdrop click closes (31032-31036)
- v6 status: WORKING

### F-PROF-014 — Escape key closes lightbox
- location: Progress > ProgressPhotos
- user action: presses Esc
- behaviour: `useEscape(lightbox !== null ? handler : null)` registers once for the component lifetime; handler clears lightbox, analysis, analysing (30594-30596)
- v6 status: WORKING

### F-PROF-015 — Lightbox prev / next navigation
- location: Progress > lightbox footer arrows
- user action: taps ‹ or ›
- behaviour: `prevPhoto` wraps to last when at 0 (30710-30713); `nextPhoto` wraps to 0 at the end (30714-30717); both reset `analysis`/`analysing`; counter shows `lightbox+1 / photos.length` (31413-31419)
- v6 status: WORKING

### F-PROF-016 — AI "Analyse Physique" (photo → Cloudflare Worker)
- location: Progress > lightbox > "ANALYSE PHYSIQUE" button
- user action: taps the gradient button under the photo
- behaviour: 1. guard `if (analysing) return` (30622) 2. clear previous analysis, set spinner (30623-30624) 3. read `ld("profile", null) || {}` (30625) 4. `fetch("https://lockedapi.cescocugliari.workers.dev/analyze-physique", { method:"POST", headers:{"Content-Type":"application/json"} })` (30626-30630) 5. body: `{ base64: photo.thumb, profile: { goal, weight }, training: { weeklySetsPerMuscle: muscleVolumeSummary(history), splits: [ "<splitName> (day, day)" ] } }` (30631-30643) 6. response parsed as `d.content[0].text` (Anthropic Messages-API shape), stripped of ```json fences, `JSON.parse`d (30644-30649) 7. fallback 1: regex `/\{[\s\S]*\}/` then parse (30652-30655) 8. fallback 2: whole text becomes `{summary:text, observations:[], strengths:[], focus:"", bodyComposition:"", qualifier:""}` (30656-30670) 9. `.catch` stops spinner and toasts "Couldn't analyse that photo. Check your connection and try again." (30674-30680)
- v6 status: WORKING (client side)

### F-PROF-017 — Analysis result panels (summary / composition / observations / strengths / focus / qualifier)
- location: Progress > lightbox > below the analyse button
- user action: passive after F-PROF-016
- behaviour: each section renders only if present — summary (31207-31226), BODY COMPOSITION (31227-31247), OBSERVATIONS bulleted (31248-31290), STRENGTHS with ✓ (31291-31329), FOCUS AREA (31330-31352), qualifier as fine print (31383-31391)
- v6 status: WORKING

### F-PROF-018 — Weak point → prescription cards
- location: Progress > lightbox > "WEAK POINT → FIX"
- user action: passive
- behaviour: 1) for each `weakPoints[i]`, `prescription.exercises` ids are mapped through `getEx(parseInt(id,10))` and filtered to drop `name === "Unknown"` (31355-31357); 2) renders muscle, evidence, exercise names joined by ", " plus `· N sets/wk` (31358-31371)
- v6 status: WORKING

### F-PROF-019 — "ADD TO SPLIT" from a weak point
- location: Progress > lightbox > weak point card
- user action: taps ADD TO SPLIT, then picks a split day in the sheet
- behaviour: 1) button only renders when resolved exercises exist AND `p.splits.length > 0` AND `p.setSplits` is provided (31372); 2) sets `addTarget = {ids, muscle}` (31373); 3) bottom sheet lists every split × day (31404-31417); 4) `addFocusWork(exIds, splitId, dayIdx)` maps splits, appends only ids not already in `day.exIds` (30602-30617); 5) `logBetaActivity("physique_focus_added", {exIds})` (30618); 6) clears target, shows "Added to your split" for 2500ms (30619-30621)
- v6 status: WORKING

### F-PROF-020 — Delete a progress photo
- location: Progress > lightbox footer > "Delete"
- user action: taps Delete twice
- behaviour: 1) `lkConfirm("delPhoto"+lightbox, "Tap Delete again to remove this photo for good.")` gates the first tap (31421-31423); 2) `removePhoto(idx)` filters the array, `sd("progressPhotos", updated)`, updates state, closes the lightbox and clears analysis (30696-30704)
- v6 status: WORKING

### F-PROF-021 — "Tap a photo → Analyse Physique" hint banner
- location: Progress > ProgressPhotos > below the grid
- user action: passive
- behaviour: orange hint card rendered only when `photos.length > 0` (30991-31029)
- v6 status: WORKING

### F-PROF-022 — Progress photos empty state
- location: Progress > ProgressPhotos
- user action: passive
- behaviour: camera icon + "Start Your Transformation" + explainer, shown when `photos.length === 0` (30861-30906)
- v6 status: WORKING

### F-PROF-023 — Home layout — reorder blocks
- location: Settings > Home Layout > BLOCKS > ▲ / ▼
- user action: taps up/down arrows on a block row
- behaviour: 1) `move(id, dir)` swaps adjacent entries in `layout.order`, bailing at the ends (31497-31509); 2) `setLayout` persists via `saveHomeLayout` then updates state (31493-31496)
- v6 status: WORKING

### F-PROF-024 — Home layout — hide / show a block
- location: Settings > Home Layout > BLOCKS > Hide/Show button
- user action: taps Hide or Show
- behaviour: `toggleHide(id)` adds or deletes the key in `layout.hidden` and persists (31510-31518); row shows line-through and 0.45 opacity when hidden (31601, 31655)
- v6 status: WORKING

### F-PROF-025 — Home layout — quick actions (max 3)
- location: Settings > Home Layout > QUICK ACTIONS
- user action: taps quick-action chips
- behaviour: 1) `toggleQuick(id)` removes if present; otherwise appends unless `q.length >= 3`, in which case it silently returns (31519-31530); 2) unselected chips are `disabled` + 0.45 opacity once 3 are chosen (31702-31718); 3) counter "(N/3 selected)" (31691)
- v6 status: WORKING

### F-PROF-026 — Home layout — reset to default
- location: Settings > Home Layout > "Reset to Default"
- user action: taps twice
- behaviour: `lkConfirm("resetLayout", "Tap again to reset your home layout.")` gates; then sets `{order: HOME_DEFAULT_ORDER.slice(), hidden: {}, quick: ["water","checkin","food"]}` (31721-31730)
- v6 status: WORKING

### F-PROF-027 — Home layout — back navigation
- location: Settings > Home Layout > back chevron
- user action: taps ‹
- behaviour: calls `p.onBack` (31552-31560), which sets `settingsView` back to "main" (32109-32113)
- v6 status: WORKING

### F-PROF-028 — Push notifications master switch
- location: Settings > NOTIFICATIONS card > "Push notifications"
- user action: taps the switch
- behaviour: 1) `toggleMain` guards on `!P || busy` (31782); 2) clears messages, sets busy; 3) if enabled → `await P.disable()` + "Notifications turned off."; else `await P.enable()` + "You're set — rest timers and daily reminders will arrive on this device." (31785-31786); 4) errors surface `e.message` or "Couldn't change notifications." (31787); 5) `reread()` re-pulls `P.status()` (31788, 31780)
- v6 status: WORKING

### F-PROF-029 — Notification preference — Rest timer
- location: Settings > NOTIFICATIONS > "Rest timer"
- user action: taps the switch
- behaviour: `setPref({rest: prefs.rest === false})` — optimistic local state then `await P.setPrefs(patch)` then `reread()` (31863-31864, 31792-31801)
- v6 status: WORKING

### F-PROF-030 — Notification preference — Training day + send time
- location: Settings > NOTIFICATIONS > "Training day" and "Send at"
- user action: taps the switch; picks a time in the `<input type=time>`
- behaviour: toggle `setPref({training: prefs.training === false})` (31866-31867); when on, a `timeRow` renders with default "07:30" and writes `setPref({trainingTime: v})` only when `e.target.value` is non-empty (31868-31870, 31803-31814)
- v6 status: WORKING

### F-PROF-031 — Notification preference — Daily check-in + send time
- location: Settings > NOTIFICATIONS > "Daily check-in"
- user action: switch + time picker
- behaviour: `setPref({checkin: prefs.checkin === false})` (31872-31873); time row default "08:00" → `setPref({checkinTime: v})` (31874-31876)
- v6 status: WORKING

### F-PROF-032 — Notification preference — Unfinished workout
- location: Settings > NOTIFICATIONS > "Unfinished workout"
- user action: taps the switch
- behaviour: `setPref({idle: prefs.idle === false})`; copy "Asks after 30 quiet minutes instead of ending it for you" (31878-31879)
- v6 status: WORKING

### F-PROF-033 — Notification preference — Supplements
- location: Settings > NOTIFICATIONS > "Supplements"
- user action: taps the switch
- behaviour: `setPref({supps: prefs.supps === false})` (31881-31882)
- v6 status: WORKING

### F-PROF-034 — Notification preference — Compounds
- location: Settings > NOTIFICATIONS > "Compounds"
- user action: taps the switch
- behaviour: `setPref({compounds: prefs.compounds === false})`; copy notes it only fires "if performance tracking is on" (31884-31885)
- v6 status: PARTIAL

### F-PROF-035 — Notification preference — Restock
- location: Settings > NOTIFICATIONS > "Restock"
- user action: taps the switch
- behaviour: `setPref({restock: prefs.restock === false})` (31887-31888)
- v6 status: WORKING

### F-PROF-036 — Rest timer sound picker (Bell / Plates / Silent)
- location: Settings > NOTIFICATIONS > "Rest timer sound"
- user action: taps one of three segment buttons
- behaviour: 1) `setSound(P.setSound(opt[0]))` persists and echoes back the accepted value (31900-31901); 2) unless "none", `P.playAlert(opt[0])` previews immediately (31902); 3) explanatory copy states a locked phone uses the system sound and no browser can change it (31894-31895)
- v6 status: WORKING

### F-PROF-037 — Send a test notification
- location: Settings > NOTIFICATIONS > "Send a test notification"
- user action: taps the button
- behaviour: `sendTest` guards on `!P || testing`, calls `await P.test()`, then "Test sent — it should appear in a moment."; failure shows `e.message` or "Test failed." (31805-31812 → actual 31806-31813 region: 31805-31813); button label swaps to "Sending…" and is disabled (31913-31921)
- v6 status: WORKING

### F-PROF-038 — Text size / Dynamic Type
- location: Settings > TEXT SIZE card
- user action: taps Default / Large / Larger / Largest
- behaviour: 1) initial value parsed from `ld("textScale", 100)` with `isNaN` guard (31946-31949); 2) `apply(v)` sets state, `sd("textScale", v)`, and sets `document.documentElement.style.fontSize = v === 100 ? "" : v + "%"` (31950-31954); 3) options `[[100,"Default"],[110,"Large"],[125,"Larger"],[150,"Largest"]]` (31955)
- v6 status: PARTIAL

### F-PROF-039 — On-device storage meter
- location: Settings > ON-DEVICE STORAGE card
- user action: passive
- behaviour: 1) `lkStorageUsage()` sums `(key.length + value.length) * 2` bytes across all localStorage and isolates `lk_progressPhotos` (2456-2468); 2) budget hardcoded at `5 * 1024 * 1024` (2467); 3) refreshes on the `lockedStorageFull` window event and every 5000ms (31989-31998); 4) `pct` capped at 100 (32001); 5) `tight` at ≥80% turns the bar amber, the card border amber, and appends "Running low. Delete a few progress photos in Progress to keep saving." (32002, 32026-32029)
- v6 status: WORKING

### F-PROF-040 — Home Layout entry (Settings → Customize)
- location: Settings > PREFERENCES > HOME LAYOUT > "CUSTOMIZE"
- user action: taps CUSTOMIZE
- behaviour: `setSettingsView("layout")` (32191-32193) → LayoutEditor replaces the screen (32109-32113)
- v6 status: WORKING

### F-PROF-041 — Cloud sync status readout
- location: Settings > ACCOUNT > CLOUD SYNC
- user action: passive
- behaviour: 1) "Never synced on this device" if no `lastSync` (32260); 2) same-day → "Last synced 4:32 PM"; ≤7 days → weekday + clock; older → "Mar 3 — 41 days ago" (32261-32268); 3) state chip: Synced ✓ / Syncing… / Failed / "Paused — workout open" / "Not signed in" / Idle with a colour dot (32275-32293)
- v6 status: PARTIAL

### F-PROF-042 — "SYNC NOW" manual sync
- location: Settings > ACCOUNT > CLOUD SYNC > button
- user action: taps SYNC NOW
- behaviour: 1) guards `!window.LOCKED || syncLoading` (32296); 2) `await window.LOCKED.forceSync()` (32300); 3) re-reads `window.LOCKED.syncStatus`; success toast "Sync complete" when state === "synced" (32305-32307); otherwise `setSyncErr("Sync finished but reported: <state>. Check your connection.")` (32309); 4) throw → state set to error, message shown inline and as an error toast (32311-32320)
- v6 status: WORKING

### F-PROF-043 — Account email display
- location: Settings > ACCOUNT card
- user action: passive
- behaviour: `acctEmail` read once from `window.LOCKED.session.user.email` (32068-32070), rendered with `wordBreak: break-all` (32357-32364)
- v6 status: WORKING

### F-PROF-044 — Sign out
- location: Settings > ACCOUNT > "Sign Out"
- user action: taps Sign Out
- behaviour: `window.LOCKED.signOut()` (32366-32368) — **no confirmation**
- v6 status: WORKING

### F-PROF-045 — Guest mode card (Settings)
- location: Settings > ACCOUNT > GUEST MODE
- user action: taps SIGN UP
- behaviour: card renders when `window.LOCKED.isGuest` (32204); copy: "Your data lives on this device only. Create an account to enable cloud backup and sync across devices."; button calls `upgradeFromGuest()` (32227-32229)
- v6 status: UNVERIFIED

### F-PROF-046 — Change password
- location: Settings > ACCOUNT > CHANGE PASSWORD
- user action: types a new password twice, taps Update Password
- behaviour: validation in order — 1) `!pwNew || pwNew.length < 8` → "Minimum 8 characters" (32431-32437); 2) missing uppercase / lowercase / digit → "Needs uppercase, lowercase, and a number" (32438-32444); 3) mismatch → "Passwords don't match" (32445-32451); 4) `await window.LOCKED.changePassword(pwNew)` → "Password updated" and both fields cleared (32453-32461); 5) throw → `e.message` or "Failed to update password" (32462-32467)
- v6 status: WORKING

### F-PROF-047 — Display name edit + Save Name
- location: Settings > PROFILE card
- user action: types a name, taps "Save Name"
- behaviour: controlled input (32511-32530); `if (name.trim()) p.updateProfile({displayName: name.trim()})` (32541-32545)
- v6 status: WORKING

### F-PROF-048 — Username display (read-only)
- location: Settings > PROFILE card
- user action: passive
- behaviour: renders `"Username: @" + p.profile.username` (32531-32540)
- v6 status: WORKING (read-only by design)

### F-PROF-049 — About Me — Age
- location: Settings > ABOUT ME
- user action: types age
- behaviour: `inputMode:"numeric"`, onChange strips non-digits `replace(/[^0-9]/g,"")` (32586-32588); placeholder "e.g. 19"; committed by Save Stats (F-PROF-054) as `parseInt(bodyAge) || null` (32770)
- v6 status: WORKING

### F-PROF-050 — About Me — Sex (Male / Female)
- location: Settings > ABOUT ME
- user action: taps a segment
- behaviour: two buttons over `["Male","Female"]`, active state styled with `OR` border and `OR_H+"15"` fill (32617-32642); saved as `bodySex || null` (32771)
- v6 status: WORKING

### F-PROF-051 — About Me — Body weight (unit-aware)
- location: Settings > ABOUT ME > "Body Weight (kg|lbs)"
- user action: types a weight
- behaviour: 1) initial value `fmtQ(p.useKg ? profile.weightKg : profile.weightKg * 2.20462)` (32083-32086); 2) input strips to digits and "." (32661-32663); 3) label and placeholder swap on `p.useKg` (32649, 32664); 4) saved as `bwKg = useKg ? bw : bw / 2.20462` (32768-32769)
- v6 status: WORKING

### F-PROF-052 — About Me — Height (cm, or ft + in)
- location: Settings > ABOUT ME > "Height"
- user action: types cm, or ft and in
- behaviour: 1) `heightCm` seeded as `Math.round(profile.heightCm)` (32091); 2) `heightFt = floor(heightCm/30.48)` (32092-32095); 3) `heightIn = round((heightCm/2.54) % 12)` (32096-32100); 4) when `p.useKg` a single cm field renders, otherwise two fields (32672-32735); 5) saved as `hcm = useKg ? parseInt(heightCm)||null : ((ft*12)+in)*2.54 || null` (32772)
- v6 status: PARTIAL

### F-PROF-053 — About Me — Goal (Cut / Maintain / Bulk)
- location: Settings > ABOUT ME > "Goal"
- user action: taps a segment
- behaviour: three buttons over `["Cut","Maintain","Bulk"]` (32746-32766); saved as `bodyGoal || null` (32774)
- v6 status: WORKING

### F-PROF-054 — Save Stats
- location: Settings > ABOUT ME > "Save Stats"
- user action: taps Save Stats
- behaviour: builds and commits `{displayName: p.profile.displayName, age, sex, weightKg, heightCm, goal}` via `p.updateProfile` (32765-32776)
- v6 status: WORKING

### F-PROF-055 — Weight unit toggle (KG ↔ LBS)
- location: Settings > PREFERENCES > "Weight Unit"
- user action: taps the pill
- behaviour: calls `p.toggleUnit` (32809); label reads "KG - Switch to LBS" or "LBS - Switch to KG" (32821)
- v6 status: WORKING

### F-PROF-056 — Daily check-in frequency (1 / 2 / 4 per day)
- location: Settings > PREFERENCES > "Daily check-ins"
- user action: taps Once a day / Twice / 4 times
- behaviour: `sd("checkinPerDay", opt[0])` then `setCheckinFreq(opt[0])` (32860-32863); options `[[1,"Once a day"],[2,"Twice"],[4,"4 times"]]` (32857); `checkinPerDay()` clamps to 1 unless the stored value is exactly 2 or 4 (52445-52448)
- v6 status: WORKING

### F-PROF-057 — Theme / App Style picker
- location: Settings > PREFERENCES > "App Style"
- user action: taps one of five theme swatches
- behaviour: 1) `THEMES.map` renders a 44×44 swatch painted `t.bg` with a `t.card` corner and a `t.accent` dot (32892-32950); 2) tap → `setTheme(t.id)` → `applyTheme` + `window.dispatchEvent(new Event("theme-changed"))` (2535-2538); 3) `applyTheme` sets `isDarkMode`, `data-style-profile` attribute, removes all of `ALL_THEME_CLASSES`, adds the matching class, updates `<meta name="theme-color">`, and `sd("theme", theme)` (2508-2532); 4) SettingsScreen listens for `theme-changed` and re-reads `ld("theme","dark")` into `activeTheme` (32039-32047)
- v6 status: WORKING

### F-PROF-058 — Partial reps toggle
- location: Settings > WORKOUT TRACKING > "Partial Reps"
- user action: taps the switch
- behaviour: `setPartialsEnabled(next); sd("hidePartials", !next)` — the stored key is **inverted** relative to the switch (32979-32983); initial state `!ld("hidePartials", false)` (32063-32065)
- v6 status: WORKING

### F-PROF-059 — Streaks and badges toggle (`gamingLayer`)
- location: Settings > WORKOUT TRACKING > "Streaks and badges"
- user action: taps the switch
- behaviour: `setGamingEnabled(next); sd("gamingLayer", next)` (33019-33023); default false (32066-32068)
- v6 status: WORKING

### F-PROF-060 — Weight-units explanation row
- location: Settings > WORKOUT TRACKING > "Weight units"
- user action: passive
- behaviour: renders `"Your logs are stored in " + (storedWeightUnit() === "kg" ? "kilograms" : "pounds") + ". Switching your profile between kg and lb converts what you see — it never changes what was recorded."` (33069-33071)
- v6 status: WORKING

### F-PROF-061 — Export nutrition CSV
- location: Settings > EXPORT MY DATA > "Nutrition CSV"
- user action: taps the button
- behaviour: `downloadText("locked-fuel-log.csv", exportFuelCSV(), "text/csv")` (33112-33114); `downloadText` builds a Blob, creates an `<a download>`, clicks it, and revokes the object URL after 500ms (19415-19428)
- v6 status: WORKING

### F-PROF-062 — Full backup (JSON) export
- location: Settings > EXPORT MY DATA > "Full backup (JSON)"
- user action: taps the button
- behaviour: 1) `exportEverything()` walks every localStorage key and keeps those starting `lk_` or `__lk_ts__`, plus `__lk_last_sync__`, storing raw string values (19436-19452); 2) envelope `{format:"locked-full-backup", version:1, exportedAt, keys:{}, keyCount}`; 3) key count parsed back out of the JSON for the toast (33134-33136); 4) `downloadText("locked-full-backup-" + isoDay() + ".json", json, "application/json")` (33137); 5) toast "Backed up N keys — keep this file somewhere safe." (33138-33140)
- v6 status: WORKING

### F-PROF-063 — Restore from backup
- location: Settings > EXPORT MY DATA > "Restore from backup" (label-wrapped file input)
- user action: picks a `.json` backup file
- behaviour: 1) `FileReader.readAsText` (33196); 2) `importEverything(String(reader.result), false)` — `overwrite = false` (33177); 3) `importEverything` rejects anything whose `format !== "locked-full-backup"` with "That is not a LOCKED backup file." (19456-19458); 4) additive merge: a key is skipped when the local `__lk_ts__` is newer than or equal to the backup's stamp (or `exportedAt` as fallback) (19470-19483); 5) values written first, timestamps second, deliberately (comment 19473-19480); 6) toast "Restored N keys. Reloading…" then `window.location.reload()` after 1200ms (33178-33183); 7) parse/other errors → error toast with `err.message` or "That file could not be read." (33184-33188); 8) input value reset (33197)
- v6 status: WORKING

### F-PROF-064 — Voice / microphone button toggle
- location: Settings > VOICE COMMANDS > "Microphone Button"
- user action: taps the switch
- behaviour: `setVoiceEnabledState(next); sd("voiceEnabled", next); window.dispatchEvent(new Event("lockedVoiceToggle"))` (33245-33250); a mount effect subscribes to the same event to re-sync from storage (32088-32096); default true (32060-32062)
- v6 status: WORKING

### F-PROF-065 — Performance tracking (cycle logging) toggle
- location: Settings > PERFORMANCE TRACKING > "Cycle Logging"
- user action: taps the switch
- behaviour: `var cur = ld("perfTracking", false); sd("perfTracking", !cur); window.location.reload();` (33307-33311); the switch's rendered state reads `ld("perfTracking", false)` **directly from storage on every render** rather than from React state (33313, 33319, 33361)
- v6 status: PARTIAL

### F-PROF-066 — Beta invite code entry + verification
- location: Settings > BETA TESTING (shown only when `!isBeta`)
- user action: types a code, taps Verify
- behaviour: 1) input uppercases on change and clears the error (33398-33401); 2) empty → "Enter a code" (33417-33420); 3) `validateBetaCodeRemote(code, cb)` runs a local `validateBetaCode` shape check then `POST https://lockedapi.cescocugliari.workers.dev/beta-validate` with `{code}` (2729-2748); 4) `!d.valid` → "Invalid code"; `d.locked` → "This code is no longer available"; else success (2745-2752); 5) success sets `settingsBetaVerified` (33422-33427)
- v6 status: WORKING (with a fail-open defect)

### F-PROF-067 — Beta tester agreement + activation
- location: Settings > BETA TESTING > agreement panel
- user action: reads the agreement, taps "I Agree — Activate Beta"
- behaviour: 1) panel shows only when `settingsBetaVerified && !settingsBetaAgreed` (33443); 2) discloses collection of workout data, AI coach interactions, check-in entries, nutrition/weight logs, and app usage activity (33463-33465); 3) states data is not shared with third parties and participation can stop at any time (33466-33472); 4) includes an anti-reverse-engineering clause (33473-33479); 5) tap → `claimBetaCode(code, p.profile.username || "user")` which marks the local code used and writes `lk_betaCodes`, `lk_betaStatus=true`, `lk_betaCode`, `lk_betaId` (2757-2771); 6) sets `settingsBetaAgreed`, `settingsBetaOk`, `isBeta` (33481-33486); 7) "Beta activated!" confirmation (33504-33510)
- v6 status: PARTIAL

### F-PROF-068 — Beta status card (status, code, last sync)
- location: Settings > BETA card
- user action: passive
- behaviour: renders when `isBeta && !isSilentBeta()` (33511); shows "Status: Active", `ld("betaCode", "")` when present (33540-33549), and "Last sync: " + `ld("lastSync", "Never")` (33550-33557)
- v6 status: WORKING

### F-PROF-069 — "Send Data to Dev" (beta sync)
- location: Settings > BETA card > green button
- user action: taps Send Data to Dev
- behaviour: `syncBetaData(onDone, onFail)` (33559-33566); success toast "Data synced", failure toast "Sync failed. Check your connection and retry."; `syncBetaData` posts to `SYNC_URL = "https://lockedapi.cescocugliari.workers.dev/beta-sync"` (2794) with a payload including `betaLog`, `betaAILog`, `feedback`, `weightLog` and more (2800-2820)
- v6 status: WORKING

### F-PROF-070 — "Force Refresh App"
- location: Settings > BETA card > orange button
- user action: taps Force Refresh App
- behaviour: 1) `localStorage.removeItem("lk_deployVersion")` (33585); 2) if `"caches" in window`, delete every cache then `window.location.reload(true)`; `.catch` also reloads (33587-33599); 3) else reload directly (33601)
- v6 status: WORKING

### F-PROF-071 — Replay Tutorial
- location: Settings > HELP card
- user action: taps "🎯 Replay Tutorial"
- behaviour: `if (p.onShowTutorial) p.onShowTutorial()` (33628-33630)
- v6 status: UNVERIFIED

### F-PROF-072 — Reset all data (arm → confirm)
- location: Settings > DANGER ZONE > "Reset all data"
- user action: taps once to arm, again to erase
- behaviour: 1. first tap sets `resetArmed` and returns (33668-33671) 2. records `wasGuest = !!localStorage.getItem("lk_guestMode")` (33673) 3. deletes every key starting `lk_` or `__lk_ts__` (33675-33677) 4. if the user was a guest, re-writes `lk_guestMode = "1"` so they land in a fresh app rather than the sign-in overlay (33678-33681) 5. if signed in with `auth.isLoggedIn && auth.signOut`, awaits sign-out then reloads (33685-33692) — the comment at 33682-33684 explains that without this the next boot re-syncs everything back from the cloud 6. otherwise reload (33693) 7. armed state shows a red filled button labelled "Tap again to erase everything", plus a Cancel button and the warning "This erases every workout, PR, photo, goal and log on this device. It cannot be undone." (33706-33736)
- v6 status: WORKING

### F-PROF-073 — Delete Account (two-step, destructive)
- location: Settings > DANGER ZONE > "Delete Account"
- user action: taps Delete Account, then "Yes, Delete" in the inline panel
- behaviour: 1) first tap sets `deleteConfirm` (33737-33753); 2) panel: "This cannot be undone." + "Your account, subscription, and all stored data will be permanently deleted." (33755-33777); 3) Cancel resets the flag (33780-33795); 4) confirm → `setDeleteLoading(true)`, `await window.LOCKED.deleteAccount()` (33797-33800); 5) on throw, toast "Delete failed: " + message, clear loading and confirm (33801-33805)
- v6 status: PARTIAL

### F-PROF-074 — Section headers and embedded shared cards
- location: Settings > various
- user action: passive
- behaviour: section labels "PREFERENCES" (32164), "ACCOUNT" (32196), "DATA & SYNC" rendered **twice** (33091 via `className:"ds-section-hd"` and 33366-33371 as an inline-styled `<p>`), "HELP & DANGER ZONE" (33602). Shared cards mounted here but defined outside the range: `FuelDisplayCard` (33089, defined 21550), `PrivacyCard` (33094, defined 21678), plus in-range `NotificationsCard` (32952), `TextSizeCard` (33095), `StorageCard` (33096)
- v6 status: PARTIAL
