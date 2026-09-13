# Building the 175 — the brief every package works from

You have a work package: `14-signoff/work/<your-wp>.json`. Every row is one
feature, with its verdict against the build, the gap in a sentence, where it
lives, whether it needs a server, and an effort size. Your job is to close
every row in your file.

This is a **product**, not a demo. Someone will install it and put their
training into it.

## 1. Your files, and nobody else's

Your package names the files you own. Seven other packages are running at the
same time against other files. Do not touch a file you do not own, and do not
touch the shared modules unless yours is the package that owns them — read
them and use them instead.

`components.css` is shared. If you need a class, add it at the **end** of the
file, in one block, under a comment naming your screen. Never edit a rule that
is already there.

## 2. The order of work

1. **Anything that says something untrue.** A screen claiming a thing happened
   that did not. Fix the behaviour where you can; where you cannot, fix the
   sentence. Never leave a claim the build cannot back.
2. **Any figure that cannot be reproduced from `tests/fixtures/seed-data.json`.**
   Recompute it from the seed. If two screens disagree, the seed decides.
3. **Any control that does nothing.** Wire it, or remove it.
4. **Then the features**, largest gap first.

## 3. What "done" means

A row is done when you have **driven the behaviour and seen it work** —
not when the code looks right.

- Playwright 1.56.1 is in `redesign/tests/node_modules`; Chromium is at
  `/opt/pw-browsers`. **Never run `playwright install`.**
- Screens open from `file://`. The 867-exercise library needs http: run
  `python3 -m http.server` from `redesign/` when you need it.
- Scratch scripts go in `redesign/tests/` named `zz-<your-wp>-*.mjs`, and you
  **delete them** before you finish. That pattern is gitignored.
- Every write must survive a reload. Check it.

**Reading source is not verification.** A screen that claims something the
data does not support is the defect class this build keeps producing, and it
is invisible to anyone who only reads the code.

## 4. Server-dependent rows

53 of the 175 cannot be finished without a backend (Supabase and Cloudflare,
at cutover). For those the rule is:

- Build the **whole local half** — the form, the validation, the state, the
  storage, the empty and error states.
- Have the screen **say plainly what the remaining half needs**, at the point
  of use.
- **Never fake the missing half.** A button that toasts as though it worked is
  the worst thing you can ship. A consent step that explains what would leave
  the device and then says "not in this build" is honest and correct.

Leave the row's verdict as `NEEDS_SERVER` and say in `gap` exactly what is
still required.

## 5. Rules that hold everywhere

- **One resolver per path.** If two screens need the same fact they read the
  same key through the same helper. Never keep a private copy.
- **Never invent a key, a table name or a figure.** The keys are the shipped
  app's own.
- **Exercise ids belong to the catalogue.** `tests/catalogue-ids.mjs` fails the
  build on an id under the wrong name.
- **Frozen snapshots.** A stored log never changes when a table changes.
- **Do not remove any existing function.** `11-apple/freeze-check.sh` fails on
  a screen that loses one.
- **It must work with no seed.** `tests/empty-state.mjs` loads every screen
  with `fixtures.js` blocked: nothing throws, something renders, no figure
  prints as a hole, and no screen shows the seeded persona's training. A new
  account has none of it.
- **Screens mount once in the demo.** Anything that reads stored data must
  re-read on the `lk:enter` event.
- **A declared crossing must be greppable.** If you add navigation, add the
  `MANIFEST.nav` row in `10-final/assemble.mjs`... unless you do not own that
  file, in which case say so in your report and do not navigate.

## 6. Cutting

You may mark a row `CUT` when keeping it would be wrong — but only with a
reason written into the screen's own source, as a comment, saying why. A cut
with no recorded reason is a gap pretending to be a decision. Be sparing:
prefer building it.

## 7. When you finish

1. Run the suites you can: `node tests/empty-state.mjs`,
   `node tests/catalogue-ids.mjs`, and any screen audit that covers your files.
2. Delete your `zz-*` scripts.
3. **Rewrite your work package file** `14-signoff/work/<your-wp>.json` with
   each row's `verdict` updated to what is now true (`PRESENT`, `NEEDS_SERVER`
   or `CUT`), and `gap` rewritten to what remains — empty when nothing does.
4. Report to stdout: how many rows you closed, which you did not and why, and
   anything you found that is outside your package and needs somebody else.

Do not commit. The parent integrates, runs the full suite and pushes.
