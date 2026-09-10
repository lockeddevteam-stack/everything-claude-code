import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const OUT = process.argv[2] || '/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad';
const br = await chromium.launch();
const shots = [
  ['fuel.html', 'populated', 'dark', null],
  ['fuel.html', 'populated', 'light', null],
  ['fuel.html', 'hidden', 'dark', null],
  ['fuel.html', 'first-weeks', 'dark', null],
  ['fuel.html', 'populated', 'dark', 'log-mic'],
  ['fuel.html', 'populated', 'dark', 'log-cam'],
];
for (const [file, state, theme, press] of shots) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch (e) {} }, theme);
  await p.goto(pathToFileURL(path.join(BUILD, file)).href + '?state=' + state);
  await p.waitForFunction(() => window.__ready === true);
  await p.waitForTimeout(400);
  if (press) { await p.evaluate(id => document.querySelector(`[data-testid="${id}"]`).click(), press); await p.waitForTimeout(500); }
  const name = `${file.replace('.html','')}-${state}-${theme}${press ? '-' + press : ''}.png`;
  await p.locator('.phone').screenshot({ path: path.join(OUT, name) });
  console.log(name);
  await ctx.close();
}
await br.close();
