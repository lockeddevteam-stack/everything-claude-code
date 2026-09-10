import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const DEMO='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto(D+'fuel.html');await p.waitForTimeout(800);
await p.evaluate(()=>{document.getElementById('dev-toggle').click();
  [...document.querySelectorAll('.dev__item')].find(b=>b.dataset.state==='live').click();});
await p.waitForTimeout(900);
console.log('fuel live:',await p.evaluate(()=>{
  const scr=document.querySelector('.screen');
  return {acc:scr.style.getPropertyValue('--accessory-h'), slotH:document.getElementById('shelf-slot').offsetHeight,
          hasShelf:!!document.querySelector('.shelf'), floatH:getComputedStyle(scr).getPropertyValue('--float-h'),
          bodyPad:getComputedStyle(document.getElementById('body')).paddingBottom};
}));
// demo: exercise-library accessory measured inside a shadow root
await p.goto(DEMO+'#/train/exercise-library');await p.waitForTimeout(1200);
console.log('demo exlib:',await p.evaluate(()=>{
  const r=document.getElementById('demo-screen-exercise-library').shadowRoot;
  const scr=r.querySelector('.screen');
  return {acc:scr.style.getPropertyValue('--accessory-h'), floatH:getComputedStyle(scr).getPropertyValue('--float-h')};
}));
// tabbar container query at a large type setting
await p.goto(D+'home.html');await p.waitForTimeout(600);
for(const fs of ['15px','30px','53px']){
  const r=await p.evaluate(f=>{
    document.documentElement.style.fontSize='16px';
    document.body.style.fontSize=f;
    const bar=document.querySelector('.tabbar');
    const lab=bar.querySelector('.tabbar__label');
    return {barW:bar.getBoundingClientRect().width, barFs:getComputedStyle(bar).fontSize,
            labW:lab.getBoundingClientRect().width, labPos:getComputedStyle(lab).position};
  },fs);
  console.log('body font-size',fs,JSON.stringify(r));
}
await b.close();
