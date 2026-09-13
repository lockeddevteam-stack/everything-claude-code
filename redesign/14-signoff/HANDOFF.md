# LOCKED redesign — handoff for the next version

Written 2026-09-13, from branch `claude/locked-swarm-directive-v4-ce68qn`,
head `6798b69`. This is the document to plan the next round of features from.

---

## 1. What this build is

A **staging build**, not the live app. Eighteen static screens of vanilla
JavaScript that open from disk, plus a script that assembles them into one
single-file demo. There is no framework, no build step and no bundler: a
screen is one `.html` file you can double-click.

It is not a prototype in the throwaway sense. Every screen persists, every
figure is computed from one seed, and a seventeen-suite Playwright harness
runs against it. But it reaches no server, so every server-dependent feature
is built to its local half and says on screen what the missing half needs.

**The one rule that produced everything else: a screen must never claim
something the data does not support.** Most of the defects fixed in this round
were not crashes. They were screens saying true-sounding things that were not
true — a PB nobody set, a session nobody did, a confidence figure for a
reading nothing performed. Plan on the assumption that this is the defect
class that comes back.

---

## 2. The shape of the thing

```
redesign/
  08-build/            the eighteen screens, plus shared modules
    *.html             one screen per file, self-contained
    store.js           LKStore   — persistence, and the seed fallback
    fixtures.js        LKFixtures — GENERATED, do not hand-edit
    units.js           LKUnits   — kg/lb, one switch for the whole app
    app.js             LKPatch   — DOM morphing that keeps focus and caret
    chrome.js          LKChrome  — headers, tab bar, sheets, detents
    session.js         LKSession — the live-workout shelf
    theme.js           LKTheme   — light/dark
    tokens.css         design tokens
    components.css     shared classes (append-only at the end)
  10-final/
    assemble.mjs       builds locked-demo.html and demo/index.html
    verify-demo.mjs    asserts the assembled demo boots and routes
  11-apple/
    gen-manifest.py    counts each screen's functions
    freeze-check.sh    fails if any screen LOSES function
    FEATURE-MANIFEST.md  the baseline it compares against
  tests/
    run-all.sh         the seventeen suites
    fixtures/
      seed-data.json   THE SEED. Every number on every screen traces here.
      gen-fixtures.mjs seed-data.json -> 08-build/fixtures.js
      exercise-db.json the 867-exercise catalogue
  14-signoff/          feature sign-off, findings, this file
```

### The screens

home · train · workout-log · workout-detail · review · progress · recap ·
fuel · shopping · stack · coach · cycle · profile · settings ·
split-builder · exercise-library · onboarding · tutorial

---

## 3. The data model, which is the part to understand first

### One seed, one store

`tests/fixtures/seed-data.json` is the only source of demo data. It is keyed
by the **shipped app's own localStorage keys** — `lk_history`, `lk_prs`,
`lk_splits`, `lk_profile`, `lk_fuelLog` and so on. `gen-fixtures.mjs` turns it
into `08-build/fixtures.js`, and **fails the build if a stored summary
disagrees with its own set rows**.

Every screen reads through `LKStore`:

```js
LKStore.get(key, fallback)   // the stored value, else the seed, else fallback
LKStore.set(key, value)      // written, and every listener fires
LKStore.patch(key, obj)      // merge into an object key
LKStore.touched(key)         // has a person written this, or is it still seed?
LKStore.remove(key)          // deleted, and REMEMBERED as deleted
LKStore.onChange(key, fn)    // another screen, or another tab
LKStore.dump()               // what the app is showing, for a backup
LKStore.reset()              // back to the seed — "Erase everything"
```

**The seed is a seed, not a source.** The moment a key is written, the stored
value wins and the fixture is never consulted for that key again. A *deleted*
key is remembered as deleted (there is a tombstone list under
`lk_removedKeys`), because without that a delete only lasted until the next
read.

### The rules that keep it honest

1. **One resolver per path.** If two screens need the same fact, they read the
   same key through the same helper. Do not let a screen keep a private copy
   of anything — this round found hand-typed PB tables in three separate
   screens, all disagreeing with the seed and with each other.
2. **Never invent a key, a table name or a figure.** Coach had invented
   `lk_feedback` and `lk_coachPlan` shapes; feeding it the real values threw.
3. **Frozen snapshots.** A stored log never changes when a table changes. A
   logged meal keeps the macros it was logged with.
