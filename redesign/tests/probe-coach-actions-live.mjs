/* PROBE: one action of each kind, delivered by a server, drawn on the
   real screen, approved, and the underlying storage read back.
   Throwaway investigation script — not registered in gate.sh. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let answer = '';
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type,authorization,apikey',
            'access-control-allow-methods': 'GET,POST,OPTIONS' };
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  await body(req);
  res.writeHead(200, H); res.end(JSON.stringify({ content: [{ type: 'text', text: answer }] }));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));
await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.evaluate(() => {
  const F = window.LKFixtures;
  localStorage.clear();
  localStorage.setItem('lk_onboarded', 'true');
  localStorage.setItem('lk_tutorialSeen', 'true');
  const put = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  put('lk_history', F.history); put('lk_profile', F.profile); put('lk_goals', F.goals);
  put('lk_fuelTargets', F.nutrition.targets); put('lk_fuelLog', F.nutrition.days);
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);

/* Which exercise ids actually exist in this build, so the split is a
   realistic one rather than a refusal about the catalogue. */
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(600);
const cat = await page.evaluate(() => {
  const C = window.LKCoachActions;
  return { have: C && C.haveCatalogue && C.haveCatalogue(),
           some: (window.LKExercises ? window.LKExercises.all() : []).slice(0, 3)
                  .map((e) => ({ id: e.id, name: e.name })) };
});
console.log('catalogue loaded on the coach screen:', JSON.stringify(cat));

async function say(text, reply, wait = 1500) {
  answer = reply;
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(350);
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = t; box.dispatchEvent(new Event('input', { bubbles: true }));
    r.querySelector('[data-testid="composer-send"]').click();
  }, text);
  await page.waitForTimeout(wait);
}
const cards = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  return [...r.querySelectorAll('.card[data-kind]')].map((c) => ({
    kind: c.dataset.kind, ok: c.dataset.ok, applied: c.dataset.applied || 'false',
    testid: c.dataset.testid, text: c.innerText.replace(/\n+/g, ' | ').slice(0, 240)
  }));
});
const keys = () => page.evaluate(() => {
  const g = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return localStorage.getItem(k); } };
  return { splits: (g('lk_splits') || []).map((s) => s.name), goals: (g('lk_goals') || []).length,
    recipes: (g('lk_recipes') || []).length, shopping: (g('lk_shoppingList') || []).length,
    customFoods: Object.keys(g('lk_customFoods') || {}).length,
    cardio: (g('lk_cardioLog') || []).length,
    instructions: g('lk_coachInstructions'), memory: (g('lk_coachMemory') || []).length };
});

const A = (id) => ([
  { kind: 'split', split: { name: 'Coach PPL', days: [
      { name: 'Push', exercises: [{ id: id, sets: 4, reps: 8 }] },
      { name: 'Pull', exercises: [{ id: id, sets: 3, reps: 10 }] }] } },
  { kind: 'goal', goal: { title: 'Bench 100kg', type: 'lift', name: 'Bench 100kg', target: 100, unit: 'kg', by: '2026-12-01', targetDate: '2026-12-01' } },
  { kind: 'recipe', recipe: { name: 'Coach Chicken Rice', servings: 2, items: [{ name: 'Chicken breast', grams: 300 }, { name: 'Rice', grams: 200 }], steps: ['Cook it.'] } },
  { kind: 'shopping', items: [{ name: 'Chicken breast', qty: 1, unit: 'kg' }, { name: 'Rice', qty: 2, unit: 'kg' }] },
  { kind: 'food', food: { name: 'Coach Shake', kcal: 320, protein: 40, carbs: 30, fat: 5, servings: 1 } },
  { kind: 'cardio', cardio: { name: 'Zone 2 row', minutes: 30, km: 6 } },
  { kind: 'instructions', text: 'Always give me metric.' },
  { kind: 'fact', text: 'I train five days a week.' }
]);

console.log('\nBEFORE:', JSON.stringify(await keys()));
const id = cat.some[0] ? cat.some[0].id : 1;
await say('build me everything', JSON.stringify({ reply: 'Here is the lot.', actions: A(id) }), 2000);
console.log('\n=== CARDS DRAWN ===');
for (const c of await cards()) console.log(' ', JSON.stringify(c));

/* Approve every card that offers approval. */
const ids = (await cards()).filter((c) => c.ok === 'true').map((c) => c.testid);
for (const t of ids) {
  const clicked = await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const b = r.querySelector('[data-testid="' + t + '-apply"]');
    if (!b) return 'no apply button';
    b.click(); return 'clicked';
  }, t);
  await page.waitForTimeout(500);
  console.log('approve ' + t + ': ' + clicked);
}
await page.waitForTimeout(800);
console.log('\n=== CARDS AFTER APPROVAL ===');
for (const c of await cards()) console.log(' ', JSON.stringify(c));
console.log('\nAFTER:', JSON.stringify(await keys()));

/* And does it survive a reload the way the reader's own data does? */
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(800);
console.log('\nAFTER RELOAD:', JSON.stringify(await keys()));
console.log('CARDS AFTER RELOAD:');
for (const c of await cards()) console.log(' ', JSON.stringify(c));

console.log('\nERRORS: ' + JSON.stringify(errors, null, 1));
await browser.close(); server.close();
