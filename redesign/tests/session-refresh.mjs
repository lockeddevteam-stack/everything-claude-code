/* SIGNED IN UNTIL YOU SIGN OUT.

   A Supabase access token lasts an hour. cloud.js read an expired one as
   nobody being signed in -- `if (s.expires_at && Date.now() > ...) return
   null` -- so the app logged you out roughly once an hour and every
   screen that needs an account behaved like a fresh install. The refresh
   token that would have fixed it was sitting in the same stored object.
   The string "refresh_token" did not appear anywhere in the file.

   What has to hold now: an expired token is refreshed rather than
   discarded; a 401 that slips through gets one refresh and one retry; a
   refresh token the server REFUSES ends the session, because it is spent
   and will never work again; a refresh that failed on the NETWORK does
   not, because signing somebody out for going into a tunnel is the whole
   bug; and a cold start that fires six requests at once refreshes once,
   not six times -- Supabase rotates the refresh token on every use, so
   the losers of that race would spend a token that has already been
   retired and sign you out. */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* ---- a Supabase that expires things ---------------------------------- */
let issued = 0;            /* how many access tokens handed out */
let refreshCalls = 0;      /* how many refreshes asked for */
let refreshMode = 'ok';    /* 'ok' | 'refused' | 'offline' */
let live = null;           /* the token the server currently accepts */
let dataCalls = 0;

function body(req) {
  return new Promise((res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => res(b)); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const raw = await body(req);
  const json = raw ? JSON.parse(raw) : {};
  const send = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(obj));
  };

  if (url.pathname === '/auth/v1/token') {
    const grant = url.searchParams.get('grant_type');
    if (grant === 'refresh_token') {
      refreshCalls++;
      if (refreshMode === 'refused') {
        return send(400, { error: 'invalid_grant', error_description: 'Refresh Token Not Found' });
      }
      /* A connection that dies mid-request. Destroying the REQUEST
         socket left fetch waiting on a reply that was never coming and
         the suite hung; destroying the response socket is the hangup a
         phone losing signal actually produces, and fetch rejects on it. */
      if (refreshMode === 'offline') { res.destroy(); return; }
      live = 'access-' + (++issued);
      /* Rotated, the way Supabase really does it: the old refresh token
         stops working the moment this one is issued.

         Short-lived again, deliberately. A refreshed token that lasts an
         hour means every scenario below this one never reaches another
         expiry, and the checks pass by never running -- which is how the
         first version of this file reported "0 refreshes" as a failure
         and "still signed in" as one too. */
      return send(200, { access_token: live, refresh_token: 'refresh-' + issued,
                         expires_in: 1 });
    }
    live = 'access-' + (++issued);
    /* One second, so the suite does not have to wait an hour to see what
       the app does with an expired token. */
    return send(200, { access_token: live, refresh_token: 'refresh-' + issued,
                       expires_in: 1, user: { id: 'ada', email: json.email } });
  }

  if (url.pathname === '/rest/v1/user_data') {
    dataCalls++;
    const bearer = (req.headers.authorization || '').replace('Bearer ', '');
    if (bearer !== live) return send(401, { message: 'JWT expired' });
    return send(200, []);
  }

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
const C = global.window.LKCloud;
global.window.LK_CLOUD = { supabaseUrl: BASE, supabaseKey: 'anon-key', apiUrl: BASE };

const stored = () => JSON.parse(global.localStorage.getItem('lk_session') || 'null');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

console.log('=== an expired token is not a signed-out person ===\n');

await C.signIn('ada@test', 'right');
ok(C.signedIn() === true, 'signing in leaves somebody signed in');
ok(!!stored().refresh_token, 'and the refresh token is kept, not dropped',
   stored().refresh_token);

/* The token issued above lasts one second. */
await wait(1400);
ok(C.signedIn() === true,
   'an hour later -- one second here -- they are still signed in',
   String(C.signedIn()));

console.log('\n=== the next request carries a new token ===\n');

refreshCalls = 0;
const before = issued;
const pull = await C.sync();
ok(refreshCalls === 1, 'the expired token was refreshed exactly once',
   String(refreshCalls));
ok(issued === before + 1, 'and a new access token was issued', String(issued));
ok(pull.ok !== false || pull.error !== 'unauthorised',
   'so the pull was not refused', JSON.stringify(pull).slice(0, 80));

console.log('\n=== one refresh, however many calls race for it ===\n');

/* A cold start fires several at once. Supabase retires the old refresh
   token as it issues the new one, so a second refresh with the same
   token would fail and take the session with it. */
await wait(1400);
refreshCalls = 0;
await Promise.all([C.sync(), C.sync(), C.sync(), C.sync(), C.sync(), C.sync()]);
ok(refreshCalls === 1, 'six requests at once refreshed once between them',
   refreshCalls + ' refreshes');
ok(C.signedIn() === true, 'and nobody was signed out by the race');

console.log('\n=== a refresh token the server refuses ends it ===\n');

refreshMode = 'refused';
await wait(1400);
await C.sync();
ok(C.signedIn() === false,
   'a spent or revoked refresh token signs the person out, once',
   String(C.signedIn()));
ok(stored() === null, 'and the dead session is cleared rather than retried for ever');

console.log('\n=== a refresh that could not be sent does not ===\n');

refreshMode = 'ok';
await C.signIn('ada@test', 'right');
await wait(1400);
refreshMode = 'offline';
await C.sync();
ok(stored() !== null,
   'a refresh that failed on the network keeps the session',
   stored() ? 'kept' : 'thrown away');
ok(!!stored() && !!stored().refresh_token,
   'with the refresh token intact, so it works again on the next signal');

console.log('\n=== and it recovers when the signal comes back ===\n');

refreshMode = 'ok';
refreshCalls = 0;
await C.sync();
ok(refreshCalls === 1, 'the next attempt refreshes', String(refreshCalls));
ok(C.signedIn() === true, 'and they were signed in the whole time');

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
server.close();
process.exit(fails ? 1 : 0);
