# Design Audit: Cycle Tracker (`cycle`)

Evidence: `screenshots/current/cycle-*.png` (26), `tests/baseline/scans/cycle.json` and own Playwright style, target and press measurements (iPhone 15 Pro, dark). Scored before the function audit.

## 1. Squint test and 5-second test

8px blur on `cycle-populated-full.png`: **the ring wins** — largest shape, only saturated one, only element surviving the blur intact. Second, the prediction strip, a red/teal/violet band. Third, an undifferentiated stack of four grey cards. Nothing else resolves.

5-second read: "a period calendar with a dial." A tester names the ring and cannot name an action. There are **zero accent-filled buttons** — the only orange is the shell FAB and Home tab. The winner is a *display*; the daily job sits in one of four identical grey chips.

Across 26 captures this is not one screen. Ring, calendar, log sheet, settings sheet, education panel and five onboarding steps each carry their own title casing, card shape and control vocabulary — `Cycle` 32px/800 against `SEPTEMBER 2026` 18px/800 tracked 0.72px against `CYCLE TRACKING` against `When did your last period start?`. One visual system does not hold it.

## 2. Numbered callouts

Ten callouts on `cycle-annotated.png`; legend under the image.

## 3. Measurements

**Contrast** (baseline scan, 37 nodes: 36 pass, 1 fail, 3 unknown; plus own dump, 31 distinct styles):

| Style | On | Ratio | Req | Verdict |
|---|---|---|---|---|
| 11px/800 `#7C5CE8` "PMS WINDOW" | `#09060F` | 4.36 | 4.5 | **fail** |
| 11px/800 `#E5484D` "MENSTRUAL · TODAY" | `#1C1C1E` | 4.35 | 4.5 | **fail** |
| 11px/800 `#14B8A6` "FERTILE WINDOW" | `#000` | 5.61 | 4.5 | pass |
| `Cycle` h1, `Private — …` | gradient | — | — | **unknown** |

Every marginal or failing style is a phase colour: the phase language *is* the contrast problem.

**Targets** (44×44, nav and FAB excluded): base 7/8 — `THE SCIENCE` is 319×**15.9**. Calendar 3/35 — day cells **43×43**, month chevrons 44×**32**. Log sheet 6/41 — 12 symptom chips 113×**32**, 8 mood chips **32** tall, 10 energy/sleep digits **30×34**, `Done` 63×**29**. Page total **16/84 = 19%**.

**Spacing** (non-zero padding/gap/margin longhands, shell excluded): base 47/108, calendar 17/101, log sheet 68/179 → **132/388 = 34.0% on grid**. Off-grid, by frequency: 1px (×60, calendar cells), 9, 13, 10, 2, 6, 5, 7, 20, 14, 3, 18, 40.5, 58, 110.

**Type**: 12 distinct computed sizes — 11, 11.5008, 12, 12.4992, 13, 13.5008, 14, 18, 20, 22, 32, 64. Six weights, 400–900: 800 sits on 16 nodes of 11px running label text, 900 on the day number. `line-height: normal` on the 11.5008, 14 and 12px nodes. Zero nodes carry `tabular-nums`, the 64px day number included.

**Icons**: 13 SVGs, one stroke weight (1.8), zero page emoji — but four optical sizes (11/14/17/18px) in six colours.

**Pressed** (real `mouse.down`, read at 100ms): Log Period, Symptoms, More, Energy, THE SCIENCE, header calendar, header settings — **7/7 change** to `matrix(0.97,…)`. `button:disabled{opacity:.4;…}` applies.

## 4. Rubric scores (Design)

| Criterion | Score | Evidence |
|---|---|---|
| Hierarchy | 2 | 8px-blur `cycle-populated-full.png`: ring dominates but is a display; 0 accent-filled controls; 4 quick actions and 4 cards each internally identical |
| Typography | 1 | 12 distinct sizes, 6 weights, 800 on 11px running labels, `line-height: normal` on three sizes (computed dump) |
| Spacing | 1 | 132/388 = 34.0% on grid, under the 60% floor; 60 × 1px in the calendar |
| Contrast | 3 | baseline scan 36/37 = 97.3% pass; PMS label 4.36:1; 3 gradient nodes unknown |
| Component consistency | 1 | 10 radii (2/4/8/10/12/14/16/24/50%/99px); five chip variants; two calendars (§6) |
| Targets | 1 | 16/84 = 19% meet 44×44; `cycle-populated-calendar.png` 43×43 cells, `-log-sheet.png` 32px chips |
| Motion and feedback | 4 | 7/7 pressed at 100ms (base 5); −1 for the decorative `pillIn 0.35s` entrance on the static phase pill |
| HIG fit | 1 | 4 sections violated: Buttons (no primary; 15.9px text button), Layout (68 sub-44 targets), Typography (12 sizes), Color (4 non-token hues) |
| AI-look penalty | 2 | 3 tells: stacked equal-weight cards, mixed radii, tinted gradient tiles (`linear-gradient(rgba(239,68,68,.08)…)`); copy and emoji clean |
| Accessibility | 2 | Ring is `svg role="presentation"`, no tabindex, no label: the dominant control is invisible to AT and keyboard; axe 2 (`meta-viewport` critical, `scrollable-region-focusable`) |

