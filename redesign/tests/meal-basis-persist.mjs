/* THE WEIGHT HAS TO SURVIVE BEING SAVED.

   addMeal stores what you logged and the per-100 g row it was scaled
   from. saveDay then rebuilt each meal by hand, field by field, and
   quietly left out `g`, `per100`, `unit` and `pantry`. day() did the
   same on the way back in. So the weight was destroyed the instant it
   was written down, surviving only as words inside the name.

   What that cost is the whole point of the editor. Its dial, its unit
   switch and all of its re-weighing arithmetic hang off per100, so after
   one save there was NO WAY TO CHANGE THE AMOUNT of anything you had
   logged -- the sheet opened with a name, four figures and nothing to
   turn. `pantry` going with it broke putting stock back when a meal is
   deleted, which is the only reason addMeal stores it.

   Nothing caught it because the editor's own suite logs a meal and edits
   it in the same breath, off the in-memory object, and never reloads.
   This one reloads, which is the only way the bug is visible at all. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/food-search') === 0) {
    r.writeHead(200, cors);
    r.end(JSON.stringify({ items: [{ name: 'Chicken breast, raw', src: 'usda',
      cal: 165, pro: 31, carb: 0, fat: 3.6, fibre: 0.4, sugar: 0.2, satfat: 1.1, sodium: 74 }] }));
    return;
  }
  r.writeHead(200, cors); r.end('{}');
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const API = 'http://127.0.0.1:' + api.address().port;

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' });
  r.end(await readFile(path.join(ROOT, '10-final/locked-app.html')));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
  isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('lk_onboarded', 'true');
        localStorage.setItem('lk_tutorialSeen', 'true'); } catch (e) {}
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

const boot = async () => {
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens.fuel, null, { timeout: 20000 });
  await page.evaluate((c) => { window.LK_CLOUD = c; }, { supabaseUrl: API, supabaseKey: 'a', apiUrl: API });
  await page.evaluate(() => window.LKGo('fuel'));
  await page.waitForTimeout(900);
};
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await boot();

const click = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i); el.click();
}, id);
const waitFor = (id, ms = 12000) => page.waitForFunction((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id, { timeout: ms });
const type = (id, v) => page.evaluate(([i, x]) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  el.value = x; el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [id, v]);

/* Log 200 g of something with a database row behind it. Said rather
   than searched: the box that used to do this is gone, and the weight
   now rides in the sentence instead of being dialled in afterwards. */
await click('log-type'); await waitFor('mic-text');
await type('mic-text', '200 g chicken breast');
await waitFor('mic-preview');
await page.waitForFunction(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-confirm"]');
  return el && !el.disabled;
}, null, { timeout: 15000 });
await click('mic-confirm'); await page.waitForTimeout(700);

console.log('=== what reaches storage ===\n');

/* The store is written a beat after the click, so a fixed pause is a
   race: this read the day while the entry was there and its basis was
   not, and reported the basis missing. Waited on instead. */
await page.waitForFunction(() => {
  const raw = JSON.parse(localStorage.getItem('lk_fuelLog') || '{}');
  const days = Object.keys(raw);
  const m = ((raw[days[days.length - 1]] || {}).meals || [])[0];
  return !!(m && m.g > 0 && m.per100);
}, null, { timeout: 12000 });

const stored = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('lk_fuelLog') || '{}');
  const days = Object.keys(raw);
  const m = ((raw[days[days.length - 1]] || {}).meals || [])[0] || {};
  return { g: m.g, per100: m.per100 ? Object.keys(m.per100).length : 0, unit: m.unit, name: m.name };
});
ok(stored.g > 0, 'the weight is written down, not only spelled into the name',
   'g=' + stored.g);
ok(stored.per100 > 0, 'and the per-100 g row it was scaled from',
   stored.per100 + ' fields');

console.log('\n=== and survives a reload ===\n');

await page.reload();
await boot();

await click('meal-0'); await waitFor('sheet-meal');
await click('meal-open-edit'); await page.waitForTimeout(800);

const editor = await page.evaluate(() => {
  const r = window.DEMO.screens.fuel.root;
  return {
    dial: !!r.querySelector('[data-testid="me-dial"] .dial__face'),
    units: !!r.querySelector('[data-testid="me-units"]'),
    value: (r.querySelector('[data-testid="me-dial-value"]') || {}).textContent,
    pro: (r.querySelector('#me-pro') || {}).value,
    kcal: (r.querySelector('#me-kcal') || {}).value
  };
});
ok(editor.dial, 'the editor still has its dial after a reload');
ok(editor.units, 'and its unit switch');
ok(editor.value === '200', 'opened on the weight that was logged', editor.value);

/* And it still re-weighs: double the amount, double the figures. */
await page.evaluate(() => {
  const sl = window.DEMO.screens.fuel.root
    .querySelector('[data-testid="me-dial"] input[type=range]');
  sl.value = '400'; sl.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(600);
const after = await page.evaluate(() => {
  const r = window.DEMO.screens.fuel.root;
  return { pro: (r.querySelector('#me-pro') || {}).value,
           kcal: (r.querySelector('#me-kcal') || {}).value };
});
ok(Math.abs(Number(after.pro) - Number(editor.pro) * 2) < 1.5,
   'and doubling the weight doubles the protein',
   editor.pro + ' -> ' + after.pro);
ok(Math.abs(Number(after.kcal) - Number(editor.kcal) * 2) < 6,
   'and the energy with it', editor.kcal + ' -> ' + after.kcal);

console.log('\n=== an older entry, with no row ever stored ===\n');

/* Exactly the shape an earlier build left behind: a weight and figures,
   no per100. The rate is recoverable from those two, so the editor is
   not left without a control. */
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('lk_fuelLog') || '{}');
  const k = Object.keys(raw)[Object.keys(raw).length - 1];
  raw[k].meals = [{ name: 'Old entry, 100 g', icon: '🍽️', at: '09:00', slot: 'breakfast',
                    g: 100, kcal: 200, pro: 20, carb: 10, fat: 8, src: 'usda' }];
  localStorage.setItem('lk_fuelLog', JSON.stringify(raw));
});
await page.reload();
await boot();
await click('meal-0'); await waitFor('sheet-meal');
await click('meal-open-edit'); await page.waitForTimeout(800);
const old = await page.evaluate(() => {
  const r = window.DEMO.screens.fuel.root;
  return { dial: !!r.querySelector('[data-testid="me-dial"] .dial__face'),
           value: (r.querySelector('[data-testid="me-dial-value"]') || {}).textContent };
});
ok(old.dial, 'an entry that never stored a row still gets a dial',
   'value ' + old.value);

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close(); api.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
