# Wave 0 — Recon

No edits. This is the measured gap between the redesign build and
`apple-design-spec.md`, plus the freeze list that protects every function
through the waves that follow.

Target confirmed as the **demo redesign** in `08-build/`, assembled into
`10-final/locked-demo.html`. Not the live app.

---

## 1. Ground truth, checked rather than assumed

The directive's ground-truth section describes the live app. It does not
describe this target, so here is what this one actually is.

| | Live app (`lockeddevteam-stack/locked`) | This target (`redesign/08-build`) |
|---|---|---|
| Shape | one 58,317-line `index.html` | 11 screens, 10,440 lines total |
| React | 18.3.1 via CDN, 4,429 precompiled `createElement` calls | none. Vanilla JS |
| Styling | inline `style={{}}` objects | two shared stylesheets, 127 custom properties |
| Build step | none | none |
| Opens from | Vercel | a file on disk, no server |

**This matters for the whole plan.** The directive's §2.2 patch protocol exists
because parallel agents corrupt one 100k-line file. That risk is not present
here: eleven separate screens plus a shared layer can be edited directly, and
the one-writer rule costs more than it buys. I have kept the *verification*
half of §2.3 — every claim carries a measured number — and dropped the patch
ceremony. Say if you want it back.

---

## 2. The census, and why it reads so differently

The directive expects a census in the thousands falling toward zero by Wave 5.
This build starts near zero because it was built token-first.

| Measure | Live app | This target |
|---|---|---|
| Raw `px` literals | 2,269 | **48** |
| Distinct hex colours | 114 | **2** |
| `borderRadius` occurrences | 1,199 | 0 (all through tokens) |
| Distinct radii | 34 | **5** |
| Distinct font sizes | 33 | **6** |
| Transition declarations | 192 across 39 keyframes | **2 durations** |
| CSS custom properties | 49 | **127** |
| Inline `style=` attributes | ~every element | **97** |

So the census is not the useful Wave 0 output here. The useful output is
section 3.

---

## 3. The actual gap to the spec

Measured against `apple-design-spec.md`. This is the work.

### 3.1 Type — partial

Six sizes exist: 11, 13, 15, 17, 22, 28. Apple's scale has eleven roles.

| Apple role | Size | Present? |
|---|---|---|
| Large Title | 34 | **missing** |
| Title 1 | 28 | yes |
| Title 2 | 22 | yes |
| Title 3 | 20 | **missing** |
| Headline | 17 semibold | yes (as weight on `--type-17`) |
| Body | 17 | yes |
| Callout | 16 | **missing** |
| Subheadline | 15 | yes |
| Footnote | 13 | yes |
| Caption 1 | 12 | **missing** |
| Caption 2 | 11 | yes |

Tracking and line-height already exist per size (`--tr-*`, `--lh-*`), which is
the part most builds skip. Tabular numerals are already on the three smallest
helpers. **Gap: four sizes, and the roles are not named** — a token called
`--type-17` does not tell an author whether they want Body or Headline.

### 3.2 Corners — the largest single gap

Radii: 8, 12, 16, 999, plus 0. All plain `border-radius`.

**Zero squircles.** No `corner-shape`, no superellipse, no clip-path fallback.
Spec §3.1 is explicit that plain `border-radius` reads wrong above ~16px, and
this build uses 16 widely. This is the change that will move the needle most
per line of code.

**No concentricity helper.** Nested radii are typed by hand, so nothing
guarantees a child is not sharing its parent's radius — the pinched look spec
§3.4 names.

### 3.3 Motion — no springs at all

Two durations (150ms, 300ms) and two cubic-bezier easings. One token named
`--spring` which is `cubic-bezier(0.32, 0.72, 0, 1)` and used on exactly one
animation, the sheet rise. That is an ease curve with a spring's name, not
spring physics.

Missing entirely: the `linear()` sampled spring, the rAF solver, gesture
velocity handoff, rubber-band overscroll, and the six wobble moments in
directive §5.4. `prefers-reduced-motion` is honoured in 3 places.

### 3.4 Glass — two rules, no system

`backdrop-filter` appears twice in `components.css`. There is no glass token,
no chrome/content separation rule, no grouping to stop glass sampling glass,
and no `prefers-reduced-transparency` fallback anywhere.

### 3.5 Chrome — none of the iOS 26 behaviours

- Large-title collapse on scroll: **not built**. Headers are static.
- Tab bar minimize on scroll: **not built**.
- Bottom accessory shelf: **not built**. This is where a live workout belongs.
- Search at the bottom on phone widths: **not built**. Exercise library
  searches from the top.
- Scroll edge effect under bars: **not built**.
- Sheets: 14 rules exist and they rise correctly, but there are **no detents
  and no grabber** (0 matches).

### 3.6 What already passes

Worth stating so no wave spends effort re-winning it:

