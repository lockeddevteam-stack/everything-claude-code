import {browser,page,DIR} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const geo=()=>p.evaluate(()=>{const s=document.querySelector('.sheet[data-detents]');if(!s)return null;
  const r=s.getBoundingClientRect();const cs=getComputedStyle(s);
  return {h:s.style.height, full:s.style.getPropertyValue('--full'),
    l:Math.round(r.left),rt:Math.round(r.right),t:Math.round(r.top),bo:Math.round(r.bottom),
    rad:cs.borderBottomLeftRadius, radTop:cs.borderTopLeftRadius};});
async function drag(from,to,steps=8){
  const g=await p.evaluate(()=>{const h=document.querySelector('.sheet[data-detents] [data-sheet-drag]')||document.querySelector('.sheet[data-detents] .sheet__grab');
    const r=h.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
  await p.mouse.move(g.x,g.y); await p.mouse.down();
  for(let i=1;i<=steps;i++){await p.mouse.move(g.x, g.y + (to-from)*i/steps); await p.waitForTimeout(30);
    if(i===Math.ceil(steps/2))L('   mid ',JSON.stringify(await geo()));}
  L('   preRelease',JSON.stringify(await geo()));
  await p.mouse.up();
}
for(const [file,opener] of [['progress.html','choose-lift'],['progress.html','row-body-weight'],['fuel.html','meal-0'],['shopping.html','add-purchase']]){
  await p.goto(DIR+file);await p.waitForTimeout(500);
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),opener);
  await p.waitForTimeout(500);
  const g0=await geo(); if(!g0){L(file,opener,'-> no detent sheet');continue;}
  L(file,opener,'open   ',JSON.stringify(g0));
  await drag(0,120);
  await p.waitForTimeout(120); L('   +120ms',JSON.stringify(await geo()));
  await p.waitForTimeout(900); L('   settled',JSON.stringify(await geo()));
  // drag back up
  await drag(0,-400);
  await p.waitForTimeout(120); L('   up+120ms',JSON.stringify(await geo()));
  await p.waitForTimeout(900); L('   up settled',JSON.stringify(await geo()));
  // drag far down: dismissible?
  await drag(0,700,10);
  await p.waitForTimeout(900);
  L('   after big pull-down: sheet present=',await p.evaluate(()=>!!document.querySelector('.sheet')),JSON.stringify(await geo()));
  L('');
}
L('ERRS',p.__errs);
await b.close();
