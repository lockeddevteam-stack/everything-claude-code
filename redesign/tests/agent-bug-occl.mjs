import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const SCR=['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
for(const s of SCR){
  await p.goto(D+s+'.html');await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const chip=document.querySelector('.dev__toggle,#dev-toggle,#devToggle');if(!chip)return[];
    const cr=chip.getBoundingClientRect();const hit=[];
    for(const e of document.querySelectorAll('[data-testid]')){
      if(e.closest('.dev'))continue;
      const t=e.tagName;if(!(t==='BUTTON'||t==='A'||t==='INPUT'))continue;
      const r=e.getBoundingClientRect();if(!r.width)continue;
      const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      if(top&&(top===chip||chip.contains(top)))hit.push(e.dataset.testid);}
    return hit;});
  if(r.length)console.log(s,'covered by STATE chip:',r.join(', '));
}
await b.close();
