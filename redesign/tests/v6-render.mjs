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
const V6 = {
  lk_profile: { age: 31, sex: 'Male', goal: 'Maintain', useKg: true, heightCm: 170.18,
                username: 'reader', displayName: 'Reader', createdAt: '5/13/2026',
                weightKg: 57.15270658889061 },
  /* every row dated with the word the shipped app showed at the time */
  lk_prs: { 104: [{ date: 'Today', r: 3, w: 58.96707822663317 },
                  { date: 'Today', r: 5, w: 54.43114913227677 }],
            311: [{ date: 'Today', r: 8, w: 22.67964547178199 }] },
  lk_history: [
    { name: 'Pull Hotel', date: '6/18/2026', dateISO: '2026-06-19', vol: '3608 kg',
      dur: '39 min', sets: 12, blocks: null, note: '',
      exercises: [
        { name: 'Technogym Low row',
          sets: [{ r: '8', w: '35', rL: '', rR: '', rir: '2', done: true },
                 { r: '9', w: '90', rL: '', rR: '', rir: '0', done: true }] },
        { name: 'Technogym Vertical Pulldown',
          sets: [{ r: '8', w: '55', rL: '', rR: '', rir: '2', done: true }] }] },
    { name: 'Push', date: '6/12/2026', dateISO: '2026-06-12', vol: '2940 kg',
      dur: '45 min', sets: 9,
      exercises: [{ name: 'Incline Machine Press',
                    sets: [{ r: '5', w: '58.96707822663317', rir: '1', done: true }] }] }
  ],
  lk_splits: [{ id: 1, name: 'Push Pull Legs', created: 1780000000000,
                days: [{ name: 'Push', exIds: [104, 311] }, { name: 'Pull', exIds: [106] }] }],
  lk_weightLog: [{ kg: 58.96707822663317, date: '2026-05-22' }],
  lk_customEx: [],
  lk_exNotes: {},
  lk_gamingLayer: true,
  lk_weightsKgMigrated: true,
  lk_weightStorageUnit: 'lb',
  lk_theme: 'dark',
  lk_tutorialSeen: true
};

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
const ACCOUNTS = {
  'signed up, never used it': {
    lk_profile: { useKg: false, username: 'newer', displayName: 'Newer', createdAt: '07/09/2026' },
    lk_theme: 'dark', lk_tutorialSeen: true
  },
  'markers but no content': {
    lk_profile: { useKg: false, username: 'zed', displayName: 'Zed', createdAt: '07/09/2026' },
    lk_theme: 'dark', lk_tutorialSeen: true, lk_cardioMigrated: true,
    lk_prDatesFixed: true, lk_weightsKgMigrated: true, lk_weightStorageUnit: 'kg'
  },
  'fuel only, no training': {
    lk_profile: { useKg: false, username: 'liv', displayName: 'Liv', createdAt: '24/07/2026' },
    lk_theme: 'dark', lk_tutorialSeen: true, lk_voiceEnabled: true, lk_voiceBtnCorner: 'br',
    lk_fuelLogDayTs: {},
    lk_fuelLog: { '2026-07-25': { water: 1905, meals: { breakfast: [], lunch: [], dinner: [],
      snacks: [{ name: 'Cheese crackers', cal: 170, pro: 3, carb: 20, fat: 10,
                 est: true, src: 'ai', fromVoice: true }] } } },
    lk_fuelProfile: { age: '16', sex: 'female', goal: 'recomp', tdee: 1219, tdeeSeed: 1219,
      heightCm: 15, heightFt: '', heightIn: '6.5', heightUnit: 'ft',
      weightKg: 49.9, weightVal: '110', weightUnit: 'lbs',
      macroFat: 34, macroCarbs: 118, macroProtein: 110,
      activityLevel: 'light', useCustomMacros: false, preferences: [],
      allergies: '', fridge: 'rice, pasta, mixed vegetables' }
  },
  'a split, never trained against it': {
    lk_profile: { useKg: false, username: 'jay', displayName: 'Jay', createdAt: '9/1/2026',
                  goal: 'Cut' },
    lk_theme: 'dark', lk_tutorialSeen: true, lk_gamingLayer: true,
    lk_cardioMigrated: true, lk_prDatesFixed: true, lk_weightsKgMigrated: true,
    lk_weightStorageUnit: 'kg', lk_splitsExpanded: { 1: true },
    lk_customEx: [], lk_exNotes: {},
    lk_weightLog: [{ kg: 68.94612223421724, date: '2026-09-01' }],
    lk_splits: [{ id: 1, name: 'Upper Lower', created: 1780000000000,
                  days: [{ name: 'Upper', exIds: [104, 311] }, { name: 'Lower', exIds: [106] }] }],
    lk_fuelLog: {}
  }
};

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
