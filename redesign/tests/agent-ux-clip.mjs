import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path'; import fs from 'fs';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const recon=JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/recon.json','utf8'));
const br=await chromium.launch();
for(const [s,info] of Object.entries(recon)){
  const states=info.states.length?info.states:['default'];
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.goto(pathToFileURL(path.join(BUILD,s+'.html')).href); await p.waitForTimeout(500);
  for(const st of states){
    if(st!=='default'){ await p.evaluate(x=>{const b=document.querySelector(`.dev__item[data-state="${x}"]`); if(b)b.click();},st); await p.waitForTimeout(500);}
    const bad=await p.evaluate(()=>{
      const out=[];
      for(const el of document.querySelectorAll('*')){
        if(el.closest('.dev,[data-testid="dev-menu"]'))continue;
        const cs=getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden'||!el.getClientRects().length) continue;
        const t=(el.textContent||'').trim();
        if(!t||el.children.length) continue;
        // horizontal clip
        if(el.scrollWidth>el.clientWidth+1 && cs.overflowX!=='visible' && el.clientWidth>0)
          out.push(['CLIP-X', t.slice(0,40), el.dataset.testid||el.className, el.scrollWidth+'>'+el.clientWidth]);
        if(el.scrollHeight>el.clientHeight+2 && cs.overflowY!=='visible' && el.clientHeight>0)
          out.push(['CLIP-Y', t.slice(0,40), el.dataset.testid||el.className, el.scrollHeight+'>'+el.clientHeight]);
      }
      return out;
    });
    if(bad.length) console.log(`\n${s}/${st}`, JSON.stringify(bad,null,0).slice(0,1400));
  }
  await p.close();
}
await br.close();
