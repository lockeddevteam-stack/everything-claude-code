/* A DAY IN THE APP, ON THE PRODUCT BUILD.

   Not "does the screen render" -- does the thing a person opens the app
   to do actually work, end to end, and does the rest of the app agree
   with it afterwards. Logging a workout and logging food are the two
   that matter most, so they come first and are checked hardest: the
   figures are read back out of the store, not off the screen that just
   claimed them.

   Everything runs against app/ -- the product build, no seed -- because
   a seeded demo can pass every one of these while the real thing fails.
   The account is a returning reader with a split and some history, which
   is what most days look like. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
/* OVER HTTP, NOT file://. Chromium hands a file:// document a fresh
   localStorage on some reloads -- the whole day's work came back wiped and
   re-seeded about two runs in five, which is indistinguishable from the app
   losing it. The product is served over https anyway, so a one-file static
   server is both the stable harness and the honest one. */
const APP_FILE = path.join(ROOT, '10-final/locked-app.html');
const { createServer } = await import('node:http');
const { readFile } = await import('node:fs/promises');
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(APP_FILE);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const APP = 'http://127.0.0.1:' + server.address().port + '/';

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const TODAY = new Date().toISOString().slice(0, 10);
const ACCOUNT = {
  lk_onboarded: 'true', lk_tutorialSeen: 'true',
  lk_profile: { username: 'cesco', displayName: 'cesco', useKg: true,
                weightKg: 57.2, heightCm: 170, age: 31, sex: 'male', goal: 'maintain' },
  /* The shape the split builder and onboarding actually write: each day
     carries `exercises`, objects with an id, a name and a muscle. An
     earlier version of this fixture used `exIds`, which splitDayFor cannot
     read, so the log opened empty and every figure below it was luck. */
  lk_splits: [{ id: 's1', name: 'PPL', created: '9/7/2026', days: [
    { name: 'Push', blocks: [], exercises: [
      { id: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest' },
      { id: 311, name: 'Cable Lateral Raise', group: 'Shoulders', muscle: 'Side Delt' }] },
    { name: 'Pull', blocks: [], exercises: [
      { id: 106, name: 'Lat Pulldown', group: 'Back', muscle: 'Lats' }] }] }],
  lk_history: [{ name: 'PPL - Push', date: '2026-09-07', kind: 'lift', kg: 3608, min: 39, sets: 12,
                 exercises: [{ id: 104, name: 'Incline Machine Press',
                               sets: [{ kg: 60, reps: 8, done: true }] }] }],
  lk_prs: [{ exId: 104, name: 'Incline Machine Press', group: 'Chest', muscle: 'Upper Chest',
             kg: 60, reps: 8, date: '2026-09-07' }]
};

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
/* ONCE, not on every navigation. addInitScript runs again on reload, so
   seeding unconditionally put the fixture back over the day's work and made
   a passing reload check impossible to tell from a failing one. */
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
/* Stand in for the food endpoint: this is about the app's behaviour, not
   the Worker's uptime. */
await page.route('**/food-search*', (r) => r.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ items: [{ name: 'Coconut water', cal: 19, pro: 0.7, carb: 3.7, fat: 0.2 }] })
}));

await page.goto(APP);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 9000 });
await page.waitForTimeout(800);

const shown = () => page.evaluate(() => {
  const s = window.DEMO.screens;
  return Object.keys(s).find((k) => {
    const h = s[k] && s[k].host; if (!h || !h.getBoundingClientRect) return false;
    const b = h.getBoundingClientRect();
    return getComputedStyle(h).display !== 'none' && b.width > 0 && b.height > 0;
  }) || 'none';
});
const text = (id) => page.evaluate((k) => {
  const rec = window.DEMO.screens[k];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return root ? (root.textContent || '').replace(/\s+/g, ' ').trim() : '';
}, id);
const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable:' + t; }
  return 'ok';
};
const raw = (k) => page.evaluate((key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}, k);

console.log('=== logging a workout ===\n');
errs.length = 0;
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
ok((await shown()) === 'train', 'Train opens', await shown());

const started = await tap('start-today');
ok(started === 'ok', "today's session starts", started);
await page.waitForTimeout(900);
ok((await shown()) === 'workout-log', 'the log opens', await shown());

