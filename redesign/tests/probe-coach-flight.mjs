/* PROBE: what happens to a question that is already in the air.
   Double send, send while in flight, navigating away, reloading,
   Stop then Continue, a photo, and a very long thread.
   Throwaway investigation script — not registered in gate.sh. */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let delayMs = 0, answer = JSON.stringify({ reply: 'Noted.', actions: [] });
const asked = [];
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type,authorization,apikey',
            'access-control-allow-methods': 'GET,POST,OPTIONS' };
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const raw = await body(req);
  const j = raw ? JSON.parse(raw) : {};
  asked.push(j);
  const n = asked.length;
  setTimeout(() => {
    res.writeHead(200, H);
    res.end(JSON.stringify({ content: [{ type: 'text', text: typeof answer === 'function' ? answer(n) : answer }] }));
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
    localStorage.setItem('lk_onboarded', 'true'); localStorage.setItem('lk_tutorialSeen', 'true');
    localStorage.setItem('lk_history', JSON.stringify(F.history));
    localStorage.setItem('lk_profile', JSON.stringify(F.profile));
    localStorage.removeItem('lk_coachLastMsgs');
  });
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKCloud);
  await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
  await page.evaluate(() => { location.hash = '#/coach'; });
  await page.waitForTimeout(500);
}
const state = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const msgs = [...r.querySelectorAll('.msg')].map((m) => {
    const who = m.querySelector('.msg__who')?.innerText || 'You';
    return who + ': ' + (m.querySelector('.msg__bubble')?.innerText || m.innerText).replace(/\n+/g, ' ').trim().slice(0, 90);
  });
  return { thinking: !!r.querySelector('[data-testid="msg-thinking"]'), msgs };
});
async function type(t) {
  await page.evaluate((t) => {
    const r = document.getElementById('demo-screen-coach').shadowRoot;
    const box = r.querySelector('[data-testid="composer-input"]');
    box.value = t; box.dispatchEvent(new Event('input', { bubbles: true }));
  }, t);
}
const send = () => page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const b = r.querySelector('[data-testid="composer-send"]');
  if (b.disabled) return 'send is DISABLED';
  b.click(); return 'sent';
});
const show = (n, s) => { console.log('\n--- ' + n); console.log('  thinking: ' + s.thinking); s.msgs.forEach((m) => console.log('   ' + m)); };

/* 9a. two sends in a row, as fast as a finger can go */
await boot();
delayMs = 700;
answer = (n) => JSON.stringify({ reply: 'answer #' + n, actions: [] });
await type('first question'); console.log('9a send1: ' + await send());
await page.waitForTimeout(60);
await type('second question'); console.log('9a send2: ' + await send());
await page.waitForTimeout(2500);
show('9a. two sends, 60ms apart', await state());
console.log('  requests the server got: ' + asked.length);

/* 9b. Enter key while one is in flight */
await boot(); asked.length = 0; delayMs = 1500;
await type('slow one'); await send();
await page.waitForTimeout(200);
await type('sneak in');
const enter = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const box = r.querySelector('[data-testid="composer-input"]');
  box.focus();
  box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
  return 'enter dispatched';
});
await page.waitForTimeout(2500);
show('9b. Enter pressed mid-flight (' + enter + ')', await state());
console.log('  requests the server got: ' + asked.length);

/* 9c. navigate away mid-flight and come back */
await boot(); asked.length = 0; delayMs = 2000;
await type('what about tuesday'); await send();
await page.waitForTimeout(300);
await page.evaluate(() => { location.hash = '#/home'; });
await page.waitForTimeout(2600);
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(700);
show('9c. away to Home mid-flight, back after the answer landed', await state());

/* 9d. reload mid-flight */
await boot(); asked.length = 0; delayMs = 4000;
await type('reload me'); await send();
await page.waitForTimeout(400);
show('9d. before reload', await state());
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKCloud);
await page.evaluate((b) => { window.LK_CLOUD = { supabaseUrl: b, supabaseKey: 'k', apiUrl: b }; }, BASE);
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(5000);
show('9d. after reload, 5s later', await state());

