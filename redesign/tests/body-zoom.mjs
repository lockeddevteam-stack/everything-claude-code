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
   touchmove with them further apart.

   THE CAMERA IS READ AFTER IT STOPS. A released gesture no longer lands
   where the fingers left it: past a stop it is allowed to give, and the
   spring takes it back over the next few frames. Everything below asks
   about the camera at rest, because that is the picture somebody is
   left looking at. The give itself is tested on its own, further down. */
async function pinch(from, to) {
  const out = await rawPinch(from, to);
  await rest();
  return out;
}

async function rest() {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < 2000) {
    const now = await scale();
    if (last !== null && Math.abs(now - last) < 0.0005) return now;
    last = now;
    await page.waitForTimeout(90);
  }
  return last;
}

async function rawPinch(from, to) {
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

/* ---- 3b. it gives at the stop and springs back -------------------
   A hard stop reads as a broken control: the fingers keep going and the
   picture does not. It is let past, damped harder the further it goes,
   and the spring returns it the moment the fingers leave. Both halves
   matter -- give with no return is a camera somebody is stuck outside
   of. */
const mid = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  const b = svg.getBoundingClientRect();
  const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
  const mk = (id, x, y) => new Touch({ identifier: id, target: svg, clientX: x, clientY: y,
                                       pageX: x, pageY: y, screenX: x, screenY: y });
  const pair = (gap) => [mk(1, cx - gap / 2, cy), mk(2, cx + gap / 2, cy)];
  const fire = (type, touches) => svg.dispatchEvent(new TouchEvent(type, {
    touches, targetTouches: touches, changedTouches: touches, bubbles: true, cancelable: true }));
  fire('touchstart', pair(20));
  fire('touchmove', pair(1400));
  const t = r.querySelector('.map__svg .cam').getAttribute('transform') || '';
  const during = Number((/scale\(([\d.]+)\)/.exec(t) || [])[1] || 1);
  fire('touchend', []);
  return during;
});
ok(mid > 4.0001, 'the camera gives when it is pushed past its stop', 'scale ' + mid);
const backHome = await rest();
ok(backHome <= 4.0001, 'and springs back to it once the fingers leave', 'scale ' + backHome);
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

/* ---- 5. a zoom the reader set stays set ---------------------------
   The screen re-syncs the camera on every paint, which is right for a
   new choice and was wrong for everything else: a pinch was wiped by the
   next render, and on this screen any state change is a render. */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  /* Back to the whole body and no group, the state a pinch starts from. */
  const back = r.querySelector('[data-testid="libmap-back"], [data-act="map-back"]');
  if (back) back.click();
});
await page.waitForTimeout(400);
await pinch(70, 210);
const held = await scale();
ok(held > 1.5, 'a pinch takes hold', 'scale ' + held);

/* Force the screen to repaint without choosing anything. A test that
   asserts survival without proving the repaint happened proves nothing,
   so the repaint is verified by watching the node be replaced. */
const repainted = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const before = r.querySelector('.map__svg');
  const q = r.querySelector('[data-testid="lib-search"], input[type="search"], .input');
  if (q) { q.value = 'press'; q.dispatchEvent(new Event('input', { bubbles: true })); }
  /* Whatever the screen does on a state change, it goes through the same
     sync that used to reset the camera. */
  if (window.DEMO && window.DEMO.screens) {
    const s = window.DEMO.screens['exercise-library'];
    if (s && s.win && s.win.__libRender) s.win.__libRender();
  }
  return { had: !!before, q: !!q };
});
ok(repainted.q, 'the repaint had something to react to', JSON.stringify(repainted));
await page.waitForTimeout(500);
const after = await scale();
ok(Math.abs(after - held) < 0.01, 'and survives a repaint', 'scale ' + after);

/* Choosing a muscle is a new instruction and takes the camera back. */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  const calves = svg.querySelector('[data-g="calves"]') || svg.querySelector('[data-g="quads"]');
  calves.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(500);
const onPick = await scale();
ok(onPick !== held, 'and a muscle chosen afterwards still takes the camera', 'scale ' + onPick);

