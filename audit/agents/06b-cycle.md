# Agent 6b — Menstrual Cycle Tracking module audit

File audited: `redesign/input/locked-current-v6.html` (referred to below as **F**).
Exclusive range: **22417–26140**. Shared helpers cited outside the range where a feature depends on them (mostly F:21839–22416 and F:200–1210).

Entry points into the module:
- Home block `cycletrack` → `CycleTrackerCard` (F:26611-26614), gated on `isFemaleUser` (F:26612).
- Train tab → `McTrainBanner` (F:15465-15468).
- Screen route `"cycletrack"` → `CycleTrackerScreen` (F:57675-57679).
- Fuel: **no call site exists** for `McFuelStrip` / `mcFuelContext` (see F-CYCLE-020).

---

## PART A — Features

### F-CYCLE-001 Home "Cycle Tracking" setup card (not yet set up)
- Location: Home tab > home feed block `cycletrack` > gradient promo card
- User action: taps the card's "TRACK CYCLE" button
- Behavior:
  1. `CycleTrackerCard` reads the profile with `mcGetProfile()` (F:22597).
  2. If `!mcp || !mcp.setup`, renders the promo card with drop icon, headline "CYCLE TRACKING", subtitle "Connect your cycle to your training. Private — stays on this device." (F:22599-22665).
  3. Button calls `p.go("cycletrack")` (F:22668) → screen route (F:57675).
- Components: `CycleTrackerCard` (F:22596-22750)
- Functions: `mcGetProfile` (F:21934-21936), `isFemaleUser` (F:21946-21951)
- State: none local; reads localStorage each render
- Storage: reads `lk_mcProfile`
- Network: none
- AI: none
- Edge cases: hidden entirely for non-female users (F:26612); no loading state (synchronous localStorage read).
- Gating: `isFemaleUser(profile)` — profile.sex === "female" or fuelProfile.sex === "female" (F:21946-21951). Home block can also be hidden via home layout (F:26105-26111 block def `cycletrack`).
- Status: WORKING
- Evidence for status: F:22668 wires `go("cycletrack")` to a live route at F:57675.
- Notes: card is rendered on every Home render and re-parses localStorage each time (no memo).

### F-CYCLE-002 Home cycle status card (set up)
- Location: Home tab > `cycletrack` block > compact card with day ring + LOG button
- User action: taps anywhere on the card, or the "LOG" pill
- Behavior:
  1. `mcGetDays()` + `mcCompute(mcp, days)` derive the cycle state (F:22671-22673).
  2. Ring badge shows `C.day` or "—"; colored by `MC_COL[phaseOfDay(C.day)]` (F:22694-22712).
  3. Title = `"Day N · <PhaseName>"`, or `"Wellness"` when `mcp.discreet`, or `"Cycle"` (F:22720-22727).
  4. Subtitle `sub` resolved by a priority chain (F:22679-22690): discreet → "Tap to open"; pregRecovery → "Cycle reset — predictions paused"; `C.day == null` → "Log your period to start predictions"; `C.stale` → "Log your period to refresh predictions"; `stillBleeding` (yesterday flow>=2 and today unlogged, F:22676-22678) → "Still bleeding? One tap to log"; `C.overdue > 0` → "Period expected — log it when it starts"; `C.hbc` → "Bleed day N"/"Day N"; else countdown "Period in N days" / "Period expected today"; fallback "Day N".
  5. Both card and LOG button navigate to `cycletrack` (F:22668-22750); LOG uses `e.stopPropagation()`.
- Components: `CycleTrackerCard` (F:22596-22750)
- Functions: `mcCompute` (F:21990-22149), `mcGetDays` (F:21940-21942), `mcAddDays` (F:21918-21922), `mcDiff` (F:21923-21925), `readableAccent` (F:4318)
- State: none local
- Storage: reads `lk_mcProfile`, `lk_mcDays`
- Network: none
- AI: none
- Edge cases: `C.day == null` renders "—" in the badge (F:22712); discreet mode suppresses all cycle wording.
- Gating: `isFemaleUser` (F:26612)
- Status: WORKING
- Evidence for status: F:22679-22690 full sub-line chain and F:22673 phase computation both execute on render.
- Notes: the "LOG" button does not log anything — it just navigates (F:22740-22743). Misleading label.

### F-CYCLE-003 Cycle onboarding — step 0, privacy intro
- Location: Cycle screen (first entry) > `McOnboarding` step 0
- User action: taps "GET STARTED"; back arrow returns Home
- Behavior: shows drop icon, "CYCLE TRACKING" headline, value line, and a shield privacy panel stating "Cycle data stays on this device — cloud backup is optional and off by default. Never sold or shared; export or delete it any time." (F:22894-22952). `setStep(1)`.
- Components: `McOnboarding` (F:22751-23146), `Btn` (F:22776-22795)
- Functions: none beyond setters
- State: `step` (F:22752)
- Storage: none until finish
- Network / AI: none
- Edge cases: back at step 0 calls `p.onBack()` → `go("home")` (F:25172-25176 wiring at F:25169-25178)
- Gating: shown when `!mcp || !mcp.setup` (F:25169)
- Status: WORKING
- Evidence: F:23106-23112 back handler; F:22950 Btn wiring.

### F-CYCLE-004 Onboarding step 1 — goal
- Location: `McOnboarding` step 1
- User action: taps one of four goal options, then NEXT (or "Skip" in the header)
- Behavior: options from `MC_GOALS` = understand / train / symptoms / track (F:21910); selection sets `goal` (F:22981-22985); NEXT → step 2.
- Components: `McOnboarding` (F:22751), `optBtn` (F:22796-22834)
- State: `goal` default `"understand"` (F:22753)
- Storage: written on finish into `lk_mcProfile.goal`
- Status: PARTIAL
- Evidence for status: `goal` is persisted (F:22765) but no other code reads `mcp.goal` — grep for `.goal` usage in the module finds no consumer; the copy claims "This shapes what we surface first." (F:22972-22978).
- Notes: dead preference; UNVERIFIED whether any out-of-range code reads it (see Open questions).

### F-CYCLE-005 Onboarding step 2 — last period start date
- Location: `McOnboarding` step 2
- User action: picks a date in a native `<input type="date">`, or taps "I'm not sure"
- Behavior:
  1. `max` clamped to `mcTodayISO()` (F:23000).
  2. Choosing a date sets `lastStart` and clears `notSure` (F:23001-23004).
  3. "I'm not sure" toggles `notSure` and clears `lastStart` (F:23018-23021).
  4. NEXT → step 3.
- Components: `McOnboarding`, `optBtn`
- State: `lastStart`, `notSure` (F:22754-22755)
- Storage: `lastStart: notSure ? null : lastStart || null` on finish (F:22764)
- Edge cases: date input `colorScheme` follows `isDarkMode` (F:23013).
- Status: WORKING
- Evidence: F:22764 persists; `mcPeriodStarts` seeds a synthetic start from `mcp.lastStart` (F:21983-21988).

### F-CYCLE-006 Onboarding step 3 — typical cycle/period length + irregular
- Location: `McOnboarding` step 3
- User action: types cycle length and period length; toggles "My cycles are irregular"
- Behavior: two numeric inputs (F:23046-23087); irregular toggle via `optBtn` (F:23088-23090). Values only clamped at `finish()`: cycleLen clamped 15–60, periodLen clamped 1–10 (F:22766-22767).
- State: `cycleLen` default "28", `periodLen` default "5", `irregular` false (F:22756-22758)
- Storage: `lk_mcProfile.cycleLen/.periodLen/.irregular`
- Edge cases: no inline validation feedback here (unlike Settings, which toasts — F:24187-24192). Garbage text falls back to 28/5 silently.
- Status: WORKING
- Evidence: F:22766-22767 clamping executes at finish.

### F-CYCLE-007 Onboarding step 4 — birth control, finish
- Location: `McOnboarding` step 4 (final)
- User action: taps one of 7 `MC_BC_OPTS` chips, then "START TRACKING"
- Behavior:
  1. `finish()` builds profile object `{setup:true, goal, lastStart, cycleLen, periodLen, irregular, birthControl, discreet:false, createdAt: mcTodayISO()}` (F:22762-22773).
  2. `mcSaveProfile(prof)` → `sd("mcProfile", prof)` → `localStorage.lk_mcProfile` (F:21937-21939, F:2435).
  3. `p.onDone(prof)` → `setMcpRaw(prof)` in the screen (F:25172-25174).
- Components: `McOnboarding`
- State: `bc` default `"none"` (F:22759)
- Storage: writes `lk_mcProfile`
- Network: none directly; if cloud backup was previously enabled, the localStorage patch stamps `__lk_ts__lk_mcProfile` (F:236-240) and the value is later synced.
- Edge cases: hormonal options (`MC_HBC` = pill/patch/ring/hiud/implant/shot, F:21908) switch the whole module to bleed-only mode.
- Gating: always on inside the module
- Status: WORKING
- Evidence: F:22774 `mcSaveProfile(prof)`.

### F-CYCLE-008 Onboarding progress dots / Skip
- Location: `McOnboarding` header
- User action: taps back chevron, or "Skip"
- Behavior: 5 dots (`TOTAL = 5`, F:22761), active dot widened (F:23120-23132); Skip shown only for `step > 0 && step < 4` and advances a step without recording anything (F:23133-23147). Content animates with `fadeUp .3s`, keyed on `step` (F:23153-23157).
- Status: WORKING
- Evidence: F:23133-23140 Skip handler.
- Notes: Skip on step 4 is unavailable, so BC is unskippable-by-skip but defaults to `"none"`.

