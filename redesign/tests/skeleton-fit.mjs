/* A skeleton reserves the space the content will take.

   A short one is worse than none: everything below it jumps the moment the
   real thing arrives, and the reader is then looking at a different row than
   the one they were reading. Measured before this check, settings' account
   skeleton was 121px against 217px loaded and home's first block was 55px
   short.

   What counts is not total height — a screen that is nothing but skeleton
   grows as it loads and pushes nothing, because there is nothing below it to
   push. What counts is an element that exists in BOTH states and MOVES: that
   is the row somebody was reading, now somewhere else.

   So: every data-testid present in the loading state and in the loaded one,
   compared by its position in the scroller. 24px is the tolerance, about one
   line of body text.

   Only what was ON SCREEN while loading counts. A card that appears 1300px
   down once the account is known has moved nothing anybody was looking at,
   and reserving space for a card that may never render is a worse answer
   than letting the page grow below the fold.

   Onboarding is skipped: its "loading" is a different screen in a flow, not
   this screen waiting for data, so every id in it legitimately moves.
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
let fails = 0, checked = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

for (const file of screens) {
  if (file === 'onboarding.html') { console.log('SKIP onboarding.html — a flow, not one screen loading'); continue; }
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  const url = pathToFileURL(path.join(BUILD, file)).href;

  const measure = async (match) => {
    await p.goto(url);
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
    await p.waitForTimeout(450);
    const hit = await p.evaluate(re => {
      document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
      const b = [...document.querySelectorAll('.dev__item, .dev-list button')]
        .find(x => new RegExp(re, 'i').test(x.dataset.state || x.textContent));
      if (!b) return false;
      b.click();
      document.querySelector('[data-testid="dev-close"]')?.click();
      const m = document.querySelector('[data-testid="dev-menu"]'); if (m) m.hidden = true;
      return true;
    }, match);
    if (!hit) return null;
    await p.waitForTimeout(500);
    return p.evaluate(() => {
      const b = document.getElementById('body') || document.querySelector('.body');
      if (!b) return null;
      const top = b.getBoundingClientRect().top - b.scrollTop;
      const out = {};
      b.querySelectorAll('[data-testid]').forEach(e => {
        out[e.dataset.testid] = Math.round(e.getBoundingClientRect().top - top);
      });
      return out;
    });
  };

  const loading = await measure('loading');
  const loaded = await measure('populated|signed-in|training|record|browse|ready');
  await p.close();
  if (!loading || !loaded) continue;

  const moved = Object.keys(loading)
    .filter(k => k in loaded && loading[k] < 852 && Math.abs(loading[k] - loaded[k]) > 24)
    .map(k => `${k} ${loading[k]}->${loaded[k]}`);
  const shared = Object.keys(loading).filter(k => k in loaded && loading[k] < 852).length;
  if (!shared) { console.log(`SKIP ${file} — nothing but skeleton, so nothing to push`); continue; }
  checked++;
  ok(moved.length === 0, `${file} — nothing below the skeleton moves when it loads`,
     `${shared} shared, ${moved.slice(0, 3).join(', ')}`);
}
await br.close();
console.log(fails ? `\n${fails} of ${checked} screens shift on load` : `\n${checked} screens checked, none shifts on load`);
process.exit(fails ? 1 : 0);
