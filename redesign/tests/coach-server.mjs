/* THE COACH, ASKED, AND WHAT COMES BACK.

   The write-back UI -- cards, previews, approve, undo -- was built and
   driven against a hand-written reply, because nothing proposed an action
   in the first place. Now something does, and the question that matters
   is not whether a good reply renders: it is whether a bad one can reach
   somebody's training data.

   So this stands a server on localhost that answers the way the deployed
   Worker answers, and puts four replies through it: a plain answer, an
   action naming a lift that does not exist, a sound action, and a reply
   in the older sentinel-marker protocol the Worker also emits. Nothing is
   applied on arrival in any of them. */
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

let answer = '';
const asked = [];
const body = (req) => new Promise((res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => res(b)); });

const server = http.createServer(async (req, res) => {
  const H = {
    'content-type': 'application/json',
    /* The page is opened from file://, whose origin is the string "null". */
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type,authorization,apikey',
    'access-control-allow-methods': 'GET,POST,OPTIONS'
  };
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

/* A port that is genuinely closed, taken and released so nothing else
   claims it. Low ports will not do: the browser refuses 1 and 9 outright
   with ERR_UNSAFE_PORT, which is a different failure from the one under
   test. */
const probe = http.createServer();
await new Promise((r) => probe.listen(0, '127.0.0.1', r));
const DEAD = 'http://127.0.0.1:' + probe.address().port;
await new Promise((r) => probe.close(r));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.evaluate(() => {
  localStorage.setItem('lk_onboarded', 'true');
  localStorage.setItem('lk_tutorialSeen', 'true');
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
ok(await page.evaluate(() => window.LKCloud.coachReady()), 'the coach has a server to ask');

const root = () => page.evaluate(() => document.getElementById('demo-screen-coach').shadowRoot.innerHTML);

async function say(text, reply) {
  answer = reply;
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
}

/* 1. a plain answer */
await say('how did I do', JSON.stringify({ reply: 'Two more sets on the last one.', actions: [] }));
ok(asked.length === 1, 'the question reached the server', String(asked.length));
ok(/Return ONLY a JSON/.test(asked[0].system || ''),
   'and it carried the prompt the endpoint switches structured mode on');
ok((await root()).includes('Two more sets on the last one.'), 'the answer is on the screen');

/* THE CONTEXT IS WHAT THE RECEIPT PROMISED. */
const sys = asked[0].system || '';
ok(/exercise catalogue/i.test(sys), 'the catalogue went with the question, so ids can be real');

/* 2. an invented lift is refused, on the screen, with a reason */
await say('make me a split', JSON.stringify({ reply: 'Your new split.', actions: [
  { kind: 'split', split: { name: 'PPL', days: [{ name: 'Push',
    exercises: [{ id: 99999, name: 'Bench Press', sets: 3, reps: 8 }] }] } }
]}));
let html = await root();
ok(/catalogue/i.test(html), 'an invented lift is refused where the reader can see it');
const appliedAnything = await page.evaluate(() => {
  const s = localStorage.getItem('lk_splits');
  return !!(s && s.indexOf('PPL') !== -1);
});
ok(!appliedAnything, 'and nothing was written on arrival');

/* 3. a sound action renders as something to approve, still unapplied */
await say('remember this', JSON.stringify({ reply: 'Noted.', actions: [
  { kind: 'fact', text: 'You train five days a week.' }
]}));
html = await root();
ok(/Noted\./.test(html), 'the reply is shown');
const memoryBefore = await page.evaluate(() => localStorage.getItem('lk_coachMemory'));
ok(!(memoryBefore || '').includes('five days'),
   'a sound action still waits to be approved rather than applying itself');

/* 4. the older protocol the Worker also speaks */
await say('a fact', 'Noted for later.\n###FACT_START###\nYou squat on Mondays.\n###FACT_END###');
html = await root();
ok(/Noted for later\.|squat on Mondays/i.test(html),
   'a reply in the sentinel protocol is read too, not dropped');

/* 5. the server refusing is said, and offers the way back */
answer = '';
await page.evaluate((d) => { window.LK_CLOUD = { supabaseUrl: d, supabaseKey: 'k', apiUrl: d }; }, DEAD);
await say('anything', '');
html = await root();
ok(/could not reach|could not be reached|unreachable/i.test(html),
   'an unreachable coach says so, in words about reaching it');
ok(/msg-retry/.test(html), 'and offers Try again');

/* The deliberate failure above is a refused connection, which the browser
   logs. It is the thing being tested, not a defect. */
const real = errors.filter(function (e) { return !/Failed to load resource|ERR_CONNECTION/.test(e); });
ok(real.length === 0, 'no page errors throughout', real.slice(0, 2).join(' | '));

await browser.close();
server.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall good');
process.exit(fails ? 1 : 0);
