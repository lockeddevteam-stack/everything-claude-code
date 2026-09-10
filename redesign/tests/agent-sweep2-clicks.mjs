import { chromium } from 'playwright';
import fs from 'fs';
const DIR = 'file:///home/user/everything-claude-code/redesign/08-build/';
const ALL = ['workout-log','coach','exercise-library','shopping','onboarding','split-builder','settings','review','train','progress','fuel','profile','home'];
const SCREENS = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const OUTJ = '/home/user/everything-claude-code/redesign/tests/agent-sweep2-clicks.json';
const out = [];
const DEVSEL = '[data-testid="dev-toggle"], #dev-toggle, #devToggle';

async function openDev(p){
  const vis = await p.locator('.dev__item').first().isVisible().catch(()=>false);
  if (!vis) { const t=p.locator(DEVSEL); if (await t.count()) { await t.first().click({timeout:1500}).catch(()=>{}); await p.waitForTimeout(90); } }
}
async function setState(p, st){
  if (!st) return;
  await openDev(p);
  await p.locator(`.dev__item[data-testid="${st}"]`).first().dispatchEvent('click',{},{timeout:1500}).catch(()=>{});
  await p.waitForTimeout(220);
  if (await p.locator('.dev__item').first().isVisible().catch(()=>false)) { const t=p.locator(DEVSEL); if (await t.count()) { await t.first().click({timeout:1500}).catch(()=>{}); await p.waitForTimeout(60); } }
}
const SNAP = `(() => {
  const se = document.scrollingElement;
  const h = document.body.innerHTML;
  let x = 5381; for (let i=0;i<h.length;i++) x = ((x*33) ^ h.charCodeAt(i)) >>> 0;
  const t = document.body.innerText;
  const bad = t.match(/\\bNaN\\b|\\bundefined\\b|\\[object Object\\]/);
  return { hash: h.length+':'+x, url: location.href,
    active: document.activeElement ? (document.activeElement.tagName+'#'+(document.activeElement.dataset?.testid||'')) : 'none',
    ow: se.scrollWidth > se.clientWidth ? se.scrollWidth+'>'+se.clientWidth : null,
    bad: bad ? t.slice(Math.max(0,t.search(/\\bNaN\\b|\\bundefined\\b|\\[object Object\\]/)-60), t.search(/\\bNaN\\b|\\bundefined\\b|\\[object Object\\]/)+60).replace(/\\n/g,' | ') : null,
    dlg: [...document.querySelectorAll('.sheet,[role=dialog],[role=alertdialog],.modal,.dialog,.alert,.popover,.actionsheet')].filter(e=>e.offsetParent!==null).map(e=>(e.dataset.testid||e.className)) };
})()`;
const snap = p => p.evaluate(SNAP);

