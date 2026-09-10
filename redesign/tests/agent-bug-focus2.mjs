import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
const act=()=>p.evaluate(()=>document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||document.activeElement.id||''));
await p.goto(D+'review.html');await p.waitForTimeout(500);
for (const t of ['action-save','action-discard','ai-ask','split-update','split-keep']) {
  await p.goto(D+'review.html');await p.waitForTimeout(400);
  const l=p.locator(`[data-testid="${t}"]`).first();
  if(!await l.count()){console.log(t,'MISSING');continue;}
  await l.click().catch(e=>console.log(t,'clickfail'));await p.waitForTimeout(500);
  const still=await p.locator(`[data-testid="${t}"]`).count();
  console.log(t,'-> focus',await act(),'| element still present:',still);
}
console.log('--- workout-log pad ---');
await p.goto(D+'workout-log.html');await p.waitForTimeout(700);
const cells=await p.$$eval('[data-testid]',e=>e.filter(x=>/^cell-|weight|reps/.test(x.dataset.testid)).map(x=>x.dataset.testid).slice(0,10));
console.log('cell-ish testids',cells);
await b.close();
