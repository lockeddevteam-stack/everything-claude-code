/* THE FIRST DIGIT MUST NOT REBUILD THE KEYPAD.

   The pad opens on last session's number and the first digit replaces it
   whole. That flip also hid a hint line -- "Last session. Type to
   replace it." -- and the hint was rendered CONDITIONALLY, so the first
   digit removed a <p> from the middle of the sheet.

   LKPatch matches unkeyed siblings by position. With the <p> gone, the
   chips, the key grid and the foot each met the stale <p> at the cursor,
   failed sameType(), and were built from scratch. Three whole sections
   replaced on the first tap: their entry animations replayed, the key
   under the finger lost its pressed state, and the sheet jumped. The pad
   bounced, and it bounced exactly once, on the first digit, which is why
   it read as the pad resetting itself.

   The node stays and toggles `hidden` instead. This asserts identity:
   the same elements before and after. */
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

const TYPES = { '.html': 'text/html', '.js': 'text/javascript',
                '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const site = http.createServer(async (q, r) => {
  const u = new URL(q.url, 'http://x').pathname;
  if (u === '/sw.js') { r.writeHead(404); r.end(''); return; }
  try {
    const f = path.join(ROOT, '08-build', u === '/' ? 'workout-log.html' : u);
    const body = await readFile(f);
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'text/plain' });
    r.end(body);
  } catch (e) { r.writeHead(404); r.end(''); }
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
  isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForTimeout(900);

const tap = (id) => page.evaluate((i) => {
  const el = document.querySelector('[data-testid="' + i + '"]');
  if (!el) throw new Error('no ' + i);
  el.click();
}, id);

/* A weight cell that has a previous session behind it, so the pad opens
   pending and the hint is showing -- the case that broke. */
/* A GHOST cell: one carrying last session's number that this session has
   not overwritten. That is the only case that shows the hint, so it is
   the only case where the sheet lost a child on the first digit. A cell
   already filled in this session never showed the hint and never
   reproduced the bug, which is why it went unnoticed on the set you
   happen to be typing into second. */
const cell = await page.evaluate(() => {
  const c = [...document.querySelectorAll('[data-act="edit"][data-field="weight"]')]
    .filter((el) => el.className.includes('cell--empty') &&
                    el.textContent.trim() !== '--');
  return c.length ? c[0].getAttribute('data-testid') : null;
});
ok(!!cell, 'there is a weight cell to open the pad on', cell || '');
await tap(cell);
await page.waitForTimeout(350);

ok(await page.evaluate(() => !!document.querySelector('[data-testid="pad-sheet"]')),
   'the pad opens');

/* The hint is in the DOM either way. That is the fix. */
const hint = await page.evaluate(() => {
  const h = document.querySelector('[data-testid="pad-hint"]');
  return h ? { there: true, shown: getComputedStyle(h).visibility === 'visible' }
           : { there: false };
});
ok(hint.there, 'the hint line is mounted');
ok(hint.shown, 'and it is showing, because this cell is on last session\'s number');

/* Mark the sections so identity can be checked across the repaint, and
   record the sheet's height: a section that is rebuilt is a section that
   re-animates, and a sheet that changes height is the bounce. */
await page.evaluate(() => {
  const sheet = document.querySelector('[data-testid="pad-sheet"]');
  window.__marks = [...sheet.children].map((c, i) => { c.__mark = i; return i; });
  window.__h = sheet.getBoundingClientRect().height;
  window.__n = sheet.children.length;
});

await tap('pad-7');
await page.waitForTimeout(260);

const after = await page.evaluate(() => {
  const sheet = document.querySelector('[data-testid="pad-sheet"]');
  const kids = [...sheet.children];
  return {
    kept: kids.filter((c) => c.__mark !== undefined).length,
    n: kids.length, was: window.__n,
    dh: Math.abs(sheet.getBoundingClientRect().height - window.__h),
    value: (document.querySelector('[data-testid="pad-value"]') || {}).textContent,
    /* Null-safe on purpose: the bug this guards removed the node
       outright, and a crash here would read as a broken test rather
       than as the defect it is. */
    hintGone: !document.querySelector('[data-testid="pad-hint"]'),
    hintHidden: (function (h) {
      return !!h && getComputedStyle(h).visibility === 'hidden';
    })(document.querySelector('[data-testid="pad-hint"]'))
  };
});

ok(after.value === '7', 'the first digit replaces the pending number', after.value);
ok(after.hintHidden, 'and the hint goes away');
ok(!after.hintGone, 'without being torn out of the sheet');
ok(after.n === after.was, 'the sheet still has the same number of sections',
   after.n + ' vs ' + after.was);
ok(after.kept === after.n,
   'and every one of them is the same element, not a rebuilt one',
   after.kept + '/' + after.n + ' survived');
ok(after.dh < 1, 'so the sheet does not change height on the first digit',
   Math.round(after.dh) + 'px');

/* Digits after the first must still append, and DEL must still edit. */
await tap('pad-5');
await page.waitForTimeout(120);
ok((await page.evaluate(() =>
  document.querySelector('[data-testid="pad-value"]').textContent)) === '75',
  'the second digit still appends');
await tap('pad-del');
await page.waitForTimeout(120);
ok((await page.evaluate(() =>
  document.querySelector('[data-testid="pad-value"]').textContent)) === '7',
  'and DEL still deletes');

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
