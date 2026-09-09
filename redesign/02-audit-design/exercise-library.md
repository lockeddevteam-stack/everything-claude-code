# Design Audit: Exercise Library (`exercise-library`)

Captures: `exercise-library-*` in `00-inventory/screenshots/current/`. Measured live at 393x659 (iPhone 15 Pro) unless a capture is named; scans from `tests/baseline/`.

## 1. Squint and 5-second test

8px blur (16px on the 2x capture). **Populated root:** first the white "Exercise Library" wordmark (32px/800), then a rainbow of twelve equal blobs, then the orange voice FAB. **The search field disappears entirely** — fill `rgba(24,24,27,.8)` on `#1C1C1E`, its 1px border 1.07:1 against that card. The title wins; the winning *interactive* element is the 12-card grid.

5-second read: "a menu of body parts." Nothing says this is a searchable catalogue of 225 exercises (the twelve counts sum to 225). Search is the only tool that scales to that, and it is the least visible thing on screen and **not focused on arrival** (`document.activeElement` = `BODY`).


## 2. Numbered callouts

Keyed to `exercise-library-annotated.png`. **1** search field, invisible boundary, unfocused. **2** title wins the squint. **3** "SELECT MUSCLE GROUP" 11px/700, smaller than what it labels. **4** twelve identical 172.5x119.1 cards, names 16px/800 in eleven hues, the same dumbbell glyph in all twelve, so the icon carries nothing; 8 visible, 4 below the fold. **5** Shoulders and Triceps painted `#FB923C`, the action accent. **6** Create Custom 353x42. **7** Back 22x27; the page replaces the Train hub, so the My Splits / History / Library strip is gone (`trainSegmentedPresent:false`) — the global tab bar survives, its siblings do not. **8** empty demonstration box 351x351 (`img naturalWidth 1`, `complete true`, no alt shown, no placeholder, no retry): 53% of viewport height, **81% of the visible sheet body**; the blurred sheet's dominant object. **9** 830px of sheet content in a 432px scroller, so Muscle Group / Part / Equipment sit below that void. **10** ADD TO WORKOUT / BACK, 16px/800 all-caps, 170.5 vs 172.5 wide, gradient plus accent glow. **11** third dismissal (grabber + x + BACK). **12** result row 353x63.2 carries name + equipment only — no muscle, no load, no PR, no "already in a split". **13** Clear 31.1x15.

## 3. Measurements

Contrast, every distinct style (baseline: 28 checked, 0 fail, 1 unknown):


| Style | Ratio |
|---|---|
| 32/800 title | 17.8 |
| 16/800 category names, 11 hues | 4.51 (Hamstrings) to 7.92 (Quads) |
| 11/400 count, 11/700 label, 14/600 Create Custom | 6.64, 8.19, 9.28 |
| 16/400 placeholder, sheet 13/700, 12/400, 16/800 | 6.00, 15.6, 6.64, 19.4 |
| FAB emoji over gradient | unknown, not passing |

Targets, page-owned controls across all four views: 24/28 pass 44x44 = **85.7%**. Fails: Back 22x27, Create Custom 353x42, Clear 31.1x15, "All Muscles" 91.8x18 (baseline root-only: 2 of 21).

Spacing, non-zero longhands, nav and FAB excluded: root 87/104 = 83.7% (off-grid 2px x12, 20 x4, 58 x1); sheet 52/64 = 81.3% (10 x3, 20 x7, 177.5 x2). Combined **139/168 = 82.7%**, no break documented.

Type: 9 sizes across populated root + open sheet (10, 11, 12, 13, 14, 16, 20, 24, 32), weights 400/600/700/800, line-height set on 3 of 5 root pairs. Radii: 8 distinct (2, 9, 10, 11, 12, 14, 16, 24).

