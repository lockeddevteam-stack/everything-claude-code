import {browser,page,DEMO} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const boot=async(hash='')=>{await p.goto(DEMO+hash);await p.waitForFunction(()=>window.DEMO&&document.querySelector('[data-screen]'),{timeout:15000});await p.waitForTimeout(900);};
const vis=()=>p.evaluate(()=>[...document.querySelectorAll('[data-screen]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none';}).map(e=>e.dataset.screen));
const hash=()=>p.evaluate(()=>location.hash);
const backLbl=()=>p.evaluate(()=>{const e=document.getElementById('demo-back');return e&&!e.hidden&&e.getBoundingClientRect().width>0?e.textContent.trim():null;});
const setState=(sid,label)=>p.evaluate(([i,l])=>{const h=document.querySelector('[data-screen="'+i+'"]');const r=h.shadowRoot||h;
  const tg=r.querySelector('[data-testid="dev-toggle"],#devToggle,[data-testid="dev-open"]'); if(tg)tg.click();
  const btns=[...r.querySelectorAll('.dev__item,.dev-item')];
  const m=btns.find(b=>b.textContent.trim().indexOf(l)===0); if(!m)return btns.map(b=>b.textContent.trim());
  m.click(); const menu=r.querySelector('#dev-menu'); if(menu)menu.hidden=true;
  const dc=r.querySelector('[data-testid="dev-close"]'); if(dc)dc.click(); return 'ok';},[sid,label]);
const clickIn=(sid,sel)=>p.evaluate(([i,s])=>{const h=document.querySelector('[data-screen="'+i+'"]');if(!h)return 'NOHOST';
  const r=h.shadowRoot||h;const e=r.querySelector(s);if(!e)return 'NOSEL';e.click();return 'ok';},[sid,sel]);

L('=== the three crossings whose source needs a dev state');
for(const [from,state,sel,to] of [
  ['train','Populated','[data-action="edit-split"]','split-builder'],
  ['coach','Plan / populated','[data-act="open-split"]','split-builder'],
  ['coach','Plan / populated','[data-act="plan-start"]','train'],
  ['coach','Plan / unbound','[data-act="open-split"]','split-builder'],
  ['workout-log','Mid-session','[data-action="finish"]','review'],
  ['progress','Empty','[data-testid="empty-action"]','train']]){
  await boot('#/'+(from==='workout-log'?'train/workout-log':from==='progress'?'home/progress':from));
  const v0=await vis(); if(!v0.includes(from)){L('FAIL cannot reach',from,v0);continue;}
  const ss=await setState(from,state);
  await p.waitForTimeout(600);
  const r=await clickIn(from,sel);
  await p.waitForTimeout(900);
  const v=await vis();
  L((v.length===1&&v[0]===to)?'ok  ':'FAIL',from,'/',state,sel,'->',to,'| setState',JSON.stringify(ss).slice(0,90),'| click',r,'| visible',JSON.stringify(v),await hash(),'back:',await backLbl(),p.__errs.splice(0));
}

L('\n=== screen index: every entry and every state');
await boot();
await p.evaluate(()=>document.getElementById('demo-index-toggle').click());
await p.waitForTimeout(900);
const groups=await p.evaluate(()=>[...document.querySelectorAll('.demo-index__group')].map((g,i)=>({i,
  screen:g.querySelector('.demo-index__screen').textContent.trim(),
  states:[...g.querySelectorAll('.demo-index__state')].map(b=>b.textContent.trim())})));
L('groups',groups.length);
L(JSON.stringify(groups.map(g=>g.screen+' ['+g.states.length+']')));
for(const g of groups){
  await boot();
  await p.evaluate(()=>document.getElementById('demo-index-toggle').click());await p.waitForTimeout(600);
  await p.evaluate(i=>document.querySelectorAll('.demo-index__group')[i].querySelector('.demo-index__screen').click(),g.i);
  await p.waitForTimeout(800);
  const v=await vis();
  L(v.length===1?'ok  ':'FAIL','index screen',g.screen,'->',JSON.stringify(v),await hash(),'back:',await backLbl(),p.__errs.splice(0));
}
L('\n--- index states (one per group, and the last one)');
for(const g of groups){
  for(const si of [0,g.states.length-1]){
    if(si<0)continue;
    await boot();
    await p.evaluate(()=>document.getElementById('demo-index-toggle').click());await p.waitForTimeout(500);
    await p.evaluate(([i,j])=>document.querySelectorAll('.demo-index__group')[i].querySelectorAll('.demo-index__state')[j].click(),[g.i,si]);
    await p.waitForTimeout(800);
    const v=await vis();
    const errs=p.__errs.splice(0);
    if(v.length!==1||errs.length)L('FAIL',g.screen,'state',g.states[si],JSON.stringify(v),await hash(),errs);
  }
}
L('\n=== hash routes typed directly');
for(const h of ['#/home','#/train','#/fuel','#/coach','#/profile','#/home/progress','#/train/exercise-library','#/train/split-builder','#/train/workout-log','#/train/workout-log/review','#/fuel/shopping','#/profile/settings','#/home/settings','#/progress','#/nonsense','#/train/nonsense','']){
  await p.goto(DEMO+h); await p.waitForTimeout(900);
  L(h||'(none)','->',JSON.stringify(await vis()),await hash(),'back:',await backLbl(),p.__errs.splice(0));
}
L('\n=== browser back after a push, and Escape on the index');
await boot('#/fuel');
await clickIn('fuel','[data-testid="chip-more"]');await p.waitForTimeout(800);
L('pushed',await vis(),await hash());
await p.goBack();await p.waitForTimeout(800);
L('browser back ->',await vis(),await hash());
await p.goForward();await p.waitForTimeout(800);
L('forward ->',await vis(),await hash(),'back btn:',await backLbl());
await p.evaluate(()=>document.getElementById('demo-back').click());await p.waitForTimeout(700);
L('demo back ->',await vis(),await hash());
L('ERRS',p.__errs);
await b.close();
