/* THE WORDS THE APP TELLS THE MODEL TO USE, AND WHETHER IT ACCEPTS THEM.

   The system prompt in cloud.js documents eight action shapes. A probe
   replayed each one exactly as written, and four of the eight were
   refused by the app's own gate: a goal with a title was "a goal with no
   name", a food with protein/carbs/fat was 'the meal: "" is not in the
   food table', a cardio session was "a cardio session with no name", and
   a shopping item sent as qty:3 was written down as 1 kg of it with
   nothing on screen to say so. A recipe ingredient of 200 g became one
   whole serving. The prompt and the gate had been edited by different
   hands and had drifted into two vocabularies, and the visible symptom
   was the one everybody reported: the coach does not use cards.

   So every documented shape is sent here, through the real screen,
   verbatim from the prompt. A card has to be drawn, it has to be
   approvable, and approving it has to change what is stored -- because a
   card that draws and saves nothing is the same failure one step later.

   Three more things measured on the same screen, all from the same
   afternoon: a reply cut off mid-envelope used to lose every action,
   including the ones that arrived whole; the anonymous free-tier limit
   arrives as 429 and read as "The server refused that (429)" instead of
   the sentence the server wrote for the reader; and a request that never
   answered left the coach thinking for ever with the composer dead. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const mirror = await import(path.join(ROOT, 'tests/coach-mirror.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* The stub: whatever `answer` holds is what the coach endpoint says. */
let answer = '';
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type,authorization,apikey',
            'access-control-allow-methods': 'GET,POST,OPTIONS' };
const asked = [];
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const raw = await body(req);
  asked.push(raw ? JSON.parse(raw) : {});
  res.writeHead(200, H);
  res.end(JSON.stringify({ content: [{ type: 'text', text: answer }] }));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

/* THE PAGE IS SERVED OVER HTTP, NOT OPENED FROM DISK. The mirror of the
   deployed Worker answers with the real CORS allow list, and "null" --
   which is the origin of a file:// page -- is not on it. A build opened
   from disk therefore fails every mirror request as a network error and
   hides whatever was being measured. 127.0.0.1 is on the list. */
const files = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404); return res.end('no');
  }
  const type = /\.html?$/.test(full) ? 'text/html'
             : /\.js$/.test(full) ? 'text/javascript'
             : /\.css$/.test(full) ? 'text/css'
             : /\.json$/.test(full) ? 'application/json' : 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  res.end(fs.readFileSync(full));
});
await new Promise((r) => files.listen(0, '127.0.0.1', r));
const PAGE = 'http://127.0.0.1:' + files.address().port + '/10-final/locked-demo.html';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));

async function boot(base, extra) {
  await page.goto(PAGE);
  await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
  await page.evaluate(() => {
    const F = window.LKFixtures;
    localStorage.clear();
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
    localStorage.setItem('lk_history', JSON.stringify(F.history));
    localStorage.setItem('lk_profile', JSON.stringify(F.profile));
  });
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate(([b, x]) => {
    window.LK_CLOUD = Object.assign({ supabaseUrl: b, supabaseKey: 'k', apiUrl: b }, x || {});
  }, [base || BASE, extra || null]);
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(500);
}

async function say(text, reply, wait = 1200) {
  if (reply !== undefined) answer = reply;
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = t; box.dispatchEvent(new Event('input', { bubbles: true }));
    r.querySelector('[data-testid="composer-send"]').click();
  }, text);
  await page.waitForTimeout(wait);
}

/* The cards on the newest reply, as somebody looking at the phone sees
   them: the kind, whether the gate passed it, and the words on it. */
const cards = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const last = [...r.querySelectorAll('.msg')].pop();
  return [...(last ? last.querySelectorAll('.card[data-kind]') : [])].map((c) => ({
    kind: c.dataset.kind, ok: c.dataset.ok === 'true',
    text: c.innerText.replace(/\s+/g, ' ').slice(0, 200)
  }));
});

/* Press the card's own approve button, and the shopping modal's confirm
   behind it -- the shopping list deliberately has a second step. */
async function approve() {
  await page.evaluate(() => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const b = [...r.querySelectorAll('[data-act="act-apply"],[data-act="act-review"]')].pop();
    if (b) b.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const c = r.querySelector('[data-testid="shop-confirm"]');
    if (c) c.click();
  });
  await page.waitForTimeout(500);
}

const stored = (key) => page.evaluate((k) => {
  const raw = localStorage.getItem(k);
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch (e) { return raw; }
}, key);

await boot();
const realId = await page.evaluate(() => window.LKExercises.all()[0].id);
const food = await page.evaluate(() => {
  const t = window.LKFixtures.nutrition.foods;
  const k = Object.keys(t)[1];
  return { key: k, name: t[k].name, g: t[k].g, kcal: t[k].kcal };
});

