/* ONE ROW OF DATA, EVERY AMOUNT, EVERY NUTRIENT.

   A food database row is per 100 g. That is the only figure there is, and
   everything else is arithmetic on it: the amount over a hundred is a
   multiplier, and every number on the food goes through the same one.
   Nothing is stored per portion, so nothing can drift out of step with
   anything else, and a nutrient added to the table appears at every
   amount without another line of code.

   Two things were wrong with that.

   The sheet showed four figures -- energy, protein, carbs, fat -- and
   scaled eight. Fibre, sugar, saturated fat and sodium were multiplied by
   the same factor and written into the log, and you could not see any of
   them until after you had logged it.

   And cloud.js dropped all four on the way in. The Worker sent them, the
   mapping kept four fields out of eight, and a food from a database
   arrived with its micros missing. Nothing reported it: the micro row
   read zero, which looks like a food with no sodium rather than like a
   figure nobody has.

   THE DIAL. A number field is right for a number you know and wrong for
   one you are deciding, and it puts a keyboard over the figures you are
   deciding against. This is a watch bezel instead: sixty ticks, long
   every fifth, a marker at twelve, five grams a step with a finer step a
   toggle away. The field stays underneath, because the dial is the fast
   way to 185 g and the field is the only way to 187. */
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

/* A row with every nutrient on it, per 100 g. */
const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/food-search') === 0) {
    r.writeHead(200, cors);
    r.end(JSON.stringify({ items: [{
      name: 'Chicken breast, raw', brand: '', type: 'Generic', src: 'usda',
      cal: 165, pro: 31, carb: 0, fat: 3.6,
      fibre: 0.4, sugar: 0.2, satfat: 1.1, sodium: 74
    }] }));
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

const click = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i); el.click();
}, id);
const text = (id) => page.evaluate((i) => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
  return el ? el.textContent.trim() : '(none)';
}, id);
const waitFor = (id, ms = 12000) => page.waitForFunction((i) =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id, { timeout: ms });

await click('log-search');
await waitFor('search-input');
await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="search-input"]');
  el.value = 'chicken breast';
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
});
await waitFor('food-detail-0');
const i = await page.evaluate(() => {
  const rows = window.DEMO.screens.fuel.root.querySelectorAll('[data-testid^="search-hit-"]');
  for (const r of rows) if (r.textContent.includes('Chicken breast, raw'))
    return +r.getAttribute('data-testid').replace('search-hit-', '');
  return 0;
});
await click('food-detail-' + i);
await waitFor('sheet-portion');
await page.waitForTimeout(500);

console.log('=== every nutrient the row carries is on the screen ===\n');

ok((await text('pt-sodium')) !== '(none)',
   'sodium survives the trip from the database', await text('pt-sodium'));
ok((await text('pt-fibre')) !== '(none)', 'so does fibre', await text('pt-fibre'));
ok((await text('pt-satfat')) !== '(none)', 'and saturated fat', await text('pt-satfat'));
ok((await text('pt-sugar')) !== '(none)', 'and sugar', await text('pt-sugar'));

console.log('\n=== and the dial is the control ===\n');

ok(await page.evaluate(() =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-dial"] .dial__face')),
  'the dial is drawn');

/* The bezel has to have marks on it. A transform-origin in CSS on top of
   the rotate(a cx cy) attribute applied the centre twice and threw every
   tick outside the phone, while computed style went on reporting them
   white and visible. So this asks where they actually are. */
const ticks = await page.evaluate(() => {
  const root = window.DEMO.screens.fuel.root;
  const svg = root.querySelector('[data-testid="pt-dial"] svg');
  const face = svg.getBoundingClientRect();
  const marks = [...svg.querySelectorAll('.dial__tick')];
  const inside = marks.filter((t) => {
    const b = t.getBoundingClientRect();
    return b.x >= face.x - 2 && b.right <= face.right + 2 &&
           b.y >= face.y - 2 && b.bottom <= face.bottom + 2;
  });
  return { total: marks.length, inside: inside.length };
});
ok(ticks.total === 60, 'sixty ticks, the way a bezel is marked', String(ticks.total));
ok(ticks.inside === 60, 'and every one of them is on the face',
   ticks.inside + ' of ' + ticks.total);

ok((await text('pt-dial-value')) === '100', 'it opens on the row\'s own 100 g',
   await text('pt-dial-value'));
ok((await text('pt-step-5')) !== '(none)', 'five grams a step');
ok((await text('pt-step-1')) !== '(none)', 'with a finer step a tap away');

console.log('\n=== turning it moves every figure together ===\n');

const box = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-dial"] .dial__face');
  const b = el.getBoundingClientRect();
  return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, r: b.width / 2 };
});
await page.mouse.move(box.cx, box.cy - box.r * 0.7);
await page.mouse.down();
for (let s = 1; s <= 12; s++) {
  const a = (-90 + s * 6) * Math.PI / 180;
  await page.mouse.move(box.cx + Math.cos(a) * box.r * 0.7, box.cy + Math.sin(a) * box.r * 0.7);
}
await page.mouse.up();
await page.waitForTimeout(300);

/* Twelve ticks at five grams each. The invisible slider that makes the
   dial reachable by keyboard used to sit on top of the face and swallow
   every pointer event -- a range input takes its value from where along
   its width you press, so dragging the bezel set the amount by how far
   right your thumb was, and this same drag produced 1715 g. */
ok((await text('pt-dial-value')) === '160',
   'twelve ticks is sixty grams, not wherever the thumb happened to be',
   await text('pt-dial-value'));
ok((await text('pt-kcal')).indexOf('264') > -1,
   'and the energy is 1.6 times the hundred-gram figure', await text('pt-kcal'));
ok((await text('pt-pro')).indexOf('49.6') > -1, 'protein with it', await text('pt-pro'));
ok((await text('pt-sodium')).indexOf('118') > -1,
   'and sodium, on the same multiplier as everything else', await text('pt-sodium'));
ok(await page.evaluate(() =>
  window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-amount"]').value === '160'),
  'the field underneath holds the same number');

console.log('\n=== ounces are the same data, converted ===\n');

await click('pt-unit-oz');
await page.waitForTimeout(500);
ok((await text('pt-step-0_25')) !== '(none)',
   'an ounce steps in quarters, which is how an ounce is spoken');
const ozKcal = await text('pt-kcal');
ok(ozKcal.indexOf('264') > -1 || ozKcal.indexOf('26') > -1,
   'and switching unit keeps the amount rather than resetting it', ozKcal);

console.log('\n=== the keyboard can still turn it ===\n');

const kb = await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-dial-slider"]');
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { pointer: cs.pointerEvents, tag: el.tagName, type: el.type };
});
ok(kb && kb.tag === 'INPUT' && kb.type === 'range',
   'there is a real range input behind the dial', JSON.stringify(kb));
ok(kb && kb.pointer === 'none',
   'and it takes no pointer events, so the face gets them', kb && kb.pointer);

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); api.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
