/* THE SEAM, AGAINST THE SERVER THAT ACTUALLY EXISTS.

   supabase.co and workers.dev are unreachable from this container, so
   this stands up a server on localhost that mirrors the real one: the
   same routes, the same column names, the same conflict rule, the same
   reply shape. A mirror only proves anything if it is built from what
   the live backend does rather than from what cloud.js hopes, so every
   shape below was read off the live project and the deployed Worker:

     user_data(user_id, key, value jsonb, changed_at bigint)
       unique (user_id, key), RLS auth.uid() = user_id
     store_push(rows jsonb) -> integer
       writes a row only when its changed_at beats the stored one
     profiles(subscription_status, current_plan, plan_expires_at,
              trial_ends_at)
     POST / on the Worker -> { content: [{ type:'text', text }] }
       and { gated: true, limit } when the free ten a day are spent

   The one thing a mirror cannot prove is that the live server behaves
   this way. That half is proven against the live project directly: the
   migration that added changed_at and store_push, and the grants that
   keep a signed-out caller out of it. */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* ---- the mirror ---------------------------------------------------- */
const TOKEN = 'jwt-for-ada';
const UID = 'ada';
let table = [];            /* user_data rows */
let profile = null;        /* the profiles row */
let coachReply = '';       /* what the model says next */
let coachGated = false;
const seen = [];           /* every request, so the suite can assert headers */

function body(req) {
  return new Promise(res => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => res(b)); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const raw = await body(req);
  const json = raw ? JSON.parse(raw) : {};
  seen.push({ path: url.pathname, method: req.method, headers: req.headers, body: json });
  const send = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const signedIn = (req.headers.authorization || '') === 'Bearer ' + TOKEN;

  if (url.pathname === '/auth/v1/token') {
    if (json.password !== 'right') return send(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
    return send(200, { access_token: TOKEN, expires_at: Math.floor(Date.now() / 1000) + 3600,
                       user: { id: UID, email: json.email } });
  }
  if (url.pathname === '/auth/v1/signup') {
    return send(200, { access_token: TOKEN, expires_at: Math.floor(Date.now() / 1000) + 3600,
                       user: { id: UID, email: json.email } });
  }
  if (url.pathname === '/auth/v1/logout') return send(204, {});
  if (url.pathname === '/auth/v1/resend') {
    if (json.type !== 'signup' || !json.email) return send(422, { msg: 'Bad resend' });
    return send(200, {});
  }
  if (url.pathname === '/auth/v1/user' && req.method === 'PUT') {
    if (!signedIn) return send(401, { msg: 'not signed in' });
    if (String(json.password || '').length < 8) return send(422, { msg: 'Password too short' });
    return send(200, { id: UID, email: 'ada@example.com' });
  }

  if (url.pathname === '/rest/v1/rpc/store_push') {
    /* The RPC is SECURITY DEFINER and raises when auth.uid() is null. */
    if (!signedIn) return send(401, { message: 'not signed in' });
    let n = 0;
    (json.rows || []).forEach(r => {
      if (!r.key || !/^[0-9]+$/.test(String(r.changed_at))) return;
      const value = r.deleted ? null : r.value;
      const hit = table.find(t => t.key === r.key);
      if (!hit) { table.push({ key: r.key, value, changed_at: Number(r.changed_at) }); n++; return; }
      if (hit.changed_at < Number(r.changed_at)) { hit.value = value; hit.changed_at = Number(r.changed_at); n++; }
    });
    return send(200, n);
  }
  if (url.pathname === '/rest/v1/user_data') {
    if (!signedIn) return send(200, []);   /* RLS: no rows, not an error */
    return send(200, table.map(r => ({ key: r.key, value: r.value, changed_at: r.changed_at })));
  }
  if (url.pathname === '/rest/v1/profiles') {
    if (!signedIn) return send(200, []);
    return send(200, profile ? [profile] : []);
  }
  if (url.pathname === '/push/key') return send(200, { publicKey: 'BFakeKeyForTheMirror-0123456789abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWX' });
  if (url.pathname === '/push/subscribe') {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(json.deviceId || ''))) return send(400, { error: 'Bad device id' });
    return send(200, { ok: true });
  }
  if (url.pathname === '/push/prefs') {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(json.deviceId || ''))) return send(400, { error: 'Bad device id' });
    return send(200, { ok: true, prefs: json.prefs });
  }
  if (url.pathname === '/push/unsubscribe') return send(200, { ok: true });
  if (url.pathname === '/push/idle') {
    if (!(json.seconds >= 60 && json.seconds <= 21600)) return send(400, { error: 'Bad duration' });
    return send(200, { ok: true, at: Date.now() + json.seconds * 1000 });
  }
  if (url.pathname === '/push/idle/cancel') return send(200, { ok: true });
  if (url.pathname === '/analyze-meal') {
    return send(200, { content: [{ type: 'text', text: 'Here you go: [{"name":"Rice","cal":310,"pro":6,"carb":68,"fat":2}]' }] });
  }
  if (url.pathname === '/parse-receipt') {
    return send(200, { content: [{ type: 'text', text: '{"store":"Aldi","items":[{"name":"Oats","price":1.29,"qty":1}],"total":1.29}' }] });
  }
  if (url.pathname === '/analyze-physique') {
    return send(200, { error: 'Daily limit reached', gated: true });
  }
  if (url.pathname === '/scan-pantry') {
    return send(200, { content: [{ type: 'text', text: 'not json at all' }] });
  }
  if (url.pathname === '/food-search') {
    /* The Worker answers per 100 g, with brand and type alongside. */
    return send(200, { items: [
      { name: 'Chicken breast, raw', brand: 'Generic', type: 'Generic', cal: 165, pro: 31, carb: 0, fat: 3.6 },
      { name: 'Chicken Tikka', brand: 'A Brand', type: 'Brand', cal: 189, pro: 18.2, carb: 4.4, fat: 11 },
      { name: 'Nothing useful', brand: '', type: 'Generic', cal: 0, pro: 0, carb: 0, fat: 0 },
      /* No database had this one, so the figures were worked out. The
         row has to arrive saying so. */
      { name: 'Koeksister', brand: '', type: 'Estimate', src: 'estimate',
        cal: 420, pro: 3, carb: 60, fat: 19 }
    ] });
  }
  if (url.pathname === '/') {
    if (coachGated) {
      return send(200, { content: [{ type: 'text', text: "You've used your 10 daily AI chats. Upgrade to Pro for unlimited coaching." }],
                         gated: true, limit: { used: 10, max: 10 } });
    }
    return send(200, { content: [{ type: 'text', text: coachReply }] });
  }
  send(404, { message: 'no route' });
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

