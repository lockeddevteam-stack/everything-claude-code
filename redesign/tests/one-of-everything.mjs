/* AN ACCOUNT WHERE EVERYTHING IS ONE.

   Counts get concatenated with a hard-coded plural because the account
   they are read against always has three of the thing. One split, one
   day, one exercise, one set, one record, one session -- and the copy
   reads "1 days", "1 exercises", "1 sets", "1 records".

   That account is not a corner case. It is EVERY account, on its first
   day, on the screens a new reader sees first. The plural is wrong
   exactly when the reader is newest.

   So this seeds one of everything and sweeps the rendered text of every
   screen for a number one followed by a plural noun. It reports where,
   rather than asserting a list somebody has to keep up to date -- a new
   screen with the same mistake fails this without anybody adding it. */
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

/* ONE of every countable thing this app holds. */
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
  lk_splits: [{ id: 's1', name: 'Solo', created: '9/1/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' }] }] }],
  lk_history: [{ id: 'w1', name: 'Solo - Push', date: '2026-09-13', kind: 'lift',
                 kg: 480, min: 22, sets: 1,
                 exercises: [{ id: 104, name: 'Incline Machine Press',
                               sets: [{ kg: 60, reps: 8, done: true }] }] }],
  lk_prs: [{ exId: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest',
             kg: 60, reps: 8, date: '2026-09-13' }],
  lk_weightLog: [{ date: '2026-09-13', kg: 82 }],
  lk_goals: [{ id: 'g1', text: 'Bench 100', done: false }],
  /* Three rows, one readable in this build's names, one in the shipped
     app's, and one that is neither -- a half-synced row with no name on
     it at all. Shopping used to call .toLowerCase() on that third one
     and take the whole screen down to blank. A list is not worth losing
     over one row that cannot be read. */
  lk_shoppingList: [{ id: 'i1', name: 'Oats', qty: '1 kg', got: false },
                    { id: 'i2', itemName: 'Rice', quantity: '2', unit: 'kg', checked: false },
                    { id: 'i3', quantity: '1', unit: 'kg' }],
  lk_recipes: [{ id: 'r1', name: 'Oats', servings: 1, items: [] }],
  lk_supplements: [{ id: 'su1', name: 'Creatine', dose: '5 g', when: 'daily' }],
  lk_fuelLog: { '2026-09-13': [{ name: 'Oats', kcal: 350, p: 12, c: 60, f: 6 }] }
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + '\n' + String(e.stack || '').split('\n').slice(0,4).join('\n')));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

const routes = await page.evaluate(() => Object.keys(window.DEMO.screens));

/* A number one, a space, and a plural noun. Deliberately a small list of
   nouns rather than a general rule: "1 kg" and "1 min" are correct and a
   general rule would report both. */
const NOUNS = ['exercises', 'sets', 'days', 'lifts', 'records', 'items', 'workouts',
               'sessions', 'reps', 'meals', 'weeks', 'entries', 'photos', 'goals',
               'splits', 'recipes', 'foods', 'blocks', 'supplements', 'minutes'];
const BAD = new RegExp('(?:^|[^\\d.,])1\\s(' + NOUNS.join('|') + ')\\b', 'gi');

const hits = [];
for (const r of routes) {
  if (r === 'onboarding' || r === 'tutorial') continue;
  const mark = errs.length;
  try { await page.evaluate((k) => window.DEMO.go(k), r); } catch (e) { continue; }
  await page.waitForTimeout(700);
  if (errs.length > mark) console.log('   THREW on ' + r + ': ' + errs[mark]);
  const t = await page.evaluate((k) => {
    const rec = window.DEMO.screens[k];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    return root ? (root.textContent || '').replace(/\s+/g, ' ') : '';
  }, r);
  let m;
  BAD.lastIndex = 0;
  while ((m = BAD.exec(t)) !== null) {
    hits.push(r + ': "' + t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 20).trim() + '"');
  }
}

console.log('\n=== one of everything, on every screen ===\n');
ok(routes.length > 10, 'every screen was visited', routes.length + ' screens');
if (hits.length) hits.forEach((h) => console.log('   ' + h));
ok(hits.length === 0, 'and none of them says "1 <plural>"', hits.length + ' found');
ok(!errs.length, 'and nothing throws on an account of ones', errs[0] || '');

console.log('\n=== and a row that cannot be read loses only itself ===\n');

await page.evaluate(() => window.DEMO.go('shopping'));
await page.waitForTimeout(900);
const shop = await page.evaluate(() => {
  const rec = window.DEMO.screens['shopping'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return root ? (root.textContent || '').replace(/\s+/g, ' ') : '';
});
ok(/Oats/.test(shop), 'the row in this build\'s names is listed', shop.slice(0, 90));
ok(/Rice/.test(shop), "and the row in the shipped app's names too");
ok(!/undefined|\[object Object\]/.test(shop), 'and the nameless one is gone, not rendered as a hole',
   (/undefined|\[object Object\]/.exec(shop) || [''])[0] || 'clean');
ok(shop.length > 40, 'and the screen is still a screen, not a blank', shop.length + ' chars');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
