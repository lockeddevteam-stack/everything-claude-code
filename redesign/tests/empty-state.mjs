/* THE FIRST RUN OF A REAL ACCOUNT.

   The fixture is a seed for a demo. A product's first user has no history,
   no meals, no records and no cycle log, and every screen has to hold up
   with nothing in it -- not as a dev-switcher state somebody picks, but as
   the state they actually land in.

   This loads every screen with fixtures.js blocked, which is exactly what a
   build that ships no seed looks like, and reports what breaks. A screen
   passes when it throws nothing, renders something, and says what is empty
   rather than printing a hole. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, '..', '08-build');
const PORT = 8131;

const files = fs.readdirSync(BUILD).filter((f) => f.endsWith('.html')).sort();

const srv = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: path.join(HERE, '..'), stdio: 'ignore'
});
await new Promise((r) => setTimeout(r, 900));

/* A hole: a figure with no source rendered as a placeholder or a broken
   value. These are what an empty screen prints when nobody wrote its
   empty state. */
const HOLES = /(undefined|NaN|\[object Object\]|Infinity|\/ null|null g|: null)/;

/* THE SEED'S OWN CONTENT, read out of seed-data.json rather than typed here,
   so this cannot drift from it. With no seed loaded, none of it may appear on
   any screen: anything that does is baked into a screen as a literal, and a
   new account would be shown a stranger's training as their own.

   This is the check that matters. A screen can be forgiven for having no
   empty-state copy; it cannot be forgiven for inventing a workout. */
const seed = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'seed-data.json'), 'utf8'));
const parse = (k) => { try { return JSON.parse(seed[k]); } catch (e) { return null; } };

const persona = new Set();
(parse('lk_history') || []).forEach((w) => {
  if (w.name) persona.add(String(w.name));
  (w.exercises || []).forEach((e) => { if (e.name) persona.add(String(e.name)); });
});
(parse('lk_splits') || []).forEach((sp) => { if (sp.name) persona.add(String(sp.name)); });
const prof = parse('lk_profile') || {};
[prof.name, prof.displayName, prof.username].forEach((v) => { if (v) persona.add(String(v)); });

/* Words that are also ordinary UI copy, or app content rather than this
   person's data, are not evidence of a baked-in persona. */
const NOT_PERSONAL = new Set(['You', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body']);
const PERSONA = [...persona].filter((v) => v.length > 3 && !NOT_PERSONAL.has(v));

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

console.log('=== empty state — every screen with no seed at all ===\n');

const br = await chromium.launch();
for (const file of files) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });

  /* The seed, gone. This is a build that ships no fixtures.js. */
  await p.route('**/fixtures.js', (route) => route.fulfill({
    status: 200, contentType: 'application/javascript', body: '/* no seed */'
  }));

  await p.goto(`http://localhost:${PORT}/08-build/${file}`);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(700);

  const seen = await p.evaluate(() => ({
    text: (document.body.innerText || '').trim(),
    fixtures: !!window.LKFixtures,
    controls: document.querySelectorAll('button, a[href], input, select, textarea').length
  }));

  /* The dev switcher's own labels are not the screen's copy. */
  const body = seen.text.replace(/STATE[\s\S]*$/i, '');

  ok(!errs.length, `${file} — nothing throws with no seed`,
     errs.length ? errs.slice(0, 2).join(' | ') : '');
  ok(!seen.fixtures, `${file} — really has no seed`, seen.fixtures ? 'LKFixtures still present' : '');
  ok(body.length > 40, `${file} — still renders`, body.length + ' chars');
  const hole = body.match(HOLES);
  ok(!hole, `${file} — prints no holes`, hole ? `found "${hole[0]}"` : '');

  /* The one that matters: with no seed, nothing of the seeded persona's
     training may be on screen. Anything here is a literal baked into the
     screen, which a real first user would be shown as their own. */
  const invented = PERSONA.filter((v) => body.includes(v));
  ok(!invented.length, `${file} — invents no training`,
     invented.length ? invented.slice(0, 4).join(', ') : '');

  await ctx.close();
}
await br.close();
srv.kill();

console.log('');
if (fails) {
  console.log(`${fails} checks failed — the build cannot ship without a seed yet`);
  process.exit(1);
}
console.log('every screen holds up with no seed at all');
