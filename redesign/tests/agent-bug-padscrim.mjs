import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto(D+'workout-log.html');await p.waitForTimeout(700);
await p.locator('[data-testid="cell-0-3-weight"]').click();await p.waitForTimeout(400);
const g=await p.evaluate(()=>{const s=document.querySelector('[data-testid="pad-scrim"]');const sh=document.querySelector('[data-testid="pad-sheet"]');
  const r=s.getBoundingClientRect(),rs=sh.getBoundingClientRect();
  return {scrim:{x:r.x,y:r.y,w:r.width,h:r.height,z:getComputedStyle(s).zIndex,pe:getComputedStyle(s).pointerEvents},
    sheet:{y:rs.y,h:rs.height},topAt10:(()=>{const t=document.elementFromPoint(200,40);return t?t.tagName+'.'+(typeof t.className==='string'?t.className:'')+'#'+(t.dataset?.testid||''):null;})()};});
console.log(JSON.stringify(g,null,1));
await p.mouse.click(200,40);await p.waitForTimeout(500);
console.log('after real click at 200,40: pad open =',await p.locator('[data-testid="pad-sheet"]').count());
// try the other sheets' scrims
for(const [open,scrim,sheet] of [['btn-tools','tools-scrim','tools-sheet'],['btn-rest','rest-scrim','rest-sheet']]) {
  await p.goto(D+'workout-log.html');await p.waitForTimeout(600);
  const o=p.locator(`[data-testid="${open}"]`); if(!await o.count()){console.log(open,'missing');continue;}
  await o.click({force:true}).catch(()=>{});await p.waitForTimeout(400);
  const before=await p.locator(`[data-testid="${scrim}"]`).count();
  if(!before){console.log(open,'->',scrim,'not present');continue;}
  await p.mouse.click(200,40);await p.waitForTimeout(450);
  console.log(open,'-> scrim click ->',scrim,'still present:',await p.locator(`[data-testid="${scrim}"]`).count());
}
await b.close();
