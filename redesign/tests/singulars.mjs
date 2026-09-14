/* THE THINGS THAT ARE WRONG EXACTLY ONCE.

   Three defects that only show on a boundary, which is why they survived
   every pass that looked at a populated account:

     history ids   Train builds its row testid out of a session's id.
                   Sessions written before ids existed, and every session
                   a v6 phone brings across, carry none -- so a history
                   full of them rendered a list of buttons all called
                   `history-undefined`, the same string for every row.
                   Review stamped ids, but only on the way past, so a
                   reader who never opened Review never got any.

     edited dates  The split builder wrote `created` and never `updated`,
                   and Train prints "edited <date>" from `updated`. A
                   split reworked five times still claimed to have been
                   edited on the day it was first saved.

     one of them   Counts were concatenated with a hard-coded plural, so
                   a single logged set read "1 logged sets" in the dialog
                   asking whether to throw it away, and a one-day split
                   read "1 days".

   All three are invisible with three sets, three days and a session
   list Review has been through. They are the first thing a new reader
   sees. */
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
/* A v6 import: sessions with no ids on them at all, and a one-day split. */
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
  /* ONE day, so every plural in reach of a split is on its boundary. */
  lk_splits: [{ id: 's1', name: 'Solo', created: '9/1/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' }] }] }],
  /* No `id` on either, which is what a v6 phone hands over. */
  lk_history: [
    { name: 'PPL - Push', date: '2026-09-07', kind: 'lift', kg: 1440, min: 38, sets: 3,
      exercises: [{ id: 104, name: 'Incline Machine Press',
                    sets: [{ kg: 60, reps: 8, done: true }] }] },
    { name: 'PPL - Pull', date: '2026-09-05', kind: 'lift', kg: 1200, min: 35, sets: 3,
      exercises: [{ id: 201, name: 'Lat Pulldown',
                    sets: [{ kg: 55, reps: 10, done: true }] }] }
  ]
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 9000 });
await page.waitForTimeout(900);

const inScreen = (name, fn) => page.evaluate(([n, f]) => {
  const rec = window.DEMO.screens[n];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  if (!root) return null;
  // eslint-disable-next-line no-new-func
  return new Function('root', f)(root);
}, [name, fn]);
const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable'; }
  return 'ok';
};

console.log('\n=== every session gets an id, not just the ones Review saw ===\n');

await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(900);

const ids = await inScreen('train',
  "return Array.from(root.querySelectorAll('[data-testid^=\"history-\"]'))" +
  ".map(e => e.getAttribute('data-testid'));");
ok(Array.isArray(ids) && ids.length >= 2, 'both imported sessions are listed',
   JSON.stringify(ids));
ok(!(ids || []).some((t) => /undefined/.test(t)), 'and none of them is history-undefined',
   JSON.stringify(ids));
ok(new Set(ids || []).size === (ids || []).length, 'and no two share an id',
   JSON.stringify(ids));

const written = await page.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('lk_history')) || []).map((w) => w.id); }
  catch (e) { return null; }
});
ok(Array.isArray(written) && written.every(Boolean),
   'and the ids were written back, so they are the same next time',
   JSON.stringify(written));

console.log('\n=== a one-day split is a day, not days ===\n');

const summary = await inScreen('train',
  "const b = root.querySelector('[data-testid^=\"split-\"]');" +
  "return (root.textContent || '').replace(/\\s+/g, ' ');");
ok(!/\b1 days\b/.test(summary || ''), 'Train never says "1 days"',
   (/\b1 days\b/.exec(summary || '') || [''])[0] || 'clean');
ok(!/\b1 exercises\b/.test(summary || ''), 'nor "1 exercises"',
   (/\b1 exercises\b/.exec(summary || '') || [''])[0] || 'clean');

console.log('\n=== nor is one logged set "1 sets" ===\n');

ok((await tap('start-today')) === 'ok', "today's session starts");
await page.waitForTimeout(900);
ok((await tap('done-0-0')) === 'ok', 'one set is logged');
await page.waitForTimeout(600);

/* The dialog that asks whether to throw the workout away is where the
   count matters most: it is the number somebody decides on. */
const opened = await tap('btn-discard');
if (opened !== 'ok') {
  const alt = await inScreen('workout-log',
    "return Array.from(root.querySelectorAll('[data-act=\"discard\"]'))" +
    ".map(e => e.getAttribute('data-testid'))[0] || null;");
  if (alt) await tap(alt);
}
await page.waitForTimeout(700);
const dialog = await inScreen('workout-log',
  "const d = root.querySelector('[data-testid=\"discard-dialog\"]');" +
  "return d ? d.textContent.replace(/\\s+/g, ' ') : null;");
ok(dialog !== null, 'the discard dialog opens', String(dialog));
ok(dialog === null || /\b1 logged set\b/.test(dialog),
   'and one set is "1 logged set"', String(dialog));
ok(dialog === null || !/\b1 logged sets\b/.test(dialog),
   'and never "1 logged sets"', String(dialog));

console.log('\n=== and a split says when it was last edited ===\n');

const readSplit = () => page.evaluate(() => {
  try {
    const sp = (JSON.parse(localStorage.getItem('lk_splits')) || [])[0];
    return sp ? { created: sp.created, updated: sp.updated || null } : null;
  } catch (e) { return null; }
});

const before = await readSplit();
ok(before !== null && !before.updated,
   'the seeded split is a v6 one, with no edited date on it',
   JSON.stringify(before));

/* Through the builder, which is the only thing that writes one. Anything
   short of a real save proves nothing: the whole defect was that the save
   path did not write the field. */
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(700);
const sheet = await tap('split-s1');
if (sheet !== 'ok') {
  const any = await inScreen('train',
    "const b = root.querySelector('[data-action=\"open-split\"]');" +
    "return b ? b.getAttribute('data-testid') : null;");
  if (any) await tap(any);
}
await page.waitForTimeout(600);
ok((await tap('edit-split')) === 'ok', 'the split opens in the builder');
await page.waitForTimeout(1200);

/* A clean split has no Save button by design -- the state is told in the
   header instead -- so the split has to actually be changed before there
   is a save to make. Adding a day is the smallest real edit. */
ok((await tap('add-day')) === 'ok', 'a day is added, so there is something to save');
await page.waitForTimeout(800);
const saved = await tap('save-split');
ok(saved === 'ok', 'and Save appears and is pressed', saved);
await page.waitForTimeout(1600);

const after = await readSplit();
ok(after !== null && !!after.updated, 'the save writes an edited date',
   JSON.stringify(after));
ok(after && after.created === (before && before.created),
   'and leaves the created date alone', JSON.stringify(after));
ok(after && /^\d{4}-\d{2}-\d{2}$/.test(String(after.updated || '')),
   'in the shape Train reads', String(after && after.updated));

ok(!errs.length, 'nothing threw', errs[0] || '');

await br.close();
site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
