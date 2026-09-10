import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
const clk=s=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return false;e.click();return true;},s);
const cnt=s=>p.evaluate(sel=>document.querySelectorAll(sel).length,s);
await p.goto(D+'shopping.html');await p.waitForTimeout(700);
await p.evaluate(()=>{const b=[...document.querySelectorAll('[data-action="panel"]')].find(x=>/budget/i.test(x.textContent));if(b)b.click();});
await p.waitForTimeout(400);
console.log('add-purchase present:',await cnt('[data-testid="add-purchase"]'));
await clk('[data-testid="add-purchase"]');await p.waitForTimeout(300);
await clk('[data-testid="save-purchase"]');await p.waitForTimeout(300);
console.log('error after empty save =',await cnt('[data-testid="p-error"]'),'|',
  await p.evaluate(()=>{const e=document.querySelector('[data-testid="p-error"]');return e&&e.textContent;}));
await clk('[data-testid="add-purchase"]');await p.waitForTimeout(250);
console.log('  form collapsed?',(await cnt('[data-testid="save-purchase"]'))===0);
await clk('[data-testid="add-purchase"]');await p.waitForTimeout(300);
console.log('  error after collapse+REOPEN =',await cnt('[data-testid="p-error"]'));
// store required check: leave select on prompt
console.log('  p-store options:',await p.evaluate(()=>{const s=document.getElementById('p-store');return s?[...s.options].map(o=>o.value+'/'+o.text):null;}));
await b.close();