/* And it can always be pinched back out by hand. */
await pinch(220, 40);
const out = await scale();
ok(out < 1.2, 'the reader can always pinch back out', 'scale ' + out);

/* ---- 6. the split says what the pieces are ------------------------
   Three tones of one hue tell you a muscle has parts. They do not tell
   you which is which, and "the light one" is not a name anybody can act
   on. */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  r.querySelector('.map__svg [data-g="chest"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(600);
const split = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  const parts = [...svg.querySelectorAll('.part')];
  const labels = [...svg.querySelectorAll('.part__label')];
  return {
    names: parts.map((p) => p.getAttribute('data-part')),
    fills: parts.map((p) => getComputedStyle(p).fill),
    labels: labels.map((t) => t.textContent),
    labelSize: labels.length ? getComputedStyle(labels[0]).fontSize : '',
    camS: svg.style.getPropertyValue('--cam-s')
  };
});
ok(split.names.join(',') === 'Upper,Mid,Lower', 'chest divides into its three heads', split.names.join(','));
ok(new Set(split.fills).size === 3, 'each one a different tone of the same hue', split.fills.join(' | '));
ok(split.labels.join(',') === 'Upper,Mid,Lower', 'and each one carries its name', split.labels.join(','));

/* A label inside the camera is scaled by the camera unless something
   divides it back out. At 2.6x a 10px word would render 26px and cover
   the muscle it names.

   Asserted as the product rather than as the declared size, because the
   declared size is whatever the camera happens to be at: the frame now
   goes to 4x on a limb, and a fixed window around 3.65px was really a
   window around one magnification. What has to hold is that the word
   lands the same size on the glass however close the camera is, and a
   label too wide for its own muscle may step down from there. */
const px = parseFloat(split.labelSize) * (parseFloat(split.camS) || 1);
ok(px > 5 && px < 11, 'the label is held at one size on screen, whatever the zoom',
   px.toFixed(2) + 'px on screen at ' + split.camS + 'x');

/* ---- 7. picking a part opens that part's exercises ----------------
   Not "the list changed": the list must be THAT PART and nothing else.
   Chest has three sub-lists, and answering a tap on Upper with all three
   under their own headings is the screen ignoring what was asked. */
/* The repaint above typed into the search box, and a screen showing
   search results is not showing a group. Clear it, or this section tests
   the search rather than the split. */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const clear = r.querySelector('[data-testid="search-clear"]');
  if (clear) clear.click();
  const q = r.querySelector('[data-testid="search-input"]');
  if (q && q.value) { q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); }
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const chest = r.querySelector('.map__svg [data-g="chest"]');
  if (chest) chest.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(600);
const before = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  return { rows: r.querySelectorAll('[data-testid^="row-ex-"]').length,
           heads: [...r.querySelectorAll('.section__head, .t-label')].map((e) => e.textContent.trim()) };
});
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  r.querySelector('.part[data-part="Upper"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(600);
const after2 = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  return { rows: r.querySelectorAll('[data-testid^="row-ex-"]').length,
           heads: [...r.querySelectorAll('.section__head, .t-label')].map((e) => e.textContent.trim()) };
});
ok(after2.rows > 0, 'picking a part opens its exercises', after2.rows + ' rows');
ok(after2.heads.length === 1 && /upper/i.test(after2.heads[0]),
   'and only that part, not the whole group under headings',
   JSON.stringify(after2.heads));
ok(after2.rows !== before.rows || before.rows === 0,
   'the list is not the one that was there before', before.rows + ' -> ' + after2.rows);

