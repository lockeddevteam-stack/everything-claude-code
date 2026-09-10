import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await (await b.newContext({viewport:{width:402,height:874}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/split-builder.html');
await p.waitForTimeout(300);
for (let i=0;i<11;i++){
  if (await p.locator('.dev__item').count()===0) { await p.locator('[data-testid="dev-toggle"]').click(); await p.waitForTimeout(150); }
  const n = await p.locator('.dev__item').count();
  const sel = `.dev__item[data-testid="dev-preset-${i}"]`;
  console.log(i,'items',n,'target',await p.locator(sel).count());
  if (await p.locator(sel).count()===0) continue;
  await p.locator(sel).click(); await p.waitForTimeout(400);
  const r = await p.evaluate(()=>({t:document.body.innerText.slice(0,80).replace(/\n/g,'|'), ow:document.scrollingElement.scrollWidth>document.scrollingElement.clientWidth}));
  console.log('   ->',r.t, r.ow?'OVERFLOW':'');
}
await b.close();
