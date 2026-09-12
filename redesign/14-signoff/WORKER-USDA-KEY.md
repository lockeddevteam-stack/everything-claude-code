# The USDA key on the lockedapi Worker

## What I could check, and what I could not

**Checked.** The deployed bundle of the `lockedapi` Worker
(account script id `ee63f8cade434f299e6eaa4749a1a0b0`) still carries the
fallback, at line 1542 of the bundle:

```js
var USDA_KEY = env.USDA_KEY || "DEMO_KEY";
```

**Not checked, and why.** Two things are outside this session's reach:

1. **Whether the secret is bound.** The Cloudflare MCP server is read-only for
   Workers and exposes no secret listing. It can read the script and its
   metadata; it cannot enumerate `env`. Nothing here can confirm the binding
   from outside the running Worker.
2. **Whether the key works.** This environment's network egress proxy blocks
   both `lockedapi.cescocugliari.workers.dev` and `api.nal.usda.gov`. Every
   route out — curl, the fetch tool, the proxy itself — returns
   `EGRESS_BLOCKED`. That is the environment's allowlist, chosen when the
   environment was created; no connector permission changes it.

So: I can tell you the fallback is still there. I cannot tell you the secret
is set, and I cannot tell you the key is valid.

## Why the fallback matters

`DEMO_KEY` is a real, rate-limited key that api.nal.usda.gov accepts. So a
Worker with no `USDA_KEY` bound does not fail — it serves food data at a much
lower rate limit until that limit is hit, and then returns partial results
that the app fills in from the model instead. Nothing anywhere says this
happened. The failure is invisible and it degrades quietly, which is the worst
shape for a number a person eats by.

## The change

Remove the fallback so a missing secret fails loudly at the point of use:

```js
var USDA_KEY = env.USDA_KEY;
if (!USDA_KEY) {
  return new Response(
    JSON.stringify({ error: 'USDA_KEY is not configured on this Worker.' }),
    { status: 500, headers: { 'content-type': 'application/json' } }
  );
}
```

## How to run it

The Worker's source is not in this repository — only the deployed bundle
(readable through the MCP) and the v6 client that calls it
(`redesign/input/locked-current-v6.html:38564` and `:40385`). Applying this
needs the Worker's own repo, or the Cloudflare dashboard's editor.

## What it means for this build

Nothing. The redesign makes no network calls at all: a grep of
`redesign/08-build/` and `redesign/10-final/` for `workers.dev`,
`analyze-meal` or `lockedapi` returns nothing. Every figure it shows is
computed on the page from `redesign/tests/fixtures/seed-data.json`. The key
matters for the production v6 app, not for this one.

## To verify it yourself

```
curl -s "https://api.nal.usda.gov/fdc/v1/foods/search?query=chicken%20breast&api_key=$USDA_KEY&pageSize=1" | head -c 400
```

A valid key returns JSON with a `foods` array. An invalid one returns
`{"error":{"code":"API_KEY_INVALID",...}}`. A rate-limited `DEMO_KEY` returns
an `OVER_RATE_LIMIT` message, which is the case this change is meant to make
impossible to reach by accident.
