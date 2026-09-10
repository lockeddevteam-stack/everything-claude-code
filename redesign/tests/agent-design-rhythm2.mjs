import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();
for(const f of ['home','train','fuel','progress','profile','shopping','review','settings','split-builder','workout-log','coach','exercise-library']){
  await p.goto('file://'+DIR+'/'+f+'.html'); await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const sc=document.querySelector('#body')||document.querySelector('.body');
    if(!sc) return 'nobody';
    const kids=[...sc.children].filter(e=>e.getBoundingClientRect().height>0);
    const out=[]; for(let i=1;i<kids.length;i++){
      const a=kids[i-1].getBoundingClientRect(),c=kids[i].getBoundingClientRect();
      out.push(Math.round(c.top-a.bottom)+':'+String(kids[i].className||kids[i].tagName).slice(0,22));}
    return {n:kids.length,gaps:out, padL:getComputedStyle(sc).paddingLeft, padT:getComputedStyle(sc).paddingTop};
  });
  console.log(f, JSON.stringify(r));
}
await b.close();
