import { chromium } from 'playwright';
const DIR='/home/user/everything-claude-code/redesign/08-build';
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/s2';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
async function trySheet(file,sel,name){
  await p.goto('file://'+DIR+'/'+file); await p.waitForTimeout(500);
  try{ await p.click(sel,{timeout:2500}); }catch(e){ console.log(name,'click failed',e.message.slice(0,60)); return; }
  await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{
    const s=document.querySelector('.sheet'); if(!s) return null;
    const cs=getComputedStyle(s); const r=s.getBoundingClientRect();
    const gr=s.querySelector('.sheet__grab');
    const scrim=document.querySelector('.scrim,.backdrop,[class*=scrim]');
    return {left:Math.round(r.left),right:Math.round(393-r.right),bottom:Math.round(852-r.bottom),h:Math.round(r.height),
      rad:cs.borderRadius, detents:s.getAttribute('data-detents'), grabber:gr?gr.getAttribute('data-grabber')+' '+Math.round(gr.getBoundingClientRect().width)+'x'+Math.round(gr.getBoundingClientRect().height):null,
      to:cs.transformOrigin, anim:cs.animation.slice(0,80), scrim:scrim?getComputedStyle(scrim).backgroundColor:'none', bg:cs.backgroundColor, bf:cs.backdropFilter};});
  console.log(name, JSON.stringify(r));
  await p.screenshot({path:`${OUT}/sheet-${name}.png`});
}
await trySheet('shopping.html','[data-act="store"], [data-testid*="store"], button:has-text("Shop at")','shopping');
await trySheet('workout-log.html','.cell','wl-pad');
await trySheet('settings.html','.row:has-text("Weight unit")','settings');
await trySheet('train.html','.row','train');
// reduced motion + transparency + forced colors
for(const [k,v] of [['reducedMotion','reduce'],['forcedColors','active']]){
  const c2=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,[k]:v});
  const q=await c2.newPage(); const errs=[]; q.on('pageerror',e=>errs.push(e.message));
  await q.goto('file://'+DIR+'/home.html'); await q.waitForTimeout(600);
  await q.screenshot({path:`${OUT}/home-${k}.png`});
  console.log(k,v,'errs',errs.length);
  await c2.close();
}
const c3=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const q3=await c3.newPage();
await q3.emulateMedia({reducedTransparency:'reduce'}).catch(()=>{});
await q3.goto('file://'+DIR+'/home.html'); await q3.waitForTimeout(500);
console.log('reduced-transparency tabbar bf:', await q3.evaluate(()=>{const t=document.querySelector('.tabbar');return t?getComputedStyle(t).backdropFilter+' bg '+getComputedStyle(t).backgroundColor:'none';}));
await q3.screenshot({path:`${OUT}/home-rtransparency.png`});
await b.close();
