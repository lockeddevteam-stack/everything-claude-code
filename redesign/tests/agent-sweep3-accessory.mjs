import {browser,page,DIR,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const m=()=>p.evaluate(()=>{const s=document.querySelector('.screen');
  const acc=s.querySelector(':scope > .findbar--bottom, :scope > #shelf-slot');
  const body=document.querySelector('#body');
  const bar=document.querySelector('.tabbar');
  const r=x=>x?[Math.round(x.getBoundingClientRect().top),Math.round(x.getBoundingClientRect().bottom)]:null;
  return {accH:s.style.getPropertyValue('--accessory-h'),
    accOffset:acc?acc.offsetHeight:null, accBox:r(acc),
    floatH:getComputedStyle(s).getPropertyValue('--float-h'),
    bodyPadBottom:body?getComputedStyle(body).paddingBottom:null,
    bar:r(bar), bodyMax:body?body.scrollHeight-body.clientHeight:null};});
for(const [f,label] of [['fuel','Fuel'],['home','Home'],['exercise-library','Library']]){
  await p.goto(DIR+f+'.html');await p.waitForTimeout(500);
  const st=await states(p);
  for(const s of st){
    await setState(p,s.id);
    await p.waitForTimeout(400);
    L(label,s.label,JSON.stringify(await m()));
  }
  L('');
}
L('--- exercise-library: state changes that change the accessory shape');
await p.goto(DIR+'exercise-library.html');await p.waitForTimeout(500);
const st=await states(p);
for(const s of st){await setState(p,s.id);await p.waitForTimeout(400);L(' ',s.label,JSON.stringify(await m()));}
L('ERRS',p.__errs);
await b.close();
