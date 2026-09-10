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
const classesIn = (text, into) => {
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const sel of text.match(/[^{}]+(?=\{)/g) || [])
    for (const c of sel.match(/\.[A-Za-z0-9_-]+/g) || []) into.add(c.slice(1));
};
const SHARED = new Set();
for (const css of ['tokens.css', 'components.css']) classesIn(readFileSync(path.join(BUILD, css), 'utf8'), SHARED);

/* A screen may also carry its own <style>. Onboarding is a standalone flow
   with a device frame the other screens have no use for, and checking only
   the two shared sheets accused every one of its own classes of being
   undefined -- 78 failures, none of them real. */
const knownFor = file => {
  const own = new Set(SHARED);
  const html = readFileSync(path.join(BUILD, file), 'utf8');
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) classesIn(m[1], own);
  return own;
};
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
     what the screen supports. Driven by clicking, not by reading an
     attribute: three screens name their states with something other than
     data-state, and reading one attribute silently audited those screens in
     one state each while reporting a pass. */
  const probe = await br.newPage({ viewport: { width: 393, height: 852 } });
  await probe.goto(url);
  await probe.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await probe.waitForTimeout(600);
  const states = await probe.evaluate(() => {
    document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
    return [...document.querySelectorAll('.dev__item, .dev-list button, [data-testid="dev-list"] button')]
      .map((b, i) => ({ i, label: (b.dataset.state || b.textContent.trim() || 'state ' + i).slice(0, 34) }));
  });
  await probe.close();
  console.log(`\n=== ${file} — ${states.length || 1} states x 2 themes ===`);

  for (const theme of ['dark', 'light']) {
    for (const state of (states.length ? states : [{ i: -1, label: 'default' }])) {
      const tag = `${file} ${state.label} ${theme}`;
      const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
      const p = await ctx.newPage();
      const errs = [];
      p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
      p.on('pageerror', e => errs.push('pageerror: ' + e.message));
      await p.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch (e) {} }, theme);
      await p.goto(url);
      await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(450);
      /* Driven through the screen's own state switcher, which is the control
         a person would use, then closed so it is not part of what is audited. */
      if (state.i >= 0) {
        await p.evaluate(i => {
          document.querySelector('[data-testid="dev-toggle"], [data-testid="dev-open"]')?.click();
          const list = [...document.querySelectorAll('.dev__item, .dev-list button, [data-testid="dev-list"] button')];
          list[i]?.click();
          const menu = document.querySelector('[data-testid="dev-menu"], [data-testid="dev-panel"]');
          if (menu && !menu.hidden) {
            document.querySelector('[data-testid="dev-close"]')?.click();
            menu.hidden = true;
          }
        }, state.i);
        await p.waitForTimeout(420);
      }

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
          /* Not every screen gives its scroller an id: coach renders the
             whole screen from JS and identifies its body by class. Checking
             one id reported "no content" on seventeen states that had it. */
          /* A loading state is skeletons and no words, on purpose. Matching
             the state's NAME to spot one only worked while every screen
             happened to call it "loading"; a skeleton is the actual signal. */
          empty: !(document.getElementById('body') || document.querySelector('.body'))?.textContent.trim()
                 && !document.querySelector('.skel')
        };
      }, [...knownFor(file)]);

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
      ok(!m.empty, tag + ' — renders content or a skeleton');
      await ctx.close();
    }
  }
}

await br.close();
console.log(fails ? `\n${fails} failing` : '\nall checks passed');
process.exit(fails ? 1 : 0);
