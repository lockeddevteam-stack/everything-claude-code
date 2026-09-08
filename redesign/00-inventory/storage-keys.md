# LOCKED v6 localStorage keys

Source: `input/locked-current-v6.html`. Helpers: `ld(k, fb)` L2417 = `JSON.parse(localStorage["lk_"+k])` or fallback; `sd(k, v)` L2435 = `localStorage["lk_"+k] = JSON.stringify(v)`. Every value written by `sd` is JSON (strings are quoted: `lk_theme` holds `"dark"` with quotes L20-L21). Keys marked **raw** are written with plain `setItem` and are not JSON. `localStorage.setItem` is patched L235-L240: every write to a key in `SYNC_KEYS` L188-L216 also writes `__lk_ts__<key>` = ISO timestamp (needed only for cloud sync; guests never sync L599).

Weight convention: all set weights in `lk_history`, `lk_activeWorkoutRows` and `lk_prs` are stored in the unit named by `lk_weightStorageUnit` (`"kg"` or `"lb"`) L4380-L4405; if that key is absent it is derived once from `lk_unitConversion` (absent = on = kg) and `profile.useKg`, then written L4403-L4405. Seed `lk_weightStorageUnit="kg"` explicitly. `lk_prs[].w` is kg-normalised at write time L10768. Exercise ids are numbers in the DB (`id: 107` L3013, `ALL_EX` L4258-L4272); `lk_prs` object keys are therefore numeric strings.

Dates: `isoDay()` L1961 → `"2026-09-08"`; `new Date().toLocaleDateString()` → `"9/8/2026"` (en-US); cardio `date` → `"Sep 8"` L56436; ISO timestamps → `new Date().toISOString()`.

## A. Training core

