### F-CYCLE-200 — "Stack" tab entry point (Fuel tab wrapper)
- location: Fuel tab > sub-tab pill row > "Stack"
- user action: Taps the "Stack" chip, which only exists when performance tracking is on.
- behaviour: 1) `logTabs` is built without a cycle entry; `if (ld("perfTracking", false)) logTabs.push(["cycle","Stack"])` (37328–37329). 2) When `tab === "cycle"`, `CycleTab` is rendered with **no props** (37460). 3) `perfTracking` is toggled from a settings switch (33335–33360).
- v6 status: WORKING (with the gating gap above)

### F-CYCLE-201 — Cycle list screen
- location: Fuel > Stack > list
- user action: Lands on the tab; taps a cycle row.
- behaviour: 1) `CycleTab` loads `getCycles()` and `getCycleLog()` (47433–47438). 2) Splits into `active` (`status === "active"`) and `past` (47572–47577). 3) Empty state: 💉 "No Cycles Logged" + a line promising account backup (47578–47607). 4) ACTIVE rows are green-tinted, show 💉, name, "N compounds — Week X of Y" using `ceil((now - startDate)/7d)` clamped to ≥1 (47612–47616). 5) PAST rows are muted, showing compound count and the date span with `"?"` fallbacks (47700–47740). 6) Tapping a row sets `selIdx` to the **index in the full `cycles` array** via `cycles.indexOf(cyc)` and switches to `detail` (47610, 47705). 7) "NEW CYCLE" dashed button at the bottom (47990–48012 region, ending 48842).
- v6 status: WORKING

### F-CYCLE-202 — Create / edit a cycle
- location: Fuel > Stack > "NEW CYCLE" (or detail > pencil) > add form
- user action: Names the cycle, sets start date and weeks, adds compounds, optional notes, taps "CREATE CYCLE".
- behaviour: 1) `openAdd` resets fields with `cStart = today`, `cWeeks = "12"` (47476–47485); `openEdit` hydrates from the cycle including `aiOverview` (47487–47497). 2) Weeks input strips non-digits (48253). 3) `calcEndDate()` adds `weeks*7` days to the start and previews "Ends: …" live (47550–47555, 48261). 4) `saveCycle` requires a name AND ≥1 compound (47565); builds `{name,startDate,endDate,weeks,compounds,notes,aiOverview,status:"active",created}` (47567–47578) and persists via `setCycles`→`saveCycles`→`sd("cycles")` (47461–47467, 47288). 5) Logs `cycle_create` / `cycle_edit` with the compound count (47590).
- v6 status: PARTIAL

### F-CYCLE-203 — Add / edit a compound (within a cycle)
- location: Fuel > Stack > add form > "Add Custom Compound" or a preset row > compound form
- user action: Types a name, picks a category, dose, frequency, route; taps "ADD TO CYCLE".
- behaviour: 1) Two entry points: `addPresetComp(preset)` prefills name/dose/freq/route/cat from `PRESET_COMPOUNDS` (47500–47509), or the "Add Custom Compound" button clears everything (48472–48480). 2) `openCompEdit(idx)` hydrates from `cComps[idx]` (47511–47519). 3) The form (47623–47790) renders CATEGORY chips from `COMPOUND_CATEGORIES` (5 entries, 47014), FREQUENCY from `CYCLE_FREQ_OPTS` (7 entries, 47282), and ROUTE from **the preset's own `routes` array if the name matches a preset, else `CYCLE_ROUTE_OPTS`** (47625–47627). 4) When a preset matches, a hint line shows "Typical: <defDose> — Half-life: <halfLife>" (47720). 5) `saveComp` trims the name, builds `{name,dose,freq,route,cat}`, replaces or appends into `cComps`, closes the form and clears name/dose (47521–47548).
- v6 status: WORKING

### F-CYCLE-204 — Compound preset database browser
- location: Fuel > Stack > add form > "Browse Compound Database"
- user action: Taps the button, optionally searches and/or filters by category, taps a compound.
- behaviour: 1) Toggles `showPresets` and resets `presetCat`/`presetQ` (48380–48384). 2) `filteredPresets` filters `PRESET_COMPOUNDS` (32 entries, 47034–47281) by category then case-insensitive name substring (48152–48158). 3) Category chips: "All" plus the 5 `COMPOUND_CATEGORIES`, each tinted with its own colour; tapping an active chip clears it (48416–48440). 4) The result list is a `maxHeight: 220` scroll area; each row shows a colour bar, name, and "defDose — routes.join(', ') — halfLife" (48441–48463). 5) "No matches" fallback (48464). 6) Tapping a row calls `addPresetComp` and jumps into the compound form (47500).
- v6 status: WORKING

### F-CYCLE-205 — AI cycle overview
- location: Fuel > Stack > add form > "Generate AI Cycle Overview"
- user action: Taps the button (only rendered once ≥1 compound exists), or "Regenerate".
- behaviour: 1) `getAiOverview()` early-returns on an empty compound list (47610). 2) Sets `aiLoading`, builds `compList` as "Name dose freq (route)" joined by commas (47612–47616). 3) System prompt (47617): *"You are a knowledgeable fitness pharmacology assistant. Be practical and informative, not preachy or moralising. The user is an adult making their own decisions. Give a concise cycle overview."* 4) User message (47618) asks for expected effects, bloodwork timing, monitoring, PCT, "4-6 sentences", passing cycle name, weeks and compound list. 5) `aiCall(sys, msg, null, onDone, onFail)` (47619–47626; `aiCall` at 2663). 6) Success writes `aiOverview`; failure writes the literal string `"AI overview unavailable. Check your connection and try again."` into `aiOverview` (47624). 7) Spinner + "Analysing cycle…" while loading (48784–48800). 8) Result renders in an orange card with a "Regenerate" link (48802–48830); on the detail screen it renders under "AI OVERVIEW" / "Coach Analysis" (48090–48116).
- v6 status: PARTIAL

