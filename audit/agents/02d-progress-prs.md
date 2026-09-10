# Agent 2d — Progress charts & PR vault

File audited: `redesign/input/locked-current-v6.html` (all cites are this file)
Range: 28323–30152. Components: `ProgressPage` (28323–29164), `PRHub` (29165–30152).
Read in 4 chunks; helpers resolved by targeted grep outside the range (shared code 1–4663).

---

## PART A — Features

### F-TRAIN-500 Progress hub tab bar (Overview / Goals / Calendar / Photos / PR Vault)
- Location: Progress tab > PROGRESS screen > pill tab row
- User action: taps one of five pills; taps back arrow to return home
- Behavior:
  1. `useHubState("progressTab","overview",[...])` restores the last tab from `lk_ui_progressTab` (28324, 2121–2139).
  2. A restored value not in the allow-list falls back to "overview" (2126–2128).
  3. Tapping a pill calls `setTab`, which writes `lk_ui_progressTab` (2132–2136).
  4. `tab === "prs"` short-circuits the whole render and returns `<PRHub>` instead (28438–28452).
  5. Back arrow calls `p.go("home")` (28565).
- Components: ProgressPage (28323–29164); tab row (28596–28644)
- Functions: useHubState (2121–2139)
- State: `tab`; hub-persisted
- Storage: reads/writes `lk_ui_progressTab`
- Network: none
- Edge cases: stale persisted tab handled (2126); `"prs"` returns PRHub before any other branch, so the pill row is not rendered on the PR tab — the user navigates back via PRHub's own back button (29722–29744)
- Gating: always on
- Status: WORKING
- Evidence: 28324, 28438
- Notes: the five-pill bar disappears entirely on the PR Vault tab (28438 returns early) — an inconsistent navigation model.

### F-TRAIN-501 Throwback card (1-in-4 roll on Progress load)
- Location: Progress > Overview > top card
- User action: passive; taps dismiss
- Behavior:
  1. On mount, if `throwbackForced()` is false and `Math.random() >= 0.25`, state is `null` (28325–28330).
  2. Otherwise `computeThrowback()` (4606) supplies the comparison.
  3. Renders `ThrowbackCard` (4664) only on the overview tab (28645–28649).
  4. Dismiss calls `dismissThrowback()` → writes `lk_throwbackDismissed` (4662) and clears local state.
- Components: ThrowbackCard (4664, outside range); call site 28645–28649
- Functions: throwbackForced (4603), computeThrowback (4606), dismissThrowback (4662)
- State: `tbData`
- Storage: reads `lk_throwbackForce` (raw localStorage, 4604); writes `lk_throwbackDismissed`
- Gating: 25% random roll; `localStorage.lk_throwbackForce="1"` forces it (dev/test backdoor, 4600–4604)
- Status: WORKING
- Evidence: 28325–28330 roll is done once in the useState initializer, per the in-code comment about not burning the budget on hub-persisted tabs
- Notes: dev backdoor key is documented in a comment at 4600–4602.

### F-TRAIN-502 Featured Lifts — Day 1 vs Current PR cards
- Location: Progress > Overview > "FEATURED LIFTS"
- User action: views cards; taps X to unpin
- Behavior:
  1. `featuredIds` seeded from `lk_featuredLifts` (28331–28333).
  2. Per id: `getFirstLogged(eid)` walks `history` **backwards** to find the earliest session containing that exercise and returns the heaviest set of it (28349–28368).
  3. `getCurrentPR(eid)` reduces `prs[eid]` to the max `w` (28369–28376).
  4. Both are converted with `liftDisp(..., useKg)` (28677–28678) and `gain = round((prW-firstW)*10)/10` (28679).
  5. Card shows DAY 1 tile (grey, with the first date), a chevron, and CURRENT PR tile coloured green when `gain > 0` else orange, plus a `+gain unit` line (28749–28831).
  6. X button filters the id out and persists via `setFeaturedIds` → `sd("featuredLifts", n)` (28342–28348, 28712–28720).
