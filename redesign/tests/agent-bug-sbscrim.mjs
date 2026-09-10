import { chromium } from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/08-build/split-builder.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto(U);await p.waitForTimeout(400);
await p.locator('[data-testid="dev-toggle"]').click();await p.waitForTimeout(150);
await p.locator('[data-testid="dev-preset-5"]').click();await p.waitForTimeout(500);
const st=()=>p.evaluate(()=>({dlg:!!document.querySelector('[data-testid="leave-dialog"]'),scrimAction:document.querySelector('.scrim')?.getAttribute('data-action')||null}));
console.log('open:',JSON.stringify(await st()));
await p.locator('.scrim').click({position:{x:10,y:10},force:true});await p.waitForTimeout(400);
console.log('after scrim click:',JSON.stringify(await st()));
await p.keyboard.press('Escape');await p.waitForTimeout(400);
console.log('after Escape:',JSON.stringify(await st()));
// also the pick sheet scrim
await p.goto(U);await p.waitForTimeout(400);
await p.locator('[data-testid="dev-toggle"]').click();await p.waitForTimeout(150);
await p.locator('[data-testid="dev-preset-2"]').click();await p.waitForTimeout(500);
const add=p.locator('[data-testid^="add-ex-"]').first();
if(await add.count()){await add.click();await p.waitForTimeout(400);
  console.log('pick sheet open:',await p.evaluate(()=>({sheet:!!document.querySelector('.sheet'),scrimAction:document.querySelector('.scrim')?.getAttribute('data-action')||null})));
  await p.locator('.scrim').click({position:{x:10,y:10},force:true});await p.waitForTimeout(400);
  console.log('after scrim click:',await p.evaluate(()=>({sheet:!!document.querySelector('.sheet')})));}
await b.close();
