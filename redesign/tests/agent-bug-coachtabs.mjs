import { chromium } from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/08-build/coach.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
for (const i of [0,2,3]) {
  await p.goto(U); await p.waitForTimeout(300);
  await p.locator('#dev-toggle').click(); await p.waitForTimeout(120);
  await p.locator(`[data-testid="dev-preset-${i}"]`).click(); await p.waitForTimeout(500);
  await p.locator('#dev-toggle').click().catch(()=>{}); await p.waitForTimeout(150);
  const r = await p.evaluate(()=>{
    const res={};
    for (const t of ['tab-home','tab-profile','action-new-chat','composer-send','composer-input']) {
      const e=document.querySelector(`[data-testid="${t}"]`);
      if(!e){res[t]='MISSING';continue;}
      const r=e.getBoundingClientRect();
      const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      res[t]={y:Math.round(r.y),h:Math.round(r.height),vh:innerHeight,
        top:top?top.tagName+'.'+(typeof top.className==='string'?top.className:'')+'#'+(top.dataset?.testid||''):null,
        dis:e.disabled, pe:getComputedStyle(e).pointerEvents, op:getComputedStyle(e).opacity};
    }
    return res;});
  console.log('preset',i,JSON.stringify(r,null,1));
}
await b.close();
