# Screenshot index — LOCKED v6 current app (Wave 0D)

Generated 2026-09-08T23:21:19.203Z by `harvest.mjs` (Playwright 1.56 Chromium, viewport 393x852 @2x, `isMobile`, dark colour scheme, 400 ms settle before each shot). All files live in `current/`. Seed = `tests/fixtures/seed-data.json` regenerated relative to today via `seedStorage()`; network routed by `routeNetwork()`; `loading` = worker responses delayed 60 s; `error` = worker/supabase routes aborted (`forceNetworkError`). Line refs are into `input/locked-current-v6.html`.

Naming: `<page>-<state>.png` is the viewport shot on arrival; `-scrolled-N` are further viewport shots with `.lk-scroll` advanced one screen each; `-full` is the whole page taken with the viewport enlarged so `.lk-scroll` un-clamps (the app scrolls its own shell, page-level `fullPage` shows nothing below the fold); other suffixes are sub-tabs, sheets and modals. "How reached" lists the seed override and the selector steps in order.

## Counts per page

| Page | Files | populated | empty | loading | error | other |
|---|---|---|---|---|---|---|
| home | 13 | 8 | 3 | 1 | 1 | 0 |
| progress | 21 | 15 | 3 | 2 | 1 | 0 |
| pr-vault | 9 | 8 | 1 | 0 | 0 | 0 |
| photos | 7 | 4 | 1 | 1 | 1 | 0 |
| cycle | 26 | 18 | 8 | 0 | 0 | 0 |
| train-hub | 13 | 11 | 2 | 0 | 0 | 0 |
| workout-log | 21 | 18 | 1 | 1 | 1 | 0 |
| review | 10 | 7 | 1 | 1 | 1 | 0 |
| workout-detail | 12 | 11 | 1 | 0 | 0 | 0 |
| exercise-library | 13 | 10 | 1 | 1 | 1 | 0 |
| split-builder | 13 | 8 | 3 | 1 | 1 | 0 |
| cardio | 19 | 16 | 3 | 0 | 0 | 0 |
| coach-chat | 10 | 5 | 3 | 1 | 1 | 0 |
| coach-plan | 8 | 7 | 1 | 0 | 0 | 0 |
| coach-setup | 16 | 8 | 4 | 2 | 2 | 0 |
| profile | 8 | 7 | 1 | 0 | 0 | 0 |
| settings | 16 | 14 | 0 | 1 | 1 | 0 |
| shopping-budget | 27 | 18 | 4 | 3 | 2 | 0 |
| global | 21 | 14 | 0 | 0 | 0 | 7 |
| **total** | **283** | | | | | |

Plus 8 flow videos with step logs (below). Total files in `current/`: 342.

## Files

### home (13)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `home-empty-full.png` | empty | full page (viewport 393x1390, .lk-scroll un-clamped) | seed empty |  |
| `home-empty-scrolled-2.png` | empty | scrolled-2 (scrollTop 514px) | seed empty |  |
| `home-empty.png` | empty | (base) | seed empty |  |
| `home-error.png` | error | (base) | seed + insight unhidden + stale lk_proactiveTip; worker aborted before boot → reload with worker aborted | ProactiveTip fetch failed → card collapses (no visible error UI) |
| `home-loading.png` | loading | (base) | seed + insight unhidden + stale lk_proactiveTip; worker delayed 60s | ProactiveTipCard loading (only async block on Home) |
| `home-populated-full.png` | populated | full page (viewport 393x1783, .lk-scroll un-clamped) | seed populated |  |
| `home-populated-gaming.png` | populated | streak badge (gaming layer on) | seed populated + lk_gamingLayer=true |  |
| `home-populated-light-theme.png` | populated | light theme | seed populated + lk_theme=light |  |
| `home-populated-recap.png` | populated | recap | seed populated → Home recap block button |  |
| `home-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated |  |
| `home-populated-scrolled-3.png` | populated | scrolled-3 (scrollTop 907px) | seed populated |  |
| `home-populated-throwback.png` | populated | ThrowbackCard forced (lk_throwbackForce=1) | seed populated + raw lk_throwbackForce=1 |  |
| `home-populated.png` | populated | (base) | seed populated |  |

### progress (21)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `progress-empty-calendar.png` | empty | calendar | seed empty → Home "VIEW PROGRESS" → Progress tab "Goals" → Progress tab "Calendar" |  |
| `progress-empty-goals.png` | empty | goals | seed empty → Home "VIEW PROGRESS" → Progress tab "Goals" |  |
| `progress-empty.png` | empty | (base) | seed empty → Home "VIEW PROGRESS" |  |
| `progress-error-goals-ai.png` | error | goals-ai | seed error → worker route aborted → Home "VIEW PROGRESS" → Progress tab "Goals" → goal row "Bench 75 kg" → "Analyse My Progress" | aiCall onFail L27204 text fallback |
| `progress-loading-goals-add-ai.png` | loading | goals-add-ai | seed; worker delayed 60s; Goals AI suggestion → Home "VIEW PROGRESS" → Progress tab "Goals" → goal row "Bench 75 kg" → "Analyse My Progress" → Back → "NEW GOAL" → AI in add form |  |
| `progress-loading-goals-ai.png` | loading | goals-ai | seed; worker delayed 60s; Goals AI suggestion → Home "VIEW PROGRESS" → Progress tab "Goals" → goal row "Bench 75 kg" → "Analyse My Progress" | aiLoading L27007 |
| `progress-populated-add-lift-picker.png` | populated | Add Featured Lift picker (full-screen view) | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" |  |
| `progress-populated-calendar-prev-month.png` | populated | calendar-prev-month | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" → "Delete Goal" (arm) → Back (goal detail, second Back button) → "Body Fat Log" → "AI Body Fat Estimate" → Back (inner) → "NEW GOAL" → type "Lift PR" → Progress tab "Calendar" → Previous month |  |
| `progress-populated-calendar.png` | populated | calendar | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" → "Delete Goal" (arm) → Back (goal detail, second Back button) → "Body Fat Log" → "AI Body Fat Estimate" → Back (inner) → "NEW GOAL" → type "Lift PR" → Progress tab "Calendar" |  |
| `progress-populated-full.png` | populated | full page (viewport 393x1183, .lk-scroll un-clamped) | seed populated → Home "VIEW PROGRESS" |  |
| `progress-populated-goals-add-form.png` | populated | goals-add-form | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" → "Delete Goal" (arm) → Back (goal detail, second Back button) → "Body Fat Log" → "AI Body Fat Estimate" → Back (inner) → "NEW GOAL" → type "Lift PR" |  |
| `progress-populated-goals-add.png` | populated | new goal: type picker | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" → "Delete Goal" (arm) → Back (goal detail, second Back button) → "Body Fat Log" → "AI Body Fat Estimate" → Back (inner) → "NEW GOAL" |  |
| `progress-populated-goals-bodyfat-ai.png` | populated | goals-bodyfat-ai | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" → "Delete Goal" (arm) → Back (goal detail, second Back button) → "Body Fat Log" → "AI Body Fat Estimate" | bfAiLoading → canned reply |
| `progress-populated-goals-bodyfat-sheet.png` | populated | goals-bodyfat-sheet | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" → "Delete Goal" (arm) → Back (goal detail, second Back button) → "Body Fat Log" |  |
| `progress-populated-goals-delete-armed.png` | populated | goals-delete-armed | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" → "Delete Goal" (arm) |  |
| `progress-populated-goals-detail-analysis.png` | populated | goals-detail-analysis | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal → "SAVE CHANGES" (returns to goals list) → goal row again → "Analyse My Progress" | AI analysis reply (canned) |
| `progress-populated-goals-detail.png` | populated | goals-detail | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" |  |
| `progress-populated-goals-edit.png` | populated | goals-edit | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" → goal row "Bench 75 kg" → Edit goal |  |
| `progress-populated-goals.png` | populated | goals | seed populated → Home "VIEW PROGRESS" → "ADD LIFT" → Back → Progress tab "Goals" |  |
| `progress-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 307px) | seed populated → Home "VIEW PROGRESS" |  |
| `progress-populated.png` | populated | (base) | seed populated → Home "VIEW PROGRESS" |  |