| Key | Shape | Example | Read | Write |
|---|---|---|---|---|
| `lk_guestMode` **raw** | string `"1"` | `1` | `isGuestMode` L165-L167, L287, L33676 | `enterGuestMode` L169; reset keeps it L33682; removed on sign-in L288 |
| `lk_profile` | `{displayName:string, username:string, useKg:boolean, createdAt:string(locale date), age?:number\|null, sex?:"male"\|"female"\|null, weightKg?:number, heightCm?:number, goal?:string\|null, coachName?:string\|null}` | `{"displayName":"Cesco","username":"cesco","useKg":true,"createdAt":"9/8/2026","sex":"male","age":29,"weightKg":82,"heightCm":180,"goal":"build"}` | App L57188-L57193; gate L57555; Settings L32048-L32105; `isFemaleUser` L21946; unit derivation L4402; head auth L171 | `enterGuestMode` L172; `completeOnboarding` L57352; `toggleUnit` L57332; `updateProfile` L57341 (Settings L32549, L32771-L32777; Coach L49962); Supabase merge L57248 |
| `lk_splits` | `Array<{id:string, name:string, days:Array<{name:string, exIds:number[], blocks?:Array<{title:string, notes:string, duration:string\|null}>}>, created:string(locale date)}>` | `[{"id":"s1725000000000","name":"PPL","days":[{"name":"Push","exIds":[107,12,45],"blocks":[]}],"created":"8/1/2026"}]` | App L57196; Home L26913; TrainHub L15468-L15826; DynamicFeed L18044; Photos L30639 | `setSplits` L57286 ← SplitBuilder L9209-L9213, AISplitBuilder L14185-L14209, Convert L16642-L16667, onboarding L57361-L57400 |
| `lk_history` | `Array<WorkoutRec \| CardioRec>` newest first. `WorkoutRec = {id:"w_"+ms, name:string, sets:number, vol:string ("<n> kg"\|"<n> lb"), dur:string ("<n> min"), date:string(locale), dateISO:"YYYY-MM-DD", exercises:Array<{id:number, name:string, muscle:string, sets:Array<{w:string, r:string, rir:string, done:true, setType?:"warmup"\|"drop"\|..., rL?:string, rR?:string, partials?:string}>}>\|null, blocks:Array<{title,notes,duration}>\|null, reflection:{[k:string]:number}\|null, note:string\|null, aiInsight:string\|null}`. `CardioRec` adds `type:"cardio", modality, durationSec, distanceM, surface, environment, machine, metrics, heartRate, intensity, calories, favoriteId, source:"manual", notes, cardioType, duration(min), distance, distanceUnit, schemaVersion` L56432-L56465 | `{"id":"w_1725000000000","name":"PPL - Push","sets":15,"vol":"6240 kg","dur":"52 min","date":"9/6/2026","dateISO":"2026-09-06","exercises":[{"id":107,"name":"Bench Press","muscle":"Chest","sets":[{"w":"100","r":"8","rir":"2","done":true}]}],"blocks":null,"reflection":null,"note":"","aiInsight":null}` | App L57202 via `withWorkoutIds` L5199 (adds `id:"wl_<dateISO>_<i>"` to legacy rows L5206); Home L26817; TrainHub L15396-L15872; Progress; PRHub; WorkoutLog last-session prefill L10040; Feed L18013; Coach L50048 | `setHistory` L57300 ← `saveWorkout` L57425-L57440 (record L16050-L16063), cardio save L57648, WorkoutDetail edit/delete L26288-L26296; voice L53565/L53575; migrations L5209, L6989 |
| `lk_prs` | `{[exId:string]: Array<{r:number, w:number(kg), date:"YYYY-MM-DD"}>}` sorted by `r` | `{"107":[{"r":1,"w":120,"date":"2026-08-20"},{"r":5,"w":105,"date":"2026-09-01"}]}` | App L57199; PRHub L29165; Home; Throwback L4634 | `setPrs` L57293 ← WorkoutLog L10777-L10794, PRHub manual log; `prDatesFixed` migration L2384 |
| `lk_customEx` | `Array<{id:number, name:string, eq:string, gid:string, sid:string, custom:true, startResist:number, smithNoCB:boolean}>` | `[{"id":900001,"name":"Cable Fly","eq":"Cable","gid":"chest","sid":"upper","custom":true,"startResist":0,"smithNoCB":false}]` | App L57205; `ALL_EX` merge L4278-L4287 | `addCustom` L57321 ← ExLib L8149-L8165 |
| `lk_activeWorkout` | `{name:string, exIds:number[], blocks?:Array<{title,notes,duration}>, isPaused?:boolean}` or `null` | `{"name":"Quick Workout","exIds":[]}` | App L57208, resume dialog L57266, deep link L57496 | `setWorkout` L57258; cleared L57455, L57597, L57814, L57926 |
| `lk_activeWorkoutRows` | `Array<ExRow \| BlockRow>`; `ExRow={type:"exercise", id:number, name, muscle, sets:Array<{w:string, r:string, rL:string, rR:string, rir:string, done:boolean, setType:"normal"\|"warmup"\|..., partials:string}>, ...}` L10102-L10110; `BlockRow={type:"block", id:"blk_…", title, notes, duration}` L10119-L10124 | — | WorkoutLog L10416; `startWorkout` L57400 (non-null → review) | WorkoutLog L10686; Review handoff L57421; cleared with activeWorkout |
| `lk_activeWorkoutSec` | number (seconds) | `1860` | WorkoutLog L10425; App L57401 | L10687, L57422 |
| `lk_activeWorkoutRestTarget` | number (seconds) or `null` | `120` | WorkoutLog L10435 | L10616, L10632, L10652, L11555 |
| `lk_restEnabled` | boolean | `true` | WorkoutLog L10442 | L11515 |
| `lk_hidePartials` | boolean (true hides partial-rep field) | `false` | WorkoutLog L13470; Settings L32064 | Settings L32996 |
| `lk_holdTipSeen` | boolean | `true` | WorkoutLog L10020 | L10323 |
| `lk_exNotes` | `{[exId:string]: {text:string, updated:ISO}}` | `{"107":{"text":"Pinkies on rings","updated":"2026-09-01T10:00:00.000Z"}}` | `getExNote` L7104 | `saveExNote` L7116 |
| `lk_exequip_<exId>` (dynamic) | `{bar:"oly"\|..., machine:boolean, baseKg:number, baseLb:number, plateInv:object\|null, smithOffset:number}` | default L7048-L7055 | `getExEquip` L7047 (PlateCalc) | `setExEquip` L7058 |
| `lk_featuredLifts` | `number[]` (exIds) | `[107,12,45]` | ProgressPage L28332 | L28345 (add L28522-L28524) |
| `lk_splitsExpanded` | `{[splitId:string]: boolean}` | `{"s1725000000000":true}` | TrainHub L15015 | L15021 |
| `lk_weightStorageUnit` | `"kg"` \| `"lb"` | `"kg"` | `storedWeightUnit` L4386-L4398; raw read L4389 | L4405 |
| `lk_unitConversion` | boolean (legacy; absent = true) | `true` | `unitConvOn` L4293 | none in v6 (legacy) |
| `lk_weightsKgMigrated`, `lk_prDatesFixed`, `lk_cardioMigrated`, `lk_reminderMigrated` | boolean flags | `true` | L4454-L4460, L2354-L2385, L6989-L6990, L2404 | same |
| `lk_cardioFavorites` | `Array<{id:string, name:string, ...preset fields}>` L5821-L5830 | — | CardioSection L56217/L56282; CardioFavorites L55551 | `saveCardioFavorites` L5826 |
| `lk_cardioPrefs` | `{distUnit:"km"\|"mi", weeklyTargetMin:number, maxHrOverride:number\|null, zoneModel:"5zone"\|"3zone", restingHr:number\|null}` | `{"distUnit":"km","weeklyTargetMin":150,"maxHrOverride":null,"zoneModel":"5zone","restingHr":null}` | `cardioPrefs` L5645 | L5657 |
| `lk_perfTracking` | boolean | `false` | Settings L33335-L33360 | L33336 |

