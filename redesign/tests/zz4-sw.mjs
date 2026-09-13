import {open,DEMO,T} from './zz4-lib.mjs';
const list=['switch-fuel-numbers','switch-badges','switch-perf','switch-rest-timer','switch-partial-reps','switch-workout-reminder','sync-now','row-storage','row-storage-unit','sound-beep','notif-blocked'];
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1400);
for(const tid of list){
  await p.goto(DEMO+'#/profile/settings'); await p.reload(); await p.waitForTimeout(1100);
  const el=p.locator('[data-testid="'+tid+'"]').first();
  const snap=async()=>p.evaluate(t=>{const e=document.querySelector('[data-testid="'+t+'"]');if(!e)return 'gone';const r=e.closest('.row,li,div')||e;return (e.getAttribute('aria-checked')||'-')+'|'+(e.getAttribute('aria-pressed')||'-')+'|'+r.innerText.replace(/\s+/g,' ').slice(0,90)+'|LS:'+Object.keys(localStorage).length},tid);
  const a=await snap();
  try{await el.click({timeout:2500})}catch(e){console.log(tid,'not clickable');continue}
  await p.waitForTimeout(800);
  const c=await snap();
  const toast=await p.locator('[data-testid="toast"]').count();
  console.log(tid, a===c?'NO CHANGE':'changed', '| toast:',toast?T(await p.locator('[data-testid="toast"]').innerText()).slice(0,60):'-');
  if(a!==c)console.log('   ',a,'\n   ->',c);
}
console.log('ERRS',errs);
await b.close();
