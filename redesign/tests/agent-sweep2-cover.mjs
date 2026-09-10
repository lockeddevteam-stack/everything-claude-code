import {chromium} from 'playwright';
import {D,SCREENS,hook,listStates} from './agent-sweep2-lib.mjs';
const W=Number(process.argv[2]||393), FS=process.argv[3]||'';
const b=await chromium.launch();const out=[];
const PROBE=()=>{
  const sc=document.querySelector('.screen');if(!sc)return{err:'no screen'};
  const chrome=[...document.querySelectorAll('.tabbar, #shelf-slot, .findbar--bottom, .shelf')];
  const res=[];
  document.querySelectorAll('.screen button, .screen a[href], .screen input, .screen select, .screen textarea, .screen [role="button"], .screen [tabindex]:not([tabindex="-1"])').forEach(el=>{
    if(el.closest('#dev-menu')||el.id==='dev-toggle')return;
    if(el.closest('.tabbar,#shelf-slot,.findbar--bottom'))return;
    const r=el.getBoundingClientRect();
    if(r.width<2||r.height<2)return;
    if(r.top<0||r.bottom>innerHeight)return; // not currently on-screen; scroll handles it
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    const hit=document.elementFromPoint(cx,cy);
    if(!hit)return;
    if(!el.contains(hit)&&hit!==el){
      const blocker=chrome.find(c=>c===hit||c.contains(hit));
      res.push({sel:el.dataset?.testid||el.className||el.tagName,txt:(el.textContent||'').trim().slice(0,30),
        blocked:blocker?(blocker.className||blocker.id):((hit.dataset&&hit.dataset.testid)||hit.className||hit.tagName),
        chrome:!!blocker, r:{t:Math.round(r.top),b:Math.round(r.bottom)}});
    }
  });
  return {res};
};
for(const s of SCREENS){
  const ctx=await b.newContext({viewport:{width:W,height:852}});
  const p=await ctx.newPage();const bag=[];hook(p,bag);
  await p.goto(D+s+'.html');await p.waitForTimeout(350);
  if(FS)await p.evaluate(f=>{document.documentElement.style.fontSize=f;},FS);
  await p.evaluate(()=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;});
  let states=await listStates(p); if(!states.length)states=['(none)'];
  for(const st of states){
    if(st!=='(none)'){await p.evaluate(t=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;document.querySelector(`[data-testid="${t}"]`)?.click();},st);await p.waitForTimeout(350);}
    // top of scroll
    let r=await p.evaluate(PROBE); if(r.res&&r.res.length)out.push({screen:s,state:st,at:'top',...r});
    // bottom of scroll
    const scrolled=await p.evaluate(()=>{const sc=document.querySelector('.body,[data-scroller],main');if(!sc)return false;sc.scrollTop=sc.scrollHeight;return true;});
    if(scrolled){await p.waitForTimeout(400);r=await p.evaluate(PROBE);if(r.res&&r.res.length)out.push({screen:s,state:st,at:'bottom',...r});}
  }
  if(bag.length)out.push({screen:s,errs:bag});
  await ctx.close();
}
console.log(JSON.stringify(out));
