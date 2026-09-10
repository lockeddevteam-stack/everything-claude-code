/* Which sheets are tall enough to earn a detent. A sheet whose content
   already fits its resting height has nothing to reveal, and a grabber on
   one is a promise it cannot keep. */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const br = await chromium.launch();
const screens = readFileSync('/tmp/screens.txt', 'utf8').trim().split('\n');
for (const file of screens) {
  const p = await br.newPage({ viewport: { width: 393, height: 852 } });
  await p.goto(pathToFileURL(path.join(BUILD, file)).href);
  await p.waitForTimeout(500);
  /* Press everything once, gathering any sheet each press opens. */
  const seen = new Set();
  const ids = await p.evaluate(() =>
    [...document.querySelectorAll('button:not(.dev__item):not(.dev__toggle)')]
      .map(b => b.dataset.testid).filter(Boolean));
  for (const id of ids.slice(0, 60)) {
    const r = await p.evaluate(async (id) => {
      const b = document.querySelector(`[data-testid="${id}"]`);
      if (!b) return null;
      b.click();
      await new Promise(r => setTimeout(r, 220));
      const s = document.querySelector('.sheet');
      if (!s) return null;
      const body = s.querySelector('.sheet__body');
      const out = {
        id: s.dataset.testid || '(unnamed)',
        h: Math.round(s.getBoundingClientRect().height),
        vh: window.innerHeight,
        overflow: body ? body.scrollHeight - body.clientHeight : 0,
        detents: s.getAttribute('data-detents')
      };
      document.querySelector('.scrim')?.click();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return out;
    }, id).catch(() => null);
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      const pct = (r.h / r.vh * 100).toFixed(0);
      console.log(`${file.padEnd(22)} ${r.id.padEnd(18)} ${String(r.h).padStart(4)}px ${pct}%  overflow=${r.overflow}  detents=${r.detents || '-'}`);
    }
    await p.waitForTimeout(60);
  }
  await p.close();
}
await br.close();