### pr-vault (9)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `pr-vault-empty.png` | empty | (base) | seed empty → Home "VIEW PROGRESS" → Progress tab "PR Vault" |  |
| `pr-vault-populated-detail-full.png` | populated | full page (viewport 393x1011, .lk-scroll un-clamped) | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" → lift row "Bench Press" |  |
| `pr-vault-populated-detail-range.png` | populated | detail-range | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" → lift row "Bench Press" → range 3M |  |
| `pr-vault-populated-detail-scrolled-2.png` | populated | scrolled-2 (scrollTop 135px) | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" → lift row "Bench Press" |  |
| `pr-vault-populated-detail.png` | populated | detail | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" → lift row "Bench Press" |  |
| `pr-vault-populated-full.png` | populated | full page (viewport 393x1562, .lk-scroll un-clamped) | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" |  |
| `pr-vault-populated-log-pr.png` | populated | log-pr | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" → lift row "Bench Press" → range 3M → Back → "LOG A PR WITHOUT A WORKOUT" |  |
| `pr-vault-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 686px) | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" |  |
| `pr-vault-populated.png` | populated | PR list (default tab prs) | seed populated → Home "VIEW PROGRESS" → Progress tab "PR Vault" |  |

### photos (7)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `photos-empty.png` | empty | (base) | seed empty → Home "VIEW PROGRESS" → Progress tab "Photos" |  |
| `photos-error.png` | error | (base) | seed error → worker route aborted → Home "VIEW PROGRESS" → Progress tab "Photos" → tap first photo thumbnail → "Analyse Physique" in lightbox | /analyze-physique aborted |
| `photos-loading.png` | loading | (base) | seed; worker delayed 60s; "Analyse Physique" → Home "VIEW PROGRESS" → Progress tab "Photos" → tap first photo thumbnail → "Analyse Physique" in lightbox | analysing while POST /analyze-physique pending |
| `photos-populated-full.png` | populated | full page (viewport 393x905, .lk-scroll un-clamped) | seed populated → Home "VIEW PROGRESS" → Progress tab "Photos" |  |
| `photos-populated-lightbox.png` | populated | lightbox | seed populated → Home "VIEW PROGRESS" → Progress tab "Photos" → tap first photo thumbnail |  |
| `photos-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 29px) | seed populated → Home "VIEW PROGRESS" → Progress tab "Photos" |  |
| `photos-populated.png` | populated | (base) | seed populated → Home "VIEW PROGRESS" → Progress tab "Photos" |  |

