/* A WORKOUT THAT IS NOT ON THE PLAN.

   Two situations break a Train tab that only offers today's split: you
   are at a different gym with different equipment, and nothing is
   scheduled but you want to lift anyway. The shipped app answered both
   with Quick Start and the rebuild dropped it.

   The fork is the feature. Start empty and add lifts as you reach the
   machines, or say what you are doing first so the session arrives
   loaded and in order rather than being built rep by rep between sets.

   What is checked here is that both roads actually arrive: that Skip
   setup opens a real, empty, recorded session; that planning carries a
   name, a note and an ORDER through the library and into the log; that a
   plan interrupted halfway comes back; and that the note reaches the
   record, which is the whole reason it is asked for -- a thin Tuesday
   with "at the hotel gym" on it is a week away rather than a bad week. */
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

async function fresh() {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
    isMobile: true, hasTouch: true });
  await ctx.addInitScript((d) => {
    try {
      Object.keys(d).forEach((k) => {
        const v = d[k];
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });
    } catch (e) {}
  }, {
    lk_onboarded: 'true', lk_tutorialSeen: 'true',
    lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: true, weightKg: 82,
                  heightCm: 180, age: 31, sex: 'male', goal: 'maintain' },
    lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026', days: [
      { name: 'Push', blocks: [], exercises: [
        { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' }] }] }]
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL_);
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens && window.DEMO.screens.train,
                             null, { timeout: 15000 });
  await page.waitForTimeout(700);
  return { ctx, page, errs };
}

const on = (page, screen, testid) => page.evaluate(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return !!(root && root.querySelector('[data-testid="' + t + '"]'));
}, [screen, testid]);
const tap = async (page, screen, testid) => page.evaluate(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="' + t + '"]');
  if (!el) throw new Error('no ' + s + '/' + t);
  el.click();
}, [screen, testid]);
const typeIn = (page, screen, testid, val) => page.evaluate(([s, t, v]) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root.querySelector('[data-testid="' + t + '"]');
  el.value = v;
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [screen, testid, val]);
const textOf = (page, screen, testid) => page.evaluate(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="' + t + '"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(none)';
}, [screen, testid]);
const waitOn = (page, screen, testid, ms = 9000) => page.waitForFunction(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return !!(root && root.querySelector('[data-testid="' + t + '"]'));
}, [screen, testid], { timeout: ms });

console.log('=== the way in ===\n');

let { ctx, page, errs } = await fresh();
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
ok(await on(page, 'train', 'quick-workout'),
   'Train offers a quick workout beside the scheduled day');

await tap(page, 'train', 'quick-workout');
await waitOn(page, 'train', 'quick-sheet');
ok(await on(page, 'train', 'quick-skip'), 'the fork asks once: skip setup');
ok(await on(page, 'train', 'quick-plan'), 'or plan it first');

console.log('\n=== skip setup ===\n');

await tap(page, 'train', 'quick-skip');
await page.waitForTimeout(900);
ok(await on(page, 'workout-log', 'session-name'), 'it lands in the log');
ok((await textOf(page, 'workout-log', 'session-name')) === 'Quick workout',
   'named as one', await textOf(page, 'workout-log', 'session-name'));

/* An empty session is still a session. The log's own trap was that an
   empty one got ended on the first paint, which cost the resume shelf
   and lost a reload. */
const live = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_liveSession') || 'null'); }
  catch (e) { return null; }
});
ok(!!live, 'and it is on the record, empty or not', JSON.stringify(live && live.name));
const handoffGone = await page.evaluate(() => localStorage.getItem('lk_quickStart'));
ok(!handoffGone, 'the hand-over key is consumed, not left to fire again');
await ctx.close();

console.log('\n=== planning one ===\n');

({ ctx, page, errs } = await fresh());
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
await tap(page, 'train', 'quick-workout');
await waitOn(page, 'train', 'quick-sheet');
await tap(page, 'train', 'quick-plan');
await waitOn(page, 'train', 'quick-details');
ok(true, 'the details step opens');

await typeIn(page, 'train', 'qd-name', 'Hotel session');
await typeIn(page, 'train', 'qd-note', 'at the hotel gym, dumbbells only');
await tap(page, 'train', 'qd-continue');
await page.waitForTimeout(1200);
ok(await on(page, 'exercise-library', 'pick-bar'),
   'the library opens with a bar that says how to get on');
