# What changed, and why

Eleven screens rebuilt as static HTML, CSS and vanilla JavaScript that open from
disk. Everything below is a change to the built screens in `08-build/`, assembled
into `locked-demo.html`. Every number is measured, and the script that measured it
is named so it can be re-run.

---

## The flows you asked for

### Sign in and sign up, through to the overview

The two forms are one screen with a real strength meter that says what it is
measuring rather than scoring in silence: length first, and it says so. Errors name
the field and the fix. The password reveal returns the caret to the field it
revealed, so a person who taps it mid-password does not have to find their place
again.

**Continuing as a guest now warns, and advises against it.** The old build treated
guest mode as an equal choice sitting beside the account. It is not: a guest's
splits, logs and history live only in that browser's storage, and clearing the
browser ends them. The screen says exactly that, names what is lost, and keeps
creating an account as the primary action. Nobody is blocked from continuing.

The setup flow runs to the overview without a dead end, and the overview holds its
own empty, error and loading states rather than falling through to a blank.

### The split builder, and the AI builder

**Every AI-built slot offers three alternatives, or you skip and it decides.** That
was the ask and it is what the screen does: open any lift in a generated split and
you get three real options with the reason each one is there, or Accept and move
on. The builder never silently picks for you and never makes you pick.

The manual builder keeps its days, reorders without delete-and-re-add, and warns
before you leave with unsaved changes rather than after.

### The workout page

You said you preferred the original and that a rebuild had stripped it. **The
original design is back.** Only four measured defects were fixed on top of it:
targets under 44px, the keypad's tap cost, a unit label that showed kg values under
an LB header, and the focus loss on every state change. Nothing was restyled.

### Home

Rebuilt around a hero streak figure, a seven-day week track, a sparkline and depth
carried by tone rather than by borders. Its loading skeleton now holds the shape
the screen actually loads into, including the week track, which was missing from
the skeleton and present in every other state — so the old skeleton taught the
wrong shape and then moved everything when the real one arrived.

### Coach

The data-access list gained a **turn everything on** control beside the existing
turn-everything-off, which is what you asked for. Its header now matches its three
tab siblings: an eyebrow above a 22px title. It had been 17px with no eyebrow, so
switching tabs shifted the title five pixels and the bar ten.

### The exercise library, and the body map

The library browses two ways. The list of muscle groups is still there, and a
**Body** switch puts an anatomical figure in its place. Tapping a muscle lands
exactly where tapping that group's row lands — it is a second way to the same
place, not a second flow. The choice is remembered.

The figure is built on real anatomical source art (`react-native-body-highlighter`,
MIT, vendored in `08-build/vendor/body-art.js` with its licence). Four
hand-authored figures were rejected before this, and rightly: a body drawn path by
path from control points reads as cylinders on a vague shape, with no neck,
floating hands and no knees. What this build adds to the source art is the mapping
from its nineteen anatomical slugs to LOCKED's own twelve muscle groups, taken from
the exercise database, so the figure speaks the app's vocabulary. Everything the
twelve groups do not claim — head, neck, hands, feet, knees, ankles — is inert
body: drawn, never selectable, and the reason it reads as a person.

Opening a group shows its regions only where those regions are real. Back divides
into the trapezius, the latissimus and the erectors, which the art draws
separately. Chest divides into upper, mid and lower, which are three heads of one
sheet with no border to draw, so they are the pectoral clipped into three bands.
The other ten do not divide: front, side and rear deltoid are three faces of one
mass, the heads of the triceps and biceps are stacked rather than banded, and the
Abs group's own sub-regions are Weighted and Bodyweight, which is a way of choosing
an exercise rather than a part of anybody. Those go straight to their exercises.
Drawing regions on them would be inventing anatomy.

The exercise detail sheet draws the same figure, small and non-interactive, with
the one group the exercise works lit. It used to draw a second, cruder body of its
own. One app, one anatomy.

### The split follows you

After a workout where exercises were added or swapped, Review asks whether to carry
the change into the split or keep the previous exercises, so a split drifts as a
person's training drifts instead of going stale.

---

## The defect you named

> after clicking any button that changes the state of a variable it makes the
> screen like reset state each time and jump

Measured before the fix: focus was lost on **every** screen, and the scroll
position jumped on two of them — workout log 200 → 41, review 200 → 352.

Every screen rendered by building an HTML string and assigning it to a container.
`el.innerHTML = html` destroys every node inside, so the caret left the field, focus
landed back on the body, the scroller snapped to the top and entry animations
replayed on elements that had not changed.

`08-build/app.js` morphs instead. It matches nodes by `data-testid`, `id` or
`data-key` first and by tag plus position otherwise, writes attributes only where
they differ, writes `value`, `checked` and `selected` only when the markup's own
declaration changed — so a re-render fired by a keystroke cannot touch the field
under the caret — and restores focus, selection and every scroll offset around the
patch. All fifty-six `innerHTML` assignments across the eleven screens go through
it.

