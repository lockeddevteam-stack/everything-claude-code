import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/shopping.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
const T=t=>'[data-testid="'+t+'"]';
// pantry out-of-stock -> item lands on shopping list
await p.goto(U+'?panel=pantry'); await p.waitForTimeout(400);
const name=await p.evaluate(()=>document.querySelector('[data-testid^="pan-open-"] .item__name').textContent.trim());
await p.click('[data-testid^="pan-open-"]'); await p.waitForTimeout(350);
await p.click(T('pn-empty')); await p.waitForTimeout(400);
await p.click(T('seg-list')); await p.waitForTimeout(400);
const on=await p.evaluate(n=>Array.from(document.querySelectorAll('.item__name')).some(e=>e.textContent.includes(n)),name);
console.log('pantry "I have run out" of', JSON.stringify(name), '-> on shopping list:', on);
// staple toggle persistence across panels
await p.goto(U+'?panel=pantry'); await p.waitForTimeout(400);
await p.click('[data-testid^="pan-open-"]'); await p.waitForTimeout(350);
await p.click(T('pn-staple')); await p.waitForTimeout(400);
console.log('after pn-staple, interval field present:', !!(await p.$('[data-testid^="iv-save-"]')));
// store toggle affects the list panel's Shop-at availability
await p.goto(U+'?panel=stores'); await p.waitForTimeout(400);
const tg=await p.$$('[data-testid^="toggle-"]');
for(const t of tg){ if((await t.getAttribute('aria-checked'))==='true') await t.click(); await p.waitForTimeout(200); }
await p.click(T('seg-list')); await p.waitForTimeout(400);
console.log('all stores off -> Shop at button present:', !!(await p.$(T('shop-at'))));
await br.close();
