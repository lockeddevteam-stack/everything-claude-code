# LOCKED redesign — craft, consistency and depth audit

Six screens, one shared stylesheet, 393×852, dark. Every claim is a measured value or
a capture I took. The objective sweep is clean; this is what it cannot see.

**Totals: 24 cross-screen inconsistencies, 12 dead selectors, 30 rules with unset tracking.**

---

## Required fixes, ranked

### 1. Light theme breaks elevation at the top level (real defect, blocking)
`tokens.css` claims "Light is defined with verified contrast pairs", but the pair
table at the end lists dark only. Measured L\* on the light ramp:
`surface-sunken 93.15 → surface 96.59 → bg 100.00 → surface-raised 100.00`.
The ramp is not monotonic and the two highest levels are **identical**.

Consequence, measured live with `data-theme="light"` on `home.html`:
`.card--raised` renders `rgb(255,255,255)` on a `body` of `rgb(255,255,255)` —
**1.00:1**. The "Push" card, the screen's primary object, has no boundary
(`shots/LIGHT-home.png` vs the dark capture). Also failing in light:
`border` on `surface` **1.81:1** (dark achieves 3.06:1, the stated non-text floor),
`hairline` on `bg` **1.35:1** — every `.row + .row` separator and every
`.card__head` underline effectively disappears.
Sheets survive only because the scrim darkens the ground (`LIGHT-exercise-library.png`).

Fix: give light a genuine four-step ramp (raised needs a distinct value or a border),
raise `--border` to ≥3:1 on `--surface`, and extend the pair table to light.

### 2. Thirty shared rules set a scale size and drop the tracking token
`tokens.css` states "Line height and tracking are set per size, never ad hoc," and the
`.t-*` helpers honour it. **30 component rules in `components.css` set
`font-size: var(--type-N)` with no `letter-spacing`; 17 of those also omit
`line-height`.** Includes the highest-traffic classes: `.row__title`, `.row__sub`, `.row__value`,
`.input`, `.chip`, `.seg__item`, `.banner`, `.empty__title`, `.empty__body`,
`.toast__body`, `.stat__unit`, `.hero__unit`, `.opt__title`, `.composer__input`.

Measured: `.row__sub` at 13px reports `letter-spacing: normal` where `.t-detail` at
the same size reports `0.065px`. Identical 13px text tracks two ways depending on
which class the agent reached for. `.tabbar__item` hardcodes `letter-spacing: 0` —
defensible for non-uppercase labels, but it should be a token, not a literal.

Fix: add the matching `--tr-N`/`--lh-N` to all 30, or have components compose the
`.t-*` helpers instead of restating sizes.

### 3. Numbers in list detail are not tabular; the value beside them is
`.num`/`[data-num]` gets tabular figures, but the shared text classes do not.
Measured on `progress` populated: `.row__value` "110.8 kg" is tabular; the
`.row__sub` directly beneath it — "Sep 7 · 87.5 kg × 8 · 2 records" — reports
`font-variant-numeric: normal`. In a nine-row stacked column of records, one side
of every row aligns and the other does not. Same for `.t-meta trend-up`
"+17.8 kg since Jul 30", the screen's headline delta, and the "Also tracked"
deltas ("−1.1 kg since Jul 27"). **66 rendered numeric nodes are non-tabular.**

Also inconsistent *within one file*: `split-builder.html:429` writes
`class="t-meta" data-num`, `split-builder.html:279` writes `class="t-meta"` with no
`data-num` for the same kind of count.

Fix: put `font-variant-numeric: tabular-nums` on `.row__sub`, `.t-meta`, `.t-detail`,
`.t-label`, `.seg__item` rather than relying on authors remembering `data-num`.

### 4. Coach's header does not match its three sibling tab screens
Measured header geometry and title type on the four screens that share the tab bar:

| screen | title class | size / weight | header height |
|---|---|---|---|
| home | `.t-title` | 22px / 700 | 62px |
| progress | `.t-title` | 22px / 700 | 62px |
| exercise-library | `.t-title` | 22px / 700 | 62px |
| **coach** | `.t-section` | **17px / 600** | **52px** |

home, progress and exercise-library also carry a `.t-label` eyebrow ("WED, SEP 9",
"STRENGTH", "227 in the library"); coach carries none. `hdr--tight` was added to
`components.css` for coach alone. Switching tabs shifts the title 5px and the bar
10px. split-builder and onboarding also use 17px, but they are pushed flow screens
with a back chevron and no tab bar — that one I would call a defensible convention.

### 5. Two screens bypassed the shared stylesheet with inline `<style>`
`split-builder.html` (64 lines) and `onboarding.html` (89 lines) carry inline CSS;
the other four carry none. Inside them:

- `.optrow` re-implements the shared `.opt` (same layout, same `aria-checked`
  contract, different mark size: 20px vs `--sp-5`/24px).
- `.chipwrap` re-implements `.chiprow`.
- `.skelline` (split-builder) and `.skel--line` (onboarding) are the same idea under
  two local names; neither is in the shared sheet.
- `.sheet__foot` is declared in both `components.css` and split-builder inline.
- `.stage` and `.phone` are shared, and split-builder redefines both; onboarding
  invents `.device` for the same frame.
- **`.wrap` collides**: `components.css` defines it as `flex-wrap: wrap` (used by
  `coach.html:702`); onboarding's inline block redefines it as `max-width: 30ch`
  and wins in that file. Same class name, two meanings.

