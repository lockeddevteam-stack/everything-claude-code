import { chromium } from 'playwright';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/shots';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
for(const f of ['fuel','profile','progress','coach','exercise-library','train','shopping','split-builder','workout-log']){
  await p.goto('file://'+DIR+'/'+f+'.html'); await p.waitForTimeout(500);
  const r=await p.evaluate(async()=>{
    const bar=document.querySelector('[data-large-title]'); if(!bar) return 'none';
    const lg=bar.querySelector('.hdr__title-large'), sm=bar.querySelector('.hdr__title-small');
    const g=e=>e?{fs:getComputedStyle(e).fontSize,op:getComputedStyle(e).opacity,fw:getComputedStyle(e).fontWeight}:null;
    const before={lg:g(lg),sm:g(sm)};
    const sc=document.querySelector(bar.getAttribute('data-large-title'));
    if(!sc) return 'noscroller';
    sc.scrollTop=300; sc.dispatchEvent(new Event('scroll'));
    await new Promise(r=>setTimeout(r,300));
    return {before,after:{lg:g(lg),sm:g(sm)},barH:Math.round(bar.getBoundingClientRect().height),
      scrolled:sc.scrollTop, edge:!!document.querySelector('[data-scroll-edge]')};
  });
  console.log(f, JSON.stringify(r));
  await p.screenshot({path:OUT+'/'+f+'-scrolled-dark.png'});
}
await b.close();
