import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/fuel.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
const T=t=>'[data-testid="'+t+'"]';
const snap=()=>p.evaluate(()=>document.documentElement.innerHTML);
for(const tid of ['meal-0','open-meals','chip-trends','chip-water','chip-supps','log-mic','log-cam']){
  await p.goto(U); await p.waitForTimeout(400);
  const el=await p.$(T(tid)); if(!el){console.log(tid.padEnd(16),'ABSENT');continue;}
  const b=await snap(); await el.click(); await p.waitForTimeout(450); const a=await snap();
  console.log(tid.padEnd(16), b===a?'NO CHANGE (dead)':'changed', 'overlay sheets='+await p.evaluate(()=>document.querySelectorAll('#overlay .sheet, #overlay .dialog').length));
}
await p.goto(U+'?state=live'); await p.waitForTimeout(400);
const sh=await p.$(T('shelf-resume'));
if(sh){const b=await snap(); await sh.click(); await p.waitForTimeout(450); console.log('shelf-resume    ', b===await snap()?'NO CHANGE (dead)':'changed');}
await br.close();
