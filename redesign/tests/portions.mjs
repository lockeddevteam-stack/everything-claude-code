/* SEVEN OUNCES, AND A THIRD OF A BAGUETTE.

   Every row a food database returns is per 100 g, and that is what got
   logged. A search for chicken breast logged 100 g of chicken breast
   whatever you actually ate, because the portion control was only ever
   drawn on rows that were already in the shipped table -- and a row that
   came back from USDA is not one of those. So the one kind of food you
   have to search for was the one kind you could not weigh.

   Three units here, because those are the three ways people say it.
   Grams for a scale. Ounces for the same scale elsewhere. Servings for
   the things nobody weighs, where the serving weight is the one figure a
   database cannot supply -- no table knows what one baguette weighs --
   so it is said once and kept against that food's name.

   What is checked: that the figures scale, that a fraction is read as a
   number, that switching units does not lose the amount, that the logged
   row says what you ate rather than the arithmetic, and that a serving
   weight is still there the next time. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP = path.join(ROOT, '10-final/locked-app.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* A food database that answers with two real foods, per 100 g. */
const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/food-search') === 0) {
    r.writeHead(200, cors);
    r.end(JSON.stringify({ items: [
      { name: 'Chicken breast, raw', brand: '', type: 'Generic', src: 'usda',
        cal: 165, pro: 31, carb: 0, fat: 3.6 },
      { name: 'French baguette', brand: '', type: 'Generic', src: 'off',
        cal: 274, pro: 9, carb: 55, fat: 1.4 }
    ] }));
    return;
  }
  r.writeHead(200, cors); r.end('{}');
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const API = 'http://127.0.0.1:' + api.address().port;

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' }); r.end(await readFile(APP));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
  isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
  } catch (e) {}
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens && window.DEMO.screens.fuel,
                           null, { timeout: 15000 });
await page.evaluate((c) => { window.LK_CLOUD = c; }, { supabaseUrl: API, supabaseKey: 'a', apiUrl: API });
await page.waitForTimeout(400);

