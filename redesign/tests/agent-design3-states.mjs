import { chromium } from 'playwright';
import { DIR, OUT, screens, listStates, pickState } from './agent-design3-lib.mjs';
import fs from 'fs';

// Accent + contrast, walked over every declared state, both themes.
const AUDIT = `() => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.05 && r.bottom > 0 && r.top < 3000; };
  const parse = c => { const m = c.match(/[\\d.]+/g); return m ? m.map(Number) : null; };
  const satv = c => { const v = parse(c); if (!v || v.length < 3) return 0; if (v.length > 3 && v[3] < 0.15) return 0;
    return Math.max(v[0],v[1],v[2]) - Math.min(v[0],v[1],v[2]); };
  const lum = c => { const v = parse(c); if (!v) return null; const f = x => { x/=255; return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4); };
    return 0.2126*f(v[0])+0.7152*f(v[1])+0.0722*f(v[2]); };
  const bgOf = e => { let n = e; while (n && n !== document.documentElement) { const s = getComputedStyle(n);
    const v = parse(s.backgroundColor); if (v && (v.length < 4 || v[3] > 0.85)) return s.backgroundColor; n = n.parentElement; }
    return getComputedStyle(document.body).backgroundColor; };
  // topmost surface: a sheet if one is open, else the screen
  const sheet = document.querySelector('.overlay:not([hidden]) .sheet, .sheet');
  const scope = sheet && sheet.getBoundingClientRect().height > 0 ? sheet : document.body;
  const all = [...scope.querySelectorAll('*')].filter(vis).filter(e => !e.closest('.dev,.dev-panel') && !e.classList.contains('dev__toggle') && !e.classList.contains('dev-open'));
  const fills = [], inks = [], contrast = [];
  for (const e of all) {
    const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    const isSvg = e.namespaceURI !== 'http://www.w3.org/1999/xhtml';
    if (!isSvg && r.width*r.height >= 300 && satv(s.backgroundColor) > 40)
      fills.push({ cls: e.className.toString().slice(0,34), bg: s.backgroundColor, a: Math.round(r.width*r.height) });
    if (isSvg && r.width*r.height >= 300 && (satv(s.fill||'') > 40 || satv(s.stroke||'') > 40))
      fills.push({ cls: 'SVG '+(e.getAttribute('class')||e.tagName), bg: 'f:'+s.fill+' s:'+s.stroke, a: Math.round(r.width*r.height) });
    const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      if (satv(s.color) > 40) inks.push({ t: e.textContent.trim().slice(0,18), c: s.color });
      const l1 = lum(s.color), l2 = lum(bgOf(e));
      if (l1 != null && l2 != null) { const cr = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
        const fs2 = parseFloat(s.fontSize), bold = parseInt(s.fontWeight) >= 600;
        const need = (fs2 >= 24 || (fs2 >= 18.66 && bold)) ? 3 : 4.5;
        if (cr < need) contrast.push({ t: e.textContent.trim().slice(0,22), cr: Math.round(cr*100)/100, need, fs: fs2, c: s.color, bg: bgOf(e) });
        else contrast.push(null); } }
  }
  return { fills, inks: inks.length, inkList: inks.slice(0,8), fails: contrast.filter(Boolean), nodes: contrast.length,
    scope: scope === document.body ? 'screen' : 'sheet' };
}`;

const b = await chromium.launch();
const rows = [];
let totalNodes = 0, totalFails = 0;
for (const theme of ['dark', 'light']) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  for (const f of screens) {
    const name = f.replace('.html', '');
    await p.goto('file://' + DIR + '/' + f);
    await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await p.waitForTimeout(500);
    const states = await listStates(p);
    const walk = ['(rest)', ...states];
    for (const id of walk) {
      await p.goto('file://' + DIR + '/' + f);
      await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await p.waitForTimeout(250);
      if (id !== '(rest)') await pickState(p, id);
      await p.waitForTimeout(400);
      const a = await p.evaluate(`(${AUDIT})()`);
      totalNodes += a.nodes; totalFails += a.fails.length;
      rows.push({ theme, name, id, ...a });
      if (a.fills.length > 1 || a.fails.length) {
        console.log(`${theme} ${name} [${id}] fills=${a.fills.length} contrastFails=${a.fails.length}`);
        if (a.fills.length > 1) console.log('    ', JSON.stringify(a.fills));
        if (a.fails.length) console.log('    CF', JSON.stringify(a.fails.slice(0, 5)));
      }
    }
  }
  await ctx.close();
}
await b.close();
fs.writeFileSync(OUT + '/states-audit.json', JSON.stringify(rows, null, 1));
console.log('\nTOTAL text nodes checked', totalNodes, 'contrast failures', totalFails);
const multi = rows.filter(r => r.fills.length > 1);
console.log('surface/state combos with >1 saturated fill:', multi.length, 'of', rows.length);
