# Agent 4b — Supplements & Cycle tab audit
File audited: `redesign/input/locked-current-v6.html`, lines **46185–49399** (plus cited out-of-range references resolved for context).

Range contents (actual, verified):
- `SuppReminderCard` 46185–46277
- `SupplementsTab` 46278–47013
- Cycle data layer + presets 47014–47333 (`COMPOUND_CATEGORIES`, `PRESET_COMPOUNDS`, `CYCLE_FREQ_OPTS`, `CYCLE_ROUTE_OPTS`, `getCycles`…`getDueCompounds`)
- `CycleReminderCard` 47334–47431
- `CycleTab` 47432–48842 — **not a wrapper: this is the entire cycle-tracking module** (list / add / detail / compound form). See "Open questions".
- `Placeholder` 48843–48884 — **dead code**
- Coach-context block 48885–49399 (out of feature scope; indexed in Part B)

---

# PART A — Features

### F-SUPP-001 Supplement list (Fuel > Supps tab)
- Location: Fuel tab > "Supps" pill > list screen
- User action: Taps the "Supps" chip in the Fuel sub-tab row.
- Behavior: 1) `FuelTab` renders `SupplementsTab` when `tab === "supps"` (46278; mounted at 37460). 2) Component loads `ld("supplements", [])` into state (46279–46281) and `getSuppLog()` (46282–46284). 3) Empty state renders "No supplements added yet." (46804–46815). 4) Each supplement renders a card: check button, name, per-item streak badge (`>1`), dose, timeOf (colour-coded), freq (hidden when "Daily"), edit + delete buttons (46816–47000). 5) Time-of-day drives both the accent colour and the emoji: Morning 🌅/WA, Pre-Workout 💪/OR, Before Bed 🌙/OR, With Food 🍽️/GR, else 💊/BLU (46821, 46869).
- Components: SupplementsTab (46278–47013)
- Functions: `ld` (2417), `getSuppLog` (46132), `isSuppTaken` (46143), `getSuppStreak` (46148), `isoDay` (1961)
- State: `supps`, `suppLog`, `showAdd`, `editIdx`, `showPresets`, `showHistory`, `name`, `dose`, `freq`, `timeOf`, `customTime`, `reminder`, `q` (46279–46297)
- Storage: reads `lk_supplements`, `lk_suppLog`
- Network: none directly; `lk_supplements`/`lk_suppLog` are included in cloud sync payload (19408–19409)
- AI: none
- Edge cases: empty list handled (46804). No loading/error state — purely localStorage. `ld` swallows parse errors (2417).
- Gating: always on (the "supps" chip is unconditional, 37328)
- Status: WORKING
- Evidence for status: 37460 renders `SupplementsTab`; full CRUD paths present at 46311–46373.
- Notes: The Fuel tab passes no props — `SupplementsTab()` takes none (46278), so it re-reads localStorage on mount and can go stale relative to `SuppReminderCard` on Home.

### F-SUPP-002 Add supplement
- Location: Fuel > Supps > "ADD SUPPLEMENT" dashed button > add form
- User action: Taps "ADD SUPPLEMENT" (46990–47012), fills fields, taps "ADD SUPPLEMENT".
- Behavior: 1) `openAdd()` resets every form field to defaults (name "", dose "", freq "Daily", timeOf "Morning", customTime "", reminder true), clears `editIdx`, sets `showAdd` (46318–46329). 2) Form screen renders (46551 onwards) with early return, replacing the list. 3) `save()` (46351–46383) trims name, bails silently if empty, builds the entry, appends via `setSupps` which writes `sd("supplements", n)` (46305–46311). 4) `logBetaActivity("supplement_add", {name, dose})` (46375–46378). 5) Closes form.
- Components: SupplementsTab (46278–47013)
- Functions: `openAdd` (46318), `save` (46351), `setSupps` (46304), `sd` (2435), `logBetaActivity` (2772)
- State: all form fields; `showAdd`, `editIdx`
- Storage: writes `lk_supplements`
- Network: `logBetaActivity` only (2772); no per-save request
- AI: none
- Edge cases: empty/whitespace name → save button disabled AND `save()` early-returns (46352, 46781). No duplicate-name guard — two supplements with the same name share one log key and one streak (46135).
- Gating: always on
- Status: WORKING
- Evidence for status: 46351–46383 writes through `setSupps`→`sd`.
- Notes: `created` is set on add and preserved on edit (46360).

### F-SUPP-003 Preset supplement picker
- Location: Fuel > Supps > add form > "Choose from Presets"
- User action: Taps "Choose from Presets", optionally types in the search box, taps a chip.
- Behavior: 1) Button only renders when `!name && editIdx === null` (46593) — it disappears once anything is typed, and is never shown when editing. 2) Toggles `showPresets`. 3) Search input filters `PRESET_SUPPS` case-insensitively AND removes any preset already in the user's list (46384–46392). 4) Tapping a chip sets `name`, hides presets, clears `q` (46678–46684). 5) "No matches — type a custom name below." when the filter is empty (46709).
- Components: SupplementsTab (46278–47013)
- Functions: filter closure over `PRESET_SUPPS` (46384–46392)
- State: `q`, `showPresets`, `name`
- Storage: none
- Network: none
- AI: none
- Edge cases: empty filter handled (46709). Presets are name-only — no dose/freq defaults, unlike `PRESET_COMPOUNDS` (47034).
- Gating: always on
- Status: WORKING
- Evidence for status: 46678 sets name from the tapped preset.
- Notes: Hardcoded 15-item list at 46129 (`PRESET_SUPPS`), outside range but the only source for this UI.

### F-SUPP-004 Dose / frequency / time-of-day controls
- Location: Fuel > Supps > add-or-edit form
- User action: Types a free-text dose; taps one of 3 frequency buttons; taps one of 5 time-of-day chips; types a custom time when "Custom".
- Behavior: 1) DOSE is a free-text input, placeholder "e.g. 5g, 2 capsules, 1000IU" (46728) — never parsed, only displayed. 2) FREQUENCY renders `SUPP_FREQ = ["Daily","Every Other Day","Weekly"]` (46131) as three equal-flex buttons (46736). 3) TIME OF DAY renders `SUPP_TIMES = ["Morning","Pre-Workout","With Food","Before Bed","Custom"]` (46130) as chips (46752). 4) Selecting "Custom" reveals a free-text input (46765); on save, `timeOf` is stored as the trimmed custom string, or the literal `"Custom"` if left blank (46357).
- Components: SupplementsTab (46278–47013)
- Functions: `save` (46351), `openEdit` (46330)
- State: `dose`, `freq`, `timeOf`, `customTime`
- Storage: writes `lk_supplements`
- Network: none
- AI: none
- Edge cases: a custom `timeOf` string never matches a scheduling window, so `getDueSupps` treats it as **due all day** (46180). Dose accepts any string, no validation.
- Gating: always on
- Status: WORKING
- Evidence for status: 46357 collapses Custom into a plain string field.
- Notes: `openEdit` round-trips custom times back into the Custom chip by checking `SUPP_TIMES.indexOf` (46335–46342) — but a user who literally names a custom time "Custom" is indistinguishable.

