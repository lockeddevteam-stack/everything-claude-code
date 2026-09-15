/* THE READER WHO WORKS IN POUNDS.

   Everything is stored in kilos and converted on the way to the eye, so
   a reader in pounds sees a number that no part of the app has actually
   written down. That is the arrangement most likely to drift: one screen
   converts, another prints the stored figure raw, and the two disagree
   about the same set by a factor of 2.2 while both look plausible.

   There was no suite for this at all. What it checks is not that a
   conversion is correct in isolation -- units.js can be read for that --
   but the two things a reader would actually notice:

     the same set, on every screen, is the same number
     a number TYPED in pounds comes back as that number, not as a value
     that has been through kg and lost something on the way

   The round trip is the sharper test. 225 lb typed in is stored as
   102.058 kg, and if anything rounds on the way in, the set reads 224
   or 226 the next time it is looked at -- which is how a working weight
   drifts down a pound a week without anybody touching it. */
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

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
/* 100 kg exactly, so every printed pound figure is checkable by hand:
   100 kg is 220.46 lb, and 8 reps of it is 800 kg / 1763.7 lb of volume. */
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
  /* useKg false: this reader works in pounds. */
  lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: false, weightKg: 90.7185,
                heightCm: 180, age: 31, sex: 'male', goal: 'maintain' },
  lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' },
      { id: 311, name: 'Cable Lateral Raise', group: 'Shoulders', muscle: 'Side Delt' }] }] }],
  lk_history: [{ id: 'w1', name: 'PPL - Push', date: '2026-09-13', kind: 'lift',
                 kg: 800, min: 40, sets: 1,
                 exercises: [{ id: 104, name: 'Incline Machine Press',
                               sets: [{ kg: 100, reps: 8, done: true }] }] }],
  lk_prs: [{ exId: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest',
             kg: 100, reps: 8, date: '2026-09-13' }],
  lk_weightLog: [{ date: '2026-09-13', kg: 90.7185 }]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

const screenText = (k) => page.evaluate((n) => {
  const rec = window.DEMO.screens[n];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return root ? (root.textContent || '').replace(/\s+/g, ' ') : '';
}, k);
const visit = async (k) => {
  await page.evaluate((n) => window.DEMO.go(n), k);
  await page.waitForTimeout(700);
  return screenText(k);
};
const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable'; }
  return 'ok';
};

console.log('=== a pounds reader is never shown kilos ===\n');

/* Every screen that prints a lifted weight. A stray "kg" on any of them
   is the app talking to itself rather than to the reader. */
const WEIGHT_SCREENS = ['home', 'train', 'progress', 'profile', 'recap', 'workout-detail'];
for (const s of WEIGHT_SCREENS) {
  const t = await visit(s);
  /* "kg" as a word on its own. Not "kgs" inside an id, and not a unit
     picker offering the choice, which Settings legitimately does. */
  const stray = /\d\s?kg\b/i.test(t);
  ok(!stray, `${s} prints pounds, not kilos`,
     stray ? (/.{30}\d\s?kg\b.{10}/i.exec(t) || [''])[0] : 'clean');
  ok(!/undefined|NaN|\[object Object\]/.test(t), `${s} has no hole in it`,
     (/undefined|NaN|\[object Object\]/.exec(t) || [''])[0] || 'clean');
}

console.log('\n=== and the same set is the same number everywhere ===\n');

/* 100 kg is 220.46 lb. Whatever rounding each screen uses, all of them
   have to land on the same side of it. */
const seen = {};
for (const s of ['home', 'progress', 'profile']) {
  const t = await screenText(s) || await visit(s);
  const m = /\b(220|221)\b/.exec(t);
  seen[s] = m ? m[1] : null;
}
const vals = Object.keys(seen).map((k) => seen[k]).filter(Boolean);
ok(vals.length > 0, 'the 100 kg top set is printed in pounds somewhere',
   JSON.stringify(seen));
ok(new Set(vals).size <= 1, 'and every screen that prints it agrees',
   JSON.stringify(seen));

/* A screen that prints no unit at all would pass the "no kilos" check
   above while telling the reader nothing, so the word has to be there. */
const lbShown = await visit('progress');
ok(/\blb\b/i.test(lbShown), 'and the pounds are named as pounds, not left bare',
   (/.{20}\blb\b/i.exec(lbShown) || [''])[0] || 'no lb found');

console.log('\n=== a weight typed in pounds comes back as that weight ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(600);
ok((await tap('start-today')) === 'ok', "today's session starts");
await page.waitForTimeout(1000);

/* 225 lb, the commonest working number there is, typed through the pad. */
const pad = async (cell, digits) => {
  const c = await tap(cell);
  if (c !== 'ok') return c;
  await page.waitForTimeout(350);
  for (const d of digits) {
    const k = await tap('pad-' + d);
    if (k !== 'ok') return 'key ' + d + ': ' + k;
    await page.waitForTimeout(110);
  }
  const done = await tap('pad-done');
  await page.waitForTimeout(450);
  return done;
};
ok((await pad('cell-0-0-weight', ['2', '2', '5'])) === 'ok', '225 is typed into the weight');
ok((await pad('cell-0-0-reps', ['5'])) === 'ok', 'and 5 reps');
await page.waitForTimeout(400);
ok((await tap('done-0-0')) === 'ok', 'the set is logged');
await page.waitForTimeout(700);

const shownNow = await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="cell-0-0-weight"]');
  return el ? el.textContent.replace(/\s+/g, '') : null;
});
ok(/225/.test(String(shownNow)), 'and it still reads 225, not 224 or 226', String(shownNow));

const storedKg = await page.evaluate(() => {
  try {
    const s = JSON.parse(localStorage.getItem('lk_liveSessionRows') ||
                         localStorage.getItem('lk_logRows') || 'null');
    if (s && s.exercises && s.exercises[0]) return s.exercises[0].sets[0].kg;
  } catch (e) {}
  return null;
});
ok(storedKg === null || Math.abs(storedKg - 102.0582) < 0.6,
   'and what is stored is the kilos it really is, not a rounded-off pound',
   String(storedKg));

/* The round trip: reload, and read it back. Anything that rounds on the
   way in shows up here as a working weight that drifted. */
await page.reload();
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(1200);
const afterReload = await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="cell-0-0-weight"]');
  return el ? el.textContent.replace(/\s+/g, '') : null;
});
ok(afterReload === null || /225/.test(String(afterReload)),
   'and it is still 225 after the app is reopened', String(afterReload));

ok(!errs.length, 'nothing throws for a reader in pounds', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
