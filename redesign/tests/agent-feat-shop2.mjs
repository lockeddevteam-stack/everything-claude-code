import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/shopping.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
const T=t=>'[data-testid="'+t+'"]';
const items=()=>p.evaluate(()=>document.querySelectorAll('[data-testid^="item-"]').length);
const done=()=>p.evaluate(()=>document.querySelectorAll('.item--done').length);
const hist=()=>p.evaluate(()=>document.querySelectorAll('[data-testid^="hist-h"]').length);
const total=()=>p.evaluate(()=>{const e=document.querySelector('[data-testid="week-spent"]');return e?e.textContent:'-';});

await p.goto(U); await p.waitForTimeout(350);
console.log('list before', await items(), 'done', await done());
await p.click(T('clear-done')); await p.waitForTimeout(300); await p.click(T('confirm-clear-done')); await p.waitForTimeout(350);
console.log('after CONFIRM clear-done  ->', await items(), 'done', await done());
await p.goto(U); await p.waitForTimeout(350);
await p.click(T('clear-all')); await p.waitForTimeout(300); await p.click(T('confirm-clear-all')); await p.waitForTimeout(350);
console.log('after CONFIRM clear-all   ->', await items());

await p.goto(U); await p.waitForTimeout(350);
await p.fill(T('add-name'),'Chicken breast'); await p.waitForTimeout(300);
console.log('before dup add', await items());
await p.click(T('add-item')); await p.waitForTimeout(300); await p.click(T('merge-do')); await p.waitForTimeout(350);
console.log('after MERGE               ->', await items(), (await p.evaluate(()=>{const e=[...document.querySelectorAll('.item__name')].filter(x=>/Chicken breast/i.test(x.textContent));return e.map(x=>x.textContent.trim());})).join(' | '));
await p.goto(U); await p.waitForTimeout(350);
await p.fill(T('add-name'),'Chicken breast'); await p.waitForTimeout(300);
await p.click(T('add-item')); await p.waitForTimeout(300); await p.click(T('merge-sep')); await p.waitForTimeout(350);
console.log('after ADD SEPARATE        ->', await items());

await p.goto(U+'?panel=budget'); await p.waitForTimeout(350);
console.log('budget before: hist', await hist(), 'spent', await total());
await p.click(T('add-purchase')); await p.waitForTimeout(300);
await p.fill(T('p-name'),'Eggs'); await p.fill(T('p-price'),'4.50'); await p.click(T('save-purchase')); await p.waitForTimeout(350);
console.log('after SAVE PURCHASE   -> hist', await hist(), 'spent', await total());
await p.goto(U+'?panel=budget'); await p.waitForTimeout(350);
await p.click(T('scan-cam')); await p.waitForTimeout(350); await p.click(T('receipt-save')); await p.waitForTimeout(350);
console.log('after RECEIPT SAVE    -> hist', await hist(), 'spent', await total());
await br.close();
