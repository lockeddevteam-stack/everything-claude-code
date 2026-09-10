import {chromium} from 'playwright';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const L=console.log;
async function probe(tag){
  L(tag,await p.evaluate(()=>{
    const sh=document.querySelector('.sheet,.dialog');const tb=document.querySelector('.tabbar');
    const scr=document.querySelector('.screen');const sc=document.querySelector('.scrim');
    const g=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),rr:Math.round(r.right)};};
    const hits=[820,830,845].map(y=>{const h=document.elementFromPoint(196,y);return y+':'+(h?(h.dataset?.testid||h.className||h.tagName):'null');});
    return {sheet:sh?sh.dataset.testid:null,sheetBox:g(sh),sheetH:sh?sh.style.height:null,
      tabbar:g(tb),tabMin:tb?tb.getAttribute('data-minimized'):null,
      tabTransform:tb?getComputedStyle(tb).transform:null,tabOpacity:tb?getComputedStyle(tb).opacity:null,
      screen:g(scr),screenH:scr?Math.round(scr.getBoundingClientRect().height):null,
      scrim:g(sc),bottomStrip:hits};}));
}
L('=== progress: open lift sheet WITHOUT scrolling first');
await p.goto(D+'progress.html');await p.waitForTimeout(700);
await p.evaluate(()=>document.querySelector('[data-testid="choose-lift"]').click());await p.waitForTimeout(700);
await probe('  clean:');
L('\n=== progress: minimize the tab bar first, then open');
await p.goto(D+'progress.html');await p.waitForTimeout(700);
await p.evaluate(()=>{const tb=document.querySelector('.tabbar[data-minimize]');const sc=document.querySelector(tb.getAttribute('data-minimize'));
  sc.dispatchEvent(new WheelEvent('wheel',{deltaY:300,bubbles:true}));sc.scrollTop=300;sc.dispatchEvent(new Event('scroll'));});
await p.waitForTimeout(700);
await probe('  minimized before open:');
await p.evaluate(()=>document.querySelector('[data-testid="choose-lift"]').click());await p.waitForTimeout(800);
await probe('  after open:');
await p.screenshot({path:'/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/progress-minimized-sheet.png'});
L('\n=== train same');
await p.goto(D+'train.html');await p.waitForTimeout(700);
await p.evaluate(()=>{const tb=document.querySelector('.tabbar[data-minimize]');const sc=document.querySelector(tb.getAttribute('data-minimize'));
  sc.dispatchEvent(new WheelEvent('wheel',{deltaY:300,bubbles:true}));sc.scrollTop=300;sc.dispatchEvent(new Event('scroll'));});
await p.waitForTimeout(700);
await p.evaluate(()=>document.querySelector('[data-testid="open-activities"]').click());await p.waitForTimeout(800);
await probe('  train after open:');
await p.screenshot({path:'/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/train-minimized-sheet.png'});
await b.close();