### F-SUPP-005 Per-supplement reminder toggle
- Location: Fuel > Supps > add/edit form > "Reminder" row
- User action: Taps the switch (`role="switch"`, 46782).
- Behavior: 1) Default is ON for new supplements (46325). 2) Subtitle claims "Home card + push notification when due" (46779). 3) Stored as `reminder: true|false` on the entry (46359). 4) `getDueSupps` skips any supplement with `reminder === false` (46168). 5) The pre-app push snapshot IIFE applies the same rule (1489).
- Components: SupplementsTab (46278–47013)
- Functions: `save` (46351), `getDueSupps` (46161), snapshot builder (1482–1499)
- State: `reminder`
- Storage: writes `lk_supplements`; migration flag `lk_reminderMigrated` (2393)
- Network: value is shipped inside `dueSupps` on the push snapshot POST (1547)
- AI: none
- Edge cases: legacy entries with no `reminder` field are treated as ON (`s.reminder !== false`, 46343; 46168).
- Gating: always on; the push half depends on push being enabled (1625 `/push/subscribe`)
- Status: WORKING
- Evidence for status: 46168 and 1489 both honour the flag.
- Notes: `migrateSuppReminders` (2393) **force-resets every `reminder:false` back to true, once** — see "Reminder mechanism". A user who deliberately turned reminders off before the migration ran silently got them back.

### F-SUPP-006 Mark supplement taken (list)
- Location: Fuel > Supps > list > left icon button on a supplement card
- User action: Taps the 38×38 icon square.
- Behavior: 1) `if (!taken) take(s.name)` (46861). 2) `take` calls `markSuppTaken(name)` which pushes the name into `log[isoDay()]` and `sd("suppLog", log)` (46135–46142). 3) Sets `suppLog` state, fires `logBetaActivity("supplement_taken", {name})` (46312–46317). 4) Card restyles: green tint background/border, line-through name, check icon (46818–46866, 46908).
- Components: SupplementsTab (46278–47013)
- Functions: `take` (46312), `markSuppTaken` (46135), `isSuppTaken` (46143), `isoDay` (1961)
- State: `suppLog`
- Storage: reads/writes `lk_suppLog`
- Network: `logBetaActivity` (2772)
- AI: none
- Edge cases: **no un-take / undo** — once marked, the button is disabled-by-cursor and the only recovery is clearing storage. Duplicate names collapse to one key.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 46861 guards `if (!taken)` and there is no inverse of `markSuppTaken` anywhere in the file — a mis-tap is unrecoverable in-app.
- Notes: The log is keyed by name string, not id, so **renaming a supplement orphans its entire history and streak** (46135, 46148).

### F-SUPP-007 Supplement history / streak screen
- Location: Fuel > Supps > list > tap the card body (role="button", tabIndex 0)
- User action: Taps or keyboard-activates the middle of a supplement row (46875–46900).
- Behavior: 1) `setShowHistory(i)` → early-return branch at 46398. 2) If the index no longer resolves, it calls `setShowHistory(null)` **during render** and returns null (46400–46403). 3) Computes `getSuppStreak` and builds a 14-entry array walking back from today (46405–46420). 4) Renders header (name, dose — timeOf — freq), two stat tiles (Day Streak in orange, "Last 14 Days" taken count in green), and a 7-column grid of 14 day cells with check or dot plus `MM-DD` labels (46421–46550).
- Components: SupplementsTab (46278–47013)
- Functions: `getSuppStreak` (46148), `getSuppLog` (46132), `isoDay` (1961), `lkKeyActivate` (5227)
- State: `showHistory`
- Storage: reads `lk_suppLog`
- Network: none
- AI: none
- Edge cases: stale index handled but via a **setState-in-render** (46401) — a React anti-pattern that will warn/loop-risk. Never-taken supplement shows streak 0 and 14 empty dots.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 46400–46402 mutates state during render rather than in an effect.
- Notes: History is read-only — no back-fill of a missed day. Grid is 7 columns for 14 items, so it reads as two rows of the most recent 7 then the prior 7, newest first (unusual ordering: index 0 = today, top-left).

### F-SUPP-008 Edit supplement
- Location: Fuel > Supps > list > pencil button on a row
- User action: Taps the edit icon (46952).
- Behavior: 1) `openEdit(idx)` loads every field from `supps[idx]`, resolving custom times (46330–46350). 2) Same form as add; header reads "Edit Supplement"; submit reads "SAVE CHANGES" (46560, 46801). 3) `save()` replaces the entry in place, preserving `created` (46362–46368), and logs `supplement_edit`.
- Components: SupplementsTab (46278–47013)
- Functions: `openEdit` (46330), `save` (46351)
- State: form fields, `editIdx`
- Storage: writes `lk_supplements`
- Network: `logBetaActivity` (2772)
- AI: none
- Edge cases: index-based, so a concurrent delete would edit the wrong row (no ids on supplements at all — 46353).
- Gating: always on
- Status: WORKING
- Evidence for status: 46362 writes `n[editIdx] = entry`.
- Notes: Renaming here silently breaks the dose log (see F-SUPP-006 notes).

### F-SUPP-009 Delete supplement
- Location: Fuel > Supps > list > trash button on a row
- User action: Taps trash; taps again to confirm.
- Behavior: 1) `remove(idx)` calls `lkConfirm("delSupp"+idx, "Tap again to remove <name>.")` (46384–46386); the first tap shows the message and returns false. 2) Second tap logs `supplement_delete` then filters the entry out and persists (46387–46396).
- Components: SupplementsTab (46278–47013)
- Functions: `remove` (46384), `lkConfirm` (5179), `setSupps` (46304)
- State: `supps`
- Storage: writes `lk_supplements`
- Network: `logBetaActivity` (2772)
- AI: none
- Edge cases: **the `lk_suppLog` history is not cleaned up** — deleting a supplement leaves its dose log rows forever, and re-adding the same name resurrects the old streak (46135, 46148).
- Gating: always on
- Status: PARTIAL
- Evidence for status: 46389 only filters `supplements`; nothing touches `suppLog`.
- Notes: Confirm key is index-based (`delSupp0`), so it can collide across list reorders.

