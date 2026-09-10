import { chromium } from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto(U);await p.waitForTimeout(400);
await p.locator('#dev-toggle').click();await p.waitForTimeout(120);
await p.locator('[data-testid="dev-preset-5"]').click();await p.waitForTimeout(500);
const state=()=>p.evaluate(()=>({days:!!document.querySelector('[data-testid="sheet-days"]'),detail:!!document.querySelector('[data-testid="sheet-detail"]'),
  dlgs:[...document.querySelectorAll('.sheet')].filter(e=>e.offsetParent!==null).map(e=>e.dataset.testid),
  active:document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||'')}));
console.log('before', JSON.stringify(await state()));
await p.locator('[data-testid="sheet-secondary"]').click();await p.waitForTimeout(400);
console.log('after open', JSON.stringify(await state()));
await p.keyboard.press('Escape');await p.waitForTimeout(400);
console.log('after Esc', JSON.stringify(await state()));
await p.keyboard.press('Escape');await p.waitForTimeout(400);
console.log('after Esc2', JSON.stringify(await state()));
await b.close();
