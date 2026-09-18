/* THE DEPLOYED COACH WORKER, STOOD UP ON LOCALHOST, QUIRKS AND ALL.

   The coach is unreliable in the field -- it sometimes says nothing, and
   when it does speak it rarely offers a card. Every explanation for that
   lives in the Worker at lockedapi.cescocugliari.workers.dev, and the
   Worker cannot be reached from a test run: no staging copy, no way to
   make it fail on purpose, no way to watch what the app does when it
   does fail. So the failures are brought here instead.

   This file is a faithful mirror of the fallback POST handler of the
   deployed bundle, read off Cloudflare rather than out of the repo --
   redesign/15-server/coach-worker.js is a different program that is not
   what serves the app. Mirrored exactly, including the parts that are
   wrong: the response is { content: [ { type, text } ] } and nothing
   else; the anonymous gate answers 429 with a body the client's post()
   throws away before it ever looks for `gated`; the error path returns
   500 with a readable sentence in `content` that, for the same reason,
   nobody sees; cleanResponse strips markdown from anything that does not
   open with a brace; and geminiText reads candidates[0].content.parts[0]
   and no further, so a reply that arrives in two parts arrives as half a
   reply. Faithful means faithful. Do not tidy these up here -- fix them
   on the Worker, then change this file to match.

   The upstream model is not mirrored, because the point is not to answer
   well. It is replaced by a switch: each mode produces one shape of
   Gemini response or one failure, so a screen can be driven into the
   state a reader complained about and watched.

   Run it:
     node coach-mirror.mjs --port 8787 --mode ok
     node coach-mirror.mjs --list

   The mode can also be set per request, which is what a test wants:
     ?mode=empty on the URL, or an x-mirror-mode header.

   Point the app at it with apiUrl: 'http://127.0.0.1:8787' -- the client
   posts to apiUrl + '/', the Worker strips the trailing slash, and the
   fallback handler is what answers. That is the whole coach route.
   =================================================================== */
import http from 'node:http';

/* ---- the modes ----------------------------------------------------
   Each names one way the deployed route behaves, and says what the
   reader ends up looking at. The first is the happy one. */
const MODES = {
  ok:
    'A well-formed envelope: a reply and one action. What the app was built for.',
  empty:
    'Gemini returns a candidate with no parts -- MAX_TOKENS spent on thinking, or a ' +
    'safety stop. geminiText yields "", the Worker answers 200 with text:"". The ' +
    'screen shows "That answer came back empty."',
  noCandidates:
    'Gemini returns promptFeedback.blockReason and no candidates at all. Same ""..',
  thought:
    'A thinking model puts its reasoning in parts[0] and the answer in parts[1]. ' +
    'The Worker reads parts[0] only, so the reader gets the reasoning and no card.',
  splitParts:
    'The JSON envelope arrives split across two parts. parts[0] is half an object, ' +
    'so the client cannot parse it: the reply is salvaged by regex and the actions ' +
    'are dropped. The coach talks; no card appears.',
  truncated:
    'finishReason MAX_TOKENS mid-envelope at the 3500-token cap. Same outcome as ' +
    'splitParts and the commonest one, because a seven-day split is long.',
  prose:
    'The model ignores the JSON instruction and writes prose. cleanResponse strips ' +
    'the markdown, the client finds no envelope, the whole answer becomes the reply ' +
    'and there are no actions.',
  fencedJson:
    'The envelope comes back inside a ```json fence, so it does not open with a ' +
    'brace, so cleanResponse runs its markdown regexes over the JSON and mangles it.',
  gatedAuth:
    'A signed-in free account past ten chats. 200, gated:true, limit:{used,max}. ' +
    'This one the client reads correctly.',
  gatedAnon:
    'No JWT and past forty requests from this IP. 429 with a gated body -- and ' +
    'post() takes the !ok branch, so the sentence in content is never shown and the ' +
    'reader gets "The server refused that (429)."',
  modelGone:
    'Gemini 404s the model id. Outer catch, 500, "The AI model this app uses was retired."',
  keyRefused:
    'The Google key is blocked for the Generative Language API. 500, key-refused sentence.',
  rateLimited:
    'Gemini 429s twice -- the handler retries once and the second throw escapes. 500.',
  hang:
    'The request is accepted and never answered. There is no timeout anywhere on ' +
    'either side, so the screen sits on "thinking" until the person gives up.',
  slow:
    'Answers after the full retry ladder has run: ~45s. Same symptom, eventually resolved.',
  badJson:
    'A request body that is not JSON. await request.json() throws inside the try, so ' +
    'the outer catch turns a client mistake into a 500 about the AI service.',
  corsReject:
    'The Origin is not on the allow list, so the header names a different origin and ' +
    'the browser drops the response. The app reports a network failure.'
};

