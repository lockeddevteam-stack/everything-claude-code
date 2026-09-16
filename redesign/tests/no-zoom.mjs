/* ZOOMED IN, WITH NO WAY BACK.

   A double tap zoomed the viewport. Pinch-to-zoom is blocked, on purpose,
   because a two-finger drag over a workout log is a scroll and not a
   zoom. So once a double tap had zoomed in, the one gesture that would
   undo it was the gesture already prevented: the app became a magnified
   fragment of itself with no exit.

   The lock allowed it everywhere that was not a button or a row, on the
   reasoning that text being read is what double-tap-zoom is for. In an
   app it is not. There is no page to zoom into, every screen is laid out
   for the phone, and a second tap landing near a first one happens
   constantly while logging sets and tapping food rows.

   Three locks, because each covers what the others cannot. The viewport
   meta, which Safari honours in a standalone PWA and ignores in a tab.
   touch-action on the document, which covers Chrome. And a preventDefault
   on the second tap, which covers Safari in a tab. Plus a way back if
   something zooms anyway. */
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
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens, null, { timeout: 20000 });
await page.waitForTimeout(700);

console.log('=== the page says it does not zoom ===\n');

const meta = await page.evaluate(() => {
  const m = document.querySelector('meta[name="viewport"]');
  return m ? m.getAttribute('content') : null;
});
ok(/maximum-scale\s*=\s*1/.test(meta || ''),
   'the viewport caps the scale, which a standalone PWA honours', meta);
ok(/user-scalable\s*=\s*no/.test(meta || ''), 'and says so outright');

const ta = await page.evaluate(() => {
  const h = getComputedStyle(document.documentElement).touchAction;
  const b = getComputedStyle(document.body).touchAction;
  return { html: h, body: b };
});
ok(!/pinch-zoom/.test(ta.html) && ta.html !== 'auto' && ta.html !== 'manipulation',
   'and touch-action leaves no pinch or double-tap zoom on the document',
   JSON.stringify(ta));

console.log('\n=== a double tap anywhere is refused ===\n');

/* Two taps in the same place inside 320ms, over plain text rather than a
   control -- which is exactly the case the old lock allowed through. */
const spots = await page.evaluate(() => {
  const root = window.DEMO.screens.home.root;
  const out = [];
  const txt = root.querySelector('h1, .t-body, p');
  if (txt) { const b = txt.getBoundingClientRect();
    out.push({ what: 'a heading', x: Math.round(b.x + 8), y: Math.round(b.y + b.height / 2) }); }
  const btn = root.querySelector('button');
  if (btn) { const b = btn.getBoundingClientRect();
    out.push({ what: 'a button', x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }); }
  return out;
});

for (const s of spots) {
  const prevented = await page.evaluate(async (pt) => {
    let stopped = false;
    const spy = (e) => { if (e.defaultPrevented) stopped = true; };
    /* On window, in the bubble phase: the lock listens on document, and a
       capture listener anywhere above it runs BEFORE the lock rather than
       after, so it would read defaultPrevented while it is still false. */
    window.addEventListener('touchend', spy);
    const fire = (type, x, y) => {
      const t = new Touch({ identifier: 1, target: document.elementFromPoint(x, y) || document.body,
                            clientX: x, clientY: y });
      document.elementFromPoint(x, y).dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true, composed: true,
        touches: type === 'touchend' ? [] : [t], changedTouches: [t] }));
    };
    fire('touchstart', pt.x, pt.y); fire('touchend', pt.x, pt.y);
    await new Promise((r) => setTimeout(r, 60));
    fire('touchstart', pt.x, pt.y); fire('touchend', pt.x, pt.y);
    await new Promise((r) => setTimeout(r, 30));
    window.removeEventListener('touchend', spy);
    return stopped;
  }, s);
  ok(prevented, 'a second tap on ' + s.what + ' within 320ms is prevented');
}

console.log('\n=== and there is a way back if it zooms anyway ===\n');

const recovers = await page.evaluate(async () => {
  const vv = window.visualViewport;
  const meta = document.querySelector('meta[name="viewport"]');
  const before = meta.getAttribute('content');
  Object.defineProperty(vv, 'scale', { configurable: true, get: () => 2 });
  vv.dispatchEvent(new Event('resize'));
  await new Promise((r) => setTimeout(r, 20));
  const during = meta.getAttribute('content');
  await new Promise((r) => setTimeout(r, 160));
  const after = meta.getAttribute('content');
  return { changed: during !== before, restored: after === before };
});
ok(recovers.changed, 'a scale above 1 rewrites the viewport to force it back');
ok(recovers.restored, 'and puts the meta back afterwards, so nothing is left clamped');

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
