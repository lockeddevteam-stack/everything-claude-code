import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2 })).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/home.html');
await p.waitForTimeout(500);
for (const root of ['16px','53px']) {
  await p.evaluate(r => { document.documentElement.style.fontSize = r; }, root);
  await p.waitForTimeout(600);
  console.log(root, JSON.stringify(await p.evaluate(() => {
    const w = document.querySelector('.week');
    if (!w) return null;
    const r = w.getBoundingClientRect();
    const days = [...w.querySelectorAll('.week__day')].map(d => { const q = d.getBoundingClientRect();
      const lab = d.querySelector('.week__label') || d;
      const lr = lab.getBoundingClientRect();
      return { w: Math.round(q.width*10)/10, labW: Math.round(lr.width*10)/10, labSW: lab.scrollWidth, labCW: lab.clientWidth, l: Math.round(lr.left), rr: Math.round(lr.right) }; });
    // overlap between consecutive labels
    let overlaps = 0;
    for (let i=1;i<days.length;i++) if (days[i].l < days[i-1].rr - 0.5) overlaps++;
    return { trackW: Math.round(r.width), trackH: Math.round(r.height), days, overlaps };
  })));
}
await b.close();
