import {browser,page,DIR} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const go=async()=>{await p.goto(DIR+'shopping.html');await p.waitForTimeout(500);};
const tap=async t=>{await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),t);await p.waitForTimeout(400);};
const txt=s=>p.evaluate(x=>document.querySelector(x)?.innerText.replace(/\s+/g,' ').slice(0,300),s);
const names=()=>p.evaluate(()=>[...document.querySelectorAll('.item__name')].map(e=>e.textContent.trim()));
const ticked=()=>p.evaluate(()=>[...document.querySelectorAll('[data-action="tick"]')].map(e=>e.getAttribute('aria-pressed')||e.getAttribute('aria-checked')));

L('=== exactly ONE picked up');
await go();
L('toggles:',(await ticked()).join(','));
await p.evaluate(()=>{[...document.querySelectorAll('[data-action="tick"]')].forEach(e=>{if((e.getAttribute('aria-pressed')||e.getAttribute('aria-checked'))==='true')e.click();});});
await p.waitForTimeout(400);
L('all off:',(await ticked()).join(','));
await p.evaluate(()=>document.querySelectorAll('[data-action="tick"]')[0].click());await p.waitForTimeout(400);
await tap('clear-done');
L('dialog:',await txt('.dialog'));
await p.keyboard.press('Escape');await p.waitForTimeout(300);

L('\n=== ALL picked up -> clear-all');
await go();
await p.evaluate(()=>{[...document.querySelectorAll('[data-action="tick"]')].forEach(e=>{if((e.getAttribute('aria-pressed')||e.getAttribute('aria-checked'))!=='true')e.click();});});
await p.waitForTimeout(600);
L('ticked:',(await ticked()).join(','));
await tap('clear-all'); L('dialog:',await txt('.dialog'));
await p.keyboard.press('Escape');await p.waitForTimeout(300);

L('\n=== undo ordering after clear-done');
await go();
const before=await names(); L('before:',before.join(' | '));
await tap('clear-done');
const cbtn=await p.evaluate(()=>[...document.querySelectorAll('.dialog button')].map(e=>e.dataset.testid+':'+e.textContent.trim()));
L('dialog buttons:',cbtn);
await p.evaluate(()=>{const b=[...document.querySelectorAll('.dialog button')].find(e=>/^Clear/.test(e.textContent.trim()));b.click();});
await p.waitForTimeout(500);
L('after clear:',(await names()).join(' | '));
L('toast:',await txt('[data-testid="toast"]'));
await p.evaluate(()=>document.querySelector('[data-testid="undo"],.toast__action')?.click());await p.waitForTimeout(500);
const after=await names(); L('after undo:',after.join(' | '));
L('ORDER RESTORED:',JSON.stringify(before)===JSON.stringify(after));

L('\n=== undo ordering after clear-all');
await go();
const b2=await names();
await tap('clear-all');
await p.evaluate(()=>{const b=[...document.querySelectorAll('.dialog button')].find(e=>/^Empty/.test(e.textContent.trim()));b.click();});
await p.waitForTimeout(500);
L('after empty:',(await names()).join(' | ')||'(none)');
await p.evaluate(()=>document.querySelector('[data-testid="undo"],.toast__action')?.click());await p.waitForTimeout(500);
const a2=await names();
L('ORDER RESTORED:',JSON.stringify(b2)===JSON.stringify(a2));
if(JSON.stringify(b2)!==JSON.stringify(a2))L(' before:',b2.join('|'),'\n after:',a2.join('|'));

L('\n=== back button standalone');
await go();
const u=p.url(); await tap('back'); await p.waitForTimeout(500);
L('url',u.split("/").pop(),'->',p.url().split('/').pop());
L('ERRS',p.__errs);
await b.close();
