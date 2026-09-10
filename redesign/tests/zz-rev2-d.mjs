import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874},hasTouch:true})).newPage();
await p.goto(D+'shopping.html');await p.waitForTimeout(600);
await p.locator('[data-testid="shop-at"]').click();await p.waitForTimeout(600);
const grab=p.locator('[data-testid="sheet-shop-at"] .sheet__grab');
const bb=await grab.boundingBox();
await p.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2);
await p.mouse.down();
for(let y=0;y<=340;y+=20){await p.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2-y);await p.waitForTimeout(16);}
await p.mouse.up();
await p.waitForTimeout(900);
const s=await p.evaluate(()=>{
  const el=document.querySelector('[data-testid="sheet-shop-at"]');
  const cs=getComputedStyle(el);
  return {full:cs.getPropertyValue('--full').trim(), left:cs.left,right:cs.right,bottom:cs.bottom,bl:cs.borderBottomLeftRadius,
          rect:el.getBoundingClientRect().toJSON(), vh:innerHeight, inline:el.getAttribute('style')};
});
console.log('after drag to top detent (0.8):',JSON.stringify(s,null,1));
await b.close();
