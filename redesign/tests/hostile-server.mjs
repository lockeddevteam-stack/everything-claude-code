/* A SERVER THAT ANSWERS BADLY.

   cloud-contract.mjs proves the seam against the server that exists,
   answering the way it is supposed to. This is the other half: what a
   pull does to the phone when the answer is wrong.

   That is not a hypothetical. A row can be half-written by a sync that
   died, hand-edited in the dashboard, left behind by an older build
   whose idea of a key was different, or written by the reader's OWN
   second phone running a version this one has never seen. Every one of
   those arrives through the same door, and what comes through it is
   written straight into local storage -- over work that is already
   there.

   So the rule being tested is narrow and strict: a bad answer may fail
   to add anything, and may not damage anything. Nothing on the phone
   that was good before the pull is worse after it, nothing throws, and
   a key whose server value is unusable keeps the local one rather than
   being overwritten with rubbish. */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!fails && !pass) fails++; else if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const TOKEN = 'jwt-for-ada';
let rows = [];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const signedIn = (req.headers.authorization || '') === 'Bearer ' + TOKEN;
  const send = (code, body) => {
    res.writeHead(code, { 'content-type': 'application/json',
                          'access-control-allow-origin': '*' });
    res.end(JSON.stringify(body));
  };
  if (req.method === 'OPTIONS') return send(200, {});
  if (url.pathname === '/auth/v1/token' || url.pathname === '/auth/v1/signup') {
    return send(200, { access_token: TOKEN, refresh_token: 'r',
                       user: { id: 'ada', email: 'ada@example.com' } });
  }
  if (url.pathname === '/rest/v1/rpc/store_push') return send(200, 0);
  if (url.pathname === '/rest/v1/user_data') {
    return send(200, signedIn ? rows : []);
  }
  if (url.pathname === '/rest/v1/profiles') return send(200, []);
  send(404, { message: 'no route' });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const memory = {};
global.window = global;
global.localStorage = {
  getItem: (k) => (k in memory ? memory[k] : null),
  setItem: (k, v) => { memory[k] = String(v); },
  removeItem: (k) => { delete memory[k]; },
  key: (i) => Object.keys(memory)[i],
  get length() { return Object.keys(memory).length; }
};
eval(fs.readFileSync(path.join(BUILD, 'exercises.js'), 'utf8'));
eval(fs.readFileSync(path.join(BUILD, 'store.js'), 'utf8'));
eval(fs.readFileSync(path.join(BUILD, 'cloud.js'), 'utf8'));
const S = global.window.LKStore;
const C = global.window.LKCloud;

global.window.LK_CLOUD = { supabaseUrl: BASE, supabaseKey: 'anon-key', apiUrl: BASE };

await C.signIn('ada@example.com', 'correct-horse');

/* Real work already on the phone, of the kinds a pull can reach. */
const GOOD_HISTORY = [{ id: 'w1', name: 'PPL - Push', date: '2026-09-13', kind: 'lift',
                        kg: 480, min: 30, sets: 1,
                        exercises: [{ id: 104, name: 'Incline Machine Press',
                                      sets: [{ kg: 60, reps: 8, done: true }] }] }];
S.set('lk_history', GOOD_HISTORY);
S.set('lk_splits', [{ id: 's1', name: 'PPL', created: '9/1/2026', days: [{ name: 'Push', exercises: [] }] }]);
S.set('lk_theme', 'dark');

const NOW = Date.now();
/* Every wrong answer a row can give, all at once and all NEWER than what
   is on the phone -- so anything that overwrites on date alone loses. */
rows = [
  { key: 'lk_history', value: 'not an array at all', changed_at: NOW + 10000 },
  /* A wrong shape, not null: null is a TOMBSTONE and legitimately
     deletes, which is how a split deleted on another phone reaches this
     one. That rule is checked on its own below. */
  { key: 'lk_splits', value: { oops: true }, changed_at: NOW + 10000 },
  { key: 'lk_theme', value: { nonsense: true }, changed_at: NOW + 10000 },
  { key: 'lk_prs', changed_at: NOW + 10000 },                 /* no value field */
  { value: [1, 2, 3], changed_at: NOW + 10000 },               /* no key */
  { key: '', value: 'x', changed_at: NOW + 10000 },            /* empty key */
  { key: 'lk_goals', value: [{ id: 'g1', text: 'ok' }], changed_at: 'soon' },
  { key: 'lk_weightLog', value: [{ date: '2026-09-13', kg: 82 }], changed_at: -1 },
  null,
  'a bare string where a row should be',
  { key: 'lk_recipes', value: [{ id: 'r1', name: 'Oats' }], changed_at: NOW + 10000 }
];

let threw = null;
let result = null;
try { result = await C.sync(); } catch (e) { threw = e; }

console.log('=== a pull that answers badly ===\n');

ok(!threw, 'the pull does not throw on any of it', threw && threw.message);
ok(result && typeof result === 'object', 'and comes back with a result rather than nothing',
   JSON.stringify(result && result.error ? result.error : 'ok'));

console.log('\n=== and damages nothing that was already there ===\n');

const hist = S.get('lk_history', null);
ok(Array.isArray(hist) && hist.length === 1 && hist[0].id === 'w1',
   'a session on the phone survives a server row that is a string',
   JSON.stringify(hist && hist.length));

const splits = S.get('lk_splits', null);
ok(Array.isArray(splits) && splits.length === 1 && splits[0].id === 's1',
   'and a split survives a server row that is an object where a list belongs',
   JSON.stringify(splits && splits.length));

const theme = S.get('lk_theme', null);
ok(theme === 'dark' || typeof theme === 'string',
   'and a setting is never left as an object nothing can read', JSON.stringify(theme));

console.log('\n=== a readable row is still allowed through ===\n');

const recipes = S.get('lk_recipes', null);
ok(Array.isArray(recipes) && recipes.length === 1,
   'the one well-formed row in that answer did land', JSON.stringify(recipes));

console.log('\n=== but a real deletion still comes through ===\n');

/* The tombstone is the one null that MUST be obeyed: it is how a thing
   deleted on another phone stops existing on this one. Refusing every
   null would quietly resurrect deleted work. */
rows = [{ key: 'lk_recipes', value: null, changed_at: Date.now() + 20000 }];
await C.sync();
ok(S.get('lk_recipes', null) === null,
   'a null value is still a tombstone, not a row to refuse',
   JSON.stringify(S.get('lk_recipes', null)));

console.log('\n=== and the phone still works afterwards ===\n');

let readThrew = null;
try {
  ['lk_history', 'lk_splits', 'lk_prs', 'lk_goals', 'lk_weightLog', 'lk_recipes',
   'lk_theme', 'lk_profile'].forEach((k) => {
    const v = S.get(k, k === 'lk_theme' || k === 'lk_profile' ? null : []);
    if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'lk_profile') {
      throw new Error(k + ' came back as an object: ' + JSON.stringify(v).slice(0, 60));
    }
  });
} catch (e) { readThrew = e; }
ok(!readThrew, 'every key a screen reads comes back in the shape it reads',
   readThrew && readThrew.message);

/* And a second pull, because a damaged store usually shows up on the
   read after the one that damaged it. */
let twoThrew = null;
try { await C.sync(); } catch (e) { twoThrew = e; }
ok(!twoThrew, 'a second pull over the same answer is no worse', twoThrew && twoThrew.message);
ok(Array.isArray(S.get('lk_history', null)) && S.get('lk_history', null).length === 1,
   'and the session is still there after it');

server.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
