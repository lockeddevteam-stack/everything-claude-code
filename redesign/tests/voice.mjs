/* THE MICROPHONE, DRIVEN.

   Fuel's "Say it, or type it" had a text box and a line of copy saying
   dictation belongs to the keyboard. The Worker has transcribed audio
   since the Gemini migration; nothing in the app had ever recorded any.

   What is proved here is the part that would otherwise only be proved on
   somebody's phone:

   1. A real recording is made and sent. Chromium's fake device supplies
      the audio, so the MediaRecorder path runs for real.
   2. WHAT GOES UP IS A WAV. This is the reason the feature works at all.
      MediaRecorder gives webm/opus on Chrome and mp4/aac on iOS, and
      Gemini's inline audio accepts neither -- so the clip is decoded,
      mixed to mono, resampled to 16 kHz and re-encoded here. The mirror
      checks the bytes for RIFF and WAVE rather than trusting a header.
   3. The transcript lands in the FIELD and is read into items, not
      logged. A misheard sentence gets corrected before it becomes a
      meal.
   4. Every refusal says its own thing. A spent allowance, a server that
      will not answer, and a recording with nothing in it are three
      different sentences.
   5. No server, no button. The field stands on its own rather than
      offering something that cannot work. */
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

/* What the fake Worker does this run, and what it was sent. */
let plan = {};
let got = null;

const api = http.createServer((q, r) => {
  const cors = {
    'access-control-allow-origin': q.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'content-type': 'application/json'
  };
  if (q.method === 'OPTIONS') { r.writeHead(204, cors); r.end(); return; }
  const chunks = [];
  q.on('data', (c) => chunks.push(c));
  q.on('end', () => {
    const body = Buffer.concat(chunks);
    got = { type: q.headers['content-type'] || '', bytes: body };
    if (plan.status === 429) {
      r.writeHead(429, cors);
      r.end(JSON.stringify({ error: 'Daily voice limit reached.', action: 'unknown', data: {} }));
      return;
    }
    if (plan.status === 500) { r.writeHead(500, cors); r.end(JSON.stringify({ error: 'boom' })); return; }
    r.writeHead(200, cors);
    r.end(JSON.stringify({
      transcription: plan.text === undefined ? '2 eggs and toast' : plan.text,
      action: 'log_meal', data: {}
    }));
  });
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const API = 'http://127.0.0.1:' + api.address().port;

const site = http.createServer(async (q, r) => {
  const p = new URL(q.url, 'http://127.0.0.1').pathname;
  if (p === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(await readFile(APP_FILE));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const SITE = 'http://127.0.0.1:' + site.address().port + '/';

/* The fake device gives a real audio track, so the recorder, the decode
   and the resample all run exactly as they would on a phone. */
const br = await chromium.launch({
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
});

async function open(withApi) {
  const ctx = await br.newContext({
    viewport: { width: 393, height: 852 }, deviceScaleFactor: 3,
    isMobile: true, hasTouch: true, permissions: ['microphone']
  });
  await ctx.addInitScript((cfg) => {
    window.LK_CLOUD = cfg;
    try {
      if (localStorage.getItem('lk_seeded')) return;
      localStorage.setItem('lk_seeded', '1');
      localStorage.setItem('lk_onboarded', 'true');
      localStorage.setItem('lk_tutorialSeen', 'true');
    } catch (e) {}
  }, withApi
     ? { supabaseUrl: API, supabaseKey: 'anon', apiUrl: API }
     : { supabaseUrl: API, supabaseKey: 'anon' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(SITE);
  /* cloud-config.js assigns window.LK_CLOUD as it loads, so a value set
     before navigation is overwritten by the shipped one. cfg() reads the
     global on every call, so it is set again once the page is up. */
  await page.evaluate((c) => { window.LK_CLOUD = c; }, withApi
    ? { supabaseUrl: API, supabaseKey: 'anon', apiUrl: API }
    : { supabaseUrl: API, supabaseKey: 'anon' });
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens && window.DEMO.screens.fuel,
                             null, { timeout: 15000 });
  await page.waitForTimeout(600);
  return { ctx, page, errs };
}

/* The screens are in shadow roots, so everything is reached through the
   root this screen owns rather than through the document. */
const root = (page) => page.evaluateHandle(() => window.DEMO.screens.fuel.root);
async function click(page, testid) {
  await page.evaluate((id) => {
    const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + id + '"]');
    if (!el) throw new Error('no ' + id);
    el.click();
  }, testid);
}
async function has(page, testid) {
  return page.evaluate((id) =>
    !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + id + '"]'), testid);
}
async function text(page, testid) {
  return page.evaluate((id) => {
    const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + id + '"]');
    return el ? el.textContent.trim() : '(none)';
  }, testid);
}
async function value(page, testid) {
  return page.evaluate((id) => {
    const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + id + '"]');
    return el ? el.value : '(none)';
  }, testid);
}
async function waitFor(page, testid, ms = 10000) {
  await page.waitForFunction((id) =>
    !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + id + '"]'),
    testid, { timeout: ms });
}

console.log('=== a sentence is recorded, sent and written into the field ===\n');

plan = {};
let { ctx, page, errs } = await open(true);
await click(page, 'log-mic');
await waitFor(page, 'sheet-mic');
ok(await has(page, 'mic-rec'), 'the microphone is offered when there is a server behind it');

await click(page, 'mic-rec');
await waitFor(page, 'mic-level', 8000);
ok(true, 'it starts recording');
await page.waitForTimeout(1200);
await click(page, 'mic-rec');
await page.waitForFunction(() => {
  const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="mic-text"]');
  return el && el.value.length > 0;
}, null, { timeout: 15000 });

