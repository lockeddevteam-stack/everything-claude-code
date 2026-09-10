/* Every control moves when it is pressed.

   Rubric item 6 is easy to assert and hard to keep: a control added later
   inherits the build's colours and radii for free and inherits nothing about
   press. So this walks every distinct kind of control in the build and checks
   the stylesheet actually gives it a pressed state.

   Static, and deliberately so: driving a real pointer over every control on
   thirteen screens takes minutes and finds the same thing. chrome-check does
   the real-pointer version on a sample, which is what proves the static rule
   corresponds to something.
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readFileSync('/tmp/screens.txt', 'utf8').trim().split('\n');

/* Class names that appear inside an :active selector, read from disk: on
   file:// Chromium refuses cssRules, so reading them in the page returns an
   empty set and passes everything. */
const PRESSED = new Set();
for (const css of ['tokens.css', 'components.css']) {
  const text = readFileSync(path.join(BUILD, css), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const sel of text.match(/[^{}]+(?=\{)/g) || []) {
    for (const part of sel.split(',')) {
      if (!part.includes(':active')) continue;
      for (const c of part.match(/\.[A-Za-z0-9_-]+/g) || []) PRESSED.add(c.slice(1));
    }
  }
}

const br = await chromium.launch();
const seen = new Map();

for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(400);

  /* Every state, because a control can be unique to one of them. */
  const states = await p.evaluate(() =>
    [...document.querySelectorAll('.dev__item')].map(b => b.dataset.state).filter(Boolean));

  for (const st of [null, ...states]) {
    if (st) {
      await p.evaluate(s => document.querySelector(`.dev__item[data-state="${s}"]`)?.click(), st);
      await p.waitForTimeout(220);
    }
    const found = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="switch"]').forEach(el => {
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
        if (el.closest('.dev') || /^dev[-_]/.test(el.className)) return;   /* the demo's own state switcher */
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return;
        out.push({
          sig: [...el.classList].sort().join('.') || el.tagName.toLowerCase(),
          classes: [...el.classList],
          id: el.dataset.testid || ''
        });
      });
      return out;
    });
    for (const f of found) if (!seen.has(f.sig)) seen.set(f.sig, { ...f, file, state: st || 'default' });
  }
  await p.close();
}
await br.close();

const dead = [...seen.values()].filter(v => !v.classes.some(c => PRESSED.has(c)));
for (const v of dead)
  console.log(`FAIL  no pressed state  .${v.sig}   ${v.file} (${v.state})  e.g. ${v.id || '(no testid)'}`);
console.log(`\n${seen.size - dead.length} / ${seen.size} kinds of control have a pressed state`);
process.exit(dead.length ? 1 : 0);
