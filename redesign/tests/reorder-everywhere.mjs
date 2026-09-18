/* EVERY LIST THAT CAN BE REORDERED, REORDERED THE SAME WAY.

   Four surfaces in this app let you change an order: the exercises in a
   live workout, the lifts in a planned quick workout, the exercises and
   days in the split builder, and the saved cardio favourites. They were
   three implementations and one absence.

   That is worse than it sounds. A gesture is learned once and expected
   everywhere after that, so a list that lifts on a hold and a list that
   lifts on the first pixel are two different controls wearing the same
   clothes -- and the second one steals every scroll that starts on a
   handle. The favourites had no drag at all: two arrows in a corner,
   which is a control you have to go looking for.

   What is checked on each surface, in the same words, because that is
   the point:

   1. A handle exists and is reachable.
   2. A TAP on it lifts nothing. This is the hold, and it is what makes a
      list scrollable while still being reorderable.
   3. A HOLD lifts it, and everything else starts wiggling -- the one
      looping animation in this app, and the thing everyone already knows
      means a thing can be moved.
   4. Dragging past the next row's middle actually changes the order.
   5. Nothing throws.

   The geometry is measured after the lift, never before: the classes
   change row heights, and reading first puts every drop target where the
   rows used to be. That mistake has now been made three times in this
   codebase, so the test makes it impossible to ship a fourth. */
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
  lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026', days: [
    { id: 'd1', name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' },
      { id: 105, name: 'Cable Fly', group: 'Chest', muscle: 'Mid Chest' },
      { id: 106, name: 'Overhead Press', group: 'Shoulders', muscle: 'Front Delts' }] },
    { id: 'd2', name: 'Pull', blocks: [], exercises: [
      { id: 201, name: 'Lat Pulldown', group: 'Back', muscle: 'Lats' }] }] }],
  /* Three favourites, because reordering one is not reordering. */
  lk_cardioFavorites: [
    { id: 'f1', label: 'Morning run', order: 0, defaults: { durationSec: 1800 } },
    { id: 'f2', label: 'Rower 5k', order: 1, defaults: { durationSec: 1320 } },
    { id: 'f3', label: 'Stair mill', order: 2, defaults: { durationSec: 900 } }
  ]
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens && window.DEMO.screens.train,
                           null, { timeout: 15000 });
await page.waitForTimeout(800);

const rootOf = (s) => `(() => { const r = window.DEMO.screens['${s}']; return r && (r.root || (r.host && r.host.shadowRoot)); })()`;
const inScreen = (screen, fn, arg) => page.evaluate(([s, f, a]) => {
  const rec = window.DEMO.screens[s];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  // eslint-disable-next-line no-new-func
  return new Function('root', 'arg', f)(root, a);
}, [screen, fn, arg]);

/* One walk, run against every surface, so a difference between them is a
   failing line rather than something to notice by eye. */
