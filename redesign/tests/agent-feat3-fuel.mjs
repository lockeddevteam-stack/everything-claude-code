/* Q4: drive every Fuel control, standalone, one fresh load per control, and
   report what actually changed (day totals, meal rows, water, supp state). */
import { chromium } from '@playwright/test';
const FILE = 'file:///home/user/everything-claude-code/redesign/08-build/fuel.html';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

const snap = () => page.evaluate(() => {
  const t = document.querySelector('[data-testid="hero-value"]');
  const rows = document.querySelectorAll('[data-testid^="meal-"]');
  const water = document.querySelector('[data-testid="water-value"]');
  return {
    hero: t ? t.textContent.trim() : null,
    macros: (document.querySelector('[data-testid="macros"]') || {}).textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) || null,
    meals: document.querySelectorAll('[data-testid^="meal-"]:not([data-testid="meal-close"]):not([data-testid="meal-delete"]):not([data-testid="meal-edit"]):not([data-testid="meal-swap"]):not([data-testid="meal-swap"])').length,
    water: water ? water.textContent.trim() : null,
    len: document.body.innerHTML.length,
    testids: Array.from(document.querySelectorAll('[data-testid]')).map(e => e.getAttribute('data-testid')).join(',')
  };
});

async function fresh(state) {
  await page.goto(FILE + (state ? '?state=' + state : ''));
  await page.waitForTimeout(300);
}

async function click(sel) {
  return page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.click(); return true;
  }, sel);
}

console.log('=== chips & sheets present in populated ===');
await fresh();
const s0 = await snap();
console.log('hero:', s0.hero, '| macros:', s0.macros, '| meals:', s0.meals);
console.log('controls:', await page.evaluate(() => Array.from(document.querySelectorAll('[data-action]')).map(e => e.getAttribute('data-action') + (e.getAttribute('data-testid') ? '#' + e.getAttribute('data-testid') : '')).join('  ')));

/* Each sheet, then its primary action */
const chains = [
  ['voice log', ['[data-testid="log-mic"]', '[data-testid="mic-confirm"]']],
  ['camera log', ['[data-testid="log-cam"]', '[data-testid="cam-a3"]', '[data-testid="cam-confirm"]']],
  ['meals-often', ['[data-testid="open-meals"]', '[data-testid="often-0"]']],
  ['water add', ['[data-testid="chip-water"]', '[data-testid="water-add"]']],
  ['water sub', ['[data-testid="chip-water"]', '[data-testid="water-sub"]']],
  ['supps', ['[data-testid="chip-supps"]', '[data-testid="supp-0"]']],
  ['trends', ['[data-testid="chip-trends"]']],
  ['more', ['[data-testid="chip-more"]']],
  ['meal detail + portion', ['[data-testid="meal-0"]', '[data-testid="meal-portion"]']],
  ['meal delete', ['[data-testid="meal-0"]', '[data-testid="meal-delete"]']],
  ['shelf resume (live state)', ['[data-testid="shelf-resume"]'], 'live'],
  ['undo after delete', ['[data-testid="meal-0"]', '[data-testid="meal-delete"]', '[data-action="undo"]']]
];

for (const [name, sels, state] of chains) {
  await fresh(state);
  const before = await snap();
  const steps = [];
  for (const sel of sels) {
    const ok = await click(sel);
    await page.waitForTimeout(300);
    const now = await snap();
    steps.push(`${ok ? '' : 'MISSING '}${sel} -> hero:${now.hero} meals:${now.meals} water:${now.water} len:${now.len}`);
  }
  console.log(`\n--- ${name} (state ${state || 'populated'}) before hero:${before.hero} meals:${before.meals} water:${before.water} len:${before.len}`);
  steps.forEach(s => console.log('   ' + s));
}

/* Is there ANY barcode / scan / search / target-editing path? */
await fresh();
const words = await page.evaluate(() => {
  const t = document.body.innerText.toLowerCase();
  const hits = {};
  ['barcode', 'scan', 'search', 'target', 'edit target', 'goal', 'macro', 'not this', 'alternativ'].forEach(w => { hits[w] = t.includes(w); });
  return { hits, inputs: document.querySelectorAll('input,textarea,select').length };
});
console.log('\n=== text probes on populated Fuel ===');
console.log(JSON.stringify(words));

/* all states: what's in each */
for (const st of ['populated', 'live', 'first-weeks', 'hidden', 'empty', 'loading', 'error']) {
  await fresh(st);
  const s = await snap();
  const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 220));
  console.log(`\n[${st}] len${s.len} hero:${s.hero}\n   ${txt}`);
}

console.log('\nerrors:', errs);
await browser.close();
