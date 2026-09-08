# LOCKED Redesign Swarm Directive v4

Self-contained. Replaces v3 and the separate audit plan. Input file: `input/locked-current-v6.html` (v6.0, 1.84 MB, pulled from locked-seven.vercel.app on 2026-09-08).

## North Star

LOCKED must be the most optimized strength training app possible, built as if Apple's best team owned it. Values in order:
1. Simplicity. One job per screen. One primary action per screen. Daily actions take one tap. Monthly actions live one level deeper. No tutorial needed.
2. Quality. Every screen finished. Nothing placeholder or approximate.
3. Attention to detail. Pixel alignment, optical spacing, one type hierarchy, purposeful motion, predictable states, copy that says one thing.

Tiebreaker for every decision: what would Apple ship. Any element that cannot justify its place gets removed.

Apple-grade detail checklist (scored pass or fail per item by design auditors, brief reviewer, page reviewers):
1. Primary action obvious within one second. Secondary quieter. Tertiary hidden until needed.
2. All text from the type scale. Line height and tracking set per size.
3. 8px spacing grid. Deliberate breaks documented.
4. Every control has pressed, disabled, and feedback within 100ms.
5. Transitions carry meaning. Sheets rise from where summoned. Lists animate insertion. No decorative fades.
6. Empty state teaches the next action in one sentence. Error state says what happened and what to do.
7. Tabular figures for numbers. Units beside values. Relative dates when recent, absolute when not.
8. One icon set, one stroke weight, one optical size.
9. No horizontal scroll except deliberate carousels. No target under 44 x 44px.
10. Dark is native, not inverted. Elevation by tone, shadow secondary.
11. Copy short, specific, never cheerful for its own sake.

## Current Build Facts

- Single HTML file. React 18.3.1 and ReactDOM via unpkg, supabase-js 2.45.4 via jsdelivr. No bundler. 4,408 `React.createElement` calls. 111 components.
- Styling: one 54-line `<style>` block plus 3,719 inline style objects.
- Tokens: CSS variables for dark and light (`--color-bg`, `--color-card`, `--color-accent`, etc.), used in JS through constants OR, MU, BORD, CARD, GLASSBAR. Defined, not enforced.
- Network: Supabase auth and sync, worker at lockedapi.cescocugliari.workers.dev. Guest mode (`localStorage.lk_guestMode="1"`) runs fully offline. All persisted keys are prefixed `lk_`.
- Accessibility present: 193 aria-labels, 108 roles, aria-current on nav, safe-area insets, nav height published as `--lk-nav-h`.

Measured sprawl, with the target the redesign must hit:

| Metric | Current | Target |
|---|---|---|
| Font sizes | 34 (5 cover 88%) | 6 |
| Font weights | 700 x640, 800 x300, 600 x185, 400 x13 | 400, 500, 600, 700 |
| Border radii | 24 | 4 |
| Padding combos | 194 | 6-step scale |
| Gap values | 16 | 6 |
| Hex colors in JS | 57 (Tailwind and Apple palettes mixed) | 0 |
| rgba literals | 115 | 0 |
| Box shadows | 11 | 2 |
| Transition variants | 45 | 2 durations, 2 easings |
| Keyframes | 24 | 8 max |
| linear-gradient | 142 | 0 decorative |
| !important | 105 | 0 |
| Emoji in UI | 65 | 0 |

Structural defects: Home stacks 12 card types with no primary action and ships a LayoutEditor so users fix it themselves. Workout Log is 3,942 lines, 206 style objects, 45 buttons, and is the one-handed mid-set screen. Coach mixes chat, plan, and setup interview in 2,631 lines. Settings has 29 buttons. Three competing tab patterns with radii from 8 to 999. Progress, PR Vault, Photos, Cycle hang off Home. Shopping and Budget hang off Fuel. Cardio is a separate screen inside Train.

Keep: token layer with dark and light and correct `color-scheme`; system font stack; safe-area and keyboard-open handling; contrast-aware constants; guest mode; Ds* primitives (DsCard, DsRow, DsSection, DsHeader, DsSegmented, DsStat) as the component library seed.

## Scope

18 pages. Audit and research all 18. Merges decided at Gate 3 may reduce the build count.

