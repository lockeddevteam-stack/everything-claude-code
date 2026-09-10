# Answering the ship review

The design review's verdict was DO NOT SHIP, with thirteen ordered items.
This is what happened to each, measured the same way it was found.

Its full text is in `review-design.md` and is unedited. So are
`review-bugs.md`, `review-ux.md`, `review-code.md` and
`review-features.md` — five reviews, none of them corrected after the fact.

---

## The two it called non-negotiable

**1. Accent discipline — one fill per screen, on the primary action only.**
Done, and now enforced. `tests/accent-audit.mjs` counts every element that
carries the accent as a fill or as ink, per screen, and fails on a second
fill.

| screen | fills before | fills now |
|---|---|---|
| workout-log | 3 fills, 43 inks | 1 fill, 2 inks |
| fuel | 4 | 1 |
| every other screen | 0 or 1 | 0 or 1 |

The workout log is where it mattered. Green is now a set that is done —
the state this build already spells green for a picked-up item, a taken
supplement, a verified figure. Orange is Finish and the ring on the set
you are on: the one action and the one instruction. Red is Discard.
Fourteen orange squares in one fold had made the accent mean "a set"
rather than "the thing to do".

Fuel's three macro meters went quiet. They report; they do not ask.

**Fuel's split button stays as it is, and this is a disagreement.** The
review reads "Say it" and "Snap it" as two co-equal primaries cancelling
each other. They are two halves of one control, in one capsule, divided
by a hairline — and Concept D, which this screen was built from, states
the reason: voice and camera are the same job done two ways, and neither
is the fallback. A single button with a mode is a mode to get wrong. The
count is one fill, and the fill holds one job.

**4. Dynamic Type.** Done. Every `--type-*` and `--lh-*` is `rem`, every
`--tr-*` is `em`. At the default root the rendered ladder is byte-for-byte
what it was — 11, 12, 13, 15, 16, 17, 22, 34 — and at AX5 it is 36 to 113
with no screen overflowing sideways. `tests/dynamic-type.mjs` checks both
halves on all thirteen screens.

Two things were in the way and went with it: `html` carried
`font-size: var(--type-15)`, which in a rem build means every rem resolves
against the value just overridden — the whole ladder had silently shrunk by
15/16. And `"SF Pro Text"` came out of the font stack, because naming the
Text optical size pins every size to it.

---

## The rest

**2. Second and third hues, semantic only.** Already true and now checked:
the only green fills in the build are a switch that is on, a tick that is
ticked and a set that is done; the only red fill is the swipe-to-delete
pane. Both are state and consequence, never emphasis.

**3. `mockup-bodymap.html`.** Not a screen. It is a harness for driving the
body map on its own, and it lives in `09-review/lab/` now, where the
assembler and the manifest generator cannot mistake it for one. Everything
the review scored it down for — 6.72px labels, sub-AA contrast on them, thin
muscle strips — is true and ships nowhere: the body map inside
`exercise-library` and `progress` renders no text at all.

**5. The two visible bugs.** Coach's half-faded title at rest was the tab bar
and the title reading the chat's own scroll-to-latest as a person scrolling
down; the chrome now hides only for input that means a person did it. The
16px/12px first-gap difference is gone.

**6. Capsule buttons.** Done, buttons and search fields. `radius = height / 2`,
per the spec. A 12px radius on a 44px button is the shape every web framework
ships, and because it was on every button it was most of why the build read
as a page.

**7. Native selects.** They keep the platform's picker — on iOS that is the
wheel, and nothing a page builds beats it — and lose the platform's chrome.
`appearance: none`, and the chevron is the build's own glyph at the build's
own stroke.

**8. Motion floor.** Not raised, and here is the reasoning. The review counts
1,125 transitions at 150ms and reads them as motion below the 200ms floor.
They are `background-color`: a control's colour answering a finger. The spec's
200–500ms band is for the spring, and the spring is where the build puts it —
press is `transition-duration: 0s` going down and `--spring-bouncy` over
300ms coming back, sheets rise on `--spring-snappy` over 300ms, the week
marks and the toast use the same. A colour change that eases over 200ms feels
late, which is the thing §4 is trying to prevent.

**9. Floating tab bar.** Done. A capsule, inset, with a specular highlight and
a hairline all the way round, and content scrolling under the glass. The
accessory shelf and the bottom search bar float with it — a bar that floats
over content also floats over whatever used to sit under it.

**10. Sheets.** Inset, all four corners at `--r-xl`, squaring off only at the
top of their detent range the way the system's do. Detents on the two sheets
in the build that had content below the fold; a grabber only where a sheet
actually moves. The body takes the space between head and foot, so a primary
button sits on the sheet's bottom edge.

**11. The clip-path corner fallback. Deliberately not shipped.** I built the
test case before deciding: a `clip-path` squircle removes the element's border
and its entire shadow, because a clip cuts everything outside the path
including both. A card that loses its 1px boundary and its elevation in
Safari and Firefox is worse in those browsers than a circular corner is. The
build treats `corner-shape` as progressive enhancement: 179 elements are
smoothed where it resolves, 113 capsules are deliberately left circular
because a superellipse flattens a capsule, and everywhere else the corner is
a plain arc. `tests/squircle-check.mjs` holds both halves.

**12. Demo scaffolding.** The state chip left the header's trailing action
slot, where it covered New on coach, Account on home, Edit on train and
Finish on the workout log. It is a tab at the middle of the left edge now,
mostly off the screen at rest, under every overlay.

**13. Icon cleanup. Partly, and partly a disagreement.** The workout log's two
optical sizes are one; the tick's stroke ratio matches the family; the "W"/"T"
letters are gone.

The food emoji stay. Every icon in the build's *interface* is one family —
one 24-unit grid, 20×20, 1.75 stroke, round caps. The emoji are not
interface: they are the food, in the two screens that are about food, and
they are the fastest way to tell a chicken breast from a salmon fillet in a
list you scan while walking a shop. A monochrome line drawing of a chicken
breast is a worse chicken breast.

---

## What holds it now

`sh redesign/tests/run-all.sh`. Thirteen screens, every state each one
declares, both themes.

| suite | what it fails on |
|---|---|
| freeze | a function lost, or a screen gone |
| foundation | a spring that is an ease, glass on content, a missing type role |
| chrome | collapse, minimize, scroll edge, and a real pointer drag between detents |
| squircles | a smoothed capsule, or a lost superellipse |
| press | a kind of control with no pressed state |
| re-render | focus, caret or scroll lost to a re-render |
| screens | a console error, an axe violation, a sub-44px target, an undefined class, a dangling aria reference, two controls sharing an edge, a tab bar that has drifted |
| body map | a group that cannot be selected, or reach measured from the window |
| accent | a second accent fill on one screen |
| skeletons | anything on screen moving when the real content arrives |
| dynamic type | the default ladder off Apple's scale, or AX5 moving nothing |
| actions | a control after which nothing changes, or a confirmation that only dismisses itself |
| demo | the assembled build: navigation, chrome per shadow root, the body map painted |
