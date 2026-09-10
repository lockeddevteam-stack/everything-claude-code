import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:402,height:874}});
const p=await ctx.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));

// --- progress: stale weight error survives close/reopen
await p.goto(D+'progress.html');await p.waitForTimeout(600);
await p.locator('[data-testid="row-body-weight"]').click();await p.waitForTimeout(500);
await p.locator('#wt-kg').fill('');
await p.locator('[data-testid="weight-log"]').click();await p.waitForTimeout(400);
console.log('progress: error after bad save =',await p.locator('[data-testid="wt-error"]').count());
await p.locator('[data-testid="scrim"]').click({force:true});await p.waitForTimeout(400);
await p.locator('[data-testid="row-body-weight"]').click();await p.waitForTimeout(500);
console.log('progress: error present on REOPEN =',await p.locator('[data-testid="wt-error"]').count(),
            '| text:',await p.locator('[data-testid="wt-error"]').first().textContent().catch(()=>null));

// goals: form state persists too
await p.locator('[data-testid="scrim"]').click({force:true});await p.waitForTimeout(300);
await p.locator('[data-testid="row-goals"]').click().catch(async()=>{
  await p.evaluate(()=>document.querySelector('[data-action="open-goals"]').click());});
await p.waitForTimeout(500);
await p.locator('[data-testid="goals-add"]').click();await p.waitForTimeout(300);
await p.locator('[data-testid="goals-save"]').click();await p.waitForTimeout(300);
console.log('goals: error after empty save =',await p.locator('[data-testid="gl-error"]').count());
await p.locator('[data-testid="scrim"]').click({force:true});await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-action="open-goals"]').click());await p.waitForTimeout(400);
console.log('goals: on REOPEN, form open =',await p.locator('[data-testid="gl-name"]').count(),
            'error =',await p.locator('[data-testid="gl-error"]').count());

// --- shopping: stale purchase error
await p.goto(D+'shopping.html');await p.waitForTimeout(600);
const dev=await p.evaluate(()=>{const b=document.querySelector('[data-testid="add-purchase"]');return !!b;});
console.log('shopping add-purchase present at start:',dev);
await p.evaluate(()=>{const b=document.querySelector('[data-testid="add-purchase"]');if(b)b.click();});
await p.waitForTimeout(400);
await p.evaluate(()=>{const b=document.querySelector('[data-testid="save-purchase"]');if(b)b.click();});
await p.waitForTimeout(400);
console.log('shopping: error after empty save =',await p.locator('[data-testid="p-error"]').count(),
  '|',await p.locator('[data-testid="p-error"]').first().textContent().catch(()=>null));
await p.evaluate(()=>document.querySelector('[data-testid="add-purchase"]').click());await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-testid="add-purchase"]').click());await p.waitForTimeout(400);
console.log('shopping: error present after close+REOPEN =',await p.locator('[data-testid="p-error"]').count());
await b.close();
