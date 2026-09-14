/* SETUP, INTERRUPTED AND CORRECTED.

   first-run.mjs walks the seven questions once, forwards, answering
   each correctly, and that is the run nobody has. A real setup is
   interrupted -- a call, a lock screen, a killed tab -- and a real
   reader changes their mind about an answer two steps after giving it.

   Both of those write to the same place, so both can lose an answer:

     interrupted   Every answer lived in memory only, so a reload put
                   the reader back on Welcome with nothing kept, on the
                   one flow a person cannot skip. A draft fixes that,
                   but a draft saved from the wrong function saves an
                   empty one -- setup repaints through renderSetup, not
                   through render, which is where the save first went.

     corrected     Going back and answering differently has to CHANGE
                   the answer, not add a second one. A profile built
                   from the first answer given rather than the last is
                   a setup that quietly ignores a correction, which is
                   worse than refusing it.

   So this file answers wrongly on purpose, goes back, fixes it, and
   quits halfway through to check the draft. What it asserts about is
   the profile that comes out at the end. */
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

/* ---- the mirror ------------------------------------------------------
   Only what a first run touches. Every other route answers 404 loudly
   rather than 200 with nothing, so a call this test did not expect shows
   up as a failure instead of passing quietly. */
const TOKEN = 'jwt-for-the-first-run';
const UID = 'new-user';
let table = [];                 /* user_data, as the RPC writes it */
const seen = [];                /* every request, for the assertions below */

const readBody = (req) => new Promise((res) => {
  let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => res(b));
});

const api = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const raw = await readBody(req);
  let json = {};
  try { json = raw ? JSON.parse(raw) : {}; } catch (e) { json = {}; }
  /* A CORS preflight is not a call the app made; counting it turned one
     sign-up into two. */
  if (req.method !== 'OPTIONS') {
    seen.push({ path: url.pathname, method: req.method, auth: req.headers.authorization || '', body: json });
  }
  const send = (code, obj) => {
    res.writeHead(code, {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*'
    });
    res.end(JSON.stringify(obj));
  };
  if (req.method === 'OPTIONS') return send(200, {});
  const signedIn = (req.headers.authorization || '') === 'Bearer ' + TOKEN;

  if (url.pathname === '/auth/v1/signup' || url.pathname === '/auth/v1/token') {
    return send(200, {
      access_token: TOKEN,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: UID, email: json.email || 'first@run.test' }
    });
  }
  if (url.pathname === '/rest/v1/rpc/store_push') {
    if (!signedIn) return send(401, { message: 'not signed in' });
    let n = 0;
    (json.rows || []).forEach((r) => {
      if (!r.key) return;
      const value = r.deleted ? null : r.value;
      const hit = table.find((t) => t.key === r.key);
      if (!hit) { table.push({ key: r.key, value, changed_at: Number(r.changed_at) }); n++; return; }
      if (hit.changed_at < Number(r.changed_at)) { hit.value = value; hit.changed_at = Number(r.changed_at); n++; }
    });
    return send(200, n);
  }
  if (url.pathname === '/rest/v1/user_data') {
    if (!signedIn) return send(200, []);
    return send(200, table.map((r) => ({ key: r.key, value: r.value, changed_at: r.changed_at })));
  }
  if (url.pathname === '/rest/v1/profiles') return send(200, signedIn ? [] : []);
  if (url.pathname === '/push/key') return send(200, { publicKey: 'BFakeKeyForTheMirror-0123456789abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWX' });
  if (url.pathname.indexOf('/push/') === 0) return send(200, { ok: true });
  return send(404, { error: 'the first run should not call ' + url.pathname });
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const API = 'http://127.0.0.1:' + api.address().port;

/* The app itself, over HTTP. A file:// document is handed a fresh
   localStorage on some reloads, which would look exactly like the app
   losing the account it had just created. */
const site = http.createServer(async (q, r) => {
  const p = new URL(q.url, 'http://127.0.0.1').pathname;
  /* No service worker in the harness: it would take control of the page
     and reload it mid-run. Everything else is the app, which is what the
     host's own rewrite rule does. */
  if (p === '/sw.js') { r.writeHead(404); r.end('no worker here'); return; }
  try {
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    r.end(await readFile(APP_FILE));
  } catch (e) { r.writeHead(500); r.end(String(e)); }
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const APP = 'http://127.0.0.1:' + site.address().port + '/';

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
                                  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
/* The seam a deploy edits, pointed at the mirror. Defined before the
   page's own cloud-config.js runs, and redefined to stay put. */
await ctx.addInitScript((base) => {
  const cfg = { supabaseUrl: base, supabaseKey: 'anon-key-for-the-mirror', apiUrl: base };
  Object.defineProperty(window, 'LK_CLOUD', {
    get: function () { return cfg; },
    set: function () { /* the build's own config is ignored here */ },
    configurable: false
  });
}, API);

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

/* The harness serves no service worker on purpose, so its 404 is this
   test's own doing and not the app's. */
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  if (/fetching the script|sw\.js|ServiceWorker/i.test(m.text())) return;
  errs.push('console: ' + m.text());
});
page.on('framenavigated', (f) => { if (f === page.mainFrame()) console.log('NAV', f.url().slice(0, 100)); });
try { await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 20000 }); }
catch (e) { console.log('GOTO FAILED:', e.message.split('\n')[0]); }
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0, null, { timeout: 9000 });
await page.waitForTimeout(900);

