import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const bar=()=>p.evaluate(()=>{const t=document.querySelector('.tabbar');if(!t)return null;
  const r=t.getBoundingClientRect();
  const items=[...t.querySelectorAll('.tabbar__item')].map(e=>{const q=e.getBoundingClientRect();
    return {id:e.dataset.testid,w:Math.round(q.width),cur:e.getAttribute('aria-current'),
      vis:getComputedStyle(e).display!=='none'&&q.width>0,
      hit:(document.elementFromPoint(Math.round(q.left+q.width/2),Math.round(q.top+q.height/2))||{}).dataset?.testid};});
  return {min:t.getAttribute('data-minimized'),l:Math.round(r.left),rt:Math.round(r.right),
    t:Math.round(r.top),bo:Math.round(r.bottom),items};});
const sc=()=>p.evaluate(()=>{const s=document.querySelector('.screen');
  const b=document.querySelector('#body');
  return {screenScrollTop:s.scrollTop,screenSH:s.scrollHeight,screenCH:s.clientHeight,
    bodySH:b?b.scrollHeight:0,bodyCH:b?b.clientHeight:0,bodyTop:b?b.scrollTop:0,
    accessory:getComputedStyle(s).getPropertyValue('--accessory-h'),
    floatH:getComputedStyle(s).getPropertyValue('--float-h')};});
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
  const b0=await bar(); if(!b0){L(s,'no tabbar');continue;}
  L('==',s,'rest',JSON.stringify(b0),JSON.stringify(await sc()));
  // real user scroll
  await p.evaluate(()=>{const b=document.querySelector('#body')||document.querySelector('.screen');b.dispatchEvent(new WheelEvent('wheel',{deltaY:300,bubbles:true}));});
  await p.mouse.move(196,500); await p.mouse.wheel(0,600); await p.waitForTimeout(600);
  L('   scrolled',JSON.stringify(await bar()),JSON.stringify(await sc()));
  await p.mouse.wheel(0,-200); await p.waitForTimeout(600);
  L('   reversed',JSON.stringify(await bar()));
}
L('ERRS',p.__errs);
await b.close();
