# HIG and experience audit — LOCKED redesign (08-build)

Method: Playwright, Chromium, 393x852 at DPR 2, dark, each screen driven through its dev
state switcher. Screenshots are my own, in `/tmp/claude-0/shots/`.

## Grades

| Screen | 1 Cognitive load | 2 Hierarchy | 3 Nav / IA | 4 HIG fit | 5 Habit |
|---|---|---|---|---|---|
| home.html | **A** | **A** | **B** | **A−** | **A−** |
| progress.html | **A−** | **A−** | **B+** | **A−** | **B+** |
| onboarding.html | **B+** | **B** | **B** | **B−** | **A−** |
| coach.html | **B−** | **B** | **B−** | **C+** | **B** |
| exercise-library.html | **C+** | **B** | **C** | **C+** | **C** |
| split-builder.html | **D+** | **C** | **D** | **C−** | **C** |

---

## 1. Cognitive load

**Home — A.** Job stated in under two seconds ("today, Push, 50 min"), primary named in
one ("Start Push"). Four blocks, six tappable things above the tab bar. `home-clean.png`.
This is the best screen in the build and I have no fault to invent.

**Progress — A−.** The screen answers itself in the first line: "15 of 15 lifts are
heavier" (`pg-pop.png`). One deduction: the two-line prose under the chart ("Vertical axis
in kilograms, starting at 70, not at zero. Points sit on the day they were lifted.") is
axis documentation printed as body copy. I would move it to `sr-only` and label the axis
"kg" — sighted users read the tick marks, and the honesty is preserved for screen readers.

**Onboarding — B+.** One question per screen, `Step 2 of 5`, skip on every step
(`onboarding-19.png`). Deduction: on the units step neither option carries a selected
mark, yet Continue is live. Add a checkmark and a default.

**Coach — B−.** Two competing messages in one screen. Chat is a conversation, Setup a settings
form, Plan a dashboard, all behind one segmented control (`coach-default.png`,
`coach-6.png`, `coach-11.png`). A copy-to-clipboard icon hangs under every coach message
(2 in `coach-default.png`, 3 in `coach-planoffer.png`) — furniture. Put it behind
long-press.

**Exercise library — C+.** The number 227 appears four times in the first fold: eyebrow
"227 in the library", placeholder "Search 227 exercises", chip "All 227", section meta
"227 exercises" (`exercise-library-default.png`). One of those earns its place. I would
keep the chip and cut the other three. In the detail sheet, "WORKS / Lower Chest / Chest ·
Cable" is restated verbatim 300px lower as a MUSCLE GROUP / REGION / EQUIPMENT grid
(`el-detail.png`) — delete the grid.

**Split builder — D+.** Measured: **41 interactive controls in the manual-edit screen**,
including **15 delete buttons and 30 drag handles** (`sb-pop.png`). Every exercise row carries a
permanently visible trash can, seven on screen at once — destructive density iOS avoids.
Fix: an Edit toggle in the nav bar revealing handles and deletes, plus swipe-to-delete at
rest; that removes ~30 controls from the default view.

## 2. Visual hierarchy

Squint-test winners are correct on **Home** ("Push" then the orange bar), **Progress**
("15 of 15 lifts are heavier"), **Onboarding** (the question), and **Coach/Plan**
("12-week strength block", with Start Push the only fill).

**Split builder — C.** The squint winner is a column of red trash cans, not the split
(`sb-pop.png`). Worse, the screen's single accent fill is spent on "Save split" while the
status line beside it reads **"Saved 2 minutes ago"** — the loudest element on the screen
is a no-op. The same contradiction appears on Coach/Setup: "Saved just now" next to a
filled Save (`coach-11.png`). Fix both: the primary should be disabled/plain when clean
and take the accent only when the dirty dot is showing.

**Exercise library — B.** Grouping works: rows share a common region, counts are right-
aligned and tabular, chevrons are consistent. The search field carries a permanent accent
ring in the default state (`exercise-library-default.png`) though nothing is focused,
which reads as an error or an active filter. Remove the ring until focus.

**Onboarding — B.** On the welcome screen the value proposition sits at y≈500 with ~500px
of nothing between it and the buttons (`onboarding-default.png`); the eye lands on empty
ground first. Also "Skip this step" and "See the full week" are accent-orange text
directly under an accent-orange fill (`onboarding-19.png`, `onboarding-26.png`) — the
escape hatch is drawn as loud as the commitment. Make secondary text neutral.

## 3. Navigation and IA

**The split builder has no entrance once you have a split.** It is reachable from Home's empty state
("Build a split", `home-2.png`) and from the exercise detail sheet ("Add to a split day",
`el-detail.png`) — but Train lands directly on Exercises with no sub-navigation
(`exercise-library.html:85-101`), and populated Home offers only "Choose another session".
For a user who already has a split, editing their own program is unreachable at any depth. Fix: Train should be a list of Splits and Exercises, or Home's
"Choose another session" sheet should end in "Edit this split".