### cycle (26)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `cycle-empty-full.png` | empty | full page (viewport 393x1395, .lk-scroll un-clamped) | seed + lk_mcDays={} → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) |  |
| `cycle-empty-onboarding-step2.png` | empty | onboarding-step2 | seed with lk_mcProfile removed (McOnboarding) → Home "TRACK CYCLE" (setup card) → onboarding next |  |
| `cycle-empty-onboarding-step3.png` | empty | onboarding-step3 | seed with lk_mcProfile removed (McOnboarding) → Home "TRACK CYCLE" (setup card) → onboarding next → onboarding next |  |
| `cycle-empty-onboarding-step4.png` | empty | onboarding-step4 | seed with lk_mcProfile removed (McOnboarding) → Home "TRACK CYCLE" (setup card) → onboarding next → onboarding next → onboarding next |  |
| `cycle-empty-onboarding-step5.png` | empty | onboarding-step5 | seed with lk_mcProfile removed (McOnboarding) → Home "TRACK CYCLE" (setup card) → onboarding next → onboarding next → onboarding next → onboarding next |  |
| `cycle-empty-onboarding.png` | empty | onboarding | seed with lk_mcProfile removed (McOnboarding) → Home "TRACK CYCLE" (setup card) |  |
| `cycle-empty-scrolled-2.png` | empty | scrolled-2 (scrollTop 519px) | seed + lk_mcDays={} → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) |  |
| `cycle-empty.png` | empty | (base) | seed + lk_mcDays={} → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) |  |
| `cycle-populated-calendar.png` | populated | calendar | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" |  |
| `cycle-populated-education-full.png` | populated | full page (viewport 393x2258, .lk-scroll un-clamped) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) |  |
| `cycle-populated-education-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) |  |
| `cycle-populated-education-scrolled-3.png` | populated | scrolled-3 (scrollTop 1382px) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) |  |
| `cycle-populated-education.png` | populated | education | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) |  |
| `cycle-populated-full.png` | populated | full page (viewport 393x1395, .lk-scroll un-clamped) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) |  |
| `cycle-populated-log-more-full.png` | populated | full page (viewport 393x939, .lk-scroll un-clamped) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" |  |
| `cycle-populated-log-more-scrolled-2.png` | populated | scrolled-2 (scrollTop 63px) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" |  |
| `cycle-populated-log-more.png` | populated | log-more | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" |  |
| `cycle-populated-log-sheet-full.png` | populated | full page (viewport 393x939, .lk-scroll un-clamped) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) |  |
| `cycle-populated-log-sheet-scrolled-2.png` | populated | scrolled-2 (scrollTop 63px) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) |  |
| `cycle-populated-log-sheet.png` | populated | log-sheet | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) |  |
| `cycle-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 519px) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) |  |
| `cycle-populated-settings-full.png` | populated | full page (viewport 393x2258, .lk-scroll un-clamped) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) → Cycle settings |  |
| `cycle-populated-settings-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) → Cycle settings |  |
| `cycle-populated-settings-scrolled-3.png` | populated | scrolled-3 (scrollTop 1382px) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) → Cycle settings |  |
| `cycle-populated-settings.png` | populated | settings | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) → "Show calendar" → "Show cycle" → today card "Symptoms" (McLogSheet) → "Done" (close sheet) → today card "More" → "Done" → "THE SCIENCE" (eduOpen) → Cycle settings |  |
| `cycle-populated.png` | populated | (base) | seed populated → Home CycleTrackerCard "LOG" (last Home block, under the nav → DOM click) |  |

### train-hub (13)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `train-hub-empty-history.png` | empty | history | seed empty → Nav Train → Train tab "History" |  |
| `train-hub-empty.png` | empty | (base) | seed empty → Nav Train |  |
| `train-hub-populated-day-modal.png` | populated | day-modal | seed populated → Nav Train → Expand split chevron → split card footer "Start" (sibling before Edit) |  |
| `train-hub-populated-full.png` | populated | full page (viewport 393x1804, .lk-scroll un-clamped) | seed populated → Nav Train |  |
| `train-hub-populated-history-full.png` | populated | full page (viewport 393x2701, .lk-scroll un-clamped) | seed populated → Nav Train → Expand split chevron → split card footer "Start" (sibling before Edit) → Close → Train tab "History" |  |
| `train-hub-populated-history-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Train → Expand split chevron → split card footer "Start" (sibling before Edit) → Close → Train tab "History" |  |
| `train-hub-populated-history-scrolled-3.png` | populated | scrolled-3 (scrollTop 1402px) | seed populated → Nav Train → Expand split chevron → split card footer "Start" (sibling before Edit) → Close → Train tab "History" |  |
| `train-hub-populated-history-scrolled-4.png` | populated | scrolled-4 (scrollTop 1825px) | seed populated → Nav Train → Expand split chevron → split card footer "Start" (sibling before Edit) → Close → Train tab "History" |  |
| `train-hub-populated-history.png` | populated | history | seed populated → Nav Train → Expand split chevron → split card footer "Start" (sibling before Edit) → Close → Train tab "History" |  |
| `train-hub-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Train |  |
| `train-hub-populated-scrolled-3.png` | populated | scrolled-3 (scrollTop 928px) | seed populated → Nav Train |  |
| `train-hub-populated-split-expanded.png` | populated | split-expanded | seed populated → Nav Train → Expand split chevron |  |
| `train-hub-populated.png` | populated | (base) | seed populated → Nav Train |  |

### workout-log (21)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `workout-log-empty.png` | empty | (base) | seed + lk_activeWorkout {name:"Quick Workout", exIds:[]} (Resume → empty log) → Resume dialog "Resume" |  |
| `workout-log-error.png` | error | (base) | seed error → worker route aborted → Resume dialog "Resume" → "AI Rec" | aiCall onFail |
| `workout-log-loading.png` | loading | (base) | seed + active workout; worker delayed; AI set recommendation → Resume dialog "Resume" → "AI Rec" | aiRecBusy |
| `workout-log-populated-action-sheet.png` | populated | action-sheet | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms |  |
| `workout-log-populated-add-exercise.png` | populated | add-exercise | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" → Close → "+ Block" → Escape → "Add Set" → "Add Exercise" |  |
| `workout-log-populated-add-set.png` | populated | add-set | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" → Close → "+ Block" → Escape → "Add Set" |  |
| `workout-log-populated-banner-home.png` | populated | active-workout banner on Home | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" → Close → "+ Block" → Escape → "Add Set" → "Add Exercise" → Back → "Discard" (arms confirm toast) → Nav Home while workout active |  |
| `workout-log-populated-block-modal.png` | populated | block-modal | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" → Close → "+ Block" |  |
| `workout-log-populated-discard-confirm.png` | populated | discard-confirm | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" → Close → "+ Block" → Escape → "Add Set" → "Add Exercise" → Back → "Discard" (arms confirm toast) | lkConfirm toast "Tap Discard again" |
| `workout-log-populated-exercise-detail-full.png` | populated | full page (viewport 393x1080, .lk-scroll un-clamped) | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" |  |
| `workout-log-populated-exercise-detail-scrolled-2.png` | populated | scrolled-2 (scrollTop 204px) | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" |  |
| `workout-log-populated-exercise-detail.png` | populated | exercise-detail | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" → Close → long-press exercise header 900ms → Escape → long-press exercise header → "Info & notes" |  |
| `workout-log-populated-full.png` | populated | full page (viewport 393x891, .lk-scroll un-clamped) | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" |  |
| `workout-log-populated-numpad-reps.png` | populated | numpad-reps | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell |  |
| `workout-log-populated-numpad.png` | populated | numpad | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell |  |
| `workout-log-populated-platecalc.png` | populated | platecalc | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" |  |
| `workout-log-populated-rest-settings.png` | populated | rest-settings | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools → "Plate Calc" → Escape → Workout tools → "Rest Timer" |  |
| `workout-log-populated-resume-dialog.png` | populated | Resume Workout? dialog (boot) | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) |  |
| `workout-log-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 15px) | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" |  |
| `workout-log-populated-tools.png` | populated | tools | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" → Set 3 weight cell → NumPad CANCEL → Set 3 reps cell → NumPad CANCEL → Workout tools |  |
| `workout-log-populated.png` | populated | (base) | seed + lk_activeWorkout/Rows/Sec (Resume dialog → Resume) → Resume dialog "Resume" |  |

### review (10)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `review-empty.png` | empty | (base) | seed + active workout with no done sets → Resume → Finish → Resume dialog "Resume" → "Finish" |  |
| `review-error.png` | error | (base) | active workout → Finish → reflect → AI insight with worker aborted → worker route aborted → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" → "GET AI COACH INSIGHT" |  |
| `review-loading.png` | loading | (base) | active workout → Finish → reflect → AI insight with worker delayed → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" → "GET AI COACH INSIGHT" |  |
| `review-populated-ai-insight.png` | populated | ai-insight | seed + active workout (2 done sets) → Resume → Finish → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" → "GET AI COACH INSIGHT" |  |
| `review-populated-discard-armed.png` | populated | discard-armed | seed + active workout (2 done sets) → Resume → Finish → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" → "GET AI COACH INSIGHT" → "Discard" (arm) |  |
| `review-populated-reflect-full.png` | populated | full page (viewport 393x932, .lk-scroll un-clamped) | seed + active workout (2 done sets) → Resume → Finish → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" |  |
| `review-populated-reflect-rated.png` | populated | reflect-rated | seed + active workout (2 done sets) → Resume → Finish → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" |  |
| `review-populated-reflect-scrolled-2.png` | populated | scrolled-2 (scrollTop 56px) | seed + active workout (2 done sets) → Resume → Finish → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" |  |
| `review-populated-reflect.png` | populated | reflect | seed + active workout (2 done sets) → Resume → Finish → Resume dialog "Resume" → "Finish" → "HOW DID IT FEEL?" |  |
| `review-populated.png` | populated | (base) | seed + active workout (2 done sets) → Resume → Finish → Resume dialog "Resume" → "Finish" |  |

