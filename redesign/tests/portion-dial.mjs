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
   deciding against. This is a watch bezel instead: sixty positions round
   the face, a marker at twelve, five grams a step with a finer step a
   toggle away. The field stays underneath, because the dial is the fast
   way to 185 g and the field is the only way to 187.

   Those sixty are not sixty of the same thing, and that is the point.
   Forty-eight are hairline minute ticks and twelve are applied batons at
   the fives, because sixty identical marks give the eye nothing to count
   by. This used to assert sixty `.dial__tick` elements, which measured
   the markup rather than the property -- so it would have passed a face
   with no batons on it at all, and failed the moment the fives were made
   distinguishable, which is what actually happened. */
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
  /* THE DEMO BUILD, DELIBERATELY. The portion sheet is a surface for the
     shipped food table, and the prod build has none: --prod leaves
     fixtures out, so FOODS is empty and nothing FOODS-keyed can render
     or be reached. In production every food comes off the server and the
     dial that matters is the editor's, covered by meal-basis-persist and
     meal-edit. This suite is about the portion sheet itself, so it runs
     where that sheet exists. */
  r.end(await readFile(path.join(ROOT, '10-final/locked-demo.html')));
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

/* The portion sheet was reached from a search result and from nowhere
   else. Search is gone, so it hangs off a food you have logged before
   instead -- which is where choosing an amount without writing a
   sentence is worth having. */
/* The often list is built from what has been logged, so something has
   to be logged first. Said, which is the ordinary way in now. */
await click('log-type'); await waitFor('mic-text');
await page.evaluate(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-text"]');
  el.value = '200 g chicken breast';
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
});
await waitFor('mic-preview');
await page.waitForFunction(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-confirm"]');
  return el && !el.disabled;
}, null, { timeout: 15000 });
await click('mic-confirm');
await page.waitForTimeout(500);
/* The often list lives under the meals view, not the log view. */
await click('fuel-view-meals');
await waitFor('often-list');
await page.waitForTimeout(300);
/* Whichever food is first. Every figure below is measured against what
   this one opened on, so the suite no longer depends on which food the
   list happens to hold. */
await click('meals-amount-0');
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
  const fine = [...svg.querySelectorAll('.dial__tick')];
  const batons = [...svg.querySelectorAll('.dial__index')];
  const marks = fine.concat(batons);
  const inside = marks.filter((t) => {
    const b = t.getBoundingClientRect();
    return b.x >= face.x - 2 && b.right <= face.right + 2 &&
           b.y >= face.y - 2 && b.bottom <= face.bottom + 2;
  });
  /* A baton has to actually be bigger than a hairline, or "two kinds of
     mark" is a class name and not something anybody can see. */
  const fw = fine.length ? fine[0].getBoundingClientRect().width : 0;
  const bw = batons.length ? batons[0].getBoundingClientRect().width : 0;
  return { total: marks.length, inside: inside.length,
           fine: fine.length, batons: batons.length, fineW: fw, batonW: bw };
});
ok(ticks.total === 60, 'sixty positions round the face, the way a bezel is marked',
   ticks.fine + ' minute ticks + ' + ticks.batons + ' batons');
ok(ticks.batons === 12, 'a baton at every fifth, so there is something to count by',
   String(ticks.batons));
ok(ticks.batonW > ticks.fineW * 1.5,
   'and a baton reads as heavier than a minute tick',
   ticks.fineW.toFixed(1) + 'px vs ' + ticks.batonW.toFixed(1) + 'px');
ok(ticks.inside === 60, 'and every one of them is on the face',
   ticks.inside + ' of ' + ticks.total);

/* IT OPENS ON A SERVING, NOT ON 100 g.

   This asserted the literal 100, which is the figure a database
   publishes in and not an amount anybody eats -- 100 g of egg is two
   eggs, 100 g of peanut butter is six tablespoons. So the assertion was
   pinning the behaviour that made the dial's first job undoing the
   number it opened on. A chicken breast opens at what one weighs. */
/* Not pinned to one food's serving weight either. This wanted 170-180,
   which is a chicken breast, and it reached that food through the search
   box. What has to hold for any food is that the dial opens on a serving
   rather than on the hundred grams a database publishes in. */
const openedAt = Number(await text('pt-dial-value'));
const num = (t) => Number(String(t).replace(/[^0-9.]/g, ''));
const openKcal = num(await text('pt-kcal'));
const openPro = num(await text('pt-pro'));
const openSodium = num(await text('pt-sodium'));
ok(openedAt > 0 && openedAt !== 100,
   'it opens on a serving of the food, not on the database\'s unit',
   openedAt + ' g');
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
/* THE RELATIONSHIP, NOT A REMEMBERED PAIR OF NUMBERS. Twelve ticks is
   sixty grams from wherever the dial started, and every figure is the
   per-100 g row times the weight over a hundred. Written as the literal
   160 and 264, these assertions said nothing about the arithmetic and
   broke the moment the opening amount stopped being a hundred. */
const turnedTo = Number(await text('pt-dial-value'));
ok(turnedTo === openedAt + 60,
   'twelve ticks is sixty grams, not wherever the thumb happened to be',
   openedAt + ' -> ' + turnedTo);

/* THE MULTIPLIER, MEASURED AGAINST WHAT THIS FOOD OPENED ON. The
   figures 165, 31 and 74 are a chicken breast per 100 g, read off the
   stub the search box used to be fed. Any food's figures have to move by
   the same ratio as its weight, and that is the arithmetic worth
   holding; the particular food is not. */
const ratio = turnedTo / openedAt;
const near = (txt, want, tol) => {
  const got = Number(String(txt).replace(/[^0-9.]/g, ''));
  return Math.abs(got - want) <= (tol || Math.max(1, want * 0.02));
};
ok(near(await text('pt-kcal'), openKcal * ratio),
   'and the energy moves by the same ratio as the weight',
   await text('pt-kcal') + ' for ' + Math.round(openKcal * ratio));
ok(near(await text('pt-pro'), openPro * ratio),
   'protein with it', await text('pt-pro') + ' for ' + (openPro * ratio).toFixed(1));
ok(openSodium === 0 || near(await text('pt-sodium'), openSodium * ratio, 2),
   'and sodium, on the same multiplier as everything else',
   await text('pt-sodium') + ' for ' + Math.round(openSodium * ratio));
ok(await page.evaluate((want) =>
  window.DEMO.screens.fuel.root.querySelector('[data-testid="pt-amount"]').value
    === String(want), turnedTo),
  'the field underneath holds the same number', String(turnedTo));

console.log('\n=== ounces are the same data, converted ===\n');

await click('pt-unit-oz');
await page.waitForTimeout(500);
ok((await text('pt-step-0_25')) !== '(none)',
   'an ounce steps in quarters, which is how an ounce is spoken');
/* Switching the unit must not change how much food it is. The energy is
   the invariant: grams or ounces, the same weight is the same meal. */
const ozKcal = await text('pt-kcal');
ok(near(ozKcal, openKcal * ratio, 3),
   'and switching unit keeps the amount rather than resetting it',
   ozKcal + ' for ' + Math.round(openKcal * ratio));

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
