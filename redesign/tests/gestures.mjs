/* THE TWO GESTURES THE HANDS EXPECT.

   Both were in the shipped app and neither survived the rebuild: a set
   could only be removed through a menu two taps deep, and exercises could
   only be reordered with arrow buttons. The buttons stay -- they are how
   this works with a keyboard and a screen reader, and a gesture nobody
   can see is not an interface on its own -- but the hand gets its part
   back.

   The numbers are v6's, read out of the shipped build rather than guessed,
   because they were tuned on a phone and they were right:

     swipe    15px of vertical travel hands it back to the scroller, so
              scrolling always wins; 80px is gone; a flick counts short of
              that through a velocity projection; rightward drag rubber-
              bands, because the row only goes one way
     lift     350ms to pick a card up, cancelled by 10px of movement so a
              scroll never lifts anything; the card rides at scale(1.03)
              and the cards below open a gap of exactly one card

   POINTER EVENTS, NOT TOUCH. One path for a finger, a pen and a mouse --
   and the only one a harness can drive honestly, which is why this file
   can exist at all. The first cut was touch-only and could not be tested
   without synthesising TouchEvents into a shadow root, which proved
   nothing about what a thumb does. */
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
      { id: 311, name: 'Cable Lateral Raise', group: 'Shoulders', muscle: 'Side Delt' },
      { id: 411, name: 'Tricep Pushdown', group: 'Arms', muscle: 'Lateral Head' }] }] }]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 9000 });
await page.waitForTimeout(900);

const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable'; }
  return 'ok';
};
const inLog = (fn, arg) => page.evaluate(([f, a]) => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  // eslint-disable-next-line no-new-func
  return new Function('root', 'arg', f)(root, a);
}, [fn, arg]);

const setCount = () => inLog(
  "return root.querySelectorAll('[data-testid^=\"cell-0-\"][data-testid$=\"-weight\"]').length;");
const order = () => inLog(
  "return Array.from(root.querySelectorAll('[data-testid^=\"exercise-card-\"]'))" +
  ".map(c => (c.textContent||'').replace(/\\s+/g,' ').trim().slice(0, 22));");

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
ok((await tap('start-today')) === 'ok', "today's session starts");
await page.waitForTimeout(1000);

console.log('\n=== swiping a set away ===\n');

const before = await setCount();
ok(before === 3, 'the lift starts with three sets', String(before));

/* A short drag that does not reach the threshold must put the row back. */
const cell = await inLog(
  "const e = root.querySelector('[data-testid=\"cell-0-1-weight\"]');" +
  "const b = e.getBoundingClientRect();" +
  "return { x: b.left + b.width / 2, y: b.top + b.height / 2 };");
await page.mouse.move(cell.x, cell.y);
await page.mouse.down();
for (let k = 1; k <= 4; k++) { await page.mouse.move(cell.x - k * 6, cell.y); await page.waitForTimeout(16); }
await page.mouse.up();
await page.waitForTimeout(500);
ok((await setCount()) === 3, 'a short swipe changes nothing', String(await setCount()));

/* Vertical travel belongs to the scroller, however far it goes sideways
   afterwards. */
await page.mouse.move(cell.x, cell.y);
await page.mouse.down();
await page.mouse.move(cell.x, cell.y + 40);
for (let k = 1; k <= 12; k++) { await page.mouse.move(cell.x - k * 10, cell.y + 40); await page.waitForTimeout(16); }
await page.mouse.up();
await page.waitForTimeout(500);
ok((await setCount()) === 3, 'a swipe that began as a scroll stays a scroll', String(await setCount()));

/* And the real thing. */
await page.mouse.move(cell.x, cell.y);
await page.mouse.down();
for (let k = 1; k <= 12; k++) { await page.mouse.move(cell.x - k * 10, cell.y); await page.waitForTimeout(16); }
await page.mouse.up();
await page.waitForTimeout(700);
ok((await setCount()) === 2, 'swiping a set left removes it', String(await setCount()));
ok(!errs.length, 'nothing throws swiping', errs[0] || '');

console.log('\n=== picking an exercise up ===\n');

const was = await order();
ok(was.length === 3, 'three exercises to reorder', String(was.length));

/* A tap on the grip, with no hold, must not move anything. */
const grip = await inLog(
  "const g = root.querySelector('[data-testid=\"grip-0\"]');" +
  "const b = g.getBoundingClientRect();" +
  "const cards = Array.from(root.querySelectorAll('[data-testid^=\"exercise-card-\"]'));" +
  "const mids = cards.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });" +
  "return { x: b.left + b.width / 2, y: b.top + b.height / 2, need: Math.ceil(mids[1] - mids[0]) + 20 };");
await page.mouse.move(grip.x, grip.y);
await page.mouse.down();
await page.mouse.move(grip.x, grip.y + 120);
await page.mouse.up();
await page.waitForTimeout(500);
const afterTap = await order();
ok(afterTap[0] === was[0], 'a grip dragged without holding moves nothing', afterTap[0]);

/* Hold past 350ms, then carry it past the next card's middle.

   THE GAP IS MEASURED AFTER THE HOLD, not before it. Picking a card up
   folds every card down to its name, so the distance to the next one is
   a tab's height and no longer a card's -- measuring first and dragging
   that far now carries the lift to the bottom of the list, which is the
   fold working rather than the drag failing. */
await page.mouse.move(grip.x, grip.y);
await page.mouse.down();
await page.waitForTimeout(450);
const folded = await inLog(
  "const cards = Array.from(root.querySelectorAll('[data-testid^=\"exercise-card-\"]'));" +
  "const mids = cards.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });" +
  "return Math.ceil(mids[1] - mids[0]) + 12;");
const step = Math.ceil(folded / 14);
for (let k = 1; k <= 14; k++) { await page.mouse.move(grip.x, grip.y + k * step); await page.waitForTimeout(16); }
await page.mouse.up();
await page.waitForTimeout(800);

const now = await order();
ok(now[0] === was[1] && now[1] === was[0],
   'holding the grip and dragging down swaps the two lifts', JSON.stringify(now));
ok(now[2] === was[2], 'and leaves the third where it was', now[2]);
ok(!errs.length, 'nothing throws reordering', errs[0] || '');

/* The buttons the gesture was added beside still work, because they are
   the only way to do this without a pointer at all. */
console.log('\n=== and the controls that do not need a hand ===\n');
ok((await tap('grip-0')) === 'ok', 'the grip still opens the reorder controls');
await page.waitForTimeout(400);
const moved = await tap('move-down-0');
ok(moved === 'ok', 'move down is offered', moved);
await page.waitForTimeout(600);
const afterBtn = await order();
ok(afterBtn[0] !== now[0], 'and it moves the exercise', JSON.stringify(afterBtn));
ok(!errs.length, 'nothing throws using the buttons', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