### F-SUPP-010 Home "SUPPLEMENTS DUE" reminder card
- Location: Home tab > card stack > `supps` card
- User action: Reads the card; taps "Taken" next to a supplement.
- Behavior: 1) Home card registry maps `supps → SuppReminderCard` (26658–26661). 2) `getDueSupps()` computes the due list at mount (46186–46188): skips `reminder === false`, skips already-taken-today, applies Every-Other-Day (`floor(now/86400000) % 2`) and Weekly (`getDay() === 1`, i.e. Monday), then a **time window per timeOf**: Morning 05–12, Pre-Workout 12–18, With Food 11–14, Before Bed ≥19, anything else always due (46161–46184). 3) Returns null when nothing is due (46191) so the card self-hides. 4) Header 💊 "SUPPLEMENTS DUE"; each row shows name and "dose — timeOf" (46228–46255). 5) "Taken" button → `markSuppTaken`, removes the row from local `due`, logs `supplement_taken` (46192–46205).
- Components: SuppReminderCard (46185–46277)
- Functions: `getDueSupps` (46161), `markSuppTaken` (46135), `logBetaActivity` (2772)
- State: `due`, `suppLog` (both lazily initialised, never refreshed)
- Storage: reads `lk_supplements`, `lk_suppLog`; writes `lk_suppLog`
- Network: none
- AI: none
- Edge cases: empty → null. **The due list is computed once at mount and never recomputed** (46186) — the card does not update as the clock crosses a window boundary, nor when the user adds/takes a supplement in the Fuel tab. `suppLog` state is set but never read (46187, 46194) — dead state.
- Gating: always on
- Status: PARTIAL
- Evidence for status: 46186 `useState(getDueSupps)` with no `useEffect`/interval anywhere in the component.
- Notes: Window boundaries are hardcoded magic numbers, duplicated in the push snapshot with **different** custom-time behaviour (1498: custom clamps to 08–22, in-app it is all-day).

### F-SUPP-011 Supplement push notifications
- Location: (no UI in range) — driven from the pre-app IIFE and a server cron
- User action: Enables push elsewhere in the app; the toggle copy in this range promises it (46779).
- Behavior: 1) The bootstrap IIFE builds `dueSupps` by re-implementing the due rules against raw localStorage (1482–1499). 2) Each entry carries `{name, timeOf, win:[startHour,endHour]}`, sliced to 12 (1547). 3) Posted to the Worker at `API + "/push/..."` via `post()` (1556–1562); `API` defaults to `https://lockedapi.cescocugliari.workers.dev` (1305–1306). 4) The server cron decides when to fire; the client only supplies the due list and window.
- Components: none in range (SupplementsTab only advertises it, 46779)
- Functions: snapshot builder (1482–1499), `post` (1556)
- State: none
- Storage: reads `lk_supplements`, `lk_suppLog`; push keys `lk_pushDeviceId`, `lk_pushPrefs`, `lk_pushEnabled` (1307–1309)
- Network: POST to the Worker with a JSON body; response handling is out of range
- AI: none
- Edge cases: wrapped in try/catch that silently swallows everything (1499). Capped at 12 supplements.
- Gating: requires push permission + subscription (1625)
- Status: UNVERIFIED
- Evidence for status: the client side is present (1482–1547) but the actual notification is fired by the Cloudflare Worker cron, whose code is not in this file. Confirm by inspecting the `lockedapi` Worker.
- Notes: **Logic is triplicated** — `getDueSupps` (46161), the snapshot IIFE (1482), and the comment at 1479 admits the duplication is deliberate. Any rule change must be made in at least two places.

### F-CYCLE-200 "Stack" tab entry point (Fuel tab wrapper)
- Location: Fuel tab > sub-tab pill row > "Stack"
- User action: Taps the "Stack" chip, which only exists when performance tracking is on.
- Behavior: 1) `logTabs` is built without a cycle entry; `if (ld("perfTracking", false)) logTabs.push(["cycle","Stack"])` (37328–37329). 2) When `tab === "cycle"`, `CycleTab` is rendered with **no props** (37460). 3) `perfTracking` is toggled from a settings switch (33335–33360).
- Components: FuelTab (mount site 37460), CycleTab (47432)
- Functions: `ld` (2417)
- State: `tab` in FuelTab
- Storage: reads `lk_perfTracking`
- Network: none
- AI: none
- Edge cases: turning `perfTracking` off while the Stack tab is active removes the chip but `tab` stays `"cycle"`, and the render guard at 37460 is unconditional on `perfTracking` — so **the tab content keeps rendering with no way back except picking another chip**. UNVERIFIED whether the settings toggle forces a Fuel re-mount.
- Gating: opt-in flag `lk_perfTracking` (37329); described as opt-in in the privacy copy (21749)
- Status: WORKING (with the gating gap above)
- Evidence for status: 37329 gates the chip; 37460 renders the component.
- Notes: The chip label is "Stack" but the component, storage keys, and all copy say "Cycle".

### F-CYCLE-201 Cycle list screen
- Location: Fuel > Stack > list
- User action: Lands on the tab; taps a cycle row.
- Behavior: 1) `CycleTab` loads `getCycles()` and `getCycleLog()` (47433–47438). 2) Splits into `active` (`status === "active"`) and `past` (47572–47577). 3) Empty state: 💉 "No Cycles Logged" + a line promising account backup (47578–47607). 4) ACTIVE rows are green-tinted, show 💉, name, "N compounds — Week X of Y" using `ceil((now - startDate)/7d)` clamped to ≥1 (47612–47616). 5) PAST rows are muted, showing compound count and the date span with `"?"` fallbacks (47700–47740). 6) Tapping a row sets `selIdx` to the **index in the full `cycles` array** via `cycles.indexOf(cyc)` and switches to `detail` (47610, 47705). 7) "NEW CYCLE" dashed button at the bottom (47990–48012 region, ending 48842).
- Components: CycleTab (47432–48842)
- Functions: `getCycles` (47285), `getCycleLog` (47291), `isoDay` (1961)
- State: `cycles`, `cycleLog`, `view`, `selIdx`
- Storage: reads `lk_cycles`, `lk_cycleLog`
- Network: none directly; `cycles`/`cycleLog` ride the beta-activity snapshot (2812–2813)
- AI: none
- Edge cases: `cycles.indexOf` on an object identity is correct here but fragile. Week number can exceed the planned weeks with no clamp (47615).
- Gating: behind `perfTracking` (37329)
- Status: WORKING
- Evidence for status: 47578–47740 renders all three states.
- Notes: The empty-state copy asserts cloud backup; `lk_cycles`/`lk_cycleLog` do appear in the sync key list at 201.

