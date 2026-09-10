# Answer to the third review round

Three reviewers, three reports:

- `review-design-3.md` — Apple design manager, third ship review. 25/30, up from
  15 and 19. DO NOT SHIP on one blocker.
- `review-sweep-3.md` — third end-to-end bug and UX sweep. Nineteen findings,
  five high, eight medium, six low. All nineteen round-2 findings verified fixed.
- `review-features-3.md` — feature completeness against "dont remove any
  functions of the app".
- `review-code-2.md` — code review of the diff. Fourteen findings.

Everything below was re-measured after the change.

---

## The design review's blocker

**At AX5 the workout log's primary action was off the screen.** `Finish`
measured `left 322 -> right 490` in a 393px viewport in six of nine declared
states, and `left 429 -> right 597` — entirely off screen — in the other
three. A person who has turned the type up could not end their workout.

Cause: `.sess` is a flex item and a flex item's default `min-width` is `auto`,
which resolves to its own min-content width. It measured 474px inside a 393px
header and simply hung over the edge; its own wrapping could never fire
because it was never made to fit. `flex: 1` with `min-width: 0` fixes it, and
`.sess__main` takes the same em floor as `.row__main` so the actions wrap to
their own line when the title needs the row.

**The suite could not see it, and that is the more important half.** Clipping
is not the only way to lose a control: a button pushed off the side keeps its
text intact and `scrollWidth === clientWidth`. `dynamic-type.mjs` now also
asserts that every control is inside the viewport at AX5 unless something
above it scrolls sideways on purpose. It reproduced all four of the review's
findings on the first run, including two the review had not named.

All four are fixed: Review's action bar wraps rather than letting Save hang
11px over; Shopping's segmented control scrolls with snap points so "Budget"
is reachable instead of sitting at `left 382`; Home's week track scrolls with
an em floor per day, where seven columns at 4.7px had been holding labels 15
to 23px wide. At the default ladder the floor is 27px against the 27.8px the
columns already measured, so nothing moves.

## The claim that did not survive re-measurement

`spec-compliance-2.md` said the large-title band had 52px of travel. It had
**0**. `min-height: 96px` beat the inline `height` that `chrome.js` writes
every frame, so the bar measured 96px collapsed as well as at rest, with a
17px centred title floating in 52px of dead air.

The floor comes off while the collapse is driving it. Measured: 96 at rest,
76 at scrollTop 20, 56 at 40, 44 collapsed, 96 again on the way back.

This is the second review in a row to catch a claim in this document that the
render contradicted. Both times the fix was a line. The lesson recorded here
rather than in a commit message: a figure in this file is worth nothing
unless a script in `tests/` asserts it, and both of these now have one.

## Crossings that named controls which do not exist

Two, found independently by the design review and the feature audit. `Finish`
on the workout log was declared `[data-action="finish"]` where the button is
`data-act="finish"`, so **Review — a finished 996-line screen — was reachable
by no tap at all**, and pressing Finish toasted "Opening review." and stayed
put. Coach's Start had the same mismatch.

A crossing whose selector never matches is silent: the demo's handler does
not fire, the screen's own runs instead, and nothing says anything. So
`tests/nav-selectors.mjs` reads the nav table out of `assemble.mjs`, opens
each source screen, walks every state it declares, and asserts the selector
matches. A source grep cannot answer this — the markup is built by string
concatenation and a testid like `'chip-' + id` is never adjacent to its
attribute in the file — so it falls back to the source only to tell "renders
behind an interaction" from "does not exist".

---

## Three screens rebuilt

The feature audit found three screens dropped with nothing anywhere saying
so. The standing instruction on this rebuild is that no function of the app
is removed, so all three are back.

**Coach Check-in.** The shipped app recorded how a person felt, not just what
they lifted, and writing that fed the coach. Three surfaces still promised it:
the permission row listed "Check-ins — sleep, soreness and stress you have
entered", the intro line claimed to read it, and Settings shipped a daily
reminder for it. Four panes now — Chat, Plan, Check-in, Setup — with the five
readings the original asked for. Tapping a number again clears it, because a
mis-tap on a five-point scale is the likeliest thing to happen here.

**Workout Detail.** 773 lines in the shipped app, and every history row on
Train pointed at it. It is not Review: Review is the five seconds after the
last set, about deciding; this is read cold days later by somebody asking what
they did and whether it was heavier. It leads with the sets, each carrying
what it was last time. Session notes, per-exercise notes and "how it felt" —
all three lost, all three back, and the last of those was being recorded by
the workout log with nothing anywhere displaying it.

