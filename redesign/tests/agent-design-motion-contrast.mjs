import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html'));
const b=await chromium.launch();
for(const theme of ['dark','light']){
const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();
const dur={},fn={},fails=[];let totalText=0;
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f); await p.waitForTimeout(400);
  await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
  await p.waitForTimeout(200);
  const r=await p.evaluate((file)=>{
    const D={},F={},fails=[];let n=0;
    const lum=c=>{const[r,g,b]=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return .2126*r+.7152*g+.0722*b;};
    const parse=s=>{const m=s.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):null;};
    const bgOf=el=>{let e=el;while(e){const c=getComputedStyle(e).backgroundColor;const m=c.match(/[\d.]+/g);
      if(m&&(m.length<4||Number(m[3])>0.9))return parse(c);e=e.parentElement;}return [0,0,0];};
    for(const el of document.querySelectorAll('.screen *')){
      const rc=el.getBoundingClientRect(); if(rc.width<1||rc.height<1) continue;
      const cs=getComputedStyle(el);
      if(cs.transitionDuration!=='0s')cs.transitionDuration.split(', ').forEach((d,i)=>{D[d]=(D[d]||0)+1;F[cs.transitionTimingFunction.split(', ')[i]||cs.transitionTimingFunction]=(F[cs.transitionTimingFunction.split(', ')[i]||cs.transitionTimingFunction]||0)+1;});
      if(cs.animationName!=='none'){D['@'+cs.animationDuration]=(D['@'+cs.animationDuration]||0)+1;F['@'+cs.animationTimingFunction]=(F['@'+cs.animationTimingFunction]||0)+1;}
      const hasText=[...el.childNodes].some(x=>x.nodeType===3&&x.textContent.trim());
      if(!hasText)continue; n++;
      const fg=parse(cs.color),bg=bgOf(el); if(!fg)continue;
      const L1=lum(fg),L2=lum(bg); const cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
      const fs=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;
      const need=(fs>=24||(fs>=18.66&&bold))?3:4.5;
      if(cr<need) fails.push({file,t:el.textContent.trim().slice(0,26),cr:cr.toFixed(2),need,fs,cls:String(el.className).slice(0,26)});
    }
    return {D,F,fails,n};
  },f);
  for(const[k,v] of Object.entries(r.D))dur[k]=(dur[k]||0)+v;
  for(const[k,v] of Object.entries(r.F))fn[k]=(fn[k]||0)+v;
  fails.push(...r.fails); totalText+=r.n;
}
console.log('===',theme,'text nodes',totalText,'contrast fails',fails.length);
console.log(JSON.stringify(fails.slice(0,25),null,0));
if(theme==='dark'){console.log('durations',JSON.stringify(dur));console.log('timing',JSON.stringify(fn));}
await ctx.close();
}
await b.close();
