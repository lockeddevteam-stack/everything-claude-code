/* THE SAME BODY, IN THE MIDDLE OF A SESSION.

   The picker on the library and the one in the split builder both keep
   the figure, frame it on the muscle and divide it into parts. The one
   in a live workout -- the Add exercise sheet, which is where somebody
   actually stands between sets and asks "what else hits this" -- went
   straight from a tap on the chest to ninety-eight rows. Same taxonomy,
   same module, different flow, and the flow was the old one.

   It behaves like the other two now. What is tested here is the
   behaviour rather than the drawing: the camera moves in, the parts
   appear, tapping one narrows the list to that part, and the way back
   out is the way in reversed.

   The figure is also mounted once and MOVED between paints rather than
   rebuilt. That is what lets the camera animate, and it is the reason
   the hue stylesheet has to be installed against a host that is already
   in the screen's shadow root: mounted detached, the rules went to the
   top document and every muscle rendered black. The colours are checked
   here because nothing else would notice. */
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
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 },
  isMobile: true, hasTouch: true });
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
await page.evaluate(() => window.LKGo('workout-log'));
await page.waitForTimeout(1000);

const root = (fn, arg) => page.evaluate(({ src, arg }) => {
  const r = window.DEMO.screens['workout-log'].root;
  /* eslint-disable no-new-func */
  return new Function('r', 'arg', 'return (' + src + ')(r, arg);')(r, arg);
}, { src: fn.toString(), arg });

const click = (sel) => root((r, s) => {
  const el = r.querySelector(s);
  if (!el) return false;
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return true;
}, sel);

const state = () => root((r) => {
  const svg = r.querySelector('#addex-fig svg');
  const cam = svg && svg.querySelector('.cam');
  const parts = svg ? [...svg.querySelectorAll('.parts [data-part]')] : [];
  return {
    hasFig: !!svg,
    zoomed: cam ? cam.getAttribute('data-zoomed') === 'true' : false,
    scale: cam ? (cam.getAttribute('transform') || '') : '',
    parts: parts.map((p) => p.getAttribute('data-part')),
    fills: parts.map((p) => getComputedStyle(p.querySelector('.part__gnd')).fill),
    labels: svg ? [...svg.querySelectorAll('.part__label')].map((t) => t.textContent) : [],
    crumb: (r.querySelector('[data-testid="addex-crumb"]') || { textContent: '' })
      .textContent.replace(/\s+/g, ' ').trim(),
    rows: [...r.querySelectorAll('[data-testid="addex-sheet"] .row__sub')]
      .slice(0, 8).map((x) => x.textContent.trim())
  };
});

console.log('=== the sheet opens on the body ===\n');

ok(await click('[data-testid="btn-add-exercise"]') ||
   await click('[data-testid="empty-add"]'), 'the add-exercise sheet opens');
await page.waitForTimeout(700);
const s0 = await state();
ok(s0.hasFig, 'the figure is on it');
ok(!s0.zoomed && s0.parts.length === 0, 'the whole body, undivided');

console.log('\n=== a tap frames the muscle and divides it ===\n');

ok(await click('#addex-fig svg [data-g="chest"]'), 'chest can be tapped');
await page.waitForTimeout(900);
const s1 = await state();
ok(s1.hasFig, 'the body is still on the screen');
const s1s = Number((/scale\(([\d.]+)\)/.exec(s1.scale) || [])[1] || 1);
ok(s1.zoomed && s1s > 2, 'the camera moved in', s1.scale);
ok(s1.parts.length === 3, 'into its three heads', s1.parts.join(' / '));
ok(s1.labels.length === 3, 'each one named', s1.labels.join(' / '));

/* THE HUES REACH THE SHADOW ROOT. Black here means the stylesheet went
   to the top document, which is what happens when the map is mounted
   into a host that is not in the screen yet. */
