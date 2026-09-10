import { chromium } from 'playwright';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html');await p.waitForTimeout(300);
for (const i of [0,14,15]) {
  await p.goto('file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html');await p.waitForTimeout(250);
  await p.locator('#dev-toggle').click();await p.waitForTimeout(120);
  await p.locator(`[data-testid="dev-preset-${i}"]`).click();await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const e=document.querySelector('[data-testid="search-input"]');if(!e)return{gone:true};
    const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return{rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},dis:e.disabled,ro:e.readOnly,
      top:top?top.tagName+'.'+top.className+'#'+(top.dataset.testid||''):null,pe:getComputedStyle(e).pointerEvents,
      focusable:document.activeElement===e};});
  console.log('preset',i,JSON.stringify(r));
}
await b.close();
