/* THE SESSION KNEW IT WAS A PUSH DAY AND THE PLAN NEVER FOUND OUT.

   Swap the incline press for a flat press during Push, finish the
   session, and next week's Push day still said incline. It would still
   say incline in a year. There was no route at all from a finished
   session back into the split it came from, so a lifter who had settled
   into a different exercise three weeks running either opened the split
   builder and did it again by hand, or trained off a plan that had
   quietly stopped describing what they do.

   Two things were missing, and one of them was hiding behind the other.

   The first is that the session forgot where it came from. The workout
   log read lk_startDay ("<splitId>:<dayId>"), built the day from it, and
   threw the key away -- so by the time anything could have asked whether
   to keep a change, all that was left was a name, "PPL - Push", and no
   way to say WHICH day of WHICH split had run differently, or what that
   day had planned before the session started editing it. The log now
   keeps a `source` on the session (split id and name, day id and name,
   and the exercises the day PLANNED) and hands it to Review with
   everything else; it also rides along in lk_liveSessionRows, so a
   reload mid-Push comes back still knowing it is a Push day.

   The second is that Review's split card was a mock. It read
   beautifully -- one line per difference, both actions secondary so the
   accent stays on Save, a skip never applied unless it is picked by name
   -- and behind it were four hand-written difference lists, a PPL/Push
   constant, and four buttons that moved a variable in this screen and
   touched lk_splits never. It could not have changed a split if you had
   pressed it all afternoon.

   So what is checked here is the whole road: that the day travels with
   the session, that the difference is computed off what was actually
   logged, that the offer is made once and only when there is something
   to offer, and that taking it REACHES lk_splits -- in whichever of the
   two shapes that day is stored in, exIds on a phone that has been
   running LOCKED or resolved exercises from the split builder -- with
   the split's `updated` stamped so Train's "edited" line stays honest.

   And the three ways to lose work, which are the reason this is a
   question and not a behaviour: answering neither keeps everything,
   keeping the plan writes nothing, and a split deleted between the
   session and the review is not offered rather than throwing. */
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

/* A three-lift Push day, and a prior session carrying every lift in the
   catalogue's low numbers -- the log will only let a set be ticked when
   it has a weight and reps, and last session's figures are where a
   blank row gets them. A swapped-in lift deliberately gets none of
   them, so its numbers are typed on the keypad below. */
const DAY = [
  { id: 111, name: 'Barbell Bench Press', group: 'Chest', muscle: 'Mid Chest' },
  { id: 302, name: 'DB Shoulder Press', group: 'Shoulders', muscle: 'Front Delt' },
  { id: 311, name: 'Lateral Raise', group: 'Shoulders', muscle: 'Side Delt' }
];
const PRIOR_IDS = Array.from({ length: 60 }, (_, i) => 100 + i)
  .concat(Array.from({ length: 40 }, (_, i) => 300 + i));
const PRIOR = [{
  id: 'w0', kind: 'lift', name: 'PPL - Push', date: '2026-09-01', min: 50, sets: 12, kg: 5000,
  exercises: PRIOR_IDS.map((id) => ({ id, name: 'x', muscle: '', sets: [
    { kg: 60, reps: 8, rir: 2, warm: false, done: true },
    { kg: 60, reps: 8, rir: 2, warm: false, done: true },
    { kg: 60, reps: 8, rir: 2, warm: false, done: true }] }))
}];

