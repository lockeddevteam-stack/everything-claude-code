/* THE PATHS THAT TAKE SOMETHING AWAY.

   A bug in a read is a wrong number on a screen. A bug in a delete is
   work that is gone, and no amount of care afterwards brings it back --
   which makes these the paths worth attacking hardest and the ones least
   likely to be exercised by hand, because nobody wants to delete their
   own training to find out.

   Three questions, and they are all about what a delete takes WITH it:

     does deleting a split take the sessions logged from it? It must not.
       Those are a record of work that happened. The split is a plan; the
       history is a fact, and deleting a plan cannot rewrite facts.

     does deleting a split break a session running FROM it? Somebody
       tidying their splits mid-workout is doing two ordinary things at
       once, and the live session must survive it.

     does deleting a session take only that session? A delete that also
       drops the personal best it set, or the one next to it in the list,
       is worse than one that fails.

   And the arming: a destructive control that fires on the first tap is
   a control that fires by accident. Both of these arm first. */
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
/* Two splits, so deleting one leaves something behind, and two logged
   sessions, so deleting one can be seen to take only itself. */
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
  lk_splits: [
    { id: 's1', name: 'PPL', created: '9/1/2026', days: [
      { name: 'Push', blocks: [], exercises: [
        { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' }] }] },
    { id: 's2', name: 'Upper Lower', created: '9/2/2026', days: [
      { name: 'Upper', blocks: [], exercises: [
        { id: 201, name: 'Lat Pulldown', group: 'Back', muscle: 'Lats' }] }] }
  ],
  lk_history: [
    { id: 'w1', name: 'PPL - Push', date: '2026-09-13', kind: 'lift', kg: 480, min: 30, sets: 1,
      exercises: [{ id: 104, name: 'Incline Machine Press',
                    sets: [{ kg: 60, reps: 8, done: true }] }] },
    { id: 'w2', name: 'PPL - Push', date: '2026-09-10', kind: 'lift', kg: 440, min: 28, sets: 1,
      exercises: [{ id: 104, name: 'Incline Machine Press',
                    sets: [{ kg: 55, reps: 8, done: true }] }] }
  ],
  lk_prs: [{ exId: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest',
             kg: 60, reps: 8, date: '2026-09-13' }]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable'; }
  return 'ok';
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

console.log('=== a split is deleted, its history is not ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(800);
ok((await tap('split-s1')) === 'ok', 'the split opens');
await page.waitForTimeout(600);

/* One tap arms; it must not delete. */
ok((await tap('delete-split')) === 'ok', 'delete is offered');
await page.waitForTimeout(500);
const afterArm = await raw('lk_splits');
ok(Array.isArray(afterArm) && afterArm.length === 2,
   'one tap arms it and deletes nothing', (afterArm || []).length + ' splits');

ok((await tap('delete-split')) === 'ok', 'the second tap confirms');
await page.waitForTimeout(900);
const splitsNow = await raw('lk_splits');
ok(Array.isArray(splitsNow) && splitsNow.length === 1,
   'and the split is gone', JSON.stringify((splitsNow || []).map((x) => x.id)));
ok(splitsNow && splitsNow[0] && splitsNow[0].id === 's2',
   'the one that was not deleted stayed', String(splitsNow && splitsNow[0] && splitsNow[0].id));

const histAfterSplit = await raw('lk_history');
ok(Array.isArray(histAfterSplit) && histAfterSplit.length === 2,
   'and both logged sessions survive it — a plan is not a record of work',
   (histAfterSplit || []).length + ' sessions');
const prsAfterSplit = await raw('lk_prs');
ok(Array.isArray(prsAfterSplit) && prsAfterSplit.length === 1,
   'as does the best that was set under it', JSON.stringify(prsAfterSplit));
ok(!errs.length, 'nothing throws deleting a split', errs[0] || '');

console.log('\n=== a session is deleted, and takes only itself ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(800);
const opened = await tap('history-w1');
ok(opened === 'ok', 'a logged session opens', opened);
await page.waitForTimeout(900);
ok((await shown()) === 'workout-detail', 'on its own screen', await shown());

/* This screen does not arm; it deletes at once and offers six seconds
   of Undo, and its own copy says so. That is a different promise from
   the split's, and the thing worth checking is whether it is kept --
   an Undo that is offered and does not work is worse than no Undo,
   because the reader stops watching for the toast. */
ok((await tap('detail-delete')) === 'ok', 'delete is offered');
await page.waitForTimeout(700);
const histGone = await raw('lk_history');
ok(Array.isArray(histGone) && histGone.length === 1,
   'the session leaves history at once, as the screen says it does',
   (histGone || []).length + ' left');
ok(histGone && histGone[0] && histGone[0].id === 'w2',
   'and it is the one that was asked for, not the one beside it',
   String(histGone && histGone[0] && histGone[0].id));

const undoOffered = await tap('undo');
ok(undoOffered === 'ok', 'and Undo is offered', undoOffered);
await page.waitForTimeout(900);
const restored = await raw('lk_history');
ok(Array.isArray(restored) && restored.length === 2,
   'which puts the session back', (restored || []).length + ' sessions');
ok(restored && restored[0] && restored[0].id === 'w1',
   'in the place it was, not on the end', JSON.stringify((restored || []).map((x) => x.id)));

/* And then deleted for real, so the screens below are read with
   something genuinely missing. */
ok((await tap('detail-delete')) === 'ok', 'it is deleted again');
await page.waitForTimeout(700);
const histNow = await raw('lk_history');
ok(Array.isArray(histNow) && histNow.length === 1,
   'and stays gone when the Undo is not taken', (histNow || []).length + ' left');

ok(!errs.length, 'nothing throws deleting a session', errs[0] || '');

console.log('\n=== and a screen with nothing left on it is still a screen ===\n');

for (const r of ['train', 'home', 'progress', 'profile', 'recap']) {
  await page.evaluate((k) => window.DEMO.go(k), r);
  await page.waitForTimeout(700);
  const t = await page.evaluate((k) => {
    const rec = window.DEMO.screens[k];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    return root ? (root.textContent || '').replace(/\s+/g, ' ') : '';
  }, r);
  ok(t.length > 40, `${r} still renders after the deletes`, t.length + ' chars');
  ok(!/undefined|NaN|\[object Object\]/.test(t), `${r} has no hole where the deleted thing was`,
     (/undefined|NaN|\[object Object\]/.exec(t) || [''])[0] || 'clean');
}
ok(!errs.length, 'and nothing throws afterwards', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
