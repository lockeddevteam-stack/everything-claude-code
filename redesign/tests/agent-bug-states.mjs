import { chromium } from 'playwright';
import fs from 'fs';
const DIR = '/home/user/everything-claude-code/redesign/08-build';
const SCREENS = ['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const BAD = /\bNaN\b|\bundefined\b|\[object Object\]|\bnull\b/;
const b = await chromium.launch();
const findings = [];
for (const s of SCREENS) {
  const ctx = await b.newContext({ viewport:{width:402,height:874} });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type().toUpperCase()+': '+m.text()); });
  await p.goto('file://'+DIR+'/'+s+'.html');
  await p.waitForTimeout(300);
  // open dev menu if items not present
  const devT = p.locator('[data-testid="dev-toggle"], #dev-toggle');
  if (await devT.count()) { await devT.first().click(); await p.waitForTimeout(200); }
  const items = await p.$$eval('.dev__item', els => els.map(e => e.dataset.testid || e.dataset.state || e.dataset.preset || e.textContent.trim()));
  if (!items.length) { console.log('==', s, 'NO DEV ITEMS'); await ctx.close(); continue; }
  console.log('==', s, items.length, 'states');
  for (const it of items) {
    errs.length = 0;
    const sel = `.dev__item[data-testid="${it}"]`;
    const has = await p.locator(sel).count();
    if (!has) { console.log('  ?? missing', it); continue; }
    if (await p.locator(sel).count() === 0 || await p.locator(sel).first().isVisible() === false) { const t=p.locator('[data-testid="dev-toggle"], #dev-toggle'); if (await t.count()) await t.first().click(); await p.waitForTimeout(150); }
    await p.locator(sel).first().click({force:true});
    await p.waitForTimeout(450);
    const r = await p.evaluate(() => {
      const scr = document.getElementById('screen') || document.body;
      const txt = scr.innerText;
      const se = document.scrollingElement;
      const empties = [...document.querySelectorAll('ul,ol,.list,[data-list]')].filter(l=>l.children.length===0).map(l=>l.className||l.tagName);
      return { txt, overflow: se.scrollWidth>se.clientWidth ? se.scrollWidth+'>'+se.clientWidth : null, empties,
        state: scr.getAttribute('data-state'), h: scr.innerHTML.length };
    });
    const badm = r.txt.match(BAD);
    let ariaOk = 'MISSING-ELEMENT';
    try { ariaOk = await p.$eval(sel, e => e.getAttribute('aria-pressed')); } catch (e) {}
    const line = [];
    if (errs.length) line.push('ERR:'+errs.join(' | ').slice(0,400));
    if (badm) { const i=r.txt.search(BAD); line.push('BADTEXT:"'+r.txt.slice(Math.max(0,i-60), i+60).replace(/\n/g,'\\n')+'"'); }
    if (r.overflow) line.push('OVERFLOW:'+r.overflow);
    if (r.empties.length) line.push('EMPTYLIST:'+r.empties.slice(0,4).join(','));
    if (ariaOk !== 'true') line.push('ARIA-PRESSED not set to true after click (got '+ariaOk+')');
    if (line.length) { console.log('  !', it, line.join(' || ')); findings.push({screen:s,state:it,line}); }
  }
  await ctx.close();
}
fs.writeFileSync('/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/states.json', JSON.stringify(findings,null,1));
await b.close();
