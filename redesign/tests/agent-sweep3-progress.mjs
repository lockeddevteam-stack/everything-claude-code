import {browser,page,DIR} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const go=async()=>{await p.goto(DIR+'progress.html');await p.waitForTimeout(450);};
const tap=async t=>{await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),t);await p.waitForTimeout(400);};
const txt=s=>p.evaluate(x=>document.querySelector(x)?.innerText.replace(/\s+/g,' ').slice(0,300),s);
const ae=()=>p.evaluate(()=>document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||document.activeElement.id||''));

L('=== weight write');
await go();
L('row before:',await p.evaluate(()=>document.querySelector('[data-testid="row-body-weight"]')?.innerText.replace(/\s+/g,' ')));
await tap('row-body-weight');
L('sheet rows:',await p.evaluate(()=>document.querySelectorAll('[data-testid^="w-"]').length));
await p.fill('#wt-kg','80.5'); await tap('weight-log');
L('toast:',await txt('[data-testid="toast"]'),'| focus:',await ae());
L('row after:',await p.evaluate(()=>document.querySelector('[data-testid="row-body-weight"]')?.innerText.replace(/\s+/g,' ')));
await tap('row-body-weight');
L('sheet rows now:',await p.evaluate(()=>document.querySelectorAll('[data-testid^="w-"]').length),
  'top:',await p.evaluate(()=>document.querySelectorAll('[data-testid^="w-"]')[0]?.innerText.replace(/\s+/g,' ')),
  'header:',await p.evaluate(()=>document.querySelector('.sheet__body p')?.innerText.replace(/\s+/g,' ')));
L('log same day again (79):');
await p.fill('#wt-kg','79'); await tap('weight-log');
await tap('row-body-weight');
L('rows:',await p.evaluate(()=>document.querySelectorAll('[data-testid^="w-"]').length),'top:',await p.evaluate(()=>document.querySelectorAll('[data-testid^="w-"]')[0]?.innerText.replace(/\s+/g,' ')));
L('bad weight:');
await p.fill('#wt-kg','5'); await tap('weight-log');
L('err:',await txt('[data-testid="wt-error"]'),'sheet open:',await p.evaluate(()=>!!document.querySelector('.sheet')),'focus:',await ae());

L('\n=== goals write');
await go(); await tap('row-goals');
L('sheet:',await p.evaluate(()=>document.querySelector('.sheet')?.dataset.testid),'goals:',await p.evaluate(()=>document.querySelectorAll('[data-testid^="goal-"]').length));
await tap('goals-add'); L('focus after add-goal:',await ae());
await tap('goals-save'); L('empty-name err:',await txt('[data-testid="gl-error"]'),'focus:',await ae());
await p.fill('#gl-name','Deadlift 200'); await tap('goals-save');
L('no-by err:',await txt('[data-testid="gl-error"]'),'focus:',await ae());
await p.fill('#gl-by','Dec 1'); await tap('goals-save');
L('goals now:',await p.evaluate(()=>document.querySelectorAll('[data-testid^="goal-"]').length),
  'last:',await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="goal-"]')].pop()?.innerText.replace(/\s+/g,' ')),
  'toast:',await txt('[data-testid="toast"]'),'sheet still open:',await p.evaluate(()=>!!document.querySelector('.sheet')));
L('row-goals label now:',await p.evaluate(()=>document.querySelector('[data-testid="row-goals"]')?.innerText.replace(/\s+/g,' ')));

L('\n=== record write');
await go();
const recBefore=await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '));
await tap('log-record');
await p.fill('#rec-kg','999'); await p.fill('#rec-reps','3');
await tap('rec-save');
L('toast:',await txt('[data-testid="toast"]'),'focus:',await ae());
L('records section:',await p.evaluate(()=>{const h=[...document.querySelectorAll('h2,h3')].find(e=>/record/i.test(e.textContent));
  return h?h.parentElement.innerText.replace(/\s+/g,' ').slice(0,300):'NO RECORDS SECTION';}));
L('999 anywhere on screen:',(await p.evaluate(()=>document.body.innerText)).includes('999'));
L('bad record:'); await go(); await tap('log-record'); await tap('rec-save');
L('err:',await txt('[data-testid="rec-error"]'),'focus:',await ae());

L('\n=== toast lifetime / dismiss');
await go(); await tap('log-record'); await p.fill('#rec-kg','101'); await tap('rec-save');
await p.waitForTimeout(7000);
L('toast after 7s:',await p.evaluate(()=>!!document.querySelector('[data-testid="toast"]')));

L('\n=== empty state action');
await go(); await p.evaluate(()=>document.querySelector('[data-testid="dev-state-empty"]').click());await p.waitForTimeout(300);
const u0=p.url(); await tap('empty-action'); await p.waitForTimeout(600);
L('url before',u0.split('/').pop(),'after',p.url().split('/').pop());
L('ERRS',p.__errs);
await b.close();