**Profile losing its tab is fine.** The account button is present, 44x44, at
x345 y9 (measured), top-right of Home (`home-clean.png`). Standard iOS placement, nothing
orphaned that I can find.

**Labels** are standard (Home, Train, Fuel, Progress, Coach). "Coach" for an AI chat is
domain-appropriate. **Back** is a bare chevron on the split builder with no parent label
(`sb-pop.png`); iOS labels it with the origin. Sheets dismiss with grabber, X and backdrop
(`el-detail.png`) — predictable.

**Coach/Setup is a settings screen inside a segmented control.** Segmented controls should
switch peer views of the same content; Chat and Plan are peers, Setup is configuration.
Move it to a nav-bar gear that presents a sheet.

## 4. Apple HIG fit

**Deference** is the build's strength. Chrome is thin, surfaces are elevation-only, and
one accent fill per screen is genuinely held. **Depth** is used correctly: the sheet keeps
its parent visible and dimmed with a grabber and an X (`el-detail.png`, `el-create.png`);
the Home training card rises and the rest card settles, tone rather than hue
(`home-clean.png` vs `home-1.png`). **Clarity** holds — tabular figures with units
everywhere, no sentinel values.

Web idioms that should not be here:

1. **Native `<select>` dropdowns** in the New-exercise sheet, chevron and all
   (`el-create.png`). iOS uses a menu or a pushed list.
2. **A persistent bottom Save bar** on the split builder and Coach/Setup
   (`sb-pop.png`, `coach-11.png`). iOS puts Save in the nav bar; on Coach/Setup the bar
   currently occludes the TONE control.
3. **The leave-prompt is a custom modal with three stacked buttons, destructive first**
   (`sb-leave.png`). An iOS action sheet puts Cancel last and the destructive choice in
   red at the bottom; here "Discard changes" is the topmost, most-reachable option and the
   safe "Keep editing" has the least weight. Use `UIAlertController` ordering.

The tab bar itself is conventional: five items, current item accented, persistent across
Home / Exercises / Progress / Coach, absent on the pushed split-builder detail. Correct.

## 5. Habit and retention

**Home's momentum band reads as earned, not gamified.** It says "5 weeks ON PLAN", not a
day streak, and the week track shows Monday filled, Wednesday ringed as today, Friday
planned, Saturday/Sunday as flat rest marks (`home-clean.png`). Nothing is coloured red,
nothing says "don't break it", and the rest-day state congratulates rather than nags
("2 sessions logged this week", `home-1.png`). A weeks-on-plan figure survives a missed
Tuesday, which is why it is the right unit. Correct call; I would not change it.

The repeated primary action is consistent and named: Start Push on Home, on Coach/Plan and
after onboarding. Investment is rewarded — Progress converts logged sets into "+17.8 kg
since Jul 30" (`pg-pop.png`), and the exercise detail promises the payoff before you have
one ("No sets logged yet. The first time you log this lift, your last and best set appear
here.", `el-detail.png`).

Weakest here is the **exercise library (C)**: it has no repeated action of its own and no
sense of accumulation — 227 is a catalogue size, not the user's. Show "you have logged 46
of these" and the screen starts to earn return visits.

## Ranked required fixes

1. **Split builder: hide reorder and delete behind an Edit mode.** 41 controls, 15 deletes
   visible at rest (measured, `sb-pop.png`).
2. **Give the split builder an entrance.** Train tab → Splits + Exercises, or "Edit this
   split" in Home's session picker. Currently unreachable when populated.
3. **Stop lighting the accent Save when nothing is dirty.** `sb-pop.png` and
   `coach-11.png` both say "Saved" beside a filled Save button.
4. **Reorder the leave prompt** — Keep editing as preferred, Discard destructive and last
   (`sb-leave.png`).
5. **Cut the 227 repetition to one instance** and drop the resting accent ring on search
   (`exercise-library-default.png`).
6. **Delete the duplicated attribute grid** in the exercise detail sheet (`el-detail.png`).
7. **Move Coach Setup out of the segmented control** into a nav-bar sheet; move Save to the
   nav bar so it stops occluding TONE (`coach-11.png`).
8. **Show a selected state on the onboarding units step** (`onboarding-19.png`).
9. **Replace `<select>` with an iOS menu** in the New-exercise sheet (`el-create.png`).
10. **Demote secondary accent text** (Skip this step, See the full week, Not now) to
    neutral; **move the Progress axis prose to `sr-only`**; **hide the chat copy icon
    behind long-press**.