const cell = await tap('cell-0-0-weight');
ok(cell === 'ok', 'a weight cell opens', cell);
await page.waitForTimeout(350);
for (const d of ['pad-8', 'pad-0']) { await tap(d); await page.waitForTimeout(110); }
ok((await tap('pad-done')) === 'ok', 'the pad commits the weight');
await page.waitForTimeout(350);
const rcell = await tap('cell-0-0-reps');
ok(rcell === 'ok', 'a reps cell opens', rcell);
await page.waitForTimeout(300);
await tap('pad-6'); await tap('pad-done');
await page.waitForTimeout(350);
ok((await tap('done-0-0')) === 'ok', 'the set ticks off');
await page.waitForTimeout(400);

const rec = await raw('lk_liveSession');
ok(!!rec && !!rec.startedAt, 'the session is on the record, so it survives a reload',
   JSON.stringify(rec || null));
const live = await raw('lk_liveSessionRows');
const loggedSet = live && live.exercises && live.exercises[0] && live.exercises[0].sets[0];
ok(!!loggedSet && loggedSet.kg === 80 && loggedSet.reps === 6,
   'the set is held as 80 kg x 6', JSON.stringify(loggedSet || null));
ok(!errs.length, 'nothing throws while logging', errs[0] || '');

errs.length = 0;
ok((await tap('btn-finish')) === 'ok', 'the session finishes');
await page.waitForTimeout(1000);
ok((await shown()) === 'review', 'review opens with it', await shown());
/* action-save only. Accepting action-done as a fallback hid the fact that
   the bar was still showing the PREVIOUS session's "Saved to history". */
const saved = await tap('action-save');
ok(saved === 'ok', 'and it saves', saved);
await page.waitForTimeout(1000);

const hist = await raw('lk_history');
ok(Array.isArray(hist) && hist.length === 2, 'the session joins the history', (hist || []).length + ' rows');
const fresh = (hist || [])[0] || {};
ok(fresh.date === TODAY, "dated today, not the fixture's day", String(fresh.date));
ok(fresh.kg === 480, 'with 80 x 6 = 480 kg of volume', String(fresh.kg));
ok(!(await raw('lk_liveSession')), 'and nothing is left running');
ok(!errs.length, 'nothing throws while saving', errs[0] || '');

/* and the rest of the app agrees */
for (const [route, want] of [['home', '480'], ['train', null], ['progress', null]]) {
  errs.length = 0;
  await page.evaluate((n) => window.DEMO.go(n), route);
  await page.waitForTimeout(500);
  const t = await text(route);
  ok(!errs.length && t.length > 40, `${route} still opens after the session`, errs[0] || (t.length + ' chars'));
  ok(!/undefined|NaN|\[object Object\]|Invalid Date/.test(t), `${route} shows no hole`);
}

console.log('\n=== logging food ===\n');
errs.length = 0;
await page.evaluate(() => window.DEMO.go('fuel'));
await page.waitForTimeout(700);
ok((await shown()) === 'fuel', 'Fuel opens', await shown());
const t0 = await text('fuel');
ok(!/undefined|NaN/.test(t0), 'and shows no hole before anything is logged');

