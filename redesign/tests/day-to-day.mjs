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
const APP = 'file://' + path.join(ROOT, '10-final/locked-app.html');

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
let saved = await tap('action-save');
if (saved !== 'ok') saved = await tap('action-done');
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

/* AND IT SURVIVES A RELOAD. Everything above is in localStorage; a phone
   that reloads must come back to the same account, not a blank one. */
errs.length = 0;
await page.reload();
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 9000 });
await page.waitForTimeout(900);
const back = await raw('lk_history');
ok(Array.isArray(back) && back.length === 2, 'the history is still there after a reload',
   (back || []).length + ' rows');
if ((back || []).length !== 2) {
  console.log('DIAG', JSON.stringify(await page.evaluate(() => ({
    seeded: localStorage.getItem('lk_seeded'),
    changed: localStorage.getItem('lk_changedAt'),
    removed: localStorage.getItem('lk_removedKeys'),
    schema: localStorage.getItem('lk_schema'),
    hist: localStorage.getItem('lk_history'),
    keys: Object.keys(localStorage).sort().join(','),
    fuel: localStorage.getItem('lk_fuelLog')
  })), null, 1));
}
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
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