| # | Page | Components | Lines |
|---|---|---|---|
| 1 | Home | HomeScreen, DynamicFeed, QuickActionsRow | 1,291 |
| 2 | Progress | ProgressPage (Overview, Goals, Calendar) | 841 |
| 3 | PR Vault | PRHub | 987 |
| 4 | Progress Photos | ProgressPhotos | 906 |
| 5 | Cycle Tracker | CycleTrackerScreen | 1,032 |
| 6 | Train Hub | TrainHub (My Splits, History, Library) | 951 |
| 7 | Workout Log | WorkoutLog, NumPad, PlateCalc, ExerciseActionSheet, ExerciseDetailModal, ReplacePanel | 4,984 |
| 8 | Review | Review | 656 |
| 9 | Workout Detail | WorkoutDetail | 773 |
| 10 | Exercise Library | ExLib | 863 |
| 11 | Split Builder | SplitBuilder, AISplitBuilder, ConvertToSplitModal | 1,988 |
| 12 | Cardio | CardioSection, CardioLogFlow, CardioHistory, CardioFavorites | 802 |
| 13 | Coach Chat | CoachScreen chat view | part of 2,631 |
| 14 | Coach Plan | CoachScreen plan view | part of 2,631 |
| 15 | Coach Setup | CoachSetupPane, CoachInterview | 430 |
| 16 | Profile | ProfileScreen | 431 |
| 17 | Settings | SettingsScreen, LayoutEditor | 2,039 |
| 18 | Shopping and Budget | ShoppingBudgetTab, ShoppingTab, PantryTab, MyStoresTab, BudgetTab | 3,331 |

Page slugs used for file names: home, progress, pr-vault, photos, cycle, train-hub, workout-log, review, workout-detail, exercise-library, split-builder, cardio, coach-chat, coach-plan, coach-setup, profile, settings, shopping-budget.

Global (owned by global agents): Nav, Onboarding, TutorialOverlay, VoiceButton, toasts, active-workout banner.
Out of scope: FuelTab (nutrition, separate track), BetaAdminPanel.
Pre-audit hypotheses, to confirm or overturn by Gate 3: rebuild 1, 2, 6, 7, 13, 14, 17; refine 3, 4, 8, 9, 10, 11, 15, 16; merge 12 into 6, 5 into 2, 18 into one screen with two modes; cut TutorialOverlay, ThrowbackCard, ProactiveTipCard, LayoutEditor.

## Operating Rules

- Waves run in order. A wave closes only when its gate passes. Agents inside a wave run in parallel, Task tool, batches of 6.
- Fixed output paths. No agent edits another agent's file.
- Every claim carries evidence: file and line, screenshot name, source URL, test result, or measured value. Reviewers delete unsupported claims.
- Per page, auditors, researcher, verifier, builder, and reviewer are five different agents.
- Output caps: audit 1,200 words, synthesis 600, research prompt 500, research 2,000, verification 400, brief 900, review 900. Tables count as words. Exceeding the cap is a gate failure.
- Static output only: HTML, CSS, vanilla JS. No build step. Opens from disk. Reason: Playwright must test the demo without a toolchain, and the demo is a spec for the later React rebuild, not the rebuild.
- Dark mode is the built demo. Light tokens are defined in tokens.css with contrast pairs but no light screens are built.
- Commit after every gate: `git commit -m "gate N passed"`. If a gate fails twice, stop, write blockers to `progress.md`, wait for Cesco.
- `progress.md` updated at the end of every wave: finished, failed, changed, gate result.
- Narrate nothing. Write files.

## Output Tree

```
/redesign
  progress.md
  input/locked-current-v6.html
  input/vendor/react.js react-dom.js supabase.js
  00-inventory/ page-map.md user-flows.md storage-keys.md design-system-current.md rubric.md calibration.md screenshots/current/<page>-<state>.png
  01-audit-function/<page>.md
  02-audit-design/<page>.md  <page>-annotated.png
  03-audit-global.md
  04-synthesis/<page>.md  devils-advocate.md
  05-research-prompts/<page>.md
  06-research/<page>.md  verification/<page>.md
  07-briefs/<page>.md  design-system-new.md
  08-build/tokens.css components.html <page>.html
  09-review/<page>.md global.md screenshots/new/<page>-<state>.png
  10-final/locked-demo.html changelog.md scorecard.md
  tests/ playwright.config.ts fixtures/seed-data.json fixtures/coach-replies.json
         e2e/flows/<flow>.spec.ts e2e/pages/<page>.spec.ts e2e/global.spec.ts
         baseline/results.json report.html  final/results.json report.html  visual/<page>-<state>.png
```

## Wave 0: Inventory, Baseline, Calibration

0A Page Mapper. Read the source. Write `page-map.md`: every route, tab, sheet, modal for the 18 pages. Per page: component names, entry and exit points, the four states (empty, loading, error, populated) and how to reach each, data dependencies. Also write `storage-keys.md`: every `lk_*` localStorage key, its shape, which page reads and writes it. Grep `localStorage` and `lk_`.

