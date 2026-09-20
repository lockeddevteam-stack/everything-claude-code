/* LEFT AND RIGHT ON ONE ROW.

   An exercise tracked per side used to be drawn as two rows -- 1L and 1R --
   each with its own weight, its own reps and its own reps-in-reserve. The
   owner asked for the shape the shipped app had: ONE row, both sides beside
   each other, sharing the weight and the RIR. He was asked about losing a
   per-arm RIR and said he prefers it that way, so there is no second RIR
   control here and there is not meant to be one.

   THE STORED SET, BEFORE:  two objects per set, the second carrying
                            side: 'R'.
   THE STORED SET, AFTER:   one object per set, { kg, reps, repsR, rir },
                            `reps` the left arm and `repsR` the right.

   NOTHING STORED WAS REWRITTEN. Sessions already in lk_history keep the two
   rows they were banked with and every screen that reads history still
   draws them as 1L and 1R. The one place the shape changes is a LIVE
   session resumed off a phone mid-workout, because it is about to be edited
   on a screen that now draws one row -- and that fold keeps every figure
   either row was carrying, including a weight or an RIR the right-hand row
   had of its own.

   What this suite is for: the layout is the thing the owner can see, and
   the numbers are the thing he cannot. Both are pinned. */
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

const TYPES = { '.html': 'text/html', '.js': 'text/javascript',
                '.css': 'text/css', '.json': 'application/json',
                '.svg': 'image/svg+xml' };
const site = http.createServer(async (q, r) => {
  const p = new URL(q.url, 'http://x').pathname;
  if (p === '/sw.js') { r.writeHead(404); r.end(''); return; }
  try {
    const f = path.join(ROOT, '08-build', p === '/' ? 'workout-log.html' : p);
    const body = await readFile(f);
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'text/plain' });
    r.end(body);
  } catch (e) { r.writeHead(404); r.end(''); }
});
await new Promise((r) => site.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + site.address().port + '/';

const br = await chromium.launch();
const errs = [];

async function open(screen, seed) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 },
    isMobile: true, hasTouch: true });
  await ctx.addInitScript((s) => {
    try {
      localStorage.setItem('lk_onboarded', 'true');
      localStorage.setItem('lk_tutorialSeen', 'true');
      Object.keys(s || {}).forEach(function (k) {
        localStorage.setItem(k, typeof s[k] === 'string' ? s[k] : JSON.stringify(s[k]));
      });
    } catch (e) {}
  }, seed || {});
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(screen + ': ' + e.message));
  await page.goto(base + screen);
  await page.waitForTimeout(900);
  return { ctx, page };
}