4. **Ids belong to the catalogue.** An exercise id is whatever
   `exercise-db.json` says it is. `tests/catalogue-ids.mjs` enforces this —
   it found fourteen mislabelled lifts across two screens on its first runs.
5. **Do not remove any existing function.** `freeze-check.sh` compares
   per-screen counts of listeners, actions, buttons, inputs and testids; a
   column going DOWN fails the build.

---

## 4. The demo shell, and the one trap in it

`assemble.mjs` inlines every screen into `locked-demo.html`, one shadow root
each, behind a hash router (`#/train`, `#/train/workout-log`).

Two things about it decide a lot of design:

**Screens are mounted once, at boot.** A screen that reads its keys at module
scope will never see anything written afterwards. Screens re-read on the
`lk:enter` event, which the router fires when a route is entered. **Any new
screen that reads stored data must handle `lk:enter`.**

**The router takes navigation clicks in the capture phase**, because the
screens navigate with `location.href` and that would leave the page. So the
screen's own handler never runs — including the part that writes down *which*
thing was tapped. The router fires `lk:handoff` first, carrying the selector
and the clicked element, and the screen writes its hand-over key there:

```js
document.addEventListener('lk:handoff', function (e) {
  var d = e.detail || {};        // { selector, from, to, el }
  if (d.selector !== '[data-action="open-session"]') return;
  localStorage.setItem('lk_openWorkout', d.el.getAttribute('data-id'));
});
```

Every crossing must be declared in `MANIFEST.nav` in `assemble.mjs`. An
undeclared `location.href` to a screen that exists **throws at build time** —
but only when it is written as a literal. A crossing hidden in a lookup table
or a toast callback slips through, and in the demo it takes the whole page to
`chrome-error://`. Both of those got through this round. **If you add a
navigation, add the manifest row in the same commit.**

---

## 5. What is verified working

Driven with Playwright, every number checked by hand against
`seed-data.json`, every write confirmed to survive a reload:

- **The full training loop.** Train → start a day → log sets → Finish →
  Review → Save → `lk_history` → Train's count moves 22 → 23.
- **Fuel**, all nine log paths, reconciling to the gram; portions round-trip
  exactly; Mifflin-St Jeor TDEE, the adaptive blend with its ±150 clamp, the
  weekly rate, the water goal, micronutrients, the plan generator.
- **Progress**: weigh-ins, body fat, photos, goals, the PR vault, e1RM.
- **Cycle**: day/phase/prediction arithmetic, discreet mode leaking nothing,
  irregular widening the estimate, loss and recovery.
- **Coach**: chat, interview, instructions, plan phases and targets, check-ins.
- **Cross-screen**: body weight, cycle reading, today's calories and macros,
  session/volume/set totals, PBs, the split, supplements, the shopping and
  pantry loop in both directions, the unit switch, the streak.
- Zero console errors and zero page errors across all eighteen routes.

---

## 6. What is deliberately not built, and why

These are **decisions, not gaps**. Each has its local half built and says on
screen what the missing half needs. Plan the server work as its own phase.

| Deferred | What exists now | What it needs |
|---|---|---|
| USDA food lookup | the search UI, the local food table, barcode scan against a local map | a Cloudflare Worker with `USDA_KEY` set. See `14-signoff/WORKER-USDA-KEY.md` — the Worker still has a `\|\| "DEMO_KEY"` fallback to remove at cutover |
| Photo plate reading | file input, the photo stays on device, a worked example clearly labelled as not the picture | a vision model behind a server |
| Coach replies | a keyword router over the seed, gated on the nine data switches | a model, and the privacy contract those switches describe |
| Sync | "Never synced. Not in this build. Nothing has left this device." | an account server |
| Password change | every rule checkable on-device, checked | the account server |
| The 867-exercise library | fetched from `tests/fixtures/exercise-db.json` — works over http, not `file://`, where a six-item inline list stands and the sheet says so | a delivery decision: inline it, or ship it as an asset |

---

## 7. Where the feature backlog stands

`14-signoff/SIGNOFF.md` holds a per-feature sign-off of all **541 v6
features** against this build, with per-area breakdowns in
`14-signoff/areas/` and the raw data in `features.json`.

| Verdict | Count |
|---|---:|
| PRESENT | 128 |
| PARTIAL | 178 |
| MISSING | 169 |
| CUT | 47 |
| N/A | 22 |

