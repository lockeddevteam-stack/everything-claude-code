import {chromium} from 'playwright';
export const DIR='file:///home/user/everything-claude-code/redesign/08-build/';
export const DEMO='file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
export const SCREENS=['home','train','workout-log','exercise-library','split-builder','review','fuel','shopping','progress','coach','profile','settings','onboarding'];
export async function browser(){return chromium.launch();}
export async function page(b,w=393,h=852){
  const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2});
  const p=await c.newPage();
  p.__errs=[];
  p.on('pageerror',e=>p.__errs.push('PAGEERROR '+e.message));
  p.on('console',m=>{if(m.type()==='error')p.__errs.push('CONSOLE '+m.text().slice(0,200));});
  return p;
}
export async function states(p){
  return p.evaluate(()=>{
    const menu=document.getElementById('dev-menu');
    if(!menu)return [];
    const items=[...menu.querySelectorAll('.dev__item')];
    return items.map(e=>({id:e.dataset.testid,label:e.textContent.trim()}));
  });
}
export async function setState(p,id){
  await p.evaluate(t=>{
    const e=document.querySelector(`[data-testid="${t}"]`); if(e)e.click();
    const m=document.getElementById('dev-menu'); if(m)m.hidden=true;
    const tg=document.getElementById('dev-toggle'); if(tg)tg.setAttribute('aria-expanded','false');
  },id);
  await p.waitForTimeout(300);
}
