/* A LOGGED ENTRY WAS A RECEIPT.

   You could shrink it by a fifth, grow it by a quarter, move it to
   another slot, or throw it away. Everything else about it was final.
   Weighing 250 g when you meant 150, or a packet whose figures differ
   from the database's, meant deleting the row and starting again.

   And the entry could not have been re-weighed anyway, because it did not
   remember enough to be: 198 g of chicken went in as 327 kcal and 61 g of
   protein, and both the 198 and the per-100 g row behind it were thrown
   away at the moment of logging. "Make it 150 g" was unanswerable a
   second later.

   Two fields fix that, and the editor is built on them. g is how much was
   logged; per100 is the row it was scaled from. Re-weighing is then the
   same arithmetic as the first time: grams over a hundred, applied to
   every figure at once, so protein and sodium cannot drift apart.

   Typing a macro moves the energy with it at four, four and nine. Typing
   the energy does not move the macros: a label saying 250 kcal is a fact
   about that packet, and an app that quietly rewrote it to 243 because
   its own arithmetic preferred that would be lying to somebody reading
   their own food. The gap is shown, with one tap to close it. */
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
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens.fuel, null, { timeout: 20000 });
await page.evaluate((c) => { window.LK_CLOUD = c; }, { supabaseUrl: API, supabaseKey: 'a', apiUrl: API });
await page.evaluate(() => { if (window.LKGo) window.LKGo('fuel'); });
await page.waitForTimeout(700);

const R = () => window.DEMO.screens.fuel.root;
const click = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i); el.click();
}, id);
const has = (id) => page.evaluate((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id);
const waitFor = (id, ms = 12000) => page.waitForFunction((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id, { timeout: ms });
const val = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  return el ? el.value : null;
}, id);
const text = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(none)';
}, id);
const type = async (id, v) => page.evaluate(([i, x]) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  el.value = x; el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [id, v]);
const rows = () => page.evaluate(() =>
  window.DEMO.screens.fuel.root.querySelectorAll('[data-testid^="meal-"][data-testid$="0"], [data-testid^="meal-"]').length);

/* SAID, NOT SEARCHED. This reached the log through the search box: type
   a word, read a list, find the right row, open the portion sheet, set
   the weight, log. That box is gone -- an amount is stated in the
   sentence now and read out of it, which is the same six steps done in
   one. What this suite is actually about starts at the logged entry, so
   it only needs a shorter way to get one. */
async function logOne() {
  await click('log-type'); await waitFor('mic-text');
  await type('mic-text', '200g chicken breast');
  await waitFor('mic-preview');
  /* The sentence is read after a pause in the typing and then a round
     trip, so a row that is still "not recognised" at 350 ms is only
     early. Waited on by state rather than by clock. */
  await page.waitForFunction(() => {
    const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-confirm"]');
    return el && !el.disabled;
  }, null, { timeout: 15000 });
  await click('mic-confirm'); await page.waitForTimeout(600);
}

await logOne();

console.log('=== a logged entry can be opened and edited ===\n');

await click('meal-0'); await waitFor('sheet-meal');
ok(await has('meal-open-edit'), 'the entry offers an editor');
ok(await has('meal-again'), 'and a way to log the same thing again');
await click('meal-open-edit'); await waitFor('sheet-meal-edit');
await page.waitForTimeout(400);
ok(await has('me-dial'), 'with a dial, because this entry kept the row it was weighed from');
/* THE FIGURES IT WAS LOGGED WITH, whatever weight that was. Written as
   the literal 31 -- the per-100 g protein -- this only held while every
   food was logged at exactly 100 g, which was the default the curation
   pass removed. The entry is logged at a serving now, so the figure to
   check against is the row at that weight. */
const loggedG = Number(await text('me-dial-value'));
const at = (per100) => Math.round(per100 * loggedG / 100 * 10) / 10;
ok(loggedG > 0, 'the entry knows what it was logged at', loggedG + ' g');
ok(val ? Math.abs(Number(await val('me-pro')) - at(31)) <= 0.6 : false,
   'and the figures it was logged with',
   (await val('me-pro')) + ' for ' + at(31));

console.log('\n=== re-weighing rescales every figure at once ===\n');

