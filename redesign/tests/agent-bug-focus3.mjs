import { chromium } from 'playwright';
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:402,height:874}})).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/review.html');await p.waitForTimeout(500);
await p.evaluate(()=>{window.__n=document.querySelector('[data-testid="action-save"]');});
await p.locator('[data-testid="action-save"]').click();await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const n=document.querySelector('[data-testid="action-save"]');
 return {sameNode:n===window.__n, connectedOld:window.__n.isConnected, active:document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||''),
   label:n?n.innerText.trim():null, parentSame:n&&window.__n.parentElement===n.parentElement};}));
await b.close();