/* ---- the app, loaded the way the page loads it ---------------------- */
const memory = {};
global.window = global;
global.localStorage = {
  getItem: k => (k in memory ? memory[k] : null),
  setItem: (k, v) => { memory[k] = String(v); },
  removeItem: k => { delete memory[k]; },
  key: i => Object.keys(memory)[i],
  get length() { return Object.keys(memory).length; }
};
/* The catalogue loads before the store, because migration 5 resolves the
   names an upgrading reader's records and split days arrive without. */
eval(fs.readFileSync(path.join(BUILD, 'exercises.js'), 'utf8'));
eval(fs.readFileSync(path.join(BUILD, 'store.js'), 'utf8'));
eval(fs.readFileSync(path.join(BUILD, 'cloud.js'), 'utf8'));
eval(fs.readFileSync(path.join(BUILD, 'coach-actions.js'), 'utf8'));
const S = global.window.LKStore;
const C = global.window.LKCloud;
const CA = global.window.LKCoachActions;
CA.setCatalogue(JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'exercise-db.json'), 'utf8')));

/* ---- 1. nothing pretends without a server --------------------------- */
ok(C.ready() === false, 'with no config, ready() is false');
ok(C.coachReady() === false, 'with no config, coachReady() is false');
ok((await C.sync()).error === 'not_configured', 'sync refuses with a reason, not a lie');
ok((await C.ask([{ role: 'user', content: 'hi' }])).error === 'not_configured', 'ask refuses with a reason');
ok((await C.entitlement()).data.tier === 'free', 'with no server, nobody is Pro');

/* ---- 2. the real config shape turns it on --------------------------- */
global.window.LK_CLOUD = { supabaseUrl: BASE, supabaseKey: 'anon-key', apiUrl: BASE };
ok(C.ready() === true, 'the shipped config shape is the one cloud.js reads');
ok(C.coachReady() === true, 'coachUrl defaults to apiUrl');

/* the config the build actually ships must parse and name this project */
const cfgSrc = fs.readFileSync(path.join(BUILD, 'cloud-config.js'), 'utf8');
ok(/supabase\.co/.test(cfgSrc) && /workers\.dev/.test(cfgSrc), 'cloud-config.js names a real project and Worker');
ok(!/service_role|SUPABASE_SERVICE|sk-|GEMINI_KEY|GROQ_KEY/.test(cfgSrc),
   'cloud-config.js carries no key that row level security does not cover');

/* ---- 3. accounts ----------------------------------------------------- */
let r = await C.signIn('ada@example.com', 'wrong');
ok(!r.ok && /invalid login/i.test(r.message), 'a wrong password is refused in words', r.message);
ok(C.signedIn() === false, 'a refused sign-in leaves nobody signed in');

r = await C.signIn('ada@example.com', 'right');
ok(r.ok && C.signedIn(), 'a right password signs in');
ok(C.user() && C.user().email === 'ada@example.com', 'the signed-in person is readable');
const authed = seen.filter(s => s.path === '/rest/v1/user_data' || s.path === '/rest/v1/rpc/store_push');