0B Flow Mapper. Write `user-flows.md` for these 8 flows. Per flow: page sequence, expected taps, success assertion, failure modes.
1. Guest start to first logged set.
2. Log one set: weight, reps, RIR.
3. Finish workout, Review, save.
4. Home to one lift's progress chart.
5. Send one coach message, receive reply.
6. Edit a split, start it.
7. Add a shopping item, open Budget.
8. Change units in Settings, return Home.

0C Offline Harness. Copy `input/locked-current-v6.html` to `tests/app/index.html`. Download React, ReactDOM, supabase-js to `input/vendor/` and rewrite the three script tags to local paths, dropping `integrity` attributes. Write `fixtures/seed-data.json` using the key shapes from `storage-keys.md`: `lk_guestMode="1"`, `lk_profile={displayName:"Cesco",username:"cesco",useKg:true}`, 6 weeks of history (3 sessions per week, 5 exercises each, realistic loads), 3 splits, 12 PRs, 10 shopping items, one budget. Write `fixtures/coach-replies.json` with 5 canned coach responses. In `playwright.config.ts` use device `iPhone 15 Pro`, and in a global fixture `page.route` every request to `*.supabase.co` and `*.workers.dev` to fulfill from fixtures. Verify the app boots to Home with seeded data and zero console errors.

0D Screenshot Harvester. Runs after 0C. Capture every page in every reachable state to `screenshots/current/`. Record a video per flow. Ground truth for all audits. Auditors may not score from code alone.

0E Design System Extractor. Write `design-system-current.md`: every font size, weight, spacing, radius, shadow, color, transition, and component with usage counts and file references. Confirm or correct the sprawl table above.

0F Rubric Author. Write `rubric.md`. Two rubrics scored 1 to 5, written anchors at 1, 3, 5 with one concrete example each.
Function: purpose clarity, feature completeness, task success, speed (taps and screens), state handling, data correctness, error recovery.
Design: hierarchy, typography, spacing, contrast (WCAG AA measured), component consistency, targets (44px measured), motion and feedback, HIG fit, AI-look penalty, accessibility. Plus the 11-item detail checklist as pass or fail.

0G Calibration Pair. Two agents independently score Workout Log and Settings. Any criterion differing by 2 or more sends its anchors back to 0F. Repeat until every criterion agrees within 1. Write `calibration.md`.

0H Baseline Test Author. Write and run against `tests/app/index.html`:
- `e2e/flows/<flow>.spec.ts`: one per flow. Tap count is the number of `page.click` and `page.tap` calls the script needs. Record elapsed ms from first navigation to success assertion. Capture console errors.
- `e2e/pages/<page>.spec.ts`: loads, each state renders, every interactive element responds, no console errors.
- `e2e/global.spec.ts`: nav reaches every page, back works, axe-core on every page, script measuring every clickable bounding box against 44px, contrast scan of every text node against 4.5:1.
Save `baseline/results.json` and `report.html`. Failures on the current app are findings, not blockers.

Gate 0: page map and storage keys complete; app boots offline with seed and zero errors; all screenshots captured; calibration passed; baseline saved.

## Wave 1: Function Audit (18 agents)

Input: page map, flows, rubric, code, screenshots, videos, baseline results for the page.
Write `01-audit-function/<page>.md`: purpose in one sentence; feature inventory with code location, marking dead, broken, redundant, hidden; task walkthrough per flow touching the page with video timestamp and tap count; state coverage with screenshot names and missing states; baseline failures with cause; rubric scores with evidence; keep, fix, cut.

## Wave 2: Design Audit (18 agents, distinct from Wave 1)

Do not open the Wave 1 file until scores are written.
Write `02-audit-design/<page>.md` and `<page>-annotated.png`: numbered callouts; squint test and 5-second test result; measured contrast per text style, target size per control, spacing deltas from the 8px grid; rubric scores with evidence; detail checklist pass or fail per item; consistency deltas against the current system; keep, fix, cut.

Gate 1+2: both audits per page, every score evidenced, every checklist item marked.

## Wave 3: Global Audit and Synthesis

3A Global Auditor. Write `03-audit-global.md`: navigation model, cross-page consistency, onboarding, shared components, motion, whole-app feel. Decide the three merge hypotheses and the four cut hypotheses with evidence. Decide where Shopping and Budget live when Fuel is out of scope. Rank pages by combined score times flow importance.

3B Synthesizers (18). Write `04-synthesis/<page>.md`: verdict (rebuild, refine, keep, merge into X); must survive with evidence; problems ranked by severity (blocks task, slows task, cosmetic); open questions phrased so a source could answer them.

