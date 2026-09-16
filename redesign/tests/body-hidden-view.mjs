/* THE FIGURE YOU CANNOT SEE MUST NOT TAKE YOUR TAPS.

   The map holds both figures at once and hides one. Hiding it was
   `.view[data-hidden="true"] { pointer-events: none }` -- which does not
   do what it reads like. pointer-events is decided per element, not
   inherited as a veto, so `.hit { pointer-events: all }` on every target
   inside the hidden figure turned them all back on.

   That would be harmless if the hidden figure stayed in its own space.
   It does not: reach strokes are 30 to 40px wide, the hidden view is
   laid out at the left edge of the same box, and the back figure's
   triceps reached across into the front figure's left arm. Every tap on
   the left biceps selected triceps, and biceps could not be selected
   anywhere on the body at all -- one of twelve muscle groups, simply
   unreachable.

   Nothing measured it because getBoundingClientRect on an SVG path
   reports the fill box and leaves the stroke out. The hidden view's box
   read 23px wide while its strokes were claiming pixels 40px past that.
   So this test does not measure boxes. It asks the document what is
   actually on top, at points on the figure a person can see. */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = '/home/user/everything-claude-code/redesign';
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
await page.goto(pathToFileURL(path.join(ROOT, '08-build', 'exercise-library.html')).href);
await page.waitForTimeout(1200);

/* Both views exist and exactly one is hidden. */
const views = await page.evaluate(() =>
  [...document.querySelectorAll('.view')].map((v) => v.getAttribute('data-hidden')));
ok(views.length === 2, 'the map holds both figures', views.length + ' views');
ok(views.filter((h) => h === 'true').length === 1, 'and hides exactly one');

/* Sweep the visible figure and ask what is on top at every point. Not a
   sample of one: the theft was on one arm only, so one probe in the
   wrong place says everything is fine. */
const stolen = await page.evaluate(() => {
  const live = document.querySelector('.view:not([data-hidden="true"])');
  const b = live.getBoundingClientRect();
  const bad = [];
  let onBody = 0;
  for (let x = b.x + 2; x < b.right - 2; x += 4) {
    for (let y = b.y + 2; y < b.bottom - 2; y += 6) {
      const top = document.elementFromPoint(x, y);
      if (!top || !top.closest) continue;
      const view = top.closest('.view');
      if (!view) continue;
      onBody++;
      if (view.getAttribute('data-hidden') === 'true') {
        bad.push({ x: Math.round(x), y: Math.round(y),
                   g: top.getAttribute('data-g') });
      }
    }
  }
  return { bad: bad.length, onBody, sample: bad.slice(0, 3) };
});

ok(stolen.onBody > 200, 'the visible figure offers a real surface to test',
   stolen.onBody + ' points land on a figure');
ok(stolen.bad === 0,
   'no point on the visible figure belongs to the hidden one',
   stolen.bad + ' stolen' + (stolen.sample.length
     ? ' e.g. ' + stolen.sample.map((s) => s.g + '@' + s.x + ',' + s.y).join(', ') : ''));

/* And the thing that made it matter: every group has somewhere to be
   pressed. press-pointer checks this through real presses; this checks
   the geometry that feeds it, so a regression names the cause. */
const reachable = await page.evaluate(() => {
  const live = document.querySelector('.view:not([data-hidden="true"])');
  const b = live.getBoundingClientRect();
  const seen = new Set();
  for (let x = b.x + 2; x < b.right - 2; x += 3) {
    for (let y = b.y + 2; y < b.bottom - 2; y += 4) {
      const top = document.elementFromPoint(x, y);
      const g = top && top.getAttribute ? top.getAttribute('data-g') : null;
      if (g) seen.add(g);
    }
  }
  return [...seen].sort();
});
ok(reachable.includes('biceps'), 'biceps can be reached on the front figure',
   reachable.join(' '));

/* Flip to the back and do it again: the theft was symmetrical in
   principle and only showed up on one view by accident of layout. */
/* Through the map's own API, because the screen's flip control is not
   the thing under test and its markup differs per host. */
const flipped = await page.evaluate(() => {
  const m = window.__lkmap || (window.LKBodyMap && window.LKBodyMap.last);
  if (m && m.setView) { m.setView('back'); return true; }
  /* Fall back to driving the attribute the way setView does. */
  const vs = [...document.querySelectorAll('.view')];
  if (vs.length !== 2) return false;
  const wasHidden = vs.find((v) => v.getAttribute('data-hidden') === 'true');
  const wasShown = vs.find((v) => v.getAttribute('data-hidden') !== 'true');
  wasHidden.setAttribute('data-hidden', 'false');
  wasShown.setAttribute('data-hidden', 'true');
  return true;
});
await page.waitForTimeout(700);
ok(flipped, 'the map can be turned around');

const stolenBack = await page.evaluate(() => {
  const live = document.querySelector('.view:not([data-hidden="true"])');
  if (!live) return { bad: -1, onBody: 0 };
  const b = live.getBoundingClientRect();
  let bad = 0, onBody = 0;
  for (let x = b.x + 2; x < b.right - 2; x += 4) {
    for (let y = b.y + 2; y < b.bottom - 2; y += 6) {
      const top = document.elementFromPoint(x, y);
      if (!top || !top.closest) continue;
      const view = top.closest('.view');
      if (!view) continue;
      onBody++;
      if (view.getAttribute('data-hidden') === 'true') bad++;
    }
  }
  return { bad, onBody };
});
ok(stolenBack.bad === 0, 'and none on the back figure either',
   stolenBack.bad + ' stolen of ' + stolenBack.onBody);

await br.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
