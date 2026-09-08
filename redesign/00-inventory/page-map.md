# LOCKED v6 Page Map

Source: `input/locked-current-v6.html` (58,015 lines). All line refs are to that file. Storage helpers: `ld(k, fb)` L2417 reads `localStorage["lk_"+k]` as JSON; `sd(k, v)` L2435 writes JSON. Keys below are written without the `lk_` prefix when they go through `ld`/`sd`; raw keys are marked.

## 1. App shell

### Boot sequence and gating

| Order | Gate | Code | Passes when |
|---|---|---|---|
| 1 | Head script applies theme before paint | L20-L28 | `lk_theme` JSON string (`"dark"`, `"light"`, `"slate"`, `"navy"`, `"midnight"`); absent falls back to `prefers-color-scheme` L21, so an unthemed headless run may render **light** |
| 2 | Head script applies text scale | L38 (`lk_textScale`, parseInt, default 100) | — |
| 3 | Deploy-version check fetches `WORKER + "/app-version"` and hard-reloads on change | L69-L100 | `lk_deployVersion` raw string; fetch failure is caught, no reload |
| 4 | Pre-React auth overlay (DOM, not React): `showOverlay()` L770 unless a Supabase session exists or `isGuestMode()` | L165-L167, L294, L325 | `localStorage.getItem("lk_guestMode") === "1"` — raw string `1`, **not** JSON `"1"` |
| 5 | Guest entry path from overlay: "Continue without account" L885 → guest modal L894 → "CONTINUE AS GUEST" L910 → `enterGuestMode()` L168 seeds `lk_profile` `{displayName:"Athlete",username:"athlete",useKg:true,createdAt}` L172-L176 and reloads L179 | | |
| 6 | React `App()` L57186: `if (!profile || !profile.displayName || !profile.username) return Onboarding` | L57555-L57557 | `lk_profile` JSON with non-empty `displayName` and `username` |
| 7 | `TutorialOverlay` shown when `!ld("tutorialSeen", false)` | L57218-L57220, L57751 | `lk_tutorialSeen` = `true` |
| 8 | Resume dialog when `lk_activeWorkout` non-null on mount | L57265-L57269, L57761-L57840 | `lk_activeWorkout` absent or `null` |
| 9 | Guest subscription: `can()` returns true for guests, no paywall | L332, L361 | — |

Minimum to land on Home as a guest with no overlays: `lk_guestMode`=`1` (raw), `lk_profile`=`{"displayName":"Cesco","username":"cesco","useKg":true,"createdAt":"9/8/2026"}`, `lk_tutorialSeen`=`true`, no `lk_activeWorkout`. Add `lk_theme`=`"dark"` for dark screenshots. Setting only `lk_guestMode` shows the React Onboarding splash ("GET STARTED" L34217) because gate 6 fails.

### Router

| Item | Code |
|---|---|
| Route state `screen` (string) | `useState("home")` L57204 |
| Values | `home`, `workout`, `review`, `train`, `cardio`, `profile`, `settings`, `cycletrack`, `progress`, `fuel`, `shopping`, `betaAdmin`, `coach` (`renderTab` L57586-L57734) |
| `go(scr)` | L57534-L57553; tapping the active tab dispatches `lockedTabReset` L57538; top-level tabs `["home","train","fuel","coach","profile"]` replace the nav-stack root L57545, others push + `history.pushState` L57549 |
| Back (popstate) | L57521-L57532 |
| Deep links `?open=checkin|workout|fuel` and SW `lockedPushOpen` | L57483-L57510 |
| Every screen wrapped in `ScreenBoundary` (error UI "Something went wrong on this screen", reload button) | L2601, L2628, L2636, L57731 |
| Root `ErrorBoundary` | L2540, L58001 |
| Shell `max-width: 420` | L57843 |
| WorkoutLog stays mounted while `workoutActive` and is hidden with `display:none` off the workout screen | L57904-L57912 |
| `--lk-top-off` published from banner height | L57567-L57583 |
| Nav hidden on `review` | L57584 |

### Nav tab bar

`Nav` L7652 (React.memo). Tabs L7673-L7692 in order: `home` "Home", `train` "Train", `fuel` "Fuel", `coach` "Coach", `profile` "Profile". `onClick: p.go(t.id)` L7720; `aria-current="page"` L7723; publishes `--lk-nav-h` (L7657-L7670). Active mapping L57958: `workout`/`cardio`→train, `settings`/`betaAdmin`→profile, `progress`/`cycletrack`→home, `shopping`→fuel.

