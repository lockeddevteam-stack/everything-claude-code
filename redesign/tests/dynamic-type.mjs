/* Dynamic Type.

   iOS scales every text style with the reader's setting, up to AX5. A build
   whose type tokens are absolute px ignores that completely, and it fails
   silently: everything renders, everything is legible at the default, and
   the setting simply does nothing.

   Two things are checked, and the first matters as much as the second:

     1. at the default root the rendered sizes are EXACTLY Apple's scale, so
        going relative did not quietly move the whole ladder
     2. at AX5 every size has grown, and no screen overflows sideways

   AX5's Body is 53pt against a 17pt default, so the root is set to 53px:
   a 3.12x ratio, which is what the largest accessibility size actually is.
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readFileSync('/tmp/screens.txt', 'utf8').trim().split('\n');
const SCALE = new Set([11, 12, 13, 15, 16, 17, 20, 22, 28, 34]);

const br = await chromium.launch();
let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const sizes = p => p.evaluate(() => {
  const out = new Set();
  document.querySelectorAll('*').forEach(e => {
    if (e.children.length || !e.textContent.trim()) return;
    if (e.closest('.dev')) return;
    if (e.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
    out.add(Math.round(parseFloat(getComputedStyle(e).fontSize)));
  });
  return [...out].sort((a, b) => a - b);
});

for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(450);

  const root = await p.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  ok(root === '16px', `${file} — the root keeps the reader's size`, root);

  const base = await sizes(p);
  const off = base.filter(s => !SCALE.has(s));
  ok(off.length === 0, `${file} — every size is on Apple's scale`, off.join(', '));

  await p.evaluate(() => { document.documentElement.style.fontSize = '53px'; });
  await p.waitForTimeout(350);
  const big = await sizes(p);
  const grew = base.length > 0 && big.length > 0 && Math.max(...big) > Math.max(...base) * 2.5;
  ok(grew, `${file} — AX5 scales the type`,
     `${Math.max(...base)}px -> ${big.length ? Math.max(...big) : 0}px`);

  /* Per element, not per document. .screen sets overflow-x: hidden, so
     documentElement.scrollWidth can never exceed clientWidth -- the old
     assertion here was unfalsifiable and reported green on screens whose
     primary button was visibly clipped to "Fini". A text node whose own
     scrollWidth is wider than its box is text the reader cannot finish,
     which is the thing AX5 is supposed to catch. */
  const clipped = await p.evaluate(() => {
    const bad = [];
    document.querySelectorAll('*').forEach(e => {
      if (e.children.length || !e.textContent.trim()) return;
      if (e.closest('.dev')) return;
      if (e.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden') return;
      if (s.overflow === 'auto' || s.overflow === 'scroll' ||
          s.overflowX === 'auto' || s.overflowX === 'scroll') return;
      /* Text hidden from sight on purpose is a 1px box by construction, and
         it is read aloud rather than looked at. */
      if (e.clientWidth <= 2) return;
      /* A designed truncation is not a break. iOS truncates a list row's
         title at AX5 too -- what it does not do is cut a word in half with
         no ellipsis, which is what everything left in this list does. */
      if (s.textOverflow === 'ellipsis') return;
      if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) {
        bad.push((e.className || e.tagName) + ' "' +
                 e.textContent.trim().slice(0, 22) + '"');
      }
    });
    return bad;
  });
  ok(clipped.length === 0, `${file} — no text is clipped at AX5`,
     clipped.length ? clipped.length + ': ' + clipped.slice(0, 4).join(' | ') : '');
  await p.close();
}
await br.close();
console.log(fails ? `\n${fails} failing` : '\nall checks passed');
process.exit(fails ? 1 : 0);
