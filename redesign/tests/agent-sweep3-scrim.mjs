import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const box=()=>p.evaluate(()=>{
  const s=document.querySelector('.screen');
  const sc=document.querySelector('.scrim'), sh=document.querySelector('.sheet,.dialog');
  const r=x=>{if(!x)return null;const q=x.getBoundingClientRect();return [Math.round(q.top),Math.round(q.bottom),Math.round(q.left),Math.round(q.right)];};
  const hitBot=document.elementFromPoint(196,846);
  const hitTop=document.elementFromPoint(196,6);
  return {screenScrollTop:s.scrollTop,screenSH:s.scrollHeight,screenCH:s.clientHeight,
    scrim:r(sc),sheet:r(sh),
    hitBottom:(hitBot&&(hitBot.dataset?.testid||hitBot.className))||null,
    hitTop:(hitTop&&(hitTop.dataset?.testid||hitTop.className))||null};});
L('=== screen-level overflow on every screen x state (a scrollable .screen is what broke the scrim in round 2)');
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(400);
  const st=await states(p); const list=st.length?st.map(x=>x.id):[null];
  for(const sid of list){
    if(sid)await setState(p,sid);
    const v=await p.evaluate(()=>{const e=document.querySelector('.screen');
      return {sh:e.scrollHeight,ch:e.clientHeight,sw:e.scrollWidth,cw:e.clientWidth,
        over:[...e.querySelectorAll('*')].filter(x=>{const q=x.getBoundingClientRect();const p=e.getBoundingClientRect();
          return q.height>0&&q.bottom>p.bottom+1;}).map(x=>(x.dataset?.testid||x.className.toString().slice(0,30))+' b='+Math.round(x.getBoundingClientRect().bottom)).slice(0,4)};});
    if(v.sh>v.ch+1||v.sw>v.cw+1)L(' OVERFLOW',s,sid,JSON.stringify(v));
  }
}
L('\n=== shopping: open each overlay and measure the scrim');
await p.goto(DIR+'shopping.html');await p.waitForTimeout(500);
for(const t of ['add-purchase','scan-cam','clear-all','clear-done','open-i1','edit-target','add-store']){
  await p.goto(DIR+'shopping.html');await p.waitForTimeout(450);
  await p.evaluate(x=>{const seg=document.querySelector('[data-testid="seg-budget"]');if(/purchase|target|store|scan/.test(x)&&seg)seg.click();},t);
  await p.waitForTimeout(300);
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),t);
  await p.waitForTimeout(500);
  L(t,JSON.stringify(await box()));
}
L('ERRS',p.__errs);
await b.close();
