import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const files=process.argv.slice(2);
const br=await chromium.launch();
for(const f of files){
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.goto(pathToFileURL(path.join(BUILD,f+'.html')).href); await p.waitForTimeout(500);
  const ids=await p.evaluate(()=>[...document.querySelectorAll('button[data-testid]')].map(b=>b.dataset.testid).filter(t=>!/^dev|^tab-/.test(t)));
  const inert=[];
  const sig=()=>p.evaluate(()=>{const s=document.querySelector('[data-testid^="screen-"]')||document.body; return s.innerHTML.length+'|'+s.textContent.replace(/\s+/g,'').length;});
  for(const id of ids){
    const before=await sig();
    try{ await p.click(`[data-testid="${id}"]`,{timeout:700,force:true}); }catch(e){ continue; }
    await p.waitForTimeout(350);
    const after=await sig();
    if(before===after) inert.push(id);
    await p.goto(pathToFileURL(path.join(BUILD,f+'.html')).href); await p.waitForTimeout(300);
  }
  console.log(f,'INERT:',inert.join(', ')||'—');
  await p.close();
}
await br.close();
