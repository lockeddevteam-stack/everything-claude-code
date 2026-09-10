/* Multi-step probes in the assembled demo. Each argument is a chain:
   "hash|sel1|sel2|..." — clicks each selector in order inside the visible
   shadow root, printing route + a marker of what changed at each step. */
import { chromium } from '@playwright/test';
const DEMO = 'file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';
const chains = process.argv.slice(2);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

for (const chain of chains) {
  const [hash, ...sels] = chain.split('|');
  await page.goto(DEMO);
  await page.waitForTimeout(250);
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(350);
  console.log('\n### ' + chain);
  for (const sel of sels) {
    const r = await page.evaluate(sel => {
      const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
      const root = host.shadowRoot;
      const el = root.querySelector(sel);
      const before = { hash: location.hash, screen: host.getAttribute('data-screen'), len: root.innerHTML.length };
      if (!el) return { sel, found: false, before };
      const rect = el.getBoundingClientRect();
      el.click();
      return { sel, found: true, text: el.textContent.trim().slice(0, 45), rect: [Math.round(rect.width), Math.round(rect.height)], before };
    }, sel);
    await page.waitForTimeout(350);
    const after = await page.evaluate(() => {
      const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
      const root = host.shadowRoot;
      const toast = root.querySelector('[data-testid="toast"],.toast');
      return { hash: location.hash, screen: host.getAttribute('data-screen'), len: root.innerHTML.length,
               toast: toast && toast.offsetParent !== null ? toast.textContent.trim().slice(0, 80) : null };
    });
    console.log(`  ${r.found ? 'click' : 'MISSING'} ${r.sel}  "${r.text || ''}"  ${r.before.screen}${r.before.hash} len${r.before.len} -> ${after.screen}${after.hash} len${after.len}${after.toast ? ' TOAST:' + after.toast : ''}`);
  }
}
console.log('\nerrors:', errs);
await browser.close();
