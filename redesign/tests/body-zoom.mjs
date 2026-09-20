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

/* ONE FINGER ON THE FIGURE, dragging it. Declared up here rather than
   beside the first section that pans, because the walk down the body
   further up needs it too and a const is not hoisted. */
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

/* ---- 8b. and only the ones that really divide ----------------------

   Ten of the twelve groups are one piece. The inner thigh has no named
   halves and the sliver of trap drawn on the front view has none either,
   and a single band with a single word on it is a caption rather than a
   division. So the figure is walked down the body at a zoom that is past
   every group's threshold, and at every stop two things are asked: what
   is under the middle of the frame, and what the figure has divided.

   The claim is not that some particular muscle is undivided at some
   particular pan, which would be a test of where the body happens to sit.
   It is that nothing is ever drawn as one part, and that a group with no
   parts is never the group the layer belongs to. */
/* A FINGER THAT DOES NOT THROW THE PICTURE. The drag above fires its
   moves back to back, which reads as an enormous flick and carries the
   camera to the stop: fine where the claim is only that something moved,
   useless for walking down the body a step at a time. This one pauses
   between moves, so the speed it hands over is the speed of a finger. */
const creep = async (dy) => {
  await page.evaluate((dy) => {
    const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
    const svg = r.querySelector('.map__svg');
    const b = svg.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const one = (x, y) => [new Touch({ identifier: 1, target: svg, clientX: x, clientY: y,
                                       pageX: x, pageY: y, screenX: x, screenY: y })];
    const fire = (t, touches) => svg.dispatchEvent(new TouchEvent(t, {
      touches, targetTouches: touches, changedTouches: touches, bubbles: true, cancelable: true }));
    fire('touchstart', one(cx, cy));
    window.__creep = { fire, one, cx, cy, dy, i: 0 };
  }, dy);
  for (let i = 1; i <= 6; i++) {
    await page.evaluate((i) => {
      const c = window.__creep;
      c.fire('touchmove', c.one(c.cx, c.cy + c.dy * i / 6));
    }, i);
    await page.waitForTimeout(24);
  }
  await page.evaluate(() => {
    const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
    const svg = r.querySelector('.map__svg');
    svg.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [],
      changedTouches: [], bubbles: true, cancelable: true }));
  });
  await rest();
};

await pinch(240, 30);
await pinch(70, 230);
const walk = [];
for (let i = 0; i < 14; i++) {
  walk.push(await page.evaluate(() => {
    const r = document.getElementById('demo-screen-exercise-library').shadowRoot;
    const svg = r.querySelector('.map__svg');
    const b = svg.getBoundingClientRect();
    const el = r.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    const hit = el && el.closest ? el.closest('[data-g]') : null;
    const layer = svg.querySelector('.parts');
    return { under: hit ? hit.getAttribute('data-g') : null,
             on: layer ? layer.getAttribute('data-g') : null,
             n: svg.querySelectorAll('.part').length,
             labels: svg.querySelectorAll('.part__label').length };
  }));
  await creep(-26);
}
/* The undivided groups, asked of the module itself rather than written
   out here where the list could drift away from the art. Some groups are
   authored as parts and some are cut out of the shapes the figure
   already draws, and only showParts knows about both, so a throwaway
   figure off-screen is asked what each one comes to. */
const ONE_PIECE = await page.evaluate(() => {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:0;top:0;width:393px;height:660px;opacity:0;pointer-events:none';
  document.body.appendChild(host);
  const groups = {};
  ['chest', 'abs', 'biceps', 'back', 'shoulders', 'adduc', 'quads', 'calves', 'forearms']
    .forEach((g) => { groups[g] = { name: g, n: 1 }; });
  const api = window.LKBodyMap.mount(host, { groups, order: Object.keys(groups) });
  const out = [];
  Object.keys(groups).forEach((g) => {
    const n = api.showParts(g, 'front');
    api.clearParts();
    if (!n || n.length < 2) out.push(g);
  });
  host.remove();
  return out;
});
ok(walk.every((w) => w.n === 0 || w.n >= 2),
   'a muscle is never drawn as one part with one name on it',
   JSON.stringify(walk.map((w) => w.under + ':' + w.n)));
ok(walk.every((w) => w.n === 0 || w.labels >= 2),
   'and every part that is drawn carries a name',
   JSON.stringify(walk.map((w) => w.n + '/' + w.labels)));
const touchedOne = walk.filter((w) => ONE_PIECE.indexOf(w.under) > -1);
ok(touchedOne.length > 0,
   'the walk passed over a group that does not divide',
   ONE_PIECE.join(',') + ' | ' + JSON.stringify(walk.map((w) => w.under)));
ok(touchedOne.every((w) => w.on !== w.under),
   'and a group that does not divide is never the one divided',
   JSON.stringify(touchedOne));


console.log('\n=== 7. the zoom is the reader\'s until they choose otherwise ===\n');

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

console.log('\n=== 10. the same camera, under real fingers, in all three pickers ===\n');

/* WHY THIS SECTION EXISTS, AND WHY EVERYTHING ABOVE IT MISSED THE BUG.
   Everything above drives the figure with TouchEvents built in the page
   and dispatched at the svg. That is a touch sequence as far as this
   module's own listeners are concerned, and it is NOT what a finger
   produces: a real touch also emits pointer events, one pointerdown and
   one pointerup per finger. The double-tap listener here counts
   pointerups. Two fingers coming off a pinch are two pointerups in the
   same millisecond, so every real pinch was read as a double tap, and a
   double tap on a zoomed figure sends the camera home. The zoom held
   perfectly under test and collapsed under a hand, three times reported
   and three times not reproduced.

   So this section drives the browser's own input pipeline through CDP
   instead, which is the closest thing to a finger available here, and it
   runs the same matrix on all three pickers rather than on the library
   alone: the module is shared but the screens around it are not, and the
   split builder was throwing the camera away in its own way -- by
   rebuilding the whole figure on every paint.

   The rule for every cell below: the camera is exactly where the reader
   left it. Not close, not nearly. The one exception is choosing a
   different muscle, which is the one instruction that is allowed to move
   it. */

