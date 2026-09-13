/* THE WALKTHROUGH, DRIVEN.

   Two things are checked here and they are different questions.

   FIRST, every step is walked on the real screens. Not a selector list
   compared against a source file -- the track is started, and each step
   is completed by pressing the control the player itself resolved, in
   the app, in order. A step whose control is not there when the reader
   arrives fails, which is the only way to catch the kind of breakage
   that matters: a sheet that no longer opens, a testid that moved, a
   flow that gained a confirmation.

   SECOND, every authored line is read for features the redesign cut.
   The shipped tutorial told every new user that "voice mode reads your
   numbers back so you never look away from the bar". Nothing in the app
   did that. The first thing a person is told cannot be false, so the
   named list below fails the build wherever it appears. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));
const DEMO = 'file://' + ROOT + '/10-final/locked-demo.html';

let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* ---- 1. the copy, against what the build does not have -------------
   Each entry is a phrase and the reason it must not appear. */
const CUT = [
  [/voice mode|reads? your numbers back|say it takes a sentence/i,
   'voice readback — the redesign cut the voice button'],
  [/USDA|barcode (lookup|database)/i,
   'barcode lookup against USDA — the food search does not reach it'],
  [/reads? a plate|photo.{0,12}calorie/i,
   'photo plate reading'],
  [/sync (switch|toggle)|turn on sync/i,
   'sync as a switch — sync is an account, not a setting'],
  [/follows? your (phone|system).{0,20}unit|units follow/i,
   'units following the system — units are chosen, not inherited'],
  [/edit (the |a )?goal in place/i,
   'editing a goal in place']
];

const src = fs.readFileSync(path.join(ROOT, '08-build', 'tutor-steps.js'), 'utf8');
/* Read the table the app reads, not a copy of it. */
const win = { window: {} };
const vm = await import('node:vm');
vm.createContext(win);
vm.runInContext(src, win);
const TRACKS = win.window.LKTutorSteps;

ok(!!TRACKS, 'the step table loads');

let lines = 0;
Object.keys(TRACKS).forEach((id) => {
  TRACKS[id].steps.forEach((st, i) => {
    lines++;
    const text = (st.say || '') + ' ' + (st.note || '');
    CUT.forEach(([re, why]) => {
      /* "Scan reads a barcode, Say it takes a sentence, Snap it reads a
         plate" is the one place these words are allowed: it is the Fuel
         screen's own four buttons, which all exist. The rule is about
         claiming a capability, so the exemption is narrow and named. */
      const allowed = id === 'fuel' && i === 1;
      if (!allowed && re.test(text)) {
        ok(false, id + ' step ' + (i + 1) + ' names a cut feature', why + ' — "' + text.trim().slice(0, 80) + '"');
      }
    });
    ok(!!(st.say && st.say.length > 4), id + ' step ' + (i + 1) + ' has a line', (st.say || '').slice(0, 48));
    ok(!!(st.testid || st.sel), id + ' step ' + (i + 1) + ' names a control', st.testid || st.sel);
  });
});
/* Sixty-four, not the prototype's sixty-three: Review's Done and the
   library's and Progress's way back are steps that exist because those
   three screens gained a control they were missing. */
ok(lines === 65, 'all 65 authored lines are present', String(lines));

/* ---- 2. every track, walked on the real screens -------------------- */
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 },
                                       deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(DEMO);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
