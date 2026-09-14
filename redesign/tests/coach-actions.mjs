/* THE GATE, ATTACKED.

   coach-actions.js stands between a language model and somebody's
   training data. The interesting test is not that a good action saves —
   it is that a bad one cannot. Every case below is something a model
   plausibly returns: an exercise id that does not exist, a right id
   under the wrong name, a calorie total that does not match its own
   ingredients, a number outside anything a screen would accept.

   A refusal here is a pass. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');

global.window = {};
eval(fs.readFileSync(path.join(BUILD, 'coach-actions.js'), 'utf8'));
const CA = global.window.LKCoachActions;

const catalogue = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'exercise-db.json'), 'utf8'));
CA.setCatalogue(catalogue);

/* The food table, as the screens see it. */
global.window.LKFixtures = { nutrition: { foods: {
  eggs:  { name: 'Eggs, toast, butter', icon: '\u{1F373}', kcal: 540, pro: 38, carb: 46, fat: 24 },
  bowl:  { name: 'Chicken rice bowl',   icon: '\u{1F957}', kcal: 720, pro: 52, carb: 84, fat: 16 }
} } };

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};
const refused = (action, name, expect) => {
  const v = CA.check(action);
  const why = v.problems.join('; ');
  ok(!v.ok && (!expect || why.includes(expect)), name, v.ok ? 'IT WAS ALLOWED' : why.slice(0, 96));
};

console.log('=== coach actions — what the gate refuses ===\n');

/* ---- ids the catalogue does not hold ---------------------------- */
refused({ kind: 'split', split: { name: 'X', days: [{ name: 'Push', exercises: [{ id: 99999, name: 'Bench' }] }] } },
  'an exercise id that does not exist', 'not in the exercise catalogue');

refused({ kind: 'split', split: { name: 'X', days: [{ name: 'Push', exercises: [{ name: 'Moon Press' }] }] } },
  'an exercise name that matches nothing', 'not in the exercise catalogue');

/* The one that shipped by hand twice: a real id under the wrong name. */
{
  const v = CA.check({ kind: 'split', split: { name: 'X', days: [
    { name: 'Legs', exercises: [{ id: 501, name: 'Barbell Squat' }] }] } });
  const got = v.ok ? v.action.days[0].exercises[0].name : null;
  ok(v.ok && got === 'Incline DB Curl', 'a right id under a wrong name takes the catalogue’s name',
     got === null ? 'refused' : 'became "' + got + '"');
}

/* ---- totals the model states are not believed -------------------- */
{
  const v = CA.check({ kind: 'recipe', recipe: { name: 'Big bowl', servings: 2,
    kcal: 99, pro: 99, carb: 99, fat: 99,
    items: [{ key: 'eggs', qty: 1 }, { key: 'bowl', qty: 1 }] } });
  ok(v.ok && v.action.kcal === 1260 && v.action.pro === 90,
     'a recipe is costed from its ingredients, not from what it claims',
     v.ok ? v.action.kcal + ' kcal, ' + v.action.pro + ' P' : v.problems.join('; '));
}

/* ---- food with no working behind it ------------------------------ */
refused({ kind: 'recipe', recipe: { name: 'Mystery', servings: 1,
  items: [{ name: 'Protein fluff', kcal: 300 }] } },
  'a food outside the table with calories but no macros', 'does not carry protein');

{
  const v = CA.check({ kind: 'food', meal: { name: 'Home chilli', slot: 'dinner',
    kcal: 500, pro: 40, carb: 30, fat: 20 } });
  ok(v.ok, 'a food outside the table WITH every macro is allowed',
     v.ok ? v.action.kcal + ' kcal' : v.problems.join('; '));
}

/* ---- numbers outside what a screen accepts ----------------------- */
refused({ kind: 'goal', goal: { type: 'lift', exName: 'Barbell Bench Press', target: 9000 } },
  'a goal target above what any screen accepts', 'target between');
refused({ kind: 'cardio', session: { name: 'Run', minutes: 100000 } },
  'a cardio session longer than a day', 'minutes between');
refused({ kind: 'split', split: { name: 'X', days: new Array(9).fill({ name: 'D', exercises: [] }) } },
  'more than seven days in a week', 'days in a week');

/* ---- shapes that are not actions --------------------------------- */
refused({ kind: 'delete_everything', what: 'all' }, 'a kind the coach does not have', 'is not something the coach can do');
refused({ kind: 'split', split: { name: 'X', days: [] } }, 'a split with no days', 'no days');
refused({ kind: 'shopping', items: [] }, 'an empty shopping list', 'nothing on it');
refused(null, 'nothing at all', 'not an action');

/* ---- a good one still passes, whole ------------------------------ */
{
  const v = CA.check({ kind: 'split', title: 'Upper / Lower', split: { name: 'Upper / Lower', days: [
    { name: 'Upper', exercises: [{ name: 'Barbell Bench Press', sets: 4 }, { name: 'Barbell Row' }] },
    { name: 'Lower', exercises: [{ name: 'Barbell Squat', sets: 5 }] }] } });
  ok(v.ok && v.action.exercises === 3 && v.action.days[0].exercises[0].sets === 4,
     'a sound split passes whole, with its own count',
     v.ok ? v.action.days.length + ' days, ' + v.action.exercises + ' exercises' : v.problems.join('; '));
}

/* ---- with no catalogue, nothing to do with lifts may pass -------- */
{
  CA.setCatalogue([]);
  const v = CA.check({ kind: 'split', split: { name: 'X', days: [
    { name: 'Push', exercises: [{ id: 111, name: 'Barbell Bench Press' }] }] } });
  ok(!v.ok, 'with no catalogue loaded, a split is refused rather than guessed at',
     v.ok ? 'IT WAS ALLOWED' : v.problems.join('; ').slice(0, 70));
  CA.setCatalogue(catalogue);
}

console.log('');
if (fails) { console.log(`${fails} checks failed`); process.exit(1); }
console.log('every bad action was refused, and said why');