### F-CYCLE-206 — Cycle detail — today's doses
- location: Fuel > Stack > tap a cycle > detail > "TODAY"
- user action: Taps the dot button next to a compound.
- behaviour: 1) Detail renders only when `view === "detail" && selIdx !== null && cycles[selIdx]` (47791). 2) Header: back arrow, name, "Active"/"Completed", "— Week X of Y" for active cycles (47793–47830), pencil → `openEdit(selIdx)` (47838), and an "End" button for active cycles (47860). 3) The TODAY section only renders when active (47880). 4) Per compound it recomputes `dueToday` inline: Every Other Day (`dayNum % 2`), 1x/week Monday, 2x/week Mon+Thu, 3x/week Mon/Wed/Fri, "As Needed" never (47890–47900). 5) The take button is disabled when already taken or not due; not-due rows show " (not scheduled today)" (47905–47960). 6) `take()` → `markCompoundTaken(cycleName, compName)` writing `log[today].push(cycleName+"::"+compName)` (47469–47475, 47293–47301). 7) Streak badge from `getCompoundStreak` when >1 (47306–47318, 47940).
- v6 status: PARTIAL

### F-CYCLE-207 — Cycle detail — compound roster, AI overview, notes
- location: Fuel > Stack > detail
- user action: Scrolls.
- behaviour: 1) "COMPOUNDS (n)" lists every compound with a category colour bar, "dose — route — freq", and a category pill whose text colour comes from `readableAccent(cat.col)` (47962–48088; `readableAccent` at 4318). 2) "AI OVERVIEW" card renders `cyc.aiOverview` when present, labelled "Coach Analysis" (48090–48116). 3) "NOTES" renders `cyc.notes` when present (48117–48134).
- v6 status: WORKING

### F-CYCLE-208 — End a cycle
- location: Fuel > Stack > detail > "End" button (active cycles only)
- user action: Taps "End".
- behaviour: 1) `endCycle(idx)` sets `status: "completed"` and `endDate: todayISO` via `Object.assign` (47593–47603). 2) Logs `cycle_ended` (47601). 3) The cycle moves to PAST CYCLES on the next list render (47576).
- v6 status: PARTIAL

### F-CYCLE-209 — Delete a cycle
- location: Fuel > Stack > detail > "Delete Cycle"
- user action: Taps Delete; taps again.
- behaviour: 1) `lkConfirm("delCycle"+selIdx, "Tap Delete again to remove this cycle.")` (48137). 2) `deleteCycle(idx)` logs `cycle_deleted`, filters the cycle out, and if it was the selected one resets `selIdx`/`view` back to the list (47604–47620).
- v6 status: PARTIAL

### F-CYCLE-210 — Home "COMPOUNDS DUE" reminder card
- location: Home tab > card stack > `cycle` card
- user action: Reads the card; taps "Taken".
- behaviour: 1) Home registry maps `cycle → CycleReminderCard` (26664–26667). 2) The component reads `perfTracking` and returns null if off or nothing due (47335, 47341). 3) `getDueCompounds()` (47320–47333) also short-circuits on `perfTracking`, skips non-active cycles, skips cycles outside their date window, skips already-taken keys, then applies the frequency rules including "As Needed → never". 4) Rows show name and "dose — route(or freq) — cycleName", with a category lookup falling back to "Other" (47388–47410). 5) "Taken" → `markCompoundTaken`, removes the row, logs `compound_taken` (47343–47358).
- v6 status: PARTIAL

### F-CYCLE-001 — Home "Cycle Tracking" setup card (not yet set up)
- location: Home tab > home feed block `cycletrack` > gradient promo card
- user action: taps the card's "TRACK CYCLE" button
- behaviour: 1. `CycleTrackerCard` reads the profile with `mcGetProfile()` (F:22597). 2. If `!mcp || !mcp.setup`, renders the promo card with drop icon, headline "CYCLE TRACKING", subtitle "Connect your cycle to your training. Private — stays on this device." (F:22599-22665). 3. Button calls `p.go("cycletrack")` (F:22668) → screen route (F:57675).
- v6 status: WORKING

### F-CYCLE-002 — Home cycle status card (set up)
- location: Home tab > `cycletrack` block > compact card with day ring + LOG button
- user action: taps anywhere on the card, or the "LOG" pill
- behaviour: 1. `mcGetDays()` + `mcCompute(mcp, days)` derive the cycle state (F:22671-22673). 2. Ring badge shows `C.day` or "—"; colored by `MC_COL[phaseOfDay(C.day)]` (F:22694-22712). 3. Title = `"Day N · <PhaseName>"`, or `"Wellness"` when `mcp.discreet`, or `"Cycle"` (F:22720-22727). 4. Subtitle `sub` resolved by a priority chain (F:22679-22690): discreet → "Tap to open"; pregRecovery → "Cycle reset — predictions paused"; `C.day == null` → "Log your period to start predictions"; `C.stale` → "Log your period to refresh predictions"; `stillBleeding` (yesterday flow>=2 and today unlogged, F:22676-22678) → "Still bleeding? One tap to log"; `C.overdue > 0` → "Period expected — log it when it starts"; `C.hbc` → "Bleed day N"/"Day N"; else countdown "Period in N days" / "Period expected today"; fallback "Day N". 5. Both card and LOG button navigate to `cycletrack` (F:22668-22750); LOG uses `e.stopPropagation()`.
- v6 status: WORKING

