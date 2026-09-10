import { chromium } from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/08-build/split-builder.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto(U);await p.waitForTimeout(400);
await p.locator('[data-testid="dev-toggle"]').click();await p.waitForTimeout(150);
await p.locator('[data-testid="dev-preset-0"]').click();await p.waitForTimeout(400);
console.log('name field present:', await p.locator('[data-testid="split-name"]').count());
await p.locator('[data-testid="split-name"]').click();
for (const ch of 'Push') { await p.keyboard.type(ch); await p.waitForTimeout(250);
  const st=await p.evaluate(()=>{const e=document.querySelector('[data-testid="split-name"]');
    return {present:!!e, val:e&&e.value, focus:document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||'')};});
  console.log('typed "'+ch+'" ->',JSON.stringify(st)); }
console.log('--- screen text ---\n'+(await p.evaluate(()=>document.body.innerText.slice(0,240))));
await b.close();
