import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/coach');
await p.waitForTimeout(900);
await p.click('[data-testid="seg-plan"]'); await p.waitForTimeout(500);
const snap=async()=>({ids:(await IDS(p)).join(','),txt:T(await p.locator('[data-testid="view-plan"]').innerText()),url:p.url()});
for(const tid of ['plan-more','plan-adjust']){
  const a=await snap();
  await p.click('[data-testid="'+tid+'"]'); await p.waitForTimeout(1200);
  const c=await snap();
  console.log(tid,'| url changed:',a.url!==c.url,'| ids changed:',a.ids!==c.ids,'| text changed:',a.txt!==c.txt);
  if(a.ids!==c.ids)console.log('   new ids:',c.ids.split(',').filter(x=>!a.ids.includes(x)).join(','));
  if(a.txt!==c.txt)console.log('   text now:',c.txt.slice(0,400));
  if(p.url()!==a.url){await p.goBack();await p.waitForTimeout(800);await p.click('[data-testid="seg-plan"]').catch(()=>{});await p.waitForTimeout(400);}
}
console.log('ERRS',errs);
await b.close();
