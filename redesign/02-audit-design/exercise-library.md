# Design Audit: Exercise Library (`exercise-library`)

Captures: `exercise-library-populated.png`, `-populated-search.png`, `-populated-group.png`, `-populated-subgroup.png`, `-populated-detail-modal.png`, `-empty.png`, `-error.png`, `-loading.png`. Live measurements at 393x659 (iPhone 15 Pro) unless a capture is named. Scans: `tests/baseline/scans/exercise-library.json`.

## 1. Squint and 5-second test

8px blur (16px on the 2x capture). **Populated root:** first the white "Exercise Library" wordmark (32px/800), second a rainbow of twelve equal blobs, third the orange voice FAB. **The search field disappears entirely** — its fill is `rgba(24,24,27,.8)` on `#1C1C1E` and its 1px border resolves to 1.07:1 against that card, so at 8px blur nothing marks it. The element that wins is the title; the winning *interactive* element is the 12-card grid.

5-second read: "a menu of body parts." Nothing says this is a searchable catalogue of 225 exercises (the twelve counts sum to 225). Wayfinding fails at the level it matters: search is the only tool that scales to 225 items, and it is the least visible thing on the screen and is **not focused on arrival** (`document.activeElement` = `BODY`).

Blurred detail sheet: the dominant object is a 351x351 **void**, then the orange button. A person squinting cannot tell the sheet is about an exercise.

## 2. Numbered callouts

Keyed to `exercise-library-annotated.png`. 1 search field, invisible boundary, unfocused. 2 title wins the squint. 3 "SELECT MUSCLE GROUP" 11px/700, smaller than the cards it labels. 4 twelve identical 172.5x119.1 cards, name 16px/800 in eleven hues, same dumbbell glyph in all twelve — the icon carries no information; 8 visible in the 852-tall capture, 4 below the fold. 5 Shoulders and Triceps are painted `#FB923C`, the app's action accent, so accent stops meaning "action". 6 Create Custom Exercise 353x42. 7 Back 22x27; the page replaces the Train hub, so the My Splits / History / Library strip is gone (`trainSegmentedPresent:false`) — the global tab bar survives, but the sibling views do not, and Back is a 22x27 target. 8 empty demonstration box 351x351 (`img naturalWidth 1`, `complete true`, no alt shown, no placeholder, no retry) = 53% of viewport height and **81% of the 432px visible sheet body**. 9 sheet holds 830px of content in a 432px scroller, so Muscle Group / Muscle Part / Equipment sit below an empty box. 10 ADD TO WORKOUT / BACK, 16px/800 all-caps, 170.5 vs 172.5 wide, orange gradient plus `rgba(249,115,22,.25)` glow. 11 third dismissal (grabber + x + BACK). 12 result row 353x63.2 carries name + equipment only — no muscle, no last load, no PR, no "already in your split". 13 Clear 31.1x15.

## 3. Measurements

Contrast (my scan, all styles; baseline: 28 checked, 0 fail, 1 unknown):

| Style | Ratio |
|---|---|
| 32/800 `#F5F5F7` on `#0D0D0F` | 17.8 |
| 16/800 category names, 11 hues | 4.51 (Hamstrings) to 7.92 (Quads) |
| 11/400 "30 exercises" | 6.64 |
| 11/700 section label | 8.19 |
| 14/600 Create Custom | 9.28 |
| 16/400 placeholder `#8E8E93` | 6.00 |
| Sheet 20/800, 13/700, 12/400, 16/800 | 17.8, 15.6, 6.64, 19.4 |
| FAB emoji over gradient | unknown, not passing |

Targets, all four views, page-owned controls: 24 of 28 pass 44x44 = **85.7%**. Failures: Back 22x27, Create Custom 353x42, Clear 31.1x15, "All Muscles" 91.8x18. Baseline root-only figure: 2 of 21 under 44.

Spacing, non-zero longhands, nav and FAB excluded: root 87/104 on grid = 83.7% (off-grid 2px x12, 20px x4, 58px x1); sheet 52/64 = 81.3% (10px x3, 20px x7, 177.5px x2). Combined **139/168 = 82.7%**, no break documented.

Type: 9 distinct sizes across populated root + open sheet — 10, 11, 12, 13, 14, 16, 20, 24, 32. Weights 400/600/700/800. Line-height set on 3 of 5 root pairs (32/36.8, 11/15.95, 16/23.2); 14px and 20px are `normal`. Radii on one page: 2, 9, 10, 11, 12, 14, 16, 24 = 8 distinct.