/* ---- 3a. the confirmation that never arrived ------------------------- */
let rs = await C.resend('ada@example.com');
ok(rs.ok, 'a confirmation can be sent again', rs.message);
const rsSent = seen.filter(function (x) { return x.path === '/auth/v1/resend'; }).pop();
ok(rsSent.body.type === 'signup', 'as a resend, not as a second sign-up', rsSent.body.type);

/* ---- 3b. changing a password is the account's business --------------- */
let cp = await C.changePassword('wrong', 'a-good-long-one');
ok(!cp.ok && cp.error === 'wrong_password',
   'the current password is checked by the account, not by the screen', cp.message);

cp = await C.changePassword('right', 'short');
ok(!cp.ok && /short/i.test(cp.message || ''),
   'and the server has the last word on the new one too', cp.message);

cp = await C.changePassword('right', 'a-good-long-one');
ok(cp.ok, 'a right password and a good new one goes through', cp.message);
ok(C.signedIn(), 'and you are still signed in afterwards');

/* ---- 4. push sends what changed, and only that ----------------------- */
S.set('lk_prs', [{ id: 1, kg: 100 }]);
S.set('lk_theme', 'kg');
r = await C.push();
const pushed = seen.filter(s => s.path === '/rest/v1/rpc/store_push').pop();
ok(r.ok, 'push succeeds', r.message);
ok(pushed.headers.apikey === 'anon-key', 'every request carries the project key');
ok(pushed.headers.authorization === 'Bearer ' + TOKEN, 'every request carries the person');
const keys = pushed.body.rows.map(x => x.key);
ok(keys.includes('lk_prs') && keys.includes('lk_theme'), 'what changed went up', keys.join(','));
ok(pushed.body.rows.every(x => typeof x.changed_at === 'number' && x.changed_at > 0),
   'every row carries the device clock, which is what makes conflicts decidable');

/* ---- 5. THE CYCLE LOG ONLY LEAVES WITH CONSENT ----------------------- */
S.set('lk_mcProfile', { tracking: true, cloudBackup: false });
S.set('lk_mcDays', [{ date: '2026-09-01', flow: 2 }]);
r = await C.push();
let up = seen.filter(s => s.path === '/rest/v1/rpc/store_push').pop().body.rows.map(x => x.key);
ok(!up.includes('lk_mcDays') && !up.includes('lk_mcProfile'),
   'with the switch off, no part of the cycle log leaves the device', up.join(','));

S.set('lk_mcProfile', { tracking: true, cloudBackup: true });
S.set('lk_mcDays', [{ date: '2026-09-02', flow: 1 }]);
r = await C.push();
up = seen.filter(s => s.path === '/rest/v1/rpc/store_push').pop().body.rows.map(x => x.key);
ok(up.includes('lk_mcDays'), 'with the switch on, it syncs like anything else', up.join(','));

/* ---- 6. the conflict rule, from both ends ---------------------------- */
table = [{ key: 'lk_theme', value: 'lb', changed_at: Date.now() + 60000 }];
S.set('lk_theme', 'kg');
await C.pull();
ok(S.get('lk_theme', null) === 'lb', 'a newer server row wins');

table = [{ key: 'lk_theme', value: 'st', changed_at: 1 }];
await C.pull();
ok(S.get('lk_theme', null) === 'lb', 'an older server row does not');

table = [{ key: 'lk_prs', value: null, changed_at: Date.now() + 60000 }];
await C.pull();
ok(S.removed('lk_prs') === true && S.get('lk_prs', null) === null,
   'a null value is a deletion, and it syncs');

/* and the deletion travels back up, rather than being a row that simply
   stops arriving — which is how a deleted thing returns from the other phone */
table = [];
S.set('lk_lastSync', 0);
await C.push();
const del = seen.filter(s => s.path === '/rest/v1/rpc/store_push').pop()
  .body.rows.filter(x => x.key === 'lk_prs')[0];
ok(del && del.deleted === true && del.value === null,
   'a deletion goes up as a deletion, not as a missing row',
   JSON.stringify(del));

table = [{ key: 'lk_somethingFromANewerBuild', value: 9, changed_at: Date.now() + 60000 }];
await C.pull();
ok(S.get('lk_somethingFromANewerBuild', null) === null,
   'a key this build does not know is left alone, not written');

/* the server half of the same rule: a stale device cannot overwrite */
table = [{ key: 'lk_theme', value: 'kg', changed_at: 5000 }];
let res = await fetch(BASE + '/rest/v1/rpc/store_push', {
  method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + TOKEN },
  body: JSON.stringify({ rows: [{ key: 'lk_theme', value: 'lb', changed_at: 4000 }] })
});
ok((await res.json()) === 0 && table[0].value === 'kg', 'a stale phone coming back online overwrites nothing');

/* and a signed-out caller cannot push at all */
res = await fetch(BASE + '/rest/v1/rpc/store_push', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ rows: [{ key: 'lk_theme', value: 'x', changed_at: 9e12 }] })
});
ok(res.status === 401, 'signed out, store_push refuses');

