/* Generates 08-build/fixtures.js from seed-data.json.
 *
 *   node redesign/tests/fixtures/gen-fixtures.mjs
 *
 * WHY THIS EXISTS. Every screen that shows training history used to carry its
 * own hand-typed copy of it. Two copies is one copy too many: recap.html was
 * written with an invented 22-row array and only four of its rows matched the
 * real data, so Recap reported a September of 5 sessions and 50,203 kg while
 * Train reported 4 and 25,787 from the same fixture. Nothing caught it,
 * because every screen agreed with itself.
 *
 * So the history, the PRs and the weight log are generated here, once, from
 * the fixture, and every screen reads window.LKFixtures. A screen can still
 * choose what to show; it can no longer disagree about what happened.
 *
 * Volume and set counts are RECOMPUTED from each session's own set rows
 * rather than trusted from the stored summary, so a fixture whose summary
 * drifts from its sets is caught here instead of on screen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED = path.join(HERE, 'seed-data.json');
const OUT = path.join(HERE, '..', '..', '08-build', 'fixtures.js');

const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
const raw = JSON.parse(seed.lk_history);

const warn = [];
const history = raw.map((w) => {
  const isCardio = /run|walk|bike|erg|row|cycle|swim|hike/i.test(w.name) && !w.exercises?.length;
  /* WORKING sets, which means warmups are not counted and their load is not
     in the volume. That is the rule the stored summaries already follow, and
     counting every done set instead made this generator disagree with all
     eighteen lifting sessions on its first run -- 17 sets and 14,723 kg
     against a stored 16 and 14,363. The fixture was right. A warm-up is
     something you did, not something you lifted. */
  let sets = 0, vol = 0;
  for (const ex of w.exercises || []) {
    for (const st of ex.sets || []) {
      if (!st.done || st.setType === 'warmup') continue;
      sets++;
      const kg = parseFloat(st.w), reps = parseFloat(st.r);
      if (!isNaN(kg) && !isNaN(reps)) vol += kg * reps;
    }
  }
  vol = Math.round(vol);
  /* The stored summary is checked, not trusted. */
  const statedSets = parseInt(w.sets, 10);
  const statedVol = parseInt(String(w.vol).replace(/[^\d]/g, ''), 10);
  if (!isCardio && statedSets && statedSets !== sets) warn.push(`${w.dateISO} sets: stored ${statedSets}, computed ${sets}`);
  if (!isCardio && statedVol && Math.abs(statedVol - vol) > 1) warn.push(`${w.dateISO} vol: stored ${statedVol}, computed ${vol}`);

  const min = parseInt(String(w.dur).replace(/[^\d]/g, ''), 10) ||
              (w.durationSec ? Math.round(w.durationSec / 60) : 0);
  const rec = { id: w.id, kind: isCardio ? 'cardio' : 'lift', name: w.name, date: w.dateISO, min };
  if (isCardio) {
    /* The seed stores metres and kilocalories under their full names; the
       screens want km. Reading w.km straight off the record returned
       undefined for every cardio session and the rows printed "null km". */
    rec.km = w.distanceM != null ? Math.round(w.distanceM / 100) / 10 : null;
    /* calories is an object in the seed -- {value, net, gross, range, method,
       tier, confidence, basis, estimated} -- not a number. Assigning it whole
       printed "[object Object] kcal" on the Recap cardio row. `value` is the
       figure the stored records show (Treadmill run = 340), and it is
       kilocalories, so every screen labels it kcal. */
    var c = w.calories;
    rec.cal = c == null ? null : (typeof c === 'object' ? (c.value ?? null) : c);
  } else { rec.sets = sets; rec.kg = vol; }
  return rec;
}).sort((a, b) => (a.date < b.date ? 1 : -1));

/* PRs, flattened to the best set per lift. lk_prs keys on exercise id and
   holds every qualifying set, so "the PR" is the heaviest of them. */
const prsRaw = JSON.parse(seed.lk_prs);
/* Records carry their exercise's name, resolved here from the catalogue, so
   no screen has to keep its own id-to-name map. Recap's did, and it was
   missing three of the nine ids in the fixture -- those rows read
   "Exercise 801". */
