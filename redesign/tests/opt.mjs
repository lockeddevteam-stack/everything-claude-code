import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const br = await chromium.launch();
for (const th of ['dark','light']) {
  const ctx = await br.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
  await ctx.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch(e){} }, th);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(pathToFileURL('/home/user/everything-claude-code/redesign/08-build/coach.html').href);
  await p.waitForTimeout(500);
  await p.click('[data-testid="seg-setup"]'); await p.waitForTimeout(500);
  const opts = p.locator('.opt');
  console.log(th, 'opt rows:', await opts.count());
  if (await opts.count()) {
    await opts.first().click(); await p.waitForTimeout(300);
    console.log(th, await p.evaluate(() => {
      const on = document.querySelector('.opt[aria-checked="true"]');
      const off = document.querySelector('.opt[aria-checked="false"]');
      const g = e => e ? [getComputedStyle(e).backgroundColor, getComputedStyle(e.querySelector('.opt__mark')).backgroundColor] : null;
      return { checked: g(on), unchecked: g(off) };
    }));
  }
  await p.screenshot({ path: '/tmp/opt-'+th+'.png' });
  await ctx.close();
}
await br.close();
