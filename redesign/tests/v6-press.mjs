/* PRESSING THINGS, AS SOMEBODY WHO CAME FROM THE SHIPPED APP.

   v6-render.mjs asks whether the screens render this data and v6-demo.mjs
   asks whether every route opens on it. Neither touches anything. A screen
   can render somebody's history perfectly and then throw the moment they
   open a session in it, because the handler reads a field the list did not
   need.

   So this presses one control for every distinct data-action on every
   screen, with each live account's storage on the device and no fixture
   anywhere, and reports anything that throws. It does not ask whether the
   control did something -- action-coverage.mjs already does that against
   the seed, and the answer does not change with the data. It asks whether
   pressing it on real data is safe.

   A hole appearing after a press is also a failure: a sheet that opens
   reading "undefined" is how the migrated shapes announce a field nobody
   mapped. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { V6, ACCOUNTS } from './v6-accounts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');
const PORT = 8143;

const files = fs.readdirSync(BUILD).filter((f) => f.endsWith('.html') && !/^mockup-/.test(f)).sort();
const ALL = Object.assign({ 'the fullest account': V6 }, ACCOUNTS);

const srv = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: path.join(HERE, '..'), stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));

const HOLES = /(undefined|NaN|\[object Object\]|Infinity|Invalid Date)/;

let fails = 0, pressed = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  if (!pass) console.log('FAIL ' + name + (detail ? ' — ' + detail : ''));
};

console.log('=== pressing every control, on the shipped app\'s data ===\n');

const br = await chromium.launch();

for (const [who, data] of Object.entries(ALL)) {
  for (const file of files) {
    const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
    /* SEEDED ONCE, NOT ON EVERY NAVIGATION. addInitScript runs on every
       document this context loads, and a press here is often a crossing
       to another screen. Re-writing the shipped app's raw storage on the
       way in put the unmigrated shapes back underneath a schema marker
       that already said "converted", so the destination rendered raw
       dates and this sweep reported seven defects that were its own.
       The guard key is the harness's, not the app's. */
    await ctx.addInitScript((d) => {
      try {
        if (localStorage.getItem('__staged__')) return;
        Object.keys(d).forEach(function (k) {
          var v = d[k];
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        });
        localStorage.setItem('lk_onboarded', 'true');
        localStorage.setItem('__staged__', '1');
      } catch (e) {}
    }, data);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.route('**/fixtures.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await p.goto(`http://localhost:${PORT}/08-build/${file}`);
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 3000 }).catch(() => {});
    await p.waitForTimeout(450);

    /* One element per distinct action, skipping the dev switcher and the
       controls that are meant to do nothing. */
    const acts = await p.evaluate(() => {
      const seen = new Set(), out = [];
      document.querySelectorAll('[data-action], [data-act]').forEach((el) => {
        const a = el.dataset.action || el.dataset.act;
        if (!a || seen.has(a)) return;
        if (el.closest('.dev')) return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
        const r = el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) return;
        seen.add(a); out.push(a);
      });
      return out;
    });

    for (const a of acts) {
      errs.length = 0;
      const did = await p.evaluate((act) => {
        const el = document.querySelector(`[data-action="${act}"], [data-act="${act}"]`);
        if (!el) return false;
        try { el.click(); } catch (e) { return 'threw: ' + e.message; }
        return true;
      }, a);
      if (did === false) continue;
      pressed++;
      await p.waitForTimeout(170);
      ok(did === true && !errs.length, `${who} · ${file} · ${a} — pressing it throws nothing`,
         (typeof did === 'string' ? did : errs[0]) || '');
      const text = await p.evaluate(() => (document.body.innerText || '').replace(/STATE[\s\S]*$/i, ''));
      const h = text.match(HOLES);
      ok(!h, `${who} · ${file} · ${a} — leaves no hole on screen`, h ? `found "${h[0]}"` : '');
      /* Back to a known state: a press can open a sheet that swallows the
         next one, and that would hide the rest rather than test them. */
      await p.keyboard.press('Escape').catch(() => {});
      await p.waitForTimeout(80);
    }
    await ctx.close();
  }
}

await br.close();
srv.kill();

console.log('');
console.log(`${pressed} presses across ${Object.keys(ALL).length} accounts x ${files.length} screens`);
if (fails) {
  console.log(`${fails} failed — an upgrading reader does this by tapping`);
  process.exit(1);
}
console.log('every control is safe to press on the data the shipped app left behind');
