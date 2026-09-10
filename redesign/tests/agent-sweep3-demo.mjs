import {browser,page,DEMO} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const NAV=[
 ['home','[data-testid="primary-action"]','train','tab'],
 ['home','[data-testid="action-choose-session"]','train','tab'],
 ['home','[data-testid="row-last-session"]','train','tab'],
 ['home','[data-testid="row-climbing-lift"]','progress','push'],
 ['train','[data-action="open-library"]','exercise-library','push'],
 ['train','[data-action="new-split"]','split-builder','push'],
 ['train','[data-action="edit-split"]','split-builder','push'],
 ['coach','[data-act="open-split"]','split-builder','push'],
 ['coach','[data-act="plan-start"]','train','tab'],
 ['home','[data-testid="open-account"]','settings','push'],
 ['train','[data-action="start-today"]','workout-log','push'],
 ['workout-log','[data-action="finish"]','review','push'],
 ['fuel','[data-testid="chip-more"]','shopping','push'],
 ['progress','[data-testid="empty-action"]','train','tab'],
 ['profile','[data-testid="open-settings"]','settings','push']];
const boot=async(hash='')=>{await p.goto(DEMO+hash);await p.waitForFunction(()=>window.DEMO&&document.querySelector('[data-screen]'),{timeout:15000});await p.waitForTimeout(900);};
const vis=()=>p.evaluate(()=>[...document.querySelectorAll('[data-screen]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none';}).map(e=>e.dataset.screen));
const inS=(id,sel,fn)=>p.evaluate(([i,s,f])=>{const h=document.querySelector('[data-screen="'+i+'"]');
  if(!h)return 'NOHOST';const r=h.shadowRoot||h;const e=r.querySelector(s);if(!e)return 'NOSEL';
  if(f==='click'){e.click();return 'ok';} if(f==='rect'){const q=e.getBoundingClientRect();return [q.top,q.bottom,q.left,q.right].map(Math.round);} return 'ok';},[id,sel,fn]);
const chrome=()=>p.evaluate(()=>{
  const backs=[...document.querySelectorAll('[data-testid="demo-back"]')].filter(e=>e.offsetParent||e.getBoundingClientRect().width>0);
  return {hash:location.hash,back:backs.map(e=>e.textContent.trim())};});

L('=== boot');
await boot(); L('visible',await vis(),JSON.stringify(await chrome()),'errs',p.__errs.splice(0));

L('\n=== every tab');
for(const t of ['home','train','fuel','coach','profile']){
  await boot();
  const r=await p.evaluate(x=>{const h=document.querySelector('[data-screen]:not([style*="display: none"])');
    const root=document.querySelector('[data-screen="home"]').shadowRoot;
    const e=root.querySelector('[data-testid="tab-'+x+'"]'); if(!e)return 'NOTAB'; e.click(); return 'ok';},t);
  await p.waitForTimeout(700);
  L('tab',t,r,'->',await vis(),JSON.stringify(await chrome()),p.__errs.splice(0));
}

L('\n=== declared crossings');
for(const [from,sel,to,mode] of NAV){
  await boot('#/'+from);
  await p.waitForTimeout(400);
  const v0=await vis();
  if(!v0.includes(from)){L('CROSS',from,sel,'-> could not reach source; visible',v0);continue;}
  const r=await inS(from,sel,'click');
  await p.waitForTimeout(800);
  const v=await vis(); const c=await chrome();
  const ok=v.length===1&&v[0]===to;
  L(ok?'ok  ':'FAIL', from,sel,'->',to,'|',r,'| visible',JSON.stringify(v),JSON.stringify(c),p.__errs.splice(0));
  if(mode==='push'&&ok){
    await p.evaluate(()=>document.querySelector('[data-testid="demo-back"]')?.click());
    await p.waitForTimeout(700);
    L('     back ->',await vis(),JSON.stringify(await chrome()));
  }
}

L('\n=== screen index');
await boot();
const idx=await p.evaluate(()=>{const t=document.querySelector('[data-testid="demo-index-toggle"],[data-testid="demo-screens"],#demo-index-toggle');
  if(t)t.click();
  return [...document.querySelectorAll('[data-demo-screen],[data-testid^="demo-screen-"]')].map(e=>e.dataset.demoScreen||e.dataset.testid);});
L('index entries',idx.length,JSON.stringify(idx));
for(const id of idx){
  await boot();
  await p.evaluate(x=>{const t=document.querySelector('[data-testid="demo-index-toggle"],#demo-index-toggle');if(t)t.click();
    const e=document.querySelector('[data-demo-screen="'+x+'"],[data-testid="'+x+'"]');if(e)e.click();},id);
  await p.waitForTimeout(800);
  const v=await vis();
  L(v.length===1?'ok  ':'FAIL',id,'->',JSON.stringify(v),location=await p.evaluate(()=>location.hash),p.__errs.splice(0));
}
L('\nERRS',p.__errs);
await b.close();
