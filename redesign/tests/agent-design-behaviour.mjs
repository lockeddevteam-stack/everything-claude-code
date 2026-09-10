import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html'));
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852}});
const p=await ctx.newPage();
const res={};
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f); await p.waitForTimeout(400);
  const r={};
  // large title collapse
  r.collapse=await p.evaluate(async()=>{
    const bar=document.querySelector('[data-large-title]'); if(!bar) return 'no-large-title-bar';
    const t=bar.querySelector('.hdr__title,h1,.hdr__title--large')||bar.querySelector('*');
    const before=getComputedStyle(t).fontSize;
    const sc=document.querySelector(bar.getAttribute('data-large-title')); if(!sc) return 'no-scroller';
    sc.scrollTop=200; sc.dispatchEvent(new Event('scroll'));
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    return {before,after:getComputedStyle(t).fontSize,scrollable:sc.scrollHeight>sc.clientHeight};
  });
  // tab bar geometry
  r.tabbar=await p.evaluate(()=>{const t=document.querySelector('.tabbar'); if(!t) return null;
    const rc=t.getBoundingClientRect(); const cs=getComputedStyle(t);
    return {h:Math.round(rc.height),bottom:Math.round(window.innerHeight-rc.bottom),left:Math.round(rc.left),right:Math.round(393-rc.right),radius:cs.borderTopLeftRadius,bg:cs.backgroundColor};});
  // page margin
  r.pageX=await p.evaluate(()=>{const c=document.querySelector('.screen .hdr');return c?getComputedStyle(c).paddingLeft:null;});
  // AX5 simulation: bump root font-size
  r.ax5=await p.evaluate(()=>{
    const t=document.querySelector('.screen p,.screen span,.screen div');
    const pick=[...document.querySelectorAll('.screen *')].find(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const before=pick?getComputedStyle(pick).fontSize:null;
    document.documentElement.style.fontSize='53px';
    const after=pick?getComputedStyle(pick).fontSize:null;
    document.documentElement.style.fontSize='';
    return {before,after,scales:before!==after};});
  res[f]=r;
}
// reduce motion / transparency contexts
for(const [name,opts] of [['reduced-motion',{reducedMotion:'reduce'}],['forced-colors',{forcedColors:'active'}]]){
  const c2=await b.newContext({viewport:{width:393,height:852},...opts});
  const p2=await c2.newPage(); const errs=[];
  p2.on('pageerror',e=>errs.push(e.message));
  await p2.goto('file://'+DIR+'/home.html'); await p2.waitForTimeout(600);
  res['_'+name]=await p2.evaluate(()=>{
    const anim=[...document.querySelectorAll('.screen *')].filter(e=>getComputedStyle(e).animationName!=='none'&&getComputedStyle(e).animationDuration!=='0s').length;
    const tr=[...document.querySelectorAll('.screen *')].filter(e=>getComputedStyle(e).transitionDuration!=='0s').length;
    return {animatedEls:anim,transitionEls:tr};});
  await p2.screenshot({path:OUT+'/shots/home-'+name+'.png'});
  await c2.close();
}
fs.writeFileSync(OUT+'/behaviour.json',JSON.stringify(res,null,1));
console.log(JSON.stringify(res,null,1));
await b.close();
