/* THE SAME WORDS, WHEREVER YOU TYPE THEM.

   A lift is searched for in three places: the exercise library, the Add
   and Replace sheet in a live workout, and the picker in the split
   builder. Only the library ever split what was typed into words. The
   other two did one plain substring match on the name, so they could only
   ever find the words in the order the catalogue happens to spell them:
   "incline smith" found the lift in the library and nothing at all in the
   sheet you actually stand in front of between sets, and the catalogue
   calls it "Smith Machine Incline".

   That is the complaint in the owner's own words: machines and exercises
   get named in a different order, incline Smith or Smith machine incline,
   shoulder press machine or machine shoulder press.

   So there is one search now, in exercises.js, and all three call it.
   What this holds is that they AGREE: his own examples, plus a muscle, a
   piece of equipment, a shorthand, and a query that should find nothing,
   run against all three screens with the same answer expected from each.

   Agreement means the same first lift and the same lift either found or
   not found. The three do not show identical lists -- the log pages its
   rows, the builder cuts off at sixty -- so the test compares the top of
   each list, which is what a person actually reads. */
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

/* His examples first, then the ones that say the reach did not shrink on
   the way across: a muscle, a piece of equipment, a shorthand a lifter
   types, a plural, and a query with no answer. */
const QUERIES = [
  { q: 'incline smith', want: true },
  { q: 'smith incline', want: true },
  { q: 'shoulder press machine', want: true },
  { q: 'machine shoulder press', want: true },
  { q: 'bench', want: true },
  { q: 'db press', want: true },
  { q: 'cable fly', want: true },
  { q: 'hamstrings', want: true },
  { q: 'barbell', want: true },
  { q: 'curls', want: true },
  { q: 'zebra trombone', want: false }
];

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
  /* A logged lift, on purpose: the log's picker floats what you have
     already done to the top of a BROWSE, and the test is here partly to
     hold that it does not do it to a search and quietly disagree with
     the library about what "bench" means. */
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
const on = (screen, fn) => page.evaluate(({ s, f }) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  // eslint-disable-next-line no-new-func
  return new Function('root', f)(root);
}, { s: screen, f: fn });

/* Typing, rather than setting a value. Each screen reads the field on
   input, so a value alone would leave the state behind the list stale. */
const type = (screen, sel, q) => page.evaluate(({ s, sel, q }) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector(sel);
  if (!el) return false;
  el.focus();
  el.value = q;
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  return true;
}, { s: screen, sel, q });

const titles = (screen, sel) => on(screen,
  "return Array.from(root.querySelectorAll('" + sel + "'))" +
  ".map(e => { const t = e.querySelector('.row__title'); " +
  "return (t ? t.textContent : e.textContent).replace(/\\s+/g,' ').trim(); })" +
  ".filter(Boolean).slice(0, 5);");

/* ---- the three screens, each opened where a lift is searched for ---- */

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(600);
await tap('start-today');
await page.waitForTimeout(1000);
ok((await tap('btn-add-exercise')) === 'ok', 'the log offers Add exercise');
await page.waitForTimeout(900);
ok(await on('workout-log', "return !!root.querySelector('[data-testid=\"addex-search\"]');"),
   'with a search field on it');

await page.evaluate(() => { try { localStorage.setItem('lk_openSplit', 's1'); } catch (e) {} });

const readLibrary = async (q) => {
  await type('exercise-library', '[data-testid="search-input"]', q);
  await page.waitForTimeout(260);
  return titles('exercise-library', '[data-testid^="row-ex-"]');
};
const readLog = async (q) => {
  await type('workout-log', '[data-testid="addex-search"]', q);
  await page.waitForTimeout(260);
  return titles('workout-log', '[data-testid^="addex-pick-"]');
};
const readBuilder = async (q) => {
  await type('split-builder', '[data-testid="pick-search"]', q);
  await page.waitForTimeout(260);
  return on('split-builder',
    "return Array.from(root.querySelectorAll('[data-testid]'))" +
    ".filter(e => /^pick-\\d+$/.test(e.getAttribute('data-testid')))" +
    ".map(e => { const t = e.querySelector('.row__title'); " +
    "return (t ? t.textContent : e.textContent).replace(/\\s+/g,' ').trim(); })" +
    ".slice(0, 5);");
};

/* Each screen is visited once per query rather than once per screen: the
   log's sheet and the builder's picker both close when the screen behind
   them changes, so the order here is the cheap one. */
