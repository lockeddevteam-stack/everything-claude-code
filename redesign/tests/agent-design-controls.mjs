import { chromium } from 'playwright';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();
const D='file:///home/user/everything-claude-code/redesign/08-build/';
for(const f of ['settings','progress','shopping','home','exercise-library','coach','train']){
 await p.goto(D+f+'.html'); await p.waitForTimeout(400);
 console.log(f, JSON.stringify(await p.evaluate(()=>{
  const g=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
   return [Math.round(r.width)+'x'+Math.round(r.height),'r'+cs.borderTopLeftRadius];};
  const btns=[...document.querySelectorAll('.btn')].map(e=>{const r=e.getBoundingClientRect();return Math.round(r.height)+'/'+getComputedStyle(e).borderTopLeftRadius;});
  return {toggle:g('.switch__track'),seg:g('.seg'),segItem:g('.seg__item'),search:g('.findbar input,.search input,input[type=search]'),
    card:g('.card'),btnHeights:[...new Set(btns)],row:g('.row'),hdr:g('.hdr'),chip:g('.chip')};
 })));
}
await b.close();