/* ---- the CORS allow list, as deployed ------------------------------ */
const DEFAULT_ORIGINS = [
  'https://locked-seven.vercel.app',
  'https://locked-v7.vercel.app',
  'https://locked-lockeddevteam-9159s-projects.vercel.app',
  'https://locked-v7-lockeddevteam-9159s-projects.vercel.app',
  'https://polite-gaufre-9f970e.netlify.app',
  'https://inspiring-frangollo-306a23.netlify.app'
];

function corsFor(origin, reject) {
  const isPreview = /^https:\/\/locked[a-z0-9-]*-lockeddevteam-9159s-projects\.vercel\.app$/.test(origin);
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowed = !reject && (DEFAULT_ORIGINS.indexOf(origin) !== -1 || isPreview || isLocal);
  return allowed ? origin : DEFAULT_ORIGINS[0];
}

/* ---- cleanResponse, copied from the bundle -------------------------
   Byte for byte, because the bug in it -- markdown regexes running over
   a fenced JSON envelope -- is one of the things under test. */
function cleanResponse(text) {
  if (!text) return text;
  const t = text.trim();
  if (t.startsWith('{') || t.startsWith('[') ||
      t.includes('###RECIPE_START###') || t.includes('###SHOPPING_ADD###') ||
      t.includes('###WORKOUT_START###') || t.includes('###FOOD_START###') ||
      t.includes('###PLAN_START###') || t.includes('###GOAL_START###') ||
      t.includes('###PROGRAM_START###') || t.includes('###CARDIO_START###')) return text;
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^(\d+)\.\s+/gm, '$1. ')
    .replace(/^---+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ---- the reply the good path produces ------------------------------ */
const ENVELOPE = {
  reply: 'Two more sets on the last one, then call it. You moved more than last Tuesday.',
  actions: [{ kind: 'fact', title: 'Trains five days', text: 'You train five days a week.' }]
};
const ENVELOPE_TEXT = JSON.stringify(ENVELOPE);

/* geminiText, as deployed: the first part of the first candidate, or the
   empty string. Everything a real Gemini response can carry that this
   drops is dropped here too. */
function firstPartText(candidateParts) {
  const p = candidateParts && candidateParts[0];
  return (p && p.text) || '';
}

class UpstreamError extends Error {
  constructor(message, status, keyRefused) {
    super(message);
    this.status = status || 0;
    this.keyRefused = !!keyRefused;
  }
}

/* The fake upstream. Returns the text geminiText would have returned, or
   throws what geminiError would have thrown. */
async function fakeGemini(mode) {
  switch (mode) {
    case 'empty':
      /* candidates[0].content has no parts. */
      return firstPartText(undefined);
    case 'noCandidates':
      return firstPartText(undefined);
    case 'thought':
      return firstPartText([
        { text: 'The user asked about sleep. I should check their last session and ' +
                'their weigh-ins before I answer, then keep it to three sentences.',
          thought: true },
        { text: ENVELOPE_TEXT }
      ]);
    case 'splitParts':
      return firstPartText([
        { text: '{"reply":"Two more sets on the last one, then call it.' },
        { text: '","actions":[{"kind":"fact","text":"You train five days a week."}]}' }
      ]);
    case 'truncated':
      return firstPartText([{ text:
        '{"reply":"Here is the four-day split you asked for.","actions":[{"kind":"split",' +
        '"split":{"name":"Upper Lower","days":[{"name":"Upper A","exercises":[' +
        '{"id":12,"name":"Barbell Bench Press","sets":4,"reps":6},' +
        '{"id":88,"name":"Barbell Row","sets":4,"reps":8},' +
        '{"id":140,"name":"Seated Dumbbell Shoulder Pr' }]);
    case 'prose':
      return firstPartText([{ text:
        '## Sleep and training\n\n' +
        '**Seven hours is enough** to train on. Here is what I would do:\n\n' +
        '- Keep the session, cut one set per exercise\n' +
        '- Hold the load where it was\n\n' +
        'You can read more at [the note](https://example.invalid/sleep).' }]);
    case 'fencedJson':
      return firstPartText([{ text: '```json\n' + JSON.stringify(ENVELOPE, null, 2) + '\n```' }]);
    case 'modelGone':
      throw new UpstreamError(
        'The AI service no longer offers the model this server asks for. It needs updating on the server.',
        404, false);
    case 'keyRefused':
      throw new UpstreamError(
        "The server's Google key is not set up to call the AI service, so this cannot run. " +
        'Nothing to do with what you sent.', 403, true);
    case 'rateLimited':
      throw new UpstreamError('The AI service is out of requests for the moment. Try again shortly.', 429, false);
    case 'slow':
      await new Promise((r) => setTimeout(r, 45000));
      return ENVELOPE_TEXT;
    case 'hang':
      return new Promise(() => {});
    default:
      return firstPartText([{ text: ENVELOPE_TEXT }]);
  }
}

/* ---- the handler ---------------------------------------------------
   The deployed fetch(): normalise the path, answer OPTIONS, refuse a
   non-POST, then the fallback try block. Nothing here reads a `context`
   field or a `model` field, because the Worker does not either. */
function makeServer(defaultMode) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://mirror.invalid');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const mode = url.searchParams.get('mode') || req.headers['x-mirror-mode'] || defaultMode;
    const origin = req.headers.origin || '';
    const corsOrigin = corsFor(origin, mode === 'corsReject');

    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin'
      });
      return res.end();
    }

    const H = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin,
      'Vary': 'Origin'
    };
    const send = (status, obj) => { res.writeHead(status, H); res.end(JSON.stringify(obj)); };

    /* The deployed Worker routes about thirty named paths before this
       point. None of them is the coach: the coach is what is left. */
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      return res.end('Method not allowed');
    }
    if (path !== '/') {
      /* A named route this mirror does not carry. Say so plainly rather
         than answering as the coach, which would hide a client that is
         posting to the wrong place. */
      return send(404, { error: 'coach-mirror carries only the fallback POST /' });
    }

    let raw = '';
    for await (const chunk of req) raw += chunk;

    try {
      /* Inside the try, exactly as deployed -- which is why a malformed
         body comes back as a 500 about the AI service. */
      const body = mode === 'badJson' ? JSON.parse('not json') : JSON.parse(raw);

      const authHeader = req.headers.authorization || '';
      if (authHeader && mode === 'gatedAuth') {
        return send(200, {
          content: [{ type: 'text', text: "You've used your 10 daily AI chats. Upgrade to Pro for unlimited coaching." }],
          gated: true,
          limit: { used: 10, max: 10 }
        });
      }
      if (!authHeader && mode === 'gatedAnon') {
        /* 429, not 200. This is the quirk. */
        return send(429, {
          content: [{ type: 'text', text: 'Daily AI limit reached. Create an account for more.' }],
          gated: true
        });
      }

      const messages = [];
      if (body.system) messages.push({ role: 'system', content: body.system });
      if (body.messages) {
        body.messages.forEach((m) => {
          messages.push({ role: m.role, content: m.content, image: m.image || null });
        });
      }

      const systemText = body.system || '';
      const firstUserMsg = (body.messages && body.messages[0] && body.messages[0].content) || '';
      const isStructured =
        systemText.includes('Return ONLY a JSON') || systemText.includes('Return ONLY valid JSON') ||
        systemText.includes('Return ONLY raw JSON') || systemText.includes('raw JSON array only') ||
        systemText.includes('No explanation, no markdown, raw JSON') ||
        firstUserMsg.includes('Return ONLY a JSON') || firstUserMsg.includes('Return ONLY valid JSON');
      const maxTokens = Math.min(body.max_tokens || (isStructured ? 3500 : 1200), 4000);
      const temperature = isStructured ? 0.3 : 0.75;

      /* What the real handler would have sent upstream, for a test that
         wants to assert on it. Never part of the response. */
      lastRequest = { messages, isStructured, maxTokens, temperature,
                      images: messages.filter((m) => m.image).length };

      let text;
      try {
        text = await fakeGemini(mode);
      } catch (gErr) {
        /* One retry, and only for a rate limit. A refused key is not
           retried; anything else is rethrown as it stands. */
        const retryable = gErr.keyRefused ? false
          : gErr.status ? gErr.status === 429
          : /\b429\b|rate|quota/i.test(String(gErr.message || gErr));
        if (!retryable) throw gErr;
        text = await fakeGemini(mode);
      }

      text = cleanResponse(text);
      return send(200, { content: [{ type: 'text', text }] });
    } catch (err) {
      const why = String((err && err.message) || '');
      const st = err && typeof err.status === 'number' ? err.status : 0;
      const human =
        /model_not_found|decommission|does not exist|no longer offers/i.test(why)
          ? 'The AI model this app uses was retired. It should recover on its own shortly.'
        : err && err.keyRefused
          ? "The server's Google key is not allowed to call Gemini, so the coach cannot answer. Nothing to do with anything you did."
        : st === 429 || /rate|quota|429/i.test(why)
          ? 'The AI service is rate limited right now. Try again in a minute.'
        : st === 401 || st === 403 || /api key|unauthor|401|403|invalid/i.test(why)
          ? 'The AI service rejected this app’s credentials. Nothing you can do from here.'
        : 'The AI service could not be reached. Check your connection and try again.';
      /* 500 with a readable sentence in `content` -- which the client's
         post() never reaches, because it branches on r.ok first. */
      return send(500, { content: [{ type: 'text', text: human }], error: why, gemini: undefined });
    }
  });
}

