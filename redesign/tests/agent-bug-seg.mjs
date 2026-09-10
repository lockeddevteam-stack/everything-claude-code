import { chromium } from 'playwright';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/coach.html');await p.waitForTimeout(500);
const st=()=>p.evaluate(()=>({chat:document.querySelector('[data-testid="seg-chat"]')?.getAttribute('aria-selected'),
  plan:document.querySelector('[data-testid="seg-plan"]')?.getAttribute('aria-selected'),
  setup:document.querySelector('[data-testid="seg-setup"]')?.getAttribute('aria-selected')}));
console.log('start',JSON.stringify(await st()));
for(const t of ['seg-plan','seg-setup','seg-chat']){await p.locator(`[data-testid="${t}"]`).click();await p.waitForTimeout(400);console.log('after',t,JSON.stringify(await st()));}
console.log('--- exercise-library filters ---');
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html');await p.waitForTimeout(500);
const fs=()=>p.evaluate(()=>[...document.querySelectorAll('[data-action="filter"]')].map(e=>e.dataset.testid+'='+e.getAttribute('aria-pressed')));
console.log('start',await fs());
await p.locator('[data-testid="filter-custom"]').click();await p.waitForTimeout(400);
console.log('after filter-custom',await fs());
await b.close();
