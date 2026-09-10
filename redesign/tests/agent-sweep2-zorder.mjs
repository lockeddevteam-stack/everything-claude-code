import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const L=console.log;
for(const [s,op] of [['fuel','chip-supps'],['progress','choose-lift'],['train','open-activities'],['workout-log','quick-action'],['shopping','clear-all']]){
  await p.goto(D+s+'.html');await p.waitForTimeout(600);
  // minimize the tab bar first
  await p.evaluate(()=>{const tb=document.querySelector('.tabbar[data-minimize]');if(!tb)return;
    const sc=document.querySelector(tb.getAttribute('data-minimize'));if(!sc)return;
    sc.dispatchEvent(new WheelEvent('wheel',{deltaY:300,bubbles:true}));sc.scrollTop=300;sc.dispatchEvent(new Event('scroll'));});
  await p.waitForTimeout(600);
  const pre=await p.evaluate(()=>{const tb=document.querySelector('.tabbar');return tb?{min:tb.getAttribute('data-minimized'),t:Math.round(tb.getBoundingClientRect().top)}:null;});
  await p.evaluate(t=>document.querySelector(`[data-testid="${t}"]`)?.click(),op);
  await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{const sh=document.querySelector('.sheet,.dialog');if(!sh)return 'no sheet';
    const q=sh.getBoundingClientRect();
    const tb=document.querySelector('.tabbar');const tr=tb&&tb.getBoundingClientRect();
    const cx=q.left+q.width/2;
    const probe=[q.top+8,(q.top+q.bottom)/2,q.bottom-8].map(y=>{const h=document.elementFromPoint(cx,Math.min(851,y));
      return h?(h.closest('[data-testid]')?.dataset.testid||h.className||h.tagName):'null';});
    const scrimTop=document.elementFromPoint(cx,10);
    return {sheet:sh.dataset.testid,box:{t:Math.round(q.top),b:Math.round(q.bottom)},
      tabbar:tr?{t:Math.round(tr.top),min:tb.getAttribute('data-minimized')}:null,
      probeAtSheet:probe, aboveSheet:scrimTop?(scrimTop.className||scrimTop.tagName):'null'};});
  L(s,op,'preTabbar',JSON.stringify(pre),'->',JSON.stringify(r));
  L('   esc:',await (async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(400);
    return !(await p.evaluate(()=>!!document.querySelector('.sheet,.dialog')));})(),
    ' tabbar after close:',await p.evaluate(()=>{const tb=document.querySelector('.tabbar');return tb?{min:tb.getAttribute('data-minimized'),t:Math.round(tb.getBoundingClientRect().top)}:null;}));
}
await b.close();
