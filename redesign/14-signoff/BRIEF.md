# Per-feature sign-off — does the redesign do this, and does it work?

One feature at a time, from the v6 catalogue, against the redesign build.

## What you are checking

You are handed a list of features found in LOCKED v6 (the production build
this redesign replaces). For each one, answer two questions:

1. **Is it here?** Does the redesign carry this capability at all?
2. **Does it work?** If it is here, does it actually do the thing — with the
   right numbers, reaching the right screen, changing the right state?

A feature that renders and does nothing is not here. A feature that does
something and reports a wrong figure is here and broken. Say which.

## The build

- Standalone screens: `redesign/08-build/*.html`, openable with `file://`.
- The assembled demo: `redesign/10-final/locked-demo.html`, hash-routed
  (`#/home`, `#/train`, `#/train/workout-log`, …). Prefer the demo when the
  feature spans screens; prefer the standalone when it is one screen's own.
- Shared data: `redesign/08-build/fixtures.js` (`window.LKFixtures`),
  generated from `redesign/tests/fixtures/seed-data.json`. That seed is the
  truth for every figure.
- Playwright 1.56.1 is in `redesign/tests/node_modules`. Chromium is at
  `/opt/pw-browsers`. **Never run `playwright install`.** Any script you
  write must live in `redesign/tests/` so the module resolves.

## Verdicts — use exactly these words

- **PRESENT** — it is there and it works. Name the control and the evidence.
- **PARTIAL** — it is there and something about it is wrong or incomplete.
  Say precisely what, with the figure or the behaviour you saw.
- **MISSING** — it is not in the redesign at all.
- **CUT** — it is not there AND a screen's own design notes say why it was
  removed. Quote the note. (`grep` the screens for the feature's subject.)
- **N/A** — the feature is v6 plumbing with no user-facing behaviour to check
  (a storage key, a migration, a server call this build has no server for).
  Say which.

## How to check, in order

1. **Read before you click.** `grep` the build for the control, the copy, the
   storage key. A feature you cannot find in the source is not there.
2. **Then drive it.** Open the screen, press the thing, read what changed.
3. **Then check the arithmetic.** Where a feature shows a number, recompute
   it from `seed-data.json` yourself and compare. A number that cannot be
   reproduced from the seed is a defect even if the screen is self-consistent.

## What not to do

- Do not edit any file under `08-build/`, `10-final/` or `demo/`. Read only.
- Do not re-test what the automated suite already covers: tap-target sizes,
  focus order, contrast, press states, axe violations, theme parity. Those
  have their own suites. Test **behaviour and figures**.
- Do not mark something PRESENT because a word appears on screen. The
  redesign's own first automated pass scored 391/541 that way and was thrown
  away for exactly this reason.
- Do not guess. If you cannot reach a feature, say so and say what you tried.

## Output

A table, then the detail. The table is one line per feature:

    F-XXX-NNN  VERDICT  one clause

Then, for every verdict that is not PRESENT or N/A, a block:

    F-XXX-NNN — <feature name>
      Expected: what v6 did, from the catalogue entry.
      Actual:   what the redesign does, with the evidence.
      Where:    screen, control, file:line.

End with a count: PRESENT / PARTIAL / MISSING / CUT / N/A.

Be exact and be brief. No preamble.
