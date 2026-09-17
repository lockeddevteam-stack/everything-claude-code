/* WHAT THE COACH IS ACTUALLY TOLD.

   The coach had a server, a model, a persona picker and nine data
   switches, and sent none of it. `permOn('profile')` asked about a tenth
   switch that has never existed, so even the name never left the phone,
   and `ctx.style` was built and never read by the prompt. Every answer
   was therefore written about nobody, which is exactly what a generic
   answer is.

   Two claims are under test here, and they pull against each other:
   a source that is ON has to reach the model, and a source that is OFF
   has to be absent -- not summarised, not emptied, absent. The receipt
   above the thread is a promise, and this is what keeps it.

   It drives the built demo against a server that records the request. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const asked = [];
const body = (req) => new Promise((res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => res(b)); });
const server = http.createServer(async (req, res) => {
  const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
              'access-control-allow-headers': 'content-type,authorization,apikey',
              'access-control-allow-methods': 'GET,POST,OPTIONS' };
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const raw = await body(req);
  if (new URL(req.url, 'http://x').pathname === '/') {
    asked.push(raw ? JSON.parse(raw) : {});
    res.writeHead(200, H);
    return res.end(JSON.stringify({ content: [{ type: 'text',
      text: JSON.stringify({ reply: 'Noted.', actions: [] }) }] }));
  }
  res.writeHead(404, H); res.end('{}');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);

/* A real reader's storage, written from the one seed every screen reads,
   rather than invented here: a test that seeds its own numbers proves the
   test can read them, not that the app can. */
async function seed(perms, style) {
  await page.evaluate(({ perms, style }) => {
    const F = window.LKFixtures;
    localStorage.clear();
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
    const put = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    put('lk_history', F.history);
    put('lk_prs', F.prs);
    put('lk_profile', F.profile);
    put('lk_goals', F.goals);
    put('lk_supplements', F.supplements);
    put('lk_suppLog', F.suppLog);
    put('lk_feedback', F.feedback);
    put('lk_weightLog', F.weightLog);
    put('lk_bfLog', F.bfLog);
    put('lk_fuelTargets', F.nutrition.targets);
    put('lk_fuelLog', F.nutrition.days);
    put('lk_fuelProfile', { diets: ['highprotein'], allergy: 'peanuts' });
    put('lk_cycles', F.cycles);
    put('lk_coachPlan', F.coachPlan);
    localStorage.setItem('lk_cycle', 'true');
    put('lk_coachDataPrefs', perms);
    if (style) localStorage.setItem('lk_coachStyle', JSON.stringify(style));
  }, { perms, style });
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
}

async function ask(text) {
  const before = asked.length;
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(400);
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = t;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    r.querySelector('[data-testid="composer-send"]').click();
  }, text);
  await page.waitForTimeout(1200);
  if (asked.length === before) return '';
  return asked[asked.length - 1].system || '';
}

const KEYS = ['training', 'weight', 'checkins', 'goals', 'plan',
              'nutrition', 'supplements', 'bodyfat', 'cycle'];
const allOn = {};
KEYS.forEach((k) => { allOn[k] = true; });

/* ---- 1. everything on -------------------------------------------- */
await seed(allOn, 'direct');
const full = await ask('what should I do today');
ok(full.length > 0, 'the question reached the server');
ok(/Return ONLY a JSON/.test(full), 'the structured-mode phrase survived the rewrite');
ok(/exercise catalogue/i.test(full), 'the catalogue still goes with the question');

/* The person, which is the part that never left the phone at all. */
ok(/Who they are/.test(full) && /Cesco/.test(full), 'the coach is told whose numbers these are');
ok(/"unit":"kg"/.test(full), 'and which unit the app shows, so it answers in that unit');