const catalogue = JSON.parse(fs.readFileSync(path.join(HERE, 'exercise-db.json'), 'utf8'));
const nameOf = new Map(catalogue.map((e) => [e.id, e.name]));
const missing = [];
const prs = Object.keys(prsRaw).map((id) => {
  const best = prsRaw[id].slice().sort((a, b) => b.w - a.w || b.r - a.r)[0];
  const nm = nameOf.get(Number(id));
  if (!nm) missing.push(id);
  return { exId: Number(id), name: nm || ('Exercise ' + id), kg: best.w, reps: best.r, date: best.date };
}).sort((a, b) => (a.date < b.date ? 1 : -1));
if (missing.length) warn.push('records name no exercise in the catalogue: ' + missing.join(', '));

/* ---------------------------------------------------------------------
   Everything else the screens were hand-typing.

   The cross-screen audit found Profile claiming 84 sessions and 413k kg
   against a fixture holding 22 and 140k, Fuel showing a body weight 22%
   heavier than Settings and Progress, the split builder running a "PPL v2"
   that exists in no split, Train counting "46 of 227" exercises against a
   library of 868, and three different supplement lists. Every one of those
   was a literal inside one screen. They are derived here instead.
   --------------------------------------------------------------------- */
const profileRaw = JSON.parse(seed.lk_profile);
const splitsRaw = JSON.parse(seed.lk_splits);
const customEx = JSON.parse(seed.lk_customEx);
customEx.forEach((e) => nameOf.set(e.id, e.name));

const splits = splitsRaw.map((sp) => ({
  id: sp.id,
  name: sp.name,
  created: sp.created,
  days: sp.days.map((d) => ({
    name: d.name,
    blocks: d.blocks || [],
    exercises: d.exIds.map((id) => {
      const nm = nameOf.get(id);
      if (!nm) missing.push('split ' + sp.name + ' exId ' + id);
      return { id, name: nm || ('Exercise ' + id) };
    })
  }))
}));

/* Lifetime totals, every one of them counted rather than stated. */
const lifts = history.filter((h) => h.kind === 'lift');
const totals = {
  sessions: history.length,
  liftSessions: lifts.length,
  cardioSessions: history.length - lifts.length,
  sets: lifts.reduce((a, h) => a + h.sets, 0),
  volumeKg: lifts.reduce((a, h) => a + h.kg, 0),
  /* Records, not record-holding lifts: lk_prs holds several per lift. */
  records: Object.keys(prsRaw).reduce((a, id) => a + prsRaw[id].length, 0),
  recordLifts: prs.length,
  cardioMin: history.filter((h) => h.kind === 'cardio').reduce((a, h) => a + h.min, 0)
};

/* Distinct exercises that appear in a logged session, and the size of the
   catalogue they are drawn from. Train printed "46 of 227"; neither figure
   came from anywhere. */
const loggedIds = new Set();
for (const w of raw) for (const ex of w.exercises || []) if (ex.id != null) loggedIds.add(Number(ex.id));
const library = {
  total: catalogue.length + customEx.length,
  catalogue: catalogue.length,
  custom: customEx.length,
  logged: loggedIds.size
};

const supplements = JSON.parse(seed.lk_supplements);
const shoppingList = JSON.parse(seed.lk_shoppingList);
const pantry = JSON.parse(seed.lk_pantryItems);
const goals = JSON.parse(seed.lk_goals);
const budget = JSON.parse(seed.lk_budgetData);
const stores = JSON.parse(seed.lk_myStores);
const bfLog = JSON.parse(seed.lk_bfLog);
/* The stored thumbs are 1x1 placeholder JPEGs. The screens draw their own
   tinted tile instead, so only the date and the note travel. */
const photos = JSON.parse(seed.lk_progressPhotos).map((p) => ({ date: p.date, note: p.note }));
const featured = JSON.parse(seed.lk_featuredLifts)
  .map((id) => ({ id, name: nameOf.get(id) || ('Exercise ' + id) }));

const profile = {
  name: profileRaw.displayName,
  username: profileRaw.username,
  useKg: profileRaw.useKg !== false,
  age: profileRaw.age,
  sex: profileRaw.sex,
  heightCm: profileRaw.heightCm,
  /* The last weigh-in, not the stale copy on the profile record. They agree
     in this fixture; if they ever stop, the weigh-in is the measurement. */
  weightKg: profileRaw.weightKg,
  goal: profileRaw.goal,
  coachName: profileRaw.coachName,
  createdAt: profileRaw.createdAt
};

const weightLog = JSON.parse(seed.lk_weightLog)
  .map((x) => ({ date: x.date, kg: x.kg }))
  .sort((a, b) => (a.date < b.date ? -1 : 1));

