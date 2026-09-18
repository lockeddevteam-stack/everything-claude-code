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
   declaration was there; it was just losing.

   EVERYTHING BELOW THE FIRST SECTION IS v6's, AND MEASURED.

   The owner's complaint about the rebuild was that the drag stopped
   feeling like anything: v6's numbers were all still written down
   somewhere and almost none of them survived. They were taken back off
   the shipped v6 build driven in a browser -- a real drag, transforms
   sampled frame by frame -- rather than read out of its source, because
   several of the constants in that source are overridden before they
   reach the screen. What is pinned here is what v6 DID, not what it
   said.

   These are the ones that matter in the hand:

     one slot            row height + the gap, not the row height
     gap curve           300ms cubic-bezier(0.2,0.7,0.3,1), no overshoot
     per-row delay       none
     lift scale          1.03
     drop                spring, response 0.35, damping 1, seeded with
                         the finger's speed; visible for ~500ms
     haptics             20 lift, 10 per swap, 8 on the drop
     edge creep          100px zone, 2px/frame at its inside edge

   If one of these lines starts failing, somebody has changed the feel.
   That may be deliberate; it should not be silent. */
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
  /* Every buzz the drag asks for, in order. There is no other way to see
     these: vibrate() does nothing in a headless browser and reports
     nothing back. */
  window.__buzz = [];
  try { navigator.vibrate = function (p) { window.__buzz.push(p); return true; }; } catch (e) {}
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

/* ONE SLOT IS NOT ONE CARD. v6 moved a neighbour by the card's height
   PLUS the gap between cards; this moved it by the height alone, so
   every gap opened about eleven pixels short and the cards overlapped
   where the lifted one had been. The pitch is measured off the list
   itself, so it stays true if the spacing token changes. */
const slot = before.length > 1 ? before[1].top - before[0].top : before[0].h;
ok(Math.abs(movedUp - slot) < 2.5,
   'it moves exactly one slot, gap included',
   'moved ' + movedUp.toFixed(1) + 'px, a slot is ' + slot.toFixed(1) +
   'px, the card alone is ' + before[0].h.toFixed(1) + 'px');

/* NO PER-ROW DELAY. Staggering the neighbours means the gap you are
   aiming at is still moving when you let go. v6 moved them all at once. */
const staggered = await page.evaluate(() =>
  [...document.querySelectorAll('[data-testid^="exercise-card-"]')]
    .filter((c) => c.style.transitionDelay && c.style.transitionDelay !== '0s').length);
ok(staggered === 0, 'no card is held back on a delay', staggered + ' delayed');

/* 1.03, which is v6's. 1.04 reads as the card swelling rather than
   rising, and it is the number this had before. */
const liftScale = await page.evaluate(() =>
  document.querySelector('.is-dragging') &&
  document.querySelector('.is-dragging').style.scale);
ok(liftScale === '1.03', 'the lifted card is 3% bigger, v6\'s lift', String(liftScale));

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

/* THE DROP IS A SPRING, NOT A CUT.

   This is the whole of the owner's complaint. v6 let go of the card and
   it flew to its slot on a critically damped spring seeded with the
   speed the finger was going -- about half a second of visible travel
   for a drop of one or two rows -- and the 3% lift bled off with the
   distance so the card shrank back into the list as it landed. The
   rebuild dropped every inline style in a single frame instead, and a
   card that teleports reads as the app having lost it.

   Sampled rather than asserted at one instant: what makes it a spring
   is that it is somewhere different on every frame and it decelerates. */
const flight = [];
await page.mouse.up();
for (let i = 0; i < 26; i++) {
  flight.push(await page.evaluate(() => {
    const c = document.querySelector('[data-testid^="exercise-card-"]');
    return { tr: c.style.translate || '', sc: c.style.scale || '',
             top: c.getBoundingClientRect().top };
  }));
  await page.waitForTimeout(25);
}
const moving = flight.filter((f) => f.tr).length;
ok(moving >= 8, 'the card is still travelling after the finger has gone',
   moving * 25 + 'ms of flight');

const tops = flight.filter((f) => f.tr).map((f) => f.top);
const firstHop = Math.abs(tops[1] - tops[0]);
const lastHop = Math.abs(tops[tops.length - 1] - tops[tops.length - 2]);
ok(firstHop > lastHop, 'and it is slowing down, not sliding at one speed',
   firstHop.toFixed(1) + 'px/frame -> ' + lastHop.toFixed(1) + 'px/frame');

const scales = flight.filter((f) => f.sc).map((f) => Number(f.sc));
ok(scales.length > 2 && scales[0] >= scales[scales.length - 1] &&
   scales[scales.length - 1] < 1.01,
   'the lift bleeds off as it lands rather than being switched off',
   scales[0] + ' -> ' + scales[scales.length - 1]);

/* AND IT DOES NOT OVERSHOOT. Damping 1. A card that bounces past its
   slot and comes back is a card you cannot aim. */
const land = tops[tops.length - 1];
const dir = Math.sign(land - tops[0]) || 1;
const past = Math.max(0, ...tops.map((t) => (t - land) * dir));
ok(past < 1.5, 'and it does not bounce past the slot',
   past.toFixed(1) + 'px beyond where it lands');

await page.waitForTimeout(700);

const after = await boxes();
ok(Math.abs(after[0].top - before[0].top) < 3,
   'the list is back on its own rhythm once it has landed',
   (after[0].top - before[0].top).toFixed(1) + 'px out');

/* v6 ticked 20 on the lift, 10 on each swap and 8 on the drop. The lift
   is 20 and not 30 on purpose: v6 called vibrate(30) and vibrate(20)
   back to back from two different places, and a second vibrate() cancels
   the first, so 20 is what the shipped app's hand actually felt. */
