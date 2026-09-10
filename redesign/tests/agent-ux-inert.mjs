import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const br=await chromium.launch();
const files=['home','train','fuel','shopping','progress','profile','review','settings','coach','exercise-library','split-builder','workout-log'];
for(const f of files){
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.goto(pathToFileURL(path.join(BUILD,f+'.html')).href); await p.waitForTimeout(600);
  const ids=await p.evaluate(()=>[...document.querySelectorAll('button[data-testid]')].map(b=>b.dataset.testid).filter(t=>!/^dev|^tab-/.test(t)));
  const inert=[];
  for(const id of ids){
    const sig=()=>p.evaluate(()=>{const s=document.querySelector('[data-testid^="screen-"]')||document.body; return s.innerHTML.length+'|'+s.textContent.replace(/\s+/g,'').length;});
    const before=await sig();
    try{ await p.click(`[data-testid="${id}"]`,{timeout:900,force:true}); }catch(e){ continue; }
    await p.waitForTimeout(400);
    const after=await sig();
    if(before===after) inert.push(id);
    await p.goto(pathToFileURL(path.join(BUILD,f+'.html')).href); await p.waitForTimeout(400);
  }
  console.log(f, 'INERT:', inert.join(', ')||'—');
  await p.close();
}
await br.close();
