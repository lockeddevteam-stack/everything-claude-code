/* THE SHIPPING ARTIFACT, WITH THE SHIPPED APP'S DATA ON IT.

   v6-render.mjs opens the screens as separate files, which is how they
   are built and not how they are delivered. The demo is one document:
   every screen mounts once at boot into its own shadow root, and the
   hash router moves between them without reloading. A screen that reads
   its data at mount time and a screen that re-reads on entry behave
   differently there, and only there.

   So this stages the same five accounts read off the live project, opens
   the assembled demo, and walks every route. A route passes when nothing
   throws and the screen prints no hole. */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const DEMO = 'file://' + ROOT + '/10-final/locked-demo.html';

const { V6, ACCOUNTS } = await import('./v6-accounts.mjs');
const ALL = Object.assign({ 'the fullest account': V6 }, ACCOUNTS);

const HOLES = /(undefined|NaN|\[object Object\]|Infinity|Invalid Date)/;

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

console.log('=== the assembled demo, on the shipped app\'s data ===\n');

const br = await chromium.launch();

for (const [who, data] of Object.entries(ALL)) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
  await ctx.addInitScript((d) => {
    try {
      Object.keys(d).forEach(function (k) {
        var v = d[k];
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });
      /* Past setup and past the walkthrough: this is somebody who has
         been using the shipped app, not a new arrival. */
      localStorage.setItem('lk_onboarded', 'true');
      localStorage.setItem('lk_tutorialSeen', 'true');
    } catch (e) {}
  }, data);

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(DEMO);
  await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 8000 });
  await page.waitForTimeout(600);

  ok(!errs.length, `${who} — the demo boots`, errs.slice(0, 2).join(' | '));

  const routes = await page.evaluate(() => Object.keys(window.DEMO.screens));
  for (const r of routes) {
    errs.length = 0;
    /* A tab is reached with go() and a pushed screen with push(); the
       demo does not say which is which, so this asks for the screen and
       checks it actually came up rather than assuming either. */
    await page.evaluate((name) => { window.DEMO.go(name); }, r);
    await page.waitForTimeout(260);
    /* DEMO.screens[name] is a RECORD -- { host, root, globals } -- not the
       element. Reading it as one made offsetParent undefined, which is
       not null, so every route "opened"; and its textContent was
       undefined, so every route printed no hole. The whole sweep passed
       without looking at anything. It asks the host and the shadow root
       by name now. */
    const isUp = (name) => page.evaluate((n) => {
      const rec = window.DEMO.screens[n];
      const host = rec && rec.host;
      if (!host || !host.getBoundingClientRect) return false;
      const box = host.getBoundingClientRect();
      return getComputedStyle(host).display !== 'none' && box.width > 0 && box.height > 0;
    }, name);

    let up = await isUp(r);
    if (!up) {
      await page.evaluate((name) => { window.DEMO.push(name); }, r);
      await page.waitForTimeout(260);
      up = await isUp(r);
    }
    ok(up, `${who} · ${r} — the route opens`, up ? '' : 'never became visible');
    if (!up) continue;
    const text = await page.evaluate((name) => {
      const rec = window.DEMO.screens[name];
      const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
      return root ? (root.textContent || '').trim() : '';
    }, r);
    ok(!errs.length, `${who} · ${r} — nothing throws`, errs[0] || '');
    const h = text.match(HOLES);
    ok(!h, `${who} · ${r} — prints no hole`, h ? `found "${h[0]}"` : '');
  }
  await ctx.close();
}

await br.close();
console.log('');
if (fails) {
  console.log(`${fails} checks failed — the delivered build does this`);
  process.exit(1);
}
console.log('every route in the assembled demo holds up on every live account shape');
