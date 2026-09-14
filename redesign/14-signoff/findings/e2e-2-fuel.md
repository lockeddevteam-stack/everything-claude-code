# E2E 2 — Fuel, a week of food tracking

Driven through `10-final/locked-demo.html` (`#/fuel`) with Playwright, seeded from
`tests/fixtures/seed-data.json`, TODAY = 2026-09-09. Every log path was exercised
(search, food detail with grams, often list, recipe, barcode, photo, free text,
manual), totals re-added by hand after each, portions rescaled, a meal deleted,
targets and Fuel Profile changed, reloaded after every step, Trends read at 7 /
14 / 30, and the micro panel, water card, supplements, plan and pantry checked.
`pageerror` and console errors were listened for throughout; a 52-control click
sweep of the Fuel screen produced **zero** errors.

## Defects

### 1. The Shop / Pantry screen ignores stored data, so the pantry loop the Fuel screen announces never lands
Pressed **Meals → Eggs, toast, butter** (`often-0`). Fuel toasted
*"Eggs, toast, butter logged again. Last of the peanut butter, so it is on the
list."* and wrote it: `lk_pantryItems` Peanut butter → `quantity:0, empty:true`,
`lk_shoppingList` grew from 10 rows to 11 with `Peanut butter`.
Then pressed **More** (`chip-more`), which is the Fuel screen's own link to that
list. The Shop screen showed **"8 of 10"** and the original ten rows, no Peanut
butter; its Pantry tab showed **"Peanut butter — 1 left"** and **"1 out of stock"**.
Expected 9 of 11 and Peanut butter out of stock.

It is not a stale-render problem — a fresh load straight at
`#/fuel/shopping` shows the same thing. Minimal repro: set
`lk_shoppingList` to a single item `ZZZ`, then

| loaded at | then | `left-count` reads |
|---|---|---|
| `#/fuel` (or `#/home`, `#/train`, `#/coach`, `#/profile`, `#/fuel/shopping`) | go to Shop | `8 of 10` — the fixture |
| no hash at all | go to Shop | `1 of 1` — the stored list |

