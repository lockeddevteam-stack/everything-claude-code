import { chromium } from 'playwright';
import fs from 'fs';
const axe = fs.readFileSync('/home/user/everything-claude-code/redesign/tests/node_modules/axe-core/axe.min.js','utf8');
const DIR='file:///home/user/everything-claude-code/redesign/08-build/';
const ALL=['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const DEVSEL='[data-testid="dev-toggle"], #dev-toggle, #devToggle';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:402,height:874}});const p=await ctx.newPage();
const seen=new Set();
for(const s of ALL){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(250);
  if(!(await p.locator('.dev__item').first().isVisible().catch(()=>false))){const t=p.locator(DEVSEL);if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(120);}}
  const states=await p.$$eval('.dev__item',e=>e.map(x=>x.dataset.testid));
  for(const st of (states.length?states:[null])){
    if(st){if(!(await p.locator('.dev__item').first().isVisible().catch(()=>false))){const t=p.locator(DEVSEL);if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(100);}}
      await p.locator(`.dev__item[data-testid="${st}"]`).first().dispatchEvent('click').catch(()=>{});await p.waitForTimeout(300);
      if(await p.locator('.dev__item').first().isVisible().catch(()=>false)){const t=p.locator(DEVSEL);if(await t.count())await t.first().click().catch(()=>{});}}
    await p.addScriptTag({content:axe}).catch(()=>{});
    const r=await p.evaluate(async()=>{const res=await axe.run(document.body,{resultTypes:['violations'],rules:{'color-contrast':{enabled:true}}});
      return res.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,2).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').split('\n')[1])}));});
    for(const v of r){const k=s+'|'+v.id+'|'+v.ex[0];if(seen.has(k))continue;seen.add(k);
      console.log('AXE',v.impact,s,st,v.id,'x'+v.n,'::',v.ex.join(' ||| ').slice(0,300));}
  }
}
await b.close();