By area, worst first by what is missing:

| Area | Present | Partial | Missing | Cut | N/A |
|---|---:|---:|---:|---:|---:|
| Fuel (73) | 8 | 27 | 33 | 3 | 2 |
| Cycle (57) | 10 | 17 | 29 | 0 | 1 |
| Home, Cardio, Goals (50) | 4 | 15 | 22 | 8 | 1 |
| Profile and Settings (74) | 26 | 20 | 18 | 10 | 0 |
| Train (100) | 40 | 34 | 12 | 13 | 4 |
| Shopping, Budget, Supplements (54) | 23 | 16 | 12 | 0 | 3 |

**Note the counts predate this round of fixes** — a good number of the
PARTIALs were closed since. Re-run the sign-off before planning off these
numbers, or treat them as a relative ranking rather than an absolute one.

**Suggested reading order for planning:**
1. `14-signoff/SIGNOFF.md` — the ranked backlog
2. `14-signoff/areas/<area>.md` — feature-by-feature detail
3. `14-signoff/findings/e2e-*.md` — five end-to-end journey reports, which
   are the best evidence of what actually breaks
4. `12-parity/PARITY.md` — v6 parity notes
5. `13-e2e/JOURNEYS.md` — the ten journeys the swarm drives

---

## 8. The five defect classes that keep coming back

This is the most useful thing in this document. Every round, the same shapes
recur. Build the next features with these in mind.

1. **A second copy of shared data.** A screen keeps its own table because it
   was quicker. It drifts, and nothing catches it because each screen agrees
   with itself. *Guard: one resolver per path; read the key.*
2. **A control that toasts instead of doing.** "Added to your split." —
   nothing written. *Guard: the action-coverage suite, and confirming every
   write survives a reload.*
3. **A hand-over that never arrives.** The screen writes the id in a click
   handler the router swallowed, so every row opens the same thing. *Guard:
   `lk:handoff`, and driving the journey rather than reading the source.*
4. **A figure with no source.** "71% confident", "Saved 2 minutes ago",
   "about 50 min". *Guard: every figure must be reproducible from the seed, or
   the sentence must say where it comes from.*
5. **Read-once state in a mounted-once shell.** Works standalone, stale in the
   demo. *Guard: `lk:enter`.*

---

## 9. How to work on it

```sh
cd redesign

# regenerate fixtures after editing the seed (fails on self-contradiction)
node tests/fixtures/gen-fixtures.mjs

# assemble the demo
node 10-final/assemble.mjs

# the whole suite, seventeen of them
cd tests && bash run-all.sh

# one suite
node dynamic-type.mjs

# re-baseline the freeze after a wave of work
python3 11-apple/gen-manifest.py > 11-apple/FEATURE-MANIFEST.md
sh 11-apple/freeze-check.sh
```

Playwright 1.56.1 and axe-core live in `redesign/tests/node_modules`.
Chromium is at `/opt/pw-browsers` — **never run `playwright install`**.
Scratch test scripts go in `redesign/tests/` named `zz-*.mjs`, which is
gitignored.

### The verification standard

**Reading source is not verification.** Drive the screen with Playwright,
press the control, read what comes back, check the number against
`seed-data.json`, then reload and confirm it survived. A screen claiming
something the data does not support is the most important defect class, and it
is invisible to anyone who only reads the code.

---

## 10. Constraints that carry forward

- Free services only.
- No secrets in the client.
- Never invent a key, a table name or a figure.
- Frozen snapshots: a stored log never changes when a table changes.
- One resolver per path.
- Do not remove any existing function — the freeze check must stay green.
- Develop on the designated branch; the suite must pass on the final commit.

---

## 11. Open items at handoff

- The E2E swarm's second pass has not been run against the current head. The
  first pass found 52 defects across five journeys; roughly 40 are fixed and
  pushed. The remainder are the lower-severity tail in
  `14-signoff/findings/e2e-*.md`.
- `FEATURE-MANIFEST.md` was re-baselined at `6798b69`; the freeze check reads
  "nothing lost".
- Task #10 stands: set `USDA_KEY` on the `lockedapi` Worker and drop its
  `DEMO_KEY` fallback. Blocked on credentials, deferred to cutover.
- Not yet built: a service worker, the block duration field and expand toggle
  on Train (F-TRAIN-127, partial), Progress photo prev/next, the onboarding
  `?open=` deep link.