async function fresh(day) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
    isMobile: true, hasTouch: true });
  await ctx.addInitScript((d) => {
    try {
      Object.keys(d).forEach((k) => {
        localStorage.setItem(k, typeof d[k] === 'string' ? d[k] : JSON.stringify(d[k]));
      });
    } catch (e) {}
  }, {
    lk_onboarded: 'true', lk_tutorialSeen: 'true',
    lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: true, weightKg: 82,
                  heightCm: 180, age: 31, sex: 'male', goal: 'maintain' },
    lk_splits: [{ id: 's1', name: 'PPL', created: '9/1/2026',
                  days: [day || { name: 'Push', blocks: [], exercises: DAY }] }],
    lk_history: PRIOR
  });
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
const has = (page, s, t) => page.evaluate(rootOf, [s, t]).then(Boolean);
const tap = (page, s, t) => page.evaluate(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = r && r.querySelector('[data-testid="' + t + '"]');
  if (!el) throw new Error('no ' + s + '/' + t);
  el.click();
}, [s, t]);
const textOf = (page, s, t) => page.evaluate(([s, t]) => {
  const rec = window.DEMO.screens[s];
  const r = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = r && r.querySelector('[data-testid="' + t + '"]');
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(none)';
}, [s, t]);
const splits = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_splits') || 'null'); } catch (e) { return null; }
});
const handed = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('lk_lastSession') || 'null'); } catch (e) { return null; }
});

/* A weight and reps typed on the keypad, which is the only way a lift
   with no history behind it can be logged at all. */
async function fill(page, e, i, kgv, reps) {
  for (const [field, val] of [['weight', kgv], ['reps', reps]]) {
    await tap(page, 'workout-log', 'cell-' + e + '-' + i + '-' + field);
    await page.waitForTimeout(250);
    for (const ch of String(val)) await tap(page, 'workout-log', 'pad-' + (ch === '.' ? 'dot' : ch));
    await tap(page, 'workout-log', 'pad-done');
    await page.waitForTimeout(250);
  }
}
/* Replace the first lift. Hold opens the exercise sheet on a phone and
   Enter opens it on a keyboard; Enter is the one a test can hold. */
async function swapFirst(page, repl) {
  await page.evaluate(() => {
    const rec = window.DEMO.screens['workout-log'];
    const r = rec.root || rec.host.shadowRoot;
    const el = r.querySelector('[data-testid="exercise-menu-0"]');
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
  });
  await page.waitForTimeout(400);
  await tap(page, 'workout-log', 'exact-swap');
  await page.waitForTimeout(500);
  await page.evaluate((nm) => {
    const rec = window.DEMO.screens['workout-log'];
    const r = rec.root || rec.host.shadowRoot;
    const q = r.querySelector('[data-testid="addex-search"]');
    q.value = nm; q.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }, repl.name);
  await page.waitForTimeout(500);
  await tap(page, 'workout-log', 'addex-pick-' + repl.id);
  await page.waitForTimeout(500);
}
async function tickFirstSets(page) {
  const n = await page.evaluate(() => {
    const rec = window.DEMO.screens['workout-log'];
    const r = rec.root || rec.host.shadowRoot;
    return r.querySelectorAll('[data-testid^="exercise-menu-"]').length;
  });
  for (let e = 0; e < n; e++) {
    await page.evaluate((e) => {
      const rec = window.DEMO.screens['workout-log'];
      const r = rec.root || rec.host.shadowRoot;
      const b = r.querySelector('[data-testid="done-' + e + '-0"]');
      if (b) b.click();
    }, e);
    await page.waitForTimeout(200);
  }
  return n;
}
async function startToday(page) {
  await page.evaluate(() => window.DEMO.go('train'));
  await page.waitForTimeout(700);
  await tap(page, 'train', 'start-today');
  await page.waitForTimeout(1300);
}
async function finish(page) {
  await tap(page, 'workout-log', 'btn-finish');
  await page.waitForTimeout(1500);
}

console.log('=== the day travels with the session ===\n');

let { ctx, page, errs } = await fresh();
const repl = await page.evaluate(() => {
  /* A replacement in the SAME SLOT, so the skip and the addition are one
     decision and draw one line rather than two. */
  const x = window.LKExercises.all().find((e) => e.muscle === 'Mid Chest' && e.id !== 111 && e.id < 1000);
  return { id: x.id, name: x.name };
});
await startToday(page);
ok((await textOf(page, 'workout-log', 'session-name')) === 'PPL - Push',
   'Start today opens the split day it names', await textOf(page, 'workout-log', 'session-name'));