- Components: ProgressPage
- Functions: setFeaturedIds (28342), getFirstLogged (28349), getCurrentPR (28369), getEx (4747), liftDisp (4439)
- State: `featuredIds`
- Storage: `lk_featuredLifts` (r/w)
- Edge cases: empty list shows the "Track your key lifts here" card (28657–28674); missing first/PR renders `--` (28775, 28812)
- Gating: always on
- Status: PARTIAL
- Evidence for status: 28679 — `gain` is always rendered with a hardcoded `"+"` prefix (28825), so a regression renders as "+-5kg"; and `gain > 0 ? GR : OR` treats a 0 gain as a negative.
- Notes: `getFirstLogged` calls `getEx(exId)` inside the inner loop (28356) — O(history × exercises) lookups, hoistable. It matches by `ex.name`, not `ex.id`, so a renamed custom exercise breaks the Day 1 lookup.

### F-TRAIN-503 Add Featured Lift search screen
- Location: Progress > Overview > "ADD LIFT" button > full-screen picker
- User action: taps ADD LIFT, types in search, taps a result
- Behavior:
  1. `setShowAddLift(true)` (28839–28841) swaps the whole page for the picker (28448–28556).
  2. `available` = `ALL_EX` minus already-featured, filtered case-insensitively by name, **capped at 20** (28449–28454).
  3. Tapping a row appends the id, closes the picker, clears the search (28503–28511).
  4. Back arrow closes and clears search (28470–28474).
- Functions: none named (inline)
- State: `showAddLift`, `liftSearch`
- Storage: writes `lk_featuredLifts` on selection
- Edge cases: "No matching exercises found." (28550–28555)
- Gating: always on
- Status: WORKING
- Evidence: 28449–28454
- Notes: hardcoded `.slice(0, 20)`; no custom-exercise source beyond whatever `ALL_EX` contains; no duplicate/limit cap on how many lifts can be featured.

### F-TRAIN-504 Body weight trend chart (SVG line, last 30 entries)
- Location: Progress > Overview > "BODY WEIGHT"
- User action: passive
- Behavior:
  1. `weightLog = ld("weightLog", [])` (28339); `graphData = weightLog.slice(-30)` (28430).
  2. min/max/range computed over `.kg` (28431–28437); `graphRange = max(range,1)`.
  3. Header shows "Last N entries" and the latest value via `toDisp` (bodyweight-only kg→lb ×2.20462, 28378–28382, 28866–28883).
  4. `<svg height=120 viewBox="0 0 max(N*12,100) 120">` with one `<polyline>` and one `<circle>` per point; `x = i*(vw-20)/(N-1)+10`, `y = 110 - (kg-min)/range*100` (28884–28903).
  5. First and last entry `date` strings shown under the chart (28904–28921).
- Functions: toDisp (28378), ld (2417), fmtQ (4349)
- State: none (read at render)
- Storage: reads `lk_weightLog`
- Edge cases: `graphData.length > 1` required; otherwise "Log your body weight in the Fuel tab to see your trend here." (28922–28934)
- Gating: always on
- Status: PARTIAL
- Evidence for status: 28862 renders `graphData.length === 1 ? " entry" : " entries"` inside a branch that only runs when length > 1 — dead ternary; the real single-entry case falls to the empty state instead of a chart.
- Notes: no y-axis labels, no gridlines, no time-range selector, no tooltips. Axis labels use the raw stored `.date` string, unformatted. Chart is not read-only-safe against non-numeric `kg`.

### F-TRAIN-505 Training calendar (month grid with per-day dots)
- Location: Progress > Calendar
- User action: taps ‹ / › to change month; hovers a day for its tooltip
- Behavior:
  1. `calM`/`calY` initialised to the current month/year (28383–28385); arrows wrap year boundaries (28945–28956, 28965–28978).
  2. `calKey(day)` builds `YYYY-MM-DD` from the local calendar (28389–28391).
  3. Four date maps built each render: `weighInDates` from `weightLog` via `dayOf(e.date)` (28399–28403); `prDates` from every PR via `prDay(pr)`, storing `{ex, w, r}` (28404–28417); `photoDates` from `lk_progressPhotos` (28418–28422); `workoutDates` from `history` via `dayOf(w.dateISO || w.date)` storing workout names (28425–28429).
  4. Grid: 7 header letters, `firstDay` blank cells, then `daysInM` cells (28986–29012).
  5. A trained day is filled (`OR_H+"26"` bg, orange bold text); any other day with data gets CARD bg; today gets a 1.5px accent border (29018–29046).
  6. Up to three dots per day: blue weigh-in, amber PR, green photo (29050–29082).
  7. `title` attribute concatenates workout names · "N PRs" · "weighed in" · "photo" (29013–29018).
  8. Legend row: Trained / Weigh-in / PR / Photo (29083–29157).
