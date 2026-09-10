import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:393,height:852}});
await p.goto(pathToFileURL(path.join(BUILD,'exercise-library.html')).href); await p.waitForTimeout(500);
for (const g of ['triceps','shoulders','hamstrings','forearms','back','quads']){
  const ok = await p.evaluate(gid=>{
    const b=document.querySelector(`[data-testid="row-group-${gid}"]`); if(!b) return 'missing';
    b.click(); return 'ok';
  }, g);
  if(ok!=='ok'){console.log(g,ok);continue;}
  await p.waitForTimeout(400);
  const m = await p.evaluate(()=>{
    const i=document.querySelector('[data-testid="search-input"]');
    const c=document.createElement('canvas').getContext('2d');
    const cs=getComputedStyle(i); c.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return {ph:i.placeholder, textW:Math.round(c.measureText(i.placeholder).width), fieldW:Math.round(i.clientWidth)};
  });
  console.log(g, JSON.stringify(m), m.textW>m.fieldW?'*** TRUNCATED':'');
  await p.evaluate(()=>{const b=document.querySelector('[data-testid="back"]'); if(b)b.click();});
  await p.waitForTimeout(300);
}
await br.close();
