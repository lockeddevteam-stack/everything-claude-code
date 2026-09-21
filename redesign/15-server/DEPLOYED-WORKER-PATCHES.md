# Patches for the deployed Worker

> **STATUS, 21 September 2026: all of this is in git and deploys itself.**
> The Worker's source lives in the locked repo at `worker/worker.js`, and
> `.github/workflows/deploy-worker.yml` deploys it on push to
> `claude/pwa-locked-repo-setup-7nt4yc`. Nothing here needs pasting into a
> dashboard, and the paragraph below saying otherwise was wrong.
>
> **What went wrong afterwards, and the thing to remember.** A second branch
> had added itself to that workflow's branch list on its own copy of the file.
> It pushed last, at 00:14 on 19 September, and replaced the live Worker with
> a build that forked before every fix in this document. Nothing failed and
> nothing was logged. The coach spent two days cutting long answers off after
> twenty seconds and telling people to check their connection.
>
> So: **read the deployed bundle before believing the source.**
> `workers_get_worker_code` on the `lockedapi` script returns what is actually
> serving, and grepping it for a marker from the last change takes a minute.
> A green deploy run proves that *a* deploy happened, not that yours is the
> one still live.
>
> The reconciliation, the 45 second deadline and the regression suite that
> holds it are in `worker/coach-deadline.test.mjs`. The workflow runs every
> suite before it deploys now.


These apply to the Worker that is actually live at
`lockedapi.cescocugliari.workers.dev`, read out of Cloudflare on 18 September
2026. They do NOT apply to `coach-worker.js` sitting next to this file, which
is an unshipped Anthropic-based alternative that nothing calls.

They were written when this file thought the Worker had no source in git. It
does, and every patch below is applied there. Kept as the record of why each
one exists.

Note for whoever reads the old reference: `WORKER_REFERENCE.md` in the locked
repo describes a Groq Worker with `llama-3.3-70b-versatile` and a
decommissioned vision model. None of those strings are in the live bundle. The
Worker is Gemini end to end, text and vision both on `geminiModel(env)`.

---

## Part A. Three keys, one per area

### What adding the secrets already does, and what it does not

`geminiKeys(env)` walks every environment variable, keeps anything shaped like
a Google key (`/^AIza[A-Za-z0-9_\-]{20,}$/`), and sorts them into three
buckets: names matching `/gemini|generative|vision|ai/i` first, then anything
else, then `GOOGLE_KEY` and `YT_KEY` last.

So `GEMINIVIS_KEY` and `GEMINIFUEL_KEY` are already being picked up. But they
are picked up as ONE POOL, tried in order, and the pool exists for failover,
not for spreading load:

```js
var _gemKey = null;
function geminiKeys(env) {
  if (_gemKey && !isDead(_gemKey))
    return [_gemKey];
```

`_gemKey` is a module global. The first key that answers successfully becomes
the only key that isolate uses, for the coach, for Fuel and for vision alike,
until it dies or the isolate is recycled. A key is only marked dead on a 403 or
400 that names a blocked or invalid key, and a 429 (out of quota) is NOT one of
those. So today the three keys give you a spare when a key is revoked, and
close to nothing when a key runs out of requests.

The patch below routes each area to its own key and keeps the others as
fallback, so quota is actually split three ways.

### K1. Per-purpose key selection

Find:

```js
var LAST_RESORT = { GOOGLE_KEY: 1, YT_KEY: 1 };
var _gemKey = null;
```

Replace with:

```js
var LAST_RESORT = { GOOGLE_KEY: 1, YT_KEY: 1 };
/* ONE KEY PER AREA, so three keys are three quotas rather than one with two
   spares. _gemKey used to be a single global: the first key that answered
   became the only key the isolate used for everything, which is why adding
   keys bought a spare and no extra headroom. Keyed on the purpose now, so
   the coach sticking to its key does not pin Fuel to it as well. */
var PURPOSE_KEY = { coach: "GEMINI_KEY", vision: "GEMINIVIS_KEY", fuel: "GEMINIFUEL_KEY" };
var _gemKey = {};
```

Find the whole of `geminiKeys` and `geminiKey`:

```js
function geminiKeys(env) {
  if (_gemKey && !isDead(_gemKey))
    return [_gemKey];
  var hinted = [], plain = [], last = [];
  if (env && typeof env.GEMINI_KEY === "string" && env.GEMINI_KEY)
    hinted.push(env.GEMINI_KEY);
```

Replace that opening with:

```js
function geminiKeys(env, purpose) {
  var p = purpose || "coach";
  var stuck = _gemKey[p];
  if (stuck && !isDead(stuck))
    return [stuck];
  var ownName = PURPOSE_KEY[p] || "GEMINI_KEY";
  var own = [], hinted = [], plain = [], last = [];
  /* This area's own key first. Everything else stays in the pool behind it,
     so a revoked or exhausted key still falls through to the others rather
     than taking the feature down. */
  if (env && typeof env[ownName] === "string" && env[ownName])
    own.push(env[ownName]);
  if (env && typeof env.GEMINI_KEY === "string" && env.GEMINI_KEY && ownName !== "GEMINI_KEY")
    hinted.push(env.GEMINI_KEY);
```

In the `Object.keys(env || {}).forEach(...)` body just below, add one line at
the top of the callback so this area's own key is not also collected as a
generic one:

```js
    if (name === ownName)
      return;
```

Then find:

```js
  var all = [], seenAll = {};
  hinted.concat(plain, last).forEach(function(k) {
```

Replace with:

```js
  var all = [], seenAll = {};
  own.concat(hinted, plain, last).forEach(function(k) {
```

And find:

```js
function geminiKey(env) {
  var ks = geminiKeys(env);
  return ks.length ? ks[0] : "";
}
```

Replace with:

```js
function geminiKey(env, purpose) {
  var ks = geminiKeys(env, purpose);
  return ks.length ? ks[0] : "";
}
```

### K2. Carry the purpose into the fetch

Find:

```js
async function geminiFetch(env, url, init) {
  var keys = geminiKeys(env);
```

Replace with:

```js
async function geminiFetch(env, url, init, purpose) {
  var p = purpose || "coach";
  var keys = geminiKeys(env, p);
```

Inside the same function, find:

```js
    if (res.ok) {
      _gemKey = keys[i];
      return { res, text, key: keys[i], why: "" };
    }
```

Replace with:

```js
    if (res.ok) {
      _gemKey[p] = keys[i];
      return { res, text, key: keys[i], why: "" };
    }
```

And find:

```js
    _gemDead[keys[i]] = Date.now();
    if (_gemKey === keys[i])
      _gemKey = null;
```

Replace with:

```js
    _gemDead[keys[i]] = Date.now();
    if (_gemKey[p] === keys[i])
      _gemKey[p] = null;
```

### K3. Pass the purpose at each call

The rule: **typing or saying your food goes to the fuel key. Anything with a
picture in it goes to the vision key, whether it is a plate of food or a
physique photo. Talking to the coach, and any overview or recap, goes to the
coach key.**

Every AI call in the Worker, and where it lands:

| Call | Route | Key |
|---|---|---|
| `fromEstimate` | `/food-search` | fuel |
| the ranking call | `/food-search` | fuel |
| `readMeal` | `/log-meal` | fuel |
| `parseOut`, `fillOut`, `fbOut` (`groq`) | `/analyze-meal`, text steps | fuel |
| the Whisper-style `geminiFetch` | `/voice`, speech to text | fuel |
| `iText` (`groq`) | `/voice`, intent parse | fuel |
| `aiText` (`groq`) | `/store-search` | fuel |
| `visionOut` | `/analyze-meal`, the photo | vision |
| `vText` | `/parse-receipt` | vision |
| `spText` | `/scan-pantry` | vision |
| `vText` | `/analyze-physique` | vision |
| a coach message carrying a photo | `/` | vision |
| `geminiText(messages, gOpts)` | `/`, the coach | coach |
| the `/ai-status` ping | `/ai-status` | coach |

`/store-search` is my call rather than yours. It suggests products for a
shopping list, which is food typed by a person, so it sits with Fuel. Move it
to the coach key by changing one `purpose` if you would rather.

**Every image call, in one line.** Rather than name the vision key at four call
sites and rely on nobody forgetting the fifth, set the default inside
`geminiVision` itself:

```js
    async function geminiVision(b64Data2, mimeType, promptText, opts) {
      opts = opts || {};
      /* Every call through here has a picture in it by definition, so this is
         the vision key's work whatever asked for it: a plate of food, a
         receipt, a shelf, or a physique photo the coach is reading. */
      if (!opts.purpose) opts.purpose = "vision";
```

and add `, opts.purpose` as a fourth argument to the `geminiFetch` call inside
it. The four vision routes then need no edits at all.

**A coach message with a photo attached.** The coach route is text most of the
time and a picture some of the time, and by your rule the picture decides. A
fixed purpose on the handler would send physique photos sent through chat to
the coach key. Decide it from the request instead, in `geminiText`, right after
`contents` is built and before the `geminiFetch` call:

```js
      /* THE PICTURE DECIDES, not the route. A coach turn is ordinarily the
         coach key's work, but a photo riding along with it is vision work and
         is charged to the vision key. Reading it off the parts rather than
         off the caller means nothing has to remember to say so. */
      var hasImage = contents.some(function (c) {
        return (c.parts || []).some(function (p) { return p && p.inline_data; });
      });
      var usePurpose = hasImage ? "vision" : opts.purpose;
```

and pass `usePurpose` as the fourth argument to `geminiFetch` instead of
`opts.purpose`:

```js
          body: JSON.stringify(gBody)
        },
        usePurpose
      );
```

**Coach.** Find:

```js
      var gOpts = { max_tokens: maxTokens, temperature, json: isStructured };
```

Replace with:

```js
      var gOpts = { max_tokens: maxTokens, temperature, json: isStructured, purpose: "coach" };
```

**Fuel, the three food text calls.** Add `purpose: "fuel"` to the options
object of each:

- `fromEstimate`: `{ max_tokens: 400, temperature: 0, json: true, purpose: "fuel" }`
- the ranking call: `{ max_tokens: 256, temperature: 0, json: true, purpose: "fuel" }`
- `readMeal`: `{ max_tokens: 500, temperature: 0, json: true, purpose: "fuel" }`

Their guards should ask about the same key. Change `if (!geminiKey(env))` in
`fromEstimate` to `if (!geminiKey(env, "fuel"))`, and
`if (geminiKey(env) && deduped.length > 1)` to
`if (geminiKey(env, "fuel") && deduped.length > 1)`.

**Fuel, the calls that go through `groq`.** `groq` is a one-line shim that
forwards to `geminiText`, so it passes options straight through. Add
`purpose: "fuel"` to the options object of the `groq` calls at
`/analyze-meal` (three of them: the parse, the fill and the fallback),
`/voice` (the intent parse) and `/store-search`.

If you would rather not touch five call sites, give the shim a default instead,
since every current `groq` caller is a food path:

```js
    async function groq(messages2, opts) {
      opts = opts || {};
      if (!opts.purpose) opts.purpose = "fuel";
      return geminiText(messages2, opts);
    }
```

That is the smaller edit and it is honest today. It stops being honest the
moment something that is not about food calls `groq`, so if you take it, take
the comment with it.

**Voice, speech to text.** That one calls `geminiFetch` directly. Add a fourth
argument after the init object:

```js
        var wAttempt = await geminiFetch(
          env,
          "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel(env) + ":generateContent",
          {
            ...
          },
          "fuel"
        );
```

Anything not named falls back to `"coach"`, which reads `GEMINI_KEY`. That is
today's behaviour, so nothing that is missed breaks.

### K4. Check it took

`/ai-status` reports `aiKeys` as the number of usable keys. After the patch it
should still count all three. To prove the routing rather than the count, watch
the Worker's logs while you use Fuel and then the coach: the two requests
should carry different keys.

---

## Part B. Why the coach goes quiet, and why cards do not appear

These are independent of the keys. They were found by reading the same bundle.

### P1. An empty answer is returned as a success

`geminiText` ends:

```js
  var gCand = gData.candidates && gData.candidates[0];
  return gCand && gCand.content && gCand.content.parts && gCand.content.parts[0] && gCand.content.parts[0].text || "";
```

No candidate, a safety or recitation stop, or the length limit reached while
the model was still thinking, and this returns an empty string. The handler
then answers HTTP 200 with `{"content":[{"type":"text","text":""}]}` and the
app says "That answer came back empty". It also reads only `parts[0]`, so on a
thinking model the reasoning part can be returned instead of the answer, and an
envelope split across two parts arrives as half an object.