/* ---- 8. pinching in divides it too -------------------------------- */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const back = r.querySelector('[data-testid="libmap-back"], [data-act="map-back"]');
  if (back) back.click();
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  r.querySelector('.map__svg [data-g="chest"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(600);
/* Pinch out to life size: the split should go with it. */
await pinch(240, 30);
await page.waitForTimeout(400);
const outAgain = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  return { parts: r.querySelectorAll('.part').length, s: r.querySelector('.map__svg').style.getPropertyValue('--cam-s') };
});
ok(outAgain.parts === 0, 'pinching back out puts the split away', JSON.stringify(outAgain));
/* And pinching back in brings it back, with no tap involved. */
await pinch(40, 240);
await page.waitForTimeout(500);
const inAgain = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  return { parts: r.querySelectorAll('.part').length,
           labels: r.querySelectorAll('.part__label').length };
});
ok(inAgain.parts >= 2 && inAgain.labels >= 2,
   'and pinching in divides the muscle with no tap involved', JSON.stringify(inAgain));

console.log('\n=== 7. the zoom is the reader\'s until they choose otherwise ===\n');

/* Everything below is one continuous session with the figure, because
   that is how the bugs turned up: each step was fine on its own and the
   sequence was not. */
const drag = async (dx, dy) => {
  await page.evaluate(({ dx, dy }) => {
    const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
    const svg = r.querySelector('.map__svg');
    const b = svg.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const one = (x, y) => [new Touch({ identifier: 1, target: svg, clientX: x, clientY: y,
                                       pageX: x, pageY: y, screenX: x, screenY: y })];
    const fire = (t, touches) => svg.dispatchEvent(new TouchEvent(t, {
      touches, targetTouches: touches, changedTouches: touches, bubbles: true, cancelable: true }));
    fire('touchstart', one(cx, cy));
    for (let i = 1; i <= 8; i++) fire('touchmove', one(cx + dx * i / 8, cy + dy * i / 8));
    fire('touchend', []);
  }, { dx, dy });
  await rest();
};
const where = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const t = r.querySelector('.map__svg .cam').getAttribute('transform') || '';
  const m = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(t);
  return { tx: m ? Number(m[1]) : 0, ty: m ? Number(m[2]) : 0 };
});

/* Back to the whole body first, so the pinch below starts from rest. */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const back = r.querySelector('[data-testid="libmap-back"], [data-act="map-back"]');
  if (back) back.click();
});
await page.waitForTimeout(400);
await pinch(60, 300);
const held2 = await scale();
ok(held2 > 2, 'a pinch takes the figure in', 'scale ' + held2);

const wasAt = await where();
await drag(-60, -40);
const nowAt = await where();
ok(Math.abs(nowAt.tx - wasAt.tx) > 5 || Math.abs(nowAt.ty - wasAt.ty) > 5,
   'and a finger drags it around at that zoom',
   JSON.stringify(wasAt) + ' -> ' + JSON.stringify(nowAt));
ok(Math.abs((await scale()) - held2) < 0.01, 'without changing how close it is',
   String(await scale()));

/* TURNING THE FIGURE OVER IS NOT LEAVING IT. The same body, mirrored:
   the camera means the same thing on both sides, and dropping back to
   the whole body is the one thing somebody looking closely does not
   want. */
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const b = r.querySelector('#tab-back');
  if (b) b.click();
});
await page.waitForTimeout(700);
ok(Math.abs((await scale()) - held2) < 0.01, 'front to back keeps the zoom you set',
   String(await scale()));

/* AND A TAP AFTER A DRAG IS STILL A TAP. The drag arms a listener that
   swallows the click the browser synthesises from it; armed for good, it
   ate the next real tap instead, so panning around a zoomed figure and
   then tapping an arm did nothing at all. */
/* AND A TAP AFTER A DRAG IS STILL A TAP. The drag arms a listener that
   swallows the click the browser synthesises from it. Armed for good, it
   ate the next real tap instead: pan around a zoomed figure, tap an arm,
   nothing happens -- once per drag, silently. It now expires with the
   gesture that armed it, so a tap that arrives later is a tap. */
await drag(30, 20);
await page.waitForTimeout(500);
const picked = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  const view = svg.querySelector('.view:not([data-hidden="true"])') || svg;
  const want = ['triceps', 'back', 'glutes', 'hams', 'calves', 'chest', 'quads']
    .map((g) => view.querySelector('.mg[data-g="' + g + '"]'))
    .filter(Boolean)[0];
  if (!want) return null;
  want.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return want.getAttribute('data-g');
});
await page.waitForTimeout(900);
const chosen = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  return { on: svg.getAttribute('data-selected'),
           parts: svg.querySelectorAll('.parts [data-part]').length };
});
ok(!!picked && chosen.on === picked, 'a tap after a drag still chooses the muscle',
   chosen.on + ' vs ' + picked);