### F-CYCLE-003 — Cycle onboarding — step 0, privacy intro
- location: Cycle screen (first entry) > `McOnboarding` step 0
- user action: taps "GET STARTED"; back arrow returns Home
- behaviour: shows drop icon, "CYCLE TRACKING" headline, value line, and a shield privacy panel stating "Cycle data stays on this device — cloud backup is optional and off by default. Never sold or shared; export or delete it any time." (F:22894-22952). `setStep(1)`.
- v6 status: WORKING - Evidence: F:23106-23112 back handler; F:22950 Btn wiring.

### F-CYCLE-004 — Onboarding step 1 — goal
- location: `McOnboarding` step 1
- user action: taps one of four goal options, then NEXT (or "Skip" in the header)
- behaviour: options from `MC_GOALS` = understand / train / symptoms / track (F:21910); selection sets `goal` (F:22981-22985); NEXT → step 2.
- v6 status: PARTIAL

### F-CYCLE-005 — Onboarding step 2 — last period start date
- location: `McOnboarding` step 2
- user action: picks a date in a native `<input type="date">`, or taps "I'm not sure"
- behaviour: 1. `max` clamped to `mcTodayISO()` (F:23000). 2. Choosing a date sets `lastStart` and clears `notSure` (F:23001-23004). 3. "I'm not sure" toggles `notSure` and clears `lastStart` (F:23018-23021). 4. NEXT → step 3.
- v6 status: WORKING - Evidence: F:22764 persists; `mcPeriodStarts` seeds a synthetic start from `mcp.lastStart` (F:21983-21988).

### F-CYCLE-006 — Onboarding step 3 — typical cycle/period length + irregular
- location: `McOnboarding` step 3
- user action: types cycle length and period length; toggles "My cycles are irregular"
- behaviour: two numeric inputs (F:23046-23087); irregular toggle via `optBtn` (F:23088-23090). Values only clamped at `finish()`: cycleLen clamped 15–60, periodLen clamped 1–10 (F:22766-22767).
- v6 status: WORKING - Evidence: F:22766-22767 clamping executes at finish.

### F-CYCLE-007 — Onboarding step 4 — birth control, finish
- location: `McOnboarding` step 4 (final)
- user action: taps one of 7 `MC_BC_OPTS` chips, then "START TRACKING"
- behaviour: 1. `finish()` builds profile object `{setup:true, goal, lastStart, cycleLen, periodLen, irregular, birthControl, discreet:false, createdAt: mcTodayISO()}` (F:22762-22773). 2. `mcSaveProfile(prof)` → `sd("mcProfile", prof)` → `localStorage.lk_mcProfile` (F:21937-21939, F:2435). 3. `p.onDone(prof)` → `setMcpRaw(prof)` in the screen (F:25172-25174).
- v6 status: WORKING - Evidence: F:22774 `mcSaveProfile(prof)`.

### F-CYCLE-008 — Onboarding progress dots / Skip
- location: `McOnboarding` header
- user action: taps back chevron, or "Skip"
- behaviour: 5 dots (`TOTAL = 5`, F:22761), active dot widened (F:23120-23132); Skip shown only for `step > 0 && step < 4` and advances a step without recording anything (F:23133-23147). Content animates with `fadeUp .3s`, keyed on `step` (F:23153-23157).
- v6 status: WORKING - Evidence: F:23133-23140 Skip handler.

### F-CYCLE-009 — Cycle ring — display
- location: Cycle screen > "cycle" view > top
- user action: view only
- behaviour: 1. Ring is a 272px SVG, radius 116, stroke 17 (F:22419-22421). 2. Segment layout (F:22424-22462): `neutral` single segment when `C.day == null || C.pregRecovery`; two segments (menstrual 1..periodLen, neutral rest) when `C.hbc`; otherwise menstrual 1..periodLen, follicular periodLen+1..oA-1, ovulatory oA..oB, luteal oB+1..L, where `oA = max(periodLen+1, ovuDay-1)`, `oB = min(L, ovuDay+1)`. 3. `L = max(C.avgLen, C.day || 1)` so an overdue cycle stretches the ring (F:22422). 4. Faint track drawn at 0.22 opacity, then the "elapsed" arcs clipped at today's angle (F:22505-22530). 5. Today marker: filled dot colored by phase with white ring (F:22543-22563). 6. `aria-label` varies for recovery / day-known / setup (F:22499-22501).
- v6 status: WORKING - Evidence: F:22505-22530 both arc passes render from computed segments.

### F-CYCLE-010 — Cycle ring — drag-to-preview any day
- location: Cycle screen > ring
- user action: press and drag around the ring circumference
- behaviour: 1. Invisible hit stroke (`strokeWidth: sw + 28`, `pointerEvents: "stroke"`) captures pointer events (F:22565-22590). 2. `scrub(ev)` returns immediately when `neutral`; ignores touches closer than `28%` of the width to the center (F:22469-22482). 3. Angle → day: `d = min(L, max(1, floor(deg/360*L)+1))` (F:22480). 4. `p.onPreview(d === C.day ? null : d)` → `setPreview` in the screen (F:25378). 5. Preview draws a hollow outline dot at the previewed angle (F:22531-22542). 6. Screen center swaps to the previewed date, day number and phase name (F:25248-25281). 7. Below the ring: "Log <date>" button (only if `pvISO <= todayISO`) and "Back to today" (F:25390-25422).
- v6 status: WORKING - Evidence: F:22575-22589 pointer handlers call `scrub`.

