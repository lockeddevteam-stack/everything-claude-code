import { chromium } from 'playwright';
export const DEMO='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
export const BUILD='file:///home/user/everything-claude-code/redesign/08-build/';
export async function open(url,init){
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
  p.on('pageerror',e=>errs.push('PAGEERROR '+e.message+' | '+String(e.stack||'').split('\n')[1]));
  if(init) await p.addInitScript(init);
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1000);
  return {b,p,errs};
}
export const CYCLEON=()=>{try{localStorage.setItem('lk_cycle','true')}catch(e){}};
export const T=(s)=>s.replace(/\n+/g,' | ').replace(/\s+/g,' ').trim();
export const ids=async(p)=>(await p.$$eval('[data-testid]',ns=>ns.filter(n=>n.offsetParent!==null).map(n=>n.dataset.testid))).filter(x=>!/^mg-|trend|^tab-|^dev|^demo/.test(x));
export const vtext=async(p)=>{const v=await p.$$eval('[data-testid^="view-"]',ns=>ns.filter(n=>n.offsetParent!==null).map(n=>n.innerText));return T(v.join(' || '))};
