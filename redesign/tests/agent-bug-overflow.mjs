import { chromium } from 'playwright';
const DIR='file:///home/user/everything-claude-code/redesign/08-build/';
const ALL=['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const DEVSEL='[data-testid="dev-toggle"], #dev-toggle, #devToggle';
const b=await chromium.launch();
for (const w of [320, 402]) {
 const ctx=await b.newContext({viewport:{width:w,height:844}});
 const p=await ctx.newPage();
 for(const s of ALL){
  await p.goto(DIR+s+'.html'); await p.waitForTimeout(250);
  let vis=await p.locator('.dev__item').first().isVisible().catch(()=>false);
  if(!vis){const t=p.locator(DEVSEL); if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(120);} }
  const states=await p.$$eval('.dev__item',e=>e.map(x=>x.dataset.testid));
  for(const st of (states.length?states:[null])){
    if(st){ if(!(await p.locator('.dev__item').first().isVisible().catch(()=>false))){const t=p.locator(DEVSEL);if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(100);}}
      await p.locator(`.dev__item[data-testid="${st}"]`).first().dispatchEvent('click').catch(()=>{}); await p.waitForTimeout(300);
      if(await p.locator('.dev__item').first().isVisible().catch(()=>false)){const t=p.locator(DEVSEL);if(await t.count())await t.first().click().catch(()=>{});}
    }
    await p.waitForTimeout(150);
    const r=await p.evaluate(()=>{
      const res={doc:null,inner:[],clipped:[]};
      const se=document.scrollingElement;
      if(se.scrollWidth>se.clientWidth) res.doc=se.scrollWidth+'>'+se.clientWidth;
      const scr=document.querySelector('.screen')||document.body;
      const box=scr.getBoundingClientRect();
      // any element extending past the screen box horizontally
      for(const e of scr.querySelectorAll('*')){
        if(e.closest('.dev, .dev__menu'))continue;
        const cs=getComputedStyle(e);
        if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed')continue;
        const r2=e.getBoundingClientRect();
        if(r2.width===0)continue;
        if(r2.right>box.right+1.5||r2.left<box.left-1.5){
          // ignore if an ancestor is a horizontal scroller (intentional carousel)
          let a=e.parentElement,ok=false;
          while(a&&a!==scr){const c=getComputedStyle(a);if(c.overflowX==='auto'||c.overflowX==='scroll'){ok=true;break;}a=a.parentElement;}
          if(!ok)res.clipped.push(e.tagName+'.'+(typeof e.className==='string'?e.className:'')+'#'+(e.dataset.testid||'')+' L'+Math.round(r2.left-box.left)+' R'+Math.round(r2.right-box.right));
        }
      }
      for(const e of scr.querySelectorAll('*')){
        if(e.scrollWidth>e.clientWidth+1){const c=getComputedStyle(e);if(c.overflowX==='hidden'||c.overflowX==='visible')res.inner.push(e.tagName+'.'+(typeof e.className==='string'?e.className:'')+' '+e.scrollWidth+'>'+e.clientWidth);}
      }
      return res;
    });
    if(r.doc||r.clipped.length) console.log('!',w,s,st,'doc='+r.doc,'clipped:',[...new Set(r.clipped)].slice(0,6).join(' ;; '));
  }
 }
 await ctx.close();
}
await b.close();