const R = 'window.DEMO.screens.fuel.root';
const click = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i); el.click();
}, id);
const has = (id) => page.evaluate((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id);
const text = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  return el ? el.textContent.trim() : '(none)';
}, id);
const fill = async (id, v) => page.evaluate(([i, val]) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [id, v]);
const waitFor = (id, ms = 10000) => page.waitForFunction((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id, { timeout: ms });

/* The shipped table answers first and the database's rows come after, so
   a row is found by its name rather than by its position. */
const hitIndex = (name) => page.evaluate((want) => {
  const root = window.DEMO.screens.fuel.root;
  const rows = root.querySelectorAll('[data-testid^="search-hit-"]');
  for (const r of rows) {
    if (r.textContent.indexOf(want) > -1) {
      return +r.getAttribute('data-testid').replace('search-hit-', '');
    }
  }
  return -1;
}, name);
const mealRow = (name) => page.evaluate((want) => {
  const root = window.DEMO.screens.fuel.root;
  const rows = root.querySelectorAll('[data-testid^="meal-"]');
  for (const r of rows) {
    const t = r.textContent.replace(/\s+/g, ' ').trim();
    if (t.indexOf(want) > -1) return t;
  }
  return '(not logged)';
}, name);

async function search(term) {
  await click('log-search');
  await waitFor('search-input');
  await fill('search-input', term);
  await page.waitForFunction(() =>
    !!window.DEMO.screens.fuel.root.querySelector('[data-testid="food-detail-0"]'),
    null, { timeout: 12000 });
}

console.log('=== a searched food can be weighed at all ===\n');

await search('chicken breast');
const iChicken = await hitIndex('Chicken breast, raw');
ok(iChicken > -1 && await has('food-detail-' + iChicken),
   'a row from a database offers the portion control', 'index ' + iChicken);
await click('food-detail-' + iChicken);
await waitFor('sheet-portion');
ok(await has('pt-unit-oz'), 'and it offers ounces, not only grams');

console.log('\n=== seven ounces of chicken breast ===\n');

await click('pt-unit-oz');
await fill('pt-amount', '7');
await page.waitForTimeout(150);
/* 7 oz is 198.4 g. At 165 kcal per 100 g that is 327 kcal. */
const kcal7 = await text('pt-kcal');
ok(kcal7.indexOf('327') > -1, 'the energy is what seven ounces of it is', kcal7);
const btn = await text('pt-log');
ok(btn.indexOf('7 oz') > -1, 'and the button says seven ounces, not 198 grams', btn);

await click('pt-log');
await page.waitForTimeout(400);
const row = await mealRow('Chicken breast, raw');
ok(row.indexOf('7 oz') > -1, 'the logged row says what was eaten', row);
ok(row.indexOf('327') > -1, 'with the figures for that much of it', row);

console.log('\n=== a third of a baguette ===\n');

await search('french baguette');
const iBag = await hitIndex('French baguette');
await click('food-detail-' + iBag);
await waitFor('sheet-portion');
await click('pt-unit-serv');
await waitFor('pt-serving');
ok(true, 'servings asks what one of them weighs');

/* A baguette is about 250 g. Nobody's database knows that, so it is
   said once here. A third of it is 83 g, which at 274 kcal per 100 g
   is 228 kcal. */
await fill('pt-serving', '250');
await fill('pt-amount', '1/3');
await page.waitForTimeout(200);
const kcalThird = await text('pt-kcal');
ok(kcalThird.indexOf('228') > -1, 'a third is read as a third, not as one',
   kcalThird);
const btn2 = await text('pt-log');
ok(btn2.indexOf('1/3') > -1, 'and the button says a third of a serving', btn2);

await click('pt-log');
await page.waitForTimeout(400);
const row2 = await mealRow('French baguette');
ok(row2.indexOf('1/3') > -1, 'the row says a third of a baguette', row2);
ok(row2.indexOf('228') > -1, 'with a third of its figures', row2);

console.log('\n=== what one baguette weighs is remembered ===\n');

const kept = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_foodServing') || '{}'); }
  catch (e) { return {}; }
});
ok(kept['french-baguette'] === 250, 'kept against the food, not the session',
   JSON.stringify(kept));

await search('french baguette');
await click('food-detail-' + (await hitIndex('French baguette')));
await waitFor('sheet-portion');
await click('pt-unit-serv');
await waitFor('pt-serving');
const servAgain = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-serving"]');
  return el ? el.value : '(none)';
});
ok(servAgain === '250', 'and it is there the next time it is searched', servAgain);

console.log('\n=== switching units keeps the amount ===\n');

await fill('pt-amount', '1');
await page.waitForTimeout(150);
await click('pt-unit-g');
await page.waitForTimeout(150);
const asGrams = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-amount"]');
  return el ? el.value : '(none)';
});
ok(asGrams === '250', 'one serving becomes 250 g rather than resetting', asGrams);
await click('pt-unit-oz');
await page.waitForTimeout(150);
const asOz = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-amount"]');
  return el ? el.value : '(none)';
});
ok(Math.abs(parseFloat(asOz) - 8.75) < 0.3, '250 g becomes about 8.8 oz', asOz);

console.log('\n=== nothing is logged from nothing ===\n');

await fill('pt-amount', '');
await page.waitForTimeout(150);
const disabled = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-log"]');
  return el ? el.disabled : null;
});
ok(disabled === true, 'an empty amount cannot be logged');
await fill('pt-amount', 'lots');
await page.waitForTimeout(150);
const disabled2 = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-log"]');
  return el ? el.disabled : null;
});
ok(disabled2 === true, 'and neither can a word');

ok(errs.length === 0, 'no screen threw', errs.join(' | '));

await br.close(); api.close(); site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