- **Targets:** 0 of 466 under 44px, both themes.
- **Contrast:** 0 axe violations, 0 sub-AA text, both themes.
- **One accent per surface:** enforced in `components.css`.
- **Tabular numerals:** on every live value.
- **Spacing:** every value on the 4/8 grid (4/8/12/16/24/32).
- **Dark and light:** both measured, both clean.
- **Safe areas:** `env(safe-area-inset-*)` in use.
- **Tap highlight:** already killed.
- **Press states:** 35 `:active` rules — but they fire on `:active`, not on
  touch-down with a spring return, so §7 rubric item 6 is a partial pass.

---

## 4. Ranked, by how much Apple-ness per unit of work

1. **Squircles.** One helper, applied through the existing radius tokens.
   Touches every card, button, sheet and chip at once.
2. **Springs.** A `linear()` generator plus a rAF solver for gestures. Replaces
   two easings everywhere.
3. **Chrome behaviours.** Large-title collapse, tab bar minimize, bottom
   accessory shelf, bottom search. The layer read as "Apple" before anything
   else.
4. **Type roles.** Add the four missing sizes, rename tokens to Apple's roles.
5. **Glass system.** Chrome-only, grouped, with the reduced-transparency
   fallback.
6. **Sheet detents and grabbers.**
7. **Press on touch-down** with spring return.

---

## 5. Freeze list

`11-apple/FEATURE-MANIFEST.md`, generated by `11-apple/gen-manifest.py`, which
parses the build rather than reading it. Self-check confirmed: the generator
reproduces the committed file byte for byte.

**174 distinct actions, 543 testids, 309 buttons, 27 inputs, 60 listeners
across 11 screens.** Any wave that drops one of those is blocked.

Diff it with:

```
python3 11-apple/gen-manifest.py > /tmp/now.md
diff 11-apple/FEATURE-MANIFEST.md /tmp/now.md
```

---

## 6. Baseline captures

22 frames in `11-apple/screenshots/before/` — 11 screens by 2 themes, 393×852
at 2x, taken through the demo's own navigation so what is captured is what a
person sees, inside the shadow-root isolation with the chrome present.

---

## 7. Navigation, corrected by the owner

The demo's tab bar is wrong. It carries Progress in a tab slot and has no
Profile at all. The live app's model is the right one and the demo should
match it:

| Tab | Screens under it |
|---|---|
| Home | home, **progress**, cycle tracker |
| Train | train, workout log, review, **exercise library**, cardio |
| Fuel | fuel, **shopping**, **budget** |
| Coach | coach |
| Profile | profile, settings |

So: **Progress leaves the tab bar** and lives under Home, where the live app
already puts it. **Profile takes the fifth slot.** Exercise library stays a
pushed screen under Train, which it already is — no change.

## 8. Fuel is in scope, and it is a build not a restyle

Corrected: Fuel is to be built here from Concept D, with Shopping and Budget
inside the Fuel tab.

Concept D is at `locked/docs/fuel/fuel-rebuild/03-concepts/D-merged/`, twelve
screens plus an index:

```
01b-home-hidden      01c-home-first-weeks   02-mic-listening
03-mic-confirm       04-camera              05-food-detail
06-meals             07-trends              08-score-or-review
09-profile           10-supps-water         11-fallback-log
```

`08-score-or-review` renders the Fuel Score, which you cut at the Wave 0 gate.
It is not built. The rest are.

**Concept D contains no Shopping and no Budget screens.** Those exist only in
the live app as `ShoppingBudgetTab`. They will be designed here from that
behaviour rather than copied from a concept that does not cover them.

### What this means for the order of work

Four screens do not exist in this build at all: Fuel, Shopping, Budget,
Profile. Building them in the current style and then restyling them would be
doing the work twice. So they are built **after** the foundation and chrome
land, and they are built Apple-native from the first line.

Revised waves:

1. **Wave 1 — Foundation.** Squircles, springs, the four missing type roles,
   the glass system. Nothing visual ships; the app renders identically.
2. **Wave 2 — Chrome.** The corrected five-tab bar, large-title collapse, tab
   bar minimize, bottom accessory shelf, bottom search, sheet detents and
   grabbers.
3. **Wave 3a — Build the missing four**, Apple-native from the start: Fuel from
   Concept D, then Shopping, Budget and Profile.
4. **Wave 3b — Restyle the existing eleven** against the same foundation.
5. **Waves 4 to 6** as the directive has them: cross-page consistency,
   accessibility and performance, final gate.

## 9. Gate

Wave 0 is done. Screen list and navigation are settled by sections 7 and 8.

Still open, and neither blocks Wave 1:

1. **The patch protocol.** I dropped it, per section 1. It exists because
   parallel agents corrupt one 100k-line file, which is not the shape of this
   target. Say if you want it back.
2. **The priority order** in section 4. Reorder it if you disagree; I am
   starting at the top of it.
