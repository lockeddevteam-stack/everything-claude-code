import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const L=console.log;
async function run(fs){
  const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(D+'workout-log.html');await p.waitForTimeout(700);
  if(fs)await p.evaluate(f=>{document.documentElement.style.fontSize=f;},fs);
  await p.waitForTimeout(300);
  L('\n### fontSize',fs||'default');
  await p.evaluate(()=>document.querySelector('[data-testid="btn-discard"]').click());await p.waitForTimeout(600);
  L('discard dialog:',await p.evaluate(()=>{const d=document.querySelector('.dialog');if(!d)return 'none';
    const r=d.getBoundingClientRect();
    return {dlg:{t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),rr:Math.round(r.right)},
      buttons:[...d.querySelectorAll('button')].map(x=>{const q=x.getBoundingClientRect();
        const hit=document.elementFromPoint(Math.min(392,q.left+q.width/2),q.top+q.height/2);
        return {tid:x.dataset.testid,txt:x.textContent.trim(),l:Math.round(q.left),rr:Math.round(q.right),
          offscreen:q.right>393.5,outsideDialog:q.right>r.right+1,
          clipped:x.scrollWidth>x.clientWidth+1,
          reachable:!!(hit&&x.contains(hit))};})};}));
  await p.keyboard.press('Escape');await p.waitForTimeout(400);
  // block sheet, clean
  await p.goto(D+'workout-log.html');await p.waitForTimeout(700);
  if(fs)await p.evaluate(f=>{document.documentElement.style.fontSize=f;},fs);await p.waitForTimeout(300);
  const has=await p.evaluate(()=>!!document.querySelector('[data-testid="btn-block"]'));
  if(has){await p.evaluate(()=>document.querySelector('[data-testid="btn-block"]').click());await p.waitForTimeout(700);
    L('block sheet foot:',await p.evaluate(()=>{const s=document.querySelector('.sheet');if(!s)return 'none';
      const f=s.querySelector('.sheet__foot .btn, .sheet__foot button');if(!f)return 'no foot';
      const q=f.getBoundingClientRect();const hit=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);
      return {tid:f.dataset.testid,txt:f.textContent.trim(),t:Math.round(q.top),bo:Math.round(q.bottom),
        inView:q.bottom<=innerHeight+1,blockedBy:hit&&!f.contains(hit)?(hit.dataset?.testid||hit.className):null,
        toastPresent:!!document.querySelector('.toast')};}));}
  else L('btn-block absent');
  L('ERRS',JSON.stringify(errs));
  await p.close();
}
await run('');await run('32px');
await b.close();
