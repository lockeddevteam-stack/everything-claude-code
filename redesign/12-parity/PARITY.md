# Parity — the 541-feature audit against the redesign

Answers one question: does the redesign still do what LOCKED v6 does?

## How this was checked, and how far to trust it

The inventory is the v6 audit's 541 features (`audit/features.json` on
`claude/bold-bohr-47lngw`), taken from the production build.

**A first automated pass was thrown away.** Matching feature names against the
build's text scored 391 of 541 as covered. That number was false. It matched
vocabulary, not features: `weigh` hits twelve screens because of *weight* in
the set grid, and `stack` hits every screen because `.stack` is a CSS class.
Nothing in this document rests on it.

What replaced it: each area was read against the screens that carry it, and
every claim of absence below was checked by looking for the thing itself, not
for its name. Where a feature was removed on purpose, the removal is quoted
from the screen's own design notes, which is where the redesign recorded its
reasoning at the time.

**Also worth knowing: the test suite never checked this.** The freeze check's
baseline was generated from the redesign build, so it protects the redesign
from regressing against itself. It has never compared the new version to v6.
This document is the first time the two have been put side by side.

## The shape of the answer

The redesign carries most of v6. The places it does not fall into three piles,
and only the third is a defect.

1. **Cuts you approved.** Made on your say-so, recorded at the time.
2. **Cuts made on design grounds.** Judgement calls taken during the rebuild
   and written into the screens. You have not ruled on these. They are listed
   so you can.
3. **Gaps.** Things that are simply not there, with no decision behind them.

---

## 1. Cuts you approved

| What | Where it went | When you said so |
|---|---|---|
| Six top-level routes → five tabs | Cycle moved under Home; Progress under Home; Exercise Library and the workout log under Train; Shopping and Budget inside Fuel; Settings under Profile | "the five main ones are home trained fuel coach and then profile" |
| The Fuel Score | Deleted. A composite of weighted sub-scores that reads as rigorous and cannot be acted on | Wave 0 gate, recorded in `fuel.html`: "Cut at the Wave 0 gate by the owner" |
| Receipt scanning, out of Fuel | Moved to Shopping — parsing a receipt is a grocery job, not a logging one | "Cut it from Fuel" |
| Creatine loading protocol | Never built | "creatine loading is a myth dont include that" |
| Stretching, plyometrics and cardio entries in the catalogue | 198 of 886 dropped; 688 lifts kept | "Lifting only, 688" |
| Neck as its own muscle group | Folded into Back / Traps | "Fold into Back → Traps" |

---

## 2. Cuts made on design grounds — your call

Each of these was removed during the rebuild with a reason written into the
screen. None of them was put to you.

### Home — seven blocks removed, ten down to four
Quoted from `home.html`: *"CUT: greeting block, 2x2 stat grid (179px, 0
controls), quick actions, feed cards (source of the '999 days' sentinel),
VIEW PROGRESS, Weekly Recap, calendar (338px, no tappable cells), cycle row,
ThrowbackCard, the voice FAB."*

Audit features affected: F-HOME-001 quick actions, F-HOME-002 greeting,
F-HOME-004 stats grid, F-HOME-006 proactive insight, F-HOME-007 throwback,
F-HOME-009 dynamic feed, F-HOME-011 weekly recap, F-HOME-012 calendar.
The streak survives, inside the momentum band.

**Worth a second look:** the Weekly Recap was a whole screen, and the
month calendar is the only place the app showed a month at a glance. Both
are defensible cuts; neither is obviously right.

### Home — configurable block layout, and the editor that drove it
F-HOME-003 and the Profile `LayoutEditor`. Quoted from `settings.html`:
*"It let a user reorder Home from another tab... Home has been rebuilt to four
blocks with one primary action, so the thing it repaired is gone. Ordering
Home is the designer's job, not a setting."*

The reasoning holds only while Home stays four blocks. If Home grows again,
this comes back.

### Progress — the tab strip and four surfaces
Quoted from `progress.html`: Photos (906 lines), Calendar, Day-1-vs-PR cards,
the Strength Profile bar chart, the "1RM —" chip, ThrowbackCard, and the third
range option.

**Progress Photos is the big one.** It is ~906 lines and the whole
`/analyze-physique` AI pathway. It is not in the redesign at all. The audit
also flags it as a privacy problem (H4: posts your photo with no auth, no
consent step and no opt-out, on a screen that says "stored on device"). So it
needs a product decision, not just a port.

### Train — Cardio absorbed
Quoted from `train.html`: the separate Cardio screen and its back button, the
duplicate history list and filter chips, the "which treadmill?" step *"its own
copy called cosmetic"*, and the 41-tile wall replaced by three ranked rows
plus a search-first picker.

