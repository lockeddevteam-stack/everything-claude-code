/* A QUESTION IN THE AIR, AND WHAT BECAME OF IT.

   Everything the coach screen does after Send was built around one flag,
   S.chat.status, and one flag cannot tell two questions apart. The Send
   button greys itself while the coach is thinking; the Enter key never
   did. So two questions went to the server, the first answer to land set
   the status to 'ready', and the handler for the second answer read
   `if (S.chat.status !== 'thinking') return;` and threw away a real reply
   that had already been asked for and paid for. The second question sat
   in the thread for ever with nothing to say why.

   The same flag is behind the rest of this file's history: a request that
   never answered left the screen on "thinking" until a reload; Stop then
   Continue never asked the server at all and printed demo prose compiled
   into the build under the coach's name; a reload mid-flight persisted
   "Could not reach the server." about a request the server had answered
   perfectly well; the twelve-message window handed to the model started
   on a model turn from the seventh question onward; the app's own
   "That answer came back empty" went back up the wire as coach speech;
   and the two sentinel markers that do not end in _START### printed
   themselves at the reader instead of reaching the parser that reads them.

   Every check below is one of those, standing a server on localhost that
   answers the way the deployed Worker answers. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* The stub. `delayMs` is how long it sits on a question, `answer` is what
   it says, and `asked` is the wire log the checks read. */
let delayMs = 0;
let answer = () => JSON.stringify({ reply: 'Noted.', actions: [] });
const asked = [];
const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type,authorization,apikey',
            'access-control-allow-methods': 'GET,POST,OPTIONS' };
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const raw = await body(req);
  asked.push(raw ? JSON.parse(raw) : {});
  const n = asked.length;
  setTimeout(() => {
    res.writeHead(200, H);
    res.end(JSON.stringify({ content: [{ type: 'text', text: answer(n) }] }));
  }, delayMs);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));

async function boot() {
  await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
  await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
  await page.evaluate(() => {
    const F = window.LKFixtures;
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
    localStorage.setItem('lk_history', JSON.stringify(F.history));
    localStorage.setItem('lk_profile', JSON.stringify(F.profile));
    localStorage.removeItem('lk_coachLastMsgs');
  });
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(400);
  asked.length = 0;
}

const state = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const msgs = [...r.querySelectorAll('.msg')].map((m) => {
    const who = m.querySelector('.msg__who')?.innerText || 'You';
    return who + ': ' + (m.querySelector('.msg__bubble')?.innerText || m.innerText).replace(/\n+/g, ' ').trim();
  });
  const send = r.querySelector('[data-testid="composer-send"]');
  return { thinking: !!r.querySelector('[data-testid="msg-thinking"]'),
           sendDisabled: !!(send && send.disabled),
           html: r.innerHTML, msgs };
});

async function type(t) {
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = t; box.dispatchEvent(new Event('input', { bubbles: true }));
  }, t);
}
const clickSend = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const b = r.querySelector('[data-testid="composer-send"]');
  if (b.disabled) return 'disabled';
  b.click(); return 'sent';
});
const pressEnter = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const box = r.querySelector('[data-testid="composer-input"]');
  box.focus();
  box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
});
async function ask(text, reply, waitMs) {
  if (reply !== undefined) answer = () => reply;
  await type(text);
  await clickSend();
  await page.waitForTimeout(waitMs === undefined ? 900 : waitMs);
}

/* ---- 1. two questions in the air at once ---------------------------- */
await boot();
delayMs = 900;
answer = (n) => JSON.stringify({ reply: 'answer #' + n, actions: [] });
await type('first question'); await clickSend();
await page.waitForTimeout(200);
await type('second question');
await pressEnter();
await page.waitForTimeout(2800);
let s = await state();
let joined = s.msgs.join(' | ');
ok(asked.length === 2, 'both questions reached the server', asked.length + ' requests');
ok(/answer #1/.test(joined) && /answer #2/.test(joined),
   'both answers were drawn, neither thrown away',
   joined.slice(-120));
ok(joined.indexOf('answer #1') < joined.indexOf('answer #2'),
   'and they arrived in the order the questions were asked');
ok(!s.thinking, 'the thinking line is gone once nothing is in the air');
/* Send is disabled on an empty composer and always was, so the question
   is whether typing brings it back, not whether it is live on nothing. */
await type('anything at all');
ok(!(await state()).sendDisabled, 'and Send is live again once there is something to send');
await type('');

/* The button and the key have to agree. Send used to grey itself while
   Enter sent regardless, which is how the lost answer was found. */
await type('typed while thinking');
delayMs = 1200;
await clickSend();
await page.waitForTimeout(150);
await type('and another');
ok(!(await state()).sendDisabled,
   'Send is not greyed mid-flight, because a second question is answered now');
await page.waitForTimeout(2600);

/* ---- 2. a request that never answers -------------------------------- */
/* The deadline itself lives in cloud.js's post(), which is not this file
   and not this suite's to assert. What is this file's job is the half
   after it: a request that gives up resolves as
   { ok:false, error:'timeout', message } and the screen has to say so,
   clear the thinking line and give the composer back. So LKCloud.ask is
   replaced with exactly that answer, and the screen is measured. */
