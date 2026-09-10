import {browser,page,DEMO,DIR} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const boot=async(h='')=>{await p.goto(DEMO+h);await p.waitForFunction(()=>window.DEMO,{timeout:15000});await p.waitForTimeout(900);};
const vis=()=>p.evaluate(()=>[...document.querySelectorAll('[data-screen]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none';}).map(e=>e.dataset.screen));
const q=(sid,sel)=>p.evaluate(([i,s])=>{const h=document.querySelector('[data-screen="'+i+'"]');const r=h.shadowRoot||h;
  return [...r.querySelectorAll(s)].map(e=>e.dataset.testid+'|'+e.textContent.trim().slice(0,30));},[sid,sel]);
const click=(sid,sel)=>p.evaluate(([i,s])=>{const h=document.querySelector('[data-screen="'+i+'"]');const r=h.shadowRoot||h;
  const e=r.querySelector(s);if(!e)return 'NOSEL';e.click();return 'ok';},[sid,sel]);

L('=== A. workout-log Finish in the demo');
await boot('#/train/workout-log');
L('visible',await vis());
L('data-action="finish" matches:',await q('workout-log','[data-action="finish"]'));
L('data-act="finish" matches:',await q('workout-log','[data-act="finish"]'));
L('btn-finish:',await q('workout-log','[data-testid="btn-finish"]'));
L('click btn-finish ->',await click('workout-log','[data-testid="btn-finish"]'));
await p.waitForTimeout(1200);
L('after Finish: visible',await vis(),'hash',await p.evaluate(()=>location.hash));
L('overlay in workout-log:',await p.evaluate(()=>{const h=document.querySelector('[data-screen="workout-log"]');const r=h.shadowRoot;
  return [...r.querySelectorAll('.sheet,.dialog')].map(e=>e.dataset.testid);}));
L('errs',p.__errs.splice(0));

L('\n=== B. coach plan Start in the demo');
await boot('#/coach');
await p.evaluate(()=>{const r=document.querySelector('[data-screen="coach"]').shadowRoot;
  const tg=r.querySelector('[data-testid="dev-toggle"]');if(tg)tg.click();
  const it=[...r.querySelectorAll('.dev__item')].find(b=>/Plan \/ populated/.test(b.textContent));if(it)it.click();
  const m=r.querySelector('#dev-menu');if(m)m.hidden=true;});
await p.waitForTimeout(700);
L('data-act="plan-start":',await q('coach','[data-act="plan-start"]'));
L('plan-start testid:',await q('coach','[data-testid="plan-start"]'));
L('click plan-start ->',await click('coach','[data-testid="plan-start"]'));await p.waitForTimeout(1000);
L('after: visible',await vis(),'hash',await p.evaluate(()=>location.hash),p.__errs.splice(0));

L('\n=== C. train edit-split');
await boot('#/train');
for(const label of ['Populated','Empty','Loading','Error']){
  await p.evaluate(l=>{const r=document.querySelector('[data-screen="train"]').shadowRoot;
    const tg=r.querySelector('[data-testid="dev-toggle"]');if(tg)tg.click();
    const it=[...r.querySelectorAll('.dev__item')].find(b=>b.textContent.trim()===l);if(it)it.click();
    const m=r.querySelector('#dev-menu');if(m)m.hidden=true;},label);
  await p.waitForTimeout(500);
  L(' ',label,'edit-split present:',JSON.stringify(await q('train','[data-action="edit-split"]')));
}
L('standalone train.html:');
await p.goto(DIR+'train.html');await p.waitForTimeout(600);
L('  edit-split:',await p.evaluate(()=>[...document.querySelectorAll('[data-action="edit-split"]')].map(e=>{const r=e.getBoundingClientRect();return e.dataset.testid+' '+Math.round(r.top)+'-'+Math.round(r.bottom);})));
L('  inside a sheet?',await p.evaluate(()=>{const e=document.querySelector('[data-action="edit-split"]');return e?!!e.closest('.sheet,.dialog'):null;}));
L('  what opens it:',await p.evaluate(()=>{const e=document.querySelector('[data-action="edit-split"]');return e?e.closest('[data-testid]')?.dataset.testid:null;}));

L('\n=== D. deep route #/train/workout-log/review');
await boot();
await p.evaluate(()=>{location.hash='#/train/workout-log/review';});await p.waitForTimeout(1000);
L('visible',await vis(),'hash',await p.evaluate(()=>location.hash),'back',await p.evaluate(()=>document.getElementById('demo-back')?.textContent.trim()));
L('\nERRS',p.__errs);
await b.close();
