### F-SUPP-001 — Supplement list (Fuel > Supps tab)
- location: Fuel tab > "Supps" pill > list screen
- user action: Taps the "Supps" chip in the Fuel sub-tab row.
- behaviour: 1) `FuelTab` renders `SupplementsTab` when `tab === "supps"` (46278; mounted at 37460). 2) Component loads `ld("supplements", [])` into state (46279–46281) and `getSuppLog()` (46282–46284). 3) Empty state renders "No supplements added yet." (46804–46815). 4) Each supplement renders a card: check button, name, per-item streak badge (`>1`), dose, timeOf (colour-coded), freq (hidden when "Daily"), edit + delete buttons (46816–47000). 5) Time-of-day drives both the accent colour and the emoji: Morning 🌅/WA, Pre-Workout 💪/OR, Before Bed 🌙/OR, With Food 🍽️/GR, else 💊/BLU (46821, 46869).
- v6 status: WORKING

### F-SUPP-002 — Add supplement
- location: Fuel > Supps > "ADD SUPPLEMENT" dashed button > add form
- user action: Taps "ADD SUPPLEMENT" (46990–47012), fills fields, taps "ADD SUPPLEMENT".
- behaviour: 1) `openAdd()` resets every form field to defaults (name "", dose "", freq "Daily", timeOf "Morning", customTime "", reminder true), clears `editIdx`, sets `showAdd` (46318–46329). 2) Form screen renders (46551 onwards) with early return, replacing the list. 3) `save()` (46351–46383) trims name, bails silently if empty, builds the entry, appends via `setSupps` which writes `sd("supplements", n)` (46305–46311). 4) `logBetaActivity("supplement_add", {name, dose})` (46375–46378). 5) Closes form.
- v6 status: WORKING

### F-SUPP-003 — Preset supplement picker
- location: Fuel > Supps > add form > "Choose from Presets"
- user action: Taps "Choose from Presets", optionally types in the search box, taps a chip.
- behaviour: 1) Button only renders when `!name && editIdx === null` (46593) — it disappears once anything is typed, and is never shown when editing. 2) Toggles `showPresets`. 3) Search input filters `PRESET_SUPPS` case-insensitively AND removes any preset already in the user's list (46384–46392). 4) Tapping a chip sets `name`, hides presets, clears `q` (46678–46684). 5) "No matches — type a custom name below." when the filter is empty (46709).
- v6 status: WORKING

### F-SUPP-004 — Dose / frequency / time-of-day controls
- location: Fuel > Supps > add-or-edit form
- user action: Types a free-text dose; taps one of 3 frequency buttons; taps one of 5 time-of-day chips; types a custom time when "Custom".
- behaviour: 1) DOSE is a free-text input, placeholder "e.g. 5g, 2 capsules, 1000IU" (46728) — never parsed, only displayed. 2) FREQUENCY renders `SUPP_FREQ = ["Daily","Every Other Day","Weekly"]` (46131) as three equal-flex buttons (46736). 3) TIME OF DAY renders `SUPP_TIMES = ["Morning","Pre-Workout","With Food","Before Bed","Custom"]` (46130) as chips (46752). 4) Selecting "Custom" reveals a free-text input (46765); on save, `timeOf` is stored as the trimmed custom string, or the literal `"Custom"` if left blank (46357).
- v6 status: WORKING

### F-SUPP-005 — Per-supplement reminder toggle
- location: Fuel > Supps > add/edit form > "Reminder" row
- user action: Taps the switch (`role="switch"`, 46782).
- behaviour: 1) Default is ON for new supplements (46325). 2) Subtitle claims "Home card + push notification when due" (46779). 3) Stored as `reminder: true|false` on the entry (46359). 4) `getDueSupps` skips any supplement with `reminder === false` (46168). 5) The pre-app push snapshot IIFE applies the same rule (1489).
- v6 status: WORKING

