/* Every crossing names a control that exists.

   assemble.mjs declares taps that leave a screen, and the demo matches each
   one with closest() at click time. A selector that never matches is silent:
   the crossing does not fire, the screen's own handler runs instead, and the
   destination is reachable by nothing.

   Two shipped that way. Finish on the workout log was declared
   [data-action="finish"] where the button is data-act="finish", so Review --
   a finished 996-line screen -- could not be reached by any tap, and pressing
   Finish toasted "Opening review." and stayed where it was. Coach's Start had
   the same mismatch.

   A source grep cannot answer this, because the markup is built by string
   concatenation and a testid like 'chip-' + id is never adjacent to its
   attribute in the file. So this opens each source screen, walks every state
   it declares, and asserts the selector matches in at least one of them.
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const ROOT = '/home/user/everything-claude-code/redesign';
const BUILD = path.join(ROOT, '08-build');

/* The manifest is a literal inside assemble.mjs; read the nav table out of
   it rather than duplicating it here, so the two cannot drift. */
const src = readFileSync(path.join(ROOT, '10-final/assemble.mjs'), 'utf8');
const block = src.slice(src.indexOf('nav: ['), src.indexOf('],', src.indexOf('nav: [')));
const nav = [...block.matchAll(/\{\s*from:\s*'([^']+)',\s*selector:\s*'([^']+)',\s*to:\s*'([^']+)'/g)]
  .map((m) => ({ from: m[1], selector: m[2], to: m[3] }));
if (!nav.length) { console.log('FAIL could not read MANIFEST.nav'); process.exit(1); }

const br = await chromium.launch();
let fails = 0;

for (const n of nav) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, n.from + '.html')).href);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(500);

  const states = await p.evaluate(() => {
    document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
    return [...document.querySelectorAll('.dev__item, .dev-list button, [data-testid="dev-list"] button')]
      .map((b, i) => i);
  });

  let found = false, where = 'default';
  const hit = (sel) => p.evaluate((s) => !!document.querySelector(s), sel);
  if (await hit(n.selector)) found = true;
  for (const i of states) {
    if (found) break;
    await p.evaluate((k) => {
      document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
      const list = [...document.querySelectorAll('.dev__item, .dev-list button, [data-testid="dev-list"] button')];
      list[k]?.click();
      const menu = document.querySelector('[data-testid="dev-menu"], [data-testid="dev-panel"]');
      if (menu) menu.hidden = true;
    }, i);
    await p.waitForTimeout(300);
    if (await hit(n.selector)) { found = true; where = 'state ' + i; }
  }

  /* Some crossings live behind an interaction -- train's "Edit split" is in
     a sheet a tap opens. Walking the declared states cannot reach those, so
     fall back to the source: an attribute pair that appears nowhere in the
     file is the bug this test exists for, and one that appears but needs a
     tap to render is fine. */
  let note = where;
  if (!found) {
    const attr = n.selector.match(/\[([a-zA-Z-]+)="([^"]+)"\]/);
    const src = readFileSync(path.join(BUILD, n.from + '.html'), 'utf8');
    if (attr && src.includes(`${attr[1]}="${attr[2]}"`)) {
      found = true;
      note = 'in source, renders behind an interaction';
    }
  }

  if (!found) fails++;
  console.log(`${found ? 'PASS ' : 'FAIL '}${n.from} -> ${n.to}  ${n.selector}` +
              (found ? `  (${note})` : '  never renders and is nowhere in the source'));
  await p.close();
}

await br.close();
console.log(fails ? `\n${fails} crossings name a control that does not exist`
                  : '\nevery crossing names a control that exists');
process.exit(fails ? 1 : 0);
