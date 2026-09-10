import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2 })).newPage();
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/home.html');
await p.waitForTimeout(500);
for (const r of ['16px','53px']) {
  await p.evaluate(x => document.documentElement.style.fontSize = x, r);
  await p.waitForTimeout(500);
  console.log(r, JSON.stringify(await p.evaluate(() =>
    [...document.querySelectorAll('.tabbar__item')].map(e => {
      const l = e.querySelector('.tabbar__label'); const q = e.getBoundingClientRect();
      return { name: (e.getAttribute('aria-label') || e.textContent.trim()).slice(0,14),
        w: Math.round(q.width), h: Math.round(q.height), r: Math.round(q.right),
        labelW: l ? Math.round(l.getBoundingClientRect().width*10)/10 : null,
        labelClip: l ? getComputedStyle(l).clipPath || getComputedStyle(l).clip : null }; }))));
}
// AX5 workout-log Finish geometry
await p.goto('file:///home/user/everything-claude-code/redesign/08-build/workout-log.html');
await p.evaluate(() => document.documentElement.style.fontSize = '53px');
await p.waitForTimeout(700);
console.log('workout-log AX5', JSON.stringify(await p.evaluate(() =>
  [...document.querySelectorAll('.btn,.hdr__title,.sess__meta')].map(e => { const q = e.getBoundingClientRect();
    return { t: e.textContent.trim().slice(0,16), l: Math.round(q.left), r: Math.round(q.right), w: Math.round(q.width) }; }).slice(0,8))));
await b.close();
