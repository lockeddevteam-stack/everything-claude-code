import {chromium} from 'playwright';
import {D,SCREENS,hook,listStates} from './agent-sweep2-lib.mjs';
const W=Number(process.argv[2]||393), FS=process.argv[3]||'';
const b=await chromium.launch();
const out=[];
for(const s of SCREENS){
  const ctx=await b.newContext({viewport:{width:W,height:852}});
  const p=await ctx.newPage();const bag=[];hook(p,bag);
  await p.goto(D+s+'.html');await p.waitForTimeout(350);
  if(FS)await p.evaluate(f=>{document.documentElement.style.fontSize=f;},FS);
  await p.evaluate(()=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;});
  let states=await listStates(p); if(!states.length)states=['(none)'];
  for(const st of states){
    if(st!=='(none)'){ await p.evaluate(t=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;document.querySelector(`[data-testid="${t}"]`)?.click();},st); await p.waitForTimeout(350);}
    const r=await p.evaluate(()=>{
      const bad=[];const rx=/(^|[\s>(])(NaN|undefined|null|Infinity)([\s<).,%]|$)/;
      const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let n;while(n=walk.nextNode()){const t=n.nodeValue.trim();if(t&&rx.test(t)){const el=n.parentElement;if(el.closest('#dev-menu')||/SCRIPT|STYLE/.test(el.tagName))continue;bad.push({txt:t.slice(0,80),sel:el.dataset?.testid||el.className||el.tagName});}}
      const ov=[];document.querySelectorAll('.screen *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width>0&&(r.right>innerWidth+1||r.left<-1))ov.push({sel:el.dataset?.testid||el.className||el.tagName,l:Math.round(r.left),r:Math.round(r.right)});});
      const clip=[];document.querySelectorAll('.screen *').forEach(el=>{if(el.children.length)return;if(!el.textContent.trim())return;if(el.classList.contains('vis-hidden'))return;const cs=getComputedStyle(el);
        if(el.scrollWidth>el.clientWidth+1&&cs.overflowX!=='visible'&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll')clip.push({k:'x',sel:el.dataset?.testid||el.className,txt:el.textContent.trim().slice(0,45),sw:el.scrollWidth,cw:el.clientWidth});
        else if(el.scrollHeight>el.clientHeight+2&&cs.overflowY!=='visible'&&cs.overflowY!=='auto'&&cs.overflowY!=='scroll')clip.push({k:'y',sel:el.dataset?.testid||el.className,txt:el.textContent.trim().slice(0,45),sh:el.scrollHeight,ch:el.clientHeight});});
      const tb=document.querySelector('.tabbar');const tbr=tb?tb.getBoundingClientRect():null;
      const sc=document.querySelector('.screen');const scr=sc?sc.getBoundingClientRect():null;
      return {bad,ov:ov.slice(0,15),clip:clip.slice(0,15),tb:tbr?{t:Math.round(tbr.top),b:Math.round(tbr.bottom),l:Math.round(tbr.left),r:Math.round(tbr.right)}:null,sh:scr?Math.round(scr.height):null};
    });
    out.push({screen:s,state:st,...r,errs:bag.splice(0)});
  }
  await ctx.close();
}
console.log(JSON.stringify(out));
