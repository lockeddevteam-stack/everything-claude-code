/* Every control does something.

   A button wired to nothing renders, presses, springs back and lies. This
   presses one element for every distinct data-action / data-act on every
   screen, in every state that screen declares, and reports the ones after
   which nothing at all changed: no DOM, no scroll, no focus, no hash.

   Cross-screen navigation is the honest exception and is listed rather than
   failed: on a standalone screen "open settings" has nowhere to go, and the
   assembled demo wires those through its own nav table. Everything else is
   a dead control.
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readFileSync('/tmp/screens.txt', 'utf8').trim().split('\n');

/* Actions whose whole job is to leave the screen. The demo's nav table owns
   these; standalone there is nowhere to go. */
const NAV = new Set(['back', 'settings', 'signup', 'start', 'resume', 'start-workout',
                     'open-library', 'new-split', 'edit-split', 'manual-back',
                     'open-account', 'start-today', 'finish', 'store-open',
                     'more', 'open-shopping', 'open-settings', 'choose-session']);

const br = await chromium.launch();
const dead = [], navOnly = [];

for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(500);

  const nStates = await p.evaluate(() => {
    document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
    return document.querySelectorAll('.dev__item, .dev-list button').length;
  });

  const seen = new Set();
  for (let si = -1; si < Math.min(nStates, 20); si++) {
    if (si >= 0) {
      await p.goto(pathToFileURL(path.join(BUILD, file)).href);
      await p.waitForTimeout(420);
      await p.evaluate(i => {
        document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
        [...document.querySelectorAll('.dev__item, .dev-list button')][i]?.click();
        document.querySelector('[data-testid="dev-close"]')?.click();
        const m = document.querySelector('[data-testid="dev-menu"]'); if (m) m.hidden = true;
      }, si);
      await p.waitForTimeout(380);
    }

    const todo = await p.evaluate(known => {
      const out = [];
      document.querySelectorAll('[data-action], [data-act]').forEach((el, i) => {
        const a = el.dataset.action || el.dataset.act;
        if (!a || known.includes(a)) return;
        if (el.closest('.dev')) return;
        const r = el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) return;
        out.push({ a });
      });
      const first = new Map();
      for (const o of out) if (!first.has(o.a)) first.set(o.a, o);
      return [...first.values()];
    }, [...seen]);

    for (const { a } of todo) {
      seen.add(a);
      const before = await p.evaluate(() => ({
        dom: document.body.innerHTML.length + ':' + document.body.textContent.length,
        hash: location.hash,
        focus: document.activeElement?.getAttribute('data-testid') || '',
        scroll: [...document.querySelectorAll('*')].filter(e => e.scrollTop > 0).length
      }));
      /* Found and clicked in the same evaluate. Marking the element first and
         clicking it later looks tidier and does not work: these screens
         re-render between the two, the marked node is replaced, and every
         control after the first render reports dead because it was never
         pressed. */
      const hit = await p.evaluate(act => {
        const el = [...document.querySelectorAll('[data-action], [data-act]')]
          .find(e => (e.dataset.action || e.dataset.act) === act && !e.closest('.dev') &&
                     e.getBoundingClientRect().width > 6);
        if (!el) return false;
        el.click();
        return true;
      }, a);
      if (!hit) continue;
      await p.waitForTimeout(320);
      const after = await p.evaluate(() => ({
        dom: document.body.innerHTML.length + ':' + document.body.textContent.length,
        hash: location.hash,
        focus: document.activeElement?.getAttribute('data-testid') || '',
        scroll: [...document.querySelectorAll('*')].filter(e => e.scrollTop > 0).length
      }));
      const changed = before.dom !== after.dom || before.hash !== after.hash ||
                      before.focus !== after.focus || before.scroll !== after.scroll;
      if (!changed) (NAV.has(a) ? navOnly : dead).push(`${file}  ${a}`);
      /* Back to a known state: the click may have opened something. */
      await p.keyboard.press('Escape').catch(() => {});
      await p.waitForTimeout(120);
    }
  }
  await p.close();
}
await br.close();

if (navOnly.length) {
  console.log('leaves the screen, wired by the demo (not a failure):');
  for (const d of navOnly) console.log('  ' + d);
  console.log('');
}
for (const d of dead) console.log('DEAD  ' + d);
console.log(`\n${dead.length} dead control${dead.length === 1 ? '' : 's'}`);
process.exit(dead.length ? 1 : 0);