### Global components

| Component | Def | Shown when | Notes |
|---|---|---|---|
| Nav | L7652 | `showNav` (screen ≠ review) L57584, L57957 | gradient scrim above it L57944 |
| Onboarding | L33808 | profile incomplete L57555 | steps: 1 splash "LOCKED"/"GET STARTED" L34018-L34217; 2 name+username L34227; 3 units L34333; 4 AI program builder L34487 (fetch worker L33857, "SAVE MY PROGRAM" L34670). `onComplete({displayName,username,useKg}, prog)` L34012 → `completeOnboarding` L57343 writes profile and optional splits, `setScreen("home")` L57405 |
| TutorialOverlay | L54228 | `showTutorial` L57751 | 7 STEPS L54229-L54272; phases intro→steps L54273; `onDone` writes `tutorialSeen` L57757; replay from Settings L33629 (`onShowTutorial` L57673) |
| VoiceButtonWrap / VoiceButton | L53700 / L53718 | `showNav && profile` L57960; returns null when `ld("voiceEnabled", true)` false L53702-L53716 | POST `/voice` L53766; draggable corner saved to `voiceBtnCorner` L53997; writes history via `sd("history")` L53565/L53575 and dispatches `lockedHistoryUpdate` (App re-reads L57468) |
| Voice toast `#lockedVoiceToast` | L57961 | always mounted, opacity 0 | |
| "Saved" toast | L57987 | `showSaveToast` 2.5 s after `saveWorkout` L57446-L57449 | |
| `showToast` (DOM, `window.LOCKED.toast`) | L1122, export L1208 | 44 call sites; storage-full toast L2444 | not React |
| Active-workout banner | L57857-L57900 | `workoutActive && !onWorkoutScreen` L57559-L57560 | shows `workout.name + " in progress"`, rest countdown from `lockedRest` event L57436-L57441 / L10598; tap → `setScreen("workout")` L57863 |
| Resume dialog (portal) | L57761-L57840 | `showResumeDialog && workout` | "Start Fresh" two-step discard L57798, "Resume" L57826 |
| Status-bar scrim | L57737 | always | |
| Pre-React auth overlay | `showOverlay` L770, HTML L882-L913 | no session and not guest | |

### Network calls (all fire in guest mode; no guest check inside them)

| Call | Def | Used by |
|---|---|---|
| `aiCall(sys,user,onLoad,onDone,onFail)` POST `lockedapi.cescocugliari.workers.dev/` | L2663 | WorkoutLog L13586, Review L16108, GoalsTab L27204/L27234, Recipes L40808/L40835/L41400, CycleTab L47623, nutrition L19588 |
| Direct POST worker `/` | — | AISplitBuilder L13993, ProactiveTipCard L17904, Onboarding L33857, CoachInterview L49772, CoachScreen L50063, Budget L44302/L44340, Fuel L36684/L37502/L37621/L45289 |
| `/analyze-physique` | L30626 | ProgressPhotos |
| `/exercise-detail/:id`, `/yt-search` | L7090, L7070 | ExerciseDetailModal (yt cache key `yt3_<name>` raw L7067) |
| `/store-search`, `/parse-receipt` | L42458, L44083 | ShoppingTab, BudgetTab |
| `/voice` | L53766 | VoiceButton |
| `/beta-validate`, `/app-version`, `/user/*`, `/push/*` | L2735, L84, L346-L558, L1557-L1596 | beta, boot, sync (signed-in only L466), push |
| Supabase `profiles` select | L57229 | App mount, only when profile incomplete L57223 |
| `syncBidirectional` after save | L57460 | no-ops when `!_session` L467 |

Loading/error states in guest mode exist only around these calls; page data itself is synchronous from localStorage, so no page has a data-loading state. Aborting the worker route in the harness produces the error branches cited per page.

## 2. Pages

Legend for states: E = empty, L = loading, X = error, P = populated. "n/a" means the code has no such branch.

### 2.1 home — HomeScreen L26220, DynamicFeed L17998, QuickActionsRow L26141