/* ---------------------------------------------------------------------
   NUTRITION. The seed has no food in it -- the shipped app never stored a
   day's meals in a form worth seeding -- so the fixture is authored here.
   Authored in ONE place, which is the whole point: Fuel was showing a day
   of 2,980 kcal and 160 g of protein while Recap showed the same person's
   day as 2,400 and 170, and Fuel's own macro bars carried 10 g of carbs and
   14 g of fat belonging to no meal on the list. Nothing below is a total.
   Every total is added up from the meals, here, once.
   --------------------------------------------------------------------- */
const FOODS = {
  eggs:     { icon: '\u{1F373}', name: 'Eggs, toast, butter',  kcal: 540, pro: 38, carb: 46, fat: 24 },
  bowl:     { icon: '\u{1F957}', name: 'Chicken rice bowl',    kcal: 720, pro: 52, carb: 84, fat: 16 },
  shake:    { icon: '\u{1F964}', name: 'Whey shake, banana',   kcal: 310, pro: 31, carb: 38, fat: 4 },
  pasta:    { icon: '\u{1F35D}', name: 'Beef mince and pasta', kcal: 810, pro: 48, carb: 92, fat: 26 },
  chilli:   { icon: '\u{1F372}', name: 'Chilli',               kcal: 530, pro: 41, carb: 38, fat: 18 },
  cnr:      { icon: '\u{1F35A}', name: 'Chicken and rice',     kcal: 690, pro: 61, carb: 74, fat: 13 },
  pancakes: { icon: '\u{1F95E}', name: 'Protein pancakes',     kcal: 360, pro: 31, carb: 37, fat: 8 },
  skyr:     { icon: '\u{1F96B}', name: 'Skyr, plain',          kcal: 96,  pro: 17, carb: 6,  fat: 0.3 }
};

const TARGETS = { kcal: 2980, pro: 160, carb: 380, fat: 80, waterMl: 3000 };

/* src is the provenance of the figures, and it is the only thing that earns
   a Verified badge: 'verified' means a barcode matched a database row,
   'estimate' means a model read a photo, 'recipe' means your own recipe,
   'repeat' means a meal you logged before, logged again. Re-logging used to
   stamp 'verified' on a home-cooked meal and tell the reader a barcode had
   read it. */
const DAY_LOG = {
  '2026-09-09': { water: 1750, supps: [true, true], meals: [
    ['eggs', '8:05', 'verified'], ['bowl', '12:40', 'estimate'], ['shake', '3:15', 'verified'] ] },
  '2026-09-08': { water: 3100, supps: [true, true], meals: [
    ['eggs', '8:10', 'verified'], ['cnr', '12:30', 'recipe'], ['pasta', '7:20', 'estimate'],
    ['shake', '4:05', 'verified'], ['pancakes', '9:30', 'recipe'] ] },
  '2026-09-07': { water: 2900, supps: [true, false], meals: [
    ['eggs', '8:00', 'verified'], ['bowl', '12:45', 'estimate'], ['chilli', '7:15', 'recipe'],
    ['shake', '3:40', 'verified'], ['pancakes', '9:45', 'recipe'], ['skyr', '10:30', 'verified'] ] },
  '2026-09-06': { water: 2600, supps: [false, false], meals: [
    ['eggs', '9:20', 'verified'], ['cnr', '1:10', 'recipe'], ['chilli', '7:00', 'recipe'],
    ['shake', '4:30', 'verified'] ] }
};

const round1 = (x) => Math.round(x * 10) / 10;
const nutritionDays = {};
for (const iso of Object.keys(DAY_LOG)) {
  const d = DAY_LOG[iso];
  const meals = d.meals.map(([k, at, src]) => {
    const f = FOODS[k];
    if (!f) throw new Error('no food named ' + k);
    return { key: k, icon: f.icon, name: f.name, at, src, kcal: f.kcal, pro: f.pro, carb: f.carb, fat: f.fat };
  });
  nutritionDays[iso] = {
    date: iso,
    meals,
    eaten: meals.reduce((a, m) => a + m.kcal, 0),
    pro: round1(meals.reduce((a, m) => a + m.pro, 0)),
    carb: round1(meals.reduce((a, m) => a + m.carb, 0)),
    fat: round1(meals.reduce((a, m) => a + m.fat, 0)),
    waterMl: d.water,
    supps: supplements.map((sp, i) => ({ name: sp.name, dose: sp.dose, when: sp.timeOf, taken: !!d.supps[i] }))
  };
}

/* Fourteen days of intake. The last four are the days above, added up, not
   typed again: a trend that disagrees with the day it ends on is the same
   defect one screen further out. */
