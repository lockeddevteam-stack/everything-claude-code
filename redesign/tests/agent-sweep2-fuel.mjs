import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,160));});
const L=console.log;
const open=async t=>{await p.goto(D+'fuel.html');await p.waitForTimeout(500);
  await p.evaluate(x=>document.querySelector(`[data-testid="${x}"]`)?.click(),t);await p.waitForTimeout(500);};
const sheet=()=>p.evaluate(()=>{const s=document.querySelector('.sheet');if(!s)return null;
  const r=s.getBoundingClientRect();const foot=s.querySelector('.sheet__foot .btn');const fr=foot&&foot.getBoundingClientRect();
  const body=s.querySelector('.sheet__body');
  return {tid:s.dataset.testid,h:s.style.height,t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),rr:Math.round(r.right),
    grabber:s.querySelector('.sheet__grab')?.getAttribute('data-grabber'),
    foot:foot?{tid:foot.dataset.testid,txt:foot.textContent.trim(),inView:fr.bottom<=innerHeight+1}:null,
    bodyScrolls:body?body.scrollHeight>body.clientHeight+1:null,
    cut:[...s.querySelectorAll('*')].filter(e=>{const q=e.getBoundingClientRect();return q.width>0&&(q.right>394||q.left<-1||q.bottom>853);})
      .map(e=>e.dataset?.testid||(e.className||'').toString().slice(0,24)).slice(0,5)};});
for(const t of ['chip-trends','chip-water','chip-supps','meal-0','log-mic','log-cam','open-meals','chip-more']){
  await open(t);
  const s=await sheet();
  L(t,'->',JSON.stringify(s));
  if(!s)continue;
  // Escape
  await p.keyboard.press('Escape');await p.waitForTimeout(400);
  const escOk=!(await p.evaluate(()=>!!document.querySelector('.sheet')));
  L('   esc:',escOk,'focus:',await p.evaluate(()=>document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||'')));
  // scrim
  await open(t);
  await p.evaluate(()=>{const sc=document.querySelector('.scrim');const r=sc.getBoundingClientRect();
    sc.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+5,clientY:r.top+5}));});
  await p.waitForTimeout(400);
  L('   scrim:',!(await p.evaluate(()=>!!document.querySelector('.sheet'))));
  // close button
  await open(t);
  const cb=await p.evaluate(()=>{const s=document.querySelector('.sheet');
    const e=[...s.querySelectorAll('button')].find(x=>/close|stop/i.test(x.getAttribute('aria-label')||''));return e?e.dataset.testid:null;});
  if(cb){await p.evaluate(x=>document.querySelector(`[data-testid="${x}"]`).click(),cb);await p.waitForTimeout(400);
    L('   closeBtn',cb,':',!(await p.evaluate(()=>!!document.querySelector('.sheet'))));}
  else L('   closeBtn: NONE');
}
L('\n--- cam chips do nothing?');
await open('log-cam');
const before=await p.evaluate(()=>document.querySelector('.sheet').outerHTML);
await p.evaluate(()=>document.querySelector('[data-testid="cam-a2"]')?.click());await p.waitForTimeout(400);
const after=await p.evaluate(()=>document.querySelector('.sheet')?.outerHTML||'gone');
L('cam-a2 changed anything:',before!==after,'| sheet still open:',after!=='gone');
L('cam-a1/2/3 attrs:',await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="cam-a"]')].map(e=>e.outerHTML.slice(0,90))));
L('\n--- mic-confirm "Log both"');
await open('log-mic');
const kcalBefore=await p.evaluate(()=>document.body.innerText.match(/[\d,]+\s*kcal/g)?.slice(0,3));
await p.evaluate(()=>document.querySelector('[data-testid="mic-confirm"]').click());await p.waitForTimeout(500);
L('kcal before',kcalBefore,'after',await p.evaluate(()=>document.body.innerText.match(/[\d,]+\s*kcal/g)?.slice(0,3)));
L('meal rows:',await p.evaluate(()=>document.querySelectorAll('[data-action="meal"]').length));
L('\n--- meal sheet delete');
await open('meal-0');
const mealsBefore=await p.evaluate(()=>document.querySelectorAll('[data-action="meal"]').length);
await p.evaluate(()=>document.querySelector('[data-testid="meal-delete"]').click());await p.waitForTimeout(500);
L('meals before',mealsBefore,'after',await p.evaluate(()=>document.querySelectorAll('[data-action="meal"]').length),
  '| confirmation shown:',await p.evaluate(()=>!!document.querySelector('.dialog')));
L('\n--- water add/sub arithmetic');
await open('chip-water');
for(let i=0;i<3;i++){await p.evaluate(()=>document.querySelector('[data-testid="water-add"]').click());await p.waitForTimeout(250);}
L('after +3:',await p.evaluate(()=>document.querySelector('[data-testid="water-value"]')?.textContent));
for(let i=0;i<20;i++){await p.evaluate(()=>document.querySelector('[data-testid="water-sub"]')?.click());await p.waitForTimeout(60);}
L('after -20:',await p.evaluate(()=>document.querySelector('[data-testid="water-value"]')?.textContent));
L('ERRS',JSON.stringify(errs));
await b.close();