const results = {};
for (const { q } of QUERIES) results[q] = {};

await page.evaluate(() => window.DEMO.go('exercise-library'));
await page.waitForTimeout(900);
for (const { q } of QUERIES) results[q].library = await readLibrary(q);
await readLibrary('');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(700);
for (const { q } of QUERIES) results[q].log = await readLog(q);
await readLog('');
await tap('addex-close');
await page.waitForTimeout(500);

await page.evaluate(() => window.DEMO.go('split-builder'));
await page.waitForTimeout(1300);
const addCtl = await on('split-builder',
  "const b = root.querySelector('[data-testid^=\"add-exercise-\"]');" +
  "return b ? b.getAttribute('data-testid') : null;");
ok(!!addCtl, 'a split day offers Add exercise', String(addCtl));
ok((await tap(addCtl)) === 'ok', 'and the picker opens');
await page.waitForTimeout(900);
for (const { q } of QUERIES) results[q].builder = await readBuilder(q);

console.log('\n=== the same words, on all three ===\n');

for (const { q, want } of QUERIES) {
  const r = results[q];
  const found = (a) => a && a.length > 0;
  const agreeFound = found(r.library) === found(r.log) && found(r.library) === found(r.builder);
  ok(agreeFound, `"${q}" — all three agree on whether there is anything`,
     `library ${r.library.length}, log ${r.log.length}, builder ${r.builder.length}`);
  ok(found(r.library) === want, `"${q}" — ${want ? 'finds something' : 'finds nothing'}`,
     r.library.slice(0, 2).join(' | ') || 'nothing');
  if (!want) continue;
  const top = [r.library[0], r.log[0], r.builder[0]];
  ok(top[0] && top[0] === top[1] && top[0] === top[2],
     `"${q}" — and on which lift comes first`, top.join('  /  '));
}

console.log('\n=== the order the words come in does not matter ===\n');

/* The complaint itself, stated as the thing it is: two orderings of the
   same words are the same search. */
[['incline smith', 'smith incline'], ['shoulder press machine', 'machine shoulder press']]
  .forEach(([a, b]) => {
    ['library', 'log', 'builder'].forEach((where) => {
      const x = results[a][where].join(' | '), y = results[b][where].join(' | ');
      ok(x === y && x.length > 0, `"${a}" and "${b}" are one search on the ${where}`,
         x || 'nothing');
    });
  });

console.log('\n=== the ranking came across with it ===\n');

/* The score is why "bench" opens on the plain barbell bench press rather
   than on whichever close-grip variant sorts first. Moving the matching
   without the ranking would have made the two pickers worse, not better. */
['library', 'log', 'builder'].forEach((where) => {
  const first = results.bench[where][0] || '';
  ok(/^bench/i.test(first), `"bench" opens on a bench press on the ${where}`, first);
});

console.log('\n=== a muscle, a machine, and a plural all still reach ===\n');

['library', 'log', 'builder'].forEach((where) => {
  ok(results.hamstrings[where].length > 0, `a muscle name finds lifts on the ${where}`,
     results.hamstrings[where].slice(0, 2).join(' | '));
  ok(results.barbell[where].length > 0, `a piece of equipment does on the ${where}`,
     results.barbell[where].slice(0, 2).join(' | '));
  /* "curls" against a catalogue that says "Curl". A lifter types both. */
  ok(/curl/i.test(results.curls[where].join(' ')),
     `and "curls" finds a curl on the ${where}`, results.curls[where].slice(0, 2).join(' | '));
});

console.log('\n=== a framed muscle and a typed query do not fight ===\n');

/* Both pickers drop the chosen muscle the moment words are typed: a name
   is a name, and being trapped inside a muscle you chose two taps ago is
   the other way for a search to find nothing. */
/* The field is cleared first: with words in it the picker is showing a
   list, and the body it is framed on is behind that list. */
await readBuilder('');
await page.waitForTimeout(400);
await tap('pick-group-chest');
await page.waitForTimeout(700);
ok(await on('split-builder', "return !!root.querySelector('[data-testid=\"pick-map-zoom\"]');"),
   'the builder frames a muscle');
const framed = await readBuilder('lying leg curl');
ok(framed.length > 0 && /leg curl/i.test(framed[0]),
   'and a query typed against it still reaches the rest of the body', framed[0] || 'nothing');

ok(!errs.length, 'nothing throws through any of it', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
