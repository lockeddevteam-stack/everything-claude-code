/* Wave 0 baseline: every screen of the assembled demo at 393x852, both themes.
   Taken through the demo's own navigation so what lands is what a person sees,
   inside the shadow-root isolation with the chrome present. */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import { mkdirSync } from 'fs';

const OUT = '/home/user/everything-claude-code/redesign/11-apple/screenshots/before';
const DEMO = pathToFileURL('/home/user/everything-claude-code/redesign/10-final/locked-demo.html').href;
const SCREENS = ['home','train','fuel-placeholder','progress','coach','exercise-library',
                 'split-builder','workout-log','review','settings','onboarding'];
mkdirSync(OUT, { recursive: true });
const br = await chromium.launch();
for (const theme of ['dark','light']) {
  const ctx = await br.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(t => { try { localStorage.setItem('lk_theme', t); } catch (e) {} }, theme);
  const p = await ctx.newPage();
  await p.goto(DEMO); await p.waitForTimeout(1200);
  for (const s of SCREENS) {
    await p.evaluate(id => window.DEMO.screens[id].tab ? window.DEMO.go(window.DEMO.screens[id].tab) : window.DEMO.push(id), s);
    await p.waitForTimeout(550);
    await p.screenshot({ path: `${OUT}/${theme}-${s}.png` });
  }
  await ctx.close();
}
await br.close();
console.log('captured', SCREENS.length * 2, 'frames');
