/* WHAT THE KEYBOARD COVERS.

   The search sheet slides up from the bottom of the screen. Tapping the
   field inside it opens the keyboard, which on iOS slides over the layout
   viewport rather than resizing it, and the field being tapped ends up
   underneath the keyboard that tapping it summoned.

   --lk-kb has been published on documentElement for a while and the rules
   that read it never fired, for two reasons that only appear once every
   screen is a shadow root. :root does not match a shadow root, so every
   rule written as :root[data-keyboard="open"] .thing is dead inside a
   screen -- which is why the tab bar never got out of the way despite a
   rule saying it should. And a plain rule reading the variable lost to the
   same selector declared earlier in the same adopted constructed
   stylesheet; the variable measurably arrived at the sheet and the
   computed bottom did not move.

   So the offset is applied inline, by chrome.js, to elements that ask for
   it by attribute: data-lk-lift rises, data-lk-duck leaves downwards.
   Inline beats every stylesheet in every root.

   Checked here the only way a headless browser can: visualViewport is
   made to lose height, which is exactly the signal a real keyboard gives. */
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

const KB = 336;
const VH = 852;

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: VH },
  isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('lk_onboarded', 'true');
        localStorage.setItem('lk_tutorialSeen', 'true'); } catch (e) {}
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens.fuel, null, { timeout: 20000 });
await page.evaluate(() => { if (window.LKGo) window.LKGo('fuel'); });
await page.waitForTimeout(600);

const raise = (px) => page.evaluate((h) => {
  const vv = window.visualViewport;
  Object.defineProperty(vv, 'height', { configurable: true, get: () => window.innerHeight - h });
  Object.defineProperty(vv, 'offsetTop', { configurable: true, get: () => 0 });
  vv.dispatchEvent(new Event('resize'));
}, px);

const geom = () => page.evaluate(() => {
  const root = window.DEMO.screens.fuel.root;
  const input = root.querySelector('[data-testid="search-input"]');
  const sheet = input ? input.closest('.sheet') : null;
  const tab = root.querySelector('[data-lk-duck]');
  const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
  return { sheet: box(sheet), input: box(input),
           tabOpacity: tab ? getComputedStyle(tab).opacity : null,
           state: document.documentElement.getAttribute('data-keyboard') };
});

await page.evaluate(() => {
  window.DEMO.screens.fuel.root.querySelector('[data-testid="log-search"]').click();
});
await page.waitForFunction(() =>
  !!window.DEMO.screens.fuel.root.querySelector('[data-testid="search-input"]'), null, { timeout: 8000 });
await page.waitForTimeout(900);

console.log('=== with no keyboard, nothing has moved ===\n');
const shut = await geom();
ok(shut.state === 'shut', 'the app knows there is no keyboard', shut.state);
ok(shut.tabOpacity === '1', 'and the tab bar is where it belongs', shut.tabOpacity);
ok(shut.sheet.bottom > VH - 40, 'the sheet is anchored to the bottom of the screen',
   'bottom ' + shut.sheet.bottom);

console.log('\n=== a keyboard takes 336px and everything gets out of its way ===\n');
await raise(KB);
await page.waitForTimeout(900);
const open = await geom();
const line = VH - KB;

ok(open.state === 'open', 'the keyboard is detected', open.state);
ok(open.input.bottom < line,
   'the field being typed into is above the keyboard, which was the whole bug',
   'field ends at ' + open.input.bottom + ', keyboard starts at ' + line);
ok(open.sheet.bottom <= line,
   'and so is the rest of the sheet, including its buttons',
   'sheet ends at ' + open.sheet.bottom);
ok(open.sheet.top >= 0,
   'without the sheet being pushed off the top instead, which is what lifting alone did',
   'sheet starts at ' + open.sheet.top);
ok(Number(open.tabOpacity) === 0,
   'the tab bar is gone: five destinations nobody is going to, over the field',
   open.tabOpacity);

console.log('\n=== and it all goes back ===\n');
await raise(0);
await page.waitForTimeout(900);
const back = await geom();
ok(back.state === 'shut', 'the keyboard closing is noticed', back.state);
ok(Math.abs(back.sheet.bottom - shut.sheet.bottom) <= 2,
   'the sheet returns to exactly where it was',
   back.sheet.bottom + ' vs ' + shut.sheet.bottom);
ok(back.tabOpacity === '1', 'and the tab bar comes back', back.tabOpacity);

console.log('\n=== the motion is a spring, not a jump ===\n');
const motion = await page.evaluate(() => {
  const root = window.DEMO.screens.fuel.root;
  const input = root.querySelector('[data-testid="search-input"]');
  const sheet = input ? input.closest('.sheet') : null;
  const tab = root.querySelector('[data-lk-duck]');
  return { sheet: getComputedStyle(sheet).transition,
           tab: tab ? getComputedStyle(tab).transition : null };
});
ok(/bottom/.test(motion.sheet), 'the sheet eases to its new place', motion.sheet.slice(0, 60));
ok(/transform/.test(motion.tab || ''), 'and the tab bar slides rather than blinking out',
   (motion.tab || '').slice(0, 60));

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