/* The last request the mirror accepted, so a test can assert that the
   system prompt and the images actually arrived. */
export let lastRequest = null;

export function start(opts) {
  opts = opts || {};
  const server = makeServer(opts.mode || 'ok');
  return new Promise((resolve) => {
    server.listen(opts.port || 0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port, url: 'http://127.0.0.1:' + port,
                close: () => new Promise((r) => server.close(r)),
                get lastRequest() { return lastRequest; } });
    });
  });
}

/* ---- run it on its own --------------------------------------------- */
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('coach-mirror.mjs');
if (invokedDirectly) {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => {
    const i = argv.indexOf('--' + name);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  if (argv.includes('--list')) {
    console.log('Modes the mirror can be put into:\n');
    Object.keys(MODES).forEach((k) => {
      console.log('  ' + k.padEnd(13) + MODES[k].replace(/\s+/g, ' '));
      console.log('');
    });
    process.exit(0);
  }
  const mode = arg('mode', 'ok');
  if (!MODES[mode]) {
    console.error('No such mode: ' + mode + '. Try --list.');
    process.exit(1);
  }
  const { url } = await start({ port: Number(arg('port', 8787)), mode });
  console.log('coach mirror on ' + url + ', mode ' + mode);
  console.log(MODES[mode].replace(/\s+/g, ' '));
  console.log('Per-request override: ?mode=<name> or an x-mirror-mode header.');
}