/* ---- 6b. WHAT THE SHIPPED APP WROTE, ARRIVING BY SYNC -----------------
   These are the shapes the live project actually holds, read off it
   structurally: lk_prs as a map keyed by exercise id, a session whose
   volume and duration are strings and whose date is US-ordered, a split
   holding exercise ids rather than exercises. Every one of them has a
   migration, and every one of them used to arrive AFTER the migrations
   had run and been marked done -- so the upgrading reader with real
   history, the only reader these were written for, was the one they
   missed. */
S.set('lk_schema', 4);                 /* this device is fully migrated */
S.set('lk_lastSync', 0);
const future = Date.now() + 120000;
table = [
  /* The live shape: a map of exercise id to an ARRAY of attempts, each
     { date, r, w }. Read off the project structurally, not guessed. */
  { key: 'lk_prs', changed_at: future, value: {
      '104': [{ date: '9/7/2026', r: 5, w: 72.5 }, { date: '8/31/2026', r: 5, w: 70 }],
      '311': [{ date: '9/1/2026', r: 8, w: 45 }] } },
  { key: 'lk_history', changed_at: future, value: [
      /* vol and dur as strings with their units in them, sets as a
         number, an exercise carrying only name and sets: the live shape. */
      { name: 'Push', date: '9/7/2026', vol: '14363 kg', dur: '52 min', sets: 18,
        exercises: [{ name: 'Bench Press', sets: [{ w: 72.5, r: 5, setType: 'warmup' }] }] } ] },
  { key: 'lk_splits', changed_at: future, value: [
      { id: 1, name: 'Push Pull Legs', created: 1780000000000,
        days: [{ name: 'Push', exIds: [104, 311] }] } ] }
];
await C.pull();

const prs = S.get('lk_prs', null);
ok(Array.isArray(prs) && prs.length === 3,
   'a records map written by the shipped app arrives as the flat array this build reads',
   Array.isArray(prs) ? prs.length + ' records' : 'still ' + typeof prs);
ok(Array.isArray(prs) && prs[0] && typeof prs[0].kg === 'number' && prs[0].exId > 0,
   'each record keeps its lift and its weight as a number',
   JSON.stringify((prs || [])[0]));
/* THE DATA IS NO USE IF IT IS NOT LEGIBLE. A migrated record came across
   as { exId: 104, name: '' } and rendered nameless on every screen that
   lists records. */
ok(Array.isArray(prs) && prs.every(function (r) { return !!r.name; }),
   'and every record has the name the catalogue gives its lift',
   JSON.stringify((prs || []).map(function (r) { return r.name; })));
ok(Array.isArray(prs) && prs.every(function (r) { return /^\d{4}-\d{2}-\d{2}$/.test(r.date); }),
   'and an ISO date, so the records sort in the order they happened',
   JSON.stringify((prs || []).map(function (r) { return r.date; })));

/* THE SHIPPED APP IS STILL RUNNING WHILE THIS ONE ROLLS OUT, and these
   converted rows sync back to it. A set that lost w and r read as blank
   there. They are kept beside kg and reps for that reason; see
   15-server/README.md for what does not survive the trip and why the
   release wants to be a cutover. */
const backSets = (((S.get('lk_history', [])[0] || {}).exercises || [])[0] || {}).sets || [];
ok(backSets.length > 0 && backSets.every(function (x) { return x.w !== undefined && x.r !== undefined; }),
   'a converted set still carries the two fields the shipped app reads',
   JSON.stringify(backSets[0] || {}));

const hist = S.get('lk_history', []) || [];
const h0 = hist[0] || {};
/* The build reads kg, not vol -- so the migration puts the number there
   and leaves the original string beside it untouched. Asserting on vol
   would have tested the wrong field, which is how this check was written
   the first time. */
ok(h0.kg === 14363,
   'a volume stored as "14363 kg" reads as the number 14363 on the field the screens use',
   JSON.stringify({ kg: h0.kg, vol: h0.vol }));
ok(h0.min === 52, 'and "52 min" reads as 52', JSON.stringify(h0.min));
ok(!/\//.test(String(h0.date || '')),
   'and a US-ordered date is an ISO one', String(h0.date));
const set0 = ((h0.exercises || [])[0] || {}).sets || [];
ok(set0.length === 0 || (set0[0].kg !== undefined || set0[0].w === undefined),
   'and a set stored as {w,r} reads as {kg,reps}', JSON.stringify(set0[0] || {}));

const sp = (S.get('lk_splits', []) || [])[0] || {};
const day0 = (sp.days || [])[0] || {};
ok(Array.isArray(day0.exercises) && day0.exercises.length > 0,
   'a split holding exercise ids arrives holding exercises',
   JSON.stringify((day0.exercises || []).map(function (e) { return e.id; })));
