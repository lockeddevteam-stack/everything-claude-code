# The server half

**It is deployed, and the app is pointed at it.** `08-build/cloud-config.js`
carries the project URL, the publishable key and the Worker's address; every
method in `LKCloud` refuses with a reason the screens print when that file is
cleared. That path is still worth keeping: a client that answered plausibly
with no server behind it would be impossible to tell apart from a working one.

## What is actually running

| Piece | Where | What it does |
|---|---|---|
| Supabase | `fwimdnukebbrwpwdyjbv` | Accounts, `profiles` (subscription state), `user_data` (one row per key per person), `store_push` (the conflict rule), usage counters. Row level security pins every row to `auth.uid()`. |
| Worker | `lockedapi.cescocugliari.workers.dev` | `POST /` is the coach. Also food search, photo analysis, receipt parsing, store search, push keys and subscriptions, and a cron that delivers reminders. It holds every model key, which is the reason it exists. |

`supabase-schema.sql` describes the live project rather than proposing one:
it was a blueprint for a schema that did not match what was already there
and already had people's data in it. Running it against the live project is
a no-op; running it against a fresh project reproduces it.

`coach-worker.js` is **not** what is deployed. It was written before this
work found the running Worker, and it calls Anthropic with tool-use for
structured actions, where the deployed one calls Gemini with Groq behind it
and reads a JSON envelope out of the text. It is kept as the reference for
what a purpose-built coach endpoint looks like; `cloud.js` speaks to the
deployed contract, not to this file.

| File | What it is |
|---|---|
| `coach-worker.js` | A reference implementation. Not deployed. |
| `supabase-schema.sql` | The live schema, described, plus this work's one migration. |
| `../08-build/cloud-config.js` | The only file a deploy edits. Publishable key only. |
| `../08-build/cloud.js` | `LKCloud` — the one seam. Accounts, sync, entitlements, the coach, food, reminders. |
| `../08-build/coach-actions.js` | `LKCoachActions` — the gate everything the coach proposes passes through, on the device. |
| `../08-build/exercises.js` | The 866-row catalogue the gate resolves every exercise id against. |

## What is still owed

Forty-five rows in `../14-signoff/REGISTER.json` still say NEEDS_SERVER, and
they group into five kinds: a model writing something (19), a model reading a
picture (6), push delivery beyond the subscription (8), a third-party key or
feed (4), and eight others. Each screen says at the point of use what it
cannot do. None of them is a broken control.

One setting this repository cannot change: leaked password protection is off
on the Supabase project. It checks new passwords against HaveIBeenPwned and
is a switch under Authentication → Policies.

## The shape of it

```
   the app  ──►  LKCloud.ask()  ──►  Worker /coach  ──►  the model
                                          │
                                     reply + actions
                                          ▼
   the app  ◄──  LKCoachActions.checkAll()  ◄──────────┘
                      │
                 a card per action, showing exactly what would change
                      │
                  the person approves
                      ▼
                 LKCoachActions.apply()  ──►  LKStore  ──►  the screens
```

**The Worker never writes anything.** It proposes. Every action passes through
`coach-actions.js` on the device, which resolves every exercise id against the
real catalogue, recomputes every total from its parts, bounds every number, and
refuses what fails. Cards are drawn from the *checked* action, not from the
response.

That split is the point. The Worker can be wrong — a model will name an
exercise that does not exist and state a calorie total that does not match its
own ingredients — and none of it reaches somebody's training data. Do not move
validation to the server and trust it. Validate in both places, and let the
device have the last word.

## Deploying

### Supabase

1. Make a project. Run `supabase-schema.sql` in the SQL editor.
2. Take the project URL and the **publishable (anon) key**. Both belong in the
   client: row level security is what protects the data, not the secrecy of
   that string. The service role key never goes near the app.
3. Entitlements are written by the payment webhook with the service role key
   and by nothing else. The client has a select policy and no other, so
   nothing a person does in the app can make them Pro.

### The Worker

```sh
cd redesign/15-server
wrangler deploy
wrangler secret put ANTHROPIC_API_KEY
```