### F-CYCLE-202 Create / edit a cycle
- Location: Fuel > Stack > "NEW CYCLE" (or detail > pencil) > add form
- User action: Names the cycle, sets start date and weeks, adds compounds, optional notes, taps "CREATE CYCLE".
- Behavior: 1) `openAdd` resets fields with `cStart = today`, `cWeeks = "12"` (47476–47485); `openEdit` hydrates from the cycle including `aiOverview` (47487–47497). 2) Weeks input strips non-digits (48253). 3) `calcEndDate()` adds `weeks*7` days to the start and previews "Ends: …" live (47550–47555, 48261). 4) `saveCycle` requires a name AND ≥1 compound (47565); builds `{name,startDate,endDate,weeks,compounds,notes,aiOverview,status:"active",created}` (47567–47578) and persists via `setCycles`→`saveCycles`→`sd("cycles")` (47461–47467, 47288). 5) Logs `cycle_create` / `cycle_edit` with the compound count (47590).
- Components: CycleTab (47432–48842)
- Functions: `openAdd` (47476), `openEdit` (47487), `calcEndDate` (47550), `saveCycle` (47564), `setCycles` (47461), `saveCycles` (47288)
- State: `cName`, `cStart`, `cEnd`, `cWeeks`, `cComps`, `cNotes`, `aiOverview`, `editIdx`, `view`
- Storage: writes `lk_cycles`
- Network: `logBetaActivity` (2772)
- AI: optional overview stored on the cycle (see F-CYCLE-205)
- Edge cases: submit disabled until name + ≥1 compound (48838); `parseInt(cWeeks) || 12` guards a blank weeks field (47553). `cEnd` state exists and is honoured (`cEnd || calcEndDate()`, 47566) but **there is no UI to set it** — always falls through to the computed date. Date input gets `colorScheme` from `isDarkMode` (48237).
- Gating: behind `perfTracking`
- Status: PARTIAL
- Evidence for status: 47566 reads `cEnd`, but no input anywhere in 48100–48300 writes `setCEnd` other than `openAdd`/`openEdit` — dead form field.
- Notes: Editing an active cycle re-sets `status: "active"` (47574), so **editing a completed cycle silently revives it**.

### F-CYCLE-203 Add / edit a compound (within a cycle)
- Location: Fuel > Stack > add form > "Add Custom Compound" or a preset row > compound form
- User action: Types a name, picks a category, dose, frequency, route; taps "ADD TO CYCLE".
- Behavior: 1) Two entry points: `addPresetComp(preset)` prefills name/dose/freq/route/cat from `PRESET_COMPOUNDS` (47500–47509), or the "Add Custom Compound" button clears everything (48472–48480). 2) `openCompEdit(idx)` hydrates from `cComps[idx]` (47511–47519). 3) The form (47623–47790) renders CATEGORY chips from `COMPOUND_CATEGORIES` (5 entries, 47014), FREQUENCY from `CYCLE_FREQ_OPTS` (7 entries, 47282), and ROUTE from **the preset's own `routes` array if the name matches a preset, else `CYCLE_ROUTE_OPTS`** (47625–47627). 4) When a preset matches, a hint line shows "Typical: <defDose> — Half-life: <halfLife>" (47720). 5) `saveComp` trims the name, builds `{name,dose,freq,route,cat}`, replaces or appends into `cComps`, closes the form and clears name/dose (47521–47548).
- Components: CycleTab (47432–48842)
- Functions: `addPresetComp` (47500), `openCompEdit` (47511), `saveComp` (47521), `removeComp` (47543–47549)
- State: `compName`, `compDose`, `compFreq`, `compRoute`, `compCat`, `showCompForm`, `compEditIdx`, `cComps`
- Storage: none until the parent cycle is saved (compounds live in `cComps` state)
- Network: none
- AI: none
- Edge cases: save disabled on empty name (47784). `removeComp` has **no confirm** (47543) unlike every other destructive action here. Compounds have no ids — the dose log keys on `cycleName + "::" + compoundName` (47294), so renaming either breaks history.
- Gating: behind `perfTracking`
- Status: WORKING
- Evidence for status: 47521–47542 mutates `cComps` correctly for both add and edit.
- Notes: Editing a compound name away from a preset silently widens the route options back to the generic list (47626).

### F-CYCLE-204 Compound preset database browser
- Location: Fuel > Stack > add form > "Browse Compound Database"
- User action: Taps the button, optionally searches and/or filters by category, taps a compound.
- Behavior: 1) Toggles `showPresets` and resets `presetCat`/`presetQ` (48380–48384). 2) `filteredPresets` filters `PRESET_COMPOUNDS` (32 entries, 47034–47281) by category then case-insensitive name substring (48152–48158). 3) Category chips: "All" plus the 5 `COMPOUND_CATEGORIES`, each tinted with its own colour; tapping an active chip clears it (48416–48440). 4) The result list is a `maxHeight: 220` scroll area; each row shows a colour bar, name, and "defDose — routes.join(', ') — halfLife" (48441–48463). 5) "No matches" fallback (48464). 6) Tapping a row calls `addPresetComp` and jumps into the compound form (47500).
- Components: CycleTab (47432–48842)
- Functions: `addPresetComp` (47500)
- State: `showPresets`, `presetCat`, `presetQ`
- Storage: none
- Network: none
- AI: none
- Edge cases: empty result handled. Unlike the supplement presets, **already-added compounds are not filtered out** — the same compound can be added twice, and the two share one log key (47294).
- Gating: behind `perfTracking`
- Status: WORKING
- Evidence for status: 48441–48463 renders the filtered list; 48380 toggles it.
- Notes: `PRESET_COMPOUNDS` is 32 hardcoded entries covering AAS, SARMs/peptides, GLP-1s, HGH and ancillaries, each with `defDose`, `defFreq` and a `halfLife` string (47034–47281). All half-life values are hardcoded free text ("~8 days (Enanthate)"), not machine-readable.

