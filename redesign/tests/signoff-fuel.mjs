import { chromium } from 'playwright';
const URL = 'file:///home/user/everything-claude-code/redesign/08-build/fuel.html';
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 420, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto(URL);
await p.waitForFunction(() => window.__ready);

const out = (...a) => console.log(...a);
const txt = async sel => (await p.locator(sel).first().innerText().catch(() => '(none)'));
const has = async sel => await p.locator(sel).count();

out('== HERO/MACROS populated ==');
out('hero:', await txt('[data-testid=hero]'));
out('macros:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));
out('chips:', (await txt('[data-testid=fuel-chips]')).replace(/\n/g, ' '));
out('today rows:', await p.locator('[data-testid^=meal-]').count());
out('meal-0:', (await txt('[data-testid=meal-0]')).replace(/\n/g, ' | '));
out('closing:', (await txt('[data-testid=meal-closing]')).replace(/\n/g, ' | '));

out('\n== TRENDS ==');
await p.click('[data-testid=chip-trends]');
out((await txt('[data-testid=sheet-trends]')).replace(/\n/g, ' | '));
out('svg polyline pts:', await p.locator('[data-testid=sheet-trends] polyline').getAttribute('points'));
await p.keyboard.press('Escape');

out('\n== WATER ==');
await p.click('[data-testid=chip-water]');
out('before:', await txt('[data-testid=water-value]'));
await p.click('[data-testid=water-add]');
out('after +250:', await txt('[data-testid=water-value]'));
await p.click('[data-testid=water-sub]'); await p.click('[data-testid=water-sub]');
out('after -500:', await txt('[data-testid=water-value]'));
out('sheet text:', (await txt('[data-testid=sheet-water]')).replace(/\n/g, ' | '));
await p.keyboard.press('Escape');

out('\n== SUPPS ==');
await p.click('[data-testid=chip-supps]');
out((await txt('[data-testid=sheet-supps]')).replace(/\n/g, ' | '));
out('supp-0 pressed:', await p.locator('[data-testid=supp-0]').getAttribute('aria-pressed'));
await p.click('[data-testid=supp-0]');
out('supp-0 after tap:', await p.locator('[data-testid=supp-0]').getAttribute('aria-pressed'));
await p.click('[data-testid=supp-0]');
await p.keyboard.press('Escape');

out('\n== SEARCH ==');
await p.click('[data-testid=log-search]');
out('initial:', (await txt('[data-testid=sheet-search]')).slice(0, 400).replace(/\n/g, ' | '));
await p.fill('[data-testid=search-input]', 'chick');
out('after "chick":', (await txt('[data-testid=sheet-search]')).replace(/\n/g, ' | '));
await p.fill('[data-testid=search-input]', 'zzz');
out('no hits:', (await txt('[data-testid=sheet-search]')).replace(/\n/g, ' | '));
await p.fill('[data-testid=search-input]', 'skyr');
const beforeEaten = await txt('[data-testid=hero-value]');
await p.click('[data-testid=search-hit-0]');
out('toast:', await txt('[data-testid=toast]'));
out('hero before/after:', beforeEaten, '->', await txt('[data-testid=hero-value]'));
out('macros:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));
out('rows now:', await p.locator('[data-testid^=meal-]').count());

out('\n== MEAL DETAIL / portion / delete ==');
await p.click('[data-testid=meal-1]');
out((await txt('[data-testid=sheet-meal]')).replace(/\n/g, ' | '));
await p.click('[data-testid=meal-edit]');
out('after x0.8 toast:', await txt('[data-testid=toast]'));
out('hero:', await txt('[data-testid=hero-value]'), 'macros:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));
await p.click('[data-testid=meal-1]');
await p.click('[data-testid=meal-swap]');
out('after x1.25:', await txt('[data-testid=toast]'), 'hero', await txt('[data-testid=hero-value]'));
await p.click('[data-testid=meal-1]');
await p.click('[data-testid=meal-delete]');
out('delete toast:', await txt('[data-testid=toast]'), 'hero', await txt('[data-testid=hero-value]'));
out('undo present:', await has('[data-testid=undo]'));
await p.click('[data-testid=undo]');
out('after undo hero:', await txt('[data-testid=hero-value]'), 'rows', await p.locator('[data-testid^=meal-]').count());

out('\n== OFTEN/MEALS ==');
await p.click('[data-testid=open-meals]');
out((await txt('[data-testid=sheet-meals]')).replace(/\n/g, ' | '));
const h0 = await txt('[data-testid=hero-value]');
await p.click('[data-testid=often-0]');
out('toast:', await txt('[data-testid=toast]'), 'hero', h0, '->', await txt('[data-testid=hero-value]'));
out('last row badge:', await txt('[data-testid^=badge-repeat]'));

out('\n== RECIPES ==');
await p.click('[data-testid=chip-recipes]');
out('list:', (await txt('[data-testid=sheet-recipes]')).replace(/\n/g, ' | '));
await p.click('[data-testid=recipe-0]');
out('detail:', (await txt('[data-testid=sheet-recipe]')).replace(/\n/g, ' | '));
const h1 = await txt('[data-testid=hero-value]');
await p.click('[data-testid=log-recipe]');
out('toast:', await txt('[data-testid=toast]'), 'hero', h1, '->', await txt('[data-testid=hero-value]'));
await p.click('[data-testid=chip-recipes]');
await p.click('[data-testid=recipe-0]');
await p.click('[data-testid=recipe-back]');
out('back to list works:', await has('[data-testid=sheet-recipes]'));
await p.click('[data-testid=new-recipe]');
out('new-recipe toast:', await txt('[data-testid=toast]'));
await p.keyboard.press('Escape');

out('\n== PLAN ==');
await p.click('[data-testid=chip-plan]');
const planTxt = (await txt('[data-testid=sheet-plan]'));
out(planTxt.replace(/\n/g, ' | '));
const h2 = await txt('[data-testid=hero-value]');
// Wed is index 2 in PLAN; find a not-logged slot today
await p.click('[data-testid=plan-2-3]');
out('plan-2-3 toast:', await txt('[data-testid=toast]'), 'hero', h2, '->', await txt('[data-testid=hero-value]'));
await p.click('[data-testid=chip-plan]');
await p.click('[data-testid=plan-0-0]');
out('past-day slot toast:', await txt('[data-testid=toast]'));
await p.keyboard.press('Escape');

out('\n== TARGETS ==');
await p.click('[data-testid=macros]');
out((await txt('[data-testid=sheet-targets]')).replace(/\n/g, ' | '));
await p.fill('[data-testid=tg-kcal]', '100');
await p.click('[data-testid=targets-save]');
out('bad kcal error:', await txt('[data-testid=tg-error]'));
await p.fill('[data-testid=tg-kcal]', '2500');
await p.fill('[data-testid=tg-pro]', '9999');
await p.click('[data-testid=targets-save]');
out('bad pro error:', await txt('[data-testid=tg-error]'));
out('macros unchanged:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));
await p.fill('[data-testid=tg-pro]', '200');
await p.click('[data-testid=targets-save]');
out('saved toast:', await txt('[data-testid=toast]'));
out('hero:', await txt('[data-testid=hero]'), '| macros:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));

out('\n== SCAN ==');
await p.reload(); await p.waitForFunction(() => window.__ready);
await p.click('[data-testid=log-scan]');
out((await txt('[data-testid=sheet-scan]')).replace(/\n/g, ' | '));
await p.fill('[data-testid=scan-servings]', '2');
out('kcal at 2 servings:', await txt('[data-testid=scan-kcal]'));
out('sheet at 2:', (await txt('[data-testid=sheet-scan]')).replace(/\n/g, ' | '));
const h3 = await txt('[data-testid=hero-value]');
await p.click('[data-testid=scan-confirm]');
out('toast:', await txt('[data-testid=toast]'), 'hero', h3, '->', await txt('[data-testid=hero-value]'));
out('macros:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));

out('\n== MIC ==');
await p.reload(); await p.waitForFunction(() => window.__ready);
await p.click('[data-testid=log-mic]');
out((await txt('[data-testid=sheet-mic]')).replace(/\n/g, ' | '));
const h4 = await txt('[data-testid=hero-value]');
await p.click('[data-testid=mic-confirm]');
out('toast:', await txt('[data-testid=toast]'), 'hero', h4, '->', await txt('[data-testid=hero-value]'));
out('rows:', await p.locator('[data-testid^=meal-]').count());

out('\n== CAM ==');
await p.reload(); await p.waitForFunction(() => window.__ready);
await p.click('[data-testid=log-cam]');
out((await txt('[data-testid=sheet-cam]')).replace(/\n/g, ' | '));
await p.click('[data-testid=cam-a1]');
out('after none-oil:', (await txt('[data-testid=sheet-cam]')).replace(/\n/g, ' | '));
await p.click('[data-testid=cam-a3]');
out('after lot-oil:', (await txt('[data-testid=sheet-cam]')).replace(/\n/g, ' | '));
const h5 = await txt('[data-testid=hero-value]');
await p.click('[data-testid=cam-confirm]');
out('toast:', await txt('[data-testid=toast]'), 'hero', h5, '->', await txt('[data-testid=hero-value]'));

out('\n== STATES ==');
for (const st of ['hidden', 'empty', 'first-weeks', 'loading', 'error']) {
  await p.goto(URL + '?state=' + st);
  await p.waitForFunction(() => window.__ready);
  out(st, ':', (await txt('#body')).slice(0, 320).replace(/\n/g, ' | '));
}

out('\n== stack gate ==');
await p.goto(URL); await p.waitForFunction(() => window.__ready);
out('chip-stack before:', await has('[data-testid=chip-stack]'));
await p.evaluate(() => localStorage.setItem('lk_perfTracking', 'true'));
await p.reload(); await p.waitForFunction(() => window.__ready);
out('chip-stack after:', await has('[data-testid=chip-stack]'));
await p.evaluate(() => localStorage.removeItem('lk_perfTracking'));

out('\n== fuelNumbers from settings ==');
await p.evaluate(() => localStorage.setItem('lk_fuelNumbers', 'false'));
await p.reload(); await p.waitForFunction(() => window.__ready);
out('hero:', await txt('[data-testid=hero-value]').catch(() => '-'), '|', (await txt('[data-testid=hero]')).replace(/\n/g, ' '));
out('macros hidden:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));
await p.evaluate(() => localStorage.removeItem('lk_fuelNumbers'));

out('\n== ERRORS ==', errs.length ? errs : 'none');
await br.close();
