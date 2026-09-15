/* HOLDING THINGS, AND THROWING THEM AWAY.

   Three faults, all of them about what the phone does with a hand.

   NOTHING MAY HIGHLIGHT BLUE. This app is held: hold a grip to pick an
   exercise up, hold a row to open it, hold and drag to throw a set away.
   Every one of those also started a text selection, so the thing under
   the thumb turned blue with a magnifier over it -- the browser answering
   a gesture the app had already claimed. Selection is off everywhere now
   except where typing happens, and that exception has to hold, or the
   cure is worse than the fault.

   REORDERING WITH FULL CARDS IS DRAGGING A DOOR THROUGH A DOORWAY. Three
   hundred pixels of card, moved past other three-hundred-pixel cards,
   covering the gap it is meant to land in. Picking one up now folds every
   card down to its name.

   AND A SWIPE THAT DELETES SHOULD LOOK LIKE ONE BEFORE IT IS ONE. The red
   aura grows with the travel, on a set and on a whole exercise alike,
   because it means the same thing on both. */
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

const br = await chromium.launch();
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
  /* Three lifts, because reordering one is not reordering. */
  lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' },
      { id: 105, name: 'Cable Fly', group: 'Chest', muscle: 'Mid Chest' },
      { id: 106, name: 'Overhead Press', group: 'Shoulders', muscle: 'Front Delts' }] }] }]
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens &&
  window.DEMO.screens['workout-log'], null, { timeout: 15000 });
await page.waitForTimeout(700);

const L = "window.DEMO.screens['workout-log'].root";
const q1 = (sel) => page.evaluate((s) =>
  !!window.DEMO.screens['workout-log'].root.querySelector(s), sel);
const cls = (sel) => page.evaluate((s) => {
  const el = window.DEMO.screens['workout-log'].root.querySelector(s);
  return el ? el.className : '(none)';
}, sel);
const box = (sel) => page.evaluate((s) => {
  const el = window.DEMO.screens['workout-log'].root.querySelector(s);
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
}, sel);

console.log('=== nothing highlights blue ===\n');

/* The browser's own computed value, on real elements across the app, not
   the rule we hoped applied. */
const sel = await page.evaluate(() => {
  const out = { locked: 0, free: 0, freeTags: [], lockedSample: [] };
  for (const name of Object.keys(window.DEMO.screens)) {
    const root = window.DEMO.screens[name].root;
    root.querySelectorAll('button, .row__title, h1, h2, p, span, article')
      .forEach((el) => {
        const v = getComputedStyle(el).userSelect ||
                  getComputedStyle(el).webkitUserSelect;
        if (v === 'none') { out.locked++; if (out.lockedSample.length < 3) out.lockedSample.push(el.tagName); }
        else { out.free++; if (out.freeTags.length < 6) out.freeTags.push(name + ':' + el.tagName + '.' + el.className); }
      });
  }
  return out;
});
ok(sel.locked > 200 && sel.free === 0,
   'no text anywhere in the app can be selected by a held thumb',
   sel.locked + ' locked, ' + sel.free + ' free' +
   (sel.free ? ' — ' + sel.freeTags.join(', ') : ''));

/* And the exception, which matters as much: a field somebody types in is
   still a field they can select in. */
const fields = await page.evaluate(() => {
  const out = { ok: 0, bad: [] };
  for (const name of Object.keys(window.DEMO.screens)) {
    window.DEMO.screens[name].root.querySelectorAll('input, textarea').forEach((el) => {
      const v = getComputedStyle(el).userSelect || getComputedStyle(el).webkitUserSelect;
      if (v === 'text' || v === 'auto') out.ok++;
      else out.bad.push(name + ':' + (el.id || el.type));
    });
  }
  return out;
});
ok(fields.bad.length === 0, 'but every field a person types in still selects',
   fields.ok + ' fields, ' + fields.bad.length + ' broken ' + fields.bad.slice(0, 4).join(', '));

console.log('\n=== picking an exercise up folds the list into tabs ===\n');

/* The log only exists once a session does, so one is started the way a
   person starts one. */
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(600);
const startBtn = page.locator('[data-testid="start-today"]').locator('visible=true').first();
if (await startBtn.count()) await startBtn.click({ timeout: 4000 }).catch(() => {});
await page.waitForTimeout(900);
ok(await q1('[data-testid="grip-0"]'), 'the log is up with its grips');

const tallBefore = (await box('[data-testid="exercise-card-0"]')).h;
const grip = await box('[data-testid="grip-0"]');
const card0 = await box('[data-testid="exercise-card-0"]');
/* The grip reads last in the head now, so it is on the right of it. */
ok(grip.x > card0.x + card0.w / 2, 'the grip is on the right where the thumb is',
   'grip at ' + Math.round(grip.x) + ' of a card ' + Math.round(card0.w) + ' wide');