- Functions: calKey (28389), dayOf (1969), prDay (4541), isoDay (1961)
- State: `calM`, `calY`
- Storage: reads `lk_weightLog`, `lk_progressPhotos`, plus `prs`/`history` props
- Edge cases: PRs whose date cannot be resolved are silently dropped (28409 `if (!d) return;`); a photo timestamp is normalised via `dayOf` rather than a UTC slice (comment at 28392–28398)
- Gating: always on
- Status: WORKING
- Evidence: 28404–28417 + 4541 — `prDay` handles the legacy literal `"Today"` by returning null rather than mis-dating
- Notes: `weighInDates[d] = e.kg` keeps only the last weigh-in per day. No tap handler on a day — the calendar is display-only, no drill-down into that day's session. The tooltip is `title=` only, so it is unreachable on touch.

### F-TRAIN-506 Goals tab passthrough
- Location: Progress > Goals
- Behavior: renders `GoalsTab` with `useKg`, `prs`, `history`, `profile` (28934–28939).
- Components: GoalsTab (26992, outside range — not audited here)
- Status: WORKING (passthrough only)
- Evidence: 28934–28939

### F-TRAIN-507 Photos tab passthrough
- Location: Progress > Photos
- Behavior: renders `ProgressPhotos` with `splits`, `setSplits`, `history`, `useKg` (29158–29163).
- Components: ProgressPhotos (30585, outside range)
- Status: WORKING (passthrough only)
- Evidence: 29158–29163
- Notes: `ProgressPage` reads `lk_progressPhotos` itself for calendar dots (28340) while `ProgressPhotos` owns the data — duplicated storage access.

### F-TRAIN-508 PR Vault list (search, compound-first sort, three-number tiles)
- Location: Progress > PR Vault (PRHub `tab === "prs"`)
- User action: types in the search box; taps an exercise row
- Behavior:
  1. `withPRs` = `ALL_EX` entries with a non-empty `p.prs[e.id]` (29183–29185).
  2. Search input filters by lowercase substring of `ex.name` (30037–30040).
  3. Sort: `compoundRank(name)` first (deadlift, squat, bench, leg press, overhead press, row, pull/chin-up, hip thrust, clean/snatch, dip — 4515–4536), then alphabetical (30041–30047).
  4. Each row: trophy icon, name, muscle, chevron, then three tiles from `prSummary(exPrs)`: `1RM`, `6-8 REP`, `EST. 1RM`, each dimmed to 0.45 opacity and showing `—` when unset (30110–30146).
  5. Tapping a row sets `sel = ex.id` and opens the detail screen (30053–30055).
- Functions: prSummary (4492), compoundRank (4530), kgToDisp (4430), lkKeyActivate
- State: `search`, `sel`
- Storage: PR data comes in as the `p.prs` prop (persisted by the parent under `lk_prs`, 2353)
- Edge cases: `withPRs.length === 0` → trophy glyph + "No PRs yet" (30021–30036)
- Gating: always on
- Status: WORKING
- Evidence: 29183, 30041–30047
- Notes: the rep-range labels are driven by `PR_WORK_LO/HI = 6/8` (4490) — a hardcoded working range with no user setting. `withPRs` is derived from `ALL_EX` only, so a PR stored against an exercise id absent from `ALL_EX` (deleted custom) is invisible in the list but still counted elsewhere.

