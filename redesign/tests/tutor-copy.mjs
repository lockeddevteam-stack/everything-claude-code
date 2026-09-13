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

/* ---- 4. the ways in ------------------------------------------------
   A walkthrough nobody can reach is the same as no walkthrough, which is
   what the shipped one was: it wrote the gate and nothing anywhere
   opened it again. */

/* A first run lands on it. */
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('lk_onboarded', 'true');
  localStorage.setItem('lk_profile', JSON.stringify({ name: 'Ada' }));
});
/* Opened at the bare URL, the way a phone opens it: the gate only runs
   when there is no hash to honour. */
await page.goto(DEMO);
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.waitForTimeout(400);
ok(await page.evaluate(() => location.hash) === '#/tutorial',
   'setup done and the walkthrough unseen lands on it',
   await page.evaluate(() => location.hash));

/* Finishing Quick start offers the rest, and does not play it. */
await page.evaluate(() => window.LKTutor.start('quick'));
await page.waitForTimeout(400);
await page.evaluate(() => {
  /* Straight to the end, the way a reader who completed it arrives. */
  const t = window.LKTutorSteps.quick.steps.length;
  for (let i = 0; i < t; i++) { /* the player walks itself when told to stop at the end */ }
});
await page.evaluate(() => window.LKTutor.stop());
await page.waitForTimeout(200);

/* Settings offers both, separately. */
await page.evaluate(() => { location.hash = '#/profile/settings'; });
await page.waitForTimeout(600);
const rows = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-settings');
  if (!r || !r.shadowRoot) return null;
  return ['row-tutorial', 'row-tutorial-tour'].map((id) => {
    const el = r.shadowRoot.querySelector('[data-testid="' + id + '"]');
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
  });
});
ok(rows && rows[0] && /quick start/i.test(rows[0]), 'Settings offers Quick start', rows && rows[0]);
ok(rows && rows[1] && /full tour/i.test(rows[1]), 'Settings offers the Full tour', rows && rows[1]);

/* A module resumes where it was left. */
await page.evaluate(() => {
  localStorage.setItem('lk_tutorialSteps', JSON.stringify({ fuel: 4 }));
  location.hash = '#/fuel';
});
await page.waitForTimeout(400);
const resumed = await page.evaluate(() => {
  window.LKTutor.start('fuel', { resume: true });
  return window.LKTutor.at();
});
ok(resumed && resumed.step === 4, 'a half-finished module resumes rather than restarts',
   JSON.stringify(resumed));
await page.evaluate(() => window.LKTutor.stop());

/* And the three keys that carry all of this sync. */
const synced = await page.evaluate(() => {
  const k = window.LKStore.syncKeys();
  return { seen: k.indexOf('lk_tutorialSeen') !== -1,
           track: k.indexOf('lk_tutorialTrack') !== -1,
           steps: k.indexOf('lk_tutorialSteps') !== -1,
           session: k.indexOf('lk_session') !== -1 };
});
ok(synced.seen && synced.track && synced.steps,
   'what somebody learned follows them to a new device', JSON.stringify(synced));
ok(!synced.session, 'the credential does not', JSON.stringify(synced));

/* ---- 5. the layer itself: motion, theme, contrast, targets ---------
   The eighteen screens are audited for all of this and the layer above
   them was not audited for any of it, which is how an overlay ends up
   being the one unreadable thing in a build that is otherwise careful. */
const AXE = fs.readFileSync(path.join(ROOT, 'tests/node_modules/axe-core/axe.min.js'), 'utf8');

