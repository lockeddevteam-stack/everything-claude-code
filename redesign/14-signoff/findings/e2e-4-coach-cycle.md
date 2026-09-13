# E2E 4 — Coach, Cycle, Settings/Profile

Target: `10-final/locked-demo.html` over `file://` (hash router), iPhone-sized Chromium, Playwright 1.56.1.
Journey: coach chat/interview/setup/plan/check-in → cycle setup, logging, discreet, irregular, loss/recovery, export, delete → settings units, body, export/restore, erase, password.
Reference: `tests/fixtures/seed-data.json`, TODAY 2026-09-09.
`pageerror` and console errors were collected on every run. **Zero of either were seen anywhere in this journey.**

## Defects

### 1. Deleting the coach plan is undone by a reload
Coach → Plan → **Delete this plan** → **Delete everything** (`delete-confirm`). The pane empties, the toast says "Plan deleted.", `localStorage.lk_coachPlan` becomes `null`. Reload → the 12-week strength block is back in full.
Cause: the handler removes the key (`08-build/coach.html:1974`, demo `locked-demo.html:24453`, `if (store()) store().remove('lk_coachPlan')`), but `LKStore.get` falls back to the fixture for that key (`08-build/store.js:109` / demo `:11666`, `case 'lk_coachPlan': return F.coachPlan;`). A removed key is indistinguishable from an untouched one, so delete can never stick.
Worse in sequence: save a *new* plan from chat, bind it, delete it — the reload brings back the **old seeded** plan, not an empty pane. The split binding is lost, so the state after reload is one that was never saved by anybody.
The source comment two lines above (`coach.html:1971-1973`) claims this exact bug was fixed. It was not.

### 2. Turning Cycle tracking on in Settings leaves the Cycle screen permanently gated
Home → account → Settings → **Cycle tracking** switch (`switch-cycle`, writes `lk_cycle="true"`, switch reads `aria-checked=true`) → back → Home now shows the Cycle row ("Day 12 · Follicular, estimated · next period in 17 days") → tap it → **"Cycle tracking is off. The switch is in Settings, under Cycle tracking." / Open Settings**.
Tapping **Open Settings** lands on the switch that is already on, so the loop has no exit inside the app. Only a full page reload clears it — which a phone user has no way to do.
Cause: the gate is read once at screen boot (`08-build/cycle.html:2189`, demo `:39163`) and the screen subscribes to `lk_mcProfile` and `lk_mcDays` only, never to `lk_cycle` (`cycle.html:2197-2200`, demo `:39172-39174`).

### 3. "Open in Train" on the plan-binding toast destroys the demo
Coach → Plan → **Run it on a split** → pick any split. Toast: "12-week strength block runs on PPL. Push is next. | **Open in Train**". Tapping it navigates to `file:///…/10-final/train.html`, which does not exist: the page becomes `chrome-error://chromewebdata/`, blank, with the whole app gone.
Cause: `coach.html:1964` (demo `:24277`) does a raw `location.href = 'train.html'` inside the toast callback. `MANIFEST.nav` in `10-final/assemble.mjs` claims coach→train only through `[data-testid="plan-start"]` (`assemble.mjs:125`); the toast action button is not covered. The assemble-time check (`assemble.mjs:1071-1090`) only asserts that *some* coach→train row exists, so the undeclared crossing passes the build.
The same file already guards this pattern elsewhere (`locked-demo.html:26224-26228`, "from a timer is not a click and would take the whole demo with it"), so the hazard is known.

### 4. "Export a backup — One file with every workout, split and record" exports none of them
Settings → **Export a backup**. Toast: "LOCKED-backup-2026-09-09.json saved. 5 keys, 3 KB." The file contains exactly `lk_profile`, `lk_liveSessionRows`, `lk_liveSession`, `lk_proactiveTip`, `lk_theme` — no history, no splits, no PRs, no cycle log, no coach data.
Cause: `exportBackup()` (`08-build/settings.html`, `var dump = ST.dump()`) serialises only keys actually written to `localStorage`; everything the app shows comes from the fixture, which `dump()` never sees. Restoring this file onto a clean phone restores nothing but a name and a theme, while the row copy (`settings.html:1158`) promises the opposite.

### 5. Toast markup is printed as literal text (two places)
- Coach → Chat → **Edit** on the first user message ("How should I progress bench?"). Toast reads: `<span class="num">2</span> messages removed. Edit it and send again.`
- Coach → Setup → **Clear all** → **Tap again to forget all 2**. Toast reads: `<span class="num">2</span> facts forgotten.`
`toast()` escapes its text (`coach.html:1419`, demo `:23898`) while the two callers build it with the `n()` markup helper (`coach.html:106`; callers `:1789` and `:2081`, demo `:24268` and `:24560`). DOM confirms `&lt;span class="num"&gt;2&lt;/span&gt;` inside `.toast__body`. Only triggers when the count is 2+; the singular branches are plain strings, which is why it survived.

### 6. Body and goal accepts and stores an impossible age; an impossible weight is dropped in silence
Settings → **Body and goal** → Age `999`, Body weight `0` → **Save**. The sheet closes, toast "Body and goal saved.", the row reads `999 · Female · 172 cm · 70.5 kg · Build muscle` and `lk_profile.age` is `999` after a reload. The `0` weight was neither saved nor reported — the old value stays with no message.
Cause: `settings.html:1586-1590` — `if (age > 0) … if (wv > 0) …`; there is no upper bound and no error path for a rejected field.

