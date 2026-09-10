/* Dynamic Type: measure every visible text node's own box against its own
   scrollWidth/Height, at AX5 (320px root em ladder emulated by root font-size). */
import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const FS=process.argv[2]||'32px';
const W=Number(process.argv[3]||393);
const b=await browser();const p=await page(b,W,852);const L=console.log;
const scan=()=>p.evaluate(()=>{
  const out=[];
  const seen=new Set();
  document.querySelectorAll('*').forEach(e=>{
    if(e.closest('.dev,.dev-panel,#dev-menu,#devPanel,[data-testid="dev-panel"]'))return;
    const cs=getComputedStyle(e);
    if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return;
    const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim());
    if(!hasText)return;
    const r=e.getBoundingClientRect(); if(r.width<1||r.height<1)return;
    if(cs.textOverflow==='ellipsis')return;
    if(/hidden|clip/.test(cs.overflow)===false&&e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1){
      // still check viewport escape
    }
    const clipW=e.scrollWidth>e.clientWidth+1&&/hidden|clip/.test(cs.overflowX);
    const clipH=e.scrollHeight>e.clientHeight+1&&/hidden|clip/.test(cs.overflowY);
    const esc=r.right>innerWidth+1||r.left<-1;
    if(clipW||clipH||esc){
      const key=(e.dataset.testid||e.className.toString().slice(0,24))+'|'+e.textContent.trim().slice(0,26);
      if(seen.has(key))return; seen.add(key);
      out.push({sel:e.dataset.testid||e.className.toString().slice(0,26),txt:e.textContent.trim().slice(0,34),
        clipW,clipH,esc, box:[Math.round(r.left),Math.round(r.right)],
        sw:e.scrollWidth,cw:e.clientWidth,sh:e.scrollHeight,ch:e.clientHeight});
    }});
  return out;});
let n=0;
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
  const st=await states(p); const list=st.length?st.map(x=>x.id):[null];
  for(const sid of list){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(450);
    if(sid)await setState(p,sid);
    await p.evaluate(f=>{document.documentElement.style.fontSize=f;},FS);
    await p.waitForTimeout(500);
    const bad=await scan();
    if(bad.length){n+=bad.length;L('AX',FS,W,s,sid,JSON.stringify(bad.slice(0,8)));}
  }
}
L('done',FS,W,'total',n,'errs',p.__errs.length);
await b.close();
