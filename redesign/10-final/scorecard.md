# Scorecard

What the original scored, what the rebuild measures, and what has not been
re-scored. Every "after" number below came from a script in `tests/` that can be
re-run; the command is named beside it.

---

## 1. What the original scored

Waves 1 and 2 scored eighteen pages against the rubric in
`00-inventory/rubric.md`, two scorers per criterion, converged to a maximum
delta of 1 before any page was scored (`00-inventory/calibration.md`). Means
per page, out of 5:

| Page | Function | Design |
|---|---|---|
| home | 2.3 | 2.0 |
| exercise-library | 2.6 | 2.6 |
| workout-detail | 2.6 | — |
| coach-plan | 2.6 | — |
| settings | 2.7 | 2.2 |
| workout-log | 2.9 | 2.4 |
| split-builder | 3.0 | 2.3 |
| profile | 3.3 | — |
| review | 3.3 | — |
| train-hub | 3.3 | 2.0 |
| cycle | 3.3 | 1.8 |
| progress | 3.4 | 2.3 |
| shopping-budget | 3.4 | 2.1 |
| cardio | 3.7 | 2.1 |
| coach-setup | 3.9 | — |
| coach-chat | 4.0 | 2.4 |
| photos | 4.0 | — |
| pr-vault | 4.0 | 1.9 |

Design was consistently the weaker half: eleven of eleven scored pages landed
between 1.8 and 2.6.

---

## 2. What the rebuild measures

`tests/scorecard-measure.mjs` — ten built screens, both themes, 393×852, twenty
runs.

| | Original | Rebuild |
|---|---|---|
| Interactive targets under 44px | **179 of 466** | **0 of 466** |
| axe violations, WCAG 2.1 A and AA | present on every page | **0**, across twenty runs |
| Text below AA contrast | present, including a 1.00:1 card in light | **0** |
| Console errors and warnings | a `ReferenceError` on every workout save | **0** |
| Horizontal overflow at 393px | present | **none** |
| Distinct type sizes | 12 | **6** (11, 13, 15, 17, 22, 28) |
| Distinct border radii | 30 | **5** (0, 8, 12, 16, 999) |
| Distinct transition durations | 51 keyframes | **2** (150ms, 300ms) |
| Font families | system, plus per-screen drift | **one** |
| Zoom | disabled app-wide | enabled |

The 466 total is not a coincidence: the rebuilt screens carry the same number of
interactive targets as the original. The change is that none of them is now
smaller than a finger.

### Taps to log one set

`tests/tapcount.mjs`, counted the way `01-audit-function/workout-log.md`
counted it: every tap, deletions and sheet dismissals included.

| | Taps |
|---|---|
| Original | **15** — five of them deletions clearing a pre-filled value |
| Rebuild, typing a new weight and reps | **9** |
| Rebuild, accepting last session's numbers | **1** |
| Best known | 3 |

The keypad still opens showing last session's number, which is useful. The
difference is that the first digit now replaces it instead of appending to it.
The original logged the failure as real data — a `60` typed onto an uncleared
`72.5` was saved as `6072.5`.

### State changes no longer reset the screen

`tests/rerender-sweep.mjs` — eleven screens, both themes, 22 runs.

| | Original | Rebuild |
|---|---|---|
| Focus after a state change | lost on **every** screen | held on every screen |
| Caret and typed value | lost | held |
| Scroll offset | jumped on workout-log (200→41) and review (200→352) | held everywhere |

Two differences are the intended behaviour and are recorded as such in the
sweep: the password reveal returns the caret to the field, and leaving edit mode
in the split builder removes the split-name field.

### The assembled demo

`10-final/verify-demo.mjs` — **86 of 86 checks pass**, including navigation
across every screen, tab semantics, target sizes on the demo's own chrome,
horizontal overflow at 393px, and the body map driven end to end inside the
shadow-root isolation. Zero console errors, zero uncaught page errors.

### Consistency

`tests/cleanup-audit.mjs` — **zero** selectors in the shared stylesheets that
nothing uses, one header shape across the four tab screens, and the type, radius
and duration sets above.

---

## 3. What has not been re-scored, and why

**The judgment half of the rubric has not been re-run on the rebuilt screens.**
Purpose clarity, feature completeness, task success, error recovery, hierarchy,
HIG fit and the AI-look penalty are scored by a reader against anchors, not
computed. Scoring my own build on those would be worth less than saying plainly
that it has not been done.

What it would take, and what makes it credible rather than a formality: the
calibration in `00-inventory/calibration.md` found that every disagreement of 2
or more between two independent scorers traced to an unstated measurement
method, not to differing judgment — a synthetic pointer event that never fires
`:active`, zero-valued padding counted as on-grid, and no ruling on whether a
state that branches in code but renders nothing counts as present. Those rulings
are now written down, so a fresh pair of scorers would start converged. That is
the pass to run, on the same eighteen-page basis, before anyone claims a score
for the rebuild.

**Eight of the original eighteen pages were not rebuilt.** Cardio, cycle,
photos, pr-vault, profile, shopping-budget, workout-detail and the Fuel tab are
not in this build. Fuel was redesigned separately at your direction. The others
were out of the scope you set when you said what to build. A whole-app score
cannot be compared against the original's eighteen-page average until they
exist.

---

