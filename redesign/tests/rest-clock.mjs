/* A REST THAT KEEPS TIME WITH THE APP SHUT.

   The old rest timer was a number decremented once a second by an
   interval. That is only true while the tab is awake, and the one moment
   the number has to be right is the moment you pick the phone back up --
   which is exactly the moment an interval has been asleep for.

   So the rest is stored as a deadline and shown as that minus now. This
   file proves the two things that follow from it:

     * a rest survives a full reload, reading lower rather than starting
       over or carrying on from where it was interrupted
     * a rest that ran out while the app was gone is over when it returns,
       and says so

   The notification is not tested here. It needs a service worker the
   harness would have to keep alive across a close, and asserting that a
   browser chose to run a background timeout proves nothing about this
   code. What is tested is the claim that matters: the CLOCK is right. */
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
const URL_BASE = 'http://127.0.0.1:' + site.address().port + '/';

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
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' },
      { id: 311, name: 'Cable Lateral Raise', group: 'Shoulders', muscle: 'Side Delt' }] }] }],
  /* A tick only counts a set that has numbers in it, and on a fresh
     account it takes them from last time. So there has to be a last
     time, or the first tap says "needs a weight and reps first" and no
     rest starts -- which is correct behaviour, and not what is under
     test here. */
  lk_history: [{ name: 'PPL - Push', date: '2026-09-07', kind: 'lift', kg: 1440, min: 38, sets: 6,
                 exercises: [{ id: 104, name: 'Incline Machine Press',
                               sets: [{ kg: 60, reps: 8, done: true },
                                      { kg: 60, reps: 8, done: true },
                                      { kg: 60, reps: 7, done: true }] }] }]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

const settle = async () => {
  await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                             null, { timeout: 9000 });
  await page.waitForTimeout(800);
};
await page.goto(URL_BASE);
await settle();

const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable'; }
  return 'ok';
};
const strip = () => page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="rest-remaining"]');
  return el ? el.textContent.replace(/\s+/g, '') : null;
});
const secs = (t) => {
  if (!t) return null;
  const m = /(\d+):(\d+)/.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const stored = () => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_rest') || 'null'); } catch (e) { return null; }
});

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(400);
ok((await tap('start-today')) === 'ok', "today's session starts");
await page.waitForTimeout(900);

console.log('\n=== a rest is a deadline ===\n');

ok((await tap('done-0-0')) === 'ok', 'a set is ticked');
await page.waitForTimeout(700);

const first = secs(await strip());
ok(first !== null && first > 80 && first <= 90, 'the strip starts near 90 seconds', String(first));

const rec = await stored();
ok(!!(rec && rec.endsAt > Date.now()), 'and what is stored is when it ends, not what is left',
   JSON.stringify(rec));

await page.waitForTimeout(3000);
const later = secs(await strip());
ok(later !== null && later <= first - 2, 'it counts down while the screen is open',
   first + ' -> ' + later);

console.log('\n=== and it survives the app going away ===\n');

/* A reload is the closest a harness gets to the app being shut: every
   timer in the page is destroyed and the screen is built again. */
await page.reload();
await settle();
await page.waitForTimeout(500);
const afterReload = secs(await strip());
ok(afterReload !== null, 'the rest strip is still there after a reload', String(afterReload));
ok(afterReload !== null && afterReload < later, 'and reads LOWER, not restarted',
   later + ' -> ' + afterReload);
ok(afterReload !== null && afterReload > later - 25,
   'and it did not race ahead either', String(afterReload));

console.log('\n=== a rest that ran out while you were away is over ===\n');

/* Wind the stored deadline into the past, exactly as three minutes with
   the phone in a pocket would have. */
await page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem('lk_rest'));
  r.endsAt = Date.now() - 4000;
  r.fired = false;
  localStorage.setItem('lk_rest', JSON.stringify(r));
});
await page.reload();
await settle();
await page.waitForTimeout(600);
ok((await strip()) === null, 'the strip is gone, not stuck at a stale number',
   String(await strip()));

console.log('\n=== +30s moves the deadline, not a counter ===\n');

ok((await tap('done-0-1')) === 'ok', 'another set is ticked');
await page.waitForTimeout(700);
const beforeAdd = await stored();
ok((await tap('btn-rest-add')) === 'ok', '+30s is offered');
await page.waitForTimeout(500);
const afterAdd = await stored();
const moved = afterAdd && beforeAdd ? afterAdd.endsAt - beforeAdd.endsAt : 0;
ok(moved >= 29000 && moved <= 31000, 'and it pushed the end back thirty seconds',
   String(Math.round(moved / 1000)) + 's');

ok((await tap('btn-rest-skip')) === 'ok', 'skip is offered');
await page.waitForTimeout(500);
ok((await stored()) === null, 'and skipping clears the deadline', JSON.stringify(await stored()));
ok((await strip()) === null, 'and the strip with it');

ok(!errs.length, 'nothing threw', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
