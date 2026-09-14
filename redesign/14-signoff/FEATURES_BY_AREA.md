# LOCKED — Complete Feature Catalogue

All **541 features** found in the production build `redesign/input/locked-current-v6.html`, grouped by area.

Full per-field detail for every entry lives in `audit/agents/*.md`; the machine-readable form is `audit/features.json`.

**Status key:** WORKING · PARTIAL (works with caveats) · DEAD (never reached) · BROKEN · UNVERIFIED (server-side, unauditable from this repo)

---

## Home — 16 features

`WORKING 12`  `PARTIAL 2`  `UNVERIFIED 2`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-HOME-001 | Quick Actions row (3 configurable shortcuts) | Home tab > HomeScreen > `quick` layout block > 3-column butt | WORKING | reads `lk_homeLayout` (via getHomeLayout `:26066`); water action reads | none | hardcoded 250 ml increment (`:26150`) and hardcoded 1800 ms flash (`:26155`). Only "water" logs anything; ever |
| F-HOME-002 | Home header greeting, name and streak pill | Home tab > HomeScreen > header | WORKING | reads `lk_gamingLayer` (`:26483`) - Network / AI: none | — | streak is recomputed on every render (O(days) loop, unmemoized). `today` is captured at render time (`:26224`) |
| F-HOME-003 | Configurable home block layout (order + hide) | Home tab > HomeScreen > body | WORKING | reads `lk_homeLayout` (`:26066`) - Network / AI: none | — | `HOME_BLOCK_DEFS` (`:25995-26061`) lists ids including `cycletrack`; every def id has a matching `BLOCKS` entr |
| F-HOME-004 | Stats grid (4 tiles) | Home tab > `stats` block | WORKING | — | — | staggered `fadeUp` animation delay `i*0.06` (`:26576`). "PRs Logged" counts *exercises with PRs*, not PR entri |
| F-HOME-005 | Weekly aggregates (training days, volume, sets, cardio, consistency la | Home tab (feeds F-HOME-004 "This Week" and F-HOME-011 recap) | PARTIAL | — | — | week is hardcoded Sunday-start with no locale option (`:26251`). Cardio minutes never surface on Home. |
| F-HOME-006 | Proactive insight card | Home tab > `insight` block | UNVERIFIED | — | — | — |
| F-HOME-007 | Throwback card | Home tab > `throwback` block | WORKING | writes `lk_throwbackDismissed` (`:4662`) | — | `tbTick` is only ever incremented, never read — it exists purely as a re-render trigger (`:26223`, `:26606`).  |
| F-HOME-008 | Cycle tracking card (female users) | Home tab > `cycletrack` block | WORKING | — | — | — |
| F-HOME-009 | Dynamic feed / supplement reminder / running-low / cycle reminder bloc | Home tab > `feed`, `supps`, `restock`, `cycle` blocks | UNVERIFIED | — | — | — |
| F-HOME-010 | Start Workout / View Progress navigation buttons | Home tab > `start` and `progress` blocks | WORKING | — | — | `start` uses `var(--color-accent-deep)` plus a hardcoded `#9A3412` in the same gradient (`:26640`) — half them |
| F-HOME-011 | Weekly Recap screen | Home tab > `recap` block button → full-screen recap view | WORKING | reads `lk_gamingLayer` (`:26430`) - Network / AI: none | — | total volume is rounded to whole "k" (`:26394`) so any week under 500 units displays "0k". Recap uses `storedT |
| F-HOME-012 | Month calendar with workout markers | Home tab > `calendar` block | PARTIAL | — | — | `calKey` zero-pads correctly (`:26275`). Current month only. |
| F-HOME-013 | Recent Workouts list + "See all" | Home tab > `recent` block | WORKING | — | — | rows use `role="button"` + `tabIndex` on a div rather than a real button (`:26845-26847`). |
| F-HOME-014 | Workout detail (edit / delete / convert to split) from Home | Home tab > Recent Workouts > row → WorkoutDetail | WORKING | — | — | identity relies on `sameWorkout` (defined outside range); two identical sessions could collide. UNVERIFIED whe |
| F-HOME-015 | Auto-add due staples on Home mount | Home tab (invisible side effect) | WORKING | — | — | the in-code comment at `:26225-26226` states this exists so hiding the "Running Low" block does not silently d |
| F-HOME-016 | "Set up your first split" empty-state card | Home tab > below all layout blocks | WORKING | — | — | rendered outside the layout-block system, so it cannot be hidden or reordered. |

## Train — 100 features

`WORKING 73`  `PARTIAL 23`  `DEAD 3`  `BROKEN 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-TRAIN-001 | Exercise Library — muscle-group grid (root screen) | Train tab > Exercise Library > root screen | WORKING | none directly on this screen | none | Group count inconsistency above. `GROUPS` is a hardcoded literal at 2975 (outside range). |
| F-TRAIN-002 | Muscle-group screen — sub-group (muscle part) list | Train tab > Exercise Library > <Group> | WORKING | none (customs arrive as the `p.customs` prop) | none | none. |
| F-TRAIN-003 | Exercise list for a muscle part | Train tab > Exercise Library > <Group> > <Muscle part> | WORKING | none | none | `mergedSub` drops the custom exercise's `col`, so custom rows inherit the group colour — which is correct here |
| F-TRAIN-004 | Exercise row button (`ExBtn`) | any exercise list inside the library (search results and par | WORKING | none | none | **Performance bug** — `ExBtn` is a new function identity on every `ExLib` render (7798), so React unmounts/rem |
| F-TRAIN-005 | Exercise search | Train tab > Exercise Library > search field (root screen), a | WORKING | none (`ALL_EX` is built once at load, 4258–4289, and includes `lk_cust | none | The root screen's input and the results screen's input are two separate elements bound to the same state, so f |
| F-TRAIN-006 | Exercise detail sheet | Train tab > Exercise Library > any exercise row; also the li | WORKING | reads/writes `yt3_<exercise name>` in localStorage (raw key, no `lk_`  | `POST {WORKER_API}/yt-search`, body `{name, exId}`, response | `ExLib` renders the detail sheet *instead of* the list (`return` at 7855), not on top of it, so the library sc |
| F-TRAIN-007 | Per-exercise personal notes (autosaving) | Train tab > Exercise Library > exercise detail sheet > "MY N | WORKING | reads/writes `lk_exNotes` (a single object keyed by `String(exId)`) vi | none directly — `sd` is the app-wide persist path and the co | All notes live in one localStorage value, so a large note set is rewritten on every keystroke-debounce. |
| F-TRAIN-008 | Create Custom Exercise | Train tab > Exercise Library > root > "Create Custom Exercis | WORKING | none written here — persistence is the caller's `onCustom` (customs ar | none | Hardcoded equipment list duplicated from nothing else in the file. Back button not resetting `cEq` (7889–7896) |
| F-TRAIN-009 | Exercise action sheet (press-and-hold on a logging card) | Train tab > active workout log > press-and-hold an exercise  | WORKING | none | none | `armedId` never auto-disarms (unlike the global `lkConfirm` 7-second timer at 5179–5197) — two different confi |
| F-TRAIN-010 | Replace / swap exercise panel | Train tab > active workout > Swap action (rendered at 11418) | WORKING | none | none | Hardcoded caps of 6 and 8 results with no "show more". |
| F-TRAIN-011 | Throwback card (progress flashback) | Home / Progress surfaces (rendered at 16536, 26605, 28645) — | PARTIAL | none directly | none | `GR` (green) is used for the delta regardless of direction (4692). |
| F-TRAIN-012 | Decimal-safe number input (`DraftNum`) | shared primitive — used in set logging (17392, 17412) and re | WORKING | none | none | none. |
| F-TRAIN-013 | Icon primitive (`Ic`) and glyph table (`D`) | shared primitive, used everywhere in this range and app-wide | WORKING | none | none | **`IcMemo` (5255) is DEAD** — grep across all 58,015 lines finds exactly one occurrence, its own definition. T |
| F-TRAIN-014 | Loading spinner primitive | shared primitive | DEAD | — | — | The exercise detail sheet rolls its own "Finding a form video…" text (7351–7353) rather than using this. |
| F-TRAIN-015 | Form-video lookup and cache | backing service for F-TRAIN-006 | WORKING | writes/reads `yt3_<name>` **raw** localStorage keys (no `lk_` prefix,  | `POST https://lockedapi.cescocugliari.workers.dev/yt-search` | The comment at 7061 says the creator list "Mirrors the creator rotation in worker.js /yt-search — keep in sync |
| F-TRAIN-016 | ExerciseDB detail fetch (`ascendFetchDetail`) | n/a — no UI | DEAD | — | `GET https://lockedapi.cescocugliari.workers.dev/exercise-de | Almost certainly the intended source of instructions/secondary muscles for the detail sheet. The normaliser at |
| F-TRAIN-017 | Per-exercise equipment configuration (storage layer) | backing storage for the plate calculator / bar setup (UI out | WORKING | reads/writes `lk_exequip_<exerciseId>` — **one localStorage key per ex | — | Unbounded key growth (one key per exercise ever configured) against a shared localStorage quota. |
| F-TRAIN-018 | Plate / barbell maths (`BARS`, `calcPlatesPerSide`) | backing maths for the plate calculator (UI outside range) | WORKING | — | — | Every bar's `offset` is hardcoded `0`, so the Smith-machine counterbalance the create-exercise form talks abou |
| F-TRAIN-019 | Muscle recovery model & volume summary (data layer for Train surfaces) | backing model for recovery/physique surfaces (UI outside ran | WORKING | none (history passed in) - Network/AI: none | — | `EX_NAME_INDEX` is built once and never invalidated (4762–4771), so a custom exercise created after the first  |
| F-TRAIN-020 | Overlay / portal / scroll-lock infrastructure | shared primitive underlying every sheet in this range | WORKING | — | — | `ExerciseActionSheet` **also** calls `lkLockScroll` explicitly (7531) on top of the observer's lock — harmless |
| F-TRAIN-021 | Dialog focus trap, Escape stack, and two-tap confirm | shared primitives for every dialog in this range | WORKING | — | — | `lkKeyActivate` (5227) and `lkTrapTab` are used from outside this range only. |
| F-TRAIN-022 | Workout identity helpers (`withWorkoutIds`, `sameWorkout`) | data layer for history edit/delete | WORKING | writes `lk_history` (5209) - Network/AI: none | — | The write at 5209 is inside a bare `try{}catch(e){}`, so a quota failure means the ids are re-derived every lo |
| F-TRAIN-023 | Cardio activity catalogue and field schema (constants only) | data layer for the Cardio logging surfaces (UI outside this  | WORKING | none directly - Network/AI: none | — | **Two parallel cardio catalogues coexist** — `CARDIO_TYPES` (v1, 8 entries) and `CARDIO_ACTIVITIES` (v2, 41 en |
| F-TRAIN-024 | Cardio calorie engine (5-tier estimator) | data layer behind cardio calorie displays (UI outside range) | WORKING | `cardioPrefs`/`saveCardioPrefs` read/write `lk_cardioPrefs` (5646–5658 | — | `ceKeytelKcalPerMin` is explicitly "Unused today, kept for when straps land" (6349); tier 3 is therefore unrea |
| F-TRAIN-025 | Cardio v1 → v2 migration (runs on load) | app boot | WORKING | reads/writes `lk_history`; writes `lk_cardioMigrated` - Network/AI: no | — | The unconditional flag-set is a real latent bug for synced accounts. |
| F-TRAIN-026 | Cardio-vs-lifting accounting guards | data layer read by every history/volume surface | WORKING | — | — | These three helpers are described as "the only way volume and set counts should ever be read off a history row |
| F-TRAIN-027 | Bottom tab bar (`Nav`) | global chrome (component body falls inside this range at 765 | WORKING | — | — | Out of scope for the exercise library but physically inside this range; flagged so no one double-counts it. `G |
| F-TRAIN-100 | Replace exercise (search alternatives) | Train > Workout Log > exercise card > hold > "Swap exercise" | WORKING | none directly (the replacing `mkRow` reads `p.history` in memory) | none | **Data loss** — replacing discards all sets already logged on that row because `mkRow` builds a fresh row (v6. |
| F-TRAIN-101 | Split builder — name a split | Train > Splits > New Split / Edit Split > name input | WORKING | written by the parent via `p.setSplits` (v6.html:15045-15050); persist | none in range | — |
| F-TRAIN-102 | Split builder — add / rename / remove day | Train > Splits > builder > "Add a new day" card and day head | WORKING | none until SAVE | none | deleting a day with exercises in it is irreversible and unguarded (v6.html:9139). |
| F-TRAIN-103 | Split builder — add exercise to a day | Train > Splits > builder > day card > "+ Exercise" | WORKING | custom exercises via `p.onCustom` (passed through, v6.html:9227) | — | — |
| F-TRAIN-104 | Split builder — add a note "Block" to a day | Train > Splits > builder > day card > "📝 Block" | WORKING | — | — | `duration` is a free-text string, never parsed or validated anywhere in range (v6.html:9660-9679). |
| F-TRAIN-105 | Split builder — drag to reorder items within a day | Train > Splits > builder > day card > grab handle (3 bars) o | PARTIAL | none | — | dead locals `dragTarget`, `dragY`, `dragItem` (v6.html:9232-9236) and `isDraggingThis`/`spacer` hardcoded `fal |
| F-TRAIN-106 | Split builder — save split | Train > Splits > builder > SAVE SPLIT | WORKING | `lk_splits` (written by parent, outside range) | — | `save()` returns silently on an invalid state (v6.html:9189) — the disabled button is the only feedback. **Ord |
| F-TRAIN-107 | Number pad (weight / reps entry) | Train > Workout Log > any weight / reps / L / R cell | WORKING | indirectly `lk_activeWorkoutRows` via the rows effect (v6.html:10659-1 | — | `isWeight` is decided by string-comparing the label to `"Weight"` (v6.html:9849) — a fragile coupling; "Left R |
| F-TRAIN-108 | Start / resume an active workout session | Train > Workout Log (screen) | PARTIAL | reads/writes `lk_activeWorkoutRows`, `lk_activeWorkoutSec`; parent als | none | elapsed time is wall-clock based, so it keeps counting while the app is backgrounded (intended). `secRef` is u |
| F-TRAIN-109 | Auto-prefill from last session ("LAST" row / rec values) | Train > Workout Log > exercise card > set rows and the LAST  | WORKING | reads `p.history` (from `lk_history`) | — | matching is by **exercise name string**, not id (v6.html:10029) — a renamed custom exercise loses its history. |
| F-TRAIN-110 | "Last done" stale badge | Train > Workout Log > exercise card header | WORKING | — | — | hardcoded 31 days (v6.html:10050). The dual date format (locale string vs ISO) is acknowledged in the comment  |
| F-TRAIN-111 | Log a set — weight, reps, RIR | Train > Workout Log > exercise card > set row (grid `# \| KG | WORKING | `lk_activeWorkoutRows` | — | the RIR `<select>` for the normal path offers `"5+"` (v6.html:13681) but the superset path offers only `0-4` ( |
| F-TRAIN-112 | Mark a set done (✓) — with haptics, pop animation, PR check and rest s | Train > Workout Log > exercise card > ✓ button on a set row | WORKING | `lk_activeWorkoutRows`; PRs persisted by the parent (`lk_prs`, outside | — | un-ticking a PR set does **not** roll the PR back (v6.html:10763). Hardcoded 3500 ms PR banner, 400 ms anim, 3 |
| F-TRAIN-113 | Add a set / remove a set | Train > Workout Log > exercise card > "+ Add Set"; swipe-lef | PARTIAL | — | — | swipe-to-delete is touch-only and has no undo and no confirm. |
| F-TRAIN-114 | Cycle set type: Normal → Warm-up → Drop | Train > Workout Log > exercise card > the set-number button  | WORKING | — | — | hardcoded 0.75 drop factor and 2.5 rounding increment (v6.html:10232) — the 2.5 step is wrong for a lb-configu |
| F-TRAIN-115 | Add warm-up sets automatically | Train > Workout Log > exercise card > hold > "Add warm-up se | WORKING | — | — | hardcoded 0.5/0.7 percentages, 8/5 reps, RIR 4/3, 2.5 rounding (v6.html:10161-10186). Repeated taps stack more |
| F-TRAIN-116 | Partials counter | Train > Workout Log > exercise card > below a non-warm-up se | WORKING | reads `lk_hidePartials` (toggled elsewhere at v6.html:32996) | — | partials are **not** used in the volume calc (v6.html:10700-10706) or in the PR check (v6.html:10763). `ld()`  |
| F-TRAIN-117 | Unilateral mode (track left & right) | Train > Workout Log > exercise card > hold > "Track left & r | PARTIAL | — | — | `mkRow` always initialises `unilateral:false` (v6.html:10112) so the setting is not remembered between session |
| F-TRAIN-118 | Per-row unit override (kg ⇄ lb for one exercise) | Train > Workout Log > exercise card > hold > "Switch to lbs" | PARTIAL | — | — | the header total volume is always shown in the global unit (v6.html:12046-12048), which mixes rows logged in d |
| F-TRAIN-119 | Superset (link two exercises A/B) | Train > Workout Log > exercise card > hold > "Make it a supe | PARTIAL | — | — | only pairs are supported (`ssRows[1]`, v6.html:12308) — a third row carrying the same id would render nothing. |
| F-TRAIN-120 | PR detection during a session + ALL-TIME PR banner | Train > Workout Log > full-width orange banner at the top | PARTIAL | PRs persisted by the app shell (`lk_prs`, outside range) | — | the banner's weight uses `kgToDisp(s.w, useKg)` (the raw stored value), while the stored PR is normalised to k |
| F-TRAIN-121 | Rest timer — automatic start after a set | Train > Workout Log > pinned rest banner at the top | WORKING | reads/writes `lk_activeWorkoutRestTarget`; reads/writes `lk_restEnable | `window.LOCKEDPush.scheduleRest` / `cancelRest` / `playAlert | `retargetRest` re-targets an in-flight rest rather than restarting it (documented at v6.html:10656-10662) — go |
| F-TRAIN-122 | Rest timer settings sheet (on/off + duration presets) | Train > Workout Log > header > Tools (⚡) > "Rest Timer" | WORKING | `lk_restEnabled`, `lk_activeWorkoutRestTarget` | — | `pickRest` already persists the target (v6.html:10679), so v6.html:11549 is a duplicated write. The preset lab |
| F-TRAIN-123 | Custom rest duration (m + s) | Train > Workout Log > rest banner > "Custom" | WORKING | — | — | the Custom control only exists inside the *active* rest banner, so a custom length cannot be set before the fi |
| F-TRAIN-124 | Hold-to-open exercise action sheet | Train > Workout Log > anywhere on an exercise or superset ca | WORKING | `lk_holdTipSeen` | — | seven actions: Info & notes, Swap exercise, unit switch, Add warm-up sets, superset toggle, unilateral toggle, |
| F-TRAIN-125 | Drag to reorder exercises ("wiggle mode") | Train > Workout Log > exercise/block card > 3-bar drag handl | PARTIAL | — | — | the two drag systems (this one and `sbLongStart` in `SplitBuilder`) are near-identical duplicated logic ~250 l |
| F-TRAIN-126 | Add exercise mid-workout | Train > Workout Log > footer > "+ Add Exercise" | WORKING | — | — | — |
| F-TRAIN-127 | Add a Block (note / timed section) mid-workout | Train > Workout Log > footer > "+ Block" → bottom sheet | PARTIAL | `lk_activeWorkoutRows` | — | `blockModal.mode: "create"` is set (v6.html:13687) but never read — no edit mode exists. Blocks contribute not |
| F-TRAIN-128 | AI next-set recommendation ("AI Rec") | Train > Workout Log > exercise card > "AI Rec" button beside | WORKING | — | `POST https://lockedapi.cescocugliari.workers.dev/` (v6.html | **The recommended weight is written raw via `setVal(..., "w", w)`, which runs `dispToKg(w, rowUsesKg(ri))`** ( |
| F-TRAIN-129 | Session header — elapsed time, set count, total volume | Train > Workout Log > sticky header | PARTIAL | — | — | mixed-unit rows (F-TRAIN-118) are summed without per-row conversion. |
| F-TRAIN-130 | Tools menu (⚡): rest timer, plate calculator, global unit switch | Train > Workout Log > header > ⚡ button | PARTIAL | — | — | `PlateCalc` receives `rows` and `setRows` (v6.html:11436-11438), so it can write weights back into the session |
| F-TRAIN-131 | Discard workout (double-tap confirm) | Train > Workout Log > header > "Discard" | WORKING | — | — | — |
| F-TRAIN-132 | Finish workout | Train > Workout Log > header > "Finish" | WORKING | — | — | **no confirmation** — a mis-tap on Finish ends the session (contrast with Discard's double-tap). Sets that are |
| F-TRAIN-133 | Idle "Still training?" prompt (30 min) + push notification | Train > Workout Log > full-screen modal | PARTIAL | — | `window.LOCKEDPush.scheduleIdleCheck` / `cancelIdleCheck` (o | the comment at v6.html:10551-10555 documents that this used to end sessions silently. |
| F-TRAIN-134 | Exercise info & notes sheet | Train > Workout Log > hold a card > "Info & notes" | WORKING | — | — | — |
| F-TRAIN-135 | Empty workout state | Train > Workout Log > body | WORKING | — | — | — |
| F-TRAIN-136 | Base-resistance badge (`startResist`) | Train > Workout Log > exercise card subtitle | PARTIAL | — | — | — |
| F-TRAIN-300 | Train tab shell: header, Cardio + Quick Start, sub-tabs | Train tab > TrainHub main view > header block | WORKING | reads/writes `ui_trainTab`, `ui_trainView` (via `useHubState`, 2121–21 | none | The Library tab is a view-switch, not a tab — so the tab underline never highlights "Library" while `ExLib` is |
| F-TRAIN-301 | Recent workouts quick-restart strip | Train tab > My Splits sub-tab > "RECENT" horizontal strip | WORKING | none directly | none | `overscrollBehaviorX: "contain"` + `WebkitOverflowScrolling` on the scroller (15410–15412). |
| F-TRAIN-302 | My Splits empty state (Build Manually / AI Split Builder) | Train tab > My Splits > empty state | WORKING | `ui_trainView` - Network / AI: none here | — | — |
| F-TRAIN-303 | Split card list (expand, day list, Start / Edit / Delete) | Train tab > My Splits > split cards | WORKING | reads + writes `splitsExpanded` (15016, 15019) - Network / AI: none | — | The maxHeight heuristic is a hardcoded row-height estimate (78 px header + 34 px per exercise, ×1.4 slack) — a |
| F-TRAIN-304 | Day picker bottom sheet (choose a day to start) | Train tab > My Splits > split card footer "Start" > bottom s | WORKING | none - Network / AI: none | — | — |
| F-TRAIN-305 | History list | Train tab > History sub-tab | WORKING | none directly (history comes in as a prop from the app root, 57623) -  | — | — |
| F-TRAIN-306 | Exercise Library (inline + full-screen) | Train tab > Library sub-tab | PARTIAL | `ui_trainView` | — | — |
| F-TRAIN-307 | Adaptive Training card (muscle recovery readout) | Train tab > My Splits sub-tab > bottom card | WORKING | none directly - Network / AI: none — the "suggestion" is rule-based, n | — | `Pill` and `Section` are re-declared on every render of the card — new function identities each pass; harmless |
| F-TRAIN-308 | AI Split Builder — mode picker | Train tab > My Splits > "AI Builder" (or empty-state "AI Spl | WORKING | — | — | — |
| F-TRAIN-309 | AI Split Builder — conversational chat + program generation | Train tab > AI Split Builder > chat screen | WORKING | none written by this screen; the saved splits are persisted by the app | POST `https://lockedapi.cescocugliari.workers.dev/` — see "# | The exercise-ID whitelist in `getGenSys` is hardcoded into the prompt string (13983) — it will drift from `ALL |
| F-TRAIN-310 | AI Split Builder — Import from Photo / describe your split | Train tab > AI Split Builder > "Import from Photo" | BROKEN | none | POST to the Worker — see "## AI calls" #2 | The picker card advertises "Upload a screenshot ... AI converts it" (14310, 14458–14466) — copy that the imple |
| F-TRAIN-311 | Post-workout Review — Summary step | Review screen (`screen === "review"`, replaces the tab bar)  | WORKING | none written at this step | — | Warmup sets count toward neither sets nor volume, but the per-exercise card at 16251 counts *all* done sets in |
| F-TRAIN-312 | Post-workout Review — Reflection step (5 ratings) | Review > step "reflect" | WORKING | none at this step; ratings land in the saved workout as `reflection` ( | — | — |
| F-TRAIN-313 | Post-workout Review — AI Coach insight step | Review > step "ai" | WORKING | reads `profile`, `coachInstructions`, `coachStyle` (via `coachStyle()` | — | — |
| F-TRAIN-314 | Post-workout Throwback card (1-in-5) | Review > step "ai" > below the insight card | WORKING | reads `throwbackDismissed`, `lk_throwbackForce` (raw localStorage, 460 | — | In-code comment names this "v4 spec: post-workout throwback triggers 1-in-5" (15972). Because it is computed i |
| F-TRAIN-315 | Save workout (Review → history record) | Review > any step > save buttons | WORKING | written by the app root's `saveWorkout` (57592, outside range) | — | `vol` and `dur` are persisted as *display strings* ("1234 kg", "45 min"), not numbers — every consumer has to  |
| F-TRAIN-316 | Workout detail — read view | Train tab > History > tap a workout | WORKING | history is written through the app root; `lkConfirm` uses an in-memory | — | — |
| F-TRAIN-317 | Workout detail — edit mode | Workout detail > "Edit" | PARTIAL | history written via the app root | — | `partials` is preserved by `saveEdit` (17185) but there is no input for it in the editor grid, and the re-seed |
| F-TRAIN-318 | Convert workout to split | Workout detail > "Convert" > bottom sheet | PARTIAL | splits written via the app root - Network / AI: none | — | — |
| F-TRAIN-319 | Proactive Tip card ("💡 TODAY'S INSIGHT") | Home tab (rendered by the dashboard's `insight` block, 26595 | WORKING | reads `proactiveTip`, `profile`, `fuelLog`, `fuelProfile`, budget data | — | Because there is no `d.gated` check, a gated Worker response whose `content[0].text` is the upsell string ("Da |
| F-TRAIN-320 | Dynamic Feed ("YOUR FEED" cards) | Home tab (rendered by the dashboard's `feed` block, 26623–26 | PARTIAL | reads `feedback` - Network / AI: none (all rules are local) | — | The `nextSplitDay` lookup compares `split.days[i].name === lastW.name` (18048). Workouts started from a split  |
| F-TRAIN-500 | Progress hub tab bar (Overview / Goals / Calendar / Photos / PR Vault) | Progress tab > PROGRESS screen > pill tab row | WORKING | reads/writes `lk_ui_progressTab` | none | the five-pill bar disappears entirely on the PR Vault tab (28438 returns early) — an inconsistent navigation m |
| F-TRAIN-501 | Throwback card (1-in-4 roll on Progress load) | Progress > Overview > top card | WORKING | reads `lk_throwbackForce` (raw localStorage, 4604); writes `lk_throwba | — | dev backdoor key is documented in a comment at 4600–4602. |
| F-TRAIN-502 | Featured Lifts — Day 1 vs Current PR cards | Progress > Overview > "FEATURED LIFTS" | PARTIAL | `lk_featuredLifts` (r/w) | — | `getFirstLogged` calls `getEx(exId)` inside the inner loop (28356) — O(history × exercises) lookups, hoistable |
| F-TRAIN-503 | Add Featured Lift search screen | Progress > Overview > "ADD LIFT" button > full-screen picker | WORKING | writes `lk_featuredLifts` on selection | — | hardcoded `.slice(0, 20)`; no custom-exercise source beyond whatever `ALL_EX` contains; no duplicate/limit cap |
| F-TRAIN-504 | Body weight trend chart (SVG line, last 30 entries) | Progress > Overview > "BODY WEIGHT" | PARTIAL | reads `lk_weightLog` | — | no y-axis labels, no gridlines, no time-range selector, no tooltips. Axis labels use the raw stored `.date` st |
| F-TRAIN-505 | Training calendar (month grid with per-day dots) | Progress > Calendar | WORKING | reads `lk_weightLog`, `lk_progressPhotos`, plus `prs`/`history` props | — | `weighInDates[d] = e.kg` keeps only the last weigh-in per day. No tap handler on a day — the calendar is displ |
| F-TRAIN-506 | Goals tab passthrough | Progress > Goals | WORKING | — | — | — |
| F-TRAIN-507 | Photos tab passthrough | Progress > Photos | WORKING | — | — | `ProgressPage` reads `lk_progressPhotos` itself for calendar dots (28340) while `ProgressPhotos` owns the data |
| F-TRAIN-508 | PR Vault list (search, compound-first sort, three-number tiles) | Progress > PR Vault (PRHub `tab === "prs"`) | WORKING | PR data comes in as the `p.prs` prop (persisted by the parent under `l | — | the rep-range labels are driven by `PR_WORK_LO/HI = 6/8` (4490) — a hardcoded working range with no user setti |
| F-TRAIN-509 | PR detail — three summary cards (1RM / Working / Estimated) | PR Vault > exercise detail (top) | WORKING | — | — | `prLabel` degrades gracefully for legacy non-date values by echoing the raw string (4553–4555). |
| F-TRAIN-510 | Est-1RM progression chart with 30D / 90D / ALL range filter | PR Vault > exercise detail > "PROGRESSION — EST. 1RM" | PARTIAL | none directly (props) | — | no y-axis, no tooltips, no point labels; PR-vs-session distinction is conveyed by dot radius only (no legend). |
| F-TRAIN-511 | Strength profile bar chart (est. 1RM per rep record) | PR Vault > exercise detail > "STRENGTH PROFILE — EST. 1RM" | PARTIAL | — | — | bar values are printed in **stored units** with no `kgToDisp` conversion (29658–29666) — an lb user sees kg nu |
| F-TRAIN-512 | Log a PR without a workout (manual PR entry) | PR Vault > "LOG A PR WITHOUT A WORKOUT" button, or detail >  | WORKING | writes via `p.setPrs` (persisted as `lk_prs` by the parent) | none. AI: none. | the preview at 29377 uses the inline Epley formula, so it shows a 1-rep entry inflated by 3.3% relative to wha |
| F-TRAIN-513 | PR Vault header / back navigation | PR Vault header | PARTIAL | — | — | `PRHub` is referenced exactly once in the file (28438) — see F-TRAIN-514. |
| F-TRAIN-514 | PRHub "Overview" tab — stats grid, Last 7 Days, Top PRs (DEAD) | PRHub `tab === "overview"` (29780–29966) - Behavior (were it | DEAD | — | — | — |

## Cardio — 26 features

`WORKING 22`  `PARTIAL 4`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-CARDIO-001 | Cardio section shell with three tabs | Train > CARDIO screen > header + tab bar | WORKING | reads `lk_cardioFavorites` via `cardioFavorites()` (56218, 56282; 5821 | none. | `paddingBottom: 24` with a comment about the floating voice button (56232-56234). Container is `minHeight: "10 |
| F-CARDIO-002 | Favorites list (empty state) | Cardio > Favorites tab | WORKING | reads `lk_cardioFavorites` - Network / AI: none | — | `var prefs = cardioPrefs();` (55555) is computed and **never used** anywhere in the component — dead call that |
| F-CARDIO-003 | Favorites — quick chips (one-tap re-log) | Cardio > Favorites > horizontal chip row | WORKING | reads `lk_cardioFavorites` | — | `WebkitOverflowScrolling: "touch"` is declared **twice** in the same style object (55654, 55656) — harmless du |
| F-CARDIO-004 | Favorites — full list rows | Cardio > Favorites > card list | WORKING | writes `lk_cardioFavorites` via `saveCardioFavorites` (5825-5827) | — | the inner name block gets `role="button"` / `tabIndex` / `lkKeyActivate` only when NOT editing, with an explic |
| F-CARDIO-005 | Favorites — edit mode (reorder, rename, delete) | Cardio > Favorites > "Edit" in the section header | WORKING | writes `lk_cardioFavorites` on every reorder/rename/delete | — | chip row and the "Log something else" button are hidden in edit mode (55651, 55773). |
| F-CARDIO-006 | History — empty state | Cardio > History | WORKING | — | — | — |
| F-CARDIO-007 | History — group filter chips | Cardio > History > chip row | WORKING | — | — | — |
| F-CARDIO-008 | History — "this week" stat row | Cardio > History > three stat cards | WORKING | — | — | — |
| F-CARDIO-009 | History — 8-week minutes bar chart | Cardio > History > "MINUTES PER WEEK" card | WORKING | — | — | `today` param of `cardioWeekBuckets` exists for testability but is never passed by the UI (55811, 55954). |
| F-CARDIO-010 | History — personal bests strip | Cardio > History > "PERSONAL BESTS" horizontal cards | WORKING | — | — | PBs are computed over `shown`, so a filter chip changes what "personal best" means. Sub-line uses `w.date` (th |
| F-CARDIO-011 | History — time in heart-rate zone | Cardio > History > "TIME IN ZONE" card | WORKING | — | — | `cardioZoneTime` calls `cardioZones()` with no model argument, so the user's `lk_cardioPrefs.zoneModel === "3z |
| F-CARDIO-012 | History — session list and expandable detail | Cardio > History > session cards | WORKING | — | — | rows are keyed by array index and `openIdx` is an index, so the open card can jump if `shown` changes; changin |
| F-CARDIO-013 | Log flow — step 1: pick an activity | Cardio > Log > "What did you do?" | WORKING | reads/writes `lk_cardioFavorites` via `isCardioFav`/`toggleCardioFav`  | — | (a) `p.embedded` is true inside `CardioSection`, so step 1 renders **no back button** (56509); the section hea |
| F-CARDIO-014 | Log flow — step 2: which machine | Cardio > Log > "Which <category>?" | PARTIAL | — | — | `machine.model` is written into every saved record as `null` (via `machine`, 56435) yet the data model and the |
| F-CARDIO-015 | Log flow — step 3: the form (duration, distance, engine fields, surfac | Cardio > Log > activity form (the default render, 56761-5692 | WORKING | `lk_cardioFavorites` (star); body profile reads `lk_fuelProfile` and ` | — | (a) `mapping` is computed at 56695 but `ceActivityMap(activity.id)` is called a second time at 56702 for `rpeC |
| F-CARDIO-016 | Log flow — live calorie estimate card | Cardio > Log > form, directly under the hero | WORKING | — | — | `ceEstimateCard` and `ceImproveHint` live at 57078/57142, i.e. **outside** the stated 55510-57185 boundary is  |
| F-CARDIO-017 | Animated calorie counter (CeCount) | inside the estimate card, hero number | WORKING | — | — | — |
| F-CARDIO-018 | Estimate-quality tier meter (CeTierMeter) | estimate card, top-right | WORKING | — | — | — |
| F-CARDIO-019 | Save a cardio session | Cardio > Log > "Save session" | WORKING | indirect — `App`'s `setHistory` persists to `lk_history` (UNVERIFIED a | — | an explicit comment records that `vol` and `sets` are deliberately omitted because writing them made strength  |
| F-CARDIO-020 | Unit conversion on the way into the engine (`draft`) | internal to `CardioLogFlow` - Behavior (56399-56412): 1. `du | WORKING | — | — | the converted values are written into the record's `metrics` (56436 uses `d.metrics`), so **stored metrics are |
| F-CARDIO-021 | Log flow — step 4: the summary ("Logged") | Cardio > Log > post-save screen | WORKING | — | — | The source defines this block **before** step 3 (comment "step 4: the summary" at 56651, "step 3: the form" at |
| F-CARDIO-022 | Derived summary stats (`ceSummaryStats`) | summary screen, card below the estimate - Behavior (57149-57 | WORKING | — | — | unlike `detailRows` (55993-55995), the Split branch here has **no ≥500 m floor**, so a 50 m erg piece produces |
| F-CARDIO-023 | Favourite creation / toggling (star) | everywhere a `CardioStar` appears — activity tiles, form her | PARTIAL | — | — | `favShape()` (56418-56425) stores only `{durationSec, surface}` in `defaults` — never `metrics` — even though  |
| F-CARDIO-024 | Preset (favourite) prefill of the log flow | Cardio > Favorites > tap a favourite → Log | PARTIAL | — | — | — |
| F-CARDIO-025 | Custom cardio activities ("Yours" group) | Cardio > Log > step 1, "YOURS" group | PARTIAL | — | — | a custom activity's `met` is carried onto the pool item but `ceActivityMap(id)` will not find its id and falls |
| F-CARDIO-026 | Calorie estimation (consumption of the CARDIO v2 engine) | form live estimate and save | WORKING | — | — | `cardioEstimate` never throws (it wraps `ceEstimateCalories` in try/catch and falls back to a MET-6.0 tier-5 r |

## Fuel — 73 features

`WORKING 33`  `PARTIAL 28`  `DEAD 7`  `UNSPECIFIED 5`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-FUEL-001 | "More nutrition" expandable micronutrient panel | Fuel tab > (intended) day summary card > "MORE NUTRITION" di | DEAD | reads `fuelProfile`. Writes: none. | none. AI: none. | `nutrientTargets` mixes evidence-based DRIs with hardcoded fallbacks (`cal \|\| 2200`, L18762). The `type` fie |
| F-FUEL-002 | Nutrition Trends tab (range toggle + three charts) | Fuel tab > "trends" sub-tab (mounted at L37450–37454) | WORKING | none directly — data arrives as props from `FuelTab`. | none. AI: none. | The 30-day bar chart is 430 SVG units wide squeezed into `width:"100%"` with no scroll container — bars become |
| F-FUEL-003 | Recipe log sheet (bottom sheet: servings, meal slot, log) | Recipes context > tap a recipe > bottom sheet modal | DEAD | none directly (writing is `addItem`'s job, defined in `FuelTab`). - Ne | — | The macro preview and the `log()` function each round independently, so the tile shown and the value logged us |
| F-FUEL-004 | Recipe builder (create a user recipe) | Recipes context > "NEW RECIPE" card | DEAD | reads `myGroceries`, `favFoods`, `userRecipes`; writes `userRecipes`.  | — | `pickerResults()` runs on every render (not memoised) and scans the entire `FOODS` array. Manual macros use `p |
| F-FUEL-005 | Quick-log food chip (tap to log, long-press to favourite) | Fuel tab > quick-add chip row | DEAD | `toggleFav` reads/writes `lk_favFoods` and dispatches `lockedFuelUpdat | — | `getRecentFoods` (L18852) and `getFrequentFoods` (L18878), which exist solely to feed a chip row, are likewise |
| F-FUEL-006 | Barcode scanning — idle / entry screen | Fuel tab > "scan" sub-tab, `mode === "idle"` or `"manual"` | WORKING | none at this stage. | none until lookup. | `mode === "manual"` renders the same tree as idle, differing only by the heading string — the camera card with |
| F-FUEL-007 | Live camera barcode scanning (BarcodeDetector, ZXing fallback) | Fuel tab > scan sub-tab, `mode === "scanning"` | PARTIAL | — | GET `https://unpkg.com/@zxing/library@0.21.3/umd/index.min.j | ZXing is loaded from **unpkg**, a third-party CDN pinned to 0.21.3, with no SRI hash (L19082) — a supply-chain |
| F-FUEL-008 | Barcode product found — portion, meal, log | Fuel tab > scan sub-tab, `mode === "found"` | WORKING | writes `myGroceries` (L21012–21027); reads it too. `addItem` (in `Fuel | see "External food APIs". | The USDA branch has no attribution line — only OFF does (L21380). Rounding for the logged macros is to whole n |
| F-FUEL-009 | Barcode not found — manual label entry | Fuel tab > scan sub-tab, `mode === "notfound"` | PARTIAL | writes `myGroceries`; `addItem` writes `fuelLog`. - Network / AI: none | — | This is a real data-integrity bug: a "per serving" entry becomes a "per 100 g" record on the next scan. `parse |
| F-FUEL-010 | Barcode logged confirmation | Fuel tab > scan sub-tab, `mode === "logged"` | UNSPECIFIED | — | — | none. |
| F-FUEL-011 | Barcode loading state | Fuel tab > scan sub-tab, `mode === "loading"` | UNSPECIFIED | — | — | offline behaviour is a rejected `fetch` → caught → `null` → the "not found" manual-entry screen, which mislead |
| F-FUEL-012 | Fuel display settings card (hide numbers, dashboard framing) | Settings tab > below the weight-unit card, above "DATA & SYN | WORKING | reads/writes `lk_fuelSettings` (fields `waterGoalMl`, `hideNumbers`, ` | — | the toggle is a hand-rolled div-slider, not a native control; keyboard activation works only because it is a ` |
| F-FUEL-013 | Privacy disclosure card | Settings tab > "DATA & SYNC" section (mounted L33110) | UNSPECIFIED | — | — | The "AI features" paragraph enumerates meal photos, descriptions, voice recordings, receipt photos, physique p |
| F-FUEL-014 | Adaptive TDEE weekly check-in card | Fuel tab > main view, below the weight-log card (mounted L37 | WORKING | reads `tdeeHistory`, `fuelProfile`, `fuelSettings`; `applyAdaptiveTDEE | — | `applyAdaptiveTDEE` silently rewrites the user's protein/carb/fat targets alongside calories (L19292–19298) bu |
| F-FUEL-015 | Nutrition CSV / JSON export and full-account backup/restore | Settings tab > data section (CSV export mounted L33138; full | UNSPECIFIED | — | — | CSV micronutrients are limited to fiber/sugar/satfat/sodium even though the model carries nine more. |
| F-FUEL-016 | Natural-language food text parsing (AI) → local food matching | intended for the Fuel search / voice logging path | DEAD | — | via `aiCall` (L2663, outside range). | `matchTupleLocal` hardcodes 100 g for any fav/grocery match, so "3 scoops whey" from a saved item logs one 100 |
| F-FUEL-017 | AI meal-item normalisation | photo/voice meal-analysis result path | DEAD | — | — | `nameSimilarity` (token-overlap ratio ignoring words ≤2 chars, L19326–19341) looks like the dedupe scorer an A |
| F-FUEL-018 | Pantry depletion on logging + expiry heuristics | intended side-effect of logging a food item | DEAD | reads/writes pantry via `getPantry`/`savePantry` (L43415, outside rang | — | the "1 logged item = 1 serving = ¼ of a unit" model (L19541–19544) is an unqualified guess and would misreport |
| F-FUEL-019 | Weight-trend and intake statistics helpers | model layer feeding F-FUEL-002 and F-FUEL-014 | WORKING | — | — | `weeklyRatePct` divides by `prev.trend` without a zero guard (L19128). |
| F-FUEL-020 | Fuel micro-helpers (slots, favourites, training day, water goal) | model layer - Behavior / status, one line each: - `slotForNo | UNSPECIFIED | — | — | `_chipCache` (L18845) is a module-level mutable singleton keyed on object identity; it is never invalidated by |
| F-FUEL-200 | Fuel tab shell / header | Fuel tab > main view > header block | WORKING | reads `fuelSettings` (18650) | none | The two comment blocks at 36896–36903 and 37136–37139 are developer commentary retained in production output. |
| F-FUEL-201 | Fuel sub-tab navigation (Log / Meals toggle + pill row) | Fuel tab > main view > tab strip below the macro card | WORKING | reads/writes `ui_fuelTab` and `ui_fuelView` via `useHubState` → `ld`/` | none | A persisted `tab === "cycle"` survives `useHubState` validation even with `perfTracking` off, since `"cycle"`  |
| F-FUEL-202 | Calorie / macro summary card (MacroRing + macro bars) | Fuel tab > main view > summary card directly under header | PARTIAL | reads `fuelLog` (36910) | none | Verify `fmtQ` (4349–4354) return type. Bar-width math `m.val / m.target` at 37287 uses the same possibly-strin |
| F-FUEL-203 | MacroRing SVG progress ring | reusable — Fuel summary card (and any caller) | WORKING | none | none | hardcoded `3.14159` (35767); no low-end clamp; no `viewBox`. |
| F-FUEL-204 | Fuel Profile Setup — open / back / save | Fuel tab > header "My Profile" button > full-screen Fuel Pro | WORKING | writes `fuelProfile` via `sd` in `setFuelProfile` (36927) | none | The `view` state is persisted (`ui_fuelView`, 36906), so a user who left the app on the profile screen re-ente |
| F-FUEL-205 | Fuel Profile — body weight input + unit toggle | Fuel Profile screen > BODY WEIGHT section | PARTIAL | persisted inside `fuelProfile` as `weightVal`, `weightUnit`, `weightKg | — | Unit-switch data loss is a real bug for the redesign to fix. |
| F-FUEL-206 | Fuel Profile — height input (ft/in or cm) | Fuel Profile screen > HEIGHT section | PARTIAL | `fuelProfile` fields above - Network / AI: none | — | Note the odd key name mismatch: the raw cm string is stored as `heightCmRaw` while the seed reads `fp.heightCm |
| F-FUEL-207 | Fuel Profile — age and sex | Fuel Profile screen > AGE / SEX row | WORKING | `fuelProfile.age`, `fuelProfile.sex` (35841–35842) - Network / AI: non | — | Default `"male"` is applied silently even if the user never touches the control (35803). |
| F-FUEL-208 | Fuel Profile — activity level picker | Fuel Profile screen > ACTIVITY LEVEL | WORKING | `fuelProfile.activityLevel` (35843) - Network / AI: none | — | — |
| F-FUEL-209 | Fuel Profile — goal picker (Cut / Maintain / Bulk) | Fuel Profile screen > GOAL | WORKING | `fuelProfile.goal` (35844) - Network / AI: none | — | — |
| F-FUEL-210 | Fuel Profile — Auto vs Custom macros | Fuel Profile screen > MACROS section | WORKING | `fuelProfile.useCustomMacros/customCal/customPro/customCarb/customFat` | — | `useCustomMacros: true` also **disables adaptive TDEE** entirely (`applyAdaptiveTDEE` returns null at 19262) — |
| F-FUEL-211 | Fuel Profile — dietary preferences chips | Fuel Profile screen > DIETARY PREFERENCES | WORKING | `fuelProfile.preferences` (35845) - Network / AI: none | — | `preferences` is stored but **not** read by `MealPlanFuelTab`'s `buildMealContext` (37583–37604), which uses t |
| F-FUEL-212 | Fuel Profile — allergies and fridge/pantry | Fuel Profile screen > ALLERGIES / INTOLERANCES and FRIDGE /  | PARTIAL | `fuelProfile.allergies`, `fuelProfile.fridge` (35846–35847) - Network  | — | **High-value finding.** Two fields the user is explicitly told feed suggestions are never sent to any AI call  |
| F-FUEL-213 | Water tracking card | Fuel tab > main view > water card under the macro summary | PARTIAL | writes `fuelLog` (via `setFuelLog` → `sd("fuelLog", n)`, 36921) - Netw | — | `useOz` is component-local and **not persisted** — it resets to ml on every remount (36539). The oz "−" remove |
| F-FUEL-214 | Smart Nutrition suggestion card | Fuel tab > Log > List sub-tab only > card rendered after Lis | PARTIAL | writes `fuelLog` indirectly via `addItem` (36921) | `POST https://lockedapi.cescocugliari.workers.dev/` — see AI | `if (dismissed) return null;` at 36676 sits after four `useState` calls — legal, but any future hook added bel |
| F-FUEL-215 | Fuel log data model + per-day totals | Fuel tab > (data layer behind every sub-tab) | WORKING | reads/writes `fuelLog`, `fuelProfile`; reads `weightLog` via `getWeigh | — | The default day shape is duplicated verbatim in `getDay` (36933–36941) and `setDay` (36945–36953). |
| F-FUEL-216 | Adaptive TDEE application on tab mount | Fuel tab > main view (invisible; effect on mount) | PARTIAL | reads/writes `fuelProfile`, reads/writes `tdeeHistory`, reads `fuelLog | — | One-render-stale adaptive targets is a concrete, user-visible bug. |
| F-FUEL-217 | Refeed day prompt and active banner | Fuel tab > main view > below the TDEE report card | WORKING | reads/writes `refeedAccepted`, `refeedDismissed`; reads `weightLog` | `logBetaActivity` (out of range) — endpoint not audited here | The mount effect has an empty dep array (37003), so a refeed triggered later in the session by `handleWeightLo |
| F-FUEL-218 | Weight log card + TDEE report card (hosted here) | Fuel tab > main view > under the water card | WORKING | writes `weightLog` (2932) | `logBetaActivity("weight_log", ...)` (2933) | Internals of both cards are outside this range. |
| F-FUEL-219 | Shopping & Budget entry point | Fuel tab > header "Shop" button > full-screen Shopping/Budge | WORKING | `ui_fuelView` (2134) - Network / AI: none | — | — |
| F-FUEL-220 | Meal plan — today's plan card | Fuel tab > Meals > Meal Plans sub-tab > "TODAY'S PLAN" card | WORKING | reads `mealPlans` (45228); writes `fuelLog` via `addItem` - Network /  | — | A plan meal logged twice creates two entries — no dedupe. The `fromPlan: true` flag is written but its readers |
| F-FUEL-221 | Meal plan — full-week accordion | Fuel tab > Meals > Meal Plans > "FULL WEEK" card | WORKING | reads `mealPlans` - Network / AI: none | — | — |
| F-FUEL-222 | Meal plan — AI meal swap (alternatives sheet) | Fuel tab > Meals > Meal Plans > expanded day > "⇄ Swap" butt | PARTIAL | writes `mealPlans` via `setPlans` → `saveMealPlans` (37494–37497, 4523 | `POST https://lockedapi.cescocugliari.workers.dev/` — see AI | **Top finding.** Fabricated nutrition numbers (protein 35 g, carbs 45 g etc. at 37524–37527) are shown as if A |
| F-FUEL-223 | Meal plan — add shopping list | Fuel tab > Meals > Meal Plans > FULL WEEK header > "+ Shoppi | PARTIAL | reads/writes the shopping list key (via `getShoppingList`/`saveShoppin | — | The empty-list branch has a stray empty statement `;` after the toast (37718). |
| F-FUEL-224 | Meal plan — generate new plan form | Fuel tab > Meals > Meal Plans > "MANAGE PLANS" / "GET STARTE | WORKING | reads `fuelProfile`, `profile`, budget data, stores; writes `mealPlans | `POST https://lockedapi.cescocugliari.workers.dev/` — see AI | Default `daysCount` is `"7"` (37473) but the select's option list starts at 3 — since "7 days" is a valid opti |
| F-FUEL-225 | Meal plan — JSON repair and shopping list rebuild | Fuel tab > Meals > Meal Plans (invisible; inside `generatePl | PARTIAL | writes `mealPlans` (45231) - Network / AI: part of AI calls #3 | — | **Second top finding.** The prompt spends tokens asking for branded store-specific product names (e.g. "Quaker |
| F-FUEL-226 | Meal plan — saved plans list (activate / star / delete) | Fuel tab > Meals > Meal Plans > "SAVED PLANS" card | PARTIAL | writes `mealPlans` (45231) - Network / AI: none | — | Uses a native blocking `confirm()` (38448) rather than the app's own modal/toast system. --- |
| F-FUEL-400 | Meal-slot selector (List tab) | Fuel hub > List tab > top card, "MEAL" row | WORKING | none directly | none | identical 20-line meal-pill block is duplicated three times: ListTab 38658-38678, SearchTab 39811-39836, Photo |
| F-FUEL-401 | Natural-language meal estimate ("ESTIMATE MACROS", List tab) | Fuel hub > List tab > "WHAT DID YOU EAT?" textarea + ESTIMAT | PARTIAL | none written here | POST `/analyze-meal`, JSON `{description}`; response `{conte | BUG — `d.gated` never inspected here (contrast `aiCall` `:2691`), so a quota-gated response ("Daily limit reac |
| F-FUEL-402 | Estimate preview card + "LOG THIS MEAL" | Fuel hub > List tab > orange ESTIMATED card (shown only when | WORKING | writes `lk_fuelLog` indirectly via parent `setFuelLog` → `sd("fuelLog" | none | UX gap — no per-item edit/remove in the preview; correcting a bad AI item requires logging then deleting via t |
| F-FUEL-403 | Today's Diary (show/hide, per-meal grouping) | Fuel hub > List tab > "TODAY'S DIARY" card (rendered only wh | WORKING | reads `p.day.meals` sourced from `lk_fuelLog` (`:36909-36911`, `:36932 | none | `#FF6B35` is a hardcoded hex outside the token system (38835). `showDiary` is not persisted, so it re-collapse |
| F-FUEL-404 | Delete a logged food (diary row ✕) | Fuel hub > List tab > Today's Diary > per-row ✕ button | WORKING | writes `lk_fuelLog` | none | this is the only delete path for logged food anywhere in my range. No edit path exists at all — a mis-logged p |
| F-FUEL-405 | Manual macro entry (collapsed prompt) | Fuel hub > Search tab > bottom dashed card "Add custom macro | WORKING | none | none | discoverability issue — it sits below the whole result list, so it is off-screen until the user scrolls past r |
| F-FUEL-406 | Custom macro form (name + 4 numeric fields) | Fuel hub > Search tab > expanded "Custom Entry" card | PARTIAL | writes `lk_fuelLog` via parent | none | no serving-size or gram field here; the user must pre-compute the macros for the portion they ate. |
| F-FUEL-407 | Food text search (multi-source fan-out) | Fuel hub > Search tab > search input + "Go" (or Enter key) | WORKING | reads `lk_myGroceries` (39366), `lk_usdaKey` (39369) | three endpoints above; OFF and USDA are called direct from t | **there is no debounce** — search fires only on Enter/Go, which is deliberate but means no as-you-type results |
| F-FUEL-408 | Result ranking + "★ BEST" badge | Fuel hub > Search tab > results list | WORKING | none | none | source badges rendered per row: STORE, USDA, FATSECRET, OFF (40208-40245). |
| F-FUEL-409 | Food detail card: grams + serving-size quick chips | Fuel hub > Search tab > selected-food card | PARTIAL | writes `lk_fuelLog` via parent | none | no per-serving option even when the source exposes one; everything is normalised to /100 g. |
| F-FUEL-410 | My Store (saved foods) | Fuel hub > Search tab > "My Store" chip (header) and the `vi | PARTIAL | reads/writes **`lk_myGroceries`** (39366, 39377) | none | the storage key is `myGroceries` while the UI is called "My Store" and a *separate* `myStores` key exists for  |
| F-FUEL-411 | USDA API key setup | Fuel hub > Search tab > empty-results state link → key scree | PARTIAL | reads/writes **`lk_usdaKey`** | the key is appended to the USDA URL (39442) | **SECURITY** — the user's USDA key is sent in a URL query string (39442), so it lands in browser history and a |
| F-FUEL-412 | Barcode hand-off from the search box | Fuel hub > Search tab > search input, and the barcode icon b | WORKING | none | none in my range — lookup lives in `BarcodeTab` (outside ran | the hand-off comment at 39495 matches the receiving comment at `:20869`. |
| F-FUEL-413 | Photo capture / library pick | Fuel hub > Photo tab > dashed "Add meal photo" card | PARTIAL | none — the photo is never persisted | none at this step | top redesign priority — this is the single largest payload the app sends. |
| F-FUEL-414 | AI photo/description meal analysis | Fuel hub > Photo tab > "ANALYZE PHOTO" / "ESTIMATE MACROS" b | PARTIAL | none | POST `/analyze-meal`, body `{description?, base64?}`, respon | the parse/reduce/slice logic at 40393-40415 is a **near-verbatim duplicate** of ListTab 38572-38594; only the  |
| F-FUEL-415 | Photo result card: Log Meal / Re-estimate | Fuel hub > Photo tab > "ESTIMATED MACROS" card | WORKING | writes `lk_fuelLog` via parent | none | asymmetry with F-FUEL-402, which does list items — worth unifying in the redesign. |
| F-FUEL-416 | Recipes: For You / From Pantry tab switch | Fuel hub > Recipes tab > two-pill segmented control | WORKING | none | none | raw emoji "🗄️" in the label (41216). |
| F-FUEL-417 | Static "Classic Recipes" library | Fuel hub > Recipes tab > For You > "CLASSIC RECIPES" | PARTIAL | reads `lk_fuelProfile` via the `fuelProfile` prop (`:36912-36914`) | none | vegetarian filtering is by hardcoded id, not by ingredient inspection (41194) — adding a seventh recipe silent |
| F-FUEL-418 | RCard: Add to diary | Fuel hub > Recipes tab > any recipe card > left footer butto | PARTIAL | writes `lk_fuelLog` via parent | none | `r.meal` **is** produced by the "Plan my day" prompt (41396) and **is** honoured by Log Full Day (41505) — but |
| F-FUEL-419 | RCard: Add to shop (ingredients → shopping list) | Fuel hub > Recipes tab > any recipe card > right footer butt | PARTIAL | reads/writes **`lk_shoppingList`** | none | the comment block at 40763-40768 documents the exact bug this state placement fixed (RCard being redeclared pe |
| F-FUEL-420 | AI "Meal ideas" (4 meals from profile) | Fuel hub > Recipes tab > For You > "Meal ideas" (filled grad | PARTIAL | none written; reads `lk_fuelProfile` via prop and `lk_betaStatus` insi | POST worker root `/` | results render as `RCard ai:true` (41520-41526) with an orange "AI" pill (41531-41535). |
| F-FUEL-421 | AI "Plan my day" (4 meals with slots) | Fuel hub > Recipes tab > For You > "Plan my day" (outlined b | PARTIAL | none | POST worker root `/` | fence-stripping here uses literal `"```json"` strings (41401) while `generateAIMeals` uses `String.fromCharCod |
| F-FUEL-422 | "Log Full Day" (bulk-log the AI plan) | Fuel hub > Recipes tab > For You > "AI MEAL PLAN" header > g | PARTIAL | writes `lk_fuelLog` | none | this is the only place `r.meal` is honoured (41500); F-FUEL-418 ignores it. |
| F-FUEL-423 | Pantry-based recipe generation | Fuel hub > Recipes tab > From Pantry | PARTIAL | reads the pantry store via `getPantry` (key outside my range — UNVERIF | POST worker root `/` | a third near-identical parse block (40809-40816) — the app now has four copies of "strip fences, slice bracket |
| F-FUEL-424 | Coach recipes (read-only, from a coach) | Fuel hub > Recipes tab > For You > "FROM YOUR COACH" section | PARTIAL | reads **`lk_coachRecipes`**; writes `lk_shoppingList`, `lk_fuelLog` | none in range | this whole 300-line block duplicates RCard's job with a different visual language and different bugs — a prime |
| F-FUEL-425 | Shopping-list & store helper layer (in range, not a Fuel-entry UI) | no UI in my range — these are module-level helpers consumed  | WORKING | `lk_shoppingList`, `lk_myStores` | none (URLs are built, not fetched) | **flagged as out-of-scope for the Fuel-entry redesign** — audited only because it sits inside my assigned line |

## Shopping — 33 features

`WORKING 24`  `PARTIAL 7`  `UNVERIFIED 1`  `DEAD 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-SHOP-001 | Shop & Budget hub shell (4 sub-tabs + status pills) | Fuel > Shop & Budget (`view === "shop"`, v6:37075; also `scr | WORKING | reads `lk_shoppingList`, `lk_budgetData`, plus the useHubState key for | none | week math is duplicated verbatim from BudgetTab (v6:45975-45987 vs v6:44005-44017). Counts are computed at ren |
| F-SHOP-002 | Quick-add a preset store | Shop & Budget > My Stores > "QUICK ADD" chip row | WORKING | writes `lk_myStores` - Network / AI: none | — | id collides if two stores are added inside the same millisecond. Palette wraps after 10 stores so colours repe |
| F-SHOP-003 | Add a custom store | Shop & Budget > My Stores > "Add Custom Store" dashed button | PARTIAL | writes `lk_myStores` - Network / AI: none | — | no URL validation beyond the `http` prefix; "store.com/foo" becomes `https://store.com/foo` and `buildStoreSea |
| F-SHOP-004 | Toggle a store on/off | Shop & Budget > My Stores > store row > ON/OFF pill | WORKING | — | — | every consumer filters on `enabled` (v6:42580, v6:43995, v6:45245), so OFF removes the store from search, deep |
| F-SHOP-005 | Delete a store | Shop & Budget > My Stores > store row > trash icon | PARTIAL | writes `lk_myStores` | — | budget history entries keep the store *name* string, so deleting a store does not corrupt history (v6:44046). |
| F-SHOP-006 | My Stores empty state | Shop & Budget > My Stores | WORKING | — | — | — |
| F-SHOP-007 | Fitness Picks quick-add chips | Shop & Budget > List > "🏋️ FITNESS PICKS — tap to add" | WORKING | writes `lk_shoppingList` | — | the 12 picks and their default quantities are hardcoded (Chicken Breast 2 lb, Eggs 12 qty, Greek Yogurt 16 oz, |
| F-SHOP-008 | Suggested meal bundles ("ADD ALL") | Shop & Budget > List > empty-list card > "SUGGESTED MEALS TO | WORKING | writes `lk_shoppingList` | — | three bundles hardcoded inline (v6:42700-42714): Chicken & Broccoli Bulk Prep, High Protein Breakfast Spread,  |
| F-SHOP-009 | Add item — typeahead over the local FOODS table | Shop & Budget > List > "ADD ITEM" > text input | WORKING | none; Network: see F-SHOP-010 | — | selecting a suggestion only fills the box; the user must still press ADD TO LIST/Enter. |
| F-SHOP-010 | Store product search (`/store-search`) | Shop & Budget > List > ADD ITEM dropdown, "STORE PRODUCTS" s | UNVERIFIED | — | POST `/store-search`; response `{products: (string \| {name, | the request is unauthenticated — no key, token or user id is sent (v6:42460-42470); anyone can call the worker |
| F-SHOP-011 | Add item to the list (with duplicate merge dialog) | Shop & Budget > List > ADD ITEM > "ADD TO LIST" button or En | WORKING | writes `lk_shoppingList` | — | `addShoppingItem` overrides a `"qty"` unit with `smartUnit(itemName)` (v6:41955), so the unit the user picked  |
| F-SHOP-012 | Check off / uncheck a list item | Shop & Budget > List > category group > item row > checkbox  | WORKING | writes `lk_shoppingList` | — | aria-label toggles between "Mark as picked up" / "Mark as not picked up" (v6:43167). |
| F-SHOP-013 | Remove a single list item | Shop & Budget > List > item row > "Remove" | PARTIAL | — | — | — |
| F-SHOP-014 | Category grouping of the shopping list | Shop & Budget > List > category headers | WORKING | — | — | `categorizeItem` is keyword-based English only; "quinoa", "protein powder", "eggs" all fall through to `other` |
| F-SHOP-015 | Clear Done | Shop & Budget > List > summary card > "Clear Done" | WORKING | — | — | — |
| F-SHOP-016 | Clear All | Shop & Budget > List > summary card > "Clear All" | WORKING | — | — | — |
| F-SHOP-017 | Export / share the shopping list | Shop & Budget > List > summary card > "Export" | PARTIAL | — | — | analytics under-counts exports on any device with `navigator.share` (most phones). |
| F-SHOP-018 | Per-item store deep links | Shop & Budget > List > item row > coloured store chips (unch | WORKING | — | — | chips only render when `myStores.length > 0 && !item.checked` (v6:43223). See "Store integrations" below for U |
| F-SHOP-019 | "Shop at…" — open the whole list at one store | Shop & Budget > List > summary card > "Shop at…" dropdown | PARTIAL | — | — | the 10-item cap is silent — items 11+ are dropped with no message. No cleanup of the timeouts on unmount. |
| F-SHOP-020 | List summary header | Shop & Budget > List > summary card | WORKING | — | — | — |
| F-SHOP-021 | Pantry — add item manually | Shop & Budget > Pantry > "ADD ITEM" row | PARTIAL | writes `lk_pantryItems` | — | manual items get **no `lastBought`**, so `getOverdueStaples` falls back to `dateAdded` (v6:43491). They also l |
| F-SHOP-022 | Pantry — mark out of stock / restocked | Shop & Budget > Pantry > item row > circular button, and the | PARTIAL | writes `lk_pantryItems`, `lk_shoppingList` | — | — |
| F-SHOP-023 | Pantry — "+ List" | Shop & Budget > Pantry > item row > "+ List" (non-empty item | WORKING | — | — | no duplicate check — repeated taps stack duplicate rows. |
| F-SHOP-024 | Pantry — delete item | Shop & Budget > Pantry > item row > "×" | WORKING | — | — | — |
| F-SHOP-025 | Pantry — category grouping and All/Staples filter | Shop & Budget > Pantry > filter pills + category headers | WORKING | — | — | pantry categories are alphabetical, unlike the shopping list's fixed order (F-SHOP-014) — inconsistent UX. |
| F-SHOP-026 | Pantry empty states | Shop & Budget > Pantry | WORKING | — | — | — |
| F-SHOP-027 | Staples — mark/unmark a staple (☆/★) | Shop & Budget > Pantry > item row > star button | WORKING | writes `lk_pantryItems`; reads `lk_budgetData` | — | — |
| F-SHOP-028 | Staples — restock interval suggestion from purchase history | invisible; runs inside F-SHOP-027 | WORKING | — | — | substring matching is loose — "oat" matches "Oatly Oat Milk" and "Goat Cheese". |
| F-SHOP-029 | Staples — edit the restock interval | Shop & Budget > Pantry > staple row > "every Nd" chip | WORKING | — | — | — |
| F-SHOP-030 | Staples — auto-add due items to the shopping list | invisible; runs on RunningLowCard mount (Home) | WORKING | reads/writes `lk_pantryItems`, writes `lk_shoppingList` | — | undatable items (no `lastBought` and no `dateAdded`) are excluded (v6:43492). The loose substring match means  |
| F-SHOP-031 | RUNNING LOW home card | Home > modular card slot `restock` (rendered at v6:26663) | WORKING | writes `lk_pantryItems` | — | `tick` is set but never read in the render body (v6:43543) — it exists purely as a re-render trigger; the init |
| F-SHOP-032 | Receipt → pantry population | invisible; runs from BudgetTab "Confirm & Save" (F-BUDG-006) | WORKING | writes `lk_pantryItems` | — | this is the only path that resets a staple's restock clock automatically. |
| F-SHOP-032b | MealPlannerTab — dead duplicate meal planner | none — the component is never rendered - User action (as wri | DEAD | reads `lk_fuelProfile`, `lk_profile`, `lk_myStores`, `lk_budgetData`;  | — | ~670 lines of dead code sharing storage with the live planner. Only the dead copy uses `confirm()` (v6:45880)  |

## Budget — 10 features

`WORKING 4`  `UNVERIFIED 3`  `PARTIAL 2`  `DEAD 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-BUDG-001 | Weekly budget target | Shop & Budget > Budget > "WEEKLY BUDGET" card > Edit | WORKING | writes `lk_budgetData` | — | — |
| F-BUDG-002 | Weekly spend meter | Shop & Budget > Budget > "WEEKLY BUDGET" card | WORKING | — | — | the bar caps at 100 % but the "over budget" figure is uncapped (v6:44019 vs v6:44490). |
| F-BUDG-003 | Month + purchase-count tiles | Shop & Budget > Budget > "THIS MONTH" / "PURCHASES" tiles | PARTIAL | — | — | — |
| F-BUDG-004 | Log a purchase manually | Shop & Budget > Budget > "+ Add Purchase" → "LOG PURCHASE" f | WORKING | writes `lk_budgetData` | — | the store `<select>` is built from enabled stores plus a literal "Other" option (v6:44757-44764). Negative pri |
| F-BUDG-005 | Receipt scan (camera or library) → `/parse-receipt` | Shop & Budget > Budget > "SCAN RECEIPT" tile > Camera / Libr | UNVERIFIED | — | POST `/parse-receipt` | no size limit or downscaling — a full-resolution phone photo is base64'd **twice** into one JSON body (v6:4408 |
| F-BUDG-006 | Confirm receipt → history + pantry | Shop & Budget > Budget > "CONFIRM RECEIPT" card | WORKING | writes `lk_budgetData`, `lk_pantryItems` | — | parsed items are not editable — a mis-OCR'd price can only be accepted or the whole scan discarded. The store  |
| F-BUDG-007 | Import checked shopping-list items as a pending purchase — DEAD | none — no UI renders it - Behavior (as written): takes `chec | DEAD | would write `lk_budgetData.pendingItems` | — | the history renderer has a `source === "shopping_list"` → "LIST" badge branch (v6:44989) that is therefore unr |
| F-BUDG-008 | Smart Savings — AI cheaper swaps (bare-root AI call) | Shop & Budget > Budget > "SMART SAVINGS" > "Find Cheaper Swa | UNVERIFIED | — | — | unauthenticated. Prices are AI-invented, not looked up — the "save $X.XX" figure is a hallucination presented  |
| F-BUDG-009 | Price comparison across stores (bare-root AI call) | Shop & Budget > Budget > "PRICE COMPARISON" card (renders on | UNVERIFIED | — | — | the system prompt literally instructs the model to invent plausible prices ("Use realistic prices for each sto |
| F-BUDG-010 | Purchase history with week / month / all / receipts filters | Shop & Budget > Budget > "HISTORY" card | PARTIAL | writes `lk_budgetData` | — | delete has no confirmation (v6:45000). Empty state: "No purchases logged yet. Add a purchase or scan a receipt |

## Supplements — 11 features

`WORKING 6`  `PARTIAL 4`  `UNVERIFIED 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-SUPP-001 | Supplement list (Fuel > Supps tab) | Fuel tab > "Supps" pill > list screen | WORKING | reads `lk_supplements`, `lk_suppLog` | none directly; `lk_supplements`/`lk_suppLog` are included in | The Fuel tab passes no props — `SupplementsTab()` takes none (46278), so it re-reads localStorage on mount and |
| F-SUPP-002 | Add supplement | Fuel > Supps > "ADD SUPPLEMENT" dashed button > add form | WORKING | writes `lk_supplements` | `logBetaActivity` only (2772); no per-save request | `created` is set on add and preserved on edit (46360). |
| F-SUPP-003 | Preset supplement picker | Fuel > Supps > add form > "Choose from Presets" | WORKING | none | none | Hardcoded 15-item list at 46129 (`PRESET_SUPPS`), outside range but the only source for this UI. |
| F-SUPP-004 | Dose / frequency / time-of-day controls | Fuel > Supps > add-or-edit form | WORKING | writes `lk_supplements` | none | `openEdit` round-trips custom times back into the Custom chip by checking `SUPP_TIMES.indexOf` (46335–46342) — |
| F-SUPP-005 | Per-supplement reminder toggle | Fuel > Supps > add/edit form > "Reminder" row | WORKING | writes `lk_supplements`; migration flag `lk_reminderMigrated` (2393) | value is shipped inside `dueSupps` on the push snapshot POST | `migrateSuppReminders` (2393) **force-resets every `reminder:false` back to true, once** — see "Reminder mecha |
| F-SUPP-006 | Mark supplement taken (list) | Fuel > Supps > list > left icon button on a supplement card | PARTIAL | reads/writes `lk_suppLog` | `logBetaActivity` (2772) | The log is keyed by name string, not id, so **renaming a supplement orphans its entire history and streak** (4 |
| F-SUPP-007 | Supplement history / streak screen | Fuel > Supps > list > tap the card body (role="button", tabI | PARTIAL | reads `lk_suppLog` | none | History is read-only — no back-fill of a missed day. Grid is 7 columns for 14 items, so it reads as two rows o |
| F-SUPP-008 | Edit supplement | Fuel > Supps > list > pencil button on a row | WORKING | writes `lk_supplements` | `logBetaActivity` (2772) | Renaming here silently breaks the dose log (see F-SUPP-006 notes). |
| F-SUPP-009 | Delete supplement | Fuel > Supps > list > trash button on a row | PARTIAL | writes `lk_supplements` | `logBetaActivity` (2772) | Confirm key is index-based (`delSupp0`), so it can collide across list reorders. |
| F-SUPP-010 | Home "SUPPLEMENTS DUE" reminder card | Home tab > card stack > `supps` card | PARTIAL | reads `lk_supplements`, `lk_suppLog`; writes `lk_suppLog` | none | Window boundaries are hardcoded magic numbers, duplicated in the push snapshot with **different** custom-time  |
| F-SUPP-011 | Supplement push notifications | (no UI in range) — driven from the pre-app IIFE and a server | UNVERIFIED | reads `lk_supplements`, `lk_suppLog`; push keys `lk_pushDeviceId`, `lk | POST to the Worker with a JSON body; response handling is ou | **Logic is triplicated** — `getDueSupps` (46161), the snapshot IIFE (1482), and the comment at 1479 admits the |

## Cycle tracking (menstrual) — 57 features

`WORKING 45`  `PARTIAL 11`  `DEAD 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-CYCLE-001 | Home "Cycle Tracking" setup card (not yet set up) | Home tab > home feed block `cycletrack` > gradient promo car | WORKING | reads `lk_mcProfile` | none | card is rendered on every Home render and re-parses localStorage each time (no memo). |
| F-CYCLE-002 | Home cycle status card (set up) | Home tab > `cycletrack` block > compact card with day ring + | WORKING | reads `lk_mcProfile`, `lk_mcDays` | none | the "LOG" button does not log anything — it just navigates (F:22740-22743). Misleading label. |
| F-CYCLE-003 | Cycle onboarding — step 0, privacy intro | Cycle screen (first entry) > `McOnboarding` step 0 | WORKING | none until finish - Network / AI: none | — | — |
| F-CYCLE-004 | Onboarding step 1 — goal | `McOnboarding` step 1 | PARTIAL | written on finish into `lk_mcProfile.goal` | — | dead preference; UNVERIFIED whether any out-of-range code reads it (see Open questions). |
| F-CYCLE-005 | Onboarding step 2 — last period start date | `McOnboarding` step 2 | WORKING | `lastStart: notSure ? null : lastStart \|\| null` on finish (F:22764) | — | — |
| F-CYCLE-006 | Onboarding step 3 — typical cycle/period length + irregular | `McOnboarding` step 3 | WORKING | `lk_mcProfile.cycleLen/.periodLen/.irregular` | — | — |
| F-CYCLE-007 | Onboarding step 4 — birth control, finish | `McOnboarding` step 4 (final) | WORKING | writes `lk_mcProfile` | none directly; if cloud backup was previously enabled, the l | — |
| F-CYCLE-008 | Onboarding progress dots / Skip | `McOnboarding` header | WORKING | — | — | Skip on step 4 is unavailable, so BC is unskippable-by-skip but defaults to `"none"`. |
| F-CYCLE-009 | Cycle ring — display | Cycle screen > "cycle" view > top | WORKING | — | — | — |
| F-CYCLE-010 | Cycle ring — drag-to-preview any day | Cycle screen > ring | WORKING | — | — | `onPointerUp/Leave` clear dragging but there is no `setPointerCapture`, so a drag leaving the element mid-gest |
| F-CYCLE-011 | Cycle screen center readout states | Cycle screen > inside the ring - Behavior — four mutually ex | WORKING | — | — | — |
| F-CYCLE-012 | Quick action grid (4 tiles) | Cycle screen > below the ring | WORKING | writes `lk_mcDays` | — | two of four tiles ("Symptoms", "More") do exactly the same thing (F:25470, F:25557) — duplicated affordance. |
| F-CYCLE-013 | Inline energy bar (1–5) | Cycle screen > strip under the quick grid | WORKING | `lk_mcDays[today].energy` | — | hidden on hormonal BC because the tile that opens it is replaced by the pill toggle; energy is still reachable |
| F-CYCLE-014 | Inline flow strip | Cycle screen > strip shown when `periodOn` (`flow >= 2`) | PARTIAL | `lk_mcDays[today].flow` | — | bug worth fixing in redesign. |
| F-CYCLE-015 | Phase-of-today explainer card | Cycle screen > below the quick controls (hidden during recov | WORKING | — | — | the footer range for follicular uses `ovuDay-2` whereas `phaseOfDay` boundary is `d < ovuDay - 1` — consistent |
| F-CYCLE-016 | Prediction cards carousel (Next period / Fertile window / PMS window) | Cycle screen > horizontally scrollable row | WORKING | — | — | the fertile window is explicitly labelled "not contraception". Fertile card suppressed when SD ≥ 6 days — hone |
| F-CYCLE-017 | Irregular-cycle disclaimer line | Cycle screen, under the carousel | WORKING | — | — | — |
| F-CYCLE-018 | Overdue explainer (≥5 days late) | Cycle screen card | WORKING | — | — | — |
| F-CYCLE-019 | Training card (in-module coach nudge) | Cycle screen > TRAINING card | WORKING | `lk_mcDays[today].coach` ∈ {"adjusted","kept"} | — | the phase→training copy is static text per phase, not generated; no AI, no model call anywhere in the module. |
| F-CYCLE-020 | Nutrition card (Fuel bridge) | Cycle screen > FUEL card | PARTIAL | reads `lk_mcFuelAdjust`; writes `lk_mcDays[today].nutriDismissed` | — | the 18 mg iron target is hardcoded prose here; the actual value lives only in the never-rendered strip's `p.ir |
| F-CYCLE-021 | Fuel cycle strip (DEAD CODE) | intended Fuel tab; **never mounted** | DEAD | would write `lk_mcFuelAdjust` (a SYNC key, F:210) | — | highest-value redesign finding — the entire documented "cycle changes what Fuel recommends" pathway is unwired |
| F-CYCLE-022 | Train tab cycle banner | Train tab > banner under the recent-workouts block | WORKING | reads `lk_mcProfile`, `lk_mcDays` | — | this is the **only** live cross-module influence of cycle state on Train. It does not change any programming,  |
| F-CYCLE-023 | Day log sheet — open/close | Cycle screen (or calendar) > bottom sheet | WORKING | — | — | every edit writes immediately through `set()` → `p.updateDay` (F:23157-23159); there is no cancel/undo — "Done |
| F-CYCLE-024 | Log sheet — flow picker | log sheet > FLOW | WORKING | `lk_mcDays[iso].flow` (0..4) | — | tapping the already-active "None" (0) writes 0 again — harmless no-op. |
| F-CYCLE-025 | Log sheet — pill-taken toggle (HBC only) | log sheet, shown when `p.hbc` | WORKING | `lk_mcDays[iso].pill` | — | — |
| F-CYCLE-026 | Log sheet — symptoms (3-state severity) | log sheet > SYMPTOMS | WORKING | `lk_mcDays[iso].sym[id] = 1\|2\|3` | — | `col + String(10 + sev*12)` produces alpha suffixes "22"/"34"/"46" — decimal numbers used as hex alpha (F:2337 |
| F-CYCLE-027 | Log sheet — mood multi-select | — | WORKING | `lk_mcDays[iso].mood` (array of label strings) | — | stores display labels, not ids — localization/rename would break historical data. |
| F-CYCLE-028 | Log sheet — energy and sleep (1–5) | — | WORKING | `lk_mcDays[iso].energy`, `.sleep` | — | `sleep` is written but **no consumer exists** in the module — no insight, flag, or card reads `.sleep` (grep o |
| F-CYCLE-029 | Log sheet — sex activity | — | PARTIAL | `lk_mcDays[iso].sex` | — | — |
| F-CYCLE-030 | Log sheet — events (EC, pregnancy test, abortion, miscarriage, IUD) | log sheet > EVENTS collapsible ("contraception, tests, pregn | WORKING | `lk_mcDays[iso].ev = { ec?:true, test?:"neg"\|"pos", abortion?:true, m | — | `ev.test` and `ev.iud` are stored but never read by any logic — only `abortion`/`miscarriage`/`ec` drive behav |
| F-CYCLE-031 | Log sheet — free-text note | — | WORKING | `lk_mcDays[iso].note` (free text — the most sensitive field in the mod | — | every keystroke triggers a full `mcSaveDays` JSON serialize of the whole days map (F:25123-25128 → F:21943-219 |
| F-CYCLE-032 | Calendar view | Cycle screen > header toggle (calendar icon) > `McCalendar` | WORKING | — | — | future days are tappable and open the log sheet, so a user can log data on a future date (F:23905, no `isFut`  |
| F-CYCLE-033 | Calendar stats strip | — | WORKING | — | — | — |
| F-CYCLE-034 | Cycle history bar chart | — | WORKING | — | — | max 6 bars because `mcCompute` slices `lens` to the last 6 (F:22012). |
| F-CYCLE-035 | Cycle settings sheet | Cycle screen > header gear icon | WORKING | writes `lk_mcProfile` via `p.setMcp` → `mcSaveProfile` (F:25119-25122) | — | unlike `McLogSheet`, this sheet is **not** wrapped in `lkPortal` and has **no** `useEscape` (F:24067 only call |
| F-CYCLE-036 | Cloud backup toggle (opt-in health-data sync) | Cycle settings > "Cloud backup" | WORKING | `lk_mcCloudSync` (raw, unprefixed by `sd`), plus `__lk_ts__lk_mcProfil | the app's generic bidirectional sync (Supabase-style key/val | `mcp.cloudOn` is **not** stored in the profile — it is a separate raw localStorage flag, so it does not itself |
| F-CYCLE-037 | Export cycle data (JSON) | Cycle settings > "Export my data (JSON)"; also the health ca | WORKING | reads only | none (share sheet is OS-level) | export includes free-text notes, sex-activity entries and abortion/miscarriage events verbatim. |
| F-CYCLE-038 | Delete all cycle data | Cycle settings > red "Delete all cycle data" → inline confir | PARTIAL | removes `lk_mcProfile`, `lk_mcDays`; via `setCycleSync(false)` also re | best-effort null-write to clear the cloud copy (F:1198-1205) | — |
| F-CYCLE-039 | Athlete health flags (RED-S / amenorrhea) | Cycle screen > CYCLE HEALTH card | WORKING | `lk_mcProfile.healthAck` (map of flag key → true); keys embed `lastSta | — | hard-coded clinical thresholds (90/60/45/35 days, 8-day trend, 1.5× volume ratio, 3 tired logs). All copy is s |
| F-CYCLE-040 | Pregnancy-end recovery mode | Cycle screen > CYCLE RESET card + ring/center overrides - Tr | WORKING | derived from `lk_mcDays[iso].ev` | — | 70-day window is a hardcoded expiry; after 70 days the mode silently ends even with no period logged. |
| F-CYCLE-041 | Emergency contraception (EC) card | Cycle screen > "AFTER THE MORNING-AFTER PILL" card | WORKING | `lk_mcDays[today].ecDismissed` | — | dismissal is keyed to *today*, so the card returns tomorrow. |
| F-CYCLE-042 | "Your patterns" insights | Cycle screen > YOUR PATTERNS card - Behavior (`mcInsights`,  | WORKING | — | — | the only place workout data flows *into* the cycle module. |
| F-CYCLE-043 | "The science" education accordion | Cycle screen > THE SCIENCE collapsible | WORKING | — | — | — |
| F-CYCLE-044 | Discreet mode | Cycle settings > "Discreet home card"; effects across the mo | WORKING | `lk_mcProfile.discreet` | — | the *screen itself* still shows full cycle detail — discreet only hides the entry points and the two most sens |
| F-CYCLE-045 | Non-female gate screen | `cycletrack` route for a user whose sex is not Female | WORKING | — | — | binary sex gate; no non-binary/trans path anywhere in the module. |
| F-CYCLE-046 | Header controls (back / calendar toggle / settings) and privacy sub-li | Cycle screen > `DsHeader` | WORKING | — | — | — |
| F-CYCLE-200 | "Stack" tab entry point (Fuel tab wrapper) | Fuel tab > sub-tab pill row > "Stack" | WORKING | reads `lk_perfTracking` | none | The chip label is "Stack" but the component, storage keys, and all copy say "Cycle". |
| F-CYCLE-201 | Cycle list screen | Fuel > Stack > list | WORKING | reads `lk_cycles`, `lk_cycleLog` | none directly; `cycles`/`cycleLog` ride the beta-activity sn | The empty-state copy asserts cloud backup; `lk_cycles`/`lk_cycleLog` do appear in the sync key list at 201. |
| F-CYCLE-202 | Create / edit a cycle | Fuel > Stack > "NEW CYCLE" (or detail > pencil) > add form | PARTIAL | writes `lk_cycles` | `logBetaActivity` (2772) | Editing an active cycle re-sets `status: "active"` (47574), so **editing a completed cycle silently revives it |
| F-CYCLE-203 | Add / edit a compound (within a cycle) | Fuel > Stack > add form > "Add Custom Compound" or a preset  | WORKING | none until the parent cycle is saved (compounds live in `cComps` state | none | Editing a compound name away from a preset silently widens the route options back to the generic list (47626). |
| F-CYCLE-204 | Compound preset database browser | Fuel > Stack > add form > "Browse Compound Database" | WORKING | none | none | `PRESET_COMPOUNDS` is 32 hardcoded entries covering AAS, SARMs/peptides, GLP-1s, HGH and ancillaries, each wit |
| F-CYCLE-205 | AI cycle overview | Fuel > Stack > add form > "Generate AI Cycle Overview" | PARTIAL | persisted onto the cycle object as `aiOverview` when the cycle is save | whatever `aiCall` does (2663) — out of range | This is the only AI call in the range. The prompt explicitly instructs the model not to moralise about anaboli |
| F-CYCLE-206 | Cycle detail — today's doses | Fuel > Stack > tap a cycle > detail > "TODAY" | PARTIAL | reads/writes `lk_cycleLog` | `logBetaActivity("compound_taken", …)` (47471) | The `dueToday` block is a **fourth copy** of the frequency rules (47890 vs 47320 vs 1519 vs the supplement var |
| F-CYCLE-207 | Cycle detail — compound roster, AI overview, notes | Fuel > Stack > detail | WORKING | reads `lk_cycles` | none | There is no way to regenerate the AI overview from the detail screen — only from the edit form (48812). |
| F-CYCLE-208 | End a cycle | Fuel > Stack > detail > "End" button (active cycles only) | PARTIAL | writes `lk_cycles` | `logBetaActivity` (2772) | Overwrites the planned `endDate` with today, losing the original schedule. |
| F-CYCLE-209 | Delete a cycle | Fuel > Stack > detail > "Delete Cycle" | PARTIAL | writes `lk_cycles` | `logBetaActivity` (2772) | `deleteCycle` reads `cycles[idx].name` for logging before the filter, so it is safe against the stale-closure  |
| F-CYCLE-210 | Home "COMPOUNDS DUE" reminder card | Home tab > card stack > `cycle` card | PARTIAL | reads `lk_perfTracking`, `lk_cycles`, `lk_cycleLog`; writes `lk_cycleL | none | Unlike supplements, compounds have **no time-of-day window** at all — everything not yet taken is due from mid |

## Coach (AI) — 40 features

`WORKING 35`  `DEAD 4`  `PARTIAL 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-COACH-001 | Coach screen shell: four panes, tabs, swipe, deep links | Coach tab > CoachScreen > header + tablist | WORKING | reads `lk_feedback` (50905) | none | `prefillOnce`/`setPrefillOnce` (50024) and `memoryInput`/`setMemoryInput` (50083) are declared but never used  |
| F-COACH-002 | Coach chat — send a message | Coach > Chat > composer textarea + send button | WORKING | writes `lk_coachLastMsgs`, `lk_coachLastHist` (49926-49927); context b | see "THE AI CONTRACT". | `max_tokens: 1000` here differs from the shared `aiCall`'s 700 (2668) and the interview's 600 (49775). No `tem |
| F-COACH-003 | Chat error rows, retry, and paywall hand-off | Coach > Chat > error bubble under a failed turn | WORKING | none directly (persisted with msgs) | repeat of F-COACH-002 | error rows persist into `lk_coachLastMsgs` (49926) so a stale "The coach is down." bubble survives a reload. |
| F-COACH-004 | Stop generation | Coach > Chat > composer, send button replaced by a stop squa | WORKING | none | aborts the in-flight POST | — |
| F-COACH-005 | Edit a sent message and re-run from there | Coach > Chat > "Edit · re-runs from here" under a user bubbl | WORKING | `lk_coachLastMsgs`/`lk_coachLastHist` rewritten by the msgs effect (49 | — | — |
| F-COACH-006 | Copy reply / retry last reply | Coach > Chat > "Copy" and "Retry" under an assistant reply | WORKING | — | — | — |
| F-COACH-007 | Empty-state opener + suggestion chips + dismiss | Coach > Chat, when `msgs.length === 0` | WORKING | `coachOpener` reads `lk_feedback`, `lk_coachPlan`, `lk_fuelLog`, `lk_g | — | dismissals reset on reload — no storage key. |
| F-COACH-008 | Context receipt ("Your coach can see N things about you") | Coach > Chat empty state > shield row | PARTIAL | reads `lk_coachDataPrefs`, `lk_coachMemory`, `lk_coachMemoryOn`, `lk_c | — | — |
| F-COACH-009 | Reply parsing — structured action markers | Coach > Chat (invisible; drives the action cards) | WORKING | — | — | `var re = txt.indexOf("###RECIPE_END###")` at 50177 shadows nothing but is named identically to a regex-ish va |
| F-COACH-010 | Action card — save a training split | Coach > Chat > orange split card under a reply | WORKING | splits persisted by the parent (outside this range) | — | the disabled flag is a fix for double-adds on persisted messages — comment at 51455-51457. |
| F-COACH-011 | Action card — save a recipe / add ingredients to shopping | Coach > Chat > green recipe card | WORKING | writes `lk_coachRecipes` (50385); `lk_betaLog` via `logBetaActivity` | — | the "ADD TO SHOP" button re-uses the loop variable name `i`, shadowing the outer message index `i` inside the  |
| F-COACH-012 | Action card — create a goal | Coach > Chat > goal card | WORKING | reads/writes `lk_goals` (50440-50442) | — | — |
| F-COACH-013 | Action card — log food | Coach > Chat > blue food card | WORKING | `lk_fuelLog` read+write (50482, 50499) | — | — |
| F-COACH-014 | Action card — log cardio (CoachCardioCard) | Coach > Chat > cardio card | WORKING | reads `lk_profile` (49405); history written by the parent | none | `done` is component-local, so scrolling the card out of the DOM and back would re-enable the button — unlike t |
| F-COACH-015 | Action card — save a training plan | Coach > Chat > plan card | WORKING | writes `lk_coachPlan` | — | — |
| F-COACH-016 | Action card — save coaching instructions from chat | Coach > Chat > "COACHING PROFILE" card | WORKING | writes `lk_coachInstructions` | — | — |
| F-COACH-017 | "SAVE ALL (N ACTIONS)" | Coach > Chat, shown when a reply carried ≥3 actions | WORKING | — | — | fires up to five `savedMsg` banners in sequence, each overwriting the last (each save sets `savedMsg` with its |
| F-COACH-018 | Shopping-list approval modal | Coach > Chat > full-screen modal | WORKING | — | — | — |
| F-COACH-019 | Remembered-fact chip with Undo | Coach > Chat > blue "Saved to memory" pill under a reply | WORKING | writes `lk_coachMemory` | — | — |
| F-COACH-020 | New chat (delete conversation) | Coach > header > "New chat" (only when `msgs.length > 0`) | WORKING | writes `lk_coachLastMsgs`, `lk_coachLastHist` to `[]` | — | the in-code comment flags this as a permanent delete labelled like a non-destructive "new chat" (49936-49938). |
| F-COACH-021 | Rename the coach | Coach > header > pencil next to the coach name | WORKING | profile (parent), `lk_betaLog` | — | — |
| F-COACH-022 | Jump to latest / smart auto-scroll | Coach > Chat > floating pill above the composer | WORKING | — | — | — |
| F-COACH-023 | "Earlier messages trimmed" notice | Coach > Chat, above the transcript | WORKING | — | — | the notice keys on the in-memory length, but trimming only happens on reload, so it can display before anythin |
| F-COACH-024 | Setup pane — "About you" free-text instructions | Coach > Setup > ABOUT YOU | WORKING | writes `lk_coachInstructions`, `lk_betaLog` | — | — |
| F-COACH-025 | Setup pane — coaching style / persona | Coach > Setup > COACHING STYLE | WORKING | writes `lk_coachStyle`, `lk_betaLog` | — | — |
| F-COACH-026 | Setup pane — memory list, add, delete, clear, master switch | Coach > Setup > MEMORY | WORKING | `lk_coachMemory`, `lk_coachMemoryOn` | — | — |
| F-COACH-027 | Setup pane — "What your coach can see" data switches | Coach > Setup > WHAT YOUR COACH CAN SEE (collapsed by defaul | WORKING | `lk_coachDataPrefs` | — | — |
| F-COACH-028 | Coach interview (six questions → AI-written instructions) | Coach > Setup > "Let the coach interview you" → bottom-sheet | WORKING | writes `lk_coachInstructions` only on Save (via `applyCoachInstruction | POST `https://lockedapi.cescocugliari.workers.dev/` — full d | `max_tokens: 600` but the prompt says "Under 300 words"; the generated block is not length-checked against the |
| F-COACH-029 | Plan pane — empty state | Coach > Plan, when `lk_coachPlan` is null | WORKING | — | — | — |
| F-COACH-030 | Plan pane — this week, overall progress, phase timeline | Coach > Plan, with a plan saved | WORKING | `lk_coachPlan` (via state), `lk_goals`, weight/bf logs | — | `matchTargetToData` (50592-50700) contains a hardcoded exercise-ID shortcut table — bench 107, squat 701, dead |
| F-COACH-031 | Plan pane — phase/plan review prompt | Coach > Plan > green "Review with coach" card | WORKING | — | — | — |
| F-COACH-032 | Plan pane — adjust plan / delete plan | Coach > Plan > footer | WORKING | — | — | the delete path uses the browser's blocking `confirm()` rather than the app's own `lkConfirm` two-tap pattern  |
| F-COACH-033 | Daily check-in — the form | Coach > Check-In (FeedbackScreen) | WORKING | reads/writes `lk_feedback`; writes `lk_betaLog`; reads `lk_checkinPerD | none — deliberately local ("a network round-trip here would  | full entries are logged verbatim into `lk_betaLog` including the free-text note (52590). |
| F-COACH-034 | Check-in — the local coach response ("payoff card") | Coach > Check-In, immediately after submitting - Behavior (` | WORKING | writes `lk_coachMoodRaisedAt` (52551) - Statistics: 30-day window, min | — | the same wellbeing rule is duplicated in `coachBuildContext` (49111-49117) but only that copy is gated on `pre |
| F-COACH-035 | Check-in — 14-day dot row and day inspector | Coach > Check-In > dots | WORKING | — | — | — |
| F-COACH-036 | Check-in — done-for-today state | Coach > Check-In after the per-day quota is met | WORKING | — | — | — |
| F-COACH-037 | Beta admin — code management | Settings > (screen `"betaAdmin"`) > Codes tab | DEAD | reads/writes `lk_betaCodes` | none | beta codes live in `localStorage`, so any user can read, add or reactivate them from devtools — the "validatio |
| F-COACH-038 | Beta admin — activity / AI logs / feedback tabs | Settings > betaAdmin > tabs | DEAD | reads `lk_betaCodes`, `lk_betaLog`, `lk_betaAILog`, `lk_feedback` | — | — |
| F-COACH-039 | Beta admin — export all data (JSON download) | Settings > betaAdmin > "Export All Data (JSON)" | DEAD | — | — | the export contains the complete AI transcript (`aiInteractions`) and every free-text check-in note. |
| F-COACH-040 | Beta admin — "Sync All to Server Now" | Settings > betaAdmin > green button | DEAD | — | POST `https://lockedapi.cescocugliari.workers.dev/beta-sync` | `betaId` is an unauthenticated, guessable string (the lowercased beta code, 2765) and is the only identity on  |

## Profile & Settings — 74 features

`WORKING 63`  `PARTIAL 8`  `UNVERIFIED 3`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-PROF-001 | Guest-mode upgrade banner (Profile header) | Profile tab > ProfileScreen > top banner | UNVERIFIED | none directly in range | none in range (delegated to `window.LOCKED.upgradeFromGuest` | identical duplicated card exists in Settings (F-PROF-045). |
| F-PROF-002 | Profile identity header (avatar, display name, @username) | Profile tab > ProfileScreen > header | WORKING | none read in range (profile supplied by parent) | none | no avatar image support anywhere; initial-only. |
| F-PROF-003 | Settings entry button | Profile tab > ProfileScreen > header right | WORKING | none | none | — |
| F-PROF-004 | Lifetime stats grid (Workouts / PRs / Total Sets / Volume) | Profile tab > ProfileScreen > 2×2 grid | WORKING | none in range | none | volume rounds to whole "k", so anything under 500 units displays "0k". |
| F-PROF-005 | Earned badges grid | Profile tab > ProfileScreen > Badges section | WORKING | reads `lk_gamingLayer` via `ld("gamingLayer", false)` (30420) | none | comment at 30161-30165 documents a fixed bug where `var(--color-info)12` produced invalid colours; badge colou |
| F-PROF-006 | Locked (unearned) badges | Profile tab > ProfileScreen > Badges section, below earned | WORKING | `lk_gamingLayer` (shares the F-PROF-005 gate, 30420) | none | inline comments (30484-30489, 30508-30511) record deliberate accessibility decisions: no opacity fade (contras |
| F-PROF-007 | Personal records list (top 6) | Profile tab > ProfileScreen > "Personal Records" | WORKING | none in range | none | hard cap of 6 with no "see all" affordance; `r` is collected but never displayed. |
| F-PROF-008 | Progress photo — capture from camera | Progress > ProgressPhotos > "Camera" button | WORKING | writes `lk_progressPhotos` (2856-2871) | none at capture time — images stay on device | `capture:"environment"` is a hint only; desktop browsers fall through to a file picker. |
| F-PROF-009 | Progress photo — pick from library | Progress > ProgressPhotos > "Library" button | WORKING | `lk_progressPhotos` | none | — |
| F-PROF-010 | Progress photo note field | Progress > ProgressPhotos > textarea above Camera/Library | WORKING | stored inside each `lk_progressPhotos` entry as `note` (2859-2862) | none directly (note is NOT sent to the analysis endpoint — s | — |
| F-PROF-011 | Photo grid grouped by month | Progress > ProgressPhotos > grid | WORKING | reads `lk_progressPhotos` at mount (30587) | none | months are reversed but photos **within** a month keep insertion order (oldest first), so ordering is mixed. |
| F-PROF-012 | Photo count + "stored on device" label | Progress > ProgressPhotos > header | WORKING | none | none | **privacy finding.** Copy says "stored on device" while an AI action sends the image to a third-party worker. |
| F-PROF-013 | Open photo lightbox | Progress > ProgressPhotos > tap a thumbnail | WORKING | none | none | — |
| F-PROF-014 | Escape key closes lightbox | Progress > ProgressPhotos | WORKING | none | none | — |
| F-PROF-015 | Lightbox prev / next navigation | Progress > lightbox footer arrows | WORKING | none | none | — |
| F-PROF-016 | AI "Analyse Physique" (photo → Cloudflare Worker) | Progress > lightbox > "ANALYSE PHYSIQUE" button | WORKING | reads `lk_profile`; reads `lk_history` and `lk_splits` as fallbacks wh | `POST https://lockedapi.cescocugliari.workers.dev/analyze-ph | **privacy/security finding.** The photo leaves the device un-authenticated to a personal `workers.dev` subdoma |
| F-PROF-017 | Analysis result panels (summary / composition / observations / strengt | Progress > lightbox > below the analyse button | WORKING | none | none | — |
| F-PROF-018 | Weak point → prescription cards | Progress > lightbox > "WEAK POINT → FIX" | WORKING | none | none | — |
| F-PROF-019 | "ADD TO SPLIT" from a weak point | Progress > lightbox > weak point card | WORKING | writes via parent's splits persistence; `lk_betaLog` written by `logBe | none | the sheet is `position:fixed` with `zIndex 400` **inside** a `zIndex 99999` portal (31396) — it renders correc |
| F-PROF-020 | Delete a progress photo | Progress > lightbox footer > "Delete" | WORKING | writes `lk_progressPhotos` | none | comment at 31420 explains the double-tap rationale ("cannot be recreated"). |
| F-PROF-021 | "Tap a photo → Analyse Physique" hint banner | Progress > ProgressPhotos > below the grid | WORKING | none | none | — |
| F-PROF-022 | Progress photos empty state | Progress > ProgressPhotos | WORKING | none | none | — |
| F-PROF-023 | Home layout — reorder blocks | Settings > Home Layout > BLOCKS > ▲ / ▼ | WORKING | reads/writes `lk_homeLayout` | none | 14 blocks (26019-26061) — arrow-only reordering means moving a block from bottom to top is 13 taps. No drag ha |
| F-PROF-024 | Home layout — hide / show a block | Settings > Home Layout > BLOCKS > Hide/Show button | WORKING | `lk_homeLayout` | none | — |
| F-PROF-025 | Home layout — quick actions (max 3) | Settings > Home Layout > QUICK ACTIONS | WORKING | `lk_homeLayout` | none | default quick set is `["water","checkin","food"]` (26076). |
| F-PROF-026 | Home layout — reset to default | Settings > Home Layout > "Reset to Default" | WORKING | `lk_homeLayout` | none | — |
| F-PROF-027 | Home layout — back navigation | Settings > Home Layout > back chevron | WORKING | none | none | LayoutEditor fully replaces SettingsScreen's render (`if (settingsView === "layout") return ...`, 32109) — it  |
| F-PROF-028 | Push notifications master switch | Settings > NOTIFICATIONS card > "Push notifications" | WORKING | `lk_pushEnabled` (1309), `lk_pushDeviceId` (1307), `lk_pushPrefs` (130 | subscription/registration handled inside `window.LOCKEDPush` | comment at 31750-31755 explains the switch doubles as the permission prompt (browsers require a user gesture). |
| F-PROF-029 | Notification preference — Rest timer | Settings > NOTIFICATIONS > "Rest timer" | WORKING | `lk_pushPrefs` (1308) | `P.setPrefs` (server-side subscription update, outside range | default-on semantics (`prefs.rest !== false`), so an absent key means enabled. |
| F-PROF-030 | Notification preference — Training day + send time | Settings > NOTIFICATIONS > "Training day" and "Send at" | WORKING | `lk_pushPrefs` | `P.setPrefs` | no timezone handling visible client-side — UNVERIFIED how the Worker interprets "07:30". |
| F-PROF-031 | Notification preference — Daily check-in + send time | Settings > NOTIFICATIONS > "Daily check-in" | WORKING | `lk_pushPrefs` | `P.setPrefs` | — |
| F-PROF-032 | Notification preference — Unfinished workout | Settings > NOTIFICATIONS > "Unfinished workout" | WORKING | `lk_pushPrefs` | `P.setPrefs` | — |
| F-PROF-033 | Notification preference — Supplements | Settings > NOTIFICATIONS > "Supplements" | WORKING | `lk_pushPrefs` | `P.setPrefs` | — |
| F-PROF-034 | Notification preference — Compounds | Settings > NOTIFICATIONS > "Compounds" | PARTIAL | `lk_pushPrefs` | `P.setPrefs` | — |
| F-PROF-035 | Notification preference — Restock | Settings > NOTIFICATIONS > "Restock" | WORKING | `lk_pushPrefs` | `P.setPrefs` | — |
| F-PROF-036 | Rest timer sound picker (Bell / Plates / Silent) | Settings > NOTIFICATIONS > "Rest timer sound" | WORKING | `lk_pushSound` (1806) — written raw, not via `sd` | none | sounds are synthesised with WebAudio, not files (comment 1800-1805). |
| F-PROF-037 | Send a test notification | Settings > NOTIFICATIONS > "Send a test notification" | WORKING | none | `P.test()` (outside range) | — |
| F-PROF-038 | Text size / Dynamic Type | Settings > TEXT SIZE card | PARTIAL | reads/writes `lk_textScale` | none | comment 31946-31948 explains this exists because an installed PWA has no Safari page zoom. |
| F-PROF-039 | On-device storage meter | Settings > ON-DEVICE STORAGE card | WORKING | reads every localStorage key (no writes) | none | a 5s `setInterval` runs for the whole time Settings is open; hardcoded 5 MB is wrong on browsers with larger q |
| F-PROF-040 | Home Layout entry (Settings → Customize) | Settings > PREFERENCES > HOME LAYOUT > "CUSTOMIZE" | WORKING | none | none | — |
| F-PROF-041 | Cloud sync status readout | Settings > ACCOUNT > CLOUD SYNC | PARTIAL | none in range | none for display | comment 32250-32255 documents the date-formatting fix (a stale June sync used to read as "Last synced 4:32 PM" |
| F-PROF-042 | "SYNC NOW" manual sync | Settings > ACCOUNT > CLOUD SYNC > button | WORKING | none in range | `window.LOCKED.forceSync()` (outside range) | — |
| F-PROF-043 | Account email display | Settings > ACCOUNT card | WORKING | none | none | — |
| F-PROF-044 | Sign out | Settings > ACCOUNT > "Sign Out" | WORKING | none in range | delegated | unguarded destructive-ish action sitting directly above the password fields. |
| F-PROF-045 | Guest mode card (Settings) | Settings > ACCOUNT > GUEST MODE | UNVERIFIED | none | delegated | — |
| F-PROF-046 | Change password | Settings > ACCOUNT > CHANGE PASSWORD | WORKING | none | `window.LOCKED.changePassword` (outside range) | **security note** — password change with no re-auth step in the client; whether the backend requires a fresh s |
| F-PROF-047 | Display name edit + Save Name | Settings > PROFILE card | WORKING | persisted by parent `updateProfile` (writes `lk_profile`, outside rang | none in range | — |
| F-PROF-048 | Username display (read-only) | Settings > PROFILE card | WORKING | none | none | — |
| F-PROF-049 | About Me — Age | Settings > ABOUT ME | WORKING | via `updateProfile` → `lk_profile` | none | — |
| F-PROF-050 | About Me — Sex (Male / Female) | Settings > ABOUT ME | WORKING | `lk_profile` via `updateProfile` | none | — |
| F-PROF-051 | About Me — Body weight (unit-aware) | Settings > ABOUT ME > "Body Weight (kg\|lbs)" | WORKING | `lk_profile.weightKg` — always stored in **kg** | none | the initial-state derivation runs once at mount, so toggling the unit while on Settings does not reformat the  |
| F-PROF-052 | About Me — Height (cm, or ft + in) | Settings > ABOUT ME > "Height" | PARTIAL | `lk_profile.heightCm` — always stored in **cm** | none | height unit is derived from the **weight** unit toggle; there is no independent cm/in setting. |
| F-PROF-053 | About Me — Goal (Cut / Maintain / Bulk) | Settings > ABOUT ME > "Goal" | WORKING | `lk_profile.goal` | this value is read back and **sent to the physique-analysis  | — |
| F-PROF-054 | Save Stats | Settings > ABOUT ME > "Save Stats" | WORKING | `lk_profile` via parent | none | two separate save buttons on one screen (Save Name, Save Stats) is a known redesign hazard — an edited name pl |
| F-PROF-055 | Weight unit toggle (KG ↔ LBS) | Settings > PREFERENCES > "Weight Unit" | WORKING | parent-owned (see storage table); `storedWeightUnit()` (4379-4413) is  | none | comment at 32790-32791 records that a standalone UNITS card was removed and this is the single place the unit  |
| F-PROF-056 | Daily check-in frequency (1 / 2 / 4 per day) | Settings > PREFERENCES > "Daily check-ins" | WORKING | reads/writes `lk_checkinPerDay` | none | — |
| F-PROF-057 | Theme / App Style picker | Settings > PREFERENCES > "App Style" | WORKING | reads/writes `lk_theme` | none | see the Themes section below. The picker is **5** themes, not 4. |
| F-PROF-058 | Partial reps toggle | Settings > WORKOUT TRACKING > "Partial Reps" | WORKING | `lk_hidePartials` (inverted) | none | inverted key naming is a redesign trap — default (absent key) means partials **shown**. |
| F-PROF-059 | Streaks and badges toggle (`gamingLayer`) | Settings > WORKOUT TRACKING > "Streaks and badges" | WORKING | `lk_gamingLayer` | none | — |
| F-PROF-060 | Weight-units explanation row | Settings > WORKOUT TRACKING > "Weight units" | WORKING | reads `lk_weightStorageUnit` (4384, incl. a raw-string fallback at 438 | none | informational only — there is no control to change the *storage* unit. |
| F-PROF-061 | Export nutrition CSV | Settings > EXPORT MY DATA > "Nutrition CSV" | WORKING | reads the fuel/nutrition keys inside `exportFuelCSV` (outside range) | none — fully local | — |
| F-PROF-062 | Full backup (JSON) export | Settings > EXPORT MY DATA > "Full backup (JSON)" | WORKING | reads **all** `lk_*` keys — including `lk_progressPhotos` (base64 imag | none | comment 33128-33131 records the fix — the button previously said "Everything" but shipped only the food diary. |
| F-PROF-063 | Restore from backup | Settings > EXPORT MY DATA > "Restore from backup" (label-wra | WORKING | writes arbitrary `lk_*` and `__lk_ts__*` keys from the file | none | **security consideration** — a hostile JSON file can set any `lk_*` key, including `lk_betaStatus`, `lk_perfTr |
| F-PROF-064 | Voice / microphone button toggle | Settings > VOICE COMMANDS > "Microphone Button" | WORKING | `lk_voiceEnabled` | none | — |
| F-PROF-065 | Performance tracking (cycle logging) toggle | Settings > PERFORMANCE TRACKING > "Cycle Logging" | PARTIAL | `lk_perfTracking` | none | the only toggle in Settings that reloads the app; switch renders red (`RE`) rather than orange when on (33319) |
| F-PROF-066 | Beta invite code entry + verification | Settings > BETA TESTING (shown only when `!isBeta`) | WORKING | none at this step | `POST .../beta-validate`, body `{code:"UPPERCASE"}`, respons | **security finding.** Beta gating can be bypassed by taking the device offline before tapping Verify. |
| F-PROF-067 | Beta tester agreement + activation | Settings > BETA TESTING > agreement panel | PARTIAL | writes `lk_betaCodes`, `lk_betaStatus`, `lk_betaCode`, `lk_betaId` | none at this step — the claim is purely local | `claimBetaCode` mutates a **local** `lk_betaCodes` list, so the code is not marked used server-side — the same |
| F-PROF-068 | Beta status card (status, code, last sync) | Settings > BETA card | WORKING | reads `lk_betaCode`, `lk_lastSync`, `lk_betaId` | none | hardcoded cohort id `"summerbeta"` at 2795. |
| F-PROF-069 | "Send Data to Dev" (beta sync) | Settings > BETA card > green button | WORKING | reads `lk_betaLog`, `lk_betaAILog`, `lk_feedback`, `lk_weightLog`, `lk | `POST .../beta-sync` | an empty statement `;` sits inside the success callback (33562) — harmless dead code. |
| F-PROF-070 | "Force Refresh App" | Settings > BETA card > orange button | WORKING | removes `lk_deployVersion` | none directly | `reload(true)` is a long-deprecated non-standard argument, ignored by modern browsers. |
| F-PROF-071 | Replay Tutorial | Settings > HELP card | UNVERIFIED | none in range | none | — |
| F-PROF-072 | Reset all data (arm → confirm) | Settings > DANGER ZONE > "Reset all data" | WORKING | removes all `lk_*` and `__lk_ts__*` keys; preserves `lk_guestMode` for | `auth.signOut()` for signed-in users | this is local-only. A signed-in user who resets and signs back in gets everything back from the cloud — UNVERI |
| F-PROF-073 | Delete Account (two-step, destructive) | Settings > DANGER ZONE > "Delete Account" | PARTIAL | none written in range | `window.LOCKED.deleteAccount()` | no typed confirmation (e.g. typing "DELETE"), no password re-entry, and no local data wipe on the client side. |
| F-PROF-074 | Section headers and embedded shared cards | Settings > various | PARTIAL | none | none | for the redesign, the section grouping is inconsistent: Export/Restore, Voice, Performance Tracking and Beta a |

## Onboarding — 17 features

`WORKING 13`  `PARTIAL 4`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-ONB-001 | Onboarding gate (when the flow appears / how it is skipped) | App root > pre-render gate | WORKING | reads `lk_profile`; writes `lk_profile` (`:57352`), `lk_guestMode` (`: | none at the gate | The guest seed writes a fake username `athlete`, which collides for every guest user (`:172`). |
| F-ONB-002 | Step 1 — Welcome / splash | Onboarding > step 1 screen | WORKING | none written at this step | none (unless Verify tapped) | The step-1 screen carries no "STEP n OF 3" label; the counter starts at step 2 ("STEP 1 OF 3", `:34342`), so t |
| F-ONB-003 | Invite / beta code entry + Beta Tester Agreement (step 1) | Onboarding > step 1 > "INVITE CODE (OPTIONAL)" card | PARTIAL | reads `lk_betaCodes` (via `ld("betaCodes")`, `:2723`) | POST `/beta-validate` to `lockedapi.cescocugliari.workers.de | **SECURITY FINDING.** `DEFAULT_BETA_CODES = ["JOSHBETA","SUMMERBETA","ROMANBETA","CESCOBETA","PUBLICBETA","OLI |
| F-ONB-004 | Step 2 — Create your profile (name + username) | Onboarding > step 2, labelled "STEP 1 OF 3" | WORKING | writes `lk_betaCodes`, `lk_betaStatus`, `lk_betaCode`, `lk_betaId` (on | none | Username uniqueness is claimed by the placeholder-style UX but never enforced; two devices can both be `alex_l |
| F-ONB-005 | Step 3 — Choose your units (kg / lbs) | Onboarding > step 3, labelled "STEP 2 OF 3" | WORKING | none yet — persisted only at `finish()` as `profile.useKg` (`:57351`) | none | — |
| F-ONB-006 | Step 4 — AI coach chat interview (auto-kickoff) | Onboarding > step 4, header "LOCKED AI COACH" / "Building yo | WORKING | none — **nothing in the chat is persisted** until `finish()` | see F-ONB-008 | — |
| F-ONB-007 | Step 4 — Answering questions (3-question loop, counter, send) | Onboarding > step 4 > composer bar | WORKING | none | F-ONB-008 | There is no limit on message length and no sanitisation of user text before it goes into the prompt (prompt-in |
| F-ONB-008 | Worker AI endpoint (`callWorker`) — the fetch at ~33857 | Onboarding internals (used by every AI call in the flow) | PARTIAL | none | **POST `https://lockedapi.cescocugliari.workers.dev/`** (roo | Hardcoded absolute Worker origin with no env indirection (`:33857`); the same host appears at `:2735`, `:2793` |
| F-ONB-009 | Chat system prompt (`getChatSys`) | Onboarding internals | WORKING | — | — | The ID whitelist is duplicated verbatim in `getGenSys` (`:33851` vs `:33841`) — two copies to keep in sync. Th |
| F-ONB-010 | Program generation + parsing (`getGenSys`, `tryParseProg`) | Onboarding internals, triggered on the 3rd answer | WORKING | none until finish | same endpoint as F-ONB-008 | — |
| F-ONB-011 | Program preview card (in-chat) | Onboarding > step 4 > assistant bubble carrying `m.prog` | PARTIAL | — | — | — |
| F-ONB-012 | Finish — SAVE MY PROGRAM | Onboarding > step 4 > fixed bottom bar, visible only when `d | WORKING | writes `lk_profile` (`:57352`); `lk_splits` via `setSplits` (App state | none | — |
| F-ONB-013 | Skip — "Skip - set up manually" | Onboarding > step 4 > two places | WORKING | writes `lk_profile` only | — | Steps 1–3 are NOT skippable; only the AI interview is. There is no back button on any step — `setStep` is only |
| F-ONB-014 | FOODS database | module scope, used by the Fuel/nutrition screens | WORKING | — | — | Entirely hardcoded; no barcode/API source. `unit` values mix `oz`, `cup`, `strip`, `bar`. |
| F-ONB-015 | `estimateMacros` — natural-language food parser | nutrition logging | PARTIAL | — | — | — |
| F-ONB-016 | `calcTDEE` | — | WORKING | — | — | `2200` is a hardcoded fallback with no user signal that the number is a guess. |
| F-ONB-017 | `calcMacros` | — | WORKING | — | — | hardcoded 80 kg default and a 50 g carb floor that silently breaks the calorie identity on aggressive cuts. |

## Auth — 14 features

`WORKING 12`  `PARTIAL 1`  `DEAD 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-AUTH-001 | Supabase client bootstrap | `126-297` (module IIFE), client created at `273-280`. | WORKING | session JSON under localStorage key `locked_session` (277). | — | — |
| F-AUTH-002 | Sign up | `380-384` (`signUp`), `1000-1059` (`_submitAuth` signup bran | WORKING | — | — | the exported `LOCKED.signUp` (1155) is the bare 380-384 version, which does *not* do the fallbacks — the UI us |
| F-AUTH-003 | Sign in | `386-411`. | WORKING | — | — | — |
| F-AUTH-004 | Sign out | `413-418`. | WORKING | — | — | — |
| F-AUTH-005 | Password change | `420-424` → `auth.updateUser({password:newPw})`. Exported as | WORKING | — | — | — |
| F-AUTH-006 | Password reset | `434-439` (`resetPassword`), `1096-1109` (`_forgotPassword`) | PARTIAL | — | — | — |
| F-AUTH-007 | Resend confirmation | `1096-1108`? no — `1096` is `_resendConfirmation` at `1098-1 | WORKING | — | — | — |
| F-AUTH-008 | Session restore on load | `299-325`. | WORKING | — | — | — |
| F-AUTH-009 | Guest / anonymous mode | `160-178` (`isGuestMode`, `enterGuestMode`), `330-341` (`_se | WORKING | — | — | — |
| F-AUTH-010 | Supabase `profiles` table read (App root) | `57222-57251`. - **Behavior (as written)**: 1. Runs once on  | DEAD | — | — | a redesign either exports the client or drops the path. Also note the outer guard means it never runs for a co |
| F-AUTH-011 | Auth overlay UI | `773-855` (`_buildAuthScreen`), `716-772` (`showOverlay`/`hi | WORKING | — | — | — |
| F-AUTH-012 | `getToken` / `headers` / `authHeaders` | `441-446` (`getToken`), `448-453` (`headers`), `2652-2662` ( | WORKING | — | — | — |
| F-AUTH-013 | Account deletion | `426-432`. | WORKING | — | — | — |
| F-AUTH-014 | Toast | `1111-1139`. Fixed above the nav (`--lk-nav-h + 12px`), gree | WORKING | — | — | — |

## Sync — 5 features

`WORKING 4`  `PARTIAL 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-SYNC-001 | Bidirectional cloud sync | `455-583` (`syncBidirectional`), `585-593` (`reloadIfPulled` | WORKING | — | — | — |
| F-SYNC-002 | The sync key set & write timestamping | `183-231` (`SYNC_KEYS`), `233-238` (`MC_SYNC_KEYS`/flag), `2 | WORKING | — | — | — |
| F-SYNC-003 | Cycle-tracking opt-in sync | `233-238`, `1170-1198`. | WORKING | — | — | — |
| F-SYNC-004 | Beta data sync (`/beta-sync`) — separate, legacy channel | `2794` (`SYNC_URL`), `2800-2832` (`syncBetaData`), `2833-284 | WORKING | — | — | this is a *one-way upload* and entirely separate from F-SYNC-001. Nothing is pulled back. |
| F-SYNC-005 | Deploy-version check / cache bust | `78-96` (`checkDeployVersion`). | PARTIAL | — | — | — |

## Paywall — 4 features

`WORKING 3`  `DEAD 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-PAY-001 | The paywall sheet | `655-847`? — `showPaywall` at `655-843`, `_paywallCard` at ` | WORKING | — | — | `_paywallCard` is a pure string-template helper (842-853). |
| F-PAY-002 | Entitlement fetch & the `can()` gate | `343-355` (`fetchSubscription`), `357-372` (`can`), `374-376 | DEAD | — | — | — |
| F-PAY-003 | Actual runtime gating — server-side 429 / `gated` | `2679-2686` (`aiCall` gated branch), `50075` and `50088-5009 | WORKING | — | — | — |
| F-PAY-004 | Trial banner | `628-653` (`checkTrialWarning`). | WORKING | — | — | — |

## Beta program — 4 features

`WORKING 3`  `UNSPECIFIED 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-BETA-001 | Beta code system | `2698` (`DEFAULT_BETA_CODES`), `2699-2721` (`initBetaCodes`) | WORKING | — | — | — |
| F-BETA-002 | Silent beta | `2795-2799`. | WORKING | — | — | — |
| F-BETA-003 | Activity & AI logging | `2772-2783` (`logBetaActivity`), `2784-2793` (`logBetaAI`). | WORKING | — | — | — |
| F-BETA-004 | Beta admin panel | component at `52806`, route at `57709-57711` (`screen === "b | UNSPECIFIED | — | — | — |

## Gamification — 3 features

`WORKING 3`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-GAME-001 | Streak counter (Home) | Home tab > dashboard streak card, and the profile header chi | WORKING | **derived, never persisted** — computed from `lk_history` (and supplem | the value is included in the push-subscription payload (1290 | 44 total `streak` matches break down as: 2 workout-streak computations (1458-1470, 26238-26251), 4 render site |
| F-GAME-002 | Badges (Progress screen) | Home tab > Progress screen > "Badges" grid | WORKING | **none** — badges are recomputed every render, never persisted, and no | none | the seven badges are First Rep (≥1 workout), 5 Workouts, 10 Workouts, 25 Workouts, First PR, 5 PRs, 100 Sets ( |
| F-GAME-003 | Streaks-and-badges master toggle | Profile tab > Settings > "Streaks and badges" switch, subtit | WORKING | `lk_gamingLayer`, **default false** (209, 32067) | none | the brief describes gamification as opt-*out*; the code ships it opt-*in* (default `false` at 32067, 26423, 26 |

## Misc widgets — 9 features

`WORKING 6`  `PARTIAL 3`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-MISC-001 | Refeed day suggestion card | Fuel tab > Fuel dashboard (macros screen) > card rendered un | PARTIAL | reads `lk_refeedDismissed`, `lk_refeedAccepted`, `lk_weightLog`, `lk_f | none directly; `logBetaActivity` side-channel only (37029, 3 | the "+Xg carbs" number is displayed only — nothing in this range or in `acceptRefeed` adds those carbs to the  |
| F-MISC-002 | Daily weigh-in card (body-weight logging + history) | Fuel tab > Fuel dashboard > "Daily Weigh-In" card, between t | WORKING | reads/writes `lk_weightLog` via `getWeightLog`/`addWeightEntry` (2909, | `logBetaActivity("weight_log", {kg, date})` inside `addWeigh | `addWeightEntry` upserts by date, so re-logging the same day overwrites (2915-2922). Unit conversion constant  |
| F-MISC-003 | Floating voice command button (capture) | Global — fixed floating button rendered app-wide whenever na | WORKING | reads `lk_voiceEnabled` (53702, 53706); reads/writes `lk_voiceBtnCorne | `POST https://lockedapi.cescocugliari.workers.dev/voice` (53 | no recording time cap and no max blob size — a long recording uploads unbounded. `MediaRecorder` is constructe |
| F-MISC-004 | Draggable/snapping voice button physics | Global floating button | WORKING | `lk_voiceBtnCorner` (default `"br"`) read at 53841/53848 and written a | none | the move/end listeners are re-registered on every `recording`/`processing` change (54023) — harmless but waste |
| F-MISC-005 | Voice command confirmation sheet | Global — bottom sheet over any screen after a voice capture | WORKING | none at this layer; writes happen in `executeVoiceAction` (see F-MISC- | none | `getActionLabel` for `log_meal` interpolates `d.name` with no fallback, so a malformed payload renders `Log "u |
| F-MISC-006 | Voice action execution (six intents) | Global — runs on Confirm from the voice sheet; also reachabl | WORKING | reads/writes `lk_fuelLog`, `lk_history`; reads `lk_profile`, `lk_fuelP | none | voice-logged workouts carry `exercises: []` and volume as a string (53570-53572). Cardio record uses `id: "w_" |
| F-MISC-007 | Voice enable/disable toggle | Profile tab > Settings > toggle "…" near the streaks toggle | WORKING | `lk_voiceEnabled`, default `true` (208, 32061, 53702) | none | none. |
| F-MISC-008 | First-run tutorial / onboarding walkthrough | Full-screen overlay (`zIndex: 2000`) over the whole app on f | PARTIAL | reads `lk_tutorialSeen` (57220); writes it at mount (54284-54286), on  | none | all copy is hardcoded in `STEPS` (54229-54275) and includes a claim the app does not support elsewhere — step  |
| F-MISC-009 | Barbell plate calculator | Train tab > active workout screen > Tools menu > "Plate Calc | PARTIAL | none — nothing is persisted; state resets every open (54928-54932) | none | there is no solver — the user stacks plates by hand; the shared `calcPlatesPerSide` at 5376+ and the inventori |

## Shared / design system — 9 features

`UNSPECIFIED 9`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-SHARED-001 | Style profile (theme) switching | ** boot script `:15-31`; theme engine `:2469-2540`; CSS them | UNSPECIFIED | ** `lk_theme` (JSON string). - **Network / AI:** none. | — | ** slate/navy/midnight override only a subset of tokens; they inherit the dark base `html{}` rule for accent/s |
| F-SHARED-002 | Text size (Dynamic Type) | ** boot script `:36-40`. | UNSPECIFIED | ** `lk_textScale` (raw integer string, **not** JSON — read with `parse | — | — |
| F-SHARED-003 | Storage-full recovery | ** `:2411-2467`. | UNSPECIFIED | ** all `lk_`-prefixed keys. | — | — |
| F-SHARED-004 | Error recovery screens | ** `ErrorBoundary` `:2540-2600`; `ScreenBoundary` `:2601-265 | UNSPECIFIED | — | — | — |
| F-SHARED-005 | Progress photo capture & compression | ** `resizeImage` `:2878-2905`, `saveProgressPhoto` `:2856-28 | UNSPECIFIED | ** `lk_progressPhotos`. **Network/AI:** none here. | — | — |
| F-SHARED-006 | Weight log & refeed trigger | ** `getWeightLog` `:2907`, `addWeightEntry` `:2910-2932`, `c | UNSPECIFIED | ** `lk_weightLog`, `lk_refeedDismissed`, `lk_refeedAccepted`. - **Edge | — | — |
| F-SHARED-007 | Keyboard-aware chrome & zoom lock | ** `:41-68` (boot), `:1240` (`html.lk-kb-open nav{display:no | UNSPECIFIED | — | — | — |
| F-SHARED-008 | Deploy-version cache bust | ** `:76-116`. | UNSPECIFIED | — | ** the Worker. **Storage:** `lk_deployVersion` (raw string). | — |
| F-SHARED-009 | Progress throwback | ** `throwbackForced` `:4594`, `computeThrowback` `:4597-4662 | UNSPECIFIED | — | — | — |

## Storage — 2 features

`WORKING 2`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-STOR-001 | Storage layer (`ld` / `sd` / `lkStorageUsage`) | `2409-2413` (`storageAvailable` probe), `2414-2423` (`ld`),  | WORKING | — | — | — |
| F-STOR-002 | Schema migrations | `migratePrDates` 2349-2387 (scheduled at 2388 `setTimeout(…, | WORKING | — | — | — |

## System — 16 features

`WORKING 11`  `PARTIAL 2`  `UNSPECIFIED 2`  `DEAD 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-SYS-001 | Service worker registration | `<head>` inline boot script | WORKING | — | — | — |
| F-SYS-002 | PWA manifest and iOS install metadata | — | WORKING | — | — | — |
| F-SYS-003 | Install prompt (`beforeinstallprompt`) | — | DEAD | — | — | — |
| F-SYS-004 | Deploy-version check and cache bust | `<head>` boot script | WORKING | reads/writes `lk_deployVersion` (`:79`) | GET `/app-version`, response `{version}` | — |
| F-SYS-005 | Zoom lock | — | WORKING | — | — | — |
| F-SYS-006 | Push notification module (`window.LOCKEDPush`) | IIFE in `<head>`, `:1278-1953` | WORKING | `lk_pushDeviceId` (`:1307`), `lk_pushPrefs` (`:1308`), `lk_pushEnabled | `POST /push/subscribe`, `/push/unsubscribe`, `/push/prefs`,  | The device id is deliberately excluded from cloud sync — "Notifications are a property of this phone, not of t |
| F-SYS-007 | Notification preferences and scheduling | — | WORKING | `lk_pushPrefs`, `lk_pushEnabled`; reads `lk_profile`, `lk_splits`, `lk | — | **All scheduling is server-side.** There is no client-side `setTimeout`-based notification. A hard limitation  |
| F-SYS-008 | Notifications settings UI (`NotificationsCard`) | Settings/Profile screen | WORKING | — | — | — |
| F-SYS-009 | Service worker → app messaging and push deep links | — | WORKING | — | — | — |
| F-SYS-010 | Boot self-heal for push subscriptions | — | WORKING | — | — | — |
| F-SYS-011 | `ErrorBoundary` — whole-app crash screen | wraps `<App/>` at the React root | PARTIAL | — | — | "Check browser console (F12)" is wrong guidance for a mobile-first PWA (`:2583`). No error reporting/telemetry |
| F-SYS-012 | `ScreenBoundary` — per-screen crash containment | — | PARTIAL | — | — | `ErrorBoundary` (app-level) and `ScreenBoundary` (screen-level) are near-duplicate logic with different copy — |
| F-SYS-013 | Loading and empty-state patterns | — | WORKING | — | — | — |
| F-SYS-014 | Event listeners at a system level (54 `addEventListener` calls) | — | UNSPECIFIED | — | — | — |
| F-SYS-015 | Timers at a system level | — | UNSPECIFIED | — | — | — |
| F-SYS-016 | Beta data collection and sync (touched by onboarding) | — | WORKING | — | — | `isSilentBeta()` altering behaviour for a specific named tester is a hardcoded per-user branch (`:2793`). ---  |

## App root & navigation — 10 features

`WORKING 9`  `PARTIAL 1`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-ROOT-001 | App root component & global state | `redesign/input/locked-current-v6.html:57186-58006` | WORKING | via `ld`/`sd` — `lk_profile`, `lk_splits`, `lk_prs`, `lk_history`, `lk | only the profiles read at 57225-57250 (see F-AUTH-010). | no Context/Provider anywhere — all state is prop-drilled into screens. |
| F-ROOT-002 | Tab routing & screen switching | `57589-57736` (`renderTab`), `57531-57552` (`go`). | WORKING | none for routing (screen is not persisted — reload always lands on `ho | — | — |
| F-ROOT-003 | Bottom navigation bar (`Nav`) | `7652-7758` (component), `57957-57961` (usage). | WORKING | — | — | — |
| F-ROOT-004 | In-progress workout banner | `57556-57587` (height publishing), `57856-57903` (render). | WORKING | — | — | — |
| F-ROOT-005 | Resume-workout dialog | `57262-57267` (trigger), `57761-57855` (render). | WORKING | — | — | — |
| F-ROOT-006 | Notification / deep-link routing | `57466-57500`. | WORKING | — | — | — |
| F-ROOT-007 | Workout lifecycle in the root | `57405-57461`. | PARTIAL | — | — | — |
| F-ROOT-008 | Onboarding completion | `57347-57404`. | WORKING | — | — | — |
| F-ROOT-009 | Mount, ErrorBoundary and CDN fallback | `58007-58015`. | WORKING | — | — | — |
| F-ROOT-010 | Shell chrome (status-bar scrim, toasts, voice button) | `57737-57760`, `57962-58005`. | WORKING | — | — | — |

## Goals — 8 features

`WORKING 5`  `PARTIAL 3`

| ID | Feature | Location | Status | Storage | Network | Notes |
|---|---|---|---|---|---|---|
| F-GOAL-001 | Goals list (active + completed) | Progress tab > Goals sub-tab > GoalsTab list view | WORKING | reads `lk_goals` (`:26998`) - Network / AI: none in list view | — | `idx` is derived by `goals.indexOf(goal)` (`:28152`) — two structurally identical goal objects are distinct re |
| F-GOAL-002 | Goal progress computation | Progress > Goals (all views) | PARTIAL | — | — | `toKg` (`:27036-27038`) is defined and never called anywhere in range — dead code. `getProgress` also silently |
| F-GOAL-003 | Create / edit a goal | Progress > Goals > "NEW GOAL" button, or detail > edit penci | PARTIAL | writes `lk_goals` on every mutation via `setGoals` → `sd` (`:27026`);  | `logBetaActivity` (`:2772`) — see F-GOAL-007 | the button's `background`/`color`/`cursor` styles use a *different* condition than `disabled` — `color` and `c |
| F-GOAL-004 | Goal detail view (ring, start/current/target, deadline, notes) | Progress > Goals > goal card → detail | PARTIAL | writes `lk_goals` | — | `pct >= 100` is also used for the ring text color at `:27563` where `pct` may be null. Goal completion is only |
| F-GOAL-005 | AI goal progress analysis | Progress > Goals > detail > "Analyse My Progress" / "Refresh | WORKING | reads `lk_coachInstructions` (`:27230`) | `POST https://lockedapi.cescocugliari.workers.dev/` with `{s | no re-entrancy guard — unlike `getAiBfEstimate`, `getGoalAiAnalysis` has no `if (aiLoading) return`, but the b |
| F-GOAL-006 | Body Fat Log (manual entry, method chips, history) | Progress > Goals > "📐 Body Fat Log" button → BF log screen | WORKING | reads/writes `lk_bfLog` (`:26977`, `:26989`) | `logBetaActivity` only | the comment at `:27170-27173` documents the historical bug — a lone "." passed the input sanitiser and stored  |
| F-GOAL-007 | AI body fat estimate | Progress > Goals > Body Fat Log > "AI Body Fat Estimate" | WORKING | reads `lk_progressPhotos` (`:27195`), `lk_weightLog`, `lk_bfLog` | same worker endpoint as F-GOAL-005 (`:2664`) | the comment at `:27188-27190` documents the original bug — no disabled state meant three taps burned three dai |
| F-GOAL-008 | Beta activity telemetry from Goals | Progress > Goals (background) | WORKING | — | — | goal names and body-fat percentages are included in the payloads (`:27140`, `:27183`) — user-identifying healt |
