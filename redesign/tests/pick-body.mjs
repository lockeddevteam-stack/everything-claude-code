/* THE PICKER OPENS ON A BODY, AND THE BODY STAYS.

   Two changes, one idea. The exercise library was a Reference row on
   Train, which invites browsing 867 exercises with no session to put any
   of them in. It is a picker, so it opens where a lift has somewhere to
   go: Quick workout, the split builder, the session.

   And inside that picker the figure used to leave at the moment it
   became useful. Choosing Chest swapped the body for ninety-eight rows,
   which is the screen throwing away the thing that made it worth
   tapping. It stays now, framed on the muscle, divided into its parts,
   with the chosen part lit and the rest stepped back -- so the figure and
   the list never disagree about what is being looked at. */
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(path.join(ROOT, 'tests/node_modules/playwright/index.mjs'));

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('file://' + ROOT + '/10-final/locked-demo.html');
await page.waitForFunction(() => window.DEMO && Object.keys(window.DEMO.screens).length > 0);
await page.evaluate(() => {
  localStorage.setItem('lk_onboarded', 'true');
  localStorage.setItem('lk_tutorialSeen', 'true');
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKBodyMap);

/* ---- 1. Train is not a catalogue ---------------------------------- */
await page.evaluate(() => { location.hash = '#/train'; });
await page.waitForTimeout(700);
const train = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-train').shadowRoot;
  return { row: !!r.querySelector('[data-testid="open-library"]'),
           section: !!r.querySelector('[data-testid="section-library"]'),
           quick: !!r.querySelector('[data-testid="quick-workout"]') };
});
ok(!train.row && !train.section, 'Train no longer carries the library as a destination');
ok(train.quick, 'and the way to a lift is still one tap from Train');

/* The handler stays, so an older entry point or a deep link still lands.
   Asserted against the built file, because that is where the claim
   lives: the route exists in the shipped code even though no row on the
   screen points at it any more. */
const built = await readFile(path.join(ROOT, '10-final', 'locked-app.html'), 'utf8');
ok(built.indexOf("a === 'open-library'") > -1,
   'the open-library route is still wired for anything that calls it');

/* ---- 2. the picker opens on the body ------------------------------ */
const R = 'demo-screen-split-builder';
await page.evaluate(() => { localStorage.setItem('lk_openSplit', '__new__'); location.hash = '#/split-builder'; });
await page.waitForTimeout(800);
await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  const nm = r.querySelector('[data-testid="split-name"]');
  if (nm) { nm.value = 'PPL'; nm.dispatchEvent(new Event('input', { bubbles: true })); }
  const day = r.querySelector('[data-testid="add-day-empty"], [data-action="add-day"]');
  if (day) day.click();
}, R);
await page.waitForTimeout(500);
await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  r.querySelector('[data-action="add-exercise"]').click();
}, R);
await page.waitForTimeout(600);
const opened = await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  return { fig: !!r.querySelector('.map__svg'), map: !!r.querySelector('[data-testid="pick-map"]') };
}, R);
ok(opened.fig && opened.map, 'Add exercise opens on the body', JSON.stringify(opened));

/* ---- 3. choosing a muscle keeps it, frames it and divides it ------ */
await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  r.querySelector('.map__svg [data-g="chest"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, R);
await page.waitForTimeout(700);
const chosen = await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  const svg = r.querySelector('.map__svg');
  return {
    fig: !!svg,
    cam: svg ? Number(svg.style.getPropertyValue('--cam-s') || 1) : 0,
    parts: [...r.querySelectorAll('.part')].map((p) => p.getAttribute('data-part')),
    labels: [...r.querySelectorAll('.part__label')].map((t) => t.textContent),
    crumb: (r.querySelector('[data-testid="pick-crumb"]') || {}).textContent || ''
  };
}, R);
ok(chosen.fig, 'the body does not leave when a muscle is chosen');
ok(chosen.cam > 1.5, 'it frames the muscle instead', 'scale ' + chosen.cam);
ok(chosen.parts.join(',') === 'Upper,Mid,Lower', 'and divides it', chosen.parts.join(','));
ok(chosen.labels.join(',') === 'Upper,Mid,Lower', 'with each part named', chosen.labels.join(','));
ok(/Chest/.test(chosen.crumb), 'the crumb says where you are', chosen.crumb.trim());

/* ---- 4. a part narrows the list AND lights the body --------------- */
const whole = await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  return [...r.querySelectorAll('[data-action="pick-add"]')].map((e) => e.getAttribute('data-muscle'));
}, R);
ok(new Set(whole).size > 1, 'the whole muscle lists all of its parts', [...new Set(whole)].join(' | '));

await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  r.querySelector('.part[data-part="Upper"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, R);
await page.waitForTimeout(700);
const part = await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  const svg = r.querySelector('.map__svg');
  const rows = [...r.querySelectorAll('[data-action="pick-add"]')].map((e) => e.getAttribute('data-muscle'));
  const lit = [...r.querySelectorAll('.part')].filter((p) => p.hasAttribute('data-on'))
    .map((p) => p.getAttribute('data-part'));
  return { muscles: [...new Set(rows)], n: rows.length, lit: lit,
           flag: svg.getAttribute('data-part-on'),
           crumb: (r.querySelector('[data-testid="pick-crumb"]') || {}).textContent || '' };
}, R);
ok(part.muscles.length === 1 && /upper/i.test(part.muscles[0]),
   'picking a part gives that part and nothing else', part.muscles.join(' | '));
ok(part.n > 0, 'and there are exercises under it', String(part.n));
ok(part.lit.join(',') === 'Upper' && part.flag === 'Upper',
   'the body lights the part that was picked', JSON.stringify(part));
ok(/Upper/.test(part.crumb) && /Chest/.test(part.crumb),
   'and the crumb carries the whole path', part.crumb.trim());

/* ---- 5. out of the part without leaving the muscle ---------------- */
await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  r.querySelector('[data-testid="pick-back"]').click();
}, R);
await page.waitForTimeout(600);
const backOut = await page.evaluate((R) => {
  const r = document.getElementById(R).shadowRoot;
  const svg = r.querySelector('.map__svg');
  return { fig: !!svg, parts: r.querySelectorAll('.part').length,
           flag: svg ? svg.getAttribute('data-part-on') : 'gone',
           muscles: [...new Set([...r.querySelectorAll('[data-action="pick-add"]')]
             .map((e) => e.getAttribute('data-muscle')))].length };
}, R);
ok(backOut.fig && backOut.parts === 3 && !backOut.flag,
   'backing out of a part returns to the whole muscle, still divided', JSON.stringify(backOut));
ok(backOut.muscles > 1, 'with the whole muscle listed again', String(backOut.muscles));

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
console.log(fails === 0 ? 'pick-body: all ' + checks + ' checks passed' : 'pick-body: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