**Cycle tracking.** 1,032 lines, and the one thing in the build that changes
how the training advice should read. Gated as it was — the shipped app keyed
on `lk_profile.sex`; here it is a switch the person sets themselves, which
says the same thing without asking anybody to declare something to get at a
feature. The phase and the day count are arithmetic on two numbers and the
copy names them an estimate every time. It does not diagnose, it does not
warn, and it never tells anybody they are late.

## Labels that promised more than the code did

- **Swap replaced nothing.** "Swap exercise" opened the *add* picker, which
  pushes: five exercises became six. It replaces in place, and the sets stay,
  because a swap is "I did this movement instead" and the weights already
  entered are the reader's work.
- **Discard discarded nothing.** It toasted "Workout discarded." and left all
  five exercises and every set on screen — the worst outcome a destructive
  confirm can have, because the reader believes their session is gone.
- **Cardio logged nothing.** A tap toasted "Logged Treadmill run" over a chart
  that still read 120 min in 4 weeks. It asks for the duration first, then
  moves the chart, the total and the history. Two bugs fell out of wiring it:
  the four-week figure counted the four weeks *before* this one, so anything
  logged today landed outside its own total; and a hand-logged record has
  minutes and nothing else, where the history line printed "undefined km".
- **The Resume shelf did nothing**, on Home and Fuel, standalone and in the
  demo. Home had no application click listener at all.
- **A guest could never become an account holder.** Onboarding is a
  seventeen-step flow nothing pushed.
- **Twelve cross-screen toasts** described what a working button would do.

## Settings that were named everywhere and existed nowhere

Fuel's hidden state says "Numbers are off in Settings" and there was no such
control. Profile's own source comment says badges are "a setting, off unless
somebody turned them on" and there was no such setting. Both exist now, and
both are written where the screens that name them can read them — the way the
theme already is. They are the default on those screens, not an override: the
dev switcher still wins, because that is what it is for.

## Fuel's brief, closed out

- **The Verified badge could not be earned.** It rendered on two seeded rows
  and nothing in the app could produce one, which made it a decoration rather
  than a claim. The barcode path is back as a third fast path. A real scanner
  is a camera permission and a decoder; what a static build can be honest
  about is the resolve step, which is where the claim comes from.
- **The macro targets could not be set** — not on the screen and not in
  Settings — and the whole screen is measured against them. The card is a
  button and the sheet behind it writes all four figures.

---

## What is still not done, and why

**Recipes** and **saveable coach cards beyond the plan and the split** are not
rebuilt. Both are content-management features rather than training ones, and
neither has a surface in the build that promises them. Recorded here rather
than left for a fourth review to find.

**Per-exercise equipment override**, which drove the original's plate
calculator, is not back. The plate calculator is, and it reads the session's
unit; the override was a per-exercise setting with one consumer.

**Superset and left/right tracking** now toggle and say which way they went,
but nothing downstream reads them — the set grid does not yet render a
superset bracket or two columns. The state is honest; the display is not
built.

**Stroke weight is still a constant 1.75px** regardless of the adjacent text
size, so §2.1's weight-matching is unimplemented. The design review has noted
this three times and not blocked on it; it is a real gap and it is not
pretended otherwise.

## The three refusals from review 2, re-argued

The design manager accepted two and rejected one.

**Unconditional dimming — accepted.** Every sheet in the build is
`aria-modal="true"`; §8.6's condition is met by every member of the set, so a
branch on it would be dead code.

**The 56px tab bar — accepted.** §5.1's 49pt describes a bar welded to the
bottom edge with the home indicator below it: 83pt of bottom chrome. This one
floats clear on three sides and totals 68px.

**Opaque sheets — rejected, and the rejection is right. Done.** The argument
covered the numeric pad and generalised past it. The scrim is
`rgba(0,0,0,0.5)`, not opaque, so there *is* content behind every sheet at
half strength, and the build now has genuinely partial-height sheets sitting
over a live screen.

The glass is scoped exactly where the reviewer said: `.sheet[data-detents]`,
which is the same condition §8.6 names — a partial-height sheet, inset, over
content the reader is meant to keep seeing. The full-bleed pad, the account
sheet and the session picker stay opaque, because there is nothing behind
those worth a 20px blur.

One departure from the tab bar's recipe, on purpose: the tint is the ground
at 92% rather than the bar's 82%. A sheet carries dense numeric content and
its contrast budget is not the tab bar's five words. The material reads as
glass from the blur and the saturation; the text sits on a ground that
measures what it did before. Verified in both themes on progress, shopping
and fuel — `saturate(1.8) blur(20px)` over `0.92` alpha, and every screen
with a sheet still passes its contrast audit. Reduce Transparency drops both
the blur and the alpha, like the rest of the chrome.
