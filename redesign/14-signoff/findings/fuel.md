# Fuel — sign-off findings to fix (73 features: 8 present, 27 partial, 33 missing, 3 cut, 2 n/a)

## Class 1 — the screen says something untrue

- **Search-logged foods claim a barcode.** `searchable()` stamps every
  food-table row `src: 'verified'` (fuel.html ~:432), so logging "Chilli" from
  the search sheet earns a VERIFIED badge and the meal sheet reads "A barcode
  matched a database row". No barcode was involved. Food-table rows are not
  barcode evidence; give them their own provenance.
- **The water sheet says the goal moves.** Copy: "The target moves with your
  weight and the weather, not with a round number somebody picked." The goal
  is a flat fixture 3,000 ml — exactly a round number somebody picked. Either
  compute it (35 ml/kg of body weight, rounded to the nearest 50) or change
  the sentence. Computing it is better: the body weight is in the store.
- **The plan sheet describes a swap control it does not have.** "A meal you
  swap is replaced from your own recipes and the things you log often"
  (~:930). The swap-by-AI path is deliberately not built (:259-263) — so
  either build the local swap from recipes and the often-list, or drop the
  sentence. Building it is better; it needs no server.
- **`weekPct: 0.34` is a literal** rendered as "+0.34% / wk, on target"
  (fuel.html:181, :394). The seed's weight log runs 64.5 → 64.2 kg over the
  last week, i.e. **−0.47%/wk**. The screen states a gain where the data holds
  a loss. Compute it from `lk_weightLog`.
- **The first-weeks state** calls the target "a starting formula, not your
  trend yet" (:378) when nothing computes a formula. Either compute the TDEE
  (see below) or say what it actually is.

## Class 2 — figures that do not reproduce from the seed

- **`goal: 'lean bulk'` is hardcoded** (:180). `lk_profile.goal` is `"build"`.
  Read it.
- **The `OFTEN` counts are literals** (63/41/28/19, ~:215). Derive them from
  what has actually been logged, or drop the count.
- **Trends ignores today.** The 14-day series is the fixture array, so logging
  890 kcal leaves the last point at 1,570 and the average at 2,702 under a
  heading that says "Last fourteen days". Today's point must be the day's real
  total.
- **Portion round-trips are not reciprocal.** "A fifth less" then "a quarter
  more" is claimed to return a meal to where it started (:670-673). It does
  for 38 g protein (38→30→38) but not for 52 (52→42→53). Store the original
  portion and scale from it rather than compounding.

## Class 3 — controls that do nothing

- **"Build a recipe"** toasts "not in this build yet" (:1207). Build it: name,
  ingredients (from the food table plus free text), servings, save to
  `lk_recipes`. No server needed.
- **No meal-slot concept anywhere.** Every path calls `addMeal`, which stamps
  a clock time and appends to one flat list. F-FUEL-400/403 want Breakfast /
  Lunch / Dinner / Snack, chosen at log time, with the diary grouped by slot
  and a per-slot kcal and P/C/F footer.

## Persistence (the whole area)

`DAY` is rebuilt from the fixture on every load, so **every** log, target
edit, water change and supplement tick is gone on reload. Route all of it
through `LKStore` under `lk_fuelLog` (per-date), `lk_fuelTargets`,
`lk_supplements`, `lk_suppLog`, `lk_recipes`, `lk_myGroceries`.

## Missing features to build (all local, no server)

| ID | What |
|---|---|
| F-FUEL-001 | Micronutrient panel: fibre, sugar, sat fat, sodium on each food, expandable on the day. Add the fields to the fixture food table. |
| F-FUEL-002 | Trends: 7/30 range toggle, a target line on the chart, an averages grid, a weight-trend line |
| F-FUEL-003 | Recipe log sheet: meal slot + 0.5–12 servings stepper + live macro preview |
| F-FUEL-004 | Recipe builder (see above) |
| F-FUEL-005 | Long-press a frequent meal to favourite it, ★ on the row |
| F-FUEL-006/009/010/011 | Scan: an idle card with a manual barcode field, a not-found manual-label branch, a logged confirmation with "Scan another", a looking-up state |
| F-FUEL-014/216 | Adaptive TDEE: compute from the weight trend against intake, blended 70/30, clamped ±150 kcal, with a weekly card and a "?" explainer |
| F-FUEL-016/401 | Free-text meal entry: parse "2 eggs and toast with butter" into quantity/unit/food, match against the food table, with a unit→gram table |
| F-FUEL-018 | Logging a food depletes the matching pantry item; at zero it joins the shopping list |
| F-FUEL-019 | Weight-trend EMA and a per-week rate from it |
| F-FUEL-020 | slotForNow, nextSlot, waterGoal (35 ml/kg rounded to 50), favourites, recent/frequent derived from the log |
| F-FUEL-200 | Header buttons: Shop, and My Profile |
| F-FUEL-203 | The macro ring (an SVG progress ring, 90px, stroke 9) — or a design note saying why bars replaced it |
| F-FUEL-204-212 | A Fuel Profile screen: weight, height (ft+in or cm), age, sex, activity level, goal, Auto/Custom macros, dietary preferences, allergies — feeding calcTDEE and calcMacros |
| F-FUEL-213 | Water: a main-view card with a ml/fl-oz toggle and +250/+500 |
| F-FUEL-214 | A suggestion card: calories remaining → a meal from the table that fits, with its reason and "Add to today's log" |
| F-FUEL-217 | Refeed prompt: three consecutive new lows while cutting → a card with boosted carbs, Accept/Dismiss, and an active banner |
| F-FUEL-218 | A weight-log card on Fuel |
| F-FUEL-221/223 | Plan: an accordion with per-day totals, today highlighted, and "+ Shopping list (N)" that dedupes against the current list |
| F-FUEL-224/226 | A plan generator form (days, meals/day, diet) building from the food table, and a saved-plans list with activate/star/delete |
| F-FUEL-402 | An itemised preview before a photo or voice log commits, with per-item remove |
| F-FUEL-405/406 | Manual macro entry: name + kcal/P/C/F, Add disabled until name and calories are set |
| F-FUEL-408 | Search ranking: specific-over-generic scoring, a saved-food boost, a ★ BEST pill |
| F-FUEL-409 | A food detail card: grams field, seven serving-size chips, live per-100 g scaling, then "Log to <slot>" |
| F-FUEL-410 | My Store: save a scaled food, browse, log and delete; up to six as quick chips |
| F-FUEL-412 | A bare 8–14 digit search query hands off to the scan sheet |
| F-FUEL-413/415 | Photo: a file input (`capture="environment"` and a library one), a preview, a discard, and a Re-estimate |
| F-FUEL-416/417 | Recipes: a For You / From Pantry switch; more recipes with tags, times and steps; dietary filtering |
| F-FUEL-419 | "Add to shop" on a recipe: parse each ingredient, merge quantities into a matching list row |
| F-FUEL-422 | "Log full day" from the plan |
| F-FUEL-423 | Generate recipes from what is in the pantry |

## Needs a server — build the local half, say so on screen

F-FUEL-407 (multi-source food search: USDA, FatSecret, Open Food Facts),
F-FUEL-411 (a USDA key screen), F-FUEL-414 (real photo analysis),
F-FUEL-420/421 (AI meal ideas and plan-my-day), F-FUEL-424 (coach recipes),
F-FUEL-007 (live camera barcode decoding — already cut with a note, keep it).

For each: build the form and the local fallback, and have the screen say what
the remaining half needs. The search sheet's existing line is the model —
"A real search reaches a food database; this one does not pretend to."