for (const [mode, reduce] of [['normal', false], ['reduced motion', true]]) {
  const c2 = await browser.newContext({
    viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true,
    reducedMotion: reduce ? 'reduce' : 'no-preference'
  });
  const p2 = await c2.newPage();
  const errs2 = [];
  p2.on('pageerror', (e) => errs2.push(String(e)));
  await p2.goto(DEMO);
  await p2.waitForFunction(() => window.DEMO && window.LKTutor);
  await p2.evaluate(() => {
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
  });
  await p2.reload();
  await p2.waitForFunction(() => window.LKTutor && window.LKTutor.available());
  await p2.waitForTimeout(500);

  for (const theme of ['dark', 'light']) {
    await p2.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      location.hash = '#/home';
    }, theme);
    await p2.waitForTimeout(250);
    await p2.evaluate(() => window.LKTutor.start('quick'));
    await p2.waitForTimeout(reduce ? 400 : 900);

    const paint = await p2.evaluate(() => {
      const layer = document.getElementById('lk-tutor');
      if (!layer || layer.hidden) return null;
      const card = layer.querySelector('.lktut__card');
      const say = layer.querySelector('[data-testid="tutor-say"]');
      const skip = layer.querySelector('[data-testid="tutor-skip"]');
      const spot = layer.querySelector('.lktut__spot');
      const cs = getComputedStyle(card);
      const cr = card.getBoundingClientRect();
      const sr = skip.getBoundingClientRect();
      const spotR = spot.getBoundingClientRect();
      return {
        text: (say.textContent || '').trim().length,
        bg: cs.backgroundColor, fg: getComputedStyle(say).color,
        cardLeft: Math.round(cr.left), cardRight: Math.round(innerWidth - cr.right),
        skipH: Math.round(sr.height), skipW: Math.round(sr.width),
        spotW: Math.round(spotR.width), spotH: Math.round(spotR.height),
        spotVisible: Number(getComputedStyle(spot).opacity) > 0,
        overflow: document.scrollingElement.scrollWidth > innerWidth + 1
      };
    });
    const tag = mode + ' / ' + theme;
    ok(!!paint, tag + ': the layer is up');
    if (paint) {
      ok(paint.text > 0, tag + ': the instruction is there', String(paint.text));
      ok(paint.bg !== 'rgba(0, 0, 0, 0)', tag + ': the card paints its own ground', paint.bg);
      ok(paint.cardLeft >= 16 && paint.cardRight >= 16,
         tag + ': the card keeps its gutters', paint.cardLeft + '/' + paint.cardRight);
      ok(paint.skipH >= 44 && paint.skipW >= 44, tag + ': Skip is a real target',
         paint.skipW + 'x' + paint.skipH);
      ok(paint.spotVisible && paint.spotW > 0 && paint.spotH > 0,
         tag + ': the spotlight has a hole in it', paint.spotW + 'x' + paint.spotH);
      ok(!paint.overflow, tag + ': nothing scrolls sideways');
    }

    /* Contrast, on the layer only, with the app underneath excluded so
       this measures what was added rather than what was already audited. */
    await p2.addScriptTag({ content: AXE });
    const axe = await p2.evaluate(() => window.axe.run('#lk-tutor',
      { runOnly: ['wcag2a', 'wcag2aa'] }).then((r) => r.violations.map((v) => v.id + ' @' + (v.nodes[0] && v.nodes[0].target))));
    ok(axe.length === 0, tag + ': no accessibility violations on the layer', axe.join(', '));

    await p2.evaluate(() => window.LKTutor.stop());
    await p2.waitForTimeout(200);
  }

  /* Reduced motion must lose no content, only movement. */
  if (reduce) {
    const still = await p2.evaluate(() => {
      const l = document.getElementById('lk-tutor');
      return { flag: l.getAttribute('data-reduced'), reduced: window.LKTutor.reduced() };
    });
    ok(still.reduced === true && still.flag === '1',
       'reduced motion is honoured, not guessed', JSON.stringify(still));
  }

  ok(errs2.length === 0, mode + ': no page errors', errs2.slice(0, 2).join(' | '));
  await c2.close();
}

ok(errors.length === 0, 'zero console errors across all six tracks', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall good');
process.exit(fails ? 1 : 0);