/* Each source, by a number only that source holds. */
ok(/Their training log/.test(full), 'the training log went');
ok(/Barbell Squat/.test(full), 'with the lifts in it, by name');
ok(/"bestSets"/.test(full), 'and the best logged set per lift');
ok(/"rir"/.test(full), 'including RIR, which is what decides the next load');
ok(/Their body weight log/.test(full) && /"trend"/.test(full), 'the weight log went, with its trend');
ok(/Their check-ins/.test(full) && /"soreness"/.test(full), 'the check-ins went');
ok(/Their goals/.test(full) && /Bench 75/.test(full), 'the goals went');
ok(/The plan they are running/.test(full) && /"week"/.test(full), 'the plan went, with the week they are in');
ok(/Their nutrition/.test(full) && /"targets":\{"kcal":\d+/.test(full), 'the targets went');
ok(/"average"/.test(full), 'and the average of the days logged, not one day');
ok(/peanuts/.test(full), 'an allergy travels with anything that might suggest food');
ok(/What they take/.test(full) && /"takenToday"/.test(full), 'the supplements went');
ok(/body fat/i.test(full), 'the body fat readings went');
ok(/Their cycle tracking/.test(full), 'cycle tracking went');

/* The brief itself. */
ok(/RIR 0 to 3/.test(full), 'it is told how hard a hypertrophy set is taken');
ok(/1\.6 to 2\.2 g per kg/.test(full), 'and where protein sits');
ok(/Open with the answer/.test(full), 'and to answer before anything else');
ok(/it depends/.test(full), 'and that hedging is not an answer');

/* ---- 2. the persona reaches the model ---------------------------- */
const tone = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  return r ? true : false;
});
ok(tone, 'the coach screen is mounted');
await seed(allOn, 'hype');
const drill = await ask('what should I do today');
const direct = full;
ok(drill !== direct, 'picking a different persona changes what is sent');
ok(/The voice they picked/.test(drill), 'the persona reaches the prompt as an instruction');

/* ---- 3. a switch that is off sends nothing ------------------------ */
const allOff = {};
KEYS.forEach((k) => { allOff[k] = false; });
await seed(allOff, 'direct');
const none = await ask('what should I do today');
ok(/Who they are/.test(none), 'the name is not one of the nine switches, so it still goes');
ok(!/Their training log/.test(none) && !/Barbell Squat/.test(none), 'no training log');
ok(!/"bestSets"/.test(none), 'no records');
ok(!/Their body weight log/.test(none), 'no weight');
ok(!/Their check-ins/.test(none), 'no check-ins');
ok(!/Their goals/.test(none), 'no goals');
ok(!/The plan they are running/.test(none), 'no plan');
ok(!/Their nutrition/.test(none) && !/"recentDays"/.test(none), 'no nutrition');
ok(!/What they take/.test(none) && !/"takenToday"/.test(none), 'no supplements');
ok(!/body fat readings/.test(none), 'no body fat');
ok(!/Their cycle tracking/.test(none), 'no cycle');
ok(/exercise catalogue/i.test(none), 'the catalogue is not personal data and still goes');

/* ---- 4. one switch on sends that one and no other ----------------- */
const only = {};
KEYS.forEach((k) => { only[k] = false; });
only.nutrition = true;
await seed(only, 'direct');
const one = await ask('what should I eat');
ok(/Their nutrition/.test(one) && /"targets":\{"kcal":\d+/.test(one), 'nutrition alone went');
ok(!/Their training log/.test(one), 'and training stayed behind its own switch');
ok(!/Their check-ins/.test(one), 'and so did the check-ins');

/* ---- 5. cycle tracking has two gates ------------------------------ */
await page.evaluate(() => localStorage.setItem('lk_cycle', 'false'));
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
await seed(allOn, 'direct');
await page.evaluate(() => localStorage.setItem('lk_cycle', 'false'));
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
const noCycle = await ask('how is my cycle going');
ok(!/Their cycle tracking/.test(noCycle),
   'a reader who does not run cycle tracking sends none of it, switch on or not');

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
server.close();
console.log(fails === 0 ? 'coach-brief: all checks passed' : 'coach-brief: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