const live = await page.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('lk_liveSessionRows') || '{}')).source || null; }
  catch (e) { return null; }
});
ok(!!live, 'the running session knows which split day it is');
ok(live && live.splitId === 's1' && live.dayId === 'push',
   'by id, so a rename does not lose it', live && live.splitId + ':' + live.dayId);
ok(live && live.planned.map((e) => e.id).join(',') === '111,302,311',
   'and it remembers what that day PLANNED, before any of it was changed',
   live && live.planned.map((e) => e.id).join(','));

await swapFirst(page, repl);
await fill(page, 0, 0, 50, 10);
await tickFirstSets(page);
await finish(page);

const rec = await handed(page);
ok(!!(rec && rec.source && rec.source.dayName === 'Push'),
   'and it survives the finish, into what Review reads',
   rec && rec.source && rec.source.dayName);

console.log('\n=== the offer ===\n');

/* THE OFFER IS A BUBBLE NOW, NOT A CARD. The owner's note on Review was
   that it opened with lines and lines of recap, and the biggest of those
   lines was this card: an icon row per difference, a paragraph of
   reasoning and up to three buttons. What is on the first page is a pill
   saying the day ran differently; the question itself is in a pop-up
   behind it. So what is checked is the pill, then the pop-up. */
ok(await has(page, 'review', 'section-split'), 'Review says the difference is there');
const bubble = await textOf(page, 'review', 'split-open');
ok(bubble.indexOf('Push ran differently') > -1,
   'named after the day, not "your split"', bubble);
ok(bubble.indexOf('1') > -1, 'and it carries how many things ran differently', bubble);
ok(!(await has(page, 'review', 'split-sheet')), 'nothing is open until it is tapped');

await tap(page, 'review', 'split-open');
await page.waitForTimeout(500);
ok(await has(page, 'review', 'split-sheet'), 'tapping it opens the pop-up');
const offer = await textOf(page, 'review', 'split-sheet');
ok(offer.indexOf('Save this as your Push day?') > -1,
   'which asks one question, in the reader\'s own words', offer.slice(0, 60));
const bullets = await textOf(page, 'review', 'split-bullets');
ok(bullets === repl.name + ' replaces Barbell Bench Press',
   'one bullet, one line, naming which lift replaced which', bullets);
ok(offer.indexOf('Save as your Push day') > -1, 'one button saves this version');
ok(offer.indexOf('Keep the previous version') > -1, 'the other keeps the one they had');
/* SIMPLISTIC WAS THE WORD, TWICE. No third route, no explanation
   paragraph, no checkbox per difference. */
const shape = await page.evaluate(() => {
  const rec = window.DEMO.screens['review'];
  const r = rec.root || rec.host.shadowRoot;
  const sh = r.querySelector('[data-testid="split-sheet"]');
  return {
    lines: sh ? sh.querySelectorAll('.bullets__li').length : -1,
    buttons: sh ? sh.querySelectorAll('.btn').length : -1,
    primaries: sh ? sh.querySelectorAll('.btn--primary').length : -1,
    picks: sh ? sh.querySelectorAll('[data-testid^="split-pick-"]').length : -1,
    radius: sh ? getComputedStyle(sh).getPropertyValue('corner-shape').trim() : '',
    bar: !!r.querySelector('[data-testid="action-save"].btn--primary')
  };
});
ok(shape.lines === 1, 'one line for one difference, and never more than two', String(shape.lines));
ok(shape.buttons === 2, 'two answers and nothing else', String(shape.buttons));
ok(shape.picks === 0, 'the per-change checkboxes are gone', String(shape.picks));
/* A squircle, out of the token the build already uses on every sheet,
   rather than a radius invented for this one pop-up. */
