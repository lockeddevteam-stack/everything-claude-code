import { chromium } from 'playwright';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/shopping.html');await p.waitForTimeout(500);
const segs=await p.$$eval('[data-action="panel"]',e=>e.map(x=>x.dataset.testid));
console.log('panels',segs);
for(const s of segs){ await p.locator(`[data-testid="${s}"]`).click().catch(()=>{}); await p.waitForTimeout(400);
  const ids=await p.$$eval('[data-testid]',e=>e.filter(x=>x.tagName==='BUTTON'&&x.offsetParent!==null).map(x=>x.dataset.testid));
  console.log(s,'->',ids.filter(i=>['compare','find-swaps','store-open','export'].includes(i)));}
for(const t of ['compare','find-swaps']){
  await p.goto('file:///home/user/everything-claude-code/redesign/08-build/shopping.html');await p.waitForTimeout(400);
  await p.locator('[data-testid="seg-budget"]').click().catch(()=>{});await p.waitForTimeout(400);
  const l=p.locator(`[data-testid="${t}"]`);
  if(!await l.count()){console.log(t,'not found in budget panel');continue;}
  const h0=await p.evaluate(()=>document.body.innerHTML.length+':'+document.body.innerHTML.slice(0,50000));
  await l.click();await p.waitForTimeout(700);
  const h1=await p.evaluate(()=>document.body.innerHTML.length+':'+document.body.innerHTML.slice(0,50000));
  console.log(t, h0===h1 ? 'INERT (no DOM change)':'changed');}
await b.close();
