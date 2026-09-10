/* Shopping + Budget: re-verify the write paths an earlier review found inert,
   counting rows rather than diffing markup. */
import { chromium } from '@playwright/test';
const F = 'file:///home/user/everything-claude-code/redesign/08-build/shopping.html';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

const counts = () => page.evaluate(() => ({
  listRows: document.querySelectorAll('[data-testid^="item-"]').length,
  histRows: document.querySelectorAll('[data-testid^="hist-row"],[data-testid^="purchase-"]').length,
  body: (document.getElementById('body') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 260)
}));

async function run(label, steps) {
  await page.goto(F);
  await page.waitForTimeout(400);
  for (const s of steps) {
    if (s.startsWith('fill:')) {
      const arg = s.slice(5); const cut = arg.lastIndexOf(']=');
      const sel = arg.slice(0, cut + 1), val = arg.slice(cut + 2);
      const ok = await page.evaluate(([sel, val]) => {
        const e = document.querySelector(sel); if (!e) return false;
        e.focus(); e.value = val; e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('change', { bubbles: true })); return true;
      }, [sel, val]);
      if (!ok) console.log('   MISSING fill ' + sel);
      await page.waitForTimeout(200);
      continue;
    }
    const ok = await page.evaluate(sel => {
      const els = Array.from(document.querySelectorAll(sel)).filter(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; });
      if (!els.length) return false; els[0].click(); return true;
    }, s);
    if (!ok) console.log('   MISSING ' + s);
    await page.waitForTimeout(400);
  }
  const c = await counts();
  const toast = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="toast"],.toast');
    return t && t.offsetParent !== null ? t.innerText.replace(/\s+/g, ' ').trim().slice(0, 80) : null;
  });
  console.log(`\n### ${label}\n   ${c.body}`);
  if (toast) console.log('   TOAST: ' + toast);
}

await run('baseline (list)', []);
await run('duplicate -> Make it 3 lb', ['fill:[data-testid="add-name"]=Chicken breast', '[data-testid="add-item"]', '[data-testid="merge-do"]']);
await run('duplicate -> Keep them separate', ['fill:[data-testid="add-name"]=Chicken breast', '[data-testid="add-item"]', '[data-testid="merge-sep"]']);
await run('budget: add a purchase', ['[data-testid="seg-budget"]', '[data-testid="add-purchase"]', 'fill:[data-testid="pur-item"]=Eggs', 'fill:[data-testid="pur-price"]=6.40', '[data-testid="save-purchase"]']);
await run('budget: history ranges', ['[data-testid="seg-budget"]', '[data-testid="hist-month"]']);
await run('budget: find cheaper swaps', ['[data-testid="seg-budget"]', '[data-testid="find-swaps"]']);
await run('budget: compare a price', ['[data-testid="seg-budget"]', 'fill:[data-testid="cmp-input"]=milk', '[data-testid="compare"]']);
await run('Shop at -> pick a store', ['[data-testid="shop-at"]', '[data-testid^="sa-"]']);
await run('item sheet -> search a shop', ['[data-testid="item-0"]', '[data-testid^="find-"]']);

console.log('\nall testids: ');
await page.goto(F); await page.waitForTimeout(400);
console.log((await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid]')).map(e => e.getAttribute('data-testid')).join(' '))).slice(0, 1500));
console.log('\nerrors:', errs);
await browser.close();
