/* THE HALF THAT WRITES.

   coach-actions.mjs attacks check(): the gate between a language model
   and somebody's training data, and it holds. Nothing tested apply() --
   the function that takes what check() approved and puts it in storage.

   A gate that refuses the wrong thing perfectly is worth nothing if the
   thing it lets through is written wrongly. The failures that live here
   are quiet ones: a split that lands on top of the one already there
   rather than beside it, an action applied twice because a card was
   tapped twice, a revert that takes the reader's own work out along
   with the coach's.

   And apply() must refuse what check() refused. It is a separate entry
   point on the same object; anything that calls it directly -- a retry,
   a queued card, a screen written later -- bypasses the gate entirely
   unless apply guards itself. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

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
eval(fs.readFileSync(path.join(BUILD, 'coach-actions.js'), 'utf8'));
const S = global.window.LKStore;
const CA = global.window.LKCoachActions;
CA.setCatalogue(JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'exercise-db.json'), 'utf8')));

/* Work the reader already did, which nothing the coach writes may touch. */
const MINE = { id: 'mine', name: 'My own split', created: '9/1/2026',
               days: [{ name: 'Push', exercises: [{ id: 104, name: 'Incline Machine Press' }] }] };
S.set('lk_splits', [MINE]);
S.set('lk_shoppingList', [{ id: 'mine-1', itemName: 'Oats', quantity: '1', unit: 'kg' }]);

const SPLIT = { kind: 'split', title: 'Upper / Lower', split: { name: 'Upper Lower', days: [
  { name: 'Upper', exercises: [{ id: 104, name: 'Incline Machine Press', sets: 4 }] },
  { name: 'Lower', exercises: [{ id: 104, name: 'Incline Machine Press', sets: 3 }] }
] } };

console.log('=== what the gate approved is what gets written ===\n');

const v = CA.check(SPLIT);
ok(v.ok, 'the split passes the gate', (v.problems || []).join('; '));

const a1 = CA.apply(v.action || SPLIT);
ok(a1.ok, 'and applies', (a1.problems || []).join('; '));
ok(a1.token && a1.token.kind === 'split', 'handing back a token to undo it with',
   JSON.stringify(a1.token && a1.token.kind));

const after = S.get('lk_splits', []);
ok(Array.isArray(after) && after.length === 2, 'it lands BESIDE the reader’s own split',
   (after || []).length + ' splits');
ok(after.some((x) => x.id === 'mine'), 'which is untouched',
   JSON.stringify(after.map((x) => x.id)));
const added = after.filter((x) => x.id !== 'mine')[0];
ok(added && added.days && added.days.length === 2, 'and the written split has both its days',
   JSON.stringify(added && added.days && added.days.length));
ok(added && added.id && added.id !== 'mine', 'under an id of its own',
   String(added && added.id));

console.log('\n=== applying the same card twice does not write it twice ===\n');

/* A card tapped twice, or retried after a slow save, is an ordinary
   accident. Two identical splits is a mess somebody has to clean up. */
const a2 = CA.apply(v.action || SPLIT);
const afterTwice = S.get('lk_splits', []);
const names = afterTwice.map((x) => x.name);
const dupes = names.filter((n) => n === 'Upper Lower').length;
ok(dupes <= 1, 'the same split is not written a second time',
   dupes + ' copies of it: ' + JSON.stringify(names));

console.log('\n=== and undo takes back only what the coach wrote ===\n');

const undone = CA.revert(a1.token);
ok(undone === true, 'the token reverts', String(undone));
const afterUndo = S.get('lk_splits', []);
ok(afterUndo.some((x) => x.id === 'mine'), 'the reader’s own split is still there',
   JSON.stringify(afterUndo.map((x) => x.id)));
ok(!afterUndo.some((x) => x.id === (added && added.id)),
   'and the coach’s is gone', JSON.stringify(afterUndo.map((x) => x.id)));

/* And undone is not banned: a card the reader took back must be
   applicable again if they change their mind. */
const again = CA.apply(v.action || SPLIT);
ok(again.ok && !again.already, 'and the same card can be applied again afterwards',
   JSON.stringify({ ok: again.ok, already: !!again.already }));
const afterAgain = S.get('lk_splits', []);
ok(afterAgain.filter((x) => x.name === 'Upper Lower').length === 1,
   'putting back exactly one copy', JSON.stringify(afterAgain.map((x) => x.name)));
CA.revert(again.token);

console.log('\n=== apply refuses what check refuses ===\n');

/* Straight into apply, with no check in front of it -- which is what a
   retry or a queued card does. */
const JUNK = [
  ['a kind nothing can apply', { kind: 'rm -rf', split: { name: 'x', days: [] } }],
  ['no kind at all', { split: { name: 'x', days: [] } }],
  ['not an object', 'delete everything'],
  ['nothing', null],
  ['a split with no days', { kind: 'split', split: { name: 'Hollow' } }],
  ['a split that is not an object', { kind: 'split', split: 'oops' }]
];
for (const [label, action] of JUNK) {
  let threw = null, r = null;
  try { r = CA.apply(action); } catch (e) { threw = e; }
  ok(!threw, 'applying ' + label + ' does not throw', threw && threw.message);
  ok(threw || (r && r.ok === false), 'and is refused',
     JSON.stringify(r && r.ok));
}

const stillMine = S.get('lk_splits', []);
ok(stillMine.some((x) => x.id === 'mine') && stillMine.length === 1,
   'and none of it changed what was stored',
   JSON.stringify(stillMine.map((x) => x.id)));

console.log('\n=== a shopping action adds, it does not replace ===\n');

const SHOP = { kind: 'shopping', items: [{ name: 'Rice', qty: '2', unit: 'kg' }] };
const sv = CA.check(SHOP);
ok(sv.ok, 'the shopping action passes the gate', (sv.problems || []).join('; '));
const sa = CA.apply(sv.action || SHOP);
ok(sa.ok, 'and applies', (sa.problems || []).join('; '));
const list = S.get('lk_shoppingList', []);
ok(list.length === 2, 'the reader’s own item is still on the list',
   JSON.stringify(list.map((x) => x.itemName || x.name)));
CA.revert(sa.token);
const listBack = S.get('lk_shoppingList', []);
ok(listBack.length === 1 && (listBack[0].itemName === 'Oats'),
   'and undo leaves it exactly as it was',
   JSON.stringify(listBack.map((x) => x.itemName || x.name)));

console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
