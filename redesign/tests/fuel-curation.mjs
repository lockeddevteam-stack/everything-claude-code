/* CURATION: THE DATA WAS ALWAYS THERE, THE HANDLING WAS NOT.

   Three databases answer every search and each writes for a filing
   cabinet. What reached the screen was their raw output in their arrival
   order: the same food three times, named three ways, ranked by whichever
   source replied first, every one of them opening at 100 g.

   Four things had to hold before a search is usable.

   1. WORDS, NOT SUBSTRINGS. Ranking scored on indexOf(query), so the
      words had to appear as one unbroken run in the database's own
      order. "raw chicken breast" scored -1 against "Chicken breast, raw".
   2. ONE FOOD, ONE ROW. Dedupe was an exact lowercase name match, which
      catches nothing across three sources that punctuate differently.
   3. THE PLAIN FOOD FIRST, not the own-brand fillet somebody scanned.
   4. A SERVING, NOT A UNIT. Every row is per 100 g and the sheet opened
      on that for everything -- one egg started life as two. */
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

/* What three databases actually return for one food: the same chicken
   breast, spelled three ways, plus brands and near-misses. */
const CHICKEN = [
  { name: 'CHICKEN BREAST FILLETS', brand: 'Tesco', src: 'off',
    cal: 106, pro: 24, carb: 0, fat: 1.1 },
  { name: 'Chicken, broilers or fryers, breast, meat only, raw',
    src: 'usda', cal: 120, pro: 22.5, carb: 0, fat: 2.6 },
  { name: 'Chicken breasts, raw', src: 'fatsecret',
    cal: 120, pro: 22.5, carb: 0, fat: 2.6 },
  { name: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
    src: 'usda', cal: 165, pro: 31, carb: 0, fat: 3.6 },
  { name: 'Chicken, broilers or fryers, thigh, meat only, raw',
    src: 'usda', cal: 121, pro: 19.7, carb: 0, fat: 4.1 }
];
const EGGS = [{ name: 'Egg, whole, raw, fresh', src: 'usda',
                cal: 143, pro: 12.6, carb: 0.7, fat: 9.5 }];

const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/food-search') === 0) {
    const term = (new URL(q.url, 'http://x').searchParams.get('q') || '').toLowerCase();
    r.writeHead(200, cors);
    r.end(JSON.stringify({ items: term.includes('egg') ? EGGS : CHICKEN }));
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

async function search(term) {
  await page.evaluate(() => window.LKGo('fuel'));
  await page.waitForTimeout(400);
  await click('log-search'); await waitFor('search-input');
  await page.evaluate((t) => {
    const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="search-input"]');
    el.value = t; el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }, term);
  await waitFor('search-hit-0'); await page.waitForTimeout(800);
  return page.evaluate(() =>
    [...window.DEMO.screens.fuel.root.querySelectorAll('[data-testid^="search-hit-"]')]
      .map((r) => {
        const t = r.querySelector('.row__title');
        return (t ? t.textContent : r.textContent).replace(/\s+/g, ' ').trim();
      }));
}

console.log('=== the words you type, in any order ===\n');

const a = await search('chicken breast');
a.slice(0, 5).forEach((h) => console.log('   ' + h));
ok(/^chicken breast/i.test(a[0]), 'the plain food is first', a[0]);

const b = await search('raw chicken breast');
console.log('');
b.slice(0, 3).forEach((h) => console.log('   ' + h));
ok(b.length > 0, 'a different word order still finds it', String(b.length) + ' hits');
ok(/chicken breast/i.test(b[0] || ''),
   'and finds the right food, not nothing', b[0] || '(none)');

console.log('\n=== one food, one row ===\n');

const names = a.map((h) => h.toLowerCase().replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\b(\w+?)s\b/g, '$1').replace(/\s+/g, ' ').trim());
const dupes = names.filter((n, i) => names.indexOf(n) !== i);
ok(dupes.length === 0, 'the same food does not appear twice',
   dupes.length ? dupes.join(' | ') : 'all distinct');

console.log('\n=== a brand does not outrank a food ===\n');

const brandAt = a.findIndex((h) => /fillet/i.test(h));
ok(brandAt === -1 || brandAt >= 1, 'the own-brand row is not the first answer',
   'at position ' + brandAt);

console.log('\n=== it opens on a serving, not on 100 g ===\n');

/* OPEN THE ROW THE TEST MEANS, not whichever is first: the local table
   holds its own dishes under these words too, and a table food already
   carries a real serving. What is under test is the guess offered to a
   DATABASE row, which publishes in 100 g and means nothing by it. */
async function openHit(term, match) {
  const hits = await search(term);
  const i = hits.findIndex((h) => match.test(h));
  if (i < 0) return { at: '(no such row)', hits };
  await click('food-detail-' + i);
  await waitFor('sheet-portion');
  await page.waitForTimeout(500);
  const at = await page.evaluate(() => {
    const r = window.DEMO.screens.fuel.root;
    const v = r.querySelector('[data-testid="pt-dial-value"]');
    return v ? v.textContent.trim() : '(none)';
  });
  return { at, hits, name: hits[i] };
}

/* The dial steps in fives, so a 174 g serving shows as 175. What matters
   is that it is a chicken breast and not a round hundred. */
const chicken = await openHit('chicken breast', /^chicken breast, raw$/i);
const cg = Number(chicken.at);
ok(cg >= 170 && cg <= 180,
   'a chicken breast opens at what one weighs, not at 100 g',
   chicken.name + ' -> ' + chicken.at + ' g');

const egg = await openHit('egg', /whole egg/i);
const eg = Number(egg.at);
ok(eg >= 48 && eg <= 52, 'and one egg is one egg, not two',
   egg.name + ' -> ' + egg.at + ' g');

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close(); api.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
