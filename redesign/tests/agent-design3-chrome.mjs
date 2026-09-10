import { chromium } from 'playwright';
import { DIR, OUT } from './agent-design3-lib.mjs';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();

for (const f of ['train.html', 'home.html', 'progress.html', 'exercise-library.html']) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(700);
  const before = await p.evaluate(() => {
    const t = document.querySelector('.tabbar'); const h = document.querySelector('.hdr');
    const tl = document.querySelector('.hdr__title-large'), ts = document.querySelector('.hdr__title-small,.hdr__title');
    const sc = document.querySelector('.screen');
    return { tab: t ? { w: Math.round(t.getBoundingClientRect().width), h: Math.round(t.getBoundingClientRect().height), x: Math.round(t.getBoundingClientRect().left), bottom: Math.round(852 - t.getBoundingClientRect().bottom), min: t.getAttribute('data-minimized') } : null,
      hdrH: h ? Math.round(h.getBoundingClientRect().height * 10) / 10 : null,
      large: tl ? { fs: getComputedStyle(tl).fontSize, op: getComputedStyle(tl).opacity, tf: getComputedStyle(tl).transform } : null,
      small: ts ? { fs: getComputedStyle(ts).fontSize, op: getComputedStyle(ts).opacity } : null,
      screenScrollH: sc ? sc.scrollHeight : null, screenH: sc ? sc.clientHeight : null };
  });
  // real user-ish scroll on the scroll body
  await p.evaluate(() => {
    const body = document.querySelector('.scroll,.screen__body,.body,[data-scroll],.screen') ;
    const target = [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)) || document.querySelector('.screen');
    target.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true }));
    target.scrollTop = 400; target.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await p.waitForTimeout(900);
  const after = await p.evaluate(() => {
    const t = document.querySelector('.tabbar'); const h = document.querySelector('.hdr');
    const tl = document.querySelector('.hdr__title-large'), ts = document.querySelector('.hdr__title-small,.hdr__title');
    const sc = document.querySelector('.screen');
    return { tab: t ? { w: Math.round(t.getBoundingClientRect().width), h: Math.round(t.getBoundingClientRect().height), x: Math.round(t.getBoundingClientRect().left), bottom: Math.round(852 - t.getBoundingClientRect().bottom), min: t.getAttribute('data-minimized') } : null,
      hdrH: h ? Math.round(h.getBoundingClientRect().height * 10) / 10 : null,
      large: tl ? { fs: getComputedStyle(tl).fontSize, op: getComputedStyle(tl).opacity, tf: getComputedStyle(tl).transform } : null,
      small: ts ? { fs: getComputedStyle(ts).fontSize, op: getComputedStyle(ts).opacity } : null,
      screenScrollH: sc ? sc.scrollHeight : null, screenH: sc ? sc.clientHeight : null };
  });
  console.log('==', f);
  console.log(' before', JSON.stringify(before));
  console.log(' after ', JSON.stringify(after));
  await p.screenshot({ path: `${OUT}/scrolled-${f.replace('.html','')}.png` });
}

// reduced motion / reduced transparency / forced colors
for (const [label, opts] of [['reduce-motion', { reducedMotion: 'reduce' }], ['forced-colors', { forcedColors: 'active' }], ['contrast-more', { contrast: 'more' }]]) {
  const c2 = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, ...opts });
  const p2 = await c2.newPage();
  for (const f of ['home.html', 'workout-log.html']) {
    await p2.goto('file://' + DIR + '/' + f);
    await p2.waitForTimeout(700);
    await p2.screenshot({ path: `${OUT}/${label}-${f.replace('.html','')}.png` });
  }
  const r = await p2.evaluate(() => {
    const t = document.querySelector('.tabbar');
    return { tabBf: t ? getComputedStyle(t).backdropFilter : null, tabBg: t ? getComputedStyle(t).backgroundColor : null,
      anyMotion: [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return s.transitionDuration !== '0s' && /transform/.test(s.transitionProperty); }).length };
  });
  console.log('==', label, JSON.stringify(r));
  await c2.close();
}
await b.close();