const black = s1.fills.filter((f) => /rgb\(0, 0, 0\)/.test(f));
ok(black.length === 0 && new Set(s1.fills).size === 3,
   'the three heads are three shades of the muscle, not black',
   s1.fills.join(' | '));

console.log('\n=== a second tap narrows the list to that head ===\n');

const pt = await root((r) => {
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
ok(!!pt, 'the upper head can be aimed at', JSON.stringify(pt));
if (pt) {
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(800);
  const s2 = await state();
  ok(/Upper/.test(s2.crumb) && /Chest/.test(s2.crumb),
     'the crumb says which head', s2.crumb);
  ok(s2.rows.length > 0 && s2.rows.every((m) => /upper chest/i.test(m)),
     'and every lift offered is an upper chest lift', s2.rows.slice(0, 3).join(' | '));
  ok(s2.hasFig && s2.parts.length === 3, 'with the divided body still there');

  /* Two taps in, two taps out. */
  await click('[data-testid="addex-back"]');
  await page.waitForTimeout(600);
  const s3 = await state();
  ok(s3.parts.length === 3 && !/Upper/.test(s3.crumb),
     'back goes to the whole muscle, not all the way out', s3.crumb);

  await click('[data-testid="addex-back"]');
  await page.waitForTimeout(600);
  const s4 = await state();
  ok(s4.hasFig && s4.parts.length === 0 && !s4.zoomed,
     'and the second back is the whole body again',
     s4.parts.length + ' parts, zoomed ' + s4.zoomed);
}

console.log('\n=== front and back outlive the zoom ===\n');

/* The two buttons used to leave with the whole-body view, so the only
   way to reach a triceps from a framed chest was to back all the way
   out. */
await click('[data-testid="addex-back"]');
await page.waitForTimeout(500);
await click('[data-testid="addex-view-front"]');
await page.waitForTimeout(400);
ok(await click('#addex-fig svg .view:not([data-hidden="true"]) [data-g="forearms"]'),
   'a forearm can be chosen');
await page.waitForTimeout(900);
const fz = await state();
ok(await root((r) => !!r.querySelector('[data-testid="addex-map-zoom"] [data-testid="addex-view-back"]')),
   'the front and back buttons are still there with a muscle framed');
ok(fz.zoomed, 'and the forearm is framed', fz.scale);

await click('[data-testid="addex-map-zoom"] [data-testid="addex-view-back"]');
await page.waitForTimeout(900);
const fb = await state();
ok(fb.zoomed && /Forearms/i.test(fb.crumb),
   'turning the figure over keeps the muscle it has on both sides', fb.crumb);
ok(fb.parts.length === 2, 'and it is still divided', fb.parts.join(' / '));

console.log('\n=== a head the catalogue does not name still narrows ===\n');

/* Six of the twelve groups are one bucket in the catalogue and two or
   three heads on the figure. A seated calf raise is the soleus and a
   standing one is the gastrocnemius, which is a real distinction and is
   made from the movement rather than from a label nobody wrote. */
const soleus = await page.evaluate(() => {
  const g = window.LKExercises.all().filter((x) => window.LKExercises.gidOf(x) === 'calves');
  const r = window.LKExercises.forPart('calves', 'Soleus', g);
  const w = window.LKExercises.forPart('quads', 'Outer', 
    window.LKExercises.all().filter((x) => window.LKExercises.gidOf(x) === 'quads'));
  return { n: r.list.length, exact: r.exact, names: r.list.map((x) => x.name),
           quadN: w.list.length, quadExact: w.exact, quadNote: w.note };
});
ok(soleus.exact && soleus.n > 0 && soleus.names.every((n) => /seated/i.test(n)),
   'the soleus is the seated calf raises', soleus.names.join(' | '));
ok(!soleus.quadExact && soleus.quadN > 0 && /one/i.test(soleus.quadNote),
   'and a muscle that trains as one piece says so rather than pretending',
   soleus.quadNote);

ok(errors.length === 0, 'no page errors', errors.join(' | '));

await browser.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