3C Devil's Advocate. Write `devils-advocate.md`: argue against every verdict, name missed problems and undervalued strengths. Synthesizers append a written response to each point.

Gate 3: every synthesis has a verdict and answered objections; global auditor has settled merges, cuts, and the Shopping location; final build list written to `progress.md`.

## Wave 4: Research, Verification, Briefs, Tests

4A Research Prompt Authors (one per page). Fill this template. No generic fields.

```
# Research Prompt: <page>
## North Star
Page belongs to LOCKED, built to be the most optimized strength app possible, as if Apple built it. Values: simplicity, quality, detail.
## The Page
Purpose: <from synthesis>
User job: <job, who, how often, physical context>
Current state: <two sentences, two worst problems named>
Verdict: <from synthesis>
## Questions
<open questions from synthesis, verbatim, numbered>
Q-A. Minimum element set to complete the job. What can be removed.
Q-B. Fastest known pattern for the core action, in taps or seconds, with source.
Q-C. How the best apps handle empty, loading, error, populated for this page type.
Q-D. Apple HIG guidance for this page type, sections named.
Q-E. Details that separate good from great.
## Reference Apps
<five, each with reason chosen>. Per app: strengths, failures, one thing worth taking.
## Sources
T1: Apple HIG, peer-reviewed, first-party docs. T2: NN/g, Baymard, named practitioners. T3: blogs, forums, only as leads.
Minimum 8 T1 or T2. Every finding tagged tier and URL.
## Required Output
1. Findings: claim, tier, URL, one line on application.
2. Answers to every question, or "no source found."
3. Table: current LOCKED vs five apps on taps to core job, density, state handling, hierarchy, detail quality, simplicity.
4. Three directions: name, paragraph, tradeoff, supporting findings.
5. Recommended direction, tied to north star.
6. Ten detail notes (spacing, motion, copy, feedback), each with a source or app example.
```

Reference app seeds:
| Page | Apps | Focus |
|---|---|---|
| Workout Log | Strong, Hevy, Fitbod, Apple Fitness workout view, Alpha Progression | one-handed entry, rest timer placement, plate math access, RIR capture |
| Home | Apple Fitness Summary, WHOOP Home, Oura Today, Strava Home, Hevy Home | one primary action, training day vs rest day |
| Train Hub | Hevy Routines, Strong Templates, Fitbod, Juggernaut AI, Boostcamp | routine selection speed, history density |
| Coach pages | WHOOP Coach, Fitbod feedback, ChatGPT app, Zing Coach, Apple Health Coach concepts | chat vs plan surface, when to interrupt |
| Progress, PR Vault | Apple Health Trends, WHOOP Trends, Hevy Statistics, Strong Charts, Oura Trends | glanceable trend, drill-down depth |
| Settings, Profile | Apple Settings, Things 3, Oura, WHOOP, Strava | grouping, what to remove |
| Others | author picks 5 from the same tier | per synthesis questions |

4B Researchers (18, distinct from 4A). Execute the prompt in full with WebSearch and WebFetch. Write `06-research/<page>.md` in the required format. No invented sources.

4C Verifiers (18, distinct from 4B). Open every URL. Mark verified, misquoted, unreachable. Unreachable may be retried through archive.org once. Remove misquoted and unreachable findings. Fewer than 8 verified T1 or T2 sends the page back to 4B, once.

4D Design System Author. Write `07-briefs/design-system-new.md`:
- Type: 11, 13, 15, 17, 22, 28px. Weights 400, 500, 600, 700. 700 for numbers and titles only. Line height and tracking per size.
- Spacing: 4, 8, 12, 16, 24, 32.
- Radius: 8, 12, 16, 999.
- Color: existing token names, trimmed. One accent. Semantic: success, error, info, warning. Contrast pair table for dark and light. Zero hex or rgba outside tokens.
- Motion: 150ms, 300ms. Standard easing and one spring for sheets. No decorative gradients. Glass on nav bar and sheets only.
- Shadows: 2.
- Components with every state: button, card, list row, sheet, tab bar, segmented control, input, numeric keypad, chart, empty state, toast.
- Forbidden list.

4E Brief Authors (one per build-list page). Write `07-briefs/<page>.md`: purpose; ASCII wireframe per state; component list mapped to system names; seed data needs; interactions; acceptance criteria, numbered, each assertable by Playwright (example: "AC3: tapping Add Set appends a row and focuses the weight input within 100ms"); `data-testid` list.

4F Brief Reviewer. Check every brief against verified research, synthesis, north star, checklist, design system. Reject drift and untestable criteria. Two rounds max.

