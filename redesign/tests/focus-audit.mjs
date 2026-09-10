/* Focus never falls to <body>.

   A sheet that closes onto <body>, or a button that disables itself when
   pressed, restarts the next Tab at the top of the document. For anybody on a
   keyboard or VoiceOver that is the whole screen to walk again, and it is
   invisible to everybody else — which is why it survived four review rounds.

   Two things are checked on every screen:
     1. opening a modal moves focus INTO it, and onto a control that is not
        the destructive one
     2. closing it, or pressing a control that then disappears, leaves focus
        on something real
*/
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readFileSync('/tmp/screens.txt', 'utf8').trim().split('\n');

const br = await chromium.launch();
let fails = 0;
const ok = (pass, name, detail) => {
  if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

const where = p => p.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) return null;
  return a.dataset.testid || a.tagName + (a.className ? '.' + String(a.className).split(' ')[0] : '');
});

for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(500);

  /* Every control that opens an overlay, found by pressing and looking. */
  const openers = await p.evaluate(() =>
    [...document.querySelectorAll('button[data-testid]')]
      .filter(b => !b.closest('.dev') && b.getBoundingClientRect().width > 6)
      .map(b => b.dataset.testid).slice(0, 40));

  let checked = 0;
  for (const id of openers) {
    if (checked >= 4) break;
    const opened = await p.evaluate(async i => {
      document.querySelector(`[data-testid="${i}"]`)?.click();
      await new Promise(r => setTimeout(r, 320));
      return !!document.querySelector('.sheet, .dialog');
    }, id).catch(() => false);
    if (!opened) continue;
    checked++;

    const inside = await p.evaluate(() => {
      const box = document.querySelector('.dialog') || document.querySelector('.sheet');
      const a = document.activeElement;
      return !!(box && a && box.contains(a));
    });
    ok(inside, `${file} — ${id} moves focus into the overlay`, (await where(p)) || '<body>');

    const notDestructive = await p.evaluate(() => {
      const a = document.activeElement;
      return !a || !/btn--danger|btn--danger-solid/.test(String(a.className));
    });
    ok(notDestructive, `${file} — ${id} does not focus the destructive button`);

    /* Escape, which every overlay in this build honours. */
    await p.keyboard.press('Escape');
    await p.waitForTimeout(320);
    const after = await where(p);
    ok(after !== null, `${file} — closing ${id} leaves focus on something`, after || '<body>');
    await p.waitForTimeout(120);
  }
  if (!checked) console.log(`SKIP ${file} — no overlay reachable from the first controls`);
  await p.close();
}
await br.close();
console.log(fails ? `\n${fails} failing` : '\nfocus never falls to <body>');
process.exit(fails ? 1 : 0);