### F-CYCLE-011 — Cycle screen center readout states
- location: Cycle screen > inside the ring - Behavior — four mutually exclusive centers: 1. **Recovery**: "CYCLE RESET", big day count, "day(s) since <date> · log your next period to restart predictions" (F:25207-25242). 2. **No data / stale**: drop icon plus "It's been a while — log your period to restart predictions." or "Tap Log Period on day one and everything starts from there." (F:25243-25247, F:25266-25271). 3. **Preview** (F:25272-25305): previewed date, day number, phase name, "day N of ~avgLen". 4. **Normal** (F:25306-25360): "CYCLE DAY", `C.day` at 4rem, phase name (or "Bleed"/"Tracking" on HBC), then "Period in ~Nd" / "Period expected today" when `overdue === 0`, or "Nd past estimate".
- user action: 
- behaviour: 
- v6 status: WORKING - Evidence: F:25306-25360 normal branch.

### F-CYCLE-012 — Quick action grid (4 tiles)
- location: Cycle screen > below the ring
- user action: taps Log Period / Symptoms / Energy-or-Pill / More
- behaviour: 1. **Log Period** — `quickLogPeriod()` (F:25191-25202): if today's flow ≥ 2, set `flow: 0` (un-log); else set `flow: 3` (Medium). Tile shows "Logged" when `flow >= 2`. 2. **Symptoms** — `setSheetDate(C.todayISO)` opens the log sheet (F:25470); tile is tinted when today has any symptom keys. 3. **Third tile** — on hormonal BC it is a pill-taken toggle writing `{pill: !todayLog.pill}` and labeled with `bcLabel` (F:25491-25522); otherwise it toggles the inline energy bar (F:25523-25554). 4. **More** — `setSheetDate(C.todayISO)` (F:25555-25580), identical to Symptoms.
- v6 status: WORKING - Evidence: F:25191-25202 writes via `updateDay` → `mcSaveDays`.

### F-CYCLE-013 — Inline energy bar (1–5)
- location: Cycle screen > strip under the quick grid
- user action: taps a number 1–5
- behaviour: rendered when `energyBar && !C.hbc` (F:25581); tapping writes `{energy: act ? null : n}` for today and closes the bar (F:25610-25614).
- v6 status: WORKING - Evidence: F:25610-25614.

### F-CYCLE-014 — Inline flow strip
- location: Cycle screen > strip shown when `periodOn` (`flow >= 2`)
- user action: taps Spotting / Light / Medium / Heavy
- behaviour: `MC_FLOWS.slice(1)` rendered; taps write `{flow: v}` where v is 1..4 (F:25636-25679). Note the strip appears only for flow ≥ 2, so Spotting (1) can be selected but then the strip disappears on the next render.
- v6 status: PARTIAL

### F-CYCLE-015 — Phase-of-today explainer card
- location: Cycle screen > below the quick controls (hidden during recovery)
- user action: 
- behaviour: 1. Colored dot + `<PHASE> · TODAY` heading, or `BLEED`/`TRACKING` on HBC (F:25680-25710). 2. Body = `MC_PHASE_INFO[ph].line`, or an HBC-specific line: "On <bc>, hormone levels are steady rather than cyclical — so we track how you actually feel instead of predicting phases." (F:25711-25717). 3. Footer computes the typical day range for the phase: menstrual `[1, periodLen]`, follicular `[periodLen+1, ovuDay-2]`, ovulatory `[ovuDay-1, ovuDay+1]`, luteal `[ovuDay+2, avgLen]`; suppressed if the range inverts (F:25718-25731).
- v6 status: WORKING - Evidence: F:25718-25731 range logic.

### F-CYCLE-016 — Prediction cards carousel (Next period / Fertile window / PMS window)
- location: Cycle screen > horizontally scrollable row
- user action: 
- behaviour: 1. Rendered only when `!C.stale && !C.pregRecovery && C.nextStart` (F:25732). 2. **NEXT PERIOD / NEXT BLEED** always first: value `mcFmt(C.nextStart)`, or "Any day" if overdue; sub = `"est. <date> · Nd ago"` when overdue, `"expected today"`, or `"in Nd · ±<confBand>d"` (F:25746-25760). 3. **FERTILE WINDOW** shown when `!hbc && C.fertA && C.fertB >= todayISO && C.sd < 6`; sub `"±Nd · not contraception"` (F:25761-25767). 4. **PMS WINDOW** shown when `!hbc && C.pmsA && !C.overdue`; sub appends "<symptom> often hits here" from `mcPreSymptoms` (F:25768-25774). 5. `confBand = C.irregular ? max(3, C.conf) : C.conf` (F:25185).
- v6 status: WORKING - Evidence: F:25744-25795 card construction and render.

### F-CYCLE-017 — Irregular-cycle disclaimer line
- location: Cycle screen, under the carousel
- user action: 
- behaviour: when `C.irregular && !stale && !pregRecovery && nextStart`, shows "Your cycles vary, so treat dates as ranges, not appointments. Predictions sharpen as you log." (F:25800-25807)
- v6 status: WORKING - Evidence: F:25800.

### F-CYCLE-018 — Overdue explainer (≥5 days late)
- location: Cycle screen card
- user action: 
- behaviour: when `C.overdue >= 5 && !stale && !pregRecovery`, renders "Running N days past the estimate. Cycles shift — stress, travel, illness and hard training blocks can all delay ovulation. If you're sexually active, a test can rule things out; if late cycles keep repeating, it's worth mentioning to a clinician." (F:25807-25822)
- v6 status: WORKING - Evidence: F:25807.

