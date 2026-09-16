/* THE SEARCH BOX NEVER READ THE AMOUNT.

   Type "8 ounce strip steak" into Search foods and three things went
   wrong at once. The whole phrase was sent to the food database, which
   indexes foods and not sentences, so the name matched loosely at best.
   The local table was matched on the phrase too. And the portion sheet
   then opened at a flat 100 g, the eight ounces dropped without a word
   anywhere on the screen.

   The sentence box has read quantities since the start. The search box
   -- which is where most people type, because it is the button that says
   "Search foods" -- never did. Two ways in, one of them deaf.

   Both go through the same reader now: the database is asked about
   "strip steak", and the sheet opens at 8 oz with ounces selected and
   227 g underneath it. */
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

/* The server records what it was actually asked, because "did the
   quantity get stripped before the lookup" cannot be seen from the UI. */
const asked = [];
const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/food-search') === 0) {
    asked.push((new URL(q.url, 'http://x').searchParams.get('q') || '').toLowerCase());
    r.writeHead(200, cors);
    r.end(JSON.stringify({ items: [{ name: 'Beef, strip steak, raw', src: 'usda',
      cal: 217, pro: 24, carb: 0, fat: 13, fibre: 0, sugar: 0, satfat: 5, sodium: 55 }] }));
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
const type = (id, v) => page.evaluate(([i, x]) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  el.value = x; el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [id, v]);
const text = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(none)';
}, id);

async function search(phrase) {
  asked.length = 0;
  await click('log-search'); await waitFor('search-input');
  await type('search-input', phrase);
  await waitFor('food-detail-0'); await page.waitForTimeout(700);
  await click('food-detail-0'); await waitFor('sheet-portion');
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const r = window.DEMO.screens.fuel.root;
    const v = r.querySelector('[data-testid="pt-dial-value"]');
    const sheet = r.querySelector('[data-testid="sheet-portion"]');
    return { dial: v ? v.textContent.trim() : '(no dial)',
             sheet: (sheet ? sheet.textContent : '').replace(/\s+/g, ' ').trim() };
  });
}
const close = async () => {
  await page.evaluate(() => {
    const r = window.DEMO.screens.fuel.root;
    const x = r.querySelector('[data-testid="pt-close"], [data-testid="sheet-portion"] [data-action="close"]');
    if (x) x.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.LKGo('fuel'));
  await page.waitForTimeout(500);
};

console.log('=== "8 ounce strip steak" ===\n');

const s1 = await search('8 ounce strip steak');
ok(asked.some((a) => a === 'strip steak'),
   'the database is asked about the food, not the whole phrase',
   JSON.stringify(asked));
ok(s1.dial === '8', 'the sheet opens on eight, not a hundred', s1.dial);
ok(/oz/i.test(s1.sheet), 'in ounces, because that is what was asked for');
ok(/227 g/.test(s1.sheet), 'and it says what that is in grams', 
   (s1.sheet.match(/[\d.]+ g/) || ['(none)'])[0]);
ok(/492 kcal/.test(s1.sheet), 'the energy is for eight ounces of it',
   (s1.sheet.match(/[\d,]+ kcal/) || ['(none)'])[0]);

await close();

console.log('\n=== a plain search is unchanged ===\n');

const s2 = await search('strip steak');
/* The app caches the last term, so a repeat of it is correctly sent
   nowhere. What matters is that nothing but the food ever goes up. */
ok(asked.every((a) => a === 'strip steak'), 'the term goes up as typed, or not at all',
   JSON.stringify(asked));
ok(s2.dial === '100', 'and a search with no amount in it still opens at 100 g', s2.dial);

await close();

console.log('\n=== grams too, spelled out ===\n');

const s3 = await search('250 grams strip steak');
ok(asked.every((a) => a === 'strip steak'),
   'the weight comes off before anything is asked',
   JSON.stringify(asked));
ok(s3.dial === '250', 'and the sheet opens on it', s3.dial);

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close(); api.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
