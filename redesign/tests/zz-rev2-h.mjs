import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
const clk=s=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return false;e.click();return true;},s);
const dump=()=>p.evaluate(()=>document.querySelector('[data-testid="fuel-scroll"]').textContent.replace(/\s+/g,' ').replace(/.*Protein/,'Protein').slice(0,60));
await p.goto(D+'fuel.html');await p.waitForTimeout(700);
console.log('macros before portion:',await dump());
await p.evaluate(()=>document.querySelectorAll('[data-action="meal"]')[1].click());await p.waitForTimeout(500);
await clk('[data-testid="meal-swap"]');await p.waitForTimeout(500); // "A quarter more"
console.log('macros after +25% portion:',await dump());
console.log('meal row now:',await p.evaluate(()=>document.querySelectorAll('[data-action="meal"]')[1].textContent.replace(/\s+/g,' ')));

// Escape leaves camOil set
await p.goto(D+'fuel.html');await p.waitForTimeout(700);
await clk('[data-testid="log-cam"]');await p.waitForTimeout(400);
await clk('[data-testid="cam-a3"]');await p.waitForTimeout(300);
await p.keyboard.press('Escape');await p.waitForTimeout(400);
await clk('[data-testid="log-cam"]');await p.waitForTimeout(400);
console.log('cam sheet after Escape+reopen:',await p.evaluate(()=>{
  const s=document.querySelector('[data-testid="sheet-cam"]');return s?s.textContent.replace(/\s+/g,' ').slice(0,180):null;}));

// accessory measurement
for(const [f,sel] of [['exercise-library.html','#findbar'],['fuel.html','#shelf-slot']]) {
  await p.goto(D+f);await p.waitForTimeout(900);
  const r=await p.evaluate(s=>{
    const scr=document.querySelector('.screen');
    const acc=document.querySelector(s);
    return {inline:scr.style.getPropertyValue('--accessory-h'), accH:acc?acc.offsetHeight:null,
            floatH:getComputedStyle(scr).getPropertyValue('--float-h')};
  },sel);
  console.log(f,JSON.stringify(r));
}
// corner-shape squircle support
await p.goto(D+'home.html');await p.waitForTimeout(400);
console.log('corner-shape:',await p.evaluate(()=>{
  const d=document.createElement('div');d.style.cornerShape='squircle';document.body.appendChild(d);
  const a=getComputedStyle(d).cornerShape; d.style.cornerShape='superellipse(2)';
  const bq=getComputedStyle(d).cornerShape;
  d.style.cornerShape='superellipse(1.8)';const c=getComputedStyle(d).cornerShape;
  return {squircle:a, sup2:bq, sup18:c, ua:navigator.userAgent.match(/Chrome\/[\d.]+/)[0]};
}));
await b.close();
