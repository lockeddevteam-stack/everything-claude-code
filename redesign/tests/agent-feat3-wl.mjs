/* Workout Log: drive the exercise-sheet actions and check whether the thing
   each one names actually happens. */
import { chromium } from '@playwright/test';
const F = 'file:///home/user/everything-claude-code/redesign/08-build/workout-log.html';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

const list = () => page.evaluate(() => {
  const names = Array.from(document.querySelectorAll('.exc__name')).map(e => e.textContent.trim());
  return { names, count: names.length, body: document.getElementById('body').innerText.replace(/\s+/g, ' ').slice(0, 120) };
});

async function run(label, steps) {
  await page.goto(F);
  await page.waitForTimeout(400);
  const before = await list();
  for (const s of steps) {
    const ok = await page.evaluate(sel => {
      const els = Array.from(document.querySelectorAll(sel)).filter(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; });
      if (!els.length) return false; els[0].click(); return true;
    }, s);
    if (!ok) console.log('   MISSING ' + s);
    await page.waitForTimeout(350);
  }
  const after = await list();
  const toast = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="toast"],.toast');
    return t && t.offsetParent !== null ? t.innerText.replace(/\s+/g, ' ').trim().slice(0, 80) : null;
  });
  console.log(`\n### ${label}`);
  console.log('   exercises before: ' + before.count + '  [' + before.names.join(' | ') + ']');
  console.log('   exercises after : ' + after.count + '  [' + after.names.join(' | ') + ']');
  if (toast) console.log('   TOAST: ' + toast);
}

await run('Swap exercise -> pick a replacement', [
  '[data-testid="exercise-menu-0"]', '[data-testid="exact-swap"]', '[data-act="addex-pick"]'
]);
await run('Make it a superset', ['[data-testid="exercise-menu-0"]', '[data-testid="exact-superset"]']);
await run('Track left & right', ['[data-testid="exercise-menu-0"]', '[data-testid="exact-sides"]']);
await run('Add warm-up sets', ['[data-testid="exercise-menu-0"]', '[data-testid="exact-warmup"]']);
await run('Remove exercise', ['[data-testid="exercise-menu-0"]', '[data-testid="exact-remove"]']);
await run('Discard the workout', ['[data-act="discard"]', '[data-act="discard-confirm"]']);
await run('Finish', ['[data-testid="btn-finish"]']);
await run('Search inside Add exercise', ['[data-act="addex"]', '[data-testid="addex-search"]']);

/* type into the add-exercise search */
await page.goto(F); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('[data-act="addex"]').click());
await page.waitForTimeout(300);
const beforeRows = await page.evaluate(() => document.querySelectorAll('[data-act="addex-pick"]').length);
await page.evaluate(() => {
  const i = document.querySelector('[data-testid="addex-search"]');
  if (!i) return;
  i.focus(); i.value = 'zzzq';
  i.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(400);
const afterRows = await page.evaluate(() => document.querySelectorAll('[data-act="addex-pick"]').length);
console.log(`\n### Add-exercise search field: rows ${beforeRows} -> ${afterRows} after typing "zzzq"`);

console.log('\nerrors:', errs);
await browser.close();