Measured after, eleven screens by two themes, `tests/rerender-sweep.mjs`: scroll
held everywhere, caret and value held everywhere with a text field, focus stayed on
the control that was tapped. Two differences are the intended behaviour and are
recorded as such in the sweep: the password reveal returns the caret to the field,
and leaving edit mode in the split builder removes the split-name field.

---

## The light theme

You asked for it to work everywhere, and it did not. Measured on the old build:
`.card--raised` rendered white on a white body — **1.00:1**, so the primary object
on Home had no boundary at all. The light ramp was not monotonic and its two
highest levels were identical.

Light now has a genuine four-step ramp (L\* 88.05 → 92.53 → 96.61 → 100.00), a
`--border` raised from 1.51:1 to 3.44:1 on surface, its own anatomy palette, and a
`--knob` token because the switch knob had been following `--text` and inverting.
Measured across 226 states in both themes: zero axe violations, zero sub-AA text,
zero console errors.

`theme.js` reads the stored choice before first paint, so there is no flash. Checked
with a 137-frame screen recording.

---

## Colour

The anatomy palette was pastel — rose, periwinkle, sage, orchid — and read soft. It
is now crimson, electric blue, violet, magenta, hot orange, and the arm and leg
families in teal through azure and olive through spring.

Every colour is solved rather than picked: the most chromatic colour sRGB can show
at that hue, inside a narrow lightness band, that still clears the contrast bar on
its theme's ground. The lightness band is the part that matters — at the top of the
gamut the greens and cyans climb almost to white and read as highlighters however
much the saturation is capped.

Hue spacing follows what touches what rather than an even wheel. The quadriceps and
the adductors share a thigh, so they sit further apart than any other leg pair. The
closest two hues in the set are the adductors and the forearms, and those never
appear beside one another: one is on a thigh, the other on an arm.

Abs is a hot orange, the one colour the palette had been keeping clear for the
accent. It is 14.6 from `--accent` by CIEDE2000, which is plainly a different
colour, and the accent only ever appears as a filled button while the body is a
diagram. If it ever reads as an action, the accent moves, not the anatomy.

Measured: dark clears 5.43 on the page ground at worst, light 3.16, and every seam
between two touching muscles clears 3:1 against the muscle it separates. Both tables
are in `tokens.css`.

---

## Consistency work

| Was | Now |
|---|---|
| Thirty shared rules set a type size and dropped the tracking token, so identical 13px text tracked two ways depending on which class an author reached for | Every rule that sets a size sets its line height and tracking. Measured: 0 remaining |
| Sixty-six rendered numeric nodes were not tabular, so one side of a record row aligned and the other did not | The three smallest type helpers carry tabular figures. Prose and chat stay proportional, which is correct |
| Coach's header was 17px with no eyebrow against three siblings at 22px with one | All four tab screens: 62px tall, 22px/700 title, eyebrow present |
| Split-builder used a 17px sentence-case heading for sections against five screens using an 11px uppercase label | Uses the shared label. `.t-label` count went 2 → 6 |
| Split-builder had its own copy of the one-of-N row and its own dev inspector under its own names | Uses the shared `.opt` and the shared `.dev`, so no two screens show the same act two ways |
| `.hero__value` was a byte-for-byte duplicate of `.t-hero` — two places to change one thing | Gone; the screens use `.t-hero` |
| `.mt-1` was used and never defined | Defined |
| Five rules nothing referenced: `.carousel`, `.media__note`, `.pad__key--action`, `.seg--wrap`, `.stack--5` | Removed |
| The demonstration stand-in borrowed the body map's class names for a drawing that is not anatomy | Renamed `.demofig` |
| The body map's own selection rule keyed off an ancestor a sheet does not have, so a figure in a sheet showed every muscle lit | The flag is on the figure itself |

`tests/cleanup-audit.mjs` re-runs all of this. It reports **zero** unused selectors,
one header shape across the tab screens, and five type sizes, five radii and two
durations across the whole build.

Two things that audit gets wrong if written naively, both of which produced false
alarms the first time and are handled in the script rather than left for a reader:
a class built by joining strings never appears in the DOM until the interaction
that builds it, and an SVG element's computed font size is in user units, not CSS
pixels — the body map's callout labels read 6.8, which is 11 divided by the viewBox
scale and renders at exactly 11.

---

## What is deliberately not fixed