/* ---- the eight shapes, copied out of BRAIN -------------------------
   Each one is the line from the `Each action is one of:` list with
   plausible values in it. `check` reads what was stored after approving
   and answers whether the right thing landed. */
const VOCAB = [
  ['split', 'lk_splits',
   { kind: 'split', split: { name: 'PPL', days: [{ name: 'Push',
       exercises: [{ id: realId, name: 'Bench', sets: 4, reps: 8 }] }] } },
   (v) => Array.isArray(v) && v.some((r) => r.name === 'PPL' && r.days.length === 1 &&
          r.days[0].exercises.some((e) => e.id === realId))],

  ['goal', 'lk_goals',
   { kind: 'goal', goal: { title: 'Bench 100kg', target: 100, unit: 'kg', by: '2026-12-01' } },
   (v) => Array.isArray(v) && v.some((r) => r.name === 'Bench 100kg' &&
          r.target === 100 && r.targetDate === '2026-12-01')],

  ['recipe', 'lk_coachRecipes',
   { kind: 'recipe', recipe: { name: 'Chicken bowl', servings: 2,
       items: [{ name: food.name, grams: 200 }], steps: ['Cook the rice.', 'Add the chicken.'] } },
   (v) => Array.isArray(v) && v.length && v[0].notes.length === 2 &&
          /* 200 g of a portion the table weighs, not a whole portion. */
          v[0].kcal > 0 && v[0].kcal < food.kcal],

  ['shopping', 'lk_shoppingList',
   { kind: 'shopping', items: [{ name: 'Rice', qty: 3, unit: 'kg' }] },
   (v) => Array.isArray(v) && v.some((r) => r.itemName === 'Rice' && Number(r.quantity) === 3)],

  ['food', 'lk_fuelLog',
   { kind: 'food', food: { name: food.name, kcal: 300, protein: 30, carbs: 20, fat: 8,
                           servings: 1, slot: 'lunch' } },
   (v) => {
     const days = Object.keys(v || {});
     const meals = days.map((d) => v[d].meals || []).reduce((a, b) => a.concat(b), []);
     const mine = meals.filter((m) => m.src === 'coach');
     return mine.length === 1 && mine[0].slot === 'lunch' && mine[0].kcal > 0;
   }],

  ['cardio', 'lk_history',
   { kind: 'cardio', cardio: { name: 'Row', minutes: 30, km: 6 } },
   (v) => Array.isArray(v) && v.some((r) => r.kind === 'cardio' && r.name === 'Row' &&
                                            r.min === 30 && r.km === 6)],

  ['instructions', 'lk_coachInstructions',
   { kind: 'instructions', text: 'Metric only, and no more than four exercises a day.' },
   (v) => typeof v === 'string' && /Metric only/.test(v)],

  ['fact', 'lk_coachMemory',
   { kind: 'fact', text: 'I train five days a week.' },
   (v) => Array.isArray(v) && v.some((r) => /five days a week/.test(r.text || ''))]
];

console.log('=== every shape the prompt documents, drawn and approved ===\n');

for (const [name, key, action, landed] of VOCAB) {
  await boot();
  const was = await stored(key);
  await say('do the thing', JSON.stringify({ reply: 'Here it is.', actions: [action] }));
  const drawn = await cards();
  const card = drawn[0];
  ok(!!card && card.kind === name, 'a ' + name + ' action draws a ' + name + ' card',
     JSON.stringify(drawn.map((c) => c.kind)));
  ok(!!card && card.ok, 'and the gate accepts it as the prompt documents it',
     card ? card.text.slice(0, 120) : '(no card at all)');
  if (!card || !card.ok) continue;
  await approve();
  const now = await stored(key);
  ok(JSON.stringify(now) !== JSON.stringify(was), 'approving it changes what is stored',
     name + ': ' + JSON.stringify(now).slice(0, 90));
  ok(landed(now), 'and what landed is what was sent, field for field',
     JSON.stringify(now).slice(0, 160));
}

/* ---- the older internal spelling still works ------------------------
   The sentinel parser in coach.html builds `meal`, `session` and
   `quantity`, and it is still live. Teaching the gate the prompt's words
   must not have cost it those. */
console.log('\n=== and the spelling the app itself still speaks ===\n');
await boot();
await say('the old way', JSON.stringify({ reply: 'Both.', actions: [
  { kind: 'food', meal: { name: food.name, qty: 1, slot: 'dinner' } },
  { kind: 'cardio', session: { name: 'Bike', minutes: 20 } },
  { kind: 'shopping', items: [{ name: 'Oats', quantity: 2, unit: 'kg' }] }
] }));
const older = await cards();
ok(older.length === 3 && older.every((c) => c.ok),
   'meal, session and quantity are all still accepted',
   JSON.stringify(older.map((c) => c.kind + '/' + c.ok)));

