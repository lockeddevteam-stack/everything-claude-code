import { chromium } from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const SCR=['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const DEVSEL='[data-testid="dev-toggle"], #dev-toggle, #devToggle';
const b=await chromium.launch();
for(const w of [320,402]){
const ctx=await b.newContext({viewport:{width:w,height:844}});const p=await ctx.newPage();
for(const s of SCR){
  await p.goto(D+s+'.html');await p.waitForTimeout(300);
  if(!(await p.locator('.dev__item').first().isVisible().catch(()=>false))){const t=p.locator(DEVSEL);if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(120);}}
  const states=await p.$$eval('.dev__item',e=>e.map(x=>x.dataset.testid));
  for(const st of (states.length?states:[null])){
    if(st){if(!(await p.locator('.dev__item').first().isVisible().catch(()=>false))){const t=p.locator(DEVSEL);if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(100);}}
      await p.locator(`.dev__item[data-testid="${st}"]`).first().dispatchEvent('click').catch(()=>{});await p.waitForTimeout(300);
      if(await p.locator('.dev__item').first().isVisible().catch(()=>false)){const t=p.locator(DEVSEL);if(await t.count())await t.first().click().catch(()=>{});}}
    await p.waitForTimeout(120);
    const r=await p.evaluate(()=>{
      const se=document.scrollingElement;const out={doc:se.scrollWidth>se.clientWidth?se.scrollWidth+'>'+se.clientWidth:null,clip:[]};
      const scr=document.querySelector('.screen')||document.body;const box=scr.getBoundingClientRect();
      for(const e of scr.querySelectorAll('*')){
        if(e.closest('.dev'))continue;const cs=getComputedStyle(e);
        if(cs.display==='none'||cs.visibility==='hidden')continue;
        const r2=e.getBoundingClientRect();if(!r2.width)continue;
        if(r2.right>box.right+1.5||r2.left<box.left-1.5){
          let a=e.parentElement,ok=false;while(a&&a!==scr.parentElement){const c=getComputedStyle(a);if(c.overflowX==='auto'||c.overflowX==='scroll'){ok=true;break;}a=a.parentElement;}
          if(!ok)out.clip.push(e.tagName+'.'+(typeof e.className==='string'?e.className.slice(0,40):'')+'#'+(e.dataset.testid||'')+' L'+Math.round(r2.left-box.left)+' R'+Math.round(r2.right-box.right));}}
      return out;});
    if(r.doc||r.clip.length)console.log('!',w,s,st,'doc='+r.doc,[...new Set(r.clip)].slice(0,5).join(' ;; '));
  }
}
await ctx.close();}
await b.close();
