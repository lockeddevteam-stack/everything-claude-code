import { chromium } from '@playwright/test';
import fs from 'fs';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2).length ? process.argv.slice(2)
  : ['coach.html','exercise-library.html','fuel.html','home.html','mockup-bodymap.html','profile.html','progress.html','settings.html','shopping.html','split-builder.html','train.html','workout-log.html'];

const SNAP = `(() => {
  const ls = {}; try { for (let i=0;i<localStorage.length;i++){const k=localStorage.key(i); ls[k]=localStorage.getItem(k);} } catch(e){}
  const h = document.body.innerHTML;
  let x=0; for(let i=0;i<h.length;i++){x=((x<<5)-x+h.charCodeAt(i))|0;}
  return {len:h.length, hash:x, url:location.href, ls:JSON.stringify(ls),
    acts: Array.from(document.querySelectorAll('[data-action],[data-act]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).map(e=>e.getAttribute('data-action')||e.getAttribute('data-act')) };
})()`;

const clickAct = `(a) => { const els = Array.from(document.querySelectorAll('[data-action],[data-act]')).filter(e=>(e.getAttribute('data-action')||e.getAttribute('data-act'))===a).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}); if(!els.length) return false; els[0].click(); return true; }`;

const results = {};
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
for (const s of screens) {
  const page = await browser.newPage({ viewport:{width:390,height:844} });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,200)));
  const url = 'file://' + BUILD + '/' + s;
  const allActs = [...new Set([...fs.readFileSync(BUILD+'/'+s,'utf8').matchAll(/data-act(?:ion)?="([^"]+)"/g)].map(m=>m[1]))]
    .filter(a => !a.includes('+') && !a.includes("'"));
  const load = async () => { await page.goto(url); await page.waitForTimeout(320); };
  await load();
  const base = await page.evaluate(SNAP);
  const rec = {};   // act -> {reached, changed, via}
  const openers = {}; // act -> opener that reveals it

  const measure = async (a) => {
    const before = await page.evaluate(SNAP);
    const ok = await page.evaluate(clickAct, a);
    if (!ok) return null;
    await page.waitForTimeout(400);
    const after = await page.evaluate(SNAP);
    return { changed: before.hash!==after.hash || before.url!==after.url || before.ls!==after.ls,
             dlen: after.len-before.len, ls: before.ls!==after.ls, nav: before.url!==after.url,
             newActs: after.acts.filter(x=>!before.acts.includes(x)) };
  };

  for (const a of base.acts) {
    await load();
    const m = await measure(a);
    if (m) { rec[a] = {...m, via:'root'}; for (const n of m.newActs) if(!openers[n]) openers[n]=a; }
  }
  // depth 2 for unreached
  for (const a of allActs) {
    if (rec[a]) continue;
    const op = openers[a];
    if (op) {
      await load();
      await page.evaluate(clickAct, op); await page.waitForTimeout(350);
      const m = await measure(a);
      if (m) { rec[a] = {...m, via:'after:'+op}; continue; }
    }
    // brute: try each root act as opener
    let done = false;
    for (const o of base.acts) {
      await load();
      await page.evaluate(clickAct, o); await page.waitForTimeout(300);
      const has = await page.evaluate((x)=>Array.from(document.querySelectorAll('[data-action],[data-act]')).some(e=>((e.getAttribute('data-action')||e.getAttribute('data-act'))===x)&&e.getBoundingClientRect().width>0), a);
      if (has) { const m = await measure(a); if (m) { rec[a]={...m,via:'after:'+o}; done=true; break; } }
    }
    if (!done) rec[a] = { unreachable:true };
  }
  results[s] = { rec, errs:[...new Set(errs)], allActs };
  console.log('== '+s);
  for (const a of allActs) {
    const r = rec[a]||{unreachable:true};
    const tag = r.unreachable ? 'UNREACHABLE' : (r.changed ? 'ok' : 'NO-CHANGE');
    if (tag!=='ok') console.log('  '+tag.padEnd(12), a, r.via||'');
  }
  if (errs.length) console.log('  pageerrors:', [...new Set(errs)].slice(0,5));
  await page.close();
}
fs.writeFileSync('/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/actions.json', JSON.stringify(results,null,1));
await browser.close();
