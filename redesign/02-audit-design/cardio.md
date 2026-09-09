# Design Audit: Cardio

Evidence: the `cardio-*` captures in `00-inventory/screenshots/current/`, `train-hub-populated-history.png`, my Playwright runs at 393x852 dark (nav and mic FAB excluded), and `tests/baseline/scans/cardio.json`.

## 1. Squint (8px blur) and 5-second test

Blurred `cardio-populated-log.png`: **the CARDIO wordmark wins** — a 32px/800 label, not an action. Second the orange mic FAB (shell). Third a field of ten identical tiles, each with an equal orange icon chip and glow, reading as one texture with no entry point. Nothing in the content area outranks anything else. Blurred `cardio-populated.png` (Favorites, the landing tab when a favourite exists) does find one bright card: the page has one screen with hierarchy and one without.

5-second read: "a catalogue of cardio machines." The job — log a session — comes only from the 18px "What did you do?". A person names browsing, not logging.

## 2. Callouts

Nine numbered markers with legend printed on `cardio-annotated.png`.

## 3. Measurements

Contrast, 21 distinct styles (size+weight+colour) across the three tabs: 20 pass at >=4.5. CARDIO 32/800 #F5F5F7 on #0D0D0F = 17.83; tile label 14/700 over the tile gradient = 15.63–18.19 at both endpoints, so measured, not unknown; chart labels 11/700 #A1A1AA on #1C1C1E = 6.64, the worst. The 21st is the "0" over the empty week bar, painted `rgba(0,0,0,0)` — invisible. Baseline scan agrees on the base tab: 16 checked, 16 passed, 1 unknown (FAB emoji, shell).

Targets: Log 87 controls, **45 under 44** (52% meet) — 41 stars 28x28, Back 36x36, 3 tabs 117.7x42. History 7/11 under (adds 3 filter chips h32). Favorites 8/9 under (Edit 28.6x23, chip h35, star 30x30).

Spacing, non-zero padding/gap/margin longhands on {4,8,12,16,24,32}: Log 77/326 = **23.6%**; History 48.0%; Favorites 51.8%; union 34.2%. Offenders: 14px (100), 9px (82), 20px (48), 38px (42).

Typography: **9** distinct sizes — 11, 12, 13, 14, 16, 16.8, 17, 18, 32. Weights 400/600/700/800. `line-height:normal` on every 12px and 14px node. No 700+ on running text <=15px.

Pressed, real `mouse.down()` at 100ms: tile, tab and Back all `scale(.97)`; star gains a shadow; search bg `rgba(24,24,27,.8)`→`.89`. **5/5**. `button:disabled{opacity:.4}` exists. Zero `animation-name`; transitions are 0.24s background/shadow (x136) and 0.3s theme. No sheet here.

## 4. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 2 | Squint of `-log.png`: winner is the CARDIO label; 41 tiles one style, one glow, zero accent-filled buttons. `cardio-populated.png` does show one dominant card (a 3-condition). |
| Typography | 2 | 9 sizes incl. 16.8px; `line-height:normal` on 12/14px; no 700+ on running text <=15px, so 2 not 1. |
| Spacing | 1 | 23.6% on grid (Log), 34.2% union — under 60%. |
| Contrast | 4 | 20/21 styles pass, worst 6.64; one cited failure, the zero-alpha chart numeral in `-history.png`. |
| Component consistency | 1 | 11 radii on one page (3–16 plus 999); four card treatments; session rows at r13 (History) and r16 (Favorites) for the same content; two selector patterns 60px apart in `-history.png`. |
| Targets | 1 | 52% meet on Log (45/87 fail); 8/9 fail on Favorites. |
| Motion and feedback | 5 | 5/5 pressed at 100ms; zero decorative rows (no `animation-name`, no sheet fade). |
| HIG fit | 1 | Three sections: Layout (45 sub-44 targets), Typography (9 sizes, 11px body, `user-scalable=no`), Tab bars/Segmented controls (underline strip plus pill filters on one screen). |
| AI-look penalty | 1 | Four tells: gradient cards x41 with accent glow; Unicode ☆/★ as controls; 11 radii; 41 equal-weight stacked tiles. |
| Accessibility | 3 | axe 1 critical (`meta-viewport`, shell); stars labelled; tab strip has no `role="tab"`/`aria-selected`, state by colour only; at 120% text no horizontal overflow, 1 clipped node. |

**Design mean 2.1.**

## 5. Detail checklist