await page.mouse.move(grip.x + grip.w / 2, grip.y + grip.h / 2);
await page.mouse.down();
await page.waitForTimeout(500);          /* past the 350ms hold */
const draggingClass = await cls('[data-testid="exercise-card-0"]');
ok(draggingClass.indexOf('exc--tab') > -1, 'every card folds to a tab', draggingClass);
ok(draggingClass.indexOf('exc--dragging') > -1, 'and the held one is marked as held');
const otherClass = await cls('[data-testid="exercise-card-1"]');
ok(otherClass.indexOf('exc--tab') > -1 && otherClass.indexOf('exc--dragging') === -1,
   'the others fold too, and they are the ones that wiggle', otherClass);

const tallDuring = (await box('[data-testid="exercise-card-0"]')).h;
ok(tallDuring < tallBefore * 0.6, 'a card is a fraction of its height while folded',
   Math.round(tallBefore) + 'px to ' + Math.round(tallDuring) + 'px');

const wiggles = await page.evaluate(() => {
  const el = window.DEMO.screens['workout-log'].root
    .querySelector('[data-testid="exercise-card-1"]');
  return getComputedStyle(el).animationName;
});
ok(wiggles === 'lk-wiggle', 'and they are actually wiggling', wiggles);

await page.mouse.up();
await page.waitForTimeout(400);
const after = await cls('[data-testid="exercise-card-0"]');
ok(after.indexOf('exc--tab') === -1, 'letting go unfolds them', after);

console.log('\n=== a red aura on anything being thrown away ===\n');

/* The exercise: hold the grip and pull left. */
const g2 = await box('[data-testid="grip-0"]');
await page.mouse.move(g2.x + g2.w / 2, g2.y + g2.h / 2);
await page.mouse.down();
await page.mouse.move(g2.x + g2.w / 2 - 30, g2.y + g2.h / 2, { steps: 6 });
await page.waitForTimeout(120);
const perilNow = await page.evaluate(() => {
  const el = window.DEMO.screens['workout-log'].root
    .querySelector('[data-testid="exercise-card-0"]');
  return { cls: el.className, p: el.style.getPropertyValue('--peril'),
           shadow: getComputedStyle(el).boxShadow };
});
ok(perilNow.cls.indexOf('is-peril') > -1, 'the card takes the aura on the way out',
   perilNow.cls);
/* 30px of an 80px throw is a bit over a third of the way there, and it
   is measured from where the finger landed rather than from where the
   throw was recognised. */
ok(parseFloat(perilNow.p) > 0.3 && parseFloat(perilNow.p) < 0.5,
   'and it grows with the travel rather than snapping on', perilNow.p);
ok(/rgb/.test(perilNow.shadow) && perilNow.shadow !== 'none',
   'the aura is actually drawn', String(perilNow.shadow).slice(0, 60));

/* Not far enough: it comes back. */
await page.mouse.up();
await page.waitForTimeout(400);
const backAgain = await cls('[data-testid="exercise-card-0"]');
ok(backAgain.indexOf('is-peril') === -1, 'a short pull lets it go', backAgain);
ok(await q1('[data-testid="exercise-card-0"]'), 'and the exercise is still there');

/* Far enough: it goes, and it can come back. */
const nBefore = await page.evaluate(() =>
  window.DEMO.screens['workout-log'].root
    .querySelectorAll('[data-testid^="exercise-card-"]').length);
const g3 = await box('[data-testid="grip-0"]');
await page.mouse.move(g3.x + g3.w / 2, g3.y + g3.h / 2);
await page.mouse.down();
await page.mouse.move(g3.x + g3.w / 2 - 140, g3.y + g3.h / 2, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(500);
const nAfter = await page.evaluate(() =>
  window.DEMO.screens['workout-log'].root
    .querySelectorAll('[data-testid^="exercise-card-"]').length);
ok(nAfter === nBefore - 1, 'a full pull removes the exercise',
   nBefore + ' to ' + nAfter);
ok(await q1('[data-testid="toast"]'), 'and says so');
const undo = await q1('[data-testid="toast-action"]');
ok(undo, 'with an undo, which is the only reason a swipe may do this');

if (undo) {
  await page.evaluate(() => window.DEMO.screens['workout-log'].root
    .querySelector('[data-testid="toast-action"]').click());
  await page.waitForTimeout(400);
  const nBack = await page.evaluate(() =>
    window.DEMO.screens['workout-log'].root
      .querySelectorAll('[data-testid^="exercise-card-"]').length);
  ok(nBack === nBefore, 'and undo brings it back', nBefore + ' vs ' + nBack);
}

ok(errs.length === 0, 'nothing threw through any of that', errs.join(' | '));

await br.close(); site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