ok(shape.radius === '' || shape.radius.indexOf('squircle') > -1 ||
   shape.radius.indexOf('superellipse') > -1,
   'it is the build\'s own squircle, not a new shape', shape.radius || '(not supported here)');
/* One accent fill on the screen, and it is on Save session. A programme
   edit offered louder than the thing the reader came here to do would be
   a nag rather than an offer. */
ok(shape.primaries === 0, 'neither answer is the loud button on the screen', String(shape.primaries));
ok(shape.bar, 'the accent stays on Save session, which this never gates');

/* Closing is not answering. */
await tap(page, 'review', 'split-sheet-close');
await page.waitForTimeout(400);
ok(!(await has(page, 'review', 'split-sheet')), 'closing it shuts the pop-up');
ok(await has(page, 'review', 'split-open'), 'and the question can be opened again');
await tap(page, 'review', 'split-open');
await page.waitForTimeout(400);

console.log('\n=== taking it reaches lk_splits ===\n');

const before = await splits(page);
await tap(page, 'review', 'split-update');
await page.waitForTimeout(600);
const after = await splits(page);
const ids = after[0].days[0].exercises.map((e) => e.id);
ok(ids.join(',') === [repl.id, 302, 311].join(','),
   'the day is rewritten with the lift that was actually done', ids.join(','));
ok(after[0].days[0].exercises[0].name === repl.name,
   'carrying its name, so nothing has to look it up again', after[0].days[0].exercises[0].name);
ok(before[0].days[0].exercises.length === 3 && after[0].days[0].exercises.length === 3,
   'and the rest of the day is left alone');
ok(!!after[0].updated && after[0].updated !== before[0].updated,
   'the split is stamped edited, so Train\'s "edited" line stays honest', after[0].updated);
ok(!(await has(page, 'review', 'split-sheet')), 'and the pop-up closes behind the answer');
ok((await textOf(page, 'review', 'card-split-updated')).indexOf('replaces') > -1,
   'and it says what it did, by name', await textOf(page, 'review', 'card-split-updated'));

console.log('\n=== and it undoes ===\n');

await tap(page, 'review', 'split-undo');
await page.waitForTimeout(600);
const undone = await splits(page);
ok(undone[0].days[0].exercises.map((e) => e.id).join(',') === '111,302,311',
   'Undo puts the day back exactly as it was',
   undone[0].days[0].exercises.map((e) => e.id).join(','));
ok(undone[0].updated === before[0].updated,
   'timestamp included, so an undone edit is not an edit', String(undone[0].updated));
ok(await has(page, 'review', 'section-split'), 'and the question is open again');

console.log('\n=== asked once ===\n');

/* Answered, then the screen is reopened -- the edge-swipe back off Train
   is one tap away. It used to come back offering to write a change that
   had already been written. */
await tap(page, 'review', 'split-open');
await page.waitForTimeout(400);
await tap(page, 'review', 'split-keep');
await page.waitForTimeout(400);
ok(await has(page, 'review', 'split-kept'), 'keeping gets a quiet line, not a banner');
const keptSplits = await splits(page);
ok(keptSplits[0].days[0].exercises.map((e) => e.id).join(',') === '111,302,311',
   'and writes nothing at all to the plan');
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(600);
await page.evaluate(() => window.DEMO.go('review'));
await page.waitForTimeout(800);
ok(!(await has(page, 'review', 'section-split')),
   'and coming back to the same session does not ask again');
ok(errs.length === 0, 'no page errors on the road through', errs.slice(0, 2).join(' | '));
await ctx.close();

console.log('\n=== and it stays quiet when there is nothing to ask ===\n');

({ ctx, page, errs } = await fresh());
await startToday(page);
await tickFirstSets(page);
await finish(page);
ok(!(await has(page, 'review', 'section-split')),
   'a session that ran exactly to plan is not asked about');
