/* A NEW ACCOUNT'S FIRST SESSION HAS TO HAVE THE WORKOUT IN IT.

   Setup ends on an overview offering one button: "Start Upper A". It
   navigated and did nothing else. The log arrived having been told
   nothing, found no session to open, and fell through to an empty
   "Quick Workout" with no exercises -- while the split written seconds
   earlier held all five lifts. The very first thing a new account is
   asked to do was a blank screen.

   The cause is the router, not the button. A screen crossing is claimed
   in the CAPTURE phase and stopped, so the screen's own click handler
   never runs for it; the router announces `lk:handoff` instead so the
   screen can hand over first. Train already does this for its crossings
   and says why in a comment. Onboarding was never given the same
   treatment, and nothing noticed because every test that touched
   onboarding stopped at the overview.

   So this walks a genuinely cold install all the way through and asks
   what is on the screen at the end of it. No seeding, no fixtures, no
   shortcuts: exactly what a person downloading the app gets. */
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
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

/* NOTHING SEEDED. Not lk_onboarded, not lk_tutorialSeen, nothing. */
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForTimeout(2200);

const ob = () => 'document.querySelector(\'[data-screen="onboarding"]\').shadowRoot';
const waitFor = (id, ms = 9000) => page.waitForFunction((i) => {
  const s = document.querySelector('[data-screen="onboarding"]');
  if (!s || !s.shadowRoot) return false;
  const e = s.shadowRoot.querySelector('[data-testid="' + i + '"]');
  return !!(e && e.getBoundingClientRect().width > 0);
}, id, { timeout: ms });
const click = async (id) => { await waitFor(id); return page.evaluate((i) => {
  document.querySelector('[data-screen="onboarding"]').shadowRoot
    .querySelector('[data-testid="' + i + '"]').click(); }, id); };
const type = async (id, v) => { await waitFor(id); return page.evaluate(([i, val]) => {
  const e = document.querySelector('[data-screen="onboarding"]').shadowRoot
    .querySelector('[data-testid="' + i + '"]');
  e.value = val; e.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}, [id, v]); };

ok(await page.evaluate(() => location.hash).then((h) => h.includes('onboarding')),
   'a phone with nothing on it lands on onboarding',
   await page.evaluate(() => location.hash));

/* The guest route, answering every question the way a person would. */
await click('welcome-guest'); await page.waitForTimeout(400);
await click('guest-warning-continue'); await page.waitForTimeout(400);
await type('setup-name', 'Cesco'); await click('setup-continue'); await page.waitForTimeout(300);
await type('setup-username', 'cesco'); await click('setup-continue'); await page.waitForTimeout(400);
await click('setup-units-kg'); await click('setup-continue'); await page.waitForTimeout(300);
await click('setup-experience-over3'); await click('setup-continue'); await page.waitForTimeout(300);
await click('setup-days-5'); await click('setup-continue'); await page.waitForTimeout(300);
await click('setup-continue'); await page.waitForTimeout(300);              /* extras: none */
await click('setup-goal-size'); await page.waitForTimeout(150);
await click('setup-continue'); await page.waitForTimeout(2500);             /* Finish setup */

const saved = await page.evaluate(() => ({
  onboarded: !!localStorage.getItem('lk_onboarded'),
  profile: JSON.parse(localStorage.getItem('lk_profile') || '{}'),
  splits: JSON.parse(localStorage.getItem('lk_splits') || '[]')
}));
ok(saved.onboarded, 'setup is recorded as done');
ok(saved.profile.name === 'Cesco' && saved.profile.daysPerWeek === 5 &&
   saved.profile.trainingGoal === 'size' && saved.profile.useKg === true,
   'every answer reaches the profile', JSON.stringify(saved.profile));
const day0 = (saved.splits[0] && saved.splits[0].days && saved.splits[0].days[0]) || null;
ok(!!day0 && day0.exercises.length > 0,
   'and a split is built with lifts in its first day',
   day0 ? day0.name + ': ' + day0.exercises.length : 'no split');

/* THE BUTTON. It names a session, so it has to open that session. */
await waitFor('overview-start');
const label = await page.evaluate(() =>
  document.querySelector('[data-screen="onboarding"]').shadowRoot
    .querySelector('[data-testid="overview-start"]').textContent.trim());
ok(/Start\s+\S/.test(label), 'the overview offers a named first session', label);

await click('overview-start');
await page.waitForTimeout(2200);

const landed = await page.evaluate(() => {
  const vis = [...document.querySelectorAll('[data-screen]')]
    .filter((s) => { const c = getComputedStyle(s); return c.display !== 'none' && c.visibility !== 'hidden'; });
  const live = vis[vis.length - 1];
  const r = live && live.shadowRoot ? live.shadowRoot : document;
  return {
    hash: location.hash,
    screen: live && live.getAttribute('data-screen'),
    title: (r.querySelector('h1') || {}).textContent || '',
    cards: [...r.querySelectorAll('[data-testid^="exercise-card-"]')].length,
    names: [...r.querySelectorAll('.exc__name')].map((e) => e.textContent.trim()),
    tabs: [...r.querySelectorAll('.tabbar a, .tabbar button, [data-testid^="tab-"]')].length
  };
});

ok(landed.screen === 'workout-log', 'it opens the workout log', landed.screen);
ok(landed.cards === day0.exercises.length,
   'with the whole session in it, not an empty one',
   landed.cards + ' cards for ' + day0.exercises.length + ' planned lifts');
ok(landed.names[0] === day0.exercises[0].name,
   'and they are the planned lifts, in order',
   landed.names.slice(0, 3).join(', ') || '(none)');
ok(landed.title.indexOf(day0.name) >= 0,
   'the session carries the day\'s name rather than "Quick Workout"',
   JSON.stringify(landed.title));
ok(landed.tabs >= 5, 'the app is fully around it', landed.tabs + ' tabs');

ok(errs.length === 0, 'no page errors anywhere in a cold first run', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
