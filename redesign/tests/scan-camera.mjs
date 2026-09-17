/* A SCANNER THAT SCANS.

   Tapping Scan used to show a grey icon and a paragraph saying reading a
   barcode "needs a decoder this build does not carry", with a box to
   type the digits into. Snap it was the same shape: an icon, and a file
   input that left the app for the system camera.

   Both show the lens now. This drives the real thing: a fake camera is
   handed to the page with an actual EAN-13 drawn on it, and what has to
   happen is that the app finds the code by itself and looks it up. No
   assertion here reads the decoder's own output -- it reads the screen
   the way somebody holding the phone would. */
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const APP = path.join(ROOT, '10-final/locked-demo.html');

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' }); r.end(await readFile(APP));
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));

const br = await chromium.launch();

/* A camera that shows a barcode. canvas.captureStream is a real
   MediaStream, so the page's video element, the frame grab and the
   decoder all run exactly as they would on a phone -- only the photons
   are fake. */
const fakeCamera = (code) => `
  (function () {
    var Lp = ['0001101','0011001','0010011','0111101','0100011',
              '0110001','0101111','0111011','0110111','0001011'];
    var Gp = ['0100111','0110011','0011011','0100001','0011101',
              '0111001','0000101','0010001','0001001','0010111'];
    var Rp = ['1110010','1100110','1101100','1000010','1011100',
              '1001110','1010000','1000100','1001000','1110100'];
    var PAR = ['OOOOOO','OOEOEE','OOEEOE','OOEEEO','OEOOEE',
               'OEEOOE','OEEEOO','OEOEOE','OEOEEO','OEEOEO'];
    var d = '${code}'.split('').map(Number);
    var mods = '101';
    for (var i = 1; i <= 6; i++) mods += (PAR[d[0]][i - 1] === 'O' ? Lp : Gp)[d[i]];
    mods += '01010';
    for (i = 7; i <= 12; i++) mods += Rp[d[i]];
    mods += '101';

    var c = document.createElement('canvas');
    c.width = 960; c.height = 640;
    var x = c.getContext('2d');
    var draw = function () {
      x.fillStyle = '#f2f2f2';
      x.fillRect(0, 0, c.width, c.height);
      var scale = 6, w = mods.length * scale;
      var left = Math.round((c.width - w) / 2);
      x.fillStyle = '#141414';
      for (var m = 0; m < mods.length; m++) {
        if (mods[m] === '1') x.fillRect(left + m * scale, 180, scale, 280);
      }
      requestAnimationFrame(draw);
    };
    draw();

    var stream = c.captureStream(20);
    navigator.mediaDevices = navigator.mediaDevices || {};
    navigator.mediaDevices.getUserMedia = function (req) {
      if (req && req.audio) return Promise.reject(new DOMException('no', 'NotFoundError'));
      return Promise.resolve(stream);
    };
  })();
`;

/* A camera pointed at nothing. Used where the assertion is about the
   viewfinder itself: with a barcode in frame the scanner resolves it
   inside a few hundred milliseconds and the sheet has moved on before
   anything can look at it, which is the right behaviour and an
   impossible thing to assert against. */
const blankCamera = `
  (function () {
    var c = document.createElement('canvas');
    c.width = 960; c.height = 640;
    var x = c.getContext('2d');
    var draw = function () {
      x.fillStyle = '#9a9a9a';
      x.fillRect(0, 0, c.width, c.height);
      requestAnimationFrame(draw);
    };
    draw();
    var stream = c.captureStream(20);
    navigator.mediaDevices = navigator.mediaDevices || {};
    navigator.mediaDevices.getUserMedia = function (req) {
      if (req && req.audio) return Promise.reject(new DOMException('no', 'NotFoundError'));
      return Promise.resolve(stream);
    };
  })();
`;

const noCamera = `
  navigator.mediaDevices = navigator.mediaDevices || {};
  navigator.mediaDevices.getUserMedia = function () {
    return Promise.reject(new DOMException('denied', 'NotAllowedError'));
  };
`;

