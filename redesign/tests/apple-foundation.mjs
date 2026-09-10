/* The Apple foundation, asserted by rendering rather than by reading CSS.

   Every check here is something a later wave could quietly undo: a spring
   replaced by an ease, a capsule given a superellipse, glass leaking onto a
   content card, a press that no longer moves. */
import { chromium } from 'playwright';
import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = readdirSync(BUILD).filter(f => f.endsWith('.html')).sort();
const br = await chromium.launch();
let fails = 0;
const ok = (pass, name, detail) => { if (!pass) fails++; console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

const p = await br.newPage({ viewport: { width: 393, height: 852 } });
await p.goto(pathToFileURL(path.join(BUILD, 'home.html')).href);
await p.waitForTimeout(400);

/* --- springs exist and are real springs --- */
const springs = await p.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  for (const n of ['smooth', 'snappy', 'bouncy']) out[n] = cs.getPropertyValue('--spring-' + n).trim();
  return out;
});
for (const [n, v] of Object.entries(springs)) {
  ok(v.startsWith('linear('), `--spring-${n} is a sampled spring`, v.slice(0, 28) + '…');
}
/* The whole point of bounce is overshoot. A curve whose samples never exceed
   1 is an ease wearing a spring's name, which is what this build had before. */
const peak = s => Math.max(...s.replace(/linear\(|\)/g, '').split(',').map(Number));
ok(peak(springs.smooth) <= 1.0001, 'smooth never overshoots', `peak ${peak(springs.smooth)}`);
ok(peak(springs.snappy) > 1, 'snappy overshoots', `peak ${peak(springs.snappy)}`);
ok(peak(springs.bouncy) > peak(springs.snappy), 'bouncy overshoots more than snappy',
   `${peak(springs.bouncy)} vs ${peak(springs.snappy)}`);

ok(await p.evaluate(() => typeof window.LKSpring?.to === 'function'), 'LKSpring solver is loaded');
ok(await p.evaluate(() => {
  /* Rubber-band must compress: pulling 400px past the end of a 800px list
     may not move the content 400px. */
  const r = window.LKSpring.rubberBand(400, 800);
  return r > 0 && r < 400 * 0.75;
}), 'rubber-band compresses overscroll');

/* --- the eleven type roles --- */
const roles = ['large-title','title-1','title-2','title-3','headline','body','callout','subheadline','footnote','caption-1','caption-2'];
const sizes = await p.evaluate(rs => {
  const cs = getComputedStyle(document.documentElement);
  return rs.map(r => [r, cs.getPropertyValue('--type-' + r).trim(), cs.getPropertyValue('--tr-' + r).trim()]);
}, roles);
ok(sizes.every(([, v]) => v), 'all eleven Apple type roles defined',
   sizes.map(([r, v]) => v).join(', '));
ok(sizes.every(([, , t]) => t !== ''), 'every role carries tracking');

/* --- glass is chrome only --- */
let leaks = [];
for (const f of screens) {
  const q = await br.newPage({ viewport: { width: 393, height: 852 } });
  await q.goto(pathToFileURL(path.join(BUILD, f)).href);
  await q.waitForTimeout(350);
  const bad = await q.evaluate(() => {
    const CHROME = ['tabbar', 'hdr', 'sheet', 'dialog', 'toast', 'glass', 'findbar', 'dev__menu', 'scrim', 'rotate', 'pick'];
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      const bf = s.backdropFilter || s.webkitBackdropFilter || 'none';
      if (bf === 'none' || !bf) return;
      const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '');
      if (!CHROME.some(c => cls.includes(c))) out.push(cls || el.tagName);
    });
    return out;
  });
  leaks = leaks.concat(bad.map(b => f + ': ' + b));
  await q.close();
}
ok(leaks.length === 0, 'glass appears only in the chrome layer', leaks.slice(0, 4).join(', ') || '0 leaks');

/* --- press moves --- */
const press = await p.evaluate(() => {
  const b = document.querySelector('.btn');
  if (!b) return null;
  const before = getComputedStyle(b).transform;
  b.classList.add('__probe');
  const st = document.createElement('style');
  st.textContent = '.__probe { transform: scale(0.96); }';
  document.head.appendChild(st);
  const after = getComputedStyle(b).transform;
  st.remove(); b.classList.remove('__probe');
  return { before, after, transition: getComputedStyle(b).transitionProperty };
});
ok(press && press.transition.includes('transform'), 'controls transition transform for the press', press?.transition);

await br.close();
console.log(fails === 0 ? '\nfoundation: all checks passed' : `\nfoundation: ${fails} failed`);
process.exit(fails ? 1 : 0);
