import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
const files=['progress','train','fuel','exercise-library','shopping','review','settings','profile','home','coach','workout-log','split-builder'];
for(const f of files){
  const p=await br.newPage({viewport:{width:393,height:852}});
  await p.goto(pathToFileURL(path.join(BUILD,f+'.html')).href); await p.waitForTimeout(600);
  await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
  const r = await p.evaluate(()=>{
    const sc=[...document.querySelectorAll('*')].filter(x=>x.scrollHeight>x.clientHeight+40&&x.clientHeight>300)[0];
    if(!sc) return 'no scroller';
    sc.scrollTop=300; return 'ok';
  });
  await p.waitForTimeout(600);
  await p.screenshot({path:`${S}/hdr-${f}.png`, clip:{x:0,y:0,width:393,height:120}});
  // overflow check on the bar
  const info = await p.evaluate(()=>{
    const bar=document.querySelector('[data-large-title]');
    if(!bar) return null;
    const cs=getComputedStyle(bar);
    const kids=[...bar.querySelectorAll('*')].map(k=>({t:(k.textContent||'').trim().slice(0,24), b:k.getBoundingClientRect().toJSON()})).filter(k=>k.t);
    return {barH:bar.getBoundingClientRect().height, overflow:cs.overflow, kids:kids.filter(k=>k.b.top<0||k.b.bottom>bar.getBoundingClientRect().height+1)};
  });
  console.log(f, r, JSON.stringify(info));
  await p.close();
}
await br.close();
