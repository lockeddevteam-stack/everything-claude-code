// Verify NO-OP candidates on wired screens: re-click and check for ANY observable change
import { chromium } from 'playwright';
import fs from 'fs';
const D='file:///home/user/everything-claude-code/redesign/08-build/';
const DEVSEL='[data-testid="dev-toggle"], #dev-toggle, #devToggle';
const all=JSON.parse(fs.readFileSync('agent-bug-clicks.json','utf8'));
const noops=all.filter(o=>o.kind==='NO-OP');
const seen=new Set();const list=[];
for(const o of noops){const k=o.s+'|'+o.tid;if(seen.has(k))continue;seen.add(k);list.push(o);}
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
for(const o of list){
  await p.goto(D+o.s+'.html');await p.waitForTimeout(200);
  if(o.st){if(!(await p.locator('.dev__item').first().isVisible().catch(()=>false))){const t=p.locator(DEVSEL);if(await t.count()){await t.first().click().catch(()=>{});await p.waitForTimeout(110);}}
    await p.locator(`.dev__item[data-testid="${o.st}"]`).first().dispatchEvent('click').catch(()=>{});await p.waitForTimeout(300);
    if(await p.locator('.dev__item').first().isVisible().catch(()=>false)){const t=p.locator(DEVSEL);if(await t.count())await t.first().click().catch(()=>{});await p.waitForTimeout(90);}}
  const l=p.locator(`[data-testid="${o.tid}"]`).first();
  if(!await l.count()||!await l.isVisible().catch(()=>false)){continue;}
  const wired=await l.evaluate(e=>({act:e.getAttribute('data-action')||e.getAttribute('data-act')||null,dis:e.disabled,tag:e.tagName,
    href:e.getAttribute('href'),cls:(typeof e.className==='string'?e.className:'').slice(0,30)}));
  const h0=await p.evaluate(()=>{const h=document.body.innerHTML;let x=5381;for(let i=0;i<h.length;i++)x=((x*33)^h.charCodeAt(i))>>>0;return h.length+':'+x;});
  await l.click({timeout:2000}).catch(()=>{});
  await p.waitForTimeout(800);
  const h1=await p.evaluate(()=>{const h=document.body.innerHTML;let x=5381;for(let i=0;i<h.length;i++)x=((x*33)^h.charCodeAt(i))>>>0;return h.length+':'+x;});
  if(h0===h1) console.log('INERT',o.s,'|',o.st,'|',o.tid,'|',JSON.stringify(wired));
}
await b.close();
