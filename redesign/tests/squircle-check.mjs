/* Corner smoothing lands where it should and nowhere it should not.

   Measured by rendering, not by reading the stylesheet: an element's corner
   shape is only real if the browser resolved it. Capsules are checked too,
   because smoothing a capsule would flatten a pill and that is the failure
   mode worth catching. */
import { chromium } from 'playwright';
import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = readdirSync(BUILD).filter(f => f.endsWith('.html')).sort();
const br = await chromium.launch();
let smoothed = 0, capsules = 0, wrong = [];

for (const f of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, f)).href);
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    let sm = 0, cap = 0; const bad = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      const rad = parseFloat(s.borderTopLeftRadius) || 0;
      const shape = s.cornerShape || s.getPropertyValue('corner-shape') || '';
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const isCapsule = rad >= Math.min(box.width, box.height) / 2 - 0.5;
      if (shape.includes('superellipse')) {
        sm++;
        if (isCapsule) bad.push((el.className || el.tagName) + ' capsule got smoothing');
      } else if (isCapsule && rad > 0) cap++;
    });
    return { sm, cap, bad };
  });
  smoothed += r.sm; capsules += r.cap; wrong = wrong.concat(r.bad.map(b => f + ': ' + b));
  await p.close();
}
await br.close();
console.log('elements with corner smoothing :', smoothed);
console.log('capsules left circular         :', capsules);
console.log(wrong.length ? 'WRONG:\n  ' + wrong.slice(0, 6).join('\n  ') : 'no capsule was smoothed');