### workout-detail (12)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `workout-detail-empty.png` | empty | (base) | seed + prepended history entry with exercises:[] → Home recent row "Empty Session" |  |
| `workout-detail-populated-convert-modal.png` | populated | convert-modal | seed populated → Home recent row "PPL - Legs" → "Edit" → SAVE (exit edit) → "Delete" (arm) → "Convert" |  |
| `workout-detail-populated-convert-new.png` | populated | convert-new | seed populated → Home recent row "PPL - Legs" → "Edit" → SAVE (exit edit) → "Delete" (arm) → "Convert" → mode new |  |
| `workout-detail-populated-delete-armed.png` | populated | delete-armed | seed populated → Home recent row "PPL - Legs" → "Edit" → SAVE (exit edit) → "Delete" (arm) |  |
| `workout-detail-populated-edit-full.png` | populated | full page (viewport 393x2053, .lk-scroll un-clamped) | seed populated → Home recent row "PPL - Legs" → "Edit" |  |
| `workout-detail-populated-edit-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Home recent row "PPL - Legs" → "Edit" |  |
| `workout-detail-populated-edit-scrolled-3.png` | populated | scrolled-3 (scrollTop 1177px) | seed populated → Home recent row "PPL - Legs" → "Edit" |  |
| `workout-detail-populated-edit.png` | populated | edit | seed populated → Home recent row "PPL - Legs" → "Edit" |  |
| `workout-detail-populated-from-train.png` | populated | from-train | seed → Train → History tab → row → Nav Train → Train tab "History" → history row "PPL - Legs" |  |
| `workout-detail-populated-full.png` | populated | full page (viewport 393x1308, .lk-scroll un-clamped) | seed populated → Home recent row "PPL - Legs" |  |
| `workout-detail-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 432px) | seed populated → Home recent row "PPL - Legs" |  |
| `workout-detail-populated.png` | populated | (base) | seed populated → Home recent row "PPL - Legs" |  |

### exercise-library (13)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `exercise-library-empty.png` | empty | (base) | seed → Library → search "zzqx" (no results) → Nav Train → Train tab "Library" → search "zzqx" |  |
| `exercise-library-error.png` | error | (base) | seed → Library → exercise → detail modal with worker aborted → worker route aborted → Nav Train → Train tab "Library" → search → exercise |  |
| `exercise-library-loading.png` | loading | (base) | seed → Library → exercise → detail modal with /exercise-detail delayed → Nav Train → Train tab "Library" → search → exercise |  |
| `exercise-library-populated-create-custom.png` | populated | create-custom | seed populated → Nav Train → Train tab "Library" → search "bench" → result "Barbell Bench Press" → Close → Clear search → create custom opener |  |
| `exercise-library-populated-detail-modal-full.png` | populated | full page (viewport 393x1096, .lk-scroll un-clamped) | seed populated → Nav Train → Train tab "Library" → search "bench" → result "Barbell Bench Press" |  |
| `exercise-library-populated-detail-modal-scrolled-2.png` | populated | scrolled-2 (scrollTop 220px) | seed populated → Nav Train → Train tab "Library" → search "bench" → result "Barbell Bench Press" |  |
| `exercise-library-populated-detail-modal.png` | populated | detail-modal | seed populated → Nav Train → Train tab "Library" → search "bench" → result "Barbell Bench Press" |  |
| `exercise-library-populated-full.png` | populated | full page (viewport 393x1156, .lk-scroll un-clamped) | seed populated → Nav Train → Train tab "Library" |  |
| `exercise-library-populated-group.png` | populated | group | seed populated → Nav Train → Train tab "Library" → search "bench" → result "Barbell Bench Press" → Close → Clear search → create custom opener → Back → group "Chest" |  |
| `exercise-library-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 280px) | seed populated → Nav Train → Train tab "Library" |  |
| `exercise-library-populated-search.png` | populated | search | seed populated → Nav Train → Train tab "Library" → search "bench" |  |
| `exercise-library-populated-subgroup.png` | populated | subgroup | seed populated → Nav Train → Train tab "Library" → search "bench" → result "Barbell Bench Press" → Close → Clear search → create custom opener → Back → group "Chest" → subgroup "Mid Chest" |  |
| `exercise-library-populated.png` | populated | (base) | seed populated → Nav Train → Train tab "Library" |  |

### split-builder (13)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `split-builder-empty-ai.png` | empty | ai | seed empty → Train → "Build Manually" (create) → Nav Train → "Build Manually" → name → day name → "Add" day → Back → AI split builder opener (empty state) |  |
| `split-builder-empty-day-no-exercises.png` | empty | day-no-exercises | seed empty → Train → "Build Manually" (create) → Nav Train → "Build Manually" → name → day name → "Add" day |  |
| `split-builder-empty.png` | empty | (base) | seed empty → Train → "Build Manually" (create) → Nav Train → "Build Manually" |  |
| `split-builder-error.png` | error | (base) | seed → Train → AI Builder → "Chat with AI Coach" with worker aborted → worker route aborted → Nav Train → AI split builder opener → "Chat with AI Coach" card | first AI question request aborted (fetch catch after L13993) |
| `split-builder-loading.png` | loading | (base) | seed → Train → AI Builder → "Chat with AI Coach" with worker delayed → Nav Train → AI split builder opener → "Chat with AI Coach" card | aiLoading while the first AI question is pending (Send disabled) |
| `split-builder-populated-ai-photo.png` | populated | ai-photo | seed populated → Nav Train → split card "Edit" → Rename day → Escape → "+ Exercise" (pick view) → Back → Back to hub → AI split builder opener → "Import from Photo" card |  |
| `split-builder-populated-ai.png` | populated | ai | seed populated → Nav Train → split card "Edit" → Rename day → Escape → "+ Exercise" (pick view) → Back → Back to hub → AI split builder opener |  |
| `split-builder-populated-full.png` | populated | full page (viewport 393x1806, .lk-scroll un-clamped) | seed populated → Nav Train → split card "Edit" |  |
| `split-builder-populated-pick.png` | populated | pick | seed populated → Nav Train → split card "Edit" → Rename day → Escape → "+ Exercise" (pick view) |  |
| `split-builder-populated-rename-day.png` | populated | rename-day | seed populated → Nav Train → split card "Edit" → Rename day |  |
| `split-builder-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Train → split card "Edit" |  |
| `split-builder-populated-scrolled-3.png` | populated | scrolled-3 (scrollTop 930px) | seed populated → Nav Train → split card "Edit" |  |
| `split-builder-populated.png` | populated | (base) | seed populated → Nav Train → split card "Edit" |  |