Logging cardio still works: favourites log in one tap, the picker opens the
full catalogue, and there is a save sheet. What is gone is the separate
destination, not the function.

### Train — four hub controls
Quick Start, the RECENT strip, the day sheet, and Delete split from the footer
(*"it had no confirm and sat a thumb-width from Start"*).

### Settings — eight cards
LayoutEditor, the beta code card, Replay Tutorial, Cycle logging and Microphone
flags, Text size (iOS ships Dynamic Type), Fuel display preferences, and the
privacy disclosure block.

**Text size is worth confirming.** The reasoning is that Dynamic Type covers
it. That is right on iOS and wrong everywhere else.

### Coach and the workout log — the floating voice button
Cut from both, and from Home. *"It won the squint test, it was an emoji on a
gradient, and it painted over 7% of SAVE PLAN"*, and it intercepted pointer
events on two other screens. **Voice input as a feature went with it.**

---

## 3. Gaps — not there, and no decision behind them

These are the ones to act on.

| # | What | Audit | Notes |
|---|---|---|---|
| G1 | **Recipes** | `RecipesTab` (40760), `RCard` (40920) | No counterpart anywhere. Already named as not-done in `11-apple/spec-compliance-3.md`. |
| G2 | **Meal plans** | `MealPlanFuelTab` (37469), AI meal plans | No counterpart. Note the audit's own finding: the dead twin `MealPlannerTab` (45234, ~670 lines) can go, but the live one is a real feature. |
| G3 | **Paywall** | F-PAY, 4 features | Six gated cards, $6.99/mo or $60/yr. Absent. The audit notes there is no purchase flow in v6 either — the CTA reads "Available on the App Store Soon" — so this may be deliberate. Your call. |
| G4 | ~~**"Stack" / PED tracking**~~ | F-CYCLE-200+, behind `lk_perfTracking` | **Built.** All 11 features, gated and off by default, with five audit defects fixed and the overview's numbers computed rather than generated. |
| G5 | **Progress photos** | F-PROF, ~906 lines | See above. Function absent; privacy defect noted. |
| G6 | **Voice input** | `VoiceButton` (53718), `/voice` route | The button was cut for good reasons. The capability was not replaced. |
| G7 | **Tutorial / coach marks** | `TutorialOverlay` (54228) | Cut by the Apple directive. A new user now gets no guided first run beyond onboarding. |
| G8 | **Beta program** | F-BETA, 4 features | Card cut from Settings. The audit rates the underlying system as broken anyway (C2: uploads health data unauthenticated; H3: gating fails open). Do not port as-is. |

---

## 4. Things in the redesign that came from cuts, or that I would question

- **Cycle is under Home.** In v6 it is a sixth top-level route. Folding it in
  was right, but cycle is 57 features and the redesign's `cycle.html` covers
  the day log, the 28-day strip, phases, discreet mode and delete-all. It does
  not cover the five Mc* cards (`McHealthCard`, `McRecoveryCard`, `McEcCard`,
  `McTrainingCard`, `McNutritionCard`). One of those, `McNutritionCard`, the
  audit calls out as **lying** (M8: it claims Fuel tracks iron against an 18 mg
  target and adds a calorie allowance; the pathway is dead code). Do not port
  that one. The other four are real.

- **Stack is built, including the overview.** The first pass left out the AI
  cycle overview on the grounds that its prompt told the model not to
  moralise. The owner pushed back and was right: a fitness app that pretends
  these are not in use is less honest, not more careful, and "do not
  moralise" is not the same instruction as "withhold information". The
  overview is built. Its arithmetic half -- clearance dates, weekly totals,
  what is still active past the end date -- is computed on the device from
  half-lives stored as hours, so it is correct whether or not anything
  answers. Its generated half is told to be direct and skip the disclaimers,
  and is not told to leave anything out.

- **Do not port these, whatever else you restore.** The audit found them dead
  or broken in v6: `MealPlannerTab` (dead twin), the PRHub Overview tab
  (unreachable), `LOCKED.can()` (zero call sites), four of six `Ds*`
  primitives, `McFuelStrip`, `Placeholder`, and the fabricated-data paths
  (H2: invented macros and grocery prices shown as real).

---

## 5. What I did not do

Per-feature adjudication of all 541 individually. This is an area-level pass
with the absences verified one by one. The areas read as substantially covered
— Train, Fuel, Shop, Budget, Supps, Water, Goals, Cycle, Coach, Onboarding,
Auth, Settings — but "substantially" is doing real work in that sentence, and
a feature-by-feature sign-off on the 263 features in the five tab areas is a
separate job.