**Four muscles fall short of the 44px target rule and no margin will fix them.** A
deltoid is a crescent with the pectoral on one side and the biceps on the other.
Measured inscribed circles: 32px for shoulders and the front trapezius, 40px for the
adductors from behind. All clear WCAG 2.5.8's 24px minimum, all are keyboard
reachable in anatomical order, and search is on screen at every stage, so the map is
never the only way to a muscle. The numbers are pinned in `tests/bodymap-audit.mjs`,
so a regression still fails. What would actually fix them is a larger figure on
separate front and back views, which is a design change rather than a tuning one.

**Three screens have a zero page gutter** — exercise library, body map, onboarding.
That is `body--flush`, used deliberately for full-bleed lists, not a disagreement.

**Onboarding keeps its own inspector.** It is a full-screen index of a
seventeen-step flow, not the corner state dropdown every other screen has, so it is
a different thing rather than a duplicate.

**The front-view triceps is gone.** From the front it is a sliver behind a 30px
upper arm that left the biceps beside it untappable. It is a whole group on the
back view, which is where anyone looks for it.

---

## Verifying it

```
cd redesign/10-final && node assemble.mjs && node verify-demo.mjs   # 86/86
cd redesign/tests
node rerender-sweep.mjs      # 22/22, eleven screens by two themes
node bodymap-audit.mjs       # targets, axe and console, both themes, four stages
node tap-test.mjs            # 17/17 muscle groups select correctly
node cleanup-audit.mjs       # unused selectors, cross-screen measurements
```

The demo opens from disk. No build step, no server, no network.

---

# The Apple wave

Everything above described eleven screens. This wave added two, rebuilt the
chrome and the foundation underneath all thirteen against
`11-apple/apple-design-spec.md`, and put the app on five tabs.

Nothing was removed. `11-apple/freeze-check.sh` counts the interactive
elements, actions, testids, forms and text blocks on every screen and fails
if any of them drops; it is the first thing `tests/run-all.sh` runs.

## Five tabs

Home, Train, Fuel, Coach, Profile. Progress moved under Home, the exercise
library and the workout log sit under Train, Shopping and Budget live inside
Fuel, Settings under Profile. Every tab is a real screen — none is a
placeholder, and `assemble.mjs` throws rather than rendering one if a tab's
screen file is missing.

## Two screens built

**Fuel.** One number, two ways to log it, and a meal list that says where
each figure came from. A verified badge means a barcode matched a database
row; an estimate badge means a model read a photo. The camera path asks the
one question that moves the figure — oil — and adjusts the estimate with the
answer. Water, supplements, trends and the meals you log often are sheets off
the same screen. Shopping and Budget are a pushed screen inside the tab: a
list that merges by unit and refuses to add teaspoons to pounds, a pantry the
receipt scanner writes into, and a budget that reads from real purchase
history.

**Profile.** Identity, four totals, records, badges, and the settings screen
pushed behind it.

## The foundation

**Springs.** Three sampled `linear()` easings, measured rather than eyeballed:
smooth never overshoots, snappy peaks at 1.0063, bouncy at 1.046.

**Type.** Eleven Apple roles, every size in `rem` and every tracking in `em`,
so the whole ladder scales with the reader's setting. At the default root it
renders exactly Apple's table — 11, 12, 13, 15, 17, 22, 28, 34. At AX5 it is
34 to 106 and no text is clipped on any screen: buttons and chips wrap, list
rows wrap rather than crush their title column, the set grid sizes to its
content and scrolls, and the tab bar drops to icons through a container query
whose `em` scales with the setting — hidden the way `.vis-hidden` hides text,
so "Profile, tab" is still the accessible name.

**Glass in the chrome only.** The floating tab bar and the bottom find bar,
and nothing else. Zero content glass, enforced by `tests/apple-foundation.mjs`.

**Corners.** `corner-shape: squircle` — the continuous corner iOS draws —
applied to 168 elements as progressive enhancement over a radius every
browser already renders. 130 capsules deliberately opt out, because a
superellipse flattens a capsule.

**Press.** 52 of 52 kinds of control take a spring on release. Colour answers
in 150ms; anything that moves or fades runs on a spring at 300ms.

## The chrome

The large title collapses over 52px of travel into a 44px bar, interpolated
rather than switched. The tab bar floats inset from three edges as a glass
capsule and collapses to the active tab on scroll rather than leaving the
screen. Sheets are inset with concentric corners, spring from the control
that summoned them, show a grabber only where detents exist, and interpolate
their full-bleed geometry over the last stretch of the drag.

## One accent

One accent fill per surface, on the primary action, in every state every
screen declares. The audit reads SVG as well as HTML and treats an open sheet
as its own surface. Second and third hues are semantic only: green is a state
that is on, red is a consequence.

## Verifying it

```
sh redesign/tests/run-all.sh
```

Fourteen suites: the freeze check, springs and type and glass, the chrome,
squircles, press states, re-render, every screen in every state in both
themes through axe, the body map, accent budget, focus, skeletons, Dynamic
Type at AX5, dead controls, and the assembled demo.
