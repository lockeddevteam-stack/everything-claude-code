import { chromium } from 'playwright';
import { DIR } from './agent-design3-lib.mjs';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const READ = `() => {
  const h = document.querySelector('.hdr--large');
  const tl = document.querySelector('.hdr--large .hdr__title-large');
  const ts = document.querySelector('.hdr--large .hdr__title-small');
  const t = document.querySelector('.tabbar');
  return { hdrH: h ? Math.round(h.getBoundingClientRect().height*10)/10 : null,
    collapsed: h ? h.getAttribute('data-collapsed') : null,
    edge: h ? h.getAttribute('data-edge') : null,
    large: tl ? { fs: getComputedStyle(tl).fontSize, w: getComputedStyle(tl).fontWeight, op: getComputedStyle(tl).opacity, tf: getComputedStyle(tl).transform } : null,
    small: ts ? { fs: getComputedStyle(ts).fontSize, w: getComputedStyle(ts).fontWeight, op: getComputedStyle(ts).opacity, align: getComputedStyle(ts).justifyContent } : null,
    tabW: t ? Math.round(t.getBoundingClientRect().width) : null };
}`;
for (const f of ['train.html', 'progress.html', 'fuel.html', 'exercise-library.html', 'home.html']) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(700);
  console.log('==', f, 'rest ', JSON.stringify(await p.evaluate(`(${READ})()`)));
  for (const top of [20, 60, 120, 400]) {
    await p.evaluate(y => {
      const target = [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY));
      if (!target) return;
      target.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
      target.scrollTop = y; target.dispatchEvent(new Event('scroll', { bubbles: true }));
    }, top);
    await p.waitForTimeout(700);
    console.log('   top', top, JSON.stringify(await p.evaluate(`(${READ})()`)));
  }
}
await b.close();
