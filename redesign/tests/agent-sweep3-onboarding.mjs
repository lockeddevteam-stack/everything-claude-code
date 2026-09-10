import {browser,page,DIR,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const snap=()=>p.evaluate(()=>({h:(document.querySelector('h1,h2')||{}).innerText,
  btns:[...document.querySelectorAll('button')].filter(e=>!e.closest('.dev-panel')&&!e.matches('[data-testid="dev-open"]')&&e.getBoundingClientRect().width>0)
    .map(e=>e.dataset.testid+':'+e.textContent.trim().slice(0,22)),
  txt:document.body.innerText.replace(/\s+/g,' ').slice(0,180)}));
await p.goto(DIR+'onboarding.html');await p.waitForTimeout(800);
L('boot',JSON.stringify(await snap()));
L('\n--- walk the welcome -> signup -> setup flow by pressing the primary each time');
for(let i=0;i<16;i++){
  const s=await snap();
  const primary=await p.evaluate(()=>{const bs=[...document.querySelectorAll('.btn--primary')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('.dev-panel'));
    return bs.length?bs[bs.length-1].dataset.testid:null;});
  if(!primary){L(i,'no primary. stop.',JSON.stringify(s));break;}
  p.__errs.length=0;
  const before=await p.evaluate(()=>document.body.innerHTML);
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').click(),primary);
  await p.waitForTimeout(900);
  const after=await p.evaluate(()=>document.body.innerHTML);
  const s2=await snap();
  L(i,primary,before===after?'NO CHANGE':'ok','->',JSON.stringify(s2.txt.slice(0,110)),p.__errs.slice(0));
  if(before===after){L('   DEAD END at',primary);break;}
}
L('\n--- every onboarding state: errors + bad text + a reachable primary');
const st=await states(p);
for(const s of st){
  await p.goto(DIR+'onboarding.html');await p.waitForTimeout(500);
  p.__errs.length=0;
  await setState(p,s.id);await p.waitForTimeout(450);
  const r=await p.evaluate(()=>{
    const bad=(document.body.innerText.match(/\bNaN\b|\bundefined\b|\[object Object\]|\bnull\b/g)||[]);
    const prim=[...document.querySelectorAll('.btn--primary')].filter(e=>e.getBoundingClientRect().width>0);
    const cut=[...document.querySelectorAll('*')].filter(e=>{const q=e.getBoundingClientRect();
      return q.width>0&&(q.right>394||q.left<-1);}).length;
    return {bad,primaries:prim.length,cut};});
  if(r.bad.length||p.__errs.length||r.cut)L(' ',s.id,s.label,JSON.stringify(r),p.__errs.slice(0));
}
L('done. ERRS',p.__errs);
await b.close();
