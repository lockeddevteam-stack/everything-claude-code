/* Check every declared cross-screen nav edge in locked-demo.html: does the
   selector exist in the source screen, in its default state and after each of
   the screen's own dev states, and does clicking it actually change the route. */
import { chromium } from '@playwright/test';
const DEMO = 'file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
await page.goto(DEMO);
await page.waitForTimeout(400);
const cfg = await page.evaluate(() => ({ nav: window.__DEMO_CFG__.nav, pushed: window.__DEMO_CFG__.pushed }));

const routeOf = (id, cfgPushed) => cfgPushed[id] ? `#/${cfgPushed[id].parent}/${id}` : `#/${id}`;

async function open(hash) {
  await page.goto(DEMO);
  await page.waitForTimeout(250);
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(350);
}

async function devStates(id) {
  return page.evaluate(() => {
    const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    const root = host.shadowRoot;
    const t = root.querySelector('[data-testid="dev-toggle"],[data-testid="dev-open"]');
    if (t) t.click();
    const bs = Array.from(root.querySelectorAll('.dev__item,[data-testid^="dev-state-"],[data-testid^="dev-preset-"]'));
    return bs.map(b => b.getAttribute('data-testid') || b.textContent.trim());
  });
}

const rows = [];
for (const n of cfg.nav) {
  const hash = routeOf(n.from, cfg.pushed);
  await open(hash);
  const states = await devStates(n.from);
  let foundIn = [];
  /* default state */
  const check = async () => page.evaluate(sel => {
    const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    const el = host.shadowRoot.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { vis: r.width > 2 && r.height > 2, text: el.textContent.trim().slice(0, 30) };
  }, n.selector);

  await open(hash);
  let d = await check();
  if (d) foundIn.push('default');
  for (const st of states) {
    await open(hash);
    await page.evaluate(st => {
      const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
      const root = host.shadowRoot;
      const t = root.querySelector('[data-testid="dev-toggle"],[data-testid="dev-open"]');
      if (t) t.click();
      const b = root.querySelector(`[data-testid="${st}"]`) ||
        Array.from(root.querySelectorAll('.dev__item')).find(x => x.textContent.trim() === st);
      if (b) b.click();
    }, st);
    await page.waitForTimeout(250);
    const r = await check();
    if (r) foundIn.push(st);
  }

  /* actually click it wherever it was found first */
  let result = 'SELECTOR NEVER RENDERS';
  if (foundIn.length) {
    const where = foundIn[0];
    await open(hash);
    if (where !== 'default') {
      await page.evaluate(st => {
        const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
        const root = host.shadowRoot;
        const t = root.querySelector('[data-testid="dev-toggle"],[data-testid="dev-open"]');
        if (t) t.click();
        const b = root.querySelector(`[data-testid="${st}"]`) ||
          Array.from(root.querySelectorAll('.dev__item')).find(x => x.textContent.trim() === st);
        if (b) b.click();
      }, where);
      await page.waitForTimeout(250);
    }
    const before = await page.evaluate(() => location.hash);
    await page.evaluate(sel => {
      const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
      const el = host.shadowRoot.querySelector(sel);
      if (el) el.click();
    }, n.selector);
    await page.waitForTimeout(350);
    const after = await page.evaluate(() => location.hash);
    result = after === before ? `CLICK DID NOT NAVIGATE (stayed ${after})` : `ok -> ${after}`;
  }
  rows.push({ from: n.from, sel: n.selector, to: n.to, mode: n.mode, foundIn: foundIn.join(',') || '-', result });
  console.log(`${n.from} ${n.selector} -> ${n.to} [${n.mode}]  found:${foundIn.join(',') || 'NONE'}  ${result}`);
}
console.log('\n' + rows.filter(r => !r.result.startsWith('ok')).length + ' broken of ' + rows.length);
await browser.close();
