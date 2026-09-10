import {browser,page,DIR} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const go=async()=>{await p.goto(DIR+'shopping.html');await p.waitForTimeout(500);};
const tap=async t=>{await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),t);await p.waitForTimeout(400);};
const txt=s=>p.evaluate(x=>document.querySelector(x)?.innerText.replace(/\s+/g,' ').slice(0,300),s);
const body=()=>p.evaluate(()=>document.querySelector('#body')?.innerText.replace(/\s+/g,' ')||document.body.innerText.replace(/\s+/g,' '));

L('=== purchase validation');
await go(); await tap('seg-budget');
await tap('add-purchase');
L('sheet:',await p.evaluate(()=>document.querySelector('.sheet')?.dataset.testid));
L('store options:',await p.evaluate(()=>[...document.querySelectorAll('#p-store option')].map(o=>o.value+'|'+o.textContent)));
await p.fill('#p-name','Test item'); await p.fill('#p-price','20');
await tap('save-purchase');
L('after save with no store -> err:',await txt('[data-testid="purchase-error"]')||await p.evaluate(()=>document.querySelector('.field__error')?.innerText),
  '| sheet open:',await p.evaluate(()=>!!document.querySelector('.sheet')));
L('Unknown store on screen:',(await body()).includes('Unknown store'));
L('--- empty name');
await p.fill('#p-name',''); await tap('save-purchase');
L('err:',await p.evaluate(()=>[...document.querySelectorAll('.field__error')].map(e=>e.innerText)));
L('--- negative price');
await p.fill('#p-name','Neg'); await p.fill('#p-price','-50');
await p.evaluate(()=>{const s=document.querySelector('#p-store');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}));});
await tap('save-purchase');
L('err:',await p.evaluate(()=>[...document.querySelectorAll('.field__error')].map(e=>e.innerText)),'sheet open:',await p.evaluate(()=>!!document.querySelector('.sheet')));
L('screen:',(await body()).slice(0,260));

L('\n=== valid purchase arithmetic');
await go(); await tap('seg-budget');
L('week before:',(await body()).slice(0,260));
await tap('add-purchase');
await p.fill('#p-name','Steak'); await p.fill('#p-price','20');
await p.evaluate(()=>{const s=document.querySelector('#p-store');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}));});
if(await p.$('#p-qty'))await p.fill('#p-qty','2');
await tap('save-purchase');
L('after:',(await body()).slice(0,300));
L('toast:',await txt('[data-testid="toast"]'));

L('\n=== plurals');
await go();
const ticks=await p.evaluate(()=>[...document.querySelectorAll('[data-action="toggle"],[data-testid^="item-"]')].length);
L('items',ticks);
await tap('clear-done');
L('clear-done dialog:',await txt('.dialog')||await txt('[role=alertdialog]'));
await p.keyboard.press('Escape');await p.waitForTimeout(300);
await tap('clear-all');
L('clear-all dialog:',await txt('.dialog')||await txt('[role=alertdialog]'));
L('ERRS',p.__errs);
await b.close();