const shown = () => page.evaluate(() => {
  const s = window.DEMO.screens;
  return Object.keys(s).find((k) => {
    const h = s[k] && s[k].host; if (!h || !h.getBoundingClientRect) return false;
    const b = h.getBoundingClientRect();
    return getComputedStyle(h).display !== 'none' && b.width > 0 && b.height > 0;
  }) || 'none';
});
const text = (id) => page.evaluate((k) => {
  const rec = window.DEMO.screens[k];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  return root ? (root.textContent || '').replace(/\s+/g, ' ').trim() : '';
}, id);
const tap = async (t) => {
  const l = page.locator(`[data-testid="${t}"]`).locator('visible=true').first();
  if (!(await l.count())) return 'missing:' + t;
  try { await l.click({ timeout: 2500 }); } catch (e) { return 'unclickable:' + t; }
  return 'ok';
};
/* Through the screen's shadow root: document.querySelector does not cross
   one, so this silently found nothing and every field read as missing. */
const type = (t, v) => page.evaluate(([id, val]) => {
  let el = null;
  const s = window.DEMO.screens;
  Object.keys(s).forEach((k) => {
    if (el) return;
    const rec = s[k];
    const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
    const hit = root && root.querySelector('[data-testid="' + id + '"]');
    if (hit) el = hit;
  });
  if (!el) el = document.querySelector('[data-testid="' + id + '"]');
  if (!el) return 'missing:' + id;
  el.focus(); el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
}, [t, v]);
const raw = (k) => page.evaluate((key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}, k);


