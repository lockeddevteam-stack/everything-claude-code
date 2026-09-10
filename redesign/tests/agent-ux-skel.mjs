import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path'; import fs from 'fs';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const br=await chromium.launch();
const pairs={'settings':['loading','signed-in'],'train':['loading','populated'],'fuel':['loading','populated'],'progress':['loading','populated'],'shopping':['loading','populated'],'profile':['loading','populated'],'home':['loading','training'],'review':['loading','populated'],'workout-log':['loading','mid-session']};
for(const [f,[a,b]] of Object.entries(pairs)){
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.goto(pathToFileURL(path.join(BUILD,f+'.html')).href); await p.waitForTimeout(500);
  const grab = async (state)=>{
    await p.evaluate(s=>{const btn=document.querySelector(`.dev__item[data-state="${s}"]`); if(btn)btn.click();},state);
    await p.waitForTimeout(700);
    return p.evaluate(()=>{
      const sc=[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+10&&x.clientHeight>300)[0]||document.body;
      const out=[];
      for(const el of sc.querySelectorAll('h2,h3,.t-label,.card,.section')){
        const t=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,26);
        const r=el.getBoundingClientRect();
        if(r.height>4) out.push([t, Math.round(r.top), Math.round(r.height)]);
      }
      return {h:sc.scrollHeight, out:out.slice(0,10)};
    });
  };
  const A=await grab(a), B=await grab(b);
  console.log(`\n== ${f}: ${a} scrollH=${A.h} | ${b} scrollH=${B.h}`);
  const n=Math.max(A.out.length,B.out.length);
  for(let i=0;i<Math.min(n,8);i++) console.log('   ', JSON.stringify(A.out[i]||null), '||', JSON.stringify(B.out[i]||null));
  await p.close();
}
await br.close();