Replace both lines with:

```js
  var gCand = gData.candidates && gData.candidates[0];
  var gParts = gCand && gCand.content && gCand.content.parts || [];
  var out = gParts.filter(function (p) { return p && p.text && !p.thought; })
                  .map(function (p) { return p.text; }).join("");
  if (!out) {
    var fr = (gCand && gCand.finishReason) ||
             (gData.promptFeedback && gData.promptFeedback.blockReason) || "EMPTY";
    var e = new Error(fr === "MAX_TOKENS"
      ? "The answer ran past its length limit before anything came back."
      : "The AI service returned nothing usable (" + fr + ").");
    e.status = 0; e.why = "empty"; e.finishReason = fr;
    throw e;
  }
  return out;
```

Silence becomes a visible, retryable error, and a multi-part answer arrives
whole.

### P2. The reply is cut off before the actions are written

```js
      var maxTokens = Math.min(body.max_tokens || (isStructured ? 3500 : 1200), 4e3);
```

A coach reply that carries a split change runs past 3500 tokens, so the JSON
envelope arrives unterminated and the app drops every action in it. That is the
main reason a card never appears. Raise the ceiling:

```js
      var maxTokens = Math.min(body.max_tokens || (isStructured ? 3500 : 1200), 16e3);
```

And in `geminiText`, cap the thinking so it cannot eat the whole budget before
the envelope is written:

```js
      if (opts.json) {
        gBody.generationConfig.responseMimeType = "application/json";
        gBody.generationConfig.thinkingConfig = { thinkingBudget: 512 };
      }
```

If the deployed model rejects `thinkingConfig`, drop that line and keep the
raised ceiling.

### P3. No deadline on the call to Google

`geminiFetch` calls `fetch` with no abort signal, and the handler can make up
to six upstream attempts. A slow Gemini holds the request open indefinitely.
Inside the attempt loop:

```js
        res = await fetch(url, Object.assign({}, init, { headers, signal: AbortSignal.timeout(45000) }));
```

### P4. The anonymous limit answers 429

The signed-in gate returns 200 with `gated: true` and the app reads it
correctly. The anonymous one returns 429, and the app discards the body of any
non-2xx, so a spent quota reads as a server refusal. Make it match:

```js
      }), { headers: H });
```

### P5. The readable sentence never reaches the reader

The 500 path puts a plain sentence in `content[0].text` and an internal string
in `error`, and the app reads `error`. Add the sentence where the app looks:

```js
      return new Response(JSON.stringify({
        content: [{ type: "text", text: human }],
        message: human,
        error: why,
        why: (err && err.why) || ""
      }), { status: 500, headers: H });
```

### P6. A malformed request blames the AI service

`await request.json()` sits inside the try, so a bad body becomes a 500 reading
"The AI service could not be reached". Move it out:

```js
      var body;
      try { body = await request.json(); }
      catch (e) {
        return new Response(JSON.stringify({ error: "bad_json", message: "That request was not readable JSON." }), { status: 400, headers: H });
      }
      try {
```

### P7. A fenced envelope gets mangled

`cleanResponse` strips markdown, and it only bails out when the text starts
with `{` or `[`. A reply fenced as ```` ```json ```` runs through the backtick
and bold regexes and comes out corrupt. Add the fence to the bail-out test:

```js
  if (t.startsWith("{") || t.startsWith("[") || t.startsWith("```") || ...
```

### P8. No deploy needed

`GEMINI_MODEL` is read per request. If `/ai-status` reports the model is gone,
set that secret to whatever Google names as the replacement and it takes effect
immediately.

---

## One thing to leave alone

The Worker decides whether to ask Gemini for JSON by looking for the phrase
`"Return ONLY a JSON"` inside the system prompt the app sends:

```js
      var isStructured = systemText.includes("Return ONLY a JSON") || ...
```

The app's prompt begins `Return ONLY a JSON object of this shape and nothing
else:`, which is the only reason JSON mode is on. Reword that sentence in
`redesign/08-build/cloud.js` and the coach silently stops returning structured
answers, and every card stops appearing. There is a comment saying so on the
app side now.
