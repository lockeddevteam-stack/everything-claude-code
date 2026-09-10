/* Targeted probe: click one selector inside the visible demo screen and report
   the route before/after. Usage: node agent-feat3-probe.mjs <hash> <selector> [selector2 ...] */
import { chromium } from '@playwright/test';
const DEMO = 'file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const [hash, ...sels] = process.argv.slice(2);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto(DEMO);
await page.waitForTimeout(300);
await page.evaluate(h => { location.hash = h; }, hash);
await page.waitForTimeout(300);

for (const sel of sels) {
  await page.goto(DEMO);
  await page.waitForTimeout(250);
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(300);
  const r = await page.evaluate((sel) => {
    const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    const root = host.shadowRoot;
    const els = Array.from(root.querySelectorAll(sel));
    const el = els[0];
    const before = { hash: location.hash, screen: host.getAttribute('data-screen'), html: root.innerHTML.length };
    if (!el) return { sel, found: false, before };
    const rect = el.getBoundingClientRect();
    el.click();
    return { sel, found: true, rect: { w: rect.width, h: rect.height, y: rect.y }, before, text: el.textContent.trim().slice(0, 50) };
  }, sel);
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => {
    const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    return { hash: location.hash, screen: host && host.getAttribute('data-screen'), html: host ? host.shadowRoot.innerHTML.length : 0 };
  });
  console.log(JSON.stringify({ ...r, after }, null, 1));
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(250);
}
console.log('errors', errs);
await browser.close();