### F-CYCLE-205 AI cycle overview
- Location: Fuel > Stack > add form > "Generate AI Cycle Overview"
- User action: Taps the button (only rendered once ≥1 compound exists), or "Regenerate".
- Behavior: 1) `getAiOverview()` early-returns on an empty compound list (47610). 2) Sets `aiLoading`, builds `compList` as "Name dose freq (route)" joined by commas (47612–47616). 3) System prompt (47617): *"You are a knowledgeable fitness pharmacology assistant. Be practical and informative, not preachy or moralising. The user is an adult making their own decisions. Give a concise cycle overview."* 4) User message (47618) asks for expected effects, bloodwork timing, monitoring, PCT, "4-6 sentences", passing cycle name, weeks and compound list. 5) `aiCall(sys, msg, null, onDone, onFail)` (47619–47626; `aiCall` at 2663). 6) Success writes `aiOverview`; failure writes the literal string `"AI overview unavailable. Check your connection and try again."` into `aiOverview` (47624). 7) Spinner + "Analysing cycle…" while loading (48784–48800). 8) Result renders in an orange card with a "Regenerate" link (48802–48830); on the detail screen it renders under "AI OVERVIEW" / "Coach Analysis" (48090–48116).
- Components: CycleTab (47432–48842)
- Functions: `getAiOverview` (47609), `aiCall` (2663)
- State: `aiOverview`, `aiLoading`
- Storage: persisted onto the cycle object as `aiOverview` when the cycle is saved (47572)
- Network: whatever `aiCall` does (2663) — out of range
- AI: model/endpoint determined inside `aiCall` (2663); prompt at 47617–47618; inputs = cycle name, weeks, compound name/dose/freq/route; output = free text
- Edge cases: **the error string is written into `aiOverview` itself**, so if the user then saves the cycle, "AI overview unavailable…" is persisted and displayed forever as the Coach Analysis (47624 → 47572 → 48116).
- Gating: behind `perfTracking`; button only when `cComps.length > 0` (48770)
- Status: PARTIAL
- Evidence for status: 47624 stores the failure message in the same field as a real result, with no error flag.
- Notes: This is the only AI call in the range. The prompt explicitly instructs the model not to moralise about anabolic steroid use — a policy/safety point the redesign team should review deliberately.

### F-CYCLE-206 Cycle detail — today's doses
- Location: Fuel > Stack > tap a cycle > detail > "TODAY"
- User action: Taps the dot button next to a compound.
- Behavior: 1) Detail renders only when `view === "detail" && selIdx !== null && cycles[selIdx]` (47791). 2) Header: back arrow, name, "Active"/"Completed", "— Week X of Y" for active cycles (47793–47830), pencil → `openEdit(selIdx)` (47838), and an "End" button for active cycles (47860). 3) The TODAY section only renders when active (47880). 4) Per compound it recomputes `dueToday` inline: Every Other Day (`dayNum % 2`), 1x/week Monday, 2x/week Mon+Thu, 3x/week Mon/Wed/Fri, "As Needed" never (47890–47900). 5) The take button is disabled when already taken or not due; not-due rows show " (not scheduled today)" (47905–47960). 6) `take()` → `markCompoundTaken(cycleName, compName)` writing `log[today].push(cycleName+"::"+compName)` (47469–47475, 47293–47301). 7) Streak badge from `getCompoundStreak` when >1 (47306–47318, 47940).
- Components: CycleTab (47432–48842)
- Functions: `take` (47469), `markCompoundTaken` (47293), `isCompoundTaken` (47302), `getCompoundStreak` (47306)
- State: `cycleLog`, `selIdx`, `view`
- Storage: reads/writes `lk_cycleLog`
- Network: `logBetaActivity("compound_taken", …)` (47471)
- AI: none
- Edge cases: no undo, same as supplements. "As Needed" compounds can **never** be logged from any screen (47899, 46 — `getDueCompounds` also skips them, 47325). Weekday scheduling is hardcoded to Monday-anchored, not user-configurable.
- Gating: behind `perfTracking`
- Status: PARTIAL
- Evidence for status: 47899 sets `dueToday = false` for "As Needed" and the button is `disabled` at 47912 — an "As Needed" compound is un-loggable despite being a valid frequency option (47282).
- Notes: The `dueToday` block is a **fourth copy** of the frequency rules (47890 vs 47320 vs 1519 vs the supplement variant at 46170); `new Date().getDay()` is called up to four times per compound per render (47893–47896).

### F-CYCLE-207 Cycle detail — compound roster, AI overview, notes
- Location: Fuel > Stack > detail
- User action: Scrolls.
- Behavior: 1) "COMPOUNDS (n)" lists every compound with a category colour bar, "dose — route — freq", and a category pill whose text colour comes from `readableAccent(cat.col)` (47962–48088; `readableAccent` at 4318). 2) "AI OVERVIEW" card renders `cyc.aiOverview` when present, labelled "Coach Analysis" (48090–48116). 3) "NOTES" renders `cyc.notes` when present (48117–48134).
- Components: CycleTab (47432–48842)
- Functions: `readableAccent` (4318)
- State: none beyond `selIdx`
- Storage: reads `lk_cycles`
- Network: none
- AI: displays the stored `aiOverview` (F-CYCLE-205)
- Edge cases: unknown `cat` falls back to `COMPOUND_CATEGORIES[4]` ("Other", grey) everywhere (47964, 47388, 48160).
- Gating: behind `perfTracking`
- Status: WORKING
- Evidence for status: 47962–48134 renders all three blocks conditionally.
- Notes: There is no way to regenerate the AI overview from the detail screen — only from the edit form (48812).

### F-CYCLE-208 End a cycle
- Location: Fuel > Stack > detail > "End" button (active cycles only)
- User action: Taps "End".
- Behavior: 1) `endCycle(idx)` sets `status: "completed"` and `endDate: todayISO` via `Object.assign` (47593–47603). 2) Logs `cycle_ended` (47601). 3) The cycle moves to PAST CYCLES on the next list render (47576).
- Components: CycleTab (47432–48842)
- Functions: `endCycle` (47593), `setCycles` (47461)
- State: `cycles`
- Storage: writes `lk_cycles`
- Network: `logBetaActivity` (2772)
- AI: none
- Edge cases: **no confirmation** — a single tap ends the cycle, and there is no "reactivate" action (the only way back is editing the cycle, which resets `status:"active"` as a side effect, 47574).
- Gating: behind `perfTracking`
- Status: PARTIAL
- Evidence for status: 47860 wires `endCycle` directly to onClick with no `lkConfirm`, unlike Delete Cycle (48137).
- Notes: Overwrites the planned `endDate` with today, losing the original schedule.

### F-CYCLE-209 Delete a cycle
- Location: Fuel > Stack > detail > "Delete Cycle"
- User action: Taps Delete; taps again.
- Behavior: 1) `lkConfirm("delCycle"+selIdx, "Tap Delete again to remove this cycle.")` (48137). 2) `deleteCycle(idx)` logs `cycle_deleted`, filters the cycle out, and if it was the selected one resets `selIdx`/`view` back to the list (47604–47620).
- Components: CycleTab (47432–48842)
- Functions: `deleteCycle` (47604), `lkConfirm` (5179)
- State: `cycles`, `selIdx`, `view`
- Storage: writes `lk_cycles`
- Network: `logBetaActivity` (2772)
- AI: none
- Edge cases: `lk_cycleLog` rows for the deleted cycle are **never removed** (47604) — orphaned dose history accumulates and a same-named cycle inherits it.
- Gating: behind `perfTracking`
- Status: PARTIAL
- Evidence for status: 47604–47612 touches only `cycles`.
- Notes: `deleteCycle` reads `cycles[idx].name` for logging before the filter, so it is safe against the stale-closure ordering.

