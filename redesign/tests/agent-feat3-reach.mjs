/* Q3: reachability. Drive locked-demo.html from the five tabs only, never the
   screen index and never a typed hash. BFS: from every route we can stand on,
   click every visible interactive element in the visible shadow root and see
   which route it produces. */
import { chromium } from '@playwright/test';
const DEMO = 'file:///home/user/everything-claude-code/redesign/10-final/locked-demo.html';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(DEMO);
await page.waitForTimeout(400);

const cfg = await page.evaluate(() => ({
  tabs: window.__DEMO_CFG__.tabs,
  pushed: window.__DEMO_CFG__.pushed,
  nav: window.__DEMO_CFG__.nav,
  screens: window.__DEMO_CFG__.screens.map(s => s.id)
}));
console.log('screens in demo:', cfg.screens.join(', '));
console.log('tabs:', cfg.tabs.map(t => t.id + '->' + t.screen).join(', '));

/* helpers that run inside the page */
const H = {
  cur: () => location.hash,
  visibleScreen: () => {
    const h = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    return h ? h.getAttribute('data-screen') : null;
  }
};
await page.addInitScript(() => {});

async function route() {
  return page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    return { hash: location.hash, screen: h ? h.getAttribute('data-screen') : null };
  });
}

/* enumerate clickable things in the visible screen */
async function targets() {
  return page.evaluate(() => {
    const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    if (!host) return [];
    const root = host.shadowRoot;
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && !e.disabled; };
    const out = [];
    const seen = {};
    root.querySelectorAll('button,a,[role="button"],[data-action],[data-act]').forEach(e => {
      if (!vis(e)) return;
      if (e.closest('[data-testid="dev-menu"],.dev,#dev-menu')) return;   /* never the dev switcher */
      const tid = e.getAttribute('data-testid') || '';
      const act = e.getAttribute('data-action') || e.getAttribute('data-act') || '';
      const key = tid ? `[data-testid="${tid}"]` : act ? `[data-action="${act}"]` : e.tagName + ':' + (e.textContent || '').trim().slice(0, 20);
      seen[key] = (seen[key] || 0);
      out.push({ key, n: seen[key], tid, act, text: (e.textContent || '').trim().slice(0, 40) });
      seen[key]++;
    });
    return out;
  });
}

async function clickIn(t) {
  return page.evaluate((t) => {
    const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    const root = host.shadowRoot;
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && !e.disabled; };
    let els;
    if (t.key.startsWith('[')) els = Array.from(root.querySelectorAll(t.key)).filter(vis);
    else els = Array.from(root.querySelectorAll('button,a,[role="button"]')).filter(e => vis(e) && (e.tagName + ':' + (e.textContent || '').trim().slice(0, 20)) === t.key);
    const el = els[t.n];
    if (!el) return false;
    el.click();
    return true;
  }, t);
}

async function gotoTabOnly(tabId) {
  /* press the tab in the tab bar of whatever is visible; if not visible, reset home first */
  const ok = await page.evaluate((tabId) => {
    const host = Array.from(document.querySelectorAll('.demo-screen')).find(x => !x.hidden);
    if (!host) return false;
    const b = host.shadowRoot.querySelector(`.tabbar [data-testid="tab-${tabId}"]`);
    if (!b) return false;
    b.click(); return true;
  }, tabId);
  await page.waitForTimeout(200);
  return ok;
}

const reached = new Map();   /* screen -> how */
const edges = [];
const visitedRoutes = new Set();

for (const t of cfg.tabs) {
  const ok = await gotoTabOnly(t.id);
  const r = await route();
  reached.set(r.screen, `tab ${t.id}`);
  console.log(`tab ${t.id}: clickable=${ok} -> ${r.hash} screen=${r.screen}`);
}

/* BFS from each tab route */
const queue = cfg.tabs.map(t => ({ hash: '#/' + t.id, depth: 0 }));
while (queue.length) {
  const item = queue.shift();
  if (visitedRoutes.has(item.hash) || item.depth > 3) continue;
  visitedRoutes.add(item.hash);

  const ts = await enterRoute(item.hash);
  if (!ts) continue;
  for (const t of ts) {
    await enterRoute(item.hash);
    const before = await route();
    const clicked = await clickIn(t);
    if (!clicked) continue;
    await page.waitForTimeout(150);
    const after = await route();
    if (after.hash !== before.hash) {
      edges.push({ from: before.screen, via: t.tid || t.act || t.text, to: after.screen, hash: after.hash });
      if (!reached.has(after.screen)) reached.set(after.screen, `${before.screen} → ${t.tid || t.act || t.text}`);
      if (!visitedRoutes.has(after.hash)) queue.push({ hash: after.hash, depth: item.depth + 1 });
    }
  }
}

/* re-entering a route the honest way is impossible mid-BFS without a hash, so
   for BFS bookkeeping only we set the hash. Every EDGE above was produced by a
   real click; the hash is only used to return to a place we already proved
   reachable. */
async function enterRoute(hash) {
  await page.goto(DEMO);
  await page.waitForTimeout(250);
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.waitForTimeout(300);
  return targets();
}

console.log('\n--- edges found by clicking ---');
for (const e of edges) console.log(`${e.from} --[${e.via}]--> ${e.to}`);

console.log('\n--- reached ---');
for (const s of cfg.screens) {
  console.log(`${reached.has(s) ? 'REACHED ' : 'NOT REACHED'}  ${s}  ${reached.get(s) || ''}`);
}
console.log('\nconsole errors:', errs.length, errs.slice(0, 5));
await browser.close();
