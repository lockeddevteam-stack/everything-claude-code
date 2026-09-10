# Answer to ship review 2

Review of record: `review-design-2.md` (DO NOT SHIP, 19/30)
Second bug sweep: `review-sweep-2.md`
Answered against `redesign/08-build/` and `redesign/10-final/locked-demo.html`.

Every figure below was re-measured after the change, in Chromium at 393x852,
both themes, by the scripts in `redesign/tests/`.

---

## The two blockers

### Blocker 1 — the build does not survive AX5, and the test cannot fail

Accepted in full, including the part about the test. `tests/dynamic-type.mjs`
asserted `documentElement.scrollWidth > clientWidth`; `.screen` sets
`overflow-x: hidden`, so that condition cannot occur and the suite reported
green on thirteen screens whose primary button read "Fini".

The assertion now measures each text node's own box against its own
scrollWidth, skips text that is visually hidden by construction, and skips a
`text-overflow: ellipsis` truncation, because iOS truncates a list row at AX5
too. What it does not skip is a word cut in half with nothing to say it was
cut. On the first run it found 12 of 13 screens failing, 89 clipped nodes.

Every one of those is fixed:

| what broke | fix |
|---|---|
| `.btn` labels clipped ("Fini", "ose another ses") | `white-space: normal`, centred, with vertical padding so the capsule grows |
| a word longer than its column overflowed | `overflow-wrap: break-word` on `body` — never fires at the default ladder, and leaves min-content sizing alone |
| list rows crushed to 6px by their value column | `.row` wraps, `.row__main` has a floor of `min(100%, 8em)`, so once the title needs the row it takes the row |
| the set grid clipped "#", "W", "RIR" | columns are `minmax(figure, auto)`, the grid is `min-width: max-content`, and `.sets` scrolls sideways when the card runs out. A set table is the one thing on that screen that cannot reflow: five columns of numbers read across |
| the avatar and the emoji wells clipped their glyphs | sized in `em` |
| the tab bar's five labels ran together and "Profile" was lost | a container query whose `em` scales with the reader's setting drops the labels to an icon row above about xxLarge — hidden the way `.vis-hidden` hides text, not `display: none`, so "Profile, tab" is still the accessible name |

`node tests/dynamic-type.mjs` — 13/13 screens, all checks passed.

### Blocker 2 — an opaque debug chip on the body copy of all thirteen screens

Accepted. It is off the canvas: `translateX(calc(-100% + 8px))` leaves an 8px
sliver of the capsule's trailing edge and takes the label off-screen with it.
The demo's own "Screens" pill got the same treatment on a narrow window; above
900px it already sat beside the phone.

---

## The priority list

**1. Survive AX5, and fix the test.** Done — Blocker 1 above.

**2. Dev scaffolding off the content.** Done — Blocker 2 above.

**3. Teach the accent audit to see SVG and states.** Done, and it found three
real violations the resting-screen audit could not see:

- Progress drew its 1RM chart as an orange polyline with seven orange dots.
  The chart is ink now (`--text-secondary` line, `--text` points) with the
  accent spent on the last point, which is the one figure the screen reports.
- The numeric pad carried four outlined accent steppers, an accent Done and a
  red DEL. The steppers are neutral; Done is the only tinted thing.
- Coach's setup marked a chosen option with a filled accent disc, six of them
  at once. It is an accent checkmark now, which is what Settings does.

Two corrections to the audit's own method, both taken from the review's:
the floor is 300px² (an 8×8 live dot is an indicator, not a fill competing
with a 329×44 button), and the surface is the topmost thing on screen, so a
sheet is measured as its own surface rather than added to the screen behind
it. That is what §12.4 says: one tint per *surface*.

`node tests/accent-audit.mjs` — every screen, every state, at most one fill.

**4. Split the transition rule.** Accepted exactly as argued. The colour half
of the argument was right and the conclusion did not follow from it. Ground
and hairline stay at 150ms on `--ease`; transform and opacity moved onto
`--spring-snappy` / `--spring-smooth` at 300ms. The reduced-motion blocks keep
the plain fast fade, because a spring there would be the thing the setting
asks not to happen.

**5. Rebuild fuel's split control.** Accepted, and the reasoning is right: the
count was never the problem. Both halves are secondary capsules with a gap
between them. The product call stands — neither voice nor camera is the
other's fallback and neither is hidden behind the other — and Fuel now carries
no accent fill at all, which is correct for a screen whose job is reporting.

**6. The three claims that measured false.** All three were true findings.

- workout-log mixed 24×24 and 20×20: its inline `check`, `grip` and `bolt`
  dropped `ico--lg`, which now belongs to `.empty__ico` display graphics only.
  Train's `back` and `plan` did the same.
- shopping's tick was 14×14 at `stroke-width: 3` (ratio 0.214 against the
  family's 0.0875): it is 16×16 at 1.75, and fuel's matching tick with it.
- `.chip--icon .ico { 18px }` was a third optical size and is gone.
- `.sheet__grab` painted unconditionally: the bar is now declared only under
  `[data-grabber="true"]`, which the detent pass sets. A sheet with one height
  shows nothing.

**7. Remove both dashed borders.** Done. `.card--unverified` is a `--fill`
ground with a hairline and keeps its labelled head, which is what carried the
meaning. `.btn--dashed` is a secondary capsule.

**8. workout-log's header collision.** The metrics line was a *child* of the
title column, so it inherited a width the bolt, Discard and Finish had already
taken, and "1,488 kg" overflowed under the bolt. It is a sibling now. The
`.sess__meta` rule has said `flex: 1 0 100%; order: 3` all along; it had no
flex container to say it to.

