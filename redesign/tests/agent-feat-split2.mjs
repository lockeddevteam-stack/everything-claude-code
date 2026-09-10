import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/split-builder.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
async function preset(i){await p.goto(U);await p.waitForTimeout(350);await p.click('#devToggle');await p.click('[data-testid="dev-preset-'+i+'"]');await p.waitForTimeout(400);}
async function chk(label,fn){const b=await snap();try{await fn();}catch(e){console.log(label.padEnd(30),'THREW '+e.message.slice(0,60));return;}await p.waitForTimeout(400);console.log(label.padEnd(30), b===await snap()?'NO CHANGE (dead)':'ok');}
// picker modal
await preset(0); await p.click('[data-action="add-exercise"]'); await p.waitForTimeout(400);
console.log('picker open, testids:', (await p.evaluate(()=>Array.from(document.querySelectorAll('[data-action]')).map(e=>e.getAttribute('data-action')))).join(','));
await chk('pick-add', ()=>p.click('[data-action="pick-add"]'));
await preset(0); await p.click('[data-action="add-exercise"]'); await p.waitForTimeout(400);
await chk('pick-search (type)', async()=>{await p.fill('[data-action="pick-search"]','bench');});
// swap modal
for(let i=0;i<11;i++){ await preset(i); const has=await p.$('[data-action="open-swap"]'); if(has){ await has.click(); await p.waitForTimeout(400);
  const c=await p.$('[data-action="choose"]'); if(c){ await chk('choose (preset '+i+')', ()=>c.click()); break; } } }
// lift-clear + toast-action
for(let i=0;i<11;i++){ await preset(i); const lc=await p.$('[data-action="lift-clear"]'); if(lc){ await chk('lift-clear (preset '+i+')',()=>lc.click()); break; }
  if(i===10) console.log('lift-clear                     never rendered in any preset'); }
for(let i=0;i<11;i++){ await preset(i); const ta=await p.$('[data-action="toast-action"]'); if(ta){ await chk('toast-action (preset '+i+')',()=>ta.click()); break; }
  if(i===10) { await preset(0); const d=await p.$('[data-action="day-remove"]'); if(d){await d.click();await p.waitForTimeout(450);
    const ta2=await p.$('[data-action="toast-action"]'); if(ta2) await chk('toast-action (after day-remove)',()=>ta2.click()); else console.log('toast-action                   no toast after day-remove'); } } }
await br.close();
