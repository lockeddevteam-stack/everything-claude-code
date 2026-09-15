/* TRAINING WITH NO SIGNAL.

   Gyms are basements. The one place this app is used hardest is the one
   place a phone has no network, and the session that gets logged there
   is the whole product -- so the question is not whether sync is clever
   offline, it is whether a workout can be logged at all when every
   request fails.

   That is a different failure from a server answering badly. A dead
   network means fetch REJECTS: no status, no body, just a thrown
   promise. Anything that awaits one without catching stops there, and
   what stops is whatever the reader was doing.

   So the network is cut before the app is even opened, and then a full
   session is logged through it: start, weights, reps, ticks, finish,
   save, and a reload afterwards. Nothing here is about sync. It is
   about whether the work survives, which it must, because it was done. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP_FILE = path.join(ROOT, '10-final/locked-app.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  const p = new URL(q.url, 'http://127.0.0.1').pathname;
  if (p === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(await readFile(APP_FILE));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const APP = 'http://127.0.0.1:' + site.address().port + '/';

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
/* Configured for a backend, as a real phone is -- and then the backend
   is made unreachable, which is what a basement does. */
await ctx.addInitScript(() => {
  const cfg = { supabaseUrl: 'https://unreachable.invalid',
                supabaseKey: 'anon', apiUrl: 'https://unreachable.invalid' };
  Object.defineProperty(window, 'LK_CLOUD', {
    get: () => cfg, set: () => {}, configurable: false
  });
});
await ctx.addInitScript((d) => {
  try {
    if (localStorage.getItem('lk_seeded')) return;
    localStorage.setItem('lk_seeded', '1');
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
  } catch (e) {}
}, {
  lk_onboarded: 'true', lk_tutorialSeen: 'true',
  lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: true, weightKg: 82,
                heightCm: 180, age: 31, sex: 'male', goal: 'maintain' },
  lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' },
      { id: 311, name: 'Cable Lateral Raise', group: 'Shoulders', muscle: 'Side Delt' }] }] }]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
/* Everything except the page itself fails, the way it does underground. */
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.startsWith(APP)) return route.continue();
  return route.abort('internetdisconnected');
});

await page.goto(APP);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 12000 });
await page.waitForTimeout(1000);

const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 3000 }); } catch (e) { return 'unclickable'; }
  return 'ok';
};
const pad = async (cell, digits) => {
  const c = await tap(cell);
  if (c !== 'ok') return c;
  await page.waitForTimeout(350);
  for (const d of digits) {
    const k = await tap('pad-' + d);
    if (k !== 'ok') return 'key ' + d + ': ' + k;
    await page.waitForTimeout(110);
  }
  return tap('pad-done');
};
const raw = (k) => page.evaluate((key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}, k);
const shown = () => page.evaluate(() => {
  const s = window.DEMO.screens;
  return Object.keys(s).find((k) => {
    const h = s[k] && s[k].host; if (!h) return false;
    const b = h.getBoundingClientRect();
    return getComputedStyle(h).display !== 'none' && b.width > 0 && b.height > 0;
  }) || 'none';
});

console.log('=== the app opens underground ===\n');

ok((await shown()) !== 'none', 'it renders with every request failing', await shown());
ok(!errs.length, 'and nothing throws getting there', errs[0] || '');

console.log('\n=== and a session is logged through it ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(700);
ok((await tap('start-today')) === 'ok', "today's session starts with no network");
await page.waitForTimeout(1000);

ok((await pad('cell-0-0-weight', ['6', '0'])) === 'ok', 'a weight goes in');
await page.waitForTimeout(300);
ok((await pad('cell-0-0-reps', ['8'])) === 'ok', 'and the reps');
await page.waitForTimeout(300);
ok((await tap('done-0-0')) === 'ok', 'and the set ticks off');
await page.waitForTimeout(700);

const live = await raw('lk_liveSession');
ok(!!live && !!live.startedAt, 'the session is on the record', JSON.stringify(!!live));
ok(!errs.length, 'nothing throws logging a set offline', errs[0] || '');

console.log('\n=== it survives the app being reopened underground ===\n');

await page.reload();
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 12000 });
await page.waitForTimeout(1200);
const backSet = await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="cell-0-0-weight"]');
  return el ? el.textContent.replace(/\s+/g, '') : null;
});
ok(/60/.test(String(backSet)), 'the logged set is still there after a reload', String(backSet));
ok(!errs.length, 'and nothing throws coming back', errs[0] || '');

console.log('\n=== and it finishes and saves with no network ===\n');

ok((await tap('btn-finish')) === 'ok', 'the workout finishes');
await page.waitForTimeout(1300);
ok((await shown()) === 'review', 'review opens', await shown());
ok((await tap('action-save')) === 'ok', 'and Save is offered');
await page.waitForTimeout(1600);

const hist = await raw('lk_history');
ok(Array.isArray(hist) && hist.length === 1,
   'the workout is written to history with the network dead',
   (hist || []).length + ' sessions');
ok(hist && hist[0] && hist[0].kg === 480, 'with 60 x 8 = 480 kg on it',
   String(hist && hist[0] && hist[0].kg));
ok(!(await raw('lk_liveSession')), 'and nothing is left running');
ok(!errs.length, 'nothing throws saving offline', errs[0] || '');

console.log('\n=== every screen still opens down there ===\n');

for (const r of ['home', 'train', 'fuel', 'progress', 'profile', 'coach',
                 'recap', 'shopping', 'settings']) {
  await page.evaluate((k) => window.DEMO.go(k), r);
  await page.waitForTimeout(600);
  const t = await page.evaluate((k) => {
    const rec = window.DEMO.screens[k];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    return root ? (root.textContent || '').replace(/\s+/g, ' ') : '';
  }, r);
  ok(t.length > 40, `${r} renders offline`, t.length + ' chars');
  ok(!/undefined|NaN|\[object Object\]/.test(t), `${r} shows no hole offline`,
     (/undefined|NaN|\[object Object\]/.exec(t) || [''])[0] || 'clean');
}
ok(!errs.length, 'and nothing throws on any of them', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
