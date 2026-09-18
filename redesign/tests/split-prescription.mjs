/* A PLANNED EXERCISE HAD NO SETS AND NO REPS, ANYWHERE.

   The coach could write you a split. The system prompt in cloud.js told
   the model that every exercise carries `sets` and `reps`, the gate in
   coach-actions.js checked the sets and threw the reps away without
   saying so, and APPLY.split then wrote `{id, name, group, muscle}` into
   lk_splits and dropped both. The card on screen said "4 sets" about a
   day that, one line later, prescribed nothing at all.

   It was never only the coach. The split builder wrote the same four
   fields, onboarding seeded the same shape, the exercise library added
   the same four, and no screen in the build showed a planned set or rep
   count because there was none to show. A prescription existed for
   exactly as long as it took to render one card. So this was not a field
   being dropped on one path: it was a field that had never existed
   outside what the model sent.

   It exists now. An exercise in a day carries `sets` (a number, because
   sets are counted and the log lays out that many rows) and `reps` (a
   STRING, because "8-12" and "AMRAP" are prescriptions as ordinary as
   10, and nothing in the app does arithmetic on a planned rep count).
   Both are optional, and this is the half that matters most: every split
   already on a real phone has exercises with neither, there is no
   migration, and an absent prescription has to read as "not prescribed"
   everywhere rather than as zero sets of zero reps.

   What is checked here is the whole road, because every part of it was
   broken in a different place:

     - the coach writes a split with sets and reps and they are still
       there after a reload, in the canonical forms the gate emits, and a
       rep prescription it cannot read is refused by name instead of
       vanishing;
     - the builder shows the prescription on the row and lets it be
       typed, and what is typed reaches storage;
     - a split stored WITHOUT any prescription still opens, counts,
       edits, starts and saves exactly as it did before, on every screen
       that reads lk_splits;
     - starting a split day lays out as many set rows as the day asks
       for, with the prescribed reps in the ghost tone a suggested figure
       has always had, never looking like something that was logged;
     - and Review's write-back, which rebuilds a day's whole lift list
       out of a session that has no prescription in it, puts the
       prescription back instead of quietly wiping it. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP = path.join(ROOT, '10-final/locked-app.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' }); r.end(await readFile(APP));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const URL_ = 'http://127.0.0.1:' + site.address().port + '/';
const br = await chromium.launch();

/* A Push day in the two states that have to coexist forever: prescribed,
   and the shape every phone already holds, which carries neither field. */
const PRESCRIBED = [
  { id: 111, name: 'Barbell Bench Press', group: 'Chest', muscle: 'Mid Chest', sets: 5, reps: '8-12' },
  { id: 302, name: 'DB Shoulder Press', group: 'Shoulders', muscle: 'Front Delt', sets: 4, reps: '10' },
  { id: 311, name: 'Lateral Raise', group: 'Shoulders', muscle: 'Side Delt', sets: 3, reps: 'AMRAP' }
];
const BARE = PRESCRIBED.map((e) => ({ id: e.id, name: e.name, group: e.group, muscle: e.muscle }));

/* Enough history for a blank row to have last session's figures behind
   it, which is the only way a set with nothing typed in it can be
   ticked at all. */
const PRIOR_IDS = Array.from({ length: 60 }, (_, i) => 100 + i)
  .concat(Array.from({ length: 40 }, (_, i) => 300 + i));
const PRIOR = [{
  id: 'w0', kind: 'lift', name: 'PPL - Push', date: '2026-09-01', min: 50, sets: 12, kg: 5000,
  exercises: PRIOR_IDS.map((id) => ({ id, name: 'x', muscle: '', sets: [
    { kg: 60, reps: 8, rir: 2, warm: false, done: true },
    { kg: 60, reps: 8, rir: 2, warm: false, done: true },
    { kg: 60, reps: 8, rir: 2, warm: false, done: true }] }))
}];

