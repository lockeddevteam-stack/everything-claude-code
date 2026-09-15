/* 866 LIFTS, AND THE NUMBER WAS THE PROBLEM.

   Most of the catalogue is real. It carries a barbell, dumbbell, cable,
   machine and Smith version of nearly every movement, which is not
   padding: it is the reason you can log what your gym actually has.

   A small tail is not that. Sleds, Atlas stones, kegs, tyres, yokes,
   farmer's handles, battling ropes, a rope climb, a Bosu, a balance
   board, bear crawls, wind sprints. Strongman, conditioning and
   apparatus, offered between Incline DB Press and Incline Cable Fly to
   somebody picking their next set. Plus ten lifts filed twice under two
   spellings, which is the clearest sign a list has stopped being curated:
   "DB Shrug" and "Dumbbell Shrug" are one exercise.

   What is deliberately NOT cut: the Olympic lifts and their variants, and
   the gymnastic strength movements. A power clean and a muscle-up are
   strength training done with equipment an ordinary gym has. Cutting them
   would be cutting somebody's programme rather than cutting noise.

   And nothing is deleted. all() still answers with every row, because a
   workout logged last year, a split already built and an id the coach
   proposes all have to keep resolving. A catalogue that forgets a lift
   somebody has done turns their history into blanks. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' });
  r.end(await readFile(path.join(ROOT, '10-final/locked-app.html')));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
  isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  try { localStorage.setItem('lk_onboarded', 'true');
        localStorage.setItem('lk_tutorialSeen', 'true'); } catch (e) {}
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens['exercise-library'],
                           null, { timeout: 20000 });
await page.evaluate(() => { if (window.LKGo) window.LKGo('exercise-library'); });
await page.waitForTimeout(1000);

const cat = await page.evaluate(() => {
  const A = window.LKExercises;
  const hiddenNames = A.all().filter((r) => A.hidden(r)).map((r) => r.name);
  return { all: A.all().length, core: A.core().length, hidden: hiddenNames };
});

console.log('=== the tail is out of the way, and still in the catalogue ===\n');

ok(cat.all === 866, 'every row is still there for anything resolving an id',
   cat.all + ' rows');
ok(cat.core < cat.all && cat.core > 800,
   'the library browses a curated cut of it', cat.core + ' of ' + cat.all);

const cut = cat.hidden.join(' | ').toLowerCase();
['sled push', 'atlas stones', 'tire flip', 'yoke walk', "farmer's walk",
 'balance board', 'bear crawl', 'wind sprints'].forEach((nm) => {
  ok(cut.indexOf(nm) > -1, '  ' + nm + ' is out of the library');
});

console.log('\n=== and the lifts that only LOOK exotic are kept ===\n');

const kept = await page.evaluate(() => {
  const A = window.LKExercises;
  const core = A.core().map((r) => r.name.toLowerCase());
  return ['power clean', 'snatch', 'clean and jerk', 'muscle up',
          'handstand push-ups', 'ring dips']
    .filter((nm) => core.some((c) => c.indexOf(nm) > -1));
});
ok(kept.length === 6,
   'the Olympic lifts and gymnastic strength work stay, because they are strength work',
   kept.join(', '));

console.log('\n=== the same lift is not offered twice ===\n');

const twins = await page.evaluate(() => {
  const A = window.LKExercises;
  const key = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\bdb\b/g, 'dumbbell').replace(/\bbb\b/g, 'barbell')
    .split(/\s+/).filter(Boolean).sort().join(' ');
  const seen = {}, dup = [];
  A.core().forEach((r) => {
    const k = r.group + '|' + key(r.name);
    if (seen[k]) dup.push(seen[k] + ' == ' + r.name);
    else seen[k] = r.name;
  });
  return dup;
});
/* One pair survives on purpose: Low-to-High and High-to-Low Cable Fly are
   different lifts that this crude key cannot tell apart, and dropping one
   would lose a real movement to a test's own shortcut. */
ok(twins.length <= 1, 'no lift appears under two spellings',
   twins.length ? twins.join(' | ') : 'none');

console.log('\n=== a lift already in somebody\'s history still reads back ===\n');

const resolved = await page.evaluate(() => {
  const A = window.LKExercises;
  const row = A.all().find((x) => x.name === 'Sled Push');
  if (!row) return null;
  const again = A.all().find((x) => x.id === row.id);
  return again ? again.name : null;
});
ok(resolved === 'Sled Push',
   'a cut lift is still found by id, so an old workout is not blanks',
   String(resolved));

console.log('\n=== and the library does not offer it while browsing ===\n');

await page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  const el = r.querySelector('[data-testid="search-input"]');
  el.value = 'sled';
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
});
await page.waitForTimeout(700);
const rows = await page.evaluate(() => {
  const r = window.DEMO.screens['exercise-library'].root;
  return r.querySelectorAll('[data-testid^="row-ex-"]').length;
});
ok(rows === 0, 'searching for a cut lift turns up nothing', rows + ' rows');

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