## 4. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 1 | `-populated.png` squint: 12 cards share 172.5x119.1, r16, 16px/800; zero primary-styled controls |
| Typography | 2 | 9 sizes root+sheet, 2 of 5 line-heights unset, no 700+ on running text under 15px |
| Spacing | 3 | 82.7% on grid (139/168); undocumented breaks at 2, 10, 20, 58, 177.5px |
| Contrast | 5 | 0 failures over 28 checked (`scans/exercise-library.json`) plus 16 styles here; the one unknown is the shell FAB over a gradient |
| Component consistency | 2 | one row type with local overrides (63.2 vs 75.1 high) but 4 back/dismiss variants (22x27 arrow, 91.8x18 link, 44x44 x, 172.5x60 BACK) and 8 radii; `-subgroup.png` |
| Targets | 2 | 24/28 = 85.7%; Back 22x27, Clear 31.1x15, All Muscles 91.8x18, Create Custom 42 high |
| Motion and feedback | 5 | real `mouse.down`, 100ms read: card, Create Custom, Back, search, row, ADD all change (scale 0.97 / bg .8→.89); `slideUp` + `overlayIn`, nothing decorative |
| HIG fit | 1 | 3 sections: Layout (4 sub-44 targets), Color (11 category hues, accent spent on 2 of them), Buttons (no primary on the browse screen, all-caps pair, triple dismissal) |
| AI-look penalty | 2 | 3 tells (`-populated.png`, `-detail-modal.png`): gradient+glow primary button, 8 mixed radii, 12 stacked equal-weight rainbow cards |
| Accessibility | 3 | axe: 1 critical `meta-viewport` (shell, capped at 3); controls labelled; search unfocused; 120% text untested |

**Design mean 2.6.**

## 5. Detail checklist — 3/11

| # | Verdict | Measurement |
|---|---|---|
| 1 | fail | zero accent-filled buttons in `-populated.png`; the 5-second test names none |
| 2 | fail | 9 sizes; 14px and 20px line-height `normal` |
| 3 | fail | 82.7% on grid, breaks undocumented |
| 4 | **pass** | 5/5 controls change at 100ms under a real press; `button:disabled` rule present |
| 5 | **pass** | `slideUp` 500ms (sheet), `overlayIn` 300ms (scrim), `pillIn` 350ms (add toast) — all caused; list cannot grow |
| 6 | fail | empty = "No results": 2 words, no instruction, zero action controls (`-empty.png`); error silently omits the 351px box, and its "No form video found" line also shows when populated (`-error.png` vs `-detail-modal.png`) |
| 7 | fail | `tabular-nums` on 0 nodes; "30 exercises" and "10 ex" for one quantity |
| 8 | fail | one set, stroke 1.8, but 4 optical sizes (15, 16, 17, 22) |
| 9 | fail | no h-overflow (`scrollWidth 393 = clientWidth`); 4 targets under 44px |
| 10 | fail | surface L* rises 0 → 13 → 28 → 44 correctly, but ADD TO WORKOUT carries an `rgba(249,115,22,.25/.22)` accent glow |
| 11 | **pass** | every label under 4 words; 0 exclamation marks; no filler |

## 6. Consistency deltas vs `design-system-current.md`

- **Radii:** 8 values against a 4-value target; the search `input` is radius 0 in an 11px wrapper.
- **Accent:** the system defines one accent (`#F97316`); this page paints 11 category hues and spends `--color-accent-text` on Shoulders and Triceps.
- **Tab pattern:** the only Train view that *replaces* its host's segmented strip rather than nesting; `lk_ui_trainView` persists, so a relaunch lands here with no sibling views.
- **Card style:** cards use the app's `0 1px 2px + 0 6px 20px` shadow, the sheet's primary the accent glow — two of the app's 11.
- **Icons:** one set at stroke 1.8, four optical sizes, one glyph for 12 categories.

## 7. Keep, fix, cut

- **Keep:** the search-results row — 353x63.2, one implementation, 100ms press, fastest path to any of 225 items (`-search.png`).
- **Fix:** make search visible and focused on arrival (border 1.07:1, lost at 8px blur), and keep it at group level, where it vanishes (`-populated-group.png`).
- **Fix:** the 351x351 box must show something — a frame, the muscle, or a missing-media line — instead of 81% of the sheet body reading as a void (`-detail-modal`, `-loading`, `-error` are alike there).
- **Cut:** eleven category hues, the repeated glyph, two of three dismiss controls.

## 8. After reading the function audit

ADD TO WORKOUT is inert from this entry (`TrainHub` passes no `onSelect`): callout 10 marks the page's only accent-filled control as dead, not merely loud. The "No animation available" fallback exists but never fires, confirming my reading of the void. Neither changes a score — Hierarchy and HIG were already 1.