### F-CYCLE-210 Home "COMPOUNDS DUE" reminder card
- Location: Home tab > card stack > `cycle` card
- User action: Reads the card; taps "Taken".
- Behavior: 1) Home registry maps `cycle → CycleReminderCard` (26664–26667). 2) The component reads `perfTracking` and returns null if off or nothing due (47335, 47341). 3) `getDueCompounds()` (47320–47333) also short-circuits on `perfTracking`, skips non-active cycles, skips cycles outside their date window, skips already-taken keys, then applies the frequency rules including "As Needed → never". 4) Rows show name and "dose — route(or freq) — cycleName", with a category lookup falling back to "Other" (47388–47410). 5) "Taken" → `markCompoundTaken`, removes the row, logs `compound_taken` (47343–47358).
- Components: CycleReminderCard (47334–47431)
- Functions: `getDueCompounds` (47320), `markCompoundTaken` (47293), `logBetaActivity` (2772)
- State: `due`, `cycleLog`
- Storage: reads `lk_perfTracking`, `lk_cycles`, `lk_cycleLog`; writes `lk_cycleLog`
- Network: none
- AI: none
- Edge cases: same never-refreshes problem as F-SUPP-010 — `due` is computed once at mount (47336). `cycleLog` state is written and never read (47337, 47345). `cat` is computed at 47388 but the result is **never used** in the rendered output — dead code.
- Gating: `lk_perfTracking`
- Status: PARTIAL
- Evidence for status: 47388 computes `cat` and no subsequent style references it; 47336 never recomputes `due`.
- Notes: Unlike supplements, compounds have **no time-of-day window** at all — everything not yet taken is due from midnight.

---

# PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| SuppReminderCard | component | 46185–46277 | Home card listing supplements due now | Home card registry (26658–26661) | getDueSupps, getSuppLog, markSuppTaken, logBetaActivity, Ic | F-SUPP-010 |
| take (SuppReminderCard) | handler | 46192–46205 | Marks one supplement taken and drops it from the card | "Taken" button (46259) | markSuppTaken, logBetaActivity | F-SUPP-010 |
| SupplementsTab | component | 46278–47013 | Full supplement CRUD + history screen | FuelTab (37460) | ld, sd, getSuppLog, getSuppStreak, isSuppTaken, markSuppTaken, lkConfirm, logBetaActivity, isoDay, lkKeyActivate, Ic | F-SUPP-001..009 |
| setSupps | function | 46304–46311 | State setter that also persists `lk_supplements` | save, remove | sd | F-SUPP-002,008,009 |
| take (SupplementsTab) | handler | 46312–46317 | Marks a supplement taken from the list | list check button (46861) | markSuppTaken, logBetaActivity | F-SUPP-006 |
| openAdd | handler | 46318–46329 | Resets the form and opens it in add mode | ADD SUPPLEMENT button (46991) | — | F-SUPP-002 |
| openEdit | handler | 46330–46350 | Hydrates the form from an existing supplement | edit button (46953) | — | F-SUPP-008 |
| save | handler | 46351–46383 | Validates and persists a new/edited supplement | submit button (46795) | setSupps, logBetaActivity | F-SUPP-002,004,008 |
| remove | handler | 46384–46396 | Two-tap delete of a supplement | trash button (46972) | lkConfirm, logBetaActivity, setSupps | F-SUPP-009 |
| filteredPresets (supp) | derived value | 46384–46392 (filter closure) | Presets minus already-added, filtered by query | add-form preset list | — | F-SUPP-003 |
| COMPOUND_CATEGORIES | const array | 47014–47033 | 5 compound categories with display colours | CycleTab, CycleReminderCard | — | F-CYCLE-203,204,206,207,210 |
| PRESET_COMPOUNDS | const array | 47034–47281 | 32-entry compound database (dose/freq/routes/half-life) | CycleTab | — | F-CYCLE-203,204 |
| CYCLE_FREQ_OPTS | const array | 47282 | 7 frequency options | CycleTab compound form | — | F-CYCLE-203 |
| CYCLE_ROUTE_OPTS | const array | 47283 | 6 administration routes | CycleTab compound form | — | F-CYCLE-203 |
| getCycles | function | 47285–47287 | Reads `lk_cycles` | CycleTab | ld | F-CYCLE-201 |
| saveCycles | function | 47288–47290 | Writes `lk_cycles` | setCycles | sd | F-CYCLE-202,208,209 |
| getCycleLog | function | 47291–47293 | Reads `lk_cycleLog` | CycleTab, CycleReminderCard, markCompoundTaken, isCompoundTaken, getCompoundStreak | ld | F-CYCLE-206,210 |
| markCompoundTaken | function | 47293–47301 | Appends `cycle::compound` to today's log | take (both cycle components) | getCycleLog, isoDay, sd | F-CYCLE-206,210 |
| isCompoundTaken | function | 47302–47306 | Whether a compound was logged on a date | cycle detail (47888) | getCycleLog, isoDay | F-CYCLE-206 |
| getCompoundStreak | function | 47306–47319 | Consecutive-day streak for a compound | cycle detail (47889) | getCycleLog, isoDay | F-CYCLE-206 |
| getDueCompounds | function | 47320–47333 | Due list for the Home compounds card | CycleReminderCard (47336) | ld, getCycles, getCycleLog, isoDay | F-CYCLE-210 |
| CycleReminderCard | component | 47334–47431 | Home card listing compounds due today | Home card registry (26664–26667) | getDueCompounds, getCycleLog, markCompoundTaken, logBetaActivity, Ic | F-CYCLE-210 |
| take (CycleReminderCard) | handler | 47343–47358 | Logs a compound taken from the Home card | "Taken" button (47412) | markCompoundTaken, logBetaActivity | F-CYCLE-210 |
| CycleTab | component | 47432–48842 | Entire cycle module: list, add, detail, compound form | FuelTab (37460) | getCycles, getCycleLog, saveCycles, markCompoundTaken, isCompoundTaken, getCompoundStreak, aiCall, lkConfirm, logBetaActivity, readableAccent, isoDay, Ic | F-CYCLE-201..209 |
| setCycles | function | 47461–47468 | State setter that persists `lk_cycles` | saveCycle, endCycle, deleteCycle | saveCycles | F-CYCLE-202,208,209 |
| take (CycleTab) | handler | 47469–47475 | Logs a compound taken from the detail screen | detail dose button (47907) | markCompoundTaken, logBetaActivity | F-CYCLE-206 |
| openAdd (CycleTab) | handler | 47476–47486 | Resets the cycle form, opens `add` view | NEW CYCLE button | — | F-CYCLE-202 |
| openEdit (CycleTab) | handler | 47487–47499 | Hydrates the cycle form from an existing cycle | detail pencil (47838) | — | F-CYCLE-202 |
| addPresetComp | handler | 47500–47510 | Prefills the compound form from a preset | preset row (48448) | — | F-CYCLE-203,204 |
| openCompEdit | handler | 47511–47520 | Hydrates the compound form from `cComps[idx]` | compound edit button (48211) | — | F-CYCLE-203 |
| saveComp | handler | 47521–47542 | Adds/replaces a compound in the draft cycle | compound submit (47783) | — | F-CYCLE-203 |
| removeComp | handler | 47543–47549 | Removes a compound from the draft (no confirm) | compound trash (48228) | — | F-CYCLE-203 |
| calcEndDate | function | 47550–47556 | start + weeks*7 → ISO end date | saveCycle, add-form preview | isoDay | F-CYCLE-202 |
| saveCycle | handler | 47564–47592 | Validates and persists a cycle | CREATE CYCLE button (48831) | calcEndDate, setCycles, logBetaActivity | F-CYCLE-202 |
| endCycle | handler | 47593–47603 | Marks a cycle completed with today's date | "End" button (47860) | setCycles, logBetaActivity | F-CYCLE-208 |
| deleteCycle | handler | 47604–47620 | Removes a cycle and resets the view | Delete Cycle button (48137) | setCycles, logBetaActivity | F-CYCLE-209 |
| getAiOverview | handler | 47609–47628 | Builds the prompt and calls the AI for a cycle overview | Generate/Regenerate buttons (48771, 48812) | aiCall | F-CYCLE-205 |
| filteredPresets (compound) | derived value | 48152–48158 | Preset compounds filtered by category + query | compound database browser | — | F-CYCLE-204 |
| **Placeholder** | component | 48843–48884 | Renders an icon + name + "Coming soon" | **nothing — never referenced** | Ic | — (DEAD) |
| COACH_MARKER_DOCS | const string | 48885–48919 | AI action-marker schema block appended to the coach system prompt | coachBuildContext (49384) | — | out of scope (Coach agent) |
| COACH_DATA_KEYS | const array | 48920–48930 | Toggleable coach data-sharing categories | coachDataPrefs, coachVisibleData | — | out of scope |
| coachDataPrefs | function | 48931–48938 | Reads per-key coach data-sharing prefs | coachBuildContext | ld | out of scope |
| coachMemoryItems | function | 48939–48946 | Reads saved coach memories | coachBuildContext | ld | out of scope |
| coachMemoryOn | function | 48947–48949 | Whether coach memory is enabled | coachBuildContext | ld | out of scope |
| COACH_STYLES | const array | 48950–48965 | Coach personality presets | coachStyle | — | out of scope |
| coachStyle | function | 48966–48980 | Resolves the active coach style with a "warm" fallback | coachBuildContext | ld | out of scope |
| coachTier3For | function | 48981–49000 | Keyword-triggers which deep data tiers to include | coachBuildContext | — | out of scope |
| coachBuildContext | function | 49001–49268 | Assembles the full coach system prompt (reads `supplements` at 49181 and `cycles` at 49186 when opted in) | Coach components | ld, coachDataPrefs, coachTier3For, coachStyle, coachMemoryItems | out of scope (touches F-SUPP/F-CYCLE data) |
| coachContextTokens | function | 49269–49276 | Rough token estimate (len/4) | Coach debug UI | — | out of scope |
| coachOpener | function | 49277–49385 | Builds the coach's opening line | Coach components | ld | out of scope |
| coachVisibleData | function | 49386–49399+ | Lists which data categories the coach can currently see | Coach settings UI | ld, COACH_DATA_KEYS | out of scope |

