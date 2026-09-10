import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/progress.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
const T=t=>'[data-testid="'+t+'"]';
const snap=()=>p.evaluate(()=>document.getElementById('screen').innerHTML);
for(const tid of ['log-record','row-body-weight','row-goals','choose-lift','open-picker']){
  await p.goto(U); await p.waitForTimeout(400);
  const el=await p.$(T(tid)); if(!el){console.log(tid.padEnd(20),'ABSENT');continue;}
  const b=await snap(); await el.click(); await p.waitForTimeout(450); const a=await snap();
  console.log(tid.padEnd(20), b===a?'NO CHANGE':'changed', await p.evaluate(()=>document.querySelectorAll('#overlay .sheet').length)+' sheet(s)');
}
await p.goto(U+'?state=empty'); await p.waitForTimeout(400);
console.log('empty state testids', await p.evaluate(()=>Array.from(document.querySelectorAll('#body [data-testid]')).map(e=>e.dataset.testid).slice(0,10)));
await br.close();
