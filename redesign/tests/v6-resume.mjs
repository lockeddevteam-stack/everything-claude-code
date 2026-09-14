/* RELOADING, ON DATA THAT CAME FROM THE SHIPPED APP.

   Everything so far runs in one page life. A phone does not: it is
   closed mid-set, the tab is restored a day later, the app is opened
   twice. Two things have to hold across that, and neither has been
   tested on this data.

   The first is that the migrations are stable. They run at load, they
   write what they convert, and a converted device loads again tomorrow
   and runs them again -- so a migration that is not a no-op against its
   own output corrupts a little more on every open. That is the failure
   nobody sees until the numbers have drifted.

   The second is that a session left running comes back. It is held in
   lk_liveSession for exactly this, and a reader who closes the app
   between two sets and loses the first one will not log the second. */
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

console.log('=== closing it and opening it again, on the shipped app\'s data ===\n');

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
await ctx.addInitScript((d) => {
  try {
    if (localStorage.getItem('__staged__')) return;
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
    localStorage.setItem('__staged__', '1');
  } catch (e) {}
}, V6);

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

const boot = async () => {
  await page.goto(DEMO);
  await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 8000 });
  await page.waitForTimeout(700);
};
const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing: ' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable: ' + t; }
  return 'ok';
};
/* Raw storage: the store falls back to the bundled fixture for a key
   this reader never wrote, which would answer these questions with the
   seed's data rather than theirs. */
const snap = () => page.evaluate(() => {
  const raw = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  return {
    history: raw('lk_history'),
    prs: raw('lk_prs'),
    splits: raw('lk_splits'),
    profile: raw('lk_profile'),
    fuel: raw('lk_fuelLog'),
    schema: raw('lk_schema'),
    live: !!raw('lk_liveSession')
  };
});

await boot();
const first = await snap();
ok(!errs.length, 'the first open throws nothing', errs[0] || '');
ok(Array.isArray(first.history) && first.history.length === 2,
   'the shipped app\'s sessions are there', JSON.stringify((first.history || []).map((h) => h.date)));

/* --- the migrations, run again on their own output ------------------ */
errs.length = 0;
await boot();
const second = await snap();
ok(!errs.length, 'opening it a second time throws nothing', errs[0] || '');
ok(JSON.stringify(second.history) === JSON.stringify(first.history),
   'and changes nothing about the history it already converted');
ok(JSON.stringify(second.prs) === JSON.stringify(first.prs),
   'nor the records');
ok(JSON.stringify(second.splits) === JSON.stringify(first.splits),
   'nor the split');
ok(JSON.stringify(second.profile) === JSON.stringify(first.profile),
   'nor the profile');
ok(second.schema === first.schema,
   'and the version marker sits still', String(second.schema));

/* A third, because a drift of one is easy to miss and a drift of two is
   not: anything that moves every time moves here. */
await boot();
const third = await snap();
ok(JSON.stringify(third.history) === JSON.stringify(first.history),
   'and a third open is identical to the first');

/* --- a session left running -------------------------------------- */
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
ok((await tap('start-today')) === 'ok', 'a session starts');
await page.waitForTimeout(800);
ok((await tap('cell-0-0-weight')) === 'ok', 'a weight opens');
await page.waitForTimeout(300);
await tap('pad-6'); await tap('pad-0'); await tap('pad-done');
await page.waitForTimeout(300);
await tap('cell-0-0-reps');
await page.waitForTimeout(300);
await tap('pad-8'); await tap('pad-done');
await page.waitForTimeout(300);
await tap('done-0-0');
await page.waitForTimeout(400);

const mid = await snap();
ok(mid.live, 'and is held where a reload would find it');

/* The phone is closed. */
errs.length = 0;
await boot();
const back = await snap();
ok(!errs.length, 'opening it again mid-session throws nothing', errs[0] || '');
ok(back.live, 'the session left running is still running');
ok(JSON.stringify(back.history) === JSON.stringify(first.history),
   'and the history it was logged against is untouched');

/* AND THE SET IS STILL IN IT. lk_liveSession is the record that a
   session is running -- when it started, which day of which split. The
   weights and reps are the log screen's own, under lk_liveSessionRows,
   tied to that start time so they can never be pasted onto a different
   session. Reading the first key for them found a hundred characters of
   session record and no weight, which is not the set being lost. */
const kept = await page.evaluate(() => {
  const rows = JSON.parse(localStorage.getItem('lk_liveSessionRows') || 'null');
  if (!rows || !rows.exercises) return { found: false };
  let kg = null, reps = null;
  (rows.exercises || []).forEach((e) => (e.sets || []).forEach((st) => {
    if (kg === null && st && st.kg) { kg = st.kg; reps = st.reps; }
  }));
  return { found: true, kg: kg, reps: reps, name: rows.name };
});
ok(kept.found && kept.kg === 60 && kept.reps === 8,
   'with the weight and reps that were logged still in it', JSON.stringify(kept));

/* And the screen shows it, not just the storage. */
await page.evaluate(() => window.DEMO.push('workout-log'));
await page.waitForTimeout(700);
const onScreen = await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="cell-0-0-weight"]');
  return el ? (el.textContent || '').trim() : 'no cell';
});
ok(/60/.test(onScreen), 'and the log shows it where it was left', onScreen);

await br.close();

console.log('');
if (fails) {
  console.log(`${fails} failed — this is a phone being closed and opened`);
  process.exit(1);
}
console.log('the migrations are stable across opens and a running session survives one');
