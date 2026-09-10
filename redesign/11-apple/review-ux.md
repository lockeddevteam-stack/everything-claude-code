# UX interaction review — 08-build

Method: Playwright 1.56.1 / Chromium, 393×852, `file://`, every screen in every
declared dev state, both themes (`localStorage.lk_theme = dark | light`).
Scripts: `redesign/tests/agent-ux-*.mjs`. Screenshots:
`/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/`.

Everything below was reproduced in the browser and looked at, not read out of
the source. Nothing was fixed.

Ordered most severe first.

---

## 1. review — the Discard confirmation's buttons are hidden underneath the pinned Save bar

**Screen** `review.html`, state `record` (default) and `populated`
**Selector** `[data-testid="action-discard"]` → `[data-testid="action-discard-confirm"]` / `[data-testid="action-discard-cancel"]`, occluded by `[data-testid="actionbar"]`

**Steps** Open review. Scroll to the bottom of `[data-testid="review-scroll"]`.
Tap **Discard session**.

**What happens** The red "Discard this session — The 16 sets you logged are
deleted…" banner appears, but the two buttons it arms sit at `y 800–844`, and
the pinned action bar occupies `y 784–852`. Both **Keep it** and **Discard**
are completely covered by the Save bar. The page does not scroll to reveal
them. Playwright needed `force: true` to hit them at all. Measured:

```
action-discard-cancel   top 800  bottom 844
action-discard-confirm  top 800  bottom 844
actionbar               top 784  bottom 852   viewport 852
```

**Why it is wrong** A confirmation the user cannot see is a dead end in both
directions: they cannot confirm and they cannot cancel, and the screen gives no
hint that anything is below the bar. The banner *shouts* that 16 sets are about
to be deleted and then hides the escape hatch.

**Smallest fix** After `S.discardArmed = true; paint(true)`, scroll the armed
section into view:
`document.querySelector('[data-testid="section-discard"]').scrollIntoView({block:'end'})`,
or give `.body` bottom padding equal to the action bar's height so the last
section can never sit under it.

---

## 2. review — confirming Discard produces no feedback at all

**Screen** `review.html`, state `record`
**Selector** `[data-testid="action-discard-confirm"]`

**Steps** Arm the discard, tap **Discard**.

**What happens** The screen returns to exactly the pre-arm state: the plain
"Discard session" button, the same receipt, the same "Save session" bar. No
toast, no navigation, no status. `document.querySelector('.toast')` is `null`
immediately after the click and stays null.

Cause is an ordering bug in the handler:

```js
case 'action-discard-confirm':
  S.discardArmed = false; paint(true); toast('Session discarded. Nothing was written.'); return;
```

`toast()` only writes `S.toast` and starts a 4 s timer — it never repaints. The
repaint already happened, so the toast slot renders the *old* (empty) toast, and
4 s later the timer clears it and repaints. The message never appears. The
neighbouring `action-save` case in the same file has the calls the right way
round (`toast(...)` then `paint(true)`), so save works and discard does not.

**Why it is wrong** The most destructive action on the screen is the one action
that says nothing. The screen looks untouched, so the natural read is "it didn't
work" and the natural next move is to tap Discard again.

**Smallest fix** Swap the two calls: `toast('Session discarded. Nothing was
written.'); paint(true);` — matching `action-save` two cases above.

---

## 3. settings — the destructive button receives focus when a confirmation opens

**Screen** `settings.html`, state `signed-in`
**Selector** `[data-testid="confirm-reset"]`, `[data-testid="confirm-delete"]`, `[data-testid="confirm-sign-out"]`

**Steps** Scroll to the danger zone, tap **Erase everything on this phone**.

**What happens** The alertdialog opens and keyboard focus lands on
**Erase everything** — visible as the orange focus ring on the red button in
`set-row-reset.png`. Measured `document.activeElement`:

```
row-reset   -> confirm-reset  / "Erase everything"
row-delete  -> confirm-delete / "Delete account"
row-sign-out-> confirm-sign-out
```

The code takes the first button in the dialog, and the destructive button is
always first: `overlay.querySelector('.dialog button')`.

**Why it is wrong** One Space or Enter after opening the dialog erases every
workout, split and record with no further step. The confirmation is otherwise
the best in the app — it names exactly what goes — and this undoes that care.

**Smallest fix** Focus the cancel button instead when `c.danger` is true:
`overlay.querySelector('[data-testid="cancel-' + id + '"]')`, falling back to
the existing selector.