| Aspect | Detail |
|---|---|
| Entry | default `screen="home"` L57204; Nav Home; `p.go("home")` from Progress L28594, Cycle L25149/L25173/L25339; after save L57459; Review discard L57601 |
| Blocks | `HOME_BLOCK_DEFS` L26019-L26061 ids in default order: `stats`, `insight`, `quick`, `feed`, `start`, `supps`, `cycle`, `progress`, `recap`, `throwback`, `restock`, `calendar`, `recent`, `cycletrack`. Layout from `getHomeLayout()` L26065 (`lk_homeLayout` `{order,hidden,quick}`); renderers keyed by id L26547-L26816; rendered via `layout.order.map` L26905, hidden ids skipped L26906 |
| Exits | `start` card → `p.go("train")` L26636; `progress` card → `p.go("progress")` L26675; "See all" → `p.go("train")` L26836; empty-splits "Create a Split" → `p.go("train")` L26937; recent workout row → `setSelectedWorkout(w)` L26854 → `WorkoutDetail` inline L26278 (`onBack` L26282); `recap` → `setShowRecap(true)` sheet L26705; QuickActionsRow `go` targets L26091-L26121 (`food`/`weight`/`supps`→fuel, `checkin`→coach with `__lockedCoachPane="check-in"` L26158, `workout`/`cardio`→train, `pr`→progress; `water` logs inline via `quickLogWater` L26124); DynamicFeed cards → `go("coach")` L18110, `go("train")` L18320/L18381; CycleTrackerCard → `p.go("cycletrack")` L22650/L22681/L22735 |
| E | `lk_history=[]`: stats zeros, `recent` hidden (`history.length > 0` L26817), `lk_splits=[]` shows "Set up your first split" L26913-L26949; Feed returns null when no cards L18087; QuickActionsRow null when `layout.quick` empty L26146 |
| L | only `insight` (ProactiveTipCard): `loading` true when `lk_proactiveTip.date !== today` L17862, fires POST L17904 |
| X | ProactiveTip fetch catch L17930 → loading false, no tip; ThrowbackCard null unless `computeThrowback` L4606 finds ≥30-day-old data with progression (anchors L4617) and `lk_throwbackDismissed` older than 3 days L4610; force with raw `lk_throwbackForce=1` L4604 |
| P | `lk_history` ≥1 entry, `lk_splits` ≥1, `lk_feedback` entry for today toggles feed card L18060-L18066; consecutive ≥4 days L18070; ≥3 days idle L18075; next split day L18081; `lk_gamingLayer=true` shows streak badge L26423/L26510; `cycletrack`/`cycle` blocks only when `isFemaleUser` L26579/L21946 (`profile.sex==="female"` or `lk_fuelProfile.sex`) |
| Data | history, splits, prs, profile, homeLayout, feedback L18003, gamingLayer, proactiveTip, throwbackDismissed, weightLog/progressPhotos (throwback L4615), fuelLog L17872, fuelProfile L17889, budgetData L17896, bfLog L26977 |

### 2.2 progress — ProgressPage L28323, GoalsTab L26992

| Aspect | Detail |
|---|---|
| Entry | Home `progress` card L26675; quick action `pr` L26116 |
| Tabs | `useHubState("progressTab")` L28324 → `lk_ui_progressTab`: `overview`, `goals`, `calendar`, `photos`, `prs`; tab bar L28616 labels Overview/Goals/Calendar/Photos/PR Vault |
| Exits | back `p.go("home")` L28594; `prs` renders PRHub L28438 with `onBack → setTab("overview")` L28449; `photos` renders ProgressPhotos L29158 |
| Sub-UI | add featured lift sheet `showAddLift` L28334 (writes `featuredLifts` L28345); calendar month state L28384; GoalsTab views `list`/`add`/`detail` L27004, L27810, L27441; body-fat log sheet `showBfLog` L27019 |
| E | overview: `featuredIds.length===0` L28656, weight trend text "Log your body weight in the Fuel tab" L28934 when `lk_weightLog=[]`, available lifts empty L28566; goals: `goals.length===0` L28113 |
| L | GoalsTab AI only: `aiLoading` L27007 (L27213), `bfAiLoading` L27021 (L27192) |
| X | `aiCall` onFail paths in GoalsTab L27204/L27234 (text fallback); no page-level error |
| P | `lk_featuredLifts` ids with matching `lk_prs`/`lk_history`; `lk_weightLog` ≥2 points; `lk_goals` ≥1; `lk_progressPhotos` for Photo strip L29158; throwback L28645 |
| Data | history, prs, featuredLifts, weightLog L28340, progressPhotos L28341, goals, bfLog L27001, coachInstructions L27231 |

