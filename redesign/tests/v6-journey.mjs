/* DOING A WHOLE THING, ON DATA THAT CAME FROM THE SHIPPED APP.

   Everything before this asks single questions: does the screen render
   this, does this control throw, does this field take a value. None of
   them writes anything and then reads it back. The migrations convert
   what the shipped app left; this asks whether the build can then add to
   it -- whether a session logged today lands correctly on top of a
   history that was converted this morning, and whether the old rows
   survive the new one.

   It runs on the assembled build, because that is what ships, and it
   asserts the data rather than the pixels: a new row in the history, in
   this build's shape, with the converted rows still beside it and still
   converted. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V6 } from './v6-accounts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const DEMO = 'file://' + ROOT + '/10-final/locked-demo.html';

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

console.log('=== a session logged on top of the shipped app\'s history ===\n');

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
await ctx.addInitScript((d) => {
  try {
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
  } catch (e) {}
}, V6);

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(DEMO);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 8000 });
await page.waitForTimeout(700);

/* RAW STORAGE, NOT LKStore.get. The assembled build bundles fixtures.js,
   so a key this account has never written falls back to the seed -- and
   a question like "is a session still running" answered through that
   fallback reads the fixture's running session, not this reader's. The
   store is the right reader for the app and the wrong one for this
   test. */
const read = () => page.evaluate(() => {
  const raw = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const h = raw('lk_history') || [];
  return {
    n: h.length,
    dates: h.map((x) => x && x.date),
    kgs: h.map((x) => x && x.kg),
    names: h.map((x) => x && x.name),
    live: !!raw('lk_liveSession')
  };
});

/* EVERY SCREEN IS IN ITS OWN SHADOW ROOT in the assembled build, and
   document.querySelector does not cross one. Playwright's locators do,
   so every tap below goes through them -- the first draft of this used
   document.querySelector inside evaluate and reported three defects that
   were entirely its own. */
const tap = async (testid) => {
  /* VISIBLE ONLY. Every screen in the assembled build is mounted at
     boot and stays mounted -- eighteen shadow roots, all present in the
     document at once -- so a bare locator for a testid can match a
     control on a screen nobody is looking at. An earlier draft tapped
     an action-save belonging to another screen, was told "ok", and
     reported the session as lost. */
  const l = page.locator(`[data-testid="${testid}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing: ' + testid;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable: ' + testid; }
  return 'ok';
};

/* Which screen a person is actually looking at. */
const showing = () => page.evaluate(() => {
  const s = window.DEMO.screens;
  return Object.keys(s).find((k) => {
    const host = s[k] && s[k].host;
    if (!host || !host.getBoundingClientRect) return false;
    const b = host.getBoundingClientRect();
    return getComputedStyle(host).display !== 'none' && b.width > 0 && b.height > 0;
  }) || 'none';
});

const before = await read();
ok(before.n === 2 && before.dates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
   'the shipped app\'s history arrived converted', JSON.stringify(before.dates));

/* Train, and start what today offers. */
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
errs.length = 0;
const started = await tap('start-today');
await page.waitForTimeout(700);
ok(started === 'ok', 'today\'s session starts from Train', started === 'ok' ? '' : started);
ok(!errs.length, 'and starting it throws nothing', errs[0] || '');

/* Log one set: open the first exercise, put a weight in, tick it. */
errs.length = 0;
/* The first exercise is already open when the log opens, so there is
   nothing to tap to get at it -- tapping the card here CLOSED it and
   took the cells off screen, which read as four dead controls. */
const cell = await tap('cell-0-0-weight');
ok(cell === 'ok', 'the first set\'s weight opens for editing', cell === 'ok' ? '' : cell);
await page.waitForTimeout(350);
if (cell === 'ok') {
  /* The pad, the way a thumb uses it, and then dismissed the way a thumb
     dismisses it. It is a sheet over the log: leaving it open puts a
     scrim over the tick, which is not the tick refusing to work. */
  for (const d of ['pad-6', 'pad-0']) { await tap(d); await page.waitForTimeout(120); }
  const done = await tap('pad-done');
  ok(done === 'ok', 'the pad commits the weight', done === 'ok' ? '' : done);
  await page.waitForTimeout(350);
}

/* AND THE REPS. A weight with no reps is not a working set, and the
   build is right to count it as nothing -- the first draft of this
   filled only the weight, finished a session of zero sets, and read the
   empty result as the save being broken. */
const rcell = await tap('cell-0-0-reps');
ok(rcell === 'ok', 'the reps open for editing too', rcell === 'ok' ? '' : rcell);
if (rcell === 'ok') {
  await page.waitForTimeout(300);
  for (const d of ['pad-8']) { await tap(d); await page.waitForTimeout(120); }
  await tap('pad-done');
  await page.waitForTimeout(350);
}
const ticked = await tap('done-0-0');
ok(ticked === 'ok', 'and the set ticks off', ticked === 'ok' ? '' : ticked);
await page.waitForTimeout(450);
ok(!errs.length, 'logging a set on this history throws nothing', errs[0] || '');

const mid = await read();
ok(mid.live, 'a session is running and held where a reload would find it');

/* Finish it and save. */
errs.length = 0;
const finished = await tap('btn-finish');
ok(finished === 'ok', 'the session finishes', finished === 'ok' ? '' : finished);
await page.waitForTimeout(1000);
ok((await showing()) === 'review', 'and hands the session to the review screen', await showing());
let saved = await tap('action-save');
if (saved !== 'ok') saved = await tap('action-done');
ok(saved === 'ok', 'and saves', saved === 'ok' ? '' : saved);
await page.waitForTimeout(1000);
ok(!errs.length, 'finishing and saving throws nothing', errs[0] || '');

const after = await read();
ok(after.n === before.n + 1,
   'the session is in the history, added rather than replacing',
   `${before.n} -> ${after.n}`);
ok(after.dates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d))),
   'every row still carries an ISO date, the new one included',
   JSON.stringify(after.dates));
ok(after.kgs.every((k) => k === null || k === undefined || typeof k === 'number'),
   'and a number for its volume, not a string with a unit in it',
   JSON.stringify(after.kgs));
ok(before.names.every((n) => after.names.indexOf(n) >= 0),
   'the sessions that came from the shipped app are all still there',
   JSON.stringify(after.names));
ok(!after.live, 'and nothing is left running once it is saved');

/* The screens that read history agree with the store. */
for (const r of ['home', 'train', 'progress']) {
  errs.length = 0;
  await page.evaluate((n) => window.DEMO.go(n), r);
  await page.waitForTimeout(500);
  const text = await page.evaluate((n) => {
    const rec = window.DEMO.screens[n];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    return root ? (root.textContent || '') : '';
  }, r);
  ok(!errs.length, `${r} opens after the session throwing nothing`, errs[0] || '');
  const hole = text.match(/(undefined|NaN|\[object Object\]|Infinity|Invalid Date)/);
  ok(!hole, `${r} shows the new session without a hole`, hole ? `found "${hole[0]}"` : '');
}

await br.close();

console.log('');
if (fails) {
  console.log(`${fails} failed — this is the first thing an upgrading reader does`);
  process.exit(1);
}
console.log('a session logged on converted history lands correctly and leaves the old rows alone');
