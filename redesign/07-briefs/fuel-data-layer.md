# LOCKED Fuel Data Layer

Supplied by Cesco, 2026-09-09. Fuel is ALREADY REDESIGNED on a separate track.
The redesign demo does not rebuild Fuel. It keeps the Fuel tab in the navigation
and designs around this spec so the rest of the app stays consistent with it.

Goal: the simplest stack that returns the most accurate macros for any input, and never shows the user a bad first result.

## 1. Stack

Three sources, one resolver, one curated table you own.

| Layer | Source | Role | Cost |
|---|---|---|---|
| Whole foods | USDA FoodData Central: Foundation and SR Legacy | Ground truth for eggs, rice, chicken, oils, produce. Lab-analyzed, full nutrient panels, household portions with gram weights | Free, 1,000 req/hr |
| Packaged, barcodes | Open Food Facts | 2.5M+ products, barcode-native, strong on UK and EU imports (matters in Cayman) | Free |
| US branded and restaurant | USDA Branded (GTIN) first, FatSecret Platform free tier for restaurant chains | Fill the gap OFF leaves on US chains and grocery brands | Free tier, upgrade only if usage forces it |
| Canonical table | Your own `foods_canonical` (start at ~1,500 rows) | The answer for 90% of logs. One clean row per common food with default portion, density, prep variants, and a verified nutrient panel | Your time |

Skip Nutritionix ($1,850/mo) and Edamam. The canonical table plus USDA covers what they sell.

Rule: external APIs are never called live at log time for common foods. The resolver hits the canonical table and cache first, external sources only on a miss. The Cloudflare Worker is the only thing that talks to external APIs.

## 2. One nutrient schema

Every source normalizes to this before ranking. Per 100 g, plus a list of portions.

```
food_id, name, brand, source (canonical | usda_foundation | usda_sr | usda_branded | off | fatsecret)
kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sat_fat_g, sodium_mg
portions: [{label: "1 cup, cooked", grams: 186}, {label: "1 large", grams: 50}]
density_g_per_ml (nullable), prep_state (raw | cooked | dry | as_sold)
completeness (0 to 1), verified (bool), popularity (log count)
```

Plausibility gate at ingest: kcal must sit within 12% of 4P + 4C + 9F, and P + C + F + fiber must be under 100 g per 100 g. Fail either and the row is rejected or marked incomplete. This filters most crowdsourced garbage before it reaches ranking.

## 3. The resolver

Every input path (voice, photo, barcode, search) ends in the same function: `resolve(query, context) -> best match, confidence, alternatives`.

Steps
1. Normalize the query: lowercase, strip brand noise, expand abbreviations (tbsp, oz), split quantity from food, detect prep words (grilled, fried, boiled, dry, cooked).
2. Candidate generation: canonical table (FTS5 plus embedding match), then the local cache of past resolutions, then external sources only if fewer than 3 candidates score above threshold.
3. Score each candidate 0 to 100:
   - Name match: 35 points. Token overlap plus embedding cosine. Exact canonical alias hits score full.
   - Source tier: 20 points. Canonical 20, USDA Foundation and SR 18, USDA Branded 14, FatSecret verified 12, OFF complete 10, OFF incomplete 3.
   - Completeness: 15 points. Full macro panel plus fiber and portions.
   - Prep match: 15 points. "chicken rice bowl" prefers cooked rice, not dry. "Oats" with no prep word defaults dry.
   - Portion availability: 10 points. Has a household portion matching the user's unit.
   - Popularity: 5 points. Log-scaled count of past confirmations by all LOCKED users.
4. Dedupe by nutrient signature: candidates within 5% on kcal, protein, carbs, and fat collapse into one, keeping the highest-tier row. This removes the "twelve near-identical chicken breasts" problem.
5. Return the top row as the single displayed match. Alternatives stay behind "Not this?" and never appear by default.

Confidence = top score scaled to 0 to 1, penalized by the gap to the second-best candidate being small (ambiguity) and by the source tier. Under 0.6 triggers a chip question. Under 0.4 shows the top two as chips instead of auto-selecting.

## 4. Search UI behavior

- The user sees one result card with the default portion already filled and macros shown. Not a list.
- The card carries the source badge and the portion. Tap the portion to change it. Tap "Not this?" to see up to four alternatives, deduped.
- Recent and saved foods rank above everything for that user. A food they confirmed twice becomes their personal canonical for that query string.
- Empty results never show a blank. The resolver falls back to the closest canonical category ("chicken, generic, cooked") flagged Estimate.

## 5. Voice path

1. Speech to text on device (iOS SpeechRecognizer) to keep cost near zero and latency under 1 second. Fall back to Whisper via the Worker for long or noisy clips.
2. One LLM call parses the transcript into structured items:
   ```
   [{food: "eggs", qty: 2, unit: "large", prep: null, meal_hint: "8:00"},
    {food: "chicken rice bowl", qty: 1, unit: "bowl", prep: null, meal_hint: "lunch"},
    {food: "protein shake", qty: 1, unit: "serving", prep: null, meal_hint: "after gym"}]
   ```
   Force JSON. Temperature 0. Include the user's saved foods and last 30 logged names in the prompt so "my usual shake" resolves.
3. Each item goes through the resolver. Composite dishes (bowl, burrito, salad) resolve against canonical composite recipes, which hold a component list with default grams. Adjusting one component adjusts the total.
4. Time resolution: explicit time wins. Meal words map to the user's own median meal times from history. "After the gym" is last workout end plus 15 minutes. Nothing stated is now.
5. Question rule: ask only when a single unknown moves the item by more than 15% of its calories. Milk vs water in a shake qualifies. Brand of eggs does not.

