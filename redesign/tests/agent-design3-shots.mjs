import { chromium } from 'playwright';
import { DIR, OUT, screens, listStates, pickState } from './agent-design3-lib.mjs';
import fs from 'fs';

const b = await chromium.launch();
const log = {};
for (const theme of ['dark', 'light']) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  for (const f of screens) {
    const name = f.replace('.html', '');
    await p.goto('file://' + DIR + '/' + f);
    await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${name}-${theme}.png` });
    if (theme === 'dark') {
      const st = await listStates(p);
      log[name] = st;
      for (const id of st) {
        await p.goto('file://' + DIR + '/' + f);
        await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
        await p.waitForTimeout(300);
        const ok = await pickState(p, id);
        if (!ok) continue;
        await p.waitForTimeout(600);
        await p.screenshot({ path: `${OUT}/state-${name}-${id}.png` });
      }
    }
  }
  if (errs.length) console.log(theme, 'PAGE ERRORS:', errs.slice(0, 10));
  await ctx.close();
}
await b.close();
fs.writeFileSync(OUT + '/states.json', JSON.stringify(log, null, 1));
console.log(JSON.stringify(log, null, 1));