**Design mean 1.8.**

## 5. Detail checklist

| # | Item | Verdict | Measurement |
|---|---|---|---|
| 1 | Primary action obvious | **fail** | 0 accent-filled controls, 5s test names the ring |
| 2 | Type scale | **fail** | 12 sizes, 6 weights, 800 at 11px |
| 3 | 8px grid | **fail** | 34.0%, 132/388 |
| 4 | Control states | **pass** | 7/7 change at 100ms; `button:disabled` rule present |
| 5 | Meaningful motion | **fail** | `pillIn 0.35s` entrance on a static label: decorative |
| 6 | Empty/error copy | **fail** | `cycle-empty.png` md5 `a2ad5bb0…` = `cycle-populated.png`: no empty state (error N/A) |
| 7 | Numbers | **fail** | 0 nodes with `tabular-nums`, 64px day number included |
| 8 | One icon set | **fail** | one stroke weight, 0 emoji, 4 optical sizes (11/14/17/18) |
| 9 | Scroll and targets | **fail** | unlabeled scroller, `scrollWidth` 555 in 393; 68 targets under 44 |
| 10 | Native dark | **fail** | log-sheet surface `#0D0D0F` sits above, and darker than, the `#1C1C1E` cards it covers; accent-glow shadow `rgba(249,115,22,.25)` present |
| 11 | Copy | **pass** | 0 exclamation marks; labels ≤2 words; body copy specific, non-cheerful |

**2/11.**

## 6. Consistency deltas vs `design-system-current.md`

- **Two month grids, two models.** Cycle cell: `BUTTON`, 43×43, radius 12px, transparent, 1px coloured/dashed border, tappable, aria-labelled; header `SEPTEMBER 2026` tracking 0.72px; nav 44×32 filled chevron pills, radius 8px. Progress cell: `DIV`, 44×44, radius **6px**, filled `rgb(44,44,46)`, `cursor:auto`, no role; header `Sep 2026` tracking normal; nav 34×39 bare arrows, radius 0. Different element, size, radius, fill model, casing and affordance — same object, three taps apart.
- **Colour.** Four phase hues are raw hex outside the tokens: `#E5484D`, `#14B8A6`, `#7C5CE8`, `#EF4444` — and `--color-error` is `#F05151`, so the page ships two extra reds beside it. `--color-info #4186F6` is borrowed for an education link, and `--color-accent #F97316`, the app's action colour everywhere else, labels a passive "YOUR PATTERNS" heading on a page with no accent-filled action.
- **Radii.** 10 distinct on one page against 24 app-wide; the log sheet uses six.
- **Tab pattern.** Progress switches views with a pill segmented control; Cycle uses two unlabelled header circles, one mutating to a clock — a fourth pattern beside the directive's three.
- **Card style.** Five treatments: plain `#1C1C1E`/16px, tinted gradient tile, teal-rail card, outlined prediction tile, sheet row.

## 7. Keep, fix, cut

- **Keep**: the copy and privacy posture — 0 exclamations, honest hedging ("±1d · not contraception", "not medical advice"); the only page whose body text reads written, not generated
- **Fix**: one primary action ("Log today") in accent, and one calendar shared with Progress — 43×43 cells and 32px chips must reach 44 first.
- **Cut**: the ring's drag interaction (`role="presentation"`, keyboard-unreachable, needing a caption to be discoverable), the duplicate Symptoms/More entries into one sheet, and the nine-section education panel, which belongs behind Settings, not on the daily surface.

## 8. After reading the function audit

No score changes. It corroborates the missing empty state (same md5), the Symptoms/More duplicate, the PMS contrast fail and the unfocusable strip. Two facts I had not measured: the Home entry point's **LOG** button is covered by the voice FAB and untappable; and the calendar paints `flow≥1` as Period while the engine counts one at `flow≥2` — one phase-colour language meaning two things in two views, which strengthens §6.