### 2.3 pr-vault — PRHub L29165

| Aspect | Detail |
|---|---|
| Entry | Progress tab `prs` L28438 (props `prs`, `setPrs`, `history`, `useKg`, `onBack`); no other route |
| Sub-tabs | `tab` L29178 `overview` L29771 / `prs` L29966; `prRange` L29176; exercise detail `sel` L29175; manual "LOG A PR WITHOUT A WORKOUT" `logging` L29177, L30023 (`logEx` default `"107"` L29179) |
| Exit | header back `p.onBack` L29726 |
| E | `last7.length===0` L29827 ("Last 7 Days"), `withPRs.length===0` L30023 |
| L/X | n/a (no network) |
| P | `lk_prs` `{ "<exId>": [{r,w,date}] }` with dates within 7 days for the overview strip; `lk_history` for volume |

### 2.4 photos — ProgressPhotos L30585

| Aspect | Detail |
|---|---|
| Entry | Progress tab `photos` L29158 |
| Sub-UI | add photo (file input, `saveProgressPhoto` L2856), `lightbox` L30591 (Escape L30597), `analysis`/`analysing` L30592-L30593, compare `addTarget` L30598 |
| E | `photos.length===0` L30891 |
| L | `analysing` while POST `/analyze-physique` L30626 |
| X | fetch catch after L30626; storage-full: `sd` returns false L2868 → toast L2444 |
| P | `lk_progressPhotos` `[{date ISO, note, thumb base64}]` |
| Data | progressPhotos, profile L30625, history L30638, splits L30639 |

### 2.5 cycle — CycleTrackerScreen L25108 (McOnboarding L22751, McLogSheet L23147, McCalendar L23754, McSettings L24066)

| Aspect | Detail |
|---|---|
| Entry | Home CycleTrackerCard `p.go("cycletrack")` L22650/L22681/L22735; McTrainBanner L25078 |
| Gates | not female → message "Cycle tracking appears when your sex is set to Female" L25168 with back L25149; `!mcp || !mcp.setup` → McOnboarding L25171 (`onBack` home L25173, 5 steps L22760, writes `mcProfile` L22773) |
| Views | `view` `cycle`/`calendar` toggle L25359; `sheetDate` → McLogSheet L25985 (writes `mcDays[iso]` `{flow,sym,mood,note,ev}` L23151-L23736); `showSettings` → McSettings L25995 (cloud toggle `lk_mcCloudSync` raw `1` L1178; delete-all removes `lk_mcProfile`, `lk_mcDays` L26009-L26010); `eduOpen`, `energyBar`, `preview` L25118-L25120 |
| Exit | back `p.go("home")` L25339 |
| E | `lk_mcDays={}`: today card unlogged L25511; insights empty L25866 |
| L/X | n/a |
| P | `lk_profile.sex="female"`, `lk_mcProfile.setup=true` with `lastStart`, `lk_mcDays` entries |
| Data | mcProfile, mcDays, history L25184, fuelLog L26125, homeLayout L26066 |

### 2.6 train-hub — TrainHub L15013

| Aspect | Detail |
|---|---|
| Entry | Nav Train; Home L26636/L26836/L26937; Feed L18320/L18381; McTrainingCard L24716; `?open=workout` without active workout L57496 |
| Tabs | `useHubState("trainTab")` L15025 `splits`/`history`/`library` (`lk_ui_trainTab`); `useHubState("trainView")` L15026 `main`/`create`/`edit`/`library`/`aibuilder` (`lk_ui_trainView`); tab bar L15374 (Library tab sets `view="library"` L15378); tab reset on re-tap L15027 |
| Sub-screens | SplitBuilder L15037 (`create` L15514/L15589, `edit` L15826 via `editSplit` L15028); ExLib L15056 (view) and inline L15958; AISplitBuilder L15063 (L15528/L15568); WorkoutDetail L15074 when `selectedWorkout` L15035 set from history row L15902; day modal `dayModal` L15029 (Escape L15033) → `p.onStart({name: split+" - "+day, exIds, blocks})` L15215; "Quick Workout" `p.onStart({name:"Quick Workout",exIds:[]})` L15273/L15354; recent-repeat L15434; cardio button `p.onCardio()` L15333 → `setScreen("cardio")` L57628; AdaptiveTrainingCard L15961 when history>0; `splitsExpanded` toggles L15021 |
| E | `p.splits.length===0` "No splits yet" L15468-L15496; history tab empty L15872 with "go to splits" L15883; day with no exercises L15768 |
| L/X | n/a in hub itself (AISplitBuilder has its own) |
| P | `lk_splits` ≥1 with `days[].exIds`; `lk_history` ≥1 |
| Data | splits, history, splitsExpanded, customs, prs, profile |