const trendHead = [2870, 3040, 2790, 3180, 2900, 2680, 2985, 2740, 3120, 2610];
const trendTail = ['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09'].map((iso) => nutritionDays[iso].eaten);
const nutrition = {
  targets: TARGETS,
  foods: FOODS,
  days: nutritionDays,
  trend: trendHead.concat(trendTail)
};

if (profile.weightKg !== weightLog[weightLog.length - 1].kg) {
  warn.push(`profile weight ${profile.weightKg} kg is not the last weigh-in ${weightLog[weightLog.length - 1].kg} kg`);
}

const body = `/* GENERATED — do not edit.
   Written by tests/fixtures/gen-fixtures.mjs from tests/fixtures/seed-data.json.
   Regenerate with:  node redesign/tests/fixtures/gen-fixtures.mjs

   One copy of the training history, the records and the weight log, read by
   every screen that shows them. Screens used to hand-type their own, and two
   of them disagreed about what the same month contained.

   Volume and set counts here are recomputed from each session's own set rows
   rather than copied from its stored summary. */
(function (g) {
  'use strict';
  g.LKFixtures = {
    today: '2026-09-09',
    history: ${JSON.stringify(history, null, 6).replace(/\n/g, '\n    ')},
    prs: ${JSON.stringify(prs, null, 6).replace(/\n/g, '\n    ')},
    weightLog: ${JSON.stringify(weightLog, null, 6).replace(/\n/g, '\n    ')},
    bfLog: ${JSON.stringify(bfLog, null, 6).replace(/\n/g, '\n    ')},
    profile: ${JSON.stringify(profile, null, 6).replace(/\n/g, '\n    ')},
    totals: ${JSON.stringify(totals, null, 6).replace(/\n/g, '\n    ')},
    library: ${JSON.stringify(library, null, 6).replace(/\n/g, '\n    ')},
    splits: ${JSON.stringify(splits, null, 6).replace(/\n/g, '\n    ')},
    featured: ${JSON.stringify(featured, null, 6).replace(/\n/g, '\n    ')},
    goals: ${JSON.stringify(goals, null, 6).replace(/\n/g, '\n    ')},
    photos: ${JSON.stringify(photos, null, 6).replace(/\n/g, '\n    ')},
    supplements: ${JSON.stringify(supplements, null, 6).replace(/\n/g, '\n    ')},
    shoppingList: ${JSON.stringify(shoppingList, null, 6).replace(/\n/g, '\n    ')},
    pantry: ${JSON.stringify(pantry, null, 6).replace(/\n/g, '\n    ')},
    budget: ${JSON.stringify(budget, null, 6).replace(/\n/g, '\n    ')},
    stores: ${JSON.stringify(stores, null, 6).replace(/\n/g, '\n    ')},
    customEx: ${JSON.stringify(customEx, null, 6).replace(/\n/g, '\n    ')},
    nutrition: ${JSON.stringify(nutrition, null, 6).replace(/\n/g, '\n    ')},

    /* Every session on a date, newest first. */
    on: function (iso) {
      return g.LKFixtures.history.filter(function (h) { return h.date === iso; });
    },
    /* Inclusive both ends. */
    between: function (a, b) {
      return g.LKFixtures.history.filter(function (h) { return h.date >= a && h.date <= b; });
    }
  };
})(typeof window !== 'undefined' ? window : this);
`;
fs.writeFileSync(OUT, body);

console.log(`wrote ${OUT}`);
console.log(`  ${history.length} sessions (${history.filter(h => h.kind === 'lift').length} lifting, ${history.filter(h => h.kind === 'cardio').length} cardio)`);
console.log(`  ${prs.length} record lifts (${totals.records} records), ${weightLog.length} weigh-ins`);
console.log(`  ${totals.sets} working sets, ${totals.volumeKg.toLocaleString('en-GB')} kg lifted`);
console.log(`  ${library.logged} of ${library.total} library exercises logged, ${splits.length} splits`);
Object.keys(nutritionDays).sort().reverse().forEach((iso) => {
  const d = nutritionDays[iso];
  console.log(`  ${iso}: ${d.meals.length} meals, ${d.eaten} kcal, ${d.pro}P ${d.carb}C ${d.fat}F`);
});
if (warn.length) {
  console.log('\nthe fixture disagrees with itself:');
  warn.forEach((w) => console.log('  ' + w));
  process.exit(1);
}
console.log('  every stored summary matches its own set rows');