## B. Progress, body, goals

| Key | Shape | Example | Read | Write |
|---|---|---|---|---|
| `lk_weightLog` | `Array<{date:"YYYY-MM-DD", kg:number}>` sorted asc, one per day | `[{"date":"2026-08-01","kg":83.2},{"date":"2026-09-01","kg":82.1}]` | Progress L28340; Throwback L4615; Cardio L56377; Goals L27110 | `addWeightEntry` L2911-L2929 (WeightLogCard L37019) |
| `lk_bfLog` | `Array<{pct:number, method:"manual"\|string, date:"YYYY-MM-DD"}>` | `[{"pct":15.2,"method":"manual","date":"2026-09-01"}]` | Goals L27001; Home L26977 | `addBfEntry` L26979-L26989 |
| `lk_progressPhotos` | `Array<{date:ISO, note:string, thumb:string(base64 data URL)}>` | `[{"date":"2026-08-01T09:00:00.000Z","note":"Week 1","thumb":"data:image/jpeg;base64,..."}]` | ProgressPhotos L30588; Progress L28341; Throwback L4652; Goals L27195 | `saveProgressPhoto` L2856-L2869; delete L30703 |
| `lk_goals` | `Array<{type:"lift"\|"weight"\|"bf"\|string, name:string, target:number, targetDate:"YYYY-MM-DD"\|null, exId:number\|null, unit:string, notes:string, start:number, status:"active"\|string, created:ISO}>` | `[{"type":"lift","name":"Bench 120","target":120,"targetDate":"2026-12-01","exId":107,"unit":"kg","notes":"","start":100,"status":"active","created":"2026-08-01T09:00:00.000Z"}]` | GoalsTab L26999; Coach L50439, L50662 | L27025 (entry L27115-L27125); Coach L50441 |
| `lk_throwbackDismissed` | ISO string | — | `computeThrowback` L4610 | `dismissThrowback` L4662 |
| `lk_throwbackForce` **raw** | `"1"` forces a throwback card | `1` | L4604 | test hook only |
| `lk_proactiveTip` | `{text:string, date:"YYYY-MM-DD"}` | — | ProactiveTipCard L17860 | L17924 |

## C. Cycle tracker

