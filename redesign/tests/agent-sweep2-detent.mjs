import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const L=console.log;const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
const geom=()=>p.evaluate(()=>{const s=document.querySelector('.sheet');if(!s)return null;const r=s.getBoundingClientRect();const cs=getComputedStyle(s);
 const foot=s.querySelector('.sheet__foot .btn');const fr=foot&&foot.getBoundingClientRect();
 return {style:s.style.height,l:Math.round(r.left),r:Math.round(r.right),t:Math.round(r.top),bo:Math.round(r.bottom),
  radius:cs.borderTopLeftRadius+'/'+cs.borderBottomLeftRadius,
  foot:fr?{t:Math.round(fr.top),b:Math.round(fr.bottom),inView:fr.bottom<=innerHeight}:null,
  grabber:s.querySelector('.sheet__grab')?.getAttribute('data-grabber')};});
for(const [screen,opener] of [['progress','choose-lift'],['progress','row-body-weight'],['fuel','tile-water']]){
  await p.goto(D+screen+'.html');await p.waitForTimeout(600);
  const found=await p.evaluate(t=>!!document.querySelector(`[data-testid="${t}"]`),opener);
  if(!found){L(screen,opener,'MISSING');continue;}
  await p.locator(`[data-testid="${opener}"]`).click({force:true}).catch(()=>{});
  await p.waitForTimeout(700);
  L(screen,opener,'open:',JSON.stringify(await geom()));
  // drag the grabber down to the small detent
  const dragged=await p.evaluate(()=>{const s=document.querySelector('.sheet');const g=s&&s.querySelector('.sheet__grab');
    if(!g||g.getAttribute('data-grabber')!=='true')return 'no grabber';
    const r=g.getBoundingClientRect();const y=r.top+r.height/2;
    g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientY:y,pointerId:1,timeStamp:0}));
    g.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientY:y+260,pointerId:1}));
    g.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientY:y+260,pointerId:1}));
    return 'dragged';});
  await p.waitForTimeout(900);
  L('   after drag down:',dragged,JSON.stringify(await geom()));
}
L('ERR',JSON.stringify(errs));
await b.close();
