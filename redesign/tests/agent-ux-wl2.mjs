import { chromium } from 'playwright';
import { pathToFileURL } from 'url'; import path from 'path';
const BUILD='/home/user/everything-claude-code/redesign/08-build';
const S='/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br=await chromium.launch();
for(const th of ['dark','light']){
const p=await br.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
await p.addInitScript(t=>{try{localStorage.setItem('lk_theme',t)}catch(e){}},th);
await p.goto(pathToFileURL(path.join(BUILD,'workout-log.html')).href); await p.waitForTimeout(500);
await p.evaluate(()=>{document.querySelector('.dev__item[data-state="empty"]').click();});
await p.waitForTimeout(600);
await p.evaluate(()=>{const d=document.querySelector('[data-testid="dev-toggle"]'); if(d)d.style.display='none';});
await p.screenshot({path:`${S}/wl-empty-${th}.png`, clip:{x:0,y:0,width:393,height:200}});
const g=await p.evaluate(()=>{
  const o={};
  for(const id of ['session-name','session-timer','btn-finish','btn-discard','quick-action']){
    const e=document.querySelector(`[data-testid="${id}"]`); o[id]=e?e.getBoundingClientRect().toJSON():null;
  } return o;});
console.log(th, JSON.stringify(g));
await p.close();}
await br.close();