### 7. Two screens give two different session counts for the same log
Profile stat tile: **22 SESSIONS**. Coach, new chat: **"I can see 18 sessions, over 5 weeks, 9 lifts with records and 6 check-ins."** Both are reading `lk_history`, which holds 18 lifting sessions and 4 cardio records (22 rows). The Profile tile counts all 22 while the SETS (288) and VOLUME (140k kg) tiles beside it are lift-only, so the row is internally inconsistent as well.

### 8. Profile "PERSONAL RECORDS · 12 in all" lists 6 and offers no way to the rest
`lk_prs` holds 12 record entries across 9 lifts. The card header says "12 in all", the list is hard-capped at 6 (`08-build/profile.html:360`, `ME.records.slice(0, 6)`), the rows are `row--static` (not tappable), and the screen has no "see all" control. The other records are unreachable from Profile.

### 9. Every data source off, and the coach still answers from the data
Coach → Setup → **Turn all off** → Save. New chat intro: "Every source is switched off in Setup, so I can see nothing of yours." Receipt: "Coach can see 0 of 9 sources". Sending "How is my bench going?" returns "Your bench moved 60 to 72.5 kg for 5 in six weeks…" — the user's logged numbers, which the screen just promised were not sent. The reply pipeline never consults `S.setup.perms` (no reference to it outside the Setup pane in `coach.html`). The privacy claim under the switches, "Only what is on is sent", is contradicted on screen.

## Worked

- Coach chat: send a message, reply arrives, survives reload; `msg-again` retry replaces the last reply in place and persists.
- Coach edit: **Edit** drops the message and everything after it, refills the composer with the original text, and **Undo** restores the exact thread (aside from defect 5's label).
- **New** chat clears the thread to the empty state, **Undo** restores all four seeded messages, and the restore survives a reload.
- Interview: six questions, abandon at Q4 → "3 of 6 answered. Nothing was lost. / Resume at question 4", survives a reload, resumes at Q4, review sheet echoes every answer, **Write my instructions** produces text that matches the answers given, **Use these instructions** saves and persists.
- Instructions textarea, quick chips and the 57/2000 counter all match `lk_coachInstructions`; Save writes it and the tone (`lk_coachStyle` → `technical`), both intact after reload.
- Data sources: the intro line and the receipt agree at 9/9, 5/9 and 0/9; the receipt names exactly the four switched-off sources; the state persists across reload.
- Plan figures reproduce from the seed: Week 6 of 12 / 50% from `startDate 2026-08-04`; Bench 72.5 of 75 kg (97%) and Deadlift 115 of 120 kg (96%) from the logged best 5+ and 4+ sets; Base "2 of 2 targets met"; Build "Week 2 of 4"; Peak "Starts week 9".
- Binding to a split writes `boundSplit` and survives reload; **Start Upper** and **Run it on a split** route correctly inside the demo; `plan-target-0` opens Progress.
- Saving a coach-written plan from chat works and persists (**Save this plan** → "Plan saved. It needs a split before it can run.").
- Check-in: partial answers are refused with a named list; five answers save, appear as "Today", and persist. A second check-in the same day replaces today's row rather than adding one — documented one-a-day behaviour (`lk_checkinPerDay: 1`), not a defect, but it happens with no warning.
- Cycle reading is exactly right: Day 12, Follicular, next period Sep 26, 17 days away, fertile Sep 6–12, PMS Sep 21–25, ring and Home row agreeing.
- Cycle setup wizard: rejects an empty date and a future date with specific messages, saves goal/date/lengths/irregular/birth control, and the finished setup survives a reload.
- Logging: flow, twelve symptoms with severity, energy, sleep, mood, sex, note — all written to `lk_mcDays` and intact after reload. Logging heavy flow today correctly restarts the count at Day 1.
- Discreet mode hides the phase name, symptom names and the colour coding; the ring goes monochrome (`var(--text-tertiary)`), every calendar cell's `aria-label` is reduced to "logged"/"nothing logged", and the calendar key is replaced with "The key is hidden in discreet mode." Nothing on the ring or either calendar gives the phase away.
- Irregular widens the estimate from "Sep 26, give or take 2 days" to "Sep 22 to Sep 30", with the copy changing to match.
- Pregnancy loss on Sep 3 pauses predictions ("ending 6 days ago" — correct), **Start estimating again** dismisses it and the dismissal survives a reload, and a later loss on Sep 7 brings recovery back ("ending 2 days ago").
- Cycle export downloads a real JSON of the day log; "Delete everything logged here" is two taps, clears `lk_mcProfile`/`lk_mcDays`, drops to the first-run wizard, and stays deleted after a reload.
- Weight unit kg → lb converts everywhere: body 64.2 kg → 141.5 lb, Leg Press 165 kg → 363.8 lb, volume 140k kg → 309k lb; persists.
- Settings restore from a backup file replaces the stored keys and the restored value survives a reload.
- "Erase everything on this phone" clears the written keys and the app comes back to the seed (22/12/288/140k, Cesco, 64.2 kg), not to an empty shell; the toast says so explicitly.
- Password sheet: empty current, mismatch, under 8 characters and same-as-current each produce their own message and keep the sheet open. It accepts any non-empty current password, which matches its own copy ("This build has no account server… nothing is saved, nothing is sent").
- **Sync now** shows "Checking for changes / Syncing", then returns to "Never synced" with "Not in this build. Nothing has left this device."
- Click sweep of every visible control on Coach, Cycle, Settings and Profile: no throw, no console error, no other dead end, no control that did nothing (the only non-responders are static containers and `row--static` rows).