4G Demo Test Author. Turn every acceptance criterion into `e2e/pages/<page>.spec.ts`. Rewrite flow specs to the demo's `data-testid` hooks. Add visual snapshot per state. All specs must fail against an empty page before Wave 5.

Gate 4: research verified, design system approved, briefs approved, demo tests written and failing.

## Wave 5: Build

5A Foundation. Build `tokens.css` and `components.html` (every component, every state). Run axe, contrast, and target scripts on it. Clean before page builders start.

5B Page Builders (one per build-list page). Build `08-build/<page>.html`:
- iPhone 15 Pro frame, 393 x 852, plus fluid fallback.
- Four states via a corner dev toggle.
- Seed data from `fixtures/seed-data.json`. Coach replies from `fixtures/coach-replies.json`.
- Only values from tokens.css. Only components from components.html.
- Every `data-testid` from the brief.
- No external dependencies. System fonts, inline SVG.
- Run the page spec. Submit only when green.

Gate 5: every page spec green, foundation scans clean, zero values outside tokens.css (grep for `#`, `rgba(`, `px` literals not on the scale).

## Wave 6: Review and Fix

6A Screenshot Harvester. Every new page and state to `09-review/screenshots/new/`.

6B Page Reviewers (one per page, not the builder). Write `09-review/<page>.md`: rubric before and after; acceptance results; research alignment with citation; token adherence; AI-look test naming any template-feeling element; north star test naming every element that cannot justify its place; checklist pass or fail; axe, contrast, targets, focus order, reduced motion; ranked required fixes.

6C Personas (3). A 19-year-old first-month lifter, a 45-year-old returning after injury, a 30-year-old experienced lifter logging one-handed mid-set. Each walks all 8 flows and writes confusion, hesitation, and delight points with screenshot names.

6D Global Reviewer. Write `09-review/global.md`: cross-page consistency, navigation coherence, motion consistency, brand fit, token drift.

Fix loop: builders fix, rerun specs, reviewers recheck. Three passes max. Unresolved items go to `progress.md`.

Gate 6: all reviews done, all required fixes closed or logged, all specs green.

## Wave 7: Final

7A Assembler. Build `10-final/locked-demo.html`: every page inlined, working tab bar, tokens and components inlined, seed data, state toggle. Fuel tab shows a "separate track" placeholder. Shopping and Budget live where Gate 3 decided.

7B E2E Runner. Full suite against the demo. Save `final/results.json` and `report.html`. Any failure returns to the builder. Must be fully green.

7C Scorecard. Write `scorecard.md`: per page rubric before and after; per flow taps and ms before and after; axe, contrast, target counts before and after; sprawl table current vs demo.

7D Changelog. Write `changelog.md`: per page what changed, why, which finding drove it, open items.

Gate 7: suite green, scorecard complete, demo opens from disk with zero console errors.

## Success Criteria

- Every build-list page has both audits, synthesis, verified research, approved brief, built page, spec, review, persona notes.
- Full suite green against `locked-demo.html`.
- Design rubric up at least 1.5 per page. No page under 4 on hierarchy, contrast, targets.
- Every flow equal or fewer taps and less time than baseline.
- Zero axe violations, zero contrast failures, zero targets under 44px.
- Every sprawl target in the table hit.
- Every page passes all 11 checklist items and the AI-look test.

## Agent Budget

Wave 0: 8. Waves 1 and 2: 36. Wave 3: 20. Wave 4: 75 max, fewer if merges reduce the build list. Wave 5: up to 19. Wave 6: up to 23. Wave 7: 4. About 185. Batches of 6.

## Environment notes (orchestrator, 2026-09-08)

- Repo root: `/home/user/everything-claude-code`. Redesign tree: `/home/user/everything-claude-code/redesign`. All paths in this file are relative to the redesign tree.
- Static server: `node tests/serve.mjs 4173` serves the redesign tree at `http://127.0.0.1:4173/`. The current app is `http://127.0.0.1:4173/tests/app/index.html`. `/sw.js` and `/manifest.json` map to `tests/app/`.
- Playwright 1.56.1 and axe-core 4.10.3 are installed in `tests/node_modules`. Chromium is at `/opt/pw-browsers`. Do not run `playwright install`.
- Outbound network: only registry.npmjs.org is reachable from the shell. WebSearch and WebFetch tools work for research. Do not curl the live app or CDNs.
- Vendor files: `input/vendor/react.js`, `react-dom.js`, `supabase.js`, `591.supabase.js`, `zxing.js` (lazy barcode lib the app loads from unpkg; rewritten to local path in `tests/app/index.html`).