---

## 4. shopping — three destructive deletes with no confirmation and no undo, on the screen that gates the safe ones

**Screen** `shopping.html`, panels Budget / Stores / Pantry
**Selectors** `[data-testid="del-h1"]` (and `del-h2`, `del-h3`),
`[data-testid="store-del-s1"]` (and `s2`, `s3`), `[data-testid^="pan-remove-"]`

**Steps** Budget panel → scroll to History → tap the **×** on the
"Costco · RECEIPT · $52.40" purchase. Or Stores panel → tap the **×** on Walmart.

**What happens** The row vanishes instantly. No dialog, no toast, no Undo.
`shopping.html` contains zero toast code (`grep -c toast shopping.html` → 0),
so nothing on this screen can ever confirm a deletion after the fact. On the
Stores panel the removed shop is also re-added to the Quick add chip row, which
re-wraps and shifts every row below up by ~68 px — the row you were about to
tap moves under your finger.

The same screen wraps **Clear done** — which only removes items you already
ticked off — in a full `role="alertdialog"` that counts the items and promises
"Your pantry and your history are untouched."

**Why it is wrong** The gating is inverted: the recoverable action is confirmed
and the unrecoverable ones are not. Deleting a receipt destroys a $52.40 record
with itemised lines on a single mis-tap, next to a toggle 44 px away.

**Smallest fix** Route `del-hist`, `store-remove` and `pan-remove` through the
existing `S.sheet` confirmation dialog already built for `clear-all` /
`clear-done`, naming the row (`Remove the Costco purchase of $52.40 on Sep 5?`).
Minimum viable: an undo toast — but the screen has no toast machinery, so the
dialog is the smaller change.

---

## 5. exercise-library — Undo reports "Removed again."

**Screen** `exercise-library.html`
**Selector** the toast action button after `[data-testid="row-day-push"]`

**Steps** Open any group → open any exercise → **Add to a split day** → pick
**Push**. Toast: `Added Incline Barbell Press to Push, PPL v2.  [Undo]`.
Tap **Undo**.

**What happens** Toast reads **"Removed again."**

```js
undo: function () { S.toast = null; render(); toast('Removed again.', false); render(); },
```

**Why it is wrong** Nothing was removed before, so "again" describes an event
that never happened. The user just undid an *add*; the confirmation implies a
second deletion and leaves them unsure whether the exercise is in Push, was
removed once, or was removed twice.

**Smallest fix** `toast('Removed ' + name + ' from ' + dayName + '.', false)`,
or simply `'Undone.'`.

---

## 6. Every large-title screen slices its eyebrow in half when the title collapses

**Screens** `progress`, `train`, `fuel`, `exercise-library`, `coach`
**Selector** `[data-large-title] [data-title-large]` — the `.t-label` eyebrow inside it

**Steps** Scroll the main scroller past 52 px on any of them.

**What happens** The bar interpolates from ~74 px to 44 px, but the large-title
block keeps its full 58 px height and is not clipped (`overflow: visible`), so
the eyebrow ends at `top: -7`: the top half of "TRAINING", "STRENGTH",
"71 in the library", "Mon 7 Sep", "YOUR COACH" is sheared off and the bottom
half is still painted above the collapsed small title. Measured on all four:

```
progress          "STRENGTH"          top -7  height 13
train             "TRAINING"          top -7  height 13
fuel              "Mon 7 Sep"         top -3.8 height 13
exercise-library  "71 in the library" top -7  height 13
```

Identical in dark and light (it is pure geometry). Screenshots
`hdr-train.png`, `hdr-exercise-library.png`.

**Why it is wrong** It is on screen for the whole scroll of five of thirteen
screens and reads as a rendering fault, not a transition.

**Smallest fix** In `chrome.js` `initLargeTitle`, fade the eyebrow with the
title — it is inside `big`, so it already scales; add
`overflow: hidden` to the bar, or drive the eyebrow's opacity from the same
`t` as `big`.

---

## 7. shopping — cancelling a confirmation throws you back to the top of the list

**Screen** `shopping.html`, List panel
**Selector** `[data-testid="clear-done"]` → `[data-testid="cancel-clear-done"]`, scroller `[data-testid="shop-scroll"]`

**Steps** Scroll the list to `scrollTop = 400` (partway through Produce). Tap
**Clear done**. Read the dialog. Tap **Keep them**.