ok(Array.isArray(day0.exercises) && day0.exercises.every(function (e) { return !!e.name; }),
   'and every one of them is named, not an id on a blank row',
   JSON.stringify((day0.exercises || []).map(function (e) { return e.name; })));

ok(S.schemaVersion() >= 4, 'and the version marker is still honest afterwards',
   String(S.schemaVersion()));

/* ---- 6c. THE REST OF WHAT THE LIVE TABLE HOLDS -----------------------
   Read off the project row by row rather than imagined. Three things in
   6b's fixture were tidier than the real data:

     - a set stores its weight and reps as STRINGS ("w": "35", "r": "8"),
       with rL/rR beside them and no setType at all;
     - a session carries dateISO next to a US-ordered date, and the two
       disagree by a day, so the ISO one has to win;
     - every lk_prs row in the live table is dated with the word "Today",
       which is what the shipped app showed when it wrote the record.

   The word cannot be turned back into a day -- the row carries nothing
   else to date it -- so it survives as the word. What must not happen is
   the screen splitting it on "-" and printing "undefined NaN", which is
   what Records did for the one account that has these rows. */
S.set('lk_schema', 6);
S.set('lk_lastSync', 0);
const future2 = Date.now() + 180000;
table = [
  { key: 'lk_prs', changed_at: future2, value: {
      '104': [{ date: 'Today', r: 3, w: 58.96707822663317 },
              { date: 'Today', r: 5, w: 54.43114913227677 }] } },
  { key: 'lk_history', changed_at: future2, value: [
      { name: 'Pull Hotel', date: '6/18/2026', dateISO: '2026-06-19',
        vol: '3608 kg', dur: '39 min', sets: 12, blocks: null, note: '',
        exercises: [{ name: 'Technogym Low row', sets: [
          { r: '8', w: '35', rL: '', rR: '', rir: '2', done: true },
          { r: '9', w: '90', rL: '', rR: '', rir: '0', done: true } ] }] } ] },
  /* the switch under the name the shipped app saves it as */
  { key: 'lk_gamingLayer', changed_at: future2, value: true }
];
await C.pull();

const live = S.get('lk_prs', null) || [];
ok(Array.isArray(live) && live.length === 2 && live.every(function (r) { return !!r.name; }),
   'records dated with a word still arrive named and countable',
   JSON.stringify(live.map(function (r) { return r.name; })));
ok(live.every(function (r) { return r.date === 'Today'; }),
   'and the word is kept rather than turned into a day nobody recorded',
   JSON.stringify(live.map(function (r) { return r.date; })));

const lh = (S.get('lk_history', []) || [])[0] || {};
ok(lh.date === '2026-06-19',
   'where a session carries both dates, the ISO one wins', String(lh.date));
const ls = ((lh.exercises || [])[0] || {}).sets || [];
ok(ls.length === 2 && ls.every(function (x) { return typeof x.kg === 'number' && typeof x.reps === 'number'; }),
   'a set written as strings reads as numbers, or every volume it feeds is text',
   JSON.stringify(ls));
ok(lh.kg === 3608 && lh.min === 39,
   'and the session total is a number too', JSON.stringify({ kg: lh.kg, min: lh.min }));
ok(S.get('lk_badges', null) === true,
   'the streaks switch arrives on, under the name this build reads',
   JSON.stringify({ lk_gamingLayer: S.get('lk_gamingLayer', null), lk_badges: S.get('lk_badges', null) }));

/* and a choice made in THIS build is never undone by the older key */
S.set('lk_badges', false);
S.remigrate();
ok(S.get('lk_badges', null) === false,
   'and it never overwrites a choice made here');

/* ---- 6d. THE TWO SHAPES THAT CHANGED MEANING, NOT JUST NAME ---------
   The goal and the food log. Both are read off the live project: the
   shipped app writes lk_profile.goal as "Cut" / "Maintain" / "Bulk", and
   stores a day's meals in buckets named after the meal rather than as a
   list of meals that each know their slot. */
S.set('lk_schema', 8);
S.set('lk_lastSync', 0);
const future3 = Date.now() + 240000;
table = [
  { key: 'lk_profile', changed_at: future3,
    value: { useKg: false, username: 'reader', displayName: 'Reader', goal: 'Cut' } },
  { key: 'lk_fuelLog', changed_at: future3, value: {
      '2026-07-25': { water: 1905, meals: {
        breakfast: [{ name: 'Oats', cal: 320, pro: 11, carb: 54, fat: 6 }],
        lunch: [], dinner: [],
        snacks: [{ name: 'Cheese crackers', cal: 170, pro: 3, carb: 20, fat: 10,
                   est: true, src: 'ai', fromVoice: true }] } } } }
];
await C.pull();

ok((S.get('lk_profile', {}) || {}).goal === 'cut',
   'a goal of "Cut" arrives as cutting, not defaulted to maintenance',
   JSON.stringify((S.get('lk_profile', {}) || {}).goal));

