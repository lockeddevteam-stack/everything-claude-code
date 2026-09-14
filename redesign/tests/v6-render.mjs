/* WHAT AN UPGRADING READER ACTUALLY SEES.

   cloud-contract.mjs proves the migrations turn the shipped app's shapes
   into the ones this build reads. It proves it in a store, with no screen
   attached. This runs the other half: it puts the shipped app's own data
   on the device, with no fixture anywhere, and opens every screen.

   The shapes are read off the live project rather than invented -- a
   session whose volume and duration are strings and whose sets store
   "w" and "r" as text, an lk_prs map keyed by exercise id whose every row
   is dated with the word "Today", a split holding exIds, and the streaks
   switch under the name the shipped app saves it as. The values are not
   anybody's: a real account's numbers do not belong in a repository.

   A screen passes when it throws nothing, renders, and prints no hole.
   "undefined NaN" on the records list is exactly the defect this was
   written for, and it was a real one. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');
const PORT = 8137;

const files = fs.readdirSync(BUILD).filter((f) => f.endsWith('.html') && !/^mockup-/.test(f)).sort();

const srv = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: path.join(HERE, '..'), stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));

const HOLES = /(undefined|NaN|\[object Object\]|Infinity|Invalid Date)/;

/* The shipped app's storage, key for key. Objects are JSON, a plain string
   key is stored raw -- which is what LKStore.set writes and what its get
   falls back to parsing. */
import { V6, ACCOUNTS } from './v6-accounts.mjs';


/* FOUR MORE ACCOUNTS, SHAPED LIKE THE ONES ON THE PROJECT.

   V6 above is the fullest account there is. Most are not: of the five on
   the live project, three have no training at all, and the one with a
   split has never logged a session against it. Those are different code
   paths -- a screen that reads history is reading nothing, and a profile
   with no weight, height or age cannot compute a target -- and every one
   of them is somebody's first sight of this build.

   The fuel profile here is the live shape, which is not the shape this
   screen writes: the goal is "recomp", a word an older version of the
   shipped app offered and this build does not; the age is a string; the
   week is stored under `activityLevel` rather than `activity`; and the
   account profile's goal is "Cut", one of the three capitalised words
   the shipped app writes. */

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

console.log('=== v6 data on the real screens, with no fixture ===\n');

const br = await chromium.launch();
for (const file of files) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
  await ctx.addInitScript((data) => {
    try {
      Object.keys(data).forEach(function (k) {
        var v = data[k];
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });
    } catch (e) {}
  }, V6);

  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });

  /* No seed. The only data on this device is what the shipped app left. */
  await p.route('**/fixtures.js', (route) => route.fulfill({
    status: 200, contentType: 'application/javascript', body: '/* no seed */'
  }));

  await p.goto(`http://localhost:${PORT}/08-build/${file}`);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(700);

  const seen = await p.evaluate(() => ({
    text: (document.body.innerText || '').trim(),
    badges: window.LKStore ? window.LKStore.get('lk_badges', null) : null,
    schema: window.LKStore ? window.LKStore.schemaVersion() : null
  }));
  const body = seen.text.replace(/STATE[\s\S]*$/i, '');

  ok(!errs.length, `${file} — nothing throws on v6 data`,
     errs.length ? errs.slice(0, 2).join(' | ') : '');
  ok(body.length > 40, `${file} — still renders`, body.length + ' chars');
  const hole = body.match(HOLES);
  ok(!hole, `${file} — prints no holes`, hole ? `found "${hole[0]}"` : '');

  await ctx.close();
}

/* The migrations ran once, on this device, and left the data legible. */
const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
await ctx.addInitScript((data) => {
  try {
    Object.keys(data).forEach(function (k) {
      var v = data[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
  } catch (e) {}
}, V6);
const p = await ctx.newPage();
await p.route('**/fixtures.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
await p.goto(`http://localhost:${PORT}/08-build/progress.html`);
await p.waitForTimeout(800);
const after = await p.evaluate(() => {
  const S = window.LKStore;
  return {
    prs: S.get('lk_prs', null),
    hist: S.get('lk_history', null),
    splits: S.get('lk_splits', null),
    badges: S.get('lk_badges', null)
  };
});
ok(Array.isArray(after.prs) && after.prs.length === 3 && after.prs.every((r) => !!r.name),
   'the records map is a named, flat list on the device',
   JSON.stringify((after.prs || []).map((r) => r.name)));
ok(Array.isArray(after.hist) && after.hist.every((h) => typeof h.kg === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(h.date)),
   'every session carries a number and an ISO date',
   JSON.stringify((after.hist || []).map((h) => [h.date, h.kg])));
ok(Array.isArray(after.hist) && after.hist[0].exercises[0].sets.every((s) => typeof s.kg === 'number'),
   'and every set weight is a number, not the text it was stored as',
   JSON.stringify(after.hist[0].exercises[0].sets[0]));
ok(Array.isArray(after.splits) && after.splits[0].days.every((d) => (d.exercises || []).every((e) => !!e.name)),
   'every split day holds named exercises, not bare ids',
   JSON.stringify(after.splits[0].days.map((d) => (d.exercises || []).map((e) => e.name))));
ok(after.badges === true,
   'and the streaks switch survived the rename', JSON.stringify(after.badges));
await ctx.close();

/* and each of the four, on every screen */
for (const [who, data] of Object.entries(ACCOUNTS)) {
  for (const file of files) {
    const c = await br.newContext({ viewport: { width: 393, height: 852 } });
    await c.addInitScript((d) => {
      try {
        Object.keys(d).forEach(function (k) {
          var v = d[k];
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        });
      } catch (e) {}
    }, data);
    const pg = await c.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.route('**/fixtures.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await pg.goto(`http://localhost:${PORT}/08-build/${file}`);
    await pg.waitForTimeout(500);
    const t = (await pg.evaluate(() => (document.body.innerText || '').trim())).replace(/STATE[\s\S]*$/i, '');
    ok(!errs.length, `${who} · ${file} — nothing throws`, errs[0] || '');
    const h = t.match(HOLES);
    ok(!h, `${who} · ${file} — prints no holes`, h ? `found "${h[0]}"` : '');
    await c.close();
  }
}

/* the goal the shipped app wrote, in the words this build reads */
{
  const c = await br.newContext();
  await c.addInitScript(() => {
    localStorage.setItem('lk_profile', JSON.stringify({ useKg: false, username: 'jay', goal: 'Cut' }));
  });
  const pg = await c.newPage();
  await pg.route('**/fixtures.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await pg.goto(`http://localhost:${PORT}/08-build/fuel.html`);
  await pg.waitForTimeout(500);
  const g = await pg.evaluate(() => window.LKStore.get('lk_profile', {}).goal);
  ok(g === 'cut', 'a goal of "Cut" is read as cutting, not defaulted to maintenance', String(g));
  await c.close();
}

await br.close();
srv.kill();

console.log('');
if (fails) {
  console.log(`${fails} checks failed — an upgrading reader would see this`);
  process.exit(1);
}
console.log('every screen holds up on the data the shipped app left behind');
