import { chromium } from 'playwright';
import { DIR, OUT, screens, listStates, pickState } from './agent-design3-lib.mjs';
import fs from 'fs';

const CLIP = `() => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.05; };
  const out = [];
  for (const e of document.querySelectorAll('*')) {
    if (!vis(e)) continue;
    const s = getComputedStyle(e);
    const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const txt = e.textContent.trim().replace(/\\s+/g,' ').slice(0, 40);
    // horizontal clip
    if (e.scrollWidth > e.clientWidth + 1 && s.overflowX !== 'auto' && s.overflowX !== 'scroll' && s.textOverflow !== 'ellipsis') {
      out.push({ kind: 'hclip', t: txt, cls: e.className.toString().slice(0,34), sw: e.scrollWidth, cw: e.clientWidth });
    }
    // vertical clip inside a fixed-height box
    if (e.scrollHeight > e.clientHeight + 1 && s.overflowY === 'hidden') {
      out.push({ kind: 'vclip', t: txt, cls: e.className.toString().slice(0,34), sh: e.scrollHeight, ch: e.clientHeight });
    }
    // off the right of the viewport
    const r = e.getBoundingClientRect();
    if (r.right > 394 || r.left < -1) out.push({ kind: 'offscreen', t: txt, cls: e.className.toString().slice(0,34), l: Math.round(r.left), rr: Math.round(r.right) });
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
  await p.screenshot({ path: `${OUT}/ax5-${name}.png` });
  const rest = await p.evaluate(`(${CLIP})()`);
  const states = await listStates(p);
  const perState = {};
  for (const id of states) {
    await p.goto('file://' + DIR + '/' + f);
    await p.waitForTimeout(300);
    await pickState(p, id);
    await p.evaluate(() => { document.documentElement.style.fontSize = '53px'; });
    await p.waitForTimeout(500);
    const r = await p.evaluate(`(${CLIP})()`);
    if (r.length) perState[id] = r;
    if (r.length) await p.screenshot({ path: `${OUT}/ax5-${name}-${id}.png` });
  }
  report[name] = { rest, perState };
  console.log(name, 'rest:', rest.length, 'states with clips:', Object.keys(perState).length, '/', states.length);
  if (rest.length) console.log('   ', JSON.stringify(rest.slice(0, 8)));
  for (const [k, v] of Object.entries(perState).slice(0, 4)) console.log('   ', k, JSON.stringify(v.slice(0, 4)));
}
await b.close();
fs.writeFileSync(OUT + '/ax5.json', JSON.stringify(report, null, 1));
