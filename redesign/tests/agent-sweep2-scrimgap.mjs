import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
await p.goto(D+'progress.html');await p.waitForTimeout(700);
const dump=async t=>console.log(t,await p.evaluate(()=>{const s=document.querySelector('.screen');
 return {scrollTop:s.scrollTop,scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,
  overflow:getComputedStyle(s).overflow,pos:getComputedStyle(s).position,
  tab:(()=>{const t=document.querySelector('.tabbar');return {min:t.getAttribute('data-minimized'),
    ot:t.offsetTop,oh:t.offsetHeight};})()};}));
await dump('before scroll:');
await p.evaluate(()=>{const tb=document.querySelector('.tabbar[data-minimize]');const sc=document.querySelector(tb.getAttribute('data-minimize'));
  sc.dispatchEvent(new WheelEvent('wheel',{deltaY:300,bubbles:true}));sc.scrollTop=300;sc.dispatchEvent(new Event('scroll'));});
await p.waitForTimeout(700);await dump('after minimize:');
await p.evaluate(()=>document.querySelector('[data-testid="choose-lift"]').click());await p.waitForTimeout(800);
await dump('after sheet open:');
console.log('scrim covers bottom?',await p.evaluate(()=>{const h=document.elementFromPoint(196,845);
  return {hit:h.dataset?.testid||h.className,clickPassesThrough:!h.closest('.scrim')};}));
// can a control underneath be clicked through the scrim?
console.log('tap-through target:',await p.evaluate(()=>{const h=document.elementFromPoint(196,845);
  const btn=h.closest('button');return btn?btn.dataset.testid||btn.textContent.trim().slice(0,30):'not a button';}));
await b.close();
