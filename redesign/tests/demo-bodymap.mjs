/* The body map inside the assembled demo, where every screen lives in its own
   shadow root behind a document/window proxy. A component that works from a
   file on disk can still fail here, so it is driven end to end: open the
   library, switch to the body, tap a muscle, and check the exercises for that
   muscle are what came back. */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';

const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
await p.goto(pathToFileURL('/home/user/everything-claude-code/redesign/10-final/locked-demo.html').href);
await p.waitForTimeout(1200);

/* Navigate the demo's own way, then work inside the visible screen's root. */
await p.evaluate(() => window.DEMO.push('exercise-library'));
await p.waitForTimeout(600);

const root = () => p.evaluateHandle(() =>
  [...document.querySelectorAll('.demo-screen')].find(d => !d.hidden).shadowRoot);

const inRoot = (fn, arg) => p.evaluate(([f, a]) => {
  const r = [...document.querySelectorAll('.demo-screen')].find(d => !d.hidden).shadowRoot;
  return (new Function('root', 'arg', f))(r, a);
}, [fn.toString().slice(fn.toString().indexOf('{') + 1, fn.toString().lastIndexOf('}')), arg]);

console.log('screen:', await p.evaluate(() =>
  [...document.querySelectorAll('.demo-screen')].find(d => !d.hidden).dataset.screen));

await inRoot(function () { root.querySelector('[data-testid="browse-toggle"]').click(); });
await p.waitForTimeout(800);

const shown = await inRoot(function () {
  return !!root.querySelector('[data-testid="bodymap"] .mg--chest');
});
console.log('figure drawn in the demo:', shown);

/* The figure being present is not the figure being drawn. bodymap.js writes
   its hue rules into a <style>, and it used to write them into the top
   document — where a shadow root never sees them, so every muscle fell back
   to an inherited fill and the whole body rendered solid black while this
   test reported it present and clickable. */
const paint = await inRoot(function () {
  const e = root.querySelector('[data-testid="bodymap"] .mg--chest .mg__gnd');
  return {
    fill: e ? getComputedStyle(e).fill : null,
    hues: !!root.querySelector('#lk-anat-hues')
  };
});
const black = !paint.fill || /rgb\(0, ?0, ?0\)|^none$/.test(paint.fill);
console.log('hue stylesheet reached the shadow root:', paint.hues);
console.log('the pectoral is painted:', !black, '-', paint.fill);
if (black || !paint.hues) { console.log('\nFAIL: the body map is not drawn in the demo'); process.exitCode = 1; }

const box = await inRoot(function () {
  const e = root.querySelector('[data-testid="bodymap"] .mg--chest .mg__gnd');
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return [b.x + b.width / 2, b.y + b.height / 2];
});
if (box) { await p.mouse.click(box[0], box[1]); await p.waitForTimeout(700); }

const title = await inRoot(function () {
  const h = root.querySelector('.hdr h1');
  return h ? h.textContent.trim() : null;
});
console.log('after tapping the pectoral, the screen shows:', JSON.stringify(title));
await p.screenshot({ path: '/tmp/demo-map.png' });
console.log('console errors:', errs.length ? errs : 'none');
await br.close();
