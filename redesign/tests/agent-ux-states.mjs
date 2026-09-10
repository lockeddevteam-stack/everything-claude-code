import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const SHOT = '/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/states';
fs.mkdirSync(SHOT, {recursive:true});
const recon = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/recon.json','utf8'));
const only = process.argv[2];
const themes = (process.argv[3]||'dark,light').split(',');
const br = await chromium.launch();
for (const [s, info] of Object.entries(recon)) {
  if (only && s !== only) continue;
  const states = info.states.length ? info.states : ['default'];
  for (const theme of themes) {
    const page = await br.newPage({ viewport: { width: 393, height: 852 } });
    await page.addInitScript(t => { try{localStorage.setItem('lk_theme',t)}catch(e){} }, theme);
    await page.goto(pathToFileURL(path.join(BUILD, s+'.html')).href);
    await page.waitForFunction(() => window.__ready === true, null, {timeout:2500}).catch(()=>{});
    await page.waitForTimeout(400);
    for (const st of states) {
      if (st !== 'default') {
        await page.evaluate(x => {
          const b = document.querySelector(`.dev__item[data-state="${x}"]`);
          if (b) b.click();
        }, st);
        await page.waitForTimeout(600);
        // close dev menu if open
        await page.evaluate(() => { const m=document.querySelector('[data-testid="dev-menu"]'); if(m && getComputedStyle(m).display!=='none' && !m.hidden) { const t=document.querySelector('[data-testid="dev-toggle"]'); }});
      }
      await page.screenshot({ path: path.join(SHOT, `${s}--${theme}--${st}.png`) });
    }
    await page.close();
  }
}
await br.close();
console.log('done');