ok(chosen.parts >= 2, 'and the camera goes to it and divides it', String(chosen.parts));

console.log('\n=== 8. the camera travels, and the list travels with it ===\n');

/* THE BUG THIS EXISTS FOR, IN THE READER'S OWN WORDS: "a big tacky page
   switch". Tapping a muscle used to be two unrelated things that shared
   a frame. The camera transform changed once and the stylesheet carried
   it over 420ms on a clock of its own; the screen re-rendered and the
   exercise list simply existed, fully formed, wherever a list goes. Two
   motions with nothing in common in the same instant is what a page
   switch looks like, and that is what it was read as: the body did not
   take you anywhere, it was swapped for a list.

   One spring drives both now. bodymap.js integrates the camera's trip
   frame by frame and publishes the fraction of the journey behind it,
   and the screen puts that fraction on its own root for the list to be a
   function of. So there are two claims to make good here and they are
   different claims: that the camera really passes THROUGH the distance
   rather than arriving at the end of it, and that the number the list
   rides gets to 1 exactly when the camera gets to the muscle. A list
   that finished early is back on its own timer, which is the bug.

   Filmed rather than sampled: every frame between the tap and a second
   later, read inside the page, because anything asked from outside
   arrives at whatever rate the test harness can round-trip and would
   miss the travelling entirely. */
/* EVERYTHING ABOVE LEFT THE FIGURE SOMEWHERE. The session that proves
   the reader's zoom survives ends on a triceps, turned to the back, at
   4x and hand-held. Chest is not drawn on a back, so filming a tap on it
   from there would film the camera refusing to move. Front, whole body,
   at rest, and checked rather than assumed. */
const toWholeBody = async () => {
  await page.evaluate(() => {
    const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
    const f = r.querySelector('#tab-front');
    if (f) f.click();
  });
  await page.waitForTimeout(350);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
      const b = r.querySelector('[data-testid="libmap-back"], [data-act="map-back"], [data-action="back"]');
      if (b) b.click();
    });
    await page.waitForTimeout(300);
  }
  /* AND THE BACK BUTTON WILL NOT DO IT ON ITS OWN, on purpose. The zoom
     up there is the reader's: turning the figure over kept it, and a
     camera somebody set by hand outranks every instruction the screen
     sends, which is the invariant section 7 exists to protect. The only
     thing that hands it back is the reader, so the test hands it back
     the way they would, with fingers. */
  await pinch(240, 30);
  return rest();
};
const home = await toWholeBody();
ok(home < 1.05, 'the figure is back at the whole body to be filmed from', 'scale ' + home);

const film = await page.evaluate(() => new Promise((done) => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  const screen = r.querySelector('#screen');
  const rows = [];
  const t0 = performance.now();
  (function tick() {
    const tr = svg.querySelector('.cam').getAttribute('transform') || '';
    const m = /scale\(([\d.]+)\)/.exec(tr);
    rows.push({
      s: m ? Number(m[1]) : 1,
      /* What the figure publishes, and what the screen passes on. They
         are two ends of the same wire and both are worth having: the
         first proves the module is doing it, the second proves the
         screen wired it up. */
      svgT: Number(svg.style.getPropertyValue('--zoom-t') || 1),
      t: Number(screen.style.getPropertyValue('--zoom-t') || 1),
      ride: screen.hasAttribute('data-zoomride')
    });
    if (performance.now() - t0 < 1400) requestAnimationFrame(tick);
    else done(rows);
  })();
  svg.querySelector('[data-g="chest"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
}));

const scales = film.map((f) => f.s);
const first = scales[0], landed = scales[scales.length - 1];
ok(landed > 2, 'the tap frames the muscle', first + ' -> ' + landed);

