/* One accent per surface.

   The spec states it as an absolute and it is the easiest rule in the build
   to lose, because every new control that wants to look important reaches for
   the same orange. So this counts, per screen and per state, every element
   that CARRIES the accent as a fill or as ink, and prints them.

   A fill is what competes. Ink on a link or a value is quieter, so the two
   are counted separately and the budget is on fills.
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

for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(600);

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
    document.querySelectorAll('*').forEach(el => {
      if (el.closest('.dev') || el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
      const b = el.getBoundingClientRect();
      if (b.width < 6 || b.height < 6) return;
      const s = getComputedStyle(el);
      const name = (el.dataset.testid || el.className || el.tagName).toString().slice(0, 26);
      if (acc.has(s.backgroundColor)) fills.push(name + ` ${Math.round(b.width)}x${Math.round(b.height)}`);
      else if (acc.has(s.color) && el.children.length === 0 && el.textContent.trim()) inks.push(name);
    });
    return { fills, inks };
  });
  console.log(`${file.padEnd(24)} fills ${String(r.fills.length).padStart(2)}   ink ${String(r.inks.length).padStart(2)}`);
  if (r.fills.length) console.log('    fills: ' + r.fills.join(', '));
  await p.close();
}
await br.close();
