import {browser,page,DIR,states,setState} from './agent-sweep3-lib.mjs';
const b=await browser();const p=await page(b,320,852);const L=console.log;
const info=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;
  const r=e.getBoundingClientRect();
  let a=e.parentElement,scroller=null;
  while(a){const cs=getComputedStyle(a);
    if(/auto|scroll/.test(cs.overflowX)&&a.scrollWidth>a.clientWidth+1){scroller=(a.className||'').toString().slice(0,22)+' max='+(a.scrollWidth-a.clientWidth);break;}
    a=a.parentElement;}
  return {box:[Math.round(r.left),Math.round(r.right)],txt:e.innerText.replace(/\s+/g,' ').slice(0,40),hScroller:scroller};},sel);
const cases=[
 ['workout-log.html','Mid-session','[data-testid="partials-0-0"]'],
 ['workout-log.html','First set','[data-testid="btn-finish"]'],
 ['split-builder.html','dev-preset-6','.btn__label'],
 ['split-builder.html','dev-preset-8','.btn__label'],
 ['review.html','Populated','.delta--up'],
 ['review.html','New record','.delta--up'],
 ['shopping.html','Populated','[data-testid="seg-budget"]'],
];
for(const [f,st,sel] of cases){
  await p.goto(DIR+f);await p.waitForTimeout(600);
  const list=await states(p);
  const m=list.find(x=>x.id===st)||list.find(x=>x.label.indexOf(st)===0);
  if(m)await setState(p,m.id);
  await p.evaluate(()=>{document.documentElement.style.fontSize='32px';});
  await p.waitForTimeout(600);
  L(f,st,sel,JSON.stringify(await info(sel)));
}
L('\n--- onboarding sign-in invalid, whole card');
await p.goto(DIR+'onboarding.html');await p.waitForTimeout(700);
const l2=await states(p);
await setState(p,'dev-signin-invalid');
await p.evaluate(()=>{document.documentElement.style.fontSize='32px';});await p.waitForTimeout(700);
L(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>{
  const r=e.getBoundingClientRect();return r.width>0&&(r.right>321||r.left<-1);})
  .slice(0,6).map(e=>({c:(e.className||'').toString().slice(0,24),box:[Math.round(e.getBoundingClientRect().left),Math.round(e.getBoundingClientRect().right)],t:e.innerText?.replace(/\s+/g,' ').slice(0,40)})))));
L('device frame width:',await p.evaluate(()=>{const d=document.querySelector('.device-frame,.phone,.stage');return d?d.getBoundingClientRect().width:null;}));
L('ERRS',p.__errs);
await b.close();
