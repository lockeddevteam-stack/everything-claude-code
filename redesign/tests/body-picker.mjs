/* PICKING A LIFT BY POINTING AT THE BODY.

   The Add and Replace sheets used to open on a search field over the
   whole catalogue. 866 lifts in a scroll is a reference book, and nobody
   reads a reference book between sets: the question in a gym is "what
   else hits this", and the fastest way to ask it is to point at the part
   being trained.

   The library screen has had a figure for this all along. The log could
   not use it because the muscle taxonomy lived inside exercise-library
   .html -- a taxonomy one screen owns is a taxonomy no other screen has
   -- so the log fell back to the only thing it could reach, a list.

   What this holds:

     the picker opens on a BODY, not a list, for Add and for Replace
     every part of the body is reachable -- twelve groups, none missing
     both ways in work: the figure itself, and the named rows under it
     Replace opens on the part the current lift trains
     search still cuts across the whole body, because a name is a name

   The fourth is the one worth having a test for. Most replacements stay
   in the same place, so a picker that opens anywhere else costs a tap
   every single time. */
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
  lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: true, weightKg: 82,
                heightCm: 180, age: 31, sex: 'male', goal: 'maintain' },
  lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' }] }] }],
  lk_history: [{ id: 'w1', name: 'PPL - Push', date: '2026-09-13', kind: 'lift',
                 kg: 480, min: 30, sets: 1,
                 exercises: [{ id: 104, name: 'Incline Machine Press',
                               sets: [{ kg: 60, reps: 8, done: true }] }] }]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable'; }
  return 'ok';
};
const inLog = (fn) => page.evaluate((f) => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  // eslint-disable-next-line no-new-func
  return new Function('root', f)(root);
}, fn);
const crumb = () => inLog(
  "const c = root.querySelector('[data-testid=\"addex-crumb\"]');" +
  "return c ? c.textContent.replace(/\\s+/g,' ').trim() : null;");

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(600);
await tap('start-today');
await page.waitForTimeout(1000);

console.log('=== Add opens on a body, not a list ===\n');

ok((await tap('btn-add-exercise')) === 'ok', 'Add exercise opens');
await page.waitForTimeout(900);
ok(await inLog("return !!root.querySelector('[data-testid=\"addex-map\"]');"),
   'and the first thing in it is the figure');
const svg = await inLog("const f = root.querySelector('#addex-fig'); return f ? f.innerHTML.length : 0;");
ok(svg > 1000, 'which is actually drawn, not an empty slot', svg + ' bytes of SVG');

/* EVERY PART, not most of them. The short list used to require an id
   below a thousand, and the catalogue numbers by the order things were
   added -- so abs and calves, which are numbered high, had nothing in
   the short list and the picker offered ten groups out of twelve. Two
   parts of the body could not be trained from it at all. */
const groups = await inLog(
  "return Array.from(root.querySelectorAll('[data-testid^=\"addex-group-\"]'))" +
  ".map(e => e.getAttribute('data-testid').replace('addex-group-',''));");
ok(groups.length === 12, 'every part of the body is offered', groups.length + ': ' + groups.join(','));
['chest', 'back', 'shoulders', 'triceps', 'biceps', 'forearms',
 'quads', 'hams', 'glutes', 'adduc', 'abs', 'calves'].forEach((g) => {
  ok(groups.indexOf(g) > -1, '  including ' + g, groups.join(','));
});

console.log('\n=== and the figure itself is the way in ===\n');

/* A POINT ON THE MUSCLE, NOT THE MIDDLE OF ITS BOX. On the front view
   "back" is the two trapezius strips either side of the neck, so the
   centre of their shared bounding box is the gap between them, sitting
   over the chest. Which group won that gap depended on whose reach
   margin happened to reach further, and the answer changed the moment
   the margins were corrected to the size they were always meant to be.
   The test was aiming at empty space and reading whatever it hit.

   It hit-tests for a point that really belongs to the group now, the way
   a finger finds one. */
const node = await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const g = root && root.querySelector('#addex-fig [data-testid="mg-back"]');
  if (!g) return null;
  const b = g.getBoundingClientRect();
  for (let y = Math.ceil(b.top); y < b.bottom; y += 2) {
    for (let x = Math.ceil(b.left); x < b.right; x += 2) {
      const el = root.elementFromPoint(x, y);
      const hit = el && el.closest ? el.closest('[data-g]') : null;
      if (hit && hit.getAttribute('data-g') === 'back') return { x, y };
    }
  }
  return null;
});
ok(!!node, 'a muscle on the figure can be aimed at', JSON.stringify(node));
if (node) {
  await page.mouse.click(node.x, node.y);
  await page.waitForTimeout(900);
  const c = await crumb();
  ok(/Back/.test(String(c)), 'and tapping it opens that part', String(c));
}
const rows = await inLog(
  "return root.querySelectorAll('[data-testid^=\"addex-pick-\"]').length;");
ok(rows > 0, 'with lifts under it', String(rows));
ok((await tap('addex-back')) === 'ok', 'and a way back to the body');
await page.waitForTimeout(600);
ok(await inLog("return !!root.querySelector('[data-testid=\"addex-map\"]');"),
   'which returns to the figure');

