import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
for(const f of fs.readdirSync(DIR).filter(x=>x.endsWith('.html')).sort()){
  await p.goto('file://'+DIR+'/'+f); await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&s.visibility!=='hidden'&&s.display!=='none'};
    const odd=[];const sizes={};
    for(const e of document.querySelectorAll('svg')){if(!vis(e))continue;const r=e.getBoundingClientRect();const s=getComputedStyle(e);
      const k=Math.round(r.width)+'x'+Math.round(r.height); sizes[k]=(sizes[k]||0)+1;
      if(k!=='20x20'&&r.width<40) odd.push(k+' sw'+s.strokeWidth+' vb'+e.getAttribute('viewBox')+' in .'+(e.parentElement?.className||'').toString().slice(0,22));}
    const seg=document.querySelector('.seg'); const it=document.querySelector('.seg__item');
    return {sizes,odd, seg:seg?getComputedStyle(seg).borderTopLeftRadius+' pad '+getComputedStyle(seg).padding:null, segItem:it?getComputedStyle(it).borderTopLeftRadius:null};});
  console.log(f.padEnd(22),JSON.stringify(r.sizes),'seg',r.seg,'item',r.segItem);
  if(r.odd.length) console.log('   odd:',[...new Set(r.odd)].join(' | '));
}
await b.close();