const PICKERS = [
  {
    name: 'exercise library', screen: 'exercise-library', sel: '.map__svg',
    async open(pg) {
      await pg.evaluate(() => { location.hash = '#/exercise-library'; });
      await pg.waitForTimeout(900);
    },
    home: `(r)=>{const cs=r.querySelector('[data-testid="sheet-close"]');
      if(cs)cs.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));
      const q=r.querySelector('[data-testid="search-input"]');
      if(q&&q.value){q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));}
      const m=r.querySelector('[data-action="browse"][data-browse="map"]');
      if(m)m.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));
      const b=r.querySelector('[data-action="back"]');
      if(b){b.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    front: `(r)=>{const f=r.querySelector('#tab-front');if(f){f.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    flip: `(r)=>{const f=r.querySelector('#tab-back');if(f){f.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    row: '[data-testid^="row-ex-"]',
    host: 'map #map'
  },
  {
    name: 'in-workout Add exercise', screen: 'workout-log', sel: '#addex-fig svg',
    async open(pg) {
      await pg.evaluate(() => window.LKGo('workout-log'));
      await pg.waitForTimeout(900);
      await pg.evaluate(() => {
        const r = window.DEMO.screens['workout-log'].root;
        const b = r.querySelector('[data-testid="btn-add-exercise"]') ||
                  r.querySelector('[data-testid="empty-add"]');
        if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      });
      await pg.waitForTimeout(700);
    },
    home: `(r)=>{const b=r.querySelector('[data-testid="addex-back"]');
      if(b){b.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    front: `(r)=>{const f=r.querySelector('[data-testid="addex-view-front"]');if(f){f.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    flip: `(r)=>{const f=r.querySelector('[data-testid="addex-view-back"]');if(f){f.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    row: '[data-act="addex-pick"]',
    host: 'addexmap__host'
  },
  {
    name: 'split builder Add exercise', screen: 'split-builder', sel: '.map__svg',
    async open(pg) {
      await pg.evaluate(() => { localStorage.setItem('lk_openSplit', '__new__'); location.hash = '#/split-builder'; });
      await pg.waitForTimeout(800);
      await pg.evaluate(() => {
        const r = window.DEMO.screens['split-builder'].root;
        const nm = r.querySelector('[data-testid="split-name"]');
        if (nm) { nm.value = 'PPL'; nm.dispatchEvent(new Event('input', { bubbles: true })); }
        const d = r.querySelector('[data-testid="add-day-empty"], [data-action="add-day"]');
        if (d) d.click();
      });
      await pg.waitForTimeout(400);
      await pg.evaluate(() => {
        const r = window.DEMO.screens['split-builder'].root;
        const b = r.querySelector('[data-action="add-exercise"]');
        if (b) b.click();
      });
      await pg.waitForTimeout(600);
    },
    home: `(r)=>{const b=r.querySelector('.sheet [data-testid="pick-back"]');
      if(b){b.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    front: `(r)=>{const f=r.querySelector('[data-testid="pick-view-front"]');if(f){f.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    flip: `(r)=>{const f=r.querySelector('[data-testid="pick-view-back"]');if(f){f.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}return false}`,
    row: '[data-action="pick-add"]',
    host: 'addexmap__host'
  }
];

for (const P of PICKERS) {
  const pctx = await browser.newContext({ viewport: { width: 393, height: 852 },
                                          isMobile: true, hasTouch: true });
  const pg = await pctx.newPage();
  const perrs = [];
  pg.on('pageerror', (e) => perrs.push(String(e)));
  /* Every mount of the PICKER's figure is counted. A screen that rebuilds
     the map on every paint cannot hold a camera however well the module
     behaves, which is exactly what the split builder was doing.

     Hooked before a line of the page has run, because the demo boots
     every screen the moment it loads and the library mounts its figure
     while it does. Wrapped from inside the test instead, after the load,
     it counted zero mounts for a figure that had plainly been mounted:
     the one that mattered was already behind us.

     Only this picker's own figure, though, told apart by the host it
     goes into. Two other kinds of figure share the module and share the
     page: the library's map, which every screen booting up front means
     is mounted even in a run about the workout log, and the two small
     front-and-back pictures on an exercise's own card, which are
     pictures rather than controls and have no camera to lose. Counting
     those made this read "mounted twice" about a figure that had been
     mounted exactly once. */
  await pg.addInitScript(() => {
    window.__HOSTS = [];
    let real;
    Object.defineProperty(window, 'LKBodyMap', {
      configurable: true,
      get: function () { return real; },
      set: function (v) {
        real = v;
        if (!v || typeof v.mount !== 'function' || v.__counted) return;
        const m = v.mount;
        v.mount = function (host) {
          window.__HOSTS.push(String((host && host.className) || '') +
                              ' #' + String((host && host.id) || ''));
          return m.apply(this, arguments);
        };
        v.__counted = true;
      }
    });
  });
  await pg.goto('file://' + ROOT + '/10-final/locked-demo.html');
  await pg.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
  await pg.evaluate(() => {
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
  });
  await pg.reload();
  await pg.waitForFunction(() => window.DEMO && window.LKBodyMap);
  /* Every mount of the PICKER's figure is counted. A screen that rebuilds
     the map on every paint cannot hold a camera however well the module
     behaves, which is exactly what the split builder was doing.

     Not every mount, though. An exercise's own card carries two small
     figures of its own, front and back, with the muscle it works
     shaded -- pictures rather than controls, with no camera to lose.
     Cell 12 opens an exercise, so counting those too made this read
     "mounted twice" about a figure that had been mounted once. They are
     told apart by the host they go into. */
  await P.open(pg);
  const cdp = await pctx.newCDPSession(pg);

  const inRoot = (src, arg) => pg.evaluate(({ src, arg, screen }) => {
    const r = window.DEMO.screens[screen].root;
    /* eslint-disable no-new-func */
    return new Function('r', 'arg', 'return (' + src + ')(r, arg);')(r, arg);
  }, { src, arg, screen: P.screen });

  const box = () => inRoot(`(r,a)=>{const s=r.querySelector(a);if(!s)return null;
    const b=s.getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}}`, P.sel);
  /* The camera as a string, because the claim is that it is EXACTLY where
     it was left and a string compares exactly. */
  const at = () => inRoot(`(r,a)=>{const s=r.querySelector(a);if(!s)return 'no figure';
    const c=s.querySelector('.cam');return (c&&c.getAttribute('transform'))||'none'}`, P.sel);
  const scaleOf = (s) => Number((/scale\(([\d.]+)\)/.exec(s || '') || [])[1] || 1);
  const mounts = () => pg.evaluate((h) => window.__HOSTS
    .filter((x) => x.indexOf(h) > -1), P.host);

  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: pts.map((p, i) => ({ x: Math.round(p.x), y: Math.round(p.y),
                                            id: p.id == null ? i : p.id })) });
  /* The camera is read once it has stopped: a released gesture is allowed
     to overshoot and the spring brings it back, and the picture somebody
     is left looking at is the one after that. */
  const still = async (ms = 1600) => {
    let last = null; const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const now = await at();
      if (now === last) return now;
      last = now; await pg.waitForTimeout(90);
    }
    return last;
  };
  /* AND THE FIGURE HAS TO HAVE STOPPED MOVING BEFORE A FINGER GOES ON IT.
     A split that lands tells the screen, the screen renders, the list for
     that muscle arrives, and the map above it changes height -- so the
     box measured a moment ago is not the box the next touch will land in.
     Every gesture here is dispatched through CDP at real viewport
     coordinates against the real topmost element, so a gesture aimed at a
     stale box lands on whatever has moved into that spot and does
     nothing at all. That is how a drag asserted on a camera it had never
     touched, and it is a race, so it failed on some runs and not others.

     Waited on the box itself rather than on a clock: two readings the
     same and the layout has settled. */
  const centre = async () => {
    let b = await box(), same = 0;
    for (let i = 0; i < 40 && same < 2; i++) {
      const n = await box();
      same = (n && b && n.x === b.x && n.y === b.y && n.w === b.w && n.h === b.h) ? same + 1 : 0;
      b = n;
    }
    return { cx: b.x + b.w / 2, cy: b.y + b.h / 2, b: b };
  };
  async function pinch(from, to, opts) {
    opts = opts || {};
    const { cx, cy } = await centre();
    const pair = (g) => [{ x: cx - g / 2, y: cy, id: 1 }, { x: cx + g / 2, y: cy, id: 2 }];
    await send('touchStart', pair(from));
    for (let i = 1; i <= 8; i++) { await send('touchMove', pair(from + (to - from) * i / 8)); await pg.waitForTimeout(16); }
    if (opts.hold) return { cx, cy, gap: to };
    await send('touchEnd', []);
    if (!opts.raw) await still();
    return null;
  }
  async function pan(dx, dy, opts) {
    opts = opts || {};
    const { cx, cy } = await centre();
    await send('touchStart', [{ x: cx, y: cy, id: 1 }]);
    for (let i = 1; i <= 8; i++) { await send('touchMove', [{ x: cx + dx * i / 8, y: cy + dy * i / 8, id: 1 }]); await pg.waitForTimeout(16); }
    if (opts.hold) return { cx, cy };
    await send('touchEnd', []);
    await still();
    return null;
  }
  const tapMuscle = (gid) => inRoot(`(r,a)=>{const s=r.querySelector(a.sel);
    const v=s.querySelector('.view:not([data-hidden="true"])')||s;
    const g=v.querySelector('.mg[data-g="'+a.gid+'"]');if(!g)return false;
    g.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}`, { sel: P.sel, gid });
  const tapPart = () => inRoot(`(r)=>{const p=r.querySelector('.part');if(!p)return false;
    p.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));
    return p.getAttribute('data-part')}`);

  /* A LIFT TO CHOOSE. Each picker names its own rows, and they are not
     the same rows: the library's are the catalogue's, the two sheets'
     are the ones being added to a day. Cell 12 needs one to pick. */
  const rowThere = () => inRoot(`(r,a)=>!!r.querySelector(a)`, P.row);
  const pickRow = () => inRoot(`(r,a)=>{const x=r.querySelector(a);if(!x)return false;
    x.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true}));return true}`, P.row);
  /* A REPAINT IS PROVED, NOT ASSUMED. Cell 9 used to pass the moment a
     control was FOUND, and one of the three controls it was finding
     repaints nothing at all: the split builder's "60 more" is a
     paragraph and not a button, so that picker had been signing off on a
     repaint that never happened.

     Proved by what the screen says afterwards rather than by node
     identity. These screens patch their HTML in rather than replacing
     it, so a node put there before the render is very often the same
     node after it, and a marker on one proves only that the patcher did
     its job. The words on the screen change when a render does anything
     at all, and that is what is compared. */
  const words = () => inRoot(`(r)=>(r.textContent||'').length`);

  /* A muscle chosen, framed and divided, with the figure still up: the
     state somebody is in when they are looking closely at something and
     have not picked a lift yet. Cells that need a repaint or an exercise
     list start here rather than from the bare body, which is what the
     two unfinished cells were doing and why they had nothing to act on:
     the library answers a muscle with its three heads and lists no lift
     at all until one of them is tapped. */
  async function armed() {
    await whole();
    await tapMuscle('chest');
    await pg.waitForTimeout(900);
    await still();
    return scaleOf(await at());
  }

  /* The whole body, facing front, at life size, with the camera handed
     back the only way it can be: by hand. Every cell starts here, so no
     cell is reading the one before it. */
  /* AND IT CHECKS THAT IT GOT THERE. This used to run its way home once
     and hand back whatever it found, so a cell that started from a
     figure still hidden behind an exercise sheet -- which is where cell
     12 leaves the library -- ran its whole gesture against an element
     with no box on screen and asserted on a camera nothing had touched.
     A silent no-op is worse than a failure. It goes round until the
     figure is really up and really at life size. */
  /* AND NO MUSCLE STILL CHOSEN. Backing out is one step at a time -- out
     of the part, then out of the muscle -- so one press of Back lands on
     the muscle rather than on the body, and the cell after it then
     "chose" the muscle that was already chosen. Tapping the muscle you
     are already on is not a new instruction and rightly leaves a
     hand-set camera alone, so that cell ran its whole gesture at life
     size and asserted nothing. It goes round until the figure says
     nothing is selected. */
  const chosen = () => inRoot(`(r,a)=>{const s=r.querySelector(a);
    return !!(s&&s.getAttribute('data-selected'))}`, P.sel);
  /* AND EVERY TIME IT FAILS IS COUNTED. Twice now a cell has run its
     whole gesture against a figure that was never brought home and
     asserted happily on a camera nothing had touched. A quiet no-op is
     worse than a red line, so the misses are tallied and reported at the
     end of the picker. */
  let missedHome = 0;
  /* AND THE FIGURE HAS TO BE REACHABLE, which is not the same as being
     on screen. Cell 11 scrolls whatever is scrollable under the figure
     and nothing scrolls it back, so the next cell found the map pushed up
     out of the sheet with its own middle sitting under the sheet header.
     Every touch this file dispatches goes through CDP at real viewport
     coordinates and hit-tests the real topmost element, so those gestures
     landed on the header and did nothing at all -- and whole() could not
     tell, because a pinch that never lands leaves the camera at 1x, which
     is exactly what going home looks like. A cell then asserted on a
     camera nothing had touched.

     So the sheet is put back to the top and the point the gesture is
     about to use is checked against the figure before anything is
     dispatched. */
  const unscroll = () => pg.evaluate((s) => {
    const r = window.DEMO.screens[s].root;
    [...r.querySelectorAll('*')].forEach((n) => { if (n.scrollTop) n.scrollTop = 0; });
    window.scrollTo(0, 0);
  }, P.screen);
  const reachable = () => inRoot(`(r,a)=>{const s=r.querySelector(a);if(!s)return false;
    const b=s.getBoundingClientRect();
    if(!(b.width>40&&b.height>40))return false;
    const x=Math.round(b.left+b.width/2), y=Math.round(b.top+b.height/2);
    if(x<0||y<0||y>window.innerHeight)return false;
    const el=r.elementFromPoint(x,y)||document.elementFromPoint(x,y);
    return !!(el&&s.contains(el))}`, P.sel);

  async function whole() {
    for (let i = 0; i < 8; i++) {
      await inRoot(P.home).catch(() => {});
      await pg.waitForTimeout(320);
      await unscroll();
      const b = await box();
      if (!b || b.w < 40 || b.h < 40) continue;
      if (await chosen()) continue;
      if (!(await reachable())) continue;
      await inRoot(P.front).catch(() => {});
      await pg.waitForTimeout(320);
      await unscroll();
      await pinch(240, 30);
      if (scaleOf(await at()) < 1.05) break;
    }
    const got = scaleOf(await at());
    if (!(got < 1.05) || (await chosen()) || !(await reachable())) missedHome++;
    return got;
  }

  const tag = (s) => P.name + ': ' + s;
  console.log('--- ' + P.name);
  ok(scaleOf(await whole()) < 1.05, tag('the body opens whole and at life size'));

  /* ---- THE ONE THAT WAS BREAKING IT ------------------------------- */
  const held = await pinch(80, 240, { raw: true });
  const during = await at();
  await pg.waitForTimeout(500);
  const afterRelease = await at();
  ok(scaleOf(during) > 2, tag('a real two-finger pinch zooms in'), during);
  ok(afterRelease === during,
     tag('and lifting the fingers does not send it home'), during + ' -> ' + afterRelease);

  /* 1. A muscle chosen by hand is the one instruction that moves it. */
  await whole();
  await pinch(70, 230);
  const set1 = await at();
  await tapMuscle('chest');
  await pg.waitForTimeout(900);
  const framed = await still();
  ok(framed !== set1 && scaleOf(framed) > 1.5,
     tag('1. choosing a muscle takes the camera back, which is the point of choosing'),
     set1 + ' -> ' + framed);

  /* 2. The adjustment made after the muscle was framed survives the part. */
  await whole();
  await tapMuscle('chest');
  await pg.waitForTimeout(800);
  await pinch(120, 200);
  const set2 = await at();
  const part = await tapPart();
  await pg.waitForTimeout(800);
  ok(!!part, tag('2. the split has a part to tap'), String(part));
  ok((await still()) === set2, tag('2. and the zoom set by hand survives tapping it'), set2 + ' -> ' + (await at()));

  /* 3. Turning the figure over is the same body, mirrored. */
  await whole();
  await tapMuscle('chest');
  await pg.waitForTimeout(800);
  await pinch(120, 200);
  const set3 = await at();
  ok(await inRoot(P.flip), tag('3. the figure can be turned over'));
  await pg.waitForTimeout(900);
  ok((await still()) === set3, tag('3. and front to back keeps the zoom'), set3 + ' -> ' + (await at()));

  /* 4. Panning stays panned. */
  /* AND THE FINGER THAT DRAGS HAS TO KEEP THE ELEMENT IT IS HOLDING.
     The browser cancels a touch whose target is removed, and this cell is
     where that showed up: a repaint landing after the pinch rebuilt the
     parts layer under the finger, the touch was cancelled, and not one
     touchmove was ever delivered. The camera then read byte for byte
     identical and the cell reported a drag that did nothing -- on some
     runs and not others, depending which side of the repaint the finger
     landed. Counted here rather than inferred, because "the camera did
     not move" and "the gesture never happened" look the same from
     outside. */
  const armTouch = () => inRoot(`(r,a)=>{const s=r.querySelector(a);if(!s)return false;
    s.__tc={start:0,move:0,end:0,cancel:0};
    if(!s.__tcOn){s.__tcOn=true;
      ['touchstart','touchmove','touchend','touchcancel'].forEach(t=>s.addEventListener(t,()=>{
        if(s.__tc)s.__tc[t.replace('touch','')]++;},true));}
    return true}`, P.sel);
  const readTouch = () => inRoot(`(r,a)=>{const s=r.querySelector(a);return s&&s.__tc?s.__tc:null}`, P.sel);
  await whole();
  await pinch(70, 230);
  const zoom4 = await at();
  await armTouch();
  await pan(-55, -45);
  const set4 = await at();
  const tc4 = await readTouch();
  ok(!!tc4 && tc4.move > 0 && tc4.cancel === 0,
     tag('4. the finger keeps the figure for the whole drag'), JSON.stringify(tc4));
  ok(set4 !== zoom4, tag('4. a finger drags the zoomed figure around'), zoom4 + ' -> ' + set4);
  await pg.waitForTimeout(700);
  ok((await at()) === set4, tag('4. and it stays where it was dragged'), set4);

  /* 5. Pinch, lift one finger, carry on with the other, pinch again --
     one continuous thing a hand does, with nothing lifted in between. */
  await whole();
  await pinch(70, 200, { hold: true });
  const mid5 = await at();
  const c5 = await centre();
  await send('touchEnd', [{ x: c5.cx - 100, y: c5.cy, id: 1 }]);
  await pg.waitForTimeout(60);
  ok((await at()) === mid5, tag('5. lifting one finger of two moves nothing'), mid5 + ' -> ' + (await at()));
  for (let i = 1; i <= 6; i++) { await send('touchMove', [{ x: c5.cx + 100 - i * 6, y: c5.cy - i * 5, id: 2 }]); await pg.waitForTimeout(16); }
  const panned5 = await at();
  ok(panned5 !== mid5 && Math.abs(scaleOf(panned5) - scaleOf(mid5)) < 0.05,
     tag('5. and the finger still down carries on panning, at the same zoom'),
     mid5 + ' -> ' + panned5);
  await send('touchStart', [{ x: c5.cx + 64, y: c5.cy - 30, id: 3 }]);
  for (let i = 1; i <= 6; i++) {
    await send('touchMove', [{ x: c5.cx + 64 - i * 4, y: c5.cy - 30, id: 2 },
                             { x: c5.cx + 64 + i * 8, y: c5.cy - 30, id: 3 }]);
    await pg.waitForTimeout(16);
  }
  await send('touchEnd', []);
  const set5 = await still();
  ok(scaleOf(set5) > 1.5, tag('5. and a second pinch with no lift between is still a pinch'), set5);

  /* 6. Out of a part and back to the body. */
  await whole();
  await tapMuscle('chest');
  await pg.waitForTimeout(800);
  await pinch(120, 190);
  const set6 = await at();
  await tapPart();
  await pg.waitForTimeout(700);
  await inRoot(P.home);
  await pg.waitForTimeout(800);
  ok((await still()) === set6, tag('6. coming back from a part finds the zoom still set'), set6 + ' -> ' + (await at()));

  /* 7. Past the stops, both ways. */
  await whole();
  await pinch(30, 1200);
  const far = await at();
  ok(scaleOf(far) > 3.5 && scaleOf(far) <= 4.0001,
     tag('7. pushed past the stop it springs back to the stop, not to life size'), far);
  await pinch(300, 10);
  const small = await at();
  ok(scaleOf(small) === 1, tag('7. and pinched in below life size it comes home to life size'), small);

  /* 8. A finger on a moving picture takes it over. */
  await whole();
  await tapMuscle('chest');
  await pg.waitForTimeout(80);
  await pinch(90, 200);
  const set8 = await at();
  ok(scaleOf(set8) > 1.5, tag('8. a pinch during the flight to a muscle takes the camera'), set8);
  await pg.waitForTimeout(900);
  ok((await at()) === set8, tag('8. and the interrupted flight does not finish behind it'), set8 + ' -> ' + (await at()));

  /* 9. A repaint landing in the middle of the gesture, not after it. */
  /* The repaint is a tap on one of the parts, because that is the one
     render all three pickers really have with the figure on screen: a
     search takes the figure away on the split builder, and the Add
     exercise sheet has no "Show more" left once a part has narrowed the
     list. Each half starts fresh, because on the library the part that
     was tapped puts the body away and there would be nothing to pan. */
  ok((await armed()) > 1.5, tag('9. there is a framed muscle to gesture on'));
  await pinch(70, 200, { hold: true });
  const mid9 = await at();
  const w9 = await words();
  ok(await tapPart(), tag('9. the screen had something to repaint'));
  await pg.waitForTimeout(450);
  ok((await words()) !== w9, tag('9. and the repaint really landed, under the fingers'),
     w9 + ' -> ' + (await words()));
  ok((await at()) === mid9, tag('9. a repaint mid-pinch moves nothing'), mid9 + ' -> ' + (await at()));
  await send('touchEnd', []);
  await still();

  ok((await armed()) > 1.5, tag('9. and a framed muscle again, to pan on'));
  await pan(-40, -30, { hold: true });
  const mid9b = await at();
  const w9b = await words();
  await tapPart();
  await pg.waitForTimeout(450);
  ok((await words()) !== w9b, tag('9. and again under a finger that is panning'),
     w9b + ' -> ' + (await words()));
  ok((await at()) === mid9b, tag('9. and a repaint mid-pan moves nothing either'), mid9b + ' -> ' + (await at()));
  await send('touchEnd', []);
  await still();

  /* 10. Two fingers down, one up, the other dragged. */
  await whole();
  await pinch(70, 230);
  const c10 = await centre();
  await send('touchStart', [{ x: c10.cx - 40, y: c10.cy, id: 1 }, { x: c10.cx + 40, y: c10.cy, id: 2 }]);
  await send('touchMove', [{ x: c10.cx - 45, y: c10.cy, id: 1 }, { x: c10.cx + 45, y: c10.cy, id: 2 }]);
  const set10 = await at();
  await send('touchEnd', [{ x: c10.cx - 45, y: c10.cy, id: 1 }]);
  for (let i = 1; i <= 8; i++) { await send('touchMove', [{ x: c10.cx + 45 - i * 7, y: c10.cy - i * 5, id: 2 }]); await pg.waitForTimeout(16); }
  const dragged10 = await at();
  await send('touchEnd', []);
  await still();
  ok(dragged10 !== set10 && Math.abs(scaleOf(dragged10) - scaleOf(set10)) < 0.1,
     tag('10. the finger left behind pans the figure rather than freezing it'),
     set10 + ' -> ' + dragged10);

  /* 11. The page moving under a zoomed figure. */
  ok((await armed()) > 1.5, tag('11. there is a framed muscle to scroll under'));
  await pinch(70, 200);
  const set11 = await at();
  /* And the scroll has to have happened, or this cell is asserting that
     nothing moves when nothing moved. Whatever is actually scrollable on
     this screen gets pushed, and the one that took it is reported. */
  const pushScroll = () => pg.evaluate((s) => {
    const r = window.DEMO.screens[s].root;
    /* Whatever is actually scrollable, found rather than guessed. A
       hand-written list of likely class names found nothing on the
       library, so that cell had been asserting that the camera holds
       still while nothing moved. */
    const all = [...r.querySelectorAll('*')]
      .filter((n) => n.scrollHeight > n.clientHeight + 20);
    for (const sc of all) {
      const was = sc.scrollTop;
      sc.scrollTop = was + 140;
      if (sc.scrollTop !== was) {
        return (sc.getAttribute('data-testid') || sc.className || sc.tagName) +
               ' ' + was + ' -> ' + sc.scrollTop;
      }
    }
    const w = window.scrollY;
    window.scrollBy(0, 140);
    if (window.scrollY !== w) return 'window ' + w + ' -> ' + window.scrollY;
    return null;
  }, P.screen);
  let scrolled = await pushScroll();
  /* THE LIBRARY HAS NOTHING TO SCROLL WHILE THE BODY IS UP. Its screen
     fits the viewport exactly with the figure on it -- measured, not
     assumed: no element in that shadow root overflows by a pixel -- and
     the list that does overflow only arrives once a part has been
     chosen, which is also the moment that screen puts the body away. So
     where the first push finds nothing to move, the part is opened and
     the list under it is scrolled instead. The claim is the same either
     way: the camera the reader set is still there afterwards. */
  if (!scrolled) { await tapPart(); await pg.waitForTimeout(700); scrolled = await pushScroll(); }
  ok(!!scrolled, tag('11. something under the figure really scrolled'), String(scrolled));
  await pg.waitForTimeout(500);
  ok((await at()) === set11, tag('11. scrolling the sheet does not move the camera'), set11 + ' -> ' + (await at()));

  /* 12. Away to an exercise and back to the picker. */
  /* The zoom is set BEFORE the part is tapped, which is the order a
     reader does it in and the only order the library allows: tapping a
     part is what opens the lifts there, and it takes the body off the
     screen as it goes. */

  /* A PINCH THAT NEVER LANDED IS NOT A ZOOM SOMEBODY SET. On a machine
     with sixty browsers on it the injected gesture can be swallowed
     whole: the two fingers go down, the eight touchmoves never reach the
     page at all -- not the figure, not the window -- and the fingers come
     up again with the camera exactly where the app had framed it. Traced
     frame by frame, that is what the one failure in the gate was. The
     cell then asked whether a camera NOBODY set by hand survives
     reopening a picker with no muscle chosen, and the honest answer to
     that is no: the figure goes back to the whole body, which is what a
     picker opening on nothing is supposed to show. So the gesture is
     confirmed to have moved the camera before a word is asserted about
     it, and a gesture that keeps getting swallowed is a red line of its
     own rather than a cell that quietly tests the wrong claim. */
  async function pinchThatLands(from, to) {
    let was = await at();
    for (let i = 0; i < 4; i++) {
      await pinch(from, to);
      const now = await at();
      if (now !== was) return now;
      was = now;
    }
    return null;
  }
  /* EVERY FRAME OF THE REOPEN IS LOOKED AT, not just the one frame the
     test happens to read. A sleep says nothing about what was on the
     screen while it ran: an app that put the camera back late would show
     the figure at life size for a moment and have fixed itself before
     anybody looked, and that is precisely the defect this cell is here to
     catch. The camera is sampled every animation frame from before the
     reopen until after it, and a frame with the figure up at any camera
     other than the one it was left at fails, however the last read comes
     out. Frames where the figure is not on screen are not frames anybody
     sees: the library takes the body away while the exercise is open. */
  const watchCamera = () => pg.evaluate(({ screen, sel }) => {
    window.__CAMFRAMES = [];
    const t0 = performance.now();
    const tick = () => {
      const r = window.DEMO.screens[screen].root;
      const s = r.querySelector(sel);
      const c = s && s.querySelector('.cam');
      window.__CAMFRAMES.push({
        t: Math.round(performance.now() - t0),
        cam: s ? ((c && c.getAttribute('transform')) || 'none') : 'no figure',
        vis: !!(s && s.getBoundingClientRect().width > 40)
      });
      if (window.__CAMFRAMES.length < 4000) window.__CAMRAF = requestAnimationFrame(tick);
    };
    tick();
  }, { screen: P.screen, sel: P.sel });
  const stopWatching = () => pg.evaluate(() => {
    cancelAnimationFrame(window.__CAMRAF);
    return window.__CAMFRAMES;
  });
  /* WAITED FOR, NOT SLEPT THROUGH. 600ms was enough on an idle machine
     and not on a loaded one, where the in-workout sheet was still
     settling the last thousandth of a scale when the camera was read.
     The wait is for the figure to be up and the camera to have stopped
     changing, which is the thing the cell actually needs. */
  const settled = async (ms = 5000) => {
    let last = null; const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const b = await box();
      const now = await at();
      if (b && b.w > 40 && now === last) return now;
      last = now;
      await pg.waitForTimeout(90);
    }
    return last;
  };
  /* And the list is waited for as well, for the same reason: under load
     the rows arrive when they arrive. */
  const rowSoon = async (ms = 4000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await rowThere()) return true;
      await pg.waitForTimeout(120);
    }
    return false;
  };

  ok((await armed()) > 1.5, tag('12. there is a framed muscle to set a zoom on'));
  const set12 = await pinchThatLands(120, 190);
  ok(!!set12, tag('12. and a hand really moved the camera off that framing'), String(set12));
  await tapPart();
  ok(await rowSoon(), tag('12. there is an exercise to choose'));
  await pickRow();
  await pg.waitForTimeout(800);
  await watchCamera();
  await P.open(pg);
  const back12 = await settled();
  const frames = await stopWatching();
  const strayed = frames.filter((f) => f.vis && f.cam !== set12);
  ok(back12 === set12, tag('12. and the picker comes back to the zoom it was left at'),
     set12 + ' -> ' + back12);
  ok(strayed.length === 0,
     tag('12. and it is never drawn at another camera on the way back'),
     strayed.length + ' of ' + frames.length + ' frames, first at ' +
     (strayed[0] ? strayed[0].t + 'ms ' + strayed[0].cam : '-'));

  /* ---- 13. ZOOM IN AND THE MUSCLE DIVIDES, WITH NO TAP FIRST -------

     What the split could not do. It needed a muscle already chosen, so
     pinching into a chest nobody had tapped showed the same undivided
     shape, bigger. The muscle is now whatever is under the middle of the
     frame, and the distance is that muscle's OWN tap frame rather than
     one number for the whole body.

     Crept in rather than pinched in one go, because the claim is about
     WHERE it divides and a single big pinch would sail past it. */
  const splitNow = () => inRoot(`(r)=>{const L=r.querySelector('.parts');
    return {gid:L?L.getAttribute('data-g'):null,
            parts:r.querySelectorAll('.part').length,
            labels:r.querySelectorAll('.part__label').length,
            words:[...r.querySelectorAll('.part__label')].map(t=>t.textContent)}}`);
  await whole();
  let divided = null, dividedAt = 0;
  for (let i = 0; i < 16 && !divided; i++) {
    await pinch(100, 116);
    const now = await splitNow();
    if (now.gid) { divided = now; dividedAt = scaleOf(await at()); }
  }
  ok(!!divided && divided.parts >= 2,
     tag('13. zooming in divides the muscle under the middle, with no tap first'),
     JSON.stringify(divided) + ' at ' + dividedAt.toFixed(2) + 'x');
  ok(!!divided && divided.labels >= divided.parts,
     tag('13. and every part it drew carries its name on the figure'),
     divided ? divided.words.join(',') : '-');

  /* THE SAME DISTANCE A TAP GIVES. Not a number written down here: the
     muscle it found is tapped, and the camera a tap puts it at is what
     the pinch is measured against. A shade under is the point -- the
     parts are there as the camera arrives rather than after it -- and one
     creep step of headroom over it, because the creep lands where it
     lands. */
  /* Asked of the module rather than measured off a second tap, because
     the tap frame is worked out from the viewBox and the muscle's own
     measured box and nothing else: a throwaway figure off-screen gives
     the same number the real tap flies to, without disturbing the one on
     screen. That a tap really does fly there is cell 1's claim. */
  const tapFrame = (gid) => pg.evaluate((g) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;top:0;width:393px;height:660px;opacity:0;pointer-events:none';
    document.body.appendChild(host);
    const groups = {};
    ['chest', 'abs', 'biceps', 'back', 'shoulders', 'adduc', 'quads', 'calves',
     'forearms', 'triceps', 'glutes', 'hams'].forEach((x) => { groups[x] = { name: x, n: 1 }; });
    const api = window.LKBodyMap.mount(host, { groups, order: Object.keys(groups) });
    const s = api.tapScale(g, 'front');
    host.remove();
    return s;
  }, gid);
  const tapAt = divided ? await tapFrame(divided.gid) : 0;
  ok(tapAt > 1 && dividedAt >= tapAt * 0.8 && dividedAt <= tapAt * 1.05,
     tag('13. at about the zoom a tap on that same muscle gives'),
     (divided ? divided.gid : '-') + ' divided at ' + dividedAt.toFixed(2) +
     'x, a tap frames it at ' + tapAt.toFixed(2) + 'x');

  /* THE BAND. A camera hovering on the line must not flash the parts on
     and off, so there is daylight between the distance that divides and
     the distance that clears: 0.85 of the tap frame in, 0.70 out. A nudge
     back out lands inside that gap and must change nothing. */
  await whole();
  let again = null;
  for (let i = 0; i < 16 && !(again && again.gid); i++) {
    await pinch(100, 116);
    again = await splitNow();
  }
  ok(!!(again && again.gid), tag('13. there is a split to hold steady'), JSON.stringify(again));
  const heldAt = scaleOf(await at());
  await pinch(100, 92);
  const nudged = await splitNow();
  ok(!!nudged.gid && nudged.gid === (again && again.gid),
     tag('13. a nudge back out inside the band leaves the parts alone'),
     heldAt.toFixed(2) + 'x -> ' + scaleOf(await at()).toFixed(2) + 'x, ' + JSON.stringify(nudged));

  /* AND BACK OUT AGAIN. Below the band the division goes. */
  await pinch(300, 30);
  const gone = await splitNow();
  ok(gone.parts === 0 && gone.gid === null,
     tag('13. and zooming back out puts the division away'),
     JSON.stringify(gone) + ' at ' + scaleOf(await at()).toFixed(2) + 'x');

  /* AND THE LIST. Each picker answers a split its own way, and the point
     of dividing a muscle is being able to choose one of its parts, so
     each one has to end up with that part's exercises on screen. */
  await pinch(40, 280);
  const back13 = await splitNow();
  ok(!!back13.gid, tag('13. pinching straight back in divides it again'), JSON.stringify(back13));
  ok(!!(await tapPart()), tag('13. a part of the muscle the pinch found can be tapped'));
  ok(await rowSoon(), tag('13. and that part has its exercises to choose from'));

  /* ---- 14. THE FIGURE AND THE SCREEN AGREE ABOUT THE MUSCLE --------

     The bug this exists for, found by logging every write to the camera
     with the stack that asked for it and reading back the frames.

     Tap the chest: the screen frames it and divides it. Pinch harder: the
     camera is allowed to give past its stop, and the give SLIDES the
     picture -- about twenty seven units of the frame -- so the middle of
     the frame came off the pectorals and onto the top of the abs. The
     split followed it, and the reader who had asked to look closer at
     their chest was handed their abs and the abs' exercise list.

     That left the figure dividing one muscle while the screen still had
     another, and the split had written its own muscle into the slot that
     remembers what the SCREEN last asked for. So the next repaint asked
     for the chest, found a key that did not match, read it as a brand new
     instruction, and flew a hand-set camera off to frame a muscle the
     reader was already looking at. A scroll was enough to set it off.

     Two claims, because it took two mistakes. Zooming is not a change of
     subject, so the split stays on the muscle that was tapped. And a
     repaint leaves a hand-set camera exactly where it is, even if the two
     ever disagree again. */
  const splitOn = () => inRoot(`(r)=>{const L=r.querySelector('.parts');
    return L?L.getAttribute('data-g'):null}`);
  ok((await armed()) > 1.5, tag('14. a muscle tapped, framed and divided'));
  ok((await splitOn()) === 'chest',
     tag('14. and the split is on the muscle that was tapped'), String(await splitOn()));
  await pinch(70, 200);
  const set14 = await at();
  ok((await splitOn()) === 'chest',
     tag('14. pinching further in does not hand the split to a neighbour'),
     'chest -> ' + (await splitOn()) + ' at ' + scaleOf(set14).toFixed(2) + 'x');
  /* And now something that repaints the screen without being an
     instruction to the camera. */
  let push14 = await pushScroll();
  if (!push14) { await tapPart(); await pg.waitForTimeout(700); push14 = await pushScroll(); }
  ok(!!push14, tag('14. something really repainted under the figure'), String(push14));
  await pg.waitForTimeout(700);
  ok((await at()) === set14,
     tag('14. and the repaint leaves the hand-set camera exactly where it was'),
     set14 + ' -> ' + (await at()));

  /* A double tap is still a double tap: two separate single-finger taps,
     which is the gesture the pinch was being mistaken for. */
  ok((await whole()) < 1.05, tag('the body is back at life size for the double tap'));
  /* AIMED AT CANVAS, NOT AT A MUSCLE. A single tap on a muscle chooses
     it and flies the camera in, so two taps on one are a choice followed
     by a double tap on an already zoomed figure, and the figure
     correctly goes home: the cell read that as the double tap failing
     when it was the first tap succeeding. The two gestures are only
     distinguishable where there is nothing to choose, which is what a
     reader double-taps on anyway. */
  const spot = await inRoot(`(r,a)=>{const s=r.querySelector(a);
    const b=s.getBoundingClientRect();
    for(const fx of [0.06,0.94,0.12,0.88]) for(const fy of [0.08,0.5,0.92]){
      const x=b.left+b.width*fx, y=b.top+b.height*fy;
      const el=r.elementFromPoint(x,y);
      if(el&&s.contains(el)&&!(el.closest&&el.closest('[data-g],[data-part]')))return{x:x,y:y};
    }
    return null}`, P.sel);
  ok(!!spot, tag('there is bare canvas on the figure to double tap'), JSON.stringify(spot));
  const cdt = spot || (await centre());
  const oneTap = async () => {
    await send('touchStart', [{ x: cdt.x, y: cdt.y, id: 1 }]);
    await send('touchEnd', []);
  };
  await oneTap(); await pg.waitForTimeout(90); await oneTap();
  const dbl = await still();
  ok(scaleOf(dbl) > 1.5, tag('a genuine double tap still zooms in'), dbl);
  await oneTap(); await pg.waitForTimeout(90); await oneTap();
  const dbl2 = await still();
  ok(scaleOf(dbl2) < 1.05, tag('and a second one takes it back out'), dbl2);

  /* THE FIGURE IS MOUNTED ONCE. A screen that rebuilds it cannot hold a
     camera, whatever this module does. */
  const hosts = await mounts();
  ok(hosts.length <= 1, tag('the figure was mounted once and moved, not rebuilt'),
     hosts.length + ' mounts: ' + JSON.stringify(hosts));
  ok(missedHome === 0, tag('every cell started from the whole body, not from wherever the last one left it'),
     missedHome + ' cells started somewhere else');
  ok(perrs.length === 0, tag('no page errors'), perrs.slice(0, 2).join(' | '));
  await pctx.close();
}

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
console.log(fails === 0 ? 'body-zoom: all ' + checks + ' checks passed' : 'body-zoom: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
