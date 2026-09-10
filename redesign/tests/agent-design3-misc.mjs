import { chromium } from 'playwright';
import { DIR, OUT, screens } from './agent-design3-lib.mjs';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();

console.log('--- autofocus on load');
for (const f of screens) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({ ae: document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className.toString().slice(0,30) : null,
    hasAutofocus: !!document.querySelector('[autofocus]') }));
  if (r.ae !== 'BODY.' || r.hasAutofocus) console.log(' ', f, JSON.stringify(r));
}

console.log('\n--- list idiom: full-bleed rows vs inset cards');
for (const f of screens) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const vis = e => { const b2 = e.getBoundingClientRect(); return b2.width > 0 && b2.height > 0; };
    const rows = [...document.querySelectorAll('.row,.item,.list__row')].filter(vis);
    const inCard = rows.filter(e => e.closest('.card')).length;
    const bleed = rows.filter(e => { const b2 = e.getBoundingClientRect(); return b2.left <= 1 && b2.right >= 392; }).length;
    return { rows: rows.length, inCard, fullBleed: bleed,
      widths: [...new Set(rows.map(e => Math.round(e.getBoundingClientRect().width)))].slice(0, 5) };
  });
  console.log(' ', f, JSON.stringify(r));
}

console.log('\n--- emoji consistency on fuel/shopping');
for (const f of ['fuel.html', 'shopping.html']) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll('*')) {
      const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
      const m = t.match(/\p{Extended_Pictographic}/gu);
      if (m) { const s = getComputedStyle(e); out.push({ g: m.join(''), cls: e.className.toString().slice(0,26), fs: s.fontSize, color: s.color, fam: s.fontFamily.slice(0,40) }); }
    }
    return out;
  });
  console.log(' ', f, JSON.stringify(r));
}

console.log('\n--- glass inventory across all screens');
for (const f of screens) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(500);
  const g = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return s.backdropFilter !== 'none' && e.getBoundingClientRect().width > 0; }).map(e => e.className.toString().slice(0,34)));
  if (g.length) console.log(' ', f, JSON.stringify(g));
}

console.log('\n--- tap targets under 44');
for (const f of screens) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(500);
  const small = await p.evaluate(() => [...document.querySelectorAll('button,a,[role=button],input,select')]
    .filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.height < 43.5 || r.width < 43.5); })
    .map(e => e.className.toString().slice(0,26) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  if (small.length) console.log(' ', f, small.length, JSON.stringify([...new Set(small)].slice(0, 8)));
}
await b.close();
