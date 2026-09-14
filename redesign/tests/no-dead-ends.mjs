/* NO SCREEN YOU CAN ENTER AND NOT LEAVE.

   Nine screens draw no tab bar -- cycle, onboarding, recap, review,
   settings, split-builder, stack, tutorial and workout-detail. They are
   pushed screens, reached from somewhere else, and the only way out of
   any of them is one of their own controls. That makes a control which
   raises a toast instead of navigating not a cosmetic miss but a trap.

   It has already happened twice. Discarding a workout left the reader on
   an emptied log, and finishing from there opened Review, where the back
   button, "Back to workout" and the discard confirm each called toast()
   and paint() and went nowhere -- no tabs, no exits, reported from a
   phone. The onboarding gate looped a fresh install forever for the same
   family of reason: a crossing the router did not carry.

   So this presses the way out of every one of them and checks the screen
   actually changes. It does not care WHICH control works, only that one
   does -- a screen with three exits needs one of them to be real. */
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

const TODAY = new Date().toISOString().slice(0, 10);
/* A real account: a reader with a split, some history and a record, which
   is the state most of these screens are reached from. */
const ACCOUNT = {
  lk_onboarded: JSON.stringify({ at: TODAY, answers: { name: 'Cesco' } }),
  lk_tutorialSeen: 'true',
  lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: true, weightKg: 57.2,
                heightCm: 170, age: 31, sex: 'male', goal: 'maintain' },
  lk_splits: [{ id: 's1', name: 'PPL', created: '9/7/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' },
      { id: 311, name: 'Cable Lateral Raise', group: 'Shoulders', muscle: 'Side Delt' }] },
    { name: 'Pull', blocks: [], exercises: [
      { id: 106, name: 'Lat Pulldown', group: 'Back', muscle: 'Lats' }] }] }],
  lk_history: [{ id: 'w1', name: 'PPL - Push', date: '2026-09-07', kind: 'lift', kg: 3608,
                 min: 39, sets: 12, exercises: [{ id: 104, name: 'Incline Machine Press',
                 sets: [{ kg: 60, reps: 8, done: true }] }] }],
  lk_prs: [{ exId: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest',
             kg: 60, reps: 8, date: '2026-09-07' }],
  lk_weightLog: [['2026-09-01', 57.0], ['2026-09-08', 57.2]]
};

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript((d) => {
  try {
    if (localStorage.getItem('lk_seeded')) return;
    localStorage.setItem('lk_seeded', '1');
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
  } catch (e) {}
}, ACCOUNT);

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(APP);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 9000 });
await page.waitForTimeout(900);

const shown = () => page.evaluate(() => {
  const s = window.DEMO.screens;
  return Object.keys(s).find((k) => {
    const h = s[k] && s[k].host; if (!h || !h.getBoundingClientRect) return false;
    const b = h.getBoundingClientRect();
    return getComputedStyle(h).display !== 'none' && b.width > 0 && b.height > 0;
  }) || 'none';
});

/* Every control on the screen that reads like a way out. Deliberately
   generous: a screen is allowed to call its exit whatever it likes, and
   the point is whether ANY of them leaves. */
const exitsOn = (id) => page.evaluate((k) => {
  const rec = window.DEMO.screens[k];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  if (!root) return [];
  return Array.from(root.querySelectorAll('[data-testid]'))
    .filter((e) => {
      const b = e.getBoundingClientRect();
      if (!(b.width > 0 && b.height > 0)) return false;
      const t = e.dataset.testid;
      return /back|done|close|cancel|exit|finish|skip|later|not-now|home|dismiss/i.test(t);
    })
    .map((e) => e.dataset.testid);
}, id);

const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing';
  try { await l.click({ timeout: 2000 }); } catch (e) { return 'unclickable'; }
  return 'ok';
};

/* screen -> how a person actually gets there */
const REACH = {
  'workout-detail': async () => {
    /* The way a person gets there: Train, the history list, a session. */
    await page.evaluate(() => window.DEMO.go('train'));
    await page.waitForTimeout(600);
    await tap('open-history');
    await page.waitForTimeout(700);
    await tap('history-w1');
  },
  'review':        async () => { await page.evaluate(() => window.DEMO.push('review')); },
  'recap':         async () => { await page.evaluate(() => window.DEMO.push('recap')); },
  'settings':      async () => { await page.evaluate(() => window.DEMO.push('settings')); },
  'split-builder': async () => { await page.evaluate(() => window.DEMO.push('split-builder')); },
  'cycle':         async () => { await page.evaluate(() => window.DEMO.push('cycle')); },
  'stack':         async () => { await page.evaluate(() => window.DEMO.push('stack')); },
  'tutorial':      async () => { await page.evaluate(() => window.DEMO.push('tutorial')); },
  'exercise-library': async () => { await page.evaluate(() => window.DEMO.push('exercise-library')); }
};

console.log('=== every pushed screen can be left ===\n');

for (const id of Object.keys(REACH)) {
  errs.length = 0;
  /* Start from a known place each time, so a screen that failed to open
     cannot make the next one look like it did. */
  await page.evaluate(() => window.DEMO.go('home'));
  await page.waitForTimeout(400);
  await REACH[id]();
  await page.waitForTimeout(800);

  const here = await shown();
  if (here !== id) {
    ok(false, `${id} opens`, 'showing ' + here);
    continue;
  }
  ok(true, `${id} opens`);

  const exits = await exitsOn(id);
  ok(exits.length > 0, `  ${id} offers a way out`, exits.join(', ') || 'none visible');

  let left = null;
  for (const t of exits) {
    if ((await tap(t)) !== 'ok') continue;
    await page.waitForTimeout(800);
    if ((await shown()) !== id) { left = t; break; }
    /* Still here: the control did something in place (opened a sheet,
       armed a confirm). Escape closes those, then try the next one. */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  ok(!!left, `  ${id} actually leaves when you press it`,
     left ? 'via ' + left : 'pressed ' + exits.length + ' controls, still on ' + id);
  ok(!errs.length, `  ${id} throws nothing on the way out`, errs[0] || '');
}

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
