import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
const clk=s=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return false;e.click();return true;},s);
const cnt=s=>p.evaluate(sel=>document.querySelectorAll(sel).length,s);

await p.goto(D+'progress.html');await p.waitForTimeout(600);
await clk('[data-action="open-weight"]');await p.waitForTimeout(400);
await p.evaluate(()=>{document.getElementById('wt-kg').value='';});
await clk('[data-action="log-weight"]');await p.waitForTimeout(300);
console.log('progress weight: error after bad save =',await cnt('[data-testid="wt-error"]'));
await clk('[data-testid="weight-close"], [data-action="close-sheet"]');await p.waitForTimeout(400);
console.log('  sheet closed?',(await cnt('[data-testid="weight-sheet"]'))===0);
await clk('[data-action="open-weight"]');await p.waitForTimeout(400);
console.log('  error present on REOPEN =',await cnt('[data-testid="wt-error"]'),
  '|',await p.evaluate(()=>{const e=document.querySelector('[data-testid="wt-error"]');return e&&e.textContent;}));
await clk('[data-action="close-sheet"]');await p.waitForTimeout(300);

await clk('[data-action="open-goals"]');await p.waitForTimeout(400);
await clk('[data-action="add-goal"]');await p.waitForTimeout(300);
await clk('[data-action="save-goal"]');await p.waitForTimeout(300);
console.log('progress goals: error after empty save =',await cnt('[data-testid="gl-error"]'));
await clk('[data-action="close-sheet"]');await p.waitForTimeout(400);
await clk('[data-action="open-goals"]');await p.waitForTimeout(400);
console.log('  on REOPEN: form still open =',await cnt('[data-testid="gl-name"]'),'error =',await cnt('[data-testid="gl-error"]'));

await p.goto(D+'shopping.html');await p.waitForTimeout(700);
console.log('shopping: add-purchase found =',await cnt('[data-testid="add-purchase"]'));
await clk('[data-testid="add-purchase"]');await p.waitForTimeout(400);
await clk('[data-testid="save-purchase"]');await p.waitForTimeout(400);
console.log('  error after empty save =',await cnt('[data-testid="p-error"]'),'|',
  await p.evaluate(()=>{const e=document.querySelector('[data-testid="p-error"]');return e&&e.textContent;}));
await clk('[data-testid="add-purchase"]');await p.waitForTimeout(300);
await clk('[data-testid="add-purchase"]');await p.waitForTimeout(400);
console.log('  error after collapse+REOPEN =',await cnt('[data-testid="p-error"]'));
await b.close();
