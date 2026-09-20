/* SAY IT OR TYPE IT, AND SEE WHICH NUMBERS ARE REAL.

   Fuel logged food through a search box: type a word, read a list, pick
   a row, set a portion, then again for the next thing on the plate. The
   box is gone. A sentence goes to the server whole, which reads the
   foods and the amounts out of it and prices them against USDA, Open
   Food Facts, FatSecret and the shared table.

   The part that matters on screen is the part a search box could never
   say: whether a figure was measured or worked out. Two different
   things get loosely called an estimate and they are different claims:

     the food   -- a database row, or a figure produced because nothing
                   knew the food
     the amount -- a weight somebody stated, or a typical serving
                   standing in for "a baguette"

   Exact needs both halves hard. Anything else carries the approximate
   sign on the number itself, where the number is read, and says which
   half was soft. A worked-out figure set in the same type as a measured
   one is what makes a food log quietly untrue: you cannot tell, a week
   later, which of your days were real. */
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

/* What the Worker answers, in its real shape. One item measured against
   a database at a stated weight, one counted thing whose weight is a
   typical serving. */
let reply = null;
const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/log-meal') === 0) {
    r.writeHead(reply.status || 200, cors);
    r.end(JSON.stringify(reply.body));
    return;
  }
  r.writeHead(200, cors); r.end('{}');
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const API = 'http://127.0.0.1:' + api.address().port;

const STEAK = { name: 'Beef top loin steak', said: 'new york strip steak', brand: '',
  amount: 8, unit: 'oz', g: 227, cal: 568, pro: 59, carb: 0, fat: 36.3,
  per100: { cal: 250, pro: 26, carb: 0, fat: 16 }, src: 'usda',
  exact: true, assumed: '' };
const BAGUETTE = { name: 'Bread, french', said: 'baguette', brand: '',
  amount: 1, unit: 'item', g: 250, cal: 675, pro: 22.5, carb: 130, fat: 5,
  per100: { cal: 270, pro: 9, carb: 52, fat: 2 }, src: 'off',
  exact: false, assumed: 'amount' };

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
await page.evaluate((c) => { window.LK_CLOUD = c; },
                    { supabaseUrl: API, supabaseKey: 'a', apiUrl: API });
await page.waitForTimeout(400);

const click = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i); el.click();
}, id);
const has = (id) => page.evaluate((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id);
const waitFor = (id, ms = 12000) => page.waitForFunction((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id, { timeout: ms });
const text = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(missing)';
}, id);
const fill = (id, v) => page.evaluate(([i, val]) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [id, v]);

/* Typed, then waited on by state: the sentence is read after a pause in
   the typing and then a round trip, so any fixed clock is a guess. */
async function say(sentence) {
  if (!(await has('mic-text'))) { await click('log-type'); await waitFor('mic-text'); }
  await fill('mic-text', sentence);
  /* The read is debounced 600 ms before it starts. Waiting only for the
     reading indicator to be ABSENT passed instantly, before it had ever
     appeared -- so every assertion below was made against the local
     parse and none of them touched the server path they were written
     for. Past the debounce first, then until the read settles. */
  await page.waitForTimeout(900);
  await page.waitForFunction(() =>
    !window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-reading"]'),
    null, { timeout: 15000 });
  await page.waitForTimeout(300);
}

console.log('=== the search box is gone ===\n');

await page.evaluate(() => window.DEMO.go('fuel'));
await page.waitForTimeout(500);
ok(!(await has('log-search')), 'no search button on the log control');
ok(!(await has('foods-search')), 'and none on Your foods');
ok(await has('log-type'), 'typing reaches the same sheet as saying it');
ok(await has('log-mic'), 'and so does the microphone');

console.log('\n=== a measured item reads plainly ===\n');

reply = { body: { items: [STEAK],
  totals: { cal: 568, pro: 59, carb: 0, fat: 36.3, exact: true }, text: '8oz steak' } };
await say('8oz new york strip steak');
ok(/568/.test(await text('mic-kcal-0')), 'the figure is there',
   await text('mic-kcal-0'));
ok(!/≈/.test(await text('mic-kcal-0')),
   'with no approximate sign, because it was measured', await text('mic-kcal-0'));
ok(/Measured/.test(await text('mic-sure-0')),
   'and the row says so', await text('mic-sure-0'));
ok(/USDA/.test(await text('mic-sure-0')),
   'naming which database measured it', await text('mic-sure-0'));
ok(!/≈/.test(await text('mic-sum')),
   'the total is plain too', await text('mic-sum'));