### 2.7 workout-log — WorkoutLog L10013, NumPad L9847, PlateCalc L54925, ExerciseActionSheet L7496, ExerciseDetailModal L7202, ReplacePanel L8625

| Aspect | Detail |
|---|---|
| Entry | `startWorkout(info)` L57398 → `sd("activeWorkout")` L57258, `setScreen("workout")` L57404 (or `review` if `lk_activeWorkoutRows` saved); resume dialog "Resume" L57826; banner tap L57863; `?open=workout` with active workout L57496 |
| Mount | rendered whenever `workoutActive` L57904, hidden off-screen L57906; Nav still visible (active=train) |
| Views | `view` L10427: `log`; `add` → ExLib L11388; `replace` → ReplacePanel L11418 (`repIdx` L10428) |
| Sheets/modals | NumPad `numpadTarget` L13714 (openers L12627-L13393); PlateCalc `showPlateCalc` L11439 (L12029); ExerciseActionSheet `actionMenu` L11649 opened by long-press L10319 (hold tip `holdTipSeen` L10323); ExerciseDetailModal `showExDetail` L11644; block modal `blockModal` L10445; rest settings `restSettingsOpen` L10444 (writes `restEnabled` L11515, `activeWorkoutRestTarget` L11555); tools `showTools` L10459; idle prompt L10483; superset pick L10934; reorder `wiggleMode` L10936; unit toggle L12055 |
| Exits | Finish → `p.onFinish(rows, sec)` L11636/L12108 → `finishWorkout` L57417 → `review`; Discard → `p.onDiscard` L12091 → home L57930; Nav tap leaves workout running (banner) |
| E | `rows.length===0` "No exercises yet" L12132-L12143 (Quick Workout) |
| L | `aiRecBusy` L10431 during `aiCall` L13586 (AI set recommendation) |
| X | aiCall onFail after L13586; no page-level error |
| P | `lk_activeWorkout` `{name, exIds:[numbers], blocks:[]}`; rows prefilled from last session in `lk_history` L10040-L10070 (`rir` default `"2"`); persisted to `lk_activeWorkoutRows`/`lk_activeWorkoutSec` on change L10686-L10687 |
| PR detection | L10760-L10800 writes `prs[exId]` `[{r, w(kg-normalised by `storedWeightUnit()` L10768), date isoDay}]` |
| Data | activeWorkout*, restEnabled, hidePartials L13470, holdTipSeen, history, prs, exNotes L7116, exequip_<id> L7048, customs |

### 2.8 review — Review L15965

| Aspect | Detail |
|---|---|
| Entry | `finishWorkout` L57417 (`screen="review"`, Nav hidden L57584); `startWorkout` when `lk_activeWorkoutRows` exists L57404 |
| Steps | `step` L15970: `summary` L16137 → "reflect" L16321/L16348 (ratings L15976, note L15969) → `ai` L16066 (`aiCall` L16108, `aiLoading` L15984) |
| Exits | Save → `p.onSave(rec)` L16050 → `saveWorkout` L57425 (prepends to history, clears activeWorkout*, "Saved" toast, home L57459); Discard (armed) L16011/L16593 → `onDiscard` L57592 → home |
| E | no completed sets: `done.length===0` L16250 |
| L | `aiLoading` during insight |
| X | aiCall fail → insight text empty; record still saves with `aiInsight:null` L16062 |
| P | needs live `finRows` from WorkoutLog; seed via `lk_activeWorkout` + `lk_activeWorkoutRows` (rows with `sets[].done=true`) + `lk_activeWorkoutSec` then start any workout → routes to review L57404 |
| Data | profile L16085/L16090, coachInstructions L16088, feedback L16097; writes history |

