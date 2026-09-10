/* AX5 escape scan, settled, and skipping anything inside a horizontal scroller. */
import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const FS=process.argv[2]||'32px';
const W=Number(process.argv[3]||320);
const b=await browser();const p=await page(b,W,852);const L=console.log;
const scan=w=>p.evaluate(vw=>{
  const out=[];const seen=new Set();
  document.querySelectorAll('*').forEach(e=>{
    if(e.closest('.dev,.dev-panel,#dev-menu,#devPanel,[data-testid="dev-panel"]'))return;
    const cs=getComputedStyle(e);
    if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return;
    if(![...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim()))return;
    const r=e.getBoundingClientRect(); if(r.width<1||r.height<1)return;
    if(cs.textOverflow==='ellipsis')return;
    if(!(r.right>vw+1||r.left<-1))return;
    let a=e.parentElement,sc=null;
    while(a){const c2=getComputedStyle(a);
      if(/auto|scroll/.test(c2.overflowX)&&a.scrollWidth>a.clientWidth+1){sc=(a.className||'').toString().slice(0,20)+' '+a.scrollWidth+'/'+a.clientWidth;break;}
      a=a.parentElement;}
    if(sc)return;                       /* reachable by scrolling sideways */
    const k=(e.dataset.testid||e.className.toString().slice(0,20))+'|'+e.textContent.trim().slice(0,22);
    if(seen.has(k))return; seen.add(k);
    out.push({sel:e.dataset.testid||e.className.toString().slice(0,24),txt:e.textContent.trim().slice(0,32),
      box:[Math.round(r.left),Math.round(r.right)]});});
  return out;},w);
let n=0;
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(600);
  const st=await states(p); const list=st.length?st.map(x=>x.id):[null];
  for(const sid of list){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
    if(sid)await setState(p,sid);
    await p.evaluate(f=>{document.documentElement.style.fontSize=f;},FS);
    await p.waitForTimeout(1100);                 /* settle: container queries + wrap */
    await p.evaluate(()=>document.body.offsetHeight);
    const bad=await scan(W);
    if(bad.length){n+=bad.length;L('AX',FS,W,s,sid,JSON.stringify(bad.slice(0,6)));}
  }
}
L('done',FS,W,'escapes outside any horizontal scroller:',n,'errs',p.__errs.length);
await b.close();