ok(await value(page, 'mic-text') === '2 eggs and toast',
   'and what came back is in the field, editable', await value(page, 'mic-text'));
ok(await has(page, 'mic-preview'),
   'read into items the same way a typed sentence is');
ok((await text(page, 'mic-voice-msg')).indexOf('Correct it') > -1,
   'and it says so, rather than logging it', await text(page, 'mic-voice-msg'));
ok(!(await has(page, 'toast')), 'nothing was logged by speaking');

console.log('\n=== what went up is a WAV, which is the whole reason it works ===\n');

ok(!!got && got.type.indexOf('multipart/form-data') === 0,
   'sent as a form, with the boundary the browser wrote',
   got ? got.type.slice(0, 40) : 'nothing arrived');
const raw = got ? got.bytes.toString('latin1') : '';
ok(raw.indexOf('RIFF') > -1 && raw.indexOf('WAVE') > -1,
   'and the bytes are a RIFF/WAVE, not whatever the recorder produced',
   raw.indexOf('RIFF') > -1 ? 'RIFF found' : 'no RIFF in ' + got?.bytes.length + ' bytes');
ok(raw.indexOf('filename="clip.wav"') > -1, 'named as one too');
ok(got && got.bytes.length > 2000, 'and it carries audio rather than an empty container',
   got ? got.bytes.length + ' bytes' : '0');

/* 16 kHz mono 16-bit is what the header must say: a rate of 16000 at
   offset 24, one channel at 22. Anything else means the resample did not
   happen and a minute of speech becomes ten megabytes. */
if (got) {
  const i = got.bytes.indexOf('fmt ');
  const ch = got.bytes.readUInt16LE(i + 10);
  const rate = got.bytes.readUInt32LE(i + 12);
  ok(ch === 1 && rate === 16000, 'mono at 16 kHz, which is what speech needs',
     ch + ' channel(s) at ' + rate + ' Hz');
}
await ctx.close();

console.log('\n=== a refusal is its own sentence ===\n');

plan = { status: 429 };
({ ctx, page, errs } = await open(true));
await click(page, 'log-mic');
await waitFor(page, 'sheet-mic');
await click(page, 'mic-rec');
await waitFor(page, 'mic-level', 8000);
await page.waitForTimeout(1000);
await click(page, 'mic-rec');
await waitFor(page, 'mic-voice-msg', 15000);
ok((await text(page, 'mic-voice-msg')).toLowerCase().indexOf('limit') > -1,
   'a spent allowance says so, rather than blaming the microphone',
   await text(page, 'mic-voice-msg'));
ok(await value(page, 'mic-text') === '', 'and nothing is put in the field');
await ctx.close();

plan = { text: '' };
({ ctx, page, errs } = await open(true));
await click(page, 'log-mic');
await waitFor(page, 'sheet-mic');
await click(page, 'mic-rec');
await waitFor(page, 'mic-level', 8000);
await page.waitForTimeout(1000);
await click(page, 'mic-rec');
await waitFor(page, 'mic-voice-msg', 15000);
ok((await text(page, 'mic-voice-msg')).indexOf('intelligible') > -1,
   'a recording with nothing in it says that, not that the server failed',
   await text(page, 'mic-voice-msg'));
await ctx.close();

plan = { status: 500 };
({ ctx, page, errs } = await open(true));
await click(page, 'log-mic');
await waitFor(page, 'sheet-mic');
await click(page, 'mic-rec');
await waitFor(page, 'mic-level', 8000);
await page.waitForTimeout(1000);
await click(page, 'mic-rec');
await waitFor(page, 'mic-voice-msg', 15000);
ok((await text(page, 'mic-voice-msg')).indexOf('Try again') > -1,
   'a server that broke gets a sentence, not its own word for it',
   await text(page, 'mic-voice-msg'));
await ctx.close();

console.log('\n=== no server, no button ===\n');

plan = {};
({ ctx, page, errs } = await open(false));
await click(page, 'log-mic');
await waitFor(page, 'sheet-mic');
ok(!(await has(page, 'mic-rec')),
   'the microphone is not offered with nothing to send a recording to');
ok(await has(page, 'mic-nodictation'),
   'and the field says what to do instead');
ok(await has(page, 'mic-text'), 'the field itself is untouched');
await ctx.close();

console.log('\n=== closing the sheet closes the microphone ===\n');

({ ctx, page, errs } = await open(true));
await click(page, 'log-mic');
await waitFor(page, 'sheet-mic');
await click(page, 'mic-rec');
await waitFor(page, 'mic-level', 8000);
await click(page, 'mic-close');
await page.waitForTimeout(400);
const stillOn = await page.evaluate(() => {
  const w = window.DEMO.screens.fuel.globals || window;
  return !!(window.LKVoice && window.LKVoice.recording());
});
ok(!stillOn, 'the recorder is not left running behind a closed sheet');
ok(errs.length === 0, 'and no screen threw', errs.join(' | '));
await ctx.close();

await br.close();
api.close(); site.close();
console.log('');
console.log(`${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
