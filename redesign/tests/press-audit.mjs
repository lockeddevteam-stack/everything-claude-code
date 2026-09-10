/* Every control moves when it is pressed.

   Rubric item 6 in the spec is easy to assert and hard to keep: a control
   added later inherits the build's colours and radii for free, and inherits
   nothing about press. So this presses one of every distinct kind of control
   in the build with a real pointer and fails on any that does not change.

   One per class signature, not one per element: 500 real presses is a slow
   test that finds the same thing.
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = readFileSync('/tmp/screens.txt', 'utf8').trim().split('\n');
const br = await chromium.launch();
const seen = new Map();          /* class signature -> {file, moved} */

for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(450);

  const sigs = await p.evaluate((known) => {
    const out = [];
    document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="switch"]').forEach((el, i) => {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      if (el.closest('.dev')) return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const sig = [...el.classList].sort().join('.') || el.tagName.toLowerCase();
      if (known.includes(sig)) return;
      el.setAttribute('data-press-probe', String(i));
      out.push({ sig, probe: String(i) });
    });
    /* One element per signature. */
    const first = new Map();
    for (const o of out) if (!first.has(o.sig)) first.set(o.sig, o);
    return [...first.values()];
  }, [...seen.keys()]);

  for (const { sig, probe } of sigs) {
    const el = p.locator(`[data-press-probe="${probe}"]`);
    const box = await el.boundingBox().catch(() => null);
    if (!box) continue;
    const read = () => el.evaluate(e => {
      const c = getComputedStyle(e);
      return [c.transform, c.backgroundColor, c.color, c.opacity, c.boxShadow].join('|');
    });
    const rest = await read();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.down();
    await p.waitForTimeout(40);
    const down = await read();
    await p.mouse.up();
    await p.waitForTimeout(30);
    seen.set(sig, { file, moved: rest !== down, rest, down });
  }
  await p.close();
}
await br.close();

const dead = [...seen.entries()].filter(([, v]) => !v.moved);
for (const [sig, v] of dead) console.log(`FAIL  no press state  .${sig}   (${v.file})`);
console.log(`\n${seen.size - dead.length} / ${seen.size} kinds of control move when pressed`);
process.exit(dead.length ? 1 : 0);