| Key | Shape | Example | Read | Write |
|---|---|---|---|---|
| `lk_mcProfile` | `{setup:true, goal:string, lastStart:"YYYY-MM-DD"\|null, cycleLen:number(15-60), periodLen:number(1-10), irregular:boolean, birthControl:string, discreet:boolean, createdAt:"YYYY-MM-DD"}` | `{"setup":true,"goal":"train","lastStart":"2026-08-25","cycleLen":28,"periodLen":5,"irregular":false,"birthControl":"none","discreet":false,"createdAt":"2026-09-01"}` | `mcGetProfile` L21935; gate L25170 | `mcSaveProfile` L21938 (McOnboarding L22762-L22773); removed L26009 |
| `lk_mcDays` | `{["YYYY-MM-DD"]: {flow?:number(0-3), sym?:{[symId:string]:number}, mood?:string[], note?:string, ev?:object}}` | `{"2026-08-25":{"flow":2,"sym":{"cramps":2},"mood":["tired"],"note":""}}` | `mcGetDays` L21941 | `mcSaveDays` L21944 (McLogSheet L23151-L23736); removed L26010 |
| `lk_mcCloudSync` **raw** | `"1"` opt-in cloud sync | — | L224, L1175 | L1178; removed L1188 |
| `lk_mcFuelAdjust` | boolean | `false` | McFuelStrip L25030 | L25037 |

## D. Coach

| Key | Shape | Example | Read | Write |
|---|---|---|---|---|
| `lk_coachLastMsgs` | `Array<{role:"user"\|"assistant", text:string, error?:true, errKind?:string, split?:object, recipe?:object, goal?:object, food?:object, cardio?:object, remembered?:string, plan?:object}>` (last 40) | `[{"role":"user","text":"How should I progress bench?"},{"role":"assistant","text":"Add 2.5 kg when you hit 8 reps at RIR 2."}]` | CoachScreen L49917 | L49927 (persist), L49940 (clear) |
| `lk_coachLastHist` | `Array<{role:"user"\|"assistant", content:string}>` (last 40; sent to API L50069) | `[{"role":"user","content":"How should I progress bench?"},{"role":"assistant","content":"Add 2.5 kg..."}]` | L49923 | L49928, L49941 |
| `lk_coachPlan` | `{name:string, description:string, startDate:"YYYY-MM-DD", phases:Array<{name?:string, weekStart:number, weekEnd:number, focus?:string, targets?:Array<{name:string, value:string\|number}>}>, created:ISO, updatedAt:ISO}` or `null` | `{"name":"12-week strength","description":"","startDate":"2026-08-04","phases":[{"name":"Base","weekStart":1,"weekEnd":4,"focus":"volume","targets":[{"name":"Bench 5RM","value":"105 kg"}]}],"created":"2026-08-04T09:00:00.000Z","updatedAt":"2026-08-04T09:00:00.000Z"}` | L50013; usage L50539-L50560, L51211 | L50022 (`saveCoachPlan` L50518-L50527) |
| `lk_coachInstructions` | string | `"Keep replies under 80 words."` | L49995-L49998; Review L16088; Goals L27231 | L50025, L50036 |
| `lk_coachMemory` | `Array<{text:string, src:string, date:ISO\|null} \| string(legacy)>` | `[{"text":"Left shoulder impingement","src":"added by you, 8/1/2026","date":"2026-08-01T09:00:00.000Z"}]` | L50002; `coachMemoryItems` L48939 | L50008 (add L49661) |
| `lk_coachMemoryOn` | boolean | `true` | `coachMemoryOn` L48947 | L49606 |
| `lk_coachDataPrefs` | `{training,nutrition,weight,checkins,supplements,cycle,bodyfat,goals,plan: boolean}` (absent = true) | `{"cycle":false}` | `coachDataPrefs` L48931 | L49494 |
| `lk_coachStyle` | `"direct"\|"warm"\|"technical"\|"teacher"\|"hype"\|"athlete"\|"physio"` | `"warm"` | L49484 | L49576 |
| `lk_coachRecipes` | `Array<{id:"cr"+ms, name, description, cal, pro, carb, fat, ingredients:string[], steps:string[], created:ISO}>` | — | L50385 | L50399 |
| `lk_coachMoodRaisedAt` | ISO string | — | L52534 | L52539 |
| `lk_checkinPerDay` | `1\|2\|4` | `1` | `checkinPerDay` L52446; Settings L32032 | L32866 |
| `lk_feedback` | `Array<{id:"fb"+ms, date:ISO, dateStr:string(locale), mood:number, energy:number, stress:number, sleep:number, soreness:number, hoursSlept:number\|null, tags:string[], note:string, anchored:"usual"}>` newest first | `[{"id":"fb1725000000000","date":"2026-09-08T07:30:00.000Z","dateStr":"9/8/2026","mood":3,"energy":3,"stress":2,"sleep":3,"soreness":2,"hoursSlept":7.5,"tags":[],"note":"","anchored":"usual"}]` | Feed L18003; Review L16097; Coach dot L50916 | FeedbackScreen L52560 (entry L52574-L52584) |

