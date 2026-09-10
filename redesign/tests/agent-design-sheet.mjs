import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/shots';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/home.html');
await p.waitForTimeout(500);
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/choose another/i.test(x.textContent));b&&b.click();});
await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const s=document.querySelector('.sheet');if(!s)return 'no sheet';
 const r=s.getBoundingClientRect();const cs=getComputedStyle(s);
 const scrim=document.querySelector('.scrim,.overlay,.backdrop');
 return {h:Math.round(r.height),top:Math.round(r.top),radius:cs.borderTopLeftRadius,bottomRadius:cs.borderBottomLeftRadius,
  left:Math.round(r.left),bg:cs.backgroundColor,grab:!!document.querySelector('.sheet__grab'),
  scrim:scrim?getComputedStyle(scrim).backgroundColor:null, detents:s.getAttribute('data-detents')};}));
await p.screenshot({path:OUT+'/home-sheet-dark.png'});
await b.close();
