import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const SHOT = '/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const screens = ['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const br = await chromium.launch();
const out = {};
for (const s of screens) {
  const page = await br.newPage({ viewport: { width: 393, height: 852 } });
  const errs = [];
  page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR '+e.message));
  await page.goto(pathToFileURL(path.join(BUILD, s+'.html')).href);
  await page.waitForFunction(() => window.__ready === true, null, {timeout:2500}).catch(()=>{});
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => ({
    states: [...document.querySelectorAll('.dev__item')].map(b=>b.dataset.state).filter(Boolean),
    testids: [...document.querySelectorAll('[data-testid]')].map(e=>e.dataset.testid),
    scrollH: (document.scrollingElement||document.body).scrollHeight,
  }));
  info.errors = errs;
  out[s] = info;
  await page.screenshot({ path: path.join(SHOT, `recon-${s}.png`) });
  await page.close();
}
console.log(JSON.stringify(out, null, 1));
await br.close();