**What happens** `scrollTop` measured 400 → **0**. You are back at the top of a
twelve-item list, mid-shop. The same reset happens on `shop-at` and `export`.

**Why it is wrong** Cancelling is the "nothing happened" path. It is the one
interaction that must not move the page, and it is the one that loses your place
in a list you are physically walking a shop with. The project already ships
`LKPatch` specifically to preserve scroll; this path bypasses it.

**Smallest fix** Render the dialog into the overlay slot and patch only that
slot, instead of repainting the panel body; or capture and restore
`shop-scroll.scrollTop` around the render, as `review.js`'s `paint(keepScroll)`
does.

---

## 8. progress — a chevron row that does not navigate, changes something off-screen, and jumps the page

**Screen** `progress.html`, state `populated`
**Selector** `[data-testid^="record-"]` (e.g. `record-701`), vs `[data-testid="choose-lift"]`

**Steps** Scroll `[data-testid="progress-scroll"]` to 600 (the Records list).
Tap **Barbell Squat · 110.8 kg ›**.

**What happens** No push, no new screen. The chart card 600 px above silently
re-plots to Barbell Squat, and the scroller jumps 600 → **242** to drag that card
back into view. Header, chart and list all move at once.

**Why it is wrong** Three separate promises are broken by one tap: the `›` says
"a detail screen"; nothing on the row says "this is a radio button for the chart
above"; and the app moves the page under a tap the user did not think was
navigation. The same screen already has a control that does exactly this and
says so — **Choose another lift** (`[data-testid="choose-lift"]`), which opens a
proper "Choose a lift" sheet with radio semantics.

**Smallest fix** Drop the chevron from record rows and mark them
`role="radio" aria-checked` like the sheet's rows already are, so the row reads
as a selector; or make the row genuinely push a record detail and leave lift
selection to `choose-lift`.

---

## 9. progress — the same lift shows two different weights, both labelled "kg", on one screen

**Screen** `progress.html`, state `populated`
**Selector** `[data-testid^="sheet-lift-"]` (in the "Choose a lift" sheet) vs `[data-testid^="record-"]`

**Steps** Read the Records list. Then tap **Choose another lift** and read the
same lifts in the sheet.

**What happens**

| lift | Records list | "Choose a lift" sheet |
|---|---|---|
| Leg Press | 220 kg | **231 kg** |
| Barbell Deadlift | 132 kg | **134.2 kg** |
| Romanian Deadlift | 98.2 kg | **103.3 kg** |
| Lat Pulldown | 79.2 kg | **83.3 kg** |
| Seated Cable Row | 76.7 kg | **80.5 kg** |

The list shows the heaviest recorded set; the sheet shows the latest estimated
1RM point (`kg(p[p.length - 1][1])`). Neither number carries a qualifier — both
are bare `kg` in `.row__value`.

**Why it is wrong** Two authoritative-looking numbers for the same lift, one tap
apart, with nothing to tell them apart. A user reading 231 in the picker and 220
in the list below has no way to know which one is their PR.

**Smallest fix** Label the sheet's value: reuse the section header wording the
screen already owns — `est. 1RM` under the value, or move the value into
`row__sub` as `Est. 1RM 231 kg`.

---

## 10. shopping — "Export" is a labelled button that does nothing and says nothing

**Screen** `shopping.html`, List panel
**Selector** `[data-testid="export"]`

**Steps** Tap **Export**.

**What happens** No sheet, no toast, no share, no state change — only the
scroll reset from finding 7. Handler: `export: function () { S.sheet = null; }`.

**Why it is wrong** It sits in the same 2×2 button block as three working
controls, styled identically, so it reads as broken rather than
not-yet-implemented. Its neighbour **Shop at** opens a real sheet.

**Smallest fix** Either open the `shop-at`-style sheet listing export
destinations, or disable the button — but a labelled, enabled, silent button is
the worst of the three.

---

## 11. coach — the composer keeps your text after you send it

**Screen** `coach.html`, Chat tab
**Selector** `[data-testid="composer-input"]`, `[data-testid="composer-send"]`

**Steps** Type "Should I deload?" into **Ask about your training**. Tap the send
arrow.

**What happens** The message is appended to the thread and the coach starts
typing — and the field still reads **"Should I deload?"** verbatim
(`composer-input.value` after send: `"Should I deload?"`). Screenshot
`coach-sent.png`.

**Why it is wrong** Every chat UI on the platform empties the field on send, so
a field that still holds the text reads as "it did not go". The send button is
still live, so the obvious recovery — tap send again — double-posts.