async function fresh(day, extra) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
    isMobile: true, hasTouch: true });
  /* SEEDED ONCE, NOT ON EVERY NAVIGATION. An init script runs again on
     every reload, and half of what is checked below is "is it still
     there after a reload" -- re-seeding would have put the original
     split back and called that a pass. */
  await ctx.addInitScript((d) => {
    try {
      if (localStorage.getItem('lk_seeded') === '1') return;
      Object.keys(d).forEach((k) => {
        localStorage.setItem(k, typeof d[k] === 'string' ? d[k] : JSON.stringify(d[k]));
      });
      localStorage.setItem('lk_seeded', '1');
    } catch (e) {}
  }, Object.assign({
    lk_onboarded: 'true', lk_tutorialSeen: 'true',
    lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: true, weightKg: 82,
                  heightCm: 180, age: 31, sex: 'male', goal: 'maintain' },
    lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026',
                  days: [{ name: 'Push', blocks: [], exercises: day || PRESCRIBED }] }],
    lk_history: PRIOR
  }, extra || null));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL_);
  await page.waitForFunction(
    () => window.DEMO && window.DEMO.screens && window.DEMO.screens.train,
    null, { timeout: 20000 });
  await page.waitForTimeout(800);
  return { ctx, page, errs };
}

const rootOf = ([s, t]) => {
  const rec = window.DEMO.screens[s];
  const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return r && r.querySelector('[data-testid="' + t + '"]');
};
const tap = (page, s, t) => page.evaluate(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = r && r.querySelector('[data-testid="' + t + '"]');
  if (!el) throw new Error('no ' + s + '/' + t);
  el.click();
}, [s, t]);
const textOf = (page, s, t) => page.evaluate(rootOf, [s, t])
  .then((h) => page.evaluate(([s, t]) => {
    const rec = window.DEMO.screens[s];
    const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    const el = r && r.querySelector('[data-testid="' + t + '"]');
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(none)';
  }, [s, t]));
const attrOf = (page, s, t, a) => page.evaluate(([s, t, a]) => {
  const rec = window.DEMO.screens[s];
  const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = r && r.querySelector('[data-testid="' + t + '"]');
  return el ? el.getAttribute(a) : null;
}, [s, t, a]);
const type = (page, s, t, v) => page.evaluate(([s, t, v]) => {
  const rec = window.DEMO.screens[s];
  const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = r && r.querySelector('[data-testid="' + t + '"]');
  if (!el) throw new Error('no ' + s + '/' + t);
  el.value = v;
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [s, t, v]);
const splits = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_splits') || 'null'); } catch (e) { return null; }
});
const day0 = (page) => splits(page).then((all) => all[0].days[0].exercises);

/* The coach's own write path: the gate, then the writer, the two things
   that stand between what a model said and what ends up on the phone. */
const coachWrites = (page, exercises) => page.evaluate((exs) => {
  window.LKCoachActions.setCatalogue(window.LKExercises.all());
  const v = window.LKCoachActions.check({ kind: 'split', split: { name: 'Coach PPL',
    days: [{ name: 'Push', exercises: exs }] } });
  if (!v.ok) return { ok: false, problems: v.problems };
  const r = window.LKCoachActions.apply(v.action);
  return { ok: !!(r && r.ok), problems: v.problems, action: v.action };
}, exercises);