### F-CYCLE-009 Cycle ring — display
- Location: Cycle screen > "cycle" view > top
- User action: view only
- Behavior:
  1. Ring is a 272px SVG, radius 116, stroke 17 (F:22419-22421).
  2. Segment layout (F:22424-22462): `neutral` single segment when `C.day == null || C.pregRecovery`; two segments (menstrual 1..periodLen, neutral rest) when `C.hbc`; otherwise menstrual 1..periodLen, follicular periodLen+1..oA-1, ovulatory oA..oB, luteal oB+1..L, where `oA = max(periodLen+1, ovuDay-1)`, `oB = min(L, ovuDay+1)`.
  3. `L = max(C.avgLen, C.day || 1)` so an overdue cycle stretches the ring (F:22422).
  4. Faint track drawn at 0.22 opacity, then the "elapsed" arcs clipped at today's angle (F:22505-22530).
  5. Today marker: filled dot colored by phase with white ring (F:22543-22563).
  6. `aria-label` varies for recovery / day-known / setup (F:22499-22501).
- Components: `McRing` (F:22417-22595)
- Functions: `mcArcPath` (F:22411-22416), `mcPolar` (F:22404-22410), `angA`/`angB` (F:22463-22468), `MC_COL` (F:21839-21845)
- State: `dragging` ref (F:22488)
- Storage / Network / AI: none
- Edge cases: segments with `a2 <= a1` are skipped (F:22508, F:22523) so a periodLen ≥ avgLen degenerates gracefully.
- Gating: always on inside the screen
- Status: WORKING
- Evidence: F:22505-22530 both arc passes render from computed segments.

### F-CYCLE-010 Cycle ring — drag-to-preview any day
- Location: Cycle screen > ring
- User action: press and drag around the ring circumference
- Behavior:
  1. Invisible hit stroke (`strokeWidth: sw + 28`, `pointerEvents: "stroke"`) captures pointer events (F:22565-22590).
  2. `scrub(ev)` returns immediately when `neutral`; ignores touches closer than `28%` of the width to the center (F:22469-22482).
  3. Angle → day: `d = min(L, max(1, floor(deg/360*L)+1))` (F:22480).
  4. `p.onPreview(d === C.day ? null : d)` → `setPreview` in the screen (F:25378).
  5. Preview draws a hollow outline dot at the previewed angle (F:22531-22542).
  6. Screen center swaps to the previewed date, day number and phase name (F:25248-25281).
  7. Below the ring: "Log <date>" button (only if `pvISO <= todayISO`) and "Back to today" (F:25390-25422).
- Components: `McRing` (F:22417), `CycleTrackerScreen` (F:25108)
- Functions: `scrub` (F:22469-22482)
- State: `preview` (F:25117), `dragging` ref (F:22488)
- Edge cases: drag disabled in neutral/recovery state; hint text "Drag the ring to preview any day" only when `C.day != null && !pregRecovery && !preview` (F:25423-25432).
- Status: WORKING
- Evidence: F:22575-22589 pointer handlers call `scrub`.
- Notes: `onPointerUp/Leave` clear dragging but there is no `setPointerCapture`, so a drag leaving the element mid-gesture stops updating.

### F-CYCLE-011 Cycle screen center readout states
- Location: Cycle screen > inside the ring
- Behavior — four mutually exclusive centers:
  1. **Recovery**: "CYCLE RESET", big day count, "day(s) since <date> · log your next period to restart predictions" (F:25207-25242).
  2. **No data / stale**: drop icon plus "It's been a while — log your period to restart predictions." or "Tap Log Period on day one and everything starts from there." (F:25243-25247, F:25266-25271).
  3. **Preview** (F:25272-25305): previewed date, day number, phase name, "day N of ~avgLen".
  4. **Normal** (F:25306-25360): "CYCLE DAY", `C.day` at 4rem, phase name (or "Bleed"/"Tracking" on HBC), then "Period in ~Nd" / "Period expected today" when `overdue === 0`, or "Nd past estimate".
- Components: `CycleTrackerScreen`
- Status: WORKING
- Evidence: F:25306-25360 normal branch.

### F-CYCLE-012 Quick action grid (4 tiles)
- Location: Cycle screen > below the ring
- User action: taps Log Period / Symptoms / Energy-or-Pill / More
- Behavior:
  1. **Log Period** — `quickLogPeriod()` (F:25191-25202): if today's flow ≥ 2, set `flow: 0` (un-log); else set `flow: 3` (Medium). Tile shows "Logged" when `flow >= 2`.
  2. **Symptoms** — `setSheetDate(C.todayISO)` opens the log sheet (F:25470); tile is tinted when today has any symptom keys.
  3. **Third tile** — on hormonal BC it is a pill-taken toggle writing `{pill: !todayLog.pill}` and labeled with `bcLabel` (F:25491-25522); otherwise it toggles the inline energy bar (F:25523-25554).
  4. **More** — `setSheetDate(C.todayISO)` (F:25555-25580), identical to Symptoms.