**Smallest fix** Clear `S.draft` / the input value in the send handler before
re-rendering.

---

## 12. settings and home — the skeleton is materially shorter than the content it stands in for

**Screens** `settings.html` (`loading` → `signed-in`), `home.html` (`loading` → `training`)
**Selector** the Account skeleton card in `[data-testid="settings-scroll"]`

**Steps** Load in `loading`, then let it resolve.

**What happens** Measured tops/heights:

```
settings  skeleton Account card   height 121   →  loaded  height 217   (+96)
settings  "Units and display"     top 229      →  loaded  top 325      (+96)
settings  "Training"              top 530      →  loaded  top 626      (+96)
home      "Last session" header   top 350      →  loaded  top 405      (+55)
```

The skeleton draws one avatar-and-two-lines block; the real card is three rows
(identity, **Body and goal**, **Sync** with a Sync now button). Everything below
drops 96 px the instant data lands.

**Why it is wrong** A skeleton exists to reserve the space content will take.
This one under-reserves by two rows, so the first thing that happens after the
wait is that whatever the user was about to tap moves.

**Smallest fix** Add the two missing skeleton rows so the placeholder card is
217 px, and one more block to `home`'s.

---

## 13. shopping — the empty state points the user upward at something that is 528 px below

**Screen** `shopping.html`, state `empty`
**Selector** the `.empty__body` inside `[data-testid="shop-scroll"]`

**Steps** Switch to the `empty` state on the List panel.

**What happens** Copy reads *"Tap a pick above to add it, use the form below, or
ask Coach to build the list from your week."* Measured positions: the copy is at
`top 202`; the **Fitness picks** row it calls "above" is at `top 730`, below the
three meal cards and off the first fold.

**Why it is wrong** The one sentence whose job is to get the user out of the
empty state sends them in the wrong direction, and the thing it names is not
even on screen.

**Smallest fix** Change "above" to "below", or move the picks row above the
empty block — the empty state is the only place picks are the primary action.

---

## 14. exercise-library — the group search placeholder is cut off mid-word

**Screen** `exercise-library.html`, any group view
**Selector** `[data-testid="search-input"]` inside `.findbar--bottom`

**Steps** Tap **Shoulders** (or Triceps, Forearms, Hamstrings) from the group
list.

**What happens** The placeholder becomes
`Search Shoulders and the whole library` and renders as
**"Search Shoulders and the whole li"** — clipped hard at the field edge, no
ellipsis, no hint that a word is missing. 3× crop: `lib-search-crop.png`. Every
multi-syllable group name truncates; only "Back" and "Quads" fit.

**Why it is wrong** The placeholder's entire purpose here is to tell the user
that search reaches past the group they are in — the half that gets cut is the
half that carries the information.

**Smallest fix** Shorten to `Search Shoulders or all 227`, or drop the group
name: `Search the whole library`.

---

## 15. workout-log — the session title wraps to an orphan and drags the header out of alignment

**Screen** `workout-log.html`, state `empty`
**Selector** `[data-testid="session-name"]`, `[data-testid="session-timer"]`

**Steps** Switch to the `empty` state (a quick workout with no exercises).

**What happens** "Quick Workout" wraps to two lines ("Workout" alone on line
two), the name box grows to 56 px tall, the stat row is pushed to `y 64`, and
the three header actions (bolt, Discard, Finish) stay pinned at `y 23` — so
they float against the first line while the title runs past them. Identical in
both themes. Crop: `wl-empty-dark.png`. In `mid-session` the title is
"PPL - Push", one line, and the header is correct — so the screen looks broken
only in the state a new user hits first.

**Why it is wrong** The one state a first-time user sees is the one where the
header falls apart, and the name is a fixed string, not user content.