### F-CYCLE-019 — Training card (in-module coach nudge)
- location: Cycle screen > TRAINING card
- user action: taps "Take it lighter" / "I feel fine — keep my plan" / "Open Train"
- behaviour: 1. `rough` = `sym.cramps >= 2 || sym.fatigue >= 2 || sym.headache >= 2 || (d.energy && d.energy <= 2)` (F:24659). 2. If `rough` and no prior decision (`d.coach` unset): body names the reasons ("You logged cramps and fatigue. Want to trade today's heavy work for machines, mobility or Zone 2? It still moves you forward.") plus two buttons (F:24664-24730). 3. "Take it lighter" writes `{coach: "adjusted"}`; "I feel fine" writes `{coach: "kept"}` (F:24686, F:24709). 4. `adjusted` state: "Noted — go lighter today. Think machines over free weights, mobility work, or 20–30 min Zone 2…" plus an "Open Train" button calling `p.go("train")` (F:24731-24755). 5. `kept` state: `"Plan unchanged. " + MC_PHASE_INFO[ph].train`. 6. Otherwise: `MC_PHASE_INFO[ph].train` alone (F:24759). 7. Footer disclaimer: "Guidance follows how you feel, not a calendar — evidence doesn't support rigid phase-based programming." (F:24774-24776)
- v6 status: WORKING - Evidence: F:24686/24709 write `coach` through `updateDay`.

### F-CYCLE-020 — Nutrition card (Fuel bridge)
- location: Cycle screen > FUEL card
- user action: taps "Open Fuel ›" or the dismiss X
- behaviour: 1. Hidden if `d.nutriDismissed` (F:24779); the X writes `{nutriDismissed:true}` for today (F:24800-24803). 2. Body chosen by phase (F:24784): menstrual → iron message; luteal **with `sym.cravings`** → cravings message; luteal → higher-energy-needs message; ovulatory → appetite-dip message; follicular/neutral → **returns null (card not shown)**. 3. Menstrual footnote: "Fuel is tracking your iron against the 18 mg daily target while you're bleeding." (F:24847) 4. Luteal footnote depends on `mcFuelAdjustOn()`: "Fuel is adding a small calorie allowance this phase." vs "You can let Fuel add a small calorie allowance this phase — it's off by default." (F:24855) 5. "Open Fuel ›" → `p.go("fuel")` (F:24858-24872).
- v6 status: **PARTIAL — the claims it makes about Fuel are not implemented**

### F-CYCLE-021 — Fuel cycle strip (DEAD CODE)
- location: intended Fuel tab; **never mounted**
- user action: (would be) toggling "Add N kcal in this phase" - Behavior as written: 1. `mcFuelContext(profile)` (F:24876-24911) returns null unless female, set up, non-discreet and `C.day != null`; else `{day, phase, hbc, recovery, name, ironFocus, calAdj, tip}`. 2. Tips: recovery → "Your cycle is resetting. Eat normally and don't cut hard right now — recovery needs fuel." with `ironFocus: true`; menstrual → iron tip, `ironFocus: true`; luteal → appetite tip, and `calAdj = 1` if `mcFuelAdjustOn()`; ovulatory → appetite-dip tip; else follicular tip (F:24888-24910). 3. `mcLutealCalBump(baseCal)` = `min(150, round(baseCal*0.05/10)*10)` — 5% of maintenance, rounded to 10 kcal, capped at 150; defaults baseCal to 2200 (F:24912-24914). 4. `McFuelStrip` renders the phase header, tip, an iron progress bar `p.iron.have / p.iron.goal mg` with a "Only counts foods with iron data" caveat, and — luteal, non-HBC, non-recovery only — a toggle writing `sd("mcFuelAdjust", n)` and calling `p.onChange(n)` (F:24915-25063).
- behaviour: 
- v6 status: **DEAD**

### F-CYCLE-022 — Train tab cycle banner
- location: Train tab > banner under the recent-workouts block
- user action: taps the banner (also keyboard-activatable via `lkKeyActivate`)
- behaviour: 1. Returns null unless `isFemaleUser(p.profile)`, a set-up non-discreet profile exists (F:25065-25068). 2. Reads today's log directly from localStorage (`mcGetDays()[mcTodayISO()]`, F:25069). 3. `rough` uses the same thresholds as the training card: cramps/fatigue/headache ≥ 2 or energy ≤ 2 (F:25071). 4. Returns null if `!rough || t.coach === "kept"` (F:25072). 5. Copy: `coach === "adjusted"` → "You planned to take today lighter — machines, mobility or Zone 2 all count."; else "Rough day logged in Cycle — consider going lighter today." (F:25094-25096). 6. Tap → `p.go("cycletrack")` (F:25077).
- v6 status: WORKING - Evidence: F:15465 renders it inside the Train screen.

### F-CYCLE-023 — Day log sheet — open/close
- location: Cycle screen (or calendar) > bottom sheet
- user action: taps Symptoms/More/a calendar cell/a preview "Log <date>" button; closes by tapping the scrim, the drag pill, "Done", or Escape
- behaviour: `useEscape(p.onClose)` (F:23148) plus `useSheetDrag` (F:23149) supply escape-key and drag-to-dismiss; rendered through `lkPortal` at zIndex 1500 (F:23177-23186); max height 86dvh with safe-area padding (F:23193-23204). Title is "TODAY" or the formatted date (F:23231).
- v6 status: WORKING - Evidence: F:23177 `lkPortal(...)` return.

### F-CYCLE-024 — Log sheet — flow picker
- location: log sheet > FLOW
- user action: taps one of None / Spotting / Light / Medium / Heavy
- behaviour: 5-column grid from `MC_FLOWS` (F:23258); tapping index i writes `{flow: i === d.flow ? 0 : i}` (F:23262-23266); tick marks visualize intensity; active state requires `d.flow != null` (F:23259).
- v6 status: WORKING - Evidence: F:23262-23266.

### F-CYCLE-025 — Log sheet — pill-taken toggle (HBC only)
- location: log sheet, shown when `p.hbc`
- user action: 
- behaviour: row labeled "<bcLabel> taken" with a switch writing `{pill: !d.pill}` (F:23306-23346).
- v6 status: WORKING - Evidence: F:23327-23331.