| # | Item | Result | Measurement |
|---|---|---|---|
| 1 | Primary action | fail | 0 accent-filled buttons on Log; 41 equal tiles; squint winner is a label. |
| 2 | Type scale | fail | 9 sizes; `line-height:normal` at 12 and 14px. |
| 3 | 8px grid | fail | 34.2% on grid, no documented breaks. |
| 4 | Control states | pass | 5/5 changed at 100ms; `button:disabled{opacity:.4}` present. |
| 5 | Meaningful motion | fail | Zero decorative rows, but Favorites grows on star and no insertion animates (no `animation-name` anywhere). |
| 6 | Empty and error copy | fail | `-empty-favorites.png` passes (17 words, 2 lines, one action); `-empty-history.png` has zero action controls and describes rather than instructs. Error N/A (page-map 2.12). |
| 7 | Numbers | fail | Stats/PB/chart are `tabular-nums`; history row metrics and dates are not, and "Sep 7" shows absolute at 2 days old. |
| 8 | One icon set | fail | 43 SVGs, stroke 1.8, but three optical sizes (15/16/18) plus 41 ☆ and one ★ as controls. |
| 9 | Scroll and targets | fail | 45 targets under 44; PB rail scrollWidth 871 vs 393, no role, aria-label or scroll-snap. |
| 10 | Native dark | fail | L* rises 0.0 → 10.3 → 16.6 (bg, tile, chip), but 41 tiles carry `rgba(249,115,22,.25) 0 2px 6px, rgba(249,115,22,.22) 0 8px 22px`. |
| 11 | Copy | pass | Zero exclamation marks; labels 1–3 words; the one sentence earns its length. |

**2/11.**

## 6. Consistency deltas

11 of the app's 24 radii land on this page; the tile alone uses 14/11/8. Its `linear-gradient(158deg, rgba(249,115,22,.07), #1C1C1E 62%)` plus coloured shadow is unique to Cardio — nothing else in the app glows. The page invents per-category orange/green/blue dots against the single-accent token set. Its underline tab strip matches Train Hub, then adds a third pattern (pill filters, r999, h32). Icons at 15/16/18; 16.8px and 13px sit outside the five sizes covering 88% of the app.

## 7. Page-specific

**Selection.** 41 tiles and 41 stars, 2 columns x 21 rows, ~2,700px tall (`-log-full`). Not scannable: tiles are ordered by category, not likelihood, and all carry identical weight, so reaching "Rowing erg" means reading ~30 labels or typing. Search is the only real reducer and is styled quieter than what it filters. Favourites *does* reduce it — a star puts the activity on the landing tab as a one-tap chip — but it is taught only in `-empty-favorites.png`, and its control is the 28x28 star, the smallest target here. Second visit with one favourite: the page opens on Favorites, one tap, right answer. With none: the same wall, no recents. The fix is ranking, not a bigger grid.

**Week chart and personal bests.** Both good, neither has a Train Hub equivalent. MINUTES PER WEEK: 8 bars, tabular labels, dated axis, one accent — legible blurred. PERSONAL BESTS is weaker: three cards on an unlabeled 871px rail in a 393px viewport, the third clipped mid-word, so a card can be missed. Keep the chart as built; keep PB, drop the rail.

**History rows, Cardio vs Train Hub, same records.** Cardio wins. Its row (`-history-scrolled-2.png`) is icon + title + muted "30 min · 5.2 km · 340 cal" + right-aligned date, r13, accent-free, expanding in place (`aria-expanded`). Train Hub's (`train-hub-populated-history.png`) prints the duration twice ("Sep 6 - 30 min", then again in the pill), wraps the metrics in an accent-outlined pill that competes with the lifting rows' orange volume figure, and adds a chevron. Carry Cardio's row into a merge; it needs Train Hub's chevron-to-detail, and Train Hub needs Cardio's date alignment and pill-free metrics.

## 8. Keep, fix, cut

- Keep: Favorites-first landing and the one-tap chip — the only screen where a squint finds a primary (`cardio-populated.png`).
- Keep: MINUTES PER WEEK — 8 bars, tabular labels, one accent, readable blurred.
- Keep: the history row layout — beats Train Hub's on identical records.
- Fix: rank the 41 (recents and favourites first, categories collapsed); star to 44x44.
- Fix: drop the glow and gradient on all 41 tiles; flat r12, elevation by tone.
- Fix: one selector pattern — fold the pill filters into the tab strip.
- Fix: PB rail to a wrapped grid; no unlabeled horizontal scroll.
- Fix: relative dates under 7 days, `tabular-nums` on history metrics.
- Cut: the "Which treadmill?" brand list (`-log-step2.png`) — 9+ rows whose own copy says it "never changes the estimate".
- Cut: the ☆/★ glyphs; use the SVG set at one optical size.

## After reading the function audit

Written after the scores above, per the brief. No score changed on re-read.
