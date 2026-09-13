# The server half

Nothing in this directory is deployed, and the app knows it. `LKCloud.ready()`
is false until a deploy sets `window.LK_CLOUD`, and every method refuses with a
reason the screens print at the point of use. That is deliberate: a client that
answered plausibly with no server behind it would be impossible to tell apart
from a working one.

## What is here

| File | What it is |
|---|---|
| `coach-worker.js` | The Cloudflare Worker. `POST /coach` — thread in, prose plus proposed actions out. |
| `supabase-schema.sql` | Tables, row level security, the push function and entitlements. |
| `../08-build/cloud.js` | `LKCloud` — the one seam in the client. Accounts, sync, entitlements, the coach. |
| `../08-build/coach-actions.js` | `LKCoachActions` — the gate everything the coach proposes passes through, on the device. |

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
