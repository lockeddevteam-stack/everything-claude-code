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
