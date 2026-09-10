/* Leaner no-op sweep: reload only when the previous click changed the DOM. */
import fs from 'fs';
import {browser,page,DIR,SCREENS,states,setState} from './agent-sweep3-lib.mjs';
const only=process.argv.slice(2);
const b=await browser();const L=console.log;
const out=[];
const snap=p=>p.evaluate(()=>({h:document.body.innerHTML,u:location.href,
  ae:document.activeElement?document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||''):'',
  ov:!!document.querySelector('.sheet,.dialog,[role=dialog]'),
  bad:(document.body.innerText.match(/\bNaN\b|\bundefined\b|\[object Object\]|\bInfinity\b/g)||[]).slice(0,3)}));
for(const s of SCREENS){
  if(only.length&&!only.includes(s))continue;
  const p=await page(b);
  await p.goto(DIR+s+'.html');await p.waitForTimeout(500);
  const st=await states(p);const list=st.length?st.map(x=>x.id):[null];
  for(const sid of list){
    await p.goto(DIR+s+'.html');await p.waitForTimeout(400);
    if(sid)await setState(p,sid);
    const ids=await p.evaluate(()=>[...document.querySelectorAll('[data-testid]')]
      .filter(e=>{const t=e.tagName;const r=e.getBoundingClientRect();
        if(!(t==='BUTTON'||t==='A'||e.getAttribute('role')==='button'))return false;
        if(/^dev/.test(e.dataset.testid))return false;
        return r.width>0&&r.height>0;}).map(e=>e.dataset.testid));
    let dirty=false;
    for(const id of ids){
      if(dirty){await p.goto(DIR+s+'.html');await p.waitForTimeout(350);if(sid)await setState(p,sid);dirty=false;}
      const present=await p.evaluate(x=>{const e=document.querySelector('[data-testid="'+x+'"]');
        return e&&e.getBoundingClientRect().width>0;},id);
      if(!present){await p.goto(DIR+s+'.html');await p.waitForTimeout(350);if(sid)await setState(p,sid);
        const p2=await p.evaluate(x=>!!document.querySelector('[data-testid="'+x+'"]'),id);
        if(!p2){out.push({screen:s,state:sid,id,skipped:'not in this state'});continue;}}
      p.__errs.length=0;
      const A=await snap(p);
      let clicked=false,blocked=null;
      try{await p.locator('[data-testid="'+id+'"]').first().click({timeout:2000});clicked=true;}
      catch(e){blocked=String(e.message).split('\n')[0].slice(0,90);}
      await p.waitForTimeout(380);
      const B=await snap(p);
      const changed=A.h!==B.h||A.u!==B.u;
      if(changed)dirty=true;
      const rec={screen:s,state:sid,id,clicked,blocked,changed,focus:B.ae,bad:B.bad,errs:p.__errs.slice(0),
        opened:!A.ov&&B.ov};
      if(rec.opened){
        await p.keyboard.press('Escape');await p.waitForTimeout(320);
        rec.esc=!(await p.evaluate(()=>!!document.querySelector('.sheet,.dialog,[role=dialog]')));
      }
      out.push(rec);
    }
  }
  await p.context().close();
  console.error('done '+s+' '+out.length);
}
fs.writeFileSync('agent-sweep3-noop.json',JSON.stringify(out,null,1));
const f=x=>out.filter(x);
L('total',out.length);
L('ERRS',JSON.stringify(f(r=>r.errs&&r.errs.length).map(r=>[r.screen,r.state,r.id,r.errs])));
L('BADTEXT',JSON.stringify(f(r=>r.bad&&r.bad.length).map(r=>[r.screen,r.state,r.id,r.bad])));
L('BLOCKED',JSON.stringify(f(r=>r.blocked).map(r=>[r.screen,r.state,r.id,r.blocked]),null,1));
L('NOOP',JSON.stringify(f(r=>r.clicked&&!r.changed).map(r=>[r.screen,r.state,r.id]),null,1));
L('ESC-NOOP',JSON.stringify(f(r=>r.esc===false).map(r=>[r.screen,r.state,r.id])));
L('FOCUS-BODY',JSON.stringify(f(r=>r.clicked&&r.focus==='BODY#').map(r=>[r.screen,r.state,r.id])));
await b.close();
