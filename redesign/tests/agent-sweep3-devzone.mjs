import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
L('=== the dev scaffolding container: box, visibility, and what it catches');
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(550);
  const r=await p.evaluate(()=>{
    const sels=['.dev','.dev-open','[data-testid="dev-open"]'];
    const out=[];
    sels.forEach(sel=>{document.querySelectorAll(sel).forEach(e=>{
      const q=e.getBoundingClientRect();const cs=getComputedStyle(e);
      if(q.width<1)return;
      const cx=Math.round(q.left+q.width/2),cy=Math.round(q.top+q.height/2);
      const hit=document.elementFromPoint(cx,cy);
      out.push({sel,box:[Math.round(q.left),Math.round(q.right),Math.round(q.top),Math.round(q.bottom)],
        pe:cs.pointerEvents,z:cs.zIndex,
        catches:hit?(hit.dataset.testid||(hit.className||'').toString().slice(0,20)):'none',
        visiblePixels:(()=>{const btn=e.querySelector('button')||e;const bq=btn.getBoundingClientRect();
          return [Math.round(bq.left),Math.round(bq.right)];})()});});});
    return out;});
  L(s,JSON.stringify(r));
}
L('\n=== workout-log error toast: does it block a control scrolled under it?');
await p.goto(DIR+'workout-log.html');await p.waitForTimeout(600);
const st=await states(p);
await setState(p,st.find(x=>/error/i.test(x.label)).id);await p.waitForTimeout(600);
const res=await p.evaluate(()=>{
  const e=document.querySelector('[data-testid="btn-add-exercise"]');
  e.scrollIntoView({block:'center',behavior:'instant'});
  const r=e.getBoundingClientRect();
  const cx=Math.round(r.left+r.width/2),cy=Math.round(r.top+r.height/2);
  const h=document.elementFromPoint(cx,cy);
  const t=document.querySelector('.toast').getBoundingClientRect();
  return {btn:[Math.round(r.top),Math.round(r.bottom)],toast:[Math.round(t.top),Math.round(t.bottom)],
    hit:h?(h.dataset.testid||(h.className||'').toString()):'none',
    toastPE:getComputedStyle(document.querySelector('.toast')).pointerEvents};});
L(JSON.stringify(res));
L('toast still there after 12s?');
await p.waitForTimeout(12000);
L(await p.evaluate(()=>!!document.querySelector('.toast')&&document.querySelector('.toast').innerText.replace(/\s+/g,' ')));
L('ERRS',p.__errs);
await b.close();