## E. Shopping and budget

| Key | Shape | Example | Read | Write |
|---|---|---|---|---|
| `lk_shoppingList` | `Array<{id:"sh_"+ms+"_"+rand, itemName:string, quantity:number, unit:string, category:"produce"\|"meat"\|"dairy"\|"pantry"\|"snacks"\|"other", dateAdded:ISO, checked:boolean}>` | `[{"id":"sh_1725000000000_ab12cde","itemName":"Chicken breast","quantity":2,"unit":"lb","category":"meat","dateAdded":"2026-09-07T10:00:00.000Z","checked":false}]` | `getShoppingList` L41945; ShoppingTab L42421 | `saveShoppingList` L41949 via `addShoppingItem` L41951-L41966, toggle L41974, remove L41968 |
| `lk_pantryItems` | `Array<{id:"p_"+ms, name:string, quantity:number, unit:string, store:string, category:string, dateAdded:ISO, empty:boolean, staple?:boolean, intervalDays?:number}>` | `[{"id":"p_1725000000001","name":"Rice","quantity":1,"unit":"","store":"","category":"pantry","dateAdded":"2026-09-01T10:00:00.000Z","empty":false}]` | L43416; PantryTab L43579; Home restock | L43419 (add L43634-L43643) |
| `lk_myStores` | `Array<{id:"store_"+ms, name:string, url:string, description?:string, enabled:boolean}>` | `[{"id":"store_1725000000002","name":"Trader Joe's","url":"https://www.traderjoes.com","description":"specialty grocery","enabled":true}]` | `getMyStores` L42075; ShoppingTab store search L42453 | `saveMyStores` L42077 (L42098-L42130) |
| `lk_budgetData` | `{weeklyTarget:number, history:Array<{id:"p_"\|"r_"+ms, items:Array<{name:string, price:number, qty:number}>, store:string, date:ISO, total:number, source:"manual"\|"receipt"}>, pendingItems:Array}` | `{"weeklyTarget":120,"history":[{"id":"p_1725000000003","items":[{"name":"Eggs","price":4.5,"qty":2}],"store":"Safeway","date":"2026-09-06T15:00:00.000Z","total":9,"source":"manual"}],"pendingItems":[]}` | `getBudgetData` L43965; BudgetTab L43975; ProactiveTip L17896 | `saveBudgetData` L43972 (L44032, L44046-L44058, L44249) |
| `lk_myGroceries` | array (legacy grocery list, Fuel) | — | L21016, L39375 | L21016, L21043, L39375 |
| `lk_mealPlans` | array | — | `getMealPlans` L45229 | L45232 |

## F. Nutrition (out of scope, shapes for completeness)

| Key | Shape | Read/Write |
|---|---|---|
| `lk_fuelLog` | `{["YYYY-MM-DD"]: {meals:{breakfast:Item[], lunch:Item[], dinner:Item[], snacks:Item[]}, water:number(ml)}}`, `Item={name, cal, pro, carb, fat}` L50495-L50501 | `quickLogWater` L26124-L26138; Fuel L36925; Coach L50504; ProactiveTip L17872 |
| `lk_fuelProfile` | `{sex, age, heightCm, weightKg, goal, tdee, ...}` | L36931; `isFemaleUser` L21949; Cardio L56377 |
| `lk_fuelSettings` | `{waterGoalMl:number\|null, hideNumbers:boolean, framing:"remaining"\|string}` | L18651-L18658 |
| `lk_favFoods` | `Array<Item & {savedAt:ISO}>` | L18932 |
| `lk_userRecipes` | array | L19963 |
| `lk_tdeeHistory` | `Array<{observedTDEE, daysUsed, applied, delta, ...}>` | L19286 |
| `lk_barcodeCache` | `{[gtin]: {item, fetchedAt:ISO}}` | L18975 |
| `lk_usdaKey` | string | L39379 |
| `lk_refeedAccepted` | `"YYYY-MM-DD"` | L37026 |
| `lk_refeedDismissed` | ISO | L37034 |
| `lk_supplements` | `Array<{name, dose, freq:"Daily"\|"Every Other Day"\|"Weekly", timeOf:string, reminder:boolean, created:ISO}>` L46341-L46347 | L46300; SuppReminderCard L46162 |
| `lk_suppLog` | `{["YYYY-MM-DD"]: string[]}` (supplement names taken) | L46132-L46140 |
| `lk_cycles` | `Array<{name, startDate, endDate, weeks, compounds:Array<{name,dose,freq,route}>, notes, status:"active"\|"completed", created:ISO}>` L47561-L47569 | L47265-L47269 |
| `lk_cycleLog` | `{["YYYY-MM-DD"]: string[]}` | L47271-L47280 |