### F-CYCLE-026 — Log sheet — symptoms (3-state severity)
- location: log sheet > SYMPTOMS
- user action: taps a symptom chip repeatedly
- behaviour: `cycleSym(id)` advances severity `(cur + 1) % 4`, deleting the key at 0 (F:23167-23175); labels "" / Mild / Moderate / Severe (F:23213). 12 symptoms from `MC_SYMPTOMS` (F:21880): cramps, headache, bloating, tender breasts, back pain, fatigue, acne, nausea, digestive, cravings, discharge, hot flashes. Background opacity encodes severity via `col + String(10 + sev*12)` (F:23374).
- v6 status: WORKING - Evidence: F:23167-23175.

### F-CYCLE-027 — Log sheet — mood multi-select
- location: 
- user action: 
- behaviour: 8 chips from `MC_MOODS` (F:21881: Happy, Calm, Motivated, Irritable, Anxious, Low, Stressed, Sensitive); toggling splices in/out of `d.mood` array (F:23404-23412).
- v6 status: WORKING - Evidence: F:23404-23412.

### F-CYCLE-028 — Log sheet — energy and sleep (1–5)
- location: 
- user action: 
- behaviour: two 5-button rows; each writes `{energy: d.energy === n ? null : n}` / `{sleep: ...}` (F:23430-23432, F:23470-23472); buttons fill cumulatively (`>= n`).
- v6 status: WORKING - Evidence: F:23430, F:23470.

### F-CYCLE-029 — Log sheet — sex activity
- location: 
- user action: 
- behaviour: three buttons None / Protected / Unprotected writing `{sex: act ? null : o[0]}` (F:23508-23511); hidden when `p.discreet` (F:23496).
- v6 status: PARTIAL

### F-CYCLE-030 — Log sheet — events (EC, pregnancy test, abortion, miscarriage, IUD)
- location: log sheet > EVENTS collapsible ("contraception, tests, pregnancy")
- user action: expands the section, toggles event checkboxes, or picks Negative/Positive for a pregnancy test
- behaviour: 1. Section auto-opens if the day already has events (F:23154-23156); chevron rotates (F:23557-23566). 2. `MC_EVENTS` (F:21883-21903): `ec` (Morning-after pill), `test` (Pregnancy test), `abortion`, `miscarriage`, `iud`. 3. `test` renders as a two-button result picker writing `ev.test = "neg" | "pos"` (F:23590-23621). 4. All other events are boolean checkboxes: `setEv(id, on ? null : true)` deletes or sets `true` (F:23160-23166, F:23630-23632). 5. `abortion` / `miscarriage` are tinted luteal via `MC_PREG_END` (F:21904-21907, F:23623-23625). 6. Section footer restates the storage promise (F:23703-23724).
- v6 status: WORKING - Evidence: F:23630-23632 event writes; consumed by `mcPregEnds` (F:21952-21959) and the `ecDate` scan (F:22127-22135).

### F-CYCLE-031 — Log sheet — free-text note
- location: 
- user action: 
- behaviour: 2-row textarea writing `{note: e.target.value}` on every keystroke (F:23729-23735).
- v6 status: WORKING - Evidence: F:23729.

### F-CYCLE-032 — Calendar view
- location: Cycle screen > header toggle (calendar icon) > `McCalendar`
- user action: taps ‹ / › to change month; taps a day cell
- behaviour: 1. Month grid built from `new Date(y, m, 1).getDay()` and `new Date(y, m+1, 0).getDate()` (F:23762-23763); Sunday-first. 2. Predictions projected **three cycles forward** from `C.nextStart` when `!C.stale` (F:23772-23789): `predPeriod` for `periodLen` days from each projected start; `predPre` for the 3 days before each start when `mcPreSymptoms` is non-empty; and when `!hbc`, `predOvu` at `base + ovuDay - 1 - avgLen` and `predFert` spanning `ovu-5 .. ovu+1`. 3. Current-cycle fertile window overlaid from `C.fertA..C.fertB` (F:23790-23793). 4. Logged days painted menstrual with alpha by flow: `>=3 → "E6"`, `2 → "99"`, else `"55"` (F:23875). 5. Dots: luteal dot for symptom/energy days, follicular dot for fertile, faded luteal dot for predicted-PMS (F:23876-23900). 6. Borders: today = 2px orange, predicted period = dashed menstrual, ovulation = solid follicular (F:23914). 7. Legend row: Period / Predicted / Fertile est. / Symptoms (+ "/ forecast" when pre-symptoms exist) (F:23936-23975). 8. Tapping a cell → `p.onPickDay(iso)` → `setSheetDate(iso)` (F:23905, F:25369-25371).
- v6 status: WORKING - Evidence: F:23905 cell tap wiring; F:23772-23793 prediction fill.

### F-CYCLE-033 — Calendar stats strip
- location: 
- user action: 
- behaviour: when `C.lens.length > 0`, three tiles: "Cycles" = `lens.length + 1`, "Avg length" = `avgLen + "d"`, "Variation" = `"±" + max(1, round(C.sd)) + "d"` (F:23976-24014).
- v6 status: WORKING - Evidence: F:23976.

### F-CYCLE-034 — Cycle history bar chart
- location: 
- user action: 
- behaviour: when `C.lens.length >= 2`, renders a bar per stored cycle length, heights normalized between 18 and 60px (`18 + (L-mn)/(mx-mn)*42`, flat 46 when all equal), latest bar at full opacity (F:24015-24064). Caption: "Your last N cycle lengths in days · average Nd. This is what predictions are built from."
- v6 status: WORKING - Evidence: F:24030-24033.

