import {browser,page,DIR,SCREENS,states} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);
for(const s of SCREENS){
  await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
  const st=await states(p);
  console.log(s, st.length, JSON.stringify(st.map(x=>x.label)));
  if(p.__errs.length){console.log('  ERRS',p.__errs.splice(0));}
}
await b.close();