## G. Settings and UI state

| Key | Shape | Example | Read | Write |
|---|---|---|---|---|
| `lk_theme` | JSON string `"dark"\|"light"\|"slate"\|"navy"\|"midnight"` | `"dark"` | head L20-L21 (raw then `JSON.parse`); Settings L32037 | `applyTheme` L2528 |
| `lk_textScale` | number (percent) | `100` | head L38 (parseInt raw); TextSizeCard L31950 | L31955 |
| `lk_homeLayout` | `{order?:string[], hidden?:{[blockId]:true}, quick?:string[]}`; block ids L26019-L26061; quick ids `water,food,weight,checkin,workout,cardio,pr,supps` L26083-L26121; default quick `["water","checkin","food"]` L26077 | `{"order":["stats","start","recent"],"hidden":{"throwback":true},"quick":["workout","pr","checkin"]}` | `getHomeLayout` L26066; LayoutEditor L31493 | `saveHomeLayout` L26080 |
| `lk_tutorialSeen` | boolean | `true` | App L57219 | L57757, L54283, L54369 |
| `lk_gamingLayer` | boolean | `false` | Home L26423; Profile L30396; Settings L32067 | L33049 |
| `lk_voiceEnabled` | boolean | `true` | VoiceButtonWrap L53702; Settings L32061 | L33263 |
| `lk_voiceBtnCorner` | `"br"\|"bl"\|"tr"\|"tl"` | `"br"` | VoiceButton | L53997 |
| `lk_ui_trainTab` | `"splits"\|"history"\|"library"` | `"splits"` | `useHubState` L2123 (TrainHub L15025) | L2135 |
| `lk_ui_trainView` | `"main"\|"create"\|"edit"\|"library"\|"aibuilder"` | `"main"` | L15026 | L2135 |
| `lk_ui_progressTab` | `"overview"\|"goals"\|"calendar"\|"photos"\|"prs"` | `"overview"` | L28324 | L2135 |
| `lk_ui_fuelTab`, `lk_ui_fuelView` | see L36904-L36905 | `"list"`, `"main"` | FuelTab | L2135 |
| `lk_ui_shopTab` | `"shopping"\|"pantry"\|"stores"\|"budget"` | `"shopping"` | L45969 | L2135 |
| `lk_lastSync` | ISO string | — | Settings L33554 | L2833 |
| `lk_deployVersion` **raw** | version string from `/app-version` | — | L69-L83 | L82, L100; removed L33577 |
| `lk_pushDeviceId` **raw** | 32-hex string | — | `deviceId` L1345 | L1358 |
| `lk_pushPrefs` | `{rest, training:boolean, trainingTime:"HH:MM", checkin:boolean, checkinTime:"HH:MM", idle, supps, compounds, restock: boolean}` (via `writeRaw` JSON L1336) | defaults L1311-L1321 | `readRaw` L1325 | L1668 |
| `lk_pushEnabled` | boolean (JSON via `writeRaw`) | `false` | L1309 | L1637, L1649 |
| `lk_pushSound` | string (JSON) | — | L1806 | L1815 |
| `lk_betaStatus`, `lk_betaCode`, `lk_betaId`, `lk_betaCodes`, `lk_betaLog`, `lk_betaAILog` | boolean / string / string / array / `Array<{ts,action,data,betaId}>` / `Array<{ts,input,output,betaId}>` | — | L2719-L2792, Settings L32058 | L2767-L2792, L52824 |
| `__lk_ts__<lk_key>` **raw** | ISO timestamp per synced key | — | sync L19476 | patch L238; migration L253-L260 (`__lk_ts_migrated_v2__`) |
| `__lk_last_uid__`, `__lk_last_sync__`, `__lk_last_sync_date__` **raw** | user id / ISO / `"YYYY-MM-DD"` | — | L303, L314-L317 | signed-in only |
| `yt3_<exercise name>` **raw** | YouTube video id | — | L7067 | L7083 |
| `locked_session` **raw** | Supabase session (not `lk_`) | — | L276 | supabase-js |

