import {browser,page,DIR} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);
const L=console.log;
const go=async()=>{await p.goto(DIR+'fuel.html');await p.waitForTimeout(450);};
const tap=async t=>{await p.evaluate(x=>document.querySelector('[data-testid="'+x+'"]')?.click(),t);await p.waitForTimeout(350);};
const totals=()=>p.evaluate(()=>{
  const g=t=>document.querySelector('[data-testid="'+t+'"]')?.textContent.trim();
  return {hero:g('hero-value'), meals:document.querySelectorAll('[data-action="meal"]').length,
    macros:[...document.querySelectorAll('.macro,[data-testid^="macro-"]')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).slice(0,6),
    body:document.body.innerText.replace(/\s+/g,' ').slice(0,400)};});

L('=== A. camera sheet: oil chips pressed state + arithmetic');
await go(); await tap('log-cam');
L('cam chips:',await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="cam-a"]')].map(e=>e.dataset.testid+' pressed='+e.getAttribute('aria-pressed')+' cls='+e.className)));
for(const c of ['cam-a1','cam-a2','cam-a3']){
  await tap(c);
  L(c,'->',await p.evaluate(()=>{const s=document.querySelector('.sheet');return {press:[...s.querySelectorAll('[data-testid^="cam-a"]')].map(e=>e.getAttribute('aria-pressed')), kcal:(s.innerText.match(/[\d,]+\s*kcal/g)||[]).slice(0,3)};}));
}
L('\n=== B. cam-log writes');
await go();
const t0=await totals(); L('before',t0.hero,'meals',t0.meals);
await tap('log-cam'); await tap('cam-a3'); await tap('cam-confirm');
const t1=await totals(); L('after A lot',t1.hero,'meals',t1.meals, 'toast:',await p.evaluate(()=>document.querySelector('[data-testid="toast"]')?.innerText));

L('\n=== C. stale undo: delete a meal, then log another thing, then press Undo');
await go();
L('meals',(await totals()).meals);
await tap('meal-0');
await tap('meal-delete');
L('after delete meals=',(await totals()).meals,'toast=',await p.evaluate(()=>document.querySelector('[data-testid="toast"]')?.innerText.replace(/\s+/g,' ')));
await tap('log-cam'); await tap('cam-confirm');
L('after camLog meals=',(await totals()).meals,'toast=',await p.evaluate(()=>document.querySelector('[data-testid="toast"]')?.innerText.replace(/\s+/g,' ')),
  '| undo button present=',await p.evaluate(()=>!!document.querySelector('[data-testid="undo"]')));
await tap('undo');
L('after Undo meals=',(await totals()).meals,'hero=',(await totals()).hero);

L('\n=== D. portion round trip');
await go();
const before=await p.evaluate(()=>{const m=document.querySelectorAll('[data-action="meal"]')[0];return m.innerText.replace(/\s+/g,' ');});
L('meal0 before',before,'hero',(await totals()).hero);
await tap('meal-0'); await tap('meal-edit');
L('after -25%',await p.evaluate(()=>document.querySelector('.sheet')?.innerText.replace(/\s+/g,' ').slice(0,160)),'hero',(await totals()).hero);
await tap('meal-swap');
L('after +25%',await p.evaluate(()=>document.querySelector('.sheet')?.innerText.replace(/\s+/g,' ').slice(0,160)),'hero',(await totals()).hero);

L('\n=== E. often rows');
await go(); await tap('open-meals');
L('sheet',await p.evaluate(()=>document.querySelector('.sheet')?.dataset.testid));
const oftenBefore=await totals();
await tap('often-0');
const oftenAfter=await totals();
L('meals',oftenBefore.meals,'->',oftenAfter.meals,'hero',oftenBefore.hero,'->',oftenAfter.hero,
  'toast',await p.evaluate(()=>document.querySelector('[data-testid="toast"]')?.innerText.replace(/\s+/g,' ')));
L('log same one twice:');
await tap('open-meals'); await tap('often-0');
L('meals now',(await totals()).meals,'hero',(await totals()).hero);

L('\n=== F. state leak: mutate then switch dev state and back');
await go(); await tap('meal-0'); await tap('meal-delete');
L('after delete meals',(await totals()).meals);
await p.evaluate(()=>{document.querySelector('[data-testid="dev-state-empty"]').click();});await p.waitForTimeout(300);
L('empty view body:',(await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').slice(0,200))));
await p.evaluate(()=>{document.querySelector('[data-testid="dev-state-populated"]').click();});await p.waitForTimeout(300);
L('back to populated meals',(await totals()).meals,'hero',(await totals()).hero);

L('\n=== G. camOil leak between sheets');
await go(); await tap('log-cam'); await tap('cam-a3');
await tap('log-mic'); // opens mic while cam open? use close first
L('after opening mic, sheet=',await p.evaluate(()=>document.querySelector('.sheet')?.dataset.testid));
await go(); await tap('log-cam'); await tap('cam-a3'); await tap('cam-confirm');
await tap('log-cam');
L('reopened cam, chips pressed=',await p.evaluate(()=>[...document.querySelectorAll('[data-testid^="cam-a"]')].map(e=>e.getAttribute('aria-pressed'))),
  'caption=',await p.evaluate(()=>document.querySelector('.sheet')?.innerText.replace(/\s+/g,' ').slice(0,200)));
L('\nERRS',p.__errs);
await b.close();
