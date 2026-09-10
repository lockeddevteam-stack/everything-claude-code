/* Builds tests/fixtures/exercise-db.json and the inline fallback array in
 * 08-build/exercise-library.html from the free-exercise-db delivery.
 *
 *   node redesign/tests/fixtures/gen-exercise-db.mjs <path-to>/all-exercises.json
 *
 * Three decisions are encoded here, each one made by the app's owner:
 *
 *   1. Lifting only. Stretching, plyometrics and cardio are dropped, because
 *      Cardio is its own screen and the library is a lifting catalogue.
 *   2. Heads are derived from the exercise name. The source has no head-level
 *      field, so Upper Chest, Side Delt, Long Head and the rest come from
 *      keyword rules below. They are a good first pass, not verified lift by
 *      lift, and the rules are written out so a wrong one is one line to fix.
 *   3. Neck folds into Back / Traps. The body figure has no measured neck
 *      region, so eight exercises would otherwise have nowhere to live.
 *
 * Ids already in the fixture are kept. A name that was in the old catalogue
 * keeps its number, so a saved workout, a split and the dev presets all still
 * resolve after a regeneration.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_JSON = path.join(HERE, 'exercise-db.json');
const LIB = path.join(HERE, '..', '..', '08-build', 'exercise-library.html');
const SRC = process.argv[2];
if (!SRC) { console.error('usage: gen-exercise-db.mjs <all-exercises.json>'); process.exit(1); }

const KEEP_CATEGORY = new Set(['strength', 'powerlifting', 'olympic weightlifting', 'strongman']);

/* Group and region names, in the order the app draws them. This has to stay
   the same list the screen carries, or a lift lands in a group with no row. */
const GROUPS = [
  ['chest', 'Chest', [['upper','Upper Chest'], ['mid','Mid Chest'], ['lower','Lower Chest']]],
  ['back', 'Back', [['lats','Lats'], ['midback','Mid Back'], ['lowerback','Lower Back'], ['traps','Traps']]],
  ['shoulders', 'Shoulders', [['front','Front Delt'], ['side','Side Delt'], ['rear','Rear Delt']]],
  ['triceps', 'Triceps', [['long','Long Head'], ['lateral','Lateral Head'], ['medial','Medial Head']]],
  ['biceps', 'Biceps', [['long','Long Head'], ['short','Short Head']]],
  ['forearms', 'Forearms', [['all','Forearms']]],
  ['quads', 'Quads', [['all','Quads']]],
  ['hams', 'Hamstrings', [['all','Hamstrings']]],
  ['glutes', 'Glutes', [['all','Glutes']]],
  ['adduc', 'Inner/Outer Thigh', [['all','Inner/Outer Thigh']]],
  ['abs', 'Abs', [['weighted','Weighted'], ['bw','Bodyweight']]],
  ['calves', 'Calves', [['all','Calves']]]
];
const GNAME = {}, SNAME = {}, GORDER = {}, SORDER = {};
GROUPS.forEach((g, i) => {
  GNAME[g[0]] = g[1]; GORDER[g[0]] = i;
  g[2].forEach((s, j) => { SNAME[g[0] + '/' + s[0]] = s[1]; SORDER[g[0] + '/' + s[0]] = j; });
});

/* Source muscle to app group. Seventeen names collapse to twelve: the four
   back regions and the neck all live under Back, and both thigh adductors
   and abductors share the Inner/Outer Thigh group the figure draws. */
const TO_GROUP = {
  'chest': ['chest', null], 'shoulders': ['shoulders', null],
  'triceps': ['triceps', null], 'biceps': ['biceps', null], 'abdominals': ['abs', null],
  'lats': ['back', 'lats'], 'middle back': ['back', 'midback'],
  'lower back': ['back', 'lowerback'], 'traps': ['back', 'traps'], 'neck': ['back', 'traps'],
  'forearms': ['forearms', 'all'], 'quadriceps': ['quads', 'all'], 'hamstrings': ['hams', 'all'],
  'glutes': ['glutes', 'all'], 'adductors': ['adduc', 'all'], 'abductors': ['adduc', 'all'],
  'calves': ['calves', 'all']
};

const EQUIP = {
  'barbell': 'Barbell', 'dumbbell': 'Dumbbell', 'cable': 'Cable', 'machine': 'Machine',
  'bodyweight': 'Bodyweight', 'none': 'Bodyweight', 'kettlebells': 'Kettlebell',
  'bands': 'Bands', 'ez curl bar': 'EZ Bar', 'medicine ball': 'Medicine Ball',
  'exercise ball': 'Exercise Ball', 'foam roll': 'Foam Roller', 'other': 'Other'
};
const LOADED = new Set(['Barbell','Dumbbell','Cable','Machine','Kettlebell','Bands','EZ Bar','Medicine Ball']);

