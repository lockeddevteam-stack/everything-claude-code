import { chromium } from 'playwright';
import fs from 'fs';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const screens=fs.readdirSync(DIR).filter(f=>f.endsWith('.html')).sort();
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/s2';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
for(const f of screens){
  await p.goto('file://'+DIR+'/'+f); await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const lt=document.querySelector('[data-large-title]');
    const g=()=>{
      const big=document.querySelector('.hdr__large,.bar__large,[data-title-large],.hdr__title--large');
      const small=document.querySelector('.hdr__small,.bar__small,[data-title-small],.hdr__title--small');
      const hdr=document.querySelector('.hdr,header,.bar');
      return {big:big?{o:+getComputedStyle(big).opacity,fs:getComputedStyle(big).fontSize,tf:getComputedStyle(big).transform.slice(0,40),cls:big.className}:null,
              small:small?{o:+getComputedStyle(small).opacity,fs:getComputedStyle(small).fontSize}:null,
              h:hdr?Math.round(hdr.getBoundingClientRect().height):null};};
    return {has:!!lt, rest:g(), scroller:!!document.querySelector('[data-scroll-edge]'),
      searchY:(()=>{const s=document.querySelector('.findbar,.searchbar,input[type=search]');return s?Math.round(s.getBoundingClientRect().top):null;})()};
  });
  let after=null;
  if(r.has){
    await p.evaluate(()=>{const sc=document.querySelector('[data-scroll-edge]')||document.scrollingElement;sc.scrollTop=400;sc.dispatchEvent(new Event('scroll',{bubbles:true}));window.dispatchEvent(new Event('scroll'));});
    await p.waitForTimeout(700);
    after=await p.evaluate(()=>{
      const big=document.querySelector('.hdr__large,.bar__large,[data-title-large],.hdr__title--large');
      const small=document.querySelector('.hdr__small,.bar__small,[data-title-small],.hdr__title--small');
      const hdr=document.querySelector('.hdr,header,.bar');
      const tb=document.querySelector('.tabbar');
      return {bigO:big?+getComputedStyle(big).opacity:null,bigFS:big?getComputedStyle(big).fontSize:null,bigT:big?getComputedStyle(big).transform.slice(0,45):null,
        smallO:small?+getComputedStyle(small).opacity:null,smallFS:small?getComputedStyle(small).fontSize:null,
        h:hdr?Math.round(hdr.getBoundingClientRect().height):null, tbH:tb?Math.round(tb.getBoundingClientRect().height):null, tbCls:tb?tb.className:null};});
    await p.screenshot({path:`${OUT}/scrolled-${f.replace('.html','')}.png`});
  }
  console.log(f.padEnd(22),'LT:',r.has,'rest',JSON.stringify(r.rest),'searchTop',r.searchY,'| after',JSON.stringify(after));
}
await b.close();
