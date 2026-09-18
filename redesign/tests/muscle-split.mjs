/* TAP A MUSCLE, SEE THE MUSCLE.

   Tapping chest used to take the body off the screen and hand back
   ninety-eight exercises with the three parts written into headings you
   scroll past. The body is the reason the map is on this screen, and it
   left at the moment it became most useful.

   Now the first tap frames the muscle and splits it into its parts, in
   three lightnesses of its own hue, and the second tap picks one and
   narrows the list to it. partsOf had been in bodymap.js, exported and
   called by nothing, since the map was built.

   Six of the twelve groups have more than one region filed under them and
   split: chest, back, shoulders, triceps, biceps, abs. The other six have
   a single region, nothing to choose between, and go straight to their
   exercises the way they always did. A group the art draws as one piece
   on a view does not split on that view either: from the front the back
   is a trapezius sliver, and cutting it into Lats and Lower Back would
   label a shape that contains neither.

   Two of these are anatomy and the rest are a way of choosing. The back's
   three muscles are drawn apart in the art; the chest's three heads are
   one sheet cut into bands, which is what the heads are. A rear delt is
   on the far side of the shoulder and the triceps heads are stacked, so
   for those the band is a target that lands on the right list rather than
   a diagram. That is a deliberate trade and it is tested as behaviour,
   not as anatomy. */
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
await page.waitForFunction(() => window.DEMO && window.DEMO.screens['exercise-library'],
                           null, { timeout: 20000 });
await page.evaluate(() => { if (window.LKGo) window.LKGo('exercise-library'); });
await page.waitForTimeout(1100);

const back = async (n = 2) => {
  for (let i = 0; i < n; i++) {
    await page.evaluate(() => {
      const r = window.DEMO.screens['exercise-library'].root;
      const b = r.querySelector('[data-action="back"]');
      if (b) b.click();
    });
    await page.waitForTimeout(280);
  }
};
const setView = async (v) => {
  await page.evaluate((view) => {
    const r = window.DEMO.screens['exercise-library'].root;
    const el = r.querySelector('#tab-' + view);
    if (el) el.click();
  }, v);
  await page.waitForTimeout(320);
};
const tapGroup = (g) => page.evaluate((gid) => {
  const r = window.DEMO.screens['exercise-library'].root;
  const el = r.querySelector('#map svg [data-g="' + gid + '"]');
  if (!el) return false;
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return true;
}, g);
const split = () => page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  const svg = r.querySelector('#map svg');
  const map = r.querySelector('#libmap');
  const cam = svg && svg.querySelector('.cam');
  return {
    parts: svg ? [...svg.querySelectorAll('.parts [data-part]')].map((p) => p.getAttribute('data-part')) : [],
    mapShown: map ? !map.hidden : false,
    zoomed: cam ? cam.getAttribute('data-zoomed') === 'true' : false
  };
});

console.log('=== the muscles that have parts, split ===\n');

/* EVERY MUSCLE DIVIDES NOW, so this list is every muscle rather than the
   two that happened to carry an authored part list. The counts are the
   anatomy each view can honestly show: a delt has three heads and a
   front view shows two of them, which is why shoulders is 2 and not 3
   on both sides. */
const SPLITS = [
  ['front', 'chest', 3], ['front', 'abs', 2], ['front', 'biceps', 2],
  ['front', 'shoulders', 2], ['front', 'quads', 3], ['front', 'calves', 2],
  ['front', 'forearms', 2],
  ['back', 'back', 3], ['back', 'triceps', 3], ['back', 'shoulders', 2],
  ['back', 'hams', 2], ['back', 'glutes', 2], ['back', 'calves', 2],
  ['back', 'forearms', 2]
];
for (const [view, g, n] of SPLITS) {
  await back(); await setView(view);
  const found = await tapGroup(g);
  if (!found) { ok(false, g + ' is on the ' + view + ' view'); continue; }
  await page.waitForTimeout(600);
  const s = await split();
  ok(s.parts.length === n && s.mapShown && s.zoomed,
     view + ' / ' + g + ' frames and splits into ' + n,
     s.parts.join(' / ') + (s.mapShown ? '' : ' [body left the screen]'));
}

console.log('\n=== and the ones with a single region go straight through ===\n');

/* What is left is what genuinely has one region on that view. From the
   front the only piece of the back the figure draws is a sliver of
   trapezius either side of the neck: cutting it into lats and erectors
   would draw two muscles across a shape that contains neither. */
const STRAIGHT = [['front', 'back'], ['front', 'adduc'], ['back', 'adduc']];
for (const [view, g] of STRAIGHT) {
  await back(); await setView(view);
  const found = await tapGroup(g);
  if (!found) { ok(false, g + ' is on the ' + view + ' view'); continue; }
  await page.waitForTimeout(600);
  const s = await split();
  ok(s.parts.length === 0 && !s.mapShown,
     view + ' / ' + g + ' goes to its exercises',
     s.parts.length ? 'split into ' + s.parts.join('/') : 'straight through');
}