console.log('\n=== the names work too, for anyone who prefers them ===\n');

ok((await tap('addex-group-abs')) === 'ok', 'a named part can be chosen');
await page.waitForTimeout(700);
ok(/Abs/.test(String(await crumb())), 'and opens it', String(await crumb()));
const absRows = await inLog(
  "return Array.from(root.querySelectorAll('[data-testid^=\"addex-pick-\"]'))" +
  ".slice(0,3).map(e => e.textContent.replace(/\\s+/g,' ').trim());");
ok(absRows.length > 0, 'with real ab exercises in it, which it had none of',
   JSON.stringify(absRows));

console.log('\n=== search still cuts across the whole body ===\n');

await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root.querySelector('[data-testid="addex-search"]');
  el.focus(); el.value = 'curl';
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(800);
ok((await crumb()) === null, 'typing leaves the chosen part behind', String(await crumb()));
const found = await inLog(
  "return Array.from(root.querySelectorAll('[data-testid^=\"addex-pick-\"]'))" +
  ".slice(0,4).map(e => e.textContent.replace(/\\s+/g,' ').trim());");
ok(found.length > 0 && /curl/i.test(found.join(' ')),
   'and searches every muscle, not just the one that was open',
   JSON.stringify(found));

console.log('\n=== Replace opens on the part it is replacing ===\n');

await tap('addex-close');
await page.waitForTimeout(600);
await page.locator('[data-testid="exercise-menu-0"]').locator('visible=true').first().press('Enter');
await page.waitForTimeout(800);
ok(await inLog("return !!root.querySelector('[data-testid=\"exercise-sheet\"]');"),
   'the exercise sheet opens');
ok((await tap('exact-swap')) === 'ok', 'and Swap is offered');
await page.waitForTimeout(900);

/* Incline Machine Press is a chest lift, so the picker opens on Chest.
   Most replacements stay in the same place; opening anywhere else costs
   a tap every single time. */
ok(/Chest/.test(String(await crumb())),
   'and it opens on Chest, because that is what is being replaced', String(await crumb()));
ok((await tap('addex-back')) === 'ok', 'with the whole body one tap away');
await page.waitForTimeout(600);
ok(await inLog("return !!root.querySelector('[data-testid=\"addex-map\"]');"),
   'which is the same figure');

console.log('\n=== and the split builder, where most lifts get added ===\n');

/* Planning a split is where somebody adds the MOST exercises, so it is
   the worst screen to make them scroll a catalogue. It had the log's
   old arrangement AND a worse fault behind it: it fetched a test
   fixture for its library, which 404s in any deployed build, so the
   inline fallback of fourteen exercises stood in production. */
await tap('addex-close');
await page.waitForTimeout(500);
await page.evaluate(() => { try { localStorage.setItem('lk_openSplit', 's1'); } catch (e) {} });
await page.evaluate(() => window.DEMO.go('split-builder'));
await page.waitForTimeout(1300);

const inSB = (fn) => page.evaluate((f) => {
  const rec = window.DEMO.screens['split-builder'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  // eslint-disable-next-line no-new-func
  return new Function('root', f)(root);
}, fn);

const addCtl = await inSB(
  "const b = root.querySelector('[data-testid^=\"add-exercise-\"]');" +
  "return b ? b.getAttribute('data-testid') : null;");
ok(!!addCtl, 'a day offers Add exercise', String(addCtl));
if (addCtl) {
  ok((await tap(addCtl)) === 'ok', 'and it opens');
  await page.waitForTimeout(900);
  ok(await inSB("return !!root.querySelector('[data-testid=\"pick-map\"]');"),
     'on the body, the same as the log');
  const sbSvg = await inSB("const f = root.querySelector('#pick-fig'); return f ? f.innerHTML.length : 0;");
  ok(sbSvg > 1000, 'with the figure drawn', sbSvg + ' bytes');
  const sbGroups = await inSB(
    "return root.querySelectorAll('[data-testid^=\"pick-group-\"]').length;");
  ok(sbGroups === 12, 'and every part of the body', String(sbGroups));

  ok((await tap('pick-group-abs')) === 'ok', 'a part can be chosen');
  await page.waitForTimeout(700);
  const sbRows = await inSB(
    "return Array.from(root.querySelectorAll('[data-testid]'))" +
    ".filter(e => /^pick-\\d+$/.test(e.getAttribute('data-testid')))" +
    ".slice(0,3).map(e => e.textContent.replace(/\\s+/g,' ').trim());");
  ok(sbRows.length > 0, 'with real lifts under it, not fourteen seeds',
     JSON.stringify(sbRows));
  /* The seed fallback had no ab exercises at all, so anything here that
     names one proves the real catalogue is loaded. */
  ok(/sit-up|crunch|ab /i.test(sbRows.join(' ')),
     'from the real catalogue, which the seed list never had',
     JSON.stringify(sbRows));
}

ok(!errs.length, 'nothing throws through any of it', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