Counts: **41 functions/components/handlers indexed in scope**, plus 11 coach-block entries that fall inside the line range but belong to the Coach feature area.

---

## Supplement data model

A **supplement** (element of `lk_supplements`, built at 46353–46361):
```js
{
  name: string,       // trimmed, required, NOT unique, acts as the log key
  dose: string,       // free text, may be "", never parsed
  freq: string,       // one of SUPP_FREQ: "Daily" | "Every Other Day" | "Weekly" (46131)
  timeOf: string,     // one of SUPP_TIMES minus "Custom" (46130), OR an arbitrary
                      // user string, OR the literal "Custom" if the custom box was blank (46357)
  reminder: boolean,  // defaults true (46325); absent on legacy rows, treated as true (46168)
  created: string     // ISO timestamp, preserved across edits (46360)
}
```
There is **no id field** (46353) — identity is the name string.

A **schedule** is not a stored object. It is derived at read time from `freq` + `timeOf` by `getDueSupps` (46161–46184): frequency gate (`Every Other Day` = even `floor(epochMs/86400000)`, `Weekly` = `getDay() === 1`), then a hardcoded hour window per `timeOf` (Morning 5–12, Pre-Workout 12–18, With Food 11–14, Before Bed ≥19, anything else always due).

A **reminder** is likewise not an object — it is the boolean `reminder` field plus the derived due-state. The push payload materialises it as `{name, timeOf, win:[startHour,endHour]}` (1499).

A **logged dose** lives in `lk_suppLog`, shaped as a date→names map (46135–46142):
```js
{ "2026-09-10": ["Creatine", "Vitamin D"], "2026-09-09": [...] }
```
Only presence is recorded — **no timestamp, no dose amount, no count, and no way to remove an entry** (there is no inverse of `markSuppTaken`).

Cycle side, for completeness: a **cycle** (47567–47578) is `{name, startDate, endDate, weeks, compounds[], notes, aiOverview, status:"active"|"completed", created}`; a **compound** (47528–47534) is `{name, dose, freq, route, cat}`; a **logged compound dose** is `lk_cycleLog` = date → `["<cycleName>::<compoundName>", …]` (47293–47301).

## Reminder mechanism

There are **two independent mechanisms**, and they do not share code.

