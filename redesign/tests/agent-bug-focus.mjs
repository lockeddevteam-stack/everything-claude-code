import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
const act=()=>p.evaluate(()=>document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||document.activeElement.id||''));
// 1. exercise-library: open detail from a row, close it
await p.goto(D+'exercise-library.html');await p.waitForTimeout(500);
await p.locator('#dev-toggle').click();await p.waitForTimeout(120);
await p.locator('[data-testid="dev-preset-4"]').click();await p.waitForTimeout(500); // Group: Chest
const row=p.locator('[data-testid^="row-ex-"]').first();
console.log('exlib: row testid', await row.getAttribute('data-testid'));
await row.click();await p.waitForTimeout(400);
console.log('exlib: after opening detail, focus =', await act());
await p.locator('[data-testid="sheet-close"]').click();await p.waitForTimeout(400);
console.log('exlib: after sheet-close, focus =', await act(), '(should return to the row)');
// 2. workout-log pad
await p.goto(D+'workout-log.html');await p.waitForTimeout(600);
const cell=p.locator('[data-act="open-pad"]').first();
if(await cell.count()){const tid=await cell.getAttribute('data-testid');
  await cell.click();await p.waitForTimeout(400);console.log('wlog: opened pad from',tid,'focus =',await act());
  await p.locator('[data-testid="pad-cancel"]').click().catch(()=>{});await p.waitForTimeout(400);
  console.log('wlog: after pad-cancel, focus =',await act(),'(should return to',tid+')');}
// 3. progress (the screen that does restore)
await p.goto(D+'progress.html');await p.waitForTimeout(500);
await p.locator('[data-testid="choose-lift"]').click();await p.waitForTimeout(400);
console.log('progress: after open sheet, focus =',await act());
await p.locator('[data-testid="sheet-close"]').click();await p.waitForTimeout(400);
console.log('progress: after sheet-close, focus =',await act());
// 4. review save
await p.goto(D+'review.html');await p.waitForTimeout(500);
await p.locator('[data-testid="action-save"]').click();await p.waitForTimeout(400);
console.log('review: after action-save, focus =',await act());
await b.close();
