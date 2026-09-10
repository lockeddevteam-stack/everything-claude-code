/* A workout is not lost by leaving the screen it is logged on.
 *
 * This is the check the build did not have. The shelf existed on Home and
 * Fuel as hand-written markup gated on a dev state: it always said "Push A,
 * 4 of 7, 38:12" whether or not anything was running, nothing anywhere wrote
 * a session down, and every other screen had no idea a workout was open. So
 * every existing test passed while leaving the workout log lost the session.
 *
 * What is asserted here is the behaviour, not the markup:
 *   1. Logging a set writes a record that outlives the page.
 *   2. Every screen you can reach mid-workout shows the session and names it.
 *   3. The shelf goes back to the workout log.
 *   4. Finishing and discarding both end it, so it stops following you.
 *   5. The clock is derived from the start time, so it survives a reload
 *      rather than restarting or freezing.
 *   6. A session left for hours stops claiming to be live.
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const url = (f) => pathToFileURL(path.join(BUILD, f)).href;

/* Every screen that carries the shelf, which is every screen you can reach
   mid-workout: not the workout log, which is the session, and not
   onboarding, where there is no workout to be in the middle of. */
const SCREENS = ['home', 'train', 'fuel', 'coach', 'profile', 'progress',
                 'exercise-library', 'shopping', 'cycle', 'settings',
                 'split-builder', 'workout-detail', 'review'];

let fails = 0;
const ok = (cond, what, extra = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${what}${extra ? '  ' + extra : ''}`);
};

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 393, height: 852 } });
const p = await ctx.newPage();

/* ---- 1. the workout log writes the record ---- */
await p.goto(url('workout-log.html'));
await p.waitForTimeout(600);
const started = await p.evaluate(() => {
  const r = window.LKSession && LKSession.get();
  return r ? { name: r.name, total: r.total, elapsed: r.elapsedText } : null;
});
ok(!!started, 'opening a session writes a record that outlives the page',
  started ? `${started.name}, ${started.total} exercises, ${started.elapsed}` : 'nothing written');

/* The elapsed already on screen is carried in, not restarted at zero. */
ok(started && started.elapsed !== '0:00' && started.elapsed !== '0:01',
  'the record carries the elapsed time already on screen', started?.elapsed);

/* ---- 2. every screen shows it ---- */
for (const id of SCREENS) {
  await p.goto(url(id + '.html'));
  await p.waitForTimeout(500);
  const shelf = await p.evaluate(() => {
    const el = document.querySelector('[data-testid="shelf-resume"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { text: el.textContent.replace(/\s+/g, ' ').trim(), w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok(shelf && shelf.w > 200 && shelf.h >= 44 && /Push|PPL/.test(shelf.text),
    `${id} — shows the running session`, shelf ? shelf.text : 'no shelf at all');
}

/* ---- 3. the shelf goes back ---- */
await p.goto(url('coach.html'));
await p.waitForTimeout(500);
await p.locator('[data-testid="shelf-resume"]').click();
await p.waitForTimeout(700);
ok(/workout-log\.html/.test(p.url()), 'the shelf returns to the workout log', p.url().split('/').pop());

/* ---- 5. the clock is derived, so a reload does not restart it ---- */
const before = await p.evaluate(() => LKSession.get().elapsed);
await p.waitForTimeout(1500);
await p.reload();
await p.waitForTimeout(400);
const after = await p.evaluate(() => LKSession.get().elapsed);
ok(after > before, 'the clock keeps running across a reload rather than restarting',
  `${Math.round(before / 1000)}s then ${Math.round(after / 1000)}s`);

/* ---- 6. a session left for hours stops claiming to be live ---- */
const stale = await p.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('lk_liveSession'));
  raw.updatedAt = Date.now() - 5 * 60 * 60 * 1000;
  localStorage.setItem('lk_liveSession', JSON.stringify(raw));
  const r = LKSession.get();
  return { stale: r.stale, idle: r.idleText, html: LKSession.html() };
});
ok(stale.stale && /Left /.test(stale.html) && !/shelf__live/.test(stale.html),
  'a session left for hours reads as left, not as live', stale.idle);

/* ---- 4. finishing ends it ---- */
await p.goto(url('workout-log.html'));
await p.waitForTimeout(600);
await p.evaluate(() => { if (window.LKSession) LKSession.end(); });
await p.goto(url('profile.html'));
await p.waitForTimeout(500);
const gone = await p.evaluate(() => !document.querySelector('[data-testid="shelf-resume"]'));
ok(gone, 'with no session running, no screen shows a shelf');

/* Discard ends it too, through the real control rather than the API. */
await p.goto(url('workout-log.html'));
await p.waitForTimeout(600);
await p.evaluate(() => document.querySelector('[data-testid="btn-discard"]')?.click());
await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('[data-testid="discard-confirm"]')?.click());
await p.waitForTimeout(400);
const afterDiscard = await p.evaluate(() => (window.LKSession ? LKSession.get() : 'no module'));
ok(afterDiscard === null, 'discarding ends the session', JSON.stringify(afterDiscard));

await br.close();
console.log(fails ? `\n${fails} failing` : '\na workout survives every screen it can be left for');
process.exit(fails ? 1 : 0);