/* ---- a reply that ran out of room ----------------------------------
   The server caps the answer at 4000 tokens and the cap lands in the
   middle of the actions array more often than anywhere else, because the
   actions are the long part. Every card used to go with the one that did
   not finish. */
console.log('\n=== an answer cut off mid-envelope ===\n');
await boot();
const cut =
  '{"reply":"Here is the split and the goal you asked for.","actions":[' +
  JSON.stringify({ kind: 'fact', text: 'I train five days a week.' }) + ',' +
  JSON.stringify({ kind: 'cardio', cardio: { name: 'Row', minutes: 30 } }) + ',' +
  '{"kind":"goal","goal":{"title":"Bench 10';
await say('write me everything', cut);
const salvaged = await cards();
ok(/Here is the split and the goal/.test(await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  return [...r.querySelectorAll('.msg')].pop().innerText;
})), 'the reply itself still reaches the screen');
ok(salvaged.length === 2, 'the two actions that arrived whole are still offered',
   JSON.stringify(salvaged.map((c) => c.kind)));
ok(salvaged.every((c) => c.ok) &&
   salvaged.map((c) => c.kind).join(',') === 'fact,cardio',
   'in the order they were sent, and both approvable',
   JSON.stringify(salvaged.map((c) => c.kind + '/' + c.ok)));
ok(!salvaged.some((c) => c.kind === 'goal'),
   'and the one that was cut off is not offered half-built',
   JSON.stringify(salvaged.map((c) => c.kind)));
await approve();
ok(((await stored('lk_history')) || []).some((r) => r.kind === 'cardio' && r.name === 'Row'),
   'a salvaged card approves and writes like any other',
   JSON.stringify((await stored('lk_history')) || []).slice(0, 90));

/* ---- prose wrapped around the envelope ------------------------------ */
await boot();
await say('how did I do', 'Good week overall. {"reply":"Buried.","actions":[]} Keep it up next week.');
const bubble = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  return [...r.querySelectorAll('.msg')].pop().innerText.replace(/\s+/g, ' ');
});
ok(/Good week overall/.test(bubble) && /Buried/.test(bubble) && /Keep it up/.test(bubble),
   'a reply with prose around the envelope keeps all of it', bubble.slice(0, 140));

/* ---- the free-tier gate --------------------------------------------
   Against the mirror of the deployed Worker, in the mode where an
   anonymous caller is over the limit: 429, with the sentence the reader
   is meant to see sitting in the body. */
console.log('\n=== a spent quota is an answer, not a refusal ===\n');
const gate = await mirror.start({ mode: 'gatedAnon' });
await boot(gate.url);
await say('coach me', undefined, 1500);
const gated = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  return [...r.querySelectorAll('.msg')].pop().innerText.replace(/\s+/g, ' ');
});
ok(/Daily AI limit reached/.test(gated),
   'the sentence the server wrote for the reader is the one on screen', gated.slice(0, 140));
ok(!/refused that/.test(gated), 'not "The server refused that (429)"', gated.slice(0, 140));
await gate.close();

/* ---- a request that never answers ----------------------------------
   The mirror's hang mode accepts the question and says nothing, for
   ever. There was no deadline anywhere, on either side, and this is what
   left the coach thinking at thirty-three seconds with the composer
   dead. The real deadline is ninety seconds; it is shortened here
   through the config rather than faked, so the path under test is the
   one that ships. */
console.log('\n=== and one that never comes back ===\n');
const hang = await mirror.start({ mode: 'hang' });
await boot(hang.url, { timeoutMs: 900 });
await say('are you there', undefined, 2600);
const after = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const send = r.querySelector('[data-testid="composer-send"]');
  const box = r.querySelector('[data-testid="composer-input"]');
  if (box) { box.value = 'again'; box.dispatchEvent(new Event('input', { bubbles: true })); }
  return { text: (r.host.innerText || r.textContent || '').replace(/\s+/g, ' '),
           thinking: !!r.querySelector('[data-testid="msg-thinking"]'),
           sendDisabled: !!(send && send.disabled),
           retry: /msg-retry/.test(r.innerHTML) };
});
ok(/took too long/.test(after.text), 'it gives up and says so in words',
   after.text.slice(-140));
ok(!after.thinking, 'the thinking line is gone');
ok(!after.sendDisabled, 'and the composer works again');
ok(after.retry, 'with Try again under the failure');
await hang.close();

ok(errors.length === 0, 'no page errors throughout', errors.slice(0, 2).join(' | '));

await browser.close();
server.close();
console.log(fails ? '\n' + fails + ' of ' + checks + ' checks FAILED'
                  : '\nall ' + checks + ' checks passed');
process.exit(fails ? 1 : 0);