const buzz = await page.evaluate(() => window.__buzz || []);
ok(buzz[0] === 20, 'the lift is one 20ms tick, which is what v6 delivered',
   JSON.stringify(buzz));
ok(buzz[buzz.length - 1] === 8, 'and the drop is a lighter 8', JSON.stringify(buzz));
ok(buzz.slice(1, -1).every((b) => b === 10) && buzz.length >= 3,
   'and every swap in between is a 10, one per swap and never one per frame',
   JSON.stringify(buzz));

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

/* =====================================================================
   A REPAINT MUST NOT TEAR A DRAG.

   v6 cannot tell us anything about this: it had no reconciler and the
   card it dragged was position:fixed, out of the tree. Here the card
   stays in the flow and LKPatch syncs the style attribute like any
   other, so a paint landing mid-drag removes the translate, the scale
   and the z-index the lift wrote -- the card snaps back into its slot
   while the finger is still holding it. The clock on this screen calls
   paint() once a second, so this happened in the middle of most drags.
   ===================================================================== */
{
  const g2 = await page.evaluate(() => {
    const g = document.querySelector('[data-act="grip"][data-ex="0"]');
    const b = g.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });
  await page.mouse.move(g2.x, g2.y);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.move(g2.x, g2.y + 120, { steps: 8 });
  await page.waitForTimeout(250);
  const held = await page.evaluate(() => {
    const c = document.querySelector('.is-dragging');
    return c ? { tr: c.style.translate, sc: c.style.scale, z: c.style.zIndex } : null;
  });
  /* Two seconds is two ticks of the clock. */
  await page.waitForTimeout(2200);
  const still = await page.evaluate(() => {
    const c = document.querySelector('.is-dragging');
    return c ? { tr: c.style.translate, sc: c.style.scale, z: c.style.zIndex } : null;
  });
  ok(!!still && still.z === '20' && still.sc === '1.03' && still.tr === held.tr,
     'a paint landing mid-drag leaves the lifted card exactly where it was',
     JSON.stringify(held) + ' -> ' + JSON.stringify(still));
  await page.mouse.up();
  await page.waitForTimeout(900);
}

/* =====================================================================
   THE LIST CREEPS WHEN YOU CARRY A CARD TO THE EDGE.

   v6 had this and the rebuild had nothing, which means a list longer
   than the screen can only be reordered inside one screenful: the last
   exercise cannot reach the front at all. 100px of trigger zone measured
   in from the edge of the scroller, 150ms of dwell before it engages,
   and 2px a frame at the inside boundary rising with proximity. Measured
   off v6 at both ends: 99px in it creeps, 101px in it does not.
   ===================================================================== */
{
  const short = await br.newContext({ viewport: { width: 393, height: 420 },
    isMobile: true, hasTouch: true });
  await short.addInitScript(() => {
    try { localStorage.setItem('lk_onboarded', 'true');
          localStorage.setItem('lk_tutorialSeen', 'true'); } catch (e) {}
  });
  const sp = await short.newPage();
  await sp.goto('http://127.0.0.1:' + site.address().port + '/');
  await sp.waitForTimeout(900);

  const scrollTop = () => sp.evaluate(() => {
    const b = document.getElementById('body'); return b ? b.scrollTop : -1;
  });
  const g3 = await sp.evaluate(() => {
    const g = document.querySelector('[data-act="grip"][data-ex="0"]');
    const b = g.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });
  const box = await sp.evaluate(() => {
    const b = document.getElementById('body').getBoundingClientRect();
    return { top: b.top, bottom: b.bottom };
  });
  const order0 = await sp.evaluate(() =>
    [...document.querySelectorAll('.exc__name')].map((n) => n.textContent).join('|'));

  await sp.mouse.move(g3.x, g3.y);
  await sp.mouse.down();
  await sp.waitForTimeout(500);

  async function creep(y) {
    await sp.mouse.move(g3.x, y);
    await sp.waitForTimeout(220);                /* past the 150ms dwell */
    const a = await scrollTop();
    await sp.waitForTimeout(500);
    return (await scrollTop()) - a;
  }
  const outside = await creep(box.bottom - 101);
  ok(outside === 0, 'a pixel outside the zone and nothing moves', outside + 'px');
  const inside = await creep(box.bottom - 99);
  /* 2.125px a frame at the inside boundary, which is 60-ish px in half a
     second at 60fps. Generous bounds: a headless browser does not always
     get sixty frames. */
  ok(inside > 25 && inside < 110,
     'a pixel inside it and the list creeps at v6\'s slowest speed',
     inside + 'px in 500ms');

  await sp.mouse.move(g3.x, box.bottom - 10);
  await sp.waitForTimeout(2500);
  await sp.mouse.up();
  await sp.waitForTimeout(1200);
  const order1 = await sp.evaluate(() =>
    [...document.querySelectorAll('.exc__name')].map((n) => n.textContent).join('|'));
  ok(order0.split('|')[0] === order1.split('|').pop(),
     'and a card carried to the bottom edge reaches the end of the list',
     order0.slice(0, 40) + ' -> ' + order1.slice(0, 40));
  await short.close();
}

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
/* AND ON v6's CURVE, not the one the rest of the app enters on.
   --spring-bouncy overshoots by four and a half percent, which is right
   for something arriving and wrong for a gap you are aiming at. */
ok(/--reorder-ease:\s*cubic-bezier\(0\.2,\s*0\.7,\s*0\.3,\s*1\)/.test(bundle),
   'the shipped build defines v6\'s reorder curve');
ok(/\.is-lifting\s*\{\s*transition:\s*translate\s+300ms\s+var\(--reorder-ease\)/.test(bundle),
   'and the gap opens on it, with no bounce');

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
