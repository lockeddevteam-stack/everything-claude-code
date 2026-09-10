import { chromium } from 'playwright';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
const U='file:///home/user/everything-claude-code/redesign/08-build/coach.html';
await p.goto(U); await p.waitForTimeout(300);
await p.locator('#dev-toggle').click(); await p.waitForTimeout(120);
await p.locator('[data-testid="dev-preset-2"]').click(); await p.waitForTimeout(600);
const st = () => p.evaluate(()=>{const b=document.querySelector('.tabbar');const s=document.querySelector('.body');
  return {min:b.getAttribute('data-minimized'), y:Math.round(b.getBoundingClientRect().y), scrollTop:s?s.scrollTop:null, sh:s?s.scrollHeight:null, ch:s?s.clientHeight:null};});
console.log('on load  ', JSON.stringify(await st()));
await p.evaluate(()=>{const s=document.querySelector('.body'); s.scrollTop = s.scrollTop-200;});
await p.waitForTimeout(500);
console.log('after up ', JSON.stringify(await st()));
await p.evaluate(()=>{const s=document.querySelector('.body'); s.scrollTop = 0;});
await p.waitForTimeout(500);
console.log('at top   ', JSON.stringify(await st()));
// other screens: does the tabbar start minimized anywhere?
for (const [s,pre] of [['coach','dev-preset-3'],['coach','dev-preset-5'],['coach','dev-preset-6']]) {
  await p.goto('file:///home/user/everything-claude-code/redesign/08-build/'+s+'.html'); await p.waitForTimeout(250);
  await p.locator('#dev-toggle').click(); await p.waitForTimeout(120);
  await p.locator(`[data-testid="${pre}"]`).click(); await p.waitForTimeout(600);
  console.log(s,pre,JSON.stringify(await st()));
}
await b.close();
