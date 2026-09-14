# Per-feature sign-off — all 541 v6 features against the redesign

Eight agents drove the build, feature by feature, recomputing every figure
from `tests/fixtures/seed-data.json` rather than trusting the screen.

## The result

| Verdict | Count | What it means |
|---|---:|---|
| PRESENT | 128 | It is here and it works |
| PARTIAL | 178 | It is here and something about it is wrong or incomplete |
| MISSING | 169 | Not in the redesign, with no decision recorded |
| CUT | 47 | Not here, and a screen's own notes say why |
| N/A | 22 | v6 plumbing with no user-facing behaviour to check |

By area:

| Area | Present | Partial | Missing | Cut | N/A |
|---|---:|---:|---:|---:|---:|
| Train (100) | 40 | 34 | 12 | 13 | 4 |
| Fuel (73) | 8 | 27 | 33 | 3 | 2 |
| Profile and Settings (74) | 26 | 20 | 18 | 10 | 0 |
| Cycle (57) | 10 | 17 | 29 | 0 | 1 |
| Shopping, Budget, Supplements (54) | 23 | 16 | 12 | 0 | 3 |
| Home, Cardio, Goals (50) | 4 | 15 | 22 | 8 | 1 |
| Coach (40) | 3 | 18 | 18 | 0 | 1 |
| Onboarding, auth, system, misc (93) | 14 | 31 | 25 | 13 | 10 |

## The one finding that matters most

**Nothing persists.** Every screen held its state in a variable and rebuilt it
from the fixture on load. Log a meal, tick a set, save a target, answer a
check-in, rename yourself — a refresh threw all of it away. Eight of the eight
reports found it independently. It is the difference between a demo of screens
and an app, and it is fixed first: `08-build/store.js`.

## The three kinds of defect underneath the numbers

**1. A screen says something that is not true.** The worst class, because a
reader has no way to catch it. Copy claimed a barcode had been read when none
had, a photo had been sent when none was, a conversation was "kept in your
history" when there is no history, "Everything on this phone was erased" when
nothing was, and a beta code granted access when the network failed. Each one
is a sentence the build could simply not say.

**2. A figure nobody can reproduce.** Profile counted 84 sessions against a
history of 22. Home's cycle row said Day 16 where the seed says Day 12, and
the screen it opens said Day 16 from a third start date. A weekly spend used
a rolling seven days and called it "this week". Every one of these was
self-consistent and wrong.

**3. A control that does nothing.** "Search for it" carried `data-action=
"close"`. "Find swaps" wrote state nothing rendered. "Track left and right"
was emitted under one key and handled under another. Undo on a removed
exercise dismissed the toast and kept the deletion.

## What cannot work without a server, and what that means here

Some of the 169 need a backend: the coach's replies, photo analysis, meal
generation, multi-source food search, cloud sync, push notifications, the
paywall. This build has no server and no network — by design, and the egress
this session runs behind blocks one anyway.

For those the rule is: build the whole local half, and have the screen say
plainly what the remaining half needs. A consent step that explains what would
leave the device and then says "not in this build" is honest. A button that
toasts as though it worked is not. That distinction is what separates the
handful of acceptable stubs below from the defects above.
