import { chromium } from '@playwright/test';
import fs from 'fs';
const BUILD = '/home/user/everything-claude-code/redesign/08-build';
const screens = process.argv.slice(2);

function snapFn() {
  const ls = {}; try { for (let i=0;i<localStorage.length;i++){const k=localStorage.key(i); ls[k]=localStorage.getItem(k);} } catch(e){}
  const h = document.body.innerHTML;
  let x=0; for(let i=0;i<h.length;i++){x=((x<<5)-x+h.charCodeAt(i))|0;}
  const vis = e => { const r=e.getBoundingClientRect(); return r.width>0&&r.height>0; };
  return { len:h.length, hash:x, url:location.href, ls:JSON.stringify(ls),
    acts: [...new Set(Array.from(document.querySelectorAll('[data-action],[data-act]')).filter(vis)
      .map(e=>e.getAttribute('data-action')||e.getAttribute('data-act')))] };
}
function clickFn(a) {
  const vis = e => { const r=e.getBoundingClientRect(); return r.width>0&&r.height>0; };
  const els = Array.from(document.querySelectorAll('[data-action],[data-act]'))
    .filter(e=>(e.getAttribute('data-action')||e.getAttribute('data-act'))===a).filter(vis);
  if(!els.length) return false; els[0].click(); return true;
}
function hasFn(a) {
  const vis = e => { const r=e.getBoundingClientRect(); return r.width>0&&r.height>0; };
  return Array.from(document.querySelectorAll('[data-action],[data-act]'))
    .some(e=>((e.getAttribute('data-action')||e.getAttribute('data-act'))===a)&&vis(e));
}

const results = {};
const browser = await chromium.launch();
for (const s of screens) {
  const page = await browser.newPage({ viewport:{width:390,height:844} });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,160)));
  const url = 'file://' + BUILD + '/' + s;
  const allActs = [...new Set([...fs.readFileSync(BUILD+'/'+s,'utf8').matchAll(/data-act(?:ion)?="([^"]+)"/g)].map(m=>m[1]))]
    .filter(a => !a.includes('+') && !a.includes("'"));
  const load = async () => { await page.goto(url); await page.waitForTimeout(200); };
  await load();
  const base = await page.evaluate(snapFn);
  const rec = {}, openers = {};

  const measure = async (a) => {
    const before = await page.evaluate(snapFn);
    const ok = await page.evaluate(clickFn, a);
    if (!ok) return null;
    await page.waitForTimeout(260);
    const after = await page.evaluate(snapFn);
    return { changed: before.hash!==after.hash || before.url!==after.url || before.ls!==after.ls,
             dlen: after.len-before.len, ls: before.ls!==after.ls, nav: before.url!==after.url,
             newActs: after.acts.filter(x=>!before.acts.includes(x)) };
  };

  for (const a of base.acts) {
    await load();
    const m = await measure(a);
    if (m) { rec[a] = {...m, via:'root'}; for (const nx of m.newActs) if(!openers[nx]) openers[nx]=a; }
  }
  for (const a of allActs) {
    if (rec[a]) continue;
    let done = false;
    const cands = (openers[a] ? [openers[a]] : []).concat(base.acts.filter(o=>o!==openers[a]));
    for (const o of cands) {
      await load();
      await page.evaluate(clickFn, o); await page.waitForTimeout(220);
      if (await page.evaluate(hasFn, a)) { const m = await measure(a); if (m) { rec[a]={...m,via:'after:'+o}; done=true; break; } }
    }
    if (!done) rec[a] = { unreachable:true };
  }
  results[s] = { rec, errs:[...new Set(errs)], allActs, rootActs: base.acts };
  let out = '== '+s+'\n';
  for (const a of allActs) {
    const r = rec[a]||{unreachable:true};
    const tag = r.unreachable ? 'UNREACHABLE' : (r.changed ? 'ok' : 'NO-CHANGE');
    if (tag!=='ok') out += '  '+tag.padEnd(12)+' '+a+'  '+(r.via||'')+'\n';
  }
  if (errs.length) out += '  pageerrors: '+JSON.stringify([...new Set(errs)].slice(0,3))+'\n';
  console.log(out);
  await page.close();
}
fs.writeFileSync('/tmp/acts-'+screens.join('_').replace(/[^a-z]/g,'')+'.json', JSON.stringify(results,null,1));
await browser.close();