**Smallest fix** `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
on `.session-name`, or align the header actions to the block rather than the
first line.

---

## 16. workout-log — the only empty state in the app with no button

**Screen** `workout-log.html`, state `empty`
**Selector** the `.empty` block above `[data-testid="btn-add-exercise"]`

**Steps** Open the `empty` state.

**What happens** "No exercises yet / **Tap Add Exercise below**" — a sentence
pointing at a separate control. Every other empty state in the build hands the
user a button inside the block: train `Build a split`, home `Build a split`,
profile `Start a session`, progress `Start a workout`, coach `Ask for a plan`,
review `Back to workout`.

**Why it is wrong** It is the only empty state that describes the way out
instead of being it, and it is inconsistent with six siblings.

**Smallest fix** Replace the sentence with the same `btn--primary` the other
five use, wired to `btn-add-exercise`.

---

## 17. Confirmations disagree about which button comes first and what cancel is called

**Screens** `workout-log`, `review`, `settings`, `shopping`, `coach`

| screen | selector | order | cancel label |
|---|---|---|---|
| workout-log | `discard-cancel` / `discard-confirm` | **cancel first** | "Keep training" |
| review | `action-discard-cancel` / `action-discard-confirm` | **cancel first** | "Keep it" |
| settings | `confirm-reset` / `cancel-reset` | **destructive first** (and focused) | "Cancel" |
| shopping | `confirm-clear-all` / `cancel-clear-all` | **destructive first** | "Keep them" |
| coach | `delete-confirm` / `delete-cancel` | **destructive first** | "Cancel" |

**Why it is wrong** Muscle memory built on the workout screen ("the left/first
button is the safe one") is exactly wrong on Settings and Coach, where the first
button erases. Three different words for "no" across five dialogs compounds it.

**Smallest fix** Pick one order — cancel first, since the two most-used flows
(workout-log, review) already do it — and one cancel word, and apply it to the
three that differ.

---

## 18. split-builder — deleting a whole training day is one unconfirmed tap, 21 px from the control that deletes one exercise

**Screen** `split-builder.html`, Edit mode
**Selector** `[data-testid="day-remove-d1"]` vs `[data-testid="ex-remove-x2"]`

**Steps** Tap **Edit**. Tap the red trash beside the "Push" day name.

**What happens** The whole day and its four exercises disappear immediately —
no dialog. Toast: `Removed Push. [Undo]`. Measured geometry:

```
day-remove-d1  "Remove Push"                          x 325  y 253  44×44
ex-remove-x2   "Remove Barbell Bench Press from Push" x 317  y 318  44×44
```

Two trash icons, same column, 21 px of vertical gap between hit areas, one
deletes a row and one deletes a whole day. Neither carries a text label.

**Why it is wrong** The blast radius differs by 4×, the affordance is identical,
and the targets are adjacent. Coach requires a full alertdialog to delete one
plan; deleting a third of a split requires none.

**Smallest fix** Route `day-remove` through a confirmation naming the cost
("Remove Push and its 4 exercises?"), and tint only the day trash (or move it
into the day's own overflow menu) so the two are not the same gesture.

---

## 19. shopping — "Pantry" is both a top-level tab and a category inside it; "Clear all" means two different things in the app

**Screens** `shopping.html`, `workout-log.html`

- `shopping.html` Pantry panel: the segmented tab is **Pantry**, and one of the
  category headers inside that panel is also **PANTRY** (meaning dry goods,
  alongside MEAT AND FISH / DAIRY / PRODUCE). Screenshot `shop-pantry.png`.
- **Clear all** is a red `btn--danger` on shopping's List panel that empties the
  entire shopping list, and a neutral grey button in workout-log's plate
  calculator (`plates` state) that resets a weight calculation. Same two words,
  destructive in one place and free in the other.

**Why it is wrong** Both make the user re-read a label they already learned.
The Pantry/Pantry collision is worse: the section header looks like the panel
title has scrolled into the body.

**Smallest fix** Rename the category to **Dry goods** (or **Staples**), and the
plate calculator's button to **Reset**.

---

## 20. "Session" and "workout" are used for the same thing, sometimes on one screen

**Screens** all

```
review        "Discard session"    "Save session"   "Back to workout"
workout-log   "Throw this workout away?"            title "Quick Workout"
profile       "Start a session"
progress      "Start a workout"
train         "Log something else" / history rows headed "History"
home          "Choose a session"
```

`review.html` alone offers **Discard session** and **Back to workout** in the
same view for the same object.

**Why it is wrong** Two nouns for one object, with no rule the user can infer,
across every screen. The empty-state CTAs on Profile and Progress do the
identical thing under two names.

**Smallest fix** Pick one word — "session" is used more often and is what
`review` saves — and sweep the six strings above.

---

## 21. fuel — meal rows carry a chevron and do nothing; the "Meals" link does nothing

**Screen** `fuel.html`, state `populated`
**Selector** `[data-testid="meal-0"]`, `meal-1`, `meal-2`, `[data-testid="open-meals"]`

**Steps** Tap any logged meal row, or the orange **Meals** link beside TODAY.

**What happens** Nothing. No sheet, no toast, no live-region announcement, no
state change (verified by DOM signature before/after). The rows carry `›` and a
row hit-state, so they look navigable; the three of them are the main content of
the screen.

**Why it is wrong** The screen's primary list is entirely inert while looking
entirely interactive — worse than a screen with no rows, because the user will
keep tapping. `train.html` handles its own navigation stubs better: they at
least announce ("Opens the exercise library").

**Smallest fix** Give them the same stub treatment the rest of the build uses —
a toast or `say()` naming the destination — or remove the chevron so they read
as static.

---

## 22. train — logging cardio confirms in a toast that nothing on screen reflects

**Screen** `train.html`, state `populated`
**Selector** `[data-testid="log-q_row"]`, `log-q_walk`, `log-fav_*`

**Steps** Scroll to Cardio. Tap the **+** on "Rowing erg · 20 min".

**What happens** Toast: `Logged Rowing erg · 20 min. [Undo]`. The MINUTES PER
WEEK chart's Sep 7 bar stays flat, the "120 min in 4 weeks" figure is unchanged,
and no row appears in History — which sits directly under the toast.
Screenshot `train-cardio-logged.png`.

**Why it is wrong** The toast and the two data views immediately around it
disagree. An Undo is offered for a change with no visible before/after, so
there is nothing for the user to check the Undo against.

**Smallest fix** Increment the current week's bar and prepend a history row in
the `log-cardio` handler; the data is already in `S`.

---

## 23. home — the error state does not say whether anything was lost; the identical error on train does

**Screen** `home.html` state `error` vs `train.html` state `error`
**Selector** the `.banner--error` in each

```
train:  "Training did not load — Your last sync failed, so your splits and any
         session logged after Sep 3 are missing here. Nothing was lost on this phone."
