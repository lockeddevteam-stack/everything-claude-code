/* targeted no-op scan on the screens the long sweep has not reached, without
   the workout-log set grid (761 controls) */
import {browser,page,DIR,states,setState} from '/home/user/everything-claude-code/redesign/tests/agent-sweep3-lib.mjs';
const b=await browser();const L=console.log;
const SC=['exercise-library','split-builder','review','fuel','shopping','progress','coach','profile','settings'];
for(const s of SC){
  const p=await page(b);
  await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
  const st=await states(p);const list=st.length?st.map(x=>x.id):[null];
  const noop=[],errs=[],bad=[],blocked=[];
  for(const sid of list){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(400);
    if(sid)await setState(p,sid);
    const ids=await p.evaluate(()=>[...document.querySelectorAll('[data-testid]')]
      .filter(e=>{const t=e.tagName;const r=e.getBoundingClientRect();
        if(!(t==='BUTTON'||t==='A'||e.getAttribute('role')==='button'))return false;
        if(/^dev/.test(e.dataset.testid))return false;
        return r.width>0&&r.height>0;}).map(e=>e.dataset.testid));
    for(const id of ids){
      await p.goto(DIR+s+'.html');await p.waitForTimeout(280);
      if(sid)await setState(p,sid);
      p.__errs.length=0;
      const A=await p.evaluate(()=>document.body.innerHTML+'|'+location.href);
      let ok=false,bl=null;
      try{await p.locator('[data-testid="'+id+'"]').first().click({timeout:1800});ok=true;}catch(e){bl=String(e.message).split('\n')[0].slice(0,60);}
      await p.waitForTimeout(340);
      const B=await p.evaluate(()=>document.body.innerHTML+'|'+location.href);
      const t=await p.evaluate(()=>(document.body.innerText.match(/\bNaN\b|\bundefined\b|\[object Object\]|\bInfinity\b/g)||[]).slice(0,2));
      if(bl)blocked.push([sid,id,bl]);
      else if(A===B)noop.push([sid,id]);
      if(t.length)bad.push([sid,id,t]);
      if(p.__errs.length)errs.push([sid,id,p.__errs.slice(0)]);
    }
  }
  L('##',s,'noop',noop.length,'blocked',blocked.length,'bad',bad.length,'errs',errs.length);
  if(noop.length)L('   NOOP',JSON.stringify(noop));
  if(blocked.length)L('   BLOCKED',JSON.stringify(blocked));
  if(bad.length)L('   BAD',JSON.stringify(bad));
  if(errs.length)L('   ERRS',JSON.stringify(errs));
  await p.context().close();
}
await b.close();