### F-CYCLE-035 — Cycle settings sheet
- location: Cycle screen > header gear icon
- user action: edits fields, toggles switches, exports, deletes - Behavior (rows, in order): 1. **Typical cycle length** — number input, clamped on blur to 15–60; if the typed value differs, the field is rewritten and a toast fires: "Cycle length has to be between 15 and 60 days — set to N." (F:24178-24196). 2. **Typical period length** — same pattern, 1–10, with its own toast (F:24211-24228). 3. **Irregular cycles** toggle → `upd({irregular})` (F:24243-24247). 4. **Birth control** chip row from `MC_BC_OPTS` with note "Hormonal options switch to bleed + symptom tracking — no fertility estimates." (F:24254-24300). 5. **Discreet home card** toggle (F:24301-24303). 6. **Cloud backup** toggle — see F-CYCLE-036. 7. **Export my data (JSON)** — see F-CYCLE-037. 8. **Delete all cycle data** — see F-CYCLE-038. 9. Footer shield line varying by `cloudOn` (F:24390-24404).
- behaviour: 
- v6 status: WORKING - Evidence: F:24187-24196 clamping + toast path.

### F-CYCLE-036 — Cloud backup toggle (opt-in health-data sync)
- location: Cycle settings > "Cloud backup"
- user action: flips the switch
- behaviour: 1. Calls `window.LOCKED.setCycleSync(next)` inside try/catch, then `p.setCloudOn(next)` (F:24302-24310). 2. `setCycleSync(true)` (F:1176-1186): writes `lk_mcCloudSync = "1"`, pushes `lk_mcProfile` and `lk_mcDays` into `SYNC_KEYS`, back-stamps `__lk_ts__<key>` for existing data so the next merge uploads it, and if signed in triggers `syncBidirectional()`. 3. `setCycleSync(false)` (F:1188-1205): removes the flag, removes both keys from `SYNC_KEYS`, deletes their `__lk_ts__` stamps, and if signed in POSTs nulls for both keys to clear the cloud copy; local data untouched. 4. At boot the flag is re-read and keys re-added if `=== "1"` (F:222-227). 5. Descriptive copy switches on state, and appends "You're in guest mode — backup starts once you sign in." when `!window.LOCKED.isLoggedIn` (F:24312).
- v6 status: WORKING - Evidence: F:1176-1205 full enable/disable implementation.

### F-CYCLE-037 — Export cycle data (JSON)
- location: Cycle settings > "Export my data (JSON)"; also the health card's "Export for my doctor" (F:24455-24478) - Behavior (`mcExportData`, F:22199-22232): 1. Builds `JSON.stringify({profile: mcp, days: days, exported: mcTodayISO()}, null, 2)`. 2. Tries the Web Share API with a `File` named `locked-cycle-data.json` when `navigator.canShare({files})` allows. 3. Otherwise creates a Blob object URL and triggers an `<a download="locked-cycle-data.json">` click, revoking the URL after 2000 ms.
- user action: 
- behaviour: 
- v6 status: WORKING - Evidence: F:22219-22230 blob fallback.

### F-CYCLE-038 — Delete all cycle data
- location: Cycle settings > red "Delete all cycle data" → inline confirm
- user action: 
- behaviour: 1. First tap sets `confirmDel` and swaps in a confirm panel "Delete everything? This can't be undone." with Cancel/Delete (F:24338-24389). 2. Delete calls `p.onDeleteAll()` (F:26005-26018): disables cycle sync via `setCycleSync(false)` (which also clears the cloud copy), `localStorage.removeItem("lk_mcProfile")` and `removeItem("lk_mcDays")`, then resets `cloudOn=false`, `days={}`, `mcp=null`, closes settings. 3. With `mcp === null` the screen falls back to `McOnboarding` (F:25169).
- v6 status: PARTIAL

### F-CYCLE-039 — Athlete health flags (RED-S / amenorrhea)
- location: Cycle screen > CYCLE HEALTH card
- user action: "Got it" (non-red flags) or "Export for my doctor" (red flag) - Behavior (`mcAthleteFlags`, F:22233-22318): 1. Returns null when `hbc`, no `lastStart`, `day == null`, during `pregRecovery`, or when an `ecDate` is active (F:22234-22235). 2. `recent` = any day log or any workout in `history` within the last 14 days (F:22237-22252). 3. `trendUp` = 3+ cycles with strictly increasing lengths and last − third-last ≥ 8 days (F:22254). 4. `oligo` = last two cycles both > 35 days (F:22255). 5. `spike` = with ≥6 workouts, `(count in last 21d)/3 / ((count in 22–63d)/6) >= 1.5 && c3 >= 6` (F:22256-22270). 6. `tired` = count of last-14-day logs with `sym.fatigue >= 2` or `energy <= 2` (F:22271-22277). 7. Context line appended when spike and/or tired ≥ 3 (F:22278-22282). 8. Flag priority (F:22283-22317): `gap >= 90 && recent` → **red** "3 MONTHS WITHOUT A PERIOD" (secondary amenorrhea, RED-S, "2–4× higher stress-fracture risk", `exportBtn: true`); `gap >= 60` → **amber**; `trendUp` → **watch** "YOUR CYCLES ARE STRETCHING"; `oligo` → **watch** "CYCLES RUNNING OVER 35 DAYS"; `gap >= 45` → **watch** "THIS CYCLE IS RUNNING LONG". 9. `McHealthCard` (F:24405-24500) hides itself if `f.level !== "red" && ack[f.key]`; the "Got it" button writes `mcp.healthAck[f.key] = true` (F:24479-24494). Red flags cannot be dismissed. 10. Footer: "General information, not a diagnosis — cycle changes have many causes." (F:24495-24499)
- behaviour: 
- v6 status: WORKING - Evidence: F:22283-22289 red-flag return; F:24479-24494 acknowledgement write.

