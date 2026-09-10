import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
const clk=s=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return false;e.click();return true;},s);
const macros=()=>p.evaluate(()=>[...document.querySelectorAll('[data-testid^="macro-"]')].map(e=>e.textContent.trim()));
await p.goto(D+'fuel.html');await p.waitForTimeout(700);
const dump=()=>p.evaluate(()=>{
  const el=document.querySelector('[data-testid="fuel-scroll"]');
  return el.textContent.replace(/\s+/g,' ').slice(0,600);
});
console.log('BEFORE:',await dump());
await clk('[data-testid="log-cam"]');await p.waitForTimeout(500);
await clk('[data-testid="cam-a3"]');await p.waitForTimeout(300);   // "A lot" -> +160 kcal, +18 fat
await clk('[data-testid="cam-confirm"]');await p.waitForTimeout(500);
console.log('AFTER LOG:',await dump());
// now delete that meal (it is the last one)
const idx=await p.evaluate(()=>document.querySelectorAll('[data-testid^="meal-"]').length);
await p.evaluate(()=>{const rows=[...document.querySelectorAll('[data-action="meal"]')];rows[rows.length-1].click();});
await p.waitForTimeout(500);
await clk('[data-testid="meal-delete"]');await p.waitForTimeout(600);
console.log('AFTER DELETE:',await dump());
await b.close();
