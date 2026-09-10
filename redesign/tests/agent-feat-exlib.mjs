import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,180)));
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
async function preset(i){await p.goto(U);await p.waitForTimeout(320);await p.click('#dev-toggle');await p.click('[data-testid="dev-preset-'+i+'"]');await p.waitForTimeout(380);}
const names=await(async()=>{await p.goto(U);await p.waitForTimeout(320);await p.click('#dev-toggle');
  return p.evaluate(()=>Array.from(document.querySelectorAll('[data-testid^="dev-preset-"]')).map(e=>e.textContent));})();
console.log(names.map((n,i)=>i+':'+n).join(' | '));
async function chk(l,fn){const b=await snap();try{await fn();}catch(e){console.log(l.padEnd(32),'THREW '+e.message.slice(0,60));return;}await p.waitForTimeout(400);console.log(l.padEnd(32), b===await snap()?'NO CHANGE (dead)':'ok');}
// save-custom: open create sheet, fill, save
for(let i=0;i<names.length;i++){ await preset(i);
  const c=await p.$('[data-action="create"]'); if(!c) continue;
  await c.click(); await p.waitForTimeout(420);
  if(await p.$('[data-action="save-custom"]')){
    await p.fill('[data-action="cname"]','My Lift').catch(()=>{});
    await chk('save-custom (preset '+i+')', ()=>p.click('[data-action="save-custom"]')); break; }
  if(i===names.length-1) console.log('save-custom                     create sheet never exposes it'); }
// scope-all
for(let i=0;i<names.length;i++){ await preset(i);
  if(await p.$('[data-action="scope-all"]')){ await chk('scope-all (preset '+i+' root)',()=>p.click('[data-action="scope-all"]')); break; }
  // try searching within a group
  const g=await p.$('[data-action="group"]');
  if(g){ await g.click(); await p.waitForTimeout(380); await p.fill('#search-input','press').catch(()=>{}); await p.waitForTimeout(500);
    if(await p.$('[data-action="scope-all"]')){ await chk('scope-all (group+search, preset '+i+')',()=>p.click('[data-action="scope-all"]')); break; } }
  if(i===names.length-1) console.log('scope-all                       never rendered'); }
await br.close();
