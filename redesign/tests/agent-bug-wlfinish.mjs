import { chromium } from 'playwright';
const U='file:///home/user/everything-claude-code/redesign/08-build/workout-log.html';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto(U);await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const ids=['btn-finish'];const o={};
 for(const t of ids){const e=document.querySelector(`[data-testid="${t}"]`);if(!e){o[t]='MISSING';continue;}
  const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  o[t]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
   top:top?top.tagName+'.'+(typeof top.className==='string'?top.className:'')+'#'+(top.dataset?.testid||''):null};}
 return o;});
console.log(JSON.stringify(r,null,1));
await b.close();