console.log('\n=== a counted thing carries the sign ===\n');

reply = { body: { items: [BAGUETTE],
  totals: { cal: 675, pro: 22.5, carb: 130, fat: 5, exact: false }, text: 'a baguette' } };
await say('a baguette');
ok(/≈/.test(await text('mic-kcal-0')),
   'the approximate sign rides on the number', await text('mic-kcal-0'));
ok(/Approximate/.test(await text('mic-sure-0')),
   'and the row says which it is', await text('mic-sure-0'));
ok(/weight of one is assumed/.test(await text('mic-sure-0')),
   'naming the AMOUNT as the soft half, not the food',
   await text('mic-sure-0'));

console.log('\n=== a food nothing knew says the other thing ===\n');

reply = { body: { items: [Object.assign({}, BAGUETTE, {
    name: 'Koeksister', src: 'estimate', exact: false, assumed: 'food' })],
  totals: { cal: 675, pro: 22.5, carb: 130, fat: 5, exact: false }, text: '250g koeksister' } };
await say('250g koeksister');
/* "no database had this food" was the app naming a database at somebody
   eating. The claim is the same one; only the words changed. */
ok(/nothing matched this food/.test(await text('mic-sure-0')),
   'the FOOD was the soft half here, which is a different claim',
   await text('mic-sure-0'));
ok(!/weight of one is assumed/.test(await text('mic-sure-0')),
   'and it does not blame the amount instead', await text('mic-sure-0'));

console.log('\n=== one soft item makes the whole total soft ===\n');

reply = { body: { items: [STEAK, BAGUETTE],
  totals: { cal: 1243, pro: 81.5, carb: 130, fat: 41.3, exact: false },
  text: '8oz steak and a baguette' } };
await say('8oz new york strip steak and a baguette');
ok(!/≈/.test(await text('mic-kcal-0')), 'the measured item stays plain',
   await text('mic-kcal-0'));
ok(/≈/.test(await text('mic-kcal-1')), 'the guessed one carries the sign',
   await text('mic-kcal-1'));
ok(/≈/.test(await text('mic-sum')),
   'and so does the total, because one guessed baguette is in it',
   await text('mic-sum'));
ok(/Approximate/.test(await text('mic-sum')),
   'said in words as well as a symbol', await text('mic-sum'));

console.log('\n=== nought items is not a measured nought ===\n');

reply = { status: 422, body: { error: 'No food found in that.', why: 'nofood', items: [] } };
await say('asdkjfh');
const emptySum = await text('mic-sum');
ok(!/looked up, not estimated/.test(emptySum),
   'an empty list never claims to have been measured', emptySum);
ok(await has('mic-server-msg'), 'and the reason is on screen');

console.log('\n=== what is logged keeps its basis ===\n');

reply = { body: { items: [STEAK],
  totals: { cal: 568, pro: 59, carb: 0, fat: 36.3, exact: true }, text: '8oz steak' } };
await say('8oz new york strip steak');
await page.waitForFunction(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-confirm"]');
  return el && !el.disabled;
}, null, { timeout: 12000 });
await click('mic-confirm');
await page.waitForTimeout(700);
/* lk_fuelLog is the key the screen writes, keyed by day. The weight and
   the per-100 g rate are read back from it rather than from the row on
   screen, because the bug this guards against is precisely a save that
   drops them: the figures look right until the editor tries to find a
   basis to turn the dial against. */
const logged = await page.evaluate(() => {
  const raw = localStorage.getItem('lk_fuelLog');
  if (!raw) return { missing: 'lk_fuelLog' };
  const log = JSON.parse(raw);
  const isos = Object.keys(log).sort();
  const d = log[isos[isos.length - 1]];
  const m = d && d.meals && d.meals[d.meals.length - 1];
  return m ? { name: m.name, kcal: m.kcal, g: m.g, per100: m.per100 }
           : { missing: 'meals', isos: isos.length };
});
ok(!!logged, 'the entry lands in the day', JSON.stringify(logged));
ok(logged && logged.g === 227,
   'carrying the weight the sentence stated', String(logged && logged.g));
/* kcal, not cal. The Worker answers per100 as {cal,...} and every
   reader in the screen takes per100.kcal, so the store is checked in the
   screen's own spelling: asserting the wire's would have passed while
   the dial moved protein and left the calories at nought. */
ok(logged && logged.per100 && logged.per100.kcal === 250,
   'and the rate it was priced at, in the spelling the editor reads',
   JSON.stringify(logged && logged.per100));

ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
await br.close(); site.close(); api.close();
process.exit(fails ? 1 : 0);