const settle = async () => {
  await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0,
                             null, { timeout: 9000 });
  await page.waitForTimeout(900);
};
const step = () => page.evaluate(() => {
  const rec = window.DEMO.screens['onboarding'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const t = root && root.querySelector('[data-testid="setup-title"], .setup__title, h1');
  return t ? t.textContent.replace(/\s+/g, ' ').trim() : null;
});
const answered = (t) => page.evaluate((id) => {
  const rec = window.DEMO.screens['onboarding'];
  const root = rec && (rec.root || (rec.host && rec.host.shadowRoot));
  const el = root && root.querySelector('[data-testid="' + id + '"]');
  return el ? (el.value !== undefined ? el.value : el.getAttribute('aria-pressed')) : null;
}, t);

console.log('=== an account, then setup ===\n');

ok((await shown()) === 'onboarding', 'a phone with nothing on it lands on onboarding', await shown());
await tap('welcome-create');
await page.waitForTimeout(600);
await type('signup-email', 'interrupted@run.test');
await type('signup-password', 'a-long-enough-passphrase');
await page.waitForTimeout(250);
ok((await tap('signup-submit')) === 'ok', 'the account is created');
await page.waitForTimeout(1200);
const afterSignup = await text('onboarding');
if (/confirm/i.test(afterSignup) || (await page.locator('[data-testid="confirm-title"]').count())) {
  await tap('confirm-guest');
  await page.waitForTimeout(700);
}

console.log('\n=== answered wrongly, on purpose ===\n');

errs.length = 0;
ok((await type('setup-name', 'Wrong Name')) === 'ok', 'a name is typed');
await page.waitForTimeout(250);
ok((await tap('setup-continue')) === 'ok', 'and the step continues');
await page.waitForTimeout(500);
ok((await type('setup-username', 'wrong_handle')) === 'ok', 'a username is typed');
await page.waitForTimeout(250);
ok((await tap('setup-continue')) === 'ok', 'and that step continues');
await page.waitForTimeout(500);
/* Pounds, which is not what this reader wants. */
ok((await tap('setup-units-lb')) === 'ok', 'pounds is chosen');
await page.waitForTimeout(300);

console.log('\n=== and then the phone is shut ===\n');

const mid = await raw('lk_setupDraft');
ok(!!mid && !!mid.answers, 'the answers so far are written down',
   JSON.stringify(mid && mid.answers).slice(0, 120));
ok(mid && mid.answers && mid.answers.name === 'Wrong Name',
   'including the one typed three steps ago', String(mid && mid.answers && mid.answers.name));

await page.reload();
await settle();

ok((await shown()) === 'onboarding', 'it comes back to setup, not to Welcome', await shown());
const back = await raw('lk_setupDraft');
ok(back && back.answers && back.answers.name === 'Wrong Name',
   'with every answer still on it', JSON.stringify(back && back.answers).slice(0, 120));
ok(!errs.length, 'nothing throws coming back to a half-finished setup', errs[0] || '');

console.log('\n=== the reader goes back and fixes the name ===\n');

/* Whatever step the restore landed on, walk back to the first. */
for (let i = 0; i < 8; i++) {
  const nameField = await answered('setup-name');
  if (nameField !== null) break;
  const b = await tap('setup-back');
  if (b !== 'ok') break;
  await page.waitForTimeout(400);
}
ok((await answered('setup-name')) !== null, 'back reaches the name step again',
   String(await answered('setup-name')));
ok((await answered('setup-name')) === 'Wrong Name',
   'and the field still holds what was typed', String(await answered('setup-name')));

ok((await type('setup-name', 'Cesco')) === 'ok', 'it is typed over');
await page.waitForTimeout(300);
const fixed = await raw('lk_setupDraft');
ok(fixed && fixed.answers && fixed.answers.name === 'Cesco',
   'and the correction replaces the answer rather than joining it',
   String(fixed && fixed.answers && fixed.answers.name));

console.log('\n=== forward again, to the end ===\n');

await tap('setup-continue');
await page.waitForTimeout(500);
await type('setup-username', 'cesco_lifts');
await page.waitForTimeout(250);
await tap('setup-continue');
await page.waitForTimeout(500);
/* And kilos this time, over the pounds chosen before. */
ok((await tap('setup-units-kg')) === 'ok', 'kilos is chosen over pounds');
await page.waitForTimeout(300);
await tap('setup-continue');
await page.waitForTimeout(500);

const REST = [
  ['choice', 'setup-experience-1to3'],
  ['choice', 'setup-days-3'],
  ['skip'],
  ['choice', 'setup-goal-size']
];
for (const s of REST) {
  if (s[0] === 'choice') { await tap(s[1]); await page.waitForTimeout(250); }
  await tap('setup-continue');
  await page.waitForTimeout(600);
}
await page.waitForTimeout(1500);

console.log('\n=== and the profile is the CORRECTED one ===\n');

const prof = await raw('lk_profile');
ok(!!prof, 'a profile is written', JSON.stringify(prof || null).slice(0, 140));
ok(prof && /cesco/i.test(String(prof.displayName || prof.name || '')) &&
   !/wrong/i.test(String(prof.displayName || prof.name || '')),
   'with the corrected name, not the first one typed',
   String(prof && (prof.displayName || prof.name)));
ok(prof && String(prof.username || '') === 'cesco_lifts',
   'and the corrected username', String(prof && prof.username));
ok(prof && (prof.useKg === true || prof.units === 'kg'),
   'and kilos, not the pounds chosen before going back',
   JSON.stringify(prof && { useKg: prof.useKg, units: prof.units }));

const draftGone = await raw('lk_setupDraft');
ok(!draftGone, 'and the draft is cleared once setup is finished',
   JSON.stringify(draftGone || null).slice(0, 80));

const onb = await raw('lk_onboarded');
ok(!!onb, 'the phone is marked as set up', JSON.stringify(onb || null).slice(0, 60));
/* The last question is not the last screen: setup ends on the plan it
   built, which the reader reads before pressing Start. That belongs to
   onboarding, so still being on it here is right. */
/* Two ways in, and they go to different places on purpose: Start opens
   the first session, the week opens Train. The week is taken here
   because it is the one that proves the split reached the app. */
ok((await tap('overview-week')) === 'ok', 'the plan it built offers a way into the week');
await page.waitForTimeout(1400);
ok((await shown()) === 'train', 'which opens Train, not setup again', await shown());

const tt = await text('train');
ok(!/No splits yet/i.test(tt), 'with the split the corrected setup built', tt.slice(0, 110));
ok(!/undefined|NaN|\[object Object\]/.test(tt), 'and no hole in it');

/* And a reload does not put a set-up phone back through setup. */
await page.reload();
await settle();
ok((await shown()) !== 'onboarding', 'reopening does not ask the reader to set up again',
   await shown());
ok(!errs.length, 'nothing throws finishing a corrected setup', errs[0] || '');

await br.close();
site.close();
api.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