## 4. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 1 | `-populated.png` squint: 12 cards share 172.5x119.1, r16, 16px/800; zero primary-styled controls; search invisible |
| Typography | 2 | 9 sizes root+sheet; 2 of 5 line-heights unset; no 700+ on running text under 15px |
| Spacing | 3 | 82.7% on grid (139/168), undocumented breaks at 2, 10, 20, 58, 177.5px |
| Contrast | 5 | 0 failures over 28 checked (`scans/exercise-library.json`) plus 16 styles measured here; sole unknown is the shell FAB over a gradient |
| Component consistency | 2 | one row type with local overrides (63.2 vs 75.1 high) but four dismiss/back variants (22x27 arrow, 91.8x18 link, 44x44 x, 172.5x60 BACK) and 8 radii; `-populated-subgroup.png`, `-detail-modal.png` |
| Targets | 2 | 24/28 = 85.7%; Back 22x27, Clear 31.1x15, All Muscles 91.8x18, Create Custom 42 high |
| Motion and feedback | 5 | real `mouse.down`, 100ms read: card, Create Custom, Back, search, row, ADD all change (scale 0.97 / bg .8→.89); sheet `slideUp` 500ms + `overlayIn`, no decorative row |
| HIG fit | 1 | 3 sections: Layout (4 sub-44 targets), Color (11 category hues, accent used for 2 categories), Buttons (no primary on the browse screen, all-caps pair, triple dismissal) |
| AI-look penalty | 2 | 3 tells in `-populated.png` / `-detail-modal.png`: gradient+glow primary button, 8 mixed radii, 12 stacked equal-weight rainbow cards |
| Accessibility | 3 | axe: 1 critical `meta-viewport` (shell, capped at 3); controls labelled; search unfocused on arrival; 120% text untested |

**Design mean 2.6.**

## 5. Detail checklist — 3/11

| # | Verdict | Measurement |
|---|---|---|
| 1 | fail | zero accent-filled buttons in `-populated.png`; 5-second test names no action |
| 2 | fail | 9 sizes; 14px and 20px line-height `normal` |
| 3 | fail | 82.7% on grid, breaks undocumented |
| 4 | **pass** | 5/5 controls change at 100ms under real press; `button:disabled` rule present |
| 5 | **pass** | inventory: `slideUp` 500ms (sheet), `overlayIn` 300ms (scrim), `pillIn` 350ms (add toast) — all caused, none decorative; list cannot grow |
| 6 | fail | empty = "No results", 2 words, no instruction, zero action controls (`-empty.png`); error omits the 351px box with no message, "No form video found" also shows when populated (`-error.png` vs `-detail-modal.png`) |
| 7 | fail | `font-variant-numeric: tabular-nums` on 0 nodes; "30 exercises" and "10 ex" both used for one quantity |
| 8 | fail | one set, one stroke-width 1.8, but 4 optical sizes (15, 16, 17, 22) |
| 9 | fail | `scrollWidth 393 = clientWidth`, no h-overflow; 4 targets under 44 |
| 10 | fail | L* rises 0 → 13 → 28 → 44 correctly, but ADD TO WORKOUT carries `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px` — accent glow |
| 11 | **pass** | every label under 4 words; 0 exclamation marks; no filler |

## 6. Consistency deltas vs `design-system-current.md`

- **Radii:** 8 values on one page (2, 9, 10, 11, 12, 14, 16, 24) against a 4-value target; the search `input` is radius 0 inside an 11px wrapper.
- **Accent:** the system defines one accent (`--color-accent #F97316`); this page paints 11 category hues and spends `--color-accent-text #FB923C` on Shoulders and Triceps, colliding with the button accent.
- **Tab pattern:** this is the only Train view that *replaces* its host's segmented strip instead of rendering inside it, and `lk_ui_trainView` persists, so a relaunch lands in the Library with no sibling views on screen.
- **Card style:** the 12 cards use the app's `0 1px 2px + 0 6px 20px` shadow; the sheet's primary button uses the accent-glow shadow — two of the app's 11 shadows on one page.
- **Icons:** one set at stroke 1.8, but four optical sizes, and the same glyph does duty for all 12 categories.

## 7. Keep, fix, cut

- **Keep:** the search-results row — 353x63.2, one implementation, 100ms press, and the fastest path to any of 225 items (`-populated-search.png`).
- **Fix:** put search first, focused, and visible (it is 1.07:1 at its border and lost at 8px blur), and keep it present at group level, where it currently disappears (`-populated-group.png`).
- **Fix:** the 351x351 demonstration box must show something — frame, name, muscle, or the missing-media message — instead of 81% of the sheet body reading as a void (`-detail-modal.png`, `-loading.png`, `-error.png` are indistinguishable there).
- **Cut:** eleven category hues, the repeated dumbbell glyph, and two of the three dismiss controls; one accent, typographic category names, and a single x.
