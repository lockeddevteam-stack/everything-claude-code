/* One capture per screen from the assembled demo, at 393x852 and 2x.

   Screens are reached the demo's own way, through window.DEMO, rather than by
   opening each built file: what this captures is what a person actually sees,
   inside the shadow-root isolation and with the demo's chrome present.

   Output lands in /tmp as demo-<screen>.png. Nothing here is a check; the
   checks are in verify-demo.mjs, bodymap-audit.mjs and rerender-sweep.mjs. */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const DEMO = pathToFileURL('/home/user/everything-claude-code/redesign/10-final/locked-demo.html').href;
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
await p.goto(DEMO); await p.waitForTimeout(1200);
const go = async (id) => { await p.evaluate(s => window.DEMO.screens[s].tab ? window.DEMO.go(window.DEMO.screens[s].tab) : window.DEMO.push(s), id); await p.waitForTimeout(600); };
for (const s of ['home','train','coach','progress','exercise-library','split-builder','workout-log','review','settings','onboarding']) {
  await go(s); await p.screenshot({ path: '/tmp/demo-' + s + '.png' });
}
await br.close();
console.log('done');
