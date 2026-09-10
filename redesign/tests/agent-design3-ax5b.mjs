import { chromium } from 'playwright';
import { DIR, OUT, screens, listStates, pickState } from './agent-design3-lib.mjs';
import fs from 'fs';

const CLIP = `() => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.05; };
  const scrollableX = e => { let n = e.parentElement; while (n) { const s = getComputedStyle(n);
    if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && n.scrollWidth > n.clientWidth + 1) return n.className.toString().slice(0,24) || n.tagName;
    n = n.parentElement; } return null; };
  const skip = e => e.closest('.dev,.dev__menu,.dev-panel,.dev-open,.vis-hidden,[hidden]') || e.classList.contains('vis-hidden') || e.classList.contains('dev__toggle') || e.classList.contains('dev-open');
  const out = [];
  for (const e of document.querySelectorAll('*')) {
    if (!vis(e) || skip(e)) continue;
    const s = getComputedStyle(e);
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const txt = e.textContent.trim().replace(/\\s+/g,' ').slice(0, 34);
    const cls = e.className.toString ? e.className.toString().slice(0,30) : '';
    const sx = scrollableX(e);
    if (e.scrollWidth > e.clientWidth + 1 && s.overflowX !== 'auto' && s.overflowX !== 'scroll' && s.textOverflow !== 'ellipsis' && e.clientWidth > 2)
      out.push({ k: 'hclip', t: txt, cls, sw: e.scrollWidth, cw: e.clientWidth, scroller: sx });
    if (e.scrollHeight > e.clientHeight + 1 && s.overflowY === 'hidden' && e.clientHeight > 2)
      out.push({ k: 'vclip', t: txt, cls, sh: e.scrollHeight, ch: e.clientHeight });
    const r = e.getBoundingClientRect();
    if ((r.right > 394 || r.left < -1) && !sx) out.push({ k: 'off', t: txt, cls, l: Math.round(r.left), rr: Math.round(r.right) });
    if ((r.right > 394 || r.left < -1) && sx) out.push({ k: 'off-but-scrollable', t: txt, cls, l: Math.round(r.left), rr: Math.round(r.right), scroller: sx });
  }
  return out;
}`;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const report = {};
for (const f of screens) {
  const name = f.replace('.html', '');
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(400);
  await p.evaluate(() => { document.documentElement.style.fontSize = '53px'; });
  await p.waitForTimeout(700);
  const rest = await p.evaluate(`(${CLIP})()`);
  const states = await listStates(p);
  const perState = {};
  for (const id of states) {
    await p.goto('file://' + DIR + '/' + f);
    await p.waitForTimeout(250);
    await pickState(p, id);
    await p.evaluate(() => { document.documentElement.style.fontSize = '53px'; });
    await p.waitForTimeout(450);
    const r = await p.evaluate(`(${CLIP})()`);
    const hard = r.filter(x => x.k !== 'off-but-scrollable');
    if (hard.length) perState[id] = hard;
  }
  report[name] = { rest, perState };
  const hardRest = rest.filter(x => x.k !== 'off-but-scrollable');
  console.log('==', name, 'rest hard:', hardRest.length, ' states failing:', Object.keys(perState).length, '/', states.length);
  hardRest.slice(0, 10).forEach(x => console.log('    ', JSON.stringify(x)));
  for (const [k, v] of Object.entries(perState)) { if (JSON.stringify(v) === JSON.stringify(hardRest)) continue;
    console.log('   [', k, ']'); v.slice(0, 6).forEach(x => console.log('       ', JSON.stringify(x))); }
}
await b.close();
fs.writeFileSync(OUT + '/ax5b.json', JSON.stringify(report, null, 1));