### 2.9 workout-detail — WorkoutDetail L17084, ConvertToSplitModal L16622

| Aspect | Detail |
|---|---|
| Entry | Home recent row L26854 → L26278; TrainHub history row L15902 → L15074 |
| Modes | `editing` L17088 (name L17090, note L17091, exercises L17092); `showConvert` → ConvertToSplitModal L17846 (`mode` new/existing L16625; `onConvert` L16651/L16670 → `onConvertToSplit` L17854 → TrainHub L15101) |
| Exits | back `p.onBack` L17532 (Home L26282, TrainHub L15078); delete via `setHistory` filter L26296 |
| E | `eExercises.length===0` L17503 |
| L/X | n/a |
| P | history entry with `exercises[].sets[]`, `blocks`, `reflection`, `note`, `aiInsight` L17846 |

### 2.10 exercise-library — ExLib L7761

| Aspect | Detail |
|---|---|
| Entry | TrainHub Library tab L15958 (inline) / view L15056; WorkoutLog add L11388; SplitBuilder pick L9216; `onBack` L8495 |
| State | `grp`/`sub`/`q` filters L7762-L7764; `showCreate` custom exercise L7765-L7771 → `p.onCustom({id,name,eq,gid,sid,custom:true,startResist,smithNoCB})` L8149-L8165 → `addCustom` L57305 writes `customEx`; `selectedDetail` → ExerciseDetailModal L7856 (GET `/exercise-detail/:id` L7090, yt search L7070) |
| E | `res.length===0` L8290 |
| L/X | ExerciseDetailModal fetch only |
| P | built-in `ALL_EX` L4258 (numeric ids, e.g. 107 L3013) + `lk_customEx` L4278 |

### 2.11 split-builder — SplitBuilder L8782, AISplitBuilder L13956, ConvertToSplitModal L16622

| Aspect | Detail |
|---|---|
| Entry | TrainHub create L15514/L15589, edit L15826, AI L15528/L15568; Convert from WorkoutDetail L17846 |
| SplitBuilder | `name` L8784, `days[].items` (`{type:"ex",id}` / `{type:"block",...}`) L8786-L8805; `view` build/pick L8808 (ExLib L9216); rename day L8809; drag L8811; save disabled until name and ≥1 day L9820; `p.onSave({id, name, days:[{name, exIds, blocks}], created})` L9188-L9213 → TrainHub L15043-L15051; back L9248/L9834 |
| AISplitBuilder | `mode` L13957 (`pick`…), chat `msgs` L13958, POST worker L13993 (`aiLoading` L13960), photo analysis L14159 (`photoLoading`), `onSave(newSplits)` L14209 (shape L14185-L14208), back L14229 |
| E | day items empty "No exercises yet" L9424-L9430 |
| L | AISplitBuilder `aiLoading`/`photoLoading` |
| X | AISplitBuilder fetch catch after L13993 |
| P | `lk_splits` entry for edit |

### 2.12 cardio — CardioSection L56216, CardioLogFlow L56343, CardioHistory L55924, CardioFavorites L55550

| Aspect | Detail |
|---|---|
| Entry | TrainHub cardio button L15333 → `screen="cardio"` L57628; Nav active = train L57958 |
| Tabs | `TABS` L56229 `favorites`/`log`/`history`; initial tab L56217 (favorites when any exist else log); LogFlow `step` L56345, summary `saved` L56371; `onSave(rec)` → prepend history L57648; `onDone` → history tab L56283 |
| Exit | back `p.onBack` L56244 → `setScreen("train")` L57640 |
| E | history "No cardio yet" L55931-L55936; favorites empty L55601 |
| L/X | n/a (no network) |
| P | `lk_history` entries with `type:"cardio"` L56434; `lk_cardioFavorites` |
| Data | history, cardioFavorites L5821, cardioPrefs L5645, profile/fuelProfile/weightLog for body mass L56377 |

### 2.13 coach-chat — CoachScreen L49915 (`coachTab==="chat"`)