ok((await textOf(page, 'review', 'session-totals')) !== '(none)',
   'though it is still reviewed like any other');
await ctx.close();

({ ctx, page, errs } = await fresh());
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(600);
await tap(page, 'train', 'quick-workout');
await page.waitForTimeout(500);
await tap(page, 'train', 'quick-skip');
await page.waitForTimeout(1100);
await page.evaluate(() => {
  /* One lift, logged, so there is a session to finish at all. */
  const rec = window.DEMO.screens['workout-log'];
  const r = rec.root || rec.host.shadowRoot;
  r.querySelector('[data-testid="btn-add-exercise"], [data-testid="empty-add"]').click();
});
await page.waitForTimeout(600);
await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const r = rec.root || rec.host.shadowRoot;
  const q = r.querySelector('[data-testid="addex-search"]');
  q.value = 'Barbell Bench Press';
  q.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
});
await page.waitForTimeout(500);
await tap(page, 'workout-log', 'addex-pick-111');
await page.waitForTimeout(500);
await tickFirstSets(page);
await finish(page);
const quickRec = await handed(page);
ok(quickRec && quickRec.type === 'quick', 'a quick workout is still a quick workout', quickRec && quickRec.type);
ok(!(quickRec && quickRec.source), 'it carries no split day, because it came from none');
ok(!(await has(page, 'review', 'section-split')),
   'and it is never asked whether to update a plan it was not on');
await ctx.close();

console.log('\n=== the other shape a day is stored in ===\n');

/* A phone that has been running LOCKED holds `exIds: [111, 302]` on each
   day, not the builder's resolved exercises. Reading only the second
   opened an EMPTY session off a real user's Push day, and would have
   read every one of those days as planning nothing -- so a session that
   ran exactly to plan would have been reported as three additions. */
({ ctx, page, errs } = await fresh({ name: 'Push', blocks: [], exIds: [111, 302, 311] }));
await startToday(page);
const loaded = await page.evaluate(() => {
  const rec = window.DEMO.screens['workout-log'];
  const r = rec.root || rec.host.shadowRoot;
  return [...r.querySelectorAll('[data-testid^="exercise-menu-"]')].length;
});
ok(loaded === 3, 'a day stored as bare ids opens with its three lifts in it', String(loaded));
await swapFirst(page, repl);
await fill(page, 0, 0, 50, 10);
await tickFirstSets(page);
await finish(page);
ok(await has(page, 'review', 'section-split'), 'the difference is found in that shape too');
await tap(page, 'review', 'split-open');
await page.waitForTimeout(400);
await tap(page, 'review', 'split-update');
await page.waitForTimeout(600);
const idShape = (await splits(page))[0].days[0];
ok((idShape.exIds || []).join(',') === [repl.id, 302, 311].join(','),
   'and it is written back as ids, the shape the day already had',
   (idShape.exIds || []).join(','));
/* A day that starts as bare ids ends up carrying both shapes, because the
   store hydrates one from the other on the way past. That is fine as long
   as they never disagree: Train reads one, the split builder reads the
   other, and a half-written day shows five lifts on one screen and two on
   the next. */
ok((idShape.exercises || []).map((e) => e.id).join(',') === (idShape.exIds || []).join(','),
   'and the two shapes of the same day agree, lift for lift',
   (idShape.exercises || []).map((e) => e.id).join(','));
ok((idShape.exercises || []).every((e) => e.name && e.group),
   'each one carrying the name and the group a split day is read by',
   JSON.stringify((idShape.exercises || [])[0]));
await ctx.close();

console.log('\n=== a plan that is gone is not offered ===\n');

({ ctx, page, errs } = await fresh());
await startToday(page);
await swapFirst(page, repl);
await fill(page, 0, 0, 50, 10);
await tickFirstSets(page);
/* Deleted mid-session, which is the honest version of "deleted between
   the session and the review": the session is already running and the
   split it came from stops existing. */
