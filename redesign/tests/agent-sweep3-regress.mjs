import {browser,page,DIR,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
L('=== R2#2 minimized tab bar + sheet: scrim gap / screen scroll');
for(const [f,opener] of [['progress.html','choose-lift'],['train.html','open-activities']]){
  await p.goto(DIR+f);await p.waitForTimeout(600);
  const s0=await p.evaluate(()=>{const s=document.querySelector('.screen');return [s.scrollTop,s.scrollHeight,s.clientHeight];});
  await p.mouse.move(196,400);await p.mouse.wheel(0,600);await p.waitForTimeout(700);
  const s1=await p.evaluate(()=>{const s=document.querySelector('.screen');return [s.scrollTop,s.scrollHeight,s.clientHeight,document.querySelector('.tabbar').getAttribute('data-minimized')];});
  await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]').click(),opener);
  await p.waitForTimeout(700);
  const s2=await p.evaluate(()=>{const s=document.querySelector('.screen');
    const sc=document.querySelector('.scrim'),sh=document.querySelector('.sheet');
    const r=x=>x?[Math.round(x.getBoundingClientRect().top),Math.round(x.getBoundingClientRect().bottom)]:null;
    const hit=document.elementFromPoint(196,846);
    return {screenScroll:s.scrollTop,scrim:r(sc),sheet:r(sh),hitBottom:hit?(hit.dataset.testid||hit.className.toString().slice(0,20)):null};});
  L(' ',f,'rest',JSON.stringify(s0),'minimized',JSON.stringify(s1),'sheet open',JSON.stringify(s2));
}
L('\n=== R2#3 exercise-library last row in Group: Chest');
await p.goto(DIR+'exercise-library.html');await p.waitForTimeout(600);
const st=await states(p);
await setState(p,st.find(x=>/Group: Chest/.test(x.label)).id);await p.waitForTimeout(600);
L(await p.evaluate(()=>{const b=document.querySelector('#body');b.scrollTop=b.scrollHeight;
  const rows=[...document.querySelectorAll('[data-testid^="row-ex-"]')];
  const last=rows[rows.length-1];
  const r=last.getBoundingClientRect();
  const hit=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));
  return {scroll:b.scrollTop+'/'+(b.scrollHeight-b.clientHeight),rows:rows.length,
    last:last.dataset.testid,box:[Math.round(r.top),Math.round(r.bottom)],
    hit:hit?(hit.dataset.testid||hit.className.toString().slice(0,20)):null};}));
let e=null;try{await p.locator('[data-testid="row-ex-900001"]').click({timeout:2500});}catch(x){e=String(x.message).split('\n')[0];}
L('  real click on row-ex-900001:',e||'ok');

L('\n=== R2#19 fuel chips at rest');
await p.goto(DIR+'fuel.html');await p.waitForTimeout(700);
L(await p.evaluate(()=>{const ids=['chip-trends','chip-water','chip-supps','chip-more'];
  const b=document.querySelector('#body');
  return {atRest:ids.map(i=>{const e=document.querySelector('[data-testid="'+i+'"]');if(!e)return i+':none';
    const r=e.getBoundingClientRect();const h=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));
    return i+':'+Math.round(r.top)+'-'+Math.round(r.bottom)+' hit='+(h?(h.dataset.testid||h.className.toString().slice(0,14)):'-');}),
   scrollMax:b.scrollHeight-b.clientHeight};}));
await p.evaluate(()=>{const b=document.querySelector('#body');b.scrollTop=b.scrollHeight;});await p.waitForTimeout(400);
L('  scrolled:',await p.evaluate(()=>['chip-trends','chip-more'].map(i=>{const e=document.querySelector('[data-testid="'+i+'"]');
  const r=e.getBoundingClientRect();const h=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));
  return i+':'+Math.round(r.top)+'-'+Math.round(r.bottom)+' hit='+(h?(h.dataset.testid||h.className.toString().slice(0,14)):'-');})));

L('\n=== R2#9 exercise-library sheet-days Escape');
await p.goto(DIR+'exercise-library.html');await p.waitForTimeout(600);
await setState(p,st.find(x=>/Detail: logged lift/.test(x.label)).id);await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelector('[data-testid="sheet-secondary"]').click());await p.waitForTimeout(500);
L('  sheet-days open:',await p.evaluate(()=>!!document.querySelector('[data-testid="sheet-days"]')));
await p.keyboard.press('Escape');await p.waitForTimeout(500);
L('  after Escape:',await p.evaluate(()=>({days:!!document.querySelector('[data-testid="sheet-days"]'),detail:!!document.querySelector('[data-testid="sheet-detail"]')})));

L('\n=== R2#14 back buttons standalone');
for(const f of ['settings.html','shopping.html']){
  await p.goto(DIR+f);await p.waitForTimeout(600);
  const u=p.url();
  await p.evaluate(()=>document.querySelector('[data-testid="back"]')?.click());await p.waitForTimeout(700);
  L('  ',f,'->',p.url().split('/').pop());
}
L('\n=== R2#18 workout-log tab bar minimize');
await p.goto(DIR+'workout-log.html');await p.waitForTimeout(600);
await p.mouse.move(196,400);await p.mouse.wheel(0,700);await p.waitForTimeout(700);
L('  ',await p.evaluate(()=>document.querySelector('.tabbar').getAttribute('data-minimized')));
L('ERRS',p.__errs);
await b.close();