### F-SUPP-006 — Mark supplement taken (list)
- location: Fuel > Supps > list > left icon button on a supplement card
- user action: Taps the 38×38 icon square.
- behaviour: 1) `if (!taken) take(s.name)` (46861). 2) `take` calls `markSuppTaken(name)` which pushes the name into `log[isoDay()]` and `sd("suppLog", log)` (46135–46142). 3) Sets `suppLog` state, fires `logBetaActivity("supplement_taken", {name})` (46312–46317). 4) Card restyles: green tint background/border, line-through name, check icon (46818–46866, 46908).
- v6 status: PARTIAL

### F-SUPP-007 — Supplement history / streak screen
- location: Fuel > Supps > list > tap the card body (role="button", tabIndex 0)
- user action: Taps or keyboard-activates the middle of a supplement row (46875–46900).
- behaviour: 1) `setShowHistory(i)` → early-return branch at 46398. 2) If the index no longer resolves, it calls `setShowHistory(null)` **during render** and returns null (46400–46403). 3) Computes `getSuppStreak` and builds a 14-entry array walking back from today (46405–46420). 4) Renders header (name, dose — timeOf — freq), two stat tiles (Day Streak in orange, "Last 14 Days" taken count in green), and a 7-column grid of 14 day cells with check or dot plus `MM-DD` labels (46421–46550).
- v6 status: PARTIAL

### F-SUPP-008 — Edit supplement
- location: Fuel > Supps > list > pencil button on a row
- user action: Taps the edit icon (46952).
- behaviour: 1) `openEdit(idx)` loads every field from `supps[idx]`, resolving custom times (46330–46350). 2) Same form as add; header reads "Edit Supplement"; submit reads "SAVE CHANGES" (46560, 46801). 3) `save()` replaces the entry in place, preserving `created` (46362–46368), and logs `supplement_edit`.
- v6 status: WORKING

### F-SUPP-009 — Delete supplement
- location: Fuel > Supps > list > trash button on a row
- user action: Taps trash; taps again to confirm.
- behaviour: 1) `remove(idx)` calls `lkConfirm("delSupp"+idx, "Tap again to remove <name>.")` (46384–46386); the first tap shows the message and returns false. 2) Second tap logs `supplement_delete` then filters the entry out and persists (46387–46396).
- v6 status: PARTIAL

### F-SUPP-010 — Home "SUPPLEMENTS DUE" reminder card
- location: Home tab > card stack > `supps` card
- user action: Reads the card; taps "Taken" next to a supplement.
- behaviour: 1) Home card registry maps `supps → SuppReminderCard` (26658–26661). 2) `getDueSupps()` computes the due list at mount (46186–46188): skips `reminder === false`, skips already-taken-today, applies Every-Other-Day (`floor(now/86400000) % 2`) and Weekly (`getDay() === 1`, i.e. Monday), then a **time window per timeOf**: Morning 05–12, Pre-Workout 12–18, With Food 11–14, Before Bed ≥19, anything else always due (46161–46184). 3) Returns null when nothing is due (46191) so the card self-hides. 4) Header 💊 "SUPPLEMENTS DUE"; each row shows name and "dose — timeOf" (46228–46255). 5) "Taken" button → `markSuppTaken`, removes the row from local `due`, logs `supplement_taken` (46192–46205).
- v6 status: PARTIAL

### F-SUPP-011 — Supplement push notifications
- location: (no UI in range) — driven from the pre-app IIFE and a server cron
- user action: Enables push elsewhere in the app; the toggle copy in this range promises it (46779).
- behaviour: 1) The bootstrap IIFE builds `dueSupps` by re-implementing the due rules against raw localStorage (1482–1499). 2) Each entry carries `{name, timeOf, win:[startHour,endHour]}`, sliced to 12 (1547). 3) Posted to the Worker at `API + "/push/..."` via `post()` (1556–1562); `API` defaults to `https://lockedapi.cescocugliari.workers.dev` (1305–1306). 4) The server cron decides when to fire; the client only supplies the due list and window.
- v6 status: UNVERIFIED
