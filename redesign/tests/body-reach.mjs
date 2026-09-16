/* 44 PIXELS, MEASURED THE WAY A FINGER MEETS IT.

   bodymap.js is built around a promise: every muscle group on the map is
   at least 44px to hit, the size Apple asks for and roughly the pad of a
   thumb. It keeps that promise by growing a stroke around each muscle's
   outline, sized from the thinnest belly in the group.

   The promise did not hold. reachOf answers in CSS pixels, because 44 is
   a number about fingers, and its answer was written straight into
   stroke-width, which is measured in the art's own coordinates inside a
   group already carrying the fit transform. One art unit draws at 0.309px
   on a phone, so a margin asking for 8.8px of reach was drawn 2.7px wide.
   Every reach margin in the map was about three times too small.

   Nothing caught it because every check was on the code rather than on
   the rendered thing. So this one hit-tests: it samples a grid over the
   map, asks the shadow root what is on top at each point, and adds up the
   area that actually belongs to each group.

   The figure was also boxed in by a header repeating a count shown three
   more times on the same screen, and a line of instructions. The map is
   fitted to its shorter axis, so those pixels came off every muscle. */
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
await page.waitForTimeout(1200);

const measure = () => page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  const host = r.querySelector('[data-testid="bodymap"]');
  const b = host.getBoundingClientRect();
  const hit = {};
  for (let y = Math.ceil(b.top); y < b.bottom; y += 2) {
    for (let x = Math.ceil(b.left); x < b.right; x += 2) {
      const el = r.elementFromPoint(x, y);
      const g = el && el.closest ? el.closest('[data-g]') : null;
      if (!g) continue;
      const k = g.getAttribute('data-g');
      hit[k] = (hit[k] || 0) + 4;   /* each sample stands for 2x2 px */
    }
  }
  return { box: { w: Math.round(b.width), h: Math.round(b.height) }, hit };
});

/* PER VIEW, AND THEN THE UNION. This used to sweep one render and count
   twelve groups off it, which was only ever possible because the hidden
   figure's reach strokes were leaking through the visible one -- the
   front view genuinely carries nine muscle groups and the back eight.
   So every number this suite reported was partly measured on a figure
   nobody could see, including the "triceps 39px" it recorded as a known
   shortfall. Each view is now swept on its own and the areas are taken
   per view, which is how a thumb meets them. */
const flip = (v) => page.evaluate((view) => {
  const r = window.DEMO.screens['exercise-library'].root;
  const vs = [...r.querySelectorAll('.view')];
  vs.forEach((el, i) => el.setAttribute('data-hidden',
    String(view === 'back' ? i === 0 : i !== 0)));
}, v);

const m = await measure();
await flip('back');
await page.waitForTimeout(600);
const mb = await measure();
await flip('front');
await page.waitForTimeout(400);

/* A muscle is as reachable as its best side. */
const best = Object.assign({}, m.hit);
Object.entries(mb.hit).forEach(([g, a]) => {
  if (!(g in best) || a > best[g]) best[g] = a;
});
const groups = Object.entries(best);

console.log('=== the map gets the screen it is the whole point of ===\n');

ok(m.box.h >= 440, 'the figure is given real height', m.box.h + 'px tall');
ok(groups.length === 12, 'all twelve groups are on the front and back views',
   groups.length + ' found');

console.log('\n=== and every muscle is something a thumb can hit ===\n');

/* A 44px square is 1936px2. Muscles are not squares, so this asks for the
   area rather than for a square: a long thin target of the same area is
   still reachable along its length, which is how a bicep is aimed at. */
const FLOOR = 1936;
/* EMPTY, AND IT SHOULD STAY EMPTY. Triceps used to sit here at 1400,
   recorded as the one muscle too thin to reach. Measured per view rather
   than off the leak that was padding the sweep, all twelve clear a full
   44px square. An entry here excuses a muscle a thumb cannot hit, so add
   one only after measuring, and never to make a failure go away. */
const KNOWN_SHORT = {};
const short = [];
groups.forEach(([g, area]) => {
  const floor = KNOWN_SHORT[g] || FLOOR;
  if (area < floor) short.push(g + ' ' + area + 'px2 (floor ' + floor + ')');
});
ok(short.length === 0,
   'every group clears its floor', short.length ? short.join(', ') : 'all twelve');

const clearing = groups.filter(([g, a]) => a >= FLOOR).length;
ok(clearing >= 11, 'and at least eleven clear a full 44px square outright',
   clearing + ' of 12');

/* The units bug specifically: a margin of N pixels must draw N pixels
   wide, not N art units. Checked at the source rather than inferred. */
const stroke = await page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  const svg = r.querySelector('[data-testid="bodymap"] svg');
  const reach = svg.querySelector('.reach');
  const ctm = reach.getScreenCTM();
  const artPx = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
  const p = svg.querySelector('.reach [data-g="shoulders"]');
  const w = p ? parseFloat(p.getAttribute('stroke-width')) : 0;
  return { artPx: Math.round(artPx * 1e4) / 1e4, strokeUnits: w,
           onScreenPx: Math.round(w * artPx * 100) / 100 };
});
/* The discriminator is that a conversion happened at all: the attribute
   is in art units and must be LARGER than the pixel margin it stands for,
   because one art unit is a third of a pixel here. Written straight
   through, as it used to be, the two numbers would be equal. The size of
   the margin itself is not asserted -- it shrinks as the figure grows,
   which is the system working -- the hit areas above are what says the
   result is right. */
ok(stroke.artPx > 0 && stroke.artPx < 1,
   'one art unit is a fraction of a pixel, so the two units differ',
   stroke.artPx + 'px per unit');
ok(stroke.strokeUnits > stroke.onScreenPx * 1.5,
   'and the margin is converted rather than written through',
   stroke.strokeUnits + ' units = ' + stroke.onScreenPx + 'px on screen');

console.log('\n=== the count is not shouted four times ===\n');

const counts = await page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  const seen = [];
  r.querySelectorAll('*').forEach((el) => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    const b = el.getBoundingClientRect();
    if (b.width > 0 && b.height > 0 && /\b8\d\d\b/.test(t)) seen.push(t.slice(0, 40));
  });
  const ph = r.querySelector('[data-testid="search-input"]');
  if (ph && /\b8\d\d\b/.test(ph.placeholder || '')) seen.push('placeholder: ' + ph.placeholder);
  return seen;
});
ok(counts.length <= 2, 'the library size is stated once or twice, not four times',
   counts.length + ': ' + counts.join(' | '));

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
