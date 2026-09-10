/* Every group, both views: tap the centre of one of its bellies and check the
   screen selected that group and not a neighbour. */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 390, height: 844 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
const URL = pathToFileURL('/home/user/everything-claude-code/redesign/08-build/mockup-bodymap.html').href;
const reset = async view => {
  await p.goto(URL);
  await p.waitForTimeout(400);
  if (view === 'back') { await p.click('#tab-back'); await p.waitForTimeout(500); }
};
await reset('front');
let fails = 0, total = 0;
for (const view of ['front', 'back']) {
  const gids = await p.evaluate(v => Object.keys(window.LKBodyArt[v].groups), view);
  for (const gid of gids) {
    total++;
    await reset(view);
    /* A point that is genuinely ON the muscle, not merely inside its bounding
       rectangle: a long diagonal belly like the sartorius has a rectangle
       whose centre falls on the thigh beside it. The paint is scanned until a
       point resolves to this group's own paint. */
    const pt = await p.evaluate(g => {
      const paint = document.querySelector('.view:not([data-hidden="true"]) .mg--' + g + ' .mg__gnd');
      if (!paint) return null;
      const r = paint.getBoundingClientRect();
      for (let fy = 0.5; fy > 0.04; fy -= 0.06) {
        for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7, 0.25, 0.75]) {
          const x = r.x + r.width * fx, y = r.y + r.height * fy;
          const el = document.elementFromPoint(x, y);
          if (el && el.closest && el.closest('.mg--' + g)) return [x, y];
        }
      }
      return [r.x + r.width / 2, r.y + r.height / 2];
    }, gid);
    if (!pt) { console.log('FAIL', view, gid, 'not drawn'); fails++; continue; }
    await p.mouse.click(pt[0], pt[1]);
    await p.waitForTimeout(180);
    const sel = await p.evaluate(() => {
      const m = document.querySelector('.map');
      const on = m.querySelector('.view:not([data-hidden="true"]) .mg[data-on]');
      return on ? on.getAttribute('data-g') : null;
    });
    if (sel !== gid) { console.log('FAIL', view, gid, '-> selected', sel); fails++; }
  }
}
await br.close();
console.log(`${total - fails} / ${total} groups select correctly`);
