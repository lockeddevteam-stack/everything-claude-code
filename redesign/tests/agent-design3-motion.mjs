import { chromium } from 'playwright';
import { DIR, screens } from './agent-design3-lib.mjs';

const splitTop = s => { const out=[]; let d=0,cur=''; for(const ch of s){ if(ch==='(')d++; if(ch===')')d--; if(ch===','&&d===0){out.push(cur.trim());cur='';} else cur+=ch;} if(cur.trim())out.push(cur.trim()); return out; };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const agg = {};
for (const f of screens) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(600);
  const rows = await p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
    return [...document.querySelectorAll('*')].filter(vis).map(e => { const s = getComputedStyle(e);
      return [s.transitionDuration, s.transitionProperty, s.transitionTimingFunction]; });
  });
  for (const [d, pr, fn] of rows) {
    const ds = splitTop(d), ps = splitTop(pr), fs = splitTop(fn);
    for (let i = 0; i < ds.length; i++) {
      if (ds[i] === '0s') continue;
      const prop = ps[i % ps.length], fun = fs[i % fs.length];
      const kind = fun.startsWith('linear(') ? 'SPRING' : fun.startsWith('cubic-bezier') ? 'ease:' + fun.slice(0, 34) : fun;
      const key = `${ds[i]} ${prop} ${kind}`;
      agg[key] = (agg[key] || 0) + 1;
    }
  }
}
await b.close();
const rows = Object.entries(agg).sort((a, b2) => b2[1] - a[1]);
let motion150 = 0, motionSpring = 0;
for (const [k, n] of rows) {
  console.log(String(n).padStart(4), k);
  const isMotion = /transform|opacity/.test(k);
  if (isMotion && k.startsWith('0.15s')) motion150 += n;
  if (isMotion && k.includes('SPRING')) motionSpring += n;
}
console.log('\nopacity/transform at 0.15s non-spring:', motion150, '  on a spring:', motionSpring);