/* by name, through the search field */
let opened = await tap('log-search');
if (opened !== 'ok') opened = await tap('foods-search');
ok(opened === 'ok', 'the food search opens', opened);
await page.waitForTimeout(600);
const typed = await page.evaluate(() => {
  const rec = window.DEMO.screens['fuel'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const i = root && root.querySelector('[data-testid="search-input"]');
  if (!i) return 'no field';
  i.focus(); i.value = 'chicken';
  i.dispatchEvent(new Event('input', { bubbles: true }));
  i.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
});
ok(typed === 'ok', 'a food name can be typed', typed);
await page.waitForTimeout(900);
const hits = await page.evaluate(() => {
  const rec = window.DEMO.screens['fuel'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return root.querySelectorAll('[data-testid^="search-hit"], [data-action="pick-food"]').length;
});
ok(hits > 0, 'and the search offers something to log', hits + ' hits');
ok(!errs.length, 'nothing throws searching for food', errs[0] || '');

/* ONE TAP LOGS IT. A search that finds a food and cannot log it is a
   search, not a food log, so the figure is read back out of the diary
   rather than off the sheet that claimed it. */
errs.length = 0;
const logged = await tap('search-hit-0');
ok(logged === 'ok', 'the first hit logs in one tap', logged);
await page.waitForTimeout(800);
const diary = await raw('lk_fuelLog');
const day = (diary && diary[TODAY]) || null;
ok(!!day, "the diary gains today's entry", JSON.stringify(diary || {}).slice(0, 120));
const flat = JSON.stringify(day || {});
ok(/kcal|cal/i.test(flat) && flat.length > 20, 'with the food in it', flat.slice(0, 200));
const fuelText = await text('fuel');
ok(!/undefined|NaN|\[object Object\]/.test(fuelText), 'and Fuel shows no hole after logging');
ok(!errs.length, 'nothing throws logging food', errs[0] || '');

/* SENTENCE ENTRY. "coconut water" is not in the local table; the remote
   lookup has to fill it rather than leaving "nothing in the table matches
   this" on screen, which is what a reader reported. */
errs.length = 0;
const mic = await tap('log-mic');
if (mic === 'ok') {
  await page.waitForTimeout(600);
  const said = await page.evaluate(() => {
    const rec = window.DEMO.screens['fuel'];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    const i = root && root.querySelector('textarea, [data-testid="mic-text"], [data-testid="say-input"]');
    if (!i) return 'no field';
    i.focus(); i.value = 'a glass of coconut water';
    i.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  });
  ok(said === 'ok', 'a sentence can be typed', said);
  await page.waitForTimeout(1600);
  const sheet = await text('fuel');
  ok(!/nothing in the table matches/i.test(sheet),
     'and an unknown food is looked up, not refused');
}
ok(!errs.length, 'nothing throws on sentence entry', errs[0] || '');

/* MANUAL ENTRY. The packet in your hand is the case the food table cannot
   cover, and it is the fallback every other route offers. */
errs.length = 0;
/* The sentence sheet is still up from the step above. Escape closes
   whatever is open, which is what a reader does too. */
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
let man = await tap('log-search');
if (man === 'ok') { await page.waitForTimeout(500); man = await tap('search-manual'); }
ok(man === 'ok', 'the manual sheet opens', man);
await page.waitForTimeout(500);
const filled = await page.evaluate(() => {
  const rec = window.DEMO.screens['fuel'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const set = (id, v) => {
    const e = root && root.querySelector('[data-testid="' + id + '"]');
    if (!e) return false;
    e.focus(); e.value = v;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  const names = ['mn-name', 'mn-kcal', 'mn-pro', 'mn-carb', 'mn-fat'];
  const vals = ['Protein bar', '210', '20', '21', '7'];
  return names.map((n, i) => set(n, vals[i]) ? n : 'missing:' + n).join(',');
});
ok(!/missing:mn-name/.test(filled), 'its fields take values', filled);
await page.waitForTimeout(300);
const added = await tap('mn-add');
ok(added === 'ok', 'and it logs', added);
await page.waitForTimeout(700);
const d2 = await raw('lk_fuelLog');
ok(/Protein bar/.test(JSON.stringify(d2 || {})), 'the hand-typed food reaches the diary');
ok(!errs.length, 'nothing throws on manual entry', errs[0] || '');

console.log('\n=== a longer workout ===\n');

/* MORE THAN ONE SET AND MORE THAN ONE LIFT. One set proves the pad; a
   workout is several, and the totals have to add up across both. */
errs.length = 0;
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
ok((await tap('start-today')) === 'ok', 'a session starts for the longer run');
await page.waitForTimeout(900);
const pad = async (cell, digits) => {
  await tap(cell); await page.waitForTimeout(250);
  for (const d of digits) { await tap('pad-' + d); await page.waitForTimeout(90); }
  await tap('pad-done'); await page.waitForTimeout(250);
};
await pad('cell-0-0-weight', ['7', '0']);
await pad('cell-0-0-reps', ['1', '0']);
await tap('done-0-0'); await page.waitForTimeout(300);
await pad('cell-0-1-weight', ['7', '5']);
await pad('cell-0-1-reps', ['8']);
await tap('done-0-1'); await page.waitForTimeout(300);
await pad('cell-1-0-weight', ['1', '2']);
await pad('cell-1-0-reps', ['1', '5']);
await tap('done-1-0'); await page.waitForTimeout(400);
const rows2 = await raw('lk_liveSessionRows');
const e0 = rows2 && rows2.exercises && rows2.exercises[0];
const e1 = rows2 && rows2.exercises && rows2.exercises[1];
ok(!!e0 && e0.sets[0].kg === 70 && e0.sets[0].reps === 10 &&
   e0.sets[1].kg === 75 && e0.sets[1].reps === 8,
   'two sets on the first lift are held separately',
   JSON.stringify(e0 ? e0.sets.slice(0, 2) : null));
ok(!!e1 && e1.sets[0].kg === 12 && e1.sets[0].reps === 15,
   'and the second lift keeps its own', JSON.stringify(e1 ? e1.sets[0] : null));
ok(!errs.length, 'nothing throws across two lifts', errs[0] || '');

ok((await tap('btn-finish')) === 'ok', 'it finishes');
await page.waitForTimeout(1200);
ok((await shown()) === 'review', 'review opens on the longer session', await shown());
const sv2 = await tap('action-save');
ok(sv2 === 'ok', 'and Save is offered for it, not the last one\u2019s "Saved"', sv2);
await page.waitForTimeout(1000);
const h2 = await raw('lk_history');
const top = (h2 || [])[0] || {};
/* 70x10 + 75x8 + 12x15 = 700 + 600 + 180 = 1480 */
ok(top.kg === 1480, 'the volume adds up across both lifts', String(top.kg));
ok(top.sets === 3, 'and all three working sets are counted', String(top.sets));
ok(!errs.length, 'nothing throws saving the longer session', errs[0] || '');

console.log('\n=== the rest of the day ===\n');

/* THE WEIGHT SHEET, COLD. The row is on Progress whether or not you have
   ever weighed in, and opening it read row [-1] and took the screen down. */
errs.length = 0;
await page.evaluate(() => window.DEMO.go('progress'));
await page.waitForTimeout(600);
const wt = await tap('row-body-weight');
ok(wt === 'ok', 'the body-weight row opens', wt);
await page.waitForTimeout(500);
const wtext = await text('progress');
ok(!errs.length, 'and it does not crash with no weigh-ins', errs[0] || '');
ok(/No weigh-ins yet/.test(wtext), 'it invites the first reading instead');
const wlog = await tap('weight-log');
await page.waitForTimeout(400);
ok(wlog === 'ok', 'a weight can be logged from it', wlog);

/* COACH, NEW CHAT. A reader reported it crashing on open. */
errs.length = 0;
await page.evaluate(() => window.DEMO.go('coach'));
await page.waitForTimeout(800);
ok((await shown()) === 'coach', 'Coach opens', await shown());
const ctext = await text('coach');
ok(!errs.length && ctext.length > 40, 'without throwing', errs[0] || (ctext.length + ' chars'));
ok(!/undefined|NaN|\[object Object\]/.test(ctext), 'and shows no hole');

/* EVERY TAB, ONE PASS. Nothing here should throw on a real account. */
for (const r of ['home', 'train', 'fuel', 'progress', 'coach', 'exercise-library', 'profile']) {
  errs.length = 0;
  try { await page.evaluate((n) => window.DEMO.go(n), r); } catch (e) {}
  await page.waitForTimeout(450);
  const t = await text(r);
  ok(!errs.length, `${r} opens clean`, errs[0] || '');
  ok(!/undefined|NaN|\[object Object\]|Invalid Date/.test(t), `${r} shows no hole`);
}

/* A CUSTOM EXERCISE. A lift the catalogue does not have is the first thing
   anyone with a machine nobody names goes looking for, and it has to be
   usable in a session afterwards, not just listed. */
errs.length = 0;
await page.evaluate(() => window.DEMO.go('exercise-library'));
await page.waitForTimeout(700);
/* The create button lives on the Custom filter and on the no-results
   empty state, not on the default browse view. */
let toCustom = await tap('filter-custom');
if (toCustom !== 'ok') toCustom = await tap('show-customs');
ok(toCustom === 'ok', 'the library offers its custom shelf', toCustom);
await page.waitForTimeout(600);
const openCreate = await tap('create-custom');
ok(openCreate === 'ok', 'the create sheet opens', openCreate);
await page.waitForTimeout(500);
const named = await page.evaluate(() => {
  const rec = window.DEMO.screens['exercise-library'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const i = root && root.querySelector('[data-testid="create-name"]');
  if (!i) return 'no field';
  i.focus(); i.value = 'Hammer decline press';
  i.dispatchEvent(new Event('input', { bubbles: true }));
  i.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
});
ok(named === 'ok', 'it takes a name', named);
await page.waitForTimeout(300);
const madeIt = await tap('create-save');
ok(madeIt === 'ok', 'and saves', madeIt);
await page.waitForTimeout(700);
const customs = await raw('lk_customEx');
ok(Array.isArray(customs) && customs.some((c) => /Hammer decline/.test(c.name || '')),
   'the custom lift is on the phone', JSON.stringify(customs || []).slice(0, 140));
const libText = await text('exercise-library');
ok(/Hammer decline/.test(libText), 'and in the library that made it');
ok(!errs.length, 'nothing throws making a custom lift', errs[0] || '');

/* DISCARDING. A session abandoned must leave nothing running, or the app
   offers to resume a workout that was thrown away. */
errs.length = 0;
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
ok((await tap('start-today')) === 'ok', 'a session starts to be discarded');
await page.waitForTimeout(900);
ok(!!(await raw('lk_liveSession')), 'it is running');
const disc = await tap('btn-discard');
ok(disc === 'ok', 'discard is offered', disc);
await page.waitForTimeout(500);
/* Discard asks first. Confirm whichever way this build words it. */
for (const t of ['discard-confirm', 'action-discard-confirm', 'confirm-discard']) {
  if ((await tap(t)) === 'ok') break;
}
await page.waitForTimeout(700);
ok(!(await raw('lk_liveSession')), 'and nothing is left running after it',
   JSON.stringify(await raw('lk_liveSession')));
const h3 = await raw('lk_history');
ok((h3 || []).length === 3, 'a discarded session writes no history row',
   (h3 || []).length + ' rows');
ok(!errs.length, 'nothing throws discarding', errs[0] || '');

/* AND IT SURVIVES A RELOAD. Everything above is in localStorage; a phone
   that reloads must come back to the same account, not a blank one. */
errs.length = 0;
await page.reload();
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 9000 });
await page.waitForTimeout(900);
const back = await raw('lk_history');
ok(Array.isArray(back) && back.length === 3, 'both sessions are still there after a reload',
   (back || []).length + ' rows');
ok(!errs.length, 'and nothing throws on the way back in', errs[0] || '');

/* THE RELOAD THAT MATTERS: mid-session. A phone that reloads during a
   workout -- a call, a lock, the browser reclaiming the tab -- must come
   back to the same sets. This is the contract the live-session record
   exists for, and it was silently dead in the product build. */
console.log('\n=== a reload mid-workout ===\n');
errs.length = 0;
await page.evaluate(() => window.DEMO.go('train'));
await page.waitForTimeout(500);
ok((await tap('start-today')) === 'ok', 'a second session starts');
await page.waitForTimeout(900);
await tap('cell-0-0-weight'); await page.waitForTimeout(300);
for (const d of ['pad-6', 'pad-0']) { await tap(d); await page.waitForTimeout(100); }
await tap('pad-done'); await page.waitForTimeout(300);
await tap('cell-0-0-reps'); await page.waitForTimeout(300);
await tap('pad-8'); await tap('pad-done'); await page.waitForTimeout(400);
const mid = await raw('lk_liveSession');
ok(!!mid && !!mid.startedAt, 'it is on the record mid-workout', JSON.stringify(mid || null));

await page.reload();
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 9000 });
await page.waitForTimeout(1000);
const after = await raw('lk_liveSession');
ok(!!after && after.startedAt === mid.startedAt, 'the record survives the reload',
   JSON.stringify(after || null));
const rows = await raw('lk_liveSessionRows');
const kept = rows && rows.exercises && rows.exercises[0] && rows.exercises[0].sets[0];
ok(!!kept && kept.kg === 60 && kept.reps === 8,
   'and the set comes back with it, not as a blank row', JSON.stringify(kept || null));
const shelf = await page.evaluate(() => {
  const rec = window.DEMO.screens['home'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const e = root && root.querySelector('.shelf, [data-testid*="shelf"]');
  return e ? e.textContent.replace(/\s+/g, ' ').trim() : 'no shelf';
});
ok(/PPL - Push/.test(shelf) && /Resume/.test(shelf),
   'and Home offers it back on the shelf', shelf);
ok(!errs.length, 'nothing throws coming back mid-session', errs[0] || '');

await br.close();
server.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
