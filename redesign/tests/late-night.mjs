/* TRAINING AND EATING AFTER DARK, WEST OF GREENWICH.

   Every date in this app is a "YYYY-MM-DD" string, and there are two
   ways to make one. toISOString() gives the UTC calendar; reading the
   local year, month and day gives the reader's own. They are the same
   thing for about half the world and for the whole of it around noon --
   and they differ for exactly the people this app is for: somebody
   training at eight on a Sunday evening in Los Angeles is already on
   Monday in UTC.

   Get that wrong and the app files the session under a day the reader
   has not reached, which is not a cosmetic fault: the session is on the
   wrong day in history, the wrong week in Progress, and the streak that
   depends on consecutive days breaks in a way nothing on screen can
   explain.

   So the browser is pinned to America/Los_Angeles at 20:30 local, which
   is 03:30 the NEXT DAY in UTC, and the app is asked what day it is --
   then made to write dates and asked again. Anything reading the UTC
   calendar shows up as tomorrow. */
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

/* 2026-09-20 is a Sunday. 20:30 in Los Angeles is 03:30 UTC on Monday
   the 21st, so the two calendars disagree for the whole run. */
const LOCAL_DAY = '2026-09-20';
const UTC_DAY = '2026-09-21';
const WHEN = new Date('2026-09-21T03:30:00Z');

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true,
                                  timezoneId: 'America/Los_Angeles' });
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
  lk_history: [{ id: 'w0', name: 'PPL - Push', date: '2026-09-18', kind: 'lift',
                 kg: 480, min: 30, sets: 1,
                 exercises: [{ id: 104, name: 'Incline Machine Press',
                               sets: [{ kg: 60, reps: 8, done: true }] }] }]
});

/* THE CLOCK IS SHIFTED, NOT STOPPED. Playwright's clock.install pins
   time and never lets it tick, so every CSS transition stays mid-flight
   and an element is never "stable" enough to click -- the harness waits
   forever for a button that is sitting right there. Shifting Date by a
   fixed offset instead puts the app on the evening in question while
   leaving setTimeout, rAF and the animations they drive running at real
   speed, which is the only combination that is both the right date and
   a usable page. */
await ctx.addInitScript((targetMs) => {
  const RealDate = Date;
  const delta = targetMs - RealDate.now();
  function Shifted(...args) {
    if (!(this instanceof Shifted)) return new RealDate(RealDate.now() + delta).toString();
    return args.length ? new RealDate(...args) : new RealDate(RealDate.now() + delta);
  }
  Shifted.prototype = RealDate.prototype;
  Shifted.now = () => RealDate.now() + delta;
  Shifted.parse = RealDate.parse;
  Shifted.UTC = RealDate.UTC;
  window.Date = Shifted;
}, WHEN.getTime());

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

console.log('=== the two calendars really do disagree ===\n');

const clocks = await page.evaluate(() => ({
  utc: new Date().toISOString().slice(0, 10),
  local: new Date().getFullYear() + '-' +
         ('0' + (new Date().getMonth() + 1)).slice(-2) + '-' +
         ('0' + new Date().getDate()).slice(-2),
  offset: new Date().getTimezoneOffset()
}));
ok(clocks.local === LOCAL_DAY && clocks.utc === UTC_DAY,
   'the browser is on Sunday locally and Monday in UTC', JSON.stringify(clocks));

console.log('\n=== so the app has to be on the reader\'s day ===\n');

const appToday = await page.evaluate(() => window.LKStore && window.LKStore.today());
ok(appToday === LOCAL_DAY, "LKStore.today() is the reader's Sunday, not UTC's Monday",
   String(appToday));

const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable: ' + String(e.message).split('\n').slice(0,3).join(' | '); }
  return 'ok';
};
const raw = (k) => page.evaluate((key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}, k);

console.log('\n=== and a session trained on Sunday evening is Sunday\'s ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(800);
const startRes = await tap('start-today');
ok(startRes === 'ok', 'the evening session starts', startRes);
await page.waitForTimeout(1000);
ok((await tap('done-0-0')) === 'ok', 'a set is logged');
await page.waitForTimeout(600);
ok((await tap('btn-finish')) === 'ok', 'and it finishes');
await page.waitForTimeout(1200);
ok((await tap('action-save')) === 'ok', 'and is saved');
await page.waitForTimeout(1400);

const hist = await raw('lk_history');
const newest = Array.isArray(hist)
  ? hist.filter((w) => w && w.id !== 'w0')[0] : null;
ok(!!newest, 'the session is written to history', JSON.stringify(newest && newest.date));
ok(newest && String(newest.date).slice(0, 10) === LOCAL_DAY,
   "and filed under the reader's Sunday, not UTC's Monday",
   String(newest && newest.date) + ' (wanted ' + LOCAL_DAY + ')');

console.log('\n=== a split edited on Sunday evening was edited on Sunday ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(700);
await tap('split-s1');
await page.waitForTimeout(500);
ok((await tap('edit-split')) === 'ok', 'the split opens in the builder');
await page.waitForTimeout(1200);
ok((await tap('add-day')) === 'ok', 'a day is added');
await page.waitForTimeout(700);
ok((await tap('save-split')) === 'ok', 'and it saves');
await page.waitForTimeout(1600);

const sp = await raw('lk_splits');
const stamped = sp && sp[0] && sp[0].updated;
ok(stamped === LOCAL_DAY, 'and the edit is stamped Sunday, not tomorrow',
   String(stamped) + ' (wanted ' + LOCAL_DAY + ')');

ok(!errs.length, 'nothing throws training after dark', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
