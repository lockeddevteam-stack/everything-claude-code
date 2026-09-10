import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html')).sort();
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/s2';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
console.log('screen           | default sizes -> AX5 sizes | hOverflow | clipped/overlap');
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f); await p.waitForTimeout(400);
  const before=await p.evaluate(()=>{
    const s=new Set(); document.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width)return;
      if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) s.add(Math.round(parseFloat(getComputedStyle(e).fontSize)));});
    return [...s].sort((a,b)=>a-b);});
  // AX5: body anchor 53 => root 53/17*16 = 49.88px
  await p.evaluate(()=>{document.documentElement.style.fontSize='49.88px';});
  await p.waitForTimeout(500);
  const after=await p.evaluate(()=>{
    const s=new Set(); let clip=0, over=0;
    document.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width)return;
      if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){s.add(Math.round(parseFloat(getComputedStyle(e).fontSize)));
        const cs=getComputedStyle(e);
        if(e.scrollHeight>e.clientHeight+2&&(cs.overflow==='hidden'||cs.overflowY==='hidden')) clip++;
        if(e.scrollWidth>e.clientWidth+2&&cs.overflowX==='hidden') over++;}});
    return {s:[...s].sort((a,b)=>a-b),clip,over,docW:document.documentElement.scrollWidth,bodyW:document.body.scrollWidth};});
  console.log(f.padEnd(22), JSON.stringify(before),'->',JSON.stringify(after.s),'docW',after.docW,'clipV',after.clip,'clipH',after.over);
  await p.screenshot({path:`${OUT}/ax5-${f.replace('.html','')}.png`});
}
await b.close();
