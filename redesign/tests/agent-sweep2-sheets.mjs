import {chromium} from 'playwright';
import {D,SCREENS,hook,listStates} from './agent-sweep2-lib.mjs';
const b=await chromium.launch();const out=[];
const ONLY=process.argv[2];
const overlayInfo=()=>{
  const sh=document.querySelector('.sheet,.dialog');
  if(!sh)return null;
  const r=sh.getBoundingClientRect();
  const foot=sh.querySelector('.sheet__foot .btn, .dialog__foot .btn, .sheet__foot button');
  const fr=foot?foot.getBoundingClientRect():null;
  const body=sh.querySelector('.sheet__body');
  const cut=[];
  sh.querySelectorAll('*').forEach(el=>{const q=el.getBoundingClientRect();if(q.width>0&&(q.right>innerWidth+1||q.left<-1||q.bottom>innerHeight+1))cut.push({sel:el.dataset?.testid||el.className,t:Math.round(q.top),b:Math.round(q.bottom),l:Math.round(q.left),r:Math.round(q.right)});});
  return {tid:sh.dataset.testid||sh.className,kind:sh.classList.contains('dialog')?'dialog':'sheet',
    r:{t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right)},
    h:sh.style.height||'', detents:sh.getAttribute('data-detents')||'',
    grab:!!sh.querySelector('.sheet__grab'), grabber:sh.querySelector('.sheet__grab')?.getAttribute('data-grabber')||'',
    scrim:!!document.querySelector('.scrim'),
    closeBtn:[...sh.querySelectorAll('button')].filter(x=>/close|cancel|dismiss/i.test((x.getAttribute('aria-label')||'')+' '+(x.dataset.testid||''))).map(x=>x.dataset.testid||x.getAttribute('aria-label'))[0]||null,
    foot: foot?{tid:foot.dataset.testid,txt:foot.textContent.trim().slice(0,30),t:Math.round(fr.top),b:Math.round(fr.bottom),inView:fr.bottom<=innerHeight+1&&fr.top>=0}:null,
    bodyScroll: body?{sh:body.scrollHeight,ch:body.clientHeight}:null,
    cut:cut.slice(0,8)};
};
for(const s of SCREENS){
  if(ONLY&&s!==ONLY)continue;
  const ctx=await b.newContext({viewport:{width:393,height:852}});
  const p=await ctx.newPage();const bag=[];hook(p,bag);
  await p.goto(D+s+'.html');await p.waitForTimeout(350);
  await p.evaluate(()=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;});
  let states=await listStates(p); if(!states.length)states=['(none)'];
  for(const st of states){
    const setSt=async()=>{await p.goto(D+s+'.html');await p.waitForTimeout(300);
      if(st!=='(none)')await p.evaluate(t=>{const m=document.getElementById('dev-menu');if(m)m.hidden=false;document.querySelector(`[data-testid="${t}"]`)?.click();},t=st);
      await p.waitForTimeout(300);};
    await setSt();
    const cands=await p.evaluate(()=>[...document.querySelectorAll('.screen [data-testid]')].filter(e=>{
      if(e.closest('#dev-menu')||e.id==='dev-toggle')return false;
      const t=e.tagName; if(t!=='BUTTON'&&t!=='A'&&e.getAttribute('role')!=='button')return false;
      const r=e.getBoundingClientRect(); return r.width>2&&r.height>2;}).map(e=>e.dataset.testid));
    for(const c of cands){
      await setSt();
      const before=await p.evaluate(()=>!!document.querySelector('.sheet,.dialog'));
      if(before)continue;
      await p.evaluate(t=>{document.querySelector(`[data-testid="${t}"]`)?.scrollIntoView({block:'center'});},c);
      await p.waitForTimeout(120);
      const err0=bag.length;
      await p.locator(`[data-testid="${c}"]`).click({timeout:1500,force:true}).catch(()=>{});
      await p.waitForTimeout(450);
      const info=await p.evaluate(overlayInfo);
      if(!info){continue;}
      const rec={screen:s,state:st,opener:c,...info,close:{}};
      // Escape
      await p.keyboard.press('Escape');await p.waitForTimeout(350);
      rec.close.esc=!(await p.evaluate(()=>!!document.querySelector('.sheet,.dialog')));
      if(!rec.close.esc){await p.keyboard.press('Escape');await p.waitForTimeout(200);}
      // reopen for scrim
      await setSt();await p.locator(`[data-testid="${c}"]`).click({timeout:1500,force:true}).catch(()=>{});await p.waitForTimeout(400);
      if(await p.evaluate(()=>!!document.querySelector('.scrim'))){
        await p.evaluate(()=>{const sc=document.querySelector('.scrim');const r=sc.getBoundingClientRect();sc.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+5,clientY:r.top+5}));});
        await p.waitForTimeout(350);
        rec.close.scrim=!(await p.evaluate(()=>!!document.querySelector('.sheet,.dialog')));
      } else rec.close.scrim='no-scrim';
      // reopen for close button
      await setSt();await p.locator(`[data-testid="${c}"]`).click({timeout:1500,force:true}).catch(()=>{});await p.waitForTimeout(400);
      if(info.closeBtn){await p.locator(`[data-testid="${info.closeBtn}"]`).click({timeout:1500,force:true}).catch(()=>{});await p.waitForTimeout(350);
        rec.close.btn=!(await p.evaluate(()=>!!document.querySelector('.sheet,.dialog')));}
      else rec.close.btn='none';
      rec.errs=bag.slice(err0);
      out.push(rec);
    }
  }
  await ctx.close();
}
console.log(JSON.stringify(out));
