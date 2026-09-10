/* One accent per surface.

   The spec states it as an absolute and it is the easiest rule in the build
   to lose, because every new control that wants to look important reaches for
   the same orange. So this counts, per screen and per state, every element
   that CARRIES the accent as a fill or as ink, and prints them.

   A fill is what competes. Ink on a link or a value is quieter, so the two
   are counted separately and the budget is on fills: at most ONE per screen,
   in every state that screen declares.

   Measured when this was written: the workout log had three accent fills and
   forty-three accent inks, and Fuel had four fills. The accent then marked
   nothing, which is the failure the rule exists to prevent.

   Two things this used to be blind to, and a ship review found both:

     SVG. The early return on namespaceURI skipped every SVG node, so
     Progress could draw its 1RM chart as an orange polyline with seven
     orange dots -- the loudest object on a screen whose only button is
     grey -- and this audit reported `fills 0`.

     States. Measuring the resting screen only meant the numeric pad's four
     accent steppers, its accent Done and its red DEL were never counted.
     A sheet is a surface and the rule is one tint per surface, so every
     state the screen's own switcher declares is walked.
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readFileSync('/tmp/screens.txt', 'utf8').trim().split('\n');
const br = await chromium.launch();
let fails = 0;

const openDev = () => {
  document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
  return [...document.querySelectorAll('.dev__item, .dev-list button, [data-testid="dev-list"] button')];
};

for (const file of screens) {
  const url = pathToFileURL(path.join(BUILD, file)).href;
  const probe = await br.newPage({ viewport: { width: 393, height: 852 } });
  await probe.goto(url);
  await probe.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await probe.waitForTimeout(600);
  const states = await probe.evaluate(`(${openDev.toString()})().map((b, i) => ({ i, label: (b.dataset.state || b.textContent.trim() || 'state ' + i).slice(0, 28) }))`);
  await probe.close();

for (const state of (states.length ? states : [{ i: -1, label: 'default' }])) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(url);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(600);
  if (state.i >= 0) {
    await p.evaluate(`(function (i) {
      const list = (${openDev.toString()})();
      list[i] && list[i].click();
      const menu = document.querySelector('[data-testid="dev-menu"], [data-testid="dev-panel"]');
      if (menu && !menu.hidden) {
        document.querySelector('[data-testid="dev-close"]')?.click();
        menu.hidden = true;
      }
    })(${state.i})`);
    await p.waitForTimeout(420);
  }

  const r = await p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const want = ['--accent', '--accent-deep', '--accent-text']
      .map(n => cs.getPropertyValue(n).trim().toLowerCase());
    const hex = h => {
      const m = h.match(/^#?([0-9a-f]{6})$/i);
      return m ? `rgb(${parseInt(m[1].slice(0,2),16)}, ${parseInt(m[1].slice(2,4),16)}, ${parseInt(m[1].slice(4,6),16)})` : h;
    };
    const acc = new Set(want.map(hex));
    const fills = [], inks = [];
    /* The surface is the topmost thing on screen. An open sheet is its own
       surface -- §12.4 says one tint per surface, not one per screen -- so
       while one is up, the screen behind it is not what is being looked at
       and its primary is not competing with the sheet's. */
    const surface = document.querySelector('.dialog') || document.querySelector('.sheet') || document;
    surface.querySelectorAll('*').forEach(el => {
      if (el.closest('.dev')) return;
      const b = el.getBoundingClientRect();
      /* 300px squared, the design review's own floor. Below it an object is
         an indicator, not a fill: an 8x8 live dot does not compete with a
         329x44 button and counting it as an equal says nothing useful. */
      if (b.width * b.height < 300) return;
      const s = getComputedStyle(el);
      const name = (el.dataset.testid ||
        (typeof el.className === 'string' ? el.className : el.className.baseVal) ||
        el.tagName).toString().slice(0, 26);
      const size = ` ${Math.round(b.width)}x${Math.round(b.height)}`;
      if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
        /* An SVG competes for attention the same way a div does. A filled
           shape is a fill; a stroked path is ink, because a 2px line is not
           what draws the eye across a screen. Icons inherit their stroke from
           the control they sit in, so they are counted where they land. */
        if (acc.has(s.fill)) fills.push(name + size);
        else if (acc.has(s.stroke)) inks.push(name);
        return;
      }
      if (acc.has(s.backgroundColor)) fills.push(name + size);
      else if (acc.has(s.color) && el.children.length === 0 && el.textContent.trim()) inks.push(name);
    });
    return { fills, inks };
  });
  const over = r.fills.length > 1;
  if (over) fails++;
  console.log(`${over ? 'FAIL ' : 'PASS '}${(file + ' · ' + state.label).padEnd(46)} fills ${String(r.fills.length).padStart(2)}   ink ${String(r.inks.length).padStart(2)}`);
  if (r.fills.length) console.log('    fills: ' + r.fills.join(', '));
  await p.close();
}
}
await br.close();
console.log(fails ? `\n${fails} screens carry more than one accent fill` : '\nevery screen carries at most one accent fill');
process.exit(fails ? 1 : 0);
