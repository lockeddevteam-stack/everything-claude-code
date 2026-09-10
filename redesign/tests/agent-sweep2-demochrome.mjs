import {chromium} from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:393,height:852}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C '+m.text().slice(0,160));});
const L=console.log;
const ROUTES=['home','train','fuel','coach','profile','home/progress','train/exercise-library','train/split-builder',
  'train/workout-log','train/review','fuel/shopping','profile/settings','home/onboarding'];
for(const r of ROUTES){
  await p.goto(U+'#/'+r);await p.waitForTimeout(1100);
  const id=r.split('/').pop();
  const res=await p.evaluate(sid=>{
    const h=document.querySelector(`[data-screen="${sid}"]`);
    if(!h)return {err:'no host'};
    const sr=h.shadowRoot;if(!sr)return {err:'no shadow'};
    const hr=h.getBoundingClientRect();
    const tb=sr.querySelector('.tabbar');
    const cur=tb?[...tb.querySelectorAll('.tabbar__item')].filter(i=>i.getAttribute('aria-current')==='page').map(i=>i.dataset.testid):null;
    const scSel=tb&&tb.getAttribute('data-minimize');
    const sc=scSel?sr.querySelector(scSel):(sr.querySelector('.body'));
    const hdr=sr.querySelector('.hdr');
    return {visible:hr.height>0,hostH:Math.round(hr.height),
      tabbar:tb?{r:(()=>{const q=tb.getBoundingClientRect();return {t:Math.round(q.top),b:Math.round(q.bottom),l:Math.round(q.left),rr:Math.round(q.right)};})(),
        current:cur,minSel:scSel}:null,
      scroller:sc?{sel:sc.id||sc.className,sh:sc.scrollHeight,ch:sc.clientHeight,pad:getComputedStyle(sc).paddingBottom}:null,
      hdrH:hdr?Math.round(hdr.getBoundingClientRect().height):null,
      largeTitle:hdr?hdr.getAttribute('data-large-title'):null};},id);
  L('##',r,JSON.stringify(res));
  if(res.scroller&&res.tabbar){
    const after=await p.evaluate(sid=>{const sr=document.querySelector(`[data-screen="${sid}"]`).shadowRoot;
      const tb=sr.querySelector('.tabbar');const sc=sr.querySelector(tb.getAttribute('data-minimize'));
      if(!sc)return 'no scroller';
      sc.dispatchEvent(new WheelEvent('wheel',{deltaY:300,bubbles:true}));
      sc.scrollTop=300;sc.dispatchEvent(new Event('scroll'));
      return 'scrolled';},id);
    await p.waitForTimeout(700);
    const st=await p.evaluate(sid=>{const sr=document.querySelector(`[data-screen="${sid}"]`).shadowRoot;
      const tb=sr.querySelector('.tabbar');const q=tb.getBoundingClientRect();const hdr=sr.querySelector('.hdr');
      return {min:tb.getAttribute('data-minimized'),t:Math.round(q.top),b:Math.round(q.bottom),
        hdrH:hdr?Math.round(hdr.getBoundingClientRect().height):null,collapsed:hdr?hdr.getAttribute('data-collapsed'):null};},id);
    L('   scroll',after,'->',JSON.stringify(st));
    // scroll back up
    await p.evaluate(sid=>{const sr=document.querySelector(`[data-screen="${sid}"]`).shadowRoot;
      const tb=sr.querySelector('.tabbar');const sc=sr.querySelector(tb.getAttribute('data-minimize'));
      sc.scrollTop=100;sc.dispatchEvent(new Event('scroll'));},id);
    await p.waitForTimeout(600);
    L('   back up ->',JSON.stringify(await p.evaluate(sid=>{const sr=document.querySelector(`[data-screen="${sid}"]`).shadowRoot;
      const tb=sr.querySelector('.tabbar');return tb.getAttribute('data-minimized');},id)));
  }
}
L('ERRS',JSON.stringify(errs.slice(0,10)));
await b.close();
