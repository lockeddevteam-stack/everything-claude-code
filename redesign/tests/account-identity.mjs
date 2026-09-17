/* A NAME THAT IS YOURS, AND A FACE.

   The account had an email and a display name anybody could duplicate.
   A username is different in kind: only one person can hold it, and the
   only thing that can enforce that is the database. Asking "is it free"
   and then writing it are two statements, and between them somebody else
   can take the same name -- so the unique index decides and a clash comes
   back as a clash rather than as a server error.

   The picture is the other half. It goes to storage under a folder named
   after the person, which is the only folder the bucket's policies let
   them write, and the profile row then points at it. The order matters:
   point at the new file only once it is really there, so a failure
   halfway leaves somebody with their old picture rather than none.

   This drives cloud.js against a Supabase that enforces what the real
   one enforces, including the 409 on a duplicate. */
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

const UID = 'ada-0001';
const TOKEN = 'jwt-for-ada';
let taken = new Map([['zoe', 'someone-else']]);   /* lowercased -> owner */
let reserved = new Set(['admin', 'coach', 'locked']);
let profileRow = { id: UID, email: 'ada@test', display_name: 'Ada',
                   username: null, avatar_url: null };
let storage = [];
let storageFails = false;
let patchFails = false;

function body(req) {
  return new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const raw = await body(req);
  const send = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(obj));
  };

  if (url.pathname === '/auth/v1/token') {
    return send(200, { access_token: TOKEN, refresh_token: 'r1', expires_in: 3600,
                       user: { id: UID, email: 'ada@test' } });
  }

  if (url.pathname === '/rest/v1/reserved_usernames') {
    const eq = (url.searchParams.get('name') || '').replace('eq.', '');
    return send(200, reserved.has(eq) ? [{ name: eq }] : []);
  }

  if (url.pathname === '/rest/v1/profiles') {
    if (req.method === 'PATCH') {
      const patch = JSON.parse(raw || '{}');
      if (patchFails) return send(500, { message: 'no' });
      if ('username' in patch) {
        const want = String(patch.username).toLowerCase();
        /* The unique index, as PostgREST reports it. */
        if (taken.has(want) && taken.get(want) !== UID) {
          return send(409, { code: '23505', message: 'duplicate key value violates unique constraint' });
        }
        if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(patch.username)) {
          return send(400, { code: '23514', message: 'violates check constraint' });
        }
        taken.set(want, UID);
        profileRow.username = patch.username;
      }
      if ('avatar_url' in patch) profileRow.avatar_url = patch.avatar_url;
      return send(200, [profileRow]);
    }
    const ilike = url.searchParams.get('username');
    if (ilike) {
      const want = ilike.replace('ilike.', '').toLowerCase();
      const owner = taken.get(want);
      return send(200, owner ? [{ id: owner }] : []);
    }
    return send(200, [profileRow]);
  }

  if (url.pathname.startsWith('/storage/v1/object/avatars/')) {
    if (storageFails) return send(500, { message: 'storage is down' });
    storage.push(url.pathname.replace('/storage/v1/object/avatars/', ''));
    return send(200, { Key: 'avatars/' + storage[storage.length - 1] });
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
global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
eval(fs.readFileSync(path.join(BUILD, 'exercises.js'), 'utf8'));
eval(fs.readFileSync(path.join(BUILD, 'store.js'), 'utf8'));
eval(fs.readFileSync(path.join(BUILD, 'cloud.js'), 'utf8'));
const C = global.window.LKCloud;
global.window.LK_CLOUD = { supabaseUrl: BASE, supabaseKey: 'anon', apiUrl: BASE };
await C.signIn('ada@test', 'right');

console.log('=== what a username may be ===\n');

ok(C.usernameProblem('ab') !== '', 'two characters is refused', C.usernameProblem('ab'));
ok(C.usernameProblem('9lives') !== '', 'starting with a digit is refused',
   C.usernameProblem('9lives'));
ok(C.usernameProblem('a b') !== '', 'a space is refused', C.usernameProblem('a b'));
ok(C.usernameProblem('a'.repeat(21)) !== '', 'twenty-one characters is refused');
ok(C.usernameProblem('ada_lovelace') === '', 'a reasonable one is not',
   JSON.stringify(C.usernameProblem('ada_lovelace')));

console.log('\n=== free, taken, reserved ===\n');

ok((await C.usernameFree('ada_lovelace')).data.free === true, 'a free name reads free');
ok((await C.usernameFree('zoe')).data.free === false, 'one somebody holds does not');
ok((await C.usernameFree('ZOE')).data.free === false,
   'and neither does it in another case, which is the same name');
ok((await C.usernameFree('coach')).data.why === 'reserved',
   'a reserved word says so rather than just "taken"');

console.log('\n=== claiming ===\n');

const got = await C.claimUsername('ada_lovelace');
ok(got.ok === true, 'a free name is claimed', JSON.stringify(got).slice(0, 80));
ok(got.data.username === 'ada_lovelace', 'and comes back as the name that was stored');

/* The race this is all for: the check said free, somebody else claimed it
   in between, and the write is the only thing that can catch it. */
taken.set('newname', 'someone-else');
const clash = await C.claimUsername('newname');
ok(clash.ok === false, 'a name won by somebody else in the meantime is refused');
ok(clash.error === 'taken', 'and is reported as taken, not as a server error',
   clash.error + ': ' + clash.message);

const shaped = await C.claimUsername('9nope');
ok(shaped.error === 'shape', 'a bad shape never reaches the server', shaped.error);

console.log('\n=== a picture ===\n');

const PNG = 'data:image/png;base64,' + Buffer.from('a'.repeat(64)).toString('base64');
storage = [];
const up = await C.uploadAvatar(PNG);
ok(up.ok === true, 'it uploads', JSON.stringify(up).slice(0, 90));
ok(storage.length === 1, 'exactly one file was written', String(storage.length));
ok(storage[0].indexOf(UID + '/') === 0,
   'into the folder named after the person, which is the only one they may write',
   storage[0]);
ok(profileRow.avatar_url && profileRow.avatar_url.indexOf(storage[0]) > -1,
   'and the profile points at the file that was really stored',
   String(profileRow.avatar_url));

const second = await C.uploadAvatar(PNG);
ok(second.data.path !== up.data.path,
   'a replacement gets its own name, so a cached copy cannot be served in its place',
   up.data.path + ' -> ' + second.data.path);

console.log('\n=== when it does not work ===\n');

const was = profileRow.avatar_url;
storageFails = true;
const failed = await C.uploadAvatar(PNG);
ok(failed.ok === false, 'an upload that fails says so');
ok(profileRow.avatar_url === was,
   'and the profile still points at the picture that is really there',
   String(profileRow.avatar_url === was));
storageFails = false;

ok((await C.uploadAvatar('data:text/html;base64,PGI+')).ok === false,
   'something that is not an image is refused before anything is sent');

console.log('\n=== and it all reads back ===\n');

const prof = await C.profile();
ok(prof.ok === true, 'the profile loads', JSON.stringify(prof).slice(0, 60));
ok(prof.data.username === 'ada_lovelace', 'with the username on it', prof.data.username);
ok(!!prof.data.avatar, 'and the picture', String(prof.data.avatar).slice(-24));

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
server.close();
process.exit(fails ? 1 : 0);
