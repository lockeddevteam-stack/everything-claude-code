import { chromium } from 'playwright';
import { DIR, OUT } from './agent-design3-lib.mjs';
import fs from 'fs';

// open a sheet by clicking a real trigger on each screen, then measure it
const cases = [
  ['workout-log.html', '.cell'],
  ['workout-log.html', '.partials__btn'],
  ['settings.html', null],           // find a row that opens a sheet
  ['train.html', null],
  ['fuel.html', null],
  ['shopping.html', null],
  ['profile.html', null],
];

const MEAS = `() => {
  const sh = document.querySelector('.sheet, [role=dialog], .overlay .sheet');
  if (!sh) return null;
  const r = sh.getBoundingClientRect(); const s = getComputedStyle(sh);
  const ov = sh.closest('.overlay') || sh.parentElement;
  const os = ov ? getComputedStyle(ov) : null;
  const grab = sh.querySelector('.sheet__grab');
  const gs = grab ? getComputedStyle(grab) : null;
  const scrim = document.querySelector('.scrim,.overlay__scrim,.overlay');
  return {
    cls: sh.className.toString().slice(0,50),
    left: Math.round(r.left), right: Math.round(393-r.right), bottom: Math.round(852-r.bottom),
    h: Math.round(r.height),
    radTL: s.borderTopLeftRadius, radBL: s.borderBottomLeftRadius,
    bg: s.backgroundColor, bf: s.backdropFilter,
    shadow: s.boxShadow.slice(0,90),
    detents: sh.getAttribute('data-detents'),
    grabberAttr: sh.getAttribute('data-grabber') || (grab && grab.getAttribute('data-grabber')),
    grabPainted: gs ? { bg: gs.backgroundColor, w: Math.round(grab.getBoundingClientRect().width), h: Math.round(grab.getBoundingClientRect().height), display: gs.display } : null,
    ariaModal: sh.getAttribute('aria-modal') || (ov && ov.getAttribute('aria-modal')),
    overlayOrigin: os ? os.transformOrigin : null,
    sheetOrigin: s.transformOrigin,
    scrimBg: scrim ? getComputedStyle(scrim).backgroundColor : null,
    anim: s.animation.slice(0,80),
  };
}`;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const results = [];

async function tryOpen(file, sel) {
  await p.goto('file://' + DIR + '/' + file);
  await p.waitForTimeout(600);
  if (sel) {
    const el = await p.$(sel);
    if (!el) return null;
    await el.click({ force: true }).catch(() => {});
  }
  await p.waitForTimeout(600);
  return await p.evaluate(`(${MEAS})()`);
}

for (const [file, sel] of cases) {
  if (sel) {
    const m = await tryOpen(file, sel);
    if (m) { results.push({ file, sel, ...m }); continue; }
  }
  // probe: click every control that looks like it opens a sheet
  await p.goto('file://' + DIR + '/' + file);
  await p.waitForTimeout(600);
  const cands = await p.evaluate(() => [...document.querySelectorAll('button,[role=button],.row')]
    .map((e, i) => ({ i, t: (e.textContent || '').trim().slice(0, 24), cls: e.className.toString().slice(0, 30) })).slice(0, 60));
  for (const c of cands) {
    await p.goto('file://' + DIR + '/' + file);
    await p.waitForTimeout(400);
    await p.evaluate(i => { const e = [...document.querySelectorAll('button,[role=button],.row')][i]; if (e) e.click(); }, c.i);
    await p.waitForTimeout(500);
    const m = await p.evaluate(`(${MEAS})()`);
    if (m) { results.push({ file, trigger: c.t + ' .' + c.cls, ...m }); break; }
  }
}
await b.close();
fs.writeFileSync(OUT + '/sheets.json', JSON.stringify(results, null, 1));
results.forEach(r => console.log(JSON.stringify(r, null, 1)));