### 6. `.hero__value` is a byte-for-byte duplicate of `.t-hero`
Both set `--type-28 / --lh-28 / --tr-28 / 700 / tabular-nums`. `.t-hero` is
consequently dead — the one 28px size in the system is defined twice and the
canonical one is unused. Delete `.hero__value`, use `.t-hero`.

### 7. `.mt-1` is used and never defined
`onboarding.html:905` renders `class="t-title mt-1"`. No `.mt-1` exists in
`components.css` (the scale starts at `.mt-2`). Silent no-op — the heading has no
top margin where the author intended `--sp-1`.

### 8. Selecting one of N is solved four ways
- `.row--selected` → whole-row `--accent-quiet` (progress, onboarding)
- `.optrow[aria-checked]` → whole-row `--accent-quiet` (split-builder) — visually
  identical to the above, implemented separately
- `.opt[aria-checked]` → **mark only**, row stays `--surface` (coach)
- `.chip[aria-pressed]` → `--accent-quiet` pill (exercise-library, split-builder)

The coach/split-builder pair is the real problem: two adjacent screens give a chosen
row two different amounts of emphasis. Pick one and delete the rest.

### 9. Section headings: split-builder is the outlier
`.section__head` is shared, but its contents are not. coach 12×, exercise-library 9×,
progress 4×, onboarding 3×, home 2× use an 11px uppercase `.t-label`.
split-builder uses `.t-section` (17px, sentence case) for "Days", "Add a detail",
"Your description is kept" and has exactly **1** `.t-label`.

### 10. Home's loading state does not mirror its loaded state
progress and exercise-library build skeletons that match the loaded shape (segmented
bar, headline block, chart card with an inner chart box, then rows — compare
`shots/progress__dev-state-loading.png` to `..._populated.png`). Home's skeleton is a
small avatar-plus-bar row and one large rectangle
(`shots/home__dev-state-loading.png`); the loaded screen has a hero figure, a
seven-column week track, a session card and two list rows. The week track — present
in *every other* home state — is absent from the skeleton entirely. Skeletons do
pulse (`pulse:running:1400ms` measured), so the state is distinguishable; it just
teaches the wrong shape.

### 11. Smaller items
- **12 dead selectors**: the entire `.switch` component (`.switch`, `.switch__track`,
  `.switch__knob`), the entire `.pad` keypad (`.pad`, `.pad__key`,
  `.pad__key--action` — the "replaces on first digit" component that is documented
  and never rendered), `.t-hero`, `.carousel`, `.media__note`, `.muted`,
  `.seg--wrap`, `.stack--5`. (`.week__mark--*` and `.strength__seg--*` looked dead
  but are built by string concatenation — they are live.)
- `.seg--tall` (coach) and `.seg--lg` (progress) are the **same rule**
  (`.seg__item { min-height: var(--tap) }`) under two names, added by two agents.
- `--spring` is documented "sheets only" and is used by `.sheet`, `.dialog` *and*
  `.toast`.
- `.toast__body` is a `<span>` in coach and exercise-library, a `<div>` in split-builder.
- "The coach is down" is the headline for two unrelated failures (`dev-preset-3`
  send failure, `dev-preset-16` instruction-write failure).
- Four different dev-toggle implementations and three `data-testid` schemes
  (`dev-state-*`, `dev-preset-*`, `dev-<screen>-<variant>`). Demo chrome, but it
  makes one cross-screen test harness impossible.
- `onboarding.html:874` uses `.empty` with only an `__body` — no icon, title or
  action — as a paragraph wrapper.

---

## Genuinely right

- **Sheets rise, they do not fade.** Measured frames on the exercise-library detail
  sheet: `top` 852 → 505 → 312 → 252 → 216 → 205 → 199 → 195px over 300ms on
  `--spring`, with `opacity` pinned at 1 throughout. Under `reducedMotion: reduce`
  the same sheet jumps 852 → 195px on the next frame.
- **Pressed feedback is real.** With `page.mouse.down()` held and sampled at 90ms,
  20 of 21 controls across all six screens changed background, transform or opacity.
  The one that did not, `.composer__send`, carries `disabled` on an empty draft —
  correct. Under reduced motion the transform still lands (transition collapsed to
  0.01ms, not removed), so feedback survives the accessibility setting.
- **700 weight is disciplined.** Every 700-weight text node I sampled across 11
  states is either a screen title (`.t-title`) or a number (`.hero__value`,
  `.stat__value`, `.num`). No 700 body text anywhere.
- **No shadow carries colour.** Both shadow tokens are `rgba(0,0,0,α)`. The only
  coloured `box-shadow` is `.input:focus`'s `--accent-quiet` ring, which is a focus
  indicator, not elevation.
- **Dark elevation is monotonic and reads as native, not inverted**:
  L\* 1.39 → 2.76 → 6.39 → 10.38 with hairline 17.20 and border 22.33 above it.
- **Error copy is the best thing here.** Every error names the failure, what survived,
  and two ways forward: "The request timed out after 20 seconds. Nothing was charged
  and nothing was saved"; "Your last sync failed, so sessions after Aug 24 are
  missing. Nothing was lost on this phone"; "Your details were not sent, so nothing
  is wrong with them." Six agents, one voice.
- **Empty states obey one-sentence-one-action.** All six use the shared `.empty` and
  teach a next step rather than apologising.
