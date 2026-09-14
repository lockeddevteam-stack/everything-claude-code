/* THE PRODUCT BUILD, WHICH IS NOT THE DEMO.

   fixtures.js defines LKFixtures, and LKStore.get falls back to it for any
   key nobody has written. That is what makes the demo demonstrate
   anything. It is also what made the demo unshippable as the product: a
   real person signing up with an empty account was shown 22 sessions, 288
   sets, 140k kg of volume and a stranger's personal records as their own,
   because none of those keys were theirs.

   `node 10-final/assemble.mjs --prod` writes locked-app.html and app/
   without the seed and with the dev state switcher hidden. This is what
   guards that: the two product guarantees asserted directly, then every
   route opened on the two accounts that matter -- somebody brand new, and
   somebody arriving from the shipped app.

   It builds the product file itself rather than trusting whatever is on
   disk, because a stale artifact would pass this happily. */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { V6 } from './v6-accounts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

execFileSync('node', [path.join(ROOT, '10-final', 'assemble.mjs'), '--prod'], { stdio: 'ignore' });

const HOLES = /(undefined|NaN|\[object Object\]|Infinity|Invalid Date)/;
let fails = 0, checked = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const ACCOUNTS = [
  ['a new account', { lk_onboarded: 'true', lk_tutorialSeen: 'true',
                      lk_profile: { username: 'new', displayName: 'New', useKg: true } }],
  ['upgraded from the shipped app', Object.assign({ lk_onboarded: 'true' }, V6)]
];

const br = await chromium.launch();

for (const [who, data] of ACCOUNTS) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
  await ctx.addInitScript((d) => {
    try {
      Object.keys(d).forEach(function (k) {
        var v = d[k];
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });
    } catch (e) {}
  }, data);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + ROOT + '/10-final/locked-app.html');
  await p.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 8000 });
  await p.waitForTimeout(800);

  /* The two guarantees, asserted rather than assumed. */
  const guard = await p.evaluate(() => ({
    fixtures: !!window.LKFixtures,
    fromStore: (window.LKStore.get('lk_history', []) || []).length,
    ownRaw: localStorage.getItem('lk_history') ? 'written' : 'never written'
  }));
  ok(!guard.fixtures, `${who} — the product build ships no seed`,
     guard.fixtures ? 'LKFixtures is defined' : '');
  if (guard.ownRaw === 'never written') {
    ok(guard.fromStore === 0,
       `${who} — and shows nobody else's training`,
       guard.fromStore + ' sessions read for an account with none');
  }

  const devShown = await p.evaluate(() => {
    const rec = window.DEMO.screens.home;
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    const d = root && root.querySelector('[data-testid="dev-toggle"]');
    if (!d) return 'absent';
    return getComputedStyle(d).display === 'none' ? 'hidden' : 'visible';
  });
  ok(devShown !== 'visible', `${who} — the dev state switcher is not a product control`, devShown);

  const seen = (n) => p.evaluate((k) => {
    const rec = window.DEMO.screens[k];
    const host = rec && rec.host;
    const root = rec && (rec.root || (host && host.shadowRoot));
    const box = host && host.getBoundingClientRect ? host.getBoundingClientRect() : null;
    return {
      up: !!(box && getComputedStyle(host).display !== 'none' && box.width > 0 && box.height > 0),
      text: root ? (root.textContent || '').trim() : ''
    };
  }, n);

  for (const r of await p.evaluate(() => Object.keys(window.DEMO.screens))) {
    errs.length = 0;
    await p.evaluate((n) => window.DEMO.go(n), r);
    await p.waitForTimeout(230);
    let s = await seen(r);
    if (!s.up) {
      await p.evaluate((n) => window.DEMO.push(n), r);
      await p.waitForTimeout(230);
      s = await seen(r);
    }
    checked++;
    ok(s.up, `${who} · ${r} — the route opens`, s.up ? '' : 'never became visible');
    if (!s.up) continue;
    /* A check that read nothing must fail, not pass. */
    ok(s.text.length > 40, `${who} · ${r} — the screen rendered`, s.text.length + ' chars');
    ok(!errs.length, `${who} · ${r} — nothing throws`, errs[0] || '');
    const h = s.text.match(HOLES);
    ok(!h, `${who} · ${r} — prints no hole`, h ? `found "${h[0]}"` : '');
  }
  await ctx.close();
}

await br.close();
console.log('');
if (!checked) { console.log('nothing was checked — that is a failure, not a pass'); process.exit(1); }
console.log(`${checked} routes checked on the product build`);
if (fails) { console.log(`${fails} failed — this is what a real sign-up would see`); process.exit(1); }
console.log('the product build ships no seed, hides the dev switcher, and holds up new and upgraded');