### F-TRAIN-509 PR detail — three summary cards (1RM / Working / Estimated)
- Location: PR Vault > exercise detail (top)
- Behavior:
  1. `sel !== null` renders the detail screen; missing exercise returns `null` (29403–29408).
  2. `prSummary(exPrs)` returns `{oneRM, working, est, estFrom}` (4492–4511).
  3. Three rows built at 29456–29481: "1 REP MAX" (badge `1`, orange, note = `prLabel(oneRM)`), "WORKING WEIGHT" (badge `6-8`, note = `prLabel + reps`), "ESTIMATED 1RM" (badge `≈`, blue, note = "from Wkg × R").
  4. Unset rows render at 0.5 opacity with `—` and an explanatory note (29484–29520).
- Functions: prSummary (4492), prLabel (4552), e1rm (4479), kgToDisp (4430)
- Status: WORKING
- Evidence: 29456–29481
- Notes: `prLabel` degrades gracefully for legacy non-date values by echoing the raw string (4553–4555).

### F-TRAIN-510 Est-1RM progression chart with 30D / 90D / ALL range filter
- Location: PR Vault > exercise detail > "PROGRESSION — EST. 1RM"
- User action: taps 30D, 90D or ALL
- Behavior:
  1. `e1rmSeries(sel, p.history, p.prs)` (29531; impl 4569–4600) mines the best non-warmup set per lifting session plus dated PR entries, max per day, sorted by ISO date, each point `{date, e1, isPr}`.
  2. `series.length < 2` → empty card "Log more sessions with this exercise…" (29535–29539).
  3. Range: `cutoffDays = prRange === "all" ? null : parseInt(prRange)`; cutoff = `Date.now() - days*86400000` sliced to `YYYY-MM-DD`; series filtered by `pt.date >= cutoff` (29540–29542).
  4. Filtered `< 2` points → "Not enough data in this range." (29543–29547).
  5. Otherwise SVG polyline, `vw = max(N*14,120)`, `y = 110 - (e1-min)/range*100`; PR points draw radius 4 in solid orange, session points radius 2.5 in `OR_H+"88"` (29548–29575).
  6. Header shows "N sessions" and the latest est-1RM; footer shows first/last ISO date (29553–29578).
  7. Range buttons `[["30","30D"],["90","90D"],["all","ALL"]]` set `prRange` (29583–29593).
- Functions: e1rmSeries (4569), e1rm (4479), isLiftingSession, prDay (4541), kgToDisp
- State: `prRange` (default `"all"`, 29176) — resets whenever the detail screen unmounts
- Storage: none directly (props)
- Status: PARTIAL — likely BROKEN for lb users
- Evidence for status: 4563–4568 the doc comment says history set weights "are stored in the session's display unit … so normalise to kg here", but `e1rmSeries` (4569–4600) performs **no unit conversion** — it feeds raw `s.w` into `e1rm` and the result straight into `kgToDisp`. Mixed-unit histories will plot a discontinuity.
- Notes: no y-axis, no tooltips, no point labels; PR-vs-session distinction is conveyed by dot radius only (no legend).

### F-TRAIN-511 Strength profile bar chart (est. 1RM per rep record)
- Location: PR Vault > exercise detail > "STRENGTH PROFILE — EST. 1RM"
- Behavior:
  1. Rendered only when `exPrs.length >= 2` (29595).
  2. `ests = exPrs.map(pr => ({r, est: round(pr.w*(1+pr.r/30)*10)/10}))` (29596–29601).
  3. `maxEst`; if not `> 0` the card returns null — guard added for bodyweight lifts logged at 0 kg (29602–29609).
  4. Bar width `bW = max(4, min(36, floor((300-20)/n) - 6))` — the clamp exists because past ~40 records the width went negative (comment 29606–29608).
  5. SVG 300×98: one `<rect rx=4>` per record, value text above, `NRM` label below (29629–29676).
- Status: PARTIAL
- Evidence for status: 29597–29600 uses the raw Epley formula inline instead of `e1rm()` (4479), so a 1-rep record is inflated ×1.033 here while the summary cards above it deliberately are not — the same lift shows two different est-1RM numbers on one screen.
- Notes: bar values are printed in **stored units** with no `kgToDisp` conversion (29658–29666) — an lb user sees kg numbers here. Chart width is hardcoded `cW = 300`, `cH = 70`.

