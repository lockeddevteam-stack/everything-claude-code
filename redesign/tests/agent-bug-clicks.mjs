import { chromium } from 'playwright';
import fs from 'fs';
const DIR = 'file:///home/user/everything-claude-code/redesign/08-build/';
const SCREENS = process.argv[2] ? [process.argv[2]] : ['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const BAD = /\bNaN\b|\bundefined\b|\[object Object\]/;
const SKIP = /^dev-/;
const b = await chromium.launch();
const out = [];

async function openDev(p) {
  const t = p.locator('[data-testid="dev-toggle"], #dev-toggle, #devToggle');
  const vis = await p.locator('.dev__item').first().isVisible().catch(()=>false);
  if (await t.count() && !vis) { await t.first().click(); await p.waitForTimeout(180); }
}
async function setState(p, devTid) {
  if (!devTid) return;
  await openDev(p);
  const sel = `.dev__item[data-testid="${devTid}"]`;
  if (await p.locator(sel).count()) { await p.locator(sel).first().dispatchEvent('click'); await p.waitForTimeout(350); }
  // close dev menu
  const t = p.locator('[data-testid="dev-toggle"], #dev-toggle, #devToggle');
  if (await t.count() && await p.locator('.dev__item').first().isVisible().catch(()=>false)) { await t.first().click().catch(()=>{}); await p.waitForTimeout(120); }
}
const snap = p => p.evaluate(() => ({
  html: document.body.innerHTML.length + ':' + document.body.innerHTML.slice(0,200000).replace(/\s+/g,' '),
  txt: document.body.innerText,
  url: location.href,
  active: document.activeElement ? (document.activeElement.tagName + '#' + (document.activeElement.dataset?.testid || '')) : 'none',
  ow: document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth ? document.scrollingElement.scrollWidth+'>'+document.scrollingElement.clientWidth : null,
  dialogs: [...document.querySelectorAll('.sheet, [role=dialog], .modal, .alert, .scrim, .popover')].filter(e=>e.offsetParent!==null || getComputedStyle(e).display!=='none').map(e=>e.className)
}));

for (const s of SCREENS) {
  const ctx = await b.newContext({ viewport:{width:402,height:874} });
  const page0 = await ctx.newPage();
  await page0.goto(DIR+s+'.html'); await page0.waitForTimeout(300);
  await openDev(page0);
  const states = await page0.$$eval('.dev__item', els => els.map(e=>e.dataset.testid));
  await page0.close();
  const stateList = states.length ? states : [null];
  for (const st of stateList) {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
    p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type().toUpperCase()+': '+m.text()); });
    await p.goto(DIR+s+'.html'); await p.waitForTimeout(250);
    await setState(p, st);
    const tids = await p.$$eval('[data-testid]', els => els.filter(e => {
      if (/^dev-/.test(e.dataset.testid)) return false;
      const t = e.tagName;
      const interactive = t==='BUTTON'||t==='A'||t==='INPUT'||t==='SELECT'||t==='LABEL'||e.hasAttribute('tabindex')||e.getAttribute('role')==='button'||e.getAttribute('role')==='tab'||e.getAttribute('role')==='switch'||e.getAttribute('role')==='checkbox';
      return interactive && e.offsetParent !== null;
    }).map(e=>e.dataset.testid));
    const uniq = [...new Set(tids)];
    for (const tid of uniq) {
      const p2 = await ctx.newPage();
      const e2 = [];
      p2.on('pageerror', e => e2.push('PAGEERROR: '+e.message));
      p2.on('console', m => { if (['error','warning'].includes(m.type())) e2.push(m.type().toUpperCase()+': '+m.text()); });
      await p2.goto(DIR+s+'.html'); await p2.waitForTimeout(220);
      await setState(p2, st);
      const sel = `[data-testid="${tid}"]`;
      const loc = p2.locator(sel).first();
      if (!(await loc.count()) || !(await loc.isVisible().catch(()=>false))) { await p2.close(); continue; }
      const before = await snap(p2);
      const ariaBefore = await loc.evaluate(e => ({exp:e.getAttribute('aria-expanded'),pr:e.getAttribute('aria-pressed'),sel:e.getAttribute('aria-selected'),ch:e.getAttribute('aria-checked'),dis:e.disabled}));
      e2.length = 0;
      try { await loc.click({ timeout: 2500 }); } catch (err) { out.push({s,st,tid,kind:'CLICK-FAIL',info:String(err).slice(0,150)}); await p2.close(); continue; }
      await p2.waitForTimeout(450);
      const after = await snap(p2);
      let ariaAfter = null;
      try { ariaAfter = await p2.locator(sel).first().evaluate(e => ({exp:e.getAttribute('aria-expanded'),pr:e.getAttribute('aria-pressed'),sel:e.getAttribute('aria-selected'),ch:e.getAttribute('aria-checked')})); } catch(e){}
      const rec = {s,st,tid};
      if (e2.length) out.push({...rec,kind:'ERROR',info:e2.join(' | ').slice(0,400)});
      if (before.html === after.html && before.url === after.url) out.push({...rec,kind:'NO-OP'});
      if (!after.ow !== !before.ow && after.ow) out.push({...rec,kind:'OVERFLOW',info:after.ow});
      if (after.active === 'BODY#' && before.active !== 'BODY#') out.push({...rec,kind:'FOCUS-LOST'});
      const bm = after.txt.match(BAD);
      if (bm && !before.txt.match(BAD)) { const i=after.txt.search(BAD); out.push({...rec,kind:'BADTEXT',info:after.txt.slice(Math.max(0,i-70),i+70).replace(/\n/g,' | ')}); }
      if (ariaAfter && ariaBefore) {
        for (const k of ['exp','pr','sel','ch']) {
          if (ariaBefore[k] !== null && ariaBefore[k] === ariaAfter[k] && before.html !== after.html) out.push({...rec,kind:'ARIA-STUCK',info:k+'='+ariaBefore[k]});
        }
      }
      // dialog trap test
      const newDialogs = after.dialogs.filter(d=>!before.dialogs.includes(d));
      if (newDialogs.length) {
        const dh = after.html;
        await p2.keyboard.press('Escape'); await p2.waitForTimeout(350);
        const afterEsc = await snap(p2);
        const escClosed = afterEsc.dialogs.length < after.dialogs.length;
        // reopen path: test scrim + close btn on fresh
        let scrimClosed=null, btnClosed=null;
        const scrim = p2.locator('.scrim, [data-testid*="scrim"], .sheet__scrim, .overlay__scrim').first();
        if (!escClosed && await scrim.count() && await scrim.isVisible().catch(()=>false)) {
          await scrim.click({position:{x:5,y:5},force:true}).catch(()=>{}); await p2.waitForTimeout(350);
          const a3 = await snap(p2); scrimClosed = a3.dialogs.length < after.dialogs.length;
        }
        if (!escClosed && scrimClosed !== true) {
          const cb = p2.locator('[data-testid*="close"], [data-testid*="cancel"], [data-testid*="dismiss"], [aria-label*="Close"], [aria-label*="close"]').first();
          if (await cb.count() && await cb.isVisible().catch(()=>false)) { await cb.click({force:true}).catch(()=>{}); await p2.waitForTimeout(350);
            const a4 = await snap(p2); btnClosed = a4.dialogs.length < after.dialogs.length; }
        }
        if (!escClosed && scrimClosed !== true && btnClosed !== true) out.push({...rec,kind:'DIALOG-TRAP',info:'opened '+newDialogs.join(',')+' esc='+escClosed+' scrim='+scrimClosed+' btn='+btnClosed});
        else if (!escClosed) out.push({...rec,kind:'ESC-NOOP',info:'opened '+newDialogs.join(',')+' (scrim='+scrimClosed+' btn='+btnClosed+')'});
      }
      await p2.close();
    }
    await p.close();
    console.log('  done', s, st, 'tids', uniq.length, 'findings so far', out.length);
  }
  await ctx.close();
}
fs.writeFileSync('/home/user/everything-claude-code/redesign/tests/agent-bug-clicks.json', JSON.stringify(out,null,1));
const by = {};
for (const o of out) { const k=o.kind; (by[k]=by[k]||[]).push(o); }
for (const k of Object.keys(by)) { console.log('\n### '+k+' ('+by[k].length+')'); by[k].slice(0,80).forEach(o=>console.log('  ',o.s,'|',o.st,'|',o.tid, o.info?('| '+o.info):'')); }
await b.close();
