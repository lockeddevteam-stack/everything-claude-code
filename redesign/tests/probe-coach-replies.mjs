/* PROBE: what the coach screen SHOWS for the replies a real model sends.
   Throwaway investigation script — not registered in gate.sh.
   Each case: set `mode`, send a message, print the last bubble's text. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

const asked = [];
let mode = { kind: 'text', text: '' };
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type,authorization,apikey',
            'access-control-allow-methods': 'GET,POST,OPTIONS' };

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const raw = await body(req);
  asked.push(raw ? JSON.parse(raw) : {});
  const m = mode;
  if (m.kind === 'text') { res.writeHead(200, H); return res.end(JSON.stringify({ content: [{ type: 'text', text: m.text }] })); }
  if (m.kind === 'gated') { res.writeHead(200, H); return res.end(JSON.stringify({ gated: true, limit: 10, content: [{ type: 'text', text: m.text }] })); }
  if (m.kind === 'nobody') { res.writeHead(200, H); return res.end(''); }
  if (m.kind === 'status') { res.writeHead(m.code, H); return res.end(JSON.stringify(m.json || {})); }
  if (m.kind === 'drop') { req.socket.destroy(); return; }
  if (m.kind === 'hang') { return; } // never answers
  res.writeHead(200, H); res.end('{}');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);

/* A realistic seeded account, from the app's own fixtures, plus every
   data switch on, which is how a person who set the coach up would have it. */
await page.evaluate(() => {
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
  put('lk_splits', F.splits || []);
  put('lk_coachDataPrefs', { training: true, weight: true, checkins: true, goals: true,
    plan: true, nutrition: true, supplements: true, bodyfat: true, cycle: true });
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
console.log('coachReady:', await page.evaluate(() => window.LKCloud.coachReady()));

const R = () => page.evaluate(() => document.getElementById('demo-screen-coach').shadowRoot);
async function shown() {
  return page.evaluate(() => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const msgs = [...r.querySelectorAll('.msg')];
    const last = msgs[msgs.length - 1];
    const thinking = !!r.querySelector('[data-testid="msg-thinking"]');
    const cards = [...r.querySelectorAll('[data-testid^="act-"]')].map((e) => e.dataset.testid);
    return {
      thinking,
      lastBubble: last ? (last.querySelector('.msg__bubble')?.innerText || last.innerText).trim() : '(no messages)',
      count: msgs.length,
      cards,
      html: last ? last.innerHTML.slice(0, 400) : ''
    };
  });
}
async function say(text, m, wait = 1500) {
  mode = m;
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(350);
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = t;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    r.querySelector('[data-testid="composer-send"]').click();
  }, text);
  await page.waitForTimeout(wait);
}
async function fresh() {
  await page.evaluate(() => {
    localStorage.removeItem('lk_coachLastMsgs');
    location.hash = '#/home';
  });
  await page.waitForTimeout(200);
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
}

const report = (name, s) => {
  console.log('\n--- ' + name);
  console.log('  thinking: ' + s.thinking + '  msgs: ' + s.count + '  cards: ' + JSON.stringify(s.cards));
  console.log('  SCREEN SAYS: ' + JSON.stringify(s.lastBubble));
};

/* 1. plain prose answer */
await fresh();
await say('how do I fix my bench', { kind: 'text', text: 'Your bench stalls because you are pressing off a soft upper back. Set the lats before the unrack.' });
report('1. plain prose', await shown());

/* 2. clean JSON envelope, plain reply, no actions */
await fresh();
await say('how did I do', { kind: 'text', text: JSON.stringify({ reply: 'Solid week. Bench moved 2.5kg.', actions: [] }) });
report('2. clean envelope, no actions', await shown());

/* 3. JSON in a markdown fence */
await fresh();
await say('how did I do', { kind: 'text', text: '```json\n' + JSON.stringify({ reply: 'Fenced answer.', actions: [] }, null, 2) + '\n```' });
report('3. fenced json', await shown());

/* 3b. fence with a leading sentence, which is what models actually do */
await fresh();
await say('how did I do', { kind: 'text', text: 'Sure, here is the plan.\n\n```json\n{"reply":"Fenced with preamble.","actions":[]}\n```' });
report('3b. prose then fenced json', await shown());

/* 4. prose with a JSON object buried mid-reply */
await fresh();
await say('how did I do', { kind: 'text', text: 'Good week overall. {"reply":"Buried.","actions":[]} Keep it up next week.' });
report('4. json buried in prose', await shown());

/* 5. sentinel markers */
await fresh();
await say('remember this', { kind: 'text', text: 'Noted that.\n###REMEMBER###\nYou train five days a week.\n###/REMEMBER###\nAnything else?' });
report('5. sentinel REMEMBER', await shown());

/* 6a. empty reply */
await fresh();
await say('hello', { kind: 'text', text: '' });
report('6a. empty text', await shown());

/* 6b. whitespace only */
await fresh();
await say('hello', { kind: 'text', text: '   \n\t  ' });
report('6b. whitespace only', await shown());

/* 6c. 200 with no body at all */
await fresh();
await say('hello', { kind: 'nobody' });
report('6c. 200 no body', await shown());

/* 7a. 500 */
await fresh();
await say('hello', { kind: 'status', code: 500, json: { error: 'model timeout' } });
report('7a. 500', await shown());

/* 7b. 502 with an html-ish empty body */
await fresh();
await say('hello', { kind: 'status', code: 502, json: {} });
report('7b. 502 empty json', await shown());

/* 7c. network drop mid-flight */
await fresh();
await say('hello', { kind: 'drop' });
report('7c. socket destroyed', await shown());

/* 8. gated */
await fresh();
await say('hello', { kind: 'gated', text: 'You have used today’s ten free messages.' });
report('8. gated', await shown());

/* 7d. THE HANG. no answer ever. */
await fresh();
await say('hello', { kind: 'hang' }, 3000);
report('7d. hang @3s', await shown());
await page.waitForTimeout(30000);
report('7d. hang @33s', await shown());
/* is the composer usable while stuck? */
console.log('  composer send disabled @33s: ' + await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const b = r.querySelector('[data-testid="composer-input"]');
  b.value = 'are you there'; b.dispatchEvent(new Event('input', { bubbles: true }));
  return r.querySelector('[data-testid="composer-send"]').disabled;
}));

console.log('\n\nERRORS: ' + JSON.stringify(errors, null, 1));
await browser.close();
server.close();
