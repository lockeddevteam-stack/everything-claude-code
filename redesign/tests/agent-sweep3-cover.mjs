/* Reachability: for every control, scroll it into view in its own scroller,
   then hit-test its centre. A control that is covered after being scrolled to
   is covered at every scroll position. */
import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const W=Number(process.argv[2]||393);
const b=await browser();const p=await page(b,W,852);const L=console.log;
const ids=()=>p.evaluate(()=>[...document.querySelectorAll('[data-testid]')].filter(e=>{
  if(/^dev/.test(e.dataset.testid))return false;
  const t=e.tagName; if(!(t==='BUTTON'||t==='A'||t==='INPUT'||t==='SELECT'||t==='TEXTAREA'||e.getAttribute('role')==='button'))return false;
  const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';}).map(e=>e.dataset.testid));
const check=id=>p.evaluate(x=>{
  const e=document.querySelector('[data-testid="'+x+'"]'); if(!e)return null;
  e.scrollIntoView({block:'center',behavior:'instant'});
  const r=e.getBoundingClientRect();
  const cx=Math.round(r.left+r.width/2), cy=Math.round(r.top+r.height/2);
  if(cy<0||cy>innerHeight)return {id:x,why:'offscreen',r:[Math.round(r.top),Math.round(r.bottom)]};
  const hit=document.elementFromPoint(cx,cy);
  if(hit&&(e.contains(hit)||hit.contains(e)))return null;
  const chain=[]; let bl=hit;
  while(bl&&chain.length<3){chain.push(bl.dataset?.testid||(bl.className||'').toString().slice(0,26));bl=bl.parentElement;}
  return {id:x,why:'covered',by:chain,r:[Math.round(r.top),Math.round(r.bottom)]};},id);
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(600);
  const st=await states(p); const list=st.length?st.map(x=>x.id):[null];
  for(const sid of list){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(550);
    if(sid)await setState(p,sid);
    const list2=await ids();
    const bad=[];
    for(const id of list2){const r=await check(id); if(r)bad.push(r);}
    if(bad.length)L('COVERED',W,s,sid,JSON.stringify(bad));
  }
}
L('done',W);
await b.close();