const box = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="me-dial"] .dial__face');
  const b = el.getBoundingClientRect();
  return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, r: b.width / 2 };
});
await page.mouse.move(box.cx, box.cy - box.r * 0.7);
await page.mouse.down();
for (let s = 1; s <= 10; s++) {
  const a = (-90 + s * 6) * Math.PI / 180;
  await page.mouse.move(box.cx + Math.cos(a) * box.r * 0.7, box.cy + Math.sin(a) * box.r * 0.7);
}
await page.mouse.up(); await page.waitForTimeout(400);

/* Ten ticks is fifty grams from wherever it started, and every figure
   follows the new weight off the same per-100 g row. The relationship is
   the thing under test; the old literals only described one starting
   point. */
const turned = Number(await text('me-dial-value'));
ok(turned === loggedG + 50, 'ten ticks is fifty grams on from where it was',
   loggedG + ' -> ' + turned);
const now = (per100) => per100 * turned / 100;
const close = (got, want, tol) =>
  Math.abs(Number(String(got).replace(/[^0-9.]/g, '')) - want) <= (tol || 1);
ok(close(await val('me-kcal'), now(165), 2), 'energy follows the weight',
   (await val('me-kcal')) + ' for ' + Math.round(now(165)));
ok(close(await val('me-pro'), now(31)), 'protein with it',
   (await val('me-pro')) + ' for ' + now(31).toFixed(1));
ok(close(await val('me-sodium'), now(74), 2), 'and sodium, on the same multiplier',
   (await val('me-sodium')) + ' for ' + Math.round(now(74)));

console.log('\n=== typing a macro moves the energy, not the other way ===\n');

await type('me-pro', '50');
await page.waitForTimeout(350);
/* FOUR, FOUR AND NINE, off whatever the macros actually are. The literal
   249 here assumed a 150 g entry; it described one starting weight
   rather than the rule the screen runs on. */
const macroKcal = Math.round(
  50 * 4 +
  Number(await val('me-carb')) * 4 +
  Number(await val('me-fat')) * 9);
ok(Number(await val('me-kcal')) === macroKcal,
   'protein at four calories a gram',
   (await val('me-kcal')) + ' for ' + macroKcal);

await type('me-kcal', '400');
await page.waitForTimeout(350);
ok(await has('me-gap'), 'a figure that disagrees with the macros is flagged');
ok((await text('me-gap')).indexOf('400') > -1 &&
   (await text('me-gap')).indexOf(String(macroKcal)) > -1,
   'and both numbers are named, rather than one being overwritten',
   (await text('me-gap')).slice(0, 90));
ok((await val('me-kcal')) === '400', 'the typed figure stands', await val('me-kcal'));

await click('me-match'); await page.waitForTimeout(350);
ok(Number(await val('me-kcal')) === macroKcal,
   'and one tap closes the gap when that is what you meant',
   (await val('me-kcal')) + ' for ' + macroKcal);

console.log('\n=== saving writes it, and the label keeps up ===\n');

await click('me-save'); await page.waitForTimeout(600);
const row = await text('meal-0');
ok(row.indexOf(turned + ' g') > -1,
   'the row says the weight it now holds, not the one it was logged at',
   row.slice(0, 60) + ' (wanted ' + turned + ' g)');
ok(row.indexOf('50 P') > -1, 'and the edited protein', row.slice(0, 60));
ok(await has('toast'), 'with an undo, because an edit to a log is destructive');

console.log('\n=== cancel is a cancel ===\n');

await click('meal-0'); await waitFor('sheet-meal');
await click('meal-open-edit'); await waitFor('sheet-meal-edit');
await type('me-pro', '999');
await page.waitForTimeout(300);
await click('me-cancel'); await page.waitForTimeout(400);
ok((await text('meal-0')).indexOf('999') < 0,
   'nothing typed reaches the log until Save', (await text('meal-0')).slice(0, 60));

console.log('\n=== splitting one entry into two ===\n');

await click('meal-0'); await waitFor('sheet-meal');
await click('meal-open-edit'); await waitFor('sheet-meal-edit');
const beforeCount = await page.evaluate(() =>
  window.DEMO.screens.fuel.root.querySelectorAll('[data-testid^="meal-"]').length);
await click('me-split-dinner'); await page.waitForTimeout(600);
const afterCount = await page.evaluate(() =>
  window.DEMO.screens.fuel.root.querySelectorAll('[data-testid^="meal-"]').length);
ok(afterCount > beforeCount, 'the entry becomes two', beforeCount + ' -> ' + afterCount);

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); api.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