Optionally `COACH_MODEL` to pin a model. With no key the Worker returns 503
`no_key` rather than answering from a canned string.

### The client

Before the screens load:

```html
<script>
window.LK_CLOUD = {
  supabaseUrl: 'https://<ref>.supabase.co',
  supabaseKey: '<publishable anon key>',
  coachUrl:    'https://<worker>.workers.dev/coach'
};
</script>
```

## Sync

One row per key per person, keyed on `LKStore.syncKeys()` — everything somebody
made, and nothing about the device. A theme, a dev state and a live session
belong to the phone they were set on.

Conflicts are last-write-wins on **the device's clock**, which `LKStore`
records per key (`changedAt`). `store_push` resolves it inside one statement so
two phones racing cannot interleave a read and a write, and an older write
landing late is dropped rather than overwriting a newer one.

The rule is deliberately dumb. Anything cleverer needs a merge per key, and a
wrong merge loses work in a way a person cannot see.

## Still to do at cutover

- `USDA_KEY` on the existing `lockedapi` Worker, and drop its `|| "DEMO_KEY"`
  fallback. See `../14-signoff/WORKER-USDA-KEY.md`.
- The payment provider and the webhook that writes `entitlements`.
- Push: a `subscriptions` table and the send path. The client half is built and
  says what is missing.

## What the shipped app syncs that this build does not read

Read off `lockeddevteam-stack/locked` `index.html` (its own sync list) and
checked against `08-build/store.js`. Every key a live account actually
holds today is handled: the live table carries 34 distinct keys across 5
accounts, and all 34 either sync under the same name or have a migration.

These are the rest of the shipped app's sync set. None of them is present
on any live account, so nothing is being lost today, and the hosted app is
still running and could write them tomorrow.

Adopted by a migration:

| shipped app | this build | how |
|---|---|---|
| `lk_gamingLayer` | `lk_badges` | migration 6, a boolean, same meaning |
| `lk_profile.goal` `"Cut"`/`"Maintain"`/`"Bulk"` | `cut`/`maintain`/`build` | migration 7. Every reader of it defaulted an unknown word to maintain, so a cutting reader was given 400 kcal a day more than the goal they set |
| `lk_fuelLog[day].meals` as buckets | a list of meals each carrying its slot | migration 8. Fuel calls `src.meals.map`, so against the stored shape it threw on load and the screen was blank |
| `lk_fuelLog[day].water` | `waterMl` | migration 8, millilitres under both names |
| `lk_fuelProfile.activityLevel` | `.activity` | read under both names in `fuel.html`, same five words. Unread, the week became a moderate one and the calorie target moved with it |

Deliberately not adopted, and why. Each of these is real content, and each
would need its values remapped rather than copied — the shapes differ, and
the shipped app's food rows carry free text where this build carries a key
into its own food table. A mapping built on a guess would change what
somebody's meal is recorded as, which is worse than not importing it.

| shipped app | nearest here | what differs |
|---|---|---|
| `lk_favFoods` | `lk_fuelFavourites` | there: food objects. here: food keys |
| `lk_myGroceries` | `lk_myFoods` | free-text rows against keyed rows |
| `lk_userRecipes` | `lk_recipes` | `ingredients`/`perServing.cal` against `items`/`kcal`, and the ingredients carry no food key |
| `lk_mealPlans` | `lk_fuelPlans` | same, through the same ingredients |
| `lk_cycleLog` | `lk_cycles[].comps[].taken` | there: a map of day to `"cycle::compound"`. here: a date list on the compound. Mechanical, but nobody has either key yet |
| `lk_textScale` | — | this build sizes from the platform's own text setting |

Device-only, and correctly not synced: `lk_cardioMigrated`,
`lk_prDatesFixed`, `lk_weightsKgMigrated`, `lk_splitsExpanded`,
`lk_throwbackDismissed`, `lk_usdaKey`.

`lk_weightStorageUnit` is not a preference to carry: the shipped app
derives it from `lk_profile.useKg` and the unit-conversion switch. Weights
are stored in kilograms under both settings — checked against live rows,
where a profile reading `useKg: false` still stores `kg: 68.946` — and
`useKg` is the key both builds display from.
