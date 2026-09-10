import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
const act=()=>p.evaluate(()=>document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||document.activeElement.id||''));
// workout-log: open numeric pad from a cell, cancel and done
for (const closer of ['pad-cancel','pad-done','pad-scrim']) {
  await p.goto(D+'workout-log.html');await p.waitForTimeout(600);
  await p.locator('[data-testid="cell-0-3-weight"]').click();await p.waitForTimeout(400);
  const opened=await p.locator('[data-testid="pad-sheet"]').count();
  const f1=await act();
  const c=p.locator(`[data-testid="${closer}"]`);
  if(!await c.count()){console.log('wlog',closer,'MISSING (pad open='+opened+')');continue;}
  await c.click({force:true});await p.waitForTimeout(400);
  console.log('wlog cell-0-3-weight -> pad(open='+opened+', focus='+f1+') ->',closer,'-> focus',await act(),'padStillOpen=',await p.locator('[data-testid="pad-sheet"]').count());
}
// coach interview
await p.goto(D+'coach.html');await p.waitForTimeout(500);
await p.locator('#dev-toggle').click();await p.waitForTimeout(150);
await p.locator('[data-testid="dev-preset-12"]').click();await p.waitForTimeout(600);
console.log('coach preset12 focus',await act(),'ivOpen',await p.locator('[data-testid="iv-close"]').count());
if(await p.locator('[data-testid="iv-close"]').count()){await p.locator('[data-testid="iv-close"]').click();await p.waitForTimeout(500);
  console.log('coach after iv-close: focus',await act());}
// split-builder leave-cancel
await p.goto(D+'split-builder.html');await p.waitForTimeout(500);
await p.locator('[data-testid="dev-toggle"]').click();await p.waitForTimeout(150);
await p.locator('[data-testid="dev-preset-5"]').click();await p.waitForTimeout(600);
console.log('sb leave dialog focus on open:',await act());
await p.locator('[data-testid="leave-cancel"]').click();await p.waitForTimeout(500);
console.log('sb after leave-cancel: focus',await act());
await b.close();
