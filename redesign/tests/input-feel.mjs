/* THE TWO PLACES A FINGER MEETS A NUMBER AND A WORD.

   The keypad in a session and the sentence field in Fuel are the two
   controls somebody uses while doing something else -- mid-set, or with
   a plate in one hand -- and both of them were fighting back.

   The pad went through the screen's whole paint for every digit: record
   the session, persist the rows, patch the header, the list, the tabs,
   the overlay and the toast. Tapped quickly, a key pressed while the
   list was being rebuilt landed on a node that had just been replaced
   and that digit was lost. And the first digit changes the pad's own
   shape, so the sheet was rebuilt under the finger and replayed its
   entry animation -- the jump back up from the bottom.

   The sentence field put the caret at the end of the value after every
   keystroke, because a repaint replaces the field and something has to
   put the caret back. Fine for the first character, wrong for every edit
   after it: going back to fix the front of "eggs and toast" typed the
   correction onto the end and scrambled the line. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' });
  r.end(await readFile(path.join(ROOT, '10-final/locked-app.html')));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
  isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('lk_onboarded', 'true');
        localStorage.setItem('lk_tutorialSeen', 'true'); } catch (e) {}
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
const cdp = await page.context().newCDPSession(page);
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens['workout-log'], null, { timeout: 20000 });
await page.evaluate(() => window.LKGo('workout-log'));
await page.waitForTimeout(1000);

const W = (fn, arg) => page.evaluate(({ src, arg }) =>
  new Function('r', 'a', 'return (' + src + ')(r, a);')(window.DEMO.screens['workout-log'].root, arg),
  { src: fn.toString(), arg });

console.log('=== the keypad answers every tap, at the speed they arrive ===\n');

/* A session with something in it to log against. */
await W((r) => {
  const b = r.querySelector('[data-testid="btn-add-exercise"]') || r.querySelector('[data-testid="empty-add"]');
  if (b) b.click();
});
await page.waitForTimeout(600);
await W((r) => { const b = r.querySelector('[data-testid="addex-group-chest"]'); if (b) b.click(); });
await page.waitForTimeout(600);
await W((r) => { const b = r.querySelector('[data-testid^="addex-pick-"]'); if (b) b.click(); });
await page.waitForTimeout(800);
ok(await W((r) => !!r.querySelector('[data-testid^="cell-"]')), 'a lift is in the session');

await W((r) => { const c = r.querySelector('[data-testid="cell-0-0-weight"]'); if (c) c.click(); });
await page.waitForTimeout(500);
ok(await W((r) => !!r.querySelector('[data-testid="pad-sheet"]')), 'the pad opens on a weight');

/* The sheet node itself, remembered. A rebuild replaces it, and a
   replaced sheet is a sheet that plays its entry animation again. */
await W((r) => { window.__sheet = r.querySelector('[data-testid="pad-sheet"]'); });

const tap = async (key, gap) => {
  const b = await W((r, k) => {
    const el = r.querySelector('[data-testid="pad-' + k + '"]');
    if (!el) return null;
    const q = el.getBoundingClientRect();
    return { x: q.x + q.width / 2, y: q.y + q.height / 2 };
  }, key);
  if (!b) return false;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  if (gap) await page.waitForTimeout(gap);
  return true;
};

/* Four keys in under a fifth of a second, which is what a fast thumb
   does and what used to drop a digit. */
for (const k of ['1', '0', '2', '5']) await tap(k, 35);
await page.waitForTimeout(300);
const typed = await W((r) => (r.querySelector('[data-testid="pad-value"]') || {}).textContent);
ok(typed === '1025', 'four fast taps are four digits', typed);

ok(await W((r) => window.__sheet === r.querySelector('[data-testid="pad-sheet"]')),
   'and the sheet was never rebuilt underneath them');

/* The first digit is the one that changes the pad's shape, so it is the
   one that used to make the sheet jump. */
await W((r) => { const b = r.querySelector('[data-testid="pad-cancel"]'); if (b) b.click(); });
await page.waitForTimeout(400);
await W((r) => { const c = r.querySelector('[data-testid="cell-0-0-reps"]'); if (c) c.click(); });
await page.waitForTimeout(500);
await W((r) => { window.__sheet2 = r.querySelector('[data-testid="pad-sheet"]'); });
await tap('8', 200);
ok(await W((r) => window.__sheet2 === r.querySelector('[data-testid="pad-sheet"]')),
   'the first digit does not rebuild the sheet either');
ok((await W((r) => (r.querySelector('[data-testid="pad-value"]') || {}).textContent)) === '8',
   'and it is the digit that was pressed');

/* Done still commits the ordinary way. */
await W((r) => { const b = r.querySelector('[data-testid="pad-done"]'); if (b) b.click(); });
await page.waitForTimeout(500);
const cell = await W((r) => (r.querySelector('[data-testid="cell-0-0-reps"]') || {}).textContent);
ok(/8/.test(cell || ''), 'and Done writes it to the set', cell);

console.log('\n=== the sentence field is edited where the caret is ===\n');

await page.evaluate(() => window.LKGo('fuel'));
await page.waitForTimeout(1000);
const F = (fn, arg) => page.evaluate(({ src, arg }) =>
  new Function('r', 'a', 'return (' + src + ')(r, a);')(window.DEMO.screens['fuel'].root, arg),
  { src: fn.toString(), arg });

await F((r) => { const b = r.querySelector('[data-testid="log-type"]'); if (b) b.click(); });
await page.waitForTimeout(700);
ok(await F((r) => !!r.querySelector('#mic-text')), 'the sentence field is open');

await F((r) => { r.querySelector('#mic-text').focus(); });
await page.keyboard.type('eggs and toast', { delay: 40 });
await page.waitForTimeout(250);
const first = await F((r) => r.querySelector('#mic-text').value);
ok(first === 'eggs and toast', 'it takes a sentence', first);

for (let i = 0; i < 14; i++) await page.keyboard.press('ArrowLeft');
await page.keyboard.type('three ', { delay: 40 });
await page.waitForTimeout(300);
const fixed = await F((r) => {
  const el = r.querySelector('#mic-text');
  return { v: el.value, sel: el.selectionStart };
});
ok(fixed.v === 'three eggs and toast',
   'and a correction at the front lands at the front', fixed.v);
ok(fixed.sel === 6, 'with the caret still where the typist left it', String(fixed.sel));

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