Legacy names appearing only in `SYNC_KEYS`/comments, never read or written by `ld`/`sd` in v6: `lk_workoutHistory` L191, L525, L53549; `lk_workoutData` L469.

## H. Minimum seed sets

| Goal | Keys (values as stored) |
|---|---|
| Guest boot straight to Home | `lk_guestMode`=`1` (raw); `lk_profile`=`{"displayName":"Cesco","username":"cesco","useKg":true,"createdAt":"9/8/2026"}`; `lk_tutorialSeen`=`true`; no `lk_activeWorkout`. Recommended: `lk_theme`=`"dark"` (else `prefers-color-scheme` decides L21), `lk_weightStorageUnit`=`"kg"`. Leave `lk_deployVersion` absent: a stored value that differs from a fetched `/app-version` forces a hard reload L89-L97; absent never reloads |
| Populated Home | above + `lk_history` (≥5 WorkoutRecs, `dateISO` spanning the last 6 weeks, latest 1-2 days old so Feed shows "next split day" L18081 and not the idle card L18075) + `lk_splits` (≥1; the "next split day" card matches `days[].name === lastWorkout.name` L18049, which never matches a `"Split - Day"` name L15216, so it falls back to `splits[0].days[0]` L18057 whenever splits exist and nothing was trained today L18081) + `lk_prs` + `lk_feedback` (entry dated today to hide the check-in card L18060) + `lk_weightLog` (≥2). Optional: `lk_homeLayout` to hide `insight` (`{"hidden":{"insight":true}}`) and avoid the ProactiveTip network call L17904 |
| Workout history | `lk_history` WorkoutRecs as in section A (numeric `exercises[].id` matching `ALL_EX`, e.g. 107; `sets[].w`/`r`/`rir` strings; `dateISO` + locale `date`; `vol` `"<n> kg"`; `dur` `"<n> min"`); add ≥1 CardioRec (`type:"cardio"`) for Cardio History |
| Splits | `lk_splits` 3 entries, ids `"s<ms>"`, `days[].exIds` numeric, `blocks:[]`, `created` locale date; optional `lk_splitsExpanded` `{"<id>":true}` |
| PRs | `lk_prs` `{"<exId>":[{r,w(kg),date ISO}]}` for 12 (exId, r) pairs, some dated within the last 7 days for the PR Vault "Last 7 Days" strip L29827; `lk_featuredLifts` `[exIds]` for Progress overview |
| Shopping items | `lk_shoppingList` 10 items per section E; `lk_myStores` ≥1 `enabled:true` (store search fetch then fires L42453; keep `[]` to stay offline); optional `lk_pantryItems` |
| Budget | `lk_budgetData` `{weeklyTarget:120, history:[…this week], pendingItems:[]}` |
| Coach messages | `lk_coachLastMsgs` + matching `lk_coachLastHist`; `lk_coachPlan` for the Plan tab; `lk_coachInstructions` string; `lk_coachStyle` `"warm"` |
| Settings/units | `lk_profile.useKg` (display unit, `toggleUnit` L57327), `lk_weightStorageUnit` `"kg"`, `lk_theme`, `lk_textScale` `100`, `lk_checkinPerDay` `1`, `lk_hidePartials` `false`, `lk_gamingLayer` `false`, `lk_voiceEnabled` `true`, `lk_restEnabled` `true` |
| Review page directly | `lk_activeWorkout` + `lk_activeWorkoutRows` (rows with `done:true` sets) + `lk_activeWorkoutSec`; tapping Resume then Finish, or starting any workout, routes to Review L57404 |
| Cycle page | `lk_profile.sex`=`"female"`, `lk_mcProfile` (section C), `lk_mcDays` |
