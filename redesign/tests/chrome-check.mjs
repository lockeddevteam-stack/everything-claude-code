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

/* A detent that only exists in an attribute is not a detent. This drags the
   grabber with a real pointer and checks the sheet settles on the next
   detent up, not wherever the finger let go. */
const ctx3 = await br.newContext({ viewport: { width: 393, height: 852 } });
const d = await ctx3.newPage();
await d.goto(pathToFileURL('/home/user/everything-claude-code/redesign/08-build/fuel.html').href);
await d.waitForFunction(() => window.__ready === true);
await d.waitForTimeout(300);
await d.evaluate(() => document.querySelector('[data-testid="log-cam"]').click());
await d.waitForTimeout(500);
const h0 = await d.evaluate(() => Math.round(document.querySelector('.sheet').getBoundingClientRect().height));
ok(Math.abs(h0 - 852 * 0.6) < 12, 'a sheet opens on the detent it names', `${h0}px, wanted ${Math.round(852 * 0.6)}`);
ok(await d.evaluate(() => document.querySelector('.sheet__grab')?.getAttribute('data-grabber') === 'true'),
   'a multi-detent sheet shows a grabber');

const box = await d.locator('.sheet__grab').boundingBox();
await d.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await d.mouse.down();
for (let i = 1; i <= 8; i++) { await d.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - i * 25); await d.waitForTimeout(16); }
await d.mouse.up();
await d.waitForTimeout(600);
const h1 = await d.evaluate(() => Math.round(document.querySelector('.sheet').getBoundingClientRect().height));
ok(Math.abs(h1 - 852 * 0.88) < 12, 'dragging up settles on the larger detent', `${h0} -> ${h1}px`);

/* A sheet with one height must not pretend it moves. */
const s1 = await ctx3.newPage();
await s1.goto(pathToFileURL('/home/user/everything-claude-code/redesign/08-build/settings.html').href);
await s1.waitForTimeout(500);
await s1.evaluate(() => document.querySelector('[data-testid="row-unit"], [data-testid^="row-"]')?.click());
await s1.waitForTimeout(400);
const single = await s1.evaluate(() => {
  const sh = document.querySelector('.sheet');
  return sh ? { detents: sh.getAttribute('data-detents'), grab: sh.querySelector('.sheet__grab')?.getAttribute('data-grabber') } : null;
});
if (single) ok(!single.detents && single.grab !== 'true', 'a single-height sheet shows no grabber', JSON.stringify(single));

await br.close();
console.log(fails === 0 ? '\nchrome: all checks passed' : `\nchrome: ${fails} failed`);
process.exit(fails ? 1 : 0);