home:   "Today did not load — Your last sync failed, so the session for today is unknown."
fuel:   "Today did not load — What you logged is on this device and is not lost.
         The targets need the server and it did not answer."
```

**Why it is wrong** Same failure, same cause, and two of three tell the user
their data survived while Home leaves it open. Home is the first screen a user
sees after a failed sync, so it is the one where the question is loudest.

**Smallest fix** Append train's clause: "Nothing was lost on this phone."

---

## 24. fuel — the closing-meal line wraps to a two-word orphan and reads as a run-on

**Screen** `fuel.html`, state `populated`
**Selector** the `.row__sub` of the Dinner row

**What happens** Renders as:

```
Usually 7:30 · about 40 g protein
closes today.
```

Source: `'Usually ' + at + ' · about ' + pro + ' g protein closes today.'` — the
subject of "closes" is the meal, but the nearest noun is "protein", so it parses
as "40 g protein closes today". The wrap leaves "closes today." alone on line 2.

**Smallest fix** `'Usually ' + at + ' · closes today · about ' + pro + ' g protein'`.

---

## 25. Prototype-only: the dev STATE badge covers real header controls

**Screens** `workout-log.html` (`[data-testid="btn-finish"]`), `split-builder.html` (`[data-testid="edit-toggle"]`)

The floating `dev-toggle` pill sits at the top right and lands on top of
**Finish** in workout-log and **Edit** in split-builder — the two most important
actions on those screens. Both are reachable only after hiding the badge, which
is how every screenshot above was taken.

Not a product bug, but it hides the controls under review from anyone opening
these files, and split-builder's own hint text ("Tap Edit to reorder, rename or
delete") points at a button that is not visible.

**Smallest fix** Move `dev-toggle` to the bottom-left, where no screen puts a
control.

---

## Notes on what is not a finding

- **The tab bar is inert on every screen.** All five `tab-*` buttons are
  `<button>` with no handler, on all thirteen screens. This is the isolated-file
  prototype boundary, not a design decision, so it is excluded — but it does mean
  no screen can be exited, which masks any real dead end behind it.
- **`train`'s `start-today` / `new-split` / `open-library` and
  `home`'s `primary-action`** announce their destination to the live region only
  (`say('Opens the split builder.')`). Deliberate and documented in-file;
  invisible to a sighted reviewer, which is why finding 21 singles out `fuel`,
  where even the announcement is absent.
- **Skeleton drift on `train`, `progress`, `review`, `fuel`** exists but the
  skeletons there are obviously abstract (three plain blocks), so they do not
  make the promise `settings`' and `home`'s detailed skeletons do.
