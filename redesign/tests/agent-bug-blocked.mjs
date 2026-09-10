import { chromium } from 'playwright';
import fs from 'fs';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const DEVSEL='[data-testid="dev-toggle"], #dev-toggle, #devToggle';
const all=JSON.parse(fs.readFileSync('agent-bug-clicks.json','utf8'));
const items=all.filter(o=>o.kind==='CLICK-BLOCKED');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:402,height:874}});const p=await ctx.newPage();
const seen=new Set();
for(const o of items){
  const k=o.s+'|'+o.tid; // dedupe across states but keep first state
  if(seen.has(k))continue;seen.add(k);
  await p.goto(D+o.s+'.html');await p.waitForTimeout(200);
  if(o.st){if(!(await p.locator('.dev__item').first().isVisible().catch(()=>false))){const t=p.locator(DEVSEL);if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(120);}}
    await p.locator(`.dev__item[data-testid="${o.st}"]`).first().dispatchEvent('click').catch(()=>{});await p.waitForTimeout(320);
    if(await p.locator('.dev__item').first().isVisible().catch(()=>false)){const t=p.locator(DEVSEL);if(await t.count())await t.first().click().catch(()=>{});await p.waitForTimeout(100);}}
  const r=await p.evaluate(t=>{const e=document.querySelector(`[data-testid="${t}"]`);if(!e)return{missing:true};
    const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
    const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return{dis:e.disabled||e.getAttribute('aria-disabled')==='true',pe:cs.pointerEvents,op:cs.opacity,
      y:Math.round(r.y),h:Math.round(r.height),vh:innerHeight,
      top:top?top.tagName+'.'+(typeof top.className==='string'?top.className.slice(0,30):'')+'#'+(top.dataset?.testid||''):'NULL(offscreen)',
      inside:top?(e.contains(top)||top===e):false};},o.tid);
  console.log(o.s,'|',o.st,'|',o.tid,'|',JSON.stringify(r));
}
await b.close();
