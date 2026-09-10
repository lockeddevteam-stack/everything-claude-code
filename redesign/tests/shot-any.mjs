import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const OUT = '/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br = await chromium.launch();
for (const spec of process.argv.slice(2)) {
  // file[?query][#pressTestid][@theme]
  const [rest, theme = 'dark'] = spec.split('@');
  const [urlPart, press] = rest.split('#');
  const [file, query = ''] = urlPart.split('?');
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch (e) {} }, theme);
  await p.goto(pathToFileURL(path.join(BUILD, file)).href + (query ? '?' + query : ''));
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(450);
  if (press) { await p.evaluate(id => document.querySelector(`[data-testid="${id}"]`)?.click(), press); await p.waitForTimeout(550); }
  const name = spec.replace(/[^\w.-]+/g, '_').replace(/\.html/, '') + '.png';
  await p.locator('.phone').screenshot({ path: path.join(OUT, name) });
  console.log(name);
  await ctx.close();
}
await br.close();
