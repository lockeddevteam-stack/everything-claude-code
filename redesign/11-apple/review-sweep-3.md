# Sweep 3 — third end-to-end bug and UX pass over 08-build and the assembled demo

Round 3. Everything below was reproduced in Chromium 1.56.1 from `file://` at 393×852
unless a finding names a different width or text size. Scripts are in
`redesign/tests/agent-sweep3-*.mjs`; the script that reproduces each finding is named
under it.

Scope run this pass:

* all thirteen screens × all 131 dev states, at 393 and 320 px, both themes
  (`agent-sweep3-lib.mjs` now reaches every switcher, including split-builder's
  `#devToggle` and onboarding's `dev-open` inspector)
* the three theme preferences × two device schemes × thirteen screens
  (`agent-sweep3-theme.mjs`)
* every screen × every state at AX5 (`documentElement.style.fontSize = '32px'`) at 393
  and 320 px (`agent-sweep3-ax.mjs`)
* per-control reachability by `scrollIntoView({block:'center'}) + elementFromPoint`, so a
  control resting under the tab bar at first paint is not counted — only one that is
  covered *after* being scrolled to (`agent-sweep3-cover.mjs`)
* the newly wired writes driven end to end and their arithmetic checked: Fuel's
  camera / mic / often / portion / delete, Progress's weight / goals / record,
  Shopping's purchase validation, plurals, undo ordering
  (`agent-sweep3-fuel*.mjs`, `-progress.mjs`, `-shopping.mjs`, `-shop2.mjs`)
* the recent changes: tab-bar collapse, sheet detent geometry under a real pointer drag,
  `--accessory-h`, focus after a control removes or disables itself
  (`agent-sweep3-chrome.mjs`, `-detent.mjs`, `-accessory.mjs`, `-focus.mjs`,
  `-tabcollapse.mjs`)
* the assembled demo: five tabs, all fifteen `MANIFEST.nav` crossings, back, browser back
  and forward, the thirteen-entry screen index, and seventeen hash routes typed directly
  (`agent-sweep3-demo.mjs`, `-demo2.mjs`, `-demo3.mjs`)
* a no-op / blocked / error scan over every visible button on nine screens
  (fuel, progress, shopping, profile, settings, review, plus home, train and workout-log
  from the first pass), fresh reload per click
  (`agent-sweep3-noop3.mjs` → `agent-sweep3-noop3.log`)
* all nineteen round-2 findings re-run (`agent-sweep3-regress.mjs`)

Nothing was changed.

**No page errors and no console errors anywhere** — thirteen screens × every dev state ×
{light, dark, system} × {393, 320} px, plus every sheet open/close cycle, the Fuel and
Progress write paths, the Shopping write path, and the whole demo. **No NaN, undefined,
null, `[object Object]` or Infinity in rendered text anywhere.**

**Every round-2 finding is fixed** and none of them re-reproduced. Verified individually:
the minimized bar no longer scrolls `.screen` or clips the scrim (`.screen` scrollHeight
stays 852 and the scrim spans 0–852 with the bar collapsed); the library's last Chest row
is at 568–636 and clicks; the detent drag interpolates the inset and the corner instead
of snapping 8 px; `sheet-days` closes on Escape; Settings' and Shopping's Back buttons
navigate; the workout log's tab bar minimizes; the clear dialogs pluralise and drop the
zero clause; undo restores items in order; Fuel's chips are one scroll notch from rest;
Progress's empty-state action goes to `train.html`. **AX5 is clean at 393 px and at 320 px**
once every flagged node is settled and checked for a horizontal scroller.

---

## Severity 2 — High

### 1. fuel: after deleting a meal, the next thing you log gets an "Undo" that undoes the deletion instead

**File** `08-build/fuel.html:770-780` (`say()` / `doUndo()`), against `removeMeal` at 752.

`removeMeal` is the only writer of `S.undo`. `say()` sets `S.toast` and renders but never
clears `S.undo`, and `toastHTML` (line 781) renders the Undo button whenever `S.undo` is
truthy. So for the six seconds after a deletion, *every* subsequent toast carries an Undo bound
to the deletion.

**Steps** — `fuel.html`, Populated → `[data-testid="meal-0"]` → `[data-testid="meal-delete"]`
→ (within 6 s) `[data-testid="log-cam"]` → `[data-testid="cam-confirm"]` →
`[data-testid="undo"]`.

**Observed**

```
start                       3 meal rows
after meal-delete           2 rows   toast "Eggs, toast, butter removed.  [Undo]"
after cam-confirm           3 rows   toast "Chicken, rice, broccoli logged, 690 kcal.  [Undo]"   <-- Undo still offered
after Undo                  4 rows   hero 720 kcal
```

The toast says a meal was logged and offers Undo; pressing it leaves the logged meal in
place and puts the deleted one back. The user ends up with four meals having pressed
"log" once and "undo" once. Same with `mic-confirm`, `often-N` and the portion chips —
any of them within the 6 s window inherits the stale Undo.

**Should** — `say()` should take the undo closure with the message, or clear it, so the
button belongs to the sentence above it.

**Repro script** `tests/agent-sweep3-fuel.mjs`, section C.

### 2. The "Resume" shelf on Home and Fuel does nothing — standalone and in the assembled demo

**File** `08-build/home.html:402-403` and `08-build/fuel.html:184-185`
(`data-action="resume"`, `data-testid="shelf-resume"`).

The shelf is the affordance that takes you back into a running workout. It reads
"Push A · 4 of 7 · 38:12 · Resume" and is labelled
`aria-label="Return to Push A, 4 of 7 exercises done, 38 minutes elapsed"`.

* `fuel.html`'s delegated handler (`:635-663`) has branches for `mic`, `cam`, `meal`,
  `meals`, `trends`, `water`, `supps`, `water-add`, `water-sub`, `supp`, `cam-oil`,
  `cam-log`, `mic-log`, `log-often`, `meal-portion`, `meal-delete`, `undo`, `more`,
  `close` and `retry`. There is no `resume`.
* `home.html` still has **no application click listener at all** — the only two
  `addEventListener('click')` calls in the file are the dev menu's, at `:431` and `:436`.
  That is round 1's finding 3, unchanged; Fuel and Profile were named in the same finding,
  Fuel got wired this round and Home and Profile did not.
* There is no `shelf-resume` row in `MANIFEST.nav`, so the demo does not intercept it
  either.

**Steps** — `fuel.html` → STATE → **Session running** → press the shelf. Then the same on
`home.html`, and then both again inside `locked-demo.html`.

**Observed**

```
standalone fuel   shelf "Push A 4 of 7 · 38:12  Resume"   DOM byte-identical, url unchanged
standalone home   same
demo #/fuel       shadow root byte-identical, hash #/fuel
demo #/home       shadow root byte-identical, hash #/home
```

The same click sweep found the rest of Home and Profile dead standalone —
`primary-action`, `action-choose-session`, `row-last-session`, `row-climbing-lift` and
`open-account` on Home; `open-settings`, `signup` and `start-first` on Profile. Five of
those eight are `MANIFEST.nav` crossings and work inside the demo. **`shelf-resume`,
`signup` and `start-first` are not, and are dead in both places.**

**Repro scripts** `tests/agent-sweep3-noop3.mjs` (the NOOP list), and the two demo
reproductions in this finding.

### 3. assembled demo: `assemble.mjs`'s MANIFEST has drifted from the built `locked-demo.html`, and two crossings would be lost on the next build

**File** `10-final/assemble.mjs:96` and `:93`, against the `"nav"` array baked into
`10-final/locked-demo.html`.

| assemble.mjs source | built locked-demo.html | matches in 08-build |
|---|---|---|
| `{ from: 'workout-log', selector: '[data-action="finish"]', to: 'review' }` | `selector: '[data-testid="btn-finish"]'` | **0** — workout-log.html:337 is `data-act="finish"` |
| `{ from: 'coach', selector: '[data-act="plan-start"]', to: 'train' }` | `selector: '[data-testid="plan-start"]'` | **0** — coach.html:620 is `data-act="start"` |

Both crossings work in the shipped demo, because the shipped HTML carries the older,
correct selectors. Re-running the build replaces them with selectors that match nothing,
and `wire()` (`assemble.mjs:563-571`) simply never fires: **Finish on the workout log
would stop reaching Review, and Coach's "Start Push" would stop reaching Train.**

`assemble.mjs:835-851` validates `from`, `to` and `mode` and throws on each — the five
silent-drop paths the file's own comments describe. It does **not** check that
`n.selector` matches anything inside `n.from`'s markup, which is the sixth.

```
grep -c 'data-action="finish"'   08-build/workout-log.html   -> 0
grep -c 'data-act="plan-start"'  08-build/coach.html         -> 0
```

**Should** — the build should throw on a crossing whose selector matches nothing in the
source screen, the same way it throws on a mode that names a non-tab. Until then the
demo and its build script disagree and the artifact cannot be reproduced from source.

**Repro** `tests/agent-sweep3-demo3.mjs` (selector-match counts inside each shadow root)
plus the `"nav"` block in `locked-demo.html`.

### 4. fuel: the Empty state prints the populated day's hero — "1,410 kcal left of 2,980" directly above "Nothing logged today"

**File** `08-build/fuel.html:214-244` (`hero()`).

`hero()` branches on `S.state === 'hidden'` and `S.state === 'first-weeks'` and otherwise
falls through to the populated form, which reads `DAY.eaten`. The Empty *view* renders
"Nothing logged today" underneath it.

**Steps** — `fuel.html` → STATE → **Empty**, on a fresh load, no interaction.

**Observed**

```
Empty:  "1,410  kcal left of 2,980 · lean bulk   78.3 kg  +0.34% / wk, on target"
        "Nothing logged today. Say what you ate or snap the plate."
```

1,410 of 2,980 left means 1,570 kcal eaten. The screen states both at once, 200 px apart.
Loading and Error get this right — they render no hero at all. Empty is the only state
that contradicts itself.

**Should** — Empty should show the full target (`2,980`), or no hero, the way Loading and
Error do.

**Repro script** `tests/agent-sweep3-fuel2.mjs`.

### 5. Once the tab bar collapses, four of the five tabs cannot be reached by any tap, and they stay in the keyboard tab order as 0-px-wide buttons

**File** `08-build/chrome.js:146-167` (`initTabBar`) + the `[data-minimized="true"]`
rules in `components.css`.

**Steps** — `train.html` → wheel down 700 px over `#body`.

**Observed** — the bar collapses to a 75 px capsule around the active tab (159–234), which
is the intended §8.2 shape. But:

```
rest       items: tab-home:74 tab-train:74 tab-fuel:74 tab-coach:74 tab-profile:74
collapsed  items: tab-home:0  tab-train:74 tab-fuel:0  tab-coach:0  tab-profile:0
           the four hidden ones: display:flex  visibility:visible  pointer-events:none  tabIndex 0
```

* Tapping the capsule does not expand it — `p.mouse.click(196, 812)` leaves
  `data-minimized="true"` and the same five widths; the click lands on the active tab,
  which is a no-op. On iOS the collapsed bar expands on tap.
* A real Playwright click on each of `tab-home`, `tab-fuel`, `tab-coach`, `tab-profile`
  times out at 1500 ms — all four.
* The only way back to the other four tabs is to reverse the scroll. That is cheap — one
  upward notch of more than 4 px brings the bar back (`chrome.js:169-171`) — but it is
  still an undiscoverable gesture standing between the user and four of the app's five
  destinations, and nothing on screen says so.
* The four hidden items are still `visibility: visible` with `tabIndex 0`, so a keyboard
  user can Tab into a 0-px-wide control:
  `document.querySelector('[data-testid="tab-profile"]').focus()` succeeds,
  `document.activeElement` is `tab-profile`, the bar does not restore, and there is no
  visible focus ring because the element has no width. Four invisible stops in the tab
  order on seven screens.

**Should** — a tap on the collapsed capsule should expand the bar, and the hidden items
should leave the tab order (or focusing one should restore the bar) rather than being
focusable at zero width.

**Repro script** `tests/agent-sweep3-tabcollapse.mjs`.

---

## Severity 3 — Medium

### 6. The dev scaffolding is a 62 × 44 invisible tap-catcher on the left edge of twelve screens, and it blocks a real control on split-builder

**File** `08-build/components.css:838-851` (`.dev`, `position: fixed; top: 50%; left: 0;
z-index: 8`) against `:852-861` (`.dev__toggle { transform: translateX(calc(-100% + 8px)) }`),
which is the Blocker-2 fix from `spec-compliance-2.md`.

The *button* moved off-canvas; its container did not. `.dev` still occupies
**x 0–62, y 404–448** with `pointer-events: auto` and `z-index: 8` on every screen that
has one, while the visible sliver of its button is x −54–8. `.dev:hover .dev__toggle`
brings it back on a desktop pointer; on a touch device there is no hover, so those 54 px
are a strip that does nothing at all.

```
home … settings (12 screens)  .dev box=[0,62,404,448]  pe=auto  z=8
                              elementFromPoint(31, 426) -> .dev
                              visible button box=[-54, 8]
```

That is a 54 px-wide strip of screen, vertically centred, that swallows taps and shows
nothing. On `split-builder.html` → **Manual · edit mode** it lands on a control:

```
ex-grip-x18   box=[32,76, 386,430]   elementFromPoint at its centre -> .dev
```

`ex-grip-x18` is a **drag handle**. A real Playwright click still succeeds (it finds an
unobstructed corner), but a drag started at the handle's centre — which is where a finger
lands — begins on the dev chip instead.

**Should** — the container should be translated with the button, or given
`pointer-events: none` with the button re-enabling it.

**Repro script** `tests/agent-sweep3-devzone.mjs`, `tests/agent-sweep3-misc.mjs` §2.

### 7. onboarding: the "State" inspector chip sits on top of the sign-up password reveal and blocks it at every width

**File** `08-build/onboarding.html:52-72` (`.dev-open`). Onboarding has its own dev
affordance and did not get the Blocker-2 treatment: it is `translate(0, -22px)`, still on
the canvas, pinned to the right edge at `z-index: 8`.

**Steps** — `onboarding.html` → the State panel → **Email already registered** (`error`)
→ try to press the eye that reveals the password.

**Observed**

```
dev-open                 box l349 r393  t404 b448   z=8  pe=auto
signup-password-reveal   box l333 r377  t396 b440
elementFromPoint at the reveal's centre -> dev-open
locator('[data-testid="signup-password-reveal"]').click() -> Timeout 2500ms exceeded
```

Overlapping at 320, 393 and 430 px alike. The reveal is the control a user reaches for
when a password is rejected, which is exactly the state this preset is showing.

**Repro script** `tests/agent-sweep3-misc.mjs` §1.

### 8. fuel: the hero reads "−210 kcal left of 2,980" once you log past the target

**File** `08-build/fuel.html:236-241` — `var left = DAY.target - DAY.eaten` printed as
`n(left)` with the fixed caption "kcal left of".

**Steps** — `fuel.html`, Populated → `[data-testid="open-meals"]` → `[data-testid="often-0"]`,
three times (540 kcal each; the day starts 1,410 under).

**Observed** — the hero's big number is `-210` and the line under it still says
"kcal left of 2,980 · lean bulk". "−210 left" is not a sentence anyone says; going over is
the single most common thing a food log has to report, and the screen has no words for it.
The macro meters directly below get it right — they clamp the fill at 100 % and print
"235 / 160 g", which reads as over.

**Should** — under zero the hero should say "210 kcal over", the way the budget card on
`shopping.html` already flips to "$6.40 over budget".

**Repro script** `tests/agent-sweep3-fuel3.mjs`.

### 9. Assembled demo: the Back button's label names the screen you just came back *from*

**File** `10-final/assemble.mjs` — the `trail` that feeds the back label, against
`parseHash()`.

**Steps** — demo → Train → **Start today** → **Finish** → **← Back to Workout Log**.

**Observed**

```
0  #/train                 back: (none)
1  #/train/workout-log     back: "← Back to Train"
2  #/train/review          back: "← Back to Workout Log"
3  #/train/workout-log     back: "← Back to Review"      <-- Review is now FORWARD of here
4  #/train                 back: (none)
```

At step 3 the user is standing on the workout log having just left Review, and the only
back affordance offers to take them to Review. Pressing it goes to Train. The label and
the action disagree, and the label points the wrong way down the stack.

The same mechanism makes `#/train/review` lose `workout-log` from the URL entirely
(Review's declared parent is `train`), which is why the label has to come from the trail
rather than from the route.

**Repro script** `tests/agent-sweep3-demo2.mjs`, and `tests/agent-sweep3-demo3.mjs` §D.

### 10. settings: pressing "Sync now" disables the button and throws focus 100 px down the page to "Weight unit"

**File** `08-build/settings.html:402` — the syncing branch renders
`<button … aria-busy="true" disabled data-testid="sync-now">` with no `data-action`.

**Steps** — `settings.html`, Signed in → focus `[data-testid="sync-now"]` → press it.

**Observed**

```
before   sync-now  top 245   enabled
after    sync-now  top 245   disabled=true, aria-busy=true, label "Syncing"
         document.activeElement -> row-weight-unit   top 346
after 4s sync-now  enabled again, label "Sync now"
         document.activeElement -> row-weight-unit   (never comes back)
```

The button does not move and does not leave the DOM; it only goes `disabled`, so the
browser drops focus and the restore lands on the next focusable thing, an unrelated row in
a different section. A screen reader user who asks to sync is told "Weight unit,
Kilograms". This is the disable half of the "focus after a control removes or disables
itself" rework — the removal half is correct (see the clean list below).

**Should** — a busy button should stay focused (`aria-disabled` rather than `disabled`),
or focus should return to it when it re-enables.

**Repro script** `tests/agent-sweep3-focus.mjs`, last section.

### 11. Sheet drag: twelve per cent of the travel above the top detent does nothing, and dragging down never dismisses

**File** `08-build/chrome.js:275-285` (`pointermove`) and `287-311` (`release`).

`pointermove` clamps `frac` to `Math.min(1, …)`, but a sheet whose top detent is `0.88`
is already against its ceiling at 88 %: at `height: 100%` the box is still
`top 102 / bottom 852`, identical to `height: 88%`. Measured on `progress.html`'s lift
sheet:

```
drag up, pre-release   style height 100%   box top 102  bottom 852   --full 1
settled                style height  88%   box top 102  bottom 852   --full 1
```

So the last ~100 px of an upward drag move the finger and nothing else, and then the sheet
springs "back" to a height it was already rendering at.

Downward, `frac` floors at `detents[0] * 0.5` — 27.5 % for a 0.55/0.88 sheet — and
`release()` always throws to the nearest declared detent. A 700 px pull-down over ten
steps ends with the sheet back at 55 % and still open. There is no dismiss detent, so the
one gesture every iOS user tries on a grabber cannot close the sheet. (Escape, the scrim
and the close button all work, so it is not a trap.)

A smaller mismatch in the same function: `release()` sets `current = best; mark(best)`
immediately and lets `LKSpring` animate the height afterwards, so a sheet springing up to
the top detent takes its full-bleed inset and square bottom corners *before* it arrives.

**Repro script** `tests/agent-sweep3-detent.mjs`.

### 12. Four toasts name a screen the tap does not open

* `workout-log.html:1033` — `case 'finish': toast(doneSets() + ' sets saved. Opening review.')`.
  Standalone, nothing opens; the toast is the whole effect. (In the demo the crossing takes
  the click, and works — see finding 3 for why it stops working on the next build.)
* `coach.html:1090` — `'start'` toasts "Starting Push in Workout Log, loaded from this phase."
  There is no `coach → workout-log` crossing in `MANIFEST.nav` at all; the declared crossing
  is `coach → train`. So even in the demo the sentence names a screen the tap does not open.
* `coach.html:1088` — `'target'` toasts "Opening this lift in Progress." No `coach → progress`
  crossing exists either.
* `coach.html:1089` — `'open-split'` toasts "Opening the split in Train." It opens
  split-builder, which is right; the sentence is wrong.

**Repro** `tests/agent-sweep3-demo3.mjs` and the source lines above.

### 13. workout-log, Error state: the toast never expires and blocks a 60 px band across the screen

**File** `08-build/workout-log.html:279` sets `S.toast` directly, bypassing `toast()`
(line 906) and its 4000 ms timer.

**Steps** — `workout-log.html` → STATE → **Error** → scroll `[data-testid="btn-add-exercise"]`
into view.

**Observed**

```
toast   box t720 b780   l16 r377   z-index 12   pointer-events: auto
        "Could not get a recommendation. Check your connection and retry.  [Retry]"
still on screen after 12 s
btn-add-exercise scrolled to centre -> box t724 b768
elementFromPoint at its centre -> toast__body
locator('[data-testid="btn-add-exercise"]').click() -> Timeout 2500ms exceeded
```

Anything scrolled into 720–780 is unclickable for as long as the state lasts, which is
forever. The comment three lines above `toast()` reads "A toast says what happened and gets
out of the way; it never sits on top of Add Exercise waiting to be dismissed" — which is
exactly what this one does. The app's own failure path (`airec`, line 981) uses `toast()`
and expires correctly, so this is confined to the dev fixture — but it is a rendered state,
and the fixture is what a reviewer sees.

**Repro script** `tests/agent-sweep3-devzone.mjs`, second section.

---

## Severity 4 — Low

### 14. fuel: "A quarter less" then "A quarter more" does not return the meal to where it started

**File** `08-build/fuel.html:737-751` (`portion`), multiplicative by ±0.25.

```
Eggs, toast, butter   540 kcal, 38 g protein   hero 1,410
after "A quarter less"  405 kcal, 29 g          hero 1,545
after "A quarter more"  506 kcal, 36 g          hero 1,444
```

The arithmetic is internally consistent (0.75 × 1.25 = 0.9375) and the day's totals track
it exactly, so nothing is lost — but the two chips read as a pair and read as reversible,
and pressing both leaves the meal 34 kcal lighter than it was with no way back. Their
testids, `meal-edit` and `meal-swap`, are also left over from the labels they used to
carry ("Change the portion", "It was something else").

**Repro script** `tests/agent-sweep3-fuel.mjs`, section D.

### 15. Assembled demo: `#/train/workout-log/review` renders the workout log, and an unknown route keeps its hash

```
#/train/workout-log/review  -> visible ["workout-log"]   hash unchanged
#/train/nonsense            -> visible ["train"]         hash "#/train/nonsense"
#/nonsense                  -> visible ["home"]          hash "#/nonsense"
```

Nothing in the demo produces a three-segment route today (Review pushes as `#/train/review`),
so this is only reachable by typing. The unknown-route fallback is sensible; leaving the
bad hash in the address bar is not.

**Repro script** `tests/agent-sweep3-demo2.mjs`, last section.

### 16. fuel: the "Meals you log often" rows carry a chevron but commit instead of pushing

**File** `08-build/fuel.html:547-557` — each `[data-testid="often-N"]` renders
`<span class="row__chev">` and calls `logOften`, which writes the meal and closes the
sheet.

A chevron is the build's own mark for "this opens something". These rows log 540 kcal and
dismiss. The write itself is correct — 1,410 → 870 → 330 across two taps, and the row's
own "logged 7 times" increments — but the affordance says push.

### 17. shopping: `.screen` carries 543 px of hidden overflow

```
shopping / Populated   .screen scrollHeight 1395   clientHeight 852
                       overflowing children: .section b=930, .itemgroup b=930, item-i7 b=870
shopping / Empty       .screen scrollHeight 1156
```

This is the same shape as round 2's finding 2 — an `overflow: hidden` `.screen` that is
still programmatically scrollable. It does not currently misbehave: with `clear-all`,
`clear-done` and the item sheet open, `.screen.scrollTop` stays 0 and the scrim measures a
full 0–852 with `elementFromPoint(196, 846)` returning the scrim. Latent, not live. No
other screen has it.

**Repro script** `tests/agent-sweep3-scrim.mjs`.

### 18. `--accessory-h` is never cleared when the accessory goes away

**File** `08-build/chrome.js:475-477` — `if (h) screen.style.setProperty(…)`, so a
measurement of 0 leaves the last non-zero value in place.

```
fuel / Populated        --accessory-h ""      --float-h calc(56px + 12px + 0px)          padding-bottom 84px
fuel / Session running  --accessory-h 54px    calc(56px + max(44px, 54px) + 24px + 0px)  padding-bottom 150px
fuel / First two weeks  --accessory-h 54px    calc(56px + 12px + 0px)                    padding-bottom 84px   <-- stale 54px
```

Harmless today, because `--float-h`'s `:has()` selector gates the accessory term on the
accessory actually being there, so the padding is right in every state. The variable is
simply lying. Worth noting only because the next thing to read it may not have the guard.

The measurement itself is correct everywhere it matters: 120 px for the library's find bar
(76 px in Loading and Error, where the chip row is absent), 54 px for the Fuel and Home
shelves, and the ResizeObserver picks up the change without a reload.

### 19. fuel: the dev switcher shares one `DAY` object across states

Logging or deleting in Populated and then switching to Empty and back leaves the mutated
day in place (3 meals → 2, hero 1,410 → 1,950). This is scaffolding rather than product
behaviour, and it is not the cause of finding 4 — Empty prints the populated hero on a
fresh load too — but it does mean a second look at a state shows something different from
the first, which makes a reviewer's readings depend on the order they clicked in.

---

## Categories checked that produced nothing

* **Page errors and console errors** — zero, everywhere listed in the scope above.
* **NaN / undefined / null / `[object Object]` / Infinity in rendered text** — none, in any
  screen, any state, any theme, at 393 or 320 px, before or after every write path was
  driven.
* **AX5, at 393 px and at 320 px** — clean at both. At 393 px the only flagged nodes
  (387 of them) are `.tabbar__label`s collapsed to 1 × 1 by the container query, which is
  the intended icon-row behaviour and keeps the accessible name. At 320 px a first pass
  flagged sixteen nodes escaping the viewport; re-measured with a settle after the
  font-size change and a walk up the ancestor chain for a horizontal scroller, **zero**
  remain: `btn-finish` and split-builder's two button labels were mid-reflow readings that
  settle back inside (16–304, 40–280, 64–200), and the rest — workout-log's `partials`,
  shopping's `seg-budget`, review's delta chips, onboarding's sign-in error sentence — all
  sit inside an `overflow-x: auto` ancestor and scroll into view. Nothing a reader has to
  press or read is lost at AX5 at either width. The `.btn`, `.badge`, `.chip`, `.row` and
  `.sets` work from Blocker 1 holds.
  (`agent-sweep3-ax.mjs`, `agent-sweep3-ax2.mjs` → `escapes outside any horizontal
  scroller: 0` at both 393 and 320.)
* **Themes** — `lk_theme` = light / dark / system × device light / dark × thirteen screens:
  the root attribute, body ground, header and glass tint are all correct in every
  combination, and zero errors. Settings' Appearance sheet writes `lk_theme`, repaints
  immediately, survives a reload, and the next screen opened follows it.
* **Focus after a control removes itself** — correct. `ex-remove-x17` → `ex-remove-x18`,
  `day-remove-d16` → `day-remove-d21`, `clear-done` → `cancel-clear-done`,
  `meal-0` → `meal-close`, fuel's `meal-delete` → `meal-0`, progress's `weight-log` →
  `row-body-weight` and `rec-save` → `log-record`. The only failure in this class is the
  *disable* case, finding 10. (Two dismissals land on the screen `<div>` rather than a
  control — fuel's Undo and progress's toast Done — which is at least not `<body>`.)
* **Progress's three writes** — all correct and all arithmetically sound. Logging 80.5 kg
  moves the row from "−1.1 kg since Jul 27 · 64.2 kg" to "+15.2 kg since Jul 27 · 80.5 kg",
  adds one row to the sheet's list, and a second reading on the same day replaces rather
  than stacks. Goals validates both fields, focuses the offending one, adds at 0 % / "Not
  started", and the row above updates to "4 active". Records validates weight and reps,
  writes to the list ("13 across 9 lifts"), and keeps what was typed. Errors render in
  `role="alert"` and the sheet stays open.
* **Shopping's write path** — the store is required now ("Pick a store, or Other."), name
  and price are validated ("What did you buy?", "A price, so the week adds up."), and no
  "Unknown store" can be written. A $20 × 2 purchase moves the week $86.40 → $126.40 and
  the month $182.40 → $222.40, and the card flips to "$6.40 over budget" at 100 %. The clear
  dialogs read "1 picked-up item goes … Clear 1 item" for one and drop the "including the 0"
  clause when everything is ticked. Undo after clear-done and after clear-all both restore
  every row in its original order.
* **Fuel's newly wired controls** — the three oil chips take `aria-pressed` and move the
  figure (600 / 690 / 850 kcal); `cam-confirm` logs the plate the chips describe and the
  hero moves by exactly that; `mic-confirm` logs 720 + 310 and says "1,030"; `often-N` logs
  and increments its own count; `meal-delete` removes, subtracts all four macros, and offers
  a real undo. The macro totals stay consistent through every one of these.
* **Sheet dismissal, and listener stacking** — opening and closing the same sheet five
  times in a row leaves exactly zero overlays behind and no duplicate scrims or sheets, on
  `fuel` (meal and camera), `progress` (lift picker and body weight), `workout-log` (the
  numeric pad) and `settings` (weight unit). Every overlay opened by hand this pass closed
  by Escape, by scrim and by its close button; `sheet-days`, round 2's only `ESC-NOOP`, now
  closes on Escape with its parent detail sheet still under it.
* **Reachability** — with each control scrolled to the centre of its own scroller, nothing
  on any screen in any state is covered except by a scrim or sheet that is deliberately
  over it, plus findings 6, 7 and 13. The library's find bar and the Fuel shelf both budget
  correctly now.
* **Onboarding** — 32 states, zero errors, zero bad text, zero horizontal escape at 393 px.
  The welcome → create account flow validates rather than dead-ends (an empty email is
  refused with "Enter your email address", which is the correct no-op).
* **Destructive actions** — every one found has either a confirmation or an undo:
  split-builder's exercise and day removal both toast with Undo (and the day one says "and
  its 3 exercises"), shopping's two clears confirm and then undo, the workout log's discard
  is a dialog, review's split update has Undo, fuel's meal delete has Undo. Finding 1 is
  about an undo that appears where it should not, not one that is missing.
* **No-op controls** — outside findings 2 and 12, every visible button on fuel, progress,
  shopping, profile, settings and review changes the document when pressed. The only other
  entries in the no-op list are a tab pressing its own tab, a segment pressing its own
  segment, and `range-12w` when 12 weeks is already the selected range; the only two
  "blocked" entries are shopping's `add-item`, which is correctly `disabled` until the name
  field has text (typing "Bananas" enables it and the list goes 12 → 13), and review's
  `diff-many` controls, which sit behind that state's own open sheet.
  (`agent-sweep3-noop3.log`.)
* **The demo's five tabs, fifteen crossings, thirteen-entry index and browser back/forward**
  — all correct as built. Every tab switches and writes its hash; every declared crossing
  lands on the right screen with the right parent; every index entry opens its screen;
  browser back and forward walk the trail without desynchronising the view from the hash.
  The navigation findings are 2 (a dead Resume shelf on two tabs), 3 (source drift in the
  build script), 9 (the back label) and 12 (toasts that name the wrong screen).
