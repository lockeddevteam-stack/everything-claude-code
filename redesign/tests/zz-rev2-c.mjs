import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto(D+'shopping.html');await p.waitForTimeout(600);
await p.locator('[data-testid="shop-at"]').click();await p.waitForTimeout(600);
const s=await p.evaluate(()=>{
  const el=document.querySelector('[data-testid="sheet-shop-at"]');
  const cs=getComputedStyle(el);
  return {full:cs.getPropertyValue('--full').trim(), h:cs.height, left:cs.left, right:cs.right, bottom:cs.bottom,
          bl:cs.borderBottomLeftRadius, rect:el.getBoundingClientRect().toJSON(), inline:el.getAttribute('style')};
});
console.log('shop-at (top detent 0.8):',JSON.stringify(s,null,1));
// compare with an 0.88-top sheet
await p.goto(D+'progress.html');await p.waitForTimeout(600);
await p.locator('[data-testid="choose-lift"]').click();await p.waitForTimeout(700);
const s2=await p.evaluate(()=>{
  const el=document.querySelector('[data-testid="lift-sheet"]');
  const cs=getComputedStyle(el);
  return {full:cs.getPropertyValue('--full').trim(), h:cs.height, left:cs.left, bl:cs.borderBottomLeftRadius, rect:el.getBoundingClientRect().toJSON()};
});
console.log('lift-sheet (top detent 0.88, opens at 0.88):',JSON.stringify(s2));
await b.close();