const fl = (S.get('lk_fuelLog', {}) || {})['2026-07-25'] || {};
ok(Array.isArray(fl.meals) && fl.meals.length === 2,
   'a day whose meals sit in buckets arrives as the list Fuel reads',
   Array.isArray(fl.meals) ? fl.meals.length + ' meals' : 'still ' + typeof fl.meals);
ok(Array.isArray(fl.meals) && fl.meals.every(function (m) { return typeof m.kcal === 'number'; }),
   'and each one has calories on the field the screen adds up',
   JSON.stringify((fl.meals || []).map(function (m) { return [m.name, m.kcal]; })));
ok(Array.isArray(fl.meals) && fl.meals[0].slot === 'breakfast' && fl.meals[1].slot === 'snack',
   'and the bucket it sat in became the slot it was eaten in',
   JSON.stringify((fl.meals || []).map(function (m) { return m.slot; })));
ok(fl.waterMl === 1905, 'and the water came across', String(fl.waterMl));
ok(Array.isArray(fl.meals) && fl.meals[1].est === true && fl.meals[1].fromVoice === true,
   'and an estimate is still marked as one, never promoted to a reading');

/* run it again: a converted day must not be converted twice */
const before = JSON.stringify(S.get('lk_fuelLog', null));
S.remigrate();
ok(JSON.stringify(S.get('lk_fuelLog', null)) === before,
   'and running every migration again changes nothing');

/* ---- 7. entitlements, read off a profile row ------------------------- */
const DAY = 86400000;
const cases = [
  [{ subscription_status: 'trial', trial_ends_at: new Date(Date.now() + 5 * DAY).toISOString() }, true,  'a live trial is Pro'],
  [{ subscription_status: 'trial', trial_ends_at: new Date(Date.now() - DAY).toISOString() },     false, 'a trial that ran out is not'],
  [{ subscription_status: 'active', current_plan: 'annual', plan_expires_at: new Date(Date.now() + 300 * DAY).toISOString() }, true, 'a paid plan is Pro'],
  [{ subscription_status: 'active', plan_expires_at: new Date(Date.now() - DAY).toISOString() }, false, 'a paid plan past its date is not'],
  [{ subscription_status: 'past_due', plan_expires_at: new Date(Date.now() + 3 * DAY).toISOString() }, true, 'time already paid for survives a bounced card'],
  [{ subscription_status: 'canceled', plan_expires_at: new Date(Date.now() + 3 * DAY).toISOString() }, true, 'a cancelled plan runs to the end of what was bought'],
  [{ subscription_status: 'expired' }, false, 'expired is expired'],
  [null, false, 'no profile row at all is free, not an error']
];
for (const [p, pro, name] of cases) {
  profile = p;
  const e = await C.entitlement();
  ok(e.ok && (e.data.tier === 'pro') === pro, name, JSON.stringify(e.data));
  ok(C.can('coach_unlimited') === pro, name + ' — and can() agrees');
  ok(C.can('log') === true, name + ' — and logging is never behind the paywall');
}

/* ---- 8. the coach ----------------------------------------------------- */
profile = { subscription_status: 'active', plan_expires_at: new Date(Date.now() + DAY).toISOString() };

coachReply = JSON.stringify({ reply: 'Two more sets on the last one.', actions: [] });
r = await C.ask([{ role: 'user', content: 'how did I do' }]);
ok(r.ok && r.data.reply === 'Two more sets on the last one.' && r.data.actions.length === 0,
   'a plain answer comes back as a plain answer');
const sent = seen.filter(s => s.path === '/').pop();
ok(/Return ONLY a JSON/.test(sent.body.system),
   'the phrase the Worker switches structured mode on is still in the prompt');

coachReply = '```json\n' + JSON.stringify({ reply: 'Here is the week.', actions: [{ kind: 'fact', text: 'You squat on Mondays.' }] }) + '\n```';
r = await C.ask([{ role: 'user', content: 'plan me' }]);
ok(r.ok && r.data.actions.length === 1, 'a fenced block is still JSON');

coachReply = 'Sure. ' + JSON.stringify({ reply: 'Done.', actions: [{ kind: 'fact', text: 'x' }] }) + ' Hope that helps.';
r = await C.ask([{ role: 'user', content: 'x' }]);
ok(r.ok && r.data.actions.length === 1, 'JSON buried in prose is still found');

coachReply = 'I just felt like talking.';
r = await C.ask([{ role: 'user', content: 'x' }]);
ok(r.ok && r.data.reply === 'I just felt like talking.' && r.data.actions.length === 0,
   'no JSON at all is a reply with no actions, never an error');

coachGated = true;
r = await C.ask([{ role: 'user', content: 'x' }]);
ok(r.ok && r.data.gated === true && r.data.limit.max === 10 && r.data.actions.length === 0,
   'the free ten a day is said plainly and carries no actions');
coachGated = false;

