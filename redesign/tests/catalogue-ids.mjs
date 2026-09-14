/* Every exercise id a screen names has to be the id the catalogue holds.

   Onboarding shipped a table of fourteen lifts with nine of the ids wrong:
   501 was labelled "Barbell Squat" and is an Incline DB Curl, 502 was
   labelled "Barbell Deadlift" and is a Hammer Curl, and 521 is not an
   exercise at all. A first split built there pointed at lifts nobody chose,
   and the whole app reads a split by id, so nothing downstream could tell.

   Nothing in the suite could see it: the screen rendered, the split saved,
   every number was internally consistent. This reads the literals. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');
const CATALOGUE = path.join(HERE, 'fixtures', 'exercise-db.json');

const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));
const nameOf = new Map(catalogue.map((e) => [Number(e.id), String(e.name)]));

/* `id: 111, name: 'Barbell Bench Press'` and the same pair reversed, which
   are the two shapes these tables are written in. */
const FORWARD = /\bid:\s*(\d{2,6})\s*,\s*name:\s*(['"])(.*?)\2/g;
const REVERSE = /\bname:\s*(['"])(.*?)\1\s*,\s*id:\s*(\d{2,6})\b/g;

const norm = (s) => String(s).toLowerCase().replace(/&[a-z]+;/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

let checked = 0;
const bad = [];
for (const file of fs.readdirSync(BUILD).filter((f) => f.endsWith('.html')).sort()) {
  const src = fs.readFileSync(path.join(BUILD, file), 'utf8');
  const pairs = [];
  let m;
  while ((m = FORWARD.exec(src))) pairs.push([Number(m[1]), m[3], src.slice(0, m.index).split('\n').length]);
  while ((m = REVERSE.exec(src))) pairs.push([Number(m[3]), m[2], src.slice(0, m.index).split('\n').length]);
  for (const [id, name, line] of pairs) {
    /* Ids the catalogue has never heard of are somebody's own exercise, a
       cardio machine or a plan slot -- not a claim about the catalogue. Only
       an id the catalogue HOLDS can contradict it. */
    if (!nameOf.has(id)) continue;
    checked++;
    if (norm(nameOf.get(id)) !== norm(name)) {
      bad.push(`${file}:${line}  id ${id} is named "${name}" and the catalogue calls it "${nameOf.get(id)}"`);
    }
  }
}

console.log('=== catalogue ids — a lift is the id the catalogue gives it ===\n');
if (bad.length) {
  bad.forEach((b) => console.log('FAIL ' + b));
  console.log(`\n${bad.length} of ${checked} named ids contradict tests/fixtures/exercise-db.json`);
  process.exit(1);
}
console.log(`${checked} named exercise ids across the build, every one the catalogue's own`);
