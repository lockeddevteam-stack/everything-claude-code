import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
// tab bar minimize geometry
await p.goto(D+'train.html');await p.waitForTimeout(800);
const geo=()=>p.evaluate(()=>{const bar=document.querySelector('.tabbar');const r=bar.getBoundingClientRect();
  return {min:bar.getAttribute('data-minimized'),w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),
    ct:getComputedStyle(bar).containerType};});
console.log('tabbar at rest:',JSON.stringify(await geo()));
await p.mouse.move(200,500);
for(let i=0;i<12;i++){await p.mouse.wheel(0,80);await p.waitForTimeout(60);}
await p.waitForTimeout(900);
console.log('tabbar after scroll down:',JSON.stringify(await geo()));
for(let i=0;i<6;i++){await p.mouse.wheel(0,-80);await p.waitForTimeout(60);}
await p.waitForTimeout(900);
console.log('tabbar after scroll up:',JSON.stringify(await geo()));
// dev toggle sliver
console.log('dev toggle box:',await p.evaluate(()=>{const t=document.getElementById('dev-toggle');
  const r=t.getBoundingClientRect();return {x:Math.round(r.x),w:Math.round(r.width),right:Math.round(r.right)};}));
console.log('elementFromPoint at x=4:',await p.evaluate(()=>{const t=document.getElementById('dev-toggle');
  const r=t.getBoundingClientRect();const e=document.elementFromPoint(4,r.y+r.height/2);return e&&(e.id||e.className);}));
// focus restore after a control removes itself: shopping clear-done
await p.goto(D+'shopping.html');await p.waitForTimeout(800);
const act=()=>p.evaluate(()=>{const a=document.activeElement;return a.tagName+'#'+(a.dataset?.testid||a.id||'')+':'+(a.textContent||'').trim().slice(0,20);});
await p.evaluate(()=>{const r=document.querySelector('[data-testid^="item-"] input, .item__check');});
const tick=await p.evaluate(()=>{const t=document.querySelector('.item [data-action]');return t?t.getAttribute('data-testid'):null;});
console.log('first item control:',tick);
if(tick){await p.evaluate(t=>document.querySelector('[data-testid="'+t+'"]').focus(),tick);
  console.log('focus before:',await act());
  await p.evaluate(t=>document.querySelector('[data-testid="'+t+'"]').click(),tick);
  await p.waitForTimeout(500);
  console.log('focus after toggling it:',await act());}
await b.close();