await page.evaluate(() => localStorage.setItem('lk_splits', '[]'));
await finish(page);
ok(!(await has(page, 'review', 'section-split')),
   'a session whose split has been deleted is not offered a writeback');
ok((await textOf(page, 'review', 'session-totals')) !== '(none)',
   'and the session itself is reviewed and saveable as ever');
ok(errs.length === 0, 'and nothing threw looking for the day', errs.slice(0, 2).join(' | '));
await ctx.close();

console.log('\n=== the same lifts in another order ===\n');

/* Its own kind of difference, with its own verb. Reordering by hand
   through the drag handles is a gesture test; what matters here is that
   the detection calls it an order change rather than dressing it up as
   three swaps, and that taking it rewrites the order and nothing else. */
({ ctx, page, errs } = await fresh());
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
}, DAY);
await page.evaluate(() => window.DEMO.go('review'));
await page.waitForTimeout(900);
ok((await textOf(page, 'review', 'split-open')).indexOf('1') > -1,
   'one change, not three swaps', await textOf(page, 'review', 'split-open'));
await tap(page, 'review', 'split-open');
await page.waitForTimeout(500);
const orderText = await textOf(page, 'review', 'split-bullets');
ok(orderText === 'A different order', 'it is called an order change', orderText);
ok((await textOf(page, 'review', 'split-sheet')).indexOf('Save as your Push day') > -1,
   'and the button says what it saves');
await tap(page, 'review', 'split-update');
await page.waitForTimeout(600);
const reordered = (await splits(page))[0].days[0].exercises.map((e) => e.id);
ok(reordered.join(',') === '311,111,302',
   'taking it rewrites the order and keeps every lift', reordered.join(','));
ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
await ctx.close();

console.log('\n=== how it was trained, not only what was trained ===\n');

/* THE WRITE-BACK DID NOT CARRY SETS OR REPS. The difference was which
   lifts were in the day and nothing else, so a day prescribing three
   sets where four were done registered as no difference at all, and a
   day reading 3 x 8 went on reading 3 x 8 through a month of 3 x 10.
   The owner's own example of a line this pop-up should show was "minus
   five sets", which the old detection had no way to produce. */
const PRESCRIBED = [
  { id: 111, name: 'Barbell Bench Press', group: 'Chest', muscle: 'Mid Chest', sets: 3, reps: '8' },
  { id: 302, name: 'DB Shoulder Press', group: 'Shoulders', muscle: 'Front Delt', sets: 3, reps: '8-12' },
  { id: 311, name: 'Lateral Raise', group: 'Shoulders', muscle: 'Side Delt', sets: 3, reps: 'AMRAP' }
];

/* A finished session over a day, written straight in: `counts` is how
   many working sets each lift got and `reps` is how many reps in each of
   them, so a scenario is two short arrays rather than forty taps. */
async function handOver(page, day, counts, reps) {
  await page.evaluate(([day, counts, reps]) => {
    const exercises = day.map((e, x) => ({
      id: e.id, name: e.name, muscle: e.muscle,
      sets: Array.from({ length: counts[x] }, () => (
        { kg: 60, reps: reps[x], rir: 2, warm: false, done: true }))
    }));
    localStorage.setItem('lk_lastSession', JSON.stringify({
      title: 'PPL - Push', type: 'split', note: '', dateISO: '2026-09-18',
      sets: counts.reduce((a, b) => a + b, 0), warmups: 0, volumeKg: 2000, minutes: 40,
      lifts: day.map((e, x) => ({ id: e.id, name: e.name, sets: counts[x],
                                  vol: 60 * reps[x] * counts[x], top: [60, reps[x]] })),
      exercises: exercises,
      source: { splitId: 's1', splitName: 'PPL', dayId: 'push', dayName: 'Push', planned: day }
    }));
  }, [day, counts, reps]);
  await page.evaluate(() => window.DEMO.go('review'));
  await page.waitForTimeout(900);
}

