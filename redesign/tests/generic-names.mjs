/* A FOOD DATABASE WRITES FOR A FILING CABINET.

   USDA calls a chicken breast "Chicken, broilers or fryers, breast, meat
   only, cooked, roasted". That string went straight onto the row, so
   searching "chicken breast" returned a wall of near-identical sentences
   and you had to read to the end of each to tell them apart -- and the
   one thing you actually wanted to know, cooked or raw, was the last
   word of the longest line on screen.

   The names are cut back to what a person would call the food, keeping
   the state word because cooked chicken and raw chicken are different
   foods. And a row with a brand on it sorts below one without: a brand
   is the right answer when you scanned a barcode and the wrong one when
   you typed "chicken breast". */
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

/* Verbatim shapes, brands and all, of the kind the endpoint returns. */
const ROWS = [
  /* Names that are ALREADY names. The first pass at this lowercased
     everything for matching and never put it back, so "New York strip
     steak" came out "New york strip steak" and "Coca-Cola" came out
     "Coca-cola" -- a shortening that made the list read worse than the
     database it was cleaning up. */
  { name: 'New York strip steak', src: 'usda', cal: 217, pro: 24, carb: 0, fat: 13 },
  { name: 'Coca-Cola', brand: 'Coca-Cola', src: 'off', cal: 42, pro: 0, carb: 10.6, fat: 0 },
  { name: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
    src: 'usda', cal: 165, pro: 31, carb: 0, fat: 3.6 },
  { name: 'Chicken, broilers or fryers, breast, meat only, raw',
    src: 'usda', cal: 120, pro: 22.5, carb: 0, fat: 2.6 },
  { name: 'CHICKEN BREAST FILLETS', brand: 'Tesco', src: 'off',
    cal: 106, pro: 24, carb: 0, fat: 1.1 },
  { name: 'Beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, cooked, grilled',
    src: 'usda', cal: 217, pro: 30, carb: 0, fat: 10 }
];

const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  /* The route the screen takes now. Each row comes back as one item of
     a read sentence, which is where a database's own words reach a
     person today. */
  if (q.url.indexOf('/log-meal') === 0) {
    r.writeHead(200, cors);
    r.end(JSON.stringify({
      items: ROWS.map((row) => ({
        name: row.name, said: 'chicken breast', brand: row.brand || '',
        amount: 100, unit: 'g', g: 100,
        cal: row.cal, pro: row.pro, carb: row.carb, fat: row.fat,
        per100: { cal: row.cal, pro: row.pro, carb: row.carb, fat: row.fat },
        src: row.src, exact: true, assumed: ''
      })),
      totals: { cal: 0, pro: 0, carb: 0, fat: 0, exact: true },
      text: 'chicken breast'
    }));
    return;
  }
  if (q.url.indexOf('/food-search') === 0) {
    r.writeHead(200, cors); r.end(JSON.stringify({ items: ROWS })); return;
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
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens.fuel, null, { timeout: 20000 });
await page.evaluate((c) => { window.LK_CLOUD = c; }, { supabaseUrl: API, supabaseKey: 'a', apiUrl: API });
await page.evaluate(() => window.LKGo('fuel'));
await page.waitForTimeout(800);

const click = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i); el.click();
}, id);
const waitFor = (id, ms = 12000) => page.waitForFunction((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id, { timeout: ms });

/* Said, not searched. The list a person reads is the one the sentence
   was read into, and these names have to survive the trip to it: the
   route was passing the database's raw string straight through, so the
   ordinary way of logging showed "Beef, loin, top loin steak, boneless,
   lip off, separable lean only, trimmed to 0" and the way nobody uses
   any more showed "Beef top loin steak". */
await click('log-type'); await waitFor('mic-text');
await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-text"]');
  el.value = 'chicken breast';
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
});
await page.waitForTimeout(900);
await page.waitForFunction(() =>
  !window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-reading"]'),
  null, { timeout: 15000 });
await page.waitForTimeout(300);

const hits = await page.evaluate(() =>
  [...window.DEMO.screens.fuel.root
    .querySelectorAll('[data-testid="mic-preview"] .row__title')]
    .map((t) => t.textContent.replace(/\s+/g, ' ').trim()));

console.log('=== what the list reads like ===\n');
hits.slice(0, 6).forEach((h) => console.log('   ' + h));
console.log('');

const joined = hits.join(' | ');
ok(!/broilers or fryers/i.test(joined),
   'no row still says "broilers or fryers"', joined.slice(0, 80));
ok(!/separable lean|trimmed to/i.test(joined),
   'nor the trim and the butchery boilerplate');
ok(hits.some((h) => /^Chicken breast, cooked$|^Chicken breast, roasted$/i.test(h)),
   'the cooked one is called "Chicken breast, roasted"',
   hits.find((h) => /chicken breast/i.test(h)) || '(none)');
ok(hits.some((h) => /^Chicken breast, raw$/i.test(h)),
   'and the raw one says raw, because they are different foods');
ok(hits.every((h) => h.length <= 42),
   'every name is short enough to read down a list',
   'longest ' + Math.max(...hits.map((h) => h.length)));

/* Which of several rows wins is decided in the Worker now, not here --
   the screen is handed one item per food rather than a list to choose
   from -- so the ordering checks that used to live here belong with
   food-search.test.mjs and are not duplicated as UI assertions. What is
   still this screen's job is saying where a figure came from. */
const kept = await page.evaluate(() =>
  (window.DEMO.screens.fuel.root.textContent || '').indexOf('USDA') >= 0);
ok(kept, 'the source is still named on the row');

console.log('\n=== a name that is already a name is left alone ===\n');

const all = await page.evaluate(() =>
  [...window.DEMO.screens.fuel.root
    .querySelectorAll('[data-testid="mic-preview"] .row')]
    .map((r) => r.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
ok(/New York strip steak/.test(all),
   'proper nouns keep their capitals', /New \w+ strip/.exec(all) || '(not found)');
ok(!/New york/.test(all), 'and are not flattened to sentence case');

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close(); api.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
