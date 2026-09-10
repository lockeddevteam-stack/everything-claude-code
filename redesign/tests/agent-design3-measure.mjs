import { chromium } from 'playwright';
import { DIR, OUT, screens } from './agent-design3-lib.mjs';
import fs from 'fs';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const out = {};
for (const f of screens) {
  await p.goto('file://' + DIR + '/' + f);
  await p.waitForTimeout(700);
  out[f] = await p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
    const all = [...document.querySelectorAll('*')].filter(vis);
    const sizes = {};
    for (const e of all) {
      if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const fs2 = Math.round(parseFloat(getComputedStyle(e).fontSize) * 100) / 100;
      sizes[fs2] = (sizes[fs2] || 0) + 1;
    }
    const sp = {};
    for (const e of all) { const s = getComputedStyle(e);
      for (const k of ['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','rowGap','columnGap']) {
        const v = parseFloat(s[k]); if (v > 0) sp[Math.round(v*100)/100] = (sp[Math.round(v*100)/100]||0)+1; } }
    const radii = {}; let cs = 0, csCapsule = 0, shared = 0; const sharedEx = [];
    for (const e of all) { const s = getComputedStyle(e); const r = s.borderTopLeftRadius;
      if (r && r !== '0px') { radii[r] = (radii[r]||0)+1;
        const pe = e.parentElement; const pr = pe ? getComputedStyle(pe).borderTopLeftRadius : null;
        if (pr === r) { shared++; if (sharedEx.length < 6) sharedEx.push(e.className.toString().slice(0,30)+' in '+pe.className.toString().slice(0,30)+' @'+r); } }
      if (s.cornerShape && s.cornerShape !== 'round') { cs++; if (parseFloat(r) > 100) csCapsule++; } }
    const btns = [...document.querySelectorAll('.btn,button,[role=button]')].filter(vis).map(e => {
      const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      return { cls: e.className.toString().slice(0,50), h: Math.round(r.height), w: Math.round(r.width), rad: s.borderTopLeftRadius,
        capsule: parseFloat(s.borderTopLeftRadius) >= r.height/2 - 0.6 }; });
    const glass = all.filter(e => { const s = getComputedStyle(e); return s.backdropFilter && s.backdropFilter !== 'none'; })
      .map(e => ({ cls: e.className.toString().slice(0,40), bf: getComputedStyle(e).backdropFilter }));
    const tb = document.querySelector('.tabbar'); let tabbar = null;
    if (tb) { const r = tb.getBoundingClientRect(); const s = getComputedStyle(tb);
      tabbar = { left: Math.round(r.left), right: Math.round(393-r.right), bottom: Math.round(852-r.bottom), h: Math.round(r.height), w: Math.round(r.width), rad: s.borderTopLeftRadius, bs: s.boxShadow.slice(0,160), bf: s.backdropFilter }; }
    const hdr = document.querySelector('.hdr--large,.hdr'); let header = null;
    if (hdr) { const r = hdr.getBoundingClientRect(); const s = getComputedStyle(hdr);
      header = { cls: hdr.className.toString().slice(0,40), h: Math.round(r.height*10)/10, minH: s.minHeight, align: s.alignItems }; }
    // transitions
    const tr = {};
    for (const e of all) { const s = getComputedStyle(e);
      const ds = s.transitionDuration.split(',').map(x=>x.trim()); const ps = s.transitionProperty.split(',').map(x=>x.trim());
      const fn = s.transitionTimingFunction.split(',').map(x=>x.trim());
      for (let i=0;i<ds.length;i++){ if(ds[i]==='0s') continue; const key = ds[i]+' | '+(ps[i]||ps[0])+' | '+((fn[i]||fn[0]).slice(0,20));
        tr[key]=(tr[key]||0)+1; } }
    // icons
    const svgs = [...document.querySelectorAll('svg')].filter(vis).map(e => {
      const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      return { w: Math.round(r.width), h: Math.round(r.height), sw: s.strokeWidth, cls: e.getAttribute('class')||'' }; });
    // selects, dashed
    const sel = [...document.querySelectorAll('select')].filter(vis).length;
    const dashed = all.filter(e => { const s = getComputedStyle(e); return ['borderTopStyle','borderBottomStyle','borderLeftStyle','borderRightStyle'].some(k=>s[k]==='dashed'); })
      .map(e => e.className.toString().slice(0,40));
    // accent fills / inks
    const parse = c => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
    const sat = c => { const v = parse(c); if (!v||v.length<3) return 0; if (v.length>3&&v[3]<0.15) return 0; return Math.max(v[0],v[1],v[2]) - Math.min(v[0],v[1],v[2]); };
    const fills = [], inks = [];
    for (const e of all) { const s = getComputedStyle(e); const r = e.getBoundingClientRect();
      if (r.width*r.height >= 300 && sat(s.backgroundColor) > 40) fills.push({ cls: e.className.toString().slice(0,40), tag: e.tagName, bg: s.backgroundColor, area: Math.round(r.width*r.height) });
      if ([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()) && sat(s.color) > 40) inks.push({ t: e.textContent.trim().slice(0,20), c: s.color });
      if (e.tagName === 'svg' || e.tagName === 'path' || e.tagName === 'polyline' || e.tagName === 'circle') {
        if (sat(s.stroke||'') > 40 || sat(s.fill||'') > 40) fills.push({ cls: 'SVG:'+(e.getAttribute('class')||e.tagName), tag: e.tagName, bg: 'stroke '+s.stroke+' fill '+s.fill, area: Math.round(r.width*r.height) }); } }
    // dev scaffolding position
    const dev = document.querySelector('.dev__toggle,.dev-open');
    let devPos = null;
    if (dev) { const r = dev.getBoundingClientRect(); devPos = { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), w: Math.round(r.width), tf: getComputedStyle(dev).transform }; }
    // list idiom
    const cards = all.filter(e => e.classList.contains('card')).length;
    return { sizes, sp, radii, cornerShape: cs, csCapsule, shared, sharedEx, btns, glass, tabbar, header, tr, svgs, sel, dashed, fills, inks, devPos, cards,
      cornerSmooth: getComputedStyle(document.documentElement).getPropertyValue('--corner-smooth').trim() };
  });
}
await b.close();
fs.writeFileSync(OUT + '/measure.json', JSON.stringify(out, null, 1));
// summary
for (const [k, v] of Object.entries(out)) {
  console.log('==', k);
  console.log(' sizes', JSON.stringify(v.sizes));
  console.log(' tabbar', JSON.stringify(v.tabbar));
  console.log(' header', JSON.stringify(v.header));
  console.log(' dev', JSON.stringify(v.devPos));
  console.log(' nonCapsuleBtns', v.btns.filter(b=>!b.capsule).map(b=>b.cls+' '+b.w+'x'+b.h+' r'+b.rad).slice(0,10).join(' | '));
  console.log(' fills', JSON.stringify(v.fills));
  console.log(' dashed', JSON.stringify(v.dashed), 'selects', v.sel);
  const sizesSvg = {}; v.svgs.forEach(s=>{const k2=s.w+'x'+s.h+'/'+s.sw; sizesSvg[k2]=(sizesSvg[k2]||0)+1;});
  console.log(' svg', JSON.stringify(sizesSvg));
  console.log(' glass', JSON.stringify(v.glass));
  console.log(' cornerShape', v.cornerShape, 'onCapsules', v.csCapsule, 'smooth', v.cornerSmooth, 'sharedRadius', v.shared, JSON.stringify(v.sharedEx));
}
console.log('\n== ALL TRANSITIONS');
const agg = {};
for (const v of Object.values(out)) for (const [k, n] of Object.entries(v.tr)) agg[k] = (agg[k]||0)+n;
Object.entries(agg).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log(n, k));
console.log('\n== ALL SPACING');
const sp = {};
for (const v of Object.values(out)) for (const [k, n] of Object.entries(v.sp)) sp[k] = (sp[k]||0)+n;
const tot = Object.values(sp).reduce((a,b)=>a+b,0);
const off = Object.entries(sp).filter(([k])=>Number(k)%4!==0);
console.log('total', tot, 'off-grid', off.reduce((a,b)=>a+b[1],0), JSON.stringify(off.sort((a,b)=>b[1]-a[1]).slice(0,12)));
