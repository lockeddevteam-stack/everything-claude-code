/* Every control does something, and a confirm button does the thing.

   A button wired to nothing renders, presses, springs back and lies. This
   presses one element for every distinct data-action / data-act on every
   screen, in every state that screen declares, and reports the ones after
   which nothing at all changed: no DOM, no scroll, no focus, no hash.

   The DOM diff alone is not enough for one class of control, and it is the
   class that matters most: a confirm button inside a dialog that is wired to
   "close" DOES change the DOM — the dialog goes — so it passes while the
   list it was meant to empty sits there untouched. So anything named like a
   confirmation is additionally checked against the content BEHIND the
   overlay, which is the thing it claimed it would change.

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
        /* A field answers to typing, not to a click, and a disabled or
           already-selected control is meant to do nothing. Counting those as
           dead is how a coverage test gets ignored. */
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
        if (el.getAttribute('aria-selected') === 'true' ||
            el.getAttribute('aria-pressed') === 'true' ||
            el.getAttribute('aria-current') === 'page') return;
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
        /* Selection state, because a control whose whole job is to move a
           selection swaps one aria-pressed="false" for one "true" and leaves
           the markup exactly the same length. Coach's tone chips reported
           dead while working correctly. */
        aria: [...document.querySelectorAll('[aria-pressed],[aria-selected],[aria-checked],[aria-current]')]
          .map(e => (e.dataset.testid || '') + (e.getAttribute('aria-pressed') || '') +
                    (e.getAttribute('aria-selected') || '') + (e.getAttribute('aria-checked') || '') +
                    (e.getAttribute('aria-current') || '')).join('|'),
        hash: location.hash,
        focus: document.activeElement?.getAttribute('data-testid') || '',
        scroll: [...document.querySelectorAll('*')].filter(e => e.scrollTop > 0).length
      }));
      const bodyBefore = await p.evaluate(() => {
        const b = document.getElementById('body') || document.querySelector('.body');
        return b ? b.textContent.replace(/\s+/g, ' ').trim() : '';
      });
      /* Found and clicked in the same evaluate. Marking the element first and
         clicking it later looks tidier and does not work: these screens
         re-render between the two, the marked node is replaced, and every
         control after the first render reports dead because it was never
         pressed. */
      const hit = await p.evaluate(act => {
        const el = [...document.querySelectorAll('[data-action], [data-act]')]
          .find(e => (e.dataset.action || e.dataset.act) === act && !e.closest('.dev') &&
                     !/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) &&
                     !e.disabled && e.getAttribute('aria-disabled') !== 'true' &&
                     e.getAttribute('aria-selected') !== 'true' &&
                     e.getAttribute('aria-pressed') !== 'true' &&
                     e.getAttribute('aria-current') !== 'page' &&
                     e.getBoundingClientRect().width > 6);
        if (!el) return false;
        el.click();
        return true;
      }, a);
      if (!hit) continue;
      await p.waitForTimeout(320);
      const after = await p.evaluate(() => ({
        dom: document.body.innerHTML.length + ':' + document.body.textContent.length,
        /* Selection state, because a control whose whole job is to move a
           selection swaps one aria-pressed="false" for one "true" and leaves
           the markup exactly the same length. Coach's tone chips reported
           dead while working correctly. */
        aria: [...document.querySelectorAll('[aria-pressed],[aria-selected],[aria-checked],[aria-current]')]
          .map(e => (e.dataset.testid || '') + (e.getAttribute('aria-pressed') || '') +
                    (e.getAttribute('aria-selected') || '') + (e.getAttribute('aria-checked') || '') +
                    (e.getAttribute('aria-current') || '')).join('|'),
        hash: location.hash,
        focus: document.activeElement?.getAttribute('data-testid') || '',
        scroll: [...document.querySelectorAll('*')].filter(e => e.scrollTop > 0).length
      }));
      let changed = before.dom !== after.dom || before.hash !== after.hash ||
                    before.aria !== after.aria ||
                    before.focus !== after.focus || before.scroll !== after.scroll;

      /* A confirmation has to change the screen under it, not just dismiss
         itself. Compare the scroller's content across the press, ignoring
         the overlay entirely. */
      if (changed && /^(do-|confirm|merge-do|merge-sep|save-|receipt-save|discard-confirm)/.test(a)) {
        const bodyAfter = await p.evaluate(() => {
          const b = document.getElementById('body') || document.querySelector('.body');
          return b ? b.textContent.replace(/\s+/g, ' ').trim() : '';
        });
        if (bodyBefore === bodyAfter) {
          dead.push(`${file}  ${a}  (dismissed itself and changed nothing behind it)`);
          continue;
        }
      }
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