/* ---- 9. NOTHING THE COACH SENDS REACHES DATA WITHOUT THE GATE --------- */
const real = CA.kinds.length;
ok(real === 8, 'the gate still knows eight kinds', CA.kinds.join(','));

coachReply = JSON.stringify({ reply: 'Your new split.', actions: [
  { kind: 'split', split: { name: 'PPL', days: [{ name: 'Push', exercises: [{ id: 99999, name: 'Bench Press', sets: 3, reps: 8 }] }] } },
  { kind: 'fact', text: 'You train five days.' }
]});
r = await C.ask([{ role: 'user', content: 'make me a split' }]);
const checked = CA.checkAll(r.data.actions);
ok(checked.length === 2, 'every action is checked, none skipped');
/* The refusal used to end "is not in the exercise catalogue", and this
   matched on the word catalogue. The gate says the same thing in words
   somebody lifting would use, so the assertion follows it: what matters
   is that the refusal names the lift and says the app does not know it. */
ok(checked[0].ok === false && /not a lift LOCKED knows/.test(checked[0].problems.join(' ')),
   'an invented exercise id is refused by name', checked[0].problems.join('; '));
ok(checked[1].ok === true, 'a sound action still passes');

coachReply = JSON.stringify({ reply: 'Recipe.', actions: [
  { kind: 'recipe', recipe: { name: 'Bowl', servings: 1, kcal: 4, items: [{ name: 'rice', grams: 200 }], steps: ['cook'] } }
]});
r = await C.ask([{ role: 'user', content: 'recipe' }]);
const rec = CA.check(r.data.actions[0]);
ok(rec.ok === false || !('kcal' in (rec.action || {})) || rec.action.kcal !== 4,
   'a total the model stated is never the total that gets stored');

/* ---- 9b. food, from beyond this device ------------------------------ */
let fr = await C.foodSearch('chicken');
ok(fr.ok && fr.data.length === 3,
   'the food database answers, and a row with no calories is dropped',
   JSON.stringify(fr.data.map(function (x) { return x.name; })));
ok(fr.data[0].kcal === 165 && fr.data[0].pro === 31 && fr.data[0].g === 100,
   'the numbers come across per 100 g, unchanged', JSON.stringify(fr.data[0]));
ok(fr.data[1].from === 'A Brand', 'a row says where it came from', fr.data[1].from);
ok(fr.data.every(function (x) { return x.src === 'table'; }),
   'a looked-up food is marked as looked up, never as an estimate');
/* The estimate is the exception the badge exists for: when every source
   missed, Gemini worked the figures out and the row must carry that the
   whole way to the screen rather than passing as a measured one. */
var estRow = fr.data.filter(function (x) { return x.source === 'estimate'; })[0];
ok(!!estRow && estRow.sourceName === 'Estimate',
   'a worked-out row arrives named an estimate, so Fuel can badge it',
   JSON.stringify(estRow));
ok(!!estRow && estRow.from === 'Estimate',
   'and says so on its own line when there is no brand to show instead',
   estRow && estRow.from);

fr = await C.foodSearch('a');
ok(fr.ok && fr.data.length === 0, 'one letter is not a search');

global.window.LK_CLOUD = { supabaseUrl: BASE, supabaseKey: 'anon-key' };
fr = await C.foodSearch('chicken');
ok(!fr.ok && fr.error === 'not_configured',
   'with no server it refuses rather than returning an empty shelf', fr.message);
global.window.LK_CLOUD = { supabaseUrl: BASE, supabaseKey: 'anon-key', apiUrl: BASE };

/* ---- 9c. reminders --------------------------------------------------
   The browser half cannot run here -- there is no service worker and no
   push manager in this process -- so what is checked is the half this
   file owns: the device id the server keys a schedule by, the prefs it
   sends, and that every call refuses honestly when it cannot work. */
const P = C.reminders;
ok(P.supported() === false, 'no push in this process, and it says so rather than throwing');

const dev = P.deviceId();
ok(/^[A-Za-z0-9_-]{8,64}$/.test(dev), 'the device id is the shape the server accepts', dev);
ok(P.deviceId() === dev, 'and it is made once, not per call');
ok(S.syncKeys().indexOf('lk_pushDevice') === -1,
   'the device id does not sync: a reminder belongs to a phone, not an account');

let kr = await P.key();
ok(kr.ok && typeof kr.data === 'string' && kr.data.length > 40, 'the push key comes back', kr.data && kr.data.slice(0, 12));

let sr = await P.subscribe();
ok(!sr.ok && sr.error === 'unsupported',
   'subscribing without a push manager says the browser cannot, not that it failed', sr.message);

let pr = await P.prefs({ rest: true, training: true, trainingTime: '07:30',
                         checkin: false, checkinTime: '08:00', idle: true });
const sentPrefs = seen.filter(function (x) { return x.path === '/push/prefs'; }).pop();
ok(pr.ok, 'the schedule reaches the server', pr.message);
ok(sentPrefs.body.deviceId === dev, 'keyed by this phone');
ok(sentPrefs.body.prefs.trainingTime === '07:30' && sentPrefs.body.prefs.checkin === false,
   'with the times and switches as shown', JSON.stringify(sentPrefs.body.prefs));