### F-TRAIN-512 Log a PR without a workout (manual PR entry)
- Location: PR Vault > "LOG A PR WITHOUT A WORKOUT" button, or detail > "Log New PR"
- User action: picks exercise from a `<select>`, taps a rep chip, types a weight, taps SAVE PR
- Behavior:
  1. `setLogging(true)` swaps in the full-screen form (30000–30020; from detail: 29679–29683 which also pre-selects `logEx = sel`).
  2. Exercise `<select>` lists every `ALL_EX` entry; default `logEx = "107"` (29179, 29273–29296).
  3. Rep chips: `[1,2,3,4,5,6,8,10,12]`, label `1RM` or `NRM` (29310–29332).
  4. Weight `<input type=number step=0.01 inputMode=decimal>` (29334–29358).
  5. Live preview card once both are set: "Est. 1RM" = `fmtQ(w*(1+r/30))` and "Logged as W unit × R" (29359–29392).
  6. `doLog()` (29186–29218): parses; if `!r || !w` → toast "Enter both a weight and a rep count." and abort; if an existing record at the same rep count is `>= w` → toast "Not a PR — your best at R reps is still X unit."; otherwise `p.setPrs` replaces the record for that rep count and re-sorts ascending by `r`, stamping `date: isoDay()`.
  7. On success: closes the sheet, sets `sel = eid` (jumping to that exercise's detail), clears the inputs.
- Functions: doLog (29186), toKg (29172) → convToKg (4464), isoDay (1961), fmtQ (4349)
- State: `logging`, `logEx`, `logReps`, `logW`
- Storage: writes via `p.setPrs` (persisted as `lk_prs` by the parent)
- Network: none. AI: none.
- Edge cases: both empty-field and not-a-PR paths toast (comment at 29187–29188 says both previously failed silently); no upper bound on weight or reps; free-typed reps impossible (chips only, so 7/9/11+ reps cannot be logged manually)
- Gating: always on
- Status: WORKING
- Evidence: 29186–29218 — validation + guarded `setPrs` updater that re-checks the existing record inside the reducer
- Notes: the preview at 29377 uses the inline Epley formula, so it shows a 1-rep entry inflated by 3.3% relative to what the vault will display for the same record (4485). SAVE PR button is styled disabled-looking when incomplete but is **always clickable** (`onClick: doLog` is unconditional, 29393–29401) — it relies on the toast instead.

### F-TRAIN-513 PR Vault header / back navigation
- Location: PR Vault header
- Behavior: when `p.onBack` is supplied the header is a back arrow + "PR VAULT" (29722–29744); otherwise it renders "PROGRESS" plus a two-tab underline bar (Overview | PR Vault) (29745–29779). `ProgressPage` always passes `onBack` and `defaultTab: "prs"` (28438–28452).
- Status: PARTIAL — the standalone header branch is unreachable from ProgressPage
- Evidence: 28438–28452 always supplies `onBack`, so 29745–29779 never renders
- Notes: `PRHub` is referenced exactly once in the file (28438) — see F-TRAIN-514.

### F-TRAIN-514 PRHub "Overview" tab — stats grid, Last 7 Days, Top PRs (DEAD)
- Location: PRHub `tab === "overview"` (29780–29966)
- Behavior (were it reachable):
  1. `last7` / `last4w` filter `history` by `dateISO` within 7 / 28 days (29691–29703).
  2. 2×2 stat grid: Total Workouts, This Week, Last 4 Weeks, PRs Logged (29782–29840).
  3. "Last 7 Days" list of session cards (name, `w.date - w.dur - sessionMetaLine(w,false)`, `w.vol`) or "No workouts in the last 7 days" (29841–29900).
  4. "Top PRs": `Object.keys(prs).slice(0, 5)` → best record by weight per exercise, trophy card showing `kgToDisp(best.w)` and `best.r + "RM"` (29903–29966).
- Functions: liftVolume (6881), sessionMetaLine (6927), getEx (4747), kgToDisp
- Status: DEAD
- Evidence for status: `tab` starts at `p.defaultTab` which is always `"prs"` (29178, 28451), and the only `setTab` call sites are the two tab buttons at 29760–29764, which render only when `p.onBack` is falsy (29745) — and `onBack` is always passed (28444). No path sets `tab` to `"overview"`.
- Notes when reviving: `prCount = Object.keys(prs).length` (29705) is labelled "PRs Logged" but counts **exercises with PRs**, not records. "Top PRs" is `Object.keys(prs).slice(0,5)` — insertion order, not ranked, despite the heading. `totalVol7` (29704) is computed and never rendered — dead variable.

---

## PART B — Function index

| Name | Kind | file:lines | Purpose | Called by | Calls | Feature ID(s) |
|---|---|---|---|---|---|---|
| ProgressPage | component | 28323–29164 | Progress hub: tabs, featured lifts, bodyweight chart, calendar | app router (`go("progress")`) | useHubState, useState, ld, sd, getEx, getFirstLogged, getCurrentPR, toDisp, calKey, dayOf, prDay, liftDisp, isoDay, computeThrowback, throwbackForced, dismissThrowback, PRHub, GoalsTab, ProgressPhotos, ThrowbackCard, Ic | 500–507 |
| setFeaturedIds | function (closure) | 28342–28348 | Functional setter that mirrors featured lifts to storage | unpin button, picker row | setFeaturedIdsRaw, sd | 502, 503 |
| getFirstLogged | function (closure) | 28349–28368 | Earliest logged heaviest set for an exercise | featured-lift card render | getEx, parseFloat | 502 |
| getCurrentPR | function (closure) | 28369–28376 | Max-weight record from `prs[exId]` | featured-lift card render | Array.reduce | 502 |
| toDisp (ProgressPage) | function (closure) | 28378–28382 | Bodyweight kg → display unit | bodyweight chart header | fmtQ | 504 |
| calKey | function (closure) | 28389–28391 | `YYYY-MM-DD` for a day in the displayed month | calendar cell render | String.padStart | 505 |
| PRHub | component | 29165–30152 | PR vault: list, detail, charts, manual PR logging | ProgressPage (28438) | prSummary, prLabel, e1rmSeries, compoundRank, kgToDisp, convToKg, liftVolume, sessionMetaLine, getEx, isoDay, fmtQ, lkKeyActivate, Ic | 508–514 |
| toDisp (PRHub) | function (closure) | 29168–29171 | kg → display unit | **nothing — dead** | fmtQ | — |
| toKg | function (closure) | 29172–29174 | Display unit → stored unit | doLog | convToKg | 512 |
| doLog | handler | 29186–29218 | Validate and persist a manually logged PR | SAVE PR button (29393) | parseInt, parseFloat, toKg, isoDay, kgToDisp, p.setPrs, LOCKED.toast | 512 |
| (summary-card IIFE) | inline render fn | 29452–29521 | Builds the 1RM / Working / Est rows | PRHub detail render | prSummary, prLabel, kgToDisp | 509 |
| (progression-chart IIFE) | inline render fn | 29522–29594 | Est-1RM line chart + range buttons | PRHub detail render | e1rmSeries, kgToDisp, parseInt, Date | 510 |
| (strength-profile IIFE) | inline render fn | 29595–29677 | Est-1RM bar chart per rep record | PRHub detail render | Math.max/min/floor | 511 |
| (rep-tile IIFE) | inline render fn | 30110–30146 | Three PR tiles on a vault list row | PRHub list render | prSummary, kgToDisp | 508 |
| onClick — back to home | handler | 28563–28566 | `p.go("home")` | header back arrow | p.go | 500 |
| onClick — progress tab pill | handler | 28601–28603 | `setTab(t[0])` | tab row | setTab | 500 |
| onDismiss — throwback | handler | 28648 | Dismiss throwback card | ThrowbackCard | dismissThrowback, setTbData | 501 |
| onClick — unpin featured lift | handler | 28712–28720 | Remove id from featured list | X button on card | setFeaturedIds | 502 |
| onClick — ADD LIFT | handler | 28839–28841 | Open the exercise picker | ADD LIFT button | setShowAddLift | 503 |
| onClick — picker back | handler | 28470–28474 | Close picker, clear search | picker back arrow | setShowAddLift, setLiftSearch | 503 |
| onChange — liftSearch | handler | 28494–28496 | Update picker query | picker input | setLiftSearch | 503 |
| onClick — pick exercise | handler | 28503–28511 | Append id to featured list | picker row | setFeaturedIds, setShowAddLift, setLiftSearch | 503 |
| onClick — prev month | handler | 28946–28953 | Decrement month, wrap year | calendar ‹ | setCalM, setCalY | 505 |
| onClick — next month | handler | 28966–28973 | Increment month, wrap year | calendar › | setCalM, setCalY | 505 |
| onClick — vault back | handler | 29424–29426 | `setSel(null)` | detail back arrow | setSel | 508 |
| onClick — range button | handler | 29588 | `setPrRange(t[0])` | 30D/90D/ALL | setPrRange | 510 |
| onClick — Log New PR | handler | 29679–29683 | Open log form pre-set to this exercise | detail footer button | setLogEx, setLogging | 512 |
| onClick — LOG A PR WITHOUT A WORKOUT | handler | 29999–30001 | Open log form | vault list button | setLogging | 512 |
| onClick — log-form back | handler | 29228–29230 | Close log form | log-form back arrow | setLogging | 512 |
| onChange — logEx select | handler | 29276–29278 | Choose exercise | log form select | setLogEx | 512 |
| onClick — rep chip | handler | 29317–29319 | Choose rep count | log form chips | setLogReps | 512 |
| onChange — logW | handler | 29338–29340 | Weight input | log form input | setLogW | 512 |
| onChange — vault search | handler | 29987–29989 | Filter vault list | search input | setSearch | 508 |
| onClick — vault row | handler | 30053–30055 | Open exercise detail | vault list row | setSel | 508, 509 |
| onClick — PRHub inner tab | handler | 29761–29763 | Switch PRHub tab (unreachable) | PRHub standalone header | setTab | 513, 514 |

Helpers referenced from outside the range (documented for the rebuild, not owned here): `useHubState` 2121, `migratePrDates` 2349, `ld` 2417, `sd` 2435, `isoDay` 1961, `dayOf` 1969, `fmtQ` 4349, `kgToDisp` 4430, `liftDisp` 4439, `convToKg` 4464, `e1rm` 4479, `prSummary` 4492, `compoundRank` 4530, `prDay` 4541, `prLabel` 4552, `e1rmSeries` 4569, `throwbackForced` 4603, `computeThrowback` 4606, `dismissThrowback` 4662, `ThrowbackCard` 4664, `getEx` 4747, `liftVolume` 6881, `liftSets` 6887, `sessionMetaLine` 6927, `GoalsTab` 26992, `ProgressPhotos` 30585.

---

## PR data model

Stored record shape — written at 29205–29213:

```js
prs[exerciseId] = [ { r: <int reps>, w: <number, stored weight unit>, date: "YYYY-MM-DD" }, ... ]
```

- Keying: top-level key is the **exercise id as a string** (object keys), read back with `parseInt(eid)` (28405, 29904). The array is keyed internally by rep count — one record per `r`, enforced by filtering out the old `r` and concatenating the new one (29206–29215), then sorted ascending by `r` (29213–29215).
- New-PR rule: a record only replaces an existing one at the same rep count if strictly heavier (`w <= current.w` rejects, 29196 and again inside the updater at 29203).
- Units: `w` is stored in whatever `storedWeightUnit()` records, not necessarily kg — reads go through `kgToDisp`/`liftDisp` (4430, 4439) and writes through `convToKg` (4464). Bodyweight (`lk_weightLog.kg`) is always kg and uses the separate `toDisp` (28378).
- Date migration: `migratePrDates()` (2349–2385+) runs once, guarded by `lk_prDatesFixed`. Legacy records whose `date` is not `^\d{4}-\d{2}-\d{2}$` are matched against sorted `lk_history` by exercise name + exact rep count + weight within ±0.51, and re-stamped with `dayOf(session.dateISO || session.date)`.
- Runtime tolerance: `prDay(pr)` (4541–4550) accepts an ISO day, parses anything `Date.parse` understands, and returns `null` for legacy literals like `"Today"` — such records are dropped from the calendar (28409) and from `e1rmSeries` (4590).
- Derived view: `prSummary(list)` (4492–4511) collapses the list to `{oneRM, working (6–8 reps), est, estFrom}`; `PR_WORK_LO/HI = 6/8` (4490).

## Chart rendering

All charts are **hand-rolled inline SVG** — no charting library, no canvas.

1. **Bodyweight line** (28884–28903): `<svg height=120 viewBox="0 0 max(N*12,100) 120">`, one `<polyline>` + one `<circle r=3>` per point. Data: `ld("weightLog").slice(-30)`, plotted on `.kg`. Scale: `y = 110 - (kg - min)/max(range,1) * 100`, `x = i*(vw-20)/(N-1)+10`. **Time range: fixed last 30 entries, no selector** (28430). Axis labels: first/last raw `.date` strings only.
2. **Est-1RM progression line** (29548–29578): same geometry with `vw = max(N*14,120)`. Data: `e1rmSeries(exId, history, prs)` (4569) — best non-warmup set per lifting session merged with dated PR records, max per day. Points that came from a PR record draw `r=4` solid orange; session-derived points `r=2.5` at 88% alpha. **Time ranges: 30D / 90D / ALL** (29583–29593), applied as an ISO-string cutoff filter.
3. **Strength profile bars** (29629–29676): fixed 300×98 viewBox, one `<rect rx=4>` per rep record, value `<text>` above and `NRM` `<text>` below. Data: `exPrs` mapped through the inline Epley formula. No time dimension.
4. **Calendar heat grid** (28986–29082): CSS grid, not SVG — coloured cells plus up to three 4px dots.

No chart has axes, gridlines, tooltips, or touch interaction; the only interactive control anywhere is the 30D/90D/ALL row.

## Storage keys touched

| Key | Access | Cite |
|---|---|---|
| `lk_ui_progressTab` | read + write (via `useHubState`) | 28324, 2121–2136 |
| `lk_featuredLifts` | read (28332) + write (28345) | 28331–28348 |
| `lk_weightLog` | read | 28339 |
| `lk_progressPhotos` | read | 28340 |
| `lk_throwbackForce` | read (raw localStorage, dev flag) | 4604 |
| `lk_throwbackDismissed` | write (via `dismissThrowback`) | 4662 |
| `lk_prs` | written indirectly through `p.setPrs` | 29202–29216; key name 2353 |
| `lk_prDatesFixed` | migration guard (outside range) | 2352, 2355 |
| `lk_history` | read by the migration (outside range) | 2356 |

No network calls, no Supabase/API access, and no AI model usage anywhere in 28323–30152 — verified by absence of `fetch`/`supabase`/`claude` in the range.

No secrets present in this range.

## Open questions / UNVERIFIED

1. **Unit handling in `e1rmSeries`** — the comment at 4563–4568 asserts normalisation to kg that the code (4569–4600) does not perform. Confirm by logging a session in lb and one in kg for the same exercise and checking the progression chart for a step discontinuity. Marked PARTIAL/likely BROKEN (F-TRAIN-510).
2. **Strength-profile bar units** — 29658–29666 prints `e.est` with no `kgToDisp`. UNVERIFIED whether `storedWeightUnit()` is ever anything but kg in practice; if it can be lb, this card is correct only by accident. Confirm by inspecting `storedWeightUnit` (near 4400) against a lb-configured profile.
3. **PRHub overview tab reachability** — I found no `setTab("overview")` path (see F-TRAIN-514 evidence). UNVERIFIED whether any other file/route renders `PRHub` without `onBack`; grep shows `PRHub` referenced only at 28438, so this is almost certainly dead, but a runtime check of `defaultTab` would settle it.
4. **`ALL_EX` and custom exercises** — `withPRs` (29183) and the log-form `<select>` (29293) both iterate `ALL_EX`. UNVERIFIED whether `ALL_EX` includes user customs at runtime; `p.customs`/`p.onCustom` are passed into PRHub (28442–28443) but **never used inside it** — confirm by checking how `ALL_EX` is assembled (near 4747).
5. **Default `logEx = "107"`** (29179) — a hardcoded exercise id with no comment. Which exercise 107 is, and whether it is a sensible default, is unverified.
6. **`weightLog` entry `.date` format** — the bodyweight chart prints it raw (28912–28920) while the calendar runs it through `dayOf` (28400). UNVERIFIED whether these are ISO days or timestamps; the chart's axis labels depend on it.
