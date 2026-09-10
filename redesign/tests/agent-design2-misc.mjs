import { chromium } from 'playwright';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
await p.goto('file://'+DIR+'/exercise-library.html'); await p.waitForTimeout(600);
console.log('search field:', JSON.stringify(await p.evaluate(()=>{
  const i=document.querySelector('.findbar input, input[type=search], .find input');
  if(!i) return null; const s=getComputedStyle(i); const r=i.getBoundingClientRect();
  return {h:Math.round(r.height),rad:s.borderTopLeftRadius,capsule:parseFloat(s.borderTopLeftRadius)>=r.height/2-1,
    bs:s.boxShadow.slice(0,90), border:s.borderColor, outline:s.outline, focused:document.activeElement===i, ae:document.activeElement.tagName+'.'+document.activeElement.className};})));
// tab bar minimize
await p.goto('file://'+DIR+'/train.html'); await p.waitForTimeout(500);
const sc = await p.evaluate(()=>{const b=document.querySelector('.tabbar[data-minimize]');return b?b.getAttribute('data-minimize'):null;});
console.log('tabbar minimize selector:', sc);
if(sc){
  await p.evaluate(s=>{const el=document.querySelector(s); el.scrollTop=0; el.dispatchEvent(new Event('touchstart',{bubbles:true}));},sc);
  await p.evaluate(s=>{const el=document.querySelector(s); el.scrollTop=300; el.dispatchEvent(new Event('scroll'));},sc);
  await p.waitForTimeout(600);
  console.log('after scroll:', JSON.stringify(await p.evaluate(()=>{const t=document.querySelector('.tabbar');const h=document.querySelector('.hdr');
    return {tbMin:t.getAttribute('data-minimized'), tbW:Math.round(t.getBoundingClientRect().width), hdrH:Math.round(h.getBoundingClientRect().height),
      bigO:+getComputedStyle(document.querySelector('.hdr__title-large')).opacity, bigT:getComputedStyle(document.querySelector('.hdr__title-large')).transform,
      smallO:+getComputedStyle(document.querySelector('.hdr__title-small')||document.body).opacity};})));
  await p.screenshot({path:'/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/s2/train-scrolled.png'});
}
// demo
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html'); await p.waitForTimeout(2500);
await p.screenshot({path:'/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/s2/demo.png'});
console.log('demo errors:',errs.length, errs.slice(0,4));
await b.close();
