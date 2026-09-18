/* A DAY IS A PLACE YOU CAN WALK TO.

   Fuel was today and only today. The date under the title was a caption,
   the log was keyed by date and always asked for one, and a meal eaten
   yesterday or meant for tomorrow had nowhere to go. Two arrows and the
   day's own word, above every state, because stepping to another day is
   how you leave the one you are on.

   Ahead of today is a plan rather than a record. Nothing about the day
   changes -- same targets, same ways of adding, same arithmetic -- but
   the screen says so, and everything that reports what somebody HAS
   eaten stops at today: a planned dinner on a chart of intake is a lie
   about what happened. */
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

const site = http.createServer(async (q, r) => {
  if (new URL(q.url, 'http://x').pathname === '/sw.js') { r.writeHead(404); r.end(''); return; }
  r.writeHead(200, { 'content-type': 'text/html' });
  r.end(await readFile(path.join(ROOT, '10-final/locked-app.html')));
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
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await page.goto('http://127.0.0.1:' + site.address().port + '/');
await page.waitForFunction(() => window.DEMO && window.DEMO.screens['fuel'], null, { timeout: 20000 });
await page.evaluate(() => window.LKGo('fuel'));
await page.waitForTimeout(1100);

const F = (fn, arg) => page.evaluate(({ src, arg }) =>
  new Function('r', 'a', 'return (' + src + ')(r, a);')(window.DEMO.screens['fuel'].root, arg),
  { src: fn.toString(), arg });
const tap = async (sel) => {
  const hit = await F((r, s) => { const b = r.querySelector(s); if (!b) return false; b.click(); return true; }, sel);
  await page.waitForTimeout(650);
  return hit;
};
const now = () => F((r) => ({
  word: (r.querySelector('.daynav__word') || { textContent: '' }).textContent.trim(),
  cap: (r.querySelector('.hdr__title .t-meta') || { textContent: '' }).textContent.trim(),
  hero: (r.querySelector('[data-testid="hero-value"]') || { textContent: '' }).textContent.trim(),
  foot: (r.querySelector('[data-testid="hero"] .t-footnote') || { textContent: '' }).textContent.trim()
}));

console.log('=== the day is a control, not a caption ===\n');

ok(await F((r) => !!r.querySelector('[data-testid="daynav"]')), 'the day strip is on the screen');
const t0 = await now();
ok(t0.word === 'Today', 'and it opens on today', t0.word);
ok(await F((r) => r.querySelector('[data-testid="day-label"]').disabled),
   'with the way back to today switched off, because you are there');

await tap('[data-testid="day-next"]');
const t1 = await now();
ok(t1.word === 'Tomorrow', 'forward is tomorrow', t1.word);
ok(t1.cap === 'Planning', 'and the header says what that is', t1.cap);
/* With a target it reads "1,200 kcal planned of 2,980"; without one,
   "kcal planned. No target set yet." Either way the word is planned,
   because nothing has been eaten and "kcal left" would be arithmetic
   about a day that has not happened. */
ok(/planned/.test(t1.foot), 'the hero counts what is planned, not what is left',
   t1.foot.slice(0, 48));

await tap('[data-testid="day-next"]');
const t2 = await now();
ok(!/Tomorrow|Today/.test(t2.word) && /\d/.test(t2.word),
   'two days out is named by its date', t2.word);

await tap('[data-testid="day-label"]');
ok((await now()).word === 'Today', 'and the label is the way back');

await tap('[data-testid="day-prev"]');
const y = await now();
ok(y.word === 'Yesterday', 'back is yesterday', y.word);
ok(!/planned/.test(y.foot), 'which is a record again, not a plan', y.foot.slice(0, 40));

console.log('\n=== a meal planned lands on that day and no other ===\n');

await tap('[data-testid="day-today"], [data-testid="day-label"]');
await tap('[data-testid="day-next"]');
/* A recipe is the one add path that needs nothing from the network. */
await tap('[data-testid="fuel-view-meals"], .seg__item:nth-child(2)');
const opened = await F((r) => {
  const b = r.querySelector('[data-testid^="meals-recipe-"]');
  if (!b) return false;
  b.click();
  return true;
});
await page.waitForTimeout(700);
ok(opened, 'a recipe opens');
await tap('[data-testid="log-recipe"]');
const after = await now();
ok(Number(after.hero.replace(/[^\d]/g, '')) > 0, 'planning it puts it on tomorrow', after.hero);

await tap('[data-testid="day-label"]');
const back = await now();
ok(back.word === 'Today' && Number(back.hero.replace(/[^\d]/g, '')) === 0,
   'and today is untouched by it', back.word + ' ' + back.hero);

await tap('[data-testid="day-next"]');
ok(Number((await now()).hero.replace(/[^\d]/g, '')) > 0,
   'the plan is still there when you come back to it');

/* STORED UNDER ITS OWN DATE. The log has always been keyed by day; what
   changed is that the screen can reach a key that is not today. */
const stored = await page.evaluate(() => {
  const l = JSON.parse(localStorage.getItem('lk_fuelLog') || '{}');
  const today = window.LKStore ? window.LKStore.today() : '';
  return Object.keys(l).filter((k) => ((l[k] || {}).meals || []).length)
    .map((k) => (k > today ? 'ahead' : k === today ? 'today' : 'past'));
});
ok(stored.length === 1 && stored[0] === 'ahead',
   'written under tomorrow, and nothing written under today', JSON.stringify(stored));

console.log('\n=== and a plan is not an intake ===\n');

/* The screen that reads what somebody HAS eaten must not move because
   of a day that has not happened. Today's own figure is the visible end
   of that: it was zero before tomorrow was planned and it is zero
   after. */
await tap('[data-testid="day-label"]');
const todayAfter = await now();
ok(Number(todayAfter.hero.replace(/[^\d]/g, '')) === 0,
   'today still reads nothing eaten', todayAfter.hero);

/* And the copy on a day that is not today does not say today. This
   screen was written when it could only ever show one day, and the word
   was in it a dozen times. */
await tap('[data-testid="day-next"]');
const words = await F((r) => {
  const txt = (sel) => (r.querySelector(sel) || { textContent: '' }).textContent;
  return [txt('[data-testid="hero"]'), txt('[data-testid="suggest-day"]'),
          txt('[data-testid="day-kind"]')].join(' | ');
});
ok(!/\btoday\b/i.test(words), 'nothing on a planned day calls it today', words.slice(0, 120));

ok(errs.length === 0, 'no page errors', errs.join(' | '));

await br.close(); site.close();
console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
