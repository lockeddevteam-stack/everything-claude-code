/* "SEVEN OUNCES OF CHICKEN AND A THIRD OF A BAGUETTE."

   Said out loud, both of those logged 100 g. The sentence reader did read
   the quantity off the front of a phrase it could not place, and then
   threw it away: the item was pushed at qty 1 with no unit, the name
   builder dropped "7" and "oz", and the database lookup that followed had
   nothing left to scale by, so it priced every row at a flat 100 g.

   A fraction had a second problem. The leftover text was stripped of
   everything that is not a letter, a digit or a space BEFORE the
   fractions were read, so the slash in "1/3" was gone and the words
   arrived as the numbers 1 and 3 -- a whole baguette, then a stray three.

   What is checked here: that a weight unit in a spoken sentence converts,
   that a bare count is multiplied by what one of that food weighs rather
   than by 100 g, that a remembered serving weight is used when there is
   one, and that a guess at what one weighs is said on the row instead of
   being passed off as a measurement. */
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

/* Two foods, per 100 g, neither of them in the shipped table. */
const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/food-search') === 0) {
    const term = decodeURIComponent((q.url.split('q=')[1] || '').split('&')[0] || '');
    const bag = { name: 'French baguette', brand: '', type: 'Generic', src: 'off',
                  cal: 274, pro: 9, carb: 55, fat: 1.4 };
    const chk = { name: 'Chicken breast, raw', brand: '', type: 'Generic', src: 'usda',
                  cal: 165, pro: 31, carb: 0, fat: 3.6 };
    r.writeHead(200, cors);
    r.end(JSON.stringify({ items: /bag/i.test(term) ? [bag] : [chk] }));
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

const click = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i); el.click();
}, id);
const has = (id) => page.evaluate((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id);
const waitFor = (id, ms = 10000) => page.waitForFunction((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id, { timeout: ms });
const fill = async (id, v) => page.evaluate(([i, val]) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [id, v]);
const preview = () => page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-preview"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(no preview)';
});

async function say(sentence) {
  if (!(await has('mic-text'))) {
    await click('log-mic');
    await waitFor('mic-text');
  }
  await fill('mic-text', sentence);
  /* The lookup is debounced, then a round trip. */
  await page.waitForTimeout(1800);
  return preview();
}

console.log('=== a weight said out loud is that weight ===\n');

await click('log-mic');
await waitFor('mic-text');
ok(true, 'the sentence box opens');

const p1 = await say('7 oz chicken breast');
/* 7 oz is 28.35 * 7 = 198 g. At 165 kcal per 100 g that is 327 kcal. */
ok(/198 g/.test(p1), 'seven ounces reads as 198 g, not 100 g', p1);
ok(/327/.test(p1), 'and the energy is for that much of it', p1);
ok(!/100 g/.test(p1), 'nothing is priced at a flat 100 g', p1);

console.log('\n=== a count is a count, not a hundred grams ===\n');

const p2 = await say('a third of a baguette');
/* Nothing on this device knows what a baguette weighs, so one is taken
   as 100 g and a third of it is 33 g -- and the row says so. */
ok(/33 g/.test(p2), 'a third is a third of one, not a whole 100 g', p2);
ok(/set the portion/i.test(p2), 'and the row admits it guessed what one weighs', p2);

console.log('\n=== once you have said what one weighs, it is used ===\n');

await page.evaluate(() => {
  localStorage.setItem('lk_foodServing', JSON.stringify({ 'french-baguette': 250 }));
});
/* A different sentence, so the debounce sees a change. */
const p3 = await say('one third of a baguette');
ok(/83 g/.test(p3), 'a third of a 250 g baguette is 83 g', p3);
ok(/227/.test(p3), 'with a third of its figures', p3);
ok(!/set the portion/i.test(p3), 'and it no longer says it is guessing', p3);

console.log('\n=== both halves of one sentence ===\n');

await page.evaluate(() => { localStorage.removeItem('lk_foodServing'); });
const p4 = await say('7 oz chicken breast and 1/3 of a baguette');
ok(/198 g/.test(p4), 'the weight survives the split', p4);
ok(/33 g/.test(p4), 'and the fraction survives the punctuation strip', p4);

console.log('\n=== nothing blew up ===\n');
ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); api.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