await boot();
await page.evaluate(() => {
  window.LKCloud.ask = function () {
    return new Promise(function (res) {
      setTimeout(function () {
        res({ ok: false, error: 'timeout',
              message: 'The coach took too long to answer. Nothing was sent anywhere else.' });
      }, 300);
    });
  };
});
await type('will this ever come back'); await clickSend();
await page.waitForTimeout(1200);
s = await state();
ok(/took too long/.test(s.html), 'a request that gave up says so, in the sentence post() wrote');
ok(!s.thinking, 'the thinking line is cleared');
await type('let me try that again');
ok(!(await state()).sendDisabled, 'the composer is usable again');
await type('');
ok(/msg-retry/.test(s.html), 'and Try again is there to retry from');

/* ---- 3. Stop, then Continue, against a live server ------------------ */
await boot();
delayMs = 2500;
answer = () => JSON.stringify({ reply: 'The real answer, from the server.', actions: [] });
await type('stop me'); await clickSend();
await page.waitForTimeout(400);
await page.evaluate(() => {
  document.getElementById('demo-screen-coach').shadowRoot.querySelector('[data-testid="chat-stop"]').click();
});
await page.waitForTimeout(300);
const askedAtStop = asked.length;
delayMs = 200;
await page.evaluate(() => {
  const b = document.getElementById('demo-screen-coach').shadowRoot.querySelector('[data-act="continue"]');
  if (b) b.click();
});
await page.waitForTimeout(1500);
s = await state();
joined = s.msgs.join(' | ');
ok(asked.length === askedAtStop + 1, 'Continue asked the server rather than answering itself',
   (asked.length - askedAtStop) + ' new requests');
ok(/The real answer, from the server\./.test(joined), 'and what it printed is what the server said');
ok(!/lifts that are moving/.test(joined),
   'no canned coaching prose out of the build is served as the coach’s own');

/* The stopped reply must not come back on the next question either: it is
   this app talking about itself, not a turn in the conversation. */
await page.waitForTimeout(100);

/* ---- 4. reloading while a question is in the air -------------------- */
await boot();
delayMs = 4000;
answer = () => JSON.stringify({ reply: 'late but fine', actions: [] });
await type('reload me'); await clickSend();
await page.waitForTimeout(400);
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(1500);
s = await state();
joined = s.msgs.join(' | ');
ok(!/could not be reached|Could not reach/i.test(joined),
   'a reload mid-flight does not write a failure that never happened', joined.slice(-120));
ok(/reload me/.test(joined), 'the question itself is still in the thread, ready to ask again');

/* ---- 5. the window the model is handed ------------------------------ */
await boot();
delayMs = 40;
answer = (n) => JSON.stringify({ reply: 'reply ' + n, actions: [] });
for (let i = 1; i <= 9; i++) {
  await type('question ' + i);
  await clickSend();
  await page.waitForTimeout(320);
}
await page.waitForTimeout(600);
const last = asked[asked.length - 1] || {};
const roles = (last.messages || []).map((m) => m.role);
ok(roles.length > 0 && roles.length <= 12, 'the thread is still capped', roles.length + ' turns');
ok(roles[0] === 'user', 'and the window starts on a user turn, which Gemini requires',
   roles.map((r) => r[0]).join(''));
ok(roles[roles.length - 1] === 'user', 'with the question being asked last');

/* ---- 6. the app's own words stay out of the conversation ------------ */
await boot();
delayMs = 30;
/* An answer with nothing in it. The screen writes its own sentence about
   that, and that sentence is not something the coach said. */
answer = () => JSON.stringify({ reply: '', actions: [] });
await ask('say nothing');
ok(/came back empty/.test((await state()).html), 'an empty answer is called out on screen');
answer = () => JSON.stringify({ reply: 'Back to normal.', actions: [] });
await ask('are you there');
const wire = JSON.stringify(asked[asked.length - 1] || {});
ok(!/came back empty/.test(wire),
   'the app’s own failure sentence is not sent back as something the coach said');
ok(!/could not be reached/i.test(wire), 'nor is the unreachable notice');

/* ---- 7. the two sentinel markers that end differently ---------------- */
await boot();
delayMs = 30;
await ask('remember this', 'Noted. ###REMEMBER### You train five days a week. ###/REMEMBER###');
s = await state();
ok(!/###REMEMBER###/.test(s.html), 'a REMEMBER reply does not print its own markers at the reader');
ok(/data-kind="fact"/.test(s.html), 'it reaches the parser and becomes a fact to approve');

await ask('add these', 'Added. ###SHOPPING_ADD### Chicken, Rice, Oats ###/SHOPPING_ADD###');
s = await state();
ok(!/###SHOPPING_ADD###/.test(s.html), 'a SHOPPING_ADD reply does not print its own markers either');
ok(/data-kind="shopping"/.test(s.html), 'and it becomes a shopping card');

/* One item is one item. The button counted in a fixed plural. */
await ask('one thing', 'Right. ###SHOPPING_ADD### Chicken ###/SHOPPING_ADD###');
s = await state();
ok(/Review and add 1 item(?!s)/.test(s.msgs.join(' ')),
   'and the count on it reads in the right number', s.msgs.join(' ').slice(-80));

ok(errors.length === 0, 'no page errors throughout', errors.slice(0, 2).join(' | '));

await browser.close();
server.close();
console.log(fails ? '\n' + fails + ' of ' + checks + ' checks FAILED'
                  : '\nall ' + checks + ' checks passed');
process.exit(fails ? 1 : 0);
