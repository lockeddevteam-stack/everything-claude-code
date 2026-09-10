import { chromium } from 'playwright';
import { DIR, screens } from './agent-design3-lib.mjs';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2 })).newPage();
const bad = {}; let pairs=0, ok=0, caps=0;
for (const f of screens) {
  await p.goto('file://' + DIR + '/' + f); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const vis = e => { const q=e.getBoundingClientRect(); const s=getComputedStyle(e); return q.width>0&&q.height>0&&s.display!=='none'&&s.visibility!=='hidden'; };
    const out=[];
    for (const e of document.querySelectorAll('*')) {
      if (!vis(e)) continue;
      const s=getComputedStyle(e); const ri=parseFloat(s.borderTopLeftRadius); if(!ri) continue;
      const pe=e.parentElement; if(!pe||!vis(pe)) continue;
      const ps=getComputedStyle(pe); const rp=parseFloat(ps.borderTopLeftRadius); if(!rp) continue;
      const q=e.getBoundingClientRect(), qp=pe.getBoundingClientRect();
      const gap=Math.round((q.left-qp.left)*10)/10;
      const capsuleI = ri >= q.height/2 - 0.6, capsuleP = rp >= qp.height/2 - 0.6;
      out.push({ cls:e.className.toString().slice(0,26), pcls:pe.className.toString().slice(0,26), ri, rp, gap, capsuleI, capsuleP,
        want: Math.max(0, Math.round((rp-gap)*10)/10) });
    }
    return out;
  });
  for (const x of r) {
    if (x.capsuleI || x.capsuleP) { caps++; continue; }
    pairs++;
    if (Math.abs(x.ri - x.want) <= 1.5) ok++;
    else { const k=`${f} ${x.cls} in ${x.pcls}: r${x.ri} inside r${x.rp} gap${x.gap} (want ${x.want})`; bad[k]=(bad[k]||0)+1; }
  }
}
await b.close();
console.log('non-capsule nested pairs', pairs, 'concentric', ok, 'off', pairs-ok);
Object.entries(bad).sort((a,b2)=>b2[1]-a[1]).slice(0,20).forEach(([k,n])=>console.log(' ',n,k));
console.log('capsule pairs skipped', caps);
