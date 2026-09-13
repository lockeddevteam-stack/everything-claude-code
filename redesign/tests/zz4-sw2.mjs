import {open,DEMO,T} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1400);
for(const tid of ['switch-badges','switch-fuel-numbers','switch-rest-timer','sync-now']){
  const g=async()=>p.evaluate(t=>{const e=document.querySelector('[data-testid="'+t+'"]');return e?e.outerHTML.slice(0,200):'gone'},tid);
  const ls=async()=>p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage))).length);
  console.log('\n'+tid); console.log(' before:',await g(),'LSlen',await ls());
  await p.click('[data-testid="'+tid+'"]'); await p.waitForTimeout(900);
  console.log(' after :',await g(),'LSlen',await ls());
  const t=p.locator('[data-testid="toast"]'); if(await t.count())console.log(' toast:',T(await t.innerText()));
}
console.log('ERRS',errs);
await b.close();