- Components: `CycleTrackerScreen`
- Functions: `quickLogPeriod` (F:25191-25202), `updateDay` (F:25123-25128)
- State: `energyBar` (F:25119), `sheetDate` (F:25115)
- Storage: writes `lk_mcDays`
- Edge cases: un-logging sets `flow: 0` rather than deleting the key, so the day object persists with `flow:0` (matters for the calendar's `logged` test at F:23869 which requires `>= 1`).
- Status: WORKING
- Evidence: F:25191-25202 writes via `updateDay` → `mcSaveDays`.
- Notes: two of four tiles ("Symptoms", "More") do exactly the same thing (F:25470, F:25557) — duplicated affordance.

### F-CYCLE-013 Inline energy bar (1–5)
- Location: Cycle screen > strip under the quick grid
- User action: taps a number 1–5
- Behavior: rendered when `energyBar && !C.hbc` (F:25581); tapping writes `{energy: act ? null : n}` for today and closes the bar (F:25610-25614).
- State: `energyBar`
- Storage: `lk_mcDays[today].energy`
- Status: WORKING
- Evidence: F:25610-25614.
- Notes: hidden on hormonal BC because the tile that opens it is replaced by the pill toggle; energy is still reachable via the log sheet (F:23414-23448).

### F-CYCLE-014 Inline flow strip
- Location: Cycle screen > strip shown when `periodOn` (`flow >= 2`)
- User action: taps Spotting / Light / Medium / Heavy
- Behavior: `MC_FLOWS.slice(1)` rendered; taps write `{flow: v}` where v is 1..4 (F:25636-25679). Note the strip appears only for flow ≥ 2, so Spotting (1) can be selected but then the strip disappears on the next render.
- Storage: `lk_mcDays[today].flow`
- Status: PARTIAL
- Evidence for status: visibility condition `periodOn = (todayLog.flow||0) >= 2` (F:25203) while the strip offers value 1 (F:25655) — selecting "Spotting" instantly hides the control the user is using.
- Notes: bug worth fixing in redesign.

### F-CYCLE-015 Phase-of-today explainer card
- Location: Cycle screen > below the quick controls (hidden during recovery)
- Behavior:
  1. Colored dot + `<PHASE> · TODAY` heading, or `BLEED`/`TRACKING` on HBC (F:25680-25710).
  2. Body = `MC_PHASE_INFO[ph].line`, or an HBC-specific line: "On <bc>, hormone levels are steady rather than cyclical — so we track how you actually feel instead of predicting phases." (F:25711-25717).
  3. Footer computes the typical day range for the phase: menstrual `[1, periodLen]`, follicular `[periodLen+1, ovuDay-2]`, ovulatory `[ovuDay-1, ovuDay+1]`, luteal `[ovuDay+2, avgLen]`; suppressed if the range inverts (F:25718-25731).
- Functions: `MC_PHASE_INFO` (F:21853-21879)
- Status: WORKING
- Evidence: F:25718-25731 range logic.
- Notes: the footer range for follicular uses `ovuDay-2` whereas `phaseOfDay` boundary is `d < ovuDay - 1` — consistent, but the ring's `oA` uses `max(periodLen+1, ovuDay-1)`; three near-duplicate definitions of the same boundaries (F:22437-22438, F:22118-22126, F:25720).

### F-CYCLE-016 Prediction cards carousel (Next period / Fertile window / PMS window)
- Location: Cycle screen > horizontally scrollable row
- Behavior:
  1. Rendered only when `!C.stale && !C.pregRecovery && C.nextStart` (F:25732).
  2. **NEXT PERIOD / NEXT BLEED** always first: value `mcFmt(C.nextStart)`, or "Any day" if overdue; sub = `"est. <date> · Nd ago"` when overdue, `"expected today"`, or `"in Nd · ±<confBand>d"` (F:25746-25760).
  3. **FERTILE WINDOW** shown when `!hbc && C.fertA && C.fertB >= todayISO && C.sd < 6`; sub `"±Nd · not contraception"` (F:25761-25767).
  4. **PMS WINDOW** shown when `!hbc && C.pmsA && !C.overdue`; sub appends "<symptom> often hits here" from `mcPreSymptoms` (F:25768-25774).
  5. `confBand = C.irregular ? max(3, C.conf) : C.conf` (F:25185).
- Functions: `mcPreSymptoms` (F:22189-22198), `mcFmt` (F:21926-21930)
- Status: WORKING
- Evidence: F:25744-25795 card construction and render.
- Notes: the fertile window is explicitly labelled "not contraception". Fertile card suppressed when SD ≥ 6 days — honest-uncertainty design.

### F-CYCLE-017 Irregular-cycle disclaimer line
- Location: Cycle screen, under the carousel
- Behavior: when `C.irregular && !stale && !pregRecovery && nextStart`, shows "Your cycles vary, so treat dates as ranges, not appointments. Predictions sharpen as you log." (F:25800-25807)
- Status: WORKING
- Evidence: F:25800.

### F-CYCLE-018 Overdue explainer (≥5 days late)
- Location: Cycle screen card
- Behavior: when `C.overdue >= 5 && !stale && !pregRecovery`, renders "Running N days past the estimate. Cycles shift — stress, travel, illness and hard training blocks can all delay ovulation. If you're sexually active, a test can rule things out; if late cycles keep repeating, it's worth mentioning to a clinician." (F:25807-25822)
- Status: WORKING
- Evidence: F:25807.

### F-CYCLE-019 Training card (in-module coach nudge)
- Location: Cycle screen > TRAINING card
- User action: taps "Take it lighter" / "I feel fine — keep my plan" / "Open Train"
- Behavior:
  1. `rough` = `sym.cramps >= 2 || sym.fatigue >= 2 || sym.headache >= 2 || (d.energy && d.energy <= 2)` (F:24659).
  2. If `rough` and no prior decision (`d.coach` unset): body names the reasons ("You logged cramps and fatigue. Want to trade today's heavy work for machines, mobility or Zone 2? It still moves you forward.") plus two buttons (F:24664-24730).
  3. "Take it lighter" writes `{coach: "adjusted"}`; "I feel fine" writes `{coach: "kept"}` (F:24686, F:24709).
  4. `adjusted` state: "Noted — go lighter today. Think machines over free weights, mobility work, or 20–30 min Zone 2…" plus an "Open Train" button calling `p.go("train")` (F:24731-24755).
  5. `kept` state: `"Plan unchanged. " + MC_PHASE_INFO[ph].train`.
  6. Otherwise: `MC_PHASE_INFO[ph].train` alone (F:24759).
  7. Footer disclaimer: "Guidance follows how you feel, not a calendar — evidence doesn't support rigid phase-based programming." (F:24774-24776)
- Components: `McTrainingCard` (F:24654-24776)
- Storage: `lk_mcDays[today].coach` ∈ {"adjusted","kept"}
- Gating: rendered only when `C.day != null && !C.pregRecovery` (F:25843)
- Status: WORKING
- Evidence: F:24686/24709 write `coach` through `updateDay`.
- Notes: the phase→training copy is static text per phase, not generated; no AI, no model call anywhere in the module.

### F-CYCLE-020 Nutrition card (Fuel bridge)
- Location: Cycle screen > FUEL card
- User action: taps "Open Fuel ›" or the dismiss X
- Behavior:
  1. Hidden if `d.nutriDismissed` (F:24779); the X writes `{nutriDismissed:true}` for today (F:24800-24803).
  2. Body chosen by phase (F:24784): menstrual → iron message; luteal **with `sym.cravings`** → cravings message; luteal → higher-energy-needs message; ovulatory → appetite-dip message; follicular/neutral → **returns null (card not shown)**.
  3. Menstrual footnote: "Fuel is tracking your iron against the 18 mg daily target while you're bleeding." (F:24847)
  4. Luteal footnote depends on `mcFuelAdjustOn()`: "Fuel is adding a small calorie allowance this phase." vs "You can let Fuel add a small calorie allowance this phase — it's off by default." (F:24855)
  5. "Open Fuel ›" → `p.go("fuel")` (F:24858-24872).
- Components: `McNutritionCard` (F:24777-24872)
- Functions: `mcFuelAdjustOn` (F:24873-24875)
- Storage: reads `lk_mcFuelAdjust`; writes `lk_mcDays[today].nutriDismissed`
- Status: **PARTIAL — the claims it makes about Fuel are not implemented**
- Evidence for status: it asserts Fuel tracks iron against 18 mg (F:24847) and applies a luteal calorie allowance (F:24855), but `mcFuelContext` (F:24876) and `McFuelStrip` (F:24915) — the only code that would produce either — have **no call sites anywhere in the file** (grep across F finds them only at their definitions and inside each other). See F-CYCLE-021.
- Notes: the 18 mg iron target is hardcoded prose here; the actual value lives only in the never-rendered strip's `p.iron.goal` prop.

### F-CYCLE-021 Fuel cycle strip (DEAD CODE)
- Location: intended Fuel tab; **never mounted**
- User action: (would be) toggling "Add N kcal in this phase"
- Behavior as written:
  1. `mcFuelContext(profile)` (F:24876-24911) returns null unless female, set up, non-discreet and `C.day != null`; else `{day, phase, hbc, recovery, name, ironFocus, calAdj, tip}`.
  2. Tips: recovery → "Your cycle is resetting. Eat normally and don't cut hard right now — recovery needs fuel." with `ironFocus: true`; menstrual → iron tip, `ironFocus: true`; luteal → appetite tip, and `calAdj = 1` if `mcFuelAdjustOn()`; ovulatory → appetite-dip tip; else follicular tip (F:24888-24910).
  3. `mcLutealCalBump(baseCal)` = `min(150, round(baseCal*0.05/10)*10)` — 5% of maintenance, rounded to 10 kcal, capped at 150; defaults baseCal to 2200 (F:24912-24914).
  4. `McFuelStrip` renders the phase header, tip, an iron progress bar `p.iron.have / p.iron.goal mg` with a "Only counts foods with iron data" caveat, and — luteal, non-HBC, non-recovery only — a toggle writing `sd("mcFuelAdjust", n)` and calling `p.onChange(n)` (F:24915-25063).
- Components: `McFuelStrip` (F:24915-25063)
- Functions: `mcFuelContext` (F:24876-24911), `mcLutealCalBump` (F:24912-24914), `mcFuelAdjustOn` (F:24873-24875)
- Storage: would write `lk_mcFuelAdjust` (a SYNC key, F:210)
- Status: **DEAD**
- Evidence for status: `rg -n "McFuelStrip|mcFuelContext"` over F returns only F:24876, F:24915, F:24923 — i.e. the definitions themselves and one internal reference; no JSX/createElement call site exists.
- Notes: highest-value redesign finding — the entire documented "cycle changes what Fuel recommends" pathway is unwired. `lk_mcFuelAdjust` is nonetheless in the cloud SYNC_KEYS list (F:210).

### F-CYCLE-022 Train tab cycle banner
- Location: Train tab > banner under the recent-workouts block
- User action: taps the banner (also keyboard-activatable via `lkKeyActivate`)
- Behavior:
  1. Returns null unless `isFemaleUser(p.profile)`, a set-up non-discreet profile exists (F:25065-25068).
  2. Reads today's log directly from localStorage (`mcGetDays()[mcTodayISO()]`, F:25069).
  3. `rough` uses the same thresholds as the training card: cramps/fatigue/headache ≥ 2 or energy ≤ 2 (F:25071).
  4. Returns null if `!rough || t.coach === "kept"` (F:25072).
  5. Copy: `coach === "adjusted"` → "You planned to take today lighter — machines, mobility or Zone 2 all count."; else "Rough day logged in Cycle — consider going lighter today." (F:25094-25096).
  6. Tap → `p.go("cycletrack")` (F:25077).
- Components: `McTrainBanner` (F:25064-25107); mounted at F:15465-15468
- State: none (reads storage on every render)
- Storage: reads `lk_mcProfile`, `lk_mcDays`
- Status: WORKING
- Evidence: F:15465 renders it inside the Train screen.
- Notes: this is the **only** live cross-module influence of cycle state on Train. It does not change any programming, set, load or plan — it is a nudge link. Threshold logic duplicated verbatim between F:24659 and F:25071.

### F-CYCLE-023 Day log sheet — open/close
- Location: Cycle screen (or calendar) > bottom sheet
- User action: taps Symptoms/More/a calendar cell/a preview "Log <date>" button; closes by tapping the scrim, the drag pill, "Done", or Escape
- Behavior: `useEscape(p.onClose)` (F:23148) plus `useSheetDrag` (F:23149) supply escape-key and drag-to-dismiss; rendered through `lkPortal` at zIndex 1500 (F:23177-23186); max height 86dvh with safe-area padding (F:23193-23204). Title is "TODAY" or the formatted date (F:23231).
- Components: `McLogSheet` (F:23147-23753)
- Functions: `useEscape` (F:5160), `useSheetDrag` (F:2150), `lkPortal` (F:5072), `mcFmt` (F:21926)
- State: `evOpen` (F:23154-23156)
- Status: WORKING
- Evidence: F:23177 `lkPortal(...)` return.
- Notes: every edit writes immediately through `set()` → `p.updateDay` (F:23157-23159); there is no cancel/undo — "Done" only closes.

### F-CYCLE-024 Log sheet — flow picker
- Location: log sheet > FLOW
- User action: taps one of None / Spotting / Light / Medium / Heavy
- Behavior: 5-column grid from `MC_FLOWS` (F:23258); tapping index i writes `{flow: i === d.flow ? 0 : i}` (F:23262-23266); tick marks visualize intensity; active state requires `d.flow != null` (F:23259).
- Storage: `lk_mcDays[iso].flow` (0..4)
- Status: WORKING
- Evidence: F:23262-23266.
- Notes: tapping the already-active "None" (0) writes 0 again — harmless no-op.

### F-CYCLE-025 Log sheet — pill-taken toggle (HBC only)
- Location: log sheet, shown when `p.hbc`
- Behavior: row labeled "<bcLabel> taken" with a switch writing `{pill: !d.pill}` (F:23306-23346).
- Storage: `lk_mcDays[iso].pill`
- Gating: `p.hbc` — passed from `C.hbc` (F:25992)
- Status: WORKING
- Evidence: F:23327-23331.

### F-CYCLE-026 Log sheet — symptoms (3-state severity)
- Location: log sheet > SYMPTOMS
- User action: taps a symptom chip repeatedly
- Behavior: `cycleSym(id)` advances severity `(cur + 1) % 4`, deleting the key at 0 (F:23167-23175); labels "" / Mild / Moderate / Severe (F:23213). 12 symptoms from `MC_SYMPTOMS` (F:21880): cramps, headache, bloating, tender breasts, back pain, fatigue, acne, nausea, digestive, cravings, discharge, hot flashes. Background opacity encodes severity via `col + String(10 + sev*12)` (F:23374).
- Storage: `lk_mcDays[iso].sym[id] = 1|2|3`
- Status: WORKING
- Evidence: F:23167-23175.
- Notes: `col + String(10 + sev*12)` produces alpha suffixes "22"/"34"/"46" — decimal numbers used as hex alpha (F:23374); works by accident but is not the intended 0–255 hex ramp.

### F-CYCLE-027 Log sheet — mood multi-select
- Behavior: 8 chips from `MC_MOODS` (F:21881: Happy, Calm, Motivated, Irritable, Anxious, Low, Stressed, Sensitive); toggling splices in/out of `d.mood` array (F:23404-23412).
- Storage: `lk_mcDays[iso].mood` (array of label strings)
- Status: WORKING
- Evidence: F:23404-23412.
- Notes: stores display labels, not ids — localization/rename would break historical data.

### F-CYCLE-028 Log sheet — energy and sleep (1–5)
- Behavior: two 5-button rows; each writes `{energy: d.energy === n ? null : n}` / `{sleep: ...}` (F:23430-23432, F:23470-23472); buttons fill cumulatively (`>= n`).
- Storage: `lk_mcDays[iso].energy`, `.sleep`
- Status: WORKING
- Evidence: F:23430, F:23470.
- Notes: `sleep` is written but **no consumer exists** in the module — no insight, flag, or card reads `.sleep` (grep of the range). Effectively write-only data.

### F-CYCLE-029 Log sheet — sex activity
- Behavior: three buttons None / Protected / Unprotected writing `{sex: act ? null : o[0]}` (F:23508-23511); hidden when `p.discreet` (F:23496).
- Storage: `lk_mcDays[iso].sex`
- Status: PARTIAL
- Evidence for status: written at F:23508 but never read anywhere in the module (no fertility/risk logic consumes it).

### F-CYCLE-030 Log sheet — events (EC, pregnancy test, abortion, miscarriage, IUD)
- Location: log sheet > EVENTS collapsible ("contraception, tests, pregnancy")
- User action: expands the section, toggles event checkboxes, or picks Negative/Positive for a pregnancy test
- Behavior:
  1. Section auto-opens if the day already has events (F:23154-23156); chevron rotates (F:23557-23566).
  2. `MC_EVENTS` (F:21883-21903): `ec` (Morning-after pill), `test` (Pregnancy test), `abortion`, `miscarriage`, `iud`.
  3. `test` renders as a two-button result picker writing `ev.test = "neg" | "pos"` (F:23590-23621).
  4. All other events are boolean checkboxes: `setEv(id, on ? null : true)` deletes or sets `true` (F:23160-23166, F:23630-23632).
  5. `abortion` / `miscarriage` are tinted luteal via `MC_PREG_END` (F:21904-21907, F:23623-23625).
  6. Section footer restates the storage promise (F:23703-23724).
- Storage: `lk_mcDays[iso].ev = { ec?:true, test?:"neg"|"pos", abortion?:true, miscarriage?:true, iud?:true }`
- Gating: hidden when `p.discreet` (F:23540)
- Status: WORKING
- Evidence: F:23630-23632 event writes; consumed by `mcPregEnds` (F:21952-21959) and the `ecDate` scan (F:22127-22135).
- Notes: `ev.test` and `ev.iud` are stored but never read by any logic — only `abortion`/`miscarriage`/`ec` drive behavior. Discreet mode hides the events section entirely, so a discreet user cannot log an abortion/EC and cannot reach recovery mode.

### F-CYCLE-031 Log sheet — free-text note
- Behavior: 2-row textarea writing `{note: e.target.value}` on every keystroke (F:23729-23735).
- Storage: `lk_mcDays[iso].note` (free text — the most sensitive field in the model)
- Status: WORKING
- Evidence: F:23729.
- Notes: every keystroke triggers a full `mcSaveDays` JSON serialize of the whole days map (F:25123-25128 → F:21943-21945) — O(all history) write per character.

### F-CYCLE-032 Calendar view
- Location: Cycle screen > header toggle (calendar icon) > `McCalendar`
- User action: taps ‹ / › to change month; taps a day cell
- Behavior:
  1. Month grid built from `new Date(y, m, 1).getDay()` and `new Date(y, m+1, 0).getDate()` (F:23762-23763); Sunday-first.
  2. Predictions projected **three cycles forward** from `C.nextStart` when `!C.stale` (F:23772-23789): `predPeriod` for `periodLen` days from each projected start; `predPre` for the 3 days before each start when `mcPreSymptoms` is non-empty; and when `!hbc`, `predOvu` at `base + ovuDay - 1 - avgLen` and `predFert` spanning `ovu-5 .. ovu+1`.
  3. Current-cycle fertile window overlaid from `C.fertA..C.fertB` (F:23790-23793).
  4. Logged days painted menstrual with alpha by flow: `>=3 → "E6"`, `2 → "99"`, else `"55"` (F:23875).
  5. Dots: luteal dot for symptom/energy days, follicular dot for fertile, faded luteal dot for predicted-PMS (F:23876-23900).
  6. Borders: today = 2px orange, predicted period = dashed menstrual, ovulation = solid follicular (F:23914).
  7. Legend row: Period / Predicted / Fertile est. / Symptoms (+ "/ forecast" when pre-symptoms exist) (F:23936-23975).
  8. Tapping a cell → `p.onPickDay(iso)` → `setSheetDate(iso)` (F:23905, F:25369-25371).
- Components: `McCalendar` (F:23754-24065)
- Functions: `cellISO` (F:23787-23789), `mcPreSymptoms` (F:22189)
- State: `ym` (F:23757)
- Status: WORKING
- Evidence: F:23905 cell tap wiring; F:23772-23793 prediction fill.
- Notes: future days are tappable and open the log sheet, so a user can log data on a future date (F:23905, no `isFut` guard on the click). Only the ring's "Log <date>" button guards against the future (F:25390).

### F-CYCLE-033 Calendar stats strip
- Behavior: when `C.lens.length > 0`, three tiles: "Cycles" = `lens.length + 1`, "Avg length" = `avgLen + "d"`, "Variation" = `"±" + max(1, round(C.sd)) + "d"` (F:23976-24014).
- Status: WORKING
- Evidence: F:23976.

### F-CYCLE-034 Cycle history bar chart
- Behavior: when `C.lens.length >= 2`, renders a bar per stored cycle length, heights normalized between 18 and 60px (`18 + (L-mn)/(mx-mn)*42`, flat 46 when all equal), latest bar at full opacity (F:24015-24064). Caption: "Your last N cycle lengths in days · average Nd. This is what predictions are built from."
- Status: WORKING
- Evidence: F:24030-24033.
- Notes: max 6 bars because `mcCompute` slices `lens` to the last 6 (F:22012).

### F-CYCLE-035 Cycle settings sheet
- Location: Cycle screen > header gear icon
- User action: edits fields, toggles switches, exports, deletes
- Behavior (rows, in order):
  1. **Typical cycle length** — number input, clamped on blur to 15–60; if the typed value differs, the field is rewritten and a toast fires: "Cycle length has to be between 15 and 60 days — set to N." (F:24178-24196).
  2. **Typical period length** — same pattern, 1–10, with its own toast (F:24211-24228).
  3. **Irregular cycles** toggle → `upd({irregular})` (F:24243-24247).
  4. **Birth control** chip row from `MC_BC_OPTS` with note "Hormonal options switch to bleed + symptom tracking — no fertility estimates." (F:24254-24300).
  5. **Discreet home card** toggle (F:24301-24303).
  6. **Cloud backup** toggle — see F-CYCLE-036.
  7. **Export my data (JSON)** — see F-CYCLE-037.
  8. **Delete all cycle data** — see F-CYCLE-038.
  9. Footer shield line varying by `cloudOn` (F:24390-24404).
- Components: `McSettings` (F:24066-24404)
- Functions: `upd` (F:24070-24072), `row` (F:24076-24110), `toggle` (F:24111-24146), `exportData` (F:24073-24075)
- State: `confirmDel` (F:24069); parent `cloudOn` (F:25120)
- Storage: writes `lk_mcProfile` via `p.setMcp` → `mcSaveProfile` (F:25119-25122)
- Status: WORKING
- Evidence: F:24187-24196 clamping + toast path.
- Notes: unlike `McLogSheet`, this sheet is **not** wrapped in `lkPortal` and has **no** `useEscape` (F:24067 only calls `useSheetDrag`) — escape key does not close it and it renders in-tree rather than in a portal. Inconsistent with every other sheet in the module.

### F-CYCLE-036 Cloud backup toggle (opt-in health-data sync)
- Location: Cycle settings > "Cloud backup"
- User action: flips the switch
- Behavior:
  1. Calls `window.LOCKED.setCycleSync(next)` inside try/catch, then `p.setCloudOn(next)` (F:24302-24310).
  2. `setCycleSync(true)` (F:1176-1186): writes `lk_mcCloudSync = "1"`, pushes `lk_mcProfile` and `lk_mcDays` into `SYNC_KEYS`, back-stamps `__lk_ts__<key>` for existing data so the next merge uploads it, and if signed in triggers `syncBidirectional()`.
  3. `setCycleSync(false)` (F:1188-1205): removes the flag, removes both keys from `SYNC_KEYS`, deletes their `__lk_ts__` stamps, and if signed in POSTs nulls for both keys to clear the cloud copy; local data untouched.
  4. At boot the flag is re-read and keys re-added if `=== "1"` (F:222-227).
  5. Descriptive copy switches on state, and appends "You're in guest mode — backup starts once you sign in." when `!window.LOCKED.isLoggedIn` (F:24312).
- State: `cloudOn` initialized from `window.LOCKED.cycleSyncEnabled` (F:25120-25126)
- Storage: `lk_mcCloudSync` (raw, unprefixed by `sd`), plus `__lk_ts__lk_mcProfile` / `__lk_ts__lk_mcDays`
- Network: the app's generic bidirectional sync (Supabase-style key/value POST via `headers()`), payload = the sync-key map with `lk_mcProfile`/`lk_mcDays` JSON values; on disable a `{lk_mcProfile:null, lk_mcDays:null}` payload (F:1198-1205). Exact endpoint lives outside this range.
- Edge cases: guest mode — flag flips but nothing uploads until sign-in; the try/catch swallows any failure so the UI can report "on" when `setCycleSync` threw.
- Gating: always on, default **off**
- Status: WORKING
- Evidence: F:1176-1205 full enable/disable implementation.
- Notes: `mcp.cloudOn` is **not** stored in the profile — it is a separate raw localStorage flag, so it does not itself sync (correct, but means the setting is per-device).

### F-CYCLE-037 Export cycle data (JSON)
- Location: Cycle settings > "Export my data (JSON)"; also the health card's "Export for my doctor" (F:24455-24478)
- Behavior (`mcExportData`, F:22199-22232):
  1. Builds `JSON.stringify({profile: mcp, days: days, exported: mcTodayISO()}, null, 2)`.
  2. Tries the Web Share API with a `File` named `locked-cycle-data.json` when `navigator.canShare({files})` allows.
  3. Otherwise creates a Blob object URL and triggers an `<a download="locked-cycle-data.json">` click, revoking the URL after 2000 ms.
- Storage: reads only
- Network: none (share sheet is OS-level)
- Edge cases: whole body wrapped in a silent try/catch — a failure produces no feedback at all (F:22200, F:22231).
- Status: WORKING
- Evidence: F:22219-22230 blob fallback.
- Notes: export includes free-text notes, sex-activity entries and abortion/miscarriage events verbatim.

### F-CYCLE-038 Delete all cycle data
- Location: Cycle settings > red "Delete all cycle data" → inline confirm
- Behavior:
  1. First tap sets `confirmDel` and swaps in a confirm panel "Delete everything? This can't be undone." with Cancel/Delete (F:24338-24389).
  2. Delete calls `p.onDeleteAll()` (F:26005-26018): disables cycle sync via `setCycleSync(false)` (which also clears the cloud copy), `localStorage.removeItem("lk_mcProfile")` and `removeItem("lk_mcDays")`, then resets `cloudOn=false`, `days={}`, `mcp=null`, closes settings.
  3. With `mcp === null` the screen falls back to `McOnboarding` (F:25169).
- Storage: removes `lk_mcProfile`, `lk_mcDays`; via `setCycleSync(false)` also removes `lk_mcCloudSync` and both `__lk_ts__` stamps
- Network: best-effort null-write to clear the cloud copy (F:1198-1205)
- Edge cases: `lk_mcFuelAdjust` is **not** cleared by delete-all (grep: only F:210, F:24874, F:25037) — a residual cycle-derived preference survives deletion.
- Status: PARTIAL
- Evidence for status: F:26009-26010 removes exactly two keys; `lk_mcFuelAdjust` persists.

### F-CYCLE-039 Athlete health flags (RED-S / amenorrhea)
- Location: Cycle screen > CYCLE HEALTH card
- User action: "Got it" (non-red flags) or "Export for my doctor" (red flag)
- Behavior (`mcAthleteFlags`, F:22233-22318):
  1. Returns null when `hbc`, no `lastStart`, `day == null`, during `pregRecovery`, or when an `ecDate` is active (F:22234-22235).
  2. `recent` = any day log or any workout in `history` within the last 14 days (F:22237-22252).
  3. `trendUp` = 3+ cycles with strictly increasing lengths and last − third-last ≥ 8 days (F:22254).
  4. `oligo` = last two cycles both > 35 days (F:22255).
  5. `spike` = with ≥6 workouts, `(count in last 21d)/3 / ((count in 22–63d)/6) >= 1.5 && c3 >= 6` (F:22256-22270).
  6. `tired` = count of last-14-day logs with `sym.fatigue >= 2` or `energy <= 2` (F:22271-22277).
  7. Context line appended when spike and/or tired ≥ 3 (F:22278-22282).
  8. Flag priority (F:22283-22317): `gap >= 90 && recent` → **red** "3 MONTHS WITHOUT A PERIOD" (secondary amenorrhea, RED-S, "2–4× higher stress-fracture risk", `exportBtn: true`); `gap >= 60` → **amber**; `trendUp` → **watch** "YOUR CYCLES ARE STRETCHING"; `oligo` → **watch** "CYCLES RUNNING OVER 35 DAYS"; `gap >= 45` → **watch** "THIS CYCLE IS RUNNING LONG".
  9. `McHealthCard` (F:24405-24500) hides itself if `f.level !== "red" && ack[f.key]`; the "Got it" button writes `mcp.healthAck[f.key] = true` (F:24479-24494). Red flags cannot be dismissed.
  10. Footer: "General information, not a diagnosis — cycle changes have many causes." (F:24495-24499)
- Components: `McHealthCard` (F:24405-24500); mounted F:25834-25842
- Storage: `lk_mcProfile.healthAck` (map of flag key → true); keys embed `lastStart` so a new cycle re-raises the flag
- Status: WORKING
- Evidence: F:22283-22289 red-flag return; F:24479-24494 acknowledgement write.
- Notes: hard-coded clinical thresholds (90/60/45/35 days, 8-day trend, 1.5× volume ratio, 3 tired logs). All copy is static, not generated.

### F-CYCLE-040 Pregnancy-end recovery mode
- Location: Cycle screen > CYCLE RESET card + ring/center overrides
- Trigger: logging an `abortion` or `miscarriage` event on any day
- Behavior:
  1. `mcPregEnds` collects those dates (F:21952-21959).
  2. `mcPeriodStarts` **discards** any period start falling 0–14 days after a pregnancy end (F:21974-21982) — recovery bleeding is not treated as a period.
  3. `mcCompute` sets `pregRecovery = {date, days, kind, expectA: +28d, expectB: +42d}` when the last pregnancy end is after the last period start and is 0–70 days old (F:22110-22126), and nulls `ovuDate/fertA/fertB/pmsA/pmsB` (F:22136-22142).
  4. `McRecoveryCard` (F:24501-24586) shows "TRACKING FROM TODAY" / "N DAYS ON" / "N WEEKS ON", the 4–6 week expectation window `mcFmt(expectA)–mcFmt(expectB)`, an "ovulation can return within about two weeks" warning, and a red medical-help box (soaking two pads an hour for two hours, fever, severe pain, foul-smelling discharge).
  5. While recovering the ring goes neutral (F:22425), the training and nutrition cards are suppressed (F:25843, F:25849), prediction carousel hidden (F:25732), health flags suppressed (F:22235).
- Components: `McRecoveryCard` (F:24501-24586); mounted F:25823-25825
- Storage: derived from `lk_mcDays[iso].ev`
- Status: WORKING
- Evidence: F:22110-22126 recovery object construction.
- Notes: 70-day window is a hardcoded expiry; after 70 days the mode silently ends even with no period logged.

### F-CYCLE-041 Emergency contraception (EC) card
- Location: Cycle screen > "AFTER THE MORNING-AFTER PILL" card
- User action: dismiss X
- Behavior:
  1. `mcCompute` scans days for `ev.ec` in the past, not before `lastStart`, within 45 days, taking the latest (F:22127-22135).
  2. If found, prediction confidence widens: `conf = min(7, conf + 3)` (F:22135).
  3. `McEcCard` (F:24587-24653) shows "Logged <date>…up to a week early or late…" plus the "if your period is more than a week late, take a test" note; dismiss writes `{ecDismissed:true}` on today (F:24603-24606).
  4. An active `ecDate` also suppresses all athlete health flags (F:22235).
- Storage: `lk_mcDays[today].ecDismissed`
- Gating: rendered when `C.ecDate && !C.pregRecovery` (F:25826)
- Status: WORKING
- Evidence: F:22127-22135 detection; F:24603 dismissal.
- Notes: dismissal is keyed to *today*, so the card returns tomorrow.

### F-CYCLE-042 "Your patterns" insights
- Location: Cycle screen > YOUR PATTERNS card
- Behavior (`mcInsights`, F:22319-22403, max 3 items, requires ≥2 period starts):
  1. **Symptom timing** — for each symptom with ≥3 logs: `before/total >= 0.6` → "<Symptom> — mostly in the days before your period (N of M logs)."; else `during/total >= 0.6` → "…mostly during your period…". Buckets come from `mcSymptomBuckets` (F:22150-22183): `during` = within `periodLen` days of a start; `before` = 1–5 days before the next start.
  2. **Energy by phase** — requires ≥3 energy logs in a phase and a high/low mean gap ≥ 0.8 → "Your logged energy runs highest in your <x> phase and dips in your <y> phase."
  3. **Training volume by phase** — requires ≥6 dated workouts with `liftVolume`, ≥2 per phase, best/worst ratio ≥ 1.2 → "Your average session volume is highest in your <x> phase — your own data, not a rule."
  4. Empty state copy at F:25887-25896.
- Functions: `mcInsights` (F:22319), `mcSymptomBuckets` (F:22150), `mcSymLabel` (F:22184), `liftVolume` (outside range), `dayOf` (outside range)
- Inputs: `p.history` — the workout history passed into the screen (F:57677)
- Status: WORKING
- Evidence: F:22403 `out.slice(0,3)`.
- Notes: the only place workout data flows *into* the cycle module.

### F-CYCLE-043 "The science" education accordion
- Location: Cycle screen > THE SCIENCE collapsible
- User action: taps the header to expand
- Behavior: 8 static entries (F:25957-25963): Phases are estimates; Training on your period (cites **Colenso-Semple et al., 2023** — "no effect of cycle phase on strength or muscle growth"); Irregular is common; Athletes & missing periods (RED-S); On hormonal birth control; Emergency contraception; After an abortion or miscarriage; When to see a doctor. Footer "General guidance, not medical advice." (F:25977-25984), plus a page-level disclaimer (F:25985-25995).
- State: `eduOpen` (F:25118)
- Status: WORKING
- Evidence: F:25957 content array.

### F-CYCLE-044 Discreet mode
- Location: Cycle settings > "Discreet home card"; effects across the module
- Behavior when `mcp.discreet`:
  1. Home card title becomes "Wellness", subtitle "Tap to open" (F:22679, F:22720).
  2. Screen header title becomes "Wellness" (F:25361).
  3. Log sheet hides the SEX section and the whole EVENTS section (F:23496, F:23540).
  4. `mcFuelContext` returns null (F:24879) and `McTrainBanner` returns null (F:25067) — all cross-module surfacing is suppressed.
- Storage: `lk_mcProfile.discreet`
- Status: WORKING
- Evidence: F:24301-24303 toggle; F:25067 banner suppression.
- Notes: the *screen itself* still shows full cycle detail — discreet only hides the entry points and the two most sensitive log sections.

### F-CYCLE-045 Non-female gate screen
- Location: `cycletrack` route for a user whose sex is not Female
- Behavior: back arrow plus the line "Cycle tracking appears when your sex is set to Female in Profile → Body Stats." (F:25141-25168).
- Functions: `isFemaleUser` (F:21946-21951)
- Status: WORKING
- Evidence: F:25141.
- Notes: binary sex gate; no non-binary/trans path anywhere in the module.

### F-CYCLE-046 Header controls (back / calendar toggle / settings) and privacy sub-line
- Location: Cycle screen > `DsHeader`
- Behavior: back → `go("home")` (F:25366-25389); the middle button toggles `view` between `"cycle"` and `"calendar"` and swaps its icon (`D.cal` ↔ `D.time`), tinting orange in calendar view (F:25390-25417); gear opens settings (F:25418-25442). Under the title, a shield icon and either "Backed up privately to your account" or "Private — data stays on this device" depending on `cloudOn` (F:25443-25468).
- State: `view` (F:25114), `showSettings` (F:25116), `cloudOn` (F:25120)
- Status: WORKING
- Evidence: F:25394-25396 view toggle.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| `McRing` | component | F:22417-22595 | 272px SVG cycle ring with phase arcs, today marker and drag-scrub | `CycleTrackerScreen` (F:25373) | `mcArcPath`, `mcPolar`, `C.phaseOfDay`, `useRef` | F-CYCLE-009, 010 |
| `angA` | function (inner) | F:22463-22465 | Start angle for a cycle day | `McRing` | — | F-CYCLE-009 |
| `angB` | function (inner) | F:22466-22468 | End angle for a cycle day | `McRing` | — | F-CYCLE-009 |
| `scrub` | handler (inner) | F:22469-22482 | Pointer position → previewed cycle day | `McRing` pointer handlers | `p.onPreview` | F-CYCLE-010 |
| `CycleTrackerCard` | component | F:22596-22750 | Home-feed cycle card: setup promo or day/phase status | Home block map (F:26612) | `mcGetProfile`, `mcGetDays`, `mcCompute`, `mcAddDays`, `mcDiff`, `readableAccent` | F-CYCLE-001, 002 |
| `McOnboarding` | component | F:22751-23146 | 5-step cycle setup wizard | `CycleTrackerScreen` (F:25169) | `mcSaveProfile`, `mcTodayISO` | F-CYCLE-003..008 |
| `finish` | handler (inner) | F:22762-22775 | Build + persist the cycle profile, clamp lengths | `Btn` on step 4 | `mcSaveProfile`, `mcTodayISO`, `p.onDone` | F-CYCLE-007 |
| `Btn` | component (inner) | F:22776-22795 | Full-width orange primary CTA used across onboarding steps | `McOnboarding` steps | — | F-CYCLE-003..007 |
| `optBtn` | function (inner) | F:22796-22834 | Renders a selectable option row with label + description | `McOnboarding` steps 1–3 | — | F-CYCLE-004, 005, 006 |
| `McLogSheet` | component | F:23147-23753 | Bottom sheet for logging one day (flow, symptoms, mood, energy, sleep, sex, events, note) | `CycleTrackerScreen` (F:25989) | `useEscape`, `useSheetDrag`, `lkPortal`, `mcTodayISO`, `mcFmt`, `p.updateDay` | F-CYCLE-023..031 |
| `set` | handler (inner) | F:23157-23159 | Patch today's/this day's log | all sheet controls | `p.updateDay` | F-CYCLE-024..031 |
| `setEv` | handler (inner) | F:23160-23166 | Set or delete one event key | event buttons | `set` | F-CYCLE-030 |
| `cycleSym` | handler (inner) | F:23167-23175 | Advance a symptom through severity 0→1→2→3→0 | symptom chips | `set` | F-CYCLE-026 |
| `McCalendar` | component | F:23754-24065 | Month grid with logged/predicted period, fertile and PMS overlays, stats and history chart | `CycleTrackerScreen` (F:25369) | `mcPreSymptoms`, `mcAddDays`, `mcDiff` | F-CYCLE-032, 033, 034 |
| `cellISO` | function (inner) | F:23787-23789 | Day number → ISO date for the displayed month | `McCalendar` grid | — | F-CYCLE-032 |
| `McSettings` | component | F:24066-24404 | Cycle settings sheet: lengths, irregular, BC, discreet, cloud backup, export, delete | `CycleTrackerScreen` (F:25997) | `useSheetDrag`, `mcExportData`, `window.LOCKED.setCycleSync`, `p.setMcp` | F-CYCLE-035..038 |
| `upd` | handler (inner) | F:24070-24072 | Merge a patch into the cycle profile | settings controls | `p.setMcp` | F-CYCLE-035 |
| `exportData` | handler (inner) | F:24073-24075 | Export button handler | export button | `mcExportData` | F-CYCLE-037 |
| `row` | function (inner) | F:24076-24110 | Settings row layout (label + control + description) | `McSettings` | — | F-CYCLE-035 |
| `toggle` | function (inner) | F:24111-24146 | iOS-style switch used by settings rows | `McSettings` | — | F-CYCLE-035, 036 |
| `McHealthCard` | component | F:24405-24500 | Surfaces an athlete/amenorrhea health flag with acknowledge or doctor-export | `CycleTrackerScreen` (F:25834) | `mcExportData`, `p.setMcp` | F-CYCLE-039 |
| `McRecoveryCard` | component | F:24501-24586 | Post-abortion/miscarriage recovery explainer with expectation window and red-flag advice | `CycleTrackerScreen` (F:25823) | `mcFmt` | F-CYCLE-040 |
| `McEcCard` | component | F:24587-24653 | Morning-after-pill aftermath card, dismissable | `CycleTrackerScreen` (F:25826) | `mcFmt`, `p.updateDay` | F-CYCLE-041 |
| `McTrainingCard` | component | F:24654-24776 | Phase/symptom-aware training guidance with lighter/keep decision | `CycleTrackerScreen` (F:25843) | `C.phaseOfDay`, `p.updateDay`, `p.go`, `readableAccent` | F-CYCLE-019 |
| `McNutritionCard` | component | F:24777-24872 | Phase-specific fuel tip with dismiss and Open Fuel link | `CycleTrackerScreen` (F:25849) | `C.phaseOfDay`, `mcFuelAdjustOn`, `p.updateDay`, `p.go` | F-CYCLE-020 |
| `mcFuelAdjustOn` | function | F:24873-24875 | Reads the luteal calorie-allowance preference | `McNutritionCard`, `mcFuelContext`, `McFuelStrip` | `ld` | F-CYCLE-020, 021 |
| `mcFuelContext` | function | F:24876-24911 | Builds the cycle context object Fuel would consume (phase, tip, ironFocus, calAdj) | **nobody** | `isFemaleUser`, `mcGetProfile`, `mcGetDays`, `mcCompute`, `mcFuelAdjustOn` | F-CYCLE-021 (DEAD) |
| `mcLutealCalBump` | function | F:24912-24914 | 5% of base calories, rounded to 10, capped at 150 kcal | `McFuelStrip` only | — | F-CYCLE-021 (DEAD) |
| `McFuelStrip` | component | F:24915-25063 | Fuel-tab cycle strip: phase tip, iron progress, luteal kcal toggle | **nobody** | `mcFuelAdjustOn`, `mcLutealCalBump`, `sd` | F-CYCLE-021 (DEAD) |
| `McTrainBanner` | component | F:25064-25107 | Train-tab nudge when today's cycle log looks rough | Train screen (F:15465) | `isFemaleUser`, `mcGetProfile`, `mcGetDays`, `mcTodayISO`, `lkKeyActivate`, `p.go` | F-CYCLE-022 |
| `CycleTrackerScreen` | component | F:25108-26099 | The whole cycle screen: state owner, ring/calendar views, cards, sheets | route `cycletrack` (F:57675) | `mcGetProfile`, `mcGetDays`, `mcCompute`, `mcInsights`, `mcPreSymptoms`, `mcAthleteFlags`, `lkScrollToTop`, all Mc* components | F-CYCLE-009..046 |
| `setMcp` | handler (inner) | F:25119-25122 | Persist + set the cycle profile | `McSettings`, `McHealthCard` | `mcSaveProfile` | F-CYCLE-035, 039 |
| `updateDay` | handler (inner) | F:25123-25128 | Merge a patch into one day and persist the whole day map | every logging control | `mcSaveDays` | F-CYCLE-012..014, 019, 020, 023..031, 041 |
| `quickLogPeriod` | handler (inner) | F:25191-25202 | One-tap log/unlog today's period at flow 3 | Log Period tile | `updateDay` | F-CYCLE-012 |

Helpers outside the range that this module cannot work without (indexed for completeness, not owned by this agent): `MC_COL` F:21839, `MC_TXT` F:21846, `MC_PHASE_INFO` F:21853, `MC_SYMPTOMS` F:21880, `MC_MOODS` F:21881, `MC_FLOWS` F:21882, `MC_EVENTS` F:21883, `MC_PREG_END` F:21904, `MC_HBC` F:21908, `MC_BC_OPTS` F:21909, `MC_GOALS` F:21910, `mcISO` F:21911, `mcParse` F:21914, `mcAddDays` F:21918, `mcDiff` F:21923, `mcFmt` F:21926, `mcTodayISO` F:21931, `mcGetProfile` F:21934, `mcSaveProfile` F:21937, `mcGetDays` F:21940, `mcSaveDays` F:21943, `isFemaleUser` F:21946, `mcPregEnds` F:21952, `mcPeriodStarts` F:21960, `mcCompute` F:21990, `mcSymptomBuckets` F:22150, `mcSymLabel` F:22184, `mcPreSymptoms` F:22189, `mcExportData` F:22199, `mcAthleteFlags` F:22233, `mcInsights` F:22319, `mcPolar` F:22404, `mcArcPath` F:22411.

---

## Cycle data model

**Profile** — `lk_mcProfile`, written by `mcSaveProfile` (F:21937-21939), created at F:22762-22773:
```
{
  setup: true,
  goal: "understand" | "train" | "symptoms" | "track",   // F:21910, never read
  lastStart: "YYYY-MM-DD" | null,                        // F:22764
  cycleLen: int 15..60,                                  // F:22766
  periodLen: int 1..10,                                  // F:22767
  irregular: bool,                                       // F:22768
  birthControl: "none"|"pill"|"patch"|"ring"|"hiud"|"implant"|"shot", // F:21909
  discreet: bool,                                        // F:22770, F:24301
  createdAt: "YYYY-MM-DD",                               // F:22772
  healthAck: { "<flagKey>": true }                       // added later, F:24482-24487
}
```

**Day map** — `lk_mcDays`, `{ "YYYY-MM-DD": DayLog }`, written by `mcSaveDays` (F:21943-21945) / `updateDay` (F:25123-25128):
```
DayLog = {
  flow: 0..4,                    // None|Spotting|Light|Medium|Heavy (F:21882, F:23262)
  sym:  { "<symptomId>": 1|2|3 },// Mild|Moderate|Severe (F:23167-23175)
  mood: ["Happy", ...],          // display labels, not ids (F:23404-23412)
  energy: 1..5 | null,           // F:23430
  sleep:  1..5 | null,           // F:23470 — written, never read
  sex: "none"|"protected"|"unprotected" | null, // F:23508 — written, never read
  pill: bool,                    // HBC only (F:23327)
  note: "free text",             // F:23729
  ev: { ec?:true, test?:"neg"|"pos", abortion?:true, miscarriage?:true, iud?:true }, // F:23630, F:23610
  coach: "adjusted" | "kept",    // training-card decision (F:24686, F:24709)
  nutriDismissed: true,          // F:24800
  ecDismissed: true              // F:24603
}
```
Symptom ids (F:21880): `cramps, headache, bloating, tender, backpain, fatigue, acne, nausea, digestive, cravings, discharge, hotflash`.

**Derived cycle object** — return of `mcCompute` (F:22143-22149 … F:22118-22149), not persisted:
`{ todayISO, starts[], lens[], avgLen, sd, conf, irregular, periodLen, hbc, lastStart, day, nextStart, overdue, stale, ovuDay, ovuDate, fertA, fertB, pmsA, pmsB, phaseOfDay(fn), dayOfDate(fn), pregRecovery, ecDate }`.

**Settings that are not in the profile**: `lk_mcCloudSync` (raw "1", F:223) and `lk_mcFuelAdjust` (F:24874, F:25037).

---

## Phase detection logic

Period starts (`mcPeriodStarts`, F:21960-21989) — a day counts as a start when `flow >= 2` (Medium+) and neither of the two prior days had `flow >= 2`:
```
if (d && d.flow >= 2) flow[iso] = true;              // F:21964
if (!flow[mcAddDays(iso,-1)] && !flow[mcAddDays(iso,-2)]) starts[iso] = true;  // F:21970
```
Starts within 14 days after an abortion/miscarriage are discarded (F:21974-21982). If the onboarding `lastStart` is more than 5 days from any detected start it is injected as a start (F:21983-21988).

Cycle lengths (F:21998-22012): consecutive-start differences kept when `L >= 15 && L <= 60` and the interval does not span a pregnancy end; only the **last 6** are kept.

Averages and confidence (F:22013-22035):
```
avgLen = lens.length ? round(mean(lens)) : (mcp.cycleLen || 28);
sdv    = lens.length >= 2 ? population stddev : 0;
conf   = max(1, min(6, round(sdv) || (mcp.irregular ? 4 : 1)));
irregular = !!(mcp.irregular || sdv >= 4);
```

Period length (F:22036-22050): measures each start's run of consecutive `flow >= 2` days (max 10), and with ≥2 completed runs uses the **median**, clamped 1–10; otherwise `mcp.periodLen || 5`.

Ovulation day and phase function — the core algorithm, quoted verbatim (F:22056-22065):
```
var ovuDay = Math.max(6, avgLen - 14);
function phaseOfDay(d) {
  if (d == null) return "neutral";
  if (hbc) return d <= periodLen ? "menstrual" : "neutral";
  if (d <= periodLen) return "menstrual";
  if (d > avgLen) return "luteal";
  if (d < ovuDay - 1) return "follicular";
  if (d <= ovuDay + 1) return "ovulatory";
  return "luteal";
}
```
So: menstrual = days 1..periodLen; follicular = periodLen+1 .. ovuDay-2; ovulatory = ovuDay-1 .. ovuDay+1 (3 days); luteal = ovuDay+2 .. onward. Hormonal birth control (`hbc` = birthControl in `MC_HBC`, F:22051) collapses everything to menstrual/neutral — no fertility estimates.

Other derived values:
- `day = mcDiff(lastStart, todayISO) + 1` (F:22053)
- `nextStart = lastStart + avgLen` (F:22054)
- `overdue = max(0, todayISO - nextStart)` (F:22055)
- `stale = day > avgLen + 21` (F:22056) — predictions are suppressed
- Fertile window: `ovuDate = lastStart + ovuDay - 1`, rolled forward by whole cycles up to 2 times if in the past; `fertA = ovuDate - 5`, `fertB = ovuDate + 1` (F:22076-22091)
- PMS window: `pmsA = base - 5`, `pmsB = base - 1`, where base is `nextStart` (or `nextStart + avgLen` when overdue) (F:22092-22097)
- EC widening: `conf = min(7, conf + 3)` (F:22135)
- Displayed band: `confBand = C.irregular ? max(3, C.conf) : C.conf` (F:25185)

Pre-period symptom detection (`mcPreSymptoms`, F:22189-22198): needs ≥2 starts; a symptom qualifies when `total >= 3 && before/total >= 0.6`, where `before` = logged 1–5 days before the next start (F:22171).

---

## Cross-module influence

**Into Train — one live surface, and it is a nudge, not a programming change:**
- `McTrainBanner` (F:25064-25107), mounted at F:15465. It appears only when today's log is "rough": `sym.cramps >= 2 || sym.fatigue >= 2 || sym.headache >= 2 || (energy && energy <= 2)` (F:25071), and disappears once the user has chosen "keep my plan" (`t.coach === "kept"`, F:25072). Copy is one of two fixed strings (F:25094-25096). It changes **no** exercise, set, rep, load, or plan — tapping it navigates back to the cycle screen.
- Inside the cycle module, `McTrainingCard` (F:24654) gives per-phase guidance from `MC_PHASE_INFO[ph].train` (F:21853-21879) and, on a rough day, offers "Take it lighter" (writes `coach: "adjusted"`, F:24686) with a deep link into Train (F:24741). The stored `coach` value is read only by this card and the banner.
- Phase→training copy, verbatim (F:21853-21879): menstrual "No phase limits strength…"; follicular "A great stretch to push progressive overload — but your own readiness beats any calendar."; ovulatory "If energy is high, it's a good day to chase a PR."; luteal "Keep training normally — if the same session feels harder here, that's physiology…". The card's own footer states the position explicitly: "evidence doesn't support rigid phase-based programming" (F:24774).
- **Reverse direction**: `p.history` (workout history, F:57677) feeds `mcInsights` volume-by-phase (F:22366-22400) and `mcAthleteFlags` volume-spike detection (F:22256-22270).

**Into Fuel — advertised but not wired:**
- The live piece is `McNutritionCard` (F:24777-24872) **inside the cycle screen**, not in Fuel: menstrual → iron message; luteal + `sym.cravings` → cravings message; luteal → higher-needs message; ovulatory → appetite-dip message; follicular/neutral → no card (F:24784). It links to Fuel with `p.go("fuel")` (F:24858).
- Its footnotes claim Fuel behavior that does not exist: "Fuel is tracking your iron against the 18 mg daily target" (F:24847) and "Fuel is adding a small calorie allowance this phase" (F:24855).
- The code that would implement those — `mcFuelContext` (F:24876), `mcLutealCalBump` (F:24912, 5% of base calories, ≤150 kcal), `McFuelStrip` (F:24915) — **has no call site in the file**. The luteal calorie toggle exists only inside the unrendered strip (F:25030-25040).
- Net: today, cycle phase changes **nothing** about Fuel's targets or displays. `lk_mcFuelAdjust` is a preference nothing consumes, yet it is in the cloud sync list (F:210).

**Into Home:** `CycleTrackerCard` (F:22596) as a reorderable home block (`cycletrack`, F:26105-26111), gated on `isFemaleUser` (F:26612).

---

## Health data privacy

**What is stored**: menstrual flow, 12 symptom types with severity, mood labels, energy, sleep, sexual activity (protected/unprotected), pill adherence, free-text notes, and reproductive events including **emergency contraception, pregnancy test results, abortion and miscarriage** (F:21883-21903, F:23630, F:23610). Plus a derived `healthAck` map recording which amenorrhea/RED-S warnings the user dismissed (F:24482-24487).

**Where it lives**: two localStorage keys, `lk_mcProfile` and `lk_mcDays`, written through `sd()` (F:2435-2445) via `mcSaveProfile`/`mcSaveDays` (F:21937-21945). Unencrypted JSON.

**Does it leave the device?** Only on explicit opt-in.
- F:218-227 comment and code: *"Cycle tracking: OPT-IN sync only — lk_mcProfile / lk_mcDays stay device-local unless the user explicitly enables cloud backup in Cycle Settings (flag lk_mcCloudSync = "1"). Default is OFF: with the flag absent these keys never sync."*
- `MC_SYNC_KEYS = ["lk_mcProfile","lk_mcDays"]` are appended to the generic `SYNC_KEYS` list only when the flag is "1" (F:222-227).
- Enabling (`setCycleSync(true)`, F:1176-1186) back-stamps `__lk_ts__` timestamps so existing history uploads on the next merge, and triggers `syncBidirectional()` if signed in.
- Disabling (F:1188-1205) removes the keys from the sync set, deletes the timestamps, and best-effort POSTs `{lk_mcProfile:null, lk_mcDays:null}` to clear the cloud copy; local data is kept.
- The UI states this in three places: onboarding step 0 (F:22946-22948), the log sheet events footer (F:23718-23722), the screen header sub-line (F:25459-25465) and the settings footer (F:24390-24404).

**Leakage risks found**:
1. `lk_mcFuelAdjust` — derived from cycle phase — is in the **unconditional** SYNC_KEYS list (F:210), so it syncs to the account even with cycle backup off. It is a single boolean and reveals only that a luteal-phase adjustment was toggled, but it is cycle-derived data crossing the stated device boundary.
2. Delete-all removes only `lk_mcProfile` and `lk_mcDays` (F:26009-26010); `lk_mcFuelAdjust` survives.
3. `mcExportData` (F:22199-22232) writes the full unredacted payload — notes, sex activity, abortion/miscarriage events — to a share sheet or a downloaded file. Appropriate for the "export for my doctor" use case, but it is one tap from the health card (F:24455).
4. No AI/model call anywhere in the module — cycle data is never sent to an LLM. Verified by absence of any fetch/prompt construction across F:22417-26140.
5. No secrets, tokens or API keys appear anywhere in this range.

---

## Storage keys touched

| Key | Read | Written | By | Syncs to cloud? |
|---|---|---|---|---|
| `lk_mcProfile` | yes | yes | `mcGetProfile`/`mcSaveProfile` (F:21934-21939); deleted F:26009 | only when `lk_mcCloudSync === "1"` (F:222-227) |
| `lk_mcDays` | yes | yes | `mcGetDays`/`mcSaveDays` (F:21940-21945); deleted F:26010 | only when `lk_mcCloudSync === "1"` |
| `lk_mcCloudSync` | yes | yes | `window.LOCKED.cycleSyncEnabled` / `setCycleSync` (F:1175-1205), toggled at F:24304 and F:26006 | no (device-local flag) |
| `lk_mcFuelAdjust` | yes | yes | `mcFuelAdjustOn` (F:24874), `sd("mcFuelAdjust", n)` (F:25037) | **yes, unconditionally** (F:210) |
| `__lk_ts__lk_mcProfile`, `__lk_ts__lk_mcDays` | — | yes | sync timestamp stamps (F:236-240, F:1181-1184, F:1193) | metadata |
| `lk_profile`, `lk_fuelProfile` | yes | — | `isFemaleUser` gate (F:21946-21951) | (owned elsewhere) |
| `lk_homeLayout` | yes | — | `cycletrack` home block visibility (F:26105-26111, F:26169) | (owned elsewhere) |

---

## Open questions / UNVERIFIED

1. **`mcp.goal` consumer** — UNVERIFIED whether any code outside F:22417-26140 reads the onboarding goal. A grep for `.goal` in this file returns only the writes at F:22763/22765 and unrelated fitness-goal usages. Confirm with: `rg -n "mcp\.goal|profile\.goal" redesign/input/locked-current-v6.html`.
2. **Sync endpoint and payload shape** — `setCycleSync` calls `syncBidirectional()` and `headers()` (F:1185, F:1198), both defined outside my range. The exact table/endpoint, auth header and row shape for `lk_mcProfile`/`lk_mcDays` is UNVERIFIED here; Agent covering F:1-4663 should document it. Confirm by reading the `syncBidirectional` body.
3. **Whether `McFuelStrip` was ever mounted** — I verified there is no call site in the current file. UNVERIFIED whether it was removed deliberately or lost in a refactor; git history of `redesign/input/locked-current-v6.html` would settle it.
4. **Iron tracking in Fuel** — `McNutritionCard` claims an 18 mg iron target (F:24847). Fuel does contain iron nutrient data (F:18688, F:18789, F:18839), so a target may exist in the Fuel module independent of cycle phase. UNVERIFIED whether Fuel raises the iron goal during menstruation; the Fuel agent should check whether any cycle-aware iron goal exists there.
5. **`isDarkMode`** used by the onboarding date input (F:23013) is read as a module-level value, not a hook — UNVERIFIED whether it updates on a live theme switch.
6. **`liftVolume` / `dayOf`** (used by `mcInsights` and `mcAthleteFlags`, F:22376, F:22245) are defined outside my range; their exact semantics for cardio-only sessions is UNVERIFIED.
