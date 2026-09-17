/* PINCH THE BODY, NOT THE PAGE.

   The figure is how exercises are found: tap a muscle, get its lifts.
   Choosing a group already frames it and splits it into parts. What it
   could not do was let anybody look closer under their own power, which
   on a calf or a forearm is the difference between choosing a muscle and
   guessing at one.

   Two claims, and they pull against each other. Fingers must move the
   figure. And they must move nothing else: the screen this sits on
   scrolls, and a body that swallowed every touch would break the page
   around it. So at rest the element allows pan-y and a drag scrolls the
   page as before; once zoomed it takes the finger, because panning is
   then the only way to reach what is off-frame.

   Everything here is driven through real TouchEvents on the built demo. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.evaluate(() => {
  localStorage.setItem('lk_onboarded', 'true');
  localStorage.setItem('lk_tutorialSeen', 'true');
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKBodyMap);
await page.evaluate(() => { location.hash = '#/exercise-library'; });
await page.waitForTimeout(800);

/* The figure on the library screen, the one exercises are chosen from. */
const has = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  return !!r.querySelector('.map__svg');
});
ok(has, 'the library draws the figure');

/* A pinch, as two fingers really arrive: touchstart with two touches,
   touchmove with them further apart. */
async function pinch(from, to) {
  return page.evaluate(({ from, to }) => {
    const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
    const svg = r.querySelector('.map__svg');
    const b = svg.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const mk = (id, x, y) => new Touch({ identifier: id, target: svg, clientX: x, clientY: y,
                                         pageX: x, pageY: y, screenX: x, screenY: y });
    const pair = (gap) => [mk(1, cx - gap / 2, cy), mk(2, cx + gap / 2, cy)];
    const fire = (type, touches) => {
      const ev = new TouchEvent(type, { touches, targetTouches: touches, changedTouches: touches,
                                        bubbles: true, cancelable: true });
      svg.dispatchEvent(ev);
      return ev;
    };
    fire('touchstart', pair(from));
    const moved = fire('touchmove', pair(to));
    const prevented = moved.defaultPrevented;
    fire('touchend', []);
    return { prevented };
  }, { from, to });
}

const scale = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const t = r.querySelector('.map__svg .cam').getAttribute('transform') || '';
  const m = /scale\(([\d.]+)\)/.exec(t);
  return m ? Number(m[1]) : 1;
});
const touchAction = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  return getComputedStyle(r.querySelector('.map__svg')).touchAction;
});

ok(await scale() === 1, 'it opens at life size');
ok(/pan-y/.test(await touchAction()), 'and lets the page scroll under a finger while it is there');

/* ---- 1. spreading two fingers zooms in ---------------------------- */
const p1 = await pinch(80, 200);
const zoomed = await scale();
ok(zoomed > 1.6, 'spreading two fingers zooms the figure in', 'scale ' + zoomed);
ok(p1.prevented, 'and the browser is stopped from zooming the page instead');
ok(/none/.test(await touchAction()), 'once zoomed the figure keeps the finger, for panning');

/* ---- 2. pinching back in returns it ------------------------------- */
await pinch(200, 60);
const back = await scale();
ok(back < 1.2, 'pinching in returns it', 'scale ' + back);
ok(/pan-y/.test(await touchAction()), 'and the page scrolls again');

/* ---- 3. it never goes past its own edges or below life size ------- */
await pinch(200, 20);
ok(await scale() === 1, 'it will not go smaller than the whole body');
await pinch(20, 900);
const big = await scale();
ok(big <= 4.0001, 'and not past 4x, where the art is a blur', 'scale ' + big);
const frame = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const t = r.querySelector('.map__svg .cam').getAttribute('transform') || '';
  const m = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(t);
  const s = Number((/scale\(([\d.]+)\)/.exec(t) || [])[1] || 1);
  const VB = { x: -16, y: 8, w: 240, h: 402 };
  const tx = Number(m[1]), ty = Number(m[2]);
  /* The visible window in model space must sit inside the viewBox. */
  return { left: (VB.x - tx) / s, top: (VB.y - ty) / s,
           right: (VB.x + VB.w - tx) / s, bottom: (VB.y + VB.h - ty) / s, VB };
});
ok(frame.left >= frame.VB.x - 0.5 && frame.top >= frame.VB.y - 0.5 &&
   frame.right <= frame.VB.x + frame.VB.w + 0.5 && frame.bottom <= frame.VB.y + frame.VB.h + 0.5,
   'the figure never leaves the frame', JSON.stringify(frame));

/* ---- 4. choosing a muscle still drives the camera itself ---------- */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  const chest = svg.querySelector('[data-g="chest"]');
  chest.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(500);
const onChest = await scale();
ok(onChest > 1.2, 'choosing a muscle pushes the zoom in on it', 'scale ' + onChest);
const parts = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  return { flag: svg.getAttribute('data-parts'),
           n: svg.querySelectorAll('.parts [data-part]').length };
});
ok(parts.flag === 'chest' && parts.n >= 2, 'and divides it into its parts', JSON.stringify(parts));

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
console.log(fails === 0 ? 'body-zoom: all ' + checks + ' checks passed' : 'body-zoom: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