| Aspect | Detail |
|---|---|
| Entry | Nav Coach; Feed L18110; quick action `checkin` L26101 (+pane L26158); `?open=checkin` L57488-L57491 (`window.__lockedCoachPane`, event `lockedCoachPane` L49949-L49955) |
| Panes | `coachTab` L49943: `chat`, `plan`, `check-in`, `instructions`; bar L50912 labels Chat/Plan/Check-In/Setup; unread dot when no check-in today L50916 |
| Chat | `msgs` from `lk_coachLastMsgs` L49916 (persist last 40 L49927); `send()` L50330 appends `{role:"user",text}` L50337, `histRef` `{role,content}` L50339; `fireRequest` POST L50063 with `messages: histRef.current` L50069; reply `{role:"assistant", text, split, recipe, goal, food, cardio, remembered, plan}` L50314-L50322; detected cards → `saveCoachSplit` L50341, `saveCoachPlan` L50518, `coachRecipes` L50399, `goals` L50441, `fuelLog` L50504, `shoppingApproval` L50305; `receiptOpen` L49968; edit message L50126; retry L50112; "Jump to latest" L52071; clear chat L49940 |
| E | `msgs.length===0` suggestion state L51255 |
| L | `loading` L49920 → typing indicator L52031 |
| X | catch L50081 appends `{role:"assistant", error:true, errKind, text}` L50098; retry button L51408 |
| P | `lk_coachLastMsgs` non-empty (+ `lk_coachLastHist` for context) |

### 2.14 coach-plan — CoachScreen `coachTab==="plan"` L50957

| Aspect | Detail |
|---|---|
| Entry | Plan tab L50912 |
| Content | `plan` from `lk_coachPlan` L50012; phases progress L50539-L50560 (`startDate`, `phases[].weekStart/weekEnd/targets[{name,value}]`); `phaseOpen` L49976; "ask coach to change" → chat L51035/L51208 |
| E | `!plan` "No plan yet" L50967 with CTA to chat L50975 |
| L/X | n/a |
| P | `lk_coachPlan` `{name, description, startDate, phases:[], created, updatedAt}` L50520-L50527 |

### 2.15 coach-setup — CoachSetupPane L49483, CoachInterview L49750 (`coachTab==="instructions"` L50946)

| Aspect | Detail |
|---|---|
| Content | style picker `COACH_STYLES` L48950 ids direct/warm/technical/teacher/hype/athlete/physio → `coachStyle` L49576; memory toggle `coachMemoryOn` L49606; memory items `coachMemory` L49660 (`{text, src, date}`); data prefs `coachDataPrefs` L49494 (keys L48931: training,nutrition,weight,checkins,supplements,cycle,bodyfat,goals,plan); instructions textarea `coachInstructions` L50025; coach name `updateProfile({coachName})` L49962; Interview `onInterview` L50956 → CoachInterview L52185 |
| CoachInterview | `phase` ask/writing/preview/error L49754; POST L49772; `.catch` → `error` L49790; save → `coachInstructions` L50036; close L49806/L49818 |
| E | memory on and empty L49650 |
| L | interview `writing` |
| X | interview `error` phase |
| Check-in pane | FeedbackScreen L52547 at L52176 writes `lk_feedback` entry L52573-L52584, `coachMoodRaisedAt` L52539; frequency `checkinPerDay` L52446 |

### 2.16 profile — ProfileScreen L30153

| Aspect | Detail |
|---|---|
| Entry | Nav Profile; Settings back `p.go("profile")` L32133 |
| Content | guest banner "Guest account" L30251-L30273 → `LOCKED.upgradeFromGuest()` L30282; settings gear `p.go("settings")` L30340; stats from history/prs; badges when `lk_gamingLayer` L30396 (empty L30403); unit toggle prop L57664 |
| E | zero stats with `lk_history=[]`; badges empty L30403 |
| L/X | n/a |
| Data | profile, history, prs, splits |

### 2.17 settings — SettingsScreen L32031, LayoutEditor L31492