### F-CYCLE-040 — Pregnancy-end recovery mode
- location: Cycle screen > CYCLE RESET card + ring/center overrides - Trigger: logging an `abortion` or `miscarriage` event on any day
- user action: 
- behaviour: 1. `mcPregEnds` collects those dates (F:21952-21959). 2. `mcPeriodStarts` **discards** any period start falling 0–14 days after a pregnancy end (F:21974-21982) — recovery bleeding is not treated as a period. 3. `mcCompute` sets `pregRecovery = {date, days, kind, expectA: +28d, expectB: +42d}` when the last pregnancy end is after the last period start and is 0–70 days old (F:22110-22126), and nulls `ovuDate/fertA/fertB/pmsA/pmsB` (F:22136-22142). 4. `McRecoveryCard` (F:24501-24586) shows "TRACKING FROM TODAY" / "N DAYS ON" / "N WEEKS ON", the 4–6 week expectation window `mcFmt(expectA)–mcFmt(expectB)`, an "ovulation can return within about two weeks" warning, and a red medical-help box (soaking two pads an hour for two hours, fever, severe pain, foul-smelling discharge). 5. While recovering the ring goes neutral (F:22425), the training and nutrition cards are suppressed (F:25843, F:25849), prediction carousel hidden (F:25732), health flags suppressed (F:22235).
- v6 status: WORKING - Evidence: F:22110-22126 recovery object construction.

### F-CYCLE-041 — Emergency contraception (EC) card
- location: Cycle screen > "AFTER THE MORNING-AFTER PILL" card
- user action: dismiss X
- behaviour: 1. `mcCompute` scans days for `ev.ec` in the past, not before `lastStart`, within 45 days, taking the latest (F:22127-22135). 2. If found, prediction confidence widens: `conf = min(7, conf + 3)` (F:22135). 3. `McEcCard` (F:24587-24653) shows "Logged <date>…up to a week early or late…" plus the "if your period is more than a week late, take a test" note; dismiss writes `{ecDismissed:true}` on today (F:24603-24606). 4. An active `ecDate` also suppresses all athlete health flags (F:22235).
- v6 status: WORKING - Evidence: F:22127-22135 detection; F:24603 dismissal.

### F-CYCLE-042 — "Your patterns" insights
- location: Cycle screen > YOUR PATTERNS card - Behavior (`mcInsights`, F:22319-22403, max 3 items, requires ≥2 period starts): 1. **Symptom timing** — for each symptom with ≥3 logs: `before/total >= 0.6` → "<Symptom> — mostly in the days before your period (N of M logs)."; else `during/total >= 0.6` → "…mostly during your period…". Buckets come from `mcSymptomBuckets` (F:22150-22183): `during` = within `periodLen` days of a start; `before` = 1–5 days before the next start. 2. **Energy by phase** — requires ≥3 energy logs in a phase and a high/low mean gap ≥ 0.8 → "Your logged energy runs highest in your <x> phase and dips in your <y> phase." 3. **Training volume by phase** — requires ≥6 dated workouts with `liftVolume`, ≥2 per phase, best/worst ratio ≥ 1.2 → "Your average session volume is highest in your <x> phase — your own data, not a rule." 4. Empty state copy at F:25887-25896.
- user action: 
- behaviour: 
- v6 status: WORKING - Evidence: F:22403 `out.slice(0,3)`.

### F-CYCLE-043 — "The science" education accordion
- location: Cycle screen > THE SCIENCE collapsible
- user action: taps the header to expand
- behaviour: 8 static entries (F:25957-25963): Phases are estimates; Training on your period (cites **Colenso-Semple et al., 2023** — "no effect of cycle phase on strength or muscle growth"); Irregular is common; Athletes & missing periods (RED-S); On hormonal birth control; Emergency contraception; After an abortion or miscarriage; When to see a doctor. Footer "General guidance, not medical advice." (F:25977-25984), plus a page-level disclaimer (F:25985-25995).
- v6 status: WORKING - Evidence: F:25957 content array.

### F-CYCLE-044 — Discreet mode
- location: Cycle settings > "Discreet home card"; effects across the module - Behavior when `mcp.discreet`: 1. Home card title becomes "Wellness", subtitle "Tap to open" (F:22679, F:22720). 2. Screen header title becomes "Wellness" (F:25361). 3. Log sheet hides the SEX section and the whole EVENTS section (F:23496, F:23540). 4. `mcFuelContext` returns null (F:24879) and `McTrainBanner` returns null (F:25067) — all cross-module surfacing is suppressed.
- user action: 
- behaviour: 
- v6 status: WORKING - Evidence: F:24301-24303 toggle; F:25067 banner suppression.

### F-CYCLE-045 — Non-female gate screen
- location: `cycletrack` route for a user whose sex is not Female
- user action: 
- behaviour: back arrow plus the line "Cycle tracking appears when your sex is set to Female in Profile → Body Stats." (F:25141-25168).
- v6 status: WORKING - Evidence: F:25141.

### F-CYCLE-046 — Header controls (back / calendar toggle / settings) and privacy sub-line
- location: Cycle screen > `DsHeader`
- user action: 
- behaviour: back → `go("home")` (F:25366-25389); the middle button toggles `view` between `"cycle"` and `"calendar"` and swaps its icon (`D.cal` ↔ `D.time`), tinting orange in calendar view (F:25390-25417); gear opens settings (F:25418-25442). Under the title, a shield icon and either "Backed up privately to your account" or "Private — data stays on this device" depending on `cloudOn` (F:25443-25468).
- v6 status: WORKING - Evidence: F:25394-25396 view toggle. ---