async function surface(name, screen, gripSel, itemSel, labelOf) {
  console.log('\n=== ' + name + ' ===\n');

  const grip = await inScreen(screen,
    "const g = root.querySelector(arg); if (!g) return null;" +
    "const b = g.getBoundingClientRect();" +
    "return { x: b.x + b.width / 2, y: b.y + b.height / 2 };", gripSel);
  ok(!!grip, 'there is a handle to hold', gripSel);
  if (!grip) return;

  const before = await inScreen(screen, labelOf, itemSel);

  await page.mouse.move(grip.x, grip.y);
  await page.mouse.down();
  await page.waitForTimeout(90);
  const early = await inScreen(screen, "return !!root.querySelector('.is-dragging');");
  ok(!early, 'a tap on it lifts nothing, so the list still scrolls');

  await page.waitForTimeout(420);
  const held = await inScreen(screen,
    "const d = root.querySelector('.is-dragging');" +
    "const others = [...root.querySelectorAll('.is-lifting')].filter(n => !n.classList.contains('is-dragging'));" +
    "return { lifted: !!d, wiggling: others.length > 0 && others.every(n =>" +
    "  getComputedStyle(n).animationName === 'lk-wiggle') };");
  ok(held.lifted, 'holding it lifts the row');
  ok(held.wiggling, 'and the rest of the list wiggles, so it says it can be moved',
     JSON.stringify(held));

  /* MEASURED AFTER THE LIFT. The classes change the row heights. */
  const gap = await inScreen(screen,
    "const rows = [...root.querySelectorAll(arg)];" +
    "if (rows.length < 2) return 60;" +
    "const m = rows.map(r => { const b = r.getBoundingClientRect(); return b.top + b.height / 2; });" +
    "return Math.ceil(m[1] - m[0]) + 14;", itemSel);
  const step = Math.max(2, Math.ceil(gap / 12));
  for (let k = 1; k <= 12; k++) {
    await page.mouse.move(grip.x, grip.y + k * step);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  /* LONG ENOUGH FOR THE LANDING. Letting go no longer drops every inline
     style in one frame: the row flies to its slot on v6's spring, which
     for a drop of a row or two is about half a second of visible travel
     and a little longer than that to come fully to rest. 500ms was
     enough only because the drags here are short, which is not a thing
     to depend on. */
  await page.waitForTimeout(900);

  const after = await inScreen(screen, labelOf, itemSel);
  ok(before !== after, 'dragging it down changes the order',
     String(before).slice(0, 30) + ' -> ' + String(after).slice(0, 30));

  const settled = await inScreen(screen, "return !!root.querySelector('.is-dragging');");
  ok(!settled, 'and letting go puts the list down');
}

const firstTitle =
  "const r = root.querySelector(arg); if (!r) return '(none)';" +
  "const t = r.querySelector('.row__title, .exc__name');" +
  "return t ? t.textContent.trim() : r.textContent.trim().slice(0, 30);";

/* ---- 1. the live workout ---- */
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
const start = page.locator('[data-testid="start-today"]').locator('visible=true').first();
if (await start.count()) await start.click({ timeout: 4000 }).catch(() => {});
await page.waitForTimeout(900);
await surface('a workout being done', 'workout-log',
  '[data-testid="grip-0"]', '[data-testid^="exercise-card-"]', firstTitle);

/* ---- 2. the split builder ---- */
await page.evaluate(() => {
  try { localStorage.setItem('lk_openSplit', 's1'); } catch (e) {}
  window.DEMO.go('split-builder');
});
await page.waitForTimeout(1000);
/* The builder reorders while editing, so it is put in that mode first. */
/* The builder reorders in edit mode, which is behind its Edit toggle. */
const edit = await inScreen('split-builder',
  "const b = root.querySelector('[data-testid=\"edit-toggle\"]');" +
  "if (b) { b.click(); return true; } return false;");
await page.waitForTimeout(700);
const hasGrip = await inScreen('split-builder', "return !!root.querySelector('[data-grip]');");
if (hasGrip) {
  /* The exercises inside a day, which are a different list from the days
     themselves -- and the one whose ids are numbers while a day's are
     strings, which is exactly where the drop used to fail. */
  await surface('a split being built', 'split-builder',
    '[data-sortable][data-day] [data-grip]', '[data-sortable][data-day]', firstTitle);
} else {
  ok(false, 'the split builder offers a handle', 'edit mode reached: ' + edit);
}

/* ---- 3. the cardio favourites ---- */
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(600);
await inScreen('train',
  "const b = root.querySelector('[data-action=\"favs\"], [data-testid=\"open-favs\"]');" +
  "if (b) b.click();");
await page.waitForTimeout(700);
const favGrip = await inScreen('train', "return !!root.querySelector('[data-testid^=\"fav-grip-\"]');");
if (favGrip) {
  await surface('the cardio favourites', 'train',
    '[data-testid="fav-grip-f1"]', '[data-sortable]', firstTitle);
} else {
  ok(false, 'the favourites offer a handle', 'sheet not open');
}

console.log('');
ok(errs.length === 0, 'nothing threw on any surface', errs.slice(0, 2).join(' | '));

await br.close(); site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
