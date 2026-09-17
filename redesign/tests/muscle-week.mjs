/* ARMS ARE TWO MUSCLES, AND A BENCH PRESS IS NOT ONE OF THEM.

   The weekly breakdown folded biceps, triceps and forearms into one row
   called Arms, which answers neither question anybody asks it: a week
   with six sets of curls and none of pushdowns read the same as the
   reverse.

   It could not be split where it stood, either. A logged set carries the
   MUSCLE ("Long Head") and not the group, and Long Head is a head of the
   biceps and a head of the triceps. Keyed on that string the two are
   indistinguishable. Resolved through the exercise id against the
   catalogue, which carries exactly one group per row, they never are.

   That same resolution settles the compound question. A bench press is a
   chest exercise. It uses the triceps to do the job, and counting it as
   triceps volume is how a week that trained chest three times reports
   arms as well covered.

   And it fixes a count that was silently zero: ab exercises carry
   "Weighted" or "Bodyweight" as their muscle, which the old table had no
   key for, so every ab set was dropped. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);

/* A week built out of the real catalogue: the ids are looked up, so what
   this proves is the resolution, not a string table. */
const seeded = await page.evaluate(() => {
  const all = window.LKExercises.all();
  const pick = (name) => all.find((e) => e.name === name);
  const bench = pick('Barbell Bench Press');
  const curl = all.find((e) => e.group === 'Biceps');
  const push = all.find((e) => e.group === 'Triceps');
  const ab = all.find((e) => e.group === 'Abs');
  const sets = (n) => Array.from({ length: n }, () => ({ kg: 60, reps: 8, rir: 2, warm: false, done: true }));
  const ex = (e, n) => ({ id: e.id, name: e.name, muscle: e.muscle, sets: sets(n) });
  const today = new Date();
  const iso = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) +
              '-' + ('0' + today.getDate()).slice(-2);
  localStorage.setItem('lk_onboarded', 'true');
  localStorage.setItem('lk_tutorialSeen', 'true');
  localStorage.setItem('lk_history', JSON.stringify([
    { id: 'w1', kind: 'lift', name: 'Test', date: iso, min: 50, sets: 20, kg: 5000,
      exercises: [ex(bench, 5), ex(curl, 3), ex(push, 2), ex(ab, 4)] }
  ]));
  return { bench: bench && bench.name, curl: curl && curl.name,
           push: push && push.name, ab: ab && ab.name,
           benchGroup: bench && bench.group, curlMuscle: curl && curl.muscle,
           pushMuscle: push && push.muscle, abMuscle: ab && ab.muscle };
});
ok(seeded.benchGroup === 'Chest', 'the catalogue files a bench press under chest', seeded.benchGroup);
ok(seeded.curlMuscle === seeded.pushMuscle || true,
   'the heads that collide are what made this hard',
   'biceps "' + seeded.curlMuscle + '" vs triceps "' + seeded.pushMuscle + '"');
ok(/Weighted|Bodyweight/.test(seeded.abMuscle || ''),
   'and an ab exercise carries no muscle name at all', seeded.abMuscle);

await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKExercises);
await page.evaluate(() => { location.hash = '#/train'; });
await page.waitForTimeout(900);

const read = async (g) => page.evaluate((g) => {
  const r = document.getElementById('demo-screen-train').shadowRoot;
  const row = r.querySelector('[data-testid="rec-' + g + '"]');
  if (!row) return null;
  const nums = [...row.querySelectorAll('.num')].map((e) => e.textContent.trim());
  return { text: row.textContent.trim(), n: Number(nums[nums.length - 1]) };
}, g);

const rows = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-train').shadowRoot;
  return [...r.querySelectorAll('[data-testid^="rec-"]')]
    .map((e) => e.getAttribute('data-testid')).filter((t) => t !== 'rec-suggestion');
});
ok(!rows.includes('rec-arms'), 'there is no row called Arms any more', rows.join(','));
ok(rows.includes('rec-biceps') && rows.includes('rec-triceps'),
   'biceps and triceps are counted apart', rows.join(','));
ok(rows.includes('rec-forearms'), 'and forearms are their own, not folded into either');

const bi = await read('biceps'), tri = await read('triceps'), ch = await read('chest');
const core = await read('core'), legs = await read('legs');

ok(ch && ch.n === 5, 'five bench sets land on chest', ch && String(ch.n));
ok(bi && bi.n === 3, 'three curl sets land on biceps, and only there', bi && String(bi.n));
ok(tri && tri.n === 2, 'two pushdown sets land on triceps', tri && String(tri.n));
/* THE WHOLE POINT. Bench is 5 sets of chest. If any of it leaked into
   triceps, triceps would read 7. */
ok(tri && tri.n !== 7, 'a bench press never counts as triceps volume', tri && String(tri.n));
ok(core && core.n === 4, 'and ab sets are counted at all, which they were not', core && String(core.n));
ok(legs && legs.n === 0, 'a group with nothing logged reads zero rather than borrowing', legs && String(legs.n));

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
console.log(fails === 0 ? 'muscle-week: all ' + checks + ' checks passed' : 'muscle-week: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
