/* THE POUNDS THAT BECAME KILOGRAMS.

   The shipped app did not store lifting weights in kilograms. It stored
   them in whatever unit the account lifted in, and wrote down which that
   was in lk_weightStorageUnit -- for an account logging in pounds, "lb".

   The migration that reads v6 history into this build read those numbers
   as kilograms. For anybody lifting in pounds that relabels every set
   they have ever logged: a 135 lb bench becomes 135 kg, and the screen,
   converting kilograms to pounds to show it, renders 298. A whole
   training history reading 2.2 times heavier than anything ever lifted.

   It was invisible to every test here, because every test here is in
   kilograms, where the conversion is multiplication by one.

   The data below is the real shape, taken from a real account: sets as
   `{w:"135", r:"8"}` strings, a session total as `"14705 lb"` with its
   unit inside the string, and lk_weightStorageUnit set to "lb".

   Two things are proved. A phone arriving from v6 now converts. And a
   phone that already ran the broken migration is REPAIRED -- which is
   only possible because that migration kept the original `w` beside the
   kg it derived, so every damaged figure still has its source next to
   it. Nothing here guesses which numbers were doubled; every one is
   recomputed from the original. */
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = await readFile(path.join(ROOT, '08-build/store.js'), 'utf8');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* A phone, as a bag of strings. */
function phone(seed) {
  const mem = Object.assign({}, seed);
  const win = {
    localStorage: {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; },
      key: (i) => Object.keys(mem)[i] || null,
      get length() { return Object.keys(mem).length; }
    },
    addEventListener() {}, dispatchEvent() {}, CustomEvent: function () {},
    document: { addEventListener() {} }
  };
  win.window = win;
  const fn = new Function('window', 'self', 'globalThis', SRC + '\nreturn window.LKStore;');
  const store = fn(win, win, win);
  return { store, mem };
}

/* One real session, in the shape a v6 phone holds it. */
const V6 = (unit) => ({
  lk_weightStorageUnit: JSON.stringify(unit),
  lk_unitConversion: 'false',
  lk_profile: JSON.stringify({ username: 'cesco', useKg: false, weightKg: 57.15 }),
  lk_history: JSON.stringify([{
    date: '6/12/2026', dateISO: '2026-06-12', name: 'Push',
    vol: '14705 ' + unit, dur: '62 min', sets: '11',
    exercises: [{
      id: 111, name: 'Bench Press',
      sets: [
        { w: '135', r: '8', rir: '2', done: true, setType: 'warmup' },
        { w: '185', r: '5', rir: '1', done: true },
        { w: '205', r: '3', rir: '0', done: true }
      ]
    }]
  }])
});

const kgOf = (store, i) =>
  store.get('lk_history', [])[0].exercises[0].sets[i].kg;

console.log('=== a phone arriving from the shipped app, logging in pounds ===\n');

let { store } = phone(V6('lb'));
/* 135 lb is 61.2 kg. Read as kilograms it would still say 135. */
ok(Math.abs(kgOf(store, 0) - 61.235) < 0.01,
   '135 lb is stored as 61.2 kg, not as 135 kg', String(kgOf(store, 0)));
ok(Math.abs(kgOf(store, 2) - 92.987) < 0.01,
   'and the top set with it', String(kgOf(store, 2)));

const row = store.get('lk_history', [])[0];
ok(Math.abs(row.kg - 6670.5) < 2,
   'the session total reads the unit out of its own string', String(row.kg));
ok(store.get('lk_v6WeightUnit', null) === 'lb',
   'and what the old numbers meant is written down, once');

console.log('\n=== the same phone, if it always lifted in kilos ===\n');

({ store } = phone(V6('kg')));
ok(kgOf(store, 0) === 135, '135 kg stays 135 kg', String(kgOf(store, 0)));
ok(Math.abs(store.get('lk_history', [])[0].kg - 14705) < 1,
   'and its total is untouched', String(store.get('lk_history', [])[0].kg));

console.log('\n=== a phone that already ran the broken migration ===\n');

/* What that phone holds: kg carrying the pound number, with the original
   `w` still beside it. That is what makes this repairable at all. */
const DAMAGED = {
  lk_weightStorageUnit: JSON.stringify('lb'),
  lk_unitConversion: 'false',
  lk_profile: JSON.stringify({ username: 'cesco', useKg: false }),
  lk_history: JSON.stringify([{
    date: '2026-06-12', name: 'Push', kind: 'lift', min: 62, sets: 11,
    kg: 14705, vol: '14705 lb',
    exercises: [{
      id: 111, name: 'Bench Press', muscle: 'Chest',
      sets: [
        { kg: 135, reps: 8, rir: 2, w: '135', r: '8', warm: true, done: true, partials: 0 },
        { kg: 185, reps: 5, rir: 1, w: '185', r: '5', warm: false, done: true, partials: 0 },
        /* Logged in THIS build, in kilograms, with no original beside it.
           It must not be touched. */
        { kg: 100, reps: 5, warm: false, done: true, partials: 0 }
      ]
    }]
  }])
};

({ store } = phone(DAMAGED));
ok(Math.abs(kgOf(store, 0) - 61.235) < 0.01,
   'the relabelled set is put back', String(kgOf(store, 0)));
ok(Math.abs(kgOf(store, 1) - 83.915) < 0.01,
   'and so is the one after it', String(kgOf(store, 1)));
ok(kgOf(store, 2) === 100,
   'a set logged in this build, in kilos, is left alone', String(kgOf(store, 2)));
ok(Math.abs(store.get('lk_history', [])[0].kg - 6670.5) < 2,
   'the session total too', String(store.get('lk_history', [])[0].kg));

console.log('\n=== and running it again changes nothing ===\n');

/* Every figure is recomputed from the original string, so the repair has
   no opinion about whether it has run before. */
const once = JSON.stringify(store.get('lk_history', []));
const { store: store2 } = phone({
  lk_weightStorageUnit: JSON.stringify('lb'),
  lk_unitConversion: 'false',
  lk_profile: JSON.stringify({ username: 'cesco', useKg: false }),
  lk_v6WeightUnit: JSON.stringify('lb'),
  lk_history: once
});
ok(JSON.stringify(store2.get('lk_history', [])) === once,
   'a repaired history is not repaired twice');

console.log('\n=== an account with no record of its unit ===\n');

/* No lk_weightStorageUnit at all. The old app derived it from the same
   two synced values, and so does this, so two devices agree. */
({ store } = phone({
  lk_unitConversion: 'false',
  lk_profile: JSON.stringify({ username: 'x', useKg: false }),
  lk_history: JSON.stringify([{
    date: '6/1/2026', name: 'Push', vol: '1000 lb',
    exercises: [{ id: 1, name: 'Bench', sets: [{ w: '100', r: '5', done: true }] }]
  }])
}));
ok(Math.abs(kgOf(store, 0) - 45.36) < 0.01,
   'pounds are derived the way the old app derived them', String(kgOf(store, 0)));

({ store } = phone({
  lk_unitConversion: 'true',
  lk_profile: JSON.stringify({ username: 'x', useKg: true }),
  lk_history: JSON.stringify([{
    date: '6/1/2026', name: 'Push', vol: '1000 kg',
    exercises: [{ id: 1, name: 'Bench', sets: [{ w: '100', r: '5', done: true }] }]
  }])
}));
ok(kgOf(store, 0) === 100, 'and an account that converted stays in kilos',
   String(kgOf(store, 0)));

console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
