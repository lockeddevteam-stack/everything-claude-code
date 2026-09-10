import {chromium} from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,160));});
const L=console.log;
await p.goto(U);await p.waitForTimeout(1400);
L('--- home -> row-climbing-lift (configured to go to progress)');
L(await p.evaluate(()=>{const h=document.querySelector('[data-screen="home"]');const e=h.shadowRoot.querySelector('[data-testid="row-climbing-lift"]');
  if(!e)return 'element absent on home';e.click();return 'clicked';}));
await p.waitForTimeout(900);
L('hash',await p.evaluate(()=>location.hash),'visible',await p.evaluate(()=>[...document.querySelectorAll('[data-screen]')].filter(x=>x.getBoundingClientRect().height>0).map(x=>x.dataset.screen)));

L('\n--- demo index: progress entry');
await p.goto(U);await p.waitForTimeout(1400);
await p.locator('#demo-index-toggle').click();await p.waitForTimeout(700);
const entries=await p.evaluate(()=>[...document.querySelectorAll('.demo-index__screen')].map(e=>e.textContent.trim()));
L('index screens:',entries.join(' | '));
const ok=await p.evaluate(()=>{const e=[...document.querySelectorAll('.demo-index__screen')].find(x=>/progress/i.test(x.textContent));if(!e)return 'none';e.click();return 'clicked';});
L('progress index click:',ok);await p.waitForTimeout(1200);
L('hash',await p.evaluate(()=>location.hash),'visible',await p.evaluate(()=>[...document.querySelectorAll('[data-screen]')].filter(x=>x.getBoundingClientRect().height>0).map(x=>x.dataset.screen)));

L('\n--- body map in exercise-library (standalone vs demo)');
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/exercise-library.html');await p.waitForTimeout(1200);
L('standalone:',await p.evaluate(()=>{const e=document.querySelector('[data-testid="bodymap"]');
  if(!e)return 'absent';const r=e.getBoundingClientRect();
  return {tag:e.tagName,w:Math.round(r.width),h:Math.round(r.height),paths:e.querySelectorAll('path').length,svgs:e.querySelectorAll('svg').length,html:e.innerHTML.length};}));
await p.goto(U+'#/train/exercise-library');await p.waitForTimeout(1600);
L('in demo:',await p.evaluate(()=>{const h=document.querySelector('[data-screen="exercise-library"]');const sr=h.shadowRoot;
  const e=sr.querySelector('[data-testid="bodymap"]');if(!e)return 'absent';const r=e.getBoundingClientRect();
  return {w:Math.round(r.width),h:Math.round(r.height),paths:e.querySelectorAll('path').length,svgs:e.querySelectorAll('svg').length,html:e.innerHTML.length,hostVisible:h.getBoundingClientRect().height};}));
// try to reach the bodymap state
L('exlib dev states in demo:',await p.evaluate(()=>{const sr=document.querySelector('[data-screen="exercise-library"]').shadowRoot;
  return [...sr.querySelectorAll('.dev__item')].map(e=>e.dataset.testid+':'+e.textContent.trim()).join(', ');}));
L('ERR',JSON.stringify(errs.slice(0,10)));
await b.close();