ok(typeof sentPrefs.body.tz === 'string',
   'and a timezone, because 07:30 means 07:30 where they are');

let ai = await P.armIdle(40 * 60);
ok(ai.ok, 'a workout left running is held by the server, not by a timer in the page', ai.message);
ai = await P.armIdle(5);
ok(!ai.ok && ai.error === 'range', 'and five seconds is not a reminder', ai.message);
ok((await P.cancelIdle()).ok, 'the session ending takes it back');

const noServer = { supabaseUrl: BASE, supabaseKey: 'anon-key' };
const had = global.window.LK_CLOUD;
global.window.LK_CLOUD = noServer;
ok((await P.key()).error === 'not_configured', 'with no server the key refuses');
ok((await P.subscribe()).error === 'not_configured', 'with no server subscribing refuses');
ok((await P.prefs({})).error === 'not_configured', 'with no server the schedule refuses');
ok((await P.unsubscribe()).ok === true, 'and unsubscribing still succeeds locally');
global.window.LK_CLOUD = had;

/* ---- 9d. reading a photo -------------------------------------------- */
let v = await C.vision('meal', 'data:image/jpeg;base64,AAAA');
ok(v.ok && Array.isArray(v.data) && v.data[0].name === 'Rice',
   'a plate comes back as items, read out of the prose around them', JSON.stringify(v.data));

v = await C.vision('receipt', 'data:image/jpeg;base64,AAAA');
ok(v.ok && v.data && v.data.store === 'Aldi' && v.data.items.length === 1,
   'a receipt comes back as a store, its lines and a total', JSON.stringify(v.data));

v = await C.vision('physique', 'data:image/jpeg;base64,AAAA');
ok(!v.ok && v.gated === true,
   'a spent free allowance is said as itself, not as a failure', v.message);

v = await C.vision('pantry', 'data:image/jpeg;base64,AAAA');
ok(!v.ok && v.error === 'unreadable',
   'an answer that will not parse is refused rather than guessed at', v.message);

v = await C.vision('meal', '');
ok(!v.ok && v.error === 'empty', 'nothing to read is not a request');

v = await C.vision('nonsense', 'data:image/jpeg;base64,AAAA');
ok(!v.ok && v.error === 'unknown', 'and there are only four things it can read');

/* ---- 10. signing out ------------------------------------------------- */
await C.signOut();
ok(C.signedIn() === false, 'signing out signs you out');
r = await C.push();
ok(!r.ok && r.error === 'signed_out', 'and push then says so rather than failing silently');

/* ---- the Worker is not Supabase ------------------------------------
   `apikey` is Supabase's project key, and it was going out on every
   call including the ones to the Worker. That is not untidy, it is
   fatal: a custom header makes the browser send a CORS preflight, the
   Worker's preflight allows Content-Type and Authorization and nothing
   else, so the preflight failed and the real request was never sent.
   Food search, the meal photo, the receipt reader and the pantry scan
   were all blocked in the browser before they left the phone, and each
   renders its own failure as an empty result -- so a whole tab looked
   like it had no data rather than like it was broken.

   Nothing on the server could have fixed that, which is why it has a
   check of its own here. */
console.log('\n--- the Worker gets the Worker\'s headers ---');
/* Signed back in, because the sign-out case above left nobody here and
   half of what this section checks is what a signed-in caller sends. */
await C.signIn('ada@example.com', 'right');
seen.length = 0;
await C.foodSearch('oats');
const fsReq = seen.filter(x => x.path === '/food-search').pop();
ok(!!fsReq, 'food search reaches the Worker', fsReq ? fsReq.path : 'no request');
ok(fsReq && fsReq.headers.apikey === undefined,
   'and carries no Supabase project key, which its preflight forbids',
   fsReq ? String(fsReq.headers.apikey) : '');
ok(fsReq && fsReq.headers.authorization === 'Bearer ' + TOKEN,
   'but does carry the person, which is how the Worker counts their limit',
   fsReq ? String(fsReq.headers.authorization) : '');

seen.length = 0;
await C.ask([{ role: 'user', content: 'hi' }]);
const askReq = seen.filter(x => /coach|analyze|^\/$/.test(x.path)).pop();
ok(!askReq || askReq.headers.apikey === undefined,
   'and the coach endpoint is the same',
   askReq ? String(askReq.headers.apikey) : 'no request');

seen.length = 0;
await C.push();
const pushReq = seen.filter(x => x.path === '/rest/v1/rpc/store_push').pop();
ok(pushReq && pushReq.headers.apikey === 'anon-key',
   'while Supabase still gets the key it cannot work without',
   pushReq ? String(pushReq.headers.apikey) : 'no request');

server.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall good');
process.exit(fails ? 1 : 0);
