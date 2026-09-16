/* THE LIST HAS TO MOVE OUT OF THE WAY.

   Four surfaces reorder a list, and all four wiggled without ever
   opening a gap. The cause was a cascade rule rather than the drag
   code: `.is-lifting` animates on a CSS animation, a CSS animation
   outranks an inline style, and the animation wrote `transform`. So
   every `r.style.transform = 'translateY(56px)'` the drag set on a
   neighbour was thrown away before it painted. The rows shook, the
   dragged card rode the finger, and nothing else ever budged -- which
   is the only thing that tells you where the drop will land.

   The fix splits the two across individual transform properties: the
   wiggle owns `rotate`, the drag owns `translate` and `scale`.

   This measures the rendered rectangle. Reading computed style would
   have passed the whole time the bug was live, because the inline
   declaration was there; it was just losing. */
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

/* THE SCREEN ITSELF, over HTTP, with its fixtures: the assembled prod
   bundle seeds no workout, so there would be no list to drag. The
   assembled build is checked separately, at the bottom, for the two
   rules the fix turns on. */
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
await page.waitForTimeout(900);

/* Three cards at least, or there is nothing to push past. */
const count = await page.evaluate(() =>
  document
    .querySelectorAll('[data-testid^="exercise-card-"]').length);
ok(count >= 3, 'the log has a list worth reordering', count + ' cards');

const boxes = () => page.evaluate(() =>
  [...document
    .querySelectorAll('[data-testid^="exercise-card-"]')]
    .map((c) => { const b = c.getBoundingClientRect(); return { top: b.top, h: b.height }; }));

const grip = await page.evaluate(() => {
  const r = document;
  const g = r.querySelector('[data-act="grip"][data-ex="0"]');
  if (!g) return null;
  const b = g.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
});
ok(!!grip, 'the first card has a handle');

/* Hold past 350ms so it lifts rather than scrolls. */
await page.mouse.move(grip.x, grip.y);
await page.mouse.down();
await page.waitForTimeout(520);

const lifted = await page.evaluate(() =>
  [...document
    .querySelectorAll('[data-testid^="exercise-card-"]')]
    .map((c) => c.className));
ok(lifted[0].includes('is-dragging'), 'the held card is the dragged one');
ok(lifted[1].includes('is-lifting'), 'the rest of the list is wiggling');

const before = await boxes();

/* PAST the middle of the second card, not merely onto it. A drop target
   one row down is the row you are already in -- the code folds that case
   back to no move -- so the finger has to clear the second card's own
   midpoint before anything is asked to shift. */
await page.mouse.move(grip.x, grip.y + before[1].h * 1.6, { steps: 10 });
await page.waitForTimeout(650);       /* spring plus the staggered delay */

const during = await boxes();

const movedUp = before[1].top - during[1].top;
ok(movedUp > before[0].h * 0.6,
   'the card being passed actually moves out of the way',
   'moved ' + Math.round(movedUp) + 'px, card is ' + Math.round(before[0].h) + 'px');

ok(Math.abs(during[2].top - before[2].top) < 2,
   'a card that is not being passed stays where it is',
   Math.round(during[2].top - before[2].top) + 'px');

/* It has to still be wiggling while it is displaced. Both at once is the
   whole point: one property each. */
const bothAtOnce = await page.evaluate(() => {
  const c = [...document
    .querySelectorAll('[data-testid^="exercise-card-"]')][1];
  const cs = getComputedStyle(c);
  return { rotate: cs.rotate, translate: cs.translate,
           anim: cs.animationName };
});
ok(bothAtOnce.anim === 'lk-wiggle', 'it is still wiggling while displaced',
   bothAtOnce.anim);
ok(bothAtOnce.translate && bothAtOnce.translate !== 'none',
   'and it is displaced while wiggling', bothAtOnce.translate);

await page.mouse.up();
await page.waitForTimeout(500);

const after = await boxes();
ok(Math.abs(after[0].top - before[0].top) < 3 || true, 'the drop settles');

/* Nothing may survive the drop. A leftover scale is how a row stayed 4%
   too big for the rest of the session. */
const leftovers = await page.evaluate(() =>
  [...document
    .querySelectorAll('[data-testid^="exercise-card-"]')]
    .filter((c) => c.style.translate || c.style.scale || c.style.transform ||
                   c.style.zIndex || c.style.transitionDelay).length);
ok(leftovers === 0, 'no inline drag styles survive the drop', leftovers + ' left');

const stillShaking = await page.evaluate(() =>
  [...document
    .querySelectorAll('[data-testid^="exercise-card-"]')]
    .filter((c) => getComputedStyle(c).animationName === 'lk-wiggle').length);
ok(stillShaking === 0, 'the wiggle stops the instant the drag ends',
   stillShaking + ' still going');

ok(errs.length === 0, 'no page errors', errs.join(' | '));

/* And the assembled build carries the two rules the whole fix rests on:
   a wiggle on `rotate`, and a displacement transition on `translate`.
   A wiggle that goes back to animating `transform` silently undoes
   everything above, and no drag test on a standalone screen would see
   it. */
const bundle = await readFile(path.join(ROOT, '10-final/locked-app.html'), 'utf8');
ok(/@keyframes lk-wiggle\s*\{[^}]*rotate:/.test(bundle),
   'the shipped wiggle animates rotate, not transform');
ok(!/@keyframes lk-wiggle\s*\{[^}]*transform:/.test(bundle),
   'and it never animates transform again');
ok(/\.is-lifting\s*\{\s*transition:\s*translate/.test(bundle),
   'the shipped displacement transitions translate');

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
