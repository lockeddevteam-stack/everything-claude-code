import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
const states=['welcome-error','signin-error','signin-network','guest-error','setup-error-4','overview-error','overview-empty','overview-loading','setup-loading-5','signup-duplicate'];
for(const theme of ['dark']){
for(const st of states){
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.addInitScript(t=>{try{localStorage.setItem('lk_theme',t)}catch(e){}},theme);
  await p.goto(pathToFileURL(path.join(BUILD,'onboarding.html')).href); await p.waitForTimeout(400);
  await p.evaluate(()=>{const t=document.querySelector('[data-testid="dev-toggle"]')||document.querySelector('.dev-toggle,#dev-toggle'); if(t)t.click();});
  await p.waitForTimeout(300);
  const hit = await p.evaluate(id=>{const b=document.querySelector(`[data-testid="dev-${id}"]`); if(!b)return false; b.click(); return true;},st);
  await p.waitForTimeout(700);
  await p.evaluate(()=>{const t=document.querySelector('[data-testid="dev-toggle"]')||document.querySelector('.dev-toggle,#dev-toggle'); if(t)t.style.display='none'; const pn=document.querySelector('.dev-panel,#dev-panel'); if(pn)pn.style.display='none';});
  await p.screenshot({path:`${S}/onb-${st}.png`});
  console.log(st, hit);
  await p.close();
}}
await br.close();
