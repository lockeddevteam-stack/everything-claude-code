/* Per-state audit for one screen. The sweep tests walk screens at their
   default state, which is exactly the state a new screen is least likely to
   be broken in. This walks every state the screen declares, in both themes,
   and it checks three things a stylesheet read cannot:

     1. no console error or warning
     2. no axe violation, contrast included
     3. no interactive target under 44px
     4. no class used in the markup that no stylesheet defines

   (4) is the one that catches a screen written before its CSS. A class that
   resolves to nothing throws nothing and renders as unstyled text.

   Usage: node screen-audit.mjs fuel.html [more.html ...]
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';



const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

/* Class names every stylesheet defines, read from disk. Reading them in the
   page instead looks right and is not: on file:// Chromium throws
   SecurityError on cssRules, so the set comes back empty and the check
   silently accuses every class of being undefined. */
const KNOWN = new Set();
for (const css of ['tokens.css', 'components.css']) {
  const text = readFileSync(path.join(BUILD, css), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const sel of text.match(/[^{}]+(?=\{)/g) || [])
    for (const c of sel.match(/\.[A-Za-z0-9_-]+/g) || []) KNOWN.add(c.slice(1));
}
const files = process.argv.slice(2);
if (!files.length) { console.error('give at least one screen'); process.exit(2); }

const br = await chromium.launch();
let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

for (const file of files) {
  const url = pathToFileURL(path.join(BUILD, file)).href;

  /* States come from the screen's own dev menu, so this never drifts from
     what the screen actually supports. */
  const probe = await br.newPage({ viewport: { width: 393, height: 852 } });
  await probe.goto(url);
  /* Not every screen sets __ready. Wait for it where it exists and fall back
     to a settle, rather than failing a screen for not having a flag. */
  await probe.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await probe.waitForTimeout(400);
  const states = await probe.evaluate(() =>
    [...document.querySelectorAll('.dev__item')].map(b => b.dataset.state).filter(Boolean));
  await probe.close();
  console.log(`\n=== ${file} — ${states.length} states x 2 themes ===`);

  for (const theme of ['dark', 'light']) {
    for (const state of states) {
      const tag = `${file} ${state} ${theme}`;
      const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
      const p = await ctx.newPage();
      const errs = [];
      p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
      p.on('pageerror', e => errs.push('pageerror: ' + e.message));
      await p.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch (e) {} }, theme);
      await p.goto(url + '?state=' + state);
      await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(450);
      /* A screen that does not read ?state gets driven through its own dev
         menu instead, which is the control a person would use. */
      await p.evaluate(s => {
        const scr = document.getElementById('screen');
        if (scr && scr.getAttribute('data-state') === s) return;
        const b = document.querySelector(`.dev__item[data-state="${s}"]`);
        if (b) b.click();
      }, state);
      await p.waitForTimeout(350);

      const m = await p.evaluate((knownList) => {
        /* A class in the markup that no stylesheet defines styles nothing.
           It throws nothing either, which is why this is a test. */
        const known = new Set(knownList);
        const unknown = new Set();
        document.querySelectorAll('[class]').forEach(el => {
          if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
          for (const c of el.classList) if (!known.has(c)) unknown.add(c);
        });

        let small = [], targets = 0;
        document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="tab"]')
          .forEach(el => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) return;
            if (el.closest('svg')) return;
            targets++;
            if (r.width < 44 || r.height < 44)
              small.push((el.dataset.testid || el.className) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
          });
        /* Two controls with nothing between them read as one control and are
           hit by mistake. .hstack in this build carries no gap of its own, so
           a pair of buttons dropped into one touch unless the author
           remembered the modifier. */
        let touching = [];
        document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
          const nx = el.nextElementSibling;
          if (!nx || !/^(BUTTON|A)$/.test(nx.tagName)) return;
          if (el.closest('.seg, .tabbar, .pad, .fuel-log')) return;   /* joined by design */
          /* List rows are flush on purpose and carry a hairline between
             them. This is about two buttons in a row sharing an edge. */
          if (el.matches('.row, .item, .opt, .dev__item')) return;
          const a = el.getBoundingClientRect(), b = nx.getBoundingClientRect();
          if (!a.width || !b.width) return;
          if (Math.abs(a.top - b.top) >= 4) return;                   /* stacked, not side by side */
          if (b.left - a.right < 4) touching.push((el.dataset.testid || el.className) + ' | ' + (nx.dataset.testid || nx.className));
        });

        return {
          unknown: [...unknown], targets, small, touching,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          empty: !document.getElementById('body')?.textContent.trim()
        };
      }, [...KNOWN]);

      /* Snapshot the console before axe runs. axe preloads stylesheets by
         XHR, which on file:// is a CORS error every time and has nothing to
         do with the screen. */
      const pageErrs = errs.slice();
      await p.addScriptTag({ content: axe });
      const a = await p.evaluate(async () => {
        const r = await window.axe.run(document, { resultTypes: ['violations'] });
        return r.violations.map(v => v.id + ' x' + v.nodes.length);
      });

      ok(pageErrs.length === 0, tag + ' — console clean', pageErrs.slice(0, 2).join(' | '));
      ok(m.unknown.length === 0, tag + ' — every class is defined', m.unknown.join(', '));
      ok(m.small.length === 0, tag + ' — targets >= 44px', m.small.slice(0, 3).join(', '));
      ok(m.touching.length === 0, tag + ' — adjacent controls are separated', m.touching.slice(0, 3).join(' / '));
      ok(a.length === 0, tag + ' — axe clean', a.join(', '));
      ok(!m.overflow, tag + ' — no sideways overflow');
      if (state !== 'loading') ok(!m.empty, tag + ' — renders content');
      await ctx.close();
    }
  }
}

await br.close();
console.log(fails ? `\n${fails} failing` : '\nall checks passed');
process.exit(fails ? 1 : 0);