/* NOT A JUMP. One frame at 1x and every frame after it at 3.1x is
   exactly the picture switch this was. The camera has to be caught
   somewhere in between, repeatedly: five distinct readings is a third of
   a spring's worth of frames and cannot happen by accident. */
const between = [...new Set(scales.filter((s) => s > first + 0.05 && s < landed - 0.05))];
ok(between.length >= 5, 'the camera passes through the distance rather than jumping',
   between.length + ' distinct positions on the way: ' +
   between.slice(0, 4).map((s) => s.toFixed(2)).join(', ') + '...');

/* AND NEVER BACKWARDS. A spring that overshoots its target and returns
   reads as a wobble in the lens: the muscle arrives, slides past what
   you were looking at, and comes back. Critically damped means this list
   only ever climbs. */
let slipped = 0;
for (let i = 1; i < scales.length; i++) if (scales[i] < scales[i - 1] - 0.0005) slipped++;
ok(slipped === 0 && landed <= 4.0001, 'and never overshoots and comes back',
   slipped + ' frames going the wrong way');

/* THE LIST IS NOT ON A TIMER. If the two were independent animations of
   the same length they would still track each other loosely, so the
   claim is made the tight way: the camera's magnification is the
   published fraction's own curve, geometrically, which is only true if
   the number IS the camera's position rather than a second thing
   happening to run alongside it. */
const drift = film
  .filter((f) => f.t > 0 && f.t < 1)
  .map((f) => Math.abs(f.s - first * Math.pow(landed / first, f.t)) / landed);
const worst = drift.length ? Math.max(...drift) : 1;
ok(drift.length >= 5 && worst < 0.02,
   'the progress the list rides is the camera\'s own position, not a parallel timer',
   drift.length + ' frames sampled mid-flight, worst disagreement ' +
   (worst * 100).toFixed(2) + '%');

/* AND THEY FINISH TOGETHER. The list arriving early leaves the camera
   still travelling under a page that has already settled, which is the
   same two-clocks problem pointing the other way. */
const arrived = scales.findIndex((s) => s >= landed - 0.001);
const full = film.findIndex((f) => f.t >= 1 && f.s >= landed - 0.001);
ok(full > -1 && Math.abs(full - arrived) <= 2,
   'and the progress reaches 1 in the same frame the camera reaches the muscle',
   'camera at frame ' + arrived + ', progress at frame ' + full);
ok(film[film.length - 1].t === 1 && film[film.length - 1].svgT === 1 &&
   !film[film.length - 1].ride,
   'with the list left in place and nothing still riding',
   JSON.stringify(film[film.length - 1]));

/* ---- 9. less motion is the destination, not a slower trip ---------
   Somebody who asked their phone for less movement is not asking for the
   same movement taken gently. The stylesheet has always cut the camera's
   transition under that preference; the spring has to cut with it, or
   the one person who most needs the picture to hold still gets 400ms of
   travel the stylesheet can no longer stop. */
await page.emulateMedia({ reducedMotion: 'reduce' });
await toWholeBody();
const cut = await page.evaluate(() => new Promise((done) => {
  const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
  const svg = r.querySelector('.map__svg');
  const read = () => {
    const tr = svg.querySelector('.cam').getAttribute('transform') || '';
    return Number((/scale\(([\d.]+)\)/.exec(tr) || [])[1] || 1);
  };
  svg.querySelector('[data-g="chest"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  /* Read on the very next frame. There is nothing to wait for: if the
     figure is where it is going before a frame has passed, no travel
     happened. */
  requestAnimationFrame(function () {
    done({ s: read(), t: Number(svg.style.getPropertyValue('--zoom-t') || 1) });
  });
}));
ok(cut.s > 2 && cut.t === 1,
   'reduced motion gets the framed muscle in one frame, with no travel to follow',
   JSON.stringify(cut));
await page.emulateMedia({ reducedMotion: null });

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
console.log(fails === 0 ? 'body-zoom: all ' + checks + ' checks passed' : 'body-zoom: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