console.log('=== the coach writes a prescription and it survives ===\n');
{
  const { ctx, page, errs } = await fresh();
  const wrote = await coachWrites(page, [
    { id: 111, name: 'Barbell Bench Press', sets: 4, reps: '8-12' },
    { id: 302, name: 'DB Shoulder Press', sets: 3, reps: 10 },
    { id: 311, name: 'Lateral Raise', sets: 3, reps: '15 to 20' },
    { id: 411, name: 'Tricep Pushdown', sets: 2, reps: 'to failure' }
  ]);
  ok(wrote.ok, 'the gate passes a split with sets and reps', (wrote.problems || []).join('; '));

  /* Reloaded, because the whole defect was that this never reached
     storage: reading back the object the gate returned would have
     "passed" on the broken build too. */
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens, null, { timeout: 20000 });
  await page.waitForTimeout(500);
  const all = await splits(page);
  const written = all.find((s) => s.name === 'Coach PPL');
  ok(!!written, 'the split is in lk_splits after a reload');
  const ex = (written && written.days[0].exercises) || [];
  ok(ex.length === 4 && ex.every((e) => e.sets > 0),
     'every lift kept its set count', ex.map((e) => e.sets).join(','));
  ok(ex[0].reps === '8-12', 'a range is stored as it was written', String(ex[0].reps));
  ok(ex[1].reps === '10', 'a number arrives as the string form of itself', JSON.stringify(ex[1].reps));
  ok(ex[2].reps === '15-20', '"15 to 20" is normalised to a range', String(ex[2].reps));
  ok(ex[3].reps === 'AMRAP', '"to failure" is normalised to AMRAP', String(ex[3].reps));

  /* Absent stays absent: a model that says nothing about reps has said
     nothing, and the field is not invented for it. */
  const quiet = await coachWrites(page, [{ id: 111, name: 'Barbell Bench Press', sets: 4 }]);
  ok(quiet.ok && quiet.action.days[0].exercises[0].reps === undefined,
     'a lift with no reps prescribed carries none');

  const bad = await coachWrites(page, [{ id: 111, name: 'Barbell Bench Press', sets: 4, reps: '8-12 per side' }]);
  ok(!bad.ok && (bad.problems || []).join(' ').indexOf('8-12 per side') > -1,
     'a rep prescription the gate cannot read is refused by name',
     (bad.problems || []).join('; ').slice(0, 90));

  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== the builder shows it and lets it be typed ===\n');
{
  const { ctx, page, errs } = await fresh();
  await page.evaluate(() => window.DEMO.go('split-builder'));
  await page.waitForTimeout(1200);

  const sub = await textOf(page, 'split-builder', 'ex-presc-' + (await page.evaluate(() => {
    const rec = window.DEMO.screens['split-builder'];
    const r = rec.root || rec.host.shadowRoot;
    const el = r.querySelector('[data-testid^="ex-presc-"]');
    return el ? el.getAttribute('data-testid').replace('ex-presc-', '') : 'none';
  })));
  ok(sub === '5 × 8-12', 'the row at rest prints the prescription', sub);

  await tap(page, 'split-builder', 'edit-toggle');
  await page.waitForTimeout(500);
  const rowIds = await page.evaluate(() => {
    const rec = window.DEMO.screens['split-builder'];
    const r = rec.root || rec.host.shadowRoot;
    return [...r.querySelectorAll('[data-testid^="ex-sets-"]')]
      .map((el) => el.getAttribute('data-testid').replace('ex-sets-', ''));
  });
  ok(rowIds.length === 3, 'every lift in the day has a prescription control', String(rowIds.length));
  ok(await attrOf(page, 'split-builder', 'ex-sets-' + rowIds[0], 'value') === '5',
     'the control opens on what the day already says');

  await type(page, 'split-builder', 'ex-sets-' + rowIds[0], '6');
  await type(page, 'split-builder', 'ex-reps-' + rowIds[0], '4 to 6');
  /* And a prescription taken off a lift that had one: blank has to mean
     "not prescribed" rather than leaving the old figures behind. */
  await type(page, 'split-builder', 'ex-sets-' + rowIds[2], '');
  await type(page, 'split-builder', 'ex-reps-' + rowIds[2], '');
  await tap(page, 'split-builder', 'save-split');
  await page.waitForTimeout(1500);

  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens, null, { timeout: 20000 });
  await page.waitForTimeout(500);
  const ex = await day0(page);
  ok(ex[0].sets === 6 && ex[0].reps === '4-6',
     'what was typed is what is stored, in canonical form', JSON.stringify([ex[0].sets, ex[0].reps]));
  ok(ex[1].sets === 4 && ex[1].reps === '10',
     'a row nobody touched keeps what it had', JSON.stringify([ex[1].sets, ex[1].reps]));
  ok(ex[2].sets === undefined && ex[2].reps === undefined,
     'a prescription cleared to blank writes no key at all', JSON.stringify(ex[2]));
  ok(ex.length === 3 && ex.every((e) => e.id && e.name),
     'and nothing else about the day moved', ex.map((e) => e.id).join(','));
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== a split with no prescription still works everywhere ===\n');
{
  const { ctx, page, errs } = await fresh(BARE);

  for (const screen of ['home', 'train', 'progress', 'split-builder', 'exercise-library', 'coach']) {
    await page.evaluate((s) => window.DEMO.go(s), screen);
    await page.waitForTimeout(700);
    const painted = await page.evaluate((s) => {
      const rec = window.DEMO.screens[s];
      const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
      return !!(r && r.querySelector('[data-testid]'));
    }, screen);
    ok(painted, screen + ' paints on a split with no prescription');
  }

  await page.evaluate(() => window.DEMO.go('train'));
  await page.waitForTimeout(700);
  const today = await textOf(page, 'train', 'today-meta');
  ok(today.indexOf('3 exercises') > -1, 'Train still counts the day', today.slice(0, 60));

  await page.evaluate(() => window.DEMO.go('split-builder'));
  await page.waitForTimeout(1200);
  const anyPresc = await page.evaluate(() => {
    const rec = window.DEMO.screens['split-builder'];
    const r = rec.root || rec.host.shadowRoot;
    return r.querySelectorAll('[data-testid^="ex-presc-"]').length;
  });
  ok(anyPresc === 0, 'the builder prints no prescription where there is none', String(anyPresc));
  const rowText = await page.evaluate(() => {
    const rec = window.DEMO.screens['split-builder'];
    const r = rec.root || rec.host.shadowRoot;
    const el = r.querySelector('.swipe .row__sub');
    return el ? el.textContent.trim() : '(none)';
  });
  ok(rowText === 'Mid Chest', 'the row reads exactly as it did before', rowText);

  /* Saving a split whose lifts nobody touched must not invent a
     prescription for them. Renamed, because the save bar only exists
     while there is something unsaved. */
  await tap(page, 'split-builder', 'edit-toggle');
  await page.waitForTimeout(500);
  await type(page, 'split-builder', 'split-name', 'PPL renamed');
  await page.waitForTimeout(400);
  await tap(page, 'split-builder', 'save-split');
  await page.waitForTimeout(1500);
  const after = await day0(page);
  ok(after.every((e) => e.sets === undefined && e.reps === undefined),
     'a save adds no prescription nobody asked for', JSON.stringify(after[0]));

  /* And the log still opens the three rows it has always opened. */
  await page.evaluate(() => window.DEMO.go('train'));
  await page.waitForTimeout(700);
  await tap(page, 'train', 'start-today');
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(() => {
    const rec = window.DEMO.screens['workout-log'];
    const r = rec.root || rec.host.shadowRoot;
    return r.querySelectorAll('[data-testid^="cell-0-"][data-testid$="-reps"]').length;
  });
  ok(rows === 3, 'an unprescribed lift opens with the three rows it always had', String(rows));
  const cell = await textOf(page, 'workout-log', 'cell-0-0-reps');
  ok(cell === '--', 'and its reps cell is empty, not a zero', cell);
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== the log lays out what the day prescribes ===\n');
{
  const { ctx, page, errs } = await fresh();
  await page.evaluate(() => window.DEMO.go('train'));
  await page.waitForTimeout(700);
  await tap(page, 'train', 'start-today');
  await page.waitForTimeout(1500);

  const counts = await page.evaluate(() => [0, 1, 2].map((e) => {
    const rec = window.DEMO.screens['workout-log'];
    const r = rec.root || rec.host.shadowRoot;
    return r.querySelectorAll('[data-testid^="cell-' + e + '-"][data-testid$="-reps"]').length;
  }));
  ok(counts.join(',') === '5,4,3',
     'five, four and three rows, because that is what the day asks for', counts.join(','));

  ok(await textOf(page, 'workout-log', 'cell-0-0-reps') === '8-12',
     'the prescribed range is in the cell');
  ok(await textOf(page, 'workout-log', 'cell-2-0-reps') === 'AMRAP',
     'and so is a prescription that is not a number at all');
  ok(await attrOf(page, 'workout-log', 'cell-0-0-reps', 'data-prescribed') === 'true',
     'it is marked as prescribed rather than logged');
  const cls = await attrOf(page, 'workout-log', 'cell-0-0-reps', 'class');
  ok(/cell--empty/.test(cls || ''),
     'and it wears the ghost tone a suggested figure has always worn', cls);
  const aria = await attrOf(page, 'workout-log', 'cell-0-0-reps', 'aria-label');
  ok(/prescribed 8-12/.test(aria || ''), 'the label says prescribed, not logged', aria);

  /* The keypad. A plain number seeds it the way last session's weight
     does, and says which of the two it is. */
  await tap(page, 'workout-log', 'cell-1-0-reps');
  await page.waitForTimeout(500);
  ok(await textOf(page, 'workout-log', 'pad-value') === '10', 'a numeric prescription opens the pad on itself');
  ok(await textOf(page, 'workout-log', 'pad-hint') === 'Prescribed. Type to replace it.',
     'and the hint says prescribed, not last session');
  await tap(page, 'workout-log', 'pad-cancel');
  await page.waitForTimeout(300);

  await tap(page, 'workout-log', 'cell-0-0-reps');
  await page.waitForTimeout(500);
  ok(await textOf(page, 'workout-log', 'pad-value') === '0',
     'a range opens the pad blank rather than picking an end of it');
  await tap(page, 'workout-log', 'pad-cancel');
  await page.waitForTimeout(300);

  /* And a reload mid-session comes back still knowing the plan. */
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens, null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.DEMO.go('workout-log'));
  await page.waitForTimeout(800);
  ok(await textOf(page, 'workout-log', 'cell-0-0-reps') === '8-12',
     'and a reload mid-session still knows what the day asked for');
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

console.log('\n=== Review rewrites the day without wiping the plan ===\n');
{
  const { ctx, page, errs } = await fresh();
  /* A finished session in the order the lifts were actually done, which
     is the change that makes Review rebuild the whole list. */
  await page.evaluate((day) => {
    const sets = [{ kg: 60, reps: 8, rir: 2, warm: false, done: true }];
    const order = [day[2], day[0], day[1]];
    localStorage.setItem('lk_lastSession', JSON.stringify({
      title: 'PPL - Push', type: 'split', note: '', dateISO: '2026-09-18',
      sets: 3, warmups: 0, volumeKg: 1440, minutes: 40,
      lifts: order.map((e) => ({ id: e.id, name: e.name, sets: 1, vol: 480, top: [60, 8] })),
      exercises: order.map((e) => ({ id: e.id, name: e.name, muscle: e.muscle, sets: sets })),
      source: { splitId: 's1', splitName: 'PPL', dayId: 'push', dayName: 'Push', planned: day }
    }));
  }, PRESCRIBED);
  await page.evaluate(() => window.DEMO.go('review'));
  await page.waitForTimeout(900);
  await tap(page, 'review', 'split-update');
  await page.waitForTimeout(700);

  const ex = await day0(page);
  ok(ex.map((e) => e.id).join(',') === '311,111,302',
     'the order is the one it was trained in', ex.map((e) => e.id).join(','));
  const back = {};
  ex.forEach((e) => { back[e.id] = e.sets + '/' + e.reps; });
  ok(back['111'] === '5/8-12' && back['302'] === '4/10' && back['311'] === '3/AMRAP',
     'and every lift still carries the prescription it had', JSON.stringify(back));
  ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
  await ctx.close();
}

await br.close();
site.close();
console.log(fails === 0
  ? '\nsplit-prescription: all ' + checks + ' checks passed'
  : '\nsplit-prescription: ' + fails + ' of ' + checks + ' FAILED');
process.exit(fails ? 1 : 0);