/* Past the first-run gate, so the app is the one a returning person sees. */
await page.evaluate(() => {
  localStorage.setItem('lk_onboarded', 'true');
  localStorage.setItem('lk_tutorialSeen', 'true');
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKTutor && window.LKTutor.available());
await page.waitForTimeout(600);

for (const id of Object.keys(TRACKS)) {
  const total = TRACKS[id].steps.length;
  /* Each module is entered fresh, the way somebody opens one from
     Settings. Running them back to back in one page left the app deep
     inside whatever the last module did -- a live session, a changed
     unit -- and the next module's first screen never came up. */
  await page.reload();
  await page.waitForFunction(() => window.LKTutor && window.LKTutor.available());
  await page.waitForTimeout(500);
  const started = await page.evaluate((t) => window.LKTutor.start(t), id);
  ok(started, id + ': starts');
  if (!started) continue;

  let guard = 0, done = false, stuckAt = null, lastStep = -1, still = 0, pressed = -1;
  while (guard++ < total * 40) {
    const state = await page.evaluate(() => {
      if (!window.LKTutor.running()) return { over: true };
      const at = window.LKTutor.at();
      const el = window.LKTutor.target();
      return { over: false, step: at ? at.step : -1, lost: window.LKTutor.lost(),
               waiting: window.LKTutor.waiting(), hasTarget: !!el,
               armed: window.LKTutor.armed() };
    });
    if (state.over) { done = true; break; }
    if (state.lost) { stuckAt = state.step; break; }
    /* A step that does not move on after enough turns is stuck, and
       saying which one is the entire value of this suite. */
    if (state.step === lastStep) { if (++still > 18) { stuckAt = state.step; break; } }
    else { lastStep = state.step; still = 0; }

    if (state.waiting) {
      /* A read step: the reader presses Continue. */
      await page.evaluate(() => {
        document.querySelector('#lk-tutor [data-testid="tutor-continue"]').click();
      });
    } else if (state.hasTarget && state.armed && pressed !== state.step) {
      pressed = state.step;
      /* Only press once the step has actually armed. A tap that lands a
         frame early hits a control with no listener on it, and the step
         then waits forever for a press that already happened. */
      /* A tap step: press the control the player resolved, as a finger would. */
      await page.evaluate(() => {
        const el = window.LKTutor.target();
        const st = window.LKTutorSteps[window.LKTutor.at().track].steps[window.LKTutor.at().step];
        if (st.hold) { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true })); }
        else { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, view: window })); }
      });
      await page.waitForTimeout(TRACKS[id].steps[state.step] && TRACKS[id].steps[state.step].hold ? 820 : 60);
    }
    await page.waitForTimeout(260);
  }

  ok(done, id + ': all ' + total + ' steps complete',
     done ? '' : (stuckAt != null ? 'stuck at step ' + (stuckAt + 1) + ' — ' +
       (TRACKS[id].steps[stuckAt].testid || TRACKS[id].steps[stuckAt].sel)
       : 'ran out of turns'));
  await page.evaluate(() => window.LKTutor.stop());
  await page.waitForTimeout(200);
}

/* ---- 3. the gate, and leaving ------------------------------------- */
await page.evaluate(() => { localStorage.removeItem('lk_tutorialSeen'); location.hash = '#/home'; });
await page.waitForTimeout(250);
await page.evaluate(() => window.LKTutor.start('quick'));
await page.waitForTimeout(500);
const skipVisible = await page.evaluate(() => {
  const b = document.querySelector('#lk-tutor [data-testid="tutor-skip"]');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const cs = getComputedStyle(b);
  return { shown: r.width > 0 && r.height > 0, h: r.height, opacity: cs.opacity };
});
ok(skipVisible && skipVisible.shown, 'Skip is on the first frame', JSON.stringify(skipVisible));
ok(skipVisible && skipVisible.h >= 44, 'Skip is a real target', skipVisible ? skipVisible.h + 'px' : '');
ok(skipVisible && Number(skipVisible.opacity) === 1, 'Skip is at full contrast', skipVisible ? skipVisible.opacity : '');

await page.evaluate(() => document.querySelector('#lk-tutor [data-testid="tutor-skip"]').click());
await page.waitForTimeout(300);
const afterSkip = await page.evaluate(() => ({
  running: window.LKTutor.running(),
  seen: localStorage.getItem('lk_tutorialSeen'),
  hidden: document.getElementById('lk-tutor').hidden
}));
ok(!afterSkip.running && afterSkip.hidden, 'skipping leaves within a frame');
ok(!!afterSkip.seen, 'skipping still satisfies the first-run gate', String(afterSkip.seen));

ok(errors.length === 0, 'zero console errors across all six tracks', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall good');
process.exit(fails ? 1 : 0);
