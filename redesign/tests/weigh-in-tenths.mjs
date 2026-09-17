/* THE TENTH THAT WENT MISSING.

   Type 124.4 into the weigh-in and the card came back 124.3.

   The field steps in tenths of a POUND. The store holds KILOGRAMS, and
   the save rounded those kilograms to a tenth -- a step 2.2 times
   coarser than the one the field accepts. 124.4 lb is 56.42723 kg,
   rounded to 56.4, printed again as 124.3. Every weigh-in was being put
   through a sieve with holes bigger than the thing being measured.

   The rounding belongs on the way out, where the number is printed, not
   on the way in, where it is the record. So this checks the whole
   pounds range a tenth at a time, and drives the real weigh-in on the
   real screen for the number that was reported. */
import path from 'node:path';
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

async function inPounds(lb) {
  await page.evaluate((lb) => {
    localStorage.setItem('lk_onboarded', 'true');
    localStorage.setItem('lk_tutorialSeen', 'true');
    localStorage.setItem('lk_profile', JSON.stringify(
      { name: 'Ada', useKg: false, age: 29, sex: 'female', heightCm: 168, weightKg: 60, goal: 'build' }));
    localStorage.removeItem('lk_weightLog');
  }, lb);
  await page.reload();
  await page.waitForFunction(() => window.DEMO && window.LKUnits);
}

/* ---- 1. every tenth of a pound the field accepts ------------------ */
await inPounds();
const sweep = await page.evaluate(() => {
  const bad = [];
  for (let x = 450; x <= 8800; x++) {
    const lb = x / 10;
    const back = window.LKUnits.v(window.LKUnits.toKg(lb));
    if (back !== lb) bad.push([lb, back]);
  }
  return bad;
});
ok(sweep.length === 0, 'every tenth from 45.0 to 880.0 lb comes back as itself',
   sweep.length ? sweep.length + ' lost, first ' + JSON.stringify(sweep[0]) : '');

/* The reported number, named, so a regression says which one broke. */
const one = await page.evaluate(() => window.LKUnits.v(window.LKUnits.toKg(124.4)));
ok(one === 124.4, '124.4 lb is still 124.4 lb', String(one));

/* And the store is not handed a rounded kilogram. */
const stored = await page.evaluate(() => window.LKUnits.toKg(124.4));
/* Not a literal: the constant may be refined again, and a test that
   pins one declares it correct, which is the one thing it cannot know.
   What matters is that the stored figure is NOT on a tenth-of-a-kilogram
   step, because that step is what ate the tenth of a pound. */
ok(Math.round(stored * 10) / 10 !== stored, 'the kilograms keep the precision that was typed', String(stored));

/* ---- 2. kilograms are untouched ----------------------------------- */
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('lk_profile'));
  p.useKg = true;
  localStorage.setItem('lk_profile', JSON.stringify(p));
});
await page.reload();
await page.waitForFunction(() => window.DEMO && window.LKUnits);
const kgSweep = await page.evaluate(() => {
  const bad = [];
  for (let x = 200; x <= 4000; x++) {
    const kg = x / 10;
    if (window.LKUnits.v(window.LKUnits.toKg(kg)) !== kg) bad.push(kg);
  }
  return bad;
});
ok(kgSweep.length === 0, 'and every tenth of a kilogram, which was never the problem',
   kgSweep.length ? String(kgSweep[0]) : '');

/* ---- 3. the real weigh-in, on the real screen ---------------------- */
await inPounds();
await page.evaluate(() => { location.hash = '#/fuel'; });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const r = document.getElementById('demo-screen-fuel').shadowRoot;
  const box = r.querySelector('[data-testid="weight-input"]');
  box.value = '124.4';
  box.dispatchEvent(new Event('input', { bubbles: true }));
  r.querySelector('[data-testid="weigh-in"]').click();
});
await page.waitForTimeout(600);
const shown = await page.evaluate(() => {
  const r = document.getElementById('demo-screen-fuel').shadowRoot;
  return r.textContent || '';
});
ok(/124\.4 lb/.test(shown), 'the card reads back what was typed', /124\.3/.test(shown) ? 'it reads 124.3' : '');
ok(!/124\.3 lb/.test(shown), 'and never a tenth under it');

const logged = await page.evaluate(() => {
  const log = JSON.parse(localStorage.getItem('lk_weightLog') || '[]');
  const last = log[log.length - 1];
  return last ? window.LKUnits.v(last.kg) : null;
});
ok(logged === 124.4, 'and the logged reading converts back to 124.4 lb', String(logged));

ok(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));

await browser.close();
console.log(fails === 0 ? 'weigh-in-tenths: all ' + checks + ' checks passed'
                        : 'weigh-in-tenths: ' + fails + ' FAILED');
process.exit(fails ? 1 : 0);
