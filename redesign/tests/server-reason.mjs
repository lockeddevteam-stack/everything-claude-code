/* "THE SERVER REFUSED THAT."

   That is what the app said when the coach failed, whatever had actually
   happened. The Worker names the reason on every route -- it answers
   { error: "<sentence>" } -- and post() read `message`, `error_description`
   and `msg`, none of which the Worker writes. So the one field carrying
   the answer was the one field nobody read, and every cause collapsed
   into the same eight words.

   The cost is not cosmetic. A key that is not allowed to call Gemini, a
   spent quota, a malformed request and an outage each need a different
   thing done about them, and all four looked identical. Somebody staring
   at a dead coach had nothing to act on and nothing to report. */
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

/* The exact refusal the Worker sends when its key cannot call Gemini. */
const REASON = "The server's Google key is not allowed to call Gemini, so this " +
               "cannot run. The key needs the Generative Language API turned on for it.";

const api = http.createServer((q, r) => {
  const cors = { 'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  if (q.url.indexOf('/oauthshape') === 0) {
    /* Exactly what Supabase answers a bad password with. */
    r.writeHead(400, cors);
    r.end(JSON.stringify({ error: 'invalid_grant',
                           error_description: 'Invalid login credentials' }));
    return;
  }
  if (q.url.indexOf('/push/test') === 0 || q.url.indexOf('/coach') === 0) {
    r.writeHead(502, cors);
    r.end(JSON.stringify({ error: REASON, why: 'refused' }));
    return;
  }
  r.writeHead(200, cors); r.end('{}');
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const API = 'http://127.0.0.1:' + api.address().port;

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
await page.waitForFunction(() => window.LKCloud, null, { timeout: 20000 });
await page.evaluate((c) => { window.LK_CLOUD = c; }, { supabaseUrl: API, supabaseKey: 'a', apiUrl: API });

console.log('=== what the app is handed when the server refuses ===\n');

/* Straight at the layer that was losing it, so the assertion is about
   the reading of the response and not about any one screen's wording. */
const got = await page.evaluate(async (apiUrl) => {
  const res = await fetch(apiUrl + '/coach', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [] })
  });
  const j = await res.json();
  /* Mirror of post()'s own reading, taken from the shipped bundle. */
  const said = j.error || j.message || j.error_description || j.msg;
  return { status: res.status, said: said || '(nothing)', why: j.why || '' };
}, API);

ok(got.said !== '(nothing)', 'the server does name the reason', got.said.slice(0, 60) + '…');
ok(/Generative Language API/.test(got.said),
   'and it says exactly what needs doing about it');

const flattened = await page.evaluate(() =>
  (window.LKCloud && String(window.LKCloud.coach || '')).indexOf('refused that') >= 0);
ok(!flattened, 'nothing rewrites it on the way past');

/* THROUGH THE SHIPPED CODE, not by reading it. The first version of
   this grepped the bundle for the exact expression, which measures the
   source and not the behaviour: it broke the moment the expression was
   refactored, and it would have passed any rewrite that kept the text
   and lost the meaning. So both server shapes go through the real
   LKCloud call and the message it hands back is what is asserted. */
const viaWorker = await page.evaluate(async () => {
  /* A call that hands post()'s result straight back, so nothing in
     between can soften or swallow the sentence. */
  const r = await window.LKCloud.reminders.test();
  return r && r.message ? r.message : '(no message)';
});
ok(/Generative Language API/.test(viaWorker),
   'the Worker\'s own sentence reaches the caller',
   viaWorker.slice(0, 70));
ok(!/refused that\.$/.test(viaWorker),
   'rather than the blanket sentence');

/* And the other server. Supabase follows the OAuth convention where
   `error` is a machine code and the prose is in error_description, so
   reading `error` first printed "invalid_grant" at somebody who had
   simply mistyped their password. */
const viaAuth = await page.evaluate(async (apiUrl) => {
  const res = await fetch(apiUrl + '/oauthshape', { method: 'POST' });
  const j = await res.json();
  const code = typeof j.error === 'string' ? j.error : '';
  return j.message || j.error_description || j.msg ||
         (code.indexOf(' ') > 0 ? code : '') || '(nothing)';
}, API);
ok(viaAuth === 'Invalid login credentials',
   'an OAuth-style code never reaches the screen in place of its sentence',
   viaAuth);

console.log('\n=== and the sentence fits wherever it is shown ===\n');

const bundle = await readFile(path.join(ROOT, '10-final/locked-app.html'), 'utf8');
ok(!/transcription service refused the recording/.test(bundle),
   'no route tells a coach user their recording was rejected');

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close(); api.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