async function open(init) {
  const ctx = await br.newContext({
    viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true,
    permissions: ['camera']
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('lk_onboarded', 'true');
      localStorage.setItem('lk_tutorialSeen', 'true');
    } catch (e) {}
  });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + site.address().port + '/');
  await page.waitForFunction(() => window.DEMO && window.DEMO.screens && window.DEMO.screens.fuel,
                             null, { timeout: 20000 });
  await page.evaluate(() => window.DEMO.go('fuel'));
  await page.waitForTimeout(500);
  const click = (id) => page.evaluate((i) => {
    const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
    if (!el) throw new Error('no ' + i); el.click();
  }, id);
  const has = (id) => page.evaluate((i) =>
    !!window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]'), id);
  const txt = () => page.evaluate(() =>
    window.DEMO.screens.fuel.root.textContent.replace(/\s+/g, ' ').trim());
  return { ctx, page, errs, click, has, txt };
}

console.log('=== the scanner sees ===\n');

/* A code the demo's own table resolves, so a successful read lands on a
   food rather than on "not found". */
const CODE = '5012345678900';
let s = await open(blankCamera);
await s.click('log-scan');
await s.page.waitForTimeout(700);
ok(await s.has('scan-video'), 'tapping Scan shows a live view, not a grey icon');
ok(!(await s.txt()).includes('does not carry'),
   'and no longer explains that it cannot read a barcode');
ok(await s.has('scan-code'), 'with typing the digits still offered underneath');
await s.ctx.close();

/* Now a camera with a barcode in front of it. Nothing is typed and
   nothing is tapped after Scan: if the sheet leaves idle, the app read
   the code off the frames by itself. */
s = await open(fakeCamera(CODE));
await s.click('log-scan');
const found = await s.page.waitForFunction(() => {
  const r = window.DEMO.screens.fuel.root;
  return !r.querySelector('[data-testid="scan-video"]') &&
         !!r.querySelector('[data-testid="sheet-scan"]');
}, null, { timeout: 25000 }).then(() => true, () => false);
ok(found, 'and with a barcode in frame it reads it unprompted', String(found));
const after = await s.txt();
ok(/5012345678900|Looking it up|Skyr|Verified/i.test(after),
   'landing on the lookup for the code that was in frame',
   after.slice(after.indexOf('Looking') > -1 ? after.indexOf('Looking') : 0, 120));
ok(s.errs.length === 0, 'with nothing thrown', s.errs[0] || '');

console.log('\n=== the camera stops when the sheet does ===\n');

await s.page.evaluate(() => {
  const r = window.DEMO.screens.fuel.root;
  const el = r.querySelector('[data-testid="scan-close"]') ||
             r.querySelector('[data-testid="scrim"]');
  if (el) el.click();
});
await s.page.waitForTimeout(600);
const live = await s.page.evaluate(() => window.LKCam && window.LKCam.running());
ok(live === false, 'no track is left running behind a closed sheet', String(live));
await s.ctx.close();

console.log('\n=== the plate camera ===\n');

s = await open(fakeCamera(CODE));
await s.click('log-cam');
await s.page.waitForTimeout(500);
ok(await s.has('cam-video'), 'Snap it shows the lens too');
ok(await s.has('cam-shoot'), 'with a shutter on the page rather than a file picker');
ok(await s.has('cam-pick'), 'and the library still available');
ok(!(await s.txt()).includes('downscaled on this phone'),
   'and the paragraph about downscaling is gone');
await s.ctx.close();

console.log('\n=== a camera that will not open says so ===\n');

s = await open(noCamera);
await s.click('log-scan');
await s.page.waitForTimeout(900);
ok(await s.has('scan-cam-msg'), 'a blocked camera gets a sentence');
ok((await s.txt()).toLowerCase().includes('blocked'),
   'that says it is blocked rather than failing silently');
ok(await s.has('scan-code'), 'and typing the digits is still there');
ok(s.errs.length === 0, 'nothing thrown on that path either', s.errs[0] || '');
await s.ctx.close();

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
await br.close(); site.close();
process.exit(fails ? 1 : 0);
