import { chromium } from 'playwright';
import fs from 'fs';
const DIR = '/home/user/everything-claude-code/redesign/08-build';
const SCREENS = ['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
const b = await chromium.launch();
const out = {};
for (const s of SCREENS) {
  const ctx = await b.newContext({ viewport:{width:402,height:874}, deviceScaleFactor:3 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type().toUpperCase()+': '+m.text()); });
  await p.goto('file://'+DIR+'/'+s+'.html');
  await p.waitForTimeout(600);
  const info = await p.evaluate(() => {
    const dev = [...document.querySelectorAll('.dev__item')].map(e => ({ state: e.dataset.state, preset: e.dataset.preset, tid: e.dataset.testid, label: e.textContent.trim() }));
    const tids = [...document.querySelectorAll('[data-testid]')].map(e => ({ tid: e.dataset.testid, tag: e.tagName, dis: e.disabled||false }));
    return { dev, tids, sw: document.scrollingElement.scrollWidth, cw: document.scrollingElement.clientWidth };
  });
  out[s] = { errs, ...info };
  console.log('==', s, 'errs', errs.length, 'dev', info.dev.length, 'tids', info.tids.length, 'overflow', info.sw>info.cw?info.sw+'>'+info.cw:'no');
  errs.forEach(e=>console.log('   ', e.slice(0,300)));
  await ctx.close();
}
fs.writeFileSync('/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/recon.json', JSON.stringify(out,null,1));
await b.close();