| Aspect | Detail |
|---|---|
| Entry | Profile gear L30340; BetaAdminPanel back L52884 |
| Views | `settingsView` L32033 `main`/`layout` (L32192 → LayoutEditor L32110, writes `homeLayout` L26080, back L32111) |
| Sections (main) | ACCOUNT L32213 (guest: SIGN UP L32236-L32249; signed-in only: sync L32318/L32356, sign out L32379, password L32471, delete L33784); display name L32549; body stats `updateProfile({age,sex,weightKg,heightCm,goal})` L32771-L32777; units `p.toggleUnit` L32825; check-in frequency L32861 (`checkinPerDay` 1/2/4); theme L32036 (`applyTheme` L2512 writes `theme`); TextSizeCard L31945 (`textScale`); NotificationsCard L31756 (push keys, raw); partials L32996 (`hidePartials`); gaming layer L33049; voice L33263; perf tracking L33336; beta code L32052 (POST `/beta-validate` L2735); StorageCard L31987 (`lkStorageUsage` L2455); last sync L33554; replay tutorial L33629; RESET (two-tap) L33665-L33690 wipes all `lk_`/`__lk_ts__` keys but re-sets `lk_guestMode` L33682 |
| Exit | back `p.go("profile")` L32133 |
| E | n/a |
| L | `syncLoading`/`pwLoading`/`deleteLoading` L32078-L32086 (signed-in only) |
| X | `syncErr` L32079, `pwMsg`, `settingsBetaErr` L32053 |
| Data | profile, theme, textScale, checkinPerDay, hidePartials, gamingLayer, voiceEnabled, perfTracking, betaStatus/betaCode, lastSync, homeLayout |

### 2.18 shopping-budget — ShoppingBudgetTab L45968, ShoppingTab L42420, PantryTab L43578, MyStoresTab L42079, BudgetTab L43974

| Aspect | Detail |
|---|---|
| Entry | inside FuelTab: `view==="shop"` L37075 (Fuel is out of scope; this is the only UI route). `screen="shopping"` L57702 exists but nothing calls `go("shopping")` (comment L57705); `onBack` → `go("fuel")` L57709 / L46002 |
| Tabs | `useHubState("shopTab")` L45969 (`lk_ui_shopTab`) `shopping` "List", `pantry`, `stores` "My Stores", `budget` L45970; render L46127; SuppReminderCard L46185 |
| ShoppingTab | list `lk_shoppingList` L42421 (`getShoppingList` L41945); add `addItem` L42517 → `addShoppingItem` L41951 `{id:"sh_…", itemName, quantity, unit, category, dateAdded, checked:false}`; merge dialog L42429; store search POST `/store-search` L42458 only when active stores L42453 (`storeLoading` L42428); "Shop at" sheet L42584; toggle L41974; clear checked L42934; unchecked count L42615 |
| PantryTab | `lk_pantryItems` L43416; add L43633-L43643 `{id:"p_…", name, quantity, unit:"", store:"", category, dateAdded, empty:false}`; staple filter L43584; empty "Pantry is empty"/"No staples yet" L43782-L43799 |
| MyStoresTab | `lk_myStores` L42075; presets L42060; add `{id:"store_…", name, url, description, enabled:true}` L42098-L42119; empty L42403 |
| BudgetTab | `lk_budgetData` default `{weeklyTarget:0, history:[], pendingItems:[]}` L43965; target edit L44032; manual purchase `{id:"p_…", items:[{name,price,qty}], store, date ISO, total, source:"manual"}` L44046-L44058; receipt POST `/parse-receipt` L44083 (`receiptLoading` L43985); swaps POST L44302 (`swapLoading`); compare POST L44340 (`compareLoading`); history view week/month L43990; empty history L45135, swaps empty L45085 |
| E | all four lists empty |
| L | store search / receipt / swaps / compare |
| X | fetch catches after each POST (receipt parse fallbacks L44168-L44226) |
| P | `lk_shoppingList` ≥1, `lk_pantryItems` ≥1, `lk_myStores` ≥1 enabled, `lk_budgetData.weeklyTarget>0` with `history` |

## 3. Out of scope (avoid in tests)

| Component | Def | Entry | Note |
|---|---|---|---|
| FuelTab | L36895 | Nav Fuel (`screen="fuel"` L57690); quick actions food/weight/supps L26091-L26121; `?open=fuel` L57497 | tabs `lk_ui_fuelTab` L36904 list/search/scan/photo/trends/recipes/supps/plan/cycle; `view="shop"` L37075 is the only route into Shopping & Budget |
| BetaAdminPanel | L52806 | `screen="betaAdmin"` L57710 only; no `go("betaAdmin")` caller in the file | unreachable from UI in v6 |
| Auth overlay / account upgrade | L770-L953 | "SIGN UP" L32249, "Guest account" L30282 | leaves guest mode |