async function doScreen(ctx, s) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type().toUpperCase()+': '+m.text()); });
  await p.goto(DIR+s+'.html'); await p.waitForTimeout(150);
  await openDev(p);
  let states = await p.$$eval('.dev__item', els => els.map(e=>e.dataset.testid));
  if (!states.length) states = [null];
  for (const st of states) {
    const t0 = Date.now();
    await p.goto(DIR+s+'.html'); await p.waitForTimeout(100); await setState(p, st);
    const tids = await p.$$eval('[data-testid]', els => els.filter(e => {
      if (/^dev-/.test(e.dataset.testid)) return false;
      const t=e.tagName;
      const inter = t==='BUTTON'||t==='A'||t==='INPUT'||t==='SELECT'||t==='LABEL'||e.hasAttribute('tabindex')||['button','tab','switch','checkbox','radio','menuitem','link','option'].includes(e.getAttribute('role'));
      return inter && e.offsetParent !== null;
    }).map(e=>e.dataset.testid));
    const uniq = [...new Set(tids)];
    for (const tid of uniq) {
      await p.goto(DIR+s+'.html'); await p.waitForTimeout(90); await setState(p, st);
      const sel = `[data-testid="${tid}"]`;
      const loc = p.locator(sel).first();
      if (!(await loc.count()) || !(await loc.isVisible().catch(()=>false))) continue;
      const before = await p.evaluate(([S,sel])=>{ const r=eval(S); const e=document.querySelector(sel);
        r.aria = e?{exp:e.getAttribute('aria-expanded'),pr:e.getAttribute('aria-pressed'),sel:e.getAttribute('aria-selected'),ch:e.getAttribute('aria-checked')}:null; return r; }, [SNAP, sel]);
      errs.length = 0;
      try { await loc.click({ timeout: 1500 }); }
      catch (err) { out.push({s,st,tid,kind:'CLICK-BLOCKED',info:String(err).split('\n')[0].slice(0,120)}); continue; }
      await p.waitForTimeout(260);
      const after = await p.evaluate(([S,sel])=>{ const r=eval(S); const e=document.querySelector(sel);
        r.aria = e?{exp:e.getAttribute('aria-expanded'),pr:e.getAttribute('aria-pressed'),sel:e.getAttribute('aria-selected'),ch:e.getAttribute('aria-checked')}:null; return r; }, [SNAP, sel]);
      const rec = {s,st,tid};
      if (errs.length) out.push({...rec,kind:'ERROR',info:errs.join(' | ').slice(0,400)});
      const changed = before.hash !== after.hash || before.url !== after.url;
      if (!changed) out.push({...rec,kind:'NO-OP'});
      if (after.ow && !before.ow) out.push({...rec,kind:'OVERFLOW',info:after.ow});
      if (after.active === 'BODY#' && before.active !== 'BODY#') out.push({...rec,kind:'FOCUS-LOST'});
      if (after.bad && !before.bad) out.push({...rec,kind:'BADTEXT',info:after.bad});
      if (after.aria && before.aria && changed) for (const k of ['exp','pr','sel','ch'])
        if (before.aria[k] !== null && before.aria[k] === after.aria[k]) out.push({...rec,kind:'ARIA-STUCK',info:k+'='+before.aria[k]});
      const newD = after.dlg.filter(d=>!before.dlg.includes(d));
      if (newD.length) {
        await p.keyboard.press('Escape'); await p.waitForTimeout(240);
        let cur = await snap(p);
        const esc = cur.dlg.length < after.dlg.length;
        let scrimC = null, btnC = null;
        if (!esc) {
          const scrim = p.locator('.scrim, .sheet__scrim, .overlay__scrim, [data-testid*="scrim"], [data-scrim]').first();
          if (await scrim.count() && await scrim.isVisible().catch(()=>false)) {
            await scrim.click({position:{x:8,y:8},force:true}).catch(()=>{}); await p.waitForTimeout(240);
            cur = await snap(p); scrimC = cur.dlg.length < after.dlg.length;
          }
          if (scrimC !== true) {
            const cb = p.locator('[data-testid*="close"],[data-testid*="cancel"],[data-testid*="dismiss"],[aria-label^="Close"],[aria-label^="close"]').first();
            if (await cb.count() && await cb.isVisible().catch(()=>false)) { await cb.click({force:true,timeout:1500}).catch(()=>{}); await p.waitForTimeout(240);
              cur = await snap(p); btnC = cur.dlg.length < after.dlg.length; }
          }
        }
        if (!esc && scrimC!==true && btnC!==true) out.push({...rec,kind:'DIALOG-TRAP',info:newD.join(',')+' esc='+esc+' scrim='+scrimC+' closebtn='+btnC});
        else if (!esc) out.push({...rec,kind:'ESC-NOOP',info:newD.join(',')+' scrim='+scrimC+' closebtn='+btnC});
      }
    }
    fs.writeFileSync(OUTJ+'.tmp', JSON.stringify(out,null,1)); fs.renameSync(OUTJ+'.tmp', OUTJ);
    console.error('  '+s+' / '+st+' ('+uniq.length+' tids, '+((Date.now()-t0)/1000|0)+'s) findings '+out.length);
  }
  await p.close();
}

const b = await chromium.launch();
const queue = [...SCREENS];
await Promise.all(Array.from({length:4}, async () => {
  const ctx = await b.newContext({ viewport:{width:393,height:852} });
  while (queue.length) { const s = queue.shift(); try { await doScreen(ctx, s); } catch(e){ console.error('SCREEN FAIL', s, String(e).slice(0,200)); } }
  await ctx.close();
}));
await b.close();
fs.writeFileSync(OUTJ, JSON.stringify(out,null,1));
console.error('ALLDONE');
