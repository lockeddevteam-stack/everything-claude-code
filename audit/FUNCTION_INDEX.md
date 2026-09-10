# LOCKED — Function & Component Index

Every function, component, hook and handler found in the production build
`redesign/input/locked-current-v6.html` (58,015 lines), sorted by line number.

**1540 indexed entries.**

| Line | Name | Kind | Purpose | Source agent |
|---|---|---|---|---|
| Fire `syncBetaData` once at 00:00 | `(beta midnight sync)` | IIFE+interval | Fire `syncBetaData` once at 00:00 | 08-auth-sync-root |
| Always → step 2 (`:34277`) | `0` | 1 | — (pitch only) | 09-onboarding-system |
| on claim: `lk_betaCodes`, `lk_betaStatus`, `lk_betaCode`, `lk_betaId` (written at step 2, `:2765-2768`) | `0a` | 1 | "Enter code if you have one" | 09-onboarding-system |
| On the 3rd send, `answerCountRef >= 3` diverts to program generation (`:33935`) | `3` | 4 | AI-generated; model told to elicit **days per week available** | 09-onboarding-system |
| `https://www.instacart.com/store/search_v3/<q>` (v6:42006) | `Instacart` | instacart.com | yes (v6:42051) | 04-shopping-budget |
| `https://www.albertsons.com/shop/search-results.html?q=<q>` (v6:42004) | `Albertsons` | albertsons.com | **no preset** | 04-shopping-budget |
| `https://www.aldi.us/en/search/?q=<q>` (v6:42007) | `Aldi` | aldi.us | yes (v6:42059) | 04-shopping-budget |
| `https://www.amazon.com/s?k=<q>` (v6:41997) | `Amazon` | amazon.com | yes (v6:42031) | 04-shopping-budget |
| `https://www.amazon.com/s?k=<q>` (v6:42023) | `Amazon Fresh` | fresh.amazon.com | no | 04-shopping-budget |
| `<store.url>/search?q=<q>` (v6:42071) | `Any other domain` | — | n/a | 04-shopping-budget |
| v6:43974-45227 | `BudgetTab` | component | Budget screen: target, receipts, AI swaps/compare, history | 04-shopping-budget |
| `https://www.costco.com/CatalogSearch?keyword=<q>` (v6:41999) | `Costco` | costco.com | yes (v6:42039) | 04-shopping-budget |
| v6:45907-45967 | `FITNESS_PICKS` | const | 12 hardcoded fitness grocery picks | 04-shopping-budget |
| `https://www.kroger.com/search?query=<q>` (v6:42001) | `Kroger` | kroger.com | yes (v6:42047) | 04-shopping-budget |
| v6:45234-45906 | `MealPlannerTab` | component | Dead duplicate meal planner | 04-shopping-budget |
| v6:42079-42419 | `MyStoresTab` | component | Store list: quick-add presets, custom form, toggle, delete | 04-shopping-budget |
| v6.html:9847-10012 | `NumPad` | component | Non-modal bottom numeric keypad for weight/reps | 02b-train-logging |
| v6:46129-46131 | `PRESET_SUPPS / SUPP_TIMES / SUPP_FREQ` | const | Supplement constants — **supplements module, not shopping** | 04-shopping-budget |
| v6.html:10269-10276 | `PRESS_EASE` (IIFE)` | function | Feature-detect a spring `linear()` easing, else a bezier | 02b-train-logging |
| v6:43578-43963 | `PantryTab` | component | Pantry inventory screen | 04-shopping-budget |
| `https://www.publix.com/shopping/product-search#/q=<q>` (v6:42005) | `Publix` | publix.com | **no preset** | 04-shopping-budget |
| v6.html:8625-8781 | `ReplacePanel` | component | Search/suggest an alternative exercise to swap in | 02b-train-logging |
| v6:43542-43577 | `RunningLowCard` | component | Home card for overdue staples | 04-shopping-budget |
| `https://www.safeway.com/shop/search-results.html?q=<q>` (v6:42003) | `Safeway` | safeway.com | yes (v6:42063) | 04-shopping-budget |
| v6:45968-46128 | `ShoppingBudgetTab` | component | Hub shell: 4 sub-tabs + status pills | 04-shopping-budget |
| v6:42420-43414 | `ShoppingTab` | component | Shopping list screen | 04-shopping-budget |
| v6.html:8782-9846 | `SplitBuilder` | component | Create/edit a split: days, exercises, note blocks | 02b-train-logging |
| `https://www.target.com/s?searchTerm=<q>` (v6:41998) | `Target` | target.com | yes (v6:42035) | 04-shopping-budget |
| `https://www.traderjoes.com/home/search#?q=<q>` (v6:42002) | `Trader Joe's` | traderjoes.com | yes (v6:42055) | 04-shopping-budget |
| `https://www.walmart.com/search?q=<q>` (v6:41996) | `Walmart` | walmart.com | yes (v6:42027) | 04-shopping-budget |
| `https://www.wholefoodsmarket.com/search?text=<q>` (v6:42000) | `Whole Foods` | wholefoodsmarket.com | yes (v6:42043) | 04-shopping-budget |
| v6.html:10013-13955 | `WorkoutLog` | component | The live workout logging screen (largest component in the app) | 02b-train-logging |
| v6.html:10336-10381 | `actionItems` | function | Build the 7-item action sheet list for a row | 02b-train-logging |
| v6.html:10146-10158 | `addBlock` | handler | Append a block row, toasting on failure | 02b-train-logging |
| v6.html:9124-9138 | `addDay` | handler | Append a named day to the split | 02b-train-logging |
| v6:42517-42537 | `addItem` | handler | Add or open the merge dialog | 04-shopping-budget |
| v6:43632-43645 | `addManual (pantry)` | handler | Add a pantry item by hand | 04-shopping-budget |
| v6:42107-42126 | `addManual (stores)` | handler | Add a user-typed store | 04-shopping-budget |
| v6:42091-42106 | `addPreset` | handler | Add a STORE_PRESETS entry | 04-shopping-budget |
| v6:44037-44065 | `addPurchase` | handler | Log a manual purchase | 04-shopping-budget |
| v6.html:10824-10836 | `addSet` | function | Append a blank set to a row | 02b-train-logging |
| v6:43421-43462 | `addToPantry` | function | Merge receipt items into the pantry; reset staple clocks | 04-shopping-budget |
| v6:45347-45379 | `addToShopping` | handler | Push a plan's shoppingList onto the shopping list | 04-shopping-budget |
| v6.html:10171-10213 | `addWarmupSets` | handler | Prepend two 50 %/70 % warm-up sets | 02b-train-logging |
| v6:43510-43516 | `alreadyListed` | function | Loose name match against the shopping list | 04-shopping-budget |
| v6:43506-43532 | `autoAddDueStaples` | function | Auto-add due staples once per cycle | 04-shopping-budget |
| v6.html:10500-10515 | `banner measure effect` | hook (`useLayoutEffect`) | Measure the rest banner and reserve its height | 02b-train-logging |
| v6.html:11032-11189 | `beginDrag` | function | Lift a card, snapshot geometry, attach drag listeners | 02b-train-logging |
| v6.html:10433-10435 | `blockSheet` | hook (`useSheetDrag`) | Drag-to-dismiss for the Add Block sheet | 02b-train-logging |
| v6:45253-45274 | `buildMealContext` | function | Build the calorie/macro/store/budget prompt context | 04-shopping-budget |
| v6.html:11021-11031 | `cancelDrag` | function | Abort a reorder (Escape / touchcancel), snapping back | 02b-train-logging |
| v6.html:10643-10645 | `cancelPushRest` | function | Cancel the scheduled rest notification | 02b-train-logging |
| v6.html:11275-11297 | `compactShell` | function | The jiggling compact card used in wiggle mode | 02b-train-logging |
| v6:44334-44369 | `comparePrices` | handler | AI cross-store price comparison | 04-shopping-budget |
| v6:44242-44263 | `confirmReceipt` | handler | Commit the staged receipt to history + pantry | 04-shopping-budget |
| v6:44370-44375 | `deleteEntry` | handler | Remove one history entry | 04-shopping-budget |
| v6:45380-45385 | `deletePlan` | handler | Remove a saved plan | 04-shopping-budget |
| v6:42134-42138 | `deleteStore` | handler | Remove a store by id | 04-shopping-budget |
| v6.html:10996-11005 | `detachDragHandlers` | function | Remove the reorder document listeners | 02b-train-logging |
| v6.html:11223-11239 | `drag autoscroll effect` | hook | Edge auto-scroll while dragging an exercise | 02b-train-logging |
| v6.html:11223-11239 area (11215-11222 + 11223-11239) | `drag cleanup effect` | hook | Remove listeners / cancel RAF on unmount | 02b-train-logging |
| v6.html:10539-10570 | `elapsed-clock effect` | hook | 500 ms wall-clock tick + 5 s idle poll | 02b-train-logging |
| v6.html:11215-11222 | `exitWiggleMode` | function | Leave wiggle mode and reset drag state | 02b-train-logging |
| v6:42566-42583 | `exportList` | handler | Share or copy the list as text | 04-shopping-budget |
| v6:44156-44241 | `extractReceiptJson` | function | Normalise many possible worker shapes into success/ocr_failure/backend_error | 04-shopping-budget |
| v6:42511-42516 | `findDuplicateItem` | function | Exact case-insensitive list lookup | 04-shopping-budget |
| v6:45275-45346 | `generatePlan` | handler | POST worker root, repair + parse the plan JSON | 04-shopping-budget |
| v6:43964-43970 | `getBudgetData` | function | Read `lk_budgetData` (default `{weeklyTarget:0,history:[],pendingItems:[]}`) | 04-shopping-budget |
| v6:46161-46184 | `getDueSupps` | function | Supplements due by time-of-day/frequency — supplements module | 04-shopping-budget |
| v6.html:10042-10044 | `getLastSession` | function | Look up the most recent sets for an exercise name | 02b-train-logging |
| v6:45228-45230 | `getMealPlans` | function | Read `lk_mealPlans` | 04-shopping-budget |
| v6:43488-43505 | `getOverdueStaples` | function | Staples past their interval, with overdueDays/onList | 04-shopping-budget |
| v6:43415-43417 | `getPantry` | function | Read `lk_pantryItems` | 04-shopping-budget |
| v6.html:11298-11307 | `getSetVal` | function | Read a set field for the NumPad, converting weight for display | 02b-train-logging |
| v6:46132-46134 | `getSuppLog` | function | Read `lk_suppLog` — supplements module | 04-shopping-budget |
| v6:46148-46160 | `getSuppStreak` | function | Consecutive-day streak — supplements module | 04-shopping-budget |
| v6:44290-44333 | `getSwaps` | handler | AI cheaper-swap suggestions | 04-shopping-budget |
| v6:42538-42557 | `handleMerge` | handler | Resolve merge / separate / cancel | 04-shopping-budget |
| v6:44066-44155 | `handleReceiptPhoto` | handler | Read image, POST /parse-receipt, stage the result | 04-shopping-budget |
| v6:42435-42500 | `handleSearchChange` | handler | Local typeahead + debounced /store-search fan-out | 04-shopping-budget |
| v6.html:10336-10341 | `holdProps` | function | Spread `onPointerDown`/`onContextMenu` onto a card | 02b-train-logging |
| v6.html:10300-10330 | `holdStart` | handler | Start the 420 ms hold that opens the action sheet | 02b-train-logging |
| AI Rec (v6.html:13588) via `aiCall` (v6.html:2663-2696) | `https://lockedapi.cescocugliari.workers.dev/` | POST | `{system, max_tokens: 700, messages:[{role:"user", content}]}`, headers from `authHeaders()` incl. `Authorization: Bearer <session.access_token>` (v6.html:2652-2662) | 02b-train-logging |
| v6.html:10608-10620 | `idle-push effect` | hook | Arm the server idle check, handle `lockedPushOpen` and `?open=` | 02b-train-logging |
| v6:44264-44289 | `importCheckedItems` | function | Turn checked list items into a pendingItems entry | 04-shopping-budget |
| v6.html:9864-9873 | `increment` | handler | ±2.5 / ±5 weight nudge, clamped to 0-9999 | 02b-train-logging |
| v6.html:8785-8804 | `initDays` | function | Map a saved split's `exIds`+`blocks` back into ordered `items` | 02b-train-logging |
| v6:46143-46147 | `isSuppTaken` | function | Was a supplement taken on a date — supplements module | 04-shopping-budget |
| v6.html:10021-10041 | `lastSessionIndex` | memo | name → `{sets, date}` index over workout history | 02b-train-logging |
| v6.html:57926 | `lk_activeWorkout` | no | v6.html:57926 | 02b-train-logging |
| v6.html:10405, 10646, 10658, 10679, 11549 | `lk_activeWorkoutRestTarget` | yes | v6.html:10405, 10646, 10658, 10679, 11549 | 02b-train-logging |
| v6.html:10388, 10664 | `lk_activeWorkoutRows` | yes | v6.html:10388, 10664 | 02b-train-logging |
| v6.html:10398, 10665 | `lk_activeWorkoutSec` | yes | v6.html:10398, 10665 | 02b-train-logging |
| v6.html:13470 (written elsewhere, v6.html:32996) | `lk_hidePartials` | yes | v6.html:13470 (written elsewhere, v6.html:32996) | 02b-train-logging |
| v6.html:57425-57459, 15045 | `lk_history`, `lk_prs`, `lk_splits` | via props | v6.html:57425-57459, 15045 | 02b-train-logging |
| v6.html:10020, 10323 | `lk_holdTipSeen` | yes | v6.html:10020, 10323 | 02b-train-logging |
| v6.html:10426, 11515 | `lk_restEnabled` | yes | v6.html:10426, 11515 | 02b-train-logging |
| via v6.html:4379 | `lk_weightStorageUnit` | indirect (`storedWeightUnit`) | via v6.html:4379 | 02b-train-logging |
| v6.html:10633-10639 | `lockedRest` broadcast effect` | hook | Dispatch rest state for the out-of-screen rest pill | 02b-train-logging |
| v6:43533-43541 | `markStapleBought` | function | Stamp lastBought, clear empty | 04-shopping-budget |
| v6:46135-46142 | `markSuppTaken` | function | Mark a supplement taken today — supplements module | 04-shopping-budget |
| v6.html:10131-10145 | `mkBlock` | function | Build a note-block row object | 02b-train-logging |
| v6.html:10052-10130 | `mkRow` | function | Build an exercise row, prefilled from last session or 3 blanks | 02b-train-logging |
| v6:42506-42510 | `normaliseName` | function | Title-case an item name | 04-shopping-budget |
| v6.html:10621-10626 | `noteActivity` | function | Reset idle tracking and re-arm the server idle check | 02b-train-logging |
| v6.html:11190-11209 | `onDragEnd` | function | Spring to the drop position and splice `rows` | 02b-train-logging |
| v6.html:10951-10962 | `onLongPressCancel` | function | Cancel the pending reorder long-press | 02b-train-logging |
| v6.html:10937-10967 | `onLongPressStart` | handler | Arm the 350 ms hold that enters wiggle/reorder mode | 02b-train-logging |
| v6.html:10923-10925 | `onTouchCancelSet` | handler | Reset the swipe | 02b-train-logging |
| v6.html:10914-10922 | `onTouchEndSet` | handler | Delete the set if the projected swipe passes the threshold | 02b-train-logging |
| v6.html:10873-10913 | `onTouchMoveSet` | handler | Track dx/velocity, abort on vertical scroll, tick at -80 px | 02b-train-logging |
| v6.html:10859-10872 | `onTouchStartSet` | handler | Begin tracking a set-row swipe | 02b-train-logging |
| v6:42585-42598 | `openAllAtStore` | handler | Open up to 10 items at one store | 04-shopping-budget |
| v6.html:10659-10668 | `persistence effect` | hook | Persist rows + seconds when any progress exists | 02b-train-logging |
| v6.html:9174-9187 | `pickEx` | handler | Append the picked exercise to the day being edited | 02b-train-logging |
| v6.html:10677-10683 | `pickRest` | function | Set the next rest length, or retarget if one is running | 02b-train-logging |
| v6.html:10640-10644 | `pushRest` | function | Schedule the server-side rest notification | 02b-train-logging |
| v6:42619-42622 | `quickAdd` | handler | Add a FITNESS_PICKS entry | 04-shopping-budget |
| v6.html:10295-10299 area (295-… `function releaseHold(keepPress)`) | `releaseHold` | function | Tear down a pending hold and its listeners | 02b-train-logging |
| v6:43614-43620 | `remove (pantry)` | handler | Two-tap delete a pantry item | 04-shopping-budget |
| v6.html:9139-9145 | `removeDay` | handler | Delete a day | 02b-train-logging |
| v6.html:9146-9159 | `removeItem` | handler | Delete one exercise/block from a day | 02b-train-logging |
| v6:42558-42561 | `removeItem` | handler | Delete one list item | 04-shopping-budget |
| v6.html:10817-10823 area (`function removeRow(ri)`) | `removeRow` | function | Delete a whole exercise/block row | 02b-train-logging |
| v6.html:10813-10823 | `removeSet` | function | Delete one set from a row | 02b-train-logging |
| v6.html:11006-11020 | `resetDragState` | function | Clear all reorder refs and state | 02b-train-logging |
| v6.html:10571-10604 | `rest countdown effect` | hook | 500 ms rest tick, expiry alert | 02b-train-logging |
| v6.html:10656-10683 area (10684-…) | `rest visibility effect` | hook | Re-sync the rest countdown on tab return | 02b-train-logging |
| v6.html:10656-10676 | `retargetRest` | function | Re-aim an in-flight rest without restarting it | 02b-train-logging |
| v6.html:10707-10714 | `rowUsesKg` | function | Resolve a row's effective unit (`kg` override or global) | 02b-train-logging |
| v6:43971-43973 | `saveBudgetData` | function | Write `lk_budgetData` | 04-shopping-budget |
| v6:43600-43612 | `saveInterval` | handler | Validate + save restock interval (1–365) | 04-shopping-budget |
| v6:45231-45233 | `saveMealPlans` | function | Write `lk_mealPlans` | 04-shopping-budget |
| v6:43418-43420 | `savePantry` | function | Write `lk_pantryItems` | 04-shopping-budget |
| v6:44025-44036 | `saveTarget` | handler | Validate + save the weekly target | 04-shopping-budget |
| v6.html:9188-9219 | `save` (SplitBuilder)` | handler | Serialise days into `{exIds, blocks}` and emit the split | 02b-train-logging |
| v6.html:9100-9123 | `sb autoscroll effect` | hook | Edge auto-scroll while dragging a split-builder row | 02b-train-logging |
| v6.html:9087-9099 | `sb drag cleanup effect` | hook | Same, for the split builder | 02b-train-logging |
| v6.html:8993-9001 | `sbDetach` | function | Remove the active drag document listeners | 02b-train-logging |
| v6.html:9013-9086 | `sbDragEnd` | function | Spring-animate the drop and commit the item reorder | 02b-train-logging |
| v6.html:8985-9001 area (`function sbLongCancel()` at 8985) | `sbLongCancel` | function | Cancel the pending long-press timer/listener | 02b-train-logging |
| v6.html:8813-8966 | `sbLongStart` | handler | Arm 350 ms long-press then start a split-builder row drag | 02b-train-logging |
| v6.html:9002-9012 | `sbReset` | function | Clear all split-builder drag refs and state | 02b-train-logging |
| v6.html:8967-9001 | `sbUpdateTarget` | function | Move the dragged row and shift neighbours to the insertion index | 02b-train-logging |
| v6:42501-42505 | `selectSuggestion` | handler | Fill the input from a suggestion row | 04-shopping-budget |
| v6:43587-43590 | `set (pantry)` | handler | Set state + persist pantry | 04-shopping-budget |
| v6:43999-44002 | `setData` | handler | Set state + persist budget data | 04-shopping-budget |
| v6:45249-45252 | `setPlans` | handler | Set state + persist plans | 04-shopping-budget |
| v6.html:10277-10294 | `setPress` | function | Squeeze/release a card under a long press | 02b-train-logging |
| v6.html:10853-10856 | `setSsSwipe2` | function | Same, for superset pair swipes | 02b-train-logging |
| v6:42087-42090 | `setStores` | handler | Set state + persist stores | 04-shopping-budget |
| v6.html:10849-10852 | `setSwipe2` | function | Write the set-swipe state to both ref and state | 02b-train-logging |
| v6.html:10715-10736 | `setVal` | function | Write one field of one set, converting weight to storage unit | 02b-train-logging |
| v6.html:10045-10051 | `staleLast` | function | True when the last session was >31 days ago or undateable | 02b-train-logging |
| v6.html:10645-10655 | `startRest` | function | Persist the target and start a fresh rest countdown | 02b-train-logging |
| v6.html:11210-11214 | `startWiggleDrag` | handler | Start a drag from a card already in wiggle mode | 02b-train-logging |
| v6:43466-43487 | `suggestRestockInterval` | function | Mean purchase gap (3–60 d) from budget history | 04-shopping-budget |
| v6.html:10841-10844 | `swipeRubber` | function | Rubber-band resistance for a rightward swipe | 02b-train-logging |
| v6.html:10845-10848 | `swipeShouldDelete` | function | Project the swipe with friction and decide if it deletes | 02b-train-logging |
| v6.html:9853-9863 | `tap` | handler | Append a digit / decimal / delete, capped at 6 chars | 02b-train-logging |
| v6.html:10737-10812 | `toggleDone` | function | Tick/untick a set: haptics, animation, PR check, rest start | 02b-train-logging |
| v6:43621-43631 | `toggleEmpty` | handler | Flip out-of-stock; add to list on empty | 04-shopping-budget |
| v6:42562-42565 | `toggleItem` | handler | Check/uncheck a list item | 04-shopping-budget |
| v6.html:10252-10262 | `toggleRowUnit` | handler | Override kg/lb for one row | 02b-train-logging |
| v6.html:10214-10240 | `toggleSetType` | handler | Cycle normal → warmup → drop, auto-filling 75 % on drop | 02b-train-logging |
| v6:43591-43599 | `toggleStaple` | handler | Mark/unmark staple, seed interval | 04-shopping-budget |
| v6:42127-42133 | `toggleStore` | handler | Flip `enabled` | 04-shopping-budget |
| v6.html:10382-10420 | `toggleSuperset` | handler | Link/unlink two consecutive exercises | 02b-train-logging |
| v6.html:10241-10251 | `toggleUnilateral` | handler | Flip L/R tracking on a row | 02b-train-logging |
| v6.html:9160-9173 | `updateBlock` (SplitBuilder)` | handler | Patch a block item's title/notes/duration | 02b-train-logging |
| v6.html:10159-10170 | `updateBlock` (WorkoutLog)` | handler | Patch a block row (notes / expanded) | 02b-train-logging |
| v6.html:10968-10995 | `updateDragTarget` | function | Move the dragged card and shift others to the target index | 02b-train-logging |
| v6.html:10561-10570 area | `visibility effect (session)` | hook | Re-sync elapsed time on tab return | 02b-train-logging |
| v6.html:11240-11274 | `wrapRow` | function | Cross-fade a row between its compact and full renderings | 02b-train-logging |
| `"07:30"` | `Training day send time` | `<input type=time>` | `"07:30"` | 06-profile |
| `"08:00"` | `Check-in send time` | `<input type=time>` | `"08:00"` | 06-profile |
| :19-31 | `(theme pre-paint IIFE)` | anon block | Applies persisted/system style profile before first paint | 10-shared |
| `:19` | `lk_theme` | yes | pre-paint theme script | 09-onboarding-system |
| :36-40 | `(text scale block)` | anon block | Applies `lk_textScale` to root font-size | 10-shared |
| :45-56 | `keyboardChrome` | named IIFE | Toggles `.lk-kb-open` from visualViewport | 10-shared |
| :49-51 | `sync` | closure fn | Classlist toggle helper | 10-shared |
| `:62-68` | `lockZoom` | IIFE | Blocks pinch-zoom gestures document-wide | 09-onboarding-system |
| :63-68 | `lockZoom` | named IIFE | Blocks pinch-zoom gestures | 10-shared |
| :70-74 | `(SW register block)` | anon block | Registers `/sw.js` on load | 10-shared |
| `:70-74` | `SW registration` | inline script | Registers `/sw.js` on window load | 09-onboarding-system |
| `:76-90`+ | `checkDeployVersion` | IIFE | Compares deployed version and busts caches on change | 09-onboarding-system |
| `:79`, `:84-90` | `lk_deployVersion` | yes | `checkDeployVersion` | 09-onboarding-system |
| :81-116 | `checkDeployVersion` | named IIFE | Version check + cache bust + reload | 10-shared |
| `#B91C1C` (shell `<style>` only, `:1226`) | `--color-error-deep` | `#B91C1C` (shell `<style>` only, `:1226`) |  | 10-shared |
| `:164-169` | `lk_guestMode` | yes | `isGuestMode`, `enterGuestMode` | 09-onboarding-system |
| `:168-178` | `enterGuestMode` | function | Seeds a fake profile so guests skip onboarding, then reloads | 09-onboarding-system |
| sync timestamp stamps (F:236-240, F:1181-1184, F:1193) | `__lk_ts__lk_mcProfile`, `__lk_ts__lk_mcDays` | — | sync timestamp stamps (F:236-240, F:1181-1184, F:1193) | 06b-cycle |
| Shared AI helper, `max_tokens:700`, gated-response handling, `logBetaAI` | `aiCall` | function | Shared AI helper, `max_tokens:700`, gated-response handling, `logBetaAI` | 05-coach |
| `{system, max_tokens: 700, messages:[{role:"user", content}]}`, headers from `authHeaders()` (2665-2678) | `https://lockedapi.cescocugliari.workers.dev/` | POST | `getGoalAiAnalysis` (27233), `getAiBfEstimate` (27204) | 01-home |
| `window.LOCKED.cycleSyncEnabled` / `setCycleSync` (F:1175-1205), toggled at F:24304 and F:26006 | `lk_mcCloudSync` | yes | `window.LOCKED.cycleSyncEnabled` / `setCycleSync` (F:1175-1205), toggled at F:24304 and F:26006 | 06b-cycle |
| `:1307`, `:1344`, `:1358` | `lk_pushDeviceId` | yes | `deviceId` | 09-onboarding-system |
| `:1308`, `:1365`, `:1667` | `lk_pushPrefs` | yes | `getPrefs`, `setPrefs` | 09-onboarding-system |
| `:1309`, `:1636`, `:1650`, `:1660` | `lk_pushEnabled` | yes | `enable`, `disable`, `isEnabled` | 09-onboarding-system |
| `:1323-1338` | `readRaw` / `writeRaw` | function | try/catch JSON localStorage helpers scoped to the push module | 09-onboarding-system |
| :1325-1333 | `readRaw` | fn | Raw JSON localStorage read w/ fallback | 10-shared |
| :1334-1341 | `writeRaw` | fn | Raw JSON localStorage write | 10-shared |
| `:1342-1362` | `deviceId` | function | Stable per-device UUID, excluded from cloud sync | 09-onboarding-system |
| :1342-1362 | `deviceId` | fn | Stable per-device id, crypto random | 10-shared |
| :1363-1367 | `getPrefs` | fn | Merge stored prefs over `DEFAULT_PREFS` | 10-shared |
| `:1364-1367` | `getPrefs` | function | DEFAULT_PREFS merged with stored prefs | 09-onboarding-system |
| :1368-1375 | `timeZone` | fn | IANA tz string | 10-shared |
| `:1369-1375` | `timeZone` | function | IANA tz with a `"UTC"` fallback | 09-onboarding-system |
| :1376-1384 | `todayISO` | fn | Local YYYY-MM-DD (push-module copy of `isoDay`) | 10-shared |
| `:1377-1396` | `todayISO` / `dayOf` | function | Local-calendar day helpers (duplicated at `:1954-1976`) | 09-onboarding-system |
| :1385-1400 | `dayOf` | fn | **Duplicate** of the global `dayOf` (`:1969`) inside this IIFE | 10-shared |
| `:1400-1404` | `isIOS` | function | UA + maxTouchPoints iOS/iPadOS detection | 09-onboarding-system |
| :1401-1406 | `isIOS` | fn | UA sniff | 10-shared |
| `:1407-1410` | `isStandalone` | function | `navigator.standalone` or `display-mode: standalone` | 09-onboarding-system |
| :1407-1411 | `isStandalone` | fn | Installed-PWA check | 10-shared |
| :1412-1421 | `supported` | fn | Whether web push can work here | 10-shared |
| `:1413-1417` | `supported` | function | SW + PushManager + Notification present | 09-onboarding-system |
| `:1418-1430`+ | `buildContext` | function | Snapshot of next split day, streak, trained/checked-in today | 09-onboarding-system |
| `:1421` | `lk_history` | yes | `buildContext` | 09-onboarding-system |
| :1422-1555 | `buildContext` | fn | Server-side snapshot: next split day, streak, trained/checked-in today, due supplements/compounds/restock | 10-shared |
| `:1422` | `lk_feedback` | yes | `buildContext` | 09-onboarding-system |
| :1556-1563 | `post` | fn | POST helper to Worker `/push/*` | 10-shared |
| :1564-1572 | `b64uToUint8` | fn | base64url → VAPID key bytes | 10-shared |
| :1577-1647 | `enable` | async fn | Permission, SW ready, VAPID fetch, subscribe | 10-shared |
| `:1578-1646` | `enable` | async function | Requests permission, subscribes, registers with the Worker | 09-onboarding-system |
| `:1648-1657` | `disable` | async function | Unsubscribes locally and on the Worker | 09-onboarding-system |
| :1648-1658 | `disable` | async fn | Unsubscribe | 10-shared |
| `:1659-1663` | `isEnabled` | function | True only if the flag is set AND permission is granted | 09-onboarding-system |
| :1659-1665 | `isEnabled` | fn | Reads `lk_pushEnabled` | 10-shared |
| `:1665-1678` | `setPrefs` | async function | Persists prefs locally and on the Worker, re-registering on 404 | 09-onboarding-system |
| :1666-1682 | `setPrefs` | async fn | Merge + push prefs to server | 10-shared |
| `:1682-1699` | `refresh` | async function | Re-uploads the reminder context, throttled to 60s | 09-onboarding-system |
| :1687-1701 | `refresh` | async fn | Re-send context snapshot (throttled) | 10-shared |
| `:1702-1709` | `test` | async function | Fires a test push | 09-onboarding-system |
| :1702-1714 | `test` | async fn | Fire a test notification | 10-shared |
| `:1712-1722` | `postHealing` | async function | POST that re-registers and retries once on a 404 | 09-onboarding-system |
| :1715-1723 | `postHealing` | async fn | Retry a POST after re-enabling | 10-shared |
| `:1723-1731` | `scheduleRest` | function | Asks the Worker to push a rest-timer alert in N seconds | 09-onboarding-system |
| :1724-1732 | `scheduleRest` | fn | Server-scheduled rest-timer alarm | 10-shared |
| `:1733-1737` | `cancelRest` | function | Cancels a pending rest alert | 09-onboarding-system |
| :1733-1741 | `cancelRest` | fn | Cancel that alarm | 10-shared |
| `:1743-1757` | `scheduleIdleCheck` | function | Schedules the "still training?" nudge, throttled | 09-onboarding-system |
| :1744-1756 | `scheduleIdleCheck` | fn | Idle-workout nudge | 10-shared |
| :1757-1763 | `cancelIdleCheck` | fn | Cancel idle nudge | 10-shared |
| `:1758-1762` | `cancelIdleCheck` | function | Cancels the idle nudge | 09-onboarding-system |
| `:1764-1772` | `status` | function | Reports support/needsInstall/permission/enabled/prefs | 09-onboarding-system |
| :1764-1777 | `status` | fn | `{supported, needsInstall, permission, enabled}` | 10-shared |
| `:1777-1788` | `SW `message` listener` | handler | Handles `resubscribe` and re-dispatches taps as `lockedPushOpen` | 09-onboarding-system |
| `:1791-1793` | `visibilitychange` listener` | handler | Refreshes reminder context on foreground | 09-onboarding-system |
| :1809-1818 | `getSound` / `setSound` | fn | Alert sound preference (`bell`/`plate`/`none`) | 10-shared |
| :1819-1829 | `audio` | fn | Lazily create/resume AudioContext | 10-shared |
| :1830-1853 | `playBell` | fn | Synthesised bell (additive partials) | 10-shared |
| :1854-1897 | `playPlate` | fn | Synthesised plate clank (thud + noise + ring) | 10-shared |
| :1898-1913 | `playAlert` | fn | Dispatch by preference + `navigator.vibrate([180,90,180])` | 10-shared |
| :1941-1950 | `(boot heal IIFE)` | anon | Re-subscribe if permission still granted but subscription gone | 10-shared |
| `:1944-1951` | `boot self-heal` | IIFE tail | Re-subscribes if the flag is on but the subscription is gone | 09-onboarding-system |
| :1961-1964 | `isoDay` | fn | **Local** calendar day `YYYY-MM-DD` (avoids the UTC off-by-one) | 10-shared |
| :1969-1977 | `dayOf` | fn | Calendar day of a stored date (bare date or ISO timestamp) | 10-shared |
| :1979 | `_extends` | fn | Babel `Object.assign` polyfill helper | 10-shared |
| :2121-2139 | `useHubState` | hook | Persisted hub sub-tab state with an allow-list | 10-shared |
| :2140-2149 | `useTabReset` | hook | Subscribes to the `lockedTabReset` window event | 10-shared |
| :2150-2267 | `useSheetDrag` | hook | Drag-to-dismiss bottom sheets with a spring | 10-shared |
| :2161-2164 | `↳ `setY` | closure | Writes `translateY` directly to the node | 10-shared |
| :2165-2188 | `↳ `springTo` | closure | Critically-damped spring integrator | 10-shared |
| :2189-2207 | `↳ `start` | closure | Touch start; cancels entry keyframe | 10-shared |
| :2208-2222 | `↳ `move` | closure | Tracks drag, rubber-bands upward, EMA velocity | 10-shared |
| :2223-2237 | `↳ `end` | closure | Projects momentum; dismiss past 45% height | 10-shared |
| :2238-2243 | `↳ `cancel` | closure | Springs back on touchcancel | 10-shared |
| :2248-2255 | `↳ `close` | closure | Programmatic dismissal through the same exit | 10-shared |
| :2349-2387 | `migratePrDates` | fn | One-shot: recover real dates for PRs stamped `"Today"` | 10-shared |
| :2393-2406 | `migrateSuppReminders` | fn | One-shot: force `reminder:true` on supplements | 10-shared |
| :2417-2427 | `ld` | fn | Namespaced JSON read (`lk_` prefix) with fallback | 10-shared |
| :2430-2433 | `lkIsQuotaError` | fn | Cross-browser quota-error detection | 10-shared |
| :2435-2455 | `sd` | fn | Namespaced JSON write; returns bool; quota toast + event | 10-shared |
| :2456-2467 | `lkStorageUsage` | fn | Approximate bytes used, photo bytes, 5 MB budget | 10-shared |
| :2500-2510 | `initTheme` | fn | Resolve stored/system profile at React boot | 10-shared |
| :2511-2529 | `applyTheme` | fn | Stamp attribute/class, update theme-color, persist | 10-shared |
| :2530-2533 | `toggleTheme` | fn | Binary dark↔light toggle + `theme-changed` event | 10-shared |
| :2534-2537 | `setTheme` | fn | Set a named profile + `theme-changed` event | 10-shared |
| `:2540-2599` | `ErrorBoundary` | component (class) | App-wide crash screen with a Refresh button | 09-onboarding-system |
| :2540-2600 | `ErrorBoundary` | React class | App-level crash screen | 10-shared |
| `:2601-2655` | `ScreenBoundary` | component (class) | Per-screen crash panel with a Reload button | 09-onboarding-system |
| :2601-2657 | `ScreenBoundary` | React class | Per-screen crash screen | 10-shared |
| :2658-2662 | `authHeaders` | fn | JSON + Bearer header builder from `window.LOCKED.session` | 10-shared |
| :2663-2696 | `aiCall` | fn | Single AI request wrapper (Worker root URL) | 10-shared |
| Generation needs POST `/` (`:2664`); logging is offline | `Recipe (AI / pantry)` | 40825-40851, 40791-40824, 41380-41416 | Model-estimated recipe totals | 03c-fuel-entry |
| :2698-2720 | `initBetaCodes` | fn | Seed `DEFAULT_BETA_CODES` (Agent 8 owns) | 10-shared |
| inside `aiCall` (`:2699`) | `lk_betaStatus` | inside `aiCall` (`:2699`) | F-FUEL-420, 421, 423 | 03c-fuel-entry |
| `:2700-2720`, `:2723`, `:2765` | `lk_betaCodes` | yes | `initBetaCodes`, `validateBetaCode`, `claimBetaCode` | 09-onboarding-system |
| `:2722-2728` | `validateBetaCode` | function | Checks a code against the local `lk_betaCodes` list | 09-onboarding-system |
| :2722-2727 | `validateBetaCode` | fn | Local code check | 10-shared |
| :2728-2752 | `validateBetaCodeRemote` | fn | Worker `/beta-validate` | 10-shared |
| `:2729-2756` | `validateBetaCodeRemote` | function | Local-then-remote invite-code validation (fails open offline) | 09-onboarding-system |
| :2753-2767 | `claimBetaCode` | fn | Mark claimed, set beta flags | 10-shared |
| `:2757-2769` | `claimBetaCode` | function | Marks a code used and flips the beta flags | 09-onboarding-system |
| `:2766`, `:2771`, `:2782` | `lk_betaStatus` | yes | `claimBetaCode`, `logBetaActivity`, `logBetaAI` | 09-onboarding-system |
| `:2767` | `lk_betaCode` | — | `claimBetaCode` | 09-onboarding-system |
| `:2768`, `:2794` | `lk_betaId` | yes | `claimBetaCode`, `isSilentBeta`, loggers | 09-onboarding-system |
| :2768-2778 | `logBetaActivity` | fn | Append to `lk_betaLog` | 10-shared |
| `:2770-2780` | `logBetaActivity` | function | Appends an action record to `lk_betaLog` when beta is active | 09-onboarding-system |
| `:2772-2779` | `lk_betaLog` | yes | `logBetaActivity` | 09-onboarding-system |
| :2779-2789 | `logBetaAI` | fn | Append prompt/response to `lk_betaAILog` | 10-shared |
| `:2781-2791` | `logBetaAI` | function | Appends an AI turn to `lk_betaAILog` when beta is active | 09-onboarding-system |
| `:2783-2790` | `lk_betaAILog` | yes | `logBetaAI` | 09-onboarding-system |
| :2792-2795 | `isSilentBeta` | fn | Suppress beta UI for listed ids | 10-shared |
| `:2793-2795` | `isSilentBeta` | function | True for the hardcoded `summerbeta` id | 09-onboarding-system |
| :2796-2836 | `syncBetaData` | fn | POST the beta payload to `/beta-sync` | 10-shared |
| :2837-2851 | `(midnight beta sync IIFE)` | anon | 60 s interval; syncs once at 00:00 local | 10-shared |
| :2856-2877 | `saveProgressPhoto` | fn | Append photo, roll back if the write fails | 10-shared |
| :2878-2905 | `resizeImage` | fn | Two-axis downscale → JPEG q0.6 data URL | 10-shared |
| :2907-2909 | `getWeightLog` | fn | Read `lk_weightLog` | 10-shared |
| :2910-2932 | `addWeightEntry` | fn | Upsert today's kg, sort, persist | 10-shared |
| :2933-2963 | `checkRefeedTrigger` | fn | Three consecutive all-time-low weigh-ins on a cut | 10-shared |
| :2964-2972 | `calcRefeedCarbs` | fn | Refeed carb bump by TDEE/bodyweight | 10-shared |
| :2975-4257 | `GROUPS` | data | Muscle-group → sub-group → exercise catalogue | 10-shared |
| :4258-4275 | `ALL_EX` build` | IIFE-ish loop | Flatten GROUPS into a searchable list | 10-shared |
| :4276-4290 | `(custom exercise merge)` | anon IIFE | Append `lk_customEx` entries not already present | 10-shared |
| :4291-4297 | `unitConvOn` | fn | Whether unit conversion is enabled (default true) | 10-shared |
| :4307-4313 | `lkLum` | fn | WCAG relative luminance | 10-shared |
| :4314-4316 | `lkRatio` | fn | WCAG contrast ratio | 10-shared |
| :4318-4344 | `readableAccent` | fn | Lighten/darken a palette hex until ≥4.5:1 on the card; memoised | 10-shared |
| :4351-4356 | `fmtQ` | fn | Round to nearest 0.25, no trailing decimals | 10-shared |
| :4357-4360 | `fmtCal` | fn | Whole-number calories | 10-shared |
| :4380-4411 | `storedWeightUnit` | fn | Resolve-once-and-record what stored lift weights mean | 10-shared |
| :4414-4419 | `storedToUnit` | fn | Stored unit → display unit | 10-shared |
| :4420-4425 | `unitToStored` | fn | Display unit → stored unit | 10-shared |
| :4430-4435 | `kgToDisp` | fn | Display string for a stored weight (quarter-rounded) | 10-shared |
| :4439-4443 | `liftDisp` | fn | Numeric display for a **lift** weight, 1 dp | 10-shared |
| :4444-4451 | `dispToKg` | fn | Typed value → stored value, 4 dp | 10-shared |
| :4455-4463 | `freezeWeightStorageUnit` | named IIFE | Resolve+record the unit at boot; sets the retired migration guard | 10-shared |
| :4465-4470 | `convToKg` | fn | Lenient display→stored conversion | 10-shared |
| :4479-4486 | `e1rm` | fn | Epley estimated 1RM; a single is returned uninflated | 10-shared |
| :4491-4511 | `prSummary` | fn | Heaviest single / best 6–8 working set / best est-1RM | 10-shared |
| :4529-4535 | `compoundRank` | fn | Rank a lift name against `PR_COMPOUNDS` regexes | 10-shared |
| :4540-4547 | `prDay` | fn | Real day for a PR, or null for legacy `"Today"` | 10-shared |
| :4551-4561 | `prLabel` | fn | "Today"/"Yesterday"/"N days ago"/locale date | 10-shared |
| :4568-4592 | `e1rmSeries` | fn | Est-1RM time series per exercise from history + PRs | 10-shared |
| :4594-4596 | `throwbackForced` | fn | Dev bypass via `lk_throwbackForce` | 10-shared |
| :4597-4662 | `computeThrowback` | fn | Build the past-vs-now comparison card | 10-shared |
| :4663 | `dismissThrowback` | fn | Record dismissal timestamp | 10-shared |
| :18441-18488 | `DsHeader` | component | Large-title page header w/ eyebrow, subtitle, actions, tint wash | 10-shared |
| :18489-18512 | `DsSection` | component | Titled section wrapper w/ action slot and footnote | 10-shared |
| :18513-18529 | `DsCard` | component | Elevated/soft surface card, optional accent border, keyboard-activatable | 10-shared |
| :18530-18572 | `DsRow` | component | List row: leading/label/detail/value/trailing, 48 or 38 px | 10-shared |
| :18573-18609 | `DsSegmented` | component | ARIA tablist segmented control | 10-shared |
| :18610-18640 | `DsStat` | component | Uppercase label + tabular-nums value + unit + detail | 10-shared |
| `mcGetProfile`/`mcSaveProfile` (F:21934-21939); deleted F:26009 | `lk_mcProfile` | yes | `mcGetProfile`/`mcSaveProfile` (F:21934-21939); deleted F:26009 | 06b-cycle |
| `mcGetDays`/`mcSaveDays` (F:21940-21945); deleted F:26010 | `lk_mcDays` | yes | `mcGetDays`/`mcSaveDays` (F:21940-21945); deleted F:26010 | 06b-cycle |
| `isFemaleUser` gate (F:21946-21951) | `lk_profile`, `lk_fuelProfile` | yes | `isFemaleUser` gate (F:21946-21951) | 06b-cycle |
| F:22417-22595 | `McRing` | component | 272px SVG cycle ring with phase arcs, today marker and drag-scrub | 06b-cycle |
| F:22463-22465 | `angA` | function (inner) | Start angle for a cycle day | 06b-cycle |
| F:22466-22468 | `angB` | function (inner) | End angle for a cycle day | 06b-cycle |
| F:22469-22482 | `scrub` | handler (inner) | Pointer position → previewed cycle day | 06b-cycle |
| F:22596-22750 | `CycleTrackerCard` | component | Home-feed cycle card: setup promo or day/phase status | 06b-cycle |
| F:22751-23146 | `McOnboarding` | component | 5-step cycle setup wizard | 06b-cycle |
| F:22762-22775 | `finish` | handler (inner) | Build + persist the cycle profile, clamp lengths | 06b-cycle |
| F:22776-22795 | `Btn` | component (inner) | Full-width orange primary CTA used across onboarding steps | 06b-cycle |
| F:22796-22834 | `optBtn` | function (inner) | Renders a selectable option row with label + description | 06b-cycle |
| F:23147-23753 | `McLogSheet` | component | Bottom sheet for logging one day (flow, symptoms, mood, energy, sleep, sex, events, note) | 06b-cycle |
| F:23157-23159 | `set` | handler (inner) | Patch today's/this day's log | 06b-cycle |
| F:23160-23166 | `setEv` | handler (inner) | Set or delete one event key | 06b-cycle |
| F:23167-23175 | `cycleSym` | handler (inner) | Advance a symptom through severity 0→1→2→3→0 | 06b-cycle |
| F:23754-24065 | `McCalendar` | component | Month grid with logged/predicted period, fertile and PMS overlays, stats and history chart | 06b-cycle |
| F:23787-23789 | `cellISO` | function (inner) | Day number → ISO date for the displayed month | 06b-cycle |
| F:24066-24404 | `McSettings` | component | Cycle settings sheet: lengths, irregular, BC, discreet, cloud backup, export, delete | 06b-cycle |
| F:24070-24072 | `upd` | handler (inner) | Merge a patch into the cycle profile | 06b-cycle |
| F:24073-24075 | `exportData` | handler (inner) | Export button handler | 06b-cycle |
| F:24076-24110 | `row` | function (inner) | Settings row layout (label + control + description) | 06b-cycle |
| F:24111-24146 | `toggle` | function (inner) | iOS-style switch used by settings rows | 06b-cycle |
| F:24405-24500 | `McHealthCard` | component | Surfaces an athlete/amenorrhea health flag with acknowledge or doctor-export | 06b-cycle |
| F:24501-24586 | `McRecoveryCard` | component | Post-abortion/miscarriage recovery explainer with expectation window and red-flag advice | 06b-cycle |
| F:24587-24653 | `McEcCard` | component | Morning-after-pill aftermath card, dismissable | 06b-cycle |
| F:24654-24776 | `McTrainingCard` | component | Phase/symptom-aware training guidance with lighter/keep decision | 06b-cycle |
| F:24777-24872 | `McNutritionCard` | component | Phase-specific fuel tip with dismiss and Open Fuel link | 06b-cycle |
| F:24873-24875 | `mcFuelAdjustOn` | function | Reads the luteal calorie-allowance preference | 06b-cycle |
| `mcFuelAdjustOn` (F:24874), `sd("mcFuelAdjust", n)` (F:25037) | `lk_mcFuelAdjust` | yes | `mcFuelAdjustOn` (F:24874), `sd("mcFuelAdjust", n)` (F:25037) | 06b-cycle |
| F:24876-24911 | `mcFuelContext` | function | Builds the cycle context object Fuel would consume (phase, tip, ironFocus, calAdj) | 06b-cycle |
| F:24912-24914 | `mcLutealCalBump` | function | 5% of base calories, rounded to 10, capped at 150 kcal | 06b-cycle |
| F:24915-25063 | `McFuelStrip` | component | Fuel-tab cycle strip: phase tip, iron progress, luteal kcal toggle | 06b-cycle |
| F:25064-25107 | `McTrainBanner` | component | Train-tab nudge when today's cycle log looks rough | 06b-cycle |
| F:25108-26099 | `CycleTrackerScreen` | component | The whole cycle screen: state owner, ring/calendar views, cards, sheets | 06b-cycle |
| F:25119-25122 | `setMcp` | handler (inner) | Persist + set the cycle profile | 06b-cycle |
| F:25123-25128 | `updateDay` | handler (inner) | Merge a patch into one day and persist the whole day map | 06b-cycle |
| F:25191-25202 | `quickLogPeriod` | handler (inner) | One-tap log/unlog today's period at flow 3 | 06b-cycle |
| `cycletrack` home block visibility (F:26105-26111, F:26169) | `lk_homeLayout` | yes | `cycletrack` home block visibility (F:26105-26111, F:26169) | 06b-cycle |
| `:31756`+ | `NotificationsCard` | component | Settings UI for the push switch and per-type prefs | 09-onboarding-system |
| `:33808-34767` | `Onboarding` | component | The entire 4-step first-run flow | 09-onboarding-system |
| `:33825-33827` | `scroll-pin effect` | hook (`useEffect` on `[msgs]`) | Pins the chat scroller to the bottom on new messages | 09-onboarding-system |
| `:33828-33833` | `kickoff effect` | hook (`useEffect` on `[step]`) | Auto-starts the AI interview 100ms after reaching step 4 | 09-onboarding-system |
| `:33835-33843` | `getChatSys` | function | Builds the conversational coach system prompt | 09-onboarding-system |
| `:33837` | `3` | 4 | AI-generated; model told to elicit **main goal** | 09-onboarding-system |
| `:33844-33855` | `getGenSys` | function | Builds the program-generation system prompt from prior answers | 09-onboarding-system |
| `:33856-33880` | `callWorker` | function | POSTs `{system,max_tokens,messages}` to the Worker and normalises the reply | 09-onboarding-system |
| `:33881-33884` | `tryParseProg` | function | Extracts and `JSON.parse`s the JSON between the two markers | 09-onboarding-system |
| `:33885-33917` | `kickoffChat` | function | Sends the seed "hi" turn and renders the first coach question (or a fallback) | 09-onboarding-system |
| `:33918-34011` | `send` | function | Submits an answer; after 3 answers switches to program generation | 09-onboarding-system |
| `:34011-34017` | `finish` | function | Hands `{displayName, username, useKg}` and optional program to the parent | 09-onboarding-system |
| `lk_profile.useKg` (boolean, `unitChoice === "kg"`, `:34015`/`:57349`) | `2` | 3 | "Choose your units" | 09-onboarding-system |
| `:34090-34093` | `beta-code `onChange` handler` | handler | Uppercases the code and clears the error | 09-onboarding-system |
| `:34106-34120` | `Verify `onClick` handler` | handler | Validates the invite code locally then remotely | 09-onboarding-system |
| `:34177-34179` | `"I Agree" `onClick` handler` | handler | Records agreement to the beta terms | 09-onboarding-system |
| `:34276-34278` | `GET STARTED `onClick` handler` | handler | Advances to step 2 unconditionally | 09-onboarding-system |
| `:34296-34298` | `username` `onChange` handler` | handler | Lowercases and strips to `[a-z0-9_]` | 09-onboarding-system |
| `:34311-34318` | `step-2 CONTINUE `onClick` handler` | handler | Claims the beta code if present and advances to step 3 | 09-onboarding-system |
| `:34374-34376` | `dispName` `onChange` handler` | handler | Stores the display name verbatim | 09-onboarding-system |
| `:34376-34424` | `unit option map callback` | function (inline `.map`) | Renders one unit radio card | 09-onboarding-system |
| `:34382-34384` | `unit option `onClick` handler` | handler | Selects kg or lbs | 09-onboarding-system |
| `:34426-34428` | `step-3 CONTINUE `onClick` handler` | handler | Advances to the AI interview | 09-onboarding-system |
| `:34518-34639` | `message map callback` | function (inline `.map`) | Renders one chat bubble, with the program card when present | 09-onboarding-system |
| `:34610-34637` | `split map callback` | function (inline `.map`) | Renders one split row inside the program card | 09-onboarding-system |
| `:34655-34664` | `typing-dot map callback` | function (inline `.map`) | Renders the three staggered loading dots | 09-onboarding-system |
| `done` true → the composer is replaced by SAVE MY PROGRAM / Skip (`:34666`) | `3` | 4 | — (result shown) | 09-onboarding-system |
| `:34671-34673` | `SAVE MY PROGRAM `onClick` handler` | handler | Finishes with the generated program | 09-onboarding-system |
| `:34674-34676` | `post-done Skip `onClick` handler` | handler | Finishes without the program | 09-onboarding-system |
| `:34702-34704` | `input `onChange` handler` | handler | Tracks the composer text | 09-onboarding-system |
| `:34705-34707` | `input `onKeyDown` handler` | handler | Sends on Enter | 09-onboarding-system |
| `:34723` | `send-button `onClick` | handler | Sends the answer | 09-onboarding-system |
| **Yes — "Skip - set up manually"** (`:34747`) | `3` | 4 | AI-generated. Model is told to elicit **training experience**. Offline fallback: "Hey {name}! How long have you been training and what is your main goal?" | 09-onboarding-system |
| `:34747-34749` | `pre-done Skip `onClick` handler` | handler | Abandons the interview and finishes | 09-onboarding-system |
| `:34768-35656` | `FOODS` | constant (array literal) | ~110-entry per-100g nutrition database | 09-onboarding-system |
| Partial — local `FOODS` (`:34768`) and My Store render offline (39546-39549); USDA/FatSecret/OFF need network | `Text search` | SearchTab 39493-39587 | Highest — real per-100 g database values | 03c-fuel-entry |
| Silent: local `estimateMacros` (`:35657`), then a fixed 400 kcal / 25-45-30 split (38595-38638). **No error shown.** | `Free-text AI estimate` | ListTab textarea 38680-38735 | Model-dependent; portion inferred from words only | 03c-fuel-entry |
| `:35657-35727` | `estimateMacros` | function | Parses free-text food entries into items + macro totals | 09-onboarding-system |
| `:35728-35751` | `calcTDEE` | function | Harris-Benedict BMR × activity multiplier, adjusted for cut/bulk | 09-onboarding-system |
| `:35752-35762` | `calcMacros` | function | Splits a TDEE into protein/fat/carb grams by goal | 09-onboarding-system |
| via `p.fuelProfile` prop (`:36912`) | `lk_fuelProfile` | via `p.fuelProfile` prop (`:36912`) | F-FUEL-417, 420, 421, 423 | 03c-fuel-entry |
| via `p.day` prop (`:36932`) | `lk_fuelLog` | via `p.day` prop (`:36932`) | F-FUEL-402, 404, 406, 409, 415, 418, 422, 424 | 03c-fuel-entry |
| FuelHub `:37433` | `ListTab` | component | Free-text meal entry + today's diary | 03c-fuel-entry |
| FuelHub `:37438` | `SearchTab` | component | Multi-source food search, detail card, My Store | 03c-fuel-entry |
| FuelHub `:37454` | `PhotoTab` | component | Photo/description AI meal analysis | 03c-fuel-entry |
| FuelHub `:37456` | `RecipesTab` | component | Static, AI, pantry and coach recipes | 03c-fuel-entry |
| via `getPantry()` (`:43415`) | `pantry key` | via `getPantry()` (`:43415`) | F-FUEL-423 | 03c-fuel-entry |
| not in range (written `:50399`) | `lk_coachRecipes` | 40773 | F-FUEL-424 | 03c-fuel-entry |
| `:57345-57407` | `completeOnboarding` | function | Persists the profile and converts the AI program into `splits` | 09-onboarding-system |
| `lk_profile.displayName` (at finish, `:57347`) | `1` | 2 | "YOUR NAME" | 09-onboarding-system |
| `lk_profile.username` (`:57348`) | `1` | 2 | "USERNAME" | 09-onboarding-system |
| `:57352`, `:171-175`, `:1419`, `:57556` | `lk_profile` | yes (gate, push context) | `completeOnboarding`, `enterGuestMode`, `buildContext` | 09-onboarding-system |
| `:57404`, `:1420` | `lk_splits` | yes (push context) | `completeOnboarding`, `buildContext` | 09-onboarding-system |
| `:57410-57411`, `:57370-57371` region → `:57370`, `:57371` | `activeWorkoutRows` / `activeWorkoutSec` | yes | `startWorkout`/`finishWorkout` (adjacent to `completeOnboarding`) | 09-onboarding-system |
| Wraps each routed screen, `key={screen}` (`:57734-57737`) | `ScreenBoundary` | Wraps each routed screen, `key={screen}` (`:57734-57737`) | "Reload" → `window.location.reload()` | 09-onboarding-system |
| Wraps the entire `<App/>` at the React root (`:58002`) | `ErrorBoundary` | Wraps the entire `<App/>` at the React root (`:58002`) | "Refresh Page" → `window.location.reload()` | 09-onboarding-system |
| `#080809` (`:1228`) | `--color-shell-bg` | `#080809` (`:1228`) |  | 10-shared |
| — | `#` | `step` | Question asked | 09-onboarding-system |
| — | `(CDN fallback)` | setTimeout | Show a CDN error panel if React is absent after 3 s | 08-auth-sync-root |
| — | `(anonymous Escape listener)` | handler | Global capture-phase Escape dispatcher | 02a-train-exercises |
| — | `(auth IIFE)` | IIFE | Whole pre-React auth/sync/paywall module | 08-auth-sync-root |
| — | `(banner height effect)` | useEffect | Publish `--lk-top-off` | 08-auth-sync-root |
| — | `(custom id allocator)` | function (IIFE) | First unused id ≥ 90000 | 02a-train-exercises |
| — | `(deep-link effect)` | useEffect | `?open=` and `lockedPushOpen` routing | 08-auth-sync-root |
| — | `(history reread effect)` | useEffect | Re-read history on `lockedHistoryUpdate` (voice writes) | 08-auth-sync-root |
| — | `(mount)` | try/catch | `createRoot(...).render(<ErrorBoundary><App/></ErrorBoundary>)` | 08-auth-sync-root |
| — | `(periodic sync)` | setInterval | Sync every 120 s when signed in | 08-auth-sync-root |
| — | `(popstate effect)` | useEffect | Unwind the nav stack on back | 08-auth-sync-root |
| — | `(profiles effect)` | useEffect | Backfill the profile from Supabase (DEAD) | 08-auth-sync-root |
| — | `(progression-chart IIFE)` | inline render fn | Est-1RM line chart + range buttons | 02d-progress-prs |
| — | `(rep-tile IIFE)` | inline render fn | Three PR tiles on a vault list row | 02d-progress-prs |
| — | `(rest mirror effect)` | useEffect | Mirror the rest timer via `lockedRest` | 08-auth-sync-root |
| — | `(scroll effect)` | hook (useEffect) | Pins the chat scroller to the bottom on new messages | 02c-train-hub |
| — | `(strength-profile IIFE)` | inline render fn | Est-1RM bar chart per rep record | 02d-progress-prs |
| — | `(summary-card IIFE)` | inline render fn | Builds the 1RM / Working / Est rows | 02d-progress-prs |
| — | `(tip fetch effect)` | hook (useEffect) | Builds context, calls the Worker, caches the tip | 02c-train-hub |
| — | `(visibility pause effect)` | useEffect | Pause the workout when backgrounded | 08-auth-sync-root |
| — | `(visibility sync)` | listener | Sync on foreground | 08-auth-sync-root |
| — | `**Placeholder**` | component | Renders an icon + name + "Coming soon" | 04b-supplements-cycletab |
| — | `**none**` | — | `PlateCalc` persists nothing (54928-54932) | 07-misc-gamification |
| — | `--color-accent` | `#F97316` |  | 10-shared |
| — | `--color-accent-dark` | `#7C3A0E` |  | 10-shared |
| — | `--color-accent-deep` | `#C2410C` |  | 10-shared |
| — | `--color-accent-rgb` | `249,115,22` |  | 10-shared |
| — | `--color-accent-text` | `#FB923C` |  | 10-shared |
| — | `--color-bg` | `#000000` | `#0D1117` | 10-shared |
| — | `--color-border` | `rgba(255,255,255,0.09)` | `rgba(48,54,61,0.9)` | 10-shared |
| — | `--color-card` | `#1C1C1E` | `#21262D` | 10-shared |
| — | `--color-error` | `#F05151` |  | 10-shared |
| — | `--color-feature` | `#8B5CF6` |  | 10-shared |
| — | `--color-fill1` | `#111113` |  | 10-shared |
| — | `--color-fill2` | `#18181B` |  | 10-shared |
| — | `--color-fill3` | `#2A2A2F` |  | 10-shared |
| — | `--color-info` | `#4186F6` |  | 10-shared |
| — | `--color-macro-carbs` | `#F59E0B` |  | 10-shared |
| — | `--color-macro-fat` | `#EC4899` |  | 10-shared |
| — | `--color-macro-protein` | `#3B82F6` |  | 10-shared |
| — | `--color-positive-alt` | `#10B981` |  | 10-shared |
| — | `--color-positive-alt-deep` | `#0C875E` |  | 10-shared |
| — | `--color-shadow` | `rgba(0,0,0,0.5)` | `rgba(1,4,9,0.4)` | 10-shared |
| — | `--color-shadow-light` | `rgba(0,0,0,0.18)` | `rgba(1,4,9,0.15)` | 10-shared |
| — | `--color-shell-card` | `#111113` |  | 10-shared |
| — | `--color-shell-fill` | `#18181B` |  | 10-shared |
| — | `--color-shell-logo` | `#F97316` |  | 10-shared |
| — | `--color-success` | `#22C55E` |  | 10-shared |
| — | `--color-success-deep` | `#178841` |  | 10-shared |
| — | `--color-surface` | `#0D0D0F` | `#161B22` | 10-shared |
| — | `--color-text` | `#F5F5F7` | `#E6EDF3` | 10-shared |
| — | `--color-text-muted` | `#A1A1AA` | `#A3ADB8` | 10-shared |
| — | `--color-text-subtle` | `#2C2C2E` | `#2D333B` | 10-shared |
| — | `--color-text-tertiary` | `#8E8E93` |  | 10-shared |
| — | `--color-warning` | `#F59E0B` |  | 10-shared |
| — | `--ds-elevated` | `#1C1C1E` | `#21262D` | 10-shared |
| — | `--ds-elevated-2` | `#2C2C2E` | `#2D333B` | 10-shared |
| — | `--ds-fill` | `rgba(120,120,128,0.20)` | `rgba(139,148,158,0.16)` | 10-shared |
| — | `--ds-fill-soft` | `rgba(120,120,128,0.12)` | `rgba(139,148,158,0.09)` | 10-shared |
| — | `--ds-grouped` | `#000000` | `#0D1117` | 10-shared |
| — | `--ds-material` | `rgba(30,30,32,0.72)` | `rgba(13,17,23,0.72)` | 10-shared |
| — | `--ds-separator` | `rgba(84,84,88,0.34)` | `rgba(48,54,61,0.9)` | 10-shared |
| — | `--glass-bar` | `rgba(0,0,0,0.78)` | `rgba(13,17,23,0.85)` | 10-shared |
| — | `1` | `concept2-split` | `watts = 2.80 / (sec500/500)^3` (6319), then `ceConcept2Kcal` | 02e-cardio |
| — | `1` | `erg-power` | `kJ = W·min·60/1000`, `kcal = kJ / KJ_PER_KCAL / ROWING_GE` | 02e-cardio |
| — | `1` | `vertical-work` | `ceStairClimbKcal` (6329-6334) | 02e-cardio |
| — | `1` | `power-meter` | `ceCyclingKcal` | 02e-cardio |
| — | `2` | `martin-power-model` | Martin et al. 1998 via `ceCyclingPowerWatts` (6244-…) — CdA from ride position, Crr from `CE_CRR`, air density from `ceAirDensity` | 02e-cardio |
| — | `2` | `pandolf-santee` | `ceLoadCarriageKcal` → `cePandolfWatts` | 02e-cardio |
| — | `2` | `minetti-environment` | `ceAmbulationKcal` (6126-6177) | 02e-cardio |
| — | `2` | `distance-rule` | `ceRunningKcalFromDistance(km, kg)` (6386) | 02e-cardio |
| — | `3` | `keytel-hr` | `ceKeytelKcalPerMin` (6350) | 02e-cardio |
| — | `4` | `met-lookup` (specific) | `ceMetToKcalPerMin(met, kg) * dur * heat` | 02e-cardio |
| — | `5` | `met-lookup` (generic) | same | 02e-cardio |
| — | `AI coach chat` | "Unlimited AI Coach / No daily coaching limits" (699) | 10 chats/day, resets midnight (50088) | 08-auth-sync-root |
| — | `AISplitBuilder` | component | AI split builder: mode picker, chat, photo import | 02c-train-hub |
| — | `AdaptiveTrainingCard` | component | Muscle-recovery readout + rule-based training suggestion | 02c-train-hub |
| — | `Add-to-diary handler` | handler | Log the recipe as one lunch item, 2 s confirm | 03c-fuel-entry |
| — | `Add-to-shop handler` | handler | Merge each parsed ingredient into the shopping list | 03c-fuel-entry |
| — | `Age` | numeric text input | `null` | 06-profile |
| — | `App` | component | Root component, all global state and routing | 08-auth-sync-root |
| — | `App Style (theme)` | 5 swatches | system light→`light`, else `dark` | 06-profile |
| — | `BF log open handler` | handler | Opens the body-fat log, clearing prior AI text | 01-home |
| — | `BLOCKS.calendar` | render fn | Current-month grid with today/workout/future day states | 01-home |
| — | `BLOCKS.cycle` | render fn | Mounts CycleReminderCard | 01-home |
| — | `BLOCKS.cycletrack` | render fn | Mounts CycleTrackerCard for female profiles only | 01-home |
| — | `BLOCKS.feed` | render fn | Mounts DynamicFeed | 01-home |
| — | `BLOCKS.insight` | render fn | Mounts ProactiveTipCard | 01-home |
| — | `BLOCKS.progress` | render fn | VIEW PROGRESS navigation button | 01-home |
| — | `BLOCKS.quick` | render fn | Mounts QuickActionsRow with the saved quick ids | 01-home |
| — | `BLOCKS.recap` | render fn | Weekly Recap button, shown on Sunday or with week data | 01-home |
| — | `BLOCKS.recent` | render fn | Last 5 workouts + See all | 01-home |
| — | `BLOCKS.restock` | render fn | Mounts RunningLowCard | 01-home |
| — | `BLOCKS.start` | render fn | Full-width START WORKOUT CTA | 01-home |
| — | `BLOCKS.stats` | render fn | 2×2 counters: workouts, splits, this week, PRs | 01-home |
| — | `BLOCKS.supps` | render fn | Mounts SuppReminderCard | 01-home |
| — | `BLOCKS.throwback` | render fn | Computes and renders a throwback card with dismiss | 01-home |
| — | `Barcode` | typed digits 39496 / icon 39882 | Exact product when found | 03c-fuel-entry |
| — | `BarcodeTab` | component | Six-mode barcode scan / lookup / log screen | 03a-fuel-panels |
| — | `Beta Agree onClick` | handler | Claim the code and activate beta | 06-profile |
| — | `Beta Verify onClick` | handler | Validate an invite code | 06-profile |
| — | `Beta invite code` | text input + Verify | not beta | 06-profile |
| — | `BetaAdminPanel` | component | Beta code management, activity/AI/feedback log viewers, export, sync | 05-coach |
| — | `Body weight` | decimal input (unit-aware) | `null` | 06-profile |
| — | `Boundary` | Scope | Recovery offered | 09-onboarding-system |
| — | `Budget tracking` | "Budget Tracking / Grocery & cost analytics" (703) | **Pro only** | 08-auth-sync-root |
| — | `Button` | Label | Line | 03b-fuel-main |
| — | `CE_FIELDS` | const (data) | Field definitions: label, unit, kind, icon, engine flag, hint | 02e-cardio |
| — | `CE_FIELD_KEY` | const (data) | field id → stored `metrics` key | 02e-cardio |
| — | `CE_GROUP_TONE` | const (data) | Accent hue per activity group | 02e-cardio |
| — | `COACH_DATA_KEYS` | const array | Toggleable coach data-sharing categories | 04b-supplements-cycletab |
| — | `COACH_MARKER_DOCS` | const string | AI action-marker schema block appended to the coach system prompt | 04b-supplements-cycletab |
| — | `COACH_STYLES` | const array | Coach personality presets | 04b-supplements-cycletab |
| — | `COMPOUND_CATEGORIES` | const array | 5 compound categories with display colours | 04b-supplements-cycletab |
| — | `CYCLE_FREQ_OPTS` | const array | 7 frequency options | 04b-supplements-cycletab |
| — | `CYCLE_ROUTE_OPTS` | const array | 6 administration routes | 04b-supplements-cycletab |
| — | `CardioFavorites` | component | Favorites tab: chips, list, edit mode | 02e-cardio |
| — | `CardioHistory` | component | History tab | 02e-cardio |
| — | `CardioLogFlow` | component | The whole 4-step log flow | 02e-cardio |
| — | `CardioSection` | component | Cardio screen shell + tabs | 02e-cardio |
| — | `CardioStar` | component | ★/☆ favourite toggle button | 02e-cardio |
| — | `CardioStar` | component | Favourite-toggle star for cardio setups — **out of range, owned by the cardio agent** | 07-misc-gamification |
| — | `CeCount` | component | rAF count-up number, reduced-motion aware | 02e-cardio |
| — | `CeTierMeter` | component | Five-bar estimate-quality meter | 02e-cardio |
| — | `Check-in frequency map cb` | handler | Render/select a check-in frequency | 06-profile |
| — | `Coach +Log handler` | handler | Log a single coach ingredient to lunch | 03c-fuel-entry |
| — | `Coach add-to-diary handler` | handler | Log every coach ingredient separately to lunch | 03c-fuel-entry |
| — | `Coach add-to-shop handler` | handler | Push coach ingredients to the shopping list | 03c-fuel-entry |
| — | `Coach instructions` | "Coach Instructions / Fully personalise your AI" (702) | **Pro only** | 08-auth-sync-root |
| — | `Coach recipe` | 41668-41702 | Coach-authored; string ingredients get macros split evenly (41671-41677) | 03c-fuel-entry |
| — | `CoachCardioCard` | component | Cardio session card with locally computed calorie estimate and one-shot log button | 05-coach |
| — | `CoachInterview` | component | Six-question onboarding sheet that has the AI write the instructions block | 05-coach |
| — | `CoachScreen` | component | The whole Coach tab: chat, plan, check-in, setup | 05-coach |
| — | `CoachSetupPane` | component | The four setup sections: about you, style, memory, data visibility | 05-coach |
| — | `CoachSetupSection` | component | Collapsible titled section with optional pill | 05-coach |
| — | `Compound reminders` | switch | on | 06-profile |
| — | `ConvertToSplitModal` | component | Bottom-sheet flow turning a logged workout into a split day | 02c-train-hub |
| — | `Customize onClick` | handler | Open LayoutEditor | 06-profile |
| — | `Cycle Logging onClick` | handler | Toggle perf tracking and reload | 06-profile |
| — | `Cycle logging (perf tracking)` | switch + reload | `false` | 06-profile |
| — | `CycleReminderCard` | component | Home card listing compounds due today | 04b-supplements-cycletab |
| — | `CycleTab` | component | Entire cycle module: list, add, detail, compound form | 04b-supplements-cycletab |
| — | `D.drop`, `D.gear` | icon path constants | Droplet and gear SVG paths appended to the shared `D` icon map | 03a-fuel-panels |
| — | `Daily check-in reminder` | switch | on | 06-profile |
| — | `Daily check-ins per day` | 3-way segment | `1` | 06-profile |
| — | `DayNutritionPanel` | component | Collapsible micronutrient table for a day | 03a-fuel-panels |
| — | `Delete Account onClick` | handler | Show the confirmation panel | 06-profile |
| — | `Delete Cancel onClick` | handler | Dismiss the confirmation | 06-profile |
| — | `Display name` | text input + Save | existing profile value | 06-profile |
| — | `DraftNum` | component | Decimal-safe numeric input | 02a-train-exercises |
| — | `DynamicFeed` | component | Rule-based home feed: check-in, readiness, rest, comeback, next split | 02c-train-hub |
| — | `Endpoint` | Method | Called from | 01-home |
| — | `Endpoint` | Method | Response handling | 02a-train-exercises |
| — | `Endpoint` | Method | Payload | 02b-train-logging |
| — | `Endpoint` | Method | Auth | 02c-train-hub |
| — | `ErrorBoundary` | class | Top-level crash screen with a Reload button | 08-auth-sync-root |
| — | `ExBtn` | component (inner) | One exercise row button | 02a-train-exercises |
| — | `ExLib` | component | The whole exercise library (5 screens in one component) | 02a-train-exercises |
| — | `ExerciseActionSheet` | component | Hold-to-lift action bubble over a logging card | 02a-train-exercises |
| — | `ExerciseDetailModal` | component | Exercise detail bottom sheet | 02a-train-exercises |
| — | `ExerciseNotes` | component | Autosaving per-exercise notes textarea | 02a-train-exercises |
| — | `FDC_NUT_IDS` | const map | USDA FDC nutrient id → internal micro key | 03a-fuel-panels |
| — | `FeedbackScreen` | component | The daily check-in pane: form, payoff card, history dots | 05-coach |
| — | `Force Refresh onClick` | handler | Clear caches and hard-reload | 06-profile |
| — | `FuelDisplayCard` | component | Settings card: hide numbers + dashboard framing | 03a-fuel-panels |
| — | `FuelProfileSetup` | component | Full-screen fuel profile / targets form | 03b-fuel-main |
| — | `FuelProfileSetup.save` | handler | Convert units, compute TDEE+macros, emit profile | 03b-fuel-main |
| — | `FuelProfileSetup.togglePref` | handler | Add/remove a dietary preference id | 03b-fuel-main |
| — | `FuelTab` | component | Fuel tab shell, targets, sub-tab routing | 03b-fuel-main |
| — | `FuelTab.acceptRefeed` | handler | Accept refeed day, boost carb target | 03b-fuel-main |
| — | `FuelTab.addItem` | handler | Append a food item to a meal slot | 03b-fuel-main |
| — | `FuelTab.addWater` | handler | Add ml to today's water | 03b-fuel-main |
| — | `FuelTab.dismissRefeed` | handler | Dismiss refeed for 5 days | 03b-fuel-main |
| — | `FuelTab.getDay` | function | Today's log entry or a default shape | 03b-fuel-main |
| — | `FuelTab.handleWeightLog` | handler | Persist a weight entry and re-check refeed | 03b-fuel-main |
| — | `FuelTab.removeItem` | handler | Remove a food item by index | 03b-fuel-main |
| — | `FuelTab.setDay` | function | Immutable update of today's log entry | 03b-fuel-main |
| — | `FuelTab.setFuelLog` | function | State + localStorage writer for fuelLog | 03b-fuel-main |
| — | `FuelTab.setFuelProfile` | function | State + localStorage writer for fuelProfile | 03b-fuel-main |
| — | `Full backup onClick` | handler | Download a whole-account JSON backup | 06-profile |
| — | `GOAL_TYPES` | const data | The four goal kinds (lift, weight, bf, custom) with icon/color/desc | 01-home |
| — | `Gated feature` | Paywall card | Free-tier limit | 08-auth-sync-root |
| — | `Goal` | 3-way segment | `null` | 06-profile |
| — | `Goal map cb` | handler | Render a goal segment | 06-profile |
| — | `GoalsTab` | component | Goals list/detail/add plus the body-fat log sub-screen | 01-home |
| — | `Group id` | Name | Sub-groups | 10-shared |
| — | `Guest signup onClick (settings)` | handler | Upgrade guest | 06-profile |
| — | `Height (imperial)` | two numeric inputs, ft + in | `null` | 06-profile |
| — | `Height (metric)` | numeric input, cm | `null` | 06-profile |
| — | `Home Layout → block order` | ▲/▼ reorder list (14 blocks) | `HOME_DEFAULT_ORDER` | 06-profile |
| — | `Home Layout → hidden blocks` | Hide/Show per row | `{}` | 06-profile |
| — | `Home Layout → quick actions` | multi-select chips, max 3 | `["water","checkin","food"]` | 06-profile |
| — | `HomeScreen` | component | The whole Home tab: header, layout blocks, recap view, workout detail routing | 01-home |
| — | `Ic` | component | SVG icon primitive | 02a-train-exercises |
| — | `IcMemo` | component (memo) | Memoised Ic — **DEAD** | 02a-train-exercises |
| — | `Key` | Read by | Notes | 02a-train-exercises |
| — | `Key` | Read | Where | 02b-train-logging |
| — | `Key` | Read at | Notes | 02e-cardio |
| — | `Key` | Read | Purpose | 03b-fuel-main |
| — | `Key` | Read | Feature | 03c-fuel-entry |
| — | `Key` | Read at | Notes | 04b-supplements-cycletab |
| — | `Key` | Read | By | 06b-cycle |
| — | `Key` | Read at | By | 07-misc-gamification |
| — | `Key` | Read | By | 09-onboarding-system |
| — | `Key (`lk_` prefixed)` | Read at | Feature | 01-home |
| — | `LOCKED.onReady` | fn | Run a callback once auth is resolved | 08-auth-sync-root |
| — | `LOCKED.setCycleSync` | fn | Toggle opt-in cycle-data cloud sync | 08-auth-sync-root |
| — | `Label` | Control type | Default | 06-profile |
| — | `LayoutEditor` | component | Home-screen layout editor | 06-profile |
| — | `LayoutEditor order map cb` | handler | Render one block row | 06-profile |
| — | `LayoutEditor quick map cb` | handler | Render one quick-action chip | 06-profile |
| — | `LayoutEditor reset onClick` | handler | Two-tap reset to defaults | 06-profile |
| — | `Left` | "Log" | 37400–37419 | 03b-fuel-main |
| — | `LoadingMemo` | component (memo) | Memoised spinner — **DEAD** | 02a-train-exercises |
| — | `LoadingSpinner` | component | Pulsing dot + "Loading…" — **DEAD** | 02a-train-exercises |
| — | `Log-Full-Day handler` | handler | Bulk-log the AI plan into its four slots | 03c-fuel-entry |
| — | `MC_BC_OPTS` | const array | Birth-control picker options | 03a-fuel-panels |
| — | `MC_COL` / `MC_TXT` | const maps | Phase colours (chart / text variants) | 03a-fuel-panels |
| — | `MC_EVENTS` | const array | 5 loggable reproductive events | 03a-fuel-panels |
| — | `MC_FLOWS` | const array | 5 flow levels, None…Heavy | 03a-fuel-panels |
| — | `MC_GOALS` | const array | Cycle-tracking goal options | 03a-fuel-panels |
| — | `MC_HBC` | const array | Hormonal birth-control method ids | 03a-fuel-panels |
| — | `MC_MOODS` | const array | 8 mood labels | 03a-fuel-panels |
| — | `MC_PHASE_INFO` | const map | Per-phase description and training guidance copy | 03a-fuel-panels |
| — | `MC_PREG_END` | const map | Events that terminate a pregnancy | 03a-fuel-panels |
| — | `MC_SYMPTOMS` | const array | 12 symptom id/label pairs | 03a-fuel-panels |
| — | `MacroRing` | component | SVG donut progress ring | 03b-fuel-main |
| — | `Manual macros` | ManualEntry 39094-39110 | Exactly what the user types, **truncated to integers** (39098-39101) | 03c-fuel-entry |
| — | `ManualEntry` | component | Collapsed prompt + custom macro form | 03c-fuel-entry |
| — | `Meal analysis` | "Meal Analysis / USDA-accurate nutrition" (700) | 5/day | 08-auth-sync-root |
| — | `MealPlanFuelTab` | component | AI meal plan generation, browsing, swapping | 03b-fuel-main |
| — | `MealPlanFuelTab.addToShopping` | handler | Merge a plan's shopping list into the app list | 03b-fuel-main |
| — | `MealPlanFuelTab.buildMealContext` | function | Build the system-prompt context string | 03b-fuel-main |
| — | `MealPlanFuelTab.deletePlan` | handler | Remove a plan by id | 03b-fuel-main |
| — | `MealPlanFuelTab.generateAlternatives` | handler | Fetch 4 AI meal alternatives; canned fallbacks | 03b-fuel-main |
| — | `MealPlanFuelTab.generatePlan` | handler | Request, repair, normalise and save a meal plan | 03b-fuel-main |
| — | `MealPlanFuelTab.logMeal` | handler | Map a plan meal to a log slot and log it | 03b-fuel-main |
| — | `MealPlanFuelTab.selectAlternative` | handler | Overwrite a plan meal with a chosen alternative | 03b-fuel-main |
| — | `MealPlanFuelTab.setPlans` | function | State + localStorage writer for mealPlans | 03b-fuel-main |
| — | `MealPlanFuelTab.toggleStar` | handler | Toggle starred and re-sort non-active plans | 03b-fuel-main |
| — | `Microphone button (voice)` | switch | `true` | 06-profile |
| — | `Microphone onClick` | handler | Toggle the floating voice button | 06-profile |
| — | `NEW GOAL onClick` | handler | Opens the add form at the type picker | 01-home |
| — | `NUTRIENTS_P1` | const array | Primary micros: fiber, sugar, satfat, sodium | 03a-fuel-panels |
| — | `NUTRIENTS_P2` | const array | Secondary micros: potassium…folate (9) | 03a-fuel-panels |
| — | `Nav` | component (memo) | Bottom tab bar; publishes `--lk-nav-h` | 02a-train-exercises |
| — | `Nav` | React.memo | 5-tab bottom bar, publishes `--lk-nav-h` | 08-auth-sync-root |
| — | `New password` | two password inputs + button | — | 06-profile |
| — | `NotificationsCard` | component | Push permission, per-type prefs, sound, test | 06-profile |
| — | `NotificationsCard sound map cb` | handler | Render one sound option and preview it | 06-profile |
| — | `Nutrition CSV onClick` | handler | Download the food-diary CSV | 06-profile |
| — | `PANTRY_EXPIRY_DAYS` | const map | Category → shelf-life days | 03a-fuel-panels |
| — | `PRESET_COMPOUNDS` | const array | 32-entry compound database (dose/freq/routes/half-life) | 04b-supplements-cycletab |
| — | `PRHub` | component | PR vault: list, detail, charts, manual PR logging | 02d-progress-prs |
| — | `Partial reps` | switch (inverted key) | shown (key absent = false) | 06-profile |
| — | `Partial reps onClick` | handler | Toggle `hidePartials` (inverted) | 06-profile |
| — | `Path` | Where | Accuracy | 03c-fuel-entry |
| — | `Photo / AI vision` | PhotoTab 40377-40441 | Lowest — visual portion estimate, totals shown without item breakdown | 03c-fuel-entry |
| — | `Pill` | function (render helper) | One muscle pill with last-trained/hours-remaining | 02c-train-hub |
| — | `Plan-my-day handler` | handler | Ask for 4 slot-tagged meals and parse them | 03c-fuel-entry |
| — | `PlateCalc` | component | Barbell plate-loading sheet with apply-to-set | 07-misc-gamification |
| — | `PrivacyCard` | component | Collapsible five-section privacy disclosure | 03a-fuel-panels |
| — | `ProactiveTipCard` | component | Daily AI "today's insight" card, cached per day | 02c-train-hub |
| — | `ProfileScreen` | component | Profile tab: identity, lifetime stats, badges, PRs | 06-profile |
| — | `ProfileScreen badges map cb` | handler | Render one earned badge | 06-profile |
| — | `ProfileScreen bestPRs map cb` | handler | Render one PR row | 06-profile |
| — | `ProfileScreen guest-signup onClick` | handler | Launch guest upgrade | 06-profile |
| — | `ProfileScreen locked map cb` | handler | Render one locked badge | 06-profile |
| — | `ProfileScreen prs forEach cb` | handler | Build bestPRs from the PR map | 06-profile |
| — | `ProfileScreen settings onClick` | handler | Navigate to Settings | 06-profile |
| — | `ProfileScreen stats map cb` | handler | Render one stat tile | 06-profile |
| — | `ProgressPage` | component | Progress hub: tabs, featured lifts, bodyweight chart, calendar | 02d-progress-prs |
| — | `ProgressPhotos` | component | Progress-photo gallery, lightbox and AI analysis | 06-profile |
| — | `ProgressPhotos addTarget sheet map cb` | handler | Render one split-day target row | 06-profile |
| — | `ProgressPhotos camera onClick` | handler | Build and click a capture input | 06-profile |
| — | `ProgressPhotos delete onClick` | handler | Two-tap delete guard | 06-profile |
| — | `ProgressPhotos escape handler` | handler | Close the lightbox on Esc | 06-profile |
| — | `ProgressPhotos group map cb` | handler | Render a month section of thumbnails | 06-profile |
| — | `ProgressPhotos library onClick` | handler | Click the hidden file input | 06-profile |
| — | `ProgressPhotos weakPoints map cb` | handler | Render one weak point and its prescription | 06-profile |
| — | `Push notifications (master)` | switch | off | 06-profile |
| — | `Quick-add` | **does not exist in my range** | — | 03c-fuel-entry |
| — | `QuickActionsRow` | component | Renders up to 3 configurable quick-action tiles with a transient flash message | 01-home |
| — | `QuickChip` | component | Tap-to-log / hold-to-favourite food chip | 03a-fuel-panels |
| — | `RCard` | component (nested) | One recipe card: macros, ingredients, steps, 2 actions | 03c-fuel-entry |
| — | `Recipe (static)` | RCard 41125-41150 | Fixed hardcoded recipe totals (40851-40919) | 03c-fuel-entry |
| — | `RecipeBuilder` | component | Create a user recipe from searched/manual ingredients | 03a-fuel-panels |
| — | `RecipeLogSheet` | component | Bottom sheet to log N servings of a recipe to a slot | 03a-fuel-panels |
| — | `RefeedCard` | component | Renders the refeed-day suggestion card with accept/dismiss | 07-misc-gamification |
| — | `ReplacePanel` | component | Swap-exercise picker (same-muscle or search) | 02a-train-exercises |
| — | `Replay Tutorial onClick` | handler | Restart the onboarding tutorial | 06-profile |
| — | `Reset Cancel onClick` | handler | Disarm the reset | 06-profile |
| — | `Reset all data onClick` | handler | Arm then wipe every local key and end the session | 06-profile |
| — | `Rest timer alerts` | switch | on (absent = on) | 06-profile |
| — | `Rest timer sound` | 3-way segment | `"bell"` | 06-profile |
| — | `Restock reminders` | switch | on | 06-profile |
| — | `Restore onChange` | handler | Read and import a backup file | 06-profile |
| — | `Retailer` | Domain key | Preset? | 04-shopping-budget |
| — | `Review` | component | Post-workout summary → reflection → AI insight → save/discard | 02c-train-hub |
| — | `Right` | "Meals" | 37420–37437 | 03b-fuel-main |
| — | `SAFE_B` | IIFE | Measures `env(safe-area-inset-bottom)` in px | 07-misc-gamification |
| — | `STORE_PALETTE` | const array | 10 store accent colours | 03c-fuel-entry |
| — | `STORE_PATTERNS` | const map | 13 retailer search-URL templates | 03c-fuel-entry |
| — | `STORE_PRESETS` | const array | 10 preset retailers with descriptions | 03c-fuel-entry |
| — | `SYNC NOW onClick` | handler (async) | Force a cloud sync and report the outcome | 06-profile |
| — | `Save Name onClick` | handler | Commit the display name | 06-profile |
| — | `Save Stats onClick` | handler | Convert units and commit body stats | 06-profile |
| — | `ScreenBoundary` | class | Per-screen crash isolation | 08-auth-sync-root |
| — | `Section` | function (render helper) | A labelled group of pills; null when empty | 02c-train-hub |
| — | `Send Data to Dev onClick` | handler | Upload beta logs | 06-profile |
| — | `SettingsScreen` | component | The full settings screen | 06-profile |
| — | `SettingsScreen back onClick` | handler | Return to the Profile tab | 06-profile |
| — | `SettingsScreen theme effect` | hook | Sync `activeTheme` from the `theme-changed` event | 06-profile |
| — | `SettingsScreen voice effect` | hook | Sync voice toggle from `lockedVoiceToggle` | 06-profile |
| — | `Sex` | 2-way segment | `null` | 06-profile |
| — | `Sex map cb` | handler | Render a sex segment | 06-profile |
| — | `Sign Out onClick` | handler | End the session | 06-profile |
| — | `SmartNutritionCard` | component | AI meal suggestion fitting remaining macros | 03b-fuel-main |
| — | `SmartNutritionCard.addMeal` | handler | Log the suggested meal to snacks | 03b-fuel-main |
| — | `SmartNutritionCard.suggest` | handler | POST remaining macros to Worker, parse JSON meal | 03b-fuel-main |
| — | `Split builder` | "Split Builder / Unlimited AI programs" (701) | 1/month | 08-auth-sync-root |
| — | `StorageCard` | component | localStorage usage meter | 06-profile |
| — | `StorageCard effect` | hook | Refresh usage on event + 5s interval | 06-profile |
| — | `Streaks and badges` | switch | `false` | 06-profile |
| — | `Streaks/badges onClick` | handler | Toggle `gamingLayer` | 06-profile |
| — | `SuppReminderCard` | component | Home card listing supplements due now | 04b-supplements-cycletab |
| — | `Supplement reminders` | switch | on | 06-profile |
| — | `SupplementsTab` | component | Full supplement CRUD + history screen | 04b-supplements-cycletab |
| — | `THEMES map cb` | handler | Render one theme swatch | 06-profile |
| — | `TdeeReportCard` | component | Weekly adaptive-TDEE check-in banner, dismissible | 03a-fuel-panels |
| — | `Text size` | 4-way segment | `100` | 06-profile |
| — | `TextSizeCard` | component | Root font-size scaling control | 06-profile |
| — | `TextSizeCard options map cb` | handler | Render one size option | 06-profile |
| — | `ThrowbackCard` | component | Then/now progress flashback card | 02a-train-exercises |
| — | `Tier` | Method id | Formula | 02e-cardio |
| — | `Token` | dark (base) | slate | 10-shared |
| — | `Token` | dark (`:root`) | slate | 10-shared |
| — | `TrainHub` | component | The Train tab: sub-tabs, splits, history, sub-screens | 02c-train-hub |
| — | `Training day reminder` | switch | on | 06-profile |
| — | `TrendsTab` | component | Nutrition trends: calorie bars, averages grid, weight line | 03a-fuel-panels |
| — | `TutorialOverlay` | component | Three-phase first-run onboarding walkthrough | 07-misc-gamification |
| — | `UNIT_GRAMS` | const map | 25 unit→gram equivalences | 03a-fuel-panels |
| — | `UNIT_NORM` | const map | Canonicalise ~50 unit spellings | 03c-fuel-entry |
| — | `Unfinished workout nudge` | switch | on | 06-profile |
| — | `Update Password onClick` | handler (async) | Validate and change the password | 06-profile |
| — | `VoiceButton` | component (memo) | Draggable mic button + capture + result sheet | 07-misc-gamification |
| — | `VoiceButtonWrap` | component | Gates the voice button on `lk_voiceEnabled` | 07-misc-gamification |
| — | `WaterCard` | component | Daily water total, unit toggle, +/- controls | 03b-fuel-main |
| — | `WaterCard.add` | handler | Convert oz→ml and add water | 03b-fuel-main |
| — | `WaterCard.minus` | handler | Subtract one glass, clamped at 0 | 03b-fuel-main |
| — | `Weight Unit onClick` | handler | Toggle kg/lb display | 06-profile |
| — | `Weight selector` | "Weight Selector / AI-assisted load picking" (704) | **Pro only** | 08-auth-sync-root |
| — | `Weight unit (display)` | toggle pill | kg (`p.useKg !== false`) | 06-profile |
| — | `WeightLogCard` | component | Daily weigh-in input + 14-entry history list | 07-misc-gamification |
| — | `WorkoutDetail` | component | Read + edit view of one history entry | 02c-train-hub |
| — | `YIELD_FACTORS` | const array | Regex→cooked/raw yield factor for rice/pasta/oats/meat | 03a-fuel-panels |
| — | `Yes, Delete onClick` | handler (async) | Permanently delete the account | 06-profile |
| — | `_LOCKED_usage` | fn | Read a usage counter with 0 default | 08-auth-sync-root |
| — | `_buildAuthScreen` | fn | Login/signup screen HTML | 08-auth-sync-root |
| — | `_buildConfirmScreen` | fn | "CHECK YOUR INBOX" screen HTML | 08-auth-sync-root |
| — | `_chipCache` | module var | Identity-keyed memo for recent/frequent foods | 03a-fuel-panels |
| — | `_forgotPassword` | async fn | Send a reset email for the typed address | 08-auth-sync-root |
| — | `_hideGuestModal` | fn | Remove the guest modal | 08-auth-sync-root |
| — | `_overlayContent` | fn | Swap overlay inner HTML | 08-auth-sync-root |
| — | `_paywallCard` | fn | One feature card's HTML string | 08-auth-sync-root |
| — | `_resendConfirmation` | async fn | `auth.resend({type:"signup"})` | 08-auth-sync-root |
| — | `_setAuthMode` | fn | Switch login/signup/confirm | 08-auth-sync-root |
| — | `_setGuestSubscription` | fn | Grant guests `{status:"guest", isPro:true}` | 08-auth-sync-root |
| — | `_setSyncState` | fn | Set `_syncState` | 08-auth-sync-root |
| — | `_showGuestModal` | fn | Guest disclosure modal | 08-auth-sync-root |
| — | `_submitAuth` | async fn | Validate, sign up or in, map every error | 08-auth-sync-root |
| — | `_togglePw` | fn | Password visibility toggle | 08-auth-sync-root |
| — | `_validatePw` | fn | Live password-requirement checklist | 08-auth-sync-root |
| — | `_zxingP` | module var | Cached ZXing load promise | 03a-fuel-panels |
| — | `abs` | Abs | Weighted, Bodyweight | 10-shared |
| — | `add` | function (inner) | Dedup helper inside getInvolvement | 02a-train-exercises |
| — | `add (ManualEntry)` | handler | Validate and emit a manual food item | 03c-fuel-entry |
| — | `add close handler` | handler | Closes the add/edit form | 01-home |
| — | `addBfEntry` | function | Appends a bf entry, sorts by date, persists | 01-home |
| — | `addCode` | function (inner) | Append a new uppercase beta code | 05-coach |
| — | `addCustom` | fn | Add a custom exercise, invalidate the name index | 08-auth-sync-root |
| — | `addExSet` | handler | Appends a blank set (rir "2") to an exercise | 02c-train-hub |
| — | `addFocusWork` | function | Append prescribed exercises to a chosen split day | 06-profile |
| — | `addIng` | handler | Append a picked ingredient at 100 g | 03a-fuel-panels |
| — | `addManual` | handler | Append a hand-entered per-100g ingredient | 03a-fuel-panels |
| — | `addPlate` | function | Adds a plate, keeps the list sorted descending | 07-misc-gamification |
| — | `addPresetComp` | handler | Prefills the compound form from a preset | 04b-supplements-cycletab |
| — | `addShoppingItem` | function | Append a categorised shopping row | 03c-fuel-entry |
| — | `adduc` | Adductors | All | 10-shared |
| — | `aiCall` | fn | POST to the worker root, handle `d.gated` | 08-auth-sync-root |
| — | `analysePhoto` | function | POST photo + context to the physique-analysis Worker and parse JSON | 06-profile |
| — | `analyze` | function (inner) | POST base64+description to /analyze-meal | 03c-fuel-entry |
| — | `analyzePhoto` | function | Sends the typed split description for conversion (image not sent) | 02c-train-hub |
| — | `answer` | function (inner) | Record an interview answer, advance or generate | 05-coach |
| — | `any unknown key` | — | denied | 08-auth-sync-root |
| — | `apply` | function | Persist and apply a text scale | 06-profile |
| — | `applyAdaptiveTDEE` | function | Weekly 70/30 blend, ±150 kcal step, rewrite targets + macros | 03a-fuel-panels |
| — | `applyCalFloor` | function | Clamp a target to max(BMR, 1200 F / 1500 M) | 03a-fuel-panels |
| — | `applyCoachInstructions` | function (inner) | Apply instructions from chat/interview and banner it | 05-coach |
| — | `applyToNextSet` | function | Writes the computed total into the next unfinished set | 07-misc-gamification |
| — | `applyXY` | function | Writes the transform directly to the DOM node | 07-misc-gamification |
| — | `ascendFetchDetail` | function | Fetch ExerciseDB detail — **DEAD** | 02a-train-exercises |
| — | `authHeaders` | function | `Content-Type` + `Authorization: Bearer <window.LOCKED.session.access_token>` | 05-coach |
| — | `authHeaders` | fn | Sync `Bearer` headers from `LOCKED.session` | 08-auth-sync-root |
| — | `avgIntake` | function | Mean calories over N days, logged days only | 03a-fuel-panels |
| — | `avg` (inner)` | inner function | Mean of a series key over logged days | 03a-fuel-panels |
| — | `back` | Back | Lats, Mid Back, Lower Back, Traps | 10-shared |
| — | `beta activity sink` | via `logBetaActivity` (2772) | saveGoal, deleteGoal, logBf | 01-home |
| — | `bf back handler` | handler | Closes the body-fat log screen | 01-home |
| — | `bf input onChange` | handler | Sanitises the bf input to digits and dots | 01-home |
| — | `bf method onClick` | handler | Selects a measurement method | 01-home |
| — | `bfLog` | 26977 (getBfLog, called 27002 and 26980) | F-GOAL-006 | 01-home |
| — | `biceps` | Biceps | Long Head, Short Head | 10-shared |
| — | `bottomGap` | function | Bottom clearance = 82 + safe area + `window.__lkBottomBar` | 07-misc-gamification |
| — | `budget data` | `getBudgetData()` 53538 | F-MISC-006 | 07-misc-gamification |
| — | `budget data key` | 43964 (via `getBudgetData`, called 37599) | Weekly grocery budget for the prompt | 03b-fuel-main |
| — | `buildContext` | function (inner) | Thin wrapper over the top-level context builder | 05-coach |
| — | `buildOverlay` | fn | Create the overlay DOM, hide `#root` | 08-auth-sync-root |
| — | `buildParsedCardioRecord` | function | Builds a full v2 cardio history record from voice data | 07-misc-gamification |
| — | `buildStoreSearchUrl` | function | Build a retailer search URL for a query | 03c-fuel-entry |
| — | `cacheBarcode` | function | Store a resolved product under its GTIN with `fetchedAt` | 03a-fuel-panels |
| — | `calKey` | function (inner) | Builds a zero-padded YYYY-MM-DD key for a calendar day number | 01-home |
| — | `calKey` | function (closure) | `YYYY-MM-DD` for a day in the displayed month | 02d-progress-prs |
| — | `calcBMR` | function | Revised Harris–Benedict BMR, sex-split | 03a-fuel-panels |
| — | `calcEndDate` | function | start + weeks*7 → ISO end date | 04b-supplements-cycletab |
| — | `calcOverallProgress` | function (inner) | Mean phase progress across the plan | 05-coach |
| — | `calcPhaseProgress` | function (inner) | 40% time + 60% targets, clamped | 05-coach |
| — | `calcPlatesPerSide` | function | Greedy per-side plate breakdown | 02a-train-exercises |
| — | `calcRecipe` | function | Per-serving macros + micros for a recipe | 03a-fuel-panels |
| — | `calcTDEEInfo` | function | BMR × activity multiplier, goal deficit/surplus, floored | 03a-fuel-panels |
| — | `calcTargetProgress` | function (inner) | Percentage progress toward one phase target | 05-coach |
| — | `callWorker` | function | Raw POST to the Cloudflare Worker; extracts text from Anthropic- or OpenAI-shaped replies | 02c-train-hub |
| — | `calves` | Calves | All | 10-shared |
| — | `can` | fn | Client entitlement check (DEAD — no callers) | 08-auth-sync-root |
| — | `cancel` | handler | Cancel on pointer leave | 03a-fuel-panels |
| — | `cardioActivity` | function | v2 activity lookup by id | 02a-train-exercises |
| — | `cardioBodyProfile` | function | Assemble weight/height/age/sex from 3 sources | 02a-train-exercises |
| — | `cardioCalories` | function | v1 calorie estimate (watts or MET) | 02a-train-exercises |
| — | `cardioDist` | function | Display distance in the chosen unit | 02a-train-exercises |
| — | `cardioDistToM` | function | Entered distance → metres | 02a-train-exercises |
| — | `cardioEngineInput` | function | Stored record → highest-tier engine input | 02a-train-exercises |
| — | `cardioEnv` | function | Build the environment object (temp only) | 02a-train-exercises |
| — | `cardioEstimate` | function | The one function the UI calls; always returns | 02a-train-exercises |
| — | `cardioFavKey` | function | Identity = modality | 02a-train-exercises |
| — | `cardioFavorites` | function | Read the favourites array | 02a-train-exercises |
| — | `cardioFieldsFor` | function | Field list for an activity | 02a-train-exercises |
| — | `cardioHasField` | function | Does this activity ask for this metric? | 02a-train-exercises |
| — | `cardioKarvonen` | function | Heart-rate-reserve target | 02a-train-exercises |
| — | `cardioLegacyForModality` | function | v2 activity id → v1 id | 02a-train-exercises |
| — | `cardioMaxHr` | function | Tanaka / Gulati max HR with override | 02a-train-exercises |
| — | `cardioMet` | function | v1 MET picker from speed/watts/RPE | 02a-train-exercises |
| — | `cardioMetresOf` | function | Session metres, v2 with v1 fallback | 02e-cardio |
| — | `cardioMinutes` | function | Total cardio minutes in a list | 02a-train-exercises |
| — | `cardioModalityForLegacy` | function | v1 id → v2 activity id | 02a-train-exercises |
| — | `cardioPBs` | function | Personal bests across a record list | 02e-cardio |
| — | `cardioPaceSecPerKm` | function | Derived pace | 02a-train-exercises |
| — | `cardioPrefs` | function | Read cardio preferences with defaults | 02a-train-exercises |
| — | `cardioSecsOf` | function | Session seconds, v2 field with v1 fallback | 02e-cardio |
| — | `cardioSessionCalories` | function | Calories from v1 number or v2 object | 02a-train-exercises |
| — | `cardioSpeedKph` | function | Derived speed | 02a-train-exercises |
| — | `cardioSplit500` | function | Derived 500 m split | 02a-train-exercises |
| — | `cardioWeekBuckets` | function | 8 Monday-start weekly buckets | 02e-cardio |
| — | `cardioZoneOf` | function | bpm → zone index, −1 below zone 1 | 02a-train-exercises |
| — | `cardioZoneTime` | function | Minutes per HR zone by session average | 02e-cardio |
| — | `cardioZones` | function | Pick the 3- or 5-zone table | 02a-train-exercises |
| — | `categorizeItem` | function | Substring-bucket an item into a store aisle | 03c-fuel-entry |
| — | `ccClamp` | function | Clamp | 02a-train-exercises |
| — | `ccKgToLb` | function | kg → lb | 02a-train-exercises |
| — | `ccMphToMPerSec` | function | mph → m/s | 02a-train-exercises |
| — | `ccNum` | function | parseFloat with a default | 02a-train-exercises |
| — | `ccRound1` | function | Round to 0.1 | 02a-train-exercises |
| — | `ccRound2` | function | Round to 0.01 | 02a-train-exercises |
| — | `ccRound3` | function | Round to 0.001 | 02a-train-exercises |
| — | `ccRound5` | function | Round to 5 | 02a-train-exercises |
| — | `ceAcsmArmCyclingVo2` | function | ACSM arm-ergometer VO2 — **no call site in range** | 02a-train-exercises |
| — | `ceAcsmLegCyclingVo2` | function | ACSM leg-ergometer VO2 — **no call site in range** | 02a-train-exercises |
| — | `ceActivityMap` | function | Activity id → engine modality + defaults | 02a-train-exercises |
| — | `ceAirDensity` | function | Air density from temp/elevation/humidity | 02a-train-exercises |
| — | `ceAmbulationKcal` | function | Minetti + surface + aero + heat run/walk model | 02a-train-exercises |
| — | `ceApproxWbgt` | function | Rough WBGT — **no call site in range** | 02a-train-exercises |
| — | `ceCardStyle` | function | Card container style object | 02e-cardio |
| — | `ceConcept2DisplayedCalPerHour` | function | What the erg screen shows | 02a-train-exercises |
| — | `ceConcept2Kcal` | function | Weight-corrected erg calories | 02a-train-exercises |
| — | `ceConcept2SplitFromWatts` | function | watts → split — **no call site in range** | 02a-train-exercises |
| — | `ceConcept2WattsFromSplit` | function | 500 m split → watts | 02a-train-exercises |
| — | `ceCorrectMachineDisplay` | function | Divide out console over-read — **no call site in range** | 02a-train-exercises |
| — | `ceCyclingKcal` | function | Cycling calories, power-meter or modelled | 02a-train-exercises |
| — | `ceCyclingKcalFromPower` | function | kJ → kcal at a gross efficiency | 02a-train-exercises |
| — | `ceCyclingPowerWatts` | function | Martin 1998 power model | 02a-train-exercises |
| — | `ceEstimateCalories` | function | The 5-tier entry point | 02a-train-exercises |
| — | `ceEstimateCard` | function (render helper) | The calorie estimate card | 02e-cardio |
| — | `ceGradeMultiplier` | function | Grade cost ratio vs flat — **no call site in range** | 02a-train-exercises |
| — | `ceGroupTone` | function | Group hue lookup with orange default | 02e-cardio |
| — | `ceHarrisBenedictKcalPerDay` | function | RMR per day | 02a-train-exercises |
| — | `ceHeadwindComponent` | function | Signed headwind along the travel bearing | 02a-train-exercises |
| — | `ceHeatMultiplier` | function | Capped heat correction, off by default | 02a-train-exercises |
| — | `ceHeatSafetyLevel` | function | WBGT → risk band — **no call site in range** | 02a-train-exercises |
| — | `ceImproveHint` | function | "What one more number buys you" copy | 02e-cardio |
| — | `ceInputStyle` | function | Right-aligned input style object | 02e-cardio |
| — | `ceKeytelKcalPerMin` | function | Heart-rate calories (tier 3) | 02a-train-exercises |
| — | `ceLabelStyle` | function | Section label style object | 02e-cardio |
| — | `ceLoadCarriageKcal` | function | Rucking/hiking calories | 02a-train-exercises |
| — | `ceLookupMetBySpeed` | function | Nearest MET row by mph | 02a-train-exercises |
| — | `ceLookupMetByWatts` | function | MET row by watt band | 02a-train-exercises |
| — | `ceMerge` | function | Shallow one-directional merge | 02a-train-exercises |
| — | `ceMetToKcalPerMin` | function | MET → kcal/min | 02a-train-exercises |
| — | `ceMinettiRunJPerKgPerM` | function | Running cost polynomial vs grade | 02a-train-exercises |
| — | `ceMinettiWalkJPerKgPerM` | function | Walking cost polynomial vs grade | 02a-train-exercises |
| — | `cePandolfWatts` | function | Pandolf load-carriage watts + Santee downhill | 02a-train-exercises |
| — | `cePressureAtElevationPa` | function | Barometric pressure at altitude | 02a-train-exercises |
| — | `ceRidePosition` | function | Ride position → CdA, drops default | 02a-train-exercises |
| — | `ceRmrKcalPerMin` | function | RMR per minute, 1-MET fallback | 02a-train-exercises |
| — | `ceRowIcon` | function | 28px icon tile for a form row | 02e-cardio |
| — | `ceRowStyle` | function | Form row style object | 02e-cardio |
| — | `ceRunAeroJPerKgPerM` | function | Aero cost of running, floored at 0 | 02a-train-exercises |
| — | `ceRunningKcalFromDistance` | function | 1 kcal/kg/km rule | 02a-train-exercises |
| — | `ceSaturationVapourPressurePa` | function | Saturation vapour pressure | 02a-train-exercises |
| — | `ceStairClimbKcal` | function | Vertical work → calories | 02a-train-exercises |
| — | `ceSummaryStats` | function (render helper) | Derived pace/speed/split/power/gross rows | 02e-cardio |
| — | `ceSurface` | function | Surface row lookup, pavement default | 02a-train-exercises |
| — | `ceUnitStyle` | function | Unit suffix style object | 02e-cardio |
| — | `changePassword` | async fn | `auth.updateUser({password})` | 08-auth-sync-root |
| — | `checkDeployVersion` | IIFE | Compare `/app-version` to `lk_deployVersion`, bust cache | 08-auth-sync-root |
| — | `checkTrialWarning` | fn | Top trial banner at ≤4 days left | 08-auth-sync-root |
| — | `checkinCountToday` | function | Count today's entries | 05-coach |
| — | `checkinDoneForDay` | function | Quota met? | 05-coach |
| — | `checkinDoneToday` | function | First entry for today, or null | 05-coach |
| — | `checkinFlag` | function | amber/red at 1/2 SD, stress inverted | 05-coach |
| — | `checkinFlags` | function | Flags for a whole entry | 05-coach |
| — | `checkinLowRun` | function | Consecutive low days from newest | 05-coach |
| — | `checkinPerDay` | function | 1, 2 or 4 check-ins/day | 05-coach |
| — | `checkinScaleLabel` | function | Word label for a 1-5 value | 05-coach |
| — | `checkinStats` | function | 30-day per-item mean/SD, min 14 entries | 05-coach |
| — | `chest` | Chest | Upper Chest, Mid Chest, Lower Chest | 10-shared |
| — | `chooseCorner` | function | Projects the fling and picks the destination corner | 07-misc-gamification |
| — | `claimBetaCode` | fn | Mark used, set betaStatus/betaCode/betaId | 08-auth-sync-root |
| — | `clearConvo` | function (inner) | Two-tap delete of the conversation | 05-coach |
| — | `clockToSec` | function | Parse a clock string to seconds | 02a-train-exercises |
| — | `cloneFoodItem` | function | Shallow clone with a copied `nut` object | 03a-fuel-panels |
| — | `coachBuildContext` | function | Assembles the full coach system prompt (reads `supplements` at 49181 and `cycles` at 49186 when opted in) | 04b-supplements-cycletab |
| — | `coachBuildContext` | function | Builds the entire chat system prompt | 05-coach |
| — | `coachCheckinResponse` | function | The local rules engine behind the payoff card | 05-coach |
| — | `coachContextTokens` | function | Rough token estimate (len/4) | 04b-supplements-cycletab |
| — | `coachContextTokens` | function | `length/4` token estimate — **no caller in this range** | 05-coach |
| — | `coachDataPrefs` | function | Reads per-key coach data-sharing prefs | 04b-supplements-cycletab |
| — | `coachDataPrefs` | function | Data-visibility prefs, default all-on | 05-coach |
| — | `coachInstructions` | 27230 | F-GOAL-005 | 01-home |
| — | `coachMemoryItems` | function | Reads saved coach memories | 04b-supplements-cycletab |
| — | `coachMemoryItems` | function | Normalise legacy + new memory shapes | 05-coach |
| — | `coachMemoryOn` | function | Whether coach memory is enabled | 04b-supplements-cycletab |
| — | `coachMemoryOn` | function | Memory master switch | 05-coach |
| — | `coachOpener` | function | Builds the coach's opening line | 04b-supplements-cycletab |
| — | `coachOpener` | function | Data-driven empty-state line + chips | 05-coach |
| — | `coachStyle` | function | Resolves the active coach style with a "warm" fallback | 04b-supplements-cycletab |
| — | `coachStyle` | function | Resolve the selected persona | 05-coach |
| — | `coachTier3For` | function | Keyword-triggers which deep data tiers to include | 04b-supplements-cycletab |
| — | `coachTier3For` | function | Keyword gate deciding which deep data blocks are attached | 05-coach |
| — | `coachVisibleData` | function | Lists which data categories the coach can currently see | 04b-supplements-cycletab |
| — | `coachVisibleData` | function | Human-readable list for the context receipt | 05-coach |
| — | `completeGoal` | function (inner) | Marks a goal completed with today's date | 01-home |
| — | `completeOnboarding` | fn | Persist profile, normalise the AI program | 08-auth-sync-root |
| — | `computeMuscleRecovery` | function | Per-muscle ready/recovering/heavy rows | 02a-train-exercises |
| — | `computeTrend` | function | EMA (α=0.10) weight trend series | 03a-fuel-panels |
| — | `confirm` | handler | Executes the parsed action and closes the sheet | 07-misc-gamification |
| — | `convertToExistingSplit` | handler | Appends this workout as a new day on a chosen split | 02c-train-hub |
| — | `convertToNewSplit` | handler | Creates a new split with this workout as day 1 | 02c-train-hub |
| — | `cornerToXY` | function | Corner id → x/y coordinates | 07-misc-gamification |
| — | `cycle` | Stack | none | 03b-fuel-main |
| — | `dailyIntakeSeries` | function | Per-day totals for the last N days incl. fiber/sodium | 03a-fuel-panels |
| — | `dark` | Dark | `#1C1C1E` | 06-profile |
| — | `dayOfDate` | inner function | ISO date → cycle day number | 03a-fuel-panels |
| — | `delete confirm handler` | handler | Double-tap confirmation before deleting | 01-home |
| — | `deleteAccount` | async fn | `DELETE /user/delete` then sign out | 08-auth-sync-root |
| — | `deleteCycle` | handler | Removes a cycle and resets the view | 04b-supplements-cycletab |
| — | `deleteGoal` | function (inner) | Logs and removes a goal, resetting selection | 01-home |
| — | `depletePantry` | function | Decrement pantry stock on a log; auto-add to shopping when empty | 03a-fuel-panels |
| — | `detail back handler` | handler | Returns to the list and clears the AI text | 01-home |
| — | `detailRows` | function (inner) | Expanded session detail rows | 02e-cardio |
| — | `diary render IIFE` | function (inline) | Group diary items by meal and render totals | 03c-fuel-entry |
| — | `dismiss` | function (inner) | Guarded animated dismissal, runs the action on the way out | 02a-train-exercises |
| — | `dismiss` | handler | Clears result and closes the sheet | 07-misc-gamification |
| — | `disp` | function (inner) | Unit-aware display wrapper | 02a-train-exercises |
| — | `doLog` | handler | Validate and persist a manually logged PR | 02d-progress-prs |
| — | `doLookup` | handler | Normalise, set loading, resolve, branch found/notfound | 03a-fuel-panels |
| — | `dotRow` | function (inner) | 14-day check-in dot strip | 05-coach |
| — | `down` | handler | Start the 500 ms long-press timer | 03a-fuel-panels |
| — | `downloadText` | function | Blob + synthetic anchor download, URL revoked after 500 ms | 03a-fuel-panels |
| — | `draft` | function (inner) | Build the live/save engine record, converting units | 02e-cardio |
| — | `editUserMessage` | function (inner) | Truncate history to a user turn and reload it into the composer | 05-coach |
| — | `effectiveGrams` | function | Convert cooked grams back to raw/dry grams | 03a-fuel-panels |
| — | `endCycle` | handler | Marks a cycle completed with today's date | 04b-supplements-cycletab |
| — | `enterGuestMode` | fn | Set guest flag, seed profile, reload | 08-auth-sync-root |
| — | `estimate` | function (inner) | POST description to /analyze-meal, parse or fall back | 03c-fuel-entry |
| — | `estimateCardioCalories` | function | v1 MET estimate self-calibrated from the last 5 sessions | 02a-train-exercises |
| — | `exByName` | function | Memoised name→exercise lookup | 02a-train-exercises |
| — | `executeVoiceAction` | function | Applies a confirmed voice action to local storage | 07-misc-gamification |
| — | `exercise Change onClick` | handler | Clears the chosen exercise | 01-home |
| — | `exercise result onClick` | handler | Picks an exercise and clears the query | 01-home |
| — | `exportAll` | function (inner) | Download codes + all logs as JSON | 05-coach |
| — | `exportEverything` | function | Raw dump of every `lk_`/`__lk_ts__` localStorage key | 03a-fuel-panels |
| — | `exportFuelCSV` | function | Two-table CSV of the food diary and the weight log | 03a-fuel-panels |
| — | `exportFuelJSON` | function | Full nutrition-domain JSON bundle | 03a-fuel-panels |
| — | `exportShoppingList` | function | Render the list as grouped plain text | 03c-fuel-entry |
| — | `ez` | EZ Curl Bar | 25 | 07-misc-gamification |
| — | `favShape` | function (inner) | Favourite payload from current form state | 02e-cardio |
| — | `fetchSubscription` | async fn | `GET /user/check` → subscription/usage/limits | 08-auth-sync-root |
| — | `filteredPresets (compound)` | derived value | Preset compounds filtered by category + query | 04b-supplements-cycletab |
| — | `filteredPresets (supp)` | derived value | Presets minus already-added, filtered by query | 04b-supplements-cycletab |
| — | `findCardioFav` | function | Locate a matching favourite | 02a-train-exercises |
| — | `finish` | function | Ends a drag: snap to corner, or treat as a tap | 07-misc-gamification |
| — | `finish` | function | Marks the tutorial seen and calls `p.onDone` | 07-misc-gamification |
| — | `finishWorkout` | fn | Persist rows/sec, route to review | 08-auth-sync-root |
| — | `fireRequest` | function (inner) | The chat POST, error classification, error rows | 05-coach |
| — | `fmt` | function | Trims trailing zeros from a 2-dp number | 07-misc-gamification |
| — | `forceSyncNow` | async fn | Manual sync bypassing the workout guard | 08-auth-sync-root |
| — | `forearms` | Forearms | All | 10-shared |
| — | `fromGross` | function (inner) | gross → {gross,net} | 02a-train-exercises |
| — | `fuelLog` | 26125 | F-HOME-001 | 01-home |
| — | `fuelLog` | 36910; 37008 (via listener re-read) | Per-day meals + water | 03b-fuel-main |
| — | `fuelProfile` | 36913; 37585, 37608 (direct `ld` in MealPlanFuelTab) | Fuel profile and targets | 03b-fuel-main |
| — | `fuelSettings` | 18650 (via `getFuelSettings`, called at 36899) | `hideNumbers`, `framing`, unused `waterGoalMl` | 03b-fuel-main |
| — | `gDate onChange` | handler | Updates the deadline | 01-home |
| — | `gExSearch onChange` | handler | Updates the exercise query | 01-home |
| — | `gName onChange` | handler | Updates the goal name | 01-home |
| — | `gNotes onChange` | handler | Updates the notes | 01-home |
| — | `gTarget onChange` | handler | Sanitises the target to digits and dots | 01-home |
| — | `gamingLayer` | 26430, 26483 | F-HOME-002, F-HOME-011 | 01-home |
| — | `generate` | function (inner) | POST the interview answers, parse the instructions block | 05-coach |
| — | `generateAIMeals` | function (inner) | Ask the model for 4 goal-matched meals | 03c-fuel-entry |
| — | `generatePantryRecipes` | function (inner) | Ask the model for 4 recipes from pantry stock | 03c-fuel-entry |
| — | `getActionLabel` | function | Human-readable one-line summary of a parsed voice action | 07-misc-gamification |
| — | `getAiBfEstimate` | function (inner) | Builds and sends the AI body-fat estimate prompt | 01-home |
| — | `getAiOverview` | handler | Builds the prompt and calls the AI for a cycle overview | 04b-supplements-cycletab |
| — | `getBar` | function | Bar lookup, Olympic default | 02a-train-exercises |
| — | `getBarcodeCache` | function | Read `lk_barcodeCache` | 03a-fuel-panels |
| — | `getBfLog` | function | Reads the body-fat log from storage | 01-home |
| — | `getCompoundStreak` | function | Consecutive-day streak for a compound | 04b-supplements-cycletab |
| — | `getConvoSys` | function | Builds the conversational coach system prompt | 02c-train-hub |
| — | `getCurrentPR` | function (closure) | Max-weight record from `prs[exId]` | 02d-progress-prs |
| — | `getCurrentPhase` | function (inner) | Find the plan phase containing the current week | 05-coach |
| — | `getCurrentValue` | function (inner) | Resolves a goal's current value by type | 01-home |
| — | `getCycleLog` | function | Reads `lk_cycleLog` | 04b-supplements-cycletab |
| — | `getCycles` | function | Reads `lk_cycles` | 04b-supplements-cycletab |
| — | `getDaysLeft` | function (inner) | Days until the goal deadline | 01-home |
| — | `getDueCompounds` | function | Due list for the Home compounds card | 04b-supplements-cycletab |
| — | `getEx` | function | Look up an exercise by id in ALL_EX; synthetic "Unknown" fallback | 02a-train-exercises |
| — | `getExEquip` | function | Read per-exercise bar/plate config | 02a-train-exercises |
| — | `getExNote` | function | Read one exercise's note text | 02a-train-exercises |
| — | `getFavFoods` | function | Read `lk_favFoods` | 03a-fuel-panels |
| — | `getFirstLogged` | function (closure) | Earliest logged heaviest set for an exercise | 02d-progress-prs |
| — | `getFrequentFoods` | function | Foods logged ≥3× in the last N days, by count | 03a-fuel-panels |
| — | `getFuelSettings` | function | Read `lk_fuelSettings` with defaults `{waterGoalMl:null, hideNumbers:false, framing:"remaining"}` | 03a-fuel-panels |
| — | `getGenSys` | function | Builds the program-generation system prompt from collected answers | 02c-train-hub |
| — | `getGoalAiAnalysis` | function (inner) | Builds and sends the AI goal-analysis prompt | 01-home |
| — | `getInvolvement` | function | Primary/secondary/tertiary muscle weights for an exercise | 02a-train-exercises |
| — | `getMyStores` | function | Read lk_myStores | 03c-fuel-entry |
| — | `getProgress` | function (inner) | Percent complete, clamped 0-100 | 01-home |
| — | `getRecentFoods` | function | Last N distinct logged foods, newest first | 03a-fuel-panels |
| — | `getShoppingList` | function | Read lk_shoppingList | 03c-fuel-entry |
| — | `getToken` | async fn | Return `session.access_token` | 08-auth-sync-root |
| — | `getUserRecipes` | function | Read `lk_userRecipes` | 03a-fuel-panels |
| — | `glutes` | Glutes | All | 10-shared |
| — | `go` | fn | Navigate, maintain the nav stack + history | 08-auth-sync-root |
| — | `goNext` | function | Advance a step, or exit to the done phase | 07-misc-gamification |
| — | `goPrev` | function | Go back a step | 07-misc-gamification |
| — | `goal card onClick (active)` | handler | Opens the goal detail | 01-home |
| — | `goal card onClick (completed)` | handler | Opens the goal detail | 01-home |
| — | `goals` | 26998 | F-GOAL-001, 003, 004 | 01-home |
| — | `grams-preview IIFE` | function (inline) | Recompute the four macro tiles from grams | 03c-fuel-entry |
| — | `greeting IIFE` | inline function | Picks a time-of-day greeting string | 01-home |
| — | `groups (IIFE)` | function | Group photos by month, newest month first | 06-profile |
| — | `hams` | Hamstrings | All | 10-shared |
| — | `handleFile` | handler | Read the picked image as a base64 data URL | 03c-fuel-entry |
| — | `handleFile` | function | Resize and persist a chosen/captured image | 06-profile |
| — | `handlePhoto` | function | Reads the selected image into a data URL for preview | 02c-train-hub |
| — | `handleReply` | function (inner) | Parse every action marker out of a reply and build the assistant row | 05-coach |
| — | `handleThemeChange` | function | Re-read `lk_theme` | 06-profile |
| — | `handleTouchEnd` | handler | 50 px swipe threshold → next/prev | 07-misc-gamification |
| — | `handleTouchStart` | handler | Records swipe origin x | 07-misc-gamification |
| — | `header` | function (inner) | Shared step header with optional back button | 02e-cardio |
| — | `headers` | async fn | JSON + `Authorization: Bearer` header object | 08-auth-sync-root |
| — | `hideOverlay` | fn | Fade out the overlay and restore `#root` | 08-auth-sync-root |
| — | `homeLayout` | 26066 (via getHomeLayout, called 26526) | F-HOME-003 | 01-home |
| — | `https://i.ytimg.com/vi/<videoId>/hqdefault.jpg` | GET (`<img src>`) | `onError` hides the `<img>` | 02a-train-exercises |
| — | `https://lockedapi.cescocugliari.workers.dev/` | POST | none | 02c-train-hub |
| — | `https://lockedapi.cescocugliari.workers.dev/` | POST | `Bearer` from `window.LOCKED.session` | 02c-train-hub |
| — | `https://lockedapi.cescocugliari.workers.dev/` | POST | none | 02c-train-hub |
| — | `https://lockedapi.cescocugliari.workers.dev/exercise-detail/{id}` | GET | `r.json()`, no catch — **never called** | 02a-train-exercises |
| — | `https://lockedapi.cescocugliari.workers.dev/yt-search` | POST, `application/json` | reads `d.videoId`; caches on hit; `null` on miss or any error | 02a-train-exercises |
| — | `https://static.exercisedb.dev/media/<hash>.gif` | GET (`<img src>`) | `onError` hides the `<img>` | 02a-train-exercises |
| — | `https://www.youtube.com/watch?v=<videoId>` | `window.open(_blank)` | n/a | 02a-train-exercises |
| — | `id` | label | card | 06-profile |
| — | `id` | name | lb | 07-misc-gamification |
| — | `importEverything` | function | Restore a backup; additive by stamp unless `overwrite` | 03a-fuel-panels |
| — | `init` | fn | Create Supabase client, wire auth listeners, first sync | 08-auth-sync-root |
| — | `initBetaCodes` | fn | Seed `lk_betaCodes` from the defaults | 08-auth-sync-root |
| — | `isCardioFav` | function | Boolean favourite test | 02a-train-exercises |
| — | `isCompoundTaken` | function | Whether a compound was logged on a date | 04b-supplements-cycletab |
| — | `isDeload` | function (inner) | Name/focus substring test for deload weeks | 05-coach |
| — | `isFav` | function | Is a name in favourites | 03a-fuel-panels |
| — | `isFemaleUser` | function | True if `profile.sex` or `fuelProfile.sex` is female | 03a-fuel-panels |
| — | `isGuestMode` | fn | True when no session and `lk_guestMode==="1"` | 08-auth-sync-root |
| — | `isLiftingSession` | function | Not-cardio test | 02a-train-exercises |
| — | `isSilentBeta` | fn | True for `summerbeta` | 08-auth-sync-root |
| — | `isSpecificQuery` | function | True if query names a brand or contains a digit | 03c-fuel-entry |
| — | `isTrainingDay IIFE` | function (inline) | True if p.history has an entry dated today | 03c-fuel-entry |
| — | `isTrainingDayToday` | function | Did a workout happen today | 03a-fuel-panels |
| — | `jumpTo` | function | Jump to a step from the dot indicator | 07-misc-gamification |
| — | `kmToM` | function | km → metres | 02a-train-exercises |
| — | `labelOf` | function | Map a block id to its display label | 06-profile |
| — | `lastSync formatter IIFE` | function | Human-readable last-sync string | 06-profile |
| — | `lcName` | function | Tolerant lowercase name for shopping rows | 02a-train-exercises |
| — | `ld` | fn | Read+parse `lk_<k>` with fallback | 08-auth-sync-root |
| — | `liftSets` | function | Set count, 0 for cardio | 02a-train-exercises |
| — | `liftVolume` | function | Parse `vol` to storage units | 02a-train-exercises |
| — | `light` | Light | `#FFFFFF` | 06-profile |
| — | `line` | function (inner) | "N min · X km · Y cal" row sub-line | 02e-cardio |
| — | `list` | List | `day, fuelLog, addItem, removeItem` | 03b-fuel-main |
| — | `lkConfirm` | function | Two-tap destructive confirm with 7s disarm | 02a-train-exercises |
| — | `lkDialogRef` | function (callback ref) | Dialog focus capture/restore + trap install | 02a-train-exercises |
| — | `lkIsQuotaError` | fn | Recognise quota-exceeded errors | 08-auth-sync-root |
| — | `lkKeyActivate` | handler | Enter/Space activation for role=button wrappers | 02a-train-exercises |
| — | `lkLockScroll` | function | Ref-counted scroll lock | 02a-train-exercises |
| — | `lkOverlayRoot` | function | Lazily create the locking portal host | 02a-train-exercises |
| — | `lkPortal` | function | Portal children into the right host, with fallback | 02a-train-exercises |
| — | `lkScrollBy` | function | Nudge the region | 02a-train-exercises |
| — | `lkScrollToTop` | function | Reset the region | 02a-train-exercises |
| — | `lkScrollTop` | function | Read scroll offset from the region | 02a-train-exercises |
| — | `lkScroller` | function | Get the `.lk-scroll` region | 02a-train-exercises |
| — | `lkSheetRoot` | function | Lazily create the non-locking portal host | 02a-train-exercises |
| — | `lkStorageUsage` | fn | Bytes used total / by photos / budget | 08-auth-sync-root |
| — | `lkTrapTab` | handler | Focus wrap inside a dialog | 02a-train-exercises |
| — | `lkUnlockScroll` | function | Ref-counted unlock + restore | 02a-train-exercises |
| — | `lk_cardioFavorites` | `cardioFavorites` 5822 | Array of saved cardio setups | 02a-train-exercises |
| — | `lk_cardioFavorites` | 55551, 56218, 56282, 56591 (via `isCardioFav`), 56655, 56434 — all resolving to 5822 | The only key this module writes directly | 02e-cardio |
| — | `lk_cardioMigrated` | 6954 | One-shot migration flag, set even when 0 rows migrated | 02a-train-exercises |
| — | `lk_cardioPrefs` | `cardioPrefs` 5647 | `{distUnit, weeklyTargetMin, maxHrOverride, zoneModel, restingHr}` | 02a-train-exercises |
| — | `lk_cardioPrefs` | 55555 (`cardioPrefs`, 5647), 55908 (via `cardioMaxHr`, 5665) | `prefs` at 55555 is unused | 02e-cardio |
| — | `lk_customEx` | 4278 (outside range, feeds `ALL_EX`) | Custom exercises created by F-TRAIN-008 | 02a-train-exercises |
| — | `lk_cycleLog` | 47292, 2813, 1506 | Date→`cycle::compound` keys; never pruned | 04b-supplements-cycletab |
| — | `lk_cycles` | 47286, 2812, 1505 | Cycle list; synced (201) | 04b-supplements-cycletab |
| — | `lk_exNotes` | `loadExNotes` 7098, `getExNote` 7102 | One object keyed by `String(exId)`, value `{text, updated}` | 02a-train-exercises |
| — | `lk_exequip_<exerciseId>` | `getExEquip` 7048 | One key per exercise; unbounded growth | 02a-train-exercises |
| — | `lk_fuelLog` | 53490, 53516 | F-MISC-006 | 07-misc-gamification |
| — | `lk_fuelProfile` | 56386 | body profile fallback | 02e-cardio |
| — | `lk_fuelProfile` | 36913, 53688 | F-MISC-001, F-MISC-006 | 07-misc-gamification |
| — | `lk_gamingLayer` | 26423, 26510, 30396, 32067 | F-GAME-001/002/003 | 07-misc-gamification |
| — | `lk_history` | `migrateCardioV2` 6955 | Shared with strength sessions by design (5452–5460) | 02a-train-exercises |
| — | `lk_history` | indirectly — records reach `App`'s `setHistory` (57649-57653) | persistence itself is outside this range | 02e-cardio |
| — | `lk_history` | 53565, 53580 | F-MISC-006 | 07-misc-gamification |
| — | `lk_myGroceries` | 39366 | F-FUEL-410 | 03c-fuel-entry |
| — | `lk_myStores` | 42074 | F-FUEL-425 | 03c-fuel-entry |
| — | `lk_perfTracking` | 47321, 47335, 37329, 33335/33340/33347/33360, 1504, 49186 | Opt-in gate for all cycle features | 04b-supplements-cycletab |
| — | `lk_profile` | 53683, 53688, 53693 | F-MISC-006 | 07-misc-gamification |
| — | `lk_pushDeviceId` / `lk_pushPrefs` / `lk_pushEnabled` | 1307–1309 | Referenced only by the push path behind F-SUPP-011 | 04b-supplements-cycletab |
| — | `lk_refeedAccepted` | 2944, 36920 | F-MISC-001 | 07-misc-gamification |
| — | `lk_refeedDismissed` | 2939 | F-MISC-001 | 07-misc-gamification |
| — | `lk_reminderMigrated` | 2395 | One-shot migration flag | 04b-supplements-cycletab |
| — | `lk_shoppingList` | 41946 | F-FUEL-419, 424, 425 | 03c-fuel-entry |
| — | `lk_suppLog` | 46132, 46282, 46407, 1485, 19409 | Date→names map; **never pruned on delete** | 04b-supplements-cycletab |
| — | `lk_supplements` | 46279, 46162, 2396, 1484, 19408, 49181 | The supplement list; synced (201–202) | 04b-supplements-cycletab |
| — | `lk_tutorialSeen` | 57220 | F-MISC-008 | 07-misc-gamification |
| — | `lk_usdaKey` | 39369 | F-FUEL-411 | 03c-fuel-entry |
| — | `lk_voiceBtnCorner` | 53841, 53848 | F-MISC-004 | 07-misc-gamification |
| — | `lk_voiceEnabled` | 32061, 53702, 53706 | F-MISC-007 | 07-misc-gamification |
| — | `lk_weightLog` | 56386 | body profile fallback | 02e-cardio |
| — | `lk_weightLog` | 2909 (`getWeightLog`), 53690 | F-MISC-002, F-MISC-001, F-MISC-006 | 07-misc-gamification |
| — | `loadExNotes` | function | Read the whole notes object, type-guarded | 02a-train-exercises |
| — | `loadZXing` | function | Inject the ZXing UMD bundle from unpkg once | 03a-fuel-panels |
| — | `log (ListTab)` | handler | Log every previewed item to the chosen meal | 03c-fuel-entry |
| — | `log (PhotoTab)` | handler | Log all analysed items and reset the tab | 03c-fuel-entry |
| — | `logBetaAI` | function | Append `{ts,input,output,betaId}` to `lk_betaAILog` | 05-coach |
| — | `logBetaAI` | fn | Append prompt/response to `lk_betaAILog` | 08-auth-sync-root |
| — | `logBetaActivity` | function | Append `{ts,action,data,betaId}` to `lk_betaLog` | 05-coach |
| — | `logBetaActivity` | fn | Append an action to `lk_betaLog` | 08-auth-sync-root |
| — | `logBf` | function (inner) | Validates and stores a body-fat entry | 01-home |
| — | `logFound` | handler | Log the scaled product and auto-save it to My Store | 03a-fuel-panels |
| — | `logNotFound` | handler | Log hand-entered label values and save to My Store | 03a-fuel-panels |
| — | `logSelected` | function (inner) | Scale selected food by grams and log it | 03c-fuel-entry |
| — | `log` (inner)` | handler | Build and add the scaled recipe item | 03a-fuel-panels |
| — | `lookupBarcode` | function | My Store → cache → OpenFoodFacts → USDA resolution chain | 03a-fuel-panels |
| — | `mToKm` | function | metres → km | 02a-train-exercises |
| — | `mToMi` | function | metres → miles | 02a-train-exercises |
| — | `main` | Fuel dashboard | default | 03b-fuel-main |
| — | `markCompoundTaken` | function | Appends `cycle::compound` to today's log | 04b-supplements-cycletab |
| — | `matchTargetToData` | function (inner) | Match a phase target to a PR, bodyweight, bf or goal | 05-coach |
| — | `matchTupleLocal` | function | Score-match a tuple against favs/groceries/FOODS, build item | 03a-fuel-panels |
| — | `matchTuples` | function | Split tuples into matched items and unmatched | 03a-fuel-panels |
| — | `mb` | function | Format bytes as "N.N MB" | 06-profile |
| — | `mcAddDays` | function | Shift an ISO date by N days | 03a-fuel-panels |
| — | `mcArcPath` | function | SVG arc path between two angles | 03a-fuel-panels |
| — | `mcAthleteFlags` | function | Detect long gaps / missed cycles against training history | 03a-fuel-panels |
| — | `mcCompute` | function | Full cycle model: avg length, SD, confidence, phase, ovulation, fertile and PMS windows, pregnancy recovery, EC adjustment | 03a-fuel-panels |
| — | `mcDiff` | function | Whole-day difference between two ISO dates | 03a-fuel-panels |
| — | `mcExportData` | function | Share or download cycle JSON via Web Share, else Blob download | 03a-fuel-panels |
| — | `mcFmt` | function | ISO date → "Mon D" | 03a-fuel-panels |
| — | `mcGetDays` / `mcSaveDays` | functions | Read/write `lk_mcDays` | 03a-fuel-panels |
| — | `mcGetProfile` / `mcSaveProfile` | functions | Read/write `lk_mcProfile` | 03a-fuel-panels |
| — | `mcISO` | function | Local-date → `YYYY-MM-DD` | 03a-fuel-panels |
| — | `mcInsights` | function | Build the phrased insight list from buckets and flags | 03a-fuel-panels |
| — | `mcParse` | function | `YYYY-MM-DD` → local `Date` | 03a-fuel-panels |
| — | `mcPeriodStarts` | function | Derive period start dates from flow ≥2 runs, excluding post-pregnancy bleeds | 03a-fuel-panels |
| — | `mcPolar` | function | Polar→cartesian for the cycle dial | 03a-fuel-panels |
| — | `mcPreSymptoms` | function | Symptoms occurring ≥60% pre-period with ≥3 logs | 03a-fuel-panels |
| — | `mcPregEnds` | function | Sorted dates of abortion/miscarriage events | 03a-fuel-panels |
| — | `mcSymLabel` | function | Symptom id → label | 03a-fuel-panels |
| — | `mcSymptomBuckets` | function | Per-symptom during/before/total counts | 03a-fuel-panels |
| — | `mcTodayISO` | function | Today as ISO | 03a-fuel-panels |
| — | `mealPlans` | 45228 (via `getMealPlans`, called 37470) | Saved AI meal plans | 03b-fuel-main |
| — | `mergeAndRank` | function (inner) | Dedupe pools by name, then rank | 03c-fuel-entry |
| — | `mergedSub` | function (inner) | Merge catalogue + custom exercises for a sub-group | 02a-train-exercises |
| — | `metFallback` | function (inner) | Tier 4/5 result | 02a-train-exercises |
| — | `miToM` | function | miles → metres | 02a-train-exercises |
| — | `midnight` | Midnight | `#1C183A` | 06-profile |
| — | `migrateCardioV2` | function | One-shot v1→v2 cardio migration | 02a-train-exercises |
| — | `migratePrDates` | fn | Recover real PR dates from history | 08-auth-sync-root |
| — | `migrateSuppReminders` | fn | Reset inert `reminder:false` to true | 08-auth-sync-root |
| — | `move` | handler | Reorder a favourite by ±1 | 02e-cardio |
| — | `move` | function | Swap a block with its neighbour | 06-profile |
| — | `muscleVolumeSummary` | function | 6-week synergy-weighted weekly set volume per muscle | 02a-train-exercises |
| — | `nameSimilarity` | function | Token-overlap ratio between two food names | 03a-fuel-panels |
| — | `navy` | Navy | `#112035` | 06-profile |
| — | `nextPhoto` | function | Wrap to the next photo | 06-profile |
| — | `nextSlot` | function | Next meal slot in cyclic order | 03a-fuel-panels |
| — | `none` | No Bar | 0 | 07-misc-gamification |
| — | `normFoodName` | function | Lowercase/trim/collapse a food name into a match key | 03a-fuel-panels |
| — | `normalizeAiItems` | function | Coerce AI meal items into logged-item shape, `src:"ai"`, `est` | 03a-fuel-panels |
| — | `normalizeGTIN` | function | Strip non-digits; pad a 12-digit UPC to 13 | 03a-fuel-panels |
| — | `numField` | function (inner) | Render one metric input (num / clock / rpe) | 02e-cardio |
| — | `nutrientTargets` | function | Sex- and calorie-scaled micro goals with min/max/info type | 03a-fuel-panels |
| — | `offNut100` | function | Map OpenFoodFacts `*_100g` fields to internal micro keys | 03a-fuel-panels |
| — | `offSodiumMg` | function | Sodium mg from OFF `sodium_100g`, else `salt_100g / 2.5` | 03a-fuel-panels |
| — | `oly` | Olympic Bar | 45 | 07-misc-gamification |
| — | `onBack (WorkoutDetail)` | handler | Clears the selected workout | 01-home |
| — | `onCancel` | handler | touchcancel → `finish(true)` | 07-misc-gamification |
| — | `onChange` | handler | Debounced note save | 02a-train-exercises |
| — | `onChange — liftSearch` | handler | Update picker query | 02d-progress-prs |
| — | `onChange — logEx select` | handler | Choose exercise | 02d-progress-prs |
| — | `onChange — logW` | handler | Weight input | 02d-progress-prs |
| — | `onChange — vault search` | handler | Filter vault list | 02d-progress-prs |
| — | `onClick — ADD LIFT` | handler | Open the exercise picker | 02d-progress-prs |
| — | `onClick — LOG A PR WITHOUT A WORKOUT` | handler | Open log form | 02d-progress-prs |
| — | `onClick — Log New PR` | handler | Open log form pre-set to this exercise | 02d-progress-prs |
| — | `onClick — PRHub inner tab` | handler | Switch PRHub tab (unreachable) | 02d-progress-prs |
| — | `onClick — back to home` | handler | `p.go("home")` | 02d-progress-prs |
| — | `onClick — log-form back` | handler | Close log form | 02d-progress-prs |
| — | `onClick — next month` | handler | Increment month, wrap year | 02d-progress-prs |
| — | `onClick — pick exercise` | handler | Append id to featured list | 02d-progress-prs |
| — | `onClick — picker back` | handler | Close picker, clear search | 02d-progress-prs |
| — | `onClick — prev month` | handler | Decrement month, wrap year | 02d-progress-prs |
| — | `onClick — progress tab pill` | handler | `setTab(t[0])` | 02d-progress-prs |
| — | `onClick — range button` | handler | `setPrRange(t[0])` | 02d-progress-prs |
| — | `onClick — rep chip` | handler | Choose rep count | 02d-progress-prs |
| — | `onClick — unpin featured lift` | handler | Remove id from featured list | 02d-progress-prs |
| — | `onClick — vault back` | handler | `setSel(null)` | 02d-progress-prs |
| — | `onClick — vault row` | handler | Open exercise detail | 02d-progress-prs |
| — | `onCode` | handler | A code was decoded: stop the camera and look it up | 03a-fuel-panels |
| — | `onConvertToSplit` | handler | Upserts a split derived from the workout | 01-home |
| — | `onDelete (WorkoutDetail)` | handler | Removes the workout from history | 01-home |
| — | `onDismiss (throwback)` | handler | Dismisses the throwback and forces a re-render | 01-home |
| — | `onDismiss — throwback` | handler | Dismiss throwback card | 02d-progress-prs |
| — | `onEdit (WorkoutDetail)` | handler | Replaces the edited workout in history | 01-home |
| — | `onEnd` | handler | mouseup/touchend → `finish(false)` | 07-misc-gamification |
| — | `onEvt` | handler (inner) | `lockedCoachPane` event listener | 05-coach |
| — | `onMove` | handler | Drag tracking, clamping, velocity smoothing | 07-misc-gamification |
| — | `onPointerDown` | handler | Starts a drag, seeds offsets and velocity | 07-misc-gamification |
| — | `onResize` | handler | Re-parks on window resize (corner-dependent effect) | 07-misc-gamification |
| — | `openAdd` | function (inner) | Resets the form and opens the add view | 01-home |
| — | `openAdd` | handler | Resets the form and opens it in add mode | 04b-supplements-cycletab |
| — | `openAdd (CycleTab)` | handler | Resets the cycle form, opens `add` view | 04b-supplements-cycletab |
| — | `openCompEdit` | handler | Hydrates the compound form from `cComps[idx]` | 04b-supplements-cycletab |
| — | `openEdit` | function (inner) | Prefills the form from an existing goal | 01-home |
| — | `openEdit` | handler | Hydrates the form from an existing supplement | 04b-supplements-cycletab |
| — | `openEdit (CycleTab)` | handler | Hydrates the cycle form from an existing cycle | 04b-supplements-cycletab |
| — | `openLightbox` | function | Open the lightbox at an index, resetting analysis | 06-profile |
| — | `openLog` | handler | Open the log flow with/without a preset | 02e-cardio |
| — | `pColor` | function | IPF-style colour for a plate weight | 07-misc-gamification |
| — | `pH` | function | Pixel height for a plate weight | 07-misc-gamification |
| — | `pW` | function | Pixel width for a plate weight | 07-misc-gamification |
| — | `pack` | function (inner) | Wrap a result with tier/confidence/range | 02a-train-exercises |
| — | `pantry-stock IIFE` | function (inline) | Render the "IN YOUR PANTRY" summary or empty state | 03c-fuel-entry |
| — | `pantryBestPrice` | function | Cheapest recorded price for an item | 03a-fuel-panels |
| — | `pantryLastPriceFor` | function | Most recent price for a fuzzy name match | 03a-fuel-panels |
| — | `pantryUseSoon` | function | Is a pantry item within 3 days of its shelf life | 03a-fuel-panels |
| — | `parseFoodText` | function | AI-parse free text into `{qty,unit,food}` tuples | 03a-fuel-panels |
| — | `parseIngredient` | function | Split "2 cups rice" into {name, quantity, unit} | 03c-fuel-entry |
| — | `parseItemWithQuantity` | function (inner) | Alias for `parseIngredient` | 05-coach |
| — | `parseOffProduct` | function | OFF product JSON → internal per-100g item; null without kcal | 03a-fuel-panels |
| — | `parseShoppingFromCoach` | function (inner) | Split a `###SHOPPING_ADD###` block into item strings | 05-coach |
| — | `parseTargetValue` | function (inner) | Parse "315 lb"/"12%" style target strings | 05-coach |
| — | `parsedCardioMetres` | function | Normalises a spoken distance to metres | 07-misc-gamification |
| — | `parsedCardioModality` | function | Maps spoken activity text to a cardio activity id | 07-misc-gamification |
| — | `parsedCardioSeconds` | function | Normalises duration (sec / min / mm:ss) to seconds | 07-misc-gamification |
| — | `perfTracking` | 37391 | Gates the "Stack" (cycle) pill | 03b-fuel-main |
| — | `phaseOfDay` | inner function | Cycle day → phase name | 03a-fuel-panels |
| — | `photo` | Photo | `addItem` | 03b-fuel-main |
| — | `pickerResults` | inner function | Substring search over FOODS + groceries + favs, cap 8 | 03a-fuel-panels |
| — | `plan` | Meal Plans | `fuelProfile, addItem` | 03b-fuel-main |
| — | `prevPhoto` | function | Wrap to the previous photo | 06-profile |
| — | `profile` | Fuel Profile | header "My Profile" button (37142) | 03b-fuel-main |
| — | `profile` | 37490 (direct `ld("profile", {})`) | Fallback macro/goal source in `buildMealContext` | 03b-fuel-main |
| — | `progressPhotos` | 27195 | F-GOAL-007 | 01-home |
| — | `quads` | Quads | All | 10-shared |
| — | `rankFoodResults` | function | Score, sort and tag ★BEST across merged pools | 03c-fuel-entry |
| — | `reader.onload (restore)` | handler | Apply the parsed backup | 06-profile |
| — | `recipes` | Recipes | `fuelProfile, addItem, history: p.history` | 03b-fuel-main |
| — | `reconcileTDEE` | function | Observed TDEE from 14 d of intake vs weight-trend change | 03a-fuel-panels |
| — | `refeedAccepted` | 36919; 2946 | ISO day the refeed was accepted | 03b-fuel-main |
| — | `refeedDismissed` | 2940 | ISO timestamp of last dismissal (5-day cooldown) | 03b-fuel-main |
| — | `refresh (inside StorageCard effect)` | function | Re-read usage | 06-profile |
| — | `reloadIfPulled` | fn | Reload once when cloud data was pulled | 08-auth-sync-root |
| — | `remove` | handler | Delete a favourite | 02e-cardio |
| — | `remove` | handler | Two-tap delete of a supplement | 04b-supplements-cycletab |
| — | `removeComp` | handler | Removes a compound from the draft (no confirm) | 04b-supplements-cycletab |
| — | `removeExSet` | handler | Removes one set | 02c-train-hub |
| — | `removeExercise` | handler | Removes a whole exercise from the edited workout | 02c-train-hub |
| — | `removePhoto` | function | Delete one photo and close the lightbox | 06-profile |
| — | `removeShoppingItem` | function | Delete a shopping row by id | 03c-fuel-entry |
| — | `rename` | handler | Commit a favourite rename | 02e-cardio |
| — | `renderTab` | fn | Map `screen` to a screen component | 08-auth-sync-root |
| — | `repark` | handler | Re-positions the button on bottom-bar/resize events | 07-misc-gamification |
| — | `reread` | function | Re-pull `P.status()` into state | 06-profile |
| — | `reset` | handler | Stop the camera and return to idle | 03a-fuel-panels |
| — | `reset` | function | Clears all plates | 07-misc-gamification |
| — | `resetPassword` | async fn | `resetPasswordForEmail` with `?reset=1` redirect | 08-auth-sync-root |
| — | `resolveExId` | function | Exact-name lookup of an exercise id in `ALL_EX` | 02c-train-hub |
| — | `resolveSavedEx` | function | Resolve a saved set-row back to a catalogue exercise | 02a-train-exercises |
| — | `retryLast` | function (inner) | Drop error rows and re-fire | 05-coach |
| — | `rirIntensity` | function | RIR → intensity factor (1.0 … 0.4) | 02a-train-exercises |
| — | `row` | inner function | Title + body paragraph pair | 03a-fuel-panels |
| — | `row` | function | Render a title/sub/switch row | 06-profile |
| — | `rpeField` | function (inner) | 1-10 effort selector | 02e-cardio |
| — | `rubber` | function | Rubber-band resistance past the viewport edges | 07-misc-gamification |
| — | `run` | handler (inner) | Dispatches a quick action: water logs, others navigate | 01-home |
| — | `sameWorkout` | function | Identity test for a history row | 02a-train-exercises |
| — | `save` | function | Builds the history record and calls `p.onSave` (double-tap guarded) | 02c-train-hub |
| — | `save` | handler | Validate, estimate, build the record, hand it up | 02e-cardio |
| — | `save` | handler | Persist the new recipe with its computed per-serving | 03a-fuel-panels |
| — | `save` | handler | Validates and persists a new/edited supplement | 04b-supplements-cycletab |
| — | `saveCardioFavorites` | function | Persist favourites | 02a-train-exercises |
| — | `saveCardioPrefs` | function | Merge-write cardio preferences | 02a-train-exercises |
| — | `saveCoachCardio` | function (inner) | Rebuild and log a cardio session from the AI payload | 05-coach |
| — | `saveCoachFood` | function (inner) | Append AI-parsed food items into today's fuel log | 05-coach |
| — | `saveCoachGoal` | function (inner) | Create a goal with a resolved current value | 05-coach |
| — | `saveCoachName` | function (inner) | Persist a renamed coach (≤24 chars) | 05-coach |
| — | `saveCoachPlan` | function (inner) | Persist an AI plan | 05-coach |
| — | `saveCoachRecipe` | function (inner) | Persist a recipe to `lk_coachRecipes` | 05-coach |
| — | `saveCoachSplit` | function (inner) | Convert an AI split payload into app splits | 05-coach |
| — | `saveComp` | handler | Adds/replaces a compound in the draft cycle | 04b-supplements-cycletab |
| — | `saveCycle` | handler | Validates and persists a cycle | 04b-supplements-cycletab |
| — | `saveCycles` | function | Writes `lk_cycles` | 04b-supplements-cycletab |
| — | `saveEdit` | function | Recomputes totals and emits the updated workout | 02c-train-hub |
| — | `saveExNote` | function | Write or delete one note | 02a-train-exercises |
| — | `saveGoal` | function (inner) | Validates, computes the start baseline, creates or updates a goal | 01-home |
| — | `saveInstructions` | function (inner) | Save the instructions draft and flash "✓ Saved" | 05-coach |
| — | `saveMyStores` | function | Write lk_myStores | 03c-fuel-entry |
| — | `saveShoppingList` | function | Write lk_shoppingList | 03c-fuel-entry |
| — | `saveSplits` | function | Normalises the AI program into split objects and hands them up | 02c-train-hub |
| — | `saveToMyStore` | function (inner) | Scale by grams and save to My Store | 03c-fuel-entry |
| — | `saveUsdaKey` | function (inner) | Persist the USDA key (blank → DEMO_KEY) | 03c-fuel-entry |
| — | `saveUserRecipes` | function | Persist recipes and dispatch `lockedFuelUpdate` | 03a-fuel-panels |
| — | `saveWorkout` | fn | Commit a session to history, clear active keys, sync | 08-auth-sync-root |
| — | `scaleNut` | function | Scale a per-100g micro object by a factor, 1 dp | 03a-fuel-panels |
| — | `scan` | Scan | `addItem, gtin: pendingGtin, onConsumeGtin` | 03b-fuel-main |
| — | `scoreName` | inner function | 3/2/1/0 name-match score | 03a-fuel-panels |
| — | `sd` | fn | Write `lk_<k>`, toast+event on quota, return bool | 08-auth-sync-root |
| — | `search` | Search | `day, addItem, removeItem, onScan` (onScan sets `pendingGtin` and jumps to `scan`) | 03b-fuel-main |
| — | `search` | function (inner) | Barcode shortcut, local-first, 3-source fan-out | 03c-fuel-entry |
| — | `searchFatSecret` | function (inner) | Query the worker's FatSecret proxy | 03c-fuel-entry |
| — | `searchUSDA` | function (inner) | Query USDA FDC, map nutrient ids to /100g | 03c-fuel-entry |
| — | `secToClock` | function | mm:ss / h:mm:ss | 02a-train-exercises |
| — | `seedExistingTimestamps` | IIFE | One-time `__lk_ts__` backfill for sync keys | 08-auth-sync-root |
| — | `send` | function | Sends a user answer; forces generation after 6 answers | 02c-train-hub |
| — | `send` | function (inner) | Optimistically append the user turn and fire | 05-coach |
| — | `sendAudio` | function | POSTs the audio blob to the /voice worker | 07-misc-gamification |
| — | `sendTest` | function (async) | Fire a test push | 06-profile |
| — | `sessionMetaLine` | function | Sub-line under a session in history lists | 02a-train-exercises |
| — | `sessionSummaryLine` | function | One-line session description for the AI | 02a-train-exercises |
| — | `setCoachMemory` | function (inner) | Functional setter that also persists `lk_coachMemory` | 05-coach |
| — | `setCodes` | function (inner) | Functional setter that persists `lk_betaCodes` | 05-coach |
| — | `setCycles` | function | State setter that persists `lk_cycles` | 04b-supplements-cycletab |
| — | `setDataPref` | function (inner) | Write one coach data-visibility pref | 05-coach |
| — | `setEntries` | function (inner) | Functional setter that persists `lk_feedback` | 05-coach |
| — | `setExEquip` | function | Write per-exercise bar/plate config | 02a-train-exercises |
| — | `setExSet` | handler | Immutably updates one field of one set in edit mode | 02c-train-hub |
| — | `setFavs` | handler | Persist + set favourites state | 02e-cardio |
| — | `setFeaturedIds` | function (closure) | Functional setter that mirrors featured lifts to storage | 02d-progress-prs |
| — | `setField` | handler | Set one metrics key immutably | 02e-cardio |
| — | `setFuelSettings` | function | Merge-patch fuel settings, persist, dispatch `lockedFuelUpdate` | 03a-fuel-panels |
| — | `setGoals` | function (inner) | State setter that also persists goals to localStorage | 01-home |
| — | `setHistory` | fn | Set + persist workout history | 08-auth-sync-root |
| — | `setLayout` | function | Persist and set layout state | 06-profile |
| — | `setPlan` | function (inner) | Set + persist `lk_coachPlan` | 05-coach |
| — | `setPref` | function (async) | Optimistically patch one push preference | 06-profile |
| — | `setPrs` | fn | Set + persist PRs | 08-auth-sync-root |
| — | `setRating` | handler | Sets one reflection score | 02c-train-hub |
| — | `setShoppingDone` | function (inner) | Set/clear this card's "added to shop" flag | 03c-fuel-entry |
| — | `setSplits` | fn | Set + persist splits | 08-auth-sync-root |
| — | `setStoreItems` | function (inner) | Set My Store state and persist to lk_myGroceries | 03c-fuel-entry |
| — | `setSupps` | function | State setter that also persists `lk_supplements` | 04b-supplements-cycletab |
| — | `setVal` | function (inner) | Set one check-in item's 1-5 value | 05-coach |
| — | `setWorkout` | fn | Set + persist the active workout | 08-auth-sync-root |
| — | `shop` | Shopping & Budget | header "Shop" button (37105) | 03b-fuel-main |
| — | `shopping list` | via `addShoppingItem` 53484 | F-MISC-006 | 07-misc-gamification |
| — | `shopping list key` | 41945 (via `getShoppingList`, called 37720) | Shopping list merge target | 03b-fuel-main |
| — | `shoulders` | Shoulders | Front Delt, Side Delt, Rear Delt | 10-shared |
| — | `showOverlay` | fn | Show or build the auth overlay | 08-auth-sync-root |
| — | `showPaywall` | fn | Build/show the Pro upsell sheet | 08-auth-sync-root |
| — | `showToast` | fn | Global toast with `role="status"` | 08-auth-sync-root |
| — | `showVoiceToast` | function | Shows the global `#lockedVoiceToast` element for 3 s | 07-misc-gamification |
| — | `shown filter IIFE` | function (inline) | Filter classic recipes by diet and cut goal | 03c-fuel-entry |
| — | `signIn` | async fn | Sign in, wipe on uid change, merge, reload | 08-auth-sync-root |
| — | `signOut` | async fn | Sign out and show the overlay | 08-auth-sync-root |
| — | `signUp` | async fn | Bare `auth.signUp` | 08-auth-sync-root |
| — | `slate` | Slate | `#21262D` | 06-profile |
| — | `slotForNow` | function | Meal slot from the current hour (11/15/21 cutoffs) | 03a-fuel-panels |
| — | `smartUnit` | function | Guess a sensible unit from a food name | 03c-fuel-entry |
| — | `smith` | Smith Machine | 15 | 07-misc-gamification |
| — | `springToPoint` | function | Critically-damped spring to a corner + haptic | 07-misc-gamification |
| — | `startChat` | function | Opens the chat mode and fetches the first coach turn | 02c-train-hub |
| — | `startRec` | function | Requests the mic and starts MediaRecorder | 07-misc-gamification |
| — | `startScan` | handler | Acquire the camera and start BarcodeDetector or ZXing | 03a-fuel-panels |
| — | `startWorkout` | fn | Begin/restore a session, route to workout or review | 08-auth-sync-root |
| — | `step` | function (inner) | One rAF frame of the count-up easing | 02e-cardio |
| — | `step` (inner)` | function | One rAF frame of the spring integration | 07-misc-gamification |
| — | `stopCam` | handler | Clear the poll, reset ZXing, stop all camera tracks | 03a-fuel-panels |
| — | `stopGeneration` | function (inner) | Abort the in-flight reply, optionally silently | 05-coach |
| — | `stopRec` | function | Stops the recorder (triggers `onstop` → upload) | 07-misc-gamification |
| — | `stopSpring` | function | Cancels an in-flight spring animation | 07-misc-gamification |
| — | `stores key` | 42073 (via `getMyStores`, called 37488) | Enabled store names for the prompt | 03b-fuel-main |
| — | `submit` | function (inner) | Build, evaluate and store a check-in | 05-coach |
| — | `submit` | handler | Validates and converts the typed weight, calls `p.onLog` | 07-misc-gamification |
| — | `submitReflection` | function | Assembles the personalized coach prompt and requests the insight | 02c-train-hub |
| — | `sumDayNutrients` | function | Sum all micros across a day's four meal slots, tracking gaps | 03a-fuel-panels |
| — | `summaryLine` | function | "brand · N min" sub-line | 02e-cardio |
| — | `supps` | Supps | none | 03b-fuel-main |
| — | `sync` | function (inner) | Measure and publish nav height | 02a-train-exercises |
| — | `sync` | handler | Re-reads the voice-enabled flag on toggle/storage events | 07-misc-gamification |
| — | `sync (voice)` | function | Re-read `lk_voiceEnabled` | 06-profile |
| — | `syncBetaData` | function | POST all local beta data to `/beta-sync` | 05-coach |
| — | `syncBetaData` | fn | Unauthenticated upload of beta+user data | 08-auth-sync-root |
| — | `syncBidirectional` | async fn | Full timestamp-merge sync with the worker | 08-auth-sync-root |
| — | `tab` | Label | Props passed | 03b-fuel-main |
| — | `tab` | Label | Props passed | 03b-fuel-main |
| — | `take` | function (inner) | Keep the better of two candidates | 02e-cardio |
| — | `take (CycleReminderCard)` | handler | Logs a compound taken from the Home card | 04b-supplements-cycletab |
| — | `take (CycleTab)` | handler | Logs a compound taken from the detail screen | 04b-supplements-cycletab |
| — | `take (SuppReminderCard)` | handler | Marks one supplement taken and drops it from the card | 04b-supplements-cycletab |
| — | `take (SupplementsTab)` | handler | Marks a supplement taken from the list | 04b-supplements-cycletab |
| — | `tdeeHistory` | 19263 | Adaptive TDEE weekly entries | 03b-fuel-main |
| — | `throwbackDismissed` | 4603/4606 (via computeThrowback) | F-HOME-007 | 01-home |
| — | `timeRow` | function | Render a labelled `<input type=time>` | 06-profile |
| — | `toDisp` | function (inner) | Converts a stored kg bodyweight to the display unit | 01-home |
| — | `toDisp (PRHub)` | function (closure) | kg → display unit | 02d-progress-prs |
| — | `toDisp (ProgressPage)` | function (closure) | Bodyweight kg → display unit | 02d-progress-prs |
| — | `toKg` | function (inner) | Converts a displayed value back to kg — **never called** | 01-home |
| — | `toKg` | function (closure) | Display unit → stored unit | 02d-progress-prs |
| — | `toPane` | function (inner) | Validate and apply a deep-linked pane name | 05-coach |
| — | `toggleCardioFav` | function | Add/remove a saved setup, new ones first | 02a-train-exercises |
| — | `toggleCode` | function (inner) | Revoke / reactivate a code | 05-coach |
| — | `toggleFav` | function | Add/remove a favourite, stamp `savedAt`, dispatch event | 03a-fuel-panels |
| — | `toggleHide` | function | Add/remove a block from `hidden` | 06-profile |
| — | `toggleMain` | function (async) | Enable/disable push | 06-profile |
| — | `toggleQuick` | function | Toggle a quick action, capped at 3 | 06-profile |
| — | `toggleRec` | function | Start/stop switch for a tap | 07-misc-gamification |
| — | `toggleShoppingItem` | function | Flip a row's checked flag | 03c-fuel-entry |
| — | `toggleSplitOpen` | handler | Flips a split's expanded flag and persists the map | 02c-train-hub |
| — | `toggleUnit` | fn | Flip kg/lb and persist to profile | 08-auth-sync-root |
| — | `trap` | Trap Bar | 55 | 07-misc-gamification |
| — | `trendOnOrBefore` | function | Last trend point at or before a date | 03a-fuel-panels |
| — | `trends` | Trends | `fuelLog, weightLog, calTarget: baseTargets.cal` | 03b-fuel-main |
| — | `triceps` | Triceps | Long Head, Lateral Head, Medial Head | 10-shared |
| — | `tryParse` | function | Extracts and JSON-parses the `###PROGRAM_START/END###` block | 02c-train-hub |
| — | `tupleGrams` | function | Tuple + food entry → grams | 03a-fuel-panels |
| — | `type picker onClick` | handler | Selects the goal type and default unit | 01-home |
| — | `ui_fuelTab` | 2123 (via `useHubState`, 36905) | Persisted sub-tab | 03b-fuel-main |
| — | `ui_fuelView` | 2123 (via `useHubState`, 36906) | Persisted view (main/profile/shop) | 03b-fuel-main |
| — | `undoLast` | function | Removes the last plate in the array | 07-misc-gamification |
| — | `up` | handler | Cancel the timer; tap-log if it never fired | 03a-fuel-panels |
| — | `upd` | handler | Patch fuel settings and mirror into local state | 03a-fuel-panels |
| — | `updIng` | handler | Patch one ingredient immutably | 03a-fuel-panels |
| — | `updateProfile` | fn | Merge updates into profile and persist | 08-auth-sync-root |
| — | `useEscape` | hook | Register a close handler on the Escape stack | 02a-train-exercises |
| — | `validateBetaCode` | fn | Local code validity check | 08-auth-sync-root |
| — | `validateBetaCodeRemote` | fn | Local check + `POST /beta-validate` (fail-open) | 08-auth-sync-root |
| — | `validateBetaCodeRemote callback` | handler | Apply the verification result | 06-profile |
| — | `view` | Screen | Reached by | 03b-fuel-main |
| — | `waterGoal` | function | Water target: override, else 35 ml/kg to nearest 50, else 3000 | 03a-fuel-panels |
| — | `weeklyRatePct` | function | Weekly weight change as %/kg from the trend | 03a-fuel-panels |
| — | `weightLog` | via getWeightLog at 27049, 27110, 27193, 27216 | F-GOAL-002, 003, 005, 007 | 01-home |
| — | `weightLog` | 36913 (via `getWeightLog`, 2908) | Bodyweight history | 03b-fuel-main |
| — | `window.LOCKED (object)` | export | Public surface: getters + methods | 08-auth-sync-root |
| — | `withWorkoutIds` | function | Backfill stable ids onto history rows | 02a-train-exercises |
| — | `wmn` | Women's Bar | 35 | 07-misc-gamification |
| — | `workoutNameGroups` | function | Keyword-guess muscle groups from a workout name | 02a-train-exercises |
| — | `yieldFactorFor` | function | First matching yield factor for a name | 03a-fuel-panels |
| — | `yt3_<exercise name>` | `ytSearchVideo` 7068 | **Raw key — no `lk_` prefix**, bypasses `ld`/`sd`, quota warning and sync | 02a-train-exercises |
| — | `ytCreatorFor` | function | Creator name by `exId % 4` | 02a-train-exercises |
| — | `ytSearchVideo` | function | Cached form-video lookup via the worker | 02a-train-exercises |
