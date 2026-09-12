# End-to-end brief — use LOCKED like a person, then check the numbers

You are one of ten testers on the LOCKED redesign. Read this whole file
before you touch anything.

## What you are testing, and what you are NOT

The build already has a 17-suite automated check covering rendering,
accessibility, tap targets, focus, press states, contrast and Dynamic Type.
**Do not re-test any of that.** It is green and repeating it wastes the run.

You are here for the two things a test suite cannot do:

1. **Does the app work for a person trying to get something done?** Walk a
   real task end to end. Notice where you get stuck, lost, or have to guess.
2. **Are the numbers right?** This is the higher-value half. A screen that
   renders beautifully and reports the wrong total is worse than one that
   crashes, because nobody catches it. Add things up yourself and compare.

## The build

Assembled demo, all screens in one file with a hash router — **use this for
journeys**:

    file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html

    #/home   #/train   #/fuel   #/coach   #/profile      tabs
    #/train/workout-log   #/home/recap   #/fuel/stack    pushed screens

Standalone screens, one file each — **use these for deep-dives**, because
each carries a dev-state menu that the demo does not surface:

    file:///home/user/everything-claude-code/redesign/08-build/<screen>.html

    coach cycle exercise-library fuel home onboarding profile progress
    recap review settings shopping split-builder stack train tutorial
    workout-detail workout-log

Dev states: click `[data-testid="dev-toggle"]`, then a `.dev__item`. Each
screen declares its own — populated, empty, loading, error, and states
specific to it. Some paths are only reachable through a dev state.

## Running a browser

Playwright 1.56.1 and Chromium are already installed.

    cd /home/user/everything-claude-code/redesign/tests
    # write your script here, then: node yourscript.mjs

**Never run `playwright install`.** Chromium is at /opt/pw-browsers and the
download is blocked. Import from this directory or the module will not
resolve.

Useful: `page.on('pageerror', ...)` and `page.on('console', ...)` — a silent
JS error is a finding on its own.

Outbound network is blocked. Everything is fixture-driven, which is what you
want: the numbers are deterministic, so arithmetic is checkable.

## How to check a number

This is the part to be rigorous about. For every figure you see:

- **Add it up yourself.** If a session says 16 sets and 14,363 kg, count the
  set rows and sum weight x reps. Do they agree?
- **Follow it across screens.** The same session appears on Home, in Train's
  history, in Recap's week, and in workout-detail. Do all four say the same
  thing? A figure that changes as you navigate is a real defect.
- **Check the units.** kg vs lb, ml vs L, kcal vs kJ, mg vs mcg. A unit that
  changes without the number converting is a defect.
- **Check the edges.** Zero, one, empty, the first day, the last day, a week
  with nothing in it. Rounding that reads "0k" for a real figure is exactly
  the kind of bug this run is for — it shipped in the old app.
- **Check what a write moves.** If you log something, the total on screen has
  to move by what you logged. Not approximately. Exactly.

## What counts as a finding

Report it if it is one of these:

- A number that is wrong, inconsistent between screens, or unit-confused.
- A control that does nothing, or does something other than its label says.
- A path a person would reasonably take that dead-ends.
- Copy that claims something the app does not do.
- A JS error in the console.
- A state you can get into and cannot get out of.

Do NOT report: styling opinions, "I would have designed this differently",
or anything the automated suite covers.

## Rules

- **Read-only. Do not edit any app file.** You are reporting, not fixing.
  Scratch scripts in redesign/tests are fine; delete them when done.
- **Verify before you claim.** If you think a number is wrong, compute the
  right one and show your working. A finding without evidence is noise, and
  a wrong finding costs more than a missed one.
- **Say what you could not check.** If a path needs a camera, a network call
  or a real account, say so rather than guessing at it.

## How to report

Finish with a list. Each finding:

    SEVERITY  one line of what is wrong
      Where:    screen, state, and the steps to see it
      Expected: the number or behaviour that is correct, and why
      Actual:   what the app did
      Evidence: your arithmetic, the console text, or the exact copy

SEVERITY is one of: **WRONG** (a number or behaviour is incorrect),
**STUCK** (a person cannot finish the task), **LIES** (the copy claims
something untrue), **ROUGH** (works, but a person would stumble).

Order them worst first. If you found nothing in your area, say that plainly
and say what you covered — a clean report that names its coverage is useful;
a clean report that names nothing is not.
