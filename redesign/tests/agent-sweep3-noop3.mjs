/* just fuel + progress + shopping + profile + settings no-op, quick */
import {browser,page,DIR,states,setState} from '/home/user/everything-claude-code/redesign/tests/agent-sweep3-lib.mjs';
const b=await browser();const L=console.log;
for(const s of ['fuel','progress','shopping','profile','settings','review']){
  const p=await page(b);
  await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
  const st=await states(p);const list=st.length?st.map(x=>x.id):[null];
  const noop=[],errs=[],blocked=[];
  for(const sid of list){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(380);
    if(sid)await setState(p,sid);
    const ids=await p.evaluate(()=>[...document.querySelectorAll('[data-testid]')]
      .filter(e=>{const t=e.tagName;const r=e.getBoundingClientRect();
        if(!(t==='BUTTON'||t==='A'||e.getAttribute('role')==='button'))return false;
        if(/^dev/.test(e.dataset.testid))return false;
        return r.width>0&&r.height>0;}).map(e=>e.dataset.testid));
    for(const id of ids){
      await p.goto(DIR+s+'.html');await p.waitForTimeout(260);
      if(sid)await setState(p,sid);
      p.__errs.length=0;
      const A=await p.evaluate(()=>document.body.innerHTML+'|'+location.href);
      let bl=null;
      try{await p.locator('[data-testid="'+id+'"]').first().click({timeout:1500});}catch(e){bl='blocked';}
      await p.waitForTimeout(320);
      const B=await p.evaluate(()=>document.body.innerHTML+'|'+location.href);
      if(bl)blocked.push([sid,id]);
      else if(A===B)noop.push([sid,id]);
      if(p.__errs.length)errs.push([sid,id,p.__errs.slice(0)]);
    }
  }
  L('##',s,'noop',noop.length,'blocked',blocked.length,'errs',errs.length);
  if(noop.length)L('   NOOP',JSON.stringify(noop));
  if(blocked.length)L('   BLOCKED',JSON.stringify(blocked));
  if(errs.length)L('   ERRS',JSON.stringify(errs));
  await p.context().close();
}
await b.close();