/* Head rules. First match wins; the last entry of each list is the default,
   and it is the head that movement most often lands on when nothing in the
   name says otherwise. */
const HEADS = {
  chest: [
    [/incline|low.to.high|landmine\s+press/i, 'upper'],
    [/decline|\bdip\b|high.to.low/i, 'lower'],
    [/./, 'mid']
  ],
  shoulders: [
    [/\brear\b|reverse (fly|flye|pec)|face pull|bent.?over (lateral|raise|fly)|rear delt/i, 'rear'],
    [/lateral raise|side lateral|upright row|side delt|\blateral\b/i, 'side'],
    [/./, 'front']
  ],
  triceps: [
    [/overhead|skull|french press|lying .*(extension|ext)\b|incline .*extension/i, 'long'],
    [/kickback|close.?grip|diamond|reverse.?grip|bench dip|\bdip\b/i, 'medial'],
    [/./, 'lateral']
  ],
  biceps: [
    [/preacher|spider|concentration|machine curl/i, 'short'],
    [/./, 'long']
  ]
};

function head(gid, name, eq) {
  if (gid === 'abs') return LOADED.has(eq) ? 'weighted' : 'bw';
  const rules = HEADS[gid];
  if (!rules) return 'all';
  for (const [re, sid] of rules) if (re.test(name)) return sid;
  return rules[rules.length - 1][1];
}

const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* Numbers already handed out. A regeneration must not renumber a lift that
   a logged set, a split day or a dev preset already points at. */
const prior = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) : [];
const idByName = new Map(prior.map(r => [norm(r.name), r.id]));
let nextId = prior.reduce((m, r) => Math.max(m, r.id), 10000) + 1;

const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const seen = new Set();
const rows = [];
const dropped = { category: 0, muscle: 0, duplicate: 0 };

for (const x of src) {
  if (!KEEP_CATEGORY.has(x.category)) { dropped.category++; continue; }
  const primary = (x.primary_muscles || [])[0];
  const map = TO_GROUP[primary];
  if (!map) { dropped.muscle++; continue; }
  const key = norm(x.name);
  if (seen.has(key)) { dropped.duplicate++; continue; }
  seen.add(key);

  const gid = map[0];
  const eq = EQUIP[x.equipment] || 'Other';
  const sid = map[1] || head(gid, x.name, eq);
  const id = idByName.get(key) ?? nextId++;
  rows.push({ id, name: x.name, eq, group: GNAME[gid], muscle: SNAME[gid + '/' + sid], gid, sid });
}

/* Anything the old catalogue had that this delivery does not. Dropping it
   would break a saved workout that points at it, so it is carried through. */
let carried = 0;
for (const r of prior) {
  if (seen.has(norm(r.name))) continue;
  seen.add(norm(r.name));
  rows.push(r); carried++;
}

rows.sort((a, b) =>
  GORDER[a.gid] - GORDER[b.gid] ||
  SORDER[a.gid + '/' + a.sid] - SORDER[b.gid + '/' + b.sid] ||
  a.name.localeCompare(b.name));

fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 1) + '\n');

/* The same catalogue inline, because the demo opens from file:// where
   fetch() cannot read a path and the fallback is the only data there is. */
const lines = [];
for (let i = 0; i < rows.length; i += 2) {
  lines.push('    ' + rows.slice(i, i + 2).map(r =>
    `[${r.id},${JSON.stringify(r.name)},${JSON.stringify(r.eq)},'${r.gid}','${r.sid}']`).join(', ') + ',');
}
const block = lines.join('\n').replace(/,$/, '');
const html = fs.readFileSync(LIB, 'utf8');
const start = html.indexOf('  var FALLBACK = [');
const end = html.indexOf('\n  ];', start);
if (start < 0 || end < 0) { console.error('could not find FALLBACK in exercise-library.html'); process.exit(1); }
fs.writeFileSync(LIB, html.slice(0, start) + '  var FALLBACK = [\n' + block + html.slice(end));

const byGroup = {};
rows.forEach(r => { byGroup[r.group] = (byGroup[r.group] || 0) + 1; });
console.log(`${rows.length} exercises written`);
console.log('dropped:', JSON.stringify(dropped), '| carried from the old catalogue:', carried);
Object.entries(byGroup).forEach(([g, n]) => console.log('  ' + g.padEnd(20) + n));