## 6. Photo path

1. Vision model call returns items, an estimated portion in grams for each, a prep guess, and an uncertainty list. Prompt for structured JSON, ask for visible oil sheen, sauce, dressing, cheese, and plate size cues explicitly.
2. Each item resolves through the resolver, using the model's gram estimate as the portion.
3. Bias correction. Published tests show photo apps underestimate meals by about 33% energy and 30 g fat, mostly from unseen fat. Handle it with questions, not a blind multiplier:
   - Questions ordered by expected calorie delta: cooking oil, sauce or dressing, portion scale, hidden sugar. Cap at three.
   - Each chip answer maps to a fixed addition from the canonical table (a little oil = 1 tsp = 40 kcal, a lot = 1 tbsp = 120 kcal, dressing = 2 tbsp of the closest match).
   - If the user skips questions, apply the median answer from their own history for that dish type, flagged in the detail view.
4. Label photos: OCR the nutrition panel, parse directly, mark Verified once serving size is confirmed. No questions.
5. Receipt photos: existing vision route, each line item resolved, low-confidence lines grouped into one "confirm these" step.

## 7. Barcode path

Lookup order: local cache, OFF, USDA Branded by GTIN, FatSecret. First hit that passes the plausibility gate and has a full macro panel wins. An OFF hit that fails completeness shows as Community with the missing fields listed, and the label-photo path is offered as the fix.

## 8. Portion intelligence

- Every canonical food carries household portions with gram weights from USDA foodPortions, plus a density where volume units make sense.
- Prep conversions live on the food row: rice dry to cooked 1 : 2.8, pasta 1 : 2.2, chicken raw to cooked 0.75, oats dry to cooked 1 : 2.5. The resolver applies them when the stated prep does not match the row's prep_state.
- Vague units resolve to the user's history first (their "bowl" of rice), then to the canonical default (bowl = 1.5 cups cooked).

## 9. Learning loop

- Every confirmed log writes back: query string to food_id, chosen portion, chip answers. This trains the personal canonical layer and the popularity score.
- Weekly TDEE recalculation from weight trend and intake is the ground truth check on the whole pipeline. If the implied maintenance drifts from the formula estimate by more than 15% for four straight weeks, the app flags likely systematic under-logging and raises the hidden-fat defaults for that user.
- Keep a 200-meal validation set with weighed macros. Run the photo and voice paths against it on every model or prompt change. Track mean absolute percent error for kcal and fat separately. Target under 15% kcal, under 20% fat after questions.

## 10. Architecture

```
iOS app
  on-device speech to text, camera, barcode
  bundled SQLite: foods_canonical + user cache (offline logging works)
      |
Cloudflare Worker (single gateway, API keys never in the app)
  /parse-voice   -> LLM JSON
  /parse-photo   -> vision JSON
  /resolve       -> resolver, cache read and write
  /barcode       -> OFF -> USDA Branded -> FatSecret
      |
Supabase
  foods_canonical, foods_cache, resolutions (query -> food_id, user_id, count)
  log_entries with a frozen nutrient snapshot per entry, so a later data fix never rewrites history
```

Snapshotting matters: each log entry stores the macros as they were at log time plus the food_id. Corrections to the canonical table apply forward only.

## 11. Build order

1. Canonical table, 1,500 foods, seeded from USDA Foundation and SR with portions and prep conversions. Two days of focused work, mostly review.
2. Resolver with scoring, dedupe, plausibility gate, cache. Unit tests against 100 tricky queries ("oats", "rice", "chicken", "shake").
3. Search card UI wired to the resolver, single result with alternatives hidden.
4. Barcode path.
5. Voice path with on-device transcription and the JSON parser.
6. Photo path with question engine and bias handling.
7. Learning loop and validation set.

## 12. Cost ceiling

Per log at expected volume: voice about 0.1 cent (one small LLM call), photo about 1 to 2 cents (one vision call), search and barcode near zero after cache warms. At 1,000 daily active users logging four times a day, under $60 a month.

---

## What this means for the redesign demo

Fuel is NOT rebuilt here and NOT removed. Consequences the demo must honour:

1. **Fuel keeps its place in the tab bar.** It is a first-class area of the app.
2. **Navigation is five tabs: Home, Train, Fuel, Progress, Coach.** Profile does not earn a tab; its
   audit found its only unique job is being the door to Settings. Account and settings are reached
   from the Home header instead.
3. **The one-result-plus-alternatives pattern is shared.** Fuel's search shows a single result card
   with alternatives behind "Not this?", never a list. The split builder uses the same idea: one
   pick per slot, three alternatives behind a sheet, "let LOCKED choose" as the default. Any future
   screen that resolves an ambiguous input uses this pattern, not a list of near-identical rows.
4. **Confidence is shown, not hidden.** Where the app guesses, it says so: a source badge, an
   Estimate flag, or a short chip question, and only when the unknown moves the answer materially.
5. **Shopping and Budget hangs off Fuel.** The redesign audits recommend cutting most of it: My
   Stores opens ten browser tabs, Budget makes three of the page's four network calls and produces
   nothing that touches a lift or a body metric, and Pantry duplicates the list. What survives is a
   single shopping list, which belongs to Fuel and not to a page of its own.
