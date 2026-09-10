import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/shots';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:393,height:852},deviceScaleFactor:2});
const p=await ctx.newPage();
for(const [f,sel] of [['shopping','Shop at'],['workout-log',null],['train','New']]){
  await p.goto('file:///home/user/everything-claude-code/redesign/08-build/'+f+'.html');
  await p.waitForTimeout(500);
  if(f==='workout-log'){ await p.evaluate(()=>{const i=document.querySelector('.setrow input,input[inputmode]');i&&i.click();}); }
  else await p.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().includes(t));b&&b.click();},sel);
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{const s=document.querySelector('.sheet');if(!s)return null;
    const rc=s.getBoundingClientRect(),cs=getComputedStyle(s);
    const sc=document.querySelector('.scrim');
    return {h:Math.round(rc.height),topRadius:cs.borderTopLeftRadius,botRadius:cs.borderBottomLeftRadius,left:Math.round(rc.left),
      grab:!!s.querySelector('.sheet__grab'),drag:!!s.querySelector('[data-sheet-drag]'),scrim:sc?getComputedStyle(sc).backgroundColor:null};});
  console.log(f,JSON.stringify(r));
  if(r) await p.screenshot({path:OUT+'/'+f+'-sheet-dark.png'});
}
await b.close();