## 4. Known shortfalls in what was built

**Four muscles on the body map fall short of the 44px rule and no margin will
fix them.** A deltoid is a crescent with the pectoral on one side and the biceps
on the other. Measured largest inscribed circle: 32px for shoulders and for the
trapezius seen from the front, 40px for the adductors from behind. All clear
WCAG 2.5.8's 24px minimum, all are keyboard reachable in anatomical order, and
search is on screen at every stage, so the map is never the only way to a
muscle. The numbers are pinned in `tests/bodymap-audit.mjs`, so a regression
still fails. Fixing them properly means a larger figure on separate front and
back views, which is a design change rather than a tuning one.

**The body map is a mockup screen as well as a library view.** The interactive
figure ships inside the Exercise Library, which is where it belongs.
`mockup-bodymap.html` remains as the screen that also demonstrates the zoom into
a group's regions; that zoom is not yet wired into the library.

**Three screens have a zero page gutter.** Exercise library, body map and
onboarding use `body--flush` for full-bleed lists. That is deliberate, and it is
the one measured difference `cleanup-audit.mjs` reports between screens.

---

# The Apple wave, scored

Three review rounds, four reviewers, every finding answered. The scores below
are the design manager's, scored against `11-apple/apple-design-spec.md` with
the same rubric and method each time so the three are comparable.

## The design manager's three reviews

| | Review 1 | Review 2 | Review 3 |
|---|---|---|---|
| Hard items, §12.1–11 | 11 / 22 | 13 / 22 | **18 / 22** |
| Subjective, §12.12 / §6.3 / §8.7 / §8.8 | 4 / 8 | 6 / 8 | **7 / 8** |
| **Total** | **15 / 30** | **19 / 30** | **25 / 30** |

Five of the six points in the last round moved on the hard side, and four of
those were items where review 2 found the claim and the measurement
disagreeing. Those disagreements are gone: the reviewer re-measured all three
and confirmed them.

Items that reached 2/2 in round three: continuous and concentric corners, one
accent tint per surface, springs, sheet detents and the grabber, SF Symbols
on one optical size, glass confined to the chrome, the primary element
identifiable in two seconds, iOS 27 material treatment, and empty/loading/
error states written as instructions.

## What each review found, and what happened to it

| Round | Reviewer | Findings | Outcome |
|---|---|---|---|
| 1 | design manager | 13 items, DO NOT SHIP | answered in `11-apple/spec-compliance.md`, four refusals argued |
| 1 | bug and UX sweep | 19 findings | all fixed |
| 2 | design manager | 2 blockers, 12 priorities | both blockers cleared; 10 of 12 done, 3 refusals argued in `spec-compliance-2.md` |
| 2 | bug and UX sweep | 19 findings | all fixed; verified fixed by the round-3 sweep |
| 2 | code review | 14 findings | all fixed |
| 3 | design manager | 1 blocker, 25/30 | blocker cleared |
| 3 | bug and UX sweep | 19 findings | all fixed |
| 3 | feature audit | 3 screens dropped, 2 dead crossings, 3 false labels | all rebuilt or fixed |

## The suite, on fifteen screens

Every figure below is from `sh redesign/tests/run-all.sh`.

| Suite | Result |
|---|---|
| freeze — nothing lost | 15 screens, no function removed |
| foundation — springs, type, glass | all checks passed |
| chrome — collapse, minimize, edge, detents | all checks passed |
| squircles | 168 smoothed, 0 capsules wrongly smoothed |
| press — every control moves | 57 / 57 kinds |
| re-render — focus, caret, scroll | 30 / 30 (15 screens x 2 themes) |
| screens x states x themes x axe x targets | 15 / 15 all passed |
| body map — targets and selection | all passed |
| accent — one fill per surface | every screen, every state |
| focus — never falls to the body | clean |
| skeletons — nothing shifts on load | clean |
| dynamic type — default ladder and AX5 | all checks passed |
| actions — every control does something | 0 dead controls |
| crossings — every selector names a control | all passed |
| demo — assembled | 104 / 104 |

## Three tests that could not fail, and now can

Worth recording, because each hid real defects behind a green run.

**`dynamic-type.mjs`** asserted `documentElement.scrollWidth > clientWidth`
under `overflow-x: hidden` — a condition that cannot occur. It reported green
on thirteen screens whose primary button read "Fini". It now measures each
text node's own box, and separately asserts every control is inside the
viewport, because a button pushed off the side keeps its text intact.

**`accent-audit.mjs`** returned early on any non-HTML node, so SVG was never
counted, and it measured the resting screen only. Progress drew its chart in
the accent and the numeric pad carried six tinted objects; both reported
clean. It now walks every declared state and counts SVG fill and stroke.

**`nav-selectors.mjs`** did not exist. Two crossings named controls that do
not exist — `[data-action="finish"]` where the button is `data-act="finish"` —
which left Review, a finished 996-line screen, reachable by no tap at all.
The test reads the nav table out of `assemble.mjs` and checks every selector
against the screen it names.

## What is not done

Recorded in `11-apple/spec-compliance-3.md` rather than left for a fourth
review: recipes, saveable coach cards beyond the plan and the split, the
per-exercise equipment override, superset and left/right rendering in the set
grid, and SF Symbols weight-matching to adjacent text size.
