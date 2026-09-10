/* The objective half of the rubric, measured on the rebuilt screens the same
   way it was measured on the original. Judgment criteria are not scored here;
   a number invented for one of those would be worth less than saying so. */
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const screens = readdirSync(BUILD).filter(f => f.endsWith('.html') && !f.startsWith('mockup-')).sort();
const br = await chromium.launch();
const out = [];

for (const theme of ['dark', 'light']) {
  for (const file of screens) {
    const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await p.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch (e) {} }, theme);
    await p.goto(pathToFileURL(path.join(BUILD, file)).href);
    await p.waitForTimeout(500);

    const m = await p.evaluate(() => {
      const px = v => Math.round(parseFloat(v) || 0);
      let small = 0, targets = 0;
      document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="radio"], [role="checkbox"]')
        .forEach(el => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          if (el.closest('svg')) return;           /* the body map is measured separately */
          targets++;
          if (r.width < 44 || r.height < 44) small++;
        });
      const sizes = new Set(), radii = new Set(), fams = new Set();
      document.querySelectorAll('*').forEach(el => {
        if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
        const s = getComputedStyle(el);
        if (!el.children.length && el.textContent && el.textContent.trim()) {
          sizes.add(px(s.fontSize)); fams.add(s.fontFamily.split(',')[0].trim());
        }
        if (el.getBoundingClientRect().width) radii.add(px(s.borderTopLeftRadius));
      });
      return { targets, small, sizes: [...sizes], radii: [...radii], fams: [...fams],
               overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });

    await p.addScriptTag({ content: axe });
    const res = await p.evaluate(() => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
    }));
    const contrast = res.violations.filter(v => v.id === 'color-contrast')
      .reduce((n, v) => n + v.nodes.length, 0);

    out.push({ theme, file, ...m,
      axe: res.violations.length,
      axeNodes: res.violations.reduce((n, v) => n + v.nodes.length, 0),
      contrast,
      /* axe's own noise is filtered out, not the page's: over file:// it
         cannot read a linked stylesheet or preload its assets, and says so
         three ways. Those messages are the harness talking, not the screen. */
      consoleMsgs: errs.filter(e => !/CORS|ERR_FAILED|stylesheet|preload assets/i.test(e)),
      console: errs.filter(e => !/CORS|ERR_FAILED|stylesheet|preload assets/i.test(e)).length });
    await ctx.close();
  }
}
await br.close();

const sum = k => out.reduce((n, r) => n + r[k], 0);
const uni = k => [...new Set(out.flatMap(r => r[k]))].sort((a, b) => (a > b ? 1 : -1));
console.log('screens measured:', screens.length, 'x 2 themes =', out.length, 'runs');
console.log('interactive targets:', sum('targets'), '| under 44px:', sum('small'));
console.log('axe violations:', sum('axe'), '| offending nodes:', sum('axeNodes'), '| contrast failures:', sum('contrast'));
console.log('console errors and warnings:', sum('console'));
console.log('horizontal overflow:', out.filter(r => r.overflow).map(r => r.theme + ' ' + r.file).join(', ') || 'none');
console.log('type sizes:', uni('sizes').join(', '));
console.log('radii:', uni('radii').join(', '));
console.log('font families:', uni('fams').join(' | '));
const bad = out.filter(r => r.small || r.axe || r.console);
if (bad.length) console.log('sample message:', JSON.stringify(bad[0].consoleMsgs));
if (bad.length) console.log('\nper screen:', bad.map(r => `${r.theme} ${r.file} small=${r.small} axe=${r.axe} console=${r.console}`).join('\n  '));
