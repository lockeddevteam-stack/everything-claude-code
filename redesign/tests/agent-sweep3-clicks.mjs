import fs from 'fs';
import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const only=process.argv[2];
const b=await browser();
const out=[];
const snap=p=>p.evaluate(()=>{
  const bad=[];
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n,txt='';
  while((n=walk.nextNode())){const t=n.nodeValue;if(!t.trim())continue;
    const el=n.parentElement; if(!el)continue;
    const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden')continue;
    txt+=t;
    if(/\bNaN\b|\bundefined\b|\[object Object\]|\bnull\b|\bInfinity\b/.test(t))bad.push(t.trim().slice(0,90));
  }
  return {html:document.body.innerHTML.length, sig:txt.length, bad,
    ae:document.activeElement?(document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||'')):'',
    overlay:!!document.querySelector('.sheet,.dialog,[role=dialog]'),
    url:location.href};
});
for(const s of SCREENS){
  if(only&&s!==only)continue;
  const p=await page(b);
  await p.goto(DIR+s+'.html');await p.waitForTimeout(400);
  const st=await states(p);
  const list=st.length?st.map(x=>x.id):[null];
  for(const sid of list){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(350);
    if(sid)await setState(p,sid);
    const ids=await p.evaluate(()=>[...document.querySelectorAll('[data-testid]')]
      .filter(e=>{const t=e.tagName;const r=e.getBoundingClientRect();
        if(!(t==='BUTTON'||t==='A'||e.getAttribute('role')==='button'))return false;
        if(/^dev/.test(e.dataset.testid))return false;
        return r.width>0&&r.height>0;}).map(e=>e.dataset.testid));
    for(const id of ids){
      await p.goto(DIR+s+'.html');await p.waitForTimeout(300);
      if(sid)await setState(p,sid);
      p.__errs.length=0;
      const before=await snap(p);
      let clicked=false,blocked=null;
      try{ await p.locator('[data-testid="'+id+'"]').first().click({timeout:2500}); clicked=true; }
      catch(e){ blocked=String(e.message).split('\n')[0].slice(0,110); }
      await p.waitForTimeout(450);
      const after=await snap(p);
      const rec={screen:s,state:sid,id,clicked,blocked,
        changed: before.html!==after.html||before.url!==after.url,
        focus:after.ae, bad:after.bad, errs:p.__errs.slice(0),
        openedOverlay: !before.overlay&&after.overlay};
      if(rec.openedOverlay){
        await p.keyboard.press('Escape');await p.waitForTimeout(350);
        rec.escClosed=!(await p.evaluate(()=>!!document.querySelector('.sheet,.dialog,[role=dialog]')));
        rec.focusAfterEsc=await p.evaluate(()=>document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||''));
      }
      out.push(rec);
    }
  }
  await p.context().close();
  console.error('done '+s+' '+out.length);
}
fs.writeFileSync('agent-sweep3-clicks.json',JSON.stringify(out,null,1));
const f=x=>out.filter(x);
console.log('total',out.length);
console.log('ERRS',JSON.stringify(f(r=>r.errs.length).map(r=>[r.screen,r.state,r.id,r.errs]),null,1));
console.log('BADTEXT',JSON.stringify(f(r=>r.bad.length).map(r=>[r.screen,r.state,r.id,r.bad]),null,1));
console.log('BLOCKED',JSON.stringify(f(r=>r.blocked).map(r=>[r.screen,r.state,r.id,r.blocked]),null,1));
console.log('NOOP',JSON.stringify(f(r=>r.clicked&&!r.changed).map(r=>[r.screen,r.state,r.id]),null,1));
console.log('ESCNOOP',JSON.stringify(f(r=>r.escClosed===false).map(r=>[r.screen,r.state,r.id]),null,1));
console.log('FOCUSBODY',f(r=>r.clicked&&r.focus==='BODY#').length);
await b.close();
