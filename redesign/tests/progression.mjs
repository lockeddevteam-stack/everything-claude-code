/* THE WEIGHT NEVER WENT UP BY ITSELF.

   Double progression is the whole of strength training on a beginner's
   and an intermediate's programme: hold the weight until the reps
   arrive, then move the weight. The app had the two halves of it and
   never joined them. The day knew it wanted eight reps. The log knew you
   had just done ten. And the only thing that would ever propose a
   heavier set was a button marked Suggest, which added a flat 2.5 kg to
   LAST session's top set whatever had happened today -- so it offered a
   rise to somebody who had just failed the set, and offered the same
   2.5 kg to a ten kilo curl and a hundred and eighty kilo squat.

   What is checked here is the rule as the owner described it:

     - set one stands at the weight it was done with, and never receives
       a recommendation, because there is nothing before it to have
       earned one;
     - a set that beats its target reps puts a recommendation on the NEXT
       set, which is set two after a good set one and set three after a
       good set two;
     - a set that only meets the target changes nothing, because meeting
       the target is doing the work, not beating it;
     - a range is beaten at the top of it, and AMRAP is never beaten at
       all because there is no figure to beat;
     - and the figure is never written into the set until it is tapped,
       which is the rule that makes it safe to offer this without being
       asked. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP = path.join(ROOT, '10-final/locked-app.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' }); r.end(await readFile(APP));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const URL_ = 'http://127.0.0.1:' + site.address().port + '/';
const br = await chromium.launch();

const day = (reps) => [
  { id: 111, name: 'Barbell Bench Press', group: 'Chest', muscle: 'Mid Chest', sets: 3, reps: reps },
  { id: 302, name: 'DB Shoulder Press', group: 'Shoulders', muscle: 'Front Delt', sets: 3, reps: reps }
];
const PRIOR_IDS = Array.from({ length: 60 }, (_, i) => 100 + i)
  .concat(Array.from({ length: 40 }, (_, i) => 300 + i));
const PRIOR = [{
  id: 'w0', kind: 'lift', name: 'PPL - Push', date: '2026-09-01', min: 50, sets: 12, kg: 5000,
  exercises: PRIOR_IDS.map((id) => ({ id, name: 'x', muscle: '', sets: [
    { kg: 60, reps: 8, rir: 2, warm: false, done: true },
    { kg: 60, reps: 8, rir: 2, warm: false, done: true },
    { kg: 60, reps: 8, rir: 2, warm: false, done: true }] }))
}];

async function fresh(exercises, profile) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
    isMobile: true, hasTouch: true });
  await ctx.addInitScript((d) => {
    try {
      Object.keys(d).forEach((k) => {
        localStorage.setItem(k, typeof d[k] === 'string' ? d[k] : JSON.stringify(d[k]));
      });
    } catch (e) {}
  }, {
    lk_onboarded: 'true', lk_tutorialSeen: 'true',
    lk_profile: Object.assign({ username: 'cesco', displayName: 'Cesco', useKg: true,
      weightKg: 82, heightCm: 180, age: 31, sex: 'male', goal: 'maintain' }, profile || {}),
    lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026',
                  days: [{ name: 'Push', blocks: [], exercises: exercises }] }],
    lk_history: PRIOR
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL_);
  await page.waitForFunction(
    () => window.DEMO && window.DEMO.screens && window.DEMO.screens.train,
    null, { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.DEMO.go('train'));
  await page.waitForTimeout(700);
  await tap(page, 'train', 'start-today');
  await page.waitForTimeout(1400);
  return { ctx, page, errs };
}

const tap = (page, s, t) => page.evaluate(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = r && r.querySelector('[data-testid="' + t + '"]');
  if (!el) throw new Error('no ' + s + '/' + t);
  el.click();
}, [s, t]);
const has = (page, t) => page.evaluate((t) => {
  const rec = window.DEMO.screens['workout-log'];
  const r = rec.root || rec.host.shadowRoot;
  return !!r.querySelector('[data-testid="' + t + '"]');
}, t);
const textOf = (page, t) => page.evaluate((t) => {
  const rec = window.DEMO.screens['workout-log'];
  const r = rec.root || rec.host.shadowRoot;
  const el = r.querySelector('[data-testid="' + t + '"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(none)';
}, t);
const cell = (page, e, i, f) => textOf(page, 'cell-' + e + '-' + i + '-' + f);

async function type(page, e, i, field, val) {
  await tap(page, 'workout-log', 'cell-' + e + '-' + i + '-' + field);
  await page.waitForTimeout(250);
  for (const ch of String(val)) await tap(page, 'workout-log', 'pad-' + (ch === '.' ? 'dot' : ch));
  await tap(page, 'workout-log', 'pad-done');
  await page.waitForTimeout(250);
}
async function logSet(page, e, i, kgv, reps) {
  await type(page, e, i, 'weight', kgv);
  await type(page, e, i, 'reps', reps);
  await tap(page, 'workout-log', 'done-' + e + '-' + i);
  await page.waitForTimeout(600);
}

console.log('=== a set that beats its target moves the next one ===\n');
{
  const { ctx, page, errs } = await fresh(day('8'));
  await logSet(page, 0, 0, 60, 10);
  ok(!(await has(page, 'sugg-0-0')), 'set one never gets a recommendation of its own');
  ok(await has(page, 'sugg-0-1'), 'the set after it does');
  const line = await textOf(page, 'sugg-0-1');
  ok(line.indexOf('Last set beat the target') > -1, 'and it says what earned it', line);
  ok(line.indexOf('62.5 kg') > -1, 'at one increment up from the weight that was used', line);
  ok(line.indexOf('8') > -1, 'back at the reps the day asks for', line);

  /* THE RULE THAT MAKES THIS SAFE TO DO UNASKED. */
  ok(await cell(page, 0, 1, 'weight') === '60',
     'the set itself is untouched: the cell still ghosts last session',
     await cell(page, 0, 1, 'weight'));
  await tap(page, 'workout-log', 'sugg-take-0-1');
  await page.waitForTimeout(500);
  ok(await cell(page, 0, 1, 'weight') === '62.5',
     'tapping it, and only tapping it, writes the weight', await cell(page, 0, 1, 'weight'));
  ok(await cell(page, 0, 1, 'reps') === '8', 'and the reps with it', await cell(page, 0, 1, 'reps'));
  ok(!(await has(page, 'sugg-0-1')), 'and the offer goes once it has been taken');

  /* Set two, taken and logged at the new weight for ten, moves set three. */
  await type(page, 0, 1, 'reps', 10);
  await tap(page, 'workout-log', 'done-0-1');
  await page.waitForTimeout(700);
  ok(await has(page, 'sugg-0-2'), 'a good second set lands the next one on set three');
  ok((await textOf(page, 'sugg-0-2')).indexOf('65 kg') > -1,
     'up another increment from what set two actually held', await textOf(page, 'sugg-0-2'));
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== meeting the target is not beating it ===\n');
{
  const { ctx, page, errs } = await fresh(day('8'));
  await logSet(page, 0, 0, 60, 8);
  ok(!(await has(page, 'sugg-0-1')),
     'eight reps of a day that asks for eight changes nothing');
  await tap(page, 'workout-log', 'done-0-0');
  await page.waitForTimeout(400);
  await type(page, 0, 0, 'reps', 5);
  await tap(page, 'workout-log', 'done-0-0');
  await page.waitForTimeout(600);
  ok(!(await has(page, 'sugg-0-1')), 'and falling short of it certainly does not');
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== a range is beaten at the top of it ===\n');
{
  const { ctx, page, errs } = await fresh(day('8-12'));
  await logSet(page, 0, 0, 60, 11);
  ok(!(await has(page, 'sugg-0-1')), 'eleven of eight to twelve is still inside the range');
  await tap(page, 'workout-log', 'done-0-0');
  await page.waitForTimeout(400);
  await type(page, 0, 0, 'reps', 12);
  await tap(page, 'workout-log', 'done-0-0');
  await page.waitForTimeout(700);
  ok(await has(page, 'sugg-0-1'), 'reaching the top of it earns the rise');
  ok((await textOf(page, 'sugg-0-1')).indexOf('8') > -1,
     'and the next set starts back at the bottom of the range',
     await textOf(page, 'sugg-0-1'));
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== AMRAP has nothing to beat ===\n');
{
  const { ctx, page, errs } = await fresh(day('AMRAP'));
  await logSet(page, 0, 0, 60, 25);
  ok(!(await has(page, 'sugg-0-1')),
     'twenty-five reps of "as many as you can" is not a figure that was beaten');
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== a day that prescribes nothing falls back to last session ===\n');
{
  const { ctx, page, errs } = await fresh([
    { id: 111, name: 'Barbell Bench Press', group: 'Chest', muscle: 'Mid Chest' },
    { id: 302, name: 'DB Shoulder Press', group: 'Shoulders', muscle: 'Front Delt' }]);
  /* Last session on this lift was 60 x 8, out of the history above. */
  await logSet(page, 0, 0, 60, 9);
  ok(await has(page, 'sugg-0-1'),
     'beating what you did last time is the target when nothing was prescribed');
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== the jump fits the lift ===\n');
{
  /* A flat 2.5 kg is a quarter of a ten kilo curl and a rounding error on
     a heavy squat. One increment up to a hundred kilos, two above it,
     because below that an increment is already more than 2.5% of the bar
     and above it one stops being a progression you can feel. */
  const { ctx, page, errs } = await fresh(day('8'));
  await logSet(page, 0, 0, 200, 10);
  ok((await textOf(page, 'sugg-0-1')).indexOf('205 kg') > -1,
     'two increments on a weight an increment would barely move',
     await textOf(page, 'sugg-0-1'));
  await ctx.close();

  /* And in pounds it is the pound step the keypad offers, not a
     converted kilo. */
  const lb = await fresh(day('8'), { useKg: false });
  await logSet(lb.page, 0, 0, 100, 10);
  ok((await textOf(lb.page, 'sugg-0-1')).indexOf('105 lb') > -1,
     'five pounds, which is the smallest thing on the rack',
     await textOf(lb.page, 'sugg-0-1'));
  ok(lb.errs.length === 0, 'no page errors', lb.errs.slice(0, 2).join(' | '));
  await lb.ctx.close();
  ok(errs.length === 0, 'no page errors on the kilo run', errs.slice(0, 2).join(' | '));
}

console.log('\n=== taking back the set takes back the offer ===\n');
{
  const { ctx, page, errs } = await fresh(day('8'));
  await logSet(page, 0, 0, 60, 10);
  ok(await has(page, 'sugg-0-1'), 'the offer is there');
  await tap(page, 'workout-log', 'done-0-0');
  await page.waitForTimeout(600);
  ok(!(await has(page, 'sugg-0-1')),
     'reopening the set that earned it takes the offer with it');
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

await br.close();
site.close();
console.log(fails === 0
  ? '\nprogression: all ' + checks + ' checks passed'
  : '\nprogression: ' + fails + ' of ' + checks + ' FAILED');
process.exit(fails ? 1 : 0);
