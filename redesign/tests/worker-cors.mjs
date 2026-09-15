/* THE PREFLIGHT THE WORKER ACTUALLY SENDS.

   cloud-contract.mjs proves, in Node, that the Worker's requests no
   longer carry Supabase's `apikey`. Node does not enforce CORS, so that
   test proves the header is absent and nothing about whether a browser
   would have let the request through -- and a browser was the only
   thing that ever blocked it.

   The fault: `apikey` is a custom header, a custom header makes the
   browser send an OPTIONS preflight first, and the deployed Worker
   answers preflights with

     Access-Control-Allow-Headers: Content-Type, Authorization

   and nothing else. So the preflight failed, the real request was never
   sent, and every Worker-backed feature in Fuel -- food search, the
   meal photo, the receipt reader, the pantry scan -- returned its own
   empty result. A whole tab looked like it had no data rather than like
   it was broken.

   This mirror answers preflights EXACTLY as the deployed Worker does,
   read off its source, and runs the app in Chromium against it. If the
   app ever sends `apikey` to the Worker again, Chromium blocks it here
   the same way it blocks it on a phone, and this fails. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP_FILE = path.join(ROOT, '10-final/locked-app.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++;
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* ---- the app, on its own origin ---- */
const site = http.createServer(async (q, r) => {
  const p = new URL(q.url, 'http://127.0.0.1').pathname;
  if (p === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(await readFile(APP_FILE));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const APP = 'http://127.0.0.1:' + site.address().port + '/';

/* ---- the Worker, on a DIFFERENT origin, so CORS is real ---- */
const seen = [];
const worker = http.createServer((q, r) => {
  const url = new URL(q.url, 'http://x');
  const origin = q.headers.origin || '';
  seen.push({ method: q.method, path: url.pathname,
              acrh: q.headers['access-control-request-headers'] || '',
              apikey: q.headers.apikey, auth: q.headers.authorization });

  if (q.method === 'OPTIONS') {
    /* Verbatim from the deployed Worker. Content-Type and Authorization
       and nothing else -- which is the whole point. */
    r.writeHead(200, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin'
    });
    r.end();
    return;
  }
  r.writeHead(200, { 'content-type': 'application/json',
                     'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' });
  if (url.pathname === '/food-search') {
    r.end(JSON.stringify({ items: [
      { name: 'Rolled oats', brand: 'Generic', type: 'Generic',
        cal: 379, pro: 13.2, carb: 67.7, fat: 6.5 }
    ] }));
    return;
  }
  r.end(JSON.stringify({ ok: true }));
});
await new Promise((r) => worker.listen(0, '127.0.0.1', r));
/* localhost is a different ORIGIN from 127.0.0.1 to a browser, which is
   what makes these requests cross-origin and the preflight real. */
const API = 'http://localhost:' + worker.address().port;

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript((base) => {
  const cfg = { supabaseUrl: 'https://unused.invalid', supabaseKey: 'anon-key-for-the-mirror',
                apiUrl: base };
  Object.defineProperty(window, 'LK_CLOUD', {
    get: function () { return cfg; }, set: function () {}, configurable: false
  });
}, API);
await ctx.addInitScript((d) => {
  try {
    if (localStorage.getItem('lk_seeded')) return;
    localStorage.setItem('lk_seeded', '1');
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
  } catch (e) {}
}, {
  lk_onboarded: 'true', lk_tutorialSeen: 'true',
  lk_profile: { username: 'cesco', displayName: 'Cesco', useKg: true, weightKg: 82,
                heightCm: 180, age: 31, sex: 'male', goal: 'maintain' }
});

const page = await ctx.newPage();
const blocked = [];
page.on('console', (m) => {
  const t = m.text();
  if (/Access-Control|CORS|blocked by/i.test(t)) blocked.push(t.slice(0, 160));
});
await page.goto(APP);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                           null, { timeout: 12000 });
await page.waitForTimeout(900);

console.log('=== a food lookup, through a real browser preflight ===\n');

const res = await page.evaluate(() => window.LKCloud.foodSearch('oats'));
ok(!!res, 'the lookup returns something', JSON.stringify(res && res.ok));
ok(res && res.ok === true, 'and it succeeded rather than being blocked',
   JSON.stringify(res && (res.message || res.error || 'ok')));
ok(res && res.data && res.data.length === 1, 'with the food the server sent',
   JSON.stringify(res && res.data && res.data.map((x) => x.name)));
ok(res && res.data && res.data[0] && res.data[0].kcal === 379,
   'and its real figures, not a guess',
   JSON.stringify(res && res.data && res.data[0] && res.data[0].kcal));

console.log('\n=== and the request the browser actually let through ===\n');

const real = seen.filter((s) => s.method === 'GET' && s.path === '/food-search').pop();
ok(!!real, 'the GET reached the Worker at all', real ? real.path : 'never arrived');
ok(real && real.apikey === undefined,
   'carrying no Supabase project key', real ? String(real.apikey) : '');

const pre = seen.filter((s) => s.method === 'OPTIONS').pop();
if (pre) {
  ok(!/apikey/i.test(pre.acrh),
     'and its preflight never asked for one, which is what used to fail',
     pre.acrh || '(no header list)');
}

ok(blocked.length === 0, 'nothing was blocked by CORS',
   blocked[0] || 'clean');

console.log('\n=== and the old header would still be refused ===\n');

/* The guard proves itself: send `apikey` deliberately and watch this
   same mirror block it. A test that cannot fail proves nothing. */
const forced = await page.evaluate((base) => {
  return fetch(base + '/food-search?src=fatsecret&q=oats', {
    headers: { 'content-type': 'application/json', apikey: 'anon-key-for-the-mirror' }
  }).then(function () { return 'allowed'; }, function (e) { return 'blocked: ' + e.message; });
}, API);
ok(/blocked/.test(String(forced)),
   'sending apikey to the Worker is refused by the browser, exactly as it was',
   String(forced).slice(0, 90));

await br.close();
site.close();
worker.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
