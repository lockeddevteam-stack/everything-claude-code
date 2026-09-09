# LOCKED external APIs: what you have, what to get, what to fix

Measured from `input/locked-current-v6.html` (v6.0), plus the Fuel data-layer spec in
`07-briefs/fuel-data-layer.md`. 36 fetch call sites, 22 distinct external hosts.

## 1. What the app talks to today

| Service | How it is reached | Used by | State |
|---|---|---|---|
| Cloudflare Worker `lockedapi.cescocugliari.workers.dev` | 24 call sites across 16 routes | Coach, all AI features, sync, beta | Works. Single gateway, correct design |
| Supabase `fwimdnukebbrwpwdyjbv.supabase.co` | JS client | Auth, cloud sync | Works |
| USDA FoodData Central `api.nal.usda.gov` | **Direct from the browser** | Food search, barcode fallback | **Key exposed. Fix** |
| Open Food Facts `world.openfoodfacts.org` | **Direct from the browser** | Barcode lookup, food search | Works, but bypasses the gateway |
| ExerciseDB `static.exercisedb.dev` | 225 hardcoded GIF URLs | Exercise demonstrations | **Fails silently. Fix** |
| YouTube `youtube.com` / `i.ytimg.com` | Opens a tab, loads a thumbnail | Exercise form videos | Works, thin |
| 13 retailer sites | Search URLs only, no API | Shopping "Shop at" | Opens 10 browser tabs. Audits say cut |

### Worker routes, all 16

| Route | Purpose | Notes |
|---|---|---|
| `/` (root POST) | **12 call sites**, general LLM proxy | Coach chat, home insight, meal plans, budget advice, price comparison, receipt parsing. Everything funnels here with a `system` prompt in the body |
| `/analyze-meal` | Vision, meal photo | Fuel |
| `/analyze-physique` | Vision, progress photo | Photos |
| `/voice` | Speech transcription | Voice logging |
| `/parse-receipt` | Vision, receipt | Shopping |
| `/store-search` | Store lookup | Shopping |
| `/food-search?src=fatsecret` | Food lookup | Fuel. FatSecret already wired |
| `/exercise-detail/<id>` | Exercise metadata | Library |
| `/yt-search` | Form video lookup | Library |
| `/beta-validate`, `/beta-sync` | Beta access | **Fail-open. Fix** |
| `/user/sync`, `/user/check`, `/user/data`, `/user/delete` | Account and data | Works |
| `/push/key` | Push notifications | Works |
| `/app-version` | Update check | Works |

## 2. Fix these, in order of severity

### Critical

**1. The USDA key is in the client.** `api.nal.usda.gov` is called directly from the browser
with `api_key` in the query string, keyed from `localStorage.usdaKey` and falling back to the
literal `DEMO_KEY`. Anyone can read the key from network inspection, and `DEMO_KEY` is rate
limited to roughly 30 requests an hour, so food search silently fails for most users.
*Fix:* move both USDA calls behind the Worker, exactly as your Fuel spec already says. The
Worker holds the real key. Delete the `usdaKey` setting from the client. This is one route,
`/food-search?src=usda`, next to the FatSecret one that already exists.

**2. Beta validation is fail-open.** `validateBetaCodeRemote`'s catch block calls
`onResult(true)`. A network failure grants access. It also runs a local check first, so an
unknown code never reaches the network at all.
*Fix:* fail closed, and surface the real failure. There is no busy state either: no spinner,
no disabled button, no label change, so a slow network is indistinguishable from a dead tap.

**3. Exercise demonstrations fail into nothing.** 225 hardcoded ExerciseDB GIF URLs on a third
party CDN you do not control, with no fallback. When one 404s or the host is slow, the detail
sheet renders a 351 by 351 empty box, 81 percent of the visible sheet, with no alt text and no
retry. The "no animation available" fallback is dead code that only fires when the URL is
missing entirely, not when the request fails.
*Fix, two parts:* handle the error case visibly, and stop depending on a CDN you do not own for
a core feature. Either mirror the media to your own storage, R2 sits next to the Worker, or
design the sheet so the illustration is a bonus rather than the main content. The rebuilt
library already does the second: it draws a muscle map locally, so a missing clip costs nothing.

### Worth fixing

**4. Twelve unrelated features share one unlabelled route.** The root POST carries a `system`
prompt from the client, so the client decides what the model is asked to do. That means no
per-feature rate limiting, no per-feature cost tracking, no caching, and a prompt-injection
surface if any user content reaches those prompts.
*Fix:* split by purpose, `/coach`, `/insight`, `/meal-plan`, `/budget`, and move the system
prompts server-side. You then get per-feature quotas and can cache the cacheable ones.

**5. Guests hit a paywall the code says they should never see.** A comment at line 331 states
guests get full access with no gates, but a 429 from the Worker renders "You've used your 10
free chats today" and opens the paywall overlay, which a guest cannot act on.
*Fix:* decide the real policy and make the Worker and the client agree.

**6. Open Food Facts is called from the browser.** No key needed so nothing leaks, but it
bypasses your gateway, so it cannot be cached, rate limited or swapped without an app release.
*Fix:* move behind the Worker as part of the `/barcode` chain in your spec.

**7. Retailer "Shop at" opens ten browser tabs.** These are plain search URLs, not
integrations, and the ten brand colours defined for them never render, because they only apply
to stores added in-session. Both audits recommend cutting the feature.

## 3. What to get

Your Fuel spec already picks the right sources. Against what is wired today:

| Need | Status | Action |
|---|---|---|
| USDA FoodData Central | Wired, key exposed | **Get a real key**, put it in the Worker. Free, 1,000 req/hr |
| Open Food Facts | Wired | Nothing to get, free and keyless. Move server-side |
| FatSecret | Route exists | Confirm the free tier is provisioned and the quota is known |
| USDA Branded by GTIN | Partially wired | Same key as above, no extra signup |
| Your `foods_canonical` table | Not started | The real work. Your spec is right that this answers 90% of logs |
| Exercise media | Third-party CDN | **Own it.** Mirror to R2, or drop the dependency |
| Form videos | `/yt-search` | Works, but check the quota. YouTube Data API is 10,000 units a day and a search costs 100, so 100 searches a day |
| Push | `/push/key` wired | Nothing |

Nothing else needs buying. Your spec is right to skip Nutritionix at $1,850 a month and
Edamam; USDA plus the canonical table covers what they sell.

## 4. Cost and quota exposure

The Worker is the only thing holding keys, which is correct, and it is the only thing you need
to protect. Two exposures today:

- **No per-feature quota.** Twelve features share one route, so a loop in any one of them
  burns the whole budget. Splitting the routes fixes this.
- **Guest mode sends no auth token.** `authHeaders` omits it, so the Worker cannot attribute a
  guest's usage. Rate limiting must be by IP or device, which is weak. Decide whether guests
  get AI at all; the code currently says yes and the Worker says no.

Your spec's ceiling, under $60 a month at 1,000 daily users logging four times a day, holds
only if the canonical table lands first. Without it, every log is a live API call.

## 5. Suggested order

1. Move the USDA key server-side. One route, removes a live credential leak.
2. Fail beta validation closed, and give it a busy state.
3. Split the root POST by feature and move the system prompts server-side.
4. Decide the guest AI policy and make client and Worker agree.
5. Own the exercise media, or make the library not need it.
6. Move Open Food Facts behind the Worker.
7. Build `foods_canonical`, which is what makes the cost ceiling real.
