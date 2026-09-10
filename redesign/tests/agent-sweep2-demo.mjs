import {chromium} from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text().slice(0,200));});
const L=console.log;
await p.goto(U);await p.waitForTimeout(1200);
L('hash',await p.evaluate(()=>location.hash));
const tabs=await p.evaluate(()=>[...document.querySelectorAll('.demo-stage *')].length);
// find visible screen host
const info=()=>p.evaluate(()=>{
  const hosts=[...document.querySelectorAll('[data-screen]')];
  const vis=hosts.filter(h=>h.offsetParent!==null||getComputedStyle(h).display!=='none');
  const cur=vis[vis.length-1];
  const sr=cur&&cur.shadowRoot;
  const tb=sr&&sr.querySelector('.tabbar');
  const tbr=tb&&tb.getBoundingClientRect();
  const hostR=cur&&cur.getBoundingClientRect();
  return {hash:location.hash, hosts:hosts.map(h=>h.dataset.screen), visible:vis.map(h=>h.dataset.screen),
    cur:cur&&cur.dataset.screen,
    backVisible:!document.getElementById('demo-back').hidden,
    backLabel:document.querySelector('.demo-back__label')?.textContent,
    tabbar:tbr?{t:Math.round(tbr.top),b:Math.round(tbr.bottom),l:Math.round(tbr.left),r:Math.round(tbr.right)}:null,
    host:hostR?{t:Math.round(hostR.top),b:Math.round(hostR.bottom),h:Math.round(hostR.height)}:null,
    tabCount:sr?sr.querySelectorAll('.tabbar__item').length:0};
});
L('initial',JSON.stringify(await info()));
const TABS=['home','train','coach','fuel','progress','profile'];
for(const t of TABS){
  const ok=await p.evaluate(id=>{
    const hosts=[...document.querySelectorAll('[data-screen]')];
    for(const h of hosts){const sr=h.shadowRoot;if(!sr)continue;const btn=sr.querySelector(`.tabbar [data-testid="tab-${id}"]`);
      if(btn&&h.offsetParent!==null){btn.click();return h.dataset.screen;}}
    return null;},t);
  await p.waitForTimeout(700);
  const i=await info();
  L('tab',t,'clickedFrom',ok,'->',JSON.stringify({hash:i.hash,cur:i.cur,visible:i.visible,tabbar:i.tabbar,host:i.host,back:i.backVisible}));
}
L('\n--- push navigations');
const PUSH=[['train','[data-action="open-library"]','exercise-library'],
            ['train','[data-action="new-split"]','split-builder'],
            ['train','[data-action="start-today"]','workout-log'],
            ['fuel','[data-testid="chip-more"]','shopping'],
            ['profile','[data-testid="open-settings"]','settings']];
for(const [from,sel,to] of PUSH){
  await p.goto(U+'#/'+from);await p.waitForTimeout(900);
  const clicked=await p.evaluate(([f,s])=>{const h=document.querySelector(`[data-screen="${f}"]`);const sr=h&&h.shadowRoot;
    const el=sr&&sr.querySelector(s);if(!el)return 'no-el';el.scrollIntoView({block:'center'});el.click();return 'ok';},[from,sel]);
  await p.waitForTimeout(900);
  let i=await info();
  L(from,'->',to,'click:',clicked,'hash:',i.hash,'cur:',i.cur,'back:',i.backVisible,i.backLabel,'tabbar:',JSON.stringify(i.tabbar));
  if(i.backVisible){await p.locator('[data-testid="demo-back"]').click();await p.waitForTimeout(800);
    i=await info();L('   after demo-back: hash',i.hash,'cur',i.cur,'back',i.backVisible);}
}
L('\n--- body map (profile)');
await p.goto(U+'#/profile');await p.waitForTimeout(1200);
const bm=await p.evaluate(()=>{const h=document.querySelector('[data-screen="profile"]');const sr=h.shadowRoot;
  const svgs=[...sr.querySelectorAll('svg')].filter(s=>s.querySelectorAll('path').length>5);
  const map=sr.querySelector('[data-testid*="body"],[data-bodymap],.bodymap');
  return {svgCount:svgs.length,paths:svgs.map(s=>s.querySelectorAll('path').length),
    mapEl:map?(map.dataset.testid||map.className):null,
    fills:svgs[0]?[...new Set([...svgs[0].querySelectorAll('path')].map(x=>getComputedStyle(x).fill))].slice(0,6):[]};});
L(JSON.stringify(bm));
const bmTest=await p.evaluate(()=>{const h=document.querySelector('[data-screen="profile"]');const sr=h.shadowRoot;
  return [...sr.querySelectorAll('[data-testid]')].map(e=>e.dataset.testid).filter(t=>/body|muscle|map|front|back/i.test(t));});
L('bodymap testids:',bmTest.join(','));

L('\n--- chrome per screen (scroll -> tabbar minimize)');
for(const t of ['home','train','fuel','progress','coach','profile']){
  await p.goto(U+'#/'+t);await p.waitForTimeout(900);
  const r=await p.evaluate(id=>{const h=document.querySelector(`[data-screen="${id}"]`);const sr=h.shadowRoot;
    const sc=sr.querySelector('.body,[data-scroller],main');const tb=sr.querySelector('.tabbar');
    if(!sc||!tb)return {no:!sc?'no-scroller':'no-tabbar'};
    sc.dispatchEvent(new WheelEvent('wheel',{deltaY:400,bubbles:true}));
    sc.scrollTop=400;sc.dispatchEvent(new Event('scroll'));
    return {ok:1};},t);
  await p.waitForTimeout(600);
  const r2=await p.evaluate(id=>{const h=document.querySelector(`[data-screen="${id}"]`);const sr=h.shadowRoot;
    const tb=sr.querySelector('.tabbar');const tr=tb&&tb.getBoundingClientRect();
    return {min:tb&&tb.getAttribute('data-minimized'),r:tr?{t:Math.round(tr.top),b:Math.round(tr.bottom)}:null,
      hostH:Math.round(h.getBoundingClientRect().height)};},t);
  L(t,JSON.stringify(r),JSON.stringify(r2));
}
L('\nERRORS',JSON.stringify(errs.slice(0,20)));
await b.close();
