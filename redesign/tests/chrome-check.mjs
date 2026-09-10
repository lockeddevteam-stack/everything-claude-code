/* The chrome behaviours, driven rather than asserted.

   Content is padded first: a screen whose content fits has nothing to scroll,
   and a collapse that never fires because there was no scroll would read as a
   pass in a weaker test. */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';

const br = await chromium.launch();
let fails = 0;
const ok = (p, n, d) => { if (!p) fails++; console.log((p ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };

const p = await br.newPage({ viewport: { width: 393, height: 852 } });
p.on('pageerror', e => { fails++; console.log('PAGEERROR ' + e.message); });
await p.goto(pathToFileURL('/home/user/everything-claude-code/redesign/08-build/home.html').href);
await p.waitForTimeout(500);

await p.evaluate(() => {
  const b = document.getElementById('body');
  const pad = document.createElement('div');
  pad.style.height = '1200px';
  b.appendChild(pad);
});
await p.waitForTimeout(100);

const read = () => p.evaluate(() => {
  const bar = document.querySelector('.hdr--large');
  const big = document.querySelector('[data-title-large]');
  const small = document.querySelector('[data-title-small]');
  const tabs = document.querySelector('.tabbar');
  return {
    collapsed: bar.getAttribute('data-collapsed'),
    edge: bar.getAttribute('data-edge'),
    big: +getComputedStyle(big).opacity,
    small: +getComputedStyle(small).opacity,
    tabMin: tabs.getAttribute('data-minimized')
  };
});

const scrollTo = async y => {
  await p.evaluate(v => { document.getElementById('body').scrollTop = v; }, y);
  await p.waitForTimeout(180);
};

const rest = await read();
ok(rest.big === 1 && rest.small === 0, 'at rest: large title shown, small hidden', JSON.stringify(rest));
ok(rest.edge === 'false', 'at rest: no scroll edge');

await scrollTo(26);
const half = await read();
ok(half.big < 1 && half.big > 0, 'mid-scroll: large title is partly faded, not switched',
   'opacity ' + half.big.toFixed(2));
ok(half.edge === 'true', 'scroll edge appears once content is behind the bar');

await scrollTo(200);
const done = await read();
ok(done.collapsed === 'true', 'collapsed at full travel');
ok(done.big === 0 && done.small === 1, 'small title has taken over', JSON.stringify(done));
ok(done.tabMin === 'true', 'tab bar minimized scrolling down');

await scrollTo(120);
const back = await read();
ok(back.tabMin === 'false', 'tab bar returns the moment the scroll reverses');

/* Reduced motion keeps the behaviour and drops the travel. */
const ctx2 = await br.newContext({ viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' });
const q = await ctx2.newPage();
await q.goto(pathToFileURL('/home/user/everything-claude-code/redesign/08-build/home.html').href);
await q.waitForTimeout(400);
await q.evaluate(() => { const b = document.getElementById('body'); const d = document.createElement('div'); d.style.height = '1200px'; b.appendChild(d); });
await q.evaluate(() => { document.getElementById('body').scrollTop = 200; });
await q.waitForTimeout(250);
const rm = await q.evaluate(() => ({
  transform: getComputedStyle(document.querySelector('[data-title-large]')).transform,
  small: +getComputedStyle(document.querySelector('[data-title-small]')).opacity
}));
ok(rm.transform === 'none' || rm.transform === 'matrix(1, 0, 0, 1, 0, 0)',
   'reduced motion: the title does not travel', rm.transform);
ok(rm.small === 1, 'reduced motion: the collapse still happens', 'small opacity ' + rm.small);

await br.close();
console.log(fails === 0 ? '\nchrome: all checks passed' : `\nchrome: ${fails} failed`);
process.exit(fails ? 1 : 0);