### cardio (19)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `cardio-empty-favorites.png` | empty | favorites | seed empty → Nav Train → TRAIN header "Cardio" → tab "History" → tab "Favorites" |  |
| `cardio-empty-history.png` | empty | history | seed empty → Nav Train → TRAIN header "Cardio" → tab "History" |  |
| `cardio-empty.png` | empty | (base) | seed empty → Nav Train → TRAIN header "Cardio" |  |
| `cardio-populated-favorites.png` | populated | favorites | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity → tab "History" → tab "Favorites" |  |
| `cardio-populated-full.png` | populated | full page (viewport 393x947, .lk-scroll un-clamped) | seed populated → Nav Train → TRAIN header "Cardio" |  |
| `cardio-populated-history-full.png` | populated | full page (viewport 393x1134, .lk-scroll un-clamped) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity → tab "History" |  |
| `cardio-populated-history-scrolled-2.png` | populated | scrolled-2 (scrollTop 258px) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity → tab "History" |  |
| `cardio-populated-history.png` | populated | history | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity → tab "History" |  |
| `cardio-populated-log-full.png` | populated | full page (viewport 393x2700, .lk-scroll un-clamped) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" |  |
| `cardio-populated-log-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" |  |
| `cardio-populated-log-scrolled-3.png` | populated | scrolled-3 (scrollTop 1402px) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" |  |
| `cardio-populated-log-scrolled-4.png` | populated | scrolled-4 (scrollTop 1824px) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" |  |
| `cardio-populated-log-step2-full.png` | populated | full page (viewport 393x1923, .lk-scroll un-clamped) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity |  |
| `cardio-populated-log-step2-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity |  |
| `cardio-populated-log-step2-scrolled-3.png` | populated | scrolled-3 (scrollTop 1047px) | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity |  |
| `cardio-populated-log-step2.png` | populated | log-step2 | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" → pick activity |  |
| `cardio-populated-log.png` | populated | log | seed populated → Nav Train → TRAIN header "Cardio" → tab "Log" |  |
| `cardio-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 71px) | seed populated → Nav Train → TRAIN header "Cardio" |  |
| `cardio-populated.png` | populated | (base) | seed populated → Nav Train → TRAIN header "Cardio" |  |

### coach-chat (10)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `coach-chat-empty-full.png` | empty | full page (viewport 393x917, .lk-scroll un-clamped) | seed + lk_coachLastMsgs=[] → Nav Coach |  |
| `coach-chat-empty-scrolled-2.png` | empty | scrolled-2 (scrollTop 41px) | seed + lk_coachLastMsgs=[] → Nav Coach |  |
| `coach-chat-empty.png` | empty | (base) | seed + lk_coachLastMsgs=[] → Nav Coach |  |
| `coach-chat-error.png` | error | (base) | empty chat → send with worker aborted → worker route aborted → Nav Coach → type → Send | error bubble with retry |
| `coach-chat-loading.png` | loading | (base) | empty chat → send with worker delayed 60s → Nav Coach → type → Send | typing indicator + Stop the reply button |
| `coach-chat-populated-checkin.png` | populated | checkin | seed populated → Nav Coach → type message → Send → Coach tab "Check-In" |  |
| `coach-chat-populated-new-chat-confirm.png` | populated | new-chat-confirm | seed populated → Nav Coach → type message → Send → Coach tab "Check-In" → Coach tab "Chat" → "New chat" |  |
| `coach-chat-populated-reply.png` | populated | reply | seed populated → Nav Coach → type message → Send | canned reply (keyword bench) |
| `coach-chat-populated-typed.png` | populated | typed | seed populated → Nav Coach → type message |  |
| `coach-chat-populated.png` | populated | (base) | seed populated → Nav Coach |  |

### coach-plan (8)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `coach-plan-empty.png` | empty | (base) | seed + lk_coachPlan removed → Nav Coach → Coach tab "Plan" |  |
| `coach-plan-populated-delete-armed.png` | populated | delete-armed | seed populated → Nav Coach → Coach tab "Plan" → phase row "Build" → Delete this plan (arm) |  |
| `coach-plan-populated-full.png` | populated | full page (viewport 393x985, .lk-scroll un-clamped) | seed populated → Nav Coach → Coach tab "Plan" |  |
| `coach-plan-populated-phase-open-full.png` | populated | full page (viewport 393x985, .lk-scroll un-clamped) | seed populated → Nav Coach → Coach tab "Plan" → phase row "Build" |  |
| `coach-plan-populated-phase-open-scrolled-2.png` | populated | scrolled-2 (scrollTop 109px) | seed populated → Nav Coach → Coach tab "Plan" → phase row "Build" |  |
| `coach-plan-populated-phase-open.png` | populated | phase-open | seed populated → Nav Coach → Coach tab "Plan" → phase row "Build" |  |
| `coach-plan-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 109px) | seed populated → Nav Coach → Coach tab "Plan" |  |
| `coach-plan-populated.png` | populated | (base) | seed populated → Nav Coach → Coach tab "Plan" |  |

### coach-setup (16)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `coach-setup-empty-full.png` | empty | full page (viewport 393x1830, .lk-scroll un-clamped) | seed + empty memory/instructions/style → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-empty-scrolled-2.png` | empty | scrolled-2 (scrollTop 504px) | seed + empty memory/instructions/style → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-empty-scrolled-3.png` | empty | scrolled-3 (scrollTop 954px) | seed + empty memory/instructions/style → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-empty.png` | empty | (base) | seed + empty memory/instructions/style → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-error.png` | error | (base) | Setup → interview → answer chips → worker aborted → error phase → worker route aborted → Nav Coach → Coach tab "Setup" → interview → answered 8 questions |  |
| `coach-setup-populated-interview-answered.png` | error | interview after first answer | Setup → interview → answer chips → worker aborted → error phase → worker route aborted → Nav Coach → Coach tab "Setup" → interview |  |
| `coach-setup-loading.png` | loading | (base) | Setup → interview → answer chips → "writing" with worker delayed → Nav Coach → Coach tab "Setup" → interview → answered 6 questions |  |
| `coach-setup-populated-interview-answered.png` | loading | interview after first answer | Setup → interview → answer chips → "writing" with worker delayed → Nav Coach → Coach tab "Setup" → interview |  |
| `coach-setup-populated-add-memory.png` | populated | add-memory | seed populated → Nav Coach → Coach tab "Setup" → Rename your coach → Escape → "Let the coach interview you" → Close the interview → Add a memory |  |
| `coach-setup-populated-full.png` | populated | full page (viewport 393x1907, .lk-scroll un-clamped) | seed populated → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-populated-interview.png` | populated | interview | seed populated → Nav Coach → Coach tab "Setup" → Rename your coach → Escape → "Let the coach interview you" |  |
| `coach-setup-populated-rename-coach.png` | populated | rename-coach | seed populated → Nav Coach → Coach tab "Setup" → Rename your coach |  |
| `coach-setup-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 504px) | seed populated → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-populated-scrolled-3.png` | populated | scrolled-3 (scrollTop 1008px) | seed populated → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-populated-scrolled-4.png` | populated | scrolled-4 (scrollTop 1031px) | seed populated → Nav Coach → Coach tab "Setup" |  |
| `coach-setup-populated.png` | populated | (base) | seed populated → Nav Coach → Coach tab "Setup" |  |