ok((await textOf(page, 'exercise-library', 'pick-review')).indexOf('at least one') > -1,
   'and it will not let you start with nothing',
   await textOf(page, 'exercise-library', 'pick-review'));

/* The library opens on the body, so there are no rows until a search or
   a muscle group narrows it. A person picking lifts does the same thing. */
await typeIn(page, 'exercise-library', 'search-input', 'press');
await page.waitForTimeout(1200);

/* Pick two, one of them twice, because benching twice in one session is
   a real session. */
const ids = await page.evaluate(() => {
  const rec = window.DEMO.screens['exercise-library'];
  const root = rec.root || rec.host.shadowRoot;
  return [...root.querySelectorAll('[data-testid^="add-"]')]
    .map((e) => e.getAttribute('data-testid')).slice(0, 2);
});
ok(ids.length === 2, 'rows carry a picker', JSON.stringify(ids));
if (ids.length === 2) {
  await tap(page, 'exercise-library', ids[0]);
  await page.waitForTimeout(250);
  await tap(page, 'exercise-library', ids[1]);
  await page.waitForTimeout(250);
  await tap(page, 'exercise-library', ids[0]);
  await page.waitForTimeout(300);
}
const picked = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_quickDraft') || 'null'); }
  catch (e) { return null; }
});
ok(picked && picked.picks.length === 3,
   'the same lift can be picked twice and both are counted',
   JSON.stringify(picked && picked.picks.map((p) => p.name)));
ok(picked && picked.note === 'at the hotel gym, dumbbells only',
   'and the note came with it');

console.log('\n=== a plan interrupted comes back ===\n');

await page.reload();
await page.waitForFunction(() => window.DEMO && window.DEMO.screens &&
  window.DEMO.screens['exercise-library'], null, { timeout: 15000 });
await page.waitForTimeout(900);
const after = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_quickDraft') || 'null'); }
  catch (e) { return null; }
});
ok(after && after.picks.length === 3, 'a refresh mid-plan does not cost the picking',
   JSON.stringify(after && after.picks.length));

console.log('\n=== the order, then the session ===\n');

await page.evaluate(() => window.DEMO.go('exercise-library'));
await page.waitForTimeout(500);
await tap(page, 'exercise-library', 'pick-review');
await waitOn(page, 'exercise-library', 'sheet-order');
ok(await on(page, 'exercise-library', 'order-row-0'), 'the order step lists what was picked');

const firstBefore = await textOf(page, 'exercise-library', 'order-row-0');
await tap(page, 'exercise-library', 'order-down-0');
await page.waitForTimeout(300);
const firstAfter = await textOf(page, 'exercise-library', 'order-row-0');
ok(firstBefore !== firstAfter, 'and it can be reordered', firstBefore + ' -> ' + firstAfter);

await tap(page, 'exercise-library', 'order-drop-2');
await page.waitForTimeout(300);
const left = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_quickDraft') || 'null').picks.length; }
  catch (e) { return -1; }
});
ok(left === 2, 'and something picked by mistake removed', String(left));

await tap(page, 'exercise-library', 'order-start');
await page.waitForTimeout(1200);
ok(await on(page, 'workout-log', 'session-name'), 'starting lands in the log');
ok((await textOf(page, 'workout-log', 'session-name')) === 'Hotel session',
   'under the name that was given', await textOf(page, 'workout-log', 'session-name'));
ok((await textOf(page, 'workout-log', 'session-note')).indexOf('hotel gym') > -1,
   'with the note under it', await textOf(page, 'workout-log', 'session-note'));

const cards = await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec.root || rec.host.shadowRoot;
  return [...root.querySelectorAll('[data-testid^="exercise-card-"]')]
    .map((c) => {
      const t = c.querySelector('.exc__name');
      return t ? t.textContent.trim() : '?';
    });
});
ok(cards.length === 2, 'the lifts arrive pre-loaded', JSON.stringify(cards));

const orderKept = await page.evaluate(() => {
  try {
    const d = JSON.parse(localStorage.getItem('lk_quickDraft') || 'null');
    return d === null;
  } catch (e) { return false; }
});
ok(orderKept, 'and the draft is cleared once it has become a session');

ok(errs.length === 0, 'nothing threw anywhere in that', errs.slice(0, 2).join(' | '));

await ctx.close();
await br.close(); site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