So whenever the demo is opened at a route — which is how Fuel is reached — the
Shop screen never reads `lk_shoppingList` / `lk_pantryItems` at all
(`08-build/shopping.html:391-396`, bundled unchanged at
`10-final/locked-demo.html:33318-33326`; `LKStore.get('lk_shoppingList')`
returns the stored list at that moment, the screen just never asks).
Home *does* read it in the same session ("Peanut butter — marked empty · on your
list"), so Home and Shop disagree about the same cupboard.

### 2. Free text: "2 eggs" is logged as 1,080 kcal and 76 g of protein
`Say it → "2 eggs and toast with a whey shake"` (the journey's sentence, and the
sheet's own example chip is *"2 eggs and toast"*). It reads as:

- 🍳 Eggs, toast, butter — **520 g · 76 P · 92 C · 48 F · 1,080 kcal**
- 🥤 Whey shake, banana — 400 g · 31 P · 38 C · 4 F · 310 kcal
- "Log 2 items, 1,390 kcal"

The leading `2` is applied to the whole composite 260 g "Eggs, toast, butter"
row, so two eggs become two full cooked breakfasts — and butter nobody mentioned.
Typing just `2 eggs` alone gives the same 1,080 kcal / 76 g protein. Two eggs are
about 140 kcal and 12 g of protein; the figure is an order of magnitude out and
cannot be reproduced from anything on the list. The sheet's copy says it reads
"quantities, units and foods, matched against the table" — a bare count of a
countable food is being read as a count of servings of a dish.

### 3. Deleting a meal does not put back what it took out of the cupboard
Logged **Whey shake, banana** from the often list (pantry: Whey protein 1 → 0,
`empty:true`, "Whey protein" pushed onto the shopping list), then opened the meal
and pressed **Remove this entry**. Calories and all four macros came back out
exactly (verified to the gram, see Worked), but the pantry row stays
`quantity:0 / empty:true` and "Whey protein" stays on the shopping list. Undoing a
log leaves two other screens permanently wrong. `addMeal` calls
`depletePantry` (`08-build/fuel.html:4185`); the delete path has no inverse.
Rescaling a meal to a fifth of its size does not touch the pantry either.

### 4. Eating toast and butter empties the peanut butter
`pantryMatch` (`08-build/fuel.html:946-959`) matches on any shared word of four
letters or more, so the food-table row **"Eggs, toast, butter"** matches the
pantry row **"Peanut butter"** on `butter`. Logging breakfast marks the peanut
butter empty and adds it to the shopping list. Nothing the user did involved
peanut butter. (The intended match — "Protein pancakes" → "Whey protein" — works,
but by the same rule any food with "protein" in its name will empty it.)

### 5. The free-text parser double-reports and silently drops quantifiers
Same sheet, further inputs:
- `half a chilli` → logs **Chilli, 400 g, 530 kcal** (the "half" is ignored, a
  whole serving is logged) *and* lists a phantom item **"h lf"** under "nothing in
  the table matches this". The word "half" has had its "a" cut out of the middle.
- `3 whey shakes` → logs Whey shake ×3 (1,200 g, 930 kcal) **and** reports
  "shakes" as *"1 not recognised and not counted"*. The word was counted; the
  sheet says it was not.

### 6. "0 chilli" offers to log an entry worth nothing
`0 chilli` → "🍲 Chilli, 0 g · 0 P · 0 C · 0 F, 0 kcal" and an enabled button
**"Log 1 item, 0 kcal"**. The manual sheet on the same screen deliberately
disables Add without a calorie figure ("an entry with neither is a row in the
diary that means nothing"); this path has no such guard.

### 7. The water sheet ignores the unit you chose, and states a different goal
The water card's `fl oz` button works and survives reload: card reads
**"68 fl oz / 76 fl oz"**, buttons become "+ 8 fl oz". Open **Water** (`chip-water`)
from the same screen and the sheet still reads **"2.00 of 2.3 L"** with "− 250 ml
/ + 250 ml" buttons. Two views of one number, in two unit systems, one of which
the user explicitly turned off. Separately the goal is 2,250 ml on the card and
"2.3 L" in the sheet.

### 8. "71% confident" on the photo path is a literal
`Snap it` → "690 kcal, 56 g protein. **Estimated, 71% confident.**" Press
**A lot** of oil (total correctly moves to 850 kcal) and then delete an item
(correctly 520 kcal, 10 g protein) — the confidence stays 71% through both. A
figure that never moves is not a confidence.

### 9. `split-builder` throws on boot
Opening `locked-demo.html` with no hash (the plain file, as a person would):
`[demo] split-builder failed to boot TypeError: Cannot read properties of
undefined (reading 'map')` at `10-final/locked-demo.html:25313`. Outside Fuel,
but it is an uncaught throw on a normal open.

### 10. The suggestion card is written as dinner and logs to the clock
The closing card reads "Dinner · Usually 7:30 · 39 g of protein and 1,410 kcal
left", and directly under it "🍝 Beef mince and pasta … Add it to today".
Pressing it files the meal into whatever slot `slotForNow()`
(`08-build/fuel.html:462-468`) returns for the wall clock — Breakfast when the
run was at 03:xx. The one suggestion the screen frames as tonight's dinner should
land in dinner, or the card should not call it dinner.

## Worked

- Search → Skyr, plain: day went 1,570 → 1,666 kcal, hero 1,410 → 1,314 (2,980 − 1,666), P 121→138, C 168→174, F 44.3; hand-added meal list matches the stored totals to the gram on every one of the nine logs I made.
- Food detail with grams: Chilli at 250 g gives 331 kcal / 25.6 P / 23.8 C / 11.3 F, exactly 2.5 × the stated 132.5 kcal, 10.25 P, 9.5 C, 4.5 F per 100 g, and the "times 2.5" line updates with it.
- Often list, recipe (with a servings multiplier: 2 servings of Chilli = 1,060 kcal / 82 P), barcode (servings multiplier correct; unknown barcode gives an honest "Not found" with a way out), photo, and manual entry all log and all reconcile.
- Portion round trip is exact and reciprocal: 720 kcal / 52 P → "a fifth less" 576 / 41.6 (scale 0.8) → "a quarter more" back to 720 / 52 (scale 1). Twice down (scale 0.64, 461 kcal) and twice up returns to 720 exactly, and survives a reload — it scales from a stored base rather than compounding.
- Delete: removing the 720 kcal lunch took 720 / 52 / 84 / 16 back out precisely (1,666 → 946) and survived reload.
- Every log, portion change, deletion, slot move, target edit, water tick, unit toggle, weigh-in, supplement tick and favourite survived a reload, under `lk_fuelLog` / `lk_fuelTargets` / `lk_fuelProfile` / `lk_suppLog` / `lk_fuelFavourites`.
- Targets: typed 2,500/170/300/70 → hero and all three bars re-measure against them, stored in `lk_fuelTargets`, survive reload.
- Fuel Profile: weight 80 kg, activity Hard, goal Lose fat → 2,260 kcal / 160 P / 263 C / 63 F, which is Mifflin-St Jeor (1,544) × 1.725 − 400 rounded to 10, protein 2 g/kg, fat a quarter of calories, carbs the remainder — exactly what the sheet says it is. It writes back to `lk_profile`, records a weigh-in, and the water goal follows to 2,800 ml (80 × 35).
- Weigh-in 65.5 kg → "+1.21% / wk, faster than a build needs", which is (65.5−64.5)/64.5 × 7/9 from `lk_weightLog`; the baseline −0.47%/wk is likewise 64.5 → 64.2 over 7 days.
- The TDEE card's "2,980 now, 3,080 … +100 kcal" reproduces: 70% of the measured 3,119 (13-day average 2,788.5 plus 330 kcal/day of weight loss) blended with 30% of the 2,148 formula, +250 for building, rounded — and the 150 kcal clamp shows up correctly when the target is dropped to 2,500.
- Trends at 7 / 14 / 30 days: 2,482 / 2,702 / 2,805 kcal, gaps of −498 / −278 / −175, days over target 1 / 4 / 9, ranges 1,570–3,120 / 1,570–3,180 / 1,570–3,210 — all reproduced by hand from the seed series. Logging 1,000 kcal moved them to 2,625 / 2,773 / 2,838, i.e. exactly 1000/7, 1000/14, 1000/30, and the low moved off today. Today's point is the day I built.
- Micronutrients reconcile: fibre 13, sugar 37, saturated fat 14.5, sodium 1,910 from the three seeded meals; +Skyr moves them to 13 / 43 / 14.6 / 1,975 and survives reload.
- Water: 1,750 → 2,000 ml on "+ 250 ml", "One glass to go", goal 2,250 ml = 64.2 kg × 35 rounded to 50, exactly as the sheet's copy claims.
- Supplements: ticks write `lk_suppLog`, survive reload, and the streak/grid is counted from the ticks as the copy says.
- Plan: Wed "3 of 4 logged · 2,100 kcal planned" and "6,836 of 10,786 planned kcal logged this week" both add up from the listed meals; "Log the whole day" adds the missing Chilli and moves them to 4 of 4 and 7,366.
- "Build a recipe" is built (name, servings, food-table ingredients, free-text lines, running totals) — the earlier finding that it toasted "not in this build yet" is fixed.
- Provenance badges are honest now: search rows read TABLE, barcode reads VERIFIED, plan rows read PLANNED.
- Hero handles overshoot: at 3,270 eaten it reads "290 kcal over 2,980", not a bare negative.