({ ctx, page, errs } = await fresh({ name: 'Push', blocks: [], exercises: PRESCRIBED }));
/* Bench: four sets of ten where the day asks for three of eight.
   Shoulder press: ten reps, inside its own 8-12, so nothing to say.
   Lateral raise: AMRAP, which has no figure to miss. */
await handOver(page, PRESCRIBED, [4, 3, 3], [10, 10, 14]);
ok(await has(page, 'review', 'section-split'),
   'a day trained in different sets and reps is a difference now');
await tap(page, 'review', 'split-open');
await page.waitForTimeout(500);
const presText = await textOf(page, 'review', 'split-bullets');
ok(presText.indexOf('Barbell Bench Press +1 set') > -1,
   'a changed set count reads as a signed count, the way the owner said it', presText);
ok(presText.indexOf('Barbell Bench Press 10 reps, not 8') > -1,
   'and a changed rep count names both figures', presText);
ok(presText.indexOf('DB Shoulder Press') === -1,
   'reps inside the range the day asked for are not a difference', presText);
ok(presText.indexOf('Lateral Raise') === -1,
   'and AMRAP has no figure to miss, so it never draws a line', presText);
await tap(page, 'review', 'split-update');
await page.waitForTimeout(700);
const rewritten = (await splits(page))[0].days[0].exercises;
const byId = {};
rewritten.forEach((e) => { byId[e.id] = e.sets + '/' + e.reps; });
ok(byId['111'] === '4/10', 'the day now prescribes what was actually trained', JSON.stringify(byId));
ok(byId['302'] === '3/8-12' && byId['311'] === '3/AMRAP',
   'and the lifts that ran to plan keep the prescription they had', JSON.stringify(byId));
ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
await ctx.close();

/* The owner's own example, the other way round. */
({ ctx, page, errs } = await fresh({ name: 'Push', blocks: [], exercises: [
  { id: 111, name: 'Barbell Bench Press', group: 'Chest', muscle: 'Mid Chest', sets: 8, reps: '8' },
  PRESCRIBED[1], PRESCRIBED[2]] }));
await handOver(page, [
  { id: 111, name: 'Barbell Bench Press', group: 'Chest', muscle: 'Mid Chest', sets: 8, reps: '8' },
  PRESCRIBED[1], PRESCRIBED[2]], [3, 3, 3], [8, 10, 14]);
await tap(page, 'review', 'split-open');
await page.waitForTimeout(500);
ok((await textOf(page, 'review', 'split-bullets')).indexOf('Barbell Bench Press −5 sets') > -1,
   'five sets fewer than the day asked for reads as minus five sets',
   await textOf(page, 'review', 'split-bullets'));
await ctx.close();

console.log('\n=== a day that prescribes nothing is never corrected ===\n');

/* Most days on most phones carry no sets and no reps. There is no honest
   guess at what somebody else meant to do, so a lift with nothing
   written down produces no line and the write-back invents none. */
({ ctx, page, errs } = await fresh());
await handOver(page, DAY, [5, 1, 4], [15, 3, 9]);
ok(!(await has(page, 'review', 'section-split')),
   'a session over an unprescribed day is not asked about at all');
ok((await textOf(page, 'review', 'session-totals')) !== '(none)',
   'and it is reviewed like any other');
const untouched = (await splits(page))[0].days[0].exercises;
ok(untouched.every((e) => e.sets === undefined && e.reps === undefined),
   'nothing wrote a prescription nobody asked for', JSON.stringify(untouched[0]));
ok(errs.length === 0, 'no page errors', errs.slice(0, 2).join(' | '));
await ctx.close();

await br.close();
site.close();
console.log(fails === 0
  ? '\nsplit-writeback: all ' + checks + ' checks passed'
  : '\nsplit-writeback: ' + fails + ' of ' + checks + ' FAILED');
process.exit(fails ? 1 : 0);
