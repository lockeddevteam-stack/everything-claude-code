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
/* A sheet closing is an animation, and its scrim still swallows clicks
   while it plays. Every step that closes one waits for it to be gone
   rather than racing it. */
const gone = async sel => await p.locator(sel).waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

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
out('svg polyline pts:', await p.locator('[data-testid=sheet-trends] polyline').first().getAttribute('points'));
await p.keyboard.press('Escape');
await gone('[data-testid=sheet-trends]');

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

out('\n== SAY IT OR TYPE IT ==');
await p.click('[data-testid=log-type]');
out('initial:', (await txt('[data-testid=sheet-mic]')).slice(0, 400).replace(/\n/g, ' | '));
await p.fill('[data-testid=mic-text]', 'zzz');
await p.waitForTimeout(2200);
out('nothing readable:', (await txt('[data-testid=sheet-mic]')).replace(/\n/g, ' | '));
await p.fill('[data-testid=mic-text]', '150 g skyr');
await p.waitForTimeout(2200);
out('after a sentence:', (await txt('[data-testid=sheet-mic]')).replace(/\n/g, ' | '));
const beforeEaten = await txt('[data-testid=hero-value]');
await p.click('[data-testid=mic-confirm]');
out('toast:', await txt('[data-testid=toast]'));
out('hero before/after:', beforeEaten, '->', await txt('[data-testid=hero-value]'));
out('macros:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));
out('rows now:', await p.locator('[data-testid^=meal-]').count());

out('\n== MEAL DETAIL / portion / delete ==');
await p.click('[data-testid=meal-1]');
out((await txt('[data-testid=sheet-meal]')).replace(/\n/g, ' | '));
await p.click('[data-testid=meal-edit]');
/* A portion change leaves the sheet open, which is right -- you often
   make two of them -- so the script closes it rather than assuming. */
await p.keyboard.press('Escape');
await gone('[data-testid=sheet-meal]');
out('after x0.8 toast:', await txt('[data-testid=toast]'));
out('hero:', await txt('[data-testid=hero-value]'), 'macros:', (await txt('[data-testid=macros]')).replace(/\n/g, ' | '));
await p.click('[data-testid=meal-1]');
await p.click('[data-testid=meal-swap]');
await p.keyboard.press('Escape');
await gone('[data-testid=sheet-meal]');
out('after x1.25:', await txt('[data-testid=toast]'), 'hero', await txt('[data-testid=hero-value]'));
await p.click('[data-testid=meal-1]');
await p.click('[data-testid=meal-delete]');
await gone('[data-testid=sheet-meal]');
out('delete toast:', await txt('[data-testid=toast]'), 'hero', await txt('[data-testid=hero-value]'));
out('undo present:', await has('[data-testid=undo]'));
await p.click('[data-testid=undo]');
out('after undo hero:', await txt('[data-testid=hero-value]'), 'rows', await p.locator('[data-testid^=meal-]').count());

out('\n== OFTEN/MEALS ==');
/* Meals used to be a sheet off a chip. It is a view of the tab now, behind
   the segmented control at the top, and the choice is remembered -- so this
   reads the view rather than a sheet that no longer exists. */
await p.click('[data-testid=fuel-view-meals]');
out((await txt('[data-testid=often-list]')).replace(/\n/g, ' | '));
const h0 = await txt('[data-testid=hero-value]');
await p.click('[data-testid=meals-often-0]');
out('toast:', await txt('[data-testid=toast]'), 'hero', h0, '->', await txt('[data-testid=hero-value]'));
/* The badge is on the logged row, which is in the Log view -- reading it
   from Meals was reading a list that does not carry badges at all. */
await p.click('[data-testid=fuel-view-log]');
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
out('new-recipe opens the builder:', await has('[data-testid=sheet-build-recipe]'));
await p.keyboard.press('Escape');
await gone('[data-testid=sheet-build-recipe]');

out('\n== PLAN ==');
await p.click('[data-testid=chip-plan]');
const planTxt = (await txt('[data-testid=sheet-plan]'));
out(planTxt.replace(/\n/g, ' | '));
const h2 = await txt('[data-testid=hero-value]');
// Wed is index 2 in PLAN; find a not-logged slot today
await p.click('[data-testid=plan-2-3]');
out('plan-2-3 toast:', await txt('[data-testid=toast]'), 'hero', h2, '->', await txt('[data-testid=hero-value]'));
/* Logging a slot leaves the plan open, which is right -- you log two or
   three in a row -- so the sheet is not reopened, it never closed. */
/* Only today's day is open in the accordion, so Monday has to be
   expanded before any of its slots exist. */
await p.click('[data-testid=plan-day-0]');
await p.click('[data-testid=plan-0-0]');
out('past-day slot toast:', await txt('[data-testid=toast]'));
/* Escape is not what closes this one on a file:// page with no shell
   around it, so the sheet's own close button is used. */
await p.click('[data-testid=plan-close]');
await gone('[data-testid=sheet-plan]');

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
/* The sheet opens on the barcode field. A code has to resolve before
   there is anything to set the servings of -- the script used to start
   at a state two steps in. */
await p.click('[data-testid=scan-try-0]');
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
/* The button reads "Nothing to log yet" until a sentence has been read
   into items, so a sentence goes in first. */
await p.fill('[data-testid=mic-text]', '2 eggs and toast');
const h4 = await txt('[data-testid=hero-value]');
await p.click('[data-testid=mic-confirm]');
out('toast:', await txt('[data-testid=toast]'), 'hero', h4, '->', await txt('[data-testid=hero-value]'));
out('rows:', await p.locator('[data-testid^=meal-]').count());

out('\n== CAM ==');
await p.reload(); await p.waitForFunction(() => window.__ready);
await p.click('[data-testid=log-cam]');
out((await txt('[data-testid=sheet-cam]')).replace(/\n/g, ' | '));
/* The oil chips are gone. The flow is take a photo, wait for the read,
   then the items with their total. */
/* Take a photo is a file input, so a file goes in rather than a click. */
await p.setInputFiles('[data-testid=cam-take]', '/tmp/claude-0/shot.png');
await p.locator('[data-testid=cam-items], [data-testid=cam-none]')
  .first().waitFor({ timeout: 20000 });
/* There is no server behind a file:// page, so the read comes back with
   nothing on the plate. What matters here is that the screen says so and
   refuses to log: a photo that could not be read must not become a meal
   with invented figures. */
out('after the read:', (await txt('[data-testid=cam-items]')).replace(/\n/g, ' | '));
out('says nothing was read:', await has('[data-testid=cam-none]'));
out('and will not log it:',
    await p.locator('[data-testid=cam-confirm]').isDisabled());

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
