/* NAMES THAT ARE NOT NAMES.

   Every screen here is built by concatenating strings and handing them
   to innerHTML. That is fine for text the app wrote and dangerous for
   text a person typed, and this app is full of typed text: split names,
   custom exercise names, food names, shopping items, session notes. A
   name containing a tag is markup unless somebody escaped it, and the
   escaping is applied by hand, one call site at a time, which is the
   kind of thing that is right in fifty places and missed in one.

   The one that is missed is not a cosmetic fault. This is an installed
   app holding an auth token: script that runs inside it runs as the
   reader. And the text does not have to come from the reader to get
   here -- it arrives from the server too, on any device that syncs, so
   "I would not type that" is not a defence.

   So every name a person can set is seeded with a tag, an image with a
   broken source and an onerror, and a quote that breaks out of an
   attribute. Then every screen is opened and asked two things: did
   anything execute, and did any of it become an element rather than
   staying the text somebody typed. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP_FILE = path.join(ROOT, '10-final/locked-app.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  const p = new URL(q.url, 'http://127.0.0.1').pathname;
  if (p === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(await readFile(APP_FILE));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

/* Three shapes, because they fail differently: a tag that becomes an
   element, an attribute that fires without any click, and a quote that
   escapes the attribute it was put in. */
const TAG = '<b data-xss="tag">x</b>';
const IMG = '<img src=x onerror="window.__XSS=(window.__XSS||0)+1">';
const ATTR = '" onmouseover="window.__XSS=(window.__XSS||0)+1" x="';
const HOSTILE = TAG + IMG + ATTR;

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript((d) => {
  try {
    if (localStorage.getItem('lk_seeded')) return;
    localStorage.setItem('lk_seeded', '1');
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
  } catch (e) {}
}, {
  lk_onboarded: 'true', lk_tutorialSeen: 'true',
  lk_profile: { username: 'cesco', displayName: HOSTILE, useKg: true, weightKg: 82,
                heightCm: 180, age: 31, sex: 'male', goal: 'maintain' },
  lk_splits: [{ id: 's1', name: HOSTILE, created: '9/1/2026', days: [
    { name: HOSTILE, blocks: [], exercises: [
      { id: 104, name: HOSTILE, group: 'Chest', muscle: 'Upper Chest' }] }] }],
  lk_history: [{ id: 'w1', name: HOSTILE, date: '2026-09-13', kind: 'lift',
                 kg: 480, min: 30, sets: 1,
                 exercises: [{ id: 104, name: HOSTILE,
                               sets: [{ kg: 60, reps: 8, done: true }] }] }],
  lk_prs: [{ exId: 104, name: HOSTILE, group: 'Chest', muscle: 'Upper Chest',
             kg: 60, reps: 8, date: '2026-09-13' }],
  lk_customEx: [{ id: 9001, name: HOSTILE, muscle: 'Chest', group: 'Chest' }],
  lk_exNotes: { 104: HOSTILE },
  lk_shoppingList: [{ id: 'i1', itemName: HOSTILE, quantity: '1', unit: 'kg', category: 'other' }],
  lk_pantryItems: [{ id: 'p1', itemName: HOSTILE, quantity: '1' }],
  lk_supplements: [{ id: 'su1', name: HOSTILE, dose: '5 g', when: 'daily' }],
  lk_recipes: [{ id: 'r1', name: HOSTILE, servings: 1, items: [] }],
  lk_goals: [{ id: 'g1', text: HOSTILE, done: false }],
  lk_myFoods: [{ id: 'f1', name: HOSTILE, kcal: 100, p: 1, c: 1, f: 1 }],
  lk_fuelLog: { '2026-09-13': [{ name: HOSTILE, kcal: 350, p: 12, c: 60, f: 6 }] }
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

const routes = await page.evaluate(() => Object.keys(window.DEMO.screens));
const bad = [];

for (const r of routes) {
  try { await page.evaluate((k) => window.DEMO.go(k), r); } catch (e) { continue; }
  await page.waitForTimeout(650);
  /* Sweep the pointer across the screen, because the attribute form
     needs a hover rather than a click to fire. */
  await page.mouse.move(196, 300);
  await page.mouse.move(196, 500);
  await page.waitForTimeout(120);

  const found = await page.evaluate((k) => {
    const rec = window.DEMO.screens[k];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    if (!root) return null;
    return {
      /* The tag became an element rather than staying text. */
      tags: root.querySelectorAll('[data-xss="tag"]').length,
      /* The image was built, whether or not its handler got to run. */
      imgs: Array.from(root.querySelectorAll('img'))
        .filter((i) => (i.getAttribute('src') || '') === 'x').length,
      /* The quote broke out and became a real attribute. */
      attrs: root.querySelectorAll('[onmouseover]').length
    };
  }, r);
  if (found && (found.tags || found.imgs || found.attrs)) {
    bad.push(r + ': ' + JSON.stringify(found));
  }
}

console.log('=== a typed name is text, on every screen ===\n');
ok(routes.length > 10, 'every screen was opened with hostile names in it',
   routes.length + ' screens');
if (bad.length) bad.forEach((b) => console.log('   ' + b));
ok(bad.length === 0, 'and none of it became markup', bad.length + ' screens affected');

const fired = await page.evaluate(() => window.__XSS || 0);
ok(fired === 0, 'and nothing executed', String(fired));

/* A name typed in now, rather than one that arrived in storage: the
   escaping has to hold on the way in as well as on the way back. */
console.log('\n=== including one typed in just now ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(700);
const typed = await page.evaluate((h) => {
  const rec = window.DEMO.screens['train'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  if (!root) return 'no-root';
  const list = JSON.parse(localStorage.getItem('lk_splits') || '[]');
  list.push({ id: 's9', name: h, created: '9/3/2026',
              days: [{ name: h, blocks: [], exercises: [] }] });
  localStorage.setItem('lk_splits', JSON.stringify(list));
  return 'ok';
}, HOSTILE);
ok(typed === 'ok', 'a second hostile split is stored');
await page.evaluate(() => window.DEMO.go('home'));
await page.waitForTimeout(400);
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(900);
const after = await page.evaluate(() => {
  const rec = window.DEMO.screens['train'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return root ? { tags: root.querySelectorAll('[data-xss="tag"]').length,
                  attrs: root.querySelectorAll('[onmouseover]').length } : null;
});
ok(after && !after.tags && !after.attrs, 'and it is still text when Train redraws',
   JSON.stringify(after));
ok((await page.evaluate(() => window.__XSS || 0)) === 0, 'and still nothing has executed');

ok(!errs.length, 'nothing throws on hostile names', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
