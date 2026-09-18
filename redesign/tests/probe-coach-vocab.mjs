/* PROBE: the action vocabulary the app TELLS the model to use, sent back
   verbatim by the server, drawn on the real screen.

   The shapes below are copied character-for-character out of the BRAIN
   block in cloud.js (the `Each action is one of:` list) with plausible
   values filled in. A model that obeys the system prompt exactly sends
   these. Throwaway investigation script — not registered in gate.sh. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let answer = '';
const asked = [];
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type,authorization,apikey',
            'access-control-allow-methods': 'GET,POST,OPTIONS' };
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const raw = await body(req);
  asked.push(raw ? JSON.parse(raw) : {});
  res.writeHead(200, H); res.end(JSON.stringify({ content: [{ type: 'text', text: answer }] }));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.evaluate(() => {
  const F = window.LKFixtures;
  localStorage.clear();
  localStorage.setItem('lk_onboarded', 'true'); localStorage.setItem('lk_tutorialSeen', 'true');
  const put = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  put('lk_history', F.history); put('lk_profile', F.profile);
  put('lk_fuelTargets', F.nutrition.targets); put('lk_fuelLog', F.nutrition.days);
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(600);
const realId = await page.evaluate(() => (window.LKExercises ? window.LKExercises.all()[0].id : 1));
/* A food that IS in the app's own table, so the recipe/food cases fail
   for the schema and not for an unknown ingredient. */
const realFood = await page.evaluate(() => {
  const t = window.LKFixtures.nutrition.foods; const k = Object.keys(t)[0];
  return { key: k, name: t[k].name };
});
console.log('a real catalogue id:', realId, ' a real food:', JSON.stringify(realFood));

async function say(text, reply, wait = 1400) {
  answer = reply;
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(300);
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = t; box.dispatchEvent(new Event('input', { bubbles: true }));
    r.querySelector('[data-testid="composer-send"]').click();
  }, text);
  await page.waitForTimeout(wait);
}
const lastCards = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const msgs = [...r.querySelectorAll('.msg')];
  const last = msgs[msgs.length - 1];
  return [...(last ? last.querySelectorAll('.card[data-kind]') : [])].map((c) => ({
    kind: c.dataset.kind, ok: c.dataset.ok, text: c.innerText.replace(/\n+/g, ' | ').slice(0, 260) }));
});

/* Exactly the eight shapes the system prompt documents. */
const VOCAB = [
  ['split', { kind: 'split', split: { name: 'PPL', days: [{ name: 'Push',
      exercises: [{ id: realId, name: 'Bench', sets: 4, reps: 8 }] }] } }],
  ['goal', { kind: 'goal', goal: { title: 'Bench 100kg', target: 100, unit: 'kg', by: '2026-12-01' } }],
  ['recipe', { kind: 'recipe', recipe: { name: 'Chicken bowl', servings: 2,
      items: [{ name: realFood.name, grams: 200 }], steps: ['Cook it.'] } }],
  ['shopping', { kind: 'shopping', items: [{ name: 'Rice', qty: 3, unit: 'kg' }] }],
  ['food', { kind: 'food', food: { name: realFood.name, kcal: 300, protein: 30, carbs: 20, fat: 8, servings: 1 } }],
  ['cardio', { kind: 'cardio', cardio: { name: 'Row', minutes: 30, km: 6 } }],
  ['instructions', { kind: 'instructions', text: 'Metric only.' }],
  ['fact', { kind: 'fact', text: 'I train five days a week.' }]
];

console.log('\n=== each action shape EXACTLY as the system prompt documents it ===');
for (const [name, act] of VOCAB) {
  await page.evaluate(() => localStorage.removeItem('lk_coachLastMsgs'));
  await say('do the thing', JSON.stringify({ reply: 'Here.', actions: [act] }));
  const c = (await lastCards())[0] || { kind: '(no card)', ok: '-', text: '(nothing drawn)' };
  console.log('\n  ' + name.toUpperCase() + '  -> ok=' + c.ok);
  console.log('    sent: ' + JSON.stringify(act));
  console.log('    SCREEN: ' + c.text);
}

/* ---- and now: what actually goes up the wire ---- */
console.log('\n\n=== THE OUTGOING REQUEST ===');
const last = asked[asked.length - 1];
console.log('top-level keys: ' + JSON.stringify(Object.keys(last)));
console.log('messages: ' + JSON.stringify(last.messages));
const sys = last.system || '';
console.log('system prompt length: ' + sys.length);
const after = sys.indexOf('What you know about them:');
console.log('\n--- everything after "What you know about them:" ---');
console.log(after < 0 ? '(THE PHRASE IS ABSENT — no per-person data went up at all)' : sys.slice(after));
console.log('\n--- other appended context ---');
['Today is', 'The voice they picked', 'exercise catalogue', 'Standing instructions', 'What you have told you before', 'What they have told you before']
  .forEach((k) => console.log('  ' + JSON.stringify(k) + ': ' + (sys.indexOf(k) >= 0 ? 'present' : 'ABSENT')));

await browser.close(); server.close();
