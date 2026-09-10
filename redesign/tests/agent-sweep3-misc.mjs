import {browser,page,DIR,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b);const L=console.log;
const box=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();
  const cs=getComputedStyle(e);
  return {t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right),
    op:cs.opacity,tr:cs.transform,pe:cs.pointerEvents,z:cs.zIndex};},sel);

L('=== 1. onboarding: the dev-open chip over the signup password reveal');
await p.goto(DIR+'onboarding.html');await p.waitForTimeout(700);
const st=await states(p);
const dup=st.find(s=>/duplicate|already registered/i.test(s.label));
L('state:',dup);
await setState(p,dup.id); await p.waitForTimeout(600);
L('dev-open box:',JSON.stringify(await box('[data-testid="dev-open"]')));
L('password reveal box:',JSON.stringify(await box('[data-testid="signup-password-reveal"]')));
L('hit test at its centre:',await p.evaluate(()=>{const e=document.querySelector('[data-testid="signup-password-reveal"]');
  const r=e.getBoundingClientRect();const h=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));
  return h?(h.dataset.testid||h.className):'none';}));
let clickErr=null;
try{await p.locator('[data-testid="signup-password-reveal"]').click({timeout:2500});}catch(e){clickErr=String(e.message).split('\n')[0];}
L('real click:',clickErr||'ok');
L('same at 320 and 430:');
for(const w of [320,430,393]){await p.setViewportSize({width:w,height:852});await p.waitForTimeout(400);
  L('  ',w,'devopen',JSON.stringify(await box('[data-testid="dev-open"]')),'reveal',JSON.stringify(await box('[data-testid="signup-password-reveal"]')));}
await p.setViewportSize({width:393,height:852});

L('\n=== 2. split-builder: the dev chip over ex-grip-x18');
await p.goto(DIR+'split-builder.html');await p.waitForTimeout(700);
const st2=await states(p); L(st2.map(x=>x.id+':'+x.label).slice(0,6));
await setState(p,'dev-preset-3');await p.waitForTimeout(600);
L('.dev box:',JSON.stringify(await box('.dev')));
L('dev toggle:',JSON.stringify(await box('#devToggle')));
L('ex-grip-x18:',JSON.stringify(await box('[data-testid="ex-grip-x18"]')));
L('hit:',await p.evaluate(()=>{const e=document.querySelector('[data-testid="ex-grip-x18"]');if(!e)return 'gone';
  const r=e.getBoundingClientRect();const h=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));
  return h?(h.dataset.testid||h.className||h.tagName):'none';}));
let ce2=null; try{await p.locator('[data-testid="ex-grip-x18"]').click({timeout:2500});}catch(e){ce2=String(e.message).split('\n')[0];}
L('real click:',ce2||'ok');

L('\n=== 3. workout-log error state: the toast over two buttons');
await p.goto(DIR+'workout-log.html');await p.waitForTimeout(700);
const st3=await states(p);
await setState(p,st3.find(s=>/error/i.test(s.label)).id);await p.waitForTimeout(600);
L('toast:',JSON.stringify(await box('.toast')),await p.evaluate(()=>document.querySelector('.toast')?.innerText.replace(/\s+/g,' ')));
L('btn-add-exercise:',JSON.stringify(await box('[data-testid="btn-add-exercise"]')));
L('btn-block:',JSON.stringify(await box('[data-testid="btn-block"]')));
let ce3=null;try{await p.locator('[data-testid="btn-add-exercise"]').click({timeout:2500});}catch(e){ce3=String(e.message).split('\n')[0];}
L('click add-exercise:',ce3||'ok');
await p.waitForTimeout(7000);
L('toast after 7s:',JSON.stringify(await box('.toast')));
L('ERRS',p.__errs);
await b.close();
