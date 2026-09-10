import {chromium} from 'playwright';
import {D,SCREENS,hook,listStates} from './agent-sweep2-lib.mjs';
const b=await chromium.launch();const out=[];
for(const s of SCREENS){
  const ctx=await b.newContext({viewport:{width:393,height:852},colorScheme:'dark'});
  const p=await ctx.newPage();const bag=[];hook(p,bag);
  await p.goto(D+s+'.html');await p.waitForTimeout(400);
  await p.evaluate(()=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;});
  let states=await listStates(p); if(!states.length)states=['(none)'];
  for(const st of states){
    if(st!=='(none)')await p.evaluate(t=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;document.querySelector(`[data-testid="${t}"]`)?.click();},st);
    await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{
      const bad=[];
      const tb=document.querySelector('.tabbar');
      if(tb){const cs=getComputedStyle(tb);
        if(cs.backgroundColor==='rgba(0, 0, 0, 0)')bad.push({what:'tabbar transparent bg'});}
      // transparent surfaces on floating chrome
      ['.tabbar','.shelf','.findbar--bottom','.sheet','.dialog'].forEach(sel=>{
        const e=document.querySelector(sel);if(!e)return;const cs=getComputedStyle(e);
        bad.push({sel,bg:cs.backgroundColor,color:cs.color,bd:cs.backdropFilter});});
      const de=document.documentElement;
      return {bad,scheme:getComputedStyle(de).colorScheme,bodyBg:getComputedStyle(document.body).backgroundColor,
        overflow:[...document.querySelectorAll('.screen *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>394||r.left<-1);}).length};
    });
    out.push({screen:s,state:st,...r,errs:bag.splice(0)});
  }
  await ctx.close();
}
console.log(JSON.stringify(out));