**9. Large-title bar toward 96px, and stop autofocusing the library.** Both
done. `.hdr--large` is `min-height: 96px` with `align-items: flex-end`, so the
band is 52px of travel against the 44px collapsed bar — Apple's figure, where
it was 30px. The library no longer focuses its search field on arrival:
opening a tab should not raise the keyboard, and the screen was rendering at
rest inside a focus ring.

**10. Re-tune `--corner-smooth`.** Done, and the measurement is worth
recording: Chromium's `superellipse()` argument is the log2 of the curve
exponent. `superellipse(1)` computes back as `round`; `superellipse(2)`
computes back as `squircle`, i.e. |x|⁴+|y|⁴=1, which is the continuous corner
iOS draws. `superellipse(1.8)` was below that. The token names the keyword
rather than approximating it. 178 elements smoothed, 115 capsules deliberately
circular, zero capsules smoothed.

**11. Sheets spring from their trigger, and conditional dimming.** The first
is done: `chrome.js` records the trigger's rect on the capture-phase press and
writes the overlay's `transform-origin` to that control's centre, clamped into
the overlay's own box. Sheets marked this way animate from a 0.92 scale at
that point instead of rising from the bezel with no relationship to the tap.
Verified: tapping a cell on the workout log opens its pad at origin
`97.25px 0px`, which is the cell's own x.

On conditional dimming — **not changed, and here is the count.** Every sheet
in the build is `aria-modal="true"`: 36 of them. A modal sheet interrupts by
definition, which is the condition §8.6 names. Unconditional dimming over a
set of sheets that all interrupt is not unconditional in effect; it is the
right answer arrived at without a branch. If a non-modal sheet is ever added,
the branch goes in then.

**Sheet background: still opaque, deliberately.** §8.6 says glass, and the
argument against is the build's own rule for what glass is for. Glass shows
what is behind it. A sheet has a dimming scrim behind it — there is nothing
to see. Making it translucent would put a 20px blur under dense numeric
content to reveal a flat grey rectangle. The tab bar and the find bar are
glass because content scrolls under them; a sheet is a surface you read.

**12. Inset-group the full-bleed lists.** Done for shopping, whose item rows
ran edge to edge under an inset rounded card. Exercise-library was already
inset-grouped when re-measured — its group list renders inside `.card`.

---

## The subjective items

**§12.12, fuel's split primary** — accepted, see 5.

**§8.7** — implemented, see 11.

**§8.2, the tab bar's minimize** — accepted. It translated off the bottom
edge entirely, which the review called a rendering failure and which the bug
sweep then proved was worse than cosmetic: the translated bar left 56px of
overflow inside `.screen`, and the browser scrolled the screen itself when a
sheet took focus. The scrim stopped 56px short of the bottom, taps in that
strip reached through the modal, and the sheet floated off the bezel.

The bar now collapses to a capsule around the active tab and centres, which
is what §8.2 describes and which removes the overflow with it. Measured on
train: 369px wide at rest, 74px collapsed, still on screen, `.screen`
scrollHeight unchanged at 852.

**Tab bar height, 56 against §5.1's 49pt** — not changed. 49pt is the height
of a bar welded to the bottom edge with the home indicator below it. This bar
floats 12px clear of the safe area on all three sides and carries its own
hairline; at 49px the label sat 2px off the capsule's edge. 56 is the height
of the shape that is actually being drawn.

---

## What the second bug sweep found, and what happened to it

Severity 1 and 2 in full, and every severity 3 and 4 except where noted:

- **A crossing that went nowhere.** The Climbing lift row on Home was declared
  `mode: 'tab'`; there is no Progress tab, so it wrote a top-level route
  nothing owned and the app went blank with the hash changed. Progress is a
  pushed screen under Home now, and `assemble.mjs` throws on a crossing whose
  target is not what its mode says — the fifth silent-drop path in that file
  to be turned into an error.
- **The minimized bar breaking every sheet under it** — fixed by the collapse,
  above. All three consequences verified gone.
- **The library's last row unreachable at any scroll position.** The float
  budget assumed the accessory above the tab bar was one tap target high; the
  find bar is a search field and a chip row, 120px, so the scroller was 60px
  short. `chrome.js` measures the accessory and writes `--accessory-h` back,
  with `--tap` as the floor and a ResizeObserver for when it changes shape.
- **Sixteen labels running off the edge at 200% text** — the button fix in
  Blocker 1 took fifteen of them; `.badge` and `.chip` now wrap too.
- **"Unknown store"** — the store is required, and `S.purchaseError` renders
  the sentence it was already being set to. It had never been displayed.
- **Eleven decorative controls in Fuel and Progress.** Every one carried
  `close` under copy that promised a write, or no action at all. Each does
  what its label says now, the totals move with it, the destructive one is
  undoable rather than confirmed, and the record sheet no longer discards what
  was typed into it before closing.
- **Focus dropped to `<body>` after 125 interactions.** `LKPatch` could
  always restore focus to a control that survives a re-render; these controls
  remove themselves, so there was nothing to restore to. Focus now lands on
  whatever took the removed control's place in reading order.
- **The sheet snapping 8px sideways.** The full-bleed form was selected with
  `[style*="88%"]` — a substring match on the inline style, which stopped
  matching on the first pixel of drag. `chrome.js` writes a 0-to-1 figure over
  the last 8% of the travel and the CSS interpolates the inset and the corner
  against it.
- Plus: the clear dialogs count and pluralise, undo restores items where they
  were rather than appending them, two back buttons navigate, two empty
  handlers are gone, and the workout log's tab bar minimizes.

Two findings did not reproduce after the above and are not separately fixed:
`sheet-days` closes on Escape, and Fuel's accessory chips are reachable —
they now sit below the fold at rest rather than under the bar, which is one
scroll notch away and is where the last row of a page belongs.
