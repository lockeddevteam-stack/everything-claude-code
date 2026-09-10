import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/split-builder.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
async function preset(i){await p.goto(U);await p.waitForTimeout(320);await p.click('#devToggle');await p.click('[data-testid="dev-preset-'+i+'"]');await p.waitForTimeout(380);}
async function chk(l,fn){const b=await snap();try{await fn();}catch(e){console.log(l.padEnd(32),'THREW '+e.message.slice(0,50));return;}await p.waitForTimeout(420);console.log(l.padEnd(32), b===await snap()?'NO CHANGE (dead)':'ok');}
await preset(2); await p.click('[data-action="add-exercise"]'); await p.waitForTimeout(420);
console.log('picker actions:', (await p.evaluate(()=>[...new Set(Array.from(document.querySelectorAll('[data-action]')).map(e=>e.getAttribute('data-action')))]))
  .join(','));
await chk('pick-add', ()=>p.click('[data-action="pick-add"]'));
await preset(2); await p.click('[data-action="add-exercise"]'); await p.waitForTimeout(420);
await chk('pick-search (typing)', ()=>p.fill('[data-action="pick-search"]','bench'));
await preset(10); await p.click('[data-action="open-swap"]'); await p.waitForTimeout(420);
console.log('swap actions:', (await p.evaluate(()=>[...new Set(Array.from(document.querySelectorAll('[data-action]')).map(e=>e.getAttribute('data-action')))])).join(','));
await chk('choose', ()=>p.click('[data-action="choose"]'));
await preset(2); const d=await p.$('[data-action="day-remove"]');
if(d){ await d.click(); await p.waitForTimeout(500);
  const ta=await p.$('[data-action="toast-action"]');
  if(ta) await chk('toast-action (undo after day-remove)',()=>ta.click()); else console.log('toast-action                     no toast rendered after day-remove'); }
await preset(3); const lc=await p.$('[data-action="lift-clear"]');
console.log('lift-clear in edit mode:', lc?'present':'absent');
if(!lc){ await preset(2); await p.click('[data-action="edit-toggle"]'); await p.waitForTimeout(420);
  console.log('lift-clear after edit-toggle:', await p.$('[data-action="lift-clear"]')?'present':'absent'); }
await br.close();
