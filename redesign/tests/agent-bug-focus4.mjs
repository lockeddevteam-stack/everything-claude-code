import { chromium } from 'playwright';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/review.html');await p.waitForTimeout(500);
await p.locator('[data-testid="action-save"]').click();await p.waitForTimeout(400);
console.log('save', await p.evaluate(()=>{const n=document.querySelector('[data-testid="action-save"]');return{dis:n.disabled,aria:n.getAttribute('aria-disabled'),cls:n.className};}));
// ai-ask: node removed?
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/review.html');await p.waitForTimeout(500);
await p.locator('[data-testid="ai-ask"]').click();await p.waitForTimeout(1600);
console.log('ai after 1.6s', await p.evaluate(()=>({active:document.activeElement.tagName,has:!!document.querySelector('[data-testid="ai-ask"]'),txt:document.querySelector('[data-testid="card-ai"]')?.innerText.slice(0,80)})));
await b.close();