1. **In-app card (always available).** `SuppReminderCard` (46185) is one entry in the Home tab's card registry (26658–26661), and `CycleReminderCard` (47334) is another (26664–26667). Each computes its due list **once, in a lazy `useState` initialiser** (46186, 47336) with no `useEffect`, no interval and no subscription. Consequences: the card does not appear or disappear as the hour crosses a window boundary, and it does not reflect supplements added or taken elsewhere until the Home tab re-mounts. Both cards self-hide by returning `null` when nothing is due (46191, 47341).

2. **Push notification (requires the Worker).** The pre-app bootstrap IIFE re-implements the due rules directly against raw localStorage — the comment at 1479–1481 states this duplication is deliberate "because this IIFE runs before that script loads". It produces `dueSupps` (1482–1499, capped at 12, 1547) and `dueCompounds` (1501–1527, capped at 8) and POSTs them to the Worker (`post()` at 1556; `API` = `https://lockedapi.cescocugliari.workers.dev` unless `WORKER_API` is defined, 1305–1306). **The actual firing is server-side cron; that code is not in this file.** The two implementations already diverge: a custom/blank `timeOf` is "due all day" in-app (46180) but is clamped to an 08:00–22:00 window for push (1497–1498).

The in-form copy "Home card + push notification when due" (46779) therefore over-promises for anyone who has not enabled push.

**`migrateSuppReminders` (2393–2406, scheduled via `setTimeout(..., 0)` at 2407):**
```js
if (ld("reminderMigrated", false)) return;      // idempotent, one-shot
var supps = ld("supplements", null);
supps.forEach(s => { if (s.reminder === false) { s.reminder = true; changed = true; } });
if (changed) sd("supplements", supps);
sd("reminderMigrated", true);
```
It **force-enables reminders on every supplement that had them turned off**, then sets `lk_reminderMigrated` so it never runs again. The whole body is inside a bare `try/catch(e){}` (2394, 2405) so any failure is silent — including a failure to set the flag, which would make it re-run and re-enable the toggle on the next load. This is a user-hostile migration: it silently reverses an explicit user choice. It was presumably intended to repair rows where `reminder` was written as `false` by an earlier bug, but it cannot distinguish that from a deliberate opt-out. **Flag for the redesign.**

## Placeholder component analysis

```js
function Placeholder(p) { … p.icon, p.name … "Coming soon" }   // 48843–48884
```
It renders a full-height centred column: a 64×64 rounded orange-tinted tile containing `Ic` with `p.icon`, a 1.625rem bold `p.name`, and the muted literal text **"Coming soon"** (48879–48883).

**Every place it renders: none.** A whole-file grep for the identifier returns exactly one hit — its own definition at 48843:
```
$ grep -n "Placeholder" redesign/input/locked-current-v6.html
48843:function Placeholder(p) {
```
There is no `React.createElement(Placeholder`, no `<Placeholder`, no reference in any tab registry, route map, or conditional anywhere in all 58,015 lines.

**Conclusion: `Placeholder` is DEAD CODE, not evidence of unfinished screens.** It is a leftover scaffold from an earlier build when tabs were stubbed out before being implemented; every tab it would have covered now has a real component (Fuel's own sub-tab dispatcher at 37455–37460 wires ten real components with no fallback branch). Its survival is a mild signal about the codebase's hygiene — a 42-line unreferenced component sitting between `CycleTab` and the coach-context block — but it is **not** a "Coming soon" screen a user can reach. Nothing in this file's UI can display the string "Coming soon" via this component.

Delete it in the redesign. Separately, note what its absence proves: there is no generic empty/unbuilt-screen affordance in the app, so any genuinely unfinished area fails in some other way rather than degrading gracefully.

## Storage keys touched

All go through `ld` (2417) / `sd` (2435), which prefix with `lk_`.

| Key | Read at | Written at | Notes |
|---|---|---|---|
| `lk_supplements` | 46279, 46162, 2396, 1484, 19408, 49181 | 46310 (via `setSupps`), 2402 (migration) | The supplement list; synced (201–202) |
| `lk_suppLog` | 46132, 46282, 46407, 1485, 19409 | 46141 (`markSuppTaken`) | Date→names map; **never pruned on delete** |
| `lk_reminderMigrated` | 2395 | 2404 | One-shot migration flag |
| `lk_cycles` | 47286, 2812, 1505 | 47289 (`saveCycles`) | Cycle list; synced (201) |
| `lk_cycleLog` | 47292, 2813, 1506 | 47300 (`markCompoundTaken`) | Date→`cycle::compound` keys; never pruned |
| `lk_perfTracking` | 47321, 47335, 37329, 33335/33340/33347/33360, 1504, 49186 | 33336 (settings toggle) | Opt-in gate for all cycle features |
| `lk_pushDeviceId` / `lk_pushPrefs` / `lk_pushEnabled` | 1307–1309 | (push module, out of range) | Referenced only by the push path behind F-SUPP-011 |

No secrets, tokens, or API keys appear anywhere in 46185–49399. The only hardcoded endpoint reachable from these features is the Worker origin at 1305–1306, which is a public API host, not a credential.

## Open questions / UNVERIFIED

1. **CycleTab is not a wrapper.** The brief describes it as "the Fuel-tab entry point into cycle tracking" with internals owned by another agent at 22417–26140. In this file, `CycleTab` (47432–48842, 1,410 lines) contains the complete module — list, add form, compound form, detail screen, presets, AI overview. There is only one definition of `CycleTab` in the file (grep returns the mount at 37460 and nothing else). **Whatever lives at 22417–26140 is a different component and may be a second, parallel cycle implementation.** Confirm by diffing the two ranges; if both exist, that is a duplicated-feature finding for the redesign.
2. **Push firing (F-SUPP-011).** The client posts a due list to the Cloudflare Worker (1547, 1556, 1305). Whether a supplement notification is ever actually delivered, and on what cron cadence, cannot be determined from this file. Confirm by inspecting the `lockedapi` Worker source.
3. **Stack-tab gating gap (F-CYCLE-200).** Turning `lk_perfTracking` off while `tab === "cycle"` removes the chip (37329) but the render guard at 37460 does not check the flag. Confirm by toggling the setting with the Stack tab active and observing whether FuelTab re-mounts and resets `tab`.
4. **`aiCall` behaviour (F-CYCLE-205).** Model, endpoint, streaming and auth are all inside `aiCall` (2663), outside this range. The prompt and its handling are documented above; the model identity is not verifiable from here.
5. **`SuppReminderCard` staleness.** I assert the due list never refreshes based on the absence of any `useEffect`/`setInterval` in 46185–46277 and the lazy-initialiser form at 46186. Confirm by leaving the Home tab open across an hour boundary (e.g. 11:59 → 12:01) and checking whether Morning items disappear.