/* =====================================================================
   1. THE ROW ITSELF.
   ===================================================================== */
{
  const { ctx, page } = await open('workout-log.html');

  /* The sheet opens on a press and hold; a keyboard has no hold and Enter
     opens it outright, which is the cheap way in from a test. */
  await page.evaluate(() => document.querySelector('[data-testid="exercise-menu-0"]').focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const row = await page.$('[data-testid="exact-unilateral"]');
  ok(!!row, 'the exercise sheet offers left and right');
  await row.click();
  await page.waitForTimeout(400);

  const grid = await page.evaluate(() => {
    const g = document.querySelector('[data-testid="exercise-card-0"] .setgrid');
    const wrap = g.parentElement;
    return {
      heads: [...g.querySelectorAll('.setgrid__head')].map((h) => h.textContent),
      cells: [...g.querySelectorAll('[data-testid="cell-0-1-weight"], [data-testid="cell-0-1-reps"], [data-testid="cell-0-1-repsR"]')]
        .map((c) => c.getAttribute('data-field')),
      rirs: g.querySelectorAll('[data-testid^="rir-0-"]').length,
      sets: document.querySelectorAll('[data-testid^="set-kind-0-"]').length,
      overflow: wrap.scrollWidth - wrap.clientWidth,
      order: [...g.children].map((c) => c.getAttribute('data-field') ||
        (c.classList.contains('setgrid__head') ? 'head:' + c.textContent : c.className.split(' ')[0])).slice(0, 12)
    };
  });

  ok(grid.heads.join(',') === '#,KG,L,R,RIR,',
     'the set reads # / weight / L / R / RIR, the way the shipped app drew it',
     grid.heads.join(','));
  ok(grid.cells.join(',') === 'weight,reps,repsR',
     'one weight and two rep cells on the row, in that order',
     grid.cells.join(','));

  /* ONE RIR FOR THE SET. The owner was told this is what the single row
     costs and said he prefers it. A second RIR control appearing here is
     somebody re-litigating a decision that was made. */
  ok(grid.rirs === grid.sets,
     'one reps-in-reserve for the set, not one per arm',
     grid.rirs + ' controls for ' + grid.sets + ' sets');

  /* A TABLE OF NUMBERS THAT SCROLLS SIDEWAYS IS NOT A TABLE. Six columns
     have to fit the card at 393px or the comparison the grid exists to
     make is behind a swipe. */
  ok(grid.overflow <= 0, 'and it fits the card without scrolling sideways',
     grid.overflow + 'px over');

  /* The pad has to say which arm it is taking. Two identical rep cells and
     a pad that says only "Reps" is a pad you type the wrong arm into. */
  await page.click('[data-testid="cell-0-1-repsR"]');
  await page.waitForTimeout(250);
  const padWhat = await page.evaluate(() => document.querySelector('.padsheet__what').textContent);
  ok(/Right reps/.test(padWhat), 'the keypad says which side it is taking', padWhat);
  await page.click('[data-testid="pad-9"]');
  await page.click('[data-testid="pad-done"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="cell-0-1-reps"]');
  await page.waitForTimeout(250);
  const padLeft = await page.evaluate(() => document.querySelector('.padsheet__what').textContent);
  ok(/Left reps/.test(padLeft), 'and the other cell says the other side', padLeft);
  await page.click('[data-testid="pad-cancel"]');
  await page.waitForTimeout(200);

  /* THE STORED SHAPE. One object per set, no `side` anywhere. */
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lk_liveSessionRows')).exercises[0].sets);
  ok(stored.length === 4 && stored.every((s) => s.side === undefined),
     'a set is one stored row again, with no side on it',
     stored.length + ' rows');
  ok(stored[1].reps === 8 && stored[1].repsR === 9,
     'carrying both arms: reps is the left, repsR the right',
     JSON.stringify({ reps: stored[1].reps, repsR: stored[1].repsR }));

  /* BOTH ARMS ARE WORK. Three sets stay three sets -- that was already
     true and must stay true -- but the volume is both sides added up. */
  const head = await page.evaluate(() => document.querySelector('[data-testid="log-sub"], .hdr__sub, #hdr').textContent);
  ok(/working sets/.test(head), 'the header still counts sets, not sides', head.trim().slice(0, 60));

  /* Turning it off says what it costs and then does it. */
  await page.evaluate(() => document.querySelector('[data-testid="exercise-menu-0"]').focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.click('[data-testid="exact-unilateral"]');
  await page.waitForTimeout(400);
  const back = await page.evaluate(() => ({
    heads: [...document.querySelectorAll('[data-testid="exercise-card-0"] .setgrid__head')].map((h) => h.textContent),
    sets: JSON.parse(localStorage.getItem('lk_liveSessionRows')).exercises[0].sets
  }));
  ok(back.heads.join(',') === '#,KG,Reps,RIR,',
     'turning it off puts the one reps column back', back.heads.join(','));
  ok(back.sets.length === 4 && back.sets.every((s) => s.repsR === undefined),
     'and the right-hand figures go, which the toast says out loud',
     back.sets.length + ' rows');
  await ctx.close();
}

/* =====================================================================
   2. A SESSION ALREADY RUNNING ON A PHONE, IN THE OLD TWO-ROW SHAPE.

   This is the only stored thing that changes shape, and it must not lose
   a figure doing it -- including the case the old screen allowed and
   nobody expected: a right-hand row edited to its own weight and its own
   RIR.
   ===================================================================== */
{
  const startedAt = Date.now() - 600000;
  const oldShape = {
    lk_liveSession: { name: 'Old Session', startedAt, done: 2, total: 3, updatedAt: Date.now() },
    lk_liveSessionRows: {
      startedAt, name: 'Old Session', state: 'mid-session', blocks: [],
      exercises: [{
        id: 302, name: 'DB Shoulder Press', muscle: 'Front Delt', note: '', unilateral: true,
        sets: [
          { kg: 20, reps: 10, rir: 2, done: true, warm: false, partials: 0, side: 'L' },
          { kg: 20, reps: 9,  rir: 2, done: true, warm: false, partials: 0, side: 'R' },
          /* The awkward one: the right arm on a different dumbbell, with a
             different RIR. The two-row screen allowed it. */
          { kg: 22.5, reps: 8, rir: 1, done: true, warm: false, partials: 0, side: 'L' },
          { kg: 20,   reps: 6, rir: 3, done: true, warm: false, partials: 0, side: 'R' }
        ]
      }]
    }
  };
  const { ctx, page } = await open('workout-log.html', oldShape);

  const read = await page.evaluate(() => ({
    heads: [...document.querySelectorAll('[data-testid="exercise-card-0"] .setgrid__head')].map((h) => h.textContent),
    rows: document.querySelectorAll('[data-testid^="set-kind-0-"]').length,
    cells: [...document.querySelectorAll('[data-testid^="cell-0-"]')].map((c) => c.getAttribute('data-testid') + '=' + c.textContent.trim()),
    sets: JSON.parse(localStorage.getItem('lk_liveSessionRows')).exercises[0].sets
  }));

  ok(read.rows === 2, 'four per-side rows come back as the two sets they were',
     read.rows + ' rows');
  ok(read.heads.join(',') === '#,KG,L,R,RIR,',
     'drawn in the new layout', read.heads.join(','));
  ok(read.sets[0].reps === 10 && read.sets[0].repsR === 9,
     'the first set keeps both arms', JSON.stringify(read.sets[0]));
  /* NO FIGURE IS DISCARDED. The second set's right arm was on 20 kg at 3
     RIR while the left was on 22.5 at 1. The screen shows one weight and
     one RIR, as asked; the two the right arm had are kept on the set so
     the volume stays the number it was and nothing anybody logged is gone. */
  ok(read.sets[1].reps === 8 && read.sets[1].repsR === 6,
     'and so does the second', JSON.stringify(read.sets[1]));
  ok(read.sets[1].kgR === 20 && read.sets[1].rirR === 3,
     'a right arm that was on its own weight and its own RIR keeps both',
     JSON.stringify({ kgR: read.sets[1].kgR, rirR: read.sets[1].rirR }));

  /* The volume before the fold was 20x10 + 20x9 + 22.5x8 + 20x6 = 680.
     It has to still be 680. */
  const vol = await page.evaluate(() => {
    const el = document.getElementById('hdr');
    const m = el.textContent.match(/([\d,.]+)\s*kg/);
    return m ? Number(m[1].replace(/,/g, '')) : null;
  });
  ok(vol === 680, 'and the session still adds up to what it did before the fold',
     vol + ' kg, expected 680');
  await ctx.close();
}

/* =====================================================================
   3. HISTORY. Nothing banked was rewritten, so both shapes have to read.
   ===================================================================== */
{
  const hist = [
    { id: 'w_new', kind: 'lift', name: 'One Row', date: '2026-09-08', min: 40, sets: 2, kg: 380,
      exercises: [{ id: 302, name: 'DB Shoulder Press', muscle: 'Front Delt', sets: [
        { kg: 20, reps: 10, repsR: 9, rir: 2, warm: false, done: true },
        { kg: 20, reps: 9, repsR: 9, rir: 2, warm: false, done: true }
      ] }] },
    { id: 'w_old', kind: 'lift', name: 'Two Rows', date: '2026-09-07', min: 40, sets: 1, kg: 380,
      exercises: [{ id: 302, name: 'DB Shoulder Press', muscle: 'Front Delt', sets: [
        { kg: 20, reps: 10, rir: 2, warm: false, done: true, side: 'L' },
        { kg: 20, reps: 9, rir: 2, warm: false, done: true, side: 'R' }
      ] }] }
  ];

  {
    const { ctx, page } = await open('workout-detail.html',
      { lk_history: hist, lk_openWorkout: 'w_new' });
    const seen = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid^="dset-"]')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
    ok(seen.length === 2, 'a session banked on one row per set shows one row per set',
       seen.length + ' rows');
    ok(seen[0] && /10\s*│\s*9 reps/.test(seen[0]) && /L\/R/.test(seen[0]),
       'with both arms on it and a label that says so', seen[0]);
    const kg = await page.evaluate(() => {
      const m = document.body.textContent.match(/([\d,.]+)\s*kg/);
      return m ? Number(m[1].replace(/,/g, '')) : null;
    });
    /* 20x10 + 20x9 for the first set, 20x9 + 20x9 for the second. Two
       sets, four arms, 740 kg -- the same figure the two-row shape would
       have added up to. */
    ok(kg === 740, 'and its volume counts both arms', kg + ' kg, expected 740');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('workout-detail.html',
      { lk_history: hist, lk_openWorkout: 'w_old' });
    const seen = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid^="dset-"]')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
    ok(seen.length === 2 && /1L/.test(seen[0]) && /1R/.test(seen[1]),
       'a session banked in the two-row shape still reads as 1L and 1R',
       seen.join(' / '));
    const kg = await page.evaluate(() => {
      const m = document.body.textContent.match(/([\d,.]+)\s*kg/);
      return m ? Number(m[1].replace(/,/g, '')) : null;
    });
    ok(kg === 380, 'and its volume is unchanged by any of this', kg + ' kg, expected 380');
    await ctx.close();
  }
}

/* =====================================================================
   4. REVIEW, which is the screen between the last set and history.
   ===================================================================== */
{
  const { ctx, page } = await open('review.html', {
    lk_lastSession: {
      title: 'One Row', type: 'quick', dateISO: '2026-09-09', sets: 2, warmups: 0,
      volumeKg: 740, minutes: 40, note: '',
      /* handed() wants at least one lift or it decides nothing was handed
         over and falls back to the screen's own demo session. */
      lifts: [{ id: 302, name: 'DB Shoulder Press', sets: 2, vol: 740, top: [20, 10] }],
      exercises: [{ id: 302, name: 'DB Shoulder Press', muscle: 'Front Delt', sets: [
        { kg: 20, reps: 10, repsR: 9, rir: 2, warm: false, done: true },
        { kg: 20, reps: 9, repsR: 9, rir: 2, warm: false, done: true }
      ] }]
    }
  });
  const lines = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid^="rset-"]')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
  ok(lines.length === 2, 'Review lists one line per set, not one per arm', lines.length + ' lines');
  ok(lines[0] && /│\s*9/.test(lines[0]) && /L\/R/.test(lines[0]),
     'with the two arms on the line', lines[0]);
  await ctx.close();
}

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