### profile (8)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `profile-empty.png` | empty | (base) | seed empty → Nav Profile |  |
| `profile-populated-badges-full.png` | populated | full page (viewport 393x1309, .lk-scroll un-clamped) | seed + lk_gamingLayer=true → Nav Profile |  |
| `profile-populated-badges-scrolled-2.png` | populated | scrolled-2 (scrollTop 433px) | seed + lk_gamingLayer=true → Nav Profile |  |
| `profile-populated-badges.png` | populated | badges | seed + lk_gamingLayer=true → Nav Profile |  |
| `profile-populated-full.png` | populated | full page (viewport 393x1008, .lk-scroll un-clamped) | seed populated → Nav Profile |  |
| `profile-populated-lbs.png` | populated | lbs | seed + useKg=false → Nav Profile |  |
| `profile-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 132px) | seed populated → Nav Profile |  |
| `profile-populated.png` | populated | (base) | seed populated → Nav Profile |  |

### settings (16)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `settings-error.png` | error | (base) | Settings → beta "Enter invite code" → Verify with worker aborted → worker route aborted → Nav Profile → Profile "Settings" → beta code → Verify | settingsBetaErr after /beta-validate abort |
| `settings-loading.png` | loading | (base) | Settings → beta Verify with worker delayed → Nav Profile → Profile "Settings" → beta code → Verify | beta Verify pending (guest: sync/password/delete loading are signed-in only) |
| `settings-populated-full.png` | populated | full page (viewport 393x3989, .lk-scroll un-clamped) | seed populated → Nav Profile → Profile "Settings" |  |
| `settings-populated-layout-editor-full.png` | populated | full page (viewport 393x1690, .lk-scroll un-clamped) | seed populated → Nav Profile → Profile "Settings" → "CUSTOMIZE" |  |
| `settings-populated-layout-editor-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Profile → Profile "Settings" → "CUSTOMIZE" |  |
| `settings-populated-layout-editor-scrolled-3.png` | populated | scrolled-3 (scrollTop 814px) | seed populated → Nav Profile → Profile "Settings" → "CUSTOMIZE" |  |
| `settings-populated-layout-editor.png` | populated | layout-editor | seed populated → Nav Profile → Profile "Settings" → "CUSTOMIZE" |  |
| `settings-populated-light-theme.png` | populated | light-theme | seed + lk_theme=light → Nav Profile → Profile "Settings" |  |
| `settings-populated-reset-armed.png` | populated | reset-armed | seed populated → Nav Profile → Profile "Settings" → "CUSTOMIZE" → Back → "Switch to LBS" → "Switch to KG" → RESET (arm, first tap) |  |
| `settings-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Profile → Profile "Settings" |  |
| `settings-populated-scrolled-3.png` | populated | scrolled-3 (scrollTop 1402px) | seed populated → Nav Profile → Profile "Settings" |  |
| `settings-populated-scrolled-4.png` | populated | scrolled-4 (scrollTop 2103px) | seed populated → Nav Profile → Profile "Settings" |  |
| `settings-populated-scrolled-5.png` | populated | scrolled-5 (scrollTop 2804px) | seed populated → Nav Profile → Profile "Settings" |  |
| `settings-populated-scrolled-6.png` | populated | scrolled-6 (scrollTop 3113px) | seed populated → Nav Profile → Profile "Settings" |  |
| `settings-populated-units-lbs.png` | populated | units-lbs | seed populated → Nav Profile → Profile "Settings" → "CUSTOMIZE" → Back → "Switch to LBS" |  |
| `settings-populated.png` | populated | (base) | seed populated → Nav Profile → Profile "Settings" |  |

### shopping-budget (27)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `shopping-budget-empty-budget.png` | empty | budget | seed empty → Nav Fuel → Fuel [aria-label="Shopping and budget"] → Shop tab "Pantry" → Shop tab "My Stores" → Shop tab "Budget" |  |
| `shopping-budget-empty-pantry.png` | empty | pantry | seed empty → Nav Fuel → Fuel [aria-label="Shopping and budget"] → Shop tab "Pantry" |  |
| `shopping-budget-empty-stores.png` | empty | stores | seed empty → Nav Fuel → Fuel [aria-label="Shopping and budget"] → Shop tab "Pantry" → Shop tab "My Stores" |  |
| `shopping-budget-empty.png` | empty | (base) | seed empty → Nav Fuel → Fuel [aria-label="Shopping and budget"] |  |
| `shopping-budget-error-budget-swaps.png` | error | budget-swaps | seed → list input with /store-search aborted; Budget swaps aborted → worker route aborted → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type "Salmon" → Shop tab "Budget" → swaps trigger |  |
| `shopping-budget-error.png` | error | (base) | seed → list input with /store-search aborted; Budget swaps aborted → worker route aborted → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type "Salmon" | store search failed silently (catch) |
| `shopping-budget-loading-budget-receipts.png` | loading | receipts history view | seed (store enabled) → type in list input → /store-search pending; Budget swaps/compare pending → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type "Salmon" (fires /store-search) → Shop tab "Budget" → swaps trigger → "Receipts" |  |
| `shopping-budget-loading-budget-swaps.png` | loading | budget-swaps | seed (store enabled) → type in list input → /store-search pending; Budget swaps/compare pending → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type "Salmon" (fires /store-search) → Shop tab "Budget" → swaps trigger |  |
| `shopping-budget-loading.png` | loading | (base) | seed (store enabled) → type in list input → /store-search pending; Budget swaps/compare pending → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type "Salmon" (fires /store-search) | storeLoading |
| `shopping-budget-populated-add-suggestions.png` | populated | typed item with store suggestions | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" |  |
| `shopping-budget-populated-budget-add-purchase.png` | populated | budget-add-purchase | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" → Shop tab "My Stores" → Shop tab "Budget" → Budget "Edit" target → Cancel → manual purchase opener |  |
| `shopping-budget-populated-budget-edit-target.png` | populated | budget-edit-target | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" → Shop tab "My Stores" → Shop tab "Budget" → Budget "Edit" target |  |
| `shopping-budget-populated-budget-full.png` | populated | full page (viewport 393x983, .lk-scroll un-clamped) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" → Shop tab "My Stores" → Shop tab "Budget" |  |
| `shopping-budget-populated-budget-month.png` | populated | budget-month | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" → Shop tab "My Stores" → Shop tab "Budget" → Budget "Edit" target → Cancel → manual purchase opener → Escape → history "Month" |  |
| `shopping-budget-populated-budget-scrolled-2.png` | populated | scrolled-2 (scrollTop 107px) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" → Shop tab "My Stores" → Shop tab "Budget" |  |
| `shopping-budget-populated-budget.png` | populated | budget | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" → Shop tab "My Stores" → Shop tab "Budget" |  |
| `shopping-budget-populated-export.png` | populated | export | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" |  |
| `shopping-budget-populated-full.png` | populated | full page (viewport 393x2234, .lk-scroll un-clamped) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] |  |
| `shopping-budget-populated-merge-dialog.png` | populated | merge-dialog | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) |  |
| `shopping-budget-populated-pantry-full.png` | populated | full page (viewport 393x989, .lk-scroll un-clamped) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" |  |
| `shopping-budget-populated-pantry-scrolled-2.png` | populated | scrolled-2 (scrollTop 113px) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" |  |
| `shopping-budget-populated-pantry.png` | populated | pantry | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" |  |
| `shopping-budget-populated-scrolled-2.png` | populated | scrolled-2 (scrollTop 701px) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] |  |
| `shopping-budget-populated-scrolled-3.png` | populated | scrolled-3 (scrollTop 1358px) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] |  |
| `shopping-budget-populated-shop-at-sheet.png` | populated | shop-at-sheet | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" |  |
| `shopping-budget-populated-stores.png` | populated | stores | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] → type duplicate "Eggs" → Enter (addItem) → Add Separate → "Export" → Escape → "Shop at" → Escape → Shop tab "Pantry" → Shop tab "My Stores" |  |
| `shopping-budget-populated.png` | populated | (base) | seed populated → Nav Fuel → Fuel [aria-label="Shopping and budget"] |  |

### global (21)

| File | State | Sub-view | How reached | Note |
|---|---|---|---|---|
| `global-coldstart-after-guest.png` | cold-start | global-coldstart-after-guest | localStorage empty (cold start) → "Continue without account" → "CONTINUE AS GUEST" (reload) | enterGuestMode seeds Athlete profile + reload → Home with TutorialOverlay |
| `global-coldstart-auth-overlay.png` | cold-start | pre-React auth overlay | localStorage empty (cold start) |  |
| `global-coldstart-guest-modal.png` | cold-start | global-coldstart-guest-modal | localStorage empty (cold start) → "Continue without account" |  |
| `global-onboarding-ai-program.png` | onboarding | ai-program | only lk_guestMode=1 (no profile) → React Onboarding → GET STARTED → name → username → CONTINUE → CONTINUE |  |
| `global-onboarding-name.png` | onboarding | name | only lk_guestMode=1 (no profile) → React Onboarding → GET STARTED |  |
| `global-onboarding-splash.png` | onboarding | splash | only lk_guestMode=1 (no profile) → React Onboarding |  |
| `global-onboarding-units.png` | onboarding | units | only lk_guestMode=1 (no profile) → React Onboarding → GET STARTED → name → username → CONTINUE |  |
| `global-nav.png` | populated | Nav tab bar (element crop) | seed → Home |  |
| `global-saved-toast.png` | populated | "Saved" toast on Home after save (L57987) | active workout → Resume → Finish → Save without reflection → Resume dialog "Resume" → Finish → Save without reflection |  |
| `global-toast.png` | populated | global-toast | seed populated → tap voice button → Escape → Nav Train → Edit split → "Add" day with blank name → toast | showToast "Name the day first…" (L9129) |
| `global-tutorial-intro.png` | populated | TutorialOverlay intro | seed + lk_tutorialSeen removed |  |
| `global-tutorial-step-1.png` | populated | global-tutorial-step-1 | seed + lk_tutorialSeen removed → tutorial advance |  |
| `global-tutorial-step-2.png` | populated | global-tutorial-step-2 | seed + lk_tutorialSeen removed → tutorial advance → tutorial advance |  |
| `global-tutorial-step-3.png` | populated | global-tutorial-step-3 | seed + lk_tutorialSeen removed → tutorial advance → tutorial advance → tutorial advance |  |
| `global-tutorial-step-4.png` | populated | global-tutorial-step-4 | seed + lk_tutorialSeen removed → tutorial advance → tutorial advance → tutorial advance → tutorial advance |  |
| `global-tutorial-step-5.png` | populated | global-tutorial-step-5 | seed + lk_tutorialSeen removed → tutorial advance → tutorial advance → tutorial advance → tutorial advance → tutorial advance |  |
| `global-tutorial-step-6.png` | populated | global-tutorial-step-6 | seed + lk_tutorialSeen removed → tutorial advance → tutorial advance → tutorial advance → tutorial advance → tutorial advance → tutorial advance |  |
| `global-tutorial-step-7.png` | populated | global-tutorial-step-7 | seed + lk_tutorialSeen removed → tutorial advance → tutorial advance → tutorial advance → tutorial advance → tutorial advance → tutorial advance → tutorial advance |  |
| `global-voice-button-active.png` | populated | global-voice-button-active | seed populated → tap voice button |  |
| `global-voice-button-home.png` | populated | VoiceButton in context (Home) | seed populated |  |
| `global-voice-button.png` | populated | VoiceButton (element crop) | seed → Home |  |

## Flow videos

One Playwright context per flow with `recordVideo` (393x852). `flow-<n>.json` holds the step log: `step`, `action`, `selector`, `t_ms` from the first navigation, and the `screenshot` name taken right after that step (`flow-<n>-<step>.png`). The last entry is the success assertion (`ok: true`) or the failure.

| Flow | Video | Steps (t_ms action) | Result |
|---|---|---|---|
| flow-1 guest-start-first-set | `flow-1-guest-start-first-set.webm` + `flow-1.json` | 1623 boot; 2619 "Continue without account"; 3656 "CONTINUE AS GUEST" (reload); 4904 home after reload; 5980 "Skip tutorial"; 6897 Home "START WORKOUT"; 7828 "Quick Start"; 8745 "Add Exercise"; 9291 type "Bench"; 9692 exercise row; 10613 "ADD TO WORKOUT"; 11511 Set 1 weight cell; 11900 NumPad "1"; 12302 NumPad "0"; 12704 NumPad "0"; 13111 NumPad DONE; 13504 Set 1 reps cell; 13903 NumPad "8"; 14303 NumPad DONE; 14704 Mark set 1 done; 15270 success assertion | ok |
| flow-2 log-one-set | `flow-2-log-one-set.webm` + `flow-2.json` | 438 boot; 1456 Resume dialog "Resume"; 2395 Set 1 weight cell; 2789 NumPad "1"; 3190 NumPad "0"; 3591 NumPad "0"; 3994 NumPad DONE; 4401 Set 1 reps cell; 4798 NumPad "8"; 5195 NumPad DONE; 5206 select RIR 1; 5603 Mark set 1 done; 6211 success assertion | ok |
| flow-3 finish-review-save | `flow-3-finish-review-save.webm` + `flow-3.json` | 491 boot; 1472 Resume; 2403 "Finish"; 3327 "Save without reflection"; 3902 success assertion | ok |
| flow-4 home-to-lift-chart | `flow-4-home-to-lift-chart.webm` + `flow-4.json` | 412 boot; 1382 Home "VIEW PROGRESS"; 2318 tab "PR Vault"; 3268 lift row "Bench Press"; 3803 success assertion | ok |
| flow-5 coach-message-reply | `flow-5-coach-message-reply.webm` + `flow-5.json` | 453 boot; 1442 Nav "Coach"; 1983 type message; 2401 Send; 2947 reply visible; 3462 success assertion | ok |
| flow-6 edit-split-start | `flow-6-edit-split-start.webm` + `flow-6.json` | 509 boot; 1522 Nav "Train"; 2497 split card "Edit"; 3071 rename "PPL v2"; 3498 "SAVE SPLIT"; 4445 split card footer "Start"; 5427 day row "Push" (last visible [role=button] containing Push; sheet rows are div[role=button]); 5978 success assertion | ok |
| flow-7 shopping-add-budget | `flow-7-shopping-add-budget.webm` + `flow-7.json` | 433 boot; 1409 Nav "Fuel"; 2396 "Shopping and budget"; 2953 type "Chicken Breast"; 3366 Enter (addItem; "ADD TO LIST" is not a <button>); 4339 tab "Budget"; 4882 success assertion | ok |
| flow-8 units-settings-home | `flow-8-units-settings-home.webm` + `flow-8.json` | 404 boot; 1406 Nav "Profile"; 2372 "Settings"; 3315 "Switch to LBS"; 4300 Nav "Home"; 4830 success assertion | ok |

Flow 1 runs the true cold start (1A: auth overlay → guest modal → reload → Skip tutorial → START WORKOUT → Quick Start → Add Exercise → search → ADD TO WORKOUT → NumPad 100 / 8 → done). Flow 2 seeds `lk_history` with exercise 111 removed so the first set shows `--` instead of the previous session's prefilled value (the NumPad appends to a prefilled value, see failure mode in user-flows.md). Flow 7 adds the item with Enter because "ADD TO LIST" is not a `<button>` (L43155). Flow 6 opens the day sheet from the split card footer Start (the sibling before Edit) because `button:has-text("Start")` also matches "Quick Start" and the expanded day header "Start day" buttons.

## Unreachable or absent states

| Page | State | Sub-view | Reason |
|---|---|---|---|
| pr-vault | error | - | no network in PRHub (page-map 2.3 L/X n/a) |
| pr-vault | loading | - | no network in PRHub (page-map 2.3 L/X n/a) |
| pr-vault | populated | overview tab | PRHub Overview/PR Vault inner tab bar (L29753) renders only in the `!p.onBack` branch (L29742); embedded in Progress it shows the "PR VAULT" h1 and the list only, so the overview (Last 7 Days strip, L29771) is unreachable in v6 |
| photos | populated | compare | lightbox shows only ANALYSE PHYSIQUE and a close button; compare target (addTarget L30598) has no visible trigger with 2 photos |
| cycle | error | male gate | Home hides the cycle blocks when !isFemaleUser (L26579/L21946), so the gate message at L25168 is unreachable from the UI in v6 |
| cycle | loading | - | no network in CycleTrackerScreen (page-map 2.5 L/X n/a) |
| train-hub | error | - | no network in TrainHub itself (page-map 2.6 L/X n/a) |
| train-hub | loading | - | no network in TrainHub itself (page-map 2.6 L/X n/a; AI builder covered under split-builder) |
| workout-detail | error | - | no network (page-map 2.9 L/X n/a) |
| workout-detail | loading | - | no network (page-map 2.9 L/X n/a) |
| cardio | error | - | no network (page-map 2.12 L/X n/a) |
| cardio | loading | - | no network (page-map 2.12 L/X n/a) |
| coach-plan | error | - | plan is parsed out of chat replies, no own request (page-map 2.14 L/X n/a) |
| coach-plan | loading | - | plan is parsed out of chat replies, no own request (page-map 2.14 L/X n/a) |
| profile | error | - | no network in ProfileScreen (page-map 2.16 L/X n/a) |
| profile | loading | - | no network in ProfileScreen (page-map 2.16 L/X n/a) |
| settings | empty | - | no empty branch (page-map 2.17 E n/a) |
| shopping-budget | loading | compare loading | price comparison (L44340) has no visible trigger with one enabled store; swaps fire automatically ("Finding savings...") |

## Notes for auditors

- No page has a data-loading state: all page data is synchronous from localStorage (page-map §1). Every `loading`/`error` shot is one of the AI/worker calls (Home insight tip, Goals "Analyse My Progress" and "AI Body Fat Estimate", Photos "ANALYSE PHYSIQUE", WorkoutLog "AI Rec", Review "GET AI COACH INSIGHT", ExerciseDetailModal `/exercise-detail`, AI Split Builder first question, coach chat send, coach interview "Writing your instructions…", Settings beta "Verify", shopping `/store-search`, Budget "Finding savings…").
- `home-error` looks like a normal Home because ProactiveTipCard collapses on fetch failure (L17930): there is no visible error UI. Same for `shopping-budget-error` (store search fails silently) and `photos-error`/`workout-log-error` where the failure is a toast that may already have faded — compare with the `-loading` counterpart.
- `workout-detail-populated-convert-modal.png` still shows the two-step Delete confirmation toast because the Delete arm shot was taken immediately before it.
- `train-hub-populated-split-expanded.png` was taken after tapping the first chevron `[aria-label="Expand split"]`; the seed leaves `lk_splitsExpanded` empty so the first card is expanded, the rest collapsed.
- `cycle-populated-log-sheet` was opened with the today card "Symptoms" button (McLogSheet, L23147); "Log Period" only toggles the flow flag inline. The Home CycleTrackerCard is the last Home block and sits under the fixed nav, so the harvester clicks its "LOG" button via a DOM click.
- Global: `global-nav.png` and `global-voice-button.png` are element crops; `global-toast.png` is the real `showToast` ("Name the day first…", split builder Add with a blank day name); `global-saved-toast.png` is the React "Saved" toast after Review save; `global-voice-button-active.png` shows the microphone-denied toast (headless has no mic); the tutorial series is `global-tutorial-intro` + `step-1..7`; cold start is `global-coldstart-*`; the React Onboarding is `global-onboarding-*`.
- `debug.log` next to this file keeps the step failures and visible-button dumps from the last run for anyone re-running `harvest.mjs` (`node harvest.mjs only=<page>[,<page>-<state>,flow-N]` re-harvests a subset and merges into `index.json`).
