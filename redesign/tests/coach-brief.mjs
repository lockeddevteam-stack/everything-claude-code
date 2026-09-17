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
/* What the fake endpoint answers with. The context tests do not care;
   the rendering tests at the end set it deliberately. */
let answer = JSON.stringify({ reply: 'Noted.', actions: [] });
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
    return res.end(JSON.stringify({ content: [{ type: 'text', text: answer }] }));
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

/* ---- the brain --------------------------------------------------
   Not a spot check on wording. Every section the brain is built from has
   to be in the prompt, because a section that quietly stops being sent
   is a coach that quietly stops knowing that thing. */
const SECTIONS = [
  ['VOICE:', 'the voice'],
  ['STRUCTURE:', 'the structure'],
  ['FORMATTING:', 'the formatting rules'],
  ['DATA GROUNDING:', 'the grounding rule'],
  ['TONE:', 'the tone'],
  ['WORDS TO NEVER USE:', 'the banned words'],
  ['JARGON BY LEVEL:', 'when to define jargon'],
  ['CORE SCIENCE:', 'the core science'],
  ['TARGETS LOGIC:', 'how targets are set'],
  ['FORMULAS:', 'the formulas'],
  ['WEEKLY CHECK-IN MATH:', 'the check-in maths'],
  ['READINESS:', 'the readiness score'],
  ['LOAD AND PROGRESSION:', 'load and progression'],
  ['WEEKLY VOLUME BY STATUS:', 'volume by training status'],
  ['PLATEAUS:', 'the plateau trees'],
  ['CONFLICT RULES:', 'the conflict rules'],
  ['SAFETY FLOORS:', 'the safety floors'],
  ['ESCALATION SCRIPT:', 'the escalation script'],
  ['CRISIS RESOURCES', 'the crisis resources'],
  ['MYTHS', 'the myths'],
  ['HOSTILITY:', 'how to take abuse']
];
SECTIONS.forEach((s) => ok(full.includes(s[0]), s[1] + ' reached the model'));

/* The numbers the floors turn on, each one a decision the coach makes. */
ok(/30 kcal\/kg fat-free mass/.test(full), 'the energy-availability floor is a number, not a vibe');
ok(/1,200 kcal/.test(full) && /800 kcal/.test(full), 'the screen threshold and the refusal threshold are both there');
ok(/1\.6 to 2\.2 g\/kg/.test(full) && /2\.0 to 3\.0 g\/kg/.test(full), 'protein for gaining and for cutting');
ok(/10 to 20 hard sets/.test(full), 'weekly volume');
ok(/0 to 3 RIR for size/.test(full), 'how close to failure for size');
ok(/0\.5 to 1\.0% bodyweight\/week/.test(full), 'the loss rate');
ok(/7,700 kcal\/kg/.test(full), 'the energy density it does the maths with');
ok(/alpha 0\.1/.test(full), 'the weight trend is smoothed, not read off one morning');
ok(/under 13/.test(full), 'the under-13 rule');
ok(/PED/.test(full), 'and the refusal to dose anybody');

/* Crisis numbers are quoted, never composed. A wrong one is worse than none. */
ok(/988/.test(full) && /116 123/.test(full) && /1800 33 4673/.test(full) && /1-800-534-6463/.test(full),
   'the crisis lines are given verbatim, including the local one');

/* Voice rules that show up in every single reply.

   "Answer first" used to be the rule and it is still the shape, but the
   brief now says it as a coach rather than as a spec, because the replies
   were coming back correct and lifeless: question restated, answer, offer
   of further assistance. What is pinned here is the instruction that the
   answer leads and the instruction not to sound like a chatbot, since
   both are load-bearing and easy to lose in an edit. */
ok(/Lead with the answer/.test(full), 'the answer leads');
ok(/NEVER SOUND LIKE A CHATBOT/.test(full), 'and it is told plainly not to sound like one');
ok(/Great question/.test(full) && /let me know if you need anything else/i.test(full),
   'with the openings and sign-offs named, so they can be refused');
ok(/A coach remembers/.test(full), 'and told to use what it knows about them');
ok(/Never flatter/.test(full), 'never flatter');
ok(/I do not have that logged/.test(full), 'and a sentence to say instead of guessing');

/* The envelope has to survive every rewrite of the brain, or the app
   loses actions entirely. */
ok(full.indexOf('Return ONLY a JSON') < full.indexOf('VOICE:'),
   'the envelope comes before the brain, where the endpoint looks for it');

/* Age is a safety input, so it goes with the name. */
ok(/"age":\d+/.test(full), 'the coach knows how old they are');

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

/* ---- 6. what the reader actually sees ----------------------------
   A reply that came back as JSON the parser choked on was printed
   verbatim, braces and all, into the chat bubble. And the model writes
   markdown by habit, which the bubble prints as asterisks. */
await seed(allOn, 'direct');

async function reply(text) {
  answer = text;
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = 'what now';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    r.querySelector('[data-testid="composer-send"]').click();
  });
  await page.waitForTimeout(1200);
  return page.evaluate(() => document.getElementById('demo-screen-coach').shadowRoot.textContent || '');
}

/* A literal newline inside the reply string: valid to a model, fatal to
   JSON.parse, and the exact break that put a blob on the screen. */
let seen = await reply('{ "reply": "Hold at maintenance.' + String.fromCharCode(10) + 'Protein first.", "actions": [] }');
ok(/Hold at maintenance/.test(seen), 'a reply broken by a raw newline still reaches the reader');
ok(!/"actions"/.test(seen), 'and the envelope around it does not');

/* The markdown the brain forbids, which the bubble would print raw. */
seen = await reply(JSON.stringify({ reply: 'At **126.3 lb**, hold calories and lift.', actions: [] }));
ok(/126\.3 lb/.test(seen) && !/\*\*/.test(seen), 'asterisks are taken off the number, not shown');

/* Unrecoverable is a sentence, never braces. */
seen = await reply('{ "reply" "actions": [] }');
ok(!/\{\s*"reply"/.test(seen), 'a blob that cannot be read is never printed at somebody');
ok(/malformed|again/i.test(seen), 'they are told to ask again instead');

/* The note that said there was no model behind the coach. */
ok(!/there is no model/i.test(seen), 'the note claiming the replies are fake is gone');

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
server.close();
console.log(fails === 0 ? 'coach-brief: all checks passed' : 'coach-brief: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
