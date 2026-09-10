import {chromium} from 'playwright';
import {D,SCREENS,hook,listStates} from './agent-sweep2-lib.mjs';
const FS=process.argv[2]||'';
const b=await chromium.launch();const out=[];
const PROBE=()=>{
  const res={selects:[],btns:[],search:[]};
  const meas=(txt,cs)=>{const c=document.createElement('canvas').getContext('2d');
    c.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+'/'+cs.lineHeight+' '+cs.fontFamily;
    return c.measureText(txt).width;};
  document.querySelectorAll('select').forEach(s=>{
    const cs=getComputedStyle(s);const r=s.getBoundingClientRect();
    const txt=s.options[s.selectedIndex]?.text||'';
    const w=meas(txt,cs);
    const avail=r.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    res.selects.push({sel:s.dataset.testid||s.id||s.className,txt,w:Math.round(w),avail:Math.round(avail),
      pr:cs.paddingRight,bg:cs.backgroundImage!=='none',bpos:cs.backgroundPosition,overlap:w>avail+0.5});
  });
  document.querySelectorAll('.btn').forEach(bt=>{
    const cs=getComputedStyle(bt);const r=bt.getBoundingClientRect();
    if(r.width<2)return;
    const lab=bt.querySelector('.btn__label')||bt;
    const lr=lab.getBoundingClientRect();
    const rad=parseFloat(cs.borderTopLeftRadius);
    const eff=Math.min(rad,r.height/2);
    // horizontal clearance from the label to the capsule edge
    const leftGap=lr.left-r.left, rightGap=r.right-lr.right;
    const clipped=bt.scrollWidth>bt.clientWidth+1;
    if(clipped||leftGap<eff*0.34||rightGap<eff*0.34)
      res.btns.push({sel:bt.dataset.testid||bt.className,txt:(bt.textContent||'').trim().slice(0,28),
        w:Math.round(r.width),h:Math.round(r.height),rad:Math.round(eff),lg:Math.round(leftGap),rg:Math.round(rightGap),clipped});
  });
  document.querySelectorAll('.search .input, input[type="search"]').forEach(i=>{
    const cs=getComputedStyle(i);const r=i.getBoundingClientRect();
    const txt=i.value||i.placeholder||'';
    const w=meas(txt,cs);
    const avail=r.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    if(w>avail+0.5)res.search.push({sel:i.dataset.testid||i.id,txt,w:Math.round(w),avail:Math.round(avail)});
  });
  return res;
};
for(const s of SCREENS){
  const ctx=await b.newContext({viewport:{width:393,height:852}});
  const p=await ctx.newPage();const bag=[];hook(p,bag);
  await p.goto(D+s+'.html');await p.waitForTimeout(350);
  if(FS)await p.evaluate(f=>{document.documentElement.style.fontSize=f;},FS);
  await p.evaluate(()=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;});
  let states=await listStates(p); if(!states.length)states=['(none)'];
  for(const st of states){
    if(st!=='(none)')await p.evaluate(t=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;document.querySelector(`[data-testid="${t}"]`)?.click();},st);
    await p.waitForTimeout(300);
    const r=await p.evaluate(PROBE);
    const bad={selects:r.selects.filter(x=>x.overlap||!x.bg),btns:r.btns,search:r.search};
    if(bad.selects.length||bad.btns.length||bad.search.length)out.push({screen:s,state:st,...bad});
  }
  await ctx.close();
}
console.log(JSON.stringify(out,null,1));
