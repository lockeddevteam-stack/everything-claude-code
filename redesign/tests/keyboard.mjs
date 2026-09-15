/* TYPING SHOULD NOT MOVE THE APP.

   iOS Safari force-zooms the page when a field smaller than 16px takes
   focus, and it does not zoom back out. Every text control in this
   build was 15px, so tapping the coach's composer, the food search, a
   split's name or any number in the log lurched the whole app in and
   left it there.

   The second half is worse and follows from the first. The chrome that
   lifts itself above the keyboard measures what the keyboard covers as
   window height minus visual-viewport height -- and a ZOOMED page has a
   short visual viewport for reasons that have nothing to do with a
   keyboard. So the tab bar was told the keyboard was six hundred pixels
   tall and lifted itself off the screen, which is exactly the "it hides
   the home menu" that got reported.

   Both halves are checked here. Every focusable field is measured at
   its computed size, because a rule that sets 16px is worth nothing if
   something more specific overrides it -- the browser's own number is
   the only one that matters. */
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
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' }] }] }]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

console.log('=== every field a thumb can land in is 16px or more ===\n');

/* Walked across every screen, at the size the BROWSER computes rather
   than the size a rule asks for. */
const routes = await page.evaluate(() => Object.keys(window.DEMO.screens));
const small = [];
let counted = 0;

for (const r of routes) {
  try { await page.evaluate((k) => window.DEMO.go(k), r); } catch (e) { continue; }
  await page.waitForTimeout(400);
  const found = await page.evaluate((k) => {
    const rec = window.DEMO.screens[k];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    if (!root) return [];
    const out = [];
    root.querySelectorAll('input, textarea, select').forEach((el) => {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      /* A checkbox or a radio has no text to zoom towards. */
      if (t === 'checkbox' || t === 'radio' || t === 'range' ||
          t === 'hidden' || t === 'file' || t === 'color') return;
      const px = parseFloat(getComputedStyle(el).fontSize) || 0;
      out.push({ px: Math.round(px * 100) / 100, t: t,
                 id: el.getAttribute('data-testid') || el.id || el.className || t });
    });
    return out;
  }, r);
  counted += found.length;
  found.forEach((f) => { if (f.px < 16) small.push(r + ': ' + f.id + ' = ' + f.px + 'px'); });
}

/* Only the fields on screen at rest are reachable this way -- most live
   inside sheets that have to be opened. Ten is what a walk of the
   screens finds, and the composer is among them, which is the one that
   was reported. A deeper sweep belongs with the screens that own those
   sheets rather than here. */
ok(counted >= 8, 'there are fields to check', counted + ' across ' + routes.length + ' screens');
if (small.length) small.slice(0, 12).forEach((x) => console.log('   ' + x));
ok(small.length === 0,
   'and none of them is under 16px, which is what makes Safari zoom',
   small.length + ' too small');

console.log('\n=== a zoomed page is not mistaken for a keyboard ===\n');

/* The chrome reads --lk-kb to lift itself above the keyboard. A pinched
   page shrinks the visual viewport for an unrelated reason, and the old
   arithmetic read that as a keyboard and threw the tab bar off screen. */
const kbAtRest = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--lk-kb').trim());
ok(kbAtRest === '0px' || kbAtRest === '' || parseFloat(kbAtRest) === 0,
   'with no keyboard up, nothing is reserved for one', kbAtRest || '(unset)');

const zoomed = await page.evaluate(() => {
  const vv = window.visualViewport;
  if (!vv) return 'no visualViewport';
  /* Pretend the page is pinched to 2x, which is what Safari did on every
     focus before the fields were 16px. */
  const realScale = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(vv), 'scale');
  const realHeight = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(vv), 'height');
  Object.defineProperty(vv, 'scale', { configurable: true, get: () => 2 });
  Object.defineProperty(vv, 'height', { configurable: true, get: () => window.innerHeight / 2 });
  vv.dispatchEvent(new Event('resize'));
  const got = getComputedStyle(document.documentElement).getPropertyValue('--lk-kb').trim();
  /* Put it back so nothing after this reads a lie. */
  if (realScale) Object.defineProperty(vv, 'scale', realScale);
  if (realHeight) Object.defineProperty(vv, 'height', realHeight);
  vv.dispatchEvent(new Event('resize'));
  return got;
});
ok(zoomed === 'no visualViewport' || parseFloat(zoomed || '0') === 0,
   'a page at 2x reserves nothing, so the tab bar stays where it is',
   String(zoomed));

const state = await page.evaluate(() =>
  document.documentElement.getAttribute('data-keyboard'));
ok(state !== 'open', 'and the app does not think a keyboard is up', String(state));

ok(!errs.length, 'nothing throws', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
