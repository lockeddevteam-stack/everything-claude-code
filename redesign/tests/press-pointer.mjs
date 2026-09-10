/* The body map's muscles answer a real finger.
 *
 * press-audit.mjs is static: it reads the stylesheet and asserts every kind
 * of control has a pressed selector. That is cheap and catches a control
 * added without one, but it cannot tell a live rule from a dead one. The
 * muscle regions are exactly where that gap bites. Their reach paths sit
 * outside the group they belong to, so a ':active' rule written on the group
 * parses, matches the audit, and never fires. This drives a real pointer
 * over every region on both views and checks the computed style changes on
 * the way down and comes back on the way up.
 *
 * The pointer leaves the shape before it lifts, so no click fires and no
 * region is selected: a selection would navigate away and every region after
 * the first would report dead for the wrong reason.
 *
 * The requirement is that every muscle group answers a press somewhere on
 * the body, not on both views. Some regions are a large target on one side
 * and a sliver on the other -- the adductor is the inner thigh from the
 * front and a patch between the hamstrings from the back, where the
 * hamstring's own reach path covers it. Reaching it from the front is the
 * behaviour; asserting both views would be asserting something the anatomy
 * does not owe us.
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 393, height: 852 } });
await p.goto(pathToFileURL(path.join(BUILD, 'exercise-library.html')).href);
await p.waitForTimeout(900);

let fails = 0, checked = 0;
const reachable = new Set(), all = new Set();
const ok = (cond, what, extra = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${what}${extra ? '  ' + extra : ''}`);
};

for (const view of ['front', 'back']) {
  if (view === 'back') {
    await p.evaluate(() => document.getElementById('tab-back').click());
    await p.waitForTimeout(400);
  }
  /* Only the figure on screen. Both views are in the DOM at once and the
     hidden one still reports boxes, so an unscoped query hands back slivers
     from the far side of the body and the test fails on its own sloppiness
     rather than on the build. */
  const gids = await p.evaluate(() => [...new Set(
    [...document.querySelectorAll('.view:not([data-hidden="true"]) .hit[data-g], [data-hidden="false"] .hit[data-g]')]
      .filter(h => h.getBoundingClientRect().width > 6)
      .map(h => h.dataset.g))]);
  ok(gids.length > 4, `${view} — the figure offers muscles to press`, `${gids.length} regions`);

  for (const gid of gids) {
    const pt = await p.evaluate(g => {
      const h = [...document.querySelectorAll(
          `.view:not([data-hidden="true"]) .hit[data-g="${g}"], [data-hidden="false"] .hit[data-g="${g}"]`)]
        .find(x => x.getBoundingClientRect().width > 6);
      const r = h.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, gid);

    await p.mouse.move(pt.x, pt.y);
    await p.mouse.down();
    await p.waitForTimeout(60);
    const down = await p.evaluate(() => {
      const el = document.querySelector('[data-press]');
      if (!el) return { cls: null, filter: 'none' };
      return { cls: el.getAttribute('class'),
               filter: getComputedStyle(el.querySelector('.mg__gnd')).filter };
    });
    await p.mouse.move(2, 2);
    await p.mouse.up();
    await p.waitForTimeout(60);
    const stuck = await p.evaluate(() => document.querySelectorAll('[data-press]').length);

    checked++;
    all.add(gid);
    const hitSelf = down.cls?.includes('mg--' + gid);
    const lit = down.filter.startsWith('brightness');
    if (hitSelf && lit) reachable.add(gid);

    /* Whatever took the press must light up and must let go. A press that
       lands on the neighbour drawn over this one is not a failure here --
       the group is checked for reachability across both views below. */
    ok(lit && stuck === 0, `${view}/${gid} — the muscle under the finger lights and releases`,
      (lit ? '' : 'nothing lit') + (stuck ? ' left pressed' : '') +
      (hitSelf ? '' : ' (covered here by ' + (down.cls || 'nothing') + ')'));
  }
}

const unreachable = [...all].filter(g => !reachable.has(g));
ok(unreachable.length === 0, 'every muscle group is pressable somewhere on the body',
  unreachable.length ? 'never reachable: ' + unreachable.join(', ') : `${reachable.size} groups`);

await br.close();
console.log(fails ? `\n${fails} failing` : `\n${checked} region presses, ${reachable.size} groups reachable`);
process.exit(fails ? 1 : 0);