/* 9e. Stop, then Continue — with a server configured */
await boot(); asked.length = 0; delayMs = 3000;
await type('stop me'); await send();
await page.waitForTimeout(400);
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  r.querySelector('[data-testid="chat-stop"]').click();
});
await page.waitForTimeout(400);
show('9e. after Stop', await state());
const cont = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  const b = [...r.querySelectorAll('[data-act="continue"]')][0];
  if (!b) return 'no Continue button';
  b.click(); return 'clicked Continue';
});
console.log('  ' + cont);
await page.waitForTimeout(2500);
show('9e. after Continue', await state());
console.log('  requests the server got since Stop: ' + asked.length);

/* 10. a photo */
await boot(); asked.length = 0; delayMs = 200;
answer = JSON.stringify({ reply: 'That bar is loaded evenly.', actions: [] });
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
await page.evaluate((d) => {
  const s = window.DEMO.screens['coach'];
  /* the app's own photo path: set the pending photo the composer reads */
  const r = document.getElementById('demo-screen-coach').shadowRoot;
  window.__setPhoto && window.__setPhoto(d);
}, PNG);
/* fall back to driving the file input, which is what a person does */
await page.evaluate(() => { location.hash = '#/coach'; });
await page.waitForTimeout(300);
const buf = Buffer.from(PNG.split(',')[1], 'base64');
try {
  const input = await page.evaluateHandle(() => document.getElementById('demo-screen-coach').shadowRoot.querySelector('[data-testid="composer-photo-input"]'));
  await input.asElement().setInputFiles({ name: 'bar.png', mimeType: 'image/png', buffer: buf });
  await page.waitForTimeout(600);
} catch (e) { console.log('  photo input: ' + e.message); }
console.log('\n--- 10. photo attached');
console.log('  pending thumbnail on screen: ' + await page.evaluate(() => !!document.getElementById('demo-screen-coach').shadowRoot.querySelector('[data-testid="composer-pending"]')));
console.log('  send enabled with no text: ' + await page.evaluate(() => !document.getElementById('demo-screen-coach').shadowRoot.querySelector('[data-testid="composer-send"]').disabled));
await type('is this loaded right'); await send();
await page.waitForTimeout(1500);
show('10. after sending with a photo', await state());
console.log('  image on the wire: ' + JSON.stringify((asked[asked.length - 1]?.messages || []).map((m) => ({ role: m.role, img: m.image ? m.image.slice(0, 28) + '…' : null }))));

/* 11. a long conversation */
await boot(); asked.length = 0; delayMs = 60;
answer = (n) => JSON.stringify({ reply: 'reply number ' + n, actions: [] });
for (let i = 1; i <= 22; i++) {
  await type('question ' + i);
  const s = await send();
  if (s !== 'sent') { console.log('  stalled at ' + i + ': ' + s); break; }
  await page.waitForTimeout(260);
}
await page.waitForTimeout(1200);
const st = await state();
console.log('\n--- 11. after 22 questions');
console.log('  bubbles on screen: ' + st.msgs.length + '  thinking: ' + st.thinking);
const lastReq = asked[asked.length - 1] || {};
console.log('  messages sent on the last request: ' + (lastReq.messages || []).length);
console.log('  FIRST role on the wire: ' + JSON.stringify((lastReq.messages || [])[0]));
console.log('  roles: ' + (lastReq.messages || []).map((m) => m.role[0]).join(''));
console.log('  system prompt length: ' + (lastReq.system || '').length);
console.log('  "Earlier messages trimmed" shown: ' + await page.evaluate(() => !!document.getElementById('demo-screen-coach').shadowRoot.querySelector('[data-testid="chat-trimmed"]')));

console.log('\nERRORS: ' + JSON.stringify(errors, null, 1));
await browser.close(); server.close();
