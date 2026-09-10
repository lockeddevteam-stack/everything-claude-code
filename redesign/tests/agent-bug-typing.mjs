import { chromium } from 'playwright';
const DIR='file:///home/user/everything-claude-code/redesign/08-build/';
const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:402,height:874}});
async function openDev(p){const t=p.locator('[data-testid="dev-toggle"], #dev-toggle, #devToggle');const vis=await p.locator('.dev__item').first().isVisible().catch(()=>false);if(await t.count()&&!vis){await t.first().click();await p.waitForTimeout(180);}}
async function setState(p,st){if(!st)return;await openDev(p);const s=`.dev__item[data-testid="${st}"]`;if(await p.locator(s).count()){await p.locator(s).first().dispatchEvent('click');await p.waitForTimeout(350);}const t=p.locator('[data-testid="dev-toggle"], #dev-toggle, #devToggle');if(await t.count()&&await p.locator('.dev__item').first().isVisible().catch(()=>false)){await t.first().click().catch(()=>{});await p.waitForTimeout(120);}}
const screens=['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
for(const s of screens){
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(DIR+s+'.html');await p.waitForTimeout(300);
  await openDev(p);
  const states=await p.$$eval('.dev__item',e=>e.map(x=>x.dataset.testid));
  await p.close();
  for(const st of (states.length?states:[null])){
    const p2=await ctx.newPage();const e2=[];p2.on('pageerror',e=>e2.push(e.message));
    await p2.goto(DIR+s+'.html');await p2.waitForTimeout(250);await setState(p2,st);
    const fields=await p2.$$eval('input:not([type=checkbox]):not([type=radio]),textarea',els=>els.filter(e=>e.offsetParent!==null&&e.dataset.testid).map(e=>e.dataset.testid));
    for(const f of [...new Set(fields)]){
      const loc=p2.locator(`[data-testid="${f}"]`).first();
      if(!await loc.count()||!await loc.isVisible().catch(()=>false))continue;
      const type=await loc.evaluate(e=>e.type);
      const val = type==='number'? '7':'zqx';
      try{ await loc.fill(''); await loc.type(val,{delay:40}); }catch(err){ console.log(s,st,f,'TYPE-FAIL',String(err).slice(0,80)); continue; }
      await p2.waitForTimeout(500);
      const r=await p2.locator(`[data-testid="${f}"]`).first().evaluate(e=>({v:e.value,focused:document.activeElement===e,caret:e.selectionStart,active:document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||'')})).catch(()=>null);
      if(!r){console.log('!!',s,st,f,'FIELD GONE after typing');continue;}
      if(r.v!==val)console.log('!!',s,st,f,'VALUE LOST: typed "'+val+'" got "'+r.v+'"');
      if(!r.focused)console.log('!!',s,st,f,'FOCUS LOST after typing -> '+r.active);
      else if(r.caret!==null&&r.caret!==val.length)console.log('!!',s,st,f,'CARET moved to '+r.caret+' (expected '+val.length+')');
    }
    if(e2.length)console.log('!!',s,st,'PAGEERROR',e2.join('|').slice(0,200));
    await p2.close();
  }
  console.log('--',s,'typing done');
}
await b.close();
