import {chromium} from 'playwright';
import {D,SCREENS,hook,listStates} from './agent-sweep2-lib.mjs';
const FS=process.argv[2]||'32px';
const b=await chromium.launch();const out=[];
const PROBE=()=>{
  const res=[];
  const id=el=>{let e=el;while(e&&e!==document.body){if(e.dataset&&e.dataset.testid)return e.dataset.testid;e=e.parentElement;}return el.className;};
  document.querySelectorAll('.screen *').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.width<1)return;
    if(r.right>innerWidth+1||r.left<-1){
      const par=el.closest('.btn,.chip,.badge,.tabbar__item,.seg__item,.row')||el;
      res.push({tid:id(el),tag:el.tagName,cls:(el.className||'').toString().slice(0,40),
        txt:(el.textContent||'').trim().slice(0,40),l:Math.round(r.left),r:Math.round(r.right),
        parent:(par.className||'').toString().slice(0,40),parW:Math.round(par.getBoundingClientRect().width)});}
  });
  // dedupe by tid+txt
  const seen=new Set();const uniq=[];
  for(const x of res){const k=x.tid+'|'+x.txt;if(seen.has(k))continue;seen.add(k);uniq.push(x);}
  const tb=document.querySelector('.tabbar');
  const tbItems=tb?[...tb.querySelectorAll('.tabbar__item')].map(i=>{const q=i.getBoundingClientRect();
    return {t:i.dataset.testid,w:Math.round(q.width),sw:i.scrollWidth,cw:i.clientWidth,ov:i.scrollWidth>i.clientWidth+1,
      h:Math.round(q.height),sh:i.scrollHeight,clipY:i.scrollHeight>i.clientHeight+1};}):[];
  const tbr=tb?tb.getBoundingClientRect():null;
  return {uniq:uniq.slice(0,12),tbItems,tb:tbr?{t:Math.round(tbr.top),b:Math.round(tbr.bottom),h:Math.round(tbr.height)}:null,vh:innerHeight};
};
for(const s of SCREENS){
  const ctx=await b.newContext({viewport:{width:393,height:852}});
  const p=await ctx.newPage();const bag=[];hook(p,bag);
  await p.goto(D+s+'.html');await p.waitForTimeout(350);
  await p.evaluate(f=>{document.documentElement.style.fontSize=f;},FS);
  await p.evaluate(()=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;});
  let states=await listStates(p); if(!states.length)states=['(none)'];
  for(const st of states){
    if(st!=='(none)')await p.evaluate(t=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;document.querySelector(`[data-testid="${t}"]`)?.click();},st);
    await p.waitForTimeout(320);
    const r=await p.evaluate(PROBE);
    const tbBad=r.tbItems.filter(x=>x.ov||x.clipY);
    if(r.uniq.length||tbBad.length)out.push({screen:s,state:st,ov:r.uniq,tbBad,tb:r.tb});
  }
  await ctx.close();
}
console.log(JSON.stringify(out,null,1));
