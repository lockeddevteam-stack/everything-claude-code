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

/* THE SAME BLANK CAMERA, BUT WITH A LAMP ON IT.

   A canvas capture stream is a real MediaStream, which is exactly why
   it cannot help here: a canvas track has no torch, and a browser will
   never report one, so every torch path would be dead code under test.
   The track's getCapabilities and applyConstraints are replaced with a
   pair that behave the way a phone's do -- capabilities advertise the
   lamp, applying the constraint resolves -- and every torch constraint
   the app asks for is recorded on window.__torchCalls so a test can ask
   what the app actually did to the hardware rather than only what it
   drew on the screen. Those are two different claims and only the first
   one is the feature. */
const torchCamera = `
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
    window.__torchCalls = [];
    stream.getVideoTracks().forEach(function (t) {
      t.getCapabilities = function () { return { torch: true }; };
      t.applyConstraints = function (req) {
        var adv = (req && req.advanced) || [];
        for (var i = 0; i < adv.length; i++) {
          if ('torch' in adv[i]) window.__torchCalls.push(!!adv[i].torch);
        }
        return Promise.resolve();
      };
    });
    navigator.mediaDevices = navigator.mediaDevices || {};
    navigator.mediaDevices.getUserMedia = function (req) {
      if (req && req.audio) return Promise.reject(new DOMException('no', 'NotFoundError'));
      return Promise.resolve(stream);
    };
  })();
`;

/* A camera that opens perfectly well and simply has no lamp -- a laptop
   webcam, a front-facing phone camera. getCapabilities answers, it just
   does not mention a torch. This is the case the button must disappear
   for: a control that is drawn and does nothing teaches somebody that
   the scanner is broken. */
const noTorchCamera = `
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
    window.__torchCalls = [];
    stream.getVideoTracks().forEach(function (t) {
      t.getCapabilities = function () { return { width: { max: 960 } }; };
      t.applyConstraints = function (req) {
        var adv = (req && req.advanced) || [];
        for (var i = 0; i < adv.length; i++) {
          if ('torch' in adv[i]) window.__torchCalls.push(!!adv[i].torch);
        }
        return Promise.resolve();
      };
    });
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
  /* What the button is telling a screen reader about its own state.
     null when the control is not on the page at all, which is a
     different answer from "off" and the tests below rely on that. */
  const pressed = (id) => page.evaluate((i) => {
    const el = window.DEMO.screens.fuel.root.querySelector('[data-testid="' + i + '"]');
    return el ? el.getAttribute('aria-pressed') : null;
  }, id);
  const torchCalls = () => page.evaluate(() => window.__torchCalls || []);
  return { ctx, page, errs, click, has, txt, pressed, torchCalls };
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

console.log('\n=== the torch ===\n');

/* The scanner, on a phone that has a lamp. Food is scanned in cupboards,
   pantries and the backs of fridges, and the decoder needs contrast
   between a bar and the paper more than it needs anything else, so the
   lamp comes on by itself and the button is there to turn it off again.
   Both halves of that are asserted: the control being drawn is not the
   same claim as the hardware having been switched on, and only the
   second one is the feature. */
s = await open(torchCamera);
await s.click('log-scan');
await s.page.waitForTimeout(900);
ok(await s.has('scan-torch'), 'a camera with a lamp gets a torch button in the scanner');
let calls = await s.torchCalls();
ok(calls.length > 0 && calls[calls.length - 1] === true,
   'and the lamp is actually switched on without anybody asking, because cupboards are dark',
   JSON.stringify(calls));
ok((await s.pressed('scan-torch')) === 'true',
   'with the button saying so to a screen reader rather than only looking lit');

/* Pressing it is the way out of a lamp in your face while scanning a
   packet in daylight. It has to reach the track, not just the markup. */
await s.click('scan-torch');
await s.page.waitForTimeout(400);
calls = await s.torchCalls();
ok(calls[calls.length - 1] === false,
   'pressing the button turns the lamp off at the camera', JSON.stringify(calls));
ok((await s.pressed('scan-torch')) === 'false',
   'and aria-pressed follows the lamp instead of drifting out of step with it');
ok(s.errs.length === 0, 'with nothing thrown by any of it', s.errs[0] || '');
await s.ctx.close();

/* The plate camera offers the same lamp and does not reach for it. A
   barcode is read in a fraction of a second; a plate is framed for
   several, and a lamp pointed at somebody's dinner for that long is not
   worth the better photo. */
s = await open(torchCamera);
await s.click('log-cam');
await s.page.waitForTimeout(900);
ok(await s.has('cam-torch'), 'the plate camera offers the torch too, for a dark kitchen');
ok((await s.torchCalls()).length === 0,
   'but does not switch it on by itself, because a plate is framed for seconds not milliseconds',
   JSON.stringify(await s.torchCalls()));
ok((await s.pressed('cam-torch')) === 'false', 'and it starts out saying it is off');
await s.ctx.close();

/* A camera with no lamp -- a laptop webcam, a front camera. The button
   is not drawn at all. A control that is present and silently does
   nothing is worse than no control: it tells somebody the scanner is
   broken rather than that their camera has no lamp. */
s = await open(noTorchCamera);
await s.click('log-scan');
await s.page.waitForTimeout(900);
ok(!(await s.has('scan-torch')),
   'a camera with no lamp gets no torch button in the scanner, rather than a dead one');
ok((await s.torchCalls()).length === 0,
   'and nothing is asked of a track that said it could not do it',
   JSON.stringify(await s.torchCalls()));
await s.page.evaluate(() => {
  const r = window.DEMO.screens.fuel.root;
  const el = r.querySelector('[data-testid="scan-close"]') ||
             r.querySelector('[data-testid="scrim"]');
  if (el) el.click();
});
await s.page.waitForTimeout(400);
await s.click('log-cam');
await s.page.waitForTimeout(900);
ok(!(await s.has('cam-torch')), 'and none in the plate camera either');
ok(s.errs.length === 0, 'with nothing thrown on the no-lamp path', s.errs[0] || '');
await s.ctx.close();

/* Closing the sheet with the lamp lit. The torch is a constraint on the
   track, and a track that is stopped while lit stays glowing on some
   devices until something else claims the camera -- a phone that will
   not turn its light off is a bug somebody notices in a dark room. */
s = await open(torchCamera);
await s.click('log-scan');
await s.page.waitForTimeout(900);
await s.page.evaluate(() => {
  const r = window.DEMO.screens.fuel.root;
  const el = r.querySelector('[data-testid="scan-close"]') ||
             r.querySelector('[data-testid="scrim"]');
  if (el) el.click();
});
await s.page.waitForTimeout(600);
const stillLive = await s.page.evaluate(() => window.LKCam && window.LKCam.running());
ok(stillLive === false, 'closing the sheet with the lamp lit leaves no track running',
   String(stillLive));
ok((await s.torchCalls()).indexOf(false) > -1,
   'and the lamp was put out before the track went, not left glowing',
   JSON.stringify(await s.torchCalls()));
ok(s.errs.length === 0, 'and closing it threw nothing', s.errs[0] || '');
await s.ctx.close();

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
await br.close(); site.close();
process.exit(fails ? 1 : 0);