console.log('\n=== the second tap narrows the list to that part ===\n');

await back(); await setView('front');
await tapGroup('chest');
await page.waitForTimeout(600);
const shades = await page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  return [...r.querySelectorAll('.parts [data-part]')].map((p) =>
    getComputedStyle(p.querySelector('.part__gnd')).fill);
});
ok(new Set(shades).size === shades.length && shades.length === 3,
   'the three bands are three different shades', shades.join(' | '));

/* A point that really is on the band, the way a finger finds one: the
   bounding box centre of the upper band falls between the two pectorals,
   where nothing is painted. */
const pt = await page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  const p = r.querySelector('.parts [data-part="Upper"]');
  if (!p) return null;
  const b = p.getBoundingClientRect();
  for (let y = Math.ceil(b.top); y < b.bottom; y += 2) {
    for (let x = Math.ceil(b.left); x < b.right; x += 2) {
      const el = r.elementFromPoint(x, y);
      const hit = el && el.closest ? el.closest('[data-part]') : null;
      if (hit && hit.getAttribute('data-part') === 'Upper') return { x, y };
    }
  }
  return null;
});
ok(!!pt, 'the upper band can be aimed at', JSON.stringify(pt));
if (pt) {
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => {
    const r = window.DEMO.screens['exercise-library'].root;
    const map = r.querySelector('#libmap');
    const heads = [...r.querySelectorAll('.listhead')]
      .map((h) => h.textContent.replace(/\s+/g, ' ').trim());
    return { mapHidden: map ? map.hidden : null, heads };
  });
  ok(after.mapHidden, 'the body steps aside once there is a list to read');
  ok(after.heads.length === 1 && /Upper Chest/.test(after.heads[0]),
     'and the list is that part only, not all three headings',
     after.heads.join(' | '));

  /* THE WAY BACK IS THE WAY IN, REVERSED. Two taps in, two taps out. */
  await page.evaluate(() => {
    const r = window.DEMO.screens['exercise-library'].root;
    const b = r.querySelector('[data-action="back"]');
    if (b) b.click();
  });
  await page.waitForTimeout(700);
  const s2 = await split();
  ok(s2.mapShown && s2.parts.length === 3,
     'back returns to the split muscle rather than all the way out',
     s2.parts.join(' / '));

  await page.evaluate(() => {
    const r = window.DEMO.screens['exercise-library'].root;
    const b = r.querySelector('[data-action="back"]');
    if (b) b.click();
  });
  await page.waitForTimeout(700);
  const s3 = await split();
  ok(s3.mapShown && s3.parts.length === 0 && !s3.zoomed,
     'and the second back is the whole body again',
     s3.parts.length + ' parts, zoomed ' + s3.zoomed);
}

console.log('\n=== and a part is tappable on every muscle, not only the three ===\n');

/* THE BUG THIS EXISTS FOR. Three groups are cut into bands out of one
   sheet -- chest, shoulders, biceps -- and the band code has always
   added a transparent hard-edged copy of the shape for the finger,
   because the painted bands overlap by design and cannot take a tap.
   The other nine are drawn apart in the art and go down a different
   path, and that path never added one. Every element in it is
   unclickable by design: the ground so the bands can overlap, the
   striation so it never steals a tap, and pointer-events is inherited,
   so the group's own `none` reached everything.

   The result was nine of twelve muscles dividing into named parts that
   answered nothing at all when tapped. It looked finished and it was
   look-but-do-not-touch. */
const REACHABLE = [['front', 'quads'], ['front', 'abs'], ['front', 'calves'],
                   ['front', 'forearms'], ['back', 'triceps'], ['back', 'hams'],
                   ['back', 'glutes'], ['back', 'back']];
for (const [view, g] of REACHABLE) {
  await back(); await setView(view);
  if (!(await tapGroup(g))) { ok(false, g + ' is on the ' + view + ' view'); continue; }
  await page.waitForTimeout(700);
  const hit = await page.evaluate(() => {
    const r = window.DEMO.screens['exercise-library'].root;
    const parts = [...r.querySelectorAll('.parts [data-part]')];
    if (!parts.length) return { n: 0 };
    /* Aimed at the way a finger finds one: the first point inside the
       part's own box that resolves back to a part. */
    for (const p of parts) {
      const b = p.getBoundingClientRect();
      for (let y = Math.ceil(b.top); y < b.bottom; y += 2) {
        for (let x = Math.ceil(b.left); x < b.right; x += 2) {
          const el = r.elementFromPoint(x, y);
          const h = el && el.closest ? el.closest('[data-part]') : null;
          if (h) return { n: parts.length, name: h.getAttribute('data-part') };
        }
      }
    }
    return { n: parts.length };
  });
  ok(hit.n > 1 && !!hit.name, view + ' / ' + g + ': a part can actually be hit',
     hit.n + ' parts, aimed at ' + (hit.name || 'NOTHING'));
}

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
