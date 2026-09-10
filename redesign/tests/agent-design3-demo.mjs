import { chromium } from 'playwright';
import { OUT } from './agent-design3-lib.mjs';
const F = 'file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b = await chromium.launch();
for (const [w, h, label] of [[393, 852, 'phone'], [1280, 900, 'wide']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(F);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/demo-${label}.png`, fullPage: false });
  const r = await p.evaluate(() => {
    const pill = document.querySelector('[class*=screens],[class*=pill],.demo__nav,.demo-pill');
    const all = [...document.querySelectorAll('*')];
    const occl = all.filter(e => { const c = e.className.toString ? e.className.toString() : ''; return /dev|demo|screens/i.test(c) && e.getBoundingClientRect().width > 0; })
      .map(e => { const q = e.getBoundingClientRect(); return { c: e.className.toString().slice(0,30), l: Math.round(q.left), t: Math.round(q.top), w: Math.round(q.width), h: Math.round(q.height), tf: getComputedStyle(e).transform }; });
    return { title: document.title, occl: occl.slice(0, 14), tabbars: document.querySelectorAll('.tabbar').length };
  });
  console.log(label, JSON.stringify(r, null, 1));
  if (errs.length) console.log(label, 'ERRORS', errs.slice(0, 8));
  await ctx.close();
}
await b.close();
