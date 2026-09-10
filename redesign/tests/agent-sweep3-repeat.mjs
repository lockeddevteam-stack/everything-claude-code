/* Second and third interactions, dark theme, and listener stacking. */
import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const L=console.log;
const dark=process.argv[2]==='dark';
const c=await b.newContext({viewport:{width:393,height:852},colorScheme:dark?'dark':'light'});
const p=await c.newPage();p.__errs=[];
p.on('pageerror',e=>p.__errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error')p.__errs.push('CONSOLE '+m.text().slice(0,180));});
L('=== theme:',dark?'dark':'light');
L('--- open/close the same sheet five times, watch for listener stacking and state leak');
for(const [f,opener,closer] of [['fuel.html','meal-0','meal-close'],['fuel.html','log-cam','close'],
  ['progress.html','choose-lift','sheet-close'],['progress.html','row-body-weight','weight-close'],
  ['workout-log.html','cell-0-0-weight',null],['settings.html','row-weight-unit',null]]){
  await p.goto(DIR+f);await p.waitForTimeout(600);
  const seq=[];
  for(let i=0;i<5;i++){
    await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),opener);
    await p.waitForTimeout(320);
    const open=await p.evaluate(()=>{const s=document.querySelector('.sheet,.dialog');
      return s?s.dataset.testid+'@'+Math.round(s.getBoundingClientRect().top)+' scrims='+document.querySelectorAll('.scrim').length+' sheets='+document.querySelectorAll('.sheet').length:'NONE';});
    if(closer)await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),closer);
    else await p.keyboard.press('Escape');
    await p.waitForTimeout(320);
    const closed=await p.evaluate(()=>document.querySelectorAll('.sheet,.dialog,.scrim').length);
    seq.push(open+'/left:'+closed);
  }
  L(' ',f,opener,JSON.stringify(seq),p.__errs.splice(0));
}
L('\n--- water +/- 30 times, supp toggles 10 times');
await p.goto(DIR+'fuel.html');await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelector('[data-testid="chip-water"]').click());await p.waitForTimeout(400);
for(let i=0;i<30;i++)await p.evaluate(()=>document.querySelector('[data-action="water-add"]')?.click());
await p.waitForTimeout(400);
L('  water',await p.evaluate(()=>document.querySelector('[data-testid="water-value"]')?.textContent),
  'sheets',await p.evaluate(()=>document.querySelectorAll('.sheet').length),p.__errs.splice(0));

L('\n--- every screen, every state, dark/light: page and console errors + bad text');
let bad=0;
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
  const st=await states(p);const list=st.length?st.map(x=>x.id):[null];
  for(const sid of list){
    p.__errs.length=0;
    if(sid)await setState(p,sid);
    await p.waitForTimeout(280);
    const t=await p.evaluate(()=>{const out=[];
      const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
      while((n=w.nextNode())){const v=n.nodeValue;if(!v.trim())continue;
        const e=n.parentElement;if(!e||e.closest('.dev,.dev-panel,script,style'))continue;
        const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;
        if(/\bNaN\b|\bundefined\b|\[object Object\]|\bnull\b|\bInfinity\b|\$NaN|--\s*kg/.test(v))out.push(v.trim().slice(0,80));}
      return out;});
    if(t.length||p.__errs.length){bad++;L('  BAD',s,sid,JSON.stringify(t),p.__errs.slice(0));}
  }
}
L('  screens with errors or bad text:',bad);
L('\n--- glass chrome opacity in this theme');
await p.goto(DIR+'train.html');await p.waitForTimeout(600);
L('  tabbar bg',await p.evaluate(()=>{const t=document.querySelector('.tabbar');const cs=getComputedStyle(t);
  return cs.backgroundColor+' | '+cs.backdropFilter;}));
L('ERRS',p.__errs);
await b.close();
