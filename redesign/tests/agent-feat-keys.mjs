import { chromium } from '@playwright/test';
const U='file:///home/user/everything-claude-code/redesign/08-build/shopping.html';
const br=await chromium.launch(); const p=await br.newPage({viewport:{width:390,height:844}});
const T=t=>'[data-testid="'+t+'"]';
await p.goto(U); await p.waitForTimeout(350);
let n=await p.evaluate(()=>document.querySelectorAll('[data-testid^="item-"]').length);
await p.fill(T('add-name'),'Papaya'); await p.press(T('add-name'),'Enter'); await p.waitForTimeout(400);
console.log('list Enter-to-add:', n, '->', await p.evaluate(()=>document.querySelectorAll('[data-testid^="item-"]').length));
await p.goto(U+'?panel=pantry'); await p.waitForTimeout(350);
n=await p.evaluate(()=>document.querySelectorAll('[data-testid^="pan-p"]').length);
await p.fill(T('pan-name'),'Paprika'); await p.press(T('pan-name'),'Enter'); await p.waitForTimeout(400);
console.log('pantry Enter-to-add:', n, '->', await p.evaluate(()=>document.querySelectorAll('[data-testid^="pan-p"]').length));
await p.goto(U+'?panel=budget'); await p.waitForTimeout(350);
await p.fill(T('cmp-input'),'chicken'); await p.press(T('cmp-input'),'Enter'); await p.waitForTimeout(400);
console.log('compare Enter: no error thrown');
// interval validation
await p.goto(U+'?panel=pantry'); await p.waitForTimeout(350);
const st=await p.$('[data-testid^="pan-open-"]');
await st.click(); await p.waitForTimeout(350);
const iv=await p.$('[data-testid^="iv-"]:not([data-testid^="iv-save"]):not([data-testid="iv-error"])');
if(iv){ await iv.fill('900'); await (await p.$('[data-testid^="iv-save-"]')).click(); await p.waitForTimeout(350);
  console.log('interval 900 ->', await p.evaluate(()=>!!document.querySelector('[data-testid="iv-error"]'))?'error shown':'NO ERROR'); }
else console.log('interval field absent on this item');
await br.close();
